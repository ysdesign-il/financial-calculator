/* ================= 9.0: phone plans, smart split, good and bad loans, employer cost from net ================= */
/* ---------- phone plans: prices as published by the companies (checked October 2026), updated from the site's server ---------- */
var CELL = {
  at: '2026-10-07',
  src: [['Poenta', 'https://www.poenta.co.il/article/cheap-cellular-plans/'], ['PackWise', 'https://packwise.co.il/category/mobile/']],
  plans: [
    {p: '019', n: '170GB דור 5', gb: 170, g5: 1, s: [[1, 25.9]]},
    {p: '019', n: 'BIG DATA 300GB', gb: 300, g5: 1, s: [[1, 39.9]]},
    {p: '019', n: 'לכל החיים 12GB', gb: 12, g5: 0, s: [[1, 19.8]]},
    {p: '019', n: 'WE IT 100GB + חו"ל', gb: 100, g5: 0, ab: 1, s: [[1, 29.9]]},
    {p: 'pelephone', n: '5G 1000GB', gb: 1000, g5: 1, s: [[1, 39.9], [3, 49.9]]},
    {p: 'pelephone', n: '5G MAX 2000GB', gb: 2000, g5: 1, s: [[1, 49.9], [3, 64.9], [25, 99]]},
    {p: 'cellcom', n: '5G 800GB', gb: 800, g5: 1, s: [[1, 39.9], [3, 50], [13, 60]]},
    {p: 'cellcom', n: '4G 400GB', gb: 400, g5: 0, s: [[1, 39.9]]},
    {p: 'partner', n: 'Queen 5G 500GB', gb: 500, g5: 1, s: [[1, 39.9], [13, 49.9]], unk: 1},
    {p: 'golan', n: 'מתגלגלת 300GB', gb: 300, g5: 0, s: [[1, 34.9]]},
    {p: 'golan', n: '400GB עם חו"ל', gb: 400, g5: 0, ab: 1, s: [[1, 39]]},
    {p: 'golan', n: 'דור 5 750GB', gb: 750, g5: 1, s: [[1, 39], [4, 49]]},
    {p: 'golan', n: 'דור 5 + תיקונים 1500GB', gb: 1500, g5: 1, s: [[1, 49], [3, 59]]},
    {p: 'golan', n: 'DATA ONLY 500GB', gb: 500, g5: 1, data: 1, s: [[1, 40]]},
    {p: 'hot', n: 'TOP 250GB', gb: 250, g5: 0, l2: 25, s: [[1, 29.9]]},
    {p: 'wecom', n: '5G ללא הגבלה', gb: 1e6, g5: 1, s: [[1, 35]]},
    {p: 'wecom', n: 'משפחתית 500GB', gb: 500, g5: 0, s: [[1, 30]]},
    {p: 'wecom', n: '5G + חו"ל 5GB', gb: 1e6, g5: 1, ab: 1, fee: 79.9, s: [[1, 60]]},
    {p: 'xphone', n: '500GB', gb: 500, g5: 0, s: [[1, 29.9], [13, 39.9]]},
    {p: 'xphone', n: '750GB 5G', gb: 750, g5: 1, s: [[1, 40], [13, 45]]},
    {p: 'ramilevy', n: '200GB', gb: 200, g5: 0, s: [[1, 25.9]]}
  ]
};
function cellPrice(pl, m, lines){ let pr = 0; (pl.s || []).forEach(([from, x]) => { if (m >= from) pr = x; }); if (lines >= 2 && pl.l2) pr = Math.min(pr, pl.l2); return pr; }
function cellMineList(){ if (!Array.isArray(SET.cellMine)) SET.cellMine = []; return SET.cellMine; }
function cellAll(){
  return CELL.plans.concat(cellMineList().map((o, i) => ({mine: 1, i, p: 'other', n: String(o.n || '').trim() || t('cl_mineDef', {n: i + 1}), gb: +o.gb > 0 ? +o.gb : 1e6, g5: o.g5 ? 1 : 0, ab: o.ab ? 1 : 0,
    s: (+o.pm > 0 && +o.pp > 0) ? [[1, +o.pp], [+o.pm + 1, +o.price || 0]] : [[1, +o.price || 0]]})));
}
const cellName = pl => (pl.mine ? '✍️ ' : '') + (pl.p === 'other' ? '' : t('cp_' + pl.p) + ' · ') + pl.n;
function calcCellCmp(){
  const need = Math.max(0, v('cl_gb')), MO = clamp(Math.round(v('cl_months')), 1, 60), lines = clamp(Math.round(v('cl_lines')), 1, 10), now = Math.max(0, v('cl_now'));
  const w5 = ($('#cl_5g') || {}).value === 'yes', wab = ($('#cl_abroad') || {}).value === 'yes', calls = ($('#cl_calls') || {}).value !== 'no';
  const all = cellAll(), ok = all.filter(pl => pl.gb >= need && (!w5 || pl.g5) && (!wab || pl.ab) && (!calls || !pl.data));
  const R = ok.map(pl => { let tot = (pl.fee || 0); for (let m = 1; m <= MO; m++) tot += cellPrice(pl, m, lines) * lines; return {pl, tot, avg: tot / MO, first: cellPrice(pl, 1, lines), later: cellPrice(pl, MO, lines)}; }).sort((a, b) => a.avg - b.avg);
  const note = t('n_cl', {d: CELL.at.slice(0, 7)}) + ' ' + CELL.src.map(s => s[0]).join(' · ');
  if (!R.length) return {hero: {label: t('r_clNone'), value: '—'}, rows: [], warn: [t('w_clNone')], note};
  const best = R[0], rows = R.slice(0, 6).map((r, i) => [(i ? (i + 1) + '. ' : '★ ') + cellName(r.pl), M(r.avg, 2) + ' ' + t('r_clPerMo'), i ? undefined : 'key']);
  if (now > 0) rows.push([t('r_clSave'), M(Math.max(0, (now - best.avg) * 12)), 'key']);       // what you pay now (all lines) against the best plan
  rows.push([t('r_clMatch', {n: R.length, a: all.length}), '']);
  const warn = [];
  if (best.pl.unk) warn.push(t('w_clUnk', {n: cellName(best.pl)}));
  if (best.first !== best.later) warn.push(t('w_clPromo', {a: M(best.first, 2), b: M(best.later, 2)}));
  return {
    hero: {label: t('r_clBest', {n: cellName(best.pl)}), value: M(best.avg, 2), sub: t('r_clSub', {m: MO, l: lines, t: M(best.tot)})},
    rows, warn,
    table: {title: t('t_clCmp', {m: MO}), open: true, head: ['', t('h_clGb'), '5G', t('h_clFirst'), t('h_clLater'), t('h_clAvg'), t('h_clTot')],
      rows: R.map(r => [cellName(r.pl), r.pl.gb >= 1e6 ? '∞' : N(r.pl.gb, 0), r.pl.g5 ? '✓' : '—', M(r.first, 2), M(r.later, 2), M(r.avg, 2), M(r.tot)])},
    note
  };
}

