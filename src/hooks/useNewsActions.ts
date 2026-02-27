/**
 * Hook for news feed actions (archive, delete)
 */

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient } from '@/lib/supabase'

export function useNewsActions() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)

  const archiveNews = async (newsId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('news_feed')
        .update({ archived: true })
        .eq('id', newsId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error archiving news:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const unarchiveNews = async (newsId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('news_feed')
        .update({ archived: false })
        .eq('id', newsId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error unarchiving news:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteNews = async (newsId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('news_feed')
        .delete()
        .eq('id', newsId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting news:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const archiveAlert = async (alertId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('alerts')
        .update({ archived: true })
        .eq('id', alertId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error archiving alert:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteAlert = async (alertId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting alert:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const archiveInsight = async (insightId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('insights')
        .update({ archived: true })
        .eq('id', insightId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error archiving insight:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteInsight = async (insightId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', insightId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting insight:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const archiveCompetitor = async (competitorId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('competitors')
        .update({ archived: true })
        .eq('id', competitorId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error archiving competitor:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteCompetitor = async (competitorId: string): Promise<void> => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', competitorId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting competitor:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    archiveNews,
    unarchiveNews,
    deleteNews,
    archiveAlert,
    deleteAlert,
    archiveInsight,
    deleteInsight,
    archiveCompetitor,
    deleteCompetitor
  }
}
