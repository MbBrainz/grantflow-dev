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
  // Fix for WalletConnect/pino bundling issues with Next.js 15
  // See: https://github.com/vercel/next.js/issues/56481
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  webpack: (config: { externals: string[] }) => {
    // Externalize problematic packages that cause SSR issues
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

export default nextConfig
