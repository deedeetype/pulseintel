'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Zap, TrendingUp, Rocket, Crown, ChevronRight, ArrowLeft } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Zap,
    description: 'Perfect for trying out PulseIntel',
    features: [
      '1 Industry Profile',
      '10 Competitors tracked',
      '7 days data history',
      'Basic news monitoring',
      'Email support'
    ],
    limitations: [
      'No auto-refresh',
      'No manual refresh',
      'No exports',
      'No email alerts'
    ],
    cta: 'Current Plan',
    highlighted: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 15,
    icon: TrendingUp,
    description: 'Ideal for solo entrepreneurs and small teams',
    features: [
      '1 Industry Profile',
      '10 Competitors tracked',
      '30 days data history',
      'Daily auto-refresh',
      '1 manual refresh/day',
      'News & alerts monitoring',
      'Priority email support'
    ],
    cta: 'Get Started',
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49,
    icon: Rocket,
    description: 'Best for growing businesses',
    features: [
      '3 Industry Profiles',
      '30 Competitors per profile',
      '90 days data history',
      'Daily auto-refresh',
      'Unlimited manual refresh',
      'Advanced insights & alerts',
      'Data export (CSV/PDF)',
      'Email alert notifications',
      'Custom watchlists',
      'Priority support'
    ],
    cta: 'Go Pro',
    highlighted: true,
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    icon: Crown,
    description: 'For teams that need advanced features',
    features: [
      '10 Industry Profiles',
      '100 Competitors per profile',
      'Unlimited data history',
      'Daily auto-refresh',
      'Unlimited manual refresh',
      'All Professional features',
      'Weekly digest emails',
      'Slack webhook integration',
      'Advanced analytics',
      'Team collaboration',
      'Dedicated support'
    ],
    cta: 'Go Business',
    highlighted: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    icon: Crown,
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited Industry Profiles',
      'Unlimited Competitors',
      'Unlimited data history',
      'All Business features',
      'API access',
      'Custom integrations',
      'White-label option',
      'Advanced security',
      'SSO/SAML',
      'Dedicated account manager',
      '24/7 premium support',
      'Custom SLA'
    ],
    cta: 'Contact Sales',
    highlighted: false,
    enterprise: true
  }
]

export default function PricingPage() {
  const { isSignedIn, user } = useUser()
  const { plan: currentPlan, loading } = useSubscription()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/sign-up')
      return
    }

    if (planId === 'free' || planId === currentPlan) {
      return
    }

    if (planId === 'enterprise') {
      // TODO: Open contact form or redirect to contact page
      window.location.href = 'mailto:contact@wyzelens.com?subject=Enterprise Plan Inquiry'
      return
    }

    setLoadingPlan(planId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      })

      const { url, error } = await response.json()

      if (error) {
        console.error('Checkout error:', error)
        alert('Failed to create checkout session. Please try again.')
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const getButtonText = (plan: typeof plans[0]) => {
    if (!isSignedIn) {
      return plan.id === 'free' ? 'Sign Up Free' : plan.cta
    }

    if (loading) {
      return 'Loading...'
    }

    if (plan.id === currentPlan) {
      return 'Current Plan'
    }

    if (plan.id === 'enterprise') {
      return 'Contact Sales'
    }

    return plan.cta
  }

  const isButtonDisabled = (plan: typeof plans[0]) => {
    if (!isSignedIn && plan.id === 'free') {
      return false
    }
    return loading || loadingPlan !== null || (isSignedIn && plan.id === currentPlan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
            <span className="text-2xl font-bold text-white">PulseIntel</span>
          </Link>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link 
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/sign-in" 
                  className="text-slate-300 hover:text-white transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-300 text-sm font-medium">Simple, transparent pricing</span>
        </div>
        
        <h1 className="text-5xl font-bold text-white mb-4">
          Choose the plan that fits your needs
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Start free, upgrade when you're ready. Cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = isSignedIn && plan.id === currentPlan
            
            return (
              <div
                key={plan.id}
                className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105'
                    : 'border-slate-800 hover:border-slate-700'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    CURRENT
                  </div>
                )}

                <div className="mb-4">
                  <Icon className={`w-8 h-8 ${plan.highlighted ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4 min-h-[40px]">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-slate-400 text-sm">/month</span>}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isButtonDisabled(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all mb-6 flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50'
                      : isCurrentPlan
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-white disabled:bg-slate-800/50'
                  } disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id ? (
                    'Loading...'
                  ) : (
                    <>
                      {getButtonText(plan)}
                      {!isCurrentPlan && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ or Guarantee Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">All plans include</h2>
          <div className="grid md:grid-cols-3 gap-6 text-slate-300">
            <div>
              <div className="text-indigo-400 text-3xl mb-2">🔒</div>
              <div className="font-semibold mb-1">Secure & Private</div>
              <div className="text-sm text-slate-400">Your data is encrypted and never shared</div>
            </div>
            <div>
              <div className="text-indigo-400 text-3xl mb-2">⚡</div>
              <div className="font-semibold mb-1">Cancel Anytime</div>
              <div className="text-sm text-slate-400">No long-term contracts or commitments</div>
            </div>
            <div>
              <div className="text-indigo-400 text-3xl mb-2">💬</div>
              <div className="font-semibold mb-1">Great Support</div>
              <div className="text-sm text-slate-400">We're here to help you succeed</div>
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
