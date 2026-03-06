export const labFamilies = [
  {
    id: 'skill',
    titleHe: 'Skill Labs',
    titleEn: 'Skill Labs',
    descriptionHe: 'מעבדות לבניית מיומנות נקודתית שאפשר לקחת ישר לשיחה אמיתית.',
    badgeHe: 'מיומנות',
  },
  {
    id: 'diagnostic',
    titleHe: 'Diagnostic Labs',
    titleEn: 'Diagnostic Labs',
    descriptionHe: 'מעבדות לפירוק מצב, זיהוי קשרים, ושאלות שמרחיבות את התמונה.',
    badgeHe: 'אבחון ופירוק',
  },
  {
    id: 'influence',
    titleHe: 'Influence / State Labs',
    titleEn: 'Influence / State Labs',
    descriptionHe: 'מעבדות להובלה עדינה, קשב לגוף, ושפה שמשנה מצב ולא רק תוכן.',
    badgeHe: 'השפעה וסטייט',
  },
]

export const personaOptions = [
  {
    id: 'beginner',
    labelHe: 'רוצה לדבר טוב יותר',
    descriptionHe: 'למשתמש חדש שרוצה התחלה פשוטה בלי עומס מושגים.',
  },
  {
    id: 'practitioner',
    labelHe: 'NLP Practitioner',
    descriptionHe: 'למי שמכיר את השפה ורוצה יותר דיוק, הבחנה ותרגול.',
  },
  {
    id: 'therapist',
    labelHe: 'איש טיפול / מאמן',
    descriptionHe: 'למי שמחפש framing מקצועי, קצב, ברית ושימוש אתי.',
  },
  {
    id: 'influence',
    labelHe: 'שפה משפיעה / הובלה',
    descriptionHe: 'למי שמחפש framing, pacing, הובלה ושפה עקיפה עם אלגנטיות.',
  },
]

export const goalOptions = [
  {
    id: 'speak-better',
    labelHe: 'לדבר טוב יותר',
    descriptionHe: 'ניסוח ברור יותר, רגוע יותר, ומדויק יותר.',
  },
  {
    id: 'ask-better',
    labelHe: 'לשאול שאלה מדויקת',
    descriptionHe: 'בחירת שאלה אחת טובה במקום הרבה אפשרויות מתחרות.',
  },
  {
    id: 'unstick-relationship',
    labelHe: 'לפרק תקיעות במערכת יחסים',
    descriptionHe: 'לעבוד על קשר, מתח, דינמיקה ועמדות מתנגשות.',
  },
  {
    id: 'lead-gently',
    labelHe: 'להוביל שיחה בעדינות',
    descriptionHe: 'הובלה עדינה, framing, והנעה בלי כוחניות.',
  },
  {
    id: 'body-emotion',
    labelHe: 'להבין מה קורה בגוף/רגש',
    descriptionHe: 'לזהות עומס, משאבים ותגובות גוף בזמן שיחה.',
  },
]

