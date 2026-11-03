/* ---------- 13.66: a focused home screen – "continue where you left off" (the last calculator you used, with its result)
   and your most used calculators one tap away, at the top. Nothing is removed from the home screen; the save bar, which
   belongs to the calculators, is not shown on it. Everything stays on this phone (the app's own storage). ---------- */
Object.assign(T, {
  hm_cont:['המשך מאיפה שעצרת','تابع من حيث توقفت','Continue where you left off'],
  hm_ago:['לפני {x}','قبل {x}','{x} ago'],
  hm_now:['עכשיו','الآن','just now'],
  hm_min:['{n} דק׳','{n} د','{n} min'],
  hm_hr:['{n} שע׳','{n} س','{n} h'],
  hm_day:['{n} ימים','{n} أيام','{n} days'],
  hm_mine:['המחשבונים שלך','حاسباتك','Your calculators'],
  hm_open:['לפתיחה','للفتح','Open']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
.panel-home > .svbar{display:none!important}
#hm-top{display:flex;flex-direction:column;gap:14px;margin:18px 0 6px}
.hm-cont{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:14px;width:100%;padding:18px 20px;border-radius:20px;cursor:pointer;
  background:linear-gradient(160deg,color-mix(in srgb,var(--surface) 90%,var(--gold-ui) 10%),var(--surface));border:1px solid color-mix(in srgb,var(--gold-ui) 35%,var(--line));color:var(--ink)}
.hm-cont:focus-visible{outline:2px solid var(--focus);outline-offset:3px}
.hm-cont .hm-ic{flex:0 0 auto;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--gold-ui) 16%,transparent);color:var(--gold-ui)}
.hm-cont .hm-ic svg{width:24px;height:24px}
.hm-cont .hm-bd{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:start}
.hm-cont .hm-v{unicode-bidi:plaintext}
.hm-cont small{font-size:.78rem;color:var(--ink-2);letter-spacing:.02em}
.hm-cont b{font-size:1.05rem;font-weight:700}
.hm-cont .hm-v{font-size:1.4rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.2}
.hm-cont .hm-l{font-size:.84rem;color:var(--ink-2)}
.hm-cont .hm-go{flex:0 0 auto;color:var(--gold-ui);font-size:1.3rem}
[dir="ltr"] .hm-cont .hm-go{transform:scaleX(-1)}
.hm-mine h3{margin:0 0 8px;font-size:.92rem;color:var(--ink-2);font-weight:600}
.hm-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.hm-row .tile{min-height:84px;font-size:.8rem}
@media (max-width:360px){.hm-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
:root:not([data-contrast="high"]) .hm-cont{box-shadow:var(--pm-soft,none)}
@media (hover:hover){.hm-cont:hover{transform:translateY(-2px);border-color:var(--gold-ui)}}
.hm-cont{transition:transform .3s cubic-bezier(.22,.61,.36,1),border-color .3s,box-shadow .3s}
.hm-cont:active{transform:scale(.98)}`;
  document.head.appendChild(st);
})();
const hmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const HM_K = 'fin-pm-home';
function hmData(){ try { const d = JSON.parse(LS.getItem(HM_K) || 'null'); return d && typeof d === 'object' ? {use: d.use || {}, last: d.last || null} : {use: {}, last: null}; } catch (e) { return {use: {}, last: null}; } }
function hmSave(d){ try { LS.setItem(HM_K, JSON.stringify(d)); } catch (e) {} }
const hmTile = id => document.querySelector(`#tiles .tile[data-go="${CSS.escape(id)}"]`);
/* count the calculators that are opened, and keep the last result shown */
{ const hmAct = activate; activate = function(id){
  const r = hmAct.apply(this, arguments);
  try { if (id && id !== 'home' && hmTile(id)){ const d = hmData(); d.use[id] = (d.use[id] || 0) + 1; hmSave(d); } } catch (e) {}
  try { if (id === 'home') hmRender(); } catch (e) {}
  return r;
}; }
{ const hmShow = show; show = function(id, res){
  hmShow.apply(this, arguments);
  try {
    if (id && id !== 'home' && res && res.hero && res.hero.value && hmTile(id)){
      const v = strip(res.hero.value), l = strip(res.hero.label || '');
      /* with saving switched off ("none") the result is not kept */
      if (v && v !== '—' && !(typeof SV === 'object' && SV.mode === 'none')){ const d = hmData(); d.last = {id, v, l, at: Date.now()}; hmSave(d); }
    }
  } catch (e) {}
}; }
function hmAgo(ts){
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t('hm_now');
  const x = m < 60 ? t('hm_min', {n: m}) : m < 1440 ? t('hm_hr', {n: Math.round(m / 60)}) : t('hm_day', {n: Math.round(m / 1440)});
  return t('hm_ago', {x});
}
function hmRender(){
  const pn = document.querySelector('.panel-home'); if (!pn) return;
  const sub = pn.querySelector(':scope > .home-sub') || pn.querySelector(':scope > .home-hello'); if (!sub) return;
  let box = document.getElementById('hm-top');
  if (!box){ box = document.createElement('div'); box.id = 'hm-top'; sub.after(box); }
  else if (box.previousElementSibling !== sub) sub.after(box);
  const d = hmData(), last = d.last && hmTile(d.last.id) ? d.last : null;
  let h = '';
  if (last){
    const tl = hmTile(last.id), ic = tl.querySelector('svg'), name = (tl.querySelector('span') || tl).textContent.trim();
    h += `<button type="button" class="hm-cont" data-go="${hmE(last.id)}" aria-label="${hmE(t('hm_cont') + ': ' + name + ', ' + last.l + ' ' + last.v)}">`
      + `<span class="hm-ic" aria-hidden="true">${ic ? ic.outerHTML : ''}</span>`
      + `<span class="hm-bd"><small>${hmE(t('hm_cont'))} · ${hmE(hmAgo(last.at))}</small><b>${hmE(name)}</b><span class="hm-l">${hmE(last.l)}</span><span class="hm-v num">${hmE(last.v)}</span></span>`
      + `<span class="hm-go" aria-hidden="true">‹</span></button>`;
  }
  const top = Object.entries(d.use).filter(([id]) => hmTile(id)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
  if (top.length >= 2){
    h += `<section class="hm-mine" aria-label="${hmE(t('hm_mine'))}"><h3>${hmE(t('hm_mine'))}</h3><div class="hm-row"></div></section>`;
  }
  box.innerHTML = h; box.hidden = !h;
  const row = box.querySelector('.hm-row');
  if (row) top.forEach(id => { const c = hmTile(id).cloneNode(true); c.removeAttribute('id'); row.appendChild(c); });
}
{ const hmAL = applyLang; applyLang = function(){ const r = hmAL.apply(this, arguments); try { hmRender(); } catch (e) {} return r; }; }
try { hmRender(); } catch (e) {}
