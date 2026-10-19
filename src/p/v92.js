/* ================= 9.0: phone plans, tile size, markets on their own page, smart split presets ================= */
const E92 = s => asEsc(String(s == null ? '' : s));

/* ---------- 1. phone plans: your own plans next to the published ones, and fresher prices from the site ---------- */
const CELL_URL = IN_CLAUDE ? SITE_BASE + 'cell.json' : 'cell.json';
fetch(CELL_URL + '?v=' + Math.floor(Date.now() / 3600e3), {credentials: 'omit', referrerPolicy: 'no-referrer'}).then(r => r.ok ? r.json() : null).then(j => {
  if (j && Array.isArray(j.plans) && j.plans.length && String(j.at || '') > CELL.at){ CELL = j; if (tab === 'cellcmp') calc(tab); clRender(); }
}).catch(() => {});
function clRender(){
  const box = $('#cl_box'); if (!box) return;
  const L = cellMineList(), act = document.activeElement, keep = act && box.contains(act) ? act.getAttribute('data-k92') : null;
  const num = (lab, u, i, k, val) => `<div class="field"><span class="lc-l" aria-hidden="true">${E92(lab)}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-cli="${i}" data-clk="${k}" data-k92="cl${i}${k}" value="${val == null ? '' : E92(val)}" aria-label="${E92(lab)}">${unitHTML(u)}</div></div>`;
  box.innerHTML = `<p class="cl-src">📅 ${E92(t('cl_srcAt', {d: CELL.at}))} ${CELL.src.map(s => `<a href="${E92(s[1])}" target="_blank" rel="noopener noreferrer">${E92(s[0])}</a>`).join(' · ')}</p>
    <div class="ins-head"><b>${E92(t('cl_mine'))}</b><span class="ins-count">${E92(t('cl_mineN', {n: L.length}))}</span></div>` +
    L.map((o, i) => `<div class="lc-card cl-card"><div class="lc-top"><span class="lc-num" aria-hidden="true">✍️</span>
        <input class="lc-name" type="text" maxlength="40" dir="auto" data-cli="${i}" data-clk="n" data-k92="cl${i}n" value="${E92(o.n || '')}" placeholder="${E92(t('cl_namePh'))}" aria-label="${E92(t('lc_name'))}">
        <button type="button" class="lc-del" data-cldel="${i}" aria-label="${E92(t('ins_del'))}">✕</button></div>
      <div class="fields">${num(t('cl_price'), 'cur', i, 'price', o.price)}${num(t('h_clGb'), '', i, 'gb', o.gb)}${num(t('cl_pp'), 'cur', i, 'pp', o.pp)}${num(t('cl_pm'), 'mo', i, 'pm', o.pm)}</div>
      <div class="cl-chk"><label><input type="checkbox" data-cli="${i}" data-clk="g5"${o.g5 ? ' checked' : ''}> 5G</label><label><input type="checkbox" data-cli="${i}" data-clk="ab"${o.ab ? ' checked' : ''}> ${E92(t('cl_ab'))}</label></div>
    </div>`).join('') +
    `<button type="button" class="lc-add" id="cl_add"><span aria-hidden="true">＋</span> ${E92(t('cl_add'))}</button><p class="fine lc-hint">${E92(t('h_cl'))}</p>`;
  if (keep){ const el = box.querySelector(`[data-k92="${keep}"]`); if (el) el.focus(); }
}
var CL_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.clk == null || !el.closest('#cl_box')) return;
  const o = cellMineList()[+el.dataset.cli]; if (!o) return; const k = el.dataset.clk;
  if (k === 'n') o.n = el.value.slice(0, 40); else if (k === 'g5' || k === 'ab') o[k] = el.checked ? 1 : 0; else o[k] = el.value === '' ? 0 : +el.value;
  clearTimeout(CL_T); CL_T = setTimeout(() => { try { saveSet(); } catch (er) {} if (tab === 'cellcmp') calc(tab); }, 250);
}, true);
document.addEventListener('change', e => { const el = e.target; if (el.type === 'checkbox' && el.dataset && el.dataset.clk && el.closest('#cl_box')) el.dispatchEvent(new Event('input', {bubbles: true})); });
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#cl_add')){ cellMineList().push({n: '', price: 0, gb: 0, pp: 0, pm: 0, g5: 0, ab: 0}); saveSet(); clRender(); calc(tab); const n = $$('#cl_box .cl-card .lc-name').pop(); if (n) n.focus(); return; }
  const d = e.target.closest('[data-cldel]'); if (d){ cellMineList().splice(+d.dataset.cldel, 1); saveSet(); clRender(); calc(tab); }
});

