import { useMemo, useState } from 'react'
import { allImages, buildTagIndex } from './lib/images'
import { useTheme } from './hooks/useTheme'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { MasonryGrid } from './components/MasonryGrid'
import { Lightbox } from './components/Lightbox'
import type { SortKey } from './types'
import './App.css'

/** Stable pseudo-shuffle so "Shuffle" doesn't reorder on every keystroke. */
function seededOrder(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 1000000007
  return h
}

function App() {
  const [theme, toggleTheme] = useTheme()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('name-asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)

  const tagIndex = useMemo(() => buildTagIndex(allImages), [])

  const toggleTag = (tag: string) => {
    setSelected((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(tag)) nextSet.delete(tag)
      else nextSet.add(tag)
      return nextSet
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const tags = Array.from(selected)

    const result = allImages.filter((img) => {
      // Multi-select tags are combined with AND.
      if (tags.length && !tags.every((t) => img.tags.includes(t))) return false
      if (q) {
        const hay = (img.name + ' ' + img.tags.join(' ') + ' ' + img.folder).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'tags-desc':
          return b.tags.length - a.tags.length || a.name.localeCompare(b.name)
        case 'random':
          return seededOrder(a.name) - seededOrder(b.name)
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [query, selected, sort])

  return (
    <div className="app">
      <Topbar
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        count={filtered.length}
      />

      <div className="layout">
        <Sidebar
          tags={tagIndex}
          selected={selected}
          onToggle={toggleTag}
          onClear={() => setSelected(new Set())}
          open={sidebarOpen}
        />

        {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

        <main className="content">
          <MasonryGrid
            items={filtered}
            selected={selected}
            onOpen={setViewer}
            onTag={toggleTag}
          />
        </main>
      </div>

      {viewer !== null && filtered[viewer] && (
        <Lightbox
          items={filtered}
          index={viewer}
          onClose={() => setViewer(null)}
          onIndex={setViewer}
        />
      )}
    </div>
  )
}

export default App
