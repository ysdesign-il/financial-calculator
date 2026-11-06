/* ---------- 13.84: the rest of the upgrade plan, together ----------
   1. "My financial picture" – one screen that gathers what you already entered (balance sheet, expenses and income, savings
      and holdings, goals) – nothing is typed twice and nothing is counted twice: the net worth comes from the balance sheet
      (which itself is filled from the savings map), and the savings/holdings are shown as its parts.
   2. Expenses: budget against actual against the end-of-month forecast for each category with a limit, the expected
      balance for the month, and categories that grew three months in a row.
   3. "What if?" under every calculator: how much each input moves the main result (one at a time, the rest kept),
      a reverse calculation (which value of one input gives the result you want) and a stress test (the worst of each).
      It runs the same calculator again with one changed input – no second formula.
   4. Retirement: what the management fees cost by retirement, and what 10% more deposit adds.
   5. Holdings: the exchange rate at purchase and now (the effect of the currency on the return), region, the weight of
      each holding, best and worst, a monthly value history and a comparison to a benchmark return you type.
   6. Tax by years: the figures of each year side by side, and a first estimate of a refund – only for the year whose tax
      values are built in (other years are shown as typed, never with another year's brackets) – with the documents list.
   7. Life planning: more events (income drop, expenses up, rate up or down, a mortgage, closing a loan, a lump-sum
      investment, a bigger monthly deposit), the plan against the same plan with no events, and saved plans.
   8. A financial journal – decisions, events and notes with a date and an amount.
   9. My financial report – 10 kinds of report. */
const f10num = s => { const x = parseFloat(String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[−–]/g, '-').replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : NaN; };
const F10_TAXYEAR = 2026;   /* the year of the built-in tax values (TAX) */
function f10Def(id){ for (const k in DEFS){ const f = (DEFS[k] || []).find(x => x && x.id === id); if (f) return f; } return null; }
/* a value of any calculator's input, even when its screen was never opened: the screen, then the saved values, then the default */
function vOf(id){
  const el = document.getElementById(id); if (el && el.value !== ''){ const n = parseFloat(el.value); if (isFinite(n)) return n; }
  try { const o = JSON.parse(localStorage.getItem('fin-vals') || '{}'); if (o[id] != null && o[id] !== ''){ const n = parseFloat(o[id]); if (isFinite(n)) return n; } } catch (e) {}
  const f = f10Def(id); return f ? +f.val || 0 : 0;
}
const f10Touched = id => { try { return typeof TOUCHED !== 'undefined' && TOUCHED.includes(id); } catch (e) { return false; } };
/* run an existing engine with some inputs set for a moment (made if the screen was never opened), then put everything back */
function withVals(map, fn){
  let host = document.getElementById('f10_tmp'); if (!host){ host = document.createElement('div'); host.id = 'f10_tmp'; host.hidden = true; document.body.appendChild(host); }
  const back = [];
  Object.keys(map).forEach(id => { let el = document.getElementById(id); if (!el){ el = document.createElement('input'); el.id = id; host.appendChild(el); back.push([el, null]); } else back.push([el, el.value]); el.value = String(map[id]); });
  try { return fn(); } finally { back.forEach(([el, old]) => { if (old === null) el.remove(); else el.value = old; }); }
}
const f10Hold = x => { const val = pfN(x.val) || 0, c = x.cur || 'ILS'; try { return c !== 'ILS' && RATES[c] ? fxConv(val, c, 'ILS') : val; } catch (e) { return val; } };

