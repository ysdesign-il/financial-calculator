/* ================= extra calculators ================= */
const incTaxOf = (inc, pts) => { const b = taxByBrackets(inc); return Math.max(0, b.tax - pts * TAX.point) + b.sur; };
const pmtOf = (amt, rate, n) => { const r = rate / 1200; return n <= 0 ? 0 : r === 0 ? amt / n : amt * r / (1 - Math.pow(1 + r, -n)); };
const mRate = pct => Math.pow(1 + pct / 100, 1 / 12) - 1;
const fvAnn = (pmt, rm, n) => rm === 0 ? pmt * n : pmt * (Math.pow(1 + rm, n) - 1) / rm;
const bracketTax = (price, br) => { let prev = 0, tot = 0; const parts = br.map(([lim, r]) => { const a = Math.max(0, Math.min(price, lim) - prev); prev = lim; tot += a * r; return {a, r, tax: a * r}; }); return {tot, parts}; };
const vatPct = () => { const x = parseFloat(SET.vat); return isFinite(x) ? x : 18; };

/* --- severance --- */
const SEV_CEIL = 13750;
function calcSeverance(){
  const sal = Math.max(0, v('sv_sal')), yrs = Math.max(0, v('sv_years')), other = Math.max(0, v('sv_other'));
  const pts = pointsOf('q'), entitled = $('#sv_why').value === 'yes';
  const owed = entitled ? sal * yrs : 0;
  const exempt = Math.min(owed, Math.min(sal, SEV_CEIL) * yrs), taxable = owed - exempt;
  const base = incTaxOf(other, pts);
  const taxNo = incTaxOf(other + taxable, pts) - base;
  const N = clamp(Math.ceil(yrs), 1, 6);
  const taxSp = N * (incTaxOf(other + taxable / N, pts) - base);
  const tax = Math.min(taxNo, taxSp);
  const net = owed - tax;
  return {
    hero: {label: t('r_svNet'), value: MI(net), sub: t('r_svTaxLine', {n: MI(tax)})},
    rows: [
      [t('r_svOwed'), MI(owed)], [t('r_svCeil'), MI(SEV_CEIL)], [t('r_svExempt'), MI(exempt)], [t('r_svTaxable'), MI(taxable)],
      [t('r_svTaxNo'), MI(taxNo)], [t('r_svSpreadYrs'), N], [t('r_svTaxSp'), MI(taxSp)],
      [t('r_svTax'), MI(tax), 'key'], [t('r_svNet'), MI(net), 'key'], [t('r_effTax'), PC(owed > 0 ? tax / owed * 100 : NaN)],
      [t('r_points'), ptsTxt('q', pts)]
    ],
    warn: entitled ? [] : [t('w_svNo')],
    note: t('n_sev') + ' ' + t('n_points'),
    split: {title: t('r_svNet'), items: [
      {name: t('r_svNet'), v: Math.max(0, net), cls:'c-ink', fmt: MI(net)},
      {name: t('r_svTax'), v: tax, cls:'c-warm', fmt: MI(tax)}]}
  };
}
function N_(x){ return N(x, 2); }

/* --- advance notice --- */
function calcNotice(){
  const m = Math.max(0, Math.floor(v('nt_months'))), type = $('#nt_type').value, sal = Math.max(0, v('nt_sal'));
  let days;
  if (type === 'm') days = m >= 12 ? 30 : m <= 6 ? m : 6 + 2.5 * (m - 6);
  else days = m < 12 ? m : m < 24 ? 14 + Math.floor((m - 12) / 2) : m < 36 ? 21 + Math.floor((m - 24) / 2) : 30;
  days = Math.min(30, days);
  const val = sal * days / 30;
  const end = new Date(); end.setDate(end.getDate() + Math.ceil(days));
  const fmtD = new Intl.DateTimeFormat(locOf(), {year:'numeric', month:'long', day:'numeric'}).format(end);
  return {
    hero: {label: t('r_ntDays'), value: N(days, days % 1 ? 1 : 0), sub: t('r_ntVal', {n: MI(val)})},
    rows: [[t('f_ntMonths'), m], [t('r_ntDays'), N(days, 1)], [t('r_ntPay'), MI(val), 'key'], [t('r_ntEnd'), fmtD]],
    note: t('n_notice')
  };
}

/* --- vacation, recuperation, sick --- */
const HAV_RATE = 451.5;
const havDays = y => y <= 1 ? 5 : y <= 3 ? 6 : y <= 10 ? 7 : y <= 15 ? 8 : y <= 19 ? 9 : 10;
function calcLeave(){
  const sal = Math.max(0, v('lv_sal')), div = Math.max(1, v('lv_div'));
  const daily = sal / div;
  const ent = Math.max(0, v('lv_ent')), mo = clamp(v('lv_mo'), 0, 12), used = Math.max(0, v('lv_used')), carry = Math.max(0, v('lv_carry'));
  const accrued = ent * mo / 12;
  const bal = Math.max(0, carry + accrued - used);
  const vacVal = bal * daily;
  const yrs = Math.max(1, Math.floor(v('lv_yrs'))), hd = havDays(yrs), scope = clamp(v('lv_scope'), 0, 100) / 100;
  const hav = hd * HAV_RATE * (mo / 12) * scope;
  const havLeft = Math.max(0, hav - Math.max(0, v('lv_hpaid')));
  const tmo = Math.max(0, v('lv_tmo')), sick = Math.min(90, 1.5 * tmo);
  return {
    hero: {label: t('r_lvTotal'), value: MI(vacVal + havLeft), sub: t('r_lvDaily', {n: MI(daily)})},
    rows: [
      [t('r_lvDailyW'), MI(daily)], [t('r_lvAccrued'), N(accrued, 1)], [t('r_lvBal'), N(bal, 1)], [t('r_lvVac'), MI(vacVal), 'key'],
      [t('r_lvHavDays'), hd], [t('r_lvHavRate'), MI(HAV_RATE)], [t('r_lvHav'), MI(hav)], [t('r_lvHavLeft'), MI(havLeft), 'key'],
      [t('r_lvSick'), N(sick, 1)], [t('r_lvSickVal'), MI(sick * daily)],
      [t('r_lvTotal'), MI(vacVal + havLeft), 'key']
    ],
    note: t('n_leave')
  };
}

