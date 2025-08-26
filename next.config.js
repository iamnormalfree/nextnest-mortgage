/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static generation for marketing pages
  experimental: {
    optimizePackageImports: ['react-hook-form', 'date-fns']
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
