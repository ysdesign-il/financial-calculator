/* --- compound interest --- */
const compRm = o => (1 + Math.pow(1 + o.rate / 100 / o.f, o.f / 12) - 1) * (1 - Math.max(0, o.fee || 0) / 100 / 12) - 1;     // monthly growth after a fee on the balance
function compSim(o, months){
  const rm = compRm(o);
  let bal = o.p0, dep = o.p0, m = 0;
  const hist = [];
  for (; m < months; m++){
    const k = m % 12, y = Math.floor(m / 12);
    if (k === 0 && o.yearly){ bal += o.yearly; dep += o.yearly; }
    const d = o.mo * Math.pow(1 + o.g, y);
    if (o.start){ bal += d; dep += d; bal *= 1 + rm; }
    else { bal *= 1 + rm; bal += d; dep += d; }
    if (k === 11 || m === months - 1) hist.push({y: y + 1, dep, int: bal - dep, bal});
    if (o.goal && bal >= o.goal){ if (k !== 11) hist.push({y: y + 1, dep, int: bal - dep, bal}); m++; break; }
  }
  return {bal, dep, hist, months: m};
}
function calcCompound(){
  const mode = $('#c_mode').value;
  const o = {p0: Math.max(0, v('c_init')), mo: Math.max(0, v('c_monthly')), rate: v('c_rate'), fee: Math.max(0, v('c_mgmt')),
             f: parseInt($('#c_freq').value, 10) || 12, g: v('c_depG') / 100, yearly: Math.max(0, v('c_yearly')),
             start: $('#c_time').value === 'start'};
  const goal = Math.max(0, v('c_goal'));
  const tax = clamp(v('c_tax'), 0, 100) / 100, infl = v('c_infl') / 100;
  let months = clamp(Math.round(v('c_years')), 1, 60) * 12, sim, reached = true;
  if (mode === 'dep'){
    const s0 = compSim(Object.assign({}, o, {mo: 0}), months).bal;
    const s1 = compSim(Object.assign({}, o, {mo: 1}), months).bal;
    o.mo = goal > s0 && s1 > s0 ? (goal - s0) / (s1 - s0) : 0;
    sim = compSim(o, months);
  } else if (mode === 'years'){
    sim = compSim(Object.assign({}, o, {goal}), 1200);
    reached = sim.bal >= goal && goal > 0;
    months = sim.months;
  } else sim = compSim(o, months);
  const yrsUsed = months / 12;
  const bal = sim.bal, dep = sim.dep, gain = bal - dep;
  const ear = Math.pow(1 + o.rate / 100 / o.f, o.f) - 1, earNet = Math.pow(1 + compRm(o), 12) - 1;
  const rows = [];
  if (mode !== 'final') rows.push([t('r_goal'), M(goal)]);
  if (mode === 'dep') rows.push([t('r_needDep'), M(o.mo, 2), 'key']);
  if (mode === 'years') rows.push([t('r_needYears'), reached ? fmtDur(months) : t('r_notReach'), 'key']);
  rows.push([t('r_deposited'), M(dep)], [t('r_intEarned'), M(gain)], [t('r_final'), M(bal), 'key'],
            [t('r_intShare'), PC(bal > 0 ? gain / bal * 100 : NaN)], [t('r_ear'), PC(ear * 100)]);
  if (o.fee > 0){
    rows.push([t('r_netRate'), PC(earNet * 100)]);
    const noFee = compSim(Object.assign({}, o, {fee: 0}), months).bal;
    rows.push([t('r_feeLost'), M(noFee - bal)]);
  }
  let base = bal;
  if (tax > 0 && gain > 0){ base = dep + gain * (1 - tax); rows.push([t('r_netAfterTax'), M(base)]); }
  if (infl > 0) rows.push([t('r_real'), M(base / Math.pow(1 + infl, yrsUsed))]);
  const heroMap = {
    final: {label: t('r_final'), value: M(bal), sub: t('r_intEarned') + ': ' + M(gain)},
    dep: {label: t('r_needDep'), value: M(o.mo, 2), sub: t('r_goal') + ': ' + M(goal)},
    years: {label: t('r_needYears'), value: reached ? fmtDur(months) : '—', sub: reached ? t('r_goal') + ': ' + M(goal) : t('r_notReach')}
  };
  const Y = sim.hist;
  return {
    hero: heroMap[mode], rows,
    chart: {
      title: t('c_growth'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('l_deposits'), cls:'c-ink', values: Y.map(y => y.dep)}, {name: t('l_interest'), cls:'c-accent', values: Y.map(y => Math.max(0, y.int))}],
      labels: Y.map(y => y.y)
    },
    table: {
      title: t('t_yearly'),
      head: [t('w_year'), t('h_deposited'), t('l_interest'), t('w_total')],
      rows: Y.map(y => [y.y, M(y.dep), M(y.int), M(y.bal)])
    }
  };
}
/* --- return --- */
const fvOf = (A, D, R, M) => {
  const i = Math.pow(1 + R, 1 / 12) - 1;
  return Math.abs(i) < 1e-12 ? A + D * M : A * Math.pow(1 + i, M) + D * (Math.pow(1 + i, M) - 1) / i;
};
function solveRate(A, D, B, M){
  let lo = -0.99, hi = 20;
  for (let k = 0; k < 120; k++){ const mid = (lo + hi) / 2; if (fvOf(A, D, mid, M) < B) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function calcYield(){
  const mode = $('#y_mode').value;
  const A = Math.max(0, v('y_start')), D = Math.max(0, v('y_dep'));
  const tax = clamp(v('y_tax'), 0, 100) / 100, infl = v('y_infl') / 100;
  let B = Math.max(0, v('y_end')), R = v('y_rate') / 100;
  let M = v('y_years') * ($('#y_unit').value === 'y' ? 12 : 1);
  if (!(A + D > 0) || (mode !== 'years' && !(M > 0))) return {hero:{label: t('r_avgAnnual'), value:'—'}, rows:[[t('r_invalidY'), '—']]};
  let ok = true;
  if (mode === 'rate') R = solveRate(A, D, B, M);
  else if (mode === 'end') B = fvOf(A, D, R, M);
  else {
    ok = false;
    for (let m = 1; m <= 1200; m++){ if (fvOf(A, D, R, m) >= B){ M = m; ok = true; break; } }
    if (!ok) M = 0;
  }
  const put = A + D * M, gain = B - put;
  const netGain = gain > 0 ? gain * (1 - tax) : gain, Bn = put + netGain;
  const Rn = M > 0 ? solveRate(A, D, Bn, M) : 0;
  const rows = [];
  rows.push([t('r_yPut'), M_(put)], [t('r_yEnd'), M_(B), 'key'], [t('r_gainLoss'), M_(gain)],
            [t('r_totReturn'), PC(put > 0 ? gain / put * 100 : NaN)]);
  if (mode !== 'rate') rows.push([t('r_avgAnnual'), PC(R * 100)]);
  if (mode !== 'years' && M > 0) rows.push([t('r_yYears'), fmtDur(Math.round(M))]);
  if (tax > 0) rows.push([t('r_gainNet'), M_(netGain)], [t('r_annNet'), PC(Rn * 100)]);
  if (infl > 0) rows.push([t('r_annReal'), PC(((1 + Rn) / (1 + infl) - 1) * 100)], [t('r_realFinal'), M_(Bn / Math.pow(1 + infl, M / 12))]);
  if (R > 0) rows.push([t('r_double'), `${N(Math.log(2) / Math.log(1 + R), 1)} ${t('w_years')}`]);
  const hero = {
    rate: {label: t('r_avgAnnual'), value: PC(R * 100), sub: t('r_totReturn') + ': ' + PC(put > 0 ? gain / put * 100 : NaN)},
    end: {label: t('r_yEnd'), value: M_(B), sub: t('r_gainLoss') + ': ' + M_(gain)},
    years: {label: t('r_yYears'), value: ok ? fmtDur(Math.round(M)) : '—', sub: ok ? t('r_yEnd') + ': ' + M_(B) : t('r_notReach')}
  }[mode];
  return {hero, rows, note: D > 0 ? t('r_xirrNote') : undefined};
}
function M_(x){ return M(x); }
/* --- dividends --- */
function calcDividends(){
  const price = v('d_price'), shares0 = v('d_shares'), dps = v('d_dps');
  const f = parseInt($('#d_freq').value, 10) || 1;
  const tp = $('#d_taxP').value;
  const tax = clamp(tp === 'c' ? v('d_tax') : parseFloat(tp), 0, 100) / 100;
  const years = clamp(Math.round(v('d_years')), 1, 60);
  const g = v('d_growth') / 100, pg = v('d_pg') / 100, drip = $('#d_drip').value === '1';
  const invest = price * shares0, yld = price > 0 ? dps / price : NaN;
  const net1 = dps * shares0 * (1 - tax), gross1 = dps * shares0;
  const R = [];
  let sh = shares0, cum = 0;
  for (let i = 0; i < years; i++){
    const d = dps * Math.pow(1 + g, i), gross = sh * d, net = gross * (1 - tax);
    const pEnd = price * Math.pow(1 + pg, i + 1);
    const shStart = sh;
    if (drip) sh += pEnd > 0 ? net / pEnd : 0; else cum += net;
    R.push({i: i + 1, shStart, gross, net, pEnd, cum, value: sh * pEnd, sh});
  }
  const last = R[years - 1];
  const totalNet = R.reduce((a, r) => a + r.net, 0);
  const tr = invest > 0 ? Math.pow((last.value + last.cum) / invest, 1 / years) - 1 : NaN;
  const rows = [
    [t('r_invest'), M(invest)],
    [t('r_divGross'), M(gross1)],
    [t('r_tax', {n: N(tax * 100)}), M(-(gross1 - net1))],
    [t('r_divNet'), M(net1), 'key'],
    [t('r_netPay'), M(net1 / f, 2)],
    [t('r_yGross'), PC(yld * 100)],
    [t('r_yNet'), PC(yld * (1 - tax) * 100)],
    [t('r_grossYear', {n: years}), M(last.gross)],
    [t('r_cumNet', {n: years}), M(totalNet)]
  ];
  if (invest > 0) rows.push([t('r_yoc'), PC(last.gross / invest * 100)]);
  rows.push([t('r_shares'), N(last.sh, 2)], [t('r_portfolio'), M(last.value + last.cum), 'key']);
  if (isFinite(tr)) rows.push([t('r_annualTotal'), PC(tr * 100)]);
  return {
    hero: {label: t('r_divNet'), value: M(net1), sub: t('r_yNet') + ': ' + PC(yld * (1 - tax) * 100)},
    rows, note: t('n_div'),
    chart: {
      title: t('c_portfolio'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('l_valueOnly'), cls:'c-ink', values: R.map(r => r.value)}, {name: t('h_cumNet'), cls:'c-accent', values: R.map(r => r.cum)}],
      labels: R.map(r => r.i)
    },
    table: {
      title: t('t_yearly'),
      head: [t('w_year'), t('h_shares'), t('h_sharePrice'), t('h_net'), t('h_value'), t('h_cumNet')],
      rows: R.map(r => [r.i, N(r.shStart, 2), M(r.pEnd, 2), M(r.net), M(r.value), M(r.cum)])
    }
  };
}

const CALC = {home: calcHome, settings: calcSettings, saved: () => null, convert: calcConvert, vat: calcVat, percent: calcPercent, salary: calcSalary, selfemp: calcSelfemp,
              tax: calcTaxTab, rental: calcRental, capital: calcCapital, loan: calcLoan, mortgage: calcMortgage,
              compound: calcCompound, yield: calcYield, dividends: calcDividends};
function applyWhen(id){
  $$('[data-when]', $('#panel-' + id)).forEach(el => {
    const [cid, vals] = el.dataset.when.split('=');
    const c = $('#' + cid);
    el.hidden = !(c && vals.split('|').includes(String(c.value)));
  });
}
function calc(id){
  applyWhen(id);
  const res = CALC[id]();
  if (res){ show(id, res); renderScn(id); }
}