/* ---------- smart split of your income: needs, wants, investing, safety ---------- */
function calcSmartSplit(){
  const inc0 = Math.max(0, v('ss_inc')), P = ['need', 'want', 'inv', 'safe'].map(k => Math.max(0, v('ss_' + k)));
  const sum = P.reduce((s, x) => s + x, 0), yrs = clamp(Math.round(v('ss_years')), 1, 50);
  const ret = v('ss_ret') / 100, sret = v('ss_safeRet') / 100, infl = v('ss_infl') / 100, grow = v('ss_grow') / 100, tax = Math.max(0, v('ss_tax')) / 100, fee = Math.max(0, v('ss_fee')) / 100;
  const mr = Math.pow(1 + ret - fee, 1 / 12) - 1, ms = Math.pow(1 + sret, 1 / 12) - 1;
  let inv = 0, safe = 0, putI = 0, putS = 0, inc = inc0; const yrRows = [];
  for (let y = 1; y <= yrs; y++){
    for (let m = 0; m < 12; m++){
      inv = inv * (1 + mr) + inc * P[2] / 100; safe = safe * (1 + ms) + inc * P[3] / 100;
      putI += inc * P[2] / 100; putS += inc * P[3] / 100;
    }
    const real = (inv + safe) / Math.pow(1 + infl, y);
    if (y <= 10 || y % 5 === 0 || y === yrs) yrRows.push([String(y), MI(inv), MI(safe), MI(inv + safe), MI(real)]);
    inc *= 1 + grow;
  }
  const gains = Math.max(0, inv - putI) + Math.max(0, safe - putS), net = inv + safe - gains * tax, realNet = net / Math.pow(1 + infl, yrs);
  const amt = P.map(p => inc0 * p / 100), needM = amt[0] || 1;
  const rows = [[t('r_ssNeed', {p: N(P[0], 0)}), MI(amt[0])], [t('r_ssWant', {p: N(P[1], 0)}), MI(amt[1])], [t('r_ssInv', {p: N(P[2], 0)}), MI(amt[2]), 'key'], [t('r_ssSafe', {p: N(P[3], 0)}), MI(amt[3]), 'key'],
    [t('r_ssPut'), MI(putI + putS)], [t('r_ssGain'), MI(gains)], [t('r_ssTaxed'), MI(gains * tax)], [t('r_ssEnd', {y: yrs}), MI(net), 'key'], [t('r_ssReal'), MI(realNet), 'key'],
    [t('r_ssEmerg'), t('r_ssMonths', {n: N(Math.min(safe / needM, 999), 1)})]];
  const warn = [];
  if (Math.abs(sum - 100) > 0.01) warn.push(t(sum > 100 ? 'w_ssOver' : 'w_ssUnder', {p: N(Math.abs(sum - 100), 0), m: MI(Math.abs(inc0 * (sum - 100) / 100))}));
  if (P[0] > 60) warn.push(t('w_ssNeed'));
  if (ret - fee <= infl) warn.push(t('w_ssReal'));
  return {
    hero: {label: t('r_ssHero', {y: yrs}), value: MI(net), sub: t('r_ssSub', {r: MI(realNet), i: MI(amt[2] + amt[3])})},
    rows, warn,
    split: {title: t('r_ssSplitT'), items: [{name: t('o_ssNeedN'), v: amt[0], cls: 'c-ink', fmt: MI(amt[0])}, {name: t('o_ssWantN'), v: amt[1], cls: 'c-soft', fmt: MI(amt[1])}, {name: t('o_ssInvN'), v: amt[2], cls: 'c-accent', fmt: MI(amt[2])}, {name: t('o_ssSafeN'), v: amt[3], cls: 'c-warm', fmt: MI(amt[3])}]},
    table: {title: t('t_ssYears'), head: [t('h_year'), t('o_ssInvN'), t('o_ssSafeN'), t('h_ssTotal'), t('h_ssReal')], rows: yrRows},
    note: t('n_ss')
  };
}

