/**
 * Hook to fetch archived insights
 */

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient, type Insight } from '@/lib/supabase'

export function useArchivedInsights() {
  const { getToken } = useAuth()
  const [archivedInsights, setArchivedInsights] = useState<Insight[]>([])
  const [archivedCount, setArchivedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchArchived = async () => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setArchivedInsights(data || [])
      setArchivedCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching archived insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedCount = async () => {
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { count, error } = await supabase
        .from('insights')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true)
      
      if (error) throw error
      setArchivedCount(count || 0)
    } catch (error) {
      console.error('Error fetching archived count:', error)
    }
  }

  return { archivedInsights, archivedCount, loading, fetchArchived, fetchArchivedCount }
}
