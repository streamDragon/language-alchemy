const CONTEXT_LABELS = {
  selfCoaching: "קואצ'ינג / עבודה עצמית",
  therapy: 'טיפול / פסיכולוגיה',
  relationships: 'יחסים זוגיים / משפחתיים',
  daily: 'אתגר יומיומי / החלטות',
  identity: 'זהות ושינוי עצמי (TCU)',
  career: 'עבודה / קריירה',
}

export const liberatingContexts = [
  { id: 'self-coaching', labelHe: CONTEXT_LABELS.selfCoaching, labelEn: 'Self Coaching' },
  { id: 'therapy', labelHe: CONTEXT_LABELS.therapy, labelEn: 'Therapy' },
  { id: 'relationships', labelHe: CONTEXT_LABELS.relationships, labelEn: 'Relationships' },
  { id: 'daily', labelHe: CONTEXT_LABELS.daily, labelEn: 'Daily Decisions' },
  { id: 'identity', labelHe: CONTEXT_LABELS.identity, labelEn: 'Identity & Change' },
  { id: 'career', labelHe: CONTEXT_LABELS.career, labelEn: 'Work & Career' },
]

const CONTEXT_ID_BY_LABEL = Object.fromEntries(
  liberatingContexts.map((context) => [context.labelHe, context.id]),
)

function normalize(value) {
  return String(value ?? '').trim()
}

function hasPatternName(items, patternName) {
  const target = normalize(patternName).toLowerCase()
  return (items ?? []).some((item) => normalize(item?.pattern).toLowerCase() === target)
}

function buildAutoIdealResponses(statementText, contextId) {
  const statement = normalize(statementText)
  const emotionHeavy = /(מרגיש|חרדה|ריקנות|מנוחה|פוחד|פחד)/.test(statement)

  const baseResponses = [
    {
      pattern: 'Animating Relationships',
      response: `מה הקשר בין "${statement}" לבין מה שאתה מרגיש עכשיו? איך הניסוח הזה מתקשר למה שאתה כן רוצה?`,
    },
    {
      pattern: emotionHeavy
        ? 'Changing Relationships: Attention & Feeling 3.0'
        : 'Changing Relationships: Thinking & Feeling 3.0',
      response: emotionHeavy
        ? 'מה הקשר של מה שאתה שם לב אליו, למה שאתה מרגיש? ומה הקשר של מה שעוד לא קיבל תשומת לב, למה שעוד יכול להשתנות?' 
        : 'מה הקשר בין מה שאתה חושב לבין מה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא חושב אבל יכול?',
    },
    {
      pattern: 'Trance-ending Knowing to Not Knowing',
      response:
        'מה הכל שאתה לא יודע... שאתה לא יודע... שאתה לא מבין שאתה לא יודע... אבל אפשרי כאן לגבי זה?',
    },
    {
      pattern: 'Cartesian Logic',
      response: `מה הקשר של מה שאתה אומר עכשיו, לכל מה שלא נכנס עדיין למה שאתה אומר אבל כן יכול להיות רלוונטי?`,
    },
  ]

  if (contextId === 'identity') {
    return [
      {
        pattern: 'QBism + de Finetti',
        response:
          'אם זו תחזית/אמונה על עצמך, מה ההסתברות שאתה נותן לשינוי קטן (ולא מוחלט)? מה יכול לעדכן את ההסתברות הזו?',
      },
      baseResponses[0],
      baseResponses[2],
      {
        pattern: 'Cartesian Logic + Quantification',
        response:
          'מה הקשר של מה שאתה מאמין על עצמך עכשיו, לכל מה שאתה עדיין לא מאמין אבל יכול לבדוק בהדרגה?',
      },
    ]
  }

  return baseResponses
}

function completeIdealResponses(item) {
  const existing = Array.isArray(item.idealResponses) ? [...item.idealResponses] : []
  const fillers = buildAutoIdealResponses(item.statement, item.context)

  for (const candidate of fillers) {
    if (existing.length >= 4) break
    if (hasPatternName(existing, candidate.pattern)) continue
    existing.push(candidate)
  }

  return existing.slice(0, 4)
}

