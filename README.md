# 이음오피스 소개 사이트

[이음오피스](https://github.com/pblsketch/openoffice)를 소개하고 설치 파일을 내려받는 한 쪽짜리 사이트입니다. Vite로 만들고 Vercel에 올립니다.

페이지는 네 개입니다. 메인(`index.html`), 업데이트 소식(`updates.html`, 주소 `/updates`), 만든 이야기(`story.html`, 주소 `/story`), 설치 도움말(`install.html`, 주소 `/install`). 만든 이야기는 저장소 주인이 직접 쓴 글이므로 맞춤법과 띄어쓰기 말고는 손대지 않습니다.

설치 도움말은 "지금 보이는 화면"을 고르면 다시 그린 화면 위에서 마우스가 누를 곳을 차례로 보여 줍니다. 장면마다 주소가 있어(`/install#edge`, `#pc-protect`, `#find-file`, `#installer`, `#mac`, `#linux`) 의견 보내기 답장에 그대로 붙일 수 있습니다. 화면은 그림이 아니라 HTML이라 Edge나 Windows 문구가 바뀌면 `install.html`의 글자만 고칩니다. 움직임 순서는 `src/install.js`의 `SCENES`에 있습니다. 메인에는 내려받기 상자 아래 카드 한 줄과, 내려받기를 누른 직후 뜨는 작은 안내만 둡니다. 예전 주소 `/#mac`, `/#linux`는 설치 도움말로 넘어갑니다.

```sh
npm install
npm run dev      # 로컬에서 보기
npm run build    # dist/ 에 만들기
```

`main`에 push하면 Vercel이 자동으로 배포합니다(프로젝트 `ieumoffice`, https://ieumoffice.com).

주소는 Cloudflare에서 산 `ieumoffice.com`입니다. Cloudflare DNS의 `@`와 `www` CNAME이 Vercel을 가리키고(프록시 끔), `www.ieumoffice.com`과 `ieumoffice.vercel.app`은 `vercel.json`의 `redirects`가 `ieumoffice.com`으로 옮깁니다. 이미 Google에 등록한 `privacy.html`, `form-banner.png`, Search Console 확인 파일만 vercel.app 주소에서도 그대로 열립니다.

검색 등록: `robots.txt`와 `sitemap.xml`이 `public/`에 있습니다. 페이지를 더하면 `sitemap.xml`에도 넣고, 각 페이지 `<head>`에 `canonical`을 `https://ieumoffice.com/...`으로 답니다.

내려받기 버튼은 페이지가 열릴 때 GitHub API로 최신 릴리스의 `IeumOffice-Setup-*.exe`를 찾아 연결합니다. 찾지 못하면 릴리스 페이지로 갑니다. 새 버전을 낼 때 사이트를 다시 올릴 필요는 없습니다.

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

1. **업데이트 페이지**(`updates.html`, 주소 `/updates`) 맨 위에 새 버전의 `<article class="release" id="v<버전>">`을 하나 더합니다. 앞 버전 항목은 지우지 않고 그대로 둡니다. 날짜, 제목, 두세 줄 소개, 큰 기능 1~3개의 캡처와 설명, 나머지 기능 네 개 안팎, "에서 고친 것까지 전부 보기"의 태그 주소를 채웁니다. 내용은 윤문한 릴리스 본문의 "새로 들어간 것"에서 체감이 큰 것만 고릅니다.
2. **메인의 한 줄 안내**(`index.html`의 `.hero-news`)에서 버전 번호, 기능 이름, 링크(`/updates#v<버전>`)를 고칩니다.
3. **다른 칸과 어긋나지 않게** 봅니다. 편집기 설명(`src/main.js`의 `FORMATS`)과 한글·AI·비용·개인정보 칸의 문장이 새 기능이나 바뀐 동작과 맞는지 확인합니다. 오래 쓸 기능은 메인 소개 칸에도 옮겨 적습니다.
4. **캡처**는 그 버전으로 빌드한 이음오피스(`IEUM_REPO`, 기본 `E:/github/openoffice-release`)로 찍습니다. 새 장면은 `capture/capture.mjs`에 장면 함수를 하나 더해 이름으로 찍고(`node capture/capture.mjs split pdf-reading`), 그 이름만 변환합니다(`python capture/optimize.py split pdf-reading`). 이름은 버전마다 겹치지 않게 짓습니다(앞 버전 항목이 옛 캡처를 계속 씁니다). 엑셀을 다시 찍으면 `MARKS`도 맞춥니다.
5. **문구**는 humanizer로 검토합니다. 추상적인 말("표시", "도구가 늘었다")이나 전문 용어("주석", "릴리스", "본문", "EPUB")는 일반 사용자가 바로 알아듣는 말로 바꾸거나 괄호로 풀어 씁니다. 오피스가 먼저이고 AI는 보조 도구로 씁니다.
6. `npm run build`와 `npx vite preview`로 데스크톱·모바일 폭에서 `/updates.html`과 메인을 확인하고, 저장소 주인의 확인을 받은 뒤 `main`에 push합니다. Vercel이 배포하면 https://ieumoffice.com/updates 와 메인의 한 줄 안내, 내려받기 버튼의 버전을 다시 봅니다.
