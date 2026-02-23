/**
 * PulseIntel Multi-Step Scan Function
 * Each step runs independently within Netlify's timeout
 * Frontend orchestrates: step1 → step2 → step3 → step4
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY
const POE_KEY = process.env.POE_API_KEY
const DEMO_USER_ID = process.env.DEMO_USER_ID || '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

function parseJsonArray(text: string) {
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      return JSON.parse(match[0].replace(/,(\s*[}\]])/g, '$1'))
    }
    return JSON.parse(text)
  } catch (e) {
    console.error('JSON parse error:', e)
    return []
  }
}

async function supabasePost(table: string, data: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`Supabase POST ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function supabasePatch(table: string, filter: string, data: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${res.status} ${await res.text()}`)
}

async function poeRequest(prompt: string) {
  const res = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${POE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Claude-3.5-Sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

// ========== STEPS ==========

// Step -1: Detect industry from company URL
async function stepDetect(companyUrl: string) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'Business analyst. Respond with valid JSON only. No markdown, no code fences.' },
        { role: 'user', content: `Analyze this company website: ${companyUrl}
Identify the company name and its primary industry.
JSON: {"company_name": "X", "industry": "Y", "description": "1-2 sentence description of what the company does"}
Use one of these industry labels if applicable: Financial Services, Healthcare, Technology, E-commerce, SaaS, Fintech, Cybersecurity, AI/ML, Gaming, EdTech, Real Estate, Logistics, Energy, Retail, Legal Tech, Insurance, Consulting, Manufacturing, Telecommunications, Media & Entertainment, Food & Beverage, Automotive, Aerospace, Biotech, Crypto/Web3.
If none fit perfectly, use the most accurate industry label.` }
      ],
      temperature: 0.2, max_tokens: 500
    })
  })
  const data = await res.json()
  console.log('Detect raw response:', JSON.stringify(data).slice(0, 500))
  
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    console.error('No content in detect response:', JSON.stringify(data).slice(0, 300))
    throw new Error('Failed to detect industry from URL. API returned no content.')
  }
  
  try {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return { 
        company_name: parsed.company_name || 'Unknown',
        industry: parsed.industry || 'Technology',
        description: parsed.description || ''
      }
    }
  } catch (e) {
    console.error('Detect parse error:', e, 'content:', content)
  }
  return { company_name: 'Unknown', industry: 'Technology', description: '' }
}

// Step 0: Create scan record
async function stepInit(industry: string, companyUrl?: string, companyName?: string) {
  const [scan] = await supabasePost('scans', {
    user_id: DEMO_USER_ID,
    industry,
    status: 'running',
    company_url: companyUrl || null,
    company_name: companyName || null
  })
  return { scanId: scan.id }
}

// Step 1: Find competitors via Perplexity
async function stepCompetitors(industry: string, scanId: string, companyUrl?: string) {
  let prompt: string
  
  if (companyUrl) {
    // Targeted scan: find direct competitors of this specific company
    prompt = `I run a company with this website: ${companyUrl}
We operate in the ${industry} industry.

Find our most relevant direct competitors (companies offering similar products/services to similar customers). 
Only include truly relevant competitors — could be 5, 8, or 10 depending on the market. Quality over quantity.

For each competitor provide:
- name
- domain (website)  
- description (1-2 sentences explaining what they do and why they're a competitor)
- position (e.g. "Direct Competitor", "Market Leader", "Emerging Threat", "Niche Player")

JSON array: [{name, domain, description, position}]`
  } else {
    // General industry scan
    prompt = `List the top 10-15 most significant companies in the ${industry} industry (2025-2026). Include market leaders and notable startups. JSON array: [{name, domain, description (1-2 sentences), position}]`
  }

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'Business intelligence analyst specializing in competitive analysis. Respond with valid JSON only. Be selective — only include truly relevant competitors.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, max_tokens: 2000
    })
  })
  const data = await res.json()
  const companies = parseJsonArray(data.choices[0].message.content)
    .filter((c: any) => c.name)
    .slice(0, 15)
  
  return { companies, count: companies.length }
}

// Step 2: Collect news via Perplexity
async function stepNews(industry: string) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'News analyst. Respond with valid JSON only.' },
        { role: 'user', content: `15 most recent ${industry} news stories (last 30 days). JSON array: [{title, summary, source, url, tags}]` }
      ],
      temperature: 0.4, max_tokens: 3000
    })
  })
  const data = await res.json()
  const news = parseJsonArray(data.choices[0].message.content)
    .filter((n: any) => n.title)
    .slice(0, 15)
  
  return { news, count: news.length }
}

// Step 3: Analyze with Claude + write everything to Supabase
async function stepAnalyzeAndWrite(industry: string, scanId: string, companies: any[], news: any[]) {
  // Run all 3 AI analyses in parallel
  const [analyzedContent, insightsContent, alertsContent] = await Promise.all([
    poeRequest(`Analyze ${industry} companies. Each: threat_score(0-10), activity_level(low/medium/high), description, employee_count.
Companies: ${companies.map((c: any) => c.name).join(', ')}
JSON array only: [{"name":"X","threat_score":7.5,"activity_level":"high","description":"Desc","employee_count":500,"industry":"${industry}"}]`),
    
    poeRequest(`3-4 strategic insights for ${industry}.
Companies: ${companies.slice(0,5).map((c: any) => c.name).join(', ')}
News: ${news.slice(0,8).map((n: any) => n.title).join('; ')}
JSON: [{"type":"threat|opportunity|trend|recommendation","title":"X","description":"2-3 sentences","confidence":0.85,"impact":"high","action_items":["X"]}]`),
    
    poeRequest(`5-7 alerts from ${industry} news.
News: ${news.slice(0,12).map((n: any) => n.title).join('; ')}
JSON: [{"title":"X","description":"Context","priority":"critical|attention|info","category":"funding|product|hiring|news|market"}]`)
  ])

  const analyzed = parseJsonArray(analyzedContent)
  const insights = parseJsonArray(insightsContent)
  const alerts = parseJsonArray(alertsContent)

  // Write to Supabase
  const insertedCompetitors = analyzed.length > 0 ? await supabasePost('competitors', 
    analyzed.map((c: any) => ({
      user_id: DEMO_USER_ID, scan_id: scanId,
      name: c.name, domain: companies.find((co: any) => co.name === c.name)?.domain || null,
      industry: c.industry || industry, threat_score: c.threat_score || 5.0,
      activity_level: c.activity_level || 'medium', description: c.description || '',
      employee_count: c.employee_count || null,
      sentiment_score: Math.random() * 0.5 + 0.3,
      last_activity_date: new Date().toISOString()
    }))
  ) : []

  const insertedAlerts = alerts.length > 0 ? await supabasePost('alerts',
    alerts.map((a: any) => ({
      user_id: DEMO_USER_ID, scan_id: scanId,
      competitor_id: insertedCompetitors[0]?.id || null,
      title: a.title, description: a.description,
      priority: a.priority || 'info', category: a.category || 'news', read: false
    }))
  ) : []

  const insertedInsights = insights.length > 0 ? await supabasePost('insights',
    insights.map((i: any) => ({
      user_id: DEMO_USER_ID, scan_id: scanId,
      type: i.type || 'recommendation', title: i.title, description: i.description,
      confidence: i.confidence || 0.7, impact: i.impact || 'medium',
      action_items: i.action_items || []
    }))
  ) : []

  const insertedNews = news.length > 0 ? await supabasePost('news_feed',
    news.map((n: any) => ({
      user_id: DEMO_USER_ID, scan_id: scanId,
      title: n.title, summary: n.summary || n.description,
      source: n.source || 'Perplexity', source_url: n.url || null,
      relevance_score: 0.5, sentiment: 'neutral', tags: n.tags || []
    }))
  ) : []

  // Generate industry analytics via AI
  const analyticsContent = await poeRequest(`Generate market analytics data for the ${industry} industry. Provide realistic estimated data points.
JSON object only:
{
  "market_size_billions": 150,
  "market_size_year": 2025,
  "projected_size_billions": 220,
  "projected_year": 2030,
  "cagr_percent": 8.5,
  "top_segments": [{"name": "Segment A", "share_percent": 35}, {"name": "Segment B", "share_percent": 25}, {"name": "Segment C", "share_percent": 20}, {"name": "Other", "share_percent": 20}],
  "growth_drivers": ["Driver 1", "Driver 2", "Driver 3"],
  "key_trends": [{"trend": "Trend name", "impact": "high|medium|low", "description": "1 sentence"}],
  "funding_activity": {"total_billions": 12, "deal_count": 350, "avg_deal_millions": 34, "yoy_change_percent": 15},
  "market_leaders_share": [{"name": "Company", "share_percent": 15}],
  "regional_distribution": [{"region": "North America", "share_percent": 40}, {"region": "Europe", "share_percent": 25}, {"region": "Asia Pacific", "share_percent": 25}, {"region": "Rest of World", "share_percent": 10}]
}
Use the actual known competitor names from this list where possible: ${analyzed.slice(0,8).map((c: any) => c.name).join(', ')}`)

  let industryAnalytics = null
  try {
    const match = analyticsContent.match(/\{[\s\S]*\}/)
    if (match) {
      industryAnalytics = JSON.parse(match[0].replace(/,(\s*[}\]])/g, '$1'))
    }
  } catch (e) {
    console.error('Analytics parse error:', e)
  }

  // Mark scan as completed
  await supabasePatch('scans', `id=eq.${scanId}`, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    competitors_count: insertedCompetitors.length,
    alerts_count: insertedAlerts.length,
    insights_count: insertedInsights.length,
    news_count: insertedNews.length,
    industry_analytics: industryAnalytics
  })

  return {
    competitors: insertedCompetitors.length,
    alerts: insertedAlerts.length,
    insights: insertedInsights.length,
    news: insertedNews.length
  }
}

// ========== HANDLER ==========

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) }
  }

  try {
    const { step, industry, scanId, companies, news, companyUrl, companyName } = JSON.parse(event.body || '{}')
    
    if (!step) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'step required' }) }
    }

    // detect step doesn't need industry
    if (step !== 'detect' && !industry) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'industry required' }) }
    }

    let result: any

    switch (step) {
      case 'detect':
        if (!companyUrl) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'companyUrl required for detect step' }) }
        }
        result = await stepDetect(companyUrl)
        break
      case 'init':
        result = await stepInit(industry, companyUrl, companyName)
        break
      case 'competitors':
        result = await stepCompetitors(industry, scanId, companyUrl)
        break
      case 'news':
        result = await stepNews(industry)
        break
      case 'analyze':
        if (!scanId || !companies || !news) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId, companies, news required for analyze step' }) }
        }
        result = await stepAnalyzeAndWrite(industry, scanId, companies, news)
        break
      default:
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown step: ${step}` }) }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, step, ...result })
    }

  } catch (error: any) {
    console.error(`Step error:`, error)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: error.message, success: false })
    }
  }
}

export { handler }
