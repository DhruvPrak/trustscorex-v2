# TrustScoreX v2 — Setup Guide

## What changed — continuous identity verification (this update)

Previously, identity was checked once at registration (ID photo vs. live
camera) but never again — so nothing stopped a student from handing the
camera to someone else once the exam started. Now:

- **`public/exam.html`** re-checks identity every second, not just face
  *presence* every 4 seconds. It compares the live camera's face
  descriptor against the 128-d descriptor captured from the student's ID
  photo at registration (already stored in
  `student.idVerification.faceEmbedding`). A sustained mismatch fires a
  new `face_mismatch` event — the highest-severity event in
  `utils/trustScore.js`, since it's the strongest single signal of
  impersonation.
- **Blur/covered-lens detection**: a Laplacian-variance sharpness check
  runs every second on the raw frame, independent of face detection —
  catches a hand over the lens or a badly out-of-focus camera
  (`camera_blurred_or_covered`, low severity, debounced 3s since it's more
  prone to one-off false positives than the others).
- **Suspicious objects**: a `coco-ssd` pass every 3rd tick flags a phone,
  book, or second device in frame (`suspicious_object_detected`),
  rate-limited to once per 10s per object type.
- **Multiple faces** still fires immediately (no debounce) — it's rarely a
  false positive and is the clearest "someone else is here" signal.
- **`public/index.html` step 4 (device check)** now runs the same blur +
  identity-match checks pre-exam, at the same 1s cadence, so a bad camera
  setup or an identity mismatch surfaces before the exam starts rather
  than during it.
- **No-webcam accommodation** (`student.preferences.hasWebcam`) still
  disables all of the above — both client-side (loop never starts) and
  server-side (`routes/examRoutes.js` ignores any camera-dependent event
  type for those students even if one is posted directly to the API).
- Blinking / brief look-aways are handled by debouncing (requiring
  consecutive missed frames, not a single bad one), not by any special
  eye-state logic — face-api.js's recognition net is robust to blinking on
  its own since it reads overall face geometry, not eye state.

## What changed from v1
- **Real trust scores.** No more `Math.random()`. Score starts at 100 and
  decreases based on actual logged events (tab switches, no-face-detected,
  copy/paste attempts, multiple faces) with a diminishing-returns curve so
  one bad exam doesn't zero someone out permanently. See `utils/trustScore.js`.
- **Real AI signal**: `public/exam.html` runs `face-api.js` (TensorFlow.js-based)
  in the browser to detect whether a face is present / multiple faces are
  present, live, via webcam — genuinely "AI-powered," not just branding.
- **Real database**: MongoDB Atlas (free forever M0 tier) instead of a JSON
  file. Data survives redeploys and restarts.
- **Admin auth**: JWT-protected routes for deleting students or overriding
  scores. Previously anyone could hit those endpoints.
- **New UI**: all 6 pages redesigned with a consistent "verification seal"
  visual identity, plus live charts on the dashboard.

## 1. Create a free MongoDB Atlas cluster
1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free **M0** cluster (takes ~3 min to provision).
3. Under **Database Access**, create a user with a password.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) — fine for
   a hackathon demo.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Add `/trustscorex` before the `?` so it targets a named database:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/trustscorex?retryWrites=true&w=majority`

## 2. Local run
```
cp .env.example .env
# edit .env: paste your MONGO_URI, set JWT_SECRET and ADMIN_PASSWORD
npm install
npm start
```
Open http://localhost:3000

Then create your admin account once:
```
curl -X POST http://localhost:3000/api/auth/setup
```
This reads `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env` and creates
the account. Log in at `/admin.html` afterward.

## 3. Deploy to Render (free)
1. Push this project to your GitHub repo.
2. On Render: New Web Service > connect repo.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Instance type: **Free**
6. Add environment variables (Environment tab): `MONGO_URI`, `JWT_SECRET`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
7. Deploy. Once live, call `/api/auth/setup` once (e.g. via a quick `curl`
   or Postman request to `https://your-app.onrender.com/api/auth/setup`)
   to create the admin account.

## 4. Demo flow for judges
1. Open `/index.html`, register a student.
2. Click "Start monitored exam" → grant camera permission.
3. Switch tabs a couple of times, try Ctrl+C, cover your webcam — watch
   the trust score drop live in the seal badge and event log.
4. Go to `/dashboard.html` to show the aggregate charts.
5. Go to `/admin.html`, log in, and show manual override / delete
   (JWT-protected — try it without logging in first via curl to show it's
   actually enforced).

## Notes / known limits (good to mention if asked)
- Face detection runs client-side; if a judge's laptop has no webcam or
  denies permission, the page still works — it just logs that face
  monitoring was skipped, and tab-switch/copy detection still functions.
- `no_face_detected` is debounced (needs 2 consecutive misses, ~8s) so
  normal blinking/looking at notes briefly doesn't trigger it.
