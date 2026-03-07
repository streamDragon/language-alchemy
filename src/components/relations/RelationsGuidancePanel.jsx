function DebugLine({ item }) {
  return (
    <div className="relations-guidance__debug-line">
      <strong>{item.renderedText}</strong>
      <span>
        {item.familyLabelHe} · ציון {item.score}
      </span>
      <small>
        base {item.debug.baseScore} / metrics {item.debug.metricFit} / emotion {item.debug.emotionFit} /
        momentum {item.debug.momentumFit}
      </small>
    </div>
  )
}

export default function RelationsGuidancePanel({
  guidance,
  canAskQuestion,
  onUsePrimary,
  onPreviewAlternative,
}) {
  if (!guidance?.primary) return null

  return (
    <section className="relations-guidance panel-card panel-card--soft" aria-labelledby="relations-guidance-title">
      <div className="relations-guidance__head">
        <div>
          <p className="dashboard-hero__eyebrow">המלצה מודרכת</p>
          <h3 id="relations-guidance-title">מה כדאי לשאול עכשיו</h3>
          <p>{guidance.summaryHe}</p>
        </div>

        <div className="relations-guidance__meta" aria-label="פוקוס ההמלצה">
          <span>{guidance.primary.familyLabelHe}</span>
          <span>{guidance.focusLabelHe}</span>
        </div>
      </div>

      <div className="relations-guidance__primary">
        <strong>{guidance.primary.renderedText}</strong>

        <div className="relations-guidance__reasons">
          {guidance.primary.whyHe.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>

        <button
          type="button"
          className="relations-ask-cta"
          disabled={!canAskQuestion}
          onClick={() => onUsePrimary(guidance.primary)}
        >
          לשאול את השאלה הזו
        </button>

        {!canAskQuestion && (
          <div className="relations-guidance__note">בחר/י רגש נוכחי כדי להפעיל את ההמלצה.</div>
        )}
      </div>

      {guidance.alternatives.length > 0 && (
        <div className="relations-guidance__alternatives">
          <span>אם צריך כיוון אחר:</span>
          <div className="relations-guidance__alternative-list">
            {guidance.alternatives.map((item) => (
              <button
                key={`${item.familyId}:${item.question.id}`}
                type="button"
                className="relations-guidance__alternative"
                onClick={() => onPreviewAlternative(item)}
              >
                <small>{item.familyLabelHe}</small>
                <strong>{item.renderedText}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      <details className="relations-guidance__debug">
        <summary>Debug recommendation</summary>
        <div className="relations-guidance__debug-body">
          <div className="relations-guidance__debug-meta">
            <span>Engine: {guidance.engineId}</span>
            <span>Focus: {guidance.focusLabelHe}</span>
          </div>

          {guidance.ranked.slice(0, 3).map((item) => (
            <DebugLine key={`${item.familyId}:${item.question.id}`} item={item} />
          ))}
        </div>
      </details>
    </section>
  )
}
