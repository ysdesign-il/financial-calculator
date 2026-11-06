/* ---------- 13.86: private server storage for the inbox and the family list; monthly forecast; importing pension and
   investment reports; a profile kind; a document on each insurance policy ----------
   1. Website feedback is read from the server's private storage, only in the locked admin version (it is no longer a public file).
      Family sign-in: the phone sends the fingerprint (PBKDF2 of name + code, as before) and the server answers yes/no; the list
      itself never reaches the phone. A phone that was already signed in is checked again once and stays signed in while offline.
      Changing the family list in developer mode writes to the server through the admin lock (no GitHub file).
   2. Compound interest: a month-by-month table for the first 10 years, from the same engine (compSim) – no second formula.
   3. Importing a pension, provident or study-fund report, or a broker's holdings list (CSV or Excel), into "savings and
      investments": the columns are recognised, every line is shown before saving, lines already there are marked, nothing
      is saved without "Add". ID and account numbers are never read (only name, kind, balance, fee, units, price, currency).
   4. A profile kind (personal, family, business) for the data on this device, shown on the financial picture and the report;
      each profile is its own account on the device (accounts already keep their data apart and locked).
   5. Each insurance policy can keep one document (a photo or a PDF) – on this phone only, in the same private storage as the
      receipts archive. It is never uploaded. */
const F12_API = p => (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE && typeof SITE_BASE === 'string' ? SITE_BASE : '/') + p;
const f12Adm = () => typeof ADMIN_V !== 'undefined' && ADMIN_V && !(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE);

