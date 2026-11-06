/* ---------- 13.87: an optional cloud copy of the account (sync between devices), documents in the cloud, delayed share prices ----------
   • Cloud copy: only for a signed-in account, only when the person turns it on with their password. The phone sends the same
     locked package that "move to another device" makes (the data is locked with the account password), so the server and the
     site's owner cannot read it. The account is found by a one-way fingerprint of the username; access needs a second
     fingerprint of the password (PBKDF2, 200,000 rounds), of which the server keeps only a hash.
   • Changes are sent a few seconds after they are saved; on another device, signing in with the same name and password pulls the
     copy. When both devices changed, each kind of data (settings, values, scenarios, expenses…) keeps the newer side, by the
     time it last changed – nothing is overwritten blindly. A plan ("free") is kept for later subscriptions.
   • Cloud documents: a file is locked on the phone with a random key kept inside the account's locked data (so a password
     change does not lose the files), and stored in parts. Its name is locked too.
   • Share prices: a holding with a symbol can take today's price from a free public source, delayed and marked as such, with the
     source and the time. Nothing about the person is sent – only the symbol. */
const SYC = {busy: false, t: null, st: '', plan: '', at: 0};
const syE = s => asEsc(s);
const syHex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
async function syId(name){ return syHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fin-cloud-id:v1:' + String(name).toLowerCase()))); }
async function syAuth(name, pw){ return syHex(await pbk(pw, new TextEncoder().encode('fin-cloud-auth:v1:' + String(name).toLowerCase()), 200000, 256)); }
const syKey = n => 'fin-cs:' + ENC_NAME(n);
function syGet(n){ try { return JSON.parse(RAWLS.getItem(syKey(n || FUSER)) || 'null'); } catch (e) { return null; } }
function sySet(o, n){ try { if (o) RAWLS.setItem(syKey(n || FUSER), JSON.stringify(o)); else RAWLS.removeItem(syKey(n || FUSER)); } catch (e) {} }
async function syCall(path, body){
  const r = await fetch(F12_API(path.slice(1)), {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
  let j = null; try { j = await r.json(); } catch (e) {}
  return {st: r.status, j: j || {}};
}
async function syPkg(){
  await persistNow();
  const rec = getAcc(FUSER), enc = RAWLS.getItem(encName(FUSER)); if (!rec || !enc) return null;
  return JSON.stringify({v: 1, name: FUSER, rec, enc: JSON.parse(enc), at: Date.now()});
}
/* the newer side of each kind of data wins */
async function syMerge(pkgStr){
  let P; try { P = JSON.parse(pkgStr); } catch (e) { return 'bad'; }
  const rec = getAcc(FUSER); if (!P || !P.enc || !rec) return 'bad';
  if (!P.rec || P.rec.esalt !== rec.esalt) return 'pw';
  const raw = SS.getItem('fin-ek'); let R;
  try { const key = await crypto.subtle.importKey('raw', u8(raw), 'AES-GCM', false, ['decrypt']); R = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(P.enc.iv)}, key, u8(P.enc.ct)))); } catch (e) { return 'pw'; }
  let lts = {}, rts = {}; try { lts = JSON.parse(SS.getItem(WK('__ts')) || '{}') || {}; } catch (e) {} try { rts = JSON.parse(R.__ts || '{}') || {}; } catch (e) {}
  let ch = 0;
  DATA_KEYS.forEach(k => { if (R[k] == null) return; const mine = SS.getItem(WK(k)); if (R[k] === mine) return;
    /* the settings hold the lists (policies, holdings, journal…): merged record by record, the newer copy of each wins */
    if (k === 'fin-set' && mine && typeof recMerge === 'function'){
      try { const A = JSON.parse(mine), B = JSON.parse(R[k]), rNew = (+rts[k] || 0) > (+lts[k] || 0), out = JSON.stringify(recMerge(rNew ? A : B, rNew ? B : A).out);
        if (out !== mine){ SS.setItem(WK(k), out); lts[k] = Math.max(+lts[k] || 0, +rts[k] || 0, Date.now()); ch++; } } catch (e) {}
      return; }
    if ((+rts[k] || 0) > (+lts[k] || 0)){ SS.setItem(WK(k), R[k]); lts[k] = rts[k]; ch++; } });
  if (ch){ SS.setItem(WK('__ts'), JSON.stringify(lts)); LIVE_FORCE = true; await persistNow(); }
  return ch ? 'changed' : 'same';
}
async function syPush(again){
  const c = syGet(); if (!FUSER || !c || !c.on || SYC.busy) return;
  SYC.busy = true;
  try {
    const pkg = await syPkg(); if (!pkg) return;
    if (pkg.length > 1900000){ SYC.st = 'sy_big'; syDraw(); return; }
    const {st, j} = await syCall('/api/acct/put', {id: c.id, auth: c.auth, pkg, base: c.ver || 0});
    if (st === 200){ c.ver = j.ver; c.at = Date.now(); sySet(c); SYC.plan = j.plan || 'free'; SYC.st = 'sy_ok'; }
    else if (st === 409 && j.pkg && !again){ const m = await syMerge(j.pkg); c.ver = j.ver; sySet(c); if (m === 'pw'){ SYC.st = 'sy_pw'; } else { SYC.busy = false; await syPush(true); if (m === 'changed'){ toast(t('sy_merged')); setTimeout(() => location.reload(), 1200); } return; } }
    else SYC.st = st === 403 ? 'sy_auth' : st === 429 ? 'sy_wait' : 'sy_net';
  } catch (e) { SYC.st = 'sy_net'; } finally { SYC.busy = false; }
  syDraw();
}
async function syPull(){
  const c = syGet(); if (!FUSER || !c || !c.on) return;
  try {
    const {st, j} = await syCall('/api/acct/get', {id: c.id, auth: c.auth});
    if (st === 200){ SYC.plan = j.plan || 'free';
      if ((+j.ver || 0) > (+c.ver || 0)){ const m = await syMerge(j.pkg); c.ver = j.ver; c.at = Date.now(); sySet(c);
        if (m === 'pw'){ SYC.st = 'sy_pw'; syDraw(); return; }
        if (m === 'changed'){ toast(t('sy_merged')); setTimeout(() => location.reload(), 1200); return; } }
      SYC.st = 'sy_ok'; await syPush();
    } else if (st === 404){ c.ver = 0; sySet(c); await syPush(); }
    else { SYC.st = st === 403 ? 'sy_auth' : 'sy_net'; }
  } catch (e) { SYC.st = 'sy_net'; }
  syDraw();
}
/* every save on this phone reaches the cloud a few seconds later */
(function(){
  const pn13 = persistNow;
  persistNow = async function(){ const r = await pn13.apply(this, arguments); try { const c = syGet(); if (c && c.on && !SYC.busy){ clearTimeout(SYC.t); SYC.t = setTimeout(() => syPush(), 8000); } } catch (e) {} return r; };
})();
/* signing in on a new device: no account here yet → look for its cloud copy */
(function(){
  const dl13 = doLogin;
  doLogin = async function(){
    try {
      const ui = $('#acc_user'), pi = $('#acc_pass'), name = hdNorm(String((ui || {}).value || '')), pw = String((pi || {}).value || '');
      if (name && pw && !getAcc(name) && window.crypto && crypto.subtle){
        accMsg('sy_look', null, true);
        const id = await syId(name), auth = await syAuth(name, pw), {st, j} = await syCall('/api/acct/get', {id, auth});
        if (st === 200 && j.pkg){ let P = null; try { P = JSON.parse(j.pkg); } catch (e) {}
          if (P && P.rec && P.enc){ sySet({on: 1, id, auth, ver: j.ver, at: Date.now()}, P.name || name); const r = await mvRestore(Object.assign(P, {name: P.name || name}), pw); if (r === 'ok') return; sySet(null, P.name || name); } }
      }
    } catch (e) {}
    return dl13.apply(this, arguments);
  };
})();

