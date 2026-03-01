const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erkzlqgpbrxokyqtrgnf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixStuckScans() {
  // Find all scans stuck in "running" status for > 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  
  const { data: stuckScans, error: fetchError } = await supabase
    .from('scans')
    .select('*')
    .eq('status', 'running')
    .lt('updated_at', thirtyMinutesAgo)
  
  if (fetchError) {
    console.error('Error fetching stuck scans:', fetchError)
    return
  }
  
  console.log(`Found ${stuckScans.length} stuck scans:\n`)
  
  stuckScans.forEach(s => {
    const age = Math.round((Date.now() - new Date(s.updated_at).getTime()) / 1000 / 60)
    console.log(`  ${s.id.slice(0,8)} | ${s.industry} | ${age}min old`)
  })
  
  if (stuckScans.length === 0) {
    console.log('✅ No stuck scans found!')
    return
  }
  
  // Mark them as completed (so they don't block refresh)
  const { error: updateError } = await supabase
    .from('scans')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .in('id', stuckScans.map(s => s.id))
  
  if (updateError) {
    console.error('Error updating stuck scans:', updateError)
  } else {
    console.log(`\n✅ Fixed ${stuckScans.length} stuck scans!`)
  }
}

fixStuckScans()