/* ================= 1a. the inbox from the server's private storage ================= */
ibLoad = async function(){
  const all = [];
  if (FB.db){
    try { const q = await FB.db.collection('feedback').get(); (q.docs || []).forEach(d => { const x = d.data() || {}, rp = x.rp || {}; (x.items || []).forEach(i => all.push(Object.assign({}, i, {src: 'app', doc: d.id, id: 'a' + d.id + i.at, rp: rp[String(i.at)]}))); }); } catch (e) {}
  }
  if (f12Adm()){
    try {
      const r = await fetch('/admin/inbox.json?v=' + Date.now(), {cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer'});
      if (r.ok && /json/.test(r.headers.get('content-type') || '')){ const j = await r.json(), key = await ibKey();
        for (const m of (j.m || []).slice(-500)){
          if (!key){ all.push({src: 'web', id: 'w' + m.id, at: (m.t || 0) * 1000, locked: 1}); continue; }
          try { const x = await ibUnlock(m.c, key); all.push(Object.assign({}, x, {src: 'web', id: 'w' + m.id, at: x.at || (m.t || 0) * 1000})); } catch (e) {}
        }
      }
    } catch (e) {}
  }
  const hide = (SET.ibHide || []);
  IB.list = all.filter(i => !hide.includes(i.id)).sort((a, b) => (b.at || 0) - (a.at || 0));
  return IB.list;
};

/* ================= 1b. family sign-in checked by the server ================= */
async function famAsk(h){
  const r = await fetch(F12_API('api/fam'), {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({h}), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
  if (r.status === 429) throw new Error('wait');
  if (!r.ok) throw new Error('net');
  const d = await r.json(); return !!(d && d.ok);
}
const famOk = () => { try { return RAWLS.getItem('fin-fam-ok') || ''; } catch (e) { return ''; } };
famFetch = async function(){
  if (f12Adm()){ try { const r = await fetch('/admin/fam?v=' + Date.now(), {cache: 'no-store', credentials: 'same-origin'}); if (r.ok){ const d = await r.json(); if (d && Array.isArray(d.m)) FAM.list = d; } } catch (e) {} }
  return FAM.list;
};
famHas = function(h){
  if (!h) return false;
  if (famOk() === h) return true;
  const L = FAM.list || famCached(); return !!(L && Array.isArray(L.m) && L.m.some(x => x && x.h === h));   // a phone signed in before this version, until it is checked again
};
famTry = async function(name, code){
  if (!name || famNorm(code).length < 14) return false;
  const h = await famHash(name, code); let ok = false;
  try { ok = await famAsk(h); } catch (e) { try { toast(t(String(e.message) === 'wait' ? 'fam12_wait' : 'fam12_net')); } catch (er) {} return false; }
  if (!ok) return false;
  try { RAWLS.setItem('fin-fam', h); RAWLS.setItem('fin-fam-ok', h); RAWLS.removeItem('fin-fam-list'); } catch (e) {}
  FAM.on = true; FAM.name = ''; famApply(); toast(t('fam_onAnon')); return true;
};
famPwTry = async function(user, pass){
  if (!user || !pass) return false;
  const h = await famPwHash(user, pass); let ok = false;
  try { ok = await famAsk(h); } catch (e) { return false; }
  if (!ok) return false;
  try { RAWLS.setItem('fin-fam', h); RAWLS.setItem('fin-fam-ok', h); RAWLS.removeItem('fin-fam-list'); } catch (er) {}
  FAM.on = true; FAM.name = ''; famApply(); toast(t('fam_onAnon')); return true;
};
famSave = async function(list){
  if (!f12Adm()) throw new Error('notoken');
  const r = await fetch('/admin/fam', {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify(list), credentials: 'same-origin'});
  if (!r.ok) throw new Error('gh' + r.status);
  FAM.list = list;
};
/* once after start: a phone in family mode is checked with the server; a clear "no" signs it out, no answer changes nothing */
setTimeout(async () => {
  let h = ''; try { h = RAWLS.getItem('fin-fam') || ''; } catch (e) {}
  if (!h || famOk() === h) return;
  try { const ok = await famAsk(h);
    if (ok){ try { RAWLS.setItem('fin-fam-ok', h); RAWLS.removeItem('fin-fam-list'); } catch (e) {} }
    else { try { RAWLS.removeItem('fin-fam'); RAWLS.removeItem('fin-fam-ok'); RAWLS.removeItem('fin-fam-list'); } catch (e) {} FAM.on = false; FAM.list = null; famApply(); }
  } catch (e) {}
}, 4000);

/* ================= 2. compound interest month by month ================= */
DEFS.compound.push(SEL('c_tbl', 'f_cTbl', 'year', [['year', 'o_ltYear'], ['month', 'o_ltMonth']], {adv: 'm_adv'}));
const calcC12 = CALC.compound;
CALC.compound = function(){
  const res = calcC12.apply(this, arguments);
  try {
    const sel = document.getElementById('c_tbl'), mode = (document.getElementById('c_mode') || {}).value;
    if (!sel || sel.value !== 'month' || !res || mode === 'dep') return res;
    const o = {p0: Math.max(0, v('c_init')), mo: Math.max(0, v('c_monthly')), rate: v('c_rate'), fee: Math.max(0, v('c_mgmt')),
      f: parseInt((document.getElementById('c_freq') || {}).value, 10) || 12, g: v('c_depG') / 100, yearly: Math.max(0, v('c_yearly')), start: (document.getElementById('c_time') || {}).value === 'start'};
    const n = Math.min(120, clamp(Math.round(v('c_years')), 1, 60) * 12), rows = [];
    let prev = o.p0;
    for (let m = 1; m <= n; m++){ const s = compSim(o, m); rows.push([String(m), M(s.dep), M(s.bal - s.dep), M(s.bal), M(s.bal - prev)]); prev = s.bal; }
    res.table = {title: t('c12_tbl', {n}), head: [t('c12_m'), t('h_deposited'), t('l_interest'), t('w_total'), t('c12_chg')], rows, open: true};
  } catch (e) {}
  return res;
};

/* ================= 3. importing a pension or investment report ================= */
var PI = null;
const PI_COL = {name: /שם|מוצר|קופה|קרן|נייר|תכנית|מסלול|fund|name|product|security/i, bal: /יתרה|צבירה|שווי|סכום|balance|value|amount/i, fee: /דמי ניהול|ניהול|fee/i,
  feeD: /מהפקדה|deposit/i, type: /סוג|type|kind/i, qty: /כמות|יחידות|units|qty|quantity/i, px: /שער|מחיר|price|rate/i, cur: /מטבע|currency/i, sym: /סימול|מספר נייר|symbol|ticker/i};
const PI_BAN = /ת[.״"]?ז|תעודת|זהות|מספר חשבון|חשבון|כרטיס|id number|account|card|iban/i;
function piType(s){ s = String(s || ''); return /פנסי|pension/i.test(s) ? 'pension' : /השתלמות|hishtalmut|study/i.test(s) ? 'hish' : /גמל|provident/i.test(s) ? 'gemel' : /ילד|child/i.test(s) ? 'kids' : /פיקדון|deposit/i.test(s) ? 'deposit' : /כספית|money market|mmf/i.test(s) ? 'mmf' : 'other'; }
function piHType(s){ s = String(s || ''); return /etf|סל/i.test(s) ? 'etf' : /אג["״]?ח|bond/i.test(s) ? 'bond' : /נאמנות|fund/i.test(s) ? 'fund' : /crypto|קריפטו/i.test(s) ? 'crypto' : /מזומן|cash/i.test(s) ? 'cash' : /us|ארה/i.test(s) ? 'stockUS' : 'stockIL'; }
const piNum = s => { const x = parseFloat(String(s == null ? '' : s).replace(/[,\s₪$€%]/g, '').replace(/[−–]/g, '-')); return isFinite(x) ? x : NaN; };
function piParse(rows){
  rows = (rows || []).filter(r => Array.isArray(r) && r.some(c => String(c || '').trim()));
  let hi = -1, map = null;
  for (let i = 0; i < Math.min(rows.length, 25) && hi < 0; i++){
    const m = {}; rows[i].forEach((c, j) => { const s = String(c || '').trim(); if (!s || PI_BAN.test(s)) return; Object.keys(PI_COL).forEach(k => { if (m[k] == null && PI_COL[k].test(s)){ if (k === 'fee' && m.fee != null) return; if (k === 'fee' && PI_COL.feeD.test(s)){ m.feeD = j; return; } m[k] = j; } }); });
    if (m.name != null && (m.bal != null || (m.qty != null && m.px != null))){ hi = i; map = m; }
  }
  if (hi < 0) return null;
  const hold = map.qty != null && map.px != null;
  const out = rows.slice(hi + 1).map(r => {
    const g = k => map[k] != null ? r[map[k]] : '';
    const name = String(g('name') || '').trim().slice(0, 40); if (!name || /סה["״]?כ|total/i.test(name)) return null;
    if (hold){ const q = piNum(g('qty')), p = piNum(g('px')); if (!(q > 0) || !(p > 0)) return null; const cur = String(g('cur') || 'ILS').trim().toUpperCase().replace('₪', 'ILS').replace('ש"ח', 'ILS').replace('שקל', 'ILS').slice(0, 3) || 'ILS';
      return {kind: 'hold', name, sym: String(g('sym') || '').trim().slice(0, 12), qty: q, px: p, cur: /^[A-Z]{3}$/.test(cur) ? cur : 'ILS', type: (t0 => t0 === 'stockIL' && /^[A-Z]{3}$/.test(cur) && cur !== 'ILS' ? 'stockUS' : t0)(piHType(g('type') + ' ' + name)), val: q * p}; }
    const b = piNum(g('bal')); if (!(b > 0)) return null;
    return {kind: 'sav', name, bal: b, fee: map.fee != null ? piNum(g('fee')) : NaN, type: piType(g('type') + ' ' + name)};
  }).filter(Boolean).slice(0, 200);
  return {hold, rows: out};
}
function piOpen(){
  if (!document.getElementById('pix')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="pix" hidden><div class="cp-box exp-box" role="dialog" aria-modal="true" aria-labelledby="pix_t"><div class="cp-top"><h3 id="pix_t"></h3><button type="button" class="cp-x" id="pix_x" aria-label="${asEsc(t('cp_close'))}">✕</button></div><div id="pix_b"></div></div></div>`);
  document.getElementById('pix_t').textContent = t('pi_t'); PI = null; piDraw();
  document.getElementById('pix').hidden = false; document.body.classList.add('cp-lock');
}
function piClose(){ const o = document.getElementById('pix'); if (o) o.hidden = true; document.body.classList.remove('cp-lock'); PI = null; }
function piDraw(msg){
  const b = document.getElementById('pix_b'); if (!b) return; const E = asEsc;
  if (!PI){ b.innerHTML = `<p class="fine">${E(t('pi_h'))}</p><label class="gold-btn pi-file">📄 ${E(t('pi_pick'))}<input type="file" id="pi_f" accept=".csv,.xlsx,.xls,.txt,text/csv" hidden></label><p class="fine" id="pi_msg" role="status">${E(msg || '')}</p><p class="fine">🔒 ${E(t('pi_priv'))}</p>`; return; }
  const n = PI.rows.filter(r => r.on).length;
  b.innerHTML = `<p class="fine">${E(t(PI.hold ? 'pi_foundH' : 'pi_foundS', {n: PI.rows.length, f: PI.file}))}</p><ul class="pi-l">${PI.rows.map((r, i) => `<li><label><input type="checkbox" data-pion="${i}"${r.on ? ' checked' : ''}> <b>${E(r.name)}</b>${r.dup ? ` <small class="pi-dup">${E(t('pi_dup'))}</small>` : ''}<small class="wi-sm">${E(r.kind === 'hold' ? t('pf_h_' + r.type) + ' · ' + N(r.qty, 2) + ' × ' + N(r.px, 2) + ' ' + r.cur : t('pf_s_' + r.type) + ' · ' + M(r.bal) + (isFinite(r.fee) ? ' · ' + t('mr_fee', {p: N(r.fee, 2)}) : ''))}</small></label></li>`).join('')}</ul>
    <div class="btnrow"><button type="button" class="gold-btn" id="pi_go"${n ? '' : ' disabled'}>${E(t('pi_add', {n}))}</button><button type="button" class="btn" id="pi_back">${E(t('pi_other'))}</button></div><p class="fine">${E(t('pi_note'))}</p>`;
}
async function piFile(f){
  piDraw(t('x2_reading'));
  try { const rows = await x2Read(f), P = piParse(rows); if (!P || !P.rows.length){ piDraw(t('pi_none')); return; }
    const d = pfD(), haveS = new Set(d.sav.map(x => String(x.name || '').trim() + '|' + Math.round(pfN(x.bal)))), haveH = new Set(d.hold.map(x => String(x.name || '').trim() + '|' + pfN(x.qty)));
    P.rows.forEach(r => { r.dup = r.kind === 'hold' ? haveH.has(r.name + '|' + r.qty) : haveS.has(r.name + '|' + Math.round(r.bal)); r.on = !r.dup; });
    PI = Object.assign(P, {file: f.name || ''}); piDraw();
  } catch (e) { piDraw(t(String(e && e.message) === 'xls' ? 'x2_oldXls' : 'x2_fail')); }
}
function piSave(){
  if (!PI) return; const d = pfD(), on = PI.rows.filter(r => r.on); if (!on.length) return;
  on.forEach(r => { if (r.kind === 'hold') d.hold.push({name: r.name, sym: r.sym, type: r.type, qty: String(r.qty), px: String(r.px), val: String(Math.round(r.val * 100) / 100), cur: r.cur, date: todayIso(), imp: 1});
    else d.sav.push({name: r.name, type: r.type, bal: String(Math.round(r.bal)), fee: isFinite(r.fee) ? String(r.fee) : '', imp: 1}); });
  if (PI.hold) PFT = 'hold'; else PFT = 'map';
  try { saveSet(); } catch (e) {} piClose(); try { pfRender(); } catch (e) {} toast(t('pi_done', {n: on.length}));
}
const pfRender12 = pfRender;
pfRender = function(){
  const r = pfRender12.apply(this, arguments);
  try { const root = document.getElementById('hr_portfolio'); if (root && !root.querySelector('#pi_open')) root.querySelector('.bk-tabs').insertAdjacentHTML('afterend', `<div class="btnrow pi-row"><button type="button" class="btn" id="pi_open">⬇️ ${asEsc(t('pi_btn'))}</button></div>`); } catch (e) {}
  return r;
};

/* ================= 4. the profile kind ================= */
const PROF_K = ['personal', 'family', 'business'];
function profCard(){
  const box = document.getElementById('fp_box'); if (!box || box.querySelector('.prof-c')) return; const E = asEsc, k = SET.profKind || 'personal';
  box.insertAdjacentHTML('afterbegin', `<div class="prof-c"><label for="prof_k">${E(t('prof_t'))}</label><select id="prof_k">${PROF_K.map(x => `<option value="${x}"${x === k ? ' selected' : ''}>${E(t('prof_' + x))}</option>`).join('')}</select><small class="wi-sm">${E(t('prof_h'))}</small></div>`);
}
const fpR12 = fpRender;
fpRender = function(){ const r = fpR12.apply(this, arguments); try { profCard(); } catch (e) {} return r; };
const mr12 = CALC.myreport;
CALC.myreport = function(){ const r = mr12.apply(this, arguments); try { if (r && r.hero) r.hero.sub = [t('prof_' + (SET.profKind || 'personal')), r.hero.sub].filter(Boolean).join(' · '); } catch (e) {} return r; };

/* ================= 5. a document on each insurance policy (on this phone only) ================= */
const mpR12 = mpRender;
mpRender = function(force){
  const r = mpR12.apply(this, arguments);
  try {
    const E = asEsc, L = mpList();
    document.querySelectorAll('#mp_box .lc-card').forEach((c, i) => { const x = L[i]; if (!x || c.querySelector('.mp-att')) return;
      c.insertAdjacentHTML('beforeend', `<div class="mp-att">${x.att ? `<button type="button" class="as-chip" data-mpview="${i}">📎 ${E(x.att.n)}</button><button type="button" class="as-chip" data-mpattdel="${i}" aria-label="${E(t('mpa_del', {x: x.att.n}))}">✕</button>`
        : `<label class="as-chip">📎 ${E(t('mpa_add'))}<input type="file" accept="image/*,application/pdf" data-mpatt="${i}" hidden></label>`}</div>`); });
  } catch (e) {}
  return r;
};
const mpKey = x => 'mp:' + (x.rid || (x.rid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)));
document.addEventListener('change', async e => {
  const el = e.target; if (!el || !el.dataset) return;
  if (el.id === 'pi_f' && el.files && el.files[0]){ piFile(el.files[0]); return; }
  if (el.dataset.pion != null && PI){ const r = PI.rows[+el.dataset.pion]; if (r){ r.on = el.checked; piDraw(); } return; }
  if (el.id === 'prof_k'){ SET.profKind = PROF_K.includes(el.value) ? el.value : 'personal'; try { saveSet(); } catch (er) {} return; }
  if (el.dataset.mpatt != null && el.files && el.files[0]){
    const x = mpList()[+el.dataset.mpatt], f = el.files[0]; if (!x) return;
    if (f.size > 8 * 1024 * 1024){ toast(t('mpa_big')); return; }
    try { await vtPut(mpKey(x), f); x.att = {n: String(f.name || 'doc').slice(0, 40), ty: f.type || '', sz: f.size}; saveSet(); mpRender(true); toast(t('mpa_ok')); } catch (er) { toast(t('vt_picFail')); }
  }
});
document.addEventListener('click', async e => {
  if (!e.target.closest) return; let b;
  if (e.target.closest('#pi_open')){ piOpen(); return; }
  if (e.target.closest('#pix_x') || (e.target.id === 'pix')){ piClose(); return; }
  if (e.target.closest('#pi_go')){ piSave(); return; }
  if (e.target.closest('#pi_back')){ PI = null; piDraw(); return; }
  if ((b = e.target.closest('[data-mpview]'))){ const x = mpList()[+b.dataset.mpview]; if (!x || !x.att) return; const blob = await vtGet(mpKey(x)); if (!blob){ toast(t('vt_picGone')); return; } const u = URL.createObjectURL(blob); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); return; }
  if ((b = e.target.closest('[data-mpattdel]'))){ const x = mpList()[+b.dataset.mpattdel]; if (!x) return; await vtDel(mpKey(x)); delete x.att; try { saveSet(); } catch (er) {} mpRender(true); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ const o = document.getElementById('pix'); if (o && !o.hidden) piClose(); } });
(function(){
  const st = document.createElement('style');
  st.textContent = '.pi-row{margin:8px 0}.pi-file{display:inline-flex;gap:6px;align-items:center;cursor:pointer}.pi-l{list-style:none;margin:8px 0;padding:0;max-height:50vh;overflow:auto}.pi-l li{padding:8px 0;border-top:1px solid var(--line);color:var(--ink)}.pi-l label{display:block}.pi-dup{color:var(--warn,#b45309)}'
    + '.prof-c{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:10px;color:var(--ink)}.prof-c select{min-height:40px;border:1px solid var(--line);border-radius:10px;padding:4px 8px;background:var(--surface);color:var(--ink);font:inherit}.prof-c small{flex-basis:100%}'
    + '.mp-att{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.mp-att label{cursor:pointer}';
  document.head.appendChild(st);
})();
