/**
 * Scan Timeout Guard
 * Auto-completes scans stuck in "running" status for > 15 minutes
 */

import { supabase } from './supabase'

const TIMEOUT_MINUTES = 15

export async function cleanupStuckScans() {
  const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString()
  
  try {
    // Find scans stuck in "running" status for > 15 minutes
    const { data: stuckScans, error: fetchError } = await supabase
      .from('scans')
      .select('id, industry, updated_at')
      .eq('status', 'running')
      .lt('updated_at', timeoutThreshold)
    
    if (fetchError) {
      console.error('[TIMEOUT GUARD] Error fetching stuck scans:', fetchError)
      return
    }
    
    if (!stuckScans || stuckScans.length === 0) {
      return // No stuck scans
    }
    
    console.log(`[TIMEOUT GUARD] Found ${stuckScans.length} stuck scans, marking as completed:`)
    stuckScans.forEach(s => {
      const age = Math.round((Date.now() - new Date(s.updated_at).getTime()) / 1000 / 60)
      console.log(`  - ${s.id.slice(0, 8)} | ${s.industry} | ${age}min old`)
    })
    
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
      console.error('[TIMEOUT GUARD] Error updating stuck scans:', updateError)
    } else {
      console.log(`[TIMEOUT GUARD] ✅ Auto-completed ${stuckScans.length} stuck scans`)
    }
  } catch (e) {
    console.error('[TIMEOUT GUARD] Unexpected error:', e)
  }
}
