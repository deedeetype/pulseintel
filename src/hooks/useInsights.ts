import { useEffect, useState } from 'react'
import { createSupabaseClient, type Insight } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

export function useInsights(scanId?: string, limit?: number) {
  const { getToken } = useAuth()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [scanId, limit])

  async function fetchInsights() {
    try {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false })

      if (scanId) {
        query = query.eq('scan_id', scanId)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error} = await query

      if (error) throw error
      setInsights(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching insights:', err)
    } finally {
      setLoading(false)
    }
  }

  return { insights, loading, error, refetch: fetchInsights }
}
