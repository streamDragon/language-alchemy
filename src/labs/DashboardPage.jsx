import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getLabManifest,
  getLabsByFamily,
  goalOptions,
  labFamilies,
  personaOptions,
  recommendLabsForGateway,
} from '../data/labManifest'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'

function timeLabel(value) {
  try {
    return new Date(value).toLocaleString('he-IL')
  } catch {
    return value
  }
}

function ChoiceGroup({ label, options, selectedId, onSelect }) {
  return (
    <div className="gateway-choice-group">
      <div className="gateway-choice-group__label">{label}</div>
      <div className="gateway-choice-group__options" role="list">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`gateway-choice ${selectedId === option.id ? 'is-active' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.labelHe}</strong>
            <span>{option.descriptionHe}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LabBrowseCard({ lab }) {
  return (
    <article className="family-lab-card">
      <div className="family-lab-card__top">
        <div>
          <h3>{lab.titleHe}</h3>
          <p>{lab.promiseHe}</p>
        </div>
        <span className={`family-lab-card__status family-lab-card__status--${lab.status}`}>{lab.status}</span>
      </div>
      <div className="family-lab-card__meta">
        <span>{lab.audienceLabelHe}</span>
        <span>{lab.sessionLengthMin} דקות</span>
      </div>
      <div className="family-lab-card__result">{lab.resultHe}</div>
      <Link to={lab.route} className="inline-action">
        {lab.quickStartLabel}
      </Link>
    </article>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { state } = useAppState()
  const [personaId, setPersonaId] = useState('beginner')
  const [goalId, setGoalId] = useState('speak-better')

  const recentFavorites = state.favorites.slice(0, 3)
  const recentHistory = state.history.slice(0, 3)
  const lastVisitedLab = getLabManifest(state.preferences?.lastVisitedLabId) ?? getLabManifest('relations')
  const familySections = useMemo(
    () => labFamilies.map((family) => ({ ...family, labs: getLabsByFamily(family.id) })),
    [],
  )
  const recommendations = useMemo(
    () => recommendLabsForGateway({ personaId, goalId }),
    [goalId, personaId],
  )

  const primaryLab = recommendations[0] ?? null
  const secondaryLabs = recommendations.slice(1)
  const selectedPersona = personaOptions.find((item) => item.id === personaId)
  const selectedGoal = goalOptions.find((item) => item.id === goalId)

  return (
    <div className="page-stack dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="dashboard-hero__eyebrow">Language Alchemy</p>
          <h1>מעבדות לשפה, השפעה ודיוק אנושי</h1>
          <p className="dashboard-hero__text">
            ללמוד לנסח, לשאול, להרגיע, להוביל ולהבין מה באמת קורה בשיחה. המסך הזה נועד
            לעזור לבחור מסלול התחלה ברור, לא להעמיס את כל העומק בבת אחת.
          </p>
        </div>

        <div className="dashboard-hero__actions">
          <button
            type="button"
            onClick={() => {
              if (primaryLab?.route) navigate(primaryLab.route)
            }}
          >
            {primaryLab?.quickStartLabel ?? 'התחל/י'}
          </button>
          {lastVisitedLab?.route && (
            <Link to={lastVisitedLab.route} className="secondary-link-button">
              המשך/י ב־{lastVisitedLab.titleHe}
            </Link>
          )}
        </div>
      </section>

      <section className="gateway-card">
        <div className="gateway-card__head">
          <div>
            <p className="dashboard-hero__eyebrow">בחר/י מסלול התחלה</p>
            <h2>מי את/ה ומה צריך עכשיו?</h2>
            <p>
              שתי בחירות קצרות ייתנו המלצה אחת ראשית ועוד שתי חלופות מתאימות. המטרה היא
              להבין תוך פחות מדקה מאיפה נכון להתחיל.
            </p>
          </div>
        </div>

        <div className="gateway-grid">
          <ChoiceGroup
            label="מי את/ה?"
            options={personaOptions}
            selectedId={personaId}
            onSelect={setPersonaId}
          />
          <ChoiceGroup
            label="מה צריך עכשיו?"
            options={goalOptions}
            selectedId={goalId}
            onSelect={setGoalId}
          />
        </div>
      </section>

      {primaryLab && (
        <section className="recommendation-layout">
          <article className="recommendation-card recommendation-card--primary">
            <div className="recommendation-card__head">
              <div>
                <p className="dashboard-hero__eyebrow">מומלץ להתחיל כאן</p>
                <h2>{primaryLab.titleHe}</h2>
              </div>
              <span className="recommendation-card__family">
                {labFamilies.find((family) => family.id === primaryLab.family)?.badgeHe}
              </span>
            </div>

            <p className="recommendation-card__promise">{primaryLab.promiseHe}</p>

            <div className="recommendation-card__reason">
              <strong>למה זה מתאים עכשיו?</strong>
              <p>
                בחרת <span>{selectedPersona?.labelHe}</span> עם צורך של{' '}
                <span>{selectedGoal?.labelHe}</span>, וזה המסלול הכי קצר ל־{primaryLab.primaryOutcome}.
              </p>
            </div>

            <div className="recommendation-card__meta">
              <span>{primaryLab.audienceLabelHe}</span>
              <span>{primaryLab.sessionLengthMin} דקות</span>
              <span>{primaryLab.resultHe}</span>
            </div>

            <div className="recommendation-card__actions">
              <button
                type="button"
                onClick={() => {
                  if (primaryLab.route) navigate(primaryLab.route)
                }}
              >
                {primaryLab.quickStartLabel}
              </button>
            </div>
          </article>

          <div className="recommendation-side">
            {secondaryLabs.map((lab) => (
              <article key={lab.id} className="recommendation-card recommendation-card--secondary">
                <div className="recommendation-card__head">
                  <div>
                    <p className="dashboard-hero__eyebrow">אפשר גם</p>
                    <h3>{lab.titleHe}</h3>
                  </div>
                  <span className="recommendation-card__family">
                    {labFamilies.find((family) => family.id === lab.family)?.badgeHe}
                  </span>
                </div>
                <p className="recommendation-card__promise">{lab.promiseHe}</p>
                <div className="recommendation-card__meta">
                  <span>{lab.sessionLengthMin} דקות</span>
                  <span>{lab.primaryOutcome}</span>
                </div>
                <Link to={lab.route} className="inline-action">
                  {lab.quickStartLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="family-sections">
        <div className="section-head">
          <div>
            <p className="dashboard-hero__eyebrow">עיון חופשי לפי משפחות</p>
            <h2>לא עוד ערימה אחת של כרטיסים</h2>
            <p>אפשר לבחור סוג תרגול: מיומנות, אבחון ופירוק, או השפעה וסטייט.</p>
          </div>
        </div>

        <div className="family-section-list">
          {familySections.map((family) => (
            <section key={family.id} className="family-section">
              <div className="family-section__head">
                <div>
                  <p className="dashboard-hero__eyebrow">{family.badgeHe}</p>
                  <h3>{family.titleHe}</h3>
                  <p>{family.descriptionHe}</p>
                </div>
              </div>

              <div className="family-section__grid">
                {family.labs.map((lab) => (
                  <LabBrowseCard key={lab.id} lab={lab} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="dashboard-quick-grid">
        <article className="panel-card panel-card--soft">
          <div className="panel-card__head">
            <h2>המשך מאיפה שהפסקת</h2>
            {lastVisitedLab?.route && <Link to={lastVisitedLab.route}>פתח/י</Link>}
          </div>
          {lastVisitedLab ? (
            <div className="stack-list">
              <div className="stack-list__item">
                <strong>{lastVisitedLab.titleHe}</strong>
                <p>{lastVisitedLab.promiseHe}</p>
                <small>{lastVisitedLab.resultHe}</small>
              </div>
            </div>
          ) : (
            <p className="muted-text">עדיין אין מעבדה אחרונה. אפשר להתחיל מההמלצה למעלה.</p>
          )}
        </article>

        <article className="panel-card panel-card--soft">
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
            <p className="muted-text">עדיין אין היסטוריה. סשן ראשון יופיע כאן אוטומטית.</p>
          )}
        </article>

        <article className="panel-card panel-card--soft">
          <div className="panel-card__head">
            <h2>השאלות שעבדו לי</h2>
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
            <p className="muted-text">עדיין אין מועדפים. שמור/י ניסוחים או שאלות מתוך המעבדות.</p>
          )}
        </article>
      </section>
    </div>
  )
}
