// Render capture/form-banner.html to public/form-banner.png (1600x400 @2x):
// node capture/form-banner.mjs
//
// Google Forms takes this file as the feedback survey's header: the survey's
// 테마 맞춤설정 -> 헤더 이미지 선택 -> URL 사용 points at
// https://ieumoffice.vercel.app/form-banner.png
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const req = createRequire(join(process.env.IEUM_REPO ?? 'E:/github/openoffice-release', 'package.json'))
const { chromium } = req('@playwright/test')

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({
  viewport: { width: 1600, height: 400 },
  deviceScaleFactor: 2,
})
await page.goto(pathToFileURL(join(HERE, 'form-banner.html')).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(HERE, '../public/form-banner.png') })
await browser.close()
console.log('wrote public/form-banner.png')
