/**
 * PulseIntel - Start Scan (lightweight, returns immediately)
 * Creates scan record, triggers background function
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_USER_ID = process.env.DEMO_USER_ID || '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) }
  }

  try {
    const { industry } = JSON.parse(event.body || '{}')
    
    if (!industry) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Industry required' }) }
    }

    // Create scan record in Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY!,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        scanId: scan.id,
        industry,
        message: 'Scan started'
      })
    }

  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

export { handler }
