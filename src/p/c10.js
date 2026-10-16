/* ================= 8.9: mortgage offers by bank, and pension / provident fund offers by company ================= */
/* ---------- mortgage: each bank's offer is a mix of up to three tracks ---------- */
const MC_BANKS = ['leumi', 'hapoalim', 'discount', 'mizrahi', 'fibi', 'mercantile', 'jerusalem', 'yahav', 'otsar', 'nonother'];
function mcSeed(){
  const tr = (k, s, r, y) => ({k, s, r, y});
  return [{bank: '', n: '', fee: 0, tr: [tr('fix', 34, 5.1, 25), tr('cpi', 33, 3.6, 25), tr('var', 33, 5.5, 25)]},
          {bank: '', n: '', fee: 0, tr: [tr('fix', 34, 5.0, 25), tr('cpi', 33, 3.8, 25), tr('var', 33, 5.3, 25)]}];
}
function mcList(){ if (!Array.isArray(SET.mcOffers) || !SET.mcOffers.length) SET.mcOffers = mcSeed(); return SET.mcOffers; }
function mcName(o, i){ const own = String(o.n || '').trim(); if (own) return own; return o.bank && o.bank !== 'nonother' ? t('lend_' + o.bank) : t('lc_def', {n: i + 1}); }
/* one track, month by month: CPI-linked tracks grow with the index, the rest are plain annuities */
function mcTrack(amt, tr, cpi){
  const n = Math.max(1, Math.round(clamp(+tr.y || 0, 1, 40) * 12)), r = Math.max(0, +tr.r || 0) / 1200, ci = tr.k === 'cpi' ? Math.pow(1 + cpi, 1 / 12) - 1 : 0;
  let bal = amt, paid = 0, first = 0;
  for (let m = 0; m < n && bal > 0.005; m++){
    bal *= 1 + ci;                                                   // indexation first
    const left = n - m, pay = r > 0 ? bal * r / (1 - Math.pow(1 + r, -left)) : bal / left;
    const int = bal * r; bal = Math.max(0, bal - (pay - int)); paid += pay; if (!m) first = pay;
  }
  return {first, paid, n};
}
function calcMortCmp(){
  const L = mcList(), amt = Math.max(0, v('mc_amt')), cpi = Math.max(-99, v('mc_cpi')) / 100;
  if (!(amt > 0)) return {hero: {label: t('r_mcBest'), value: '—'}, rows: []};
  const R = L.map((o, i) => {
    const trs = (o.tr || []).filter(x => (+x.s || 0) > 0), share = trs.reduce((s, x) => s + (+x.s || 0), 0) || 1;
    let first = 0, paid = 0, maxN = 0;
    trs.forEach(x => { const a = amt * (+x.s || 0) / share, r = mcTrack(a, x, cpi); first += r.first; paid += r.paid; maxN = Math.max(maxN, r.n); });
    paid += Math.max(0, +o.fee || 0);
    return {name: mcName(o, i), first, paid, cost: paid - amt, share, maxN};
  });
  const S = R.slice().sort((a, b) => a.paid - b.paid), best = S[0], worst = S[S.length - 1];
  const rows = S.map((o, i) => [(i ? (i + 1) + '. ' : '★ ') + o.name + ' · ' + t('r_mcTotal'), M(o.paid), i ? undefined : 'key']);
  if (S.length > 1) rows.push([t('r_insSave', {a: best.name, b: worst.name}), M(worst.paid - best.paid), 'key']);
  const warn = []; R.forEach(o => { if (Math.abs(o.share - 100) > 0.5) warn.push(t('w_mcShare', {n: o.name, s: N(o.share, 0)})); });
  return {
    hero: {label: t('r_mcBest', {n: best.name}), value: M(best.paid), sub: t('r_mcSub', {m: M(best.first, 0), s: M(worst.paid - best.paid)})},
    rows, warn: warn.slice(0, 3),
    table: {title: t('t_mcCmp'), open: true, head: ['', t('h_mcFirst'), t('h_mcPaid'), t('h_mcCost'), t('h_mcRatio')], rows: S.map(o => [o.name, M(o.first), M(o.paid), M(o.cost), N(o.paid / amt, 2)])},
    note: t('n_mc')
  };
}
/* ---------- pension, provident and study funds: same money, different fees ---------- */
const PC_COS = ['harel', 'migdal', 'clal', 'phoenix', 'menora', 'altshuler', 'meitav', 'more', 'analyst', 'infinity', 'psagot', 'yelin', 'ayalon', 'other'];
function pcSeed(){ return [{co: '', n: '', dep: 1.5, acc: 0.22, ret: ''}, {co: '', n: '', dep: 0, acc: 0.5, ret: ''}]; }
function pcList(){ if (!Array.isArray(SET.pcOffers) || !SET.pcOffers.length) SET.pcOffers = pcSeed(); return SET.pcOffers; }
function pcName(o, i){ const own = String(o.n || '').trim(); if (own) return own; return o.co && o.co !== 'other' ? t('pc_co_' + o.co) : t('lc_def', {n: i + 1}); }
function calcPenCmp(){
  const bal0 = Math.max(0, v('pc_bal')), dep = Math.max(0, v('pc_dep')), yrs = clamp(Math.round(v('pc_yrs')), 1, 50), R0 = Math.max(-99, v('pc_ret'));
  const L = pcList().map((o, i) => {
    const ret = o.ret === '' || o.ret == null || !isFinite(+o.ret) ? R0 : Math.max(-99, +o.ret);
    const df = Math.max(0, +o.dep || 0) / 100, af = Math.max(0, +o.acc || 0) / 100;
    let b = bal0, fees = 0;
    for (let m = 0; m < yrs * 12; m++){
      const g = b * ret / 1200, fa = b * af / 12, fd = dep * df;
      b = b + g - fa + dep - fd; fees += fa + fd;
    }
    return {name: pcName(o, i), b, fees, df, af, ret};
  });
  const S = L.slice().sort((a, b) => b.b - a.b), best = S[0], worst = S[S.length - 1];
  const rows = S.map((o, i) => [(i ? (i + 1) + '. ' : '★ ') + o.name + ' · ' + t('r_pcEnd', {y: yrs}), M(o.b), i ? undefined : 'key']);
  if (S.length > 1) rows.push([t('r_pcGap', {a: best.name, b: worst.name}), M(best.b - worst.b), 'key']);
  return {
    hero: {label: t('r_pcBest', {n: best.name}), value: M(best.b), sub: t('r_pcSub', {y: yrs, s: M(best.b - worst.b), f: M(best.fees)})},
    rows,
    table: {title: t('t_pcCmp'), open: true, head: ['', t('h_pcDep'), t('h_pcAcc'), t('h_pcRet'), t('h_pcFees'), t('h_pcEnd')], rows: S.map(o => [o.name, PC(o.df * 100), PC(o.af * 100), PC(o.ret), M(o.fees), M(o.b)])},
    note: t('n_pc_' + (($('#pc_kind') || {}).value || 'pension')) + ' ' + t('n_pc')
  };
}
Object.assign(CALC, {mortcmp: calcMortCmp, pencmp: calcPenCmp});
