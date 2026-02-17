'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

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
            { id: 'alerts', label: 'Alerts', icon: '🔔', badge: 3 },
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
              {item.badge && (
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, David 👋
          </h1>
          <p className="text-slate-400">
            Here's what's happening with your competitive landscape
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Active Competitors',
              value: '12',
              change: '+2 this week',
              trend: 'up',
              color: 'blue',
            },
            {
              label: 'Critical Alerts',
              value: '3',
              change: 'Requires attention',
              trend: 'alert',
              color: 'red',
            },
            {
              label: 'New Insights',
              value: '7',
              change: 'Generated today',
              trend: 'up',
              color: 'green',
            },
            {
              label: 'Market Score',
              value: '8.4',
              change: '+0.3 from last week',
              trend: 'up',
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
            <div className="space-y-3">
              {[
                {
                  priority: 'critical',
                  title: 'Competitor X raised $50M Series B',
                  time: '2 hours ago',
                  company: 'Competitor X',
                },
                {
                  priority: 'attention',
                  title: 'New product launch detected',
                  time: '5 hours ago',
                  company: 'Competitor Y',
                },
                {
                  priority: 'info',
                  title: 'Industry report published',
                  time: '1 day ago',
                  company: 'Market Research Co',
                },
              ].map((alert, i) => (
                <div
                  key={i}
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
                      {alert.company} · {alert.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
              View all alerts →
            </button>
          </div>

          {/* Top Competitors */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🎯 Top Competitors
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Competitor X', score: 8.9, trend: 'up', activity: 'High' },
                { name: 'Competitor Y', score: 7.2, trend: 'up', activity: 'Medium' },
                { name: 'Competitor Z', score: 6.5, trend: 'down', activity: 'Low' },
              ].map((comp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {comp.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">{comp.name}</div>
                      <div className="text-sm text-slate-400">Activity: {comp.activity}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{comp.score}</div>
                    <div
                      className={`text-xs ${
                        comp.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {comp.trend === 'up' ? '↗' : '↘'} Threat Score
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Connect to Supabase to see real-time data
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🤖 AI-Generated Insights
          </h2>
          <div className="space-y-3">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Emerging Technology Trend Detected
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    Analysis shows 3 of your competitors are investing heavily in AI-powered analytics.
                    Consider accelerating your own AI roadmap to maintain competitive advantage.
                  </p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    View detailed analysis →
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Competitive Threat Alert
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    Competitor X's recent funding round suggests aggressive expansion plans.
                    Recommend strengthening market position in key verticals.
                  </p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    View recommendations →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
