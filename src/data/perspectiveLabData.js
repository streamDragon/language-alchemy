import { makeId } from '../utils/ids'

const PERSPECTIVE_SESSIONS_KEY = 'la.v1.perspectiveSessions'
const MAX_SESSION_HISTORY = 30

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export const perspectiveStatementTags = [
  { id: 'observation', labelHe: 'תיאור מציאות', labelEn: 'Observation' },
  { id: 'story', labelHe: 'סיפור/פרשנות', labelEn: 'Story' },
  { id: 'feeling', labelHe: 'רגש', labelEn: 'Feeling' },
  { id: 'need-value', labelHe: 'צורך/ערך', labelEn: 'Need/Value' },
  { id: 'rule', labelHe: 'כלל/חוק', labelEn: 'Rule' },
  { id: 'identity', labelHe: 'זהות', labelEn: 'Identity' },
  { id: 'vision', labelHe: 'עתיד/חזון', labelEn: 'Vision' },
]

export const perspectiveRelationLabels = [
  { value: 'הכללה', labelEn: 'Expansion/Generalization' },
  { value: 'שיפוט/האשמה', labelEn: 'Judgment/Blame' },
  { value: 'מעבר לזהות', labelEn: 'Shift to Identity' },
  { value: 'קפיצה בזמן', labelEn: 'Time Jump' },
  { value: 'סיבה-תוצאה', labelEn: 'Causality Jump' },
  { value: 'דחיסה', labelEn: 'Compression' },
  { value: 'פירוק', labelEn: 'Unpacking' },
]

const DEFAULT_RELATION_LABEL = perspectiveRelationLabels[0].value

const BRIDGE_QUESTIONS_BY_RELATION = {
  'מעבר לזהות': [
    'מה בדיוק קרה (פעולה/אירוע) שהתפרש אצלך כ-X?',
    'באילו רגעים זה קורה, ומתי לא?',
    'איזה ניסוח ביניים יותר מדויק בין שני המשפטים?',
  ],
  הכללה: [
    'איפה זה נכון? איפה זה לא נכון?',
    'מתי בפעם האחרונה זה היה אחרת?',
    'מה הדוגמה הכי קונקרטית לאירוע שהוביל למשפט הכללי?',
  ],
  'שיפוט/האשמה': [
    'איזה חלק הוא תיאור עובדות ואיזה חלק הוא פרשנות?',
    'מה היית אומר/ת אם היית מתאר/ת רק מה שקרה בפועל?',
    'איזו כוונה אפשרית נוספת קיימת חוץ מהאשמה?',
  ],
  'קפיצה בזמן': [
    'האם זה קשור לעבר, להווה או לחשש מהעתיד?',
    'מה נכון רק לרגע מסוים ולא לכל הזמן?',
    'איזו גרסה זמנית יותר מדויקת למשפט עכשיו?',
  ],
  'סיבה-תוצאה': [
    'מה העובדות שמחברות בין X ל-Y?',
    'איזה גורם נוסף יכול להסביר את מה שקרה?',
    'מה ניסוח שמחזיר לך יותר בחירה בין סיבה לתוצאה?',
  ],
  דחיסה: [
    'איזה פרטים חסרים במשפט המקוצר?',
    'מה הרגע הספציפי שממנו המשפט נבנה?',
    'איך אפשר לפרק את המשפט לשלושה מרכיבים מדויקים?',
  ],
  פירוק: [
    'איזו נקודה מרכזית רוצה להישאר בתמונה?',
    'מה חשוב לא לאבד כשמפרקים את המשפט?',
    'איזה ניסוח קצר מחבר בין החלקים בצורה בהירה?',
  ],
}

const GLOBAL_TERMS = [
  /\b(always|never|everyone|nobody|all|none)\b/i,
  /תמיד/g,
  /אף פעם/g,
  /כולם/g,
  /אף אחד/g,
  /הכול/g,
  /הכל/g,
]

