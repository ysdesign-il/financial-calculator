/* ================= 9.7: the app's own sounds (made here, no files), mute, and alerts when an index moves a lot ================= */
const E97 = s => asEsc(String(s == null ? '' : s));
var SND = {ctx: null, last: 0};
const sndLevel = () => SET.sound === 'off' ? 0 : SET.sound === 'full' ? 0.16 : 0.07;
function sndCtx(){
  if (!SND.ctx){ try { const A = window.AudioContext || window.webkitAudioContext; if (A) SND.ctx = new A(); } catch (e) {} }
  if (SND.ctx && SND.ctx.state === 'suspended') try { SND.ctx.resume(); } catch (e) {}
  return SND.ctx;
}
/* one note: a soft "coin" tone — a triangle wave with a bright overtone and a quick fade */
function sndNote(c, f, at, dur, vol, type){
  const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
  o.type = type || 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.01;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  g2.gain.setValueAtTime(0.0001, at); g2.gain.exponentialRampToValueAtTime(vol * 0.35, at + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.6);
  o.connect(g).connect(c.destination); o2.connect(g2).connect(c.destination);
  o.start(at); o2.start(at); o.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
}
const SND_KIND = {
  tap:  [[1320, 0, 0.05]],
  ok:   [[1318.5, 0, 0.16], [1975.5, 0.07, 0.28]],                 // coin: E6 → B6
  up:   [[784, 0, 0.18], [987.8, 0.09, 0.18], [1318.5, 0.18, 0.34]], // rising
  down: [[1318.5, 0, 0.18], [987.8, 0.09, 0.18], [784, 0.18, 0.34]], // falling
  alert:[[1046.5, 0, 0.14], [1568, 0.12, 0.14], [1046.5, 0.24, 0.14], [1568, 0.36, 0.3]],
  mail: [[880, 0, 0.2], [1174.7, 0.11, 0.32]],
  err:  [[392, 0, 0.16, 'sine'], [311.1, 0.12, 0.26, 'sine']]
};
function snd(kind){
  const vol = sndLevel(); if (!vol) return;
  const now = Date.now(); if (kind === 'tap' && now - SND.last < 60) return; SND.last = now;
  const c = sndCtx(); if (!c) return;
  const t0 = c.currentTime + 0.01, k = kind === 'tap' ? vol * 0.5 : vol;
  try { (SND_KIND[kind] || SND_KIND.ok).forEach(([f, d, len, type]) => sndNote(c, f, t0 + d, len, k, type)); } catch (e) {}
}
/* sounds on the moments that matter */
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => sndCtx(), {capture: true, passive: true, once: true}));
document.addEventListener('pointerdown', e => {
  if (SET.tapSnd !== '1' || !e.target.closest) return;
  if (e.target.closest('button, .bt, .tile, a, [role=tab], [role=radio], select')) snd('tap');
}, {capture: true, passive: true});
const _toast97 = toast;
toast = function(msg){
  const m = String(msg || '');
  if (!SND.quiet){
    if (/^🔔/.test(m)) snd('alert');
    else if (/^📈/.test(m)) snd('up'); else if (/^📉/.test(m)) snd('down');
    else if (/^📬|^📥/.test(m)) snd('mail');
    else if (/לא הצליח|נכשל|שגיאה|fail|error|تعذّر|فشل/i.test(m)) snd('err');
    else snd('ok');
  }
  return _toast97.apply(this, arguments);
};
/* a mute button next to the other controls at the top */
function muteBtn(){
  const box = $('.rail-ctrls'); if (!box) return;
  let b = $('#snd_mute'); const off = SET.sound === 'off';
  const html = off ? '🔇' : '🔊', lab = t(off ? 'snd_unmute' : 'snd_mute');
  if (!b){ box.insertAdjacentHTML('afterbegin', `<button type="button" class="snd-mute" id="snd_mute" aria-pressed="${off}" aria-label="${E97(lab)}" title="${E97(lab)}">${html}</button>`); return; }
  b.textContent = html; b.setAttribute('aria-label', lab); b.title = lab; b.setAttribute('aria-pressed', off);
}
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#snd_mute')) return;
  if (SET.sound === 'off'){ SET.sound = SET.soundWas && SET.soundWas !== 'off' ? SET.soundWas : 'soft'; } else { SET.soundWas = SET.sound; SET.sound = 'off'; }
  try { saveSet(); } catch (er) {} const s = $('#set_sound'); if (s) s.value = SET.sound;
  muteBtn(); SND.quiet = true; toast(t(SET.sound === 'off' ? 'snd_offT' : 'snd_onT')); SND.quiet = false; if (SET.sound !== 'off') snd('ok');
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_sound'){ setTimeout(() => { muteBtn(); snd('ok'); }, 0); } });

/* ---------- alerts when an index or commodity moves a lot today ---------- */
function mvCheck(){
  if (SET.mvAlert === '0' || typeof IX !== 'object' || !IX.mkt) return;
  const lim = Math.max(0.1, +SET.mvPct || 2), day = new Date().toISOString().slice(0, 10);
  const seen = SET.mvSeen && typeof SET.mvSeen === 'object' ? SET.mvSeen : (SET.mvSeen = {});
  const hits = [];
  (typeof ixShown === 'function' ? ixShown() : IX_MK).forEach(k => {
    const d = IX.mkt[k]; if (!d || !(d.p > 0) || !isFinite(+d.chp) || !d.live) return;
    const ch = +d.chp; if (Math.abs(ch) < lim) return;
    const key = k + (ch > 0 ? '+' : '-'); if (seen[key] === day) return;
    seen[key] = day; hits.push([k, ch]);
  });
  Object.keys(seen).forEach(x => { if (seen[x] !== day) delete seen[x]; });
  if (!hits.length) return;
  try { saveSet(); } catch (e) {}
  hits.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const up = hits[0][1] > 0, txt = hits.slice(0, 3).map(([k, ch]) => ixName(k) + ' ' + sgnPC(ch)).join(' · ') + (hits.length > 3 ? ' …' : '');
  toast((up ? '📈 ' : '📉 ') + t('mv_today', {x: txt}));
  try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'granted') new Notification(t('mkmv_title'), {body: txt, icon: 'icon-192.png', tag: 'mv-' + day}); } catch (e) {}
}
const _ixB97 = ixBoard;
ixBoard = function(){ const r = _ixB97.apply(this, arguments); try { mvCheck(); } catch (e) {} return r; };
setInterval(() => { if (!document.hidden) try { mvCheck(); } catch (e) {} }, 120000);
/* a new message in the inbox rings once */
var IBN = -1;
const _ibBtn97 = ibBtn;
ibBtn = function(){ const r = _ibBtn97.apply(this, arguments); try { const n = ibUnread(); if (IBN >= 0 && n > IBN) snd('mail'); IBN = n; } catch (e) {} return r; };
const _al97 = applyLang;
applyLang = function(){ const r = _al97.apply(this, arguments); try { muteBtn(); } catch (e) {} return r; };
try { muteBtn(); } catch (e) {}
if (location.hostname === 'localhost') window.__fin97 = {snd, mvCheck};
