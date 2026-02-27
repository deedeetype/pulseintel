'use client'

import { useState } from 'react'
import { type Insight } from '@/lib/supabase'
import { useNewsActions } from '@/hooks/useNewsActions'
import { Lightbulb, AlertTriangle, Sparkles, TrendingUp, Target, X } from 'lucide-react'
import ActionMenu from './ActionMenu'

interface Props {
  insights: Insight[]
  loading: boolean
}

export default function InsightsView({ insights, loading }: Props) {
  const { archiveInsight, deleteInsight } = useNewsActions()
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = filterType === 'all' ? insights : insights.filter(i => i.type === filterType)

  const TypeIcon = ({ type }: { type: string }) => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'threat': return <AlertTriangle className={iconClass} />
      case 'opportunity': return <Sparkles className={iconClass} />
      case 'trend': return <TrendingUp className={iconClass} />
      case 'recommendation': return <Target className={iconClass} />
      default: return <Lightbulb className={iconClass} />
    }
  }

  const typeStyle = (type: string) => {
    const styles: Record<string, string> = {
      threat: 'bg-red-500/10 text-red-400 border-red-500/30',
      opportunity: 'bg-green-500/10 text-green-400 border-green-500/30',
      trend: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      recommendation: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }
    return styles[type] || styles.recommendation
  }

  const impactStyle = (impact: string | null) => {
    const styles: Record<string, string> = {
      high: 'text-red-400',
      medium: 'text-yellow-400',
      low: 'text-green-400'
    }
    return styles[impact || 'medium'] || styles.medium
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading insights...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            AI Insights
          </h2>
          <p className="text-slate-400 mt-1">{insights.length} insights generated</p>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm"
        >
          <option value="all">All Types</option>
          <option value="threat">Threats</option>
          <option value="opportunity">Opportunities</option>
          <option value="trend">Trends</option>
          <option value="recommendation">Recommendations</option>
        </select>
      </div>

      {/* Detail Panel */}
      {selectedInsight && (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <TypeIcon type={selectedInsight.type} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${typeStyle(selectedInsight.type)}`}>
                    {selectedInsight.type}
                  </span>
                  {selectedInsight.impact && (
                    <span className={`text-xs ${impactStyle(selectedInsight.impact)}`}>
                      Impact: {selectedInsight.impact}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedInsight(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-slate-300 mt-4 leading-relaxed">{selectedInsight.description}</p>

          {selectedInsight.confidence && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-slate-400">Confidence:</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full max-w-xs">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedInsight.confidence * 100}%` }} />
              </div>
              <span className="text-sm text-indigo-300 font-medium">{Math.round(selectedInsight.confidence * 100)}%</span>
            </div>
          )}
          
          {selectedInsight.action_items && selectedInsight.action_items.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Recommended Actions:</h4>
              <ul className="space-y-2">
                {selectedInsight.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((insight) => (
          <div
            key={insight.id}
            className={`p-5 rounded-xl border transition relative ${
              selectedInsight?.id === insight.id
                ? 'bg-slate-800 border-indigo-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <TypeIcon type={insight.type} />
              </div>
              <div 
                onClick={() => setSelectedInsight(insight)}
                className="flex-1 cursor-pointer">
                <h3 className="text-white font-semibold mb-2">{insight.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-3">{insight.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${typeStyle(insight.type)}`}>
                    {insight.type}
                  </span>
                  {insight.confidence && (
                    <span className="text-xs text-slate-500">{Math.round(insight.confidence * 100)}% confidence</span>
                  )}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <ActionMenu
                  itemId={insight.id}
                  onArchive={archiveInsight}
                  onDelete={deleteInsight}
                  deleteConfirmTitle="Delete Insight?"
                  deleteConfirmMessage="This AI-generated insight will be permanently removed."
                />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-slate-400 text-center py-12 col-span-2">No insights found</div>
        )}
      </div>
    </div>
  )
}
