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

const SOURCE_TOPICS_BY_LAB = {
  phrasing: [
    {
      id: 'work-team',
      labelHe: '׳¢׳‘׳•׳“׳” ׳•׳¦׳•׳•׳×',
      stories: [
        '׳›׳©׳׳©׳ ׳™׳ ׳”׳—׳׳˜׳” ׳‘׳׳™ ׳׳¢׳“׳›׳ ׳׳•׳×׳™ ׳׳¨׳׳©, ׳׳ ׳™ ׳׳’׳׳” ׳¢׳ ׳–׳” ׳׳׳•׳—׳¨ ׳•׳–׳” ׳₪׳•׳’׳¢ ׳‘׳™׳›׳•׳׳× ׳©׳׳™ ׳׳”׳™׳¢׳¨׳.',
        '׳›׳©׳™׳© ׳¦׳™׳₪׳™׳™׳” ׳׳×׳©׳•׳‘׳” ׳׳™׳™׳“׳™׳× ׳‘׳׳™ ׳”׳§׳©׳¨, ׳׳ ׳™ ׳ ׳”׳™׳” ׳“׳¨׳•׳ ׳•׳׳’׳™׳‘ ׳₪׳—׳•׳× ׳׳“׳•׳™׳§.',
        '׳›׳©׳׳©׳™׳׳” ׳׳×׳¨׳—׳‘׳× ׳×׳•׳ ׳›׳“׳™ ׳¢׳‘׳•׳“׳” ׳‘׳׳™ ׳×׳™׳׳•׳, ׳׳ ׳™ ׳׳׳‘׳“ ׳₪׳•׳§׳•׳¡ ׳•׳׳×׳§׳©׳” ׳׳¢׳׳•׳“ ׳‘׳–׳׳ ׳™׳.',
      ],
    },
    {
      id: 'clients-management',
      labelHe: '׳׳§׳•׳—׳•׳× ׳•׳ ׳™׳”׳•׳',
      stories: [
        '׳׳§׳•׳— ׳׳‘׳§׳© ׳©׳™׳ ׳•׳™ ׳‘׳¨׳’׳¢ ׳”׳׳—׳¨׳•׳ ׳•׳׳ ׳™ ׳׳ ׳‘׳˜׳•׳— ׳׳” ׳“׳—׳•׳£ ׳•׳׳” ׳™׳›׳•׳ ׳׳—׳›׳•׳×.',
        '׳”׳׳ ׳”׳ ׳׳‘׳§׳© ׳¢׳“׳›׳•׳ ׳×׳›׳•׳£ ׳׳׳•׳“ ׳•׳–׳” ׳™׳•׳¦׳¨ ׳×׳—׳•׳©׳× ׳׳—׳¥ ׳‘׳׳§׳•׳ ׳‘׳”׳™׳¨׳•׳×.',
        '׳™׳© ׳¨׳™׳‘׳•׳™ ׳¢׳¨׳•׳¦׳™׳ (׳•׳•׳׳˜׳¡׳׳₪/׳׳™׳™׳/׳©׳™׳—׳”) ׳•׳׳ ׳™ ׳׳׳‘׳“ ׳¨׳¦׳£ ׳¢׳‘׳•׳“׳”.',
      ],
    },
    {
      id: 'clinic-therapy',
      labelHe: '׳§׳׳™׳ ׳™׳§׳”/׳˜׳™׳₪׳•׳',
      stories: [
        '׳׳˜׳•׳₪׳ ׳׳‘׳§׳© ׳׳¢׳ ׳” ׳׳¨׳•׳ ׳‘׳™׳ ׳׳₪׳’׳©׳™׳ ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳©׳׳•׳¨ ׳¢׳ ׳’׳‘׳•׳׳•׳× ׳•׳¢׳“׳™׳™׳ ׳׳”׳™׳•׳× ׳׳׳₪׳×׳™.',
        '׳׳˜׳•׳₪׳ ׳׳’׳™׳¢ ׳¢׳ ׳˜׳§׳¡׳˜ ׳₪׳ ׳™׳׳™ ׳ ׳•׳§׳©׳”, ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳¢׳–׳•׳¨ ׳׳• ׳׳¢׳‘׳•׳¨ ׳׳ ׳™׳¡׳•׳— ׳™׳•׳×׳¨ ׳₪׳×׳•׳—.',
      ],
    },
  ],
  empathy: [
    {
      id: 'relationship',
      labelHe: '׳–׳•׳’׳™׳•׳× ׳•׳§׳©׳¨',
      stories: [
        '׳›׳©׳׳ ׳™ ׳׳©׳×׳£ ׳׳©׳”׳• ׳׳™׳©׳™ ׳•׳׳§׳‘׳ ׳¢׳¦׳” ׳׳™׳“, ׳׳ ׳™ ׳׳¨׳’׳™׳© ׳©׳׳ ׳ ׳©׳׳¨ ׳׳§׳•׳ ׳׳׳” ׳©׳׳ ׳™ ׳—׳•׳•׳”.',
        '׳›׳©׳׳“׳‘׳¨׳™׳ ׳‘׳˜׳•׳ ׳—׳“ ׳‘׳–׳׳ ׳•׳™׳›׳•׳—, ׳׳ ׳™ ׳ ׳¡׳’׳¨ ׳•׳׳×׳§׳©׳” ׳׳”׳¡׳‘׳™׳¨ ׳׳” ׳—׳©׳•׳‘ ׳׳™.',
      ],
    },
    {
      id: 'family-parenting',
      labelHe: '׳׳©׳₪׳—׳” ׳•׳”׳•׳¨׳•׳×',
      stories: [
        '׳›׳©׳™׳© ׳”׳¨׳‘׳” ׳׳©׳™׳׳•׳× ׳‘׳‘׳™׳× ׳‘׳׳™ ׳×׳™׳׳•׳, ׳׳ ׳™ ׳׳¨׳’׳™׳© ׳¢׳•׳׳¡ ׳•׳׳ ׳׳¦׳׳™׳— ׳׳‘׳§׳© ׳¢׳–׳¨׳” ׳‘׳–׳׳.',
        '׳›׳©׳™׳׳“ ׳׳×׳ ׳’׳“ ׳•׳׳ ׳™ ׳׳’׳™׳‘ ׳׳”׳¨, ׳׳ ׳™ ׳׳¨׳’׳™׳© ׳׳—׳¨ ׳›׳ ׳©׳׳ ׳”׳™׳™׳×׳™ ׳׳“׳•׳™׳§.',
      ],
    },
  ],
  boundaries: [
    {
      id: 'work-boundaries',
      labelHe: '׳’׳‘׳•׳׳•׳× ׳‘׳¢׳‘׳•׳“׳”',
      stories: [
        '׳׳‘׳§׳©׳™׳ ׳׳׳ ׳™ ׳׳©׳™׳׳” ׳ ׳•׳¡׳₪׳× ׳‘׳–׳׳ ׳©׳׳ ׳™ ׳›׳‘׳¨ ׳‘׳¢׳•׳׳¡, ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳¡׳¨׳‘ ׳‘׳׳™ ׳׳©׳¨׳•׳£ ׳׳× ׳”׳§׳©׳¨.',
        '׳₪׳ ׳™׳•׳× ׳׳—׳¨׳™ ׳©׳¢׳•׳× ׳”׳¢׳‘׳•׳“׳” ׳™׳•׳¦׳¨׳•׳× ׳׳¦׳׳™ ׳“׳¨׳™׳›׳•׳× ׳׳×׳׳©׳›׳× ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳¡׳’׳¨׳× ׳‘׳¨׳•׳¨׳”.',
      ],
    },
    {
      id: 'social-boundaries',
      labelHe: '׳’׳‘׳•׳׳•׳× ׳׳™׳©׳™׳™׳',
      stories: [
        '׳׳‘׳§׳©׳™׳ ׳׳׳ ׳™ ׳˜׳•׳‘׳” ׳‘׳×׳“׳™׳¨׳•׳× ׳’׳‘׳•׳”׳” ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳’׳™׳“ ׳׳ ׳‘׳׳™ ׳׳©׳׳”.',
        '׳™׳© ׳©׳™׳—׳•׳× ׳׳¨׳•׳›׳•׳× ׳‘׳–׳׳ ׳׳ ׳׳×׳׳™׳ ׳•׳׳ ׳™ ׳¦׳¨׳™׳ ׳“׳¨׳ ׳׳¢׳¦׳•׳¨ ׳‘׳¢׳“׳™׳ ׳•׳×.',
      ],
    },
  ],
  default: [
    {
      id: 'general',
      labelHe: '׳›׳׳׳™',
      stories: [
        '׳™׳© ׳׳™ ׳¡׳™׳˜׳•׳׳¦׳™׳” ׳©׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳ ׳¡׳— ׳׳—׳“׳© ׳‘׳¦׳•׳¨׳” ׳׳“׳•׳™׳§׳× ׳™׳•׳×׳¨.',
        '׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳§׳—׳× ׳׳©׳₪׳˜ ׳×׳§׳•׳¢ ׳•׳׳”׳₪׳•׳ ׳׳•׳×׳• ׳׳ ׳™׳¡׳•׳— ׳©׳׳™׳™׳¦׳¨ ׳™׳•׳×׳¨ ׳׳₪׳©׳¨׳•׳™׳•׳×.',
      ],
    },
  ],
}

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
    tips.push('׳”׳˜׳•׳ ׳›׳¨׳’׳¢ ׳₪׳•׳¨׳׳׳™/׳§׳©׳™׳—. ׳‘׳“׳§׳• ׳׳ 10ג€“15 ׳ ׳§׳•׳“׳•׳× ׳—׳•׳ ׳׳©׳₪׳¨׳•׳× ׳§׳©׳‘ ׳‘׳׳™ ׳׳₪׳’׳•׳¢ ׳‘׳’׳‘׳•׳.')
  }
  if (tags.some((tag) => tag.includes('overdurf') || tag.includes('possibility'))) {
    tips.push('׳™׳© ׳›׳׳ ׳₪׳×׳™׳—׳× ׳׳₪׳©׳¨׳•׳×/׳›׳׳×׳™׳. ׳©׳™׳׳• ׳׳‘ ׳׳ ׳–׳” ׳׳§׳ ׳¢׳ ׳§׳׳™׳˜׳” ׳׳• ׳׳—׳׳™׳© ׳‘׳”׳™׳¨׳•׳×.')
  }
  if (lab.id === 'boundaries') {
    tips.push('׳’׳‘׳•׳ ׳˜׳•׳‘ ׳ ׳©׳׳¢ ׳‘׳¨׳•׳¨ ׳’׳ ׳‘׳˜׳•׳ ׳—׳. ׳‘׳“׳§׳• ׳©׳”"׳׳" ׳ ׳©׳׳¨ ׳׳₪׳•׳¨׳©.')
  }
  if (lab.id === 'empathy') {
    tips.push('׳‘׳׳©׳₪׳˜׳™ "׳׳ ׳™", ׳©׳™׳׳¨׳• ׳¢׳ ׳¨׳’׳© + ׳”׳§׳©׳¨ + ׳¦׳•׳¨׳ + ׳‘׳§׳©׳” ׳‘׳׳™ ׳₪׳¨׳©׳ ׳•׳× ׳¢׳ ׳”׳¦׳“ ׳”׳©׳ ׳™.')
  }
  if (!tips.length) {
    tips.push('׳ ׳¡׳• ׳׳”׳—׳׳™׳£ ׳¨׳›׳™׳‘ ׳׳—׳“ ׳‘׳׳‘׳“ ׳•׳׳‘׳“׳•׳§ ׳׳™׳ ׳›׳ ׳”׳׳©׳₪׳˜ ׳׳©׳×׳ ׳”.')
  }

  return (
    <aside className="coach-panel" aria-label="Coach panel">
      <div className="coach-panel__title">׳₪׳׳ ׳ ׳׳׳׳</div>
      <div className="coach-panel__meta">׳—׳•׳ ׳ ׳•׳›׳—׳™: {warmthLabel}</div>
      {sourceText ? <p className="coach-panel__source">׳׳§׳•׳¨: "{sourceText}"</p> : null}
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
  const resolvedOpenBankId =
    openBankId && banks.some((bank) => bank.id === openBankId) ? openBankId : ''
  const resolvedOpenSourceTopicId =
    openSourceTopicId && sourceTopics.some((topic) => topic.id === openSourceTopicId)
      ? openSourceTopicId
      : ''

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

  const activeCount = tokens.filter((token) => token.value).length
  const warmthVariantKey = draft.warmth <= 33 ? 'cold' : draft.warmth <= 66 ? 'neutral' : 'warm'
  const chipTextForCurrentWarmth = (chip) =>
    chip.textVariants ? chip.textVariants[warmthVariantKey] ?? chip.textVariants.neutral : ''

  const setDraft = (updater) => {
    updateDraft(labId, updater)
    setStatusMessage('')
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
    setStatusMessage(mode === 'append' ? '׳”׳¡׳™׳₪׳•׳¨ ׳ ׳•׳¡׳£ ׳׳˜׳§׳¡׳˜ ׳”׳׳§׳•׳¨.' : '׳”׳¡׳™׳₪׳•׳¨ ׳ ׳˜׳¢׳ ׳׳˜׳§׳¡׳˜ ׳”׳׳§׳•׳¨.')
  }

  const handleSaveSourceAsStory = () => {
    const storyText = (sourceContext.patientText ?? '').trim()
    if (!storyText) {
      setStatusMessage('׳”׳“׳‘׳™׳§׳• ׳§׳•׳“׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳׳• ׳¡׳™׳₪׳•׳¨ ׳§׳¦׳¨.')
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
    setStatusMessage(wasAdded ? '׳ ׳©׳׳¨ ׳¡׳™׳₪׳•׳¨ ׳—׳“׳© ׳‘׳ ׳•׳©׳ ׳”׳₪׳¢׳™׳.' : '׳”׳¡׳™׳₪׳•׳¨ ׳›׳‘׳¨ ׳§׳™׳™׳ ׳‘׳ ׳•׳©׳ ׳”׳₪׳¢׳™׳.')
  }

  const clearSourceText = () => {
    updateSourceContext((current) => ({
      ...current,
      patientText: '',
    }))
    setIsSourceContextMenuOpen(true)
    setStatusMessage('׳˜׳§׳¡׳˜ ׳”׳׳§׳•׳¨ ׳ ׳•׳§׳”.')
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
        await navigator.clipboard.writeText(sentence)
        setStatusMessage('׳”׳ ׳™׳¡׳•׳— ׳”׳•׳¢׳×׳§ ׳׳׳•׳—.')
        return
      }
      setStatusMessage('׳”׳¢׳×׳§׳” ׳׳•׳˜׳•׳׳˜׳™׳× ׳׳ ׳–׳׳™׳ ׳”. ׳׳₪׳©׳¨ ׳׳”׳¢׳×׳™׳§ ׳™׳“׳ ׳™׳× ׳׳”׳×׳¦׳•׳’׳”.')
    } catch {
      setStatusMessage('׳׳ ׳”׳¦׳׳—׳×׳™ ׳׳”׳¢׳×׳™׳§ ׳׳׳•׳—.')
    }
  }

  const handleSaveFavorite = () => {
    if (!sentence || sentence === lab.preview?.emptyTextHe) {
      setStatusMessage('׳׳™׳ ׳¢׳“׳™׳™׳ ׳ ׳™׳¡׳•׳— ׳׳©׳׳™׳¨׳”.')
      return
    }

    saveFavorite({
      labId,
      sentenceText: sentence,
      draftSnapshot: cloneValue(draft),
      tags,
    })
    setStatusMessage('׳ ׳©׳׳¨ ׳׳׳•׳¢׳“׳₪׳™׳.')
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
            ׳׳™׳₪׳•׳¡
          </button>
          <button
            type="button"
            onClick={() => setDraft((current) => randomizeAlchemyDraft(lab, current))}
          >
            ׳׳׳›׳™׳׳׳™ ׳׳§׳¨׳׳™
          </button>
        </div>
      </div>

      {!compact && lab.route && <LabLessonPrompt labId={lab.id} />}

      {lab.templates.length > 1 && (
        <div className="template-switcher" role="tablist" aria-label="׳׳‘׳ ׳™ ׳ ׳™׳¡׳•׳—">
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

      {!compact && (
        <MenuSection
          title="׳˜׳§׳¡׳˜ ׳׳§׳•׳¨ / ׳׳©׳₪׳˜ ׳”׳׳˜׳•׳₪׳"
          subtitle={
            sourceSummary ||
            '׳”׳“׳‘׳™׳§׳• ׳׳©׳₪׳˜ ׳©׳ ׳׳˜׳•׳₪׳/׳׳§׳•׳— ׳׳• ׳˜׳¢׳ ׳• ׳¡׳™׳₪׳•׳¨ ׳׳•׳›׳ ׳׳×׳•׳ ׳ ׳•׳©׳ ׳¨׳׳•׳•׳ ׳˜׳™.'
          }
          badgeText={sourceSummary ? '׳₪׳¢׳™׳' : '׳׳•׳₪׳¦׳™׳•׳ ׳׳™'}
          isOpen={isSourceContextMenuOpen}
          onToggle={() => setIsSourceContextMenuOpen((current) => !current)}
          className="source-context-menu"
        >
          <div className="source-context-panel">
            <label className="source-context-panel__field">
              <span>׳׳©׳₪׳˜ ׳”׳׳˜׳•׳₪׳ / ׳¡׳™׳₪׳•׳¨ ׳׳§׳•׳¨</span>
              <textarea
                className="source-context-panel__textarea"
                rows={4}
                placeholder="׳׳“׳•׳’׳׳”: '׳›׳ ׳₪׳¢׳ ׳©׳׳©׳ ׳™׳ ׳׳™ ׳“׳‘׳¨׳™׳ ׳‘׳¨׳’׳¢ ׳”׳׳—׳¨׳•׳ ׳׳ ׳™ ׳ ׳¡׳’׳¨ ׳•׳׳ ׳™׳•׳“׳¢ ׳׳׳™׳₪׳” ׳׳”׳×׳—׳™׳...'"
                value={sourceContext.patientText}
                onChange={(event) => handleSourceTextChange(event.target.value)}
                onBlur={handleSourceTextBlur}
              />
            </label>

            <div className="source-context-panel__toolbar">
              <label className="source-context-panel__topic">
                <span>׳ ׳•׳©׳ ׳₪׳¢׳™׳</span>
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
                  ׳¡׳™׳™׳׳×׳™ ׳׳§׳•׳¨
                </button>
                <button type="button" onClick={handleSaveSourceAsStory}>
                  ׳©׳׳•׳¨ ׳›׳¡׳™׳₪׳•׳¨
                </button>
                <button type="button" onClick={clearSourceText}>
                  ׳ ׳§׳” ׳˜׳§׳¡׳˜
                </button>
              </div>
            </div>

            <div className="source-context-topics">
              {sourceTopicsWithStories.map((topic) => (
                <MenuSection
                  key={topic.id}
                  title={topic.labelHe}
                  subtitle={`${topic.items.length} ׳¡׳™׳₪׳•׳¨׳™׳ ׳–׳׳™׳ ׳™׳`}
                  badgeText={topic.customCount ? `+${topic.customCount} ׳©׳׳™` : '׳׳•׳›׳'}
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
                          title="׳˜׳¢׳ ׳׳˜׳§׳¡׳˜ ׳”׳׳§׳•׳¨"
                        >
                          {item.text}
                        </button>
                        <div className="source-story-item__meta">
                          <span
                            className={`source-story-item__badge ${
                              item.origin === 'custom' ? 'is-custom' : ''
                            }`}
                          >
                            {item.origin === 'custom' ? '׳©׳׳™' : '׳׳•׳›׳'}
                          </span>
                          <button
                            type="button"
                            className="source-story-item__append"
                            onClick={() => {
                              setOpenSourceTopicId(topic.id)
                              loadStoryIntoSource(item.text, 'append', topic.id)
                            }}
                          >
                            ׳”׳•׳¡׳£
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
          <span className="preview-panel__label">׳×׳¦׳•׳’׳× ׳ ׳™׳¡׳•׳—</span>
          <span className="preview-panel__count">
            {activeCount}/{template?.slotOrder.length ?? 0} ׳¨׳›׳™׳‘׳™׳ ׳₪׳¢׳™׳׳™׳
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
        {sourceSummary ? <p className="preview-panel__source">׳׳×׳•׳ ׳׳§׳•׳¨: {sourceSummary}</p> : null}
        <div className="controls-row">
          <button type="button" onClick={handleCopy}>
            ׳”׳¢׳×׳§
          </button>
          <button type="button" onClick={handleSaveFavorite}>
            ׳©׳׳•׳¨ ׳׳׳•׳¢׳“׳₪׳™׳
          </button>
          <label className="warmth-control">
            <span>׳—׳•׳ ׳ ׳™׳¡׳•׳—: {warmthLabelHe(draft.warmth)}</span>
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
            <small>׳§׳¨ / ׳ ׳™׳˜׳¨׳׳™ / ׳—׳</small>
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
                badgeText={selectedChipId ? '׳ ׳‘׳—׳¨' : bank.optional ? '׳׳•׳₪׳¦׳™׳•׳ ׳׳™' : '׳׳‘׳—׳™׳¨׳”'}
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
                        ׳׳׳
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
          title="׳₪׳׳ ׳ ׳׳׳׳"
          subtitle="׳˜׳™׳₪׳™׳, ׳”׳§׳©׳¨ ׳•׳ ׳™׳¡׳•׳— ׳₪׳¢׳™׳"
          badgeText="׳׳•׳₪׳¦׳™׳•׳ ׳׳™"
          isOpen={isCoachMenuOpen}
          onToggle={() => setIsCoachMenuOpen((current) => !current)}
          className="coach-panel-menu"
        >
          <CoachPanel
            lab={lab}
            draft={draft}
            sentence={sentence}
            tags={tags}
            sourceText={sourceSummary}
          />
        </MenuSection>
      )}
    </section>
  )
}


