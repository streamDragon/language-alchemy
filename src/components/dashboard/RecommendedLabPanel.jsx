import { labFamilies } from '../../data/labManifest'

export default function RecommendedLabPanel({
  actionVariant = 'primary',
  goal,
  lab,
  mode,
  onStart,
  persona,
}) {
  if (!lab) return null

  const family = labFamilies.find((item) => item.id === lab.family)

  return (
    <section
      className="recommended-lab-panel"
      data-action-variant={actionVariant}
      data-family={lab.family}
      aria-labelledby="recommended-lab-title"
    >
      <div className="recommended-lab-panel__head">
        <div>
          <p className="dashboard-hero__eyebrow">
            {mode === 'returning-user' ? 'כיוון נוסף' : 'התחלה מומלצת'}
          </p>
          <h2 id="recommended-lab-title">{lab.titleHe}</h2>
        </div>

        {family && <span className="recommended-lab-panel__family">{family.badgeHe}</span>}
      </div>

      <p className="recommended-lab-panel__promise">{lab.promiseHe}</p>

      <div className="recommended-lab-panel__reason">
        <strong>למה עכשיו</strong>
        <p>
          בחרת <span>{persona?.labelHe}</span> ו-<span>{goal?.labelHe}</span>. זה המסלול הכי
          קצר ל-{lab.primaryOutcome}.
        </p>
      </div>

      <div className="recommended-lab-panel__result">
        <strong>מה מקבלים בכמה דקות</strong>
        <p>{lab.resultHe}</p>
      </div>

      <div className="recommended-lab-panel__meta">
        <span>{lab.sessionLengthMin} דקות</span>
        <span>{lab.primaryOutcome}</span>
      </div>

      <div className="recommended-lab-panel__actions">
        {actionVariant === 'primary' && (
          <button type="button" className="dashboard-primary-action" onClick={onStart}>
            {lab.quickStartLabel}
          </button>
        )}

        {actionVariant === 'secondary' && (
          <button type="button" className="dashboard-secondary-action" onClick={onStart}>
            לבחור במסלול הזה
          </button>
        )}
      </div>
    </section>
  )
}
