/**
 * Captures IeumOffice screens for the website.
 *
 *   node capture/capture.mjs [--probe]
 *
 * Runs the already-built app from the release checkout (read only: nothing is
 * written there) with a scratch HOME and userData, so no account name, e-mail
 * or recent file of the person running it can appear in a picture.
 *
 * Tabs are separate WebContentsViews inside one window, so a page screenshot
 * shows either the tab strip or the editor, never both. The main process
 * captures the window's own contents and every visible child view, and
 * composite.py lays them back together at their bounds.
 */
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = process.env.IEUM_REPO ?? 'E:/github/openoffice-release'
const SHELL_DIR = join(REPO, 'apps/shell')
const SAMPLES = process.env.IEUM_SAMPLES ?? join(HERE, 'samples')
const RAW = join(HERE, 'raw')
const OUT = join(HERE, 'out')
const PROBE = process.argv.includes('--probe')
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'))

const req = createRequire(join(REPO, 'package.json'))
const { _electron: electron } = req('@playwright/test')
const electronPath = createRequire(join(SHELL_DIR, 'package.json'))('electron')

const W = 1440
const H = 860

// Paths show up in some scenes (the `@` document list prints each file's
// folder). IEUM_SCRATCH_ROOT puts the scratch profile at a short neutral path
// instead of the temp folder, which carries the Windows user name. It must
// not exist yet; it is removed at the end.
const SCRATCH_ROOT = process.env.IEUM_SCRATCH_ROOT

function makeScratch() {
  let root
  if (SCRATCH_ROOT) {
    if (existsSync(SCRATCH_ROOT)) throw new Error(`IEUM_SCRATCH_ROOT already exists: ${SCRATCH_ROOT}`)
    root = resolve(SCRATCH_ROOT)
    mkdirSync(root, { recursive: true })
  } else {
    root = mkdtempSync(join(tmpdir(), 'ieum-site-shots-'))
  }
  const home = join(root, 'home')
  const userData = join(root, 'userdata')
  const docs = join(root, '내 문서')
  const saveDir = join(root, 'save')
  for (const d of [home, userData, docs, saveDir, join(home, '.codex'), join(home, '.claude')]) mkdirSync(d, { recursive: true })
  cpSync(SAMPLES, join(docs, '가을 북페어'), { recursive: true })
  writeFileSync(
    join(userData, 'app-settings.json'),
    JSON.stringify({ onboardingSeen: true, folderRoots: [docs], defaultSaveDir: docs }, null, 2),
  )
  writeFileSync(
    join(userData, 'ai-settings.json'),
    JSON.stringify({ providers: {}, subscriptionNoticeSeen: true }, null, 2),
  )
  return { root, home, userData, docs, dispose: () => rmSync(root, { recursive: true, force: true }) }
}

