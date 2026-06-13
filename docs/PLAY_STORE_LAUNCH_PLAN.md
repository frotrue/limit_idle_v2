# Limit Idle Play Store 출시 로드맵

작성일: 2026-06-14  
대상 저장소: `frotrue/limit_idle_v2`  
목표: `Limit Idle`을 Google Play 첫 MVP 버전으로 출시하기 위한 방향성, 작업 순서, Codex 작업 프롬프트, 체크리스트 정리

---

## 0. 최종 결론

현재 `limit_idle_v2`는 **단순 프로토타입은 아니지만, 바로 공개 출시하기에는 개선이 필요한 단계**이다.

권장 전략은 다음이다.

> **B. 완성도 강화형**  
> 대규모 리팩토링은 미루고, 첫 출시 전에는 저장 안정성, IAP 숨김, 모바일 WebView 저장 lifecycle, 초반 10분 이해도, 모바일 UX, Android 패키징, Play Store 메타데이터를 우선한다.

첫 출시 목표는 완벽한 장기 운영 게임이 아니라, 다음 조건을 만족하는 **0.1.0 MVP**이다.

- 앱이 Android 기기에서 안정적으로 실행된다.
- 저장/불러오기/오프라인 진행이 깨지지 않는다.
- 첫 10분 안에 “f(x)를 키우고 미분으로 성장한다”는 핵심 재미가 전달된다.
- 작동하지 않는 IAP/Shop이 노출되지 않는다.
- Google Play 내부/비공개 테스트에 올릴 수 있는 AAB 빌드 파이프라인이 있다.
- Store listing, Data safety, Privacy policy, 테스트 트랙 준비가 되어 있다.

---

## 1. 현재 상태 요약

### 1.1 게임/기술 상태

현재 프로젝트는 다음 성격을 가진다.

- Vue + Vite 기반 웹앱
- `break_eternity.js` 기반 큰 수 처리
- 수학 기반 증분/방치형 게임
- 주요 성장 흐름: `FV → f(x) 계수 성장 → 미분으로 DX/AP → Exponential → Integral → Limit`
- `npm test`, `npm run sim:10m`, `npm run sim:check`, `npm run sim:1h`, `npm run sim:24h` 등의 테스트/시뮬레이션 스크립트 존재

### 1.2 아키텍처 상태

현재 구조는 **출시 가능한 MVP에 가까우나, 내부적으로는 전환기 구조**이다.

- UI는 `@/game` public API를 통해 게임 기능을 import하는 방향으로 정리되어 있다.
- 하지만 실제 핵심 구현은 아직 큰 `src/gameLogic.js`에 많이 남아 있다.
- `src/game/` 아래 모듈 구조는 장기적으로 맞는 방향이지만, 출시 전 대규모 이전은 위험하다.

따라서 출시 전 원칙은 다음이다.

> **새로운 구조 리팩토링보다, 현재 구조를 안정화해서 출시한다.**

---

## 2. 출시 준비도 판정

### 2.1 한 줄 판정

**개선 필요 단계.**

게임 루프, 저장, 오프라인 진행, 탭 UI, 테스트/시뮬레이션 기반은 이미 MVP 후보 수준까지 와 있다. 하지만 Play Store 첫 출시 기준으로는 다음 항목이 아직 리스크이다.

- 첫 10분 이해도
- 모바일 설명력
- 저장/마이그레이션 안정성
- Android WebView lifecycle 저장
- Android 패키징/AAB
- IAP/Shop 정책 리스크
- Store listing/Privacy/Data safety 준비

### 2.2 출시 준비도 점수

**58 / 100점**

감점 이유는 “게임이 없다”가 아니라, **첫 유저가 10분 안에 재미와 목표를 이해하지 못할 가능성**과 **Play Store 제출 파이프라인이 아직 없다는 점**이다.

---

## 3. 게임 방향성 정의

`Limit Idle`은 다음처럼 정의하는 것이 좋다.

> **내가 키운 수학 함수가 점점 거대한 숫자를 만들어내는 방치형 성장 게임.**

조금 더 구체적으로는 다음이다.

> `f(x)`의 계수를 키워 FV를 생산하고, 충분히 성장하면 미분을 통해 DX/AP를 얻어 다시 더 빠르게 성장하는 수학 기반 숫자 성장 게임.

Store 설명이나 온보딩에서는 “수학 기반 방치형”이라고만 말하기보다 다음 표현이 더 직관적이다.

- 공식을 키우는 방치형 숫자 성장 게임
- f(x)를 성장시키고 미분으로 더 빠르게 돌아오는 게임
- 미분, 적분, 극한으로 성장층을 확장하는 idle game

---

## 4. 핵심 문제 5개와 처리 방향

## 4.1 저장/불러오기 안정성 문제

### 문제

