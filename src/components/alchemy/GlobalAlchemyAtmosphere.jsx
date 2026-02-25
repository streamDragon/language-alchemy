import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Music2, Sparkles, Volume2, VolumeX } from 'lucide-react'
import {
  ALCHEMY_SIGNAL_EVENT,
  emitAlchemySignal,
  inferAlchemySignalFromText,
} from '../../utils/alchemySignals'

const GLOBAL_AUDIO_PREFS_KEY = 'la.v2.globalAlchemyAudio'

function readGlobalAudioPrefs() {
  if (typeof window === 'undefined') {
    return { enabled: false, muted: false, asked: false, dontAskAgain: false }
  }
  try {
    const raw = window.localStorage.getItem(GLOBAL_AUDIO_PREFS_KEY)
    if (!raw) return { enabled: false, muted: false, asked: false, dontAskAgain: false }
    const parsed = JSON.parse(raw)
    return {
      enabled: Boolean(parsed?.enabled),
      muted: Boolean(parsed?.muted),
      asked: Boolean(parsed?.asked),
      dontAskAgain: Boolean(parsed?.dontAskAgain),
    }
  } catch {
    return { enabled: false, muted: false, asked: false, dontAskAgain: false }
  }
}

function writeGlobalAudioPrefs(nextPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GLOBAL_AUDIO_PREFS_KEY, JSON.stringify(nextPrefs))
  } catch {
    // no-op
  }
}

function routeLabelHe(pathname) {
  if (!pathname || pathname === '/') return 'דשבורד האלכימיה'
  if (pathname.includes('/mind-liberating')) return 'Mind Liberating Language'
  if (pathname.includes('/beyond')) return 'Beyond Words'
  if (pathname.includes('/clean-questions') || pathname.includes('/questions')) return 'Clean + Meta Model'
  if (pathname.includes('/empathy')) return 'Empathy'
  if (pathname.includes('/boundaries')) return 'Mind Liberating Boundaries'
  if (pathname.includes('/phrasing')) return 'Sentence Morpher'
  if (pathname.includes('/library')) return 'ספריית המעבדה'
  return 'מעבדת השפה'
}

function getAudioContext(audioContextRef) {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return null

  let ctx = audioContextRef.current
  if (!ctx) {
    try {
      ctx = new AudioContextCtor()
      audioContextRef.current = ctx
    } catch {
      return null
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  return ctx
}

function playAlchemyCue(audioContextRef, cue = 'tap', muted = false) {
  if (muted) return
  const ctx = getAudioContext(audioContextRef)
  if (!ctx) return

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.value = 0.0001

  const cueMap = {
    tap: { freqs: [520, 660], volume: 0.026, attack: 0.01, release: 0.11, wave: 'triangle' },
    hover: { freqs: [932, 1244], volume: 0.012, attack: 0.01, release: 0.08, wave: 'sine' },
    sparkle: { freqs: [740, 988, 1480], volume: 0.018, attack: 0.01, release: 0.16, wave: 'sine' },
    whoosh: { freqs: [240, 320, 410], volume: 0.02, attack: 0.02, release: 0.18, wave: 'triangle' },
    harp: { freqs: [440, 660, 990, 1320], volume: 0.022, attack: 0.015, release: 0.28, wave: 'sine' },
    gong: { freqs: [196, 247, 294, 392], volume: 0.03, attack: 0.04, release: 0.52, wave: 'sine' },
    rise: { freqs: [330, 440, 554, 740], volume: 0.018, attack: 0.02, release: 0.24, wave: 'triangle' },
    softAlert: { freqs: [300, 270], volume: 0.014, attack: 0.01, release: 0.18, wave: 'triangle' },
  }

  const preset = cueMap[cue] ?? cueMap.tap

  preset.freqs.forEach((frequency, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    const startAt = now + index * 0.012

    osc.type = preset.wave
    osc.frequency.setValueAtTime(frequency, startAt)

    if (cue === 'whoosh') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(120, frequency * 0.7), startAt + 0.12)
    }
    if (cue === 'rise') {
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.25, startAt + 0.18)
    }

    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.linearRampToValueAtTime(preset.volume / (index + 1), startAt + preset.attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + preset.attack + preset.release)

    osc.connect(gain)
    if (panner) {
      panner.pan.value = (index % 2 ? 1 : -1) * 0.2
      gain.connect(panner)
      panner.connect(master)
    } else {
      gain.connect(master)
    }

    osc.start(startAt)
    osc.stop(startAt + preset.attack + preset.release + 0.05)
  })
}

