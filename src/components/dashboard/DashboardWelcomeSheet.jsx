export default function DashboardWelcomeSheet({
  pathOptions,
  selectedPathId,
  recommendedLab,
  onDismiss,
  onSelectPath,
}) {
  return (
    <section className="dashboard-welcome-sheet" aria-labelledby="dashboard-welcome-title">
      <div className="dashboard-welcome-sheet__head">
        <div>
          <p className="dashboard-hero__eyebrow">פתיחה קצרה</p>
          <h2 id="dashboard-welcome-title">מאיפה נכון להתחיל עכשיו?</h2>
          <p>
            בחר/י ניסוח פתיחה אחד. ההמלצה מתעדכנת מיד, בלי לעבור בין מסכים ובלי
            לנסות להבין את כל המערכת מראש.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-welcome-sheet__dismiss"
          onClick={onDismiss}
        >
          להמשיך בלי זה
        </button>
      </div>

      <div className="dashboard-welcome-sheet__paths" role="list">
        {pathOptions.map((path) => (
          <button
            key={path.id}
            type="button"
            role="listitem"
            className={`dashboard-path-card ${selectedPathId === path.id ? 'is-active' : ''}`}
            onClick={() => onSelectPath(path.id)}
          >
            <strong>{path.titleHe}</strong>
            <span>{path.descriptionHe}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-welcome-sheet__footer">
        <div className="dashboard-welcome-sheet__summary">
          <span>המסלול שמחכה עכשיו</span>
          <strong>{recommendedLab?.titleHe ?? 'ההמלצה תופיע כאן'}</strong>
        </div>
      </div>
    </section>
  )
}
