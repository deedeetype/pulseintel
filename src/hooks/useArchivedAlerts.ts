/**
 * Hook to fetch archived alerts
 */

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient, type Alert } from '@/lib/supabase'

export function useArchivedAlerts() {
  const { getToken } = useAuth()
  const [archivedAlerts, setArchivedAlerts] = useState<Alert[]>([])
  const [archivedCount, setArchivedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchArchived = async () => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setArchivedAlerts(data || [])
      setArchivedCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching archived alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArchivedCount = async () => {
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true)
      
      if (error) throw error
      setArchivedCount(count || 0)
    } catch (error) {
      console.error('Error fetching archived count:', error)
    }
  }

  return { archivedAlerts, archivedCount, loading, fetchArchived, fetchArchivedCount }
}
