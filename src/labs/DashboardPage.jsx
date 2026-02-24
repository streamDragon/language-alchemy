import { Link, useNavigate } from 'react-router-dom'
import { dashboardCards, getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'

function timeLabel(value) {
  try {
    return new Date(value).toLocaleString('he-IL')
  } catch {
    return value
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { state, runRandomAlchemist } = useAppState()

  const recentFavorites = state.favorites.slice(0, 3)
  const recentHistory = state.history.slice(0, 3)

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <h1>מעבדת אלכימיה של שפה</h1>
          <p>
            מערכת רב-כלית לניסוח, אמפתיה, גבולות, שאלות מדויקות ואימון קשב סומטי
            (Beyond Words).
          </p>
        </div>
        <div className="hero-card__actions">
          <button
            type="button"
            onClick={() => {
              const lab = runRandomAlchemist()
              if (lab?.route) navigate(lab.route)
            }}
          >
            הפעל אלכימאי אקראי
          </button>
          <Link to="/lab/beyond-words" className="secondary-link-button">
            מעבר למילים
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        {dashboardCards.map((lab) => (
          <article key={lab.id} className="dashboard-card">
            <div className="dashboard-card__kind">{lab.kind}</div>
            <h2>{lab.titleHe}</h2>
            <p>{lab.descriptionHe}</p>
            <Link to={lab.route} className="inline-action">
              פתח/י מעבדה
            </Link>
          </article>
        ))}
      </section>

      <section className="dashboard-split">
        <div className="panel-card">
          <div className="panel-card__head">
            <h2>מועדפים אחרונים</h2>
            <Link to="/library">לספרייה</Link>
          </div>
          {recentFavorites.length ? (
            <div className="stack-list">
              {recentFavorites.map((favorite) => (
                <div key={favorite.id} className="stack-list__item">
                  <strong>{favorite.titleHe}</strong>
                  <p>{favorite.sentenceText}</p>
                  <small>{timeLabel(favorite.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">אין מועדפים עדיין. שמרו ניסוח מכל מעבדה.</p>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-card__head">
            <h2>תרגולים אחרונים</h2>
            <Link to="/library">לספרייה</Link>
          </div>
          {recentHistory.length ? (
            <div className="stack-list">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="stack-list__item">
                  <strong>{getLabConfig(entry.labId)?.titleHe ?? entry.labId}</strong>
                  <p>{entry.summaryHe ?? entry.sentenceText ?? 'תרגול'}</p>
                  <small>{timeLabel(entry.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">אין היסטוריה עדיין. במיוחד במעבדת "מעבר למילים".</p>
          )}
        </div>
      </section>
    </div>
  )
}