/* ---------- a loan that works for you, and a loan that works against you ---------- */
function calcGoodDebt(){
  const amt = Math.max(0, v('gd_amt')), rate = Math.max(0, v('gd_rate')), yrs = clamp(v('gd_years'), 0.25, 40), n = Math.max(1, Math.round(yrs * 12));
  const use = ($('#gd_use') || {}).value || 'invest', alt = v('gd_alt') / 100, infl = v('gd_infl') / 100;
  const r = rate / 1200, pay = r > 0 ? amt * r / (1 - Math.pow(1 + r, -n)) : amt / n, paid = pay * n, interest = paid - amt;
  const H = use === 'study' ? Math.max(n, 120) : n, ma = Math.pow(1 + alt, 1 / 12) - 1;
  /* what the payments would have grown to if you had kept them (the true cost, in money at the end) */
  let fvPay = 0; for (let m = 1; m <= n; m++) fvPay += pay * Math.pow(1 + ma, H - m);
  const valAt = mo => {
    const y = mo / 12;
    if (use === 'invest' || use === 'property') return amt * Math.pow(1 + v('gd_ret') / 100, y);
    if (use === 'car') return amt * Math.pow(1 - Math.max(0, v('gd_dep')) / 100, y);
    if (use === 'study'){ let s = 0; const inc = Math.max(0, v('gd_inc')); for (let m = 1; m <= mo; m++) s += inc * Math.pow(1 + ma, mo - m); return s; }
    return 0;
  };
  const end = valAt(H), gain = end - fvPay, good = gain > 0, realGain = gain / Math.pow(1 + infl, H / 12);
  /* the same money, saved first: how long until you have it, and the interest you never pay */
  let saveM = 0, bal = 0; while (bal < amt && saveM < 600){ bal = bal * (1 + ma) + pay; saveM++; }
  const yrRows = []; let debt = amt;
  for (let m = 1; m <= H; m++){
    if (m <= n){ debt = debt * (1 + r) - pay; if (debt < 0.01) debt = 0; }
    if (m % 12 === 0 || m === H){ const vA = valAt(m); yrRows.push([N(m / 12, m % 12 ? 1 : 0), MI(debt), MI(vA), MI(vA - debt)]); }
  }
  const effRet = use === 'invest' || use === 'property' ? v('gd_ret') : use === 'car' ? -v('gd_dep') : use === 'consume' ? -100 : NaN;
  const rows = [[t('r_gdPay'), MI(pay)], [t('r_gdPaid'), MI(paid)], [t('r_gdInt'), MI(interest), 'key'], [t('r_gdEnd', {y: N(H / 12, 0)}), MI(end)],
    [t('r_gdCost', {y: N(H / 12, 0)}), MI(fvPay)], [t(good ? 'r_gdGain' : 'r_gdLoss'), MI(Math.abs(gain)), 'key'], [t('r_gdReal'), MI(realGain)]];
  if (isFinite(effRet)) rows.push([t('r_gdVs'), PC(effRet) + ' / ' + PC(rate)]);
  if (saveM < 600) rows.push([t('r_gdSave'), t('r_gdSaveV', {m: fmtDur(saveM), i: MI(interest)})]);
  return {
    hero: {label: t(good ? 'r_gdGood' : 'r_gdBad'), value: (good ? '+' : '−') + MI(Math.abs(gain)), sub: t(good ? 'r_gdGoodSub' : 'r_gdBadSub', {y: N(H / 12, 0), i: MI(interest)})},
    rows, warn: good ? (use === 'invest' ? [t('w_gdRisk')] : []) : [t('w_gdBad_' + use)],
    table: {title: t('t_gdYears'), head: [t('h_year'), t('h_gdDebt'), t('h_gdVal'), t('h_gdNet')], rows: yrRows},
    note: t('n_gd')
  };
}

