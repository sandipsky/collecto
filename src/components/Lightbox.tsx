import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageItem } from '../types'

interface Props {
  items: ImageItem[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}

const MIN = 1
const MAX = 6

interface View {
  scale: number
  x: number
  y: number
}

const RESET: View = { scale: 1, x: 0, y: 0 }

export function Lightbox({ items, index, onClose, onIndex }: Props) {
  const item = items[index]
  const stageRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>(RESET)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Reset zoom/pan whenever the displayed image changes ("scale to fit on open").
  // Adjusting state during render is the recommended pattern for prop-driven resets.
  const [shownIndex, setShownIndex] = useState(index)
  if (index !== shownIndex) {
    setShownIndex(index)
    setView(RESET)
  }

  const prev = useCallback(() => {
    onIndex((index - 1 + items.length) % items.length)
  }, [index, items.length, onIndex])

  const next = useCallback(() => {
    onIndex((index + 1) % items.length)
  }, [index, items.length, onIndex])

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  // Lock page scroll while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // Native, non-passive wheel listener so we can preventDefault and zoom toward the cursor.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = stage.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const sx = e.clientX - cx
      const sy = e.clientY - cy

      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015)
        const scale = Math.min(MAX, Math.max(MIN, v.scale * factor))
        if (scale === v.scale) return v
        if (scale <= MIN + 0.001) return RESET
        // Keep the point under the cursor fixed while zooming.
        const x = sx - (scale / v.scale) * (sx - v.x)
        const y = sy - (scale / v.scale) * (sy - v.y)
        return { scale, x, y }
      })
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (view.scale <= MIN) return
    drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y }
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer may already be gone — capture is best-effort */
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    // Capture values now; don't read the ref inside the async setState updater,
    // or a racing pointerup (which nulls drag.current) would throw mid-render.
    const x = d.ox + (e.clientX - d.x)
    const y = d.oy + (e.clientY - d.y)
    setView((v) => ({ ...v, x, y }))
  }

  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const stage = stageRef.current
    if (!stage) return
    if (view.scale > MIN) {
      setView(RESET)
      return
    }
    const rect = stage.getBoundingClientRect()
    const sx = e.clientX - (rect.left + rect.width / 2)
    const sy = e.clientY - (rect.top + rect.height / 2)
    const scale = 2.5
    setView({ scale, x: sx - scale * sx, y: sy - scale * sy })
  }

  if (!item) return null

  return (
    <div className="lb" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lb__btn lb__close" onClick={onClose} aria-label="Close (Esc)">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {items.length > 1 && (
        <>
          <button
            className="lb__btn lb__nav lb__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous (←)"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <button
            className="lb__btn lb__nav lb__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next (→)"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </>
      )}

      <div
        ref={stageRef}
        className="lb__stage"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ cursor: view.scale > MIN ? (dragging ? 'grabbing' : 'grab') : 'auto' }}
      >
        <img
          className="lb__img"
          src={item.src}
          alt={item.name}
          draggable={false}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: dragging ? 'none' : 'transform 0.12s ease-out',
          }}
        />
      </div>
    </div>
  )
}
