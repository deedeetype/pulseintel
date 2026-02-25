'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Search, TrendingUp, Shield, Zap, ChevronRight, BarChart3, Globe, Bell } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="PulseIntel" width={32} height={32} />
            <span className="text-2xl font-bold text-white">PulseIntel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Image src="/hero-illustration.svg" alt="" width={1200} height={600} className="max-w-full" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium">AI-Powered Intelligence Platform</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Stay Ahead of Your
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Competition
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Real-time competitive intelligence powered by AI. Track competitors, analyze trends, 
            and get actionable insights delivered to your dashboard.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/sign-up"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button className="border border-slate-700 hover:border-slate-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Watch Demo
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything you need to win</h2>
          <p className="text-slate-400 text-lg">Powerful features to keep you informed and ahead</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Real-time Monitoring"
            description="Track competitor activities, product launches, and market movements as they happen."
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title="Smart Alerts"
            description="Get notified instantly when important changes occur in your competitive landscape."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Trend Analysis"
            description="AI-powered insights help you spot patterns and opportunities before your competitors."
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="Multi-source Intelligence"
            description="Aggregate data from news, social media, company websites, and industry sources."
          />
          <FeatureCard
            icon={<Search className="w-8 h-8" />}
            title="Deep Research"
            description="Perplexity AI integration for comprehensive competitive research and analysis."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Secure & Private"
            description="Your competitive intelligence data is encrypted and never shared with third parties."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to outsmart your competition?
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Join forward-thinking teams using PulseIntel to stay ahead
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-slate-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started for Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2026 PulseIntel by Labwyze Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group">
      <div className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}
