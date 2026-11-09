/* ---------- 13.90: consent (Israel's privacy law, amendment 13) ----------
   1. A first visit shows a window that holds the app until the person ticks "I have read and agree to the privacy policy and the
      terms of use" and presses Continue. The tick box starts empty, and the button does nothing until it is ticked.
   2. Every form that sends personal details (signing up, a message to the developer) has its own empty tick box; the form will not
      send until it is ticked. The tick is asked again on each visit to the form.
   The answer is kept on this device with its date and the version of the wording; a new version of the wording asks again. */
const CG_VER = 1, CG_KEY = 'fin-consent';
function cgGet(){ try { const v = JSON.parse(RAWLS.getItem(CG_KEY) || 'null'); return v && v.v >= CG_VER ? v : null; } catch (e) { return null; } }
function cgSave(){ try { RAWLS.setItem(CG_KEY, JSON.stringify({v: CG_VER, at: new Date().toISOString(), l: lang})); } catch (e) {} }
const cgE = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
/* "I have read and agree to the privacy policy and the terms of use" – the two names open the documents */
function cgLabel(){
  const lk = k => `<button type="button" class="cg-lk" data-lgo="${k}">${cgE(t(k === 'priv' ? 'cg_priv' : 'cg_terms'))}</button>`;
  return cgE(t('cg_agree')).replace('{p}', lk('priv')).replace('{t}', lk('terms'));
}
function cgGate(){
  if (cgGet() || document.getElementById('cgx')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov cg-ov" id="cgx"><div class="cp-box cg-box" role="dialog" aria-modal="true" aria-labelledby="cgx_t" aria-describedby="cgx_d">
    <h2 id="cgx_t" class="cg-h"></h2><div id="cgx_d" class="cg-d"></div>
    <label class="cg-chk"><input type="checkbox" id="cgx_c"><span id="cgx_l"></span></label>
    <p class="cg-err" id="cgx_e" role="alert" hidden></p>
    <button type="button" class="btn cg-go" id="cgx_go" aria-disabled="true"></button></div></div>`);
  cgPaint(); document.body.classList.add('cp-lock');
  setTimeout(() => { try { document.getElementById('cgx_c').focus(); } catch (e) {} }, 60);
}
function cgPaint(){
  const o = document.getElementById('cgx'); if (!o) return;
  o.querySelector('#cgx_t').textContent = t('cg_title');
  o.querySelector('#cgx_d').innerHTML = ['cg_p1', 'cg_p2', 'cg_p3'].map(k => `<p>${cgE(t(k))}</p>`).join('');
  o.querySelector('#cgx_l').innerHTML = cgLabel();
  o.querySelector('#cgx_go').textContent = t('cg_go');
  o.querySelector('#cgx_e').textContent = t('cg_need');
}
function cgDone(){
  const c = document.getElementById('cgx_c'), e = document.getElementById('cgx_e');
  if (!c || !c.checked){ if (e) e.hidden = false; if (c) c.focus(); return; }
  cgSave(); const o = document.getElementById('cgx'); if (o) o.remove();
  if (!document.querySelector('.cp-ov:not([hidden]):not(#cgx)')) document.body.classList.remove('cp-lock');
}
/* the tick box inside a form: put right before the form's send button */
const CG_FORMS = [['acc_up', 'acc_cs'], ['fb_send', 'fb_cs']];
function cgForms(){
  for (const [btn, id] of CG_FORMS){
    const b = document.getElementById(btn); if (!b || document.getElementById(id)) continue;
    const row = b.closest('.btnrow, .bk-acts') || b;
    row.insertAdjacentHTML('beforebegin', `<label class="cg-chk cg-form"><input type="checkbox" id="${id}"><span>${cgLabel()}</span></label><p class="cg-err" id="${id}_e" role="alert" hidden>${cgE(t('cg_need'))}</p>`);
    b.setAttribute('aria-disabled', 'true'); b.classList.add('cg-off');
  }
}
function cgFormOk(btn){
  const f = CG_FORMS.find(x => x[0] === btn); if (!f) return true;
  const c = document.getElementById(f[1]); if (!c) { cgForms(); return false; }
  if (c.checked) return true;
  const e = document.getElementById(f[1] + '_e'); if (e) e.hidden = false; c.focus(); return false;
}
/* the checks run before the app's own handlers (capture), so nothing is sent without the tick */
window.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#cgx_go')){ e.preventDefault(); cgDone(); return; }
  const b = e.target.closest('#acc_up, #fb_send');
  if (b && !cgFormOk(b.id)){ e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
window.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = e.target && e.target.id;
  if ((id === 'acc_ruser' || id === 'acc_rpass' || id === 'acc_rpass2') && !cgFormOk('acc_up')){ e.preventDefault(); e.stopImmediatePropagation(); }
  if (id === 'cgx_c'){ e.preventDefault(); e.target.checked = !e.target.checked; e.target.dispatchEvent(new Event('change', {bubbles: true})); }
}, true);
document.addEventListener('change', e => {
  const id = e.target && e.target.id;
  if (id === 'cgx_c'){ const g = document.getElementById('cgx_go'); if (g) g.setAttribute('aria-disabled', e.target.checked ? 'false' : 'true'); if (e.target.checked){ const x = document.getElementById('cgx_e'); if (x) x.hidden = true; } }
  const f = CG_FORMS.find(x => x[1] === id);
  if (f){ const b = document.getElementById(f[0]); if (b){ b.setAttribute('aria-disabled', e.target.checked ? 'false' : 'true'); b.classList.toggle('cg-off', !e.target.checked); }
    if (e.target.checked){ const x = document.getElementById(id + '_e'); if (x) x.hidden = true; } }
});
/* Escape never closes the first-visit window; closing a document opened from it keeps the page locked */
window.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('cgx') && !document.querySelector('#lgx:not([hidden])')) e.stopImmediatePropagation(); }, true);
lgClose = (function(orig){ return function(){ const r = orig.apply(this, arguments); if (document.getElementById('cgx')) document.body.classList.add('cp-lock'); return r; }; })(lgClose);
/* the forms are drawn again and again (language, screen changes) – the tick boxes follow them */
new MutationObserver(() => { if (document.getElementById('acc_up') && !document.getElementById('acc_cs') || document.getElementById('fb_send') && !document.getElementById('fb_cs')) cgForms(); }).observe(document.body, {childList: true, subtree: true});
applyLang = (function(orig){ return function(){ const r = orig.apply(this, arguments); try { cgPaint(); for (const [, id] of CG_FORMS){ const c = document.getElementById(id); if (!c) continue; c.nextElementSibling.innerHTML = cgLabel(); const x = document.getElementById(id + '_e'); if (x) x.textContent = t('cg_need'); } } catch (e) {} return r; }; })(applyLang);
document.head.insertAdjacentHTML('beforeend', `<style>
.cg-ov{z-index:199;align-items:center}
.cg-box{max-width:460px;width:calc(100% - 32px);max-height:calc(100% - 32px);overflow:auto;padding:22px 20px}
.cg-h{margin:0 0 10px;font-size:1.25rem}
.cg-d p{margin:0 0 10px;line-height:1.55;font-size:.95rem}
.cg-chk{display:flex;gap:10px;align-items:flex-start;margin:14px 0 6px;line-height:1.5;cursor:pointer}
.cg-chk input{width:22px;height:22px;flex:0 0 22px;margin:2px 0 0;accent-color:var(--gold,#E8B13A);cursor:pointer}
.cg-lk{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;font-weight:700}
.cg-err{color:#c0392b;font-weight:700;margin:4px 0 8px;font-size:.92rem}
.cg-go{width:100%;margin-top:8px;min-height:48px}
.cg-go[aria-disabled=true],.cg-off{opacity:.5}
.cg-form{font-size:.92rem;margin:12px 0 8px}
</style>`);
cgGate();
