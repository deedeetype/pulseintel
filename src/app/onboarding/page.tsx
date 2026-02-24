'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: '',
    companyUrl: '',
    industry: 'Technology',
    role: 'Founder/CEO'
  })

  const industries = [
    'Technology', 'Healthcare', 'Financial Services', 'Retail', 'Manufacturing',
    'Automotive', 'Real Estate', 'Energy', 'Telecommunications', 'Food & Beverage'
  ]

  const roles = [
    'Founder/CEO', 'Product Manager', 'Business Development', 'Marketing',
    'Strategy/Operations', 'Investor', 'Consultant', 'Other'
  ]

  const handleSubmit = async () => {
    // Save onboarding data to user metadata
    await user?.update({
      unsafeMetadata: {
        onboarded: true,
        companyName: formData.companyName,
        companyUrl: formData.companyUrl,
        industry: formData.industry,
        role: formData.role
      }
    })

    // Redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to PulseIntel! 🎉</h1>
          <p className="text-slate-400">Let's get your competitive intelligence workspace set up</p>
          <div className="mt-4 flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full ${
                  s <= step ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Tell us about your company</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Inc."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Company Website (Optional)
              </label>
              <input
                type="url"
                value={formData.companyUrl}
                onChange={(e) => setFormData({ ...formData, companyUrl: e.target.value })}
                placeholder="https://acme.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll use this to find your direct competitors
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.companyName}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Industry & Role */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Your industry & role</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Primary Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Your Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Free Trial */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Start your 7-day free trial</h2>
            
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Free Trial</h3>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">$0</div>
                  <div className="text-sm text-slate-400">7 days</div>
                </div>
              </div>
              
              <ul className="space-y-2 text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  ✅ 1 scan per day
                </li>
                <li className="flex items-center gap-2">
                  ✅ 1 refresh per day
                </li>
                <li className="flex items-center gap-2">
                  ✅ Unlimited competitors tracking
                </li>
                <li className="flex items-center gap-2">
                  ✅ Real-time alerts & insights
                </li>
                <li className="flex items-center gap-2">
                  ✅ Industry analytics
                </li>
              </ul>

              <p className="text-xs text-slate-400">
                No credit card required. After 7 days, upgrade to continue or downgrade to free tier (1 scan/week).
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Start Free Trial 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
