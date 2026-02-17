/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow build to succeed even if env vars are missing at build time
  // They will be available at runtime in serverless functions
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  // Ignore type errors during build (temporary)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
