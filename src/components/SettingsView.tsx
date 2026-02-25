'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useUser } from '@clerk/nextjs'
import { Settings as SettingsIcon, User, Building, Globe, Bell, Zap, Save, Plus, X, Moon, Sun, RefreshCw } from 'lucide-react'
import AutomatedScansSettings from './AutomatedScansSettings'

const REGIONS = ['Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa']
const INDUSTRIES = [
  '', 'Financial Services', 'Healthcare', 'Technology', 'E-commerce', 'SaaS', 'Fintech',
  'Cybersecurity', 'AI/ML', 'Gaming', 'EdTech', 'Real Estate', 'Logistics', 'Energy',
  'Retail', 'Legal Tech', 'Insurance', 'Consulting', 'Manufacturing', 'Telecommunications',
  'Media & Entertainment', 'Food & Beverage', 'Automotive', 'Biotech', 'Pulp & Paper'
]

export default function SettingsView() {
  const { user } = useUser()
  const { settings, updateSettings, updateProfile, updateScanPreferences, t } = useSettings()
  const [saved, setSaved] = useState(false)
  const [watchlistInput, setWatchlistInput] = useState('')
  const [activeSection, setActiveSection] = useState<'profile' | 'scan' | 'notifications' | 'automated'>('profile')

  // Load onboarding data into settings on mount
  useEffect(() => {
    if (user?.unsafeMetadata) {
      const meta = user.unsafeMetadata as any
      if (meta.companyName && !settings.profile.company) {
        updateProfile({ 
          company: meta.companyName,
          companyUrl: meta.companyUrl || '',
          defaultIndustry: meta.industry || ''
        })
      }
    }
  }, [user])

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addWatchlistItem = () => {
    const item = watchlistInput.trim()
    if (item && !settings.scanPreferences.watchlist.includes(item)) {
      updateScanPreferences({ watchlist: [...settings.scanPreferences.watchlist, item] })
      setWatchlistInput('')
      showSaved()
    }
  }

  const removeWatchlistItem = (item: string) => {
    updateScanPreferences({ watchlist: settings.scanPreferences.watchlist.filter(w => w !== item) })
    showSaved()
  }

  const toggleRegion = (region: string) => {
    const current = settings.scanPreferences.targetRegions
    if (region === 'Global') {
      updateScanPreferences({ targetRegions: ['Global'] })
    } else {
      const without = current.filter(r => r !== 'Global' && r !== region)
      if (current.includes(region)) {
        updateScanPreferences({ targetRegions: without.length > 0 ? without : ['Global'] })
      } else {
        updateScanPreferences({ targetRegions: [...without, region] })
      }
    }
    showSaved()
  }

  const inputClass = "w-full bg-slate-800 light:bg-white text-white light:text-slate-900 px-4 py-3 rounded-lg border border-slate-700 light:border-slate-300 focus:border-indigo-500 focus:outline-none"
  const cardClass = "bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl p-6"
  const labelClass = "block text-sm font-medium text-slate-400 light:text-slate-600 mb-2"

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            {t('settings.title')}
          </h2>
        </div>
        {saved && (
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm animate-pulse">
            ✓ {t('settings.saved')}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'scan', label: 'Scan Preferences', icon: Zap },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'automated', label: 'Automated Scans', icon: RefreshCw }
        ].map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                activeSection === section.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          )
        })}
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <>
      {/* Appearance */}

      {/* Appearance */}
      <div className={`${cardClass} mb-6`}>
        <h3 className="text-lg font-bold text-white light:text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {t('settings.appearance')}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Theme Toggle */}
          <div>
            <label className={labelClass}>{t('settings.theme')}</label>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => { updateSettings({ theme }); showSaved() }}
                  className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                    settings.theme === theme
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-700 hover:border-slate-600'
                  }`}
                >
                  {theme === 'dark' ? (
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className={labelClass}>{t('settings.language')}</label>
            <div className="flex gap-2">
              {([{ code: 'en' as const, label: 'English', flag: '🇬🇧' }, { code: 'fr' as const, label: 'Français', flag: '🇫🇷' }]).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { updateSettings({ language: lang.code }); showSaved() }}
                  className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                    settings.language === lang.code
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    {lang.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className={`${cardClass} mb-6`}>
        <h3 className="text-lg font-bold text-white light:text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          {t('settings.profile')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={e => { updateProfile({ name: e.target.value }); showSaved() }}
                className={inputClass}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={e => { updateProfile({ email: e.target.value }); showSaved() }}
                className={inputClass}
                placeholder="you@company.com"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                value={settings.profile.company}
                onChange={e => { updateProfile({ company: e.target.value }); showSaved() }}
                className={inputClass}
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className={labelClass}>Company Website</label>
              <input
                type="url"
                value={settings.profile.companyUrl}
                onChange={e => { updateProfile({ companyUrl: e.target.value }); showSaved() }}
                className={inputClass}
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Default Industry</label>
            <select
              value={settings.profile.defaultIndustry}
              onChange={e => { updateProfile({ defaultIndustry: e.target.value }); showSaved() }}
              className={inputClass}
            >
              <option value="">Auto-detect / None</option>
              {INDUSTRIES.filter(Boolean).map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scan Preferences */}
      <div className={`${cardClass} mb-6`}>
        <h3 className="text-lg font-bold text-white light:text-slate-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          {t('settings.scan_prefs')}
        </h3>
        
        <div className="space-y-6">
          {/* Max Competitors */}
          <div>
            <label className={labelClass}>{t('settings.max_competitors')}</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => { updateScanPreferences({ maxCompetitors: n }); showSaved() }}
                  className={`px-5 py-2 rounded-lg border text-sm font-medium transition ${
                    settings.scanPreferences.maxCompetitors === n
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-700 hover:border-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Frequency */}
          <div>
            <label className={labelClass}>
              {t('settings.frequency')}
              {settings.scanPreferences.scanFrequency !== 'manual' && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/30">{t('settings.pro_badge')}</span>
              )}
            </label>
            <div className="flex gap-2">
              {([
                { value: 'manual' as const, label: settings.language === 'fr' ? 'Manuel' : 'Manual' },
                { value: 'daily' as const, label: settings.language === 'fr' ? 'Quotidien' : 'Daily', pro: true },
                { value: 'weekly' as const, label: settings.language === 'fr' ? 'Hebdomadaire' : 'Weekly', pro: true },
              ]).map(freq => (
                <button
                  key={freq.value}
                  onClick={() => { updateScanPreferences({ scanFrequency: freq.value }); showSaved() }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg border text-sm font-medium transition ${
                    settings.scanPreferences.scanFrequency === freq.value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-700 hover:border-slate-600'
                  }`}
                >
                  {freq.label}
                  {freq.pro && <span className="text-[10px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">PRO</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Target Regions */}
          <div>
            <label className={labelClass}>{t('settings.regions')}</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`px-4 py-2 rounded-lg border text-sm transition ${
                    settings.scanPreferences.targetRegions.includes(region)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-400 light:text-slate-700 hover:border-slate-600'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          <div>
            <label className={labelClass}>{t('settings.watchlist')}</label>
            <p className="text-xs text-slate-500 mb-3">{t('settings.watchlist_hint')}</p>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={watchlistInput}
                onChange={e => setWatchlistInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addWatchlistItem()}
                className={`${inputClass} flex-1`}
                placeholder={settings.language === 'fr' ? 'Nom ou URL de la compagnie' : 'Company name or URL'}
              />
              <button
                onClick={addWatchlistItem}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {settings.scanPreferences.watchlist.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.scanPreferences.watchlist.map(item => (
                  <div key={item} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white">
                    <span>{item}</span>
                    <button onClick={() => removeWatchlistItem(item)} className="text-slate-500 hover:text-red-400 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 italic">{settings.language === 'fr' ? 'Aucune compagnie dans la liste' : 'No companies in watchlist'}</p>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Scan Preferences Section */}
      {activeSection === 'scan' && (
        <div>
          <p className="text-slate-400 mb-4">Scan preferences content (existing settings)</p>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div>
          <p className="text-slate-400 mb-4">Notification preferences content</p>
        </div>
      )}

      {/* Automated Scans Section */}
      {activeSection === 'automated' && (
        <AutomatedScansSettings />
      )}
    </div>
  )
}
