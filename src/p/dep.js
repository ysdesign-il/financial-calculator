/* ---------- 13.74: deposits – every kind, and comparing deposit offers ----------
   Formulas (month by month, in the deposit's own units):
   • rate a month: the annual rate ÷ 12; "every day" credits (1 + r/365)^(365/12) − 1 a month, "every week" (1 + r/52)^(52/12) − 1;
     quarterly / yearly / at-the-end interest builds up on the credited balance and joins it only on those dates (simple in between).
   • variable: the rate moves by the expected change once a year (never below 0).
   • CPI-linked: the balance is linked every month by (1 + inflation)^(1/12); the interest is on the linked balance.
   • currency-linked: worked out in the currency; each month's deposit is converted at that month's expected rate.
   • structured: the return for the term = max(guaranteed, min(cap, share × index rise over the term)).
   • tax (estimate): 15% of the profit; CPI- and currency-linked: 25% of the real profit (profit beyond inflation); or exempt / your rate.
   • yearly returns: the money-weighted return (IRR) of the deposits and the final amount, as a yearly rate.
   • real value: the final amount in today's money, (1 + inflation)^(months/12); the real profit counts each deposit in today's money too.
   Money is rounded to 2 decimals on screen; a 0% rate is fine (nothing grows). */
const DK_LIQ = {fix: 'q_fix', var: 'q_var', cpi: 'q_cpi', fx: 'q_fx', exit: 'q_exit', call: 'q_call', struct: 'q_struct'};
const DK_KIND = {fix: 'o_dkFix', var: 'o_dkVar', cpi: 'o_dkCpi', fx: 'o_dkFx', exit: 'o_dkExit', call: 'o_dkCall', struct: 'o_dkStruct'};
const dkNum = x => { x = +x; return isFinite(x) ? x : 0; };
/* yearly rate from monthly cash flows (negative = put in, positive = taken out) */
function dkIrr(flows){
  const f = r => flows.reduce((s, c, i) => s + c / Math.pow(1 + r, i), 0);
  let lo = -0.99, hi = 1; if (f(lo) * f(hi) > 0) return NaN;
  for (let i = 0; i < 200; i++){ const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
}
/* the engine: o = {kind, amt, add, mo, rate, comp, cycle, chg, cpi, fx, every, exit, cut, smin, spart, sidx, scap, tax, taxp} */
function depSim(o){
  const kind = o.kind || 'fix', amt = Math.max(0, dkNum(o.amt)), cpi = dkNum(o.cpi) / 100, warn = [];
  let n = Math.round(clamp(dkNum(o.mo) || 1, 1, 600)), add = kind === 'struct' ? 0 : Math.max(0, dkNum(o.add)), rate = Math.max(0, dkNum(o.rate));
  if (kind === 'struct' && dkNum(o.add) > 0) warn.push(t('w_dkStructAdd'));
  let exitAt = 0;
  if (kind === 'exit'){
    const E = Math.max(1, Math.round(dkNum(o.every) || 1)), X = Math.round(Math.max(0, dkNum(o.exit)));
    if (X > 0 && X < n){ let X2 = Math.max(E, Math.floor(X / E) * E); if (X2 > n) X2 = n; if (X2 !== X) warn.push(t('w_dkSnap', {m: X2})); if (X2 < n){ exitAt = X2; n = X2; rate = Math.max(0, rate - Math.max(0, dkNum(o.cut))); } }
  }
  const comp = kind === 'call' ? (o.cycle || 'day') : kind === 'struct' ? 'end' : (o.comp || 'end');
  const ci = Math.pow(1 + cpi, 1 / 12) - 1, fxr = dkNum(o.fx) / 100, fxAt = m => kind === 'fx' ? Math.pow(1 + fxr, m / 12) : 1;
  const rAt = m => kind === 'var' ? Math.max(0, rate + dkNum(o.chg) * Math.floor((m - 1) / 12)) : rate;
  const deps = [[0, amt]]; for (let m = 1; m < n; m++) if (add > 0) deps.push([m, add]);
  const dep = deps.reduce((s, d) => s + d[1], 0);
  let finG, idx = 0, fxG = 0, worst = NaN;
  const bal = [];                                                  // gross value at the end of each month (in shekels)
  if (kind === 'struct'){
    const y = n / 12, idxTot = (Math.pow(1 + dkNum(o.sidx) / 100, y) - 1) * 100;
    const ret = Math.max(dkNum(o.smin), Math.min(dkNum(o.scap) || Infinity, dkNum(o.spart) / 100 * idxTot));
    finG = amt * (1 + ret / 100); worst = amt * (1 + dkNum(o.smin) / 100);
    for (let m = 1; m <= n; m++) bal.push(m === n ? finG : amt);
  } else {
    let b = 0, acc = 0, units = 0;
    const credit = comp === 'quarter' ? 3 : comp === 'year' ? 12 : comp === 'end' ? Infinity : 1;
    for (let m = 1; m <= n; m++){
      const d = deps.filter(x => x[0] === m - 1).reduce((s, x) => s + x[1], 0);
      if (d){ const u = d / fxAt(m - 1); b += u; units += u; }
      if (kind === 'cpi'){ idx += b * ci; b *= 1 + ci; acc *= 1 + ci; }   // the linkage counted on the balance; on interest not yet credited it is part of the interest
      const r = rAt(m) / 100;
      if (comp === 'day') b *= Math.pow(1 + r / 365, 365 / 12);
      else if (comp === 'week') b *= Math.pow(1 + r / 52, 52 / 12);
      else if (comp === 'month') b *= 1 + r / 12;
      else { acc += b * r / 12; if (m % credit === 0 || m === n){ b += acc; acc = 0; } }
      bal.push((b + acc) * fxAt(m));
    }
    finG = b * fxAt(n);
    if (kind === 'fx'){ const intU = b - units; fxG = finG - dep - intU * fxAt(n); }
  }
  const gross = finG - dep;
  /* inflation on what was put in: each deposit for the months it stayed */
  const infl = deps.reduce((s, [m, d]) => s + d * (Math.pow(1 + cpi, (n - m) / 12) - 1), 0);
  const tm = o.tax || 'auto';
  let tax = 0;
  if (tm === 'custom') tax = Math.max(0, gross) * Math.max(0, dkNum(o.taxp)) / 100;
  else if (tm === 'auto') tax = kind === 'cpi' ? Math.max(0, gross - idx) * 0.25 : kind === 'fx' ? Math.max(0, gross - infl) * 0.25 : Math.max(0, gross) * 0.15;
  const net = gross - tax, fin = dep + net;
  const flows = (g) => { const f = new Array(n + 1).fill(0); deps.forEach(([m, d]) => { f[m] -= d; }); f[n] += g; return f; };
  const ear = dkIrr(flows(finG)), netAnn = dkIrr(flows(fin));
  const disc = Math.pow(1 + cpi, n / 12), real = fin / disc;
  const depToday = deps.reduce((s, [m, d]) => s + d / Math.pow(1 + cpi, m / 12), 0), realG = real - depToday;
  const realAnn = isFinite(netAnn) ? ((1 + netAnn / 100) / (1 + cpi) - 1) * 100 : NaN;
  if (rate === 0 && kind !== 'struct' && kind !== 'fx' && !(kind === 'var' && dkNum(o.chg) > 0)) warn.push(t('w_dkZero'));
  else if (real < depToday - 0.005) warn.push(t('w_dkNegReal'));
  return {kind, n, exitAt, rate, comp, dep, finG, gross, idx, fxG, tax, net, fin, ear, netAnn, real, realG, realAnn, worst, bal, deps, warn};
}
const dkRateTxt = s => s.kind === 'struct' ? t('r_dkRateSt') : s.kind === 'cpi' ? t('r_dkRateCpi', {r: PC(s.rate)}) : s.kind === 'fx' ? t('r_dkRateFx', {r: PC(s.rate)}) : s.kind === 'var' ? t('r_dkRateVar', {r: PC(s.rate)}) : PC(s.rate);
const dkLiqTxt = (kind, cycle) => kind === 'call' ? t('q_call', {c: t({day: 'o_dkDay', week: 'o_dkWeek', month: 'o_dkMonth'}[cycle || 'day'] || 'o_dkDay')}) : t(DK_LIQ[kind] || 'q_fix');
function dkBoiNote(){
  try { if (typeof MKT === 'object' && MKT && +MKT.boi > 0) return ' ' + t('n_dkBoi', {r: PC(+MKT.boi), d: MKT.boiDate || '—'}); } catch (e) {}
  return '';
}
CALC.deposit = function(){
  const sel = id => (document.getElementById(id) || {}).value;
  const kind = sel('dk_kind') || 'fix', cycle = sel('dk_cycle') || 'day';
  const s = depSim({kind, amt: v('dk_amt'), add: v('dk_add'), mo: v('dk_mo'), rate: v('dk_rate'), comp: sel('dk_comp') || 'end', cycle, chg: v('dk_chg'),
    cpi: v('dk_cpi'), fx: v('dk_fx'), every: v('dk_every'), exit: v('dk_exit'), cut: v('dk_cut'), smin: v('dk_smin'), spart: v('dk_spart'), sidx: v('dk_sidx'), scap: v('dk_scap'),
    tax: sel('dk_tax') || 'auto', taxp: v('dk_taxp')});
  const rows = [[t('r_dkDep'), M(s.dep, 2)], [t('r_dkRate'), dkRateTxt(s)], [t('r_dkTerm'), fmtDur(s.n)]];
  if (s.exitAt) rows.push([t('r_dkExitAt'), fmtDur(s.exitAt)]);
  rows.push([t('r_dkGross'), M(s.gross, 2)]);
  if (Math.abs(s.idx) > 0.005) rows.push([t('r_dkIdx'), M(s.idx, 2)]);
  if (Math.abs(s.fxG) > 0.005) rows.push([t('r_dkFxG'), M(s.fxG, 2)]);
  rows.push([t('r_dkTax'), M(-s.tax, 2)], [t('r_dkNet'), M(s.net, 2), 'key'], [t('r_dkFin'), M(s.fin, 2), 'key'],
    [t('r_dkEar'), PC(s.ear)], [t('r_dkNetAnn'), PC(s.netAnn)], [t('r_dkReal'), M(s.real, 2)], [t('r_dkRealG'), M(s.realG, 2)], [t('r_dkRealAnn'), PC(s.realAnn)]);
  if (isFinite(s.worst)) rows.push([t('r_dkMin'), M(s.worst, 2)]);
  rows.push([t('r_dkLiq'), dkLiqTxt(kind, cycle)]);
  const out = {hero: {label: t('r_dkFin'), value: M(s.fin, 2), sub: t('r_dkSub', {n: M(s.net, 2), y: PC(s.netAnn)})}, rows, warn: s.warn,
    note: t('n_dk') + dkBoiNote() + ' ' + t('n_dkGoal')};
  if (s.n >= 24 && kind !== 'struct'){
    const Y = Math.floor(s.n / 12), lab = [], dv = [], iv = [];
    for (let y = 1; y <= Y; y++){ const m = y * 12, put = s.deps.filter(d => d[0] < m).reduce((a, d) => a + d[1], 0); lab.push(y); dv.push(put); iv.push(Math.max(0, s.bal[m - 1] - put)); }
    out.chart = {title: t('c_dkChart'), unit: t('w_year'), fmt: x => M(x), labels: lab,
      layers: [{name: t('l_dkDep'), cls: 'c-ink', values: dv}, {name: t('l_dkInt'), cls: 'c-warm', values: iv}]};
  }
  return out;
};

/* ---- comparing deposit offers: a list like the loan offers (up to 12), every offer on the same amount and assumptions ---- */
const DQ_MAX = 12;
const DQ_KINDS = ['fix', 'var', 'cpi', 'fx', 'call'];
const DQ_COMP = [['end', 'o_dkcEnd'], ['day', 'o_dkcDay'], ['month', 'o_dkcMonth'], ['quarter', 'o_dkcQ'], ['year', 'o_dkcYear']];
function dqList(){
  if (!Array.isArray(SET.dqOffers) || !SET.dqOffers.length) SET.dqOffers = [{n: '', kind: 'fix', rate: 4, mo: 12, comp: 'end'}, {n: '', kind: 'cpi', rate: 1.5, mo: 12, comp: 'end'}];
  return SET.dqOffers;
}
const dqName = (o, i) => String((o && o.n) || '').trim() || t('dq_def', {n: i + 1});
var DQ_T = null;
function dqSave(){ clearTimeout(DQ_T); DQ_T = setTimeout(() => { try { saveSet(); } catch (e) {} }, 300); }
function dqRender(force){
  const box = document.getElementById('dq_box'); if (!box) return;
  if (!force && box.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const E = asEsc, L = dqList();
  const opt = (list, cur) => list.map(([k, l]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${E(t(l))}</option>`).join('');
  box.innerHTML = L.map((o, i) => `<div class="lc-card" data-dqi="${i}">
      <div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span><input class="lc-name" type="text" maxlength="30" dir="auto" data-dqi="${i}" data-dqk="n" value="${E(o.n || '')}" placeholder="${E(t('dq_def', {n: i + 1}) + ' · ' + t('dq_namePh'))}" aria-label="${E(t('dq_name') + ' ' + (i + 1))}">
        ${L.length > 1 ? `<button type="button" class="lc-del" data-dqdel="${i}" aria-label="${E(t('dq_del', {x: dqName(o, i)}))}">✕</button>` : ''}</div>
      <div class="fields">
        <div class="field wide"><label for="dq_k${i}">${E(t('dq_kind'))}</label><div class="control"><select id="dq_k${i}" data-dqi="${i}" data-dqk="kind">${opt(DQ_KINDS.map(k => [k, DK_KIND[k]]), o.kind || 'fix')}</select></div></div>
        <div class="field"><label for="dq_r${i}">${E(t('dq_rate'))}</label><div class="control"><input id="dq_r${i}" type="number" inputmode="decimal" step="any" data-dqi="${i}" data-dqk="rate" value="${o.rate == null ? '' : o.rate}">${unitHTML('%')}</div></div>
        <div class="field"><label for="dq_m${i}">${E(t('dq_mo'))}</label><div class="control"><input id="dq_m${i}" type="number" inputmode="numeric" step="1" data-dqi="${i}" data-dqk="mo" value="${o.mo == null ? '' : o.mo}">${unitHTML('mo')}</div></div>
        <div class="field wide"><label for="dq_c${i}">${E(t('f_dkComp'))}</label><div class="control"><select id="dq_c${i}" data-dqi="${i}" data-dqk="comp">${opt(o.kind === 'call' ? [['day', 'o_dkDay'], ['week', 'o_dkWeek'], ['month', 'o_dkMonth']] : DQ_COMP, o.kind === 'call' ? (o.cycle || 'day') : (o.comp || 'end'))}</select></div></div>
      </div></div>`).join('') +
    (L.length < DQ_MAX ? `<button type="button" class="lc-add" id="dq_add"><span aria-hidden="true">＋</span> ${E(t('dq_add'))}</button>` : `<p class="fine">${E(t('dq_max', {n: DQ_MAX}))}</p>`) +
    `<p class="fine lc-hint">${E(t('dq_hint'))}</p>`;
  $$('[data-i]', box).forEach(el => { el.textContent = t(el.dataset.i); });
}
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.dqk == null || !el.closest('#dq_box')) return;
  const o = dqList()[+el.dataset.dqi]; if (!o) return;
  const k = el.dataset.dqk;
  if (k === 'n') o.n = el.value.slice(0, 30);
  else if (k === 'kind' || k === 'comp'){ if (k === 'comp' && o.kind === 'call') o.cycle = el.value; else o[k] = el.value; }
  else o[k] = el.value === '' ? 0 : +el.value;
  dqSave();
  if (k === 'kind'){ dqRender(true); const s = document.getElementById('dq_k' + el.dataset.dqi); if (s) s.focus(); }
  try { calc('depcmp'); } catch (er) {}
}, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.tagName === 'SELECT' && el.closest && el.closest('#dq_box')) el.dispatchEvent(new Event('input', {bubbles: true})); }, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#dq_add')){
    const L = dqList(); if (L.length >= DQ_MAX) return;
    L.push(Object.assign({}, L[L.length - 1] || {kind: 'fix', rate: 4, mo: 12, comp: 'end'}, {n: ''}));
    try { saveSet(); } catch (er) {} dqRender(true); try { calc('depcmp'); } catch (er) {}
    const ins = $$('#dq_box .lc-name'), n = ins[ins.length - 1]; if (n) n.focus();
    return;
  }
  const d = e.target.closest('[data-dqdel]');
  if (d){ const L = dqList(); if (L.length <= 1) return; L.splice(+d.dataset.dqdel, 1); try { saveSet(); } catch (er) {} dqRender(true); try { calc('depcmp'); } catch (er) {} const a = document.getElementById('dq_add') || $('#dq_box .lc-name'); if (a) a.focus(); }
});
CALC.depcmp = function(){
  if (!document.querySelector('#dq_box .lc-card')) dqRender();
  const base = {amt: v('dq_amt'), cpi: v('dq_cpi'), chg: v('dq_chg'), fx: v('dq_fx'), add: 0, tax: 'auto'};
  const L = dqList().map((o, i) => Object.assign(depSim(Object.assign({}, base, {kind: o.kind || 'fix', rate: o.rate, mo: o.mo, comp: o.comp || 'end', cycle: o.cycle || 'day'})), {name: asEsc(dqName(o, i)), cycle: o.cycle}));
  const same = L.every(s => s.n === L[0].n), score = s => same ? s.net : (isFinite(s.realAnn) ? s.realAnn : -Infinity);
  const S = L.slice().sort((a, b) => score(b) - score(a)), best = S[0], next = S[1];
  const warn = [];
  if (next && !same) warn.push(t('w_dqTerm'));
  if (new Set(L.map(s => s.kind)).size > 1) warn.push(t('w_dqMix'));
  const table = {title: t('t_dq'), open: true,
    head: ['', t('dq_kind'), t('r_dkRate'), t('r_dkTerm'), t('r_dkNet'), t('r_dkNetAnn'), t('r_dkRealAnn'), t('r_dkReal'), t('r_dkLiq')],
    rows: S.map(s => [(next && s === best ? '★ ' : '') + s.name, t(DK_KIND[s.kind]), dkRateTxt(s), fmtDur(s.n), M(s.net, 2), PC(s.netAnn), PC(s.realAnn), M(s.real, 2), dkLiqTxt(s.kind, s.cycle)])};
  const note = t('n_dq') + dkBoiNote();
  if (!next) return {hero: {label: t('r_dqOne'), value: M(best.fin, 2), sub: t('r_dkSub', {n: M(best.net, 2), y: PC(best.netAnn)})},
    rows: [[t('r_dkNet'), M(best.net, 2)], [t('r_dkRealAnn'), PC(best.realAnn)]], note, warn, table};
  return {hero: {label: t('r_dqBest', {x: best.name}), value: same ? M(best.net - next.net, 2) : PC(best.realAnn - next.realAnn),
      sub: t(same ? 'r_dqSubN' : 'r_dqSubA', {v: same ? M(best.net - next.net, 2) : PC(best.realAnn - next.realAnn), y: next.name})},
    rows: [[t('r_dkNet') + ' · ' + best.name, M(best.net, 2), 'key'], [t('r_dkNet') + ' · ' + next.name, M(next.net, 2)], [t('r_dkRealAnn') + ' · ' + best.name, PC(best.realAnn)]],
    note, warn, table};
};
(function(){
  const actDq = activate;
  activate = function(id){ const r = actDq.apply(this, arguments); try { if (id === 'depcmp'){ dqRender(); calc('depcmp'); } } catch (e) {} return r; };
  const alDq = applyLang;
  applyLang = function(){ const r = alDq.apply(this, arguments); try { dqRender(); } catch (e) {} return r; };
})();
