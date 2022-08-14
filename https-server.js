process.env.NODE_ENV = 'production'
process.chdir(__dirname)
const https = require('https')
const path = require('path')
const fs = require('fs')
const NextServer = require('next/dist/server/next-server').default
const { apiInit } = require('./api')

if (
  !fs.existsSync(process.env.SSL_KEY_FILE || './k8s/dev/secrets/tls.key') ||
  !fs.existsSync(process.env.SSL_CRT_FILE || './k8s/dev/secrets/tls.crt')
) {
  process.stderr.write('TLS KEY OR CERT MISSING\n')
  throw new Error('TLS KEY OR CERT MISSING')
}

let handler
const server = https.createServer(
  {
    key: fs.readFileSync(process.env.SSL_KEY_FILE || './k8s/dev/secrets/tls.key'),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE || './k8s/dev/secrets/tls.crt'),
  },
  async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error(err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }
)
const currentPort = parseInt(process.env.PORT, 10) || 3003

server.listen(currentPort, err => {
  if (err) {
    console.error('Failed to start server', err)
    throw err
  }
  const nextServer = new NextServer({
    hostname: process.env.NEXT_HOSTNAME || 'localhost',
    port: currentPort,
    dir: path.join(__dirname),
    dev: false,
    customServer: false,
    conf: {
      env: {},
      webpackDevMiddleware: null,
      eslint: { ignoreDuringBuilds: false },
      typescript: { ignoreBuildErrors: false, tsconfigPath: 'tsconfig.json' },
      distDir: './.next',
      cleanDistDir: true,
      assetPrefix: process.env.BUILD_ASSET_PREFIX || undefined,
      configOrigin: 'next.config.js',
      useFileSystemPublicRoutes: true,
      generateEtags: true,
      pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
      target: 'server',
      poweredByHeader: false,
      compress: true,
      analyticsId: '',
      images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        path: '/_next/image',
        loader: 'default',
        domains: [
          'i.imgur.com',
          'api.producthunt.com',
          'github.com',
          'artifacthub.io',
          'img.shields.io',
          'avatars.githubusercontent.com',
          'purecatamphetamine.github.io',
        ],
        disableStaticImages: false,
        minimumCacheTTL: 60,
        formats: ['image/webp'],
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
      },
      devIndicators: { buildActivity: true, buildActivityPosition: 'bottom-right' },
      onDemandEntries: { maxInactiveAge: 15000, pagesBufferLength: 2 },
      amp: { canonicalBase: '' },
      basePath: '',
      sassOptions: {},
      trailingSlash: false,
      i18n: null,
      productionBrowserSourceMaps: true,
      optimizeFonts: true,
      excludeDefaultMomentLocales: true,
      serverRuntimeConfig: {},
      publicRuntimeConfig: {},
      reactStrictMode: false,
      httpAgentOptions: { keepAlive: true },
      outputFileTracing: true,
      staticPageGenerationTimeout: 60,
      swcMinify: false,
      output: 'standalone',
      experimental: {
        optimisticClientCache: true,
        manualClientBasePath: false,
        legacyBrowsers: false,
        browsersListForSwc: true,
        newNextLinkBehavior: false,
        cpus: 4,
        sharedPool: true,
        profiling: false,
        isrFlushToDisk: true,
        workerThreads: false,
        pageEnv: false,
        optimizeCss: false,
        nextScriptWorkers: false,
        scrollRestoration: false,
        externalDir: false,
        disableOptimizedLoading: false,
        gzipSize: true,
        swcFileReading: true,
        craCompat: false,
        esmExternals: true,
        appDir: false,
        isrMemoryCacheSize: 52428800,
        serverComponents: false,
        fullySpecified: false,
        outputFileTracingRoot: '',
        images: { allowFutureImage: true },
        swcTraceProfiling: false,
        forceSwcTransforms: false,
        largePageDataBytes: 128000,
        trustHostHeader: false,
      },
      configFileName: 'next.config.js',
    },
  })
  handler = nextServer.getRequestHandler()

  console.log('HTTPS Listening on port', currentPort)
  apiInit()
})
