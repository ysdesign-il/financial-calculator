/* ---------- 13.66: the salary calculator made clearer – four steps (the salary · personal details · pension and benefits ·
   more options), the result first (two numbers and one sentence) with the full breakdown folded, and a count of what is
   switched on in every folded group. Every field and every calculation stays as it was. ---------- */
Object.assign(T, {
  su_s1:['השכר','الراتب','The salary'],
  su_s2:['מצב אישי','الوضع الشخصي','Personal details'],
  su_s2h:['קובע את נקודות הזיכוי – כמה מס תחסכו','يحدد نقاط الاعتماد – كم ضريبة توفّرون','Sets your tax credit points – how much tax you save'],
  su_s3:['פנסיה והטבות','التقاعد والمزايا','Pension and benefits'],
  su_s4:['עוד אפשרויות (לא חובה)','خيارات أخرى (اختياري)','More options (optional)'],
  su_s4h:['שעות, רכב, יתרות, בדיקת תלוש ועוד','ساعات، سيارة، أرصدة، فحص قسيمة وغيرها','Hours, car, balances, payslip check and more'],
  su_on:['{n} פעילים','{n} مفعّلة','{n} on'],
  su_on1:['1 פעיל','1 مفعّل','1 on'],
  su_tDed:['סך הניכויים','إجمالي الاستقطاعات','Total deductions'],
  su_tEr:['עלות למעסיק','التكلفة على صاحب العمل','Cost to the employer'],
  su_tNet:['נטו בחודש','الصافي شهريًا','Net a month'],
  su_tGross:['ברוטו בחודש','الإجمالي شهريًا','Gross a month'],
  su_sayG2n:['מתוך {g} ברוטו בחודש נשארים לכם {n} נטו – {p} מהשכר.','من {g} إجمالي شهريًا يبقى لكم {n} صافيًا – {p} من الراتب.','Out of {g} gross a month you keep {n} net – {p} of the salary.'],
  su_sayParts:['הניכויים: מס הכנסה {t}, ביטוח לאומי ובריאות {h}{x}.','الاستقطاعات: ضريبة الدخل {t}، التأمين الوطني والصحة {h}{x}.','Deductions: income tax {t}, national insurance and health {h}{x}.'],
  su_sayPens:[', פנסיה {p}','، التقاعد {p}',', pension {p}'],
  su_sayN2g:['כדי לקבל {n} נטו בחודש צריך ברוטו של {g}. למעסיק זה עולה בערך {e}.','للحصول على {n} صافيًا شهريًا يلزم إجمالي {g}. التكلفة على صاحب العمل نحو {e}.','To take home {n} a month you need {g} gross. It costs the employer about {e}.'],
  su_hLed:['פירוט מלא','التفاصيل الكاملة','Full breakdown']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
#panel-salary .su-step{display:flex;align-items:center;gap:10px;margin:22px 0 6px;padding-top:16px;border-top:1px solid var(--line)}
#panel-salary .inputs > .su-step:first-child{border-top:0;padding-top:0;margin-top:0}
#panel-salary .su-step b{font-size:1.05rem;font-weight:700;color:var(--ink)}
#panel-salary .su-step small{display:block;font-size:.8rem;color:var(--ink-2);font-weight:400;margin-top:1px}
#panel-salary .su-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold-ui,#F2C45A);color:#1a1405;font-weight:700;font-size:.86rem;font-variant-numeric:tabular-nums}
#panel-salary .su-badge{margin-inline-start:8px;font-size:.74rem;padding:2px 8px;border-radius:999px;border:1px solid var(--gold-ui,#F2C45A);color:var(--gold-ui,#F2C45A);font-weight:600;vertical-align:middle}
#panel-salary .su-badge:empty{display:none}
#panel-salary .su-f3{margin-bottom:8px}
#su-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
#su-sum .su-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
#su-sum .su-t span{font-size:.82rem;color:var(--ink-2)}
#su-sum .su-t b{font-size:1.15rem;font-variant-numeric:tabular-nums;color:var(--ink)}
#su-sum p{grid-column:1/-1;margin:2px 0 0;line-height:1.65;color:var(--ink)}
#su-sum p small{display:block;color:var(--ink-2);margin-top:2px}
#panel-salary.su-g2n #hero-salary .hero-sub{display:none}
#panel-salary .su-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
#panel-salary .su-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
#panel-salary .su-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
#panel-salary.su-c-led #led-salary{display:none!important}
@media (min-width:1180px){#panel-salary.panel:not(.panel-flat){grid-template-areas:"svbar svbar" "inputs hero" "inputs sum" "inputs detail";grid-template-rows:auto auto auto 1fr}
  #panel-salary > .svbar{grid-area:svbar}#panel-salary > #su-sum{grid-area:sum;margin-top:14px}}
@media (max-width:380px){#su-sum{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
const suE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let SU_OPEN = false;
const suGrp = (inputs, k) => { const s = inputs.querySelector(`:scope > details > summary[data-i="${k}"]`); return s ? s.parentElement : null; };
function suSetup(){
  const p = document.getElementById('panel-salary'), inputs = p && p.querySelector(':scope > .inputs');
  if (!inputs || inputs.dataset.su) return;
  const main = inputs.querySelector(':scope > .fields'); if (!main) return;
  inputs.dataset.su = '1';
  const step = (n, k, h) => { const d = document.createElement('div'); d.className = 'su-step';
    d.innerHTML = `<span class="su-n" aria-hidden="true">${n}</span><div><b data-i="${k}" role="heading" aria-level="3">${suE(t(k))}</b>${h ? `<small data-i="${h}">${suE(t(h))}</small>` : ''}</div>`; return d; };
  const box = id => { const f = document.getElementById(id); return f && f.closest('.field'); };
  const G = k => suGrp(inputs, k);
  const credits = G('g_credits'), benefits = G('g_benefits');
  const rest = ['g_salTime', 'g_salCar', 'g_salMore', 'g_salBal', 'g_salExp', 'g_taxFig'].map(G).filter(Boolean);
  const slip = document.getElementById('sl_box');
  const others = [...inputs.children].filter(c => c !== main && c !== credits && c !== benefits && c !== slip && !rest.includes(c));
  /* step 3 gets its own little grid with the employee's pension and study fund */
  const f3 = document.createElement('div'); f3.className = 'fields su-f3';
  ['s_pension', 's_study'].map(box).filter(Boolean).forEach(b => f3.appendChild(b));
  inputs.appendChild(step(1, 'su_s1')); inputs.appendChild(main);
  if (credits){ inputs.appendChild(step(2, 'su_s2', 'su_s2h')); inputs.appendChild(credits); }
  inputs.appendChild(step(credits ? 3 : 2, 'su_s3')); inputs.appendChild(f3); if (benefits) inputs.appendChild(benefits);
  inputs.appendChild(step(credits ? 4 : 3, 'su_s4', 'su_s4h')); rest.forEach(d => inputs.appendChild(d)); if (slip) inputs.appendChild(slip);
  others.forEach(c => inputs.appendChild(c));
  /* the two short choices as buttons (the selects stay underneath, so saving and every listener work as before) */
  try { if (typeof luSeg === 'function'){ luSeg('s_per', [['m', 'o_perMonth'], ['y', 'o_perYear']]); luSeg('s_mode', [['g2n', 'o_g2n'], ['n2g', 'o_n2g']]); } } catch (e) {}
  /* a count of what is on, next to each folded group's title */
  [credits, benefits].concat(rest).filter(Boolean).forEach(d => { const s = d.querySelector(':scope > summary'); if (s && !s.querySelector('.su-badge')) s.insertAdjacentHTML('beforeend', '<span class="su-badge"></span>'); });
}
/* the payslip check is added later by its own code at the top; it belongs with the other options in step 4 */
function suSlip(){
  const p = document.getElementById('panel-salary'), inputs = p && p.querySelector(':scope > .inputs'), slip = document.getElementById('sl_box');
  if (!inputs || !slip || !inputs.dataset.su || slip.parentNode !== inputs) return;
  const last = suGrp(inputs, 'g_taxFig'); if (!last || last === slip || last.nextElementSibling === slip) return;
  last.after(slip);
}
/* whenever it is put back at the top (opening the salary screen, coming back from the payslip tab), it moves to step 4 again */
function suWatch(){
  const inputs = document.querySelector('#panel-salary > .inputs'); if (!inputs || inputs.dataset.suw) return;
  inputs.dataset.suw = '1';
  new MutationObserver(() => { try { suSlip(); } catch (e) {} }).observe(inputs, {childList: true});
}
function suBadges(){
  const p = document.getElementById('panel-salary'); if (!p) return;
  const def = typeof uxDefaults === 'function' ? uxDefaults('salary') : {};
  p.querySelectorAll('.inputs > details').forEach(d => {
    const bd = d.querySelector(':scope > summary .su-badge'); if (!bd) return;
    if (d.querySelector('summary[data-i="g_credits"]') || d.querySelector('summary[data-i="g_taxFig"]')){ bd.textContent = ''; return; }   // these always hold values; a count would mislead
    const n = [...d.querySelectorAll('input:not([type=range]):not([type=hidden]),select')].filter(e => {
      if (!e.id || def[e.id] == null || e.closest('[hidden]')) return false;
      return String(e.value) !== String(def[e.id]);
    }).length;
    bd.textContent = n ? (n === 1 ? t('su_on1') : t('su_on', {n})) : '';
  });
}
function suSummary(res){
  const p = document.getElementById('panel-salary'), hero = document.getElementById('hero-salary'); if (!p || !hero) return;
  let s = document.getElementById('su-sum');
  if (!s){ hero.insertAdjacentHTML('afterend', '<section id="su-sum" aria-live="polite"></section>'); s = document.getElementById('su-sum'); }
  const mode = ($('#s_mode') || {}).value || 'g2n';
  p.classList.toggle('su-g2n', mode === 'g2n');
  if (!res || !res.rows || !res.rows.length){ s.hidden = true; return; }
  const row = k => { const r = res.rows.find(x => x[0] === t(k)); return r ? String(strip(r[1])).replace(/^[-−]\s*/, '') : ''; };
  const num = x => parseFloat(String(x).replace(/[^\d.]/g, '')) || 0;
  const g = row('r_grossMonthly'), n = row('r_netMonthly'), ded = row('r_totalDed'), er = row('r_employerCost');
  const tax = row('r_incomeTax'), ni = num(row('r_ni')), he = num(row('r_health')), pens = row('r_pensionRow');
  if (!g || !n){ s.hidden = true; return; }
  const pct = num(g) > 0 ? N(num(n) / num(g) * 100, 0) + '%' : '';
  let say;
  if (mode === 'g2n') say = t('su_sayG2n', {g, n, p: pct}) + `<small>${suE(t('su_sayParts', {t: tax, h: MI(ni + he), x: pens ? t('su_sayPens', {p: pens}) : ''}))}</small>`;
  else say = suE(t('su_sayN2g', {n, g, e: er}));
  const tiles = mode === 'g2n' ? [['su_tDed', ded], ['su_tEr', er]] : [['su_tNet', n], ['su_tEr', er]];
  s.hidden = false;
  s.innerHTML = tiles.filter(x => x[1]).map(([k, v]) => `<div class="su-t"><span>${suE(t(k))}</span><b class="num">${suE(v)}</b></div>`).join('')
    + `<p>${mode === 'g2n' ? suE(t('su_sayG2n', {g, n, p: pct})) + `<small>${suE(t('su_sayParts', {t: tax, h: MI(ni + he), x: pens ? t('su_sayPens', {p: pens}) : ''}))}</small>` : say}</p>`;
}
function suSegSync(){
  document.querySelectorAll('#panel-salary [data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); const on = !!s && s.value === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#panel-salary [data-lus]'); if (b) setTimeout(suSegSync, 0); });
function suFold(){
  const p = document.getElementById('panel-salary'), led = document.getElementById('led-salary'); if (!p || !led) return;
  if (!p.querySelector('[data-sut]')) led.insertAdjacentHTML('beforebegin', `<button type="button" class="su-tog" data-sut="1" aria-expanded="false" aria-controls="led-salary"><span data-i="su_hLed">${suE(t('su_hLed'))}</span></button>`);
  p.classList.toggle('su-c-led', !SU_OPEN);
  const b = p.querySelector('[data-sut]'); if (b) b.setAttribute('aria-expanded', String(SU_OPEN));
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sut]'); if (!b) return; SU_OPEN = !SU_OPEN; suFold(); });
const showSU = show;
show = function(id, res){
  showSU.apply(this, arguments);
  if (id !== 'salary') return;
  try { suSetup(); suWatch(); suSlip(); } catch (e) {}
  try { suSummary(res); } catch (e) {}
  try { suFold(); } catch (e) {}
  try { suBadges(); } catch (e) {}
  try { suSegSync(); } catch (e) {}
};
try { suSetup(); suWatch(); suSlip(); } catch (e) {}
