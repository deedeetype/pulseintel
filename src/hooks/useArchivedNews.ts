/**
 * Hook to fetch archived news items
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient } from '@/lib/supabase'
import { type NewsItem } from '@/contexts/NewsFeedContext'

export function useArchivedNews() {
  const { getToken } = useAuth()
  const [archivedNews, setArchivedNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchArchived = async () => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      const { data, error } = await supabase
        .from('news_feed')
        .select('*')
        .eq('archived', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Add read status from localStorage
      const readStatus = JSON.parse(localStorage.getItem('pulseintel_news_read') || '{}')
      const newsWithRead = (data || []).map(item => ({
        ...item,
        read: readStatus[item.id] || false
      }))
      
      setArchivedNews(newsWithRead)
    } catch (error) {
      console.error('Error fetching archived news:', error)
    } finally {
      setLoading(false)
    }
  }

  return { archivedNews, loading, fetchArchived }
}
