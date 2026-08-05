# Fixora Backend

Real Spring Boot backend: phone+OTP auth via Fast2SMS, JWT sessions, and the
foundation for bookings/wallet/payments to come.

## Why Fast2SMS instead of Firebase

Firebase Phone Auth needed the paid Blaze plan to send real SMS. Fast2SMS is
much cheaper for Indian numbers, but it's a raw SMS API — it doesn't manage
OTP generation or verification for you, and its API key must never sit in
frontend code. So this backend does the OTP lifecycle itself:

1. `POST /api/auth/send-otp {phone}` — generates a 6-digit code, stores a
   **hash** of it (never plaintext) with a 5-minute expiry, and calls
   Fast2SMS to text it
2. `POST /api/auth/verify-otp {phone, otp, role, name}` — checks the code,
   creates the user on first login, returns a JWT + user profile
3. `GET /api/auth/me` — returns the current user for a valid `Authorization: Bearer <token>`

## 1. Get a Fast2SMS API key (free to sign up)

1. Go to https://www.fast2sms.com and sign up with your phone number
2. Once logged in, go to **Dev API** (left sidebar) — https://www.fast2sms.com/dashboard/dev-api
3. Copy your **Authorization Key** shown there
4. Fast2SMS gives new accounts some free credits to test with; after that
   it's pay-as-you-go and considerably cheaper per SMS than Firebase's Blaze
   SMS pricing — check their current pricing page before relying on exact
   numbers, since I can't confirm live pricing here
5. Their **OTP route** (which this backend uses) sends a pre-approved
   template message with just the numeric code filled in — you can't
   customize the wording, that's a DLT/TRAI regulation thing for Indian SMS,
   not a limitation I added

## 2. Get a Postgres database