/* ---- cloud documents ---- */
async function sdKey(){
  if (!SET.sdKey){ SET.sdKey = b64(rnd(32)); saveSet(); }
  return crypto.subtle.importKey('raw', u8(SET.sdKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function sdLock(bytes){ const k = await sdKey(), iv = rnd(12), ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, k, bytes); return b64(iv) + '.' + b64(new Uint8Array(ct)); }
async function sdOpen(s){ const [a, b2] = String(s).split('.'), k = await sdKey(); return new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(a)}, k, u8(b2))); }
var SDC = {list: null, used: 0, max: 0, busy: ''};
async function sdList(){
  const c = syGet(); if (!c || !c.on) return;
  const {st, j} = await syCall('/api/doc/list', {id: c.id, auth: c.auth}); if (st !== 200) return;
  const L = [];
  for (const d of j.docs || []){ let name = '?'; try { name = new TextDecoder().decode(await sdOpen(d.name)); } catch (e) {} L.push(Object.assign({}, d, {nm: name})); }
  SDC.list = L; SDC.used = j.used || 0; SDC.max = j.max || 0; syDraw();
}
async function sdUpload(f){
  const c = syGet(); if (!c || !c.on) return;
  if (f.size > 6 * 1024 * 1024){ toast(t('sd_big')); return; }
  SDC.busy = 'up'; syDraw();
  try {
    const data = await sdLock(new Uint8Array(await f.arrayBuffer())), name = await sdLock(new TextEncoder().encode(JSON.stringify({n: String(f.name || 'file').slice(0, 60), t: f.type || ''})));
    const doc = syHex(rnd(16)), P = 900000, parts = Math.ceil(data.length / P);
    for (let n = 0; n < parts; n++){ const {st, j} = await syCall('/api/doc/put', {id: c.id, auth: c.auth, doc, n, parts, size: data.length, name, data: data.slice(n * P, (n + 1) * P)}); if (st !== 200){ toast(t(j.e === 'full' ? 'sd_full' : 'sd_fail')); return; } }
    toast(t('sd_ok'));
  } catch (e) { toast(t('sd_fail')); } finally { SDC.busy = ''; }
  await sdList();
}
async function sdDownload(d){
  const c = syGet(); if (!c || !c.on) return;
  SDC.busy = d.id; syDraw();
  try {
    let s = ''; for (let n = 0; n < d.parts; n++){ const {st, j} = await syCall('/api/doc/get', {id: c.id, auth: c.auth, doc: d.id, n}); if (st !== 200) throw new Error('get'); s += j.data; }
    const bytes = await sdOpen(s); let meta = {n: 'file', t: ''}; try { meta = JSON.parse(d.nm); } catch (e) {}
    const url = URL.createObjectURL(new Blob([bytes], {type: meta.t || 'application/octet-stream'})), a = document.createElement('a');
    a.href = url; a.download = meta.n || 'file'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { toast(t('sd_fail')); } finally { SDC.busy = ''; syDraw(); }
}

/* ---- the card in Settings › Account ---- */
function syDraw(){
  const host = document.getElementById('mv_open'); if (!host || !FUSER) return;
  const row = host.closest('.btnrow'); if (!row) return;
  let box = document.getElementById('sy_box'); if (!box){ row.insertAdjacentHTML('afterend', '<div class="sy-box" id="sy_box"></div>'); box = document.getElementById('sy_box'); }
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  const c = syGet(), E = syE;
  if (!c || !c.on){
    box.innerHTML = `<h3 class="sec-t">☁️ ${E(t('sy_t'))}</h3><p class="fine">${E(t('sy_h'))}</p>
      <div class="field wide"><label for="sy_pw">${E(t('sy_pwL'))}</label><input id="sy_pw" type="password" autocomplete="current-password" class="lookup"></div>
      <label class="al-k"><input type="checkbox" id="sy_agree"> ${E(t('sy_agree'))}</label>
      <div class="btnrow"><button type="button" class="gold-btn" id="sy_on">${E(t('sy_onB'))}</button></div><p class="gk-st" id="sy_st" role="status">${SYC.st ? E(t(SYC.st)) : ''}</p>`;
    return;
  }
  const docs = SDC.list;
  box.innerHTML = `<h3 class="sec-t">☁️ ${E(t('sy_t'))}</h3>
    <p class="gk-st ${SYC.st === 'sy_ok' ? 'ok' : SYC.st ? 'bad' : ''}" id="sy_st" role="status">${E(t(SYC.st || 'sy_on'))}${c.at ? ' · ' + E(t('sy_last', {d: new Date(c.at).toLocaleString()})) : ''}</p>
    <p class="fine">${E(t('sy_plan', {p: t('sy_plan_' + (SYC.plan || 'free'))}))}</p>
    <div class="btnrow"><button type="button" class="btn" id="sy_now">↻ ${E(t('sy_now'))}</button><button type="button" class="btn" id="sy_off">${E(t('sy_offB'))}</button><button type="button" class="btn danger" id="sy_del">${E(t(SYC.delAsk ? 'sy_delSure' : 'sy_delB'))}</button></div>
    <h4 class="ds-q">📁 ${E(t('sd_t'))}</h4>
    ${docs ? (docs.length ? `<ul class="sva-l">${docs.map((d, i) => { let m = {n: '?'}; try { m = JSON.parse(d.nm); } catch (e) {} return `<li><span><b>${E(m.n)}</b><small>${E(N(d.size / 1.37 / 1024, 0))} KB · ${E(new Date(d.at).toLocaleDateString())}</small></span><span class="lf-b"><button type="button" class="as-chip" data-sdget="${i}"${SDC.busy === d.id ? ' disabled' : ''}>⬇️</button><button type="button" class="as-chip" data-sddel="${i}" aria-label="${E(t('mpa_del', {x: m.n}))}">✕</button></span></li>`; }).join('')}</ul>` : `<p class="fine">${E(t('sd_none'))}</p>`) : `<p class="fine">${E(t('m_wait'))}</p>`}
    <div class="btnrow"><label class="gold-btn">＋ ${E(t(SDC.busy === 'up' ? 'sd_upNow' : 'sd_add'))}<input type="file" id="sd_f" hidden></label></div>
    <p class="fine">${E(t('sd_h', {u: N(SDC.used / 1.37 / 1048576, 1), m: N((SDC.max || 30 * 1048576 * 1.4) / 1.4 / 1048576, 0)}))}</p><p class="fine">🔒 ${E(t('sy_lock'))}</p>`;
}
document.addEventListener('click', async e => {
  if (!e.target.closest) return; let b;
  if (e.target.closest('#sy_on')){
    const pw = (document.getElementById('sy_pw') || {}).value || '', ag = document.getElementById('sy_agree'), rec = getAcc(FUSER);
    if (!ag || !ag.checked){ SYC.st = 'sy_needAgree'; syDraw(); return; }
    let ok = false; try { ok = (await hashPw(pw, u8(rec.salt), rec.iter || 200000)) === rec.hash; } catch (er) {}
    if (!ok){ SYC.st = 'm_bad'; syDraw(); return; }
    SYC.st = 'm_wait'; syDraw();
    sySet({on: 1, id: await syId(FUSER), auth: await syAuth(FUSER, pw), ver: 0, at: 0}); await syPull(); sdList(); return;
  }
  if (e.target.closest('#sy_now')){ await syPull(); sdList(); return; }
  if (e.target.closest('#sy_off')){ sySet(null); SYC.st = ''; SDC.list = null; syDraw(); toast(t('sy_offDone')); return; }
  if (e.target.closest('#sy_del')){ if (!SYC.delAsk){ SYC.delAsk = true; syDraw(); setTimeout(() => { SYC.delAsk = false; syDraw(); }, 6000); return; }
    const c = syGet(); SYC.delAsk = false; if (!c) return; const {st} = await syCall('/api/acct/del', {id: c.id, auth: c.auth}); if (st === 200 || st === 404){ sySet(null); SDC.list = null; SYC.st = ''; toast(t('sy_delDone')); } else { SYC.st = 'sy_net'; } syDraw(); return; }
  if ((b = e.target.closest('[data-sdget]'))){ const d = (SDC.list || [])[+b.dataset.sdget]; if (d) sdDownload(d); return; }
  if ((b = e.target.closest('[data-sddel]'))){ const d = (SDC.list || [])[+b.dataset.sddel], c = syGet(); if (!d || !c) return; await syCall('/api/doc/del', {id: c.id, auth: c.auth, doc: d.id}); sdList(); return; }
  if (e.target.closest('#pa_q')){ paQuotes(); return; }
});
document.addEventListener('change', e => { const el = e.target; if (el && el.id === 'sd_f' && el.files && el.files[0]) sdUpload(el.files[0]); });
/* draw the card whenever the account screen shows, and pull once after start */
setInterval(() => { try { if (FUSER && document.getElementById('mv_open') && !document.getElementById('sy_box')){ syDraw(); const c = syGet(); if (c && c.on && !SDC.list) sdList(); } } catch (e) {} }, 1500);
setTimeout(() => { try { syPull(); } catch (e) {} }, 3500);

(function(){ const al13 = applyLang; applyLang = function(){ const r = al13.apply(this, arguments); try { const bx = document.getElementById('sy_box'); if (bx){ bx.remove(); syDraw(); } } catch (e) {} return r; }; })();

/* ---- share prices (delayed) ---- */
async function paQuotes(){
  const d = pfD(), L = d.hold.filter(x => x.sym).slice(0, 25); if (!L.length){ toast(t('pq_noSym')); return; }
  let n = 0, skip = 0; toast(t('pq_wait'));
  for (const x of L){
    try { const r = await fetch(F12_API('api/q?s=' + encodeURIComponent(String(x.sym).trim())), {credentials: 'omit', referrerPolicy: 'no-referrer'}); const j = await r.json();
      if (!j || !j.ok){ skip++; continue; }
      const cur = x.cur && x.cur !== 'other' ? x.cur : 'ILS'; if (j.cur && j.cur !== cur){ skip++; continue; }
      x.px = String(Math.round(j.px * 10000) / 10000); x.qsrc = j.src; x.qat = j.at || Date.now(); x.date = new Date(x.qat).toISOString().slice(0, 10);
      if (pfN(x.qty) > 0) x.val = String(Math.round(pfN(x.qty) * j.px * 100) / 100); n++;
    } catch (e) { skip++; }
  }
  try { saveSet(); pfRender(); } catch (e) {}
  toast(t('pq_done', {n, s: skip}));
}
const pfHold13 = pfHold;
pfHold = function(v){
  const r = pfHold13.apply(this, arguments);
  try {
    const d = pfD(), E = asEsc;
    v.querySelectorAll('.rm-list > li.rm-it').forEach((li, i) => { const x = d.hold[i]; if (!x || !x.qsrc) return; const f = li.querySelector('.pfx > p.fine:last-of-type'); if (f) f.textContent = t('pq_src', {s: x.qsrc, d: new Date(x.qat).toLocaleString()}); });
    const pa = v.querySelector('.pa'); if (pa && !pa.querySelector('#pa_q') && d.hold.some(x => x.sym)) pa.querySelector('summary').insertAdjacentHTML('afterend', `<div class="btnrow"><button type="button" class="btn" id="pa_q">⟳ ${E(t('pq_btn'))}</button></div><p class="fine">${E(t('pq_h'))}</p>`);
  } catch (e) {}
  return r;
};

/* ---- the privacy page says what the cloud copy and the prices do ---- */
try {
  const P = LG_DOCS.priv.parts.find(p => p[0] === 'lg_p_extH'); if (P && !P[1].includes('lg_p_ext7')) P[1].push('lg_p_ext7', 'lg_p_ext8');
  const Hh = LG_DOCS.priv.parts.find(p => p[0] === 'lg_histH'); if (Hh && !Hh[1].includes('lg_h_p0611')) Hh[1].unshift('lg_h_p0611');
} catch (e) {}
(function(){
  const st = document.createElement('style');
  st.textContent = '.sy-box{margin:14px 0;border:1px solid var(--line);border-radius:16px;padding:12px 14px;background:var(--surface);color:var(--ink)}.sy-box .sva-l small{display:block;color:var(--ink-2)}.sy-box label.gold-btn{cursor:pointer;display:inline-flex;gap:6px;align-items:center}';
  document.head.appendChild(st);
})();
