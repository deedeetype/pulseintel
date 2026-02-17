'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INDUSTRIES = [
  { id: 'video-games', name: 'Video Games', icon: '🎮', description: 'Gaming studios, platforms, esports' },
  { id: 'healthtech', name: 'Healthcare Technology', icon: '🏥', description: 'Digital health, medical AI, telehealth' },
  { id: 'fintech', name: 'Financial Technology', icon: '💰', description: 'Banking, payments, crypto' },
  { id: 'ai-ml', name: 'AI & Machine Learning', icon: '🤖', description: 'AI platforms, LLMs, ML tools' },
  { id: 'saas', name: 'SaaS & Cloud', icon: '☁️', description: 'Software platforms, cloud services' },
  { id: 'ecommerce', name: 'E-Commerce', icon: '🛒', description: 'Online retail, marketplaces' },
  { id: 'edtech', name: 'Education Technology', icon: '📚', description: 'Learning platforms, online education' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒', description: 'Security tools, data protection' },
]

export default function OnboardingSSEPage() {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [results, setResults] = useState<any>(null)

  const handleStartScan = async () => {
    if (!selectedIndustry) return

    setIsScanning(true)
    setScanProgress(0)
    
    const industry = INDUSTRIES.find(i => i.id === selectedIndustry)
    
    try {
      // Use Server-Sent Events for real-time updates
      const eventSource = new EventSource(
        `/api/scan/stream?industry=${encodeURIComponent(industry?.name || selectedIndustry)}&userId=demo_user`
      )

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('[SSE] Event:', data)

        if (data.type === 'started') {
          setCurrentStep(data.message)
        } else if (data.type === 'progress') {
          setScanProgress(data.progress)
          setCurrentStep(data.message)
        } else if (data.type === 'completed') {
          setScanProgress(100)
          setCurrentStep('Dashboard ready!')
          setResults(data.results)
          eventSource.close()
          
          // Redirect after showing results
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else if (data.type === 'error') {
          alert(`Error: ${data.message}`)
          eventSource.close()
          setIsScanning(false)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE] Error:', error)
        eventSource.close()
        alert('Connection error. Please try again.')
        setIsScanning(false)
      }

    } catch (error: any) {
      console.error('Scan error:', error)
      alert(`Error: ${error.message}`)
      setIsScanning(false)
    }
  }

  if (isScanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 animate-pulse">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              AI Agent Working...
            </h2>
            <p className="text-gray-600 text-lg">
              {currentStep}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{scanProgress}% complete</p>

          {/* Show results when done */}
          {results && (
            <div className="mt-8 p-6 bg-green-50 rounded-xl border-2 border-green-200">
              <p className="text-lg font-semibold text-green-800 mb-2">✅ Scan Complete!</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Competitors:</span>
                  <span className="ml-2 font-bold text-gray-900">{results.competitors}</span>
                </div>
                <div>
                  <span className="text-gray-600">Alerts:</span>
                  <span className="ml-2 font-bold text-gray-900">{results.alerts}</span>
                </div>
                <div>
                  <span className="text-gray-600">Insights:</span>
                  <span className="ml-2 font-bold text-gray-900">{results.insights}</span>
                </div>
                <div>
                  <span className="text-gray-600">News:</span>
                  <span className="ml-2 font-bold text-gray-900">{results.news}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fun facts while loading */}
          {!results && (
            <div className="mt-8 p-6 bg-purple-50 rounded-xl">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 Real-time update:</span> This progress bar is connected to the actual AI agent running on the server. What you see is what's happening right now!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome to PulseIntel
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered competitive intelligence that automatically tracks your industry and alerts you to threats and opportunities.
          </p>
          <p className="mt-2 text-sm text-purple-600 font-semibold">
            🔥 Real-time version with Server-Sent Events
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-12 space-x-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <span className="ml-2 text-gray-700 font-medium">Choose Industry</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="ml-2 text-gray-400">AI Scan</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <span className="ml-2 text-gray-400">Dashboard</span>
          </div>
        </div>

        {/* Industry Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Select Your Industry
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {INDUSTRIES.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedIndustry === industry.id
                    ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{industry.name}</h3>
                <p className="text-sm text-gray-600">{industry.description}</p>
                
                {selectedIndustry === industry.id && (
                  <div className="mt-3 flex items-center text-purple-600 text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleStartScan}
            disabled={!selectedIndustry}
            className={`px-12 py-4 rounded-xl font-bold text-lg transition-all ${
              selectedIndustry
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-2xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedIndustry ? '🚀 Start Real AI Scan' : 'Select an industry to continue'}
          </button>
          
          {selectedIndustry && (
            <p className="mt-4 text-sm text-gray-500">
              Real-time progress updates • Takes approximately 20-30 seconds
            </p>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">Auto-Discovery</h3>
            <p className="text-gray-600 text-sm">
              AI finds and tracks competitors automatically
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Real-Time Alerts</h3>
            <p className="text-gray-600 text-sm">
              Get notified of funding, launches, and threats
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💡</div>
            <h3 className="font-bold text-gray-900 mb-2">Strategic Insights</h3>
            <p className="text-gray-600 text-sm">
              AI generates actionable recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
