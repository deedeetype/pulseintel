'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useScans } from '@/hooks/useScans'
import { useCompetitors } from '@/hooks/useCompetitors'
import { useAlerts } from '@/hooks/useAlerts'
import { useInsights } from '@/hooks/useInsights'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Fetch scans first
  const { scans, loading: loadingScans } = useScans(10)
  const [selectedScanId, setSelectedScanId] = useState<string | undefined>(undefined)
  
  // Auto-select most recent scan
  if (!selectedScanId && scans.length > 0 && !loadingScans) {
    setSelectedScanId(scans[0].id)
  }
  
  // Fetch real data from Supabase filtered by selected scan
  const { competitors, loading: loadingCompetitors } = useCompetitors(selectedScanId)
  const { alerts, loading: loadingAlerts, markAsRead } = useAlerts(selectedScanId, 5)
  const { insights, loading: loadingInsights } = useInsights(selectedScanId, 2)
  
  const selectedScan = scans.find(s => s.id === selectedScanId)

  // Calculate KPIs from real data
  const activeCompetitorsCount = competitors.length
  const criticalAlertsCount = alerts.filter(a => a.priority === 'critical' && !a.read).length
  const newInsightsCount = insights.filter(i => {
    const created = new Date(i.created_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return created >= today
  }).length
  const avgMarketScore = competitors.length > 0
    ? (competitors.reduce((sum, c) => sum + (c.threat_score || 0), 0) / competitors.length).toFixed(1)
    : '0.0'

  // Top 3 competitors by threat score
  const topCompetitors = competitors.slice(0, 3)

  // Format time ago
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            PulseIntel
          </Link>
        </div>
        
        <nav className="px-3 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'competitors', label: 'Competitors', icon: '🎯' },
            { id: 'news', label: 'News Feed', icon: '📰' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'alerts', label: 'Alerts', icon: '🔔', badge: criticalAlertsCount },
            { id: 'insights', label: 'AI Insights', icon: '🤖' },
            { id: 'reports', label: 'Reports', icon: '📄' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              D
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">David</div>
              <div className="text-xs text-slate-400">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, David 👋
              </h1>
              <p className="text-slate-400">
                Here's what's happening with your competitive landscape
              </p>
            </div>
            
            {/* Scan Selector */}
            {!loadingScans && scans.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-400">Viewing:</label>
                <select
                  value={selectedScanId}
                  onChange={(e) => setSelectedScanId(e.target.value)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  {scans.map((scan) => {
                    const date = new Date(scan.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    const time = new Date(scan.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })
                    return (
                      <option key={scan.id} value={scan.id}>
                        {scan.industry} - {date} at {time}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Active Competitors',
              value: loadingCompetitors ? '...' : activeCompetitorsCount.toString(),
              change: 'Tracked',
              trend: 'neutral',
              color: 'blue',
            },
            {
              label: 'Critical Alerts',
              value: loadingAlerts ? '...' : criticalAlertsCount.toString(),
              change: 'Requires attention',
              trend: criticalAlertsCount > 0 ? 'alert' : 'neutral',
              color: 'red',
            },
            {
              label: 'New Insights',
              value: loadingInsights ? '...' : newInsightsCount.toString(),
              change: 'Generated today',
              trend: 'up',
              color: 'green',
            },
            {
              label: 'Avg Threat Score',
              value: loadingCompetitors ? '...' : avgMarketScore,
              change: 'Market average',
              trend: 'neutral',
              color: 'purple',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">{kpi.label}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    kpi.trend === 'up'
                      ? 'bg-green-500/10 text-green-500'
                      : kpi.trend === 'alert'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-2">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Activity & Top Competitors */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🔔 Recent Alerts
            </h2>
            {loadingAlerts ? (
              <div className="text-slate-400 text-center py-8">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-slate-400 text-center py-8">No alerts yet</div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => markAsRead(alert.id)}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        alert.priority === 'critical'
                          ? 'bg-red-500'
                          : alert.priority === 'attention'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">{alert.title}</div>
                      <div className="text-sm text-slate-400">
                        {alert.category && `${alert.category} · `}
                        {timeAgo(alert.created_at)}
                      </div>
                    </div>
                    {!alert.read && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
              View all alerts →
            </button>
          </div>

          {/* Top Competitors */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🎯 Top Competitors
            </h2>
            {loadingCompetitors ? (
              <div className="text-slate-400 text-center py-8">Loading competitors...</div>
            ) : topCompetitors.length === 0 ? (
              <div className="text-slate-400 text-center py-8">No competitors yet</div>
            ) : (
              <div className="space-y-3">
                {topCompetitors.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {comp.name[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium">{comp.name}</div>
                        <div className="text-sm text-slate-400">
                          Activity: {comp.activity_level || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {comp.threat_score?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400">Threat Score</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
              View all competitors →
            </button>
          </div>
        </div>

        {/* Market Trends Chart Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📈 Market Dynamics
          </h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-slate-400">Chart visualization coming soon</div>
              <div className="text-sm text-slate-500 mt-2">
                {loadingCompetitors ? 'Loading data...' : `Tracking ${activeCompetitorsCount} competitors`}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🤖 AI-Generated Insights
          </h2>
          {loadingInsights ? (
            <div className="text-slate-300 text-center py-8">Loading insights...</div>
          ) : insights.length === 0 ? (
            <div className="text-slate-300 text-center py-8">No insights generated yet</div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {insight.type === 'threat' ? '⚠️' : 
                       insight.type === 'opportunity' ? '💡' :
                       insight.type === 'trend' ? '📈' : '🎯'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-slate-300 text-sm mb-3">
                        {insight.description}
                      </p>
                      {insight.confidence && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-400">Confidence:</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full max-w-xs">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{width: `${insight.confidence * 100}%`}}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                      )}
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                        View detailed analysis →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
