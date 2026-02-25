/**
 * Test scheduled function that writes to Supabase
 * Proves execution even without logs
 */

import type { Config } from "@netlify/functions"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

// Named export 'handler' instead of default
export const handler = async (req: Request) => {
  try {
    // Write a test row to prove execution
    const testData = {
      scan_id: '73fba780-83ea-4761-a906-0ca47ddccd3f', // Your Automotive scan
      title: `[TEST] Scheduled function ran at ${new Date().toISOString()}`,
      description: 'This alert proves the scheduled function executed successfully',
      priority: 'low' as const,
      category: 'test' as const,
      source: 'test-scheduled-function'
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/alerts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testData)
    })
    
    if (!response.ok) {
      throw new Error(`Supabase write failed: ${response.status}`)
    }
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config: Config = {
  schedule: "*/5 * * * *"
}
