import { useEffect, useMemo, useRef, useState } from 'react'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'
import { makeId } from '../utils/ids'
import { Link } from 'react-router-dom'
import LabLessonPrompt from '../components/layout/LabLessonPrompt'
import MenuSection from '../components/layout/MenuSection'
import LiberatingConversationSimulator from '../components/mind/LiberatingConversationSimulator'
import PatternSequenceMaster from '../components/mind/PatternSequenceMaster'
import {
  CheckCircle2,
  MessageCircle,
  Shuffle,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
  Wand2,
  Workflow,
} from 'lucide-react'
import { emitAlchemySignal } from '../utils/alchemySignals'
import {
  liberatingClientStatements,
  liberatingPatterns,
  randomItem,
  statementsForContext,
} from '../data/mindLiberatingTraining'

const SAMPLE_PATIENT_TEXTS = [
  'אני תמיד נתקע כשצריך לדבר מול אנשים, זה פשוט לא אני.',
  'אין לי שום דרך אחרת, כולם מצפים ממני להיות חזק כל הזמן.',
  'אני לא יכול להתמודד עם זה, זה גדול עליי מדי.',
]

const CLOSURE_PATTERNS = [
  {
    id: 'uq',
    labelHe: 'כימות כולל (תמיד/אף פעם/כולם)',
    patterns: [/תמיד/g, /אף פעם/g, /כולם/g, /הכול/g, /הכל/g, /שום דבר/g],
    weight: 15,
    releaseHintHe: "בדוק/י חריגים: 'תמיד' → 'לפעמים' / 'בחלק מהמקרים'.",
  },
  {
    id: 'modal',
    labelHe: 'נעילת אפשרות (אי אפשר/לא יכול/חייב)',
    patterns: [/אי אפשר/g, /לא יכול(?:ה)?/g, /אין ברירה/g, /חייב(?:ת)?/g, /מוכרח(?:ת)?/g],
    weight: 18,
    releaseHintHe: "רכך/י מודאליות: 'לא יכול' → 'כרגע קשה לי'.",
  },
  {
    id: 'certainty',
    labelHe: 'ודאות קשיחה (ברור/אין מצב)',
    patterns: [/ברור ש/g, /אין מצב/g, /בטוח ש/g, /חד משמעית/g],
    weight: 12,
    releaseHintHe: "הכנס/י מרחב בדיקה: 'ברור' → 'כרגע נראה לי'.",
  },
  {
    id: 'identity',
    labelHe: 'מיזוג זהות (זה אני / אני כזה)',
    patterns: [/זה אני\b/g, /אני כזה/g, /אני בן אדם ש/g, /ככה אני/g],
    weight: 16,
    releaseHintHe: 'הפרד/י בין אדם להתנהגות/מצב: "יש חלק בי ש...".',
  },
]

const OPENNESS_PATTERNS = [
  { labelHe: 'שפה פתוחה/אפשרית', patterns: [/אולי/g, /יכול להיות/g, /אפשר/g, /ייתכן/g], weight: 8 },
  { labelHe: 'דיוק בזמן (כרגע/בינתיים)', patterns: [/כרגע/g, /בינתיים/g, /עכשיו/g, /בחלק מהמקרים/g], weight: 6 },
  { labelHe: 'הבחנה חלקית (לפעמים/חלק)', patterns: [/לפעמים/g, /לעיתים/g, /חלק/g, /במידה/g], weight: 7 },
]

const QUANTIFIER_SHIFTS = [
  {
    id: 'q-soften',
    labelHe: "כימות: תמיד → לפעמים / בחלק מהמקרים",
    promptHe: 'מתי זה קורה רק בחלק מהמקרים, ולא תמיד?',
  },
  {
    id: 'q-exception',
    labelHe: 'חריגים: אף פעם → האם היה רגע אחד שונה?',
    promptHe: 'האם היה אפילו רגע אחד שבו זה היה קצת אחרת?',
  },
  {
    id: 'q-scale',
    labelHe: 'סקאלה: הכול → באיזה מידה / כמה אחוז?',
    promptHe: 'אם זה לא 100%, אז כמה זה כרגע?',
  },
]

const RELEASE_CHANNELS = [
  {
    id: 'time',
    labelHe: 'זמן (מתי/לפני/אחרי)',
    promptHe: 'מתי זה פחות חזק? מה קורה רגע לפני שזה נסגר?',
  },
  {
    id: 'space',
    labelHe: 'מרחב/הקשר',
    promptHe: 'באיזה מקום/הקשר זה אחרת? עם מי יש יותר מרחב?',
  },
  {
    id: 'energy',
    labelHe: 'גוף/אנרגיה',
    promptHe: 'איך הגוף מחזיק את האמונה הזו עכשיו, ומה קורה אם זה מתרכך ב-5%?',
  },
  {
    id: 'meaning',
    labelHe: 'משמעות/מסגור',
    promptHe: 'איזו משמעות אחרת יכולה להסביר את מה שקרה בלי לנעול את כל האפשרויות?',
  },
]

const OPTION_OPENERS = [
  {
    id: 'consent',
    labelHe: 'אילו אופציות אתה מסכים לשקול?',
    promptHe: 'אם לא חייבים לפתור הכול עכשיו, אילו שתי אופציות אתה מוכן רק לשקול?',
  },
  {
    id: 'micro-step',
    labelHe: 'מה הצעד הקטן הבא?',
    promptHe: 'איזה צעד קטן אחד כן אפשרי, גם אם כל השאר עדיין לא ברור?',
  },
  {
    id: 'support',
    labelHe: 'איזו תמיכה פותחת שדה?',
    promptHe: 'מה תמיכה אחת שתעשה את זה יותר אפשרי עבורך?',
  },
  {
    id: 'non-negotiable-shift',
    labelHe: 'מה כבר לא מוכן שימשיך / מי לא מוכן להיות יותר?',
    promptHe:
      'מה אתה לא מוכן שיקרה יותר, או מי אתה לא מוכן להיות יותר? זה אומר שמשהו חייב להשתנות גם אם עדיין לא ברור איך.',
  },
]

const THERAPIST_TONES = [
  { id: 'grounded', labelHe: 'קרקעי / יציב', openerHe: 'אני שומע/ת אותך, וחשוב לי שנדייק רגע את מה שקורה כאן.' },
  { id: 'soft', labelHe: 'רך / אמפתי', openerHe: 'אני איתך בזה, ובוא ננסה לפתוח כאן קצת יותר מרחב בלי לבטל את מה שאתה מרגיש.' },
  { id: 'direct', labelHe: 'ישיר / מוביל', openerHe: 'בוא נעצור רגע ונבדוק אם הניסוח הנוכחי סוגר לך אפשרויות שכרגע עוד לא ראינו.' },
]

const MINDLAB_MAIN_STEPS = [
  {
    id: 'patient-source',
    shortLabelHe: 'משפט מטופל',
    titleHe: '1) מה המטופל אומר',
    subtitleHe: 'מתחילים מהטקסט כפי שהוא, בלי לתקן אותו עדיין.',
  },
  {
    id: 'therapist-script',
    shortLabelHe: 'ניסוח מטפל',
    titleHe: '2) טקסט מטפל שמזיז תודעה',
    subtitleHe: 'ניסוח שמכבד חוויה ופותח שדה ואפשרויות.',
  },
  {
    id: 'options-shift',
    shortLabelHe: 'אופציות לפני/אחרי',
    titleHe: '3) אילו אופציות לא נראו קודם, ואילו נפתחו אחרי השחרור',
    subtitleHe: 'כאן מודדים שינוי בפועל במה שהמטופל מוכן לראות.',
  },
  {
    id: 'training-tools',
    shortLabelHe: 'תרגול מתקדם',
    titleHe: '4) מעבדות אימון מתקדמות',
    subtitleHe: 'סימולטור + מאסטר רצפים לתרגול על יבש עם פידבק.',
  },
]

const MINDLAB_WORK_TONES = [
  {
    id: 'therapist',
    icon: '🧠',
    labelHe: 'מטפל',
    subtitleHe: 'קליניקה / החזקת חוויה',
    lensHe: 'מכבדים חוויה, מרככים נעילה, פותחים שדה ואפשרויות.',
    patientInputLabelHe: 'משפט מטופל (כמו שנאמר)',
    patientInputPlaceholderHe: "לדוגמה: 'אני תמיד נתקע, אין לי דרך אחרת, זה פשוט לא אני...'",
    sampleTexts: SAMPLE_PATIENT_TEXTS,
    simulatorIntroHe: 'תרגול תגובת מטפל/ת שמרככת סגירה בלי לבטל את החוויה.',
    patternIntroHe: 'רצפי שאלות טיפוליים לפתיחת שדה והזמנת אופציות.',
    roleLabelHe: 'מטופל/ת',
  },
  {
    id: 'coach',
    icon: '🚀',
    labelHe: "קואץ'",
    subtitleHe: 'בהירות / תנועה / אחריות',
    lensHe: 'ממירים מוחלטות לדיוק פעולה, צעד הבא ואפשרויות בחירה.',
    patientInputLabelHe: 'משפט מתאמן/ת / לקוח/ה',
    patientInputPlaceholderHe: "לדוגמה: 'אני תמיד מתחיל חזק ואז נופל, כנראה אני לא עקבי...'",
    sampleTexts: [
      'אני תמיד מתחיל חזק ואז נופל, כנראה אני פשוט לא עקבי.',
      'אין לי זמן באמת לעבוד על זה, הכל שורף אותי.',
      'אם זה לא מושלם אין טעם להתחיל.',
    ],
    simulatorIntroHe: 'תרגול שיח שמכוון לבהירות, בחירה וצעד קטן ישים.',
    patternIntroHe: 'רצפי שאלות קואצ׳ינג לפתיחת אופציות ותנועה קדימה.',
    roleLabelHe: 'מתאמן/ת',
  },
  {
    id: 'self-work',
    icon: '🌿',
    labelHe: 'עבודה עצמית',
    subtitleHe: 'קול פנימי / חמלה / דיוק',
    lensHe: 'עובדים עם הדיאלוג הפנימי: פחות שיפוט, יותר דיוק ואפשרות תנועה.',
    patientInputLabelHe: 'המשפט שאני אומר/ת לעצמי',
    patientInputPlaceholderHe: "לדוגמה: 'אני תמיד הורס/ת לעצמי ברגע האחרון...'",
    sampleTexts: [
      'אני תמיד הורס/ת לעצמי ברגע האחרון.',
      'אני לא יכולה להשתנות, ככה המוח שלי עובד.',
      'אם אני נחה רגע אז אני עצלנ/ית.',
    ],
    simulatorIntroHe: 'אפשר להשתמש בסימולטור כתרגול ניסוח מחדש לקול פנימי.',
    patternIntroHe: 'רצפים שמתרגמים שיפוט עצמי לשפה פתוחה ומדויקת יותר.',
    roleLabelHe: 'אני',
  },
  {
    id: 'relationship-family',
    icon: '❤️',
    labelHe: 'זוגיות/משפחה',
    subtitleHe: 'דינמיקה / תקשורת / גבולות',
    lensHe: 'מורידים מוחלטות ביחסים ומחזירים מקום לניואנס, צורך וגבול.',
    patientInputLabelHe: 'משפט מתוך קשר / משפחה',
    patientInputPlaceholderHe: "לדוגמה: 'אצלנו בבית אף אחד לא באמת מקשיב לי...'",
    sampleTexts: [
      'אצלנו בבית אף אחד לא באמת מקשיב לי.',
      'הוא תמיד סוגר אותי בכל שיחה חשובה.',
      'אין מצב שנצליח לדבר על זה בלי ריב.',
    ],
    simulatorIntroHe: 'תרגול ניסוח תגובה שמפחיתה הסלמה ומרחיבה אפשרויות שיח.',
    patternIntroHe: 'רצפי פתיחה לדיאלוג במצבי זוגיות/משפחה טעונים.',
    roleLabelHe: 'אדם בקשר',
  },
  {
    id: 'identity-change',
    icon: '✨',
    labelHe: 'זהות ושינוי',
    subtitleHe: 'TCU style / זהות בתנועה',
    lensHe: 'עובדים על משפטי זהות קשיחים ומתרגמים אותם לשפה של תהליך ושינוי.',
    patientInputLabelHe: 'משפט זהות / שינוי',
    patientInputPlaceholderHe: "לדוגמה: 'ככה אני, אני לא בן אדם שמשתנה...'",
    sampleTexts: [
      'ככה אני, אני לא בן אדם שמשתנה.',
      'זה פשוט מי שאני - אני תמיד נתקע/ת מול אנשים.',
      'אם שיניתי משהו, זה אומר שלא הייתי אני.',
    ],
    simulatorIntroHe: 'תרגול שפה שמפרידה בין זהות לבין מצב/דפוס רגעי.',
    patternIntroHe: 'רצפים לפתיחת זהות קשיחה לתהליך, טווח ואפשרות.',
    roleLabelHe: 'אדם בתהליך שינוי',
  },
]

