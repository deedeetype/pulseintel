'use client'

import Link from 'next/link'
import { Zap, TrendingUp, Rocket, Crown, Sparkles } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

export default function PlanBadge() {
  const { plan, loading } = useSubscription()

  if (loading) {
    return (
      <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse"></div>
    )
  }

  const planConfig = {
    free: {
      icon: Zap,
      label: 'Free',
      color: 'bg-slate-700 text-slate-300 border-slate-600',
      iconColor: 'text-slate-400'
    },
    starter: {
      icon: TrendingUp,
      label: 'Starter',
      color: 'bg-green-500/20 text-green-400 border-green-500/50',
      iconColor: 'text-green-400'
    },
    pro: {
      icon: Rocket,
      label: 'Pro',
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
      iconColor: 'text-indigo-400'
    },
    business: {
      icon: Crown,
      label: 'Business',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      iconColor: 'text-purple-400'
    },
    enterprise: {
      icon: Sparkles,
      label: 'Enterprise',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      iconColor: 'text-yellow-400'
    }
  }

  const config = planConfig[plan] || planConfig.free
  const Icon = config.icon

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${config.color}`}
      title="View plans and upgrade"
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      {config.label}
    </Link>
  )
}
