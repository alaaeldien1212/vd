/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['gbnmunfdgdnvlzcabyxf.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Optimize for Netlify
  poweredByHeader: false,
  compress: true,
  // Skip dynamic routes for static export
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