const rawClientStatements = [
  {
    id: 1,
    context: CONTEXT_LABELS.selfCoaching,
    statement: 'אני פשוט לא מאמין שאני יכול להשתנות',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response: "מה הקשר בין מה שאתה חושב על 'עצמי' לבין מה שאתה מרגיש עכשיו? איך המחשבה מתקשרת לרגש?",
      },
      {
        pattern: 'Thinking & Feeling 3.0',
        response:
          'מה הקשר בין מה שאתה חושב לבין מה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא חושב אבל יכול?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response:
          'מה הכל שאתה לא יודע...שאתה לא יודע...שאתה לא מבין שאתה לא יודע...אבל אפשרי לגבי השינוי?',
      },
      {
        pattern: 'Cartesian Logic',
        response:
          'מה הקשר של מה שאתה מאמין שאי אפשר להשתנות, לכל מה שלא מאמין שאי אפשר להשתנות?',
      },
    ],
  },
  {
    id: 2,
    context: CONTEXT_LABELS.therapy,
    statement: 'אני לא יודע למה אני תמיד הורס לעצמי דברים טובים',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response: "איך ההרס הזה מתקשר למה שאתה כן רוצה? מה הקשר בין 'ההרס' ל'רצון'?",
      },
      {
        pattern: 'Attention & Feeling 3.0',
        response:
          'מה הקשר של מה שאתה שם לב אליו, למה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא שם לב אבל יכול?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה הכל שאתה לא יודע...שאתה לא יודע...למה זה קורה?',
      },
      {
        pattern: 'Cartesian Logic',
        response: 'מה הקשר של מה שאתה עושה שגורם להרס, לכל מה שלא עושה שגורם להרס?',
      },
    ],
  },
  {
    id: 3,
    context: CONTEXT_LABELS.relationships,
    statement: 'אני תמיד בוחר בבן/בת זוג לא נכונים',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response:
          "מה הקשר בין 'הבחירה' שלך לבין מה שאתה מרגיש אחרי? איך הבחירה מתקשרת לרגש?",
      },
      {
        pattern: 'Thinking & Feeling 3.0',
        response: 'מה הקשר בין מה שאתה חושב על מערכות יחסים לבין מה שאתה מרגיש?',
      },
    ],
  },
  {
    id: 4,
    context: CONTEXT_LABELS.career,
    statement: 'אני מרגיש תקוע בעבודה ולא יודע מה לעשות',
    idealResponses: [
      {
        pattern: 'Attention & Feeling 3.0',
        response:
          'מה הקשר של מה שאתה שם לב אליו בעבודה, למה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא שם לב אבל יכול?',
      },
    ],
  },
  {
    id: 5,
    context: CONTEXT_LABELS.identity,
    statement: 'האישיות שלי היא פשוט ככה, אין מה לעשות',
    idealResponses: [
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: "מה הכל שאתה לא יודע...שאתה לא יודע...על 'האישיות' שלך...אבל אפשרי?",
      },
    ],
  },
  { id: 6, context: CONTEXT_LABELS.selfCoaching, statement: 'אני מפחד להיכשל אז אני לא מנסה בכלל', idealResponses: [] },
  { id: 7, context: CONTEXT_LABELS.therapy, statement: 'המחשבות השליליות האלה לא נותנות לי מנוחה', idealResponses: [] },
  { id: 8, context: CONTEXT_LABELS.relationships, statement: 'אני לא יודע איך לתקשר עם בן הזוג שלי', idealResponses: [] },
  { id: 9, context: CONTEXT_LABELS.career, statement: 'אין לי מוטיבציה לעשות כלום', idealResponses: [] },
  { id: 10, context: CONTEXT_LABELS.identity, statement: 'אני לא יודע מי אני באמת', idealResponses: [] },
  {
    id: 11,
    context: CONTEXT_LABELS.selfCoaching,
    statement: 'אני רוצה להפסיק להשוות את עצמי לאחרים אבל לא מצליח',
    idealResponses: [],
  },
  { id: 12, context: CONTEXT_LABELS.therapy, statement: 'החרדה הזאת שולטת בחיים שלי', idealResponses: [] },
  { id: 13, context: CONTEXT_LABELS.relationships, statement: 'אני מרגיש לא ראוי לאהבה', idealResponses: [] },
  { id: 14, context: CONTEXT_LABELS.career, statement: 'אני תמיד דוחה דברים עד הרגע האחרון', idealResponses: [] },
  { id: 15, context: CONTEXT_LABELS.identity, statement: 'העבר שלי מגביל אותי', idealResponses: [] },
  { id: 16, context: CONTEXT_LABELS.selfCoaching, statement: 'אני לא בטוח בהחלטות שלי', idealResponses: [] },
  { id: 17, context: CONTEXT_LABELS.therapy, statement: 'אני מרגיש ריקנות ולא יודע למה', idealResponses: [] },
  { id: 18, context: CONTEXT_LABELS.relationships, statement: 'אני פוחד להתקרב לאנשים', idealResponses: [] },
  { id: 19, context: CONTEXT_LABELS.career, statement: 'אני לא רואה עתיד טוב לעצמי', idealResponses: [] },
  {
    id: 20,
    context: CONTEXT_LABELS.identity,
    statement: 'האמונות שלי על עצמי הן כמו הימור שאני מפסיד בו',
    idealResponses: [
      {
        pattern: 'QBism + de Finetti',
        response:
          'אם האמונה היא הימור, מה ההסתברות שאתה נותן לתוצאה אחרת? איזה מידע/חוויה היה מעדכן את ההימור הזה אפילו ב-5%?',
      },
    ],
  },
  { id: 21, context: CONTEXT_LABELS.selfCoaching, statement: 'אני רוצה לשנות אבל משהו שומר אותי במקום', idealResponses: [] },
  { id: 22, context: CONTEXT_LABELS.therapy, statement: 'אני לא שם לב לשינויים הקטנים סביבי', idealResponses: [] },
  { id: 23, context: CONTEXT_LABELS.relationships, statement: 'אני תמיד נותן יותר מדי ולא מקבל בחזרה', idealResponses: [] },
  { id: 24, context: CONTEXT_LABELS.career, statement: 'אני מרגיש שהזמן עובר ואני לא מתקדם', idealResponses: [] },
  { id: 25, context: CONTEXT_LABELS.identity, statement: 'אני לא יודע מה הסיכויים האמיתיים שלי להצליח', idealResponses: [] },
]

