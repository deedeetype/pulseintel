import { useEffect, useState } from 'react'
import { supabase, type Insight } from '@/lib/supabase'

export function useInsights(limit?: number) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [limit])

  async function fetchInsights() {
    try {
      setLoading(true)
      let query = supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

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
