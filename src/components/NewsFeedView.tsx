'use client'

import { useState } from 'react'
import { useNewsFeedContext } from '@/contexts/NewsFeedContext'
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

export default function NewsFeedView() {
  const { news, loading, markAsRead } = useNewsFeedContext()
  const [selectedNews, setSelectedNews] = useState<any | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'read' | 'unread'>('all')

  const filteredNews = news.filter(item => {
    if (filterMode === 'unread') return !item.read
    if (filterMode === 'read') return item.read
    return true
  })

  const sentimentStyle = (sentiment: string | null) => {
    const styles: Record<string, string> = {
      positive: 'bg-green-500/10 text-green-400',
      neutral: 'bg-slate-500/10 text-slate-400',
      negative: 'bg-red-500/10 text-red-400'
    }
    return styles[sentiment || 'neutral'] || styles.neutral
  }

  const SentimentIcon = ({ sentiment }: { sentiment: string | null }) => {
    const iconClass = "w-4 h-4"
    switch (sentiment) {
      case 'positive': return <TrendingUp className={iconClass} />
      case 'negative': return <TrendingDown className={iconClass} />
      default: return <Minus className={iconClass} />
    }
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
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Newspaper className="w-6 h-6" />
          News Feed
        </h2>
        <p className="text-slate-400 mt-1">
          {news.length} articles{news.filter(n => !n.read).length > 0 && <> · <span className="text-indigo-400">{news.filter(n => !n.read).length} unread</span></>}
        </p>
      </div>

      {/* Filter buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            filterMode === 'all'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterMode('unread')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            filterMode === 'unread'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          Unread ({news.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setFilterMode('read')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            filterMode === 'read'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          Read ({news.filter(n => n.read).length})
        </button>
      </div>

      {/* News List with inline expansion */}
      <div className="grid gap-3">
        {filteredNews.map((item) => (
          <div key={item.id}>
            <div
              onClick={() => { 
                setSelectedNews(selectedNews?.id === item.id ? null : item)
                if (!item.read) markAsRead(item.id)
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                selectedNews?.id === item.id
                  ? 'bg-slate-800 border-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {!item.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium line-clamp-2">{item.title}</h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {item.source && (
                    <span className="text-xs text-indigo-400">{item.source}</span>
                  )}
                  <span className="text-xs text-slate-500">{timeAgo(item)}</span>
                  {item.sentiment && (
                    <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${sentimentStyle(item.sentiment)}`}>
                      <SentimentIcon sentiment={item.sentiment} />
                      {item.sentiment}
                    </span>
                  )}
                  {item.relevance_score && (
                    <span className="text-xs text-slate-500">
                      {Math.round(item.relevance_score * 100)}% relevant
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded details below the card */}
            {selectedNews?.id === item.id && (
              <div className="bg-slate-800/50 border border-indigo-500/30 rounded-b-xl -mt-3 pt-5 px-6 pb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  
                  {item.summary && (
                    <p className="text-slate-300 leading-relaxed mb-4">{item.summary}</p>
                  )}
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                        Read full article <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {item.source && (
                      <span className="text-sm text-slate-400">{item.source}</span>
                    )}
                    <span className="text-xs text-slate-500">{formatDate(item)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredNews.length === 0 && (
          <div className="text-slate-400 text-center py-12">
            {filterMode === 'unread' && 'No unread articles'}
            {filterMode === 'read' && 'No read articles yet'}
            {filterMode === 'all' && 'No news articles found'}
          </div>
        )}
      </div>
    </div>
  )
}
