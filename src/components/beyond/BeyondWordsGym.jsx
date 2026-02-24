import { useEffect, useState } from 'react'
import { getLabConfig } from '../../data/labsConfig'
import { useAppState } from '../../state/appStateContext'
import AlchemyEngine from '../alchemy/AlchemyEngine'
import { buildSentence } from '../../utils/alchemy'
import { makeId } from '../../utils/ids'
import { computeSomaticDelta, hasSomaticSignal } from '../../utils/somatic'

function clone(value) {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value))
  }
}

function createEmptySomatic() {
  return {
    selectedZones: [],
    intensity: 0,
    valence: 0,
    qualityTags: [],
  }
}

function BodyMap({ zones, selectedZoneIds, onToggleZone }) {
  const selected = new Set(selectedZoneIds)

  const zoneShape = (id, label, shapeProps) => {
    const active = selected.has(id)
    const className = `body-zone ${active ? 'is-active' : ''}`
    return (
      <g
        key={`${id}-${label}`}
        className={className}
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => onToggleZone(id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggleZone(id)
          }
        }}
      >
        {shapeProps.type === 'ellipse' ? (
          <ellipse {...shapeProps.props} />
        ) : (
          <rect {...shapeProps.props} rx="10" />
        )}
        <text x={shapeProps.labelX} y={shapeProps.labelY} textAnchor="middle">
          {label}
        </text>
      </g>
    )
  }

  const labels = Object.fromEntries(zones.map((zone) => [zone.id, zone.labelHe]))

  return (
    <div className="body-map-card">
      <div className="body-map-card__header">
        <h3>Somatic Tracker</h3>
        <p>לחצו על אזורים בגוף שבהם מורגשת תגובה.</p>
      </div>
      <svg
        className="body-map"
        viewBox="0 0 280 420"
        aria-label="מפת גוף לבחירת אזורי תחושה"
      >
        <g className="body-map__silhouette" aria-hidden="true">
          <circle cx="140" cy="48" r="28" />
          <rect x="120" y="78" width="40" height="46" rx="16" />
          <rect x="93" y="123" width="94" height="132" rx="34" />
          <rect x="100" y="255" width="80" height="70" rx="28" />
          <rect x="86" y="315" width="36" height="76" rx="18" />
          <rect x="158" y="315" width="36" height="76" rx="18" />
          <rect x="48" y="128" width="34" height="110" rx="14" />
          <rect x="198" y="128" width="34" height="110" rx="14" />
        </g>

        {zoneShape('head', labels.head, {
          type: 'ellipse',
          props: { cx: 140, cy: 48, rx: 30, ry: 26 },
          labelX: 140,
          labelY: 53,
        })}
        {zoneShape('throat', labels.throat, {
          type: 'rect',
          props: { x: 112, y: 84, width: 56, height: 36 },
          labelX: 140,
          labelY: 106,
        })}
        {zoneShape('chest', labels.chest, {
          type: 'rect',
          props: { x: 97, y: 132, width: 86, height: 60 },
          labelX: 140,
          labelY: 168,
        })}
        {zoneShape('belly', labels.belly, {
          type: 'rect',
          props: { x: 97, y: 195, width: 86, height: 58 },
          labelX: 140,
          labelY: 230,
        })}
        {zoneShape('pelvis', labels.pelvis, {
          type: 'rect',
          props: { x: 103, y: 258, width: 74, height: 54 },
          labelX: 140,
          labelY: 291,
        })}
        {zoneShape('hands', labels.hands, {
          type: 'rect',
          props: { x: 42, y: 248, width: 196, height: 42 },
          labelX: 140,
          labelY: 274,
        })}
      </svg>
      <div className="chips-wrap">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            className={`chip ${selected.has(zone.id) ? 'chip--selected' : ''}`}
            onClick={() => onToggleZone(zone.id)}
            aria-pressed={selected.has(zone.id)}
          >
            {zone.labelHe}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BeyondWordsGym() {
  const lab = getLabConfig('beyond-words')
  const practiceLab = getLabConfig(lab.practiceBuilderLabId)
  const { getDraft, upsertHistory, setLastVisitedLab } = useAppState()
  const [statusMessage, setStatusMessage] = useState('')

  const [selectedDurationSec, setSelectedDurationSec] = useState(lab.timerOptionsSec[0])
  const [timeLeftSec, setTimeLeftSec] = useState(lab.timerOptionsSec[0])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerCompleted, setTimerCompleted] = useState(false)

  const [somatic, setSomatic] = useState(createEmptySomatic)
  const [meaningLens, setMeaningLens] = useState({
    messageText: '',
    fivePercentShiftText: '',
  })
  const [protocolStepIndex, setProtocolStepIndex] = useState(0)
  const [compare, setCompare] = useState({
    snapshotA: null,
    snapshotB: null,
  })
  const [sessionId, setSessionId] = useState(() => makeId('bw'))

  const practiceDraft = getDraft(practiceLab.id)
  const practiceSentence = buildSentence(practiceLab, practiceDraft)

  useEffect(() => {
    setLastVisitedLab('beyond-words')
  }, [setLastVisitedLab])

  useEffect(() => {
    if (!isTimerRunning) return undefined

    const intervalId = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          setIsTimerRunning(false)
          setTimerCompleted(true)
          setStatusMessage('הטיימר הסתיים. עכשיו שימו לב: מה קורה בגוף עכשיו?')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isTimerRunning])

  const protocolCycle = Math.floor(protocolStepIndex / lab.attentionProtocolPrompts.length) + 1
  const protocolPrompt =
    lab.attentionProtocolPrompts[
      protocolStepIndex % lab.attentionProtocolPrompts.length
    ]
  const protocolStepsCompleted = Math.min(protocolStepIndex + 1, 9)
  const protocolCompletedCycles = Math.min(
    Math.floor((protocolStepIndex + 1) / 3),
    3,
  )

  const delta = computeSomaticDelta(compare.snapshotA, compare.snapshotB)

  useEffect(() => {
    if (!timerCompleted) return
    if (!practiceSentence || practiceSentence === practiceLab.preview?.emptyTextHe) return
    if (!hasSomaticSignal(somatic) && !meaningLens.messageText && !meaningLens.fivePercentShiftText) {
      return
    }

    const entry = {
      id: sessionId,
      labId: 'beyond-words',
      createdAt: new Date().toISOString(),
      summaryHe: `תרגול מעבר למילים | עוצמה ${somatic.intensity}/10 | ולנס ${somatic.valence}`,
      sentenceText: practiceSentence,
      timerDurationSec: selectedDurationSec,
      completed: true,
      sentenceDraft: clone(practiceDraft),
      somatic: clone(somatic),
      meaningLens: clone(meaningLens),
      attentionProtocol: {
        completedCycles: protocolCompletedCycles,
        stepsCompleted: protocolStepsCompleted,
      },
      compare: {
        snapshotA: compare.snapshotA,
        snapshotB: compare.snapshotB,
        delta,
      },
    }

    upsertHistory(entry)
  }, [
    timerCompleted,
    practiceSentence,
    practiceDraft,
    somatic,
    meaningLens,
    protocolCompletedCycles,
    protocolStepsCompleted,
    compare,
    delta,
    upsertHistory,
    sessionId,
    selectedDurationSec,
    practiceLab.preview,
  ])

  const startTimer = () => {
    setStatusMessage('קראו את המשפט בקול או בלב. שימו לב למה שקורה בגוף בזמן הקריאה.')
    setIsTimerRunning(true)
    setTimerCompleted(false)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimeLeftSec(selectedDurationSec)
    setTimerCompleted(false)
    setStatusMessage('')
  }

  const newSession = () => {
    setIsTimerRunning(false)
    setTimerCompleted(false)
    setTimeLeftSec(selectedDurationSec)
    setSomatic(createEmptySomatic())
    setMeaningLens({ messageText: '', fivePercentShiftText: '' })
    setProtocolStepIndex(0)
    setCompare({ snapshotA: null, snapshotB: null })
    setSessionId(makeId('bw'))
    setStatusMessage('נפתחה סשן חדשה לתרגול.')
  }

  const toggleZone = (zoneId) => {
    setSomatic((prev) => {
      const exists = prev.selectedZones.includes(zoneId)
      return {
        ...prev,
        selectedZones: exists
          ? prev.selectedZones.filter((id) => id !== zoneId)
          : [...prev.selectedZones, zoneId],
      }
    })
  }

  const toggleQualityTag = (tag) => {
    setSomatic((prev) => {
      const exists = prev.qualityTags.includes(tag)
      return {
        ...prev,
        qualityTags: exists
          ? prev.qualityTags.filter((item) => item !== tag)
          : [...prev.qualityTags, tag],
      }
    })
  }

  const captureSnapshot = (label) => {
    const snapshot = {
      label,
      capturedAt: new Date().toISOString(),
      sentenceText: practiceSentence,
      somatic: clone(somatic),
    }

    setCompare((prev) => ({
      ...prev,
      [label === 'A' ? 'snapshotA' : 'snapshotB']: snapshot,
    }))
    setStatusMessage(`נשמר Snapshot ${label}.`)
  }

  const durationLabel = `${String(Math.floor(timeLeftSec / 60)).padStart(2, '0')}:${String(
    timeLeftSec % 60,
  ).padStart(2, '0')}`

  return (
    <div className="page-stack">
      <section className="alchemy-card">
        <div className="alchemy-card__head">
          <div>
            <h2>{lab.titleHe}</h2>
            <p>{lab.descriptionHe}</p>
          </div>
          <div className="alchemy-card__actions">
            <button type="button" onClick={newSession}>
              סשן חדשה
            </button>
          </div>
        </div>

        <p className="muted-text">
          כאן לא רק מנסחים משפטים, אלא מתאמנים ב-Noticing: מה השפה עושה לגוף, לקשב ולבחירה.
        </p>

        <div className="beyond-layout">
          <div className="beyond-main">
            <section className="panel-card panel-card--soft">
              <div className="panel-card__head">
                <h3>1) Practice Sentence Builder</h3>
              </div>
              <AlchemyEngine labId={practiceLab.id} compact showCoach={false} />
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <h3>2) Say It + Timer</h3>
                <div className="chips-wrap">
                  {lab.timerOptionsSec.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`chip ${selectedDurationSec === sec ? 'chip--selected' : ''}`}
                      onClick={() => {
                        setSelectedDurationSec(sec)
                        setTimeLeftSec(sec)
                        setIsTimerRunning(false)
                        setTimerCompleted(false)
                      }}
                    >
                      {sec}ש
                    </button>
                  ))}
                </div>
              </div>

              <div className="timer-panel">
                <div className={`timer-panel__clock ${timerCompleted ? 'is-complete' : ''}`}>
                  {durationLabel}
                </div>
                <p>
                  קרא/י את המשפט בקול או בלב. ואז שים/י לב: מה קורה בגוף עכשיו?
                </p>
                <div className="controls-row">
                  {!isTimerRunning ? (
                    <button type="button" onClick={startTimer}>
                      START {selectedDurationSec}s
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsTimerRunning(false)}>
                      עצור
                    </button>
                  )}
                  <button type="button" onClick={resetTimer}>
                    איפוס טיימר
                  </button>
                </div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <h3>3) Somatic Tracker</h3>
              </div>

              <BodyMap
                zones={lab.bodyZones}
                selectedZoneIds={somatic.selectedZones}
                onToggleZone={toggleZone}
              />

              <div className="somatic-controls">
                <label>
                  <span>עוצמה: {somatic.intensity}/10</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={somatic.intensity}
                    onChange={(event) =>
                      setSomatic((prev) => ({
                        ...prev,
                        intensity: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>
                    ולנס: {somatic.valence} ({somatic.valence < 0 ? 'פחות נעים' : somatic.valence > 0 ? 'נעים יותר' : 'ניטרלי'})
                  </span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    value={somatic.valence}
                    onChange={(event) =>
                      setSomatic((prev) => ({
                        ...prev,
                        valence: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              <div className="chip-bank">
                <h4>איכויות תחושה</h4>
                <div className="chips-wrap">
                  {lab.globalSomaticQualities.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`chip ${somatic.qualityTags.includes(tag) ? 'chip--selected' : ''}`}
                      onClick={() => toggleQualityTag(tag)}
                      aria-pressed={somatic.qualityTags.includes(tag)}
                    >
                      {lab.qualityLabelsHe[tag] ?? tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="triple-grid">
                {Object.entries(lab.somaticQualityByZone).map(([zoneId, qualities]) => (
                  <div key={zoneId} className="mini-card">
                    <h4>{lab.bodyZones.find((zone) => zone.id === zoneId)?.labelHe ?? zoneId}</h4>
                    <ul>
                      {qualities.map((quality) => (
                        <li key={quality}>{quality}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <h3>4) Meaning Lens</h3>
              </div>
              <div className="form-grid">
                <label>
                  <span>{lab.meaningPrompts[0]}</span>
                  <textarea
                    rows={3}
                    value={meaningLens.messageText}
                    onChange={(event) =>
                      setMeaningLens((prev) => ({
                        ...prev,
                        messageText: event.target.value,
                      }))
                    }
                    placeholder="למשל: הגוף מבקש האטה / גבול / בהירות..."
                  />
                </label>
                <label>
                  <span>{lab.meaningPrompts[1]}</span>
                  <textarea
                    rows={3}
                    value={meaningLens.fivePercentShiftText}
                    onChange={(event) =>
                      setMeaningLens((prev) => ({
                        ...prev,
                        fivePercentShiftText: event.target.value,
                      }))
                    }
                    placeholder="למשל: להחליף 'חייב' ב'חשוב' / להוסיף בקשה קונקרטית..."
                  />
                </label>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <h3>5) Attention-Shifting Micro-Protocol</h3>
              </div>
              <div className="protocol-card">
                <div className="protocol-card__progress">
                  מחזור {Math.min(protocolCycle, 3)} / 3 | צעד {Math.min(protocolStepIndex + 1, 9)} / 9
                </div>
                <p className="protocol-card__prompt">{protocolPrompt}</p>
                <div className="controls-row">
                  <button
                    type="button"
                    onClick={() => setProtocolStepIndex((prev) => Math.min(prev + 1, 8))}
                  >
                    הבא
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolStepIndex((prev) => Math.min(Math.floor(prev / 3) * 3 + 3, 8))
                    }
                  >
                    סיים מחזור
                  </button>
                  <button type="button" onClick={() => setProtocolStepIndex(0)}>
                    התחל מחדש
                  </button>
                </div>
                <div className="noticing-prompts">
                  {lab.noticingPrompts.map((prompt) => (
                    <div key={prompt} className="noticing-prompt">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <h3>6) Before / After Compare</h3>
              </div>
              <div className="controls-row">
                <button type="button" onClick={() => captureSnapshot('A')}>
                  שמור כ-A
                </button>
                <button type="button" onClick={() => captureSnapshot('B')}>
                  שמור כ-B
                </button>
              </div>

              <div className="compare-grid">
                {(['A', 'B']).map((label) => {
                  const snap = label === 'A' ? compare.snapshotA : compare.snapshotB
                  return (
                    <div key={label} className="mini-card">
                      <h4>Snapshot {label}</h4>
                      {snap ? (
                        <>
                          <p>{snap.sentenceText}</p>
                          <p>
                            עוצמה {snap.somatic.intensity}/10 | ולנס {snap.somatic.valence}
                          </p>
                          <p>
                            אזורים: {(snap.somatic.selectedZones ?? []).join(', ') || '—'}
                          </p>
                          <p>
                            איכויות: {(snap.somatic.qualityTags ?? []).join(', ') || '—'}
                          </p>
                        </>
                      ) : (
                        <p className="muted-text">טרם נשמר.</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mini-card">
                <h4>Delta (A עד B)</h4>
                {delta ? (
                  <ul>
                    <li>שינוי עוצמה: {delta.intensityDelta > 0 ? '+' : ''}{delta.intensityDelta}</li>
                    <li>שינוי ולנס: {delta.valenceDelta > 0 ? '+' : ''}{delta.valenceDelta}</li>
                    <li>אזורים שנוספו: {delta.zonesAdded.join(', ') || '—'}</li>
                    <li>אזורים שהוסרו: {delta.zonesRemoved.join(', ') || '—'}</li>
                    <li>איכויות שנוספו: {delta.qualityAdded.join(', ') || '—'}</li>
                    <li>איכויות שהוסרו: {delta.qualityRemoved.join(', ') || '—'}</li>
                  </ul>
                ) : (
                  <p className="muted-text">שמרו A ו-B כדי לראות דלתא.</p>
                )}
              </div>
            </section>

            <div className="status-line" aria-live="polite">
              {statusMessage}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
