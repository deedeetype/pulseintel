/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow build to succeed even if env vars are missing at build time
  // They will be available at runtime in serverless functions
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
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
