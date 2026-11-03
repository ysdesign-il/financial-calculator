/* ---------- 13.70: the same clarity for every other calculator, automatically –
   • steps: "the details" first, then personal details (credit points) if there are any, then the optional extras;
   • short choices (2–3 options) as buttons – the select stays underneath, so saving and every listener work as before;
   • a count of what is switched on next to every folded group;
   • the result first: the two key numbers under the big result, and a long breakdown folded under "full breakdown";
   • on wide screens the summary sits under the result.
   Calculators with their own design (loan, salary, mortgage, income tax, self-employed) and tool screens are left alone. ---------- */
Object.assign(T, {
  ax_s1:['הנתונים','البيانات','The details'],
  ax_sP:['מצב אישי','الوضع الشخصي','Personal details'],
  ax_sPh:['קובע את נקודות הזיכוי','يحدد نقاط الاعتماد','Sets your tax credit points'],
  ax_sMore:['אפשרויות נוספות (לא חובה)','خيارات إضافية (اختياري)','More options (optional)'],
  ax_sFig:['ערכי המס (לא חובה)','قيم الضريبة (اختياري)','Tax values (optional)'],
  ax_hLed:['פירוט מלא','التفاصيل الكاملة','Full breakdown']
});
const CU_DONE = ['loan', 'salary', 'mortgage', 'tax', 'selfemp'];
const CU_LISTS = ['debtplan', 'convert', 'networth', 'smartsplit', 'mortcmp', 'loancmp'];   // their fields are one list – no steps, only the result part
const CU_OPEN = {};
(function(){
  const st = document.createElement('style');
  st.textContent = `
.cu-step{display:flex;align-items:center;gap:10px;margin:22px 0 6px;padding-top:16px;border-top:1px solid var(--line)}
.inputs > .cu-step:first-child{border-top:0;padding-top:0;margin-top:0}
.cu-step b{font-size:1.05rem;font-weight:700;color:var(--ink)}
.cu-step small{display:block;font-size:.8rem;color:var(--ink-2);margin-top:1px}
.cu-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold-ui,#F2C45A);color:#1a1405;font-weight:700;font-size:.86rem}
.cu-badge{margin-inline-start:8px;font-size:.74rem;padding:2px 8px;border-radius:999px;border:1px solid var(--gold-ui,#F2C45A);color:var(--gold-ui,#F2C45A);font-weight:600}
.cu-badge:empty{display:none}
.cu-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
.cu-sum .cu-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
.cu-sum .cu-t span{font-size:.82rem;color:var(--ink-2);line-height:1.35}
.cu-sum .cu-t b{font-size:1.12rem;font-variant-numeric:tabular-nums;color:var(--ink);overflow-wrap:anywhere}
.cu-sum.one{grid-template-columns:1fr}
.cu-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
.cu-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
.cu-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
.cu-c-led > .detail > .ledger{display:none!important}
@media (min-width:1180px){.panel.cu-has-sum:not(.panel-flat){grid-template-areas:"svbar svbar" "inputs hero" "inputs sum" "inputs detail";grid-template-rows:auto auto auto 1fr}
  .panel.cu-has-sum > .svbar{grid-area:svbar}.panel.cu-has-sum > .cu-sum{grid-area:sum;margin-top:14px}}
@media (max-width:380px){.cu-sum{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
const cuE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function cuFit(id){
  if (!id || CU_DONE.includes(id)) return null;
  const p = document.getElementById('panel-' + id);
  if (!p || p.classList.contains('panel-flat') || !p.querySelector(':scope > .inputs') || !p.querySelector(':scope > .hero')) return null;
  return p;
}
/* short choices as buttons: only selects defined with fixed options, 2–3 of them, each short */
function cuSegs(id, p){
  if (typeof luSeg !== 'function' || !Array.isArray(DEFS[id])) return;
  DEFS[id].forEach(f => {
    if (!f || f.type !== 'select' || !Array.isArray(f.opts) || f.opts.length < 2 || f.opts.length > 3) return;
    if (f.opts.some(o => !o || typeof o[1] !== 'string' || o[1].charAt(0) === '=' || String(t(o[1])).length > 18)) return;
    const s = document.getElementById(f.id); if (!s || !p.contains(s) || s.options.length !== f.opts.length) return;
    try { luSeg(f.id, f.opts.map(o => [o[0], o[1]])); } catch (e) {}
  });
}
function cuSetup(id){
  const p = cuFit(id); if (!p) return;
  const inputs = p.querySelector(':scope > .inputs');
  if (inputs.dataset.cu) return;
  inputs.dataset.cu = '1';
  cuSegs(id, p);
  if (CU_LISTS.includes(id)) return;
  const main = inputs.querySelector(':scope > .fields');
  const groups = [...inputs.querySelectorAll(':scope > details')].filter(d => d.querySelector(':scope > summary'));
  if (!main || !groups.length) return;            // one block only: numbering a single step would add nothing
  const step = (n, k, h) => { const d = document.createElement('div'); d.className = 'cu-step';
    d.innerHTML = `<span class="cu-n" aria-hidden="true">${n}</span><div><b data-i="${k}" role="heading" aria-level="3">${cuE(t(k))}</b>${h ? `<small data-i="${h}">${cuE(t(h))}</small>` : ''}</div>`; return d; };
  const key = d => (d.querySelector(':scope > summary').dataset.i || '');
  const credits = groups.filter(d => key(d) === 'g_credits'), figs = groups.filter(d => key(d) === 'g_taxFig');
  const more = groups.filter(d => !credits.includes(d) && !figs.includes(d));
  const others = [...inputs.children].filter(c => c !== main && !groups.includes(c));
  let n = 1;
  inputs.appendChild(step(n++, 'ax_s1')); inputs.appendChild(main);
  others.filter(c => c.classList && c.classList.contains('ux-more-btn')).forEach(c => inputs.appendChild(c));
  if (credits.length){ inputs.appendChild(step(n++, 'ax_sP', 'ax_sPh')); credits.forEach(d => inputs.appendChild(d)); }
  if (more.length){ inputs.appendChild(step(n++, 'ax_sMore')); more.forEach(d => inputs.appendChild(d)); }
  if (figs.length){ inputs.appendChild(step(n++, 'ax_sFig')); figs.forEach(d => inputs.appendChild(d)); }
  others.filter(c => !(c.classList && c.classList.contains('ux-more-btn'))).forEach(c => inputs.appendChild(c));
  more.forEach(d => { const s = d.querySelector(':scope > summary'); if (s && !s.querySelector('.cu-badge')) s.insertAdjacentHTML('beforeend', '<span class="cu-badge"></span>'); });
}
function cuBadges(id){
  const p = cuFit(id); if (!p) return;
  const def = typeof uxDefaults === 'function' ? uxDefaults(id) : {};
  p.querySelectorAll(':scope > .inputs > details').forEach(d => {
    const bd = d.querySelector(':scope > summary .cu-badge'); if (!bd) return;
    const n = [...d.querySelectorAll('input:not([type=range]):not([type=hidden]),select')].filter(e => e.id && def[e.id] != null && !e.closest('[hidden]') && String(e.value) !== String(def[e.id])).length;
    bd.textContent = n ? (n === 1 ? t('su_on1') : t('su_on', {n})) : '';
  });
}
/* the result first: the two key numbers that are not already the big result */
function cuSummary(id, res){
  const p = cuFit(id); if (!p) return;
  const hero = p.querySelector(':scope > .hero'); if (!hero) return;
  let s = p.querySelector(':scope > .cu-sum');
  if (!res || !res.rows || res.rows.length < 3){ if (s) s.hidden = true; p.classList.remove('cu-has-sum'); return; }
  const hv = String(strip(res.hero && res.hero.value || '')).trim(), hl = String(strip(res.hero && res.hero.label || '')).trim();
  const usable = res.rows.filter(r => Array.isArray(r) && r.length >= 2 && String(strip(r[1])).trim() && String(strip(r[1])).trim() !== hv && String(strip(r[0])).trim() !== hl && String(strip(r[1])).length <= 28);
  let pick = usable.filter(r => r[2] === 'key').slice(0, 2);
  if (pick.length < 2) pick = pick.concat(usable.filter(r => !pick.includes(r)).slice(0, 2 - pick.length));
  if (!pick.length){ if (s) s.hidden = true; p.classList.remove('cu-has-sum'); return; }
  if (!s){ hero.insertAdjacentHTML('afterend', '<section class="cu-sum" aria-live="polite"></section>'); s = p.querySelector(':scope > .cu-sum'); }
  s.hidden = false; s.classList.toggle('one', pick.length === 1); p.classList.add('cu-has-sum');
  s.innerHTML = pick.map(r => `<div class="cu-t"><span>${cuE(strip(r[0]))}</span><b class="num">${cuE(strip(r[1]))}</b></div>`).join('');
}
/* a long breakdown folds; a short one stays open */
function cuFold(id, res){
  const p = cuFit(id); if (!p) return;
  const led = p.querySelector(':scope > .detail > .ledger'); if (!led) return;
  const long = res && res.rows && res.rows.length > 5;
  let b = p.querySelector(':scope > .detail > [data-cut]');
  if (!long){ if (b) b.hidden = true; p.classList.remove('cu-c-led'); return; }
  if (!b){ led.insertAdjacentHTML('beforebegin', `<button type="button" class="cu-tog" data-cut="${cuE(id)}" aria-expanded="false"><span data-i="ax_hLed">${cuE(t('ax_hLed'))}</span></button>`); b = p.querySelector(':scope > .detail > [data-cut]'); }
  if (led.id) b.setAttribute('aria-controls', led.id);
  b.hidden = false;
  p.classList.toggle('cu-c-led', !CU_OPEN[id]);
  b.setAttribute('aria-expanded', String(!!CU_OPEN[id]));
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cut]'); if (!b) return; const id = b.dataset.cut; CU_OPEN[id] = !CU_OPEN[id]; cuFold(id, {rows: [1, 2, 3, 4, 5, 6]}); });
/* every button group shows the current choice, wherever it is */
function cuSegSync(p){
  (p || document).querySelectorAll('[data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); const on = !!s && s.value === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-lus]')) setTimeout(() => cuSegSync(), 0); });
const showCU = show;
show = function(id, res){
  showCU.apply(this, arguments);
  if (!cuFit(id)) return;
  try { cuSetup(id); } catch (e) {}
  try { cuSummary(id, res); } catch (e) {}
  try { cuFold(id, res); } catch (e) {}
  try { cuBadges(id); } catch (e) {}
  try { cuSegSync(document.getElementById('panel-' + id)); } catch (e) {}
};
