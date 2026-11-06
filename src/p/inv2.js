/* ---------- 13.76: investments – scenarios and horizons on "compound interest", and the 13 investment channels by risk ----------
   Scenarios and horizons run the same compound-interest engine again with another return or term (no second formula).
   The channels: each has a risk band (1 low … 6 very high), a rough historical yearly volatility and its access.
   The mix: weighted risk band and weighted volatility (an upper bound – spreading lowers it), and the share available within days.
   A bad year ≈ the weighted volatility below zero (about one year in six, as a rough normal-curve guide). */
const calcComp2 = CALC.compound;
CALC.compound = function(){
  const res = calcComp2.apply(this, arguments);
  try {
    const mode = (document.getElementById('c_mode') || {}).value || 'final';
    if (!res || !res.rows || mode !== 'final') return res;
    const R = document.getElementById('c_rate'), Y = document.getElementById('c_years'), B = document.getElementById('c_bench'); if (!R || !Y) return res;
    const r0 = R.value, y0 = Y.value, b0 = B ? B.value : null, rate = v('c_rate'), yrs = v('c_years'), gap = Math.max(0, v('c_spread'));
    const at = (r, y) => { R.value = String(r); Y.value = String(y); if (B) B.value = 'manual'; let x = null; try { x = calcComp2.call(this); } catch (e) {} return x && x.hero ? x.hero.value : '—'; };
    try {
      if (gap > 0){
        res.rows.push([t('r_cScenLo', {r: PC(rate - gap)}), at(rate - gap, yrs)], [t('r_cScenMid', {r: PC(rate)}), at(rate, yrs)], [t('r_cScenHi', {r: PC(rate + gap)}), at(rate + gap, yrs)]);
      }
      [[3, 'r_cHorS'], [10, 'r_cHorM'], [25, 'r_cHorL']].filter(h => Math.abs(h[0] - yrs) > 0.01).forEach(([y, k]) => res.rows.push([t(k, {y: fmtDur(y * 12)}), at(rate, y)]));
    } finally { R.value = r0; Y.value = y0; if (B && b0 != null) B.value = b0; }
    res.note = (res.note ? res.note + ' ' : '') + t('n_cScen');
  } catch (e) {}
  return res;
};
/* [field, risk band 1–6 (0 = varies, counted as 3), yearly volatility %, liquid within days] – rough, historical, not a forecast */
const IR_CH = [
  ['tbill', 1, 0.5, 1], ['gov', 2, 5, 1], ['corp', 3, 7, 1], ['mmf', 1, 0.5, 1], ['mutual', 0, 10, 1], ['etf', 0, 15, 1], ['index', 4, 17, 1],
  ['stock', 5, 35, 1], ['re', 4, 15, 0], ['gold', 3, 15, 1], ['fx', 5, 10, 1], ['crypto', 6, 70, 1], ['alt', 5, 20, 0]
];
CALC.invrisk = function(){
  const w = IR_CH.map(c => Math.max(0, v('ir_' + c[0]))), sum = w.reduce((a, b) => a + b, 0), warn = [];
  const tbl = {title: t('t_ir'), open: false, head: ['', t('h_irRisk'), t('h_irVol'), t('h_irLiq'), t('h_irKnow')],
    rows: IR_CH.map(c => [t('ir_n_' + c[0]), c[1] ? t('ir_r' + c[1]) : t('ir_var'), '±' + N(c[2], c[2] < 1 ? 1 : 0) + '%', t(c[3] ? 'ir_liqD' : 'ir_liqS'), t('ir_k_' + c[0])])};
  if (!(sum > 0)) return {hero: {label: t('r_irHero'), value: '—', sub: ''}, rows: [], warn: [t('w_irEmpty')], note: t('n_ir'), table: tbl};
  if (Math.abs(sum - 100) > 0.05) warn.push(t('w_irSum', {s: PC(sum)}));
  const sh = w.map(x => x / sum);
  const band = IR_CH.reduce((a, c, i) => a + sh[i] * (c[1] || 3), 0), vol = IR_CH.reduce((a, c, i) => a + sh[i] * c[2], 0);
  const liq = IR_CH.reduce((a, c, i) => a + sh[i] * c[3], 0) * 100, lvl = clamp(Math.round(band), 1, 6);
  const rows = [[t('r_irSum'), PC(sum)], [t('r_irVol'), '±' + PC(vol)], [t('r_irBad'), '−' + PC(vol)], [t('r_irLiq'), PC(liq)]];
  IR_CH.forEach((c, i) => { if (w[i] > 0) rows.push([t('ir_n_' + c[0]) + ' · ' + (c[1] ? t('ir_r' + c[1]) : t('ir_var')), PC(sh[i] * 100)]); });
  const grp = [[1, 2, 'ir_r1', 'c-soft'], [3, 3, 'ir_r3', 'c-accent'], [4, 5, 'ir_g45', 'c-warm'], [6, 6, 'ir_r6', 'c-ink']];
  const items = grp.map(([a, b, k, cls]) => { const val = IR_CH.reduce((s, c, i) => { const bb = c[1] || 3; return s + (bb >= a && bb <= b ? sh[i] * 100 : 0); }, 0); return {name: t(k), v: val, cls, fmt: ''}; });
  return {hero: {label: t('r_irHero'), value: t('ir_r' + lvl), sub: t('r_irSub', {v: PC(vol)})}, rows, warn, note: t('n_ir'), table: tbl,
    split: {title: t('sp_irRisk'), items}};
};

try { if (typeof UX_NOSIMPLE !== 'undefined' && Array.isArray(UX_NOSIMPLE)) UX_NOSIMPLE.push('invrisk'); } catch (e) {}   /* one list of channels – hiding part of it would mislead */