export const labManifest = [
  {
    id: 'phrasing',
    route: '/lab/phrasing',
    titleHe: 'מעבדת ניסוח',
    titleEn: 'Phrasing Lab',
    family: 'skill',
    promiseHe: 'לוקחים משפט אחד ומנסחים אותו כך שיהיה ברור, מדויק וניתן לאמירה.',
    audience: ['beginner', 'practitioner', 'therapist'],
    difficulty: 'beginner',
    sessionLengthMin: 5,
    primaryOutcome: 'משפט אחד מוכן לשיחה אמיתית',
    quickStartLabel: 'נסח/י משפט',
    tags: ['clarity', 'requests', 'professional'],
    featured: true,
    status: 'stable',
    audienceLabelHe: 'מתאים למתחילים, מתרגלים ואנשי מקצוע',
    resultHe: 'תוך 3-5 דקות יוצאים עם ניסוח חד יותר ופחות חיכוך.',
  },
  {
    id: 'empathy',
    route: '/lab/empathy',
    titleHe: 'גשר האמפתיה',
    titleEn: 'Empathy Bridge',
    family: 'skill',
    promiseHe: 'בונים משפטי "אני" שמחזיקים צורך אישי בלי לעורר מיד הגנה.',
    audience: ['beginner', 'therapist', 'practitioner'],
    difficulty: 'beginner',
    sessionLengthMin: 5,
    primaryOutcome: 'משפט אמפתי שאפשר להגיד בלי להתכווץ',
    quickStartLabel: 'בנה/י משפט "אני"',
    tags: ['empathy', 'alliance', 'needs'],
    featured: false,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה יותר חיבור ופחות התנגשות',
    resultHe: 'תוך 3-5 דקות יוצאים עם ניסוח שמכבד גם אותך וגם את הקשר.',
  },
  {
    id: 'boundaries',
    route: '/lab/boundaries',
    titleHe: 'אדריכל הגבולות',
    titleEn: 'Boundary Builder',
    family: 'skill',
    promiseHe: 'מתרגלים איך לומר "לא", להציב תנאי, ולשמור על הקשר.',
    audience: ['beginner', 'therapist', 'practitioner'],
    difficulty: 'intermediate',
    sessionLengthMin: 5,
    primaryOutcome: 'גבול אחד ברור עם ניסוח שאפשר לעמוד מאחוריו',
    quickStartLabel: 'נסח/י גבול',
    tags: ['boundaries', 'no', 'conditions'],
    featured: true,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה יותר בהירות, פחות אשמה, ויותר עמוד שדרה',
    resultHe: 'תוך 3-5 דקות יוצאים עם גבול ברור וניסוח שנשמע אנושי.',
  },
  {
    id: 'clean-questions',
    route: '/lab/clean-questions',
    titleHe: 'שואל השאלות',
    titleEn: 'Clean Questions',
    family: 'diagnostic',
    promiseHe: 'בוחרים שאלה קצרה שמנקה הנחות ופותחת מרחב חשיבה.',
    audience: ['beginner', 'practitioner', 'therapist'],
    difficulty: 'beginner',
    sessionLengthMin: 5,
    primaryOutcome: 'שאלה אחת מדויקת להמשך השיחה',
    quickStartLabel: 'בחר/י שאלה',
    tags: ['questions', 'clean-language', 'meta-model'],
    featured: true,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה לשאול טוב יותר במקום להסביר יותר',
    resultHe: 'תוך 3-5 דקות יוצאים עם שאלה אחת טובה במקום עומס אפשרויות.',
  },
  {
    id: 'relations',
    route: '/lab/relations',
    titleHe: 'מעבדת יחסים',
    titleEn: 'Relations Lab',
    family: 'diagnostic',
    promiseHe: 'מפרקים קשר תקוע בין שני דברים ובודקים איזו שאלה פותחת יותר מרווח.',
    audience: ['beginner', 'practitioner', 'therapist'],
    difficulty: 'intermediate',
    sessionLengthMin: 7,
    primaryOutcome: 'סבב חקירה אחד שמראה מה השתנה בקשר ובתחושה',
    quickStartLabel: 'פתח/י סשן יחסים',
    tags: ['relationships', 'stuckness', 'systems'],
    featured: true,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה לפרק תקיעות ולא רק לנסח משפט',
    resultHe: 'תוך 5-7 דקות מבינים מה המצב, איזו שאלה עזרה, ומה השתנה.',
  },
  {
    id: 'perspectives',
    route: '/lab/perspectives',
    titleHe: 'מעבדת פרספקטיבות',
    titleEn: 'Perspective Lab',
    family: 'diagnostic',
    promiseHe: 'משווים בין לפני/עכשיו כדי לראות שינוי, כיוון, ומרווח חדש.',
    audience: ['practitioner', 'therapist', 'beginner'],
    difficulty: 'intermediate',
    sessionLengthMin: 6,
    primaryOutcome: 'מפת שינוי קצרה בין מצב קודם למצב נוכחי',
    quickStartLabel: 'מפה/י שינוי',
    tags: ['mapping', 'perspective', 'before-after'],
    featured: false,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה לראות תמונה רחבה ולא רק נקודה אחת',
    resultHe: 'תוך 5-6 דקות רואים שינוי, מרחק, וכיוון להמשך.',
  },
  {
    id: 'beyond-words',
    route: '/lab/beyond-words',
    titleHe: 'מעבר למילים',
    titleEn: 'Beyond Words',
    family: 'influence',
    promiseHe: 'בודקים מה ניסוח עושה בגוף, בקשב, ובקצב לפני שממשיכים לדבר.',
    audience: ['beginner', 'therapist', 'influence'],
    difficulty: 'beginner',
    sessionLengthMin: 5,
    primaryOutcome: 'יותר ויסות, יותר קשב, ופחות אוטומט בשיחה',
    quickStartLabel: 'בדוק/י סטייט',
    tags: ['somatic', 'state', 'regulation'],
    featured: true,
    status: 'stable',
    audienceLabelHe: 'מתאים למי שרוצה להבין מה קורה בגוף ובקשב',
    resultHe: 'תוך 3-5 דקות מזהים מה מכווץ, מה מרכך, ואיפה יש יותר משאבים.',
  },
  {
    id: 'mind-liberating-language',
    route: '/lab/mind-liberating-language',
    titleHe: 'Mind-Liberating Language',
    titleEn: 'Mind Liberating Language',
    family: 'influence',
    promiseHe: 'מתרגלים שפה שמזיזה framing, פותחת אפשרות, ומשנה חוויה מבפנים.',
    audience: ['practitioner', 'therapist', 'influence'],
    difficulty: 'advanced',
    sessionLengthMin: 6,
    primaryOutcome: 'ניסוח שמשחרר יותר ומכווץ פחות',
    quickStartLabel: 'פתח/י מסגור',
    tags: ['influence', 'reframing', 'indirect-language'],
    featured: true,
    status: 'beta',
    audienceLabelHe: 'מתאים למי שעובד עם מסגור, הובלה, ושפה עקיפה',
    resultHe: 'תוך 5-6 דקות רואים אילו ניסוחים פותחים יותר אפשרות ופחות תקיעות.',
  },
]

