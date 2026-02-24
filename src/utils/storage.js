const KEYS = {
  drafts: 'la.v1.labDrafts',
  favorites: 'la.v1.favorites',
  history: 'la.v1.history',
  preferences: 'la.v1.preferences',
}

function safeParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function loadStoredDrafts() {
  return safeParse(localStorage.getItem(KEYS.drafts), {})
}

export function saveStoredDrafts(drafts) {
  localStorage.setItem(KEYS.drafts, JSON.stringify(drafts))
}

export function loadStoredFavorites() {
  const data = safeParse(localStorage.getItem(KEYS.favorites), [])
  return Array.isArray(data) ? data : []
}

export function saveStoredFavorites(favorites) {
  localStorage.setItem(KEYS.favorites, JSON.stringify(favorites))
}

export function loadStoredHistory() {
  const data = safeParse(localStorage.getItem(KEYS.history), [])
  return Array.isArray(data) ? data : []
}

export function saveStoredHistory(history) {
  localStorage.setItem(KEYS.history, JSON.stringify(history))
}

export function loadStoredPreferences() {
  return safeParse(localStorage.getItem(KEYS.preferences), {
    lastVisitedLabId: 'phrasing',
  })
}

export function saveStoredPreferences(preferences) {
  localStorage.setItem(KEYS.preferences, JSON.stringify(preferences))
}

export function buildFavoritesExportPayload(favorites) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    kind: 'language-alchemy-favorites',
    favorites,
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const storageKeys = KEYS
