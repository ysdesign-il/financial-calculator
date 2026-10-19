/* ================= new tools (2026 figures) ================= */
const pvOf = (pm, rate, n) => { const r = rate / 1200; return n <= 0 ? 0 : r === 0 ? pm * n : pm * (1 - Math.pow(1 + r, -n)) / r; };
const sgnPC = x => (x > 0 ? '+' : '') + PC(x);
function netOf(g, pts, o){ return salaryCalc(Math.max(0, g), pts, 6, 0, Object.assign({bonus: 0, benefit: 0, erPens: 6.5, erSev: 6, erStudy: 0}, o || {})); }

/* --- overtime and hourly pay --- */
function calcOvertime(){
  const basis = $('#ot_basis').value, pts = Math.max(0, v('ot_pts'));
  const h = basis === 'month' ? Math.max(0, v('ot_month')) / 182 : Math.max(0, v('ot_rate'));
  const reg = basis === 'month' ? 182 : Math.max(0, v('ot_reg'));
  const tiers = [['ot_125', 1.25], ['ot_150', 1.5], ['ot_sh', 1.5], ['ot_sh175', 1.75], ['ot_sh200', 2]].map(([id, k]) => ({id, k, hrs: Math.max(0, v(id)), pay: Math.max(0, v(id)) * h * k}));
  const base = basis === 'month' ? Math.max(0, v('ot_month')) : reg * h;
  const extra = tiers.reduce((a, x) => a + x.pay, 0), total = base + extra, hours = reg + tiers.reduce((a, x) => a + x.hrs, 0);
  const net = netOf(total, pts).net;
  const rows = [[t('r_otHour'), MI(h, 2)], [t('r_otBase'), MI(base)]];
  tiers.forEach(x => { if (x.hrs > 0) rows.push([t('r_otTier', {p: Math.round(x.k * 100), n: N(x.hrs, 1)}), MI(x.pay)]); });
  rows.push([t('r_otExtra'), MI(extra), 'key'], [t('r_otTotal'), MI(total), 'key'], [t('r_otHours'), N(hours, 1)], [t('r_otEff'), MI(hours ? total / hours : 0, 2)], [t('r_otNet'), MI(net)]);
  const warn = h > 0 && h < IL26.minHour ? [t('w_otMin', {m: MI(IL26.minHour, 2)})] : [];
  return {hero: {label: t('r_otTotal'), value: MI(total), sub: t('r_otSub', {x: MI(extra), n: MI(net)})}, rows, warn, note: t('n_ot')};
}

/* --- estimated tax refund --- */
function calcTaxRefund(){
  const gross = Math.max(0, v('tr_gross')), paid = Math.max(0, v('tr_paid')), pts = Math.max(0, v('tr_pts'));
  const don = Math.max(0, v('tr_don')), life = Math.max(0, v('tr_life')), pens = Math.max(0, v('tr_pens'));
  const b = taxByBrackets(gross);
  const cDon = don > TAX.donMin ? 0.35 * Math.min(don, gross * 0.3, TAX.donMax) : 0, cLife = 0.25 * life, cPens = 0.35 * Math.min(pens, TAX.pensDepRate * TAX.pensSalaryCap * 12);
  const cPts = pts * TAX.point, credits = cPts + cDon + cLife + cPens;
  const due = Math.max(0, b.tax - credits) + b.sur, refund = paid - due;
  const rows = [[t('r_trBracket'), MI(b.tax)], [t('r_trPts', {n: N(pts, 2)}), MI(-cPts)]];
  if (cDon) rows.push([t('r_trDon'), MI(-cDon)]);
  if (cLife) rows.push([t('r_trLife'), MI(-cLife)]);
  if (cPens) rows.push([t('r_trPens'), MI(-cPens)]);
  if (b.sur) rows.push([t('r_trSur'), MI(b.sur)]);
  rows.push([t('r_trDue'), MI(due), 'key'], [t('r_trPaid'), MI(paid)], [t(refund >= 0 ? 'r_trBack' : 'r_trOwe'), MI(Math.abs(refund)), 'key']);
  const warn = don > 0 && don <= TAX.donMin ? [t('w_trDonMin')] : [];
  return {hero: {label: t(refund >= 0 ? 'r_trBack' : 'r_trOwe'), value: MI(Math.abs(refund)), sub: t('r_trSub', {d: MI(due), p: MI(paid)})}, rows, warn, note: t('n_tr')};
}

