# Free App Distribution (No Play Store)

This skips Google Play entirely — no $25 fee, no store review. Users
download a `.apk` file straight from your website and install it manually
("sideloading"). This is a completely normal, legitimate way to distribute
Android apps; it's just less convenient for users than a store, since
Android shows a security prompt before installing anything not from Play.

## Step 1 — Build a release APK (not a debug one)

A "debug" build (what `npx cap run android` gives you) works, but a
"release" build is smaller, faster, and what you actually want to hand out.
This needs a signing key — but note, **this key is entirely your own, free,
local file** — it has nothing to do with Play Store accounts or fees.

In Android Studio, with `android-customer` open:

1. **Build → Generate Signed Bundle / APK**
2. Choose **APK** (not "Android App Bundle" — bundles only work through
   Play Store, plain APKs are what you can share directly)
3. Click **Create new...** to make a signing key (first time only):
   - Choose a save location for the `.jks` key file — **keep this file and
     its passwords safe forever**. If you lose it, you can't release
     updates to the same app anymore; you'd have to start over as a new app.
   - Fill in the alias, password, and your name/organization (any values,
     doesn't need to be a real registered company)
4. Select **release** as the build variant, click **Finish**
5. Android Studio builds it and shows a notification with a **"locate"**
   link — click it to find your `app-release.apk` file

Repeat the same process for `android-worker` once you've set that project
up too.

## Step 2 — Rename and place the files

Rename each output file and drop it into your frontend project:

```
fixora/public/downloads/fixora-customer.apk   (from android-customer's build)
fixora/public/downloads/fixora-worker.apk     (from android-worker's build)
```

## Step 3 — Deploy

Once these files are in `public/downloads/` and you deploy the frontend
(e.g. to Vercel), they become downloadable at:

```
https://yoursite.com/downloads/fixora-customer.apk
https://yoursite.com/downloads/fixora-worker.apk
```

The website's "Download App" section already links to exactly these paths.

## What users will experience

1. They tap the download button, Chrome downloads the `.apk` file
2. Opening the downloaded file, Android will likely show **"For your
   security, your phone is not allowed to install unknown apps from this
   source"** — this is expected, it's Android's standard warning for
   anything not from Play Store, not a bug or a bad sign
3. They tap **Settings** in that prompt → allow installs from that source
   (usually Chrome) → go back and install
4. From then on, the app behaves like any other installed app

## Real limitations of this approach, to set expectations honestly

- **No auto-updates.** Play Store apps update themselves silently; a
  sideloaded APK doesn't. Every time you change the app, users have to
  manually re-download and reinstall it. For a small number of early users
  this is fine; it doesn't scale to thousands of users without friction.
- **The security warning turns some people away.** It's a real (if usually
  harmless) barrier — some users will be nervous about it or won't have
  "install unknown apps" enabled and won't know how.
- **No Play Store presence** means no organic discovery, no reviews/ratings
  building trust, and some users' phones (especially work phones or heavily
  locked-down devices) may block sideloading entirely via device policy.
- **This is genuinely a fine way to launch and test with real users first**
  — plenty of apps start this way before eventually publishing properly.
  When you're ready to remove this friction, the $25 one-time Play Store
  fee is the next step (see `MOBILE_APPS.md`).
