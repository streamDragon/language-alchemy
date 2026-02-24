import { useEffect, useMemo, useState } from 'react'
import { getLabConfig } from '../../data/labsConfig'
import { useAppState } from '../../state/appStateContext'
import LabLessonPrompt from '../layout/LabLessonPrompt'
import MenuSection from '../layout/MenuSection'
import {
  activeChipBanksForTemplate,
  buildSentence,
  getTemplate,
  previewTokens,
  randomizeAlchemyDraft,
  resetAlchemyDraft,
  selectChipInDraft,
  selectedTagsForDraft,
  setTemplateInDraft,
  setWarmthInDraft,
  warmthLabelHe,
} from '../../utils/alchemy'

function cloneValue(value) {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value))
  }
}

function CoachPanel({ lab, draft, sentence, tags }) {
  const warmthLabel = warmthLabelHe(draft?.warmth ?? 50)
  const tips = []

  if ((draft?.warmth ?? 50) <= 33) {
    tips.push('הטון כרגע פורמלי/קשיח. בדקו אם 10–15 נקודות חום משפרות קשב בלי לפגוע בגבול.')
  }
  if (tags.some((tag) => tag.includes('overdurf') || tag.includes('possibility'))) {
    tips.push('יש כאן פתיחת אפשרות/כמתים. שימו לב אם זה מקל על קליטה או מחליש בהירות.')
  }
  if (lab.id === 'boundaries') {
    tips.push('גבול טוב נשמע ברור גם בטון חם. בדקו שה"לא" נשאר מפורש.')
  }
  if (lab.id === 'empathy') {
    tips.push('במשפטי "אני", שימרו על רגש + הקשר + צורך + בקשה בלי פרשנות על הצד השני.')
  }
  if (!tips.length) {
    tips.push('נסו להחליף רכיב אחד בלבד ולבדוק איך כל המשפט משתנה.')
  }

  return (
    <aside className="coach-panel" aria-label="Coach panel">
      <div className="coach-panel__title">פאנל מאמן</div>
      <div className="coach-panel__meta">חום נוכחי: {warmthLabel}</div>
      <p className="coach-panel__sentence">{sentence}</p>
      <ul className="coach-panel__tips">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </aside>
  )
}

