const fs = require('fs')
const createServer = require('http').createServer
const createSecureServer = require('https').createServer
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

require('./api')

app.prepare().then(() => {
  let server
  if (process.env.USE_INSECURE_SERVER) {
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    })
  } else {
    server = createSecureServer(
      {
        key: fs.readFileSync(process.env.SSL_KEY_FILE || './k8s/dev/secrets/tls.key'),
        cert: fs.readFileSync(process.env.SSL_CRT_FILE || './k8s/dev/secrets/tls.crt'),
      },
      (req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
      }
    )
  }
  server.listen(3003, err => {
    if (err) throw err
    console.log(
      `> DEVELOPMENT Ready on http${process.env.USE_INSECURE_SERVER ? '' : 's'}://localhost:3003`
    )
  })
})
