# 지뢰찾기

9x9 보드, 지뢰 10개 규칙의 웹 지뢰찾기입니다.

## 규칙

- 좌클릭: 칸 열기
- 우클릭: 깃발 설치/해제
- 지뢰를 밟으면 패배
- 안전한 칸을 전부 열면 승리
- 첫 클릭은 항상 안전

## 실행

별도 설치 없이 `index.html`을 브라우저에서 열면 실행됩니다.

## Firebase 연결

1. Firebase 콘솔에서 웹 앱을 만들고 Firestore Database를 활성화합니다.
2. Firebase 콘솔의 웹 앱 설정값을 `firebase-config.js`에 입력합니다.
3. Firestore 컬렉션 이름은 `minesweeperRecords`입니다.

Firebase 웹 설정값은 앱 식별용 공개 값입니다. 실제 보안은 Firestore 보안 규칙에서 관리하세요.

## Vercel 배포

GitHub 저장소를 Vercel에 연결한 뒤 기본 설정 그대로 배포하면 됩니다.
빌드 명령과 출력 폴더는 비워두어도 됩니다.
