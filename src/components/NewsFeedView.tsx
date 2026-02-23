'use client'

import { useState } from 'react'
import { useNewsFeed } from '@/hooks/useNewsFeed'

interface Props {
  scanId?: string
  showAllScans?: boolean
  onToggleView?: (showAll: boolean) => void
}

export default function NewsFeedView({ scanId, showAllScans = false, onToggleView }: Props) {
  const { news, loading, markAsRead } = useNewsFeed(showAllScans ? undefined : scanId)
  const [selectedNews, setSelectedNews] = useState<any | null>(null)

  const sentimentStyle = (sentiment: string | null) => {
    const styles: Record<string, string> = {
      positive: 'bg-green-500/10 text-green-400',
      neutral: 'bg-slate-500/10 text-slate-400',
      negative: 'bg-red-500/10 text-red-400'
    }
    return styles[sentiment || 'neutral'] || styles.neutral
  }

  const formatDate = (item: any) => {
    const date = item.published_at || item.created_at
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const timeAgo = (item: any) => {
    const date = item.published_at || item.created_at
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
        <p className="text-slate-400 mt-1">
          {news.length} articles{news.filter(n => !n.read).length > 0 && <> · <span className="text-indigo-400">{news.filter(n => !n.read).length} unread</span></>}
        </p>
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
                <span className="text-xs text-slate-500">{timeAgo(selectedNews)}</span>
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
              {selectedNews.tags.map((tag: string, i: number) => (
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

      {/* Filter buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => onToggleView?.(false)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            !showAllScans
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          Current Scan
        </button>
        <button
          onClick={() => onToggleView?.(true)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            showAllScans
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          All Scans
        </button>
      </div>

      {/* News List */}
      <div className="grid gap-3">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedNews(item)
              if (!item.read) markAsRead(item.id)
            }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedNews?.id === item.id
                ? 'bg-slate-800 border-indigo-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  {!item.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>}
                </div>
                {item.summary && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {item.source && <span className="text-xs text-indigo-400">{item.source}</span>}
                  <span className="text-xs text-slate-500">{formatDate(item)}</span>
                  {item.tags && item.tags.slice(0, 3).map((tag: string, i: number) => (
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
