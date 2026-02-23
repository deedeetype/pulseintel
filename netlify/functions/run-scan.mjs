/**
 * PulseIntel Scan - Netlify Background Function
 * Calls Perplexity AI + Poe Claude + writes to Supabase
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY
const POE_KEY = process.env.POE_API_KEY
const DEMO_USER_ID = process.env.DEMO_USER_ID || '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7'

// ========== HELPERS ==========

async function supabaseRequest(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : undefined
    }
  }
  if (body) opts.body = JSON.stringify(body)
  
  // Remove undefined headers
  Object.keys(opts.headers).forEach(k => opts.headers[k] === undefined && delete opts.headers[k])
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${err}`)
  }
  return res.json()
}

function parseJsonArray(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const cleaned = match[0].replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(cleaned)
    }
    return JSON.parse(text)
  } catch (e) {
    console.error('JSON parse error:', e.message)
    return []
  }
}

// ========== PERPLEXITY: COMPETITORS ==========

async function findCompetitors(industry) {
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
        {
          role: 'system',
          content: 'You are a business intelligence analyst. Always respond with valid JSON when requested.'
        },
        {
          role: 'user',
          content: `List the top 15 companies and startups in the ${industry} industry as of 2025-2026.

For each company, provide:
- Company name
- Website domain (e.g., example.com)
- Brief description (1-2 sentences)
- Market position (e.g., "Market Leader", "Rising Startup", "Established Player")

Format your response as a JSON array with keys: name, domain, description, position.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  })
  
  const data = await res.json()
  const content = data.choices[0].message.content
  const companies = parseJsonArray(content)
  
  console.log(`✓ Found ${companies.length} competitors`)
  return companies.filter(c => c.name && c.description).slice(0, 15).map(c => ({
    name: c.name,
    domain: c.domain || null,
    description: (c.description || '').substring(0, 300),
    market_position: c.position || c.market_position || 'Competitor'
  }))
}

// ========== PERPLEXITY: NEWS ==========

async function collectNews(industry) {
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
        {
          role: 'system',
          content: 'You are a news analyst. Always respond with valid JSON when requested. Include source URLs when available.'
        },
        {
          role: 'user',
          content: `Find the 15 most recent and significant news stories in the ${industry} industry (last 30 days).

For each, provide:
- title (headline)
- summary (2-3 sentences)
- source (publication name)
- url (if available)
- tags (2-4 keywords)

Format as JSON array with keys: title, summary, source, url, tags.`
        }
      ],
      temperature: 0.4,
      max_tokens: 3000
    })
  })
  
  const data = await res.json()
  const content = data.choices[0].message.content
  const items = parseJsonArray(content)
  
  console.log(`✓ Collected ${items.length} news items`)
  return items.filter(n => n.title && n.summary).slice(0, 15).map(n => ({
    title: n.title,
    description: n.summary || n.description,
    url: n.url || null,
    source: n.source || 'Perplexity AI',
    tags: Array.isArray(n.tags) ? n.tags : []
  }))
}

// ========== POE CLAUDE: ANALYSIS ==========

async function poeRequest(prompt) {
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

async function analyzeCompetitors(companies, industry) {
  console.log(`🤖 Analyzing competitors...`)
  
  const content = await poeRequest(`You are a competitive intelligence analyst. Analyze these companies in the ${industry} industry.

Companies:
${companies.map((c, i) => `${i + 1}. ${c.name}${c.domain ? ` (${c.domain})` : ''} - ${c.description || ''}`).join('\n')}

For each company, provide threat_score (0-10), activity_level (low/medium/high), description, employee_count estimate.

Return ONLY valid JSON array:
[{"name":"Company","threat_score":8.5,"activity_level":"high","description":"Brief desc","employee_count":500,"industry":"${industry}"}]

Be realistic. Only top competitors get 8+.`)

  const analyzed = parseJsonArray(content)
  console.log(`✓ Analyzed ${analyzed.length} competitors`)
  return analyzed
}

async function generateInsights(competitors, news, industry) {
  console.log(`💡 Generating insights...`)
  
  const topCompetitors = competitors.slice(0, 5)
  
  const content = await poeRequest(`Based on this competitive intelligence for the ${industry} industry, generate 3-4 strategic insights.

Top Competitors:
${topCompetitors.map(c => `- ${c.name} (Threat: ${c.threat_score}/10, Activity: ${c.activity_level})`).join('\n')}

Recent News:
${news.slice(0, 10).map(n => `- ${n.title}`).join('\n')}

Return ONLY valid JSON array:
[{"type":"threat","title":"Title","description":"2-3 sentences","confidence":0.85,"impact":"high","action_items":["Action 1","Action 2"]}]

Types: threat, opportunity, trend, recommendation. Be specific.`)

  const insights = parseJsonArray(content)
  console.log(`✓ Generated ${insights.length} insights`)
  return insights
}

async function generateAlerts(news, competitors) {
  console.log(`🔔 Generating alerts...`)
  
  const content = await poeRequest(`Analyze these news items and create 5-7 alerts.

News:
${news.slice(0, 15).map((n, i) => `${i + 1}. ${n.title}`).join('\n')}

Competitors: ${competitors.map(c => c.name).join(', ')}

Return ONLY valid JSON array:
[{"title":"Alert title","description":"Brief context","priority":"critical","category":"funding"}]

Priority: critical/attention/info. Category: funding/product/hiring/news/market.`)

  const alerts = parseJsonArray(content)
  console.log(`✓ Generated ${alerts.length} alerts`)
  return alerts
}

// ========== MAIN HANDLER ==========

export default async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  // GET = check scan status
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const scanId = url.searchParams.get('scanId')
    
    if (!scanId) {
      return new Response(JSON.stringify({ error: 'scanId required' }), { status: 400, headers: corsHeaders })
    }
    
    const scans = await supabaseRequest(`scans?id=eq.${scanId}&select=*`)
    if (!scans.length) {
      return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: corsHeaders })
    }
    
    return new Response(JSON.stringify(scans[0]), { headers: corsHeaders })
  }

  // POST = start scan
  if (req.method === 'POST') {
    const { industry } = await req.json()
    
    if (!industry) {
      return new Response(JSON.stringify({ error: 'Industry is required' }), { status: 400, headers: corsHeaders })
    }

    console.log(`\n🦝 PulseIntel Scan Starting: ${industry}\n`)
    const startTime = Date.now()

    try {
      // 1. Create scan record
      const [scan] = await supabaseRequest('scans', 'POST', {
        user_id: DEMO_USER_ID,
        industry,
        status: 'running'
      })
      
      const scanId = scan.id
      console.log(`✓ Scan created: ${scanId}`)

      // 2. Phase 1: Data Collection (parallel)
      console.log(`\n📊 PHASE 1: Data Collection\n`)
      const [companies, news] = await Promise.all([
        findCompetitors(industry),
        collectNews(industry)
      ])

      // 3. Phase 2: AI Analysis (parallel)
      console.log(`\n🧠 PHASE 2: AI Analysis\n`)
      const [analyzedCompetitors, insights, alerts] = await Promise.all([
        analyzeCompetitors(companies, industry),
        generateInsights(companies, news, industry),
        generateAlerts(news, companies)
      ])

      // 4. Phase 3: Write to Supabase
      console.log(`\n💾 PHASE 3: Database Write\n`)
      
      // Insert competitors
      const competitorsToInsert = analyzedCompetitors.map(c => ({
        user_id: DEMO_USER_ID,
        scan_id: scanId,
        name: c.name,
        domain: c.domain || companies.find(co => co.name === c.name)?.domain || null,
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
      console.log(`✓ Inserted ${insertedCompetitors.length} competitors`)

      // Insert alerts
      const alertsToInsert = alerts.map(a => ({
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
      console.log(`✓ Inserted ${insertedAlerts.length} alerts`)

      // Insert insights
      const insightsToInsert = insights.map(i => ({
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
      console.log(`✓ Inserted ${insertedInsights.length} insights`)

      // Insert news
      const newsToInsert = news.map(n => ({
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
      console.log(`✓ Inserted ${insertedNews.length} news items`)

      // 5. Update scan as completed
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

      console.log(`\n✨ Scan complete! Duration: ${duration}s\n`)

      return new Response(JSON.stringify({
        success: true,
        scanId,
        industry,
        duration,
        results: {
          competitors: insertedCompetitors.length,
          alerts: insertedAlerts.length,
          insights: insertedInsights.length,
          news: insertedNews.length
        }
      }), { headers: corsHeaders })

    } catch (error) {
      console.error('❌ Scan failed:', error)
      return new Response(JSON.stringify({
        error: error.message,
        success: false
      }), { status: 500, headers: corsHeaders })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
}

export const config = {
  path: '/.netlify/functions/run-scan'
}
