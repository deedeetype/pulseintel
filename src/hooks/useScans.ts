import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
}

export function useScans(limit?: number) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScans()

    // Subscribe to new scans
    const subscription = supabase
      .channel('scans_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scans' },
        () => {
          fetchScans()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [limit])

  async function fetchScans() {
    try {
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
