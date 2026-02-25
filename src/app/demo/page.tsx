'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  TrendingUp, 
  Bell, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  ChevronRight
} from 'lucide-react'

// Custom hook for scroll-triggered animations
function useScrollAnimation() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [])

  return { elementRef, isVisible }
}

export default function DemoPage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-800/50 backdrop-blur-lg bg-slate-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="PulseIntel" width={32} height={32} />
            <span className="text-2xl font-bold text-white">PulseIntel</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors px-4 py-2">
              Back to Home
            </Link>
            <Link 
              href="/sign-up" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium">See PulseIntel in Action</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            How It
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Watch PulseIntel transform competitive intelligence from manual research 
            into automated, actionable insights in real-time.
          </p>

          <div className="flex items-center justify-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>4 Simple Steps</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Real-time Intelligence</span>
            </div>
          </div>

          <div className="mt-16 animate-bounce">
            <div className="text-slate-500 text-sm">Scroll to explore</div>
            <div className="w-6 h-10 border-2 border-slate-700 rounded-full mx-auto mt-4 flex items-start justify-center pt-2">
              <div className="w-1.5 h-3 bg-indigo-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Define Your Industry */}
      <ParallaxSection
        step="01"
        title="Define Your Industry"
        description="Start by selecting the industry you want to monitor. PulseIntel creates a dedicated intelligence profile tailored to your competitive landscape."
        icon={<Target className="w-12 h-12" />}
        features={[
          "Choose from 50+ industry templates",
          "Or create a custom industry profile",
          "Set your competitive priorities"
        ]}
        gradient="from-indigo-600 to-indigo-800"
        side="left"
      />

      {/* Step 2: AI-Powered Scanning */}
      <ParallaxSection
        step="02"
        title="AI-Powered Scanning"
        description="Our AI agents continuously scan thousands of sources: news sites, company blogs, social media, press releases, and industry publications."
        icon={<Search className="w-12 h-12" />}
        features={[
          "Multi-source intelligence gathering",
          "Perplexity AI deep research integration",
          "Real-time data aggregation"
        ]}
        gradient="from-purple-600 to-purple-800"
        side="right"
      />

      {/* Step 3: Smart Alerts */}
      <ParallaxSection
        step="03"
        title="Get Smart Alerts"
        description="When something important happens—a competitor launches a product, shifts strategy, or makes headlines—you're notified instantly with context."
        icon={<Bell className="w-12 h-12" />}
        features={[
          "Priority-ranked notifications",
          "Contextual summaries powered by AI",
          "Filter by impact and urgency"
        ]}
        gradient="from-indigo-600 to-purple-600"
        side="left"
      />

      {/* Step 4: Analyze & Act */}
      <ParallaxSection
        step="04"
        title="Analyze & Act"
        description="Access your dashboard for trend analysis, competitor timelines, and strategic insights. Make data-driven decisions faster than your competition."
        icon={<BarChart3 className="w-12 h-12" />}
        features={[
          "Visual trend analysis & charts",
          "Competitor activity timelines",
          "Exportable intelligence reports"
        ]}
        gradient="from-purple-600 to-pink-600"
        side="right"
      />

      {/* Benefits Summary */}
      <BenefitsSection />

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
                Join forward-thinking teams using PulseIntel to stay ahead of their competition. 
                No credit card required.
              </p>
              <Link 
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-slate-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl"
              >
                Start Your Free Trial
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2026 PulseIntel by Labwyze Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function ParallaxSection({ 
  step, 
  title, 
  description, 
  icon, 
  features, 
  gradient, 
  side 
}: { 
  step: string
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  gradient: string
  side: 'left' | 'right'
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const { elementRef: contentRef, isVisible: contentVisible } = useScrollAnimation()
  const { elementRef: visualRef, isVisible: visualVisible } = useScrollAnimation()

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const scrollProgress = 1 - (rect.top / window.innerHeight)
      setOffset(scrollProgress * 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isLeft = side === 'left'

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}>
          {/* Content */}
          <div 
            ref={contentRef}
            className={`flex-1 transition-all duration-1000 ease-out ${
              contentVisible 
                ? 'opacity-100 translate-x-0' 
                : `opacity-0 ${isLeft ? '-translate-x-12' : 'translate-x-12'}`
            }`}
          >
            <div className="inline-block text-indigo-400 font-mono text-sm mb-4 bg-indigo-500/10 px-3 py-1 rounded-full animate-pulse">
              STEP {step}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{title}</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">{description}</p>
            
            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li 
                  key={idx} 
                  className={`flex items-start gap-3 transition-all duration-700 ease-out ${
                    contentVisible 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-8'
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div 
            ref={visualRef}
            className={`flex-1 relative transition-all duration-1000 ease-out ${
              visualVisible 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-12 scale-95'
            }`}
          >
            <div 
              className="relative"
              style={{ transform: `translateY(${-offset}px)` }}
            >
              <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-12 shadow-2xl border border-white/10`}>
                <div className="text-white/90 mb-6 animate-pulse">{icon}</div>
                <div className="space-y-4">
                  {/* Mock UI Elements with staggered animations */}
                  <div 
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all duration-700 ${
                      visualVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}
                    style={{ transitionDelay: '200ms' }}
                  >
                    <div className="h-3 bg-white/30 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-2 bg-white/20 rounded w-full" />
                  </div>
                  <div 
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all duration-700 ${
                      visualVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}
                    style={{ transitionDelay: '400ms' }}
                  >
                    <div className="h-3 bg-white/30 rounded w-2/3 mb-2 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 bg-white/20 rounded w-5/6" />
                  </div>
                  <div 
                    className={`flex gap-2 transition-all duration-700 ${
                      visualVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '600ms' }}
                  >
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 h-16" />
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1 h-16" />
                  </div>
                </div>
              </div>
              
              {/* Floating accent */}
              <div className={`absolute -top-6 ${isLeft ? '-right-6' : '-left-6'} w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-3xl opacity-50 animate-pulse`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation()
  const { elementRef: cardsRef, isVisible: cardsVisible } = useScrollAnimation()

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div 
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Teams Love PulseIntel
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Stop wasting hours on manual competitor research. Let AI do the heavy lifting.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <BenefitCard
            icon={<Zap className="w-8 h-8" />}
            title="10x Faster"
            description="Get intelligence in minutes, not hours. Our AI processes thousands of sources simultaneously."
            delay={0}
            isVisible={cardsVisible}
          />
          <BenefitCard
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="99% Accurate"
            description="AI-verified sources and automated fact-checking ensure reliable intelligence."
            delay={200}
            isVisible={cardsVisible}
          />
          <BenefitCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Always Current"
            description="Real-time monitoring means you're always ahead of market shifts and competitor moves."
            delay={400}
            isVisible={cardsVisible}
          />
        </div>
      </div>
    </section>
  )
}

function BenefitCard({ 
  icon, 
  title, 
  description, 
  delay, 
  isVisible 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay: number
  isVisible: boolean
}) {
  return (
    <div 
      className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-indigo-500/50 hover:scale-105 transition-all duration-700 group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-indigo-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}
