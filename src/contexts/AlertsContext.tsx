'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSupabaseClient, type Alert } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

interface AlertsContextType {
  alerts: Alert[]
  loading: boolean
  error: Error | null
  markAsRead: (id: string) => void
  archiveAlertOptimistic: (id: string) => void
  refetch: () => void
  unreadCount: number
  setScanFilter: (scanId: string | undefined) => void
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined)

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [scanFilter, setScanFilter] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchAlerts()
  }, [scanFilter])

  async function fetchAlerts() {
    try {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('archived', false) // Only show non-archived alerts
        .order('created_at', { ascending: false })

      if (scanFilter) {
        query = query.eq('scan_id', scanFilter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setAlerts(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(alertId: string) {
    // Optimistic update - UI changes immediately
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ))

    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error: updateError } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (updateError) {
        console.error('Error marking alert as read:', updateError)
        // Revert on error
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Error marking alert as read:', err)
      await fetchAlerts()
    }
  }

  function archiveAlertOptimistic(alertId: string) {
    // Optimistic update - remove from list immediately
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <AlertsContext.Provider value={{ 
      alerts, 
      loading, 
      error, 
      markAsRead,
      archiveAlertOptimistic,
      refetch: fetchAlerts,
      unreadCount,
      setScanFilter
    }}>
      {children}
    </AlertsContext.Provider>
  )
}

export function useAlertsContext() {
  const context = useContext(AlertsContext)
  if (!context) {
    throw new Error('useAlertsContext must be used within AlertsProvider')
  }
  return context
}
