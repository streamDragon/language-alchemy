import { useEffect, useMemo, useState } from 'react'
import { getLabConfig } from '../../data/labsConfig'
import { useAppState } from '../../state/appStateContext'
import LabLessonPrompt from '../layout/LabLessonPrompt'
import MenuSection from '../layout/MenuSection'
import {
  activeChipBanksForTemplate,
  buildSentence,
  getBankBySlot,
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
import { emitAlchemySignal } from '../../utils/alchemySignals'

function cloneValue(value) {
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value))
  }
}

const SOURCE_TOPICS_BY_LAB = {
  phrasing: [
    {
      id: 'work-team',
      labelHe: 'עבודה וצוות',
      stories: [
        'כשמשנים החלטה בלי לעדכן אותי מראש, אני מגלה על זה מאוחר וזה פוגע ביכולת שלי להיערך.',
        'כשיש ציפייה לתשובה מיידית בלי הקשר, אני נהיה דרוך ומגיב פחות מדויק.',
        'כשמשימה מתרחבת תוך כדי עבודה בלי תיאום, אני מאבד פוקוס ומתקשה לעמוד בזמנים.',
      ],
    },
    {
      id: 'clients-management',
      labelHe: 'לקוחות וניהול',
      stories: [
        'לקוח מבקש שינוי ברגע האחרון ואני לא בטוח מה דחוף ומה יכול לחכות.',
        'המנהל מבקש עדכון תכוף מאוד וזה יוצר תחושת לחץ במקום בהירות.',
        'יש ריבוי ערוצים (וואטסאפ/מייל/שיחה) ואני מאבד רצף עבודה.',
      ],
    },
    {
      id: 'clinic-therapy',
      labelHe: 'קליניקה/טיפול',
      stories: [
        'מטופל מבקש מענה ארוך בין מפגשים ואני רוצה לשמור על גבולות ועדיין להיות אמפתי.',
        'מטופל מגיע עם טקסט פנימי נוקשה, ואני רוצה לעזור לו לעבור לניסוח יותר פתוח.',
      ],
    },
  ],
  empathy: [
    {
      id: 'relationship',
      labelHe: 'זוגיות וקשר',
      stories: [
        'כשאני משתף משהו אישי ומקבל עצה מיד, אני מרגיש שלא נשאר מקום למה שאני חווה.',
        'כשמדברים בטון חד בזמן ויכוח, אני נסגר ומתקשה להסביר מה חשוב לי.',
      ],
    },
    {
      id: 'family-parenting',
      labelHe: 'משפחה והורות',
      stories: [
        'כשיש הרבה משימות בבית בלי תיאום, אני מרגיש עומס ולא מצליח לבקש עזרה בזמן.',
        'כשילד מתנגד ואני מגיב מהר, אני מרגיש אחר כך שלא הייתי מדויק.',
      ],
    },
  ],
  boundaries: [
    {
      id: 'work-boundaries',
      labelHe: 'גבולות בעבודה',
      stories: [
        'מבקשים ממני משימה נוספת בזמן שאני כבר בעומס, ואני רוצה לסרב בלי לשרוף את הקשר.',
        'פניות אחרי שעות העבודה יוצרות אצלי דריכות מתמשכת ואני רוצה מסגרת ברורה.',
      ],
    },
    {
      id: 'social-boundaries',
      labelHe: 'גבולות אישיים',
      stories: [
        'מבקשים ממני טובה בתדירות גבוהה ואני רוצה להגיד לא בלי אשמה.',
        'יש שיחות ארוכות בזמן לא מתאים ואני צריך דרך לעצור בעדינות.',
      ],
    },
  ],
  default: [
    {
      id: 'general',
      labelHe: 'כללי',
      stories: [
        'יש לי סיטואציה שאני רוצה לנסח מחדש בצורה מדויקת יותר.',
        'אני רוצה לקחת משפט תקוע ולהפוך אותו לניסוח שמייצר יותר אפשרויות.',
      ],
    },
  ],
}

const PHRASING_TARGET_EMOTIONS = [
  { id: 'calm', labelHe: 'רוגע', icon: '◌' },
  { id: 'confidence', labelHe: 'ביטחון', icon: '▲' },
  { id: 'hope', labelHe: 'תקווה', icon: '✦' },
  { id: 'compassion', labelHe: 'חמלה', icon: '♡' },
  { id: 'anger', labelHe: 'כעס (מכוון)', icon: '■' },
  { id: 'shame', labelHe: 'בושה/אשמה', icon: '◍' },
  { id: 'fear', labelHe: 'פחד', icon: '△' },
  { id: 'confusion', labelHe: 'בלבול', icon: '◇' },
]

