import { existsSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { defineConfig } from 'vite'
import { LANGS } from './src/i18n.js'

// The app captures are most of the site's bytes, so the production build takes
// them from cdn.ieumoffice.com: a Cloudflare-proxied name for this same Vercel
// project that serves only /shots/ (vercel.json). Cloudflare keeps copies, so
// repeat downloads do not count against Vercel's data transfer. Preview and
// local builds keep same-origin paths: a preview's new captures are not on the
// production deployment yet.
const SHOTS = process.env.VERCEL_ENV === 'production' ? 'https://cdn.ieumoffice.com' : ''
const shotsOrigin = {
  name: 'shots-origin',
  apply: 'build',
  enforce: 'post',
  // on the finished pages: Vite writes srcset lists back after transformIndexHtml
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'asset' && file.fileName.endsWith('.html')) {
        file.source = String(file.source).replace(/(["\s,])\/shots\//g, `$1${SHOTS}/shots/`)
      }
    }
  },
}

// six pages: the landing page, the release history at /updates, the maker's story at /story,
// the install help at /install, the AI connect help at /connect and the questions at /faq.
// Korean is at the root; each other language keeps the same six under its folder (src/i18n.js).
const PAGES = ['index', 'updates', 'story', 'install', 'connect', 'faq']
const ORIGIN = 'https://ieumoffice.com'

const pageAddress = (dir, page) => `${dir ? `/${dir}` : ''}/${page === 'index' ? '' : page}`

const input = {}
for (const lang of LANGS) {
  for (const page of PAGES) {
    const file = resolve(import.meta.dirname, lang.dir, `${page}.html`)
    if (existsSync(file)) input[lang.dir ? `${lang.dir}/${page}` : page === 'index' ? 'main' : page] = file
  }
}

/** The language links every page carries: alternates in <head> for search engines,
 *  and the language menu in the top bar (src/lang-switch.js adds the behaviour). */
const languageLinks = {
  name: 'language-links',
  transformIndexHtml(html, ctx) {
    const rel = relative(import.meta.dirname, ctx.filename).split(sep)
    const page = rel.at(-1).replace(/\.html$/, '')
    const here = LANGS.find((l) => l.dir === (rel.length > 1 ? rel[0] : '')) ?? LANGS[0]
    const others = LANGS.filter((l) => existsSync(resolve(import.meta.dirname, l.dir, `${page}.html`)))
    const alternates = [
      ...others.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${ORIGIN}${pageAddress(l.dir, page)}" />`),
      `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${pageAddress('', page)}" />`,
    ].join('\n    ')
    const items = others
      .map((l) => {
        const current = l === here ? ' aria-current="true"' : ''
        return `<li><a href="${pageAddress(l.dir, page)}" hreflang="${l.code}" lang="${l.code}" data-lang-link="${l.code}"${current}>${l.label}</a></li>`
      })
      .join('')
    const menu =
      `<details class="lang-menu" data-lang-menu>` +
      `<summary aria-label="Language / 언어: ${here.label}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg><span>${here.label}</span></summary>` +
      `<ul>${items}</ul></details>\n      `
    return html
      .replace('</head>', `  ${alternates}\n  </head>`)
      .replace(/(<header class="nav[^>]*>[\s\S]*?)(<a class="btn btn-small")/, `$1${menu}$2`)
  },
}

export default defineConfig({
  define: { __SHOTS__: JSON.stringify(SHOTS) },
  plugins: [languageLinks, shotsOrigin],
  build: { rollupOptions: { input } },
  // the question helper's server function runs separately in dev (`npm run dev:api`)
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
