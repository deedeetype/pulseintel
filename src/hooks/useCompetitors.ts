import { useEffect, useState } from 'react'
import { supabase, type Competitor } from '@/lib/supabase'

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchCompetitors()

    // Real-time subscription
    const channel = supabase
      .channel('competitors-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitors'
        },
        () => {
          fetchCompetitors()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchCompetitors() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .order('threat_score', { ascending: false })

      if (error) throw error
      setCompetitors(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching competitors:', err)
    } finally {
      setLoading(false)
    }
  }

  return { competitors, loading, error, refetch: fetchCompetitors }
}
