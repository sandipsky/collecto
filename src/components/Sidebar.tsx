import type { TagInfo } from '../types'

interface Props {
  tags: TagInfo[]
  selected: Set<string>
  onToggle: (tag: string) => void
  onClear: () => void
  open: boolean
}

export function Sidebar({ tags, selected, onToggle, onClear, open }: Props) {
  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      <div className="sidebar__head">
        <h2 className="sidebar__title">Tags</h2>
        {selected.size > 0 && (
          <button className="sidebar__clear" onClick={onClear}>
            Clear ({selected.size})
          </button>
        )}
      </div>

      <div className="chips">
        {tags.length === 0 && <p className="muted">No tags yet.</p>}
        {tags.map(({ tag, count, hue }) => {
          const active = selected.has(tag)
          return (
            <button
              key={tag}
              className={`chip${active ? ' chip--active' : ''}`}
              style={{ '--h': hue } as React.CSSProperties}
              onClick={() => onToggle(tag)}
              aria-pressed={active}
              title={`${tag} — ${count} image${count === 1 ? '' : 's'}`}
            >
              <span className="chip__label">{tag}</span>
              <span className="chip__count">{count}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
