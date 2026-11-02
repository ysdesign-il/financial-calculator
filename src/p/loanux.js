/* ---------- 13.63: the loan calculator made clearer – three steps (the loan · the interest · extras), the interest as buttons with one
   summary line, the result first (three numbers and one sentence) with the details folded, "what if the rate changes" for
   variable and prime loans, and one-line hints that open on tap. Every option and every calculation stays as it was. ---------- */
Object.assign(T, {
  lu_s1:['ההלוואה','القرض','The loan'],
  lu_s2:['הריבית','الفائدة','The interest'],
  lu_s3:['תוספות (לא חובה)','إضافات (اختياري)','Extras (optional)'],
  lu_on:['{n} פעילות','{n} مفعّلة','{n} on'],
  lu_on1:['1 פעילה','1 مفعّلة','1 on'],
  lu_rtFixed:['קבועה','ثابتة','Fixed'],
  lu_rtVar:['משתנה','متغيرة','Variable'],
  lu_rtPrime:['פריים','برايم','Prime'],
  lu_inTotal:['מספר אחד','رقم واحد','One number'],
  lu_inParts:['לפי חלקים','حسب الأجزاء','By parts'],
  lu_rYour:['הריבית שלכם: {x}','فائدتكم: {x}','Your rate: {x}'],
  lu_rYear:['{r} בשנה','{r} سنويًا','{r} a year'],
  lu_rCpi:['ועוד הצמדה למדד (צפוי {c} בשנה)','وفوقها ربط بالمؤشر (متوقع {c} سنويًا)','plus CPI linkage (expected {c} a year)'],
  lu_tInt:['סך הריבית','إجمالي الفائدة','Total interest'],
  lu_tTot:['סך הכול לתשלום','المجموع للدفع','Total to pay'],
  lu_tPay:['החזר חודשי','القسط الشهري','Monthly payment'],
  lu_sayPay:['תחזירו {p} כל חודש במשך {d}. בסך הכול {tot}, מתוכם {i} ריבית.','ستدفعون {p} كل شهر لمدة {d}. المجموع {tot}، منها {i} فائدة.','You will pay {p} a month for {d}. {tot} in all, of which {i} is interest.'],
  lu_sayAmt:['אפשר ללוות עד {a} בהחזר של {p} לחודש במשך {d}. בסך הכול {tot}, מתוכם {i} ריבית.','يمكن اقتراض حتى {a} بقسط {p} شهريًا لمدة {d}. المجموع {tot}، منها {i} فائدة.','You can borrow up to {a} at {p} a month for {d}. {tot} in all, of which {i} is interest.'],
  lu_sayTerm:['בהחזר של {p} לחודש תסיימו אחרי {d}. בסך הכול {tot}, מתוכם {i} ריבית.','بقسط {p} شهريًا تنتهون بعد {d}. المجموع {tot}، منها {i} فائدة.','At {p} a month you finish after {d}. {tot} in all, of which {i} is interest.'],
  lu_sayRate:['הריבית שההלוואה הזו באמת גובה: {r} בשנה. סך הריבית {i}.','الفائدة التي يحملها هذا القرض فعلًا: {r} سنويًا. إجمالي الفائدة {i}.','The rate this loan really carries: {r} a year. Total interest {i}.'],
  lu_sayMoves:['זה ההחזר הראשון – הוא ישתנה לאורך הדרך.','هذا القسط الأول – سيتغير مع الوقت.','That is the first payment – it will change along the way.'],
  lu_hRate:['איך בנויה הריבית','كيف تُبنى الفائدة','How the rate is built'],
  lu_hLed:['פירוט מלא','التفاصيل الكاملة','Full details'],
  lu_scH:['מה אם הריבית תשתנה?','ماذا لو تغيّرت الفائدة؟','What if the rate changes?'],
  lu_scVar:['בכל עדכון (כל {y} שנים) הריבית זזה ב-{s}. בלי הצמדה ובלי תוספות.','عند كل تحديث (كل {y} سنوات) تتحرك الفائدة {s}. بلا ربط وبلا إضافات.','At each reset (every {y} years) the rate moves {s}. No linkage, no extras.'],
  lu_scPrime:['ריבית בנק ישראל זזה ב-{s} בכל שנה. בלי תוספות.','فائدة بنك إسرائيل تتحرك {s} كل سنة. بلا إضافات.','The Bank of Israel rate moves {s} each year. No extras.'],
  lu_scSame:['נשארת כמו היום','تبقى كما اليوم','Stays as today'],
  lu_scUp:['עולה בהדרגה','ترتفع تدريجيًا','Rises gradually'],
  lu_scDown:['יורדת בהדרגה','تنخفض تدريجيًا','Falls gradually'],
  lu_scMine:['התרחיש שכתבתם','السيناريو الذي كتبتموه','Your scenario'],
  lu_scFirst:['החזר ראשון','القسط الأول','First payment'],
  lu_scLast:['החזר אחרון','القسط الأخير','Last payment'],
  lu_scInt:['סך הריבית','إجمالي الفائدة','Total interest'],
  lu_scUse:['בחירה בתרחיש','اختيار السيناريو','Use this scenario'],
  lu_scNow:['נבחר','مختار','Chosen'],
  lu_chipsAria:['איך הריבית תשתנה','كيف ستتغير الفائدة','How the rate will change'],
  lu_more:['עוד','المزيد','more'],
  lu_dY:['{y} שנים','{y} سنوات','{y} years'], lu_d1:['שנה','سنة','one year'], lu_dM:['{m} חודשים','{m} أشهر','{m} months'],
  lu_dYM:['{y} ו-{m}','{y} و{m}','{y} and {m}'], lu_dM1:['חודש','شهر','one month']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
#panel-loan .lu-step{grid-column:1/-1;display:flex;align-items:center;gap:10px;margin:14px 0 2px;padding-top:12px;border-top:1px solid var(--line)}
#panel-loan .fields > .lu-step:first-child{border-top:0;padding-top:0;margin-top:0}
#panel-loan .lu-step b,#panel-loan details.adv > summary.lu-sum3 b{font-size:1.02rem;font-weight:700;color:var(--ink)}
.lu-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold,#9A6A06);color:#fff;font-weight:700;font-size:.86rem;font-variant-numeric:tabular-nums}
#panel-loan details.adv > summary.lu-sum3{display:flex;align-items:center;gap:10px;cursor:pointer;list-style:none;padding:12px 0}
#panel-loan details.adv > summary.lu-sum3::-webkit-details-marker{display:none}
#panel-loan details.adv > summary.lu-sum3::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
#panel-loan details.adv[open] > summary.lu-sum3::after{transform:rotate(180deg)}
.lu-badge{font-size:.78rem;padding:3px 9px;border-radius:999px;border:1px solid var(--gold,#9A6A06);color:var(--gold,#9A6A06)}
.lu-badge:empty{display:none}
.lu-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.lu-seg button{flex:1 1 0;min-width:84px;min-height:44px;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--field,transparent);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.lu-seg button[aria-checked="true"]{background:var(--gold,#9A6A06);border-color:var(--gold,#9A6A06);color:#fff}
.lu-seg button:focus-visible{outline:2px solid var(--focus,#1F4FB8);outline-offset:2px}
.lu-host > select,.lu-host .control{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;opacity:0}
#lu-rsum{grid-column:1/-1;margin:4px 0 2px;padding:12px 14px;border-radius:14px;border:1px solid var(--gold,#9A6A06);font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
#lu-rsum small{display:block;font-weight:400;color:var(--ink-2);margin-top:2px}
#panel-loan .lx-say{display:none}
#lu-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
#lu-sum .lu-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
#lu-sum .lu-t span{font-size:.82rem;color:var(--ink-2)}
#lu-sum .lu-t b{font-size:1.15rem;font-variant-numeric:tabular-nums;color:var(--ink)}
#lu-sum p{grid-column:1/-1;margin:2px 0 0;line-height:1.6;color:var(--ink)}
#lu-sum p small{display:block;color:var(--ink-2)}
#panel-loan.lu-pay #hero-loan .hero-sub{display:none}
.lu-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
.lu-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
.lu-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
#panel-loan.lu-c-rate #lx-card,#panel-loan.lu-c-led #led-loan{display:none!important}
#lu-scn{margin:12px 0 0;padding:14px;border-radius:16px;border:1px solid var(--line)}
#lu-scn h3{margin:0 0 4px;font-size:1rem}
#lu-scn > p{margin:0 0 10px;font-size:.86rem;color:var(--ink-2)}
.lu-sc{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:10px 0;border-top:1px solid var(--line);align-items:center}
.lu-sc .nm{font-weight:700}
.lu-sc .nums{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-variant-numeric:tabular-nums;font-size:.9rem}
.lu-sc .nums span{display:flex;flex-direction:column;min-width:0}.lu-sc .nums small{color:var(--ink-2);font-size:.76rem}
.lu-sc button{min-height:36px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-size:.84rem;cursor:pointer}
.lu-sc.now .nm::after{content:" ✓";color:var(--gold,#9A6A06)}
.lu-sc.now button{border-color:var(--gold,#9A6A06);color:var(--gold,#9A6A06)}
.lu-scchips{grid-column:1/-1}
#panel-loan .field.lu-wide{grid-column:1/-1}
#panel-loan .field .hint{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
#panel-loan .field .hint.lu-open{display:block;-webkit-line-clamp:unset}
@media (max-width:380px){#lu-sum{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.lu-tog::after,#panel-loan details.adv > summary.lu-sum3::after{transition:none}}`;
  document.head.appendChild(st);
})();
const luE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const luBox = id => { const f = document.getElementById(id); return f && f.closest('.field'); };
const LU_OPEN = {rate: false, led: false};
/* buttons that stand for a select: the select stays (saved values, every listener), the buttons set it */
function luSeg(selId, opts){
  const sel = document.getElementById(selId), box = sel && sel.closest('.field'); if (!box || box.querySelector('.lu-seg')) return;
  box.classList.add('lu-host');
  const lab = box.querySelector('label');
  (sel.closest('.control') || sel).insertAdjacentHTML('afterend', `<div class="lu-seg" role="radiogroup"${lab ? ` aria-labelledby="${selId}-lul"` : ''}>${opts.map(([v, k]) => `<button type="button" role="radio" data-lus="${selId}" data-v="${v}" data-i="${k}">${luE(t(k))}</button>`).join('')}</div>`);
  if (lab) lab.id = selId + '-lul';
}
function luSegSync(){
  document.querySelectorAll('#panel-loan [data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); b.setAttribute('aria-checked', String(!!s && s.value === b.dataset.v)); b.tabIndex = s && s.value === b.dataset.v ? 0 : -1; });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-lus]'); if (!b) return;
  const s = document.getElementById(b.dataset.lus); if (!s || s.value === b.dataset.v) return;
  s.value = b.dataset.v; s.dispatchEvent(new Event('input', {bubbles: true})); s.dispatchEvent(new Event('change', {bubbles: true})); luSegSync();
});
document.addEventListener('keydown', e => {
  const b = e.target.closest && e.target.closest('[data-lus]'); if (!b || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const all = [...b.parentElement.querySelectorAll('[data-lus]')], i = all.indexOf(b), rtl = document.documentElement.dir === 'rtl';
  const n = all[(i + ((e.key === 'ArrowLeft') === rtl ? 1 : all.length - 1)) % all.length]; n.click(); n.focus();
});
/* the hint under a field shows one line; a tap opens the rest */
document.addEventListener('click', e => {
  const h = e.target.closest && e.target.closest('#panel-loan .field .hint'); if (h) h.classList.toggle('lu-open');
});
/* the three steps */
function luSetup(){
  const p = document.getElementById('panel-loan'), box = p && p.querySelector('.inputs > .fields');
  if (!box || box.dataset.lu) return;
  box.dataset.lu = '1';
  try { if (typeof UX_NOSIMPLE !== 'undefined' && !UX_NOSIMPLE.includes('loan')){ UX_NOSIMPLE.push('loan'); uxMark('loan'); } } catch (e) {}
  const step = (n, k) => { const d = document.createElement('div'); d.className = 'lu-step'; d.innerHTML = `<span class="lu-n" aria-hidden="true">${n}</span><b data-i="${k}" role="heading" aria-level="3">${luE(t(k))}</b>`; return d; };
  const put = ids => ids.map(luBox).filter(Boolean).forEach(b => box.appendChild(b));
  const known = new Set();
  const s1 = ['l_mode', 'l_amount', 'l_pay', 'l_years', 'l_months', 'l_type'];
  const s2 = ['l_rateType', 'l_rateIn', 'l_rate', 'l_pBoi', 'l_pSpread', 'l_pAdd', 'l_boi', 'l_spread', 'l_margin', 'l_varEvery', 'l_varChg', 'l_boiChg', 'l_link', 'l_cpi'];
  s1.concat(s2).forEach(id => { const b = luBox(id); if (b) known.add(b); });
  const rest = [...box.children].filter(c => !known.has(c) && c.id !== 'lri-chipbox' && c.id !== 'lx-chipbox');      // anything else keeps its place after the steps
  box.appendChild(step(1, 'lu_s1')); put(s1);
  box.appendChild(step(2, 'lu_s2')); put(s2);
  [['lri-chipbox', 'l_pAdd'], ['lx-chipbox', 'l_margin']].forEach(([cb, after]) => { const c = document.getElementById(cb), f = luBox(after); if (c && f) f.after(c); });
  const rs = document.createElement('div'); rs.id = 'lu-rsum'; rs.setAttribute('aria-live', 'polite'); box.appendChild(rs);
  rest.forEach(c => box.appendChild(c));
  /* step 3 is the extras box that was already folded */
  const adv = p.querySelector('.inputs > details.adv');
  if (adv){ const sm = adv.querySelector(':scope > summary'); if (sm){ sm.className = 'lu-sum3'; sm.innerHTML = `<span class="lu-n" aria-hidden="true">3</span><b data-i="lu_s3">${luE(t('lu_s3'))}</b><span class="lu-badge"></span>`; } adv.open = false; }
  ['l_amount', 'l_pay', 'l_type'].forEach(id => { const b = luBox(id); if (b) b.classList.add('lu-wide'); });
  luSeg('l_rateType', [['fixed', 'lu_rtFixed'], ['var', 'lu_rtVar'], ['prime', 'lu_rtPrime']]);
  luSeg('l_rateIn', [['total', 'lu_inTotal'], ['parts', 'lu_inParts']]);
  /* the folded parts of the result */
  const tog = (k, before) => { const el = document.getElementById(before); if (!el || document.querySelector(`[data-lut="${k}"]`)) return;
    el.insertAdjacentHTML('beforebegin', `<button type="button" class="lu-tog" data-lut="${k}" aria-expanded="false" aria-controls="${before}"><span data-i="${k === 'rate' ? 'lu_hRate' : 'lu_hLed'}">${luE(t(k === 'rate' ? 'lu_hRate' : 'lu_hLed'))}</span></button>`); };
  tog('led', 'led-loan');
  luSegSync();
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-lut]'); if (!b) return;
  const k = b.dataset.lut; LU_OPEN[k] = !LU_OPEN[k]; luFold();
});
function luFold(){
  const p = document.getElementById('panel-loan'); if (!p) return;
  ['rate', 'led'].forEach(k => { p.classList.toggle('lu-c-' + k, !LU_OPEN[k]); const b = p.querySelector(`[data-lut="${k}"]`); if (b) b.setAttribute('aria-expanded', String(!!LU_OPEN[k])); });
}
/* how many extras are switched on */
function luExtras(){
  const p = document.getElementById('panel-loan'), adv = p && p.querySelector('.inputs > details.adv'), bd = adv && adv.querySelector('.lu-badge'); if (!bd) return;
  const def = typeof uxDefaults === 'function' ? uxDefaults('loan') : {};
  const on = ['l_grace', 'l_extra', 'l_pre', 'l_feePct', 'l_feeFix'].filter(id => { const e = document.getElementById(id); return e && Math.abs(parseFloat(e.value) || 0) > 1e-9 && String(e.value) !== String(def[id] != null ? def[id] : '0'); }).length;
  bd.textContent = on ? (on === 1 ? t('lu_on1') : t('lu_on', {n: on})) : '';
}
/* the interest in one line */
function luRateLine(){
  const el = document.getElementById('lu-rsum'); if (!el) return;
  const mode = ($('#l_mode') || {}).value || 'pay', rt = ($('#l_rateType') || {}).value || 'fixed';
  if (mode === 'rate'){ el.hidden = true; return; }
  el.hidden = false;
  const sg = x => (x < 0 ? '− ' : '+ ') + PC(Math.abs(x));
  let x;
  if (rt === 'prime'){ const b = v('l_boi'), s = v('l_spread'), m = v('l_margin'); x = `${PC(b)} + ${PC(s)} ${sg(m)} = ${t('lu_rYear', {r: PC(Math.max(0, b + s + m))})}`; }
  else if (typeof LRI === 'object' && LRI){ x = `${PC(LRI.boi)} + ${PC(LRI.spread)} ${sg(LRI.add)} = ${t('lu_rYear', {r: PC(LRI.rate)})}`; }
  else x = t('lu_rYear', {r: PC(Math.max(0, v('l_rate')))});
  const linked = rt !== 'prime' && (($('#l_link') || {}).value || 'none') === 'cpi';
  el.innerHTML = `<span dir="auto">${luE(t('lu_rYour', {x}))}</span>${linked ? `<small>${luE(t('lu_rCpi', {c: PC(v('l_cpi'))}))}</small>` : ''}`;
}
function luDur(n){
  const y = Math.floor(n / 12), m = n % 12;
  const ys = y === 1 ? t('lu_d1') : t('lu_dY', {y: N(y, 0)}), ms = m === 1 ? t('lu_dM1') : t('lu_dM', {m: N(m, 0)});
  return y && m ? t('lu_dYM', {y: ys, m: ms}) : y ? ys : ms;
}
/* the interest-type buttons come back when you leave "what rate does my loan carry" */
{ const awLU = applyWhen; applyWhen = function(id){ const r = awLU.apply(this, arguments);
  if (id === 'loan'){ const b = luBox('l_rateType'); if (b) b.hidden = (($('#l_mode') || {}).value) === 'rate'; }
  return r; }; }
/* the result first: three numbers and one sentence */
function luSummary(res){
  const p = document.getElementById('panel-loan'), hero = document.getElementById('hero-loan'); if (!p || !hero) return;
  let s = document.getElementById('lu-sum');
  if (!s){ hero.insertAdjacentHTML('afterend', '<section id="lu-sum" aria-live="polite"></section>'); s = document.getElementById('lu-sum'); }
  const mode = ($('#l_mode') || {}).value || 'pay';
  p.classList.toggle('lu-pay', mode === 'pay');
  if (!res || !res.rows || !res.rows.length){ s.hidden = true; return; }
  const row = k => { const r = res.rows.find(x => x[0] === t(k)); return r ? strip(r[1]) : ''; };
  const pay = row('r_monthly') || row('r_firstPay'), int = row('r_totInt') || row('r_lIntTot'), tot = row('r_totPaid');
  const moves = !row('r_monthly') && !!row('r_firstPay');
  const nPay = parseInt(String(row('r_numPay')).replace(/[^\d]/g, ''), 10);
  const dur = isFinite(nPay) && nPay > 0 ? luDur(nPay) : row('r_payoff');
  let say = '';
  if (mode === 'pay') say = t('lu_sayPay', {p: pay, d: dur, tot, i: int});
  else if (mode === 'amount') say = t('lu_sayAmt', {a: strip(res.hero && res.hero.value || ''), p: pay, d: dur, tot, i: int});
  else if (mode === 'term') say = t('lu_sayTerm', {p: pay, d: strip(res.hero && res.hero.value || '') || dur, tot, i: int});
  else say = t('lu_sayRate', {r: strip(res.hero && res.hero.value || ''), i: int});
  const tiles = mode === 'pay' ? [['lu_tInt', int], ['lu_tTot', tot]] : mode === 'rate' ? [['lu_tInt', int], ['lu_tPay', row('r_monthly') || M(v('l_pay'), 2)]] : [['lu_tPay', pay], ['lu_tTot', tot]];
  s.hidden = false;
  s.innerHTML = tiles.filter(x => x[1]).map(([k, val]) => `<div class="lu-t"><span>${luE(t(k))}</span><b class="num">${luE(val)}</b></div>`).join('')
    + `<p>${luE(say)}${moves && mode !== 'rate' ? `<small>${luE(t('lu_sayMoves'))}</small>` : ''}</p>`;
}
/* what if the rate changes – variable and prime, by monthly payment */
const LU_STEP = {var: 0.5, prime: 0.1};
function luScen(){
  const det = document.querySelector('#panel-loan .detail'); if (!det) return;
  let c = document.getElementById('lu-scn');
  const mode = ($('#l_mode') || {}).value || 'pay', rt = ($('#l_rateType') || {}).value || 'fixed';
  if (mode !== 'pay' || rt === 'fixed'){ if (c) c.hidden = true; return; }
  if (!c){ const at = document.querySelector('[data-lut="led"]') || document.getElementById('led-loan'); if (!at) return; at.insertAdjacentHTML('beforebegin', '<section id="lu-scn" aria-labelledby="lu-scn-h"></section>'); c = document.getElementById('lu-scn'); }
  c.hidden = false;
  const amt = Math.max(0, v('l_amount')), n = Math.max(1, Math.round(clamp(v('l_years'), 0.25, 50) * 12)), type = ($('#l_type') || {}).value || 'annuity';
  const rate = rt === 'prime' ? Math.max(0, v('l_boi') + v('l_spread') + v('l_margin')) : Math.max(0, v('l_rate'));
  const every = rt === 'var' ? Math.max(1, Math.round(clamp(v('l_varEvery'), 1, 30) * 12)) : 12;
  const fld = rt === 'var' ? 'l_varChg' : 'l_boiChg', cur = v(fld) || 0, stp = LU_STEP[rt];
  const list = [['lu_scSame', 0], ['lu_scUp', stp], ['lu_scDown', -stp]];
  if (!list.some(x => Math.abs(x[1] - cur) < 1e-9)) list.push(['lu_scMine', cur]);
  const sim = chg => loanSim({amt, rate, n, type, grace: 0, ci: 0, extra: 0, pre: 0, preM: 1, rateAt: chg ? (m => rate + chg * Math.floor((m - 1) / every)) : null});
  const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '±') + N(Math.abs(x), 2) + '%';
  c.innerHTML = `<h3 id="lu-scn-h">${luE(t('lu_scH'))}</h3><p>${luE(rt === 'var' ? t('lu_scVar', {y: N(every / 12, 0), s: '±' + N(stp, 2) + '%'}) : t('lu_scPrime', {s: '±' + N(stp, 2) + '%'}))}</p>`
    + list.map(([k, chg]) => { const s = sim(chg), f = s[0] ? s[0].pay : 0, l = s.length ? s[s.length - 1].pay : 0, i = s.reduce((a, x) => a + x.int, 0), now = Math.abs(chg - cur) < 1e-9;
      return `<div class="lu-sc${now ? ' now' : ''}"><span class="nm">${luE(t(k))}${k === 'lu_scMine' ? ' (' + luE(sgn(chg)) + ')' : ''}</span>`
        + (now ? `<button type="button" disabled>${luE(t('lu_scNow'))}</button>` : `<button type="button" data-lusc="${chg}" data-f="${fld}">${luE(t('lu_scUse'))}</button>`)
        + `<div class="nums"><span><small>${luE(t('lu_scFirst'))}</small>${luE(M(f, 2))}</span><span><small>${luE(t('lu_scLast'))}</small>${luE(M(l, 2))}</span><span><small>${luE(t('lu_scInt'))}</small>${luE(M(i))}</span></div></div>`; }).join('');
}
/* the same three choices as buttons under the "expected change" field */
function luScChips(){
  [['l_varChg', 'var'], ['l_boiChg', 'prime']].forEach(([id, rt]) => {
    const b = luBox(id); if (!b) return;
    b.classList.add('lu-wide');
    let w = b.querySelector('.lu-scchips');
    if (!w){ b.querySelector('.fb').insertAdjacentHTML('beforeend', `<div class="lu-seg lu-scchips" role="group" aria-label="${luE(t('lu_chipsAria'))}">${[['lu_scSame', 0], ['lu_scUp', LU_STEP[rt]], ['lu_scDown', -LU_STEP[rt]]].map(([k, x]) => `<button type="button" data-lusc="${x}" data-f="${id}" data-i="${k}">${luE(t(k))}</button>`).join('')}</div>`); w = b.querySelector('.lu-scchips'); }
    const cv = v(id) || 0; w.querySelectorAll('[data-lusc]').forEach(x => x.setAttribute('aria-pressed', String(Math.abs(+x.dataset.lusc - cv) < 1e-9)));
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-lusc]'); if (!b) return;
  const f = document.getElementById(b.dataset.f); if (!f) return;
  f.value = String(+b.dataset.lusc); f.dispatchEvent(new Event('input', {bubbles: true})); f.dispatchEvent(new Event('change', {bubbles: true}));
});
const showLU = show;
show = function(id, res){
  showLU.apply(this, arguments);
  if (id !== 'loan') return;
  try { luSetup(); if (document.getElementById('lx-card')){ const lc = document.getElementById('lx-card'); if (!document.querySelector('[data-lut="rate"]')) lc.insertAdjacentHTML('beforebegin', `<button type="button" class="lu-tog" data-lut="rate" aria-expanded="false" aria-controls="lx-card"><span data-i="lu_hRate">${luE(t('lu_hRate'))}</span></button>`); const tb = document.querySelector('[data-lut="rate"]'); if (tb) tb.hidden = !!lc.hidden; } } catch (e) {}
  try { luFold(); } catch (e) {}
  try { luSummary(res); } catch (e) {}
  try { luRateLine(); } catch (e) {}
  try { luScen(); } catch (e) {}
  try { luScChips(); } catch (e) {}
  try { luExtras(); } catch (e) {}
  try { luSegSync(); } catch (e) {}
};
try { luSetup(); luFold(); } catch (e) {}
