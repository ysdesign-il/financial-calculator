/* ================= calculators ================= */
const rateOf = (from, to) => RATES[to] / RATES[from];
const dec = (x, c) => CRYPTO[c] ? (Math.abs(x) >= 1000 ? 2 : Math.abs(x) >= 1 ? 4 : 8) : (Math.abs(x) >= 1 ? 2 : 4);
function dateStr(){
  try {
    return new Intl.DateTimeFormat(LOC[lang], {dateStyle:'medium', timeStyle:'short', timeZone:'UTC'})
      .format(new Date(META.unix * 1000)) + ' UTC';
  } catch(e) { return new Date(META.unix * 1000).toUTCString(); }
}
/* --- converter --- */
function calcConvert(){
  const amt = v('x_amount');
  const from = $('#x_from').value, to = $('#x_to').value;
  if (!RATES[from] || !RATES[to]) return null;
  const raw = parseFloat($('#x_rate').value);
  const manual = isFinite(raw) && raw > 0 ? raw : null;
  const fee = Math.max(0, v('x_fee')) / 100;
  const r = manual != null ? manual : rateOf(from, to);
  const gross = amt * r, out = gross * (1 - fee);
  const rows = [
    [t('r_rate'),    `1 ${from} = ${RN(r)} ${to}`],
    [t('r_rateInv'), `1 ${to} = ${RN(1 / r)} ${from}`]
  ];
  if (fee > 0) rows.push(
    [t('r_feeAmt'), M(gross - out, dec(gross, to), to)],
    [t('r_afterFee'), M(out, dec(out, to), to), 'key'],
    [t('r_effRateFee'), `1 ${from} = ${RN(r * (1 - fee))} ${to}`]);
  rows.push(
    [t('r_rateSrc'), manual != null ? t('s_manual') : (META.live ? t('s_live') : META.mkt ? t('s_mkt', {t: typeof rfDataTime === 'function' ? rfDataTime() : ''}) : META.official ? t('s_official') : t('s_snap'))],
    [t('r_rateDate'), dateStr()]);
  const all = $('#x_list').value === 'all';
  const lm = $('#x_list').value;
  const list = (lm === 'crypto' ? Object.keys(CRYPTO) : all ? Object.keys(RATES).filter(c => !CRYPTO[c]).sort() : pinList()).filter(c => c !== from && RATES[c]);
  return {
    hero: {label: `<bdi dir="ltr">${N(amt, null, 2)} ${from} =</bdi>`, value: M(out, dec(out, to), to),
           sub: `<bdi dir="ltr">1 ${from} = ${RN(r * (1 - fee))} ${to}</bdi>`},
    rows, warn: (staleWarn() || []).concat(cryptoWarn(from, to)),
    table: {
      title: t('t_otherCur'), open: true,
      head: [t('h_currency'), t('f_amount')],
      rows: list.map(c => {
        const val = amt * rateOf(from, c) * (1 - fee);
        return [`${c} – ${curName(c)}`, M(val, dec(val, c), c)];
      })
    }
  };
}
/* --- VAT --- */
function calcVat(){
  const amt = Math.max(0, v('v_amount')), mode = $('#v_mode').value, preset = $('#v_preset').value;
  const rate = Math.max(0, preset === 'c' ? v('v_rate') : parseFloat(preset)) / 100;
  const qty = v('v_qty') > 0 ? v('v_qty') : 1, disc = Math.max(0, v('v_disc')) / 100;
  let uNet, uVat, preNet;
  if (mode === 'add'){ preNet = amt; uNet = amt * (1 - disc); uVat = uNet * rate; }
  else if (mode === 'extract'){ preNet = amt / (1 + rate); uNet = amt * (1 - disc) / (1 + rate); uVat = uNet * rate; }
  else { uVat = amt; uNet = rate > 0 ? amt / rate : 0; preNet = uNet; }
  const uGross = uNet + uVat;
  const net = uNet * qty, vat = uVat * qty, gross = uGross * qty;
  const rows = [];
  if (disc > 0 && mode !== 'fromvat') rows.push([t('r_discAmt'), M(-(preNet - uNet) * qty, 2)]);
  rows.push([t('r_vatNet'), M(net, 2)], [t('r_vatAmt'), M(vat, 2)], [t('r_vatTotal'), M(gross, 2), 'key'],
            [t('r_vatShare'), PC(gross ? vat / gross * 100 : NaN)]);
  if (qty !== 1) rows.push([t('r_unitNet'), M(uNet, 2)], [t('r_unitGross'), M(uGross, 2)]);
  const showNet = mode === 'extract';
  return {
    hero: {label: t(showNet ? 'r_vatNet' : 'r_vatTotal'), value: M(showNet ? net : gross, 2), sub: t('s_vatSub', {v: M(vat, 2)})},
    rows, note: t('n_vat')
  };
}
/* --- percentages --- */
function calcPercent(){
  const set = (id, html) => { $('#'+id).innerHTML = html; };
  set('pr_a', numHTML(N(v('pa_x') / 100 * v('pa_y'))));
  const w = v('pb_y');
  set('pr_b', numHTML(w ? PC(v('pb_x') / w * 100) : '—'));
  const a = v('pc_a'), b = v('pc_b');
  if (a === 0) set('pr_c', numHTML('—'));
  else {
    const ch = (b - a) / Math.abs(a) * 100;
    set('pr_c', (ch === 0 ? t('r_none') : t(ch > 0 ? 'r_inc' : 'r_dec', {p: numHTML(PC(Math.abs(ch)))})) +
      ` <small>(${t('p_diff', {d: numHTML(N(Math.abs(b - a)))})})</small>`);
  }
  const sign = $('#pd_op').value === 'add' ? 1 : -1;
  set('pr_d', numHTML(N(v('pd_x') * (1 + sign * v('pd_p') / 100))));
  const pe = v('pe_p');
  set('pr_e', numHTML(pe ? N(v('pe_x') / (pe / 100)) : '—'));
  const pf = v('pf_p') / 100, sf = $('#pf_op').value === 'add' ? 1 : -1, den = 1 + sf * pf;
  set('pr_f', numHTML(den > 0 ? N(v('pf_x') / den) : '—'));
  set('pr_g', numHTML(PC(((1 + v('pg_a') / 100) * (1 + v('pg_b') / 100) - 1) * 100)));
}

