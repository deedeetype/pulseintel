/**
 * Next.js Scheduled API Route for automated scan refreshes
 * Runs every 5 minutes for testing (change to @hourly for production)
 */

import type { NextApiRequest, NextApiResponse } from 'next'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function refreshScan(scan: Scan, logId: string) {
  console.log(`[REFRESH] Starting refresh for scan ${scan.id} (${scan.industry})`)
  
  // Set a timeout to auto-fail if process takes too long
  const timeoutId = setTimeout(async () => {
    console.log(`[REFRESH] Timeout for scan ${scan.id} - marking as failed`)
    await fetch(`${SUPABASE_URL}/rest/v1/refresh_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: 'Process timeout (exceeded 45s limit)'
      })
    })
  }, 45000) // 45 second timeout
  
  try {
    // Update log: started
    await fetch(`${SUPABASE_URL}/rest/v1/refresh_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        started_at: new Date().toISOString()
      })
    })
    
    // Step 1: Collect latest news
    const newsRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'news',
        industry: scan.industry,
        companyUrl: scan.company_url,
        companyName: scan.company_name,
        isRefresh: true
      })
    })
    
    if (!newsRes.ok) {
      throw new Error(`News step failed: ${newsRes.status}`)
    }
    
    const newsData = await newsRes.json()
    console.log(`[REFRESH] Collected ${newsData.news?.length || 0} news items`)
    
    // Step 2: Analyze and generate insights
    const analyzeRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'analyze',
        scanId: scan.id,
        industry: scan.industry,
        competitors: [],
        news: newsData.news || [],
        isRefresh: true,
        userId: scan.user_id
      })
    })
    
    if (!analyzeRes.ok) {
      throw new Error(`Analyze step failed: ${analyzeRes.status}`)
    }
    
    const analyzeData = await analyzeRes.json()
    const newAlertsCount = analyzeData.alerts?.length || 0
    const newInsightsCount = analyzeData.insights?.length || 0
    console.log(`[REFRESH] Generated ${newAlertsCount} alerts, ${newInsightsCount} insights`)
    
    // Step 3: Update scan metadata
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
    
    console.log(`[REFRESH] Completed scan ${scan.id}`)
    
    // Clear timeout on success
    clearTimeout(timeoutId)
    
    // Update log: completed successfully
    await fetch(`${SUPABASE_URL}/rest/v1/refresh_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        completed_at: new Date().toISOString(),
        status: 'success',
        new_alerts_count: newAlertsCount,
        new_insights_count: newInsightsCount,
        new_news_count: newsData.articles?.length || 0
      })
    })
    
    return { success: true }
    
  } catch (error: any) {
    console.error(`[REFRESH] Error for scan ${scan.id}:`, error.message)
    
    // Clear timeout on error
    clearTimeout(timeoutId)
    
    // Update log: failed
    await fetch(`${SUPABASE_URL}/rest/v1/refresh_logs?id=eq.${logId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error.message
      })
    })
    
    return { success: false, error: error.message }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret (security)
  const cronSecret = req.headers['x-cron-secret']
  const expectedSecret = process.env.CRON_SECRET
  
  if (expectedSecret && cronSecret !== expectedSecret) {
    console.log('[CRON-REFRESH-SCANS] Unauthorized: Invalid or missing secret')
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  console.log('[CRON-REFRESH-SCANS] Running at', new Date().toISOString())
  
  try {
    // Fetch all enabled schedules that are due
    const schedulesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scan_schedules?enabled=eq.true&next_run_at=lte.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )
    
    if (!schedulesRes.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesRes.status}`)
    }
    
    const schedules: ScanSchedule[] = await schedulesRes.json()
    console.log(`[CRON-REFRESH-SCANS] Found ${schedules.length} due schedules`)
    
    if (schedules.length === 0) {
      return res.status(200).json({
        message: 'No schedules due',
        count: 0,
        timestamp: new Date().toISOString()
      })
    }
    
    // Fetch scan details
    const scanIds = schedules.map(s => s.scan_id).join(',')
    const scansRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?id=in.(${scanIds})&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )
    
    if (!scansRes.ok) {
      throw new Error(`Failed to fetch scans: ${scansRes.status}`)
    }
    
    const scans: Scan[] = await scansRes.json()
    console.log(`[CRON-REFRESH-SCANS] Processing ${scans.length} scans`)
    
    // Create refresh logs for each scan
    const logIds: Record<string, string> = {}
    for (const scan of scans) {
      console.log(`[CRON-REFRESH-SCANS] Creating log for scan ${scan.id}, user ${scan.user_id}`)
      
      const logRes = await fetch(`${SUPABASE_URL}/rest/v1/refresh_logs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          scan_id: scan.id,
          user_id: scan.user_id,
          triggered_by: 'scheduled',
          status: 'running'
        })
      })
      
      console.log(`[CRON-REFRESH-SCANS] Log creation response status: ${logRes.status}`)
      
      if (!logRes.ok) {
        const errorText = await logRes.text()
        console.error(`[CRON-REFRESH-SCANS] Failed to create log: ${logRes.status} - ${errorText}`)
        // Continue même si le log échoue
        continue
      }
      
      const logData = await logRes.json()
      console.log(`[CRON-REFRESH-SCANS] Log created:`, logData)
      logIds[scan.id] = logData[0]?.id
    }
    
    // Refresh each scan
    const results = await Promise.allSettled(
      scans.map(async (scan) => {
        const result = await refreshScan(scan, logIds[scan.id])
        
        // Update schedule last_run_at
        const schedule = schedules.find(s => s.scan_id === scan.id)
        if (schedule) {
          await fetch(`${SUPABASE_URL}/rest/v1/scan_schedules?id=eq.${schedule.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY!,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              last_run_at: new Date().toISOString()
            })
          })
        }
        
        return result
      })
    )
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful
    
    console.log(`[CRON-REFRESH-SCANS] Completed: ${successful} successful, ${failed} failed`)
    
    return res.status(200).json({
      message: 'Scheduled scans processed',
      total: schedules.length,
      successful,
      failed,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('[CRON-REFRESH-SCANS] Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

// No longer using experimental-scheduled (unreliable)
// Now triggered by GitHub Actions workflow every hour
