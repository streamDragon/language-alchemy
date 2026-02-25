export const ALCHEMY_SIGNAL_EVENT = 'alchemy:signal'

function normalizeMessageText(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function emitAlchemySignal(type, detail = {}) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent(ALCHEMY_SIGNAL_EVENT, {
        detail: {
          ...(detail ?? {}),
          type,
          timestamp: Date.now(),
        },
      }),
    )
  } catch {
    // no-op
  }
}

export function inferAlchemySignalFromText(rawText) {
  const text = normalizeMessageText(rawText)
  if (!text) return null

  const lower = text.toLowerCase()

  if (/(מאסטר|master|הושלמ|כל השלבים|גונג|gong)/i.test(text)) {
    return {
      type: 'mastery',
      message: text,
    }
  }

  if (/(כמעט|almost)/i.test(text)) {
    return {
      type: 'nearly',
      message: text,
    }
  }

  if (/(נשמר|שמר|saved|snapshot|favorite|מועדפ)/i.test(text)) {
    return {
      type: 'saved',
      message: text,
    }
  }

  if (/(הועתק|copied|clipboard)/i.test(text)) {
    return {
      type: 'copied',
      message: text,
    }
  }

  if (
    /(מעולה|great|excellent|הצלחה|הושלם|נטען|נפתחה|חדש|opened|loaded|ready|מוכן)/i.test(
      text,
    )
  ) {
    return {
      type: 'success',
      message: text,
    }
  }

  if (/(לא הצלחתי|failed|error|נכשל)/i.test(text) || lower.includes('לא ')) {
    return {
      type: 'soft-alert',
      message: text,
    }
  }

  return null
}