/* --- purchase tax --- */
const PT_BR = {
  single: [[1978745, 0], [2347040, .035], [6055070, .05], [20183565, .08], [Infinity, .10]],
  add: [[6055070, .08], [Infinity, .10]],
  oleh: [[1978745, 0], [6055070, .005], [20183565, .08], [Infinity, .10]]
};
function calcPurchaseTax(){
  const price = Math.max(0, v('pt_price')), kind = $('#pt_kind').value;
  const r = bracketTax(price, PT_BR[kind]);
  const vat = 1 + vatPct() / 100;
  const lawyer = price * Math.max(0, v('pt_lawyer')) / 100 * vat, agent = price * Math.max(0, v('pt_agent')) / 100 * vat;
  const extra = Math.max(0, v('pt_other')), costs = lawyer + agent + extra;
  const other = kind === 'single' ? bracketTax(price, PT_BR.add).tot : bracketTax(price, PT_BR.single).tot;
  const edge = [0].concat(PT_BR[kind].map(b => b[0]));
  return {
    hero: {label: t('r_ptTax'), value: MI(r.tot), sub: t('r_ptEff', {n: PC(price > 0 ? r.tot / price * 100 : NaN)})},
    rows: [
      [t('r_ptPrice'), MI(price)], [t('r_ptTax'), MI(r.tot), 'key'], [t('r_ptEffRow'), PC(price > 0 ? r.tot / price * 100 : NaN)],
      [t('r_ptLawyer'), MI(lawyer)], [t('r_ptAgent'), MI(agent)]].concat(extra > 0 ? [[t('r_ptOther'), MI(extra)]] : []).concat([[t('r_ptCosts'), MI(r.tot + costs), 'key'],
      [t('r_ptAll'), MI(price + r.tot + costs), 'key'],
      [kind === 'single' ? t('r_ptIfAdd') : t('r_ptIfSingle'), MI(other)]
    ]),
    warn: kind === 'oleh' ? [t('w_ptOleh')] : [],
    note: t('n_pt'),
    table: {
      title: t('t_brackets'), open: true, head: [t('h_bracket'), t('h_rate'), t('l_tax')],
      rows: r.parts.map((p, i) => [MI(edge[i]) + ' – ' + (isFinite(edge[i + 1]) ? MI(edge[i + 1]) : '∞'), PC(p.r * 100), MI(p.tax)])
    }
  };
}

/* --- land appreciation tax --- */
function calcLandTax(){
  const sell = Math.max(0, v('lt_sell')), buy = Math.max(0, v('lt_buy')), bexp = Math.max(0, v('lt_bexp')), sexp = Math.max(0, v('lt_sexp'));
  const impr = Math.max(0, v('lt_impr')), cpi = Math.max(0, v('lt_cpi')), ex = $('#lt_exempt').value === '1';
  const ceil = Math.max(0, v('lt_ceil')), other = Math.max(0, v('lt_other'));
  const cost = buy + bexp + impr;
  const nom = sell - sexp - cost;
  const infl = nom > 0 ? Math.min(nom, cost * cpi / 100) : 0;
  const real = Math.max(0, nom - infl);
  const share = ex ? (sell <= ceil ? 0 : (sell - ceil) / sell) : 1;
  const taxable = real * share;
  const tax = taxable * 0.25;
  const a = surtaxOf(other + taxable, taxable), z = surtaxOf(other, 0);
  const sur = a.s3 - z.s3 + a.s2;
  const total = tax + sur;
  const net = sell - sexp - total;
  return {
    hero: {label: t('r_ltTax'), value: MI(total), sub: t('r_netProceeds') + ': ' + MI(net)},
    rows: [
      [t('r_ltNom'), MI(nom)], [t('r_inflPart'), MI(-infl)], [t('r_ltReal'), MI(real)],
      [t('r_ltExempt'), ex ? PC((1 - share) * 100) : t('r_na')], [t('r_taxableGain'), MI(taxable)],
      [t('r_ltRate'), PC(25)], [t('r_taxAmt'), MI(tax)], [t('r_surCapTax'), MI(sur)],
      [t('r_ltTax'), MI(total), 'key'], [t('r_netProceeds'), MI(net), 'key'], [t('r_effTax'), PC(nom > 0 ? total / nom * 100 : NaN)]
    ],
    warn: [t('w_ltLinear')],
    note: t('n_lt'),
    split: {title: t('r_netProceeds'), items: [
      {name: t('r_netProceeds'), v: Math.max(0, net), cls:'c-ink', fmt: MI(net)},
      {name: t('r_ltTax'), v: total, cls:'c-warm', fmt: MI(total)}]}
  };
}

