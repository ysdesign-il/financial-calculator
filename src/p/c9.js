/* ================= 8.5: loans by monthly payment, and prime + margin made clear ================= */
/* the interest: Bank of Israel rate + the prime spread (1.5% by convention) = prime; the bank then adds or takes off its own margin.
   Each part can be changed. The interest you pay is split between those parts, so it is clear what each costs. */
const calcLoan85 = CALC.loan;
function loanSolve(type, r, n, pay){            // the loan amount a monthly payment carries
  if (!(pay > 0)) return 0;
  if (type === 'bullet') return r > 0 ? pay / r : 0;
  if (type === 'equal') return pay / (1 / n + r);
  return r > 0 ? pay * (1 - Math.pow(1 + r, -n)) / r : pay * n;
}
function loanTerm(type, r, amt, pay){           // months to repay an amount with a monthly payment (NaN: never)
  if (!(pay > 0) || !(amt > 0)) return NaN;
  if (type === 'bullet') return NaN;
  if (type === 'equal'){ const first = amt * r; return pay > first ? amt / (pay - first) : NaN; }
  if (r <= 0) return amt / pay;
  return pay > amt * r ? -Math.log(1 - amt * r / pay) / Math.log(1 + r) : NaN;
}
/* the calculation borrows a field for a moment (the amount, the years or the rate it worked out) and gives back what you typed */
var LOAN_KEEP = [];
function loanSet(id, val){ const e = document.getElementById(id); if (e && isFinite(val)){ if (id !== 'l_boi' && !LOAN_KEEP.some(x => x[0] === id)) LOAN_KEEP.push([id, e.value]); e.value = String(Math.round(val * 100) / 100); } }
CALC.loan = function(){
  const mode = ($('#l_mode') || {}).value || 'pay', rt = ($('#l_rateType') || {}).value || 'fixed', type = ($('#l_type') || {}).value || 'annuity';
  /* the Bank of Israel rate follows the live figure until you type your own */
  const boiEl = $('#l_boi');
  if (boiEl && !boiEl.dataset.user && typeof MKT === 'object' && MKT.boi > 0 && Math.abs(v('l_boi') - MKT.boi) > 1e-9) loanSet('l_boi', MKT.boi);
  let parts = null;
  if (rt === 'prime'){
    const boi = v('l_boi'), spread = v('l_spread'), margin = v('l_margin'), prime = boi + spread, rate = Math.max(0, prime + margin);
    parts = {boi, spread, margin, prime, rate};
    loanSet('l_rate', rate);
  }
  const rate = Math.max(0, v('l_rate')), r = rate / 1200;
  let solved = null;
  if (mode === 'amount'){
    const n = Math.max(1, Math.round(clamp(v('l_years'), 0.25, 50) * 12)), pay = Math.max(0, v('l_pay'));
    const amt = loanSolve(type, r, n, pay); loanSet('l_amount', amt); solved = {k: 'amount', amt, pay, y: n / 12};
  } else if (mode === 'term'){
    const amt = Math.max(0, v('l_amount')), pay = Math.max(0, v('l_pay')), n = loanTerm(type, r, amt, pay);
    if (!isFinite(n)){
      const min = type === 'equal' ? amt / 600 + amt * r : amt * r;
      return {hero: {label: t('r_lTerm'), value: '—', sub: t('w_lPayLow', {m: M(min + 0.01, 2)})}, rows: [], warn: [t('w_lPayLow', {m: M(min + 0.01, 2)})], note: t('n_lMode')};
    }
    loanSet('l_years', Math.min(50, n / 12)); solved = {k: 'term', n: Math.ceil(n), pay, amt};
  }
  let res;
  try { res = calcLoan85.apply(this, arguments); }
  finally { LOAN_KEEP.forEach(([id, val]) => { const e = document.getElementById(id); if (e) e.value = val; }); LOAN_KEEP = []; }
  if (!res || !res.rows) return res;
  const top = [];
  if (solved && solved.k === 'amount'){
    res.hero = {label: t('r_lCanBorrow'), value: M(solved.amt), sub: t('r_lCanSub', {p: M(solved.pay, 2), y: N(solved.y, 1), r: PC(rate)})};
  } else if (solved && solved.k === 'term'){
    res.hero = {label: t('r_lTerm'), value: fmtDur(solved.n), sub: t('r_lTermSub', {p: M(solved.pay, 2), a: M(solved.amt)})};
  }
  if (parts){
    top.push([t('r_lBoi'), PC(parts.boi)], [t('r_lSpread'), '+' + PC(parts.spread)], [t('r_lPrime'), PC(parts.prime), 'key'],
      [t('r_lMargin'), (parts.margin >= 0 ? '+' : '') + PC(parts.margin)], [t('r_lYour'), PC(parts.rate), 'key']);
    /* the interest you pay, split by where it comes from */
    const totRow = res.rows.find(x => x[0] === t('r_totInt'));
    const totInt = totRow ? parseFloat(String(strip(totRow[1])).replace(/[^\d.\-]/g, '')) : NaN;
    if (parts.rate > 0 && isFinite(totInt) && totInt > 0){
      const share = x => totInt * x / parts.rate;
      top.push([t('r_lIntBoi'), M(share(parts.boi))], [t('r_lIntSpread'), M(share(parts.spread))], [t('r_lIntMargin'), (parts.margin < 0 ? '−' : '') + M(Math.abs(share(parts.margin)))]);
    }
  }
  res.rows = top.concat(res.rows);
  res.note = (res.note ? res.note + ' ' : '') + t(parts ? 'n_lPrime' : 'n_lMode');
  return res;
};
document.addEventListener('input', e => { if (e.target && e.target.id === 'l_boi') e.target.dataset.user = '1'; }, true);

