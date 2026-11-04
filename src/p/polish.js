/* ---------- 13.61: finishing touches for a store-quality feel ----------
   1. The floating buttons (AI assistant, accessibility) fade out while the page scrolls, so they never hide the text being read,
      and come back as soon as the scrolling stops.
   2. Small links and buttons get a larger invisible touch area (at least 44 px high, as the phone makers recommend), without changing how they look. */
(function(){
  const FABS = '#ai_fab,#axb,.ai-fab';
  let quiet = 0;
  const calm = () => { document.body.classList.remove('fab-quiet'); };
  addEventListener('scroll', () => {
    if (!document.body) return;
    document.body.classList.add('fab-quiet');
    clearTimeout(quiet); quiet = setTimeout(calm, 650);
  }, {passive: true, capture: true});
  /* the end of every screen can scroll clear of the floating buttons and the bottom bar */
  const st = document.createElement('style');
  st.textContent =
    'body.fab-quiet :is(' + FABS + '){opacity:.12!important;pointer-events:none!important}'
    + ':is(' + FABS + '){transition:opacity .22s ease}'
    + '@media (prefers-reduced-motion:reduce){:is(' + FABS + '){transition:none}}'
    + '.beta-pill,.fg-x,.lg-a,.src-a{position:relative}'
    + '.beta-pill::after,.fg-x::after,.lg-a::after,.src-a::after{content:"";position:absolute;left:-6px;right:-6px;top:50%;height:44px;transform:translateY(-50%)}';
  document.head.appendChild(st);
})();