Same as mentioned for the frontend — [Neon](https://neon.tech) or
[Supabase](https://supabase.com) both give you a free connection string in
under a minute.

## 3. Configure environment variables

Copy `.env.example` to `.env` (if running via Docker/a process manager that
reads `.env`), or just export these before running:

```bash
export DATABASE_URL=jdbc:postgresql://<host>:5432/<dbname>
export DATABASE_USERNAME=<user>
export DATABASE_PASSWORD=<password>
export FAST2SMS_API_KEY=<your key from step 1>
export JWT_SECRET=$(openssl rand -base64 48)
export FRONTEND_ORIGIN=http://localhost:5173
```

Without `FAST2SMS_API_KEY` set, the backend still runs — it just logs the
OTP to the console instead of sending a real SMS, which is convenient for
local development.

## Troubleshooting

**`Unsupported class file major version 69`** — this means Maven is running
with a JDK newer than this project supports (version 69 = Java 25). Spring
Boot 3.3.x's tooling doesn't yet handle JDKs that new. Fix: install
**JDK 21** (Temurin/Adoptium is a good free source) and point this project
at it specifically:
- VS Code: Cmd/Ctrl+Shift+P → "Java: Configure Java Runtime" → set JDK 21
  for this workspace, or add to `.vscode/settings.json`:
  ```json
  { "java.jdt.ls.java.home": "C:\\path\\to\\jdk-21" }
  ```
- Or just set `JAVA_HOME` to your JDK 21 install before running `mvn`

**`JDBCConnectionException: Unable to open JDBC Connection`** — the backend
can't reach a database. This shows up once the Java version issue above is
fixed. It means `DATABASE_URL` is either not set or points at a Postgres
that isn't actually running/reachable. Get a real connection string from
Neon or Supabase (step 2 above), put it in `.env`, and make sure you're
starting the app via `run.sh` / `run.ps1` (not `mvn spring-boot:run`
directly) so `.env` actually gets loaded.

## Run it

Don't run `mvn spring-boot:run` directly the first time — use the helper
script so your `.env` values actually get loaded as environment variables:

```bash
# Windows PowerShell
.\run.ps1

# Mac/Linux/Git Bash
./run.sh
```

Starts on http://localhost:8080. Point the frontend's `VITE_API_URL` at
`http://localhost:8080/api`.

## 5. Wire up the frontend

In the frontend project's `.env`:
```
VITE_API_URL=http://localhost:8080/api
```

The Firebase phone auth code has been removed from the frontend — this
backend now handles the whole OTP flow, so the `VITE_FIREBASE_*` env vars
are no longer needed.

## What's real right now

- **Auth**: phone + OTP via Fast2SMS, JWT sessions
- **Bookings**: a customer creates a booking with their real GPS location;
  it's fanned out over WebSocket to every online worker of that trade
- **Accept race handling**: if two workers tap Accept at the same moment,
  an atomic SQL `UPDATE ... WHERE status = 'PENDING'` guarantees only one
  of them actually wins the job — the other gets a clear "already taken"
  error, not a silent double-booking
- **Live GPS tracking**: once a worker accepts, their browser watches
  their position and pushes updates every ~17 seconds to
  `POST /api/bookings/{id}/location`, which broadcasts over WebSocket to
  `/topic/bookings/{id}` — the customer's map marker moves in real time
- **Status flow**: ACCEPTED → ON_THE_WAY → ARRIVED → WORKING → COMPLETED,
  each step broadcast live to the customer
- **Aadhaar validation**: real Verhoeff checksum (the actual algorithm UIDAI
  uses for Aadhaar check digits) — rejects malformed/typo'd numbers
- **PAN validation**: real official format rule (`[A-Z]{5}[0-9]{4}[A-Z]`)
- **IFSC validation**: live lookup against real RBI bank/branch records via
  Razorpay's free public API — this actually confirms the bank code is real
- **Admin panel**: real stats (customer/worker counts, pending KYC reviews,
  today's bookings), worker/customer lists, full booking list, and
  approve/reject actions on worker KYC submissions

## Creating the first admin account

Admin accounts are never created through public signup (there's no "I'm an
admin" option anywhere in the app) — this is intentional, so a random phone
number can't grant itself admin access. To create your first admin:

1. Log into the app once as a normal user with the phone number you want to
   be an admin (any role — this just creates the `users` row) — or just
   send/verify an OTP for that number without completing onboarding
2. Connect to your Postgres database directly (Neon/Supabase both have a
   built-in SQL editor in their dashboard) and run:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE phone = '9XXXXXXXXX';
   ```
3. Go to `/admin/login` in the app, enter that same phone number, verify the
   OTP — you're in the admin panel

## What's still simulated, limited, or missing

- **ETA** is a straight-line distance ÷ assumed 25km/h — not real road
  routing. A routing API (OSRM, Mapbox Directions, Google Directions) would
  fix this properly.
- **Worker-to-customer matching** currently fans out to *every* online
  worker of a trade, with no distance/radius filtering yet — add a
  `ST_DWithin` PostGIS query or simple bounding-box filter once you have
  enough real worker location data to make that meaningful.
- **Wallet and payments** aren't built — Razorpay integration is next.
- **Aadhaar/PAN identity confirmation**: we validate the numbers are
  *structurally real* (correct checksum/format), but confirming they're
  actually registered to the person submitting them requires a
  UIDAI/NSDL-licensed KYC API (e.g. Digio, Signzy, IDfy, Karza, Cashfree
  Verification) — these need business registration and per-check fees, and
  aren't something achievable with free/open APIs.
- **Bank account ownership**: IFSC is verified live and for real. The
  account *number* belonging to this specific person needs a penny-drop /
  Fund Account Validation API (Razorpay offers one) — requires a business
  payout account with KYC approved.
- **Document files** (Aadhaar/PAN/photo) aren't persisted to real storage
  yet — needs Cloudinary wired in.
- **Selfie face-coverage detection** uses the browser's native Shape
  Detection API (`FaceDetector`) where supported (mainly Chrome on Android)
  to confirm exactly one face is present and reasonably framed — it can't
  reliably detect things like a mask or scarf covering part of the face,
  which needs a proper ML face-landmark model, a heavier addition than
  what's built in here.


