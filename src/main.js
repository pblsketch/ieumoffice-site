import './font.css'
import './style.css'
import './ask.js'
import { REPO, fetchJson, getReleases, wireDownload } from './release.js'

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

document.documentElement.classList.add('js')

// the Mac and Linux guides moved to the install help page; old links still land there
if (location.hash === '#mac' || location.hash === '#linux') location.replace(`/install${location.hash}`)

/* ---------- nav turns solid once the hero scrolls away ---------- */

const nav = document.querySelector('[data-nav]')
const heroCopy = document.querySelector('.hero-copy')
let navFrame = 0
function updateNav() {
  navFrame = 0
  nav.classList.toggle('is-scrolled', scrollY > 12)
  // solid once the indigo part of the hero is behind the bar
  nav.classList.toggle('is-solid', heroCopy.getBoundingClientRect().bottom < 120)
}
addEventListener('scroll', () => (navFrame ||= requestAnimationFrame(updateNav)), { passive: true })
updateNav()

/* ---------- showcase: the app window switching tabs ---------- */

const FORMATS = [
  { id: 'home', label: '홈', icon: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></svg>', color: '#4338ca', title: '홈', text: '최근 문서와 폴더를 보고, 파일 이름과 내용으로 검색합니다. 새 문서도 여기서 만듭니다.', alt: '이음오피스 홈 화면' },
  { id: 'hwp', label: '한글', file: 'hwp', color: '#2e7faa', title: '한글 .hwp .hwpx', text: 'HWP·HWPX 문서를 열어 고치고, 연 형식 그대로 저장합니다. 다른 이름으로 저장할 때는 HWP와 HWPX 가운데 고릅니다.', alt: '한글 편집기에서 참가 신청서를 연 화면' },
  { id: 'docs', label: '워드', file: 'docx', color: '#5160be', title: '워드 .docx .odt', text: '워드와 ODT 문서를 열고 고칩니다. 저장할 때 고친 부분만 원본 파일에 반영하므로, 손대지 않은 서식은 그대로 남습니다.', alt: '워드 편집기에서 기획서를 연 화면' },
  { id: 'sheets', label: '엑셀', file: 'xlsx', color: '#2a8572', title: '엑셀 .xlsx', text: '수식과 서식, 차트가 든 통합 문서를 열고 그 형식 그대로 저장합니다.', alt: '엑셀 편집기에서 예산표를 연 화면' },
  { id: 'slides', label: '파워포인트', file: 'pptx', color: '#c27630', title: '파워포인트 .pptx', text: '슬라이드를 고치고, 자료를 주면 발표 자료를 새로 만듭니다.', alt: '파워포인트 편집기에서 발표 자료를 연 화면' },
  { id: 'pdf', label: 'PDF', file: 'pdf', color: '#b84a5c', title: 'PDF', text: '쪽 위의 글자를 고치고, 읽으면서 형광펜과 메모를 남깁니다. PDF를 워드·엑셀·파워포인트 파일로 내 PC에서 바꿉니다.', alt: 'PDF 편집기에서 안내문을 연 화면' },
  { id: 'markdown', label: '마크다운', file: 'md', color: '#4a5568', title: '마크다운 .md', text: '서식이 보이는 화면에서 쓰고, 필요하면 원문으로 바꿔 고칩니다.', alt: '마크다운 편집기에서 회의 메모를 연 화면' },
  { id: 'html', label: 'HTML', file: 'html', color: '#8257b6', title: 'HTML', text: '웹 페이지를 보이는 화면에서 고치고, 수식도 넣습니다. 고른 자료로 새 페이지를 만들 수도 있습니다.', alt: 'HTML 편집기에서 행사 소개 페이지를 연 화면' },
  { id: 'mindmap', label: '마인드맵', file: 'mindmap', color: '#b04e83', title: '마인드맵 .xmind', text: 'XMind 파일을 열고 고쳐 같은 파일로 저장합니다. 그림, PDF, 마크다운 개요로 내보냅니다.', alt: '마인드맵 편집기에서 아이디어 지도를 연 화면' },
  { id: 'epub', label: 'EPUB', file: 'epub', color: '#2f6f5e', title: 'EPUB 전자책', text: 'EPUB 책을 열어 읽고 본문을 고쳐 저장합니다. 다른 언어로 번역해 번역본 파일로 저장합니다.', alt: 'EPUB 편집기에서 가을 북페어 안내책을 연 화면' },
]

const showcase = document.querySelector('[data-showcase]')
const stage = document.querySelector('[data-stage]')
const bar = document.querySelector('[data-format-bar]')
const caption = document.querySelector('[data-format-caption]')
const DWELL = 5200

const shots = FORMATS.map((f, i) => {
  const img = new Image()
  img.src = `/shots/${f.id}-1600.webp`
  img.srcset = `/shots/${f.id}-1600.webp 1600w, /shots/${f.id}-2880.webp 2880w`
  img.sizes = '(min-width: 1260px) 1240px, 96vw'
  img.alt = f.alt
  img.decoding = 'async'
  if (i > 1) img.loading = 'lazy'
  stage.append(img)
  return img
})

const chips = FORMATS.map((f, i) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'format-chip'
  b.role = 'tab'
  b.style.setProperty('--c', f.color)
  b.style.setProperty('--dwell', `${DWELL}ms`)
  // document tabs show the app's own file-type icon (public/icons, copied from
  // the app's apps/shell/src/renderer/src/assets/file-*.svg); home keeps its glyph
  const icon = f.file
    ? `<img class="format-icon is-file" src="/icons/file-${f.file}.svg" width="26" height="26" alt="" />`
    : `<span class="format-icon" aria-hidden="true">${f.icon}</span>`
  b.innerHTML = `${icon}${f.label}<span class="progress"></span>`
  b.addEventListener('click', () => {
    auto = false
    show(i)
  })
  bar.append(b)
  return b
})

