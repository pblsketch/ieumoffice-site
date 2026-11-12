// Checks every translated page against its Korean original (npm run check:i18n).
//
// A translation must keep the page's machinery: the same element ids (the app
// and the install/connect help link to #names), the same data-* hooks the
// scripts look for, the same scripts and captures. Its own links must stay in
// its language folder, its <head> must name its own address, and no Korean
// sentence may be left behind.
//
//   node scripts/check-i18n.mjs            every language, every page
//   node scripts/check-i18n.mjs en         one language
//   node scripts/check-i18n.mjs en faq     one page of one language

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'node-html-parser'
import { LANGS } from '../src/i18n.js'

const ROOT = resolve(import.meta.dirname, '..')
const PAGES = [
  ['index.html', '/'],
  ['updates.html', '/updates'],
  ['story.html', '/story'],
  ['install.html', '/install'],
  ['connect.html', '/connect'],
  ['faq.html', '/faq'],
  ['public/privacy.html', '/privacy.html'],
  ['public/legal.html', '/legal.html'],
]
// links into the site that are not pages: they are the same file in every language
const SHARED = /^\/(?:shots|icons|src|cli|assets)\/|^\/(?:favicon|apple-touch-icon|icon-|og\.png|form-banner\.png|site\.webmanifest|robots\.txt|sitemap\.xml)/
// Hangul a translation may keep: the maker's name, "Hangul (한글)" written the way Hancom writes it, the
// language menu's 한국어, and the Korean product name where it is quoted as a name (trademark line, JSON-LD)
const HANGUL_ALLOWED = ['박준일', '한글', '한국어', '이음오피스', '이음 오피스']
// a line break between two CJK characters, perhaps across an inline tag
const CJK = '　-〿぀-ヿ一-鿿＀-￯'
const INLINE = '(?:a|b|strong|code|span|kbd|em|i|u|small|mark)'
// (text to text, text to an opening tag, a closing tag to text; two separate links in a row are fine)
const BREAK = '[ \\t]*\\n[ \\t]*'
const CJK_GAP = new RegExp(
  `[${CJK}]${BREAK}(?:<${INLINE}\\b[^>]*>)?[${CJK}]|[${CJK}]</${INLINE}>${BREAK}[${CJK}]`,
  'g',
)


const [onlyLang, onlyPage] = process.argv.slice(2)
let failures = 0
let checked = 0