/* --- mortgage refinance --- */
function calcRefi(){
  const bal = Math.max(0, v('rf_bal')), rate = Math.max(0, v('rf_rate')), n1 = Math.max(1, Math.round(v('rf_left') * 12));
  const nr = Math.max(0, v('rf_nrate')), n2 = Math.max(1, Math.round(v('rf_nyrs') * 12));
  const fees = Math.max(0, v('rf_fee')) + bal * Math.max(0, v('rf_feePct')) / 100 + Math.max(0, v('rf_pen'));
  const p1 = pmtOf(bal, rate, n1), p2 = pmtOf(bal, nr, n2);
  const tot1 = p1 * n1, tot2 = p2 * n2 + fees;
  const mSave = p1 - p2, save = tot1 - tot2;
  const be = mSave > 0 ? Math.ceil(fees / mSave) : NaN;
  return {
    hero: {label: t('r_rfSave'), value: M(save), sub: t('r_rfMonthly', {n: M(mSave)})},
    rows: [
      [t('r_rfPmtOld'), M(p1)], [t('r_rfPmtNew'), M(p2)], [t('r_rfMSave'), M(mSave), 'key'],
      [t('r_rfIntOld'), M(p1 * n1 - bal)], [t('r_rfIntNew'), M(p2 * n2 - bal)], [t('r_rfFees'), M(fees)],
      [t('r_rfBe'), isFinite(be) ? fmtDur(be) : t('r_na')], [t('r_rfSave'), M(save), 'key']
    ],
    warn: save < 0 ? [t('w_rfLose')] : [],
    note: t('n_refi')
  };
}

