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
const DEMO_USER_ID = process.env.DEMO_USER_ID || 'demo_user'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

function parseJsonArray(text: string) {
  try {
    // Remove markdown code fences if present
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Extract JSON array
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) {
      // Remove trailing commas before closing brackets
      const fixed = match[0].replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(fixed)
    }
    
    // Try parsing directly
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw text:', text.slice(0, 200))
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
      model: 'Claude-Sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })
  })
  const data = await res.json()
  console.log('Poe response status:', res.status, 'has choices:', !!data?.choices)
  if (!data?.choices?.[0]?.message?.content) {
    console.error('Poe API error:', JSON.stringify(data).slice(0, 500))
    throw new Error(`Poe API error: ${data?.error?.message || data?.detail || res.status}`)
  }
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
Identify the company name and its specific industry/sector.
Be SPECIFIC about the industry — not generic categories. For example:
- "Pulp & Paper" not "Manufacturing"
- "Cloud Computing" not "Technology"  
- "Electric Vehicles" not "Automotive"
- "Digital Payments" not "Fintech"
Use the most precise industry label that describes what this company actually does.
JSON: {"company_name": "X", "industry": "Y", "description": "1-2 sentence description of what the company does"}` }
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
    // Remove markdown code fences if present
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return { 
        company_name: parsed.company_name || 'Unknown',
        industry: parsed.industry || 'Technology',
        description: parsed.description || ''
      }
    }
  } catch (e) {
    console.error('Detect parse error:', e, 'content:', content.slice(0, 300))
  }
  return { company_name: 'Unknown', industry: 'Technology', description: '' }
}

// Step 0: Create scan record OR reuse existing profile (incremental model)
async function stepInit(industry: string, companyUrl?: string, companyName?: string, userId?: string) {
  // Require authentication - no fallback to demo_user
  if (!userId) {
    console.error('[stepInit] No userId provided - authentication required')
    throw new Error('Authentication required. Please log in and try again.')
  }
  
  // Use Clerk ID directly (TEXT, no conversion needed)
  const actualUserId = userId
  
  // Check for existing completed profile with same industry + company_url
  if (companyUrl) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?user_id=eq.${actualUserId}&industry=eq.${encodeURIComponent(industry)}&company_url=eq.${encodeURIComponent(companyUrl)}&status=eq.completed&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    )
    const existingProfiles = await res.json()
    
    if (existingProfiles && existingProfiles.length > 0) {
      // REUSE existing profile - update status and timestamps
      const existingScan = existingProfiles[0]
      await supabasePatch('scans', `id=eq.${existingScan.id}`, {
        status: 'running',
        last_refreshed_at: new Date().toISOString(),
        refresh_count: (existingScan.refresh_count || 0) + 1
      })
      
      return { 
        scanId: existingScan.id, 
        isRefresh: true,
        userId: actualUserId
      }
    }
  }
  
  // Create new profile
  const [scan] = await supabasePost('scans', {
    user_id: actualUserId,
    industry,
    status: 'running',
    company_url: companyUrl || null,
    company_name: companyName || null,
    refresh_count: 0
  })
  
  return { scanId: scan.id, isRefresh: false, userId: actualUserId }
}

// Step 1: Find competitors via Perplexity
async function stepCompetitors(industry: string, scanId: string, companyUrl?: string, maxCompetitors?: number, regions?: string[], watchlist?: string[], userId?: string) {
  const max = maxCompetitors || 15
  const regionStr = regions && regions.length > 0 && !regions.includes('Global') ? ` Focus on companies operating in: ${regions.join(', ')}.` : ''
  const watchlistStr = watchlist && watchlist.length > 0 ? `\n\nIMPORTANT: You MUST include these companies in the results: ${watchlist.join(', ')}.` : ''
  let prompt: string
  
  if (companyUrl) {
    prompt = `I run a company with this website: ${companyUrl}
We operate in the ${industry} industry.

Find our most relevant direct competitors (companies offering similar products/services to similar customers).${regionStr}
Return up to ${max} competitors. Quality over quantity.${watchlistStr}

