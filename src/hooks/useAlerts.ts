import { useEffect, useState } from 'react'
import { createSupabaseClient, type Alert } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

export function useAlerts(scanId?: string, limit?: number) {
  const { getToken } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [scanId, limit])

  async function fetchAlerts() {
    try {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (scanId) {
        query = query.eq('scan_id', scanId)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      setAlerts(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(alertId: string) {
    try {
      // Optimistic update - update local state immediately
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, read: true } : a
      ))

      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) {
        // Revert on error
        console.error('Error marking alert as read:', err)
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Error marking alert as read:', err)
      await fetchAlerts()
    }
  }

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead }
}
