import { useState } from 'react'
import './App.css'

const SENTENCE_TYPES = [
  {
    id: 'assertive-boundary',
    label: 'גבול / בקשה',
    status: 'active',
    description: 'ניסוח אסרטיבי שמציין הקשר, תחושה, צורך ובקשה ברורה.',
    slots: [
      {
        id: 'context',
        label: 'זמן',
        options: [
          'כשזה קורה שוב',
          'בזמן שיחה מול כולם',
          'כשמשנים החלטה בלי לעדכן',
          'כשקובעים עבורי בלי לשאול',
        ],
      },
      {
        id: 'feeling',
        label: 'רגש/תחושה',
        options: [
          'אני מרגישה מוצפת',
          'אני מרגיש לחוץ',
          'אני מרגישה לא מובנת',
          'אני מרגיש מתוח',
        ],
      },
      {
        id: 'need',
        label: 'צורך',
        options: [
          'חשוב לי להבין מה הוחלט',
          'אני צריך יותר בהירות',
          'חשוב לי שיכבדו את הקצב שלי',
          'אני צריכה זמן לעבד לפני תשובה',
        ],
      },
      {
        id: 'request',
        label: 'בקשה/גבול',
        options: [
          'אז בבקשה לדבר איתי בכבוד',
          'אז בבקשה לעדכן אותי לפני שינוי',
          'ולא להרים עליי קול',
          'ובואו נסכם צעד אחד בכל פעם',
        ],
      },
      {
        id: 'closing',
        label: 'סיום',
        options: [
          'ככה אוכל לשתף פעולה',
          'כדי שאוכל להגיב בצורה טובה יותר',
          'וזה יעזור לי להישאר נוכח',
          'וככה נוכל להתקדם יחד',
        ],
      },
    ],
    previewOrder: ['context', 'feeling', 'need', 'request', 'closing'],
    guidance:
      'לחצו על צ׳יפים כדי להרכיב ניסוח. אפשר לבטל בחירה בלחיצה חוזרת ולהשאיר מקום פתוח.',
  },
  {
    id: 'emotion-reflection',
    label: 'שיקוף רגש',
    status: 'coming-soon',
  },
  {
    id: 'request-soft',
    label: 'בקשה רכה',
    status: 'coming-soon',
  },
  {
    id: 'clarifying-question',
    label: 'שאלת הבהרה',
    status: 'coming-soon',
  },
]

function createInitialSelections() {
  return Object.fromEntries(
    SENTENCE_TYPES.map((type) => {
      if (type.status !== 'active') {
        return [type.id, {}]
      }

      const defaults = Object.fromEntries(
        type.slots.map((slot) => [slot.id, slot.options[0] ?? '']),
      )

      return [type.id, defaults]
    }),
  )
}

