import { TurnDeltaBadges } from './relationsShared'
import { formatTurnDeltaLine } from './relationsUtils'

export default function RelationsReviewStage({
  session,
  finalInsight,
  workedQuestion,
  likedTurns,
  onCopyFavoritePack,
  onDownloadFavoritePack,
  onStartNewSession,
  onToggleLikeTurn,
}) {
  const latestTurn = session.turns.at(-1) ?? null
  const turnCount = session.turns.length
  const savedCount = likedTurns.length

  return (
    <section className="relations-stage relations-stage--review">
      <section className="relations-summary">
        <div className="relations-summary__head">
          <div>
            <p className="dashboard-hero__eyebrow">סיכום</p>
            <h2>מה השתנה ומה לקחת הלאה</h2>
            <p>{finalInsight}</p>
            <div className="relations-review-stats" aria-label="סיכום סשן">
              <span>{turnCount} שאלות בסשן</span>
              <span>{savedCount} נשמרו לחזרה</span>
            </div>
          </div>
          <div className="relations-summary__actions">
            <button type="button" className="secondary-button" onClick={onCopyFavoritePack}>
              העתק שאלות שמורות
            </button>
            <button type="button" className="secondary-button" onClick={onDownloadFavoritePack}>
              הורד תקציר
            </button>
            <button type="button" className="relations-finish-button" onClick={onStartNewSession}>
              סשן חדש
            </button>
          </div>
        </div>

        <div className="relations-review-grid">
          <section className="panel-card">
            <h3>השאלה שהכי עבדה</h3>
            {workedQuestion ? (
              <div className="relations-review-card">
                <strong>{workedQuestion.questionText}</strong>
                <TurnDeltaBadges turn={workedQuestion} />
                <p>{workedQuestion.coachInsightText}</p>
              </div>
            ) : (
              <p className="muted-text">לא נשאלה עדיין שאלה בסשן הזה.</p>
            )}
          </section>

          <section className="panel-card">
            <h3>המצב עכשיו</h3>
            {latestTurn ? (
              <div className="relations-review-card">
                <strong>{latestTurn.emotionAfter?.labelHe ?? 'ללא שינוי רגשי מובהק'}</strong>
                <p>
                  {latestTurn.emotionAfter?.intensity
                    ? `עוצמה ${latestTurn.emotionAfter.intensity}/5`
                    : 'הרגש עוד לא עודכן.'}
                </p>
                <p>
                  {latestTurn.relationShift?.relationLabelBefore} ← →{' '}
                  {latestTurn.relationShift?.relationLabelAfter}
                </p>
                <TurnDeltaBadges turn={latestTurn} />
              </div>
            ) : (
              <p className="muted-text">עדיין אין תוצאה רגשית לסיכום.</p>
            )}
          </section>

          <section className="panel-card">
            <h3>מה לקחת לשיחה אמיתית</h3>
            {latestTurn ? (
              <div className="relations-review-card">
                <strong>{latestTurn.familyLabelHe}</strong>
                <p>{latestTurn.questionText}</p>
                <p>{latestTurn.coachInsightText}</p>
              </div>
            ) : (
              <p className="muted-text">סבב ראשון ייצור גם takeaway מעשי.</p>
            )}
          </section>
        </div>

        <div className="relations-review-collapses">
          <details className="relations-review-collapse panel-card">
            <summary>
              <span>ציר ההתקדמות</span>
              <small>{turnCount ? `${turnCount} צעדים` : 'עדיין ריק'}</small>
            </summary>
            <div className="relations-review-collapse__body">
              <div className="relations-timeline">
                {turnCount ? (
                  session.turns.map((turn, index) => (
                    <div key={turn.id} className="relations-timeline-item">
                      <div className="relations-timeline-item__title">
                        שאלה #{index + 1}: {turn.questionText}
                      </div>
                      <div className="relations-timeline-item__meta">{formatTurnDeltaLine(turn)}</div>
                    </div>
                  ))
                ) : (
                  <p className="muted-text">לא נשאלו שאלות בסשן הזה.</p>
                )}
              </div>
            </div>
          </details>

          <details className="relations-review-collapse panel-card">
            <summary>
              <span>כל השאלות מהסשן</span>
              <small>{savedCount ? `${savedCount} נשמרו` : 'אפשר לשמור כאן'}</small>
            </summary>
            <div className="relations-review-collapse__body">
              {turnCount ? (
                <div className="relations-favorites-list">
                  {session.turns.map((turn) => (
                    <div key={turn.id} className="relations-favorite-item">
                      <div className="relations-favorite-item__head">
                        <strong>{turn.questionText}</strong>
                        <button
                          type="button"
                          className={`relations-like-button ${turn.liked ? 'is-liked' : ''}`}
                          onClick={() => onToggleLikeTurn(turn.id)}
                          aria-pressed={turn.liked}
                        >
                          {turn.liked ? 'נשמר' : 'שמור'}
                        </button>
                      </div>
                      <small>{turn.familyLabelHe}</small>
                      <p>{formatTurnDeltaLine(turn)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-text">עדיין אין שאלות בסשן הזה.</p>
              )}

              {savedCount === 0 && turnCount > 0 && (
                <p className="muted-text">אפשר לשמור כאן את השאלות שתרצה/י לחזור אליהן.</p>
              )}
            </div>
          </details>
        </div>
      </section>
    </section>
  )
}
