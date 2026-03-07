export const DEFAULT_DASHBOARD_PERSONA_ID = 'beginner'
export const DEFAULT_DASHBOARD_GOAL_ID = 'speak-better'

export const dashboardWelcomePaths = [
  {
    id: 'beginner-speak',
    personaId: 'beginner',
    goalId: 'speak-better',
    titleHe: 'אני רוצה לדבר טוב יותר',
    descriptionHe: 'לקחת משפט אחד ולנסח אותו כך שיהיה ברור, נעים ובטוח.',
  },
  {
    id: 'therapist-guide',
    personaId: 'therapist',
    goalId: 'ask-better',
    titleHe: 'אני מטפל/ת או מאמן/ת',
    descriptionHe: 'לקבל שאלה טובה או פתיחה מדויקת לשיחה רגישה.',
  },
  {
    id: 'influence-lead',
    personaId: 'influence',
    goalId: 'lead-gently',
    titleHe: 'אני צריך/ה להוביל שיחה',
    descriptionHe: 'לבחור שפה שמכוונת את השיחה בלי לחץ.',
  },
]

const homePersonaCopyById = {
  beginner: {
    labelHe: 'רוצה לדבר טוב יותר',
    descriptionHe: 'למי שרוצה התחלה פשוטה ומשפטים שעובדים טוב בשיחה אמיתית.',
  },
  practitioner: {
    labelHe: 'מתרגל/ת NLP',
    descriptionHe: 'למי שכבר מכיר/ה את השפה ורוצה יותר דיוק, הבחנה ותרגול.',
  },
  therapist: {
    labelHe: 'מטפל/ת / מאמן/ת',
    descriptionHe: 'למי שמלווה אנשים ורוצה שאלה טובה, קצב רגוע וניסוח מדויק.',
  },
  influence: {
    labelHe: 'מוביל/ת שיחה',
    descriptionHe: 'למי שצריך/ה להוביל, למסגר ולהשפיע בלי להישמע לוחצ/ת.',
  },
}

const homeGoalCopyById = {
  'speak-better': {
    labelHe: 'לדבר טוב יותר',
    descriptionHe: 'לנסח משפט אחד ברור, רגוע ובטוח יותר.',
  },
  'ask-better': {
    labelHe: 'לשאול שאלה טובה',
    descriptionHe: 'לצאת עם שאלה אחת טובה שמקדמת את השיחה.',
  },
  'unstick-relationship': {
    labelHe: 'להבין מה תקוע בקשר',
    descriptionHe: 'להבין מה תקוע בקשר ואיפה נכון להתחיל.',
  },
  'lead-gently': {
    labelHe: 'להוביל שיחה בעדינות',
    descriptionHe: 'להוביל את השיחה בלי כוח ובלי התנגדות מיותרת.',
  },
  'body-emotion': {
    labelHe: 'לעצור ולבדוק גוף/רגש',
    descriptionHe: 'לזהות מה קורה בגוף וברגש לפני שממשיכים לדבר.',
  },
}

const homeFamilyCopyById = {
  skill: {
    descriptionHe: 'לתרגל ניסוח אחד או מהלך שיחה אחד שאפשר לקחת מיד לחיים.',
  },
  diagnostic: {
    descriptionHe: 'להבין מה קורה בשיחה או בקשר לפני שבוחרים את הצעד הבא.',
  },
  influence: {
    descriptionHe: 'להוביל, לווסת ולבחור שפה שמשפיעה על האווירה בשיחה.',
  },
}

export function timeLabel(value, options) {
  try {
    return new Date(value).toLocaleString('he-IL', options)
  } catch {
    return value
  }
}

export function labStatusLabel(status) {
  if (status === 'stable') return 'מוכן'
  if (status === 'beta') return 'בבדיקה'
  if (status === 'experimental') return 'ניסוי'
  return status
}

export function getHomePersonaOptions(options) {
  return options.map((option) => ({
    ...option,
    ...(homePersonaCopyById[option.id] ?? {}),
  }))
}

export function getHomeGoalOptions(options) {
  return options.map((option) => ({
    ...option,
    ...(homeGoalCopyById[option.id] ?? {}),
  }))
}

export function getHomeFamilySections(families, getLabsByFamily) {
  return families.map((family) => ({
    ...family,
    ...(homeFamilyCopyById[family.id] ?? {}),
    labs: getLabsByFamily(family.id),
  }))
}

export function hasMeaningfulDashboardHistory(state) {
  const lastVisitedLabId = state.preferences?.lastVisitedLabId
  return (
    state.history.length > 0 ||
    state.favorites.length > 0 ||
    (lastVisitedLabId && lastVisitedLabId !== 'phrasing')
  )
}
