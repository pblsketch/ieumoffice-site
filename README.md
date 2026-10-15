# 이음오피스 소개 사이트

[이음오피스](https://github.com/pblsketch/openoffice)를 소개하고 설치 파일을 내려받는 한 쪽짜리 사이트입니다. Vite로 만들고 Vercel에 올립니다.

```sh
npm install
npm run dev      # 로컬에서 보기
npm run build    # dist/ 에 만들기
```

내려받기 버튼은 페이지가 열릴 때 GitHub API로 최신 릴리스의 `IeumOffice-Setup-*.exe`를 찾아 연결합니다. 찾지 못하면 릴리스 페이지로 갑니다. 새 버전을 낼 때 사이트를 다시 올릴 필요는 없습니다.

## 화면 캡처 다시 만들기

앱 화면은 빌드된 이음오피스를 직접 띄워 찍습니다. 빈 임시 프로필로 띄우므로 찍는 사람의 계정이나 최근 파일이 들어가지 않습니다.

1. 이음오피스 저장소를 빌드해 둡니다(`apps/*/out`). 기본 위치는 `E:/github/openoffice-release`이고, 다르면 `IEUM_REPO`로 알려 줍니다.
2. `capture/samples/`의 예시 문서를 씁니다. 다시 만들려면 `capture/sample-src/`의 스크립트를 실행합니다.
3. 차례로 실행합니다.

```sh
node capture/capture.mjs        # capture/out/*.png (탭 9개)
python capture/optimize.py      # public/shots/*.webp
node capture/og.mjs             # public/og.png (링크 미리보기)
```

엑셀 화면의 AI 시연에서 강조 상자의 위치는 `src/main.js`의 `MARKS`에 캡처 대비 비율로 적혀 있습니다. 엑셀 캡처가 달라지면 함께 맞춥니다.
