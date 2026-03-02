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
    
    // Step 1: Fetch existing competitors (for insights/alerts generation)
    const competitorsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competitors?scan_id=eq.${scan.id}&select=name`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )
    
    const competitorsData = await competitorsRes.json()
    const competitorNames = competitorsData?.map((c: any) => c.name) || []
    console.log(`[REFRESH] Found ${competitorNames.length} existing competitors`)
    
    // Step 2: Collect latest news
    const newsRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'news',
        industry: scan.industry,
        isRefresh: true
      })
    })
    
    if (!newsRes.ok) {
      throw new Error(`News step failed: ${newsRes.status}`)
    }
    
    const newsData = await newsRes.json()
    console.log(`[REFRESH] Collected ${newsData.count || 0} news items`)
    
    // Step 3: Generate insights (NEW SPLIT STEP)
    const insightsRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'analyze-insights',
        scanId: scan.id,
        industry: scan.industry,
        news: newsData.news || [],
        competitorNames,
        userId: scan.user_id
      })
    })
    
    if (!insightsRes.ok) {
      throw new Error(`Insights step failed: ${insightsRes.status}`)
    }
    
    const insightsData = await insightsRes.json()
    console.log(`[REFRESH] Generated ${insightsData.count || 0} insights`)
    
    // Step 4: Generate alerts (NEW SPLIT STEP)
    const alertsRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'analyze-alerts',
        scanId: scan.id,
        industry: scan.industry,
        news: newsData.news || [],
        competitorNames,
        userId: scan.user_id
      })
    })
    
    if (!alertsRes.ok) {
      throw new Error(`Alerts step failed: ${alertsRes.status}`)
    }
    
    const alertsData = await alertsRes.json()
    console.log(`[REFRESH] Generated ${alertsData.count || 0} alerts`)
    
    // Step 5: Finalize (write all data to DB, mark scan as completed)
    const finalizeRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'finalize',
        scanId: scan.id,
        industry: scan.industry,
        competitors: [], // Don't re-insert competitors on refresh
        insights: insightsData.insights || [],
        alerts: alertsData.alerts || [],
        news: newsData.news || [],
        isRefresh: true,
        userId: scan.user_id
      })
    })
    
    if (!finalizeRes.ok) {
      throw new Error(`Finalize step failed: ${finalizeRes.status}`)
    }
    
    const finalizeData = await finalizeRes.json()
    const newAlertsCount = finalizeData.alerts || 0
    const newInsightsCount = finalizeData.insights || 0
    const newNewsCount = finalizeData.news || 0
    console.log(`[REFRESH] Finalized: ${newAlertsCount} alerts, ${newInsightsCount} insights, ${newNewsCount} news`)
    
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
        new_news_count: newNewsCount
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
    
    // Create refresh logs and FIRE-AND-FORGET the refresh process
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
      
      if (!logRes.ok) {
        const errorText = await logRes.text()
        console.error(`[CRON-REFRESH-SCANS] Failed to create log: ${logRes.status} - ${errorText}`)
        continue
      }
      
      const logData = await logRes.json()
      logIds[scan.id] = logData[0]?.id
    }
    
    // FIRE-AND-FORGET: Launch refreshes without waiting
    scans.forEach((scan) => {
      const logId = logIds[scan.id]
      if (!logId) return
      
      console.log(`[CRON-REFRESH-SCANS] Launching async refresh for scan ${scan.id}`)
      
      // Don't await - let it run in background
      refreshScan(scan, logId).then(() => {
        console.log(`[CRON-REFRESH-SCANS] Background refresh completed for ${scan.id}`)
      }).catch((err) => {
        console.error(`[CRON-REFRESH-SCANS] Background refresh failed for ${scan.id}:`, err)
      })
      
      // Update schedule last_run_at immediately
      const schedule = schedules.find(s => s.scan_id === scan.id)
      if (schedule) {
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
          })
        }).catch(err => console.error(`Failed to update schedule ${schedule.id}:`, err))
      }
    })
    
    // Return immediately - refreshes continue in background
    console.log(`[CRON-REFRESH-SCANS] Launched ${scans.length} background refreshes`)
    
    return res.status(200).json({
      message: 'Scheduled scans launched (processing in background)',
      total: schedules.length,
      launched: scans.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('[CRON-REFRESH-SCANS] Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

// No longer using experimental-scheduled (unreliable)
// Now triggered by GitHub Actions workflow every hour
