# Financial Calculator — how to change the app

This repository is the source of the Israeli financial calculator.
The website is served from GitHub Pages; the same build runs in the Claude app.

## Where the code is

- `src/` — the source. **Edit files here, never `index.html` or `app.js` directly.**
  - `src/p/*.js` — calculators (`c1.js`…`c8.js`), field definitions (`ui2*.js`), settings, tools, and the app modules (`init_extra.js`, `v75.js`).
  - `src/p/i*.js` — interface texts in Hebrew, Arabic and English: `key: ['עברית', 'عربي', 'English']`. Later files override earlier ones.
  - `src/p/*.css` — styles. `src/orig.html` — the page skeleton. `src/build.py` + `src/post.py` — the build.
- `index.html`, `app.js`, `version.json`, `tp/*.js` — build output (do not edit by hand). Since 13.53 the build (`src/split_langs.py`, needs node) moves most interface texts out of `app.js` into one file per language (`tp/he.js`, `tp/ar.js`, `tp/en.js`); keys read in more than one language (screen, topic and field names, descriptions, glossary, CV texts) stay in `app.js`. Keep editing texts in `src/p/i*.js` as before. `index.html` loads the app's script from `app.js?v=<build>`; `python3 scripts/single.py <file>` writes the whole app as one self-contained HTML file.
- `devcode.json` — optional developer code (`{"js": "...", "css": "..."}`) that runs in the app and on the site.

## Build

```
python3 src/build.py
```

It writes `index.html`, `app.js` and `version.json`. Bump the version first: add an entry at the top of `src/p/changelog.json`
with the generic notes `שיפורים ותיקונים.` / `تحسينات وإصلاحات.` / `Improvements and fixes.`

## Rules

- Never put API keys, tokens, passwords or any personal data in the source.
- Never add fields for ID numbers, card numbers or bank accounts.
- The owner name must never appear in the source; developer access is checked only by a hash.
- Keep all three languages for every new text.
- Pushing to `main` runs the "Build and publish" workflow, which rebuilds and publishes the site.

## Admin version (/admin/)

