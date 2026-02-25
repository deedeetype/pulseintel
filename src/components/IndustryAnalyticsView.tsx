'use client'

import { BarChart3, DollarSign, TrendingUp, Lightbulb, Globe, Users, Calendar } from 'lucide-react'

interface AnalyticsData {
  market_size_billions: number
  market_size_year: number
  projected_size_billions: number
  projected_year: number
  cagr_percent: number
  top_segments: { name: string; share_percent: number }[]
  growth_drivers: string[]
  key_trends: { trend: string; impact: string; description: string }[]
  funding_activity: { total_billions: number; deal_count: number; avg_deal_millions: number; yoy_change_percent: number }
  market_leaders_share: { name: string; share_percent: number }[]
  regional_distribution: { region: string; share_percent: number }[]
  sources?: { name: string; url: string }[]
}

interface Props {
  analytics: AnalyticsData | null
  industry: string
  loading?: boolean
}

const COLORS = ['bg-indigo-500', 'bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-teal-500']
const TEXT_COLORS = ['text-indigo-400', 'text-cyan-400', 'text-purple-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-blue-400', 'text-teal-400']

function BarChart({ items, maxValue }: { items: { label: string; value: number; suffix?: string }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...items.map(i => i.value), 1)
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{item.label}</span>
            <span className="text-white font-medium">{item.value}{item.suffix || '%'}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${COLORS[i % COLORS.length]}`}
              style={{ width: `${Math.min((item.value / max) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ segments }: { segments: { name: string; share_percent: number }[] }) {
  // CSS conic-gradient donut
  let cumulative = 0
  const gradientStops = segments.map((seg, i) => {
    const start = cumulative
    cumulative += seg.share_percent
    const hue = [220, 180, 270, 150, 40, 340, 200, 160][i % 8]
    return `hsl(${hue}, 70%, 55%) ${start}% ${cumulative}%`
  }).join(', ')

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <div
          className="w-36 h-36 rounded-full"
          style={{ background: `conic-gradient(${gradientStops})` }}
        />
        <div className="absolute inset-4 bg-slate-900 rounded-full" />
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`} />
            <span className="text-slate-300">{seg.name}</span>
            <span className="text-white font-medium ml-auto">{seg.share_percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IndustryAnalyticsView({ analytics, industry, loading }: Props) {
  if (loading) {
    return <div className="text-slate-400 text-center py-20">Loading analytics...</div>
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <div className="mb-4 flex justify-center">
          <BarChart3 className="w-16 h-16 text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900 mb-2">Industry Analytics</h2>
        <p className="text-slate-400 light:text-slate-600">
          {industry ? `No analytics data available for ${industry} yet.` : 'Select a scan to view industry analytics.'}
        </p>
        <p className="text-slate-500 light:text-slate-500 text-sm mt-2">
          Run a new scan to generate AI-powered market intelligence.
        </p>
      </div>
    )
  }

  const growth = analytics.projected_size_billions - analytics.market_size_billions
  const growthPercent = ((growth / analytics.market_size_billions) * 100).toFixed(0)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          {industry} — Industry Analytics
        </h2>
        <p className="text-slate-400 mt-1">AI-generated market intelligence based on latest data</p>
      </div>

      {/* Market Size Hero */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
          <h3 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Current Market Size
          </h3>
          <div className="text-4xl font-bold text-white">${analytics.market_size_billions}B</div>
          <p className="text-slate-400 text-sm mt-1">{analytics.market_size_year}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="text-sm font-medium text-cyan-300 mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Projected Market Size
          </h3>
          <div className="text-4xl font-bold text-white">${analytics.projected_size_billions}B</div>
          <p className="text-slate-400 text-sm mt-1">by {analytics.projected_year} (+{growthPercent}%)</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 rounded-xl p-6">
          <h3 className="text-sm font-medium text-emerald-300 mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            CAGR
          </h3>
          <div className="text-4xl font-bold text-white">{analytics.cagr_percent}%</div>
          <p className="text-slate-400 text-sm mt-1">Compound Annual Growth Rate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Market Segments */}
        {analytics.top_segments && analytics.top_segments.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Segments
            </h3>
            <DonutChart segments={analytics.top_segments} />
          </div>
        )}

        {/* Regional Distribution */}
        {analytics.regional_distribution && analytics.regional_distribution.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Distribution
            </h3>
            <BarChart
              items={analytics.regional_distribution.map(r => ({ label: r.region, value: r.share_percent }))}
              maxValue={100}
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Market Leaders Share */}
        {analytics.market_leaders_share && analytics.market_leaders_share.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">👑 Market Leaders</h3>
            <BarChart
              items={analytics.market_leaders_share.map(m => ({ label: m.name, value: m.share_percent }))}
              maxValue={Math.max(...analytics.market_leaders_share.map(m => m.share_percent)) * 1.2}
            />
          </div>
        )}

        {/* Funding Activity */}
        {analytics.funding_activity && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Funding Activity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">${analytics.funding_activity.total_billions}B</div>
                <div className="text-xs text-slate-400 mt-1">Total Funding</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{analytics.funding_activity.deal_count}</div>
                <div className="text-xs text-slate-400 mt-1">Deals</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">${analytics.funding_activity.avg_deal_millions}M</div>
                <div className="text-xs text-slate-400 mt-1">Avg Deal Size</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${analytics.funding_activity.yoy_change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.funding_activity.yoy_change_percent >= 0 ? '+' : ''}{analytics.funding_activity.yoy_change_percent}%
                </div>
                <div className="text-xs text-slate-400 mt-1">YoY Change</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Growth Drivers & Key Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {analytics.growth_drivers && analytics.growth_drivers.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Growth Drivers
            </h3>
            <div className="space-y-3">
              {analytics.growth_drivers.map((driver, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                    {i + 1}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed pt-1">{driver}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.key_trends && analytics.key_trends.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">📈 Key Trends</h3>
            <div className="space-y-3">
              {analytics.key_trends.map((t, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{t.trend}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      t.impact === 'high' ? 'bg-red-500/10 text-red-400'
                      : t.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>{t.impact}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sources */}
      {analytics.sources && analytics.sources.length > 0 && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">📚 Sources</h3>
          <div className="space-y-2">
            {analytics.sources.map((source, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 flex-shrink-0">[{i + 1}]</span>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-400 hover:text-indigo-300 truncate"
                  >
                    {source.name || source.url}
                  </a>
                ) : (
                  <span className="text-sm text-slate-300">{source.name}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3 italic">
            Data sourced from industry reports via Perplexity AI. Figures are estimates and may vary by source.
          </p>
        </div>
      )}
    </div>
  )
}
