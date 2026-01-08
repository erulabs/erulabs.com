/** @type {import('next').NextConfig} */

import crypto from 'crypto'
import type { NextConfig } from 'next'

import { loadEnvConfig } from '@next/env'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

let buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || ''

if (!buildId && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_APP_BUILD_ID is not set')
} else {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Generating build ID! This should only happen in development, but NODE_ENV IS', process.env.NODE_ENV)
  }
  buildId = crypto.randomBytes(8).toString('hex')
}

console.log('NextJS building with environment variables:')
console.log('next.config.ts: NODE_ENV: ', process.env.NODE_ENV)
console.log('next.config.ts: NEXT_PUBLIC_APP_BUILD_ID: ', process.env.NEXT_PUBLIC_APP_BUILD_ID)
console.log('next.config.ts: NEXT_PUBLIC_APP_ENV: ', process.env.NEXT_PUBLIC_APP_ENV)
console.log('next.config.ts: NEXT_PUBLIC_API_TARGET: ', process.env.NEXT_PUBLIC_API_TARGET)
console.log('next.config.ts: NEXT_PUBLIC_WSS_TARGET: ', process.env.NEXT_PUBLIC_WSS_TARGET)
console.log('next.config.ts: NEXT_PUBLIC_USE_RELATIVE_API_TARGET: ', process.env.NEXT_PUBLIC_USE_RELATIVE_API_TARGET)
console.log('next.config.ts: NEXT_PUBLIC_STATIC_ASSET_PATH: ', process.env.NEXT_PUBLIC_STATIC_ASSET_PATH)

const config = (phase: string): NextConfig => {
  const dev = phase === PHASE_DEVELOPMENT_SERVER

  return {
    productionBrowserSourceMaps: true,
    reactStrictMode: true,
    output: dev ? undefined : 'standalone',
    assetPrefix: process.env.NEXT_PUBLIC_STATIC_ASSET_PATH || undefined,
    generateBuildId: async () => buildId,
    images: {
      disableStaticImages: false,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 's3',
        },
        { protocol: 'https', hostname: 'github.com' },
      ],
    },
  }
}

export default config