export function createPerspectiveSession(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: overrides.id ?? makeId('perspective'),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    beforeText: overrides.beforeText ?? '',
    nowText: overrides.nowText ?? '',
    tagsBefore: Array.isArray(overrides.tagsBefore) ? overrides.tagsBefore : [],
    tagsNow: Array.isArray(overrides.tagsNow) ? overrides.tagsNow : [],
    axisSet: overrides.axisSet ?? 'default',
    posBefore: normalizePosition(overrides.posBefore, { xPct: 28, yPct: 72 }),
    posNow: normalizePosition(overrides.posNow, { xPct: 72, yPct: 34 }),
    relationLabel: String(overrides.relationLabel ?? DEFAULT_RELATION_LABEL),
    bridgeQuestions: normalizeBridgeQuestions(overrides.bridgeQuestions),
    bridgeSentence: String(overrides.bridgeSentence ?? ''),
    microAction: String(overrides.microAction ?? ''),
  }
}

export function normalizePosition(position, fallback = { xPct: 50, yPct: 50 }) {
  return {
    xPct: clamp(Number(position?.xPct ?? fallback.xPct)),
    yPct: clamp(Number(position?.yPct ?? fallback.yPct)),
  }
}

export function normalizeBridgeQuestions(items) {
  if (!Array.isArray(items) || !items.length) return []
  return items
    .slice(0, 3)
    .map((item) => String(item ?? '').trim())
    .concat(Array.from({ length: Math.max(0, 3 - items.length) }, () => ''))
}

export function getDefaultBridgeQuestions(relationLabel) {
  return [...(BRIDGE_QUESTIONS_BY_RELATION[relationLabel] ?? BRIDGE_QUESTIONS_BY_RELATION[DEFAULT_RELATION_LABEL])]
}

export function buildDefaultBridgeSentence(beforeText, nowText) {
  const beforeSnippet = String(beforeText ?? '').trim().slice(0, 80)
  const nowSnippet = String(nowText ?? '').trim().slice(0, 80)
  if (!beforeSnippet && !nowSnippet) {
    return 'בין מה שאמרתי קודם למה שאני אומר/ת עכשיו, ניסוח ביניים מדויק יותר הוא:'
  }
  return `בין "${beforeSnippet || 'המשפט הקודם'}" לבין "${nowSnippet || 'המשפט הנוכחי'}", ניסוח ביניים מדויק יותר הוא:`
}

export function buildDefaultMicroAction() {
  return 'ב-24 השעות הקרובות אני בוחר/ת צעד קטן אחד:'
}

function hasGlobalTerms(text) {
  const source = String(text ?? '')
  return GLOBAL_TERMS.some((pattern) => pattern.test(source))
}

export function suggestPerspectiveRelation({
  beforeText = '',
  nowText = '',
  tagsBefore = [],
  tagsNow = [],
  posBefore = { xPct: 50, yPct: 50 },
  posNow = { xPct: 50, yPct: 50 },
} = {}) {
  const beforeTagSet = new Set(tagsBefore)
  const nowTagSet = new Set(tagsNow)
  const nowMoreGeneral = Number(posNow?.xPct ?? 50) - Number(posBefore?.xPct ?? 50) >= 8

  if (nowTagSet.has('identity') && !beforeTagSet.has('identity')) {
    return 'מעבר לזהות'
  }
  if (hasGlobalTerms(nowText) || nowMoreGeneral) {
    return 'הכללה'
  }
  const actionToMeaningShift = Number(posNow?.yPct ?? 50) + 8 < Number(posBefore?.yPct ?? 50)
  if (actionToMeaningShift && nowTagSet.has('story')) {
    return 'סיבה-תוצאה'
  }
  if (hasGlobalTerms(beforeText) && !hasGlobalTerms(nowText)) {
    return 'פירוק'
  }
  return DEFAULT_RELATION_LABEL
}

export function loadPerspectiveSessions() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PERSPECTIVE_SESSIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => createPerspectiveSession(item))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, MAX_SESSION_HISTORY)
  } catch {
    return []
  }
}

export function savePerspectiveSessions(sessions) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      PERSPECTIVE_SESSIONS_KEY,
      JSON.stringify((Array.isArray(sessions) ? sessions : []).slice(0, MAX_SESSION_HISTORY)),
    )
  } catch {
    // ignore storage failures
  }
}

export function upsertPerspectiveSession(sessions, nextSession) {
  const normalizedSession = createPerspectiveSession(nextSession)
  const collection = Array.isArray(sessions) ? sessions : []
  const exists = collection.some((item) => item.id === normalizedSession.id)
  const nextCollection = exists
    ? collection.map((item) => (item.id === normalizedSession.id ? normalizedSession : item))
    : [normalizedSession, ...collection]

  return nextCollection
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, MAX_SESSION_HISTORY)
}
