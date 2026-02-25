import { useEffect, useMemo, useRef, useState } from 'react'
import { getLabConfig } from '../data/labsConfig'
import { useAppState } from '../state/appStateContext'
import { makeId } from '../utils/ids'
import { Link } from 'react-router-dom'
import LabLessonPrompt from '../components/layout/LabLessonPrompt'
import MenuSection from '../components/layout/MenuSection'
import LiberatingConversationSimulator from '../components/mind/LiberatingConversationSimulator'
import PatternSequenceMaster from '../components/mind/PatternSequenceMaster'
import { MessageCircle, Sparkles, Volume2, VolumeX, Wand2, Workflow } from 'lucide-react'

const SAMPLE_PATIENT_TEXTS = [
  '׳׳ ׳™ ׳×׳׳™׳“ ׳ ׳×׳§׳¢ ׳›׳©׳¦׳¨׳™׳ ׳׳“׳‘׳¨ ׳׳•׳ ׳׳ ׳©׳™׳, ׳–׳” ׳₪׳©׳•׳˜ ׳׳ ׳׳ ׳™.',
  '׳׳™׳ ׳׳™ ׳©׳•׳ ׳“׳¨׳ ׳׳—׳¨׳×, ׳›׳•׳׳ ׳׳¦׳₪׳™׳ ׳׳׳ ׳™ ׳׳”׳™׳•׳× ׳—׳–׳§ ׳›׳ ׳”׳–׳׳.',
  '׳׳ ׳™ ׳׳ ׳™׳›׳•׳ ׳׳”׳×׳׳•׳“׳“ ׳¢׳ ׳–׳”, ׳–׳” ׳’׳“׳•׳ ׳¢׳׳™׳™ ׳׳“׳™.',
]

const CLOSURE_PATTERNS = [
  {
    id: 'uq',
    labelHe: '׳›׳™׳׳•׳× ׳›׳•׳׳ (׳×׳׳™׳“/׳׳£ ׳₪׳¢׳/׳›׳•׳׳)',
    patterns: [/׳×׳׳™׳“/g, /׳׳£ ׳₪׳¢׳/g, /׳›׳•׳׳/g, /׳”׳›׳•׳/g, /׳”׳›׳/g, /׳©׳•׳ ׳“׳‘׳¨/g],
    weight: 15,
    releaseHintHe: "׳‘׳“׳•׳§/׳™ ׳—׳¨׳™׳’׳™׳: '׳×׳׳™׳“' ג†’ '׳׳₪׳¢׳׳™׳' / '׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳'.",
  },
  {
    id: 'modal',
    labelHe: '׳ ׳¢׳™׳׳× ׳׳₪׳©׳¨׳•׳× (׳׳™ ׳׳₪׳©׳¨/׳׳ ׳™׳›׳•׳/׳—׳™׳™׳‘)',
    patterns: [/׳׳™ ׳׳₪׳©׳¨/g, /׳׳ ׳™׳›׳•׳(?:׳”)?/g, /׳׳™׳ ׳‘׳¨׳™׳¨׳”/g, /׳—׳™׳™׳‘(?:׳×)?/g, /׳׳•׳›׳¨׳—(?:׳×)?/g],
    weight: 18,
    releaseHintHe: "׳¨׳›׳/׳™ ׳׳•׳“׳׳׳™׳•׳×: '׳׳ ׳™׳›׳•׳' ג†’ '׳›׳¨׳’׳¢ ׳§׳©׳” ׳׳™'.",
  },
  {
    id: 'certainty',
    labelHe: '׳•׳“׳׳•׳× ׳§׳©׳™׳—׳” (׳‘׳¨׳•׳¨/׳׳™׳ ׳׳¦׳‘)',
    patterns: [/׳‘׳¨׳•׳¨ ׳©/g, /׳׳™׳ ׳׳¦׳‘/g, /׳‘׳˜׳•׳— ׳©/g, /׳—׳“ ׳׳©׳׳¢׳™׳×/g],
    weight: 12,
    releaseHintHe: "׳”׳›׳ ׳¡/׳™ ׳׳¨׳—׳‘ ׳‘׳“׳™׳§׳”: '׳‘׳¨׳•׳¨' ג†’ '׳›׳¨׳’׳¢ ׳ ׳¨׳׳” ׳׳™'.",
  },
  {
    id: 'identity',
    labelHe: '׳׳™׳–׳•׳’ ׳–׳”׳•׳× (׳–׳” ׳׳ ׳™ / ׳׳ ׳™ ׳›׳–׳”)',
    patterns: [/׳–׳” ׳׳ ׳™\b/g, /׳׳ ׳™ ׳›׳–׳”/g, /׳׳ ׳™ ׳‘׳ ׳׳“׳ ׳©/g, /׳›׳›׳” ׳׳ ׳™/g],
    weight: 16,
    releaseHintHe: '׳”׳₪׳¨׳“/׳™ ׳‘׳™׳ ׳׳“׳ ׳׳”׳×׳ ׳”׳’׳•׳×/׳׳¦׳‘: "׳™׳© ׳—׳׳§ ׳‘׳™ ׳©...".',
  },
]

const OPENNESS_PATTERNS = [
  { labelHe: '׳©׳₪׳” ׳₪׳×׳•׳—׳”/׳׳₪׳©׳¨׳™׳×', patterns: [/׳׳•׳׳™/g, /׳™׳›׳•׳ ׳׳”׳™׳•׳×/g, /׳׳₪׳©׳¨/g, /׳™׳™׳×׳›׳/g], weight: 8 },
  { labelHe: '׳“׳™׳•׳§ ׳‘׳–׳׳ (׳›׳¨׳’׳¢/׳‘׳™׳ ׳×׳™׳™׳)', patterns: [/׳›׳¨׳’׳¢/g, /׳‘׳™׳ ׳×׳™׳™׳/g, /׳¢׳›׳©׳™׳•/g, /׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳/g], weight: 6 },
  { labelHe: '׳”׳‘׳—׳ ׳” ׳—׳׳§׳™׳× (׳׳₪׳¢׳׳™׳/׳—׳׳§)', patterns: [/׳׳₪׳¢׳׳™׳/g, /׳׳¢׳™׳×׳™׳/g, /׳—׳׳§/g, /׳‘׳׳™׳“׳”/g], weight: 7 },
]

const QUANTIFIER_SHIFTS = [
  {
    id: 'q-soften',
    labelHe: "׳›׳™׳׳•׳×: ׳×׳׳™׳“ ג†’ ׳׳₪׳¢׳׳™׳ / ׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳",
    promptHe: '׳׳×׳™ ׳–׳” ׳§׳•׳¨׳” ׳¨׳§ ׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳, ׳•׳׳ ׳×׳׳™׳“?',
  },
  {
    id: 'q-exception',
    labelHe: '׳—׳¨׳™׳’׳™׳: ׳׳£ ׳₪׳¢׳ ג†’ ׳”׳׳ ׳”׳™׳” ׳¨׳’׳¢ ׳׳—׳“ ׳©׳•׳ ׳”?',
    promptHe: '׳”׳׳ ׳”׳™׳” ׳׳₪׳™׳׳• ׳¨׳’׳¢ ׳׳—׳“ ׳©׳‘׳• ׳–׳” ׳”׳™׳” ׳§׳¦׳× ׳׳—׳¨׳×?',
  },
  {
    id: 'q-scale',
    labelHe: '׳¡׳§׳׳׳”: ׳”׳›׳•׳ ג†’ ׳‘׳׳™׳–׳” ׳׳™׳“׳” / ׳›׳׳” ׳׳—׳•׳–?',
    promptHe: '׳׳ ׳–׳” ׳׳ 100%, ׳׳– ׳›׳׳” ׳–׳” ׳›׳¨׳’׳¢?',
  },
]

