/**
 * API Route: List user's scans and schedules
 * Uses service role key to bypass RLS (which doesn't work with Clerk JWT on client)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get Clerk user ID
    const { userId } = getAuth(req)
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('[API /scans/list] Fetching scans for user:', userId)

    // Fetch scans using service role key (bypasses RLS)
    const scansRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scans?user_id=eq.${userId}&status=eq.completed&select=id,industry,company_name,company_url&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!scansRes.ok) {
      console.error('[API /scans/list] Scans fetch failed:', scansRes.status, await scansRes.text())
      throw new Error('Failed to fetch scans')
    }

    const scans = await scansRes.json()
    console.log('[API /scans/list] Found scans:', scans.length)

    // Fetch schedules
    const schedulesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scan_schedules?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!schedulesRes.ok) {
      console.error('[API /scans/list] Schedules fetch failed:', schedulesRes.status, await schedulesRes.text())
      throw new Error('Failed to fetch schedules')
    }

    const schedules = await schedulesRes.json()
    console.log('[API /scans/list] Found schedules:', schedules.length)

    return res.status(200).json({ scans, schedules })

  } catch (error: any) {
    console.error('[API /scans/list] Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
