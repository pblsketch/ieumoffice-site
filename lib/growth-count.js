// Download counts from a GitHub releases list. Shared by the page (src/main.js)
// and the site's own numbers endpoint (api/stats.js) so both count the same way.

export function countDownloads(releases) {
  const numbers = { totalDownloads: 0, windowsInstalls: 0, macosInstalls: 0, linuxInstalls: 0 }
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
}
