/**
 * PulseIntel - Start Scan (lightweight, returns immediately)
 * Creates scan record in Supabase, then triggers background function
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_USER_ID = process.env.DEMO_USER_ID || '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7'

export default async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: corsHeaders })
  }

  try {
    const { industry } = await req.json()
    
    if (!industry) {
      return new Response(JSON.stringify({ error: 'Industry required' }), { status: 400, headers: corsHeaders })
    }

    // Create scan record in Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: DEMO_USER_ID,
        industry,
        status: 'pending'
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Supabase error: ${err}`)
    }

    const [scan] = await res.json()

    // Trigger background function
    const siteUrl = process.env.URL || 'https://pulseintel.netlify.app'
    fetch(`${siteUrl}/.netlify/functions/run-scan-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, scanId: scan.id })
    }).catch(err => console.error('Background trigger error:', err))

    // Return immediately with scanId
    return new Response(JSON.stringify({
      success: true,
      scanId: scan.id,
      industry,
      message: 'Scan started! Poll Supabase for status updates.'
    }), { headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
}
