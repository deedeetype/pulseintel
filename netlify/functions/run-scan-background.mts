/**
 * PulseIntel Scan - Netlify Background Function (.mts = background)
 * Calls Perplexity AI + Poe Claude + writes to Supabase
 * Background functions have 15 min timeout
 */

import type { HandlerEvent, HandlerContext, BackgroundHandler } from "@netlify/functions"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY
const POE_KEY = process.env.POE_API_KEY
const DEMO_USER_ID = process.env.DEMO_USER_ID || '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7'

// ========== HELPERS ==========

async function supabaseRequest(path: string, method = 'GET', body: any = null) {
  const opts: any = {
    method,
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {})
    }
  }
  if (body) opts.body = JSON.stringify(body)
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${err}`)
  }
  
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function parseJsonArray(text: string) {
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const cleaned = match[0].replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(cleaned)
    }
    return JSON.parse(text)
  } catch (e: any) {
    console.error('JSON parse error:', e.message)
    return []
  }
}

// ========== PERPLEXITY: COMPETITORS ==========

async function findCompetitors(industry: string) {
  console.log(`🔍 Finding competitors: ${industry}`)
  
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'You are a business intelligence analyst. Always respond with valid JSON when requested.' },
        { role: 'user', content: `List the top 15 companies and startups in the ${industry} industry as of 2025-2026. For each: name, domain (e.g., example.com), description (1-2 sentences), position (Market Leader/Rising Startup/Established Player). Format as JSON array with keys: name, domain, description, position.` }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  })
  
  const data = await res.json()
  const content = data.choices[0].message.content
  const companies = parseJsonArray(content)
  
  console.log(`✓ Found ${companies.length} competitors`)
  return companies.filter((c: any) => c.name && c.description).slice(0, 15).map((c: any) => ({
    name: c.name,
    domain: c.domain || null,
    description: (c.description || '').substring(0, 300),
    market_position: c.position || c.market_position || 'Competitor'
  }))
}

// ========== PERPLEXITY: NEWS ==========

async function collectNews(industry: string) {
  console.log(`📰 Collecting news: ${industry}`)
  
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'You are a news analyst. Always respond with valid JSON. Include source URLs when available.' },
        { role: 'user', content: `Find the 15 most recent news stories in the ${industry} industry (last 30 days). For each: title, summary (2-3 sentences), source, url, tags (2-4 keywords). Format as JSON array with keys: title, summary, source, url, tags.` }
      ],
      temperature: 0.4,
      max_tokens: 3000
    })
  })
  
  const data = await res.json()
  const content = data.choices[0].message.content
  const items = parseJsonArray(content)
  
  console.log(`✓ Collected ${items.length} news items`)
  return items.filter((n: any) => n.title && n.summary).slice(0, 15).map((n: any) => ({
    title: n.title,
    description: n.summary || n.description,
    url: n.url || null,
    source: n.source || 'Perplexity AI',
    tags: Array.isArray(n.tags) ? n.tags : []
  }))
}

// ========== POE CLAUDE: ANALYSIS ==========

async function poeRequest(prompt: string) {
  const res = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Claude-Sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

async function analyzeCompetitors(companies: any[], industry: string) {
  console.log(`🤖 Analyzing competitors...`)
  const content = await poeRequest(`Analyze these ${industry} companies. For each: threat_score (0-10), activity_level (low/medium/high), description, employee_count.

Companies:
${companies.map((c: any, i: number) => `${i + 1}. ${c.name}${c.domain ? ` (${c.domain})` : ''} - ${c.description || ''}`).join('\n')}

Return ONLY valid JSON array: [{"name":"Co","threat_score":8.5,"activity_level":"high","description":"Desc","employee_count":500,"industry":"${industry}"}]
Be realistic. Only top get 8+.`)
  
  const analyzed = parseJsonArray(content)
  console.log(`✓ Analyzed ${analyzed.length} competitors`)
  return analyzed
}

async function generateInsights(competitors: any[], news: any[], industry: string) {
  console.log(`💡 Generating insights...`)
  const content = await poeRequest(`Based on ${industry} intelligence, generate 3-4 strategic insights.

Top Competitors:
${competitors.slice(0, 5).map((c: any) => `- ${c.name} (Threat: ${c.threat_score}/10)`).join('\n')}

News:
${news.slice(0, 10).map((n: any) => `- ${n.title}`).join('\n')}

Return ONLY valid JSON: [{"type":"threat","title":"Title","description":"2-3 sentences","confidence":0.85,"impact":"high","action_items":["Action"]}]
Types: threat/opportunity/trend/recommendation.`)
  
  const insights = parseJsonArray(content)
  console.log(`✓ Generated ${insights.length} insights`)
  return insights
}

async function generateAlerts(news: any[], competitors: any[]) {
  console.log(`🔔 Generating alerts...`)
  const content = await poeRequest(`Create 5-7 alerts from these news items.

