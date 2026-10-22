// The pointer walkthrough shared by the help pages: each guide is a redrawn
// screen where a pointer walks through the clicks. Scenes are plain data; the
// stage shows states through `is-<flag>` classes, so the HTML holds every
// piece of the screen up front.
//
// A scene is one entry per step: `at` is the screen at the start of the step,
// `moves` are what happens in it. A move with `t` sends the pointer to that
// target and clicks (`hover` only rests there, `dbl` clicks twice); `keys`
// shows a key press instead; `wait` just lets time pass. `add`/`remove`
// change the screen.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const STAGE_W = 800
// on phones the screen shows a slice of the stage and pans with the pointer
const NARROW_VIEW = 470
const NARROW_BELOW = 560
const MOVE_MS = 900
const DWELL_MS = 1700
const LOOP_PAUSE_MS = 3200

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function setupPlayer(root, scenes) {
  const steps = scenes[root.dataset.player]
  if (!steps) return
  const screen = root.querySelector('[data-screen]')
  const stage = root.querySelector('[data-stage]')
  const cursor = root.querySelector('[data-cursor]')
  const ring = root.querySelector('[data-ring]')
  const ripple = root.querySelector('[data-ripple]')
  const keys = root.querySelector('[data-keys]')
  const items = [...root.querySelectorAll('[data-steps] > li')]
  const playBtn = root.querySelector('[data-play]')
  const count = root.querySelector('[data-count]')

  let scale = 1
  let viewW = STAGE_W
  let pan = 0
  let index = 0
  let auto = !reduceMotion
  let visible = false
  let run = 0 // bumps whenever playback is interrupted; stale loops stop

  const fit = () => {
    const narrow = root.clientWidth < NARROW_BELOW
    screen.classList.toggle('is-narrow', narrow)
    viewW = narrow ? NARROW_VIEW : STAGE_W
    scale = screen.clientWidth / viewW
    stage.style.setProperty('--s', scale)
    if (!narrow) panTo(0, true)
  }
  const panTo = (x, instant = false) => {
    const next = Math.max(0, Math.min(STAGE_W - viewW, x - viewW / 2))
    if (next === pan) return
    pan = next
    stage.classList.toggle('is-instant', instant || reduceMotion)
    stage.style.setProperty('--px', pan)
  }
  new ResizeObserver(fit).observe(screen)
  fit()

  const flags = new Set()
  const setFlags = (list) => {
    for (const f of flags) stage.classList.remove(`is-${f}`)
    flags.clear()
    for (const f of list) {
      flags.add(f)
      stage.classList.add(`is-${f}`)
    }
  }
  const apply = (move) => {
    for (const f of move.remove ?? []) {
      flags.delete(f)
      stage.classList.remove(`is-${f}`)
    }
    for (const f of move.add ?? []) {
      flags.add(f)
      stage.classList.add(`is-${f}`)
    }
  }

  // target centre in stage pixels, whatever the current scale
  const point = (t) => {
    const el = stage.querySelector(`[data-t="${t}"]`)
    const s = stage.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    // the camera frames the whole window the target sits in, when it fits
    const box = el.closest('[data-frame]')?.getBoundingClientRect()
    const x = (r.left + r.width / 2 - s.left) / scale
    return {
      x,
      y: (r.top + r.height / 2 - s.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
      focus: box && box.width / scale <= viewW ? (box.left + box.width / 2 - s.left) / scale : x,
    }
  }
  const placeCursor = (x, y, instant = false, focus = x) => {
    cursor.classList.toggle('is-instant', instant || reduceMotion)
    cursor.style.transform = `translate(${x}px, ${y}px)`
    panTo(focus, instant)
  }
  const showRing = (p) => {
    ring.style.cssText = `left:${p.x - p.w / 2 - 6}px;top:${p.y - p.h / 2 - 6}px;width:${p.w + 12}px;height:${p.h + 12}px`
    ring.classList.add('is-on')
  }
  const hideRing = () => ring.classList.remove('is-on')
  const click = (p) => {
    ripple.style.left = `${p.x}px`
    ripple.style.top = `${p.y}px`
    ripple.classList.remove('is-on')
    void ripple.offsetWidth
    ripple.classList.add('is-on')
  }

  const showKeys = (list) => {
    keys.replaceChildren()
    list.forEach((k, n) => {
      if (n) keys.append(' + ')
      const kbd = document.createElement('kbd')
      kbd.textContent = k
      keys.append(kbd)
    })
    keys.classList.remove('is-press')
    keys.classList.add('is-on')
  }
  const hideKeys = () => keys?.classList.remove('is-on', 'is-press')

  const mark = (i) => {
    items.forEach((li, k) => {
      li.classList.toggle('is-current', k === i)
      li.classList.toggle('is-done', k < i)
    })
    count.textContent = `${i + 1} / ${steps.length}단계`
  }

  async function playStep(i, token) {
    const live = () => token === run
    index = i
    mark(i)
    hideRing()
    hideKeys()
    setFlags(steps[i].at)
    const moves = steps[i].moves
    for (let m = 0; m < moves.length; m++) {
      const move = moves[m]
      // without motion, stop before the last action so the screen says what to do
      const holdHere = reduceMotion && m === moves.length - 1
      await sleep(reduceMotion ? 0 : 350)
      if (!live()) return false
      if (move.wait) {
        if (holdHere) return false
        await sleep(move.wait)
        if (!live()) return false
        apply(move)
        continue
      }
      if (move.keys) {
        showKeys(move.keys)
        if (holdHere) return false
        await sleep(700)
        if (!live()) return false
        keys.classList.add('is-press')
        await sleep(500)
        if (!live()) return false
        hideKeys()
        apply(move)
        continue
      }
      const p = point(move.t)
      placeCursor(p.x, p.y, false, p.focus)
      if (holdHere) {
        showRing(p)
        return false
      }
      await sleep(MOVE_MS)
      if (!live()) return false
      if (move.hover) {
        apply(move)
        continue
      }
      showRing(p)
      await sleep(650)
      if (!live()) return false
      click(p)
      if (move.dbl) {
        await sleep(170)
        click(p)
      }
      hideRing()
      apply(move)
    }
    await sleep(DWELL_MS)
    return live()
  }

  async function loop(from) {
    const token = ++run
    let i = from
    while (token === run) {
      const finished = await playStep(i, token)
      if (!finished || !auto) return
      if (i === steps.length - 1) {
        await sleep(LOOP_PAUSE_MS)
        if (token !== run) return
        placeCursor(STAGE_W / 2, 400, true)
        i = 0
      } else {
        i++
      }
    }
  }

  const setAuto = (on) => {
    auto = on
    playBtn.textContent = on ? '❚❚ 멈춤' : '▶ 계속 보기'
    playBtn.setAttribute('aria-label', on ? '멈춤' : '계속 보기')
  }
  const goTo = (i) => {
    setAuto(false)
    loop(Math.max(0, Math.min(steps.length - 1, i)))
  }

  root.querySelector('[data-prev]').addEventListener('click', () => goTo(index - 1))
  root.querySelector('[data-next]').addEventListener('click', () => goTo(index + 1))
  playBtn.addEventListener('click', () => {
    if (auto) {
      setAuto(false)
      run++
      return
    }
    setAuto(true)
    loop(index === steps.length - 1 ? 0 : index + 1)
  })
  items.forEach((li, k) => {
    li.dataset.n = k + 1
    li.tabIndex = 0
    li.addEventListener('click', () => goTo(k))
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goTo(k)
      }
    })
  })

  setAuto(auto)
  placeCursor(STAGE_W / 2, 400, true)
  mark(0)
  setFlags(steps[0].at)

  new IntersectionObserver(
    ([e]) => {
      const was = visible
      visible = e.isIntersecting
      if (visible && !was) {
        if (auto || reduceMotion) loop(index)
      } else if (!visible && was) {
        run++
      }
    },
    { threshold: 0.45 },
  ).observe(screen)
}

/** Wires every `[data-player]` on the page to its scene in `scenes` */
export function setupPlayers(scenes) {
  document.querySelectorAll('[data-player]').forEach((root) => setupPlayer(root, scenes))
}

/** A link to a `<details>` id opens it */
export function openDetailsFromHash() {
  const open = () => {
    const target = document.getElementById(location.hash.slice(1))
    if (target instanceof HTMLDetailsElement) target.open = true
  }
  addEventListener('hashchange', open)
  open()
}
