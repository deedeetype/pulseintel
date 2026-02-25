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

async function refreshScan(scan: Scan) {
  console.log(`[REFRESH] Starting refresh for scan ${scan.id} (${scan.industry})`)
  
  try {
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
    console.log(`[REFRESH] Collected ${newsData.articles?.length || 0} news items`)
    
    // Step 2: Analyze and generate insights
    const analyzeRes = await fetch(`${process.env.URL}/.netlify/functions/scan-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'analyze',
        industry: scan.industry,
        competitors: [],
        news: newsData.articles || [],
        isRefresh: true
      })
    })
    
    if (!analyzeRes.ok) {
      throw new Error(`Analyze step failed: ${analyzeRes.status}`)
    }
    
    const analyzeData = await analyzeRes.json()
    console.log(`[REFRESH] Generated ${analyzeData.alerts?.length || 0} alerts, ${analyzeData.insights?.length || 0} insights`)
    
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
    return { success: true }
    
  } catch (error: any) {
    console.error(`[REFRESH] Error for scan ${scan.id}:`, error.message)
    return { success: false, error: error.message }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    
    // Refresh each scan
    const results = await Promise.allSettled(
      scans.map(async (scan) => {
        const result = await refreshScan(scan)
        
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

// Next.js Scheduled API Route Config
export const config = {
  type: 'experimental-scheduled' as const,
  schedule: '*/5 * * * *'  // Every 5 minutes for testing
}