`loadGame()`에서 `data.limit`이 없을 때 `game.achievements = []`로 처리하는 분기가 있다. 의도는 Limit 기본값 복원일 가능성이 높지만, 구버전 save에서 업적이 사라질 수 있는 형태이다.

### 출시 전 처리 여부

**반드시 출시 전에 처리한다.**

방치형 게임에서 저장 데이터 손실은 가장 치명적인 문제이다. 초반 UX보다 먼저 고쳐야 한다.

### 해결 방향

- `data.limit`이 없으면 `game.limit`을 기본값으로 복원한다.
- achievements는 limit 누락과 무관하게 보존한다.
- save/load roundtrip 테스트를 추가한다.
- Decimal-heavy state, achievements 유지, 구버전 save, limit 누락 save를 테스트한다.

---

## 4.2 Shop/IAP 노출 문제

### 문제

현재 Shop 탭에는 `$0.99` 영구 2배 부스트가 보이고, `window.CdvPurchase`를 전제로 구매 로직이 존재한다. 하지만 현재 프로젝트는 기본적으로 Vite/Vue 웹앱 구조이며, Android 결제 플러그인과 Play Billing 검증 파이프라인이 준비되어 있지 않다.

### 출시 전 처리 여부

**반드시 출시 전에 처리한다.**

작동하지 않거나 검증되지 않은 IAP UI는 Play Store 심사와 사용자 신뢰 모두에 리스크이다.

### 해결 방향

첫 MVP에서는 IAP를 숨긴다.

- `VITE_ENABLE_IAP=true`일 때만 Shop 탭 표시
- 기본값은 숨김
- 기존 IAP 코드는 삭제하지 않고 feature flag로 보존
- Store listing에는 IAP가 없다는 전제로 작성
- IAP를 다시 켤 때는 Google Play Billing 정책, 상품 등록, 구매 복원, 라이선스 테스터, 환불 처리까지 검증

---

## 4.3 Android 패키징 파이프라인 부재

### 문제

현재 프로젝트는 웹앱으로는 실행 가능하지만, Play Store에 올리기 위한 Android App Bundle 빌드 파이프라인이 없다.

### 출시 전 처리 여부

**반드시 출시 전에 처리한다.**

### 해결 방향

첫 MVP는 다음 방향이 현실적이다.

- Capacitor로 Android WebView 앱 패키징
- appId: `com.frotrue.limitidle`
- appName: `Limit Idle`
- `npm run build`
- `npx cap sync android`
- Android Studio에서 release AAB 생성
- 실제 기기에서 저장/오프라인/백그라운드 복귀 테스트

Google Play 제출 기준상 Android App Bundle은 앱의 compiled code와 resources를 포함하고, Google Play가 기기별 APK를 생성한다. 공식 문서: https://developer.android.com/guide/app-bundle

또한 현재 신규 앱은 Android 15, API level 35 이상을 target해야 한다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en

---

## 4.4 첫 10분 이해도 문제

### 문제

현재 `sim:check`는 첫 Differentiation/Exponential 해금을 15~25분 구간으로 보고 있다. 이 경우 첫 10분 플레이에서는 핵심 차별점인 “미분으로 성장한다”가 늦게 전달될 수 있다.

또한 현재 Next Goal은 `Unlock Exponential` 중심이라, 첫 유저 입장에서는 “당장 무엇을 해야 하는지”가 약하게 느껴질 수 있다.

### 출시 전 처리 여부

**출시 전에 처리한다.**

다만 저장/IAP/패키징보다 먼저 할 필요는 없다.

### 해결 방향

목표는 다음이다.

- 3분 안에 다음 목표가 보임
- 5분 안에 미분의 의미를 이해
- 8~12분 안에 첫 미분 가능
- 15분 안에 다음 성장층 예고

작업 방식은 다음 순서가 좋다.

1. Next Goal 문구 개선
2. Derivative 탭 잠금/조건/예상 보상 표시
3. 첫 실행 온보딩 3장 추가
4. 이후 시뮬레이션 기준으로 초반 밸런스 최소 조정

무조건 첫 미분을 6분 이하로 당기기보다는, **8~12분 사이**를 1차 목표로 잡는다.

---

## 4.5 대규모 리팩토링 유혹

### 문제

현재 구조는 `src/game/` public API와 legacy `gameLogic.js`가 공존하는 전환기이다. 출시 전에 구조를 완전히 정리하려 하면 저장, 밸런스, 오프라인 진행, 자동화가 함께 흔들릴 수 있다.

### 출시 전 처리 여부

**출시 전 대규모 리팩토링은 하지 않는다.**

### 해결 방향

출시 전에는 다음만 지킨다.

