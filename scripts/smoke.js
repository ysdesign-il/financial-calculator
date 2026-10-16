// opens the site in a phone-sized browser, visits every calculator in 3 languages and fails on any page error
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.end(fs.readFileSync(f)); }).listen(8765);
(async () => {
  const b = await chromium.launch(), c = await b.newContext({viewport: {width: 390, height: 844}});
  await c.route('**/*', r => r.request().url().startsWith('http://localhost:8765') ? r.continue() : r.abort());
  const p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(4000);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('[id^="tab-"]')].map(x => x.id.slice(4)));
  for (const lang of ['he', 'ar', 'en']){
    await p.evaluate(l => { const s = document.getElementById('set_lang') || document.getElementById('lang'); if (s){ s.value = l; s.dispatchEvent(new Event('change', {bubbles: true})); } }, lang);
    for (const t of tabs){ await p.evaluate(id => { const e = document.getElementById('tab-' + id); if (e) e.click(); }, t); await p.waitForTimeout(60); }
  }
  console.log('screens', tabs.length, 'errors', errs.length); errs.slice(0, 10).forEach(e => console.log(' -', e));
  await b.close(); srv.close(); process.exit(errs.length ? 1 : 0);
})();
