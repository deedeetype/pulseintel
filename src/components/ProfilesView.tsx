'use client'

import { type Scan } from '@/hooks/useScans'

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
        <h2 className="text-2xl font-bold text-white">👁️ My Watch</h2>
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
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs">
                      🔄 Refreshed {scan.refresh_count}x
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {onRefreshProfile && (
                  <button
                    onClick={() => onRefreshProfile(scan.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    title="Refresh with latest data (incremental)"
                  >
                    🔄 Refresh
                  </button>
                )}
                {onFullRescan && (
                  <button
                    onClick={() => onFullRescan(scan.id)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                    title="Full rescan from scratch"
                  >
                    ⚡ Full Rescan
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
                    🗑️ Delete
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
