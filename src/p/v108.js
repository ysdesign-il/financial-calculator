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

/* ---------- members only: the AI assistant and the advanced calculators need a (free, on-device) account ---------- */
const FREE_TABS = ['home', 'markets', 'saved', 'settings', 'convert', 'vat', 'percent', 'salary', 'tax', 'loan', 'compound', 'savegoal',
  'unitprice', 'discount', 'split', 'workdays', 'inflation', 'expenses'];
var isMember = () => { try { return !!FUSER || (typeof DEV_ON !== 'undefined' && DEV_ON); } catch (e) { return false; } };
const mbLocked = id => !isMember() && TABS.includes(id) && !FREE_TABS.includes(id);
function mbSync(){ document.body.classList.toggle('no-member', !isMember()); }
function mbOpen(id){
  let o = $('#mbx');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="mbx" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="mbx_t"><div class="cp-top"><h3 id="mbx_t"></h3><button type="button" class="cp-x" id="mbx_x">×</button></div><div id="mbx_b"></div></div></div>`); o = $('#mbx'); }
  $('#mbx_t').textContent = t('mb_title'); $('#mbx_x').setAttribute('aria-label', t('cp_close'));
  $('#mbx_b').innerHTML = `<p class="mb-ic">🔒</p><p><b>${E108(id === 'assist' ? t('mb_ai') : t('mb_calc', {n: t('tab_' + id)}))}</b></p><p class="fine">${E108(t('mb_why'))}</p>
    <div class="btnrow"><button type="button" class="gold-btn" id="mbx_go">${E108(t('mb_go'))}</button><button type="button" class="btn" id="mbx_no">${E108(t('mb_later'))}</button></div>`;
  o.hidden = false; document.body.classList.add('cp-lock');
}
function mbClose(){ const o = $('#mbx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
const activateMb = activate;
activate = function(id){ if (mbLocked(id)){ mbOpen(id); return; } return activateMb.apply(this, arguments); };
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (!isMember() && e.target.closest('#ai_fab, #explainBtn')){ e.preventDefault(); e.stopPropagation(); mbOpen('assist'); return; }
  const o = $('#mbx'); if (!o || o.hidden) return;
  if (e.target === o || e.target.closest('#mbx_x, #mbx_no')) return mbClose();
  if (e.target.closest('#mbx_go')){ mbClose(); activateMb('settings'); setTimeout(() => { try { if (typeof setCat === 'function') setCat('account'); } catch (er) {} }, 120); }
}, true);
const renderTilesMb = renderTiles;
renderTiles = function(){ const r = renderTilesMb.apply(this, arguments); try { $$('#tiles .tile[data-go]').forEach(b => b.classList.toggle('locked', mbLocked(b.dataset.go))); } catch (e) {} return r; };
mbSync();
try { renderTiles(); if (mbLocked(tab)) activateMb('home'); } catch (e) {}

/* ================= family mode: family members sign in with their name and a code from the developer; nobody else ever sees it =================
   Only fingerprints of name+code (PBKDF2) are published, in family.json; the codes themselves are never stored anywhere public. */
const FAM_SITE = 'https://ysdesign-il.github.io/financial-calculator/';
const FAM_URL = () => (IN_CLAUDE ? FAM_SITE : '') + 'family.json';
var FAM = {list: null, on: false, name: ''};
const famNorm = s => String(s || '').replace(/^.*?(FM[-\s]?)/i, 'FM').replace(/[^0-9a-z]/gi, '').toUpperCase();
const famNameNorm = s => String(s || '').replace(/\s+/g, '').toUpperCase();
async function famHash(name, code){
  const b = await pbk(famNameNorm(name) + ':' + famNorm(code), new TextEncoder().encode('fincalc-family-v1'), 150000, 256);
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
}
function famCached(){ try { return JSON.parse(RAWLS.getItem('fin-fam-list') || 'null'); } catch (e) { return null; } }
async function famFetch(){
  try { const r = await fetch(FAM_URL() + '?t=' + Date.now(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (r.ok){ const d = await r.json(); if (d && Array.isArray(d.m)){ FAM.list = d; try { RAWLS.setItem('fin-fam-list', JSON.stringify(d)); } catch (e) {} } } } catch (e) {}
  return FAM.list;
}
function famHas(h){ const L = FAM.list || famCached(); return !!(L && Array.isArray(L.m) && L.m.some(x => x && x.h === h)); }
function famStart(){
  let h = '', n = ''; try { h = RAWLS.getItem('fin-fam') || ''; n = RAWLS.getItem('fin-fam-n') || ''; } catch (e) {}
  FAM.on = !!(h && famHas(h)); FAM.name = FAM.on ? n : '';
  famFetch().then(() => { const was = FAM.on; FAM.on = !!(h && famHas(h)); FAM.name = FAM.on ? n : ''; if (was !== FAM.on){ if (!FAM.on && h){ try { RAWLS.removeItem('fin-fam'); RAWLS.removeItem('fin-fam-n'); } catch (e) {} } famApply(); } });
}
function famApply(){ mbSync(); try { renderTiles(); } catch (e) {} famBadge(); }
async function famTry(name, code){
  if (!name || famNorm(code).length < 14) return false;
  await famFetch(); const h = await famHash(name, code);
  if (!famHas(h)) return false;
  try { RAWLS.setItem('fin-fam', h); RAWLS.setItem('fin-fam-n', String(name).trim().slice(0, 30)); } catch (e) {}
  FAM.on = true; FAM.name = String(name).trim().slice(0, 30); famApply(); toast(t('fam_on', {n: FAM.name})); return true;
}
/* one shared family username + password, chosen by the developer; works on the normal sign-in screen from any device */
async function famPwHash(user, pass){
  const b = await pbk(famNameNorm(user) + ':' + String(pass || ''), new TextEncoder().encode('fincalc-family-pw-v1'), 150000, 256);
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
}
function famPwEntry(L){ L = L || FAM.list || famCached(); return L && Array.isArray(L.m) ? L.m.find(x => x && x.p) : null; }
async function famPwTry(user, pass){
  if (!user || !pass) return false;
  if (!famPwEntry()) await famFetch();
  const e = famPwEntry(); if (!e) return false;
  const h = await famPwHash(user, pass); if (h !== e.h) return false;
  const nm = String(user).trim().slice(0, 30);
  try { RAWLS.setItem('fin-fam', h); RAWLS.setItem('fin-fam-n', nm); } catch (er) {}
  FAM.on = true; FAM.name = nm; famApply(); toast(t('fam_on', {n: nm})); return true;
}
if (typeof doLogin === 'function'){
  const doLoginFam = doLogin;
  doLogin = async function(){
    const ui = $('#acc_user'), pi = $('#acc_pass'), u = String((ui || {}).value || '').trim(), pw = String((pi || {}).value || '');
    const local = (() => { try { return typeof getAcc === 'function' && !!getAcc(hdNorm(u)); } catch (e) { return false; } })();
    if (u && pw && !local && window.crypto && crypto.subtle){
      try { accMsg('m_wait', null, true); } catch (e) {}
      if (await famPwTry(u, pw)){ if (pi) pi.value = ''; try { accMsg('fam_inOk', {n: u}, true); } catch (e) {} try { activate('home'); } catch (e) {} return; }
    }
    return doLoginFam.apply(this, arguments);
  };
}
/* the same hidden entry as developer mode accepts a family code too; or open the link the developer sends: #fam=NAME~CODE */
if (typeof devTry === 'function'){
  const devTryFam = devTry;
  devTry = async function(rawName, rawCode, quiet){
    const ni = $('#dev_name'), ci = $('#dev_code'), name = rawName != null ? rawName : ni && ni.value, code = rawCode != null ? rawCode : ci && ci.value;
    if (/^\s*FM/i.test(String(code || '')) || /FM[-\s]?[0-9A-Z]{4}/i.test(String(code || ''))){
      const ok = await famTry(name, code);
      if (ok){ const b = $('#dev_box'); if (b) b.remove(); return true; }
      if (!quiet){ const m = $('#dev_msg'); if (m) m.textContent = t('dev_bad2'); }
      return false;
    }
    return devTryFam.apply(this, arguments);
  };
}
async function famFromHash(){
  const m = /[#&]fam=([^&]+)/i.exec(location.hash || ''); if (!m) return;
  const raw = decodeURIComponent(m[1]), pair = /^([^~:]+)[~:](.+)$/.exec(raw);
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  if (!pair || !(await famTry(pair[1], pair[2]))) toast(t('dev_bad2'));
}
window.addEventListener('hashchange', famFromHash);
/* who counts as a member: developer, family, or a registered account */
const isMemberFam = isMember;
isMember = () => FAM.on || isMemberFam();
function famBadge(){
  let b = $('#fam_badge'); const host = $('.set-hub') || $('#panel-settings .set-wrap') || null;
  if (!FAM.on){ if (b) b.remove(); return; }
  if (!b && host){ host.insertAdjacentHTML('afterbegin', `<div class="perm ok" id="fam_badge"><span class="perm-dot"></span><div><b></b><small></small></div><button type="button" class="mv wide" id="fam_off"></button></div>`); b = $('#fam_badge'); }
  if (b){ $('b', b).textContent = '👨‍👩‍👧 ' + t('fam_badge', {n: FAM.name}); $('small', b).textContent = t('fam_badgeS'); $('#fam_off', b).textContent = t('fam_exit'); }
}
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#fam_off')){ try { RAWLS.removeItem('fin-fam'); RAWLS.removeItem('fin-fam-n'); } catch (er) {} FAM.on = false; FAM.name = ''; famApply(); toast(t('fam_offDone')); }
});

/* ---------- developer mode: manage family members (add with a fresh code, remove) ---------- */
function famNames(){ return (SET.famNames && typeof SET.famNames === 'object') ? SET.famNames : (SET.famNames = {}); }
function famCode(){
  const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', r = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(r, x => A[x % A.length]).join(''); return 'FM-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
}
async function famSave(list, msg){                 // only through the app, with the developer's GitHub token on this device
  if (!(typeof ghTok === 'function' && ghTok() && typeof ghPut === 'function')) throw new Error('notoken');
  const text = JSON.stringify(list, null, 1);
  await ghPut('family.json', text + '\n', msg);
  FAM.list = list; try { RAWLS.setItem('fin-fam-list', text); } catch (e) {}
}
/* say what actually went wrong: blocked connection (e.g. inside the Claude app), bad token, missing permission, or no access to the repo */
function famErrKey(er){
  const m = String(er && er.message || '');
  if (m === 'notoken') return 'fam_needTok';
  if (m === 'gh401') return 'fam_errTok';
  if (m === 'gh403') return 'fam_errPerm';
  if (m === 'gh404') return 'fam_errRepo';
  if (m === 'gh409' || m === 'gh422') return 'fam_errBusy';
  if (!/^gh\d/.test(m)) return IN_CLAUDE ? 'fam_errBlocked' : 'fam_errNet';
  return 'fam_saveFail';
}
function famDevRender(){
  const cat = $('.set-cat[data-cat="conn"]'); let s = $('#fam_sec');
  if (!(typeof DEV_ON !== 'undefined' && DEV_ON) || !cat){ if (s) s.remove(); return; }
  if (!s){ cat.insertAdjacentHTML('beforeend', `<section class="set-sec" id="fam_sec"></section>`); s = $('#fam_sec'); }
  const L = FAM.list || famCached() || {v: 1, m: []}, N = famNames();
  const tok = typeof ghTok === 'function' && ghTok(), open = !!FAM.formOpen;
  s.innerHTML = `<div class="sec-h fam-h"><h3 class="sec-t">👨‍👩‍👧 ${E108(t('fam_title'))}</h3><button type="button" class="gold-btn fam-plus${open ? ' on' : ''}" id="fam_plus" aria-expanded="${open}" aria-label="${E108(t('fam_plusA'))}" title="${E108(t('fam_plusA'))}">+</button></div><p class="fine">${E108(t('fam_help'))}</p>
    ${IN_CLAUDE ? `<div class="gk-st new">${E108(t('fam_relayNote'))}</div>` : ''}
    ${typeof ghTok === 'function' && ghTok() ? `<button type="button" class="mv wide" id="fam_tokDel">🗑️ ${E108(t('fam_tokDelete'))}</button>` : `<div class="gk-st bad">${E108(t('fam_needTok'))}</div><label class="scn-l" for="fam_tok">${E108(t('dc_tok'))}</label><div class="as-box"><input id="fam_tok" type="password" autocomplete="off" dir="ltr" placeholder="github_pat_…"><button type="button" class="btn" id="fam_tokSave">${E108(t('fam_tokSave'))}</button></div><p class="fine">${E108(t('dc_tokH'))} <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">${E108(t('fam_tokNew'))}</a></p>`}
    <div class="fam-form" id="fam_form"${open ? '' : ' hidden'}><div class="as-box"><input id="fam_new" type="text" maxlength="30" dir="auto" placeholder="${E108(t('fam_namePh'))}" autocomplete="off"><button type="button" class="gold-btn" id="fam_add"${tok ? '' : ' disabled'}>${E108(t('fam_add'))}</button></div></div>
    <div id="fam_out"></div>
    ${famPwBox(L, tok)}
    <ul class="sec-list">${(L.m || []).filter(x => !x.p).map(x => `<li><b dir="auto">${E108(N[x.id] || t('fam_unknown'))}</b><small>${E108(svdDate(x.at || 0))}</small><button type="button" class="mv wide" data-famdel="${E108(x.id)}">${E108(t('fam_del'))}</button></li>`).join('') || `<li>${E108(t('fam_none'))}</li>`}</ul>`;
}
/* without a GitHub token: sign the change with the inbox key (only developer mode has it) and send it through the relay; the bot verifies and applies it */
async function famRelaySet(h, at){
  if (typeof ibKey !== 'function' || typeof ib64 !== 'function') throw new Error('nokey');
  const jwk = await ibKey(); if (!jwk || !jwk.d) throw new Error('nokey');
  const j = {kty: jwk.kty, n: jwk.n, e: jwk.e, d: jwk.d, p: jwk.p, q: jwk.q, dp: jwk.dp, dq: jwk.dq, qi: jwk.qi};
  const k = await crypto.subtle.importKey('jwk', j, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
  const raw = new TextEncoder().encode(JSON.stringify({k: 'famset', h, at}));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, raw);
  const body = 'fcs1.' + ib64(raw) + '.' + ib64(sig);
  try {
    const r = await fetch('https://ntfy.sh/' + INBOX_TOPIC, {method: 'POST', body, credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (r.ok) return 'sent';
  } catch (e) {}
  /* the relay is unreachable here: keep the signed change in the app's private developer storage, so Claude can apply it from the chat */
  if (typeof FB === 'object' && FB && FB.db){ try { await FB.db.doc('devkeys/famcmd').set({m: body, at}); return 'queued'; } catch (e) {} }
  throw new Error('relay');
}
function famPwLocal(){ let u = '', p = ''; try { u = RAWLS.getItem('fin-fam-u') || ''; p = RAWLS.getItem('fin-fam-pw') || ''; } catch (e) {} return {u, p}; }
function famPwMsg(u, p){ return t('fam_pwMsg', {l: IN_CLAUDE ? FAM_SITE : location.origin + location.pathname, u, p}); }
function famPwBox(L, tok){
  const e = famPwEntry(L), loc = famPwLocal(), at0 = Number(RAWLS.getItem('fin-fam-pwat') || 0);
  const live = !!(e && e.at === at0), pend = !live && !!at0 && Number(RAWLS.getItem('fin-fam-pend') || 0) === at0 && Date.now() - at0 < 3 * 864e5;
  const mine = !!(loc.u && (live || pend));
  const head = `<small>🔑 ${E108(t('fam_pwTitle'))}</small><p class="fine">${E108(t('fam_pwHelp'))}</p>`;
  const form = (show) => `<div id="fam_pwForm"${show ? '' : ' hidden'}>
      <div class="field wide"><label for="fam_pwU">${E108(t('fam_pwU'))}</label><input id="fam_pwU" class="lookup" type="text" maxlength="30" dir="auto" autocomplete="off" autocapitalize="none" spellcheck="false" value="${E108(loc.u)}"></div>
      <div class="field wide"><label for="fam_pwP">${E108(t('fam_pwP'))}</label><input id="fam_pwP" class="lookup" type="text" maxlength="40" dir="ltr" autocomplete="off" autocapitalize="none" spellcheck="false"></div>
      <p class="fine" id="fam_pwSt"></p>
      <button type="button" class="gold-btn" id="fam_pwSave">${E108(t('fam_pwSave'))}</button></div>`;
  if (mine){
    return `<div class="fam-linkbox" id="fam_pwbox">${head}${pend ? `<div class="gk-st new">⏳ ${E108(t('fam_pwPend'))}</div>` : ''}
      <div class="fam-cred"><span>${E108(t('fam_pwU'))}</span><b dir="auto">${E108(loc.u)}</b></div>
      <div class="fam-cred"><span>${E108(t('fam_pwP'))}</span><b dir="ltr" id="fam_pwShow" data-p="${E108(loc.p)}">••••••</b><button type="button" class="mv" id="fam_pwEye" aria-label="${E108(t('fam_pwEye'))}">👁</button></div>
      <div class="btnrow fam-send"><button type="button" class="gold-btn" id="fam_pwShare">📤 ${E108(t('fam_share'))}</button><button type="button" class="btn" id="fam_pwCopy">📋 ${E108(t('fam_copy'))}</button></div>
      <button type="button" class="mv wide" id="fam_pwEdit">${E108(t('fam_pwChange'))}</button>${form(false)}</div>`;
  }
  return `<div class="fam-linkbox" id="fam_pwbox">${head}${e ? `<p class="fine">${E108(t('fam_pwOther'))}</p>` : ''}${form(true)}</div>`;
}
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  if (e.target.closest('.sh-row[data-scat="conn"]')) setTimeout(() => { famFetch().then(famDevRender); }, 160);
  if (e.target.closest('#fam_plus')){
    FAM.formOpen = !FAM.formOpen; famDevRender();
    if (FAM.formOpen) setTimeout(() => { const i = $('#fam_new'); if (i) i.focus(); }, 60);
    return;
  }
  if (e.target.closest('#fam_tokDel')){ try { RAWLS.removeItem('fin-gh-tok'); } catch (er) {} toast(t('fam_tokDelete') + ' ✓'); famDevRender(); return; }
  if (e.target.closest('#fam_tokSave')){
    const v = String(($('#fam_tok') || {}).value || '').trim(); if (!v) return;
    try { RAWLS.setItem('fin-gh-tok', v); } catch (er) {} toast(t('dc_tokSaved')); famDevRender(); return;
  }
  const add = e.target.closest('#fam_add');
  if (add){
    const nm = String(($('#fam_new') || {}).value || '').trim(); if (!nm || add.disabled) return;
    add.disabled = true;
    const code = famCode(), h = await famHash(nm, code), id = Math.random().toString(36).slice(2, 10);
    const L = JSON.parse(JSON.stringify(FAM.list || famCached() || {v: 1, m: []})); L.m = (L.m || []).concat({id, h, at: Date.now()});
    try { await famSave(L, 'Family member added'); }
    catch (er){ add.disabled = false; const o = $('#fam_out'); if (o) o.innerHTML = `<div class="gk-st bad">${E108(t(famErrKey(er)))}</div>`; return; }
    famNames()[id] = nm; try { saveSet(); } catch (er) {}
    const link = (IN_CLAUDE ? FAM_SITE : location.origin + location.pathname) + '#fam=' + encodeURIComponent(nm.replace(/[~:]/g, ' ') + '~' + code);
    FAM.msg = t('fam_msg', {n: nm, l: link, c: code}); FAM.link = link;
    const html = `<div class="gk-st ok fam-card"><b>${E108(t('fam_made', {n: nm}))}</b><br><span dir="ltr" class="num">${E108(code)}</span>
      <p class="fam-msg" dir="auto">${E108(FAM.msg)}</p></div>
      <div class="fam-linkbox"><small>🔗 ${E108(t('fam_linkL'))}</small><a class="fam-link" id="fam_link" href="${E108(link)}" target="_blank" rel="noopener noreferrer" dir="ltr">${E108(link)}</a><button type="button" class="btn" id="fam_copyLink">${E108(t('fam_copyLink'))}</button></div>
      <div class="btnrow fam-send"><button type="button" class="gold-btn" id="fam_share">📤 ${E108(t('fam_share'))}</button><button type="button" class="btn" id="fam_copy">📋 ${E108(t('fam_copy'))}</button></div>
      <p class="fine">${E108(t('fam_savedGh'))}</p>`;
    FAM.formOpen = false; famDevRender(); const o2 = $('#fam_out'); if (o2) o2.innerHTML = html;
    return;
  }
  if (e.target.closest('#fam_pwEdit')){ const f = $('#fam_pwForm'); if (f){ f.hidden = !f.hidden; if (!f.hidden){ const i = $('#fam_pwP'); if (i) i.focus(); } } return; }
  if (e.target.closest('#fam_pwEye')){ const b = $('#fam_pwShow'); if (b) b.textContent = b.textContent.startsWith('•') ? b.dataset.p : '••••••'; return; }
  if (e.target.closest('#fam_pwCopy')){ const c = famPwLocal(); if (c.u){ copyText(famPwMsg(c.u, c.p)); toast(t('st_copied')); } return; }
  if (e.target.closest('#fam_pwShare')){
    const c = famPwLocal(); if (!c.u) return; const msg = famPwMsg(c.u, c.p);
    if (navigator.share){ try { await navigator.share({title: t('fam_title'), text: msg}); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
    copyText(msg); toast(t('shr_copiedInstead')); return;
  }
  const ps = e.target.closest('#fam_pwSave');
  if (ps && !ps.disabled){
    const u = String(($('#fam_pwU') || {}).value || '').trim(), pw = String(($('#fam_pwP') || {}).value || ''), st = $('#fam_pwSt');
    if (u.length < 2){ if (st) st.textContent = t('fam_pwShortU'); return; }
    if (pw.length < 6){ if (st) st.textContent = t('fam_pwShortP'); return; }
    try { if (typeof getAcc === 'function' && getAcc(hdNorm(u))){ if (st) st.textContent = t('fam_pwTaken'); return; } } catch (er) {}
    ps.disabled = true; if (st) st.textContent = t('m_wait');
    const at = Date.now(), h = await famPwHash(u, pw);
    const L = JSON.parse(JSON.stringify(FAM.list || famCached() || {v: 1, m: []}));
    L.m = (L.m || []).filter(x => !x.p).concat({id: 'p', p: 1, h, at});
    let relay = false;
    const tokOk = typeof ghTok === 'function' && ghTok() && !IN_CLAUDE;
    try {
      if (tokOk){ try { await famSave(L, 'Family sign-in updated'); } catch (er){ if (/^gh\d/.test(String(er && er.message))) throw er; relay = await famRelaySet(h, at); } }
      else relay = await famRelaySet(h, at);
    } catch (er){ ps.disabled = false; if (st) st.textContent = t(String(er && er.message) === 'nokey' ? 'fam_noKey' : String(er && er.message) === 'relay' ? 'fam_errNet' : famErrKey(er)); return; }
    try { RAWLS.setItem('fin-fam-u', u); RAWLS.setItem('fin-fam-pw', pw); RAWLS.setItem('fin-fam-pwat', String(at)); if (relay) RAWLS.setItem('fin-fam-pend', String(at)); } catch (er) {}
    famDevRender(); toast(t(relay === 'queued' ? 'fam_pwQueued' : relay ? 'fam_pwSent' : 'fam_pwDone')); return;
  }
  if (e.target.closest('#fam_copyLink') && FAM.link){ copyText(FAM.link); toast(t('st_copied')); return; }
  if (e.target.closest('#fam_copy') && FAM.msg){ copyText(FAM.msg); toast(t('st_copied')); return; }
  if (e.target.closest('#fam_share') && FAM.msg){
    if (navigator.share){ try { await navigator.share({title: t('fam_title'), text: FAM.msg}); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
    copyText(FAM.msg); toast(t('shr_copiedInstead')); return;
  }
  const del = e.target.closest('[data-famdel]');
  if (del){
    const id = del.dataset.famdel, L = JSON.parse(JSON.stringify(FAM.list || famCached() || {v: 1, m: []}));
    L.m = (L.m || []).filter(x => x.id !== id);
    try { await famSave(L, 'Family member removed'); } catch (er){ toast(t(famErrKey(er))); return; }
    delete famNames()[id]; try { saveSet(); } catch (er) {}
    famDevRender(); toast(t('fam_delDone'));
  }
});
famStart(); famFromHash();
setTimeout(famBadge, 800);
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.sh-row, [data-tab="settings"], .bt[data-tab="settings"]')) setTimeout(famBadge, 200); });
