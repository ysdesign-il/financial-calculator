/* ---------- 13.71: the small calculators (about 45 of them, one engine) get the same clarity –
   the result first (above the form, with two key numbers), short choices (2–3 options) as buttons,
   and a long breakdown folded under "full breakdown". Tools that draw their own screen (render) are left as they are. ---------- */
const MU2_OPEN = {};
(function(){
  const st = document.createElement('style');
  st.textContent = `
.mi-top{display:flex;flex-direction:column;gap:10px;margin:4px 0 16px}
.mi-top:empty{display:none}
.mi-top .mi-hero{margin:0}
.mi-top .mi-led{margin:0}
.mi-top .mi-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mi-top .mi-tiles.one{grid-template-columns:1fr}
.mi-top .mi-tile{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
.mi-top .mi-tile span{font-size:.82rem;color:var(--ink-2);line-height:1.35}
.mi-top .mi-tile b{font-size:1.1rem;font-variant-numeric:tabular-nums;color:var(--ink);overflow-wrap:anywhere}
.mi-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.mi-seg button{flex:1 1 0;min-width:72px;min-height:44px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:var(--field,transparent);color:var(--ink);font:inherit;font-weight:600;font-size:.9rem;cursor:pointer}
.mi-seg button[aria-checked="true"]{background:var(--gold,#9A6A06);border-color:var(--gold,#9A6A06);color:#fff}
.mi-f.mi-has-seg > select{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;opacity:0}
.mi-f.mi-has-seg{position:relative}
.mi-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:6px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
.mi-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
.mi-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
.mi-out.mu2-c .mi-led{display:none!important}
@media (max-width:380px){.mi-top .mi-tiles{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
/* short choices as buttons: the select stays (it is what the engine reads), the buttons set it */
function mu2Segs(id){
  const def = MINI[id], root = document.getElementById('hr_' + id); if (!def || !root || def.render) return;
  (def.fields || []).forEach(f => {
    if (f.type !== 'sel' || !Array.isArray(f.opts) || f.opts.length < 2 || f.opts.length > 3) return;
    if (f.opts.some(o => String(t(o[1])).length > 16)) return;
    const lab = root.querySelector(`.mi-f[data-mik="${CSS.escape(f.k)}"]`), sel = lab && lab.querySelector('select'); if (!sel || lab.querySelector('.mi-seg')) return;
    lab.classList.add('mi-has-seg');
    sel.insertAdjacentHTML('afterend', `<span class="mi-seg" role="radiogroup">${f.opts.map(([v, k]) => `<button type="button" role="radio" data-mus="${miE(f.k)}" data-v="${miE(v)}">${miE(t(k))}</button>`).join('')}</span>`);
  });
  mu2SegSync(id);
}
function mu2SegSync(id){
  const root = document.getElementById('hr_' + id); if (!root) return;
  root.querySelectorAll('[data-mus]').forEach(b => { const s = b.closest('.mi-f').querySelector('select'); const on = !!s && String(s.value) === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-mus]'); if (!b) return;
  e.preventDefault();                                   // the button sits inside a <label>: don't let it re-focus the select
  const lab = b.closest('.mi-f'), s = lab && lab.querySelector('select'); if (!s || s.value === b.dataset.v) return;
  s.value = b.dataset.v; s.dispatchEvent(new Event('change', {bubbles: true}));
  const host = b.closest('[id^="hr_"]'); if (host) mu2SegSync(host.id.slice(3));
});
/* the result first: the big result and two key numbers above the form; a long breakdown folds */
function mu2Top(id){
  const root = document.getElementById('hr_' + id), box = document.getElementById('mio_' + id); if (!root || !box) return;
  const card = root.querySelector(':scope > .mi-card'); if (!card) return;
  let top = root.querySelector(':scope > .mi-top');
  if (!top){ top = document.createElement('div'); top.className = 'mi-top'; top.setAttribute('aria-live', 'polite'); card.before(top); }
  const hero = box.querySelector(':scope > .mi-hero') || top.querySelector(':scope > .mi-hero'), warn = box.querySelector(':scope > .mi-warn');
  const keepLed = box.querySelector(':scope > .mi-led') || top.querySelector(':scope > .mi-led');
  top.innerHTML = '';
  if (hero) top.appendChild(hero);
  if (warn) top.appendChild(warn);
  const o = MINI_LAST[id] || {}, rows = Array.isArray(o.rows) ? o.rows : [];
  box.classList.remove('mu2-c');
  if (rows.length && rows.length <= 4){
    /* a short result: the whole list goes up, right under the big number */
    if (keepLed) top.appendChild(keepLed);
    return;
  }
  const hv = o.hero ? String(o.hero.v).trim() : '';
  const ok = rows.filter(r => r && r[1] != null && String(r[1]).trim() && String(r[1]).trim() !== hv && String(r[1]).length <= 26);
  let pick = ok.filter(r => r[2] && /key/.test(r[2])).slice(0, 2);
  if (pick.length < 2) pick = pick.concat(ok.filter(r => !pick.includes(r)).slice(0, 2 - pick.length));
  if (pick.length) top.insertAdjacentHTML('beforeend', `<div class="mi-tiles${pick.length === 1 ? ' one' : ''}">${pick.map(r => `<div class="mi-tile"><span>${miE(r[0])}</span><b class="num">${miE(r[1])}</b></div>`).join('')}</div>`);
  /* a long breakdown folds under "full breakdown" */
  const led = box.querySelector(':scope > .mi-led');
  if (led && !box.querySelector(':scope > [data-mut2]')){
    led.insertAdjacentHTML('beforebegin', `<button type="button" class="mi-tog" data-mut2="${miE(id)}" aria-expanded="${MU2_OPEN[id] ? 'true' : 'false'}"><span>${miE(t('ax_hLed'))}</span></button>`);
  }
  if (led) box.classList.toggle('mu2-c', !MU2_OPEN[id]);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-mut2]'); if (!b) return;
  const id = b.dataset.mut2; MU2_OPEN[id] = !MU2_OPEN[id];
  const box = document.getElementById('mio_' + id); if (box) box.classList.toggle('mu2-c', !MU2_OPEN[id]);
  b.setAttribute('aria-expanded', String(!!MU2_OPEN[id]));
});
{ const miOutU = miOut; miOut = function(id){ const r = miOutU.apply(this, arguments); try { mu2Top(id); mu2SegSync(id); } catch (e) {} return r; }; }
{ const miRenderU = miRender; miRender = function(id){ const r = miRenderU.apply(this, arguments); try { mu2Segs(id); mu2Top(id); } catch (e) {} return r; }; }
