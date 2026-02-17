import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                PulseIntel
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition">
                Dashboard
              </Link>
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              AI-Powered
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Competitive Intelligence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Aggregate market signals in real-time and transform them into actionable strategic insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/onboarding"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg transition shadow-lg shadow-indigo-500/50"
              >
                Start Free Trial
              </Link>
              <Link
                href="#demo"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-lg transition backdrop-blur-sm"
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
            {[
              { value: '10K+', label: 'Data Sources' },
              { value: '24/7', label: 'Real-time Monitoring' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '<1s', label: 'Alert Latency' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to stay ahead
            </h2>
            <p className="text-xl text-slate-400">
              Comprehensive competitive intelligence in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'Real-time Dashboard',
                description: 'KPIs, market dynamics, and competitive positioning at a glance'
              },
              {
                icon: '🎯',
                title: 'Competitor Monitoring',
                description: 'Track threat scores, funding, hiring, and strategic moves'
              },
              {
                icon: '📰',
                title: 'News Aggregation',
                description: 'Automatically classified and prioritized industry news'
              },
              {
                icon: '🤖',
                title: 'AI Insights',
                description: 'Strategic recommendations powered by advanced AI models'
              },
              {
                icon: '🔔',
                title: 'Smart Alerts',
                description: 'Prioritized notifications with customizable thresholds'
              },
              {
                icon: '📈',
                title: 'Trend Analysis',
                description: 'Emerging technologies, regulations, and market shifts'
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-indigo-500/50 transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-400">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for getting started',
                features: [
                  'Up to 3 competitors',
                  'Basic news feed',
                  'Weekly reports',
                  'Email alerts',
                ],
              },
              {
                name: 'Pro',
                price: '$49',
                description: 'For serious analysts',
                features: [
                  'Unlimited competitors',
                  'Real-time updates',
                  'AI insights',
                  'Priority alerts',
                  'Team collaboration',
                  'API access',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large organizations',
                features: [
                  'Everything in Pro',
                  'SSO & SAML',
                  'Custom integrations',
                  'Dedicated support',
                  'SLA guarantee',
                  'White-label option',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-xl border ${
                  plan.popular
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-slate-400 ml-2">/month</span>
                  )}
                </div>
                <p className="text-slate-400 mb-6">{plan.description}</p>
                <Link
                  href="/onboarding"
                  className={`block w-full py-3 text-center font-semibold rounded-lg transition ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Get Started
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to gain competitive advantage?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hundreds of companies using PulseIntel to stay ahead
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:bg-slate-100 transition"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2026 PulseIntel. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Built with Next.js, Supabase, Clerk, and Stripe
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