/* --- loan comparison --- */
function aprOf(net, pay, n){
  let lo = 0, hi = 1;
  for (let i = 0; i < 90; i++){
    const mid = (lo + hi) / 2;
    const pv = mid === 0 ? pay * n : pay * (1 - Math.pow(1 + mid, -n)) / mid;
    if (pv > net) lo = mid; else hi = mid;
  }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
}
/* any number of named offers (a bank name instead of "offer A/B") */
function lcRateFromPmt(amt, n, pm){       // the annual rate that makes this monthly payment repay the loan
  if (!(amt > 0) || !(pm > 0) || pm * n <= amt) return 0;
  let lo = 0, hi = 300;
  for (let k = 0; k < 80; k++){ const mid = (lo + hi) / 2; if (pmtOf(amt, mid, n) > pm) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}
function loanCmpSide(o){
  const amt = Math.max(0, +o.amt || 0), n = Math.max(1, Math.round((+o.yrs || 0) * 12) || 1), rt = o.rt || 'fix';
  const up = Math.max(0, +o.fee || 0) + amt * Math.max(0, +o.pct || 0) / 100, mf = Math.max(0, +o.mon || 0);
  let rate = Math.max(0, +o.rate || 0), pm, low = false;
  if (rt === 'prime') rate = Math.max(0, lcPrime() + (+o.mg || 0));
  if (rt === 'pmt'){ pm = Math.max(0, +o.pay || 0); low = pm * n < amt; rate = lcRateFromPmt(amt, n, pm); }
  else pm = pmtOf(amt, rate, n);
  const total = (pm + mf) * n + up;
  return {amt, n, pm, mf, up, total, rate, rt, low, int: pm * n - amt, apr: amt - up > 0 ? aprOf(amt - up, pm + mf, n) : NaN};
}
function calcLoanCmp(){
  const L = lcList().map((o, i) => Object.assign(loanCmpSide(o), {name: asEsc(lcName(o, i))}));
  /* same amount and same term → the total cost decides; otherwise the true annual cost (fees included) does */
  const fair = L.every(s => s.n === L[0].n && Math.abs(s.amt - L[0].amt) < 0.5);
  const rank = s => fair ? s.total : (isFinite(s.apr) ? s.apr : Infinity);
  const S = L.slice().sort((a, b) => rank(a) - rank(b) || a.total - b.total), best = S[0], next = S[1], worst = S[S.length - 1];
  const mo = s => s.pm + s.mf, fees = s => s.up + s.mf * s.n;
  const star = s => (next && s === best ? '★ ' : '') + s.name;
  const mark = s => s.rt === 'prime' ? ' (P)' : s.rt === 'pmt' ? ' *' : '';
  const note = t('n_lc2') + (L.some(s => s.rt === 'pmt') ? ' ' + t('n_lcStar') : '') + (L.some(s => s.rt === 'prime') ? ' ' + t('n_lcPrime', {p: PC(lcPrime())}) : '');
  const warn = L.filter(s => s.low).map(s => t('w_lcLow', {x: s.name}));
  if (next && !fair) warn.push(t('w_lcUnfair'));
  const table = {title: t('t_compare'), open: true, head: ['', t('r_lcTotal'), t('h_lcTrue'), t('r_lcPmt'), t('h_lcNom'), t('r_lcInt'), t('h_lcFees')],
    rows: S.map(s => [star(s), M(s.total), PC(s.apr), M(mo(s)), PC(s.rate) + mark(s), M(s.int), M(fees(s))])};
  if (!next) return {hero: {label: t('r_lcTotalOf', {x: best.name}), value: M(best.total), sub: t('h_lcTrue') + ': ' + PC(best.apr)},
    rows: [[t('r_lcMoOne'), M(mo(best))], [t('r_lcInt'), M(best.int)], [t('h_lcFees'), M(fees(best))]], note: note + ' ' + t('n_lcAdd'), warn, table};
  const cmp = (d, less, more, f) => Math.abs(d) >= 0.5 ? [[t(d < 0 ? less : more, {x: best.name, y: next.name}), f(Math.abs(d))]] : [];
  const rows = []
    .concat(fair ? [] : cmp(best.total - next.total, 'r_lcTotLess', 'r_lcTotMore', x => M(x)))
    .concat(cmp(mo(best) - mo(next), 'r_lcMoLess', 'r_lcMoMore', x => M(x)))
    .concat(cmp(best.int - next.int, 'r_lcIntLess', 'r_lcIntMore', x => M(x)))
    .concat(cmp(fees(best) - fees(next), 'r_lcFeeLess', 'r_lcFeeMore', x => M(x)));
  if (S.length > 2 && worst !== next) rows.push(fair ? [t('r_lcWorst', {x: worst.name}), M(worst.total - best.total)] : [t('r_lcWorstApr', {x: worst.name}), PC(worst.apr - best.apr)]);
  if (fair){ const lo = L.slice().sort((a, b) => a.apr - b.apr)[0]; if (lo !== best && isFinite(lo.apr) && lo.apr < best.apr - 0.005) warn.push(t('w_lcAprDiff', {x: lo.name, y: best.name})); }
  return {
    hero: fair ? {label: t('r_lcBestN', {x: best.name}), value: M(next.total - best.total), sub: t('r_lcVsTot', {x: next.name})}
      : {label: t('r_lcBestApr', {x: best.name}), value: PC(next.apr - best.apr), sub: t('r_lcVsApr', {x: next.name})},
    rows, note, warn, table
  };
}

/* --- prepay vs invest --- */
function calcPrepay(){
  const bal = Math.max(0, v('pp_bal')), rate = Math.max(0, v('pp_rate')), n = Math.max(1, Math.round(v('pp_yrs') * 12));
  const fee = Math.max(0, v('pp_fee')), lump = clamp(v('pp_lump'), 0, bal + fee), pre = Math.min(bal, Math.max(0, lump - fee));
  const ret = v('pp_ret'), tax = clamp(v('pp_tax'), 0, 60) / 100, short = ($('#pp_after') || {}).value === 'short';
  const p0 = pmtOf(bal, rate, n), p1 = short ? p0 : pmtOf(bal - pre, rate, n), r = rate / 1200, rm = mRate(ret);
  /* A: prepay, invest whatever the loan no longer takes each month */
  let b = bal - pre, wA = 0, put = 0, paid = 0, end = 0;
  for (let m = 1; m <= n; m++){
    let pay = 0;
    if (b > 1e-6){ const it = b * r; pay = Math.min(p1, b + it); b = b + it - pay; if (b <= 1e-6){ b = 0; end = m; } }
    const freed = p0 - pay; paid += pay; wA = wA * (1 + rm) + freed; put += freed;
  }
  if (!end) end = n;
  const aftA = wA - Math.max(0, wA - put) * tax;
  const fvB = lump * Math.pow(1 + rm, n), aftB = fvB - Math.max(0, fvB - lump) * tax;
  const diff = aftA - aftB, intSaved = p0 * n - paid;
  const retB = lump > 0 ? (Math.pow(aftB / lump, 12 / n) - 1) * 100 : NaN;
  const rows = [[t('r_ppPmt0'), M(p0)]];
  if (short) rows.push([t('r_ppShorter'), fmtDur(Math.max(0, n - end))], [t('r_ppEnd'), fmtDur(end)]);
  else rows.push([t('r_ppPmt1'), M(p1)], [t('r_ppSave'), M(p0 - p1)]);
  if (fee > 0) rows.push([t('r_ppFeeRow'), M(fee)], [t('r_ppPre'), M(pre)]);
  rows.push([t('r_ppIntSaved'), M(intSaved)],
    [t('r_ppFinA'), M(aftA)], [t('r_ppFinB'), M(aftB)], [t('r_ppDiff'), M(diff), 'key'],
    [t('r_ppRetB'), PC(retB)], [t('r_ppRetA'), PC(rate)]);
  return {
    hero: {label: diff >= 0 ? t('r_ppA') : t('r_ppB'), value: M(Math.abs(diff)), sub: t('r_ppSub')},
    rows, note: t('n_pp') + (short ? ' ' + t('n_ppShort') : '')
  };
}

/* --- savings goal --- */
function calcSaveGoal(){
  const mode = $('#sg_mode').value, goal = Math.max(0, v('sg_goal')), now = Math.max(0, v('sg_now')), rate = v('sg_rate'), infl = Math.max(0, v('sg_infl'));
  const tax = clamp(v('sg_tax'), 0, 60) / 100, fee = clamp(v('sg_fee'), 0, 10) / 1200;
  const rm = mRate(rate), g = (1 + rm) * (1 - fee);
  const run = (dep, n) => { let b = now, f = 0; for (let m = 1; m <= n; m++){ const gr = b * (1 + rm); f += gr * fee; b = gr * (1 - fee) + dep; } const total = now + dep * n, tx = Math.max(0, b - total) * tax; return {b, f, total, tx, net: b - tx}; };
  let n, dep;
  if (mode === 'dep'){
    n = Math.max(1, Math.round(v('sg_years') * 12));
    if (!tax && !fee){ const G = Math.pow(1 + rm, n); dep = Math.max(0, rm === 0 ? (goal - now) / n : (goal - now * G) * rm / (G - 1)); }
    else if (run(0, n).net >= goal) dep = 0;
    else { let lo = 0, hi = Math.max(1, goal); while (run(hi, n).net < goal && hi < 1e12) hi *= 2; for (let i = 0; i < 100; i++){ const mid = (lo + hi) / 2; if (run(mid, n).net < goal) lo = mid; else hi = mid; } dep = hi; }
  } else {
    dep = Math.max(0, v('sg_dep'));
    if (now >= goal) n = 0;
    else if (!tax && !fee){
      if (rm === 0) n = dep > 0 ? Math.ceil((goal - now) / dep) : NaN;
      else if (dep <= 0 && now <= 0) n = NaN;
      else n = Math.min(1200, Math.ceil(Math.log((goal * rm + dep) / (now * rm + dep)) / Math.log(1 + rm)));
    } else {
      let b = now, put = now; n = NaN;
      for (let m = 1; m <= 1200; m++){ b = b * g + dep; put += dep; if (b - Math.max(0, b - put) * tax >= goal){ n = m; break; } }
    }
  }
  if (!isFinite(n)) return {hero: {label: t('r_sgDep'), value: '—'}, rows: [], note: t('n_sg')};
  let b = now; const Y = [];
  for (let m = 1; m <= n; m++){
    b = b * g + dep;
    if (m % 12 === 0 || m === n) Y.push({y: Math.ceil(m / 12), bal: b, dep: now + dep * m});
  }
  const R = run(dep, n), total = R.total;
  const real = goal / Math.pow(1 + infl / 100, n / 12);
  const rows = [
    [t('r_sgDep'), M(dep)], [t('r_sgTime'), fmtDur(n)], [t('r_sgDeposited'), M(total)], [t('r_sgInterest'), M(Math.max(0, R.b - total))]];
  if (fee > 0) rows.push([t('r_sgFeeRow'), M(R.f)]);
  rows.push([t('r_sgFinal'), M(R.b), tax > 0 ? '' : 'key']);
  if (tax > 0) rows.push([t('r_sgTaxRow'), M(-R.tx)], [t('r_sgNet'), M(R.net), 'key']);
  rows.push([t('r_sgReal'), M(real)]);
  return {
    hero: mode === 'dep' ? {label: t('r_sgDep'), value: M(dep), sub: t('r_sgTotal', {n: M(total)})} : {label: t('r_sgTime'), value: fmtDur(n), sub: t('r_sgTotal', {n: M(total)})},
    rows,
    note: t('n_sg'),
    chart: {title: t('c_growth'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('l_deposits'), cls:'c-ink', values: Y.map(y => y.dep)}, {name: t('l_interest'), cls:'c-accent', values: Y.map(y => Math.max(0, y.bal - y.dep))}],
      labels: Y.map(y => y.y)},
    table: {title: t('t_yearly'), head: [t('w_year'), t('h_value')], rows: Y.map(y => [y.y, M(y.bal)])}
  };
}

