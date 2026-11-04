/* ---------- 13.68: motion and a short tour of the app ----------
   1. A screen change fades the new screen in (opacity + a few pixels of movement, 220 ms). activate() stays synchronous,
      so every module that reads the page right after activate() keeps working.
   2. When an input changes, the big result number counts to its new value (450 ms) and the rows whose value changed flash briefly.
      The final text is always exactly what the app rendered; anything that is not a plain number is left alone.
   3. The home cards come in one after another the first time home is opened after the app is ready (never while the app starts).
   4. "What you can do here": real screens of the app in a phone frame, swipe / dots / previous / next, autoplay that pauses
      on touch, hover and focus. Built only after the app is ready; the pictures load lazily. Hidden for good with × ('fin-tour-x').
   Nothing here runs before the first paint; under prefers-reduced-motion there is no motion and no autoplay. */
(function(){
  let READY = false, IN_ACT = false, HOME_DONE = false;
  const SEEN = new Set();
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const still = () => !!(mq && mq.matches);
  const anE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  const st = document.createElement('style');
  st.textContent =
    /* changed rows */
    '.ledger .row.an-chg{position:relative}'
    + '.ledger .row.an-chg::after{content:"";position:absolute;inset:-2px -6px;border-radius:10px;background:var(--gold,#C9971C);opacity:0;pointer-events:none;animation:anFlash .9s ease-out}'
    + '@keyframes anFlash{0%{opacity:0}18%{opacity:.16}100%{opacity:0}}'
    /* press feedback for buttons that had none */
    + ':is(.tchip,.pm-hdr-btn,.tz-b,.hero-say,.tu2-tog,.lu-tog,.mine-c,.hh-go,.tr-go,.tr-b,.mv):active{transform:scale(.97)}'
    /* the tour */
    + '#tour{margin:22px 0 6px}'
    + '#tour.tr-in{animation:trIn .35s ease-out both}@keyframes trIn{from{opacity:0}to{opacity:1}}'
    + '.tr-top{display:flex;align-items:center;justify-content:space-between;gap:8px}'
    + '.tr-top .sec-t{margin:0}'
    + '.tr-x{position:relative;flex:none;width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);font-size:1.1rem;line-height:1;cursor:pointer;display:grid;place-items:center}'
    + '.tr-x::after{content:"";position:absolute;inset:-6px}'
    + '.tr-card{margin-top:10px;background:var(--surface);border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 10px 30px -18px rgba(14,26,51,.35);'
    + 'background-image:radial-gradient(120% 90% at 18% 10%,color-mix(in srgb,var(--gold,#C9971C) 12%,transparent),transparent 60%)}'
    + '[dir="rtl"] .tr-card{background-image:radial-gradient(120% 90% at 82% 10%,color-mix(in srgb,var(--gold,#C9971C) 12%,transparent),transparent 60%)}'
    + '.tr-trk{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}'
    + '.tr-trk::-webkit-scrollbar{display:none}'
    + '.tr-s{flex:0 0 100%;scroll-snap-align:start;scroll-snap-stop:always;display:grid;grid-template-columns:146px 1fr;gap:16px;align-items:center;padding:20px 18px 14px;box-sizing:border-box;min-width:0}'
    + '.tr-ph{position:relative;width:146px;padding:5px;border-radius:28px;background:linear-gradient(150deg,#3a4560 0%,#141b2c 45%,#070b14 100%);'
    + 'box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 0 0 1px rgba(255,255,255,.07),0 0 0 1px rgba(0,0,0,.35),0 24px 30px -18px rgba(10,18,38,.6),0 8px 14px -8px rgba(10,18,38,.4)}'
    + '.tr-ph::before{content:"";position:absolute;inset-inline-end:-2.5px;top:64px;width:3px;height:30px;border-radius:2px;background:#2a3246}'
    + '.tr-scr{position:relative;border-radius:23px;overflow:hidden;background:#0A1226;padding-top:13px}'
    + '.tr-scr::before{content:"";position:absolute;top:4px;left:50%;width:40px;height:9px;margin-left:-20px;border-radius:6px;background:#000;z-index:2}'
    + '.tr-scr::after{content:"";position:absolute;inset:0;background:linear-gradient(118deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.05) 34%,transparent 35%);pointer-events:none}'
    + '.tr-scr img{display:block;width:100%;height:auto;aspect-ratio:300/570;background:var(--bg)}'
    + '.tr-tx{min-width:0}'
    + '.tr-tx h4{margin:0 0 6px;font-size:1.08rem;line-height:1.3;color:var(--ink)}'
    + '.tr-tx p{margin:0 0 14px;font-size:.9rem;line-height:1.5;color:var(--ink-2)}'
    + '.tr-go{min-height:40px;padding:8px 20px}'
    + '.tr-nav{display:flex;align-items:center;justify-content:center;gap:6px;padding:0 10px 12px}'
    + '.tr-b{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer;padding:0}'
    + '.tr-b svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '[dir="rtl"] .tr-b.tr-dir svg{transform:scaleX(-1)}'
    + '.tr-dots{display:flex;align-items:center;margin:0 4px}'
    + '.tr-d{width:24px;height:36px;border:0;background:none;padding:0;cursor:pointer;display:grid;place-items:center}'
    + '.tr-d::before{content:"";width:7px;height:7px;border-radius:4px;background:var(--line);transition:width .25s ease,background .25s ease}'
    + '.tr-d[aria-current="true"]::before{width:18px;background:var(--gold,#C9971C)}'
    + ':is(.tr-b,.tr-d,.tr-x):focus-visible{outline:2px solid var(--gold,#C9971C);outline-offset:2px}'
    + '@media (max-width:350px){.tr-s{grid-template-columns:118px 1fr;gap:12px;padding:16px 12px 12px}.tr-ph{width:118px}}'
    + '@media (prefers-reduced-motion:reduce){#tour.tr-in,.ledger .row.an-chg::after{animation:none}.tr-trk{scroll-behavior:auto}.tr-d::before{transition:none}'
    + ':is(.tchip,.pm-hdr-btn,.tz-b,.hero-say,.tu2-tog,.lu-tog,.mine-c,.hh-go,.tr-go,.tr-b,.mv):active{transform:none}}';
  document.head.appendChild(st);

  /* ready = the page has loaded and the browser had a quiet moment; nothing of this module runs before that */
  const goReady = () => {
    const fin = () => { READY = true; if (tab === 'home') HOME_DONE = true; try { trEnsure(); } catch (e) {} };
    let tries = 0;
    const wait = () => {                                /* also wait for the late part of the app, so the start stays light */
      let late = true; try { late = typeof __lateDone === 'undefined' || !!__lateDone; } catch (e) {}
      if (!late && ++tries < 40){ setTimeout(wait, 250); return; }
      if (window.requestIdleCallback) requestIdleCallback(fin, {timeout: 1500}); else setTimeout(fin, 400);
    };
    wait();
  };
  if (document.readyState === 'complete') setTimeout(goReady, 300);
  else addEventListener('load', () => setTimeout(goReady, 300), {once: true});

  /* ---------- 1. screen change ---------- */
  const actAn = activate;
  activate = function(id){
    const prev = tab;
    IN_ACT = true;
    let r;
    try { r = actAn.apply(this, arguments); } finally { IN_ACT = false; }
    try {
      if (READY && !still() && id !== prev){
        const p = document.getElementById('panel-' + id);
        if (p && !p.hidden && p.animate){
          if (id === 'home' && !HOME_DONE) anHome(p);
          else p.animate([{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'none'}], {duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)'});
        }
      }
      if (id === 'home'){ if (READY) HOME_DONE = true; trEnsure(); }
    } catch (e) {}
    return r;
  };
  function anHome(p){
    HOME_DONE = true;
    const h = innerHeight; let k = 0;
    [...p.children].forEach(el => {
      if (k >= 9 || el.hidden || !el.offsetHeight) return;
      const b = el.getBoundingClientRect(); if (b.bottom < 0 || b.top > h) return;
      el.animate([{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'none'}],
        {duration: 320, delay: k * 45, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'});
      k++;
    });
  }

  /* ---------- 2. the result counts to its new value ---------- */
  function anParse(s){
    const m = /^([^\d−-]*)([−-]?)(\d[\d,.]*\d|\d)([^\d]*)$/.exec(s);
    if (!m) return null;
    const n = m[3], ld = n.lastIndexOf('.'), lc = n.lastIndexOf(',');
    let dec = '', grp = '';
    if (ld >= 0 && lc >= 0){ dec = ld > lc ? '.' : ','; grp = dec === '.' ? ',' : '.'; }
    else if (ld >= 0 || lc >= 0){
      const c = ld >= 0 ? '.' : ',', parts = n.split(c);
      if (parts.length === 2 && parts[1].length !== 3) dec = c; else grp = c;
    }
    const ip = dec ? n.slice(0, n.lastIndexOf(dec)) : n, fp = dec ? n.slice(n.lastIndexOf(dec) + 1) : '';
    if (grp && ip.split(grp).slice(1).some(g => g.length !== 3)) return null;
    const val = parseFloat(ip.split(grp || '\u0000').join('') + (fp ? '.' + fp : ''));
    if (!isFinite(val) || Math.abs(val) > 1e14) return null;
    return {pre: m[1], sign: m[2], suf: m[4], dec, grp, dp: fp.length, val: m[2] ? -val : val};
  }
  function anFmt(x, f, grp){
    let s = Math.abs(x).toFixed(f.dp), i = s, fr = '';
    if (f.dp){ i = s.slice(0, s.indexOf('.')); fr = s.slice(s.indexOf('.') + 1); }
    if (grp) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, grp);
    return f.pre + (x < 0 ? f.sign : '') + i + (f.dp ? f.dec + fr : '') + f.suf;
  }
  const RUN = new Map();
  function anCount(id, el, from, to){
    const A = anParse(from), B = anParse(to);
    if (!A || !B || A.pre !== B.pre || A.suf !== B.suf || A.val === B.val) return;
    if (A.sign !== B.sign && A.val && B.val && Math.sign(A.val) !== Math.sign(B.val)) return;
    if (A.grp && B.grp && A.grp !== B.grp) return;
    if ((A.dec && B.grp === A.dec) || (B.dec && A.grp === B.dec)) return;
    if (B.dp && A.dec && B.dec && A.dec !== B.dec) return;
    const f = Object.assign({}, B, {sign: B.sign || A.sign || '−', dec: B.dec || A.dec || '.'});
    const grp = B.grp || A.grp || '';
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
    const node = el.firstChild, box = el.closest('.hero');
    const t0 = performance.now(), D = 450;
    let last = anFmt(A.val, f, grp);
    node.nodeValue = last;
    if (box) box.setAttribute('aria-busy', 'true');
    const tok = {};
    RUN.set(id, tok);
    const end = () => { if (box && RUN.get(id) === tok){ box.removeAttribute('aria-busy'); RUN.delete(id); } };
    const step = now => {
      if (RUN.get(id) !== tok || !node.isConnected || node.nodeValue !== last){ end(); return; }
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1){ node.nodeValue = to; end(); return; }
      last = anFmt(A.val + (B.val - A.val) * e, f, grp);
      node.nodeValue = last;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const showAn = show;
  show = function(id){
    let go = false, oldHero = '', oldRows = null;
    try {
      const p = document.getElementById('panel-' + id);
      go = READY && !IN_ACT && SEEN.has(id) && !still() && !!p && !p.hidden;
      if (go){
        const hv = p.querySelector('#hero-' + id + ' .hero-value');
        oldHero = hv ? hv.textContent : '';
        const led = document.getElementById('led-' + id);
        if (led){ oldRows = new Map(); led.querySelectorAll('.row').forEach(r => { const dt = r.querySelector('dt'), dd = r.querySelector('dd'); if (dt && dd) oldRows.set(dt.textContent, dd.textContent); }); }
      }
    } catch (e) { go = false; }
    const r = showAn.apply(this, arguments);
    try {
      SEEN.add(id);
      if (go){
        const hv = document.querySelector('#hero-' + id + ' .hero-value');
        if (hv && oldHero) anCount(id, hv, oldHero, hv.textContent);
        const led = document.getElementById('led-' + id);
        if (led && oldRows && oldRows.size){
          let k = 0;
          led.querySelectorAll('.row').forEach(row => {
            if (k >= 12) return;
            const dt = row.querySelector('dt'), dd = row.querySelector('dd');
            if (!dt || !dd || !oldRows.has(dt.textContent) || oldRows.get(dt.textContent) === dd.textContent) return;
            row.classList.remove('an-chg'); void row.offsetWidth; row.classList.add('an-chg'); k++;
            setTimeout(() => row.classList.remove('an-chg'), 950);
          });
        }
      }
    } catch (e) {}
    return r;
  };

  /* ---------- 4. the tour ---------- */
  const TR_IDS = ['loan', 'salary', 'savegoal', 'markets', 'compound'];
  let TR = null;
  const trOff = () => { try { return localStorage.getItem('fin-tour-x') === '1'; } catch (e) { return false; } };
  const trIds = () => TR_IDS.filter(id => TABS.includes(id) && !(typeof KS_OFF !== 'undefined' && KS_OFF.includes(id)) && !(typeof mbLocked === 'function' && mbLocked(id)));
  const IC = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>'
  };
  function trHTML(ids){
    const pic = lang === 'he' ? 'he' : 'en', n = ids.length;
    return `<div class="tr-top"><h3 class="sec-t" id="tr_h">${anE(t('tr_h'))}</h3><button type="button" class="tr-x" id="tr_x" aria-label="${anE(t('tr_hide'))}">×</button></div>
      <div class="tr-card"><div class="tr-trk" id="tr_trk">${ids.map((id, i) => {
        const nm = t('tab_' + id);
        return `<div class="tr-s" role="group" aria-roledescription="${anE(t('tr_rdS'))}" aria-label="${anE(t('tr_of', {i: i + 1, n}) + ': ' + nm)}" data-i="${i}">
          <div class="tr-ph"><div class="tr-scr"><img src="img/tour/${id}-${pic}.webp" width="300" height="570" loading="lazy" decoding="async" alt="${anE(t('tr_img', {n: nm}))}"></div></div>
          <div class="tr-tx"><h4>${anE(nm)}</h4><p>${anE(t('tr_' + id))}</p><button type="button" class="gold-btn tr-go" data-trgo="${id}">${anE(t('tr_try'))}</button></div></div>`;
      }).join('')}</div>
      <div class="tr-nav"><button type="button" class="tr-b tr-dir" id="tr_pv" aria-label="${anE(t('tr_prev'))}">${IC.prev}</button>
        <div class="tr-dots">${ids.map((id, i) => `<button type="button" class="tr-d" data-d="${i}" aria-label="${anE(t('tr_go', {i: i + 1}))}"></button>`).join('')}</div>
        <button type="button" class="tr-b tr-dir" id="tr_nx" aria-label="${anE(t('tr_next'))}">${IC.next}</button>
        <button type="button" class="tr-b" id="tr_pp"${still() ? ' hidden' : ''}></button></div></div>`;
  }
  function trSpot(home){
    return home.querySelector(':scope > #hpic') ? ['afterend', home.querySelector(':scope > #hpic')]
      : home.querySelector(':scope > #hs_t') ? ['beforebegin', home.querySelector(':scope > #hs_t')]
      : home.querySelector(':scope > #mk_anchor') ? ['beforebegin', home.querySelector(':scope > #mk_anchor')] : null;
  }
  function trEnsure(rebuild){
    if (!READY) return;
    const home = document.getElementById('panel-home');
    const old = document.getElementById('tour');
    if (!home || trOff()){ if (old) old.remove(); return; }
    if (old && !rebuild) return;
    if (!old && home.hidden) return;                    /* built the first time home is actually on screen */
    const ids = trIds(); if (!ids.length){ if (old) old.remove(); return; }
    const s = document.createElement('section');
    s.id = 'tour'; s.className = 'tr'; s.setAttribute('aria-roledescription', t('tr_rd')); s.setAttribute('aria-labelledby', 'tr_h');
    s.innerHTML = trHTML(ids);
    let keep = 0;
    if (old){ keep = TR ? TR.i : 0; trStop(); old.replaceWith(s); }
    else {
      const at = trSpot(home); if (!at) return;
      at[1].insertAdjacentElement(at[0], s);
      if (!still()) s.classList.add('tr-in');
    }
    trWire(s, ids.length, Math.min(keep, ids.length - 1));
  }
  function trStop(){ if (TR){ clearInterval(TR.tm); if (TR.io) TR.io.disconnect(); TR = null; } }
  function trWire(s, n, start){
    const trk = s.querySelector('#tr_trk'), slides = [...s.querySelectorAll('.tr-s')], dots = [...s.querySelectorAll('.tr-d')];
    const pp = s.querySelector('#tr_pp');
    const S = TR = {i: 0, n, hover: false, focus: false, hold: 0, user: false, seen: false, tm: 0, io: null};
    const rtl = () => getComputedStyle(trk).direction === 'rtl';
    const mark = i => {
      S.i = i;
      slides.forEach((x, k) => { if (k === i) x.removeAttribute('inert'); else x.setAttribute('inert', ''); });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    };
    const go = (i, smooth) => {
      i = (i + n) % n;
      const w = trk.clientWidth || 1;
      trk.scrollTo({left: (rtl() ? -1 : 1) * i * w, behavior: smooth && !still() ? 'smooth' : 'auto'});
      mark(i);
    };
    let raf = 0;
    trk.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const w = trk.clientWidth || 1, i = Math.max(0, Math.min(n - 1, Math.round(Math.abs(trk.scrollLeft) / w))); if (i !== S.i) mark(i); });
    }, {passive: true});
    s.querySelector('#tr_pv').addEventListener('click', () => { S.hold = Date.now() + 8000; go(S.i - 1, true); });
    s.querySelector('#tr_nx').addEventListener('click', () => { S.hold = Date.now() + 8000; go(S.i + 1, true); });
    dots.forEach(d => d.addEventListener('click', () => { S.hold = Date.now() + 8000; go(+d.dataset.d, true); }));
    s.querySelector('#tr_x').addEventListener('click', () => {
      try { localStorage.setItem('fin-tour-x', '1'); } catch (e) {}
      trStop();
      const nx = s.nextElementSibling; s.remove();
      try { const f = nx && nx.querySelector ? (nx.matches('h3,h2') ? nx : nx.querySelector('h3,h2,button')) : null; if (f){ if (!f.hasAttribute('tabindex') && !/BUTTON/.test(f.tagName)) f.setAttribute('tabindex', '-1'); f.focus({preventScroll: true}); } } catch (e) {}
    });
    s.addEventListener('click', e => { const b = e.target.closest('[data-trgo]'); if (b){ activate(b.dataset.trgo); try { window.scrollTo({top: 0}); } catch (er) {} } });
    s.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest('input,select,textarea')) return;
      e.preventDefault(); S.hold = Date.now() + 8000;
      const fwd = (e.key === 'ArrowRight') !== rtl();
      go(S.i + (fwd ? 1 : -1), true);
    });
    s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') S.hover = true; });
    s.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') S.hover = false; });
    s.addEventListener('focusin', () => { S.focus = true; });
    s.addEventListener('focusout', e => { if (!s.contains(e.relatedTarget)) S.focus = false; });
    s.addEventListener('touchstart', () => { S.hold = Date.now() + 10000; }, {passive: true});
    trk.addEventListener('touchend', () => { S.hold = Date.now() + 8000; }, {passive: true});
    const ppDraw = () => { if (!pp) return; pp.innerHTML = S.user ? IC.play : IC.pause; pp.setAttribute('aria-label', t(S.user ? 'tr_play' : 'tr_pause')); };
    if (pp){ pp.addEventListener('click', () => { S.user = !S.user; ppDraw(); }); ppDraw(); }
    if ('IntersectionObserver' in window){ S.io = new IntersectionObserver(es => { es.forEach(x => { S.seen = x.isIntersecting; }); }, {threshold: .6}); S.io.observe(trk); }
    else S.seen = true;
    if (!still()){
      S.tm = setInterval(() => {
        if (!s.isConnected){ trStop(); return; }
        if (S.user || S.hover || S.focus || !S.seen || document.hidden || still() || Date.now() < S.hold || tab !== 'home') return;
        go(S.i + 1, true);
      }, 5000);
    }
    mark(0);
    if (start) requestAnimationFrame(() => go(start, false));
  }
  const alAn = applyLang;
  applyLang = function(){ const r = alAn.apply(this, arguments); try { if (document.getElementById('tour')) trEnsure(true); } catch (e) {} return r; };
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { try { if (document.getElementById('tour')) trEnsure(true); } catch (e) {} });
})();
