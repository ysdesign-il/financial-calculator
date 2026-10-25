/* 13.25: speed – when fresh rates, indexes and figures arrive one after another, the market board on Home is drawn once for the batch instead of once per update.
   Installed last, so every earlier layer of renderMarket still runs, together, a moment later. The first drawing at start-up has already happened by now. */
{ const rmNow = renderMarket; let rmT = 0;
  renderMarket = function(){ clearTimeout(rmT); rmT = setTimeout(() => { rmT = 0; try { rmNow(); } catch (e) {} }, 120); };
  const actRm = activate; activate = function(id){ if (rmT && (id === 'home' || id === 'markets')){ clearTimeout(rmT); rmT = 0; try { rmNow(); } catch (e) {} } return actRm.apply(this, arguments); };
}
/* 13.32: the outermost layer – screens are built before any other layer looks at them */
{ const cE = calc; calc = function(id){ if (id && PZ.ids.has(id) && !PZ.built.has(id)) pzBuild(id); return cE.apply(this, arguments); }; }
{ const aE = activate; activate = function(id){ if (id && PZ.ids.has(id) && !PZ.built.has(id)) pzBuild(id); return aE.apply(this, arguments); }; }
{ const f0 = aiFields; aiFields = function(id){ pzBuild(id); return f0.apply(this, arguments); }; }
{ const f1 = exFields; exFields = function(id){ pzBuild(id); return f1.apply(this, arguments); }; }
{ const f2 = svClearScreen; svClearScreen = function(id){ pzBuild(id); return f2.apply(this, arguments); }; }
/* search, export and printing look at every screen: build the rest first */
{ const g0 = gsBuild; gsBuild = function(){ pzAll(); return g0.apply(this, arguments); }; }
/* the rest are built quietly, one at a time, when the phone is idle */
(function pzIdle(){
  const ric = window.requestIdleCallback || (cb => setTimeout(() => cb({timeRemaining: () => 12, didTimeout: false}), 60));
  /* 13.51: gentler – start later, one screen per truly idle moment, never forced while the phone is busy, and paused while the app is in the background,
     so opening the app and the first taps stay smooth on slower phones */
  let last = Date.now(); ['pointerdown', 'keydown', 'scroll', 'input'].forEach(ev => addEventListener(ev, () => { last = Date.now(); }, {passive: true, capture: true}));
  const step = dl => { const left = [...PZ.ids].filter(id => !PZ.built.has(id)); if (!left.length) return;
    if (!document.hidden && Date.now() - last > 1500 && dl.timeRemaining() >= 10){ pzBuild(left.shift(), true); pzGlobal(); }
    setTimeout(() => ric(step), 400); };
  setTimeout(() => ric(step), 8000);
})();