- UI 신규 작업은 계속 `@/game`을 통해 접근
- `gameLogic.js` 내부 대규모 이동 금지
- 저장/밸런스 테스트를 먼저 보강
- 구조 개선은 출시 후 `0.2.x`, `0.3.x`로 분리

출시 후 리팩토링 순서는 다음이 좋다.

1. `manualTick`
2. `prestige/differentiation`
3. `automation`
4. `persistence/load/reset`
5. `balance formulas`

---

## 5. 실제 작업 우선순위

최종 권장 순서는 다음이다.

1. 저장/불러오기 roundtrip 테스트와 limit migration 버그 수정
2. Shop/IAP feature flag 처리
3. Android WebView lifecycle 저장 안정성 추가
4. Next Goal과 Derivative 안내 개선
5. 첫 실행 온보딩 추가
6. 첫 미분 타이밍 조정
7. 모바일 터치/가독성 QA
8. Capacitor Android 패키징 PR
9. Play Store 메타데이터 문서 작성

핵심은 다음이다.

> **저장 안정성 → Shop 숨김 → WebView 저장 lifecycle → 초반 설명 개선 → 밸런스 조정 → Android 패키징 → Store 준비**

---

## 6. 2주 로드맵

## Week 1: 저장 안정성, IAP 제거, 초반 UX 기반

### Day 1 — 출시 범위 동결

결정 사항:

- 첫 출시 버전: `0.1.0 MVP`
- IAP/광고 없음
- 새 성장 시스템 추가 금지
- 대규모 리팩토링 금지
- 목표: 첫 10분 이해도 + 저장 안정성 + Android 테스트 빌드

산출물:

- 이 문서 기준으로 작업 순서 확정
- Codex 작업은 PR 단위로 분리

---

### Day 2 — 저장/불러오기 버그 수정

작업:

- `data.limit` 누락 시 achievements 초기화 버그 수정
- Limit 기본값 복원
- save/load roundtrip 테스트 추가
- Decimal-heavy save 테스트 추가
- 구버전 save migration 테스트 추가

검증:

```bash
npm test
npm run build
```

---

### Day 3 — Shop/IAP feature flag 처리

작업:

- `VITE_ENABLE_IAP=true`일 때만 Shop 탭 표시
- 기본값은 Shop 숨김
- Shop 숨김 상태에서 `$0.99`, 구매 버튼, CdvPurchase 초기화가 노출되지 않도록 처리
- 기존 IAP 코드는 보존

검증:

```bash
npm test
npm run build
```

---

### Day 4 — Android WebView lifecycle 저장

작업:

- `visibilitychange`에서 hidden 시 save
- `pagehide`에서 save
- Capacitor 환경이면 `App.pause` / `App.resume` 이벤트 고려
- Capacitor가 없는 브라우저에서도 오류 없이 동작
- 기존 30초 자동 저장 유지

검증:

```bash
npm test
npm run build
```

수동 검증:

- 앱 실행
- 진행도 생성
- 브라우저 탭 닫기/새로고침
- 저장 유지 확인

---

### Day 5 — Next Goal / Derivative 안내 개선

작업:

- Next Goal을 신규 유저 기준으로 수정
- Exponential보다 먼저 Differentiation 목표를 보여줌
- Derivative 탭에 조건/예상 보상/초기 설명 추가
- “미분하면 현재 진행도를 초기화하고 DX/AP를 얻는다”를 더 쉽게 설명

검증:

```bash
npm test
npm run build
```

수동 검증:

- 새 저장 데이터로 0~10분 플레이
- 다음 목표가 혼란스럽지 않은지 확인

---

### Day 6 — 첫 실행 온보딩 추가

작업:

3장짜리 온보딩 추가:

1. FV는 f(x)가 만들어내는 값입니다.
2. 계수를 업그레이드하면 f(x)가 커지고 FV 생산이 빨라집니다.
3. 충분히 커지면 미분해서 DX/AP를 얻고 더 빠르게 다시 성장합니다.

요구사항:

- localStorage에 온보딩 확인 여부 저장
- Settings에서 다시 보기 가능
- 긴 튜토리얼 금지
- 게임 진행 방해 최소화

검증:

```bash
npm test
npm run build
```

---

### Day 7 — 초반 밸런스 1차 고정

작업:

- `npm run sim:10m`
- `npm run sim:check`
- 첫 Differentiation 예상 시간 확인
- 목표: 첫 미분 8~12분
- 필요하면 x⁰/x¹ 가격, 초기 FV, x 증가량, 첫 미분 조건/보상 중 최소만 조정

검증:

```bash
npm test
npm run sim:10m
npm run sim:check
npm run build
```

---

## Week 2: 모바일 QA, Android 패키징, Play Store 준비

### Day 8 — 모바일 UI QA

확인할 화면 폭:

- 320px
- 360px
- 390px
- 412px
- 450px

확인 항목:

