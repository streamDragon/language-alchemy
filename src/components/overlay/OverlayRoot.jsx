import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function getFocusableElements(container) {
  if (!container) return []
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll(selector)).filter((el) => {
    if (!(el instanceof HTMLElement)) return false
    const style = window.getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none') return false
    return true
  })
}

export default function OverlayRoot({ overlay, onRequestClose, onHistoryPop }) {
  const panelRef = useRef(null)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartRef = useRef(0)
  const touchTrackingRef = useRef(false)
  const lockRef = useRef(null)

  const isSheet = useMemo(
    () => window.matchMedia?.('(max-width: 767px)')?.matches ?? false,
    [overlay?.id],
  )

  useEffect(() => {
    if (!overlay) return
    const onPopState = () => {
      onHistoryPop?.()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [onHistoryPop, overlay])

  useEffect(() => {
    if (!overlay) return

    const body = document.body
    const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0)
    const scrollX = Math.max(0, window.scrollX || window.pageXOffset || 0)
    const previous = {
      position: body.style.position || '',
      top: body.style.top || '',
      left: body.style.left || '',
      right: body.style.right || '',
      width: body.style.width || '',
      overflow: body.style.overflow || '',
      paddingRight: body.style.paddingRight || '',
    }
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    body.classList.add('overlay-open')
    lockRef.current = { previous, scrollY, scrollX }

    return () => {
      const lock = lockRef.current
      const prev = lock?.previous || {}
      body.style.position = prev.position || ''
      body.style.top = prev.top || ''
      body.style.left = prev.left || ''
      body.style.right = prev.right || ''
      body.style.width = prev.width || ''
      body.style.overflow = prev.overflow || ''
      body.style.paddingRight = prev.paddingRight || ''
      body.classList.remove('overlay-open')
      if (lock) window.scrollTo(Number(lock.scrollX || 0), Number(lock.scrollY || 0))
      lockRef.current = null
    }
  }, [overlay])

  useEffect(() => {
    if (!overlay) return
    const panel = panelRef.current
    if (!panel) return
    const focusables = getFocusableElements(panel)
    const target = focusables[0] || panel
    if (target && typeof target.focus === 'function') {
      try {
        target.focus({ preventScroll: true })
      } catch (_error) {
        target.focus()
      }
    }
  }, [overlay])

  useEffect(() => {
    if (!overlay) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onRequestClose('esc')
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = getFocusableElements(panelRef.current)
      if (!focusables.length) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeElement = document.activeElement
      if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && (activeElement === first || activeElement === panelRef.current)) {
        event.preventDefault()
        last.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onRequestClose, overlay])

  useEffect(() => {
    if (!overlay) {
      setDragOffset(0)
      touchTrackingRef.current = false
    }
  }, [overlay])

  if (!overlay) return null

  const onBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return
    if (overlay.closeOnBackdrop === false) return
    onRequestClose('backdrop')
  }

  const onTouchStart = (event) => {
    if (!isSheet) return
    if (!panelRef.current || panelRef.current.scrollTop > 0) {
      touchTrackingRef.current = false
      return
    }
    touchTrackingRef.current = true
    touchStartRef.current = event.touches[0]?.clientY || 0
  }

  const onTouchMove = (event) => {
    if (!touchTrackingRef.current || !isSheet) return
    const currentY = event.touches[0]?.clientY || 0
    const delta = Math.max(0, currentY - touchStartRef.current)
    setDragOffset(Math.min(delta, 180))
  }

  const onTouchEnd = () => {
    if (!touchTrackingRef.current || !isSheet) return
    const shouldClose = dragOffset > 96
    touchTrackingRef.current = false
    setDragOffset(0)
    if (shouldClose) onRequestClose('swipe')
  }

  const sizeClass = `global-overlay-size-${overlay.size || 'md'}`
  const className = `global-overlay-panel ${sizeClass}${isSheet ? ' is-sheet' : ''}`

  return createPortal(
    <div className="global-overlay-root" role="presentation" onClick={onBackdropClick}>
      <section
        className={className}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={overlay.title || 'Overlay'}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        {overlay.showHeader !== false && (
          <header className="global-overlay-head">
            <h2 className="global-overlay-title">{overlay.title || 'Details'}</h2>
            <button
              type="button"
              className="global-overlay-close"
              onClick={() => onRequestClose('button')}
              aria-label="Close overlay"
            >
              ×
            </button>
          </header>
        )}
        <div className="global-overlay-body">{overlay.content}</div>
      </section>
    </div>,
    document.body,
  )
}
