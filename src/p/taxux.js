/* ---------- 13.68: the income tax calculator made clearer – four steps (the income · personal details · credits and
   deductions · tax values), the year/month choice as buttons, the result first (two numbers and one sentence) with the
   full breakdown folded, and a count of what is on in each folded group. Every field and calculation stays as it was. ---------- */
Object.assign(T, {
  tu_s1:['ההכנסה','الدخل','The income'],
  tu_s2:['מצב אישי','الوضع الشخصي','Personal details'],
  tu_s2h:['קובע את נקודות הזיכוי – כמה מס תחסכו','يحدد نقاط الاعتماد – كم ضريبة توفّرون','Sets your tax credit points – how much tax you save'],
  tu_s3:['זיכויים, ניכויים והכנסות נוספות','اعتمادات وخصومات ودخل إضافي','Credits, deductions and other income'],
  tu_s3h:['פנסיה עצמאית, תרומות, יישוב מזכה, הכנסה מהון','تقاعد ذاتي، تبرعات، بلدة مؤهلة، دخل من رأس المال','Own pension, donations, eligible town, capital income'],
  tu_s4:['ערכי המס (לא חובה)','قيم الضريبة (اختياري)','Tax values (optional)'],
  tu_tEff:['שיעור מס אפקטיבי','نسبة الضريبة الفعلية','Effective tax rate'],
  tu_tMarg:['מדרגת המס השולית','الشريحة الحدية','Marginal bracket'],
  tu_say:['על הכנסה של {i} בשנה תשלמו {t} מס הכנסה – {e} מההכנסה. נשארים לכם {a}.','على دخل {i} سنويًا ستدفعون {t} ضريبة دخل – {e} من الدخل. يبقى لكم {a}.','On an income of {i} a year you pay {t} income tax – {e} of the income. You keep {a}.'],
  tu_sayM:['כל שקל נוסף שתרוויחו ימוסה ב-{m}.','كل شيكل إضافي تكسبونه يُضرَّب بـ{m}.','Every extra shekel you earn is taxed at {m}.'],
  tu_hLed:['פירוט מלא','التفاصيل الكاملة','Full breakdown']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
#panel-tax .su-step{display:flex;align-items:center;gap:10px;margin:22px 0 6px;padding-top:16px;border-top:1px solid var(--line)}
#panel-tax .inputs > .su-step:first-child{border-top:0;padding-top:0;margin-top:0}
#panel-tax .su-step b{font-size:1.05rem;font-weight:700;color:var(--ink)}
#panel-tax .su-step small{display:block;font-size:.8rem;color:var(--ink-2);margin-top:1px}
#panel-tax .su-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold-ui,#F2C45A);color:#1a1405;font-weight:700;font-size:.86rem}
#panel-tax .su-badge{margin-inline-start:8px;font-size:.74rem;padding:2px 8px;border-radius:999px;border:1px solid var(--gold-ui,#F2C45A);color:var(--gold-ui,#F2C45A);font-weight:600}
#panel-tax .su-badge:empty{display:none}
#tu-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
#tu-sum .su-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
#tu-sum .su-t span{font-size:.82rem;color:var(--ink-2)}
#tu-sum .su-t b{font-size:1.15rem;font-variant-numeric:tabular-nums;color:var(--ink)}
#tu-sum p{grid-column:1/-1;margin:2px 0 0;line-height:1.65;color:var(--ink)}
#tu-sum p small{display:block;color:var(--ink-2);margin-top:2px}
#panel-tax #hero-tax .hero-sub{display:none}
#panel-tax .su-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
#panel-tax .su-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
#panel-tax .su-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
#panel-tax.tu-c-led #led-tax{display:none!important}
@media (min-width:1180px){#panel-tax.panel:not(.panel-flat){grid-template-areas:"svbar svbar" "inputs hero" "inputs sum" "inputs detail";grid-template-rows:auto auto auto 1fr}
  #panel-tax > .svbar{grid-area:svbar}#panel-tax > #tu-sum{grid-area:sum;margin-top:14px}}
@media (max-width:380px){#tu-sum{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
const tuE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const tuB = x => tuE(x).replace(/-?[\d.,]+%/g, m => '<bdi>' + m + '</bdi>');
const tuP = s => { const x = parseFloat(String(s).replace(/[^\d.]/g, '')); if (!isFinite(x)) return s; const r = Math.round(x * 10) / 10; return N(r, r % 1 ? 1 : 0) + '%'; };
let TU_OPEN = false;
const tuGrp = (inputs, k) => { const s = inputs.querySelector(`:scope > details > summary[data-i="${k}"]`); return s ? s.parentElement : null; };
function tuSetup(){
  const p = document.getElementById('panel-tax'), inputs = p && p.querySelector(':scope > .inputs');
  if (!inputs || inputs.dataset.tu) return;
  const main = inputs.querySelector(':scope > .fields'); if (!main) return;
  inputs.dataset.tu = '1';
  const step = (n, k, h) => { const d = document.createElement('div'); d.className = 'su-step';
    d.innerHTML = `<span class="su-n" aria-hidden="true">${n}</span><div><b data-i="${k}" role="heading" aria-level="3">${tuE(t(k))}</b>${h ? `<small data-i="${h}">${tuE(t(h))}</small>` : ''}</div>`; return d; };
  const adv = tuGrp(inputs, 'm_adv'), credits = tuGrp(inputs, 'g_credits'), figs = tuGrp(inputs, 'g_taxFig');
  const others = [...inputs.children].filter(c => c !== main && c !== adv && c !== credits && c !== figs);
  let n = 1;
  inputs.appendChild(step(n++, 'tu_s1')); inputs.appendChild(main);
  if (credits){ inputs.appendChild(step(n++, 'tu_s2', 'tu_s2h')); inputs.appendChild(credits); }
  if (adv){ inputs.appendChild(step(n++, 'tu_s3', 'tu_s3h')); inputs.appendChild(adv); }
  if (figs){ inputs.appendChild(step(n++, 'tu_s4')); inputs.appendChild(figs); }
  others.forEach(c => inputs.appendChild(c));
  if (adv){ const s = adv.querySelector(':scope > summary'); if (s && !s.querySelector('.su-badge')) s.insertAdjacentHTML('beforeend', '<span class="su-badge"></span>'); }
  try { if (typeof luSeg === 'function') luSeg('t_period', [['y', 'o_annualP'], ['m', 'o_monthlyP']]); } catch (e) {}
}
function tuBadge(){
  const p = document.getElementById('panel-tax'), adv = p && tuGrp(p.querySelector(':scope > .inputs'), 'm_adv'), bd = adv && adv.querySelector('.su-badge'); if (!bd) return;
  const def = typeof uxDefaults === 'function' ? uxDefaults('tax') : {};
  const n = [...adv.querySelectorAll('input:not([type=range]):not([type=hidden]),select')].filter(e => e.id && def[e.id] != null && String(e.value) !== String(def[e.id])).length;
  bd.textContent = n ? (n === 1 ? t('su_on1') : t('su_on', {n})) : '';
}
function tuSegSync(){
  document.querySelectorAll('#panel-tax [data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); const on = !!s && s.value === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#panel-tax [data-lus]')) setTimeout(tuSegSync, 0); });
function tuSummary(res){
  const hero = document.getElementById('hero-tax'); if (!hero) return;
  let s = document.getElementById('tu-sum');
  if (!s){ hero.insertAdjacentHTML('afterend', '<section id="tu-sum" aria-live="polite"></section>'); s = document.getElementById('tu-sum'); }
  if (!res || !res.rows || !res.rows.length){ s.hidden = true; return; }
  const row = k => { const r = res.rows.find(x => x[0] === t(k)); return r ? String(strip(r[1])).replace(/^[-−]\s*/, '') : ''; };
  const inc = row('r_incomeYear'), eff = row('r_effRate'), marg = row('r_margRate'), after = row('r_afterTax');
  const after0 = parseFloat(String(inc).replace(/[^\d.]/g, '')) - parseFloat(String(after).replace(/[^\d.]/g, ''));
  const taxY = isFinite(after0) ? MI(after0) : '';
  if (!inc){ s.hidden = true; return; }
  s.hidden = false;
  s.innerHTML = [['tu_tEff', tuP(eff)], ['tu_tMarg', tuP(marg)]].filter(x => x[1]).map(([k, val]) => `<div class="su-t"><span>${tuE(t(k))}</span><b class="num">${tuE(val)}</b></div>`).join('')
    + `<p>${tuB(t('tu_say', {i: inc, t: taxY, e: tuP(eff), a: after}))}<small>${tuB(t('tu_sayM', {m: tuP(marg)}))}</small></p>`;
}
function tuFold(){
  const p = document.getElementById('panel-tax'), led = document.getElementById('led-tax'); if (!p || !led) return;
  if (!p.querySelector('[data-tut]')) led.insertAdjacentHTML('beforebegin', `<button type="button" class="su-tog" data-tut="1" aria-expanded="false" aria-controls="led-tax"><span data-i="tu_hLed">${tuE(t('tu_hLed'))}</span></button>`);
  p.classList.toggle('tu-c-led', !TU_OPEN);
  const b = p.querySelector('[data-tut]'); if (b) b.setAttribute('aria-expanded', String(TU_OPEN));
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-tut]'); if (!b) return; TU_OPEN = !TU_OPEN; tuFold(); });
const showTU = show;
show = function(id, res){
  showTU.apply(this, arguments);
  if (id !== 'tax') return;
  try { tuSetup(); } catch (e) {}
  try { tuSummary(res); } catch (e) {}
  try { tuFold(); } catch (e) {}
  try { tuBadge(); } catch (e) {}
  try { tuSegSync(); } catch (e) {}
};
try { tuSetup(); } catch (e) {}
