// 13.89: the app must work before its late part (app-late.js) arrives: opens the app with the late part held back,
// uses the home screen and a few screens, then lets the late part in and checks the waiting screen opens. Fails on any page error.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.end(fs.readFileSync(f)); }).listen(8766);
const LATE = (process.argv[2] || 'scical').split(',');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const lang of ['he', 'en']) for (const want of LATE){
    const c = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    await c.addInitScript(l => { try { localStorage.setItem('fin-lang', l); } catch (e) {} }, lang);
    let release; const gate = new Promise(r => { release = r; });
    await c.route('**/*', async r => { const u = r.request().url(); if (!u.startsWith('http://localhost:8766')) return r.abort(); if (/app-late\.js/.test(u)) await gate; r.continue(); });
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    await p.goto('http://localhost:8766/', {waitUntil: 'domcontentloaded'}); await p.waitForFunction(() => window.FinApp && document.querySelector('#panel-home'), null, {timeout: 30000});
    await p.waitForTimeout(800);
    const early = await p.evaluate(() => ({late: document.documentElement.dataset.late || '', cards: document.querySelectorAll('#panel-home a, #panel-home button').length}));
    for (const t of ['salary', 'loan', 'convert', 'home']){ await p.evaluate(id => { const e = document.getElementById('tab-' + id); if (e) e.click(); else FinApp.open(id); }, t); await p.waitForTimeout(150); }
    await p.evaluate(id => FinApp.open(id), want); await p.waitForTimeout(300);
    const waiting = await p.evaluate(() => document.body.classList.contains('late-wait'));
    release(); await p.waitForFunction(() => document.documentElement.dataset.late === '1', null, {timeout: 20000}).catch(() => {});
    await p.waitForTimeout(800);
    const after = await p.evaluate(id => { const e = document.getElementById('panel-' + id); return {tab: FinApp.tab(), vis: [...document.querySelectorAll('[id^=panel-]')].filter(x => !x.hidden && x.offsetParent).map(x => x.id).join(','), shown: !!e && !e.hidden, late: document.documentElement.dataset.late || '', txt: e ? e.innerText.length : 0}; }, want);
    const ok = !errs.length && !early.late && early.cards > 5 && after.shown && after.late === '1' && after.txt > 40;
    if (!ok) bad++;
    console.log(lang, want, ok ? 'ok' : 'FAIL', JSON.stringify({early, waiting, after}), errs.slice(0, 5).join(' | '));
    await c.close();
  }
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