- The regular site never opens developer mode or management. Everything for the owner lives in the admin version at `/admin/`.
- `/admin/*` is served only after the server-side lock in `_gate.js` (a Worker, or a Pages Function in `functions/`): the owner types the name + developer code (or the shared recovery code) on a login page; the browser derives the key (PBKDF2, same as developer mode) and the server compares its SHA-256 with `DEV_CHECK`, then sets an HttpOnly cookie. Since 13.94 a session ends after 60 minutes without use (each use moves the limit on) and at most 7 days after sign-in.
- The admin panel (`_kit.js`, served at `/admin/__kit.js`) is injected into the admin page: message to all users, "what's new", parts on/off, forced update, feedback, on-device screen test, maintenance, log, security.
- Its settings are kept in Cloudflare KV (namespace `admin-config`, binding `CFG`, keys `cfg:<app>` public and `st:<app>` private) and read by the public site from `/cfg.json`. The public part for the calculator and VELVITE is `_pub.js`, served at `/__pub.js` and added to the main page by the Worker.
- **Changing the developer code:** update `DEV_CHECK` in `_gate.js` in all three repos (neshima-shketa: `functions/_gate.js`; financial-calculator and evently: `_gate.js`), and in each app's own developer-mode check, in the same change.
- Never put the code, the recovery code or any personal name in the source.
- Admin panel extras: a badge on the 👑 button for new feedback, crash reports and logins; an alert for a login from a new device; settings history with one-tap restore (KV hi:<app>); health of the three apps (/__ping); translation check (Neshima: fixes typed in the panel are kept in cfg.tr and applied live); view as a regular user; link and QR to share (QR encoder served at /admin/__qr.js); backup, restore and copy between apps; scheduled start and end for the message and maintenance.
- After login the server never keeps or hands out the developer key: sessions hold only the inbox secret (SHA-256 of "ib-v1:"+key), which opens the inbox but cannot sign in; the login page re-locks the phone's inbox keys with it. No IP addresses are stored anywhere (rate limits live only in memory, keyed by a one-way fingerprint). An app whose code still expects the key can add a `bridge` script in its options (see neshima-shketa/functions/_opt.js).
- Switching off one calculator and publishing values (13.47): the panel saves `offTabs` / `offMsg` and `fig` ({v, asOf}) in the public settings. `_pub.js` hands the settings to the app as `window.__ADMCFG` with an `admp-cfg` event, and `src/p/adm2.js` hides the switched-off calculators and applies the owner's values (newer than `figures.json` wins). In the admin version the app lists its screens in `window.__ADM_SCREENS__` and publishes values through `window.__ADMKIT_SAVE`; every publish lands in the settings history.
- Phone alerts (Web Push): `_push.js` (shared, also in neshima-shketa/functions). Signing keys are made on first use and kept in KV `vapid:k`; the owner's phones in KV `ps:all` (all apps together, with which kinds are wanted). Alerts: a login to the admin version, new feedback (at most one per 10 minutes), a new kind of crash report (at most one per hour), and a site down two checks in a row (cron every 30 minutes on the calculator's Worker, `scheduled` in worker.js + `triggers` in wrangler.jsonc). The alert service worker is `/admin/__sw.js` (scope /admin/, no fetch handler). On iPhone, alerts work only from the home-screen app.
- Legal pages and the Beta badge (13.55): the terms, privacy and accessibility pages are plain text with three marks (blank line = paragraph, `## ` = heading, `- ` = bullet), drawn only with textContent (`src/p/legal.js`). In the admin version each page has an Edit button (`src/p/lgedit.js`) that saves per language to `/admin/__docs` (admin session only, max 30,000 characters, KV key `doc:<app>`, enabled by `docs` in the Worker options); everyone reads them from `/legal.json`, only when a page is opened. "Back to the original text" removes the edit. The Beta badge (`src/p/beta.js`) is the part `beta` in `pubcfg.js`, switched on or off in the panel's parts on/off; on by default.
- Free-plan budget (13.48): the main page, `/__pub.js` (written by `src/build.py` from `_pub.js` + `pubcfg.js`) and the main fonts (`/fonts/`, Fontsource files, SIL OFL) are static files, so a visit costs one Worker request (`/cfg.json`, kept in memory 15 s; the panel asks for `?nc=1`). The public part reads the settings on open and again only after 10 minutes away. Don't add "/" back to `run_worker_first`.

## Server storage for users (13.86–13.87)

- `_fin.js`: the website feedback inbox, the developer replies and the family sign-in list live in KV (`ib:calc`, `rp:calc`, `fam:calc`), filled by the half-hourly cron from the relay. The admin version reads `/admin/inbox.json` and `/admin/fam`. The public site only asks `/api/fam` (yes/no, rate-limited). `_legacy_inbox.json` seeds the first read of the inbox; it is not served. Since 13.94 the family list stores only a server tag of each fingerprint (SHA-256 of `fam-srv-v1:` + fingerprint, compared in constant time), never the fingerprint itself, and `_legacy_family.json` is gone (its old password must be changed).
- `_acct.js` + D1 `fin-accounts` (binding `DB`): the optional cloud copy of an account and the cloud documents. Only locked packages are stored, under a fingerprint of the username, with a hash of a second password fingerprint. Each account has a `plan` (`free`) for later subscriptions. `/api/q` serves delayed share prices (cached 15 minutes).
- The client side is `src/p/fin12.js` and `src/p/fin13.js`. Formulas are listed in `docs/FORMULAS.md`.

## Security (13.91)

- `node scripts/security_api.mjs` (Node 22+) attacks the server code locally (account/document API, prices, family check, the admin lock, the security-alert token): IDOR, squatting, enumeration, brute force, quotas, SQL injection, SSRF, CSRF, JWT forgery. It must end with `0 vulnerable`. It never touches the live site.
- Cloud accounts (`_acct.js`): a new account's row key is a fingerprint of the name fingerprint + the password fingerprint, so a name cannot be taken first by someone else and a wrong password looks like "no copy". Rows stored before 13.91 keep their old key and still open. Document limits count the bytes really stored. The tables are in `db/schema.sql` (not served).
- A moving link (`#migz=`) only fills keys that were empty on the device when the link was opened; it never replaces existing data.
- No AI API keys anywhere: the translate workflow no longer passes one.

