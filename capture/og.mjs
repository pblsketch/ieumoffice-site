// Render capture/og.html to public/og.png (1200x630): node capture/og.mjs
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const req = createRequire(join(process.env.IEUM_REPO ?? 'E:/github/openoffice-release', 'package.json'))
const { chromium } = req('@playwright/test')

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(pathToFileURL(join(HERE, 'og.html')).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(HERE, '../public/og.png') })
await browser.close()
console.log('wrote public/og.png')
