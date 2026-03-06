import { useEffect, useMemo, useReducer, useState } from 'react'
import RelationsDrillStage from '../components/relations/RelationsDrillStage'
import RelationsReviewStage from '../components/relations/RelationsReviewStage'
import RelationsSetupStage from '../components/relations/RelationsSetupStage'
import {
  MetricDetailsPanel,
  RelationsHeader,
  RelationsHelpPanel,
} from '../components/relations/relationsShared'
import {
  buildCompactSystemHint,
  buildFavoriteArchiveRecord,
  buildFavoritePackPayload,
  copyToClipboard,
  describeCurrentRelationState,
  getWorkedQuestion,
  normalizeEmotionSelection,
} from '../components/relations/relationsUtils'
import { useOverlay } from '../components/overlay/useOverlay'
import { useAppState } from '../state/appStateContext'
import {
  buildFinalSessionInsight,
  buildRelationsQuestionSetForScenario,
  createDefaultRelationsWizardSettings,
  createRelationsScenario,
  loadRelationsQuestionArchive,
  saveRelationsQuestionArchive,
  simulateQuestionTurn,
  suggestSmartQuestion,
} from '../data/relationsLabData'
import { makeId } from '../utils/ids'
import { emitAlchemySignal } from '../utils/alchemySignals'
import { downloadJson } from '../utils/storage'

function createSetupState() {
  return {
    ...createDefaultRelationsWizardSettings(),
    focusText: '',
    softGoal: '',
  }
}

function flowReducer(state, action) {
  switch (action.type) {
    case 'GO_SETUP':
      return { flowStage: 'setup', activeTurnStage: 'active.ready' }
    case 'START_SESSION':
      return { flowStage: 'active', activeTurnStage: 'active.ready' }
    case 'QUESTION_SELECTED':
      return { flowStage: 'active', activeTurnStage: 'active.questionSelected' }
    case 'RESOLVE_TURN':
      return { flowStage: 'active', activeTurnStage: 'active.resolvedTurn' }
    case 'CONTINUE':
      return { flowStage: 'active', activeTurnStage: 'active.nextTurn' }
    case 'REVIEW':
      return { flowStage: 'review', activeTurnStage: 'active.resolvedTurn' }
    default:
      return state
  }
}

