import fs from 'node:fs/promises'
import path from 'node:path'
import type { Connect, Plugin, PreviewServer, ViteDevServer } from 'vite'

/**
 * Serve `/images/<subpath>/` as a JSON directory listing matching nginx's
 * `autoindex_format json` output. The client recursively walks these
 * listings at runtime, so adding/removing files under the served images
 * folder is reflected without rebuilding.
 *
 *  - dev:     reads from public/images (and watches it to HMR-reload).
 *  - preview: reads from dist/images.
 *  - prod:    nginx handles it via autoindex; this plugin is not involved.
 */
export default function imagesPlugin(): Plugin {
  const publicImages = path.resolve(process.cwd(), 'public', 'images')
  const builtImages = path.resolve(process.cwd(), 'dist', 'images')

  function middleware(baseDir: string): Connect.NextHandleFunction {
    return async (req, res, next) => {
      const url = req.url || ''
      if (!url.startsWith('/images/')) return next()

      const pathPart = url.split('?')[0]
      if (!pathPart.endsWith('/')) return next()

      const rel = decodeURIComponent(pathPart.slice('/images/'.length).replace(/\/$/, ''))
      const dirPath = rel ? path.join(baseDir, rel) : baseDir

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        const json = entries
          .filter((e) => !e.name.startsWith('.'))
          .map((e) => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
          }))
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(json))
      } catch {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end('[]')
      }
    }
  }

  return {
    name: 'vite-plugin-images',

    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware(publicImages))

      // Watch public/images so adding/removing files triggers a full
      // reload — the client re-runs loadImages() on mount.
      server.watcher.add(publicImages)
      const refresh = (file: string) => {
        if (!file.startsWith(publicImages)) return
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('addDir', refresh)
      server.watcher.on('unlinkDir', refresh)
    },

    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(middleware(builtImages))
    },
  }
}
