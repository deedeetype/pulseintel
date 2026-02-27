'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Activity, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, RefreshCw, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getIndustryDisplayName } from '@/constants/industries'

interface RefreshLog {
  id: string
  scan_id: string
  triggered_by: 'manual' | 'scheduled'
  started_at: string
  completed_at: string
  status: 'success' | 'failed' | 'running'
  new_alerts_count: number
  new_insights_count: number
  new_news_count: number
  error_message?: string
  scan?: {
    industry: string
    company_name?: string
  }
}

export default function ActivityView() {
  const { user } = useUser()
  const [logs, setLogs] = useState<RefreshLog[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (user) {
      fetchActivityLogs()
    }
  }, [user])
  
  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('refresh_logs')
        .select(`
          id,
          scan_id,
          triggered_by,
          started_at,
          completed_at,
          status,
          new_alerts_count,
          new_insights_count,
          new_news_count,
          error_message,
          scans (
            industry,
            company_name
          )
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      const logsWithScan = data?.map(log => ({
        ...log,
        scan: Array.isArray(log.scans) ? log.scans[0] : log.scans
      })) || []
      
      setLogs(logsWithScan)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'just now'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'running':
        return <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }
  
  const getTriggerBadge = (triggered_by: string) => {
    if (triggered_by === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs font-medium">
          <Calendar className="w-3 h-3" />
          Automated
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-medium">
        <RefreshCw className="w-3 h-3" />
        Manual
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="text-slate-400 text-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
        Loading activity...
      </div>
    )
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center py-20">
        <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">No activity yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Automated refreshes will appear here
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Activity Log
        </h2>
        <p className="text-slate-400 mt-1">
          {logs.length} refresh{logs.length !== 1 ? 'es' : ''} recorded
        </p>
      </div>
      
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getStatusIcon(log.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-medium">
                    {log.scan?.company_name ? `${log.scan.company_name} — ` : ''}
                    {getIndustryDisplayName(log.scan?.industry)}
                  </h3>
                  {getTriggerBadge(log.triggered_by)}
                  {log.status === 'success' && (
                    <span className="text-xs text-emerald-400 font-medium">
                      Completed
                    </span>
                  )}
                  {log.status === 'failed' && (
                    <span className="text-xs text-red-400 font-medium">
                      Failed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(log.completed_at || log.started_at)}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(log.completed_at || log.started_at)}</span>
                </div>
                
                {log.status === 'success' && (log.new_insights_count > 0 || log.new_alerts_count > 0 || log.new_news_count > 0) && (
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {log.new_insights_count > 0 && (
                      <div className="flex items-center gap-1 text-indigo-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">{log.new_insights_count}</span>
                        <span className="text-slate-400">insights</span>
                      </div>
                    )}
                    {log.new_alerts_count > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">{log.new_alerts_count}</span>
                        <span className="text-slate-400">alerts</span>
                      </div>
                    )}
                    {log.new_news_count > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="font-medium">{log.new_news_count}</span>
                        <span>news</span>
                      </div>
                    )}
                  </div>
                )}
                
                {log.status === 'failed' && log.error_message && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {log.error_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
