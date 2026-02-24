// Hebrew starter seed bank (raw product-content source for future expansion/import)
// This file intentionally uses a simpler schema (`text`) than the current engine (`textVariants`)
// because it is meant as a content warehouse that can be transformed later.

export const labsConfig = [
  {
    id: 'phrasing',
    title: 'מעבדת ניסוח',
    description: 'הפיכת דיבור רגיל לניסוח מקצועי, מדויק ואסרטיבי.',
    slots: ['פתיח', 'תצפית', 'רגש/מצב', 'הקשר', 'בקשה/צעד'],
    banks: ['openers', 'observations', 'states', 'contexts', 'requests'],
    defaults: { warmth: 45 },
  },
  {
    id: 'empathy',
    title: 'גשר האמפתיה',
    description: 'I-Statements: חיבור בלי האשמה.',
    slots: ['פתיח-אני', 'רגש', 'כש/כאשר', 'צורך/ערך', 'בקשה רכה'],
    banks: ['i_openers', 'feelings', 'when_clauses', 'needs_values', 'soft_requests'],
    defaults: { warmth: 70 },
  },
  {
    id: 'boundaries',
    title: 'אדריכל הגבולות',
    description: "מחולל 'לא' מנומס ונחרץ + תנאים + השלכות.",
    slots: ['כבוד/הכרה', 'לא', 'סיבה קצרה', 'כן-למה-כן', 'תנאי/מסגרת'],
    banks: ['respect', 'no_forms', 'short_reasons', 'yes_to', 'conditions'],
    defaults: { warmth: 55 },
  },
  {
    id: 'questions',
    title: 'שואל השאלות',
    description: 'Clean + Meta Model + Breen: שאלות נקיות שמייצרות תנועה.',
    slots: ['פתיח', 'שאלה'],
    banks: ['q_openers', 'clean_q', 'meta_model_q'],
    defaults: { warmth: 40 },
  },
  {
    id: 'beyond',
    title: 'מעבר למילים',
    description: 'חדר כושר: משפט → אמירה → תחושת גוף → משמעות → גרסה משופרת.',
    slots: ['משפט'],
    banks: ['beyond_sentences', 'quantifiers', 'sensory_predicates', 'reframes'],
    defaults: { warmth: 60 },
  },
]

