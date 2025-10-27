/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker deployment
  output: 'standalone',

  // Enable static generation for marketing pages
  experimental: {
    optimizePackageImports: ['react-hook-form', 'date-fns'],
    serverComponentsExternalPackages: ['bullmq', 'ioredis']
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000
  }
}

module.exports = nextConfig
