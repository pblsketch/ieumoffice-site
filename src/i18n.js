// The site's languages. Korean pages live at the root (/, /updates, …); every
// other language is a copy of the same pages under its own folder (/en/,
// /en/updates, …). A page knows its language from <html lang>.
//
// The Vite plugin in vite.config.js and scripts/check-i18n.mjs read the same
// list, so a language added here is built, linked and checked everywhere.

export const LANGS = [
  { code: 'ko', dir: '', label: '한국어', og: 'ko_KR' },
  { code: 'en', dir: 'en', label: 'English', og: 'en_US' },
  { code: 'ja', dir: 'ja', label: '日本語', og: 'ja_JP' },
  { code: 'zh-TW', dir: 'zh-tw', label: '繁體中文', og: 'zh_TW' },
  { code: 'es', dir: 'es', label: 'Español', og: 'es_ES' },
]

const htmlLang = typeof document === 'undefined' ? 'ko' : document.documentElement.lang
export const LANG = LANGS.find((l) => l.code === htmlLang)?.code ?? 'ko'
const current = LANGS.find((l) => l.code === LANG)

/** this language's address for a site path: path('/install#mac') → '/en/install#mac' */
export function path(sitePath) {
  return current.dir ? `/${current.dir}${sitePath}` : sitePath
}

/** the entry for this page's language in a { ko, en, ja, 'zh-TW', es } table, Korean when missing */
export function pick(table) {
  return table[LANG] ?? table.ko
}

/** number format for counters */
export const numberLocale = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', 'zh-TW': 'zh-TW', es: 'es-ES' }[LANG]

// the site's own pages, as the question helper's sources and answers link them
const SITE_PAGES = /^(?:https:\/\/ieumoffice\.com)?(\/(?:updates|story|install|connect|faq|privacy(?:\.html)?|legal\.html)?(?=$|[#?]).*)$/

/** a link to a Korean page of this site, pointed at this language's copy; other links stay */
export function localUrl(url) {
  if (!url || !current.dir) return url
  const m = String(url).match(SITE_PAGES)
  return m ? `https://ieumoffice.com${path(m[1])}` : url
}
