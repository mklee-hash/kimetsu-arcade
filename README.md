# 귀살 아케이드 (Kimetsu Arcade)

귀멸의 칼날 세계관(다이쇼 시대, 혈귀, 호흡, 등나무, 귀살대 계급)을 모티브로 한 브라우저 게임 네 편.
공식 캐릭터 이름·로고·음악은 쓰지 않고, 이름 없는 오리지널 검사와 오리지널 혈귀/곡으로 만들었다.
모두 설치 없이 PC(마우스/키보드)와 휴대폰(터치)에서 동작하는 단일 HTML 파일이다.

## 🔗 플레이하기

**https://mklee-hash.github.io/kimetsu-arcade/** — Claude 계정 없이 누구나 바로 접속 가능
(GitHub Pages가 `main` 브랜치의 `docs/`를 그대로 서빙한다).

## 게임

| 파일 | 이름 | 장르 | 조작 |
|---|---|---|---|
| `web/slash.html` | 새벽의 일섬 | 스와이프 액션 (과일닌자식) | 누른 채 빠르게 긋기, 스페이스 = 오의 |
| `web/survivors.html` | 무한의 밤 | 뱀서라이크 생존 로그라이트 | WASD/방향키, 터치 드래그 조이스틱 |
| `web/rhythm.html` | 호흡의 박자 | 4레인 리듬 액션 | D F J K / 방향키 / 하단 터치 |
| `web/cards.html` | 귀살의 부적 | 덱빌딩 로그라이크 (슬더스식) | 클릭/탭 |

`web/index.html`은 네 게임으로 가는 시작 페이지다. 결과 화면은 모두 귀살대 계급(癸→甲→柱)으로 평가한다. 柱(주)는 甲보다 높은 최고위 계급이다.

## 공통 규칙

- 외부 리소스는 Google Fonts(Nanum Brush Script, Gowun Dodum)뿐. 그래픽은 Canvas/SVG로 절차 생성, 소리는 WebAudio로 합성.
- 기록은 `localStorage`의 `kimetsu-arcade:` 접두사 키에 저장(실패해도 게임은 동작).
- 밤하늘 단일 다크 팔레트: `#0b0e22`(밤) `#efe6d2`(종이) `#d8343f`(피) `#a58bdc`(등나무) `#f2b24a`(새벽).

## 배포 (GitHub Pages)

`web/`을 수정한 뒤 `sh build.sh`로 `docs/`에 복사하고 커밋·푸시한다. Pages는 `main` 브랜치의 `/docs`를 그대로 서빙한다.