/* --- retirement --- */
function calcRetire(){
  const age = v('rt_age'), ret = Math.max(age, v('rt_ret')), life = Math.max(ret + 1, v('rt_life'));
  const have = Math.max(0, v('rt_have')), dep = Math.max(0, v('rt_dep')), r1 = v('rt_r1'), r2 = v('rt_r2');
  const need = Math.max(0, v('rt_need')), other = Math.max(0, v('rt_other')), infl = Math.max(0, v('rt_infl'));
  const y = ret - age, n = Math.round(y * 12), m = Math.round((life - ret) * 12);
  const rfee = clamp(v('rt_fee'), 0, 10) / 1200, coef = Math.max(0, v('rt_coef'));
  const rm = (1 + mRate(r1)) * (1 - rfee) - 1;
  const fv = have * Math.pow(1 + rm, n) + fvAnn(dep, rm, n);
  const f = Math.pow(1 + infl / 100, y);
  const gapM = Math.max(0, need - other);
  const needNom = gapM * f;
  const rr = (1 + r2 / 100) / (1 + infl / 100) - 1, rrm = Math.pow(1 + rr, 1 / 12) - 1;
  const fac = rrm === 0 ? m : (1 - Math.pow(1 + rrm, -m)) / rrm;
  const K = needNom * fac;
  const sust = fv / fac / f;
  const lack = Math.max(0, K - fv);
  const g = Math.pow(1 + rm, n);
  const extra = lack > 0 && n > 0 ? (rm === 0 ? lack / n : lack * rm / (g - 1)) : 0;
  return {
    hero: {label: t('r_rtSust'), value: M(sust + other), sub: t('r_rtTarget', {n: M(need)})},
    rows: [
      [t('r_rtYears'), N(y, 1)], [t('r_rtFv'), M(fv)], [t('r_rtNeedCap'), M(K)], [t('r_rtGap'), M(lack), 'key'],
      [t('r_rtExtra'), M(extra), 'key'], [t('r_rtSust'), M(sust + other)], [t('r_rtNeedNom'), M(needNom)],
      [t('r_rtDur'), N(life - ret, 1)]
    ].concat(coef > 0 ? [[t('r_rtCoef', {c: N(coef, null, 1)}), M(fv / coef / f + other), 'key']] : []),
    warn: lack > 0 ? [t('w_rtLack')] : [],
    warnOk: lack <= 0,
    note: t('n_rt')
  };
}

