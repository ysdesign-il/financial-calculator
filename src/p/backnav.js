/* back navigation: iPhone swipe, Android back, browser arrows (screens, settings categories and windows) */
window.__BN_ADAPTER = {
  get: () => ({t: tab, c: tab === 'settings' ? (SCAT || '') : ''}),
  key: s => s ? s.t + ':' + s.c : '',
  apply: s => { if (!s || !s.t) return; if (s.t !== tab && TABS.includes(s.t)) activate(s.t); if (s.t === 'settings' && typeof setCat === 'function') setCat(s.c || '', true); },
  overlaySel: '.cp-ov, .rec-ov'
};
/* Back and forward navigation (iPhone edge swipe, Android back button and gesture, browser arrows).
   Every screen change and every window/menu that opens becomes one step in the browser history:
   "back" closes the window that is open, or returns to the previous screen; from the first screen the browser leaves the site as usual.
   The app supplies an adapter in window.__BN_ADAPTER: get() -> a small description of the current screen,
   key(s) -> a string that identifies it, apply(s) -> go to that screen; optional: overlaySel (extra selectors for windows), close(el). */
(function(){
  if(window.__BN) return;
  var A=window.__BN_ADAPTER; if(!A||typeof A.get!=='function'||typeof A.apply!=='function') return;
  var H=window.history; if(!H||!H.pushState) return;
  try{ H.scrollRestoration='manual'; }catch(e){}
  var oPush=H.pushState.bind(H), oRep=H.replaceState.bind(H);
  var cur=null, S=[], busy=0, skipPop=0, seq=0, lastAct=0, lastY=0;
  var ids=new WeakMap(), nid=0;
  function okey(el){ if(el.id) return '#'+el.id; var k=ids.get(el); if(!k){ k='o'+(++nid); ids.set(el,k); } return k; }
  var SEL='dialog[open],[role="dialog"],[role="alertdialog"],[aria-modal="true"],[class*="modal"],[class*="overlay"],[class*="sheet"],[class*="backdrop"],[class*="drawer"],[class*="popup"],[class*="lightbox"],[class*="dlg"],[id*="modal"],[id*="overlay"],[id*="sheet"],[id*="dlg"],[id*="popup"]'+(A.overlaySel?','+A.overlaySel:'');
  function shown(el){
    if(!el.isConnected||el.closest('[hidden]')||!el.getClientRects().length) return false;
    var cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05||cs.pointerEvents==='none') return false;
    var r=el.getBoundingClientRect(), vw=innerWidth||1, vh=innerHeight||1;
    var w=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0)), h=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0));
    if(A.overlaySel&&el.matches(A.overlaySel)) return w*h>0;
    if(el.tagName==='DIALOG'&&el.open) return w*h>0;
    if(cs.position!=='fixed') return false;
    if(/^(NAV|HEADER|FOOTER)$/.test(el.tagName)||el.getAttribute('role')==='status'||el.getAttribute('aria-live')) return false;
    return w*h>=0.2*vw*vh;
  }
  function overlays(){
    var out=[], list; try{ list=document.querySelectorAll(SEL); }catch(e){ return out; }
    for(var i=0;i<list.length;i++){ var el=list[i]; if(el.closest('[data-bn-skip]')) continue; if(shown(el)&&!out.some(function(o){ return o.contains(el); })) out.push(el); }
    return out.filter(function(el){ return !out.some(function(o){ return o!==el&&o.contains(el); }); });
  }
  function snap(){
    var s; try{ s=A.get(); }catch(e){ s=null; }
    var k; try{ k=A.key?A.key(s):JSON.stringify(s); }catch(e){ k=''; }
    var ov=overlays().map(okey);
    return {s:s,k:String(k),ov:ov,f:k+'|'+ov.join(','),u:location.pathname+location.search+location.hash,y:0};
  }
  function tag(base,e){ var o=(base&&typeof base==='object'&&!Array.isArray(base))?Object.assign({},base):{}; o.__bn=e; return o; }
  /* the app's own history calls keep this step's record */
  H.replaceState=function(st,t,u){ var b=H.state&&H.state.__bn; return oRep(b&&(st==null||typeof st==='object')?tag(st,b):st,t,u); };
  H.pushState=function(st,t,u){ var r=oPush(st,t,u); setTimeout(check,30); return r; };
  function rec(e,i){ return {i:i,s:e.s,k:e.k,ov:e.ov,f:e.f,u:e.u,y:e.y}; }
  function check(){
    if(busy) return;
    var n=snap();
    if(!cur){ cur=n; cur.i=(H.state&&H.state.__bn&&H.state.__bn.i)||0; S[cur.i]=cur; oRep(tag(H.state,rec(cur,cur.i)),'',location.href); return; }
    if(n.f===cur.f){ cur.u=n.u; return; }
    /* a change the visitor did not make (a timer, a page that opened by itself): it replaces this step */
    if(Date.now()-lastAct>3000){ n.i=cur.i; n.y=cur.y; cur=n; S[n.i]=n; try{ oRep(tag(H.state,rec(n,n.i)),'',n.u); }catch(e){} return; }
    /* returning to exactly the previous step (an in-app back button, or a window closed with its X): step back instead of adding */
    var p=S[cur.i-1];
    if(p&&p.f===n.f){
      busy=1; skipPop=1;
      try{ H.back(); }catch(e){ skipPop=0; }
      setTimeout(function(){ skipPop=0; n.i=p.i; n.y=p.y; cur=n; S[n.i]=n; try{ oRep(tag(H.state,rec(n,n.i)),'',n.u); }catch(e){} busy=0; },150);
      return;
    }
    cur.y=lastY;
    try{ oRep(tag(H.state,rec(cur,cur.i)),'',cur.u); }catch(e){}
    n.i=cur.i+1; S.length=n.i; S[n.i]=n; cur=n;
    try{ oPush(tag(null,rec(n,n.i)),'',n.u); }catch(e){}
  }
  var T=[];
  function soon(){ lastAct=Date.now(); if(!busy) lastY=scrollY; T.forEach(clearTimeout); T=[80,400,1300].map(function(d){ return setTimeout(check,d); }); }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  var CLOSE='[data-close],[data-dismiss],[data-bn-close],.close,.x,.btn-close,[aria-label*="סגור"],[aria-label*="סגירה"],[aria-label*="close"],[aria-label*="Close"],[aria-label*="إغلاق"],[aria-label*="Закрыть"],[aria-label*="закрыть"],[title*="סגור"],[title*="Close"]';
  var XT=/^(✕|×|✖|x|X|סגור|סגירה|close|Close|إغلاق|Закрыть|←|→|‹|›|חזרה|Back|رجوع|Назад)$/;
  function closeBtn(el){
    var b=el.querySelector(CLOSE); if(b&&b.getClientRects().length) return b;
    var bs=el.querySelectorAll('button,[role="button"]');
    for(var i=0;i<bs.length;i++){ var t=(bs[i].textContent||'').trim(); if(XT.test(t)&&bs[i].getClientRects().length) return bs[i]; }
    return null;
  }
  async function closeOne(el){
    try{ if(A.close&&A.close(el)){ await sleep(60); if(!shown(el)) return; } }catch(e){}
    var b=closeBtn(el); if(b){ b.click(); await sleep(80); if(!shown(el)) return; }
    if(el.tagName==='DIALOG'&&el.open){ try{ el.close(); }catch(e){} await sleep(30); if(!shown(el)) return; }
    var esc={key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true,cancelable:true};
    try{ el.dispatchEvent(new KeyboardEvent('keydown',esc)); document.dispatchEvent(new KeyboardEvent('keydown',esc)); }catch(e){}
    await sleep(80); if(!shown(el)) return;
    try{ el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); }catch(e){}
    await sleep(80); if(!shown(el)) return;
    ['open','show','active','visible','on','is-open','shown'].forEach(function(c){ el.classList.remove(c); });
    if(shown(el)) el.hidden=true;
  }
  async function go(t){
    busy=1; var my=++seq;
    try{
      /* close the windows that are not part of the step we are going to (the top one first) */
      for(var g=0;g<6;g++){ var open=overlays().filter(function(el){ return t.ov.indexOf(okey(el))<0; }); if(!open.length) break; await closeOne(open[open.length-1]); }
      var s=snap();
      if(s.k!==t.k){ try{ A.apply(t.s); }catch(e){} await sleep(60); }
      if(my!==seq) return;
      var y=t.y||0; window.scrollTo(0,y); setTimeout(function(){ if(my===seq&&Math.abs(scrollY-y)>2) window.scrollTo(0,y); },250);
      await sleep(320); if(my!==seq) return;
      var n=snap(); n.i=t.i; n.y=y; cur=n; S[n.i]=n;
      try{ oRep(tag(H.state,rec(n,n.i)),'',n.k===t.k&&t.u?t.u:n.u); cur.u=location.pathname+location.search+location.hash; }catch(e){}
    } finally { if(my===seq) busy=0; }
  }
  addEventListener('popstate',function(e){
    if(skipPop){ skipPop=0; return; }
    var t=e.state&&e.state.__bn;
    if(!t){ busy=0; cur=null; check(); return; }
    S[t.i]=t;
    go(t);
  });
  ['click','change','submit'].forEach(function(ev){ document.addEventListener(ev,soon,true); });
  document.addEventListener('keyup',function(e){ if(e.key==='Enter'||e.key==='Escape'||e.key===' ') soon(); },true);
  addEventListener('hashchange',soon);
  addEventListener('pageshow',function(){ setTimeout(check,50); });
  window.__BN={check:check,soon:soon,overlays:overlays};
  setTimeout(check,0);
  if(document.readyState==='complete') setTimeout(check,700); else addEventListener('load',function(){ setTimeout(check,700); });
})();
