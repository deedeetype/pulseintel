'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface NewsItem {
  id: string
  title: string
  summary: string | null
  source: string | null
  source_url: string | null
  relevance_score: number | null
  sentiment: string | null
  tags: string[] | null
  created_at: string
}

interface Props {
  scanId?: string
}

export default function NewsFeedView({ scanId }: Props) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase.from('news_feed').select('*').order('created_at', { ascending: false })
      if (scanId) query = query.eq('scan_id', scanId)
      const { data } = await query
      setNews(data || [])
      setLoading(false)
    }
    fetch()
  }, [scanId])

  const sentimentStyle = (sentiment: string | null) => {
    const styles: Record<string, string> = {
      positive: 'bg-green-500/10 text-green-400',
      neutral: 'bg-slate-500/10 text-slate-400',
      negative: 'bg-red-500/10 text-red-400'
    }
    return styles[sentiment || 'neutral'] || styles.neutral
  }

  const timeAgo = (date: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(date).getTime()) / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading news...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">📰 News Feed</h2>
        <p className="text-slate-400 mt-1">{news.length} articles collected</p>
      </div>

      {/* Detail Panel */}
      {selectedNews && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedNews.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                {selectedNews.source && (
                  <span className="text-sm text-indigo-400">{selectedNews.source}</span>
                )}
                <span className="text-xs text-slate-500">{timeAgo(selectedNews.created_at)}</span>
                {selectedNews.sentiment && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${sentimentStyle(selectedNews.sentiment)}`}>
                    {selectedNews.sentiment}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedNews(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
          </div>
          
          {selectedNews.summary && (
            <p className="text-slate-300 mt-4 leading-relaxed">{selectedNews.summary}</p>
          )}
          
          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedNews.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {selectedNews.source_url && (
            <a href={selectedNews.source_url} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
              Read full article ↗
            </a>
          )}
        </div>
      )}

      {/* News List */}
      <div className="grid gap-3">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedNews(item)}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedNews?.id === item.id
                ? 'bg-slate-800 border-indigo-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.title}</h3>
                {item.summary && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {item.source && <span className="text-xs text-indigo-400">{item.source}</span>}
                  <span className="text-xs text-slate-500">{timeAgo(item.created_at)}</span>
                  {item.tags && item.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs text-slate-500">#{tag}</span>
                  ))}
                </div>
              </div>
              {item.source_url && (
                <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-400 hover:text-indigo-300 text-sm flex-shrink-0">
                  ↗
                </a>
              )}
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <div className="text-slate-400 text-center py-12">No news articles found. Run a scan to collect news!</div>
        )}
      </div>
    </div>
  )
}
