/* ---------- 13.69: the self-employed calculator made clearer – three steps (income and expenses · business type and pension ·
   personal details), a live profit line, the business type as buttons, the result first (two numbers and one sentence)
   with the full breakdown folded. And, in income tax and salary, switching between a year and a month converts the
   amount (÷12 or ×12) instead of reading the same number the other way. ---------- */
Object.assign(T, {
  eu_s1:['הכנסות והוצאות','الإيرادات والمصاريف','Income and expenses'],
  eu_s2:['סוג העוסק ופנסיה','نوع المشتغل والتقاعد','Business type and pension'],
  eu_s3:['מצב אישי','الوضع الشخصي','Personal details'],
  eu_s3h:['קובע את נקודות הזיכוי – כמה מס תחסכו','يحدد نقاط الاعتماد – كم ضريبة توفّرون','Sets your tax credit points – how much tax you save'],
  eu_murshe:['עוסק מורשה','مشتغل مرخّص','Licensed dealer'],
  eu_patur:['עוסק פטור','مشتغل معفى','Exempt dealer'],
  eu_profit:['רווח: {p} בשנה ({m} בחודש)','الربح: {p} سنويًا ({m} شهريًا)','Profit: {p} a year ({m} a month)'],
  eu_tY:['נטו בשנה','الصافي سنويًا','Net a year'],
  eu_tB:['מס וביטוח לאומי מהרווח','الضريبة والتأمين من الربح','Tax and national insurance of profit'],
  eu_say:['מתוך רווח של {p} בשנה נשארים לכם {y} – {m} בחודש.','من ربح {p} سنويًا يبقى لكم {y} – {m} شهريًا.','Out of a {p} profit a year you keep {y} – {m} a month.'],
  eu_sayParts:['משלמים {t} מס הכנסה ו-{n} ביטוח לאומי ובריאות{x}.','تدفعون {t} ضريبة دخل و{n} تأمينًا وطنيًا وصحة{x}.','You pay {t} income tax and {n} national insurance and health{x}.'],
  eu_sayPens:[', ומפקידים {p} לפנסיה','، وتودعون {p} للتقاعد',', and put {p} into a pension'],
  eu_hLed:['פירוט מלא','التفاصيل الكاملة','Full breakdown']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
#panel-selfemp .su-step{display:flex;align-items:center;gap:10px;margin:22px 0 6px;padding-top:16px;border-top:1px solid var(--line)}
#panel-selfemp .inputs > .su-step:first-child{border-top:0;padding-top:0;margin-top:0}
#panel-selfemp .su-step b{font-size:1.05rem;font-weight:700;color:var(--ink)}
#panel-selfemp .su-step small{display:block;font-size:.8rem;color:var(--ink-2);margin-top:1px}
#panel-selfemp .su-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold-ui,#F2C45A);color:#1a1405;font-weight:700;font-size:.86rem}
#panel-selfemp .eu-line{grid-column:1/-1;padding:12px 14px;border-radius:14px;border:1px solid color-mix(in srgb,var(--gold-ui) 55%,var(--line));font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
#panel-selfemp .eu-line:empty{display:none}
#eu-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
#eu-sum .su-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
#eu-sum .su-t span{font-size:.82rem;color:var(--ink-2)}
#eu-sum .su-t b{font-size:1.15rem;font-variant-numeric:tabular-nums;color:var(--ink)}
#eu-sum p{grid-column:1/-1;margin:2px 0 0;line-height:1.65;color:var(--ink)}
#eu-sum p small{display:block;color:var(--ink-2);margin-top:2px}
#panel-selfemp #hero-selfemp .hero-sub{display:none}
#panel-selfemp .su-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
#panel-selfemp .su-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
#panel-selfemp .su-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
#panel-selfemp.eu-c-led #led-selfemp{display:none!important}
@media (min-width:1180px){#panel-selfemp.panel:not(.panel-flat){grid-template-areas:"svbar svbar" "inputs hero" "inputs sum" "inputs detail";grid-template-rows:auto auto auto 1fr}
  #panel-selfemp > .svbar{grid-area:svbar}#panel-selfemp > #eu-sum{grid-area:sum;margin-top:14px}}
@media (max-width:380px){#eu-sum{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
const euE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const euB = x => euE(x).replace(/-?[\d.,]+%/g, m => '<bdi>' + m + '</bdi>');
let EU_OPEN = false;
function euSetup(){
  const p = document.getElementById('panel-selfemp'), inputs = p && p.querySelector(':scope > .inputs');
  if (!inputs || inputs.dataset.eu) return;
  const main = inputs.querySelector(':scope > .fields'); if (!main || !document.getElementById('e_rev')) return;
  inputs.dataset.eu = '1';
  const step = (n, k, h) => { const d = document.createElement('div'); d.className = 'su-step';
    d.innerHTML = `<span class="su-n" aria-hidden="true">${n}</span><div><b data-i="${k}" role="heading" aria-level="3">${euE(t(k))}</b>${h ? `<small data-i="${h}">${euE(t(h))}</small>` : ''}</div>`; return d; };
  const fb = id => { const f = document.getElementById(id); return f && f.closest('.field'); };
  const s = inputs.querySelector(':scope > details > summary[data-i="g_credits"]'), credits = s ? s.parentElement : null;
  const others = [...inputs.children].filter(c => c !== main && c !== credits);
  const f2 = document.createElement('div'); f2.className = 'fields';
  ['e_dealer', 'e_pens'].map(fb).filter(Boolean).forEach(b => f2.appendChild(b));
  const line = document.createElement('div'); line.className = 'eu-line'; line.id = 'eu-profit'; line.setAttribute('aria-live', 'polite');
  main.appendChild(line);
  inputs.appendChild(step(1, 'eu_s1')); inputs.appendChild(main);
  inputs.appendChild(step(2, 'eu_s2')); inputs.appendChild(f2);
  if (credits){ inputs.appendChild(step(3, 'eu_s3', 'eu_s3h')); inputs.appendChild(credits); }
  others.forEach(c => inputs.appendChild(c));
  try { if (typeof luSeg === 'function') luSeg('e_dealer', [['murshe', 'eu_murshe'], ['patur', 'eu_patur']]); } catch (e) {}
}
function euSegSync(){
  document.querySelectorAll('#panel-selfemp [data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); const on = !!s && s.value === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#panel-selfemp [data-lus]')) setTimeout(euSegSync, 0); });
function euSummary(res){
  const L = document.getElementById('eu-profit'), profit = Math.max(0, v('e_rev') - v('e_exp'));
  if (L) L.textContent = t('eu_profit', {p: MI(profit), m: MI(profit / 12)});
  const hero = document.getElementById('hero-selfemp'); if (!hero) return;
  let s = document.getElementById('eu-sum');
  if (!s){ hero.insertAdjacentHTML('afterend', '<section id="eu-sum" aria-live="polite"></section>'); s = document.getElementById('eu-sum'); }
  if (!res || !res.rows || !res.rows.length){ s.hidden = true; return; }
  const row = k => { const r = res.rows.find(x => x[0] === t(k)); return r ? String(strip(r[1])).replace(/^[-−]\s*/, '') : ''; };
  const pr = row('r_profit'), y = row('r_netSelfY'), m = row('r_netSelfM'), bur = row('r_burden'), tax = row('r_taxSelf'), ni = row('r_niSelf'), pens = row('r_sPensRow');
  if (!pr || !y){ s.hidden = true; return; }
  const bp = (() => { const x = parseFloat(String(bur).replace(/[^\d.]/g, '')); if (!isFinite(x)) return bur; const r = Math.round(x * 10) / 10; return N(r, r % 1 ? 1 : 0) + '%'; })();
  s.hidden = false;
  s.innerHTML = [['eu_tY', y], ['eu_tB', bp]].filter(x => x[1]).map(([k, val]) => `<div class="su-t"><span>${euE(t(k))}</span><b class="num">${euE(val)}</b></div>`).join('')
    + `<p>${euB(t('eu_say', {p: pr, y, m}))}<small>${euB(t('eu_sayParts', {t: tax, n: ni, x: pens ? t('eu_sayPens', {p: pens}) : ''}))}</small></p>`;
}
function euFold(){
  const p = document.getElementById('panel-selfemp'), led = document.getElementById('led-selfemp'); if (!p || !led) return;
  if (!p.querySelector('[data-eut]')) led.insertAdjacentHTML('beforebegin', `<button type="button" class="su-tog" data-eut="1" aria-expanded="false" aria-controls="led-selfemp"><span data-i="eu_hLed">${euE(t('eu_hLed'))}</span></button>`);
  p.classList.toggle('eu-c-led', !EU_OPEN);
  const b = p.querySelector('[data-eut]'); if (b) b.setAttribute('aria-expanded', String(EU_OPEN));
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-eut]'); if (!b) return; EU_OPEN = !EU_OPEN; euFold(); });
const showEU = show;
show = function(id, res){
  showEU.apply(this, arguments);
  if (id !== 'selfemp') return;
  try { euSetup(); } catch (e) {}
  try { euSummary(res); } catch (e) {}
  try { euFold(); } catch (e) {}
  try { euSegSync(); } catch (e) {}
};
try { euSetup(); } catch (e) {}

/* ---- a year or a month: the amount is converted when the period changes (income tax and salary) ---- */
const EU_PER = {t_period: {amt: 't_income', y: 'y', m: 'm'}, s_per: {amt: 's_amount', y: 'y', m: 'm'}};
function euPerInit(){
  Object.keys(EU_PER).forEach(id => { const s = document.getElementById(id); if (s && !s.dataset.prevPer) s.dataset.prevPer = s.value; });
}
/* runs before the calculation reads the fields (capture), so the result already uses the converted amount */
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const s = e.target, c = s && EU_PER[s.id]; if (!c) return;
  const prev = s.dataset.prevPer || c.y, now = s.value;
  if (prev === now) return;
  s.dataset.prevPer = now;
  const a = document.getElementById(c.amt); if (!a) return;
  const x = parseFloat(String(a.value).replace(/[^\d.\-]/g, '')); if (!isFinite(x)) return;
  const nv = prev === c.y && now === c.m ? x / 12 : prev === c.m && now === c.y ? x * 12 : x;
  a.value = String(Math.round(nv * 100) / 100);
  try { syncRanges(); } catch (er) {}
}, true));
/* values put back from storage or a saved scenario set the select without a change event: keep the "previous" in step */
{ const showPer = show; show = function(id){ try { euPerInit(); Object.keys(EU_PER).forEach(k => { const s = document.getElementById(k); if (s) s.dataset.prevPer = s.value; }); } catch (e) {} return showPer.apply(this, arguments); }; }
try { euPerInit(); } catch (e) {}
