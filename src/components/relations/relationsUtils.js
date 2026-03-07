import {
  deriveSystemStatus,
  getEmotionById,
} from '../../data/relationsLabData'

export function deltaToken(value, invertColor = false) {
  const sign = value > 0 ? '+' : ''
  const tone =
    value === 0
      ? 'neutral'
      : (invertColor ? value < 0 : value > 0)
        ? 'good'
        : 'bad'
  return { text: `${sign}${value}`, tone }
}

export function formatTurnDeltaLine(turn) {
  const open = deltaToken(turn.deltas.openField)
  const resources = deltaToken(turn.deltas.resources)
  const distress = deltaToken(turn.deltas.distress, true)
  return `פתיחות שדה ${open.text}, משאבים ${resources.text}, עומס/מצוקה ${distress.text}`
}

export function buildFavoriteArchiveRecord({ session, turn }) {
  return {
    id: `${session.id}:${turn.id}`,
    createdAt: new Date().toISOString(),
    labId: 'relations',
    sessionId: session.id,
    scenarioId: session.scenario.id,
    contextF: session.scenario.contextF,
    archetypeId: session.scenario.archetypeId,
    questionText: turn.questionText,
    family: turn.familyId,
    barsDelta: turn.deltas,
    emotionBefore: turn.emotionBefore,
    emotionAfter: turn.emotionAfter,
  }
}

export function buildFavoritePackPayload(session) {
  const likedTurns = session.turns.filter((turn) => turn.liked)
  return {
    schemaVersion: 1,
    kind: 'relations-favorite-questions',
    exportedAt: new Date().toISOString(),
    sessionId: session.id,
    scenario: {
      contextF: session.scenario.contextF,
      goalG: session.scenario.goalG,
      element1: session.scenario.element1,
      element2: session.scenario.element2,
      relationR0: session.scenario.initialRelationR0.shortHe,
    },
    favorites: likedTurns.map((turn) => ({
      questionText: turn.questionText,
      family: turn.familyId,
      barsDelta: turn.deltas,
      emotionBefore: turn.emotionBefore,
      emotionAfter: turn.emotionAfter,
      coachInsightText: turn.coachInsightText,
    })),
  }
}

