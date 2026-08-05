# Building & Running From VS Code Only (No Android Studio GUI)

Android Studio installed the tools you actually need (the Android SDK,
Gradle, `adb`) — but the *IDE window itself* is optional. Everything below
runs from VS Code's integrated terminal.

## One-time setup: make sure `adb` is on your PATH

`adb` (Android Debug Bridge) is what installs apps onto your phone from the
command line. It ships with Android Studio's SDK but isn't automatically
on your terminal's PATH on Windows.

1. Find your SDK's `platform-tools` folder — usually:
   ```
   C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools
   ```
2. Add that folder to your Windows PATH:
   - Search "Environment Variables" in the Start menu → **Edit the system
     environment variables** → **Environment Variables** button
   - Under "User variables", select **Path** → **Edit** → **New** → paste
     that folder path → OK on everything
3. **Open a brand new terminal** (same rule as always — PATH changes need a
   fresh window) and verify:
   ```powershell
   adb --version
   ```

## The commands (also added as npm scripts below)

### 1. Sync your latest code changes into each native project
```powershell
npm run android:customer:sync
npm run android:worker:sync
```
(This replaces opening Android Studio and clicking Sync — it's the same
`cap sync` step, just from the terminal.)

### 2. Build a debug APK (fast, for testing — not the signed release version)
```powershell
npm run android:customer:build
npm run android:worker:build
```
Output lands at:
```
android-customer/app/build/outputs/apk/debug/app-debug.apk
android-worker/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Install directly onto your phone

Plug your phone in via USB with USB debugging enabled (same as before —
Settings → Developer Options → USB debugging). Confirm it's detected:
```powershell
npm run android:devices
```
You should see your phone listed. Then:
```powershell
npm run android:customer:install
npm run android:worker:install
```
This installs (or updates) the app directly — no Android Studio window ever
needs to open.

### 4. Watch logs (optional, replaces Android Studio's Logcat panel)
```powershell
adb logcat *:E
```
Shows only errors from the phone in real time — useful if the app crashes
and you want to see why, right in your VS Code terminal.

## Building the real signed release APK from the terminal

The debug build above is for quick testing. For the actual signed release
version (the one meant for the website's download button), use the same
Gradle property flags the GitHub Actions workflow uses:

```powershell
cd android-customer
.\gradlew.bat assembleRelease `
  "-Pandroid.injected.signing.store.file=..\..\fixora-release.keystore" `
  "-Pandroid.injected.signing.store.password=FixoraRelease2026!" `
  "-Pandroid.injected.signing.key.alias=fixora-customer" `
  "-Pandroid.injected.signing.key.password=FixoraRelease2026!"
```
(Place `fixora-release.keystore` — the file I generated earlier — at your
`fixora` project root first, adjusting the `..\..\` path if you put it
somewhere else.) Repeat with `android-worker` and `fixora-worker` as the
alias for the worker app.

Output: `android-customer/app/build/outputs/apk/release/app-release.apk` —
rename and drop into `fixora/public/downloads/` same as before.

## What you still can't fully avoid

The Android SDK and build tools themselves still had to come from Android
Studio's installer — there's no way around installing that once, since
that's how Google distributes the SDK. But past that one-time install, you
never need to open the Android Studio *application window* again — every
command above is plain terminal, runnable from VS Code.
