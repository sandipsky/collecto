import type { ImageItem } from '../types'

interface Props {
  items: ImageItem[]
  selected: Set<string>
  onOpen: (index: number) => void
  onTag: (tag: string) => void
}

export function MasonryGrid({ items, selected, onOpen, onTag }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty__art">🫙</div>
        <h3>Nothing here</h3>
        <p>No images match your filters. Try clearing tags or the search.</p>
      </div>
    )
  }

  return (
    <div className="masonry">
      {items.map((img, i) => (
        <figure className="card" key={img.src} onClick={() => onOpen(i)}>
          <img className="card__img" src={img.src} alt={img.name} loading="lazy" />
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
