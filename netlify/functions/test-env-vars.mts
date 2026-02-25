/**
 * Test: Check which env vars are available in scheduled functions
 */

import type { Config } from "@netlify/functions"

export default async (req: Request) => {
  const { next_run } = await req.json()
  
  // Log ALL environment variables (masked)
  const envCheck = {
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ SET' : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✅ SET' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING',
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? '✅ SET' : '❌ MISSING',
    POE_API_KEY: process.env.POE_API_KEY ? '✅ SET' : '❌ MISSING',
    NODE_ENV: process.env.NODE_ENV,
    URL: process.env.URL,
    next_run: next_run
  }
  
  // Write result to Supabase with the values we DO have
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  let dbWriteResult = 'NOT ATTEMPTED'
  
  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/alerts`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          scan_id: '73fba780-83ea-4761-a906-0ca47ddccd3f',
          title: `[ENV-TEST] Scheduled at ${new Date().toISOString()}`,
          description: JSON.stringify(envCheck, null, 2),
          priority: 'low',
          category: 'test',
          source: 'env-test'
        })
      })
      
      dbWriteResult = response.ok ? `✅ SUCCESS (${response.status})` : `❌ FAILED (${response.status})`
    } catch (error: any) {
      dbWriteResult = `❌ ERROR: ${error.message}`
    }
  } else {
    dbWriteResult = '❌ MISSING CREDENTIALS'
  }
  
  return new Response(JSON.stringify({
    ...envCheck,
    dbWriteResult,
    timestamp: new Date().toISOString()
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const config: Config = {
  schedule: "*/5 * * * *"
}
