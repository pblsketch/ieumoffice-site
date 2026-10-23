// Keeps one row per answered question in the owner's Google Sheet, through an
// Apps Script web app (QA_LOG_URL, guarded by QA_LOG_SECRET). The sheet deletes
// rows older than 90 days by itself. No IP or browser details are sent, and
// anything that looks like an email, phone, resident or card number is masked
// first. Without the two variables nothing is logged.

const PATTERNS = [
  /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, // email
  /\d{6}\s?-\s?[1-8]\d{6}/g, // resident registration number
  /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, // card number
  /\b0\d{1,2}[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g, // phone number
]

export function mask(text) {
  return PATTERNS.reduce((out, pattern) => out.replace(pattern, '***'), String(text ?? ''))
}

/** "답함", "자료에 없음", or the error code when no answer came out */
export function outcome(answer, errorCode) {
  if (!answer) return `답 못 함(${errorCode ?? 'failed'})`
  return answer.includes('제가 가진 안내 자료에는') ? '자료에 없음' : '답함'
}

export async function logTurn({ question, answer, sources, version, turn, errorCode }) {
  const url = process.env.QA_LOG_URL
  const secret = process.env.QA_LOG_SECRET
  if (!url || !secret) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        question: mask(question),
        answer: mask(answer),
        outcome: outcome(answer, errorCode),
        sources: sources.map((s) => s.title).join('\n'),
        version,
        turn,
      }),
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    // a missed row must never cost the user an answer
    console.error('log failed', error?.name)
  }
}
