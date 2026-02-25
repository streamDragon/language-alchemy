import { useEffect, useState } from 'react'
import { getLabConfig } from '../../data/labsConfig'
import { useAppState } from '../../state/appStateContext'
import AlchemyEngine from '../alchemy/AlchemyEngine'
import LabLessonPrompt from '../layout/LabLessonPrompt'
import { buildSentence } from '../../utils/alchemy'
import { makeId } from '../../utils/ids'
import { computeSomaticDelta, hasSomaticSignal } from '../../utils/somatic'
import { emitAlchemySignal } from '../../utils/alchemySignals'

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
  const zoneToggleProps = (id, label) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: () => onToggleZone(id),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onToggleZone(id)
      }
    },
  })

  const zoneShape = (id, label, shapeProps) => {
    const active = selected.has(id)
    const className = `body-zone ${active ? 'is-active' : ''}`
    return (
      <g
        key={`${id}-${label}`}
        className={className}
        {...zoneToggleProps(id, label)}
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
        viewBox="0 0 280 460"
        aria-label="מפת גוף לבחירת אזורי תחושה"
      >
        <g className="body-map__silhouette" aria-hidden="true">
          <circle cx="140" cy="48" r="28" />
          <rect x="120" y="78" width="40" height="46" rx="16" />
          <rect x="93" y="123" width="94" height="132" rx="34" />
          <rect x="100" y="255" width="80" height="70" rx="28" />
          <rect x="86" y="315" width="36" height="76" rx="18" />
          <rect x="158" y="315" width="36" height="76" rx="18" />
          <rect x="86" y="390" width="36" height="34" rx="12" />
          <rect x="158" y="390" width="36" height="34" rx="12" />
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
        <g
          className={`body-zone ${selected.has('hands') ? 'is-active' : ''}`}
          {...zoneToggleProps('hands', labels.hands)}
        >
          <rect x="42" y="214" width="44" height="62" rx="16" />
          <rect x="194" y="214" width="44" height="62" rx="16" />
          <rect x="36" y="268" width="56" height="20" rx="10" />
          <rect x="188" y="268" width="56" height="20" rx="10" />
          <text x="140" y="442" textAnchor="middle">
            {labels.hands}
          </text>
        </g>
        {zoneShape('legs', labels.legs, {
          type: 'rect',
          props: { x: 76, y: 314, width: 128, height: 112 },
          labelX: 140,
          labelY: 374,
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

const FLOW_STEPS = [
  {
    id: 'builder',
    title: '1) Practice Sentence Builder',
    titleHe: 'בניית ניסוח',
    hintHe: 'בוחרים משפט תרגול אחד',
  },
  {
    id: 'timer',
    title: '2) Say It + Timer',
    titleHe: 'אמירה + טיימר',
    hintHe: 'קוראים ומחזיקים קשב לאפקט',
  },
  {
    id: 'somatic',
    title: '3) Somatic Tracker',
    titleHe: 'תחושת גוף',
    hintHe: 'איפה זה מורגש, כמה ואיך',
  },
  {
    id: 'meaning',
    title: '4) Meaning Lens',
    titleHe: 'משמעות',
    hintHe: 'מסר + שינוי ניסוח קטן',
  },
  {
    id: 'protocol',
    title: '5) Attention-Shifting Micro-Protocol',
    titleHe: 'פרוטוקול קשב',
    hintHe: 'מעגלי noticing והרחבה',
  },
  {
    id: 'compare',
    title: '6) Before / After Compare',
    titleHe: 'השוואה',
    hintHe: 'A/B ודלתא',
  },
]

function FlowStage({
  step,
  isActive,
  onActivate,
  summary,
  badgeText,
  badgeTone = 'idle',
  children,
}) {
  return (
    <section className={`flow-stage ${isActive ? 'is-active' : ''}`}>
      <button
        type="button"
        className="flow-stage__toggle"
        aria-expanded={isActive}
        onClick={onActivate}
      >
        <span className="flow-stage__titleWrap">
          <span className="flow-stage__title">{step.title}</span>
          <span className="flow-stage__hint">{step.hintHe}</span>
        </span>
        <span className="flow-stage__meta">
          {summary && <span className="flow-stage__summary">{summary}</span>}
          {badgeText && (
            <span className={`flow-stage__badge flow-stage__badge--${badgeTone}`}>
              {badgeText}
            </span>
          )}
        </span>
      </button>
      {isActive && <div className="flow-stage__body">{children}</div>}
    </section>
  )
}

function StageNextButton({ onClick, label }) {
  return (
    <div className="flow-stage__footer">
      <button type="button" onClick={onClick}>
        {label}
      </button>
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
  const [activeStepId, setActiveStepId] = useState('builder')
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false)
  const [showSomaticGlossary, setShowSomaticGlossary] = useState(false)
  const [showNoticingLibrary, setShowNoticingLibrary] = useState(false)

  const practiceDraft = getDraft(practiceLab.id)
  const practiceSentence = buildSentence(practiceLab, practiceDraft)
  const hasPracticeSentence =
    !!practiceSentence && practiceSentence !== practiceLab.preview?.emptyTextHe

  useEffect(() => {
    setLastVisitedLab('beyond-words')
  }, [setLastVisitedLab])

  useEffect(() => {
    if (!isFocusModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsFocusModalOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocusModalOpen])

  useEffect(() => {
    if (!isTimerRunning) return undefined

    const intervalId = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          setIsTimerRunning(false)
          setTimerCompleted(true)
          setActiveStepId('somatic')
          emitAlchemySignal('success', {
            message: 'הטיימר הסתיים. עוברים למדידת גוף.',
          })
          setStatusMessage('הטיימר הסתיים. עכשיו שימו לב: מה קורה בגוף עכשיו?')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isTimerRunning])

  const promptCount = lab.attentionProtocolPrompts.length
  const totalProtocolSteps = promptCount * 3
  const protocolCycle = Math.floor(protocolStepIndex / promptCount) + 1
  const protocolPrompt =
    lab.attentionProtocolPrompts[
      protocolStepIndex % promptCount
    ]
  const protocolStepsCompleted = Math.min(protocolStepIndex + 1, totalProtocolSteps)
  const protocolCompletedCycles = Math.min(
    Math.floor((protocolStepIndex + 1) / promptCount),
    3,
  )

  const delta = computeSomaticDelta(compare.snapshotA, compare.snapshotB)
  const somaticHasData =
    hasSomaticSignal(somatic) || (somatic.qualityTags?.length ?? 0) > 0
  const meaningHasData =
    Boolean(meaningLens.messageText.trim()) ||
    Boolean(meaningLens.fivePercentShiftText.trim())
  const activeStepIndex = FLOW_STEPS.findIndex((step) => step.id === activeStepId)
  const currentStep = FLOW_STEPS[activeStepIndex] ?? FLOW_STEPS[0]
  const nextStep = FLOW_STEPS[activeStepIndex + 1] ?? null
  const protocolCurrentStep = Math.min(protocolStepIndex + 1, totalProtocolSteps)

  const flowStateByStep = {
    builder: {
      summary: hasPracticeSentence
        ? `${practiceSentence.slice(0, 84)}${practiceSentence.length > 84 ? '…' : ''}`
        : 'עדיין אין ניסוח',
      badgeText: hasPracticeSentence ? 'מוכן' : 'ממתין',
      badgeTone: hasPracticeSentence ? 'ready' : 'idle',
    },
    timer: {
      summary: `${selectedDurationSec}ש | ${
        isTimerRunning ? 'רץ' : timerCompleted ? 'הסתיים' : 'מוכן'
      }`,
      badgeText: timerCompleted ? 'הושלם' : isTimerRunning ? 'פעיל' : 'מוכן',
      badgeTone: timerCompleted ? 'done' : isTimerRunning ? 'active' : 'idle',
    },
    somatic: {
      summary: somaticHasData
        ? `${somatic.selectedZones.length} אזורים | עוצמה ${somatic.intensity}/10 | ולנס ${somatic.valence}`
        : 'עדיין לא נמדד',
      badgeText: somaticHasData ? 'נמדד' : 'ממתין',
      badgeTone: somaticHasData ? 'ready' : 'idle',
    },
    meaning: {
      summary: meaningHasData
        ? `${Number(Boolean(meaningLens.messageText.trim())) + Number(Boolean(meaningLens.fivePercentShiftText.trim()))}/2 שדות מולאו`
        : 'אופציונלי אבל מומלץ',
      badgeText: meaningHasData ? 'נכתב' : 'אופציונלי',
      badgeTone: meaningHasData ? 'ready' : 'idle',
    },
    protocol: {
      summary: `${protocolStepsCompleted}/${totalProtocolSteps} צעדים | ${protocolCompletedCycles}/3 מחזורים`,
      badgeText: protocolStepsCompleted >= totalProtocolSteps ? 'הושלם' : 'בתרגול',
      badgeTone: protocolStepsCompleted >= totalProtocolSteps ? 'done' : 'active',
    },
    compare: {
      summary: `A: ${compare.snapshotA ? 'שמור' : '—'} | B: ${
        compare.snapshotB ? 'שמור' : '—'
      }`,
      badgeText:
        compare.snapshotA && compare.snapshotB ? 'מוכן להשוואה' : 'חלקי',
      badgeTone:
        compare.snapshotA && compare.snapshotB ? 'ready' : 'idle',
    },
  }

  const goToStep = (stepId) => setActiveStepId(stepId)
  const goToNextStep = () => {
    if (nextStep) {
      setActiveStepId(nextStep.id)
    }
  }
  const openFocusPractice = () => {
    if (hasPracticeSentence && activeStepId === 'builder') {
      setActiveStepId('timer')
    }
    setIsFocusModalOpen(true)
  }
  const closeFocusPractice = () => setIsFocusModalOpen(false)

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
    emitAlchemySignal('whoosh', { message: 'הטיימר התחיל. שומרים קשב.' })
    setStatusMessage('קראו את המשפט בקול או בלב. שימו לב למה שקורה בגוף בזמן הקריאה.')
    setActiveStepId('timer')
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
    setActiveStepId('builder')
    setIsFocusModalOpen(false)
    setShowSomaticGlossary(false)
    setShowNoticingLibrary(false)
    emitAlchemySignal('success', { message: 'נפתחה סשן חדשה לתרגול.' })
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
    emitAlchemySignal('saved', { message: `נשמר Snapshot ${label}.` })
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

        <LabLessonPrompt labId={lab.id} />

        <section className="panel-card panel-card--soft beyond-launcher">
          <div className="panel-card__head">
            <h3>1) Practice Sentence Builder</h3>
            <div className="chips-wrap">
              <span className="mini-pill">פוקוס: {currentStep.titleHe}</span>
              <span className="mini-pill">טיימר: {durationLabel}</span>
            </div>
          </div>
          <AlchemyEngine labId={practiceLab.id} compact showCoach={false} />
          <div className="beyond-launcher__footer">
            <div className="beyond-launcher__summary">
              <strong>משפט תרגול:</strong>{' '}
              {hasPracticeSentence ? practiceSentence : 'בנו קודם ניסוח כדי לעבור לתרגול ממוקד.'}
            </div>
            <div className="controls-row">
              <button type="button" onClick={openFocusPractice} disabled={!hasPracticeSentence}>
                פתח/י תרגול ממוקד
              </button>
              <button type="button" onClick={newSession}>
                איפוס סשן
              </button>
            </div>
          </div>
          <div className="status-line" aria-live="polite">
            {statusMessage || 'כשתסיימו לבנות משפט, פתחו מצב פוקוס ועבדו שלב-שלב.'}
          </div>
        </section>

        {isFocusModalOpen && (
          <div
            className="focus-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="beyond-focus-modal-title"
          >
            <button
              type="button"
              className="focus-modal__backdrop"
              aria-label="סגור מצב פוקוס"
              onClick={closeFocusPractice}
            />
            <div className="focus-modal__dialog">
              <div className="focus-modal__header">
                <div className="focus-modal__headerText">
                  <div className="focus-modal__eyebrow">מצב פוקוס</div>
                  <h3 id="beyond-focus-modal-title">{currentStep.titleHe}</h3>
                  <p>{currentStep.hintHe}</p>
                </div>
                <div className="focus-modal__actions">
                  <button type="button" onClick={() => goToStep('builder')}>
                    עריכת משפט
                  </button>
                  <button type="button" onClick={closeFocusPractice}>
                    סגירה
                  </button>
                </div>
              </div>
              <div className="focus-modal__body">
                <div className="beyond-layout beyond-layout--flow">
          <aside className="beyond-rail">
            <div className="flow-rail-card flow-rail-card--focus">
              <div className="flow-rail-card__title">פוקוס נוכחי</div>
              <div className="flow-rail-card__step">{currentStep.titleHe}</div>
              <p className="flow-rail-card__hint">{currentStep.hintHe}</p>
              <div className="flow-rail-card__sentence">
                {hasPracticeSentence ? practiceSentence : practiceLab.preview?.emptyTextHe}
              </div>
              <div className="flow-rail-card__stats">
                <div className="flow-stat">
                  <span>טיימר</span>
                  <strong>{durationLabel}</strong>
                </div>
                <div className="flow-stat">
                  <span>עוצמה</span>
                  <strong>{somatic.intensity}/10</strong>
                </div>
                <div className="flow-stat">
                  <span>ולנס</span>
                  <strong>{somatic.valence}</strong>
                </div>
                <div className="flow-stat">
                  <span>אזורים</span>
                  <strong>{somatic.selectedZones.length}</strong>
                </div>
              </div>
            </div>

            <div className="flow-rail-card">
              <div className="flow-rail-card__title">מסלול התרגול</div>
              <div className="flow-step-list" role="tablist" aria-label="שלבי התרגול">
                {FLOW_STEPS.map((step) => {
                  const stepState = flowStateByStep[step.id]
                  const isActiveStep = activeStepId === step.id

                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      aria-selected={isActiveStep}
                      className={`flow-step-button ${isActiveStep ? 'is-active' : ''}`}
                      onClick={() => goToStep(step.id)}
                    >
                      <span className="flow-step-button__top">
                        <span className="flow-step-button__name">{step.titleHe}</span>
                        <span
                          className={`flow-step-button__badge flow-step-button__badge--${stepState.badgeTone}`}
                        >
                          {stepState.badgeText}
                        </span>
                      </span>
                      <span className="flow-step-button__summary">{stepState.summary}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flow-rail-card">
              <div className="flow-rail-card__title">סטטוס סשן</div>
              <div className="flow-session-grid">
                <div className="mini-pill">A: {compare.snapshotA ? 'שמור' : '—'}</div>
                <div className="mini-pill">B: {compare.snapshotB ? 'שמור' : '—'}</div>
                <div className="mini-pill">
                  פרוטוקול: {protocolStepsCompleted}/{totalProtocolSteps}
                </div>
                <div className="mini-pill">משמעות: {meaningHasData ? 'נכתב' : 'לא עדיין'}</div>
              </div>
              <div className="status-line" aria-live="polite">
                {statusMessage}
              </div>
            </div>
          </aside>

          <div className="beyond-main beyond-main--flow">
            <div className="beyond-focus-strip">
              <div>
                <strong>{currentStep.title}</strong>
                <p>{currentStep.hintHe}</p>
              </div>
              {nextStep && (
                <button type="button" onClick={goToNextStep}>
                  לשלב הבא: {nextStep.titleHe}
                </button>
              )}
            </div>
            <FlowStage
              step={FLOW_STEPS[0]}
              isActive={activeStepId === 'builder'}
              onActivate={() => goToStep('builder')}
              summary={flowStateByStep.builder.summary}
              badgeText={flowStateByStep.builder.badgeText}
              badgeTone={flowStateByStep.builder.badgeTone}
            >
              <section className="panel-card panel-card--soft">
                <AlchemyEngine labId={practiceLab.id} compact showCoach={false} />
                <StageNextButton
                  onClick={() => goToStep('timer')}
                  label="המשך לאמירה + טיימר"
                />
              </section>
            </FlowStage>

            <FlowStage
              step={FLOW_STEPS[1]}
              isActive={activeStepId === 'timer'}
              onActivate={() => goToStep('timer')}
              summary={flowStateByStep.timer.summary}
              badgeText={flowStateByStep.timer.badgeText}
              badgeTone={flowStateByStep.timer.badgeTone}
            >
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
                  <button type="button" onClick={() => goToStep('somatic')}>
                    המשך למדידת גוף
                  </button>
                </div>
              </div>
              </section>
            </FlowStage>

            <FlowStage
              step={FLOW_STEPS[2]}
              isActive={activeStepId === 'somatic'}
              onActivate={() => goToStep('somatic')}
              summary={flowStateByStep.somatic.summary}
              badgeText={flowStateByStep.somatic.badgeText}
              badgeTone={flowStateByStep.somatic.badgeTone}
            >
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

              <div className="inline-toggle-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowSomaticGlossary((prev) => !prev)}
                  aria-expanded={showSomaticGlossary}
                >
                  {showSomaticGlossary ? 'הסתר מילון תחושות לפי אזור' : 'הצג מילון תחושות לפי אזור'}
                </button>
              </div>
              {showSomaticGlossary && (
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
              )}
              <StageNextButton onClick={() => goToStep('meaning')} label="המשך למשמעות" />
              </section>
            </FlowStage>

            <FlowStage
              step={FLOW_STEPS[3]}
              isActive={activeStepId === 'meaning'}
              onActivate={() => goToStep('meaning')}
              summary={flowStateByStep.meaning.summary}
              badgeText={flowStateByStep.meaning.badgeText}
              badgeTone={flowStateByStep.meaning.badgeTone}
            >
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
              <StageNextButton
                onClick={() => goToStep('protocol')}
                label="המשך לפרוטוקול קשב"
              />
              </section>
            </FlowStage>

            <FlowStage
              step={FLOW_STEPS[4]}
              isActive={activeStepId === 'protocol'}
              onActivate={() => goToStep('protocol')}
              summary={flowStateByStep.protocol.summary}
              badgeText={flowStateByStep.protocol.badgeText}
              badgeTone={flowStateByStep.protocol.badgeTone}
            >
              <section className="panel-card">
              <div className="panel-card__head">
                <h3>5) Attention-Shifting Micro-Protocol</h3>
              </div>
              <div className="protocol-card">
                <div className="protocol-card__progress">
                  מחזור {Math.min(protocolCycle, 3)} / 3 | צעד {protocolCurrentStep} / {totalProtocolSteps}
                </div>
                <p className="protocol-card__prompt">{protocolPrompt}</p>
                <div className="controls-row">
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolStepIndex((prev) =>
                        Math.min(prev + 1, totalProtocolSteps - 1),
                      )
                    }
                  >
                    הבא
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolStepIndex((prev) =>
                        Math.min(
                          Math.floor(prev / promptCount) * promptCount + promptCount,
                          totalProtocolSteps - 1,
                        ),
                      )
                    }
                  >
                    סיים מחזור
                  </button>
                  <button type="button" onClick={() => setProtocolStepIndex(0)}>
                    התחל מחדש
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStatusMessage(
                        'בדקו שוב את האפקט של המשפט עכשיו: מה השתנה בעוצמה, באזור או באיכות התחושה?',
                      )
                    }
                  >
                    בדיקת אפקט מחדש
                  </button>
                  <button type="button" onClick={() => goToStep('compare')}>
                    המשך להשוואה
                  </button>
                </div>
                <div className="inline-toggle-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setShowNoticingLibrary((prev) => !prev)}
                    aria-expanded={showNoticingLibrary}
                  >
                    {showNoticingLibrary ? 'הסתר דוגמאות noticing' : 'הצג דוגמאות noticing'}
                  </button>
                </div>
                {showNoticingLibrary && (
                  <div className="noticing-prompts">
                    {lab.noticingPrompts.map((prompt) => (
                      <div key={prompt} className="noticing-prompt">
                        {prompt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </section>
            </FlowStage>

            <FlowStage
              step={FLOW_STEPS[5]}
              isActive={activeStepId === 'compare'}
              onActivate={() => goToStep('compare')}
              summary={flowStateByStep.compare.summary}
              badgeText={flowStateByStep.compare.badgeText}
              badgeTone={flowStateByStep.compare.badgeTone}
            >
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
                <button type="button" onClick={() => goToStep('somatic')}>
                  חזרה לתחושת גוף
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
            </FlowStage>

            <div className="status-line beyond-inline-status" aria-live="polite">
              {statusMessage}
            </div>
          </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
