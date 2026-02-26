import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getLabConfig } from '../../data/labsConfig'

function buildAlchemyPreset(lab) {
  const title = lab?.titleHe ?? 'מעבדת אלכימיה'
  return {
    introHe: `לפני שנכנסים ל-${title}, מגדירים סטינג קצר: הקשר, מטרה וטון עבודה. אחר כך נשארים בפוקוס על התרגול.`,
    reviewTitleHe: 'סיכום סטינג לפני כניסה למעבדה',
    fields: [
      {
        id: 'context',
        labelHe: 'הקשר עבודה',
        type: 'select',
        defaultValue: 'work',
        options: [
          { value: 'work', labelHe: 'עבודה / צוות' },
          { value: 'client', labelHe: 'לקוחות / ניהול' },
          { value: 'relationship', labelHe: 'זוגיות / משפחה' },
          { value: 'self', labelHe: 'עבודה עצמית' },
        ],
        summaryLabelHe: 'הקשר',
      },
      {
        id: 'goal',
        labelHe: 'מטרת הסשן',
        type: 'select',
        defaultValue: 'clarity',
        options: [
          { value: 'clarity', labelHe: 'דיוק ניסוח' },
          { value: 'softening', labelHe: 'ריכוך בלי לטשטש' },
          { value: 'boundary', labelHe: 'גבול / בקשה ברורה' },
          { value: 'practice', labelHe: 'תרגול חופשי' },
        ],
        summaryLabelHe: 'מטרה',
      },
      {
        id: 'tone',
        labelHe: 'טון התחלה',
        type: 'select',
        defaultValue: 'balanced',
        options: [
          { value: 'balanced', labelHe: 'מאוזן' },
          { value: 'warm', labelHe: 'חם / אמפתי' },
          { value: 'direct', labelHe: 'ישיר / חד' },
        ],
        summaryLabelHe: 'טון',
      },
      {
        id: 'depth',
        labelHe: 'עומק תרגול',
        type: 'range',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        summaryLabelHe: 'עומק',
        formatValueHe: (value) => `רמה ${value}`,
      },
    ],
  }
}