/* --- compare job offers --- */
function joPack(o){
  const pts = Math.max(0, v('jo_pts')), hish = Math.max(0, +o.hish || 0);
  const r = salaryCalc(Math.max(0, +o.g || 0), pts, 6, hish > 0 ? 2.5 : 0, {bonus: Math.max(0, +o.bonus || 0), benefit: Math.max(0, +o.car || 0), erPens: Math.max(0, +o.erp || 0), erSev: 6, erStudy: hish});
  const save = r.pens + r.study + r.erP + r.erS + r.erSt, perks = Math.max(0, +o.carv || 0) + Math.max(0, +o.perk || 0);
  return {net: r.net, save, perks, total: r.net + save + perks, gross: r.gross};
}
const sgM = x => (x > 0.5 ? '+' : x < -0.5 ? '−' : '') + MI(Math.abs(x));
function calcJobOffer(){
  const L = joList().map((o, i) => Object.assign(joPack(o), {name: asEsc(joName(o, i))}));
  const S = L.slice().sort((a, b) => b.total - a.total), best = S[0], next = S[1];
  const star = s => (next && s === best ? '★ ' : '') + s.name;
  return {
    hero: next && best.total - next.total < 1 ? {label: t('r_joTie'), value: MI(best.total), sub: t('r_joVs', {x: next.name})}
      : next ? {label: t('r_joBest', {x: best.name}), value: MI(best.total - next.total), sub: t('r_joVs', {x: next.name})} : {label: t('r_joTotalOf', {x: best.name}), value: MI(best.total), sub: t('r_joNet') + ': ' + MI(best.net)},
    rows: next ? [[t('r_joDNet', {x: best.name, y: next.name}), sgM(best.net - next.net)], [t('r_joDSave'), sgM(best.save - next.save)], [t('r_joDPerk'), sgM(best.perks - next.perks)], [t('r_joDYear'), sgM((best.total - next.total) * 12), 'key']]
      : [[t('r_joNet'), MI(best.net)], [t('r_joSave'), MI(best.save)], [t('r_joPerks'), MI(best.perks)]],
    note: t('n_jo'),
    table: next && {title: t('t_compare'), open: true, head: ['', t('r_joTotal'), t('r_joNet'), t('r_joSave'), t('r_joPerks')], rows: S.map(s => [star(s), MI(s.total), MI(s.net), MI(s.save), MI(s.perks)])}
  };
}

/* --- freelancer hourly rate --- */
function selfNet(profit, pts){
  const np = niSelfParts(profit), ni = np.ni + np.health, taxable = Math.max(0, profit - 0.52 * np.ni), b = taxByBrackets(taxable);
  const tax = Math.max(0, b.tax - pts * TAX.point) + b.sur;
  return {net: profit - ni - tax, ni, tax};
}
function calcFreelance(){
  const want = Math.max(0, v('fl_net')) * 12, exp = Math.max(0, v('fl_exp')) * 12, pts = Math.max(0, v('fl_pts'));
  const days = Math.max(0, 52 * 5 - 9 - Math.max(0, v('fl_off'))), hpd = Math.max(0, v('fl_hpd')), bill = Math.max(1, v('fl_bill')) / 100;
  const hrs = days * hpd * bill;
  let lo = 0, hi = want * 3 + 100000;
  for (let i = 0; i < 80; i++){ const mid = (lo + hi) / 2; if (selfNet(mid, pts).net < want) lo = mid; else hi = mid; }
  const buf = Math.max(0, v('fl_buf')) / 100, profit = (lo + hi) / 2, s = selfNet(profit, pts), rev0 = profit + exp, rate0 = hrs > 0 ? rev0 / hrs : 0;
  const rev = rev0 * (1 + buf), rate = rate0 * (1 + buf);
  const murshe = $('#fl_vat').value === 'murshe';
  const rows = [[t('r_flRate'), M(rate)], [t('r_flDay'), M(rate * hpd * bill)], [t('r_flRevM'), M(rev / 12)], [t('r_flRevY'), M(rev), 'key'],
    [t('r_flHours'), N(hrs, 0)], [t('r_flTaxNi'), M((s.tax + s.ni) / 12)], [t('r_flExp'), M(exp / 12)], [t('r_flNet'), M(s.net / 12)]];
  if (murshe) rows.splice(1, 0, [t('r_flRateVat'), M(rate * (1 + IL26.vat)), 'key']);
  if (buf > 0) rows.splice(murshe ? 2 : 1, 0, [t('r_flRateMin'), M(rate0)]);
  return {hero: {label: t('r_flRate'), value: M(rate), sub: t(murshe ? 'r_flSubVat' : 'r_flSub', {v: M(rate * (1 + IL26.vat)), h: N(hrs, 0)})}, rows, note: t('n_fl')};
}

/* --- employer cost --- */
function calcEmpCost(){
  const g = Math.max(0, v('ec_gross'));
  const r = salaryCalc(g, 2.25, 6, 0, {bonus: 0, benefit: 0, erPens: Math.max(0, v('ec_pens')), erSev: Math.max(0, v('ec_sev')), erStudy: Math.max(0, v('ec_hish'))});
  const other = Math.max(0, v('ec_other')), over = g * Math.max(0, v('ec_over')) / 100, total = r.employer + other + over;
  const rows = [[t('r_ecGross'), MI(g)], [t('r_erNi'), MI(r.erNi)], [t('r_erPens'), MI(r.erP)], [t('r_erSev'), MI(r.erS)]];
  if (r.erSt) rows.push([t('r_erStudy'), MI(r.erSt)]);
  if (other) rows.push([t('r_ecOther'), MI(other)]);
  if (over) rows.push([t('r_ecOver'), MI(over)]);
  rows.push([t('r_ecTotal'), MI(total), 'key'], [t('r_ecYear'), MI(total * 12), 'key'], [t('r_ecRatio'), PC(g ? (total / g - 1) * 100 : NaN)], [t('r_ecNet'), MI(r.net)]);
  return {hero: {label: t('r_ecTotal'), value: MI(total), sub: t('r_ecSub', {g: MI(g), p: PC(g ? (total / g - 1) * 100 : NaN)})}, rows, note: t('n_ec'),
    split: {title: t('r_ecTotal'), items: [{name: t('r_ecGross'), v: g, cls: 'c-ink', fmt: MI(g)}, {name: t('r_erNi'), v: r.erNi, cls: 'c-accent', fmt: MI(r.erNi)}, {name: t('l_ecSave'), v: r.erP + r.erS + r.erSt, cls: 'c-warm', fmt: MI(r.erP + r.erS + r.erSt)}, {name: t('r_ecOther'), v: other + over, cls: 'c-soft', fmt: MI(other + over)}]}};
}

