import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface NewsItem {
  id: string
  title: string
  summary: string | null
  source: string | null
  source_url: string | null
  relevance_score: number | null
  sentiment: string | null
  tags: string[] | null
  published_at: string | null
  created_at: string
  scan_id: string
  read?: boolean
}

export function useNewsFeed(scanId?: string) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()

    // Subscribe to changes
    const subscription = supabase
      .channel('news_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'news_feed' },
        () => { fetchNews() }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [scanId])

  async function fetchNews() {
    try {
      // Get from news_feed table
      let query = supabase
        .from('news_feed')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      
      if (scanId) {
        query = query.eq('scan_id', scanId)
      }

      const { data, error } = await query
      if (error) throw error

      // Get read status from localStorage
      const readStatus = JSON.parse(localStorage.getItem('pulseintel_news_read') || '{}')
      const newsWithRead = (data || []).map(item => ({
        ...item,
        read: readStatus[item.id] || false
      }))
      
      setNews(newsWithRead)
    } catch (err: any) {
      console.error('Error fetching news:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(newsId: string) {
    try {
      // Update localStorage
      const readStatus = JSON.parse(localStorage.getItem('pulseintel_news_read') || '{}')
      readStatus[newsId] = true
      localStorage.setItem('pulseintel_news_read', JSON.stringify(readStatus))
      
      // Update local state
      setNews(prev => prev.map(n => n.id === newsId ? { ...n, read: true } : n))
    } catch (err: any) {
      console.error('Error marking news as read:', err)
    }
  }

  const unreadCount = news.filter(n => !n.read).length

  return { news, loading, error, refetch: fetchNews, markAsRead, unreadCount }
}