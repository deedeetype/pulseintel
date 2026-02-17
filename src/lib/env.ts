/**
 * Environment variable validation and access
 * Handles both server-side (direct process.env) and client-side (NEXT_PUBLIC_)
 */

export function getEnvVar(key: string): string {
  // Server-side: direct access
  if (typeof window === 'undefined') {
    const value = process.env[key]
    if (!value) {
      console.error(`Missing environment variable: ${key}`)
      throw new Error(`Environment variable ${key} is required`)
    }
    return value
  }
  
  // Client-side shouldn't need these vars
  throw new Error(`Cannot access ${key} on client-side`)
}

export function getSupabaseConfig() {
  return {
    url: getEnvVar('SUPABASE_URL'),
    serviceKey: getEnvVar('SUPABASE_SERVICE_KEY'),
  }
}
