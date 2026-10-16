/* ================= from minus to financial freedom ================= */
const STAGE_KEYS = ['st_minus', 'st_debts', 'st_em', 'st_invest', 'st_free'];

/* --- personal balance sheet --- */
function calcNetWorth(){
  const g = id => Math.max(0, v(id));
  const A = {cash: g('nw_cash'), inv: g('nw_inv'), pen: g('nw_pen'), prop: g('nw_prop'), oth: g('nw_oa')};
  const Lb = {mort: g('nw_mort'), loan: g('nw_loan'), card: g('nw_card'), oth: g('nw_ol')};
  const ta = Object.values(A).reduce((a, b) => a + b, 0), tl = Object.values(Lb).reduce((a, b) => a + b, 0);
  const nw = ta - tl;
  const inc = g('nw_inc'), exp = g('nw_exp'), save = inc - exp;
  const liquid = A.cash + A.inv, bad = Lb.loan + Lb.card + Lb.oth;
  const runway = exp > 0 ? A.cash / exp : NaN;
  const wdr = Math.max(0.01, v('nw_wd') || 4), passive = A.inv * wdr / 100 / 12;
  const stage = nw < 0 ? 0 : bad > 0 ? 1 : (exp > 0 && A.cash < exp * 3) ? 2 : (exp > 0 && passive < exp) ? 3 : 4;
  return {
    hero: {label: t('r_nwNet'), value: M(nw), sub: t('r_nwStage', {s: t(STAGE_KEYS[stage])})},
    rows: [
      [t('r_nwAssets'), M(ta)], [t('r_nwLiab'), M(tl)], [t('r_nwNet'), M(nw), 'key'],
      [t('r_nwLiquid'), M(liquid - bad)], [t('r_nwDebtRatio'), PC(ta > 0 ? tl / ta * 100 : NaN)],
      [t('r_nwSave'), M(save)], [t('r_nwSaveRate'), PC(inc > 0 ? save / inc * 100 : NaN)],
      [t('r_nwRunway'), isFinite(runway) ? N(runway, 1) : '—'], [t('r_nwPassiveN', {p: PC(wdr)}), M(passive)],
      [t('r_nwStageRow'), t(STAGE_KEYS[stage]), 'key']
    ],
    warn: nw < 0 ? [t('w_nwMinus')] : [], warnOk: false,
    note: t('n_nw'),
    split: ta > 0 ? {title: t('r_nwAssets'), items: [
      {name: t('o_nwCash'), v: A.cash, cls:'c-ink', fmt: M(A.cash)}, {name: t('o_nwInv'), v: A.inv, cls:'c-accent', fmt: M(A.inv)},
      {name: t('o_nwPen'), v: A.pen, cls:'c-soft', fmt: M(A.pen)}, {name: t('o_nwProp'), v: A.prop, cls:'c-warm', fmt: M(A.prop)}]} : undefined
  };
}