For each competitor provide:
- name
- domain (website)  
- description (1-2 sentences explaining what they do and why they're a competitor)
- position (e.g. "Direct Competitor", "Market Leader", "Emerging Threat", "Niche Player")

JSON array: [{name, domain, description, position}]`
  } else {
    prompt = `List the top ${max} most significant companies in the ${industry} industry as of 2025-2026.${regionStr} Include market leaders and notable startups. Use current data only.${watchlistStr} JSON array: [{name, domain, description (1-2 sentences), position}]`
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
    .slice(0, max)
  
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
        { role: 'user', content: `15 most recent ${industry} news stories from the last 6 months maximum (prioritize last 30 days). Only include articles published in 2025 or 2026. JSON array: [{title, summary, source, url, tags, published_at}]` }
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

// Step 1.5: Copy competitors from previous scan
async function stepCopyCompetitors(previousScanId: string, newScanId: string) {
  // Fetch competitors from previous scan
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/competitors?scan_id=eq.${previousScanId}`,
    {
      headers: {
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    }
  )
  const previousCompetitors = await res.json()
  
  if (previousCompetitors && previousCompetitors.length > 0) {
    // Copy competitors with new scan_id
    const copiedCompetitors = await supabasePost('competitors',
      previousCompetitors.map((c: any) => ({
        user_id: c.user_id,
        scan_id: newScanId,
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        threat_score: c.threat_score,
        activity_level: c.activity_level,
        description: c.description,
        employee_count: c.employee_count,
        stock_ticker: c.stock_ticker,
        stock_price: c.stock_price,
        stock_currency: c.stock_currency,
        stock_change_percent: c.stock_change_percent,
        sentiment_score: c.sentiment_score,
        last_activity_date: c.last_activity_date
      }))
    )
    return { count: copiedCompetitors.length }
  }
  return { count: 0 }
}

// ========== NEW SPLIT STEPS (replace stepAnalyzeAndWrite) ==========

// Step 3a: Analyze competitors (Poe API ~8s)
async function stepAnalyzeCompetitors(
  industry: string,
  scanId: string,
  companies: any[],
  userId?: string
) {
  if (!userId) {
    throw new Error('Authentication required')
  }
  const actualUserId = userId
  
  console.log(`[ANALYZE-COMPETITORS] Starting for ${companies.length} companies`)
  
  const prompt = `Analyze ${industry} companies. Each: threat_score(0-10), activity_level(low/medium/high), description, employee_count, stock_ticker (if publicly traded, use format like "AAPL", "MSFT", "TSE:RY" for Toronto, "EPA:BNP" for Paris etc. Use null if private).
Companies: ${companies.map((c: any) => c.name).join(', ')}
JSON array only: [{"name":"X","threat_score":7.5,"activity_level":"high","description":"Desc","employee_count":500,"industry":"${industry}","stock_ticker":"AAPL"}]`

  const response = await poeRequest(prompt)
  const analyzed = parseJsonArray(response)
  
  console.log(`[ANALYZE-COMPETITORS] Analyzed ${analyzed.length} competitors`)
  
  return {
    competitors: analyzed.map((c: any) => ({
      ...c,
      domain: companies.find((co: any) => co.name === c.name)?.domain || null
    })),
    count: analyzed.length
  }
}

// Step 3b: Generate insights (Poe API ~8s)
async function stepAnalyzeInsights(
  industry: string,
  scanId: string,
  news: any[],
  competitorNames: string[],
  userId?: string
) {
  if (!userId) {
    throw new Error('Authentication required')
  }
  const actualUserId = userId
  
  console.log(`[ANALYZE-INSIGHTS] Starting for ${industry}`)
  
  const prompt = `3-4 strategic insights for ${industry}.
Companies: ${competitorNames.slice(0,5).join(', ')}
News: ${news.slice(0,8).map((n: any) => n.title).join('; ')}
JSON: [{"type":"threat|opportunity|trend|recommendation","title":"X","description":"2-3 sentences","confidence":0.85,"impact":"high","action_items":["X"]}]`

  const response = await poeRequest(prompt)
  const insights = parseJsonArray(response)
  
  console.log(`[ANALYZE-INSIGHTS] Generated ${insights.length} insights`)
  
  return {
    insights,
    count: insights.length
  }
}

