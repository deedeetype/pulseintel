import { useEffect, useState } from 'react'
import { supabase, type Alert } from '@/lib/supabase'

export function useAlerts(scanId?: string, limit?: number) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchAlerts()

    // Real-time subscription
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          fetchAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scanId, limit])

  async function fetchAlerts() {
    try {
      setLoading(true)
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
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) throw error
      await fetchAlerts()
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead }
}