export const chipBanks = {
  openers: [
    { id: 'op1', text: { cold: 'לצורך העניין,', neutral: 'שנייה,', warm: 'רגע איתך רגע,' }, intensity: 30, uncertainty: 35, embodiment: 10, tags: ['tone:opener'] },
    { id: 'op2', text: { cold: 'חשוב לי לדייק:', neutral: 'אני רוצה לדייק:', warm: 'בא לי לדייק בעדינות:' }, intensity: 55, uncertainty: 30, embodiment: 15, tags: ['tone:precision'] },
    { id: 'op3', text: { cold: 'בהקשר לזה,', neutral: 'בנוגע לזה,', warm: 'על זה בדיוק,' }, intensity: 35, uncertainty: 40, embodiment: 10, tags: ['tone:link'] },
  ],
  observations: [
    { id: 'ob1', text: { cold: 'שמתי לב ש', neutral: 'אני שם לב ש', warm: 'אני קולט ש' }, intensity: 45, uncertainty: 45, embodiment: 20, tags: ['meta:clean', 'inside-map'] },
    { id: 'ob2', text: { cold: 'נראה ש', neutral: 'יכול להיות ש', warm: 'יש מצב ש' }, intensity: 35, uncertainty: 70, embodiment: 10, tags: ['meta:uncertainty', 'field:open'] },
  ],
  states: [
    { id: 'st1', text: { cold: 'יש לי אי־נוחות', neutral: 'אני מרגיש אי־נוחות', warm: 'אני מרגיש קצת לא נוח' }, intensity: 50, uncertainty: 40, embodiment: 40, tags: ['somatic'] },
    { id: 'st2', text: { cold: 'אני מוטרד', neutral: 'אני מרגיש מוטרד', warm: 'זה יושב לי כזה בלב' }, intensity: 55, uncertainty: 35, embodiment: 60, tags: ['somatic'] },
  ],
  contexts: [
    { id: 'cx1', text: { cold: 'כשזה קורה', neutral: 'כשזה קורה בפועל', warm: 'בדיוק ברגע שזה קורה' }, intensity: 35, uncertainty: 45, embodiment: 25, tags: ['time:now'] },
    { id: 'cx2', text: { cold: 'במצב הנוכחי', neutral: 'בשיחה הזאת', warm: 'כאן ועכשיו בינינו' }, intensity: 40, uncertainty: 35, embodiment: 45, tags: ['time:now', 'space:here'] },
  ],
  requests: [
    { id: 'rq1', text: { cold: 'אבקש ש', neutral: 'אני מבקש ש', warm: 'הייתי שמח ש' }, intensity: 55, uncertainty: 35, embodiment: 10, tags: ['act:request'] },
    { id: 'rq2', text: { cold: 'הצעתי היא', neutral: 'אפשר שנ', warm: 'מה דעתך שנ' }, intensity: 45, uncertainty: 60, embodiment: 10, tags: ['field:open'] },
  ],

  i_openers: [
    { id: 'io1', text: { cold: 'אני רוצה לשתף ש', neutral: 'אני משתף ש', warm: 'בא לי לשתף אותך ש' }, intensity: 35, uncertainty: 45, embodiment: 15, tags: ['empathy'] },
  ],
  feelings: [
    { id: 'fe1', text: { cold: 'אני מרגיש תסכול', neutral: 'אני מרגיש תסכול', warm: 'אני מרגיש קצת מתוסכל' }, intensity: 60, uncertainty: 30, embodiment: 55, tags: ['somatic'] },
    { id: 'fe2', text: { cold: 'אני מרגיש לחץ', neutral: 'אני מרגיש לחץ', warm: 'נהיה לי לחץ כזה' }, intensity: 65, uncertainty: 25, embodiment: 65, tags: ['somatic'] },
    { id: 'fe3', text: { cold: 'אני מרגיש עצב', neutral: 'אני מרגיש עצב', warm: 'זה קצת עצוב לי' }, intensity: 55, uncertainty: 35, embodiment: 60, tags: ['somatic'] },
  ],
  when_clauses: [
    { id: 'wh1', text: { cold: 'כש', neutral: 'כש', warm: 'כשאני שם לב ש' }, intensity: 40, uncertainty: 40, embodiment: 20, tags: ['meta:clean'] },
    { id: 'wh2', text: { cold: 'כאשר', neutral: 'כאשר', warm: 'ברגע ש' }, intensity: 35, uncertainty: 45, embodiment: 25, tags: ['time:now'] },
  ],
  needs_values: [
    { id: 'nv1', text: { cold: 'כי חשוב לי כבוד', neutral: 'כי חשוב לי כבוד הדדי', warm: 'כי חשוב לי שנכבד אחד את השנייה' }, intensity: 55, uncertainty: 30, embodiment: 20, tags: ['values:respect'] },
    { id: 'nv2', text: { cold: 'כי אני צריך בהירות', neutral: 'כי אני צריך בהירות', warm: 'כי אני צריך שנבין אחד את השנייה' }, intensity: 55, uncertainty: 35, embodiment: 15, tags: ['values:clarity'] },
    { id: 'nv3', text: { cold: 'כי חשוב לי שיתוף פעולה', neutral: 'כי חשוב לי שיתוף פעולה', warm: 'כי חשוב לי להרגיש שאנחנו צוות' }, intensity: 60, uncertainty: 35, embodiment: 25, tags: ['values:cooperation'] },
  ],
  soft_requests: [
    { id: 'sr1', text: { cold: 'הייתי רוצה ש', neutral: 'הייתי שמח ש', warm: 'יעזור לי ממש אם' }, intensity: 45, uncertainty: 55, embodiment: 15, tags: ['request:soft'] },
    { id: 'sr2', text: { cold: 'אפשר לנסות', neutral: 'אפשר שננסה', warm: 'בוא ננסה רגע' }, intensity: 35, uncertainty: 70, embodiment: 25, tags: ['field:open'] },
  ],

  respect: [
    { id: 'rs1', text: { cold: 'אני מעריך את זה ש', neutral: 'אני מעריך ש', warm: 'אני באמת מעריך אותך על' }, intensity: 35, uncertainty: 40, embodiment: 15, tags: ['rapport'] },
    { id: 'rs2', text: { cold: 'חשוב לי לשמור על יחסים טובים,', neutral: 'חשוב לי לשמור על קשר טוב,', warm: 'חשוב לי שנהיה בטוב,' }, intensity: 40, uncertainty: 35, embodiment: 20, tags: ['values:relationship'] },
  ],
  no_forms: [
    { id: 'no1', text: { cold: 'אני לא זמין ל', neutral: 'אני לא זמין ל', warm: 'זה לא מתאים לי כרגע' }, intensity: 70, uncertainty: 25, embodiment: 20, tags: ['boundary'] },
    { id: 'no2', text: { cold: 'אני לא יכול', neutral: 'אני לא יכול', warm: 'אני בוחר לא' }, intensity: 75, uncertainty: 30, embodiment: 10, tags: ['modal:canNot', 'boundary'] },
  ],
  short_reasons: [
    { id: 're1', text: { cold: 'כי זה חורג מהמסגרת שלי.', neutral: 'כי זה חורג מהמסגרת שלי.', warm: 'כי זה כבר יותר מדי בשבילי.' }, intensity: 55, uncertainty: 35, embodiment: 35, tags: ['reason:short'] },
    { id: 're2', text: { cold: 'כדי לשמור על איכות העבודה.', neutral: 'כדי לשמור על איכות.', warm: 'כדי שאני אוכל להיות במיטבי.' }, intensity: 50, uncertainty: 45, embodiment: 25, tags: ['values:quality'] },
  ],
  yes_to: [
    { id: 'yt1', text: { cold: 'כן אני יכול ל', neutral: 'כן, אני יכול ל', warm: 'אני בשמחה יכול ל' }, intensity: 55, uncertainty: 40, embodiment: 15, tags: ['yes'] },
    { id: 'yt2', text: { cold: 'מה שכן אפשר', neutral: 'מה שכן אפשר זה', warm: 'מה שכן מתאים לי זה' }, intensity: 50, uncertainty: 55, embodiment: 15, tags: ['field:reframe'] },
  ],
  conditions: [
    { id: 'co1', text: { cold: 'בתנאי ש', neutral: 'בתנאי ש', warm: 'אם נסכם ש' }, intensity: 65, uncertainty: 35, embodiment: 10, tags: ['if-then', 'cause-effect'] },
    { id: 'co2', text: { cold: 'החל מ', neutral: 'החל מ', warm: 'מכאן והלאה' }, intensity: 55, uncertainty: 30, embodiment: 10, tags: ['time:future'] },
    { id: 'co3', text: { cold: 'אם זה קורה שוב—אני אפסיק.', neutral: 'אם זה קורה שוב—אני עוצר.', warm: 'אם זה חוזר—אני לוקח הפסקה.' }, intensity: 80, uncertainty: 25, embodiment: 30, tags: ['if-then', 'boundary:consequence'] },
  ],

  q_openers: [
    { id: 'qo1', text: { cold: 'שאלה קצרה:', neutral: 'שאלה:', warm: 'אפשר לשאול משהו?' }, intensity: 30, uncertainty: 55, embodiment: 10, tags: ['q'] },
    { id: 'qo2', text: { cold: 'כדי להבין בדיוק—', neutral: 'כדי לדייק—', warm: 'כדי להיות איתך מדויק—' }, intensity: 45, uncertainty: 45, embodiment: 15, tags: ['precision'] },
  ],
  clean_q: [
    { id: 'cq1', text: { cold: 'מה בדיוק קורה?', neutral: 'מה בדיוק קורה שם?', warm: 'מה בדיוק קורה אצלך עכשיו?' }, intensity: 45, uncertainty: 60, embodiment: 25, tags: ['clean', 'time:now'] },
    { id: 'cq2', text: { cold: 'ומה עוד?', neutral: 'ומה עוד יש שם?', warm: 'ומה עוד אתה שם לב אליו?' }, intensity: 35, uncertainty: 75, embodiment: 20, tags: ['clean', 'field:open'] },
    { id: 'cq3', text: { cold: 'ואיך זה בדיוק?', neutral: 'ואיך זה קורה בדיוק?', warm: 'איך זה קורה ממש בפועל?' }, intensity: 55, uncertainty: 60, embodiment: 25, tags: ['meta:unspecifiedVerb'] },
  ],
  meta_model_q: [
    { id: 'mm1', text: { cold: 'מי בדיוק?', neutral: 'מי ספציפית?', warm: 'על מי בדיוק אתה מדבר?' }, intensity: 60, uncertainty: 35, embodiment: 10, tags: ['meta:lackReferentialIndex'] },
    { id: 'mm2', text: { cold: 'מתי/איפה בדיוק?', neutral: 'מתי זה קורה?', warm: 'באיזה רגעים זה קורה?' }, intensity: 60, uncertainty: 45, embodiment: 15, tags: ['meta:timeSpacePredicates'] },
    { id: 'mm3', text: { cold: 'איך בדיוק X גורם ל-Y?', neutral: 'איך זה גורם לזה?', warm: 'איך זה בדיוק משפיע עליך?' }, intensity: 70, uncertainty: 40, embodiment: 15, tags: ['meta:causeEffect'] },
    { id: 'mm4', text: { cold: 'תמיד? אף פעם?', neutral: 'זה תמיד כך?', warm: 'יש יוצא דופן?' }, intensity: 65, uncertainty: 55, embodiment: 10, tags: ['meta:universalQuantifier'] },
    { id: 'mm5', text: { cold: 'מה מונע ממך?', neutral: 'מה עוצר אותך?', warm: 'מה צריך לקרות כדי שזה יתאפשר?' }, intensity: 70, uncertainty: 55, embodiment: 10, tags: ['meta:modalOperator'] },
  ],

  beyond_sentences: [
    { id: 'bs1', text: { cold: 'ברור שצריך לפתור את זה.', neutral: 'אני רוצה לפתור את זה.', warm: 'אני רוצה למצוא לזה דרך שתהיה טובה לי.' }, intensity: 55, uncertainty: 45, embodiment: 20, tags: ['beyond:baseline'] },
    { id: 'bs2', text: { cold: 'אני לא יכול להתמודד עם זה.', neutral: 'קשה לי להתמודד עם זה.', warm: 'יש בי חלק שמתקשה עכשיו.' }, intensity: 70, uncertainty: 40, embodiment: 40, tags: ['modal:canNot', 'somatic'] },
  ],
  quantifiers: [
    { id: 'q1', text: { cold: 'תמיד', neutral: 'לעיתים קרובות', warm: 'לפעמים' }, intensity: 50, uncertainty: 70, embodiment: 10, tags: ['quantifier', 'field:open'] },
    { id: 'q2', text: { cold: 'רק', neutral: 'בעיקר', warm: 'רק מספיק כדי' }, intensity: 45, uncertainty: 55, embodiment: 10, tags: ['quantifier', 'field:close'] },
    { id: 'q3', text: { cold: 'בכל מצב', neutral: 'בחלק מהמקרים', warm: 'באיזו מידה' }, intensity: 55, uncertainty: 60, embodiment: 10, tags: ['quantifier'] },
  ],
  sensory_predicates: [
    { id: 'sp1', text: { cold: 'שים לב', neutral: 'תשים לב', warm: 'רגע שים לב' }, intensity: 40, uncertainty: 50, embodiment: 35, tags: ['sensory', 'attention'] },
    { id: 'sp2', text: { cold: 'מה אתה מרגיש עכשיו בגוף?', neutral: 'איפה זה יושב בגוף?', warm: 'איפה אתה מרגיש את זה עכשיו?' }, intensity: 65, uncertainty: 60, embodiment: 80, tags: ['somatic', 'attention:now'] },
  ],
  reframes: [
    { id: 'rf1', text: { cold: 'אולי זה אומר…', neutral: 'אפשר שזה אומר…', warm: 'אם נסתכל על זה אחרת—זה יכול להיות…' }, intensity: 45, uncertainty: 80, embodiment: 15, tags: ['reframe:meaning', 'field:open'] },
    { id: 'rf2', text: { cold: 'באיזה הקשר זה דווקא מועיל?', neutral: 'מתי זה כן עוזר?', warm: 'איפה זה דווקא משרת אותך?' }, intensity: 55, uncertainty: 70, embodiment: 20, tags: ['reframe:context'] },
  ],
}