/* --- debt payoff plan --- */
function debtSim(method, extra){
  const D = [1, 2, 3, 4].map(i => ({i, bal: Math.max(0, v(`dp_b${i}`)), r: Math.max(0, v(`dp_r${i}`)) / 1200, min: Math.max(0, v(`dp_m${i}`)), done: 0})).filter(d => d.bal > 0);
  let m = 0, int = 0; const order = [];
  while (D.some(d => d.bal > 0.005) && m < 1200){
    m++;
    D.forEach(d => { if (d.bal > 0){ const i = d.bal * d.r; d.bal += i; int += i; } });
    let pool = extra;
    D.forEach(d => { if (d.bal > 0){ const p = Math.min(d.min, d.bal); d.bal -= p; } else pool += d.min; });
    if (method !== 'min'){
      const act = D.filter(d => d.bal > 0.005).sort((a, b) => method === 'ava' ? b.r - a.r : a.bal - b.bal);
      for (const d of act){ if (pool <= 0) break; const p = Math.min(pool, d.bal); d.bal -= p; pool -= p; }
    }
    D.forEach(d => { if (d.bal <= 0.005 && !d.done){ d.done = m; order.push(d.i); } });
  }
  return {m, int, order, left: D.reduce((a, d) => a + Math.max(0, d.bal), 0), total: D.reduce((a, d) => a + 0, 0)};
}
function calcDebtPlan(){
  const extra = Math.max(0, v('dp_extra')), method = $('#dp_method').value;
  const total = [1, 2, 3, 4].reduce((a, i) => a + Math.max(0, v(`dp_b${i}`)), 0);
  const res = {ava: debtSim('ava', extra), snow: debtSim('snow', extra), min: debtSim('min', 0)};
  const sel = res[method];
  const stuck = sel.left > 0.5;
  const nm = k => ({ava: t('o_dpAva'), snow: t('o_dpSnow'), min: t('o_dpMin')})[k];
  const d1 = new Date(); d1.setMonth(d1.getMonth() + sel.m);
  const when = new Intl.DateTimeFormat(locOf(), {year:'numeric', month:'long'}).format(d1);
  const saved = res.min.left > 0.5 ? NaN : res.min.int - sel.int;
  return {
    hero: stuck ? {label: t('r_dpTime'), value: '—', sub: t('w_dpStuck')} : {label: t('r_dpTime'), value: fmtDur(sel.m), sub: t('r_dpWhen', {d: when})},
    rows: [
      [t('r_dpTotal'), M(total)], [t('r_dpTime'), stuck ? '—' : fmtDur(sel.m), 'key'], [t('r_dpInt'), M(sel.int)],
      [t('r_dpSaved'), isFinite(saved) ? M(saved) : t('r_na')], [t('r_dpOrder'), sel.order.map(i => '#' + i).join(' → ') || '—']
    ],
    warn: stuck ? [t('w_dpStuck')] : [],
    note: t('n_dp'),
    table: {title: t('t_compare'), open: true, head: [t('f_dpMethod'), t('r_dpTime'), t('r_dpInt')],
      rows: ['ava', 'snow', 'min'].map(k => [nm(k), res[k].left > 0.5 ? '—' : fmtDur(res[k].m), M(res[k].int)])}
  };
}

/* --- FIRE --- */
function calcFire(){
  const age = v('fi_age'), exp = Math.max(0, v('fi_exp')), have = Math.max(0, v('fi_have')), dep = Math.max(0, v('fi_dep'));
  const r = v('fi_ret'), infl = Math.max(0, v('fi_infl')), wd = Math.max(0.5, v('fi_wd'));
  const oth = Math.min(exp, Math.max(0, v('fi_other'))), cover = exp - oth;
  const rm = mRate(r), im = mRate(infl);
  const todayNum = cover * 12 / (wd / 100);
  let bal = have, m = 0, reached = bal >= todayNum;
  while (!reached && m < 1200){
    m++; bal = bal * (1 + rm) + dep * Math.pow(1 + im, 0);
    if (bal >= todayNum * Math.pow(1 + im, m / 12)) reached = true;
  }
  const yrs = m / 12, target = todayNum * Math.pow(1 + im, yrs);
  const coastAt = clamp(v('fi_cAge') || 65, 30, 90), cy = Math.max(0, coastAt - age);
  const coast = todayNum * Math.pow(1 + im, cy) / Math.pow(1 + rm, cy * 12);
  const alt = [3, 3.5, 4, 5].map(w => [PC(w), M(cover * 12 / (w / 100))]);
  return {
    hero: reached ? {label: t('r_fiYears'), value: fmtDur(m), sub: t('r_fiAge', {a: N(age + yrs, 1)})} : {label: t('r_fiYears'), value: '—', sub: t('w_fiFar')},
    rows: [
      [t('r_fiNum'), M(todayNum), 'key'], [t('r_fiNumNom'), reached ? M(target) : '—'], [t('r_fiIncome'), M(cover)],
      [t('r_fiYears'), reached ? fmtDur(m) : '—', 'key'], [t('r_fiProgress'), PC(todayNum > 0 ? Math.min(100, have / todayNum * 100) : NaN)],
      [t('r_fiCoastN', {a: N(coastAt)}), M(coast)], [t('r_fiCoastHave'), have >= coast ? t('o_yes') : t('o_no')]
    ],
    warn: reached ? [] : [t('w_fiFar')],
    note: t('n_fi'),
    table: {title: t('t_fiAlt'), head: [t('f_fiWd'), t('r_fiNum')], rows: alt}
  };
}

