import { useState } from 'react'
import { getLabConfig } from '../data/labsConfig'
import LabLessonPrompt from '../components/layout/LabLessonPrompt'
import { emitAlchemySignal } from '../utils/alchemySignals'

function copyText(text, setStatus) {
  if (!text) return
  navigator.clipboard
    ?.writeText(text)
    .then(() => {
      emitAlchemySignal('copied', { message: 'Copied to clipboard.' })
      setStatus('הטקסט הועתק ללוח.')
    })
    .catch(() => setStatus('לא הצלחתי להעתיק ללוח.'))
}

export default function CleanQuestionsPage() {
  const lab = getLabConfig('clean-questions')
  const [modeId, setModeId] = useState(lab.modes[0].id)
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    lab.modes.find((mode) => mode.id === 'meta-model')?.categories?.[0]?.id ?? '',
  )
  const [statusMessage, setStatusMessage] = useState('')

  const mode = lab.modes.find((item) => item.id === modeId)
  const categories =
    lab.modes.find((item) => item.id === 'meta-model')?.categories ?? []
  const category = categories.find((item) => item.id === selectedCategoryId) ?? categories[0]

  return (
    <section className="page-stack">
      <section className="alchemy-card">
        <div className="alchemy-card__head">
          <div>
            <h2>{lab.titleHe}</h2>
            <p>{lab.descriptionHe}</p>
          </div>
        </div>

        <LabLessonPrompt labId={lab.id} />

        <div className="template-switcher" role="tablist" aria-label="מצב עבודה">
          {lab.modes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={`template-pill ${item.id === modeId ? 'is-active' : ''}`}
              aria-selected={item.id === modeId}
              onClick={() => {
                setModeId(item.id)
                setStatusMessage('')
              }}
            >
              {item.labelHe}
            </button>
          ))}
        </div>

        <div className="panel-card">
          <p className="muted-text">{mode.introHe}</p>

          {mode.id === 'clean' && (
            <div className="stack-list">
              {mode.stems.map((stem) => (
                <div key={stem} className="stack-list__item stack-list__item--row">
                  <p>{stem}</p>
                  <button type="button" onClick={() => copyText(stem, setStatusMessage)}>
                    העתק
                  </button>
                </div>
              ))}
            </div>
          )}

          {mode.id === 'meta-model' && (
            <div className="questioner-grid">
              <div className="callout-line">
                <strong>Rules Structure (Breen):</strong> UQ / MO / C&amp;E / CE
              </div>
              <div className="chip-bank">
                <h3>קטגוריות</h3>
                <div className="chips-wrap">
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`chip ${category?.id === item.id ? 'chip--selected' : ''}`}
                      onClick={() => setSelectedCategoryId(item.id)}
                      aria-pressed={category?.id === item.id}
                    >
                      {item.labelHe}
                    </button>
                  ))}
                </div>
              </div>

              {category && (
                <div className="panel-card panel-card--soft">
                  <h3>{category.labelHe}</h3>
                  <p>{category.descriptionHe}</p>
                  <div className="callout-line">
                    <strong>שאלת מפתח:</strong> {category.primaryQuestion}
                  </div>

                  <div className="stack-list">
                    {category.stems.map((stem) => (
                      <div key={stem} className="stack-list__item stack-list__item--row">
                        <p>{stem}</p>
                        <button type="button" onClick={() => copyText(stem, setStatusMessage)}>
                          העתק
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="triple-grid">
                    <div className="mini-card">
                      <h4>היקף</h4>
                      <ul>
                        {category.scopeTimeSpace.scope.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mini-card">
                      <h4>זמן</h4>
                      <ul>
                        {category.scopeTimeSpace.time.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mini-card">
                      <h4>מרחב</h4>
                      <ul>
                        {category.scopeTimeSpace.space.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="related-row">
                    <span>קטגוריות קשורות:</span>
                    <div className="chips-wrap">
                      {category.relatedCategoryIds.map((relatedId) => {
                        const related = categories.find((item) => item.id === relatedId)
                        return (
                          <button
                            key={relatedId}
                            type="button"
                            className="chip"
                            onClick={() => setSelectedCategoryId(relatedId)}
                          >
                            {related?.labelHe ?? relatedId}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="status-line" aria-live="polite">
            {statusMessage}
          </div>
        </div>
      </section>
    </section>
  )
}
