// Formula checks, in a real browser on the built app.
//   node scripts/formulas.js            → the known-answer checks (the numbers worked out here by hand formulas); fails on any miss
//   node scripts/formulas.js snap F     → also writes every calculator's result at its default values to F (a "before" picture)
//   node scripts/formulas.js diff A B   → lists every calculator whose result differs between two pictures (before / after a change)
// The market figures are fixed (the copy in scripts/fixtures/rates.json) and the clock is fixed, so two runs give the same numbers.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : path.resolve(__dirname, '..');   // APP_ROOT: another copy of the app (for a before/after check)
const [, , mode, A, B] = process.argv;

if (mode === 'diff'){
  const a = JSON.parse(fs.readFileSync(A, 'utf8')), b = JSON.parse(fs.readFileSync(B, 'utf8'));
  let n = 0;
  for (const k of Object.keys(a)){
    if (!(k in b)){ console.log('MISSING after:', k); n++; continue; }
    const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
    if (x !== y){ n++; console.log('CHANGED:', k); console.log('  before', x.slice(0, 400)); console.log('  after ', y.slice(0, 400)); }
  }
  Object.keys(b).filter(k => !(k in a)).forEach(k => console.log('NEW:', k));
  console.log(n ? n + ' calculators changed' : 'no calculator changed'); process.exit(n ? 1 : 0);
}

const FIX = path.join(__dirname, 'fixtures', 'rates.json');
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = p === '/rates.json' && fs.existsSync(FIX) ? FIX : path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.end(fs.readFileSync(f));
}).listen(8766);

/* the answers, from the textbook formulas (worked out here, not by the app) */
const pmt = (P, yr, n) => { const r = yr / 1200; return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; };
const CASES = [
  {tab: 'loan', name: 'Spitzer 500,000 at 4.5% for 25 years', set: {l_mode: 'pay', l_rateType: 'fixed', l_rateIn: 'total', l_link: 'none', l_amount: 500000, l_rate: 4.5, l_years: 25, l_months: 300, l_type: 'annuity', l_grace: 0, l_extra: 0, l_pre: 0, l_feePct: 0, l_feeFix: 0},
    expect: {hero: pmt(500000, 4.5, 300)}},
  {tab: 'loan', name: 'zero interest 120,000 over 10 years', set: {l_mode: 'pay', l_rateType: 'fixed', l_rateIn: 'total', l_link: 'none', l_amount: 120000, l_rate: 0, l_years: 10, l_months: 120, l_type: 'annuity', l_grace: 0, l_extra: 0, l_pre: 0, l_feePct: 0, l_feeFix: 0},
    expect: {hero: 1000}},
  {tab: 'loan', name: 'equal principal 240,000 at 6% for 20 years – first payment', set: {l_mode: 'pay', l_rateType: 'fixed', l_rateIn: 'total', l_link: 'none', l_amount: 240000, l_rate: 6, l_years: 20, l_months: 240, l_type: 'equal', l_grace: 0, l_extra: 0, l_pre: 0, l_feePct: 0, l_feeFix: 0},
    expect: {hero: 240000 / 240 + 240000 * 0.005}},
  {tab: 'mmf', name: 'deposit 100,000 at 3% for 12 months – net after 15% tax', set: {mm_amt: 100000, mm_mo: 12, mm_dep: 3, mm_yld: 3, mm_fee: 0, mm_infl: 2},
    expect: {row: ['r_mmDepN', 100000 * 0.03 * 0.85]}},
  {tab: 'deposit', name: 'fixed deposit 100,000 at 4% for 12 months, simple – final after 15% tax', set: {dk_kind: 'fix', dk_amt: 100000, dk_add: 0, dk_mo: 12, dk_rate: 4, dk_comp: 'end', dk_cpi: 2.5, dk_tax: 'auto'},
    expect: {hero: 100000 + 4000 * 0.85}},
  {tab: 'deposit', name: 'fixed deposit, monthly compounding – gross profit', set: {dk_kind: 'fix', dk_amt: 100000, dk_add: 0, dk_mo: 12, dk_rate: 4, dk_comp: 'month', dk_cpi: 2.5, dk_tax: 'auto'},
    expect: {row: ['r_dkGross', 100000 * (Math.pow(1 + 0.04 / 12, 12) - 1)]}},
  {tab: 'deposit', name: 'deposit at 0% – nothing grows', set: {dk_kind: 'fix', dk_amt: 50000, dk_add: 0, dk_mo: 24, dk_rate: 0, dk_comp: 'end', dk_cpi: 2, dk_tax: 'auto'},
    expect: {hero: 50000}},
  {tab: 'deposit', name: 'CPI-linked: the linkage over a year equals the inflation', set: {dk_kind: 'cpi', dk_amt: 100000, dk_add: 0, dk_mo: 12, dk_rate: 1.5, dk_comp: 'end', dk_cpi: 2.5, dk_tax: 'auto'},
    expect: {row: ['r_dkIdx', 2500]}},
  {tab: 'deposit', name: 'structured: half of a 10% index rise, under the cap', set: {dk_kind: 'struct', dk_amt: 100000, dk_mo: 12, dk_smin: 0, dk_spart: 50, dk_sidx: 10, dk_scap: 20, dk_cpi: 2, dk_tax: 'auto'},
    expect: {hero: 100000 + 5000 * 0.85}},
  {tab: 'deposit', name: 'monthly deposits 1,000 for 12 months at 0% – total deposited', set: {dk_kind: 'fix', dk_amt: 0, dk_add: 1000, dk_mo: 12, dk_rate: 0, dk_comp: 'end', dk_cpi: 0, dk_tax: 'auto'},
    expect: {row: ['r_dkDep', 11000]}},
  {tab: 'loan', name: 'full grace of 12 months on 100,000 at 6% for 10 years – payment after the grace', set: {l_mode: 'pay', l_rateType: 'fixed', l_rateIn: 'total', l_link: 'none', l_amount: 100000, l_rate: 6, l_years: 10, l_months: 120, l_type: 'annuity', l_grace: 12, l_graceType: 'full', l_balloon: 0, l_extra: 0, l_pre: 0, l_feePct: 0, l_feeFix: 0},
    expect: {hero: pmt(100000 * Math.pow(1.005, 12), 6, 108)}},
  {tab: 'loan', name: 'partial balloon of 30% on 100,000 at 6% for 5 years – monthly payment', set: {l_mode: 'pay', l_rateType: 'fixed', l_rateIn: 'total', l_link: 'none', l_amount: 100000, l_rate: 6, l_years: 5, l_months: 60, l_type: 'annuity', l_grace: 0, l_graceType: 'int', l_balloon: 30, l_extra: 0, l_pre: 0, l_feePct: 0, l_feeFix: 0},
    expect: {hero: (100000 - 30000 / Math.pow(1.005, 60)) * 0.005 / (1 - Math.pow(1.005, -60))}},
  {tab: 'altcmp', name: 'where to put the money: the current account keeps exactly what was put in', set: {ac_lump: 50000, ac_mon: 500, ac_yrs: 2, ac_cpi: 0, ac_depRate: 0, ac_mktRet: 0, ac_mktFee: 0, ac_loanBal: 0},
    expect: {hero: 50000 + 500 * 23}},
  {tab: 'altcmp', name: 'where to put the money: the market at 12% a year for a year, 25% tax on the gain', set: {ac_lump: 100000, ac_mon: 0, ac_yrs: 1, ac_cpi: 0, ac_depRate: 0, ac_mktRet: 12, ac_mktFee: 0, ac_loanBal: 0},
    expect: {hero: 100000 + 12000 * 0.75}}


];

