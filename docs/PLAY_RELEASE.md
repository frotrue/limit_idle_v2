# Play Release Build Notes

## Scope

Limit Idle `0.1.0` MVP ships as a Capacitor Android wrapper around the Vite build.

- App ID: `com.frotrue.limitidle`
- App name: `Limit Idle`
- Web build directory: `dist`
- Ads: none
- IAP: disabled by default
- Network/server transfer: none expected for MVP
- Local persistence: browser `localStorage`

## Requirements

- Node matching `package.json` engines
- Android Studio with Android SDK installed
- JDK supported by the installed Android Gradle Plugin. This project was verified with JDK 21; JDK 25 failed with `Unsupported class file major version 69`.
- Google Play target API check before every release

Current generated Capacitor Android settings use:

- `compileSdkVersion = 36`
- `targetSdkVersion = 36`
- `minSdkVersion = 24`

Google Play currently requires new apps and app updates to target Android 15 / API 35 or higher from August 31, 2025:
https://support.google.com/googleplay/android-developer/answer/11926878?hl=en

Capacitor target SDK is managed through `android/variables.gradle`:
https://capacitorjs.com/docs/android/setting-target-sdk

## Build And Sync

```bash
npm install
npm test
npm run sim:10m
npm run sim:check
npm run build
npm run android:sync
```

`android:sync` runs the production Vite build and then `npx cap sync android`.

## Debug Run

1. Run `npm run android:sync`.
2. Open `android/` in Android Studio.
3. Let Gradle sync finish.
4. Select an emulator or real Android device.
5. Run the `app` configuration.
6. Verify Shop is not visible unless `VITE_ENABLE_IAP=true` is used for the web build.

## Release AAB

1. Open `android/` in Android Studio.
2. Confirm `android/app/build.gradle` has:
   - `applicationId "com.frotrue.limitidle"`
   - `versionCode 1`
   - `versionName "0.1.0"`
3. Use `Build > Generate Signed App Bundle / APK`.
4. Select `Android App Bundle`.
5. Use the release keystore.
6. Build the release bundle.
7. Upload the generated `.aab` to an internal testing track first.

CLI verification used locally:

```bash
# PowerShell example when multiple JDKs are installed
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.6+7"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
cd android
.\gradlew.bat :app:bundleRelease
```

Expected local output:

- `android/app/build/outputs/bundle/release/app-release.aab`

## Device QA Checklist

- Fresh install starts without white screen.
- First launch tutorial appears once.
- Reload/restart does not show tutorial again after Start.
- Settings > Show Tutorial reopens the tutorial.
- FV, DX, AP, achievements, research, and UI layout persist after restart.
- Backgrounding the app saves progress.
- Foreground restore keeps playable state.
- Force close and reopen preserves latest saved progress.
- Offline progress after 5+ minutes is awarded normally.
- Back button does not corrupt state.
- Rotation or resize does not create text overflow at 320-450px widths.
- Shop tab is hidden by default.
- No ad, analytics, billing, or server SDK is present in the MVP build.

## Play Testing Notes

If this is a newly created personal developer account, closed testing may require at least 12 opted-in testers for 14 continuous days before production access:
https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
