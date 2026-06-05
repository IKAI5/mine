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

## Firebase Realtime Database 연결

1. Firebase 콘솔에서 웹 앱을 만듭니다.
2. Build 메뉴에서 Realtime Database를 생성합니다.
3. Firebase 콘솔의 웹 앱 설정값을 `firebase-config.js`에 입력합니다.
4. `databaseURL` 값도 반드시 입력합니다. 예: `https://프로젝트ID-default-rtdb.firebaseio.com`
5. 저장 경로는 `minesweeperRecords`이며, 화면에는 `seconds` 오름차순 TOP 10 기록이 표시됩니다.

Firebase 웹 설정값은 앱 식별용 공개 값입니다. 실제 보안은 Realtime Database 보안 규칙에서 관리하세요.

개발 중 빠른 테스트용 규칙 예시는 아래와 같습니다. 공개 배포 전에는 인증 기반 규칙으로 바꾸는 것을 권장합니다.

```json
{
  "rules": {
    "minesweeperRecords": {
      ".read": true,
      ".write": true,
      ".indexOn": ["seconds"]
    }
  }
}
```

## Vercel 배포

GitHub 저장소를 Vercel에 연결한 뒤 기본 설정 그대로 배포하면 됩니다.
빌드 명령과 출력 폴더는 비워두어도 됩니다.
