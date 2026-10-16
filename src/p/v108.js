/* ================= 10.8+: improvements — compact result while scrolling, warnings on data that may be out of date ================= */
const E108 = s => asEsc(String(s == null ? '' : s));

/* ---------- on a phone the result card stays on top while you scroll; once you scroll it shrinks to the number itself ---------- */
(function heroCompact(){
  let on = false, raf = 0;
  const upd = () => { raf = 0; const v = window.scrollY > 260; if (v !== on){ on = v; document.body.classList.toggle('hero-min', v); } };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, {passive: true});
  upd();
})();

/* ---------- figures that age: say so on the result ---------- */
const FIG_YEAR = 2026;
const YEAR_TABS = ['salary', 'empcost', 'selfemp', 'freelance', 'overtime', 'leave', 'notice', 'severance', 'benefits', 'carbenefit', 'joboffer', 'tax', 'taxrefund',
  'capital', 'rental', 'purchasetax', 'landtax', 'hishtalmut', 'mortcap', 'kidsave', 'workgrant', 'reserve', 'pensfix', 'childallow', 'oldage'];
function daysSince(iso){ const d = Date.parse(String(iso || '').slice(0, 10)); return isFinite(d) ? Math.floor((Date.now() - d) / 864e5) : 0; }
const show108 = show;
show = function(id, res){
  try {
    if (res && typeof res === 'object'){
      const w = [];
      if (YEAR_TABS.includes(id) && new Date().getFullYear() > FIG_YEAR) w.push(t('w_figYear', {y: FIG_YEAR}));
      const at = id === 'cellcmp' && typeof CELL === 'object' ? CELL.at : id === 'phonecmp' && typeof PHONES === 'object' ? PHONES.at : '';
      if (at && daysSince(at) > 45) w.push(t('w_dataOld', {d: at.slice(0, 10)}));
      if (w.length) res = Object.assign({}, res, {warn: (res.warn || []).concat(w)});
      if ((id === 'mortcap' || id === 'mortgage') && new Date() < new Date(2027, 0, 1)) res = Object.assign({}, res, {note: (res.note ? res.note + ' ' : '') + t('n_mcBalloon')});
    }
  } catch (e) {}
  return show108.apply(this, [id, res].concat([].slice.call(arguments, 2)));
};

/* ---------- my numbers: entered once in Settings, filled into every calculator that has not been touched yet ---------- */
const MY_MAP = {
  salary: [['s_amount', 'g']], overtime: [['ot_month', 'g']], taxrefund: [['tr_gross', 'g12']], hishtalmut: [['kh_sal', 'g']], empcost: [['ec_gross', 'g']],
  workgrant: [['wg_inc', 'g']], reserve: [['rs_inc', 'g3']], smartsplit: [['ss_inc', 'n']], freedom: [['fr_inc', 'n']], networth: [['nw_inc', 'n']],
  mortcap: [['mc_inc', 'n'], ['mc_eq', 'eq']], childallow: [['ca_kids', 'k']], oldage: [['oa_byear', 'by']]
};
function myVals(){
  const g = +SET.myGross || 0, k = SET.myKids === '' ? NaN : +SET.myKids, by = +SET.myBYear || 0, eq = SET.myEq === '' ? NaN : +SET.myEq;
  let n = 0; try { if (g > 0 && typeof netOf === 'function') n = Math.round(netOf(g, 2.25).net); } catch (e) {}
  return {g: g > 0 ? g : NaN, g12: g > 0 ? g * 12 : NaN, g3: g > 0 ? g * 3 : NaN, n: n > 0 ? n : NaN, k, by: by > 1900 ? by : NaN, eq};
}
function myFill(id){
  const m = MY_MAP[id]; if (!m || (TOUCHED || []).includes(id)) return false;
  const V = myVals(); let ch = false;
  m.forEach(([fid, key]) => { const el = document.getElementById(fid), x = V[key]; if (el && isFinite(x) && el.value === el.defaultValue && String(x) !== el.value){ el.value = String(x); ch = true; } });
  return ch;
}
const activate108 = activate;
activate = function(id){ const r = activate108.apply(this, arguments); try { if (myFill(id)) calc(id); } catch (e) {} return r; };
document.addEventListener('change', e => { const id = e.target && e.target.id; if (/^set_my/.test(id)) setTimeout(() => { try { saveSet(); renderTiles(); } catch (er) {} }, 0); });