export function copyToClipboard(text) {
  if (!text) return Promise.resolve(false)
  if (!navigator.clipboard?.writeText) {
    return Promise.resolve(false)
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}

export function getBarTone(key) {
  if (key === 'openField') return 'open'
  if (key === 'resources') return 'resource'
  return 'distress'
}

export function normalizeEmotionSelection(selection, fallbackId = null, fallbackIntensity = 3) {
  return {
    id: selection?.id ?? fallbackId,
    intensity: Number(selection?.intensity ?? fallbackIntensity),
    labelHe:
      selection?.labelHe ??
      (selection?.id ? (getEmotionById(selection.id)?.labelHe ?? selection.id) : null),
  }
}

function relationTypeLabel(type) {
  if (type === 'loop') return 'לולאה'
  if (type === 'cause') return 'אחד מפעיל את השני'
  if (type === 'conflict') return 'התנגשות'
  if (type === 'identity') return 'זהות שמפעילה תגובה'
  return 'קשר פעיל'
}

function relationStateLabelFromStage(stage) {
  if (stage <= 0) return 'הקשר כרגע סגור ונוקשה'
  if (stage === 1) return 'לולאה שמתחילה להתרכך'
  if (stage === 2) return 'יש יותר מרווח והשפעה הדדית'
  return 'הקשר פתוח יותר ואפשר לעבוד איתו'
}

export function describeCurrentRelationState(session) {
  if (!session?.turns?.length) {
    return relationTypeLabel(session?.scenario?.initialRelationR0?.type)
  }
  const latestTurn = session.turns.at(-1)
  const nextStage = latestTurn?.relationShift?.next ?? 0
  return relationStateLabelFromStage(nextStage)
}

export const RELATIONS_METRIC_ITEMS = [
  {
    id: 'openness',
    barKey: 'openField',
    labelHe: 'פתיחות שדה',
    icon: '◌',
    descriptionHe: 'כמה קל כרגע לחקור, לראות אפשרויות, ולהמשיך בלי להינעל.',
    tipsHe: [
      'בחר/י שאלה שמרככת את היחס בין שני האלמנטים.',
      'עבר/י למשפחת שאלות שמחפשת הקשר חלופי.',
      'דייק/י את הרגש הנוכחי לפני השאלה הבאה.',
    ],
    whyHe: 'כשהשדה נפתח, יש יותר חופש לבחור תגובה ולא רק להמשיך את הלולאה.',
  },
  {
    id: 'resources',
    barKey: 'resources',
    labelHe: 'משאבים זמינים',
    icon: '◍',
    descriptionHe: 'כמה משאבים, יכולות, וסבלנות זמינים כרגע להמשך העבודה.',
    tipsHe: [
      'בחר/י שאלה שמזכירה משהו שכבר כן עובד.',
      'נסח/י מטרה רכה יותר ב־5%.',
      'התמקד/י בצעד קטן שאפשר לבצע עכשיו.',
    ],
    whyHe: 'יותר משאבים זמינים מגדילים את הסיכוי לשינוי אמיתי ולא רק להבנה רגעית.',
  },
  {
    id: 'distress',
    barKey: 'distress',
    labelHe: 'עומס/מצוקה',
    icon: '!',
    descriptionHe: 'כמה לחץ, כאב או הצפה נוכחים כרגע בתוך הסשן.',
    tipsHe: [
      'בחר/י שאלה שמאטה את הקצב ולא דוחפת לעוד מאמץ.',
      'הישאר/י עם שאלה אחת בלבד.',
      'החלף/י למסגור שמכיר בקושי בלי להפוך אותו לזהות.',
    ],
    whyHe: 'כשהעומס יורד, יש יותר סיכוי לשיח אפקטיבי ופחות צורך בהתגוננות.',
  },
]

const RELATIONS_METRIC_BY_ID = Object.fromEntries(
  RELATIONS_METRIC_ITEMS.map((item) => [item.id, item]),
)

export function getMetricItem(metricId) {
  return metricId ? RELATIONS_METRIC_BY_ID[metricId] ?? null : null
}

export function buildCompactSystemHint(session, latestTurn) {
  if (!session) return ''
  if (!latestTurn) {
    return `בחר/י רגש, ואז קח/י את ההמלצה המודרכת או שאלה אחת ידנית כדי לראות שינוי ראשון.`
  }
  return 'השאלה האחרונה עדכנה את המדדים ואת הרגש. עכשיו קח/י את ההמלצה הבאה, בחר/י ידנית שאלה אחת נוספת, או עבר/י לסיכום.'
}

export function getWorkedQuestion(turns) {
  if (!turns?.length) return null
  return turns
    .slice()
    .sort((a, b) => {
      const scoreA = a.deltas.openField + a.deltas.resources - a.deltas.distress
      const scoreB = b.deltas.openField + b.deltas.resources - b.deltas.distress
      return scoreB - scoreA
    })[0]
}

export function getTurnOutcomeCopy(turn) {
  if (!turn) return null

  if (turn.deltas.openField > 0 && turn.deltas.distress < 0) {
    return 'נוצר יותר מרווח והעומס ירד.'
  }
  if (turn.deltas.resources > 0) {
    return 'הסשן גייס יותר משאבים להמשך.'
  }
  if (turn.deltas.distress > 0) {
    return 'יש עדיין עומס. כדאי לבחור שאלה שמרככת קצב ומקטינה התנגשות.'
  }
  return 'נוצר שינוי עדין. שווה עוד שאלה אחת לפני סיכום.'
}

export function getMetricStatusLabel(bars) {
  return deriveSystemStatus(bars)
}
