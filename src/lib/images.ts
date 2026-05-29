import { images as rawImages } from 'virtual:images'
import type { ImageItem, TagInfo } from '../types'

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

function parse(src: string): ImageItem {
  // src like /images/cat1/green_kitchen_decor.jpg
  const withoutBase = src.replace(/^\/images\/?/, '')
  const slash = withoutBase.lastIndexOf('/')
  const folder = slash === -1 ? '' : withoutBase.slice(0, slash)
  const file = slash === -1 ? withoutBase : withoutBase.slice(slash + 1)
  const dot = file.lastIndexOf('.')
  const name = dot === -1 ? file : file.slice(0, dot)

  const tags = Array.from(
    new Set(
      name
        .split('_')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

  return { src, name, folder, tags }
}

/** All images, parsed once. */
export const allImages: ImageItem[] = rawImages.map(parse)

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