/* ================= 8.5: comparing insurance offers, for every kind of insurance ================= */
const INS_KINDS = ['life', 'mortlife', 'mortprop', 'health', 'critical', 'disability', 'ltc', 'accident', 'carcomp', 'car3rd', 'carmand', 'homestruct', 'homecontent', 'travel', 'dental', 'pet', 'business'];
/* the offers are a list with no fixed size: add as many as you like, each with its insurer */
const INS_FK = [['p', 'f_insPx', 'cur'], ['g', 'f_insGx', '%'], ['d', 'f_insDx', 'cur'], ['c', 'f_insCx', 'cur'], ['x', 'f_insXx', '%'], ['xy', 'f_insXYx', 'yrs'], ['e', 'f_insEx', 'cur']];
function insSeed(){
  const o = {co: '', p: 180, g: 0, d: 0, c: 1000000, x: 0, xy: 0, e: 0};
  return [Object.assign({}, o), Object.assign({}, o, {p: 165, g: 4})];
}
function insList(){ if (!Array.isArray(SET.insOffers) || !SET.insOffers.length) SET.insOffers = insSeed(); return SET.insOffers; }
function insName(o, i, L){
  const def = t('lc_def', {n: i + 1}), own = String(o.n || '').trim();
  if (own) return own;
  if (!o.co) return def;
  const same = (L || insList()).filter(x => x.co === o.co && !String(x.n || '').trim()).length > 1;
  return t('o_insCo_' + o.co) + (same ? ' (' + def + ')' : '');
}
function insOffer(o, yrs, idx){
  const n0 = x => isFinite(+x) ? +x : 0;
  const p = Math.max(0, n0(o.p)), g = Math.max(-99, n0(o.g)) / 100, d = Math.max(0, n0(o.d)), cov = Math.max(0, n0(o.c));
  const disc = Math.max(0, n0(o.x)) / 100, dy = clamp(Math.round(n0(o.xy)), 0, 50), extra = Math.max(0, n0(o.e));
  let total = 0, first = 0;
  for (let y = 0; y < yrs; y++){
    const m = (p * Math.pow(1 + g, y) * Math.pow(1 + idx, y)) * (y < dy ? 1 - disc : 1) + extra * Math.pow(1 + idx, y);
    const yr = m * 12; total += yr; if (y === 0) first = yr;
  }
  return {p, g, d, cov, disc, dy, extra, total, first};
}
function calcInsurance(){
  const kind = ($('#ins_kind') || {}).value || 'life';
  const yrs = clamp(Math.round(v('ins_years')), 1, 60), idx = Math.max(-99, v('ins_idx')) / 100, claims = Math.max(0, v('ins_claims'));
  const by = ($('#ins_by') || {}).value || 'total';
  insCoFilter(kind);
  const src = insList();
  const L = src.map((o, i) => {
    const r = insOffer(o, yrs, idx);
    r.name = insName(o, i, src);
    r.ded = r.d * claims * yrs;                                     // the deductibles you would expect to pay over the period
    r.all = r.total + r.ded;
    r.per1k = r.cov > 0 ? r.all / yrs / (r.cov / 1000) : NaN;       // yearly cost for each ₪1,000 of cover
    return r;
  });
  const key = o => by === 'cover' ? (isFinite(o.per1k) ? o.per1k : Infinity) : o.all;
  const sorted = L.slice().sort((a, b) => key(a) - key(b)), best = sorted[0], worst = sorted[sorted.length - 1];
  const rows = [];
  sorted.forEach((o, i) => rows.push([(i === 0 ? '★ ' : (i + 1) + '. ') + o.name + ' · ' + t('r_insTotal', {y: yrs}), M(o.all), i === 0 ? 'key' : undefined]));
  if (L.length > 1) rows.push([t('r_insSave', {a: best.name, b: worst.name}), M(worst.all - best.all), 'key']);
  if (claims > 0) rows.push([t('r_insClaims'), N(claims, 2) + ' ' + t('r_insPerYear')]);
  const trows = sorted.map(o => [o.name, M(o.p, 2), M(o.first), M(o.total), M(o.ded), M(o.all), o.cov > 0 ? M(o.cov) : '—', isFinite(o.per1k) ? M(o.per1k, 2) : '—']);
  const warn = [];
  L.forEach(o => { if (o.g > 0.06) warn.push(t('w_insGrow', {n: o.name, g: PC(o.g * 100)})); if (o.disc > 0 && o.dy > 0 && o.dy < yrs) warn.push(t('w_insDisc', {n: o.name, y: o.dy})); });
  if (L.some(o => o.cov > 0 && Math.abs(o.cov - best.cov) / Math.max(1, best.cov) > 0.1)) warn.push(t('w_insCov'));
  return {
    hero: {label: t('r_insBest', {n: best.name}), value: M(best.all), sub: t('r_insBestSub', {y: yrs, s: M(worst.all - best.all), m: M(best.first / 12, 2)})},
    rows, warn: warn.slice(0, 4),
    table: {title: t('t_insCmp'), open: true, head: ['', t('h_insPm'), t('h_insY1'), t('h_insPrem'), t('h_insDed'), t('h_insAll'), t('h_insCov'), t('h_insPer1k')], rows: trows},
    note: t('n_ins_' + kind) + ' ' + t('n_ins')
  };
}
/* which insurers sell which kind: general insurers (car, home, business) are not offered for life and health plans, and PassportCard only for travel */
const INS_GENERAL = ['shomera', 'libra', 'wesure', 'shlomo'], INS_LIFEHEALTH = ['life', 'health', 'critical', 'disability', 'ltc', 'dental'];
function insCoOk(c, kind){
  if (c === 'passport') return kind === 'travel';
  if (INS_GENERAL.includes(c)) return !INS_LIFEHEALTH.includes(kind);
  return true;
}
var INS_KIND_SEEN = '';
function insCoFilter(kind){
  let fixed = false;
  insList().forEach(o => { if (o.co && !insCoOk(o.co, kind)){ o.co = ''; fixed = true; } });
  if (fixed) try { saveSet(); } catch (e) {}
  if (kind !== INS_KIND_SEEN || fixed){ INS_KIND_SEEN = kind; setTimeout(() => { try { insRender(); } catch (e) {} }, 0); }
}
Object.assign(CALC, {insurance: calcInsurance});