const MINDLAB_EXERCISE_PRESETS = [
  {
    id: 'preset-quantifier-soften',
    icon: '🪶',
    titleHe: 'ריכוך "תמיד/אף פעם"',
    familyHe: 'כימות',
    summaryHe: 'מעבירים ניסוח מוחלט לשפה חלקית ומדויקת יותר.',
    quantifierId: 'q-soften',
    releaseChannelId: 'time',
    optionOpenerId: 'micro-step',
    exampleHe: 'מתי זה קורה רק בחלק מהמקרים? מה כבר שונה לפעמים?',
  },
  {
    id: 'preset-exception-hunt',
    icon: '🔍',
    titleHe: 'ציד חריגים',
    familyHe: 'חריגים',
    summaryHe: 'מחפשים רגע אחד שלא תואם את הסיפור הסגור.',
    quantifierId: 'q-exception',
    releaseChannelId: 'space',
    optionOpenerId: 'consent',
    exampleHe: 'האם היה רגע אחד, אפילו קטן, שבו זה היה קצת אחרת?',
  },
  {
    id: 'preset-scale-language',
    icon: '📏',
    titleHe: 'סקאלה במקום הכול/כלום',
    familyHe: 'דיוק',
    summaryHe: 'מחליפים שחור-לבן בסקאלה, מידה ואחוזים.',
    quantifierId: 'q-scale',
    releaseChannelId: 'meaning',
    optionOpenerId: 'micro-step',
    exampleHe: 'אם זה לא 100%, אז כמה זה כרגע? ומה מוריד 5%?',
  },
  {
    id: 'preset-time-window',
    icon: '⏳',
    titleHe: 'חלון זמן',
    familyHe: 'זמן',
    summaryHe: 'שינוי דרך "מתי", "לפני", "אחרי" והופעת תנאים.',
    quantifierId: 'q-soften',
    releaseChannelId: 'time',
    optionOpenerId: 'support',
    exampleHe: 'מתי זה פחות חזק? מה קורה רגע לפני שהדפוס נסגר?',
  },
  {
    id: 'preset-context-body',
    icon: '🌐',
    titleHe: 'הקשר + גוף',
    familyHe: 'מרחב/גוף',
    summaryHe: 'פותחים שדה דרך מקום, אנשים וגוף שמחזיק את הסיפור.',
    quantifierId: 'q-exception',
    releaseChannelId: 'energy',
    optionOpenerId: 'support',
    exampleHe: 'עם מי/איפה זה קצת אחרת? מה משתנה בגוף אם זה מתרכך ב-5%?',
  },
  {
    id: 'preset-identity-shift',
    icon: '✨',
    titleHe: 'שינוי זהות לצעד',
    familyHe: 'זהות → תהליך',
    summaryHe: 'מפרידים בין "מי אני" לבין דפוס/מצב ופותחים צעד אפשרי.',
    quantifierId: 'q-scale',
    releaseChannelId: 'meaning',
    optionOpenerId: 'non-negotiable-shift',
    exampleHe: 'איזו משמעות אחרת אפשר לתת לזה בלי לנעול את הזהות שלך?',
  },
]

const MINDLAB_AUDIO_PREFS_KEY = 'la.v1.mindlabAudioPrefs'
const MINDLAB_UI_PREFS_KEY = 'la.v1.mindlabUiPrefs'

function readMindlabAudioPrefs() {
  if (typeof window === 'undefined') {
    return { enabled: false, muted: false, dontAskAgain: false }
  }
  try {
    const raw = window.localStorage.getItem(MINDLAB_AUDIO_PREFS_KEY)
    if (!raw) return { enabled: false, muted: false, dontAskAgain: false }
    const parsed = JSON.parse(raw)
    return {
      enabled: Boolean(parsed?.enabled),
      muted: Boolean(parsed?.muted),
      dontAskAgain: Boolean(parsed?.dontAskAgain),
    }
  } catch {
    return { enabled: false, muted: false, dontAskAgain: false }
  }
}

function writeMindlabAudioPrefs(nextPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MINDLAB_AUDIO_PREFS_KEY, JSON.stringify(nextPrefs))
  } catch {
    // no-op
  }
}

function readMindlabUiPrefs() {
  if (typeof window === 'undefined') {
    return { addressGender: 'masc' }
  }
  try {
    const raw = window.localStorage.getItem(MINDLAB_UI_PREFS_KEY)
    if (!raw) return { addressGender: 'masc' }
    const parsed = JSON.parse(raw)
    return { addressGender: parsed?.addressGender === 'fem' ? 'fem' : 'masc' }
  } catch {
    return { addressGender: 'masc' }
  }
}

function writeMindlabUiPrefs(nextPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MINDLAB_UI_PREFS_KEY, JSON.stringify(nextPrefs))
  } catch {
    // no-op
  }
}

