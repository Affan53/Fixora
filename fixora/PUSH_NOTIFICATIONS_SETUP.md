# Push Notifications Setup (Firebase Cloud Messaging)

This is what makes a worker's phone buzz with a new job alert even if the
app is closed or the screen is locked — a real push notification, not just
the in-app WebSocket chime (which only works while the app is open).

This is a **separate Firebase project/purpose** from the phone-auth Firebase
we set up and then removed earlier — if you still have that old project,
you can reuse it, just for a different feature (Cloud Messaging instead of
Authentication).

## Why two apps need two separate registrations

Since Fixora has two separate native apps (`com.fixora.customer` and
`com.fixora.partner`), Firebase needs to know about **both** package names
individually — push notifications are tied to the specific app's identity.

## Step 1 — Firebase Console setup

1. Go to https://console.firebase.google.com → create a project (or reuse
   an existing one)
2. **Project Settings** (gear icon) → **General** tab → scroll to **"Your
   apps"** → click **Add app** → choose **Android**
3. Register the **customer** app:
   - Android package name: `com.fixora.customer` (must match exactly)
   - Download the resulting **`google-services.json`** file
4. Click **Add app** again → Android → register the **worker** app:
   - Android package name: `com.fixora.partner`
   - Download this **second, separate** `google-services.json`

## Step 2 — Add the config files to each native project

After you've run `npx cap add android` for each app (see `MOBILE_APPS.md`):

```
android-customer/app/google-services.json   ← the customer one
android-worker/app/google-services.json     ← the worker one
```

## Step 3 — Wire up the Google Services Gradle plugin

In **`android-customer/build.gradle`** (the project-level one, not
`app/build.gradle`), inside the `dependencies` block, add:

```gradle
classpath 'com.google.gms:google-services:4.4.2'
```

In **`android-customer/app/build.gradle`**, at the very top, add:

```gradle
apply plugin: 'com.google.gms.google-services'
```

Repeat both edits for `android-worker`.

## Step 4 — Backend service account key

1. Firebase Console → **Project Settings** → **Service Accounts** tab
2. Click **Generate new private key** → confirms and downloads a JSON file
   — **keep this file secret**, it grants full admin access to your Firebase
   project
3. Save it somewhere on your backend server (not in git!) and set:
   ```bash
   FIREBASE_CREDENTIALS_PATH=/path/to/that-file.json
   ```
   as an environment variable before starting the backend (add it to your
   `.env` and it'll be picked up by `run.ps1`/`run.sh`)

## Step 5 — Rebuild and test

```bash
copy capacitor.customer.config.json capacitor.config.json
npm run build:customer
npx cap sync android-customer
```

Run it on your phone. The first time you log in, it'll prompt for
notification permission (Android 13+) — accept it. Behind the scenes it
registers a token with the backend automatically.

**To actually test a push arrived**: put the app in the background (press
Home, don't force-close it) on a worker account that's online, then create
a booking as a customer for that worker's trade. You should get a real
notification, not just what happens if the app were open.

## What still has a real limitation

**Background GPS tracking** (a worker's location updating on the customer's
map even when the worker's screen is off) isn't fully solved by this setup
— it keeps working reliably while the app is open/foregrounded, same as
before, but true continuous background tracking needs a foreground-service
plugin (e.g. `@capacitor-community/background-geolocation`), which requires
its own careful setup (a persistent "tracking active" notification Android
requires you to show, plus the `ACCESS_BACKGROUND_LOCATION` permission,
which Google Play also scrutinizes heavily during app review). That's a
deliberate next step rather than something to bolt on blindly — tell me
when you want to tackle it specifically.