const RELEASE_CHANNELS = [
  {
    id: 'time',
    labelHe: '׳–׳׳ (׳׳×׳™/׳׳₪׳ ׳™/׳׳—׳¨׳™)',
    promptHe: '׳׳×׳™ ׳–׳” ׳₪׳—׳•׳× ׳—׳–׳§? ׳׳” ׳§׳•׳¨׳” ׳¨׳’׳¢ ׳׳₪׳ ׳™ ׳©׳–׳” ׳ ׳¡׳’׳¨?',
  },
  {
    id: 'space',
    labelHe: '׳׳¨׳—׳‘/׳”׳§׳©׳¨',
    promptHe: '׳‘׳׳™׳–׳” ׳׳§׳•׳/׳”׳§׳©׳¨ ׳–׳” ׳׳—׳¨׳×? ׳¢׳ ׳׳™ ׳™׳© ׳™׳•׳×׳¨ ׳׳¨׳—׳‘?',
  },
  {
    id: 'energy',
    labelHe: '׳’׳•׳£/׳׳ ׳¨׳’׳™׳”',
    promptHe: '׳׳™׳ ׳”׳’׳•׳£ ׳׳—׳–׳™׳§ ׳׳× ׳”׳׳׳•׳ ׳” ׳”׳–׳• ׳¢׳›׳©׳™׳•, ׳•׳׳” ׳§׳•׳¨׳” ׳׳ ׳–׳” ׳׳×׳¨׳›׳ ׳‘-5%?',
  },
  {
    id: 'meaning',
    labelHe: '׳׳©׳׳¢׳•׳×/׳׳¡׳’׳•׳¨',
    promptHe: '׳׳™׳–׳• ׳׳©׳׳¢׳•׳× ׳׳—׳¨׳× ׳™׳›׳•׳׳” ׳׳”׳¡׳‘׳™׳¨ ׳׳× ׳׳” ׳©׳§׳¨׳” ׳‘׳׳™ ׳׳ ׳¢׳•׳ ׳׳× ׳›׳ ׳”׳׳₪׳©׳¨׳•׳™׳•׳×?',
  },
]

const OPTION_OPENERS = [
  {
    id: 'consent',
    labelHe: '׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳׳×׳” ׳׳¡׳›׳™׳ ׳׳©׳§׳•׳?',
    promptHe: '׳׳ ׳׳ ׳—׳™׳™׳‘׳™׳ ׳׳₪׳×׳•׳¨ ׳”׳›׳•׳ ׳¢׳›׳©׳™׳•, ׳׳™׳׳• ׳©׳×׳™ ׳׳•׳₪׳¦׳™׳•׳× ׳׳×׳” ׳׳•׳›׳ ׳¨׳§ ׳׳©׳§׳•׳?',
  },
  {
    id: 'micro-step',
    labelHe: '׳׳” ׳”׳¦׳¢׳“ ׳”׳§׳˜׳ ׳”׳‘׳?',
    promptHe: '׳׳™׳–׳” ׳¦׳¢׳“ ׳§׳˜׳ ׳׳—׳“ ׳›׳ ׳׳₪׳©׳¨׳™, ׳’׳ ׳׳ ׳›׳ ׳”׳©׳׳¨ ׳¢׳“׳™׳™׳ ׳׳ ׳‘׳¨׳•׳¨?',
  },
  {
    id: 'support',
    labelHe: '׳׳™׳–׳• ׳×׳׳™׳›׳” ׳₪׳•׳×׳—׳× ׳©׳“׳”?',
    promptHe: '׳׳” ׳×׳׳™׳›׳” ׳׳—׳× ׳©׳×׳¢׳©׳” ׳׳× ׳–׳” ׳™׳•׳×׳¨ ׳׳₪׳©׳¨׳™ ׳¢׳‘׳•׳¨׳?',
  },
  {
    id: 'non-negotiable-shift',
    labelHe: '׳׳” ׳›׳‘׳¨ ׳׳ ׳׳•׳›׳ ׳©׳™׳׳©׳™׳ / ׳׳™ ׳׳ ׳׳•׳›׳ ׳׳”׳™׳•׳× ׳™׳•׳×׳¨?',
    promptHe:
      '׳׳” ׳׳×׳” ׳׳ ׳׳•׳›׳ ׳©׳™׳§׳¨׳” ׳™׳•׳×׳¨, ׳׳• ׳׳™ ׳׳×׳” ׳׳ ׳׳•׳›׳ ׳׳”׳™׳•׳× ׳™׳•׳×׳¨? ׳–׳” ׳׳•׳׳¨ ׳©׳׳©׳”׳• ׳—׳™׳™׳‘ ׳׳”׳©׳×׳ ׳•׳× ׳’׳ ׳׳ ׳¢׳“׳™׳™׳ ׳׳ ׳‘׳¨׳•׳¨ ׳׳™׳.',
  },
]

const THERAPIST_TONES = [
  { id: 'grounded', labelHe: '׳§׳¨׳§׳¢׳™ / ׳™׳¦׳™׳‘', openerHe: '׳׳ ׳™ ׳©׳•׳׳¢/׳× ׳׳•׳×׳, ׳•׳—׳©׳•׳‘ ׳׳™ ׳©׳ ׳“׳™׳™׳§ ׳¨׳’׳¢ ׳׳× ׳׳” ׳©׳§׳•׳¨׳” ׳›׳׳.' },
  { id: 'soft', labelHe: '׳¨׳ / ׳׳׳₪׳×׳™', openerHe: '׳׳ ׳™ ׳׳™׳×׳ ׳‘׳–׳”, ׳•׳‘׳•׳ ׳ ׳ ׳¡׳” ׳׳₪׳×׳•׳— ׳›׳׳ ׳§׳¦׳× ׳™׳•׳×׳¨ ׳׳¨׳—׳‘ ׳‘׳׳™ ׳׳‘׳˜׳ ׳׳× ׳׳” ׳©׳׳×׳” ׳׳¨׳’׳™׳©.' },
  { id: 'direct', labelHe: '׳™׳©׳™׳¨ / ׳׳•׳‘׳™׳', openerHe: '׳‘׳•׳ ׳ ׳¢׳¦׳•׳¨ ׳¨׳’׳¢ ׳•׳ ׳‘׳“׳•׳§ ׳׳ ׳”׳ ׳™׳¡׳•׳— ׳”׳ ׳•׳›׳—׳™ ׳¡׳•׳’׳¨ ׳׳ ׳׳₪׳©׳¨׳•׳™׳•׳× ׳©׳›׳¨׳’׳¢ ׳¢׳•׳“ ׳׳ ׳¨׳׳™׳ ׳•.' },
]

const MINDLAB_MAIN_STEPS = [
  {
    id: 'patient-source',
    shortLabelHe: '׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳',
    titleHe: '1) ׳׳” ׳”׳׳˜׳•׳₪׳ ׳׳•׳׳¨',
    subtitleHe: '׳׳×׳—׳™׳׳™׳ ׳׳”׳˜׳§׳¡׳˜ ׳›׳₪׳™ ׳©׳”׳•׳, ׳‘׳׳™ ׳׳×׳§׳ ׳׳•׳×׳• ׳¢׳“׳™׳™׳.',
  },
  {
    id: 'therapist-script',
    shortLabelHe: '׳ ׳™׳¡׳•׳— ׳׳˜׳₪׳',
    titleHe: '2) ׳˜׳§׳¡׳˜ ׳׳˜׳₪׳ ׳©׳׳–׳™׳– ׳×׳•׳“׳¢׳”',
    subtitleHe: '׳ ׳™׳¡׳•׳— ׳©׳׳›׳‘׳“ ׳—׳•׳•׳™׳” ׳•׳₪׳•׳×׳— ׳©׳“׳” ׳•׳׳₪׳©׳¨׳•׳™׳•׳×.',
  },
  {
    id: 'options-shift',
    shortLabelHe: '׳׳•׳₪׳¦׳™׳•׳× ׳׳₪׳ ׳™/׳׳—׳¨׳™',
    titleHe: '3) ׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳׳ ׳ ׳¨׳׳• ׳§׳•׳“׳, ׳•׳׳™׳׳• ׳ ׳₪׳×׳—׳• ׳׳—׳¨׳™ ׳”׳©׳—׳¨׳•׳¨',
    subtitleHe: '׳›׳׳ ׳׳•׳“׳“׳™׳ ׳©׳™׳ ׳•׳™ ׳‘׳₪׳•׳¢׳ ׳‘׳׳” ׳©׳”׳׳˜׳•׳₪׳ ׳׳•׳›׳ ׳׳¨׳׳•׳×.',
  },
  {
    id: 'training-tools',
    shortLabelHe: '׳×׳¨׳’׳•׳ ׳׳×׳§׳“׳',
    titleHe: '4) ׳׳¢׳‘׳“׳•׳× ׳׳™׳׳•׳ ׳׳×׳§׳“׳׳•׳×',
    subtitleHe: '׳¡׳™׳׳•׳׳˜׳•׳¨ + ׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳ ׳׳×׳¨׳’׳•׳ ׳¢׳ ׳™׳‘׳© ׳¢׳ ׳₪׳™׳“׳‘׳§.',
  },
]

const MINDLAB_AUDIO_PREFS_KEY = 'la.v1.mindlabAudioPrefs'

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

