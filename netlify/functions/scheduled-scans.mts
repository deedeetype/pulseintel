/**
 * Netlify Scheduled Function - Automated Scan Refreshes
 * Runs every hour to check for due scan schedules
 * Triggers refresh for each profile that's due
 * 
 * Can also be invoked manually via POST for testing
 */

import type { Handler, HandlerEvent, Config } from "@netlify/functions"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY
const POE_KEY = process.env.POE_API_KEY

interface ScanSchedule {
  id: string
  scan_id: string
  user_id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  next_run_at: string
  timezone: string
}

interface Scan {
  id: string
  user_id: string
  industry: string
  company_url?: string
  company_name?: string
  refresh_count?: number
  last_refreshed_at?: string
}

// Helper to call scan-step function
async function refreshScan(scan: Scan) {
  console.log(`[REFRESH] Starting refresh for scan ${scan.id} (${scan.industry})`)
  
  try {
    // Step 1: Collect latest news
    const newsRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'news',
        industry: scan.industry
      })
    })
    
    if (!newsRes.ok) {
      throw new Error(`News step failed: ${newsRes.status}`)
    }
    
    const { news } = await newsRes.json()
    console.log(`[REFRESH] Collected ${news.length} news items`)
    
    // Step 2: Analyze and generate new alerts/insights (incremental mode)
    const analyzeRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'analyze',
        industry: scan.industry,
        scanId: scan.id,
        companies: [], // Empty for refresh - use existing competitors
        news,
        isRefresh: true
      })
    })
    
    if (!analyzeRes.ok) {
      throw new Error(`Analyze step failed: ${analyzeRes.status}`)
    }
    
    const results = await analyzeRes.json()
    console.log(`[REFRESH] Generated ${results.alerts} new alerts, ${results.insights} insights`)
    
    // Update scan's last_refreshed_at
    await fetch(`${SUPABASE_URL}/rest/v1/scans?id=eq.${scan.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        last_refreshed_at: new Date().toISOString(),
        refresh_count: scan.refresh_count ? scan.refresh_count + 1 : 1
      })
    })
    
    return { success: true, alerts: results.alerts, insights: results.insights }
  } catch (error: any) {
    console.error(`[REFRESH] Error for scan ${scan.id}:`, error.message)
    return { success: false, error: error.message }
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    }
  }

  console.log('[SCHEDULED-SCANS] Running at', new Date().toISOString())
  
  try {
    // Fetch all enabled schedules that are due (next_run_at <= NOW)
    const schedulesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scan_schedules?enabled=eq.true&next_run_at=lte.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    
    if (!schedulesRes.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesRes.status}`)
    }
    
    const schedules: ScanSchedule[] = await schedulesRes.json()
    console.log(`[SCHEDULED-SCANS] Found ${schedules.length} due schedules`)
    
    if (schedules.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No schedules due', count: 0 })
      }
    }
    
    // Fetch corresponding scans
    const scanIds = schedules.map(s => s.scan_id)
    const scansRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?id=in.(${scanIds.join(',')})&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    
    const scans: Scan[] = await scansRes.json()
    console.log(`[SCHEDULED-SCANS] Processing ${scans.length} scans`)
    
    // Process each scan (refresh)
    const results = await Promise.allSettled(
      scans.map(scan => refreshScan(scan))
    )
    
    // Update last_run_at and calculate next_run_at for each schedule
    await Promise.all(
      schedules.map(schedule =>
        fetch(`${SUPABASE_URL}/rest/v1/scan_schedules?id=eq.${schedule.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY!,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            last_run_at: new Date().toISOString()
            // next_run_at will be auto-calculated by trigger
          })
        })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful
    
    console.log(`[SCHEDULED-SCANS] Completed: ${successful} successful, ${failed} failed`)
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Scheduled scans processed',
        total: schedules.length,
        successful,
        failed,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error: any) {
    console.error('[SCHEDULED-SCANS] Error:', error)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Netlify Scheduled Function Config
// TEST: Runs every 5 minutes for quick testing
// PRODUCTION: Change to "0 * * * *" (hourly)
export const config: Config = {
  schedule: "*/5 * * * *"  // Every 5 minutes
}
