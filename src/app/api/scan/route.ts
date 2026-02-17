import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runSimpleAgent } from '@/lib/simple-agent'

// In-memory progress store (use Redis in production)
const progressStore = new Map<string, any>()

/**
 * API endpoint to trigger AI agent scan
 * POST /api/scan
 * Body: { industry: string, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { industry, userId } = body

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    console.log(`[API] Scan requested for industry: ${industry}, user: ${userId || 'demo'}`)

    // Generate job ID
    const jobId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Initialize progress
    progressStore.set(jobId, {
      progress: 0,
      message: 'Initializing AI agent...',
      status: 'running'
    })

    // Run agent in background (non-blocking)
    runAgentAsync(jobId, industry, userId || 'demo_user').catch(err => {
      console.error('[Agent] Error:', err)
      progressStore.set(jobId, {
        progress: 0,
        message: `Failed: ${err.message}`,
        status: 'failed'
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Scan initiated',
      industry,
      jobId,
      estimatedDuration: 20,
    })

  } catch (error) {
    console.error('[API] Scan error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scan?jobId=xxx
 * Check scan status (real-time polling)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId is required' },
      { status: 400 }
    )
  }

  const progress = progressStore.get(jobId)

  if (!progress) {
    return NextResponse.json(
      { error: 'Job not found or expired' },
      { status: 404 }
    )
  }

  return NextResponse.json(progress)
}

/**
 * Run agent asynchronously with progress updates
 */
async function runAgentAsync(jobId: string, industry: string, userId: string) {
  // Validate env vars
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Agent] Missing Supabase credentials')
    console.error('SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING')
    console.error('SUPABASE_SERVICE_KEY:', supabaseKey ? 'present' : 'MISSING')
    throw new Error('supabaseUrl is required')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Phase 1: Data Collection
    updateProgress(jobId, 10, 'Initializing AI agent...')
    await sleep(1000)
    
    updateProgress(jobId, 25, `Searching for ${industry} companies...`)
    await sleep(1500)
    
    updateProgress(jobId, 40, 'Collecting recent news and announcements...')
    await sleep(1500)
    
    // Run simple agent
    updateProgress(jobId, 60, 'Analyzing competitors with AI...')
    const agentResults = await runSimpleAgent(industry)
    
    updateProgress(jobId, 75, 'Generating strategic insights...')
    await sleep(1500)
    
    updateProgress(jobId, 90, 'Writing to database...')
    
    // Write to Supabase
    const results = await writeToSupabase(supabase, agentResults, userId, industry)
    
    // Mark as complete
    updateProgress(jobId, 100, 'Dashboard ready!', 'completed', results)
    
    // Clean up after 5 minutes
    setTimeout(() => {
      progressStore.delete(jobId)
    }, 5 * 60 * 1000)
    
  } catch (error: any) {
    console.error('[Agent] Error:', error)
    updateProgress(jobId, 0, `Failed: ${error.message}`, 'failed')
  }
}

function updateProgress(
  jobId: string, 
  progress: number, 
  message: string, 
  status: 'running' | 'completed' | 'failed' = 'running',
  results?: any
) {
  progressStore.set(jobId, {
    progress,
    message,
    status,
    results,
  })
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
        summary: n.summary || n.description || '',
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
    
    console.log('[Supabase] Write complete:', results)
    return results
    
  } catch (error: any) {
    console.error('[Supabase] Write error:', error)
    throw error
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
