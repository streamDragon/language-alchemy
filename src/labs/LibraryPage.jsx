import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'
import { parseFavoritesImportPayload } from '../utils/storage'

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('he-IL')
  } catch {
    return value
  }
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const {
    state,
    deleteFavorite,
    deleteHistory,
    loadFavoriteDraft,
    exportFavorites,
    importFavoritesMerge,
  } = useAppState()
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredFavorites = state.favorites.filter((favorite) => {
    if (!normalizedQuery) return true
    const labTitle = (getLabConfig(favorite.labId)?.titleHe ?? favorite.labId).toLowerCase()
    return (
      favorite.sentenceText?.toLowerCase().includes(normalizedQuery) ||
      labTitle.includes(normalizedQuery)
    )
  })

  const filteredHistory = state.history.filter((entry) => {
    if (!normalizedQuery) return true
    const labTitle = (getLabConfig(entry.labId)?.titleHe ?? entry.labId).toLowerCase()
    return (
      String(entry.summaryHe ?? '').toLowerCase().includes(normalizedQuery) ||
      String(entry.sentenceText ?? '').toLowerCase().includes(normalizedQuery) ||
      labTitle.includes(normalizedQuery)
    )
  })

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatusMessage('הטקסט הועתק ללוח.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח.')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const rawText = await file.text()
      const payload = parseFavoritesImportPayload(rawText)
      const summary = importFavoritesMerge(payload.favorites)
      setStatusMessage(
        `יבוא הושלם: ${summary.imported} נוספו, ${summary.skipped} דולגו (מתוך ${summary.total}).`,
      )
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'יבוא JSON נכשל.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="page-stack">
      <section className="alchemy-card">
        <div className="alchemy-card__head">
          <div>
            <h2>ספרייה</h2>
            <p>מועדפים, היסטוריית תרגול, וייצוא JSON של מועדפים.</p>
          </div>
          <div className="alchemy-card__actions">
            <button type="button" onClick={exportFavorites}>
              ייצוא Favorites (JSON)
            </button>
            <button type="button" onClick={handleImportClick}>
              ייבוא Favorites (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        <div className="library-toolbar">
          <input
            type="search"
            className="search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="חיפוש בספרייה (טקסט, מעבדה, היסטוריה...)"
            aria-label="חיפוש בספרייה"
          />
        </div>

        <div className="template-switcher" role="tablist" aria-label="ספרייה">
          <button
            type="button"
            role="tab"
            className={`template-pill ${activeTab === 'favorites' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          >
            מועדפים ({filteredFavorites.length}/{state.favorites.length})
          </button>
          <button
            type="button"
            role="tab"
            className={`template-pill ${activeTab === 'history' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            היסטוריה ({filteredHistory.length}/{state.history.length})
          </button>
        </div>

        {activeTab === 'favorites' && (
          <div className="stack-list">
            {filteredFavorites.length ? (
              filteredFavorites.map((favorite) => {
                const lab = getLabConfig(favorite.labId)
                return (
                  <article key={favorite.id} className="stack-list__item">
                    <div className="stack-list__item-head">
                      <strong>{lab?.titleHe ?? favorite.labId}</strong>
                      <small>{formatDate(favorite.createdAt)}</small>
                    </div>
                    <p>{favorite.sentenceText}</p>
                    <div className="controls-row">
                      <button type="button" onClick={() => copyText(favorite.sentenceText)}>
                        העתק
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          loadFavoriteDraft(favorite)
                          if (lab?.route) navigate(lab.route)
                        }}
                      >
                        טען למעבדה
                      </button>
                      <button type="button" onClick={() => deleteFavorite(favorite.id)}>
                        מחק
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="muted-text">
                {state.favorites.length ? 'לא נמצאו תוצאות לחיפוש.' : 'אין מועדפים עדיין.'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="stack-list">
            {filteredHistory.length ? (
              filteredHistory.map((entry) => (
                <article key={entry.id} className="stack-list__item">
                  <div className="stack-list__item-head">
                    <strong>{getLabConfig(entry.labId)?.titleHe ?? entry.labId}</strong>
                    <small>{formatDate(entry.createdAt)}</small>
                  </div>
                  <p>{entry.summaryHe ?? entry.sentenceText ?? 'תרגול'}</p>
                  {entry.sentenceText && <p className="muted-text">{entry.sentenceText}</p>}
                  <div className="controls-row">
                    {entry.sentenceText && (
                      <button type="button" onClick={() => copyText(entry.sentenceText)}>
                        העתק
                      </button>
                    )}
                    <button type="button" onClick={() => deleteHistory(entry.id)}>
                      מחק
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-text">
                {state.history.length
                  ? 'לא נמצאו תוצאות לחיפוש.'
                  : 'אין היסטוריה עדיין. תרגול "מעבר למילים" נשמר אוטומטית.'}
              </p>
            )}
          </div>
        )}

        <div className="status-line" aria-live="polite">
          {statusMessage}
        </div>
      </section>
    </div>
  )
}
