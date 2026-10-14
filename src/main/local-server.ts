import http from 'http'
import fs from 'fs'
import path from 'path'
import { AddressInfo } from 'net'

let serverInstance: http.Server | null = null

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

/**
 * Starts a lightweight local HTTP server on loopback (127.0.0.1) with an ephemeral port
 * to serve the production renderer build with standard HTTP origins and referrers.
 * This prevents Chromium file:// protocol restrictions and YouTube Error 153.
 */
export function startLocalServer(rendererDistPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      const addr = serverInstance.address() as AddressInfo
      return resolve(`http://127.0.0.1:${addr.port}`)
    }

    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURI(req.url?.split('?')[0] || '/')
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html'

        const cleanReqPath = reqPath.replace(/^\/+/, '')
        const filePath = path.resolve(rendererDistPath, cleanReqPath)
        const relative = path.relative(rendererDistPath, filePath)

        // Security check: ensure resolved path does not escape rendererDistPath
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          res.writeHead(403)
          res.end('Forbidden')
          return
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase()
          const contentType = mimeTypes[ext] || 'application/octet-stream'

          res.writeHead(200, {
            'Content-Type': contentType,
            'Referrer-Policy': 'strict-origin-when-cross-origin'
          })
          fs.createReadStream(filePath).pipe(res)
        } else {
          // SPA Fallback to index.html
          const indexFile = path.join(rendererDistPath, 'index.html')
          if (fs.existsSync(indexFile)) {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Referrer-Policy': 'strict-origin-when-cross-origin'
            })
            fs.createReadStream(indexFile).pipe(res)
          } else {
            res.writeHead(404)
            res.end('Not Found')
          }
        }
      } catch {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })

    server.listen(0, '127.0.0.1', () => {
      serverInstance = server
      const addr = server.address() as AddressInfo
      resolve(`http://127.0.0.1:${addr.port}`)
    })

    server.on('error', (err) => {
      reject(err)
    })
  })
}

export function stopLocalServer(): void {
  if (serverInstance) {
    serverInstance.close()
    serverInstance = null
  }
}
