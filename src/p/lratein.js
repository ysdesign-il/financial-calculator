/* ---------- 13.61: fixed or variable loans – type the rate as one number (as in the offer),
   or build it from its parts: Bank of Israel rate + prime spread + what the bank adds ("plus 1", "plus 2") ---------- */
Object.assign(T, {
  f_lRateIn:['איך להזין את הריבית','كيف تُدخلون الفائدة','How to enter the rate'],
  o_lriTotal:['ריבית כוללת – מספר אחד, כמו בהצעה','فائدة إجمالية – رقم واحد كما في العرض','Total rate – one number, as in the offer'],
  o_lriParts:['בנק ישראל + פריים + תוספת הבנק','بنك إسرائيل + برايم + إضافة البنك','Bank of Israel + prime + the bank\'s addition'],
  h_lRateIn:['ריבית כוללת – כותבים את הריבית השנתית כמו שהיא. לפי חלקים – ריבית בנק ישראל (מתעדכנת לבד), מרווח הפריים (1.5%), ומה שהבנק מוסיף, למשל פלוס 1 או פלוס 2. הריבית הכוללת מחושבת לבד.','إجمالية – تكتبون الفائدة السنوية كما هي. حسب الأجزاء – فائدة بنك إسرائيل (تتحدث تلقائيًا)، هامش البرايم (1.5%)، وما يضيفه البنك، مثلًا زائد 1 أو زائد 2. تُحسب الفائدة الإجمالية تلقائيًا.','Total – type the annual rate as it is. By parts – the Bank of Israel rate (updates by itself), the prime spread (1.5%), and what the bank adds, e.g. plus 1 or plus 2. The total is worked out for you.'],
  f_lPAdd:['תוספת הבנק (פלוס / מינוס)','إضافة البنك (زائد / ناقص)','The bank\'s addition (plus / minus)'],
  h_lPAdd:['מה שהבנק מוסיף מעל הפריים: פלוס 1 → 1, פלוס 2 → 2, מינוס 0.5 → ‎-0.5.','ما يضيفه البنك فوق البرايم: زائد 1 → 1، زائد 2 → 2، ناقص 0.5 → ‎-0.5.','What the bank adds on top of prime: plus 1 → 1, plus 2 → 2, minus 0.5 → -0.5.'],
  lri_ask:['כמה הבנק מוסיף? בחרו או כתבו למעלה','كم يضيف البنك؟ اختاروا أو اكتبوا أعلاه','How much does the bank add? Pick one or type it above'],
  lri_chip:['{m}','{m}','{m}'],
  lri_chipsAria:['תוספת הבנק','إضافة البنك','The bank\'s addition'],
  lri_sum:['ריבית שנתית כוללת: {b} + {s} {a} = {r}','الفائدة السنوية الإجمالية: {b} + {s} {a} = {r}','Total annual rate: {b} + {s} {a} = {r}'],
  r_lriBoi:['ריבית בנק ישראל','فائدة بنك إسرائيل','Bank of Israel rate'],
  r_lriSpread:['מרווח הפריים','هامش البرايم','Prime spread'],
  r_lriAdd:['תוספת הבנק','إضافة البنك','The bank\'s addition'],
  r_lriTotal:['ריבית שנתית כוללת','الفائدة السنوية الإجمالية','Total annual rate'],
  r_lriIntBoi:['מתוך הריבית ששולמה – בגלל בנק ישראל','من الفائدة المدفوعة – بسبب بنك إسرائيل','Of the interest paid – from the Bank of Israel rate'],
  r_lriIntSpread:['מתוך הריבית ששולמה – בגלל מרווח הפריים','من الفائدة المدفوعة – بسبب هامش البرايم','Of the interest paid – from the prime spread'],
  r_lriIntAdd:['מתוך הריבית ששולמה – בגלל תוספת הבנק','من الفائدة المدفوعة – بسبب إضافة البنك','Of the interest paid – from the bank\'s addition']
});
const lriOn = () => {
  const rt = ($('#l_rateType') || {}).value || 'fixed', mode = ($('#l_mode') || {}).value || 'pay', inp = ($('#l_rateIn') || {}).value || 'total';
  return rt !== 'prime' && mode !== 'rate' && inp === 'parts';
};
const lriSg = x => (x < 0 ? '− ' : '+ ') + PC(Math.abs(x));
var LRI = null;
const calcLoanRI = CALC.loan;
CALC.loan = function(){
  LRI = null;
  if (!lriOn()) return calcLoanRI.apply(this, arguments);
  /* the Bank of Israel rate follows the live figure until you type your own */
  const be = $('#l_pBoi');
  if (be && !be.dataset.user && typeof MKT === 'object' && MKT.boi > 0 && Math.abs(v('l_pBoi') - MKT.boi) > 1e-9) be.value = String(Math.round(MKT.boi * 100) / 100);
  const boi = v('l_pBoi') || 0, spread = v('l_pSpread') || 0, add = v('l_pAdd') || 0, rate = Math.max(0, boi + spread + add);
  /* the total goes into the annual-rate field, so switching back to "total" keeps it */
  const re = $('#l_rate'), nv = String(Math.round(rate * 100) / 100);
  if (re && re.value !== nv){ re.value = nv; try { syncRanges(); } catch (e) {} }
  LRI = {boi, spread, add, rate};
  const res = calcLoanRI.apply(this, arguments);
  if (!res || !res.rows) return res;
  /* the card above the results uses the parts you typed */
  if (LX && typeof LX === 'object'){ LX.boi = boi; LX.spread = spread; LX.prime = boi + spread; }
  const top = [[t('r_lriBoi'), PC(boi)], [t('r_lriSpread'), '+ ' + PC(spread)], [t('r_lriAdd'), lriSg(add)], [t('r_lriTotal'), PC(rate), 'key']];
  const totRow = res.rows.find(x => x[0] === t('r_totInt'));
  const totInt = totRow ? parseFloat(String(strip(totRow[1])).replace(/[^\d.\-]/g, '')) : NaN;
  if (rate > 0 && isFinite(totInt) && totInt > 0){
    const share = x => totInt * x / rate;
    top.push([t('r_lriIntBoi'), M(share(boi))], [t('r_lriIntSpread'), M(share(spread))], [t('r_lriIntAdd'), (add < 0 ? '−' : '') + M(Math.abs(share(add)))]);
  }
  res.rows = top.concat(res.rows);
  return res;
};
document.addEventListener('input', e => { if (e.target && e.target.id === 'l_pBoi') e.target.dataset.user = '1'; }, true);
/* by parts: the one-number field steps aside, and the parts show only when they are used */
{ const awRI = applyWhen; applyWhen = function(id){ const r = awRI.apply(this, arguments);
  if (id === 'loan'){
    const on = lriOn(), rt = ($('#l_rateType') || {}).value || 'fixed', rm = (($('#l_mode') || {}).value) === 'rate';
    const box = k => { const f = $('#' + k); return f && f.closest('.field'); };
    const ri = box('l_rateIn'); if (ri && (rm || rt === 'prime')) ri.hidden = true;
    const rb = box('l_rate'); if (rb && on) rb.hidden = true;
    ['l_pBoi', 'l_pSpread', 'l_pAdd'].forEach(k => { const b = box(k); if (b) b.hidden = !on; });
  }
  return r; }; }