let current = -1
let auto = !reduceMotion
let timer = 0
let visible = true

function show(i) {
  if (i === current) return
  const prev = shots[current]
  const next = shots[i]
  shots.forEach((s) => s.classList.remove('is-entering'))
  if (prev && !reduceMotion) {
    next.classList.add('is-entering')
    next.addEventListener(
      'animationend',
      () => {
        prev.classList.remove('is-active')
        next.classList.remove('is-entering')
        next.classList.add('is-active')
      },
      { once: true },
    )
  } else {
    prev?.classList.remove('is-active')
    next.classList.add('is-active')
  }
  current = i
  chips.forEach((c, j) => {
    c.setAttribute('aria-selected', String(j === i))
    c.tabIndex = j === i ? 0 : -1
    const p = c.querySelector('.progress')
    p.classList.remove('is-running')
    if (j === i && auto) {
      void p.offsetWidth // restart the bar
      p.classList.add('is-running')
    }
  })
  const f = FORMATS[i]
  caption.innerHTML = `<b>${f.title}</b>${f.text}`
  schedule()
}

function schedule() {
  clearTimeout(timer)
  if (!auto) return
  timer = setTimeout(tick, DWELL)
}
function tick() {
  if (!auto) return
  if (!visible || showcase.classList.contains('is-paused')) {
    timer = setTimeout(tick, 400)
    return
  }
  show((current + 1) % FORMATS.length)
}

bar.addEventListener('keydown', (e) => {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!step) return
  e.preventDefault()
  auto = false
  const n = (current + step + FORMATS.length) % FORMATS.length
  show(n)
  chips[n].focus()
})
showcase.addEventListener('pointerenter', () => showcase.classList.add('is-paused'))
showcase.addEventListener('pointerleave', () => showcase.classList.remove('is-paused'))
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting
  showcase.classList.toggle('is-paused', !visible)
}).observe(showcase)

show(0)

/* ---------- page-load sequence ---------- */

requestAnimationFrame(() => document.documentElement.classList.add('is-ready'))

/* ---------- sections rise once as they enter the viewport ---------- */

