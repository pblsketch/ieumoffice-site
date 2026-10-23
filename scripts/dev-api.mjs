// Serves api/ask.js on http://localhost:8787 so `npm run dev` can use the question
// helper; vite.config.js proxies /api here. Run with `npm run dev:api`.
//
// Credentials come from .env.local: the Vercel OIDC token that `vercel env pull`
// writes (refreshed by @vercel/oidc while it runs) plus the federation IDs.

import { createServer } from 'node:http'
import { POST } from '../api/ask.js'

const PORT = 8787

createServer(async (req, res) => {
  if (req.url !== '/api/ask' || req.method !== 'POST') {
    res.writeHead(404).end()
    return
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const controller = new AbortController()
  res.on('close', () => controller.abort())
  const response = await POST(
    new Request(`http://localhost:${PORT}${req.url}`, {
      method: 'POST',
      headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string'),
      body: Buffer.concat(chunks),
      signal: controller.signal,
    }),
  )
  res.writeHead(response.status, Object.fromEntries(response.headers))
  for await (const chunk of response.body) res.write(chunk)
  res.end()
}).listen(PORT, () => console.log(`question helper on http://localhost:${PORT}/api/ask`))
