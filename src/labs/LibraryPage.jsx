import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'

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
  } = useAppState()
  const [activeTab, setActiveTab] = useState('favorites')
  const [statusMessage, setStatusMessage] = useState('')

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatusMessage('הטקסט הועתק ללוח.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח.')
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
          </div>
        </div>

        <div className="template-switcher" role="tablist" aria-label="ספרייה">
          <button
            type="button"
            role="tab"
            className={`template-pill ${activeTab === 'favorites' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          >
            מועדפים ({state.favorites.length})
          </button>
          <button
            type="button"
            role="tab"
            className={`template-pill ${activeTab === 'history' ? 'is-active' : ''}`}
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            היסטוריה ({state.history.length})
          </button>
        </div>

        {activeTab === 'favorites' && (
          <div className="stack-list">
            {state.favorites.length ? (
              state.favorites.map((favorite) => {
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
              <p className="muted-text">אין מועדפים עדיין.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="stack-list">
            {state.history.length ? (
              state.history.map((entry) => (
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
              <p className="muted-text">אין היסטוריה עדיין. תרגול "מעבר למילים" נשמר אוטומטית.</p>
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