{
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        seen.unobserve(e.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  )
  document.querySelectorAll('main section:not(.hero)').forEach((sec) => {
    ;[...sec.children].slice(0, 6).forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = `${Math.min(i, 3) * 70}ms`
      seen.observe(el)
    })
  })
}

/* ---------- the Mac / Linux guides open when the hero note jumps to them ---------- */

{
  const openHashGuide = () => {
    if (location.hash === '#mac' || location.hash === '#linux') {
      const guide = document.querySelector(`details.mac-guide${location.hash}`)
      if (guide) guide.open = true
    }
  }
  openHashGuide()
  addEventListener('hashchange', openHashGuide)
}

/* ---------- AI demos: each plays once when it scrolls into view ---------- */

const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms))

/**
 * A demo carries its request in data-request and, in data-marks, where the
 * edited cells sit in its capture, as fractions of the image. Retake a capture
 * and those fractions have to be measured again.
 */
function setupDemo(demo) {
  const request = demo.dataset.request
  const typed = demo.querySelector('[data-chat-typed]')
  const userMsg = demo.querySelector('[data-chat-user]')
  const aiMsg = demo.querySelector('[data-chat-ai]')
  const steps = [...demo.querySelectorAll('.chat-steps li')]
  const done = demo.querySelector('.chat-done')
  const shot = demo.querySelector('.ai-shot')
  const marks = JSON.parse(demo.dataset.marks).map((m) => {
    const el = document.createElement('span')
    el.className = 'ai-mark'
    el.setAttribute('aria-hidden', 'true')
    Object.assign(el.style, {
      left: `${m.left * 100}%`,
      top: `${m.top * 100}%`,
      width: `${m.width * 100}%`,
      height: `${m.height * 100}%`,
    })
    shot.append(el)
    return el
  })

  async function play() {
    demo.classList.add('is-playing')
    // on a wide screen the request is typed into the panel's input box and then
    // sent; on a narrow one the conversation sits below the picture and the
    // message types itself
    const inPanel = typed.offsetParent !== null
    const target = inPanel ? typed : userMsg
    if (!inPanel) userMsg.classList.add('is-on')
    await wait(500)
    for (let i = 1; i <= request.length; i++) {
      target.textContent = request.slice(0, i)
      await wait(42)
    }
    await wait(450)
    if (inPanel) {
      typed.textContent = ''
      userMsg.textContent = request
      userMsg.classList.add('is-on')
    }
    await wait(500)
    aiMsg.classList.add('is-on')
    for (const s of steps) {
      await wait(750)
      s.classList.add('is-done')
    }
    await wait(300)
    for (const m of marks) {
      m.classList.add('is-on')
      await wait(220)
    }
    done.classList.add('is-on')
  }

  new IntersectionObserver(
    ([e], obs) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      play()
    },
    { threshold: 0.45 },
  ).observe(demo)
}

document.querySelectorAll('[data-ai-demo]').forEach(setupDemo)

/* ---------- GitHub API: shared across the installer links and the live
 * usage counters so each visit makes at most two unauthenticated requests
 * (GitHub allows 60 calls/hour per visitor; the lookups live in release.js).
 * The daily growth summary in the openoffice repo is the fallback for
 * rate-limited or offline visitors. */

const GROWTH_SUMMARY_URL =
  'https://raw.githubusercontent.com/pblsketch/openoffice/main/docs/tracking/growth-latest.json'

wireDownload()

/* ---------- right after a download starts, point at the screen that may come
 * next. Shown only on a click, so it costs the page no length. */

const STUCK_HINTS = {
  edge: ['Edge에서 "일반적으로 다운로드되지 않습니다"가 뜨면', '/install#edge'],
  windows: ['설치 파일을 열 때 경고 창이 뜨면', '/install#pc-protect'],
  mac: ['Mac에서 처음 열 때 막히면', '/install#mac'],
  linux: ['Linux에서 설치 방법이 궁금하면', '/install#linux'],
}

