// GET /api/stats — Cloudflare Pages Function for download counts and stars.
// Uses Cloudflare's edge Cache API so GitHub sees at most a handful of requests
// an hour however many visitors load the page.

import { countDownloads } from '../../lib/growth-count.js'

const REPO = 'pblsketch/ieumoffice'
const SNAPSHOT_URL = `https://raw.githubusercontent.com/${REPO}/main/docs/tracking/growth-latest.json`

async function github(path, token) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ieumoffice-site' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return res.json()
}

async function liveNumbers(token) {
  const releases = []
  for (let page = 1; page <= 10; page++) {
    const list = await github(`/repos/${REPO}/releases?per_page=100&page=${page}`, token)
    releases.push(...list)
    if (list.length < 100) break
  }
  const repo = await github(`/repos/${REPO}`, token)
  return { ...countDownloads(releases), stars: repo.stargazers_count, source: 'live' }
}

async function snapshotNumbers() {
  const res = await fetch(SNAPSHOT_URL)
  if (!res.ok) throw new Error(`snapshot ${res.status}`)
  return { ...(await res.json()), source: 'snapshot' }
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches?.default
  const cacheKey = new Request(new URL('/api/stats', request.url).toString(), { method: 'GET' })
  if (cache) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
  }

  let body
  let maxAge = 600
  try {
    body = await liveNumbers(env?.GITHUB_TOKEN)
  } catch {
    try {
      body = await snapshotNumbers()
      maxAge = 120
    } catch {
      return Response.json(
        { error: 'unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  }

  const response = Response.json(body, {
    headers: {
      'Cache-Control': `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=86400, stale-if-error=86400`,
      'CDN-Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=86400, stale-if-error=86400`,
    },
  })
  if (cache) waitUntil(cache.put(cacheKey, response.clone()))
  return response
}