- HUD 숫자 overflow
- f(x) 문자열 카드 밖 넘침
- 탭 버튼 터치 영역
- Buy / Buy Max 버튼 가독성
- modal alert 가독성
- system tabs 줄바꿈

검증:

```bash
npm test
npm run build
```

---

### Day 9 — Capacitor Android 기본 설정

작업:

- Capacitor 설치
- `capacitor.config.*` 추가
- appId: `com.frotrue.limitidle`
- appName: `Limit Idle`
- Android 프로젝트 생성
- build 후 sync script 추가
- `docs/PLAY_RELEASE.md` 작성

검증:

```bash
npm run build
npx cap sync android
```

Android Studio에서 확인:

- 프로젝트 열림
- debug 실행 가능
- release AAB 생성 가능

---

### Day 10 — 실제 Android 기기 테스트

수동 테스트 시나리오:

1. 앱 설치
2. 새 게임 시작
3. 10분 플레이
4. 앱 백그라운드 이동
5. 앱 강제 종료
6. 재실행
7. 저장 유지 확인
8. 5분 이상 방치 후 오프라인 보상 확인
9. 화면 회전/뒤로가기 동작 확인
10. Shop/IAP 미노출 확인

---

### Day 11 — Play Store 메타데이터 초안

작업:

- 짧은 설명
- 긴 설명
- 스크린샷 구성안
- feature graphic 문구
- 개인정보처리방침 초안
- Data safety 답변 초안

---

### Day 12 — Store 자산 제작

필수:

- App icon: 512x512 PNG
- Feature graphic: 1024x500 JPEG 또는 PNG
- Screenshot: 최소 2장, 권장 4장 이상

Google Play 공식 문서 기준, 앱 아이콘은 512x512 PNG가 필요하고, feature graphic은 1024x500 규격이 요구된다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

추천 스크린샷 구성:

1. f(x)를 키우는 기본 화면
2. 미분으로 DX/AP를 얻는 화면
3. 자동화/업적 화면
4. Exponential/Integral 예고 화면
5. Settings/Stats 화면

---

### Day 13 — Internal testing 업로드

작업:

- Play Console 앱 생성
- AAB 업로드
- Internal testing track 배포
- Pre-launch report 확인
- 기기 호환성 확인
- Data safety/Privacy policy 누락 여부 확인

---

### Day 14 — Closed testing 준비

작업:

- 테스터 그룹 준비
- 테스터 안내문 작성
- 피드백 질문지 작성
- known issues 작성
- `0.1.0-beta` 기준으로 closed test 시작

새 개인 개발자 계정은 production access 전에 최소 12명의 테스터가 14일 연속 closed test에 opt-in 되어 있어야 할 수 있다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en

---

## 7. 1개월 로드맵

## Week 1 — MVP 안정화

목표:

- 저장/불러오기 안정화
- Shop/IAP 숨김
- lifecycle 저장 추가
- Next Goal 개선
- 온보딩 추가
- 첫 미분 타이밍 8~12분으로 조정

완료 조건:

```bash
npm test
npm run sim:10m
npm run sim:check
npm run build
```

---

## Week 2 — Android 빌드와 실기기 검증

목표:

- Capacitor Android 프로젝트 생성
- Android Studio 실행 가능
- AAB 생성 가능
- 실제 기기에서 저장/오프라인/백그라운드 검증
- 모바일 UI QA

완료 조건:

- Debug APK 설치 가능
- Release AAB 생성 가능
- 앱 종료/재실행 후 저장 유지
- 5분 이상 방치 후 오프라인 보상 정상
- Shop/IAP 기본 미노출

---

## Week 3 — Store listing / Privacy / Data safety

목표:

- 앱 이름/설명 작성
- 스크린샷 제작
- Feature graphic 제작
- Privacy policy 작성
- Data safety form 초안 작성
- Internal testing track 업로드

Data safety는 모든 published app에 필요하며, closed/open/production testing track도 포함된다. 내부 테스트만 활성화된 앱은 예외가 있을 수 있지만, 출시 준비 문서상 미리 작성하는 것이 안전하다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

---

## Week 4 — Closed test와 출시 후보 고정

목표:

- Closed testing 시작
- 테스터 피드백 수집
- 치명적 버그 수정
- 0.1.0 production 후보 고정
- production access 신청 준비

완료 조건:

- 12명 이상 테스터 opt-in 조건 확인
- 저장/오프라인 관련 치명적 이슈 없음
- 첫 10분 피드백에서 “무엇을 해야 하는지 모르겠다” 비율 낮음
- AAB 재빌드/재업로드 절차 문서화

---

## 8. PR 단위 작업 계획

## PR 1 — 저장/불러오기 roundtrip 테스트와 limit migration 버그 수정

목표:

