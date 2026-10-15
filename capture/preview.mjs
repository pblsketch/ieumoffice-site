// Screenshot the built site at a few sizes: node capture/preview.mjs <url> <outdir>
import { createRequire } from 'node:module'
const req = createRequire((process.env.IEUM_REPO ?? 'E:/github/openoffice-release') + '/package.json')
const { chromium } = req('@playwright/test')
const [url = 'http://localhost:4173/', out = 'capture/preview'] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge' })
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.log('pageerror', e.message))
  page.on('console', (m) => m.type() === 'error' && console.log('console', m.text()))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${out}/${name}-top.png` })
  // walk down so the scroll-triggered pieces run, then take the whole page
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(250)
  }
  for (const id of ['ai']) {
    await page.evaluate((id) => document.getElementById(id).querySelector('.ai-demo').scrollIntoView({ block: 'center' }), id)
    await page.waitForTimeout(9000)
    await page.screenshot({ path: `${out}/${name}-${id}.png` })
  }
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true })
  await page.close()
}
await browser.close()