function stopAmbient(ambientRef) {
  const ambient = ambientRef.current
  if (!ambient) return
  ambientRef.current = null

  const stopAt = ambient.ctx.currentTime + 0.4
  try {
    ambient.master.gain.cancelScheduledValues(ambient.ctx.currentTime)
    ambient.master.gain.setValueAtTime(Math.max(ambient.master.gain.value, 0.0001), ambient.ctx.currentTime)
    ambient.master.gain.exponentialRampToValueAtTime(0.0001, stopAt)
  } catch {
    // no-op
  }

  window.setTimeout(() => {
    ambient.oscillators.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // no-op
      }
    })
    try {
      ambient.lfo.stop()
      ambient.lfo.disconnect()
      ambient.lfoGain.disconnect()
      ambient.master.disconnect()
    } catch {
      // no-op
    }
  }, 450)
}

function startAmbient(audioContextRef, ambientRef) {
  if (ambientRef.current) return
  const ctx = getAudioContext(audioContextRef)
  if (!ctx) return

  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.setValueAtTime(0.0001, ctx.currentTime)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 0.08
  lfoGain.gain.value = 0.006
  lfo.connect(lfoGain)

  const oscillators = [174, 246.94, 392].map((freq, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = index === 1 ? 'triangle' : 'sine'
    osc.frequency.value = freq
    gain.gain.value = [0.010, 0.007, 0.0045][index] ?? 0.005
    filter.type = 'lowpass'
    filter.frequency.value = index === 0 ? 520 : 1100
    filter.Q.value = 0.6

    lfoGain.connect(gain.gain)
    osc.connect(gain)
    gain.connect(filter)
    filter.connect(master)
    osc.start()
    return osc
  })

  lfo.start()
  master.gain.exponentialRampToValueAtTime(0.024, ctx.currentTime + 1.3)

  ambientRef.current = {
    ctx,
    master,
    oscillators,
    lfo,
    lfoGain,
  }
}

function makeBurstPieces(variant = 'success') {
  const count = variant === 'mastery' ? 26 : variant === 'hover' ? 7 : 18
  const colors =
    variant === 'soft'
      ? ['#a78bfa', '#22d3ee', '#fde68a']
      : ['#7c3aed', '#22d3ee', '#facc15', '#f59e0b', '#a78bfa']

  return Array.from({ length: count }, (_, index) => {
    const ratio = index / count
    const angle = ratio * 360 + (Math.random() * 14 - 7)
    const distance =
      (variant === 'mastery' ? 110 : variant === 'hover' ? 36 : 78) + Math.random() * 34
    const size = (variant === 'hover' ? 5 : 7) + Math.random() * (variant === 'mastery' ? 6 : 3)
    const delay = Math.random() * 120
    const duration = (variant === 'hover' ? 340 : 700) + Math.random() * (variant === 'mastery' ? 420 : 220)
    const shape = Math.random() > 0.72 ? 'star' : Math.random() > 0.45 ? 'line' : 'dot'
    return {
      id: `p-${index}-${Math.round(Math.random() * 1e6)}`,
      angle,
      distance,
      size,
      delay,
      duration,
      color: colors[index % colors.length],
      shape,
    }
  })
}

