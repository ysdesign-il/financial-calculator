/* ---------- 12.2: connect Gemini with your own free key, from Settings, for AI everywhere in the app ----------
   The key box existed but stayed hidden. Now it is a guided card: open Google's key page (in Chrome on Android, where you are
   signed in), paste back with one tap, and the key is tested. Once approved, "answers here" is switched on so the assistant,
   explanations, CV writing, the advanced calculator and scanning all use Gemini. The key stays only on this device. */
var GK_URL = 'https://aistudio.google.com/app/apikey';
function gkOpenHref(){
  try { if (/Android/i.test(navigator.userAgent)) return 'intent://aistudio.google.com/app/apikey#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(GK_URL) + ';end'; } catch (e) {}
  return GK_URL;
}
function gkCardHTML(){
  const e = s => asEsc(t(s));
  return `<div class="gk-card" id="gk_card">
    <div class="gk-hd"><span class="gk-ic" aria-hidden="true">✦</span><div><b>${e('gk2_t')}</b><small>${e('gk2_s')}</small><span class="gk-okb">✓ ${e('gk2_conn')}</span></div></div>
    <ol class="gk-steps">
      <li><span>${e('gk2_s1')}</span><a class="gold-btn gk-open" id="gk_open" href="${asEsc(gkOpenHref())}" target="_blank" rel="noopener noreferrer">🔑 ${e('gk2_open')}</a></li>
      <li><span>${e('gk2_s2')}</span></li>
      <li><span>${e('gk2_s3')}</span><button type="button" class="btn gk-paste" id="gk_paste">📋 ${e('gk2_paste')}</button></li>
    </ol>
    <p class="fine gk-where">${e('gk2_where')}</p>
  </div>`;
}
function gkCardMount(){
  const w = $('#gk_wrap'); if (!w) return;
  if (!gkAllowed()){ w.hidden = true; return; }
  w.hidden = false;
  const ai = $('#ai_sec'); if (ai && ai.firstElementChild !== w) ai.insertBefore(w, ai.firstChild);   // the connection comes first
  const lg = document.documentElement.lang || '';
  const old = $('#gk_card'); if (old && old.dataset.l !== lg){ old.remove(); const o2 = $('#gk_inc'); if (o2) o2.remove(); }
  if (!$('#gk_card')){
    w.insertAdjacentHTML('afterbegin', gkCardHTML()); $('#gk_card').dataset.l = lg;
    if (IN_CLAUDE) w.insertAdjacentHTML('afterbegin', `<p class="fine gk-inc" id="gk_inc">${asEsc(t('gk2_inClaude'))}</p>`);
  }
  const inp = $('#set_gkey'); if (inp && !inp.value && SET.gkey) inp.value = SET.gkey;
  gkRender();
}
async function gkPaste(silent){
  let txt = '';
  try { txt = await navigator.clipboard.readText(); } catch (e) { if (!silent){ const i = $('#set_gkey'); if (i){ i.focus(); } toast(t('gk2_noClip')); } return false; }
  const m = String(txt || '').match(/AIza[0-9A-Za-z_\-]{30,}/);
  if (!m){ if (!silent) toast(t('gk2_noKey')); return false; }
  if (m[0] === gemKey() && SET.gkOk) return false;
  const i = $('#set_gkey'); if (i) i.value = m[0];
  await gkApprove();
  return true;
}
var GK_AWAY = 0;
const _gkRender122 = gkRender;
gkRender = function(){
  const r = _gkRender122.apply(this, arguments);
  const c = $('#gk_card'); if (c) c.classList.toggle('on', !!(gemKey() && SET.gkOk));
  return r;
};
const _gkApprove122 = gkApprove;
gkApprove = async function(){
  const r = await _gkApprove122.apply(this, arguments);
  if (GK.st === 'ok' || GK.st === 'gk_eQuota'){
    if (!IN_CLAUDE && SET.aiEngine !== 'inapp'){ SET.aiEngine = 'inapp'; saveSet(); }
    try { engRender(); } catch (e) {}
    try { aiEngSync(); } catch (e) {}
    const s = $('#set_aiEngine'); if (s) s.value = SET.aiEngine;
    toast(t('gk2_on'));
  }
  return r;
};
document.addEventListener('click', e => {
  if (e.target.closest('#gk_paste')) gkPaste(false);
  else if (e.target.closest('#gk_open')) GK_AWAY = Date.now();
});
/* back from Google with the key copied: pick it up by itself when the browser allows reading the clipboard */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && GK_AWAY && Date.now() - GK_AWAY < 15 * 60 * 1000) setTimeout(() => gkPaste(true).then(ok => { if (ok) GK_AWAY = 0; }), 400);
});
try { gkCardMount(); } catch (e) {}
const _rsGk122 = renderStamp;
renderStamp = function(){ const r = _rsGk122.apply(this, arguments); try { gkCardMount(); } catch (e) {} return r; };
/* jump to the Gemini card from anywhere ("connect Gemini" buttons) */
function gkGo(){
  try { activate('settings'); } catch (e) {}
  setTimeout(() => { try { if (typeof setCat === 'function') setCat('conn'); } catch (e) {}
    setTimeout(() => { const sec = $('[data-sk="set_ai"] details'); if (sec) sec.open = true; try { gkCardMount(); } catch (e) {} const c = $('#gk_card'); if (c) c.scrollIntoView({block: 'start', behavior: 'smooth'}); }, 200); }, 120);
}

/* 12.3: Gemini is only for developer mode and family mode — everyone else does not see it and a stored key is not used */
function gkAllowed(){ try { return (typeof DEV_ON !== 'undefined' && DEV_ON === true) || (typeof FAM === 'object' && FAM && FAM.on === true); } catch (e) { return false; } }
function gkNo(k){ try { return !IN_CLAUDE && !gkAllowed() ? 'gk3_only' : k; } catch (e) { return k; } }
{
  const gemKey123 = gemKey;
  gemKey = function(){ return gkAllowed() ? gemKey123.apply(this, arguments) : ''; };
}
/* show/hide the card whenever settings open or developer/family mode changes */
{
  const actGk = activate; activate = function(id){ const r = actGk.apply(this, arguments); if (id === 'settings'){ try { gkCardMount(); } catch (e) {} } return r; };
  if (typeof setCat === 'function'){ const scGk = setCat; setCat = function(){ const r = scGk.apply(this, arguments); try { gkCardMount(); } catch (e) {} return r; }; }
  if (typeof famApply === 'function'){ const faGk = famApply; famApply = function(){ const r = faGk.apply(this, arguments); try { gkCardMount(); } catch (e) {} return r; }; }
}