- 저장 안정성 확보
- 구버전 save에서 achievements 손실 방지

완료 조건:

- `data.limit` 누락 시 achievements 유지
- limit 기본값 복원
- save/load roundtrip 테스트 추가
- Decimal-heavy state 테스트 추가
- `npm test` 통과

---

## PR 2 — MVP 출시용 Shop/IAP feature flag 처리

목표:

- Play Store MVP에서 검증되지 않은 IAP 제거

완료 조건:

- 기본 상태에서 Shop 탭 숨김
- `VITE_ENABLE_IAP=true`일 때만 Shop 표시
- Shop 숨김 상태에서 CdvPurchase 초기화 없음
- `$0.99` 문구 미노출
- `npm test`, `npm run build` 통과

---

## PR 3 — Android WebView lifecycle 저장 안정성 추가

목표:

- 모바일 WebView에서 앱 종료/백그라운드 시 저장 누락 방지

완료 조건:

- `visibilitychange` 저장
- `pagehide` 저장
- Capacitor pause/resume 안전 처리
- 일반 웹 환경 오류 없음
- 기존 자동 저장 유지

---

## PR 4 — Next Goal과 Derivative 안내 개선

목표:

- 첫 유저가 다음 목표와 미분의 의미를 이해하게 함

완료 조건:

- Next Goal이 첫 미분 목표를 우선 안내
- Derivative 탭에 조건/예상 보상/설명 추가
- 용어는 유지하되 설명은 쉬운 한국어로 보강

---

## PR 5 — 첫 실행 온보딩 추가

목표:

- 첫 실행 1분 안에 게임 핵심 구조 전달

완료 조건:

- 3장 온보딩
- localStorage에 확인 여부 저장
- Settings에서 다시 보기 가능
- 긴 튜토리얼 금지

---

## PR 6 — 초반 밸런스 조정

목표:

- 첫 Differentiation을 8~12분 안에 경험하게 함

완료 조건:

- `balanced` 전략 기준 첫 미분 8~12분
- `sim:check` expectation 갱신
- 후반 밸런스 대규모 변경 금지
- 변경 전후 시뮬레이션 결과 문서화

---

## PR 7 — 모바일 터치/가독성 QA

목표:

- 작은 화면에서 UI가 깨지지 않게 함

완료 조건:

- 320~450px 폭 확인
- 탭, HUD, 버튼, modal, f(x) overflow 처리
- 디자인 시스템 대규모 변경 금지

---

## PR 8 — Capacitor Android 패키징

목표:

- Play Store 제출 가능한 Android 빌드 파이프라인 생성

완료 조건:

- Capacitor 설정 추가
- Android 프로젝트 생성
- appId/appName 설정
- AAB 빌드 절차 문서화
- 게임 로직 변경 없음

---

## PR 9 — Play Store 메타데이터 문서 작성

목표:

- Store listing 제출 준비

완료 조건:

- `docs/PLAY_STORE_LISTING.md` 추가
- 짧은 설명/긴 설명 초안
- 스크린샷 구성안
- feature graphic 문구
- privacy policy 초안
- Data safety 초안

---

## 9. Codex 작업 프롬프트

아래 프롬프트는 그대로 Codex에게 넘길 수 있다.

---

### Prompt 1 — 저장/불러오기 roundtrip 테스트와 limit migration 버그 수정

```md
`frotrue/limit_idle_v2`에서 `loadGame()`의 구버전 save migration 문제를 수정해줘.

현재 `data.limit`이 없을 때 achievements가 초기화될 수 있는 분기가 있다. Limit 데이터가 없는 구버전 save에서는 achievements를 지우지 말고, limit 기본값만 정상 복원하도록 수정해줘.

요구사항:
- 기존 save serializer 구조 유지
- public API 변경 금지
- 구버전 save에서 achievements 유지
- limit 누락 save에서 limit 기본값 복원
- Decimal-heavy game state에 대한 save/load roundtrip 테스트 추가
- malformed save backup/recovery 기존 동작 유지
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 2 — MVP 출시용 Shop/IAP feature flag 처리

```md
첫 Play Store MVP에서는 IAP를 비활성화할 수 있도록 Shop 탭을 feature flag로 숨기는 구조를 추가해줘.

요구사항:
- 기본값은 Shop/IAP 숨김
- `VITE_ENABLE_IAP=true`일 때만 Shop 탭과 구매 UI 표시
- IAP 비활성 상태에서는 `$0.99`, 구매하기 버튼, CdvPurchase 초기화가 노출/실행되지 않아야 함
- 기존 ShopTab/IAP 코드는 삭제하지 말고 보존
- 게임 로직과 밸런스는 변경하지 말 것
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 3 — Android WebView lifecycle 저장 안정성 추가

