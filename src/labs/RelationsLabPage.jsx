import { useEffect, useState } from 'react'
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
  return `פתיחות שדה ${open.text}, משאבים ${resources.text}, עומס/מצוקה ${distress.text}`
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
  if (type === 'loop') return 'לולאה'
  if (type === 'cause') return 'אחד מפעיל את השני'
  if (type === 'conflict') return 'התנגשות'
  if (type === 'identity') return 'זהות שמפעילה תגובה'
  return 'קשר פעיל'
}

function relationStateLabelFromStage(stage) {
  if (stage <= 0) return 'הקשר כרגע סגור ונוקשה'
  if (stage === 1) return 'לולאה שמתחילה להתרכך'
  if (stage === 2) return 'יש יותר מרווח והשפעה הדדית'
  return 'הקשר פתוח יותר ואפשר לעבוד איתו'
}

function describeCurrentRelationState(session) {
  if (!session?.turns?.length) {
    return relationTypeLabel(session?.scenario?.initialRelationR0?.type)
  }
  const latestTurn = session.turns.at(-1)
  const nextStage = latestTurn?.relationShift?.next ?? 0
  return relationStateLabelFromStage(nextStage)
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
              <span>עוצמה (אופציונלי)</span>
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
      <h3>מצב רגשי</h3>
      <p className="muted-text">הרגש אחרי השאלה מתעדכן אוטומטית. אפשר לדייק ידנית דרך ה-pill.</p>

      <div className="relations-emotion-pills">
        <EmotionPickerPill
          title="רגש נוכחי"
          selection={currentEmotion}
          placeholder="בחר/י רגש"
          isOpen={openMenuId === 'current'}
          onToggle={() => setOpenMenuId((current) => (current === 'current' ? '' : 'current'))}
          onSelectEmotion={onSelectCurrentEmotion}
          onChangeIntensity={onChangeCurrentIntensity}
        />

        <EmotionPickerPill
          title="רגש אחרי השאלה"
          selection={afterEmotion}
          placeholder="יופיע אחרי שאלה"
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
    { key: 'openField', label: 'פתיחות שדה' },
    { key: 'resources', label: 'משאבים זמינים' },
    { key: 'distress', label: 'עומס/מצוקה' },
  ]

  return (
    <div className="relations-panel relations-metrics-panel">
      <h3>מדדים (תוצאה)</h3>
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
          <h3>משפחות שאלות</h3>
          <p className="muted-text">בכל טאב מוצגות רק 3–4 שאלות, כדי לשמור על בחירה אנושית ופשוטה.</p>
        </div>
        <button type="button" className="relations-smart-button" onClick={onApplySmartSuggestion}>
          הצעה חכמה
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
  const [emotionSelection, setEmotionSelection] = useState({ id: null, intensity: 3 })
  const [afterEmotionSelection, setAfterEmotionSelection] = useState(null)
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false)
  const [openEmotionMenuId, setOpenEmotionMenuId] = useState('')
  const [highlightedQuestionId, setHighlightedQuestionId] = useState('')
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

  useEffect(() => {
    if (!questionPickerOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQuestionPickerOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [questionPickerOpen])

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
    setQuestionPickerOpen(false)
    setOpenEmotionMenuId('')
    setStatusMessage('')
  }

  const handleOpenQuestionPicker = () => {
    if (!session) return
    setQuestionPickerOpen(true)
    setOpenEmotionMenuId('')
    emitAlchemySignal('whoosh', { message: 'פתיחת משפחות שאלות.' })
  }

  const handleCloseQuestionPicker = () => {
    setQuestionPickerOpen(false)
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
    setEmotionSelection(
      normalizeEmotionSelection({
        id: wizardScenarioPreview.baselineEmotionId ?? null,
        intensity: 3,
      }),
    )
    setAfterEmotionSelection(null)
    setQuestionPickerOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId('')
    setStatusMessage('קראו את המונולוג ובחרו שאלת יחסים. המדדים והרגש יתעדכנו מיד אחרי הבחירה.')
  }

  const updateLatestTurnEmotionAfter = (nextEmotion) => {
    setSession((currentSession) => {
      if (!currentSession?.turns?.length) return currentSession
      const turns = currentSession.turns.slice()
      const latestIndex = turns.length - 1
      turns[latestIndex] = {
        ...turns[latestIndex],
        emotionAfter: nextEmotion,
      }
      return { ...currentSession, turns }
    })
  }

  const handleSelectCurrentEmotion = (emotionId) => {
    if (!emotionId) return
    const nextEmotion = normalizeEmotionSelection({
      id: emotionId,
      intensity: emotionSelection?.intensity ?? 3,
    })
    setEmotionSelection(nextEmotion)
    setOpenEmotionMenuId('')
    setStatusMessage('עודכן רגש נוכחי לסבב הבא.')
  }

  const handleChangeCurrentEmotionIntensity = (intensity) => {
    setEmotionSelection((current) => normalizeEmotionSelection({ ...current, intensity }))
  }

  const handleSelectAfterEmotion = (emotionId) => {
    if (!emotionId || !latestTurn) return
    const nextEmotion = normalizeEmotionSelection({
      id: emotionId,
      intensity: afterEmotionSelection?.intensity ?? latestTurn.emotionAfter?.intensity ?? 3,
    })
    setAfterEmotionSelection(nextEmotion)
    setEmotionSelection(nextEmotion)
    updateLatestTurnEmotionAfter(nextEmotion)
    setOpenEmotionMenuId('')
    setStatusMessage('עודכן רגש אחרי השאלה (וגם הרגש הנוכחי לסבב הבא).')
  }

  const handleChangeAfterEmotionIntensity = (intensity) => {
    if (!afterEmotionSelection) return
    const nextEmotion = normalizeEmotionSelection({ ...afterEmotionSelection, intensity })
    setAfterEmotionSelection(nextEmotion)
    setEmotionSelection(nextEmotion)
    updateLatestTurnEmotionAfter(nextEmotion)
  }

  const handleAskQuestion = (family, question) => {
    if (!session) return
    if (!canAskQuestion) {
      setStatusMessage('קודם בחר/י או עדכן/י רגש נוכחי.')
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
    setQuestionPickerOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId(question.id)
    setStatusMessage('השאלה נוספה. המדדים והרגש התעדכנו לפי התגובה.')

    emitAlchemySignal('tap', { message: 'נבחרה שאלת יחסים.' })
    emitAlchemySignal('rise', { message: 'המדדים התעדכנו.' })

    const gain = turn.deltas.openField + turn.deltas.resources - turn.deltas.distress
    const improved = turn.deltas.openField > 0 || turn.deltas.distress < 0
    if (improved) {
      emitAlchemySignal('copied', { message: 'שיפור מורגש במדדים.' })
    } else if (gain >= 14) {
      emitAlchemySignal('success', { message: 'נוצר שינוי במבנה הקשר.' })
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
    setEmotionSelection({ id: null, intensity: 3 })
    setAfterEmotionSelection(null)
    setQuestionPickerOpen(false)
    setOpenEmotionMenuId('')
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
              <h2>לולאת תרגול יחסים</h2>
              <p className="muted-text">קוראים מונולוג → בוחרים שאלת יחסים → רואים שינוי במדדים וברגש.</p>
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

          <div className="relations-loop-strip" role="note" aria-label="לולאת סיבה ותוצאה">
            <span>במרכז: המונולוג + השאלה</span>
            <span className="relations-loop-strip__arrow" aria-hidden="true">←</span>
            <strong>משמאל: שינוי במדדים וברגש</strong>
          </div>

          <div className="relations-engine">
            <div className="relations-engine__connector" aria-hidden="true">
              <span>סיבה → תוצאה</span>
            </div>

            <aside className="relations-engine__left">
              <div className="relations-sticky-stack">
                <MetricBars bars={session.bars} latestTurn={latestTurn} />

                <EmotionPillsPanel
                  currentEmotion={emotionSelection}
                  afterEmotion={afterEmotionSelection}
                  openMenuId={openEmotionMenuId}
                  setOpenMenuId={setOpenEmotionMenuId}
                  onSelectCurrentEmotion={handleSelectCurrentEmotion}
                  onChangeCurrentIntensity={handleChangeCurrentEmotionIntensity}
                  onSelectAfterEmotion={handleSelectAfterEmotion}
                  onChangeAfterIntensity={handleChangeAfterEmotionIntensity}
                />

                <div className="relations-panel relations-mini-panel">
                  <h4>מצב הסשן</h4>
                  <ul className="relations-mini-list">
                    <li>שאלות שנשאלו: <strong>{session.turns.length}</strong></li>
                    <li>שאלות אהובות: <strong>{likedTurns.length}</strong></li>
                    <li>ארכיון בסשן: <strong>{archiveCountForCurrentSession}</strong></li>
                  </ul>
                  <div className="relations-mini-list__hint">
                    {latestTurn
                      ? `הרגש הנוכחי עודכן ל־${emotionSelection?.labelHe ?? '—'}`
                      : 'בחר/י שאלה אחת כדי לראות שינוי ראשון'}
                  </div>
                </div>
              </div>
            </aside>

            <section className="relations-engine__center">
              <div className="relations-panel relations-problem-panel relations-problem-panel--primary">
                <div className="relations-problem-panel__head">
                  <div>
                    <h3>משפחות שאלות</h3>
                    <p className="muted-text">בכל טאב מוצגות רק 3–4 שאלות, כדי לשמור על בחירה אנושית ופשוטה.</p>
                  </div>
                </div>

                <div className="relations-monologue-preview relations-monologue-preview--full">
                  {session.scenario.clientMonologueLines.map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="relations-panel relations-decomposition-panel">
                <h3>פירוק אנושי של הסיטואציה</h3>
                <div className="relations-human-breakdown">
                  <div className="relations-human-breakdown__row">
                    <span>ההקשר:</span>
                    <strong>{session.scenario.contextF}</strong>
                  </div>
                  <div className="relations-human-breakdown__row">
                    <span>המטרה:</span>
                    <strong>{session.scenario.goalG}</strong>
                  </div>
                  <div className="relations-human-breakdown__row">
                    <span>שני דברים במתח:</span>
                    <strong>{session.scenario.element1} מול {session.scenario.element2}</strong>
                  </div>
                  <div className="relations-human-breakdown__row relations-human-breakdown__row--full">
                    <span>הקשר ביניהם כרגע:</span>
                    <strong>{relationStateSummary}</strong>
                  </div>
                </div>
              </div>

              <div className="relations-panel relations-stream-panel">
                <div className="relations-stream-panel__head">
                  <h3>השיחה האחרונה</h3>
                  <p className="muted-text">השאלה שבחרת יוצרת תגובה חדשה, תובנת יועץ, ושינוי במדדים.</p>
                </div>

                {!session.turns.length && (
                  <div className="relations-empty-state">
                    קראו את המונולוג, פתחו את בחירת השאלות מימין, ובחרו שאלת יחסים אחת.
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
                          <h4>{reverseIndex === 0 ? 'השיחה האחרונה' : `סבב קודם #${session.turns.length - reverseIndex}`}</h4>
                        </div>
                        <button
                          type="button"
                          className={`relations-like-button ${turn.liked ? 'is-liked' : ''}`}
                          onClick={() => handleToggleLikeTurn(turn.id)}
                          aria-pressed={turn.liked}
                          title="שמור שאלה אהובה"
                        >
                          {turn.liked ? 'נשמר' : 'שמור'}
                        </button>
                      </div>

                      <TurnDeltaBadges turn={turn} />

                      <div className="relations-turn-card__body">
                        <div className="relations-stream-line">
                          <strong>אתה שאלת:</strong>
                          <p>{turn.questionText}</p>
                        </div>
                        <div className="relations-stream-line">
                          <strong>המטופל ענה:</strong>
                          <pre>{turn.clientAnswerText}</pre>
                        </div>
                        <div className="relations-stream-line">
                          <strong>תובנת היועץ:</strong>
                          <p>{turn.coachInsightText}</p>
                        </div>
                      </div>

                      <div className="relations-turn-card__foot">
                        <span>רגש לפני: {turn.emotionBefore?.labelHe ?? '—'} ({turn.emotionBefore?.intensity ?? '—'}/5)</span>
                        <span>רגש אחרי: {turn.emotionAfter?.labelHe ?? '—'} {turn.emotionAfter ? `(${turn.emotionAfter.intensity}/5)` : ''}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="relations-engine__right">
              <div className="relations-action-stack">
                <div className="relations-panel relations-action-panel">
                  <h3>בחירת שאלה</h3>
                  <p className="muted-text">שואלים שאלה אחת בכל פעם. אחרי הבחירה המודאל נסגר, והמערכת מציגה מיד את האפקט.</p>

                  {smartSuggestion && (
                    <div className="relations-smart-callout">
                      <span>הצעה חכמה כרגע</span>
                      <strong>{smartSuggestion.familyLabelHe}</strong>
                      <p>{smartSuggestion.renderedText}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="relations-ask-cta"
                    onClick={handleOpenQuestionPicker}
                    disabled={!canAskQuestion}
                  >
                    שאל שאלת יחסים
                  </button>

                  {!canAskQuestion && (
                    <div className="relations-action-note">בחר/י רגש נוכחי כדי לפתוח את בחירת השאלות.</div>
                  )}
                </div>
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

      {questionPickerOpen && session && (
        <div
          className="relations-question-modal-backdrop"
          onClick={handleCloseQuestionPicker}
          role="presentation"
        >
          <section
            className="relations-question-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relations-question-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relations-question-modal__head">
              <div>
                <p className="relations-home-card__eyebrow">שאלת יחסים</p>
                <h2 id="relations-question-modal-title">בחר/י משפחת שאלות ושאלה אחת</h2>
                <p className="muted-text">לאחר הבחירה המודאל ייסגר אוטומטית ויופיעו תגובה, מדדים ורגש מעודכן.</p>
              </div>
              <button
                type="button"
                className="relations-wizard-close"
                onClick={handleCloseQuestionPicker}
                aria-label="סגור בחירת שאלות"
              >
                ×
              </button>
            </div>

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
          </section>
        </div>
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
                    <div><span>ההקשר:</span> <strong>{wizardScenarioPreview.contextF}</strong></div>
                    <div><span>המטרה:</span> <strong>{wizardScenarioPreview.goalG}</strong></div>
                    <div><span>דבר ראשון במתח:</span> <strong>{wizardScenarioPreview.element1}</strong></div>
                    <div><span>דבר שני במתח:</span> <strong>{wizardScenarioPreview.element2}</strong></div>
                    <div><span>הקשר ביניהם כרגע:</span> <strong>{wizardScenarioPreview.initialRelationR0.shortHe}</strong></div>
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