/* ---------- Home: start from your situation ---------- */
const PERSONAS = {
  emp: ['salary', 'taxrefund', 'workgrant', 'reserve', 'overtime', 'leave', 'hishtalmut', 'joboffer', 'carbenefit', 'benefits', 'severance', 'notice'],
  self: ['selfemp', 'freelance', 'vat', 'tax', 'hishtalmut', 'expenses', 'breakeven', 'clients', 'capital', 'workgrant'],
  home: ['mortcap', 'mortgage', 'mortcmp', 'purchasetax', 'rentbuy', 'refi', 'landtax', 'cpilink', 'rental'],
  family: ['childallow', 'kidsave', 'workgrant', 'expenses', 'smartsplit', 'savegoal', 'split', 'insurance', 'discount', 'benefits'],
  invest: ['compound', 'mmf', 'invfees', 'yield', 'dividends', 'capital', 'avgcost', 'networth', 'fire'],
  retire: ['retire', 'pensfix', 'oldage', 'mgmtfees', 'pencmp', 'fire', 'severance', 'mmf', 'freedom']
};
const PERSONA_IC = {emp: '👔', self: '💼', home: '🏠', family: '👨‍👩‍👧', invest: '📈', retire: '🌅'};
const renderTiles108 = renderTiles;
renderTiles = function(){
  const r = renderTiles108.apply(this, arguments);
  try {
    const box = $('#tiles'), chips = $('#tchips'); if (!box || !chips) return r;
    let pc = $('#pchips');
    if (!pc){ pc = document.createElement('div'); pc.id = 'pchips'; pc.className = 'tchips pchips'; pc.setAttribute('role', 'group'); chips.insertAdjacentElement('beforebegin', pc); }
    const P = SET.persona && PERSONAS[SET.persona] ? SET.persona : 'all';
    pc.setAttribute('aria-label', t('ps_label'));
    pc.innerHTML = `<span class="ps-l">${E108(t('ps_label'))}</span>` + [['all', '✨']].concat(Object.keys(PERSONAS).map(k => [k, PERSONA_IC[k]])).map(([k, ic]) =>
      `<button type="button" class="tchip${k === P ? ' on' : ''}" data-ps="${k}" aria-pressed="${k === P}">${ic} ${E108(t('ps_' + k))}</button>`).join('');
    if (P !== 'all'){
      chips.hidden = true;
      const ids = PERSONAS[P].filter(x => TABS.includes(x) && (typeof isVisible !== 'function' || isVisible(x)));
      box.innerHTML = ids.map(id => `<button type="button" class="tile" data-go="${id}">${ICON[id] || ''}<span>${t('tab_' + id)}</span></button>`).join('') +
        (SET.myGross ? '' : `<p class="fine ps-my">${E108(t('ps_my'))} <button type="button" class="mv wide" data-psmy>${E108(t('ps_myBtn'))}</button></p>`);
    }
  } catch (e) {}
  return r;
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ps]');
  if (b){ SET.persona = b.dataset.ps; try { saveSet(); } catch (er) {} renderTiles(); return; }
  if (e.target.closest && e.target.closest('[data-psmy]')){ try { activate('settings'); setTimeout(() => { if (typeof setCat === 'function') setCat('calc'); const f = $('#set_myGross'); if (f){ f.scrollIntoView({block: 'center'}); f.focus(); } }, 150); } catch (er) {} }
});
try { renderTiles(); } catch (e) {}