async function launch(scratch) {
  const { ELECTRON_RUN_AS_NODE: _drop, ...hostEnv } = process.env
  return electron.launch({
    executablePath: electronPath,
    args: ['--force-device-scale-factor=2', SHELL_DIR],
    env: {
      ...hostEnv,
      HOME: scratch.home,
      USERPROFILE: scratch.home,
      GENOFFICE_USER_DATA: scratch.userData,
      GENOFFICE_AUTH_DIR: join(scratch.home, '.ieumoffice'),
      // Codex finds its folder from the Windows profile, not USERPROFILE: without
      // these the vendor programs answer with the signed-in state of whoever runs this
      CODEX_HOME: join(scratch.home, '.codex'),
      CLAUDE_CONFIG_DIR: join(scratch.home, '.claude'),
      GENOFFICE_NO_SPARE_VIEW: '1',
      GENOFFICE_LANG: 'ko',
    },
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Window contents plus every visible child view, as PNG layers with DIP bounds. */
async function grabLayers(app) {
  return app.evaluate(async ({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows().find((w) => w.isVisible() && !w.getParentWindow())
    const [cw, ch] = win.getContentSize()
    const layers = []
    const base = await win.webContents.capturePage()
    layers.push({ x: 0, y: 0, width: cw, height: ch, png: base.toPNG().toString('base64') })
    const walk = async (view) => {
      for (const child of view.children ?? []) {
        if (child.webContents && child.getVisible?.() !== false && child.webContents !== win.webContents) {
          const b = child.getBounds()
          if (b.width > 0 && b.height > 0) {
            const img = await child.webContents.capturePage()
            layers.push({ ...b, png: img.toPNG().toString('base64') })
          }
        }
        await walk(child)
      }
    }
    await walk(win.contentView)
    return { width: cw, height: ch, layers }
  })
}

/** crop: [x, y, width, height] in window pixels (DIP), for pictures shown at half width */
async function shot(app, name, crop) {
  const grab = await grabLayers(app)
  const dir = join(RAW, name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const meta = { width: grab.width, height: grab.height, layers: [] }
  grab.layers.forEach((l, i) => {
    const file = `${i}.png`
    writeFileSync(join(dir, file), Buffer.from(l.png, 'base64'))
    meta.layers.push({ file, x: l.x, y: l.y, width: l.width, height: l.height })
  })
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
  mkdirSync(OUT, { recursive: true })
  const args = [join(HERE, 'composite.py'), dir, join(OUT, `${name}.png`)]
  if (crop) args.push(crop.join(','))
  execFileSync('python', args, { stdio: 'inherit' })
}

async function shellPage(app) {
  for (const p of app.windows()) {
    if (await p.locator('.tab-bar').count()) return p
  }
  throw new Error('shell page not found')
}

/** The page of the tab that is showing now (the last one opened). */
async function editorPage(app, before) {
  for (let i = 0; i < 60; i++) {
    const fresh = app.windows().filter((p) => !before.includes(p))
    if (fresh.length) return fresh[fresh.length - 1]
    await sleep(500)
  }
  throw new Error('editor page did not appear')
}

async function openFromHome(app, shell, fileName) {
  await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
  await sleep(600)
  const home = app.windows().find((p) => p.url().includes('home') || p === shell)
  const row = shell.locator('.recent-row').filter({ hasText: fileName }).first()
  await row.waitFor({ state: 'visible', timeout: 15_000 })
  const before = [...app.windows()]
  await row.dblclick()
  return editorPage(app, before)
}

const tabOf = async (shell, file) =>
  (await shell.evaluate(() => window.aiOfficeTabs.list())).find((t) => t.title?.includes(file))

function hideSheetStreamingNotice(app) {
  const sheet = app.windows().find((p) => p.url().includes('://sheets/'))
  return sheet?.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length === 0 && el.textContent.includes('스트리밍하는 중')) el.style.visibility = 'hidden'
    }
  })
}

/** PDF reading assist: two highlights and an underline made with the H/U keys, annotation list open. */
async function pdfReadingShot(app, shell, opened) {
  const entry = opened.find(([name]) => name === 'pdf')
  if (!entry) return
  await shell.locator('.tab-title', { hasText: entry[1] }).first().click()
  await sleep(2500)
  const pdf = app.windows().find((p) => p.url().includes('://pdf/'))
  const spans = await pdf.evaluate(() =>
    [...document.querySelectorAll('.textLayer span')]
      .filter((s) => s.textContent.trim().length > 12)
      .slice(0, 8)
      .map((s) => {
        const r = s.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      }),
  )
  const marks = [
    [1, 'h'],
    [3, 'u'],
    [5, 'h'],
  ]
  for (const [i, key] of marks) {
    const s = spans[i]
    if (!s) continue
    await pdf.mouse.move(s.x + 1, s.y + s.h / 2)
    await pdf.mouse.down()
    await pdf.mouse.move(s.x + s.w - 1, s.y + s.h / 2, { steps: 12 })
    await pdf.mouse.up()
    await sleep(500)
    await pdf.keyboard.press(key)
    await sleep(500)
  }
  // drop the last selection with the AI panel's clear button, which also hides the selection bar
  await pdf.locator('.ai-scope-clear').first().click().catch(() => {})
  await pdf.evaluate(() => getSelection().removeAllRanges())
  // a click on the blank page margin beside the info card deselects the last highlight
  await pdf.mouse.click(1362, 520)
  await sleep(400)
  await sleep(400)
  await pdf.getByRole('button', { name: '보기', exact: true }).first().click()
  await sleep(500)
  await pdf.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent && x.innerText.trim() === '주석')
    b[b.length - 1]?.click()
  })
  await sleep(1500)
  await shot(app, 'pdf-reading')
  console.log('wrote pdf-reading')
}

