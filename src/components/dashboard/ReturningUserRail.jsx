import { timeLabel } from './dashboardUtils'

export default function ReturningUserRail({
  lastActivityAt,
  lastVisitedLab,
  onContinue,
  recentFavorites,
  recentHistory,
}) {
  if (!lastVisitedLab) return null

  const hasRecentActivity = recentHistory.length > 0 || recentFavorites.length > 0
  const summary = hasRecentActivity
    ? recentHistory[0]?.summaryHe ?? recentHistory[0]?.sentenceText ?? lastVisitedLab.promiseHe
    : 'המסלול האחרון שלך עדיין מוכן כאן.'

  return (
    <section className="returning-user-rail" aria-labelledby="returning-user-title">
      <div className="returning-user-rail__copy">
        <p className="dashboard-hero__eyebrow">להמשיך ישר</p>
        <h2 id="returning-user-title">להמשיך עם {lastVisitedLab.titleHe}</h2>
        <p>{summary}</p>

        <div className="returning-user-rail__meta">
          <span>{lastVisitedLab.sessionLengthMin} דקות</span>
          {recentHistory.length > 0 && <span>{recentHistory.length} תרגולים אחרונים</span>}
          {recentFavorites.length > 0 && <span>{recentFavorites.length} שמורים</span>}
        </div>
      </div>

      <div className="returning-user-rail__actions">
        {lastActivityAt && (
          <small>
            פעם אחרונה{' '}
            {timeLabel(lastActivityAt, {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        )}

        <button type="button" className="dashboard-primary-action" onClick={onContinue}>
          להמשיך מאיפה שעצרתי
        </button>
      </div>
    </section>
  )
}