/* --- management fees over the years --- */
function mfRun(bal, dep, n, ret, fd, fa){
  const rm = mRate(ret), fm = fa / 100 / 12; let fees = 0;
  for (let m = 0; m < n; m++){ const d = dep * (1 - fd / 100); fees += dep - d; bal = (bal + d) * (1 + rm); const f = bal * fm; fees += f; bal -= f; }
  return {bal, fees};
}
function calcMgmtFees(){
  const bal = Math.max(0, v('mf_bal')), dep = Math.max(0, v('mf_dep')), n = Math.max(1, Math.round(v('mf_yrs') * 12)), ret = v('mf_ret');
  const A = mfRun(bal, dep, n, ret, Math.max(0, v('mf_ad')), Math.max(0, v('mf_aa'))), B = mfRun(bal, dep, n, ret, Math.max(0, v('mf_bd')), Math.max(0, v('mf_ba')));
  const Z = mfRun(bal, dep, n, ret, 0, 0), diff = B.bal - A.bal;
  return {hero: {label: t(diff >= 0 ? 'r_mfGain' : 'r_mfLoss'), value: MI(Math.abs(diff)), sub: t('r_mfSub', {n: N(n / 12, 0)})},
    rows: [[t('r_mfBalA'), MI(A.bal)], [t('r_mfBalB'), MI(B.bal)], [t('r_mfDiff'), MI(diff), 'key'], [t('r_mfFeesA'), MI(A.fees)], [t('r_mfFeesB'), MI(B.fees)], [t('r_mfNoFee'), MI(Z.bal)], [t('r_mfShare'), PC(Z.bal ? (Z.bal - A.bal) / Z.bal * 100 : NaN)]],
    note: t('n_mf'), warn: (v('mf_ad') > 6 || v('mf_aa') > 0.5) ? [t('w_mfMax')] : []};
}

/* --- keren hishtalmut --- */
function calcHishtalmut(){
  const self = $('#kh_type').value === 'self', yrs = Math.max(1, v('kh_yrs')), n = Math.round(yrs * 12), ret = v('kh_ret'), fee = Math.max(0, v('kh_fee'));
  let monthly, rows = [], benefit, cgDep;
  if (!self){
    const sal = Math.max(0, v('kh_sal')), er = sal * Math.max(0, v('kh_er')) / 100, ee = sal * Math.max(0, v('kh_ee')) / 100;
    const exMax = IL26.hishCap * IL26.hishErMax, erTax = Math.max(0, er - exMax), mr = marginalRate(sal * 12);
    monthly = er + ee; benefit = Math.min(er, exMax) * 12 * mr; cgDep = Math.min(monthly, IL26.hishCap * 0.1);
    rows.push([t('r_khEr'), MI(er)], [t('r_khEe'), MI(ee)], [t('r_khMonthly'), MI(monthly), 'key'], [t('r_khExMax'), MI(exMax)]);
    if (erTax > 0) rows.push([t('r_khErTax'), MI(erTax)]);
    rows.push([t('r_khBenefitEmp'), MI(benefit)]);
  } else {
    const inc = Math.max(0, v('kh_inc')), dep = Math.max(0, v('kh_dep')), ded = Math.min(dep, IL26.hishSelfCap * 0.045, inc * 0.045), mr = marginalRate(inc);
    monthly = dep / 12; benefit = ded * mr; cgDep = Math.min(dep, IL26.hishSelfCG) / 12;
    rows.push([t('r_khMonthly'), MI(monthly), 'key'], [t('r_khDed'), MI(ded)], [t('r_khBenefitSelf'), MI(benefit)]);
    if (dep > IL26.hishSelfCG) rows.push([t('r_khOverCG'), MI(dep - IL26.hishSelfCG)]);
  }
  const rm = mRate(ret), fm = fee / 100 / 12; let bal = Math.max(0, v('kh_bal')), put = bal;
  for (let m = 0; m < n; m++){ bal = (bal + monthly) * (1 + rm); bal -= bal * fm; put += monthly; }
  const gain = Math.max(0, bal - put), cgSave = gain * (monthly > 0 ? Math.min(1, cgDep / monthly) : 1) * 0.25;
  rows.push([t('r_khPut'), MI(put)], [t('r_khGain'), MI(gain)], [t('r_khBal', {n: N(yrs, 0)}), MI(bal), 'key'], [t('r_khCG'), MI(cgSave)], [t('r_khLiquid'), yrs >= 6 ? t('o_yes') : t('r_khAfter6')]);
  return {hero: {label: t('r_khBal', {n: N(yrs, 0)}), value: MI(bal), sub: t('r_khSub', {b: MI(benefit), c: MI(cgSave)})}, rows, note: t('n_kh')};
}