/** Split view: the Word plan on the left, the budget sheet dropped on the right edge. */
async function splitShot(app, shell, opened) {
  const left = opened.find(([name]) => name === 'docs')
  const right = opened.find(([name]) => name === 'sheets')
  if (!left || !right) return
  const a = await tabOf(shell, left[1])
  const b = await tabOf(shell, right[1])
  await shell.evaluate((id) => window.aiOfficeTabs.activate(id), a.id)
  await sleep(1500)
  const bounds = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((w) => w.isVisible() && !w.getParentWindow())
      .getContentBounds(),
  )
  await shell.evaluate((id) => window.aiOfficeTabs.tearOff(id, 500, 400), b.id)
  await shell.evaluate((p) => window.aiOfficeTabs.dragTornWindow(p.x, p.y), {
    x: bounds.x + bounds.width - 8,
    y: bounds.y + Math.round(bounds.height / 2),
  })
  await sleep(600)
  await shell.evaluate(() => window.aiOfficeTabs.endTornDrag())
  await sleep(4000)
  await hideSheetStreamingNotice(app)
  await sleep(300)
  await shot(app, 'split')
  console.log('wrote split')
}

/** Spacebar Quick Look over Home on the sample Word plan. */
async function quickLookShot(app, shell) {
  await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
  await sleep(1500)
  const row = shell.locator('.recent-row, .recent-item').filter({ hasText: '.docx' }).first()
  await row.locator('.col-check').first().click()
  await shell.evaluate(() => document.activeElement?.blur())
  await shell.keyboard.press(' ')
  await sleep(2500)
  await shot(app, 'quicklook')
  console.log('wrote quicklook')
  await shell.keyboard.press('Escape')
}

/** The AI panel input of an editor tab, emptied. Nothing typed here is ever sent. */
async function aiInputOf(app, shell, opened, name, urlPart) {
  const entry = opened.find(([n]) => n === name)
  if (!entry) return null
  await shell.locator('.tab-title', { hasText: entry[1] }).first().click()
  await sleep(2500)
  const page = app.windows().find((p) => p.url().includes(urlPart))
  const input = page?.locator('textarea').first()
  if (!input || !(await input.count())) return null
  await input.click()
  await input.press('Control+a')
  await input.press('Backspace')
  return { page, input }
}

async function clearAiInput(target) {
  await target.input.press('Escape').catch(() => {})
  await target.input.press('Control+a').catch(() => {})
  await target.input.press('Backspace').catch(() => {})
}

/** 0.12.3 skills: `/` in the Word editor's AI input opens the skill list. */
async function skillsSlashShot(app, shell, opened) {
  const t = await aiInputOf(app, shell, opened, 'docs', '://docs/')
  if (!t) return
  await t.input.type('/')
  await t.page.locator('.ai-skill-picker').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(800)
  await shot(app, 'skills-slash')
  console.log('wrote skills-slash')
  await clearAiInput(t)
}

/** 0.12.3 `@`: the open and recent documents in the HWP editor's AI input. */
async function docMentionShot(app, shell, opened) {
  const t = await aiInputOf(app, shell, opened, 'hwp', '://hwp/')
  if (!t) return
  await t.input.type('@')
  await t.page.locator('.ai-doc-mention-picker').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(800)
  // the lower left: the list over the AI panel and part of the form beside it
  await shot(app, 'doc-mention', [0, 346, 848, 506])
  console.log('wrote doc-mention')
  await clearAiInput(t)
}

/** 0.12.3 Settings → Skills, reached from "스킬 관리…" at the end of the `/` list. */
async function skillsSettingsShot(app, shell, opened) {
  const t = await aiInputOf(app, shell, opened, 'docs', '://docs/')
  if (!t) return
  await t.input.type('/')
  await t.page.locator('.ai-skill-picker-manage').first().click()
  await sleep(2500)
  // the settings window, without the dimmed home around it
  await shot(app, 'skills-settings', [216, 60, 1008, 602])
  console.log('wrote skills-settings')
  await shell.keyboard.press('Escape').catch(() => {})
  await sleep(600)
  await clearAiInput(t)
}

