/* ================= 8.5: developer code reaches everyone by itself =================
   When the owner publishes code — from the app inside Claude or from the website — every open copy picks it up:
   - inside Claude: through the app's own database (only the owner may write there; everyone reads), at once;
   - on the website and in the app: devcode.json on GitHub, checked every two minutes and when the screen comes back.
   Style changes apply on the spot; a script change reloads the page quietly when nothing is being typed. */
var DCX = {at: 0, css: '', js: '', db: null, wantReload: false};
function dcxApply(code, from){
  if (!code || typeof code !== 'object') return;
  const at = +code.at || 0; if (at && at <= DCX.at) return;
  let preview = false; try { preview = DEV_ON && RAWLS.getItem('fin-devcode-preview') === '1'; } catch (e) {}
  if (preview || (typeof dcSkip === 'function' && dcSkip())) return;
  const css = String(code.css || ''), js = String(code.js || '');
  const first = !DCX.at; DCX.at = at || Date.now();
  if (typeof DC === 'object'){ DC.pub = {js, css, at: DCX.at}; DC.at = DCX.at; }
  /* style: swap it in place */
  if (css !== DCX.css){
    let st = document.getElementById('devcode-css');
    if (css){ if (!st){ st = document.createElement('style'); st.id = 'devcode-css'; document.head.appendChild(st); } st.textContent = css; } else if (st) st.remove();
    DCX.css = css;
  }
  /* script: first time run it; a later change reloads the page when it is safe */
  if (js !== DCX.js){
    const ranBefore = typeof DC === 'object' && DC.ran;
    DCX.js = js;
    if (first){ if (!ranBefore && js) try { if (typeof dcRun === 'function') dcRun({js, css: ''}); } catch (e) {} }   // at start the code that already ran is this one
    else { DCX.wantReload = true; dcxMaybeReload(); }
  }
  try { if (typeof dcRender === 'function') dcRender(); } catch (e) {}
  if (!first) try { toast(t('dcx_got')); } catch (e) {}
}
function dcxMaybeReload(){
  if (!DCX.wantReload) return;
  const a = document.activeElement, typing = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  if (typing || document.hidden) return;
  try { if (typeof svSave === 'function' && SV && SV.mode === 'auto') svSave(true); } catch (e) {}
  setTimeout(() => location.reload(), 1200);
  DCX.wantReload = false;
}
document.addEventListener('focusout', () => setTimeout(dcxMaybeReload, 400));
document.addEventListener('visibilitychange', () => { if (!document.hidden){ dcxPoll(); setTimeout(dcxMaybeReload, 400); } });
/* the GitHub copy, for the website and the app */
async function dcxPoll(){
  try {
    const r = await fetch((IN_CLAUDE ? DC_URL_GH : 'devcode.json') + '?v=' + Date.now(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (r.ok) dcxApply(await r.json(), 'gh');
  } catch (e) {}
}
setTimeout(() => { dcxPoll(); setInterval(() => { if (!document.hidden) dcxPoll(); }, 120000); }, 1500);
/* the app's database inside Claude: live for everyone the moment the owner publishes */
(async function dcxDb(){
  if (!IN_CLAUDE) return;
  try {
    const db = await window.claude.use('db'); if (!db) return; DCX.db = db;
    db.doc('rates/devcode').onSnapshot(s => { try { if (s && s.exists) dcxApply(s.data(), 'db'); } catch (e) {} });
  } catch (e) {}
})();
/* publishing: inside Claude write the database (and GitHub too when it can be reached); on the website GitHub as before */
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-dc="pub"],[data-dc="unpub"]'); if (!b || !liveOwner() || !IN_CLAUDE || !DCX.db) return;
  const k = b.dataset.dc;
  if (k === 'unpub' && b.dataset.sure !== '1') return;          // the first tap only asks "sure?" (handled by the existing button)
  e.stopImmediatePropagation(); e.preventDefault();
  const body = k === 'pub' ? dcGet() : {js: '', css: '', at: Date.now()};
  dcMsg('m_wait');
  try {
    await DCX.db.doc('rates/devcode').set(Object.assign({v: 1}, body));
    let gh = false; try { if (ghTok()){ await ghPut('devcode.json', JSON.stringify(Object.assign({v: 1}, body), null, 1), k === 'pub' ? 'Developer code update' : 'Developer code removed'); gh = true; } } catch (er) {}
    dcMsg(gh ? 'dcx_okBoth' : 'dcx_okApp'); toast(t(gh ? 'dcx_okBoth' : 'dcx_okApp'));
  } catch (er) { dcMsg('dcx_fail', {e: String(er && (er.code || er.message) || '')}); }
}, true);
/* after publishing on the website, show it here at once instead of waiting for the next check */
const _ghPut88 = ghPut;
ghPut = async function(path, text){
  const r = await _ghPut88.apply(this, arguments);
  if (path === 'devcode.json'){ try { const j = JSON.parse(text); setTimeout(() => dcxApply(j, 'self'), 0); } catch (e) {} }
  return r;
};