const PHRASING_EMOTION_STYLE_MAP = {
  calm: {
    warmth: 78,
    slotSelections: { opener: 'o1', quantifier: 'q2', request: 'r3', closing: 'cl2' },
    supportPhrase: 'ניקח רגע ונתקדם בקצב שאפשר לעמוד בו.',
    qualities: ['חם', 'עדין', 'מקרקע'],
  },
  confidence: {
    warmth: 44,
    slotSelections: { opener: 'o1', quantifier: '', request: 'r1', closing: '' },
    supportPhrase: '',
    qualities: ['ישיר', 'ברור', 'תמציתי'],
  },
  hope: {
    warmth: 74,
    slotSelections: { opener: 'o1', quantifier: 'q3', request: 'r3', closing: 'cl1' },
    supportPhrase: 'אפשר להתחיל בצעד קטן ומשם לדייק.',
    qualities: ['מזמין', 'עתידי', 'אפשרי'],
  },
  compassion: {
    warmth: 86,
    slotSelections: { opener: 'o2', quantifier: 'q2', request: 'r2', closing: 'cl2' },
    supportPhrase: 'אני מבין/ה שזה לא פשוט, וחשוב לי שנדבר על זה בעדינות.',
    qualities: ['חם', 'עדין', 'מכיל'],
  },
  anger: {
    warmth: 30,
    slotSelections: { opener: 'o1', quantifier: '', request: 'r1', closing: '' },
    supportPhrase: 'לא מתאים לי להמשיך בלי תיאום מראש.',
    qualities: ['חד', 'ברור', 'עם גבול'],
  },
  shame: {
    warmth: 82,
    slotSelections: { opener: 'o2', quantifier: 'q3', request: 'r3', closing: 'cl2' },
    supportPhrase: 'מותר לי לבקש את מה שיעזור לי, בלי לתקוף את עצמי.',
    qualities: ['מקבל', 'עדין', 'מרכך שיפוט'],
  },
  fear: {
    warmth: 76,
    slotSelections: { opener: 'o2', quantifier: 'q3', request: 'r3', closing: 'cl2' },
    supportPhrase: 'נלך בצעד קטן ובטוח כדי לשמור על יציבות.',
    qualities: ['בטוח', 'מדורג', 'מרגיע'],
  },
  confusion: {
    warmth: 58,
    slotSelections: { opener: 'o2', quantifier: '', request: 'r2', closing: 'cl1' },
    supportPhrase: 'בוא נבהיר שלושה דברים: מה חשוב, מה דחוף, ומה הצעד הבא.',
    qualities: ['מבהיר', 'מסודר', 'מזמין'],
  },
}

function applyPhrasingEmotionTarget({ lab, draft, emotionId }) {
  const style = PHRASING_EMOTION_STYLE_MAP[emotionId]
  if (!style || !lab || !draft) return draft

  const next = {
    ...draft,
    selectedBySlot: { ...(draft.selectedBySlot ?? {}) },
    warmth: style.warmth,
    updatedAt: new Date().toISOString(),
  }

  for (const [slotId, preferredChipIds] of Object.entries(style.slotSelections ?? {})) {
    const bank = getBankBySlot(lab, slotId)
    if (!bank) continue
    if (preferredChipIds === '') {
      next.selectedBySlot[slotId] = ''
      continue
    }

    const preferredList = Array.isArray(preferredChipIds) ? preferredChipIds : [preferredChipIds]
    const match = preferredList.find((chipId) => bank.chips.some((chip) => chip.id === chipId))
    if (match) {
      next.selectedBySlot[slotId] = match
    }
  }

  return next
}

function composeSentenceWithSupport(sentence, supportPhrase) {
  const base = String(sentence ?? '').trim()
  const extra = String(supportPhrase ?? '').trim()
  if (!extra) return base
  if (!base) return extra
  return `${base} ${extra}`.trim()
}

function phrasingEmotionCoachLine(emotionId) {
  const emotion = PHRASING_TARGET_EMOTIONS.find((item) => item.id === emotionId)
  const style = PHRASING_EMOTION_STYLE_MAP[emotionId]
  if (!emotion || !style) return ''
  return `כדי לייצר ${emotion.labelHe}, המשפט נעשה יותר: ${style.qualities.join(' / ')}`
}

