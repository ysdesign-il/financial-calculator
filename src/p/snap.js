/* 13.66: a picture of the home screen for the next opening (shown by p/snap_early.html until the app has started).
   Kept only on this phone, in the same place as the app's own data; never in private mode or with an account (then the old one is removed).
   It is used only if the data, the language and the light/dark look are still the same as when it was taken. */
(function(){
  const KEY = 'fin-snap';
  let last = 0;
  const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return h; };
  const TRANSIENT = ['cp-lock', 'hero-min', 'fab-quiet', 'late-wait'];
  function snapSave(force){
    try {
      if (FUSER || (typeof PRIV !== 'undefined' && PRIV)){ RAWLS.removeItem(KEY); return; }
      if (window.__FIN_ADMIN__ || /\/admin\//.test(location.pathname)) return;   /* the owner's version is never pictured */
      if (tab !== 'home' || document.querySelector('.cp-ov:not([hidden])')) return;
      const now = Date.now(); if (!force && now - last < 8000) return; last = now;
      const home = document.getElementById('panel-home'); if (!home || home.hidden || !home.childElementCount) return;
      const c = document.body.cloneNode(true);
      c.querySelectorAll('script,noscript,template,[data-snap],.cp-ov,#late-skel,[hidden],.toast,.panel:not(#panel-home),iframe,video,canvas').forEach(e => e.remove());
      c.querySelectorAll('input,textarea').forEach(e => { e.removeAttribute('value'); if (e.tagName === 'TEXTAREA') e.textContent = ''; });
      const html = c.innerHTML;
      /* the styles the app added while running (the page's own ones are already in the page) */
      const css = [...document.head.querySelectorAll('style:not([data-st])')].map(x => x.textContent).join('\n').replace(/<\/style/gi, '');
      if (html.length + css.length > 600000) return;
      const de = document.documentElement, b = document.body;
      const ha = [...de.attributes].map(a => [a.name, a.value]);
      const ba = [...b.attributes].map(a => [a.name, a.name === 'class' ? a.value.split(/\s+/).filter(x => x && !TRANSIENT.includes(x)).join(' ') : a.value]);
      const g = k => RAWLS.getItem(k) || '';
      RAWLS.setItem(KEY, JSON.stringify({v: 1, at: now, lk: g('fin-lang') + '|' + (navigator.language || ''),
        dk: window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0,
        h: hash(['fin-vals', 'fin-exp', 'fin-dsitems', 'fin-tab'].map(g).join('\u0001')),
        ha, ba, css, html}));
    } catch (e) { try { RAWLS.removeItem(KEY); } catch (er) {} }
  }
  const idle = f => (window.requestIdleCallback ? requestIdleCallback(() => f(), {timeout: 3000}) : setTimeout(f, 300));
  setTimeout(() => idle(() => snapSave(true)), 3500);
  document.addEventListener('visibilitychange', () => { if (document.hidden) snapSave(true); });
  addEventListener('pagehide', () => snapSave(true));
  const actSnap = activate;
  activate = function(id){ const r = actSnap.apply(this, arguments); if (id === 'home') setTimeout(() => idle(() => snapSave(false)), 2500); return r; };
})();
