/* ================= 8.5: loans by monthly payment, and prime + margin made clear ================= */
/* the interest: Bank of Israel rate + the prime spread (1.5% by convention) = prime; the bank then adds or takes off its own margin.
   Each part can be changed. The interest you pay is split between those parts, so it is clear what each costs. */
const calcLoan85 = CALC.loan;
function loanSolve(type, r, n, pay){            // the loan amount a monthly payment carries
  if (!(pay > 0)) return 0;
  if (type === 'bullet') return r > 0 ? pay / r : 0;
  if (type === 'equal') return pay / (1 / n + r);
  return r > 0 ? pay * (1 - Math.pow(1 + r, -n)) / r : pay * n;
}
function loanTerm(type, r, amt, pay){           // months to repay an amount with a monthly payment (NaN: never)
  if (!(pay > 0) || !(amt > 0)) return NaN;
  if (type === 'bullet') return NaN;
  if (type === 'equal'){ const first = amt * r; return pay > first ? amt / (pay - first) : NaN; }
  if (r <= 0) return amt / pay;
  return pay > amt * r ? -Math.log(1 - amt * r / pay) / Math.log(1 + r) : NaN;
}
/* the calculation borrows a field for a moment (the amount, the years or the rate it worked out) and gives back what you typed */
var LOAN_KEEP = [];
function loanSet(id, val){ const e = document.getElementById(id); if (e && isFinite(val)){ if (id !== 'l_boi' && !LOAN_KEEP.some(x => x[0] === id)) LOAN_KEEP.push([id, e.value]); e.value = String(Math.round(val * 100) / 100); } }
CALC.loan = function(){
  const mode = ($('#l_mode') || {}).value || 'pay', rt = ($('#l_rateType') || {}).value || 'fixed', type = ($('#l_type') || {}).value || 'annuity';
  /* the Bank of Israel rate follows the live figure until you type your own */
  const boiEl = $('#l_boi');
  if (boiEl && !boiEl.dataset.user && typeof MKT === 'object' && MKT.boi > 0 && Math.abs(v('l_boi') - MKT.boi) > 1e-9) loanSet('l_boi', MKT.boi);
  let parts = null;
  if (rt === 'prime'){
    const boi = v('l_boi'), spread = v('l_spread'), margin = v('l_margin'), prime = boi + spread, rate = Math.max(0, prime + margin);
    parts = {boi, spread, margin, prime, rate};
    loanSet('l_rate', rate);
  }
  const rate = Math.max(0, v('l_rate')), r = rate / 1200;
  let solved = null;
  if (mode === 'amount'){
    const n = Math.max(1, Math.round(clamp(v('l_years'), 0.25, 50) * 12)), pay = Math.max(0, v('l_pay'));
    const amt = loanSolve(type, r, n, pay); loanSet('l_amount', amt); solved = {k: 'amount', amt, pay, y: n / 12};
  } else if (mode === 'term'){
    const amt = Math.max(0, v('l_amount')), pay = Math.max(0, v('l_pay')), n = loanTerm(type, r, amt, pay);
    if (!isFinite(n)){
      const min = type === 'equal' ? amt / 600 + amt * r : amt * r;
      return {hero: {label: t('r_lTerm'), value: '—', sub: t('w_lPayLow', {m: M(min + 0.01, 2)})}, rows: [], warn: [t('w_lPayLow', {m: M(min + 0.01, 2)})], note: t('n_lMode')};
    }
    loanSet('l_years', Math.min(50, n / 12)); solved = {k: 'term', n: Math.ceil(n), pay, amt};
  }
  let res;
  try { res = calcLoan85.apply(this, arguments); }
  finally { LOAN_KEEP.forEach(([id, val]) => { const e = document.getElementById(id); if (e) e.value = val; }); LOAN_KEEP = []; }
  if (!res || !res.rows) return res;
  const top = [];
  if (solved && solved.k === 'amount'){
    res.hero = {label: t('r_lCanBorrow'), value: M(solved.amt), sub: t('r_lCanSub', {p: M(solved.pay, 2), y: N(solved.y, 1), r: PC(rate)})};
  } else if (solved && solved.k === 'term'){
    res.hero = {label: t('r_lTerm'), value: fmtDur(solved.n), sub: t('r_lTermSub', {p: M(solved.pay, 2), a: M(solved.amt)})};
  }
  if (parts){
    top.push([t('r_lBoi'), PC(parts.boi)], [t('r_lSpread'), '+' + PC(parts.spread)], [t('r_lPrime'), PC(parts.prime), 'key'],
      [t('r_lMargin'), (parts.margin >= 0 ? '+' : '') + PC(parts.margin)], [t('r_lYour'), PC(parts.rate), 'key']);
    /* the interest you pay, split by where it comes from */
    const totRow = res.rows.find(x => x[0] === t('r_totInt'));
    const totInt = totRow ? parseFloat(String(strip(totRow[1])).replace(/[^\d.\-]/g, '')) : NaN;
    if (parts.rate > 0 && isFinite(totInt) && totInt > 0){
      const share = x => totInt * x / parts.rate;
      top.push([t('r_lIntBoi'), M(share(parts.boi))], [t('r_lIntSpread'), M(share(parts.spread))], [t('r_lIntMargin'), (parts.margin < 0 ? '−' : '') + M(Math.abs(share(parts.margin)))]);
    }
  }
  res.rows = top.concat(res.rows);
  res.note = (res.note ? res.note + ' ' : '') + t(parts ? 'n_lPrime' : 'n_lMode');
  return res;
};
document.addEventListener('input', e => { if (e.target && e.target.id === 'l_boi') e.target.dataset.user = '1'; }, true);
/* 13.44: the interest a loan really carries – from the amount, the years and the monthly payment */
function loanRateOf(type, A, n, P){              // monthly rate (NaN: the payment can't repay the loan)
  if (!(A > 0) || !(P > 0) || !(n > 0)) return NaN;
  if (type === 'bullet') return P / A;
  if (type === 'equal'){ const r = (P - A / n) / A; return r >= -1e-9 ? Math.max(0, r) : NaN; }
  if (P * n < A - 0.5) return NaN;
  if (Math.abs(P * n - A) <= 0.5) return 0;
  const pmt = r => r > 0 ? A * r / (1 - Math.pow(1 + r, -n)) : A / n;
  let lo = 0, hi = 0.01; while (pmt(hi) < P && hi < 2) hi *= 2;
  for (let i = 0; i < 200; i++){ const m = (lo + hi) / 2; if (pmt(m) < P) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const calcLoan86 = CALC.loan;
CALC.loan = function(){
  if ((($('#l_mode') || {}).value || 'pay') !== 'rate') return calcLoan86.apply(this, arguments);
  const type = ($('#l_type') || {}).value || 'annuity', A = Math.max(0, v('l_amount')), P = Math.max(0, v('l_pay'));
  const n = Math.max(1, Math.round(clamp(v('l_years'), 0.25, 50) * 12)), r = loanRateOf(type, A, n, P);
  if (!isFinite(r)){
    const min = A / n;
    return {hero: {label: t('r_lRate'), value: '—', sub: t('w_lPayTooLow', {m: M(min, 2)})}, rows: [], warn: [t('w_lPayTooLow', {m: M(min, 2)})], note: t('n_lRate')};
  }
  const nom = r * 1200, eff = (Math.pow(1 + r, 12) - 1) * 100;
  loanSet('l_rate', nom);
  const keep = [['l_mode', 'pay'], ['l_rateType', 'fixed']]; keep.forEach(([id, val]) => { const e = document.getElementById(id); if (e){ if (!LOAN_KEEP.some(x => x[0] === id)) LOAN_KEEP.push([id, e.value]); e.value = val; } });
  const res = calcLoan86.apply(this, arguments);
  if (!res || !res.rows) return res;
  const sim = loanSim({amt: A, rate: nom, n, type, grace: 0, ci: 0, extra: 0, pre: 0, preM: 1});
  const totInt = sim.reduce((s, x) => s + x.int, 0), f0 = sim[0] || {int: 0, pr: 0};
  const top = [[t('r_lNominal'), PC(nom), 'key'], [t('r_lMonthlyRate'), N(r * 100, 3) + '%'], [t('r_lEffective'), PC(eff)],
    [t('r_lIntTot'), M(totInt)], [t('r_lAvgInt'), M(totInt / n, 2)],
    [t('r_lFirstInt'), M(f0.int, 2)], [t('r_lFirstPr'), M(f0.pr, 2)]];
  const boi = typeof MKT === 'object' && MKT.boi > 0 ? MKT.boi : NaN, warn = [];
  if (isFinite(boi)){
    const d = nom - (boi + 1.5); top.push([t('r_lVsPrime'), t('r_lPrimeX', {s: (d >= 0 ? '+' : '−') + N(Math.abs(d), 2) + '%', p: PC(boi + 1.5)})]);
    if (eff > boi + 15) warn.push(t('w_lFairCap', {c: PC(boi + 15)}));
  }
  if (type === 'bullet') warn.push(t('w_lBulletRate', {a: M(A)}));
  res.rows = top.concat(res.rows.filter(x => x[0] !== t('r_totInt')));
  res.hero = {label: t('r_lRate'), value: PC(nom), sub: t('r_lRateSub', {e: PC(eff), i: M(totInt)})};
  res.warn = (res.warn || []).concat(warn);
  res.note = t('n_lRate');
  return res;
};
/* in that mode the rate is the answer, so its fields step aside */
{ const awLoan = applyWhen; applyWhen = function(id){ const r = awLoan.apply(this, arguments);
  if (id === 'loan'){ const rm = (($('#l_mode') || {}).value) === 'rate';
    ['l_rateType', 'l_rate', 'l_boi', 'l_spread', 'l_margin'].forEach(k => { const f = $('#' + k), b = f && f.closest('.field'); if (b && rm) b.hidden = true; }); }
  return r; }; }
Object.assign(T, {
  o_lmRate:['כמה ריבית אני משלם/ת – לפי סכום, שנים והחזר','كم فائدة أدفع – حسب المبلغ والسنوات والقسط','What interest I pay – from amount, years and payment'],
  r_lRate:['הריבית השנתית על ההלוואה','الفائدة السنوية على القرض','The loan’s yearly interest'],
  r_lRateSub:['ריבית אפקטיבית {e} · סה״כ ריבית {i}','فائدة فعلية {e} · مجموع الفائدة {i}','Effective {e} · total interest {i}'],
  r_lNominal:['ריבית שנתית (נקובה)','الفائدة السنوية (الاسمية)','Yearly rate (nominal)'],
  r_lMonthlyRate:['ריבית חודשית','الفائدة الشهرية','Monthly rate'],
  r_lEffective:['ריבית אפקטיבית (כולל ריבית דריבית)','الفائدة الفعلية (مع الفائدة المركبة)','Effective rate (with compounding)'],
  r_lIntTot:['סה״כ ריבית לאורך ההלוואה','مجموع الفائدة طوال القرض','Total interest over the loan'],
  r_lAvgInt:['ריבית ממוצעת לחודש','متوسط الفائدة الشهري','Average interest per month'],
  r_lFirstInt:['בהחזר הראשון – ריבית','في القسط الأول – فائدة','First payment – interest'],
  r_lFirstPr:['בהחזר הראשון – קרן','في القسط الأول – أصل','First payment – principal'],
  r_lVsPrime:['לעומת הפריים','مقارنة بالبرايم','Compared with prime'],
  r_lPrimeX:['פריים {s} (פריים היום {p})','برايم {s} (البرايم اليوم {p})','Prime {s} (prime today {p})'],
  w_lPayTooLow:['ההחזר החודשי נמוך מדי: גם בלי ריבית בכלל צריך להחזיר לפחות {m} בחודש. בדקו את הסכום, השנים וההחזר.','القسط الشهري منخفض جدًا: حتى بدون فائدة يجب سداد {m} شهريًا على الأقل. تحققوا من المبلغ والسنوات والقسط.','The monthly payment is too low: even with no interest you’d need at least {m} a month. Check the amount, years and payment.'],
  w_lFairCap:['הריבית האפקטיבית גבוהה מהתקרה בחוק אשראי הוגן (בערך {c}). כדאי לבדוק את ההסכם או להתייעץ.','الفائدة الفعلية أعلى من السقف في قانون الائتمان العادل (نحو {c}). يُستحسن فحص الاتفاق أو الاستشارة.','The effective rate is above the Fair Credit Law cap (about {c}). Worth checking the contract or getting advice.'],
  w_lBulletRate:['בהלוואת בלון ההחזר החודשי הוא רק ריבית – את הסכום עצמו ({a}) מחזירים בסוף.','في قرض البالون القسط الشهري فائدة فقط – يُسدَّد المبلغ نفسه ({a}) في النهاية.','In a balloon loan the monthly payment is interest only – the amount itself ({a}) is repaid at the end.'],
  n_lRate:['הריבית חושבה מהסכום, מספר השנים וההחזר החודשי, לפי שיטת ההחזר שבחרתם. עמלות והצמדה למדד לא נכללות בחישוב הריבית.','حُسبت الفائدة من المبلغ وعدد السنوات والقسط الشهري حسب طريقة السداد المختارة. العمولات والربط بالمؤشر غير مشمولة.','The rate is worked out from the amount, years and monthly payment, by the repayment method you chose. Fees and CPI linkage aren’t included.'],
  h_lMode:['אפשר להתחיל מהסכום, מההחזר החודשי שנוח לכם – או לבדוק כמה ריבית אתם משלמים על הלוואה קיימת.','يمكن البدء من المبلغ أو من القسط المريح – أو فحص كم فائدة تدفعون على قرض قائم.','Start from the amount or the payment that suits you – or check what interest an existing loan carries.'],
});


/* ================= 8.5: comparing insurance offers, for every kind of insurance ================= */
const INS_KINDS = ['life', 'mortlife', 'mortprop', 'health', 'critical', 'disability', 'ltc', 'accident', 'carcomp', 'car3rd', 'carmand', 'homestruct', 'homecontent', 'travel', 'dental', 'pet', 'business'];
/* the offers are a list with no fixed size: add as many as you like, each with its insurer */
const INS_FK = [['p', 'f_insPx', 'cur'], ['g', 'f_insGx', '%'], ['d', 'f_insDx', 'cur'], ['c', 'f_insCx', 'cur'], ['x', 'f_insXx', '%'], ['xy', 'f_insXYx', 'yrs'], ['e', 'f_insEx', 'cur']];
function insSeed(){
  const o = {co: '', p: 180, g: 0, d: 0, c: 1000000, x: 0, xy: 0, e: 0};
  return [Object.assign({}, o), Object.assign({}, o, {p: 165, g: 4})];
}
function insList(){ if (!Array.isArray(SET.insOffers) || !SET.insOffers.length) SET.insOffers = insSeed(); return SET.insOffers; }
function insName(o, i, L){
  const def = t('lc_def', {n: i + 1}), own = String(o.n || '').trim();
  if (own) return own;
  if (!o.co) return def;
  const same = (L || insList()).filter(x => x.co === o.co && !String(x.n || '').trim()).length > 1;
  return t('o_insCo_' + o.co) + (same ? ' (' + def + ')' : '');
}
function insOffer(o, yrs, idx){
  const n0 = x => isFinite(+x) ? +x : 0;
  const p = Math.max(0, n0(o.p)), g = Math.max(-99, n0(o.g)) / 100, d = Math.max(0, n0(o.d)), cov = Math.max(0, n0(o.c));
  const disc = Math.max(0, n0(o.x)) / 100, dy = clamp(Math.round(n0(o.xy)), 0, 50), extra = Math.max(0, n0(o.e));
  let total = 0, first = 0;
  for (let y = 0; y < yrs; y++){
    const m = (p * Math.pow(1 + g, y) * Math.pow(1 + idx, y)) * (y < dy ? 1 - disc : 1) + extra * Math.pow(1 + idx, y);
    const yr = m * 12; total += yr; if (y === 0) first = yr;
  }
  return {p, g, d, cov, disc, dy, extra, total, first};
}
function calcInsurance(){
  const kind = ($('#ins_kind') || {}).value || 'life';
  const yrs = clamp(Math.round(v('ins_years')), 1, 60), idx = Math.max(-99, v('ins_idx')) / 100, claims = Math.max(0, v('ins_claims'));
  const by = ($('#ins_by') || {}).value || 'total';
  insCoFilter(kind);
  const src = insList();
  const L = src.map((o, i) => {
    const r = insOffer(o, yrs, idx);
    r.name = insName(o, i, src);
    r.ded = r.d * claims * yrs;                                     // the deductibles you would expect to pay over the period
    r.all = r.total + r.ded;
    r.per1k = r.cov > 0 ? r.all / yrs / (r.cov / 1000) : NaN;       // yearly cost for each ₪1,000 of cover
    return r;
  });
  const key = o => by === 'cover' ? (isFinite(o.per1k) ? o.per1k : Infinity) : o.all;
  const sorted = L.slice().sort((a, b) => key(a) - key(b)), best = sorted[0], worst = sorted[sorted.length - 1];
  const rows = [];
  sorted.forEach((o, i) => rows.push([(i === 0 ? '★ ' : (i + 1) + '. ') + o.name + ' · ' + t('r_insTotal', {y: yrs}), M(o.all), i === 0 ? 'key' : undefined]));
  if (L.length > 1) rows.push([t('r_insSave', {a: best.name, b: worst.name}), M(worst.all - best.all), 'key']);
  if (claims > 0) rows.push([t('r_insClaims'), N(claims, 2) + ' ' + t('r_insPerYear')]);
  const trows = sorted.map(o => [o.name, M(o.p, 2), M(o.first), M(o.total), M(o.ded), M(o.all), o.cov > 0 ? M(o.cov) : '—', isFinite(o.per1k) ? M(o.per1k, 2) : '—']);
  const warn = [];
  L.forEach(o => { if (o.g > 0.06) warn.push(t('w_insGrow', {n: o.name, g: PC(o.g * 100)})); if (o.disc > 0 && o.dy > 0 && o.dy < yrs) warn.push(t('w_insDisc', {n: o.name, y: o.dy})); });
  if (L.some(o => o.cov > 0 && Math.abs(o.cov - best.cov) / Math.max(1, best.cov) > 0.1)) warn.push(t('w_insCov'));
  return {
    hero: {label: t('r_insBest', {n: best.name}), value: M(best.all), sub: t('r_insBestSub', {y: yrs, s: M(worst.all - best.all), m: M(best.first / 12, 2)})},
    rows, warn: warn.slice(0, 4),
    table: {title: t('t_insCmp'), open: true, head: ['', t('h_insPm'), t('h_insY1'), t('h_insPrem'), t('h_insDed'), t('h_insAll'), t('h_insCov'), t('h_insPer1k')], rows: trows},
    note: t('n_ins_' + kind) + ' ' + t('n_ins')
  };
}
/* which insurers sell which kind: general insurers (car, home, business) are not offered for life and health plans, and PassportCard only for travel */
const INS_GENERAL = ['shomera', 'libra', 'wesure', 'shlomo'], INS_LIFEHEALTH = ['life', 'health', 'critical', 'disability', 'ltc', 'dental'];
function insCoOk(c, kind){
  if (c === 'passport') return kind === 'travel';
  if (INS_GENERAL.includes(c)) return !INS_LIFEHEALTH.includes(kind);
  return true;
}
var INS_KIND_SEEN = '';
function insCoFilter(kind){
  let fixed = false;
  insList().forEach(o => { if (o.co && !insCoOk(o.co, kind)){ o.co = ''; fixed = true; } });
  if (fixed) try { saveSet(); } catch (e) {}
  if (kind !== INS_KIND_SEEN || fixed){ INS_KIND_SEEN = kind; setTimeout(() => { try { insRender(); } catch (e) {} }, 0); }
}
Object.assign(CALC, {insurance: calcInsurance});
