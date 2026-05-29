import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const VIRTUAL_ID = 'virtual:images'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'])

/** Recursively collect image files under `dir`, returning public URLs (e.g. /images/cat1/a_b.jpg). */
function scan(dir: string, urlBase: string): string[] {
  let out: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    const url = `${urlBase}/${entry.name}`
    if (entry.isDirectory()) {
      out = out.concat(scan(full, url))
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(url)
    }
  }
  return out
}

export default function imagesPlugin(): Plugin {
  const imagesDir = path.resolve(process.cwd(), 'public', 'images')

  const collect = () => scan(imagesDir, '/images').sort((a, b) => a.localeCompare(b))

  return {
    name: 'vite-plugin-images',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id === RESOLVED_ID) {
        return `export const images = ${JSON.stringify(collect())}\n`
      }
    },

    configureServer(server: ViteDevServer) {
      // Watch the images directory so newly added/removed files trigger a reload.
      server.watcher.add(imagesDir)

      const refresh = (file: string) => {
        if (!file.startsWith(imagesDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('addDir', refresh)
      server.watcher.on('unlinkDir', refresh)
    },
  }
}