/* --- savings for every child --- */
function calcKidSave(){
  const age = clamp(v('ks_age'), 0, 18), par = $('#ks_par').value === '1', to = +$('#ks_to').value || 18, ret = v('ks_ret'), fee = Math.max(0, v('ks_fee'));
  const rm = mRate(ret), fm = fee / 100 / 12, dep = IL26.childDep * (par ? 2 : 1), n = Math.round((18 - age) * 12);
  let bal = Math.max(0, v('ks_bal')), gov = 0, parent = 0;
  for (let m = 0; m < n; m++){ bal = (bal + dep) * (1 + rm); bal -= bal * fm; gov += IL26.childDep; if (par) parent += IL26.childDep; }
  let grants = 0;
  const born = new Date().getFullYear() - Math.floor(age), y17 = born >= 2017;                    // born from 2017: grants at 3 and at bar/bat mitzvah instead of 18
  const grantAt = (atAge, amt) => { if (age >= atAge) return; const k = Math.round((atAge - age) * 12); let g = amt; for (let m = k; m < n; m++){ g *= (1 + rm); g -= g * fm; } bal += g; grants += amt; };
  if (y17){ grantAt(3, IL26.kidGrant3); grantAt(($('#ks_sex') || {}).value === 'g' ? 12 : 13, IL26.kidGrant13); }       // bat mitzvah at 12, bar mitzvah at 13 else { bal += IL26.kidGrant18; grants += IL26.kidGrant18; }
  const at18 = bal;
  if (to === 21){ for (let m = 0; m < 36; m++){ bal *= (1 + rm); bal -= bal * fm; } bal += IL26.kidGrant21; grants += IL26.kidGrant21; }
  const gain = Math.max(0, bal - gov - parent - grants - Math.max(0, v('ks_bal')));
  return {hero: {label: t('r_ksAt', {n: to}), value: MI(bal), sub: t('r_ksSub', {d: MI(dep)})},
    rows: [[t('r_ksGov'), MI(gov)], [t('r_ksPar'), MI(parent)], [t('r_ksGrants'), MI(grants)], [t('r_ksGain'), MI(gain)], [t('r_ksAt', {n: 18}), MI(at18)], [t('r_ksAt', {n: to}), MI(bal), 'key']],
    note: t('n_ks')};
}

/* --- unemployment and maternity benefits --- */
function unDaily(w, young){
  const B = IL26.unBase, bands = [[B * 0.5, young ? 0.6 : 0.8], [B * 0.75, young ? 0.4 : 0.5], [B, young ? 0.35 : 0.45], [B * 5, young ? 0.25 : 0.3]];
  let prev = 0, out = 0; for (const [lim, r] of bands){ const part = Math.max(0, Math.min(w, lim) - prev); out += part * r; prev = lim; }
  return out;
}
function unDays(age, dep3){ return age < 25 ? (dep3 ? 138 : 50) : age < 28 ? (dep3 ? 138 : 67) : age < 35 ? (dep3 ? 138 : 100) : age < 45 ? (dep3 ? 175 : 138) : 175; }
function calcBenefits(){
  if ($('#bn_kind').value === 'mat'){
    const w = Math.max(0, v('bn_w3')) / 90, day = Math.min(w, IL26.matMaxDay), days = +$('#bn_wk').value === 8 ? 56 : 105, total = day * days;
    return {hero: {label: t('r_bnMatTotal'), value: MI(total), sub: t('r_bnMatSub', {d: MI(day, 2), n: days})},
      rows: [[t('r_bnDaily'), MI(w, 2)], [t('r_bnDay'), MI(day, 2), 'key'], [t('r_bnDays'), days], [t('r_bnMonth'), MI(day * 30)], [t('r_bnMatTotal'), MI(total), 'key']],
      warn: w > IL26.matMaxDay ? [t('w_bnCap', {m: MI(IL26.matMaxDay, 2)})] : [], note: t('n_bnMat')};
  }
  const age = Math.max(16, v('bn_age')), young = age < 28, w = Math.max(0, v('bn_w6')) / 150, raw = unDaily(w, young);
  const d1 = Math.min(raw, IL26.unMax1), d2 = Math.min(raw, IL26.unMax2), days = unDays(age, $('#bn_dep').value === '3');
  const total = d1 * Math.min(days, 125) + d2 * Math.max(0, days - 125);
  const rows = [[t('r_bnDaily'), MI(w, 2)], [t('r_bnDay'), MI(d1, 2), 'key']];
  if (days > 125 && d2 < d1) rows.push([t('r_bnDay2'), MI(d2, 2)]);
  rows.push([t('r_bnMonth'), MI(d1 * 25), 'key'], [t('r_bnDays'), days], [t('r_bnTotal'), MI(total), 'key'], [t('r_bnPct'), PC(w ? raw / w * 100 : NaN)]);
  return {hero: {label: t('r_bnMonth'), value: MI(d1 * 25), sub: t('r_bnUnSub', {d: MI(d1, 2), n: days})}, rows,
    warn: raw > IL26.unMax1 ? [t('w_bnCap', {m: MI(IL26.unMax1, 2)})] : [], note: t('n_bnUn')};
}

