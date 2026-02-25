'use client'

import { useEffect, useState } from 'react'
import { type Scan } from '@/hooks/useScans'
import { Eye, RefreshCw, Search, Trash2, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface RefreshLog {
  id: string
  completed_at: string
  new_alerts_count: number
  new_insights_count: number
  status: string
}

interface Props {
  scans: Scan[]
  loading: boolean
  selectedScanId?: string
  onSelectScan: (id: string) => void
  onRefreshProfile?: (id: string) => void
  onFullRescan?: (id: string) => void
  onDeleteProfile?: (id: string) => void
}

export default function ProfilesView({ scans, loading, selectedScanId, onSelectScan, onRefreshProfile, onFullRescan, onDeleteProfile }: Props) {
  const [refreshLogs, setRefreshLogs] = useState<Record<string, RefreshLog>>({})
  
  useEffect(() => {
    if (scans.length > 0) {
      fetchLatestRefreshLogs()
    }
  }, [scans])
  
  const fetchLatestRefreshLogs = async () => {
    const scanIds = scans.map(s => s.id)
    const { data, error } = await supabase
      .from('refresh_logs')
      .select('id, scan_id, completed_at, new_alerts_count, new_insights_count, status')
      .in('scan_id', scanIds)
      .eq('triggered_by', 'scheduled')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
    
    if (!error && data) {
      // Group by scan_id, keep only the most recent
      const logsMap: Record<string, RefreshLog> = {}
      data.forEach(log => {
        if (!logsMap[log.scan_id]) {
          logsMap[log.scan_id] = log
        }
      })
      setRefreshLogs(logsMap)
    }
  }
  
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }
  
  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading profiles...</div>
  }

  // Deduplicate scans: keep only the most recent one per industry+company_url
  const uniqueProfiles = scans.reduce((acc, scan) => {
    const key = `${scan.industry}|${scan.company_url || ''}`
    const existing = acc.get(key)
    if (!existing || new Date(scan.updated_at || scan.created_at) > new Date(existing.updated_at || existing.created_at)) {
      acc.set(key, scan)
    }
    return acc
  }, new Map<string, Scan>())
  
  const profiles = Array.from(uniqueProfiles.values())

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    })
  }

  const formatLastUpdate = (scan: Scan) => {
    const updateDate = scan.last_refreshed_at || scan.updated_at || scan.created_at
    return formatDate(updateDate)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Eye className="w-6 h-6" />
          My Watch
        </h2>
        <p className="text-slate-400 mt-1">{profiles.length} research profile{profiles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid gap-4">
        {profiles.map((scan) => (
          <div
            key={scan.id}
            className={`p-5 rounded-xl border transition ${
              selectedScanId === scan.id
                ? 'bg-slate-800 border-indigo-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => onSelectScan(scan.id)}>
                <h3 className="text-lg font-bold text-white">
                  {scan.company_name ? `${scan.company_name} — ` : ''}{scan.industry}
                </h3>
                {scan.company_url && (
                  <p className="text-xs text-indigo-400 mt-0.5">{scan.company_url}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                  <span>Last updated: {formatLastUpdate(scan)}</span>
                  {scan.refresh_count > 0 && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      {scan.refresh_count}x
                    </span>
                  )}
                </div>
                
                {/* Auto-refresh badge */}
                {refreshLogs[scan.id] && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">Auto-refreshed {formatTimeAgo(refreshLogs[scan.id].completed_at)}</span>
                      </div>
                      {(refreshLogs[scan.id].new_insights_count > 0 || refreshLogs[scan.id].new_alerts_count > 0) && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>•</span>
                          {refreshLogs[scan.id].new_insights_count > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {refreshLogs[scan.id].new_insights_count} insights
                            </span>
                          )}
                          {refreshLogs[scan.id].new_alerts_count > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {refreshLogs[scan.id].new_alerts_count} alerts
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                {onRefreshProfile && (
                  <button
                    onClick={() => onRefreshProfile(scan.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    title="Refresh with latest data (incremental)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                )}
                {onFullRescan && (
                  <button
                    onClick={() => onFullRescan(scan.id)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    title="Full rescan from scratch"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Full Rescan
                  </button>
                )}
                {onDeleteProfile && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete this profile and all its data?\n\nIndustry: ${scan.industry}\n${scan.company_name ? `Company: ${scan.company_name}\n` : ''}This action cannot be undone.`)) {
                        onDeleteProfile(scan.id)
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    title="Delete profile and all data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{scan.competitors_count}</div>
                <div className="text-xs text-slate-400">Competitors</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{scan.alerts_count}</div>
                <div className="text-xs text-slate-400">Alerts</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{scan.insights_count}</div>
                <div className="text-xs text-slate-400">Insights</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{scan.news_count}</div>
                <div className="text-xs text-slate-400">News</div>
              </div>
            </div>

            {selectedScanId === scan.id && (
              <div className="mt-3 text-xs text-indigo-400">✓ Currently viewing this profile</div>
            )}
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-slate-400 text-center py-12">No profiles yet. Click "New Scan" to create your first research profile!</div>
        )}
      </div>
    </div>
  )
}