/* --- Israeli income tax helpers --- */
function taxByBrackets(income){
  let prev = 0, tax = 0;
  const parts = [];
  for (const [lim, r] of TAX.brackets){
    const amt = Math.max(0, Math.min(income, lim) - prev);
    parts.push({from: prev, to: lim, rate: r, amt, tax: amt * r});
    tax += amt * r;
    prev = lim;
  }
  const sur = Math.max(0, income - TAX.surtaxFrom) * TAX.surtaxRate;
  return {tax, sur, parts};
}
function surtaxOf(total, cap){
  const ex = Math.max(0, total - TAX.surtaxFrom);
  return {s3: ex * TAX.surtaxRate, s2: Math.min(Math.max(0, cap), ex) * 0.02};
}
function marginalRate(income){
  let rate = TAX.brackets[0][1];
  for (const [lim, r] of TAX.brackets){ rate = r; if (income <= lim) break; }
  return rate + (income > TAX.surtaxFrom ? TAX.surtaxRate : 0);
}
/* Bituach Leumi's own method: the contribution base is the income after 52% of the National Insurance part (not health) and the
   deductible pension deposit, so it is solved exactly; contributions are never below the minimum base */
function niSelfParts(annual, ded){
  const I = Math.max(0, (annual - (ded || 0)) / 12);
  if (!(I > 0)) return {ni: 0, health: 0, base: 0};
  const cut = TAX.niCut, mx = TAX.niMax, part = (B, lo, hi) => { const b = Math.min(B, mx), l = Math.min(b, cut), h = Math.max(0, b - cut); return l * lo + h * hi; };
  let a = 0, z = I;
  for (let i = 0; i < 70; i++){ const m = (a + z) / 2; if (m + 0.52 * part(m, TAX.sNiLow, TAX.sNiHigh) < I) a = m; else z = m; }
  const B = Math.max((a + z) / 2, TAX.sMinBase || 0);
  return {ni: part(B, TAX.sNiLow, TAX.sNiHigh) * 12, health: part(B, TAX.sHLow, TAX.sHHigh) * 12, base: B * 12};
}
function niSelf(annual, ded){ const p = niSelfParts(annual, ded); return p.ni + p.health; }
function erExcess(base, o){
  const erP = base * (o.erPens || 0) / 100, erS = base * (o.erSev || 0) / 100, erSt = base * (o.erStudy || 0) / 100;
  return Math.max(0, erP - TAX.erPensRate * Math.min(base, TAX.erPensCap)) + Math.max(0, erS - TAX.erSevRate * Math.min(base, TAX.erSevCap))
    + (typeof IL26 === 'object' ? Math.max(0, erSt - IL26.hishErMax * Math.min(base, IL26.hishCap)) : 0);
}
/* National Insurance and health, employee then employer, by age group (Bituach Leumi, 2026):
   [employee NI reduced, NI full, health reduced, health full, employer reduced, employer full] */
