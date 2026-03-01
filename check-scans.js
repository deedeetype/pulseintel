const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erkzlqgpbrxokyqtrgnf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkScans() {
  // Fetch all scans, sorted by created_at
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`\nTotal scans (last 50): ${data.length}\n`)
  
  // Group by industry
  const byIndustry = {}
  data.forEach(scan => {
    const key = scan.industry || 'unknown'
    if (!byIndustry[key]) byIndustry[key] = []
    byIndustry[key].push(scan)
  })
  
  Object.keys(byIndustry).sort().forEach(industry => {
    const scans = byIndustry[industry]
    console.log(`\n📊 ${industry} (${scans.length} scans)`)
    scans.slice(0, 10).forEach(s => {
      const created = new Date(s.created_at)
      const refreshed = s.last_refreshed_at ? new Date(s.last_refreshed_at) : null
      console.log(`  ${s.id.slice(0,8)} | ${s.status.padEnd(10)} | refresh_count:${s.refresh_count || 0} | created:${created.toLocaleString()} ${refreshed ? `| last_refresh:${refreshed.toLocaleString()}` : ''}`)
    })
    if (scans.length > 10) {
      console.log(`  ... and ${scans.length - 10} more`)
    }
  })
  
  // Show running scans
  const running = data.filter(s => s.status === 'running')
  if (running.length > 0) {
    console.log(`\n⚠️  ${running.length} STUCK SCANS (status=running):`)
    running.forEach(s => {
      const created = new Date(s.created_at)
      const age = Math.round((Date.now() - created.getTime()) / 1000 / 60) // minutes
      console.log(`  ${s.id} | ${s.industry} | created ${created.toLocaleString()} (${age} minutes ago)`)
    })
  }
  
  // Check for suspicious patterns (many scans same date)
  const today = new Date().toISOString().split('T')[0]
  const todayScans = data.filter(s => s.created_at.startsWith(today))
  if (todayScans.length > 5) {
    console.log(`\n🔍 ${todayScans.length} scans created today (${today})`)
  }
}

checkScans()