/* ---------- 2. smart split: a preset fills the four shares, any change makes it your own ---------- */
const SS_PRE = {'50202010': [50, 20, 20, 10], '503020': [50, 30, 15, 5], '60201010': [60, 20, 10, 10], '70101010': [70, 10, 10, 10]};
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.id) return;
  if (el.id === 'ss_plan' && SS_PRE[el.value]){ ['need', 'want', 'inv', 'safe'].forEach((k, i) => { const f = $('#ss_' + k); if (f){ f.value = SS_PRE[el.value][i]; f.dispatchEvent(new Event('input', {bubbles: true})); } }); }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el || !/^ss_(need|want|inv|safe)$/.test(el.id) || !e.isTrusted) return;
  const p = $('#ss_plan'); if (p && p.value !== 'custom'){ p.value = 'custom'; p.dispatchEvent(new Event('change', {bubbles: true})); }
});

/* ---------- 3. the size of the calculator icons on Home: a slider, and two fingers on the icons ---------- */
const TZ = [0.7, 1.8];
function tzApply(){
  const z = clamp(+SET.tileZoom || 1, TZ[0], TZ[1]), box = $('#tiles'); if (!box) return;
  box.style.setProperty('--tz', z);
  box.dataset.tz = z < 0.85 ? 's' : z > 1.35 ? 'xl' : z > 1.1 ? 'l' : 'm';
  const r = $('#tz_r'); if (r && +r.value !== z){ r.value = z; rangeFill(r); }
  const o = $('#tz_v'); if (o) o.textContent = Math.round(z * 100) + '%';
}
function tzBar(){
  const tiles = $('#tiles'); if (!tiles || $('#tz_bar')) return;
  tiles.insertAdjacentHTML('beforebegin', `<div class="tz-bar" id="tz_bar"><span aria-hidden="true">🔍</span><button type="button" class="tz-b" data-tz="-" aria-label="${E92(t('tz_less'))}">−</button>
    <input type="range" id="tz_r" min="${TZ[0]}" max="${TZ[1]}" step="0.05" value="${clamp(+SET.tileZoom || 1, TZ[0], TZ[1])}" aria-label="${E92(t('tz_label'))}">
    <button type="button" class="tz-b" data-tz="+" aria-label="${E92(t('tz_more'))}">+</button><output id="tz_v"></output><button type="button" class="fg-x" data-tz="0">${E92(t('tz_reset'))}</button></div>`);
  tzApply();
}
const tzSet = z => { SET.tileZoom = Math.round(clamp(z, TZ[0], TZ[1]) * 100) / 100; tzApply(); clearTimeout(tzSet.t); tzSet.t = setTimeout(() => { try { saveSet(); } catch (e) {} }, 300); };
document.addEventListener('input', e => { if (e.target && e.target.id === 'tz_r') tzSet(+e.target.value); });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-tz]'); if (!b) return; const z = +SET.tileZoom || 1; tzSet(b.dataset.tz === '0' ? 1 : z + (b.dataset.tz === '+' ? 0.1 : -0.1)); });
var TZP = null;
document.addEventListener('touchstart', e => { if (e.touches.length === 2 && e.target.closest && e.target.closest('#tiles')){ const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); TZP = {d, z: +SET.tileZoom || 1}; } }, {passive: true});
document.addEventListener('touchmove', e => { if (TZP && e.touches.length === 2){ e.preventDefault(); const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); tzSet(TZP.z * d / TZP.d); } }, {passive: false});
document.addEventListener('touchend', e => { if (e.touches.length < 2) TZP = null; }, {passive: true});
const _rt92 = renderTiles;
renderTiles = function(){ const r = _rt92.apply(this, arguments); try { tzBar(); tzApply(); } catch (e) {} return r; };

