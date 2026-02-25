import { useMemo, useState } from 'react'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  GripVertical,
  ListChecks,
  MoveDown,
  MoveUp,
  Save,
  Shuffle,
  Sparkles,
  Workflow,
} from 'lucide-react'
import MenuSection from '../layout/MenuSection'
import { useAppState } from '../../state/appStateContext'
import { makeId } from '../../utils/ids'
import {
  liberatingClientStatements,
  liberatingContexts,
  liberatingPatterns,
  randomItem,
  shuffleList,
  statementsForContext,
} from '../../data/mindLiberatingTraining'

function normalize(value) {
  return String(value ?? '').trim()
}

function createOrderPool(pattern) {
  return shuffleList(pattern?.questions ?? [])
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every((item, index) => item === b[index])
}

function simpleSequenceFeedback(text) {
  const normalized = normalize(text)
  if (!normalized) return { score: 0, labelHe: '׳—׳¡׳¨ ׳¨׳¦׳£', notesHe: ['׳›׳×׳‘׳• ׳¨׳¦׳£ ׳׳׳ ׳׳™׳™׳©׳•׳ ׳¢׳ ׳”׳׳©׳₪׳˜.'] }

  let score = 30
  const notes = []
  if (/[?״]/.test(normalized)) {
    score += 20
    notes.push('׳™׳© ׳©׳׳׳•׳× ׳₪׳•׳×׳—׳•׳×.')
  } else {
    notes.push('׳”׳•׳¡׳™׳₪׳• ׳¡׳™׳׳ ׳™ ׳©׳׳׳”/׳©׳׳׳•׳× ׳׳₪׳•׳¨׳©׳•׳× ׳›׳“׳™ ׳׳©׳׳•׳¨ ׳¢׳ ׳×׳ ׳•׳¢׳”.')
  }
  if (/׳׳” ׳”׳§׳©׳¨|׳׳™׳ .*׳׳×׳§׳©׳¨/.test(normalized)) {
    score += 25
    notes.push("׳׳¢׳•׳׳”: ׳™׳© ׳¦׳™׳¨ '׳™׳—׳¡׳™׳' ׳©׳׳–׳™׳– ׳׳× ׳”׳×׳•׳“׳¢׳”.")
  }
  if (/׳×׳׳™׳“|׳׳₪׳¢׳׳™׳|׳‘׳—׳׳§|׳›׳׳•׳|׳©׳•׳|׳׳•׳׳™|׳׳₪׳©׳¨/.test(normalized)) {
    score += 15
    notes.push('׳™׳© ׳¢׳‘׳•׳“׳” ׳¢׳ ׳›׳™׳׳•׳×/׳₪׳×׳™׳—׳× ׳©׳“׳”.')
  }
  if (/׳׳ ׳™׳•׳“׳¢|׳׳₪׳©׳¨׳™|׳׳” ׳¢׳•׳“/.test(normalized)) {
    score += 10
    notes.push('׳ ׳›׳ ׳¡׳” ׳₪׳×׳™׳—׳× ׳׳™-׳™׳“׳™׳¢׳”/׳׳₪׳©׳¨׳•׳×.')
  }

  score = Math.min(100, score)
  return {
    score,
    labelHe: score >= 75 ? '׳¨׳¦׳£ ׳—׳–׳§' : score >= 55 ? '׳‘׳¡׳™׳¡ ׳˜׳•׳‘' : '׳¦׳¨׳™׳ ׳¢׳•׳“ ׳₪׳×׳™׳—׳”',
    notesHe: notes,
  }
}