function App() {
  const [activeTypeId, setActiveTypeId] = useState('assertive-boundary')
  const [selectionsByType, setSelectionsByType] = useState(createInitialSelections)
  const [statusMessage, setStatusMessage] = useState('')

  const activeType = SENTENCE_TYPES.find((type) => type.id === activeTypeId)
  const activeSelections = selectionsByType[activeTypeId] ?? {}

  if (!activeType || activeType.status !== 'active') {
    return null
  }

  const activeCount = activeType.previewOrder.filter(
    (slotId) => activeSelections[slotId],
  ).length

  const slotMap = Object.fromEntries(activeType.slots.map((slot) => [slot.id, slot]))

  const sentenceParts = activeType.previewOrder
    .map((slotId) => activeSelections[slotId]?.trim())
    .filter(Boolean)

  const finalSentence = sentenceParts.length
    ? `${sentenceParts.join(', ')}.`
    : 'בחרו רכיבים כדי לבנות משפט.'

  const updateSelection = (slotId, value) => {
    setSelectionsByType((previous) => {
      const currentTypeSelections = previous[activeTypeId] ?? {}
      const nextValue = currentTypeSelections[slotId] === value ? '' : value

      return {
        ...previous,
        [activeTypeId]: {
          ...currentTypeSelections,
          [slotId]: nextValue,
        },
      }
    })
  }

  const resetSelections = () => {
    setSelectionsByType((previous) => ({
      ...previous,
      [activeTypeId]: Object.fromEntries(
        activeType.slots.map((slot) => [slot.id, slot.options[0] ?? '']),
      ),
    }))
    setStatusMessage('בוצע איפוס לנוסח הבסיס.')
  }

  const shuffleSelections = () => {
    setSelectionsByType((previous) => ({
      ...previous,
      [activeTypeId]: Object.fromEntries(
        activeType.slots.map((slot) => {
          const randomIndex = Math.floor(Math.random() * slot.options.length)
          return [slot.id, slot.options[randomIndex]]
        }),
      ),
    }))
    setStatusMessage('נבחרו רכיבים אקראיים.')
  }

  const saveDraft = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(finalSentence)
        setStatusMessage('הנוסח הועתק ללוח.')
        return
      }

      setStatusMessage('הנוסח מוכן. אפשר להעתיק ידנית מהתצוגה.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח. אפשר להעתיק ידנית.')
    }
  }

  return (
    <div className="app-shell" dir="rtl">
      <main className="trainer-frame">
        <header className="trainer-header">
          <button type="button" className="ghost-button">
            חזרה לאפליקציה הראשית
          </button>
          <h1>Sentence Morpher</h1>
        </header>

        <section className="trainer-content">
          <div className="intro-card">
            <h2>מעבדת שינוי ניסוח</h2>
            <p>
              זהו מסך הבסיס שממנו נתחיל. בהמשך נוסיף סוגי משפטים נוספים
              (שאלות, שיקוף רגשות, בקשות ועוד) בלי לשנות את מבנה העבודה.
            </p>
          </div>

          <div className="type-switcher" role="tablist" aria-label="סוגי משפטים">
            {SENTENCE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                role="tab"
                className={`type-pill ${
                  type.id === activeTypeId ? 'type-pill--active' : ''
                } ${type.status !== 'active' ? 'type-pill--disabled' : ''}`}
                aria-selected={type.id === activeTypeId}
                disabled={type.status !== 'active'}
                onClick={() => setActiveTypeId(type.id)}
              >
                <span>{type.label}</span>
                {type.status !== 'active' && <small>בקרוב</small>}
              </button>
            ))}
          </div>

          <section className="builder-card" aria-labelledby="builder-title">
            <div className="builder-head">
              <div>
                <h3 id="builder-title">משפט גדול</h3>
                <p>{activeType.description}</p>
              </div>
              <div className="head-actions">
                <button type="button" onClick={resetSelections}>
                  איפוס
                </button>
                <button type="button" onClick={shuffleSelections}>
                  בחירה אקראית
                </button>
              </div>
            </div>

            <div className="sentence-preview" aria-live="polite">
              <div className="preview-label">תצוגת נוסח</div>
              <div className="token-stream">
                {activeType.previewOrder.map((slotId) => {
                  const slot = slotMap[slotId]
                  const value = activeSelections[slotId]
                  const isEmpty = !value

                  return (
                    <span
                      key={slotId}
                      className={`preview-token ${isEmpty ? 'preview-token--empty' : ''}`}
                      title={slot.label}
                    >
                      {value || `[${slot.label}]`}
                    </span>
                  )
                })}
              </div>
              <p className="preview-text">{finalSentence}</p>
            </div>

            <div className="builder-meta">
              <span>{activeCount}/{activeType.previewOrder.length} רכיבים פעילים</span>
              <span>{activeType.guidance}</span>
            </div>

            <div className="chip-groups">
              {activeType.slots.map((slot) => (
                <section key={slot.id} className="chip-group">
                  <h4>{slot.label}</h4>
                  <div className="chips-wrap">
                    {slot.options.map((option) => {
                      const isSelected = activeSelections[slot.id] === option

                      return (
                        <button
                          key={option}
                          type="button"
                          className={`chip ${isSelected ? 'chip--selected' : ''}`}
                          onClick={() => updateSelection(slot.id, option)}
                          aria-pressed={isSelected}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="builder-footer">
              <button type="button" className="save-button" onClick={saveDraft}>
                שמור נוסח זמני
              </button>
              <div className="status-line" aria-live="polite">
                {statusMessage}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