/* ---------- 4. the markets on a page of their own ---------- */
if (!EX_SKIP.includes('markets')) EX_SKIP.push('markets');
if (typeof FG_SKIP !== 'undefined' && !FG_SKIP.includes('markets')) FG_SKIP.push('markets');
if (typeof DASH_SKIP !== 'undefined' && !DASH_SKIP.includes('markets')) DASH_SKIP.push('markets');
const _svK92 = svKind;
svKind = function(id){ return id === 'markets' ? '' : _svK92.apply(this, arguments); };
/* 9.1: the market data always lives on its own page, never on Home */
if (Array.isArray(SET.hidden) && SET.hidden.includes('markets')){ SET.hidden = SET.hidden.filter(x => x !== 'markets'); try { saveSet(); } catch (e) {} }
const mkOn = () => true;
const MK_PARTS = ['.mk-head', '#fx_st', '#hm', '#hm_n', '#hmx'];
function mkSync(){
  const home = $('#panel-home'), root = $('#mkp_root'); if (!home || !root) return;
  let anchor = $('#mk_anchor');
  if (!anchor){ const h = home.querySelector('.mk-head'); if (!h) return; anchor = document.createElement('div'); anchor.id = 'mk_anchor'; h.parentNode.insertBefore(anchor, h); }
  const els = MK_PARTS.map(s => document.querySelector(s)).filter(Boolean);
  if (mkOn()){ if (!root.querySelector('#hm')){ root.innerHTML = `<p class="home-sub mkp-sub">${E92(t('mkp_sub'))}</p>`; els.forEach(e => root.appendChild(e)); } }
  else if (!home.querySelector('#hm')){ const ref = anchor.nextSibling; els.forEach(e => anchor.parentNode.insertBefore(e, ref)); const sub = root.querySelector('.mkp-sub'); if (sub) sub.remove(); }
  const d = $('#dsb'); if (d && d.parentNode !== home && anchor.parentNode) anchor.parentNode.insertBefore(d, anchor);
}
function mkToggle(){
  if (!Array.isArray(SET.hidden)) SET.hidden = [];
  if (mkOn()) SET.hidden = SET.hidden.concat('markets'); else SET.hidden = SET.hidden.filter(x => x !== 'markets');
  saveSet(); mkSync();
  try { renderNav(); $$('#nav [data-i]').forEach(e => { e.textContent = t(e.dataset.i); }); } catch (e) {}
  try { renderTiles(); } catch (e) {}
  toast(t(mkOn() ? 'mkp_onT' : 'mkp_offT'));
  activate(mkOn() ? 'markets' : 'home');
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#mkp_tog')){ e.preventDefault(); mkToggle(); } });
const _act92 = activate;
activate = function(id){
  if (id === 'markets' && !mkOn()) id = 'home';
  const r = _act92.apply(this, [id].concat([].slice.call(arguments, 1)));
  if (id === 'markets' || id === 'home'){ try { mkSync(); renderMarket(); } catch (e) {} }
  return r;
};
setInterval(() => { if (tab === 'markets' && !document.hidden) try { renderMarket(); } catch (e) {} }, 20000);
const _al92 = applyLang;
applyLang = function(){ const r = _al92.apply(this, arguments); try { const p = $('.mkp-sub'); if (p) p.textContent = t('mkp_sub'); mkSync(); clRender(); const bar = $('#tz_bar'); if (bar){ bar.remove(); tzBar(); } } catch (e) {} return r; };

const _dsR92 = dsRender;
dsRender = function(){ const r = _dsR92.apply(this, arguments); try { const d = $('#dsb'), an = $('#mk_anchor'), home = $('#panel-home'); if (d && an && home && !home.contains(d)) an.parentNode.insertBefore(d, an); } catch (e) {} return r; };
/* ---------- start ---------- */
const _calc92 = calc;
calc = function(id){ if (id === 'cellcmp' && $('#cl_box') && !$('#cl_box').children.length) clRender(); return _calc92.apply(this, arguments); };
try { clRender(); tzBar(); mkSync(); if (tab === 'markets'){ if (mkOn()) renderMarket(); else activate('home'); } } catch (e) {}

/* ---------- 5. phones: type the price you found in Israel, and it replaces the converted launch price ---------- */
function phRender(){
  const box = $('#ph_box'); if (!box) return;
  const P = phMine(), act = document.activeElement, keep = act && box.contains(act) ? act.dataset.php : null;
  box.innerHTML = `<details class="adv ph-own"${Object.keys(P).some(k => +P[k] > 0) ? ' open' : ''}><summary>✍️ ${E92(t('ph_ownT'))}</summary><p class="fine">${E92(t('ph_ownN'))}</p>
    <div class="ph-list">${PHONES.list.map(p => { const x = phIls(p); return `<label class="ph-it"><span>${E92(p.n)}</span><span class="control"><input type="number" inputmode="decimal" step="any" data-php="${p.id}" value="${+P[p.id] > 0 ? +P[p.id] : ''}" placeholder="${isFinite(x.v) && !x.own ? '≈' + Math.round(x.v) : ''}" aria-label="${E92(t('ph_ownL', {n: p.n}))}">${unitHTML('cur')}</span></label>`; }).join('')}</div></details>`;
  if (keep){ const el = box.querySelector(`[data-php="${keep}"]`); if (el) el.focus(); }
}
var PH_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || !el.dataset.php) return;
  const P = phMine(); if (+el.value > 0) P[el.dataset.php] = +el.value; else delete P[el.dataset.php];
  clearTimeout(PH_T); PH_T = setTimeout(() => { try { saveSet(); } catch (er) {} if (tab === 'phonecmp') calc(tab); }, 300);
}, true);
const _calc92b = calc;
calc = function(id){ if (id === 'phonecmp' && $('#ph_box') && !$('#ph_box').children.length) phRender(); return _calc92b.apply(this, arguments); };
const _al92b = applyLang;
applyLang = function(){ const r = _al92b.apply(this, arguments); try { phRender(); } catch (e) {} return r; };
try { phRender(); } catch (e) {}
/* the markets page has no calculator: anything that recalculates "the current screen" just refreshes the board */
const _calc92m = calc;
calc = function(id){ if (id === 'markets'){ try { renderMarket(); } catch (e) {} return; } return _calc92m.apply(this, arguments); };
