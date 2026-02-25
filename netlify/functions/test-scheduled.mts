/**
 * MINIMAL test scheduled function
 * Just logs and returns - no Supabase, no logic
 */

import type { Config } from "@netlify/functions"

// Named export 'handler' instead of default
export const handler = async (req: Request) => {
  console.log('[TEST-SCHEDULED] Function invoked at', new Date().toISOString())
  
  try {
    const body = await req.json()
    console.log('[TEST-SCHEDULED] Request body:', JSON.stringify(body))
    
    return new Response(JSON.stringify({
      message: 'Test scheduled function executed',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('[TEST-SCHEDULED] Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config: Config = {
  schedule: "*/5 * * * *"
}