const LAB_GATE_PRESETS = {
  'clean-questions': {
    introHe:
      'לפני שמתחילים לשאול, מגדירים מה המטרה של הסשן: שפה נקייה, Meta Model, עומק בדיקה וקצב עבודה.',
    reviewTitleHe: 'סיכום סטינג לשואל השאלות',
    fields: [
      {
        id: 'mode',
        labelHe: 'מצב פתיחה',
        type: 'select',
        defaultValue: 'clean',
        options: [
          { value: 'clean', labelHe: 'שפה נקייה' },
          { value: 'meta-model', labelHe: 'Meta Model' },
        ],
        summaryLabelHe: 'מצב',
      },
      {
        id: 'target',
        labelHe: 'פוקוס חקירה',
        type: 'select',
        defaultValue: 'clarify',
        options: [
          { value: 'clarify', labelHe: 'דיוק והבהרה' },
          { value: 'exceptions', labelHe: 'חריגים והרחבה' },
          { value: 'challenge', labelHe: 'אתגור עדין של הנחות' },
        ],
        summaryLabelHe: 'פוקוס',
      },
      {
        id: 'pace',
        labelHe: 'קצב עבודה',
        type: 'select',
        defaultValue: 'steady',
        options: [
          { value: 'slow', labelHe: 'איטי / קשוב' },
          { value: 'steady', labelHe: 'מאוזן' },
          { value: 'fast', labelHe: 'מהיר / סיעור' },
        ],
        summaryLabelHe: 'קצב',
      },
      {
        id: 'rounds',
        labelHe: 'עומק חקירה',
        type: 'range',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        summaryLabelHe: 'עומק',
        formatValueHe: (value) => `רמה ${value}`,
      },
    ],
  },
  'beyond-words': {
    introHe:
      'לפני הכניסה לתרגול הגוף, קובעים סטינג: אורך החזקת הקשב, פוקוס תרגול ועומק התבוננות.',
    reviewTitleHe: 'סיכום סטינג למעבדת מעבר למילים',
    fields: [
      {
        id: 'focusMode',
        labelHe: 'פוקוס תרגול',
        type: 'select',
        defaultValue: 'regulation',
        options: [
          { value: 'regulation', labelHe: 'ויסות והרגעה' },
          { value: 'somatic-reading', labelHe: 'קריאה סומטית' },
          { value: 'compare', labelHe: 'השוואת ניסוחים (A/B)' },
        ],
        summaryLabelHe: 'פוקוס',
      },
      {
        id: 'timer',
        labelHe: 'טיימר פתיחה',
        type: 'select',
        defaultValue: '60',
        options: [
          { value: '30', labelHe: '30 שניות' },
          { value: '60', labelHe: '60 שניות' },
          { value: '90', labelHe: '90 שניות' },
        ],
        summaryLabelHe: 'טיימר',
      },
      {
        id: 'bodyAttention',
        labelHe: 'קשב גוף',
        type: 'select',
        defaultValue: 'core',
        options: [
          { value: 'core', labelHe: 'מרכז גוף (גרון/חזה/בטן)' },
          { value: 'whole', labelHe: 'סריקה רחבה (כל הגוף)' },
          { value: 'edges', labelHe: 'ידיים/רגליים/קרקוע' },
        ],
        summaryLabelHe: 'קשב',
      },
      {
        id: 'depth',
        labelHe: 'עומק תרגול',
        type: 'range',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        summaryLabelHe: 'עומק',
        formatValueHe: (value) => `רמה ${value}`,
      },
    ],
  },
  'mind-liberating-language': {
    introHe:
      'לפני שנכנסים לכלי השחרור, מגדירים עדשה, סוג עבודה ועומק סשן כדי להיכנס ממוקד לפיצ׳רים.',
    reviewTitleHe: 'סיכום סטינג ל-Mind Liberating',
    fields: [
      {
        id: 'lens',
        labelHe: 'עדשת עבודה',
        type: 'select',
        defaultValue: 'therapist',
        options: [
          { value: 'therapist', labelHe: 'מטפל / קליניקה' },
          { value: 'coach', labelHe: "קואץ׳ / תנועה" },
          { value: 'self', labelHe: 'עבודה עצמית' },
          { value: 'relationship', labelHe: 'זוגיות / משפחה' },
        ],
        summaryLabelHe: 'עדשה',
      },
      {
        id: 'entryFeature',
        labelHe: 'לאן נכנסים קודם',
        type: 'select',
        defaultValue: 'workflow',
        options: [
          { value: 'workflow', labelHe: 'Workflow / תרגילים' },
          { value: 'simulator', labelHe: 'סימולטור שיחות' },
          { value: 'pattern-master', labelHe: 'מאסטר רצפים' },
          { value: 'history', labelHe: 'היסטוריה' },
        ],
        summaryLabelHe: 'כניסה',
      },
      {
        id: 'style',
        labelHe: 'סגנון עבודה',
        type: 'select',
        defaultValue: 'grounded',
        options: [
          { value: 'grounded', labelHe: 'קרקעי / יציב' },
          { value: 'soft', labelHe: 'רך / אמפתי' },
          { value: 'direct', labelHe: 'ישיר / מוביל' },
        ],
        summaryLabelHe: 'סגנון',
      },
      {
        id: 'depth',
        labelHe: 'עומק סשן',
        type: 'range',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        summaryLabelHe: 'עומק',
        formatValueHe: (value) => `רמה ${value}`,
      },
    ],
  },
}

