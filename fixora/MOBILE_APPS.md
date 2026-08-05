# Fixora Mobile Apps — Customer + Partner

Rapido ships two separate apps: the customer-facing Rapido app, and the
separate Rapido Captain app for riders. Fixora now mirrors that with one
shared codebase producing two distinct installable apps:

- **Fixora** (`com.fixora.customer`) — the "Book a Worker" app
- **Fixora Partner** (`com.fixora.partner`) — the "Become a Worker" app,
  which skips the marketing homepage entirely and opens straight to the
  worker login, same as how Rapido Captain doesn't show you a customer
  storefront

## What's already set up for you

- `capacitor.customer.config.json` and `capacitor.worker.config.json` — the
  two app identities (package name, display name)
- `npm run build:customer` and `npm run build:worker` — build the web app
  twice, once per variant, into `dist-customer/` and `dist-worker/`
- `App.jsx` detects which variant it's running as and changes the home
  screen accordingly (worker build → straight to worker login)

## What I can't do from here

Turning a web build into an actual installable `.apk` (Android) or `.ipa`
(iOS) requires compiling a real native project — that needs Android
Studio (and for iOS, Xcode, which only runs on a Mac) actually installed
and running on a real machine. I don't have that available in this
sandboxed environment, so the steps below are what **you'll** run locally.
Send me whatever error shows up at any step, same as we've been doing with
the backend.

## Step 1 — Install Android Studio

Download from https://developer.android.com/studio and install it. This
also installs the Android SDK you need. Open it once and let it finish its
first-time setup (it downloads additional components).

## Step 2 — Create the two native app projects

Capacitor only supports one active app config per native project folder,
so the reliable way to keep two separate apps is two separate folders.
From your `fixora` project root:

```bash
# Customer app
copy capacitor.customer.config.json capacitor.config.json    (Windows)
cp capacitor.customer.config.json capacitor.config.json      (Mac/Linux)
npm run build:customer
npx cap add android
ren android android-customer                                  (Windows: rename)
mv android android-customer                                    (Mac/Linux)

# Worker app
copy capacitor.worker.config.json capacitor.config.json
npm run build:worker
npx cap add android
ren android android-worker
```

You should now have two folders: `android-customer/` and `android-worker/`
— each a complete, separate native Android project.

## Step 3 — Open and run each app

```bash
# Whenever you change the web app and want to update either native app:
copy capacitor.customer.config.json capacitor.config.json
npm run build:customer
npx cap sync android-customer

copy capacitor.worker.config.json capacitor.config.json
npm run build:worker
npx cap sync android-worker
```

Then in Android Studio: **File → Open** → select the `android-customer` (or
`android-worker`) folder → let it sync/index → click the green ▶ Run
button with an emulator or a real phone connected via USB (with Developer
Mode + USB debugging enabled on the phone).

## Step 4 — App icons and splash screens

Right now both apps use Capacitor's default icon. Before publishing, run:

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

pointing it at your Fixora logo (the one from `public/images/logo-mark.png`)
for a real branded icon instead of the placeholder.

## Step 5 — Publishing to the Play Store

1. Create a Google Play Console account: https://play.google.com/console —
   one-time **$25 registration fee**
2. In Android Studio: **Build → Generate Signed Bundle / APK** → choose
   **Android App Bundle** → create a new signing key (keep this file and
   password safe forever — you need the same one for every future update)
3. Create two separate app listings in Play Console (one per app), each
   needs: app name, description, screenshots, a privacy policy URL, and a
   content rating questionnaire
4. Upload the signed `.aab` file to each listing
5. Google reviews new apps before they go live — this can take anywhere
   from a few hours to a few days

## Step 6 — iOS (only if you have a Mac)

Same idea with `npx cap add ios`, but building and submitting requires
Xcode (Mac-only) and an active Apple Developer account (**$99/year**,
recurring, not one-time). If you don't have a Mac, this isn't something
that can be done — there's no way around needing Apple's own hardware and
tooling for iOS builds specifically. Skip this until Android is validated
and you're ready to invest in that.

## Realistic expectation

Getting a genuinely polished, App Store-ready set of icons/screenshots/
listing copy and passing store review usually takes a few iterations —
budget more like days than hours for your first submission, even once the
technical build is working.
