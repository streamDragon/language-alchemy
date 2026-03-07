export const DEFAULT_DASHBOARD_PERSONA_ID = 'beginner'
export const DEFAULT_DASHBOARD_GOAL_ID = 'speak-better'

export const dashboardWelcomePaths = [
  {
    id: 'beginner-speak',
    personaId: 'beginner',
    goalId: 'speak-better',
    titleHe: 'אני רוצה לדבר ברור יותר',
    descriptionHe: 'לקחת משפט אחד ולנסח אותו כך שיישמע טבעי, רגוע ובטוח.',
  },
  {
    id: 'therapist-guide',
    personaId: 'therapist',
    goalId: 'ask-better',
    titleHe: 'אני מלווה אנשים',
    descriptionHe: 'לקבל פתיחה או שאלה שמחזיקה שיחה רגישה בלי לאבד דיוק.',
  },
  {
    id: 'influence-lead',
    personaId: 'influence',
    goalId: 'lead-gently',
    titleHe: 'אני צריך/ה להוביל שיחה',
    descriptionHe: 'לבחור שפה שמכוונת, מייצבת ומזיזה בלי להישמע לוחצת.',
  },
]

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

export function hasMeaningfulDashboardHistory(state) {
  const lastVisitedLabId = state.preferences?.lastVisitedLabId
  return (
    state.history.length > 0 ||
    state.favorites.length > 0 ||
    (lastVisitedLabId && lastVisitedLabId !== 'phrasing')
  )
}
