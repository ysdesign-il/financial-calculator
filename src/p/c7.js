/* --- interest & prime (Israel: prime = Bank of Israel rate + 1.5%) --- */
var PRIME_SPREAD = 1.5;
function calcPrime(){
  const mode = $('#pr_mode').value, amt = Math.max(0, v('pr_amt'));
  const boi = Math.max(0, v('pr_boi')), prime = boi + PRIME_SPREAD, margin = v('pr_margin');
  const base = Math.max(0, prime + margin);
  const sgn = x => (x >= 0 ? '+' : '−') + N(Math.abs(x), null, 2) + '%';
  const rateTxt = t('r_prRateIs', {p: PC(prime), m: sgn(margin), r: PC(base)});
  if (mode === 'loan'){
    const n = clamp(Math.round(v('pr_years') * 12), 1, 600), eq = $('#pr_method').value === 'equal';
    const dR = v('pr_dRate'), dAt = clamp(Math.round(v('pr_dAt') * 12), 0, n);
    let bal = amt, pay = 0, first = 0, after = null, totI = 0, curR = -1;
    const Y = []; let yI = 0, yP = 0, yPay = 0;
    for (let m = 1; m <= n && bal > 1e-6; m++){
      const r = Math.max(0, base + (dR && m > dAt ? dR : 0));
      if (r !== curR){ curR = r; if (!eq) pay = pmtOf(bal, r, n - m + 1); if (m > 1 && after == null) after = eq ? amt / n + bal * r / 1200 : pay; }
      const it = bal * r / 1200, pr = eq ? Math.min(bal, amt / n) : Math.min(bal, pay - it);
      const p = it + pr; if (m === 1) first = p;
      bal -= pr; totI += it; yI += it; yP += pr; yPay += p;
      if (m % 12 === 0 || m === n){ Y.push({y: Math.ceil(m / 12), i: yI, p: yP, pay: yPay, bal: Math.max(0, bal), r}); yI = 0; yP = 0; yPay = 0; }
    }
    const at = d => eq ? amt / n + amt * Math.max(0, base + d) / 1200 : pmtOf(amt, Math.max(0, base + d), n);
    const rows = [[t('f_prBoi'), PC(boi)], [t('r_prPrime'), PC(prime)], [t('r_prYour'), PC(base), 'key'],
      [t(eq ? 'r_prFirstEq' : 'r_prPay'), M(first, 2), 'key']];
    if (after != null) rows.push([t('r_prAfter', {d: sgn(dR), y: fmtDur(dAt)}), M(after, 2)]);
    rows.push([t('r_prTotI'), M(totI)], [t('r_prTot'), M(amt + totI)],
      [t('r_prUp'), M(at(1), 2)], [t('r_prDown'), M(at(-1), 2)]);
    return {
      hero: {label: t(eq ? 'r_prFirstEq' : 'r_prPay'), value: M(first, 2), sub: rateTxt},
      rows, note: t('n_prLoan'),
      warn: base <= 0 ? [t('w_prZero')] : null,
      chart: {title: t('c_prYear'), unit: t('w_year'), fmt: x => M(x),
        layers: [{name: t('l_principal'), cls:'c-ink', values: Y.map(y => y.p)}, {name: t('l_interest'), cls:'c-accent', values: Y.map(y => y.i)}],
        labels: Y.map(y => y.y)},
      table: {title: t('t_yearly'), head: [t('w_year'), t('h_prRate'), t('h_prPaid'), t('l_interest'), t('h_prBal')],
        rows: Y.map(y => [y.y, PC(y.r), M(y.pay), M(y.i), M(y.bal)])}
    };
  }
  if (mode === 'overdraft'){
    const days = clamp(Math.round(v('pr_days')), 1, 3650);
    const day = amt * base / 100 / 365, cost = day * days;
    return {
      hero: {label: t('r_prOdCost', {d: days}), value: M(cost, 2), sub: rateTxt},
      rows: [[t('r_prPrime'), PC(prime)], [t('r_prYour'), PC(base), 'key'], [t('r_prOdCost', {d: days}), M(cost, 2), 'key'],
             [t('r_prOdDay'), M(day, 2)], [t('r_prOdMonth'), M(day * 30, 2)], [t('r_prOdYear'), M(day * 365)]],
      note: t('n_prOd')
    };
  }
  if (mode === 'deposit'){
    const mo = clamp(Math.round(v('pr_months')), 1, 600), tax = Math.max(0, v('pr_tax')) / 100, comp = $('#pr_comp').value === 'm';
    const Y = []; let b = amt;
    for (let m = 1; m <= mo; m++){
      b = comp ? b * (1 + base / 1200) : amt * (1 + base / 1200 * m);
      if (m % 12 === 0 || m === mo) Y.push({m, g: b - amt});
    }
    const gross = b - amt, tx = Math.max(0, gross) * tax, net = gross - tx;
    const eff = amt > 0 ? (Math.pow(1 + gross / amt, 12 / mo) - 1) * 100 : NaN;
    return {
      hero: {label: t('r_prNet'), value: M(net, 2), sub: rateTxt},
      rows: [[t('r_prYour'), PC(base)], [t('r_prGross'), M(gross, 2)], [t('r_prTax'), M(-tx, 2)], [t('r_prNet'), M(net, 2), 'key'],
             [t('r_prEnd'), M(amt + net, 2), 'key'], [t('r_prEff'), PC(eff)]],
      note: t('n_prDep'),
      chart: {title: t('c_prDep'), unit: t('w_month'), fmt: x => M(x),
        layers: [{name: t('l_inBase'), cls:'c-ink', values: Y.map(() => amt)}, {name: t('l_interest'), cls:'c-accent', values: Y.map(y => Math.max(0, y.g))}],
        labels: Y.map(y => y.m)}
    };
  }
  if (mode === 'convert'){
    const r = v('pr_rate') / 100, f = parseInt($('#pr_freq').value, 10) || 12;
    const eff = Math.pow(1 + r / f, f) - 1;
    return {
      hero: {label: t('r_prEffA'), value: PC(eff * 100), sub: t('r_prFrom', {r: PC(r * 100)})},
      rows: [[t('r_prNom'), PC(r * 100)], [t('r_prEffA'), PC(eff * 100), 'key'], [t('r_prMon'), PC(r * 100 / 12)],
             [t('r_prMonEff'), PC((Math.pow(1 + eff, 1 / 12) - 1) * 100)], [t('r_prDay'), N(r * 100 / 365, null, 4) + '%'],
             [t('r_prPrimeNow'), PC(MKT.boi + PRIME_SPREAD)]],
      note: t('n_prConv')
    };
  }
  const r = v('pr_rate') / 100, yrs = clamp(Math.round(v('pr_years')), 1, 60);
  const Y = []; for (let y = 1; y <= yrs; y++) Y.push({y, s: amt * r * y, c: amt * (Math.pow(1 + r, y) - 1), cm: amt * (Math.pow(1 + r / 12, 12 * y) - 1)});
  const L = Y[Y.length - 1];
  return {
    hero: {label: t('r_prCm', {n: yrs}), value: M(L.cm), sub: t('r_prSimp') + ': ' + M(L.s)},
    rows: [[t('r_prSimp'), M(L.s)], [t('r_prCy'), M(L.c)], [t('r_prCm', {n: yrs}), M(L.cm), 'key'], [t('r_prDiff'), M(L.cm - L.s)]],
    note: t('n_prSimple'),
    chart: {title: t('c_prSimple'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('r_prSimp'), cls:'c-ink', values: Y.map(y => y.s)}, {name: t('l_prExtra'), cls:'c-accent', values: Y.map(y => Math.max(0, y.cm - y.s))}],
      labels: Y.map(y => y.y)},
    table: {title: t('t_yearly'), head: [t('w_year'), t('r_prSimp'), t('r_prCy'), t('h_prCm')], rows: Y.map(y => [y.y, M(y.s), M(y.c), M(y.cm)])}
  };
}
Object.assign(CALC, {prime: calcPrime});
