export const liberatingContexts = [
  { id: 'self-coaching', labelHe: "קואצ'ינג / עבודה עצמית", labelEn: 'Self Coaching' },
  { id: 'therapy', labelHe: 'טיפול / פסיכולוגיה', labelEn: 'Therapy' },
  { id: 'relationships', labelHe: 'יחסים זוגיים / משפחתיים', labelEn: 'Relationships' },
  { id: 'daily', labelHe: 'אתגר יומיומי / החלטות', labelEn: 'Daily Decisions' },
  { id: 'identity', labelHe: 'זהות ושינוי עצמי (TCU)', labelEn: 'Identity & Change' },
  { id: 'career', labelHe: 'עבודה / קריירה', labelEn: 'Work & Career' },
]

export const liberatingClientStatements = [
  {
    id: 1,
    context: 'self-coaching',
    statement: 'אני פשוט לא מאמין שאני יכול להשתנות',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response:
          'מה הקשר בין מה שאתה חושב על עצמך לבין מה שאתה מרגיש עכשיו? איך החשיבה שלך מתקשרת לרגש הזה?',
      },
      {
        pattern: 'Changing Relationships: Thinking & Feeling 3.0',
        response:
          'מה הקשר בין מה שאתה חושב לבין מה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא חושב אבל יכול?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response:
          'מה הכל שאתה לא יודע... שאתה לא יודע... שאתה לא מבין שאתה לא יודע... אבל אפשרי כאן?',
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
    context: 'therapy',
    statement: 'אני לא יודע למה אני תמיד הורס לעצמי דברים טובים',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response: 'איך ההרס הזה מתקשר למה שאתה כן רוצה? מה הקשר בין ההרס לבין הרצון?',
      },
      {
        pattern: 'Changing Relationships: Attention & Feeling 3.0',
        response:
          'מה הקשר של מה שאתה שם לב אליו, למה שאתה מרגיש? מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא שם לב אבל יכול?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response:
          'מה הכל שאתה לא יודע... שאתה לא יודע... שאתה לא מבין שאתה לא יודע... למה זה קורה?',
      },
      {
        pattern: 'Cartesian Logic',
        response: 'מה הקשר של מה שאתה עושה שגורם להרס, לכל מה שלא עושה שגורם להרס?',
      },
    ],
  },
  {
    id: 3,
    context: 'career',
    statement: 'אני מרגיש תקוע בעבודה ולא יודע מה לעשות',
    idealResponses: [
      {
        pattern: 'Attention & Feeling 3.0',
        response:
          'מה הקשר בין מה שאתה שם לב אליו בעבודה לבין מה שאתה מרגיש בגוף? ומה עוד קיים שם שלא קיבל תשומת לב?',
      },
      {
        pattern: 'Generalization Shift',
        response: 'באילו חלקים של העבודה אתה פחות תקוע? מתי זה אפילו 5% יותר פתוח?',
      },
      {
        pattern: 'Cartesian Logic',
        response: 'מה הקשר של מה שאתה לא יודע מה לעשות, לכל מה שאתה כן יודע אפילו חלקית?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך ה"תקוע" מתקשר למה שאתה רוצה לזוז אליו?',
      },
    ],
  },
  {
    id: 4,
    context: 'relationships',
    statement: 'המחשבות האלה לא נותנות לי מנוחה',
    idealResponses: [
      {
        pattern: 'Animating Relationships',
        response: 'איך המחשבות מתקשרות למה שהגוף שלך מנסה לעשות כרגע? ומה הקשר למנוחה?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה אתה עדיין לא יודע על איך מנוחה יכולה להתחיל אפילו כשיש מחשבות?',
      },
      {
        pattern: 'Generalization Shift',
        response: 'הן לא נותנות מנוחה תמיד, או שיש רגעים קטנים שכן?',
      },
      {
        pattern: 'Cartesian Logic + Quantification',
        response: 'מה הקשר של כל מה שהמחשבות עושות, לכל מה שהן לא עושות עכשיו?',
      },
    ],
  },
  {
    id: 5,
    context: 'daily',
    statement: 'אם אני לא אעשה את זה מושלם אין טעם בכלל להתחיל',
    idealResponses: [
      {
        pattern: 'Cartesian Logic + Quantification',
        response: 'מה הקשר של מושלם, לכל מה שהוא לא מושלם אבל כן מקדם?',
      },
      {
        pattern: 'Generalization Shift',
        response: 'אין טעם בכלל, או שיש טעם חלקי אם זה רק צעד ראשון?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך ה"מושלם" מתקשר להתחלה? ואיך התחלה מתקשרת ללמידה?',
      },
      {
        pattern: 'Thinking & Feeling 3.0',
        response: 'מה הקשר בין המחשבה "צריך מושלם" לבין מה שאתה מרגיש לפני התחלה?',
      },
    ],
  },
  {
    id: 6,
    context: 'identity',
    statement: 'האישיות שלי היא רק הימור ארוך טווח שלא באמת משתנה',
    idealResponses: [
      {
        pattern: 'QBism / de Finetti Reframe',
        response:
          'אם זה הימור, מה ההסתברות שאתה נותן לשינוי קטן ולא לשינוי מוחלט? ומה מעדכן את ההימור הזה?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה אתה לא יודע עדיין על איך זהות מתעדכנת דרך בחירות קטנות חוזרות?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך "אישיות" מתקשרת להרגלים, ואיך הרגלים מתקשרים להקשר ולזמן?',
      },
      {
        pattern: 'Generalization Shift',
        response: 'לא באמת משתנה אף פעם, או משתנה בקצב שלא קיבל עדיין שם?',
      },
    ],
  },
  {
    id: 7,
    context: 'therapy',
    statement: 'אני תמיד חוזר לאותה נקודה, אז כנראה אין לי סיכוי',
    idealResponses: [
      {
        pattern: 'Universal Quantifier Shift',
        response: 'תמיד חוזר לאותה נקודה, או שיש גם חזרות שונות שקצת נראות אותו דבר?',
      },
      {
        pattern: 'Cartesian Logic',
        response: 'מה הקשר של מה שאתה קורא לו "אין סיכוי", לכל מה שעוד לא נבדק?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך ה"חוזר לאותה נקודה" מתקשר לניסיון שלך כן להשתנות?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה עוד אתה לא יודע על התנאים שבהם זה כן נראה אחרת?',
      },
    ],
  },
  {
    id: 8,
    context: 'relationships',
    statement: 'הם אף פעם לא באמת מקשיבים לי',
    idealResponses: [
      {
        pattern: 'Universal Quantifier Shift',
        response: 'אף פעם? היה רגע אחד של הקשבה חלקית שכן חשוב לזכור?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך הדרך שבה אתה מדבר מתקשרת ליכולת שלהם להקשיב, ולהפך?',
      },
      {
        pattern: 'Attention & Feeling 3.0',
        response: 'מה אתה שם לב אליו כשאתה אומר "לא מקשיבים", ומה הגוף שלך מרגיש ברגע הזה?',
      },
      {
        pattern: 'Cartesian Logic',
        response: 'מה הקשר של כל מה שהם לא עושים, לכל מה שהם כן עושים שכן נחשב הקשבה?',
      },
    ],
  },
  {
    id: 9,
    context: 'career',
    statement: 'אם אני אבקש עזרה יחשבו שאני חלש',
    idealResponses: [
      {
        pattern: 'Cause-Effect / Cartesian',
        response: 'איך בדיוק בקשת עזרה גורמת לחולשה, ובאיזה הקשרים זה דווקא מעיד על אחריות?',
      },
      {
        pattern: 'Thinking & Feeling 3.0',
        response: 'מה הקשר בין המחשבה הזאת לבין התחושה בגוף רגע לפני שאתה מבקש?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה אתה לא יודע עדיין על איך אחרים מפרשים בקשת עזרה?',
      },
      {
        pattern: 'Generalization Shift',
        response: 'מי "יחשבו"? כולם, או חלק מסוים שאתה מניח עליו משהו?',
      },
    ],
  },
  {
    id: 10,
    context: 'daily',
    statement: 'אני חייב להבין הכל לפני שאני מתחיל',
    idealResponses: [
      {
        pattern: 'Modal Operator Shift',
        response: 'חייב להבין הכל, או מספיק להבין מספיק כדי להתחיל צעד ראשון?',
      },
      {
        pattern: 'Cartesian Logic + Quantification',
        response: 'מה הקשר של "הכל" לכל מה שלא צריך להבין עדיין כדי להתחיל?',
      },
      {
        pattern: 'Animating Relationships',
        response: 'איך ההבנה מתקשרת להתחלה, ואיך התחלה מתקשרת להבנה נוספת?',
      },
      {
        pattern: 'Trance-ending Knowing to Not Knowing',
        response: 'מה אתה לא יודע עדיין שתוכל לדעת רק אחרי שתתחיל?',
      },
    ],
  },
]

