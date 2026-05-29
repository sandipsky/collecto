export interface ImageItem {
  /** Public URL, e.g. /images/cat1/green_kitchen_decor.jpg */
  src: string
  /** File name without extension, e.g. green_kitchen_decor */
  name: string
  /** Folder this image lives in (relative to /images), or '' for the root. */
  folder: string
  /** Tags parsed from the file name (split on '_'). */
  tags: string[]
}

export interface TagInfo {
  tag: string
  count: number
  /** Hue (0-360) deterministically derived from the tag — drives the chip color. */
  hue: number
}

export type SortKey = 'name-asc' | 'name-desc' | 'tags-desc' | 'random'