/* ---------- developer mode: security alerts from GitHub, and failed attempts to unlock developer mode ---------- */
var SEC = {list: [], at: 0};
async function secLoad(){
  if (typeof DEV_ON === 'undefined' || !DEV_ON) return;
  try {
    const u = IN_CLAUDE ? 'https://ysdesign-il.github.io/financial-calculator/security.json' : 'security.json';
    const r = await fetch(u + '?t=' + Date.now(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (!r.ok) return;
    const d = await r.json(); SEC.list = Array.isArray(d && d.alerts) ? d.alerts : []; SEC.at = Date.now(); secRender();
  } catch (e) {}
}
function secMsg(a){ const k = 'sec_k_' + (a && a.kind); return T[k] ? t(k, Object.assign({r: '', f: ''}, a.p || {})) : (a && a.msg) || ''; }
function secNew(){ const seen = +SET.secSeen || 0; return SEC.list.filter(a => (+a.at || 0) * 1000 > seen); }
function secRender(){
  let b = $('#sec_bar'); const n = (typeof DEV_ON !== 'undefined' && DEV_ON) ? secNew() : [];
  if (!n.length){ if (b) b.remove(); return; }
  const high = n.some(a => a.level === 'high');
  if (!b){ b = document.createElement('div'); b.id = 'sec_bar'; b.className = 'upd-bar sec-bar'; b.setAttribute('role', 'alert'); document.body.appendChild(b); }
  b.classList.toggle('sec-high', high);
  b.innerHTML = `<span>🛡️ <b>${E108(t('sec_new', {n: n.length}))}</b> ${E108(secMsg(n[0]))}</span><button type="button" class="gold-btn" id="sec_open">${E108(t('sec_view'))}</button>`;
  const key = 'fin-sec-ntf', top = String(n[0].at);
  try { if (RAWLS.getItem(key) !== top){ RAWLS.setItem(key, top); if ('Notification' in window && Notification.permission === 'granted') new Notification(t('sec_new', {n: n.length}), {body: secMsg(n[0]), icon: 'icon-192.png', tag: 'sec-' + top}); } } catch (e) {}
}
function secOpen(){
  let o = $('#secx');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="secx" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="secx_t"><div class="cp-top"><h3 id="secx_t"></h3><button type="button" class="cp-x" id="secx_x">×</button></div><div id="secx_b" class="ex-body"></div></div></div>`); o = $('#secx'); }
  const seen = +SET.secSeen || 0, lv = {high: '🔴', medium: '🟠', low: '🟢'};
  $('#secx_t').textContent = t('sec_title'); $('#secx_x').setAttribute('aria-label', t('cp_close'));
  $('#secx_b').innerHTML = (SEC.list.length ? '<ul class="sec-list">' + SEC.list.slice(0, 50).map(a => `<li class="${(+a.at || 0) * 1000 > seen ? 'new' : ''}">${lv[a.level] || '⚪'} <b dir="auto">${E108(secMsg(a))}</b><small>${E108(svdDate((+a.at || 0) * 1000))}${a.actor ? ' · ' + E108(a.actor) : ''}</small></li>`).join('') + '</ul>' : `<p>${E108(t('sec_none'))}</p>`) +
    `<p class="fine">${E108(t('sec_help'))}</p><div class="btnrow"><button type="button" class="gold-btn" id="secx_ok">${E108(t('sec_ack'))}</button>` +
    ('Notification' in window && !IN_CLAUDE && Notification.permission === 'default' ? `<button type="button" class="btn" id="secx_ntf">${E108(t('sec_ntf'))}</button>` : '') + '</div>';
  o.hidden = false; document.body.classList.add('cp-lock');
}
function secClose(){ const o = $('#secx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#sec_open')) return secOpen();
  const o = $('#secx'); if (!o || o.hidden) return;
  if (e.target === o || e.target.closest('#secx_x')) return secClose();
  if (e.target.closest('#secx_ok')){ SET.secSeen = Date.now(); try { saveSet(); } catch (er) {} secClose(); secRender(); }
  if (e.target.closest('#secx_ntf')){ try { Notification.requestPermission(); } catch (er) {} }
});
setTimeout(secLoad, 2500);
setInterval(() => { if (!document.hidden) secLoad(); }, 30 * 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - SEC.at > 5 * 60000) secLoad(); });

/* a wrong developer code is reported to the developer's inbox (at most once an hour from a device; never the code itself) */
async function secReport(msg){
  try {
    const k = 'fin-sec-rep', last = +(RAWLS.getItem(k) || 0); if (Date.now() - last < 3600e3) return; RAWLS.setItem(k, String(Date.now()));
    const it = {k: 'sec', r: 0, m: msg, v: APP_VER, l: lang, s: '', at: Date.now()};
    if (typeof FB !== 'undefined' && FB.db && FB.uid){
      let mine = []; try { const d = await FB.db.doc('feedback/' + FB.uid).get(); if (d && d.exists) mine = (d.data() || {}).items || []; } catch (er) {}
      mine = mine.concat(it).slice(-20); const ref = FB.db.doc('feedback/' + FB.uid);
      try { await ref.update({items: mine, at: Date.now()}); } catch (er) { await ref.set({items: mine, at: Date.now()}); }
    } else if (typeof ibSendWeb === 'function') await ibSendWeb(it);
  } catch (e) {}
}
if (typeof devTry === 'function'){
  const devTry108 = devTry;
  devTry = async function(rawName, rawCode, quiet){
    const ok = await devTry108.apply(this, arguments);
    try {
      if (!ok && !quiet){ const ci = $('#dev_code'), code = String(rawCode != null ? rawCode : ci && ci.value || ''); if (code.replace(/[^0-9a-z]/gi, '').length >= 6) secReport(t('sec_devFail', {w: IN_CLAUDE ? 'Claude' : location.hostname})); }
      if (ok) setTimeout(secLoad, 500);
    } catch (e) {}
    return ok;
  };
}
