'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

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

interface NewsFeedContextType {
  news: NewsItem[]
  loading: boolean
  error: string | null
  markAsRead: (id: string) => void
  refetch: () => void
  unreadCount: number
  setScanFilter: (scanId: string | undefined) => void
}

const NewsFeedContext = createContext<NewsFeedContextType | undefined>(undefined)

export function NewsFeedProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanFilter, setScanFilter] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchNews()
  }, [scanFilter])

  async function fetchNews() {
    try {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const supabase = createSupabaseClient(token || undefined)
      
      let query = supabase
        .from('news_feed')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      
      if (scanFilter) {
        query = query.eq('scan_id', scanFilter)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

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

  function markAsRead(newsId: string) {
    // Optimistic update - UI changes immediately
    setNews(prev => prev.map(n => 
      n.id === newsId ? { ...n, read: true } : n
    ))

    try {
      // Update localStorage
      const readStatus = JSON.parse(localStorage.getItem('pulseintel_news_read') || '{}')
      readStatus[newsId] = true
      localStorage.setItem('pulseintel_news_read', JSON.stringify(readStatus))
    } catch (err: any) {
      console.error('Error marking news as read:', err)
    }
  }

  const unreadCount = news.filter(n => !n.read).length

  return (
    <NewsFeedContext.Provider value={{ 
      news, 
      loading, 
      error, 
      markAsRead, 
      refetch: fetchNews,
      unreadCount,
      setScanFilter
    }}>
      {children}
    </NewsFeedContext.Provider>
  )
}

export function useNewsFeedContext() {
  const context = useContext(NewsFeedContext)
  if (!context) {
    throw new Error('useNewsFeedContext must be used within NewsFeedProvider')
  }
  return context
}