```md
모바일 WebView에서 앱이 백그라운드로 가거나 종료될 때 저장이 누락되지 않도록 lifecycle 저장 훅을 추가해줘.

요구사항:
- 기존 30초 자동 저장 유지
- `visibilitychange`에서 document hidden 시 saveGame 호출
- `pagehide`에서 saveGame 호출
- Capacitor 환경이면 App pause/resume 이벤트를 안전하게 처리
- Capacitor가 없는 일반 웹 환경에서도 오류가 나지 않아야 함
- 중복 이벤트 등록/해제 문제가 없어야 함
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 4 — Next Goal과 Derivative 안내 개선

```md
현재 HUD의 `Next Goal`과 Derivative 탭 문구를 신규 유저 기준으로 개선해줘.

목표:
- 첫 유저가 10분 안에 “f(x)를 키우고 미분으로 DX/AP를 얻는다”는 구조를 이해하게 한다.

요구사항:
- Exponential 해금보다 먼저 Differentiation 목표를 명확히 보여줘
- Derivative 탭에 잠금/조건/예상 DX 보상/미분의 의미를 설명하는 안내 추가
- 수학 용어는 유지하되, 설명은 쉬운 한국어로 보강
- 게임 로직/밸런스는 변경하지 말 것
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 5 — 첫 실행 온보딩 추가

```md
`frotrue/limit_idle_v2`에서 첫 실행 유저를 위한 3단계 온보딩 카드를 추가해줘.

온보딩 내용:
1. FV는 f(x)가 만들어내는 값입니다.
2. 계수를 사면 f(x)가 커지고 FV 생산이 빨라집니다.
3. 충분히 커지면 미분해서 DX/AP를 얻고 다시 빠르게 성장합니다.

요구사항:
- localStorage에 온보딩 확인 여부 저장
- Settings에서 온보딩 다시 보기 가능
- 너무 긴 튜토리얼 금지
- 게임 로직/밸런스 변경 금지
- 모바일 화면에서도 보기 좋게 구현
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 6 — 첫 미분 타이밍 8~12분으로 조정

```md
시뮬레이션 기준 balanced 전략에서 첫 Differentiation이 8~12분 사이에 발생하도록 초반 밸런스를 최소 조정해줘.

요구사항:
- 조정 범위는 초기 FV, x⁰/x¹ 가격, x 증가량, 첫 미분 조건/보상 중 필요한 최소 항목으로 제한
- 후반 Exponential/Integral/Limit 밸런스 대규모 변경 금지
- 변경 전후 `npm run sim:10m` 결과 비교
- `npm run sim:check` expectation을 새 목표에 맞게 갱신
- 작업 후 `npm test`, `npm run sim:10m`, `npm run sim:check`, `npm run build` 통과
```

---

### Prompt 7 — 모바일 터치/가독성 QA 패스

```md
320px~450px 모바일 폭에서 HUD, main tabs, system tabs, Buy/Buy Max 버튼, alert modal의 터치 영역과 줄바꿈을 점검하고 CSS를 최소 수정해줘.

목표:
- 작은 화면에서 탭 라벨이 깨지지 않음
- 버튼 터치 영역이 너무 작지 않음
- f(x)와 큰 숫자가 카드 밖으로 넘치지 않음
- modal이 화면 밖으로 나가지 않음

제약:
- 색상/디자인 시스템 대규모 변경 금지
- 게임 로직 변경 금지
- 작업 후 `npm test`와 `npm run build` 통과
```

---

### Prompt 8 — Capacitor Android 패키징 PR

```md
현재 Vite/Vue 앱을 Capacitor Android 앱으로 감싸는 최소 설정만 추가해줘.

목표는 Play Store 출시 완성이 아니라, Android Studio에서 열고 AAB 빌드까지 가능한 기본 파이프라인을 만드는 것이다.

요구사항:
- Capacitor 설정 추가
- appId: `com.frotrue.limitidle`
- appName: `Limit Idle`
- production build 결과물을 Android asset으로 sync하는 npm script 추가
- Android 프로젝트 생성
- `docs/PLAY_RELEASE.md`에 로컬 빌드 절차 작성
- target SDK는 Google Play 현재 요구사항을 만족하도록 설정
- 게임 로직, UI, 밸런스는 변경하지 말 것
- IAP/광고는 추가하지 말 것
```

---

### Prompt 9 — Play Store 메타데이터 문서 작성

```md
`docs/PLAY_STORE_LISTING.md`를 추가해서 Play Store 제출용 메타데이터 초안을 작성해줘.

전제:
- 앱 이름: Limit Idle
- 장르: 수학 기반 방치형/증분 게임
- 첫 MVP에서는 광고 없음, IAP 없음
- 저장은 로컬 저장 중심
- 서버 전송 없음

