// Checks the question helper against questions with known answers.
//
//   npm run kb:eval              # search: does the right piece reach the model? (one short Solar call each)
//   npm run kb:eval -- --answer  # also writes each answer (a longer Solar call each)
//   npm run kb:eval -- --offline # search on the question's own words, no Solar at all
//
// Each case (optionally after earlier turns in `before`) names words that must appear in the title of one of the pieces
// handed to the model (`source`), and for --answer, words the answer must or
// must not contain. Add a case whenever the helper gets a real question wrong.

import { ask, findPieces, retrieve } from '../lib/qa.js'

const CASES = [
  { q: '정말 무료인가요? 나중에 돈 내야 하나요?', source: ['비용'], must: ['무료'] },
  { q: 'Claude 구독은 어떻게 연결하나요?', source: ['Claude'] },
  { q: '맥에서도 쓸 수 있나요?', source: ['Mac'], must: ['Apple Silicon'] },
  { q: '인텔 맥북에서도 되나요?', source: ['Mac (베타)'], must: ['Intel'] },
  { q: '리눅스 설치 방법', source: ['Linux'] },
  { q: '한글 파일을 고치고 hwp로 저장할 수 있나요?', source: ['한글'] },
  { q: '한글 파일을 PDF로 만들 수 있나요?', source: ['한글 파일'], mustNot: ['자료에는 그 내용이 없', '방법은 제가 가진 안내 자료에 없'] },
  { q: '설치하려는데 Windows의 PC 보호라는 파란 창이 떠요', source: ['PC 보호'] },
  { q: 'Edge에서 일반적으로 다운로드되지 않습니다라고 나와요', source: ['다운로드되지 않습니다'] },
  { q: '구독이 없으면 AI를 못 쓰나요?', source: ['무료'] },
  { q: '내 문서가 AI 학습에 쓰이나요?', source: ['training', '학습', '개인정보'] },
  { q: 'PDF를 워드로 바꿀 수 있나요?', source: ['PDF'] },
  { q: '단축키 목록은 어디서 보나요?', source: ['단축키'] },
  { q: '구글 드라이브 파일을 열 수 있나요?', source: ['Google 드라이브'] },
  { q: '업데이트는 어떻게 하나요?', source: ['업데이트'] },
  { q: 'ChatGPT 무료 계정으로도 되나요?', source: ['ChatGPT', 'Codex'] },
  { q: 'Can I use it on a Mac?', source: ['Mac'] },
  { q: '아이폰 앱도 있나요?', source: [], must: ['없'] },
  { q: '엑셀 VBA 매크로를 실행할 수 있나요?', source: [] },
  { q: '오늘 점심 메뉴 추천해 줘', source: [], mustNot: ['짜장', '김치찌개'] },
  {
    // a follow-up must not take back a right answer on the strength of an old release note
    before: [
      { role: 'user', content: '인텔 맥북에서도 되나요?' },
      { role: 'assistant', content: '아니요, Intel Mac에서는 실행되지 않습니다. Apple Silicon(M1 이후) Mac과 macOS 12 이상에서 쓸 수 있습니다.' },
    ],
    q: '그럼 윈도우 7에서는요?',
    source: ['Windows'],
    must: ['Windows 10'],
    mustNot: ['근거 없', '정정', 'Windows용으로만'],
  },
]

const withAnswer = process.argv.includes('--answer')
const offline = process.argv.includes('--offline')
let failed = 0

for (const c of CASES) {
  const history = [...(c.before ?? []), { role: 'user', content: c.q }]
  let titles = []
  let answer = ''
  if (withAnswer) {
    for await (const event of ask(history)) {
      if (event.type === 'found') titles = event.items.map((i) => i.title)
      if (event.type === 'text') answer += event.text
    }
  } else {
    titles = (offline ? await retrieve(c.q) : await findPieces(history)).map((p) => p.title)
  }

  const problems = []
  if (c.source.length && !titles.some((t) => c.source.some((s) => t.includes(s))))
    problems.push(`모델에 넘긴 자료 ${titles.length}개에 ${c.source.join('/')} 없음`)
  if (withAnswer) {
    for (const w of c.must ?? []) if (!answer.includes(w)) problems.push(`답에 "${w}" 없음`)
    for (const w of c.mustNot ?? []) if (answer.includes(w)) problems.push(`답에 "${w}" 있음`)
  }
  if (problems.length) failed++
  console.log(`${problems.length ? '✗' : '✓'} ${c.q}`)
  for (const t of titles.slice(0, 3)) console.log(`    · ${t}`)
  if (withAnswer) console.log(answer.replace(/^/gm, '    > '))
  for (const p of problems) console.log(`    ! ${p}`)
}

console.log(`\n${CASES.length - failed}/${CASES.length} 통과`)
process.exitCode = failed ? 1 : 0