export default function RelationsLabPage() {
  const { upsertHistory, setLastVisitedLab } = useAppState()
  const { openOverlay, closeOverlay, activeOverlay } = useOverlay()
  const [flowState, dispatchFlow] = useReducer(flowReducer, {
    flowStage: 'setup',
    activeTurnStage: 'active.ready',
  })

  const [setupValues, setSetupValues] = useState(createSetupState)
  const [setupSeedVersion, setSetupSeedVersion] = useState(0)

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

  const setupScenarioPreview = useMemo(
    () => createRelationsScenario({
      contextId: setupValues.contextId,
      archetypeId: setupValues.archetypeId,
      nonce: setupSeedVersion,
    }),
    [setupValues.archetypeId, setupValues.contextId, setupSeedVersion],
  )

  const questionFamilies = session?.scenario
    ? buildRelationsQuestionSetForScenario(session.scenario)
    : []

  const smartSuggestion = session?.scenario
    ? suggestSmartQuestion({ scenario: session.scenario, bars: session.bars })
    : null

  const canAskQuestion = Boolean(session && emotionSelection.id)
  const latestTurn = session?.turns.at(-1) ?? null
  const relationStateSummary = session ? describeCurrentRelationState(session) : ''
  const currentFinalInsight = session
    ? buildFinalSessionInsight({
        scenario: session.scenario,
        turns: session.turns,
        bars: session.bars,
      })
    : ''
  const likedTurns = session?.turns.filter((turn) => turn.liked) ?? []
  const workedQuestion = getWorkedQuestion(session?.turns ?? [])
  const mainStatusHint = buildCompactSystemHint(session, latestTurn, emotionSelection)

  const handleChangeSetupField = (key, value) => {
    setSetupValues((current) => ({ ...current, [key]: value }))
  }

  const handleSelectCurrentEmotion = (emotionId) => {
    if (!emotionId) return
    setEmotionSelection((current) => normalizeEmotionSelection({
      id: emotionId,
      intensity: current?.intensity ?? 3,
    }))
    setOpenEmotionMenuId('')
  }

  const handleChangeCurrentEmotionIntensity = (intensity) => {
    setEmotionSelection((current) => normalizeEmotionSelection({ ...current, intensity }))
  }

  const resetSessionState = () => {
    setSession(null)
    setSelectedFamilyId('between')
    setAfterEmotionSelection(null)
    setSelectedMetric(null)
    setHelpOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId('')
    setStatusMessage('')
  }

  const handleStartSession = () => {
    if (!setupScenarioPreview) return
    if (!emotionSelection.id) {
      setStatusMessage('בחר/י רגש נוכחי לפני תחילת הסבב.')
      return
    }

    const scenario = {
      ...setupScenarioPreview,
      goalG: setupValues.softGoal.trim() || setupScenarioPreview.goalG,
      sessionFocusText: setupValues.focusText.trim(),
    }

    const nextSession = {
      id: makeId('relations-session'),
      startedAt: new Date().toISOString(),
      endedAt: null,
      scenario,
      bars: { ...scenario.initialBars },
      turns: [],
    }

    setSession(nextSession)
    setAfterEmotionSelection(null)
    setSelectedMetric(null)
    setHelpOpen(false)
    setOpenEmotionMenuId('')
    setHighlightedQuestionId('')
    setSelectedFamilyId(
      suggestSmartQuestion({ scenario, bars: scenario.initialBars })?.familyId ?? 'between',
    )
    setStatusMessage('בחר/י שאלה אחת. אחריה תקבל/י תוצאה והסבר קצר למה היא עבדה.')
    dispatchFlow({ type: 'START_SESSION' })
    emitSignal('success', { message: 'Relations session started.' })
  }

  const handleAskQuestion = (family, question) => {
    if (!session) return
    if (!canAskQuestion) {
      setStatusMessage('בחר/י או עדכן/י רגש נוכחי לפני השאלה.')
      return
    }

    dispatchFlow({ type: 'QUESTION_SELECTED' })

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
    setStatusMessage('התוצאה עודכנה. אפשר לבחור שאלה נוספת או לעבור לסיכום.')
    dispatchFlow({ type: 'RESOLVE_TURN' })

    emitSignal('tap', { message: 'Relations question selected.' })
    emitSignal('rise', { message: 'Relations metrics updated.' })
  }

  const handleApplySmartSuggestion = () => {
    if (!smartSuggestion) return
    setSelectedFamilyId(smartSuggestion.familyId)
    setHighlightedQuestionId(smartSuggestion.question.id)
    setStatusMessage(`הצעה חכמה: ${smartSuggestion.renderedText}`)
  }

  const handleContinue = () => {
    dispatchFlow({ type: 'CONTINUE' })
    setStatusMessage('המשך/י עם שאלה אחת נוספת או סיים/י לסיכום.')
  }

  const handleToggleLikeTurn = (turnId) => {
    if (!session) return

    const currentTurn = session.turns.find((turn) => turn.id === turnId)
    if (!currentTurn) return
    const nextTurnSnapshot = { ...currentTurn, liked: !currentTurn.liked }

    setSession((current) => {
      if (!current) return current
      return {
        ...current,
        turns: current.turns.map((turn) => (
          turn.id === turnId ? { ...turn, liked: !turn.liked } : turn
        )),
      }
    })

    setArchive((currentArchive) => {
      const key = `${session.id}:${turnId}`
      const exists = currentArchive.some((item) => item.id === key)
      if (exists && !nextTurnSnapshot.liked) {
        return currentArchive.filter((item) => item.id !== key)
      }
      if (!exists && nextTurnSnapshot.liked) {
        return [
          buildFavoriteArchiveRecord({ session, turn: nextTurnSnapshot }),
          ...currentArchive,
        ].slice(0, 200)
      }
      return currentArchive
    })

    emitSignal('saved', {
      message: nextTurnSnapshot.liked ? 'Question saved.' : 'Question removed.',
    })
  }

  const handleFinishSession = () => {
    if (!session) return
    const nextSession = {
      ...session,
      endedAt: new Date().toISOString(),
    }
    setSession(nextSession)

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
      sentenceText:
        nextSession.scenario.clientMonologueLines[1] ??
        nextSession.scenario.clientMonologueLines[0] ??
        'Relations Session',
    })

    dispatchFlow({ type: 'REVIEW' })
    setStatusMessage('הסשן סוכם. אפשר לשמור מועדפים או להתחיל סשן חדש.')
    emitSignal('mastery', { message: 'Relations session completed.' })
  }

  const handleCopyFavoritePack = async () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2))
    setStatusMessage(ok ? 'חבילת השאלות הועתקה ללוח.' : 'לא הצלחתי להעתיק ללוח.')
    emitSignal(ok ? 'copied' : 'soft-alert', {
      message: ok ? 'Favorite Pack copied.' : 'Copy failed.',
    })
  }

  const handleDownloadFavoritePack = () => {
    if (!session) return
    const payload = buildFavoritePackPayload(session)
    downloadJson(`relations-favorite-pack-${session.id}.json`, payload)
    setStatusMessage('חבילת השאלות נשמרה כקובץ.')
    emitSignal('saved', { message: 'Favorite Pack saved.' })
  }

  const handleStartNewSession = () => {
    resetSessionState()
    dispatchFlow({ type: 'GO_SETUP' })
    setSetupSeedVersion((current) => current + 1)
  }

  const handleResetSession = () => {
    const shouldReset = window.confirm('להתחיל סשן חדש? הסשן הנוכחי יוסר מהמסך.')
    if (!shouldReset) return
    handleStartNewSession()
  }

  const handleOpenSetup = () => {
    if (flowState.flowStage === 'setup') return
    const shouldMove = window.confirm('לחזור ל־Setup ולפתוח סשן חדש?')
    if (!shouldMove) return
    handleStartNewSession()
  }

  useEffect(() => {
    if (session && selectedMetric) {
      openOverlay({
        id: `relations-metric-${selectedMetric}`,
        type: 'relations-metric',
        title: 'מדד מפורט',
        size: 'lg',
        closeOnBackdrop: true,
        showHeader: false,
        content: (
          <MetricDetailsPanel
            metricId={selectedMetric}
            bars={session.bars}
            latestTurn={latestTurn}
          />
        ),
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
        content: <RelationsHelpPanel />,
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
  ])

  return (
    <section className="relations-page page-stack">
      <RelationsHeader
        flowStage={flowState.flowStage}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((current) => !current)}
        onOpenSettings={handleOpenSetup}
        onOpenHelp={() => {
          setSelectedMetric(null)
          setHelpOpen(true)
        }}
        onResetSession={handleResetSession}
        canReset={Boolean(session)}
      />

      {flowState.flowStage === 'setup' && (
        <RelationsSetupStage
          setupValues={setupValues}
          scenarioPreview={setupScenarioPreview}
          emotionSelection={emotionSelection}
          openEmotionMenuId={openEmotionMenuId}
          setOpenEmotionMenuId={setOpenEmotionMenuId}
          onChangeField={handleChangeSetupField}
          onSelectEmotion={handleSelectCurrentEmotion}
          onChangeEmotionIntensity={handleChangeCurrentEmotionIntensity}
          onRefreshScenario={() => setSetupSeedVersion((current) => current + 1)}
          onStartSession={handleStartSession}
        />
      )}

      {flowState.flowStage === 'active' && session && (
        <RelationsDrillStage
          session={session}
          latestTurn={latestTurn}
          questionFamilies={questionFamilies}
          selectedFamilyId={selectedFamilyId}
          onSelectFamily={setSelectedFamilyId}
          onAskQuestion={handleAskQuestion}
          canAskQuestion={canAskQuestion}
          smartSuggestion={smartSuggestion}
          onApplySmartSuggestion={handleApplySmartSuggestion}
          highlightedQuestionId={highlightedQuestionId}
          statusHint={mainStatusHint}
          currentEmotion={emotionSelection}
          afterEmotion={afterEmotionSelection}
          openEmotionMenuId={openEmotionMenuId}
          setOpenEmotionMenuId={setOpenEmotionMenuId}
          onSelectCurrentEmotion={handleSelectCurrentEmotion}
          onChangeCurrentIntensity={handleChangeCurrentEmotionIntensity}
          relationStateSummary={relationStateSummary}
          onSelectMetric={(metricId) => {
            setHelpOpen(false)
            setSelectedMetric(metricId)
          }}
          activeTurnStage={flowState.activeTurnStage}
          onContinue={handleContinue}
          onFinishSession={handleFinishSession}
          onToggleLikeTurn={handleToggleLikeTurn}
        />
      )}

      {flowState.flowStage === 'review' && session && (
        <RelationsReviewStage
          session={session}
          finalInsight={currentFinalInsight}
          workedQuestion={workedQuestion}
          likedTurns={likedTurns}
          onCopyFavoritePack={handleCopyFavoritePack}
          onDownloadFavoritePack={handleDownloadFavoritePack}
          onStartNewSession={handleStartNewSession}
          onToggleLikeTurn={handleToggleLikeTurn}
        />
      )}

      <div className="status-line" aria-live="polite">{statusMessage}</div>
    </section>
  )
}
