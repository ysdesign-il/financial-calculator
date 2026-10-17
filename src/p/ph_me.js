/* ================= phones: "my phone" — what this browser can tell about the device it runs on =================
   The phone model is never read (no model hints are requested and the user agent's model part is ignored).
   Everything is read on the device and nothing is sent anywhere. Browsers hide or round some figures (memory is capped at 8GB, storage is an estimate). */
var PHME = {data: null, busy: false};
const pmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function pmHz(){
  return new Promise(res => {
    let n = 0, t0 = 0;
    const step = ts => { if (!t0) t0 = ts; n++; if (ts - t0 < 1000) requestAnimationFrame(step); else { const hz = n * 1000 / (ts - t0); res([60, 90, 120, 144, 165].reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a, 60)); } };
    requestAnimationFrame(step); setTimeout(() => res(0), 2500);
  });
}
const PM_TIERS = [32, 64, 128, 256, 512, 1024, 2048];
async function pmRead(){
  const nav = navigator, ua = nav.userAgent || '', o = {};
  /* model and system */
  try { if (nav.userAgentData && nav.userAgentData.getHighEntropyValues){ const h = await nav.userAgentData.getHighEntropyValues(['platform', 'platformVersion', 'fullVersionList']); o.os = h.platform + (h.platformVersion ? ' ' + (h.platform === 'Android' ? h.platformVersion.split('.')[0] : h.platformVersion) : ''); const br = (h.fullVersionList || []).find(b => !/Not.?A.?Brand|Chromium/i.test(b.brand)); if (br) o.browser = br.brand + ' ' + String(br.version).split('.')[0]; } } catch (e) {}
  if (!o.os){
    let m;
    if ((m = /iPhone OS (\d+)[_.](\d+)/.exec(ua))){ o.os = 'iOS ' + m[1] + '.' + m[2]; }
    else if ((m = /iPad.*OS (\d+)[_.](\d+)/.exec(ua))){ o.os = 'iPadOS ' + m[1] + '.' + m[2]; }
    else if ((m = /Android (\d+(?:\.\d+)?)/.exec(ua))){ o.os = 'Android ' + m[1]; }
    else if (/Mac OS X/.test(ua)) o.os = 'macOS'; else if (/Windows/.test(ua)) o.os = 'Windows'; else if (/Linux/.test(ua)) o.os = 'Linux';
  }
  if (!o.browser){ const m = /(Edg|SamsungBrowser|Firefox|CriOS|FxiOS|Chrome|Version)\/(\d+)/.exec(ua); if (m) o.browser = ({Edg: 'Edge', CriOS: 'Chrome', FxiOS: 'Firefox', Version: /Safari/.test(ua) ? 'Safari' : 'Browser'}[m[1]] || m[1]) + ' ' + m[2]; }
  o.mobile = /Mobi|Android|iPhone/i.test(ua);
  /* memory, processor, screen */
  o.ram = +nav.deviceMemory || 0; o.cores = +nav.hardwareConcurrency || 0;
  const dpr = window.devicePixelRatio || 1, sw = screen.width, sh = screen.height;
  o.res = Math.round(Math.min(sw, sh) * dpr) + '×' + Math.round(Math.max(sw, sh) * dpr); o.dpr = Math.round(dpr * 100) / 100; o.css = Math.min(sw, sh) + '×' + Math.max(sw, sh);
  try { o.hdr = matchMedia('(dynamic-range: high)').matches; o.p3 = matchMedia('(color-gamut: p3)').matches; } catch (e) {}
  o.touch = nav.maxTouchPoints || 0;
  /* storage: browsers tell a site its quota; Chrome gives a site up to ~60% of the disk, so this is only a rough guess of the disk size */
  try { if (nav.storage && nav.storage.estimate){ const s = await nav.storage.estimate(); o.quota = s.quota || 0; o.used = s.usage || 0;
    if (o.quota > 5e9 && /Chrome|Android|Edg|SamsungBrowser/.test(ua) && !/iPhone|iPad/.test(ua)){ const disk = o.quota / 0.6 / 1e9; o.disk = PM_TIERS.find(x => x >= disk * 0.93) || 0; } } } catch (e) {}
  /* battery (Android Chrome only) */
  try { if (nav.getBattery){ const b = await nav.getBattery(); o.bat = Math.round(b.level * 100); o.charging = b.charging; } } catch (e) {}
  /* network */
  try { const c = nav.connection; if (c){ o.net = (c.type && c.type !== 'unknown' ? c.type + ' · ' : '') + (c.effectiveType || '').toUpperCase(); o.down = c.downlink || 0; } } catch (e) {}
  o.online = nav.onLine; o.lang = nav.language || ''; try { o.tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
  try { o.dark = matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
  o.hz = await pmHz();
  return o;
}
function pmRows(o){
  const na = t('pm_na'), R = [];
  R.push(['pm_os', o.os || na]);
  R.push(['pm_browser', o.browser || na]);
  R.push(['pm_ram', o.ram ? (o.ram >= 8 ? t('pm_ram8') : t('pm_ramX', {n: o.ram})) : t('pm_hiddenBr')]);
  R.push(['pm_storage', o.disk ? t('pm_diskX', {n: o.disk >= 1024 ? o.disk / 1024 + 'TB' : o.disk + 'GB'}) : t('pm_hiddenBr')]);
  if (o.quota) R.push(['pm_quota', (o.quota / 1e9).toFixed(1) + 'GB' + (o.used ? ' · ' + t('pm_usedX', {n: (o.used / 1e6).toFixed(1) + 'MB'}) : '')]);
  R.push(['pm_cores', o.cores ? String(o.cores) : na]);
  R.push(['pm_res', o.res + ' · ' + t('pm_dprX', {n: o.dpr})]);
  R.push(['pm_hz', o.hz ? '≈' + o.hz + 'Hz' : na]);
  R.push(['pm_color', [o.hdr ? 'HDR' : '', o.p3 ? 'P3' : 'sRGB'].filter(Boolean).join(' · ')]);
  R.push(['pm_bat', o.bat != null ? o.bat + '%' + (o.charging ? ' · ' + t('pm_charging') : '') : t('pm_hiddenBr')]);
  R.push(['pm_net', (o.online ? '' : t('pm_offline') + ' · ') + (o.net || na) + (o.down ? ' · ≈' + o.down + 'Mbps' : '')]);
  R.push(['pm_touch', o.touch ? t('pm_touchX', {n: o.touch}) : t('pm_noTouch')]);
  R.push(['pm_lang', [o.lang, o.tz].filter(Boolean).join(' · ')]);
  return R;
}
function pmRender(){
  const panel = $('#panel-phonecmp'), sb = $('#ph_sbox'); if (!panel || !sb) return;
  let box = $('#ph_me'); if (!box){ sb.insertAdjacentHTML('beforebegin', '<details class="adv ph-me" id="ph_me"></details>'); box = $('#ph_me'); }
  const o = PHME.data, open = box.open;
  box.innerHTML = `<summary>📱 ${pmE(t('pm_title'))}</summary><p class="fine">${pmE(t('pm_helpMe'))}</p>
    ${o ? `<dl class="pm-list">${pmRows(o).map(([k, v]) => `<div><dt>${pmE(t(k))}</dt><dd dir="auto">${pmE(v)}</dd></div>`).join('')}</dl>
      <div class="btnrow"><button type="button" class="btn" id="pm_add">＋ ${pmE(t('pm_add'))}</button><button type="button" class="mv" id="pm_again">↻ ${pmE(t('pm_again'))}</button></div>
      <p class="fine">${pmE(t('pm_limits'))}</p>` : `<p class="fine">${pmE(t('pm_reading'))}</p>`}`;
  box.open = open;
}
async function pmRun(){
  if (PHME.busy) return; PHME.busy = true; pmRender();
  try { PHME.data = await pmRead(); } catch (e) { PHME.data = {}; }
  PHME.busy = false; pmRender();
}
document.addEventListener('toggle', e => { if (e.target && e.target.id === 'ph_me' && e.target.open && !PHME.data) pmRun(); }, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#pm_again')){ PHME.data = null; pmRun(); return; }
  if (e.target.closest('#pm_add') && PHME.data){
    const o = PHME.data, L = phMineList();
    L.push({n: t('pm_mine'), price: '', d: '', hz: o.hz || '', ram: o.ram && o.ram < 8 ? o.ram : '', st: o.disk || '', bat: '', w: '', g: '', chip: '', cam: '', ip: '', rel: ''});
    const C = phCmpList(); if (C.length >= 4) C.pop(); C.push('my' + (L.length - 1)); SET.phCmp = C;
    try { saveSet(); } catch (er) {} try { phsRender(); } catch (er) {} try { calc(tab); } catch (er) {} toast(t('pm_added'));
  }
});
{
  const _calcPm = calc;
  calc = function(id){ const r = _calcPm.apply(this, arguments); if (id === 'phonecmp' && !$('#ph_me')) pmRender(); return r; };
  const _alPm = applyLang;
  applyLang = function(){ const r = _alPm.apply(this, arguments); try { if ($('#ph_me')) pmRender(); } catch (e) {} return r; };
}

/* ================= phones: fix any figure yourself — your corrections stay on this device, are marked ✏️, and can be reset ================= */
function phEd(){ if (!SET.phEdit || typeof SET.phEdit !== 'object') SET.phEdit = {}; return SET.phEdit; }
const PHE_F = [['ils', 'phe_ils', 'num'], ['pr0', 'phe_launch', 'num'], ['n', 'phs_nPh', 'text'], ['d', 'phs_d', 'num'], ['hz', 'phs_hz', 'num'], ['chip', 'ph_chip', 'text'], ['ram', 'phs_ram', 'num'], ['st', 'phs_st', 'num'],
  ['vars', 'phe_vars', 'text'], ['cam', 'phs_cam', 'text'], ['front', 'ph_front', 'num'], ['zoom', 'ph_zoom', 'num'], ['bat', 'phs_bat', 'num'], ['w', 'phs_w', 'num'], ['wl', 'ph_wl', 'num'], ['g', 'phs_g', 'num'],
  ['ip', 'ph_water', 'text'], ['rel', 'ph_rel', 'text'], ['os', 'ph_os', 'text'], ['upd', 'ph_upd', 'num'], ['res', 'ph_res', 'text'], ['panel', 'phe_panel', 'text'], ['nits', 'ph_nits', 'num'], ['cover', 'ph_cover', 'text'],
  ['dim', 'ph_dim', 'text'], ['sim', 'ph_sim', 'text'], ['usb', 'ph_usb', 'text'], ['wifi', 'ph_wifi', 'text'], ['sd', 'ph_sd', 'bool'], ['jack', 'ph_jack', 'bool'], ['colors', 'ph_colors', 'num']];
const pheVarsTxt = V => (V || []).map(v => v[0] + ':' + (v[1] || '') + (v[2] ? ':' + v[2] : '')).join(' | ');
const pheVarsParse = s => String(s || '').split(/[|,;\n]+/).map(x => x.trim().split(':').map(Number)).filter(a => a[0] > 0).map(a => [a[0], a[1] || 0].concat(a[2] ? [a[2]] : []));
function pheApply(p, o){
  const q = Object.assign({}, p);
  Object.keys(o).forEach(k => {
    const v = o[k]; if (k === 'ils') return;
    if (k === 'cam'){ const a = String(v).split(/[+,\s]+/).map(Number).filter(x => x > 0); if (a.length) q.cam = a; }
    else if (k === 'vars'){ const a = pheVarsParse(v); if (a.length) q.vars = a; }
    else if (k === 'pr0'){ q.pr = [+v || 0, p.pr[1], p.pr[2]]; }
    else if (k === 'sd' || k === 'jack') q[k] = v === true || v === '1';
    else q[k] = (PHE_F.find(f => f[0] === k) || [])[2] === 'num' ? +v : String(v);
  });
  q.edited = true; return q;
}
if (typeof phAll === 'function'){
  const phAllEd = phAll;
  phAll = function(){ const E = phEd(); return phAllEd.apply(this, arguments).map(p => !p.mine && E[p.id] && Object.keys(E[p.id]).length ? pheApply(p, E[p.id]) : p); };
  var phAllOrig = phAllEd;
}
function pheVal(p, k){
  if (k === 'ils'){ const own = +((SET.phPrice || {})[p.id]); return own > 0 ? own : ''; }
  if (k === 'pr0') return p.pr ? p.pr[0] : '';
  if (k === 'cam') return (p.cam || []).join('+');
  if (k === 'vars') return pheVarsTxt(p.vars);
  const v = p[k]; return v == null ? '' : v;
}
function pheRender(){
  const me = $('#ph_me'); if (!me) return;
  let box = $('#ph_ed'); if (!box){ me.insertAdjacentHTML('afterend', '<details class="adv ph-me ph-ed" id="ph_ed"></details>'); box = $('#ph_ed'); }
  const open = box.open, L = phAllOrig().filter(p => !p.mine);
  let id = SET.phEdSel; if (!L.some(p => p.id === id)) id = (phCmpList().find(x => L.some(p => p.id === x))) || L[0].id;
  const orig = L.find(p => p.id === id), cur = phById(id) || orig, E = phEd()[id] || {}, nEd = Object.keys(phEd()).filter(k => Object.keys(phEd()[k] || {}).length).length;
  const cur0 = orig.vcur || orig.pr[1];
  box.innerHTML = `<summary>✏️ ${pmE(t('phe_title'))}${nEd ? ` <span class="cv-cnt">${nEd}</span>` : ''}</summary><p class="fine">${pmE(t('phe_help'))}</p>
    <div class="field wide"><label for="phe_sel">${pmE(t('phe_pick'))}</label><select id="phe_sel">${L.map(p => `<option value="${pmE(p.id)}"${p.id === id ? ' selected' : ''}>${phEd()[p.id] && Object.keys(phEd()[p.id]).length ? '✏️ ' : ''}${pmE(p.n)}</option>`).join('')}</select></div>
    <div class="phe-grid">${PHE_F.map(([k, lab, ty]) => {
      const v = k === 'ils' ? pheVal(cur, k) : pheVal(cur, k), o = k === 'ils' ? '' : pheVal(orig, k), changed = k !== 'ils' && E[k] != null;
      const L2 = t(lab) + (k === 'pr0' ? ' (' + orig.pr[1] + ')' : k === 'vars' ? ' (' + cur0 + ')' : '');
      if (ty === 'bool') return `<div class="field cv-f${changed ? ' phe-ch' : ''}"><label>${pmE(L2)}</label><select data-phe="${k}"><option value=""${v === '' ? ' selected' : ''}>—</option><option value="1"${v === true ? ' selected' : ''}>${pmE(t('ph_yes'))}</option><option value="0"${v === false ? ' selected' : ''}>${pmE(t('ph_no'))}</option></select></div>`;
      return `<div class="field cv-f${changed ? ' phe-ch' : ''}${k === 'vars' ? ' wide' : ''}"><label>${pmE(L2)}</label><input data-phe="${k}" type="${ty === 'num' ? 'number' : 'text'}"${ty === 'num' ? ' inputmode="decimal" step="any"' : ''} dir="auto" value="${pmE(v)}" placeholder="${pmE(o)}" autocomplete="off"></div>`;
    }).join('')}</div>
    <p class="fine">${pmE(t('phe_varsH'))}</p>
    <div class="btnrow">${Object.keys(E).length || +((SET.phPrice || {})[id]) > 0 ? `<button type="button" class="mv" id="phe_reset">↺ ${pmE(t('phe_reset'))}</button>` : ''}${nEd ? `<button type="button" class="mv" id="phe_resetAll">↺ ${pmE(t('phe_resetAll'))}</button>` : ''}</div>`;
  box.open = open;
}
var PHE_T = null;
document.addEventListener('change', e => { if (e.target && e.target.id === 'phe_sel'){ SET.phEdSel = e.target.value; try { saveSet(); } catch (er) {} pheRender(); } });
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.dataset || !el.dataset.phe || !el.closest('#ph_ed')) return;
  const id = ($('#phe_sel') || {}).value; if (!id) return;
  const k = el.dataset.phe, orig = phAllOrig().find(p => p.id === id); let v = el.value.trim();
  if (k === 'ils'){ if (!SET.phPrice || typeof SET.phPrice !== 'object') SET.phPrice = {}; if (+v > 0) SET.phPrice[id] = +v; else delete SET.phPrice[id]; }
  else {
    const E = phEd(), o = E[id] || (E[id] = {}), ov = String(pheVal(orig, k));
    if (v === '' || v === ov || (el.tagName === 'SELECT' && v === '')) delete o[k]; else o[k] = v;
    if (!Object.keys(o).length) delete E[id];
    el.closest('.field').classList.toggle('phe-ch', o[k] != null);
  }
  clearTimeout(PHE_T); PHE_T = setTimeout(() => { try { saveSet(); } catch (er) {} try { phsRender(); } catch (er) {} try { if (tab === 'phonecmp') calc(tab); } catch (er) {} }, 350);
}, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.tagName === 'SELECT' && el.dataset && el.dataset.phe) el.dispatchEvent(new Event('input', {bubbles: true})); });
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const one = e.target.closest('#phe_reset'), all = e.target.closest('#phe_resetAll'); if (!one && !all) return;
  if (all) SET.phEdit = {}; else { const id = ($('#phe_sel') || {}).value; delete phEd()[id]; if (SET.phPrice) delete SET.phPrice[id]; }
  try { saveSet(); } catch (er) {} pheRender(); try { phsRender(); } catch (er) {} try { calc(tab); } catch (er) {} toast(t('phe_resetDone'));
});
{
  const _calcPhe = calc;
  calc = function(id){ const r = _calcPhe.apply(this, arguments); if (id === 'phonecmp' && $('#ph_me') && !$('#ph_ed')) pheRender(); return r; };
  const _alPhe = applyLang;
  applyLang = function(){ const r = _alPhe.apply(this, arguments); try { if ($('#ph_ed')) pheRender(); } catch (e) {} return r; };
}
