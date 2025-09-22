/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    PORT: '3001',
  },
  env: {
    PORT: '3001',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcaulkjfpzpxbyuzcazm.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXVsa2pmcHpweGJ5dXpjYXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODY0MDcsImV4cCI6MjA2NjE2MjQwN30.TaQ9bdoOm87mLuK11uaugpemfwdc-mw6XNe1r5YZ1zM',
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://rcaulkjfpzpxbyuzcazm.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXVsa2pmcHpweGJ5dXpjYXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODY0MDcsImV4cCI6MjA2NjE2MjQwN30.TaQ9bdoOm87mLuK11uaugpemfwdc-mw6XNe1r5YZ1zM',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXVsa2pmcHpweGJ5dXpjYXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4NjQwNywiZXhwIjoyMDY2MTYyNDA3fQ.sLs6seifOgB5TE8BtFPhuxzjIPDswanosO3zfyMBg8I',
  },
}

export default nextConfig
