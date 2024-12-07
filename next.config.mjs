/** @type {import('next').NextConfig} */

const dev = process.env.NODE_ENV !== 'production'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  productionBrowserSourceMaps: !dev,
  reactStrictMode: true,
  output: dev ? undefined : 'standalone',
  images: {},
  poweredByHeader: false,
  compress: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