function getSignalPresentation(signal) {
  const type = signal?.type ?? 'success'
  if (type === 'mastery') {
    return {
      mood: 'dancing',
      cue: 'gong',
      followCue: 'rise',
      burst: 'mastery',
      message: signal.message || 'מאסטרי! השדה נפתח, זהב מתפזר בכל המעבדה.',
    }
  }
  if (type === 'saved') {
    return {
      mood: 'clap',
      cue: 'harp',
      burst: 'success',
      message: signal.message || 'נשמר. אוספים זהב קטן צעד אחרי צעד.',
    }
  }
  if (type === 'copied') {
    return {
      mood: 'happy',
      cue: 'sparkle',
      burst: 'soft',
      message: signal.message || 'הועתק. אפשר להדביק ולהמשיך לעבוד.',
    }
  }
  if (type === 'nearly') {
    return {
      mood: 'surprised',
      cue: 'whoosh',
      burst: 'soft',
      message: signal.message || 'כמעט. עוד כיוונון קטן וזה נפתח.',
    }
  }
  if (type === 'soft-alert') {
    return {
      mood: 'thinking',
      cue: 'softAlert',
      burst: null,
      message: signal.message || 'בדיקה קטנה ונמשיך.',
    }
  }
  if (type === 'route') {
    return {
      mood: 'happy',
      cue: null,
      burst: null,
      message: signal.message || `ברוכים הבאים ל-${routeLabelHe(signal.pathname)}.`,
    }
  }
  if (type === 'hover') {
    return {
      mood: 'happy',
      cue: 'hover',
      burst: 'hover',
      message: signal.message || '',
    }
  }
  if (type === 'whoosh') {
    return {
      mood: 'happy',
      cue: 'whoosh',
      burst: 'soft',
      message: signal.message || 'טוענים שכבה חדשה במעבדה.',
    }
  }
  return {
    mood: 'dancing',
    cue: 'harp',
    burst: 'success',
    message: signal.message || 'מעולה! השדה זז.',
  }
}

function companionFaceForMood(mood) {
  if (mood === 'dancing') return '🧚✨'
  if (mood === 'clap') return '🧚👏'
  if (mood === 'surprised') return '🧚😲'
  if (mood === 'thinking') return '🧚🫧'
  return '🧚'
}

function randomViewportPoint() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  const x = window.innerWidth * (0.35 + Math.random() * 0.3)
  const y = window.innerHeight * (0.18 + Math.random() * 0.28)
  return { x, y }
}

