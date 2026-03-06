import {
  RELATIONS_LAB_VERSION,
  relationsEmotionOptions,
} from '../../data/relationsLabData'
import {
  RELATIONS_METRIC_ITEMS,
  deltaToken,
  getBarTone,
  getMetricItem,
  getMetricStatusLabel,
} from './relationsUtils'

export function EmotionPickerPill({
  title,
  selection,
  placeholder,
  isOpen,
  onToggle,
  onSelectEmotion,
  onChangeIntensity,
  disabled = false,
}) {
  const label = selection?.labelHe ?? placeholder

  return (
    <div className={`relations-emotion-picker ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <button
        type="button"
        className="relations-emotion-pill"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className="relations-emotion-pill__title">{title}</span>
        <span className="relations-emotion-pill__value">{label}</span>
        {selection?.id ? <small>{selection.intensity}/5</small> : null}
      </button>

      {isOpen && !disabled && (
        <div className="relations-emotion-dropdown" role="dialog" aria-label={title}>
          <div className="relations-emotion-dropdown__list" role="listbox" aria-label={title}>
            {relationsEmotionOptions.map((emotion) => {
              const selected = emotion.id === selection?.id
              return (
                <button
                  key={emotion.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`relations-emotion-dropdown__option ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelectEmotion(emotion.id)}
                >
                  {emotion.labelHe}
                </button>
              )
            })}
          </div>

          {selection?.id && (
            <label className="relations-emotion-dropdown__intensity">
              <span>עוצמה</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={selection.intensity}
                onChange={(event) => onChangeIntensity(Number(event.target.value))}
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export function RelationsHeader({
  flowStage,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenHelp,
  onResetSession,
  canReset,
}) {
  const stageLabel =
    flowStage === 'setup'
      ? 'הכנה'
      : flowStage === 'review'
        ? 'סיכום'
        : 'תרגול'

  return (
    <header className="relations-v2-header relations-v3-header">
      <div className="relations-v2-header__title">
        <p className="relations-v3-header__eyebrow">Relations Lab</p>
        <h1>מעבדת יחסים</h1>
      </div>
      <div className="relations-v3-header__center">
        <span className="relations-v3-stage-badge">{stageLabel}</span>
      </div>
      <div className="relations-v2-header__actions" role="toolbar" aria-label="פעולות מעבדה">
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          title={soundEnabled ? 'כבה צליל' : 'הפעל צליל'}
          aria-label={soundEnabled ? 'כבה צליל' : 'הפעל צליל'}
        >
          <span aria-hidden="true">{soundEnabled ? '◉' : '○'}</span>
        </button>
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onOpenSettings}
          title="הגדרות / Setup"
          aria-label="הגדרות / Setup"
        >
          <span aria-hidden="true">⚙</span>
        </button>
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onOpenHelp}
          title="עזרה"
          aria-label="עזרה"
        >
          <span aria-hidden="true">?</span>
        </button>
        {canReset && (
          <button
            type="button"
            className="relations-v2-icon-button"
            onClick={onResetSession}
            title="סשן חדש"
            aria-label="סשן חדש"
          >
            <span aria-hidden="true">↺</span>
          </button>
        )}
      </div>
    </header>
  )
}