function phrasingEmotionMatchInfo(lab, draft, emotionId) {
  const style = PHRASING_EMOTION_STYLE_MAP[emotionId]
  if (!lab || !draft || !style) return null

  let score = 0
  let max = 0

  for (const [slotId, preferredChipIds] of Object.entries(style.slotSelections ?? {})) {
    max += 1
    const preferredList = Array.isArray(preferredChipIds) ? preferredChipIds : [preferredChipIds]
    const selected = draft.selectedBySlot?.[slotId] ?? ''
    if (preferredList.includes(selected)) {
      score += 1
    }
  }

  max += 1
  const warmthDistance = Math.abs((draft.warmth ?? 50) - style.warmth)
  if (warmthDistance <= 12) score += 1
  else if (warmthDistance <= 24) score += 0.5

  const ratio = max ? score / max : 0
  return {
    ratio,
    levelHe: ratio >= 0.75 ? 'גבוה' : ratio >= 0.45 ? 'בינוני' : 'נמוך',
  }
}

function PhrasingEmotionWheel({ selectedEmotionId, onSelectEmotion }) {
  return (
    <div className="phrasing-emotion-wheel" role="list" aria-label="בחירת רגש יעד">
      <div className="phrasing-emotion-wheel__center">
        <span>רגש יעד</span>
        <strong>
          {PHRASING_TARGET_EMOTIONS.find((emotion) => emotion.id === selectedEmotionId)?.labelHe ?? 'בחר/י'}
        </strong>
      </div>

      {PHRASING_TARGET_EMOTIONS.map((emotion, index) => {
        const selected = emotion.id === selectedEmotionId
        return (
          <button
            key={emotion.id}
            type="button"
            role="listitem"
            className={`phrasing-emotion-slice ${selected ? 'is-selected' : ''}`}
            style={{ '--slot': index }}
            onClick={() => onSelectEmotion(emotion.id)}
            aria-pressed={selected}
          >
            <span className="phrasing-emotion-slice__icon" aria-hidden="true">{emotion.icon}</span>
            <span className="phrasing-emotion-slice__label">{emotion.labelHe}</span>
          </button>
        )
      })}
    </div>
  )
}

const ALCHEMY_UI_VERSION = 'Alchemy Lab UI • v2026.02.25-setup-modal'

function getSourceTopicsForLab(labId) {
  return SOURCE_TOPICS_BY_LAB[labId] ?? SOURCE_TOPICS_BY_LAB.default
}

function getSourceContext(draft) {
  return {
    patientText: draft?.sourceContext?.patientText ?? '',
    activeTopicId: draft?.sourceContext?.activeTopicId ?? '',
    customStoriesByTopic: draft?.sourceContext?.customStoriesByTopic ?? {},
  }
}

function sourceContextSummary(sourceContext) {
  const text = (sourceContext?.patientText ?? '').trim()
  if (!text) return ''
  return text.length > 64 ? `${text.slice(0, 64)}...` : text
}

