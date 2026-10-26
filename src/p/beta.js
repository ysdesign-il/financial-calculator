/* ---------- 13.55: a small "Beta" badge next to the app's name ----------
   Tapping it (or reaching it with the keyboard) shows a short note. The owner switches it on or off for everyone in the admin panel
   (parts on/off → "beta", saved on the server in the public settings). On by default. The last known choice is kept on the phone so the
   badge does not flash on the next visit. In the admin version it always shows, like every other part. */
var BETA_OFF = false;
try { BETA_OFF = RAWLS.getItem('fin-beta-off') === '1'; } catch (e) {}
const betaShown = () => !BETA_OFF || (typeof admIn === 'function' && admIn());
function betaHide(){
  const n = $('#beta_note'), b = $('#beta_pill');
  if (n) n.hidden = true; if (b) b.setAttribute('aria-expanded', 'false');
}
function betaShow(){
  const n = $('#beta_note'), b = $('#beta_pill');
  if (n) n.hidden = false; if (b) b.setAttribute('aria-expanded', 'true');
}
function betaSync(){
  const brand = $('.rail .brand') || $('.brand');
  let b = $('#beta_pill'), n = $('#beta_note');
  if (!brand || !betaShown()){ if (b) b.remove(); if (n) n.remove(); return; }
  if (!b){
    b = document.createElement('button'); b.type = 'button'; b.id = 'beta_pill'; b.className = 'beta-pill';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'beta_note'); b.setAttribute('aria-describedby', 'beta_note');
    const own = $('.own-pill', brand); if (own) brand.insertBefore(b, own); else brand.appendChild(b);
  }
  if (!n){ n = document.createElement('div'); n.id = 'beta_note'; n.className = 'beta-note'; n.setAttribute('role', 'note'); n.hidden = true; brand.appendChild(n); }
  if (b.textContent !== t('beta_pill')) b.textContent = t('beta_pill');
  b.setAttribute('aria-label', t('beta_aria'));
  if (n.textContent !== t('beta_note')) n.textContent = t('beta_note');
}
/* tap = open/close; keyboard focus = open; leaving, Escape or a tap elsewhere = close */
var BETA_PD = 0;
document.addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('#beta_pill')){ BETA_PD = Date.now(); return; }
  if (!(e.target.closest && e.target.closest('#beta_note'))) betaHide();
}, true);
document.addEventListener('click', e => {
  if (!(e.target.closest && e.target.closest('#beta_pill'))) return;
  const n = $('#beta_note'); if (!n) return;
  if (n.hidden) betaShow(); else betaHide();
});
document.addEventListener('focusin', e => {
  if (!e.target || e.target.id !== 'beta_pill') return;
  let kb = Date.now() - BETA_PD > 600; try { kb = kb && e.target.matches(':focus-visible'); } catch (er) {}   // keyboard only: a tap is handled by click
  if (kb) betaShow();
});
document.addEventListener('focusout', e => { if (e.target && e.target.id === 'beta_pill') setTimeout(() => { if (document.activeElement && document.activeElement.id === 'beta_pill') return; betaHide(); }, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#beta_note') && !$('#beta_note').hidden){ betaHide(); const b = $('#beta_pill'); if (b) b.focus(); } });
/* the owner's switch, from the public settings (window.__ADMCFG, event 'admp-cfg') */
function betaCfg(){
  const c = window.__ADMCFG; if (!c || typeof c !== 'object') return;
  const off = Array.isArray(c.off) && c.off.indexOf('beta') >= 0;
  BETA_OFF = off;
  try { if (off) RAWLS.setItem('fin-beta-off', '1'); else RAWLS.removeItem('fin-beta-off'); } catch (e) {}
  betaSync();
}
addEventListener('admp-cfg', betaCfg);
try { betaSync(); betaCfg(); } catch (e) {}
{
  const alBeta = applyLang; applyLang = function(){ const r = alBeta.apply(this, arguments); try { betaSync(); } catch (e) {} return r; };
}
