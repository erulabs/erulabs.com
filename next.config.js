const NODE_ENV = process.env.NODE_ENV || 'development'

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextjsConfig = {
  assetPrefix: process.env.BUILD_ASSET_PREFIX,
  // swcMinify: true,
  productionBrowserSourceMaps: true,
  output: 'standalone',
  // reactStrictMode: true,
  experimental: {
    legacyBrowsers: false,
    browsersListForSwc: true,
    images: { allowFutureImage: true },
  },
  images: {
    // formats: ['image/avif', 'image/webp'],
    domains: [
      'i.imgur.com',
      'api.producthunt.com',
      'github.com',
      'artifacthub.io',
      'img.shields.io',
      'avatars.githubusercontent.com',
      'purecatamphetamine.github.io',
      NODE_ENV === 'development' ? 'localhost' : null,
    ].filter(Boolean),
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // {
          //   key: 'Content-Security-Policy',
          //   value: `frame-ancestors ${
          //     NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://pibox.io'
          //   }`,
          // },
          {
            key: 'Permissions-Policy',
            value: '',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // {
      //   source: '/(.*).json',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       value: 'public, max-age=315360000, immutable',
      //     },
      //   ],
      // },
    ]
  },
}

module.exports = withBundleAnalyzer(nextjsConfig)