function showStuckHint(kind) {
  const [text, href] = STUCK_HINTS[kind]
  let hint = document.querySelector('[data-stuck-hint]')
  if (!hint) {
    hint = document.createElement('aside')
    hint.className = 'stuck-hint'
    hint.dataset.stuckHint = ''
    hint.setAttribute('role', 'status')
    hint.innerHTML =
      '<p><b>받기 시작했어요.</b> <span data-hint-text></span> 어디를 누르면 되는지 화면으로 보여 드려요.</p>' +
      '<a class="btn btn-amber" data-hint-link>화면으로 보기</a>' +
      '<button type="button" class="stuck-hint-close" aria-label="닫기" data-hint-close>×</button>'
    hint.querySelector('[data-hint-close]').addEventListener('click', () => hint.classList.remove('is-on'))
    document.body.append(hint)
  }
  hint.querySelector('[data-hint-text]').textContent = text
  hint.querySelector('[data-hint-link]').href = href
  requestAnimationFrame(() => hint.classList.add('is-on'))
}

function wireStuckHints() {
  const isEdge = /\bEdg\//.test(navigator.userAgent)
  const watch = (selector, kind, file) => {
    document.querySelectorAll(selector).forEach((a) =>
      a.addEventListener('click', () => {
        // only once the link is the file itself, not the releases page it falls back to
        if (file.test(a.href)) showStuckHint(kind)
      }),
    )
  }
  watch('[data-download]', isEdge ? 'edge' : 'windows', /\.exe$/i)
  watch('[data-download-mac], [data-download-mac-intel]', 'mac', /\.dmg$/i)
  watch('[data-download-linux]', 'linux', /\.(AppImage|deb|rpm)$/i)
}
wireStuckHints()

/** Live numbers straight from the GitHub API, or null when it is unreachable. */
async function liveGrowthNumbers() {
  try {
    const [releases, repo] = await Promise.all([
      getReleases(),
      fetchJson(`https://api.github.com/repos/${REPO}`),
    ])
    if (!Array.isArray(releases)) return null
    const numbers = {
      totalDownloads: 0,
      windowsInstalls: 0,
      macosInstalls: 0,
      linuxInstalls: 0,
      stars: repo.stargazers_count,
    }
    for (const release of releases) {
      for (const asset of release.assets ?? []) {
        if (!/\.(exe|dmg|zip|AppImage|deb|rpm)$/i.test(asset.name)) continue
        numbers.totalDownloads += asset.download_count
        if (asset.name.endsWith('.exe')) numbers.windowsInstalls += asset.download_count
        else if (/\.(AppImage|deb|rpm)$/i.test(asset.name)) numbers.linuxInstalls += asset.download_count
        else numbers.macosInstalls += asset.download_count
      }
    }
    return numbers
  } catch {
    return null
  }
}

let growthCache
function growthNumbers() {
  return (growthCache ??= (async () =>
    (await liveGrowthNumbers()) ?? (await fetchJson(GROWTH_SUMMARY_URL).catch(() => null)))())
}

function fillStats(strip, data) {
  const pick = {
    '[data-stat-downloads]': 'totalDownloads',
    '[data-stat-windows]': 'windowsInstalls',
    '[data-stat-mac]': 'macosInstalls',
    '[data-stat-linux]': 'linuxInstalls',
    '[data-stat-stars]': 'stars',
  }
  let filled = 0
  for (const [sel, key] of Object.entries(pick)) {
    const el = document.querySelector(sel)
    if (!el) continue
    if (typeof data[key] === 'number' && data[key] >= 0) {
      el.textContent = data[key].toLocaleString('ko-KR')
      if (data[key] > 0) filled++
    }
  }
  if (filled > 0) strip.hidden = false
}

async function wireGrowthStats() {
  const strip = document.querySelector('[data-hero-stats]')
  if (!strip) return
  const data = await growthNumbers()
  if (data) fillStats(strip, data)
}
wireGrowthStats()

async function wireStarCount() {
  const badge = document.querySelector('[data-star-count]')
  if (!badge) return
  const data = await growthNumbers()
  const stars = data?.stars ?? data?.stargazers_count
  if (typeof stars === 'number' && stars > 0) {
    badge.textContent = String(stars)
    badge.hidden = false
  }
}
wireStarCount()
