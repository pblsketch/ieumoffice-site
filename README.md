# 이음오피스 소개 사이트

[이음오피스](https://github.com/pblsketch/ieumoffice)를 소개하고 설치 파일을 내려받는 한 쪽짜리 사이트입니다. Vite로 만들고 Vercel에 올립니다.

페이지는 다섯 개이고, 모든 페이지에 질문 도우미 창이 붙습니다(아래 "질문 도우미"). 메인(`index.html`), 업데이트 소식(`updates.html`, 주소 `/updates`), 만든 이야기(`story.html`, 주소 `/story`), 설치 도움말(`install.html`, 주소 `/install`), AI 연결 도움말(`connect.html`, 주소 `/connect`). 만든 이야기는 저장소 주인이 직접 쓴 글이므로 맞춤법과 띄어쓰기 말고는 손대지 않습니다.

설치 도움말은 "지금 보이는 화면"을 고르면 다시 그린 화면 위에서 마우스가 누를 곳을 차례로 보여 줍니다. 장면마다 주소가 있어(`/install#edge`, `#pc-protect`, `#smart-app-control`, `#find-file`, `#installer`, `#mac`, `#linux`) 의견 보내기 답장에 그대로 붙일 수 있습니다. 화면은 그림이 아니라 HTML이라 Edge나 Windows 문구가 바뀌면 `install.html`의 글자만 고칩니다. 움직임 순서는 `src/install.js`의 `SCENES`에 있습니다. 메인에는 내려받기 상자 아래 카드 한 줄과, 내려받기를 누른 직후 뜨는 작은 안내만 둡니다. 예전 주소 `/#mac`, `/#linux`는 설치 도움말로 넘어갑니다.

AI 연결 도움말은 앱의 연결 도우미(앱 저장소 결정 0047)와 같은 질문 "지금 쓰고 있는 AI가 있나요?"로 시작해, 고른 길(Claude 구독, ChatGPT 바로 연결, Codex 프로그램, 무료 AI)을 다시 그린 이음오피스 창 위에서 보여 줍니다. 주소는 `/connect#claude`, `#chatgpt`, `#codex`, `#free`(앱의 "연결하는 방법 화면으로 보기"가 `packages/ai-provider/src/connect-help.ts`에서 이 이름으로 엽니다), 막혔을 때의 답은 `#login-stuck`, `#update`, `#metered`, `#check-failed`, `#claude-free`, `#mac`, `#gemini`입니다. 카드의 글은 앱의 한국어 문구(`packages/ui/src/strings-ai-subscription/ko.ts`, 무료 카드는 `apps/shell/src/renderer/src/strings.ts`)를 그대로 옮겼으니, 앱에서 문구나 단계가 바뀌면 `connect.html`도 맞춥니다. 움직임 순서는 `src/connect.js`에, 두 도움말이 함께 쓰는 재생기는 `src/player.js`에 있습니다.

```sh
npm install
npm run dev      # 로컬에서 보기
npm run build    # dist/ 에 만들기
```

`main`에 push하면 Vercel이 자동으로 배포합니다(프로젝트 `ieumoffice`, https://ieumoffice.com).

주소는 Cloudflare에서 산 `ieumoffice.com`입니다. Cloudflare DNS의 `@`와 `www` CNAME이 Vercel을 가리키고(프록시 끔), `www.ieumoffice.com`과 `ieumoffice.vercel.app`은 `vercel.json`의 `redirects`가 `ieumoffice.com`으로 옮깁니다. 이미 Google에 등록한 `privacy.html`, `form-banner.png`, Search Console 확인 파일만 vercel.app 주소에서도 그대로 열립니다.

앱 캡처(`/shots/`)는 `cdn.ieumoffice.com`에서 내려받습니다(2026-11-09). 캡처가 사이트 전송량의 대부분이라 Vercel 무료 한도(Fast Data Transfer 100GB)를 넘었기 때문입니다. `cdn` CNAME은 `cname.vercel-dns.com`을 가리키고 **이 레코드만 Cloudflare 프록시를 켭니다**. Cloudflare가 캡처를 보관해 내주므로 다시 받는 몫은 Vercel 전송량에 들지 않습니다. 같은 Vercel 프로젝트의 도메인이라 저장소의 `public/shots/`가 그대로 원본이고, `vercel.json`이 이 주소에서 `/shots/` 밖의 경로를 `ieumoffice.com`으로 옮깁니다. 정식 빌드(`VERCEL_ENV=production`)만 `vite.config.js`가 페이지와 `src/main.js`의 캡처 주소를 cdn으로 바꾸고, 미리보기와 로컬 빌드는 같은 주소의 `/shots/`를 씁니다. `@`·`www`의 프록시는 켜지 않습니다. 켜면 질문 도우미의 요청 제한(`api/ask.js`, IP별)이 모든 방문자를 Cloudflare IP 몇 개로 보게 됩니다. 이미 올린 캡처를 같은 이름으로 바꾸면 Cloudflare와 브라우저가 최대 하루 동안 옛 그림을 보여 줄 수 있으니, 새 캡처는 새 이름(예: `-01212`)으로 올립니다.

검색 등록: `robots.txt`와 `sitemap.xml`이 `public/`에 있습니다. 페이지를 더하면 `sitemap.xml`에도 넣고, 각 페이지 `<head>`에 `canonical`을 `https://ieumoffice.com/...`으로 답니다.

내려받기 버튼은 페이지가 열릴 때 GitHub API로 최신 릴리스의 `IeumOffice-Setup-*.exe`를 찾아 연결합니다. Mac은 `-arm64.dmg`(Apple Silicon)와 `-x64.dmg`(Intel)를 따로 찾아 두 줄로 안내하고, 그 버전에 없는 파일은 "준비 중"으로 둡니다. 찾지 못하면 릴리스 페이지로 갑니다. 새 버전을 낼 때 사이트를 다시 올릴 필요는 없습니다.

## 여러 언어

사이트는 한국어, 영어, 일본어, 번체 중국어(대만), 스페인어로 있습니다(2026-11-12). 한국어 페이지가 원본이고 저장소 맨 위에 있습니다. 다른 언어는 같은 페이지를 언어 폴더에 하나씩 둡니다.

| 언어 | 폴더·주소 | `<html lang>` |
| --- | --- | --- |
| 한국어 | 맨 위(`/`, `/updates` …) | `ko` |
| 영어 | `en/` | `en` |
| 일본어 | `ja/` | `ja` |
| 번체 중국어 | `zh-tw/` | `zh-TW` |
| 스페인어 | `es/` | `es` |

- 페이지 여섯 개는 `<폴더>/<이름>.html`, 개인정보 처리방침과 법적 고지는 `public/<폴더>/privacy.html`·`legal.html`입니다. 주소는 `/en/`, `/en/install#mac`처럼 폴더가 앞에 붙고, `vercel.json`의 `rewrites`가 `.html` 없는 주소를 잇습니다.
- 언어 목록은 `src/i18n.js`의 `LANGS` 한 곳입니다. 빌드(`vite.config.js`)가 이 목록으로 페이지를 모으고, 각 페이지의 `<head>`에 `hreflang` 대체 주소를, 위쪽 막대에 언어 메뉴를 넣습니다. 번역본에 메뉴를 손으로 넣지 않습니다. 정적 파일인 개인정보·법적 고지는 맨 위의 언어 줄과 `hreflang`을 직접 적어 두었습니다. `public/sitemap.xml`에도 모든 언어 주소가 있습니다.
- 페이지가 브라우저 언어와 다르고 그 언어판이 있으면 왼쪽 아래에 "이 페이지는 ○○어로도 있습니다" 띠가 한 번 뜹니다(`src/lang-switch.js`). 메뉴에서 언어를 고르거나 띠를 닫으면 그 선택을 브라우저에 기억하고 다시 묻지 않습니다. 주소를 저절로 옮기지는 않습니다.
- 스크립트가 만드는 글(편집기 탭 설명, 내려받기 단추, 단계 재생기, 질문 창)은 각 파일 안의 `{ ko, en, ja, 'zh-TW', es }` 표에 있습니다. 편집기 탭의 다른 언어 글은 `src/formats-copy.js`입니다. 한국어 글을 고치면 이 표들도 같이 고칩니다.
- 화면 캡처는 모든 언어에서 한국어 앱 화면을 씁니다.
- 일본어·중국어 글자는 사이트 글꼴(Wanted Sans)에 없어서 시스템 글꼴로 나옵니다(`src/lang.css`). 그 언어의 글꼴을 `system-ui`보다 앞에 둡니다. 한국어 Windows에서 `system-ui`는 가나를 맑은 고딕으로 그려 글자 사이가 벌어집니다. 두 언어에서는 줄바꿈 규칙도 한국어의 `keep-all` 대신 기본값을 쓰고, 도움말의 다시 그린 Windows 화면도 그 언어의 Windows 글꼴로 그립니다.
- 일본어·중국어 페이지에서는 문장 가운데서 줄을 바꿔 쓰지 않습니다. 브라우저가 한자·가나 사이의 줄바꿈을 빈칸으로 그리기 때문입니다. 검사(아래)가 이런 곳을 찾아 줍니다.
- 질문 도우미의 자료는 한국어 페이지와 앱 도움말 그대로이고, 묻는 언어로 답합니다. 답과 근거의 사이트 링크는 보고 있는 언어판으로 바뀝니다. 자료에 없을 때 쓰는 첫 문장은 언어마다 `lib/no-answer.js`에 정해 두어 기록의 "자료에 없음"이 언어와 관계없이 잡힙니다.
- **번역본 검사**: `npm run check:i18n`(한 언어만 `-- en`, 한 페이지만 `-- en faq`)이 번역본을 한국어 원본과 견줍니다. 아이디(앱과 도움말이 `#claude`, `#mac` 같은 이름으로 연결합니다), `data-*` 연결점, 스크립트·캡처, 요소 수, 사이트 안 링크가 그 언어 폴더에 머무는지, `canonical`·`og:url`·`og:locale`, 한글이 남았는지를 봅니다. 한국어 페이지를 고친 뒤에도 돌려서 번역본이 따라왔는지 봅니다.
- 번역할 때 지키는 것:
  - 제품 이름은 모든 언어에서 IeumOffice입니다. 한글 이름 "이음오피스"는 법적 고지의 상표 문장과 검색용 별칭(JSON-LD `alternateName`)에만 씁니다. 만든 사람 이름은 외국어판에서 "Junil Park (박준일)"로 적고, 메타 태그의 저자는 Junil Park입니다.
  - 앱의 메뉴·단추 이름은 앱의 그 언어 문구를 따릅니다. 앱 저장소 최신 릴리스 태그의 언어 파일(`packages/ui/src/strings-ai-subscription/<언어>.ts`, `apps/shell/src/renderer/src/strings.ts` 등)에서 찾습니다.
  - 말투는 한국어판처럼 어디서 무엇을 하면 어떻게 되는지를 담백하게 적습니다.
  - 개인정보 처리방침과 법적 고지의 번역본 맨 위에는 "편의를 위한 번역이고, 다르면 한국어 원문을 따른다"는 문장이 있습니다.

## 질문 도우미

모든 페이지 오른쪽 아래의 **궁금한 점 묻기** 창(`src/ask.js`, `src/ask.css`)이 서버 함수 `api/ask.js`에 묻고, `lib/qa.js`가 답을 만듭니다. 순서는 이렇습니다.

1. Claude가 지식베이스 목차에서 질문에 맞는 조각을 고릅니다. 목차는 매번 같아서 캐시됩니다.
2. 글자 검색(Orama) 상위 결과와 합쳐 최대 10조각을 고릅니다.
3. Claude가 그 조각에 적힌 것만으로 답하고, 근거 번호를 붙입니다.

자료에 없는 것은 없다고 하고 의견 보내기로 안내합니다. 모델이 실패하면 찾은 안내 조각을 대신 보여 줍니다.

- **지식베이스** `lib/kb-data.js`는 `npm run kb`가 만듭니다. 앱 저장소(옆의 `../openoffice`, 다르면 `IEUM_APP_REPO`)의 **최신 릴리스 태그**에서 한국어 앱 도움말, README, PRIVACY.md를 `git show`로 읽습니다. 앱 폴더의 브랜치나 고치던 내용은 섞이지 않습니다. 여기에 GitHub의 최근 릴리스 본문 5개와 이 사이트의 페이지들을 더합니다. 개발 문서(AGENTS.md, engineering-notes, 결정 기록)는 넣지 않습니다. 같은 자료로 다시 만들면 바이트까지 같은 파일이 나옵니다(만든 날짜를 넣지 않습니다).
- **자주 묻는 질문** `faq.html`은 질문 도우미가 "자료에 없음"으로 끝난 실제 질문을 모은 페이지입니다. 지원 환경(휴대폰·아이패드·Mac), 설치·제거, 한글 저장 오류, PDF 캡처, 엑셀 호환성, 기업 사용, 로컬 LLM처럼 자주 막히는 곳을 적습니다. 새 버전에서 답이 바뀌면 이 페이지도 함께 고칩니다.
- **자동 갱신** `.github/workflows/kb.yml`: 매일 새벽 3시(KST)에 돌고, `main`에 페이지(`*.html`, `public/*.html`)나 `scripts/build-kb.mjs`가 바뀌어 올라갈 때도 돕니다. Actions 탭에서 "Question helper knowledge base" → Run workflow로 손으로 돌릴 수도 있습니다. 하는 일은 이렇습니다.
  1. 앱 저장소의 최신 릴리스 태그를 찾고, 필요한 파일만 받습니다(부분 복제, 몇 MB).
  2. `npm run kb`로 지식베이스를 다시 만들고 `npm run kb:check`로 검사합니다. 출처마다 조각이 남아 있는지, 제품 이름이 바뀌었는지, 조각 크기와 검색 몇 개를 봅니다. 모델은 부르지 않습니다.
  3. 파일이 달라졌으면 `chore(kb): …`로 `main`에 커밋합니다. 그러면 Vercel이 다시 배포합니다. 같으면 아무것도 하지 않습니다.
  4. 검사가 실패하면 커밋하지 않고 빨간 실행으로 남습니다. GitHub가 저장소 주인에게 메일을 보내니, 그 메일이 오면 실행 기록의 ✗ 줄을 봅니다.
- **모델**은 Claude Haiku 5.5(`claude-haiku-5-5`, 바꾸려면 `QA_MODEL`)입니다. 저장소 주인의 Claude Console 조직에서 돌고, 워크스페이스 `ieumoffice-site`에 월 지출 한도 $20이 걸려 있습니다. 한도나 크레딧이 떨어지면 답 대신 안내 조각이 나옵니다.
- **API 키는 없습니다.** Vercel의 OIDC 토큰을 Anthropic Workload Identity Federation으로 짧은 토큰과 바꿉니다. Vercel 환경변수에는 비밀이 아닌 ID 네 개만 있습니다(`ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID`, `ANTHROPIC_WORKSPACE_ID`). 콘솔의 발급자 `https://oidc.vercel.com/wnsdlf1212-6473s-projects`는 최대 토큰 수명이 12시간이어야 합니다. Vercel 토큰 수명이 실제 사이트 2시간, 개발용 12시간이라, 이보다 짧으면 `jwt_lifetime_too_long`으로 거절됩니다. `ANTHROPIC_API_KEY`를 환경에 넣으면 페더레이션보다 먼저 쓰이니 넣지 않습니다.
- **로컬에서 보기**: `vercel env pull .env.local`로 개발용 OIDC 토큰과 ID를 받은 뒤, `npm run dev:api`(질문 서버, 8787)와 `npm run dev`를 함께 띄웁니다. Vite가 `/api`를 질문 서버로 넘깁니다.
- **시험**: `npm run kb:eval`은 질문마다 Claude가 고른 조각에 맞는 자료가 들어갔는지 봅니다. `-- --answer`는 답까지 받아 꼭 들어갈 말과 들어가면 안 되는 말을 봅니다. 질문 20여 개에 몇 센트가 듭니다. `-- --offline`은 Claude 없이 글자 검색만 봅니다. 실제 질문에 틀리게 답한 사례가 생기면 `scripts/kb-eval.mjs`에 넣습니다.
- **대화 기록**: 답이 끝날 때마다 `lib/log.js`가 한 줄을 저장소 주인(pblsketch@gmail.com)의 시트 "이음오피스 질문 도우미 기록"에 보냅니다. 남기는 것은 시각, 질문, 답, 결과(답함 / 자료에 없음 / 답 못 함), 근거 제목, 지식베이스 버전, 대화 차례입니다. IP는 남기지 않고 이메일·전화·주민번호·카드번호 꼴은 가립니다. 시트에 붙은 Apps Script 웹 앱이 받고(`QA_LOG_URL`, 비밀 `QA_LOG_SECRET`), 매일 새벽 90일 지난 줄을 지웁니다. 두 변수가 없으면 기록하지 않습니다. 서버 로그에는 오류 상태 코드만 남깁니다. 사용자에게 알리는 문구는 채팅 창 아래와 `public/privacy.html#ask`에 있습니다. "자료에 없음"으로 끝난 질문은 도움말에 보탤 내용이자 `kb:eval`에 넣을 후보입니다.

## 화면 캡처 다시 만들기

앱 화면은 빌드된 이음오피스를 직접 띄워 찍습니다. 빈 임시 프로필로 띄우므로 찍는 사람의 계정이나 최근 파일이 들어가지 않습니다.

1. 이음오피스 저장소를 빌드해 둡니다(`apps/*/out`). 기본 위치는 `E:/github/openoffice-release`이고, 다르면 `IEUM_REPO`로 알려 줍니다.
2. `capture/samples/`의 예시 문서를 씁니다. 다시 만들려면 `capture/sample-src/`의 스크립트를 실행합니다.
3. 차례로 실행합니다.

```sh
node capture/capture.mjs        # capture/out/*.png (탭 9개와 새 버전 장면)
python capture/optimize.py      # public/shots/*.webp
node capture/og.mjs             # public/og.png (링크 미리보기)
node capture/form-banner.mjs    # public/form-banner.png (의견 설문 머리글)
```

엑셀 화면의 AI 시연에서 강조 상자의 위치는 `src/main.js`의 `MARKS`에 캡처 대비 비율로 적혀 있습니다. 엑셀 캡처가 달라지면 함께 맞춥니다.

`public/form-banner.png`는 앱 안 "의견 보내기"의 Google 설문 머리글입니다. 설문의 테마 맞춤설정 → 헤더 이미지 선택 → URL 사용에 `https://ieumoffice.vercel.app/form-banner.png`를 넣어 두었습니다. 배너를 바꾸면 그 PNG를 다시 올리고, 설문에서도 다시 골라 주세요.

## 새 버전을 낸 뒤

내려받기 버튼은 저절로 새 버전을 가리키지만, 업데이트 소식은 손으로 더합니다. 이음오피스 저장소의 `docs/releasing.ko.md` 13번이 이 절차를 부릅니다.

1. **업데이트 페이지**(`updates.html`, 주소 `/updates`) 맨 위에 새 버전의 `<article class="release" id="v<버전>">`을 하나 더합니다. 앞 버전 항목은 지우지 않고 그대로 둡니다. 날짜, 제목, 두세 줄 소개, 큰 기능 1~3개의 캡처와 설명, 나머지 기능 네 개 안팎, "에서 고친 것까지 전부 보기"의 태그 주소를 채웁니다. 내용은 윤문한 릴리스 본문의 "새로 들어간 것"에서 체감이 큰 것만 고릅니다. 같은 항목을 네 언어판(`en/`, `ja/`, `zh-tw/`, `es/`의 `updates.html`)에도 번역해 더합니다. 주소는 언어 폴더를 붙여(`/en/updates#v<버전>`) 쓰고, 캡처와 태그 링크는 그대로입니다.
2. **메인의 한 줄 안내**(`index.html`의 `.hero-news`)에서 버전 번호, 기능 이름, 링크(`/updates#v<버전>`)를 고칩니다. 네 언어판 메인(`<폴더>/index.html`)의 한 줄 안내도 함께 고칩니다. 다 고친 뒤 `npm run check:i18n`을 돌립니다.
3. **다른 칸과 어긋나지 않게** 봅니다. 편집기 설명(`src/main.js`의 `FORMATS`)과 한글·AI·비용·개인정보 칸의 문장이 새 기능이나 바뀐 동작과 맞는지 확인합니다. 오래 쓸 기능은 메인 소개 칸에도 옮겨 적습니다.
4. **캡처**는 그 버전으로 빌드한 이음오피스(`IEUM_REPO`, 기본 `E:/github/openoffice-release`)로 찍습니다. 새 장면은 `capture/capture.mjs`에 장면 함수를 하나 더해 이름으로 찍고(`node capture/capture.mjs split pdf-reading`), 그 이름만 변환합니다(`python capture/optimize.py split pdf-reading`). 이름은 버전마다 겹치지 않게 짓습니다(앞 버전 항목이 옛 캡처를 계속 씁니다). 엑셀을 다시 찍으면 `MARKS`도 맞춥니다.
5. **문구**는 humanizer로 검토합니다. 추상적인 말("표시", "도구가 늘었다")이나 전문 용어("주석", "릴리스", "본문", "EPUB")는 일반 사용자가 바로 알아듣는 말로 바꾸거나 괄호로 풀어 씁니다. 오피스가 먼저이고 AI는 보조 도구로 씁니다.
6. **질문 도우미의 지식베이스**는 따로 손대지 않아도 됩니다. 8번에서 페이지를 push하면 "Question helper knowledge base" 작업이 새 릴리스 태그와 새 업데이트 페이지로 다시 만들어 커밋합니다. 그 실행이 초록인지, 그리고 `lib/kb-data.js`의 첫 줄 버전이 새 태그인지 확인합니다. `faq.html`의 "0.12.8 기준"(버전 번호)과 지원 환경·설치·저장·호환성 답이 새 버전과 맞는지 먼저 고칩니다. 앱 도움말이 크게 바뀐 버전이면 Claude로 답까지 시험합니다(`vercel env pull .env.local` 뒤 `npm run kb:eval -- --answer`, 몇 센트). 틀린 답이 나오면 지침(`lib/qa.js`)이나 시험 질문(`scripts/kb-eval.mjs`)을 고칩니다.
7. **명령줄 설치 스크립트**: 앱 README가 Linux 사용자에게 `curl -fsSL https://ieumoffice.com/cli/install.sh | sh`를 안내합니다. 새 버전마다 앱 저장소의 `packaging/cli/install.sh`(그 버전의 `DEFAULT_VERSION`)를 `public/cli/install.sh`로 복사합니다. `.gitattributes`가 LF 줄 끝을 지키고, `vercel.json`이 `/cli/`를 일반 글(`text/plain`)로 내보냅니다.
8. `npm run build`와 `npx vite preview`로 데스크톱·모바일 폭에서 `/updates.html`과 메인을 확인하고, 저장소 주인의 확인을 받은 뒤 `main`에 push합니다. Vercel이 배포하면 https://ieumoffice.com/updates 와 메인의 한 줄 안내, 내려받기 버튼의 버전을 다시 봅니다.
