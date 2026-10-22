/* 13.43: the floating buttons (accessibility, AI assistant, admin) can be dragged anywhere; the place is kept on this phone.
   A tap still works as a tap. A long press (without moving) puts the button back in its usual place. */
function fabDrag(sels, KEY){
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const P = ['left', 'top', 'right', 'bottom', 'inset-inline-start', 'inset-inline-end', 'transform'];
  const put = (el, x, y) => { const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight, m = 6;
    const L = Math.max(m, Math.min(W - r.width - m, x * W - r.width / 2)), T = Math.max(m, Math.min(H - r.height - m, y * H - r.height / 2));
    P.forEach(k => el.style.setProperty(k, 'auto', 'important')); el.style.setProperty('transform', 'none', 'important');
    el.style.setProperty('left', L + 'px', 'important'); el.style.setProperty('top', T + 'px', 'important'); };
  const keyOf = el => sels.find(s => el.matches(s));
  const apply = el => { const k = keyOf(el), o = load()[k]; if (o && isFinite(o.x) && isFinite(o.y)) put(el, o.x, o.y); };
  const reset = el => { P.forEach(k => el.style.removeProperty(k)); const o = load(); delete o[keyOf(el)]; save(o); };
  function attach(el){
    if (el.__fd) { apply(el); return; } el.__fd = 1; el.style.touchAction = 'none'; apply(el);
    let s = null, moved = false, eat = false, lp = 0;
    el.addEventListener('pointerdown', e => { if (e.button > 0) return; const r = el.getBoundingClientRect(); s = {x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId}; moved = false; try { el.setPointerCapture(e.pointerId); } catch (er) {}
      clearTimeout(lp); lp = setTimeout(() => { if (s && !moved){ s = null; eat = true; reset(el); try { navigator.vibrate && navigator.vibrate(20); } catch (er) {} } }, 900); });
    el.addEventListener('pointermove', e => { if (!s || e.pointerId !== s.id) return;
      if (!moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) return;
      if (!moved){ moved = true; clearTimeout(lp); el.classList.add('fd-drag'); }
      const r = el.getBoundingClientRect(); put(el, (e.clientX - s.dx + r.width / 2) / innerWidth, (e.clientY - s.dy + r.height / 2) / innerHeight); e.preventDefault(); });
    const end = e => { clearTimeout(lp); if (!s) return; if (moved){ const r = el.getBoundingClientRect(), o = load(); o[keyOf(el)] = {x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight}; save(o); eat = true; el.classList.remove('fd-drag'); } s = null; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('click', e => { if (eat){ eat = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    el.addEventListener('contextmenu', e => { if (s || eat) e.preventDefault(); });
  }
  const scan = () => sels.forEach(q => document.querySelectorAll(q).forEach(attach));
  let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 60); }).observe(document.body, {childList: true, subtree: true});
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(scan, 120); });
  scan();
  return {reset: () => { save({}); sels.forEach(q => document.querySelectorAll(q).forEach(el => P.forEach(k => el.style.removeProperty(k)))); }};
}
const FABDRAG = fabDrag(['.ax-fab', '.ai-fab', '#admk-fab'], 'fin-fabpos');
/* in the accessibility panel: put all floating buttons back in place */
if (typeof axPanel === 'function'){ const axpFd = axPanel; axPanel = function(){ const r = axpFd.apply(this, arguments); try { const f = document.querySelector('#axx_b .ax-foot'); if (f && !f.querySelector('#fd_reset')) f.insertAdjacentHTML('beforeend', `<button type="button" class="btn" id="fd_reset">⤢ ${axE(t('fd_reset'))}</button>`); } catch (e) {} return r; }; }
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#fd_reset')){ FABDRAG.reset(); toast(t('fd_done')); } });
Object.assign(T, {
  fd_reset:['החזרת הכפתורים הצפים למקום','إعادة الأزرار العائمة إلى مكانها','Put floating buttons back'],
  fd_done:['הכפתורים חזרו למקום. אפשר לגרור אותם שוב לכל מקום.','عادت الأزرار إلى مكانها. يمكن سحبها مجددًا إلى أي مكان.','Buttons are back in place. You can drag them anywhere again.'],
});
