import {
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { getLabConfig, visibleLabs } from '../data/labsConfig'
import { AppStateContext } from './appStateContext'
import {
  createInitialAlchemyDrafts,
  randomizeAlchemyDraft,
} from '../utils/alchemy'
import { makeId } from '../utils/ids'
import {
  loadStoredDrafts,
  loadStoredFavorites,
  loadStoredHistory,
  loadStoredPreferences,
  saveStoredDrafts,
  saveStoredFavorites,
  saveStoredHistory,
  saveStoredPreferences,
  buildFavoritesExportPayload,
  downloadJson,
} from '../utils/storage'

function sortByDateDesc(items) {
  return [...items].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DRAFT': {
      return {
        ...state,
        draftsByLab: {
          ...state.draftsByLab,
          [action.labId]: action.draft,
        },
      }
    }
    case 'SET_PREFERENCES':
      if (
        Object.entries(action.patch ?? {}).every(
          ([key, value]) => state.preferences?.[key] === value,
        )
      ) {
        return state
      }
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.patch,
        },
      }
    case 'SAVE_FAVORITE': {
      const next = sortByDateDesc([action.favorite, ...state.favorites])
      return { ...state, favorites: next }
    }
    case 'DELETE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter((item) => item.id !== action.id),
      }
    case 'IMPORT_FAVORITES_MERGE': {
      const current = state.favorites
      const byId = new Set(current.map((item) => item.id))
      const bySignature = new Set(
        current.map((item) => `${item.labId}::${item.sentenceText}::${item.createdAt}`),
      )

      const accepted = []
      let skipped = 0

      for (const item of action.items) {
        const signature = `${item.labId}::${item.sentenceText}::${item.createdAt}`
        if (byId.has(item.id) || bySignature.has(signature)) {
          skipped += 1
          continue
        }
        byId.add(item.id)
        bySignature.add(signature)
        accepted.push(item)
      }

      return {
        ...state,
        favorites: sortByDateDesc([...accepted, ...current]),
        lastImportSummary: {
          imported: accepted.length,
          skipped,
        },
      }
    }
    case 'UPSERT_HISTORY': {
      const exists = state.history.some((item) => item.id === action.entry.id)
      const next = exists
        ? state.history.map((item) => (item.id === action.entry.id ? action.entry : item))
        : [action.entry, ...state.history]
      return { ...state, history: sortByDateDesc(next) }
    }
    case 'DELETE_HISTORY':
      return {
        ...state,
        history: state.history.filter((item) => item.id !== action.id),
      }
    default:
      return state
  }
}

function createInitialState() {
  const baseDrafts = createInitialAlchemyDrafts(
    visibleLabs.filter((lab) => lab.kind === 'alchemy').concat(getLabConfig('beyond-practice')),
  )
  const storedDrafts = typeof window !== 'undefined' ? loadStoredDrafts() : {}

  return {
    draftsByLab: { ...baseDrafts, ...storedDrafts },
    favorites: typeof window !== 'undefined' ? loadStoredFavorites() : [],
    history: typeof window !== 'undefined' ? loadStoredHistory() : [],
    preferences:
      typeof window !== 'undefined'
        ? loadStoredPreferences()
        : { lastVisitedLabId: 'phrasing' },
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  useEffect(() => {
    saveStoredDrafts(state.draftsByLab)
  }, [state.draftsByLab])

  useEffect(() => {
    saveStoredFavorites(state.favorites)
  }, [state.favorites])

  useEffect(() => {
    saveStoredHistory(state.history)
  }, [state.history])

  useEffect(() => {
    saveStoredPreferences(state.preferences)
  }, [state.preferences])

  const api = useMemo(() => {
    const setDraft = (labId, draft) => dispatch({ type: 'SET_DRAFT', labId, draft })

    return {
      state,
      getDraft(labId) {
        return state.draftsByLab[labId]
      },
      setDraft,
      updateDraft(labId, updater) {
        const current = state.draftsByLab[labId]
        const next = typeof updater === 'function' ? updater(current) : updater
        dispatch({ type: 'SET_DRAFT', labId, draft: next })
      },
      setLastVisitedLab(labId) {
        dispatch({ type: 'SET_PREFERENCES', patch: { lastVisitedLabId: labId } })
      },
      saveFavorite({ labId, sentenceText, draftSnapshot, tags = [] }) {
        const favorite = {
          id: makeId('fav'),
          labId,
          sentenceText,
          createdAt: new Date().toISOString(),
          titleHe: getLabConfig(labId)?.titleHe ?? labId,
          tags,
          draftSnapshot,
        }
        dispatch({ type: 'SAVE_FAVORITE', favorite })
        return favorite
      },
      deleteFavorite(id) {
        dispatch({ type: 'DELETE_FAVORITE', id })
      },
      loadFavoriteDraft(favorite) {
        if (!favorite?.draftSnapshot || !favorite.labId) return
        dispatch({
          type: 'SET_DRAFT',
          labId: favorite.labId,
          draft: favorite.draftSnapshot,
        })
      },
      upsertHistory(entry) {
        dispatch({ type: 'UPSERT_HISTORY', entry })
      },
      deleteHistory(id) {
        dispatch({ type: 'DELETE_HISTORY', id })
      },
      exportFavorites() {
        const payload = buildFavoritesExportPayload(state.favorites)
        const date = new Date().toISOString().slice(0, 10)
        downloadJson(`language-alchemy-favorites-${date}.json`, payload)
      },
      importFavoritesMerge(items) {
        const normalized = (items ?? [])
          .filter((item) => item && typeof item === 'object' && item.sentenceText && item.labId)
          .map((item) => ({
            id: item.id ?? makeId('fav'),
            labId: item.labId,
            sentenceText: String(item.sentenceText),
            createdAt: item.createdAt ?? new Date().toISOString(),
            titleHe: item.titleHe ?? getLabConfig(item.labId)?.titleHe ?? item.labId,
            tags: Array.isArray(item.tags) ? item.tags : [],
            draftSnapshot:
              item.draftSnapshot && typeof item.draftSnapshot === 'object'
                ? item.draftSnapshot
                : undefined,
          }))

        dispatch({ type: 'IMPORT_FAVORITES_MERGE', items: normalized })

        const currentById = new Set(state.favorites.map((item) => item.id))
        const currentBySignature = new Set(
          state.favorites.map(
            (item) => `${item.labId}::${item.sentenceText}::${item.createdAt}`,
          ),
        )
        let imported = 0
        let skipped = 0
        for (const item of normalized) {
          const signature = `${item.labId}::${item.sentenceText}::${item.createdAt}`
          if (currentById.has(item.id) || currentBySignature.has(signature)) {
            skipped += 1
          } else {
            imported += 1
            currentById.add(item.id)
            currentBySignature.add(signature)
          }
        }
        return { imported, skipped, total: normalized.length }
      },
      runRandomAlchemist() {
        const candidates = visibleLabs.filter(
          (lab) => lab.kind === 'alchemy' && lab.id !== 'beyond-practice',
        )
        const index = Math.floor(Math.random() * candidates.length)
        const lab = candidates[index]
        if (!lab) return null
        const current = state.draftsByLab[lab.id]
        const randomized = randomizeAlchemyDraft(lab, current)
        dispatch({ type: 'SET_DRAFT', labId: lab.id, draft: randomized })
        dispatch({
          type: 'SET_PREFERENCES',
          patch: { lastVisitedLabId: lab.id },
        })
        return lab
      },
    }
  }, [state])

  return (
    <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>
  )
}
