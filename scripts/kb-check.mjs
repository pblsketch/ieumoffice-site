// Sanity checks on lib/kb-data.js before it is committed (npm run kb:check).
// No model calls: this guards against a build that silently lost a source,
// broke the product-name swap, or produced pieces too big for the prompt.
//
//   npm run kb:check                  # just the checks
//   npm run kb:check -- --ref v0.12.4 # also: the knowledge base is built from this tag

import kb from '../lib/kb-data.js'
import { retrieve } from '../lib/qa.js'

const args = process.argv.slice(2)
const expectedRef = args.includes('--ref') ? args[args.indexOf('--ref') + 1] : null
const problems = []
const count = (prefix) => kb.chunks.filter((c) => c.title.startsWith(prefix)).length

if (expectedRef && kb.version !== expectedRef) problems.push(`버전이 ${kb.version}인데 ${expectedRef}이어야 함`)
if (kb.chunks.length < 250) problems.push(`조각이 ${kb.chunks.length}개뿐(250개 이상이어야 함)`)

// every source must still be there; a missing one usually means a moved file or page
const MINIMUM = {
  '앱 도움말': 150,
  README: 10,
  'PRIVACY.md': 10,
  '이음오피스 소개': 5,
  '설치 도움말': 3,
  'AI 연결 도움말': 3,
  '업데이트 소식': 1,
  '자주 묻는 질문': 10,
  '개인정보 처리방침': 3,
  '법적 고지': 1,
}
for (const [prefix, min] of Object.entries(MINIMUM)) {
  const n = count(prefix)
  if (n < min) problems.push(`"${prefix}" 조각이 ${n}개(${min}개 이상이어야 함)`)
}
if (!kb.chunks.some((c) => / 업데이트 기록 \(/.test(c.title))) problems.push('릴리스 기록 조각이 없음')

// the help files say GenOffice where the product names itself; the build swaps it
const unswapped = kb.chunks.filter((c) => c.title.startsWith('앱 도움말') && /(^|[^\w{])GenOffice(?![\w-]|\.\w)/.test(c.text))
if (unswapped.length) problems.push(`앱 도움말 ${unswapped.length}조각에 GenOffice가 남음(예: ${unswapped[0].title})`)

const big = kb.chunks.filter((c) => c.text.length > 1500)
if (big.length) problems.push(`1500자를 넘는 조각 ${big.length}개(예: ${big[0].title})`)

const chars = kb.chunks.reduce((n, c) => n + c.text.length, 0)
if (chars < 80000 || chars > 600000) problems.push(`전체 글자 수 ${chars}가 이상함(8만~60만)`)

// a few questions whose answer pieces word search alone already finds
const SEARCH = [
  ['설치하려는데 Windows의 PC 보호라는 파란 창이 떠요', 'PC 보호'],
  ['Claude 구독은 어떻게 연결하나요?', 'Claude'],
  ['구글 드라이브 파일을 열 수 있나요?', 'Google 드라이브'],
  ['단축키 목록은 어디서 보나요?', '단축키'],
]
for (const [question, title] of SEARCH) {
  const found = await retrieve(question)
  if (!found.some((c) => c.title.includes(title))) problems.push(`"${question}" 검색에 "${title}" 조각이 없음`)
}

console.log(`${kb.version}: ${kb.chunks.length}조각, ${chars.toLocaleString()}자`)
for (const p of problems) console.log(`✗ ${p}`)
if (problems.length) process.exitCode = 1
else console.log('✓ 검사 통과')
