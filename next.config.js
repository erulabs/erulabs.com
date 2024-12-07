/** @type {import('next').NextConfig} */

const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
  const dev = phase === PHASE_DEVELOPMENT_SERVER

  return {
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
}