export const liberatingClientStatements = rawClientStatements.map((item) => {
  const contextId = CONTEXT_ID_BY_LABEL[item.context] ?? 'daily'
  return {
    ...item,
    context: contextId,
    idealResponses: completeIdealResponses({ ...item, context: contextId }),
  }
})

export const liberatingPatterns = [
  {
    id: 'animating',
    name: 'Animating Relationships',
    titleHe: 'הנפשת יחסים',
    page: '53',
    emoji: '🔄',
    description: 'De-nominalizing + how is X relating to Y',
    descriptionHe: 'ממירים שם־עצם קפוא ליחסים חיים: איך X מתקשר ל-Y?',
    questions: [
      'מה הקשר בין X ל-Y?',
      'איך X מתקשר ל-Y?',
      'איך Y מתקשר ל-X?',
      "איך ה'מתקשר' מתקשר ל-X ול-Y?",
    ],
    example: "מה הקשר בין 'האמונה' שלך לבין 'השינוי'?",
    fillBlankPrompt: 'איך X מתקשר ל-____?',
    fillBlankAnswer: 'Y',
    feedbackHe: 'פאטרן שמזיז את התודעה ממצב סטטי ליחסים דינמיים.',
    flowNodes: ['X', 'קשר', 'Y', 'Meta-Relationship'],
  },
  {
    id: 'attention-feeling',
    name: 'Changing Relationships: Attention & Feeling 3.0',
    titleHe: 'קשב ותחושה 3.0',
    page: '57',
    emoji: '👁️❤️',
    description: 'Cartesian + Quantification + Void',
    descriptionHe: 'פותח שדה דרך קשב/תחושה, כימות, ומה שלא היה בפוקוס.',
    questions: [
      'מה הקשר של מה שאתה שם לב אליו, למה שאתה מרגיש?',
      'מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא שם לב אבל יכול?',
      'מה הקשר של רק מה שהיית שם לב אליו, לכל מה שאתה לא מרגיש אבל יכול?',
      'מה הקשר של כלום שאתה לא שם לב אליו, לכל השאר שאתה לא מרגיש אבל יכול עכשיו?',
    ],
    fillBlankPrompt: 'מה הקשר של מה שאתה שם לב אליו, למה שאתה ____?',
    fillBlankAnswer: 'מרגיש',
    feedbackHe: 'כאן אנחנו מרחיבים את המפה דרך מה שבפוקוס ומה שעדיין לא בפוקוס.',
    flowNodes: ['Attention', 'Feeling', 'Noticing', 'Void/Open Field'],
  },
  {
    id: 'thinking-feeling',
    name: 'Changing Relationships: Thinking & Feeling 3.0',
    titleHe: 'חשיבה ותחושה 3.0',
    page: '58',
    emoji: '🧠❤️',
    description: 'Cartesian + Quantification + Void',
    descriptionHe: 'מפריד ומחבר מחדש בין חשיבה לתחושה כדי לפתוח בחירה.',
    questions: [
      'מה הקשר בין מה שאתה חושב לבין מה שאתה מרגיש?',
      'מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא חושב אבל יכול?',
      'מה הקשר של רק מה שהיית חושב, לכל מה שאתה לא מרגיש אבל יכול?',
    ],
    fillBlankPrompt: 'מה הקשר בין מה שאתה חושב לבין מה שאתה ____?',
    fillBlankAnswer: 'מרגיש',
    feedbackHe: 'מעולה למצבים של היתקעות בין סיפור פנימי לתגובת גוף/רגש.',
    flowNodes: ['Thinking', 'Feeling', 'Split', 'New Relationship'],
  },
  {
    id: 'generalization',
    name: 'Changing Relationships Pattern & Generalization',
    titleHe: 'פאטרן הכללה ורצף',
    page: '59',
    emoji: '🌐',
    description: 'Flowchart + Interconnectedness + Alpha Sequence',
    descriptionHe: 'מאתגר הכללות ומייצר רצף דרך חריגים, קישורים והרחבת שדה.',
    questions: [
      "What's this like?",
      'What are all the other positive connections associated with this?',
      'אילו חריגים קיימים כאן?',
      'מה זה מאפשר לראות עכשיו שלא היה זמין קודם?',
    ],
    fillBlankPrompt: 'זה תמיד כך, או שיש ____?',
    fillBlankAnswer: 'יוצאי דופן',
    feedbackHe: 'הפאטרן הזה שובר הכללה דרך חריגים וקשרים חדשים.',
    flowNodes: ['Generalization', 'Exceptions', 'Connections', 'Alpha Sequence'],
  },
  {
    id: 'trance-ending',
    name: 'Trance-ending Knowing to Not Knowing',
    titleHe: 'מידיעה לאי-ידיעה יוצרת',
    page: '61',
    emoji: '🌌',
    description: 'Non-mirror image reverse + Not Knowing + Positive Attributes',
    descriptionHe: 'מוציא מטראנס של ודאות קשיחה אל סקרנות, אפשרות ותנועה.',
    questions: [
      'מה הכל שאתה לא יודע…שאתה לא יודע…שאתה לא מבין שאתה לא יודע…אבל אפשרי?',
      'מה עוד אפשרי כשלא חייבים לדעת הכל עכשיו?',
    ],
    fillBlankPrompt: 'מה הכל שאתה לא יודע... שאתה לא ____...?',
    fillBlankAnswer: 'יודע',
    feedbackHe: 'אי-ידיעה כאן היא מנוע לפתיחת שדה, לא חוסר ערך.',
    flowNodes: ['Knowing', 'Not Knowing', 'Possibility', 'Choice'],
  },
  {
    id: 'cartesian',
    name: 'Cartesian Logic & Quantification',
    titleHe: 'לוגיקה קרטזית וכימות',
    page: '56',
    emoji: '📐',
    description: "Universal Quantifier on 'not' + open the field",
    descriptionHe: 'עובד עם X / not-X וכימות (תמיד/לפעמים) כדי לפתוח אפשרויות.',
    questions: [
      'מה הקשר של A, לכל מה שלא A?',
      'מה הקשר של לא A, לכל מה שלא לא A?',
      'מה משתנה כשעוברים מ"תמיד" ל"לפעמים"?',
    ],
    fillBlankPrompt: 'מה משתנה כשעוברים מ"תמיד" ל"____"?',
    fillBlankAnswer: 'לפעמים',
    feedbackHe: 'כימות מדויק משנה חוויה נוירולוגית, לא רק ניסוח.',
    flowNodes: ['A', 'Not A', 'Quantifiers', 'Open Field'],
  },
]

export function randomItem(items) {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

export function statementsForContext(contextId) {
  return liberatingClientStatements.filter((item) => item.context === contextId)
}

export function shuffleList(items) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}
