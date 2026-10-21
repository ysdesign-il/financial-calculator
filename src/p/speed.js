/* 13.25: speed – work that only fills hidden screens waits until that screen opens */
let PF_FORCE = false;
const PF_DIRTY = new Set();
const pfHidden = id => { const p = document.getElementById('panel-' + id); return !!p && p.hidden; };
function pfLazy(name, panel, fn, keep){
  return function(){
    if (!PF_FORCE && pfHidden(panel)){ PF_DIRTY.add(name); if (keep) try { keep(); } catch (e) {} return; }
    return fn.apply(this, arguments);
  };
}
/* settings: the form, the country list, the sections and the skins are drawn when Settings opens; the home tiles and the bottom bar still update right away */
syncSettingsUI = pfLazy('sync', 'settings', syncSettingsUI, () => { renderTiles(); renderBottom(); if (typeof renderStamp === 'function') renderStamp(); });
ctyUi = pfLazy('cty', 'settings', ctyUi);
accBuild = pfLazy('acc', 'settings', accBuild);
skRender = pfLazy('sk', 'settings', skRender);
function pfFlush(id){
  if (id !== 'settings' || !PF_DIRTY.size) return;
  const run = [...PF_DIRTY]; PF_DIRTY.clear(); PF_FORCE = true;
  try {
    if (run.includes('sync')) syncSettingsUI();
    if (run.includes('cty')) ctyUi();
    if (run.includes('sk')) skRender();
    if (run.includes('acc')) accBuild();
  } catch (e) {} finally { PF_FORCE = false; }
}
{ const actPf = activate; activate = function(id){ const r = actPf.apply(this, arguments); try { pfFlush(id); if (typeof svUi === 'function') svUi(); } catch (e) {} return r; }; }
/* ---- 13.32: build a calculator's screen on first use ---- */
const PZ_HOOKS = [];                         // (panel, id) → run after a screen is built, for modules that decorate screens
const pzLeft = () => PZ.built.size < PZ.ids.size;
function pzVals(){ try { return SET.remember === '1' ? JSON.parse(localStorage.getItem('fin-vals') || '{}') || {} : {}; } catch (e) { return {}; } }
function pzBuild(id, batch){
  if (!PZ.ids.has(id) || PZ.built.has(id)) return false;
  const p = document.getElementById('panel-' + id); if (!p) return false;
  PZ.built.add(id);
  const tpl = document.createElement('template'); tpl.innerHTML = panelHTML(id).trim();
  const src = tpl.content.firstElementChild; if (!src) return false;
  [...src.attributes].forEach(a => { if (a.name !== 'hidden' && a.name !== 'id') p.setAttribute(a.name, a.value); });
  p.removeAttribute('data-pz');
  p.replaceChildren(...src.childNodes);
  try { pzHydrate(p, id, batch); } catch (e) {}
  return true;
}
function pzHydrate(p, id, batch){
  /* the language */
  p.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
  p.querySelectorAll('[data-ia]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.ia)); });
  /* defaults from Settings, for this screen only */
  const keep = []; document.querySelectorAll('#panels input[id],#panels select[id]').forEach(e => { if (!p.contains(e)) keep.push([e, e.value]); });
  try { applyDefaults(); } catch (e) {}
  keep.forEach(([e, v]) => { if (e.value !== v) e.value = v; });
  /* what was remembered for this screen */
  const all = pzVals(), mine = {}; p.querySelectorAll('input[id],select[id]').forEach(e => { if (all[e.id] != null) mine[e.id] = all[e.id]; });
  try { setVals(mine); } catch (e) {}
  if (p.querySelector('select:empty')) try { fillCurSelects(); } catch (e) {}
  /* screens with a box drawn by their own module */
  const R = {cl_box: () => clRender(), ins_box: () => insRender(), jo_box: () => joRender(), lc_box: () => lcRender(), lk_box: () => lkRender(), mc_box: () => mcRender(), pc_box: () => pcRender(),
    ph_box: () => phRender(), ph_sbox: () => { phsRender(); pmRender(); }, se_box: () => seRender(), x_from: () => { cpInit(); cpSync(); }, sp_box: () => spRender(), sp_fx: () => spFxRender(), up_box: () => upRender()};
  Object.keys(R).forEach(k => { if (p.querySelector('#' + k)) try { R[k](); } catch (e) {} });
  [() => numScan(p), () => limScan(p), () => lxDecorate(p), () => renderScn(id)].forEach(f => { try { f(); } catch (e) {} });
  if (!batch) pzGlobal();
  PZ_HOOKS.forEach(f => { try { f(p, id); } catch (e) {} });
}
/* decorations that scan every screen at once: run once after a batch */
function pzGlobal(){ [() => exDecorate(), () => exLabels()].forEach(f => { try { f(); } catch (e) {} }); }
function pzAll(){ let n = 0; PZ.ids.forEach(id => { if (pzBuild(id, true)) n++; }); if (n) pzGlobal(); }
/* anything that works on a screen builds it first (the innermost layer; speed_end.js adds the outermost one) */
{ const c0 = calc; calc = function(id){ if (id && !PZ.built.has(id)) pzBuild(id); return c0.apply(this, arguments); }; }
{ const a0 = activate; activate = function(id){ if (id && !PZ.built.has(id)) pzBuild(id); return a0.apply(this, arguments); }; }
{ const r0 = resetPanel; resetPanel = function(id){ pzBuild(id); return r0.apply(this, arguments); }; }
{ const v0 = panelVals; panelVals = function(id){ pzBuild(id); return v0.apply(this, arguments); }; }
/* remembered values of screens that aren't built yet are kept when saving */
{ const s0 = saveVals; saveVals = function(){
  if (!pzLeft()) return s0.apply(this, arguments);
  const prev = pzVals(); const r = s0.apply(this, arguments);
  try { if (SET.remember === '1'){ const cur = pzVals(); let ch = false; Object.keys(prev).forEach(k => { if (k !== '__touched' && !(k in cur) && !document.getElementById(k)){ cur[k] = prev[k]; ch = true; } }); if (ch) localStorage.setItem('fin-vals', JSON.stringify(cur)); } } catch (e) {}
  return r;
}; }
/* ---- 13.32: charts no longer force the whole page to be measured on every screen change: the width is measured once per window size ---- */
let PZ_CW = {k: '', w: 0};
function pzChartW(wrap){ const k = window.innerWidth + 'x' + (document.documentElement.style.fontSize || ''); if (PZ_CW.k !== k || !PZ_CW.w){ const w = Math.floor(wrap.clientWidth); if (w > 0) PZ_CW = {k, w}; return w || 600; } return PZ_CW.w; }
drawChart = function(el){
  const s = el._spec; if (!s) return;
  const wrap = $('.svgwrap', el);
  const W = Math.max(260, pzChartW(wrap)), H = 240;
  const pl = 44, pr = 6, pt = 8, pb = 26, ih = H - pt - pb;
  const n = s.labels.length;
  const totals = s.labels.map((_, i) => s.layers.reduce((a, l) => a + (isFinite(l.values[i]) ? Math.max(0, l.values[i] || 0) : 0), 0));
  const top = Math.max(1e-9, ...totals.filter(isFinite)), nm = niceMax(top), max = isFinite(nm) ? nm : top;
  const bw = (W - pl - pr) / n, gap = Math.min(5, bw * 0.2);
  const step = Math.ceil(n / Math.max(1, Math.floor((W - pl) / 36)));
  let g = '';
  for (let k = 0; k <= 4; k++){
    const y = pt + ih * (1 - k/4);
    g += `<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text class="ax" x="${pl-6}" y="${y+4}" text-anchor="end">${compact(max*k/4)}</text>`;
  }
  for (let i = 0; i < n; i++){
    let acc = 0;
    s.layers.forEach(l => {
      const val = isFinite(l.values[i]) ? Math.max(0, l.values[i] || 0) : 0;
      const h = val / max * ih;
      if (h > 0){
        const y = pt + ih - (acc / max * ih) - h;
        g += `<rect class="${l.cls}" rx="2" x="${(pl + i*bw + gap/2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw-gap).toFixed(1)}" height="${h.toFixed(1)}"><title>${s.unit ? s.unit + ' ' : ''}${s.labels[i]}: ${l.name} – ${s.fmt(val)}</title></rect>`;
      }
      acc += val;
    });
    if (i % step === 0){
      g += `<text class="ax" x="${(pl + i*bw + bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${s.labels[i]}</text>`;
    }
  }
  wrap.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${s.title}" style="direction:ltr">${g}</svg>`;
};