// Step 3c: Generate alerts (Poe API ~8s)
async function stepAnalyzeAlerts(
  industry: string,
  scanId: string,
  news: any[],
  competitorNames: string[],
  userId?: string
) {
  if (!userId) {
    throw new Error('Authentication required')
  }
  const actualUserId = userId
  
  console.log(`[ANALYZE-ALERTS] Starting for ${industry}`)
  
  const prompt = `5-7 alerts from ${industry} news.
Companies: ${competitorNames.slice(0,8).join(', ')}
News: ${news.slice(0,12).map((n: any) => n.title).join('; ')}
JSON: [{"title":"X","description":"Context","priority":"critical|attention|info","category":"funding|product|hiring|news|market"}]`

  const response = await poeRequest(prompt)
  const alerts = parseJsonArray(response)
  
  console.log(`[ANALYZE-ALERTS] Generated ${alerts.length} alerts`)
  
  return {
    alerts,
    count: alerts.length
  }
}

// Step 3d: Finalize - Write all data + generate analytics (~8s)
async function stepFinalize(
  industry: string,
  scanId: string,
  competitors: any[],
  insights: any[],
  alerts: any[],
  news: any[],
  isRefresh: boolean,
  userId?: string
) {
  if (!userId) {
    throw new Error('Authentication required')
  }
  const actualUserId = userId
  
  console.log(`[FINALIZE] Starting for scan ${scanId}`)
  console.log(`[FINALIZE] Data: ${competitors.length} competitors, ${insights.length} insights, ${alerts.length} alerts, ${news.length} news`)
  
  // Write competitors to DB (only if new scan)
  const insertedCompetitors = !isRefresh && competitors.length > 0 ? await supabasePost('competitors',
    competitors.map((c: any) => ({
      user_id: actualUserId,
      scan_id: scanId,
      name: c.name,
      domain: c.domain || null,
      industry: c.industry || industry,
      threat_score: c.threat_score || 5.0,
      activity_level: c.activity_level || 'medium',
      description: c.description || '',
      employee_count: c.employee_count || null,
      stock_ticker: c.stock_ticker || null,
      stock_price: null,
      stock_currency: null,
      stock_change_percent: null,
      sentiment_score: Math.random() * 0.5 + 0.3,
      last_activity_date: new Date().toISOString()
    }))
  ) : []
  
  console.log(`[FINALIZE] Inserted ${insertedCompetitors.length} competitors`)
  
  // Write alerts
  const insertedAlerts = alerts.length > 0 ? await supabasePost('alerts',
    alerts.map((a: any) => ({
      user_id: actualUserId,
      scan_id: scanId,
      competitor_id: insertedCompetitors[0]?.id || null,
      title: a.title,
      description: a.description,
      priority: a.priority || 'info',
      category: a.category || 'news',
      read: false
    }))
  ) : []
  
  console.log(`[FINALIZE] Inserted ${insertedAlerts.length} alerts`)
  
  // Write insights
  const insertedInsights = insights.length > 0 ? await supabasePost('insights',
    insights.map((i: any) => ({
      user_id: actualUserId,
      scan_id: scanId,
      type: i.type || 'recommendation',
      title: i.title,
      description: i.description,
      confidence: i.confidence || 0.7,
      impact: i.impact || 'medium',
      action_items: i.action_items || []
    }))
  ) : []
  
  console.log(`[FINALIZE] Inserted ${insertedInsights.length} insights`)
  
  // Write news
  const insertedNews = news.length > 0 ? await supabasePost('news_feed',
    news.map((n: any) => ({
      user_id: actualUserId,
      scan_id: scanId,
      title: n.title,
      summary: n.summary || n.description,
      source: n.source || 'Perplexity',
      source_url: n.url || null,
      relevance_score: 0.5,
      sentiment: 'neutral',
      tags: n.tags || []
    }))
  ) : []
  
  console.log(`[FINALIZE] Inserted ${insertedNews.length} news`)
  
  // Generate industry analytics (only if new scan)
  let industryAnalytics = null
  
  if (!isRefresh) {
    console.log('[FINALIZE] Generating industry analytics...')
    try {
      const competitorNames = competitors.map((c: any) => c.name).slice(0, 8).join(', ')
      
      const analyticsRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'Market research analyst. Respond with valid JSON only. No markdown, no code fences. Use real, sourced data from recent industry reports (2024-2026 only). IMPORTANT: You MUST provide ALL fields with realistic values. Do NOT return incomplete data. If exact data is unavailable, provide reasonable industry estimates based on similar markets.' },
            { role: 'user', content: `Provide detailed market analytics data for the ${industry} industry based on real market research reports and data from 2024-2026 only.

CRITICAL REQUIREMENTS:
- ALL fields must have values (no null, no empty arrays, no 0%)
- market_leaders_share MUST have at least 3 companies with realistic market shares that sum to reasonable total
- regional_distribution MUST have at least 3 regions with percentages that sum to 100%
- If exact data unavailable, provide reasonable estimates based on similar industries
- Include "sources" array with actual report names and URLs

JSON object (ALL fields required):
{
  "market_size_billions": 150,
  "market_size_year": 2025,
  "projected_size_billions": 220,
  "projected_year": 2030,
  "cagr_percent": 8.5,
  "top_segments": [{"name": "Segment A", "share_percent": 35}, {"name": "Segment B", "share_percent": 28}],
  "growth_drivers": ["Driver 1", "Driver 2", "Driver 3"],
  "key_trends": [{"trend": "Trend name", "impact": "high", "description": "1 sentence"}],
  "funding_activity": {"total_billions": 12, "deal_count": 350, "avg_deal_millions": 34, "yoy_change_percent": 15},
  "market_leaders_share": [{"name": "Company A", "share_percent": 18}, {"name": "Company B", "share_percent": 15}, {"name": "Company C", "share_percent": 12}],
  "regional_distribution": [{"region": "North America", "share_percent": 40}, {"region": "Asia Pacific", "share_percent": 35}, {"region": "Europe", "share_percent": 25}],
  "sources": [{"name": "Report or source name", "url": "https://..."}]
}

Known competitors in this industry: ${competitorNames || 'N/A'}
Use actual competitor names in market_leaders_share if they are major players.` }
          ],
          temperature: 0.2,
          max_tokens: 3500
        })
      })
      
      const analyticsData = await analyticsRes.json()
      const analyticsContent = analyticsData?.choices?.[0]?.message?.content
      
      if (analyticsContent) {
        // Remove markdown code fences if present
        const cleaned = analyticsContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0].replace(/,(\s*[}\]])/g, '$1'))
          
          // Validate critical fields - add fallbacks if missing
          industryAnalytics = {
            market_size_billions: parsed.market_size_billions || 100,
            market_size_year: parsed.market_size_year || 2025,
            projected_size_billions: parsed.projected_size_billions || 150,
            projected_year: parsed.projected_year || 2030,
            cagr_percent: parsed.cagr_percent || 7.5,
            top_segments: parsed.top_segments?.length > 0 ? parsed.top_segments : [
              { name: 'Enterprise', share_percent: 45 },
              { name: 'SMB', share_percent: 35 },
              { name: 'Consumer', share_percent: 20 }
            ],
            growth_drivers: parsed.growth_drivers?.length > 0 ? parsed.growth_drivers : [
              'Digital transformation',
              'Market expansion',
              'Innovation'
            ],
            key_trends: parsed.key_trends?.length > 0 ? parsed.key_trends : [
              { trend: 'AI adoption', impact: 'high', description: 'Increasing automation and intelligence' }
            ],
            funding_activity: parsed.funding_activity || {
              total_billions: 10,
              deal_count: 250,
              avg_deal_millions: 40,
              yoy_change_percent: 10
            },
            market_leaders_share: parsed.market_leaders_share?.length > 0 ? parsed.market_leaders_share : [
              { name: competitors[0]?.name || 'Market Leader 1', share_percent: 20 },
              { name: competitors[1]?.name || 'Market Leader 2', share_percent: 15 },
              { name: competitors[2]?.name || 'Market Leader 3', share_percent: 12 }
            ],
            regional_distribution: parsed.regional_distribution?.length > 0 ? parsed.regional_distribution : [
              { region: 'North America', share_percent: 40 },
              { region: 'Asia Pacific', share_percent: 35 },
              { region: 'Europe', share_percent: 25 }
            ],
            sources: parsed.sources?.length > 0 ? parsed.sources : [
              { name: 'Industry analysis', url: '#' }
            ]
          }
          
          console.log('[FINALIZE] Industry analytics generated with full KPIs + fallbacks')
        }
      }
    } catch (e) {
      console.error('[FINALIZE] Analytics generation failed (non-critical):', e)
    }
  }
  
  // Update scan status to completed
  if (isRefresh) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?id=eq.${scanId}&select=alerts_count,insights_count,news_count`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    )
    const currentScan = await res.json()
    const current = currentScan[0] || { alerts_count: 0, insights_count: 0, news_count: 0 }
    
    await supabasePatch('scans', `id=eq.${scanId}`, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      alerts_count: current.alerts_count + insertedAlerts.length,
      insights_count: current.insights_count + insertedInsights.length,
      news_count: current.news_count + insertedNews.length
    })
  } else {
    await supabasePatch('scans', `id=eq.${scanId}`, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      competitors_count: insertedCompetitors.length,
      alerts_count: insertedAlerts.length,
      insights_count: insertedInsights.length,
      news_count: insertedNews.length,
      industry_analytics: industryAnalytics
    })
  }
  
  console.log('[FINALIZE] ✅ Scan completed successfully')
  
  return {
    competitors: insertedCompetitors.length,
    alerts: insertedAlerts.length,
    insights: insertedInsights.length,
    news: insertedNews.length
  }
}

// ========== OLD MONOLITHIC STEP (DEPRECATED) ==========
// Step 3: Analyze with Claude + write everything to Supabase (supports incremental scans)
async function stepAnalyzeAndWrite(industry: string, scanId: string, companies: any[], news: any[], isRefresh?: boolean, userId?: string) {
  // Kept for backward compatibility but require auth
  if (!userId) {
    throw new Error('Authentication required')
  }
  const actualUserId = userId
  // If refresh, fetch existing competitors to use in insights/alerts generation
  let competitorNames: string[] = []
  if (isRefresh) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/competitors?scan_id=eq.${scanId}&select=name`,
        {
          headers: {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          }
        }
      )
      if (!res.ok) {
        console.error('Failed to fetch competitors:', res.status, await res.text())
      } else {
        const existingCompetitors = await res.json()
        competitorNames = existingCompetitors?.map((c: any) => c.name) || []
        console.log('Fetched competitors for refresh:', competitorNames.length, competitorNames.slice(0, 3))
      }
    } catch (e) {
      console.error('Error fetching competitors:', e)
    }
  } else {
    competitorNames = companies.map((c: any) => c.name)
  }
  
  // If refresh, filter out duplicate news based on source_url
  let newNewsOnly = news
  if (isRefresh) {
    try {
      const existingNewsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/news_feed?scan_id=eq.${scanId}&select=source_url`,
        {
          headers: {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          }
        }
      )
      if (existingNewsRes.ok) {
        const existingNews = await existingNewsRes.json()
        const existingUrls = new Set(
          existingNews.map((n: any) => n.source_url).filter(Boolean)
        )
        newNewsOnly = news.filter((n: any) => n.url && !existingUrls.has(n.url))
        console.log(`[REFRESH] Filtered news: ${news.length} total, ${newNewsOnly.length} new, ${existingUrls.size} existing`)
      }
    } catch (e) {
      console.error('Error fetching existing news:', e)
      // On error, proceed with all news
    }
    
    // If no new news during refresh, skip AI analysis
    if (newNewsOnly.length === 0) {
      console.log('[REFRESH] No new news - skipping insights/alerts generation')
      return {
        competitors: 0,
        alerts: 0,
        insights: 0,
        news: 0
      }
    }
  }
  
  // Fallback: if no competitors found, skip insights/alerts generation
  if (competitorNames.length === 0 && newNewsOnly.length === 0) {
    console.warn('No competitors or news - skipping insights/alerts')
    return {
      competitors: 0,
      alerts: 0,
      insights: 0,
      news: 0
    }
  }
  
  // Run AI analyses (skip competitors analysis if incremental scan)
  const promises: Promise<string>[] = []
  
  // Only analyze competitors on first scan (not on refresh)
  if (!isRefresh) {
    promises.push(
      poeRequest(`Analyze ${industry} companies. Each: threat_score(0-10), activity_level(low/medium/high), description, employee_count, stock_ticker (if publicly traded, use format like "AAPL", "MSFT", "TSE:RY" for Toronto, "EPA:BNP" for Paris etc. Use null if private).
Companies: ${companies.map((c: any) => c.name).join(', ')}
JSON array only: [{"name":"X","threat_score":7.5,"activity_level":"high","description":"Desc","employee_count":500,"industry":"${industry}","stock_ticker":"AAPL"}]`)
    )
  }
  
  // Always generate new insights and alerts (even on refresh) - but only from NEW news
  promises.push(
    poeRequest(`3-4 strategic insights for ${industry}.
Companies: ${competitorNames.slice(0,5).join(', ')}
News: ${newNewsOnly.slice(0,8).map((n: any) => n.title).join('; ')}
JSON: [{"type":"threat|opportunity|trend|recommendation","title":"X","description":"2-3 sentences","confidence":0.85,"impact":"high","action_items":["X"]}]`),
    
    poeRequest(`5-7 alerts from ${industry} news.
Companies: ${competitorNames.slice(0,8).join(', ')}
News: ${newNewsOnly.slice(0,12).map((n: any) => n.title).join('; ')}
JSON: [{"title":"X","description":"Context","priority":"critical|attention|info","category":"funding|product|hiring|news|market"}]`)
  )

  const results = await Promise.all(promises)
  
  let analyzed: any[] = []
  let insights: any[] = []
  let alerts: any[] = []
  
  if (isRefresh) {
    // Only 2 promises: insights, alerts
    insights = parseJsonArray(results[0])
    alerts = parseJsonArray(results[1])
  } else {
    // 3 promises: competitors, insights, alerts
    analyzed = parseJsonArray(results[0])
    insights = parseJsonArray(results[1])
    alerts = parseJsonArray(results[2])
  }

  // Fetch stock prices via Perplexity for public companies (only on first scan, not refresh)
  const publicCompanies = analyzed.filter((c: any) => c.stock_ticker)
  let stockPrices: Record<string, { price: number; currency: string; change_percent: number }> = {}
  
  if (publicCompanies.length > 0) {
    try {
      const tickers = publicCompanies.map((c: any) => `${c.name} (${c.stock_ticker})`).join(', ')
      const stockRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'Financial data analyst. Respond with valid JSON only. No markdown.' },
            { role: 'user', content: `Current stock prices for these companies: ${tickers}
JSON object with ticker as key: {"AAPL": {"price": 178.50, "currency": "USD", "change_percent": -1.2}, "TSE:RY": {"price": 145.30, "currency": "CAD", "change_percent": 0.5}}` }
          ],
          temperature: 0.2, max_tokens: 1500
        })
      })
      const stockData = await stockRes.json()
      const stockContent = stockData?.choices?.[0]?.message?.content
      if (stockContent) {
        // Remove markdown code fences if present
        const cleaned = stockContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) {
          stockPrices = JSON.parse(match[0].replace(/,(\s*[}\]])/g, '$1'))
        }
      }
    } catch (e) {
      console.error('Stock price fetch error:', e)
    }
  }

  // Write competitors to Supabase (only on first scan, not refresh)
  const insertedCompetitors = !isRefresh && analyzed.length > 0 ? await supabasePost('competitors', 
    analyzed.map((c: any) => {
      const stockInfo = c.stock_ticker ? stockPrices[c.stock_ticker] : null
      return {
        user_id: actualUserId, scan_id: scanId,
        name: c.name, domain: companies.find((co: any) => co.name === c.name)?.domain || null,
        industry: c.industry || industry, threat_score: c.threat_score || 5.0,
        activity_level: c.activity_level || 'medium', description: c.description || '',
        employee_count: c.employee_count || null,
        stock_ticker: c.stock_ticker || null,
        stock_price: stockInfo?.price || null,
        stock_currency: stockInfo?.currency || null,
        stock_change_percent: stockInfo?.change_percent || null,
        sentiment_score: Math.random() * 0.5 + 0.3,
        last_activity_date: new Date().toISOString()
      }
    })
  ) : []

  // Always insert new alerts (accumulate over time)
  const insertedAlerts = alerts.length > 0 ? await supabasePost('alerts',
    alerts.map((a: any) => ({
      user_id: actualUserId, scan_id: scanId,
      competitor_id: insertedCompetitors[0]?.id || null,
      title: a.title, description: a.description,
      priority: a.priority || 'info', category: a.category || 'news', read: false
    }))
  ) : []

  // Always insert new insights (accumulate over time)
  const insertedInsights = insights.length > 0 ? await supabasePost('insights',
    insights.map((i: any) => ({
      user_id: actualUserId, scan_id: scanId,
      type: i.type || 'recommendation', title: i.title, description: i.description,
      confidence: i.confidence || 0.7, impact: i.impact || 'medium',
      action_items: i.action_items || []
    }))
  ) : []

  // Insert only NEW news (already filtered for duplicates during refresh)
  const insertedNews = newNewsOnly.length > 0 ? await supabasePost('news_feed',
    newNewsOnly.map((n: any) => ({
      user_id: actualUserId, scan_id: scanId,
      title: n.title, summary: n.summary || n.description,
      source: n.source || 'Perplexity', source_url: n.url || null,
      relevance_score: 0.5, sentiment: 'neutral', tags: n.tags || []
    }))
  ) : []

  // Generate industry analytics (only on first scan, reuse on refresh)
  let industryAnalytics = null
  
  if (isRefresh) {
    // Fetch existing analytics from current scan
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?id=eq.${scanId}&select=industry_analytics`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    )
    const currentScan = await res.json()
    if (currentScan && currentScan.length > 0) {
      industryAnalytics = currentScan[0].industry_analytics
    }
  }
  
  // Generate analytics if not found (either new scan or missing from refresh)
  if (!industryAnalytics) {
    // Generate fresh industry analytics via Perplexity (for real data + citations)
    const analyticsRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PERPLEXITY_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'Market research analyst. Respond with valid JSON only. No markdown, no code fences. Use real, sourced data from recent industry reports (2024-2026 only).' },
          { role: 'user', content: `Provide detailed market analytics data for the ${industry} industry based on real market research reports and data from 2024-2026 only. Do not use outdated data.

Include a "sources" array with the report names and URLs you used.

JSON object only:
{
  "market_size_billions": 150,
  "market_size_year": 2025,
  "projected_size_billions": 220,
  "projected_year": 2030,
  "cagr_percent": 8.5,
  "top_segments": [{"name": "Segment A", "share_percent": 35}],
  "growth_drivers": ["Driver 1", "Driver 2", "Driver 3"],
  "key_trends": [{"trend": "Trend name", "impact": "high|medium|low", "description": "1 sentence"}],
  "funding_activity": {"total_billions": 12, "deal_count": 350, "avg_deal_millions": 34, "yoy_change_percent": 15},
  "market_leaders_share": [{"name": "Company", "share_percent": 15}],
  "regional_distribution": [{"region": "North America", "share_percent": 40}],
  "sources": [{"name": "Report or source name", "url": "https://..."}]
}
Use the actual known competitor names from this list where possible: ${analyzed.slice(0,8).map((c: any) => c.name).join(', ')}` }
        ],
        temperature: 0.3, max_tokens: 3000
      })
    })
    const analyticsData = await analyticsRes.json()
    const analyticsContent = analyticsData?.choices?.[0]?.message?.content
    // Also capture Perplexity citations if available
    const perplexityCitations = analyticsData?.citations || []

    try {
      if (analyticsContent) {
        const match = analyticsContent.match(/\{[\s\S]*\}/)
        if (match) {
          industryAnalytics = JSON.parse(match[0].replace(/,(\s*[}\]])/g, '$1'))
          // Merge Perplexity citations into sources if not already present
          if (perplexityCitations.length > 0 && !industryAnalytics.sources) {
            industryAnalytics.sources = perplexityCitations.map((url: string) => ({ name: url.split('/')[2] || url, url }))
          }
        }
      }
    } catch (e) {
      console.error('Analytics parse error:', e)
    }
  }

  // Mark scan as completed - increment counts for refresh, set for new scan
  if (isRefresh) {
    // Fetch current counts
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?id=eq.${scanId}&select=alerts_count,insights_count,news_count`,
      {
        headers: {
          'apikey': SUPABASE_KEY!,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    )
    const currentScan = await res.json()
    const current = currentScan[0] || { alerts_count: 0, insights_count: 0, news_count: 0 }
    
    // Increment counts
    await supabasePatch('scans', `id=eq.${scanId}`, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      alerts_count: current.alerts_count + insertedAlerts.length,
      insights_count: current.insights_count + insertedInsights.length,
      news_count: current.news_count + insertedNews.length
    })
  } else {
    // Set counts for new scan
    await supabasePatch('scans', `id=eq.${scanId}`, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      competitors_count: insertedCompetitors.length,
      alerts_count: insertedAlerts.length,
      insights_count: insertedInsights.length,
      news_count: insertedNews.length,
      industry_analytics: industryAnalytics
    })
  }

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
    const { step, industry, scanId, companies, news, companyUrl, companyName, maxCompetitors, regions, watchlist, isRefresh, userId } = JSON.parse(event.body || '{}')
    
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
        result = await stepInit(industry, companyUrl, companyName, userId)
        break
      case 'competitors':
        result = await stepCompetitors(industry, scanId, companyUrl, maxCompetitors, regions, watchlist, userId)
        break
      case 'news':
        result = await stepNews(industry)
        break
      case 'analyze':
        if (!scanId) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId required for analyze step' }) }
        }
        // DEPRECATED - use analyze-competitors, analyze-insights, analyze-alerts, finalize instead
        result = await stepAnalyzeAndWrite(industry, scanId, companies || [], news || [], isRefresh, userId)
        break
      
      // NEW SPLIT STEPS
      case 'analyze-competitors':
        if (!scanId) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId required' }) }
        }
        result = await stepAnalyzeCompetitors(industry, scanId, companies || [], userId)
        break
        
      case 'analyze-insights':
        if (!scanId) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId required' }) }
        }
        const { competitorNames: insightCompNames } = JSON.parse(event.body || '{}')
        result = await stepAnalyzeInsights(industry, scanId, news || [], insightCompNames || [], userId)
        break
        
      case 'analyze-alerts':
        if (!scanId) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId required' }) }
        }
        const { competitorNames: alertCompNames } = JSON.parse(event.body || '{}')
        result = await stepAnalyzeAlerts(industry, scanId, news || [], alertCompNames || [], userId)
        break
        
      case 'finalize':
        if (!scanId) {
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'scanId required' }) }
        }
        const { competitors: finalizeCompetitors, insights: finalizeInsights, alerts: finalizeAlerts } = JSON.parse(event.body || '{}')
        result = await stepFinalize(
          industry, 
          scanId, 
          finalizeCompetitors || [], 
          finalizeInsights || [], 
          finalizeAlerts || [], 
          news || [], 
          isRefresh || false, 
          userId
        )
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
