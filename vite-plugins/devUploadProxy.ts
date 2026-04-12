import type { IncomingMessage } from 'node:http'
import type { Connect, Plugin } from 'vite'

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

/** Forward multipart POST to Catbox / Litterbox without broken proxy rewriting. */
function forwardMultipart(
  pathPrefix: string,
  targetUrl: string,
): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith(pathPrefix) || req.method !== 'POST') {
      next()
      return
    }
    try {
      const body = await readRawBody(req)
      const contentType = req.headers['content-type']
      if (!contentType) {
        res.statusCode = 400
        res.end('Missing Content-Type')
        return
      }

      const r = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'User-Agent':
            req.headers['user-agent'] ??
            'Mozilla/5.0 (compatible; NaraNarrator/1.0)',
          Accept: '*/*',
        },
        body,
      })

      const text = await r.text()
      res.statusCode = r.status
      const outCt = r.headers.get('content-type')
      if (outCt) res.setHeader('Content-Type', outCt)
      res.end(text)
    } catch (e) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(e instanceof Error ? e.message : 'Upload proxy error')
    }
  }
}

export function devUploadProxyPlugin(): Plugin {
  const attach = (middlewares: Connect.Server) => {
    middlewares.use(forwardMultipart('/api/catbox', 'https://catbox.moe/user/api.php'))
    middlewares.use(
      forwardMultipart(
        '/api/litterbox',
        'https://litterbox.catbox.moe/resources/internals/api.php',
      ),
    )
  }

  return {
    name: 'dev-upload-proxy-catbox-litterbox',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
