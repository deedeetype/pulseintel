import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

/**
 * POST /api/scan - Start a new scan
 * GET /api/scan?scanId=xxx - Check scan status
 */

export async function POST(request: NextRequest) {
  try {
    const { industry } = await request.json()
    
    if (!industry) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create scan record
    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        user_id: '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7', // Demo user for now
        industry,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scan:', error)
      return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
    }

    // Trigger agent in background (non-blocking)
    const agentPath = process.env.AGENT_PATH || '/data/.openclaw/workspace/business/pulseintel/agent'
    
    execAsync(`cd ${agentPath} && node agent.js "${industry}"`)
      .then(() => {
        console.log(`✓ Agent completed for ${industry}`)
      })
      .catch(err => {
        console.error(`✗ Agent failed for ${industry}:`, err)
        // Update scan status to failed
        supabase
          .from('scans')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', scan.id)
      })

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      industry,
      message: 'Scan started'
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (!scanId) {
      return NextResponse.json({ error: 'scanId is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single()

    if (error || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    return NextResponse.json(scan)

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