/* ================= 1. my financial picture ================= */
function fpData(){
  const D = {src: []}, now = new Date(), ym = ymOf(now);
  try { const H = SET.nwHist || {}, ks = Object.keys(H).sort(); if (ks.length){ const h = H[ks[ks.length - 1]]; D.a = h.a; D.l = h.l; D.nwAt = h.at; D.hist = ks.slice(-24).map(k => ({k, n: H[k].a - H[k].l})); D.src.push(['tab_networth', h.at, 'networth', 0]); } } catch (e) {}
  if (D.a != null && f10Touched('networth')){ D.parts = {}; ['nw_cash', 'nw_inv', 'nw_pen', 'nw_prop', 'nw_oa', 'nw_mort', 'nw_loan', 'nw_card', 'nw_ol'].forEach(id => { D.parts[id] = Math.max(0, vOf(id)); }); }
  try {
    const inc = expIncome(ym) || expIncome(ymAdd(ym, -1)), d = expData(); D.inc = inc && inc.v > 0 ? +inc.v : 0;
    if (!D.inc && Array.isArray(d.incSrc)) D.inc = d.incSrc.reduce((s, x) => s + Math.max(0, +x.amt || 0), 0);
    const prev = [1, 2, 3].map(n => expTotals(ymAdd(ym, -n), 'cat').sum).filter(x => x > 0);
    D.exp = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : expTotals(ym, 'cat').sum; D.expAvg = prev.length > 0;
    D.months = [5, 4, 3, 2, 1, 0].map(n => { const k = ymAdd(ym, -n), i = expIncome(k); return {k, e: expTotals(k, 'cat').sum, i: i && i.v > 0 ? +i.v : 0}; });
    const its = d.items || []; if (its.length){ const last = its.reduce((m, x) => Math.max(m, +x.t || 0), 0), imp = its.filter(x => x.imp).length; D.src.push(['tab_expenses', last, 'expenses', imp]); }
  } catch (e) {}
  try {
    const p = pfD(); D.sav = p.sav.reduce((s, x) => s + Math.max(0, pfN(x.bal) || 0), 0); D.hold = p.hold.reduce((s, x) => s + Math.max(0, f10Hold(x)), 0);
    D.pen = p.sav.filter(x => ['pension', 'hish', 'gemel'].includes(x.type)).reduce((s, x) => s + Math.max(0, pfN(x.bal) || 0), 0);
    D.liq = p.sav.filter(x => ['cash', 'deposit', 'mmf'].includes(x.type)).reduce((s, x) => s + Math.max(0, pfN(x.bal) || 0), 0);
    D.byType = {}; p.hold.forEach(x => { D.byType[x.type || 'other'] = (D.byType[x.type || 'other'] || 0) + Math.max(0, f10Hold(x)); });
    D.savBy = {}; p.sav.forEach(x => { D.savBy[x.type || 'other'] = (D.savBy[x.type || 'other'] || 0) + Math.max(0, pfN(x.bal) || 0); });
    if (p.sav.length || p.hold.length) D.src.push(['tab_portfolio', 0, 'portfolio', 0]);
  } catch (e) {}
  if (D.parts){ if (!D.pen) D.pen = D.parts.nw_pen; if (!D.liq) D.liq = D.parts.nw_cash; D.mort = D.parts.nw_mort; D.loans = D.parts.nw_loan + D.parts.nw_card + D.parts.nw_ol; }
  try { D.goals = (lpD().goals || []).filter(g => +g.target > 0).map(g => ({n: g.name || t('lp_gName'), tg: +g.target, sv: +g.saved || 0})); if (D.goals.length) D.src.push(['tab_lifeplan', 0, 'lifeplan', 0]); } catch (e) { D.goals = []; }
  D.free = D.inc ? D.inc - (D.exp || 0) : null; D.rate = D.inc ? D.free / D.inc * 100 : null;
  D.emT = (D.exp || 0) * 6; D.fiT = (D.exp || 0) * 12 * 25;
  return D;
}
const fpBar = (p, lab) => `<span class="fp-bar" role="img" aria-label="${asEsc(lab + ' ' + N(Math.max(0, Math.min(100, p)), 0) + '%')}"><i style="width:${Math.max(0, Math.min(100, p)).toFixed(1)}%"></i></span>`;
function fpRender(D){
  const box = document.getElementById('fp_box'); if (!box) return;
  const E = asEsc, has = D.a != null || D.inc || D.sav || D.hold;
  const acts = [['networth', 'fp_aAsset'], ['networth', 'fp_aDebt'], ['networth', 'fp_aUpd'], ['expenses', 'fp_aExp'], ['portfolio', 'fp_aPf'], ['retire', 'fp_aRet'], ['emergency', 'fp_aEm'], ['lifeplan', 'fp_aGoal']];
  let h = `<div class="fp-acts">${acts.map(([go, k]) => `<button type="button" class="as-chip" data-fpgo="${go}">${E(t(k))}</button>`).join('')}</div>`;
  if (!has){ box.innerHTML = h + `<p class="fine">${E(t('fp_empty'))}</p>`; return; }
  const mx = Math.max(1, ...(D.months || []).map(m => Math.max(m.e, m.i)));
  if ((D.months || []).some(m => m.e || m.i)) h += `<h3 class="sec-t">${E(t('fp_ieT'))}</h3><div class="fp-ie" role="img" aria-label="${E(t('fp_ieT'))}">${D.months.map(m => `<div class="fp-m"><div class="fp-cols"><i class="in" style="height:${(m.i / mx * 100).toFixed(1)}%" title="${E(t('fp_inc') + ': ' + M(m.i))}"></i><i class="ex" style="height:${(m.e / mx * 100).toFixed(1)}%" title="${E(t('fp_exp') + ': ' + M(m.e))}"></i></div><small>${m.k.slice(5)}/${m.k.slice(2, 4)}</small></div>`).join('')}</div><p class="fp-leg"><span class="in"></span>${E(t('fp_inc'))} <span class="ex"></span>${E(t('fp_exp'))}</p>`;
  const P = D.parts, col = PF_COL;
  if (P){
    const A = [['nw_cash', 'f_nwCash'], ['nw_inv', 'f_nwInv'], ['nw_pen', 'f_nwPen'], ['nw_prop', 'f_nwProp'], ['nw_oa', 'f_nwOa']].filter(([k]) => P[k] > 0).map(([k, l], i) => ({n: t(l), v: P[k], col: col[i]}));
    const L = [['nw_mort', 'f_nwMort'], ['nw_loan', 'f_nwLoan'], ['nw_card', 'f_nwCard'], ['nw_ol', 'f_nwOl']].filter(([k]) => P[k] > 0).map(([k, l], i) => ({n: t(l), v: P[k], col: col[(i + 3) % col.length]}));
    if (A.length || L.length) h += `<div class="pf-two">${A.length ? `<div><h4 class="ds-q">${E(t('fp_aSplit'))}</h4>${pfDonut(A)}</div>` : ''}${L.length ? `<div><h4 class="ds-q">${E(t('fp_lSplit'))}</h4>${pfDonut(L)}</div>` : ''}</div>`;
  }
  const BT = Object.keys(D.byType || {}).filter(k => D.byType[k] > 0);
  if (BT.length) h += `<h4 class="ds-q">${E(t('fp_invSplit'))}</h4>${pfDonut(BT.map((k, i) => ({n: t('pf_h_' + k), v: D.byType[k], col: col[i % col.length]})))}`;
  const prog = [];
  if (D.emT > 0) prog.push([t('fp_em'), (D.liq || 0) / D.emT * 100, t('fp_emOf', {h: M(D.liq || 0), g: M(D.emT)})]);
  (D.goals || []).slice(0, 6).forEach(g => prog.push([g.n, g.sv / g.tg * 100, M(g.sv) + ' / ' + M(g.tg)]));
  if (D.fiT > 0 && D.a != null) prog.push([t('fp_fi'), Math.max(0, D.a - D.l) / D.fiT * 100, t('fp_fiOf', {g: M(D.fiT)})]);
  if (prog.length) h += `<h3 class="sec-t">${E(t('fp_progT'))}</h3><ul class="fp-prog">${prog.map(([n, p, s]) => `<li><span class="fp-pn">${E(n)} <b>${E(N(Math.max(0, p), 0))}%</b></span>${fpBar(p, n)}<small>${E(s)}</small></li>`).join('')}</ul>`;
  if (D.src.length) h += `<details class="fp-src"><summary>${E(t('fp_srcT'))}</summary><ul>${D.src.map(([l, at, go, imp]) => `<li><span>${E(t(l))}</span><small>${E(at ? t('fp_upd', {d: new Date(at).toLocaleDateString()}) : t('fp_updNo'))} · ${E(t(imp ? 'fp_imp' : 'fp_man', {n: imp}))}</small><button type="button" class="as-chip" data-fpgo="${go}">${E(t('al_open'))}</button></li>`).join('')}</ul></details>`;
  box.innerHTML = h;
}
CALC.fpic = function(){
  const D = fpData(), rows = [], warn = [];
  const nw = D.a != null ? D.a - D.l : null;
  if (D.a != null){ rows.push([t('mr_assets'), M(D.a)], [t('mr_debts'), M(D.l)]); }
  if (D.inc) rows.push([t('fp_inc'), M(D.inc)]);
  if (D.exp) rows.push([t('fp_exp') + (D.expAvg ? ' ' + t('fp_avg3') : ''), M(D.exp)]);
  if (D.free != null){ rows.push([t('fp_free'), (D.free < 0 ? '−' : '') + M(Math.abs(D.free)), 'key'], [t('mr_saveRate'), PC(D.rate)]); if (D.free < 0) warn.push(t('fp_wNeg')); }
  if (D.sav) rows.push([t('fp_sav'), M(D.sav)]);
  if (D.hold) rows.push([t('fp_hold'), M(D.hold)]);
  if (D.pen) rows.push([t('fp_pen'), M(D.pen)]);
  if (D.loans) rows.push([t('fp_loans'), M(D.loans)]);
  if (D.mort) rows.push([t('fp_mort'), M(D.mort)]);
  if (D.emT > 0) rows.push([t('fp_em'), t('fp_emOf', {h: M(D.liq || 0), g: M(D.emT)})]);
  if ((D.goals || []).length) rows.push([t('fp_goals'), t('fp_goalsV', {n: D.goals.length, s: M(D.goals.reduce((s, g) => s + g.sv, 0)), g: M(D.goals.reduce((s, g) => s + g.tg, 0))})]);
  if (nw != null && D.fiT > 0) rows.push([t('fp_fi'), PC(Math.max(0, nw) / D.fiT * 100)]);
  fpRender(D);
  const res = {hero: {label: t('fp_hero'), value: nw != null ? (nw < 0 ? '−' : '') + M(Math.abs(nw)) : '—', sub: nw != null ? t('fp_heroSub', {d: new Date(D.nwAt).toLocaleDateString()}) : t('mr_empty')}, rows, warn, note: t('fp_note')};
  if (D.hist && D.hist.length >= 2) res.chart = {title: t('nw_hist'), unit: '', fmt: x => M(x), labels: D.hist.map(x => x.k.slice(5) + '/' + x.k.slice(2, 4)), layers: [{name: t('nw_histNet'), cls: 'c-ink', values: D.hist.map(x => Math.max(0, x.n))}]};
  return res;
};

