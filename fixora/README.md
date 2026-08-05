# Fixora — Frontend

This is the real, runnable React frontend for Fixora. It's a normal Vite project —
not a preview — so it's meant to be run locally and eventually deployed.

## Run it locally

```bash
npm install
cp .env.example .env   # then edit .env
npm run dev
```

Opens at http://localhost:5173. The **Spring Boot backend now exists** (see
`../fixora-backend`) and needs to be running for login to work — see that
project's README to get it started, then point `VITE_API_URL` at it here.

## What's real right now

- **Phone number + OTP login** (`/login`) now goes through the real backend:
  it generates a 6-digit code, sends it via **Fast2SMS**, and verifies it
  server-side before issuing a JWT — same Rapido-style flow (enter mobile
  number → get a code by SMS → verify → you're in), just backend-driven
  instead of using Firebase. See `../fixora-backend/README.md` for the
  Fast2SMS signup steps.
- **Voice input** on the booking screen uses your browser's built-in
  SpeechRecognition API — no key needed, works today in Chrome. Coverage of
  Indian languages depends on the browser/OS (see note in BookService.jsx) —
  a handful of the 22 languages you listed (Sanskrit, Kashmiri, Manipuri,
  Bodo, Dogri, Maithili, Santali, Konkani, Sindhi) aren't in Chrome's speech
  engine at all yet. For full coverage of those, the backend should call
  **Bhashini** (India's government multilingual AI API, purpose-built for
  this — https://bhashini.gov.in) or Google Cloud Speech-to-Text/Translation
  as a fallback.
- **Text-to-speech** for workers (the speaker icon next to each job) uses the
  browser's SpeechSynthesis API — also free, also works today.
- **3D tilt interactions** on the category cards use real mouse-tracked
  perspective transforms (`src/components/TiltCard.jsx`) — no library, just
  CSS 3D transforms reacting to cursor position.
- **Website + mobile app, from one codebase**: this is a responsive web app
  (works on desktop and mobile browsers today), and it's also an installable
  PWA — `public/manifest.json` plus the meta tags in `index.html` mean a
  visitor on Android/iOS can "Add to Home Screen" and get an app icon,
  splash screen, and no browser chrome. The two placeholder icons in
  `public/` (icon-192.png, icon-512.png) are simple orange "F" marks —
  swap them for real branded artwork before shipping. If you want an actual
  native app in the Play Store / App Store (not just an installable web
  app), the standard next step is wrapping this same React code with
  **Capacitor** (https://capacitorjs.com).
- **Language dropdown** on the booking screen is a custom component
  (`src/components/LanguageDropdown.jsx`), not the native browser `<select>`
  — fully styled and readable, unlike native select popups which use the
  OS's own (often low-contrast) colors.
- **Ratings** show as a small badge on the phone login screen
  ("★ 4.8 · Trusted by 50,000+ users").

## What still needs the backend (next step)

Auth is done. Still to build: bookings (fan-out to nearby workers,
accept/reject, status updates), WebSocket live tracking, the wallet /
Razorpay payment capture, and the admin dashboard. Say the word for any of
these next.

## Accounts you'll need

1. **PostgreSQL database** — easiest free option for now is
   [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both give
   you a connection string in under a minute). This is shared with the
   backend — see `../fixora-backend/README.md`.

2. **Fast2SMS** (real phone OTP) — see `../fixora-backend/README.md`, this
   is entirely a backend concern now, nothing to configure on the frontend.

3. **Cloudinary** (for worker profile photos / job images) —
   sign up free at https://cloudinary.com, then from your dashboard copy:
   `Cloud name`, `API Key`, `API Secret`. These go in the backend's env vars
   once we build the document upload endpoints.

4. **Razorpay** (payments) —
   - Sign up at https://dashboard.razorpay.com/signup
   - It starts in **Test Mode** automatically — use this until you're ready
     to go live. Test mode gives you test card/UPI numbers so you can run
     full payment flows without moving real money.
   - From Settings → API Keys, generate a **Test Key** — you'll get a
     `Key Id` (safe to put in the frontend, see `.env.example`) and a
     `Key Secret` (backend only, never in frontend code or git).
   - To go live later: complete KYC (PAN, bank account, business proof) in
     the Razorpay dashboard, then switch to Live Mode keys.

Once you've got these set up, tell me and I'll wire bookings and payments
to actually use them.
