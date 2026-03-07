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
      data-family={lab.family}
      aria-labelledby="recommended-lab-title"
    >
      <div className="recommended-lab-panel__head">
        <div>
          <p className="dashboard-hero__eyebrow">
            {mode === 'returning-user' ? 'אם משנים כיוון עכשיו' : 'מה לפתוח קודם'}
          </p>
          <h2 id="recommended-lab-title">{lab.titleHe}</h2>
        </div>

        {family && <span className="recommended-lab-panel__family">{family.badgeHe}</span>}
      </div>

      <p className="recommended-lab-panel__promise">{lab.promiseHe}</p>

      <div className="recommended-lab-panel__reason">
        <strong>{mode === 'returning-user' ? 'למה זה הכיוון הבא' : 'למה זה מתאים עכשיו'}</strong>
        <p>
          עבור <span>{persona?.labelHe}</span> שצריך/ה עכשיו <span>{goal?.labelHe}</span>, זה
          המסלול הכי ישיר ל-{lab.primaryOutcome}.
        </p>
      </div>

      <div className="recommended-lab-panel__result">
        <strong>מה יוצא מזה</strong>
        <p>{lab.resultHe}</p>
      </div>

      <div className="recommended-lab-panel__meta">
        <span>{lab.audienceLabelHe}</span>
        <span>{lab.sessionLengthMin} דקות</span>
        <span>{family?.titleHe ?? lab.family}</span>
      </div>

      {actionVariant === 'primary' && (
        <button type="button" className="dashboard-primary-action" onClick={onStart}>
          {lab.quickStartLabel}
        </button>
      )}

      {actionVariant === 'secondary' && (
        <button type="button" className="dashboard-secondary-action" onClick={onStart}>
          לפתוח את המסלול הזה במקום
        </button>
      )}

      <p className="recommended-lab-panel__footnote">
        רוצים לעיין בעוד אפשרויות? משפחות המעבדות מחכות למטה אחרי הבחירה הראשונה.
      </p>
    </section>
  )
}