/* ---------- employer cost: from gross, or from the net you want to pay ---------- */
function ecRun(g){
  return salaryCalc(g, Math.max(0, v('ec_pts')), Math.max(0, v('ec_eeP')), Math.max(0, v('ec_eeS')), {bonus: 0, benefit: 0, erPens: Math.max(0, v('ec_pens')), erSev: Math.max(0, v('ec_sev')), erStudy: Math.max(0, v('ec_hish'))});
}
function calcEmpCost2(){
  const fromNet = ($('#ec_mode') || {}).value === 'net';
  let g = Math.max(0, v('ec_gross'));
  if (fromNet){
    const want = Math.max(0, v('ec_net')); let lo = 0, hi = Math.max(1000, want * 3);
    while (ecRun(hi).net < want && hi < 1e7) hi *= 2;
    for (let i = 0; i < 60; i++){ const mid = (lo + hi) / 2; if (ecRun(mid).net < want) lo = mid; else hi = mid; }
    g = hi;
  }
  const r = ecRun(g), other = Math.max(0, v('ec_other')), over = g * Math.max(0, v('ec_over')) / 100, total = r.employer + other + over;
  const rows = [];
  if (fromNet) rows.push([t('r_ecNeedGross'), MI(g), 'key']);
  rows.push([t('r_ecGross'), MI(g)], [t('r_ecTax'), MI(r.tax)], [t('r_ecNi'), MI(r.ni + r.health)], [t('r_ecEeP'), MI(r.pens)]);
  if (r.study) rows.push([t('r_ecEeS'), MI(r.study)]);
  rows.push([t('r_ecNet'), MI(r.net), 'key'], [t('r_erNi'), MI(r.erNi)], [t('r_erPens'), MI(r.erP)], [t('r_erSev'), MI(r.erS)]);
  if (r.erSt) rows.push([t('r_erStudy'), MI(r.erSt)]);
  if (other) rows.push([t('r_ecOther'), MI(other)]);
  if (over) rows.push([t('r_ecOver'), MI(over)]);
  rows.push([t('r_ecTotal'), MI(total), 'key'], [t('r_ecYear'), MI(total * 12), 'key'], [t('r_ecRatio'), PC(g ? (total / g - 1) * 100 : NaN)], [t('r_ecNetShare'), PC(total ? r.net / total * 100 : NaN)]);
  return {
    hero: {label: t(fromNet ? 'r_ecHeroNet' : 'r_ecTotal', {n: MI(r.net)}), value: MI(total), sub: fromNet ? t('r_ecSubNet', {g: MI(g), n: MI(r.net)}) : t('r_ecSub', {g: MI(g), p: PC(g ? (total / g - 1) * 100 : NaN)})},
    rows, note: t('n_ec') + ' ' + t('n_ec2'),
    split: {title: t('r_ecTotal'), items: [{name: t('r_ecNet'), v: r.net, cls: 'c-ink', fmt: MI(r.net)}, {name: t('r_ecDedAll'), v: r.tax + r.ni + r.health + r.pens + r.study, cls: 'c-soft', fmt: MI(r.tax + r.ni + r.health + r.pens + r.study)}, {name: t('r_erNi'), v: r.erNi, cls: 'c-accent', fmt: MI(r.erNi)}, {name: t('l_ecSave'), v: r.erP + r.erS + r.erSt, cls: 'c-warm', fmt: MI(r.erP + r.erS + r.erSt)}]}
  };
}
Object.assign(CALC, {cellcmp: calcCellCmp, smartsplit: calcSmartSplit, gooddebt: calcGoodDebt, empcost: calcEmpCost2});
