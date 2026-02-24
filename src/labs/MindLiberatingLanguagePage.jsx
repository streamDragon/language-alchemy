import { useEffect, useMemo, useState } from 'react'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'
import { makeId } from '../utils/ids'
import LabLessonPrompt from '../components/layout/LabLessonPrompt'

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
]

const THERAPIST_TONES = [
  { id: 'grounded', labelHe: 'קרקעי / יציב', openerHe: 'אני שומע/ת אותך, וחשוב לי שנדייק רגע את מה שקורה כאן.' },
  { id: 'soft', labelHe: 'רך / אמפתי', openerHe: 'אני איתך בזה, ובוא ננסה לפתוח כאן קצת יותר מרחב בלי לבטל את מה שאתה מרגיש.' },
  { id: 'direct', labelHe: 'ישיר / מוביל', openerHe: 'בוא נעצור רגע ונבדוק אם הניסוח הנוכחי סוגר לך אפשרויות שכרגע עוד לא ראינו.' },
]

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

export default function MindLiberatingLanguagePage() {
  const lab = getLabConfig('mind-liberating-language') ?? {
    id: 'mind-liberating-language',
    titleHe: 'מיינד ליברייטינג שפה',
    descriptionHe: 'טקסט מטופל → שחרור תודעתי → אופציות חדשות',
  }
  const { upsertHistory, setLastVisitedLab } = useAppState()

  const [patientText, setPatientText] = useState('')
  const [selectedQuantifierId, setSelectedQuantifierId] = useState(QUANTIFIER_SHIFTS[0].id)
  const [selectedReleaseChannelId, setSelectedReleaseChannelId] = useState(RELEASE_CHANNELS[0].id)
  const [selectedOptionOpenerId, setSelectedOptionOpenerId] = useState(OPTION_OPENERS[0].id)
  const [selectedToneId, setSelectedToneId] = useState(THERAPIST_TONES[1].id)
  const [therapistText, setTherapistText] = useState('')
  const [beforeOptionsText, setBeforeOptionsText] = useState('')
  const [afterOptionsText, setAfterOptionsText] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setLastVisitedLab(lab.id)
  }, [lab.id, setLastVisitedLab])

  const analysis = useMemo(() => analyzePatientText(patientText), [patientText])
  const quantifierShift =
    QUANTIFIER_SHIFTS.find((item) => item.id === selectedQuantifierId) ?? QUANTIFIER_SHIFTS[0]
  const releaseChannel =
    RELEASE_CHANNELS.find((item) => item.id === selectedReleaseChannelId) ?? RELEASE_CHANNELS[0]
  const optionOpener =
    OPTION_OPENERS.find((item) => item.id === selectedOptionOpenerId) ?? OPTION_OPENERS[0]
  const therapistTone =
    THERAPIST_TONES.find((item) => item.id === selectedToneId) ?? THERAPIST_TONES[0]

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

  const handleUseGeneratedScript = () => {
    if (!generatedTherapistText) {
      setStatusMessage('הדבק/י קודם משפט מטופל כדי לבנות ניסוח מטפל משחרר.')
      return
    }
    setTherapistText(generatedTherapistText)
    setStatusMessage('נבנה ניסוח מטפל משחרר. אפשר לערוך אותו ידנית.')
  }

  const handleCopyTherapistText = async () => {
    if (!normalizeText(therapistText)) {
      setStatusMessage('אין עדיין טקסט מטפל להעתקה.')
      return
    }
    try {
      await navigator.clipboard.writeText(therapistText)
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
    setSelectedToneId(THERAPIST_TONES[1].id)
    setStatusMessage('נפתחה עבודה חדשה.')
  }

  const loadSample = (text) => {
    setPatientText(text)
    setStatusMessage('נטענה דוגמת טקסט מטופל. עכשיו בנה/י ניסוח משחרר.')
  }

  return (
    <div className="page-stack">
      <section className="alchemy-card">
        <div className="alchemy-card__head">
          <div>
            <h2>{lab.titleHe}</h2>
            <p>{lab.descriptionHe}</p>
          </div>
          <div className="alchemy-card__actions">
            <button type="button" onClick={handleNewSession}>
              סשן חדש
            </button>
          </div>
        </div>

        <LabLessonPrompt labId={lab.id} />

        <div className="mindlab-layout">
          <div className="mindlab-main">
            <section className="panel-card">
              <div className="panel-card__head">
                <div>
                  <h3>1) מה המטופל אומר</h3>
                  <p>מתחילים מהטקסט כפי שהוא, בלי לתקן אותו עדיין.</p>
                </div>
              </div>

              <label className="mindlab-field">
                <span>טקסט מטופל (מקורי)</span>
                <textarea
                  rows={4}
                  className="mindlab-textarea"
                  value={patientText}
                  onChange={(event) => {
                    setPatientText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder="לדוגמה: 'אני תמיד נתקע, אין לי דרך אחרת, זה פשוט לא אני...'"
                />
              </label>

              <div className="chip-bank">
                <h4>דוגמאות מהירות</h4>
                <div className="chips-wrap">
                  {SAMPLE_PATIENT_TEXTS.map((sample) => (
                    <button key={sample} type="button" className="chip" onClick={() => loadSample(sample)}>
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card__head">
                <div>
                  <h3>2) טקסט מטפל שמזיז תודעה</h3>
                  <p>בונים ניסוח שמכבד את החוויה, אבל פותח שדה ואפשרויות.</p>
                </div>
              </div>

              <div className="mindlab-prompt-grid">
                <div className="chip-bank">
                  <h4>טון מטפל</h4>
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
                <span>טקסט מטפל סופי (ניתן לעריכה)</span>
                <textarea
                  rows={6}
                  className="mindlab-textarea"
                  value={therapistText}
                  onChange={(event) => {
                    setTherapistText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder="הטקסט שהמטפל בונה כדי להזיז את התודעה, לפתוח שדה ולהזמין אופציות."
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

            <section className="panel-card">
              <div className="panel-card__head">
                <div>
                  <h3>3) אילו אופציות לא נראו קודם, ואילו נפתחו אחרי השחרור</h3>
                  <p>זה הלב של העבודה: לא רק “ניסוח יפה”, אלא שינוי במה שהמטופל מוכן לראות.</p>
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

                <div className="mindlab-score-grid">
                  <div className={`mindlab-score-card tone-${scoreTone(analysis.closureScore)}`}>
                    <div className="mindlab-score-card__label">סגירת תודעה</div>
                    <div className="mindlab-score-card__value">{analysis.closureScore}/100</div>
                    <div className="mindlab-bar">
                      <span style={{ width: `${analysis.closureScore}%` }} />
                    </div>
                  </div>

                  <div className={`mindlab-score-card tone-${scoreTone(analysis.optionBlindnessScore)}`}>
                    <div className="mindlab-score-card__label">עיוורון לאופציות</div>
                    <div className="mindlab-score-card__value">{analysis.optionBlindnessScore}/100</div>
                    <div className="mindlab-bar">
                      <span style={{ width: `${analysis.optionBlindnessScore}%` }} />
                    </div>
                  </div>

                  <div className={`mindlab-score-card tone-${scoreTone(opennessAfterReleaseScore)}`}>
                    <div className="mindlab-score-card__label">פתיחת שדה אחרי שחרור (משוער/מדווח)</div>
                    <div className="mindlab-score-card__value">{opennessAfterReleaseScore}/100</div>
                    <div className="mindlab-bar">
                      <span style={{ width: `${opennessAfterReleaseScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="callout-line">
                  <strong>מצב שדה:</strong> {analysis.windowLabelHe}
                </div>
                <p className="muted-text">{analysis.summaryHe}</p>

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
              </section>

              <section className="panel-card panel-card--soft">
                <div className="panel-card__head">
                  <h3>מה המטופל מסכים לראות אחרי השחרור</h3>
                </div>
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
              </section>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