/* --- credit card --- */
function ccSim(bal0, apr, mode, pct, floor, fix, extra){
  let bal = bal0, m = 0, paid = 0, int = 0, stuck = false; const Y = [];
  while (bal > 0.005 && m < 1200){
    m++;
    const i = bal * apr / 1200;
    let pay = (mode === 'min' ? Math.max(floor, bal * pct + i) : fix) + extra;
    pay = Math.min(pay, bal + i);
    if (pay <= i + 0.005 && bal + i > pay){ stuck = true; break; }
    int += i; bal = bal + i - pay; paid += pay;
    if (m % 12 === 0) Y.push([m / 12, M(Math.max(0, bal))]);
  }
  return {m, paid, int, stuck, Y};
}
function calcCredit(){
  const bal0 = Math.max(0, v('cc_bal')), apr = Math.max(0, v('cc_apr')), mode = $('#cc_mode').value;
  const pct = Math.max(0, v('cc_minPct')) / 100, floor = Math.max(0, v('cc_floor')), fix = Math.max(0, v('cc_pay'));
  const extra = mode === 'min' ? Math.max(0, v('cc_extra')) : 0;
  const R = ccSim(bal0, apr, mode, pct, floor, fix, extra), m = R.m, paid = R.paid, int = R.int;
  if (R.stuck) return {hero: {label: t('r_ccMonths'), value: '—'}, rows: [[t('r_ccMonths'), '—']], warn: [t('w_ccStuck')], note: t('n_cc')};
  const rows = [[t('r_ccMonths'), fmtDur(m)], [t('r_ccPaid'), M(paid)], [t('r_ccInt'), M(int), 'key'], [t('r_ccShare'), PC(paid > 0 ? int / paid * 100 : NaN)]];
  if (extra > 0){ const B = ccSim(bal0, apr, mode, pct, floor, fix, 0); if (!B.stuck) rows.push([t('r_ccNoExtra'), fmtDur(B.m)], [t('r_ccExtraSaves'), M(B.int - int), 'key']); }
  return {
    hero: {label: t('r_ccMonths'), value: fmtDur(m), sub: t('r_ccIntLine', {n: M(int)})},
    rows,
    warn: m >= 1200 ? [t('w_ccLong')] : [],
    note: t('n_cc'),
    split: {title: t('r_ccPaid'), items: [
      {name: t('r_ccPrincipal'), v: bal0, cls:'c-ink', fmt: M(bal0)}, {name: t('r_ccInt'), v: int, cls:'c-warm', fmt: M(int)}]},
    table: R.Y.length ? {title: t('t_yearly'), head: [t('w_year'), t('h_balance')], rows: R.Y} : undefined
  };
}

/* --- rent vs buy --- */
function calcRentBuy(){
  const price = Math.max(0, v('rb_price')), down = clamp(v('rb_down'), 0, price), rate = Math.max(0, v('rb_rate'));
  const term = Math.max(1, Math.round(v('rb_yrs') * 12)), g = v('rb_g'), rent0 = Math.max(0, v('rb_rent')), rg = v('rb_rg');
  const ret = v('rb_ret'), hz = clamp(Math.round(v('rb_hz') * 12), 1, 600), cost = Math.max(0, v('rb_cost')) / 100, sellC = Math.max(0, v('rb_sell')) / 100, maint = Math.max(0, v('rb_maint')) / 100;
  const loan = price - down, pm = pmtOf(loan, rate, term), r = rate / 1200, gm = mRate(g), rm = mRate(ret);
  let bal = loan, val = price, invB = 0, invR = down + price * cost;
  const Y = [];
  for (let k = 0; k < hz; k++){
    const int = bal * r; const pr = k < term ? Math.min(bal, pm - int) : 0;
    const pay = k < term ? pm : 0;
    bal -= pr; val *= 1 + gm;
    const buyCost = pay + val * maint / 12;
    const rent = rent0 * Math.pow(1 + rg / 100, Math.floor(k / 12));
    const d = buyCost - rent;
    invB *= 1 + rm; invR *= 1 + rm;
    if (d > 0) invR += d; else invB += -d;
    if ((k + 1) % 12 === 0 || k === hz - 1){
      const wb = val - bal - val * sellC + invB;
      Y.push([Math.ceil((k + 1) / 12), M(wb), M(invR), M(wb - invR)]);
    }
  }
  const wBuy = val - bal - val * sellC + invB, wRent = invR, diff = wBuy - wRent;
  return {
    hero: {label: diff >= 0 ? t('r_rbBuy') : t('r_rbRent'), value: M(Math.abs(diff)), sub: t('r_rbSub', {y: N(hz / 12, hz % 12 ? 1 : 0)})},
    rows: [
      [t('r_rbPmt'), M(pm)], [t('r_rbValue'), M(val)], [t('r_rbBal'), M(bal)],
      [t('r_rbWBuy'), M(wBuy), 'key'], [t('r_rbWRent'), M(wRent), 'key'], [t('r_rbDiff'), M(diff)]
    ],
    note: t('n_rb'),
    table: {title: t('t_yearly'), head: [t('w_year'), t('r_rbWBuy'), t('r_rbWRent'), t('r_rbDiff')], rows: Y}
  };
}

