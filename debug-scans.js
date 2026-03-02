const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erkzlqgpbrxokyqtrgnf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugScans() {
  // Fetch all scans created today
  const today = new Date().toISOString().split('T')[0]
  
  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`\n📊 Scans created today (${today}): ${scans.length}\n`)
  
  // Group by industry
  const byIndustry = {}
  scans.forEach(s => {
    const key = s.industry || 'Unknown Industry'
    if (!byIndustry[key]) byIndustry[key] = []
    byIndustry[key].push(s)
  })
  
  Object.keys(byIndustry).sort().forEach(industry => {
    const scanList = byIndustry[industry]
    console.log(`\n🏭 ${industry} (${scanList.length} scans)`)
    scanList.forEach(s => {
      const created = new Date(s.created_at)
      const refreshed = s.last_refreshed_at ? new Date(s.last_refreshed_at) : null
      const ageMin = Math.round((Date.now() - created.getTime()) / 1000 / 60)
      
      console.log(`\n  ID: ${s.id}`)
      console.log(`  Status: ${s.status}`)
      console.log(`  Company: ${s.company_name || 'N/A'}`)
      console.log(`  URL: ${s.company_url || 'N/A'}`)
      console.log(`  Created: ${created.toLocaleString()} (${ageMin}min ago)`)
      if (refreshed) {
        const refreshAgeMin = Math.round((Date.now() - refreshed.getTime()) / 1000 / 60)
        console.log(`  Last refresh: ${refreshed.toLocaleString()} (${refreshAgeMin}min ago)`)
      }
      console.log(`  Refresh count: ${s.refresh_count || 0}`)
      console.log(`  Competitors: ${s.competitors_count || 0}`)
      console.log(`  Alerts: ${s.alerts_count || 0}`)
      console.log(`  Insights: ${s.insights_count || 0}`)
      console.log(`  News: ${s.news_count || 0}`)
    })
  })
  
  // Show running scans
  const running = scans.filter(s => s.status === 'running')
  if (running.length > 0) {
    console.log(`\n\n⚠️  ${running.length} SCANS EN COURS (status=running):\n`)
    running.forEach(s => {
      const created = new Date(s.created_at)
      const ageMin = Math.round((Date.now() - created.getTime()) / 1000 / 60)
      console.log(`  ${s.id.slice(0,8)} | ${s.industry} | ${s.company_name || 'N/A'} | created ${ageMin}min ago`)
    })
  }
  
  // Detect "Unknown Industry" problem
  const unknownScans = scans.filter(s => !s.industry || s.industry === 'Unknown Industry')
  if (unknownScans.length > 0) {
    console.log(`\n\n🚨 PROBLÈME DÉTECTÉ: ${unknownScans.length} scans avec industry="Unknown Industry" ou null!\n`)
    console.log('Ces scans ont probablement été créés par le cron job avec une erreur.\n')
    
    unknownScans.forEach(s => {
      const created = new Date(s.created_at)
      console.log(`  ${s.id.slice(0,8)} | ${created.toLocaleString()} | refresh_count:${s.refresh_count || 0}`)
    })
  }
}

debugScans()
