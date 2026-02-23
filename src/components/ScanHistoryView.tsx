'use client'

import { type Scan } from '@/hooks/useScans'

interface Props {
  scans: Scan[]
  loading: boolean
  selectedScanId?: string
  onSelectScan: (id: string) => void
}

export default function ScanHistoryView({ scans, loading, selectedScanId, onSelectScan }: Props) {
  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading scan history...</div>
  }

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400 border-green-500/30',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/10 text-red-400 border-red-500/30'
    }
    return styles[status] || styles.pending
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">📄 Scan History</h2>
        <p className="text-slate-400 mt-1">{scans.length} scans completed</p>
      </div>

      <div className="grid gap-4">
        {scans.map((scan) => (
          <div
            key={scan.id}
            onClick={() => onSelectScan(scan.id)}
            className={`p-5 rounded-xl border transition cursor-pointer ${
              selectedScanId === scan.id
                ? 'bg-slate-800 border-indigo-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {scan.company_name ? `${scan.company_name} — ` : ''}{scan.industry}
                </h3>
                {scan.company_url && (
                  <p className="text-xs text-indigo-400 mt-0.5">{scan.company_url}</p>
                )}
                <p className="text-sm text-slate-400 mt-1">{formatDate(scan.created_at)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs border ${statusStyle(scan.status)}`}>
                {scan.status}
              </span>
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

            {scan.duration_seconds && (
              <p className="text-xs text-slate-500 mt-3">Completed in {scan.duration_seconds}s</p>
            )}
            
            {selectedScanId === scan.id && (
              <div className="mt-3 text-xs text-indigo-400">✓ Currently viewing this scan</div>
            )}
          </div>
        ))}
        {scans.length === 0 && (
          <div className="text-slate-400 text-center py-12">No scans yet. Click "New Scan" to get started!</div>
        )}
      </div>
    </div>
  )
}
