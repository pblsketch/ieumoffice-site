// POST /api/ask — the site's question helper (src/ask.js is the chat window).
//
// Body: { messages: [{ role: 'user' | 'assistant', content }] }, the last one the
// user's question. Answers as newline-delimited JSON events:
//   { type: 'found', items }   pieces the search picked (titles and links)
//   { type: 'text', text }     a slice of the answer
//   { type: 'sources', items } the pieces the answer cited
//   { type: 'error', code, items } no answer; items are the closest pieces to read instead
//
// Questions are not logged or stored. Errors log only their status.

import { ask, retrieve } from '../lib/qa.js'

const MAX_QUESTION = 500
const MAX_TURN = 2000
const MAX_TURNS = 6
const ALLOWED_ORIGIN = /^(https:\/\/ieumoffice\.com|https:\/\/ieumoffice-[a-z0-9-]+\.vercel\.app|http:\/\/localhost(:\d+)?)$/

// a soft per-instance limit; the Vercel firewall rule is the real one
const recent = new Map()
function tooMany(ip) {
  const now = Date.now()
  const times = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  if (times.filter((t) => now - t < 60 * 1000).length >= 6 || times.length >= 60) return true
  times.push(now)
  recent.set(ip, times)
  if (recent.size > 5000) recent.clear()
  return false
}

function readMessages(body) {
  const list = body?.messages
  if (!Array.isArray(list) || !list.length) return null
  const messages = list.slice(-MAX_TURNS).map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: String(m?.content ?? '').slice(0, MAX_TURN).trim(),
  }))
  while (messages.length && messages[0].role !== 'user') messages.shift()
  const last = messages.at(-1)
  if (!last || last.role !== 'user' || !last.content || last.content.length > MAX_QUESTION) return null
  return messages.filter((m) => m.content)
}

function json(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(request) {
  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_ORIGIN.test(origin)) return json(403, { type: 'error', code: 'origin' })

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (tooMany(ip)) return json(429, { type: 'error', code: 'limited' })

  let messages
  try {
    const raw = await request.text()
    messages = raw.length <= 16000 ? readMessages(JSON.parse(raw)) : null
  } catch {
    messages = null
  }
  if (!messages) return json(400, { type: 'error', code: 'invalid' })

  const encoder = new TextEncoder()
  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      let answered = false
      try {
        for await (const event of ask(messages, { signal: request.signal })) {
          if (event.type === 'text') answered = true
          send(event)
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error('ask failed', error?.status ?? error?.code ?? error?.name)
          const code = [429, 529].includes(error?.status) ? 'busy' : 'failed'
          // without an answer, point at the pieces the question's own words find
          const items = answered
            ? []
            : await retrieve(messages.at(-1).content).then((found) => found.slice(0, 3), () => [])
          send({ type: 'error', code, items: items.map(({ title, url }) => ({ title, url })) })
        }
      }
      controller.close()
    },
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function GET() {
  return json(405, { type: 'error', code: 'method' })
}
