import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    clientSegmentCache: true,
  },
  eslint: {
    // Disable Next.js built-in ESLint to use our custom config
    ignoreDuringBuilds: true,
  },
  images: {
    // Allow https://avatars.githubusercontent.com/u as a valid external image source
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
    ],
  },
}

export default nextConfig