function MetricChip({ item, value, latestTurn, onOpen }) {
  const rawDelta = latestTurn?.deltas?.[item.barKey]
  const delta = Number.isFinite(rawDelta) ? rawDelta : null
  const deltaDisplay = delta === null ? null : deltaToken(delta, item.barKey === 'distress')

  return (
    <button
      type="button"
      className={`relations-v2-metric-chip relations-v2-metric-chip--${getBarTone(item.barKey)}`}
      onClick={() => onOpen(item.id)}
      aria-label={`${item.labelHe}: ${value}%`}
    >
      <div className="relations-v2-metric-chip__head">
        <span className="relations-v2-metric-chip__icon" aria-hidden="true">{item.icon}</span>
        <span className="relations-v2-metric-chip__label">{item.labelHe}</span>
        <strong>{value}%</strong>
      </div>
      <div className="relations-v2-metric-chip__track" aria-hidden="true">
        <div
          className={`relations-v2-metric-chip__fill relations-v2-metric-chip__fill--${getBarTone(item.barKey)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {deltaDisplay && (
        <span className={`relations-v2-metric-chip__delta relations-v2-metric-chip__delta--${deltaDisplay.tone}`}>
          {deltaDisplay.text}
        </span>
      )}
    </button>
  )
}

export function MetricsStrip({ bars, latestTurn, onSelectMetric }) {
  return (
    <section className="relations-v2-metrics" aria-label="מדדים">
      {RELATIONS_METRIC_ITEMS.map((item) => (
        <MetricChip
          key={item.id}
          item={item}
          value={bars[item.barKey]}
          latestTurn={latestTurn}
          onOpen={onSelectMetric}
        />
      ))}
    </section>
  )
}

export function MetricDetailsPanel({ metricId, bars, latestTurn }) {
  const item = getMetricItem(metricId)
  if (!item) return null

  const value = bars[item.barKey]
  const rawDelta = latestTurn?.deltas?.[item.barKey]
  const delta = Number.isFinite(rawDelta) ? rawDelta : null
  const deltaDisplay = delta === null ? null : deltaToken(delta, item.barKey === 'distress')

  return (
    <section className="relations-v2-drawer opened-content" aria-labelledby={`metric-drawer-title-${item.id}`}>
      <div className="relations-v2-drawer__grab" aria-hidden="true" />
      <div className="relations-v2-drawer__head">
        <div>
          <p className="relations-v2-drawer__eyebrow">מדד</p>
          <h2 id={`metric-drawer-title-${item.id}`}>{item.labelHe}</h2>
        </div>
      </div>

      <div className="relations-v2-drawer__value">
        <strong>{value}%</strong>
        {deltaDisplay && (
          <span className={`relations-v2-metric-chip__delta relations-v2-metric-chip__delta--${deltaDisplay.tone}`}>
            {deltaDisplay.text}
          </span>
        )}
      </div>
      <p className="relations-v2-drawer__text">{item.descriptionHe}</p>
      <div className="relations-v2-drawer__track" aria-hidden="true">
        <div
          className={`relations-v2-drawer__fill relations-v2-drawer__fill--${getBarTone(item.barKey)}`}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="relations-v2-drawer__status">
        <span>מצב המערכת כרגע</span>
        <strong>{getMetricStatusLabel(bars)}</strong>
      </div>

      <div className="relations-v2-drawer__section">
        <h3>איך משפרים?</h3>
        <ul>
          {item.tipsHe.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <details className="relations-v2-details">
        <summary>למה זה חשוב?</summary>
        <p>{item.whyHe}</p>
      </details>
    </section>
  )
}

export function RelationsHelpPanel() {
  return (
    <section className="relations-v2-dialog opened-content" aria-labelledby="relations-help-title">
      <div className="relations-v2-dialog__head">
        <h2 id="relations-help-title">איך עובדים כאן</h2>
      </div>
      <ol className="relations-v2-help-list">
        <li>בחר/י Setup קצר: הקשר, סוג התקיעות, רגש ומטרה רכה.</li>
        <li>ב־Drill בוחרים שאלה אחת בלבד.</li>
        <li>בודקים מה השתנה במדדים, ברגש וביחס בין האלמנטים.</li>
        <li>ב־Review מסכמים מה עבד ומה לקחת לשיחה אמיתית.</li>
      </ol>
      <p className="muted-text">
        המדדים נפתחים בלחיצה להסבר מלא. מידע משני כמו ארכיון ו־favorite pack נשמר לסיכום.
      </p>
      <div className="relations-v2-help-footer">{RELATIONS_LAB_VERSION}</div>
    </section>
  )
}

export function TurnDeltaBadges({ turn }) {
  const tokens = [
    { label: 'פתיחות שדה', ...deltaToken(turn.deltas.openField) },
    { label: 'משאבים', ...deltaToken(turn.deltas.resources) },
    { label: 'מצוקה', ...deltaToken(turn.deltas.distress, true) },
  ]
  return (
    <div className="relations-delta-badges">
      {tokens.map((token) => (
        <span key={token.label} className={`relations-delta-badge relations-delta-badge--${token.tone}`}>
          {token.label} {token.text}
        </span>
      ))}
    </div>
  )
}
