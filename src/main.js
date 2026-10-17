import 'wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css'
import './style.css'

const REPO = 'pblsketch/openoffice'
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

document.documentElement.classList.add('js')

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
  { id: 'hwp', label: '한글', icon: 'ㅎ', color: '#1ea0e0', title: '한글 .hwp .hwpx', text: '한컴오피스가 없어도 HWP·HWPX 문서를 열어 고치고, 연 형식 그대로 저장합니다.', alt: '한글 편집기에서 참가 신청서를 연 화면' },
  { id: 'docs', label: '워드', icon: 'W', color: '#2b6fd6', title: '워드 .docx', text: '저장할 때 고친 부분만 원본 파일에 반영하므로, 손대지 않은 서식은 그대로 남습니다.', alt: '워드 편집기에서 기획서를 연 화면' },
  { id: 'sheets', label: '엑셀', icon: 'X', color: '#1f8f4e', title: '엑셀 .xlsx', text: '수식과 서식, 차트가 든 통합 문서를 열고 그 형식 그대로 저장합니다.', alt: '엑셀 편집기에서 예산표를 연 화면' },
  { id: 'slides', label: '파워포인트', icon: 'P', color: '#d24726', title: '파워포인트 .pptx', text: '슬라이드를 고치고, 자료를 주면 발표 자료를 새로 만듭니다.', alt: '파워포인트 편집기에서 발표 자료를 연 화면' },
  { id: 'pdf', label: 'PDF', icon: 'PDF', color: '#e0383e', title: 'PDF', text: '쪽 위의 글자를 고치고, PDF를 워드·엑셀·파워포인트 파일로 내 PC에서 바꿉니다.', alt: 'PDF 편집기에서 안내문을 연 화면' },
  { id: 'markdown', label: '마크다운', icon: 'M↓', color: '#7c4ddb', title: '마크다운 .md', text: '서식이 보이는 화면에서 쓰고, 필요하면 원문으로 바꿔 고칩니다.', alt: '마크다운 편집기에서 회의 메모를 연 화면' },
  { id: 'html', label: 'HTML', icon: '</>', color: '#119c8f', title: 'HTML', text: '웹 페이지를 보이는 화면에서 고칩니다. 고른 자료로 새 페이지를 만들 수도 있습니다.', alt: 'HTML 편집기에서 행사 소개 페이지를 연 화면' },
  { id: 'mindmap', label: '마인드맵', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="12" r="2.6" fill="currentColor"/><path d="M8.5 12h3m0 0c0-4 2-6 5-6m-5 6c0 4 2 6 5 6m-5-6h5"/></svg>', color: '#d63d8f', title: '마인드맵 .xmind', text: 'XMind 파일을 열고 고쳐 같은 파일로 저장합니다. 그림, PDF, 마크다운 개요로 내보냅니다.', alt: '마인드맵 편집기에서 아이디어 지도를 연 화면' },
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
  b.innerHTML = `<span class="format-icon" aria-hidden="true">${f.icon}</span>${f.label}<span class="progress"></span>`
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

/* ---------- download: the latest release's installer, if there is one */

async function wireDownload() {
  const links = document.querySelectorAll('[data-download]')
  const label = document.querySelector('[data-download-label]')
  const meta = document.querySelector('[data-download-meta]')
  const versionNote = document.querySelector('[data-version]')
  const macLinks = document.querySelectorAll('[data-download-mac]')
  const macLabel = document.querySelector('[data-download-mac-label]')
  const macMeta = document.querySelector('[data-download-mac-meta]')
  const linuxLinks = document.querySelectorAll('[data-download-linux]')
  const linuxLabel = document.querySelector('[data-download-linux-label]')
  const linuxMeta = document.querySelector('[data-download-linux-meta]')
  const linuxAppImage = document.querySelector('[data-linux-appimage]')
  const linuxDeb = document.querySelector('[data-linux-deb]')
  const linuxRpm = document.querySelector('[data-linux-rpm]')

  function bindGuideJump(el, hash) {
    if (!el.closest('.hero-actions')) return
    el.addEventListener('click', () => {
      if (hash === '#mac' || hash === '#linux') {
        const guide = document.querySelector(`details.mac-guide${hash}`)
        if (guide) guide.open = true
      }
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) throw new Error(String(res.status))
    const rel = await res.json()
    wireMac(rel)
    wireLinux(rel)
    const exe = rel.assets?.find((a) => /^IeumOffice-Setup-.*\.exe$/i.test(a.name))
    if (!exe) throw new Error('no installer')
    const version = rel.tag_name.replace(/^v/, '')
    const mb = Math.round(exe.size / 1024 / 1024)
    links.forEach((a) => {
      a.href = exe.browser_download_url
      bindGuideJump(a, '#download')
    })
    label.textContent = `Windows용 ${version} 내려받기`
    meta.textContent = `${exe.name} (${mb}MB)`
    versionNote.textContent = `${version} 베타`
  } catch {
    // no published release yet, or GitHub is unreachable: the button keeps
    // pointing at the releases page, which says what is there
    label.textContent = '릴리스 페이지에서 내려받기'
  }

  /** the Apple Silicon disk image, when the release carries one (the Mac build is attached separately) */
  function wireMac(rel) {
    const dmg = rel.assets?.find((a) => /^IeumOffice-.*-arm64\.dmg$/i.test(a.name))
    if (dmg) {
      macLinks.forEach((a) => {
        a.href = dmg.browser_download_url
        bindGuideJump(a, '#mac')
      })
      if (macLabel) macLabel.textContent = `Mac용 ${rel.tag_name.replace(/^v/, '')} 내려받기`
      if (macMeta) macMeta.textContent = `${dmg.name} (${Math.round(dmg.size / 1024 / 1024)}MB) · Apple Silicon`
    } else {
      // this release has no Mac build yet: say so rather than open a page without one
      macLinks.forEach((a) => {
        a.classList.add('is-pending')
        a.setAttribute('aria-disabled', 'true')
      })
      if (macLabel) macLabel.textContent = 'Mac판 준비 중'
    }
  }

  /** the Linux x64 AppImage / deb / rpm packages, when the release carries them */
  function wireLinux(rel) {
    const appImage = rel.assets?.find((a) => /^IeumOffice-.*\.AppImage$/i.test(a.name))
    const deb = rel.assets?.find((a) => /^ieumoffice_.*\.deb$/i.test(a.name))
    const rpm = rel.assets?.find((a) => /^ieumoffice-.*\.rpm$/i.test(a.name))
    const primary = appImage ?? deb ?? rpm
    if (primary) {
      linuxLinks.forEach((a) => {
        a.href = primary.browser_download_url
        bindGuideJump(a, '#linux')
      })
      if (linuxLabel) linuxLabel.textContent = `Linux용 ${rel.tag_name.replace(/^v/, '')} 내려받기`
      if (linuxMeta) linuxMeta.textContent = `${primary.name} (${Math.round(primary.size / 1024 / 1024)}MB) · x64`
    } else {
      linuxLinks.forEach((a) => {
        a.classList.add('is-pending')
        a.setAttribute('aria-disabled', 'true')
      })
      if (linuxLabel) linuxLabel.textContent = 'Linux판 준비 중'
    }
    if (appImage && linuxAppImage) {
      linuxAppImage.href = appImage.browser_download_url
      linuxAppImage.textContent = `${appImage.name} (${Math.round(appImage.size / 1024 / 1024)}MB)`
    }
    if (deb && linuxDeb) {
      linuxDeb.href = deb.browser_download_url
      linuxDeb.textContent = `${deb.name} (${Math.round(deb.size / 1024 / 1024)}MB)`
    }
    if (rpm && linuxRpm) {
      linuxRpm.href = rpm.browser_download_url
      linuxRpm.textContent = `${rpm.name} (${Math.round(rpm.size / 1024 / 1024)}MB)`
    }
  }
}
wireDownload()

/* ---------- GitHub numbers: the page asks the GitHub API first so the
 * counts are live for every visit; the openoffice repo's daily growth
 * summary is the fallback for rate-limited or offline visitors. The
 * unauthenticated API allows 60 calls/hour per visitor, two per visit. */

const GROWTH_SUMMARY_URL =
  'https://raw.githubusercontent.com/pblsketch/openoffice/main/docs/tracking/growth-latest.json'

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

/** Live numbers straight from the GitHub API, or null when it is unreachable. */
async function liveGrowthNumbers() {
  try {
    const [releases, repo] = await Promise.all([
      fetchJson(`https://api.github.com/repos/${REPO}/releases?per_page=100`),
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

async function growthNumbers() {
  return (await liveGrowthNumbers()) ?? (await fetchJson(GROWTH_SUMMARY_URL).catch(() => null))
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