export const lessonPlansByLabId = {
  phrasing: {
    titleHe: 'שיעור מקדים: ניסוח מקצועי ואפקטיבי',
    summaryHe: 'לפני שבונים משפטים, כדאי להבין מה כל רכיב עושה: פתיח, תצפית, הקשר ובקשה.',
    videoUrl: '',
    objectivesHe: [
      'להבין איך טון (קר/ניטרלי/חם) משנה קליטה בלי לשנות כוונה.',
      'לזהות מתי ניסוח סוגר שדה ומתי הוא פותח אפשרויות.',
      'לבנות בקשה קונקרטית במקום ניסוח כללי.',
    ],
    lessonSectionsHe: [
      {
        title: 'מה נבדוק במעבדה',
        bullets: [
          'פתיח שמגדיר טון ולא יוצר מגננה.',
          'תצפית נקייה יחסית מפרשנות.',
          'בקשה אחת ברורה שאפשר לענות עליה.',
        ],
      },
      {
        title: 'איך לתרגל',
        bullets: [
          'בחר/י גרסה אחת בטון ניטרלי.',
          'הזז/י את סליידר החום ובדוק/י מה משתנה בקליטה.',
          'שמור/שמרי 2 גרסאות להשוואה.',
        ],
      },
    ],
  },
  empathy: {
    titleHe: 'שיעור מקדים: I-Statements בלי האשמה',
    summaryHe: 'הדגש הוא לתקשר חוויה, צורך ובקשה בלי להלביש כוונה על הצד השני.',
    videoUrl: '',
    objectivesHe: [
      'להבדיל בין רגש לבין פרשנות.',
      'לנסח צורך/ערך בצורה שמזמינה שיתוף פעולה.',
      'להפוך בקשה לרכה אך קונקרטית.',
    ],
    lessonSectionsHe: [
      {
        title: 'מבנה בסיסי',
        bullets: [
          'אני מרגיש/ה...',
          'כש... (הקשר/התנהגות)',
          'כי חשוב לי...',
          'האם נוכל...?',
        ],
      },
      {
        title: 'מה להימנע ממנו',
        bullets: [
          '״אתה תמיד...״ / ״את לא מבינה...״',
          'קריאת מחשבות במקום תצפית.',
          'בקשה עמומה שאין לה פעולה ברורה.',
        ],
      },
    ],
  },
  boundaries: {
    titleHe: 'שיעור מקדים: גבול מקצועי ששומר גם על הקשר',
    summaryHe: "המטרה היא להגיד 'לא' ברור, בלי להתנצל יתר על המידה ובלי להישמע תוקפני.",
    videoUrl: '',
    objectivesHe: [
      'לבנות גבול ברור + נימוק קצר.',
      'להציע חלופה/מסגרת כשמתאים.',
      'להשתמש בתנאי או השלכה בלי איום מיותר.',
    ],
    lessonSectionsHe: [
      {
        title: '3 תבניות שימושיות',
        bullets: [
          'לא + סיבה קצרה + כן למה כן + תנאי',
          'כש-X קורה → אני עושה Y',
          'אני זמין ל... / לא זמין ל...',
        ],
      },
      {
        title: 'בדיקת איכות',
        bullets: [
          'האם ה״לא״ נשאר ברור גם בטון חם?',
          'האם החלופה שומרת על הגבול?',
          'האם התנאי ניתן למדידה/הבנה?',
        ],
      },
    ],
  },
  questions: {
    titleHe: 'שיעור מקדים: שאלות נקיות ומטה-מודל',
    summaryHe: 'לפני השאלות עצמן, חשוב להבין האם אתה מרחיב קשב או מתקף הנחות לא בדוקות.',
    videoUrl: '',
    objectivesHe: [
      'להבדיל בין Clean Question לשאלת Meta Model.',
      'לזהות השמטות/הכללות/עיוותים.',
      'להשתמש במיפוי Breen כדי לבחור שאלת המשך חכמה.',
    ],
    lessonSectionsHe: [
      {
        title: 'שתי משפחות שאלות',
        bullets: [
          'Clean: מרחיב קשב בלי להלביש הנחה.',
          'Meta Model: מאתגר דיוק, כימות, סיבה-תוצאה ומודאליות.',
        ],
      },
      {
        title: 'Breen Table (כיוון עבודה)',
        bullets: [
          'בחר/י קטגוריה (Inside/Outside map / Rules Structure).',
          'קבל/י שאלת מפתח.',
          'רד/י לרמת היקף/זמן/מרחב.',
        ],
      },
    ],
  },
  'mind-liberating-language': {
    titleHe: 'שיעור מקדים: Mind Liberating Language',
    summaryHe:
      'עבודה שמתחילה מטקסט המטופל כפי שהוא, ומכוונת לבניית ניסוח מטפל שמזיז תודעה ופותח אופציות.',
    videoUrl: '',
    objectivesHe: [
      'להבדיל בין תוכן הסיפור לבין צורת הסגירה של התודעה.',
      'לזהות כימותים/מודאליות/זהות שסוגרים שדה.',
      'לבנות ניסוח מטפל שמכבד חוויה אך פותח אפשרויות.',
      'למדוד שינוי לפי אופציות חדשות שהמטופל מסכים לשקול.',
    ],
    lessonSectionsHe: [
      {
        title: 'זרימת העבודה',
        bullets: [
          'מה המטופל אומר (טקסט גולמי).',
          'מה זה אומר על סגירת תודעה ועיוורון לאופציות.',
          'ניסוח מטפל לשחרור: כימות + הקשר + שאלה פותחת.',
          'לפני/אחרי: אילו אופציות נעשו אפשריות.',
        ],
      },
      {
        title: 'עיקרון קליני-לשוני',
        bullets: [
          'לא להתווכח ישר עם התוכן.',
          'כן לעבוד על כמות/זמן/הקשר/משמעות.',
          'הצלחה = המטופל מוכן לראות עוד אפשרות אחת לפחות.',
        ],
      },
    ],
    coachPromptsHe: [
      'התחל/י מהטקסט המדויק של המטופל, בלי תיקון.',
      'שאל/י: איפה הניסוח סוגר שדה? (תמיד/אי אפשר/זה אני).',
      'בנה/י ניסוח שמכיר בחוויה ואז פותח 5% מרחב.',
      'בדוק/י בסוף: אילו אופציות הוא מוכן לשקול עכשיו שלא הופיעו קודם.',
    ],
  },
  'clean-questions': null,
  beyond: {
    titleHe: 'שיעור מקדים: מעבר למילים (Noticing + גוף + משמעות)',
    summaryHe: 'כאן לא מחפשים רק ניסוח נכון, אלא לומדים לזהות בזמן אמת מה הניסוח עושה לגוף ולקשב.',
    videoUrl: '',
    objectivesHe: [
      'לבנות משפט, לומר אותו, ולמדוד אפקט גופני.',
      'להבחין בין משפט שסוגר שדה לבין משפט שפותח אפשרות.',
      'לזהות שינוי קטן (5%) כעדות ללמידה.',
    ],
    lessonSectionsHe: [
      {
        title: 'עקרון העבודה',
        bullets: [
          'לא להאמין אוטומטית לתוכן.',
          'כן לשים לב לאפקט בזמן אמת (noticing).',
          'לשנות ניסוח/כימות/מסגור ולבדוק שוב.',
        ],
      },
      {
        title: 'זרימת התרגול',
        bullets: [
          'משפט → אמירה → תחושת גוף → משמעות → שיפט קשב → השוואת A/B.',
          'הטיימר עוזר להחזיק קשב, לא ״להצליח״.',
          'הלוג נשמר כדי לראות מגמות לאורך זמן.',
        ],
      },
    ],
    coachPromptsHe: [
      'קרא/י את המשפט בקול פעם אחת.',
      'עכשיו: איפה זה בגוף? תן/י ציון עוצמה 0–10.',
      "עכשיו לחץ/י 'שיפט קשב': מה לא שמת לב שאתה רואה/שומע/מרגיש — ועכשיו כן?",
      'חזור/י למשפט. אם יש שינוי (אפילו 5%) — זו למידה.',
      "אם אין שינוי: שחק/י עם כימות ('תמיד'→'לפעמים') כדי לפתוח את השדה.",
      "בדוק/י מול ESE: 'איך הייתי אם זה לא היה בעיה?' ותן/י לניסוח להתיישר לזה.",
    ],
  },
  'beyond-words': null,
}

const lessonAliasMap = {
  'clean-questions': 'questions',
  'beyond-words': 'beyond',
  'mind-liberating': 'mind-liberating-language',
}

export function getLessonPlanByLabId(labId) {
  const direct = lessonPlansByLabId[labId]
  if (direct) return direct
  const alias = lessonAliasMap[labId]
  return alias ? lessonPlansByLabId[alias] ?? null : null
}