/* --- roadmap --- */
function calcFreedom(){
  const inc = Math.max(0, v('fr_inc')), exp = Math.max(0, v('fr_exp')), s0 = inc - exp;
  let debt = Math.max(0, v('fr_debt')), dr = Math.max(0, v('fr_drate')) / 1200, assets = Math.max(0, v('fr_assets'));
  const emT = Math.max(0, v('fr_em')) * exp, ret = v('fr_ret'), wd = Math.max(0.5, v('fr_wd')), raise = Math.max(0, v('fr_raise'));
  const rm = mRate(ret), fiT = exp * 12 / (wd / 100);
  const start = assets - debt;
  const st = {debt: debt <= 0 ? 0 : null, em: null, fi: null};
  if (s0 <= 0) return {hero: {label: t('r_frTime'), value: '—', sub: t('w_frNoSurplus')}, rows: [[t('r_frSurplus'), M(s0)], [t('r_frStart'), M(start)]], warn: [t('w_frNoSurplus')], note: t('n_fr')};
  let m = 0; const Y = [[0, M(start)]];
  while (m < 960 && st.fi === null){
    m++;
    const s = s0 * Math.pow(1 + raise / 100, Math.floor((m - 1) / 12));
    assets *= 1 + rm;
    let pool = s;
    if (debt > 0){
      debt += debt * dr; const p = Math.min(debt, pool); debt -= p; pool -= p;
      if (debt <= 0.005){ debt = 0; if (st.debt === null) st.debt = m; }
    }
    assets += pool;
    if (debt <= 0 && st.em === null && assets >= emT) st.em = m;
    if (debt <= 0 && assets >= fiT) st.fi = m;
    if (m % 12 === 0) Y.push([m / 12, M(assets - debt)]);
  }
  if (st.debt === 0 && st.em === null && assets >= emT) st.em = 0;
  if (st.em === null && st.fi !== null) st.em = Math.min(st.fi, st.debt || 0);
  const done = st.fi !== null;
  const fiDate = new Date(); fiDate.setMonth(fiDate.getMonth() + (st.fi || 0));
  const when = new Intl.DateTimeFormat(locOf(), {year:'numeric', month:'long'}).format(fiDate);
  const f = x => x === null ? '—' : x === 0 ? t('r_frNow') : fmtDur(x);
  return {
    hero: done ? {label: t('r_frTime'), value: fmtDur(st.fi), sub: t('r_frWhen', {d: when})} : {label: t('r_frTime'), value: '—', sub: t('w_frFar')},
    rows: [
      [t('r_frStart'), M(start), 'key'], [t('r_frSurplus'), M(s0)], [t('r_frS1'), f(st.debt)], [t('r_frS2'), f(st.em)], [t('r_frS3'), done ? fmtDur(st.fi) : '—', 'key'],
      [t('r_frEmT'), M(emT)], [t('r_frFiT'), M(fiT)]
    ],
    warn: done ? [] : [t('w_frFar')],
    note: t('n_fr'),
    table: {title: t('t_frYears'), head: [t('w_year'), t('r_nwNet')], rows: Y.slice(0, 41)}
  };
}
Object.assign(CALC, {networth: calcNetWorth, debtplan: calcDebtPlan, fire: calcFire, freedom: calcFreedom});
