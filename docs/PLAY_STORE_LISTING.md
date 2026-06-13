# Play Store Listing Draft

## App Basics

- App name: Limit Idle
- Version target: 0.1.0 MVP
- Category direction: math-themed idle/incremental game
- Monetization: no ads, no IAP
- Data model: local save only through `localStorage`
- Server transfer: none planned for MVP

## Korean Short Descriptions

1. f(x)를 키우고 미분으로 성장하는 수학 기반 방치형 게임
2. 공식을 키워 거대한 숫자를 만드는 수학 idle game
3. 미분, 적분, 극한으로 성장하는 숫자 방치형 게임

## English Short Descriptions

1. Grow f(x), differentiate, and build a math idle engine
2. Upgrade formulas into huge numbers in a math idle game
3. Differentiate, integrate, and push limits in an idle game

## Korean Long Description

Limit Idle은 f(x)를 성장시키며 거대한 숫자를 만들어내는 수학 기반 방치형 게임입니다.

계수를 업그레이드해 함수의 생산력을 높이고, 충분히 성장하면 미분을 통해 DX와 AP를 얻어 다시 더 빠르게 성장하세요. 이후 Exponential, Integral, Limit 시스템을 통해 공식은 점점 더 강력해집니다.

복잡한 조작보다 성장 흐름과 숫자 폭발을 즐기는 게임입니다. 짧게 접속해 업그레이드하고, 잠시 쉬었다가 돌아와 더 큰 수식을 만들어 보세요.

주요 특징:

- f(x) 기반 FV 생산
- 미분을 통한 환생 성장
- DX/AP 기반 영구 성장
- 자동화와 AP 연구
- Exponential, Integral, Limit로 확장되는 수학 테마
- 로컬 저장 기반 플레이
- 광고 없음, 인앱 구매 없음

## English Long Description

Limit Idle is a math-themed idle game about growing f(x) into larger and larger numbers.

Upgrade coefficients to increase FV production. When your function grows enough, differentiate to earn DX and AP, then rebuild faster with permanent progress. Later systems expand the formula through Exponential, Integral, and Limit layers.

The game focuses on clear idle growth, reset decisions, and number scaling rather than complex controls. Check in, upgrade, differentiate, and come back to a stronger formula.

Features:

- FV production based on f(x)
- Differentiation prestige for DX and AP
- Permanent growth through AP research
- Automation upgrades
- Exponential, Integral, and Limit progression layers
- Local save support
- No ads and no in-app purchases in the MVP

## Screenshot Plan

1. Main Variable screen with FV, f(x), Next Goal, and upgrade cards.
2. Derivative screen showing the first differentiation condition and DX/AP reward preview.
3. Automation screen showing auto upgrades and AP research.
4. Exponential or Integral screen showing the next growth layer.
5. Stats or Settings screen showing achievements, persistence, and tutorial replay.

Use real in-app screenshots. Avoid device frames, artificial review text, pricing language, download calls to action, and features not present in the MVP.

## Feature Graphic Copy Options

1. Grow f(x). Differentiate. Repeat.
2. A math idle game about bigger formulas
3. From f(x) to infinity

Feature graphic requirements from Google Play preview assets:

- JPEG or 24-bit PNG, no alpha
- 1024px by 500px
- Keep key text and UI centered to avoid cutoff
- Avoid ranking, price, or time-sensitive claims

Source: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

## App Icon Notes

Google Play store listing icon requirements:

- 32-bit PNG with alpha
- 512px by 512px
- Maximum file size 1024KB

Source: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

## Privacy Policy Draft

Limit Idle does not require an account and does not send gameplay data to a server in the 0.1.0 MVP.

The app stores game progress locally on the device using browser local storage inside the app WebView. This local save can include values such as FV, DX, AP, upgrades, achievements, settings, and timestamps used for offline progress.

The MVP does not include ads, analytics SDKs, in-app purchases, push notifications, or third-party login.

Deleting app data or uninstalling the app may remove local save data. The developer cannot recover deleted local saves because no server backup is used.

If future versions add analytics, ads, cloud saves, accounts, purchases, or server features, this policy and the Play Data safety form must be updated before release.

## Data Safety Draft

MVP declaration direction, assuming the shipped Android build matches the current code:

- Data collected: No
- Data shared: No
- Data encrypted in transit: Not applicable because no user data is transmitted
- Account creation: No account required
- User deletion request: Not applicable for server data; users can clear local app data or uninstall
- Location: Not collected
- Personal info: Not collected
- Financial info: Not collected
- App activity: Not collected by server or third-party analytics
- Device or other IDs: Not collected for analytics or advertising

Before Play Console submission, verify the final AAB:

- No ad SDK
- No analytics SDK
- No billing SDK unless IAP is intentionally enabled
- No unexpected network permission or network calls
- Data safety answers match actual runtime behavior

Google requires accurate and complete Data safety declarations:
https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

## Policy Risk Checklist

- Store listing does not claim ads/IAP if they are disabled.
- Short descriptions stay under 80 characters.
- Screenshots show current app UI only.
- Feature graphic avoids price, ranking, and call-to-action language.
- If `VITE_ENABLE_IAP=true` is ever used in a release build, listing, billing setup, purchase restore, and Data safety must be revised.
- If this is a new personal developer account, prepare closed testing with at least 12 opted-in testers for 14 continuous days before production access:
  https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
