# 이음오피스 소개 사이트

[이음오피스](https://github.com/pblsketch/openoffice)를 소개하고 설치 파일을 내려받는 한 쪽짜리 사이트입니다. Vite로 만들고 Vercel에 올립니다.

```sh
npm install
npm run dev      # 로컬에서 보기
npm run build    # dist/ 에 만들기
```

`main`에 push하면 Vercel이 자동으로 배포합니다(프로젝트 `ieumoffice`, https://ieumoffice.vercel.app).

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

내려받기 버튼은 저절로 새 버전을 가리키지만, 소개 글과 화면은 손으로 고칩니다. 이음오피스 저장소의 `docs/releasing.ko.md` 12번이 이 절차를 부릅니다.

1. **"새 버전" 칸**(`index.html`의 `#new`)을 그 버전의 릴리스 본문 "새로 들어간 것"에 맞춰 다시 씁니다. 머리글의 버전 번호, 제목과 소개 문단, 큰 기능 1~3개의 캡처와 설명, 나머지 기능 네 개 안팎, 맨 아래 "바뀐 점 전체 보기"의 태그 주소를 고칩니다. 앞 버전의 내용은 지웁니다(바뀐 점의 전체 목록은 GitHub 릴리스가 맡습니다).
2. **다른 칸과 어긋나지 않게** 봅니다. 편집기 설명(`src/main.js`의 `FORMATS`), 한글·AI·비용·개인정보 칸의 문장이 새 기능이나 바뀐 동작과 맞는지 확인합니다.
3. **캡처**는 그 버전으로 빌드한 이음오피스(`IEUM_REPO`, 기본 `E:/github/openoffice-release`)로 찍습니다. 새 장면은 `capture/capture.mjs`에 장면 함수를 하나 더해 이름으로 찍고(`node capture/capture.mjs split pdf-reading`), 그 이름만 변환합니다(`python capture/optimize.py split pdf-reading`). 화면이 크게 바뀐 편집기는 기존 캡처도 다시 찍습니다. 엑셀을 다시 찍으면 `MARKS`도 맞춥니다.
4. **문구**는 humanizer로 AI 티를 걷어 냅니다. 오피스가 먼저이고 AI는 보조 도구로 씁니다.
5. `npm run build`와 `npx vite preview`로 데스크톱·모바일 폭에서 확인하고(`node capture/preview.mjs`), 저장소 주인의 확인을 받은 뒤 `main`에 push합니다. Vercel이 배포하면 https://ieumoffice.vercel.app 에서 "새 버전" 칸과 내려받기 버튼의 버전을 다시 봅니다.
