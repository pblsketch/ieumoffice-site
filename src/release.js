// Release lookups and installer links, shared by the landing page and the install help page.

export const REPO = 'pblsketch/openoffice'

export async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

let releasesCache
export function getReleases() {
  return (releasesCache ??= fetchJson(`https://api.github.com/repos/${REPO}/releases?per_page=100`))
}

export async function getLatestRelease() {
  const list = await getReleases().catch(() => null)
  if (Array.isArray(list)) {
    const latest = list.find((r) => !r.draft && !r.prerelease) ?? list[0]
    if (latest) return latest
  }
  return fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`)
}

/* ---------- download: the latest release's installer, if there is one */

/** One intent is one download. The same installer is linked from the hero and
 *  the download section, and the hero used to jump to the section on the same
 *  click, leaving a second copy under the pointer. A download link now only
 *  downloads; this guard also swallows a double click or a quick second click
 *  on the other copy, and dims the links so the first click is acknowledged. */
const DOWNLOAD_GUARD_MS = 6000

function guardRepeatedDownload(elements) {
  const links = elements.filter(Boolean)
  let busyUntil = 0
  let resetTimer = 0
  const setBusy = (busy) => {
    clearTimeout(resetTimer)
    for (const el of links) {
      el.classList.toggle('is-busy', busy)
      if (busy) el.setAttribute('aria-busy', 'true')
      else el.removeAttribute('aria-busy')
    }
    if (busy) resetTimer = setTimeout(() => setBusy(false), DOWNLOAD_GUARD_MS)
  }
  for (const el of links) {
    el.addEventListener('click', (event) => {
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const now = Date.now()
      if (now < busyUntil) {
        event.preventDefault()
        return
      }
      busyUntil = now + DOWNLOAD_GUARD_MS
      setBusy(true)
    })
  }
}

export async function wireDownload() {
  const links = document.querySelectorAll('[data-download]')
  const label = document.querySelector('[data-download-label]')
  const meta = document.querySelector('[data-download-meta]')
  const versionNote = document.querySelector('[data-version]')
  const macLinks = document.querySelectorAll('[data-download-mac]')
  const macLabel = document.querySelector('[data-download-mac-label]')
  const macMeta = document.querySelector('[data-download-mac-meta]')
  const macFileMeta = document.querySelector('[data-download-mac-file]')
  const macAlt = document.querySelector('[data-download-mac-alt]')
  const macIntelLinks = document.querySelectorAll('[data-download-mac-intel]')
  const macIntelLabel = document.querySelector('[data-download-mac-intel-label]')
  const macIntelMeta = document.querySelector('[data-download-mac-intel-meta]')
  const macIntelFileMeta = document.querySelector('[data-download-mac-intel-file]')
  const linuxLinks = document.querySelectorAll('[data-download-linux]')
  const linuxLabel = document.querySelector('[data-download-linux-label]')
  const linuxMeta = document.querySelector('[data-download-linux-meta]')
  const linuxAppImage = document.querySelector('[data-linux-appimage]')
  const linuxDeb = document.querySelector('[data-linux-deb]')
  const linuxRpm = document.querySelector('[data-linux-rpm]')

  try {
    const rel = await getLatestRelease()
    wireMac(rel)
    wireLinux(rel)
    const exe = rel.assets?.find((a) => /^IeumOffice-Setup-.*\.exe$/i.test(a.name))
    if (!exe) throw new Error('no installer')
    const version = rel.tag_name.replace(/^v/, '')
    const mb = Math.round(exe.size / 1024 / 1024)
    links.forEach((a) => {
      a.href = exe.browser_download_url
    })
    guardRepeatedDownload([...links])
    if (label) label.textContent = `Windows용 ${version} 내려받기`
    if (meta) meta.textContent = `${exe.name} (${mb}MB)`
    if (versionNote) versionNote.textContent = `${version} 베타`
  } catch {
    // no published release yet, or GitHub is unreachable: the button keeps
    // pointing at the releases page, which says what is there
    if (label) label.textContent = '릴리스 페이지에서 내려받기'
  }

  /** the two Mac disks, when the release carries them: Apple Silicon and Intel
   *  are built and attached separately, and an Intel Mac cannot run the arm64 one */
  function wireMac(rel) {
    const version = rel.tag_name.replace(/^v/, '')
    const arm = rel.assets?.find((a) => /^IeumOffice-.*-arm64\.dmg$/i.test(a.name))
    const intel = rel.assets?.find((a) => /^IeumOffice-.*-x64\.dmg$/i.test(a.name))
    const mb = (asset) => Math.round(asset.size / 1024 / 1024)

    if (arm) {
      macLinks.forEach((a) => {
        a.href = arm.browser_download_url
      })
      guardRepeatedDownload([...macLinks])
      if (macLabel) macLabel.textContent = `Mac용 ${version} 내려받기`
      if (macMeta) macMeta.textContent = `${arm.name} (${mb(arm)}MB) · Apple Silicon · 베타`
    } else {
      // this release has no Apple Silicon build yet: say so rather than open a page without one
      macLinks.forEach((a) => {
        a.classList.add('is-pending')
        a.setAttribute('aria-disabled', 'true')
      })
      if (macLabel) macLabel.textContent = 'Apple Silicon Mac판 준비 중'
    }
    if (macFileMeta) macFileMeta.textContent = arm ? ` — ${arm.name} (${mb(arm)}MB)` : ' — 이 버전에는 없습니다'

    if (intel) {
      macIntelLinks.forEach((a) => {
        a.href = intel.browser_download_url
      })
      guardRepeatedDownload([...macIntelLinks])
      if (macIntelLabel) macIntelLabel.textContent = `Intel Mac용 ${version} 내려받기`
      if (macIntelMeta) macIntelMeta.textContent = `${intel.name} (${mb(intel)}MB) · 베타`
      // on the landing page the Intel line stays out of the way until there is a file for it
      if (macAlt) macAlt.hidden = false
    } else {
      // an older release without the Intel build: keep the guide's line, but offer no file
      macIntelLinks.forEach((a) => {
        a.classList.add('is-pending')
        a.setAttribute('aria-disabled', 'true')
      })
      if (macIntelLabel) macIntelLabel.textContent = 'Intel Mac판 준비 중'
    }
    if (macIntelFileMeta) {
      macIntelFileMeta.textContent = intel ? ` — ${intel.name} (${mb(intel)}MB)` : ' — 이 버전에는 없습니다'
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
      })
      const primaryGuideLink =
        primary === appImage ? linuxAppImage : primary === deb ? linuxDeb : linuxRpm
      guardRepeatedDownload([...linuxLinks, primaryGuideLink])
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
