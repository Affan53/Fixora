# Automated APK Builds (No Android Studio Clicking Required)

This is the permanent fix for "I want a real APK when someone clicks
Download." Instead of you manually running Android Studio's Generate
Signed APK wizard every time something changes, **GitHub's own servers
build both real, signed APKs automatically** every time you push code —
then commit them straight into your website's download folder.

## What I've already done for you

- Generated a **real, valid Android signing keystore** (`fixora-release.keystore`,
  attached below) with two keys — one for each app
- Written the complete build pipeline (`.github/workflows/build-apk.yml`)
  that: builds both web apps, creates the native Android projects, compiles
  signed release APKs, and commits them into `fixora/public/downloads/`

## What you need to do (one-time setup, ~10 minutes)

### 1. Put this project on GitHub

If you don't already have it there:
1. Go to https://github.com/new → create a repository (can be private)
2. Follow GitHub's instructions to push this existing project to it —
   roughly:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/fixora.git
   git push -u origin main
   ```

### 2. Add the signing key as a GitHub secret

The keystore file itself must never be committed to your repo in plain
form — it goes in as an encrypted "secret" instead.

**On Windows**, convert the attached `fixora-release.keystore` file to
base64 text:
```powershell
certutil -encode fixora-release.keystore fixora-release.keystore.b64
```
Open the resulting `.b64` file in a text editor, copy everything **except**
the first and last lines (`-----BEGIN CERTIFICATE-----` /
`-----END CERTIFICATE-----`).

Then in your GitHub repo: **Settings → Secrets and variables → Actions →
New repository secret**, create two secrets:

| Name | Value |
|---|---|
| `FIXORA_KEYSTORE_BASE64` | the base64 text you just copied |
| `FIXORA_KEYSTORE_PASSWORD` | `FixoraRelease2026!` |

**Keep the actual `fixora-release.keystore` file safe somewhere permanent**
(a password manager, encrypted drive, etc.) — if you ever lose it, you
cannot release updates to these exact apps again; you'd have to publish
them as brand-new apps.

### 3. Push and watch it build

Once those two secrets are set, just push any change (or go to the
**Actions** tab in your GitHub repo → select "Build Fixora Android APKs" →
**Run workflow** to trigger it manually the first time).

It takes several minutes (downloading Android SDK components, compiling
twice). When it finishes, both `fixora-customer.apk` and
`fixora-worker.apk` will be sitting in `fixora/public/downloads/`,
auto-committed by the workflow itself.

### 4. Connect this to your live website

If your frontend is deployed on Vercel and connected to this GitHub repo,
Vercel automatically redeploys whenever the workflow commits — so your
website's existing "Download — Book a Worker" / "Download — Become a
Worker" buttons start serving real, freshly-built APKs with zero further
manual steps, forever, every time you change the app.

## Honest limitations of this approach

- **I can't run this workflow myself** to confirm it works end-to-end —
  GitHub Actions only runs inside GitHub's own infrastructure, triggered
  by a real push to a real repo, neither of which exists from where I'm
  working. You'll need to try it and send me the **Actions tab logs** if
  anything fails, same as we've done with every other build error so far.
- Each build takes real time (Android SDK setup + two full compiles) —
  expect 5-10 minutes per run, not instant.
- If Google ever changes the Android Gradle Plugin version compatibility,
  this workflow may need a version bump — treat the first successful run
  as the real test, not this document.