const NI_AGE = {
  u18:   [0, 0, 0, 0, .0061, .0212],                      // under 18: the employer pays a small rate, the employee nothing
  retW:  [.0072, .0507, .0323, .0517, .0417, .0712],      // a woman between her retirement age and 67, no old-age pension
  ret67: [.0070, .0486, .0323, .0517, .0413, .0696],      // aged 67 to 70, no old-age pension
  pens:  [0, 0, 0, 0, .0061, .0212]                       // receiving an old-age pension: health is taken from the pension
};
function niRates(age){ return NI_AGE[age] || [TAX.niLow, TAX.niHigh, TAX.hLow, TAX.hHigh, TAX.erNiLow, TAX.erNiHigh]; }
function salaryCalc(g, pts, pensPct, studyPct, o){
  const bonus = o.bonus / 12, base = g + bonus, cash = o.cash || 0, carPay = o.carPay || 0, extra = o.extra || 0, erX = erExcess(base, o);
  const taxBase = base + extra + o.benefit + cash + erX;
  const cf = o.carRate != null ? (o.carFixed || 0) + (o.cash || 0) : 0;      // a car bracket you chose yourself: the car (and its gross-up) is taxed at that rate
  const b0 = taxByBrackets((taxBase - cf) * 12);
  if (cf) b0.tax += cf * 12 * o.carRate;
  const top = TAX.brackets[TAX.brackets.length - 1][1];
  const coord = o.coord > 0 ? o.coord / 100 : 0;                // tax coordination: the rate the Tax Authority approved for this job
  const b = coord ? {tax: taxBase * 12 * coord, sur: 0} : o.second ? {tax: taxBase * 12 * top, sur: b0.sur} : b0;   // a second job without tax coordination: the top rate, no credit points
  const pens = base * pensPct / 100;
  const qual = Math.min(pens, TAX.pensDepRate * Math.min(base, TAX.pensSalaryCap));
  const loc = o.locRate > 0 ? o.locRate / 100 * Math.min(taxBase * 12, Math.max(0, o.locCap || 0)) : 0;
  const donY = (o.don || 0) * 12, don = donY >= (TAX.donMin || 0) && donY > 0 ? 0.35 * Math.min(donY, 0.3 * taxBase * 12, TAX.donMax || Infinity) : 0;
  const life = Math.max(0, o.lifeIns || 0) * 12 * 0.25;                        // private life insurance: a 25% credit
  const credits = (o.second || coord ? 0 : pts * TAX.point) + TAX.pensCreditRate * qual * 12 + loc + don + life;
  const used = Math.min(credits, b.tax);
  const tax = (b.tax - used + b.sur) / 12;
  const low = Math.min(taxBase, TAX.niCut), high = Math.max(0, Math.min(taxBase, TAX.niMax) - TAX.niCut);
  const R = niRates(o.age);
  const ni = low * R[0] + high * R[1];
  const health = low * R[2] + high * R[3];
  const study = base * studyPct / 100, other = o.otherDed || 0, union = base * Math.max(0, o.union || 0) / 100;
  const ded = tax + ni + health + pens + study + carPay + other + union;
  const erP = base * o.erPens / 100, erS = base * o.erSev / 100, erSt = base * o.erStudy / 100;
  const erNi = low * R[4] + high * R[5];
  return {gross: base, bonus, extra, net: base + extra + cash - ded, tax, ni, health, pens, study, other, union, life: life / 12, ded, credits: used / 12, cash, carPay, erX, loc: loc / 12, don: don / 12,
          erP, erS, erSt, erNi, employer: base + extra + cash + erP + erS + erSt + erNi};
}
/* --- work car inside the salary --- */
function carRateSel(){ const m = document.getElementById('s_carBr'); if (!m || m.value !== 'manual') return null; const r = parseFloat(($('#s_carBrRate') || {}).value); return isFinite(r) ? r / 100 : null; }
function salCar(){
  const sel = document.getElementById('s_car');
  if (!sel || sel.value !== 'co' || typeof IL26 === 'undefined') return null;
  const price = Math.max(0, v('s_carPrice')), kind = $('#s_carKind').value, pay = Math.max(0, v('s_carPay')), extra = Math.max(0, v('s_carExtra'));
  if (($('#s_carMode') || {}).value === 'value'){                              // the benefit value typed from the payslip
    const vv = Math.max(0, v('s_carVal'));
    return {price: 0, kind, pay, extra, gil: $('#s_carGil').value === 'y', base: vv, dd: 0, val: Math.max(0, vv - pay), byVal: true, rate: carRateSel()};
  }
  const base = Math.min(price, IL26.carCap) * IL26.carPct, dd = Math.min(base, IL26.carDed[kind] || 0), val = Math.max(0, base - dd - pay);
  return {price, kind, pay, extra, gil: $('#s_carGil').value === 'y', base, dd, val, rate: carRateSel()};
}
function carBrackets(tb0, add, r, r0){
  const A = taxByBrackets(tb0 * 12), B = taxByBrackets((tb0 + add) * 12), rows = [];
  let sum = 0;
  B.parts.forEach((p, i) => {
    const amt = (p.amt - A.parts[i].amt) / 12;
    if (amt < 0.5) return;
    const tx = amt * p.rate, a = p.from / 12, b = p.to / 12;
    sum += tx;
    rows.push({c: [!a ? t('r_brUpTo', {b: N(b)}) : isFinite(b) ? t('r_brFromTo', {a: N(a), b: N(b)}) : t('r_brOver', {a: N(a)}), PC(p.rate * 100), MI(amt), MI(tx)]});
  });
  const sur = (B.sur - A.sur) / 12, cred = (r.tax - r0.tax) - sum - sur, ni = (r.ni + r.health) - (r0.ni + r0.health);
  if (sur > 0.5) rows.push({c: [t('r_brSur'), PC(TAX.surtaxRate * 100), MI(add), MI(sur)]});
  if (Math.abs(cred) > 0.5) rows.push({c: [t('r_brCred'), '', '', MI(cred)]});
  rows.push({c: [t('r_brNi'), PC(add > 0 ? ni / add * 100 : NaN), MI(add), MI(ni)]});
  const tot = r.tax - r0.tax + ni;
  rows.push({key: true, c: [t('r_brTotal'), PC(add > 0 ? tot / add * 100 : NaN), MI(add), MI(tot)]});
  return {rows, m0: marginalRate(tb0 * 12), m1: marginalRate((tb0 + add) * 12)};
}
function withCar(g, pts, pens, study, o, car){
  if (!car) return o;
  const oc = Object.assign({}, o, {benefit: o.benefit + car.val, carPay: car.pay + car.extra}, car.rate != null ? {carFixed: car.val, carRate: car.rate} : {});
  if (!car.gil || car.val <= 0) return oc;
  const want = salaryCalc(g, pts, pens, study, Object.assign({}, o, {carPay: oc.carPay})).net;
  let lo = 0, hi = car.val * 3 + 100;
  for (let i = 0; i < 50; i++){
    const mid = (lo + hi) / 2;
    if (salaryCalc(g, pts, pens, study, Object.assign({}, oc, {cash: mid})).net < want) lo = mid; else hi = mid;
  }
  oc.cash = (lo + hi) / 2;
  return oc;
}
/* --- salary --- */
function payslipRows(r, o){
  const pc = x => PC(r.gross > 0 ? x / r.gross * 100 : NaN);
  const L = [[t('r_grossMonthly'), r.gross], [t('r_incomeTax'), -r.tax], [t('r_ni'), -r.ni], [t('r_health'), -r.health]];
  if (r.extra > 0) L.splice(1, 0, [t('r_sExtra'), r.extra]);
  if (r.pens > 0) L.push([t('r_pensionRow'), -r.pens]);
  if (r.study > 0) L.push([t('r_studyRow'), -r.study]);
  if (r.carPay > 0) L.push([t('r_sCarPay'), -r.carPay]);
  if (r.other > 0) L.push([t('r_sOtherDed'), -r.other]);
  if (r.union > 0) L.push([t('r_sUnion'), -r.union]);
  if (r.cash > 0) L.splice(1, 0, [t('r_sCarGil'), r.cash]);
  L.push([t('r_totalDed'), -r.ded], [t('r_netMonthly'), r.net]);
  return L.map(([a, b]) => [a, MI(b), pc(Math.abs(b))]);
}
/* 8.2: the payslip — monthly or hourly pay, overtime, Shabbat, vacation, sick days (by law: day 1 unpaid, days 2-3 at half, from day 4 full),
   unpaid absence, holidays, reserve duty, vacation redemption, and the balances: vacation and sick days, recuperation by seniority */
