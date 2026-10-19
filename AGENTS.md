# Financial Calculator — how to change the app

This repository is the source of the Israeli financial calculator.
The website is served from GitHub Pages; the same build runs in the Claude app.

## Where the code is

- `src/` — the source. **Edit files here, never `index.html` or `app.js` directly.**
  - `src/p/*.js` — calculators (`c1.js`…`c8.js`), field definitions (`ui2*.js`), settings, tools, and the app modules (`init_extra.js`, `v75.js`).
  - `src/p/i*.js` — interface texts in Hebrew, Arabic and English: `key: ['עברית', 'عربي', 'English']`. Later files override earlier ones.
  - `src/p/*.css` — styles. `src/orig.html` — the page skeleton. `src/build.py` + `src/post.py` — the build.
- `index.html`, `app.js`, `version.json` — build output (do not edit by hand). `index.html` loads the app's script from `app.js?v=<build>`; `python3 scripts/single.py <file>` writes the whole app as one self-contained HTML file.
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