/* --- car lease vs buy --- */
function calcCar(){
  const price = Math.max(0, v('cl_price')), down = clamp(v('cl_down'), 0, price), rate = Math.max(0, v('cl_rate')), n = Math.max(1, Math.round(v('cl_n')));
  const resale = price * clamp(v('cl_resale'), 0, 100) / 100, brun = Math.max(0, v('cl_brun')), lrun = Math.max(0, v('cl_lrun'));
  const lm = Math.max(0, v('cl_lm')), lup = Math.max(0, v('cl_lup')), opp = v('cl_opp'), yrs = n / 12;
  const pm = pmtOf(price - down, rate, n);
  const og = x => x * (Math.pow(1 + opp / 100, yrs) - 1);
  const buy = down + pm * n + brun * yrs - resale + og(down);
  const lease = lup + lm * n + lrun * yrs + og(lup);
  const diff = lease - buy;
  return {
    hero: {label: diff > 0 ? t('r_clBuy') : t('r_clLease'), value: M(Math.abs(diff)), sub: t('r_clSub')},
    rows: [
      [t('r_clPmt'), M(pm)], [t('r_clBuyTot'), M(buy), 'key'], [t('r_clLeaseTot'), M(lease), 'key'],
      [t('r_clBuyMo'), M(buy / n)], [t('r_clLeaseMo'), M(lease / n)], [t('r_clResale'), M(resale)]
    ],
    note: t('n_cl')
  };
}

/* --- average cost --- */
function calcAvgCost(){
  const sh = Math.max(0, v('da_sh')), avg = Math.max(0, v('da_avg')), buy = Math.max(0, v('da_buy')), pr = Math.max(0.0001, v('da_pr')), cur_ = Math.max(0, v('da_cur'));
  const fee = Math.max(0, v('da_fee')), tgt = Math.max(0, v('da_tgt'));
  const ns = buy / pr, tot = sh + ns;
  const invested = sh * avg + buy + (buy > 0 ? fee : 0), newAvg = tot > 0 ? invested / tot : 0;
  const plBefore = sh * (cur_ - avg), plAfter = tot * cur_ - invested;
  const rows = [
    [t('r_daNew'), N(ns, 3)], [t('r_daTot'), N(tot, 3)], [t('r_daAvg'), M(newAvg, 2), 'key'], [t('r_daInv'), M(invested)]];
  if (fee > 0 && buy > 0) rows.push([t('r_daFeeRow'), M(fee)]);
  rows.push([t('r_daPlB'), M(plBefore)], [t('r_daPlA'), M(plAfter), 'key'],
    [t('r_daUpB'), PC(cur_ > 0 && avg > 0 ? (avg / cur_ - 1) * 100 : NaN)], [t('r_daUpA'), PC(cur_ > 0 && newAvg > 0 ? (newAvg / cur_ - 1) * 100 : NaN)]);
  const warn = [];
  if (tgt > 0){
    const x = Math.abs(tgt - pr) > 1e-9 ? sh * (avg - tgt) / (tgt - pr) : NaN;   // units to buy at this price so the average becomes the target
    if (isFinite(x) && x >= 0){ rows.push([t('r_daTgtU', {x: M(tgt, 2)}), N(x, 2), 'key'], [t('r_daTgtC'), M(x * pr)]); }
    else warn.push(t('w_daTgt', {x: M(tgt, 2), p: M(pr, 2)}));
  }
  return {hero: {label: t('r_daAvg'), value: M(newAvg, 2), sub: t('r_daOld', {n: M(avg, 2)})}, rows, warn, note: t('n_da')};
}

/* --- break-even --- */
function calcBreakEven(){
  const fix = Math.max(0, v('be_fix')), price = Math.max(0, v('be_price')), vc = Math.max(0, v('be_var')), tg = Math.max(0, v('be_target')), cu = Math.max(0, v('be_units'));
  const tax = clamp(v('be_tax'), 0, 90) / 100;
  const cm = price - vc;
  if (cm <= 0) return {hero: {label: t('r_beUnits'), value: '—'}, rows: [], warn: [t('w_beCm')], note: t('n_be')};
  const u = fix / cm, ut = (fix + tg / (1 - tax)) / cm, profit = cu * cm - fix, net = profit > 0 ? profit * (1 - tax) : profit;
  const tbl = [0.5, 1, 1.5, 2].map(k => [N(u * k, 0), M(u * k * price), M(u * k * cm - fix)]);
  const rows = [
    [t('r_beCm'), M(cm, 2)], [t('r_beCmPct'), PC(price > 0 ? cm / price * 100 : NaN)], [t('r_beUnits'), N(Math.ceil(u)), 'key'],
    [t('r_beRevRow'), M(u * price)], [t(tax > 0 ? 'r_beUnitsTN' : 'r_beUnitsT'), N(Math.ceil(ut)), 'key'], [t('r_beRevT'), M(ut * price)],
    [t('r_beProfit'), M(profit)]];
  if (tax > 0) rows.push([t('r_beProfitNet'), M(net)]);
  rows.push([t('r_beMos'), PC(cu > 0 ? (cu - u) / cu * 100 : NaN)]);
  return {
    hero: {label: t('r_beUnits'), value: N(Math.ceil(u)), sub: t('r_beRev', {n: M(u * price)})},
    rows, note: t('n_be'),
    table: {title: t('t_beTable'), head: [t('h_units'), t('h_revenue'), t('h_profit')], rows: tbl}
  };
}

