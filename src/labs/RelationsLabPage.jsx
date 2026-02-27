import { useEffect, useState } from 'react'
import { useAppState } from '../state/appStateContext'
import { makeId } from '../utils/ids'
import { emitAlchemySignal } from '../utils/alchemySignals'
import { downloadJson } from '../utils/storage'
import { useOverlay } from '../components/overlay/useOverlay'
import {
  RELATIONS_LAB_VERSION,
  buildFinalSessionInsight,
  buildRelationsQuestionSetForScenario,
  createDefaultRelationsWizardSettings,
  createRelationsScenario,
  deriveSystemStatus,
  getEmotionById,
  loadRelationsQuestionArchive,
  relationsArchetypeOptions,
  relationsClientStyleOptions,
  relationsContextOptions,
  relationsEmotionOptions,
  saveRelationsQuestionArchive,
  simulateQuestionTurn,
  suggestSmartQuestion,
} from '../data/relationsLabData'

function deltaToken(value, invertColor = false) {
  const sign = value > 0 ? '+' : ''
  const tone =
    value === 0
      ? 'neutral'
      : (invertColor ? value < 0 : value > 0)
        ? 'good'
        : 'bad'
  return { text: `${sign}${value}`, tone }
}

function formatTurnDeltaLine(turn) {
  const open = deltaToken(turn.deltas.openField)
  const resources = deltaToken(turn.deltas.resources)
  const distress = deltaToken(turn.deltas.distress, true)
  return `׳₪׳×׳™׳—׳•׳× ׳©׳“׳” ${open.text}, ׳׳©׳׳‘׳™׳ ${resources.text}, ׳¢׳•׳׳¡/׳׳¦׳•׳§׳” ${distress.text}`
}

function buildFavoriteArchiveRecord({ session, turn }) {
  return {
    id: `${session.id}:${turn.id}`,
    createdAt: new Date().toISOString(),
    labId: 'relations',
    sessionId: session.id,
    scenarioId: session.scenario.id,
    contextF: session.scenario.contextF,
    archetypeId: session.scenario.archetypeId,
    questionText: turn.questionText,
    family: turn.familyId,
    barsDelta: turn.deltas,
    emotionBefore: turn.emotionBefore,
    emotionAfter: turn.emotionAfter,
  }
}