function CoachPanel({ lab, draft, sentence, tags, sourceText }) {
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
      {sourceText ? <p className="coach-panel__source">מקור: "{sourceText}"</p> : null}
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
  const template = useMemo(() => (lab && draft ? getTemplate(lab, draft.templateId) : null), [lab, draft])
  const banks = useMemo(
    () => (lab && draft ? activeChipBanksForTemplate(lab, draft.templateId) : []),
    [lab, draft],
  )
  const sourceTopics = useMemo(() => getSourceTopicsForLab(lab?.id), [lab?.id])
  const sourceContext = useMemo(() => getSourceContext(draft), [draft])
  const sourceSummary = useMemo(() => sourceContextSummary(sourceContext), [sourceContext])
  const [openBankId, setOpenBankId] = useState('')
  const [openSourceTopicId, setOpenSourceTopicId] = useState('')
  const [isSourceContextMenuOpen, setIsSourceContextMenuOpen] = useState(() => !sourceSummary)
  const [isCoachMenuOpen, setIsCoachMenuOpen] = useState(false)
  const [isPreTaskModalOpen, setIsPreTaskModalOpen] = useState(false)
  const [phrasingTargetEmotionId, setPhrasingTargetEmotionId] = useState('')
  const [phrasingPreviewMode, setPhrasingPreviewMode] = useState('after')
  const [phrasingNeutralPreviewDraft, setPhrasingNeutralPreviewDraft] = useState(null)
  const resolvedOpenBankId =
    openBankId && banks.some((bank) => bank.id === openBankId) ? openBankId : ''
  const resolvedOpenSourceTopicId =
    openSourceTopicId && sourceTopics.some((topic) => topic.id === openSourceTopicId)
      ? openSourceTopicId
      : ''
  const showInlineSourceContextMenu = false

  useEffect(() => {
    if (!onSentenceChange || !lab || !draft) return
    onSentenceChange({
      labId,
      sentence,
      draft,
      tags,
    })
  }, [onSentenceChange, lab, draft, sentence, tags, labId])

  useEffect(() => {
    if (!isPreTaskModalOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPreTaskModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreTaskModalOpen])

  const isPhrasingLab = lab?.id === 'phrasing'
  const phrasingTargetEmotion = useMemo(
    () => PHRASING_TARGET_EMOTIONS.find((emotion) => emotion.id === phrasingTargetEmotionId) ?? null,
    [phrasingTargetEmotionId],
  )
  const phrasingStyle = phrasingTargetEmotion ? PHRASING_EMOTION_STYLE_MAP[phrasingTargetEmotion.id] : null
  const phrasingCoachText = useMemo(
    () => (isPhrasingLab && phrasingTargetEmotion ? phrasingEmotionCoachLine(phrasingTargetEmotion.id) : ''),
    [isPhrasingLab, phrasingTargetEmotion],
  )
  const phrasingMatch = useMemo(
    () => (isPhrasingLab && lab && draft && phrasingTargetEmotion ? phrasingEmotionMatchInfo(lab, draft, phrasingTargetEmotion.id) : null),
    [isPhrasingLab, lab, draft, phrasingTargetEmotion],
  )
  const phrasingNeutralSentence = useMemo(() => {
    if (!isPhrasingLab || !lab || !phrasingNeutralPreviewDraft) return ''
    return buildSentence(lab, phrasingNeutralPreviewDraft)
  }, [isPhrasingLab, lab, phrasingNeutralPreviewDraft])
  const phrasingAfterSentence = useMemo(
    () => (isPhrasingLab ? composeSentenceWithSupport(sentence, phrasingStyle?.supportPhrase) : sentence),
    [isPhrasingLab, sentence, phrasingStyle?.supportPhrase],
  )

  if (!lab || !draft) {
    return null
  }

  const activeCount = tokens.filter((token) => token.value).length
  const warmthVariantKey = draft.warmth <= 33 ? 'cold' : draft.warmth <= 66 ? 'neutral' : 'warm'
  const chipTextForCurrentWarmth = (chip) =>
    chip.textVariants ? chip.textVariants[warmthVariantKey] ?? chip.textVariants.neutral : ''

  const setDraft = (updater) => {
    updateDraft(labId, updater)
    setStatusMessage('')
  }

  const sentenceForActions = isPhrasingLab && phrasingTargetEmotion ? phrasingAfterSentence : sentence
  const sentenceForPreview =
    isPhrasingLab && phrasingTargetEmotion && phrasingPreviewMode === 'before'
      ? (phrasingNeutralSentence || sentence)
      : sentenceForActions

  const handleSelectPhrasingTargetEmotion = (emotionId) => {
    if (!isPhrasingLab || !lab || !draft) return
    const emotion = PHRASING_TARGET_EMOTIONS.find((item) => item.id === emotionId)
    if (!emotion) return

    const beforeSnapshot = cloneValue(draft)
    const nextDraft = applyPhrasingEmotionTarget({ lab, draft: beforeSnapshot, emotionId })

    setPhrasingTargetEmotionId(emotionId)
    setPhrasingPreviewMode('after')
    setPhrasingNeutralPreviewDraft(beforeSnapshot)
    setDraft(() => nextDraft)
    emitAlchemySignal('copied', { message: `רגש יעד נבחר: ${emotion.labelHe}` })
    setStatusMessage(`רגש יעד: ${emotion.labelHe}. הצ'יפים וחום הניסוח עודכנו אוטומטית.`)
  }

  const activeSourceTopicId = sourceContext.activeTopicId || sourceTopics[0]?.id || ''

  const sourceTopicsWithStories = sourceTopics.map((topic) => {
    const customStories = Array.isArray(sourceContext.customStoriesByTopic?.[topic.id])
      ? sourceContext.customStoriesByTopic[topic.id]
      : []
    const customItems = customStories.map((text, index) => ({
      id: `custom-${topic.id}-${index}`,
      text,
      origin: 'custom',
    }))
    const seedItems = (topic.stories ?? []).map((text, index) => ({
      id: `seed-${topic.id}-${index}`,
      text,
      origin: 'seed',
    }))

    return {
      ...topic,
      items: [...customItems, ...seedItems],
      customCount: customItems.length,
    }
  })

  const updateSourceContext = (updater) => {
    setDraft((current) => {
      const previous = getSourceContext(current)
      const next =
        typeof updater === 'function'
          ? updater(previous)
          : { ...previous, ...(updater ?? {}) }

      return {
        ...current,
        sourceContext: next,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const handleSourceTextChange = (value) => {
    updateSourceContext((current) => ({
      ...current,
      patientText: value,
    }))
  }

  const handleSourceTextBlur = () => {
    if ((sourceContext.patientText ?? '').trim()) {
      setIsSourceContextMenuOpen(false)
    }
  }

  const handleSelectSourceTopic = (topicId) => {
    updateSourceContext((current) => ({
      ...current,
      activeTopicId: topicId,
    }))
    setOpenSourceTopicId(topicId)
  }

  const loadStoryIntoSource = (storyText, mode = 'replace', topicId) => {
    const safeStory = String(storyText ?? '').trim()
    if (!safeStory) return

    updateSourceContext((current) => {
      const currentText = (current.patientText ?? '').trim()
      const nextText =
        mode === 'append' && currentText
          ? `${currentText}\n\n${safeStory}`
          : safeStory

      return {
        ...current,
        activeTopicId: topicId || current.activeTopicId || activeSourceTopicId,
        patientText: nextText,
      }
    })
    setOpenSourceTopicId('')
    setIsSourceContextMenuOpen(false)
    emitAlchemySignal('success', {
      message: mode === 'append' ? 'הסיפור נוסף לטקסט המקור.' : 'הסיפור נטען לטקסט המקור.',
    })
    setStatusMessage(mode === 'append' ? 'הסיפור נוסף לטקסט המקור.' : 'הסיפור נטען לטקסט המקור.')
  }

  const handleSaveSourceAsStory = () => {
    const storyText = (sourceContext.patientText ?? '').trim()
    if (!storyText) {
      setStatusMessage('הדביקו קודם משפט מטופל או סיפור קצר.')
      return
    }

    const topicId = activeSourceTopicId || sourceTopics[0]?.id
    if (!topicId) return

    let wasAdded = false
    updateSourceContext((current) => {
      const customStoriesByTopic = { ...(current.customStoriesByTopic ?? {}) }
      const existing = Array.isArray(customStoriesByTopic[topicId]) ? customStoriesByTopic[topicId] : []
      if (existing.includes(storyText)) {
        return {
          ...current,
          activeTopicId: topicId,
        }
      }
      customStoriesByTopic[topicId] = [storyText, ...existing].slice(0, 12)
      wasAdded = true
      return {
        ...current,
        activeTopicId: topicId,
        customStoriesByTopic,
      }
    })

    setOpenSourceTopicId(topicId)
    setIsSourceContextMenuOpen(false)
    emitAlchemySignal(wasAdded ? 'saved' : 'success', {
      message: wasAdded ? 'נשמר סיפור חדש בנושא הפעיל.' : 'הסיפור כבר קיים בנושא הפעיל.',
    })
    setStatusMessage(wasAdded ? 'נשמר סיפור חדש בנושא הפעיל.' : 'הסיפור כבר קיים בנושא הפעיל.')
  }

  const clearSourceText = () => {
    updateSourceContext((current) => ({
      ...current,
      patientText: '',
    }))
    setIsSourceContextMenuOpen(true)
    setStatusMessage('טקסט המקור נוקה.')
  }

  const handleSelectBankChip = (bank, chipId) => {
    setDraft((current) => selectChipInDraft(current, bank.slotId, chipId))
    setOpenBankId('')
  }

  const handleClearOptionalBank = (bank) => {
    setDraft((current) => ({
      ...current,
      selectedBySlot: {
        ...current.selectedBySlot,
        [bank.slotId]: '',
      },
      updatedAt: new Date().toISOString(),
    }))
    setOpenBankId('')
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sentenceForActions)
        emitAlchemySignal('copied', { message: 'הניסוח הועתק ללוח.' })
        setStatusMessage('הניסוח הועתק ללוח.')
        return
      }
      setStatusMessage('העתקה אוטומטית לא זמינה. אפשר להעתיק ידנית מהתצוגה.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח.')
    }
  }

  const handleSaveFavorite = () => {
    if (!sentenceForActions || sentenceForActions === lab.preview?.emptyTextHe) {
      setStatusMessage('אין עדיין ניסוח לשמירה.')
      return
    }

    saveFavorite({
      labId,
      sentenceText: sentenceForActions,
      draftSnapshot: cloneValue(draft),
      tags,
    })
    emitAlchemySignal('saved', { message: 'נשמר למועדפים.' })
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
          {!compact && (
            <button
              type="button"
              onClick={() => {
                setIsSourceContextMenuOpen(true)
                setIsPreTaskModalOpen(true)
              }}
            >
              טרום-משימה / סטינג
            </button>
          )}
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

      {!compact && (
        <div className="alchemy-version-banner" aria-label="גרסה נוכחית">
          <div className="alchemy-version-banner__main">
            <strong>גרסה נוכחית</strong>
            <span>{ALCHEMY_UI_VERSION}</span>
          </div>
          <div className="alchemy-version-banner__meta">
            <span>טרום-משימה וסטינג במודאל</span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setIsSourceContextMenuOpen(true)
                setIsPreTaskModalOpen(true)
              }}
            >
              פתח טרום-משימה
            </button>
          </div>
        </div>
      )}

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

      {!compact && showInlineSourceContextMenu && (
        <MenuSection
          title="טקסט מקור / משפט המטופל"
          subtitle={
            sourceSummary ||
            'הדביקו משפט של מטופל/לקוח או טענו סיפור מוכן מתוך נושא רלוונטי.'
          }
          badgeText={sourceSummary ? 'פעיל' : 'אופציונלי'}
          isOpen={isSourceContextMenuOpen}
          onToggle={() => setIsSourceContextMenuOpen((current) => !current)}
          className="source-context-menu"
        >
          <div className="source-context-panel">
            <label className="source-context-panel__field">
              <span>משפט המטופל / סיפור מקור</span>
              <textarea
                className="source-context-panel__textarea"
                rows={4}
                placeholder="לדוגמה: 'כל פעם שמשנים לי דברים ברגע האחרון אני נסגר ולא יודע מאיפה להתחיל...'"
                value={sourceContext.patientText}
                onChange={(event) => handleSourceTextChange(event.target.value)}
                onBlur={handleSourceTextBlur}
              />
            </label>

            <div className="source-context-panel__toolbar">
              <label className="source-context-panel__topic">
                <span>נושא פעיל</span>
                <select
                  value={activeSourceTopicId}
                  onChange={(event) => handleSelectSourceTopic(event.target.value)}
                >
                  {sourceTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.labelHe}
                    </option>
                  ))}
                </select>
              </label>
              <div className="source-context-panel__actions">
                <button type="button" onClick={() => setIsSourceContextMenuOpen(false)}>
                  סיימתי מקור
                </button>
                <button type="button" onClick={handleSaveSourceAsStory}>
                  שמור כסיפור
                </button>
                <button type="button" onClick={clearSourceText}>
                  נקה טקסט
                </button>
              </div>
            </div>

            <div className="source-context-topics">
              {sourceTopicsWithStories.map((topic) => (
                <MenuSection
                  key={topic.id}
                  title={topic.labelHe}
                  subtitle={`${topic.items.length} סיפורים זמינים`}
                  badgeText={topic.customCount ? `+${topic.customCount} שלי` : 'מוכן'}
                  compact
                  isOpen={resolvedOpenSourceTopicId === topic.id}
                  onToggle={() =>
                    setOpenSourceTopicId((currentId) => (currentId === topic.id ? '' : topic.id))
                  }
                  className="source-topic-menu"
                >
                  <div className="source-story-list">
                    {topic.items.map((item) => (
                      <div key={item.id} className="source-story-item">
                        <button
                          type="button"
                          className="source-story-item__text"
                          onClick={() => {
                            setOpenSourceTopicId(topic.id)
                            loadStoryIntoSource(item.text, 'replace', topic.id)
                          }}
                          title="טען לטקסט המקור"
                        >
                          {item.text}
                        </button>
                        <div className="source-story-item__meta">
                          <span
                            className={`source-story-item__badge ${
                              item.origin === 'custom' ? 'is-custom' : ''
                            }`}
                          >
                            {item.origin === 'custom' ? 'שלי' : 'מוכן'}
                          </span>
                          <button
                            type="button"
                            className="source-story-item__append"
                            onClick={() => {
                              setOpenSourceTopicId(topic.id)
                              loadStoryIntoSource(item.text, 'append', topic.id)
                            }}
                          >
                            הוסף
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </MenuSection>
              ))}
            </div>
          </div>
        </MenuSection>
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
        {isPhrasingLab && (
          <div className="phrasing-preview-tools" aria-label="כוונון רגש יעד">
            <div className="phrasing-preview-tools__head">
              <span>כוונון רגש יעד</span>
              {phrasingMatch ? (
                <span className={`phrasing-match-badge phrasing-match-badge--${phrasingMatch.levelHe}`}>
                  התאמה: {phrasingMatch.levelHe}
                </span>
              ) : (
                <span className="phrasing-match-badge">בחר/י יעד</span>
              )}
            </div>
            <PhrasingEmotionWheel
              selectedEmotionId={phrasingTargetEmotionId}
              onSelectEmotion={handleSelectPhrasingTargetEmotion}
            />
            {phrasingCoachText ? <p className="phrasing-preview-tools__coach">{phrasingCoachText}</p> : null}
            {phrasingTargetEmotion && (
              <div className="phrasing-preview-toggle" role="tablist" aria-label="תצוגת לפני ואחרי">
                <button
                  type="button"
                  role="tab"
                  aria-selected={phrasingPreviewMode === 'before'}
                  className={phrasingPreviewMode === 'before' ? 'is-active' : ''}
                  onClick={() => setPhrasingPreviewMode('before')}
                >
                  לפני
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={phrasingPreviewMode === 'after'}
                  className={phrasingPreviewMode === 'after' ? 'is-active' : ''}
                  onClick={() => setPhrasingPreviewMode('after')}
                >
                  אחרי
                </button>
              </div>
            )}
          </div>
        )}
        <p className={`preview-panel__sentence ${phrasingPreviewMode === 'before' ? 'is-comparison' : ''}`}>
          {sentenceForPreview}
        </p>
        {isPhrasingLab && phrasingTargetEmotion && phrasingPreviewMode === 'before' ? (
          <p className="preview-panel__source">תצוגת "לפני" לשם השוואה. העתקה/שמירה משתמשות בגרסת "אחרי".</p>
        ) : null}
        {sourceSummary ? <p className="preview-panel__source">מתוך מקור: {sourceSummary}</p> : null}
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

      <div className="chip-bank-panel">
          {banks.map((bank) => {
            const selectedChipId = draft.selectedBySlot?.[bank.slotId]
            const selectedChip = bank.chips.find((chip) => chip.id === selectedChipId)
            const selectedText = selectedChip ? chipTextForCurrentWarmth(selectedChip) : ''

            return (
              <MenuSection
                key={bank.id}
                title={bank.labelHe}
                subtitle={selectedText || undefined}
                badgeText={selectedChipId ? 'נבחר' : bank.optional ? 'אופציונלי' : 'לבחירה'}
                isOpen={resolvedOpenBankId === bank.id}
                onToggle={() => setOpenBankId((currentId) => (currentId === bank.id ? '' : bank.id))}
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
                          onClick={() => handleSelectBankChip(bank, chip.id)}
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
                        onClick={() => handleClearOptionalBank(bank)}
                      >
                        ללא
                      </button>
                    )}
                  </div>
                </div>
              </MenuSection>
            )
          })}
      </div>

      {showCoach && (
        <MenuSection
          title="פאנל מאמן"
          subtitle="טיפים, הקשר וניסוח פעיל"
          badgeText="אופציונלי"
          isOpen={isCoachMenuOpen}
          onToggle={() => setIsCoachMenuOpen((current) => !current)}
          className="coach-panel-menu"
        >
          <CoachPanel
            lab={lab}
            draft={draft}
            sentence={sentenceForActions}
            tags={tags}
            sourceText={sourceSummary}
          />
        </MenuSection>
      )}

      {!compact && isPreTaskModalOpen && (
        <div
          className="alchemy-pretask-modal"
          role="dialog"
          aria-modal="true"
          aria-label="טרום-משימה וסטינג"
        >
          <div className="alchemy-pretask-modal__backdrop" onClick={() => setIsPreTaskModalOpen(false)} />
          <div className="alchemy-pretask-modal__card">
            <div className="alchemy-pretask-modal__header">
              <div>
                <div className="alchemy-pretask-modal__eyebrow">טרום-משימה / סטינג</div>
                <h3>הגדרות לפני כניסה למשימה</h3>
                <p>מגדירים הקשר, טקסט מקור, וסיפורי דוגמה. אחר כך סוגרים ונשארים בפוקוס על המשימה.</p>
              </div>
              <button
                type="button"
                className="alchemy-pretask-modal__close"
                onClick={() => setIsPreTaskModalOpen(false)}
                aria-label="סגור חלון טרום-משימה"
              >
                ×
              </button>
            </div>

            <div className="alchemy-pretask-modal__body">
              {lab.route && <LabLessonPrompt labId={lab.id} />}

              <MenuSection
                title="טקסט מקור / משפט המטופל"
                subtitle={
                  sourceSummary ||
                  'הדביקו משפט של מטופל/לקוח או טענו סיפור מוכן מתוך נושא רלוונטי.'
                }
                badgeText={sourceSummary ? 'פעיל' : 'אופציונלי'}
                isOpen={isSourceContextMenuOpen}
                onToggle={() => setIsSourceContextMenuOpen((current) => !current)}
                className="source-context-menu"
              >
                <div className="source-context-panel">
                  <label className="source-context-panel__field">
                    <span>משפט המטופל / סיפור מקור</span>
                    <textarea
                      className="source-context-panel__textarea"
                      rows={4}
                      placeholder="לדוגמה: 'כל פעם שמשנים לי דברים ברגע האחרון אני נסגר ולא יודע מאיפה להתחיל...'"
                      value={sourceContext.patientText}
                      onChange={(event) => handleSourceTextChange(event.target.value)}
                      onBlur={handleSourceTextBlur}
                    />
                  </label>

                  <div className="source-context-panel__toolbar">
                    <label className="source-context-panel__topic">
                      <span>נושא פעיל</span>
                      <select
                        value={activeSourceTopicId}
                        onChange={(event) => handleSelectSourceTopic(event.target.value)}
                      >
                        {sourceTopics.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.labelHe}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="source-context-panel__actions">
                      <button type="button" onClick={() => setIsSourceContextMenuOpen(false)}>
                        סיימתי מקור
                      </button>
                      <button type="button" onClick={handleSaveSourceAsStory}>
                        שמור כסיפור
                      </button>
                      <button type="button" onClick={clearSourceText}>
                        נקה טקסט
                      </button>
                    </div>
                  </div>

                  <div className="source-context-topics">
                    {sourceTopicsWithStories.map((topic) => (
                      <MenuSection
                        key={topic.id}
                        title={topic.labelHe}
                        subtitle={`${topic.items.length} סיפורים זמינים`}
                        badgeText={topic.customCount ? `+${topic.customCount} שלי` : 'מוכן'}
                        compact
                        isOpen={resolvedOpenSourceTopicId === topic.id}
                        onToggle={() =>
                          setOpenSourceTopicId((currentId) => (currentId === topic.id ? '' : topic.id))
                        }
                        className="source-topic-menu"
                      >
                        <div className="source-story-list">
                          {topic.items.map((item) => (
                            <div key={item.id} className="source-story-item">
                              <button
                                type="button"
                                className="source-story-item__text"
                                onClick={() => {
                                  setOpenSourceTopicId(topic.id)
                                  loadStoryIntoSource(item.text, 'replace', topic.id)
                                }}
                                title="טען לטקסט המקור"
                              >
                                {item.text}
                              </button>
                              <div className="source-story-item__meta">
                                <span
                                  className={`source-story-item__badge ${
                                    item.origin === 'custom' ? 'is-custom' : ''
                                  }`}
                                >
                                  {item.origin === 'custom' ? 'שלי' : 'מוכן'}
                                </span>
                                <button
                                  type="button"
                                  className="source-story-item__append"
                                  onClick={() => {
                                    setOpenSourceTopicId(topic.id)
                                    loadStoryIntoSource(item.text, 'append', topic.id)
                                  }}
                                >
                                  הוסף
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </MenuSection>
                    ))}
                  </div>
                </div>
              </MenuSection>
            </div>

            <div className="alchemy-pretask-modal__footer">
              <div className="alchemy-pretask-modal__status">
                {sourceSummary ? `מקור פעיל: ${sourceSummary}` : 'אין מקור פעיל עדיין (אופציונלי)'}
              </div>
              <div className="alchemy-pretask-modal__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsPreTaskModalOpen(false)}
                >
                  סגור
                </button>
                <button type="button" onClick={() => setIsPreTaskModalOpen(false)}>
                  כניסה למשימה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