/* --- how big a mortgage can I get --- */
function calcMortCap(){
  const inc = Math.max(0, v('mc_inc')), other = Math.max(0, v('mc_other')), eq = Math.max(0, v('mc_eq')), rate = Math.max(0, v('mc_rate'));
  const n = Math.round(clamp(v('mc_yrs'), 1, 30) * 12), pti = Math.max(1, v('mc_pti')), ltv = {first: 0.75, upgrade: 0.7, invest: 0.5}[$('#mc_type').value] || 0.75;
  const pay = Math.max(0, inc * pti / 100 - other), byPay = pvOf(pay, rate, n), byEq = eq * ltv / (1 - ltv);
  const loan = Math.min(byPay, byEq), price = loan + eq, pm = pmtOf(loan, rate, n);
  const warn = [];
  if (pti > 50) warn.push(t('w_mcPti'));
  if (v('mc_yrs') > 30) warn.push(t('w_mcYrs'));
  return {hero: {label: t('r_mcPrice'), value: MI(price), sub: t('r_mcapSub', {l: MI(loan), p: MI(pm)})},
    rows: [[t('r_mcPay'), MI(pay)], [t('r_mcByPay'), MI(byPay)], [t('r_mcByEq', {p: PC(ltv * 100)}), MI(byEq)], [t('r_mcLoan'), MI(loan), 'key'],
      [t('r_mcLimit'), t(byPay <= byEq ? 'r_mcLimPay' : 'r_mcLimEq')], [t('r_mcPrice'), MI(price), 'key'], [t('r_mcPm'), MI(pm)], [t('r_mcLtv'), PC(price ? loan / price * 100 : NaN)], [t('r_mcPti'), PC(inc ? (pm + other) / inc * 100 : NaN)]],
    warn, note: t('n_mcap')};
}

/* --- company car benefit --- */
function calcCarBenefit(){
  const price = Math.max(0, v('cb_price')), kind = $('#cb_kind').value, g = Math.max(0, v('cb_gross')), pts = Math.max(0, v('cb_pts')), pay = Math.max(0, v('cb_pay'));
  const base = Math.min(price, IL26.carCap) * IL26.carPct, ded = IL26.carDed[kind] || 0, val = Math.max(0, base - ded - pay);
  const a = netOf(g, pts), b = netOf(g, pts, {benefit: val}), cost = a.net - b.net + pay;
  return {hero: {label: t('r_cbCost'), value: MI(cost), sub: t('r_cbSub', {v: MI(val)})},
    rows: [[t('r_cbBase'), MI(base)], [t('r_cbDed'), MI(-ded)], [t('r_cbPay'), MI(-pay)], [t('r_cbVal'), MI(val), 'key'], [t('r_cbNetNo'), MI(a.net)], [t('r_cbNetYes'), MI(b.net)], [t('r_cbCost'), MI(cost), 'key'], [t('r_cbYear'), MI(cost * 12)]],
    warn: price > IL26.carCap ? [t('w_cbCap', {c: MI(IL26.carCap)})] : [], note: t('n_cb')};
}

/* --- electric vs petrol --- */
function calcEvFuel(){
  const km = Math.max(0, v('ev_km')), fp = Math.max(0, v('ev_fp')), fc = Math.max(0, v('ev_fc')), kwh = Math.max(0, v('ev_kwh')), ec = Math.max(0, v('ev_ec'));
  const pub = Math.max(0, v('ev_pub')) / 100, pubp = Math.max(0, v('ev_pubp')), diff = v('ev_diff');
  const fuel = km / 100 * fc * fp + Math.max(0, v('ev_mf')), elec = km / 100 * ec * ((1 - pub) * kwh + pub * pubp) + Math.max(0, v('ev_me'));
  const save = fuel - elec, be = save > 0 && diff > 0 ? diff / save : NaN, hz = clamp(v('ev_hz') || 5, 1, 30);
  return {hero: {label: t(save >= 0 ? 'r_evSave' : 'r_evMore'), value: M(Math.abs(save)), sub: isFinite(be) ? t('r_evBe', {n: N(be, 1)}) : t('r_evPerMonth', {m: M(Math.abs(save) / 12)})},
    rows: [[t('r_evFuelY'), M(fuel)], [t('r_evElecY'), M(elec)], [t('r_evSaveM'), M(save / 12), 'key'], [t('r_evKmF'), M(km ? fuel / km : 0, 2)], [t('r_evKmE'), M(km ? elec / km : 0, 2)], [t('r_evBeRow'), isFinite(be) ? t('r_evYears', {n: N(be, 1)}) : '—'], [t('r_evHzRow', {n: N(hz, null, 1)}), M(save * hz - Math.max(0, diff))]],
    note: t('n_ev'), split: {title: t('r_evYearly'), items: [{name: t('l_evFuel'), v: fuel, cls: 'c-warm', fmt: M(fuel)}, {name: t('l_evElec'), v: elec, cls: 'c-accent', fmt: M(elec)}]}};
}

