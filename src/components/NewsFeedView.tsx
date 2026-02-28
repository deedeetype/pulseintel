'use client'

import { useState, useEffect } from 'react'
import { useNewsFeedContext } from '@/contexts/NewsFeedContext'
import { useNewsActions } from '@/hooks/useNewsActions'
import { useArchivedNews } from '@/hooks/useArchivedNews'
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Calendar, Archive, Trash2, MoreVertical } from 'lucide-react'

export default function NewsFeedView() {
  const { news, loading, markAsRead, archiveNewsOptimistic, refetch } = useNewsFeedContext()
  const { archivedNews, archivedCount, loading: archivedLoading, fetchArchived, fetchArchivedCount } = useArchivedNews()
  const { archiveNews, unarchiveNews, deleteNews, loading: actionLoading } = useNewsActions()
  const [selectedNews, setSelectedNews] = useState<any | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'read' | 'unread'>('all')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  
  useEffect(() => {
    // Fetch archived count on mount
    fetchArchivedCount()
  }, [])
  
  useEffect(() => {
    if (showArchived) {
      fetchArchived()
    }
  }, [showArchived])

  const displayNews = showArchived ? archivedNews : news
  
  const filteredNews = displayNews.filter(item => {
    if (filterMode === 'unread') return !item.read
    if (filterMode === 'read') return item.read
    return true
  })
  
  // Group news by date
  const groupNewsByDate = (newsItems: any[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)
    
    const groups: Record<string, any[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    }
    
    newsItems.forEach(item => {
      const publishedDate = new Date(item.published_at || item.created_at)
      publishedDate.setHours(0, 0, 0, 0)
      
      if (publishedDate.getTime() === today.getTime()) {
        groups['Today'].push(item)
      } else if (publishedDate.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(item)
      } else if (publishedDate >= thisWeekStart) {
        groups['This Week'].push(item)
      } else {
        groups['Older'].push(item)
      }
    })
    
    return groups
  }
  
  const groupedNews = groupNewsByDate(filteredNews)

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

  const handleArchive = async (newsId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      archiveNewsOptimistic(newsId)
      
      // Then update backend
      await archiveNews(newsId)
      
      // Update archived count
      await fetchArchivedCount()
    } catch (error) {
      // If backend fails, refetch to restore accurate state
      await refetch()
      alert('Failed to archive news')
    }
  }

  const handleUnarchive = async (newsId: string) => {
    try {
      await unarchiveNews(newsId)
      // Refresh both lists
      await fetchArchived()
      await refetch()
      await fetchArchivedCount()
    } catch (error) {
      alert('Failed to unarchive news')
    }
  }

  const handleDelete = async (newsId: string) => {
    try {
      await deleteNews(newsId)
      setConfirmDelete(null)
      await refetch()
    } catch (error) {
      alert('Failed to delete news')
    }
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
      <div className="mb-4 flex gap-2 flex-wrap">
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
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          {showArchived ? 'Hide' : 'Show'} Archived {archivedCount > 0 && `(${archivedCount})`}
        </button>
      </div>

      {/* News List with inline expansion - Grouped by date */}
      <div className="space-y-6">
        {Object.entries(groupedNews).map(([groupName, items]) => {
          if (items.length === 0) return null
          
          return (
            <div key={groupName}>
              {/* Date Group Header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  {groupName}
                </h3>
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-xs text-slate-500">{items.length} article{items.length > 1 ? 's' : ''}</span>
              </div>
              
              {/* News items in this group */}
              <div className="grid gap-3">
                {items.map((item) => (
          <div key={item.id}>
            <div
              className={`flex items-start gap-4 p-4 rounded-xl border transition relative ${
                selectedNews?.id === item.id
                  ? 'bg-slate-800 border-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {!item.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
              <div 
                onClick={() => { 
                  setSelectedNews(selectedNews?.id === item.id ? null : item)
                  if (!item.read) markAsRead(item.id)
                }}
                className="flex-1 min-w-0 cursor-pointer">
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
              
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(showMenu === item.id ? null : item.id)
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition"
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
                
                {showMenu === item.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                    {!showArchived ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchive(item.id)
                            setShowMenu(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                          disabled={actionLoading}
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(item.id)
                            setShowMenu(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-b-lg"
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnarchive(item.id)
                            setShowMenu(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                          disabled={actionLoading}
                        >
                          <Archive className="w-4 h-4" />
                          Unarchive
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(item.id)
                            setShowMenu(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-b-lg"
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
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
              </div>
            </div>
          )
        })}

        {filteredNews.length === 0 && (
          <div className="text-slate-400 text-center py-12">
            {filterMode === 'unread' && 'No unread articles'}
            {filterMode === 'read' && 'No read articles yet'}
            {filterMode === 'all' && 'No news articles found'}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Delete News Article?</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. The article will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
