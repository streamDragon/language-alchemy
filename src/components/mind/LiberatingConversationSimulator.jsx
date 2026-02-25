import { useMemo, useState } from 'react'
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import MenuSection from '../layout/MenuSection'
import { useAppState } from '../../state/appStateContext'
import { makeId } from '../../utils/ids'
import {
  liberatingContexts,
  randomItem,
  statementsForContext,
} from '../../data/mindLiberatingTraining'

function normalize(value) {
  return String(value ?? '').trim()
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function evaluateResponse(responseText, statement) {
  const text = normalize(responseText)
  const lower = text.toLowerCase()
  const feedback = []
  let score = 0

  if (!text) {
    return {
      score: 0,
      level: 'none',
      labelHe: '׳¢׳“׳™׳™׳ ׳׳ ׳ ׳‘׳“׳§',
      accent: 'neutral',
      feedbackHe: ['׳›׳×׳‘׳• ׳×׳’׳•׳‘׳” ׳§׳¦׳¨׳” ׳•׳׳– ׳׳—׳¦׳• "׳‘׳“׳•׳§ ׳×׳’׳•׳‘׳”".'],
      detectedStrengths: [],
    }
  }

  const hasQuestion = /[?״]/.test(text)
  const hasRelationship = includesAny(text, [/׳׳” ׳”׳§׳©׳¨/, /׳׳™׳ .*׳׳×׳§׳©׳¨/, /׳‘׳™׳ .* ׳/])
  const hasLoosening = includesAny(text, [/׳׳•׳׳™/, /׳™׳›׳•׳/, /׳׳₪׳¢׳׳™׳/, /׳›׳¨׳’׳¢/, /׳׳₪׳©׳¨/, /׳‘׳—׳׳§/])
  const hasQuantifierShift = includesAny(text, [/׳×׳׳™׳“/, /׳׳£ ׳₪׳¢׳/, /׳‘׳—׳׳§/, /׳׳₪׳¢׳׳™׳/, /׳›׳׳•׳/, /׳©׳•׳/])
  const hasNotKnowing = includesAny(text, [/׳׳ ׳™׳•׳“׳¢/, /׳׳ ׳™׳•׳“׳¢ ׳©׳׳×׳” ׳׳ ׳™׳•׳“׳¢/, /׳׳” ׳¢׳•׳“/, /׳׳₪׳©׳¨׳™/])
  const hasSomaticOrAttention = includesAny(text, [/׳׳¨׳’׳™׳©/, /׳©׳ ׳׳‘/, /׳‘׳’׳•׳£/, /׳¢׳›׳©׳™׳•/])
  const mentionsClientWords = statement
    ? normalize(statement.statement)
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .some((word) => lower.includes(word.toLowerCase()))
    : false

  const strengths = []

  if (hasQuestion) {
    score += 16
    strengths.push('׳©׳׳׳” ׳₪׳•׳×׳—׳×')
  } else {
    feedback.push('׳”׳×׳’׳•׳‘׳” ׳¢׳“׳™׳™׳ ׳ ׳©׳׳¢׳× ׳™׳•׳×׳¨ ׳›׳׳• ׳×׳©׳•׳‘׳”/׳”׳¡׳‘׳¨. ׳ ׳¡׳• ׳׳”׳₪׳•׳ ׳׳•׳×׳” ׳׳©׳׳׳” ׳₪׳•׳×׳—׳×.')
  }
  if (hasRelationship) {
    score += 28
    strengths.push('׳™׳—׳¡׳™׳ ׳‘׳™׳ ׳׳©׳×׳ ׳™׳')
  } else {
    feedback.push("׳›׳׳¢׳˜! ׳—׳¡׳¨ ׳¦׳™׳¨ ׳©׳ '׳׳” ׳”׳§׳©׳¨ / ׳׳™׳ X ׳׳×׳§׳©׳¨ ׳-Y' ׳›׳“׳™ ׳׳”׳–׳™׳– ׳×׳•׳“׳¢׳”.")
  }
  if (hasLoosening) {
    score += 14
    strengths.push('׳©׳₪׳” ׳׳¨׳›׳›׳×/׳₪׳•׳×׳—׳× ׳©׳“׳”')
  } else {
    feedback.push("׳׳₪׳©׳¨ ׳׳₪׳×׳•׳— ׳¢׳•׳“ ׳©׳“׳”: ׳”׳•׳¡׳™׳₪׳• '׳׳•׳׳™/׳›׳¨׳’׳¢/׳׳₪׳¢׳׳™׳/׳׳₪׳©׳¨'.")
  }
  if (hasQuantifierShift) {
    score += 14
    strengths.push('׳›׳™׳׳•׳× / UQ')
  } else if (statement && /׳×׳׳™׳“|׳׳£ ׳₪׳¢׳|׳׳|׳׳™׳/.test(statement.statement)) {
    feedback.push("׳©׳•׳•׳” ׳׳‘׳“׳•׳§ Universal Quantifier: '׳×׳׳™׳“/׳׳£ ׳₪׳¢׳/׳׳™׳' -> '׳׳₪׳¢׳׳™׳/׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳'.")
  }
  if (hasNotKnowing) {
    score += 12
    strengths.push('׳₪׳×׳™׳—׳× ׳׳™-׳™׳“׳™׳¢׳”')
  }
  if (hasSomaticOrAttention) {
    score += 10
    strengths.push('׳§׳©׳‘/׳×׳—׳•׳©׳”')
  }
  if (mentionsClientWords) {
    score += 6
    strengths.push('׳”׳“׳‘׳§׳” ׳׳©׳₪׳× ׳”׳׳˜׳•׳₪׳')
  } else {
    feedback.push('׳ ׳¡׳• ׳׳¢׳’׳ ׳׳× ׳”׳©׳׳׳” ׳‘׳׳™׳׳™׳ ׳©׳ ׳”׳׳˜׳•׳₪׳ (׳׳׳©׳ "׳”׳•׳¨׳¡", "׳×׳§׳•׳¢", "׳׳ ׳׳׳׳™׳").')
  }

  score = Math.min(100, Math.round(score))

  let level = 'needs-work'
  let labelHe = '׳¦׳¨׳™׳ ׳׳₪׳×׳•׳— ׳¢׳•׳“'
  let accent = 'warn'
  if (score >= 76) {
    level = 'great'
    labelHe = '׳׳¢׳•׳׳”'
    accent = 'good'
  } else if (score >= 52) {
    level = 'almost'
    labelHe = '׳›׳׳¢׳˜'
    accent = 'mid'
  }

  if (level === 'great') {
    feedback.unshift("׳׳¢׳•׳׳”! ׳”׳×׳’׳•׳‘׳” ׳©׳׳ ׳₪׳•׳×׳—׳× ׳׳× ׳”׳©׳“׳” ׳‘׳׳§׳•׳ ׳׳”׳×׳•׳•׳›׳— ׳¢׳ ׳”׳×׳•׳›׳.")
  } else if (level === 'almost') {
    feedback.unshift("׳›׳׳¢׳˜! ׳™׳© ׳₪׳×׳™׳—׳” ׳˜׳•׳‘׳”, ׳•׳¢׳›׳©׳™׳• ׳©׳•׳•׳” ׳׳”׳•׳¡׳™׳£ ׳¢׳•׳“ ׳™׳—׳¡/׳›׳™׳׳•׳×/׳׳™-׳™׳“׳™׳¢׳”.")
  } else {
    feedback.unshift("׳”׳×׳—׳׳” ׳˜׳•׳‘׳”. ׳¢׳›׳©׳™׳• ׳ ׳–׳™׳– ׳׳× ׳”׳×׳•׳“׳¢׳” ׳¢׳ ׳©׳׳׳” ׳©׳׳§׳©׳¨׳× ׳‘׳™׳ ׳׳©׳×׳ ׳™׳ ׳•׳׳ ׳¨׳§ ׳׳¡׳‘׳™׳¨׳”.")
  }

  return {
    score,
    level,
    labelHe,
    accent,
    feedbackHe: feedback,
    detectedStrengths: strengths,
  }
}

export default function LiberatingConversationSimulator({
  className = '',
  onLoadPatientText,
  onSignal,
}) {
  const { upsertHistory } = useAppState()
  const initialContextId = liberatingContexts[0]?.id ?? ''
  const initialStatementId = randomItem(statementsForContext(initialContextId))?.id ?? null
  const [selectedContextId, setSelectedContextId] = useState(initialContextId)
  const [currentStatementId, setCurrentStatementId] = useState(initialStatementId)
  const [userResponse, setUserResponse] = useState('')
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [showFullSequence, setShowFullSequence] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const statements = useMemo(
    () => statementsForContext(selectedContextId),
    [selectedContextId],
  )

  const currentStatement = useMemo(
    () => statements.find((item) => item.id === currentStatementId) ?? statements[0] ?? null,
    [statements, currentStatementId],
  )

  const evaluation = useMemo(
    () => evaluateResponse(userResponse, currentStatement),
    [userResponse, currentStatement],
  )

  const contextMap = useMemo(
    () => Object.fromEntries(liberatingContexts.map((item) => [item.id, item])),
    [],
  )

  const handleSelectContext = (contextId) => {
    const nextStatements = statementsForContext(contextId)
    const candidate = randomItem(nextStatements)
    setSelectedContextId(contextId)
    setCurrentStatementId(candidate?.id ?? null)
    setUserResponse('')
    setShowEvaluation(false)
    setShowFullSequence(false)
    setStatusMessage('')
  }

  const pickNextStatement = () => {
    if (!statements.length) return
    if (statements.length === 1) {
      setCurrentStatementId(statements[0].id)
      setUserResponse('')
      setShowEvaluation(false)
      setShowFullSequence(false)
      return
    }
    let next = randomItem(statements)
    let attempts = 0
    while (next && next.id === currentStatementId && attempts < 6) {
      next = randomItem(statements)
      attempts += 1
    }
    setCurrentStatementId(next?.id ?? statements[0].id)
    setUserResponse('')
    setShowEvaluation(false)
    setShowFullSequence(false)
    onSignal?.('simulator-next-statement')
    setStatusMessage('׳ ׳˜׳¢׳ ׳׳©׳₪׳˜ ׳—׳“׳© ׳׳×׳¨׳’׳•׳.')
  }

  const handleCheckResponse = () => {
    if (!normalize(userResponse)) {
      setStatusMessage('׳›׳×׳‘׳• ׳×׳’׳•׳‘׳” ׳§׳¦׳¨׳” ׳׳₪׳ ׳™ ׳”׳‘׳“׳™׳§׳”.')
      return
    }

    setShowEvaluation(true)
    setStatusMessage('')

    if (evaluation.level === 'great') {
      setSuccessCount((count) => count + 1)
    }
    onSignal?.('simulator-check', { level: evaluation.level, score: evaluation.score })
  }

  const handleTryAgain = () => {
    setShowEvaluation(false)
    setShowFullSequence(false)
    setStatusMessage('׳׳₪׳©׳¨ ׳׳—׳“׳“ ׳׳× ׳”׳×׳’׳•׳‘׳” ׳•׳׳‘׳“׳•׳§ ׳©׳•׳‘.')
  }

  const handleSaveExample = () => {
    if (!currentStatement || !normalize(userResponse)) {
      setStatusMessage('׳¦׳¨׳™׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳•׳×׳’׳•׳‘׳” ׳©׳׳ ׳›׳“׳™ ׳׳©׳׳•׳¨ ׳“׳•׳’׳׳”.')
      return
    }

    upsertHistory({
      id: makeId('mls'),
      labId: 'mind-liberating-language',
      createdAt: new Date().toISOString(),
      summaryHe: `Simulator | ${contextMap[selectedContextId]?.labelHe ?? selectedContextId} | ${evaluation.labelHe} (${evaluation.score})`,
      sentenceText: userResponse,
      patientText: currentStatement.statement,
      toolId: 'liberating-conversation-simulator',
      evaluation,
      idealResponses: currentStatement.idealResponses,
    })
    onSignal?.('simulator-save', { score: evaluation.score })
    setStatusMessage('׳ ׳©׳׳¨׳” ׳“׳•׳’׳׳” ׳׳”׳™׳¡׳˜׳•׳¨׳™׳”.')
  }

  const badgeClass =
    evaluation.accent === 'good'
      ? 'is-good'
      : evaluation.accent === 'mid'
        ? 'is-mid'
        : evaluation.accent === 'warn'
          ? 'is-warn'
          : ''

  return (
    <section className={`panel-card simulator-card ${className}`.trim()}>
      <div className="panel-card__head">
        <div>
          <h3 className="feature-heading">
            <MessageCircle size={18} aria-hidden="true" />
            <span>׳¡׳™׳׳•׳׳˜׳•׳¨ ׳©׳™׳—׳•׳× ׳׳©׳—׳¨׳¨׳•׳×</span>
          </h3>
          <p className="feature-heading__sub">Mind Liberating Conversation Simulator</p>
        </div>
        <div className="simulator-progress">
          <span className="simulator-progress__pill">
            <Target size={14} aria-hidden="true" />
            {successCount}/5 ׳”׳¦׳׳—׳•׳×
          </span>
          {successCount >= 5 && (
            <span className="simulator-progress__pill is-master">
              <Trophy size={14} aria-hidden="true" />
              ׳׳׳¡׳˜׳¨
            </span>
          )}
        </div>
      </div>

      <div className="simulator-context-grid" role="tablist" aria-label="׳”׳§׳©׳¨ ׳׳×׳¨׳’׳•׳">
        {liberatingContexts.map((context) => (
          <button
            key={context.id}
            type="button"
            role="tab"
            aria-selected={selectedContextId === context.id}
            className={`simulator-context-card ${selectedContextId === context.id ? 'is-active' : ''}`}
            onClick={() => handleSelectContext(context.id)}
          >
            <Brain size={18} aria-hidden="true" />
            <strong>{context.labelHe}</strong>
            <small>{context.labelEn}</small>
          </button>
        ))}
      </div>

      <div className="simulator-statement">
        <div className="simulator-statement__head">
          <strong>׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳׳×׳¨׳’׳•׳</strong>
          <div className="simulator-statement__actions">
            <button type="button" onClick={pickNextStatement}>
              <Shuffle size={14} aria-hidden="true" />
              ׳׳©׳₪׳˜ ׳׳—׳¨
            </button>
            {onLoadPatientText && currentStatement && (
              <button type="button" onClick={() => onLoadPatientText(currentStatement.statement)}>
                <ChevronRight size={14} aria-hidden="true" />
                ׳˜׳¢׳ ׳׳׳¢׳‘׳“׳” ׳”׳¨׳׳©׳™׳×
              </button>
            )}
          </div>
        </div>
        <blockquote className="mindlab-quote">
          {currentStatement?.statement ?? '׳׳™׳ ׳›׳¨׳’׳¢ ׳׳©׳₪׳˜׳™׳ ׳‘׳”׳§׳©׳¨ ׳”׳–׳”.'}
        </blockquote>
      </div>

      <label className="mindlab-field">
        <span>׳”׳×׳’׳•׳‘׳” ׳©׳׳ (׳׳˜׳₪׳/׳׳׳׳)</span>
        <textarea
          rows={5}
          className="mindlab-textarea"
          value={userResponse}
          onChange={(event) => {
            setUserResponse(event.target.value)
            if (showEvaluation) setShowEvaluation(false)
            setStatusMessage('')
          }}
          placeholder='׳ ׳¡׳• ׳׳©׳׳•׳ ׳©׳׳׳” ׳©׳׳–׳™׳–׳” ׳×׳•׳“׳¢׳”: ׳§׳©׳¨׳™׳, ׳›׳™׳׳•׳×, ׳׳™-׳™׳“׳™׳¢׳”, ׳§׳©׳‘/׳×׳—׳•׳©׳”...'
        />
      </label>

      <div className="controls-row">
        <button type="button" onClick={handleCheckResponse}>
          <CheckCircle2 size={14} aria-hidden="true" />
          ׳‘׳“׳•׳§ ׳×׳’׳•׳‘׳”
        </button>
        <button type="button" onClick={handleTryAgain}>
          <RotateCcw size={14} aria-hidden="true" />
          ׳ ׳¡׳” ׳©׳•׳‘
        </button>
        <button type="button" onClick={() => setShowFullSequence((value) => !value)}>
          <Sparkles size={14} aria-hidden="true" />
          {showFullSequence ? '׳”׳¡׳×׳¨ ׳¨׳¦׳£ ׳׳׳' : '׳”׳¦׳’ ׳¨׳¦׳£ ׳׳׳'}
        </button>
        <button type="button" onClick={handleSaveExample}>
          <Save size={14} aria-hidden="true" />
          ׳©׳׳•׳¨ ׳›׳“׳•׳’׳׳”
        </button>
      </div>

      {showEvaluation && (
        <div className={`simulator-feedback ${badgeClass}`}>
          <div className="simulator-feedback__head">
            <div>
              <strong>{evaluation.labelHe}</strong>
              <small>׳¦׳™׳•׳: {evaluation.score}/100</small>
            </div>
            {evaluation.level === 'great' && (
              <span className="simulator-feedback__badge">
                <CheckCircle2 size={14} aria-hidden="true" />
                ׳₪׳×׳™׳—׳× ׳©׳“׳” ׳˜׳•׳‘׳”
              </span>
            )}
          </div>
          {evaluation.detectedStrengths.length > 0 && (
            <div className="chips-wrap">
              {evaluation.detectedStrengths.map((strength) => (
                <span key={strength} className="chip">
                  {strength}
                </span>
              ))}
            </div>
          )}
          <ul className="simulator-feedback__list">
            {evaluation.feedbackHe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <MenuSection
        title="׳×׳’׳•׳‘׳•׳× ׳׳™׳“׳™׳׳׳™׳•׳× (׳׳”-PDF / ׳¡׳’׳ ׳•׳ Overdurf)"
        subtitle={currentStatement ? `${currentStatement.idealResponses.length} ׳“׳•׳’׳׳׳•׳×` : undefined}
        badgeText={showFullSequence ? '׳₪׳×׳•׳—' : '׳׳•׳₪׳¦׳™׳•׳ ׳׳™'}
        isOpen={showFullSequence}
        onToggle={() => setShowFullSequence((value) => !value)}
        className="simulator-ideal-menu"
      >
        <div className="simulator-ideal-list">
          {(currentStatement?.idealResponses ?? []).map((item) => (
            <article key={`${currentStatement?.id}-${item.pattern}`} className="simulator-ideal-item">
              <div className="simulator-ideal-item__pattern">
                <Sparkles size={14} aria-hidden="true" />
                <span>{item.pattern}</span>
              </div>
              <p>{item.response}</p>
            </article>
          ))}
        </div>
      </MenuSection>

      {successCount >= 5 && (
        <div className="simulator-master-callout">
          <Trophy size={18} aria-hidden="true" />
          <div>
            <strong>׳׳×׳” ׳›׳‘׳¨ ׳׳׳¡׳˜׳¨ ׳©׳ ׳”׳©׳₪׳” ׳”׳׳©׳—׳¨׳¨׳×!</strong>
            <p>׳¦׳‘׳¨׳× 5 ׳”׳¦׳׳—׳•׳×. ׳¢׳›׳©׳™׳• ׳ ׳¡׳• ׳׳¢׳‘׳•׳¨ ׳"׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳" ׳•׳׳‘׳ ׳•׳× ׳¨׳¦׳£ ׳׳׳ ׳¢׳ ׳׳©׳₪׳˜ ׳—׳“׳©.</p>
          </div>
        </div>
      )}

      <div className="status-line" aria-live="polite">
        {statusMessage}
      </div>
    </section>
  )
}