/* --- appliance power cost --- */
function calcAppliance(){
  const w = Math.max(0, v('ap_w')), h = clamp(v('ap_h'), 0, 24), d = clamp(v('ap_d'), 0, 31), tar = Math.max(0, v('ap_tar')), q = Math.max(1, v('ap_q'));
  const sb = Math.max(0, v('ap_sb')), kwhSb = sb / 1000 * (24 - h) * d * q;
  const kwhM = w / 1000 * h * d * q + kwhSb, cost = kwhM * tar;
  const rows = [[t('r_apHour'), M(w / 1000 * tar * q, 2)], [t('r_apDay'), M((w / 1000 * h + sb / 1000 * (24 - h)) * tar * q, 2)], [t('r_apKwh'), N(kwhM, 1) + ' kWh']];
  if (sb > 0) rows.push([t('r_apSbRow'), M(kwhSb * tar, 2)]);
  rows.push([t('r_apMonth'), M(cost, 2), 'key'], [t('r_apYear'), M(cost * 12), 'key']);
  return {hero: {label: t('r_apMonth'), value: M(cost, 2), sub: t('r_apSub', {k: N(kwhM, 1), y: M(cost * 12)})}, rows, note: t('n_ap')};
}

/* --- unit price at the supermarket --- */
const UP_DIM = {g: ['w', 1], kg: ['w', 1000], ml: ['v', 1], l: ['v', 1000], u: ['u', 1]};
function calcUnitPrice(){
  const L = upList().map((o, i) => { const [dim, k] = UP_DIM[o.u] || UP_DIM.g, base = Math.max(0, +o.q || 0) * k * Math.max(1, +o.n2 || 1), price = Math.max(0, +o.p || 0);
    const per = base > 0 ? price / base * (dim === 'u' ? 1 : 1000) : NaN; return {name: asEsc(upName(o, i)), dim, per, price, o}; });
  const unit = d => t(d === 'w' ? 'r_upPerKg' : d === 'v' ? 'r_upPerL' : 'r_upPerU');
  const dims = ['w', 'v', 'u'].filter(d => L.some(x => x.dim === d && isFinite(x.per)));
  const bestOf = d => L.filter(x => x.dim === d && isFinite(x.per)).sort((a, b) => a.per - b.per)[0];
  const main = dims.map(d => ({d, b: bestOf(d), n: L.filter(x => x.dim === d && isFinite(x.per)).length})).sort((a, b) => b.n - a.n)[0];
  if (!main) return {hero: {label: t('r_upNone'), value: '—'}, rows: [], note: t('n_up')};
  const rows = [], trows = [];
  dims.forEach(d => { const b = bestOf(d); L.filter(x => x.dim === d && isFinite(x.per)).sort((a, c) => a.per - c.per).forEach(x => {
    const more = b.per > 0 ? (x.per / b.per - 1) * 100 : 0;
    trows.push([(x === b && L.filter(y => y.dim === d).length > 1 ? '★ ' : '') + x.name, M(x.price, 2), M(x.per, 2) + ' ' + unit(d), x === b ? '—' : sgnPC(more)]);
  }); const D = L.filter(x => x.dim === d && isFinite(x.per)).sort((a, c) => a.per - c.per);
    if (D.length > 1){ rows.push([t('r_upSaveVs', {u: unit(d), x: D[1].name}), M(D[1].per - D[0].per, 2), 'key']); if (D.length > 2) rows.push([t('r_upWorst', {x: D[D.length - 1].name}), sgnPC((D[D.length - 1].per / D[0].per - 1) * 100)]); }
  });
  const second = L.filter(x => x.dim === main.d && isFinite(x.per) && x !== main.b).sort((a, b) => a.per - b.per)[0];
  return {hero: {label: t('r_upBest', {x: main.b.name}), value: M(main.b.per, 2), sub: unit(main.d) + (second ? ' · ' + t('r_upCheaper', {p: PC((second.per / main.b.per - 1) * 100), x: second.name}) : '')},
    rows, note: t('n_up') + (dims.length > 1 ? ' ' + t('n_upMix') : ''),
    table: {title: t('t_compare'), open: true, head: ['', t('r_upPrice'), t('r_upPer'), t('r_upMore')], rows: trows}};
}

