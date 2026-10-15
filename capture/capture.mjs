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
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

function makeScratch() {
  const root = mkdtempSync(join(tmpdir(), 'ieum-site-shots-'))
  const home = join(root, 'home')
  const userData = join(root, 'userdata')
  const docs = join(root, '내 문서')
  const saveDir = join(root, 'save')
  for (const d of [home, userData, docs, saveDir]) mkdirSync(d, { recursive: true })
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

async function shot(app, name) {
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
  execFileSync('python', [join(HERE, 'composite.py'), dir, join(OUT, `${name}.png`)], { stdio: 'inherit' })
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
    await shell.addStyleTag({ content: '.account-sub{display:none!important}' })

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
    if (!ONLY.length || ONLY.includes('home')) {
      await shell.evaluate(() => window.aiOfficeTabs.activate('home'))
      await sleep(1500)
      await shot(app, 'home')
    }
  } finally {
    await app?.close().catch(() => {})
    scratch.dispose()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
