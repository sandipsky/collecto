import type { Theme } from '../hooks/useTheme'
import type { SortKey } from '../types'

interface Props {
  query: string
  onQuery: (q: string) => void
  sort: SortKey
  onSort: (s: SortKey) => void
  theme: Theme
  onToggleTheme: () => void
  onToggleSidebar: () => void
  count: number
}

export function Topbar({
  query,
  onQuery,
  sort,
  onSort,
  theme,
  onToggleTheme,
  onToggleSidebar,
  count,
}: Props) {
  return (
    <header className="topbar">
      <button className="icon-btn topbar__menu" onClick={onToggleSidebar} aria-label="Toggle tags">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      <div className="brand">
        <span className="brand__dot" />
        <span className="brand__name">collecto</span>
        <span className="brand__count">{count}</span>
      </div>

      <div className="search">
        <svg className="search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="search__input"
          type="search"
          placeholder="Search images and tags…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button className="search__clear" onClick={() => onQuery('')} aria-label="Clear search">
            ×
          </button>
        )}
      </div>

      <div className="topbar__right">
        <label className="select">
          <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} aria-label="Sort">
            <option value="name-asc">Name ↑</option>
            <option value="name-desc">Name ↓</option>
            <option value="tags-desc">Most tags</option>
            <option value="random">Shuffle</option>
          </select>
        </label>

        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="4.5" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
              </g>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