function copyToClipboard(text) {
  if (!text) return Promise.resolve(false)
  if (!navigator.clipboard?.writeText) {
    return Promise.resolve(false)
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}

function getBarTone(key) {
  if (key === 'openField') return 'open'
  if (key === 'resources') return 'resource'
  return 'distress'
}

function normalizeEmotionSelection(selection, fallbackId = null, fallbackIntensity = 3) {
  return {
    id: selection?.id ?? fallbackId,
    intensity: Number(selection?.intensity ?? fallbackIntensity),
    labelHe:
      selection?.labelHe ??
      (selection?.id ? (getEmotionById(selection.id)?.labelHe ?? selection.id) : null),
  }
}

function relationTypeLabel(type) {
  if (type === 'loop') return '׳׳•׳׳׳”'
  if (type === 'cause') return '׳׳—׳“ ׳׳₪׳¢׳™׳ ׳׳× ׳”׳©׳ ׳™'
  if (type === 'conflict') return '׳”׳×׳ ׳’׳©׳•׳×'
  if (type === 'identity') return '׳–׳”׳•׳× ׳©׳׳₪׳¢׳™׳׳” ׳×׳’׳•׳‘׳”'
  return '׳§׳©׳¨ ׳₪׳¢׳™׳'
}

function relationStateLabelFromStage(stage) {
  if (stage <= 0) return '׳”׳§׳©׳¨ ׳›׳¨׳’׳¢ ׳¡׳’׳•׳¨ ׳•׳ ׳•׳§׳©׳”'
  if (stage === 1) return '׳׳•׳׳׳” ׳©׳׳×׳—׳™׳׳” ׳׳”׳×׳¨׳›׳'
  if (stage === 2) return '׳™׳© ׳™׳•׳×׳¨ ׳׳¨׳•׳•׳— ׳•׳”׳©׳₪׳¢׳” ׳”׳“׳“׳™׳×'
  return '׳”׳§׳©׳¨ ׳₪׳×׳•׳— ׳™׳•׳×׳¨ ׳•׳׳₪׳©׳¨ ׳׳¢׳‘׳•׳“ ׳׳™׳×׳•'
}

function describeCurrentRelationState(session) {
  if (!session?.turns?.length) {
    return relationTypeLabel(session?.scenario?.initialRelationR0?.type)
  }
  const latestTurn = session.turns.at(-1)
  const nextStage = latestTurn?.relationShift?.next ?? 0
  return relationStateLabelFromStage(nextStage)
}

const RELATIONS_METRIC_ITEMS = [
  {
    id: 'openness',
    barKey: 'openField',
    labelHe: '׳₪׳×׳™׳—׳•׳× ׳©׳“׳”',
    icon: 'ג—',
    descriptionHe: '׳›׳׳” ׳§׳ ׳¢׳›׳©׳™׳• ׳׳—׳§׳•׳¨ ׳•׳׳”׳×׳§׳“׳.',
    tipsHe: [
      '׳׳‘׳—׳•׳¨ ׳©׳׳׳” ׳©׳׳¨׳›׳›׳× ׳׳× ׳”׳™׳—׳¡ ׳‘׳™׳ ׳©׳ ׳™ ׳”׳׳׳׳ ׳˜׳™׳.',
      '׳׳¢׳‘׳•׳¨ ׳׳׳©׳₪׳—׳× ׳©׳׳׳•׳× ׳©׳׳—׳₪׳©׳× ׳”׳§׳©׳¨ ׳—׳׳•׳₪׳™.',
      '׳׳”׳׳˜ ׳•׳׳“׳™׳™׳§ ׳׳× ׳”׳¨׳’׳© ׳”׳ ׳•׳›׳—׳™ ׳׳₪׳ ׳™ ׳”׳©׳׳׳” ׳”׳‘׳׳”.',
    ],
    whyHe: '׳›׳©׳₪׳×׳™׳—׳•׳× ׳”׳©׳“׳” ׳¢׳•׳׳”, ׳™׳© ׳™׳•׳×׳¨ ׳׳¨׳•׳•׳— ׳׳¨׳׳•׳× ׳׳₪׳©׳¨׳•׳™׳•׳× ׳•׳׳ ׳¨׳§ ׳×׳’׳•׳‘׳” ׳׳•׳˜׳•׳׳˜׳™׳×.',
  },
  {
    id: 'resources',
    barKey: 'resources',
    labelHe: '׳׳©׳׳‘׳™׳ ׳–׳׳™׳ ׳™׳',
    icon: 'ג¦',
    descriptionHe: '׳›׳׳” ׳›׳•׳—׳•׳×/׳₪׳×׳¨׳•׳ ׳•׳× ׳–׳׳™׳ ׳™׳ ׳›׳¨׳’׳¢.',
    tipsHe: [
      '׳׳—׳₪׳© ׳©׳׳׳” ׳©׳׳–׳›׳™׳¨׳” ׳™׳›׳•׳׳× ׳©׳›׳‘׳¨ ׳§׳™׳™׳׳×.',
      '׳׳ ׳¡׳— ׳׳˜׳¨׳” ׳¨׳›׳” ׳™׳•׳×׳¨ ׳‘-5% ׳׳©׳׳‘ ׳”׳‘׳.',
      '׳׳”׳×׳׳§׳“ ׳‘׳¦׳¢׳“ ׳§׳˜׳ ׳׳—׳“ ׳©׳׳₪׳©׳¨ ׳׳‘׳¦׳¢ ׳¢׳›׳©׳™׳•.',
    ],
    whyHe: '׳™׳•׳×׳¨ ׳׳©׳׳‘׳™׳ ׳–׳׳™׳ ׳™׳ ׳׳’׳“׳™׳׳™׳ ׳¡׳™׳›׳•׳™ ׳׳©׳™׳ ׳•׳™ ׳׳׳™׳×׳™ ׳•׳׳ ׳¨׳§ ׳׳”׳‘׳ ׳” ׳¨׳’׳¢׳™׳×.',
  },
  {
    id: 'distress',
    barKey: 'distress',
    labelHe: '׳¢׳•׳׳¡/׳׳¦׳•׳§׳”',
    icon: '!',
    descriptionHe: '׳›׳׳” ׳׳—׳¥ ׳׳• ׳›׳׳‘ ׳¨׳’׳©׳™׳™׳ ׳ ׳•׳›׳—׳™׳ ׳¢׳›׳©׳™׳•.',
    tipsHe: [
      '׳׳‘׳—׳•׳¨ ׳©׳׳׳” ׳©׳׳׳˜׳” ׳§׳¦׳‘ ׳•׳׳§׳˜׳™׳ ׳” ׳”׳×׳ ׳’׳©׳•׳×.',
      '׳׳”׳™׳©׳׳¨ ׳¢׳ ׳©׳׳׳” ׳׳—׳× ׳‘׳׳‘׳“ ׳•׳׳ ׳׳§׳₪׳•׳¥ ׳‘׳™׳ ׳›׳™׳•׳•׳ ׳™׳.',
      '׳׳”׳—׳׳™׳£ ׳׳׳¡׳’׳•׳¨ ׳©׳׳›׳™׳¨ ׳‘׳§׳•׳©׳™ ׳‘׳׳™ ׳׳”׳’׳“׳™׳¨ ׳–׳”׳•׳×.',
    ],
    whyHe: '׳›׳©׳¢׳•׳׳¡ ׳™׳•׳¨׳“, ׳”׳׳¢׳¨׳›׳× ׳₪׳—׳•׳× ׳ ׳¡׳’׳¨׳× ׳•׳™׳© ׳™׳•׳×׳¨ ׳¡׳™׳›׳•׳™ ׳׳©׳™׳— ׳׳₪׳§׳˜׳™׳‘׳™.',
  },
]

const RELATIONS_METRIC_BY_ID = Object.fromEntries(RELATIONS_METRIC_ITEMS.map((item) => [item.id, item]))

function getMetricItem(metricId) {
  return metricId ? RELATIONS_METRIC_BY_ID[metricId] ?? null : null
}

function buildCompactSystemHint(session, latestTurn, emotionSelection) {
  if (!session) return ''
  if (!latestTurn) {
    return `׳‘׳—׳¨/׳™ ׳©׳׳׳” ׳׳—׳× ׳›׳“׳™ ׳׳¨׳׳•׳× ׳©׳™׳ ׳•׳™ ׳¨׳׳©׳•׳ (${emotionSelection?.labelHe ?? '׳‘׳—׳¨/׳™ ׳¨׳’׳© ׳§׳•׳“׳'}).`
  }
  return `׳”׳©׳׳׳” ׳”׳׳—׳¨׳•׳ ׳” ׳¢׳“׳›׳ ׳” ׳׳“׳“׳™׳ ׳•׳¨׳’׳©. ׳”׳׳©׳/׳™ ׳¢׳ ׳©׳׳׳” ׳׳—׳× ׳ ׳•׳¡׳₪׳×.`
}

function EmotionPickerPill({
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
              <span>׳¢׳•׳¦׳׳” (׳׳•׳₪׳¦׳™׳•׳ ׳׳™)</span>
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

function EmotionPillsPanel({
  currentEmotion,
  afterEmotion,
  openMenuId,
  setOpenMenuId,
  onSelectCurrentEmotion,
  onChangeCurrentIntensity,
  onSelectAfterEmotion,
  onChangeAfterIntensity,
}) {
  return (
    <div className="relations-panel relations-emotions-panel">
      <h3>׳׳¦׳‘ ׳¨׳’׳©׳™</h3>
      <p className="muted-text">׳”׳¨׳’׳© ׳׳—׳¨׳™ ׳”׳©׳׳׳” ׳׳×׳¢׳“׳›׳ ׳׳•׳˜׳•׳׳˜׳™׳×. ׳׳₪׳©׳¨ ׳׳“׳™׳™׳§ ׳™׳“׳ ׳™׳× ׳“׳¨׳ ׳”-pill.</p>

      <div className="relations-emotion-pills">
        <EmotionPickerPill
          title="׳¨׳’׳© ׳ ׳•׳›׳—׳™"
          selection={currentEmotion}
          placeholder="׳‘׳—׳¨/׳™ ׳¨׳’׳©"
          isOpen={openMenuId === 'current'}
          onToggle={() => setOpenMenuId((current) => (current === 'current' ? '' : 'current'))}
          onSelectEmotion={onSelectCurrentEmotion}
          onChangeIntensity={onChangeCurrentIntensity}
        />

        <EmotionPickerPill
          title="׳¨׳’׳© ׳׳—׳¨׳™ ׳”׳©׳׳׳”"
          selection={afterEmotion}
          placeholder="׳™׳•׳₪׳™׳¢ ׳׳—׳¨׳™ ׳©׳׳׳”"
          isOpen={openMenuId === 'after'}
          onToggle={() => setOpenMenuId((current) => (current === 'after' ? '' : 'after'))}
          onSelectEmotion={onSelectAfterEmotion}
          onChangeIntensity={onChangeAfterIntensity}
          disabled={!afterEmotion}
        />
      </div>
    </div>
  )
}

function MetricBars({ bars, latestTurn }) {
  const items = [
    { key: 'openField', label: '׳₪׳×׳™׳—׳•׳× ׳©׳“׳”' },
    { key: 'resources', label: '׳׳©׳׳‘׳™׳ ׳–׳׳™׳ ׳™׳' },
    { key: 'distress', label: '׳¢׳•׳׳¡/׳׳¦׳•׳§׳”' },
  ]

  return (
    <div className="relations-panel relations-metrics-panel">
      <h3>׳׳“׳“׳™׳ (׳×׳•׳¦׳׳”)</h3>
      <div className="relations-metrics-list">
        {items.map((item) => {
          const rawDelta = latestTurn?.deltas?.[item.key]
          const delta = Number.isFinite(rawDelta) ? rawDelta : null
          const deltaDisplay = delta === null ? null : deltaToken(delta, item.key === 'distress')

          return (
            <div key={item.key} className="relations-metric">
              <div className="relations-metric__head">
                <span>{item.label}</span>
                <div className="relations-metric__value">
                  {deltaDisplay && (
                    <span
                      key={`${latestTurn?.id ?? 'base'}:${item.key}`}
                      className={`relations-metric__delta relations-metric__delta--${deltaDisplay.tone}`}
                    >
                      {deltaDisplay.text}
                    </span>
                  )}
                  <strong>{bars[item.key]}</strong>
                </div>
              </div>
              <div className="relations-metric__track" aria-hidden="true">
                <div
                  className={`relations-metric__fill relations-metric__fill--${getBarTone(item.key)}`}
                  style={{ width: `${bars[item.key]}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="relations-status-line">{deriveSystemStatus(bars)}</div>
    </div>
  )
}

function RelationsHeader({
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenHelp,
  onResetSession,
  canReset,
}) {
  return (
    <header className="relations-v2-header">
      <div className="relations-v2-header__title">
        <h1>׳׳¢׳‘׳“׳× ׳™׳—׳¡׳™׳</h1>
      </div>
      <div className="relations-v2-header__actions" role="toolbar" aria-label="׳₪׳¢׳•׳׳•׳× ׳׳¢׳‘׳“׳”">
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          title={soundEnabled ? '׳›׳‘׳” ׳¦׳׳™׳' : '׳”׳₪׳¢׳ ׳¦׳׳™׳'}
          aria-label={soundEnabled ? '׳›׳‘׳” ׳¦׳׳™׳' : '׳”׳₪׳¢׳ ׳¦׳׳™׳'}
        >
          <span aria-hidden="true">{soundEnabled ? 'ג™×' : 'ֳ—'}</span>
        </button>
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onOpenSettings}
          title="׳”׳’׳“׳¨׳•׳×"
          aria-label="׳”׳’׳“׳¨׳•׳×"
        >
          <span aria-hidden="true">ג™</span>
        </button>
        <button
          type="button"
          className="relations-v2-icon-button"
          onClick={onOpenHelp}
          title="׳¢׳–׳¨׳”"
          aria-label="׳¢׳–׳¨׳”"
        >
          <span aria-hidden="true">?</span>
        </button>
        {canReset && (
          <button
            type="button"
            className="relations-v2-icon-button"
            onClick={onResetSession}
            title="׳¡׳©׳ ׳—׳“׳©"
            aria-label="׳¡׳©׳ ׳—׳“׳©"
          >
            <span aria-hidden="true">ג†÷</span>
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

function MetricsStrip({ bars, latestTurn, onSelectMetric }) {
  return (
    <section className="relations-v2-metrics" aria-label="׳׳“׳“׳™׳">
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

function MetricDetailsPanel({ metricId, bars, latestTurn }) {
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
        <span>מצב מערכת כרגע</span>
        <strong>{deriveSystemStatus(bars)}</strong>
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

function RelationsHelpPanel({ version }) {
  return (
    <section className="relations-v2-dialog opened-content" aria-labelledby="relations-help-title">
      <div className="relations-v2-dialog__head">
        <h2 id="relations-help-title">איך עובדים כאן</h2>
      </div>
      <ol className="relations-v2-help-list">
        <li>בחר/י רגש נוכחי.</li>
        <li>בחר/י שאלה אחת בלבד.</li>
        <li>בדוק/י שינוי במדדים ובפירוק.</li>
        <li>חזור/י על התהליך עם שאלה חדשה.</li>
      </ol>
      <p className="muted-text">
        מדדים נפתחים בלחיצה להסבר מלא. סטטיסטיקה והיסטוריה נמצאים בתחתית במסכים מתקפלים.
      </p>
      <div className="relations-v2-help-footer">{version}</div>
    </section>
  )
}
function ElementsPanel({
  session,
  currentEmotion,
  afterEmotion,
  openEmotionMenuId,
  setOpenEmotionMenuId,
  onSelectCurrentEmotion,
  onChangeCurrentIntensity,
  relationStateSummary,
}) {
  const scenario = session?.scenario
  if (!scenario) return null

  return (
    <section className="relations-panel relations-v2-elements-panel">
      <div className="relations-v2-panel-head">
        <h2>׳׳׳׳ ׳˜׳™׳</h2>
        <p className="muted-text">׳–׳” ׳”׳₪׳™׳¨׳•׳§ ׳׳¢׳‘׳•׳“׳” ׳¢׳›׳©׳™׳•. ׳”׳׳©׳₪׳˜ ׳”׳׳§׳•׳¨׳™ ׳׳•׳¡׳×׳¨ ׳׳׳˜׳”.</p>
      </div>

      <div className="relations-v2-elements-panel__emotion">
        <EmotionPickerPill
          title="׳¨׳’׳© ׳ ׳•׳›׳—׳™"
          selection={currentEmotion}
          placeholder="׳‘׳—׳¨/׳™ ׳¨׳’׳©"
          isOpen={openEmotionMenuId === 'current'}
          onToggle={() => setOpenEmotionMenuId((current) => (current === 'current' ? '' : 'current'))}
          onSelectEmotion={onSelectCurrentEmotion}
          onChangeIntensity={onChangeCurrentIntensity}
        />
        {afterEmotion?.id && (
          <div className="relations-v2-result-chip">
            <span>׳׳—׳¨׳™ ׳”׳©׳׳׳” ׳”׳׳—׳¨׳•׳ ׳”</span>
            <strong>{afterEmotion.labelHe}</strong>
            <small>{afterEmotion.intensity}/5</small>
          </div>
        )}
      </div>

      <div className="relations-v2-elements-grid">
        <article className="relations-v2-element-card">
          <span>׳”׳§׳©׳¨</span>
          <strong>{scenario.contextF}</strong>
        </article>
        <article className="relations-v2-element-card">
          <span>׳׳˜׳¨׳”</span>
          <strong>{scenario.goalG}</strong>
        </article>
        <article className="relations-v2-element-card">
          <span>׳׳׳׳ ׳˜ 1</span>
          <strong>{scenario.element1}</strong>
        </article>
        <article className="relations-v2-element-card">
          <span>׳׳׳׳ ׳˜ 2</span>
          <strong>{scenario.element2}</strong>
        </article>
        <article className="relations-v2-element-card relations-v2-element-card--wide">
          <span>׳”׳§׳©׳¨ ׳‘׳™׳ ׳™׳”׳ ׳›׳¨׳’׳¢</span>
          <strong>{relationStateSummary}</strong>
        </article>
      </div>

      {scenario.alternativeFields?.length ? (
        <div className="relations-v2-chip-group">
          <h3>׳©׳“׳•׳× ׳׳₪׳©׳¨׳™׳™׳ ׳׳¢׳‘׳•׳“׳”</h3>
          <div className="relations-v2-chip-wrap">
            {scenario.alternativeFields.map((field) => (
              <span key={field} className="relations-v2-chip">{field}</span>
            ))}
          </div>
        </div>
      ) : null}

      <details className="relations-v2-details">
        <summary>׳”׳¦׳’ ׳׳©׳₪׳˜ ׳׳§׳•׳¨׳™</summary>
        <div className="relations-v2-monologue">
          {scenario.clientMonologueLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </details>
    </section>
  )
}

function ActionPanel({
  questionFamilies,
  selectedFamilyId,
  onSelectFamily,
  onAskQuestion,
  canAskQuestion,
  smartSuggestion,
  onApplySmartSuggestion,
  highlightedQuestionId,
  statusHint,
}) {
  const activeFamily = questionFamilies.find((family) => family.id === selectedFamilyId) ?? questionFamilies[0] ?? null

  return (
    <section className="relations-panel relations-v2-action-panel">
      <div className="relations-v2-panel-head">
        <h2>׳‘׳—׳¨/׳™ ׳©׳׳׳” ׳׳—׳× ׳׳”׳׳©׳</h2>
        <p className="muted-text">׳׳—׳¨׳™ ׳”׳×׳©׳•׳‘׳” ׳™׳•׳₪׳™׳¢ ׳¡׳˜ ׳—׳“׳© ׳©׳ ׳©׳׳׳•׳×.</p>
      </div>

      <div className="relations-v2-action-hint">{statusHint}</div>

      {smartSuggestion && (
        <button type="button" className="relations-v2-smart" onClick={onApplySmartSuggestion}>
          <span>׳”׳¦׳¢׳” ׳—׳›׳׳”</span>
          <strong>{smartSuggestion.renderedText}</strong>
        </button>
      )}

      <div className="relations-v2-family-tabs" role="tablist" aria-label="׳׳©׳₪׳—׳•׳× ׳©׳׳׳•׳×">
        {questionFamilies.map((family) => (
          <button
            key={family.id}
            type="button"
            role="tab"
            className={`relations-v2-family-tab ${activeFamily?.id === family.id ? 'is-active' : ''}`}
            aria-selected={activeFamily?.id === family.id}
            onClick={() => onSelectFamily(family.id)}
          >
            {family.labelHe}
          </button>
        ))}
      </div>

      {activeFamily && (
        <>
          <div className="relations-v2-family-note">{activeFamily.helperHe}</div>
          <div className="relations-v2-question-list">
            {activeFamily.questions.map((question) => (
              <button
                key={question.id}
                type="button"
                className={`relations-v2-question-button ${highlightedQuestionId === question.id ? 'is-highlighted' : ''}`}
                disabled={!canAskQuestion}
                onClick={() => onAskQuestion(activeFamily, question)}
              >
                {question.renderedText}
              </button>
            ))}
          </div>
        </>
      )}

      {!canAskQuestion && (
        <div className="relations-action-note">׳‘׳—׳¨/׳™ ׳¨׳’׳© ׳ ׳•׳›׳—׳™ ׳›׳“׳™ ׳׳₪׳×׳•׳— ׳׳× ׳”׳©׳׳׳•׳×.</div>
      )}
    </section>
  )
}

function BottomAccordions({
  session,
  latestTurn,
  likedTurns,
  archiveCountForCurrentSession,
  currentFinalInsight,
  onFinishSession,
  onCopyFavoritePack,
  onDownloadFavoritePack,
  onToggleLikeTurn,
}) {
  if (!session) return null

  const turnsNewestFirst = session.turns.slice().reverse()

  return (
    <section className="relations-v2-bottom">
      <details className="relations-v2-details">
        <summary>׳¡׳˜׳˜׳™׳¡׳˜׳™׳§׳” ׳©׳ ׳”׳¡׳©׳</summary>
        <div className="relations-v2-bottom__body">
          <div className="relations-v2-stats-grid">
            <div><span>׳©׳׳׳•׳×</span><strong>{session.turns.length}</strong></div>
            <div><span>׳׳”׳•׳‘׳•׳×</span><strong>{likedTurns.length}</strong></div>
            <div><span>׳׳¨׳›׳™׳•׳ ׳‘׳¡׳©׳</span><strong>{archiveCountForCurrentSession}</strong></div>
          </div>
          {latestTurn && <p className="relations-v2-bottom__insight">{currentFinalInsight}</p>}
          <div className="relations-v2-bottom__actions">
            <button type="button" className="secondary-button" onClick={onCopyFavoritePack} disabled={!likedTurns.length}>
              ׳”׳¢׳×׳§ ׳׳•׳¢׳“׳₪׳™׳
            </button>
            <button type="button" className="secondary-button" onClick={onDownloadFavoritePack} disabled={!likedTurns.length}>
              ׳”׳•׳¨׳“ ׳׳•׳¢׳“׳₪׳™׳
            </button>
            <button type="button" className="relations-finish-button" onClick={onFinishSession} disabled={!session.turns.length}>
              ׳¡׳™׳•׳ ׳¡׳©׳
            </button>
          </div>
        </div>
      </details>

      <details className="relations-v2-details">
        <summary>׳”׳™׳¡׳˜׳•׳¨׳™׳™׳× ׳©׳׳׳•׳×</summary>
        <div className="relations-v2-bottom__body">
          {turnsNewestFirst.length ? (
            <div className="relations-v2-history-list">
              {turnsNewestFirst.map((turn, index) => (
                <article key={turn.id} className="relations-v2-history-item">
                  <div className="relations-v2-history-item__head">
                    <div>
                      <small>{turn.familyLabelHe}</small>
                      <h4>{index === 0 ? '׳©׳׳׳” ׳׳—׳¨׳•׳ ׳”' : `׳©׳׳׳” #${session.turns.length - index}`}</h4>
                    </div>
                    <button
                      type="button"
                      className={`relations-like-button ${turn.liked ? 'is-liked' : ''}`}
                      onClick={() => onToggleLikeTurn(turn.id)}
                      aria-pressed={turn.liked}
                    >
                      {turn.liked ? '׳ ׳©׳׳¨' : '׳©׳׳•׳¨'}
                    </button>
                  </div>
                  <TurnDeltaBadges turn={turn} />
                  <p className="relations-v2-history-item__question">{turn.questionText}</p>
                  <details className="relations-v2-details relations-v2-details--nested">
                    <summary>׳”׳¦׳’ ׳×׳’׳•׳‘׳” ׳•׳×׳•׳‘׳ ׳”</summary>
                    <div className="relations-v2-history-item__details">
                      <div>
                        <strong>׳×׳’׳•׳‘׳”</strong>
                        <pre>{turn.clientAnswerText}</pre>
                      </div>
                      <div>
                        <strong>׳×׳•׳‘׳ ׳”</strong>
                        <p>{turn.coachInsightText}</p>
                      </div>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-text">׳¢׳“׳™׳™׳ ׳׳ ׳ ׳©׳׳׳• ׳©׳׳׳•׳×.</p>
          )}
        </div>
      </details>

      <details className="relations-v2-details">
        <summary>׳׳‘׳—׳•׳ ׳™׳ ׳§׳•׳“׳׳™׳</summary>
        <div className="relations-v2-bottom__body">
          {session.turns.length ? (
            <div className="relations-v2-diagnostics-list">
              {turnsNewestFirst.slice(0, 5).map((turn) => (
                <div key={`${turn.id}-diag`} className="relations-v2-diagnostic-item">
                  <strong>{turn.familyLabelHe}</strong>
                  <p>{turn.coachInsightText}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">׳”׳׳‘׳—׳•׳ ׳™׳ ׳™׳•׳₪׳™׳¢׳• ׳׳—׳¨׳™ ׳”׳©׳׳׳” ׳”׳¨׳׳©׳•׳ ׳”.</p>
          )}
        </div>
      </details>
    </section>
  )
}
function QuestionPanel({
  familyId,
  onSelectFamily,
  questionFamilies,
  onAskQuestion,
  disabled,
  smartSuggestion,
  onApplySmartSuggestion,
  highlightedQuestionId,
}) {
  const activeFamily = questionFamilies.find((family) => family.id === familyId) ?? questionFamilies[0]

  return (
    <div className="relations-panel relations-question-panel">
      <div className="relations-question-panel__head">
        <div>
          <h3>׳׳©׳₪׳—׳•׳× ׳©׳׳׳•׳×</h3>
          <p className="muted-text">׳‘׳›׳ ׳˜׳׳‘ ׳׳•׳¦׳’׳•׳× ׳¨׳§ 3ג€“4 ׳©׳׳׳•׳×, ׳›׳“׳™ ׳׳©׳׳•׳¨ ׳¢׳ ׳‘׳—׳™׳¨׳” ׳׳ ׳•׳©׳™׳× ׳•׳₪׳©׳•׳˜׳”.</p>
        </div>
        <button type="button" className="relations-smart-button" onClick={onApplySmartSuggestion}>
          ׳”׳¦׳¢׳” ׳—׳›׳׳”
        </button>
      </div>

      {smartSuggestion && (
        <div className="relations-smart-callout">
          <span>׳”׳¦׳¢׳” ׳›׳¨׳’׳¢:</span>
          <strong>{smartSuggestion.familyLabelHe}</strong>
          <p>{smartSuggestion.renderedText}</p>
        </div>
      )}

      <div className="relations-question-tabs" role="tablist" aria-label="׳׳©׳₪׳—׳•׳× ׳©׳׳׳•׳×">
        {questionFamilies.map((family) => (
          <button
            key={family.id}
            type="button"
            role="tab"
            className={`relations-question-tab ${family.id === activeFamily.id ? 'is-active' : ''}`}
            aria-selected={family.id === activeFamily.id}
            onClick={() => onSelectFamily(family.id)}
          >
            {family.labelHe}
          </button>
        ))}
      </div>

      <div className="relations-question-family-note">{activeFamily.helperHe}</div>

      <div className="relations-question-list">
        {activeFamily.questions.map((question) => (
          <button
            key={question.id}
            type="button"
            className={`relations-question-button ${highlightedQuestionId === question.id ? 'is-highlighted' : ''}`}
            disabled={disabled}
            onClick={() => onAskQuestion(activeFamily, question)}
          >
            {question.renderedText}
          </button>
        ))}
      </div>
    </div>
  )
}

function TurnDeltaBadges({ turn }) {
  const tokens = [
    { label: '׳₪׳×׳™׳—׳•׳× ׳©׳“׳”', ...deltaToken(turn.deltas.openField) },
    { label: '׳׳©׳׳‘׳™׳', ...deltaToken(turn.deltas.resources) },
    { label: '׳׳¦׳•׳§׳”', ...deltaToken(turn.deltas.distress, true) },
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

function buildFavoritePackPayload(session) {
  const likedTurns = session.turns.filter((turn) => turn.liked)
  return {
    schemaVersion: 1,
    kind: 'relations-favorite-questions',
    exportedAt: new Date().toISOString(),
    sessionId: session.id,
    scenario: {
      contextF: session.scenario.contextF,
      goalG: session.scenario.goalG,
      element1: session.scenario.element1,
      element2: session.scenario.element2,
      relationR0: session.scenario.initialRelationR0.shortHe,
    },
    favorites: likedTurns.map((turn) => ({
      questionText: turn.questionText,
      family: turn.familyId,
      barsDelta: turn.deltas,
      emotionBefore: turn.emotionBefore,
      emotionAfter: turn.emotionAfter,
      coachInsightText: turn.coachInsightText,
    })),
  }
}

function RelationsWizardPanel({
  wizardStep,
  wizardSettings,
  setWizardSettings,
  wizardScenarioPreview,
  onGenerateScenario,
  onStartSession,
  onBackToSetup,
}) {
  return (
    <section className="opened-content">
      {wizardStep === 'setup' && (
        <>
          <div className="relations-wizard-head">
            <p className="relations-home-card__eyebrow">מסך 1 / Wizard</p>
            <h2 id="relations-wizard-title">בנה סיטואציה לתרגול</h2>
            <p>בחר/י כמה פרמטרים פשוטים. הם יקבעו איזו בעיה תיווצר ואיך המטופל יגיב.</p>
          </div>

          <div className="relations-wizard-grid">
            <label className="relations-field">
              <span>תחום / הקשר</span>
              <select
                value={wizardSettings.contextId}
                onChange={(event) =>
                  setWizardSettings((current) => ({ ...current, contextId: event.target.value }))
                }
              >
                {relationsContextOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.labelHe}</option>
                ))}
              </select>
            </label>

            <label className="relations-field">
              <span>סוג הסיטואציה</span>
              <select
                value={wizardSettings.archetypeId}
                onChange={(event) =>
                  setWizardSettings((current) => ({ ...current, archetypeId: event.target.value }))
                }
              >
                {relationsArchetypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.labelHe}</option>
                ))}
              </select>
            </label>

            <label className="relations-field">
              <span>אופי המטופל</span>
              <select
                value={wizardSettings.clientStyleId}
                onChange={(event) =>
                  setWizardSettings((current) => ({ ...current, clientStyleId: event.target.value }))
                }
              >
                {relationsClientStyleOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.labelHe}</option>
                ))}
              </select>
            </label>

            <label className="relations-field">
              <span>רמת קושי: {wizardSettings.difficulty}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={wizardSettings.difficulty}
                onChange={(event) =>
                  setWizardSettings((current) => ({ ...current, difficulty: Number(event.target.value) }))
                }
              />
            </label>

            <label className="relations-field">
              <span>כמות שדות חלופיים: {wizardSettings.altFieldsCount}</span>
              <input
                type="range"
                min="1"
                max="3"
                value={wizardSettings.altFieldsCount}
                onChange={(event) =>
                  setWizardSettings((current) => ({ ...current, altFieldsCount: Number(event.target.value) }))
                }
              />
            </label>
          </div>

          <div className="relations-wizard-actions">
            <button type="button" onClick={onGenerateScenario}>הגרל סיטואציה</button>
            <button type="button" className="secondary-button" disabled>
              אשר וצא לדרך
            </button>
          </div>
        </>
      )}

      {wizardStep === 'problem' && wizardScenarioPreview && (
        <>
          <div className="relations-wizard-head">
            <p className="relations-home-card__eyebrow">מסך 2 / הבעיה</p>
            <h2 id="relations-wizard-title">הבעיה — מונולוג + פירוק מבני</h2>
            <p>בדוק/י שהשדה, המטרה, האלמנטים והיחס ברורים. ואז אשר/י וצא/י לדרך.</p>
          </div>

          <div className="relations-wizard-problem">
            <div className="relations-wizard-monologue">
              {wizardScenarioPreview.clientMonologueLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>

            <div className="relations-wizard-structure">
              <div><span>ההקשר:</span> <strong>{wizardScenarioPreview.contextF}</strong></div>
              <div><span>המטרה:</span> <strong>{wizardScenarioPreview.goalG}</strong></div>
              <div><span>דבר ראשון במתח:</span> <strong>{wizardScenarioPreview.element1}</strong></div>
              <div><span>דבר שני במתח:</span> <strong>{wizardScenarioPreview.element2}</strong></div>
              <div><span>הקשר ביניהם כרגע:</span> <strong>{wizardScenarioPreview.initialRelationR0.shortHe}</strong></div>
            </div>
          </div>

          <div className="relations-wizard-actions">
            <button type="button" className="secondary-button" onClick={onBackToSetup}>
              חזרה להגדרות
            </button>
            <button type="button" onClick={onGenerateScenario}>
              הגרל מחדש
            </button>
            <button type="button" className="relations-finish-button" onClick={onStartSession}>
              אשר וצא לדרך
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default function RelationsLabPage() {
  const { upsertHistory, setLastVisitedLab } = useAppState()
  const { openOverlay, closeOverlay, activeOverlay } = useOverlay()

  const [sessionStatus, setSessionStatus] = useState('idle')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(true)
  const [wizardStep, setWizardStep] = useState('setup')
  const [wizardSettings, setWizardSettings] = useState(createDefaultRelationsWizardSettings)
  const [wizardScenarioPreview, setWizardScenarioPreview] = useState(null)

  const [session, setSession] = useState(null)
  const [selectedFamilyId, setSelectedFamilyId] = useState('between')
  const [emotionSelection, setEmotionSelection] = useState({ id: null, intensity: 3 })
  const [afterEmotionSelection, setAfterEmotionSelection] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [openEmotionMenuId, setOpenEmotionMenuId] = useState('')
  const [highlightedQuestionId, setHighlightedQuestionId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [archive, setArchive] = useState(loadRelationsQuestionArchive)

  const emitSignal = (type, detail) => {
    if (!soundEnabled) return
    emitAlchemySignal(type, detail)
  }

  useEffect(() => {
    setLastVisitedLab('relations')
  }, [setLastVisitedLab])

  useEffect(() => {
    saveRelationsQuestionArchive(archive)
  }, [archive])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('.relations-emotion-picker')) return
      setOpenEmotionMenuId('')
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const questionFamilies = session?.scenario ? buildRelationsQuestionSetForScenario(session.scenario) : []

  const smartSuggestion = session?.scenario
    ? suggestSmartQuestion({ scenario: session.scenario, bars: session.bars })
    : null

  const canAskQuestion = Boolean(session && emotionSelection.id)
  const latestTurn = session?.turns.at(-1) ?? null
  const relationStateSummary = session ? describeCurrentRelationState(session) : ''

  const handleOpenWizard = () => {
    setWizardOpen(true)
    setWizardStep('setup')
    setWizardScenarioPreview(null)
    setHelpOpen(false)
    setSelectedMetric(null)
    setOpenEmotionMenuId('')
    setStatusMessage('')
  }

  const handleGenerateScenario = () => {
    const scenario = createRelationsScenario(wizardSettings)
    setWizardScenarioPreview(scenario)
    setWizardStep('problem')
    setStatusMessage('׳ ׳•׳¦׳¨׳” ׳¡׳™׳˜׳•׳׳¦׳™׳” ׳׳×׳¨׳’׳•׳. ׳׳₪׳©׳¨ ׳׳¢׳‘׳•׳¨ ׳¢׳ ׳”׳׳‘׳ ׳” ׳•׳׳׳©׳¨.')
    emitSignal('success', { message: '׳¡׳™׳˜׳•׳׳¦׳™׳” ׳׳×׳¨׳’׳•׳ ׳ ׳•׳¦׳¨׳”.' })
  }

  const handleStartSession = () => {
    if (!wizardScenarioPreview) {
      setStatusMessage('׳§׳•׳“׳ ׳¦׳¨׳™׳ ׳׳”׳’׳¨׳™׳ ׳¡׳™׳˜׳•׳׳¦׳™׳”.')
      return
    }

    const nextSession = {
      id: makeId('relations-session'),
      startedAt: new Date().toISOString(),
      endedAt: null,
      scenario: wizardScenarioPreview,
      bars: { ...wizardScenarioPreview.initialBars },
      turns: [],
    }

    setSession(nextSession)
    setSessionStatus('running')
    setSummaryOpen(false)
    setWizardOpen(false)
    setWizardStep('setup')
    setSelectedFamilyId('between')
    setEmotionSelection(
      normalizeEmotionSelection({
        id: wizardScenarioPreview.baselineEmotionId ?? null,
        intensity: 3,
      }),
    )
    setAfterEmotionSelection(null)
    setSelectedMetric(null)
    setHelpOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId('')
    setStatusMessage('׳‘׳—׳¨/׳™ ׳©׳׳׳” ׳׳—׳× ׳׳”׳׳©׳. ׳”׳׳“׳“׳™׳ ׳™׳×׳¢׳“׳›׳ ׳• ׳׳™׳“ ׳׳—׳¨׳™ ׳”׳‘׳—׳™׳¨׳”.')
  }

  const handleSelectCurrentEmotion = (emotionId) => {
    if (!emotionId) return
    const nextEmotion = normalizeEmotionSelection({
      id: emotionId,
      intensity: emotionSelection?.intensity ?? 3,
    })
    setEmotionSelection(nextEmotion)
    setOpenEmotionMenuId('')
    setStatusMessage('׳¢׳•׳“׳›׳ ׳¨׳’׳© ׳ ׳•׳›׳—׳™ ׳׳¡׳‘׳‘ ׳”׳‘׳.')
  }

  const handleChangeCurrentEmotionIntensity = (intensity) => {
    setEmotionSelection((current) => normalizeEmotionSelection({ ...current, intensity }))
  }

  const handleAskQuestion = (family, question) => {
    if (!session) return
    if (!canAskQuestion) {
      setStatusMessage('׳§׳•׳“׳ ׳‘׳—׳¨/׳™ ׳׳• ׳¢׳“׳›׳/׳™ ׳¨׳’׳© ׳ ׳•׳›׳—׳™.')
      return
    }

    const emotionBefore = normalizeEmotionSelection(emotionSelection)

    const turnResult = simulateQuestionTurn({
      scenario: session.scenario,
      settings: session.scenario.settings,
      barsBefore: session.bars,
      question,
      familyId: family.id,
      emotionBefore,
      turnIndex: session.turns.length,
    })
    const nextAfterEmotion = normalizeEmotionSelection(
      turnResult.emotionAfterSuggested ?? emotionBefore,
      emotionBefore.id,
      emotionBefore.intensity,
    )

    const turnId = makeId('rel-turn')
    const turn = {
      id: turnId,
      createdAt: new Date().toISOString(),
      familyId: family.id,
      familyLabelHe: family.labelHe,
      questionId: question.id,
      questionText: question.renderedText,
      barsBefore: { ...session.bars },
      barsAfter: turnResult.barsAfter,
      deltas: turnResult.deltas,
      emotionBefore,
      emotionAfter: nextAfterEmotion,
      clientAnswerText: turnResult.clientAnswerText,
      coachInsightText: turnResult.coachInsightText,
      relationShift: turnResult.relationShift,
      liked: false,
    }

    setSession((current) => ({
      ...current,
      bars: turnResult.barsAfter,
      turns: [...current.turns, turn],
    }))

    setAfterEmotionSelection(nextAfterEmotion)
    setEmotionSelection(nextAfterEmotion)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId(question.id)
    setSelectedMetric(null)
    setStatusMessage('׳‘׳•׳¦׳¢ ׳¡׳‘׳‘ ׳׳—׳“. ׳‘׳—׳¨/׳™ ׳©׳׳׳” ׳ ׳•׳¡׳₪׳× ׳׳• ׳‘׳“׳•׳§/׳™ ׳׳× ׳”׳׳“׳“׳™׳ ׳‘׳׳—׳™׳¦׳”.')

    emitSignal('tap', { message: '׳ ׳‘׳—׳¨׳” ׳©׳׳׳× ׳™׳—׳¡׳™׳.' })
    emitSignal('rise', { message: '׳”׳׳“׳“׳™׳ ׳”׳×׳¢׳“׳›׳ ׳•.' })

    const gain = turn.deltas.openField + turn.deltas.resources - turn.deltas.distress
    const improved = turn.deltas.openField > 0 || turn.deltas.distress < 0
    if (improved) {
      emitSignal('copied', { message: '׳©׳™׳₪׳•׳¨ ׳׳•׳¨׳’׳© ׳‘׳׳“׳“׳™׳.' })
    } else if (gain >= 14) {
      emitSignal('success', { message: '׳ ׳•׳¦׳¨ ׳©׳™׳ ׳•׳™ ׳‘׳׳‘׳ ׳” ׳”׳§׳©׳¨.' })
    }
  }

  const handleApplySmartSuggestion = () => {
    if (!smartSuggestion) return
    setSelectedFamilyId(smartSuggestion.familyId)
    setHighlightedQuestionId(smartSuggestion.question.id)
    setStatusMessage(`׳”׳¦׳¢׳” ׳—׳›׳׳”: ${smartSuggestion.renderedText}`)
  }

  const handleToggleLikeTurn = (turnId) => {
    if (!session) return

    const currentTurn = session.turns.find((turn) => turn.id === turnId)
    if (!currentTurn) return
    const nextTurnSnapshot = { ...currentTurn, liked: !currentTurn.liked }

    setSession((current) => {
      if (!current) return current
      const turns = current.turns.map((turn) => {
        if (turn.id !== turnId) return turn
        return { ...turn, liked: !turn.liked }
      })
      return { ...current, turns }
    })

    setArchive((currentArchive) => {
      const key = `${session.id}:${turnId}`
      const exists = currentArchive.some((item) => item.id === key)
      if (exists && !nextTurnSnapshot.liked) {
        return currentArchive.filter((item) => item.id !== key)
      }
      if (!exists && nextTurnSnapshot.liked) {
        return [buildFavoriteArchiveRecord({ session, turn: nextTurnSnapshot }), ...currentArchive].slice(0, 200)
      }
      return currentArchive
    })

    emitSignal('saved', { message: nextTurnSnapshot.liked ? '׳”׳©׳׳׳” ׳ ׳©׳׳¨׳” ׳׳׳¨׳›׳™׳•׳.' : '׳”׳©׳׳׳” ׳”׳•׳¡׳¨׳” ׳׳”׳׳¨׳›׳™׳•׳.' })
  }

  const handleFinishSession = () => {
    if (!session) return
    const nextSession = {
      ...session,
      endedAt: new Date().toISOString(),
    }
    setSession(nextSession)
    setSummaryOpen(true)

    const finalInsight = buildFinalSessionInsight({
      scenario: nextSession.scenario,
      turns: nextSession.turns,
      bars: nextSession.bars,
    })

    upsertHistory({
      id: nextSession.id,
      labId: 'relations',
      createdAt: nextSession.endedAt,
      summaryHe: `׳™׳—׳¡׳™׳ | ${nextSession.turns.length} ׳©׳׳׳•׳× | ${finalInsight}`,
      sentenceText: nextSession.scenario.clientMonologueLines[1] ?? nextSession.scenario.clientMonologueLines[0] ?? 'Relations Session',
    })

    emitSignal('mastery', { message: '׳¡׳©׳ ׳™׳—׳¡׳™׳ ׳”׳•׳©׳׳.' })
  }

  const handleCopyFavoritePack = async () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2))
    setStatusMessage(ok ? '׳—׳‘׳™׳׳× ׳©׳׳׳•׳× ׳׳”׳•׳‘׳•׳× ׳”׳•׳¢׳×׳§׳” ׳׳׳•׳—.' : '׳׳ ׳”׳¦׳׳—׳×׳™ ׳׳”׳¢׳×׳™׳§ ׳׳׳•׳—.')
    emitSignal(ok ? 'copied' : 'soft-alert', { message: ok ? 'Favorite Pack copied.' : 'Copy failed.' })
  }

  const handleDownloadFavoritePack = () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    downloadJson(`relations-favorite-pack-${session.id}.json`, payload)
    setStatusMessage('׳—׳‘׳™׳׳× ׳©׳׳׳•׳× ׳׳”׳•׳‘׳•׳× ׳ ׳©׳׳¨׳” ׳›׳§׳•׳‘׳¥.')
    emitSignal('saved', { message: 'Favorite Pack saved.' })
  }

  const handleStartNewSession = () => {
    setSessionStatus('idle')
    setSummaryOpen(false)
    setSession(null)
    setEmotionSelection({ id: null, intensity: 3 })
    setAfterEmotionSelection(null)
    setSelectedMetric(null)
    setHelpOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId('')
    setStatusMessage('')
    handleOpenWizard()
  }

  const handleResetSession = () => {
    const shouldReset = window.confirm('׳׳”׳×׳—׳™׳ ׳¡׳©׳ ׳—׳“׳©? ׳”׳¡׳©׳ ׳”׳ ׳•׳›׳—׳™ ׳™׳™׳׳—׳§ ׳׳”׳׳¡׳.')
    if (!shouldReset) return
    handleStartNewSession()
  }

  useEffect(() => {
    if (wizardOpen) {
      openOverlay({
        id: 'relations-wizard',
        type: 'relations-wizard',
        title: 'הגדרות פתיחה',
        size: 'xl',
        closeOnBackdrop: true,
        content: (
          <RelationsWizardPanel
            wizardStep={wizardStep}
            wizardSettings={wizardSettings}
            setWizardSettings={setWizardSettings}
            wizardScenarioPreview={wizardScenarioPreview}
            onGenerateScenario={handleGenerateScenario}
            onStartSession={handleStartSession}
            onBackToSetup={() => setWizardStep('setup')}
          />
        ),
        onClose: () => setWizardOpen(false),
      })
      return
    }

    if (session && selectedMetric) {
      openOverlay({
        id: `relations-metric-${selectedMetric}`,
        type: 'relations-metric',
        title: 'מדד מפורט',
        size: 'lg',
        closeOnBackdrop: true,
        showHeader: false,
        content: <MetricDetailsPanel metricId={selectedMetric} bars={session.bars} latestTurn={latestTurn} />,
        onClose: () => setSelectedMetric(null),
      })
      return
    }

    if (helpOpen) {
      openOverlay({
        id: 'relations-help',
        type: 'relations-help',
        title: 'עזרה',
        size: 'lg',
        closeOnBackdrop: true,
        showHeader: false,
        content: <RelationsHelpPanel version={RELATIONS_LAB_VERSION} />,
        onClose: () => setHelpOpen(false),
      })
      return
    }

    if (activeOverlay?.id && String(activeOverlay.id).startsWith('relations-')) {
      closeOverlay('relations-state-sync')
    }
  }, [
    activeOverlay?.id,
    closeOverlay,
    helpOpen,
    latestTurn,
    openOverlay,
    selectedMetric,
    session,
    wizardOpen,
    wizardScenarioPreview,
    wizardSettings,
    wizardStep,
  ])

  const currentFinalInsight = session
    ? buildFinalSessionInsight({ scenario: session.scenario, turns: session.turns, bars: session.bars })
    : ''

  const likedTurns = session?.turns.filter((turn) => turn.liked) ?? []
  const archiveCountForCurrentSession = session
    ? archive.filter((item) => item.sessionId === session.id).length
    : 0
  const mainStatusHint = buildCompactSystemHint(session, latestTurn, emotionSelection)

  return (
    <section className="relations-page page-stack">
      {!summaryOpen && (
        <>
          <RelationsHeader
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((current) => !current)}
            onOpenSettings={handleOpenWizard}
            onOpenHelp={() => {
              setSelectedMetric(null)
              setHelpOpen(true)
            }}
            onResetSession={handleResetSession}
            canReset={sessionStatus === 'running' && Boolean(session)}
          />

          {sessionStatus === 'running' && session ? (
            <>
              <MetricsStrip
                bars={session.bars}
                latestTurn={latestTurn}
                onSelectMetric={(metricId) => {
                  setHelpOpen(false)
                  setSelectedMetric(metricId)
                }}
              />

              <div className="relations-v2-core">
                <ElementsPanel
                  session={session}
                  currentEmotion={emotionSelection}
                  afterEmotion={afterEmotionSelection}
                  openEmotionMenuId={openEmotionMenuId}
                  setOpenEmotionMenuId={setOpenEmotionMenuId}
                  onSelectCurrentEmotion={handleSelectCurrentEmotion}
                  onChangeCurrentIntensity={handleChangeCurrentEmotionIntensity}
                  relationStateSummary={relationStateSummary}
                />

                <ActionPanel
                  questionFamilies={questionFamilies}
                  selectedFamilyId={selectedFamilyId}
                  onSelectFamily={setSelectedFamilyId}
                  onAskQuestion={handleAskQuestion}
                  canAskQuestion={canAskQuestion}
                  smartSuggestion={smartSuggestion}
                  onApplySmartSuggestion={handleApplySmartSuggestion}
                  highlightedQuestionId={highlightedQuestionId}
                  statusHint={mainStatusHint}
                />
              </div>

              <BottomAccordions
                session={session}
                latestTurn={latestTurn}
                likedTurns={likedTurns}
                archiveCountForCurrentSession={archiveCountForCurrentSession}
                currentFinalInsight={currentFinalInsight}
                onFinishSession={handleFinishSession}
                onCopyFavoritePack={handleCopyFavoritePack}
                onDownloadFavoritePack={handleDownloadFavoritePack}
                onToggleLikeTurn={handleToggleLikeTurn}
              />
            </>
          ) : (
            <section className="relations-panel relations-v2-idle">
              <h2>׳”׳×׳—׳׳” ׳׳”׳™׳¨׳”</h2>
              <p className="muted-text">׳”׳’׳“׳™׳¨׳• ׳¡׳™׳˜׳•׳׳¦׳™׳” ׳׳—׳×, ׳׳©׳¨׳•, ׳•׳׳– ׳‘׳—׳¨׳• ׳©׳׳׳” ׳׳—׳× ׳‘׳›׳ ׳¡׳‘׳‘.</p>
              <div className="relations-v2-idle__actions">
                <button type="button" onClick={handleOpenWizard}>׳₪׳×׳—/׳™ ׳”׳’׳“׳¨׳•׳×</button>
                <span>׳׳¨׳›׳™׳•׳: {archive.length}</span>
              </div>
            </section>
          )}
        </>
      )}

      {summaryOpen && session && (
        <section className="relations-summary">
          <div className="relations-summary__head">
            <div>
              <p className="relations-home-card__eyebrow">Summary</p>
              <h2>׳¡׳™׳›׳•׳ ׳¡׳©׳ ׳™׳—׳¡׳™׳</h2>
              <p>{currentFinalInsight}</p>
            </div>
            <div className="relations-summary__actions">
              <button type="button" className="secondary-button" onClick={handleCopyFavoritePack}>
                ׳”׳¢׳×׳§ ׳ײ¾Clipboard
              </button>
              <button type="button" onClick={handleDownloadFavoritePack}>
                ׳©׳׳•׳¨
              </button>
              <button type="button" className="relations-finish-button" onClick={handleStartNewSession}>
                ׳”׳×׳—׳ ׳¡׳©׳ ׳—׳“׳©
              </button>
            </div>
          </div>

          <div className="relations-summary-grid">
            <div className="relations-panel">
              <h3>Timeline</h3>
              <div className="relations-timeline">
                {session.turns.length ? (
                  session.turns.map((turn, index) => (
                    <div key={turn.id} className="relations-timeline-item">
                      <div className="relations-timeline-item__title">
                        ׳©׳׳׳” #{index + 1}: {turn.questionText}
                      </div>
                      <div className="relations-timeline-item__meta">
                        {formatTurnDeltaLine(turn)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted-text">׳׳ ׳ ׳©׳׳׳• ׳©׳׳׳•׳× ׳‘׳¡׳©׳ ׳”׳–׳”.</p>
                )}
              </div>
            </div>

            <div className="relations-panel">
              <h3>Favorite Pack</h3>
              {likedTurns.length ? (
                <div className="relations-favorites-list">
                  {likedTurns.map((turn) => (
                    <div key={turn.id} className="relations-favorite-item">
                      <strong>{turn.questionText}</strong>
                      <small>{turn.familyLabelHe}</small>
                      <p>{formatTurnDeltaLine(turn)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-text">׳¢׳“׳™׳™׳ ׳׳ ׳¡׳™׳׳ ׳× "׳׳”׳‘׳×׳™" ׳׳©׳׳׳•׳× ׳‘׳¡׳©׳ ׳”׳–׳”.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="status-line" aria-live="polite">{statusMessage}</div>
    </section>
  )
}

