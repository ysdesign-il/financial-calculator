// 13.93: the Content-Security-Policy test. Serves the built site the way the live site is served – the real worker.js for the
// Worker paths (/admin/ behind the real lock, /cfg.json, …) and the static files with the headers of _headers, CSP enforced –
// then opens every screen in 3 languages, taps the buttons of every screen, loads the on-demand parts (PDF, ZIP, algebra,
// text recognition), and opens the admin version with a test session (its panel and every section), the admin sign-in and
// sign-out pages. Fails on any CSP violation (securitypolicyviolation events and "Refused to …" console errors).
// Run: node scripts/csp.js   (Node 22+, playwright)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const root = path.resolve(__dirname, '..'), PORT = 8767, O = 'http://localhost:' + PORT;
const QUICK = process.argv.includes('--quick');
/* _headers → [{re, headers}] (Cloudflare's rules: * matches anything) */
const RULES = [];
{ let cur = null; for (const ln of fs.readFileSync(path.join(root, '_headers'), 'utf8').split('\n')){
  if (!ln.trim() || /^\s*#/.test(ln)) continue;
  if (!/^\s/.test(ln)){ cur = {re: new RegExp('^' + ln.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), h: {}}; RULES.push(cur); continue; }
  const i = ln.indexOf(':'); cur.h[ln.slice(0, i).trim().toLowerCase()] = ln.slice(i + 1).trim(); } }
const SITE_CSP = (RULES.find(r => r.h['content-security-policy']) || {h: {}}).h['content-security-policy'] || '';
if (!SITE_CSP) { console.log('FAIL: no Content-Security-Policy in _headers'); process.exit(1); }
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.jpg': 'image/jpeg', '.webp': 'image/webp'};
function asset(req){
  let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory() || /\/(_|\.git)/.test(p.replace(/^\/__pub\.js$/, ''))) return new Response('Not found', {status: 404});
  const h = new Headers({'content-type': TYPES[path.extname(f)] || 'application/octet-stream'});
  for (const r of RULES) if (r.re.test(p)) for (const k in r.h) h.set(k, k === 'content-security-policy' ? r.h[k].replace(/;\s*upgrade-insecure-requests/, '') : r.h[k]);   // http on localhost
  return new Response(fs.readFileSync(f), {status: 200, headers: h});
}
/* the real Worker, imported like scripts/security_api.mjs does (_fin.js needs import attributes for its JSON in Node) */
async function loadWorker(){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fin-csp-')), R = 'file://' + root + '/';
  fs.writeFileSync(path.join(tmp, '_fin.mjs'), fs.readFileSync(path.join(root, '_fin.js'), 'utf8').replace(/from '\.\/(_legacy_\w+\.json)'/g, (m, f) => `from '${R}${f}' with {type: 'json'}`).replace(/from '\.\/(\w+\.js)'/g, (m, f) => `from '${R}${f}'`));
  fs.writeFileSync(path.join(tmp, 'worker.mjs'), fs.readFileSync(path.join(root, 'worker.js'), 'utf8').replace(/from '\.\/_fin\.js'/, `from '${'file://' + tmp}/_fin.mjs'`).replace(/from '\.\/(\w+\.js)'/g, (m, f) => `from '${R}${f}'`));
  return (await import('file://' + tmp + '/worker.mjs')).default;
}
const wr = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n'));
const FIRST = wr.assets.run_worker_first.map(x => new RegExp('^' + x.replace(/\*/g, '.*') + '$'));
const kv = new Map();
const CFG = {async get(k, t){ const v = kv.has(k) ? kv.get(k).v : null; if (v == null) return null; const ty = typeof t === 'string' ? t : t && t.type; return ty === 'json' ? JSON.parse(v) : v; },
  async put(k, v, o){ kv.set(k, {v: String(v), meta: o && o.metadata}); }, async delete(k){ kv.delete(k); },
  async list({prefix}){ return {keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({name, metadata: kv.get(name).meta})), list_complete: true}; }};
globalThis.fetch = async () => new Response('{}', {status: 404});   // the Worker never reaches the network in this test
globalThis.caches = {default: {async match(){ return null; }, async put(){}}};
/* a test session for the admin version: the same KV record the lock writes after a real sign-in */
const SES = crypto.randomBytes(20).toString('hex'), now = Date.now();
kv.set('sx:calc:' + SES, {v: JSON.stringify({at: now, dev: 'test', cc: '', dk: ''}), meta: {at: now, dev: 'test', cc: ''}});