/** 0.12.5 HWP memos: a reviewed copy of the sample form with the memo panel out. */
async function hwpMemoShot(app, shell, scratch) {
  const file = join(scratch.docs, '가을 북페어', '참가신청서_검토.hwpx')
  cpSync(join(HERE, 'samples-extra', '참가신청서_검토.hwpx'), file)
  const before = [...app.windows()]
  await shell.evaluate((path) => window.aiOffice.openPath(path), file)
  const page = await editorPage(app, before)
  await page.waitForSelector('.hwp-app[data-phase="ready"]', { timeout: 90_000 })
  await sleep(3000)
  const collapse = page.locator('.ai-panel-collapse')
  if (await collapse.isVisible().catch(() => false)) await collapse.click()
  await page.locator('.memo-rail').click()
  await page.locator('.memo-card').nth(2).waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(1500)
  await shot(app, 'hwp-memo')
  console.log('wrote hwp-memo')
  if (!ONLY.length || ONLY.includes('hwp-memo-menu')) {
    // 0.12.6: the right-click menu on a selected title offers 메모
    await sleep(800)
    await page.mouse.click(900, 374)
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await sleep(400)
    await page.mouse.click(900, 374, { button: 'right' })
    await page
      .frameLocator('.hwp-editor-host iframe')
      .locator('.context-menu .md-item[data-cmd="insert:comment"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await sleep(800)
    await shot(app, 'hwp-memo-menu')
    console.log('wrote hwp-memo-menu')
    await page.keyboard.press('Escape')
    await sleep(400)
  }
  if (!ONLY.length || ONLY.includes('hwp-format-copy')) {
    // 0.12.5 format copy: Alt+C with the caret in the form's title opens the dialog
    await page.locator('.memo-panel .memo-close, .memo-panel [aria-label="닫기"]').first().click().catch(() => {})
    const editor = page.frameLocator('.hwp-editor-host iframe')
    await sleep(800)
    // the caret on the form's title, "참가 신청서"
    await page.mouse.click(900, 374)
    await sleep(500)
    await page.keyboard.press('Alt+c')
    await editor.locator('.dialog-btn-primary').first().waitFor({ state: 'visible', timeout: 10_000 })
    await sleep(1000)
    await shot(app, 'hwp-format-copy')
    console.log('wrote hwp-format-copy')
  }
}

/** 0.12.7: the memo list in its own column beside the document, next to the AI panel. */
async function hwpMemoSideShot(app, shell, scratch) {
  const file = join(scratch.docs, '가을 북페어', '참가신청서_메모칸.hwpx')
  cpSync(join(HERE, 'samples-extra', '참가신청서_검토.hwpx'), file)
  const before = [...app.windows()]
  await shell.evaluate((path) => window.aiOffice.openPath(path), file)
  const page = await editorPage(app, before)
  await page.waitForSelector('.hwp-app[data-phase="ready"]', { timeout: 90_000 })
  await sleep(3000)
  const toggle = page.locator('.memo-toggle')
  if (!(await toggle.evaluate((el) => el.classList.contains('on')))) await toggle.click()
  await page.locator('.memo-side .memo-card').nth(2).waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(1500)
  await shot(app, 'hwp-memo-side')
  console.log('wrote hwp-memo-side')
}

/** 0.12.5 Word mail merge: the 메일 ribbon tab of the sample plan. */
async function docsMailingsShot(app, shell, opened, scratch) {
  const entry = opened.find(([name]) => name === 'docs')
  if (!entry) return
  await shell.locator('.tab-title', { hasText: entry[1] }).first().click()
  await sleep(2500)
  const page = app.windows().find((p) => p.url().includes('://docs/'))
  await page.locator('.ribbon-tab', { hasText: /^\s*메일\s*$/ }).first().click()
  await sleep(1000)
  // a made-up list of participating shops; the picker is answered without a dialog
  const list = join(scratch.docs, '가을 북페어', '참가서점_명단.csv')
  writeFileSync(
    list,
    '﻿상호,대표자,부스\r\n골목책방 오늘,한서진,A-3\r\n바람서점,오지훈,B-1\r\n작은숲 출판사,이수아,C-2\r\n',
  )
  await app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, list)
  await page.locator('.ribbon-btn, button', { hasText: '메일 병합 시작' }).first().click()
  await page.locator('.modal-mailmerge').waitFor({ state: 'visible', timeout: 10_000 })
  await page.locator('.modal-mailmerge button', { hasText: '받는 사람 목록 선택' }).click()
  await page.locator('.mailmerge-field').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(1200)
  await shot(app, 'docs-mailings')
  console.log('wrote docs-mailings')
}

/** 0.12.6 local AI: Settings → AI model, adding a server on this PC (nothing is sent). */
async function localAiShot(app, shell) {
  await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
  await sleep(1200)
  await shell.locator('.account-btn').first().click()
  const card = shell.locator('.set-local-ai')
  await card.waitFor({ state: 'visible', timeout: 15_000 })
  await card.locator('button', { hasText: '서버 추가' }).first().click()
  await shell.locator('#set-local-name').fill('내 PC의 Ollama')
  await shell.locator('#set-local-address').fill('http://localhost:11434')
  await shell.locator('#set-local-address').blur()
  await card.scrollIntoViewIfNeeded()
  await shell.locator('.set-local-form').first().scrollIntoViewIfNeeded()
  await sleep(1500)
  await shot(app, 'local-ai', [216, 60, 1008, 602])
  console.log('wrote local-ai')
  await shell.keyboard.press('Escape').catch(() => {})
  await sleep(600)
}

