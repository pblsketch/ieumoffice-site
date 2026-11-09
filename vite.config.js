import { resolve } from 'node:path'
import { defineConfig } from 'vite'

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

// five pages: the landing page, the release history at /updates, the maker's story at /story,
// the install help at /install and the AI connect help at /connect
export default defineConfig({
  define: { __SHOTS__: JSON.stringify(SHOTS) },
  plugins: [shotsOrigin],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        updates: resolve(import.meta.dirname, 'updates.html'),
        story: resolve(import.meta.dirname, 'story.html'),
        install: resolve(import.meta.dirname, 'install.html'),
        connect: resolve(import.meta.dirname, 'connect.html'),
        faq: resolve(import.meta.dirname, 'faq.html'),
      },
    },
  },
  // the question helper's server function runs separately in dev (`npm run dev:api`)
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