function genderizeUiHe(text, addressGender = 'masc') {
  const value = String(text ?? '')
  if (!value || !value.includes('/')) return value

  let next = value
  const exactReplacements = {
    'בדוק/י': addressGender === 'fem' ? 'בדקי' : 'בדוק',
    'בחר/י': addressGender === 'fem' ? 'בחרי' : 'בחר',
    'הדבק/י': addressGender === 'fem' ? 'הדביקי' : 'הדבק',
    'רכך/י': addressGender === 'fem' ? 'רככי' : 'רכך',
    'הכנס/י': addressGender === 'fem' ? 'הכניסי' : 'הכנס',
    'הפרד/י': addressGender === 'fem' ? 'הפרידי' : 'הפרד',
    'התחל/י': addressGender === 'fem' ? 'התחילי' : 'התחל',
    'שאל/י': addressGender === 'fem' ? 'שאלי' : 'שאל',
    'בנה/י': addressGender === 'fem' ? 'בני' : 'בנה',
    'בוא/י': addressGender === 'fem' ? 'בואי' : 'בוא',
    'שים/י': addressGender === 'fem' ? 'שימי' : 'שים',
    'פתח/י': addressGender === 'fem' ? 'פתחי' : 'פתח',
    'טען/י': addressGender === 'fem' ? 'טעני' : 'טען',
    'שלח/י': addressGender === 'fem' ? 'שלחי' : 'שלח',
    'עבוד/י': addressGender === 'fem' ? 'עבדי' : 'עבוד',
    'השלם/י': addressGender === 'fem' ? 'השלימי' : 'השלם',
    'לחץ/י': addressGender === 'fem' ? 'לחצי' : 'לחץ',
    'נסו': addressGender === 'fem' ? 'נסי' : 'נסה',
    'נסה/י': addressGender === 'fem' ? 'נסי' : 'נסה',
    'כתוב/כתבי': addressGender === 'fem' ? 'כתבי' : 'כתוב',
    'מטופל/ת': addressGender === 'fem' ? 'מטופלת' : 'מטופל',
    'מתאמן/ת': addressGender === 'fem' ? 'מתאמנת' : 'מתאמן',
    'לקוח/ה': addressGender === 'fem' ? 'לקוחה' : 'לקוח',
  }

  Object.entries(exactReplacements).forEach(([pattern, replacement]) => {
    next = next.split(pattern).join(replacement)
  })

  next = next.replace(/([א-ת"׳]+)\/ת\b/g, (_, base) => (addressGender === 'fem' ? `${base}ת` : base))
  next = next.replace(/([א-ת"׳]+)\/ה\b/g, (_, base) => (addressGender === 'fem' ? `${base}ה` : base))

  return next
}

function playWebAudioCue(audioContextRef, cue = 'tap', muted = false) {
  if (muted || typeof window === 'undefined') return
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return

  let ctx = audioContextRef.current
  if (!ctx) {
    try {
      ctx = new AudioContextCtor()
      audioContextRef.current = ctx
    } catch {
      return
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.value = 0.0001

  const cueMap = {
    tap: [520, 660],
    whoosh: [240, 320, 420],
    sparkle: [880, 1046],
    harp: [660, 880, 1320],
    gong: [220, 330, 440],
    ambient: [256, 384],
  }
  const frequencies = cueMap[cue] ?? cueMap.tap
  const baseVolume = cue === 'ambient' ? 0.012 : 0.03
  const attack = cue === 'ambient' ? 0.4 : 0.02
  const release = cue === 'ambient' ? 1.4 : 0.18

  frequencies.forEach((frequency, index) => {
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = cue === 'ambient' ? 'sine' : index % 2 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(frequency, now)
    oscGain.gain.setValueAtTime(0.0001, now)
    oscGain.gain.linearRampToValueAtTime(baseVolume / (index + 1), now + attack)
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release)
    osc.connect(oscGain)
    oscGain.connect(gain)
    osc.start(now + index * 0.015)
    osc.stop(now + attack + release + index * 0.015 + 0.02)
  })
}

function alchemistFaceForMood(mood) {
  if (mood === 'dancing') return '🧙‍♂️✨'
  if (mood === 'surprised') return '🧙‍♂️😲'
  if (mood === 'clap') return '🧙‍♂️👏'
  return '🧙‍♂️🙂'
}

function AlchemistCompanion({ mood, message, pulseKey }) {
  const face = alchemistFaceForMood(mood)
  return (
    <aside className={`mindlab-companion mood-${mood || 'happy'}`} aria-live="polite" aria-label="Alchemist Companion">
      <div key={pulseKey} className="mindlab-companion__orb" aria-hidden="true">
        {face}
      </div>
      <div className="mindlab-companion__bubble">
        <strong>Alchemist Companion</strong>
        <span>{message || 'פותחים שדה, צעד אחד בכל פעם.'}</span>
      </div>
    </aside>
  )
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function countPatternMatches(text, pattern) {
  try {
    return [...text.matchAll(pattern)].length
  } catch {
    return 0
  }
}

function normalizeText(text) {
  return String(text ?? '').trim()
}

function parseOptionsList(text) {
  return normalizeText(text)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueList(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

function includesLooseningLanguage(text) {
  return /(אולי|אפשר|כרגע|לפעמים|בחלק מהמקרים|יכול להיות)/.test(text)
}

function analyzePatientText(rawText) {
  const text = normalizeText(rawText)
  if (!text) {
    return {
      text,
      closureScore: 0,
      optionBlindnessScore: 0,
      opennessSignals: 0,
      windowLabelHe: 'ממתין לטקסט',
      detectedClosures: [],
      detectedOpenings: [],
      releaseHintsHe: [
        'הדבק/י משפט של המטופל כדי לזהות איפה הניסוח סוגר אפשרויות.',
        "אחר כך נבנה ניסוח מטפל שמזיז מ'אין דרך' ל'יש לפחות בדיקה'.",
      ],
      summaryHe: 'אין עדיין טקסט מטופל.',
    }
  }

  const detectedClosures = CLOSURE_PATTERNS.map((item) => {
    const count = item.patterns.reduce(
      (sum, pattern) => sum + countPatternMatches(text, pattern),
      0,
    )
    return { ...item, count, score: count * item.weight }
  }).filter((item) => item.count > 0)

  const detectedOpenings = OPENNESS_PATTERNS.map((item) => {
    const count = item.patterns.reduce(
      (sum, pattern) => sum + countPatternMatches(text, pattern),
      0,
    )
    return { ...item, count, score: count * item.weight }
  }).filter((item) => item.count > 0)

  const negationCount = countPatternMatches(text, /\bלא\b/g) + countPatternMatches(text, /\bאין\b/g)
  const questionCount = countPatternMatches(text, /\?/g)

  const closureBase = detectedClosures.reduce((sum, item) => sum + item.score, 0) + negationCount * 4
  const opennessBase = detectedOpenings.reduce((sum, item) => sum + item.score, 0) + questionCount * 4

  const closureScore = clamp(Math.round(18 + closureBase - opennessBase * 0.5), 0, 100)
  const optionBlindnessScore = clamp(
    Math.round(closureScore * 0.75 + Math.max(0, 22 - detectedOpenings.length * 8) + negationCount * 2),
    0,
    100,
  )
  const opennessSignals = clamp(Math.round(100 - closureScore + opennessBase * 0.35), 0, 100)

  let windowLabelHe = 'שדה פתוח יחסית'
  if (closureScore >= 75) windowLabelHe = 'שדה סגור מאוד'
  else if (closureScore >= 55) windowLabelHe = 'שדה צר / נעול'
  else if (closureScore >= 35) windowLabelHe = 'שדה מעורב (יש נעילה ויש פתחים)'

  const releaseHintsHe = uniqueList([
    ...detectedClosures.map((item) => item.releaseHintHe),
    closureScore >= 65 ? 'התחל/י משינוי קטן בכימות לפני שינוי משמעות גדול.' : '',
    optionBlindnessScore >= 60 ? 'שאל/י קודם על אופציה אחת קטנה שהמטופל רק מוכן לשקול.' : '',
    detectedOpenings.length ? 'יש כבר ניצני פתיחה בטקסט. אפשר לחזק אותם במקום להילחם ישירות בתוכן.' : '',
  ])

  const summaryHe = detectedClosures.length
    ? `זוהו ${detectedClosures.length} דפוסי סגירה מרכזיים. המיקוד הוא להרחיב אפשרויות בלי להתווכח עם החוויה.`
    : 'לא זוהו דפוסי סגירה מובהקים. אפשר לעבוד דרך דיוק, כימות ומשמעות.'

  return {
    text,
    closureScore,
    optionBlindnessScore,
    opennessSignals,
    windowLabelHe,
    detectedClosures,
    detectedOpenings,
    releaseHintsHe,
    summaryHe,
  }
}

function buildTherapistScript({
  patientText,
  analysis,
  quantifierShift,
  releaseChannel,
  optionOpener,
  therapistTone,
}) {
  const patient = normalizeText(patientText)
  if (!patient) return ''

  const closureSummaryHe =
    analysis.closureScore >= 70
      ? 'הניסוח כרגע נשמע מאוד סגור ומציג מעט מאוד אפשרויות.'
      : analysis.closureScore >= 45
        ? 'יש כאן חוויה אמיתית, ובמקביל הניסוח כרגע מצמצם את שדה האפשרויות.'
        : 'יש כאן כבר קצת מרחב, ואפשר לדייק אותו עוד.'

  return [
    therapistTone.openerHe,
    `כשאני שומע/ת אותך אומר/ת: "${patient}"`,
    closureSummaryHe,
    'אני לא מנסה לשכנע אותך שזה לא נכון, אלא לבדוק איפה יש עוד מרחב שלא קיבל מילים.',
    quantifierShift.promptHe,
    releaseChannel.promptHe,
    optionOpener.promptHe,
    'אם ייפתח אפילו 5% יותר מרחב עכשיו, מה תהיה האפשרות הראשונה שתסכים/י לראות?',
  ]
    .filter(Boolean)
    .join(' ')
}

function scoreTone(score) {
  if (score >= 75) return 'high'
  if (score >= 45) return 'mid'
  return 'low'
}

const WORK_TONE_TO_CONTEXT_IDS = {
  therapist: ['therapy'],
  coach: ['self-coaching', 'career', 'daily'],
  'self-work': ['self-coaching', 'daily'],
  'relationship-family': ['relationships'],
  'identity-change': ['identity'],
}

function matchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function evaluateMiniSimulatorResponse(responseText, statementText = '') {
  const text = normalizeText(responseText)
  if (!text) {
    return {
      score: 0,
      level: 'none',
      labelHe: 'עדיין לא נבדק',
      feedbackHe: ['כתבו תגובה ואז לחצו "בדוק תגובה".'],
    }
  }

  let score = 20
  const feedback = []
  const hasQuestion = /[?؟]/.test(text)
  const hasRelationship = matchesAnyPattern(text, [/מה הקשר/, /איך .*מתקשר/, /בין .* ל/])
  const hasLoosening = matchesAnyPattern(text, [/אולי/, /יכול/, /לפעמים/, /כרגע/, /אפשר/, /בחלק/])
  const hasClientWords = normalizeText(statementText)
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .some((word) => text.includes(word))

  if (hasQuestion) {
    score += 18
  } else {
    feedback.push('הפכו את התגובה לשאלה פותחת.')
  }
  if (hasRelationship) {
    score += 28
  } else {
    feedback.push("הוסיפו ציר יחס: 'מה הקשר / איך X מתקשר ל-Y'.")
  }
  if (hasLoosening) {
    score += 20
  } else {
    feedback.push("הוסיפו שפה פותחת: 'אולי / כרגע / לפעמים / אפשר'.")
  }
  if (hasClientWords) {
    score += 10
  } else {
    feedback.push('עבדו עם מילים מתוך המשפט של המטופל.')
  }
  if (matchesAnyPattern(text, [/מרגיש/, /שם לב/, /בגוף/, /עכשיו/])) {
    score += 12
  }

  score = clamp(Math.round(score), 0, 100)
  const level = score >= 76 ? 'great' : score >= 52 ? 'almost' : 'needs-work'
  return {
    score,
    level,
    labelHe: level === 'great' ? 'מעולה' : level === 'almost' ? 'כמעט' : 'צריך לפתוח עוד',
    feedbackHe:
      feedback.length > 0
        ? feedback
        : ['מעולה. שימרת חוויה, פתחת שדה ושאלת שאלה שמזיזה תודעה.'],
  }
}

export default function MindLiberatingLanguagePage() {
  const lab = getLabConfig('mind-liberating-language') ?? {
    id: 'mind-liberating-language',
    titleHe: 'מיינד ליברייטינג שפה',
    descriptionHe: 'טקסט מטופל → שחרור תודעתי → אופציות חדשות',
  }
  const { state, upsertHistory, setLastVisitedLab } = useAppState()

  const [patientText, setPatientText] = useState('')
  const [selectedQuantifierId, setSelectedQuantifierId] = useState(QUANTIFIER_SHIFTS[0].id)
  const [selectedReleaseChannelId, setSelectedReleaseChannelId] = useState(RELEASE_CHANNELS[0].id)
  const [selectedOptionOpenerId, setSelectedOptionOpenerId] = useState(OPTION_OPENERS[0].id)
  const [selectedWorkToneId, setSelectedWorkToneId] = useState(MINDLAB_WORK_TONES[0].id)
  const [selectedToneId, setSelectedToneId] = useState(THERAPIST_TONES[1].id)
  const [therapistText, setTherapistText] = useState('')
  const [beforeOptionsText, setBeforeOptionsText] = useState('')
  const [afterOptionsText, setAfterOptionsText] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [activeTrainingToolId, setActiveTrainingToolId] = useState('')
  const [activeMindTabId, setActiveMindTabId] = useState('simulator')
  const [activeStepId, setActiveStepId] = useState(MINDLAB_MAIN_STEPS[0].id)
  const [completedStepIds, setCompletedStepIds] = useState([])
  const [miniSimulatorContextId, setMiniSimulatorContextId] = useState('therapy')
  const [miniSimulatorStatementId, setMiniSimulatorStatementId] = useState(null)
  const [miniSimulatorResponse, setMiniSimulatorResponse] = useState('')
  const [miniSimulatorChecked, setMiniSimulatorChecked] = useState(false)
  const [selectedExercisePatternId, setSelectedExercisePatternId] = useState(() => liberatingPatterns[0]?.id ?? '')
  const [exerciseFillAnswer, setExerciseFillAnswer] = useState('')
  const [exerciseFillChecked, setExerciseFillChecked] = useState(false)
  const [exerciseApplicationText, setExerciseApplicationText] = useState('')
  const [exerciseApplicationChecked, setExerciseApplicationChecked] = useState(false)
  const [showAdvancedSimulator, setShowAdvancedSimulator] = useState(false)
  const [showAdvancedPatternMaster, setShowAdvancedPatternMaster] = useState(false)
  const [companionMood, setCompanionMood] = useState('happy')
  const [companionMessage, setCompanionMessage] = useState('ברוך/ה הבא/ה למעבדה. מתחילים במשפט המטופל ומשם פותחים שדה.')
  const [companionPulseKey, setCompanionPulseKey] = useState(0)
  const [addressGender, setAddressGender] = useState(() => readMindlabUiPrefs().addressGender)
  const [audioPrefs, setAudioPrefs] = useState(() => readMindlabAudioPrefs())
  const [showSoundConsent, setShowSoundConsent] = useState(() => !readMindlabAudioPrefs().dontAskAgain)
  const stepRefs = useRef({})
  const audioContextRef = useRef(null)
  const ambientTimerRef = useRef(null)

  useEffect(() => {
    setLastVisitedLab(lab.id)
  }, [lab.id, setLastVisitedLab])

  useEffect(() => {
    writeMindlabAudioPrefs(audioPrefs)
  }, [audioPrefs])

  useEffect(() => {
    writeMindlabUiPrefs({ addressGender })
  }, [addressGender])

  useEffect(() => {
    if (ambientTimerRef.current) {
      window.clearInterval(ambientTimerRef.current)
      ambientTimerRef.current = null
    }
    if (!audioPrefs.enabled || audioPrefs.muted) return
    ambientTimerRef.current = window.setInterval(() => {
      playWebAudioCue(audioContextRef, 'ambient', audioPrefs.muted)
    }, 12000)
    return () => {
      if (ambientTimerRef.current) {
        window.clearInterval(ambientTimerRef.current)
        ambientTimerRef.current = null
      }
    }
  }, [audioPrefs.enabled, audioPrefs.muted])

  const analysis = useMemo(() => analyzePatientText(patientText), [patientText])
  const quantifierShift =
    QUANTIFIER_SHIFTS.find((item) => item.id === selectedQuantifierId) ?? QUANTIFIER_SHIFTS[0]
  const releaseChannel =
    RELEASE_CHANNELS.find((item) => item.id === selectedReleaseChannelId) ?? RELEASE_CHANNELS[0]
  const optionOpener =
    OPTION_OPENERS.find((item) => item.id === selectedOptionOpenerId) ?? OPTION_OPENERS[0]
  const activeWorkTone =
    MINDLAB_WORK_TONES.find((tone) => tone.id === selectedWorkToneId) ?? MINDLAB_WORK_TONES[0]
  const therapistTone =
    THERAPIST_TONES.find((item) => item.id === selectedToneId) ?? THERAPIST_TONES[0]
  const exercisePresetCards = useMemo(
    () =>
      MINDLAB_EXERCISE_PRESETS.map((preset) => ({
        ...preset,
        quantifierShift: QUANTIFIER_SHIFTS.find((item) => item.id === preset.quantifierId) ?? QUANTIFIER_SHIFTS[0],
        releaseChannel: RELEASE_CHANNELS.find((item) => item.id === preset.releaseChannelId) ?? RELEASE_CHANNELS[0],
        optionOpener: OPTION_OPENERS.find((item) => item.id === preset.optionOpenerId) ?? OPTION_OPENERS[0],
      })),
    [],
  )

  const generatedTherapistText = useMemo(
    () =>
      buildTherapistScript({
        patientText,
        analysis,
        quantifierShift,
        releaseChannel,
        optionOpener,
        therapistTone,
      }),
    [patientText, analysis, quantifierShift, releaseChannel, optionOpener, therapistTone],
  )

  const beforeOptions = useMemo(() => uniqueList(parseOptionsList(beforeOptionsText)), [beforeOptionsText])
  const afterOptions = useMemo(() => uniqueList(parseOptionsList(afterOptionsText)), [afterOptionsText])

  const beforeSet = useMemo(() => new Set(beforeOptions.map((item) => item.toLowerCase())), [beforeOptions])
  const afterSet = useMemo(() => new Set(afterOptions.map((item) => item.toLowerCase())), [afterOptions])
  const newOptionsAfterRelease = useMemo(
    () => afterOptions.filter((item) => !beforeSet.has(item.toLowerCase())),
    [afterOptions, beforeSet],
  )
  const optionsDropped = useMemo(
    () => beforeOptions.filter((item) => !afterSet.has(item.toLowerCase())),
    [beforeOptions, afterSet],
  )

  const opennessAfterReleaseScore = useMemo(() => {
    const base = 100 - analysis.optionBlindnessScore
    const delta = newOptionsAfterRelease.length * 12 + (includesLooseningLanguage(therapistText) ? 8 : 0)
    return clamp(Math.round(base + delta), 0, 100)
  }, [analysis.optionBlindnessScore, newOptionsAfterRelease.length, therapistText])

  const compactEvaluationMeters = useMemo(
    () => [
      {
        id: 'closure',
        labelHe: 'סגירת תודעה',
        value: analysis.closureScore,
        tone: scoreTone(analysis.closureScore),
      },
      {
        id: 'blindness',
        labelHe: 'עיוורון לאופציות',
        value: analysis.optionBlindnessScore,
        tone: scoreTone(analysis.optionBlindnessScore),
      },
      {
        id: 'opening',
        labelHe: 'פתיחת שדה אחרי שחרור',
        value: opennessAfterReleaseScore,
        tone: scoreTone(100 - opennessAfterReleaseScore),
        positive: true,
      },
    ],
    [analysis.closureScore, analysis.optionBlindnessScore, opennessAfterReleaseScore],
  )

  const fieldPressureScore = useMemo(
    () =>
      clamp(
        Math.round(
          (analysis.closureScore * 0.45 +
            analysis.optionBlindnessScore * 0.35 +
            (100 - opennessAfterReleaseScore) * 0.2),
        ),
        0,
        100,
      ),
    [analysis.closureScore, analysis.optionBlindnessScore, opennessAfterReleaseScore],
  )

  const activeStepIndex = useMemo(
    () => Math.max(0, MINDLAB_MAIN_STEPS.findIndex((step) => step.id === activeStepId)),
    [activeStepId],
  )
  const activeStepMeta = MINDLAB_MAIN_STEPS[activeStepIndex] ?? MINDLAB_MAIN_STEPS[0]
  const overallProgressPercent = useMemo(
    () => clamp(Math.round((completedStepIds.length / MINDLAB_MAIN_STEPS.length) * 100), 0, 100),
    [completedStepIds],
  )
  const mindHistoryItems = useMemo(
    () =>
      (state?.history ?? [])
        .filter((item) => item?.labId === 'mind-liberating-language')
        .slice(0, 12),
    [state],
  )
  const preferredContextIdsForTone = WORK_TONE_TO_CONTEXT_IDS[selectedWorkToneId] ?? ['therapy']
  const miniSimulatorContextStatements = useMemo(
    () =>
      liberatingClientStatements.filter(
        (item) => item?.context === miniSimulatorContextId,
      ),
    [miniSimulatorContextId],
  )
  const miniSimulatorStatement = useMemo(
    () =>
      miniSimulatorContextStatements.find((item) => String(item.id) === String(miniSimulatorStatementId)) ??
      miniSimulatorContextStatements[0] ??
      null,
    [miniSimulatorContextStatements, miniSimulatorStatementId],
  )
  const miniSimulatorExamples = useMemo(
    () => (miniSimulatorStatement?.idealResponses ?? []).slice(0, 4),
    [miniSimulatorStatement],
  )
  const miniSimulatorEvaluation = useMemo(
    () => evaluateMiniSimulatorResponse(miniSimulatorResponse, miniSimulatorStatement?.statement ?? ''),
    [miniSimulatorResponse, miniSimulatorStatement],
  )
  const selectedExercisePattern = useMemo(
    () => liberatingPatterns.find((pattern) => pattern.id === selectedExercisePatternId) ?? liberatingPatterns[0] ?? null,
    [selectedExercisePatternId],
  )
  const exerciseFillCorrect = useMemo(
    () =>
      normalizeText(exerciseFillAnswer).toLowerCase().includes(
        normalizeText(selectedExercisePattern?.fillBlankAnswer).toLowerCase(),
      ),
    [exerciseFillAnswer, selectedExercisePattern],
  )
  const exerciseApplicationScore = useMemo(
    () => evaluateMiniSimulatorResponse(exerciseApplicationText, patientText).score,
    [exerciseApplicationText, patientText],
  )
  const isSoundOn = audioPrefs.enabled && !audioPrefs.muted
  const uiHe = (text) => genderizeUiHe(text, addressGender)
  const g = (masc, fem) => (addressGender === 'fem' ? fem : masc)

  useEffect(() => {
    const preferred = preferredContextIdsForTone[0] ?? 'therapy'
    if (!preferredContextIdsForTone.includes(miniSimulatorContextId)) {
      setMiniSimulatorContextId(preferred)
    }
  }, [preferredContextIdsForTone, miniSimulatorContextId])

  useEffect(() => {
    const statements = miniSimulatorContextStatements
    if (!statements.length) {
      setMiniSimulatorStatementId(null)
      return
    }
    const exists = statements.some((item) => String(item.id) === String(miniSimulatorStatementId))
    if (!exists) {
      const next = randomItem(statements) ?? statements[0]
      setMiniSimulatorStatementId(next?.id ?? null)
    }
  }, [miniSimulatorContextStatements, miniSimulatorStatementId])

  const triggerCompanion = (mood, message) => {
    setCompanionMood(mood)
    if (message) {
      setCompanionMessage(uiHe(message))
    }
    setCompanionPulseKey((current) => current + 1)
  }

  const playCue = (cue) => {
    if (!audioPrefs.enabled) return
    if (typeof window !== 'undefined' && window.__LA_GLOBAL_ALCHEMY_AUDIO__) return
    playWebAudioCue(audioContextRef, cue, audioPrefs.muted)
  }

  const toggleMindlabSound = () => {
    setAudioPrefs((current) => {
      if (!current.enabled) {
        return { ...current, enabled: true, muted: false }
      }
      return { ...current, muted: !current.muted }
    })
    playCue('tap')
    triggerCompanion('happy', isSoundOn ? 'הצלילים הושתקו.' : 'הצלילים חזרו.')
  }

  const handleSelectWorkTone = (toneId) => {
    if (toneId === selectedWorkToneId) return
    const nextTone = MINDLAB_WORK_TONES.find((tone) => tone.id === toneId) ?? MINDLAB_WORK_TONES[0]
    setSelectedWorkToneId(nextTone.id)
    playCue('sparkle')
    triggerCompanion('happy', `טון העבודה הוחלף ל-${nextTone.labelHe}. שומרים על פוקוס.`)
    emitAlchemySignal('success', { message: `טון עבודה: ${nextTone.labelHe}` })
    setStatusMessage(`טון עבודה פעיל: ${nextTone.labelHe} • ${nextTone.subtitleHe}`)
  }

  const applySoundConsent = ({ enabled, dontAskAgain = false }) => {
    setAudioPrefs((current) => ({
      ...current,
      enabled,
      dontAskAgain: current.dontAskAgain || dontAskAgain,
    }))
    setShowSoundConsent(false)
    if (enabled) {
      playCue('sparkle')
      triggerCompanion('happy', 'יופי. המעבדה חיה ועדינה. אפשר להשתיק בכל רגע.')
    } else {
      triggerCompanion('happy', 'מעולה. עובדים בשקט מלא, בלי סאונד.')
    }
  }

  const scrollToStep = (stepId) => {
    const node = stepRefs.current[stepId]
    if (!node) return
    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openStep = (stepId, options = {}) => {
    const { scroll = true } = options
    setActiveStepId(stepId)
    if (scroll) {
      scrollToStep(stepId)
    }
  }

  const jumpToWorkflowStep = (stepId) => {
    if (activeMindTabId !== 'workflow') {
      setActiveMindTabId('workflow')
    }
    setActiveStepId(stepId)
    playCue('tap')
    if (typeof window !== 'undefined') {
      window.setTimeout(() => scrollToStep(stepId), 40)
    }
  }

  const applyExercisePreset = (preset) => {
    if (!preset) return
    setSelectedQuantifierId(preset.quantifierShift.id)
    setSelectedReleaseChannelId(preset.releaseChannel.id)
    setSelectedOptionOpenerId(preset.optionOpener.id)
    setActiveMindTabId('workflow')
    openStep('therapist-script', { scroll: false })
    playCue('whoosh')
    triggerCompanion('happy', `נטען תרגיל: ${preset.titleHe}. עכשיו בונים ניסוח משחרר.`)
    emitAlchemySignal('whoosh', { message: `נטען תרגיל: ${preset.titleHe}` })
    setStatusMessage(`נטען תרגיל: ${preset.titleHe}`)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => scrollToStep('therapist-script'), 40)
    }
  }

  const handleTrainingSignal = (type, payload = {}) => {
    if (type === 'simulator-next-statement' || type === 'pattern-next-statement') {
      playCue('whoosh')
      triggerCompanion('happy', 'נטען תרגול חדש. שים/י לב מה משתנה בניסוח ובתחושה.')
      emitAlchemySignal('whoosh', { message: 'נטען תרגול חדש במעבדת האימון.' })
      return
    }
    if (type === 'simulator-check') {
      if (payload.level === 'great') {
        playCue('harp')
        triggerCompanion('dancing', 'וווו! פתחת את השדה יפה מאוד.')
        emitAlchemySignal('success', { message: 'מעולה! פתחת את השדה יפה מאוד.' })
      } else if (payload.level === 'almost') {
        playCue('sparkle')
        triggerCompanion('surprised', 'כמעט. עוד כיוונון קטן בכימות/יחסים וזו קפיצה.')
        emitAlchemySignal('nearly', { message: 'כמעט. עוד כיוונון קטן בכימות/יחסים.' })
      } else {
        playCue('tap')
        triggerCompanion('happy', 'התחלה טובה. עכשיו בוא/י נוסיף שאלה שמקשרת בין משתנים.')
      }
      return
    }
    if (type === 'simulator-mastery') {
      playCue('gong')
      triggerCompanion('dancing', 'מאסטרי! 5 הצלחות בסימולטור.')
      emitAlchemySignal('mastery', {
        message: 'מאסטרי! 5 הצלחות בסימולטור השיחה המשחררת.',
      })
      return
    }
    if (type === 'pattern-check') {
      if ((payload.score ?? 0) >= 75 && payload.orderCorrect && payload.blankCorrect) {
        playCue('harp')
        triggerCompanion('clap', 'רצף יפה. עכשיו ליישם אותו על משפט חי.')
        emitAlchemySignal('success', { message: 'רצף יפה. עכשיו ליישם אותו על משפט חי.' })
      } else {
        playCue('sparkle')
        triggerCompanion('happy', 'יש בסיס טוב. עוד דיוק קטן בסדר/מילוי והזרימה תתחזק.')
        emitAlchemySignal('nearly', { message: 'יש בסיס טוב. עוד דיוק קטן בסדר/מילוי.' })
      }
      return
    }
    if (type === 'simulator-save' || type === 'pattern-save') {
      playCue('harp')
      triggerCompanion('clap', 'נשמר להיסטוריה. זהב מצטבר.')
      emitAlchemySignal('saved', { message: 'נשמר להיסטוריה. זהב מצטבר.' })
    }
  }

  const handleSwitchMindTab = (tabId) => {
    setActiveMindTabId(tabId)
    playCue('tap')
    if (tabId === 'simulator') {
      triggerCompanion('happy', 'נכנסים לסימולטור. תרגול קצר, פידבק מיידי.')
      return
    }
    if (tabId === 'pattern-master') {
      triggerCompanion('surprised', 'מאסטר רצפים. כאן בונים רצף מדויק של פתיחת שדה.')
      return
    }
    if (tabId === 'history') {
      triggerCompanion('happy', 'היסטוריה היא זהב. כאן רואים למידה לאורך זמן.')
      return
    }
    triggerCompanion('happy', 'חוזרים ל-workflow הראשי: משפט מטופל → שחרור → אופציות.')
  }

  const handleOpenWorkspaceTab = (tabId) => {
    if (tabId === 'simulator') {
      setActiveTrainingToolId('simulator')
    } else if (tabId === 'pattern-master') {
      setActiveTrainingToolId('pattern-master')
    }
    handleSwitchMindTab(tabId)
  }

  const markStepDoneAndAdvance = (stepId) => {
    setCompletedStepIds((current) => (current.includes(stepId) ? current : [...current, stepId]))
    playCue('sparkle')
    const currentIndex = MINDLAB_MAIN_STEPS.findIndex((step) => step.id === stepId)
    const nextStep = MINDLAB_MAIN_STEPS[currentIndex + 1]
    if (nextStep) {
      setActiveStepId(nextStep.id)
      scrollToStep(nextStep.id)
      triggerCompanion('clap', `סוגר/ת שלב ${currentIndex + 1} וממשיך/ה ל-${nextStep.shortLabelHe}.`)
      emitAlchemySignal('success', {
        message: `הושלם שלב ${currentIndex + 1}/${MINDLAB_MAIN_STEPS.length}.`,
      })
      setStatusMessage(`סיימת את ${currentIndex + 1}/${MINDLAB_MAIN_STEPS.length} • ממשיכים ל-${nextStep.shortLabelHe}.`)
      return
    }
    playCue('gong')
    triggerCompanion('dancing', 'סיימת את כל המסלול. השדה כבר נפתח.')
    emitAlchemySignal('mastery', { message: 'סיימת את כל מסלול ה-Mind Liberating.' })
    setStatusMessage('סיימת את כל שלבי העבודה בעמוד. אפשר לשמור להיסטוריה או לחזור ולחדד שלב מסוים.')
  }

  const getStepBadgeText = (stepId) => {
    if (activeStepId === stepId) return 'כאן עכשיו'
    if (completedStepIds.includes(stepId)) return 'הושלם'
    return 'סגור'
  }

  const handleUseGeneratedScript = () => {
    if (!generatedTherapistText) {
      setStatusMessage('הדבק/י קודם משפט מטופל כדי לבנות ניסוח מטפל משחרר.')
      return
    }
    setTherapistText(generatedTherapistText)
    playCue('whoosh')
    triggerCompanion('happy', 'וווו! נבנה ניסוח שמזיז את התודעה ולא רק מסביר.')
    emitAlchemySignal('success', { message: 'נבנה ניסוח מטפל משחרר.' })
    setStatusMessage('נבנה ניסוח מטפל משחרר. אפשר לערוך אותו ידנית.')
  }

  const handleCopyTherapistText = async () => {
    if (!normalizeText(therapistText)) {
      setStatusMessage('אין עדיין טקסט מטפל להעתקה.')
      return
    }
    try {
      await navigator.clipboard.writeText(therapistText)
      playCue('tap')
      emitAlchemySignal('copied', { message: 'טקסט המטפל הועתק ללוח.' })
      setStatusMessage('הטקסט של המטפל הועתק ללוח.')
    } catch {
      setStatusMessage('לא הצלחתי להעתיק ללוח.')
    }
  }

  const handleSaveSession = () => {
    const finalTherapistText = normalizeText(therapistText)
    if (!analysis.text || !finalTherapistText) {
      setStatusMessage('צריך גם טקסט מטופל וגם טקסט מטפל לפני שמירה.')
      return
    }

    upsertHistory({
      id: makeId('mll'),
      labId: lab.id,
      createdAt: new Date().toISOString(),
      summaryHe: `סגירת תודעה ${analysis.closureScore}/100 | עיוורון לאופציות ${analysis.optionBlindnessScore}/100 | אופציות חדשות ${newOptionsAfterRelease.length}`,
      sentenceText: finalTherapistText,
      patientText: analysis.text,
      metrics: {
        closureScore: analysis.closureScore,
        optionBlindnessScore: analysis.optionBlindnessScore,
        opennessAfterReleaseScore,
      },
      beforeOptions,
      afterOptions,
      newlyVisibleOptions: newOptionsAfterRelease,
    })
    playCue('harp')
    triggerCompanion('clap', 'נשמר. אפשר להשוות אחר כך בין גרסאות ולראות את השינוי.')
    emitAlchemySignal('saved', { message: 'הסשן נשמר להיסטוריה.' })
    setStatusMessage('הסשן נשמר להיסטוריה.')
  }

  const handleNewSession = () => {
    setPatientText('')
    setTherapistText('')
    setBeforeOptionsText('')
    setAfterOptionsText('')
    setSelectedQuantifierId(QUANTIFIER_SHIFTS[0].id)
    setSelectedReleaseChannelId(RELEASE_CHANNELS[0].id)
    setSelectedOptionOpenerId(OPTION_OPENERS[0].id)
    setSelectedWorkToneId(MINDLAB_WORK_TONES[0].id)
    setSelectedToneId(THERAPIST_TONES[1].id)
    setActiveTrainingToolId('')
    setActiveMindTabId('simulator')
    setActiveStepId(MINDLAB_MAIN_STEPS[0].id)
    setCompletedStepIds([])
    setMiniSimulatorContextId('therapy')
    setMiniSimulatorStatementId(null)
    setMiniSimulatorResponse('')
    setMiniSimulatorChecked(false)
    setSelectedExercisePatternId(liberatingPatterns[0]?.id ?? '')
    setExerciseFillAnswer('')
    setExerciseFillChecked(false)
    setExerciseApplicationText('')
    setExerciseApplicationChecked(false)
    playCue('whoosh')
    triggerCompanion('happy', 'סשן חדש. מתחילים מהמשפט כמו שהוא.')
    emitAlchemySignal('success', { message: 'נפתחה עבודה חדשה.' })
    setStatusMessage('נפתחה עבודה חדשה.')
    scrollToStep(MINDLAB_MAIN_STEPS[0].id)
  }

  const loadSample = (text) => {
    setPatientText(text)
    setActiveMindTabId('workflow')
    setActiveStepId('patient-source')
    playCue('tap')
    triggerCompanion('surprised', 'מעולה. עכשיו רואים משפט חי מול העיניים, ואפשר להתחיל לשחרר.')
    emitAlchemySignal('success', { message: 'נטענה דוגמת טקסט מטופל.' })
    setStatusMessage('נטענה דוגמת טקסט מטופל. עכשיו בנה/י ניסוח משחרר.')
  }

  const loadPatientTextFromTrainingTool = (text) => {
    setPatientText(text)
    setActiveMindTabId('workflow')
    setActiveStepId('patient-source')
    setCompletedStepIds((current) =>
      current.includes('training-tools') ? current : [...current, 'training-tools'],
    )
    scrollToStep('patient-source')
    playCue('whoosh')
    triggerCompanion('happy', 'המשפט נטען מהתרגול. ממשיכים ממנו לתוך ה-workflow.')
    emitAlchemySignal('whoosh', { message: 'משפט מהמעבדה נטען לתוך ה-workflow הראשי.' })
    setStatusMessage('נטען משפט מטופל מהמעבדה המתקדמת אל המיינד ליברטינג הראשי.')
  }

  const pickMiniSimulatorStatement = () => {
    const pool = miniSimulatorContextStatements
    if (!pool.length) return
    let next = randomItem(pool) ?? pool[0]
    let attempts = 0
    while (pool.length > 1 && String(next?.id) === String(miniSimulatorStatementId) && attempts < 6) {
      next = randomItem(pool) ?? pool[0]
      attempts += 1
    }
    setMiniSimulatorStatementId(next?.id ?? null)
    setMiniSimulatorResponse('')
    setMiniSimulatorChecked(false)
    playCue('whoosh')
    emitAlchemySignal('whoosh', { message: 'נטען משפט חדש לסימולטור.' })
    triggerCompanion('happy', 'משפט חדש. תגובה קצרה, שאלה פותחת, ואז בדיקה.')
  }

  const handleCheckMiniSimulator = () => {
    if (!normalizeText(miniSimulatorResponse)) {
      setStatusMessage('כתבו תגובה קצרה לפני הבדיקה.')
      return
    }
    setMiniSimulatorChecked(true)
    setStatusMessage('')
    handleTrainingSignal('simulator-check', { level: miniSimulatorEvaluation.level, score: miniSimulatorEvaluation.score })
  }

  const handleUseMiniSimulatorStatementInExercises = () => {
    if (!miniSimulatorStatement?.statement) return
    setPatientText(miniSimulatorStatement.statement)
    setActiveMindTabId('workflow')
    setActiveStepId('patient-source')
    setStatusMessage('המשפט נטען מהסימולטור לתרגיל.')
    playCue('tap')
    triggerCompanion('happy', 'המשפט עבר לתרגילים. עכשיו עובדים על פאטרן אחד נקי.')
  }

  const openCleanExercisePattern = (patternId, options = {}) => {
    const { fromPatternMaster = false } = options
    setSelectedExercisePatternId(patternId)
    setExerciseFillAnswer('')
    setExerciseFillChecked(false)
    setExerciseApplicationText('')
    setExerciseApplicationChecked(false)
    setActiveMindTabId('workflow')
    if (fromPatternMaster) {
      playCue('whoosh')
      triggerCompanion('surprised', 'מעולה. עוברים לתרגול נקי של פאטרן אחד.')
    } else {
      playCue('tap')
    }
  }

  const handleCheckCleanExercise = () => {
    const score = clamp(
      Math.round((exerciseFillCorrect ? 45 : 10) + Math.min(55, exerciseApplicationScore * 0.55)),
      0,
      100,
    )
    setExerciseFillChecked(true)
    setExerciseApplicationChecked(true)
    handleTrainingSignal('pattern-check', {
      score,
      orderCorrect: score >= 60,
      blankCorrect: exerciseFillCorrect,
    })
    setStatusMessage(`בדיקה הושלמה • ציון משוער: ${score}/100`)
  }

  return (
    <div className="page-stack mindlab-alchemy-page">
      <div className="mindlab-particles" aria-hidden="true">
        <span className="p-dot p-dot--1" />
        <span className="p-dot p-dot--2" />
        <span className="p-dot p-dot--3" />
        <span className="p-dot p-dot--4" />
        <span className="p-dot p-dot--5" />
        <span className="p-dot p-dot--6" />
      </div>
      <section className="alchemy-card mindlab-dashboard-card">
        <div className="mindlab-dashboard">
          <aside className="mindlab-dashboard__sidebar" aria-label="Mind Liberating Lab sidebar">
            <div className="mindlab-dashboard__sidebarSticky">
              <div className="mindlab-dashboard-logo">
                <div className="mindlab-dashboard-logo__orb" aria-hidden="true">
                  <Sparkles size={16} />
                </div>
                <div className="mindlab-dashboard-logo__text">
                  <strong>Mind Liberating Lab</strong>
                  <span>{activeWorkTone.subtitleHe}</span>
                </div>
              </div>

              <section className="mindlab-sidebar-block" aria-label="בחירת טון">
                <div className="mindlab-sidebar-block__title">בחר טון</div>
                <div className="mindlab-tone-segmented" role="tablist" aria-label="טון עבודה">
                  {MINDLAB_WORK_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedWorkToneId === tone.id}
                      className={`mindlab-tone-segmented__item ${
                        selectedWorkToneId === tone.id ? 'is-active' : ''
                      }`}
                      onClick={() => handleSelectWorkTone(tone.id)}
                    >
                      <span className="mindlab-tone-segmented__emoji" aria-hidden="true">
                        {tone.icon}
                      </span>
                      <span className="mindlab-tone-segmented__label">{tone.labelHe}</span>
                      {tone.id === 'identity-change' ? (
                        <span className="mindlab-tone-segmented__tag">TCU</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <p className="mindlab-tone-segmented__hint">{uiHe(activeWorkTone.lensHe)}</p>
              </section>

              <section className="mindlab-sidebar-block" aria-label="הגדרות פנייה">
                <div className="mindlab-sidebar-block__title">פנייה</div>
                <div className="mindlab-gender-toggle" role="radiogroup" aria-label="פנייה בלשון">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={addressGender === 'masc'}
                    className={`mindlab-gender-toggle__item ${addressGender === 'masc' ? 'is-active' : ''}`}
                    onClick={() => setAddressGender('masc')}
                  >
                    זכר
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={addressGender === 'fem'}
                    className={`mindlab-gender-toggle__item ${addressGender === 'fem' ? 'is-active' : ''}`}
                    onClick={() => setAddressGender('fem')}
                  >
                    נקבה
                  </button>
                </div>
                <p className="mindlab-tone-segmented__hint">
                  {addressGender === 'fem' ? 'הטקסטים מוצגים בלשון נקבה.' : 'הטקסטים מוצגים בלשון זכר.'}
                </p>
              </section>

              <nav className="mindlab-sidebar-nav" aria-label="ניווט">
                {[
                  { id: 'simulator', title: 'Simulator', subtitle: 'סימולטור שיחות', Icon: MessageCircle },
                  { id: 'pattern-master', title: 'Pattern Master', subtitle: 'מאסטר רצפים', Icon: Workflow },
                  { id: 'workflow', title: 'תרגילים', subtitle: '6 פאטרנים + workflow', Icon: Wand2 },
                  { id: 'history', title: 'היסטוריה', subtitle: 'סשנים ותרגולים', Icon: Sparkles },
                ].map(({ id, title, subtitle, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`mindlab-sidebar-nav__item ${activeMindTabId === id ? 'is-active' : ''}`}
                    onClick={() => handleOpenWorkspaceTab(id)}
                    aria-current={activeMindTabId === id ? 'page' : undefined}
                  >
                    <span className="mindlab-sidebar-nav__icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <span className="mindlab-sidebar-nav__copy">
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mindlab-sidebar-actions">
                <button type="button" onClick={handleNewSession}>
                  {uiHe('סשן חדש')}
                </button>
                <Link to="/" className="secondary-link-button">
                  חזרה למסך הכללי
                </Link>
              </div>
            </div>
          </aside>

          <div className="mindlab-dashboard__content">
            <header className="mindlab-dashboard-topbar" aria-label="סרגל עליון">
              <div className="mindlab-dashboard-topbar__progress">
                <div className="mindlab-dashboard-topbar__label">
                  <strong>Progress</strong>
                  <span>
                    {overallProgressPercent}% · שלב {activeStepIndex + 1}/{MINDLAB_MAIN_STEPS.length}
                  </span>
                </div>
                <div className="mindlab-dashboard-topbar__steps" role="list">
                  {MINDLAB_MAIN_STEPS.map((step, index) => {
                    const isActive = activeStepId === step.id
                    const isDone = completedStepIds.includes(step.id)
                    return (
                      <button
                        key={step.id}
                        type="button"
                        role="listitem"
                        className={`mindlab-dashboard-topbar__step ${isActive ? 'is-active' : ''} ${
                          isDone ? 'is-done' : ''
                        }`}
                        onClick={() => jumpToWorkflowStep(step.id)}
                        title={step.titleHe}
                      >
                        <span>{index + 1}</span>
                        <small>{step.shortLabelHe}</small>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mindlab-dashboard-topbar__actions">
                <button
                  type="button"
                  className="mindlab-dashboard-topbar__sound"
                  aria-pressed={isSoundOn}
                  onClick={toggleMindlabSound}
                  title={isSoundOn ? 'השתק צלילים' : 'הפעל צלילים'}
                >
                  {isSoundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                  <span>{isSoundOn ? 'Mute Sound' : 'Unmute Sound'}</span>
                </button>

                <div className="mindlab-dashboard-topbar__companion" aria-live="polite">
                  <span className="mindlab-dashboard-topbar__companionOrb" aria-hidden="true">
                    {alchemistFaceForMood(companionMood)}
                  </span>
                  <div className="mindlab-dashboard-topbar__companionCopy">
                    <strong>Alchemist Companion</strong>
                    <span>
                      {uiHe(companionMessage).length > 74
                        ? `${uiHe(companionMessage).slice(0, 74)}...`
                        : uiHe(companionMessage)}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <section className="panel-card panel-card--soft mindlab-dashboard-hero" aria-live="polite">
              <div className="mindlab-dashboard-hero__head">
                <div>
                  <div className="mindlab-dashboard-hero__eyebrow">{lab.titleHe}</div>
                  <h2>{activeWorkTone.labelHe} · Dashboard אלכימי ממוקד</h2>
                  <p>{uiHe(activeWorkTone.lensHe)}</p>
                </div>
                <div className="mindlab-dashboard-hero__chips">
                  <span className="mindlab-dashboard-chip">טון: {activeWorkTone.labelHe}</span>
                  <span className="mindlab-dashboard-chip">מסך: {activeMindTabId === 'workflow' ? 'תרגילים' : activeMindTabId === 'pattern-master' ? 'מאסטר רצפים' : activeMindTabId === 'history' ? 'היסטוריה' : 'סימולטור'}</span>
                  <span className="mindlab-dashboard-chip">מצב שדה: {analysis.windowLabelHe}</span>
                </div>
              </div>
              <blockquote className="mindlab-quote">
                {analysis.text || uiHe(`הדבק/י ${activeWorkTone.patientInputLabelHe.toLowerCase()} כדי להתחיל.`)}
              </blockquote>
              <div className="status-line" aria-live="polite">
                {uiHe(statusMessage)}
              </div>
            </section>

            <div className="mindlab-main-tabs" role="tablist" aria-label="טאבים ראשיים">
              {[
                { id: 'simulator', labelHe: 'סימולטור שיחות משחררות', Icon: MessageCircle },
                { id: 'pattern-master', labelHe: 'מאסטר רצפים', Icon: Workflow },
                { id: 'workflow', labelHe: 'תרגילים', Icon: Wand2 },
              ].map(({ id, labelHe, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeMindTabId === id}
                  className={`mindlab-main-tabs__item ${activeMindTabId === id ? 'is-active' : ''}`}
                  onClick={() => handleOpenWorkspaceTab(id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{labelHe}</span>
                </button>
              ))}
            </div>

            {activeMindTabId === 'workflow' && (
              <section className="panel-card mindlab-clean-exercises" aria-label="תרגילים נקיים">
                <div className="panel-card__head">
                  <div>
                    <h3>תרגילים · פאטרן אחד בכל פעם</h3>
                    <p>{uiHe('בחר/י פאטרן מהרשימה, פתח/י תרגיל נקי, ועבוד/י רק על מה שחשוב עכשיו.')}</p>
                  </div>
                </div>

                <div className="mindlab-clean-exercises__layout">
                  <aside className="mindlab-clean-exercises__list" aria-label="רשימת פאטרנים">
                    {liberatingPatterns.map((pattern) => (
                      <button
                        key={pattern.id}
                        type="button"
                        className={`mindlab-clean-exercises__item ${
                          selectedExercisePatternId === pattern.id ? 'is-active' : ''
                        }`}
                        onClick={() => openCleanExercisePattern(pattern.id)}
                      >
                        <span className="mindlab-clean-exercises__itemEmoji" aria-hidden="true">
                          {pattern.emoji ?? '✨'}
                        </span>
                        <span className="mindlab-clean-exercises__itemCopy">
                          <strong>{pattern.titleHe}</strong>
                          <small>{pattern.name}</small>
                        </span>
                      </button>
                    ))}
                  </aside>

                  <div className="mindlab-clean-exercises__panel">
                    {selectedExercisePattern ? (
                      <>
                        <div className="mindlab-clean-exercises__header">
                          <div className="mindlab-clean-exercises__title">
                            <span className="mindlab-clean-exercises__heroEmoji" aria-hidden="true">
                              {selectedExercisePattern.emoji ?? '✨'}
                            </span>
                            <div>
                              <h4>{selectedExercisePattern.titleHe}</h4>
                              <p>{selectedExercisePattern.descriptionHe}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              if (miniSimulatorStatement?.statement) {
                                setPatientText(miniSimulatorStatement.statement)
                              }
                            }}
                          >
                            טען משפט מהסימולטור
                          </button>
                        </div>

                        <div className="mindlab-clean-exercises__focusGrid">
                          <div className="mindlab-clean-card">
                            <div className="mindlab-clean-card__eyebrow">משפט מקור לתרגול</div>
                            <textarea
                              rows={4}
                              className="mindlab-textarea"
                              value={patientText}
                              onChange={(event) => {
                                setPatientText(event.target.value)
                                setStatusMessage('')
                              }}
                              placeholder={uiHe(activeWorkTone.patientInputPlaceholderHe)}
                            />
                          </div>

                          <div className="mindlab-clean-card">
                            <div className="mindlab-clean-card__eyebrow">Fill-in מהיר</div>
                            <p className="mindlab-clean-card__prompt">
                              {selectedExercisePattern.fillBlankPrompt}
                            </p>
                            <input
                              className="mindlab-clean-input"
                              value={exerciseFillAnswer}
                              onChange={(event) => {
                                setExerciseFillAnswer(event.target.value)
                                setExerciseFillChecked(false)
                              }}
                              placeholder={g('כתוב את המילה/השלמה', 'כתבי את המילה/השלמה')}
                            />
                            {exerciseFillChecked && (
                              <div
                                className={`mindlab-clean-feedback ${
                                  exerciseFillCorrect ? 'is-good' : 'is-warn'
                                }`}
                              >
                                {exerciseFillCorrect
                                  ? 'יפה. ההשלמה קולעת לרוח הפאטרן.'
                                  : `כיוון מומלץ: ${selectedExercisePattern.fillBlankAnswer}`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mindlab-clean-card">
                          <div className="mindlab-clean-card__eyebrow">יישום על המשפט</div>
                          <p className="mindlab-clean-card__prompt">
                            {g('כתוב תגובה/רצף קצר שמשתמש ברוח הפאטרן על המשפט שנבחר.', 'כתבי תגובה/רצף קצר שמשתמש ברוח הפאטרן על המשפט שנבחר.')}
                          </p>
                          <textarea
                            rows={5}
                            className="mindlab-textarea mindlab-clean-textarea--lg"
                            value={exerciseApplicationText}
                            onChange={(event) => {
                              setExerciseApplicationText(event.target.value)
                              setExerciseApplicationChecked(false)
                            }}
                            placeholder={
                              selectedExercisePattern.example ||
                              g('נסח שאלה/רצף פתיחה קצר.', 'נסחי שאלה/רצף פתיחה קצר.')
                            }
                          />

                          <div className="mindlab-clean-exercises__actions">
                            <button type="button" className="mindlab-big-action" onClick={handleCheckCleanExercise}>
                              <CheckCircle2 size={18} aria-hidden="true" />
                              <span>{g('בדוק תרגיל', 'בדקי תרגיל')}</span>
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => {
                                setExerciseFillAnswer('')
                                setExerciseFillChecked(false)
                                setExerciseApplicationText('')
                                setExerciseApplicationChecked(false)
                              }}
                            >
                              איפוס תרגיל
                            </button>
                          </div>

                          {exerciseApplicationChecked && (
                            <div
                              className={`mindlab-clean-feedback ${
                                exerciseApplicationScore >= 70 ? 'is-good' : 'is-warn'
                              }`}
                            >
                              ציון יישום משוער: {exerciseApplicationScore}/100
                            </div>
                          )}
                        </div>

                        <details className="mindlab-clean-details">
                          <summary>דוגמה + שאלות הפאטרן (ללמוד לפני תרגול)</summary>
                          <div className="mindlab-clean-details__body">
                            <p className="muted-text">{selectedExercisePattern.feedbackHe}</p>
                            <p className="mindlab-clean-card__prompt">{selectedExercisePattern.example}</p>
                            <ul>
                              {(selectedExercisePattern.questions ?? []).map((question) => (
                                <li key={question}>{question}</li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      </>
                    ) : null}
                  </div>
                </div>
              </section>
            )}

            {activeMindTabId === 'workflow' && false && (
        <>
          <section className="panel-card mindlab-exercises-deck" aria-label="6 פאטרנים">
            <div className="panel-card__head">
              <div>
                <h3>תרגילים · 6 פאטרנים גדולים</h3>
                <p>
                  התוכן ממוקד לטון <strong>{activeWorkTone.labelHe}</strong>. טען/י preset אחד ואז המשך/י ל-workflow.
                </p>
              </div>
            </div>

            <div className="mindlab-pattern-grid">
              {exercisePresetCards.map((preset) => {
                const isPresetActive =
                  preset.quantifierShift.id === selectedQuantifierId &&
                  preset.releaseChannel.id === selectedReleaseChannelId &&
                  preset.optionOpener.id === selectedOptionOpenerId
                return (
                  <article
                    key={preset.id}
                    className={`mindlab-pattern-card ${isPresetActive ? 'is-active' : ''}`}
                  >
                    <div className="mindlab-pattern-card__head">
                      <span className="mindlab-pattern-card__icon" aria-hidden="true">
                        {preset.icon}
                      </span>
                      <div>
                        <strong>{preset.titleHe}</strong>
                        <small>{preset.familyHe}</small>
                      </div>
                    </div>

                    <p className="mindlab-pattern-card__summary">{preset.summaryHe}</p>

                    <div className="mindlab-pattern-card__lens">
                      <span>{activeWorkTone.icon}</span>
                      <span>{activeWorkTone.labelHe}: {activeWorkTone.subtitleHe}</span>
                    </div>

                    <div className="mindlab-pattern-card__chips">
                      <span className="mini-pill">{preset.quantifierShift.labelHe}</span>
                      <span className="mini-pill">{preset.releaseChannel.labelHe}</span>
                      <span className="mini-pill">{preset.optionOpener.labelHe}</span>
                    </div>

                    <div className="mindlab-pattern-card__actions">
                      <button type="button" onClick={() => applyExercisePreset(preset)}>
                        טען לתרגיל
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => jumpToWorkflowStep('therapist-script')}
                      >
                        פתח ניסוח
                      </button>
                    </div>

                    <details className="mindlab-pattern-card__details">
                      <summary>רמז מהיר</summary>
                      <p>{preset.exampleHe}</p>
                    </details>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="panel-card panel-card--soft mindlab-dashboard-lesson">
            <MenuSection
              compact
              defaultOpen={false}
              title="לפני שמתחילים"
              subtitle="תזכורת קצרה לשיעור ולכוונת המעבדה"
              badgeText="Guide"
            >
              <LabLessonPrompt labId={lab.id} compact />
            </MenuSection>
          </section>

        <div className="mindlab-layout mindlab-layout--dashboard">
          <div className="mindlab-main">
            <section className="mindlab-stepper" aria-label="התקדמות בשלבי המעבדה">
              <div className="mindlab-stepper__head">
                <div>
                  <div className="mindlab-stepper__eyebrow">מסלול עבודה ממוקד</div>
                  <div className="mindlab-stepper__title">
                    שלב {activeStepIndex + 1}/{MINDLAB_MAIN_STEPS.length} • {activeStepMeta.shortLabelHe}
                  </div>
                </div>
                <button
                  type="button"
                  className="mindlab-stepper__reset"
                  onClick={() => {
                    setCompletedStepIds([])
                    openStep(MINDLAB_MAIN_STEPS[0].id)
                  }}
                >
                  איפוס התקדמות
                </button>
              </div>

              <div className="mindlab-stepper__tube" aria-label="התקדמות כללית">
                <div className="mindlab-stepper__tubeTrack" aria-hidden="true">
                  <span style={{ width: `${overallProgressPercent}%` }} />
                </div>
                <div className="mindlab-stepper__tubeValue">
                  <span>צינור אלכימי</span>
                  <strong>{overallProgressPercent}%</strong>
                </div>
              </div>

              <div className="mindlab-stepper__track" role="list">
                {MINDLAB_MAIN_STEPS.map((step, index) => {
                  const isActive = activeStepId === step.id
                  const isDone = completedStepIds.includes(step.id)
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="listitem"
                      className={`mindlab-stepper__dot ${isActive ? 'is-active' : ''} ${
                        isDone ? 'is-done' : ''
                      }`}
                      onClick={() => openStep(step.id)}
                      aria-current={isActive ? 'step' : undefined}
                      title={`${index + 1}. ${step.shortLabelHe}`}
                    >
                      <span className="mindlab-stepper__dotIndex">{index + 1}</span>
                      <span className="mindlab-stepper__dotLabel">{step.shortLabelHe}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section className="mindlab-focus-strip" aria-live="polite">
              <div className="mindlab-focus-strip__head">
                <div>
                  <div className="mindlab-focus-strip__eyebrow">משפט מטופל פעיל</div>
                  <div className="mindlab-focus-strip__status">
                    <strong>מצב שדה:</strong> {analysis.windowLabelHe}
                  </div>
                </div>
                <div className="mindlab-focus-strip__scores" aria-label="מדדי מצב שדה">
                  <span className="mindlab-focus-strip__score current-step" title={activeStepMeta.titleHe}>
                    עכשיו: {activeStepMeta.shortLabelHe}
                  </span>
                  {compactEvaluationMeters.map((metric) => (
                    <span
                      key={metric.id}
                      className={`mindlab-focus-strip__score tone-${metric.tone} ${
                        metric.positive ? 'is-positive' : ''
                      }`}
                    >
                      {metric.labelHe}: {metric.value}
                    </span>
                  ))}
                </div>
              </div>
              <blockquote className="mindlab-focus-strip__quote">
                {analysis.text || 'הדבק/י כאן משפט מטופל כדי שהמשפט הפעיל יישאר מול העיניים לאורך כל העבודה.'}
              </blockquote>
            </section>

            <section
              ref={(node) => {
                stepRefs.current['patient-source'] = node
              }}
              className={`panel-card mindlab-step-card ${
                activeStepId === 'patient-source' ? 'is-open' : 'is-collapsed'
              } ${completedStepIds.includes('patient-source') ? 'is-done' : ''}`}
            >
              <div className="panel-card__head">
                <div>
                  <h3>1) המשפט שנאמר עכשיו</h3>
                  <p>
                    מתחילים מהטקסט כפי שהוא, בלי לתקן אותו עדיין. כרגע עובדים בטון{' '}
                    <strong>{activeWorkTone.labelHe}</strong>.
                  </p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'patient-source' ? 'is-active' : ''}`}>
                    {getStepBadgeText('patient-source')}
                  </span>
                  <button type="button" onClick={() => openStep('patient-source')}>
                    {activeStepId === 'patient-source' ? 'פתוח עכשיו' : 'פתח תרגיל'}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => markStepDoneAndAdvance('patient-source')}>
                    סיימתי → סגור והמשך
                  </button>
                </div>
              </div>

              <label className="mindlab-field">
                <span>{activeWorkTone.patientInputLabelHe}</span>
                <textarea
                  rows={4}
                  className="mindlab-textarea"
                  value={patientText}
                  onChange={(event) => {
                    setPatientText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder={activeWorkTone.patientInputPlaceholderHe}
                />
              </label>

              <div className="chip-bank">
                <h4>דוגמאות מהירות</h4>
                <div className="chips-wrap">
                  {(activeWorkTone.sampleTexts ?? SAMPLE_PATIENT_TEXTS).map((sample) => (
                    <button key={sample} type="button" className="chip" onClick={() => loadSample(sample)}>
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section
              ref={(node) => {
                stepRefs.current['therapist-script'] = node
              }}
              className={`panel-card mindlab-step-card ${
                activeStepId === 'therapist-script' ? 'is-open' : 'is-collapsed'
              } ${completedStepIds.includes('therapist-script') ? 'is-done' : ''}`}
            >
              <div className="panel-card__head">
                <div>
                  <h3>2) ניסוח משחרר שמזיז תודעה</h3>
                  <p>בונים ניסוח שמכבד את החוויה, אבל פותח שדה ואפשרויות בטון שנבחר.</p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'therapist-script' ? 'is-active' : ''}`}>
                    {getStepBadgeText('therapist-script')}
                  </span>
                  <button type="button" onClick={() => openStep('therapist-script')}>
                    {activeStepId === 'therapist-script' ? 'פתוח עכשיו' : 'פתח תרגיל'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('therapist-script')}
                  >
                    סיימתי → סגור והמשך
                  </button>
                </div>
              </div>

              <div className="mindlab-prompt-grid">
                <div className="chip-bank">
                  <h4>אופן הובלה (בתוך הטון הנבחר)</h4>
                  <div className="chips-wrap">
                    {THERAPIST_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        className={`chip ${selectedToneId === tone.id ? 'chip--selected' : ''}`}
                        onClick={() => setSelectedToneId(tone.id)}
                        aria-pressed={selectedToneId === tone.id}
                      >
                        {tone.labelHe}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chip-bank">
                  <h4>שחרור כימות / נעילה</h4>
                  <div className="chips-wrap">
                    {QUANTIFIER_SHIFTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`chip ${selectedQuantifierId === item.id ? 'chip--selected' : ''}`}
                        onClick={() => setSelectedQuantifierId(item.id)}
                        aria-pressed={selectedQuantifierId === item.id}
                      >
                        {item.labelHe}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chip-bank">
                  <h4>ערוץ הרחבה (זמן/מרחב/גוף/משמעות)</h4>
                  <div className="chips-wrap">
                    {RELEASE_CHANNELS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`chip ${selectedReleaseChannelId === item.id ? 'chip--selected' : ''}`}
                        onClick={() => setSelectedReleaseChannelId(item.id)}
                        aria-pressed={selectedReleaseChannelId === item.id}
                      >
                        {item.labelHe}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chip-bank">
                  <h4>שאלת פתיחת אופציות</h4>
                  <div className="chips-wrap">
                    {OPTION_OPENERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`chip ${selectedOptionOpenerId === item.id ? 'chip--selected' : ''}`}
                        onClick={() => setSelectedOptionOpenerId(item.id)}
                        aria-pressed={selectedOptionOpenerId === item.id}
                      >
                        {item.labelHe}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mindlab-script-preview">
                <div className="mindlab-script-preview__head">
                  <strong>טיוטת ניסוח מטפל (מוצעת)</strong>
                  <button type="button" onClick={handleUseGeneratedScript}>
                    בנה ניסוח מוצע
                  </button>
                </div>
                <p>{generatedTherapistText || 'הדבק/י טקסט מטופל כדי לקבל טיוטה.'}</p>
              </div>

              <label className="mindlab-field">
                <span>ניסוח משחרר סופי (ניתן לעריכה)</span>
                <textarea
                  rows={6}
                  className="mindlab-textarea"
                  value={therapistText}
                  onChange={(event) => {
                    setTherapistText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder="הניסוח שמכבד את החוויה, מרכך נעילה ומזמין אפשרויות."
                />
              </label>

              <div className="controls-row">
                <button type="button" onClick={handleCopyTherapistText}>
                  העתק טקסט מטפל
                </button>
                <button type="button" onClick={handleSaveSession}>
                  שמור להיסטוריה
                </button>
              </div>
            </section>

            <section
              ref={(node) => {
                stepRefs.current['options-shift'] = node
              }}
              className={`panel-card mindlab-step-card ${
                activeStepId === 'options-shift' ? 'is-open' : 'is-collapsed'
              } ${completedStepIds.includes('options-shift') ? 'is-done' : ''}`}
            >
              <div className="panel-card__head">
                <div>
                  <h3>3) אילו אופציות לא נראו קודם, ואילו נפתחו אחרי השחרור</h3>
                  <p>זה הלב של העבודה: לא רק “ניסוח יפה”, אלא שינוי במה שהמטופל מוכן לראות.</p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'options-shift' ? 'is-active' : ''}`}>
                    {getStepBadgeText('options-shift')}
                  </span>
                  <button type="button" onClick={() => openStep('options-shift')}>
                    {activeStepId === 'options-shift' ? 'פתוח עכשיו' : 'פתח תרגיל'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('options-shift')}
                  >
                    סיימתי → סגור והמשך
                  </button>
                </div>
              </div>

              <div className="mindlab-options-grid">
                <label className="mindlab-field">
                  <span>לפני השחרור: אילו אופציות המטופל לא רואה / פוסל מיד?</span>
                  <textarea
                    rows={5}
                    className="mindlab-textarea"
                    value={beforeOptionsText}
                    onChange={(event) => setBeforeOptionsText(event.target.value)}
                    placeholder={'שורה לכל אופציה, למשל:\nלבקש עזרה\nלדחות החלטה ביום\nלעשות גרסה חלקית'}
                  />
                </label>

                <label className="mindlab-field">
                  <span>אחרי השחרור: אילו אופציות הוא פתאום מסכים לראות / לשקול?</span>
                  <textarea
                    rows={5}
                    className="mindlab-textarea"
                    value={afterOptionsText}
                    onChange={(event) => setAfterOptionsText(event.target.value)}
                    placeholder={'שורה לכל אופציה, למשל:\nלבדוק חריגים\nלבקש תיאום ציפיות\nלנסות צעד קטן אחד'}
                  />
                </label>
              </div>

              <div className="mindlab-delta-grid">
                <div className="mini-card">
                  <h4>לפני השחרור</h4>
                  <p>{beforeOptions.length} אופציות מזוהות</p>
                  <ul>
                    {beforeOptions.slice(0, 6).map((item) => (
                      <li key={`before-${item}`}>{item}</li>
                    ))}
                    {!beforeOptions.length && <li>עדיין לא הוזנו אופציות.</li>}
                  </ul>
                </div>
                <div className="mini-card">
                  <h4>אחרי השחרור</h4>
                  <p>{afterOptions.length} אופציות מזוהות</p>
                  <ul>
                    {afterOptions.slice(0, 6).map((item) => (
                      <li key={`after-${item}`}>{item}</li>
                    ))}
                    {!afterOptions.length && <li>עדיין לא הוזנו אופציות.</li>}
                  </ul>
                </div>
                <div className="mini-card">
                  <h4>מה נפתח</h4>
                  <p>אופציות חדשות שנוספו: {newOptionsAfterRelease.length}</p>
                  <ul>
                    {newOptionsAfterRelease.slice(0, 6).map((item) => (
                      <li key={`new-${item}`}>{item}</li>
                    ))}
                    {!newOptionsAfterRelease.length && <li>עדיין אין אופציות חדשות מסומנות.</li>}
                  </ul>
                  {optionsDropped.length > 0 && (
                    <p className="muted-text">אופציות שהוסרו/פחות רלוונטיות: {optionsDropped.join(', ')}</p>
                  )}
                </div>
              </div>
            </section>

            <section
              ref={(node) => {
                stepRefs.current['training-tools'] = node
              }}
              className={`panel-card panel-card--soft mindlab-step-card ${
                activeStepId === 'training-tools' ? 'is-open' : 'is-collapsed'
              } ${completedStepIds.includes('training-tools') ? 'is-done' : ''}`}
            >
              <div className="panel-card__head">
                <div>
                  <h3>4) מעבדות אימון מתקדמות</h3>
                  <p>
                    תרגול "על יבש" של שפה משחררת: בוחרים הקשר, מקבלים משפט, ובונים תגובה/רצף עם פידבק מיידי.
                  </p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'training-tools' ? 'is-active' : ''}`}>
                    {getStepBadgeText('training-tools')}
                  </span>
                  <button type="button" onClick={() => openStep('training-tools')}>
                    {activeStepId === 'training-tools' ? 'פתוח עכשיו' : 'פתח תרגיל'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('training-tools')}
                  >
                    סיימתי שלב תרגול
                  </button>
                </div>
              </div>

              <div className="mindlab-training-grid">
                <button
                  type="button"
                  className={`mindlab-training-card ${
                    activeTrainingToolId === 'simulator' ? 'is-active' : ''
                  }`}
                  onClick={() =>
                    setActiveTrainingToolId((current) => {
                      const next = current === 'simulator' ? '' : 'simulator'
                      if (next) {
                        handleSwitchMindTab('simulator')
                      }
                      return next
                    })
                  }
                  aria-pressed={activeTrainingToolId === 'simulator'}
                >
                  <div className="mindlab-training-card__icon">
                    <MessageCircle size={20} aria-hidden="true" />
                  </div>
                  <div className="mindlab-training-card__content">
                    <strong>סימולטור שיחות משחררות</strong>
                    <small>Mind Liberating Conversation Simulator</small>
                    <span>משפט מטופל רנדומלי + תגובת מטפל + בדיקה + דוגמאות אידיאליות</span>
                  </div>
                  <Sparkles size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`mindlab-training-card ${
                    activeTrainingToolId === 'pattern-master' ? 'is-active' : ''
                  }`}
                  onClick={() =>
                    setActiveTrainingToolId((current) => {
                      const next = current === 'pattern-master' ? '' : 'pattern-master'
                      if (next) {
                        handleSwitchMindTab('pattern-master')
                      }
                      return next
                    })
                  }
                  aria-pressed={activeTrainingToolId === 'pattern-master'}
                >
                  <div className="mindlab-training-card__icon">
                    <Workflow size={20} aria-hidden="true" />
                  </div>
                  <div className="mindlab-training-card__content">
                    <strong>מאסטר רצפים</strong>
                    <small>Pattern Sequence Master</small>
                    <span>פאטרנים, flowchart, fill-in-blanks, סדר רצף ויישום על משפט רנדומלי</span>
                  </div>
                  <Sparkles size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="mindlab-training-panel mindlab-training-panel--launcher">
                <p className="muted-text">
                  התרגול המלא נפתח עכשיו בטאבים העליונים כדי לשמור את זרימת העבודה קצרה וממוקדת.
                </p>
                <div className="controls-row">
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchMindTab('simulator')
                      setActiveTrainingToolId('simulator')
                    }}
                  >
                    פתח סימולטור בטאב נפרד
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      handleSwitchMindTab('pattern-master')
                      setActiveTrainingToolId('pattern-master')
                    }}
                  >
                    פתח מאסטר רצפים בטאב נפרד
                  </button>
                </div>
              </div>
            </section>

            <div className="status-line" aria-live="polite">
              {statusMessage}
            </div>
          </div>

          <aside className="mindlab-rail">
            <div className="mindlab-rail__sticky">
              <section className="panel-card panel-card--soft">
                <div className="panel-card__head">
                  <h3>מה המטופל אומר עכשיו</h3>
                </div>
                <blockquote className="mindlab-quote">
                  {analysis.text || 'הדבק/י כאן משפט מטופל כדי לנתח את רמת הסגירה.'}
                </blockquote>
              </section>

              <section className="panel-card">
                <div className="panel-card__head">
                  <div>
                    <h3>מה חשוב לראות כאן</h3>
                    <p>לא רק התוכן, אלא כמה התודעה סגורה וכמה אופציות נעלמות.</p>
                  </div>
                </div>

                <div className="mindlab-eval-compact">
                  <div className="mindlab-eval-compact__barCard" aria-label="מד שדה קומפקטי">
                    <div className="mindlab-eval-compact__barLabels">
                      <span>סגור</span>
                      <span>פתוח</span>
                    </div>
                    <div className="mindlab-eval-compact__fieldBar" aria-hidden="true">
                      <div
                        className="mindlab-eval-compact__fieldFill"
                        style={{ height: `${fieldPressureScore}%` }}
                      />
                    </div>
                    <div className="mindlab-eval-compact__barValue">{fieldPressureScore}/100</div>
                  </div>

                  <div className="mindlab-eval-compact__meters" role="list" aria-label="מדדי אבחון">
                    {compactEvaluationMeters.map((metric) => (
                      <div
                        key={metric.id}
                        className={`mindlab-eval-meter tone-${metric.tone} ${
                          metric.positive ? 'is-positive' : ''
                        }`}
                        role="listitem"
                      >
                        <div className="mindlab-eval-meter__head">
                          <span>{metric.labelHe}</span>
                          <strong>{metric.value}/100</strong>
                        </div>
                        <div className="mindlab-eval-meter__track" aria-hidden="true">
                          <span style={{ width: `${metric.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="callout-line">
                  <strong>מצב שדה:</strong> {analysis.windowLabelHe}
                </div>
                <p className="muted-text">{analysis.summaryHe}</p>

                <MenuSection
                  compact
                  className="mindlab-detail-menu"
                  title="אבחון מפורט"
                  subtitle="דפוסי סגירה, ניצני פתיחה וכיווני שחרור"
                  badgeText={`${
                    analysis.detectedClosures.length +
                    analysis.detectedOpenings.length +
                    analysis.releaseHintsHe.length
                  }`}
                >
                  <div className="mindlab-chip-lists">
                    <div className="chip-bank">
                      <h4>דפוסי סגירה שזוהו</h4>
                      <div className="chips-wrap">
                        {analysis.detectedClosures.length ? (
                          analysis.detectedClosures.map((item) => (
                            <span key={item.id} className="chip chip--selected">
                              {item.labelHe} ({item.count})
                            </span>
                          ))
                        ) : (
                          <span className="chip">לא זוהו דפוסי סגירה מובהקים</span>
                        )}
                      </div>
                    </div>

                    <div className="chip-bank">
                      <h4>ניצני פתיחה שכבר קיימים</h4>
                      <div className="chips-wrap">
                        {analysis.detectedOpenings.length ? (
                          analysis.detectedOpenings.map((item) => (
                            <span key={item.labelHe} className="chip">
                              {item.labelHe} ({item.count})
                            </span>
                          ))
                        ) : (
                          <span className="chip">כמעט אין כרגע שפה פותחת</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mindlab-hints">
                    <h4>כיווני שחרור מומלצים</h4>
                    <ul>
                      {analysis.releaseHintsHe.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                </MenuSection>
              </section>

              <section className="panel-card panel-card--soft">
                <MenuSection
                  compact
                  defaultOpen={false}
                  className="mindlab-detail-menu"
                  title="מה המטופל מסכים לראות אחרי השחרור"
                  subtitle="אופציות חדשות שהופכות מ'לא רלוונטי' ל'אפשר לשקול'"
                  badgeText={`${newOptionsAfterRelease.length}`}
                >
                  <p className="muted-text">
                    כאן אתה מודד/ת שינוי תודעתי בפועל: אילו אופציות נעשות “אפשר לשקול”.
                  </p>
                  <div className="mindlab-consent-list">
                    {newOptionsAfterRelease.length ? (
                      newOptionsAfterRelease.map((item) => (
                        <div key={item} className="mini-pill">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="mini-pill">עדיין לא סומנו אופציות חדשות</div>
                    )}
                  </div>
                </MenuSection>
              </section>
            </div>
          </aside>
        </div>
        </>
        )}

        {activeMindTabId === 'simulator' && (
          <section className="panel-card mindlab-workspace-panel mindlab-clean-simulator">
            <div className="panel-card__head">
              <div>
                <h3>סימולטור שיחות משחררות</h3>
                <p>{uiHe(activeWorkTone.simulatorIntroHe)}</p>
              </div>
            </div>

            <div className="mindlab-clean-simulator__toolbar">
              <div className="mindlab-clean-simulator__contexts" role="tablist" aria-label="הקשר סימולטור">
                {preferredContextIdsForTone.map((contextId) => {
                  const label =
                    liberatingClientStatements.find((item) => item.context === contextId)?.context ?? contextId
                  return (
                    <button
                      key={contextId}
                      type="button"
                      role="tab"
                      aria-selected={miniSimulatorContextId === contextId}
                      className={`chip ${miniSimulatorContextId === contextId ? 'chip--selected' : ''}`}
                      onClick={() => {
                        setMiniSimulatorContextId(contextId)
                        setMiniSimulatorResponse('')
                        setMiniSimulatorChecked(false)
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="mindlab-clean-simulator__toolbarActions">
                <button type="button" className="secondary-button" onClick={pickMiniSimulatorStatement}>
                  <Shuffle size={16} aria-hidden="true" />
                  <span>משפט חדש</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleUseMiniSimulatorStatementInExercises}
                  disabled={!miniSimulatorStatement?.statement}
                >
                  <Target size={16} aria-hidden="true" />
                  <span>טען לתרגילים</span>
                </button>
              </div>
            </div>

            <div className="mindlab-clean-simulator__statement" aria-live="polite">
              <div className="mindlab-clean-simulator__statementLabel">{uiHe(activeWorkTone.patientInputLabelHe)}</div>
              <blockquote>{miniSimulatorStatement?.statement || 'לא נמצא משפט בהקשר הזה כרגע.'}</blockquote>
            </div>

            <label className="mindlab-field">
              <span>{g('התגובה המשחררת שלך', 'התגובה המשחררת שלך')}</span>
              <textarea
                rows={7}
                className="mindlab-textarea mindlab-clean-textarea--xl"
                value={miniSimulatorResponse}
                onChange={(event) => {
                  setMiniSimulatorResponse(event.target.value)
                  setMiniSimulatorChecked(false)
                }}
                placeholder={uiHe('כתוב/כתבי כאן שאלה פותחת שמכבדת את החוויה ומזיזה תודעה...')}
              />
            </label>

            <div className="mindlab-clean-simulator__actions">
              <button type="button" className="mindlab-big-action" onClick={handleCheckMiniSimulator}>
                <CheckCircle2 size={20} aria-hidden="true" />
                <span>{g('בדוק תגובה', 'בדקי תגובה')}</span>
              </button>
            </div>

            {miniSimulatorChecked && (
              <section className="mindlab-clean-simulator__result" aria-live="polite">
                <div className="mindlab-clean-simulator__resultHead">
                  <strong>
                    {miniSimulatorEvaluation.labelHe} · {miniSimulatorEvaluation.score}/100
                  </strong>
                </div>
                <ul>
                  {miniSimulatorEvaluation.feedbackHe.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            )}

            <details className="mindlab-clean-details">
              <summary>דוגמאות תגובה (3-4) + השראה</summary>
              <div className="mindlab-clean-details__body">
                {miniSimulatorExamples.length ? (
                  <div className="mindlab-clean-simulator__examples">
                    {miniSimulatorExamples.map((example, index) => (
                      <article key={`${example.pattern}-${index}`} className="mindlab-clean-simulator__example">
                        <strong>{example.pattern}</strong>
                        <p>{example.response}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">{g('אין דוגמאות מוכנות למשפט הזה, נסה משפט חדש.', 'אין דוגמאות מוכנות למשפט הזה, נסי משפט חדש.')}</p>
                )}
              </div>
            </details>

            <details className="mindlab-clean-details">
              <summary>מצב מתקדם (הסימולטור המלא)</summary>
              <div className="mindlab-clean-details__body">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAdvancedSimulator((current) => !current)}
                >
                  {showAdvancedSimulator ? 'הסתר סימולטור מלא' : 'פתח סימולטור מלא'}
                </button>
                {showAdvancedSimulator && (
                  <div className="mindlab-clean-advanced">
                    <LiberatingConversationSimulator
                      onLoadPatientText={loadPatientTextFromTrainingTool}
                      onSignal={handleTrainingSignal}
                    />
                  </div>
                )}
              </div>
            </details>
          </section>
        )}

        {activeMindTabId === 'pattern-master' && (
          <section className="panel-card mindlab-workspace-panel mindlab-clean-pattern-master">
            <div className="panel-card__head">
              <div>
                <h3>מאסטר רצפים</h3>
                <p>{activeWorkTone.patternIntroHe}</p>
              </div>
            </div>

            <div className="mindlab-sequence-grid" role="list" aria-label="פאטרני רצף">
              {liberatingPatterns.map((pattern) => (
                <article key={pattern.id} className="mindlab-sequence-card" role="listitem">
                  <div className="mindlab-sequence-card__hero" aria-hidden="true">
                    <span>{pattern.emoji ?? '✨'}</span>
                  </div>
                  <div className="mindlab-sequence-card__copy">
                    <strong>{pattern.titleHe}</strong>
                    <small>{pattern.name}</small>
                    <p>{pattern.descriptionHe}</p>
                  </div>
                  <div className="mindlab-sequence-card__actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSelectedExercisePatternId(pattern.id)
                        setExerciseFillAnswer('')
                        setExerciseApplicationText('')
                        setExerciseFillChecked(false)
                        setExerciseApplicationChecked(false)
                      }}
                    >
                      {g('לחץ ללמוד', 'לחצי ללמוד')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openCleanExercisePattern(pattern.id, { fromPatternMaster: true })}
                    >
                      {g('לחץ לתרגל', 'לחצי לתרגל')}
                    </button>
                  </div>
                  <details className="mindlab-sequence-card__details">
                    <summary>תצוגת לימוד מהירה</summary>
                    <div className="mindlab-sequence-card__detailsBody">
                      <p className="muted-text">{pattern.feedbackHe}</p>
                      <p>{pattern.example}</p>
                      <ul>
                        {(pattern.questions ?? []).slice(0, 4).map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </article>
              ))}
            </div>

            <details className="mindlab-clean-details">
              <summary>מצב מתקדם (Pattern Sequence Master המלא)</summary>
              <div className="mindlab-clean-details__body">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAdvancedPatternMaster((current) => !current)}
                >
                  {showAdvancedPatternMaster ? 'הסתר מצב מתקדם' : 'פתח מצב מתקדם'}
                </button>
                {showAdvancedPatternMaster && (
                  <div className="mindlab-clean-advanced">
                    <PatternSequenceMaster
                      onLoadPatientText={loadPatientTextFromTrainingTool}
                      onSignal={handleTrainingSignal}
                    />
                  </div>
                )}
              </div>
            </details>
          </section>
        )}

        {activeMindTabId === 'history' && (
          <section className="panel-card mindlab-workspace-panel">
            <div className="panel-card__head">
              <div>
                <h3>היסטוריה - Mind Liberating</h3>
                <p>דוגמאות, רצפים וסשנים שנשמרו תחת מעבדת שחרור התודעה (לכל הטונים).</p>
              </div>
              <div className="alchemy-card__actions">
                <Link to="/library" className="secondary-link-button">
                  פתח ספרייה מלאה
                </Link>
              </div>
            </div>

            <div className="mindlab-history-list">
              {mindHistoryItems.length ? (
                mindHistoryItems.map((item) => (
                  <article key={item.id} className="mindlab-history-item">
                    <div className="mindlab-history-item__head">
                      <strong>{item.summaryHe ?? 'פריט היסטוריה'}</strong>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString('he-IL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </time>
                    </div>
                    {item.patientText ? <p className="mindlab-history-item__patient">משפט מקור: {item.patientText}</p> : null}
                    {item.sentenceText ? <p className="mindlab-history-item__response">תגובה/רצף: {item.sentenceText}</p> : null}
                    <div className="mindlab-history-item__actions">
                      {item.patientText ? (
                        <button type="button" onClick={() => loadPatientTextFromTrainingTool(item.patientText)}>
                          טען משפט לזרימת העבודה
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel-card panel-card--soft">
                  <p className="muted-text">
                    {uiHe('עדיין אין פריטים בהיסטוריה של מעבדה זו. שמור/י סשן, דוגמה מהסימולטור או רצף מהמאסטר.')}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
          </div>
        </div>
      </section>

      {showSoundConsent && (
        <div className="mindlab-sound-consent" role="dialog" aria-modal="true" aria-label="הפעלת צלילים במעבדה">
          <div className="mindlab-sound-consent__card">
            <h3>להפעיל צלילים קסומים של המעבדה?</h3>
            <p>
              מוזיקת ambient עדינה + צלילי פעולה קלים (sparkle / whoosh / harp).
              אפשר להשתיק בכל רגע.
            </p>
            <div className="mindlab-sound-consent__actions">
              <button type="button" onClick={() => applySoundConsent({ enabled: true })}>
                כן, תפעיל
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => applySoundConsent({ enabled: false })}
              >
                לא עכשיו
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => applySoundConsent({ enabled: false, dontAskAgain: true })}
              >
                אל תשאל שוב
              </button>
            </div>
          </div>
        </div>
      )}

      <AlchemistCompanion mood={companionMood} message={uiHe(companionMessage)} pulseKey={companionPulseKey} />
    </div>
  )
}