(async () => {
  const b = await chromium.launch(), c = await b.newContext({viewport: {width: 390, height: 844}, locale: 'he-IL', timezoneId: 'Asia/Jerusalem'});
  await c.route('**/*', r => r.request().url().startsWith('http://localhost:8766') ? r.continue() : r.abort());
  const p = await c.newPage(), errs = [];
  try { await p.clock.setFixedTime(new Date('2026-11-01T10:00:00+02:00')); } catch (e) {}
  p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(4000);
  const num = s => { const x = parseFloat(String(s || '').replace(/<[^>]*>/g, '').replace(/[−–]/g, '-').replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : NaN; };
  const run = (tab, set) => p.evaluate(([id, set]) => {
    const F = window.FinApp; try { F.open(id); } catch (e) {}
    const P = document.getElementById('panel-' + id);
    Object.keys(set || {}).forEach(k => { const e = document.getElementById(k); if (e){ e.value = String(set[k]); e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); } });
    try { F.calc(id); } catch (e) { return {err: String(e)}; }
    const r = F.last(id); if (!r) return {err: 'no result', panel: !!P};
    const strip = s => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return {hero: strip(r.hero && r.hero.value), rows: (r.rows || []).filter(Boolean).map(x => [strip(x[0]), strip(x[1])]),
      keys: Object.fromEntries((r.rows || []).filter(Boolean).map(x => [strip(x[0]), strip(x[1])]))};
  }, [tab, set]);
  let bad = 0;
  for (const cs of CASES){
    const r = await run(cs.tab, cs.set);
    if (r.err){ bad++; console.log('FAIL', cs.name, r.err); continue; }
    let got, want;
    if (cs.expect.hero != null){ got = num(r.hero); want = cs.expect.hero; }
    else { const lab = await p.evaluate(k => window.FinApp.t(k), cs.expect.row[0]); got = num(r.keys[lab]); want = cs.expect.row[1]; }
    const ok = Math.abs(got - want) <= 0.01 + Math.abs(want) * 1e-6 || Math.abs(got - Math.round(want)) < 0.5 && !/\./.test(String(got));
    if (!ok){ bad++; console.log('FAIL', cs.name, 'got', got, 'want', want.toFixed(2)); } else console.log('ok  ', cs.name, '=', want.toFixed(2));
  }
  if (mode === 'snap'){
    const ids = await p.evaluate(() => { const C = window.FinApp.CALC; return Object.keys(C).filter(id => typeof C[id] === 'function'); });
    await p.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForTimeout(4000);   // every calculator at its own default values
    const out = {};
    for (const id of ids){ const r = await run(id, null); out[id] = r.err ? {err: r.err} : {hero: r.hero, rows: r.rows}; }
    fs.writeFileSync(A, JSON.stringify(out, null, 1)); console.log('snapshot of', ids.length, 'calculators →', A);
  }
  if (errs.length){ bad++; console.log('page errors:', errs.slice(0, 5)); }
  console.log(bad ? bad + ' problems' : 'all formula checks passed');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
