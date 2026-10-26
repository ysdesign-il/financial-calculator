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
- `/admin/*` is served only after the server-side lock in `_gate.js` (a Worker, or a Pages Function in `functions/`): the owner types the name + developer code (or the shared recovery code) on a login page; the browser derives the key (PBKDF2, same as developer mode) and the server compares its SHA-256 with `DEV_CHECK`, then sets an HttpOnly cookie for 30 days.
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