export const liberatingPatterns = [
  {
    id: 'animating',
    name: 'Animating Relationships',
    titleHe: 'הנפשת יחסים',
    page: '53',
    description: 'De-nominalizing + how is X relating to Y',
    descriptionHe: 'ממירים "דבר קפוא" ליחסים חיים: איך X מתקשר ל-Y?',
    questions: [
      'מה הקשר בין X ל-Y?',
      'איך X מתקשר ל-Y?',
      'איך Y מתקשר ל-X?',
      'איך ה"מתקשר" מתקשר ל-X ול-Y?',
    ],
    fillBlankPrompt: 'איך X מתקשר ל-____?',
    fillBlankAnswer: 'Y',
    feedbackHe: 'הפאטרן הזה מזיז את התודעה מ"עצמים" ליחסים חיים ומשתנים.',
    flowNodes: ['X', 'קשר', 'Y', 'Meta-Relationship'],
  },
  {
    id: 'attention-feeling',
    name: 'Changing Relationships: Attention & Feeling 3.0',
    titleHe: 'קשב ותחושה 3.0',
    page: '57',
    description: 'Cartesian + Quantification + Void',
    descriptionHe: 'פותח את השדה דרך קשב/תחושה, כימות, ומה שלא קיבל תשומת לב.',
    questions: [
      'מה הקשר של מה שאתה שם לב אליו, למה שאתה מרגיש?',
      'מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא שם לב אבל יכול?',
      'מה הקשר של רק מה שהיית שם לב אליו, לכל מה שאתה לא מרגיש אבל יכול?',
      'מה הקשר של כלום שאתה לא שם לב אליו, לכל השאר שאתה לא מרגיש אבל יכול עכשיו?',
    ],
    fillBlankPrompt: 'מה הקשר של מה שאתה שם לב אליו, למה שאתה ____?',
    fillBlankAnswer: 'מרגיש',
    feedbackHe: 'כאן אנחנו עובדים על שדה הקשב: מה בפוקוס ומה מחוץ לפוקוס.',
    flowNodes: ['Attention', 'Feeling', 'Noticing', 'Void/Open Field'],
  },
  {
    id: 'thinking-feeling',
    name: 'Changing Relationships: Thinking & Feeling 3.0',
    titleHe: 'חשיבה ותחושה 3.0',
    page: '58',
    description: 'Cartesian + Quantification + Thought/Feeling split',
    descriptionHe: 'מפריד ומחבר מחדש בין מחשבה לתחושה כדי לייצר מרחב בחירה.',
    questions: [
      'מה הקשר בין מה שאתה חושב לבין מה שאתה מרגיש?',
      'מה הקשר של רק מה שהיית מרגיש, לכל מה שאתה לא חושב אבל יכול?',
      'מה הקשר של רק מה שהיית חושב, לכל מה שאתה לא מרגיש אבל יכול?',
      'מה הקשר של כלום שאתה לא חושב, לכל מה שאתה לא מרגיש אבל אפשרי עכשיו?',
    ],
    fillBlankPrompt: 'מה הקשר בין מה שאתה חושב לבין מה שאתה ____?',
    fillBlankAnswer: 'מרגיש',
    feedbackHe: 'הפאטרן מתאים במיוחד כשיש מיזוג קשיח בין סיפור פנימי לתחושה.',
    flowNodes: ['Thinking', 'Feeling', 'Cross Mapping', 'Expanded Options'],
  },
  {
    id: 'generalization',
    name: 'Changing Relationships Pattern & Generalization',
    titleHe: 'פאטרן הכללה ויחסים',
    page: '59',
    description: 'Generalization + exceptions + relationship shift',
    descriptionHe: 'מאתגר הכללות ומחפש חריגים כדי לפתוח רצף חדש.',
    questions: [
      'זה תמיד כך, או שיש יוצאי דופן?',
      'מתי זה קורה פחות?',
      'מה שונה כשזה קורה פחות?',
      'איך ההבדל הזה מתקשר למה שאתה יכול לעשות עכשיו?',
    ],
    fillBlankPrompt: 'זה תמיד כך, או שיש ____?',
    fillBlankAnswer: 'יוצאי דופן',
    feedbackHe: 'הכללה נשברת דרך חריגים, קנה מידה, ותנאים.',
    flowNodes: ['Generalization', 'Exception', 'Difference', 'Action Option'],
  },
  {
    id: 'trance-ending',
    name: 'Trance-ending Knowing to Not Knowing',
    titleHe: 'מסיים טראנס: מידיעה לאי-ידיעה',
    page: '61',
    description: 'Shift from rigid knowing to generative not-knowing',
    descriptionHe: 'מעביר מ"אני יודע שזה ככה" לסקרנות שלא יודעת הכל.',
    questions: [
      'מה אתה לא יודע עדיין על זה?',
      'מה אתה לא יודע שאתה לא יודע על זה?',
      'מה יכול להתאפשר דווקא מתוך אי-הידיעה הזאת?',
      'מה נהיה אפשרי כשלא חייבים לדעת הכל עכשיו?',
    ],
    fillBlankPrompt: 'מה אתה לא יודע שאתה לא ____ על זה?',
    fillBlankAnswer: 'יודע',
    feedbackHe: 'אי-ידיעה כאן אינה בלבול, אלא פתיחת שדה לאפשרויות חדשות.',
    flowNodes: ['Rigid Knowing', 'Not Knowing', 'Possibility', 'Choice'],
  },
  {
    id: 'cartesian',
    name: 'Cartesian Logic & Quantification',
    titleHe: 'לוגיקה קרטזית וכימות',
    page: '56',
    description: 'X / not-X / all / none / some to open field',
    descriptionHe: 'משחק עם כימות ולוגיקה קרטזית כדי לחשוף מה נשמט מהשדה.',
    questions: [
      'מה הקשר של X, לכל מה שלא X?',
      'מה הקשר של כל X, לחלק מהלא-X?',
      'מה הקשר של שום X, לכל שאר מה שאפשרי?',
      'מה משתנה כשעוברים מ"תמיד" ל"לפעמים"?',
    ],
    fillBlankPrompt: 'מה משתנה כשעוברים מ"תמיד" ל"____"?',
    fillBlankAnswer: 'לפעמים',
    feedbackHe: 'כימות מדויק משנה חוויה נוירולוגית, לא רק ניסוח.',
    flowNodes: ['X', 'Not X', 'All/None/Some', 'Open Field'],
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