News:
${news.slice(0, 15).map((n: any, i: number) => `${i + 1}. ${n.title}`).join('\n')}

Competitors: ${competitors.map((c: any) => c.name).join(', ')}

Return ONLY valid JSON: [{"title":"Alert","description":"Context","priority":"critical","category":"funding"}]
Priority: critical/attention/info. Category: funding/product/hiring/news/market.`)
  
  const alerts = parseJsonArray(content)
  console.log(`✓ Generated ${alerts.length} alerts`)
  return alerts
}

// ========== MAIN HANDLER ==========

const handler: BackgroundHandler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log(`\n🦝 PulseIntel Background Scan Starting...\n`)
  
  const { industry, scanId } = JSON.parse(event.body || '{}')
  
  if (!industry || !scanId) {
    console.error('Missing industry or scanId')
    return
  }
  
  console.log(`Industry: ${industry}`)
  console.log(`Scan ID: ${scanId}`)
  
  const startTime = Date.now()

  try {
    // Update scan to running
    await supabaseRequest(`scans?id=eq.${scanId}`, 'PATCH', { status: 'running' })

    // Phase 1: Data Collection (parallel)
    console.log(`\n📊 PHASE 1: Data Collection\n`)
    const [companies, news] = await Promise.all([
      findCompetitors(industry),
      collectNews(industry)
    ])

    // Phase 2: AI Analysis (parallel)
    console.log(`\n🧠 PHASE 2: AI Analysis\n`)
    const [analyzedCompetitors, insights, alerts] = await Promise.all([
      analyzeCompetitors(companies, industry),
      generateInsights(companies, news, industry),
      generateAlerts(news, companies)
    ])

    // Phase 3: Write to Supabase
    console.log(`\n💾 PHASE 3: Database Write\n`)
    
    const competitorsToInsert = analyzedCompetitors.map((c: any) => ({
      user_id: DEMO_USER_ID,
      scan_id: scanId,
      name: c.name,
      domain: c.domain || companies.find((co: any) => co.name === c.name)?.domain || null,
      industry: c.industry || industry,
      threat_score: c.threat_score || 5.0,
      activity_level: c.activity_level || 'medium',
      description: c.description,
      employee_count: c.employee_count || null,
      sentiment_score: Math.random() * 0.5 + 0.3,
      last_activity_date: new Date().toISOString()
    }))
    
    const insertedCompetitors = competitorsToInsert.length > 0
      ? await supabaseRequest('competitors', 'POST', competitorsToInsert)
      : []
    console.log(`✓ ${insertedCompetitors.length} competitors`)

    const alertsToInsert = alerts.map((a: any) => ({
      user_id: DEMO_USER_ID,
      scan_id: scanId,
      competitor_id: insertedCompetitors[0]?.id || null,
      title: a.title,
      description: a.description,
      priority: a.priority || 'info',
      category: a.category || 'news',
      read: false
    }))
    
    const insertedAlerts = alertsToInsert.length > 0
      ? await supabaseRequest('alerts', 'POST', alertsToInsert)
      : []
    console.log(`✓ ${insertedAlerts.length} alerts`)

    const insightsToInsert = insights.map((i: any) => ({
      user_id: DEMO_USER_ID,
      scan_id: scanId,
      type: i.type || 'recommendation',
      title: i.title,
      description: i.description,
      confidence: i.confidence || 0.7,
      impact: i.impact || 'medium',
      action_items: i.action_items || []
    }))
    
    const insertedInsights = insightsToInsert.length > 0
      ? await supabaseRequest('insights', 'POST', insightsToInsert)
      : []
    console.log(`✓ ${insertedInsights.length} insights`)

    const newsToInsert = news.map((n: any) => ({
      user_id: DEMO_USER_ID,
      scan_id: scanId,
      title: n.title,
      summary: n.description,
      source: n.source,
      source_url: n.url,
      relevance_score: 0.5,
      sentiment: 'neutral',
      tags: n.tags || []
    }))
    
    const insertedNews = newsToInsert.length > 0
      ? await supabaseRequest('news_feed', 'POST', newsToInsert)
      : []
    console.log(`✓ ${insertedNews.length} news items`)

    // Update scan as completed
    const duration = Math.floor((Date.now() - startTime) / 1000)
    
    await supabaseRequest(`scans?id=eq.${scanId}`, 'PATCH', {
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
      competitors_count: insertedCompetitors.length,
      alerts_count: insertedAlerts.length,
      insights_count: insertedInsights.length,
      news_count: insertedNews.length
    })

    console.log(`\n✨ Scan complete! Duration: ${duration}s`)

  } catch (error: any) {
    console.error('❌ Scan failed:', error)
    
    await supabaseRequest(`scans?id=eq.${scanId}`, 'PATCH', {
      status: 'failed',
      error_message: error.message
    }).catch(() => {})
  }
}

export { handler }
