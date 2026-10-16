/* --- rental income --- */
function calcRental(){
  const rentM = Math.max(0, v('r_rent')), yr = rentM * 12, other = Math.max(0, v('r_other'));
  const exp = Math.max(0, v('r_exp')), dep = Math.max(0, v('r_dep'));
  const pts = pointsOf('r');
  const E1 = 5654, E2 = 11308;
  const incTax = inc => { const b = taxByBrackets(inc); return Math.max(0, b.tax - pts * TAX.point) + b.sur; };
  const base = incTax(other);
  const taxableM = rentM <= E1 ? 0 : rentM >= E2 ? rentM : 2 * rentM - E2;
  const exemptAvail = rentM < E2;
  const tExempt = incTax(other + taxableM * 12) - base;
  const t10 = yr * 0.10;
  const tReg = incTax(other + Math.max(0, yr - exp - dep)) - base;
  const opts = [[t('r_trackReg'), tReg]];
  opts.push([t('r_track10'), t10]);
  if (exemptAvail) opts.push([t('r_trackExempt'), tExempt]);
  const best = opts.reduce((a, b) => b[1] < a[1] ? b : a);
  const second = opts.filter(o => o !== best).sort((a, b) => a[1] - b[1])[0];
  const rows = [
    [t('r_rentYear'), MI(yr)],
    [t('r_exemptCeil'), MI(E1)],
    [t('r_points'), ptsTxt('r', pts)],
    [t('r_rentTaxM'), MI(best[1] / 12)]
  ];
  if (second) rows.push([t('r_rentSaveVs', {x: second[0]}), MI(second[1] - best[1]), 'key']);
  if (!exemptAvail) rows.push([t('r_rentNoEx'), t('r_na')]);
  rows.push([t('r_netRent'), MI(yr - best[1]), 'key'], [t('r_netRentM'), MI((yr - best[1]) / 12)]);
  return {
    hero: {label: t('r_rentBestH', {x: best[0]}), value: MI(best[1]), sub: t('r_taxLabel', {n: MI(best[1] / 12) + ' / ' + t('o_perMonth')})},
    rows, note: t('n_rental') + ' ' + t('n_points'),
    chart: {
      title: t('r_best'), unit: '', fmt: x => MI(x),
      layers: [{name: t('l_tax'), cls:'c-warm', values: opts.map(o => o[1])}],
      labels: opts.map(o => o[0].split(' ').pop())
    },
    table: {
      title: t('r_best'), open: true,
      head: [t('h_bracket'), t('l_tax'), t('r_netRent')],
      rows: opts.map(o => [o[0], MI(o[1]), MI(yr - o[1])])
    }
  };
}
/* --- capital gains --- */
function calcCapital(){
  const kind = $('#cp_kind').value;
  const rates = {sec:.25, sub:.30, crypto:.25, div:.25, divsub:.30, int15:.15, int25:.25};
  const rate = rates[kind], isGain = ['sec','sub','crypto'].includes(kind);
  const sell = Math.max(0, v('cp_sell')), buy = Math.max(0, v('cp_buy')), fee = Math.max(0, v('cp_fee'));
  const cpi = kind === 'crypto' ? 0 : Math.max(0, v('cp_cpi'));
  const lossCf = Math.max(0, v('cp_loss')), other = Math.max(0, v('cp_other'));
  let nom = sell, infl = 0, real = sell, lossUsed = 0, taxable;
  if (isGain){
    nom = sell - buy - fee;
    infl = nom > 0 ? Math.min(nom, buy * cpi / 100) : 0;
    real = nom - infl;
    lossUsed = Math.min(Math.max(0, real), lossCf);
    taxable = Math.max(0, real - lossUsed);
  } else taxable = sell;
  const tax = taxable * rate;
  const a = surtaxOf(other + taxable, taxable), z = surtaxOf(other, 0);
  const sur = a.s3 - z.s3 + a.s2;
  const totalTax = tax + sur;
  const proceeds = (isGain ? sell - fee : sell) - totalTax;
  const rows = [];
  if (isGain){
    rows.push([t('r_nomGain'), M(nom)]);
    if (cpi > 0) rows.push([t('r_inflPart'), M(-infl)], [t('r_realGain'), M(real)]);
    if (lossUsed > 0) rows.push([t('r_lossUsed'), M(-lossUsed)]);
  }
  rows.push([t('r_taxableGain'), M(taxable)], [t('r_taxRate'), PC(rate * 100)]);
  if (sur > 0) rows.push([t('r_cpTaxBase'), M(tax)], [t('r_surCapTax'), M(sur)]);
  rows.push([t('r_netProceeds'), M(proceeds), 'key'], [t('r_effTax'), PC(isGain ? (nom > 0 ? totalTax / nom * 100 : NaN) : (sell > 0 ? totalTax / sell * 100 : NaN))]);
  return {
    hero: {label: t('r_cpTaxTot'), value: M(totalTax), sub: t('r_netProceeds') + ': ' + M(proceeds)},
    rows, note: t('n_capital'),
    split: {
      title: t('r_netProceeds'),
      items: [
        {name: t('r_netProceeds'), v: Math.max(0, proceeds), cls:'c-ink', fmt: M(proceeds)},
        {name: t('r_taxAmt'), v: totalTax, cls:'c-warm', fmt: M(totalTax)}
      ]
    }
  };
}