포함할 내용:
- 한국어 짧은 설명 3개 후보
- 영어 짧은 설명 3개 후보
- 한국어 긴 설명 초안
- 영어 긴 설명 초안
- 스크린샷 구성안 5장
- feature graphic 문구 후보
- 개인정보처리방침 초안
- Data safety 제출 가이드
- 심사 리스크 체크리스트
```

---

## 10. Play Store 출시 체크리스트

## 10.1 Android 패키징

- [ ] Capacitor Android 또는 동등한 Android wrapper 결정
- [ ] `applicationId`: `com.frotrue.limitidle`
- [ ] `versionCode` 설정
- [ ] `versionName`: `0.1.0`
- [ ] Android 15 / API level 35 이상 target
- [ ] release signing 설정
- [ ] AAB 생성 가능
- [ ] 실제 Android 기기 설치 가능
- [ ] localStorage 저장 유지 확인
- [ ] back button 동작 확인
- [ ] background/foreground 복귀 확인
- [ ] 앱 강제 종료 후 재실행 저장 확인

---

## 10.2 테스트 트랙

- [ ] Internal testing track 업로드
- [ ] Pre-launch report 확인
- [ ] Closed testing track 준비
- [ ] 테스터 이메일 그룹 준비
- [ ] 테스터 안내문 작성
- [ ] 10분 플레이 피드백 질문 작성
- [ ] 새 개인 개발자 계정이면 12명/14일 조건 확인
- [ ] Production access 신청 준비

---

## 10.3 앱 아이콘/그래픽

- [ ] App icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 JPEG 또는 24-bit PNG
- [ ] Phone screenshots 최소 2장
- [ ] 권장 screenshots 4장 이상
- [ ] 스크린샷은 실제 앱 화면 기반
- [ ] “1위”, “최고”, “무료”, “할인” 등 오해성 문구 금지
- [ ] Store listing과 실제 앱 기능 일치

---

## 10.4 설명문

짧은 설명 후보:

1. `f(x)를 키우고 미분으로 성장하는 수학 기반 방치형 게임`
2. `공식을 키워 거대한 숫자를 만드는 수학 idle game`
3. `미분, 적분, 극한으로 성장하는 숫자 방치형 게임`

긴 설명 초안:

```text
Limit Idle은 f(x)를 성장시키며 거대한 숫자를 만들어가는 수학 기반 방치형 게임입니다.

계수를 업그레이드해 함수의 생산력을 높이고, 충분히 성장하면 미분을 통해 DX와 AP를 얻어 다시 더 빠르게 성장하세요. 이후 Exponential, Integral, Limit 시스템을 통해 공식은 점점 더 강력해집니다.

복잡한 조작보다 성장 흐름과 숫자 폭발을 즐기는 게임입니다.

