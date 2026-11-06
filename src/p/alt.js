/* ---------- 13.77: where to put the money – the comparison engine ----------
   Every option gets the same money on the same dates: the sum today (month 0) and the monthly addition at the start of months 2…n.
   • current account: nothing grows.
   • deposit: depSim (the deposits engine), a fixed shekel deposit renewed every year, 15% tax.
   • stock market: month by month at (1 + return − fees)^(1/12) − 1; fees = the value without fees − with fees;
     tax 25% of the real gain (the gain beyond inflation on each deposit).
   • paying off a loan: the part that pays the loan (after the fee, up to the balance) is worth its interest saved,
     part × (1 + loan rate/12)^n, tax-free; what is left, and the monthly addition, go to the deposit.
   • real value: the end amount ÷ (1 + inflation)^(years). The options differ in risk and access – shown beside every number. */
CALC.altcmp = function(){
  const lump = Math.max(0, v('ac_lump')), mon = Math.max(0, v('ac_mon')), n = Math.round(clamp(v('ac_yrs'), 0.25, 50) * 12), cpi = v('ac_cpi');
  const put = lump + mon * Math.max(0, n - 1), disc = Math.pow(1 + cpi / 100, n / 12);
  const deps = [[0, lump]]; for (let m = 1; m < n; m++) if (mon > 0) deps.push([m, mon]);
  const infl = deps.reduce((s, [m, d]) => s + d * (Math.pow(1 + cpi / 100, (n - m) / 12) - 1), 0);
  const fvAt = yr => { const r = Math.pow(1 + yr / 100, 1 / 12) - 1; let b = 0; for (let m = 0; m < n; m++){ b += deps.filter(d => d[0] === m).reduce((a, d) => a + d[1], 0); b *= 1 + r; } return b; };
  const A = [];
  A.push({k: 'cash', fin: put, gain: 0, tax: 0, fee: 0, risk: 'ac_rNone', liq: 'ac_lNow'});
  const dep = depSim({kind: 'fix', amt: lump, add: mon, mo: n, rate: v('ac_depRate'), comp: 'year', cpi, tax: 'auto'});
  A.push({k: 'dep', fin: dep.fin, gain: dep.net + dep.tax, tax: dep.tax, fee: 0, risk: 'ac_rLow', liq: 'ac_lDep'});
  const ret = v('ac_mktRet'), fee = Math.max(0, v('ac_mktFee')), g0 = fvAt(ret), g1 = fvAt(ret - fee), mg = g1 - put, mt = Math.max(0, mg - infl) * 0.25;
  A.push({k: 'mkt', fin: g1 - mt, gain: mg, tax: mt, fee: g0 - g1, risk: 'ac_rHigh', liq: 'ac_lMkt'});
  const bal = Math.max(0, v('ac_loanBal'));
  if (bal > 0){
    const lf = Math.max(0, v('ac_loanFee')), part = clamp(lump - lf, 0, bal), rest = Math.max(0, lump - lf - part);
    const saved = part * Math.pow(1 + Math.max(0, v('ac_loanRate')) / 1200, n);
    const d2 = depSim({kind: 'fix', amt: rest, add: mon, mo: n, rate: v('ac_depRate'), comp: 'year', cpi, tax: 'auto'});
    const fin = saved + d2.fin;
    A.push({k: 'loan', fin, gain: fin - put, tax: d2.tax, fee: Math.min(lf, lump), risk: 'ac_rNone', liq: 'ac_lLoan'});
  }
  A.forEach(a => { a.real = a.fin / disc; a.name = t('ac_' + a.k); });
  const S = A.slice().sort((a, b) => b.fin - a.fin), best = S[0];
  const warn = [t('w_ac')]; if (n < 36) warn.push(t('w_acShort'));
  const rows = [[t('r_acPut'), M(put, 2)]].concat(S.map(a => [t('r_acFin', {x: a.name}), M(a.fin, 2), a === best ? 'key' : '']));
  return {
    hero: {label: t('r_acHero'), value: M(best.fin, 2), sub: t('r_acSub', {x: best.name, v: M(best.real, 2)})},
    rows, warn, note: t('n_ac'),
    table: {title: t('t_ac'), open: true, head: ['', t('h_acFin'), t('h_acGain'), t('h_acTax'), t('h_acFee'), t('h_acReal'), t('h_acRisk'), t('h_acLiq')],
      rows: S.map(a => [a.name, M(a.fin, 2), M(a.gain, 2), M(a.tax, 2), M(a.fee, 2), M(a.real, 2), t(a.risk), t(a.liq)])},
    chart: {title: t('c_ac'), unit: '', fmt: x => M(x), labels: A.map(a => a.name),
      layers: [{name: t('l_acPut'), cls: 'c-ink', values: A.map(() => put)}, {name: t('l_acGain'), cls: 'c-warm', values: A.map(a => Math.max(0, a.fin - put))}]}
  };
};
