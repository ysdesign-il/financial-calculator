/* ---------- 13.66: a calmer top bar on phones – the brand and search stay; language, currency, sound, design and the
   update line move behind one "display" button. Every control is the same element as before, so nothing else changes. ---------- */
Object.assign(T, {
  hd_btn:['תצוגה, שפה ומטבע','العرض واللغة والعملة','Display, language and currency'],
  hd_close:['סגירה','إغلاق','Close']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
.pm-hdr-btn{display:none}
@media (max-width:959px){
  .rail .brand{display:flex;align-items:center;gap:8px}
  .rail .brand .beta-pill{margin-inline-start:4px!important;margin-inline-end:0!important}
  .rail .brand .pm-hdr-btn{order:10}
  .pm-hdr-btn{display:inline-flex;align-items:center;gap:6px;margin-inline-start:auto;min-height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--nav-line,var(--line));background:transparent;color:var(--on-navy,var(--ink));font:inherit;font-size:.86rem;font-weight:600;cursor:pointer}
  .pm-hdr-btn svg{width:18px;height:18px;flex:0 0 auto}
  .pm-hdr-btn .pm-hd-now{font-variant-numeric:tabular-nums;opacity:.9}
  .pm-hdr-btn[aria-expanded="true"]{border-color:var(--gold-ui,#F2C45A);color:var(--gold-ui,#F2C45A)}
  .rail:not(.pm-open) .rail-ctrls{display:none!important}
  .rail.pm-open .rail-ctrls{animation:pmHd .25s cubic-bezier(.22,.61,.36,1) both}
}
@keyframes pmHd{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.rail.pm-open .rail-ctrls{animation:none}}`;
  document.head.appendChild(st);
})();
function hdNow(){
  const b = document.getElementById('pmHdrBtn'); if (!b) return;
  const lb = (document.querySelector('#seg button.on, #seg button[aria-pressed="true"], #seg button[aria-checked="true"]') || {}).textContent || '';
  const cs = document.getElementById('cur'), cur = cs && cs.options[cs.selectedIndex] ? (cs.value || '') : '';
  const now = b.querySelector('.pm-hd-now'); if (now) now.textContent = [lb.trim(), cur].filter(Boolean).join(' · ');
  b.setAttribute('aria-label', t('hd_btn'));
}
function hdSetup(){
  const rail = document.querySelector('aside.rail'), brand = rail && rail.querySelector('.rail-top .brand'), ctrls = rail && rail.querySelector('.rail-ctrls');
  if (!brand || !ctrls || document.getElementById('pmHdrBtn')) return;
  if (!ctrls.id) ctrls.id = 'pmRailCtrls';
  brand.insertAdjacentHTML('beforeend', `<button type="button" class="pm-hdr-btn" id="pmHdrBtn" aria-expanded="false" aria-controls="${ctrls.id}" title="${t('hd_btn')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg><span class="pm-hd-now"></span></button>`);
  hdNow();
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#pmHdrBtn');
  const rail = document.querySelector('aside.rail'); if (!rail) return;
  if (b){ const o = rail.classList.toggle('pm-open'); b.setAttribute('aria-expanded', String(o)); return; }
  /* tapping anywhere outside the open controls closes them */
  if (rail.classList.contains('pm-open') && !e.target.closest('.rail-ctrls') && !e.target.closest('.cur-pop, .coin-pop, .dz-sheet, [role="dialog"]')){
    rail.classList.remove('pm-open'); const bb = document.getElementById('pmHdrBtn'); if (bb) bb.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ const rail = document.querySelector('aside.rail.pm-open'); if (rail){ rail.classList.remove('pm-open'); const b = document.getElementById('pmHdrBtn'); if (b){ b.setAttribute('aria-expanded', 'false'); b.focus(); } } } });
document.addEventListener('change', e => { if (e.target && (e.target.id === 'cur')) setTimeout(hdNow, 0); });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#seg button')) setTimeout(hdNow, 50); });
{ const hdAL = applyLang; applyLang = function(){ const r = hdAL.apply(this, arguments); try { hdSetup(); hdNow(); } catch (e) {} return r; }; }
try { hdSetup(); } catch (e) {}
