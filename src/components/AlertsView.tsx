'use client'

import { useState } from 'react'
import { useAlertsContext } from '@/contexts/AlertsContext'
import { type Alert } from '@/lib/supabase'
import { DollarSign, Rocket, Users, Newspaper, TrendingUp, FileText, Bell } from 'lucide-react'

export default function AlertsView() {
  const { alerts, loading, markAsRead } = useAlertsContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filtered = alerts.filter(a => {
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false
    if (filterCategory !== 'all' && a.category !== filterCategory) return false
    return true
  })

  const priorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-400 border-red-500/30',
      attention: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      info: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    }
    return styles[priority] || styles.info
  }

  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = { critical: 'bg-red-500', attention: 'bg-yellow-500', info: 'bg-blue-500' }
    return colors[priority] || colors.info
  }

  const CategoryIcon = ({ category }: { category: string | null }) => {
    const iconClass = "w-5 h-5"
    switch (category) {
      case 'funding': return <DollarSign className={iconClass} />
      case 'product': return <Rocket className={iconClass} />
      case 'hiring': return <Users className={iconClass} />
      case 'news': return <Newspaper className={iconClass} />
      case 'market': return <TrendingUp className={iconClass} />
      default: return <FileText className={iconClass} />
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading alerts...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Alerts
          </h2>
          <p className="text-slate-400 mt-1">
            {alerts.filter(a => !a.read).length} unread · {alerts.filter(a => a.priority === 'critical').length} critical
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="attention">Attention</option>
            <option value="info">Info</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="funding">Funding</option>
            <option value="product">Product</option>
            <option value="hiring">Hiring</option>
            <option value="news">News</option>
            <option value="market">Market</option>
          </select>
        </div>
      </div>

      {/* Alerts List with Accordion */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const isExpanded = expandedId === alert.id
          
          return (
            <div
              key={alert.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                isExpanded ? 'border-indigo-500/50' : 'border-slate-800'
              }`}
            >
              {/* Alert Header - Always Visible */}
              <div
                onClick={() => {
                  setExpandedId(isExpanded ? null : alert.id)
                  if (!alert.read) markAsRead(alert.id)
                }}
                className={`flex items-start gap-4 p-4 cursor-pointer transition ${
                  isExpanded ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${priorityDot(alert.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{alert.title}</span>
                    {!alert.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>}
                  </div>
                  {!isExpanded && alert.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{alert.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityStyle(alert.priority)}`}>
                      {alert.priority}
                    </span>
                    {alert.category && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <CategoryIcon category={alert.category} />
                        {alert.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{timeAgo(alert.created_at)}</span>
                  </div>
                </div>
                <div className="text-slate-500 text-sm flex-shrink-0">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </div>

              {/* Expanded Content - Accordion */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-slate-800/30 border-t border-slate-700/50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <CategoryIcon category={alert.category} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{alert.title}</h3>
                      {alert.description && (
                        <p className="text-slate-300 leading-relaxed">{alert.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4">
                    {alert.source_url && (
                      <a 
                        href={alert.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        View source ↗
                      </a>
                    )}
                    {!alert.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(alert.id)
                        }}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-slate-400 text-center py-12">No alerts found</div>
        )}
      </div>
    </div>
  )
}