/* --- loan engine --- */
function loanSim(o){
  const r = o.rate / 1200, ci = Math.pow(1 + o.ci / 100, 1 / 12) - 1;
  let bal = o.amt, m = 0;
  const out = [];
  while (bal > 0.005 && m < o.n){
    m++;
    const idx = bal * ci; bal += idx;
    const int = bal * r, rem = o.n - m + 1;
    let pr;
    if (m <= o.grace) pr = 0;
    else if (o.type === 'annuity'){
      const pay = r === 0 ? bal / rem : bal * r / (1 - Math.pow(1 + r, -rem));
      pr = pay - int;
    } else if (o.type === 'equal') pr = bal / rem;
    else pr = m >= o.n ? bal : 0;
    if (o.base && o.mode === 'shorten' && m > o.grace && o.base[m - 1] != null) pr = Math.max(0, o.base[m - 1] - int);
    if (o.extra) pr += o.extra;
    if (o.pre && m === o.preM) pr += o.pre;
    pr = Math.min(pr, bal);
    if (m === o.n) pr = bal;
    bal -= pr;
    out.push({int, pr, idx, pay: int + pr, bal: Math.max(0, bal)});
  }
  return out;
}
function yearsOf(sim){
  const Y = [];
  sim.forEach((s, i) => {
    const y = Math.floor(i / 12);
    if (!Y[y]) Y[y] = {pr:0, int:0, idx:0, pay:0, end:0};
    Y[y].pr += s.pr; Y[y].int += s.int; Y[y].idx += s.idx; Y[y].pay += s.pay; Y[y].end = s.bal;
  });
  return Y;
}
function fmtDur(months){
  return t('w_yrsMonths', {y: Math.floor(months / 12), m: months % 12});
}
function calcLoan(){
  const amt = Math.max(0, v('l_amount')), rate = Math.max(0, v('l_rate'));
  const yrs = clamp(v('l_years'), 0.25, 50), type = $('#l_type').value;
  const n = Math.max(1, Math.round(yrs * 12));
  const grace = clamp(Math.round(v('l_grace')), 0, n - 1);
  const extra = Math.max(0, v('l_extra')), pre = Math.max(0, v('l_pre')), preM = clamp(Math.round(v('l_preM')), 1, n);
  const cpi = Math.max(0, v('l_cpi')), feePct = Math.max(0, v('l_feePct')), feeFix = Math.max(0, v('l_feeFix'));
  const cfg = {amt, rate, n, type, grace, ci: cpi, extra: 0, pre: 0, preM};
  const base = loanSim(cfg);
  const has = extra > 0 || pre > 0;
  const sim = has ? loanSim(Object.assign({}, cfg, {extra, pre, mode: $('#l_after').value, base: base.map(x => x.pay)})) : base;
  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const totalInt = sum(sim, 'int'), idxTot = sum(sim, 'idx'), paid = sum(sim, 'pay');
  const fee = amt * feePct / 100 + feeFix;
  /* effective annual cost (IRR on cash flows) */
  const net0 = amt - fee;
  let lo = 0, hi = 1;
  const f = x => sim.reduce((s, c, i) => s + c.pay / Math.pow(1 + x, i + 1), 0) - net0;
  for (let i = 0; i < 100; i++){ const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
  const apr = (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  const first = sim[0] ? sim[0].pay : 0, last = sim.length ? sim[sim.length - 1].pay : 0;
  const peak = sim.reduce((a, c) => Math.max(a, c.pay), 0);
  const grp0 = type === 'annuity' && !has && cpi === 0 && grace === 0;
  const rows = [[t(grp0 ? 'r_monthly' : 'r_firstPay'), M(first, 2)]];
  if (Math.abs(last - first) > 0.01) rows.push([t('r_lastPay'), M(last, 2)]);
  if (peak - first > 0.01 && peak - last > 0.01) rows.push([t('r_peakPay'), M(peak, 2)]);
  rows.push([t('r_loanAmt'), M(amt)], [t('r_totInt'), M(totalInt)]);
  if (idxTot > 0) rows.push([t('r_idxAdd'), M(idxTot)]);
  if (fee > 0) rows.push([t('r_feeTotal'), M(fee)]);
  rows.push([t('r_totPaid'), M(paid + fee), 'key'],
    [t('r_intPct'), PC(amt > 0 ? totalInt / amt * 100 : NaN)],
    [t('r_numPay'), N(sim.length, 0)],
    [t('r_payoff'), fmtDur(sim.length)]);
  if (fee > 0 || cpi > 0) rows.push([t('r_apr'), PC(apr)]);
  if (has){
    rows.push([t('r_intSaved'), M(sum(base, 'int') - totalInt)], [t('r_monthsSaved'), fmtDur(Math.max(0, base.length - sim.length))]);
  }
  const Y = yearsOf(sim);
  const layers = [
    {name: t('l_principal'), cls:'c-ink', values: Y.map(y => y.pr)},
    {name: t('l_interest'), cls:'c-warm', values: Y.map(y => y.int)}
  ];
  if (idxTot > 0) layers.push({name: t('r_idxAdd'), cls:'c-soft', values: Y.map(y => y.idx)});
  const grp = type === 'annuity' && !has && cpi === 0 && grace === 0;
  return {
    hero: {label: t(grp ? 'r_monthly' : 'r_firstPay'), value: M(first, 2), sub: t('r_totInt') + ': ' + M(totalInt)},
    rows,
    chart: {
      title: t('c_loanChart'), unit: t('w_year'), fmt: x => M(x), layers, labels: Y.map((_, i) => i + 1)
    },
    table: {
      title: t('t_amort'),
      head: [t('w_year'), t('l_principal'), t('l_interest'), t('h_balance')],
      rows: Y.map((y, i) => [i + 1, M(y.pr), M(y.int + y.idx), M(y.end)])
    }
  };
}
/* --- mortgage --- */
function calcMortgage(){
  const price = Math.max(0, v('m_price')), down = Math.max(0, v('m_down'));
  const loan = Math.max(0, price - down), ltv = price > 0 ? loan / price * 100 : 0;
  const lim = {first:75, upg:70, inv:50}[$('#m_type').value];
  const income = Math.max(0, v('m_income')), cpi = Math.max(0, v('m_cpi'));
  const rows = [[t('r_mLoan'), M(loan)], [t('r_ltv'), PC(ltv)], [t('r_ltvLimit'), PC(lim)]];
  const sims = [], shareSum = [1,2,3].reduce((s, i) => s + Math.max(0, v('m_s' + i)), 0);
  let varShare = 0, firstTotal = 0;
  [1,2,3].forEach(i => {
    const share = Math.max(0, v('m_s' + i)), kind = $('#m_k' + i).value;
    const years = clamp(v('m_y' + i), 1, 40);
    const s = loanSim({amt: loan * share / 100, rate: Math.max(0, v('m_r' + i)), n: Math.round(years * 12), type: 'annuity',
                       grace: 0, ci: kind === 'cpi' ? cpi : 0, extra: 0, pre: 0, preM: 0});
    if (kind === 'var') varShare += share;
    if (share > 0 && s.length){
      sims.push(s); firstTotal += s[0].pay;
      rows.push([t('r_trackPay', {n: i}), M(s[0].pay)]);
    }
  });
  const sum = k => sims.reduce((a, s) => a + s.reduce((b, x) => b + x[k], 0), 0);
  const totalInt = sum('int') + sum('idx'), paid = sum('pay');
  const pti = income > 0 ? firstTotal / income * 100 : NaN;
  rows.push([t('r_firstTotal'), M(firstTotal), 'key'], [t('r_pti'), PC(pti)],
    [t('r_mTotInt'), M(totalInt)], [t('r_mTotPaid'), M(paid), 'key'],
    [t('r_varShare'), PC(shareSum > 0 ? varShare / shareSum * 100 : 0)]);
  const warn = [];
  if (ltv > lim + 1e-9) warn.push(t('w_ltv', {a: N(ltv, 1), b: lim}));
  if (Math.abs(shareSum - 100) > 0.01) warn.push(t('w_share', {a: N(shareSum, 1)}));
  if (shareSum > 0 && varShare / shareSum * 100 > 66.67) warn.push(t('w_var', {a: N(varShare / shareSum * 100, 1)}));
  if (isFinite(pti) && pti > 50) warn.push(t('w_pti', {a: N(pti, 1)}));
  const Ys = sims.map(yearsOf), len = Math.max(0, ...Ys.map(y => y.length));
  const agg = k => Array.from({length: len}, (_, i) => Ys.reduce((a, y) => a + (y[i] ? y[i][k] : 0), 0));
  const prY = agg('pr'), intY = agg('int').map((x, i) => x + agg('idx')[i]);
  const endY = Array.from({length: len}, (_, i) => Ys.reduce((a, y) => a + (y[i] ? y[i].end : 0), 0));
  return {
    hero: {label: t('r_firstTotal'), value: M(firstTotal), sub: t('r_mLoan') + ': ' + M(loan) + ' · ' + t('r_ltv') + ' ' + PC(ltv)},
    rows, note: t('n_mortgage'),
    warn: warn.length ? warn : [t('w_ok')], warnOk: !warn.length,
    chart: {
      title: t('c_mortChart'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('l_principal'), cls:'c-ink', values: prY}, {name: t('l_interest'), cls:'c-warm', values: intY}],
      labels: prY.map((_, i) => i + 1)
    },
    table: {
      title: t('t_amort'),
      head: [t('w_year'), t('l_principal'), t('l_interest'), t('h_balance')],
      rows: prY.map((x, i) => [i + 1, M(x), M(intY[i]), M(endY[i])])
    }
  };
}
