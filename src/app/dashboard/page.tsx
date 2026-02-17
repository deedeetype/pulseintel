export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI Cards */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Competitors</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">12</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">3</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">New Insights</h3>
            <p className="text-3xl font-bold text-primary mt-2">7</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Market Score</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">8.4</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Connect your data sources to see real-time competitive intelligence here.
          </p>
        </div>
      </div>
    </div>
  )
}
