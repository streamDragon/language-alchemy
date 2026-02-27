import { useEffect, useMemo, useRef, useState } from 'react'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'
import {
  buildDefaultBridgeSentence,
  buildDefaultMicroAction,
  createPerspectiveSession,
  getDefaultBridgeQuestions,
  loadPerspectiveSessions,
  normalizeBridgeQuestions,
  normalizePosition,
  perspectiveRelationLabels,
  perspectiveStatementTags,
  savePerspectiveSessions,
  suggestPerspectiveRelation,
  upsertPerspectiveSession,
} from '../data/perspectiveLabData'

const STEPS = [
  { id: 'texts', title: 'טקסטים' },
  { id: 'map', title: 'מפה' },
  { id: 'bridge', title: 'גשר' },
]

const MAX_TEXT_LENGTH = 1200

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function toSnippet(text, max = 82) {
  const safe = String(text ?? '').trim()
  if (!safe) return 'ללא טקסט'
  return safe.length > max ? `${safe.slice(0, max)}…` : safe
}

function StatementInputCard({
  title,
  value,
  onChange,
  placeholder,
  historySessions = [],
  historySelection = '',
  onHistorySelectionChange,
  onLoadFromHistory,
}) {
  return (
    <article className="panel-card perspective-input-card">
      <div className="panel-card__head">
        <h3>{title}</h3>
        <small>{value.length}/{MAX_TEXT_LENGTH}</small>
      </div>

      {historySessions.length > 0 && onLoadFromHistory ? (
        <div className="perspective-input-card__history-loader">
          <select
            value={historySelection}
            aria-label="בחירת טקסט קודם מהיסטוריה"
            onChange={(event) => onHistorySelectionChange(event.target.value)}
          >
            <option value="">טען מהיסטוריה (אופציונלי)</option>
            {historySessions.map((item) => (
              <option key={item.id} value={item.id}>
                {formatDateTime(item.updatedAt)} · {toSnippet(item.nowText || item.beforeText, 48)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="secondary-button"
            onClick={onLoadFromHistory}
            disabled={!historySelection}
            aria-label="טען טקסט קודם מהיסטוריה"
          >
            טען
          </button>
        </div>
      ) : null}

      <textarea
        rows={6}
        value={value}
        placeholder={placeholder}
        maxLength={MAX_TEXT_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        aria-label={title}
      />
    </article>
  )
}

function TagSelectorChips({ title, selectedTags, onToggleTag }) {
  return (
    <section className="panel-card panel-card--soft perspective-tag-panel">
      <div className="panel-card__head">
        <h3>{title}</h3>
        <small>בחר/י 1-2</small>
      </div>
      <div className="chips-wrap" role="list" aria-label={title}>
        {perspectiveStatementTags.map((tag) => {
          const selected = selectedTags.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              role="listitem"
              className={`chip ${selected ? 'chip--selected' : ''}`}
              onClick={() => onToggleTag(tag.id)}
              aria-pressed={selected}
              aria-label={`${tag.labelHe} (${tag.labelEn})`}
            >
              {tag.labelHe}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RelationEdge({ from, to, label }) {
  const startX = clamp(from?.xPct ?? 50)
  const startY = clamp(from?.yPct ?? 50)
  const endX = clamp(to?.xPct ?? 50)
  const endY = clamp(to?.yPct ?? 50)
  const controlX = (startX + endX) / 2
  const controlY = Math.max(3, Math.min(97, (startY + endY) / 2 - (Math.abs(endX - startX) * 0.16)))
  const labelLeft = clamp((startX + endX) / 2)
  const labelTop = clamp((startY + endY) / 2 - 8, 4, 92)

  return (
    <>
      <svg className="perspective-map__edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
          pathLength="1"
        />
      </svg>
      <div className="perspective-map__edge-label" style={{ left: `${labelLeft}%`, top: `${labelTop}%` }}>
        {label}
      </div>
    </>
  )
}

function DraggableNode({ nodeId, label, position, isDragging, onPointerDown }) {
  return (
    <button
      type="button"
      className={`perspective-node perspective-node--${nodeId} ${isDragging ? 'is-dragging' : ''}`}
      style={{ left: `${position.xPct}%`, top: `${position.yPct}%` }}
      onPointerDown={(event) => onPointerDown(nodeId, event)}
      aria-label={`גרור נקודת ${label}`}
    >
      <span>{label}</span>
    </button>
  )
}

function MapCanvas2D({ posBefore, posNow, relationLabel, onUpdatePosition }) {
  const mapRef = useRef(null)
  const dragRef = useRef({
    nodeId: '',
    pointerId: null,
    pending: null,
    rafId: 0,
  })
  const [draggingNodeId, setDraggingNodeId] = useState('')

  useEffect(() => () => {
    const activeRaf = dragRef.current.rafId
    if (activeRaf) {
      cancelAnimationFrame(activeRaf)
    }
  }, [])

  const mapPointFromEvent = (event) => {
    const element = mapRef.current
    if (!element) return null
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      xPct: clamp(((event.clientX - rect.left) / rect.width) * 100),
      yPct: clamp(((event.clientY - rect.top) / rect.height) * 100),
    }
  }

  const commitPendingMove = () => {
    const pending = dragRef.current.pending
    if (!pending) return
    onUpdatePosition(pending.nodeId, pending.point)
    dragRef.current.pending = null
    dragRef.current.rafId = 0
  }

  const queueNodeMove = (nodeId, point) => {
    dragRef.current.pending = { nodeId, point }
    if (dragRef.current.rafId) return
    dragRef.current.rafId = requestAnimationFrame(commitPendingMove)
  }

  const handlePointerDown = (nodeId, event) => {
    event.preventDefault()
    dragRef.current.nodeId = nodeId
    dragRef.current.pointerId = event.pointerId
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingNodeId(nodeId)
  }

  const handlePointerMove = (event) => {
    const { nodeId, pointerId } = dragRef.current
    if (!nodeId || pointerId !== event.pointerId) return
    const point = mapPointFromEvent(event)
    if (!point) return
    queueNodeMove(nodeId, point)
  }

  const stopDrag = (event) => {
    if (dragRef.current.pointerId !== event.pointerId) return
    const point = mapPointFromEvent(event)
    if (point && dragRef.current.nodeId) {
      onUpdatePosition(dragRef.current.nodeId, point)
    }
    dragRef.current.nodeId = ''
    dragRef.current.pointerId = null
    dragRef.current.pending = null
    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId)
      dragRef.current.rafId = 0
    }
    setDraggingNodeId('')
  }

  return (
    <section className="panel-card perspective-map-panel">
      <div className="panel-card__head">
        <div>
          <h3>מפת עכשיו/קודם</h3>
          <p className="muted-text">גרור/י את שתי הנקודות על הצירים.</p>
        </div>
      </div>

      <div
        ref={mapRef}
        className="perspective-map"
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className="perspective-map__x-axis" aria-hidden="true" />
        <div className="perspective-map__y-axis" aria-hidden="true" />
        <div className="perspective-map__x-label perspective-map__x-label--left">ספציפי</div>
        <div className="perspective-map__x-label perspective-map__x-label--right">כללי</div>
        <div className="perspective-map__y-label perspective-map__y-label--top">משמעות/מי אני</div>
        <div className="perspective-map__y-label perspective-map__y-label--bottom">פעולה/מה עושים</div>

        <RelationEdge from={posBefore} to={posNow} label={relationLabel} />

        <DraggableNode
          nodeId="before"
          label="קודם"
          position={posBefore}
          isDragging={draggingNodeId === 'before'}
          onPointerDown={handlePointerDown}
        />
        <DraggableNode
          nodeId="now"
          label="עכשיו"
          position={posNow}
          isDragging={draggingNodeId === 'now'}
          onPointerDown={handlePointerDown}
        />
      </div>
    </section>
  )
}

function BridgeBuilder({
  relationLabel,
  bridgeQuestions,
  bridgeSentence,
  microAction,
  onUpdateQuestion,
  onUpdateBridgeSentence,
  onUpdateMicroAction,
  onResetDefaults,
}) {
  return (
    <section className="panel-card perspective-bridge-builder">
      <div className="panel-card__head">
        <div>
          <h3>בניית גשר</h3>
          <p className="muted-text">מבוסס על היחס: {relationLabel}</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onResetDefaults}
          aria-label="איפוס שאלות ברירת מחדל"
        >
          איפוס ברירת מחדל
        </button>
      </div>

      <div className="perspective-bridge-builder__questions">
        {bridgeQuestions.map((question, index) => (
          <label key={`bridge-question-${index}`} className="perspective-field">
            <span>שאלת גשר {index + 1}</span>
            <input
              type="text"
              value={question}
              onChange={(event) => onUpdateQuestion(index, event.target.value)}
              aria-label={`שאלת גשר ${index + 1}`}
            />
          </label>
        ))}
      </div>

      <label className="perspective-field">
        <span>משפט גשר</span>
        <textarea
          rows={3}
          value={bridgeSentence}
          onChange={(event) => onUpdateBridgeSentence(event.target.value)}
          aria-label="משפט גשר"
        />
      </label>

      <label className="perspective-field">
        <span>מיקרו-פעולה (24 שעות)</span>
        <textarea
          rows={3}
          value={microAction}
          onChange={(event) => onUpdateMicroAction(event.target.value)}
          aria-label="מיקרו-פעולה ב-24 שעות"
        />
      </label>
    </section>
  )
}

function SessionHistoryPanel({ sessions, onOpenSession }) {
  return (
    <section className="panel-card panel-card--soft perspective-history">
      <div className="panel-card__head">
        <h3>היסטוריה</h3>
        <small>{sessions.length} סשנים</small>
      </div>
      {sessions.length ? (
        <div className="perspective-history__list">
          {sessions.map((item) => (
            <article key={item.id} className="perspective-history__item">
              <div className="perspective-history__item-head">
                <strong>{formatDateTime(item.updatedAt)}</strong>
                <button
                  type="button"
                  onClick={() => onOpenSession(item.id)}
                  aria-label="פתח סשן מההיסטוריה"
                >
                  פתח
                </button>
              </div>
              <p><b>קודם:</b> {toSnippet(item.beforeText, 62)}</p>
              <p><b>עכשיו:</b> {toSnippet(item.nowText, 62)}</p>
              <small>יחס: {item.relationLabel || '-'}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-text">עדיין אין סשנים שמורים.</p>
      )}
    </section>
  )
}

export default function PerspectiveLabPage() {
  const lab = getLabConfig('perspectives')
  const { upsertHistory } = useAppState()
  const [stepIndex, setStepIndex] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historySelectionId, setHistorySelectionId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [relationTouched, setRelationTouched] = useState(() => Boolean(loadPerspectiveSessions()[0]?.relationLabel))

  const [savedSessions, setSavedSessions] = useState(() => loadPerspectiveSessions())
  const [session, setSession] = useState(() => {
    const first = loadPerspectiveSessions()[0]
    return first ? createPerspectiveSession(first) : createPerspectiveSession()
  })

  const suggestedRelationLabel = suggestPerspectiveRelation(session)
  const activeRelationLabel = relationTouched
    ? (session.relationLabel || suggestedRelationLabel)
    : suggestedRelationLabel
  const bridgeQuestionsValue = normalizeBridgeQuestions(
    session.bridgeQuestions.length
      ? session.bridgeQuestions
      : getDefaultBridgeQuestions(activeRelationLabel),
  )
  const bridgeSentenceValue = session.bridgeSentence || buildDefaultBridgeSentence(session.beforeText, session.nowText)
  const microActionValue = session.microAction || buildDefaultMicroAction()

  const updateSession = (updater) => {
    setSession((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }

  const setSessionFromHistory = (sessionId) => {
    const selected = savedSessions.find((item) => item.id === sessionId)
    if (!selected) return
    setSession(createPerspectiveSession(selected))
    setStepIndex(0)
    setHistoryOpen(false)
    setRelationTouched(true)
    setStatusMessage('הסשן נטען מההיסטוריה.')
  }

  const saveCurrentSession = () => {
    const completedSession = createPerspectiveSession({
      ...session,
      relationLabel: activeRelationLabel,
      bridgeQuestions: bridgeQuestionsValue,
      bridgeSentence: bridgeSentenceValue,
      microAction: microActionValue,
    })

    setSession(completedSession)
    setSavedSessions((current) => {
      const next = upsertPerspectiveSession(current, completedSession)
      savePerspectiveSessions(next)
      return next
    })

    upsertHistory({
      id: completedSession.id,
      labId: 'perspectives',
      createdAt: completedSession.updatedAt,
      summaryHe: `פרספקטיבות | ${completedSession.relationLabel}`,
      sentenceText: completedSession.bridgeSentence || completedSession.nowText || completedSession.beforeText,
    })

    setStatusMessage('הסשן נשמר בהצלחה.')
  }

  const startNewSession = () => {
    setSession(createPerspectiveSession())
    setStepIndex(0)
    setHistorySelectionId('')
    setRelationTouched(false)
    setStatusMessage('נפתח סשן חדש.')
  }

  const handleSwap = () => {
    updateSession((current) => ({
      ...current,
      beforeText: current.nowText,
      nowText: current.beforeText,
      tagsBefore: [...current.tagsNow],
      tagsNow: [...current.tagsBefore],
      posBefore: { ...current.posNow },
      posNow: { ...current.posBefore },
    }))
  }

  const toggleTag = (side, tagId) => {
    updateSession((current) => {
      const key = side === 'before' ? 'tagsBefore' : 'tagsNow'
      const selected = current[key]
      const exists = selected.includes(tagId)
      let nextSelected = selected
      if (exists) {
        nextSelected = selected.filter((item) => item !== tagId)
      } else if (selected.length >= 2) {
        nextSelected = [selected[1], tagId]
      } else {
        nextSelected = [...selected, tagId]
      }
      return { ...current, [key]: nextSelected }
    })
  }

  const updateMapPosition = (nodeId, point) => {
    updateSession((current) => ({
      ...current,
      [nodeId === 'before' ? 'posBefore' : 'posNow']: normalizePosition(point),
    }))
  }

  const updateBridgeQuestion = (index, value) => {
    updateSession((current) => {
      const nextQuestions = [...bridgeQuestionsValue]
      nextQuestions[index] = value
      return { ...current, bridgeQuestions: nextQuestions }
    })
  }

  const historySessionsForLoader = useMemo(
    () => savedSessions.filter((item) => item.id !== session.id).slice(0, 20),
    [savedSessions, session.id],
  )

  const isStepOneComplete = Boolean(session.beforeText.trim() || session.nowText.trim())
  const isStepTwoComplete = Boolean(session.tagsBefore.length && session.tagsNow.length)

  return (
    <section className="page-stack">
      <section className="alchemy-card perspective-lab">
        <div className="alchemy-card__head perspective-lab__head">
          <div>
            <h2>{lab?.titleHe ?? 'מעבדת הפרספקטיבות'}</h2>
            <p>{lab?.descriptionHe ?? 'השוואה מרחבית בין מה שנאמר קודם למה שנאמר עכשיו.'}</p>
          </div>
          <div className="alchemy-card__actions">
            <button type="button" onClick={saveCurrentSession} aria-label="שמור סשן">
              שמור
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={startNewSession}
              aria-label="פתח סשן חדש"
            >
              סשן חדש
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setHistoryOpen((current) => !current)}
              aria-label="פתח היסטוריה"
            >
              פתח היסטוריה
            </button>
          </div>
        </div>

        <div className="template-switcher" role="tablist" aria-label="שלבי מעבדת הפרספקטיבות">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              role="tab"
              className={`template-pill ${index === stepIndex ? 'is-active' : ''}`}
              aria-selected={index === stepIndex}
              onClick={() => setStepIndex(index)}
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </div>

        {historyOpen ? (
          <SessionHistoryPanel sessions={savedSessions} onOpenSession={setSessionFromHistory} />
        ) : null}

        {stepIndex === 0 && (
          <section className="perspective-step perspective-step--texts">
            <div className="perspective-step__actions">
              <button type="button" className="secondary-button" onClick={handleSwap} aria-label="החלף בין הטקסטים">
                החלף
              </button>
            </div>
            <div className="perspective-grid perspective-grid--two">
              <StatementInputCard
                title="מה אמרתי קודם"
                value={session.beforeText}
                onChange={(text) => updateSession((current) => ({ ...current, beforeText: text }))}
                placeholder="כתוב/כתבי כאן את המשפט הקודם"
                historySessions={historySessionsForLoader}
                historySelection={historySelectionId}
                onHistorySelectionChange={setHistorySelectionId}
                onLoadFromHistory={() => {
                  const selected = savedSessions.find((item) => item.id === historySelectionId)
                  if (!selected) return
                  updateSession((current) => ({
                    ...current,
                    beforeText: selected.nowText || selected.beforeText,
                  }))
                  setStatusMessage('הטקסט הקודם נטען מהיסטוריה.')
                }}
              />
              <StatementInputCard
                title="מה אמרתי עכשיו"
                value={session.nowText}
                onChange={(text) => updateSession((current) => ({ ...current, nowText: text }))}
                placeholder="כתוב/כתבי כאן את המשפט הנוכחי"
              />
            </div>
          </section>
        )}

        {stepIndex === 1 && (
          <section className="perspective-step perspective-step--map">
            <div className="perspective-grid perspective-grid--two">
              <div className="perspective-grid perspective-grid--stack">
                <TagSelectorChips
                  title="תגיות למשפט קודם"
                  selectedTags={session.tagsBefore}
                  onToggleTag={(tagId) => toggleTag('before', tagId)}
                />
                <TagSelectorChips
                  title="תגיות למשפט עכשיו"
                  selectedTags={session.tagsNow}
                  onToggleTag={(tagId) => toggleTag('now', tagId)}
                />
                <section className="panel-card panel-card--soft perspective-relation-picker">
                  <label className="perspective-field">
                    <span>תיוג היחס</span>
                    <select
                      value={activeRelationLabel}
                      onChange={(event) => {
                        setRelationTouched(true)
                        updateSession((current) => ({
                          ...current,
                          relationLabel: event.target.value,
                        }))
                      }}
                      aria-label="בחירת סוג היחס"
                    >
                      {perspectiveRelationLabels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value} ({option.labelEn})
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted-text">
                    זיהוי אוטומטי: <strong>{suggestedRelationLabel}</strong>
                  </p>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!relationTouched}
                    onClick={() => setRelationTouched(false)}
                    aria-label="חזור לזיהוי אוטומטי"
                  >
                    השתמש בזיהוי אוטומטי
                  </button>
                </section>
              </div>

              <MapCanvas2D
                posBefore={session.posBefore}
                posNow={session.posNow}
                relationLabel={activeRelationLabel}
                onUpdatePosition={updateMapPosition}
              />
            </div>
          </section>
        )}

        {stepIndex === 2 && (
          <section className="perspective-step perspective-step--bridge">
            <BridgeBuilder
              relationLabel={activeRelationLabel}
              bridgeQuestions={bridgeQuestionsValue}
              bridgeSentence={bridgeSentenceValue}
              microAction={microActionValue}
              onUpdateQuestion={updateBridgeQuestion}
              onUpdateBridgeSentence={(value) =>
                updateSession((current) => ({ ...current, bridgeSentence: value }))
              }
              onUpdateMicroAction={(value) =>
                updateSession((current) => ({ ...current, microAction: value }))
              }
              onResetDefaults={() => {
                updateSession((current) => ({
                  ...current,
                  bridgeQuestions: getDefaultBridgeQuestions(activeRelationLabel),
                  bridgeSentence: buildDefaultBridgeSentence(current.beforeText, current.nowText),
                  microAction: buildDefaultMicroAction(),
                }))
              }}
            />
          </section>
        )}

        <div className="perspective-nav">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
            aria-label="חזרה לשלב קודם"
          >
            חזרה
          </button>
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.min(STEPS.length - 1, current + 1))}
            disabled={(stepIndex === 0 && !isStepOneComplete) || (stepIndex === 1 && !isStepTwoComplete)}
            aria-label="הבא"
          >
            הבא
          </button>
        </div>

        <div className="status-line" aria-live="polite">
          {statusMessage}
        </div>
      </section>
    </section>
  )
}
