const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

const pick = (items) => items[Math.floor(Math.random() * items.length)]

const hashString = (text) => {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const copy = (value) => JSON.parse(JSON.stringify(value))

export const RELATIONS_LAB_VERSION = 'Relations Lab / v2026.02.26.2'
export const RELATIONS_RECOMMENDER_VERSION = 'heuristic-guidance-v1'
export const RELATIONS_ARCHIVE_STORAGE_KEY = 'la.v1.relationsQuestionArchive'

export const relationsContextOptions = [
  { id: 'work', labelHe: 'עבודה' },
  { id: 'relationship', labelHe: 'זוגיות' },
  { id: 'parenting', labelHe: 'הורות' },
  { id: 'therapy', labelHe: 'טיפול' },
  { id: 'self', labelHe: 'עצמי' },
  { id: 'studies', labelHe: 'לימודים' },
]

export const relationsArchetypeOptions = [
  { id: 'couple-loop', labelHe: 'לולאה זוגית' },
  { id: 'discipline', labelHe: 'חוסר משמעת' },
  { id: 'procrastination', labelHe: 'דחיינות' },
  { id: 'performance-anxiety', labelHe: 'חרדת ביצוע' },
  { id: 'criticism', labelHe: 'ביקורתיות' },
  { id: 'stuck-identity', labelHe: 'זהות תקועה' },
]

export const relationsClientStyleOptions = [
  { id: 'rational', labelHe: 'רציונלי' },
  { id: 'emotional', labelHe: 'רגשי' },
  { id: 'defensive', labelHe: 'מתגונן' },
  { id: 'cynical', labelHe: 'ציני' },
  { id: 'pleaser', labelHe: 'מרצה' },
  { id: 'identity-stuck', labelHe: 'תקוע־בזהות' },
]

export const relationsEmotionOptions = [
  { id: 'fear', labelHe: 'פחד', icon: '😨', profile: { distress: 8, open: -6, resources: -4 } },
  { id: 'anger', labelHe: 'כעס', icon: '😠', profile: { distress: 7, open: -3, resources: -2 } },
  { id: 'sadness', labelHe: 'עצב', icon: '😢', profile: { distress: 6, open: -2, resources: -4 } },
  { id: 'shame', labelHe: 'בושה', icon: '🫣', profile: { distress: 9, open: -7, resources: -5 } },
  { id: 'guilt', labelHe: 'אשמה', icon: '😔', profile: { distress: 8, open: -4, resources: -5 } },
  { id: 'confusion', labelHe: 'בלבול', icon: '😵', profile: { distress: 5, open: -1, resources: -3 } },
  { id: 'hope', labelHe: 'תקווה', icon: '🌤️', profile: { distress: -3, open: 6, resources: 4 } },
  { id: 'calm', labelHe: 'רוגע', icon: '🧘', profile: { distress: -6, open: 5, resources: 6 } },
]

const emotionById = Object.fromEntries(relationsEmotionOptions.map((item) => [item.id, item]))

export const relationsQuestionFamilies = [
  {
    id: 'between',
    labelHe: 'בין שני הדברים',
    helperHe: 'ממפה קשרים, תפקידים ומחירים.',
    questions: [
      { id: 'between-link', textTemplate: 'מה הקשר בין {element1} ל־{element2} אצלך כרגע?', impact: { open: 10, resources: 5, distress: -4 } },
      { id: 'between-protect', textTemplate: 'מה {element1} מנסה לשמור עליך ממנו דרך {element2}?', impact: { open: 8, resources: 8, distress: -3 } },
      { id: 'between-price', textTemplate: 'מה המחיר של להחזיק את {element1} ואת {element2} בהתנגשות?', impact: { open: 11, resources: 4, distress: 1 } },
    ],
  },
  {
    id: 'directional',
    labelHe: 'מי משפיע על מי',
    helperHe: '1→2 / 2→1 / סדר בזמן.',
    questions: [
      { id: 'dir-12', textTemplate: 'איך בדיוק {element1} מפעיל את {element2} ב־{contextF}?', impact: { open: 9, resources: 4, distress: -2 } },
      { id: 'dir-21', textTemplate: 'ומה קורה בכיוון ההפוך — כש{element2} פוגש את {element1}?', impact: { open: 10, resources: 6, distress: -1 } },
      { id: 'dir-time', textTemplate: 'מה מופיע קודם בזמן: {element1} או {element2}?', impact: { open: 11, resources: 5, distress: -3 } },
    ],
  },
  {
    id: 'field',
    labelHe: 'תפקיד ההקשר',
    helperHe: 'פותח הקשר, תנאים ושדות חלופיים.',
    questions: [
      { id: 'field-soften', textTemplate: 'באיזה הקשר בתוך {contextF} הקשר בין {element1} ל־{element2} פחות נסגר?', impact: { open: 14, resources: 6, distress: -5 } },
      { id: 'field-goal', textTemplate: 'מה משתנה אם המטרה היא {goalG} ב־5% יותר רכות?', impact: { open: 13, resources: 8, distress: -6 } },
      { id: 'field-alt', textTemplate: 'איזה שדה חלופי יכול לאפשר מרווח חדש בין {element1} ל־{element2}?', impact: { open: 15, resources: 7, distress: -4 } },
    ],
  },
  {
    id: 'inside',
    labelHe: 'אחד בתוך השני',
    helperHe: '1 בתוך 2 / 2 בתוך 1 / חלקים פנימיים.',
    questions: [
      { id: 'inside-2in1', textTemplate: 'איפה יש קצת {element2} גם בתוך {element1}?', impact: { open: 11, resources: 7, distress: -4 } },
      { id: 'inside-1in2', textTemplate: 'איפה {element1} בעצם מנסה להגן על {element2}?', impact: { open: 12, resources: 9, distress: -5 } },
      { id: 'inside-cond', textTemplate: 'מה בתוך {element1} צריך תנאי קטן כדי להירגע ליד {element2}?', impact: { open: 10, resources: 10, distress: -7 } },
    ],
  },
  {
    id: 'meta',
    labelHe: 'הקשר עצמו',
    helperHe: 'שאלות על היחס עצמו R.',
    questions: [
      { id: 'meta-name', textTemplate: 'אם תתאר/י את היחס ({relationShort}) בלי "תמיד", איך זה נשמע?', impact: { open: 13, resources: 5, distress: -3 } },
      { id: 'meta-belief', textTemplate: 'מה היחס הזה גורם לך להאמין על עצמך ב־{contextF}?', impact: { open: 10, resources: 6, distress: 0 } },
      { id: 'meta-strategy', textTemplate: 'אם היחס הזה הוא אסטרטגיה זמנית ולא זהות — מה נפתח?', impact: { open: 16, resources: 9, distress: -6 } },
    ],
  },
]

const questionById = Object.fromEntries(
  relationsQuestionFamilies.flatMap((family) =>
    family.questions.map((question) => [question.id, { ...question, familyId: family.id, familyLabelHe: family.labelHe }]),
  ),
)

const recommendationFocusCopyByMetric = {
  openField: {
    labelHe: 'לפתוח יותר מרווח',
    summaryHe: 'כרגע עדיף לפתוח יותר מרווח לפני שמעמיקים עוד.',
  },
  resources: {
    labelHe: 'לגייס יותר משאבים',
    summaryHe: 'כרגע עדיף לבחור שאלה שמחזירה יותר משאבים וסבלנות.',
  },
  distress: {
    labelHe: 'להוריד עומס',
    summaryHe: 'כרגע עדיף להתחיל בשאלה שמורידה עומס לפני עוד עומק.',
  },
}

const familyGuidanceProfiles = {
  between: {
    focusWeights: { openField: 0.75, resources: 0.3, distress: 0.25 },
    emotionWeights: { anger: 2, sadness: 1, guilt: 1, confusion: 1 },
    reasonHe: 'השאלות כאן ממפות את הקשר בין שני הכוחות במקום להשאיר אותם במאבק.',
    emotionReasonHe: 'כשהרגש טעון, מיפוי של שני הצדדים נותן יותר אחיזה ופחות תגובתיות.',
  },
  directional: {
    focusWeights: { openField: 0.7, resources: 0.25, distress: -0.2 },
    emotionWeights: { confusion: 2, fear: 1, calm: 1 },
    reasonHe: 'השאלות כאן עוזרות לראות איפה השרשרת מתחילה ואיפה אפשר להתערב.',
    emotionReasonHe: 'כשיש בלבול, בירור הכיוון מחזיר סדר ומוריד ערפל.',
  },
  field: {
    focusWeights: { openField: 1, resources: 0.55, distress: 0.95 },
    emotionWeights: { fear: 2, shame: 2, anger: 1, guilt: 1 },
    reasonHe: 'השאלות כאן מרככות דרך ההקשר, לא דרך עוד מאמץ.',
    emotionReasonHe: 'כשהרגש מציף, שינוי הקשר או קצב נותן כניסה עדינה יותר.',
  },
  inside: {
    focusWeights: { openField: 0.45, resources: 1, distress: 0.85 },
    emotionWeights: { shame: 2, guilt: 2, sadness: 1, fear: 1 },
    reasonHe: 'השאלות כאן מחזירות משאבים ומפחיתות פיצול פנימי.',
    emotionReasonHe: 'כשהרגש מכביד, עבודה פנימית עדינה מייצרת יותר משאבים להמשך.',
  },
  meta: {
    focusWeights: { openField: 0.95, resources: 0.3, distress: 0.2 },
    emotionWeights: { confusion: 1, calm: 1, hope: 1 },
    reasonHe: 'השאלות כאן משנות מסגור של הדפוס ולא רק את התוכן שלו.',
    emotionReasonHe: 'כשהסיפור ננעל, מסגור חדש יכול לפתוח אפשרות שלא הופיעה קודם.',
  },
}

const STYLE_LEADS = {
  rational: 'אם אני מפרק/ת את זה לוגית:',
  emotional: 'זה מרגיש ככה בגוף:',
  defensive: 'אני ישר רוצה להסביר, אבל:',
  cynical: 'בדרך כלל אני ציני/ת לגבי זה, אבל:',
  pleaser: 'אני שם/ה לב שאני מנסה לענות "נכון":',
  'identity-stuck': 'זה מפעיל סיפור על מי שאני:',
}

export const relationsScenarioSeeds = [
  {
    id: 'work-raise',
    contextId: 'work',
    archetypeId: 'performance-anxiety',
    contextF: 'בפגישת 1:1 עם המנהל/ת בעבודה',
    goalG: 'לבקש העלאה בלי להיחנק',
    element1: 'פחד לטעות',
    element2: 'נוכחות וביטחון',
    initialRelationR0: { type: 'cause', shortHe: '1→2 (פחד חוסם ביטחון)' },
    baseBars: { openField: 28, resources: 33, distress: 74 },
    baselineEmotionId: 'fear',
    alternativeFields: ['שיחת הכנה עם חבר/ה', 'כתיבת נקודות לפני הפגישה', 'מטרה: בהירות ולא הוכחה'],
    monologue: 'אני מגיע/ה לפגישת 1:1 כבר דרוך/ה.\nאני רוצה לבקש העלאה ולהישמע ברור/ה.\nאבל ברגע האמת הפחד לטעות משתלט.\nאני מאבד/ת נוכחות וביטחון ומתחיל/ה להתנצל.\nאחר כך אני כועס/ת על עצמי שלא אמרתי מה שרציתי.\nבפעם הבאה אני מבטיח/ה לעצמי שזה יהיה אחרת.',
  },
  {
    id: 'work-feedback',
    contextId: 'work',
    archetypeId: 'criticism',
    contextF: 'בישיבת צוות בעבודה',
    goalG: 'להישאר ענייני/ת כשיש ביקורת',
    element1: 'ביקורת פנימית',
    element2: 'למידה ותגובה עניינית',
    initialRelationR0: { type: 'loop', shortHe: 'לולאה (1↺2)' },
    baseBars: { openField: 34, resources: 38, distress: 68 },
    baselineEmotionId: 'shame',
    alternativeFields: ['שיחה בזוג ולא מול כולם', 'סיכום כתוב אחרי הישיבה', 'בירור כוונה לפני תגובה'],
    monologue: 'בישיבת צוות, אם מעירים לי, אני ישר מתכווץ/ת.\nאני רוצה ללמוד ולהגיב עניינית.\nאבל הביקורת הפנימית מתחילה מהר יותר מההקשבה.\nאני שומע/ת רק מה לא בסדר בי.\nואז אין לי גישה ללמידה, רק להגנה או שתיקה.\nזה נשאר איתי הרבה אחרי הישיבה.',
  },
  {
    id: 'relationship-loop',
    contextId: 'relationship',
    archetypeId: 'couple-loop',
    contextF: 'בשיחה זוגית בערב אחרי יום עמוס',
    goalG: 'להתחבר בלי להידרדר לריב',
    element1: 'התגוננות',
    element2: 'צורך בקרבה',
    initialRelationR0: { type: 'conflict', shortHe: 'התנגשות (1↔2)' },
    baseBars: { openField: 25, resources: 31, distress: 79 },
    baselineEmotionId: 'anger',
    alternativeFields: ['שיחה בזמן הליכה', 'פתיחה עם כוונה', 'השהיה של 10 דקות'],
    monologue: 'בערב כשאנחנו מדברים, זה כבר מגיע עם מטען.\nאני רוצה קרבה וחיבור.\nאבל ברגע שאני מרגיש/ה ביקורת אני מתגונן/ת.\nההתגוננות נשמעת כמו ריחוק.\nהצד השני מתרחק/ת עוד יותר, ואני נשאר/ת לבד.\nאנחנו נופלים לאותה לולאה שוב.',
  },
  {
    id: 'relationship-money',
    contextId: 'relationship',
    archetypeId: 'stuck-identity',
    contextF: 'אחרי ויכוח זוגי סביב כסף',
    goalG: 'לדבר על כסף בלי להרגיש שאני "הבעיה"',
    element1: 'זהות של "אני לא אחראי/ת"',
    element2: 'יכולת לתכנן יחד',
    initialRelationR0: { type: 'identity', shortHe: 'זהות→התנהגות' },
    baseBars: { openField: 30, resources: 29, distress: 76 },
    baselineEmotionId: 'guilt',
    alternativeFields: ['בדיקת מספרים בלי פרשנות', 'כלל: בלי תוויות', 'פגישה שבועית קצרה'],
    monologue: 'כשעולה כסף אני מרגיש/ה שמסתכלים עליי כאילו אני הבעיה.\nאני רוצה שנתכנן יחד.\nאבל עולה בי משפט: אני פשוט לא אחראי/ת.\nכשזה נדלק אני נכנס/ת לאשמה ולא לחשיבה.\nואז אין שיחה, רק תגובות.\nזה כבר מרגיש כמו זהות, לא מצב.',
  },
  {
    id: 'parenting-homework',
    contextId: 'parenting',
    archetypeId: 'criticism',
    contextF: 'בשיעורי בית עם הילד/ה',
    goalG: 'לעזור בלי להפוך לשוטר/ת',
    element1: 'לחץ להספיק',
    element2: 'סבלנות וקשר',
    initialRelationR0: { type: 'cause', shortHe: '1→2 (לחץ חונק קשר)' },
    baseBars: { openField: 32, resources: 37, distress: 71 },
    baselineEmotionId: 'anger',
    alternativeFields: ['קטעים קצרים', 'משימה אחת בלבד', '3 דקות חיבור לפני למידה'],
    monologue: 'בשיעורי בית אני נכנס/ת מהר ללחץ של זמן.\nאני רוצה לעזור ולשמור על קשר טוב.\nאבל מרוב לחץ אני מתחיל/ה לתקן כל דבר.\nהילד/ה נסגר/ת ואז אני מעלה טון.\nאחרי זה אני שונא/ת את איך שנשמעת השיחה.\nאני מאבד/ת גם סבלנות וגם קשר.',
  },
  {
    id: 'parenting-meeting',
    contextId: 'parenting',
    archetypeId: 'performance-anxiety',
    contextF: 'לפני שיחת הורים',
    goalG: 'להגיע רגוע/ה ולהחזיק שיחה פתוחה',
    element1: 'פחד שישפטו אותי כהורה',
    element2: 'סקרנות ושיתוף פעולה',
    initialRelationR0: { type: 'cause', shortHe: '1→2 (שיפוט→סגירה)' },
    baseBars: { openField: 36, resources: 35, distress: 69 },
    baselineEmotionId: 'fear',
    alternativeFields: ['שאלה אחת מוכנה מראש', 'מטרה: מה עוזר לילד/ה', 'שיחה עם מורה אחת'],
    monologue: 'לפני שיחת הורים אני נדרך/ת כאילו אני נבחן/ת.\nאני רוצה להגיע פתוח/ה.\nאבל עולה פחד שישפטו אותי כהורה.\nאני נהיה/ית קשוח/ה או מצטדק/ת.\nהסקרנות נעלמת.\nאחר כך אני מרגיש/ה שהשיחה לא קידמה אותנו.',
  },
  {
    id: 'therapy-identity',
    contextId: 'therapy',
    archetypeId: 'stuck-identity',
    contextF: 'בתחילת פגישה טיפולית כשעולה נושא חוזר',
    goalG: 'לדבר על עצמי בלי לקפוא לתוך תווית',
    element1: 'תווית "אני מקולקל/ת"',
    element2: 'חלק סקרן שרוצה להבין',
    initialRelationR0: { type: 'identity', shortHe: 'זהות→קיפאון' },
    baseBars: { openField: 27, resources: 30, distress: 77 },
    baselineEmotionId: 'shame',
    alternativeFields: ['דיבור על סיטואציה ספציפית', 'שפה של "כרגע"', 'מיפוי רגע לפני הסגירה'],
    monologue: 'כשעולה הנושא הזה בטיפול אני חושב/ת: שוב אני מקולקל/ת.\nאני רוצה להבין מה קורה בי.\nאבל התווית הזו סוגרת לי את הראש.\nאני מפסיק/ה להיות סקרן/ית ונכנס/ת לבושה.\nואז אני רק מספר/ת את אותה גרסה של הסיפור.\nמרגיש/ה שאנחנו נוגעים בזה ולא זזים.',
  },
  {
    id: 'therapy-loop',
    contextId: 'therapy',
    archetypeId: 'couple-loop',
    contextF: 'בשחזור שיחה טעונה בקליניקה',
    goalG: 'לראות את הלולאה ולא רק את האשמה',
    element1: 'צורך להוכיח צדק',
    element2: 'יכולת לראות את תגובת האחר/ת',
    initialRelationR0: { type: 'loop', shortHe: 'לולאה (צדק↺עיוורון)' },
    baseBars: { openField: 33, resources: 34, distress: 72 },
    baselineEmotionId: 'anger',
    alternativeFields: ['האטה של השחזור', 'מיפוי רגע לפני הפיצוץ', 'שאלה על כוונה'],
    monologue: 'כשאני משחזר/ת את השיחה אני ישר רוצה להראות למה אני צודק/ת.\nאני רוצה להבין את הלולאה.\nאבל מרגע שאני נכנס/ת לצדק אני מפסיק/ה לראות את התגובה של האחר/ת.\nהסיפור נהיה חד־צדדי.\nאני חוזר/ת לכעס והצדקה.\nקשה לי לראות מה באמת מזין את זה.',
  },
  {
    id: 'self-procrastination',
    contextId: 'self',
    archetypeId: 'procrastination',
    contextF: 'כשהמשימה החשובה מחכה לי בבוקר',
    goalG: 'להתחיל פעולה בלי להיתקע שעה',
    element1: 'פחד מחוסר שלמות',
    element2: 'פעולה קטנה התחלתית',
    initialRelationR0: { type: 'cause', shortHe: '1→2 (שלמות→דחייה)' },
    baseBars: { openField: 29, resources: 32, distress: 73 },
    baselineEmotionId: 'confusion',
    alternativeFields: ['15 דקות טיוטה', 'התחלה בלי תוצאה סופית', 'שינוי מקום עבודה'],
    monologue: 'בבוקר אני יודע/ת בדיוק מה חשוב לעשות.\nאני רוצה להתחיל ולהתקדם.\nאבל עולה פחד שזה לא יצא טוב.\nבמקום צעד קטן אני מסתובב/ת, מסדר/ת, בודק/ת דברים.\nהשעה עוברת ואני כבר מרגיש/ה אשמה.\nהדחיינות מרגישה חזקה ממני.',
  },
  {
    id: 'self-discipline',
    contextId: 'self',
    archetypeId: 'discipline',
    contextF: 'כשאני בונה לעצמי שגרה חדשה',
    goalG: 'לשמור רצף בלי מרד פנימי',
    element1: 'קשיחות פנימית',
    element2: 'חופש וגמישות',
    initialRelationR0: { type: 'conflict', shortHe: 'התנגשות (משמעת↔חופש)' },
    baseBars: { openField: 35, resources: 36, distress: 66 },
    baselineEmotionId: 'anger',
    alternativeFields: ['מינימום יומי', 'ימי חופש מובנים', 'בדיקה שבועית במקום יומית'],
    monologue: 'כשאני מתחיל/ה שגרה אני נהיה/ית נוקשה עם עצמי.\nאני רוצה רצף, אבל גם חופש.\nהקשיחות אמורה לעזור, אבל היא מייצרת מרד.\nאחרי יום לא מושלם אני נופל/ת לגמרי.\nואז אני אומר/ת שאין לי משמעת.\nאני נע/ה בין שליטה להתפרקות.',
  },
  {
    id: 'studies-exam',
    contextId: 'studies',
    archetypeId: 'performance-anxiety',
    contextF: 'בערב לפני מבחן',
    goalG: 'ללמוד יעיל בלי להיכנס לפאניקה',
    element1: 'פחד להיכשל',
    element2: 'ריכוז',
    initialRelationR0: { type: 'cause', shortHe: '1→2 (פחד→פיזור)' },
    baseBars: { openField: 31, resources: 34, distress: 78 },
    baselineEmotionId: 'fear',
    alternativeFields: ['בלוקים של 20 דק׳', 'שאלה אחת במקום הכל', 'הרגעה קצרה לפני למידה'],
    monologue: 'בערב לפני מבחן אני נלחץ/ת שיש יותר מדי חומר.\nאני רוצה ללמוד יעיל ולהישאר מרוכז/ת.\nאבל הפחד להיכשל מפזר לי את הראש.\nאני קופץ/ת בין נושאים בלי לסיים כלום.\nהזמן עובר והלחץ גדל.\nמרגיש/ה שעבדתי הרבה ולא התקדמתי.',
  },
  {
    id: 'studies-paper',
    contextId: 'studies',
    archetypeId: 'procrastination',
    contextF: 'כשהעבודה להגשה פתוחה על המסך',
    goalG: 'להתחיל טיוטה במקום לדחות',
    element1: 'בלבול מאיפה להתחיל',
    element2: 'כתיבה לא מושלמת',
    initialRelationR0: { type: 'loop', shortHe: 'לולאה (בלבול↺דחייה)' },
    baseBars: { openField: 33, resources: 30, distress: 70 },
    baselineEmotionId: 'confusion',
    alternativeFields: ['כותרות בלבד', 'טיוטה ידנית 10 דק׳', 'outline עם חבר/ה'],
    monologue: 'כשאני פותח/ת את העבודה, אני לא יודע/ת מאיפה להתחיל.\nאני רוצה פשוט טיוטה.\nאבל הבלבול גורם לי לחשוב שאני צריך/ה להבין הכל קודם.\nאז אני קורא/ת עוד ולא כותב/ת.\nהדחייה מגדילה לחץ ובלבול.\nאני מרגיש/ה לכוד/ה בלופ הזה.',
  },
]

const familyById = Object.fromEntries(relationsQuestionFamilies.map((family) => [family.id, family]))

export function createDefaultRelationsWizardSettings() {
  return {
    contextId: relationsContextOptions[0].id,
    archetypeId: relationsArchetypeOptions[0].id,
    difficulty: 3,
    clientStyleId: relationsClientStyleOptions[0].id,
    altFieldsCount: 2,
  }
}

function composeMonologue(seed, clientStyleId) {
  const lead = STYLE_LEADS[clientStyleId] ?? STYLE_LEADS.rational
  return `${lead}\n${seed.monologue}`
}

function pickScenarioSeed(settings) {
  const exact = relationsScenarioSeeds.filter(
    (seed) => seed.contextId === settings.contextId && seed.archetypeId === settings.archetypeId,
  )
  if (exact.length) return copy(pick(exact))

  const contextMatches = relationsScenarioSeeds.filter((seed) => seed.contextId === settings.contextId)
  if (contextMatches.length) return copy(pick(contextMatches))

  const archetypeMatches = relationsScenarioSeeds.filter((seed) => seed.archetypeId === settings.archetypeId)
  if (archetypeMatches.length) return copy(pick(archetypeMatches))

  return copy(pick(relationsScenarioSeeds))
}

export function createRelationsScenario(settingsInput) {
  const settings = {
    ...createDefaultRelationsWizardSettings(),
    ...(settingsInput ?? {}),
    difficulty: clamp(Number(settingsInput?.difficulty ?? 3), 1, 5),
    altFieldsCount: clamp(Number(settingsInput?.altFieldsCount ?? 2), 1, 3),
  }
  const seed = pickScenarioSeed(settings)
  const diff = settings.difficulty
  const variance = (hashString(`${seed.id}:${settings.clientStyleId}:${diff}`) % 7) - 3
  const load = (diff - 1) * 5

  return {
    id: `relations-${seed.id}-${Date.now()}`,
    seedId: seed.id,
    createdAt: new Date().toISOString(),
    settings,
    contextId: seed.contextId,
    archetypeId: seed.archetypeId,
    contextF: seed.contextF,
    goalG: seed.goalG,
    element1: seed.element1,
    element2: seed.element2,
    initialRelationR0: seed.initialRelationR0,
    baselineEmotionId: seed.baselineEmotionId,
    clientMonologueText: composeMonologue(seed, settings.clientStyleId),
    clientMonologueLines: composeMonologue(seed, settings.clientStyleId).split('\n'),
    alternativeFields: seed.alternativeFields.slice(0, settings.altFieldsCount),
    initialBars: {
      openField: clamp(seed.baseBars.openField - load + variance),
      resources: clamp(seed.baseBars.resources - Math.round(load * 0.8) - variance),
      distress: clamp(seed.baseBars.distress + load + variance),
    },
  }
}

export function formatRelationsQuestionText(template, scenario) {
  return String(template)
    .replaceAll('{element1}', scenario.element1)
    .replaceAll('{element2}', scenario.element2)
    .replaceAll('{contextF}', scenario.contextF)
    .replaceAll('{goalG}', scenario.goalG)
    .replaceAll('{relationShort}', scenario.initialRelationR0.shortHe)
}

export function buildRelationsQuestionSetForScenario(scenario) {
  return relationsQuestionFamilies.map((family) => ({
    ...family,
    questions: family.questions.map((question) => ({
      ...question,
      renderedText: formatRelationsQuestionText(question.textTemplate, scenario),
    })),
  }))
}

function familyFitBonus(familyId, bars) {
  let bonus = 0
  if (bars.openField < 35 && (familyId === 'field' || familyId === 'meta')) bonus += 4
  if (bars.resources < 40 && (familyId === 'inside' || familyId === 'field')) bonus += 3
  if (bars.distress > 70 && (familyId === 'inside' || familyId === 'between')) bonus += 4
  if (bars.distress > 75 && familyId === 'directional') bonus -= 2
  return bonus
}

function emotionEffect(emotionBefore) {
  if (!emotionBefore?.id) return { open: 0, resources: 0, distress: 0 }
  const emotion = emotionById[emotionBefore.id]
  if (!emotion) return { open: 0, resources: 0, distress: 0 }
  const scale = clamp(Number(emotionBefore.intensity ?? 3), 1, 5) / 5
  return {
    open: Math.round((emotion.profile.open ?? 0) * scale),
    resources: Math.round((emotion.profile.resources ?? 0) * scale),
    distress: Math.round((emotion.profile.distress ?? 0) * scale),
  }
}

export function scoreQuestionSuggestion(question, familyId, bars) {
  return (
    (question.impact.open * 1.2) +
    (question.impact.resources * 1.1) -
    (Math.max(0, question.impact.distress) * 1.3) +
    (Math.max(0, -question.impact.distress) * 0.8) +
    familyFitBonus(familyId, bars)
  )
}

function buildRecommendationMetricNeeds(bars) {
  return {
    openField: clamp(55 - Number(bars?.openField ?? 0), 0, 55),
    resources: clamp(55 - Number(bars?.resources ?? 0), 0, 55),
    distress: clamp(Number(bars?.distress ?? 0) - 45, 0, 55),
  }
}

function getPrimaryRecommendationNeed(needs) {
  const ordered = Object.entries(needs).sort((a, b) => b[1] - a[1])
  const [metricKey, strength] = ordered[0] ?? ['openField', 0]
  return { metricKey, strength }
}

function roundRecommendationValue(value) {
  return Math.round(value * 10) / 10
}

function getEmotionRecommendationBonus(familyId, emotionBefore) {
  if (!emotionBefore?.id) return 0
  const profile = familyGuidanceProfiles[familyId]
  if (!profile) return 0

  const intensity = clamp(Number(emotionBefore.intensity ?? 3), 1, 5)
  const weight = profile.emotionWeights?.[emotionBefore.id] ?? 0
  return weight * (0.7 + intensity * 0.35)
}

function getRecommendationMomentumBonus(familyId, latestTurn) {
  if (!latestTurn) return 0

  const improvement =
    Number(latestTurn.deltas?.openField ?? 0) +
    Number(latestTurn.deltas?.resources ?? 0) -
    Number(latestTurn.deltas?.distress ?? 0)

  const sameFamily = latestTurn.familyId === familyId
  const profile = familyGuidanceProfiles[familyId]
  let bonus = 0

  if (sameFamily && improvement >= 12) bonus += 2.5
  if (sameFamily && improvement <= 0) bonus -= 2.5
  if (sameFamily && Number(latestTurn.deltas?.distress ?? 0) > 0) bonus -= 2

  if (!sameFamily && Number(latestTurn.deltas?.distress ?? 0) > 0) {
    if ((profile?.focusWeights?.distress ?? 0) >= 0.8) bonus += 2
    if ((profile?.focusWeights?.resources ?? 0) >= 0.8) bonus += 1
  }

  if (!sameFamily && Number(latestTurn.deltas?.openField ?? 0) <= 0) {
    if ((profile?.focusWeights?.openField ?? 0) >= 0.9) bonus += 1.5
  }

  return bonus
}

function buildRecommendationReasons({
  familyId,
  latestTurn,
  emotionBefore,
  primaryNeed,
}) {
  const profile = familyGuidanceProfiles[familyId]
  const focusCopy = recommendationFocusCopyByMetric[primaryNeed.metricKey]
  const reasons = [
    focusCopy?.summaryHe,
    profile?.reasonHe,
  ]

  if (emotionBefore?.id && (profile?.emotionWeights?.[emotionBefore.id] ?? 0) > 0) {
    reasons.push(profile.emotionReasonHe)
  }

  if (latestTurn?.familyId === familyId) {
    const improvement =
      Number(latestTurn.deltas?.openField ?? 0) +
      Number(latestTurn.deltas?.resources ?? 0) -
      Number(latestTurn.deltas?.distress ?? 0)

    if (improvement >= 12) {
      reasons.push('המשפחה הזו כבר הזיזה משהו בסבב האחרון, ולכן שווה להמשיך איתה עוד צעד.')
    }
    if (Number(latestTurn.deltas?.distress ?? 0) > 0) {
      reasons.push('הסבב האחרון העלה עומס, ולכן כדאי לבחור עכשיו שאלה עדינה יותר.')
    }
  }

  return reasons.filter(Boolean).slice(0, 3)
}

function pickDistinctFamilyRecommendations(items, limit, excludedFamilyIds = new Set()) {
  const picked = []
  const usedFamilyIds = new Set(excludedFamilyIds)

  for (const item of items) {
    if (usedFamilyIds.has(item.familyId)) continue
    picked.push(item)
    usedFamilyIds.add(item.familyId)
    if (picked.length >= limit) break
  }

  return picked
}

export function buildGuidedQuestionRecommendations({
  scenario,
  bars,
  emotionBefore = null,
  latestTurn = null,
  limit = 3,
}) {
  if (!scenario || !bars) return null

  const needs = buildRecommendationMetricNeeds(bars)
  const primaryNeed = getPrimaryRecommendationNeed(needs)
  const focusCopy = recommendationFocusCopyByMetric[primaryNeed.metricKey]
  const renderedFamilies = buildRelationsQuestionSetForScenario(scenario)

  const ranked = renderedFamilies
    .flatMap((family) =>
      family.questions.map((question) => {
        const profile = familyGuidanceProfiles[family.id] ?? familyGuidanceProfiles.between
        const baseScore = scoreQuestionSuggestion(question, family.id, bars)
        const metricFit =
          (
            (needs.openField * (profile.focusWeights.openField ?? 0)) +
            (needs.resources * (profile.focusWeights.resources ?? 0)) +
            (needs.distress * (profile.focusWeights.distress ?? 0))
          ) * 0.12
        const emotionFit = getEmotionRecommendationBonus(family.id, emotionBefore)
        const momentumFit = getRecommendationMomentumBonus(family.id, latestTurn)
        const archetypeFit =
          scenario.archetypeId === 'stuck-identity' && family.id === 'meta'
            ? 2.5
            : 0
        const score = baseScore + metricFit + emotionFit + momentumFit + archetypeFit

        return {
          familyId: family.id,
          familyLabelHe: family.labelHe,
          familyHelperHe: family.helperHe,
          question,
          renderedText: question.renderedText,
          score: roundRecommendationValue(score),
          whyHe: buildRecommendationReasons({
            familyId: family.id,
            latestTurn,
            emotionBefore,
            primaryNeed,
          }),
          debug: {
            baseScore: roundRecommendationValue(baseScore),
            metricFit: roundRecommendationValue(metricFit),
            emotionFit: roundRecommendationValue(emotionFit),
            momentumFit: roundRecommendationValue(momentumFit),
            archetypeFit: roundRecommendationValue(archetypeFit),
          },
        }
      }),
    )
    .sort((a, b) => b.score - a.score)

  const primary = ranked[0] ?? null
  const alternatives = primary
    ? pickDistinctFamilyRecommendations(ranked.slice(1), Math.max(0, limit - 1), new Set([primary.familyId]))
    : []

  return {
    engineId: RELATIONS_RECOMMENDER_VERSION,
    primaryNeedKey: primaryNeed.metricKey,
    focusLabelHe: focusCopy?.labelHe ?? recommendationFocusCopyByMetric.openField.labelHe,
    summaryHe: focusCopy?.summaryHe ?? recommendationFocusCopyByMetric.openField.summaryHe,
    primary,
    alternatives,
    ranked: ranked.slice(0, Math.max(limit + 2, 5)),
  }
}

export function suggestSmartQuestion({
  scenario,
  bars,
  emotionBefore = null,
  latestTurn = null,
}) {
  return (
    buildGuidedQuestionRecommendations({
      scenario,
      bars,
      emotionBefore,
      latestTurn,
      limit: 1,
    })?.primary ?? null
  )
}

function relationStageFromBars(bars) {
  const score = (bars.openField + bars.resources) - bars.distress
  if (score < -10) return 0
  if (score < 20) return 1
  if (score < 50) return 2
  return 3
}

function buildClientAnswer({ scenario, familyId, settings, emotionBefore, barsBefore, barsAfter }) {
  const emotionLabel = emotionById[emotionBefore?.id]?.labelHe ?? 'הרגש הזה'
  const altField = scenario.alternativeFields[0] ?? scenario.contextF
  const styleLead = STYLE_LEADS[settings.clientStyleId] ?? STYLE_LEADS.rational
  const familyLines = {
    between: `אני רואה ש־${scenario.element1} ו־${scenario.element2} לא רק נלחמים, יש ביניהם גם תפקיד.`,
    directional: `יש פה רגע קטן לפני האוטומט שבו הכיוון נהיה ברור יותר.`,
    field: `כשאני חושב/ת על שדה אחר כמו "${altField}", זה כבר לא מרגיש אותו דבר.`,
    inside: `יש חלק בתוך ${scenario.element1} שבכלל מנסה לשמור עליי, וזה משנה משהו.`,
    meta: 'היחס עצמו נשמע פחות כמו אמת מוחלטת ויותר כמו דפוס.',
  }
  const fieldShift = barsAfter.openField - barsBefore.openField >= 0 ? 'נפתח' : 'נסגר'
  return [
    `${styleLead} השאלה הזאת פוגשת אצלי ${emotionLabel}.`,
    familyLines[familyId] ?? familyLines.between,
    `אני מרגיש/ה שהשדה ${fieldShift} קצת ושיש יותר מילים למה שקורה.`,
  ].join('\n')
}

function buildCoachInsight({ familyId, barsBefore, barsAfter, scenario }) {
  const beforeStage = relationStageFromBars(barsBefore)
  const afterStage = relationStageFromBars(barsAfter)
  const relationBefore = beforeStage === 0 ? scenario.initialRelationR0.shortHe : `R${beforeStage}`
  const relationAfter = `R${afterStage}`
  const relationLine =
    beforeStage === afterStage
      ? `עוגן הבעיה עדיין ${relationBefore}, אבל הוא מתרכך.`
      : `היחס השתנה מ־${relationBefore} ל־${relationAfter}.`
  const cueByFamily = {
    between: 'הבעיה זזה ממאבק למיפוי קשר.',
    directional: 'הכיווניות התבהרה ונוצרה נקודת התערבות.',
    field: 'השינוי קורה דרך ההקשר, לא רק דרך "כוח רצון".',
    inside: 'יש יותר אינטגרציה ופחות פיצול בין חלקים.',
    meta: 'המסגור של היחס התרכך ונפתחה אפשרות חדשה.',
  }
  return `${relationLine} ${cueByFamily[familyId]}`
}

function inferEmotionAfterTurn({ barsAfter, deltas, emotionBefore }) {
  const openness = clamp(Number(barsAfter?.openField ?? 0))
  const resources = clamp(Number(barsAfter?.resources ?? 0))
  const distress = clamp(Number(barsAfter?.distress ?? 0))
  const openDelta = Number(deltas?.openField ?? 0)
  const resourcesDelta = Number(deltas?.resources ?? 0)
  const distressDelta = Number(deltas?.distress ?? 0)
  const improvement = openDelta + resourcesDelta - distressDelta

  let emotionId = emotionBefore?.id ?? 'confusion'

  if (distress <= 38 && openness >= 56 && resources >= 52) {
    emotionId = 'calm'
  } else if (improvement >= 12 && (openness >= 46 || resources >= 50) && distress <= 62) {
    emotionId = 'hope'
  } else if (distress >= 78 && openness <= 32 && resources <= 32) {
    emotionId = 'shame'
  } else if (distress >= 74 && (emotionBefore?.id === 'anger' || distressDelta > 0 || openDelta < 0)) {
    emotionId = 'anger'
  } else if (distress >= 70 && openness <= 40) {
    emotionId = 'fear'
  } else if (distress >= 64 && resources <= 38) {
    emotionId = 'guilt'
  } else if (distress >= 58 && openness <= 48 && resources <= 50) {
    emotionId = 'sadness'
  } else if (Math.abs(openDelta) <= 4 && Math.abs(resourcesDelta) <= 4 && distress >= 50) {
    emotionId = 'confusion'
  } else if (openness >= 48 || resources >= 52) {
    emotionId = 'hope'
  }

  const positiveEmotions = new Set(['calm', 'hope'])
  const baseIntensity =
    positiveEmotions.has(emotionId)
      ? Math.round(((openness + resources + (100 - distress)) / 3) / 20)
      : Math.round(((distress + (100 - openness) + (100 - resources)) / 3) / 20)
  const deltaBoost =
    positiveEmotions.has(emotionId)
      ? improvement >= 12
        ? 1
        : 0
      : distressDelta > 0 || improvement <= -8
        ? 1
        : 0
  const intensity = clamp(baseIntensity + deltaBoost, 1, 5)

  return {
    id: emotionId,
    intensity,
    labelHe: emotionById[emotionId]?.labelHe ?? emotionId,
  }
}

export function simulateQuestionTurn({
  scenario,
  settings,
  barsBefore,
  question,
  familyId,
  emotionBefore,
  turnIndex,
}) {
  const diff = clamp(Number(settings?.difficulty ?? 3), 1, 5)
  const diffScale = 1 - ((diff - 1) * 0.08)
  const fit = familyFitBonus(familyId, barsBefore)
  const mood = emotionEffect(emotionBefore)
  const variance = ((hashString(`${scenario.id}:${question.id}:${turnIndex}`) % 7) - 3)

  const openDelta = Math.round((question.impact.open * diffScale) + fit + (mood.open * 0.35) + variance)
  const resourcesDelta = Math.round((question.impact.resources * diffScale) + (fit * 0.7) + (mood.resources * 0.4) - Math.max(0, mood.distress * 0.1))
  const distressDelta = Math.round(question.impact.distress + (mood.distress * 0.45) - (fit * 0.35) - (mood.open * 0.2) - variance * 0.2)

  const barsAfter = {
    openField: clamp(barsBefore.openField + openDelta),
    resources: clamp(barsBefore.resources + resourcesDelta),
    distress: clamp(barsBefore.distress + distressDelta),
  }

  const deltas = {
    openField: barsAfter.openField - barsBefore.openField,
    resources: barsAfter.resources - barsBefore.resources,
    distress: barsAfter.distress - barsBefore.distress,
  }

  const questionText = formatRelationsQuestionText(question.textTemplate, scenario)

  return {
    barsAfter,
    deltas,
    emotionAfterSuggested: inferEmotionAfterTurn({ barsAfter, deltas, emotionBefore }),
    relationShift: {
      previous: relationStageFromBars(barsBefore),
      next: relationStageFromBars(barsAfter),
      relationLabelBefore: relationStageFromBars(barsBefore) === 0 ? scenario.initialRelationR0.shortHe : `R${relationStageFromBars(barsBefore)}`,
      relationLabelAfter: `R${relationStageFromBars(barsAfter)}`,
    },
    clientAnswerText: buildClientAnswer({ scenario, familyId, settings, emotionBefore, barsBefore, barsAfter, questionText }),
    coachInsightText: buildCoachInsight({ familyId, barsBefore, barsAfter, scenario }),
  }
}

export function deriveSystemStatus(bars) {
  if (bars.openField < 35) return 'כרגע: המערכת סגורה'
  if (bars.openField < 65) return 'כרגע: המערכת נפתחת'
  return 'כרגע: המערכת פתוחה'
}

export function buildFinalSessionInsight({ scenario, turns, bars }) {
  const last = turns.at(-1)
  const from = scenario.initialRelationR0.shortHe
  const to = last?.relationShift?.relationLabelAfter ?? 'R0'
  const options = Math.max(
    1,
    (bars.openField >= 55 ? 1 : 0) +
      (bars.resources >= 55 ? 1 : 0) +
      (bars.distress <= 45 ? 1 : 0) +
      Math.min(2, scenario.alternativeFields.length),
  )
  const openLabel = bars.openField >= 55 ? 'נפתח' : 'נפתח חלקית'
  return `המערכת עברה מ־${from} ל־${to}; השדה ${openLabel}; הופיעו ${options} אופציות חדשות.`
}

export function getRelationsQuestionFamilyById(familyId) {
  return familyById[familyId] ?? relationsQuestionFamilies[0]
}

export function getRelationsQuestionById(questionId) {
  return questionById[questionId] ?? null
}

export function getEmotionById(emotionId) {
  return emotionById[emotionId] ?? null
}

export function inferRelationsEmotionFromOutcome({ barsAfter, deltas, emotionBefore }) {
  return inferEmotionAfterTurn({ barsAfter, deltas, emotionBefore })
}

export function loadRelationsQuestionArchive() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RELATIONS_ARCHIVE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRelationsQuestionArchive(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RELATIONS_ARCHIVE_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}
