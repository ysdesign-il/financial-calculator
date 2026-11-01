# Brief: 8 smart-scanner features for the financial calculator (Nov 2026)

Repo: /home/claude/financial-calculator. READ AGENTS.md FIRST (rules: edit only src/, texts in he/ar/en via `Object.assign(T, {key:['עברית','عربي','English']})`, never ID/card/account number fields, never personal names, never hosting/service names in user-facing text). The other 7 interface languages are produced automatically later by scripts/translate_ui.py in CI – you only write he/ar/en.

The scanner today (read before coding): src/p/ds_pre.js, slip.js, ds2.js (kinds, AI classify `dsClassify`, routing `dsRoute`, letters `dsLetterRun/dsLetterRender`, calendar `dsIcs`), dsig.js, ds3.js, ds4.js, ds5.js (masking, bills, adding to expenses). Related: rm.js (reminders), the renewals screen (grep "renewals"), the expenses screen (`expSheet`), the documents vault (grep "vault"), taxrefund screen, fam.js (family mode), gk.js (AI key: AI works only in developer/family mode – most users have NO AI), adm2.js (parts on/off). Learn the house patterns (t(), ICON, TABS/FAMS in groups.js, panels, activate(), LS storage keys 'fin-…', esc helpers like slE, toasts) and follow them exactly.

Wiring is ALREADY done: src/post.py loads p/ocr.js, p/dsx.js, p/dstax.js right after p/ds5.js; src/build.py loads i72.js, i73.js, i74.js after i71.js. Each agent owns ONLY its files below. Do NOT edit post.py, build.py, changelog.json, or other agents' files. If you must change an existing file, keep the change minimal and prefer wrapping functions from your own file (the codebase extends behaviour by re-assigning functions, e.g. `const x0 = fn; fn = function(){…}`).

Ownership:
- Agent OCR → p/ocr.js + p/i73.js (+ new files under lib/ for a vendored OCR engine if needed).
- Agent DOCS → p/dsx.js + p/i72.js.
- Agent TAXFAM → p/dstax.js + p/i74.js.

Shared data contract (so the features connect): a list of "document items" in LS key `fin-dsitems` (JSON array). Each item: `{id, kind: 'warranty'|'bill'|'contract'|'idexp'|'letter'|'tax', title, date (YYYY-MM-DD, the important date: warranty end / bill due / contract end or notice / expiry / reply-by), amount?, vendor?, fileId? (vault file id if saved), year? (tax), meta?, done?: true, created}`. Agent DOCS creates helper functions in dsx.js: `dsiAll()`, `dsiAdd(item)`, `dsiUpdate(id, patch)`, `dsiRemove(id)` and the "waiting for you" screen; Agent TAXFAM may call them guarded with `typeof dsiAdd === 'function'`. Never store ID/passport/card numbers, birth dates or addresses in items – only type, expiry date and a user-chosen label.

Privacy: personal cards are processed only on the phone (existing promise) – never send card photos to AI. Anything shared outside the phone must be masked first (existing maskers in ds2/ds5).

Build and test: `python3 src/build.py` (writes index.html/app.js; other agents build too – just rebuild before testing), `node --check app.js`, and test in a real browser with Python/Node Playwright (installed; chromium.launch() needs no options) against `python3 -m http.server <your own port>` in the repo root. Network to external hosts is blocked, so the app may log failed fetches – ignore those. The scanner is a members-only screen: find how the app treats a member/developer locally (look at `isMember`, FUSER, DEV_ON, scripts/smoke.js) to open it in tests. Test at phone size 390×844 in Hebrew and English (and Arabic for RTL). Check no console errors from your code, no horizontal scroll.

Quality: every new screen/option works on a phone, is accessible (labels, aria, focus), has empty states, edit and delete, and clear Hebrew. Reminders use the existing reminders module (and/or .ics like dsIcs) – reuse, don't duplicate. Keep the existing "nothing is sent" promises true and say clearly in the UI when AI is used.

When done: list what you built, files changed, how you tested, and anything uncertain. Don't commit or push – the lead integrates.