/* quick buttons under the bank's addition, and the total as one sentence */
function lriChips(){
  const f = $('#l_pAdd'), box = f && f.closest('.field'); if (!box) return;
  let w = document.getElementById('lri-chipbox');
  if (!w){
    box.insertAdjacentHTML('afterend', `<div class="field wide lx-chipbox" id="lri-chipbox"><span class="lx-ask">${lxE(t('lri_ask'))}</span><div class="lx-chips" role="group" aria-label="${lxE(t('lri_chipsAria'))}">${[-0.5, 0, 0.5, 1, 1.5, 2, 3].map(x => `<button type="button" class="lx-chip" data-lri="${x}" dir="ltr">${lxE(lxSg(x))}</button>`).join('')}</div><p class="lx-say" aria-live="polite"></p></div>`);
    w = document.getElementById('lri-chipbox');
  }
  w.hidden = !LRI || !!box.hidden;
  if (!LRI) return;
  const m = v('l_pAdd');
  w.querySelectorAll('[data-lri]').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(+b.dataset.lri - m) < 1e-9)));
  const say = w.querySelector('.lx-say');
  if (say) say.textContent = t('lri_sum', {b: PC(LRI.boi), s: PC(LRI.spread), a: lriSg(LRI.add), r: PC(LRI.rate)});
}
const showRI = show;
show = function(id, res){ showRI.apply(this, arguments); if (id === 'loan'){ try { lriChips(); } catch (e) {} } };
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-lri]'); if (!b) return;
  const f = $('#l_pAdd'); if (!f) return;
  f.value = String(+b.dataset.lri); f.dispatchEvent(new Event('input', {bubbles: true})); f.dispatchEvent(new Event('change', {bubbles: true}));
});