function buildDefaultPreset(lab) {
  if (lab?.kind === 'alchemy') {
    return buildAlchemyPreset(lab)
  }

  return {
    introHe: 'לפני שמתחילים, מגדירים סטינג קצר ונכנסים לפיצ׳ר בפוקוס.',
    reviewTitleHe: 'סיכום סטינג',
    fields: [
      {
        id: 'goal',
        labelHe: 'מטרה',
        type: 'select',
        defaultValue: 'practice',
        options: [
          { value: 'practice', labelHe: 'תרגול' },
          { value: 'clarity', labelHe: 'בהירות' },
          { value: 'exploration', labelHe: 'חקירה' },
        ],
        summaryLabelHe: 'מטרה',
      },
      {
        id: 'depth',
        labelHe: 'עומק',
        type: 'range',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        summaryLabelHe: 'עומק',
        formatValueHe: (value) => `רמה ${value}`,
      },
    ],
  }
}

function getPresetForLab(lab) {
  if (!lab) return buildDefaultPreset(null)
  return LAB_GATE_PRESETS[lab.id] ?? buildDefaultPreset(lab)
}

function createDefaultFieldValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue
    return acc
  }, {})
}

function fieldLabelForValue(field, value) {
  if (field.type === 'range') {
    if (typeof field.formatValueHe === 'function') {
      return field.formatValueHe(value)
    }
    return String(value)
  }

  const option = field.options?.find((item) => String(item.value) === String(value))
  return option?.labelHe ?? String(value ?? '')
}

