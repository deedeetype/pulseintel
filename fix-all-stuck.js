const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erkzlqgpbrxokyqtrgnf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVya3pscWdwYnJ4b2t5cXRyZ25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI4NTc4NSwiZXhwIjoyMDg2ODYxNzg1fQ.kiM7vc9skIxZcSnKVPnnue67TQGBRaNX68ZuCDAVAqs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAllStuck() {
  // Find ALL scans stuck in "running" status (no time limit)
  const { data: stuckScans, error: fetchError } = await supabase
    .from('scans')
    .select('*')
    .eq('status', 'running')
  
  if (fetchError) {
    console.error('Error fetching stuck scans:', fetchError)
    return
  }
  
  console.log(`Found ${stuckScans.length} stuck scans:\n`)
  
  stuckScans.forEach(s => {
    const created = new Date(s.created_at)
    const updated = new Date(s.updated_at)
    const age = Math.round((Date.now() - updated.getTime()) / 1000 / 60)
    console.log(`  ${s.id.slice(0,8)} | ${s.industry.padEnd(20)} | created: ${created.toLocaleString()} | updated: ${updated.toLocaleString()} | stuck for ${age} minutes`)
  })
  
  if (stuckScans.length === 0) {
    console.log('✅ No stuck scans found!')
    return
  }
  
  // Mark them as completed
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
    console.log(`\n✅ Fixed ${stuckScans.length} stuck scans (marked as completed)!`)
  }
}

fixAllStuck()
