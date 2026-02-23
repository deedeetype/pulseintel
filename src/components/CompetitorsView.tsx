'use client'

import { useState } from 'react'
import { type Competitor } from '@/lib/supabase'

interface Props {
  competitors: Competitor[]
  loading: boolean
}

export default function CompetitorsView({ competitors, loading }: Props) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [sortBy, setSortBy] = useState<'threat_score' | 'name' | 'activity_level'>('threat_score')
  const [filterActivity, setFilterActivity] = useState<string>('all')

  const sorted = [...competitors].sort((a, b) => {
    if (sortBy === 'threat_score') return (b.threat_score || 0) - (a.threat_score || 0)
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'activity_level') {
      const order = { high: 3, medium: 2, low: 1 }
      return (order[b.activity_level || 'low'] || 0) - (order[a.activity_level || 'low'] || 0)
    }
    return 0
  })

  const filtered = filterActivity === 'all' ? sorted : sorted.filter(c => c.activity_level === filterActivity)

  const threatColor = (score: number | null) => {
    if (!score) return 'text-slate-400'
    if (score >= 8) return 'text-red-400'
    if (score >= 6) return 'text-yellow-400'
    if (score >= 4) return 'text-blue-400'
    return 'text-green-400'
  }

  const activityBadge = (level: string | null) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500/10 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      low: 'bg-green-500/10 text-green-400 border-green-500/30'
    }
    return colors[level || 'low'] || colors.low
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading competitors...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Competitors</h2>
          <p className="text-slate-400 mt-1">{competitors.length} competitors tracked</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm"
          >
            <option value="all">All Activity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm"
          >
            <option value="threat_score">Sort: Threat Score</option>
            <option value="name">Sort: Name</option>
            <option value="activity_level">Sort: Activity</option>
          </select>
        </div>
      </div>

      {/* Competitors List with inline detail */}
      <div className="grid gap-3">
        {filtered.map((comp) => (
          <div key={comp.id}>
            <div
              onClick={() => setSelectedCompetitor(selectedCompetitor?.id === comp.id ? null : comp)}
              className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                selectedCompetitor?.id === comp.id
                  ? 'bg-slate-800 border-indigo-500/50 rounded-b-none'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {comp.name[0]}
                </div>
                <div>
                  <div className="text-white font-medium">{comp.name}</div>
                  <div className="text-sm text-slate-400">
                    {comp.domain || comp.industry || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-2 py-1 rounded-full text-xs border ${activityBadge(comp.activity_level)}`}>
                  {comp.activity_level || 'N/A'}
                </span>
                <div className="text-right w-16">
                  <div className={`text-lg font-bold ${threatColor(comp.threat_score)}`}>
                    {comp.threat_score?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">Threat</div>
                </div>
                <span className={`text-slate-400 transition-transform ${selectedCompetitor?.id === comp.id ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </div>

            {/* Inline detail panel */}
            {selectedCompetitor?.id === comp.id && (
              <div className="bg-slate-800 border border-t-0 border-indigo-500/50 rounded-b-xl p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Threat Score</div>
                    <div className={`text-xl font-bold ${threatColor(comp.threat_score)}`}>
                      {comp.threat_score?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Activity</div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${activityBadge(comp.activity_level)}`}>
                      {comp.activity_level || 'Unknown'}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Employees</div>
                    <div className="text-lg font-bold text-white">
                      {comp.employee_count ? comp.employee_count.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Industry</div>
                    <div className="text-sm text-white">{comp.industry || 'N/A'}</div>
                  </div>
                </div>
                {comp.description && (
                  <p className="text-slate-300 text-sm leading-relaxed">{comp.description}</p>
                )}
                {comp.domain && (
                  <a href={`https://${comp.domain}`} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 text-indigo-400 hover:text-indigo-300 text-sm">
                    Visit {comp.domain} ↗
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-slate-400 text-center py-12">No competitors found</div>
        )}
      </div>
    </div>
  )
}
