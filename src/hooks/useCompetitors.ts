import { useEffect, useState } from 'react'
import { createSupabaseClient, type Competitor } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

export function useCompetitors(scanId?: string) {
  const { getToken } = useAuth()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchCompetitors()
  }, [scanId])

  async function fetchCompetitors() {
    try {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('competitors')
        .select('*')
        .order('threat_score', { ascending: false })
      
      if (scanId) {
        query = query.eq('scan_id', scanId)
      }

      const { data, error } = await query

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
