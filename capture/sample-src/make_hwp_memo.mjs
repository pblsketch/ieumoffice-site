/**
 * Builds capture/samples-extra/참가신청서_검토.hwpx: the sample application form
 * with three review memos, for the 0.12.5 memo picture. The memos are made
 * with the app's own HWP engine from the release checkout.
 *
 *   node capture/sample-src/make_hwp_memo.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = process.env.IEUM_REPO ?? 'E:/github/openoffice-release'
const require = createRequire(join(REPO, 'apps/hwp/package.json'))
const entry = require.resolve('@rhwp/core')
const core = await import(pathToFileURL(entry).href)
await core.default({ module_or_path: readFileSync(join(dirname(entry), 'rhwp_bg.wasm')) })

const doc = new core.HwpDocument(readFileSync(join(HERE, '..', 'samples', '참가신청서.hwpx')))
const textOf = (para) => doc.getTextRange(0, para, 0, doc.getParagraphLength(0, para))

const memos = [
  [3, '10월 20일(화)', '운영팀', '마감을 10월 23일(금)로 미루면 어떨까요? 출판사 쪽 문의가 많았습니다.'],
  [8, '11.2(월)', '책방지기', '11월 2일은 정기 휴무일이라 이 날짜는 빼야 합니다.'],
  [13, '2026 가을 골목 북페어', '디자인팀', '포스터의 행사 이름과 같게 맞췄습니다.'],
]
for (const [para, anchor, author, text] of memos) {
  const start = textOf(para).indexOf(anchor)
  if (start < 0) throw new Error(`anchor not found in paragraph ${para}: ${anchor}`)
  const res = JSON.parse(doc.insertMemo(0, para, start, start + anchor.length, JSON.stringify({ author, text })))
  if (!res.ok) throw new Error(`memo failed: ${JSON.stringify(res)}`)
}
const out = join(HERE, '..', 'samples-extra')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, '참가신청서_검토.hwpx'), doc.exportHwpx())
console.log('wrote', join(out, '참가신청서_검토.hwpx'), JSON.parse(doc.getMemoList()).length ?? '')