export default function GlobalAlchemyAtmosphere() {
  const location = useLocation()
  const audioContextRef = useRef(null)
  const ambientRef = useRef(null)
  const audioPrefsRef = useRef(readGlobalAudioPrefs())
  const hoverTargetTimesRef = useRef(new WeakMap())
  const cardHoverTimesRef = useRef(new WeakMap())
  const companionResetTimerRef = useRef(null)
  const idRef = useRef(1)
  const mountedRef = useRef(false)
  const statusScanTimerRef = useRef(null)

  const [audioPrefs, setAudioPrefs] = useState(() => readGlobalAudioPrefs())
  const [showConsent, setShowConsent] = useState(() => {
    const prefs = readGlobalAudioPrefs()
    return !prefs.asked && !prefs.dontAskAgain
  })
  const [companion, setCompanion] = useState({
    mood: 'happy',
    message: 'פותחים שדה. צעד קטן, שינוי מורגש.',
    pulseKey: 0,
  })
  const [ripples, setRipples] = useState([])
  const [bursts, setBursts] = useState([])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const particleDots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: `dot-${index}`,
        top: 6 + Math.random() * 88,
        left: 4 + Math.random() * 92,
        size: 4 + Math.random() * 8,
        hue: ['#7c3aed', '#22d3ee', '#facc15'][index % 3],
        delay: -Math.random() * 18,
        duration: 14 + Math.random() * 18,
      })),
    [],
  )

  const particleLinks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        id: `link-${index}`,
        top: 8 + Math.random() * 80,
        left: 8 + Math.random() * 74,
        width: 80 + Math.random() * 180,
        rotate: -35 + Math.random() * 70,
        delay: -Math.random() * 12,
        duration: 10 + Math.random() * 14,
      })),
    [],
  )

  useEffect(() => {
    audioPrefsRef.current = audioPrefs
    writeGlobalAudioPrefs(audioPrefs)

    if (audioPrefs.enabled && !audioPrefs.muted) {
      startAmbient(audioContextRef, ambientRef)
    } else {
      stopAmbient(ambientRef)
    }
  }, [audioPrefs])

  useEffect(() => {
    window.__LA_GLOBAL_ALCHEMY_AUDIO__ = true
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      window.__LA_GLOBAL_ALCHEMY_AUDIO__ = false
      if (companionResetTimerRef.current) {
        window.clearTimeout(companionResetTimerRef.current)
      }
      if (statusScanTimerRef.current) {
        window.clearTimeout(statusScanTimerRef.current)
      }
      stopAmbient(ambientRef)
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch {
          // no-op
        }
      }
    }
  }, [])

  const spawnRipple = (x, y, variant = 'tap') => {
    if (prefersReducedMotion) return
    const id = `r-${idRef.current++}`
    const next = {
      id,
      x,
      y,
      variant,
    }
    setRipples((current) => [...current.slice(-14), next])
    window.setTimeout(() => {
      if (!mountedRef.current) return
      setRipples((current) => current.filter((item) => item.id !== id))
    }, 820)
  }

  const spawnBurst = (x, y, variant = 'success') => {
    if (prefersReducedMotion) return
    const id = `b-${idRef.current++}`
    const next = {
      id,
      x,
      y,
      variant,
      pieces: makeBurstPieces(variant),
    }
    setBursts((current) => [...current.slice(-10), next])
    window.setTimeout(() => {
      if (!mountedRef.current) return
      setBursts((current) => current.filter((item) => item.id !== id))
    }, variant === 'mastery' ? 1800 : variant === 'hover' ? 750 : 1250)
  }

  const triggerCompanion = (mood, message) => {
    setCompanion((current) => ({
      mood,
      message: message || current.message,
      pulseKey: current.pulseKey + 1,
    }))

    if (companionResetTimerRef.current) {
      window.clearTimeout(companionResetTimerRef.current)
    }
    companionResetTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return
      setCompanion((current) => ({
        ...current,
        mood: 'happy',
        pulseKey: current.pulseKey + 1,
      }))
    }, 2200)
  }

  const handleSignalRef = useRef(() => {})
  handleSignalRef.current = (signal) => {
    const presentation = getSignalPresentation(signal)
    const muted = !audioPrefsRef.current.enabled || audioPrefsRef.current.muted

    if (presentation.cue) {
      playAlchemyCue(audioContextRef, presentation.cue, muted)
    }
    if (presentation.followCue && !muted) {
      window.setTimeout(() => {
        if (!mountedRef.current) return
        playAlchemyCue(audioContextRef, presentation.followCue, false)
      }, 180)
    }

    const point =
      typeof signal?.x === 'number' && typeof signal?.y === 'number'
        ? { x: signal.x, y: signal.y }
        : randomViewportPoint()

    if (presentation.burst) {
      spawnBurst(point.x, point.y, presentation.burst)
    }
    if (signal?.ripple && typeof signal.x === 'number' && typeof signal.y === 'number') {
      spawnRipple(signal.x, signal.y, 'wave')
    }

    triggerCompanion(presentation.mood, presentation.message)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onAlchemySignal = (event) => {
      const detail = event?.detail ?? {}
      handleSignalRef.current(detail)
    }

    window.addEventListener(ALCHEMY_SIGNAL_EVENT, onAlchemySignal)
    return () => {
      window.removeEventListener(ALCHEMY_SIGNAL_EVENT, onAlchemySignal)
    }
  }, [])

  useEffect(() => {
    emitAlchemySignal('route', {
      pathname: location.pathname,
      message: `נכנסת ל-${routeLabelHe(location.pathname)}.`,
    })
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const interactiveSelector =
      'button, a, [role="button"], [role="tab"], .chip, .template-pill, .nav-pill'
    const cardSelector = [
      '.alchemy-card',
      '.panel-card',
      '.hero-card',
      '.dashboard-card',
      '.mini-card',
      '.menu-section',
      '.mindlab-training-card',
      '.simulator-context-card',
      '.pattern-master__patternCard',
      '.flow-step-button',
      '.source-story-item',
      '.lesson-block',
    ].join(', ')

    const onPointerOver = (event) => {
      if (event.pointerType === 'touch') return
      if (!(event.target instanceof Element)) return

      const now = Date.now()
      const interactive = event.target.closest(interactiveSelector)
      if (interactive) {
        const previous = hoverTargetTimesRef.current.get(interactive) ?? 0
        if (now - previous > 180) {
          hoverTargetTimesRef.current.set(interactive, now)
          if (!prefersReducedMotion) {
            spawnBurst(event.clientX, event.clientY, 'hover')
          }
          playAlchemyCue(
            audioContextRef,
            'hover',
            !audioPrefsRef.current.enabled || audioPrefsRef.current.muted,
          )
        }
      }

      const card = event.target.closest(cardSelector)
      if (card) {
        const previous = cardHoverTimesRef.current.get(card) ?? 0
        if (now - previous > 520) {
          cardHoverTimesRef.current.set(card, now)
          if (!prefersReducedMotion) {
            const rect = card.getBoundingClientRect()
            spawnBurst(rect.left + rect.width * 0.82, rect.top + rect.height * 0.18, 'hover')
          }
        }
      }
    }

    const onClick = (event) => {
      if (!(event.target instanceof Element)) return
      const interactive = event.target.closest(interactiveSelector)
      if (!interactive) return

      const rect = interactive.getBoundingClientRect()
      const x = Number.isFinite(event.clientX) && event.clientX > 0 ? event.clientX : rect.left + rect.width / 2
      const y = Number.isFinite(event.clientY) && event.clientY > 0 ? event.clientY : rect.top + rect.height / 2

      spawnRipple(x, y, 'tap')
      playAlchemyCue(audioContextRef, 'tap', !audioPrefsRef.current.enabled || audioPrefsRef.current.muted)
    }

    document.addEventListener('pointerover', onPointerOver, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerover', onPointerOver, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return undefined

    const processStatusNodes = () => {
      const nodes = document.querySelectorAll('.status-line, [aria-live="polite"]')
      nodes.forEach((node) => {
        if (node.closest('.alchemy-companion, .mindlab-companion')) return
        const text = String(node.textContent ?? '').trim()
        if (!text) return
        const previousText = node.dataset.alchemyLastText ?? ''
        if (text === previousText) return
        node.dataset.alchemyLastText = text
        const inferred = inferAlchemySignalFromText(text)
        if (inferred) {
          emitAlchemySignal(inferred.type, { message: inferred.message })
        }
      })
    }

    processStatusNodes()

    const observer = new MutationObserver(() => {
      if (statusScanTimerRef.current) {
        window.clearTimeout(statusScanTimerRef.current)
      }
      statusScanTimerRef.current = window.setTimeout(processStatusNodes, 30)
    })

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      if (statusScanTimerRef.current) {
        window.clearTimeout(statusScanTimerRef.current)
        statusScanTimerRef.current = null
      }
    }
  }, [])

  const applySoundConsent = ({ enabled, dontAskAgain = false }) => {
    setAudioPrefs((current) => ({
      ...current,
      enabled,
      muted: enabled ? false : current.muted,
      asked: true,
      dontAskAgain: current.dontAskAgain || dontAskAgain,
    }))
    setShowConsent(false)
    emitAlchemySignal(enabled ? 'success' : 'whoosh', {
      message: enabled ? 'צלילי האלכימיה הופעלו.' : 'הצלילים נשארו כבויים כרגע.',
    })
  }

  const isSoundOn = audioPrefs.enabled && !audioPrefs.muted

  return (
    <>
      <div className="alchemy-atmosphere" aria-hidden="true">
        <div className="alchemy-quantum-field">
          {particleLinks.map((link) => (
            <span
              key={link.id}
              className="alchemy-link"
              style={{
                top: `${link.top}%`,
                left: `${link.left}%`,
                width: `${link.width}px`,
                transform: `rotate(${link.rotate}deg)`,
                animationDelay: `${link.delay}s`,
                animationDuration: `${link.duration}s`,
              }}
            />
          ))}

          {particleDots.map((dot) => (
            <span
              key={dot.id}
              className="alchemy-dot"
              style={{
                top: `${dot.top}%`,
                left: `${dot.left}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                background: dot.hue,
                animationDelay: `${dot.delay}s`,
                animationDuration: `${dot.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="alchemy-fx-layer">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className={`alchemy-ripple alchemy-ripple--${ripple.variant}`}
              style={{ left: ripple.x, top: ripple.y }}
            />
          ))}

          {bursts.map((burst) => (
            <span
              key={burst.id}
              className={`alchemy-burst alchemy-burst--${burst.variant}`}
              style={{ left: burst.x, top: burst.y }}
            >
              {burst.pieces.map((piece) => (
                <span
                  key={piece.id}
                  className={`alchemy-burst__piece is-${piece.shape}`}
                  style={{
                    '--alchemy-angle': `${piece.angle}deg`,
                    '--alchemy-distance': `${piece.distance}px`,
                    '--alchemy-delay': `${piece.delay}ms`,
                    '--alchemy-duration': `${piece.duration}ms`,
                    '--alchemy-color': piece.color,
                    '--alchemy-size': `${piece.size}px`,
                  }}
                />
              ))}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="alchemy-sound-toggle"
        aria-pressed={isSoundOn}
        onClick={() => {
          setAudioPrefs((current) => {
            if (!current.enabled) {
              return { ...current, enabled: true, muted: false, asked: true }
            }
            return { ...current, muted: !current.muted, asked: true }
          })
          emitAlchemySignal('whoosh', {
            message: isSoundOn ? 'הצלילים הושתקו.' : 'צלילי האלכימיה פעילים.',
          })
        }}
        title={isSoundOn ? 'השתק צלילים' : 'הפעל צלילים'}
      >
        <span className="alchemy-sound-toggle__icon" aria-hidden="true">
          {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </span>
        <span className="alchemy-sound-toggle__text">{isSoundOn ? 'Magic On' : 'Magic Off'}</span>
      </button>

      {showConsent && (
        <div className="alchemy-sound-consent" role="dialog" aria-modal="true" aria-label="הפעלת צלילי אלכימיה">
          <div className="alchemy-sound-consent__card">
            <div className="alchemy-sound-consent__eyebrow">
              <Music2 size={16} aria-hidden="true" />
              <span>Alchemy Sound Layer</span>
            </div>
            <h3>להפעיל צלילי אלכימיה קסומים?</h3>
            <p>
              מוזיקת ambient עדינה + צלילי chime/harp/gong קלים לפעולות, הצלחה ומאסטרי.
              אפשר להשתיק בכל רגע מהכפתור למעלה.
            </p>
            <div className="alchemy-sound-consent__actions">
              <button type="button" onClick={() => applySoundConsent({ enabled: true })}>
                כן, להפעיל
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

      <aside
        className={`alchemy-companion mood-${companion.mood}`}
        aria-live="polite"
        aria-label="Alchemist Companion"
      >
        <div key={companion.pulseKey} className="alchemy-companion__orb" aria-hidden="true">
          {companionFaceForMood(companion.mood)}
        </div>
        <div className="alchemy-companion__bubble">
          <strong>
            <Sparkles size={12} aria-hidden="true" /> Alchemist Companion
          </strong>
          <span>{companion.message}</span>
        </div>
      </aside>
    </>
  )
}
