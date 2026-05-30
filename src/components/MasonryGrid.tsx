import { useState } from 'react'
import type { ImageItem } from '../types'

interface Props {
  items: ImageItem[]
  selected: Set<string>
  onOpen: (index: number) => void
  onTag: (tag: string) => void
}

export function MasonryGrid({ items, selected, onOpen, onTag }: Props) {
  // Track which sources are landscape-oriented so their card spans 2 columns.
  // Determined from naturalWidth/naturalHeight once the image actually loads.
  const [wide, setWide] = useState<Set<string>>(new Set())

  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty__art">🫙</div>
        <h3>Nothing here</h3>
        <p>No images match your filters. Try clearing tags or the search.</p>
      </div>
    )
  }

  const onImgLoad = (src: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (naturalWidth > naturalHeight) {
      setWide((prev) => {
        if (prev.has(src)) return prev
        const next = new Set(prev)
        next.add(src)
        return next
      })
    }
  }

  return (
    <div className="masonry">
      {items.map((img, i) => (
        <figure
          className={`card${wide.has(img.src) ? ' card--wide' : ''}`}
          key={img.src}
          onClick={() => onOpen(i)}
        >
          <img
            className="card__img"
            src={img.src}
            alt={img.name}
            loading="lazy"
            onLoad={onImgLoad(img.src)}
          />
          <figcaption className="card__overlay">
            <div className="card__tags">
              {img.tags.map((t) => (
                <button
                  key={t}
                  className={`card__tag${selected.has(t) ? ' card__tag--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTag(t)
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