function AlchemistCompanion({ mood, message, pulseKey }) {
  const face =
    mood === 'dancing' ? 'נ§™ג€ג™‚ן¸ג¨' : mood === 'surprised' ? 'נ§™ג€ג™‚ן¸נ˜²' : mood === 'clap' ? 'נ§™ג€ג™‚ן¸נ‘' : 'נ§™ג€ג™‚ן¸נ™‚'
  return (
    <aside className={`mindlab-companion mood-${mood || 'happy'}`} aria-live="polite" aria-label="Alchemist Companion">
      <div key={pulseKey} className="mindlab-companion__orb" aria-hidden="true">
        {face}
      </div>
      <div className="mindlab-companion__bubble">
        <strong>Alchemist Companion</strong>
        <span>{message || '׳₪׳•׳×׳—׳™׳ ׳©׳“׳”, ׳¦׳¢׳“ ׳׳—׳“ ׳‘׳›׳ ׳₪׳¢׳.'}</span>
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
  return /(׳׳•׳׳™|׳׳₪׳©׳¨|׳›׳¨׳’׳¢|׳׳₪׳¢׳׳™׳|׳‘׳—׳׳§ ׳׳”׳׳§׳¨׳™׳|׳™׳›׳•׳ ׳׳”׳™׳•׳×)/.test(text)
}

function analyzePatientText(rawText) {
  const text = normalizeText(rawText)
  if (!text) {
    return {
      text,
      closureScore: 0,
      optionBlindnessScore: 0,
      opennessSignals: 0,
      windowLabelHe: '׳׳׳×׳™׳ ׳׳˜׳§׳¡׳˜',
      detectedClosures: [],
      detectedOpenings: [],
      releaseHintsHe: [
        '׳”׳“׳‘׳§/׳™ ׳׳©׳₪׳˜ ׳©׳ ׳”׳׳˜׳•׳₪׳ ׳›׳“׳™ ׳׳–׳”׳•׳× ׳׳™׳₪׳” ׳”׳ ׳™׳¡׳•׳— ׳¡׳•׳’׳¨ ׳׳₪׳©׳¨׳•׳™׳•׳×.',
        "׳׳—׳¨ ׳›׳ ׳ ׳‘׳ ׳” ׳ ׳™׳¡׳•׳— ׳׳˜׳₪׳ ׳©׳׳–׳™׳– ׳'׳׳™׳ ׳“׳¨׳' ׳'׳™׳© ׳׳₪׳—׳•׳× ׳‘׳“׳™׳§׳”'.",
      ],
      summaryHe: '׳׳™׳ ׳¢׳“׳™׳™׳ ׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳.',
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

  const negationCount = countPatternMatches(text, /\b׳׳\b/g) + countPatternMatches(text, /\b׳׳™׳\b/g)
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

  let windowLabelHe = '׳©׳“׳” ׳₪׳×׳•׳— ׳™׳—׳¡׳™׳×'
  if (closureScore >= 75) windowLabelHe = '׳©׳“׳” ׳¡׳’׳•׳¨ ׳׳׳•׳“'
  else if (closureScore >= 55) windowLabelHe = '׳©׳“׳” ׳¦׳¨ / ׳ ׳¢׳•׳'
  else if (closureScore >= 35) windowLabelHe = '׳©׳“׳” ׳׳¢׳•׳¨׳‘ (׳™׳© ׳ ׳¢׳™׳׳” ׳•׳™׳© ׳₪׳×׳—׳™׳)'

  const releaseHintsHe = uniqueList([
    ...detectedClosures.map((item) => item.releaseHintHe),
    closureScore >= 65 ? '׳”׳×׳—׳/׳™ ׳׳©׳™׳ ׳•׳™ ׳§׳˜׳ ׳‘׳›׳™׳׳•׳× ׳׳₪׳ ׳™ ׳©׳™׳ ׳•׳™ ׳׳©׳׳¢׳•׳× ׳’׳“׳•׳.' : '',
    optionBlindnessScore >= 60 ? '׳©׳׳/׳™ ׳§׳•׳“׳ ׳¢׳ ׳׳•׳₪׳¦׳™׳” ׳׳—׳× ׳§׳˜׳ ׳” ׳©׳”׳׳˜׳•׳₪׳ ׳¨׳§ ׳׳•׳›׳ ׳׳©׳§׳•׳.' : '',
    detectedOpenings.length ? '׳™׳© ׳›׳‘׳¨ ׳ ׳™׳¦׳ ׳™ ׳₪׳×׳™׳—׳” ׳‘׳˜׳§׳¡׳˜. ׳׳₪׳©׳¨ ׳׳—׳–׳§ ׳׳•׳×׳ ׳‘׳׳§׳•׳ ׳׳”׳™׳׳—׳ ׳™׳©׳™׳¨׳•׳× ׳‘׳×׳•׳›׳.' : '',
  ])

  const summaryHe = detectedClosures.length
    ? `׳–׳•׳”׳• ${detectedClosures.length} ׳“׳₪׳•׳¡׳™ ׳¡׳’׳™׳¨׳” ׳׳¨׳›׳–׳™׳™׳. ׳”׳׳™׳§׳•׳“ ׳”׳•׳ ׳׳”׳¨׳—׳™׳‘ ׳׳₪׳©׳¨׳•׳™׳•׳× ׳‘׳׳™ ׳׳”׳×׳•׳•׳›׳— ׳¢׳ ׳”׳—׳•׳•׳™׳”.`
    : '׳׳ ׳–׳•׳”׳• ׳“׳₪׳•׳¡׳™ ׳¡׳’׳™׳¨׳” ׳׳•׳‘׳”׳§׳™׳. ׳׳₪׳©׳¨ ׳׳¢׳‘׳•׳“ ׳“׳¨׳ ׳“׳™׳•׳§, ׳›׳™׳׳•׳× ׳•׳׳©׳׳¢׳•׳×.'

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
      ? '׳”׳ ׳™׳¡׳•׳— ׳›׳¨׳’׳¢ ׳ ׳©׳׳¢ ׳׳׳•׳“ ׳¡׳’׳•׳¨ ׳•׳׳¦׳™׳’ ׳׳¢׳˜ ׳׳׳•׳“ ׳׳₪׳©׳¨׳•׳™׳•׳×.'
      : analysis.closureScore >= 45
        ? '׳™׳© ׳›׳׳ ׳—׳•׳•׳™׳” ׳׳׳™׳×׳™׳×, ׳•׳‘׳׳§׳‘׳™׳ ׳”׳ ׳™׳¡׳•׳— ׳›׳¨׳’׳¢ ׳׳¦׳׳¦׳ ׳׳× ׳©׳“׳” ׳”׳׳₪׳©׳¨׳•׳™׳•׳×.'
        : '׳™׳© ׳›׳׳ ׳›׳‘׳¨ ׳§׳¦׳× ׳׳¨׳—׳‘, ׳•׳׳₪׳©׳¨ ׳׳“׳™׳™׳§ ׳׳•׳×׳• ׳¢׳•׳“.'

  return [
    therapistTone.openerHe,
    `׳›׳©׳׳ ׳™ ׳©׳•׳׳¢/׳× ׳׳•׳×׳ ׳׳•׳׳¨/׳×: "${patient}"`,
    closureSummaryHe,
    '׳׳ ׳™ ׳׳ ׳׳ ׳¡׳” ׳׳©׳›׳ ׳¢ ׳׳•׳×׳ ׳©׳–׳” ׳׳ ׳ ׳›׳•׳, ׳׳׳ ׳׳‘׳“׳•׳§ ׳׳™׳₪׳” ׳™׳© ׳¢׳•׳“ ׳׳¨׳—׳‘ ׳©׳׳ ׳§׳™׳‘׳ ׳׳™׳׳™׳.',
    quantifierShift.promptHe,
    releaseChannel.promptHe,
    optionOpener.promptHe,
    '׳׳ ׳™׳™׳₪׳×׳— ׳׳₪׳™׳׳• 5% ׳™׳•׳×׳¨ ׳׳¨׳—׳‘ ׳¢׳›׳©׳™׳•, ׳׳” ׳×׳”׳™׳” ׳”׳׳₪׳©׳¨׳•׳× ׳”׳¨׳׳©׳•׳ ׳” ׳©׳×׳¡׳›׳™׳/׳™ ׳׳¨׳׳•׳×?',
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
    titleHe: '׳׳™׳™׳ ׳“ ׳׳™׳‘׳¨׳™׳™׳˜׳™׳ ׳’ ׳©׳₪׳”',
    descriptionHe: '׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳ ג†’ ׳©׳—׳¨׳•׳¨ ׳×׳•׳“׳¢׳×׳™ ג†’ ׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳×',
  }
  const { state, upsertHistory, setLastVisitedLab } = useAppState()

  const [patientText, setPatientText] = useState('')
  const [selectedQuantifierId, setSelectedQuantifierId] = useState(QUANTIFIER_SHIFTS[0].id)
  const [selectedReleaseChannelId, setSelectedReleaseChannelId] = useState(RELEASE_CHANNELS[0].id)
  const [selectedOptionOpenerId, setSelectedOptionOpenerId] = useState(OPTION_OPENERS[0].id)
  const [selectedToneId, setSelectedToneId] = useState(THERAPIST_TONES[1].id)
  const [therapistText, setTherapistText] = useState('')
  const [beforeOptionsText, setBeforeOptionsText] = useState('')
  const [afterOptionsText, setAfterOptionsText] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [activeTrainingToolId, setActiveTrainingToolId] = useState('')
  const [activeMindTabId, setActiveMindTabId] = useState('workflow')
  const [activeStepId, setActiveStepId] = useState(MINDLAB_MAIN_STEPS[0].id)
  const [completedStepIds, setCompletedStepIds] = useState([])
  const [companionMood, setCompanionMood] = useState('happy')
  const [companionMessage, setCompanionMessage] = useState('׳‘׳¨׳•׳ ׳”׳‘׳ ׳׳׳¢׳‘׳“׳”. ׳׳×׳—׳™׳׳™׳ ׳‘׳׳©׳₪׳˜ ׳”׳׳˜׳•׳₪׳ ׳•׳׳©׳ ׳₪׳•׳×׳—׳™׳ ׳©׳“׳”.')
  const [companionPulseKey, setCompanionPulseKey] = useState(0)
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

  const compactEvaluationMeters = useMemo(
    () => [
      {
        id: 'closure',
        labelHe: '׳¡׳’׳™׳¨׳× ׳×׳•׳“׳¢׳”',
        value: analysis.closureScore,
        tone: scoreTone(analysis.closureScore),
      },
      {
        id: 'blindness',
        labelHe: '׳¢׳™׳•׳•׳¨׳•׳ ׳׳׳•׳₪׳¦׳™׳•׳×',
        value: analysis.optionBlindnessScore,
        tone: scoreTone(analysis.optionBlindnessScore),
      },
      {
        id: 'opening',
        labelHe: '׳₪׳×׳™׳—׳× ׳©׳“׳” ׳׳—׳¨׳™ ׳©׳—׳¨׳•׳¨',
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
  const isSoundOn = audioPrefs.enabled && !audioPrefs.muted

  const triggerCompanion = (mood, message) => {
    setCompanionMood(mood)
    if (message) {
      setCompanionMessage(message)
    }
    setCompanionPulseKey((current) => current + 1)
  }

  const playCue = (cue) => {
    if (!audioPrefs.enabled) return
    playWebAudioCue(audioContextRef, cue, audioPrefs.muted)
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
      triggerCompanion('happy', '׳™׳•׳₪׳™. ׳”׳׳¢׳‘׳“׳” ׳—׳™׳” ׳•׳¢׳“׳™׳ ׳”. ׳׳₪׳©׳¨ ׳׳”׳©׳×׳™׳§ ׳‘׳›׳ ׳¨׳’׳¢.')
    } else {
      triggerCompanion('happy', '׳׳¢׳•׳׳”. ׳¢׳•׳‘׳“׳™׳ ׳‘׳©׳§׳˜ ׳׳׳, ׳‘׳׳™ ׳¡׳׳•׳ ׳“.')
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

  const handleTrainingSignal = (type, payload = {}) => {
    if (type === 'simulator-next-statement' || type === 'pattern-next-statement') {
      playCue('whoosh')
      triggerCompanion('happy', 'נטען תרגול חדש. שים/י לב מה משתנה בניסוח ובתחושה.')
      return
    }
    if (type === 'simulator-check') {
      if (payload.level === 'great') {
        playCue('harp')
        triggerCompanion('dancing', 'וווו! פתחת את השדה יפה מאוד.')
      } else if (payload.level === 'almost') {
        playCue('sparkle')
        triggerCompanion('surprised', 'כמעט. עוד כיוונון קטן בכימות/יחסים וזו קפיצה.')
      } else {
        playCue('tap')
        triggerCompanion('happy', 'התחלה טובה. עכשיו בוא/י נוסיף שאלה שמקשרת בין משתנים.')
      }
      return
    }
    if (type === 'pattern-check') {
      if ((payload.score ?? 0) >= 75 && payload.orderCorrect && payload.blankCorrect) {
        playCue('harp')
        triggerCompanion('clap', 'רצף יפה. עכשיו ליישם אותו על משפט חי.')
      } else {
        playCue('sparkle')
        triggerCompanion('happy', 'יש בסיס טוב. עוד דיוק קטן בסדר/מילוי והזרימה תתחזק.')
      }
      return
    }
    if (type === 'simulator-save' || type === 'pattern-save') {
      playCue('harp')
      triggerCompanion('clap', 'נשמר להיסטוריה. זהב מצטבר.')
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

  const markStepDoneAndAdvance = (stepId) => {
    setCompletedStepIds((current) => (current.includes(stepId) ? current : [...current, stepId]))
    playCue('sparkle')
    const currentIndex = MINDLAB_MAIN_STEPS.findIndex((step) => step.id === stepId)
    const nextStep = MINDLAB_MAIN_STEPS[currentIndex + 1]
    if (nextStep) {
      setActiveStepId(nextStep.id)
      scrollToStep(nextStep.id)
      triggerCompanion('clap', `׳¡׳•׳’׳¨/׳× ׳©׳׳‘ ${currentIndex + 1} ׳•׳׳׳©׳™׳/׳” ׳-${nextStep.shortLabelHe}.`)
      setStatusMessage(`׳¡׳™׳™׳׳× ׳׳× ${currentIndex + 1}/${MINDLAB_MAIN_STEPS.length} ג€¢ ׳׳׳©׳™׳›׳™׳ ׳-${nextStep.shortLabelHe}.`)
      return
    }
    playCue('gong')
    triggerCompanion('dancing', 'סיימת את כל המסלול. השדה כבר נפתח.')
    setStatusMessage('׳¡׳™׳™׳׳× ׳׳× ׳›׳ ׳©׳׳‘׳™ ׳”׳¢׳‘׳•׳“׳” ׳‘׳¢׳׳•׳“. ׳׳₪׳©׳¨ ׳׳©׳׳•׳¨ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳׳• ׳׳—׳–׳•׳¨ ׳•׳׳—׳“׳“ ׳©׳׳‘ ׳׳¡׳•׳™׳.')
  }

  const getStepBadgeText = (stepId) => {
    if (activeStepId === stepId) return '׳›׳׳ ׳¢׳›׳©׳™׳•'
    if (completedStepIds.includes(stepId)) return '׳”׳•׳©׳׳'
    return '׳¡׳’׳•׳¨'
  }

  const handleUseGeneratedScript = () => {
    if (!generatedTherapistText) {
      setStatusMessage('׳”׳“׳‘׳§/׳™ ׳§׳•׳“׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳›׳“׳™ ׳׳‘׳ ׳•׳× ׳ ׳™׳¡׳•׳— ׳׳˜׳₪׳ ׳׳©׳—׳¨׳¨.')
      return
    }
    setTherapistText(generatedTherapistText)
    playCue('whoosh')
    triggerCompanion('happy', '׳•׳•׳•׳•! ׳ ׳‘׳ ׳” ׳ ׳™׳¡׳•׳— ׳©׳׳–׳™׳– ׳׳× ׳”׳×׳•׳“׳¢׳” ׳•׳׳ ׳¨׳§ ׳׳¡׳‘׳™׳¨.')
    setStatusMessage('׳ ׳‘׳ ׳” ׳ ׳™׳¡׳•׳— ׳׳˜׳₪׳ ׳׳©׳—׳¨׳¨. ׳׳₪׳©׳¨ ׳׳¢׳¨׳•׳ ׳׳•׳×׳• ׳™׳“׳ ׳™׳×.')
  }

  const handleCopyTherapistText = async () => {
    if (!normalizeText(therapistText)) {
      setStatusMessage('׳׳™׳ ׳¢׳“׳™׳™׳ ׳˜׳§׳¡׳˜ ׳׳˜׳₪׳ ׳׳”׳¢׳×׳§׳”.')
      return
    }
    try {
      await navigator.clipboard.writeText(therapistText)
      playCue('tap')
      setStatusMessage('׳”׳˜׳§׳¡׳˜ ׳©׳ ׳”׳׳˜׳₪׳ ׳”׳•׳¢׳×׳§ ׳׳׳•׳—.')
    } catch {
      setStatusMessage('׳׳ ׳”׳¦׳׳—׳×׳™ ׳׳”׳¢׳×׳™׳§ ׳׳׳•׳—.')
    }
  }

  const handleSaveSession = () => {
    const finalTherapistText = normalizeText(therapistText)
    if (!analysis.text || !finalTherapistText) {
      setStatusMessage('׳¦׳¨׳™׳ ׳’׳ ׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳ ׳•׳’׳ ׳˜׳§׳¡׳˜ ׳׳˜׳₪׳ ׳׳₪׳ ׳™ ׳©׳׳™׳¨׳”.')
      return
    }

    upsertHistory({
      id: makeId('mll'),
      labId: lab.id,
      createdAt: new Date().toISOString(),
      summaryHe: `׳¡׳’׳™׳¨׳× ׳×׳•׳“׳¢׳” ${analysis.closureScore}/100 | ׳¢׳™׳•׳•׳¨׳•׳ ׳׳׳•׳₪׳¦׳™׳•׳× ${analysis.optionBlindnessScore}/100 | ׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳× ${newOptionsAfterRelease.length}`,
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
    setStatusMessage('׳”׳¡׳©׳ ׳ ׳©׳׳¨ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳”.')
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
    setActiveTrainingToolId('')
    setActiveMindTabId('workflow')
    setActiveStepId(MINDLAB_MAIN_STEPS[0].id)
    setCompletedStepIds([])
    playCue('whoosh')
    triggerCompanion('happy', 'סשן חדש. מתחילים מהמשפט כמו שהוא.')
    setStatusMessage('׳ ׳₪׳×׳—׳” ׳¢׳‘׳•׳“׳” ׳—׳“׳©׳”.')
    scrollToStep(MINDLAB_MAIN_STEPS[0].id)
  }

  const loadSample = (text) => {
    setPatientText(text)
    setActiveMindTabId('workflow')
    setActiveStepId('patient-source')
    playCue('tap')
    triggerCompanion('surprised', 'מעולה. עכשיו רואים משפט חי מול העיניים, ואפשר להתחיל לשחרר.')
    setStatusMessage('׳ ׳˜׳¢׳ ׳” ׳“׳•׳’׳׳× ׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳. ׳¢׳›׳©׳™׳• ׳‘׳ ׳”/׳™ ׳ ׳™׳¡׳•׳— ׳׳©׳—׳¨׳¨.')
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
    setStatusMessage('׳ ׳˜׳¢׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳׳”׳׳¢׳‘׳“׳” ׳”׳׳×׳§׳“׳׳× ׳׳ ׳”׳׳™׳™׳ ׳“ ׳׳™׳‘׳¨׳˜׳™׳ ׳’ ׳”׳¨׳׳©׳™.')
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
      <button
        type="button"
        className="mindlab-sound-toggle"
        aria-pressed={isSoundOn}
        onClick={() => {
          setAudioPrefs((current) => {
            if (!current.enabled) {
              return { ...current, enabled: true, muted: false }
            }
            return { ...current, muted: !current.muted }
          })
          playCue('tap')
          triggerCompanion('happy', isSoundOn ? 'הצלילים הושתקו.' : 'הצלילים חזרו.')
        }}
        title={isSoundOn ? 'השתק צלילים' : 'הפעל צלילים'}
      >
        {isSoundOn ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
        <span>{isSoundOn ? 'Sound' : 'Muted'}</span>
      </button>
      <section className="alchemy-card">
        <div className="alchemy-card__head">
          <div>
            <h2>{lab.titleHe}</h2>
            <p>{lab.descriptionHe}</p>
          </div>
          <div className="alchemy-card__actions">
            <Link to="/" className="secondary-link-button">
              ׳—׳–׳¨׳” ׳׳׳¡׳ ׳”׳›׳׳׳™
            </Link>
            <button type="button" onClick={handleNewSession}>
              ׳¡׳©׳ ׳—׳“׳©
            </button>
          </div>
        </div>

        <LabLessonPrompt labId={lab.id} />

        <section className="mindlab-workspace-menu" aria-label="׳×׳₪׳¨׳™׳˜׳™ ׳׳©׳ ׳” - ׳©׳—׳¨׳•׳¨ ׳×׳•׳“׳¢׳” ׳¢׳ ׳™׳“׳™ ׳©׳₪׳”">
          <div className="mindlab-workspace-menu__head">
            <div>
              <h3>׳©׳—׳¨׳•׳¨ ׳×׳•׳“׳¢׳” ׳¢׳ ׳™׳“׳™ ׳©׳₪׳”</h3>
              <p>׳‘׳—׳¨/׳™ ׳׳•׳“ ׳¢׳‘׳•׳“׳” ׳׳—׳“ ׳‘׳›׳ ׳₪׳¢׳ ׳›׳“׳™ ׳׳©׳׳•׳¨ ׳₪׳•׳§׳•׳¡ ׳•׳׳”׳™׳׳ ׳¢ ׳׳’׳׳™׳׳” ׳׳¨׳•׳›׳”.</p>
            </div>
            <Link to="/" className="mindlab-workspace-menu__back">
              ׳—׳–׳¨׳” ׳׳׳¡׳ ׳”׳›׳׳׳™
            </Link>
          </div>

          <div className="mindlab-workspace-menu__tabs" role="tablist" aria-label="׳×׳₪׳¨׳™׳˜׳™ ׳׳©׳ ׳”">
            {[
              { id: 'workflow', labelHe: '׳×׳¨׳’׳™׳׳™׳', labelEn: 'Core Workflow' },
              { id: 'simulator', labelHe: '׳¡׳™׳׳•׳׳˜׳•׳¨', labelEn: 'Simulator' },
              { id: 'pattern-master', labelHe: '׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳', labelEn: 'Pattern Master' },
              { id: 'history', labelHe: '׳”׳™׳¡׳˜׳•׳¨׳™׳”', labelEn: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeMindTabId === tab.id}
                className={`mindlab-workspace-menu__tab ${activeMindTabId === tab.id ? 'is-active' : ''}`}
                onClick={() => handleSwitchMindTab(tab.id)}
              >
                <span>{tab.labelHe}</span>
                <small>{tab.labelEn}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="mindlab-hero-tools" aria-label="כלי תרגול מתקדמים">
          <button
            type="button"
            className={`mindlab-training-card mindlab-training-card--hero ${
              activeMindTabId === 'simulator' ? 'is-active' : ''
            }`}
            onClick={() => {
              setActiveTrainingToolId('simulator')
              handleSwitchMindTab('simulator')
            }}
          >
            <div className="mindlab-training-card__icon">
              <MessageCircle size={24} aria-hidden="true" />
            </div>
            <div className="mindlab-training-card__content">
              <strong>סימולטור שיחות משחררות</strong>
              <small>Mind Liberating Conversation Simulator</small>
              <span>שני אנשים + גלים + משפט מטופל רנדומלי + פידבק מיידי</span>
            </div>
            <Sparkles size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`mindlab-training-card mindlab-training-card--hero ${
              activeMindTabId === 'pattern-master' ? 'is-active' : ''
            }`}
            onClick={() => {
              setActiveTrainingToolId('pattern-master')
              handleSwitchMindTab('pattern-master')
            }}
          >
            <div className="mindlab-training-card__icon">
              <Workflow size={24} aria-hidden="true" />
            </div>
            <div className="mindlab-training-card__content">
              <strong>מאסטר רצפים</strong>
              <small>Pattern Sequence Master</small>
              <span>Flowchart + fill-in + סדר רצף + יישום על משפט</span>
            </div>
            <Wand2 size={18} aria-hidden="true" />
          </button>
        </section>

        {activeMindTabId === 'workflow' && (
        <div className="mindlab-layout">
          <div className="mindlab-main">
            <section className="mindlab-stepper" aria-label="׳”׳×׳§׳“׳׳•׳× ׳‘׳©׳׳‘׳™ ׳”׳׳¢׳‘׳“׳”">
              <div className="mindlab-stepper__head">
                <div>
                  <div className="mindlab-stepper__eyebrow">׳׳¡׳׳•׳ ׳¢׳‘׳•׳“׳” ׳׳׳•׳§׳“</div>
                  <div className="mindlab-stepper__title">
                    ׳©׳׳‘ {activeStepIndex + 1}/{MINDLAB_MAIN_STEPS.length} ג€¢ {activeStepMeta.shortLabelHe}
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
                  ׳׳™׳₪׳•׳¡ ׳”׳×׳§׳“׳׳•׳×
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
                  <div className="mindlab-focus-strip__eyebrow">׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳₪׳¢׳™׳</div>
                  <div className="mindlab-focus-strip__status">
                    <strong>׳׳¦׳‘ ׳©׳“׳”:</strong> {analysis.windowLabelHe}
                  </div>
                </div>
                <div className="mindlab-focus-strip__scores" aria-label="׳׳“׳“׳™ ׳׳¦׳‘ ׳©׳“׳”">
                  <span className="mindlab-focus-strip__score current-step" title={activeStepMeta.titleHe}>
                    ׳¢׳›׳©׳™׳•: {activeStepMeta.shortLabelHe}
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
                {analysis.text || '׳”׳“׳‘׳§/׳™ ׳›׳׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳›׳“׳™ ׳©׳”׳׳©׳₪׳˜ ׳”׳₪׳¢׳™׳ ׳™׳™׳©׳׳¨ ׳׳•׳ ׳”׳¢׳™׳ ׳™׳™׳ ׳׳׳•׳¨׳ ׳›׳ ׳”׳¢׳‘׳•׳“׳”.'}
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
                  <h3>1) ׳׳” ׳”׳׳˜׳•׳₪׳ ׳׳•׳׳¨</h3>
                  <p>׳׳×׳—׳™׳׳™׳ ׳׳”׳˜׳§׳¡׳˜ ׳›׳₪׳™ ׳©׳”׳•׳, ׳‘׳׳™ ׳׳×׳§׳ ׳׳•׳×׳• ׳¢׳“׳™׳™׳.</p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'patient-source' ? 'is-active' : ''}`}>
                    {getStepBadgeText('patient-source')}
                  </span>
                  <button type="button" onClick={() => openStep('patient-source')}>
                    {activeStepId === 'patient-source' ? '׳₪׳×׳•׳— ׳¢׳›׳©׳™׳•' : '׳₪׳×׳— ׳×׳¨׳’׳™׳'}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => markStepDoneAndAdvance('patient-source')}>
                    ׳¡׳™׳™׳׳×׳™ ג†’ ׳¡׳’׳•׳¨ ׳•׳”׳׳©׳
                  </button>
                </div>
              </div>

              <label className="mindlab-field">
                <span>׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳ (׳׳§׳•׳¨׳™)</span>
                <textarea
                  rows={4}
                  className="mindlab-textarea"
                  value={patientText}
                  onChange={(event) => {
                    setPatientText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder="׳׳“׳•׳’׳׳”: '׳׳ ׳™ ׳×׳׳™׳“ ׳ ׳×׳§׳¢, ׳׳™׳ ׳׳™ ׳“׳¨׳ ׳׳—׳¨׳×, ׳–׳” ׳₪׳©׳•׳˜ ׳׳ ׳׳ ׳™...'"
                />
              </label>

              <div className="chip-bank">
                <h4>׳“׳•׳’׳׳׳•׳× ׳׳”׳™׳¨׳•׳×</h4>
                <div className="chips-wrap">
                  {SAMPLE_PATIENT_TEXTS.map((sample) => (
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
                  <h3>2) ׳˜׳§׳¡׳˜ ׳׳˜׳₪׳ ׳©׳׳–׳™׳– ׳×׳•׳“׳¢׳”</h3>
                  <p>׳‘׳•׳ ׳™׳ ׳ ׳™׳¡׳•׳— ׳©׳׳›׳‘׳“ ׳׳× ׳”׳—׳•׳•׳™׳”, ׳׳‘׳ ׳₪׳•׳×׳— ׳©׳“׳” ׳•׳׳₪׳©׳¨׳•׳™׳•׳×.</p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'therapist-script' ? 'is-active' : ''}`}>
                    {getStepBadgeText('therapist-script')}
                  </span>
                  <button type="button" onClick={() => openStep('therapist-script')}>
                    {activeStepId === 'therapist-script' ? '׳₪׳×׳•׳— ׳¢׳›׳©׳™׳•' : '׳₪׳×׳— ׳×׳¨׳’׳™׳'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('therapist-script')}
                  >
                    ׳¡׳™׳™׳׳×׳™ ג†’ ׳¡׳’׳•׳¨ ׳•׳”׳׳©׳
                  </button>
                </div>
              </div>

              <div className="mindlab-prompt-grid">
                <div className="chip-bank">
                  <h4>׳˜׳•׳ ׳׳˜׳₪׳</h4>
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
                  <h4>׳©׳—׳¨׳•׳¨ ׳›׳™׳׳•׳× / ׳ ׳¢׳™׳׳”</h4>
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
                  <h4>׳¢׳¨׳•׳¥ ׳”׳¨׳—׳‘׳” (׳–׳׳/׳׳¨׳—׳‘/׳’׳•׳£/׳׳©׳׳¢׳•׳×)</h4>
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
                  <h4>׳©׳׳׳× ׳₪׳×׳™׳—׳× ׳׳•׳₪׳¦׳™׳•׳×</h4>
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
                  <strong>׳˜׳™׳•׳˜׳× ׳ ׳™׳¡׳•׳— ׳׳˜׳₪׳ (׳׳•׳¦׳¢׳×)</strong>
                  <button type="button" onClick={handleUseGeneratedScript}>
                    ׳‘׳ ׳” ׳ ׳™׳¡׳•׳— ׳׳•׳¦׳¢
                  </button>
                </div>
                <p>{generatedTherapistText || '׳”׳“׳‘׳§/׳™ ׳˜׳§׳¡׳˜ ׳׳˜׳•׳₪׳ ׳›׳“׳™ ׳׳§׳‘׳ ׳˜׳™׳•׳˜׳”.'}</p>
              </div>

              <label className="mindlab-field">
                <span>׳˜׳§׳¡׳˜ ׳׳˜׳₪׳ ׳¡׳•׳₪׳™ (׳ ׳™׳×׳ ׳׳¢׳¨׳™׳›׳”)</span>
                <textarea
                  rows={6}
                  className="mindlab-textarea"
                  value={therapistText}
                  onChange={(event) => {
                    setTherapistText(event.target.value)
                    setStatusMessage('')
                  }}
                  placeholder="׳”׳˜׳§׳¡׳˜ ׳©׳”׳׳˜׳₪׳ ׳‘׳•׳ ׳” ׳›׳“׳™ ׳׳”׳–׳™׳– ׳׳× ׳”׳×׳•׳“׳¢׳”, ׳׳₪׳×׳•׳— ׳©׳“׳” ׳•׳׳”׳–׳׳™׳ ׳׳•׳₪׳¦׳™׳•׳×."
                />
              </label>

              <div className="controls-row">
                <button type="button" onClick={handleCopyTherapistText}>
                  ׳”׳¢׳×׳§ ׳˜׳§׳¡׳˜ ׳׳˜׳₪׳
                </button>
                <button type="button" onClick={handleSaveSession}>
                  ׳©׳׳•׳¨ ׳׳”׳™׳¡׳˜׳•׳¨׳™׳”
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
                  <h3>3) ׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳׳ ׳ ׳¨׳׳• ׳§׳•׳“׳, ׳•׳׳™׳׳• ׳ ׳₪׳×׳—׳• ׳׳—׳¨׳™ ׳”׳©׳—׳¨׳•׳¨</h3>
                  <p>׳–׳” ׳”׳׳‘ ׳©׳ ׳”׳¢׳‘׳•׳“׳”: ׳׳ ׳¨׳§ ג€׳ ׳™׳¡׳•׳— ׳™׳₪׳”ג€, ׳׳׳ ׳©׳™׳ ׳•׳™ ׳‘׳׳” ׳©׳”׳׳˜׳•׳₪׳ ׳׳•׳›׳ ׳׳¨׳׳•׳×.</p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'options-shift' ? 'is-active' : ''}`}>
                    {getStepBadgeText('options-shift')}
                  </span>
                  <button type="button" onClick={() => openStep('options-shift')}>
                    {activeStepId === 'options-shift' ? '׳₪׳×׳•׳— ׳¢׳›׳©׳™׳•' : '׳₪׳×׳— ׳×׳¨׳’׳™׳'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('options-shift')}
                  >
                    ׳¡׳™׳™׳׳×׳™ ג†’ ׳¡׳’׳•׳¨ ׳•׳”׳׳©׳
                  </button>
                </div>
              </div>

              <div className="mindlab-options-grid">
                <label className="mindlab-field">
                  <span>׳׳₪׳ ׳™ ׳”׳©׳—׳¨׳•׳¨: ׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳”׳׳˜׳•׳₪׳ ׳׳ ׳¨׳•׳׳” / ׳₪׳•׳¡׳ ׳׳™׳“?</span>
                  <textarea
                    rows={5}
                    className="mindlab-textarea"
                    value={beforeOptionsText}
                    onChange={(event) => setBeforeOptionsText(event.target.value)}
                    placeholder={'׳©׳•׳¨׳” ׳׳›׳ ׳׳•׳₪׳¦׳™׳”, ׳׳׳©׳:\n׳׳‘׳§׳© ׳¢׳–׳¨׳”\n׳׳“׳—׳•׳× ׳”׳—׳׳˜׳” ׳‘׳™׳•׳\n׳׳¢׳©׳•׳× ׳’׳¨׳¡׳” ׳—׳׳§׳™׳×'}
                  />
                </label>

                <label className="mindlab-field">
                  <span>׳׳—׳¨׳™ ׳”׳©׳—׳¨׳•׳¨: ׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳”׳•׳ ׳₪׳×׳׳•׳ ׳׳¡׳›׳™׳ ׳׳¨׳׳•׳× / ׳׳©׳§׳•׳?</span>
                  <textarea
                    rows={5}
                    className="mindlab-textarea"
                    value={afterOptionsText}
                    onChange={(event) => setAfterOptionsText(event.target.value)}
                    placeholder={'׳©׳•׳¨׳” ׳׳›׳ ׳׳•׳₪׳¦׳™׳”, ׳׳׳©׳:\n׳׳‘׳“׳•׳§ ׳—׳¨׳™׳’׳™׳\n׳׳‘׳§׳© ׳×׳™׳׳•׳ ׳¦׳™׳₪׳™׳•׳×\n׳׳ ׳¡׳•׳× ׳¦׳¢׳“ ׳§׳˜׳ ׳׳—׳“'}
                  />
                </label>
              </div>

              <div className="mindlab-delta-grid">
                <div className="mini-card">
                  <h4>׳׳₪׳ ׳™ ׳”׳©׳—׳¨׳•׳¨</h4>
                  <p>{beforeOptions.length} ׳׳•׳₪׳¦׳™׳•׳× ׳׳–׳•׳”׳•׳×</p>
                  <ul>
                    {beforeOptions.slice(0, 6).map((item) => (
                      <li key={`before-${item}`}>{item}</li>
                    ))}
                    {!beforeOptions.length && <li>׳¢׳“׳™׳™׳ ׳׳ ׳”׳•׳–׳ ׳• ׳׳•׳₪׳¦׳™׳•׳×.</li>}
                  </ul>
                </div>
                <div className="mini-card">
                  <h4>׳׳—׳¨׳™ ׳”׳©׳—׳¨׳•׳¨</h4>
                  <p>{afterOptions.length} ׳׳•׳₪׳¦׳™׳•׳× ׳׳–׳•׳”׳•׳×</p>
                  <ul>
                    {afterOptions.slice(0, 6).map((item) => (
                      <li key={`after-${item}`}>{item}</li>
                    ))}
                    {!afterOptions.length && <li>׳¢׳“׳™׳™׳ ׳׳ ׳”׳•׳–׳ ׳• ׳׳•׳₪׳¦׳™׳•׳×.</li>}
                  </ul>
                </div>
                <div className="mini-card">
                  <h4>׳׳” ׳ ׳₪׳×׳—</h4>
                  <p>׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳× ׳©׳ ׳•׳¡׳₪׳•: {newOptionsAfterRelease.length}</p>
                  <ul>
                    {newOptionsAfterRelease.slice(0, 6).map((item) => (
                      <li key={`new-${item}`}>{item}</li>
                    ))}
                    {!newOptionsAfterRelease.length && <li>׳¢׳“׳™׳™׳ ׳׳™׳ ׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳× ׳׳¡׳•׳׳ ׳•׳×.</li>}
                  </ul>
                  {optionsDropped.length > 0 && (
                    <p className="muted-text">׳׳•׳₪׳¦׳™׳•׳× ׳©׳”׳•׳¡׳¨׳•/׳₪׳—׳•׳× ׳¨׳׳•׳•׳ ׳˜׳™׳•׳×: {optionsDropped.join(', ')}</p>
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
                  <h3>4) ׳׳¢׳‘׳“׳•׳× ׳׳™׳׳•׳ ׳׳×׳§׳“׳׳•׳×</h3>
                  <p>
                    ׳×׳¨׳’׳•׳ "׳¢׳ ׳™׳‘׳©" ׳©׳ ׳©׳₪׳” ׳׳©׳—׳¨׳¨׳×: ׳‘׳•׳—׳¨׳™׳ ׳”׳§׳©׳¨, ׳׳§׳‘׳׳™׳ ׳׳©׳₪׳˜, ׳•׳‘׳•׳ ׳™׳ ׳×׳’׳•׳‘׳”/׳¨׳¦׳£ ׳¢׳ ׳₪׳™׳“׳‘׳§ ׳׳™׳™׳“׳™.
                  </p>
                </div>
                <div className="mindlab-step-card__headActions">
                  <span className={`mindlab-step-card__badge ${activeStepId === 'training-tools' ? 'is-active' : ''}`}>
                    {getStepBadgeText('training-tools')}
                  </span>
                  <button type="button" onClick={() => openStep('training-tools')}>
                    {activeStepId === 'training-tools' ? '׳₪׳×׳•׳— ׳¢׳›׳©׳™׳•' : '׳₪׳×׳— ׳×׳¨׳’׳™׳'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => markStepDoneAndAdvance('training-tools')}
                  >
                    ׳¡׳™׳™׳׳×׳™ ׳©׳׳‘ ׳×׳¨׳’׳•׳
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
                    <strong>׳¡׳™׳׳•׳׳˜׳•׳¨ ׳©׳™׳—׳•׳× ׳׳©׳—׳¨׳¨׳•׳×</strong>
                    <small>Mind Liberating Conversation Simulator</small>
                    <span>׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳¨׳ ׳“׳•׳׳׳™ + ׳×׳’׳•׳‘׳× ׳׳˜׳₪׳ + ׳‘׳“׳™׳§׳” + ׳“׳•׳’׳׳׳•׳× ׳׳™׳“׳™׳׳׳™׳•׳×</span>
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
                    <strong>׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳</strong>
                    <small>Pattern Sequence Master</small>
                    <span>׳₪׳׳˜׳¨׳ ׳™׳, flowchart, fill-in-blanks, ׳¡׳“׳¨ ׳¨׳¦׳£ ׳•׳™׳™׳©׳•׳ ׳¢׳ ׳׳©׳₪׳˜ ׳¨׳ ׳“׳•׳׳׳™</span>
                  </div>
                  <Sparkles size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="mindlab-training-panel mindlab-training-panel--launcher">
                <p className="muted-text">
                  ׳”׳×׳¨׳’׳•׳ ׳”׳׳׳ ׳ ׳₪׳×׳— ׳¢׳›׳©׳™׳• ׳‘׳˜׳׳‘׳™׳ ׳”׳¢׳׳™׳•׳ ׳™׳ ׳›׳“׳™ ׳׳©׳׳•׳¨ ׳׳× ׳–׳¨׳™׳׳× ׳”׳¢׳‘׳•׳“׳” ׳§׳¦׳¨׳” ׳•׳׳׳•׳§׳“׳×.
                </p>
                <div className="controls-row">
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchMindTab('simulator')
                      setActiveTrainingToolId('simulator')
                    }}
                  >
                    ׳₪׳×׳— ׳¡׳™׳׳•׳׳˜׳•׳¨ ׳‘׳˜׳׳‘ ׳ ׳₪׳¨׳“
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      handleSwitchMindTab('pattern-master')
                      setActiveTrainingToolId('pattern-master')
                    }}
                  >
                    ׳₪׳×׳— ׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳ ׳‘׳˜׳׳‘ ׳ ׳₪׳¨׳“
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
                  <h3>׳׳” ׳”׳׳˜׳•׳₪׳ ׳׳•׳׳¨ ׳¢׳›׳©׳™׳•</h3>
                </div>
                <blockquote className="mindlab-quote">
                  {analysis.text || '׳”׳“׳‘׳§/׳™ ׳›׳׳ ׳׳©׳₪׳˜ ׳׳˜׳•׳₪׳ ׳›׳“׳™ ׳׳ ׳×׳— ׳׳× ׳¨׳׳× ׳”׳¡׳’׳™׳¨׳”.'}
                </blockquote>
              </section>

              <section className="panel-card">
                <div className="panel-card__head">
                  <div>
                    <h3>׳׳” ׳—׳©׳•׳‘ ׳׳¨׳׳•׳× ׳›׳׳</h3>
                    <p>׳׳ ׳¨׳§ ׳”׳×׳•׳›׳, ׳׳׳ ׳›׳׳” ׳”׳×׳•׳“׳¢׳” ׳¡׳’׳•׳¨׳” ׳•׳›׳׳” ׳׳•׳₪׳¦׳™׳•׳× ׳ ׳¢׳׳׳•׳×.</p>
                  </div>
                </div>

                <div className="mindlab-eval-compact">
                  <div className="mindlab-eval-compact__barCard" aria-label="׳׳“ ׳©׳“׳” ׳§׳•׳׳₪׳§׳˜׳™">
                    <div className="mindlab-eval-compact__barLabels">
                      <span>׳¡׳’׳•׳¨</span>
                      <span>׳₪׳×׳•׳—</span>
                    </div>
                    <div className="mindlab-eval-compact__fieldBar" aria-hidden="true">
                      <div
                        className="mindlab-eval-compact__fieldFill"
                        style={{ height: `${fieldPressureScore}%` }}
                      />
                    </div>
                    <div className="mindlab-eval-compact__barValue">{fieldPressureScore}/100</div>
                  </div>

                  <div className="mindlab-eval-compact__meters" role="list" aria-label="׳׳“׳“׳™ ׳׳‘׳—׳•׳">
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
                  <strong>׳׳¦׳‘ ׳©׳“׳”:</strong> {analysis.windowLabelHe}
                </div>
                <p className="muted-text">{analysis.summaryHe}</p>

                <MenuSection
                  compact
                  className="mindlab-detail-menu"
                  title="׳׳‘׳—׳•׳ ׳׳₪׳•׳¨׳˜"
                  subtitle="׳“׳₪׳•׳¡׳™ ׳¡׳’׳™׳¨׳”, ׳ ׳™׳¦׳ ׳™ ׳₪׳×׳™׳—׳” ׳•׳›׳™׳•׳•׳ ׳™ ׳©׳—׳¨׳•׳¨"
                  badgeText={`${
                    analysis.detectedClosures.length +
                    analysis.detectedOpenings.length +
                    analysis.releaseHintsHe.length
                  }`}
                >
                  <div className="mindlab-chip-lists">
                    <div className="chip-bank">
                      <h4>׳“׳₪׳•׳¡׳™ ׳¡׳’׳™׳¨׳” ׳©׳–׳•׳”׳•</h4>
                      <div className="chips-wrap">
                        {analysis.detectedClosures.length ? (
                          analysis.detectedClosures.map((item) => (
                            <span key={item.id} className="chip chip--selected">
                              {item.labelHe} ({item.count})
                            </span>
                          ))
                        ) : (
                          <span className="chip">׳׳ ׳–׳•׳”׳• ׳“׳₪׳•׳¡׳™ ׳¡׳’׳™׳¨׳” ׳׳•׳‘׳”׳§׳™׳</span>
                        )}
                      </div>
                    </div>

                    <div className="chip-bank">
                      <h4>׳ ׳™׳¦׳ ׳™ ׳₪׳×׳™׳—׳” ׳©׳›׳‘׳¨ ׳§׳™׳™׳׳™׳</h4>
                      <div className="chips-wrap">
                        {analysis.detectedOpenings.length ? (
                          analysis.detectedOpenings.map((item) => (
                            <span key={item.labelHe} className="chip">
                              {item.labelHe} ({item.count})
                            </span>
                          ))
                        ) : (
                          <span className="chip">׳›׳׳¢׳˜ ׳׳™׳ ׳›׳¨׳’׳¢ ׳©׳₪׳” ׳₪׳•׳×׳—׳×</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mindlab-hints">
                    <h4>׳›׳™׳•׳•׳ ׳™ ׳©׳—׳¨׳•׳¨ ׳׳•׳׳׳¦׳™׳</h4>
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
                  title="׳׳” ׳”׳׳˜׳•׳₪׳ ׳׳¡׳›׳™׳ ׳׳¨׳׳•׳× ׳׳—׳¨׳™ ׳”׳©׳—׳¨׳•׳¨"
                  subtitle="׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳× ׳©׳”׳•׳₪׳›׳•׳× ׳'׳׳ ׳¨׳׳•׳•׳ ׳˜׳™' ׳'׳׳₪׳©׳¨ ׳׳©׳§׳•׳'"
                  badgeText={`${newOptionsAfterRelease.length}`}
                >
                  <p className="muted-text">
                    ׳›׳׳ ׳׳×׳” ׳׳•׳“׳“/׳× ׳©׳™׳ ׳•׳™ ׳×׳•׳“׳¢׳×׳™ ׳‘׳₪׳•׳¢׳: ׳׳™׳׳• ׳׳•׳₪׳¦׳™׳•׳× ׳ ׳¢׳©׳•׳× ג€׳׳₪׳©׳¨ ׳׳©׳§׳•׳ג€.
                  </p>
                  <div className="mindlab-consent-list">
                    {newOptionsAfterRelease.length ? (
                      newOptionsAfterRelease.map((item) => (
                        <div key={item} className="mini-pill">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="mini-pill">׳¢׳“׳™׳™׳ ׳׳ ׳¡׳•׳׳ ׳• ׳׳•׳₪׳¦׳™׳•׳× ׳—׳“׳©׳•׳×</div>
                    )}
                  </div>
                </MenuSection>
              </section>
            </div>
          </aside>
        </div>
        )}

        {activeMindTabId === 'simulator' && (
          <section className="panel-card mindlab-workspace-panel">
            <div className="panel-card__head">
              <div>
                <h3>׳¡׳™׳׳•׳׳˜׳•׳¨ ׳©׳™׳—׳•׳× ׳׳©׳—׳¨׳¨׳•׳×</h3>
                <p>׳×׳¨׳’׳•׳ ׳׳׳•׳§׳“ ׳‘׳׳™ ׳׳”׳¢׳׳™׳¡ ׳׳× ׳©׳׳¨ ׳—׳׳§׳™ ׳”׳“׳£. ׳׳₪׳©׳¨ ׳׳˜׳¢׳•׳ ׳׳©׳₪׳˜ ׳—׳–׳¨׳” ׳׳–׳¨׳™׳׳× ׳”׳¢׳‘׳•׳“׳”.</p>
              </div>
            </div>
            <LiberatingConversationSimulator
              onLoadPatientText={loadPatientTextFromTrainingTool}
              onSignal={handleTrainingSignal}
            />
          </section>
        )}

        {activeMindTabId === 'pattern-master' && (
          <section className="panel-card mindlab-workspace-panel">
            <div className="panel-card__head">
              <div>
                <h3>׳׳׳¡׳˜׳¨ ׳¨׳¦׳₪׳™׳</h3>
                <p>׳›׳׳ ׳¢׳•׳‘׳“׳™׳ ׳¨׳§ ׳¢׳ ׳¨׳¦׳₪׳™׳ ׳•-flowchart. ׳˜׳¢׳™׳ ׳× ׳׳©׳₪׳˜ ׳×׳—׳–׳™׳¨ ׳׳•׳×׳ ׳׳–׳¨׳™׳׳× ׳”׳¢׳‘׳•׳“׳” ׳›׳©׳¦׳¨׳™׳.</p>
              </div>
            </div>
            <PatternSequenceMaster
              onLoadPatientText={loadPatientTextFromTrainingTool}
              onSignal={handleTrainingSignal}
            />
          </section>
        )}

        {activeMindTabId === 'history' && (
          <section className="panel-card mindlab-workspace-panel">
            <div className="panel-card__head">
              <div>
                <h3>׳”׳™׳¡׳˜׳•׳¨׳™׳” - Mind Liberating</h3>
                <p>׳“׳•׳’׳׳׳•׳×, ׳¨׳¦׳₪׳™׳ ׳•׳¡׳©׳ ׳™׳ ׳©׳ ׳©׳׳¨׳• ׳×׳—׳× ׳׳¢׳‘׳“׳× ׳©׳—׳¨׳•׳¨ ׳”׳×׳•׳“׳¢׳”.</p>
              </div>
              <div className="alchemy-card__actions">
                <Link to="/library" className="secondary-link-button">
                  ׳₪׳×׳— ׳¡׳₪׳¨׳™׳™׳” ׳׳׳׳”
                </Link>
              </div>
            </div>

            <div className="mindlab-history-list">
              {mindHistoryItems.length ? (
                mindHistoryItems.map((item) => (
                  <article key={item.id} className="mindlab-history-item">
                    <div className="mindlab-history-item__head">
                      <strong>{item.summaryHe ?? '׳₪׳¨׳™׳˜ ׳”׳™׳¡׳˜׳•׳¨׳™׳”'}</strong>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString('he-IL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </time>
                    </div>
                    {item.patientText ? <p className="mindlab-history-item__patient">׳׳˜׳•׳₪׳: {item.patientText}</p> : null}
                    {item.sentenceText ? <p className="mindlab-history-item__response">׳×׳’׳•׳‘׳”/׳¨׳¦׳£: {item.sentenceText}</p> : null}
                    <div className="mindlab-history-item__actions">
                      {item.patientText ? (
                        <button type="button" onClick={() => loadPatientTextFromTrainingTool(item.patientText)}>
                          ׳˜׳¢׳ ׳׳©׳₪׳˜ ׳׳–׳¨׳™׳׳× ׳”׳¢׳‘׳•׳“׳”
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel-card panel-card--soft">
                  <p className="muted-text">
                    ׳¢׳“׳™׳™׳ ׳׳™׳ ׳₪׳¨׳™׳˜׳™׳ ׳‘׳”׳™׳¡׳˜׳•׳¨׳™׳” ׳©׳ ׳׳¢׳‘׳“׳” ׳–׳•. ׳©׳׳•׳¨/׳™ ׳¡׳©׳, ׳“׳•׳’׳׳” ׳׳”׳¡׳™׳׳•׳׳˜׳•׳¨ ׳׳• ׳¨׳¦׳£ ׳׳”׳׳׳¡׳˜׳¨.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
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

      <AlchemistCompanion mood={companionMood} message={companionMessage} pulseKey={companionPulseKey} />
    </div>
  )
}