/* --- discounts and deals --- */
function calcDiscount(){
  const mode = $('#ds_mode').value, p = Math.max(0, v('ds_price')), q = Math.max(1, Math.round(v('ds_qty')));
  let pay = p * q, units = q, label = '';
  if (mode === 'pct'){ pay = p * q * (1 - Math.max(0, v('ds_pct')) / 100); }
  else if (mode === 'stack'){ pay = p * q * (1 - Math.max(0, v('ds_pct')) / 100) * (1 - Math.max(0, v('ds_pct2')) / 100); }
  else if (mode === 'bogo'){ const buy = Math.max(1, Math.round(v('ds_buy'))), free = Math.max(0, Math.round(v('ds_free'))); units = buy + free; pay = p * buy; label = t('r_dsBogo', {b: buy, f: free}); }
  else if (mode === 'second'){ units = 2; pay = p + p * (1 - Math.max(0, v('ds_pct')) / 100); }
  else if (mode === 'nfor'){ units = Math.max(1, Math.round(v('ds_n'))); pay = Math.max(0, v('ds_deal')); }
  else if (mode === 'coupon'){ const c = Math.max(0, v('ds_coupon')), min = Math.max(0, v('ds_min')); pay = p * q >= min ? Math.max(0, p * q - c) : p * q; }
  const full = p * units, save = full - pay, each = units ? pay / units : 0;
  const rows = [[t('r_dsFull'), M(full, 2)], [t('r_dsPay'), M(pay, 2), 'key'], [t('r_dsSave'), M(save, 2), 'key'], [t('r_dsPct'), PC(full ? save / full * 100 : NaN)], [t('r_dsUnits'), units], [t('r_dsEach'), M(each, 2)]];
  const warn = mode === 'coupon' && p * q < Math.max(0, v('ds_min')) ? [t('w_dsMin', {m: M(v('ds_min'), 2)})] : [];
  return {hero: {label: t('r_dsEach'), value: M(each, 2), sub: t('r_dsSub', {p: PC(full ? save / full * 100 : NaN), s: M(save, 2)}) + (label ? ' · ' + label : '')}, rows, warn, note: t('n_ds')};
}