/* ================= 2. expenses: budget against actual and the forecast ================= */
function exBudCard(){
  const P = document.getElementById('panel-expenses'), inc0 = document.getElementById('ex_inc'); if (!P || !inc0) return;
  const E = asEsc, d = expData(), ym = (typeof EXP_M !== 'undefined' && EXP_M) || ymOf(new Date()), now = new Date(), isNow = ym === ymOf(now);
  const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), day = isNow ? now.getDate() : dim, fac = isNow && day >= 3 ? dim / day : 1;
  const tot = expTotals(ym, 'cat'), by = tot.by, B = d.budgets || {}, cats = EXP_CATS.map(c => c[0]);
  /* forecast for each category = the larger of what was spent so far and your usual month (3-month average);
     with no history, this month's pace so far. Once-a-month bills (rent) are therefore not multiplied. */
    const avg3 = c => { const a = [1, 2, 3].map(n => expTotals(ymAdd(ym, -n), 'cat').by[c] || 0).filter(x => x > 0); return a.length ? a.reduce((p, q) => p + q, 0) / a.length : NaN; };
  const fcOf = c => { const s = +by[c] || 0; if (!isNow) return s; const a = avg3(c); return isFinite(a) ? Math.max(s, a) : s * fac; };
  const rows = cats.filter(c => +B[c] > 0).map(c => { const s = +by[c] || 0, f = fcOf(c), b = +B[c]; return {c, s, f, b, st: f > b ? 2 : s >= b * 0.9 ? 1 : 0}; });
  const fc = cats.reduce((sum, c) => sum + fcOf(c), 0), inc = expIncome(ym), iv = inc && inc.v > 0 ? +inc.v : 0;
  const grow = cats.filter(c => { const a = [3, 2, 1].map(n => expTotals(ymAdd(ym, -n), 'cat').by[c] || 0); return a[0] > 0 && a[1] > a[0] * 1.05 && a[2] > a[1] * 1.05; });
  let c = document.getElementById('ex_bud'); if (!c){ inc0.insertAdjacentHTML('afterend', '<div id="ex_bud" class="ex-inc"></div>'); c = document.getElementById('ex_bud'); }
  if (!rows.length && !tot.sum && !grow.length){ c.innerHTML = ''; return; }
  c.innerHTML = `<details${rows.length ? ' open' : ''}><summary class="sec-t">${E(t('bi_t'))}</summary>
    <div class="bi-top"><div><small>${E(t(isNow ? 'bi_fc' : 'bi_act'))}</small><b class="num">${E(M(fc))}</b></div>${iv ? `<div><small>${E(t('bi_bal'))}</small><b class="num ${iv - fc < 0 ? 'down' : 'up'}">${iv - fc < 0 ? '−' : ''}${E(M(Math.abs(iv - fc)))}</b></div>` : ''}</div>
    ${rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${E(t('bi_plan'))}</th><th>${E(t('bi_spent'))}${isNow ? `<small class="wi-sm">${E(t('bi_fcS'))}</small>` : ''}</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="bi-s${r.st}"><td>${E(t('ec_' + r.c))}</td><td>${E(M(r.b))}</td><td>${E(M(r.s))}${isNow ? `<small class="wi-sm">${r.st === 2 ? '⚠ ' : ''}${E(M(r.f))}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : `<p class="fine">${E(t('bi_noBud'))}</p>`}
    ${grow.length ? `<p class="bi-grow">📈 ${E(t('bi_grow', {x: grow.map(k => t('ec_' + k)).join(', ')}))}</p>` : ''}
    <p class="fine">${E(t(isNow ? 'bi_h' : 'bi_hPast', {d: day, m: dim}))}</p></details>`;
}

/* ================= 3. "what if?" under every calculator ================= */
var WI_BUSY = false;
const WI_SKIP = ['fpic', 'myreport', 'alerts', 'finjournal', 'taxyears', 'recmp', 'mypolicies', 'depcmp', 'expenses'];
function wiFields(id){
  return (DEFS[id] || []).filter(f => f && f.id && !f.type && !f.opts && !f.options).map(f => ({f, el: document.getElementById(f.id)}))
    .filter(x => x.el && x.el.tagName === 'INPUT' && x.el.offsetParent !== null && isFinite(parseFloat(x.el.value))).slice(0, 14);
}
function wiRun(id, map){
  let r = null; WI_BUSY = true;
  try { r = withVals(map, () => CALC[id]()); } catch (e) { r = null; } finally { WI_BUSY = false; }
  return r && r.hero ? f10num(r.hero.value) : NaN;
}
const wiStep = x => x.f.unit === '%' ? 2 : null;
function wiFmt(f, x){ return f.unit === '%' ? N(x, 2) + '%' : /cur|ils/.test(f.unit || '') ? M(x) : N(x, 2); }
function wiRestore(id){ WI_BUSY = true; try { calc(id); } catch (e) {} finally { WI_BUSY = false; } }
const WI_ST = {};
/* stress test: a big move of each input (±2 points for a rate, ±20% for an amount), both ways – the small one-way moves are in "what moves the result most" above */
function wiTornado(id){
  const E = asEsc, st0 = WI_ST[id] || (WI_ST[id] = {}), base = wiRun(id, {}); let h;
  if (!isFinite(base)) h = `<p class="fine">${E(t('wi_na'))}</p>`;
  else {
    const R = wiFields(id).map(x => { const v0 = parseFloat(x.el.value), st = wiStep(x); if (!st && !v0) return null;
      const lo = st ? Math.max(0, v0 - st) : v0 * 0.8, hi = st ? v0 + st : v0 * 1.2, a = lo === v0 ? base : wiRun(id, {[x.f.id]: lo}), b = wiRun(id, {[x.f.id]: hi});
      return isFinite(a) && isFinite(b) ? {x, a, b, na: lo === v0, r: Math.abs(b - a)} : null; }).filter(Boolean).filter(z => z.r > 1e-9).sort((p, q) => q.r - p.r);
    h = R.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${E(t('wi_in'))}</th><th>${E(t('wi_lo'))}</th><th>${E(t('wi_hi'))}</th></tr></thead><tbody>
      ${R.map(z => `<tr><td>${E(t(z.x.f.label))}<small class="wi-sm">${E(wiStep(z.x) ? t('wi_pts') : t('wi_pct'))}</small></td><td class="${z.na ? '' : z.a < base ? 'down' : 'up'}">${z.na ? '—' : E(N(z.a, 0))}</td><td class="${z.b < base ? 'down' : 'up'}">${E(N(z.b, 0))}</td></tr>`).join('')}</tbody></table></div>
      <p class="fine">${E(t('wi_torH', {v: N(base, 0)}))}</p>` : `<p class="fine">${E(t('wi_na'))}</p>`;
  }
  wiRestore(id); st0.tor = h; const out = document.querySelector('#wi-' + id + ' .wi-tor'); if (out) out.innerHTML = h; const bt = document.querySelector('[data-witor="' + id + '"]'); if (bt) bt.textContent = t('wi_run');
}
function wiSeek(id){
  const box = document.getElementById('wi-' + id); if (!box) return;
  const E = asEsc, st0 = WI_ST[id] || (WI_ST[id] = {}), fid = box.querySelector('[data-wisf]').value, gs = box.querySelector('[data-wisg]').value, goal = parseFloat(String(gs).replace(/[^\d.\-]/g, '')), out = box.querySelector('.wi-sout');
  st0.f = fid; st0.g = gs;
  const x = wiFields(id).find(z => z.f.id === fid); if (!x || !isFinite(goal)){ out.textContent = t('wi_seekNeed'); return; }
  const v0 = parseFloat(x.el.value), pct = x.f.unit === '%', lo0 = pct ? Math.min(0, v0) : 0, hi0 = pct ? Math.max(40, v0 * 3) : Math.max(1000, Math.abs(v0) * 20);
  const f = z => wiRun(id, {[fid]: z}) - goal, n = 40, pts = [];
  for (let i = 0; i <= n; i++){ const z = lo0 + (hi0 - lo0) * i / n; pts.push([z, f(z)]); }
  let br = null; for (let i = 1; i < pts.length; i++){ if (isFinite(pts[i - 1][1]) && isFinite(pts[i][1]) && pts[i - 1][1] * pts[i][1] <= 0){ br = [pts[i - 1], pts[i]]; break; } }
  let h;
  if (!br) h = E(t('wi_seekNo'));
  else {
    let [a, fa] = br[0], [b] = br[1];
    for (let k = 0; k < 40; k++){ const m = (a + b) / 2, fm = f(m); if (!isFinite(fm)) break; if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
    const ans = (a + b) / 2;
    h = `${E(t('wi_seekRes', {g: N(goal, 0), f: t(x.f.label), v: wiFmt(x.f, ans)}))} <button type="button" class="as-chip" data-wiapply="${E(fid)}|${ans}">${E(t('wi_apply'))}</button>`;
  }
  wiRestore(id); st0.res = h; const o2 = document.querySelector('#wi-' + id + ' .wi-sout'); if (o2) o2.innerHTML = h;
}
/* the reverse calculation and the stress test join the existing "what moves the result most" box (no second box) */
function wiMount(id){
  if (WI_BUSY || WI_SKIP.includes(id) || !CALC[id]) return;
  const host = document.getElementById('cxs-' + id); if (!host || document.getElementById('wi-' + id)) return;
  const F = wiFields(id); if (!F.length) return;
  const E = asEsc, st0 = WI_ST[id] || {}, opts = F.map(x => `<option value="${E(x.f.id)}"${st0.f === x.f.id ? ' selected' : ''}>${E(t(x.f.label))}</option>`).join('');
  host.insertAdjacentHTML('beforeend', `<div class="wi" id="wi-${id}">
    <h4 class="ds-q">${E(t('wi_seekT'))}</h4><div class="wi-seek"><label>${E(t('wi_seekF'))} <select data-wisf>${opts}</select></label><label>${E(t('wi_seekG'))} <input type="text" inputmode="decimal" dir="ltr" data-wisg value="${E(st0.g || '')}"></label><button type="button" class="gold-btn" data-wiseek="${id}">${E(t('wi_seekGo'))}</button></div><p class="wi-sout" aria-live="polite">${st0.res || ''}</p>
    <h4 class="ds-q">${E(t('wi_torT'))}</h4><div class="wi-tor">${st0.tor || ''}</div><button type="button" class="btn" data-witor="${id}">${E(t(st0.tor ? 'wi_run' : 'wi_runFirst'))}</button>
    <p class="fine">${E(t('wi_note'))}</p></div>`);
}

/* ================= 4. retirement: fees and a bigger deposit ================= */
const calcRt10 = CALC.retire;
CALC.retire = function(){
  const res = calcRt10.apply(this, arguments);
  if (WI_BUSY) return res;
  try {
    const fv = x => { const r = x && x.rows && x.rows.find(q => q[0] === t('r_rtFv')); return r ? f10num(r[1]) : NaN; };
    const base = fv(res), fee = v('rt_fee'), dep = v('rt_dep');
    WI_BUSY = true;
    try {
      if (fee > 0){ const z = fv(withVals({rt_fee: 0}, () => calcRt10.call(this))); if (isFinite(z) && isFinite(base)) res.rows.push([t('rt2_fee', {p: N(fee, 2)}), '−' + M(Math.max(0, z - base))]); }
      if (dep > 0){ const z = fv(withVals({rt_dep: dep * 1.1}, () => calcRt10.call(this))); if (isFinite(z) && isFinite(base)) res.rows.push([t('rt2_dep', {v: M(dep * 0.1)}), '+' + M(Math.max(0, z - base))]); }
    } finally { WI_BUSY = false; }
  } catch (e) { WI_BUSY = false; }
  return res;
};

/* ================= 5. holdings: currency, region, weights, history, benchmark ================= */
PFX_F.push(['fx0', 'pa_fx0', 'num'], ['fx1', 'pa_fx1', 'num']);
const PA_REG = ['il', 'us', 'eu', 'em', 'world', 'other'];
function paRow(x){
  const c = pfxCalc(x), cur = x.cur || 'ILS', ils = f10Hold(x);
  const r = {x, ils, cur, pct: c ? c.pct : NaN};
  /* the cost at the rate of the purchase day, the value (with dividends) at today's rate – both typed by you */
  if (c && cur !== 'ILS'){ const f0 = pfN(x.fx0), f1 = pfN(x.fx1); if (f0 > 0 && f1 > 0){ const b = c.base * f0; r.pctIls = ((c.val + (pfN(x.div) || 0)) * f1 - b) / b * 100; r.fx = r.pctIls - c.pct; } }
  return r;
}
const pfHold10 = pfHold;
pfHold = function(v){
  const r = pfHold10.apply(this, arguments);
  try {
    const d = pfD(), E = pfE;
    v.querySelectorAll('.rm-list > li.rm-it').forEach((li, i) => { const x = d.hold[i], g = li.querySelector('.pfx .bk-grid'); if (!x || !g || g.querySelector('[data-pfk="reg"]')) return;
      g.insertAdjacentHTML('beforeend', `<label class="bk-f"><span>${E(t('pa_reg'))}</span><select data-pfh="${i}" data-pfk="reg">${['', ...PA_REG].map(k => `<option value="${k}"${(x.reg || '') === k ? ' selected' : ''}>${k ? E(t('pa_r_' + k)) : '—'}</option>`).join('')}</select></label>`);
      const pr = paRow(x); if (isFinite(pr.fx)) li.querySelector('.pfx').insertAdjacentHTML('beforeend', `<p class="fine">${E(t('pa_fxRes', {a: PC(pr.pct), b: PC(pr.pctIls), c: (pr.fx >= 0 ? '+' : '−') + PC(Math.abs(pr.fx))}))}</p>`); });
    const R = d.hold.map(paRow).filter(z => z.ils > 0), tot = R.reduce((s, z) => s + z.ils, 0); if (!tot) return r;
    const now = new Date(), ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'), H = SET.pfHist && typeof SET.pfHist === 'object' ? SET.pfHist : (SET.pfHist = {});
    if (!H[ym] || Math.abs(H[ym].v - tot) > 0.5){ H[ym] = {v: tot, at: Date.now()}; clearTimeout(SET.__paT); SET.__paT = setTimeout(() => { try { delete SET.__paT; saveSet(); } catch (e) {} }, 1500); }
    const ks = Object.keys(H).sort().slice(-24), hx = Math.max(1, ...ks.map(k => H[k].v));
    const byR = {}; R.forEach(z => { const k = z.x.reg || 'none'; byR[k] = (byR[k] || 0) + z.ils; });
    const G = R.filter(z => isFinite(z.pct)).sort((a, b) => b.pct - a.pct), base = R.reduce((s, z) => { const c = pfxCalc(z.x); return s + (c && z.cur === 'ILS' ? c.base : 0); }, 0), gain = R.reduce((s, z) => { const c = pfxCalc(z.x); return s + (c && z.cur === 'ILS' ? c.gain : 0); }, 0);
    const bm = pfN(SET.pfBench), myR = base > 0 ? gain / base * 100 : NaN;
    const nm = z => z.x.name || z.x.sym || t('pf_h_' + (z.x.type || 'other'));
    const html = `<details class="pa" open><summary class="sec-t">${E(t('pa_t'))}</summary>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${E(t('pa_val'))}</th><th>${E(t('pa_w'))}</th><th>${E(t('pa_ret'))}</th></tr></thead><tbody>
      ${R.slice().sort((a, b) => b.ils - a.ils).map(z => `<tr><td>${E(nm(z))}${z.cur !== 'ILS' ? ' <small>' + E(z.cur) + '</small>' : ''}</td><td>${E(M(z.ils))}</td><td>${E(PC(z.ils / tot * 100))}</td><td class="${z.pct >= 0 ? 'up' : 'down'}">${isFinite(z.pct) ? E(PC(z.pct)) : '—'}</td></tr>`).join('')}</tbody></table></div>
      ${G.length >= 2 ? `<p>🏆 ${E(t('pa_best', {x: G.slice(0, 3).map(z => nm(z) + ' ' + PC(z.pct)).join(', ')}))}<br>🔻 ${E(t('pa_worst', {x: G.slice(-3).reverse().map(z => nm(z) + ' ' + PC(z.pct)).join(', ')}))}</p>` : ''}
      ${Object.keys(byR).length > 1 || !byR.none ? `<h4 class="ds-q">${E(t('pa_byReg'))}</h4>${pfDonut(Object.keys(byR).map((k, i) => ({n: k === 'none' ? t('pa_r_none') : t('pa_r_' + k), v: byR[k], col: PF_COL[(i + 2) % PF_COL.length]})))}` : ''}
      ${ks.length >= 2 ? `<h4 class="ds-q">${E(t('pa_hist'))}</h4><div class="fp-ie">${ks.map(k => `<div class="fp-m"><div class="fp-cols"><i class="in" style="height:${(H[k].v / hx * 100).toFixed(1)}%" title="${E(M(H[k].v))}"></i></div><small>${k.slice(5)}/${k.slice(2, 4)}</small></div>`).join('')}</div>` : `<p class="fine">${E(t('pa_histH'))}</p>`}
      <label class="bk-f pa-bm"><span>${E(t('pa_bench'))}</span><input type="text" inputmode="decimal" dir="ltr" id="pa_bm" value="${E(SET.pfBench || '')}" placeholder="%"></label>
      ${isFinite(myR) && SET.pfBench !== '' && SET.pfBench != null ? `<p>${E(t('pa_vs', {a: PC(myR), b: PC(bm), d: (myR - bm >= 0 ? '+' : '−') + N(Math.abs(myR - bm), 2)}))}</p>` : ''}
      <p class="fine">${E(t('pa_note'))}</p></details>`;
    const L = v.querySelector('.rm-list'); if (L) L.insertAdjacentHTML('beforebegin', html);
  } catch (e) {}
  return r;
};
document.addEventListener('change', e => { const el = e.target; if (el && el.id === 'pa_bm'){ SET.pfBench = String(el.value).replace(/[^\d.\-]/g, '').slice(0, 8); try { saveSet(); pfRender(); } catch (er) {} } });

/* ================= 6. tax by years ================= */
const TY_F = [['gross', 'ty_gross'], ['paid', 'ty_paid'], ['pts', 'ty_pts'], ['pens', 'ty_pens'], ['don', 'ty_don'], ['other', 'ty_other']];
const TY_DOCS = ['ty_d106', 'ty_d867', 'ty_dDon', 'ty_dIns', 'ty_dPts', 'ty_dGap', 'ty_d135'];
function tyList(){ if (!Array.isArray(SET.tyList) || !SET.tyList.length){ const y = new Date().getFullYear(); SET.tyList = [{y: y - 1}, {y: y - 2}]; } return SET.tyList; }
function tyRender(force){
  const box = document.getElementById('ty_box'); if (!box) return;
  if (!force && box.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const E = asEsc, L = tyList(), D = SET.tyDocs || {};
  box.innerHTML = L.map((o, i) => `<div class="lc-card"><div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>
      <label class="ty-y">${E(t('ty_year'))} <input type="text" inputmode="numeric" maxlength="4" dir="ltr" data-tyi="${i}" data-tyk="y" value="${E(o.y || '')}"></label>
      ${L.length > 1 ? `<button type="button" class="lc-del" data-tydel="${i}" aria-label="${E(t('dq_del', {x: o.y || ''}))}">✕</button>` : ''}</div>
    <div class="fields">${TY_F.map(([k, l]) => `<div class="field"><label for="ty_${k}${i}">${E(t(l))}</label><div class="control"><input id="ty_${k}${i}" type="number" inputmode="decimal" step="any" data-tyi="${i}" data-tyk="${k}" value="${E(o[k] == null ? '' : o[k])}">${k === 'pts' ? '' : unitHTML('ils')}</div></div>`).join('')}</div></div>`).join('')
    + (L.length < 8 ? `<button type="button" class="lc-add" id="ty_add"><span aria-hidden="true">＋</span> ${E(t('ty_add'))}</button>` : '')
    + `<details class="ty-docs"><summary class="sec-t">${E(t('ty_docsT'))}</summary>${TY_DOCS.map(k => `<label class="al-k"><input type="checkbox" data-tydoc="${k}"${D[k] ? ' checked' : ''}> ${E(t(k))}</label>`).join('')}<p class="fine">${E(t('ty_docsH'))}</p></details>
    <div class="fp-acts">${[['taxrefund', 'tab_taxrefund'], ['tax', 'tab_tax'], ['selfemp', 'tab_selfemp'], ['dualinc', 'tab_dualinc']].map(([g, l]) => `<button type="button" class="as-chip" data-fpgo="${g}">${E(t(l))}</button>`).join('')}</div>`;
}
CALC.taxyears = function(){
  if (!document.querySelector('#ty_box .lc-card')) tyRender(true);
  const n = x => x === '' || x == null ? 0 : +x || 0;
  const L = tyList().filter(o => +o.y).slice().sort((a, b) => b.y - a.y), rows = [], warn = [];
  const tr = L.map((o, i) => { const g = n(o.gross) + n(o.other), p = n(o.paid), pr = L[i + 1], pg = pr ? n(pr.gross) + n(pr.other) : 0;
    return [String(o.y), M(g), M(p), g > 0 ? PC(p / g * 100) : '—', pg > 0 ? (g >= pg ? '+' : '−') + PC(Math.abs(g - pg) / pg * 100) : '—']; });
  let est = null; const cy = L.find(o => +o.y === F10_TAXYEAR && n(o.gross) > 0);
  if (cy){ try { const r = withVals({tr_gross: n(cy.gross) + n(cy.other), tr_paid: n(cy.paid), tr_pts: n(cy.pts) || 2.25, tr_don: n(cy.don), tr_life: 0, tr_pens: n(cy.pens)}, () => calcTaxRefund()); est = r; } catch (e) {} }
  L.filter(o => +o.y !== F10_TAXYEAR && n(o.gross) > 0).forEach(o => warn.push(t('ty_wYear', {y: o.y, b: F10_TAXYEAR})));
  if (L.some(o => +o.y < new Date().getFullYear() - 6)) warn.push(t('ty_w6'));
  if (est) rows.push([t('ty_estY', {y: F10_TAXYEAR}), est.hero.value, 'key'], [t('r_trDue'), (est.rows.find(r => r[0] === t('r_trDue')) || ['', '—'])[1]]);
  L.slice(0, 1).forEach(o => rows.push([t('ty_lastY', {y: o.y}), M(n(o.gross) + n(o.other))]));
  const tot = L.reduce((s, o) => s + n(o.paid), 0); if (tot) rows.push([t('ty_paidAll', {n: L.length}), M(tot)]);
  return {hero: est ? {label: t('ty_hero', {y: F10_TAXYEAR}) + ' · ' + est.hero.label, value: est.hero.value, sub: t('ty_heroSub')} : {label: t('ty_heroNo'), value: N(L.filter(o => n(o.gross) > 0).length, 0), sub: t('ty_heroNoS', {y: F10_TAXYEAR})},
    rows, warn, note: t('ty_note'), table: L.length ? {title: t('ty_tblT'), open: true, head: [t('ty_year'), t('ty_gross'), t('ty_paid'), t('ty_eff'), t('ty_chg')], rows: tr} : null};
};

/* ================= 7. life planning: more events, against no events, saved plans ================= */
Object.assign(LP_EV, {drop: ['📉', {pct: 20, years: 1}], exprise: ['🧾', {amt: 1000}], rateup: ['🔺', {debt: 800000, rate: 4.5, pts: 1, left: 20}], ratedown: ['🔻', {debt: 800000, rate: 4.5, pts: -1, left: 20}],
  mort: ['🏦', {amt: 500000, rate: 4.5, left: 25}], loanoff: ['✂️', {bal: 50000, pay: 1500, left: 3}], lump: ['💰', {amt: 50000, iret: 6}], depup: ['➕', {amt: 1000, iret: 6}]});
const LP_UNIT = {pct: '%', rate: '%', pts: '%', iret: '%', years: '', lose: '', left: '', year: ''};
lpEvRow = function(e, i){
  const E = lpE, P = LP_EV[e.k][1], f = (k, unit) => `<label class="bk-f"><span>${E(t('lp_f_' + k))}${unit ? ' (' + unit + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" data-lpe="${i}" data-lpk="${k}" value="${E(e[k] == null ? P[k] : e[k])}"></label>`;
  return `<li class="rm-it"><div class="rm-ic" aria-hidden="true">${LP_EV[e.k][0]}</div><div class="rm-b"><b>${E(t('lp_e_' + e.k))}</b><div class="bk-grid">${f('year')}${Object.keys(P).map(k => f(k, k in LP_UNIT ? LP_UNIT[k] : '₪')).join('')}</div>
    <div class="rm-acts"><button type="button" class="px-tb s" data-lpdel="${i}" aria-label="${E(t('lp_del', {n: t('lp_e_' + e.k)}))}">🗑️</button></div></div></li>`;
};
const lpPmt = (P, r, n) => { const i = r / 1200, m = Math.max(1, Math.round(n * 12)); return P > 0 ? (i ? P * i / (1 - Math.pow(1 + i, -m)) : P / m) : 0; };
lpProject = function(evOverride){
  const d = lpD(), B = lpBase(), yrs = Math.max(1, Math.min(40, Math.round(lpV('yrs', 15)))), r = lpV('ret', 4) / 100, g = lpV('grow', 2) / 100, EV = evOverride || d.ev;
  let inc = lpV('inc', B.inc), exp = lpV('exp', B.exp), sav = lpV('sav', B.sav), pot = 0; const rows = [], y0 = new Date().getFullYear();
  for (let y = 1; y <= yrs; y++){
    let incY = inc * 12 * Math.pow(1 + g, y - 1), expY = exp * 12 * Math.pow(1 + g * 0.8, y - 1), once = 0, toPot = 0, potR = 0; const notes = [];
    EV.forEach(e => { if (!LP_EV[e.k]) return; const P = Object.assign({}, LP_EV[e.k][1], e), at = Math.round(+P.year || 1), N1 = k => +P[k] || 0, mark = () => { if (y === at) notes.push(LP_EV[e.k][0]); };
      if (e.k === 'baby' && y >= at && y < at + N1('years')){ expY += N1('cost') * 12; if (y === at){ incY -= inc * N1('lose') * 0.25; notes.push('👶'); } }
      if (e.k === 'home' && y === at){ once -= N1('down'); notes.push('🏠'); } if (e.k === 'home' && y >= at && y < at + N1('years')) expY += N1('pay') * 12;
      if (e.k === 'job' && y >= at){ incY *= 1 + N1('pct') / 100; if (y === at) notes.push('💼'); }
      if (e.k === 'car' && y === at){ once -= N1('price'); notes.push('🚗'); } if (e.k === 'car' && y >= at) expY += N1('cost') * 12;
      if (e.k === 'study' && y >= at && y < at + N1('years')){ incY *= 1 - N1('pct') / 100; expY += N1('cost') * 12; if (y === at) notes.push('🎓'); }
      if (e.k === 'retire' && y >= at){ incY *= N1('pct') / 100; if (y === at) notes.push('🌴'); }
      if (e.k === 'move' && y === at){ once -= N1('cost'); notes.push('🚚'); } if (e.k === 'move' && y >= at) expY += N1('diff') * 12;
      if (e.k === 'drop' && y >= at && y < at + Math.max(1, N1('years'))){ incY *= 1 - N1('pct') / 100; mark(); }
      if (e.k === 'exprise' && y >= at){ expY += N1('amt') * 12; mark(); }
      if ((e.k === 'rateup' || e.k === 'ratedown') && y >= at && y < at + N1('left')){ expY += (lpPmt(N1('debt'), N1('rate') + N1('pts'), N1('left')) - lpPmt(N1('debt'), N1('rate'), N1('left'))) * 12; mark(); }
      if (e.k === 'mort'){ if (y === at) once += N1('amt'); if (y >= at && y < at + N1('left')) expY += lpPmt(N1('amt'), N1('rate'), N1('left')) * 12; mark(); }
      if (e.k === 'loanoff'){ if (y === at) once -= N1('bal'); if (y >= at && y < at + N1('left')) expY -= N1('pay') * 12; mark(); }
      if (e.k === 'lump'){ if (y === at){ once -= N1('amt'); toPot += N1('amt'); } potR = Math.max(potR, N1('iret') / 100); mark(); }
      if (e.k === 'depup' && y >= at){ expY += N1('amt') * 12; toPot += N1('amt') * 12; potR = Math.max(potR, N1('iret') / 100); mark(); } });
    sav = sav * (1 + (sav > 0 ? r : 0)) + incY - expY + once;
    pot = pot * (1 + (potR || r)) + toPot;
    rows.push({y: y0 + y, inc: incY, exp: expY, once, sav: sav + pot, notes});
  }
  return rows;
};
const lpSimOut10 = lpSimOut;
lpSimOut = function(){
  lpSimOut10.apply(this, arguments);
  try {
    const box = document.getElementById('lp_out'), d = lpD(); if (!box) return;
    const E = lpE, A = lpProject(), Z = lpProject([]), a = A[A.length - 1], z = Z[Z.length - 1];
    const first = A.findIndex(r => r.notes.length), fi = first < 0 ? 0 : first, cf = (A[fi].inc - A[fi].exp - (Z[fi].inc - Z[fi].exp)) / 12;
    const goal = (d.goals || []).reduce((s, g2) => s + (+g2.target || 0), 0), gy = R => { const r = R.find(q => q.sav >= goal); return r ? r.y : '—'; };
    let h = '';
    if (d.ev.length){ const df = a.sav - z.sav, row = (l, w, o, df2) => `<li><b>${E(l)}</b><span>${E(t('lf_with'))}: <bdi dir="ltr">${E(w)}</bdi> · ${E(t('lf_without'))}: <bdi dir="ltr">${E(o)}</bdi>${df2 ? ` · ${E(t('lf_diff'))}: <bdi dir="ltr">${E(df2)}</bdi>` : ''}</span></li>`;
      h += `<div class="lp-cmp"><h3 class="ds-q">${E(t('lf_cmpT'))}</h3><ul class="lf-l">
      ${row(t('lp_end', {y: a.y}), lpM(a.sav), lpM(z.sav), (df >= 0 ? '+' : '−') + lpM(Math.abs(df)) + (z.sav ? ' (' + (df >= 0 ? '+' : '−') + PC(Math.abs(df / z.sav * 100)) + ')' : ''))}
      ${row(t('lf_cf', {y: A[fi].y}), lpM((A[fi].inc - A[fi].exp) / 12), lpM((Z[fi].inc - Z[fi].exp) / 12), (cf >= 0 ? '+' : '−') + lpM(Math.abs(cf)))}
      ${goal > 0 ? row(t('lf_goal', {g: lpM(goal)}), String(gy(A)), String(gy(Z)), '') : ''}</ul></div>`; }
    const S = Array.isArray(d.saved) ? d.saved : [];
    h += `<div class="lp-save"><h3 class="ds-q">${E(t('lf_saveT'))}</h3><div class="btnrow"><input type="text" id="lf_name" maxlength="30" dir="auto" placeholder="${E(t('lf_namePh'))}" aria-label="${E(t('lf_namePh'))}"><button type="button" class="gold-btn" id="lf_save">${E(t('lf_save'))}</button></div>
      ${S.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${E(t('lf_endS'))}</th><th>${E(t('lf_low'))}</th><th></th></tr></thead><tbody>${S.map((s, i) => { const R = lpProject(s.ev), e2 = R[R.length - 1], lo = R.reduce((m, r) => Math.min(m, r.sav), Infinity);
        return `<tr><td><b>${E(s.n)}</b><small class="wi-sm">${E(new Date(s.at).toLocaleDateString())}</small></td><td>${E(lpM(e2.sav))}</td><td class="${lo < 0 ? 'down' : ''}">${E(lpM(lo))}</td><td class="lf-b"><button type="button" class="as-chip" data-lfload="${i}">${E(t('sva_open'))}</button><button type="button" class="as-chip" data-lfdup="${i}">${E(t('lf_dup'))}</button><button type="button" class="as-chip" data-lfdel="${i}" aria-label="${E(t('lp_del', {n: s.n}))}">✕</button></td></tr>`; }).join('')}</tbody></table></div><p class="fine">${E(t('lf_saveH'))}</p>` : ''}</div>`;
    box.insertAdjacentHTML('beforeend', h);
  } catch (e) {}
};
document.addEventListener('click', e => {
  if (!e.target.closest) return; let b; const d = () => lpD(), sv = () => (Array.isArray(lpD().saved) ? lpD().saved : (lpD().saved = []));
  if (e.target.closest('#lf_save')){ const n = (document.getElementById('lf_name').value || '').trim() || t('lf_def', {n: sv().length + 1}); sv().unshift({n: n.slice(0, 30), at: Date.now(), v: JSON.parse(JSON.stringify(d().v)), ev: JSON.parse(JSON.stringify(d().ev))}); sv().splice(12); try { saveSet(); } catch (er) {} lpSimOut(); try { toast(t('lf_saved', {x: n})); } catch (er) {} return; }
  if ((b = e.target.closest('[data-lfload]'))){ const s = sv()[+b.dataset.lfload]; if (!s) return; d().v = JSON.parse(JSON.stringify(s.v)); d().ev = JSON.parse(JSON.stringify(s.ev)); try { saveSet(); lpRender(); } catch (er) {} try { toast(t('sva_loaded', {x: s.n})); } catch (er) {} return; }
  if ((b = e.target.closest('[data-lfdup]'))){ const s = sv()[+b.dataset.lfdup]; if (!s) return; sv().unshift(Object.assign(JSON.parse(JSON.stringify(s)), {n: t('lf_copy', {x: s.n}).slice(0, 30), at: Date.now(), rid: ''})); sv().splice(12); try { saveSet(); } catch (er) {} lpSimOut(); return; }
  if ((b = e.target.closest('[data-lfdel]'))){ sv().splice(+b.dataset.lfdel, 1); try { saveSet(); } catch (er) {} lpSimOut(); return; }
});

/* ================= 8. the financial journal ================= */
const JR_K = ['decision', 'event', 'goal', 'note'];
var JRQ = '', JRF = '';
function jrList(){ if (!Array.isArray(SET.jrList)) SET.jrList = []; return SET.jrList; }
function jrRender(force){
  const box = document.getElementById('jr_box'); if (!box) return;
  if (!force && box.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.matches('#jr_q')) return;
  const E = asEsc, L = jrList(), q = JRQ.trim().toLowerCase();
  const F = L.map((x, i) => [x, i]).filter(([x]) => (!JRF || x.k === JRF) && (!q || ((x.title || '') + ' ' + (x.note || '')).toLowerCase().includes(q))).sort((a, b) => String(b[0].d).localeCompare(String(a[0].d)) || b[0].at - a[0].at);
  const top = `<div class="lc-card jr-new"><div class="fields">
      <div class="field"><label for="jr_d">${E(t('jr_date'))}</label><div class="control"><input id="jr_d" type="date" value="${todayIso()}"></div></div>
      <div class="field"><label for="jr_k">${E(t('jr_kind'))}</label><div class="control"><select id="jr_k">${JR_K.map(k => `<option value="${k}">${E(t('jr_k_' + k))}</option>`).join('')}</select></div></div>
      <div class="field wide"><label for="jr_t">${E(t('jr_title'))}</label><div class="control"><input id="jr_t" type="text" maxlength="80" dir="auto" placeholder="${E(t('jr_titlePh'))}"></div></div>
      <div class="field"><label for="jr_a">${E(t('jr_amt'))}</label><div class="control"><input id="jr_a" type="number" inputmode="decimal" step="any">${unitHTML('cur')}</div></div>
      <div class="field wide"><label for="jr_n">${E(t('jr_note'))}</label><div class="control"><input id="jr_n" type="text" maxlength="200" dir="auto"></div></div>
    </div><button type="button" class="gold-btn" id="jr_add">＋ ${E(t('jr_add'))}</button></div>`;
  const filt = `<div class="jr-f"><input type="search" id="jr_q" placeholder="${E(t('jr_search'))}" aria-label="${E(t('jr_search'))}" value="${E(JRQ)}"><select id="jr_fk" aria-label="${E(t('jr_kind'))}"><option value="">${E(t('jr_all'))}</option>${JR_K.map(k => `<option value="${k}"${JRF === k ? ' selected' : ''}>${E(t('jr_k_' + k))}</option>`).join('')}</select></div>`;
  const list = F.length ? `<ul class="al-list">${F.map(([x, i]) => `<li class="al-it"><span class="al-dot" aria-hidden="true">${{decision: '⚖️', event: '📌', goal: '🎯', note: '📝'}[x.k] || '📝'}</span><span class="al-tx"><b>${E(x.title)}</b>${x.amt ? ' · <span class="num">' + E(M(+x.amt)) + '</span>' : ''}<small class="wi-sm">${E(x.d ? new Date(x.d).toLocaleDateString() : '')} · ${E(t('jr_k_' + x.k))}${x.note ? ' · ' + E(x.note) : ''}</small></span><span class="al-b"><button type="button" class="as-chip" data-jrdel="${i}" aria-label="${E(t('lp_del', {n: x.title}))}">✕</button></span></li>`).join('')}</ul>`
    : `<p class="al-none">${E(t(L.length ? 'sva_none' : 'jr_empty'))}</p>`;
  if (force || !box.querySelector('.jr-new')) box.innerHTML = top + filt + `<div class="jr-l">${list}</div>`; else box.querySelector('.jr-l').innerHTML = list;
}
CALC.finjournal = function(){
  if (!document.querySelector('#jr_box .jr-new')) jrRender(true);
  const L = jrList(), y = String(new Date().getFullYear()), rows = JR_K.map(k => [t('jr_k_' + k), N(L.filter(x => x.k === k).length, 0)]);
  const amt = L.filter(x => String(x.d).startsWith(y) && x.k === 'decision').reduce((s, x) => s + (+x.amt || 0), 0); if (amt) rows.push([t('jr_amtY', {y}), M(amt)]);
  return {hero: {label: t('jr_hero'), value: N(L.length, 0), sub: t('jr_sub', {n: L.filter(x => String(x.d).startsWith(y)).length, y})}, rows, note: t('jr_noteR')};
};
document.addEventListener('input', e => { const el = e.target; if (el && el.id === 'jr_q'){ JRQ = el.value; jrRender(); } }, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.id === 'jr_fk'){ JRF = el.value; jrRender(); } });
document.addEventListener('click', e => {
  if (!e.target.closest) return; let b;
  if (e.target.closest('#jr_add')){ const ti = (document.getElementById('jr_t').value || '').trim(); if (!ti){ document.getElementById('jr_t').focus(); return; }
    jrList().push({id: Date.now().toString(36), at: Date.now(), d: document.getElementById('jr_d').value || todayIso(), k: document.getElementById('jr_k').value, title: ti.slice(0, 80), amt: document.getElementById('jr_a').value, note: (document.getElementById('jr_n').value || '').slice(0, 200)});
    try { saveSet(); } catch (er) {} jrRender(true); try { calc('finjournal'); toast(t('jr_added')); } catch (er) {} return; }
  if ((b = e.target.closest('[data-jrdel]'))){ jrList().splice(+b.dataset.jrdel, 1); try { saveSet(); } catch (er) {} jrRender(true); try { calc('finjournal'); } catch (er) {} return; }
});

/* ================= 9. my financial report – 10 kinds ================= */
const MR_TYPES = ['full', 'pic', 'mbud', 'ybud', 'nw', 'pf', 'pen', 'loans', 'goals', 'scn'];
const calcMr10 = CALC.myreport;
CALC.myreport = function(){
  const ty = (document.getElementById('mr_type') || {}).value || 'full';
  if (ty === 'full'){ const r = calcMr10.apply(this, arguments); try { const D = fpData(); if (D.free != null) r.table && r.table.rows.splice(0, 0, [t('mr_tPic'), t('fp_free'), (D.free < 0 ? '−' : '') + M(Math.abs(D.free))]); (D.goals || []).forEach(g => r.table && r.table.rows.push([t('mr_tGoals'), g.n, M(g.sv) + ' / ' + M(g.tg)])); } catch (e) {} return r; }
  const D = fpData(), rows = [], tbl = [], ym = ymOf(new Date()); let hero = null, head = ['', ''];
  const add = (a, b) => tbl.push([a, b]);
  if (ty === 'pic'){ const r = CALC.fpic(); hero = r.hero; r.rows.forEach(x => add(x[0], x[1])); }
  else if (ty === 'mbud'){ const tot = expTotals(ym, 'cat'), B = expData().budgets || {}; head = [t('mr_hSec'), t('bi_spent'), t('bi_plan')]; EXP_CATS.map(c => c[0]).filter(c => tot.by[c] || B[c]).forEach(c => tbl.push([t('ec_' + c), M(tot.by[c] || 0), B[c] ? M(+B[c]) : '—'])); hero = {label: t('mr_spendNow'), value: M(tot.sum), sub: D.inc ? t('mr_incOf', {v: M(D.inc)}) : ''}; }
  else if (ty === 'ybud'){ const y = new Date().getFullYear(); head = [t('mr_month'), t('fp_exp'), t('fp_inc')]; let s = 0, si = 0; for (let m = 1; m <= new Date().getMonth() + 1; m++){ const k = y + '-' + String(m).padStart(2, '0'), e2 = expTotals(k, 'cat').sum, i2 = expIncome(k); s += e2; si += i2 && i2.v > 0 ? +i2.v : 0; tbl.push([k, M(e2), i2 && i2.v > 0 ? M(+i2.v) : '—']); } hero = {label: t('mr_yrSpend', {y}), value: M(s), sub: si ? t('mr_incOf', {v: M(si)}) : ''}; }
  else if (ty === 'nw'){ if (D.parts) [['nw_cash', 'f_nwCash'], ['nw_inv', 'f_nwInv'], ['nw_pen', 'f_nwPen'], ['nw_prop', 'f_nwProp'], ['nw_oa', 'f_nwOa'], ['nw_mort', 'f_nwMort'], ['nw_loan', 'f_nwLoan'], ['nw_card', 'f_nwCard'], ['nw_ol', 'f_nwOl']].forEach(([k, l]) => { if (D.parts[k]) add(t(l), M(D.parts[k])); });
    if (D.a != null){ add(t('mr_assets'), M(D.a)); add(t('mr_debts'), M(D.l)); } hero = {label: t('mr_nw'), value: D.a != null ? M(D.a - D.l) : '—', sub: t(D.a != null ? 'mr_sub' : 'mr_empty')}; }
  else if (ty === 'pf'){ const p = pfD(), tot = D.hold || 0; head = [t('pf_hName'), t('pa_val'), t('pa_w')]; p.hold.forEach(x => { const v2 = f10Hold(x); if (v2 > 0) tbl.push([x.name || x.sym || t('pf_h_' + (x.type || 'other')), M(v2), PC(tot ? v2 / tot * 100 : 0)]); }); Object.keys(D.savBy || {}).forEach(k => tbl.push([t('pf_s_' + k), M(D.savBy[k]), ''])); hero = {label: t('fp_hold'), value: M(tot), sub: D.sav ? t('mr_savOf', {v: M(D.sav)}) : ''}; }
  else if (ty === 'pen'){ const p = pfD(); p.sav.filter(x => ['pension', 'hish', 'gemel'].includes(x.type)).forEach(x => add((x.name || t('pf_s_' + x.type)) + (pfN(x.fee) ? ' · ' + t('mr_fee', {p: N(pfN(x.fee), 2)}) : ''), M(pfN(x.bal) || 0))); if (f10Touched('retire')){ add(t('f_rtAge') + ' / ' + t('f_rtRet'), N(vOf('rt_age'), 0) + ' / ' + N(vOf('rt_ret'), 0)); add(t('f_rtDep'), M(vOf('rt_dep'))); add(t('f_rtNeed'), M(vOf('rt_need'))); } hero = {label: t('fp_pen'), value: M(D.pen || 0), sub: t('mr_penSub')}; }
  else if (ty === 'loans'){ if (D.parts) [['nw_mort', 'f_nwMort'], ['nw_loan', 'f_nwLoan'], ['nw_card', 'f_nwCard'], ['nw_ol', 'f_nwOl']].forEach(([k, l]) => { if (D.parts[k]) add(t(l), M(D.parts[k])); }); if (f10Touched('loan')){ add(t('tab_loan') + ' · ' + t('f_loanAmt'), M(vOf('l_amount'))); add(t('tab_loan') + ' · ' + t('f_rate'), N(vOf('l_rate'), 2) + '%'); } if (f10Touched('mortgage')) add(t('tab_mortgage') + ' · ' + t('mr_mortAmt'), M(Math.max(0, vOf('m_price') - vOf('m_down')))); hero = {label: t('mr_debts'), value: D.a != null ? M(D.l) : M((D.loans || 0) + (D.mort || 0)), sub: ''}; }
  else if (ty === 'goals'){ add(t('fp_em'), t('fp_emOf', {h: M(D.liq || 0), g: M(D.emT)})); (D.goals || []).forEach(g => add(g.n, M(g.sv) + ' / ' + M(g.tg) + ' (' + PC(g.sv / g.tg * 100) + ')')); hero = {label: t('fp_goals'), value: N((D.goals || []).length, 0), sub: ''}; }
  else if (ty === 'scn'){ head = [t('mr_calc'), t('sc_main'), '']; Object.keys(SCN || {}).forEach(id => (SCN[id] || []).forEach(s => tbl.push([t('tab_' + id) + ' · ' + s.n, s.hero && s.hero.value || '—', s.at ? new Date(s.at).toLocaleDateString() : '']))); hero = {label: t('mr_scn'), value: N(tbl.length, 0), sub: ''}; }
  tbl.slice(0, 6).forEach(r => rows.push([r[0], r[1]]));
  return {hero: hero || {label: t('mr_t_' + ty), value: '—', sub: ''}, rows, note: t('mr_note'), table: tbl.length ? {title: t('mr_t_' + ty), open: true, head, rows: tbl} : null};
};

/* ---- wiring ---- */
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-fpgo]'); if (b){ try { activate(b.dataset.fpgo); } catch (er) {} } });
document.addEventListener('click', e => {
  if (!e.target.closest) return; let b;
  if ((b = e.target.closest('[data-witor]'))){ wiTornado(b.dataset.witor); return; }
  if ((b = e.target.closest('[data-wiseek]'))){ wiSeek(b.dataset.wiseek); return; }
  if ((b = e.target.closest('[data-wiapply]'))){ const [fid, val] = b.dataset.wiapply.split('|'), el = document.getElementById(fid); if (!el) return; el.value = String(+(+val).toFixed(fid && f10Def(fid) && f10Def(fid).unit === '%' ? 3 : 0)); el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); return; }
  if (e.target.closest('#ty_add')){ const L = tyList(); if (L.length < 8){ const ys = L.map(o => +o.y || 0); L.push({y: Math.min(...ys) - 1}); try { saveSet(); } catch (er) {} tyRender(true); try { calc('taxyears'); } catch (er) {} } return; }
  if ((b = e.target.closest('[data-tydel]'))){ const L = tyList(); if (L.length > 1){ L.splice(+b.dataset.tydel, 1); try { saveSet(); } catch (er) {} tyRender(true); try { calc('taxyears'); } catch (er) {} } return; }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.dataset) return;
  if (el.dataset.tyk != null && el.closest('#ty_box')){ const o = tyList()[+el.dataset.tyi]; if (!o) return; o[el.dataset.tyk] = el.value; clearTimeout(SET.__tyT); SET.__tyT = setTimeout(() => { try { delete SET.__tyT; saveSet(); } catch (er) {} }, 400); try { calc('taxyears'); } catch (er) {} }
}, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.tydoc){ const D = SET.tyDocs || (SET.tyDocs = {}); if (el.checked) D[el.dataset.tydoc] = 1; else delete D[el.dataset.tydoc]; try { saveSet(); } catch (er) {} } });
(function(){
  const cxf10 = cxSensFill;
  cxSensFill = function(id){ const r = cxf10.apply(this, arguments); try { if (!WI_BUSY) wiMount(id); } catch (e) {} return r; };
  const act10 = activate;
  activate = function(id){ const r = act10.apply(this, arguments);
    try { if (id === 'fpic') calc('fpic'); else if (id === 'taxyears'){ tyRender(true); calc('taxyears'); } else if (id === 'finjournal'){ jrRender(true); calc('finjournal'); } } catch (e) {} return r; };
  const er10 = expRender;
  expRender = function(){ const r = er10.apply(this, arguments); try { exBudCard(); } catch (e) {} return r; };
  const al10 = applyLang;
  applyLang = function(){ const r = al10.apply(this, arguments); try { tyRender(); jrRender(true); } catch (e) {} return r; };
  const st = document.createElement('style');
  st.textContent = '.tbl-wrap{overflow-x:auto;max-width:100%}:is(.pa,.ex-inc,.wi,.lp-cmp,.lp-save,#ty_box) .tbl{font-size:.82rem}:is(.pa,.ex-inc) .tbl :is(td,th){padding-inline:4px}.wi .tbl td,.wi .tbl th{white-space:normal}#panel-fpic .scn,#panel-taxyears .scn,#panel-finjournal .scn{display:none}'
    + '.fp-acts{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}.fp-ie{display:flex;gap:6px;align-items:flex-end;height:120px;padding:6px 0;border-bottom:1px solid var(--line)}'
    + '.fp-m{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;min-width:0}.fp-cols{flex:1;width:100%;display:flex;gap:2px;align-items:flex-end;justify-content:center}'
    + '.fp-cols i{display:block;width:40%;max-width:18px;border-radius:4px 4px 0 0;min-height:1px}.fp-cols i.in,.fp-leg .in{background:var(--gold)}.fp-cols i.ex,.fp-leg .ex{background:var(--ink-2)}.fp-m small{font-size:11px;color:var(--ink-2)}'
    + '.fp-leg{font-size:13px;color:var(--ink-2);display:flex;gap:6px;align-items:center}.fp-leg span{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-start:8px}'
    + '.fp-prog{list-style:none;margin:0;padding:0}.fp-prog li{padding:8px 0;border-top:1px solid var(--line)}.fp-pn{display:flex;justify-content:space-between;color:var(--ink)}.fp-prog small{color:var(--ink-2)}'
    + '.fp-bar{display:block;height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin:6px 0 2px}.fp-bar i{display:block;height:100%;background:var(--gold)}'
    + '.fp-src ul{list-style:none;margin:0;padding:0}.fp-src li{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;padding:6px 0;border-top:1px solid var(--line)}.fp-src li small{flex:1 1 60%;color:var(--ink-2)}'
    + '.bi-top{display:flex;gap:18px;margin:6px 0}.bi-top small{display:block;color:var(--ink-2)}.bi-top b{font-size:20px}.bi-s2 td{color:var(--bad,#c0392b)}.bi-s1 td:first-child::after{content:" •";color:var(--warn,#b45309)}'
    + '.up{color:var(--good,#1b8a4b)}.down{color:var(--bad,#c0392b)}[data-theme="dark"] .up{color:#5EE08F}[data-theme="dark"] :is(.down,.bi-s2 td){color:#FF8A80}'
    + '.wi{margin:12px 0 4px;padding-top:8px;border-top:1px solid var(--line);color:var(--ink)}.wi-sm{display:block;font-size:12px;color:var(--ink-2)}'
    + '.wi-seek{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}.wi-seek label{display:flex;flex-direction:column;gap:4px;flex:1 1 140px}.wi-seek select,.wi-seek input{width:100%;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--surface);color:var(--ink);font:inherit}.wi-sout{min-height:1.2em}'
    + '.pa{margin:8px 0;border:1px solid var(--line);border-radius:14px;padding:8px 12px;background:var(--surface)}.pa-bm{max-width:260px;margin-top:8px}'
    + '.ty-y{display:flex;gap:8px;align-items:center;flex:1}.ty-y input{width:90px;min-height:40px;border:1px solid var(--line);border-radius:10px;padding:6px 10px;background:var(--surface);color:var(--ink);font:inherit}.ty-docs{margin:10px 0}.jr-f{display:flex;gap:8px;margin:10px 0}.jr-f input{flex:1 1 auto;min-width:0;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--surface);color:var(--ink);font:inherit}.jr-f select{flex:0 0 36%;width:36%;min-height:44px}'
    + '.lp-cmp,.lp-save{margin-top:14px}.lf-l{list-style:none;margin:0;padding:0}.lf-l li{padding:8px 0;border-top:1px solid var(--line);color:var(--ink)}.lf-l b{display:block}.lf-l span{color:var(--ink-2);font-size:14px}.lp-save .btnrow input{flex:1;min-width:0}.lf-b{display:flex;gap:4px;flex-wrap:wrap}';
  document.head.appendChild(st);
})();
