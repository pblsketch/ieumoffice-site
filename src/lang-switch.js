// The language menu in the top bar (markup added at build time by vite.config.js)
// and a one-line offer when the browser's language has its own copy of the page.

import './lang.css'
import { LANG } from './i18n.js'

const STORE = 'ieum-lang'
const menu = document.querySelector('[data-lang-menu]')
const links = [...document.querySelectorAll('[data-lang-link]')]

function remember(code) {
  try {
    localStorage.setItem(STORE, code)
  } catch {
    // storage turned off: the offer may come back, nothing else changes
  }
}

function remembered() {
  try {
    return localStorage.getItem(STORE)
  } catch {
    return null
  }
}

/** the same spot on the other language's page: help pages use the same #names everywhere */
function keepHash() {
  for (const a of links) a.hash = location.hash
}
keepHash()
addEventListener('hashchange', keepHash)
for (const a of links) a.addEventListener('click', () => remember(a.dataset.langLink))

if (menu) {
  document.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false
  })
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false
      menu.querySelector('summary').focus()
    }
  })
}

/** the site language a browser locale reads best, or null */
function siteLangFor(tag) {
  const t = tag.toLowerCase()
  if (/^zh-(tw|hk|mo|hant)/.test(t)) return 'zh-TW'
  for (const code of ['ko', 'en', 'ja', 'es']) if (t === code || t.startsWith(`${code}-`)) return code
  return null
}

const OFFER = {
  ko: ['이 페이지는 한국어로도 있습니다.', '한국어로 보기'],
  en: ['This page is also available in English.', 'Read in English'],
  ja: ['このページは日本語でもご覧いただけます。', '日本語で見る'],
  'zh-TW': ['本頁也有繁體中文版。', '以繁體中文閱讀'],
  es: ['Esta página también está disponible en español.', 'Leer en español'],
}
const CLOSE = { ko: '닫기', en: 'Close', ja: '閉じる', 'zh-TW': '關閉', es: 'Cerrar' }

function offerBrowserLanguage() {
  if (remembered()) return
  const wanted = (navigator.languages ?? [navigator.language]).map(siteLangFor).find(Boolean)
  if (!wanted || wanted === LANG) return
  const target = links.find((a) => a.dataset.langLink === wanted)
  if (!target) return
  const [text, action] = OFFER[wanted]
  const bar = document.createElement('aside')
  bar.className = 'lang-offer'
  bar.lang = wanted
  bar.innerHTML =
    `<p></p><a class="btn btn-small"></a>` +
    `<button type="button" class="lang-offer-close" aria-label="${CLOSE[wanted]}">×</button>`
  bar.querySelector('p').textContent = text
  const go = bar.querySelector('a')
  go.textContent = action
  go.href = target.href
  go.addEventListener('click', () => remember(wanted))
  bar.querySelector('button').addEventListener('click', () => {
    remember(LANG)
    bar.remove()
  })
  document.body.prepend(bar)
}
offerBrowserLanguage()
