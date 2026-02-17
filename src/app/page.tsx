export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            pulseintel
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            AI-powered competitive intelligence platform that aggregates market signals and transforms them into actionable strategic insights
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition">
              Get Started
            </button>
            <button className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
