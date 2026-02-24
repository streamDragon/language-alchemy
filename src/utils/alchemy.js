export function warmthBucket(warmth = 50) {
  if (warmth <= 33) return 'cold'
  if (warmth <= 66) return 'neutral'
  return 'warm'
}

export function warmthLabelHe(warmth = 50) {
  const bucket = warmthBucket(warmth)
  if (bucket === 'cold') return 'פורמלי/קשיח'
  if (bucket === 'warm') return 'חם/אישי'
  return 'מאוזן'
}

export function getTemplate(lab, templateId) {
  return lab?.templates?.find((template) => template.id === templateId) ?? lab?.templates?.[0] ?? null
}

export function getBankBySlot(lab, slotId) {
  return lab?.chipBanks?.find((bank) => bank.slotId === slotId) ?? null
}

export function getChipById(lab, slotId, chipId) {
  const bank = getBankBySlot(lab, slotId)
  return bank?.chips?.find((chip) => chip.id === chipId) ?? null
}

export function chipTextForWarmth(chip, warmth = 50) {
  if (!chip) return ''
  const bucket = warmthBucket(warmth)
  return chip.textVariants?.[bucket] ?? chip.textVariants?.neutral ?? chip.textVariants?.warm ?? chip.textVariants?.cold ?? ''
}

export function createDefaultAlchemyDraft(lab) {
  const template = getTemplate(lab)
  const selectedBySlot = {}

  for (const bank of lab?.chipBanks ?? []) {
    const firstChipId = bank.chips?.[0]?.id ?? ''
    selectedBySlot[bank.slotId] = bank.optional ? '' : firstChipId
  }

  return {
    labId: lab.id,
    templateId: template?.id ?? '',
    warmth: lab.defaultWarmth ?? 50,
    selectedBySlot,
    updatedAt: new Date().toISOString(),
  }
}

export function createInitialAlchemyDrafts(labs) {
  const entries = (labs ?? [])
    .filter((lab) => lab.kind === 'alchemy')
    .map((lab) => [lab.id, createDefaultAlchemyDraft(lab)])

  return Object.fromEntries(entries)
}

