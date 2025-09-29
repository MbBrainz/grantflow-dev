import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    clientSegmentCache: true,
  },
  eslint: {
    // Disable Next.js built-in ESLint to use our custom config
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
