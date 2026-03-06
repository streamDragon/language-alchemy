import {
  relationsArchetypeOptions,
  relationsContextOptions,
} from '../../data/relationsLabData'
import { EmotionPickerPill } from './relationsShared'

export default function RelationsSetupStage({
  setupValues,
  scenarioPreview,
  emotionSelection,
  openEmotionMenuId,
  setOpenEmotionMenuId,
  onChangeField,
  onSelectEmotion,
  onChangeEmotionIntensity,
  onRefreshScenario,
  onStartSession,
}) {
  return (
    <section className="relations-stage relations-stage--setup">
      <div className="relations-stage__intro panel-card">
        <p className="dashboard-hero__eyebrow">Setup</p>
        <h2>מפרקים קשר תקוע בין שני דברים</h2>
        <p>
          מה עושים כאן? בוחרים הקשר, מנסחים פוקוס קצר, ובודקים איזו שאלה יוצרת יותר מרווח,
          פחות עומס, ויותר אפשרות לתנועה.
        </p>
        <div className="relations-stage__intro-points">
          <div>
            <strong>מתי זה מועיל?</strong>
            <span>כשיש תקיעות, לולאה, מתח, או שיחה שחוזרת לאותו מקום.</span>
          </div>
          <div>
            <strong>מה הצעד הראשון?</strong>
            <span>בחר/י הקשר, סוג תקיעות, ורגש נוכחי. אחר כך יוצאים ישר לסבב ראשון.</span>
          </div>
        </div>
      </div>

      <div className="relations-setup-grid">
        <section className="panel-card relations-setup-form">
          <div className="section-head">
            <div>
              <h3>על מה עובדים?</h3>
              <p>Setup קצר בלבד. בלי ארכיון, בלי stats, ובלי מידע משני.</p>
            </div>
          </div>

          <div className="relations-setup-form__fields">
            <label className="relations-field">
              <span>הקשר</span>
              <select
                value={setupValues.contextId}
                onChange={(event) => onChangeField('contextId', event.target.value)}
              >
                {relationsContextOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.labelHe}</option>
                ))}
              </select>
            </label>

            <label className="relations-field">
              <span>איזו תקיעות בוחנים?</span>
              <select
                value={setupValues.archetypeId}
                onChange={(event) => onChangeField('archetypeId', event.target.value)}
              >
                {relationsArchetypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.labelHe}</option>
                ))}
              </select>
            </label>

            <label className="relations-field relations-field--wide">
              <span>ניסוח קצר של הבעיה</span>
              <textarea
                rows="3"
                value={setupValues.focusText}
                onChange={(event) => onChangeField('focusText', event.target.value)}
                placeholder="מה מרגיש תקוע, מתוח, או חוזר על עצמו?"
              />
            </label>

            <label className="relations-field relations-field--wide">
              <span>מטרה רכה אחת לסשן</span>
              <input
                type="text"
                value={setupValues.softGoal}
                onChange={(event) => onChangeField('softGoal', event.target.value)}
                placeholder="למשל: קצת יותר מרווח, שאלה אחת טובה, פחות עומס"
              />
            </label>
          </div>

          <div className="relations-setup-form__emotion">
            <EmotionPickerPill
              title="רגש נוכחי"
              selection={emotionSelection}
              placeholder="בחר/י רגש"
              isOpen={openEmotionMenuId === 'current'}
              onToggle={() => setOpenEmotionMenuId((current) => (current === 'current' ? '' : 'current'))}
              onSelectEmotion={onSelectEmotion}
              onChangeIntensity={onChangeEmotionIntensity}
            />
          </div>
        </section>

        <section className="panel-card relations-setup-preview">
          <div className="section-head">
            <div>
              <h3>התמונה שנעבוד איתה</h3>
              <p>שני האלמנטים המרכזיים כבר גלויים לפני תחילת הסבב.</p>
            </div>
          </div>

          {scenarioPreview && (
            <>
              <div className="relations-setup-preview__grid">
                <article className="relations-v2-element-card">
                  <span>הקשר</span>
                  <strong>{scenarioPreview.contextF}</strong>
                </article>
                <article className="relations-v2-element-card">
                  <span>מטרה</span>
                  <strong>{setupValues.softGoal.trim() || scenarioPreview.goalG}</strong>
                </article>
                <article className="relations-v2-element-card">
                  <span>אלמנט 1</span>
                  <strong>{scenarioPreview.element1}</strong>
                </article>
                <article className="relations-v2-element-card">
                  <span>אלמנט 2</span>
                  <strong>{scenarioPreview.element2}</strong>
                </article>
                <article className="relations-v2-element-card relations-v2-element-card--wide">
                  <span>הקשר ביניהם כרגע</span>
                  <strong>{scenarioPreview.initialRelationR0.shortHe}</strong>
                </article>
              </div>

              {setupValues.focusText.trim() && (
                <div className="relations-setup-preview__focus">
                  <span>פוקוס לסשן</span>
                  <strong>{setupValues.focusText}</strong>
                </div>
              )}

              <div className="relations-setup-preview__actions">
                <button type="button" className="secondary-button" onClick={onRefreshScenario}>
                  החלף/י דוגמה
                </button>
                <button
                  type="button"
                  onClick={onStartSession}
                  disabled={!emotionSelection?.id}
                >
                  התחל/י סבב ראשון
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  )
}