function joinParts(parts) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function ensureEnd(sentence) {
  if (!sentence) return sentence
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`
}

const formatters = {
  'phrasing-professional': ({ values }) =>
    ensureEnd(joinParts([values.opener, values.quantifier, values.context, values.request, values.closing])),

  'empathy-i-statement': ({ values }) => {
    const softener = values.softener ? `${values.softener} ` : ''
    const parts = [
      `${softener}${values.feeling ?? ''}`.trim(),
      values.context ? `${values.context},` : '',
      values.need ? `${values.need}.` : '',
      values.request ?? '',
    ]
    return ensureEnd(joinParts(parts))
  },

  'boundary-no': ({ values }) =>
    ensureEnd(joinParts([values.buffer, values.hardNo, values.yesTo, values.condition])),

  'boundary-if-then': ({ values }) =>
    ensureEnd(joinParts([values.trigger, values.ifThenAction, values.ifThenReason])),

  'boundary-availability': ({ values }) =>
    ensureEnd(joinParts([values.availableFor, values.notAvailableFor, values.channelBoundary, values.timeBoundary])),

  'practice-sentence': ({ values }) =>
    ensureEnd(joinParts([values.opener, values.feeling, values.context, values.meaningShift, values.request])),
}

export function selectedValuesForLab(lab, draft) {
  const values = {}

  for (const bank of lab?.chipBanks ?? []) {
    const chipId = draft?.selectedBySlot?.[bank.slotId]
    const chip = bank.chips.find((candidate) => candidate.id === chipId)
    values[bank.slotId] = chipTextForWarmth(chip, draft?.warmth ?? lab.defaultWarmth ?? 50)
  }

  return values
}

export function buildSentence(lab, draft) {
  if (!lab || !draft) return ''
  const template = getTemplate(lab, draft.templateId)
  if (!template) return ''

  const values = selectedValuesForLab(lab, draft)
  const formatter = formatters[template.formatterId]

  if (formatter) {
    const formatted = formatter({ lab, draft, template, values })
    return formatted || lab.preview?.emptyTextHe || ''
  }

  const joined = ensureEnd(joinParts(template.slotOrder.map((slotId) => values[slotId])))
  return joined || lab.preview?.emptyTextHe || ''
}

export function previewTokens(lab, draft) {
  const template = getTemplate(lab, draft?.templateId)
  if (!template) return []

  return template.slotOrder.map((slotId) => {
    const bank = getBankBySlot(lab, slotId)
    const chip = getChipById(lab, slotId, draft?.selectedBySlot?.[slotId])
    return {
      slotId,
      labelHe: bank?.labelHe ?? slotId,
      value: chipTextForWarmth(chip, draft?.warmth ?? lab.defaultWarmth ?? 50),
      empty: !chip,
    }
  })
}

export function activeChipBanksForTemplate(lab, templateId) {
  const template = getTemplate(lab, templateId)
  const allowed = new Set(template?.slotOrder ?? [])
  return (lab?.chipBanks ?? []).filter((bank) => allowed.has(bank.slotId))
}

export function selectChipInDraft(draft, slotId, chipId) {
  const current = draft.selectedBySlot?.[slotId]
  const nextId = current === chipId ? '' : chipId
  return {
    ...draft,
    selectedBySlot: {
      ...draft.selectedBySlot,
      [slotId]: nextId,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function setTemplateInDraft(lab, draft, templateId) {
  const template = getTemplate(lab, templateId)
  if (!template) return draft

  const next = {
    ...draft,
    templateId: template.id,
    selectedBySlot: { ...(draft.selectedBySlot ?? {}) },
    updatedAt: new Date().toISOString(),
  }

  for (const slotId of template.slotOrder) {
    if (next.selectedBySlot[slotId]) continue
    const bank = getBankBySlot(lab, slotId)
    const defaultChip = bank?.optional ? '' : (bank?.chips?.[0]?.id ?? '')
    next.selectedBySlot[slotId] = defaultChip
  }

  return next
}

export function setWarmthInDraft(draft, warmth) {
  return {
    ...draft,
    warmth,
    updatedAt: new Date().toISOString(),
  }
}

export function resetAlchemyDraft(lab, currentDraft) {
  const fresh = createDefaultAlchemyDraft(lab)
  return {
    ...fresh,
    warmth: currentDraft?.warmth ?? fresh.warmth,
    sourceContext: currentDraft?.sourceContext ?? fresh.sourceContext,
  }
}

export function randomizeAlchemyDraft(lab, currentDraft) {
  const template = getTemplate(lab, currentDraft?.templateId)
  if (!template) return currentDraft ?? createDefaultAlchemyDraft(lab)

  const next = {
    ...(currentDraft ?? createDefaultAlchemyDraft(lab)),
    selectedBySlot: { ...(currentDraft?.selectedBySlot ?? {}) },
    updatedAt: new Date().toISOString(),
  }

  for (const slotId of template.slotOrder) {
    const bank = getBankBySlot(lab, slotId)
    if (!bank) continue
    if (bank.optional && Math.random() < 0.25) {
      next.selectedBySlot[slotId] = ''
      continue
    }
    const index = Math.floor(Math.random() * bank.chips.length)
    next.selectedBySlot[slotId] = bank.chips[index]?.id ?? ''
  }

  next.warmth = Math.floor(Math.random() * 101)
  return next
}

export function selectedTagsForDraft(lab, draft) {
  const tags = new Set()
  for (const bank of lab?.chipBanks ?? []) {
    const chip = getChipById(lab, bank.slotId, draft?.selectedBySlot?.[bank.slotId])
    for (const tag of chip?.tags ?? []) {
      tags.add(tag)
    }
  }
  return [...tags]
}
