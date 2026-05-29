import type { ImageItem, TagInfo } from '../types'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i

/** Deterministic string hash → 0..2^32. */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Stable hue (0-359) for a tag so its chip color never changes between renders. */
export function tagHue(tag: string): number {
  return hash(tag) % 360
}

interface DirEntry {
  name: string
  type: 'file' | 'directory'
}

async function listDir(url: string): Promise<DirEntry[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function scan(url: string): Promise<string[]> {
  const entries = await listDir(url)
  const nested = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith('.'))
      .map(async (e): Promise<string[]> => {
        const child = `${url}${encodeURIComponent(e.name)}${e.type === 'directory' ? '/' : ''}`
        if (e.type === 'directory') return scan(child)
        return IMAGE_EXT.test(e.name) ? [child] : []
      }),
  )
  return nested.flat()
}

function parse(src: string): ImageItem {
  const withoutBase = decodeURIComponent(src).replace(/^\/images\/?/, '')
  const slash = withoutBase.lastIndexOf('/')
  const folder = slash === -1 ? '' : withoutBase.slice(0, slash)
  const file = slash === -1 ? withoutBase : withoutBase.slice(slash + 1)
  const dot = file.lastIndexOf('.')
  const name = dot === -1 ? file : file.slice(0, dot)

  const parts = name
    .split('_')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  // Drop a trailing purely-numeric segment so e.g. a_b_c_1.jpg and a_b_c_2.jpg
  // share the {a, b, c} tag set rather than spawning a tag per counter.
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    parts.pop()
  }

  const tags = Array.from(new Set(parts))
  return { src, name, folder, tags }
}

/** Discover images by recursively walking the /images/ directory at runtime. */
export async function loadImages(): Promise<ImageItem[]> {
  const urls = await scan('/images/')
  urls.sort((a, b) => a.localeCompare(b))
  return urls.map(parse)
}

/** Tag → count, with a stable color hue, sorted by descending count then name. */
export function buildTagIndex(items: ImageItem[]): TagInfo[] {
  const counts = new Map<string, number>()
  for (const img of items) {
    for (const tag of img.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts, ([tag, count]) => ({ tag, count, hue: tagHue(tag) })).sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
  )
}