function clonePlainObject(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildSummaryItems(fields, values) {
  return fields.map((field) => ({
    id: field.id,
    labelHe: field.summaryLabelHe ?? field.labelHe,
    valueHe: fieldLabelForValue(field, values[field.id]),
  }))
}

function quickSummaryText(summaryItems) {
  return summaryItems
    .slice(0, 3)
    .map((item) => `${item.labelHe}: ${item.valueHe}`)
    .join(' · ')
}

function SetupField({ field, value, onChange }) {
  if (field.type === 'range') {
    return (
      <label className="lab-session-gate__field">
        <div className="lab-session-gate__fieldHead">
          <span>{field.labelHe}</span>
          <strong>{fieldLabelForValue(field, value)}</strong>
        </div>
        <input
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    )
  }

  return (
    <label className="lab-session-gate__field">
      <span>{field.labelHe}</span>
      <select value={String(value)} onChange={(event) => onChange(event.target.value)}>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.labelHe}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function LabSessionGate({ labId, children }) {
  const lab = getLabConfig(labId)
  const preset = getPresetForLab(lab)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState('setup')
  const [draftSettings, setDraftSettings] = useState(() => createDefaultFieldValues(preset.fields))
  const [activeSettings, setActiveSettings] = useState(null)

  useEffect(() => {
    const nextPreset = getPresetForLab(getLabConfig(labId))
    setWizardOpen(true)
    setWizardStep('setup')
    setDraftSettings(createDefaultFieldValues(nextPreset.fields))
    setActiveSettings(null)
  }, [labId])

  useEffect(() => {
    if (!wizardOpen || typeof window === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setWizardOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [wizardOpen])

  if (!lab) {
    return children
  }

  const workingSettings = activeSettings ?? draftSettings
  const summaryItems = buildSummaryItems(preset.fields, workingSettings)
  const draftSummaryItems = buildSummaryItems(preset.fields, draftSettings)
  const setupPreviewText = quickSummaryText(draftSummaryItems)

  const openWizard = () => {
    if (activeSettings) {
      setDraftSettings(clonePlainObject(activeSettings))
    }
    setWizardStep('setup')
    setWizardOpen(true)
  }

  const startWithCurrentSettings = () => {
    setActiveSettings(clonePlainObject(draftSettings))
    setWizardOpen(false)
  }

  const hasActiveSettings = Boolean(activeSettings)
  const activeSummaryText = hasActiveSettings
    ? quickSummaryText(summaryItems)
    : 'אין סטינג שמור כרגע. אפשר לעבוד כרגיל ולפתוח סטינג מעל התוכן בכל רגע.'

  const modalNode = wizardOpen ? (
    <div
      className="lab-session-gate__modal"
      role="presentation"
      onClick={() => setWizardOpen(false)}
    >
      <div
        className="lab-session-gate__modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`lab-session-gate-title-${lab.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lab-session-gate__modalHeader">
          <div>
            <div className="lab-session-gate__eyebrow">Wizard / {lab.titleHe}</div>
            <h3 id={`lab-session-gate-title-${lab.id}`}>
              {wizardStep === 'setup' ? 'בנה סטינג לתרגול' : preset.reviewTitleHe}
            </h3>
            <p>
              {wizardStep === 'setup'
                ? 'מגדירים כוונה וקונטקסט לפני כניסה לפיצ׳ר. אפשר לחזור ולעדכן בכל רגע.'
                : 'זה הסטינג שאיתו תעבוד/י עכשיו. לחיצה על "כניסה לתוכן" סוגרת את שכבת הפתיחה ומשאירה אותך במסך שמתחת.'}
            </p>
          </div>

          <button
            type="button"
            className="lab-session-gate__close"
            onClick={() => setWizardOpen(false)}
            aria-label="סגור חלון סטינג"
          >
            ×
          </button>
        </div>

        <div className="lab-session-gate__modalBody">
          <div className="lab-session-gate__stepMeta">
            <span>מסך {wizardStep === 'setup' ? '1' : '2'} / 2</span>
            <strong>{wizardStep === 'setup' ? setupPreviewText : quickSummaryText(draftSummaryItems)}</strong>
          </div>

          {wizardStep === 'setup' && (
            <div className="lab-session-gate__fields">
              {preset.fields.map((field) => (
                <SetupField
                  key={field.id}
                  field={field}
                  value={draftSettings[field.id]}
                  onChange={(nextValue) =>
                    setDraftSettings((current) => ({
                      ...current,
                      [field.id]: nextValue,
                    }))
                  }
                />
              ))}
            </div>
          )}

          {wizardStep === 'review' && (
            <div className="lab-session-gate__reviewGrid">
              <div className="lab-session-gate__reviewCard">
                <h4>סטינג שנבחר</h4>
                <ul>
                  {draftSummaryItems.map((item) => (
                    <li key={item.id}>
                      <span>{item.labelHe}</span>
                      <strong>{item.valueHe}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lab-session-gate__reviewCard">
                <h4>מה קורה עכשיו?</h4>
                <p>
                  התוכן של המעבדה כבר נמצא מתחת לשכבת הפתיחה. הסטינג יישמר כבאנר קצר
                  למעלה, ותוכל/י לפתוח את ה־wizard שוב בכל רגע.
                </p>
                <div className="lab-session-gate__reviewBadge">
                  {lab.titleEn} · Ready to enter
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lab-session-gate__modalFooter">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              if (wizardStep === 'review') {
                setWizardStep('setup')
                return
              }
              setWizardOpen(false)
            }}
          >
            {wizardStep === 'review' ? 'חזרה להגדרות' : 'סגור'}
          </button>

          {wizardStep === 'setup' ? (
            <button type="button" onClick={() => setWizardStep('review')}>
              המשך לסיכום
            </button>
          ) : (
            <button type="button" onClick={startWithCurrentSettings}>
              כניסה לתוכן
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="lab-session-gate-shell">
      <section className="panel-card panel-card--soft lab-session-gate__activeBanner">
        <div className="lab-session-gate__activeText">
          <div className="lab-session-gate__activeTitle">
            {hasActiveSettings ? `סטינג פעיל · ${lab.titleHe}` : `פתיחת סטינג · ${lab.titleHe}`}
          </div>
          <div className="lab-session-gate__activeSummary">{activeSummaryText}</div>
        </div>

        <div className="alchemy-card__actions">
          <button type="button" onClick={openWizard}>
            {hasActiveSettings ? 'ערוך סטינג' : 'פתח סטינג'}
          </button>
          {hasActiveSettings && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setActiveSettings(null)}
            >
              נקה סטינג
            </button>
          )}
        </div>
      </section>

      {children}

      {wizardOpen
        ? (typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode)
        : null}
    </div>
  )
}