/* --- working days between dates (Israel) --- */
function wdIndep(year){       // Independence Day, moved by the rules for Friday, Saturday and Monday
  for (let d = new Date(year, 3, 1); d.getMonth() < 6; d.setDate(d.getDate() + 1)){
    const h = holHeb(d); if (h && h[0] === 'Iyar' && h[1] === 5){ const x = new Date(d), dow = x.getDay();
      if (dow === 5) x.setDate(x.getDate() - 1); else if (dow === 6) x.setDate(x.getDate() - 2); else if (dow === 1) x.setDate(x.getDate() + 1); return x; }
  }
  return null;
}
const WD_HOL = [['Tishri', 1, 'hol_rh'], ['Tishri', 2, 'hol_rh2'], ['Tishri', 10, 'hol_yk'], ['Tishri', 15, 'hol_suk'], ['Tishri', 22, 'hol_st'], ['Nisan', 15, 'hol_pes'], ['Nisan', 21, 'hol_pes7'], ['Sivan', 6, 'hol_shav']];
function wdParse(id){ const s = ($('#' + id) || {}).value || ''; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function calcWorkDays(){
  let a = wdParse('wd_from'), b = wdParse('wd_to');
  if (!a || !b) return {hero: {label: t('r_wdWork'), value: '—'}, rows: [], note: t('n_wd')};
  if (b < a){ const x = a; a = b; b = x; }
  const wkMon = (typeof wkStart === 'function' ? wkStart() : 'sun') === 'mon';
  const six = $('#wd_week').value === '6', hol = $('#wd_hol').value === '1', incl = $('#wd_end').value === '1';
  const indep = {}; for (let y = a.getFullYear(); y <= b.getFullYear(); y++){ const d = wdIndep(y); if (d) indep[d.toDateString()] = 1; }
  let cal = 0, work = 0, wkend = 0; const hols = [];
  const end = new Date(b); if (!incl) end.setDate(end.getDate() - 1);
  for (let d = new Date(a); d <= end && cal < 3700; d.setDate(d.getDate() + 1)){
    cal++; const dow = d.getDay(), isWork = wkMon ? (six ? dow !== 0 : dow >= 1 && dow <= 5) : (six ? dow !== 6 : dow <= 4);
    if (!isWork){ wkend++; continue; }
    let hk = '';
    if (hol){ const h = holHeb(d); const f = h && WD_HOL.find(x => x[0] === h[0] && x[1] === h[1]); if (f) hk = f[2]; else if (indep[d.toDateString()]) hk = 'hol_ind'; }
    if (hk){ hols.push([t(hk), d.toLocaleDateString(locOf(), {day: 'numeric', month: 'short', year: 'numeric'})]); continue; }
    work++;
  }
  const off = Math.min(work, Math.max(0, Math.round(v('wd_off')))), net = work - off, hpd = Math.max(0, v('wd_hrs')) || (six ? 7 : 8.4);
  const rows = [[t('r_wdCal'), cal], [t('r_wdWork'), net, 'key'], [t('r_wdWkend'), wkend], [t('r_wdHol'), hols.length]];
  if (off > 0) rows.push([t('r_wdOffRow'), off]);
  rows.push([t('r_wdHrs', {h: N(hpd, null, 1)}), N(net * hpd, 1)], [t('r_wdWeeks'), N(cal / 7, 1)]);
  return {hero: {label: t('r_wdWork'), value: N(net, 0), sub: t('r_wdSub', {c: cal, w: wkend, h: hols.length})},
    rows,
    note: t('n_wd'), table: hols.length ? {title: t('t_wdHol'), open: true, head: [t('r_wdHolName'), t('r_wdDate')], rows: hols} : null};
}

/* --- linkage to the consumer price index or the construction input index --- */
function lkLabel(ym){ const p = String(ym || '').split('-').map(Number); if (p.length < 2 || !p[0]) return String(ym || ''); try { return new Intl.DateTimeFormat(locOf(), {month: 'long', year: 'numeric', timeZone: 'UTC'}).format(Date.UTC(p[0], p[1] - 1, 15)); } catch (e) { return ym; } }
function lkMonths(a, b){ const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); }
function lkSel(k, s){
  const st = (SET.lk && SET.lk[k]) || {}, ms = s.map(x => x[0]), last = ms[ms.length - 1];
  const fs = $('#lk_from'), ts = $('#lk_to');
  let to = ts && ts.dataset.k === k && ms.includes(ts.value) ? ts.value : ms.includes(st.to) ? st.to : last;
  let from = fs && fs.dataset.k === k && ms.includes(fs.value) ? fs.value : ms.includes(st.from) ? st.from : ms[Math.max(0, ms.length - 13)];
  return {from, to};
}
function lkRender(k, s, sel){
  const box = $('#lk_box'); if (!box) return;
  const key = k + '|' + s.length + '|' + s[s.length - 1][0] + '|' + lang;
  if (box.dataset.key !== key){
    const opts = s.slice().reverse().map(x => `<option value="${x[0]}">${asEsc(lkLabel(x[0]))}</option>`).join('');
    box.innerHTML = `<div class="lk-f"><div class="lk-c"><label for="lk_from">${asEsc(t('f_lkFrom'))}</label><div class="control"><select id="lk_from" data-k="${k}">${opts}</select></div></div>
      <div class="lk-c"><label for="lk_to">${asEsc(t('f_lkTo'))}</label><div class="control"><select id="lk_to" data-k="${k}">${opts}</select></div></div></div><p class="fine lk-h">${asEsc(t('h_lkMonth'))}</p>`;
    box.dataset.key = key;
  }
  $('#lk_from').value = sel.from; $('#lk_to').value = sel.to;
}
function calcCpiLink(){
  const amt = Math.max(0, v('lk_amt')), k = $('#lk_idx').value === 'build' ? 'build' : 'cpi', man = $('#lk_src').value === 'manual', fut = clamp(v('lk_fut'), 0, 50);
  const name = t(k === 'build' ? 'ix_build' : 'ix_cpi');
  let v1, v2, m1 = '', m2 = '', months = 0;
  if (man){ v1 = v('lk_v1'); v2 = v('lk_v2'); }
  else {
    const s = typeof ixSeries === 'function' ? ixSeries(k) : [];
    if (s.length < 2) return {hero: {label: t('r_lkVal'), value: '—', sub: t('lk_noData')}, rows: [], note: t('n_lk')};
    const sel = lkSel(k, s); lkRender(k, s, sel); m1 = sel.from; m2 = sel.to;
    const a = s.find(x => x[0] === m1), b = s.find(x => x[0] === m2); v1 = a && a[1]; v2 = b && b[1]; months = lkMonths(m1, m2);
  }
  if (!(v1 > 0 && v2 > 0)) return {hero: {label: t('r_lkVal'), value: '—', sub: t('lk_bad')}, rows: [], note: t('n_lk')};
  const ratio = v2 / v1, val = amt * ratio, ch = (ratio - 1) * 100, ann = Math.abs(months) >= 12 ? (Math.pow(ratio, 12 / months) - 1) * 100 : NaN;
  const yoy = typeof ixEff === 'function' ? ixEff(k === 'build' ? 'buildYoy' : 'cpi') : NaN, futVal = fut > 0 && isFinite(yoy) ? val * Math.pow(1 + yoy / 100, fut) : NaN;
  const rows = [[t('r_lkIdx'), name], [t('r_lkFrom'), N(v1, null, 3) + (m1 ? ' · ' + lkLabel(m1) : '')], [t('r_lkTo'), N(v2, null, 3) + (m2 ? ' · ' + lkLabel(m2) : '')],
    [t('r_lkCh'), sgnPC(ch)], [t('r_lkDiff'), M(val - amt, 2)], [t('r_lkVal'), M(val, 2), 'key']];
  if (months) rows.push([t('r_lkMonths'), N(months)]);
  if (isFinite(ann)) rows.push([t('r_lkAnn'), PC(ann)]);
  if (isFinite(futVal)) rows.push([t('r_lkFut', {n: N(fut), r: PC(yoy)}), M(futVal, 2), 'key']);
  return {hero: {label: t('r_lkVal'), value: M(val, 2), sub: man ? t('r_lkSubM', {c: '\u2066' + sgnPC(ch) + '\u2069'}) : t('r_lkSub', {c: '\u2066' + sgnPC(ch) + '\u2069', f: lkLabel(m1), t: lkLabel(m2)})},
    rows, warn: months < 0 ? [t('w_lkBack')] : [], note: t(k === 'build' ? 'n_lkBuild' : 'n_lkCpi') + ' ' + t('n_lk')};
}
Object.assign(CALC, {cpilink: calcCpiLink});
Object.assign(CALC, {overtime: calcOvertime, taxrefund: calcTaxRefund, joboffer: calcJobOffer, freelance: calcFreelance, empcost: calcEmpCost,
  mgmtfees: calcMgmtFees, hishtalmut: calcHishtalmut, kidsave: calcKidSave, benefits: calcBenefits, mortcap: calcMortCap, carbenefit: calcCarBenefit,
  evfuel: calcEvFuel, appliance: calcAppliance, unitprice: calcUnitPrice, discount: calcDiscount, workdays: calcWorkDays});
