// GET /api/stats — download counts and stars for the landing page.
//
// Visitors' browsers used to ask the GitHub API themselves. Unsigned requests get
// 60 an hour per IP, and a mobile network puts many phones behind one IP, so the
// page fell back to the daily snapshot. Here the CDN keeps one answer for ten
// minutes, so GitHub sees a handful of requests an hour however many people visit.
// GITHUB_TOKEN, when set in the Vercel project, lifts the server's own limit.

import { countDownloads } from '../lib/growth-count.js'

const REPO = 'pblsketch/ieumoffice'
const SNAPSHOT_URL = `https://raw.githubusercontent.com/${REPO}/main/docs/tracking/growth-latest.json`

async function github(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ieumoffice-site' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return res.json()
}

async function liveNumbers() {
  const releases = []
  for (let page = 1; page <= 10; page++) {
    const list = await github(`/repos/${REPO}/releases?per_page=100&page=${page}`)
    releases.push(...list)
    if (list.length < 100) break
  }
  const repo = await github(`/repos/${REPO}`)
  return { ...countDownloads(releases), stars: repo.stargazers_count, source: 'live' }
}

async function snapshotNumbers() {
  const res = await fetch(SNAPSHOT_URL)
  if (!res.ok) throw new Error(`snapshot ${res.status}`)
  return { ...(await res.json()), source: 'snapshot' }
}

export async function GET() {
  let body
  let maxAge = 600
  try {
    body = await liveNumbers()
  } catch {
    try {
      body = await snapshotNumbers()
      maxAge = 120 // try GitHub again soon
    } catch {
      return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
  }
  return Response.json(body, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'CDN-Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=86400, stale-if-error=86400`,
    },
  })
}
