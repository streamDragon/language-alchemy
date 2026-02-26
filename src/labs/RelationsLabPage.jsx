import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/appStateContext'
import { makeId } from '../utils/ids'
import { emitAlchemySignal } from '../utils/alchemySignals'
import { downloadJson } from '../utils/storage'
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
  return `OpenField ${open.text}, Resources ${resources.text}, Distress ${distress.text}`
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

function MetricBars({ bars }) {
  const items = [
    { key: 'openField', label: 'פתיחות שדה (Open Field)' },
    { key: 'resources', label: 'משאבים זמינים (Resources)' },
    { key: 'distress', label: 'עומס / מצוקה (Distress)' },
  ]

  return (
    <div className="relations-panel relations-metrics-panel">
      <h3>לוח מדדים</h3>
      <div className="relations-metrics-list">
        {items.map((item) => (
          <div key={item.key} className="relations-metric">
            <div className="relations-metric__head">
              <span>{item.label}</span>
              <strong>{bars[item.key]}</strong>
            </div>
            <div className="relations-metric__track" aria-hidden="true">
              <div
                className={`relations-metric__fill relations-metric__fill--${getBarTone(item.key)}`}
                style={{ width: `${bars[item.key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="relations-status-line">{deriveSystemStatus(bars)}</div>
    </div>
  )
}

function EmotionWheel({
  selectedEmotionId,
  selectedIntensity,
  onChangeIntensity,
  onSelectEmotion,
  mode = 'before',
  suggestedEmotionId,
}) {
  return (
    <div className="relations-panel relations-emotion-panel">
      <h3>{mode === 'after' ? 'בחר/י רגש אחרי השאלה' : 'מה המצב הרגשי שהמצב מעורר?'}</h3>
      <p className="muted-text">
        {mode === 'after'
          ? 'בחר/י רגש אחד (ואפשר לעדכן עוצמה) כדי לסגור את הסבב ולהמשיך.'
          : 'בחר/י רגש אחד לפני בחירת השאלה. זה ה"לפני" של הסבב.'}
      </p>

      <div className="relations-emotion-wheel" role="list" aria-label="בחירת רגש">
        <div className="relations-emotion-wheel__center">
          <span>{mode === 'after' ? 'אחרי' : 'לפני'}</span>
          <strong>{selectedIntensity}/5</strong>
        </div>
        {relationsEmotionOptions.map((emotion, index) => {
          const isSelected = emotion.id === selectedEmotionId
          const isSuggested = suggestedEmotionId === emotion.id && !selectedEmotionId
          return (
            <button
              key={emotion.id}
              type="button"
              role="listitem"
              className={`relations-emotion-slice ${isSelected ? 'is-selected' : ''} ${isSuggested ? 'is-suggested' : ''}`}
              style={{ '--slot': index }}
              onClick={() => onSelectEmotion(emotion.id)}
              aria-pressed={isSelected}
            >
              <span className="relations-emotion-slice__icon" aria-hidden="true">{emotion.icon}</span>
              <span className="relations-emotion-slice__label">{emotion.labelHe}</span>
            </button>
          )
        })}
      </div>

      <label className="relations-intensity-control">
        <span>עוצמה</span>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={selectedIntensity}
          onChange={(event) => onChangeIntensity(Number(event.target.value))}
        />
      </label>
    </div>
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
          <h3>שאלות יחסים</h3>
          <p className="muted-text">בוחרים משפחה אחת. מוצגות רק 2–4 שאלות בכל רגע.</p>
        </div>
        <button type="button" className="relations-smart-button" onClick={onApplySmartSuggestion}>
          🪄 הצעה חכמה
        </button>
      </div>

      {smartSuggestion && (
        <div className="relations-smart-callout">
          <span>הצעה כרגע:</span>
          <strong>{smartSuggestion.familyLabelHe}</strong>
          <p>{smartSuggestion.renderedText}</p>
        </div>
      )}

      <div className="relations-question-tabs" role="tablist" aria-label="משפחות שאלות">
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
    { label: 'Open', ...deltaToken(turn.deltas.openField) },
    { label: 'Resources', ...deltaToken(turn.deltas.resources) },
    { label: 'Distress', ...deltaToken(turn.deltas.distress, true) },
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

export default function RelationsLabPage() {
  const navigate = useNavigate()
  const { upsertHistory, setLastVisitedLab } = useAppState()

  const [view, setView] = useState('home')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState('setup')
  const [wizardSettings, setWizardSettings] = useState(createDefaultRelationsWizardSettings)
  const [wizardScenarioPreview, setWizardScenarioPreview] = useState(null)

  const [session, setSession] = useState(null)
  const [selectedFamilyId, setSelectedFamilyId] = useState('between')
  const [emotionPickerMode, setEmotionPickerMode] = useState('before')
  const [emotionSelection, setEmotionSelection] = useState({ id: null, intensity: 3 })
  const [pendingAfterTurnId, setPendingAfterTurnId] = useState(null)
  const [highlightedQuestionId, setHighlightedQuestionId] = useState('')
  const [showFullMonologue, setShowFullMonologue] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [archive, setArchive] = useState(loadRelationsQuestionArchive)

  useEffect(() => {
    setLastVisitedLab('relations')
  }, [setLastVisitedLab])

  useEffect(() => {
    saveRelationsQuestionArchive(archive)
  }, [archive])

  useEffect(() => {
    if (!wizardOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setWizardOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [wizardOpen])

  const questionFamilies = useMemo(
    () => (session?.scenario ? buildRelationsQuestionSetForScenario(session.scenario) : []),
    [session?.scenario],
  )

  const smartSuggestion = useMemo(
    () => (session?.scenario ? suggestSmartQuestion({ scenario: session.scenario, bars: session.bars }) : null),
    [session?.scenario, session?.bars],
  )

  const suggestedEmotion = session?.scenario?.baselineEmotionId ?? null
  const canAskQuestion = Boolean(session && emotionSelection.id && !pendingAfterTurnId)
  const pendingTurn = pendingAfterTurnId
    ? session?.turns.find((turn) => turn.id === pendingAfterTurnId) ?? null
    : null

  const handleOpenWizard = () => {
    setWizardOpen(true)
    setWizardStep('setup')
    setWizardScenarioPreview(null)
    setStatusMessage('')
  }

  const handleGenerateScenario = () => {
    const scenario = createRelationsScenario(wizardSettings)
    setWizardScenarioPreview(scenario)
    setWizardStep('problem')
    setStatusMessage('נוצרה סיטואציה לתרגול. אפשר לעבור על המבנה ולאשר.')
    emitAlchemySignal('success', { message: 'סיטואציה לתרגול נוצרה.' })
  }

  const handleStartSession = () => {
    if (!wizardScenarioPreview) {
      setStatusMessage('קודם צריך להגריל סיטואציה.')
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
    setView('engine')
    setWizardOpen(false)
    setWizardStep('setup')
    setSelectedFamilyId('between')
    setEmotionPickerMode('before')
    setEmotionSelection({
      id: wizardScenarioPreview.baselineEmotionId ?? null,
      intensity: 3,
    })
    setPendingAfterTurnId(null)
    setHighlightedQuestionId('')
    setShowFullMonologue(false)
    setStatusMessage('בחר/י רגש ואז שאלה ראשונה.')
  }

  const handleSelectEmotion = (emotionId) => {
    if (!emotionId) return

    if (!pendingAfterTurnId) {
      setEmotionSelection((current) => ({ ...current, id: emotionId }))
      setEmotionPickerMode('before')
      setStatusMessage('רגש לפני השאלה נבחר. עכשיו בחר/י שאלה.')
      return
    }

    setSession((currentSession) => {
      if (!currentSession) return currentSession
      const turns = currentSession.turns.map((turn) =>
        turn.id === pendingAfterTurnId
          ? {
              ...turn,
              emotionAfter: {
                id: emotionId,
                intensity: emotionSelection.intensity,
                labelHe: getEmotionById(emotionId)?.labelHe ?? emotionId,
              },
            }
          : turn,
      )
      return { ...currentSession, turns }
    })

    setEmotionSelection((current) => ({ ...current, id: emotionId }))
    setPendingAfterTurnId(null)
    setEmotionPickerMode('before')
    setStatusMessage('רגש אחרי נשמר. אפשר לבחור את השאלה הבאה.')
  }

  const handleAskQuestion = (family, question) => {
    if (!session) return
    if (!canAskQuestion) {
      setStatusMessage(pendingAfterTurnId ? 'קודם בחר/י רגש אחרי כדי לסגור את הסבב.' : 'קודם בחר/י רגש.')
      return
    }

    const turnResult = simulateQuestionTurn({
      scenario: session.scenario,
      settings: session.scenario.settings,
      barsBefore: session.bars,
      question,
      familyId: family.id,
      emotionBefore: {
        id: emotionSelection.id,
        intensity: emotionSelection.intensity,
        labelHe: getEmotionById(emotionSelection.id)?.labelHe ?? emotionSelection.id,
      },
      turnIndex: session.turns.length,
    })

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
      emotionBefore: {
        id: emotionSelection.id,
        intensity: emotionSelection.intensity,
        labelHe: getEmotionById(emotionSelection.id)?.labelHe ?? emotionSelection.id,
      },
      emotionAfter: null,
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

    setPendingAfterTurnId(turnId)
    setEmotionPickerMode('after')
    setEmotionSelection((current) => ({ ...current, id: null }))
    setHighlightedQuestionId(question.id)
    setStatusMessage('המערכת עדכנה מדדים. עכשיו בחר/י רגש אחרי השאלה.')

    const gain = turn.deltas.openField + turn.deltas.resources - turn.deltas.distress
    if (gain >= 24) {
      emitAlchemySignal('mastery', { message: 'שאלה חזקה פתחה את השדה.' })
    } else if (gain >= 14) {
      emitAlchemySignal('success', { message: 'נפתחה אופציה חדשה בשדה.' })
    }
  }

  const handleApplySmartSuggestion = () => {
    if (!smartSuggestion) return
    setSelectedFamilyId(smartSuggestion.familyId)
    setHighlightedQuestionId(smartSuggestion.question.id)
    setStatusMessage(`הצעה חכמה: ${smartSuggestion.renderedText}`)
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

    emitAlchemySignal('saved', { message: nextTurnSnapshot.liked ? 'השאלה נשמרה לארכיון.' : 'השאלה הוסרה מהארכיון.' })
  }

  const handleFinishSession = () => {
    if (!session) return
    const nextSession = {
      ...session,
      endedAt: new Date().toISOString(),
    }
    setSession(nextSession)
    setView('summary')

    const finalInsight = buildFinalSessionInsight({
      scenario: nextSession.scenario,
      turns: nextSession.turns,
      bars: nextSession.bars,
    })

    upsertHistory({
      id: nextSession.id,
      labId: 'relations',
      createdAt: nextSession.endedAt,
      summaryHe: `יחסים | ${nextSession.turns.length} שאלות | ${finalInsight}`,
      sentenceText: nextSession.scenario.clientMonologueLines[1] ?? nextSession.scenario.clientMonologueLines[0] ?? 'Relations Session',
    })

    emitAlchemySignal('mastery', { message: 'סשן יחסים הושלם.' })
  }

  const handleCopyFavoritePack = async () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2))
    setStatusMessage(ok ? 'חבילת שאלות אהובות הועתקה ללוח.' : 'לא הצלחתי להעתיק ללוח.')
    emitAlchemySignal(ok ? 'copied' : 'soft-alert', { message: ok ? 'Favorite Pack copied.' : 'Copy failed.' })
  }

  const handleDownloadFavoritePack = () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    downloadJson(`relations-favorite-pack-${session.id}.json`, payload)
    setStatusMessage('חבילת שאלות אהובות נשמרה כקובץ.')
    emitAlchemySignal('saved', { message: 'Favorite Pack saved.' })
  }

  const handleStartNewSession = () => {
    setView('home')
    setSession(null)
    setPendingAfterTurnId(null)
    setEmotionPickerMode('before')
    setEmotionSelection({ id: null, intensity: 3 })
    setHighlightedQuestionId('')
    setStatusMessage('')
    handleOpenWizard()
  }

  const currentFinalInsight = session
    ? buildFinalSessionInsight({ scenario: session.scenario, turns: session.turns, bars: session.bars })
    : ''

  const likedTurns = session?.turns.filter((turn) => turn.liked) ?? []
  const archiveCountForCurrentSession = session
    ? archive.filter((item) => item.sessionId === session.id).length
    : 0

  return (
    <section className="relations-page page-stack">
      <div className="relations-version-banner" role="status">
        <strong>גרסה נוכחית:</strong> {RELATIONS_LAB_VERSION}
      </div>

      {view === 'home' && (
        <section className="relations-home-card">
          <div className="relations-home-card__content">
            <p className="relations-home-card__eyebrow">Relations Lab / שאלות יחסים</p>
            <h1>מעבדת יחסים</h1>
            <p>
              סימולטור תרגול שבו שאלה אחת בכל פעם משנה את ארגון הבעיה במוח ובגוף.
              בוחרים רגש, שואלים שאלת יחסים, ורואים איך המדדים משתנים בזמן אמת.
            </p>
            <div className="relations-home-card__meta">
              <span>Archive: {archive.length} שאלות שמורות</span>
              <button type="button" className="secondary-button" onClick={() => navigate('/library')}>
                ספרייה
              </button>
            </div>
          </div>
          <button type="button" className="relations-start-button" onClick={handleOpenWizard}>
            התחל כאן — בנה סיטואציה לתרגול
          </button>
        </section>
      )}

      {view === 'engine' && session && (
        <>
          <div className="relations-engine-toolbar">
            <div className="relations-engine-toolbar__left">
              <h2>מנוע התרגול</h2>
              <p className="muted-text">
                בכל סבב: בחר/י רגש → שאל/י שאלה → בחר/י רגש אחרי
              </p>
            </div>
            <div className="relations-engine-toolbar__actions">
              <button type="button" className="secondary-button" onClick={handleOpenWizard}>
                טרום-משימה / סטינג
              </button>
              <button type="button" className="relations-finish-button" onClick={handleFinishSession}>
                סיום
              </button>
            </div>
          </div>

          <div className="relations-engine">
            <aside className="relations-engine__left">
              <div className="relations-sticky-stack">
                <MetricBars bars={session.bars} />
                <div className="relations-panel relations-mini-panel">
                  <h4>סשן נוכחי</h4>
                  <ul className="relations-mini-list">
                    <li>שאלות שנשאלו: <strong>{session.turns.length}</strong></li>
                    <li>אהבתי: <strong>{likedTurns.length}</strong></li>
                    <li>נשמרו בארכיון: <strong>{archiveCountForCurrentSession}</strong></li>
                  </ul>
                  <div className="relations-mini-list__hint">
                    {pendingAfterTurn
                      ? 'ממתין לבחירת רגש אחרי'
                      : 'מוכן לשאלה הבאה'}
                  </div>
                </div>
              </div>
            </aside>

            <section className="relations-engine__center">
              <div className="relations-panel relations-problem-panel">
                <div className="relations-problem-panel__head">
                  <div>
                    <h3>המציאות הנוכחית</h3>
                    <p className="muted-text">המונולוג המקוצר + מבנה הבעיה (F / G / 1 / 2 / R)</p>
                  </div>
                  <button
                    type="button"
                    className="relations-link-button"
                    onClick={() => setShowFullMonologue((current) => !current)}
                  >
                    {showFullMonologue ? 'הצג פחות' : 'הצג מלא'}
                  </button>
                </div>

                <div className="relations-monologue-preview">
                  {(showFullMonologue
                    ? session.scenario.clientMonologueLines
                    : session.scenario.clientMonologueLines.slice(0, 3)
                  ).map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>

                <div className="relations-structure-grid">
                  <div className="relations-structure-item">
                    <span>שדה (F)</span>
                    <strong>{session.scenario.contextF}</strong>
                  </div>
                  <div className="relations-structure-item">
                    <span>מטרה (G)</span>
                    <strong>{session.scenario.goalG}</strong>
                  </div>
                  <div className="relations-structure-item">
                    <span>אלמנט 1</span>
                    <strong>{session.scenario.element1}</strong>
                  </div>
                  <div className="relations-structure-item">
                    <span>אלמנט 2</span>
                    <strong>{session.scenario.element2}</strong>
                  </div>
                  <div className="relations-structure-item relations-structure-item--full">
                    <span>יחס נוכחי (R₀)</span>
                    <strong>{session.scenario.initialRelationR0.shortHe}</strong>
                  </div>
                </div>

                {session.scenario.alternativeFields.length > 0 && (
                  <div className="relations-alt-fields">
                    {session.scenario.alternativeFields.map((field) => (
                      <span key={field} className="relations-chip">{field}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="relations-panel relations-stream-panel">
                <div className="relations-stream-panel__head">
                  <h3>שיחה אחרונה / סטרים</h3>
                  <p className="muted-text">
                    מוצג רצף השאלה → תשובת המטופל → שורת היועץ
                  </p>
                </div>

                {!session.turns.length && (
                  <div className="relations-empty-state">
                    בחר/י רגש ותקוף/תקפי את המבנה עם שאלה אחת. זה כל מה שצריך כרגע.
                  </div>
                )}

                <div className="relations-turn-list">
                  {session.turns.slice().reverse().map((turn, reverseIndex) => (
                    <article
                      key={turn.id}
                      className={`relations-turn-card ${reverseIndex === 0 ? 'is-latest' : ''}`}
                    >
                      <div className="relations-turn-card__head">
                        <div>
                          <small>{turn.familyLabelHe}</small>
                          <h4>אתה/את שואל/ת: {turn.questionText}</h4>
                        </div>
                        <button
                          type="button"
                          className={`relations-like-button ${turn.liked ? 'is-liked' : ''}`}
                          onClick={() => handleToggleLikeTurn(turn.id)}
                          aria-pressed={turn.liked}
                          title="אהבתי את השאלה"
                        >
                          ❤ אהבתי
                        </button>
                      </div>

                      <TurnDeltaBadges turn={turn} />

                      <div className="relations-turn-card__body">
                        <div className="relations-stream-line">
                          <strong>המטופל עונה:</strong>
                          <pre>{turn.clientAnswerText}</pre>
                        </div>
                        <div className="relations-stream-line">
                          <strong>יועץ אומר:</strong>
                          <p>{turn.coachInsightText}</p>
                        </div>
                      </div>

                      <div className="relations-turn-card__foot">
                        <span>לפני: {turn.emotionBefore?.labelHe ?? '—'} ({turn.emotionBefore?.intensity ?? '—'}/5)</span>
                        <span>אחרי: {turn.emotionAfter?.labelHe ?? 'ממתין לבחירה'} {turn.emotionAfter ? `(${turn.emotionAfter.intensity}/5)` : ''}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="relations-engine__right">
              <div className="relations-action-stack">
                <EmotionWheel
                  mode={pendingAfterTurnId ? 'after' : 'before'}
                  selectedEmotionId={emotionSelection.id}
                  selectedIntensity={emotionSelection.intensity}
                  suggestedEmotionId={suggestedEmotion}
                  onChangeIntensity={(value) =>
                    setEmotionSelection((current) => ({ ...current, intensity: value }))
                  }
                  onSelectEmotion={handleSelectEmotion}
                />

                <QuestionPanel
                  familyId={selectedFamilyId}
                  onSelectFamily={setSelectedFamilyId}
                  questionFamilies={questionFamilies}
                  onAskQuestion={handleAskQuestion}
                  disabled={!canAskQuestion}
                  smartSuggestion={smartSuggestion}
                  onApplySmartSuggestion={handleApplySmartSuggestion}
                  highlightedQuestionId={highlightedQuestionId}
                />
              </div>
            </aside>
          </div>
        </>
      )}

      {view === 'summary' && session && (
        <section className="relations-summary">
          <div className="relations-summary__head">
            <div>
              <p className="relations-home-card__eyebrow">Summary</p>
              <h2>סיכום סשן יחסים</h2>
              <p>{currentFinalInsight}</p>
            </div>
            <div className="relations-summary__actions">
              <button type="button" className="secondary-button" onClick={handleCopyFavoritePack}>
                העתק ל־Clipboard
              </button>
              <button type="button" onClick={handleDownloadFavoritePack}>
                שמור
              </button>
              <button type="button" className="relations-finish-button" onClick={handleStartNewSession}>
                התחל סשן חדש
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
                        שאלה #{index + 1}: {turn.questionText}
                      </div>
                      <div className="relations-timeline-item__meta">
                        {formatTurnDeltaLine(turn)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted-text">לא נשאלו שאלות בסשן הזה.</p>
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
                <p className="muted-text">עדיין לא סימנת "אהבתי" לשאלות בסשן הזה.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="status-line" aria-live="polite">{statusMessage}</div>

      {wizardOpen && (
        <div className="relations-wizard-backdrop" onClick={() => setWizardOpen(false)} role="presentation">
          <section
            className="relations-wizard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relations-wizard-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="relations-wizard-close" onClick={() => setWizardOpen(false)} aria-label="סגור">
              ✕
            </button>

            {wizardStep === 'setup' && (
              <>
                <div className="relations-wizard-head">
                  <p className="relations-home-card__eyebrow">מסך 1 / Wizard</p>
                  <h2 id="relations-wizard-title">בנה סיטואציה לתרגול</h2>
                  <p>בחר/י כמה פרמטרים פשוטים. הם יקבעו איזה בעיה תיווצר ואיך המטופל יגיב.</p>
                </div>

                <div className="relations-wizard-grid">
                  <label className="relations-field">
                    <span>תחום / הקשר (Field / Context)</span>
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
                    <span>סוג בעיה (Problem Archetype)</span>
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
                    <span>אופי המטופל (Client Style)</span>
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
                  <button type="button" onClick={handleGenerateScenario}>הגרל סיטואציה</button>
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
                    <div><span>שדה:</span> <strong>{wizardScenarioPreview.contextF}</strong></div>
                    <div><span>מטרה:</span> <strong>{wizardScenarioPreview.goalG}</strong></div>
                    <div><span>אלמנט 1:</span> <strong>{wizardScenarioPreview.element1}</strong></div>
                    <div><span>אלמנט 2:</span> <strong>{wizardScenarioPreview.element2}</strong></div>
                    <div><span>יחס נוכחי (R₀):</span> <strong>{wizardScenarioPreview.initialRelationR0.shortHe}</strong></div>
                  </div>
                </div>

                <div className="relations-wizard-actions">
                  <button type="button" className="secondary-button" onClick={() => setWizardStep('setup')}>
                    חזרה להגדרות
                  </button>
                  <button type="button" onClick={handleGenerateScenario}>
                    הגרל מחדש
                  </button>
                  <button type="button" className="relations-finish-button" onClick={handleStartSession}>
                    אשר וצא לדרך
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