export const labManifestById = Object.fromEntries(labManifest.map((item) => [item.id, item]))

export function getLabManifest(labId) {
  return labManifestById[labId] ?? null
}

export function getLabsByFamily(familyId) {
  return labManifest.filter((lab) => lab.family === familyId)
}

function scoreFromMatch(list, id, points) {
  return list.includes(id) ? points : 0
}

export function recommendLabsForGateway({ personaId, goalId }) {
  const personaWeights = {
    beginner: ['phrasing', 'empathy', 'relations', 'beyond-words'],
    practitioner: ['clean-questions', 'relations', 'perspectives', 'mind-liberating-language'],
    therapist: ['relations', 'empathy', 'beyond-words', 'clean-questions'],
    influence: ['mind-liberating-language', 'beyond-words', 'phrasing', 'relations'],
  }

  const goalWeights = {
    'speak-better': ['phrasing', 'empathy', 'boundaries'],
    'ask-better': ['clean-questions', 'relations', 'perspectives'],
    'unstick-relationship': ['relations', 'perspectives', 'empathy'],
    'lead-gently': ['mind-liberating-language', 'beyond-words', 'phrasing'],
    'body-emotion': ['beyond-words', 'relations', 'mind-liberating-language'],
  }

  const scored = labManifest.map((lab) => {
    const personaScore = scoreFromMatch(personaWeights[personaId] ?? [], lab.id, 4)
    const goalScore = scoreFromMatch(goalWeights[goalId] ?? [], lab.id, 6)
    const audienceScore = lab.audience.includes(personaId) ? 2 : 0
    const featuredScore = lab.featured ? 1 : 0
    return {
      ...lab,
      score: personaScore + goalScore + audienceScore + featuredScore,
    }
  })

  return scored
    .sort((a, b) => b.score - a.score || a.sessionLengthMin - b.sessionLengthMin)
    .slice(0, 3)
}

export const topNavLabIds = ['phrasing', 'relations', 'beyond-words']
