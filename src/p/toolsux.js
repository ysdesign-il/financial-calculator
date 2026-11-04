/* ---------- 13.71: tools and calculators – a calmer top of every screen.
   The saving bar (automatic / manual / none, clear all, copy, share, print, PDF) opened on every screen and pushed the content
   down. With automatic saving (the usual) it now shows one quiet line – "✓ every change is saved" – and a "Saving and sharing"
   button that opens the same controls. With manual saving or no saving it stays open, so the Save button and the warning are
   always in view. Plus: the percent tool's answers use the app's number font. ---------- */
Object.assign(T, {
  tu2_more:['שמירה ושיתוף','الحفظ والمشاركة','Saving and sharing']
});
let TU2_OPEN = false;
(function(){
  const st = document.createElement('style');
  st.textContent = `
:root[data-svm="auto"] .svbar:not(.tu2-open) > .sv-row,
:root[data-svm="auto"] .svbar:not(.tu2-open) > .sv-share{display:none!important}
:root[data-svm="auto"] .svbar:not(.tu2-open){display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px!important;min-height:0;box-shadow:none!important;background:transparent!important;border-style:dashed!important}
:root[data-svm="auto"] .svbar:not(.tu2-open) > .sv-st{flex:1;min-width:0;margin:0}
.tu2-tog{display:none}
:root[data-svm="auto"] .tu2-tog{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink-2);font:inherit;font-size:.82rem;font-weight:600;cursor:pointer}
:root[data-svm="auto"] .tu2-tog::after{content:"▾";transition:transform .2s}
:root[data-svm="auto"] .svbar.tu2-open .tu2-tog{margin-top:8px}
:root[data-svm="auto"] .svbar.tu2-open .tu2-tog::after{transform:rotate(180deg)}
:is(:root:not([data-design]),:root[data-design="default"]) #panel-percent .s-result .num{font-family:Heebo,'IBM Plex Sans Hebrew',system-ui,sans-serif;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.01em}`;
  document.head.appendChild(st);
})();
function tu2Bars(){
  document.documentElement.dataset.svm = (typeof SV === 'object' && SV.mode) || 'auto';
  [...document.getElementsByClassName('svbar')].forEach(b => {
    b.classList.toggle('tu2-open', TU2_OPEN);
    if (!b.querySelector(':scope > .tu2-tog')) b.insertAdjacentHTML('beforeend', `<button type="button" class="tu2-tog" aria-expanded="${TU2_OPEN}"><span>${asEsc(t('tu2_more'))}</span></button>`);
    else b.querySelector(':scope > .tu2-tog').setAttribute('aria-expanded', String(TU2_OPEN));
  });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.tu2-tog'); if (!b) return; TU2_OPEN = !TU2_OPEN; tu2Bars(); });
{ const svUiT = svUi; svUi = function(){ const r = svUiT.apply(this, arguments); try { tu2Bars(); } catch (e) {} return r; }; }
{ const actT = activate; activate = function(){ const r = actT.apply(this, arguments); try { tu2Bars(); } catch (e) {} return r; }; }
try { tu2Bars(); } catch (e) {}