export default function AlchemyEngine({
  labId,
  compact = false,
  showCoach = true,
  onSentenceChange,
}) {
  const lab = getLabConfig(labId)
  const { getDraft, updateDraft, saveFavorite, setLastVisitedLab } = useAppState()
  const [statusMessage, setStatusMessage] = useState('')

  const draft = getDraft(labId)

  useEffect(() => {
    if (lab?.route) {
      setLastVisitedLab(lab.id)
    }
  }, [lab, setLastVisitedLab])

  const sentence = useMemo(() => (lab && draft ? buildSentence(lab, draft) : ''), [lab, draft])
  const tokens = useMemo(() => (lab && draft ? previewTokens(lab, draft) : []), [lab, draft])
  const tags = useMemo(() => (lab && draft ? selectedTagsForDraft(lab, draft) : []), [lab, draft])

  useEffect(() => {
    if (!onSentenceChange || !lab || !draft) return
    onSentenceChange({
      labId,
      sentence,
      draft,
      tags,
    })
  }, [onSentenceChange, lab, draft, sentence, tags, labId])

  if (!lab || !draft) {
    return null
  }

  const template = getTemplate(lab, draft.templateId)
  const banks = activeChipBanksForTemplate(lab, draft.templateId)

  const activeCount = tokens.filter((token) => token.value).length
  const warmthVariantKey = draft.warmth <= 33 ? 'cold' : draft.warmth <= 66 ? 'neutral' : 'warm'
  const chipTextForCurrentWarmth = (chip) =>
    chip.textVariants ? chip.textVariants[warmthVariantKey] ?? chip.textVariants.neutral : ''

  const setDraft = (updater) => {
    updateDraft(labId, updater)
    setStatusMessage('')
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sentence)
        setStatusMessage('הניסוח הועתק ללוח.')
        return
      }
      setStatusMessage('העתקה אוטומטית לא זמינה. אפשר להעתיק ידנית מהתצוגה.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח.')
    }
  }

  const handleSaveFavorite = () => {
    if (!sentence || sentence === lab.preview?.emptyTextHe) {
      setStatusMessage('אין עדיין ניסוח לשמירה.')
      return
    }

    saveFavorite({
      labId,
      sentenceText: sentence,
      draftSnapshot: cloneValue(draft),
      tags,
    })
    setStatusMessage('נשמר למועדפים.')
  }

  return (
    <section className={`alchemy-card ${compact ? 'alchemy-card--compact' : ''}`}>
      <div className="alchemy-card__head">
        <div>
          <h2>{lab.titleHe}</h2>
          <p>{lab.descriptionHe}</p>
        </div>
        <div className="alchemy-card__actions">
          <button type="button" onClick={() => setDraft((current) => resetAlchemyDraft(lab, current))}>
            איפוס
          </button>
          <button
            type="button"
            onClick={() => setDraft((current) => randomizeAlchemyDraft(lab, current))}
          >
            אלכימאי אקראי
          </button>
        </div>
      </div>

      {!compact && lab.route && <LabLessonPrompt labId={lab.id} />}

      {lab.templates.length > 1 && (
        <div className="template-switcher" role="tablist" aria-label="מבני ניסוח">
          {lab.templates.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={draft.templateId === option.id}
              className={`template-pill ${draft.templateId === option.id ? 'is-active' : ''}`}
              onClick={() =>
                setDraft((current) => setTemplateInDraft(lab, current, option.id))
              }
            >
              {option.labelHe}
            </button>
          ))}
        </div>
      )}

      <div className="preview-panel">
        <div className="preview-panel__top">
          <span className="preview-panel__label">תצוגת ניסוח</span>
          <span className="preview-panel__count">
            {activeCount}/{template?.slotOrder.length ?? 0} רכיבים פעילים
          </span>
        </div>
        <div className="preview-panel__tokens">
          {tokens.map((token) => (
            <span
              key={token.slotId}
              className={`preview-token ${token.empty ? 'is-empty' : ''}`}
              title={token.labelHe}
            >
              {token.value || `[${token.labelHe}]`}
            </span>
          ))}
        </div>
        <p className="preview-panel__sentence">{sentence}</p>
        <div className="controls-row">
          <button type="button" onClick={handleCopy}>
            העתק
          </button>
          <button type="button" onClick={handleSaveFavorite}>
            שמור למועדפים
          </button>
          <label className="warmth-control">
            <span>חום ניסוח: {warmthLabelHe(draft.warmth)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={draft.warmth}
              onChange={(event) =>
                setDraft((current) =>
                  setWarmthInDraft(current, Number(event.target.value)),
                )
              }
              aria-label="Warmth slider"
            />
            <small>קר / ניטרלי / חם</small>
          </label>
        </div>
        <div className="status-line" aria-live="polite">
          {statusMessage}
        </div>
      </div>

      <div className="alchemy-layout">
        <div className="chip-bank-panel">
          {banks.map((bank, index) => {
            const selectedChipId = draft.selectedBySlot?.[bank.slotId]
            const selectedChip = bank.chips.find((chip) => chip.id === selectedChipId)
            const selectedText = selectedChip ? chipTextForCurrentWarmth(selectedChip) : ''

            return (
              <MenuSection
                key={bank.id}
                title={bank.labelHe}
                subtitle={selectedText || undefined}
                badgeText={selectedChipId ? 'Selected' : bank.optional ? 'Optional' : 'Choose'}
                defaultOpen={index === 0 || Boolean(selectedChipId)}
                compact={compact}
              >
                <div className="chip-bank chip-bank--embedded">
                  <div className="chips-wrap">
                    {bank.chips.map((chip) => {
                      const text = chipTextForCurrentWarmth(chip)
                      const selected = selectedChipId === chip.id
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          className={`chip ${selected ? 'chip--selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() =>
                            setDraft((current) => selectChipInDraft(current, bank.slotId, chip.id))
                          }
                        >
                          {text}
                        </button>
                      )
                    })}
                    {bank.optional && (
                      <button
                        type="button"
                        className={`chip ${!selectedChipId ? 'chip--selected' : ''}`}
                        aria-pressed={!selectedChipId}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            selectedBySlot: {
                              ...current.selectedBySlot,
                              [bank.slotId]: '',
                            },
                            updatedAt: new Date().toISOString(),
                          }))
                        }
                      >
                        None
                      </button>
                    )}
                  </div>
                </div>
              </MenuSection>
            )
          })}
        </div>

        {showCoach && <CoachPanel lab={lab} draft={draft} sentence={sentence} tags={tags} />}
      </div>
    </section>
  )
}
