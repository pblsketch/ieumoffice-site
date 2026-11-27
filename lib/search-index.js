// Compact BM25 inverted index built at KB-generation time so Cloudflare Pages
// Functions stay well within the 10 ms Free-plan CPU budget on cold starts.
//
// Each posting packs (docId << 2) | (inTitle ? 2 : 0) | (inText ? 1 : 0).

import { tokenize } from './tokenize.js'

const K1 = 1.2
const B = 0.75

export function buildIndex(chunks) {
  const titleLens = new Array(chunks.length)
  const textLens = new Array(chunks.length)
  const postings = new Map()
  let titleSum = 0
  let textSum = 0

  for (let i = 0; i < chunks.length; i++) {
    const titleTokens = tokenize(chunks[i].title)
    const textTokens = tokenize(chunks[i].text)
    titleLens[i] = titleTokens.length
    textLens[i] = textTokens.length
    titleSum += titleTokens.length
    textSum += textTokens.length

    const flags = new Map()
    for (const t of titleTokens) flags.set(t, 2)
    for (const t of textTokens) flags.set(t, (flags.get(t) ?? 0) | 1)
    for (const [term, flag] of flags) {
      let arr = postings.get(term)
      if (!arr) {
        arr = []
        postings.set(term, arr)
      }
      arr.push((i << 2) | flag)
    }
  }

  // Deterministic key order so repeated builds produce byte-identical output.
  const sortedPostings = {}
  for (const term of [...postings.keys()].sort()) sortedPostings[term] = postings.get(term)

  return {
    n: chunks.length,
    avgTitle: chunks.length ? titleSum / chunks.length : 1,
    avgText: chunks.length ? textSum / chunks.length : 1,
    titleLens,
    textLens,
    postings: sortedPostings,
  }
}

export function searchIndex(idx, query, { limit = 24, titleBoost = 2 } = {}) {
  const terms = tokenize(query)
  if (!terms.length) return []

  const scores = new Map()
  const { n, avgTitle, avgText, titleLens, textLens, postings } = idx

  for (const term of terms) {
    const list = postings[term]
    if (!list) continue
    let titleDf = 0
    let textDf = 0
    for (let k = 0; k < list.length; k++) {
      const f = list[k] & 3
      if (f & 2) titleDf++
      if (f & 1) textDf++
    }
    const titleIdf = titleDf ? Math.log(1 + (n - titleDf + 0.5) / (titleDf + 0.5)) : 0
    const textIdf = textDf ? Math.log(1 + (n - textDf + 0.5) / (textDf + 0.5)) : 0

    for (let k = 0; k < list.length; k++) {
      const packed = list[k]
      const docId = packed >> 2
      const f = packed & 3
      let delta = 0
      if (f & 2) {
        delta += titleBoost * titleIdf * ((K1 + 1) / (1 + K1 * (1 - B + (B * titleLens[docId]) / avgTitle)))
      }
      if (f & 1) {
        delta += textIdf * ((K1 + 1) / (1 + K1 * (1 - B + (B * textLens[docId]) / avgText)))
      }
      if (delta > 0) scores.set(docId, (scores.get(docId) ?? 0) + delta)
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([docId]) => docId)
}
