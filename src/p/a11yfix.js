/* 13.70: accessibility check (WCAG 2.2 AA / Israeli standard 5568) – fixes from a full audit of the app.
   1. Every calculator screen has a name for screen readers (some pointed to screen tabs that no longer exist).
   2. The app's name in the top bar is the page's main heading (level 1) for screen readers – nothing changes on screen.
   3. Contrast: on the dark look, the chosen option in a group (gold background) gets dark text instead of white (1.6:1 → over 9:1);
      the "work out fuel from km" link is darker on the light look.
   4. The small "?" help buttons get a larger invisible touch area.
   5. With very large text (200%), the home tiles wrap their words instead of pushing the page sideways. */
(function(){
  function a11yPanels(){
    document.querySelectorAll('[role="tabpanel"][aria-labelledby]').forEach(p => {
      const ids = (p.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      if (ids.length && ids.every(id => document.getElementById(id))) return;
      const id = (p.id || '').replace(/^panel-/, '');
      let nm = ''; try { nm = id ? t('tab_' + id) : ''; } catch (e) {}
      if (!nm || nm === 'tab_' + id){ const h = p.querySelector('h1,h2,h3'); nm = h ? h.textContent.trim() : ''; }
      p.removeAttribute('aria-labelledby');
      if (nm) p.setAttribute('aria-label', nm);
    });
    /* fields whose label is not tied to the box (a <label> without "for"): tie them, so a screen reader reads the label */
    let k = 0;
    document.querySelectorAll('.field > label:not([for])').forEach(l => {
      const f = l.parentElement, c = f.querySelectorAll('input:not([type=hidden]),select,textarea');
      if (c.length !== 1 || l.contains(c[0])) return; const el = c[0];
      if (el.labels && el.labels.length) return; if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
      if (!l.id) l.id = 'a11l-' + (++k) + '-' + Math.random().toString(36).slice(2, 6);
      el.setAttribute('aria-labelledby', l.id);
    });
    /* a box with only a hint inside (no label): the hint's first line becomes its name */
    document.querySelectorAll('#panels :is(input:not([type=hidden]),textarea)[placeholder]:not([aria-label]):not([aria-labelledby]):not([title])').forEach(el => { if (el.labels && el.labels.length) return; const ph = (el.getAttribute('placeholder') || '').split('\n')[0].replace(/^(לדוגמה|למשל|e\.g\.|for example|مثال|مثلاً|например)[:\s]*/i, '').trim(); if (ph) el.setAttribute('aria-label', el.getAttribute('placeholder').split('\n')[0].trim()); });
    /* controls hidden from screen readers (a nicer picker is shown instead) are also skipped by the keyboard */
    document.querySelectorAll('[aria-hidden="true"] :is(a[href],button,input,select,textarea):not([tabindex="-1"])').forEach(el => { if (!el.closest('[inert]')) el.setAttribute('tabindex', '-1'); });
    const tt = document.querySelector('.brand [data-i="appTitle"]');
    if (tt && !tt.hasAttribute('role')){ tt.setAttribute('role', 'heading'); tt.setAttribute('aria-level', '1'); }
  }
  const st = document.createElement('style');
  st.textContent = '[data-theme="dark"] :is(.fam-c.on,.sv-seg [aria-checked="true"],.sv-seg .on,.lu-seg button[aria-checked="true"],.mi-seg [aria-checked="true"],.cs-k.eq){color:#17130A}'
    + '.seg button[aria-pressed="false"]{color:var(--ink-2)}'
    + '.se-tog{color:var(--focus,#1F4FB8)}[data-theme="dark"] .se-tog{color:#9DBBFF}'
    + '.qbtn::after{content:"";position:absolute;inset:-6px;border-radius:50%}'
    + '.tiles>*{min-width:0}.tile span{overflow-wrap:anywhere}.lg-links{flex-wrap:wrap;white-space:normal;max-width:100%}.lg-a{white-space:normal}';
  document.head.appendChild(st);
  setTimeout(() => {
    try { a11yPanels(); } catch (e) {}
    /* screens built later (on first use) get the same care */
    try { let q = 0; const P = document.getElementById('panels'); if (P) new MutationObserver(() => { if (q) return; q = setTimeout(() => { q = 0; try { a11yPanels(); } catch (e) {} }, 400); }).observe(P, {childList: true, subtree: true}); } catch (e) {}
  }, 0);
  const act11 = activate;
  activate = function(){ const r = act11.apply(this, arguments); try { a11yPanels(); } catch (e) {} return r; };
  const al11 = applyLang;
  applyLang = function(){ const r = al11.apply(this, arguments); try { a11yPanels(); } catch (e) {} return r; };
})();
