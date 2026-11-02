/* ---------- 13.62: loans – the number of payments next to the years; typing one fills in the other ---------- */
Object.assign(T, {
  f_lMonths:['מספר תשלומים','عدد الدفعات','Number of payments'],
  h_lMonths:['תשלום אחד בכל חודש: 12 תשלומים = שנה, 60 תשלומים = 5 שנים. משנים כאן – השנים מתעדכנות, ולהפך.','دفعة واحدة كل شهر: 12 دفعة = سنة، 60 دفعة = 5 سنوات. تغييرها هنا يحدّث السنوات، والعكس.','One payment a month: 12 payments = a year, 60 payments = 5 years. Change it here and the years update, and the other way round.']
});
const lmSet = (id, val) => { const e = document.getElementById(id); if (e && e.value !== val){ e.value = val; try { syncRanges(); } catch (x) {} } };
const lmFromYears = () => { const y = v('l_years'); return isFinite(y) && y > 0 ? String(Math.round(y * 12)) : ''; };
/* runs before the calculation reads the fields (capture), so the result already uses the new value */
document.addEventListener('input', e => {
  const id = e.target && e.target.id;
  if (id === 'l_months'){ const m = v('l_months'); if (isFinite(m) && m > 0) lmSet('l_years', String(Math.round(m / 12 * 100) / 100)); }
  else if (id === 'l_years'){ const m = lmFromYears(); if (m) lmSet('l_months', m); }
}, true);
/* the years stay the source (saved values, examples, a solved term): the payments follow unless you are typing in them */
const calcLoanLM = CALC.loan;
CALC.loan = function(){
  const me = $('#l_months');
  if (me && document.activeElement !== me){ const m = lmFromYears(); if (m) lmSet('l_months', m); }
  return calcLoanLM.apply(this, arguments);
};
