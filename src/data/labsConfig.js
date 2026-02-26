const c = (id, cold, neutral, warm, tags = []) => ({
  id,
  textVariants: { cold, neutral, warm },
  tags,
  intensity: 50,
  uncertainty: 50,
  embodiment: 40,
})

const alchemy = (cfg) => ({
  kind: 'alchemy',
  supportsWarmth: true,
  defaultWarmth: 55,
  ...cfg,
})

export const visibleLabs = [
  alchemy({
    id: 'phrasing',
    route: '/lab/phrasing',
    titleHe: 'מעבדת ניסוח',
    titleEn: 'Phrasing Lab',
    descriptionHe: 'ניסוחים מקצועיים, מדויקים ומקדמי שיתוף פעולה.',
    preview: { emptyTextHe: 'בחרו רכיבים כדי לבנות ניסוח מקצועי.', punctuation: 'auto' },
    templates: [
      {
        id: 'professional',
        labelHe: 'ניסוח מקצועי',
        slotOrder: ['opener', 'quantifier', 'context', 'request', 'closing'],
        requiredSlotIds: ['opener', 'context', 'request'],
        formatterId: 'phrasing-professional',
      },
    ],
    chipBanks: [
      {
        id: 'opener',
        labelHe: 'פתיחים',
        slotId: 'opener',
        chips: [
          c('o1', 'אני דורש ש...', 'אני מבקש ש...', 'אני אשמח אם נוכל...', ['tone:direct']),
          c(
            'o2',
            'זה חייב לקרות.',
            'חשוב שזה יבוצע.',
            'אני רואה ערך רב בקידום של זה.',
            ['value:progress'],
          ),
          c(
            'o3',
            'הטעות היא...',
            'יש פה אי-דיוק.',
            'אני מזהה כאן הזדמנות לדיוק נוסף.',
            ['metaModel:precision'],
          ),
        ],
      },
      {
        id: 'quantifier',
        labelHe: 'כמתים ומעבירים',
        slotId: 'quantifier',
        optional: true,
        chips: [
          c('q1', 'תמיד', 'לרוב', 'יותר ויותר לעיתים קרובות', ['overdurf:quantifier']),
          c('q2', 'רק', 'בעיקר', 'לפחות כרגע', ['overdurf:shifter']),
          c('q3', 'אי אפשר', 'קשה כרגע', 'עדיין לא מצאנו את הדרך ל...', ['possibility']),
        ],
      },
      {
        id: 'context',
        labelHe: 'הקשר',
        slotId: 'context',
        chips: [
          c('cx1', 'כשמשנים החלטה בלי לעדכן', 'כשיש שינוי החלטה בלי עדכון', 'כשיש שינוי החלטה לפני שיישרנו קו', ['context:change']),
          c('cx2', 'כשקובעים עבורי בלי לשאול', 'כשנקבעת משימה בלי תיאום', 'כשמשימה נקבעת לפני שתיאמנו זמינות', ['context:agency']),
          c('cx3', 'כשמבקשים תשובה מיידית', 'כשיש ציפייה לתשובה מהירה', 'כשעולה צורך בתשובה מהירה בלי זמן עיבוד', ['context:pressure']),
        ],
      },
      {
        id: 'request',
        labelHe: 'בקשה',
        slotId: 'request',
        chips: [
          c('r1', 'תעדכנו אותי לפני שינוי.', 'אבקש לעדכן אותי לפני שינוי.', 'אשמח אם נוכל לעדכן אותי לפני שינוי, כדי שאוכל להיערך.', ['request:update']),
          c('r2', 'נקבע זמן.', 'בואו נקבע זמן קצר לתיאום.', 'האם נוכל לתאם זמן קצר כדי ליישר קו?', ['request:time']),
          c('r3', 'צעד אחד בכל פעם.', 'בואו נסכם צעד אחד בכל פעם.', 'אשמח שנתקדם צעד אחד בכל פעם כדי לשמור על בהירות.', ['request:stepwise']),
        ],
      },
      {
        id: 'closing',
        labelHe: 'סיום',
        slotId: 'closing',
        optional: true,
        chips: [
          c('cl1', 'ככה נעבוד טוב.', 'כך נוכל לעבוד טוב יותר.', 'כך נוכל לשמור על קצב עבודה טוב ושיתוף פעולה.', ['value:collaboration']),
          c('cl2', 'כדי שאגיב טוב.', 'כדי שאוכל להגיב בצורה טובה יותר.', 'כדי שאוכל להישאר נוכח/ת ולהגיב בצורה מאוזנת יותר.', ['embodiment:regulated']),
        ],
      },
    ],
  }),
  alchemy({
    id: 'empathy',
    route: '/lab/empathy',
    titleHe: 'גשר האמפתיה',
    titleEn: 'Empathy Bridge',
    descriptionHe: "משפטי 'אני' שמתקשרים צורך אישי בלי לעורר מגננה.",
    preview: { emptyTextHe: "בחרו רכיבים כדי לבנות משפט 'אני'.", punctuation: 'auto' },
    templates: [
      {
        id: 'i-statement',
        labelHe: "משפט 'אני'",
        slotOrder: ['softener', 'feeling', 'context', 'need', 'request'],
        requiredSlotIds: ['feeling', 'context', 'need', 'request'],
        formatterId: 'empathy-i-statement',
      },
    ],
    chipBanks: [
      {
        id: 'softener',
        labelHe: 'ריכוך',
        slotId: 'softener',
        optional: true,
        chips: [
          c('s1', 'בעדינות,', 'ברוח טובה,', 'מתוך כוונה טובה ובשיתוף,', ['tone:softener']),
          c('s2', 'ישיר,', 'אני משתף/ת בכנות,', 'אני רוצה לשתף את זה בצורה פתוחה ומכבדת,', ['tone:openness']),
        ],
      },
      {
        id: 'feeling',
        labelHe: 'רגשות',
        slotId: 'feeling',
        chips: [
          c('f1', 'אני מרגיש/ה מתוסכל/ת', 'אני מרגיש/ה לא בנוח', 'אני מרגיש/ה פער בין הציפיות למציאות', ['emotion:frustration']),
          c('f2', 'אני מרגיש/ה כועס/ת', 'אני מרגיש/ה מוצף/ת', 'אני זקוק/ה לרגע של שקט לעבד את הדברים', ['emotion:overwhelm']),
          c('f3', 'אני מרגיש/ה לחוץ/ה', 'אני מרגיש/ה דרוך/ה', 'אני מרגיש/ה אחריות גדולה על הכתפיים', ['emotion:stress']),
        ],
      },
      {
        id: 'context',
        labelHe: 'הקשר/התנהגות',
        slotId: 'context',
        chips: [
          c('ec1', 'כשקוטעים אותי', 'כשאני נקטע/ת באמצע', 'כשאני משתף/ת רעיון והוא נקטע באמצע', ['behavior:interrupt']),
          c('ec2', 'כשמבקשים שינוי ברגע האחרון', 'כשיש שינויים ברגע האחרון', 'כשעולה שינוי ברגע האחרון בלי תיאום מוקדם', ['behavior:last-minute']),
          c('ec3', 'כשמדברים אליי בטון חד', 'כשיש טון חד בשיחה', 'כשיש טון חד בשיחה ואני מנסה להבין מה נדרש', ['behavior:tone']),
        ],
      },
      {
        id: 'need',
        labelHe: 'צרכים/ערכים',
        slotId: 'need',
        chips: [
          c('n1', 'כי אני צריך/ה סדר', 'כי חשובה לי בהירות', 'כי חשובה לי ידיעה ברורה של הצעדים הבאים', ['value:clarity']),
          c('n2', 'כי אני צריך/ה כבוד', 'כי חשובה לי הערכה', 'כי חשובה לי הכרה במאמץ שהושקע', ['value:respect']),
          c('n3', 'כי אני צריך/ה שקט', 'כי חשוב לי מרחב', 'כי חשוב לי זמן להתמקד במה שחשוב באמת', ['value:space']),
        ],
      },
      {
        id: 'request',
        labelHe: 'בקשה',
        slotId: 'request',
        chips: [
          c('er1', 'תן/י לי זמן.', 'האם נוכל לתאם זמן?', 'האם נוכל לתאם זמן קצר כדי לעבור על זה יחד?', ['request:time']),
          c('er2', 'תסביר/י מה צריך.', 'האם נוכל להגדיר ציפיות מראש?', 'האם נוכל להגדיר ציפיות מראש כדי שיהיה לי קל יותר לעמוד בהן?', ['request:expectations']),
          c('er3', 'נעצור רגע.', 'האם נוכל לעצור לרגע וליישר קו?', 'האם נוכל לעצור לרגע, לנשום, וליישר קו לפני שממשיכים?', ['request:pause']),
        ],
      },
    ],
  }),
  alchemy({
    id: 'boundaries',
    route: '/lab/boundaries',
    titleHe: 'אדריכל הגבולות',
    titleEn: 'Boundary Builder',
    descriptionHe: "איך להגיד 'לא' בצורה מקצועית ולשמור על הקשר.",
    preview: { emptyTextHe: 'בחרו רכיבים כדי לנסח גבול מקצועי.', punctuation: 'auto' },
    templates: [
      {
        id: 'no-why-condition',
        labelHe: 'לא + סיבה + כן למה כן + תנאי',
        slotOrder: ['buffer', 'hardNo', 'yesTo', 'condition'],
        requiredSlotIds: ['buffer', 'hardNo', 'condition'],
        formatterId: 'boundary-no',
      },
      {
        id: 'if-then',
        labelHe: 'כש-X קורה -> אני עושה Y',
        slotOrder: ['trigger', 'ifThenAction', 'ifThenReason'],
        requiredSlotIds: ['trigger', 'ifThenAction'],
        formatterId: 'boundary-if-then',
      },
      {
        id: 'availability',
        labelHe: 'אני זמין/ה ל... / לא זמין/ה ל...',
        slotOrder: ['availableFor', 'notAvailableFor', 'channelBoundary', 'timeBoundary'],
        requiredSlotIds: ['availableFor', 'notAvailableFor'],
        formatterId: 'boundary-availability',
      },
    ],
    chipBanks: [
      { id: 'buffer', labelHe: 'הערכה', slotId: 'buffer', chips: [c('b1', 'קיבלתי.', 'תודה על הפנייה.', 'אני מעריך/ה מאוד את האמון שנתת בי בפנייה הזו.', ['boundary:buffer']), c('b2', 'לא רלוונטי.', 'זה לא מתאים עכשיו.', 'אני רואה כמה הנושא הזה חשוב ויחד עם זאת...', ['boundary:buffer'])] },
      { id: 'hardNo', labelHe: 'הגבול', slotId: 'hardNo', chips: [c('hn1', 'אני לא עושה את זה.', 'אין לי פניות לזה כרגע.', 'כרגע אני בוחר/ת לתת עדיפות לפרויקטים אחרים שכבר התחייבתי אליהם.', ['boundary:no']), c('hn2', 'זה לא יקרה.', 'אני נאלץ/ת לסרב.', 'היכולת שלי לתת לזה את המענה המקצועי הנדרש מוגבלת כרגע.', ['boundary:no'])] },
      { id: 'yesTo', labelHe: 'כן למה כן', slotId: 'yesTo', optional: true, chips: [c('y1', 'אני שומר/ת על איכות.', 'חשוב לי לשמור על איכות העבודה.', 'אני אומר/ת את זה כדי לשמור על איכות העבודה והמחויבויות הקיימות שלי.', ['value:quality']), c('y2', 'אני מתעדפ/ת.', 'אני מתעדפ/ת עומס קיים.', 'אני שומר/ת כרגע פוקוס על סדרי עדיפויות שכבר סוכמו.', ['value:focus'])] },
      { id: 'condition', labelHe: 'חלופה', slotId: 'condition', chips: [c('co1', 'נבדוק חודש הבא.', 'נוכל לבדוק זאת שוב בחודש הבא.', 'נוכל לבדוק זאת שוב בחודש הבא אחרי שאסגור את המחויבויות הנוכחיות.', ['alternative:time']), c('co2', 'תחזרו בעוד שבועיים.', 'אפשר לחזור לזה בעוד שבועיים.', 'אפשר לחזור לזה בעוד שבועיים ולבדוק מחדש זמינות.', ['alternative:time']), c('co3', 'מישהו אחר יעשה.', 'אפשר לבדוק אם מישהו אחר בצוות פנוי.', 'אפשר לבדוק אם מישהו אחר בצוות פנוי כדי לקדם את זה בלי לעכב.', ['alternative:delegate'])] },
      { id: 'trigger', labelHe: 'כש-X קורה', slotId: 'trigger', chips: [c('t1', 'כשפונים אחרי שעות', 'כשיש פנייה אחרי שעות העבודה', 'כשעולה פנייה אחרי שעות העבודה בלי דחיפות ברורה', ['boundary:time']), c('t2', 'כשמשימה מתרחבת בלי תיאום', 'כשיש הרחבת scope בלי תיאום', 'כשיש הרחבת scope לפני שסיכמנו מחדש זמן ומשאבים', ['boundary:scope'])] },
      { id: 'ifThenAction', labelHe: 'אני עושה Y', slotId: 'ifThenAction', chips: [c('ia1', 'אני עונה רק מחר.', 'אני משיב/ה ביום העבודה הבא.', 'אני מחזיר/ה תשובה ביום העבודה הבא כדי לשמור על רצף עבודה בריא.', ['boundary:response']), c('ia2', 'אני עוצר/ת ומיישר/ת ציפיות.', 'אני עוצר/ת ומבקש/ת יישור ציפיות.', 'אני עוצר/ת את ההתקדמות ומבקש/ת יישור ציפיות לפני המשך עבודה.', ['boundary:process'])] },
      { id: 'ifThenReason', labelHe: 'כוונה', slotId: 'ifThenReason', optional: true, chips: [c('ir1', 'כדי למנוע טעויות.', 'כדי לשמור על איכות.', 'כדי לשמור על איכות ותיאום לאורך הדרך.', ['value:quality']), c('ir2', 'כדי לא להישחק.', 'כדי לשמור על קצב בריא.', 'כדי לשמור על קצב עבודה בריא ואפקטיבי לאורך זמן.', ['value:sustainability'])] },
      { id: 'availableFor', labelHe: 'אני זמין/ה ל...', slotId: 'availableFor', chips: [c('av1', 'אני זמין/ה לדברים מתוכננים.', 'אני זמין/ה למשימות מתואמות מראש.', 'אני זמין/ה למשימות שמתואמות מראש עם טווח זמן ברור.', ['availability']), c('av2', 'אני זמין/ה לסנכרון קצר.', 'אני זמין/ה לסנכרון קצר במהלך היום.', 'אני זמין/ה לסנכרון קצר במהלך היום כשקובעים אותו מראש.', ['availability'])] },
      { id: 'notAvailableFor', labelHe: 'אני לא זמין/ה ל...', slotId: 'notAvailableFor', chips: [c('nav1', 'אני לא זמין/ה למיידי.', 'אני לא זמין/ה לבקשות מיידיות ללא תיאום.', 'אני לא זמין/ה לבקשות מיידיות ללא תיאום, אלא אם הוגדר שזה דחוף.', ['availability']), c('nav2', 'אני לא זמין/ה בערב.', 'אני לא זמין/ה לפניות בערב.', 'אני לא זמין/ה לפניות בערב כדי לשמור על זמן התאוששות וקשב.', ['availability'])] },
      { id: 'channelBoundary', labelHe: 'גבול ערוץ', slotId: 'channelBoundary', optional: true, chips: [c('ch1', 'תשלחו במייל.', 'עדיף לי לרכז את זה במייל.', 'עדיף לי לרכז את זה במייל כדי לעקוב ולענות מסודר.', ['channel:email']), c('ch2', 'פניות קצרות בצ׳אט.', 'פניות קצרות אפשר בצ׳אט.', 'פניות קצרות אפשר בצ׳אט, ונושאים מורכבים עדיף במייל או שיחה מתואמת.', ['channel:chat'])] },
      { id: 'timeBoundary', labelHe: 'גבול זמן', slotId: 'timeBoundary', optional: true, chips: [c('tb1', 'אחזור מחר.', 'אחזור לזה ביום העבודה הבא.', 'אחזור לזה ביום העבודה הבא עם תשובה מסודרת.', ['time:followup']), c('tb2', 'בודק/ת פעם בשבוע.', 'אני בודק/ת בקשות כאלה פעם בשבוע.', 'אני בודק/ת בקשות כאלה פעם בשבוע כדי לשמור על תעדוף עקבי.', ['time:cadence'])] },
    ],
  }),
  {
    kind: 'questioner',
    id: 'clean-questions',
    route: '/lab/clean-questions',
    titleHe: 'שואל השאלות',
    titleEn: 'Clean & Meta Model',
    descriptionHe: 'שפה נקייה + Meta Model עם מיפוי Breen בסיסי.',
    modes: [
      {
        id: 'clean',
        labelHe: 'שפה נקייה',
        introHe: 'שאלות קצרות ללא הנחות שמרחיבות קשב ודיוק.',
        stems: ['ומה עוד?', 'ואיך זה בדיוק...?', 'מתי/איפה זה קורה?', 'ומה קורה רגע לפני?', 'ואיך אתה יודע/ת שזה כך?'],
      },
      {
        id: 'meta-model',
        labelHe: 'Meta Model',
        introHe: 'בחרו קטגוריה לקבלת שאלת מפתח + שאלות היקף/זמן/מרחב וקישורים קשורים.',
        categories: [
          {
            id: 'deletions',
            labelHe: 'השמטות',
            descriptionHe: 'חסר מידע: מי? מה? איך בדיוק?',
            primaryQuestion: 'איך ספציפית זה קורה?',
            stems: ['ביחס למה?', 'מי בדיוק אמר ש...?', 'איך ספציפית זה קורה?'],
            scopeTimeSpace: { scope: ['איזה חלק בדיוק?'], time: ['מתי זה קורה?'], space: ['איפה זה קורה?'] },
            relatedCategoryIds: ['generalizations'],
          },
          {
            id: 'generalizations',
            labelHe: 'הכללות',
            descriptionHe: 'תמיד/אף פעם/כולם/אי אפשר.',
            primaryQuestion: 'האם היה פעם שזה לא קרה?',
            stems: ['האם היה פעם שזה לא קרה?', 'מה יקרה אם תעשה זאת בכל זאת?', 'מה עוצר אותך מ...?'],
            scopeTimeSpace: { scope: ['עם מי זה נכון?'], time: ['מתי זה התחיל?'], space: ['באיזה הקשר זה שונה?'] },
            relatedCategoryIds: ['deletions', 'distortions'],
          },
          {
            id: 'distortions',
            labelHe: 'עיוותים',
            descriptionHe: 'סיבה-תוצאה/קריאת מחשבות/פרשנות כעובדה.',
            primaryQuestion: 'איך בדיוק X גורם ל-Y?',
            stems: ['איך בדיוק X גורם ל-Y?', 'מה הראיות לכך?', 'מה עוד יכול להסביר את זה?'],
            scopeTimeSpace: { scope: ['זה נכון בכל מצב?'], time: ['מתי זה כן משתנה?'], space: ['אצל מי זה לא כך?'] },
            relatedCategoryIds: ['generalizations'],
          },
        ],
      },
    ],
  },
  {
    kind: 'beyond',
    id: 'beyond-words',
    route: '/lab/beyond-words',
    titleHe: 'מעבר למילים',
    titleEn: 'Beyond Words Gym',
    descriptionHe: 'תרגול קשב, תחושת גוף ומשמעות: מה המשפט עושה לגוף ולבחירה.',
    practiceBuilderLabId: 'beyond-practice',
    timerOptionsSec: [30, 60, 90],
    bodyZones: [
      { id: 'head', labelHe: 'ראש' },
      { id: 'throat', labelHe: 'גרון' },
      { id: 'chest', labelHe: 'חזה' },
      { id: 'belly', labelHe: 'בטן' },
      { id: 'pelvis', labelHe: 'אגן' },
      { id: 'hands', labelHe: 'ידיים' },
      { id: 'legs', labelHe: 'רגליים' },
    ],
    somaticQualityByZone: {
      head: ['לחץ', 'מחשבות רצות', 'ערפול', 'צלילות', 'כובד'],
      throat: ['מחנק', 'פתיחות', 'רעד', 'שקט', 'יובש'],
      chest: ['התרחבות', 'כיווץ', 'דופק מהיר', 'חום', 'מועקה'],
      belly: ['פרפרים', 'קשר', 'שחרור', 'תנועה', 'זרימה'],
      pelvis: ['יציבות', 'כבדות', 'חוסר שקט', 'נוכחות', 'אדמה'],
      hands: ['רעד', 'חום', 'קור', 'מתח', 'רכות'],
      legs: ['דריכה', 'חולשה', 'רעד', 'יציבות', 'זרם'],
    },
    globalSomaticQualities: ['tight', 'warm', 'heavy', 'open', 'buzzing', 'calm', 'pressure', 'expansion'],
    qualityLabelsHe: {
      tight: 'כיווץ', warm: 'חום', heavy: 'כובד', open: 'פתיחות',
      buzzing: 'רטט', calm: 'רוגע', pressure: 'לחץ', expansion: 'התרחבות',
    },
    meaningPrompts: [
      'אם התחושה הזו הייתה מסר — מה היא אומרת?',
      'איזה שינוי בניסוח יוצר 5% יותר רוגע/התרחבות?',
    ],
    noticingPrompts: [
      'שים לב למרווח בין המילים. מה קורה שם?',
      "כשאתה קורא את הניסוח ה'חם' מול ה'קר', איפה בגוף אתה מרגיש את ההבדל?",
      'מה לא שמת לב שאתה רואה/שומע כרגע?',
    ],
    attentionProtocolPrompts: [
      'מה לא שמת לב שאתה רואה עכשיו?',
      'מה לא שמת לב שאתה שומע עכשיו?',
      'מה לא שמת לב שאתה מרגיש עכשיו?',
      'מה אתה רואה עכשיו?',
      'מה אתה שומע עכשיו?',
      'מה אתה מרגיש עכשיו?',
    ],
  },
]

