'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Clock, Calendar, RefreshCw, Save, Trash2, Plus } from 'lucide-react'

interface ScanSchedule {
  id: string
  scan_id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
  hour: number
  minute: number
  timezone: string
  enabled: boolean
  next_run_at?: string
  last_run_at?: string
}

interface Scan {
  id: string
  industry: string
  company_name?: string
  company_url?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo'
]

export default function AutomatedScansSettings() {
  const { user } = useUser()
  const [scans, setScans] = useState<Scan[]>([])
  const [schedules, setSchedules] = useState<Record<string, ScanSchedule>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchScansAndSchedules()
    }
  }, [user])

  const fetchScansAndSchedules = async () => {
    try {
      if (!user?.id) {
        console.error('[AutomatedScans] No user ID available')
        setLoading(false)
        return
      }
      
      console.log('[AutomatedScans] Fetching scans via API for user:', user.id)
      
      // Use API route with service role key (bypasses RLS issue with Clerk JWT)
      const response = await fetch('/api/scans/list')
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const { scans: scansData, schedules: schedulesData } = await response.json()
      
      console.log('[AutomatedScans] Found scans:', scansData?.length || 0, scansData)
      console.log('[AutomatedScans] Found schedules:', schedulesData?.length || 0)
      
      setScans(scansData || [])

      // Convert schedules to map by scan_id
      const schedulesMap: Record<string, ScanSchedule> = {}
      schedulesData?.forEach((schedule: ScanSchedule) => {
        schedulesMap[schedule.scan_id] = schedule
      })
      setSchedules(schedulesMap)
    } catch (error) {
      console.error('[AutomatedScans] Error fetching scans/schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = async (scanId: string, schedule: Partial<ScanSchedule>) => {
    setSaving(scanId)
    try {
      const userId = user?.id
      if (!userId) {
        alert('User ID not available')
        setSaving(null)
        return
      }
      
      const existing = schedules[scanId]
      
      console.log('[AutomatedScans] Saving schedule for scan:', scanId, 'user:', userId, 'existing:', !!existing)
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('scan_schedules')
          .update(schedule)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('scan_schedules')
          .insert({
            user_id: userId,
            scan_id: scanId,
            ...schedule
          })
        
        if (error) throw error
      }
      
      await fetchScansAndSchedules()
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteSchedule = async (scanId: string) => {
    if (!confirm('Delete this automated scan schedule?')) return
    
    const existing = schedules[scanId]
    if (!existing) return
    
    try {
      const { error } = await supabase
        .from('scan_schedules')
        .delete()
        .eq('id', existing.id)
      
      if (error) throw error
      await fetchScansAndSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Failed to delete schedule')
    }
  }

  if (loading) {
    return <div className="text-slate-400">Loading automated scans...</div>
  }

  if (scans.length === 0) {
    return (
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">No profiles yet</h3>
        <p className="text-slate-400 mb-4">Create an industry profile first to set up automated scans.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <RefreshCw className="w-6 h-6 text-indigo-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Automated Scans</h2>
          <p className="text-slate-400">Schedule automatic profile refreshes</p>
        </div>
      </div>

      <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
        <p className="text-indigo-300 text-sm">
          ✨ <strong>Pro Feature:</strong> Automated scans keep your competitive intelligence fresh. Upgrade to Pro to enable scheduling.
        </p>
      </div>

      {scans.map(scan => (
        <ScanScheduleCard
          key={scan.id}
          scan={scan}
          schedule={schedules[scan.id]}
          onSave={(schedule) => handleSaveSchedule(scan.id, schedule)}
          onDelete={() => handleDeleteSchedule(scan.id)}
          saving={saving === scan.id}
        />
      ))}
    </div>
  )
}

function ScanScheduleCard({
  scan,
  schedule,
  onSave,
  onDelete,
  saving
}: {
  scan: Scan
  schedule?: ScanSchedule
  onSave: (schedule: Partial<ScanSchedule>) => void
  onDelete: () => void
  saving: boolean
}) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(schedule?.frequency || 'weekly')
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.day_of_week ?? 1)
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.day_of_month ?? 1)
  const [hour, setHour] = useState(schedule?.hour ?? 6)
  const [minute, setMinute] = useState(schedule?.minute ?? 0)
  const [timezone, setTimezone] = useState(schedule?.timezone || 'America/New_York')

  const handleSave = () => {
    onSave({
      enabled,
      frequency,
      day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
      day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
      hour,
      minute,
      timezone
    })
  }

  const formatNextRun = () => {
    if (!schedule?.next_run_at) return 'Not scheduled'
    const date = new Date(schedule.next_run_at)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone
    })
  }

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {scan.company_name ? `${scan.company_name} — ` : ''}{scan.industry}
          </h3>
          {scan.company_url && (
            <p className="text-xs text-slate-500 mt-1">{scan.company_url}</p>
          )}
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {schedule?.last_run_at && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg text-sm">
          <span className="text-slate-400">Last run: </span>
          <span className="text-white">{new Date(schedule.last_run_at).toLocaleString()}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            disabled={!enabled}
            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Day selector */}
        {frequency === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              disabled={!enabled}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        )}

        {frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Day of Month</label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
              disabled={!enabled}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        )}

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Time</label>
          <div className="flex gap-2">
            <select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
              disabled={!enabled}
              className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={!enabled}
            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {enabled && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <p className="text-indigo-300 text-sm">
            <Clock className="w-4 h-4 inline mr-2" />
            Next run: <strong>{formatNextRun()}</strong>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Schedule
            </>
          )}
        </button>
        
        {schedule && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
