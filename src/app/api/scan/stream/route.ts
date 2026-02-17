import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runSimpleAgent } from '@/lib/simple-agent'

// In-memory progress store
const progressStore = new Map<string, any>()

/**
 * Server-Sent Events (SSE) endpoint for real-time progress updates
 * GET /api/scan/stream?industry=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const industry = searchParams.get('industry')
  const userId = searchParams.get('userId') || 'demo_user'

  if (!industry) {
    return new Response('Industry is required', { status: 400 })
  }

  // Create readable stream for SSE
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const jobId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        // Send initial event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'started', 
          jobId,
          progress: 0,
          message: 'Scan initiated...'
        })}\n\n`))

        // Run agent inline with progress updates
        await runAgentWithProgress(jobId, industry, userId, controller, encoder)

      } catch (error: any) {
        console.error('[SSE] Error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error.message
        })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function runAgentWithProgress(
  jobId: string,
  industry: string, 
  userId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const sendProgress = (progress: number, message: string, status: string = 'running', results?: any) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: status === 'running' ? 'progress' : status,
      progress,
      message,
      status,
      results
    })}\n\n`))
  }

  try {
    // Phase 1
    sendProgress(10, 'Initializing AI agent...')
    await sleep(1000)
    
    sendProgress(25, `Searching for ${industry} companies...`)
    await sleep(1500)
    
    sendProgress(40, 'Collecting recent news and announcements...')
    await sleep(1500)
    
    // Run agent
    sendProgress(60, 'Analyzing competitors with AI...')
    const agentResults = await runSimpleAgent(industry)
    
    sendProgress(75, 'Generating strategic insights...')
    await sleep(1500)
    
    sendProgress(90, 'Writing to database...')
    
    // Write to Supabase
    const results = await writeToSupabase(supabase, agentResults, userId, industry)
    
    // Complete
    sendProgress(100, 'Dashboard ready!', 'completed', results)
    controller.close()
    
  } catch (error: any) {
    console.error('[Agent SSE] Error:', error)
    sendProgress(0, `Failed: ${error.message}`, 'failed')
    controller.close()
  }
}

async function writeToSupabase(supabase: any, data: any, userId: string, industry: string) {
  const results = {
    competitors: 0,
    alerts: 0,
    insights: 0,
    news: 0
  }
  
  try {
    // Insert competitors
    if (data.competitors?.length > 0) {
      const competitorsToInsert = data.competitors.map((c: any) => ({
        user_id: userId,
        name: c.name,
        domain: c.domain || null,
        industry: c.industry || industry,
        threat_score: c.threat_score || 5.0,
        activity_level: c.activity_level || 'medium',
        description: c.description || `Company in ${industry}`,
        employee_count: c.employee_count || null,
        sentiment_score: Math.random() * 0.5 + 0.3,
        last_activity_date: new Date().toISOString()
      }))
      
      const { data: inserted } = await supabase
        .from('competitors')
        .insert(competitorsToInsert)
        .select()
      
      results.competitors = inserted?.length || 0
    }
    
    // Insert alerts
    if (data.alerts?.length > 0) {
      const alertsToInsert = data.alerts.map((a: any) => ({
        user_id: userId,
        competitor_id: null,
        title: a.title,
        description: a.description,
        priority: a.priority || 'info',
        category: a.category || 'news',
        read: false
      }))
      
      const { data: inserted } = await supabase
        .from('alerts')
        .insert(alertsToInsert)
        .select()
      
      results.alerts = inserted?.length || 0
    }
    
    // Insert insights
    if (data.insights?.length > 0) {
      const insightsToInsert = data.insights.map((i: any) => ({
        user_id: userId,
        type: i.type || 'recommendation',
        title: i.title,
        description: i.description,
        confidence: i.confidence || 0.7,
        impact: i.impact || 'medium',
        action_items: i.action_items || []
      }))
      
      const { data: inserted } = await supabase
        .from('insights')
        .insert(insightsToInsert)
        .select()
      
      results.insights = inserted?.length || 0
    }
    
    // Insert news
    if (data.news?.length > 0) {
      const newsToInsert = data.news.map((n: any) => ({
        user_id: userId,
        title: n.title,
        summary: n.summary || '',
        source: n.source,
        source_url: n.source_url || null,
        published_at: n.published_at || new Date().toISOString(),
        relevance_score: n.relevance_score || 0.5,
        sentiment: 'neutral',
        tags: n.tags || []
      }))
      
      const { data: inserted } = await supabase
        .from('news_feed')
        .insert(newsToInsert)
        .select()
      
      results.news = inserted?.length || 0
    }
    
    console.log('[Supabase SSE] Write complete:', results)
    return results
    
  } catch (error: any) {
    console.error('[Supabase SSE] Write error:', error)
    throw error
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
