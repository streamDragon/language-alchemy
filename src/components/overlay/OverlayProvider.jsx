import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import OverlayRoot from './OverlayRoot'

const OverlayContext = createContext(null)

function normalizeRequest(request) {
  if (!request || typeof request !== 'object') return null
  return {
    id: String(request.id || `overlay-${Date.now()}`),
    type: String(request.type || request.id || 'panel'),
    title: String(request.title || '').trim(),
    size: ['sm', 'md', 'lg', 'xl'].includes(String(request.size || '').toLowerCase())
      ? String(request.size).toLowerCase()
      : 'md',
    closeOnBackdrop: request.closeOnBackdrop !== false,
    content: request.content ?? null,
    onClose: typeof request.onClose === 'function' ? request.onClose : null,
    restoreFocusEl: request.restoreFocusEl ?? null,
    showHeader: request.showHeader !== false,
  }
}

export function OverlayProvider({ children }) {
  const [activeOverlay, setActiveOverlay] = useState(null)
  const activeOverlayRef = useRef(null)
  const focusRestoreRef = useRef(null)
  const historyArmedRef = useRef(false)
  const pendingCloseReasonRef = useRef('')
  const closingFromHistoryRef = useRef(false)

  const setOverlayState = useCallback((next) => {
    activeOverlayRef.current = next
    setActiveOverlay(next)
  }, [])

  const armHistory = useCallback((type) => {
    if (historyArmedRef.current) return
    try {
      const nextUrl = new URL(window.location.href)
      const safeType = String(type || 'panel')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
      nextUrl.hash = `overlay=${safeType || 'panel'}`
      window.history.pushState(
        {
          ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}),
          __laOverlay: true,
          __laOverlayAt: Date.now(),
        },
        '',
        nextUrl.toString(),
      )
      historyArmedRef.current = true
    } catch (_error) {
      historyArmedRef.current = false
    }
  }, [])

  const disarmHistory = useCallback((fromHistoryPop = false) => {
    historyArmedRef.current = false
    pendingCloseReasonRef.current = ''
    closingFromHistoryRef.current = false

    if (fromHistoryPop) return
    if (!/^#overlay=/.test(window.location.hash || '')) return
    try {
      const nextUrl = new URL(window.location.href)
      nextUrl.hash = ''
      window.history.replaceState(window.history.state, '', nextUrl.toString())
    } catch (_error) {
      // noop
    }
  }, [])

  const finalizeClose = useCallback((reason = 'close', fromHistoryPop = false) => {
    const current = activeOverlayRef.current
    if (!current) return
    setOverlayState(null)
    disarmHistory(fromHistoryPop)

    try {
      current.onClose?.(reason)
    } catch (_error) {
      // noop
    }

    const restoreEl = focusRestoreRef.current || current.restoreFocusEl
    focusRestoreRef.current = null
    if (restoreEl && typeof restoreEl.focus === 'function') {
      try {
        restoreEl.focus({ preventScroll: true })
      } catch (_error) {
        restoreEl.focus()
      }
    }
  }, [disarmHistory, setOverlayState])

  const closeOverlay = useCallback((reason = 'close', options = {}) => {
    if (!activeOverlayRef.current) return
    const fromHistory = options?.fromHistory === true
    if (!fromHistory && historyArmedRef.current && !closingFromHistoryRef.current) {
      pendingCloseReasonRef.current = reason
      closingFromHistoryRef.current = true
      try {
        window.history.back()
        return
      } catch (_error) {
        pendingCloseReasonRef.current = ''
        closingFromHistoryRef.current = false
      }
    }

    finalizeClose(reason, fromHistory)
  }, [finalizeClose])

  const openOverlay = useCallback((request) => {
    const normalized = normalizeRequest(request)
    if (!normalized) return

    const previous = activeOverlayRef.current
    if (!previous) {
      focusRestoreRef.current =
        normalized.restoreFocusEl ||
        (document.activeElement instanceof HTMLElement ? document.activeElement : null)
      setOverlayState(normalized)
      armHistory(normalized.type)
      return
    }

    // Same overlay id => update content without adding extra history entries.
    if (previous.id === normalized.id) {
      setOverlayState({ ...previous, ...normalized, restoreFocusEl: previous.restoreFocusEl })
      return
    }

    finalizeClose('replace', false)
    focusRestoreRef.current =
      normalized.restoreFocusEl ||
      (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setOverlayState(normalized)
    armHistory(normalized.type)
  }, [armHistory, finalizeClose, setOverlayState])

  const value = useMemo(
    () => ({
      activeOverlay,
      openOverlay,
      closeOverlay,
      isOpen: Boolean(activeOverlay),
    }),
    [activeOverlay, closeOverlay, openOverlay],
  )

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <OverlayRoot
        overlay={activeOverlay}
        onRequestClose={closeOverlay}
        onHistoryPop={() => {
          if (!activeOverlayRef.current) return
          const reason = pendingCloseReasonRef.current || 'history'
          finalizeClose(reason, true)
        }}
      />
    </OverlayContext.Provider>
  )
}

export { OverlayContext }