const VAC5 = [12, 12, 12, 12, 12, 17, 17, 17, 23], VAC6 = [14, 14, 14, 14, 14, 16, 18, 19, 20, 21, 22, 23, 24];
const HAV_DAYS = y => y < 1 ? 0 : y <= 1 ? 5 : y <= 3 ? 6 : y <= 10 ? 7 : y <= 15 ? 8 : y <= 19 ? 9 : 10;
function salTime(amt, mode){
  const vv = id => { const e = $('#' + id); return e ? Math.max(0, v(id) || 0) : 0; }, sel = id => ($('#' + id) || {}).value;
  const g2n = mode === 'g2n', hourly = g2n && sel('s_payType') === 'hour';
  const week = sel('s_week') === '6' ? 6 : 5, dayH = 42 / week, wd = Math.max(1, vv('s_wdays') || 22);
  const rate = hourly ? vv('s_hourRate') : 0, hrs = hourly ? vv('s_hours') : 0;
  const base0 = hourly ? rate * hrs : amt, hv = hourly ? rate : amt / 182, day = hourly ? rate * dayH : amt / wd;
  const sickD = vv('s_sickD'), absD = vv('s_absD'), vacD = vv('s_vacD'), holD = hourly ? vv('s_holD') : 0, resD = vv('s_reserveD'), mournD = hourly ? vv('s_mournD') : 0;
  const sickPaid = sel('s_sickPay') === 'full' ? sickD : Math.min(2, Math.max(0, sickD - 1)) * .5 + Math.max(0, sickD - 3);
  const T = {hourly, rate, hrs, base0, hv, day, week, sickD, absD, vacD, holD, resD, mournD, sickPay: day * sickPaid, absDed: 0, sickDed: 0, vacPay: 0, holPay: 0, mournPay: 0};
  if (g2n){
    if (hourly){ T.vacPay = day * vacD; T.holPay = day * holD; T.resPay = day * resD; T.mournPay = day * mournD; T.base = base0 + T.vacPay + T.holPay + T.sickPay + T.resPay + T.mournPay; }
    else { T.absDed = day * absD; T.sickDed = day * sickD; T.resPay = 0; T.base = Math.max(0, base0 - T.absDed - T.sickDed + T.sickPay); }
  } else T.base = amt;
  T.ot125 = hv * 1.25 * vv('s_ot125'); T.ot150 = hv * 1.5 * vv('s_ot150'); T.shab = hv * 1.5 * vv('s_shab');
  T.vacRed = day * vv('s_vacRed'); T.comm = vv('s_comm'); T.shift = vv('s_shift'); T.cloth = vv('s_cloth');
  T.senPay = vv('s_seniorPay'); T.globalOt = vv('s_globalOt'); T.oncall = vv('s_oncall'); T.roleAdd = vv('s_roleAdd'); T.wfh = vv('s_wfh');
  T.extra = T.ot125 + T.ot150 + T.shab + T.vacRed + T.comm + T.shift + T.cloth + T.senPay + T.globalOt + T.oncall + T.roleAdd + T.wfh;
  T.adv = vv('s_adv'); T.loan = vv('s_loanDed'); T.after = T.adv + T.loan;
  const sen = vv('s_senior'), yi = Math.max(1, Math.ceil(sen || 0)), tbl = week === 6 ? VAC6 : VAC5;
  T.sen = sen; T.vacYear = tbl[Math.min(yi, tbl.length) - 1]; T.vacM = T.vacYear / 12;
  T.vacBal = vv('s_vacBal') + T.vacM - vacD - vv('s_vacRed'); T.sickBal = Math.min(90, vv('s_sickBal') + 1.5) - sickD;
  T.havD = HAV_DAYS(sen); T.havDay = vv('s_havDay') || 418; T.havYear = T.havD * T.havDay;
  T.any = hourly || T.extra > 0 || T.after > 0 || sickD || absD || vacD || holD || resD || mournD;
  return T;
}
function calcSalary(){
  const k = $('#s_per').value === 'y' ? 12 : 1;
  const amt = Math.max(0, v('s_amount')) / k, mode = $('#s_mode').value;
  const pts = pointsOf('s'), pens = Math.max(0, v('s_pension')), study = Math.max(0, v('s_study'));
  const o = {bonus: Math.max(0, v('s_bonus')), benefit: Math.max(0, v('s_benefit')),
             erPens: Math.max(0, v('s_erPens')), erSev: Math.max(0, v('s_erSev')), erStudy: Math.max(0, v('s_erStudy')),
             extra: Math.max(0, v('s_extra')), otherDed: Math.max(0, v('s_otherDed')), don: Math.max(0, v('s_don')),
             locRate: Math.max(0, v('s_locRate')), locCap: Math.max(0, v('s_locCap')), second: ($('#s_job') || {}).value === 'second',
             age: ($('#s_age') || {}).value || 'reg', union: Math.max(0, v('s_union')), lifeIns: Math.max(0, v('s_life')),
             coord: ($('#s_job') || {}).value === 'coord' ? Math.max(0, v('s_coord')) : 0};
  const xp = {travel: Math.max(0, v('s_travel')), meals: Math.max(0, v('s_meals')), havraa: Math.max(0, v('s_havraa')) / 12, phone: ($('#s_phone') || {}).value === '1' ? Math.max(0, v('s_phoneVal')) : 0};
  o.extra += xp.travel + xp.meals + xp.havraa; o.benefit += xp.phone;
  const gift = Math.max(0, v('s_gift') || 0), reimb = Math.max(0, v('s_reimb') || 0), erDis = Math.max(0, v('s_erDis') || 0); o.benefit += gift;
  const TM = salTime(amt, mode); o.extra += TM.extra; o.otherDed += TM.after;
  const car = salCar();
  const oc = gg => withCar(gg, pts, pens, study, o, car);
  let g = mode === 'g2n' ? TM.base : amt;
  if (mode === 'n2g'){
    let lo = 0, hi = amt * 4 + 1000 + (car ? car.val * 2 + car.pay + car.extra : 0);
    for (let i = 0; i < 80; i++){
      const mid = (lo + hi) / 2;
      if (salaryCalc(mid, pts, pens, study, oc(mid)).net + reimb < amt) lo = mid; else hi = mid;
    }
    g = (lo + hi) / 2;
  }
  const r = salaryCalc(g, pts, pens, study, oc(g));
  const r2 = salaryCalc(g + 100, pts, pens, study, oc(g + 100));
  const r0 = car ? salaryCalc(g, pts, pens, study, o) : r, drop = r0.net - r.net;
  const carTax = (r.tax + r.ni + r.health) - (r0.tax + r0.ni + r0.health);
  const cb = car && !o.second && !o.coord && car.rate == null ? carBrackets(r0.gross + r0.extra + o.benefit + r0.erX, car.val + (r.cash || 0), r, r0) : null;
  const marginal = (1 - (r2.net - r.net) / 100) * 100;
  /* expense refunds are paid on top of the net and are not taxed; employer disability insurance adds to the employer's cost */
  const disAmt = r.gross * erDis / 100;
  if (reimb > 0){ r.net += reimb; r.employer += reimb; if (r0 !== r) r0.net += reimb; }
  if (disAmt > 0) r.employer += disAmt;
  const rows = [];
  if (mode === 'g2n' && (TM.hourly || TM.absDed || TM.sickDed || TM.sickPay || TM.vacPay || TM.holPay || TM.resPay || TM.mournPay)){
    rows.push([TM.hourly ? t('r_sHourBase', {h: N(TM.hrs), r: MI(TM.rate, 2)}) : t('r_sBase'), MI(TM.base0)]);
    if (TM.absDed > 0) rows.push([t('r_sAbs', {d: N(TM.absD)}), MI(-TM.absDed)]);
    if (TM.sickD > 0){ if (TM.sickDed > 0) rows.push([t('r_sSickOff', {d: N(TM.sickD)}), MI(-TM.sickDed)]); rows.push([t('r_sSickPay'), MI(TM.sickPay)]); }
    if (TM.vacPay > 0) rows.push([t('r_sVacPay', {d: N(TM.vacD)}), MI(TM.vacPay)]);
    if (TM.holPay > 0) rows.push([t('r_sHolPay', {d: N(TM.holD)}), MI(TM.holPay)]);
    if (TM.resPay > 0) rows.push([t('r_sResPay', {d: N(TM.resD)}), MI(TM.resPay)]);
    if (TM.mournPay > 0) rows.push([t('r_sMournPay', {d: N(TM.mournD)}), MI(TM.mournPay)]);
  }
  rows.push([t('r_grossMonthly'), MI(r.gross)]);
  [['ot125', 'r_sOt125'], ['ot150', 'r_sOt150'], ['shab', 'r_sShab'], ['vacRed', 'r_sVacRed'], ['comm', 'r_sComm'], ['shift', 'r_sShift'], ['cloth', 'r_sCloth'], ['senPay', 'r_sSeniorPay'], ['globalOt', 'r_sGlobalOt'], ['oncall', 'r_sOncall'], ['roleAdd', 'r_sRoleAdd'], ['wfh', 'r_sWfh']].forEach(([k, l]) => { if (TM[k] > 0.005) rows.push([t(l), MI(TM[k])]); });
  if (o.bonus > 0) rows.push([t('r_bonusAvg'), MI(r.bonus)]);
  if (xp.travel > 0) rows.push([t('r_sTravel'), MI(xp.travel)]);
  if (xp.meals > 0) rows.push([t('r_sMeals'), MI(xp.meals)]);
  if (xp.havraa > 0) rows.push([t('r_sHavraa'), MI(xp.havraa)]);
  { const own = r.extra - xp.travel - xp.meals - xp.havraa - TM.extra; if (own > 0.005) rows.push([t('r_sExtra'), MI(own)]); }
  if (xp.phone > 0) rows.push([t('r_sPhone'), MI(xp.phone)]);
  if (gift > 0) rows.push([t('r_sGift'), MI(gift)]);
  if (o.benefit - xp.phone - gift > 0.005) rows.push([t('r_benefitRow'), MI(o.benefit - xp.phone - gift)]);
  if (car) rows.push([t('r_cbVal'), MI(car.val)]);
  if (r.cash > 0) rows.push([t('r_sCarGil'), MI(r.cash)]);
  if (r.erX > 0.5) rows.push([t('r_erX'), MI(r.erX)]);
  rows.push([t('r_incomeTax'), MI(-r.tax)], [t('r_ni'), MI(-r.ni)], [t('r_health'), MI(-r.health)]);
  if (r.pens > 0) rows.push([t('r_pensionRow'), MI(-r.pens)]);
  if (r.study > 0) rows.push([t('r_studyRow'), MI(-r.study)]);
  if (r.carPay > 0) rows.push([t('r_sCarPay'), MI(-r.carPay)]);
  if (r.other - TM.after > 0.005) rows.push([t('r_sOtherDed'), MI(-(r.other - TM.after))]);
  if (TM.adv > 0) rows.push([t('r_sAdv'), MI(-TM.adv)]);
  if (TM.loan > 0) rows.push([t('r_sLoanDed'), MI(-TM.loan)]);
  if (r.union > 0) rows.push([t('r_sUnion'), MI(-r.union)]);
  if (reimb > 0) rows.push([t('r_sReimb'), MI(reimb)]);
  rows.push(
    [t('r_totalDed'), MI(-r.ded), 'key'],
    [t('r_netMonthly'), MI(r.net), 'key'],
    ...(car ? [[t('r_cbNetNo'), MI(r0.net)], [t('r_sCarMarg'), car.rate != null ? PC(car.rate * 100) + ' · ' + t('o_carBrManual') : o.coord ? PC(o.coord) : !cb ? PC(TAX.brackets[TAX.brackets.length - 1][1] * 100) : cb.m0 === cb.m1 ? N(cb.m0 * 100) + '%' : t('r_sCarMargV', {a: N(cb.m0 * 100) + '%', b: N(cb.m1 * 100) + '%'})], [t('r_sCarTax'), MI(-carTax)], [t('r_sCarDrop'), MI(-drop), 'key'], [t('r_sCarShare'), PC(r0.net > 0 ? drop / r0.net * 100 : NaN)], [t('r_sCarYear'), MI(-drop * 12)]] : []),
    ...(() => { const se = typeof seTotals === 'function' ? seTotals() : {total: 0}; return se.total > 0 ? [[t('r_seCar'), MI(-se.car)], [t('r_seOther'), MI(-se.other)], [t('r_seLeft'), MI(r.net - se.total), 'key'], [t('r_seShare'), PC(r.net > 0 ? se.total / r.net * 100 : NaN)]] : []; })(),
    [t('r_dedShare'), PC(r.gross > 0 ? r.ded / r.gross * 100 : NaN)],
    [t('r_points'), o.coord ? '0 · ' + t('r_sCoordAt', {r: PC(o.coord)}) : o.second ? '0 · ' + t('o_jobSecond') : ptsTxt('s', pts)],
    [t('r_creditsUsed'), MI(r.credits)],
    ...(r.loc > 0.5 ? [[t('r_locCred'), MI(r.loc)]] : []), ...(r.don > 0.5 ? [[t('r_donCred'), MI(r.don)]] : []), ...(r.life > 0.5 ? [[t('r_lifeCred'), MI(r.life)]] : []),
    ...(o.age && o.age !== 'reg' ? [[t('r_sAgeNi'), t('o_age_' + o.age)]] : []),
    [t('r_hourly'), MI(r.net / 182, 2)],
    [t('r_marginal'), PC(marginal)],
    [t('r_netAnnual'), MI(r.net * 12)],
    [t('r_erPens'), MI(r.erP)], [t('r_erSev'), MI(r.erS)]);
  if (r.erSt > 0) rows.push([t('r_erStudy'), MI(r.erSt)]);
  if (disAmt > 0) rows.push([t('r_erDis'), MI(disAmt)]);
  rows.push([t('r_erNi'), MI(r.erNi)], [t('r_employerCost'), MI(r.employer), 'key'],
            [t('r_totalSavings'), MI(r.pens + r.erP)]);
  rows.push([t('r_sVacYear', {w: TM.week}), t('r_sDays', {d: N(TM.vacYear)})], [t('r_sVacAcc'), t('r_sDays', {d: N(TM.vacM, 2)})], [t('r_sVacBal'), t('r_sDays', {d: N(TM.vacBal, 2)}), 'key'],
            [t('r_sSickAcc'), t('r_sDays', {d: '1.5'})], [t('r_sSickBal'), t('r_sDays', {d: N(TM.sickBal, 1)}), 'key'],
            [t('r_sHavD'), TM.havD ? t('r_sDays', {d: N(TM.havD)}) : t('r_sHavNone')], [t('r_sHavYear'), MI(TM.havYear)]);
  const per = k === 12 ? ' ' + t('o_perYear') : '';
  return {
    hero: mode === 'g2n'
      ? {label: t('r_netMonthly') + per, value: MI(r.net * k), sub: t('s_fromGross', {g: MI((r.gross) * k)}) + (car ? ' · ' + t('r_sCarDropS', {x: MI(drop * k)}) : '') + (() => { const se = typeof seTotals === 'function' ? seTotals() : {total: 0}; return se.total > 0 ? ' · ' + t('r_seLeftS', {x: MI((r.net - se.total) * k)}) : ''; })()}
      : {label: t('r_grossMonthly') + per, value: MI((r.gross) * k), sub: t('s_toNet', {g: MI(r.net * k)}) + (car ? ' · ' + t('r_sCarDropS', {x: MI(drop * k)}) : '')},
    rows,
    table2: cb ? {title: t(r.cash > 0 ? 't_sCarBrG' : 't_sCarBr'), open: true, head: [t('h_brRange'), t('h_brRate'), t('h_brAmt'), t('h_brTax')], rows: cb.rows, foot: t('n_sCarBr')} : null,
    table: {title: t('t_payslip'), head: [t('h_item'), t('h_amount'), t('h_pctGross')], rows: payslipRows(r, o)},
    note: t('n_salary2') + ' ' + t('n_points') + (car ? ' ' + t('n_sCar') : ''),
    warn: (car && car.price > IL26.carCap ? [t('w_cbCap', {c: MI(IL26.carCap)})] : []).concat(o.second ? [t('w_sSecond')] : []).concat(g > 0 && g < IL26.minWage && o.age !== 'u18' ? [t('w_sMinWage', {m: MI(IL26.minWage, 2)})] : []),
    split: {
      title: t('c_split'),
      items: [
        {name: t('l_netPay'),   v: r.net,           cls:'c-ink',    fmt: MI(r.net)},
        {name: t('l_incTax'),   v: r.tax,           cls:'c-accent', fmt: MI(r.tax)},
        {name: t('l_niHealth'), v: r.ni + r.health, cls:'c-warm',   fmt: MI(r.ni + r.health)},
        {name: t('l_savings'),  v: r.pens + r.study,cls:'c-soft',   fmt: MI(r.pens + r.study)},
        ...(r.carPay > 0 ? [{name: t('r_sCarPay'), v: r.carPay, cls: 'c-car', fmt: MI(r.carPay)}] : [])
      ]
    }
  };
}
/* --- income tax --- */
function calcTaxTab(){
  const monthly = $('#t_period').value === 'm';
  const earned = Math.max(0, v('t_income')) * (monthly ? 12 : 1);
  const cap = Math.max(0, v('t_cap')), deduct = Math.max(0, v('t_deduct'));
  const income = Math.max(0, earned - deduct);
  const pts = pointsOf('t');
  const b = taxByBrackets(income);
  const sr = surtaxOf(income + cap, cap);
  const ptsCred = pts * TAX.point;
  const pensCred = TAX.pensCreditRate * Math.min(Math.max(0, v('t_pensDep')), TAX.pensDepRate * Math.min(earned, TAX.pensSalaryCap * 12));
  const don = Math.max(0, v('t_donation')), donCred = don > TAX.donMin ? 0.35 * Math.min(don, 0.3 * income, TAX.donMax) : 0;
  const locCred = Math.max(0, v('t_locRate')) / 100 * Math.min(income, Math.max(0, v('t_locCap')));
  const other = Math.max(0, v('t_other'));
  const credits = ptsCred + pensCred + donCred + locCred + other;
  const used = Math.min(credits, b.tax);
  const payable = b.tax - used + sr.s3 + sr.s2;
  const eff = income > 0 ? payable / income * 100 : NaN;
  const marg = marginalRate(income + cap) * 100;
  const rows = [[t('r_incomeYear'), MI(earned)]];
  if (deduct > 0) rows.push([t('r_deducted'), MI(-deduct)]);
  rows.push([t('r_taxBefore'), MI(b.tax)]);
  if (sr.s3 > 0) rows.push([t('r_surtax'), MI(sr.s3)]);
  if (sr.s2 > 0) rows.push([t('r_surCap'), MI(sr.s2)]);
  rows.push([t('r_points'), ptsTxt('t', pts)], [t('r_ptsCred'), MI(-Math.min(ptsCred, b.tax))]);
  if (pensCred > 0) rows.push([t('r_pensCred'), MI(-pensCred)]);
  if (donCred > 0) rows.push([t('r_donCred'), MI(-donCred)]);
  if (locCred > 0) rows.push([t('r_locCred'), MI(-locCred)]);
  if (credits - ptsCred > 0.5) rows.push([t('r_credApplied'), MI(-used)]);
  if (monthly) rows.push([t('r_taxPayable'), MI(payable), 'key']);
  rows.push([t('r_effRate'), PC(eff)], [t('r_margRate'), PC(marg)]);
  if (!monthly) rows.push([t('r_perMonth'), MI(payable / 12)]);
  rows.push([t('r_afterTax'), MI(earned - payable)]);
  const parts = b.parts.filter(p => p.amt > 0);
  const tableRows = parts.map(p => [`${N(p.from)} – ${isFinite(p.to) ? N(p.to) : '∞'}`, PC(p.rate * 100), MI(p.amt), MI(p.tax)]);
  if (sr.s3 > 0) tableRows.push([`${t('r_surtax')} ${N(TAX.surtaxFrom)}+`, PC(TAX.surtaxRate * 100), MI(income + cap - TAX.surtaxFrom), MI(sr.s3)]);
  return {
    hero: {
      label: t(monthly ? 'r_taxMonth' : 'r_taxYear'),
      value: MI(payable / (monthly ? 12 : 1)),
      sub: t('s_taxSub', {e: PC(eff), m: PC(marg)})
    },
    rows,
    note: t('n_tax2') + ' ' + t('n_points'),
    chart: {
      title: t('c_taxBracket'), unit: '', fmt: x => MI(x),
      layers: [{name: t('l_tax'), cls:'c-ink', values: parts.map(p => p.tax)}],
      labels: parts.map(p => `${N(p.rate * 100)}%`)
    },
    table: {
      title: t('t_brackets'),
      head: [t('h_bracket'), t('h_rate'), t('h_inBracket'), t('h_taxCol')],
      rows: tableRows
    }
  };
}
/* --- self-employed --- */
function calcSelfemp(){
  const rev = Math.max(0, v('e_rev')), exp = Math.max(0, v('e_exp'));
  const profit = Math.max(0, rev - exp);
  const pensIn = Math.max(0, v('e_pens'));
  const qual = Math.min(profit, 232800);
  const credPart = Math.min(pensIn, 0.055 * qual);
  const dedPart = Math.min(Math.max(0, pensIn - credPart), 0.11 * qual);
  const np = niSelfParts(profit, dedPart), ni = np.ni + np.health, niDed = np.ni * 0.52;
  const pens = credPart + dedPart;
  const taxable = Math.max(0, profit - niDed - dedPart);
  const pts = pointsOf('e');
  const b = taxByBrackets(taxable);
  const credits = pts * TAX.point + TAX.pensCreditRate * credPart;
  const used = Math.min(credits, b.tax);
  const tax = b.tax - used + b.sur;
  const net = profit - ni - tax - pens;
  const burden = profit > 0 ? (ni + tax) / profit * 100 : NaN;
  const corpNet = profit * (1 - 0.23) * (1 - 0.30);
  const rows = [
    [t('f_revenue'), MI(rev)], [t('f_expenses'), MI(-exp)],
    [t('r_profit'), MI(profit), 'key'],
    [t('r_niSelf'), MI(-ni)],
    [t('r_niDed'), MI(niDed)]
  ];
  if (dedPart > 0) rows.push([t('r_pensDed'), MI(dedPart)]);
  rows.push(
    [t('r_taxableSelf'), MI(taxable)],
    [t('r_points'), ptsTxt('e', pts)],
    [t('r_taxSelf'), MI(-tax)]);
  if (pens > 0) rows.push([t('r_sPensRow'), MI(-pens)]);
  rows.push(
    [t('r_netSelfY'), MI(net), 'key'],
    [t('r_netSelfM'), MI(net / 12), 'key'],
    [t('r_burden'), PC(burden)],
    [t('r_margRate'), PC(marginalRate(taxable) * 100)]);
  if ($('#e_dealer').value === 'murshe') rows.push([t('r_vatNote', {v: MI(rev)}), MI(rev * 0.18)]);
  rows.push([t('r_corpCompare'), MI(corpNet)]);
  return {
    hero: {label: t('r_netSelfM'), value: MI(net / 12), sub: t('r_netSelfY') + ': ' + MI(net)},
    rows, note: t('n_selfemp') + ' ' + t('n_points'),
    split: {
      title: t('c_split'),
      items: [
        {name: t('l_netPay'),   v: net,   cls:'c-ink',    fmt: MI(net)},
        {name: t('l_incTax'),   v: tax,   cls:'c-accent', fmt: MI(tax)},
        {name: t('l_niHealth'), v: ni,    cls:'c-warm',   fmt: MI(ni)},
        {name: t('l_savings'),  v: pens,  cls:'c-soft',   fmt: MI(pens)}
      ]
    }
  };
}
