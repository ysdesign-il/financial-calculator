/* ---------- 13.94: signing out by itself after 15 minutes without use ----------
   A signed-in account keeps its data key only in this tab (sessionStorage "fin-ek"). After 15 minutes with no touch, tap, key,
   scroll or return to the tab, the account is locked: the data is saved locked as always, the key is removed from the tab and the
   sign-in screen opens with a short note. The time of the last use is kept in the tab too, so a tab that slept in the background
   (timers stop there) or was reloaded is locked as soon as it wakes, before anything is shown. Family mode and guest use are not
   accounts and are not affected. The admin version also has its own limit on the server (_gate.js). */
const IDLE_MS = 15 * 60e3, IDLE_K = 'fin-idle-at';
var IDLE = {t: null, w: 0, out: false};
const idleOn = () => { try { return !!(FUSER && SS.getItem('fin-ek')); } catch (e) { return false; } };
const idleLast = () => { try { return +(SS.getItem(IDLE_K) || 0); } catch (e) { return 0; } };
function idleLock(){
  if (IDLE.out || !idleOn()) return;
  IDLE.out = true; clearTimeout(IDLE.t);
  try { SS.setItem('fin-idle-out', '1'); SS.removeItem(IDLE_K); } catch (e) {}
  try { logoutNow(); } catch (e) { try { clearSession(); location.reload(); } catch (er) {} }
}
function idleCheck(){ if (!idleOn()) return false; const l = idleLast(); if (l && Date.now() - l >= IDLE_MS){ idleLock(); return true; } return false; }
function idleArm(){ clearTimeout(IDLE.t); if (!idleOn()) return; const l = idleLast() || Date.now(); IDLE.t = setTimeout(() => { if (!idleCheck()) idleArm(); }, Math.max(1000, IDLE_MS - (Date.now() - l) + 500)); }
function idleSeen(){
  if (IDLE.out || !idleOn()) return;
  if (idleCheck()) return;                                   // the limit passed while nothing could run: lock, do not extend
  const now = Date.now(); if (now - IDLE.w < 5000) return;  // note it at most every 5 seconds
  IDLE.w = now; try { SS.setItem(IDLE_K, String(now)); } catch (e) {}
  idleArm();
}
/* a new sign-in or a sign-out starts afresh (the note of an earlier session in this tab must not lock the new one) */
{ const us0 = unlockSession; unlockSession = function(){ try { SS.removeItem(IDLE_K); SS.removeItem('fin-idle-out'); } catch (e) {} return us0.apply(this, arguments); }; }
{ const lo0 = logoutNow; logoutNow = function(){ try { SS.removeItem(IDLE_K); } catch (e) {} return lo0.apply(this, arguments); }; }
if (idleOn()){
  if (!idleCheck()){ if (!idleLast()){ try { SS.setItem(IDLE_K, String(Date.now())); } catch (e) {} } idleArm(); }
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'input'].forEach(ev => window.addEventListener(ev, idleSeen, {capture: true, passive: true}));
  window.addEventListener('scroll', idleSeen, {capture: true, passive: true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) idleSeen(); });
  window.addEventListener('pageshow', () => { idleCheck(); });
  window.addEventListener('focus', () => { idleSeen(); });
}
/* after the lock: open the sign-in screen and say why */
try {
  if (SS.getItem('fin-idle-out') && !FUSER){
    SS.removeItem('fin-idle-out');
    setTimeout(() => {
      try { const ts = document.getElementById('tab-settings'); if (ts) ts.click(); if (typeof setCat === 'function') setCat('account'); } catch (e) {}
      try { const m = document.getElementById('acc_msg'); if (m) m.textContent = t('idle_out'); } catch (e) {}
      try { const u = document.getElementById('acc_user'), d = u && u.closest('details'); if (d) d.open = true; if (u) u.scrollIntoView({block: 'center'}); } catch (e) {}
      try { toast(t('idle_out')); } catch (e) {}
    }, 700);
  }
} catch (e) {}