## Suspicious activity (13.92)

- `_sx.js` (called from `worker.js` after each answer, through `ctx.waitUntil`, never blocking or breaking it) counts refused and blocked requests in D1: failed admin sign-ins (`login`), the admin sign-in lock (`lock`), 429 on the APIs (`rate`), blocked cross-site writes (`xsite`), 413 (`big`) and requests for blocked files or unknown `/api/` addresses (`path`). One row per kind + route per 10-minute slot (table `secev`, created by the code on first use, also in `db/schema.sql`); no IP, name or fingerprint – only slot, kind, a route from a fixed list, a count and a country code. Slots older than 30 days are removed by the half-hourly cron.
- Alerts (table `secalert`, at most one per kind per hour) go into the owner inbox (`ib:calc`) as a normal locked `fc1.` message (`inboxAdd` in `_fin.js`): ≥5 failed admin sign-ins in about 15 minutes, any sign-in lock, ≥50 refusals (429) in about 10 minutes, any blocked cross-site write.
- The owner sees "פעילות חשודה" (last 7 days, grouped) at the top of the inbox in the admin version (`src/p/fin15.js`, texts `src/p/i95.js`), read from `/admin/suspicious.json` behind the admin lock.
- `node scripts/security_alerts.mjs` tests it locally (must end with `0 failed`).

## Sign-out, bot traps, shared limits (13.94)

- `src/p/sec1.js`: a signed-in account is locked after 15 minutes without use (touch, key, scroll, return to the tab); the time of the last use is kept in the tab (`fin-idle-at`), so a tab that slept is locked as soon as it wakes. Then the sign-in screen opens with a note (`idle_out`).
- Bot traps: the feedback form (`src/p/v94.js`, also the star-only rating in `v98.js`) and the cloud copy form (`src/p/fin13.js`) have a hidden field (`hpField`) and a 3-second minimum; a bot gets a normal "sent" and nothing goes out. The server (`_acct.js`) checks the same (`hp`, `ft`) before storing a new cloud copy.
- Shared limits: `ratelimits` in `wrangler.jsonc` (`RL_AUTH`: admin sign-in, family check, cloud-copy password misses; `RL_NEW`: new cloud copies). The code keeps its in-memory limits too and works without the bindings.
- Guest mode (no account) shows that its data is stored on the device unencrypted (`acc_guestNote`).

## Content-Security-Policy (13.93)

- No `'unsafe-inline'` or `'unsafe-eval'` for scripts, on the site (`_headers`) or in the admin version (`_gate.js`). Never add inline `on…=` attributes, `javascript:` links, inline `<script>` blocks, `eval`/`new Function` or string timers: use `addEventListener` / delegated `data-…` handlers and script files.
- The site's few inline scripts (the head script of `src/orig.html`, `src/p/snap_early.html`, the build/language loader) are allowed by their SHA-256: `src/build.py` writes the hashes into `_headers` (and the publish workflow commits it). The build number is on the loader's tag (`data-build`), so the hashes change only when those scripts change.
- `_gate.js` sends every HTML page it serves (sign-in, sign-out, the admin version) with the SHA-256 of that page's own inline scripts (`htmlCsp`).
- jsdelivr is allowed only for the exact fallback files (pdf.js 6.2.108, pdf-lib 1.17.1, jszip 3.10.1, nerdamer 1.1.12); `'wasm-unsafe-eval'` stays for text recognition and pdf.js.
- A developer-code draft's script part runs only inside the Claude app (its CSS still applies everywhere).
- `node scripts/csp.js` (Node 22+) serves the built site through the real `worker.js` with these headers, opens every screen in 3 languages, taps the buttons, feeds files to every file picker, loads the PDF/ZIP/algebra/OCR parts and opens the admin version with a test session; it must end with `CSP violations: 0`. `python3 scripts/check.py` checks the hashes in `_headers`.