/** 0.12.8 HTML math: the equation dialog over the sample page, with a formula typed in. */
async function htmlMathShot(app, shell, opened) {
  const entry = opened.find(([name]) => name === 'html')
  if (!entry) return
  await shell.locator('.tab-title', { hasText: entry[1] }).first().click()
  await sleep(2500)
  const page = app.windows().find((p) => p.url().includes('://html/'))
  // a block of the page picked first: the formula goes after it
  const frame = page.frameLocator('iframe').first()
  const target = frame.locator(process.env.IEUM_MATH_TARGET ?? 'main p, section p, p').first()
  await target.scrollIntoViewIfNeeded().catch(() => {})
  await target.click()
  await sleep(800)
  await page.locator('button[aria-label="수식 삽입"]').first().click()
  const dialog = page.locator('.html-math-dialog')
  await dialog.waitFor({ state: 'visible', timeout: 15_000 })
  await sleep(800)
  await dialog.locator('textarea').fill(
    process.env.IEUM_MATH_LATEX ?? '\\text{할인가}=\\text{정가}\\times\\left(1-\\frac{r}{100}\\right)',
  )
  await sleep(1500)
  await shot(app, 'html-math')
  console.log('wrote html-math')
  await page.keyboard.press('Escape').catch(() => {})
  await sleep(600)
}

/** 0.12.8 direct ChatGPT: the AI panel's connect guide with "ChatGPT를 써요" open (nothing is pressed after). */
async function chatgptDirectShot(app, shell, opened) {
  const entry = opened.find(([name]) => name === 'docs')
  if (!entry) return
  await shell.locator('.tab-title', { hasText: entry[1] }).first().click()
  await sleep(2500)
  const page = app.windows().find((p) => p.url().includes('://docs/'))
  const path = page.locator('.ai-sub-guide-path[data-path="chatgpt"]').first()
  await path.waitFor({ state: 'visible', timeout: 30_000 })
  await shot(app, 'chatgpt-ask')
  console.log('wrote chatgpt-ask')
  await path.click()
  await page.locator('.ai-sub-guide-open[data-path="chatgpt"]').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(1200)
  await shot(app, 'chatgpt-direct')
  console.log('wrote chatgpt-direct')
  // the Codex way inside it, then back: only links, nothing that starts a sign-in
  await page.locator('.ai-sub-guide-alternate[data-path="codex"]').first().click()
  await page.locator('.ai-sub-guide-open[data-path="codex"]').first().waitFor({ state: 'visible', timeout: 10_000 })
  await sleep(1200)
  await shot(app, 'chatgpt-codex-way')
  console.log('wrote chatgpt-codex-way')
}

/** 0.12.8 Settings → AI: the three subscription cards (Claude, ChatGPT, Codex). */
async function aiCardsShot(app, shell) {
  await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
  await sleep(1200)
  await shell.locator('.account-btn').first().click()
  await shell.locator('.ai-sub-card').first().waitFor({ state: 'visible', timeout: 15_000 })
  await shell.locator('.ai-sub-card[data-provider="chatgpt"]').first().scrollIntoViewIfNeeded().catch(() => {})
  await sleep(1500)
  await shot(app, 'ai-cards-0128', [216, 60, 1008, 602])
  console.log('wrote ai-cards-0128')
  await shell.keyboard.press('Escape').catch(() => {})
  await sleep(600)
}

/** 0.12.9 projects: Home → 프로젝트, a new project with its instructions saved. */
async function projectsShot(app, shell) {
  await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
  await sleep(1200)
  await shell.locator('.nav-item', { hasText: '프로젝트' }).first().click()
  await shell.getByRole('button', { name: '새 프로젝트' }).first().click()
  await shell.locator('.projects-create input').fill('가을 북페어 준비')
  await shell.getByRole('button', { name: '만들기', exact: true }).click()
  await shell.locator('.projects-textarea').waitFor({ state: 'visible', timeout: 15_000 })
  await shell
    .locator('.projects-textarea')
    .fill(
      '가을 북페어(11월 15일, 시민회관) 준비 자료를 만든다.\n' +
        '- 안내문은 학부모가 읽기 쉽게 짧은 문장으로\n' +
        '- 보고서는 개조식, 문장 끝은 "~함"\n' +
        '- 예산은 "북페어_예산표.xlsx"의 숫자만 쓴다',
    )
  await shell.getByRole('button', { name: '저장', exact: true }).click()
  await shell.getByText('저장했습니다.').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
  await sleep(1200)
  await shot(app, 'projects-0129')
  console.log('wrote projects-0129')
}

