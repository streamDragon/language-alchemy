export const VALID_UI_MODES = Object.freeze(['legacy', 'shell'])

export const SCREEN_UI_REGISTRY = Object.freeze({
  dashboard: Object.freeze({
    id: 'dashboard',
    route: '/',
    title: 'Dashboard',
    defaultUiMode: 'legacy',
  }),
  relations: Object.freeze({
    id: 'relations',
    route: '/lab/relations',
    aliases: Object.freeze(['/lab/relationship-questions']),
    title: 'Relations Lab',
    defaultUiMode: 'shell',
    overlayPanels: Object.freeze(['setup', 'settings', 'help', 'metrics', 'history', 'stats']),
  }),
  perspectives: Object.freeze({
    id: 'perspectives',
    route: '/lab/perspectives',
    aliases: Object.freeze(['/lab/now-before']),
    title: 'Perspective Lab',
    defaultUiMode: 'shell',
  }),
})

export function normalizeUiMode(input) {
  const value = String(input || '').trim().toLowerCase()
  return VALID_UI_MODES.includes(value) ? value : ''
}

export function resolveUiMode(screenId, locationSearch) {
  const registryValue = normalizeUiMode(SCREEN_UI_REGISTRY[screenId]?.defaultUiMode) || 'legacy'
  const queryMode = normalizeUiMode(new URLSearchParams(locationSearch || '').get('ui'))
  return queryMode || registryValue
}

export function buildScreenUrl(screenId, mode, href) {
  const normalizedMode = normalizeUiMode(mode) || 'legacy'
  const registryEntry = SCREEN_UI_REGISTRY[screenId]
  const nextUrl = new URL(href || window.location.href)
  if (registryEntry?.route) {
    nextUrl.pathname = registryEntry.route
  }
  nextUrl.searchParams.set('ui', normalizedMode)
  return nextUrl.toString()
}
