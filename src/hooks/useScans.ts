import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

export interface Scan {
  id: string
  user_id: string
  industry: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error_message?: string
  competitors_count: number
  alerts_count: number
  insights_count: number
  news_count: number
  created_at: string
  completed_at?: string
  duration_seconds?: number
  company_url?: string
  company_name?: string
  industry_analytics?: any
  last_refreshed_at?: string
  refresh_count: number
  updated_at: string
}

export function useScans(limit?: number) {
  const { getToken } = useAuth()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScans()
  }, [limit])

  async function fetchScans() {
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      setScans(data || [])
    } catch (err: any) {
      console.error('Error fetching scans:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { scans, loading, error, refetch: fetchScans }
}