주요 특징:
- f(x) 기반 FV 생산
- 미분을 통한 환생 성장
- 자동화와 연구 시스템
- Exponential, Integral, Limit로 확장되는 수학 테마
- 오프라인 진행 지원
- 로컬 저장 기반 플레이
```

---

## 10.5 개인정보처리방침 / Data safety

첫 MVP 전제:

- 광고 없음
- IAP 없음
- 분석 SDK 없음
- 서버 통신 없음
- 계정 로그인 없음
- 로컬 저장만 사용

이 전제가 유지된다면 Data safety는 “사용자 데이터를 수집/공유하지 않음” 방향으로 작성할 수 있다. 단, 실제 Android 빌드에 포함되는 SDK가 데이터를 전송하면 반드시 반영해야 한다.

체크리스트:

- [ ] Privacy policy URL 준비
- [ ] 앱 내부 Settings에 Privacy policy 링크 추가
- [ ] localStorage 외 데이터 저장 여부 확인
- [ ] 네트워크 요청 여부 확인
- [ ] 광고/분석/IAP SDK 포함 여부 확인
- [ ] Data safety form 답변과 실제 앱 동작 일치

Google Play는 Data safety form에 대해 개발자가 정확하고 완전한 선언을 해야 하며, 앱 동작과 선언이 다르면 정책 조치가 있을 수 있다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

---

## 10.6 광고/IAP

첫 MVP 권장:

- [x] 광고 없음
- [x] IAP 없음
- [x] Shop 숨김

IAP를 다시 켤 때 필요한 것:

- [ ] Google Play Billing 사용
- [ ] one-time product 등록
- [ ] license tester 설정
- [ ] 구매 성공 처리
- [ ] 구매 복원 처리
- [ ] 환불/취소 후 상태 처리
- [ ] Store listing에 IAP 명시

Google Play 배포 앱에서 인앱 기능/디지털 콘텐츠 결제는 원칙적으로 Google Play billing system을 사용해야 한다. 공식 문서: https://support.google.com/googleplay/android-developer/answer/9858738?hl=en

---

## 11. 출시 전 테스트 명령

일반 refactor 전:

```bash
npm test
npm run build
```

밸런스 변경 전후:

```bash
npm test
npm run sim:10m
npm run sim:check
npm run sim:1h
npm run build
```

큰 밸런스 변경 후:

```bash
npm run sim:24h
```

Android sync 전:

```bash
npm run build
npx cap sync android
```

---

## 12. 실제 기기 테스트 시나리오

## 12.1 새 게임 10분 테스트

- [ ] 첫 화면에서 FV/f(x)가 이해되는가
- [ ] 첫 목표가 보이는가
- [ ] Buy 버튼을 누를 이유가 보이는가
- [ ] 미분이 무엇인지 5분 안에 이해되는가
- [ ] 첫 미분이 8~12분 사이에 가능한가
- [ ] 숫자가 카드 밖으로 넘치지 않는가

---

## 12.2 저장 테스트

- [ ] 수동 저장 가능
- [ ] 자동 저장 가능
- [ ] 앱 백그라운드 이동 시 저장
- [ ] 앱 강제 종료 후 저장 유지
- [ ] 재실행 시 FV/DX/AP/업적 유지
- [ ] Settings reset 동작 정상

---

## 12.3 오프라인 진행 테스트

- [ ] 5분 오프라인 보상 정상
- [ ] 1시간 오프라인 보상 정상
- [ ] 24시간 오프라인 보상 성능 문제 없음
- [ ] 오프라인 보상 알림이 너무 길거나 불편하지 않음

---

## 12.4 Android WebView 테스트

- [ ] Back button 처리
- [ ] 화면 회전 처리
- [ ] 작은 화면 overflow 없음
- [ ] 스크롤 정상
- [ ] alert modal 화면 밖으로 나가지 않음
- [ ] 앱 재실행 시 white screen 없음

---

## 13. 테스터 피드백 질문

Closed test 때 테스터에게 물어볼 질문:

1. 첫 1분 안에 무엇을 하는 게임인지 이해했나요?
2. FV와 f(x)의 관계가 이해됐나요?
3. 미분 버튼이 왜 중요한지 이해됐나요?
4. 첫 10분 동안 지루했던 구간이 있었나요?
5. 어떤 버튼을 눌러야 할지 모르는 순간이 있었나요?
6. 글자가 너무 작거나 버튼이 누르기 어려운 부분이 있었나요?
7. 앱을 껐다 켰을 때 진행도가 유지됐나요?
8. 오프라인 보상이 자연스럽게 느껴졌나요?
9. Store 설명과 실제 게임이 일치한다고 느꼈나요?
10. 공개 출시 전에 반드시 고쳐야 할 점은 무엇인가요?

---

## 14. 출시 전 하지 말아야 할 일

- [ ] 새 성장층 추가
- [ ] Limit 후반 밸런스 대규모 개편
- [ ] `gameLogic.js` 대규모 분리
- [ ] 광고 SDK 추가
- [ ] 검증 안 된 IAP 활성화
- [ ] 온라인 서버/계정 시스템 추가
- [ ] 디자인 전체 리뉴얼
- [ ] 테스트 없이 가격 공식 수정
- [ ] Store 설명에 아직 없는 기능 작성

출시 전에는 다음 원칙을 지킨다.

> **새 기능 추가가 아니라, 이미 있는 게임을 이해 가능하고 안정적으로 만드는 것.**

---

## 15. Go / No-Go 기준

## 15.1 Internal testing Go 기준

- [ ] `npm test` 통과
- [ ] `npm run build` 통과
- [ ] Android debug 실행 가능
- [ ] 저장/재실행 정상
- [ ] Shop/IAP 기본 미노출
- [ ] 10분 플레이 가능

---

## 15.2 Closed testing Go 기준

- [ ] Release AAB 생성 가능
- [ ] Internal testing에서 치명적 crash 없음
- [ ] 실제 기기 2대 이상에서 실행 확인
- [ ] 온보딩/Next Goal 적용
- [ ] 첫 미분 8~12분 목표 달성 또는 강한 예고 제공
- [ ] Privacy policy / Data safety 초안 준비

---

## 15.3 Production Go 기준

- [ ] Closed test 피드백 반영
- [ ] 저장 데이터 손실 이슈 없음
- [ ] 앱 종료/재실행/오프라인 보상 정상
- [ ] Store listing과 실제 기능 일치
- [ ] target SDK 기준 충족
- [ ] AAB 업로드 가능
- [ ] Privacy policy 접근 가능
- [ ] Data safety 정확히 작성
- [ ] 심사 리스크 항목 제거

---

## 16. 참고 공식 문서

- Android App Bundle: https://developer.android.com/guide/app-bundle
- Target API level requirements: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- New personal developer account testing requirements: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
- Preview assets: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