async function main() {
  const scratch = makeScratch()
  let app
  try {
    app = await launch(scratch)
    const first = await app.firstWindow()
    await first.waitForLoadState('domcontentloaded')
    await app.evaluate(({ BrowserWindow }, { W, H }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.setContentSize(W, H)
      win.center()
    }, { W, H })
    await sleep(2500)
    const shell = await shellPage(app)
    // the plan name of whatever subscription this PC has is not the product's to show
    await shell.addStyleTag({ content: '.account-sub,.ai-sub-account{display:none!important}' })

    if (PROBE) {
      console.log('windows:', app.windows().map((p) => p.url()))
      const grab = await grabLayers(app)
      console.log('layers:', grab.layers.map(({ png, ...b }) => b))
    }

    // Home with the sample folder open
    await shell.locator('.tree-name', { hasText: /^\s*가을 북페어\s*$/ }).first().click()
    await shell.locator('.recent-row').first().waitFor({ state: 'visible', timeout: 15_000 })
    await sleep(1200)

    const files = readdirSync(SAMPLES)
    const plan = [
      ['hwp', /\.hwpx?$/],
      ['docs', /\.docx$/],
      ['sheets', /\.xlsx$/],
      ['slides', /\.pptx$/],
      ['pdf', /\.pdf$/],
      ['markdown', /\.md$/],
      ['html', /\.html$/],
      ['mindmap', /\.xmind$/],
      ['epub', /\.epub$/],
    ]
    // open every sample first, so each picture carries the same tab strip and
    // only the active tab changes between them
    const opened = []
    for (const [name, re] of plan) {
      const file = files.find((f) => re.test(f))
      if (!file) {
        console.log(`skip ${name}: no sample`)
        continue
      }
      await openFromHome(app, shell, file)
      await sleep(4000)
      opened.push([name, file])
    }
    await sleep(8000)
    for (const [name, file] of opened) {
      if (ONLY.length && !ONLY.includes(name)) continue
      await shell.locator('.tab-title', { hasText: file }).first().click()
      await sleep(3500)
      if (name === 'sheets') {
        // The status line keeps the streaming notice, which names the temporary
        // copy by a random id. It says nothing about the product, so the
        // picture leaves it out.
        const sheet = app.windows().find((p) => p.url().includes('://sheets/'))
        await sheet.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            if (el.children.length === 0 && el.textContent.includes('스트리밍하는 중')) el.style.visibility = 'hidden'
          }
        })
        await sleep(300)
      }
      await shot(app, name)
      console.log(`wrote ${name}`)
    }
    const want = (name) => !ONLY.length || ONLY.includes(name)
    if (want('pdf-reading')) await pdfReadingShot(app, shell, opened)
    if (want('split')) await splitShot(app, shell, opened)
    if (want('home')) {
      await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
      await sleep(1500)
      await shot(app, 'home')
    }
    if (want('quicklook')) await quickLookShot(app, shell)
    if (want('skills-slash')) await skillsSlashShot(app, shell, opened)
    if (want('doc-mention')) await docMentionShot(app, shell, opened)
    if (want('skills-settings')) await skillsSettingsShot(app, shell, opened)
    if (want('docs-mailings')) await docsMailingsShot(app, shell, opened, scratch)
    if (want('local-ai')) await localAiShot(app, shell)
    if (want('hwp-memo') || want('hwp-format-copy') || want('hwp-memo-menu')) await hwpMemoShot(app, shell, scratch)
    if (want('hwp-memo-side')) await hwpMemoSideShot(app, shell, scratch)
    if (want('html-math')) await htmlMathShot(app, shell, opened)
    if (want('chatgpt-direct')) await chatgptDirectShot(app, shell, opened)
    if (want('ai-cards-0128')) await aiCardsShot(app, shell)
    if (want('projects-0129')) await projectsShot(app, shell)
  } finally {
    await app?.close().catch(() => {})
    scratch.dispose()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
