// POST /api/ask — Cloudflare Pages Function for the site's question helper.

import { logTurn } from '../../lib/log.js'
import { KB_VERSION, ask, retrieve } from '../../lib/qa.js'

const MAX_QUESTION = 500
const MAX_TURN = 2000
const MAX_TURNS = 6
const ALLOWED_ORIGIN =
  /^(https:\/\/(www\.)?ieumoffice\.com|https:\/\/([a-z0-9-]+\.)?ieumoffice-site\.pages\.dev|https:\/\/([a-z0-9-]+\.)?ieumoffice\.pages\.dev|http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?)$/

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

export async function onRequestPost({ request, env, waitUntil }) {
  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_ORIGIN.test(origin)) return json(403, { type: 'error', code: 'origin' })

  const ip =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    'unknown'
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
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  const streamTask = (async () => {
    const send = (event) => writer.write(encoder.encode(`${JSON.stringify(event)}\n`))
    let answer = ''
    let sources = []
    let errorCode = null
    try {
      for await (const event of ask(messages, { signal: request.signal, env })) {
        if (event.type === 'text') answer += event.text
        if (event.type === 'sources') sources = event.items
        await send(event)
      }
    } catch (error) {
      if (!request.signal.aborted) {
        console.error('ask failed', error?.status ?? error?.code ?? error?.name)
        const code = [429, 529].includes(error?.status) ? 'busy' : 'failed'
        errorCode = code
        const answered = Boolean(answer)
        const items = answered
          ? []
          : await retrieve(messages.at(-1).content).then((found) => found.slice(0, 3), () => [])
        await send({ type: 'error', code, items: items.map(({ title, url }) => ({ title, url })) })
      }
    } finally {
      await writer.close().catch(() => {})
    }
    if (!request.signal.aborted) {
      await logTurn({
        question: messages.at(-1).content,
        answer,
        sources,
        version: KB_VERSION,
        turn: messages.filter((m) => m.role === 'user').length,
        errorCode,
        env,
      })
    }
  })()

  waitUntil(streamTask)

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function onRequestGet() {
  return json(405, { type: 'error', code: 'method' })
}
