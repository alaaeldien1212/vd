/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['gbnmunfdgdnvlzcabyxf.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Optimize for Netlify
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  // Use standard build for Netlify
  output: 'standalone',
}

module.exports = nextConfig