visibleLabs.push({
  kind: 'mind-liberating',
  id: 'mind-liberating-language',
  route: '/lab/mind-liberating-language',
  titleHe: 'מיינד ליברייטינג שפה',
  titleEn: 'Mind Liberating Language',
  descriptionHe:
    'טקסט מטופל → מדד סגירת תודעה → ניסוח מטפל משחרר → אופציות שנפתחות.',
})

visibleLabs.push({
  kind: 'relations',
  id: 'relations',
  route: '/lab/relations',
  titleHe: 'מעבדת יחסים',
  titleEn: 'Relations Lab',
  descriptionHe:
    'סימולטור שאלות יחסים: בוחרים רגש, שואלים שאלה אחת, ורואים איך Open Field / Resources / Distress משתנים.',
})

export const hiddenLabs = [
  alchemy({
    id: 'beyond-practice',
    route: null,
    titleHe: 'בנאי ניסוח לתרגול',
    titleEn: 'Practice Builder',
    descriptionHe: 'משפט תרגול למעבדת מעבר למילים.',
    preview: { emptyTextHe: 'בחרו רכיבים כדי לבנות משפט תרגול.', punctuation: 'auto' },
    templates: [
      {
        id: 'practice',
        labelHe: 'משפט תרגול',
        slotOrder: ['opener', 'feeling', 'context', 'meaningShift', 'request'],
        requiredSlotIds: ['opener', 'feeling', 'context'],
        formatterId: 'practice-sentence',
      },
    ],
    chipBanks: [
      { id: 'opener', labelHe: 'פתיח', slotId: 'opener', chips: [c('po1', 'אני אומר/ת:', 'אני רוצה לבדוק מה קורה כשאני אומר/ת:', 'מסקרן אותי לבדוק מה משתנה בי כשאני אומר/ת:', ['attention:experiment']), c('po2', 'אני שם/ה לב ש...', 'אני שם/ה לב שכרגע...', 'אני שם/ה לב שכרגע, כשאני אומר/ת את זה, משהו בי מגיב', ['attention:noticing'])] },
      { id: 'feeling', labelHe: 'תחושה', slotId: 'feeling', chips: [c('pf1', 'אני מרגיש/ה כיווץ', 'אני מרגיש/ה מתח', 'אני מרגיש/ה מתח ורוצה לבדוק אם הוא זז קצת', ['somatic:contraction']), c('pf2', 'אני מרגיש/ה עומס', 'אני מרגיש/ה עומס בגוף', 'אני מרגיש/ה עומס ורוצה לבדוק מה ממנו צריך תשומת לב עכשיו', ['somatic:load']), c('pf3', 'אני מרגיש/ה קצת פתיחה', 'אני מרגיש/ה קצת יותר מרחב', 'אני מרגיש/ה קצת יותר מרחב, ואני בודק/ת איך לשמור על זה', ['somatic:expansion'])] },
      { id: 'context', labelHe: 'הקשר', slotId: 'context', chips: [c('pc1', 'כשאני קורא/ת את המשפט הזה', 'כשאני קורא/ת את הניסוח הזה', 'כשאני קורא/ת את הניסוח הזה בקול ושם/ה לב למה שקורה עכשיו', ['practice:read']), c('pc2', 'כשאני משווה ניסוח קר וחם', 'כשאני משווה בין נוסח קר לנוסח חם', 'כשאני משווה בין נוסח קר לנוסח חם ובודק/ת איפה ההבדל מורגש בגוף', ['practice:compare'])] },
      { id: 'meaningShift', labelHe: 'משמעות', slotId: 'meaningShift', optional: true, chips: [c('pm1', 'ואולי מספיק שינוי קטן', 'ואולי מספיק שינוי של 5%', 'ואולי מספיק שינוי של 5% כדי לייצר יותר רוגע או התייצבות', ['meaning:5pct']), c('pm2', 'ואני בודק/ת מה זה אומר', 'ואני בודק/ת איזה מסר יש בתחושה', 'ואני בודק/ת אם התחושה הזו מבקשת ממני דיוק, האטה או תמיכה', ['meaning:lens'])] },
      { id: 'request', labelHe: 'בקשת ניסוי', slotId: 'request', optional: true, chips: [c('pr1', 'ואני נושם/ת.', 'ואני עוצר/ת לנשימה אחת.', 'ואני עוצר/ת לנשימה אחת ובודק/ת מה השתנה עכשיו.', ['practice:breath']), c('pr2', 'ואומר/ת שוב.', 'ואני קורא/ת את זה שוב.', 'ואני קורא/ת את זה שוב לאט, כדי לשים לב להבדלים עדינים.', ['practice:repeat'])] },
    ],
  }),
]

export const allLabs = [...visibleLabs, ...hiddenLabs]
export const labsById = Object.fromEntries(allLabs.map((lab) => [lab.id, lab]))
export const alchemyLabIds = allLabs.filter((lab) => lab.kind === 'alchemy').map((lab) => lab.id)
export const dashboardCards = visibleLabs.map((lab) => ({ id: lab.id, route: lab.route, titleHe: lab.titleHe, descriptionHe: lab.descriptionHe, kind: lab.kind }))

export function getLabConfig(labId) {
  return labsById[labId] ?? null
}
