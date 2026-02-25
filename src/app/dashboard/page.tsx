'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useUser, UserButton, useAuth } from '@clerk/nextjs'
import { useScans } from '@/hooks/useScans'
import { useCompetitors } from '@/hooks/useCompetitors'
import { useInsights } from '@/hooks/useInsights'
import { useAlertsContext } from '@/contexts/AlertsContext'
import { useNewsFeedContext } from '@/contexts/NewsFeedContext'
import CompetitorsView from '@/components/CompetitorsView'
import AlertsView from '@/components/AlertsView'
import InsightsView from '@/components/InsightsView'
import NewsFeedView from '@/components/NewsFeedView'
import ProfilesView from '@/components/ProfilesView'
import IndustryAnalyticsView from '@/components/IndustryAnalyticsView'
import SettingsView from '@/components/SettingsView'
import { useSettings } from '@/contexts/SettingsContext'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { settings, t } = useSettings()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (isLoaded && user && !user.unsafeMetadata?.onboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoaded, user])
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanIndustry, setScanIndustry] = useState('auto')
  const [companyUrl, setCompanyUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState('')
  const [scanProgressPercent, setScanProgressPercent] = useState(0)
  const [initialAlertId, setInitialAlertId] = useState<string | null>(null)
  const [initialCompetitorId, setInitialCompetitorId] = useState<string | null>(null)
  const [showAllNews, setShowAllNews] = useState(false)
  
  // Sidebar state - responsive mobile + collapsible desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      const savedState = localStorage.getItem('sidebarOpen')
      return isMobile ? false : (savedState !== null ? savedState === 'true' : true)
    }
    return true
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  
  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])
  
  // Fetch scans first
  const { scans, loading: loadingScans, refetch: refetchScans } = useScans(10)
  const [selectedScanId, setSelectedScanId] = useState<string | undefined>(undefined)
  
  // Auto-select most recent scan
  useEffect(() => {
    if (!selectedScanId && scans.length > 0 && !loadingScans) {
      setSelectedScanId(scans[0].id)
    }
  }, [scans, loadingScans, selectedScanId])
  
  // Update context filters when scan changes
  useEffect(() => {
    setAlertsScanFilter(selectedScanId)
    setNewsScanFilter(selectedScanId)
  }, [selectedScanId, setAlertsScanFilter, setNewsScanFilter])
  
  // Fetch real data from Supabase filtered by selected scan
  const { competitors, loading: loadingCompetitors } = useCompetitors(selectedScanId)
  const { insights, loading: loadingInsights } = useInsights(selectedScanId)
  
  // Use context for alerts and news
  const { alerts, loading: loadingAlerts, markAsRead, unreadCount: alertsUnreadCount, setScanFilter: setAlertsScanFilter } = useAlertsContext()
  const { unreadCount: unreadNewsCount, setScanFilter: setNewsScanFilter } = useNewsFeedContext()
  
  const selectedScan = scans.find(s => s.id === selectedScanId)

  // Calculate KPIs from real data
  const activeCompetitorsCount = competitors.length
  const criticalAlertsCount = alertsUnreadCount
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

  // Helper to call scan step
  async function callStep(step: string, payload: any) {
    const res = await fetch('/.netlify/functions/scan-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, ...payload })
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || `Step ${step} failed`)
    return data
  }

  // Run scan - orchestrate steps from frontend with incremental scan support
  async function handleRunScan() {
    setIsScanning(true)
    
    try {
      let industry = scanIndustry
      let companyName = ''

      // Auto-detect industry from URL if needed
      if ((industry === 'auto' || !industry) && companyUrl) {
        setScanProgress('🔎 Analyzing company website...')
        const detected = await callStep('detect', { companyUrl })
        industry = detected.industry
        companyName = detected.company_name
        setScanProgress(`✓ Detected: ${companyName} → ${industry}`)
      } else if (industry === 'auto' && !companyUrl) {
        setScanProgress('❌ Please provide a company URL or select an industry')
        setTimeout(() => setIsScanning(false), 2000)
        return
      }

      // Step 0: Create scan record OR reuse existing profile
      setScanProgress(`Initializing ${industry} scan...`)
      setScanProgressPercent(10)
      const initResult = await callStep('init', { 
        industry, 
        companyUrl: companyUrl || undefined, 
        companyName: companyName || undefined,
        userId: user?.id // Pass Clerk user ID
      })
      const { scanId, isRefresh } = initResult
      
      let companies: any[] = []
      let compCount = 0
      
      // Step 1: Find competitors (skip if refreshing existing profile)
      if (isRefresh) {
        setScanProgress(`🔄 Refreshing ${industry} data...`)
        // Fetch existing competitor count for display
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/competitors?scan_id=eq.${scanId}&select=id`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          }
        })
        const existingCompetitors = await res.json()
        compCount = existingCompetitors?.length || 0
        setScanProgress(`✓ Reusing existing ${compCount} competitors from profile.`)
        setScanProgressPercent(40)
        // Pass empty companies array for analyze step
        companies = []
      } else {
        setScanProgress('🔍 Finding competitors via AI...')
        setScanProgressPercent(20)
        const watchlist = settings.scanPreferences.watchlist || []
        const competitorsResult = await callStep('competitors', { 
          industry, 
          scanId, 
          companyUrl: companyUrl || undefined, 
          maxCompetitors: settings.scanPreferences.maxCompetitors, 
          regions: settings.scanPreferences.targetRegions,
          watchlist 
        })
        companies = competitorsResult.companies
        compCount = competitorsResult.count
        setScanProgress(`✓ Found ${compCount} competitors.`)
        setScanProgressPercent(40)
      }
      
      // Step 2: Collect news via Perplexity
      setScanProgress(`📰 Collecting recent ${industry} news...`)
      setScanProgressPercent(60)
      const { news, count: newsCount } = await callStep('news', { industry })
      
      // Step 3: Analyze + write to Supabase (incremental if refresh)
      setScanProgress(`✓ ${newsCount} news items. 🧠 AI analysis...`)
      setScanProgressPercent(80)
      const results = await callStep('analyze', { 
        industry, 
        scanId, 
        companies, 
        news,
        isRefresh
      })
      
      // Done!
      setScanProgressPercent(100)
      if (isRefresh) {
        setScanProgress(`✅ Profile refreshed! ${results.alerts} new alerts, ${results.insights} new insights, ${results.news} new articles`)
      } else {
        setScanProgress(`✅ Scan complete! ${compCount} competitors, ${results.alerts} alerts, ${results.insights} insights, ${results.news} news`)
      }
      
      await refetchScans()
      setSelectedScanId(scanId)
      
      setTimeout(() => {
        setIsScanning(false)
        setShowScanModal(false)
        setScanProgress('')
        setScanProgressPercent(0)
      }, 2500)
      
    } catch (error: any) {
      setScanProgress('❌ Scan failed. Please try again.')
      setScanProgressPercent(0)
      console.error('Scan error:', error)
      setTimeout(() => {
        setIsScanning(false)
        setShowScanModal(false)
        setScanProgress('')
      }, 3000)
    }
  }

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64'
  const mainMargin = sidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-64'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarWidth} bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className={`text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent ${sidebarCollapsed ? 'hidden' : ''}`}>
            PulseIntel
          </Link>
          {sidebarCollapsed && (
            <Link href="/" className="text-xl font-bold text-indigo-400">PI</Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:block text-slate-400 hover:text-white transition"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
        
        <nav className="px-3 space-y-1">
          {[
            { id: 'overview', label: t('nav.overview'), icon: '📊' },
            { id: 'competitors', label: t('nav.competitors'), icon: '🎯' },
            { id: 'news', label: t('nav.news'), icon: '📰', badge: unreadNewsCount },
            { id: 'analytics', label: t('nav.analytics'), icon: '📊' },
            { id: 'alerts', label: t('nav.alerts'), icon: '🔔', badge: alertsUnreadCount },
            { id: 'insights', label: t('nav.insights'), icon: '🤖' },
            { id: 'mywatch', label: t('nav.mywatch'), icon: '👁️' },
            { id: 'settings', label: t('nav.settings'), icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                // Close sidebar on mobile when tab clicked
                if (window.innerWidth < 768) {
                  setSidebarOpen(false)
                }
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge && item.badge > 0 && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
              {sidebarCollapsed && item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{user?.firstName || user?.username || 'User'}</div>
                <div className="text-xs text-slate-400">{t('free_plan')}</div>
              </div>
            </div>
          </div>
        )}
        
        {sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 flex justify-center">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`${mainMargin} p-4 md:p-8 transition-all duration-300`}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xl"
        >
          ☰
        </button>
        {/* Header */}
        <div className="mb-8 mt-12 md:mt-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('welcome')}, {settings.profile.name || 'David'} 👋
              </h1>
              <p className="text-slate-400">
                {t('subtitle')}
              </p>
              {selectedScan?.last_refreshed_at && (
                <p className="text-xs text-slate-500 mt-1">
                  Last refreshed: {new Date(selectedScan.last_refreshed_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                  {selectedScan.refresh_count > 0 && ` · ${selectedScan.refresh_count} refresh${selectedScan.refresh_count > 1 ? 'es' : ''}`}
                </p>
              )}
            </div>
            
            {/* Scan Selector + New Scan Button */}
            <div className="flex items-center gap-3">
              {scans.length > 0 && (
                <>
                  <label className="text-sm text-slate-400 flex-shrink-0">{t('viewing')}</label>
                  <select
                    value={selectedScanId || ''}
                    onChange={(e) => setSelectedScanId(e.target.value)}
                    className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm max-w-[220px] truncate"
                  >
                    {scans.map((scan) => {
                      const label = scan.company_name 
                        ? `${scan.company_name} (${scan.industry})` 
                        : scan.industry
                      return (
                        <option key={scan.id} value={scan.id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </>
              )}
              
              {selectedScan && (
                <button
                  onClick={async () => {
                    if (!selectedScan) return
                    setIsScanning(true)
                    try {
                      setScanProgress('🔄 Refreshing profile data...')
                      
                      // Step 0: Init (will detect existing profile)
                      const { scanId, isRefresh } = await callStep('init', { 
                        industry: selectedScan.industry, 
                        companyUrl: selectedScan.company_url || undefined,
                        companyName: selectedScan.company_name || undefined
                      })
                      
                      // Step 1: News
                      setScanProgress('📰 Collecting latest news...')
                      const { news, count: newsCount } = await callStep('news', { industry: selectedScan.industry })
                      
                      // Step 2: Analyze (refresh mode)
                      setScanProgress('🧠 Generating alerts & insights...')
                      const results = await callStep('analyze', { 
                        industry: selectedScan.industry, 
                        scanId, 
                        companies: [], 
                        news,
                        isRefresh: true 
                      })
                      
                      setScanProgress(`✅ Refreshed! ${results.alerts} new alerts, ${results.insights} insights, ${results.news} articles`)
                      
                      await refetchScans()
                      
                      setTimeout(() => {
                        setIsScanning(false)
                        setScanProgress('')
                      }, 2500)
                      
                    } catch (error: any) {
                      setScanProgress('❌ Error: ' + error.message)
                      setTimeout(() => setIsScanning(false), 3000)
                    }
                  }}
                  disabled={isScanning}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      Refresh
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => { 
                  setShowScanModal(true)
                  setCompanyUrl(settings.profile.companyUrl || '')
                  setScanIndustry(settings.profile.companyUrl ? 'auto' : (settings.profile.defaultIndustry || 'Financial Services'))
                  setScanProgress('')
                }}
                disabled={isScanning}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    New Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards - Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Active Competitors', value: loadingCompetitors ? '...' : activeCompetitorsCount.toString(), change: 'Tracked', trend: 'neutral', tab: 'competitors', tooltip: 'Total number of competitors identified and tracked in this scan. Click to see full list with threat scores and activity levels.' },
                { label: 'Critical Alerts', value: loadingAlerts ? '...' : criticalAlertsCount.toString(), change: 'Requires attention', trend: criticalAlertsCount > 0 ? 'alert' : 'neutral', tab: 'alerts', tooltip: 'High-priority alerts requiring immediate attention — major competitor moves, funding rounds, or market shifts.' },
                { label: 'New Insights', value: loadingInsights ? '...' : newInsightsCount.toString(), change: 'Generated today', trend: 'up', tab: 'insights', tooltip: 'AI-generated strategic insights including threats, opportunities, and trends detected from competitor data and news analysis.' },
                { label: 'Avg Threat Score', value: loadingCompetitors ? '...' : avgMarketScore, change: 'Market average', trend: 'neutral', tab: 'competitors', tooltip: 'Average threat score across all tracked competitors (0-10). Higher scores indicate stronger competitive pressure in this market.' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  onClick={() => setActiveTab(kpi.tab)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition cursor-pointer group relative"
                >
                  <div className="mb-1">
                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-1">
                      {kpi.label}
                      <span className="inline-block w-4 h-4 text-center text-xs text-slate-500 bg-slate-800 rounded-full leading-4 cursor-help">?</span>
                    </h3>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{kpi.value}</div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                    kpi.trend === 'up' ? 'bg-green-500/10 text-green-500'
                    : kpi.trend === 'alert' ? 'bg-red-500/10 text-red-500'
                    : 'bg-slate-700 text-slate-400'
                  }`}>{kpi.change}</span>
                  <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition">Click to view details →</div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    {kpi.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45 -mt-1"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Alerts & Top Competitors - Clickable */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🔔 Recent Alerts</h2>
                {loadingAlerts ? (
                  <div className="text-slate-400 text-center py-8">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="text-slate-400 text-center py-8">No alerts yet</div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} onClick={() => { setInitialAlertId(alert.id); setActiveTab('alerts'); markAsRead(alert.id) }}
                        className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.priority === 'critical' ? 'bg-red-500'
                          : alert.priority === 'attention' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-white font-medium mb-1">{alert.title}</div>
                          <div className="text-sm text-slate-400">
                            {alert.category && `${alert.category} · `}{timeAgo(alert.created_at)}
                          </div>
                        </div>
                        {!alert.read && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setActiveTab('alerts')} className="w-full mt-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
                  View all alerts →
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎯 Top Competitors</h2>
                {loadingCompetitors ? (
                  <div className="text-slate-400 text-center py-8">Loading competitors...</div>
                ) : topCompetitors.length === 0 ? (
                  <div className="text-slate-400 text-center py-8">No competitors yet</div>
                ) : (
                  <div className="space-y-3">
                    {topCompetitors.map((comp) => (
                      <div key={comp.id} onClick={() => setActiveTab('competitors')}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {comp.name[0]}
                          </div>
                          <div>
                            <div className="text-white font-medium">{comp.name}</div>
                            <div className="text-sm text-slate-400">Activity: {comp.activity_level || 'Unknown'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{comp.threat_score?.toFixed(1) || 'N/A'}</div>
                          <div className="text-xs text-slate-400">Threat Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setActiveTab('competitors')} className="w-full mt-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
                  View all competitors →
                </button>
              </div>
            </div>

            {/* AI Insights Preview */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🤖 AI-Generated Insights</h2>
              {loadingInsights ? (
                <div className="text-slate-300 text-center py-8">Loading insights...</div>
              ) : insights.length === 0 ? (
                <div className="text-slate-300 text-center py-8">No insights generated yet</div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} onClick={() => setActiveTab('insights')}
                      className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 hover:bg-slate-900/70 transition cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {insight.type === 'threat' ? '⚠️' : insight.type === 'opportunity' ? '💡' : insight.type === 'trend' ? '📈' : '🎯'}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-2">{insight.title}</h3>
                          <p className="text-slate-300 text-sm mb-3 line-clamp-2">{insight.description}</p>
                          {insight.confidence && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Confidence:</span>
                              <div className="flex-1 h-2 bg-slate-700 rounded-full max-w-xs">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${insight.confidence * 100}%` }} />
                              </div>
                              <span className="text-xs text-slate-400">{Math.round(insight.confidence * 100)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setActiveTab('insights')} className="w-full mt-4 py-2 text-indigo-300 hover:text-indigo-200 text-sm font-medium transition">
                View all insights →
              </button>
            </div>
          </>
        )}

        {activeTab === 'competitors' && (
          <CompetitorsView competitors={competitors} loading={loadingCompetitors} />
        )}

        {activeTab === 'alerts' && (
          <AlertsView initialAlertId={initialAlertId} />
        )}

        {activeTab === 'insights' && (
          <InsightsView insights={insights} loading={loadingInsights} />
        )}

        {activeTab === 'news' && (
          <NewsFeedView scanId={selectedScanId} />
        )}

        {activeTab === 'mywatch' && (
          <ProfilesView 
            scans={scans} 
            loading={loadingScans} 
            selectedScanId={selectedScanId}
            onSelectScan={(id) => { setSelectedScanId(id); setActiveTab('overview') }}
            onRefreshProfile={(id) => {
              const profile = scans.find(s => s.id === id)
              if (profile) {
                setCompanyUrl(profile.company_url || '')
                setScanIndustry(profile.industry)
                setShowScanModal(true)
              }
            }}
            onFullRescan={(id) => {
              alert('Full rescan: Delete this profile and create a new one with the same parameters.')
            }}
            onDeleteProfile={async (id) => {
              try {
                setScanProgress('🗑️ Deleting profile and all data...')
                
                // TODO SECURITY: Replace with user-scoped policy after Clerk auth
                // Currently uses public DELETE policy (demo mode only)
                // Delete from Supabase (cascade will handle related data)
                const token = await getToken({ template: 'supabase' })
                const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/scans?id=eq.${id}`, {
                  method: 'DELETE',
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'Authorization': `Bearer ${token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                  }
                })
                
                if (!res.ok) {
                  const text = await res.text()
                  throw new Error(`Delete failed: ${res.status} ${text}`)
                }
                
                setScanProgress('✅ Profile deleted')
                
                // Refresh scan list
                await refetchScans()
                
                // If deleted scan was selected, clear selection
                if (selectedScanId === id) {
                  setSelectedScanId('')
                }
                
                setTimeout(() => setScanProgress(''), 2000)
              } catch (error: any) {
                setScanProgress(`❌ Error: ${error.message}`)
                setTimeout(() => setScanProgress(''), 3000)
              }
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <IndustryAnalyticsView
            analytics={selectedScan?.industry_analytics || null}
            industry={selectedScan?.industry || 'Unknown'}
            loading={loadingScans}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">🔍 New Industry Scan</h2>
            <p className="text-slate-400 mb-6">
              Select an industry and optionally provide your company website for more targeted competitor analysis.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Company Website
              </label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => {
                  setCompanyUrl(e.target.value)
                  if (e.target.value && scanIndustry !== 'auto') setScanIndustry('auto')
                }}
                placeholder="https://yourcompany.com"
                disabled={isScanning}
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder-slate-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                {companyUrl ? 'AI will auto-detect the industry and find direct competitors.' : 'Provide a URL for targeted competitor analysis, or select an industry below.'}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Industry {companyUrl && <span className="text-indigo-400 text-xs ml-1">(auto-detected from URL)</span>}
              </label>
              
              {/* Existing profile detection */}
              {companyUrl && scanIndustry !== 'auto' && scans.some(s => s.company_url === companyUrl && s.industry === scanIndustry && s.status === 'completed') && (
                <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-indigo-300 text-sm">
                    ✓ A profile for this industry already exists. Click <strong>Refresh</strong> to update with latest data.
                  </p>
                </div>
              )}
              
              <select
                value={scanIndustry}
                onChange={(e) => setScanIndustry(e.target.value)}
                disabled={isScanning}
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                {companyUrl && <option value="auto">🔎 Auto-detect from URL</option>}
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Technology">Technology</option>
                <option value="E-commerce">E-commerce</option>
                <option value="SaaS">SaaS</option>
                <option value="Fintech">Fintech</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Gaming">Gaming</option>
                <option value="EdTech">EdTech</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Logistics">Logistics</option>
                <option value="Energy">Energy</option>
                <option value="Retail">Retail</option>
                <option value="Legal Tech">Legal Tech</option>
                <option value="Insurance">Insurance</option>
                <option value="Consulting">Consulting</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Media & Entertainment">Media & Entertainment</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Automotive">Automotive</option>
                <option value="Biotech">Biotech</option>
              </select>
            </div>

            {scanProgress && (
              <div className="mb-4">
                <div className={`p-4 rounded-lg mb-2 ${
                  scanProgress.startsWith('❌') 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : scanProgress.startsWith('✅')
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-indigo-500/10 border border-indigo-500/30'
                }`}>
                  <p className={`text-sm font-medium ${
                    scanProgress.startsWith('❌') 
                      ? 'text-red-300' 
                      : scanProgress.startsWith('✅')
                      ? 'text-green-300'
                      : 'text-indigo-300'
                  }`}>{scanProgress}</p>
                </div>
                {!scanProgress.startsWith('❌') && (
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${scanProgressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScanModal(false)
                  setScanProgress('')
                }}
                disabled={isScanning}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scanning...
                  </>
                ) : (
                  'Start Scan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