const V = [], ERRS = [], FED = [], FILES = {};
(async () => {
  const W = await loadWorker();
  const env = {CFG, ASSETS: {fetch: async r => asset(r)}};
  const srv = http.createServer(async (q, s) => {
    try {
      const body = q.method === 'GET' || q.method === 'HEAD' ? undefined : await new Promise(r => { const a = []; q.on('data', d => a.push(d)); q.on('end', () => r(Buffer.concat(a))); });
      const req = new Request(O + q.url, {method: q.method, headers: q.headers, body});
      const p = new URL(req.url).pathname;
      const res = FIRST.some(r => r.test(p)) ? await W.fetch(req, env, {waitUntil(){}}) : asset(req);
      const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
      if (h['set-cookie']) h['set-cookie'] = h['set-cookie'].replace(/; Secure/, '');
      s.writeHead(res.status, h); s.end(Buffer.from(await res.arrayBuffer()));
    } catch (e) { s.writeHead(500); s.end(String(e)); }
  }).listen(PORT);
  const b = await chromium.launch();
  const ctxOf = async (extra) => {
    const c = await b.newContext(Object.assign({viewport: {width: 390, height: 844}, serviceWorkers: 'block', acceptDownloads: true}, extra || {}));
    await c.addInitScript(() => { try { localStorage.setItem('fin-consent', JSON.stringify({v: 1, at: 'test'})); } catch (e) {} });
    await c.exposeBinding('__cspv', (src, v) => V.push(Object.assign({page: src.page && src.page.url()}, v)));
    await c.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { try { window.__cspv({dir: e.violatedDirective, blocked: e.blockedURI, src: e.sourceFile, line: e.lineNumber, sample: e.sample}); } catch (er) {} }, true); });
    await c.route('**/*', r => r.request().url().startsWith(O) ? r.continue() : r.abort());
    return c;
  };
  const watch = (p, tag) => {
    p.on('console', m => { const t = m.text(); if (/Content Security Policy|Refused to (execute|load|evaluate|compile|apply|create|frame|connect)/i.test(t)) V.push({page: tag, console: t.slice(0, 300)}); });
    p.on('pageerror', e => ERRS.push(tag + ': ' + String(e).slice(0, 200)));
    p.on('dialog', d => d.dismiss().catch(() => {}));
    p.on('popup', w => w.close().catch(() => {}));
    p.on('worker', w => w.on && w.on('close', () => {}));
  };
  const FAILS = []; const step = async (name, fn) => { const n = V.length, f = FAILS.length; try { await fn(); } catch (e) { FAILS.push(name + ': ' + String(e).slice(0, 300)); } console.log((V.length > n ? 'CSP!  ' : FAILS.length > f ? 'FAIL  ' : 'ok    ') + name + (V.length > n ? '  (' + (V.length - n) + ' violations)' : '')); };
  const closeOv = p => p.evaluate(() => { document.querySelectorAll('.cp-ov:not([hidden])').forEach(o => { o.hidden = true; }); document.body.classList.remove('cp-lock'); });
  /* every screen and every calculator inside a topic, in 3 languages */
  const walk = async (p, base, langs, tapAll) => {
    const seen = new Set(), tabs = await p.evaluate(() => [...document.querySelectorAll('[id^="tab-"]')].map(x => x.id.slice(4)));
    for (const lang of langs){
      await p.evaluate(l => { const s = document.getElementById('set_lang') || document.getElementById('lang'); if (s){ s.value = l; s.dispatchEvent(new Event('change', {bubbles: true})); } }, lang);
      await p.waitForTimeout(300);
      for (const t of tabs){
        await closeOv(p); await p.evaluate(id => { const e = document.getElementById('tab-' + id); if (e) e.click(); }, t); await p.waitForTimeout(60);
        const subs = await p.evaluate(() => [...document.querySelectorAll('[data-famgo]')].map(b => b.dataset.famgo));
        for (const s2 of subs){ await closeOv(p); await p.evaluate(id => { const b = document.querySelector('[data-famgo="' + id + '"]'); if (b) b.click(); }, s2); await p.waitForTimeout(60); seen.add(s2); }
        seen.add(t);
        if (tapAll && lang === langs[0]){
          /* tap the buttons of this screen (not the ones that leave, reset, wipe, download or print) */
          const n = await p.evaluate(id => { const P = document.getElementById('panel-' + id) || document.querySelector('main'); if (!P) return 0;
            const L = [...P.querySelectorAll('button, [role=button], summary, [data-act], [data-a]')].filter(x => x.offsetParent && !x.disabled && !/reset|clear|wipe|delete|del\b|remove|logout|print|reload|update|download|export|share|install|mic|cam|scan|file|upload|pick/i.test([x.id, x.className, x.dataset ? JSON.stringify(x.dataset) : '', x.getAttribute('aria-label') || ''].join(' ')));
            return L.slice(0, 30).map((x, i) => { x.setAttribute('data-csptap', id + '-' + i); return 1; }).length; }, t);
          for (let i = 0; i < n; i++){
            if (!p.url().startsWith(base)){ await p.goto(base); await p.waitForTimeout(1500); }
            await closeOv(p);
            await p.evaluate(s => { const x = document.querySelector('[data-csptap="' + s + '"]'); if (x && x.offsetParent) x.click(); }, t + '-' + i).catch(() => {});
            await p.waitForTimeout(25);
          }
          /* every file picker that is on the page now gets a real file (PDF when it takes PDF, else a picture) */
          const ins = await p.evaluate(() => [...document.querySelectorAll('input[type=file]:not([data-cspfed])')].filter(x => !x.hasAttribute('capture')).map((x, i) => { const k = 'f' + Math.random().toString(36).slice(2); x.setAttribute('data-cspfed', k); return {k, acc: x.accept || ''}; }));
          for (const x of ins){ const h = await p.$('[data-cspfed="' + x.k + '"]'); if (!h) continue; await h.setInputFiles(/pdf/.test(x.acc) ? FILES.pdf : FILES.png).catch(() => {}); FED.push(t + ':' + x.k); await p.waitForTimeout(1500); await closeOv(p); }
          await p.keyboard.press('Escape').catch(() => {});
          if (!p.url().startsWith(base)){ await p.goto(base); await p.waitForTimeout(1500); }
        }
      }
    }
    return seen.size;
  };

  /* ---------- 1. the public site ---------- */
  {
    const c = await ctxOf(), p = await c.newPage(); watch(p, 'site');
    await step('site: open', async () => { await p.goto(O + '/'); await p.waitForFunction(() => document.documentElement.dataset.late === '1', null, {timeout: 30000}); await p.waitForTimeout(1500); });
    await step('site: test files', async () => {
      FILES.png = {name: 'test.png', mimeType: 'image/png', buffer: await p.screenshot({clip: {x: 0, y: 0, width: 390, height: 300}})};
      const pdf = await p.evaluate(async () => { const s = document.createElement('script'); s.src = 'lib/pdf-lib.min.js'; await new Promise((r, j) => { s.onload = r; s.onerror = j; document.head.appendChild(s); });
        const d = await PDFLib.PDFDocument.create(); d.addPage([300, 300]).drawText('Invoice 99 TOTAL 120.50', {x: 20, y: 150, size: 14}); return d.saveAsBase64(); });
      FILES.pdf = {name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf, 'base64')};
    });
    let n = 0;
    await step('site: every screen, 3 languages', async () => { n = await walk(p, O + '/', ['he', 'ar', 'en'], false); });
    console.log('      screens:', n);
    if (!QUICK) await step('site: tap the buttons of every screen, a file into every file picker', async () => { FED.length = 0; await walk(p, O + '/', ['he'], true); await p.waitForTimeout(3000); console.log('      files given to pickers:', FED.length); });
    /* the on-demand parts live inside the app's closure: here the same files are loaded the same way (script tag, module import,
       worker, wasm) under the same policy, then the real screens get real files below */
    await step('site: PDF libraries (pdf-lib, pdf.js + its worker + wasm)', async () => {
      const ok = await p.evaluate(async () => { const sc = u => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        await sc('lib/pdf-lib.min.js'); const d = await PDFLib.PDFDocument.create(); d.addPage([200, 200]).drawText('CSP 123', {x: 20, y: 100, size: 20}); const bytes = await d.save();
        const m = await import('/lib/pdfjs/pdf.min.mjs'); m.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.min.mjs';
        const doc = await m.getDocument({data: bytes, isEvalSupported: false, wasmUrl: '/lib/pdfjs/wasm/', standardFontDataUrl: '/lib/pdfjs/standard_fonts/', cMapUrl: '/lib/pdfjs/cmaps/', cMapPacked: true, iccUrl: '/lib/pdfjs/iccs/'}).promise; const pg = await doc.getPage(1); const tc = await pg.getTextContent();
        const cv = document.createElement('canvas'); const vp = pg.getViewport({scale: 1}); cv.width = vp.width; cv.height = vp.height; await pg.render({canvasContext: cv.getContext('2d'), viewport: vp, canvas: cv}).promise;
        return tc.items.map(x => x.str).join('').includes('CSP'); });
      if (!ok) throw new Error('pdf text not read');
    });
    await step('site: ZIP and algebra libraries', async () => {
      const ok = await p.evaluate(async () => { const sc = u => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        await sc('lib/jszip.min.js'); await sc('lib/nerdamer.min.js'); const z = new JSZip(); z.file('a.txt', 'x'); await z.generateAsync({type: 'uint8array'});
        return String(nerdamer('(x+1)^2').expand()).includes('x^2') && String(nerdamer.solve('x^2-4', 'x')).includes('2'); });
      if (!ok) throw new Error('libraries');
    });
    await step('site: text recognition (worker + wasm)', async () => {
      const txt = await p.evaluate(async () => {
        const get = async u => { let b = await (await fetch(u)).arrayBuffer(); const h = new Uint8Array(b, 0, 2); if (h[0] === 0x1f && h[1] === 0x8b) b = await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); return b; };
        const w = new Worker('lib/ocr7/ocr-worker.js'); let n = 0;
        const call = (m, tr) => new Promise((ok, no) => { const id = ++n; m.id = id; w.onmessage = e => { const d = e.data || {}; if (d.progress != null || d.id !== id) return; d.ok ? ok(d) : no(new Error(d.err)); }; w.onerror = e => no(new Error('worker ' + (e.message || ''))); w.postMessage(m, tr); });
        const wasm = await get('lib/ocr7/tesseract-core-lstm.wasm.gz'), eng = await get('lib/ocr7/eng.traineddata.gz');
        await call({cmd: 'init', langs: 'eng', data: {eng}, core: new URL('lib/ocr7/tesseract-core-lstm.js', location.href).href, wasm}, [wasm, eng]);
        const c = document.createElement('canvas'); c.width = 600; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 160); g.fillStyle = '#000'; g.font = 'bold 64px Arial'; g.fillText('HELLO 42', 30, 105);
        const img = await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer();
        const r = await call({cmd: 'rec', img}, [img]); w.terminate(); return r.text || ''; });
      if (!/HELLO|42/.test(txt)) throw new Error('ocr: ' + String(txt).slice(0, 80));
    });
    await step('site: an injected inline script and handler are blocked', async () => {
      const n0 = V.length;
      const ran = await p.evaluate(async () => { window.__inj = 0; const d = document.createElement('div'); d.innerHTML = '<img src="data:," onerror="window.__inj=1"><a id="cspjs" href="javascript:window.__inj=2">x</a>'; document.body.appendChild(d);
        const s = document.createElement('script'); s.textContent = 'window.__inj=3'; document.body.appendChild(s); document.getElementById('cspjs').click(); await new Promise(r => setTimeout(r, 300)); d.remove(); s.remove(); return window.__inj; });
      await p.waitForTimeout(300);
      const caught = V.length - n0; V.splice(n0);   // these were expected
      if (ran !== 0 || caught < 2) throw new Error('injection not blocked: ran=' + ran + ' violations=' + caught);
    });
    await c.close();
  }
  /* ---------- 2. the admin version (behind the real lock, with a test session) ---------- */
  {
    const c = await ctxOf();
    const lp = await c.newPage(); watch(lp, 'admin-login');
    await step('admin: sign-in page (no session)', async () => { const r = await lp.goto(O + '/admin/'); await lp.waitForTimeout(800); const t = await lp.content(); if (!/כניסת מנהל/.test(t)) throw new Error('no login page ' + r.status()); await lp.click('#sw'); await lp.waitForTimeout(100); });
    await step('admin: sign-out page', async () => { await lp.goto(O + '/admin/__logout'); await lp.waitForTimeout(600); });
    await lp.close();
    await c.addCookies([{name: 'adm', value: SES, domain: 'localhost', path: '/admin', httpOnly: true, secure: false, sameSite: 'Lax'}]);
    const p = await c.newPage(); watch(p, 'admin');
    await step('admin: open the admin version', async () => {
      const r = await p.goto(O + '/admin/'); const csp = r.headers()['content-security-policy'] || '';
      if (/'unsafe-inline'|'unsafe-eval'/.test(csp.split(';').find(x => /script-src/.test(x)) || '') || !/sha256-/.test(csp)) throw new Error('admin CSP: ' + csp.slice(0, 200));
      await p.waitForFunction(() => document.documentElement.dataset.late === '1' && document.getElementById('admk-fab'), null, {timeout: 30000}); await p.waitForTimeout(1500);
      if (!(await p.evaluate(() => !!window.__FIN_ADMIN__ && !!window.__FIN_ADMSES__ && !!window.__ADMKIT && !!document.getElementById('admk-fab')))) throw new Error('not the admin version');
    });
    let n = 0;
    await step('admin: every screen, 3 languages', async () => { n = await walk(p, O + '/admin/', ['he', 'ar', 'en'], false); });
    console.log('      screens:', n);
    if (!QUICK) await step('admin: tap the buttons of every screen, a file into every file picker', async () => { FED.length = 0; await walk(p, O + '/admin/', ['he'], true); await p.waitForTimeout(3000); console.log('      files given to pickers:', FED.length); });
    await step('admin: the panel and every section', async () => {
      if (!p.url().startsWith(O + '/admin/')){ await p.goto(O + '/admin/'); await p.waitForTimeout(2500); }
      await closeOv(p); await p.click('#admk-fab'); await p.waitForTimeout(800);
      const ids = await p.evaluate(() => [...document.querySelectorAll('[id^="admk-s-"], details, summary')].length);
      await p.evaluate(() => { document.querySelectorAll('details').forEach(d => { d.open = true; }); });
      await p.waitForTimeout(500);
      const k = await p.evaluate(() => { const box = document.getElementById('admk-ov') || document.querySelector('[id^="admk-"]'); const L = [...document.querySelectorAll('[id^="admk-"] button, .admk button, [class*="admk"] button, [class*="ak-"] button')].filter(x => x.offsetParent && !/מחק|נתק|איפוס|שחזור|פרסם|שמור|יציאה|delete|reset|logout|publish|save|restore/i.test(x.textContent + ' ' + (x.id || '')));
        L.slice(0, 60).forEach((x, i) => x.setAttribute('data-csptap', 'k' + i)); return Math.min(L.length, 60); });
      for (let i = 0; i < k; i++){ if (!p.url().startsWith(O + '/admin/')) break; await p.evaluate(s => { const x = document.querySelector('[data-csptap="' + s + '"]'); if (x && x.offsetParent) x.click(); }, 'k' + i).catch(() => {}); await p.waitForTimeout(40); }
      console.log('      panel parts:', ids, 'buttons tapped:', k);
    });
    await step('admin: settings with developer tools', async () => { if (!p.url().startsWith(O + '/admin/')) await p.goto(O + '/admin/'); await p.waitForTimeout(1000); await p.evaluate(() => { try { FinApp.open('settings'); } catch (e) {} document.querySelectorAll('details').forEach(d => { d.open = true; }); }); await p.waitForTimeout(800); });
    await c.close();
  }
  await b.close(); srv.close();
  console.log('\nsite CSP:', SITE_CSP.split(';').find(x => /script-src/.test(x)).trim());
  console.log('CSP violations:', V.length); V.slice(0, 30).forEach(v => console.log(' -', JSON.stringify(v).slice(0, 400)));
  if (ERRS.length){ console.log('other page errors (not CSP):', ERRS.length); [...new Set(ERRS)].slice(0, 15).forEach(e => console.log(' ·', e)); }
  if (FAILS.length){ console.log('FAILED steps:', FAILS.length); FAILS.forEach(e => console.log(' x', e)); }
  process.exit(V.length || FAILS.length ? 1 : 0);
})();