/* --- split bill: equally, by income, %, parts, what each ordered, or settle up who paid what --- */
const SP_CLS = ['c-ink', 'c-accent', 'c-warm', 'c-soft'];
function spRoundUp(x, step){ return step > 0 ? Math.ceil(x / step - 1e-9) * step : x; }
function calcSplit(){
  const mode = $('#sp_mode').value, total = Math.max(0, v('sp_total')), tip = Math.max(0, v('sp_tip')) / 100, step = +(($('#sp_round') || {}).value || 0);
  const bill = total * (1 + tip);
  if (mode === 'eq'){
    const n = Math.max(1, Math.round(v('sp_n'))), each = bill / n, r = spRoundUp(each, step);
    const rows = [[t('r_spBillRow'), M(bill, 2)], [t('r_spTip'), M(total * tip, 2)], [t('r_spEach'), M(r, 2), 'key'], [t('r_spN'), n]];
    if (step) rows.push([t('r_spRoundExtra'), M(r * n - bill, 2)]);
    return {hero: {label: t('r_spEach'), value: M(r, 2), sub: t('r_spBill', {n: M(bill, 2)})}, rows, note: t('n_sp2')};
  }
  const P = spList(), N = P.length, nm = (p, i) => asEsc(spName(p, i));
  if (mode === 'paid'){
    const paid = P.map(p => Math.max(0, +p.paid || 0)), T = paid.reduce((a, b) => a + b, 0), each = T / (N || 1);
    const bal = paid.map(x => x - each);
    const cr = bal.map((b, i) => ({i, b})).filter(x => x.b > 0.005).sort((a, b) => b.b - a.b), db = bal.map((b, i) => ({i, b: -b})).filter(x => x.b > 0.005).sort((a, b) => b.b - a.b);
    const moves = []; let ci = 0, di = 0;
    while (ci < cr.length && di < db.length){ const amt = Math.min(cr[ci].b, db[di].b); moves.push([db[di].i, cr[ci].i, amt]); cr[ci].b -= amt; db[di].b -= amt; if (cr[ci].b < 0.005) ci++; if (db[di].b < 0.005) di++; }
    const rows = [[t('r_spTotalPaid'), M(T, 2)], [t('r_spEachShare'), M(each, 2), 'key']].concat(moves.length ? moves.map(([a, b, x]) => [t('r_spOwes', {a: nm(P[a], a), b: nm(P[b], b)}), M(x, 2), 'key']) : [[t('r_spSettled'), '✓']]);
    return {
      hero: {label: t('r_spEachShare'), value: M(each, 2), sub: moves.length ? t('r_spMoves', {n: moves.length}) : t('r_spSettled')},
      rows, note: t('n_sp2'),
      table: {title: t('t_spTable'), open: true, head: ['', t('sp_vPaid'), t('r_spEachShare'), t('r_spBal')], rows: P.map((p, i) => [nm(p, i), M(paid[i], 2), M(each, 2), (bal[i] > 0.005 ? '+' : '') + M(bal[i], 2)])}
    };
  }
  let share, warn = [];
  if (mode === 'ex'){
    const own = P.map(p => Math.max(0, +p.ex || 0)), sum = own.reduce((a, b) => a + b, 0), shared = Math.max(0, total - sum) / (N || 1);
    if (sum > total + 0.005) warn.push(t('w_spExOver'));
    share = own.map(x => (x + shared) * (1 + tip));
  } else {
    const key = mode === 'inc' ? 'inc' : mode === 'pct' ? 'pct' : 'sh';
    const w = P.map(p => Math.max(0, +p[key] || 0)), sw = w.reduce((a, b) => a + b, 0);
    if (mode === 'pct' && Math.abs(sw - 100) > 0.01) warn.push(t('w_spPctSum', {n: Math.round(sw * 100) / 100}));
    share = w.map(x => sw > 0 ? bill * x / sw : bill / (N || 1));
  }
  const r = share.map(x => spRoundUp(x, step)), sumR = r.reduce((a, b) => a + b, 0);
  const rows = [[t('r_spBillRow'), M(bill, 2)]].concat(P.map((p, i) => [t('r_spPays', {x: nm(p, i)}), M(r[i], 2), 'key']));
  if (step) rows.push([t('r_spRoundExtra'), M(sumR - bill, 2)]);
  const top = r.indexOf(Math.max(...r));
  return {
    hero: {label: t('r_spPays', {x: nm(P[top], top)}), value: M(r[top], 2), sub: t('r_spBill', {n: M(bill, 2)})},
    rows, note: t('n_sp2'), warn,
    table: {title: t('t_spTable'), open: N > 2, head: ['', t('r_spAmt'), t('r_spPct')], rows: P.map((p, i) => [nm(p, i), M(r[i], 2), PC(sumR > 0 ? r[i] / sumR * 100 : 0)])},
    split: {title: t('r_spBillRow'), items: P.map((p, i) => ({name: nm(p, i), v: r[i], cls: SP_CLS[i % SP_CLS.length], fmt: M(r[i], 2)}))}
  };
}

Object.assign(CALC, {severance: calcSeverance, notice: calcNotice, leave: calcLeave, purchasetax: calcPurchaseTax, landtax: calcLandTax,
  refi: calcRefi, loancmp: calcLoanCmp, prepay: calcPrepay, savegoal: calcSaveGoal, retire: calcRetire, creditcard: calcCredit,
  rentbuy: calcRentBuy, carlease: calcCar, avgcost: calcAvgCost, breakeven: calcBreakEven, split: calcSplit});
