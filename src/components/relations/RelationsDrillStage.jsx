import { EmotionPickerPill, MetricsStrip, TurnDeltaBadges } from './relationsShared'
import { getTurnOutcomeCopy } from './relationsUtils'

function stageLabel(activeTurnStage) {
  if (activeTurnStage === 'active.resolvedTurn') return 'תוצאה'
  if (activeTurnStage === 'active.questionSelected') return 'שאלה'
  if (activeTurnStage === 'active.nextTurn') return 'המשך'
  return 'מוכן'
}

export default function RelationsDrillStage({
  session,
  latestTurn,
  questionFamilies,
  selectedFamilyId,
  onSelectFamily,
  onAskQuestion,
  canAskQuestion,
  smartSuggestion,
  onApplySmartSuggestion,
  highlightedQuestionId,
  statusHint,
  currentEmotion,
  afterEmotion,
  openEmotionMenuId,
  setOpenEmotionMenuId,
  onSelectCurrentEmotion,
  onChangeCurrentIntensity,
  relationStateSummary,
  onSelectMetric,
  activeTurnStage,
  onContinue,
  onFinishSession,
  onToggleLikeTurn,
}) {
  const activeFamily =
    questionFamilies.find((family) => family.id === selectedFamilyId) ?? questionFamilies[0] ?? null
  const visibleQuestions = activeFamily?.questions.slice(0, 3) ?? []
  const nextTurnNumber = session.turns.length + 1

  return (
    <section className="relations-stage relations-stage--drill">
      <div className="relations-stage-banner panel-card">
        <div>
          <p className="dashboard-hero__eyebrow">תרגול</p>
          <h2>מה קורה עכשיו, איזו שאלה לבחור, ומה השתנה</h2>
          <p>{statusHint}</p>
        </div>
        <div className="relations-stage-banner__meta">
          <span>סבב {nextTurnNumber}</span>
          <span>{stageLabel(activeTurnStage)}</span>
        </div>
      </div>

      <div className="relations-drill-grid">
        <section className="panel-card relations-current-state-card">
          <div className="section-head">
            <div>
              <h3>המצב עכשיו</h3>
              <p>לפני השאלה הבאה, הנה התמונה שעליה עובדים.</p>
            </div>
          </div>

          <div className="relations-v2-elements-panel__emotion">
            <EmotionPickerPill
              title="רגש נוכחי"
              selection={currentEmotion}
              placeholder="בחר/י רגש"
              isOpen={openEmotionMenuId === 'current'}
              onToggle={() => setOpenEmotionMenuId((current) => (current === 'current' ? '' : 'current'))}
              onSelectEmotion={onSelectCurrentEmotion}
              onChangeIntensity={onChangeCurrentIntensity}
            />

            {afterEmotion?.id && (
              <div className="relations-v2-result-chip">
                <span>אחרי השאלה האחרונה</span>
                <strong>{afterEmotion.labelHe}</strong>
                <small>{afterEmotion.intensity}/5</small>
              </div>
            )}
          </div>

          <div className="relations-v3-state-grid">
            <article className="relations-v2-element-card">
              <span>הקשר</span>
              <strong>{session.scenario.contextF}</strong>
            </article>
            <article className="relations-v2-element-card">
              <span>מטרה</span>
              <strong>{session.scenario.goalG}</strong>
            </article>
            <article className="relations-v2-element-card">
              <span>אלמנט 1</span>
              <strong>{session.scenario.element1}</strong>
            </article>
            <article className="relations-v2-element-card">
              <span>אלמנט 2</span>
              <strong>{session.scenario.element2}</strong>
            </article>
            <article className="relations-v2-element-card relations-v2-element-card--wide">
              <span>הקשר ביניהם כרגע</span>
              <strong>{relationStateSummary}</strong>
            </article>
          </div>
        </section>

        <section className="panel-card relations-question-selection-panel">
          <div className="section-head">
            <div>
              <h3>בחר/י שאלה אחת</h3>
              <p>שלוש שאלות גלויות בלבד. בוחרים צעד אחד, לא מחפשים בלוח בקרה.</p>
            </div>
          </div>

          <div className="relations-v2-family-tabs" role="tablist" aria-label="משפחות שאלות">
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
                {visibleQuestions.map((question) => (
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
            <div className="relations-action-note">בחר/י רגש נוכחי כדי לפתוח את השאלות.</div>
          )}

          {smartSuggestion && (
            <div className="relations-smart-note">
              <p>אם צריך התחלה עדינה, אפשר להתחיל מכאן:</p>
              <button type="button" className="relations-v2-smart" onClick={onApplySmartSuggestion}>
                <span>הצעה לפתיחה</span>
                <strong>{smartSuggestion.renderedText}</strong>
              </button>
            </div>
          )}
        </section>

        {latestTurn && (
          <section className="panel-card relations-turn-outcome-card">
            <div className="section-head">
              <div>
                <h3>מה השתנה</h3>
                <p>{getTurnOutcomeCopy(latestTurn)}</p>
              </div>
              <button
                type="button"
                className={`relations-like-button ${latestTurn.liked ? 'is-liked' : ''}`}
                onClick={() => onToggleLikeTurn(latestTurn.id)}
                aria-pressed={latestTurn.liked}
              >
                {latestTurn.liked ? 'נשמר' : 'שמור'}
              </button>
            </div>

            <TurnDeltaBadges turn={latestTurn} />

            <div className="relations-turn-outcome-card__grid">
              <div className="relations-turn-outcome-card__block">
                <span>השאלה שנבחרה</span>
                <strong>{latestTurn.questionText}</strong>
              </div>
              <div className="relations-turn-outcome-card__block">
                <span>מה התרכך / נפתח / נשאר תקוע</span>
                <strong>{latestTurn.coachInsightText}</strong>
              </div>
            </div>

            <details className="relations-v2-details">
              <summary>למה זו הייתה שאלה טובה?</summary>
              <p>{latestTurn.clientAnswerText}</p>
            </details>

            <div className="relations-turn-outcome-card__actions">
              <button type="button" className="secondary-button" onClick={onContinue}>
                שאלה נוספת
              </button>
              <button type="button" onClick={onFinishSession}>
                סיום וסיכום
              </button>
            </div>
          </section>
        )}
      </div>

      <section className="panel-card panel-card--soft relations-drill-metrics">
        <div className="relations-drill-metrics__head">
          <strong>מדדים בקיצור</strong>
          <span>נשארים ברקע. לחיצה פותחת הסבר מלא.</span>
        </div>
        <MetricsStrip bars={session.bars} latestTurn={latestTurn} onSelectMetric={onSelectMetric} />
      </section>
    </section>
  )
}