function FlowChart({ nodes = [] }) {
  const safeNodes = nodes.slice(0, 4)
  const width = 700
  const height = 120
  const boxWidth = 145
  const boxHeight = 42
  const gap = 24
  const startX = 14
  return (
    <svg
      className="pattern-master__flowchart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Flowchart pattern"
      preserveAspectRatio="xMidYMid meet"
    >
      {safeNodes.map((node, index) => {
        const x = startX + index * (boxWidth + gap)
        const y = 26
        return (
          <g key={`${node}-${index}`}>
            <rect
              x={x}
              y={y}
              rx="10"
              ry="10"
              width={boxWidth}
              height={boxHeight}
              className="pattern-master__flowbox"
            />
            <text x={x + boxWidth / 2} y={y + 25} textAnchor="middle" className="pattern-master__flowtext">
              {node}
            </text>
            {index < safeNodes.length - 1 && (
              <>
                <line
                  x1={x + boxWidth + 5}
                  y1={y + boxHeight / 2}
                  x2={x + boxWidth + gap - 6}
                  y2={y + boxHeight / 2}
                  className="pattern-master__flowline"
                />
                <path
                  d={`M ${x + boxWidth + gap - 12} ${y + boxHeight / 2 - 5} L ${x + boxWidth + gap - 5} ${y + boxHeight / 2} L ${x + boxWidth + gap - 12} ${y + boxHeight / 2 + 5}`}
                  className="pattern-master__flowarrow"
                />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function PatternSequenceMaster({
  className = '',
  onLoadPatientText,
  onSignal,
}) {
  const { upsertHistory } = useAppState()
  const initialPattern = liberatingPatterns[0] ?? null
  const initialPatternId = initialPattern?.id ?? ''
  const initialContextId = liberatingContexts[0]?.id ?? ''
  const initialApplicationStatementId =
    randomItem(statementsForContext(initialContextId))?.id ?? null

  const [selectedPatternId, setSelectedPatternId] = useState(initialPatternId)
  const [mode, setMode] = useState('learn')
  const [fillAnswer, setFillAnswer] = useState('')
  const [fillChecked, setFillChecked] = useState(false)
  const [orderPool, setOrderPool] = useState(() => createOrderPool(initialPattern))
  const [builtOrder, setBuiltOrder] = useState([])
  const [orderChecked, setOrderChecked] = useState(false)
  const [applicationContextId, setApplicationContextId] = useState(initialContextId)
  const [applicationStatementId, setApplicationStatementId] = useState(initialApplicationStatementId)
  const [applicationSequenceText, setApplicationSequenceText] = useState('')
  const [applicationChecked, setApplicationChecked] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const selectedPattern = useMemo(
    () => liberatingPatterns.find((pattern) => pattern.id === selectedPatternId) ?? liberatingPatterns[0],
    [selectedPatternId],
  )

  const applicationStatements = useMemo(
    () => statementsForContext(applicationContextId),
    [applicationContextId],
  )

  const applicationStatement = useMemo(
    () =>
      applicationStatements.find((item) => item.id === applicationStatementId) ??
      applicationStatements[0] ??
      null,
    [applicationStatements, applicationStatementId],
  )

  const blankCorrect = useMemo(
    () =>
      normalize(fillAnswer).toLowerCase().includes(
        normalize(selectedPattern?.fillBlankAnswer).toLowerCase(),
      ),
    [fillAnswer, selectedPattern],
  )

  const orderCorrect = useMemo(
    () => arraysEqual(builtOrder, selectedPattern?.questions ?? []),
    [builtOrder, selectedPattern],
  )

  const applicationFeedback = useMemo(
    () => simpleSequenceFeedback(applicationSequenceText),
    [applicationSequenceText],
  )

  const handleSelectPattern = (patternId) => {
    const nextPattern =
      liberatingPatterns.find((pattern) => pattern.id === patternId) ?? liberatingPatterns[0]
    setSelectedPatternId(patternId)
    setFillAnswer('')
    setFillChecked(false)
    setOrderPool(createOrderPool(nextPattern))
    setBuiltOrder([])
    setOrderChecked(false)
    setStatusMessage('')
  }

  const handleSelectApplicationContext = (contextId) => {
    const nextStatements = statementsForContext(contextId)
    const next = randomItem(nextStatements)
    setApplicationContextId(contextId)
    setApplicationStatementId(next?.id ?? null)
    setApplicationSequenceText('')
    setApplicationChecked(false)
    setStatusMessage('')
  }

  const handleAddToOrder = (question) => {
    setBuiltOrder((current) => [...current, question])
    setOrderPool((current) => current.filter((item) => item !== question))
    setOrderChecked(false)
    setStatusMessage('')
  }

  const handleRemoveFromOrder = (question, index) => {
    setBuiltOrder((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setOrderPool((current) => [...current, question])
    setOrderChecked(false)
  }

  const moveBuiltItem = (index, direction) => {
    setBuiltOrder((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
    setOrderChecked(false)
  }

  const handleShuffleOrderPool = () => {
    setOrderPool((current) => shuffleList(current))
    setStatusMessage('׳”׳¡׳“׳¨ ׳׳¢׳¨׳‘׳•׳‘ ׳¢׳•׳“׳›׳.')
  }

  const handleResetOrderPractice = () => {
    setOrderPool(createOrderPool(selectedPattern))
    setBuiltOrder([])
    setOrderChecked(false)
    setStatusMessage('׳×׳¨׳’׳•׳ ׳”׳¡׳“׳¨ ׳׳•׳₪׳¡.')
  }

  const handleCheckPractice = () => {
    setFillChecked(true)
    setOrderChecked(true)
    setApplicationChecked(true)
    onSignal?.('pattern-check', { score: applicationFeedback.score, orderCorrect, blankCorrect })
    setStatusMessage('')
  }

  const handleRandomApplicationStatement = () => {
    const all = applicationStatements.length ? applicationStatements : liberatingClientStatements
    const next = randomItem(all)
    setApplicationStatementId(next?.id ?? null)
    setApplicationSequenceText('')
    setApplicationChecked(false)
    onSignal?.('pattern-next-statement')
    setStatusMessage('׳ ׳˜׳¢׳ ׳׳©׳₪׳˜ ׳—׳“׳© ׳׳™׳™׳©׳•׳.')
  }

  const handleSaveSequence = () => {
    if (!selectedPattern || !normalize(applicationSequenceText)) {
      setStatusMessage('׳‘׳—׳¨׳• ׳₪׳׳˜׳¨׳ ׳•׳›׳×׳‘׳• ׳¨׳¦׳£ ׳™׳™׳©׳•׳ ׳׳₪׳ ׳™ ׳©׳׳™׳¨׳”.')
      return
    }

    upsertHistory({
      id: makeId('mlp'),
      labId: 'mind-liberating-language',
      createdAt: new Date().toISOString(),
      summaryHe: `Pattern Master | ${selectedPattern.titleHe} | ${applicationFeedback.labelHe} (${applicationFeedback.score})`,
      sentenceText: applicationSequenceText,
      patientText: applicationStatement?.statement,
      toolId: 'pattern-sequence-master',
      patternId: selectedPattern.id,
      orderCorrect,
      blankCorrect,
      applicationFeedback,
    })
    onSignal?.('pattern-save', { score: applicationFeedback.score, orderCorrect, blankCorrect })
    setStatusMessage('׳”׳¨׳¦׳£ ׳ ׳©׳׳¨ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳”.')
  }

  return (
    <section className={`panel-card pattern-master-card ${className}`.trim()}>
      <div className="panel-card__head">
        <div>
          <h3 className="feature-heading">
            <Workflow size={18} aria-hidden="true" />
            <span>׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳ - ׳‘׳•׳ ׳” ׳©׳₪׳” ׳׳©׳—׳¨׳¨׳×</span>
          </h3>
          <p className="feature-heading__sub">Pattern Sequence Master</p>
        </div>
        <div className="template-switcher pattern-master__modeSwitch">
          <button
            type="button"
            className={`template-pill ${mode === 'learn' ? 'is-active' : ''}`}
            onClick={() => setMode('learn')}
          >
            <BookOpen size={14} aria-hidden="true" />
            ׳׳¦׳‘ ׳׳׳™׳“׳”
          </button>
          <button
            type="button"
            className={`template-pill ${mode === 'practice' ? 'is-active' : ''}`}
            onClick={() => setMode('practice')}
          >
            <ListChecks size={14} aria-hidden="true" />
            ׳׳¦׳‘ ׳×׳¨׳’׳•׳
          </button>
        </div>
      </div>

      <div className="pattern-master__patternGrid" role="tablist" aria-label="׳‘׳—׳¨ ׳₪׳׳˜׳¨׳">
        {liberatingPatterns.map((pattern) => (
          <button
            key={pattern.id}
            type="button"
            role="tab"
            aria-selected={selectedPatternId === pattern.id}
            className={`pattern-master__patternCard ${selectedPatternId === pattern.id ? 'is-active' : ''}`}
            onClick={() => handleSelectPattern(pattern.id)}
          >
            <div className="pattern-master__patternCardHead">
              <span aria-hidden="true">{pattern.emoji ?? 'ג¨'}</span>
              <strong>{pattern.titleHe}</strong>
            </div>
            <small>{pattern.name}</small>
            <span>׳¢׳׳•׳“ {pattern.page}</span>
          </button>
        ))}
      </div>

      {selectedPattern && (
        <div className="pattern-master__panel">
          <div className="callout-line">
            <strong>
              {selectedPattern.emoji ? `${selectedPattern.emoji} ` : ''}
              {selectedPattern.titleHe}
            </strong>
            <span>{selectedPattern.descriptionHe}</span>
          </div>

          <FlowChart nodes={selectedPattern.flowNodes} />

          <MenuSection
            title="׳”׳¨׳¦׳£ ׳”׳׳׳"
            subtitle={`${selectedPattern.questions.length} ׳©׳׳׳•׳×`}
            badgeText="׳׳™׳׳•׳“"
            defaultOpen={mode === 'learn'}
            className="pattern-master__menu"
          >
            <ol className="pattern-master__questionList">
              {selectedPattern.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
            <p className="muted-text">{selectedPattern.feedbackHe}</p>
          </MenuSection>

          <MenuSection
            title="׳×׳¨׳’׳•׳: Fill-in-the-Blanks"
            subtitle={selectedPattern.fillBlankPrompt}
            badgeText={fillChecked ? (blankCorrect ? '׳ ׳›׳•׳' : '׳‘׳“׳™׳§׳”') : '׳×׳¨׳’׳•׳'}
            defaultOpen={mode === 'practice'}
            className="pattern-master__menu"
          >
            <div className="pattern-master__exercise">
              <label className="mindlab-field">
                <span>{selectedPattern.fillBlankPrompt}</span>
                <input
                  className="search-input"
                  value={fillAnswer}
                  onChange={(event) => {
                    setFillAnswer(event.target.value)
                    if (fillChecked) setFillChecked(false)
                  }}
                  placeholder="׳”׳©׳׳/׳™ ׳׳× ׳”׳—׳¡׳¨"
                />
              </label>
              <div className={`pattern-master__checkline ${fillChecked ? (blankCorrect ? 'is-good' : 'is-warn') : ''}`}>
                {fillChecked ? (
                  blankCorrect ? (
                    <span>
                      <CheckCircle2 size={14} aria-hidden="true" /> ׳ ׳›׳•׳. ׳”׳×׳©׳•׳‘׳” ׳”׳¦׳₪׳•׳™׳”: {selectedPattern.fillBlankAnswer}
                    </span>
                  ) : (
                    <span>׳›׳׳¢׳˜. ׳‘׳“׳§׳• ׳׳× ׳׳™׳׳× ׳”׳׳₪׳×׳— ׳©׳ ׳”׳₪׳׳˜׳¨׳: {selectedPattern.fillBlankAnswer}</span>
                  )
                ) : (
                  <span>׳”׳©׳׳/׳™ ׳•׳׳– ׳׳—׳¥/׳™ "׳‘׳“׳•׳§ ׳×׳¨׳’׳•׳".</span>
                )}
              </div>
            </div>
          </MenuSection>

          <MenuSection
            title="׳×׳¨׳’׳•׳: ׳¡׳“׳¨ ׳¨׳¦׳£ (Drag/Drop + ׳׳•׳‘׳™׳™׳ tap)"
            subtitle={`${builtOrder.length}/${selectedPattern.questions.length} ׳ ׳‘׳ ׳”`}
            badgeText={orderChecked ? (orderCorrect ? '׳׳“׳•׳™׳§' : '׳‘׳“׳™׳§׳”') : '׳×׳¨׳’׳•׳'}
            defaultOpen={mode === 'practice'}
            className="pattern-master__menu"
          >
            <div className="pattern-master__orderGrid">
              <div className="pattern-master__orderCol">
                <h4>׳‘׳¨׳™׳›׳× ׳©׳׳׳•׳×</h4>
                <div className="pattern-master__pool">
                  {orderPool.map((question) => (
                    <button
                      key={question}
                      type="button"
                      className="pattern-master__poolItem"
                      onClick={() => handleAddToOrder(question)}
                    >
                      <GripVertical size={14} aria-hidden="true" />
                      <span>{question}</span>
                    </button>
                  ))}
                  {!orderPool.length && <p className="muted-text">׳”׳›׳•׳ ׳”׳•׳¢׳‘׳¨ ׳׳¨׳¦׳£. ׳׳₪׳©׳¨ ׳׳‘׳“׳•׳§ ׳׳• ׳׳¡׳“׳¨ ׳׳—׳“׳©.</p>}
                </div>
                <div className="controls-row">
                  <button type="button" onClick={handleShuffleOrderPool}>
                    <Shuffle size={14} aria-hidden="true" />
                    ׳¢׳¨׳‘׳‘ ׳‘׳¨׳™׳›׳”
                  </button>
                  <button type="button" onClick={handleResetOrderPractice}>
                    ׳׳™׳₪׳•׳¡ ׳¡׳“׳¨
                  </button>
                </div>
              </div>

              <div className="pattern-master__orderCol">
                <h4>׳”׳¨׳¦׳£ ׳©׳‘׳ ׳™׳×</h4>
                <ol className="pattern-master__builtList">
                  {builtOrder.map((question, index) => (
                    <li key={`${question}-${index}`} className="pattern-master__builtItem">
                      <span>{question}</span>
                      <div className="pattern-master__builtActions">
                        <button type="button" onClick={() => moveBuiltItem(index, -1)} aria-label="׳”׳¢׳‘׳¨ ׳׳׳¢׳׳”">
                          <MoveUp size={14} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => moveBuiltItem(index, 1)} aria-label="׳”׳¢׳‘׳¨ ׳׳׳˜׳”">
                          <MoveDown size={14} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => handleRemoveFromOrder(question, index)}>
                          ׳”׳¡׳¨
                        </button>
                      </div>
                    </li>
                  ))}
                  {!builtOrder.length && <li className="muted-text">׳”׳§׳׳§/׳™ ׳¢׳ ׳©׳׳׳•׳× ׳׳”׳‘׳¨׳™׳›׳” ׳›׳“׳™ ׳׳‘׳ ׳•׳× ׳¨׳¦׳£.</li>}
                </ol>
                {orderChecked && (
                  <div className={`pattern-master__checkline ${orderCorrect ? 'is-good' : 'is-warn'}`}>
                    {orderCorrect ? '׳׳¢׳•׳׳”! ׳‘׳ ׳™׳× ׳׳× ׳”׳¨׳¦׳£ ׳‘׳¡׳“׳¨ ׳”׳ ׳›׳•׳.' : '׳¢׳•׳“ ׳׳. ׳ ׳¡׳• ׳׳¡׳“׳¨ ׳׳₪׳™ ׳”׳”׳™׳’׳™׳•׳ ׳©׳ ׳”׳₪׳׳˜׳¨׳.'}
                  </div>
                )}
              </div>
            </div>
          </MenuSection>

          <MenuSection
            title="׳™׳™׳©׳•׳ ׳׳™׳™׳“׳™ ׳¢׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳"
            subtitle={applicationStatement?.statement ?? '׳‘׳—׳¨/׳™ ׳”׳§׳©׳¨ ׳•׳׳©׳₪׳˜'}
            badgeText={applicationChecked ? applicationFeedback.labelHe : '׳™׳™׳©׳•׳'}
            defaultOpen
            className="pattern-master__menu"
          >
            <div className="pattern-master__application">
              <div className="pattern-master__applicationTop">
                <label className="source-context-panel__topic">
                  <span>׳”׳§׳©׳¨</span>
                  <select
                    value={applicationContextId}
                    onChange={(event) => handleSelectApplicationContext(event.target.value)}
                  >
                    {liberatingContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.labelHe}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="controls-row">
                  <button type="button" onClick={handleRandomApplicationStatement}>
                    <Shuffle size={14} aria-hidden="true" />
                    ׳׳©׳₪׳˜ ׳¨׳ ׳“׳•׳׳׳™
                  </button>
                  {onLoadPatientText && applicationStatement && (
                    <button type="button" onClick={() => onLoadPatientText(applicationStatement.statement)}>
                      <Brain size={14} aria-hidden="true" />
                      ׳˜׳¢׳ ׳׳׳¢׳‘׳“׳” ׳”׳¨׳׳©׳™׳×
                    </button>
                  )}
                </div>
              </div>

              <blockquote className="mindlab-quote">
                {applicationStatement?.statement ?? '׳׳™׳ ׳׳©׳₪׳˜׳™׳ ׳–׳׳™׳ ׳™׳ ׳‘׳”׳§׳©׳¨ ׳”׳–׳” ׳›׳¨׳’׳¢.'}
              </blockquote>

              <label className="mindlab-field">
                <span>׳”׳¨׳¦׳£ ׳©׳׳ ׳¢׳ ׳”׳׳©׳₪׳˜ ׳”׳–׳”</span>
                <textarea
                  rows={5}
                  className="mindlab-textarea"
                  value={applicationSequenceText}
                  onChange={(event) => {
                    setApplicationSequenceText(event.target.value)
                    if (applicationChecked) setApplicationChecked(false)
                    setStatusMessage('')
                  }}
                  placeholder="׳›׳×׳•׳‘/׳™ ׳›׳׳ ׳¨׳¦׳£ ׳׳׳ ׳©׳ ׳©׳׳׳•׳× ׳¢׳ ׳”׳׳©׳₪׳˜ ׳”׳¨׳ ׳“׳•׳׳׳™..."
                />
              </label>

              {applicationChecked && (
                <div
                  className={`simulator-feedback ${
                    applicationFeedback.score >= 75
                      ? 'is-good'
                      : applicationFeedback.score >= 55
                        ? 'is-mid'
                        : 'is-warn'
                  }`}
                >
                  <div className="simulator-feedback__head">
                    <div>
                      <strong>{applicationFeedback.labelHe}</strong>
                      <small>{applicationFeedback.score}/100</small>
                    </div>
                    <span className="simulator-feedback__badge">
                      <Sparkles size={14} aria-hidden="true" />
                      ׳™׳™׳©׳•׳ ׳¢׳ ׳©׳˜׳—
                    </span>
                  </div>
                  <ul className="simulator-feedback__list">
                    {applicationFeedback.notesHe.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </MenuSection>

          <div className="controls-row">
            <button type="button" onClick={handleCheckPractice}>
              <CheckCircle2 size={14} aria-hidden="true" />
              ׳‘׳“׳•׳§ ׳×׳¨׳’׳•׳
            </button>
            <button type="button" onClick={handleSaveSequence}>
              <Save size={14} aria-hidden="true" />
              ׳”׳•׳¡׳£ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳©׳׳™
            </button>
            <button
              type="button"
              onClick={() => {
                setFillAnswer('')
                setFillChecked(false)
                setOrderPool(createOrderPool(selectedPattern))
                setBuiltOrder([])
                setOrderChecked(false)
                setApplicationSequenceText('')
                setApplicationChecked(false)
                setStatusMessage('׳×׳¨׳’׳•׳ ׳”׳₪׳׳˜׳¨׳ ׳׳•׳₪׳¡.')
              }}
            >
              ׳׳™׳₪׳•׳¡ ׳×׳¨׳’׳•׳
            </button>
          </div>

          <div className="status-line" aria-live="polite">
            {statusMessage}
          </div>
        </div>
      )}
    </section>
  )
}

