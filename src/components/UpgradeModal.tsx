'use client'

import { X, Zap, Crown, Rocket } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: string
  feature?: string
}

export default function UpgradeModal({ isOpen, onClose, reason, feature }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {feature ? `Unlock ${feature}` : 'Upgrade Required'}
        </h2>

        {/* Reason */}
        {reason && (
          <p className="text-slate-400 text-center mb-6">
            {reason}
          </p>
        )}

        {/* Popular plans */}
        <div className="space-y-3 mb-6">
          <PlanCard
            icon={<Zap className="w-5 h-5" />}
            name="Starter"
            price="$15"
            features={['Daily auto-refresh', '1 manual refresh/day', '30 days history']}
            highlighted={false}
          />
          <PlanCard
            icon={<Rocket className="w-5 h-5" />}
            name="Professional"
            price="$49"
            features={['3 profiles', 'Unlimited refresh', 'Export data', 'Email alerts']}
            highlighted={true}
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
            onClick={onClose}
          >
            View All Plans
          </Link>
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Cancel anytime • No long-term contracts
        </p>
      </div>
    </div>
  )
}

function PlanCard({ icon, name, price, features, highlighted }: any) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        highlighted
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={highlighted ? 'text-indigo-400' : 'text-slate-400'}>{icon}</div>
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-slate-400">
              {price}<span className="text-xs">/month</span>
            </div>
          </div>
        </div>
        {highlighted && (
          <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full font-medium">
            POPULAR
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-green-400">✓</span> {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