for (const lang of LANGS.filter((l) => l.dir && (!onlyLang || l.code === onlyLang || l.dir === onlyLang))) {
  for (const [file, address] of PAGES) {
    const name = file.replace(/^public\//, '').replace(/\.html$/, '')
    if (onlyPage && onlyPage !== name) continue
    const original = resolve(ROOT, file)
    const translated = resolve(ROOT, file.startsWith('public/') ? `public/${lang.dir}/${name}.html` : `${lang.dir}/${name}.html`)
    const label = `${lang.dir}/${name}.html`
    if (!existsSync(translated)) {
      report(label, ['missing'])
      continue
    }
    checked++
    report(label, comparePage(readFileSync(original, 'utf8'), readFileSync(translated, 'utf8'), lang, address))
  }
}

console.log(failures ? `\n${failures} page(s) with problems, ${checked} checked` : `${checked} page(s) OK`)
process.exit(failures ? 1 : 0)

function report(label, problems) {
  if (!problems.length) return
  failures++
  console.log(`✗ ${label}`)
  for (const p of problems.slice(0, 40)) console.log(`    ${p}`)
  if (problems.length > 40) console.log(`    … ${problems.length - 40} more`)
}

function comparePage(koHtml, html, lang, address) {
  const problems = []
  // the Korean privacy page carries the owner's English version at its end; translations leave it out
  const english = koHtml.indexOf('<h1 id="english"')
  if (english > 0) koHtml = `${koHtml.slice(0, koHtml.lastIndexOf('<hr', english))}</main></body></html>`
  const ko = parse(koHtml, { comment: false })
  const tr = parse(html, { comment: false })

  // language and own address
  const htmlLang = tr.querySelector('html')?.getAttribute('lang')
  if (htmlLang !== lang.code) problems.push(`<html lang="${htmlLang}"> should be "${lang.code}"`)
  const own = `https://ieumoffice.com/${lang.dir}${address === '/' ? '/' : address}`
  const canonical = tr.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (ko.querySelector('link[rel="canonical"]') && canonical !== own) problems.push(`canonical is ${canonical}, should be ${own}`)
  const ogUrl = tr.querySelector('meta[property="og:url"]')?.getAttribute('content')
  if (ko.querySelector('meta[property="og:url"]') && ogUrl !== own) problems.push(`og:url is ${ogUrl}, should be ${own}`)
  const ogLocale = tr.querySelector('meta[property="og:locale"]')?.getAttribute('content')
  if (ko.querySelector('meta[property="og:locale"]') && ogLocale !== lang.og) problems.push(`og:locale is ${ogLocale}, should be ${lang.og}`)

  // the same ids: help pages are linked by #name from the app and from each other
  diffSets(problems, 'id', ids(ko), ids(tr))
  // the same script hooks
  diffSets(problems, 'data attribute', dataHooks(ko), dataHooks(tr))
  // data-* values that are data, not words, must match exactly
  for (const attr of ['data-marks', 'data-t', 'data-c', 'data-player']) {
    diffSets(problems, attr, values(ko, attr), values(tr, attr))
  }
  // scripts, captures and icons
  diffSets(problems, 'script', values(ko, 'src', 'script'), values(tr, 'src', 'script'))
  diffSets(problems, 'image', values(ko, 'src', 'img'), values(tr, 'src', 'img'))
  const count = (root, sel) => root.querySelectorAll(sel).length
  for (const sel of ['section', 'details', 'ol', 'figure', 'svg']) {
    if (count(ko, sel) !== count(tr, sel)) problems.push(`<${sel}> count ${count(tr, sel)}, original has ${count(ko, sel)}`)
  }

  // links inside the site go to this language's copy
  for (const a of tr.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href')
    // links that say which language they open (the language line, "the Korean original applies")
    if (a.getAttribute('hreflang')) continue
    if (!href.startsWith('/') || href.startsWith('//') || SHARED.test(href)) continue
    if (href !== `/${lang.dir}` && !href.startsWith(`/${lang.dir}/`)) problems.push(`link ${href} leaves /${lang.dir}/`)
  }
  for (const a of tr.querySelectorAll('a[href^="https://ieumoffice.com"]')) {
    const href = a.getAttribute('href')
    const path = href.replace('https://ieumoffice.com', '') || '/'
    if (!SHARED.test(path) && !path.startsWith(`/${lang.dir}/`) && path !== `/${lang.dir}`) problems.push(`link ${href} leaves /${lang.dir}/`)
  }

  // nothing left in Korean (text, attributes, the page title)
  const leftovers = new Set()
  const scan = (text, where) => {
    let rest = text
    for (const word of HANGUL_ALLOWED) rest = rest.split(word).join('')
    const m = rest.match(/[ㄱ-ㆎ가-힣][^<>\n]{0,30}/)
    if (m) leftovers.add(`${where}: "${m[0].trim()}"`)
  }
  scan(tr.querySelector('head')?.toString() ?? '', 'head')
  for (const node of walkText(tr.querySelector('body') ?? tr)) {
    // the Korean name in running text only on the legal page, where the trademark line quotes it
    if (address !== '/legal.html' && node.includes('이음오피스')) leftovers.add(`text: "이음오피스" (write IeumOffice)`)
    scan(node, 'text')
  }
  for (const el of tr.querySelectorAll('*')) {
    for (const [k, v] of Object.entries(el.attributes)) if (k !== 'href') scan(v, `@${k}`)
  }
  problems.push(...[...leftovers].slice(0, 15).map((l) => `Korean left: ${l}`))

  // Japanese and Chinese: a source line break between two CJK characters shows as a space
  if (lang.code === 'ja' || lang.code === 'zh-TW') {
    const body = html.replace(/<(script|style|pre)\b[\s\S]*?<\/\1>/gi, '')
    const gaps = body.match(CJK_GAP) ?? []
    if (gaps.length) problems.push(`${gaps.length} line break(s) between CJK characters (they render as spaces): ${JSON.stringify(gaps[0])}`)
  }
  return problems
}

function ids(root) {
  return new Set(root.querySelectorAll('[id]').map((el) => el.id))
}

function dataHooks(root) {
  const out = new Set()
  for (const el of root.querySelectorAll('*')) {
    for (const k of Object.keys(el.attributes)) if (k.startsWith('data-')) out.add(k)
  }
  return out
}

function values(root, attr, tag = '*') {
  return new Set(root.querySelectorAll(`${tag}[${attr}]`).map((el) => el.getAttribute(attr)))
}

function diffSets(problems, what, a, b) {
  for (const x of a) if (!b.has(x)) problems.push(`${what} missing: ${trim(x)}`)
  for (const x of b) if (!a.has(x)) problems.push(`${what} added: ${trim(x)}`)
}

function trim(s) {
  return s.length > 70 ? `${s.slice(0, 70)}…` : s
}

function* walkText(node) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) yield child.rawText
    else if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') yield* walkText(child)
  }
}
