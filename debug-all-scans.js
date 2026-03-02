const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erkzlqgpbrxokyqtrgnf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAllScans() {
  // Fetch all scans (last 100)
  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`\n📊 Total scans (last 100): ${scans.length}\n`)
  
  // Look for "Unknown Industry" scans
  const unknownScans = scans.filter(s => !s.industry || s.industry === 'Unknown Industry')
  
  if (unknownScans.length > 0) {
    console.log(`🚨 Found ${unknownScans.length} scans with "Unknown Industry":\n`)
    unknownScans.slice(0, 20).forEach(s => {
      const created = new Date(s.created_at)
      const refreshed = s.last_refreshed_at ? new Date(s.last_refreshed_at) : null
      console.log(`\n  ID: ${s.id}`)
      console.log(`  Industry: "${s.industry || 'NULL'}"`)
      console.log(`  Status: ${s.status}`)
      console.log(`  Company: ${s.company_name || 'N/A'}`)
      console.log(`  URL: ${s.company_url || 'N/A'}`)
      console.log(`  Created: ${created.toLocaleString()}`)
      if (refreshed) {
        console.log(`  Last refresh: ${refreshed.toLocaleString()}`)
      }
      console.log(`  Refresh count: ${s.refresh_count || 0}`)
    })
    
    if (unknownScans.length > 20) {
      console.log(`\n... and ${unknownScans.length - 20} more`)
    }
  } else {
    console.log('✅ No "Unknown Industry" scans found')
  }
  
  // Show running scans
  const running = scans.filter(s => s.status === 'running')
  if (running.length > 0) {
    console.log(`\n\n⚠️  ${running.length} SCANS STUCK (status=running):\n`)
    running.forEach(s => {
      const updated = new Date(s.updated_at)
      const ageMin = Math.round((Date.now() - updated.getTime()) / 1000 / 60)
      console.log(`  ${s.id.slice(0,8)} | ${s.industry || 'Unknown'} | updated ${ageMin}min ago`)
    })
  } else {
    console.log('\n✅ No stuck scans')
  }
}

debugAllScans()
