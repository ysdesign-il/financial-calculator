var TX = null, TXL = '';
txBoot();
/* ================= init extras ================= */
const bottomEl = $('#bottom');
renderBottom(); renderTiles();
bottomEl.addEventListener('click', e => { const b = e.target.closest('.bt'); if (b) activate(b.dataset.tab); });
$('#back').addEventListener('click', () => activate('home'));
panelsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (!b) return;
  if (b.dataset.mode){ const m = $('#c_mode'); if (m) m.value = b.dataset.mode; }
  activate(b.dataset.go);
});
panelsEl.addEventListener('change', e => {
  const id = e.target.id;
  if (id === 'as_prov'){ SET.aiProv = e.target.value; SET.aiModel = ''; saveSet(); asCfgSync(); }
  else if (id === 'as_model'){ SET.aiModel = e.target.value.trim(); saveSet(); }
  else if (id === 'as_key'){ if (asProv() === 'gemini') SET.gkey = e.target.value.trim(); else SET.okey = e.target.value.trim(); saveSet(); }
});
panelsEl.addEventListener('input', e => {
  const el = e.target;
  if (el.classList && el.classList.contains('rng')){
    const n = $('#' + el.dataset.for); n.value = el.value; rangeFill(el);
    n.dispatchEvent(new Event('input', {bubbles: true}));
  } else if (el.id && RANGES[el.id]){
    const r = $(`.rng[data-for="${el.id}"]`); if (r){ r.value = el.value; rangeFill(r); }
  }
});
$$('.rng').forEach(rangeFill);
/* ================= init ================= */

/* ---- refresh ---- */
var gBtn = $('#gRefresh'), gStamp = $('#gStamp'), lastAt = null, lastOk = false;
function renderStamp(){
  if (typeof asPh === 'function') asPh();
  if (typeof fxSync === 'function') fxSync();
  if (!gStamp) return;
  const f = d => new Intl.DateTimeFormat(locOf(), {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(d);
  gStamp.textContent = lastAt ? t('st_stamp', {t: f(lastAt), s: lastOk ? t('st_live') : META.mkt ? t('st_mkt', {t: typeof rfDataTime === 'function' ? rfDataTime() : ''}) : META.official ? t('st_official', {d: fxDay(META.unix)}) : t('st_snap')}) : t('st_never');
}
function stampUpdate(ok){ lastAt = new Date(); lastOk = !!ok; renderStamp(); }
async function refreshAll(){
  if (!gBtn || gBtn.classList.contains('spin')) return;
  gBtn.classList.add('spin');
  try { await tryLive(true); calc(tab); } finally { gBtn.classList.remove('spin'); }
}
if (gBtn) gBtn.addEventListener('click', refreshAll);
var refTimer = null;
function schedRef(){ if (refTimer){ clearInterval(refTimer); refTimer = null; } const m = +SET.autoRef || 0; if (m > 0) refTimer = setInterval(() => { if (!document.hidden) tryLive(false); }, m * 60000); }
schedRef();
document.addEventListener('visibilitychange', () => { if (!document.hidden && lastAt && Date.now() - lastAt > 60000) tryLive(false); });
renderStamp();

/* ---- live mode for the converter ---- */
var liveTimer = null, liveFails = 0;
function liveStatus(msg){ const st = $('#x_status'); if (st) st.textContent = msg; }
async function liveTick(){
  if (document.hidden || tab !== 'convert') return;
  const ok = await tryLiveCrypto();
  if (ok){
    liveFails = 0;
    liveStatus(t('st_liveOn', {t: new Intl.DateTimeFormat(locOf(), {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date())}));
    stampUpdate(true);
  } else if (++liveFails >= 2){
    setLive(0); const s = $('#x_live'); if (s) s.value = '0';
    liveStatus(t('st_liveFail'));
  }
}
function setLive(sec){
  if (liveTimer){ clearInterval(liveTimer); liveTimer = null; }
  liveFails = 0;
  if (sec > 0){ liveStatus(t('st_loading')); liveTimer = setInterval(liveTick, sec * 1000); liveTick(); }
}
panelsEl.addEventListener('change', e => { if (e.target.id === 'x_live') setLive(parseInt(e.target.value, 10) || 0); });

/* ---- account: username + strong password, data encrypted at rest ---- */
const accKey = n => 'fin-acc:' + ENC_NAME(n);
const encName = n => 'fin-enc:' + ENC_NAME(n);
const pwChecks = p => ({len: p.length >= 8, up: /[A-Z]/.test(p), sp: /[^A-Za-z0-9\s]/.test(p)});
const pwOk = p => { const c = pwChecks(p); return c.len && c.up && c.sp; };
const accMsg = (k, params, ok) => { const e = $('#acc_msg'); if (!e) return; e.textContent = k ? t(k, params) : ''; e.classList.toggle('ok', !!ok); };
const accName = n => String(n || '').replace(/\s+/g, ' ').trim();
const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
async function pbk(pw, salt, iter, bits){
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter}, key, bits);
}
const hashPw = async (pw, salt, iter) => b64(await pbk(pw, salt, iter, 256));
const getAcc = n => { try { return JSON.parse(RAWLS.getItem(accKey(n)) || 'null'); } catch (e) { return null; } };
function lockLeft(n){
  try { const f = JSON.parse(RAWLS.getItem('fin-fail:' + accKey(n)) || '{"c":0,"t":0}'); return f.c >= 5 ? Math.max(0, Math.ceil((f.t + Math.min(900, 30 * Math.pow(2, f.c - 5)) * 1000 - Date.now()) / 1000)) : 0; } catch (e) { return 0; }
}
function noteFail(n, ok){
  const k = 'fin-fail:' + accKey(n);
  try { if (ok){ RAWLS.removeItem(k); return; } const f = JSON.parse(RAWLS.getItem(k) || '{"c":0,"t":0}'); f.c++; f.t = Date.now(); RAWLS.setItem(k, JSON.stringify(f)); } catch (e) {}
}
/* encrypt a key/value map with a raw AES key and store it */
async function sealMap(name, rawB64, map){
  const iv = rnd(12);
  const key = await crypto.subtle.importKey('raw', u8(rawB64), 'AES-GCM', false, ['encrypt']);
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(map)));
  const at = Date.now();
  RAWLS.setItem(encName(name), JSON.stringify({iv: b64(iv), ct: b64(ct), at, by: LIVE_ID}));
  LIVE_SEAL_AT = at;
}
async function persistNow(){
  if (!FUSER) return;
  const ek = SS.getItem('fin-ek'); if (!ek) return;
  const map = {}; DATA_KEYS.forEach(k => { const v = SS.getItem(WK(k)); if (v != null) map[k] = v; });
  const ts = SS.getItem(WK('__ts')); if (ts) map.__ts = ts;
  const j = JSON.stringify(map);
  if (!LIVE_FORCE && j === LIVE_SEALED && RAWLS.getItem(encName(FUSER))) return;     // nothing new: leave newer copies from other windows alone
  LIVE_FORCE = false;
  try { await sealMap(FUSER, ek, map); LIVE_SEALED = j; } catch (e) {}
}
/* unlock = decrypt stored data into the per-tab working copy, then start the session */
async function unlockSession(name, pw, rec, seed, rawP){
  if (!rec.esalt) rec.esalt = b64(rnd(16));
  const raw = b64(await (rawP || pbk(pw, u8(rec.esalt), 200000, 256)));
  const sfx = ':' + ENC_NAME(name);
  let map = {};
  try {
    const blob = JSON.parse(RAWLS.getItem(encName(name)) || 'null');
    if (blob){
      const key = await crypto.subtle.importKey('raw', u8(raw), 'AES-GCM', false, ['decrypt']);
      map = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(blob.iv)}, key, u8(blob.ct))));
    }
  } catch (e) { map = {}; }
  DATA_KEYS.forEach(k => { const old = RAWLS.getItem(k + sfx); if (old != null){ if (map[k] == null) map[k] = old; RAWLS.removeItem(k + sfx); } });
  Object.keys(seed || {}).forEach(k => { if (DATA_KEYS.includes(k)) map[k] = String(seed[k]); });
  RAWLS.setItem(accKey(name), JSON.stringify(rec));
  await sealMap(name, raw, map);
  Object.keys(map).forEach(k => SS.setItem('w:' + k + sfx, map[k]));
  SS.setItem('fin-user', name); SS.setItem('fin-ek', raw);
  try { RAWLS.removeItem('fin-user'); } catch (e) {}
  try { location.reload(); } catch (e) {}
}
async function doSignup(){
  if (!(window.crypto && crypto.subtle)) return accMsg('m_nocrypto');
  try { await PERM_P; await polInit(); } catch (e) {}
  if (!signupGlobalOpen()) return accMsg('m_closedAll');
  if (!signupAllowed()) return accMsg('m_closed');
  const name = hdNorm($('#acc_ruser').value), p = $('#acc_rpass').value, p2 = $('#acc_rpass2').value;
  if (!hdValid(name)) return accMsg('hd_bad');
  if (!pwOk(p)) return accMsg('m_weak');
  if (p !== p2) return accMsg('m_mismatch');
  if (getAcc(name)) return accMsg('m_exists');
  accMsg('hd_checking', null, true);
  if (!HD.ready) await hdInit();
  if (HD.ready){
    const r = await hdClaim(name);
    if (r !== 'ok') return accMsg({taken: 'hd_taken', noWrite: 'hd_noWrite'}[r] || 'hd_err', {n: '@' + name});
  }
  accMsg('m_wait', null, true);
  const salt = rnd(16), iter = 200000;
  const rec = {name, salt: b64(salt), hash: await hashPw(p, salt, iter), iter};
  try { await unlockSession(name, p, rec, {}); } catch (e) { accMsg('m_nocrypto'); }
}
async function doLogin(){
  if (!(window.crypto && crypto.subtle)) return accMsg('m_nocrypto');
  const name = hdNorm($('#acc_user').value), p = $('#acc_pass').value;
  const lk = lockLeft(name); if (lk > 0) return accMsg('m_lock', {s: lk});
  const rec = name ? getAcc(name) : null;
  accMsg('m_wait', null, true);
  let ok = false, rawP = null;
  /* the data key is worked out at the same time as the password check (both run off the main thread) – signing in takes half the time */
  if (rec && rec.esalt){ rawP = pbk(p, u8(rec.esalt), 200000, 256); rawP.catch(() => {}); }
  if (rec){ try { ok = (await hashPw(p, u8(rec.salt), rec.iter || 200000)) === rec.hash; } catch (e) { ok = false; } }
  else { try { await hashPw(p, new Uint8Array(16), 200000); } catch (e) {} }
  noteFail(name, ok);
  if (!ok) return accMsg('m_bad');
  try { await unlockSession(rec.name, p, rec, {}, rawP); } catch (e) { accMsg('m_nocrypto'); }
}
async function doChange(){
  const rec = getAcc(FUSER); if (!rec) return;
  const cur = $('#acc_cur').value, n1 = $('#acc_new').value, n2 = $('#acc_new2').value;
  const lk = lockLeft(FUSER); if (lk > 0) return accMsg('m_lock', {s: lk});
  let ok = false; try { ok = (await hashPw(cur, u8(rec.salt), rec.iter || 200000)) === rec.hash; } catch (e) {}
  noteFail(FUSER, ok);
  if (!ok) return accMsg('m_bad');
  if (!pwOk(n1)) return accMsg('m_weak');
  if (n1 !== n2) return accMsg('m_mismatch');
  const salt = rnd(16); rec.salt = b64(salt); rec.iter = 200000; rec.hash = await hashPw(n1, salt, rec.iter);
  rec.esalt = b64(rnd(16));
  const raw = b64(await pbk(n1, u8(rec.esalt), 200000, 256));
  if (rec.rcv){ try { rec.rcv.wk = await rcWrap(rec.rcv.pub, raw); } catch (e) {} }
  SS.setItem('fin-ek', raw);
  try { RAWLS.setItem(accKey(FUSER), JSON.stringify(rec)); } catch (e) {}
  await persistNow();
  ['acc_cur', 'acc_new', 'acc_new2'].forEach(id => { $('#' + id).value = ''; });
  updPwReq($('#acc_new')); accMsg('m_pwChanged', null, true); secLog(FUSER, 'pw');
}
function updPwReq(inp){
  const ul = $(`.pwreq[data-pw="${inp.id}"]`); if (!ul) return;
  const c = pwChecks(inp.value);
  $$('li', ul).forEach(li => li.classList.toggle('ok', !!c[li.dataset.r]));
}
function clearSession(){
  try {
    const rm = []; for (let i = 0; i < SS.length; i++){ const k = SS.key(i); if (k && (k.indexOf('w:') === 0 || k === 'fin-user' || k === 'fin-ek')) rm.push(k); }
    rm.forEach(k => SS.removeItem(k));
  } catch (e) {}
}
async function logoutNow(){ try { await persistNow(); } catch (e) {} clearSession(); try { location.reload(); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.hidden) persistNow(); });
window.addEventListener('pagehide', () => { persistNow(); });
panelsEl.addEventListener('click', e => {
  const b = e.target.closest('#acc_in, #acc_out, #acc_del, #acc_up, #acc_chg, #acc_tin, #acc_tup, #acc_tmv'); if (!b) return;
  if (b.id === 'acc_in') doLogin();
  else if (b.id === 'acc_up') doSignup();
  else if (b.id === 'acc_chg') doChange();
  else if (b.id === 'acc_out') logoutNow();
  else if (b.id === 'acc_tin' || b.id === 'acc_tup' || b.id === 'acc_tmv'){
    const m = {acc_tin: 'in', acc_tup: 'up', acc_tmv: 'mv'}[b.id];
    ['in', 'up', 'mv', 'rc'].forEach(k => { const f = $('#acc_f_' + k), tb = $('#acc_t' + k); if (f) f.hidden = k !== m; if (tb) tb.classList.toggle('on', k === m); });
    if (m === 'mv'){ MV.mode = 'recv'; mvRender(); }
    accMsg('');
  } else {
    if (!b.dataset.sure){ b.dataset.sure = '1'; b.textContent = t('b_sure'); return; }
    const sfx = ':' + ENC_NAME(FUSER), nm = FUSER;
    try { RAWLS.removeItem(accKey(nm)); RAWLS.removeItem(encName(nm)); RAWLS.removeItem('fin-fail:' + accKey(nm)); DATA_KEYS.forEach(k => RAWLS.removeItem(k + sfx)); } catch (err) {}
    (async () => {
      try { if (!HD.ready) await hdInit(); if (HD.ready){ const s = await HD.db.doc('claims/' + HD.uid).get(); if (s.exists && await claimIs(s.data(), nm)) await HD.db.doc('claims/' + HD.uid).delete(); } } catch (err) {}
      clearSession(); try { location.reload(); } catch (err) {}
    })();
  }
});
panelsEl.addEventListener('change', e => {
  if (e.target.id === 'acc_open') polSet(e.target.value === '1');
});
panelsEl.addEventListener('input', e => { if (e.target.type === 'password') updPwReq(e.target); });
panelsEl.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = e.target.id;
  if (id === 'acc_user' || id === 'acc_pass'){ e.preventDefault(); doLogin(); }
  else if (id === 'acc_ruser' || id === 'acc_rpass' || id === 'acc_rpass2'){ e.preventDefault(); doSignup(); }
});

/* ---- search + AI assistant ---- */
CALC.assist = () => null;
var asHist = [], asBusy = false;
const asNorm = s => String(s || '').toLowerCase().replace(/[֑-ׇً-ٟ]/g, '').trim();
function asNames(id){ const a = T['tab_' + id] || []; return a.map(asNorm).join(' ') + ' ' + id; }
function asSearch(q){
  q = asNorm(q);
  const box = $('#as_res'); if (!box) return;
  if (!q){ box.innerHTML = ''; return; }
  const words = q.split(/\s+/);
  const hit = TABS.filter(id => id !== 'assist' && words.every(w => asNames(id).includes(w) || asNorm(t('d_' + id)).includes(w)));
  box.innerHTML = hit.slice(0, 8).map(id => `<button type="button" class="tile" data-go="${id}">${ICON[id]}<span>${t('tab_' + id)}</span></button>`).join('') ||
    `<p class="hint">${t('as_none')}</p>`;
}
function asEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function asRender(){
  const log = $('#as_log'); if (!log) return;
  log.innerHTML = asHist.map(m => {
    let h = asEsc(m.text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); if (typeof pmLinkify === 'function') h = pmLinkify(h);
    if (m.role === 'ai') h = h.replace(/\[\[([a-z0-9]+)(?:\|([^\]]*))?\]\]/g, (_, id, f) => TABS.includes(id) && id !== 'assist' ? `<button type="button" class="as-go" data-go="${id}"${f ? ` data-aifill="${f}"` : ''}>${f ? t('pm_openWith', {n: t('tab_' + id)}) : t('tab_' + id)}</button>` : '');
    return `<div class="as-m ${m.role}">${h}</div>`;
  }).join('');
  log.scrollTop = log.scrollHeight; window.scrollTo(0, document.body.scrollHeight);
}
function asSystem(){
  const names = TABS.filter(id => id !== 'assist' && id !== 'settings').map(id => id + '=' + t('tab_' + id)).join('; ');
  const L = {he:'Hebrew', ar:'Arabic', en:'English'}[lang] || txEnName(lang);
  return 'You are a friendly personal finance assistant inside a calculator app used mostly in Israel. Answer briefly (max ~120 words) in ' + L + ' unless the user writes in another language. ' +
    'You may explain concepts and guide on which calculator fits. When a calculator below fits, mention it as [[id]] (for example [[mortgage]]). Do not invent numbers or tax rates; say when something should be checked with an accountant or official source. You are not a licensed financial adviser. ' +
    'Calculators: ' + names + '.';
}
var AS_MODELS = {claude:['quick','default','complex'], gemini:['gemini-flash-latest','gemini-2.5-pro','gemini-2.5-flash','gemini-2.5-flash-lite'], openai:['gpt-4o-mini','gpt-4o','gpt-5','gpt-5-mini']};
function asProv(){ return 'claude'; }
function asModel(){ return 'quick'; }
function asCfgSync(){ return;
  const p = asProv(), sel = $('#as_prov'); if (!sel) return;
  sel.value = p;
  const mi = $('#as_model'); mi.value = SET.aiModel || ''; mi.placeholder = AS_MODELS[p][0];
  $('#as_models').innerHTML = AS_MODELS[p].map(m => `<option value="${m}">`).join('');
  const kw = $('#as_kw'); kw.hidden = p === 'claude'; $('#as_key').value = p === 'gemini' ? (SET.gkey || '') : p === 'openai' ? (SET.okey || '') : '';
}
async function asAnswer(q){
  const src = asHist.filter(m => m.role !== 'err');
  if (src.length && src[src.length - 1].role === 'ai') src.pop();          // the "thinking…" placeholder is not part of the chat
  const hist = src.slice(-8).map(m => ({role: m.role === 'ai' ? 'assistant' : 'user', content: m.text}));
  while (hist.length && hist[0].role !== 'user') hist.shift();
  const p = asProv(), model = asModel();
  const eng = aiPick();
  if (eng === 'personal') return await pmSmart(q);
  if (eng === 'claude'){
    try { return await claudeAsk(hist.map((m, i) => i === 0 ? {role: 'user', content: asSystem() + '\n\nUser: ' + m.content} : m), {modelTier: 'default', cache: false}); }
    catch (e) { if (e && e.code === 'not_granted') return t('ai_denied') + '\n\n' + pmAnswer(q); throw e; }
  }
  if (eng === 'gemini'){ if (!gemKey()) throw new Error('noai'); return gemChat(hist.map((m, i) => i === 0 ? {role: 'user', content: asSystem() + '\n\nUser: ' + m.content} : m)); }
  try {
    if (p === 'gemini'){
      if (!gemKey()) throw new Error('nokey');
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method:'POST', headers:{'Content-Type':'application/json', 'x-goog-api-key': gemKey()},
        body: JSON.stringify({systemInstruction:{parts:[{text: asSystem()}]}, contents: hist.map(m => ({role: m.role === 'assistant' ? 'model' : 'user', parts:[{text: m.content}]}))})});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(x => x.text || '').join('').trim();
    }
    if (p === 'openai'){
      if (!(SET.okey || '').trim()) throw new Error('nokey');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization': 'Bearer ' + SET.okey.trim()},
        body: JSON.stringify({model, messages:[{role:'system', content: asSystem()}].concat(hist)})});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return (((j.choices || [])[0] || {}).message || {}).content.trim();
    }
  } catch (e) {
    if (e instanceof TypeError) throw new Error('blocked');
    throw e;
  }
  const sm = null;
  if (!sm){
    if ((SET.gkey || '').trim()) return gemChat(hist.map((m, i) => i === 0 ? {role: 'user', content: asSystem() + '\n\nUser: ' + m.content} : m));
    return pmAnswer(q);
  }
  const out = await sm(hist.map((m, i) => i === 0 ? {role:'user', content: asSystem() + '\n\nUser: ' + m.content} : m), {modelTier: model, cache:false});
  return (out && out.text || '').trim();
}
async function asSend(q){
  q = (q || '').trim(); if (!q || asBusy) return;
  asBusy = true; const btn = $('#as_ask'); if (btn) btn.disabled = true;
  asHist.push({role:'user', text:q}); asHist.push({role:'ai', text: t('as_think')}); asRender();
  try {
    const a = await asAnswer(q);
    asHist[asHist.length - 1] = {role:'ai', text: a || t('as_empty')};
  } catch (e) {
    asHist[asHist.length - 1] = {role:'err', text: aiErrText(e) || (e && e.code ? aiCodeText(e.code) : '') || t({noai:'as_noai', nokey:'as_nokey', blocked:'as_blocked', badkey:'as_badkey'}[e && e.message] || 'as_err', {e: (e && e.message) || ''})};
  }
  asBusy = false; if (btn) btn.disabled = false; asRender();
}
function asPh(){ if (AS_MODELS) asCfgSync(); const i = $('#as_q'); if (i) i.placeholder = t('as_ph'); asChips(); }
function asChips(){
  const c = $('#as_chips'); if (!c) return;
  c.innerHTML = ['as_c1', 'as_c2', 'as_c3', 'as_c4'].map(k => `<button type="button" class="as-chip" data-q="${k}">${t(k)}</button>`).join('');
}
panelsEl.addEventListener('input', e => { if (e.target.id === 'as_q') asSearch(e.target.value); });
panelsEl.addEventListener('keydown', e => { if (e.target.id === 'as_q' && e.key === 'Enter'){ e.preventDefault(); const q = e.target.value; e.target.value = ''; asSearch(''); asSend(q); } });
panelsEl.addEventListener('click', e => {
  if (e.target.closest('#as_ask')){ const i = $('#as_q'); const q = i.value; i.value = ''; asSearch(''); asSend(q); return; }
  const ch = e.target.closest('.as-chip'); if (ch) asSend(t(ch.dataset.q));
});
asPh();

/* ---- live home: track which calculators hold the user's own data ---- */
function touchFrom(e){
  if (!e.isTrusted) return;
  const el = e.target;
  if (!el || (el.classList && el.classList.contains('scn-name')) || /^(set_|as_|acc_)/.test(el.id || '')) return;
  const p = el.closest && el.closest('.panel');
  if (p && p.id.indexOf('panel-') === 0) touch(p.id.slice(6));
}
panelsEl.addEventListener('input', touchFrom, true);
panelsEl.addEventListener('change', touchFrom, true);
panelsEl.addEventListener('click', e => {
  if (!e.target.closest('#home_rem')) return;
  SET.remember = '1'; saveSet(); saveVals();
  const s = $('#set_remember'); if (s) s.value = '1';
  calc('home');
});
setInterval(() => { if (tab === 'home' && !document.hidden) calc('home'); }, 30000);

/* ---- official rates kept in the artifact's database (updated on a schedule by the owner) ---- */
function fxDay(u){ try { return new Intl.DateTimeFormat(locOf(), {day:'numeric', month:'numeric', timeZone:'Asia/Jerusalem'}).format(new Date(u * 1000)); } catch (e) { return ''; } }
function applyDbRates(d){
  if (!d || SET.boiDb === '0') return;
  let changed = false;
  const asOf = +d.asOf || 0;
  if (d.usd && typeof d.usd === 'object' && asOf > 0 && (asOf >= (META.unix || 0) || (!META.live && !META.mkt))){
    let n = 0;
    Object.keys(d.usd).forEach(k => {
      const v = +d.usd[k], old = RATES[k];
      if (!/^[A-Z]{3}$/.test(k) || !(v > 0)) return;
      if ((k === 'ILS' || k === 'JOD') ? SET.src_boiFx === '0' : SET.src_ecb === '0') return;
      if (old && (v / old < 0.5 || v / old > 2)) return;      // reject implausible jumps
      RATES[k] = v; n++;
    });
    if (n){ RATES.USD = 1; META.unix = asOf; META.official = true; META.live = false; META.mkt = false; changed = true; }
  }
  const cAsOf = +d.cryptoAsOf || 0;
  if (d.crypto && typeof d.crypto === 'object' && cAsOf > (META.cunix || 0)){
    let n = 0;
    Object.keys(d.crypto).forEach(k => {
      const v = +d.crypto[k], old = RATES[k];
      if (!CRYPTO[k] || !(v > 0)) return;
      if (old && (v / old < 0.2 || v / old > 5)) return;
      RATES[k] = v; n++;
    });
    if (n){ META.cunix = cAsOf; changed = true; }
  }
  if (changed){ fillCurSelects(); calc(tab); renderStamp(); }
}
var dbUnsub = null, dbState = 'wait', dbAsOf = 0;
async function dbSub(){
  if (dbUnsub){ try { dbUnsub(); } catch (e) {} dbUnsub = null; }
  if (SET.boiDb === '0'){ dbState = 'off'; liveStRender(); return; }
  try {
    if (!window.claude || typeof window.claude.use !== 'function'){ dbState = 'na'; liveStRender(); return; }
    const db = await window.claude.use('db');
    if (!db){ dbState = 'na'; liveStRender(); return; }
    if (SET.boiDb === '0') return;
    const u1 = db.doc('rates/latest').onSnapshot(s => {
      if (s && s.exists){ const d = s.data(); dbState = 'ok'; dbAsOf = +(d && d.asOf) || 0; applyDbRates(d); }
      else dbState = 'na';
      liveStRender();
    }, () => { dbState = 'na'; liveStRender(); });
    const u2 = db.doc('rates/macro').onSnapshot(s => { if (s && s.exists) applyMacro(s.data()); }, () => {});
    dbUnsub = () => { u1(); u2(); };
  } catch (e) { dbState = 'na'; liveStRender(); }
}
dbSub();

/* ---- live market feed: every second while online and visible (needs a page that may reach the rate server) ---- */
var fxTimer = null, fxFails = 0, fxOkAt = 0, fxBusy = false, fxCalcAt = 0;
function fxRecent(){ return Date.now() - (fxOkAt || 0) < 15000; }
function fxMs(){ return Math.max(1, +SET.fxInt || 1) * 1000; }
var fxKey = '', fxP = null;
function fxStatus(key, p){ fxKey = key || ''; fxP = p || null; $$('#fx_st, .fx-st').forEach(s => { s.textContent = key ? t(key, p) : ''; }); if (tab === 'settings') liveStRender(); }
async function fxTick(){
  fxTimer = null;
  if (SET.liveFx !== '1' || (SET.liveFiat === '0' && SET.liveCrypto === '0') || (!srcOk('fx', 'coinbase') && !srcOk('cr', 'coinbase'))) return;
  if (document.hidden){ return; }                       // resumes on visibilitychange
  if (navigator.onLine === false){ fxStatus('fx_offline'); fxTimer = setTimeout(fxTick, 5000); return; }
  if (fxBusy){ fxTimer = setTimeout(fxTick, 1000); return; }
  fxBusy = true; let ok = false;
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {signal: ctl.signal, cache: 'no-store'});
    clearTimeout(to);
    if (r.ok){
      const j = await r.json(), rt = j && j.data && j.data.rates;
      if (rt){
        let n = 0, nc = 0;
        Object.keys(rt).forEach(k => {
          const v = parseFloat(rt[k]), old = RATES[k];
          if (!(v > 0) || !old) return;
          if (typeof FXL === 'object' && FXL.pin[k] && Date.now() - FXL.pin[k] < 30000) return;   // a fresher interbank quote is already in
          const q = v / old, cr = !!CRYPTO[k];
          if (cr ? SET.liveCrypto === '0' : SET.liveFiat === '0') return;
          if (!srcOk(cr ? 'cr' : 'fx', 'coinbase')) return;               // the developer picked another source
          if (cr ? (q < 0.5 || q > 2) : (q < 0.8 || q > 1.25)) return;
          RATES[k] = v; if (typeof FXSRC === 'object') FXSRC[k] = {s: 'coinbase', at: Date.now()}; if (cr) nc++; else n++;
        });
        if (n + nc > 0){
          ok = true; RATES.USD = 1;
          const now = Math.floor(Date.now() / 1000);
          if (n){ META.live = true; META.official = false; META.unix = now; }
          if (nc){ META.cryptoLive = true; META.cunix = now; }
        }
      }
    }
  } catch (e) { /* blocked or offline */ }
  fxBusy = false;
  if (ok){
    fxFails = 0; fxOkAt = Date.now();
    fxStatus('fx_on', {n: t('o_fx' + (SET.fxInt || '1'))});
    lastAt = new Date(); lastOk = true; renderStamp();
    if (tab === 'home') renderMarket();
    else if (tab === 'convert') calc(tab);
    else if (Date.now() - fxCalcAt > 15000){ fxCalcAt = Date.now(); calc(tab); }
    fxTimer = setTimeout(fxTick, fxMs());
  } else {
    fxFails++;
    if (fxFails >= 3){ fxStatus('fx_blocked'); fxTimer = setTimeout(fxTick, 60000); }
    else fxTimer = setTimeout(fxTick, 1500);
  }
}
function fxStart(){ if (fxTimer){ clearTimeout(fxTimer); fxTimer = null; } fxFails = 0; if (SET.liveFx === '1'){ fxStatus('fx_conn'); fxTick(); } else fxStatus(''); }
function fxSync(){                         // by id and class (fast on a big page) instead of a selector list
  const by = (id, cls) => { const L = [...document.getElementsByClassName(cls)], e = document.getElementById(id); if (e && !L.includes(e)) L.unshift(e); return L; };
  by('fx_live', 'fx-live-cb').forEach(c => { c.checked = SET.liveFx === '1'; }); by('set_fxInt', 'fx-int-sel').forEach(s => { s.value = SET.fxInt || '1'; }); const s = $('#set_liveFx'); if (s) s.value = SET.liveFx; by('fx_st', 'fx-st').forEach(st => { st.textContent = fxKey ? t(fxKey, fxP) : ''; }); }
panelsEl.addEventListener('change', e => {
  if (e.target.id !== 'fx_live') return;
  SET.liveFx = e.target.checked ? '1' : '0'; saveSet(); fxSync();
  if (SET.liveFx !== '1'){ META.live = false; fxOkAt = 0; }
  fxStart(); if (tab === 'home') renderMarket();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && SET.liveFx === '1' && !fxTimer && !fxBusy) fxTick(); });
window.addEventListener('online', () => { if (SET.liveFx === '1'){ fxFails = 0; if (fxTimer) clearTimeout(fxTimer); fxTick(); } });
fxSync(); fxStart();

/* ---- settings: live connections status ---- */
var SRC_LINKS = {
  boiFx: [['src_site', 'https://www.boi.org.il/roles/markets/exchangerates/'], ['src_api', 'https://www.boi.org.il/PublicApi/GetExchangeRates']],
  boiInt: [['src_site', 'https://www.boi.org.il/roles/markets/exchangerates/'], ['src_api', 'https://www.boi.org.il/PublicApi/GetInterest']],
  cpi: [['src_site', encodeURI('https://www.cbs.gov.il/he/subjects/Pages/מדד-המחירים-לצרכן.aspx')]],
  ecb: [['src_site', 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'], ['src_api', 'https://api.frankfurter.dev/v1/latest?from=USD']],
  coinbase: [['src_site', 'https://www.coinbase.com'], ['src_api', 'https://api.coinbase.com/v2/exchange-rates?currency=USD']],
  binance: [['src_site', 'https://www.binance.com'], ['src_api', 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT']]
};
var CONNECTORS = [
  ['Twelve Data', 'conn_td', 'https://twelvedata.com'],
  ['Crypto.com', 'conn_cc', 'https://crypto.com'],
  ['Alpha Vantage', 'conn_av', 'https://www.alphavantage.co'],
  ['CoinMarketCap', 'conn_cmc', 'https://coinmarketcap.com'],
  ['FMP', 'conn_fmp', 'https://financialmodelingprep.com']
];
var srcLink = ([k, u]) => `<a class="src-a" href="${u}" target="_blank" rel="noopener noreferrer">${t(k)} ↗</a>`;
var SRC_ST = {boiFx: 'wait', boiInt: 'wait', ecb: 'wait'}, SRC_AT = {};
const SRC_KEY = {boiFx: 'src_boiFx', boiInt: 'src_boiInt', cpi: 'src_cpi', ecb: 'src_ecb', coinbase: 'liveFx', binance: 'src_binance'};
const srcOn = id => SET[SRC_KEY[id]] !== '0';
function liveStRender(){
  const box = $('#set_live_st'); if (!box || !SRC_LINKS) return;
  const tm = u => { try { return new Intl.DateTimeFormat(locOf(), {dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Jerusalem'}).format(new Date(u)); } catch (e) { return ''; } };
  const viaDb = dbState === 'ok' && SET.boiDb !== '0';
  const st = id => {
    if (!srcOn(id)) return ['off', t('st_off2')];
    if (id === 'coinbase'){
      if (SET.liveFiat === '0' && SET.liveCrypto === '0') return ['off', t('st_off2')];
      if (fxRecent()) return ['ok', t('ls_fxOk', {n: t('o_fx' + (SET.fxInt || '1')), t: hmTime()})];
      if (fxKey === 'fx_offline') return ['bad', t('ls_offline')];
      return fxKey === 'fx_blocked' ? ['bad', t('st_cbNa')] : ['wait', t('ls_conn')];
    }
    if (id === 'binance'){
      if (SET.liveCrypto === '0') return ['off', t('st_off2')];
      if (SRC_ST.binance === 'ok' && Date.now() - (SRC_AT.binance || 0) < 20000) return ['ok', t('ls_fxOk', {n: t('o_fx' + binIntKey()), t: tm(SRC_AT.binance)})];
      return SRC_ST.binance === 'blocked' ? ['bad', t('st_cbNa')] : ['wait', t('ls_conn')];
    }
    if (SRC_ST[id] === 'ok') return ['ok', t('st_direct', {t: tm(SRC_AT[id])})];
    if (id === 'cpi') return MKT.src === 'db' ? ['ok', t('st_viaApp', {d: MKT.cpiMonth + ' · ' + PC(MKT.cpi)})] : ['fix', t('st_saved', {v: PC(MKT.cpi) + ' · ' + MKT.cpiMonth})];
    if (id === 'boiInt' && MKT.srcI === 'db') return ['ok', t('st_viaApp', {d: PC(MKT.boi) + ' · ' + t('mk_boi_s', {d: MKT.boiDate, n: MKT.boiNext})})];
    if (id !== 'boiInt' && viaDb) return ['ok', t('st_viaApp', {d: tm(dbAsOf * 1000)})];
    if (SRC_ST[id] === 'wait') return ['wait', t('ls_conn')];
    return id === 'boiInt' ? ['fix', t('st_saved', {v: PC(MKT.boi)})] : ['bad', t('st_srcNa')];
  };
  const rows = [['boiFx', 'src_boiFx', 'fq_daily'], ['boiInt', 'src_boiInt', 'fq_decision'], ['cpi', 'src_cpi', 'fq_monthly'], ['ecb', 'src_ecb', 'fq_daily'], ['coinbase', 'src_cb', 'fq_live'], ['binance', 'src_bn', 'fq_live']];
  if (box.dataset.lang !== lang){
    box.dataset.lang = lang;
    box.innerHTML = rows.map(([id, name, fq]) => `<div class="src-c" data-src="${id}">
      <div class="src-h"><span class="ls-dot"></span><b>${t(name)}</b><span class="src-fq">${t(fq)}</span></div>
      <div class="src-s"></div>
      <div class="src-l"><button type="button" class="src-btn" data-src-t="${id}"></button>${SRC_LINKS[id].map(srcLink).join('')}</div></div>`).join('');
  }
  rows.forEach(([id]) => {
    const c = $(`.src-c[data-src="${id}"]`, box); if (!c) return;
    const [s, txt] = st(id), on = srcOn(id);
    $('.ls-dot', c).className = 'ls-dot ' + s;
    const e = $('.src-s', c); if (e.textContent !== txt) e.textContent = txt;
    const b = $('.src-btn', c), bt = t(on ? 'b_disc' : 'b_conn');
    if (b.textContent !== bt){ b.textContent = bt; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
  });
  const all = $('#src_all'); if (all){ const every = rows.every(([id]) => srcOn(id)); all.disabled = false; all.textContent = t(every ? 'b_connAgain' : 'b_connAll'); }
}
/* direct, key-free connections: work wherever the page may reach the servers (saved file, own site) */
async function getJSON(u){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000);
  try { const r = await fetch(u, {signal: ctl.signal, cache: 'no-store'}); if (!r.ok) throw new Error('http'); return await r.json(); }
  finally { clearTimeout(to); }
}
function applyUsd(upd, asOf){
  let n = 0;
  if (fxRecent() && SET.liveFiat !== '0') return 0;            // live market rates are fresher
  Object.keys(upd).forEach(k => { const v = +upd[k], old = RATES[k]; if (!(v > 0) || !old) return; const q = v / old; if (q < 0.8 || q > 1.25) return; RATES[k] = v; n++; });
  if (n){ RATES.USD = 1; META.official = true; META.live = false; if (asOf > 0) META.unix = asOf; fillCurSelects(); }
  return n;
}
async function pullBoiFx(){
  if (!srcOn('boiFx')){ SRC_ST.boiFx = 'off'; return; }
  try {
    const a = await getJSON('https://www.boi.org.il/PublicApi/GetExchangeRates');
    const list = Array.isArray(a) ? a : (a && (a.exchangeRates || a.ExchangeRates)) || [];
    const usd = list.find(x => x.key === 'USD'); if (!usd) throw new Error('fmt');
    const ils = +usd.currentExchangeRate / (+usd.unit || 1);
    if (!(ils > 2 && ils < 6)) throw new Error('fmt');
    const upd = {ILS: ils};
    list.forEach(x => { const r = +x.currentExchangeRate / (+x.unit || 1); if (x.key && x.key !== 'USD' && r > 0.01) upd[x.key] = ils / r; });
    applyUsd(upd, Math.floor(Date.parse(usd.lastUpdate) / 1000) || 0);
    SRC_ST.boiFx = 'ok'; SRC_AT.boiFx = Date.now();
  } catch (e) { SRC_ST.boiFx = 'blocked'; }
}
async function pullBoiInt(){
  if (!srcOn('boiInt')){ SRC_ST.boiInt = 'off'; return; }
  try {
    const d = await getJSON('https://www.boi.org.il/PublicApi/GetInterest');
    const r = +d.currentInterest; if (!(r >= 0 && r < 15)) throw new Error('fmt');
    const old = MKT.boi; MKT.boi = r;
    const isoIL = s => { try { return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Jerusalem'}).format(new Date(s)); } catch (e) { return ''; } };
    if (d.lastPublishedDate) MKT.boiDate = dmy(isoIL(d.lastPublishedDate)) || MKT.boiDate;
    if (d.nextInterestDate) MKT.boiNext = dmy(isoIL(d.nextInterestDate)) || MKT.boiNext;
    const f = $('#pr_boi'); if (f && (+f.value === old || f.value === '')) f.value = MKT.boi;
    SRC_ST.boiInt = 'ok'; SRC_AT.boiInt = Date.now(); MKT.srcI = 'live';
  } catch (e) { SRC_ST.boiInt = 'blocked'; }
}
async function pullEcb(){
  if (!srcOn('ecb')){ SRC_ST.ecb = 'off'; return; }
  try {
    const d = await getJSON('https://api.frankfurter.dev/v1/latest?from=USD');
    if (!d || !d.rates) throw new Error('fmt');
    const upd = Object.assign({}, d.rates);
    if (SRC_ST.boiFx === 'ok' || SET.src_boiFx !== '0') delete upd.ILS;   // the Bank of Israel rate leads for the shekel
    applyUsd(upd, d.date ? Math.floor(Date.parse(d.date + 'T14:00:00Z') / 1000) : 0);
    SRC_ST.ecb = 'ok'; SRC_AT.ecb = Date.now();
  } catch (e) { SRC_ST.ecb = 'blocked'; }
}
async function pullAll(){
  await Promise.all([pullBoiFx(), pullBoiInt(), pullEcb()]);
  liveStRender(); if (tab === 'home') renderMarket(); else calc(tab);
}
function connectAll(){
  SET.src_boiFx = SET.src_boiInt = SET.src_cpi = SET.src_ecb = SET.src_binance = '1'; SET.liveFx = '1'; SET.boiDb = '1';
  if (SET.liveFiat === '0' && SET.liveCrypto === '0'){ SET.liveFiat = SET.liveCrypto = '1'; }
  saveSet();
  ['boiFx', 'boiInt', 'ecb'].forEach(k => { SRC_ST[k] = 'wait'; });
  dbSub(); fxStart(); binStart(); fxSync(); liveStRender(); pullAll();
}
panelsEl.addEventListener('click', e => {
  if (e.target.closest('#src_all')){ connectAll(); return; }
  const b = e.target.closest('[data-src-t]'); if (!b) return;
  const id = b.dataset.srcT, k = SRC_KEY[id], on = !srcOn(id);
  SET[k] = on ? '1' : '0';
  if (on && SET.boiDb === '0' && id !== 'coinbase') SET.boiDb = '1';
  saveSet();
  if (id === 'coinbase'){ if (!on){ META.live = false; fxOkAt = 0; } fxStart(); fxSync(); }
  else if (id === 'binance'){ binStart(); }
  else if (on){ SRC_ST[id] = 'wait'; dbSub(); ({boiFx: pullBoiFx, boiInt: pullBoiInt, ecb: pullEcb}[id] || (async () => {}))().then(() => { liveStRender(); calc(tab); }); }
  else { SRC_ST[id] = 'off'; dbSub(); }
  liveStRender();
});
setInterval(() => { if (!document.hidden) pullAll(); }, 10 * 60000);
pullAll();
setInterval(() => { if (tab === 'settings' && !document.hidden) liveStRender(); }, 1000);
liveStRender();

/* ---- Bank of Israel interest rate and CPI from the database (filled by the owner's scheduled update) ---- */
var macroAt = 0;
function monthName(m){ try { return new Intl.DateTimeFormat(locOf(), {month:'long'}).format(new Date(2026, (m || 1) - 1, 15)); } catch (e) { return String(m); } }
const dmy = iso => { const p = String(iso || '').slice(0, 10).split('-'); return p.length === 3 ? (+p[2]) + '.' + (+p[1]) + '.' + p[0] : ''; };
function applyMacro(d){
  if (!d || SET.boiDb === '0') return;
  const oldBoi = MKT.boi;
  const boi = +d.boi, useI = SET.src_boiInt !== '0', useC = SET.src_cpi !== '0';
  if (useI && boi >= 0 && boi < 20){ MKT.boi = boi; }
  if (useI && d.boiDate) MKT.boiDate = dmy(d.boiDate) || MKT.boiDate;
  if (useI && d.boiNext) MKT.boiNext = dmy(d.boiNext) || MKT.boiNext;
  const c = +d.cpi12; if (useC && isFinite(c) && Math.abs(c) < 30) MKT.cpi = c;
  if (useC && /^\d{4}-\d{2}$/.test(d.cpiMonth || '')){ const [y, m] = d.cpiMonth.split('-'); MKT.cpiMonth = m + '/' + y;
    const ytd = +d.cpiYtd; if (isFinite(ytd) && Math.abs(ytd) < 30 && +y === 2026){ MKT.cpiYtd = ytd; MKT.cpiYtdTo = +m; INFL_IL[2026] = ytd; } }
  const f95 = +d.fuel95; if (isFinite(f95) && f95 >= 5 && f95 <= 13 && typeof IL26 === 'object'){ IL26.fuel95 = f95; MKT.fuelMonth = d.fuelMonth || ''; }     // the monthly regulated petrol price
  if (useI) MKT.srcI = 'db'; if (useC) MKT.src = 'db'; macroAt = +d.asOf || 0;
  // keep the prime calculator in step unless the user typed their own rate
  const f = $('#pr_boi'); if (f && (+f.value === oldBoi || f.value === '')) f.value = MKT.boi;
  if (tab === 'home') renderMarket(); else calc(tab);
  liveStRender();
}

/* ---- tidy navigation: collapsible categories in the side menu, category filter on the home screen ---- */
var NAV_OPEN = {};
function navAcc(){
  $$('.grp', navEl).forEach(g => {
    const l = $('.grp-l', g); if (!l) return;
    const gk = g.dataset.g || (g.dataset.g = l.dataset.i);
    if (gk !== 'g_main' && gk !== 'g_all' && T['gs_' + gk.slice(2)]){ l.dataset.i = 'gs_' + gk.slice(2); l.textContent = t(l.dataset.i); }
    if (gk === 'g_main' || gk === 'g_all'){ g.classList.remove('acc', 'open'); return; }
    g.classList.add('acc');
    let h = $('.grp-h', g);
    if (!h){
      h = document.createElement('button'); h.type = 'button'; h.className = 'grp-h';
      l.parentNode.insertBefore(h, l); h.appendChild(l);
      h.insertAdjacentHTML('beforeend', '<span class="grp-n"></span><svg class="grp-c" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
      h.addEventListener('click', () => { const o = !g.classList.contains('open'); NAV_OPEN[gk] = o; g.classList.toggle('open', o); h.setAttribute('aria-expanded', String(o)); });
    }
    const open = !!$('#tab-' + tab, g) || !!(NAV_OPEN || {})[gk];
    g.classList.toggle('open', open); h.setAttribute('aria-expanded', String(open));
    $('.grp-n', g).textContent = $$('.tab', g).length;
  });
}
navAcc();
panelsEl.addEventListener('click', e => {
  const c = e.target.closest('.tchip'); if (!c) return;
  TILE_F = c.dataset.tf; renderTiles();
});

/* ---- converter: searchable currency picker + live controls ---- */
var CP_FOR = null, CP_F = 'all', CP_IDX = {};
const DN3 = ['he', 'ar', 'en'].map(l => { try { return new Intl.DisplayNames([l], {type:'currency'}); } catch (e) { return null; } });
function cpKey(c){
  if (CP_IDX[c]) return CP_IDX[c];
  const names = CRYPTO[c] ? CRYPTO[c].slice() : DN3.map(d => { try { return d ? d.of(c) : ''; } catch (e) { return ''; } });
  return (CP_IDX[c] = (c + ' ' + names.join(' ')).toLowerCase().replace(/[֑-ׇً-ٟ״"׳']/g, ''));
}
function cpLabel(c){ return `<b>${c}</b><span>${curName(c)}</span>`; }
function cpSync(){ ['x_from', 'x_to'].forEach(id => { const s = $('#' + id), b = $('#cpb_' + id); if (s && b) b.innerHTML = cpLabel(s.value) + '<svg class="cp-ch" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'; }); }
function cpInit(){
  ['x_from', 'x_to'].forEach(id => {
    const s = $('#' + id); if (!s || $('#cpb_' + id)) return;
    s.classList.add('cp-native'); s.tabIndex = -1; s.setAttribute('aria-hidden', 'true');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cp-btn'; b.id = 'cpb_' + id;
    b.setAttribute('aria-haspopup', 'dialog');
    s.insertAdjacentElement('afterend', b);
    const l = s.closest('.field') && $('label', s.closest('.field')); if (l) l.setAttribute('for', b.id);
  });
  if (!$('#cp')){
    document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="cp" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="cp_t">
      <div class="cp-top"><h3 id="cp_t"></h3><button type="button" class="cp-x" id="cp_x">×</button></div>
      <input id="cp_q" type="search" autocomplete="off" spellcheck="false">
      <div class="cp-tabs" id="cp_tabs"></div><div class="cp-list" id="cp_list" role="listbox"></div></div></div>`);
    const ov = $('#cp');
    ov.addEventListener('click', e => {
      if (e.target === ov || e.target.closest('#cp_x')) return cpClose();
      const it = e.target.closest('.cp-it'); if (it) return cpPick(it.dataset.c);
      const tb = e.target.closest('.cp-tab'); if (tb){ CP_F = tb.dataset.f; cpRender(); $('#cp_q').focus(); }
    });
    $('#cp_q').addEventListener('input', cpRender);
    ov.addEventListener('keydown', e => {
      if (e.key === 'Escape'){ e.preventDefault(); cpClose(); return; }
      const items = $$('.cp-it', ov), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0] || {focus(){}}).focus(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); if (i <= 0) $('#cp_q').focus(); else items[i - 1].focus(); }
      else if (e.key === 'Enter' && document.activeElement === $('#cp_q')){ e.preventDefault(); if (items[0]) cpPick(items[0].dataset.c); }
    });
  }
  cpSync();
}
function cpOpen(id){
  CP_FOR = id; CP_F = 'all';
  $('#cp_t').textContent = t(id === 'x_from' ? 'f_from' : 'f_to');
  $('#cp_x').setAttribute('aria-label', t('cp_close'));
  const q = $('#cp_q'); q.value = ''; q.placeholder = t('cp_ph');
  $('#cp').hidden = false; document.body.classList.add('cp-lock');
  cpRender(); setTimeout(() => q.focus(), 30);
}
function cpClose(){ $('#cp').hidden = true; document.body.classList.remove('cp-lock'); const b = CP_FOR && $('#cpb_' + CP_FOR); CP_FOR = null; if (b) b.focus(); }
function cpPick(c){
  const s = $('#' + CP_FOR); if (!s) return cpClose();
  if (![...s.options].some(o => o.value === c)) s.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
  s.value = c; s.dispatchEvent(new Event('change', {bubbles: true}));
  cpSync(); cpClose();
}
function cpRender(){
  const box = $('#cp_list'); if (!box) return;
  const q = $('#cp_q').value.trim().toLowerCase().replace(/[֑-ׇً-ٟ״"׳']/g, '');
  const cur0 = $('#' + CP_FOR) ? $('#' + CP_FOR).value : '';
  $('#cp_tabs').innerHTML = [['all', 'cp_all'], ['fiat', 'cp_fiat'], ['crypto', 'cp_crypto']].map(([f, k]) =>
    `<button type="button" class="cp-tab${f === CP_F ? ' on' : ''}" data-f="${f}" aria-pressed="${f === CP_F}">${t(k)}</button>`).join('');
  const ok = c => RATES[c] && (CP_F === 'all' || (CP_F === 'crypto') === !!CRYPTO[c]);
  const base = baseCur || 'ILS';
  const val = c => { const v = RATES[base] / RATES[c]; return isFinite(v) ? M(v, dec(v, base), base) : ''; };
  const item = c => `<button type="button" class="cp-it${c === cur0 ? ' on' : ''}" role="option" aria-selected="${c === cur0}" data-c="${c}">${cpLabel(c)}<small class="num">${c === base ? '' : '1 ' + c + ' = ' + val(c)}</small></button>`;
  const head = k => `<div class="cp-h">${t(k)}</div>`;
  let html = '';
  if (q){
    const words = q.split(/\s+/);
    const hits = Object.keys(RATES).filter(c => ok(c) && words.every(w => cpKey(c).includes(w)));
    const popL = pinList();
    const rank = c => { const k = c.toLowerCase(); if (k === q) return 0; if (k.startsWith(q)) return 1;
      const starts = cpKey(c).split(/\s+/).some(w => w.startsWith(words[0]));
      return (starts ? 2 : 4) - (popL.includes(c) ? 1 : 0); };
    const pi = c => { const i = popL.indexOf(c); return i < 0 ? 999 : i; };
    hits.sort((a, b) => rank(a) - rank(b) || pi(a) - pi(b) || curName(a).localeCompare(curName(b)));
    html = hits.length ? hits.map(item).join('') : `<p class="cp-none">${t('cp_none')}</p>`;
  } else {
    let cmp; try { cmp = new Intl.Collator(locOf()).compare; } catch (e) { cmp = (a, b) => a < b ? -1 : 1; }
    const pop = pinList().filter(c => ok(c) && !CRYPTO[c]);
    const fiat = Object.keys(RATES).filter(c => ok(c) && !CRYPTO[c] && !pop.includes(c)).sort((a, b) => cmp(curName(a), curName(b)));
    const cry = Object.keys(CRYPTO).filter(ok);
    if (pop.length) html += head('cp_pop') + pop.map(item).join('');
    if (cry.length) html += head('cp_crypto') + cry.map(item).join('');
    if (fiat.length) html += head('cp_allFiat') + fiat.map(item).join('');
  }
  box.innerHTML = html;
}
function cvLiveInit(){
  const f = $('#x_refresh') && $('#x_refresh').closest('.field'); if (!f || $('.cv-live')) return;
  f.insertAdjacentHTML('afterend', `<div class="field wide cv-live"><div class="cv-row">
    <label class="mk-sw"><input type="checkbox" class="fx-live-cb"><span class="mk-knob" aria-hidden="true"></span><span data-i="fx_live"></span></label>
    <select class="fx-int-sel" aria-label="${t('f_fxInt')}">${['1','5','15','30','60'].map(n => `<option value="${n}" data-i="o_fx${n}">${t('o_fx' + n)}</option>`).join('')}</select></div>
    <small class="hint fx-st" aria-live="polite"></small><small class="hint" data-i="h_cvLive"></small></div>`);
  $$('[data-i]', $('.cv-live')).forEach(el => { el.textContent = t(el.dataset.i); });
  fxSync();
}
panelsEl.addEventListener('click', e => {
  const b = e.target.closest('.cp-btn'); if (b) cpOpen(b.id.slice(4));
  if (e.target.closest('#x_refresh') && SET.liveFx === '1') fxStart();
});
panelsEl.addEventListener('change', e => {
  const el = e.target;
  if (el.classList.contains('fx-live-cb')){ SET.liveFx = el.checked ? '1' : '0'; saveSet(); if (SET.liveFx !== '1'){ META.live = false; fxOkAt = 0; } fxStart(); fxSync(); calc(tab); }
  else if (el.classList.contains('fx-int-sel')){ SET.fxInt = el.value; saveSet(); fxStart(); fxSync(); }
  else if (el.id === 'x_from' || el.id === 'x_to') cpSync();
});
const _calcConvert = CALC.convert;
CALC.convert = function(){ cpSync(); return _calcConvert(); };
cpInit(); cvLiveInit();

/* ---- personal explainer: plain-language explanations of every calculator, field and result ---- */
var EX = {id: null, hist: [], busy: false, ctl: null}, EX_CACHE = {};
const EX_SKIP = ['home', 'settings', 'assist', 'expenses', 'clients'];
const exClean = s => String(s == null ? '' : s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function exFields(id){
  const p = $('#panel-' + id); if (!p) return [];
  const out = [];
  $$('.field', p).forEach(f => {
    if (f.closest('[hidden]') || f.offsetParent === null && !f.closest('details')) return;
    const l = $('label', f), c = $('input[id]:not([type=range]):not(.scn-name),select[id]', f);
    if (!l || !c) return;
    let val = c.tagName === 'SELECT' ? (c.selectedOptions[0] ? c.selectedOptions[0].textContent : c.value) : c.value;
    const u = $('.u', f); if (u && c.tagName !== 'SELECT' && val !== '') val += ' ' + u.textContent;
    const h = $('.hint', f);
    out.push({label: exClean(l.textContent), value: exClean(val), hint: h ? exClean(h.textContent) : ''});
  });
  return out.slice(0, 30);
}
function exResults(id){
  const r = LAST[id]; if (!r || !r.hero) return null;
  return {main: exClean(r.hero.label) + ': ' + exClean(r.hero.value), rows: (r.rows || []).slice(0, 14).map(x => exClean(x[0]) + ': ' + exClean(x[1])),
          note: exClean(r.note || ''), warn: (r.warn || []).map(exClean).join(' ')};
}
function exLangName(){ return {he: 'Hebrew', ar: 'Arabic', en: 'English'}[lang] || (txEnName(lang) + ' (language code ' + lang + ')'); }
function exSystem(){
  return 'You are a warm personal guide inside an Israeli personal-finance calculator app. Explain things to someone with no financial background, in ' + exLangName() + '. ' +
    'Rules: short, plain sentences; no jargon — when a professional term is unavoidable, explain it in a few words right away; use the person\'s actual numbers from the context; ' +
    'use a simple everyday example when it helps; never invent tax rates or figures that are not in the context; if something depends on personal circumstances, say who to ask (an accountant, the bank, the Tax Authority, Bituach Leumi). ' +
    'This is general explanation, not personal financial advice — say so once, briefly, at the end. Formatting: short paragraphs, "- " bullets, **bold** for key terms. No tables, no headings with #.';
}
function exContext(id, field){
  const fs = exFields(id), res = exResults(id);
  let s = 'Calculator: ' + t('tab_' + id) + '\nWhat it does: ' + t('d_' + id) + '\nThe fields and the values the person entered:\n' +
    fs.map(f => '- ' + f.label + ': ' + (f.value || '(empty)') + (f.hint ? ' (hint: ' + f.hint + ')' : '')).join('\n');
  if (res) s += '\nCurrent result: ' + res.main + '\nResult details:\n' + res.rows.map(x => '- ' + x).join('\n') + (res.note ? '\nNote shown: ' + res.note : '') + (res.warn ? '\nWarning shown: ' + res.warn : '');
  return s;
}
function exAsk(kind, id, extra){
  if (kind === 'all') return exContext(id) + '\n\nExplain this calculator in detail but simply, in this order: 1) what it is for, in one or two sentences; 2) every field above, one bullet each: what it means and why it matters; 3) what the person\'s result means, using their numbers, and which inputs change it the most; 4) one practical tip. Keep it under about 450 words.';
  if (kind === 'field') return exContext(id) + '\n\nExplain only the field "' + extra + '": what it means, how to find the right value for the person (where it appears, e.g. on a payslip or bank statement), and how it affects the result. 3–6 short sentences.';
  if (kind === 'row') return exContext(id) + '\n\nExplain only the result line "' + extra + '": what it means and how it was reached, using the numbers. 2–5 short sentences.';
  return extra;
}
function exFmt(s){
  return asEsc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n{2,}/).map(par => {
    const lines = par.split('\n');
    if (lines.every(l => /^\s*[-•*]\s+/.test(l) || !l.trim())) return '<ul>' + lines.filter(l => l.trim()).map(l => '<li>' + l.replace(/^\s*[-•*]\s+/, '') + '</li>').join('') + '</ul>';
    return '<p>' + lines.map(l => /^\s*[-•*]\s+/.test(l) ? '• ' + l.replace(/^\s*[-•*]\s+/, '') : l).join('<br>') + '</p>';
  }).join('');
}
function exEnsure(){
  if ($('#ex')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="ex" hidden><div class="cp-box ex-box" role="dialog" aria-modal="true" aria-labelledby="ex_t">
    <div class="cp-top"><h3 id="ex_t"></h3><button type="button" class="cp-x" id="ex_x">×</button></div>
    <div class="ex-chips" id="ex_chips"></div>
    <div class="ex-body" id="ex_body" aria-live="polite"></div>
    <form class="ex-ask" id="ex_form"><input id="ex_q" autocomplete="off"><button type="submit" class="gold-btn" id="ex_send"></button></form>
    <p class="fine ex-note" id="ex_note"></p></div></div>`);
  const ov = $('#ex');
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('#ex_x')) return exClose();
    const c = e.target.closest('[data-exq]'); if (c) exRun('q', c.textContent);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#ex').hidden){ e.preventDefault(); exClose(); } });
  $('#ex_form').addEventListener('submit', e => { e.preventDefault(); const q = $('#ex_q').value.trim(); if (q){ $('#ex_q').value = ''; exRun('q', q); } });
}
function exOpen(id, kind, extra){
  exEnsure();
  if (EX.ctl) try { EX.ctl.abort(); } catch (e) {}
  EX = {id, hist: [], busy: false, ctl: null, opener: document.activeElement};
  $('#ex_t').textContent = kind === 'all' ? t('ex_title', {n: t('tab_' + id)}) : extra;
  $('#ex_x').setAttribute('aria-label', t('cp_close'));
  $('#ex_q').placeholder = t('ex_ph'); $('#ex_send').textContent = t('ex_send');
  $('#ex_note').textContent = t('ex_note');
  $('#ex_chips').innerHTML = ['ex_c1', 'ex_c2', 'ex_c3'].map(k => `<button type="button" class="as-chip" data-exq="1">${t(k)}</button>`).join('');
  $('#ex_body').innerHTML = '';
  $('#ex').hidden = false; document.body.classList.add('cp-lock');
  exRun(kind, extra);
  setTimeout(() => { const x = $('#ex_x'); if (x) x.focus(); }, 30);
}
function exClose(){ if (EX.ctl) try { EX.ctl.abort(); } catch (e) {} $('#ex').hidden = true; document.body.classList.remove('cp-lock'); if (EX.opener && EX.opener.focus) EX.opener.focus(); }
async function exRun(kind, extra){
  const id = EX.id, body = $('#ex_body'); if (!id || !body) return;
  if (EX.busy) return;
  const prompt = exAsk(kind, id, extra);
  const key = kind !== 'q' && EX.hist.length === 0 ? [lang, id, kind, extra || '', prompt.length, JSON.stringify(exFields(id)), JSON.stringify(exResults(id))].join('|') : null;
  if (kind === 'q') body.insertAdjacentHTML('beforeend', `<div class="ex-q">${asEsc(extra)}</div>`);
  const out = document.createElement('div'); out.className = 'ex-a'; body.appendChild(out);
  if (key && EX_CACHE[key]){ out.innerHTML = exFmt(EX_CACHE[key]); EX.hist.push({role: 'user', content: prompt}, {role: 'assistant', content: EX_CACHE[key]}); return; }
  out.innerHTML = `<p class="ex-wait">${t('as_think')}</p>`;
  EX.busy = true; $('#ex_send').disabled = true;
  const eng = aiPick();
  let sm = null;
  if (!sm && eng === 'claude') sm = (m, o) => CAI.fn(m, o).catch(e => { if (e && e.code === 'not_granted'){ CAI.denied = true; try { engRender(); aiFabSync(); } catch (x) {} } throw e; });
  if (!sm && eng === 'gemini' && gemKey()) sm = async (m) => ({text: await gemChat(m)});
  if (!sm && kind === 'q'){ try { const a = await pmSmart(extra); out.innerHTML = aiRich(a) + '<p class="fine pm-badge">' + asEsc(t('pm_badge2', {n: pmName()})) + '</p>'; } catch (e) { out.innerHTML = exLocal(id, kind, extra); } EX.busy = false; $('#ex_send').disabled = false; body.scrollTop = body.scrollHeight; return; }
  if (!sm){ out.innerHTML = exLocal(id, kind, extra); EX.busy = false; $('#ex_send').disabled = false; body.scrollTop = body.scrollHeight; return; }
  const msgs = EX.hist.concat([{role: 'user', content: (EX.hist.length ? '' : exSystem() + '\n\n') + prompt}]);
  EX.ctl = new AbortController();
  try {
    const r = await sm(msgs, {modelTier: 'default', cache: kind !== 'q', signal: EX.ctl.signal, onText: ({text}) => { out.innerHTML = exFmt(text); body.scrollTop = body.scrollHeight; }});
    const txt = (r && r.text || '').trim() || t('as_empty');
    out.innerHTML = exFmt(txt);
    EX.hist = msgs.concat([{role: 'assistant', content: txt}]).slice(-10);
    if (key) EX_CACHE[key] = txt;
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    const c = e && e.code;
    const ge = aiErrText(e);
    if (ge){ out.innerHTML = `<p class="ex-err">${asEsc(ge)}</p>`; return; }
    out.innerHTML = `<p class="ex-err">${t(c === 'not_granted' ? 'ex_denied' : c === 'rate_limited' ? 'ex_busy' : (e && e.message === 'badkey') ? 'as_badkey' : 'as_err', {e: c || (e && e.message) || ''})}</p>` + (c === 'not_granted' ? exLocal(id, kind, extra) : '');
  } finally { EX.busy = false; const s = $('#ex_send'); if (s) s.disabled = false; }
}
function exOffline(id, kind, extra){
  const fs = exFields(id);
  const pick = kind === 'field' ? fs.filter(f => f.label === extra) : fs.filter(f => f.hint);
  return `<p>${asEsc(t('d_' + id))}</p>` + (pick.length ? '<ul>' + pick.map(f => `<li><b>${asEsc(f.label)}</b>${f.hint ? ': ' + asEsc(f.hint) : ''}</li>`).join('') + '</ul>' : '') +
    `<p class="fine">${t('ex_offline')}</p>`;
}
function exDecorate(){
  TABS.filter(id => !EX_SKIP.includes(id)).forEach(id => {
    const p = $('#panel-' + id); if (!p) return;
    $$('.field', p).forEach(f => {
      const l = $(':scope > label, :scope > .fb > label', f); if (!l || !l.htmlFor) return;
      const box = l.parentElement; if ($(':scope > .qbtn', box)) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'qbtn'; b.textContent = '?';
      b.dataset.exf = l.htmlFor; box.classList.add('has-q'); l.insertAdjacentElement('afterend', b);
    });
  });
}
/* 8.3: the label sits right before its "?" button, so no page-wide search per button; and the work runs only when the language or the buttons change */
var EXL_SIG = '';
function exLabels(){
  const bs = document.getElementsByClassName('qbtn'), sig = lang + ':' + bs.length;
  if (sig !== EXL_SIG){
    EXL_SIG = sig;
    for (const b of bs){
      const p = b.previousElementSibling, l = p && p.tagName === 'LABEL' ? p : document.getElementById(b.dataset.exf) && $('label[for="' + b.dataset.exf + '"]', b.parentElement.parentElement || document);
      const v = t('ex_what', {n: l ? exClean(l.textContent) : ''}); if (b.getAttribute('aria-label') !== v) b.setAttribute('aria-label', v);
    }
  }
  const e = $('#explainBtn'); if (e) e.setAttribute('aria-label', t('b_explainA'));
}
document.addEventListener('click', e => {
  if (e.target.closest('#explainBtn')){ if (!EX_SKIP.includes(tab)) exOpen(tab, 'all'); return; }
  const q = e.target.closest('.qbtn');
  if (q){ const l = $('label[for="' + q.dataset.exf + '"]'); exOpen(tab, 'field', l ? exClean(l.textContent) : q.dataset.exf); return; }
  const row = e.target.closest('.panel .ledger .row dt');
  if (row && !EX_SKIP.includes(tab)) exOpen(tab, 'row', exClean(row.textContent));
});
exDecorate(); exLabels();
const _rsEx = renderStamp;
renderStamp = function(){ _rsEx.apply(this, arguments); if (typeof exLabels === 'function') exLabels(); };

/* ---- app-wide search: calculators, fields inside them, settings, and a hand-off to the assistant ---- */
var GS_IDX = null, GS_LANG = null;
var GS_SYN = {
  convert: 'דולר אירו יורו שקל ביטקוין קריפטו מטח מט״ח שער חליפין dollar euro shekel bitcoin crypto forex exchange دولار يورو شيكل بيتكوين صرف',
  salary: 'תלוש משכורת ברוטו נטו payslip gross net wage راتب قسيمة', tax: 'מדרגות מס brackets ضريبة',
  mortgage: 'דירה בית הלוואת דיור home house apartment شقة بيت', prime: 'פריים מינוס אוברדרפט overdraft prime بنك',
  inflation: 'מדד יוקר המחיה cpi prices أسعار', severance: 'פיטורים פיצויים fired layoff فصل', leave: 'חופש מחלה הבראה vacation sick إجازة',
  vat: 'מעמ מע״מ tax vat ضريبة القيمة', compound: 'חיסכון השקעה savings invest ادخار', fire: 'פרישה מוקדמת early retirement تقاعد'
};
const gsNorm = s => String(s || '').toLowerCase().replace(/[֑-ׇً-ٟ״"׳'’()\-–,.:?!]/g, ' ').replace(/\s+/g, ' ').trim();
const all3 = k => (T[k] || []).join(' ');
function gsBuild(){
  const idx = [];
  const grpOf = id => { const g = GROUPS.find(x => x[1].includes(id)); return g ? t('gs_' + g[0].slice(2)) || t(g[0]) : ''; };
  const famOf = id => { const F = typeof FAM_OF === 'object' && FAM_OF[id]; return F && F.length > 1 && T['fam_' + F[0]] ? F[0] : ''; };
  const subOf = id => { const f = famOf(id); return f ? t('fam_' + f) + ' · ' + grpOf(id) : grpOf(id); };
  TABS.forEach(id => idx.push({type: 'calc', id, title: t('tab_' + id), sub: id === 'home' || id === 'settings' || id === 'assist' ? t('g_main') : subOf(id),
    text: gsNorm(all3('tab_' + id) + ' ' + all3('d_' + id) + ' ' + id + ' ' + (GS_SYN[id] || '') + (famOf(id) ? ' ' + all3('fam_' + famOf(id)) : '')), icon: ICON[id] || ''}));
  TABS.filter(id => !['home', 'settings', 'assist'].includes(id)).forEach(id => {
    const p = $('#panel-' + id); if (!p) return;
    const seen = new Set();
    $$('.field label[for]', p).forEach(l => {
      const k = l.dataset.i, title = (l.textContent || '').trim(); if (!title || seen.has(title)) return; seen.add(title);
      const f = l.closest('.field'), h = f && $('.hint', f);
      idx.push({type: 'field', id, target: l.htmlFor, title, sub: t('tab_' + id), text: gsNorm((k ? all3(k) : title) + ' ' + (h && h.dataset.i ? all3(h.dataset.i) : ''))});
    });
  });
  const sp = $('#panel-settings');
  if (sp){
    $$('.set-sec', sp).forEach(sec => {
      if (sec.hidden && sec.dataset.own) return;           // owner-only sections stay out of search
      const h = $('.sec-t', sec), st = h ? h.textContent.trim() : '';
      if (h) idx.push({type: 'set', el: sec, title: st, sub: t('tab_settings'), text: gsNorm(h.dataset.i ? all3(h.dataset.i) : st)});
      $$('label[for], .src-h b, h4[data-i]', sec).forEach(l => {
        const title = (l.textContent || '').trim(); if (!title || title.length > 80) return;
        idx.push({type: 'set', el: l.htmlFor ? $('#' + l.htmlFor) || l : l, title, sub: st, text: gsNorm(l.dataset.i ? all3(l.dataset.i) : title)});
      });
    });
  }
  GS_IDX = idx; GS_LANG = lang;
}
function gsFind(q){
  if (!GS_IDX || GS_LANG !== lang) gsBuild();
  const n = gsNorm(q); if (!n) return [];
  const words = n.split(' ');
  const hits = GS_IDX.filter(e => words.every(w => e.text.includes(w) || gsNorm(e.title).includes(w)));
  const score = e => { const tt = gsNorm(e.title); return (tt === n ? 0 : tt.startsWith(n) ? 1 : tt.includes(n) ? 2 : 3) + (e.type === 'calc' ? 0 : e.type === 'field' ? 0.5 : 0.7); };
  hits.sort((a, b) => score(a) - score(b));
  return hits;
}
function gsEnsure(){
  if ($('#gsx')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="gsx" hidden><div class="cp-box gs-box" role="dialog" aria-modal="true" aria-labelledby="gs_t">
    <div class="cp-top"><h3 id="gs_t"></h3><button type="button" class="cp-x" id="gs_x">×</button></div>
    <input id="gs_q" type="search" autocomplete="off" spellcheck="false">
    <div class="cp-list" id="gs_list" role="listbox"></div></div></div>`);
  const ov = $('#gsx');
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('#gs_x')) return gsClose();
    const it = e.target.closest('.gs-it'); if (it) gsGo(+it.dataset.n);
  });
  $('#gs_q').addEventListener('input', gsRender);
  ov.addEventListener('keydown', e => {
    const items = $$('.gs-it', ov), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0] || {focus(){}}).focus(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); if (i <= 0) $('#gs_q').focus(); else items[i - 1].focus(); }
    else if (e.key === 'Enter' && document.activeElement === $('#gs_q')){ e.preventDefault(); if (items[0]) gsGo(+items[0].dataset.n); }
  });
}
var GS_RES = [];
function gsOpen(){
  gsEnsure();
  $('#gs_t').textContent = t('gs_title'); $('#gs_x').setAttribute('aria-label', t('cp_close'));
  const q = $('#gs_q'); q.placeholder = t('gs_ph'); q.value = '';
  $('#gsx').hidden = false; document.body.classList.add('cp-lock');
  gsRender(); setTimeout(() => q.focus(), 30);
}
function gsClose(){ const o = $('#gsx'); if (!o || o.hidden) return; o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#gSearch'); if (b) b.focus(); }
function gsRender(){
  const box = $('#gs_list'), q = $('#gs_q').value.trim();
  if (!q){
    const pop = ['salary', 'mortgage', 'convert', 'prime', 'compound', 'inflation'].filter(id => TABS.includes(id) && isVisible(id));
    GS_RES = pop.map(id => ({type: 'calc', id, title: t('tab_' + id), sub: '', icon: ICON[id] || ''}));
    box.innerHTML = `<div class="cp-h">${t('gs_popular')}</div>` + GS_RES.map(gsItem).join('') + `<p class="gs-tip">${t('gs_tip')}</p>`;
    return;
  }
  const hits = gsFind(q);
  const calc = hits.filter(e => e.type === 'calc').slice(0, 8), fld = hits.filter(e => e.type === 'field').slice(0, 10), st = hits.filter(e => e.type === 'set').slice(0, 6);
  GS_RES = calc.concat(fld, st, [{type: 'ask', title: t('gs_ask', {q}), q}]);
  let html = '';
  if (calc.length) html += `<div class="cp-h">${t('gs_calcs')}</div>` + calc.map(gsItem).join('');
  if (fld.length) html += `<div class="cp-h">${t('gs_fields')}</div>` + fld.map(gsItem).join('');
  if (st.length) html += `<div class="cp-h">${t('gs_sets')}</div>` + st.map(gsItem).join('');
  if (!calc.length && !fld.length && !st.length) html += `<p class="cp-none">${t('gs_none')}</p>`;
  html += gsItem(GS_RES[GS_RES.length - 1]);
  box.innerHTML = html;
}
function gsItem(e){
  const n = GS_RES.indexOf(e);
  const ic = e.type === 'calc' ? e.icon : e.type === 'ask' ? ICON.assist : e.type === 'set' ? ICON.settings : (ICON[e.id] || '');
  return `<button type="button" class="gs-it" role="option" data-n="${n}"><span class="gs-ic">${ic}</span><span class="gs-tx"><b>${asEsc(e.title)}</b>${e.sub ? `<small>${asEsc(e.sub)}</small>` : ''}</span></button>`;
}
function gsFlash(el){ if (!el) return; el.classList.remove('gs-flash'); void el.offsetWidth; el.classList.add('gs-flash'); setTimeout(() => el.classList.remove('gs-flash'), 1800); }
function gsGo(n){
  const e = GS_RES[n]; if (!e) return;
  $('#gsx').hidden = true; document.body.classList.remove('cp-lock');
  if (e.type === 'calc'){ activate(e.id); setTimeout(() => { const h = $('#page-title'); if (h) h.focus && h.setAttribute('tabindex', '-1'); }, 0); return; }
  if (e.type === 'ask'){
    activate('assist');
    setTimeout(() => { if (typeof asSend === 'function') asSend(e.q); }, 50);
    return;
  }
  const target = e.type === 'field' ? $('#' + e.target) : e.el;
  activate(e.type === 'field' ? e.id : 'settings');
  setTimeout(() => {
    if (!target) return;
    const scat = target.closest && target.closest('.set-cat'); if (scat && typeof setCat === 'function') setCat(scat.dataset.cat, true);
    let d = target.closest('details'); while (d){ d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    const box = target.closest('.field') || target.closest('.src-c') || target.closest('.set-sec') || target;
    box.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'});
    gsFlash(box);
    if (target.focus && /INPUT|SELECT|TEXTAREA|BUTTON/.test(target.tagName)) setTimeout(() => target.focus({preventScroll: true}), 350);
  }, 60);
}
document.addEventListener('click', e => { if (e.target.closest('#gSearch')) gsOpen(); });
document.addEventListener('keydown', e => {
  const typing = /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '') || (document.activeElement && document.activeElement.isContentEditable);
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)){ e.preventDefault(); gsOpen(); return; }
  if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey){ const o = $('.cp-ov:not([hidden])'); if (!o){ e.preventDefault(); gsOpen(); } return; }
  if (e.key === 'Escape'){ const o = $('#gsx'); if (o && !o.hidden){ e.preventDefault(); gsClose(); } }
});

/* ---- Binance: key-free live crypto prices (public market data, needs a page that may reach api.binance.com) ---- */
var binTimer = null, binFails = 0, binSyms = null, binBusy = false;
const binIntKey = () => String(Math.max(5, +SET.fxInt || 1));
function binMs(){ return Math.max(5, +SET.fxInt || 1) * 1000; }
const BIN_SKIP = ['USDT', 'USDC', 'DAI'];
async function binTick(){
  binTimer = null;
  if (SET.src_binance === '0' || SET.liveCrypto === '0' || !srcOk('cr', 'binance')){ SRC_ST.binance = 'off'; liveStRender(); return; }
  if (document.hidden) return;
  if (binBusy) return;
  binBusy = true; let ok = false;
  try {
    let list;
    if (!binSyms){
      list = await getJSON('https://api.binance.com/api/v3/ticker/price');
      const have = new Set((list || []).map(x => x.symbol));
      binSyms = Object.keys(CRYPTO).filter(c => !BIN_SKIP.includes(c) && have.has(c + 'USDT')).map(c => c + 'USDT');
    } else {
      list = await getJSON('https://api.binance.com/api/v3/ticker/price?symbols=' + encodeURIComponent(JSON.stringify(binSyms)));
    }
    let n = 0;
    (list || []).forEach(x => {
      if (!x || !/USDT$/.test(x.symbol)) return;
      const c = x.symbol.slice(0, -4), p = parseFloat(x.price), old = RATES[c];
      if (!CRYPTO[c] || BIN_SKIP.includes(c) || !(p > 0) || !old) return;
      const v = 1 / p, q = v / old; if (q < 0.5 || q > 2) return;
      RATES[c] = v; if (typeof FXSRC === 'object') FXSRC[c] = {s: 'binance', at: Date.now()}; n++;
    });
    if (n){ ok = true; META.cryptoLive = true; META.cunix = Math.floor(Date.now() / 1000); }
  } catch (e) { /* blocked or offline */ }
  binBusy = false;
  if (ok){
    binFails = 0; SRC_ST.binance = 'ok'; SRC_AT.binance = Date.now();
    if (tab === 'home') renderMarket(); else if (tab === 'convert') calc(tab);
    binTimer = setTimeout(binTick, binMs());
  } else {
    binFails++; SRC_ST.binance = binFails >= 2 ? 'blocked' : 'wait';
    binTimer = setTimeout(binTick, binFails >= 3 ? 60000 : 3000);
  }
  if (tab === 'settings') liveStRender();
}
function binStart(){ if (binTimer){ clearTimeout(binTimer); binTimer = null; } binFails = 0; SRC_ST.binance = SET.src_binance === '0' ? 'off' : 'wait'; liveStRender(); binTick(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && SET.src_binance !== '0' && !binTimer && !binBusy) binTick(); });
binStart();

/* ---- unique @username (no password): one claim per person in the shared database, checked for duplicates ---- */
var HD = {db: null, uid: null, ready: false};
const hdNorm = s => String(s || '').trim().replace(/^@+/, '').normalize('NFKC').toLowerCase();
const hdValid = s => /^[\p{L}][\p{L}\p{N}_.]{2,19}$/u.test(s) && !/[._]{2}/.test(s) && !/[._]$/.test(s);
/* the shared list keeps only a fingerprint of each name, never the name itself, so nobody can read who signed up */
async function hdHash(s){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fincalc-handle-v1:' + hdNorm(s))); return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''); }
async function claimIs(d, nm){ if (!d || !nm) return false; if (d.handle) return d.handle === hdNorm(nm); return !!d.hh && d.hh === await hdHash(nm); }
async function hdClean(d){ if (!d || !d.handle) return d; const o = Object.assign({}, d, {hh: await hdHash(d.handle)}); delete o.handle; return o; }
async function hdHits(claims, name){
  const hh = await hdHash(name), seen = new Set();
  const [a, b] = await Promise.all([claims.where('hh', '==', hh).get(), claims.where('handle', '==', hdNorm(name)).get()]);
  return (a.docs || []).concat(b.docs || []).filter(d => !seen.has(d.id) && seen.add(d.id));
}
const hdLockId = s => 'h_' + Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join('');
function hdMsg(k, p, ok){ const m = $('#hd_msg'); if (m){ m.textContent = k ? t(k, p) : ''; m.className = 'hd-msg' + (ok ? ' ok' : k ? ' bad' : ''); } }
function hdShow(){
  const c = $('#hd_cur'), n = $('#hd_name');
  if (c){ c.hidden = !MY_HANDLE; if (n) n.textContent = '@' + MY_HANDLE; }
  const b = $('#hd_save'); if (b) b.textContent = t(MY_HANDLE ? 'hd_change' : 'hd_save');
  try { if (MY_HANDLE) localStorage.setItem('fin-handle', MY_HANDLE); else localStorage.removeItem('fin-handle'); } catch (e) {}
  syncSettingsUI();
}
async function hdInit(){
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    HD = {db, uid, ready: true};
    const s = await db.doc('claims/' + uid).get();
    const d = s.exists ? (s.data() || {}) : null;
    let h = '';
    if (d && d.handle){ h = d.handle; try { await db.doc('claims/' + uid).set(await hdClean(d)); } catch (e) {} }   // older claims kept the name in clear
    else if (d && d.hh){ for (const c of [MY_HANDLE, FUSER]) if (c && await hdHash(c) === d.hh){ h = hdNorm(c); break; } }
    if (h !== MY_HANDLE){ MY_HANDLE = h || ''; hdShow(); }
  } catch (e) { /* stays local */ }
}
async function hdClaim(name){
  try {
    const claims = HD.db.collection('claims'), hh = await hdHash(name);
    const hits = await hdHits(claims, name);
    if (hits.some(d => d.id !== HD.uid)) return 'taken';
    const cur = await HD.db.doc('claims/' + HD.uid).get(), at = Date.now();
    const pd = cur.exists ? (cur.data() || {}) : null, same = pd && await claimIs(pd, name);
    await HD.db.doc('claims/' + HD.uid).set(Object.assign({hh, at}, same && pd.mh ? {mh: pd.mh, mat: pd.mat || at} : {}));
    const again = await hdHits(claims, name);
    const rival = again.find(d => d.id !== HD.uid && (+(d.data() || {}).at < at || (+(d.data() || {}).at === at && d.id < HD.uid)));
    if (rival){ if (pd) await HD.db.doc('claims/' + HD.uid).set(await hdClean(pd)); else await HD.db.doc('claims/' + HD.uid).delete(); return 'taken'; }
    MY_HANDLE = name;
    return 'ok';
  } catch (e) { return e && e.code === 'invalid_argument' ? 'noWrite' : 'err'; }
}
async function hdSave(){
  const q = $('#hd_q'), name = hdNorm(q && q.value);
  if (!hdValid(name)) return hdMsg('hd_bad');
  if (name === MY_HANDLE) return hdMsg('hd_same', {n: '@' + name}, true);
  if (!HD.ready) await hdInit();
  if (!HD.ready) return hdMsg('hd_needDb');
  const btn = $('#hd_save'); if (btn) btn.disabled = true;
  hdMsg('hd_checking');
  try {
    const claims = HD.db.collection('claims');
    const hits = await hdHits(claims, name);
    if (hits.some(d => d.id !== HD.uid)) return hdMsg('hd_taken', {n: '@' + name});
    const prev = MY_HANDLE, at = Date.now();
    await HD.db.doc('claims/' + HD.uid).set({hh: await hdHash(name), at});
    // each person writes only their own claim, so settle a simultaneous pick: the earlier claim keeps the name
    const again = await hdHits(claims, name);
    const rival = again.find(d => d.id !== HD.uid && (+(d.data() || {}).at < at || (+(d.data() || {}).at === at && d.id < HD.uid)));
    if (rival){
      if (prev) await HD.db.doc('claims/' + HD.uid).set({hh: await hdHash(prev), at: Date.now()}); else await HD.db.doc('claims/' + HD.uid).delete();
      return hdMsg('hd_taken', {n: '@' + name});
    }
    MY_HANDLE = name; if (q) q.value = ''; hdShow();
    hdMsg('hd_ok', {n: '@' + name}, true);
  } catch (e) {
    hdMsg(e && e.code === 'invalid_argument' ? 'hd_noWrite' : 'hd_err');
  } finally { if (btn) btn.disabled = false; }
}
async function hdDelete(){
  if (!MY_HANDLE) return;
  try { if (HD.ready) await HD.db.doc('claims/' + HD.uid).delete(); } catch (e) { return hdMsg('hd_err'); }
  MY_HANDLE = ''; hdShow(); hdMsg('hd_deleted', null, true);
}
panelsEl.addEventListener('click', e => {
  if (e.target.closest('#hd_save')) hdSave();
  else if (e.target.closest('#hd_del')) hdDelete();
});
panelsEl.addEventListener('keydown', e => { if (e.target.id === 'hd_q' && e.key === 'Enter'){ e.preventDefault(); hdSave(); } });
panelsEl.addEventListener('input', e => {
  if (e.target.id !== 'hd_q') return;
  const n = hdNorm(e.target.value);
  if (!n) hdMsg(''); else if (!hdValid(n)) hdMsg('hd_bad'); else hdMsg('hd_okFmt', {n: '@' + n}, true);
});
hdShow(); hdInit();

/* ---- who am I here: show the viewer's permission level at the top of Settings ---- */
var PERM = 'wait';
function permRender(){
  const box = $('#perm'); if (!box) return;
  const k = {owner: 'ok', editor: 'warn', viewer: 'view', local: 'view', wait: 'view'}[PERM] || 'view';
  box.className = 'perm ' + k;
  $('#perm_t').textContent = t('perm_' + PERM);
  $('#perm_s').textContent = t('perm_' + PERM + 'S');
}
async function permInit(){
  permRender();
  try {
    const u = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('user') : null;
    if (!u){ PERM = 'local'; return permRender(); }
    const [own, edit] = await Promise.all([u.isOwner(), u.canEdit()]);
    PERM = own ? 'owner' : edit ? 'editor' : 'viewer';
  } catch (e) { PERM = 'local'; }
  permRender();
}
const _rsPerm = renderStamp;
renderStamp = function(){ _rsPerm.apply(this, arguments); permRender(); };
var PERM_P = permInit();

panelsEl.addEventListener('input', e => {
  if (e.target.id !== 'acc_ruser') return;
  const n = hdNorm(e.target.value), h = $('#acc_hd'); if (!h) return;
  h.textContent = !n ? '' : hdValid(n) ? t('hd_okFmt2', {n: '@' + n}) : t('hd_bad');
  h.className = 'hint hd-live ' + (!n ? '' : hdValid(n) ? 'ok' : 'bad');
});

/* ---- standalone site (GitHub Pages): AI through the visitor's own free Gemini key ---- */
var GEM_BASE = 'https://generativelanguage.googleapis.com/v1beta/';
var GEM_FALLBACK = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
var GEM_STOP = ['gk_eKey', 'gk_eRef', 'gk_eOff', 'gk_eGeo', 'blocked'];   // errors another model will not fix
var AI_CLAUDE = false;                 // inside claude.ai the assistant runs on Claude
var GK = {st: '', e: ''};              // result of the last key check
function gemKey(){ return String(SET.gkey || '').replace(/\s+/g, ''); }
function gemClean(msgs){               // Gemini wants user/model turns that alternate, start and end with the user
  const out = [];
  (msgs || []).forEach(m => {
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user', text = String(m.content || '').trim();
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts[0].text += '\n\n' + text; else out.push({role, parts: [{text}]});
  });
  while (out.length && out[0].role !== 'user') out.shift();
  while (out.length && out[out.length - 1].role !== 'user') out.pop();
  return out;
}
function gemFail(status, j){
  const er = (j && j.error) || {}, msg = String(er.message || ''), why = (er.details || []).map(d => (d && d.reason) || '').join(' ') + ' ' + (er.status || '') + ' ' + msg;
  let c = 'gk_eOther';
  if (/REFERRER|referer/i.test(why)) c = 'gk_eRef';
  else if (/API_KEY_INVALID|API key not valid|API key expired|API_KEY_EXPIRED/i.test(why)) c = 'gk_eKey';
  else if (/SERVICE_DISABLED|has not been used|is disabled/i.test(why)) c = 'gk_eOff';
  else if (status === 429 || /RESOURCE_EXHAUSTED/.test(why)) c = 'gk_eQuota';
  else if (/location is not supported/i.test(why)) c = 'gk_eGeo';
  else if (status === 403 && /PERMISSION_DENIED/.test(why) && !/model/i.test(msg)) c = 'gk_eKey';
  else if (status === 404) c = 'gk_eModel';
  const e = new Error(c); e.gem = msg.slice(0, 160); e.status = status; return e;
}
async function gemCall(model, key, contents, extra){
  let r;
  try {
    r = await fetch(GEM_BASE + 'models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(Object.assign({contents}, extra || {}))});
  } catch (e) { throw new Error('blocked'); }
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw gemFail(r.status, j);
  const c = ((j && j.candidates) || [])[0] || {};
  const txt = ((c.content || {}).parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
  if (!txt){ const e = new Error('gk_eEmpty'); e.gem = c.finishReason || ((j && j.promptFeedback) || {}).blockReason || ''; throw e; }
  return txt;
}
async function gemTry(models, key, contents, extra){
  let last = null;
  for (const m of [...new Set(models.filter(Boolean))]){
    try { const txt = await gemCall(m, key, contents, extra); if (SET.gmodel !== m){ SET.gmodel = m; saveSet(); } return txt; }
    catch (e) { if (GEM_STOP.includes(e.message)) throw e; last = e; }
  }
  throw last || new Error('gk_eOther');
}
async function gemChat(msgs){
  const key = gemKey(); if (!key) throw new Error('noai');
  const contents = gemClean(msgs); if (!contents.length) throw new Error('gk_eEmpty');
  return gemTry([SET.gmodel].concat(GEM_FALLBACK), key, contents);
}
async function gemModels(key){       // the newest Flash models this key can use
  let r, j = null;
  try { r = await fetch(GEM_BASE + 'models?pageSize=200', {headers: {'x-goog-api-key': key}}); } catch (e) { throw new Error('blocked'); }
  try { j = await r.json(); } catch (e) {}
  if (!r.ok){ const e = gemFail(r.status, j); if (GEM_STOP.includes(e.message)) throw e; return []; }
  const ver = n => { const m = n.match(/gemini-(\d+(?:\.\d+)?)-flash/); return m ? parseFloat(m[1]) : 0; };
  return ((j && j.models) || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => String(m.name || '').replace(/^models\//, ''))
    .filter(n => /^gemini-[\d.]+-flash(-lite)?$/.test(n))
    .sort((a, b) => (/lite/.test(a) - /lite/.test(b)) || ver(b) - ver(a));
}
function aiErrText(e){
  const m = (e && e.message) || '';
  if (!/^gk_e/.test(m) && !(m === 'blocked' && gemKey())) return '';
  const k = m === 'blocked' ? (IN_CLAUDE ? 'gk_eInP' : 'gk_eNet') : m;
  return t('gk_fail') + ' ' + t(T[k] ? k : 'gk_eOther', {h: location.host || ''}) + (e.gem ? ' (' + e.gem + ')' : '');
}
function gkRender(){
  const el = $('#gk_st'); if (!el) return;
  const ok = '<b>✓ ' + t('gk_okT') + '</b> ' + t('gk_okS');
  let cls = '', h = '';
  if (GK.st === 'wait'){ cls = 'wait'; h = t('gk_wait'); }
  else if (GK.st === 'ok') { cls = 'ok'; h = ok; }
  else if (GK.st === 'gk_del') h = t('gk_deleted') + (AI_CLAUDE ? ' ' + t('gk_claudeS') : '');
  else if (GK.st === 'blocked' && AI_CLAUDE){ cls = 'ok'; h = '<b>✓ ' + t('gk_claude') + '</b> ' + t('gk_eIn'); }
  else if (GK.st === 'gk_eQuota'){ cls = 'ok'; h = '<b>✓ ' + t('gk_valid') + '</b> ' + t('gk_eQuota'); }
  else if (GK.st){
    const k = GK.st === 'blocked' ? (IN_CLAUDE ? 'gk_eInP' : 'gk_eNet') : GK.st;
    cls = 'bad'; h = '<b>✗ ' + t('gk_bad') + '</b> ' + asEsc(t(T[k] ? k : 'gk_eOther', {h: location.host || ''})) + (GK.e ? ' <small dir="ltr">(' + asEsc(GK.e) + ')</small>' : '');
  }
  else if (gemKey() && SET.gkOk) { cls = 'ok'; h = ok; }
  else if (gemKey()) h = t('gk_saved');
  else if (IN_CLAUDE){ h = t('gk_inClaude'); }
  el.className = 'gk-st ' + cls; el.innerHTML = h;
  const d = $('#gk_del'); if (d) d.style.display = gemKey() ? '' : 'none';
  const b = $('#gk_ok'); if (b) b.disabled = GK.st === 'wait';
}
async function gkApprove(){
  const inp = $('#set_gkey'); if (!inp || GK.st === 'wait') return;
  const key = inp.value.replace(/\s+/g, ''); inp.value = key;
  if (!key){ GK = {st: 'gk_eNone', e: ''}; return gkRender(); }
  SET.gkey = key; SET.gkOk = 0; saveSet();
  GK = {st: 'wait', e: ''}; gkRender();
  try {
    let found = [];
    try { found = await gemModels(key); } catch (e) { if (GEM_STOP.includes(e.message)) throw e; }
    await gemTry(found.slice(0, 3).concat(GEM_FALLBACK), key, [{role: 'user', parts: [{text: 'Reply with the single word OK.'}]}]);
    SET.gkOk = Date.now(); saveSet(); GK = {st: 'ok', e: ''};
  } catch (e) { GK = {st: (e && e.message) || 'gk_eOther', e: (e && e.gem) || ''}; }
  gkRender();
}
function gkDelete(){
  SET.gkey = ''; SET.gkOk = 0; SET.gmodel = ''; saveSet();
  const inp = $('#set_gkey'); if (inp) inp.value = '';
  GK = {st: 'gk_del', e: ''}; gkRender();
}
document.addEventListener('click', e => {
  if (e.target.closest('#gk_ok')) gkApprove();
  else if (e.target.closest('#gk_del')) gkDelete();
});
document.addEventListener('input', e => { if (e.target.id === 'set_gkey' && GK.st !== 'wait'){ SET.gkOk = 0; GK = {st: '', e: ''}; gkRender(); } });
document.addEventListener('keydown', e => { if (e.target.id === 'set_gkey' && e.key === 'Enter'){ e.preventDefault(); gkApprove(); } });
async function aiSecInit(){ AI_CLAUDE = false; gkRender(); }   // Claude is not used as an AI engine
aiSecInit();
const _rsGk = renderStamp;
renderStamp = function(){ _rsGk.apply(this, arguments); gkRender(); };

/* ---- standalone site: official data from rates.json, kept fresh by a scheduled GitHub Action ---- */
var SITE_RATES = false;
async function siteRates(){
  if (dbState === 'ok' && !SITE_RATES) return;                 // claude.ai database already feeds the page
  try {
    const r = await rjFetch('rates.json?s=' + RJ_SLOT(), {cache: 'no-store'});
    if (!r.ok) return;
    const d = await r.json(); rjSeen(d); if (!d || !d.usd) return;
    SITE_RATES = true;
    if (SET.boiDb !== '0'){
      applyDbRates({usd: d.usd, asOf: d.asOf, crypto: d.crypto, cryptoAsOf: d.cryptoAsOf});
      if (d.macro) applyMacro(Object.assign({asOf: d.asOf}, d.macro));
    }
    dbState = SET.boiDb === '0' ? 'off' : 'ok'; dbAsOf = +d.asOf || 0; liveStRender();
  } catch (e) { /* not a standalone site */ }
}
setTimeout(siteRates, 1200);
rjEvery(siteRates);
window.addEventListener('online', () => { if (SITE_RATES) siteRates(); });

/* ---- versions & updates: the link never changes; the app notices a newer version and moves to it ---- */
var CHANGELOG = __CHANGELOG__;
var APP_VER = CHANGELOG[0].v, APP_BUILD = '__APP_BUILD__';
var IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
var UPD = {remote: null, st: '', dbv: null, hide: '', touched: false, whatsNew: false, loadedTry: (() => { try { return !!SS.getItem('fin-upd-try'); } catch (e) { return false; } })()};
function verNote(e){ const n = (e && e.notes) || {}; return n[lang] || n.he || n.en || ''; }
function verDate(d){ const m = String(d || '').match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? +m[3] + '.' + +m[2] + '.' + m[1] : ''; }
function verCmp(a, b){ const x = String(a || '').split('.').map(Number), y = String(b || '').split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++){ const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; }
function updTried(r){ try { return !!r && (SS.getItem('fin-upd-try') || '') === String(r.build); } catch (e) { return false; } }
function updNewer(r){
  if (!r || !r.build) return false;
  const nw = IN_CLAUDE ? verCmp(r.v, APP_VER) > 0 : String(r.build) > APP_BUILD;
  return nw && !(updTried(r) && UPD.loadedTry);        // already reloaded for it and it is still not here: do not ask again
}
/* auto-update off: tell the user once per version that a new update is available (banner + system notification outside Claude) */
function updNotify(r){
  try { if (RAWLS.getItem('fin-upd-ntf') === String(r.build)) return; RAWLS.setItem('fin-upd-ntf', String(r.build)); } catch (e) {}
  try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'granted') new Notification(t('upd_avail'), {body: (r.v ? r.v + ' · ' : '') + verNote(r), icon: 'icon-192.png', tag: 'upd-' + r.build}); } catch (e) {}
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_autoUpd' && e.target.value === '0'){ try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (er) {} } });
function updBanner(){
  let b = $('#upd_bar');
  const r = UPD.remote, show = updNewer(r) && UPD.hide !== r.build;
  if (show && SET.autoUpd === '0') updNotify(r);
  if (!show && !UPD.whatsNew){ if (b) b.remove(); return; }
  if (!b){ b = document.createElement('div'); b.id = 'upd_bar'; b.className = 'upd-bar'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = show
    ? `<span><b>${asEsc(t('upd_newT', {v: r.v || ''}))}</b> ${asEsc(verNote(r))}</span><button type="button" class="gold-btn" id="upd_go2">${t('upd_go')}</button><button type="button" class="upd-x" id="upd_x" aria-label="${t('upd_close')}">×</button>`
    : `<span><b>${asEsc(t('upd_doneT', {v: APP_VER}))}</b> ${asEsc(verNote(CHANGELOG[0]))}</span><button type="button" class="upd-x" id="upd_x" aria-label="${t('upd_close')}">×</button>`;
}
function updRender(){
  const cur = $('#upd_cur'); if (cur) cur.textContent = APP_VER + (CHANGELOG[0].date ? ' · ' + verDate(CHANGELOG[0].date) : '');
  const st = $('#upd_st');
  if (st){
    let cls = '', h = '';
    if (UPD.st === 'wait'){ cls = 'wait'; h = t('upd_wait'); }
    else if (updNewer(UPD.remote)){ cls = 'new'; h = '<b>' + asEsc(t('upd_newT', {v: UPD.remote.v || ''})) + '</b> ' + asEsc(verNote(UPD.remote)); }
    else if (UPD.st === 'ok'){ cls = 'ok'; h = '<b>✓ ' + t('upd_latest') + '</b>'; }
    else if (UPD.st === 'na') h = t(IN_CLAUDE ? 'upd_naIn' : 'upd_na');
    st.className = 'gk-st ' + cls; st.innerHTML = h;
  }
  const now = $('#upd_now'); if (now) now.style.display = updNewer(UPD.remote) ? '' : 'none';
  const list = $('#upd_hist');
  if (list) list.innerHTML = CHANGELOG.map(e => `<li><b class="num" dir="ltr">${asEsc(e.v)}</b>${e.date ? `<small>${verDate(e.date)}</small>` : ''}${e.v === APP_VER ? `<span class="upd-tag">${t('upd_curTag')}</span>` : ''}<div>${asEsc(verNote(e))}</div></li>`).join('');
  updBanner();
  if (typeof shRender === 'function') shRender();
}
function updApply(){
  const r = UPD.remote; if (!r || !r.build) return;
  try { SS.setItem('fin-upd-try', String(r.build)); } catch (e) {}
  if (IN_CLAUDE) location.reload();
  else location.replace(location.pathname + '?v=' + encodeURIComponent(r.build) + location.hash);
}
function updMaybeAuto(r){
  if (!updNewer(r) || SET.autoUpd === '0' || UPD.touched) return;
  let tried = ''; try { tried = SS.getItem('fin-upd-try') || ''; } catch (e) {}
  if (tried !== String(r.build)) updApply();          // once per version, so a stale cache can never loop
  else updRender();
}
async function updCheck(manual){
  if (manual){ UPD.st = 'wait'; updRender(); }
  let r = null;
  if (!IN_CLAUDE && /^https?:$/.test(location.protocol)){
    try { const x = await fetch('version.json?t=' + Date.now(), {cache: 'no-store'}); if (x.ok) r = await x.json(); } catch (e) {}
  }
  if (!r && IN_CLAUDE){
    try { const x = await fetch(SITE_BASE + 'version.json?t=' + Date.now(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (x.ok) r = await x.json(); } catch (e) {}
  }
  if (!r && UPD.dbv) r = UPD.dbv;
  if (r && r.build){ UPD.remote = r; UPD.st = 'ok'; }
  else if (manual || UPD.st === 'wait') UPD.st = 'na';
  updRender();
  return r;
}
async function updDbSub(){
  if (!IN_CLAUDE) return;
  try {
    const db = await window.claude.use('db'); if (!db) return;
    db.doc('rates/app').onSnapshot(s => { UPD.dbv = s && s.exists ? s.data() : null; updCheck(false).then(updMaybeAuto); }, () => {});
  } catch (e) {}
}
(function updStart(){
  try { if (/[?&]v=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  let seen = ''; try { seen = RAWLS.getItem('fin-ver') || ''; RAWLS.setItem('fin-ver', APP_BUILD); } catch (e) {}
  if (seen && seen < APP_BUILD){ UPD.whatsNew = true; setTimeout(() => { UPD.whatsNew = false; updBanner(); }, 15000); }
  ['pointerdown', 'keydown', 'input'].forEach(ev => document.addEventListener(ev, () => { UPD.touched = true; }, {once: true, capture: true}));
  document.addEventListener('click', e => {
    if (e.target.closest('#upd_go2, #upd_now')) updApply();
    else if (e.target.closest('#upd_chk')) updCheck(true);
    else if (e.target.closest('#upd_x')){ if (updNewer(UPD.remote)) UPD.hide = UPD.remote.build; UPD.whatsNew = false; updBanner(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updCheck(false); });
  setInterval(() => { if (!document.hidden) updCheck(false); }, 10 * 60000);
  updRender();
  setTimeout(() => { updCheck(false).then(updMaybeAuto); updDbSub(); }, 400);
})();
const _rsUpd = renderStamp;
renderStamp = function(){ _rsUpd.apply(this, arguments); updRender(); };

/* ---- settings: a clear hub of categories, each opening its own page ---- */
var SET_CATS = [
  {id: 'account', c: 'c-blue',   ic: 'set_account', g: 0, secs: ['set_account', 'set_sync']},
  {id: 'security', c: 'c-red',   ic: 'set_security', g: 0, secs: ['set_security']},
  {id: 'display', c: 'c-violet', ic: 'set_look',    g: 1, secs: ['set_look', 'set_clock', 'set_lang', 'set_langX', 'set_numbers', 'set_tabs']},
  {id: 'calc',    c: 'c-gold',   ic: 'set_calc',    g: 1, secs: ['set_my', 'set_calc', 'set_figs', 'set_profile', 'set_curBy']},
  {id: 'conn',    c: 'c-green',  ic: 'set_live',    g: 2, secs: ['set_links', 'set_src', 'set_live', 'set_ai']},
  {id: 'system',  c: 'c-gray',   ic: 'set_upd',     g: 3, secs: ['set_upd', 'set_data']}
];
var SCAT = '';
function scIcon(k){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${SICO[k] || ''}</svg>`; }
function setOrganize(){
  const sp = $('#panel-settings'); if (!sp || $('#set_hub', sp)) return;
  const perm = $('#perm', sp), groups = [];
  SET_CATS.forEach(c => { (groups[c.g] = groups[c.g] || []).push(c); });
  const hub = document.createElement('div'); hub.id = 'set_hub'; hub.className = 'set-hub';
  hub.innerHTML = groups.map(g => `<div class="sh-group">${g.map(c => `<button type="button" class="sh-row" data-scat="${c.id}">
      <span class="sh-ic ${c.c}">${scIcon(c.ic)}</span>
      <span class="sh-tx"><b data-i="sc_${c.id}">${t('sc_' + c.id)}</b><small id="sh_sub_${c.id}"${c.id === 'account' ? '' : ` data-i="sc_${c.id}S"`}>${c.id === 'account' ? '' : t('sc_' + c.id + 'S')}</small></span>
      <span class="sh-badge" id="sh_b_${c.id}"></span>
      <svg class="sh-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}</div>`).join('');
  sp.insertBefore(hub, sp.firstChild);
  SET_CATS.forEach(c => {
    const page = document.createElement('div'); page.className = 'set-cat'; page.dataset.cat = c.id; page.hidden = true;
    page.innerHTML = `<div class="sc-head"><button type="button" class="sc-back" data-scat=""><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span data-i="tab_settings">${t('tab_settings')}</span></button>
      <h3 class="sc-t"><span class="sh-ic ${c.c}">${scIcon(c.ic)}</span><span data-i="sc_${c.id}">${t('sc_' + c.id)}</span></h3></div>`;
    if (c.id === 'account' && perm) page.appendChild(perm);
    c.secs.forEach(k => { const s = $(`.set-sec[data-sk="${k}"]`, sp); if (s) page.appendChild(s); });
    sp.appendChild(page);
  });
  const sys = $('.set-cat[data-cat="system"]', sp);
  $$('.set-sec', sp).forEach(s => { if (!s.closest('.set-cat')) sys.appendChild(s); });   // nothing gets lost
  shRender();
}
function shRender(){
  const a = $('#sh_sub_account');
  if (a) a.textContent = (FUSER ? '@' + FUSER : t('sc_accountS')) + ' · ' + t('perm_' + PERM);
  const ab = $('#sh_b_account'); if (ab){ ab.className = 'sh-badge' + (FUSER ? ' on' : ''); ab.textContent = FUSER ? '●' : ''; }
  if (typeof secHub === 'function' && typeof SEC !== 'undefined' && SEC) secHub();
  const sb = $('#sh_b_system');
  if (sb){ const nw = typeof updNewer === 'function' && updNewer(UPD.remote); sb.className = 'sh-badge' + (nw ? ' new' : ''); sb.textContent = nw ? t('sc_new') : 'v' + APP_VER; }
}
function setCat(id, noHist){
  const sp = $('#panel-settings'); if (!sp) return;
  if (id && !$(`.set-cat[data-cat="${id}"]`, sp)) id = '';
  const prev = SCAT; SCAT = id;
  const hub = $('#set_hub', sp); if (hub) hub.hidden = !!id;
  $$('.set-cat', sp).forEach(p => { p.hidden = p.dataset.cat !== id; });
  sp.classList.toggle('in-cat', !!id);
  if (id && !prev && !noHist){ try { history.pushState({scat: id}, ''); } catch (e) {} }
  if (prev !== id && !noHist) window.scrollTo(0, 0);
  if (id){ const h = $(`.set-cat[data-cat="${id}"] .sc-t`, sp); if (h){ h.setAttribute('tabindex', '-1'); try { h.focus({preventScroll: true}); } catch (e) {} } }
}
function setHub(){ if (history.state && history.state.scat){ try { history.back(); return; } catch (e) {} } setCat('', true); window.scrollTo(0, 0); }
document.addEventListener('click', e => {
  const r = e.target.closest('[data-scat]');
  if (r){ const id = r.dataset.scat; if (id) setCat(id); else setHub(); return; }
  if (tab === 'settings' && SCAT && e.target.closest('button[data-tab="settings"], #tab-settings')) setHub();
});
$('#back').addEventListener('click', e => { if (tab === 'settings' && SCAT){ e.stopImmediatePropagation(); setHub(); } }, true);
window.addEventListener('popstate', () => { if (SCAT){ setCat('', true); window.scrollTo(0, 0); } });
const _actSet = activate;
activate = function(id){ const from = tab; const r = _actSet.apply(this, arguments); if (id === 'settings' && from !== 'settings') setCat('', true); return r; };
const _prSh = permRender;
permRender = function(){ _prSh.apply(this, arguments); shRender(); };
const _rsSh = renderStamp;
renderStamp = function(){ _rsSh.apply(this, arguments); shRender(); };
setOrganize();

/* ---- every language: full interface translation (packs + AI fill-in, cached and shared) ---- */
var TXJ = {id: 0, busy: false, done: 0, total: 0, err: '', code: ''};
function txCore(c){ c = c || lang; return c === 'he' || c === 'ar' || c === 'en'; }
function txHash(s){ s = String(s); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
function txSrc(){
  const o = {};
  for (const k in T){ const v = T[k], en = v && v[2]; if (typeof en === 'string' && /\p{L}/u.test(en)) o[k] = en; }
  return o;
}
function txEnName(c){ try { return new Intl.DisplayNames(['en'], {type: 'language'}).of(c) || c; } catch (e) { return c; } }
function txNative(c){ const l = LANG_LIST.find(x => x[0] === c); return l ? l[1] : c; }
function txDigits(s){ const Z = [0x30, 0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0xE50, 0xED0, 0x1040, 0x17E0, 0x1810, 0xFF10];
  return (String(s).replace(/\p{Nd}/gu, c => { const cp = c.codePointAt(0), z = Z.find(x => cp >= x && cp < x + 10); return z == null ? c : String(cp - z); }).match(/[0-9]+/g) || []); }
function txPhOk(en, tr){
  const re = /\{[A-Za-z0-9_]+\}/g, a = (String(en).match(re) || []).sort().join(), b = (String(tr).match(re) || []).sort().join();
  if (a !== b) return false;
  const have = txDigits(tr);                       // every number of the English text must survive (catches texts attached to the wrong key)
  for (const d of txDigits(en)){ const i = have.indexOf(d); if (i < 0) return false; have.splice(i, 1); }
  return true;
}
function txValid(pack, src){
  const out = Object.create(null); if (!pack || !pack.t) return out;
  const h = pack.h || {};
  for (const k in pack.t){ const tr = pack.t[k]; if (src[k] != null && typeof tr === 'string' && tr && h[k] === txHash(src[k]) && txPhOk(src[k], tr)) out[k] = tr; }
  return out;
}
function txPack(tx, src){ const h = {}, t2 = {}; for (const k in tx){ if (src[k] != null){ t2[k] = tx[k]; h[k] = txHash(src[k]); } } return {h, t: t2}; }
function txCacheGet(c){ try { return JSON.parse(RAWLS.getItem('fin-tx:' + c) || 'null'); } catch (e) { return null; } }
function txCacheSet(c, tx, src){
  const val = JSON.stringify(Object.assign(txPack(tx, src), {at: Date.now()}));
  try { RAWLS.setItem('fin-tx:' + c, val); }
  catch (e) {                                   // storage full: keep only the language in use
    try { for (let i = RAWLS.length - 1; i >= 0; i--){ const k = RAWLS.key(i); if (k && k.indexOf('fin-tx:') === 0 && k !== 'fin-tx:' + c) RAWLS.removeItem(k); } RAWLS.setItem('fin-tx:' + c, val); } catch (e2) {}
  }
}
function txBoot(){ if (txCore()) { TX = null; TXL = lang; return; } TX = txValid(txCacheGet(lang), txSrc()); TXL = lang; }
function txPct(){ if (txCore()) return 100; const src = txSrc(), n = Object.keys(src).length; let have = 0; for (const k in src) if (TX && TX[k] != null) have++; return n ? Math.floor(have * 100 / n) : 100; }
var txRefT = 0, txRefTimer = null;
function txRefresh(){
  const run = () => { txRefT = Date.now(); txRefTimer = null; try { applyLang(true); } catch (e) {} try { rebuildNav(); } catch (e) {} txRender(); };
  if (Date.now() - txRefT > 1200) run(); else if (!txRefTimer) txRefTimer = setTimeout(run, 1200);
}
function txParse(text){ const s = String(text || ''), a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } }
function txPrompt(code, chunk){
  const L = txEnName(code);
  return 'You translate the user interface of a personal-finance calculator web app used mainly in Israel.\n' +
    'Translate every value of the JSON object below from English into ' + L + ' (language code "' + code + '"). Return ONLY a JSON object with exactly the same keys.\n' +
    'Rules:\n- Natural, concise wording a native speaker expects in a finance app; keep button and menu labels short.\n' +
    '- Keep placeholders such as {v}, {n}, {e}, {h} exactly as written.\n' +
    '- Keep emoji, symbols (· → ↗ ✓ ✗ ★ ●), numbers, %, currency codes (ILS, USD, EUR), URLs, and these names unchanged: Gemini, Claude, Google, GitHub, Binance, Coinbase, Blink, inter.il, AI Studio, ECB.\n' +
    '- Israeli terms: translate the meaning; for official bodies (Bank of Israel, National Insurance / Bituach Leumi, Kol Zchut, Tax Authority, Keren Hishtalmut) use the established name in ' + L + ' if one exists.\n' +
    '- No explanations, no notes, no markdown.\nJSON:\n' + JSON.stringify(chunk);
}
async function txAI(){
  if (gemKey()) return {kind: 'gemini'};
  return null;
}
async function txAsk(ai, code, chunk){
  const prompt = txPrompt(code, chunk);
  return txParse(await gemTry([SET.gmodel].concat(GEM_FALLBACK), gemKey(), [{role: 'user', parts: [{text: prompt}]}], {generationConfig: {responseMimeType: 'application/json', temperature: 0.2}}));
}
function txChunks(keys, src, max){
  const out = []; let cur = {}, n = 0;
  keys.forEach(k => { const len = src[k].length + k.length + 8; if (n && n + len > max){ out.push(cur); cur = {}; n = 0; } cur[k] = src[k]; n += len; });
  if (n) out.push(cur); return out;
}
async function txDb(){ if (!IN_CLAUDE) return null; try { return await window.claude.use('db'); } catch (e) { return null; } }
async function txStart(manual){
  const code = lang;
  if (txCore(code)){ TXJ = {id: TXJ.id + 1, busy: false, done: 0, total: 0, err: '', code}; txRender(); return; }
  const my = TXJ.id + 1, src = txSrc(), all = Object.keys(src);
  TXJ = {id: my, busy: true, done: 0, total: all.length, err: '', code};
  const live = () => TXJ.id === my && lang === code;
  const tx = Object.assign(Object.create(null), TX || {});
  const take = pack => { const v = txValid(pack, src); let n = 0; for (const k in v) if (tx[k] == null){ tx[k] = v[k]; n++; } return n; };
  txRender();
  // 1) a ready-made pack next to the page (site and app)
  try { const r = await fetch('lang/' + code + '.json?b=' + APP_BUILD, {cache: 'no-store'}); if (r.ok){ const j = await r.json(); if (take(j) && live()){ TX = tx; txRefresh(); } } } catch (e) {}
  // 2) the app's shared translations
  const db = await txDb();
  if (db){ try { const d = await db.doc('i18n/' + code).get(); if (d && d.exists && take(d.data()) && live()){ TX = tx; txRefresh(); } } catch (e) {} }
  if (!live()) return;
  let missing = all.filter(k => tx[k] == null);
  if (!missing.length){ TX = tx; txCacheSet(code, tx, src); TXJ.busy = false; TXJ.done = all.length; txRefresh(); return; }
  // 3) fill the rest with AI, visible texts first (automatically once per session, or on request)
  let tried = ''; try { tried = SS.getItem('fin-tx-try:' + code) || ''; } catch (e) {}
  if (!manual && tried === String(missing.length)){ TX = tx; TXJ.busy = false; TXJ.err = 'partial'; txRefresh(); return; }
  try { SS.setItem('fin-tx-try:' + code, String(missing.length)); } catch (e) {}
  const ai = await txAI();
  if (!ai){ TX = tx; txCacheSet(code, tx, src); TXJ.busy = false; TXJ.err = 'noai'; txRefresh(); return; }
  const seen = new Set($$('[data-i]').filter(e => e.offsetParent).map(e => e.dataset.i));
  missing = missing.filter(k => seen.has(k)).concat(missing.filter(k => !seen.has(k)));
  const chunks = txChunks(missing, src, 6000);
  TXJ.done = all.length - missing.length; txRender();
  let idx = 0, fails = 0, stop = '';
  const worker = async () => {
    while (idx < chunks.length && live() && !stop){
      const ch = chunks[idx++];
      for (let attempt = 0; attempt < 3 && live() && !stop; attempt++){
        try {
          const res = await txAsk(ai, code, ch);
          if (!res) throw new Error('parse');
          let got = 0;
          for (const k in ch){ const tr = res[k]; if (typeof tr === 'string' && tr.trim() && txPhOk(ch[k], tr)){ tx[k] = tr.trim(); got++; } }
          TXJ.done += got; TX = tx; txRefresh();
          break;
        } catch (e) {
          const c = (e && (e.code || e.message)) || '';
          if (c === 'not_granted' || GEM_STOP.includes(c)){ stop = c === 'not_granted' ? 'denied' : c; break; }
          if (c === 'rate_limited' || c === 'gk_eQuota'){ await new Promise(r => setTimeout(r, 15000 * (attempt + 1))); continue; }
          if (attempt === 2) fails++;
        }
      }
      if (live()) txCacheSet(code, tx, src);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (!live()) return;
  TX = tx; txCacheSet(code, tx, src);
  TXJ.busy = false; TXJ.err = stop || (all.some(k => tx[k] == null) ? 'partial' : '');
  if (db && PERM === 'owner'){ try { await db.doc('i18n/' + code).set(Object.assign(txPack(tx, src), {at: Date.now(), lang: code})); } catch (e) {} }
  txRefresh();
}
function txRender(){
  const core = txCore(), pct = txPct(), L = txNative(lang);
  let st = $('#tx_st');
  if (!st){ const f = $('#set_lang') && $('#set_lang').closest('.field'); if (f){ st = document.createElement('div'); st.id = 'tx_st'; st.className = 'gk-st'; st.setAttribute('role', 'status'); f.insertAdjacentElement('afterend', st); } }
  if (st){
    let cls = '', h = '';
    if (core) h = '';
    else if (TXJ.busy && TXJ.code === lang){ cls = 'wait'; h = '<b>🌐 ' + asEsc(t('tx_busy', {l: L, p: Math.min(99, pct)})) + '</b>'; }
    else if (pct >= 100){ cls = 'ok'; h = '<b>✓ ' + asEsc(t('tx_done', {l: L})) + '</b>'; }
    else {
      const why = TXJ.err === 'denied' ? 'tx_denied' : (IN_CLAUDE || gemKey()) ? 'tx_partIn' : 'tx_partSite';
      cls = 'new'; h = '<b>' + asEsc(t('tx_part', {l: L, p: pct})) + '</b> ' + asEsc(t(why)) + ' <button type="button" class="btn tx-go" id="tx_go">' + asEsc(t('tx_go')) + '</button>';
    }
    st.className = 'gk-st ' + cls; st.innerHTML = h;
  }
  let bar = $('#tx_bar');
  const show = !core && TXJ.busy && TXJ.code === lang && TXJ.total > 0 && pct < 100;
  if (!show){ if (bar) bar.remove(); return; }
  if (!bar){ bar = document.createElement('div'); bar.id = 'tx_bar'; bar.className = 'tx-bar'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
  bar.innerHTML = '<span>🌐 ' + asEsc(t('tx_busy', {l: L, p: Math.min(99, pct)})) + '</span><i style="--p:' + Math.min(99, pct) + '%"></i>';
}
document.addEventListener('click', e => { if (e.target.closest('#tx_go')) txStart(true); });
const _alTx = applyLang;
applyLang = function(){
  if (TXL !== lang){ TX = txCore() ? null : txValid(txCacheGet(lang), txSrc()); TXL = lang; const r = _alTx.apply(this, arguments); txStart(); return r; }
  return _alTx.apply(this, arguments);
};
if (!txCore()) setTimeout(txStart, 900);
setTimeout(txRender, 0);

/* ---- the personal model: a built-in assistant that runs on the device, with no key and no internet ---- */
var PM_KB = [   // [id, calculator, Hebrew terms, Arabic terms, English terms]
  ['prime', 'prime', 'פריים|ריבית פריים', 'برايم|البرايم|الفائدة الأساسية', 'prime|prime rate'],
  ['boi', 'prime', 'ריבית בנק ישראל|בנק ישראל|ריבית הבנק המרכזי', 'فائدة بنك إسرائيل|بنك إسرائيل|البنك المركزي', 'bank of israel|interest rate decision|central bank'],
  ['cpi', 'inflation', 'מדד המחירים|מדד המחירים לצרכן|המדד|מדד', 'مؤشر أسعار المستهلك|مؤشر الأسعار|مؤشر المستهلك|المؤشر', 'cpi|consumer price index|price index'],
  ['infl', 'inflation', 'אינפלציה|יוקר המחיה|שחיקת כסף', 'تضخم|التضخم|غلاء المعيشة', 'inflation|cost of living'],
  ['vat', 'vat', 'מעמ|מע״מ|מס ערך מוסף', 'ضريبة القيمة المضافة|القيمة المضافة|الضريبة المضافة', 'vat|value added tax'],
  ['points', 'salary', 'נקודות זיכוי|נקודת זיכוי|נקודות', 'نقاط الإعفاء|نقاط الائتمان|نقطة إعفاء', 'credit points|tax credit|credit point'],
  ['reserve', 'salary', 'מילואים|מילואימניק|ימי מילואים', 'الاحتياط|خدمة الاحتياط|جنود الاحتياط', 'reserve duty|reservist|reserves'],
  ['gross', 'salary', 'ברוטו|נטו|שכר נטו|תלוש', 'الإجمالي|الصافي|الراتب الصافي|قسيمة الراتب', 'gross|net pay|take home|payslip'],
  ['brackets', 'tax', 'מדרגות מס|מדרגת מס|מס הכנסה', 'شرائح الضريبة|شريحة ضريبية|ضريبة الدخل', 'tax bracket|income tax|brackets'],
  ['btl', 'salary', 'ביטוח לאומי|מס בריאות', 'التأمين الوطني|ضريبة الصحة', 'national insurance|bituach leumi|health tax'],
  ['pension', 'retire', 'פנסיה|קרן פנסיה|פרישה|קצבה', 'التقاعد|صندوق التقاعد|پنسيا|المعاش', 'pension|retirement|annuity'],
  ['hishtalmut', 'hishtalmut', 'קרן השתלמות|השתלמות', 'صندوق الاستكمال|كيرن هشتلموت', 'keren hishtalmut|study fund|hishtalmut'],
  ['overtime', 'overtime', 'שעות נוספות|שכר שעתי|שעה נוספת|125%|150%|שבת', 'ساعات إضافية|أجر الساعة', 'overtime|hourly wage|hourly pay'],
  ['taxrefund', 'taxrefund', 'החזר מס|החזרי מס|טופס 135|106', 'استرداد الضريبة|إرجاع الضريبة', 'tax refund|tax return|form 135'],
  ['joboffer', 'joboffer', 'הצעת עבודה|הצעות עבודה|השוואת משכורות|מקום עבודה', 'عرض عمل|مقارنة الرواتب', 'job offer|compare salaries|job offers'],
  ['freelance', 'freelance', 'כמה לגבות|תעריף לשעה|פרילנסר|מחיר לשעה', 'كم أتقاضى|سعر الساعة|عمل حر', 'hourly rate|freelance rate|how much to charge'],
  ['empcost', 'empcost', 'עלות מעביד|עלות מעסיק|עלות עובד', 'تكلفة صاحب العمل|تكلفة الموظف', 'employer cost|cost of employee'],
  ['mgmtfees', 'mgmtfees', 'דמי ניהול|דמי ניהול פנסיה|מהפקדה|מצבירה', 'رسوم الإدارة', 'management fees|pension fees'],
  ['kidsave', 'kidsave', 'חיסכון לכל ילד|חיסכון לילד|חסכון לילד', 'ادخار لكل طفل|توفير للطفل', 'child savings|savings for every child'],
  ['benefits', 'benefits', 'דמי אבטלה|אבטלה|דמי לידה|חופשת לידה', 'إعانة البطالة|البطالة|بدل الولادة', 'unemployment benefit|maternity pay|maternity'],
  ['mortcap', 'mortcap', 'כמה משכנתא|כושר החזר|משכנתא מקסימלית|כמה אפשר לקבל', 'كم رهن عقاري|القدرة على السداد', 'mortgage affordability|how much mortgage|max mortgage'],
  ['carbenefit', 'carbenefit', 'שווי רכב|שווי שימוש|רכב צמוד|רכב חברה', 'قيمة استخدام السيارة|سيارة الشركة', 'company car|car benefit|car value'],
  ['evfuel', 'evfuel', 'רכב חשמלי|חשמלי מול בנזין|בנזין|דלק|טעינה', 'سيارة كهربائية|بنزين|وقود', 'electric car|ev vs petrol|fuel cost'],
  ['appliance', 'appliance', 'צריכת חשמל|חשמל|מזגן|דוד|קוט"ש|וואט', 'استهلاك الكهرباء|مكيف', 'electricity cost|power usage|kwh|appliance'],
  ['unitprice', 'unitprice', 'מחיר ליחידה|מחיר לקילו|סופר|השוואת מחירים|לליטר', 'سعر الوحدة|سعر الكيلو|سوبرماركت', 'unit price|price per kg|supermarket|compare prices'],
  ['discount', 'discount', 'הנחה|מבצע|1+1|קופון|השני ב', 'خصم|عرض|كوبون', 'discount|sale|deal|coupon|bogo'],
  ['workdays', 'workdays', 'ימי עבודה|בין תאריכים|ימי חג|ספירת ימים', 'أيام العمل|بين تاريخين', 'working days|business days|days between dates'],
  ['severance', 'severance', 'פיצויים|פיצויי פיטורים|פיטורים', 'تعويضات|تعويض الفصل|الفصل من العمل', 'severance|dismissal|fired'],
  ['notice', 'notice', 'הודעה מוקדמת|התפטרות', 'الإشعار المسبق|الاستقالة', 'notice period|resignation|resign'],
  ['leave', 'leave', 'חופשה שנתית|ימי חופשה|חופשה', 'الإجازة السنوية|أيام الإجازة|إجازة', 'annual leave|vacation days|holiday pay'],
  ['capgain', 'capital', 'מס רווח הון|רווח הון|מס על מניות', 'ضريبة الأرباح الرأسمالية|الأرباح الرأسمالية|ضريبة الأسهم', 'capital gains|capital gains tax|tax on shares'],
  ['div', 'dividends', 'דיבידנד|דיבידנדים', 'أرباح موزعة|توزيعات الأرباح|الأرباح الموزّعة', 'dividend|dividends'],
  ['compound', 'compound', 'ריבית דריבית|ריבית מצטברת', 'الفائدة المركبة|الفائدة المركّبة', 'compound interest|compounding'],
  ['mortgage', 'mortgage', 'משכנתא|משכנתה|הלוואה לדירה', 'رهن عقاري|الرهن العقاري|قرض سكن|المشكنتا', 'mortgage|home loan'],
  ['tracks', 'mortgage', 'מסלולי משכנתא|מסלול משכנתא|תמהיל|מסלולים', 'مسارات الرهن|مسار القرض|المسارات', 'mortgage tracks|mortgage mix|loan tracks'],
  ['spitzer', 'loan', 'שפיצר|לוח שפיצר|החזר קבוע', 'شبيتسر|دفعات متساوية|جدول السداد', 'spitzer|amortization|fixed payment'],
  ['equal', 'loan', 'קרן שווה|קרן שוה', 'أصل متساو|أصل متساوٍ', 'equal principal'],
  ['linked', 'mortgage', 'הצמדה|צמוד מדד|צמודה למדד|צמוד', 'الربط بالمؤشر|مرتبط بالمؤشر|ربط', 'cpi linked|index linked|linkage'],
  ['refi', 'refi', 'מחזור משכנתא|מחזור|מיחזור', 'إعادة تمويل|إعادة التمويل', 'refinance|refinancing|refi'],
  ['prepay', 'prepay', 'פירעון מוקדם|עמלת פירעון|לסגור הלוואה', 'السداد المبكر|رسوم السداد', 'early repayment|prepayment|pay off early'],
  ['purchase', 'purchasetax', 'מס רכישה|קניית דירה|רכישת דירה', 'ضريبة الشراء|شراء شقة', 'purchase tax|buying a home|stamp duty'],
  ['betterment', 'landtax', 'מס שבח|שבח|מכירת דירה', 'ضريبة التحسين|بيع شقة', 'land appreciation|betterment tax|selling a home'],
  ['effective', 'loancmp', 'ריבית אפקטיבית|עלות אמיתית|השוואת הלוואות', 'الفائدة الفعلية|مقارنة القروض', 'effective rate|apr|compare loans'],
  ['credit', 'creditcard', 'תשלומים|קרדיט|כרטיס אשראי|אשראי', 'التقسيط|بطاقة الائتمان|الائتمان', 'instalments|installments|credit card'],
  ['emergency', 'savegoal', 'קרן חירום|כרית ביטחון|חיסכון לחירום', 'صندوق الطوارئ|مدخرات الطوارئ', 'emergency fund|rainy day'],
  ['networth', 'networth', 'שווי נקי|הון עצמי|נכסים והתחייבויות', 'صافي الثروة|الأصول والالتزامات', 'net worth|assets and liabilities'],
  ['fire', 'fire', 'fire|פרישה מוקדמת|עצמאות כלכלית|כלל 4', 'الاستقلال المالي|التقاعد المبكر', 'fire|early retirement|financial independence|4% rule'],
  ['avgcost', 'avgcost', 'מחיר ממוצע|ממוצע קנייה|השקעה חודשית', 'متوسط التكلفة|متوسط السعر', 'average cost|dollar cost averaging|dca'],
  ['yield', 'yield', 'תשואה|תשואה שנתית|רווח מהשקעה', 'العائد|العائد السنوي', 'return|yield|annual return'],
  ['rate', 'convert', 'שער יציג|שער דולר|שער חליפין|דולר|יורו', 'السعر التمثيلي|سعر الصرف|الدولار|اليورو', 'exchange rate|representative rate|dollar|euro'],
  ['crypto', 'convert', 'קריפטו|ביטקוין|מטבע דיגיטלי', 'العملات المشفرة|بيتكوين|عملة رقمية', 'crypto|bitcoin|cryptocurrency'],
  ['selfemp', 'selfemp', 'עוסק פטור|עוסק מורשה|עצמאי|עצמאים', 'مرخص معفى|مرخص مسجل|مستقل|العمل الحر', 'exempt dealer|licensed dealer|self employed|freelancer'],
  ['rentbuy', 'rentbuy', 'לשכור או לקנות|שכירות או קנייה|לקנות דירה', 'الاستئجار أم الشراء|إيجار أو شراء', 'rent or buy|renting vs buying'],
  ['breakeven', 'breakeven', 'נקודת איזון|איזון', 'نقطة التعادل|التعادل', 'break even|breakeven'],
  ['lease', 'carlease', 'ליסינג|ליסינג פרטי|רכב', 'ليسينغ|تأجير السيارة|سيارة', 'lease|car lease|leasing'],
  ['debt', 'debtplan', 'סגירת חובות|חובות|כדור שלג|חוב', 'سداد الديون|الديون|كرة الثلج', 'debt payoff|debts|snowball|avalanche'],
  ['rental', 'rental', 'הכנסה משכירות|מס על שכירות|שכר דירה', 'دخل الإيجار|ضريبة الإيجار', 'rental income|rent tax|landlord'],
  ['savegoal', 'savegoal', 'יעד חיסכון|לחסוך|חיסכון', 'هدف الادخار|الادخار|ادخار', 'savings goal|save for|saving']
];
var PM_STOP = new Set('מה איך כמה האם של את על עם זה זו אני לי יש אין או גם כל מי למה אם רוצה צריך לחשב חישוב מחשבון תגיד תסביר הסבר בבקשה ما كيف كم هل من في على مع هذا هذه أنا لي أريد احسب حاسبة اشرح what how much many the is are a an of to for my i me do does can calculate calculator explain please about tell'.split(' '));
var PM_RX = {
  greet: /(^| )(היי|הי|שלום|בוקר טוב|ערב טוב|hello|hi|hey|مرحبا|اهلا|أهلا|السلام عليكم|صباح الخير)( |$)/,
  thanks: /(^| )(תודה|תודה רבה|thanks|thank you|شكرا|شكرًا)( |$)/,
  help: /(מה אתה יודע|מה אתה יכול|במה אתה|עזרה|מי אתה|help|what can you|who are you|ماذا تستطيع|ماذا يمكنك|مساعدة|من أنت)/,
  res: /(תוצא|יצא לי|מה יצא|explain my|my result|results?( |$)|نتيج|اشرح)/
};
var PM_LASTCALC = '';
function pmName(){ return String(SET.pmName || '').trim() || t('pm_defName'); }
function pmNorm(s){ return ' ' + String(s || '').toLowerCase().replace(/[֑-ׇً-ٰٟ]/g, '').replace(/[״"׳'`]/g, '').replace(/[^\p{L}\p{N}%]+/gu, ' ').replace(/(^|\s)(وال|بال|فال|كال|لل|ال)(?=\p{L}{2})/gu, '$1').replace(/[أإآ]/g, 'ا').replace(/ة(?=\s|$)/g, 'ه').trim() + ' '; }
function pmEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function pmTerms(e){
  const all = (e[2] + '|' + e[3] + '|' + e[4]).split('|').concat([t('kbt_' + e[0])]);
  return [...new Set(all.map(x => pmNorm(x).trim()).filter(x => x.length >= 3 || /^[a-z]{2,}$/.test(x) && x.length >= 3))];
}
function pmMatchKB(q){
  const n = pmNorm(q), out = [];
  PM_KB.forEach(e => {
    let sc = 0;
    pmTerms(e).forEach(term => {
      const re = new RegExp('(?:^|\\s)(?:[ובהלמשכד]{1,3}|و|ف|ب|ل|ك|ال|وال|بال|لل|فال)?' + pmEsc(term), 'u');
      if (re.test(n)) sc = Math.max(sc, term.length + (term.includes(' ') ? 6 : 0));
    });
    if (sc) out.push([sc, e]);
  });
  return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
}
function pmCalcs(q){
  const words = pmNorm(q).trim().split(' ').filter(w => w.length >= 3 && !PM_STOP.has(w));
  if (!words.length) return [];
  const forms = w => { const f = [w]; if (/^[ובהלמשכ]/.test(w) && w.length >= 4) f.push(w.slice(1)); if (/^(ال|وال|بال)/.test(w) && w.length >= 5) f.push(w.replace(/^(وال|بال|ال)/, '')); return f; };
  const res = [];
  TABS.filter(id => !['home', 'settings', 'assist'].includes(id)).forEach(id => {
    const text = pmNorm(all3('tab_' + id) + ' ' + all3('d_' + id) + ' ' + (GS_SYN[id] || '') + ' ' + t('tab_' + id) + ' ' + t('d_' + id));
    const title = pmNorm(all3('tab_' + id) + ' ' + t('tab_' + id));
    let sc = 0;
    words.forEach(w => { const f = forms(w); if (f.some(x => title.includes(' ' + x) || title.includes(x + ' '))) sc += 3; else if (f.some(x => text.includes(x))) sc += 1; });
    if (sc) res.push([sc, id]);
  });
  return res.sort((a, b) => b[0] - a[0]).filter((x, i, a) => x[0] >= Math.max(2, a[0][0] - 1)).map(x => x[1]);
}
function pmKB(e){ return '**' + t('kbt_' + e[0]) + '**\n' + t('kb_' + e[0]); }
function pmResults(id){
  const r = exResults(id); if (!r) return t('pm_noRes');
  const long = SET.pmStyle === 'long';
  let s = t('pm_resIntro', {c: t('tab_' + id)}) + '\n**' + r.main + '**';
  r.rows.slice(0, long ? 12 : 5).forEach(x => { s += '\n- ' + x; });
  if (r.note) s += '\n\n' + r.note;
  if (r.warn) s += '\n⚠️ ' + r.warn;
  const kb = PM_KB.filter(e => e[1] === id).slice(0, long ? 2 : 1);
  if (kb.length) s += '\n\n' + kb.map(pmKB).join('\n\n');
  if (long) s += '\n\n' + t('pm_tip');
  return s + '\n[[' + id + ']]';
}
function pmAnswer(q){
  const n = pmNorm(q), long = SET.pmStyle === 'long', nm = pmName();
  if (PM_RX.thanks.test(n) && n.trim().split(' ').length <= 4) return t('pm_thanks');
  if (PM_RX.greet.test(n) && n.trim().split(' ').length <= 3) return t('pm_hello', {n: nm});
  if (PM_RX.help.test(n)) return t('pm_help', {n: nm});
  const kb = pmMatchKB(q), calcs = pmCalcs(q);
  if (PM_RX.res.test(n) && kb.length === 0){ const id = calcs[0] || PM_LASTCALC; return id ? pmResults(id) : t('pm_noRes'); }
  const out = [];
  kb.slice(0, long ? 3 : 2).forEach(e => out.push(pmKB(e) + (e[1] ? '\n[[' + e[1] + ']]' : '')));
  const cs = calcs.filter(id => !kb.some(e => e[1] === id)).slice(0, long ? 3 : kb.length ? 1 : 2);
  if (cs.length) out.push((kb.length ? t('pm_alsoCalc') : t('pm_calcFit')) + '\n' + cs.map(id => '[[' + id + ']] ' + t('d_' + id)).join('\n'));
  if (!out.length) return t('pm_unknown') + '\n- ' + t('pm_ex1') + '\n- ' + t('pm_ex2') + '\n- ' + t('pm_ex3');
  if (long) out.push(t('pm_tip'));
  return out.join('\n\n');
}
function exLocal(id, kind, extra){
  const note = '<p class="fine pm-badge">' + asEsc(t('pm_badge', {n: pmName()})) + '</p>';
  if (kind === 'q') return exFmt(pmAnswer(extra).replace(/\[\[([a-z0-9]+)\]\]/g, (_, c) => TABS.includes(c) ? t('tab_' + c) + ' ←' : '')) + note;
  const fs = exFields(id);
  if (kind === 'field'){
    const f = fs.find(x => x.label === extra) || {label: extra, value: '', hint: ''};
    const kb = pmMatchKB(f.label + ' ' + f.hint)[0];
    let s = '**' + f.label + '**' + (f.value ? ' — ' + t('pm_now', {v: f.value}) : '') + (f.hint ? '\n' + f.hint : '');
    if (kb) s += '\n\n' + pmKB(kb);
    return exFmt(s) + note;
  }
  if (kind === 'row'){
    const r = exResults(id), row = r && r.rows.find(x => x.indexOf(extra) === 0);
    const kb = pmMatchKB(extra)[0];
    return exFmt('**' + (row || extra) + '**' + (r && r.note ? '\n\n' + r.note : '') + (kb ? '\n\n' + pmKB(kb) : '')) + note;
  }
  const withHint = fs.filter(f => f.hint).map(f => '- **' + f.label + '**: ' + f.hint).join('\n');
  return exFmt(t('d_' + id) + (withHint ? '\n\n' + withHint : '') + '\n\n' + pmResults(id).replace(/\n?\[\[[a-z0-9]+\]\]/g, '')) + note;
}
function aiPick(){
  const e = SET.aiEngine || 'auto', cl = typeof claudeOk === 'function' && claudeOk();
  if (e === 'personal') return 'personal';
  if (e === 'claude') return cl ? 'claude' : 'personal';
  if (e === 'gemini') return 'gemini';
  return cl ? 'claude' : gemKey() && !IN_CLAUDE ? 'gemini' : 'personal';   // inside Claude Google cannot be reached
}
function engRender(){
  const box = $('#as_eng'); if (!box) return;
  const opts = ['auto', 'personal'].concat(typeof CAI === 'object' && CAI.fn ? ['claude'] : [], IN_CLAUDE ? [] : ['gemini']);
  const cur = opts.includes(SET.aiEngine) ? SET.aiEngine : 'auto';
  box.innerHTML = opts.map(o => `<button type="button" data-eng="${o}" aria-pressed="${o === cur}">${asEsc(o === 'personal' ? pmName() : t('eng_' + o))}</button>`).join('');
  const now = $('#as_engnow'), pk = aiPick();
  if (now) now.textContent = t('as_engNow', {n: pk === 'personal' ? pmName() : pk === 'gemini' ? 'Gemini' : 'Claude'});
}
document.addEventListener('click', e => {
  const b = e.target.closest('#as_eng [data-eng]'); if (!b) return;
  SET.aiEngine = b.dataset.eng; saveSet();
  const s = $('#set_aiEngine'); if (s) s.value = SET.aiEngine;
  engRender();
});
document.addEventListener('change', e => { if (['set_aiEngine', 'set_pmName', 'set_pmStyle'].includes(e.target.id)) setTimeout(engRender, 0); });
const _actPm = activate;
activate = function(id){ if (!['home', 'settings', 'assist'].includes(id)) PM_LASTCALC = id; const r = _actPm.apply(this, arguments); if (id === 'assist') engRender(); return r; };
const _rsPm = renderStamp;
renderStamp = function(){ _rsPm.apply(this, arguments); engRender(); };
setTimeout(engRender, 1500);
engRender();

/* ---- theme gallery (Settings → Display, and the palette button in the header) ---- */
function skCard(k){
  const sk = SKINS[k], pv = sk ? sk.pv : SKIN_PV[k] || SKIN_PV.dark;
  const live = HOL_ACTIVE === k;
  const style = `--pv-bg:${pv[0]};--pv-rail:${pv[1]};--pv-card:${pv[2]};--pv-hh:${sk ? (sk.t['--sk-hh'] || pv[3]) : 'linear-gradient(135deg,#6b4d12,#2a1f08 55%,#171108)'};--pv-acc:${pv[4]};--pv-v:${k === 'light' || k === 'dark' || k === 'system' ? '#FFE29A' : (sk.t['--sk-hh-v'] || pv[5])}`;
  return `<button type="button" class="skin-c" role="radio" data-skin-pick="${k}" aria-checked="${(SET.theme || 'system') === k}">
    <span class="skin-pv${k === 'system' ? ' split' : ''}" style="${style}" aria-hidden="true"><i class="r"></i><span class="h"><b>₪12,480</b></span><span class="c"><i></i><u></u></span><span class="c"><u></u><i></i></span></span>
    <span class="skin-n">${asEsc(t('sk_' + k))}${live ? ` <em class="skin-live">${asEsc(t('hol_live'))}</em>` : ''}</span><small>${asEsc(t('sk_' + k + 'S'))}</small></button>`;
}
function skRender(){
  const grp = (k, ids) => `<h4 class="skins-h">${asEsc(t(k))}</h4>` + ids.map(skCard).join('');
  const note = HOL_ACTIVE ? `<p class="skins-now">✨ ${asEsc(t('hol_now', {n: t('sk_' + HOL_ACTIVE)}))}</p>` : '';
  const html = note + grp('sk_main', SKIN_ORDER) + grp('hol_j', SKIN_HOL.j) + grp('hol_c', SKIN_HOL.c) + grp('hol_m', SKIN_HOL.m);
  $$('.skins').forEach(box => { box.innerHTML = html; });
}
function skPick(k){
  if (!SKIN_ORDER.includes(k) && !SKINS[k]) return;
  SET.theme = k; SET.accentFor = ''; saveSet(); applyTheme();
  const s = $('#set_theme'); if (s) s.value = k;
  skRender();
  try { calc(tab); } catch (e) {}
}
function skOpen(){
  if (!$('#skx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="skx" hidden><div class="cp-box sk-box" role="dialog" aria-modal="true" aria-labelledby="sk_t">
    <div class="cp-top"><h3 id="sk_t"></h3><button type="button" class="cp-x" id="sk_x">×</button></div>
    <div class="skins" role="radiogroup"></div><p class="fine" id="sk_h"></p></div></div>`);
  $('#sk_t').textContent = t('sk_title'); $('#sk_h').textContent = t('h_theme');
  skRender(); $('#skx').hidden = false; document.body.classList.add('cp-lock');
  setTimeout(() => { const c = $('#skx .skin-c[aria-checked="true"]') || $('#skx .skin-c'); if (c) c.focus(); }, 30);
}
function skClose(){ const o = $('#skx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#skinBtn'); if (b) b.focus(); } }
document.addEventListener('click', e => {
  const c = e.target.closest('[data-skin-pick]'); if (c){ skPick(c.dataset.skinPick); return; }
  if (e.target.closest('#skinBtn')){ skOpen(); return; }
  const o = $('#skx'); if (o && !o.hidden && (e.target === o || e.target.closest('#sk_x'))) skClose();
});
document.addEventListener('keydown', e => {
  const o = $('#skx'); if (e.key === 'Escape' && o && !o.hidden) skClose();
  const c = e.target.closest && e.target.closest('.skin-c'); if (!c || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const rtl = document.documentElement.dir === 'rtl', all = $$('.skin-c', c.parentElement), i = all.indexOf(c), fw = e.key === 'ArrowDown' || (e.key === 'ArrowLeft' ? rtl : e.key === 'ArrowRight' ? !rtl : false);
  const n = all[(i + (fw ? 1 : -1) + all.length) % all.length]; if (n){ e.preventDefault(); n.focus(); }
});
const _rsSk = renderStamp;
renderStamp = function(){ _rsSk.apply(this, arguments); skRender(); };
skRender();

setInterval(() => { const was = HOL_ACTIVE; applyTheme(); if (was !== HOL_ACTIVE) skRender(); }, 30 * 60000);   // holidays start and end on their own

/* ---- home clock: time, Gregorian date and Hebrew date, in several styles ---- */
var CLOCK_STYLES = ['digital', 'lock', 'standby', 'stack', 'glass', 'outline', 'flip', 'analog', 'calendar', 'minimal', 'off'];
function gem(n){
  const L = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  let x = n % 1000, s = '';
  for (const [v, c] of L){ while (x >= v){ if (x === 15){ s += 'טו'; x = 0; break; } if (x === 16){ s += 'טז'; x = 0; break; } s += c; x -= v; } }
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}
function ckLoc(){ const base = {he: 'he-IL', ar: 'ar', en: 'en-GB'}[lang] || lang; return SET.digits === 'latn' ? base + '-u-nu-latn' : base; }
function ckHeb(d){
  try {
    if (lang === 'he'){ const p = new Intl.DateTimeFormat('he-u-ca-hebrew', {day: 'numeric', month: 'long', year: 'numeric'}).formatToParts(d); const g = k => (p.find(x => x.type === k) || {}).value;
      return gem(+g('day')) + ' ב' + g('month') + ' ' + gem(+g('year')); }
    return new Intl.DateTimeFormat(ckLoc().replace(/-u-.*/, '') + '-u-ca-hebrew', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
  } catch (e) { return ''; }
}
function ckHijri(d){ try { return new Intl.DateTimeFormat(ckLoc().replace(/-u-.*/, '') + '-u-ca-islamic-umalqura', {day: 'numeric', month: 'long', year: 'numeric'}).format(d); } catch (e) { return ''; } }
function ckNumLoc(){ const n = SET.clockNum; return n === 'latn' || n === 'arab' ? ckLoc().replace(/-u-.*/, '') + '-u-nu-' + n : ckLoc(); }
function ckTime(d, sec){ return new Intl.DateTimeFormat(ckNumLoc(), {hour: '2-digit', minute: '2-digit', second: sec ? '2-digit' : undefined, hour12: SET.clock24 === '0'}).format(d); }
function ckParts(d){
  const L = ckLoc();
  return {
    time: ckTime(d, SET.clockSec === '1'), timeShort: ckTime(d, false),
    weekday: new Intl.DateTimeFormat(L, {weekday: 'long'}).format(d),
    greg: new Intl.DateTimeFormat(L, {day: 'numeric', month: 'long', year: 'numeric'}).format(d),
    gregShort: new Intl.DateTimeFormat(L, {day: 'numeric', month: 'numeric', year: 'numeric'}).format(d),
    day: new Intl.DateTimeFormat(L, {day: 'numeric'}).format(d), month: new Intl.DateTimeFormat(L, {month: 'long', year: 'numeric'}).format(d),
    heb: SET.clockHeb !== '0' ? ckHeb(d) : '', hij: SET.clockHijri === '1' ? ckHijri(d) : '',
    dm: new Intl.DateTimeFormat(L, {day: 'numeric', month: 'long'}).format(d),
    ...(() => { try { const tp = new Intl.DateTimeFormat(ckNumLoc(), {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: SET.clock24 === '0'}).formatToParts(d), g = k => (tp.find(x => x.type === k) || {}).value || '';
      return {hh: g('hour'), mm: g('minute'), ss: g('second'), ap: g('dayPeriod')}; } catch (e) { return {hh: '', mm: '', ss: '', ap: ''}; } })()
  };
}
function ckAnalog(size){
  const ticks = Array.from({length: 12}, (_, i) => `<line x1="50" y1="${i % 3 ? 9 : 7}" x2="50" y2="${i % 3 ? 13 : 16}" transform="rotate(${i * 30} 50 50)"/>`).join('');
  return `<svg class="ck-face" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle class="ck-rim" cx="50" cy="50" r="46"/><g class="ck-ticks">${ticks}</g>
    <line class="ck-h" x1="50" y1="54" x2="50" y2="28"/><line class="ck-m" x1="50" y1="56" x2="50" y2="17"/><line class="ck-s" x1="50" y1="60" x2="50" y2="13"/><circle class="ck-pin" cx="50" cy="50" r="2.6"/></svg>`;
}
function ckDates(p, cls){
  return `<div class="${cls}"><span class="ck-g"><span class="ck-tag">${asEsc(t('ck_greg'))}</span><b class="ck-greg"></b></span>` +
    (p.heb ? `<span class="ck-hb"><span class="ck-tag">${asEsc(t('ck_heb'))}</span><b class="ck-heb" lang="${lang === 'he' ? 'he' : lang}"></b></span>` : '') +
    (p.hij ? `<span class="ck-hj"><span class="ck-tag">${asEsc(t('ck_hijri'))}</span><b class="ck-hij"></b></span>` : '') + '</div>';
}
function ckSub(p){ return (p.heb ? '<span class="ck-heb"></span>' : '') + (p.hij ? '<span class="ck-hij"></span>' : ''); }
function ckHTML(style, p){
  const sec = SET.clockSec === '1' ? '<b class="ck-ss"></b>' : '', ap = SET.clock24 === '0' ? '<span class="ck-ap"></span>' : '';
  if (style === 'lock') return `<div class="ck ck-lock"><span class="ck-top"><span class="ck-wd"></span><span class="ck-dot">·</span><span class="ck-dm"></span></span><b class="ck-tm ck-num"></b><span class="ck-sub">${ckSub(p)}</span></div>`;
  if (style === 'standby') return `<div class="ck ck-sb"><div class="ck-sbt ck-num" dir="ltr"><b class="ck-hh"></b><b class="ck-mm"></b>${sec}${ap}</div><div class="ck-sbd"><span class="ck-wd"></span><span class="ck-dm"></span>${ckSub(p)}</div></div>`;
  if (style === 'stack') return `<div class="ck ck-stack"><div class="ck-stk ck-num" dir="ltr"><b class="ck-hh"></b><b class="ck-mm"></b>${sec}${ap}</div><div class="ck-col"><b class="ck-wd"></b>${ckDates(p, 'ck-dates')}</div></div>`;
  if (style === 'glass') return `<div class="ck ck-glass"><span class="ck-blob b1"></span><span class="ck-blob b2"></span><div class="ck-gl"><span class="ck-top"><span class="ck-wd"></span><span class="ck-dot">·</span><span class="ck-dm"></span></span><b class="ck-tm ck-num"></b><span class="ck-sub">${ckSub(p)}</span></div></div>`;
  if (style === 'outline') return `<div class="ck ck-outline"><b class="ck-tm ck-num"></b><span class="ck-top"><span class="ck-wd"></span><span class="ck-dot">·</span><span class="ck-greg"></span></span><span class="ck-sub">${ckSub(p)}</span></div>`;
  if (style === 'flip') return `<div class="ck ck-flip"><div class="ck-tiles ck-num" dir="ltr"></div><div class="ck-fl-d"><b class="ck-wd"></b><span class="ck-greg"></span>${ckSub(p)}</div></div>`;
  if (style === 'analog') return `<div class="ck ck-analog">${ckAnalog(104)}<div class="ck-col"><b class="ck-wd"></b>${ckDates(p, 'ck-dates')}<span class="ck-tm ck-small"></span></div></div>`;
  if (style === 'calendar') return `<div class="ck ck-cal"><div class="ck-page"><span class="ck-mo"></span><b class="ck-day ck-num"></b><span class="ck-wd"></span></div><div class="ck-col"><b class="ck-tm ck-big2 ck-num"></b>${ckDates(p, 'ck-dates')}</div></div>`;
  if (style === 'minimal') return `<div class="ck ck-min"><b class="ck-tm ck-num"></b><span class="ck-wd"></span><span class="ck-gs"></span>${p.heb ? '<span class="ck-heb"></span>' : ''}${p.hij ? '<span class="ck-hij"></span>' : ''}</div>`;
  return `<div class="ck ck-dig"><div class="ck-row"><b class="ck-tm ck-big ck-num"></b><span class="ck-wd"></span></div>${ckDates(p, 'ck-dates ck-dates-row')}</div>`;
}
function ckFill(root, p, d){
  const set = (sel, v) => $$(sel, root).forEach(e => { if (e.textContent !== v) e.textContent = v; });
  set('.ck-tm', root.closest && root.closest('.cstyles') ? p.timeShort : p.time); set('.ck-wd', p.weekday); set('.ck-greg', p.greg); set('.ck-gs', p.gregShort);
  set('.ck-heb', p.heb); set('.ck-hij', p.hij); set('.ck-day', p.day); set('.ck-mo', p.month);
  set('.ck-dm', p.dm); set('.ck-hh', p.hh); set('.ck-mm', p.mm); set('.ck-ss', p.ss); set('.ck-ap', p.ap);
  $$('.ck-tiles', root).forEach(el => {
    const parts = [p.hh, p.mm].concat(SET.clockSec === '1' && !(root.closest && root.closest('.cstyles')) ? [p.ss] : []), key = parts.join(':') + p.ap;
    if (el.dataset.k === key) return; el.dataset.k = key;
    el.innerHTML = parts.map(x => `<span class="ck-pair">${Array.from(x).map(c => `<span class="ck-tile">${asEsc(c)}</span>`).join('')}</span>`).join('<span class="ck-colon">:</span>') + (p.ap ? `<span class="ck-ap">${asEsc(p.ap)}</span>` : '');
  });
  const face = $('.ck-face', root);
  if (face){
    const h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
    $('.ck-h', face).setAttribute('transform', `rotate(${h * 30 + m / 2} 50 50)`);
    $('.ck-m', face).setAttribute('transform', `rotate(${m * 6 + s / 10} 50 50)`);
    const sh = $('.ck-s', face); sh.style.display = SET.clockSec === '1' ? '' : 'none'; sh.setAttribute('transform', `rotate(${s * 6} 50 50)`);
  }
}
var CK_KEY = '';
function clockRender(){
  const box = $('#hclock'); if (!box) return;
  const style = CLOCK_STYLES.includes(SET.clockStyle) ? SET.clockStyle : 'digital';
  box.hidden = style === 'off';
  const d = new Date(), p = ckParts(d), key = [style, lang, SET.clockHeb, SET.clockHijri, SET.clock24, SET.clockSec, SET.digits, SET.clockNum].join('|');
  ckLook(box);
  if (style !== 'off'){ if (CK_KEY !== key){ CK_KEY = key; box.innerHTML = ckHTML(style, p); } ckFill(box, p, d); }
  if (tab === 'settings') csRender();      // the style previews only matter while Settings is open
}
function csRender(){
  const box = $('#cstyles'); if (!box) return;
  const cur = CLOCK_STYLES.includes(SET.clockStyle) ? SET.clockStyle : 'digital', d = new Date(), p = ckParts(d);
  const key = cur + '|' + lang + '|' + [SET.clockHeb, SET.clockHijri, SET.clock24, SET.digits, SET.clockNum].join('');
  ckLook(box); ckStudio();
  if (box.dataset.k !== key){
    box.dataset.k = key;
    box.innerHTML = CLOCK_STYLES.map(s => `<button type="button" class="cs-c" role="radio" data-cstyle="${s}" aria-checked="${s === cur}">
      <span class="cs-pv" aria-hidden="true">${s === 'off' ? '<span class="cs-off">—</span>' : ckHTML(s, p)}</span>
      <span class="skin-n">${asEsc(t('cs_' + s))}</span><small>${asEsc(t('cs_' + s + 'S'))}</small></button>`).join('');
  }
  $$('.cs-pv', box).forEach(pv => ckFill(pv, p, d));
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cstyle]'); if (c){ SET.clockStyle = c.dataset.cstyle; saveSet(); clockRender(); return; }
  const o = e.target.closest('[data-ckopt]'); if (o){ SET[o.dataset.ckopt] = o.dataset.v; saveSet(); CK_KEY = ''; const b = $('#cstyles'); if (b) b.dataset.k = ''; clockRender(); }
});
/* the look of the numerals, like the iPhone lock screen: font, weight, colour, size and digits */
var CK_FONTS = {sys: ['', ''], round: ["'Rubik'", 'Rubik:wght@300..900'], serif: ["'Frank Ruhl Libre'", 'Frank+Ruhl+Libre:wght@300..900'], mono: ["'IBM Plex Mono'", 'IBM+Plex+Mono:wght@200;300;400;500;600;700'],
  tall: ["'Oswald'", 'Oswald:wght@200..700'], stencil: ["'Big Shoulders Stencil Display'", 'Big+Shoulders+Stencil+Display:wght@300..900']};
var CK_COLORS = {accent: '', ink: 'var(--ink)', blue: '#3B82F6', teal: '#14B8A6', green: '#22C55E', orange: '#F97316', pink: '#EC4899', violet: '#8B5CF6',
  sunset: 'linear-gradient(135deg,#FFB000,#FF4D6D)', ocean: 'linear-gradient(135deg,#22D3EE,#6366F1)', aurora: 'linear-gradient(135deg,#34D399,#3B82F6 55%,#A855F7)'};
var CK_WEIGHTS = ['auto', '200', '300', '500', '700', '900'], CK_SIZES = {s: .82, m: 1, l: 1.18, xl: 1.38}, CK_NUMS = ['auto', 'latn', 'arab'];
function ckFontLoad(k){
  const f = CK_FONTS[k]; if (!f || !f[1] || document.getElementById('ckf-' + k)) return;
  const l = document.createElement('link'); l.id = 'ckf-' + k; l.rel = 'stylesheet';
  l.href = GF_CSS + '?family=' + f[1] + '&display=swap&text=' + encodeURIComponent('0123456789:.٠١٢٣٤٥٦٧٨٩AMPamp ');
  document.head.appendChild(l);
}
function ckLook(el){
  if (!el) return;
  const f = CK_FONTS[SET.clockFont] ? SET.clockFont : 'sys', c = CK_COLORS[SET.clockColor] != null ? SET.clockColor : 'accent', w = CK_WEIGHTS.includes(SET.clockWeight) ? SET.clockWeight : 'auto';
  if (f !== 'sys') ckFontLoad(f);
  const cv = CK_COLORS[c], grad = /gradient/.test(cv);
  const stack = "-apple-system, BlinkMacSystemFont, system-ui, 'IBM Plex Sans Hebrew', 'IBM Plex Sans Arabic', sans-serif";
  el.style.setProperty('--ckf', CK_FONTS[f][0] ? CK_FONTS[f][0] + ', ' + stack : 'var(--ckf0, ' + stack + ')');
  if (w === 'auto') el.style.removeProperty('--ckw'); else el.style.setProperty('--ckw', w);
  el.style.setProperty('--ckc', grad ? '#8B5CF6' : cv || 'var(--gold-ui)');
  el.style.setProperty('--ckg', grad ? cv : 'none');
  el.style.setProperty('--ckc-glass', c === 'accent' ? 'rgba(255,255,255,.92)' : grad ? 'transparent' : cv);
  el.style.setProperty('--cks', String(CK_SIZES[SET.clockSize] || 1));
  el.classList.toggle('ck-grad', grad);
}
function ckStudio(){
  const box = $('#ck_studio'); if (!box) return;
  const cur = k => SET[k] || ({clockFont: 'sys', clockColor: 'accent', clockWeight: 'auto', clockSize: 'm', clockNum: 'auto'})[k];
  const key = [lang, cur('clockFont'), cur('clockColor'), cur('clockWeight'), cur('clockSize'), cur('clockNum')].join('|');
  if (box.dataset.k === key) return; box.dataset.k = key;
  Object.keys(CK_FONTS).forEach(ckFontLoad);
  const chip = (opt, v, label, extra) => `<button type="button" class="ck-chip${cur(opt) === v ? ' on' : ''}" data-ckopt="${opt}" data-v="${v}" aria-pressed="${cur(opt) === v}"${extra || ''}>${label}</button>`;
  const row = (k, inner) => `<div class="ck-st-r"><span class="ck-st-l">${asEsc(t(k))}</span><div class="ck-st-o">${inner}</div></div>`;
  box.innerHTML = row('ck_font', Object.keys(CK_FONTS).map(k => chip('clockFont', k, `<span class="ck-fs" style="font-family:${CK_FONTS[k][0] ? CK_FONTS[k][0] + ',' : ''}inherit" dir="ltr">10:09</span><small>${asEsc(t('ck_f_' + k))}</small>`, ' data-kind="font"')).join('')) +
    row('ck_color', Object.keys(CK_COLORS).map(k => { const cv = CK_COLORS[k] || 'var(--gold-ui)'; return `<button type="button" class="ck-sw${cur('clockColor') === k ? ' on' : ''}" data-ckopt="clockColor" data-v="${k}" aria-pressed="${cur('clockColor') === k}" aria-label="${asEsc(t('ck_c_' + k))}" title="${asEsc(t('ck_c_' + k))}" style="background:${cv}"></button>`; }).join('')) +
    row('ck_weight', CK_WEIGHTS.map(w => chip('clockWeight', w, `<span style="font-weight:${w === 'auto' ? 600 : w}">${asEsc(t('ck_w_' + w))}</span>`)).join('')) +
    row('ck_size', Object.keys(CK_SIZES).map(z => chip('clockSize', z, asEsc(t('ck_s_' + z)))).join('')) +
    row('ck_num', CK_NUMS.map(n => chip('clockNum', n, n === 'auto' ? asEsc(t('ck_n_auto')) : `<span dir="ltr">${n === 'arab' ? '١٢:٣٤' : '12:34'}</span>`)).join('')) +
    `<div class="btnrow"><button type="button" class="mv wide" id="ck_reset">${asEsc(t('ck_reset'))}</button></div>`;
}
document.addEventListener('click', e => { if (e.target.closest('#ck_reset')){ ['clockFont', 'clockColor', 'clockWeight', 'clockSize', 'clockNum'].forEach(k => { delete SET[k]; }); saveSet(); CK_KEY = ''; const b = $('#cstyles'); if (b) b.dataset.k = ''; clockRender(); } });
document.addEventListener('change', e => { if (/^set_clock|^set_digits$/.test(e.target.id || '')) setTimeout(clockRender, 0); });
setInterval(() => { if (document.hidden) return; if (tab === 'home') clockRender(); else if (tab === 'settings' && SCAT === 'display') csRender(); }, 1000);
const _alCk = applyLang;
applyLang = function(){ const r = _alCk.apply(this, arguments); CK_KEY = ''; const b = $('#cstyles'); if (b) b.dataset.k = ''; clockRender(); return r; };
clockRender();

/* ---- tools tabs ---- */
CALC.expenses = () => null; CALC.clients = () => null;
Object.assign(GS_SYN, {expenses: 'הוצאות תקציב קניות חשבונות budget spending expenses مصاريف ميزانية', clients: 'רואה חשבון רו"ח לקוחות מעמ מקדמות crm accountant clients محاسب عملاء'});
const _actTools = activate;
activate = function(id){ const r = _actTools.apply(this, arguments); if (id === 'expenses') expRender(); if (id === 'clients') clRender(); return r; };
const _alTools = applyLang;
applyLang = function(){ const r = _alTools.apply(this, arguments); if (tab === 'expenses') expRender(); if (tab === 'clients') clRender(); return r; };
if (tab === 'expenses') expRender(); if (tab === 'clients') clRender();

/* ---- move to a new phone: same username and password, all data comes along (always encrypted) ---- */
const persistNow0 = persistNow;
var MV = {db: null, uid: null, ok: null, last: '', timer: null};
async function mvPackage(){
  await persistNow0();
  const name = FUSER, rec = getAcc(name), enc = RAWLS.getItem(encName(name)); if (!rec || !enc) return null;
  return 'FINCALC1:' + btoa(unescape(encodeURIComponent(JSON.stringify({v: 1, name, rec, enc: JSON.parse(enc), at: Date.now()}))));
}
function mvParse(txt){
  const m = String(txt || '').match(/FINCALC1:([A-Za-z0-9+/=]+)/); if (!m) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o && o.v === 1 && o.name && o.rec && o.rec.hash && o.enc && o.enc.ct ? o : null; } catch (e) { return null; }
}
async function mvRestore(pkg, pw){
  const lk = lockLeft(pkg.name); if (lk > 0) return 'lock';
  let ok = false; try { ok = (await hashPw(pw, u8(pkg.rec.salt), pkg.rec.iter || 200000)) === pkg.rec.hash; } catch (e) {}
  noteFail(pkg.name, ok); if (!ok) return 'bad';
  RAWLS.setItem(accKey(pkg.name), JSON.stringify(pkg.rec)); RAWLS.setItem(encName(pkg.name), JSON.stringify(pkg.enc));
  await unlockSession(pkg.name, pw, pkg.rec, {});
  return 'ok';
}
async function mvCloudInit(){
  if (MV.ok !== null) return MV.ok;
  MV.ok = false;
  if (!IN_CLAUDE) return false;
  try {
    const [db, u] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    const id = u ? await u.id() : null;
    if (db && id){ MV.db = db; MV.uid = id; MV.ok = true; }
  } catch (e) {}
  return MV.ok;
}
function mvDoc(name){ return MV.db.collection('data/users/' + MV.uid).doc('acc-' + txHash(String(name).toLowerCase())); }
async function mvCloudSave(){
  if (!FUSER || MV.dead || !(await mvCloudInit())) return;
  if (typeof LIVE === 'object' && LIVE.started && !LIVE.pulled) return;    // pull before pushing, so an old copy never overwrites a newer one
  const pkg = await mvPackage(); if (MV.dead) return; if (!pkg || pkg === MV.last) return;
  const sig = RAWLS.getItem(encName(FUSER)) + '|' + RAWLS.getItem(accKey(FUSER));
  if (sig === MV.sig) return;
  try { const at = Date.now(); await mvDoc(FUSER).set({p: pkg, at, by: LIVE_ID}); MV.last = pkg; MV.sig = sig; if (typeof LIVE === 'object'){ LIVE.outAt = at; LIVE.cloudAt = Math.max(LIVE.cloudAt || 0, at); if (typeof lvRender === 'function') lvRender(); } } catch (e) {  }
}
persistNow = async function(){ await persistNow0.apply(this, arguments); if (FUSER && IN_CLAUDE){ clearTimeout(MV.timer); MV.timer = setTimeout(mvCloudSave, 1500); } else if (FUSER && typeof LIVE === 'object'){ LIVE.outAt = Date.now(); if (typeof lvRender === 'function') lvRender(); } };
async function mvCloudGet(name){ if (!(await mvCloudInit())) return null; try { const d = await mvDoc(name).get(); return d && d.exists ? mvParse((d.data() || {}).p) : null; } catch (e) { return null; } }
/* inside Claude: signing in on a new phone finds the account in the cloud by itself */
const doLogin0 = doLogin;
doLogin = async function(){
  const name = hdNorm(($('#acc_user') || {}).value);
  if (name && !getAcc(name) && IN_CLAUDE && window.crypto && crypto.subtle){
    accMsg('m_wait', null, true);
    const pkg = await mvCloudGet(name);
    if (pkg){ try { await PERM_P; await polInit(); } catch (e) {} if (!signupAllowed()) return accMsg(signupGlobalOpen() ? 'm_closedAdd' : 'm_closedAll'); }
    if (pkg){ const r = await mvRestore(pkg, $('#acc_pass').value); if (r === 'bad') return accMsg('m_bad'); if (r === 'lock') return accMsg('m_lock', {s: lockLeft(name)}); return; }
  }
  return doLogin0.apply(this, arguments);
};
if (FUSER && IN_CLAUDE) setTimeout(() => { if (typeof liveCloudStart === 'function') liveCloudStart(); else mvCloudInit().then(mvCloudSave); }, 1200);

/* one "new phone" panel: send from this phone ↔ receive on the new phone, with a personal one-time code */
const MV_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ', MV_TTL = 15 * 60000;
MV.mode = FUSER ? 'send' : 'recv'; MV.code = ''; MV.exp = 0; MV.pkg = ''; MV.tick = null; MV.cloudKey = '';
function mvNewCode(){ const r = rnd(8); return Array.from(r, x => MV_ABC[x % MV_ABC.length]).join(''); }
function mvFmt(c){ c = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); return c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4, 8) : c; }
async function mvCodeKey(code, salt){ return crypto.subtle.importKey('raw', await pbk(mvFmt(code).replace('-', ''), salt, 100000, 256), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function mvSeal(code){
  await persistNow0();
  const name = FUSER, rec = getAcc(name), enc = RAWLS.getItem(encName(name)); if (!rec || !enc) return null;
  const salt = rnd(16), iv = rnd(12), key = await mvCodeKey(code, salt);
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify({v: 1, name, rec, enc: JSON.parse(enc), at: Date.now(), exp: MV.exp})));
  return 'FINCALC2:' + btoa(JSON.stringify({s: b64(salt), iv: b64(iv), ct: b64(ct)}));
}
async function mvOpen2(txt, code){
  const m = String(txt || '').match(/FINCALC2:([A-Za-z0-9+/=]+)/); if (!m) return null;
  try { const o = JSON.parse(atob(m[1])), key = await mvCodeKey(code, u8(o.s));
    const pkg = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(o.iv)}, key, u8(o.ct))));
    return pkg && pkg.rec ? pkg : null; } catch (e) { return 'badcode'; }
}
async function mvIssue(){
  if (!FUSER) return;
  MV.code = mvNewCode(); MV.exp = Date.now() + MV_TTL; MV.pkg = await mvSeal(MV.code);
  if (await mvCloudInit()){
    try { if (MV.cloudKey) await MV.db.collection('data/users/' + MV.uid).doc(MV.cloudKey).delete(); } catch (e) {}
    MV.cloudKey = 'xfer-' + txHash(MV.code);
    try { await MV.db.collection('data/users/' + MV.uid).doc(MV.cloudKey).set({p: MV.pkg, exp: MV.exp, n: txHash(String(FUSER).toLowerCase())}); } catch (e) { MV.cloudKey = ''; }
  }
  mvRender();
}
function mvLeft(){ const s = Math.max(0, Math.ceil((MV.exp - Date.now()) / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function mvSt(k, cls, p){ const el = $('#mv_st'); if (el){ el.className = 'gk-st ' + (cls || ''); el.textContent = k ? t(k, p) : ''; } }
function mvRender(){
  const box = $('#acc_f_mv'); if (!box || box.hidden) return;
  clearInterval(MV.tick); MV.tick = null;
  const send = MV.mode === 'send';
  let h = `<div class="seg mv-mode" role="group"><button type="button" data-mvm="send" aria-pressed="${send}">📤 ${asEsc(t('mv_send'))}</button><button type="button" data-mvm="recv" aria-pressed="${!send}">📥 ${asEsc(t('mv_recv'))}</button></div>`;
  if (send){
    if (!FUSER) h += `<p class="gk-st new">${asEsc(t('mv_needLogin'))}</p>`;
    else if (!MV.code || Date.now() > MV.exp){ h += `<p class="gk-st wait">${asEsc(t('m_wait'))}</p>`; box.innerHTML = h; mvIssue(); return; }
    else {
      h += `<div class="mv-code"><small>${asEsc(t('mv_yourCode', {n: '@' + FUSER}))}</small><b dir="ltr" id="mv_code">${mvFmt(MV.code)}</b>
        <span class="mv-left" id="mv_left">⏱ ${asEsc(t('mv_changes', {t: mvLeft()}))}</span><button type="button" class="btn" id="mv_new">↻ ${asEsc(t('mv_newCode'))}</button></div>`;
      h += MV.cloudKey ? `<ol class="mv-steps"><li>${asEsc(t('mv_c1'))}</li><li>${asEsc(t('mv_c2'))}</li></ol>`
        : `<ol class="mv-steps"><li>${asEsc(t('mv_s1'))}</li><li>${asEsc(t('mv_s2'))}</li></ol>
           <div class="btnrow"><button type="button" class="gold-btn" id="mv_share">${asEsc(t('mv_share'))}</button><button type="button" class="btn" id="mv_copy">${asEsc(t('mv_copy'))}</button>${IN_CLAUDE ? '' : `<button type="button" class="btn" id="mv_file">${asEsc(t('mv_file'))}</button>`}</div>`;
      h += `<p class="fine">🔒 ${asEsc(t('mv_secure'))}</p>`;
    }
  } else {
    h += `<p class="fine">${asEsc(t(IN_CLAUDE ? 'mv_rHintIn' : 'mv_rHint'))}</p>
      <div class="field wide"><label for="mv_code_in">${asEsc(t('mv_codeIn'))}</label><input id="mv_code_in" class="lookup mv-cin" dir="ltr" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" maxlength="9" placeholder="XXXX-XXXX"></div>
      ${IN_CLAUDE ? `<details class="adv"><summary>${asEsc(t('mv_havePkg'))}</summary>` : ''}
      <textarea id="mv_txt" rows="3" class="lookup" spellcheck="false" dir="ltr" placeholder="FINCALC2:…"></textarea>
      <div class="btnrow"><label class="btn mv-pick"><input type="file" id="mv_pick" accept=".txt,.json,text/plain" hidden><span>${asEsc(t('mv_pick'))}</span></label></div>
      ${IN_CLAUDE ? '</details>' : ''}
      <div class="field wide"><label for="mv_pw">${asEsc(t('f_password'))}</label><input id="mv_pw" type="password" autocomplete="current-password" class="lookup"></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="mv_go">${asEsc(t('mv_go'))}</button></div>`;
  }
  h += `<p class="gk-st" id="mv_st" role="status" aria-live="polite"></p>`;
  box.innerHTML = h;
  if (send && MV.code) MV.tick = setInterval(() => { const l = $('#mv_left'); if (!l || box.hidden){ clearInterval(MV.tick); return; } if (Date.now() > MV.exp){ mvRender(); return; } l.textContent = '⏱ ' + t('mv_changes', {t: mvLeft()}); }, 1000);
}
async function mvShare(){
  if (!MV.pkg) return; const fname = 'fincalc-' + FUSER.replace(/[^\w.-]/g, '') + '.txt';
  try {
    const file = typeof File === 'function' ? new File([MV.pkg], fname, {type: 'text/plain'}) : null;
    if (file && navigator.canShare && navigator.canShare({files: [file]})){ await navigator.share({files: [file], title: t('mv_title')}); return mvSt('mv_shared', 'ok'); }
    if (navigator.share){ await navigator.share({title: t('mv_title'), text: MV.pkg}); return mvSt('mv_shared', 'ok'); }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  mvCopy();
}
async function mvCopy(){
  if (!MV.pkg) return;
  try { await navigator.clipboard.writeText(MV.pkg); mvSt('mv_copied', 'ok'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = MV.pkg; ta.readOnly = true; ta.className = 'lookup mv-show'; $('#mv_st').after(ta); ta.select(); mvSt('mv_selectCopy', 'new'); }
}
async function mvFile(){
  if (!MV.pkg) return;
  const r = await fileSave(MV.pkg, 'fincalc-' + (FUSER.replace(/[^\w.-]/g, '') || 'data') + '.txt', 'text/plain');
  if (r === 'saved') mvSt('mv_fileOk', 'ok'); else if (r === 'fail') mvCopy();
}
async function mvGo(){
  if (!(window.crypto && crypto.subtle)) return mvSt('m_nocrypto', 'bad');
  const code = mvFmt($('#mv_code_in').value).replace('-', ''), txt = ($('#mv_txt') || {}).value || '', pw = $('#mv_pw').value;
  if (code.length !== 8) return mvSt('mv_codeBad', 'bad');
  mvSt('m_wait', 'wait');
  let pkg = null, src = txt;
  if (!/FINCALC[12]:/.test(src) && IN_CLAUDE && await mvCloudInit()){
    try { const d = await MV.db.collection('data/users/' + MV.uid).doc('xfer-' + txHash(code)).get(); if (d && d.exists) src = (d.data() || {}).p || ''; } catch (e) {}
  }
  if (/FINCALC2:/.test(src)) pkg = await mvOpen2(src, code);
  else if (/FINCALC1:/.test(src)) pkg = mvParse(src);
  if (!src || pkg === null) return mvSt(IN_CLAUDE && !txt ? 'mv_notFound' : 'mv_notPkg', 'bad');
  if (pkg === 'badcode') return mvSt('mv_codeWrong', 'bad');
  try { await PERM_P; await polInit(); } catch (e) {}
  if (pkg && pkg.name && !getAcc(pkg.name) && !signupAllowed()) return mvSt(signupGlobalOpen() ? 'm_closedAdd' : 'm_closedAll', 'bad');
  if (pkg.exp && Date.now() > pkg.exp) return mvSt('mv_expired', 'bad');
  let pwOk = false; try { pwOk = (await hashPw(pw, u8(pkg.rec.salt), pkg.rec.iter || 200000)) === pkg.rec.hash; } catch (e) {}
  if (pwOk && IN_CLAUDE && MV.db){ try { await MV.db.collection('data/users/' + MV.uid).doc('xfer-' + txHash(code)).delete(); } catch (e) {} }   // a used transfer is removed before the app reloads
  const r = await mvRestore(pkg, pw);
  if (r === 'bad') mvSt('m_bad', 'bad'); else if (r === 'lock') mvSt('m_lock', 'bad', {s: lockLeft(pkg.name)});
}
document.addEventListener('click', e => {
  const el = e.target;
  if (el.closest('#mv_open')){ const box = $('#acc_f_mv'); if (box){ box.hidden = !box.hidden; MV.mode = 'send'; mvRender(); if (!box.hidden) box.scrollIntoView({block: 'start', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); } return; }
  const mm = el.closest('[data-mvm]'); if (mm){ MV.mode = mm.dataset.mvm; mvRender(); return; }
  if (el.closest('#mv_new')){ MV.code = ''; mvRender(); return; }
  if (el.closest('#mv_share')) mvShare(); else if (el.closest('#mv_copy')) mvCopy(); else if (el.closest('#mv_file')) mvFile(); else if (el.closest('#mv_go')) mvGo();
});
document.addEventListener('input', e => { if (e.target.id === 'mv_code_in'){ const v = mvFmt(e.target.value); if (v !== e.target.value) e.target.value = v; } });
document.addEventListener('change', e => {
  if (e.target.id !== 'mv_pick' || !e.target.files || !e.target.files[0]) return;
  const r = new FileReader(); r.onload = () => { $('#mv_txt').value = String(r.result || ''); const c = $('#mv_code_in'); if (c && !c.value) c.focus(); }; r.readAsText(e.target.files[0]);
});

/* permanent delete: account + username + all its data, here and in the cloud. Password and typed username are required. */
const DEL_N = () => '⁨@' + FUSER + '⁩';
function delSt(k, cls, p){ const el = $('#del_st'); if (el){ el.className = 'gk-st ' + (cls || ''); el.textContent = k ? t(k, p) : ''; } }
function delReady(){ const go = $('#del_go'); if (go) go.disabled = !(hdNorm(($('#del_name') || {}).value) === FUSER && (($('#del_pw') || {}).value || '').length > 0); }
function delRender(){
  const box = $('#del_box'); if (!box || box.hidden || !FUSER) return;
  const keep = {pw: ($('#del_pw') || {}).value || '', nm: ($('#del_name') || {}).value || ''};
  const li = ['del_l1', 'del_l2', 'del_l3'].concat(IN_CLAUDE ? ['del_l4'] : []);
  box.innerHTML = `<p class="del-warn">⚠️ ${asEsc(t('del_warn'))}</p>
    <ul class="del-list">${li.map(k => `<li>${asEsc(t(k, {n: DEL_N()}))}</li>`).join('')}</ul>
    <p class="fine">${asEsc(t('del_note'))}</p>
    <div class="fields">
      <div class="field wide"><label for="del_pw">${asEsc(t('f_curPw'))}</label><input id="del_pw" type="password" autocomplete="current-password" class="lookup"></div>
      <div class="field wide"><label for="del_name">${asEsc(t('del_type', {n: DEL_N()}))}</label><input id="del_name" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" dir="ltr" class="lookup" placeholder="@${asEsc(FUSER)}"></div>
    </div>
    <div class="btnrow"><button type="button" class="btn del-go" id="del_go" disabled>🗑️ ${asEsc(t('del_go'))}</button><button type="button" class="btn" id="del_cancel">${asEsc(t('del_cancel'))}</button></div>
    <p class="gk-st" id="del_st" role="alert" aria-live="polite"></p>`;
  $('#del_pw').value = keep.pw; $('#del_name').value = keep.nm; delReady();
}
function delToggle(open){
  const box = $('#del_box'), b = $('#del_open'); if (!box) return;
  box.hidden = !open; if (b) b.setAttribute('aria-expanded', String(open));
  if (open){ box.innerHTML = ''; delRender(); box.scrollIntoView({block: 'nearest', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); const pw = $('#del_pw'); if (pw) pw.focus(); }
  else box.innerHTML = '';
}
async function doDelete(){
  const nm = FUSER; if (!nm) return;
  const go = $('#del_go'), pw = ($('#del_pw') || {}).value || '';
  if (hdNorm(($('#del_name') || {}).value) !== nm) return delSt('del_nameBad', 'bad', {n: DEL_N()});
  if (!(window.crypto && crypto.subtle)) return delSt('m_nocrypto', 'bad');
  const lk = lockLeft(nm); if (lk > 0) return delSt('m_lock', 'bad', {s: lk});
  const rec = getAcc(nm); if (!rec) return;
  if (go) go.disabled = true; delSt('del_wait', 'wait');
  let ok = false; try { ok = (await hashPw(pw, u8(rec.salt), rec.iter || 200000)) === rec.hash; } catch (e) {}
  noteFail(nm, ok);
  if (!ok){ delReady(); return delSt('m_bad', 'bad'); }
  MV.dead = true; clearTimeout(MV.timer); clearInterval(MV.tick); clearInterval(SEC.timer);
  if (IN_CLAUDE){                       // cloud first: if it cannot be removed, nothing is removed
    let fail = false;
    if (await mvCloudInit()){
      const col = MV.db.collection('data/users/' + MV.uid), h = txHash(nm.toLowerCase()), now = Date.now();
      try { await mvDoc(nm).delete(); } catch (e) { fail = true; }
      let listed = false;
      try { const q = await col.get(); listed = true;
        for (const d of (q.docs || [])){ const id = String(d.id), x = (d.data && d.data()) || {};
          if (id.indexOf('xfer-') === 0){ if (x.n === h || id === MV.cloudKey || !x.exp || x.exp < now) await col.doc(id).delete(); }
          else if (id === 'sec-' + h || id === 'kick-' + h || (id.indexOf('sess-') === 0 && x.a === h)) await col.doc(id).delete(); } } catch (e) { if (listed) fail = true; }
      if (!listed && MV.cloudKey){ try { await col.doc(MV.cloudKey).delete(); } catch (e) { fail = true; } }
    }
    if (!fail) try { if (!HD.ready) await hdInit(); if (HD.ready){ const ref = HD.db.doc('claims/' + HD.uid), s = await ref.get(); if (s.exists && await claimIs(s.data(), nm)) await ref.delete(); } } catch (e) { fail = true; }
    if (fail){ MV.dead = false; delReady(); return delSt('del_cloudFail', 'bad'); }
  }
  const sfx = ':' + ENC_NAME(nm);
  try { RAWLS.removeItem(accKey(nm)); RAWLS.removeItem(encName(nm)); RAWLS.removeItem('fin-fail:' + accKey(nm)); DATA_KEYS.forEach(k => RAWLS.removeItem(k + sfx)); } catch (e) {}
  try { if ((polLock() || {}).by === nm) RAWLS.removeItem('fin-signup-lock'); RAWLS.removeItem(secKey(nm)); } catch (e) {}
  clearSession();
  try { SS.setItem('fin-del-ok', nm); } catch (e) {}
  try { location.reload(); } catch (e) {}
}
document.addEventListener('click', e => {
  const el = e.target;
  if (el.closest('#del_open')){ const box = $('#del_box'); delToggle(!!(box && box.hidden)); return; }
  if (el.closest('#del_cancel')){ delToggle(false); const b = $('#del_open'); if (b) b.focus(); return; }
  if (el.closest('#del_go')) doDelete();
});
document.addEventListener('input', e => { if (e.target.id === 'del_name' || e.target.id === 'del_pw'){ delReady(); delSt(''); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.id === 'del_name' || e.target.id === 'del_pw')){ e.preventDefault(); const go = $('#del_go'); if (go && !go.disabled) doDelete(); } });
const _alDel = applyLang;
applyLang = function(){ const r = _alDel.apply(this, arguments); delRender(); return r; };
try { const gone = SS.getItem('fin-del-ok'); if (gone){ SS.removeItem('fin-del-ok'); setTimeout(() => { const n = '⁨@' + gone + '⁩'; toast(t('del_done', {n})); const m = $('#acc_msg'); if (m){ m.className = 'fine acc-msg ok'; m.textContent = t('del_done', {n}); } }, 700); } } catch (e) {}

/* ---- email verification + password recovery. No server: the user sends the email to themselves.
   A recovery key goes in the email; it unlocks a private key that can always open the account's data key,
   so a forgotten password can be replaced without losing data. */
const RC = {code: '', mail: '', edit: false, busy: false, wt: null};
function rcNewCode(){ const r = rnd(20); return Array.from(r, x => MV_ABC[x % MV_ABC.length]).join(''); }
function rcFmt(c){ c = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 20); return c.replace(/(.{5})(?=.)/g, '$1-'); }
function rcMask(m){ const [u, d] = String(m).split('@'); if (!d || !u) return m; return (u.length <= 2 ? u[0] + '•••' : u[0] + '•••' + u[u.length - 1]) + '@' + d; }
const rcIso = h => '\u2068' + (h || '') + '\u2069';
const rcMailOk = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(m || '').trim());
async function rcAes(code, salt){ return crypto.subtle.importKey('raw', await pbk(rcFmt(code).replace(/-/g, ''), salt, 200000, 256), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function rcWrap(pubB64, rawB64){ const pub = await crypto.subtle.importKey('spki', u8(pubB64), {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['encrypt']); return b64(await crypto.subtle.encrypt({name: 'RSA-OAEP'}, pub, u8(rawB64))); }
async function rcUnwrap(rcv, code){
  const pk = await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(rcv.iv)}, await rcAes(code, u8(rcv.s)), u8(rcv.ct));   // a wrong key throws here
  const priv = await crypto.subtle.importKey('pkcs8', pk, {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['decrypt']);
  return b64(await crypto.subtle.decrypt({name: 'RSA-OAEP'}, priv, u8(rcv.wk)));
}
async function rcSetup(mail, mh){
  const rec = getAcc(FUSER), raw = SS.getItem('fin-ek'); if (!rec || !raw) return null;
  const code = rcNewCode();
  const kp = await crypto.subtle.generateKey({name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'}, true, ['encrypt', 'decrypt']);
  const pub = b64(await crypto.subtle.exportKey('spki', kp.publicKey)), pk = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const sl = rnd(16), iv = rnd(12), ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await rcAes(code, sl), pk);
  rec.rcv = {v: 1, hint: rcMask(mail), mh: mh || '', mhv: 3, pub, s: b64(sl), iv: b64(iv), ct: b64(ct), wk: await rcWrap(pub, raw), ok: 0, at: Date.now()};
  RAWLS.setItem(accKey(FUSER), JSON.stringify(rec));
  SET.rcMail = mail; saveSet(); persistNow(); secLog(FUSER, 'mail');
  RC.code = code; RC.mail = mail; RC.edit = false;
  return code;
}
function rcLink(name, code){ return IN_CLAUDE ? '' : location.origin + location.pathname + '#rcv=' + encodeURIComponent(name) + '~' + rcFmt(code); }
function rcMailParts(code){
  const n = '@' + FUSER, l = rcLink(FUSER, code);
  return {subj: t('rc_subj', {n}), body: t('rc_body', {n, c: rcFmt(code)}) + (l ? '\n\n' + t('rc_bodyLink') + '\n' + l : '') + '\n\n' + t('rc_bodyKeep')};
}
function rcHref(code){ const p = rcMailParts(code); return 'mailto:' + encodeURIComponent(RC.mail) + '?subject=' + encodeURIComponent(p.subj) + '&body=' + encodeURIComponent(p.body); }
function rcState(){ const r = FUSER ? getAcc(FUSER) : null; return r && r.rcv ? (r.rcv.ok ? 'ok' : 'wait') : 'none'; }
function rcSt(k, cls, p){ const el = $('#rc_st'); if (el){ el.className = 'gk-st ' + (cls || ''); el.textContent = k ? t(k, p) : ''; } }
function rcRender(){
  const pill = $('#rc_pill'), box = $('#rc_box'); if (!box || !FUSER) return;
  const st = rcState(), rv = (getAcc(FUSER) || {}).rcv || {};
  if (pill){ pill.className = 'rc-pill ' + st; pill.textContent = t('rc_pill_' + st); }
  const keep = ($('#rc_mail') || {}).value, keepC = ($('#rc_vcode') || {}).value;
  let h = `<p class="fine">${asEsc(t('rc_intro'))}</p>`;
  if (st === 'none' || RC.edit){
    h += `<div class="fields"><div class="field wide"><label for="rc_mail">${asEsc(t('rc_mail'))}</label><input id="rc_mail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" dir="ltr" class="lookup" placeholder="name@example.com"><small class="hint rc-nopw">🔒 ${asEsc(t('rc_noMailPw'))}</small><small class="hint">${asEsc(t('rc_oneAcc'))}</small></div></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="rc_make">✉️ ${asEsc(t('rc_make'))}</button>${RC.edit ? `<button type="button" class="btn" id="rc_cancel">${asEsc(t('del_cancel'))}</button>` : ''}</div>`;
  } else {
    h += `<p class="gk-st ${st === 'ok' ? 'ok' : 'new'}"><b>${st === 'ok' ? '✓' : '⏳'}</b> ${asEsc(t(st === 'ok' ? 'rc_ok' : 'rc_pending', {m: rcIso(rv.hint)}))}</p>`;
    if (RC.code){
      h += `<ol class="mv-steps"><li>${asEsc(t('rc_step1'))}</li><li>${asEsc(t('rc_step2'))}</li></ol>
        <div class="btnrow"><a class="gold-btn rc-open" id="rc_open" href="${asEsc(rcHref(RC.code))}" target="_blank" rel="noopener">✉️ ${asEsc(t('rc_open'))}</a><button type="button" class="btn" id="rc_copy">📋 ${asEsc(t('rc_copy'))}</button></div>`;
    } else if (st === 'wait') h += `<p class="fine">${asEsc(t('rc_step2'))}</p>`;
    if (st === 'wait') h += `<div class="fields"><div class="field wide"><label for="rc_vcode">${asEsc(t('rc_codeIn'))}</label><input id="rc_vcode" type="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" dir="ltr" class="lookup rc-cin" placeholder="XXXXX-XXXXX-XXXXX-XXXXX"></div></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="rc_verify">${asEsc(t('rc_verify'))}</button></div>`;
    h += `<div class="btnrow rc-more"><button type="button" class="btn" id="rc_resend">↻ ${asEsc(t('rc_resend'))}</button><button type="button" class="btn danger" id="rc_remove">${asEsc(t('rc_remove'))}</button></div><p class="fine">${asEsc(t('rc_resendHint'))}</p>`;
  }
  h += `<p class="gk-st" id="rc_st" role="status" aria-live="polite"></p>`;
  box.innerHTML = h;
  const mi = $('#rc_mail'); if (mi) mi.value = keep != null ? keep : (SET.rcMail || '');
  const vi = $('#rc_vcode'); if (vi && keepC) vi.value = keepC;
}
async function rcMake(){
  if (RC.busy) return;
  const mail = String(($('#rc_mail') || {}).value || '').trim();
  if (!rcMailOk(mail)) return rcSt('rc_mailBad', 'bad');
  if (!(window.crypto && crypto.subtle)) return rcSt('m_nocrypto', 'bad');
  RC.busy = true; rcSt('rc_checking', 'wait');
  let mh = '';
  try { mh = await rcMailHash(mail); } catch (e) { RC.busy = false; return rcSt('m_nocrypto', 'bad'); }
  const free = await rcMailFree(mh);
  if (free !== 'ok'){ RC.busy = false; return rcSt(free === 'taken' ? 'rc_mailTaken' : 'rc_mailCheckFail', 'bad'); }
  const cl = await rcClaimMail(mh);
  if (cl === 'taken'){ RC.busy = false; return rcSt('rc_mailTaken', 'bad'); }
  if (cl === 'err'){ RC.busy = false; return rcSt('rc_mailCheckFail', 'bad'); }
  rcSt('rc_making', 'wait');
  try { await rcSetup(mail, mh); } catch (e) { RC.busy = false; return rcSt('m_nocrypto', 'bad'); }
  RC.busy = false; rcRender();
  const o = $('#rc_open'); if (o) o.focus();
}
async function rcVerify(code, quiet){
  const rec = getAcc(FUSER); if (!rec || !rec.rcv) return false;
  const lk = lockLeft(FUSER); if (lk > 0){ rcSt('m_lock', 'bad', {s: lk}); return false; }
  if (rcFmt(code).replace(/-/g, '').length !== 20){ rcSt('rc_codeShort', 'bad'); return false; }
  rcSt('m_wait', 'wait');
  let raw = null; try { raw = await rcUnwrap(rec.rcv, code); } catch (e) {}
  noteFail(FUSER, !!raw);
  if (!raw){ rcSt('rc_codeWrong', 'bad'); return false; }
  rec.rcv.ok = 1; rec.rcv.vat = Date.now(); RAWLS.setItem(accKey(FUSER), JSON.stringify(rec)); persistNow();
  RC.code = ''; rcRender(); rcSt('rc_okNow', 'ok'); if (!quiet) toast(t('rc_okNow'));
  return true;
}
function rcCopy(){
  const p = rcMailParts(RC.code), txt = t('rc_mail') + ': ' + RC.mail + '\n' + p.subj + '\n\n' + p.body;
  const done = () => rcSt('rc_copied', 'ok');
  try { navigator.clipboard.writeText(txt).then(done, () => { prompt('', txt); }); } catch (e) { try { prompt('', txt); } catch (e2) {} }
}
/* forgot password (signed out) */
function rcRStSet(k, cls, p){ const el = $('#rc_rst'); if (el){ el.className = 'gk-st ' + (cls || ''); el.textContent = k ? t(k, p) : ''; } }
function rcRRender(pre){
  const box = $('#acc_f_rc'); if (!box) return;
  pre = pre || {};
  const v = id => pre[id] != null ? pre[id] : (($('#' + id) || {}).value || '');
  const vals = {rc_user: v('rc_user') || (($('#acc_user') || {}).value || ''), rc_code: v('rc_code'), rc_pw1: v('rc_pw1'), rc_pw2: v('rc_pw2')};
  const pwf = (id, lab) => `<div class="field wide"><label for="${id}">${asEsc(t(lab))}</label><input id="${id}" type="password" autocomplete="new-password" class="lookup"></div>`;
  box.innerHTML = `<h4 class="rc-h">🔑 ${asEsc(t('rc_rTitle'))}</h4><p class="fine">${asEsc(t('rc_rHint'))}</p>
    <div class="fields"><div class="field wide"><label for="rc_user">${asEsc(t('f_username'))}</label><input id="rc_user" type="text" maxlength="21" autocomplete="username" autocapitalize="none" spellcheck="false" dir="auto" class="lookup" placeholder="@"><small class="hint" id="rc_where"></small></div>
      <div class="field wide"><label for="rc_code">${asEsc(t('f_rcCode'))}</label><input id="rc_code" type="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" dir="ltr" class="lookup rc-cin" placeholder="XXXXX-XXXXX-XXXXX-XXXXX"></div>
      ${pwf('rc_pw1', 'rc_newPw')}${pwf('rc_pw2', 'rc_newPw2')}<small class="hint rc-nopw">🔒 ${asEsc(t('rc_appPwOnly'))}</small></div>${PWREQ.replace('%ID%', 'rc_pw1')}
    <div class="btnrow"><button type="button" class="gold-btn" id="rc_go">${asEsc(t('rc_go'))}</button><button type="button" class="btn" id="rc_back">${asEsc(t('rc_back'))}</button></div>
    <p class="gk-st" id="rc_rst" role="alert" aria-live="polite"></p>`;
  Object.keys(vals).forEach(id => { const el = $('#' + id); if (el) el.value = vals[id]; });
  $$('[data-i]', box).forEach(el => { el.textContent = t(el.dataset.i); });
  const p1 = $('#rc_pw1'); if (p1) updPwReq(p1);
  rcWhere();
}
function rcShow(pre){
  ['in', 'up', 'mv', 'rc'].forEach(k => { const f = $('#acc_f_' + k); if (f) f.hidden = k !== 'rc'; });
  ['tin', 'tup', 'tmv'].forEach(k => { const b = $('#acc_' + k); if (b) b.classList.toggle('on', k === 'tin'); });
  rcRRender(pre); accMsg('');
  const box = $('#acc_f_rc'); if (box) box.scrollIntoView({block: 'nearest', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'});
}
async function rcFind(name){
  let rec = getAcc(name), enc = null;
  try { enc = rec ? JSON.parse(RAWLS.getItem(encName(name)) || 'null') : null; } catch (e) {}
  if (!rec && IN_CLAUDE){ const pkg = await mvCloudGet(name); if (pkg){ rec = pkg.rec; enc = pkg.enc; } }
  return {rec, enc};
}
async function rcWhere(){
  const el = $('#rc_where'), inp = $('#rc_user'); if (!el || !inp) return;
  const name = hdNorm(inp.value); if (!name){ el.textContent = ''; return; }
  const {rec} = await rcFind(name);
  if (hdNorm(($('#rc_user') || {}).value) !== name) return;
  el.textContent = !rec ? t('rc_noAcc') : rec.rcv ? t('rc_where', {m: rcIso(rec.rcv.hint)}) : t('rc_none');
  el.className = 'hint ' + (rec && rec.rcv ? 'rc-yes' : 'rc-no');
}
async function rcRecover(){
  if (RC.busy) return;
  const name = hdNorm(($('#rc_user') || {}).value), code = ($('#rc_code') || {}).value || '', p1 = ($('#rc_pw1') || {}).value || '', p2 = ($('#rc_pw2') || {}).value || '';
  if (!(window.crypto && crypto.subtle)) return rcRStSet('m_nocrypto', 'bad');
  if (!name) return rcRStSet('rc_noAcc', 'bad');
  RC.busy = true; rcRStSet('m_wait', 'wait');
  try {
    const {rec, enc} = await rcFind(name);
    if (!rec) return rcRStSet('rc_noAcc', 'bad');
    if (!getAcc(name)){ try { await PERM_P; await polInit(); } catch (e) {} if (!signupAllowed()) return rcRStSet(signupGlobalOpen() ? 'm_closedAdd' : 'm_closedAll', 'bad'); }
    if (!rec.rcv) return rcRStSet('rc_none', 'bad');
    if (rcFmt(code).replace(/-/g, '').length !== 20) return rcRStSet('rc_codeShort', 'bad');
    if (!pwOk(p1)) return rcRStSet('m_weak', 'bad');
    if (p1 !== p2) return rcRStSet('m_mismatch', 'bad');
    const lk = lockLeft(name); if (lk > 0) return rcRStSet('m_lock', 'bad', {s: lk});
    let raw = null; try { raw = await rcUnwrap(rec.rcv, code); } catch (e) {}
    noteFail(name, !!raw);
    if (!raw) return rcRStSet('rc_codeWrong', 'bad');
    let map = {};
    if (enc && enc.ct){
      try { const key = await crypto.subtle.importKey('raw', u8(raw), 'AES-GCM', false, ['decrypt']);
        map = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(enc.iv)}, key, u8(enc.ct)))); }
      catch (e) { return rcRStSet('rc_stale', 'bad'); }
    }
    const nm = rec.name || name, salt = rnd(16);
    rec.salt = b64(salt); rec.iter = 200000; rec.hash = await hashPw(p1, salt, rec.iter);
    rec.esalt = b64(rnd(16));
    const raw2 = b64(await pbk(p1, u8(rec.esalt), 200000, 256));
    rec.rcv.wk = await rcWrap(rec.rcv.pub, raw2); rec.rcv.ok = 1; rec.rcv.vat = rec.rcv.vat || Date.now();
    RAWLS.setItem(accKey(nm), JSON.stringify(rec));
    await sealMap(nm, raw2, map);
    try { SS.setItem('fin-rc-ok', '1'); } catch (e) {}
    secLog(nm, 'rc');
    rcRStSet('rc_done', 'ok');
    await unlockSession(nm, p1, rec, {});
  } finally { RC.busy = false; }
}
document.addEventListener('click', e => {
  const el = e.target;
  if (el.closest('#rc_forgot')){ rcShow(); const u = $('#rc_user'); if (u && !u.value) u.focus(); else { const c = $('#rc_code'); if (c) c.focus(); } return; }
  if (el.closest('#rc_back')){ ['in', 'up', 'mv', 'rc'].forEach(k => { const f = $('#acc_f_' + k); if (f) f.hidden = k !== 'in'; }); const u = $('#acc_user'), r = $('#rc_user'); if (u && r && r.value) u.value = r.value; return; }
  if (el.closest('#rc_go')) return void rcRecover();
  if (el.closest('#rc_make')) return void rcMake();
  if (el.closest('#rc_verify')) return void rcVerify(($('#rc_vcode') || {}).value || '');
  if (el.closest('#rc_copy')) return rcCopy();
  if (el.closest('#rc_resend')){ RC.edit = true; RC.code = ''; rcRender(); const m = $('#rc_mail'); if (m) m.focus(); return; }
  if (el.closest('#rc_cancel')){ RC.edit = false; rcRender(); return; }
  if (el.closest('#rc_open')){ setTimeout(() => rcSt('rc_sent', 'new'), 400); return; }
  const rm = el.closest('#rc_remove');
  if (rm){
    if (!rm.dataset.sure){ rm.dataset.sure = '1'; rm.textContent = t('b_sure'); return; }
    const rec = getAcc(FUSER); if (rec){ delete rec.rcv; RAWLS.setItem(accKey(FUSER), JSON.stringify(rec)); }
    delete SET.rcMail; saveSet(); persistNow(); RC.code = ''; RC.edit = false; rcRender(); rcSt('rc_removed', 'new'); rcUnclaimMail();
  }
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'rc_code' || id === 'rc_vcode'){ const v = rcFmt(e.target.value); if (v !== e.target.value) e.target.value = v; }
  if (id === 'rc_user'){ clearTimeout(RC.wt); RC.wt = setTimeout(rcWhere, 350); }
  if (id === 'rc_mail' || id === 'rc_vcode') rcSt('');
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = e.target.id;
  if (id === 'rc_mail'){ e.preventDefault(); rcMake(); }
  else if (id === 'rc_vcode'){ e.preventDefault(); rcVerify(e.target.value); }
  else if (id === 'rc_user' || id === 'rc_code' || id === 'rc_pw1' || id === 'rc_pw2'){ e.preventDefault(); rcRecover(); }
});
document.addEventListener('toggle', e => { if (e.target && e.target.id === 'rc_d' && e.target.open) rcRender(); }, true);
const _alRc = applyLang;
applyLang = function(){ const r = _alRc.apply(this, arguments); rcRender(); const b = $('#acc_f_rc'); if (b && !b.hidden) rcRRender(); return r; };
setTimeout(rcRender, 0);
/* a link from the recovery email: #rcv=<user>~<key> (works on first load and when the app is already open) */
function rcLinkGrab(){
  try { const m = /[#&]rcv=([^~&]+)~([0-9A-Za-z-]+)/.exec(location.hash || ''); if (!m) return null;
    const lk = {n: hdNorm(decodeURIComponent(m[1])), c: rcFmt(m[2])};
    SS.setItem('fin-rc-link', JSON.stringify(lk)); history.replaceState(null, '', location.pathname + location.search); return lk; } catch (e) { return null; }
}
function rcLinkUse(lk, delay){
  setTimeout(async () => {
    try { SS.removeItem('fin-rc-link'); } catch (e) {}
    const st = $('#tab-settings'); if (st) st.click();
    setCat('account');
    if (FUSER && FUSER === lk.n){
      const d = $('#rc_d'); if (d){ d.open = true; rcRender(); }
      if (rcState() === 'wait') await rcVerify(lk.c); else if (rcState() === 'ok') rcSt('rc_ok', 'ok', {m: rcIso(((getAcc(FUSER) || {}).rcv || {}).hint)});
      if (d) d.scrollIntoView({block: 'start'});
    } else if (!FUSER){ rcShow({rc_user: '@' + lk.n, rc_code: lk.c}); const p1 = $('#rc_pw1'); if (p1) p1.focus(); }
    else toast(t('rc_otherUser', {n: '@' + lk.n}));
  }, delay);
}
(function(){
  let lk = rcLinkGrab();
  if (!lk){ try { lk = JSON.parse(SS.getItem('fin-rc-link') || 'null'); } catch (e) {} }
  if (lk && lk.n) rcLinkUse(lk, 900);
})();
window.addEventListener('hashchange', () => { const lk = rcLinkGrab(); if (lk) rcLinkUse(lk, 60); });
try { if (SS.getItem('fin-rc-ok')){ SS.removeItem('fin-rc-ok'); setTimeout(() => toast(t('rc_doneIn')), 700); } } catch (e) {}

/* ---- blocking sign-up so it cannot be side-stepped.
   In Claude the owner's choice is kept in the shared database (only the owner can write it) and applies to every
   person and device. On the website it applies to this device, and only the account that set it may change it.
   While blocked, no path can add a new account: sign-up, new phone, cloud sign-in and email recovery. */
var POL = {ready: false, open: true, db: null, p: null};
function polLock(){ try { return JSON.parse(RAWLS.getItem('fin-signup-lock') || 'null') || {}; } catch (e) { return {}; } }
function polOwnerMode(){ return IN_CLAUDE && PERM === 'owner' && !!POL.db && typeof liveOwner === 'function' && liveOwner(); }
function polInit(){
  if (POL.p) return POL.p;
  POL.p = (async () => {
    if (IN_CLAUDE){
      try {
        const db = await window.claude.use('db');
        if (db){
          POL.db = db;
          const sn = await db.doc('policy/signup').get();
          POL.open = !(sn && sn.exists && (sn.data() || {}).open === false);
          try { db.doc('policy/signup').onSnapshot(x => { const o = !(x && x.exists && (x.data() || {}).open === false); if (o !== POL.open){ POL.open = o; polApply(); } }, () => {}); } catch (e) {}
        }
      } catch (e) {}
    }
    POL.ready = true; polApply(); return POL;
  })();
  return POL.p;
}
function polSelRender(){
  const sel = $('#acc_open'), lab = $('#acc_open_l'), hint = $('#acc_open_h'); if (!sel || !FUSER) return;
  const iso = n => '⁨@' + n + '⁩';
  if (polOwnerMode()){
    sel.disabled = false; sel.value = POL.open ? '1' : '0';
    if (lab) lab.textContent = t('f_signupAll'); if (hint) hint.textContent = t('h_signupAll');
    return;
  }
  if (lab) lab.textContent = t('f_openSignup');
  if (!signupGlobalOpen()){ sel.disabled = true; sel.value = '0'; if (hint) hint.textContent = t('h_signupByOwner'); return; }
  let lk = polLock();
  if (!lk.by){ lk = {by: FUSER, at: Date.now()}; try { RAWLS.setItem('fin-signup-lock', JSON.stringify(lk)); } catch (e) {} }
  const mine = lk.by === FUSER;
  sel.disabled = !mine; sel.value = signupLocalOpen() ? '1' : '0';
  if (hint) hint.textContent = mine ? t('h_signupDev', {n: iso(lk.by)}) : t('h_signupLocked', {n: iso(lk.by)});
}
function polApply(){
  const ok = signupAllowed();
  const up = $('#acc_tup'), mv = $('#acc_tmv');
  if (up) up.hidden = !ok;
  if (mv && !FUSER) mv.hidden = !ok;
  if (!ok){ ['up', 'mv'].forEach(k => { const f = $('#acc_f_' + k); if (f && !f.hidden && !FUSER){ f.hidden = true; const fi = $('#acc_f_in'), ti = $('#acc_tin'); if (fi) fi.hidden = false; if (ti) ti.classList.add('on'); } }); }
  polSelRender();
}
async function polSet(open){
  await PERM_P; await polInit();
  if (polOwnerMode()){
    try { await POL.db.doc('policy/signup').set({open, at: Date.now()}); POL.open = open; }
    catch (e) { toast(t('pol_fail')); return polSelRender(); }
  } else {
    if (!signupGlobalOpen()) return polSelRender();
    const lk = polLock(); if (lk.by && lk.by !== FUSER) return polSelRender();
  }
  try { RAWLS.setItem('fin-signup-open', open ? '1' : '0'); RAWLS.setItem('fin-signup-lock', JSON.stringify({by: FUSER, at: Date.now()})); } catch (e) {}
  polApply(); toast(t(open ? 'pol_opened' : 'pol_closed'));
}
const _alPol = applyLang;
applyLang = function(){ const r = _alPol.apply(this, arguments); polSelRender(); return r; };
Promise.resolve(PERM_P).then(polInit, polInit);
setTimeout(polSelRender, 0);

/* the PIN lock was removed: clear anything it left behind */
try { ['fin-pin', 'fin-hid', 'fin-pin-reset'].forEach(k => SS.removeItem(k)); } catch (e) {}
try { for (let i = 0; i < RAWLS.length; i++){ const k = RAWLS.key(i) || ''; if (k.indexOf('fin-acc:') !== 0) continue; const r = JSON.parse(RAWLS.getItem(k) || 'null'); if (r && r.pin){ delete r.pin; RAWLS.setItem(k, JSON.stringify(r)); } } } catch (e) {}

/* ---- one email, one account. Only a slow one-way fingerprint of the address is compared, never the address:
   on this device against every account, and in Claude against everyone's username record. */
/* one inbox = one address: case, Gmail dots and +tags do not make a different email */
function rcNorm(m){
  let [u, d] = String(m || '').trim().toLowerCase().split('@'); if (!u || !d) return String(m || '').trim().toLowerCase();
  u = u.split('+')[0];
  if (d === 'gmail.com' || d === 'googlemail.com'){ u = u.replace(/\./g, ''); d = 'gmail.com'; }
  return u + '@' + d;
}
async function rcMailHash(m){ return b64(await pbk(rcNorm(m), new TextEncoder().encode('fincalc-mail-v3'), 150000, 256)); }
function rcLocalOwner(mh){
  try { for (let i = 0; i < RAWLS.length; i++){ const k = RAWLS.key(i) || ''; if (k.indexOf('fin-acc:') !== 0) continue;
    const r = JSON.parse(RAWLS.getItem(k) || 'null'); if (r && r.name !== FUSER && r.rcv && r.rcv.mh && r.rcv.mh === mh) return r.name; } } catch (e) {}
  return '';
}
async function rcMailFree(mh){
  if (rcLocalOwner(mh)) return 'taken';
  if (IN_CLAUDE){
    if (!HD.ready) await hdInit();
    if (HD.ready){ try { const q = await HD.db.collection('claims').where('mh', '==', mh).get(); if ((q.docs || []).some(d => d.id !== HD.uid)) return 'taken'; } catch (e) { return 'err'; } }
  }
  return 'ok';
}
async function rcClaimMail(mh){
  if (!IN_CLAUDE) return 'skip';
  if (!HD.ready) await hdInit();
  if (!HD.ready) return 'skip';
  try {
    const ref = HD.db.doc('claims/' + HD.uid), cur = await ref.get(), d = cur.exists ? (cur.data() || {}) : null;
    if (!d || !(await claimIs(d, FUSER))) return 'skip';
    const mat = Date.now(); await ref.set(Object.assign({}, await hdClean(d), {mh, mat}));
    const again = await HD.db.collection('claims').where('mh', '==', mh).get();
    const rival = (again.docs || []).find(x => x.id !== HD.uid && (+((x.data() || {}).mat) || 0) <= mat);
    if (rival){ const dd = Object.assign({}, await hdClean(d)); delete dd.mh; delete dd.mat; await ref.set(dd); return 'taken'; }
    return 'ok';
  } catch (e) { return 'err'; }
}
async function rcUnclaimMail(){
  if (!IN_CLAUDE) return;
  try { if (!HD.ready) await hdInit(); if (!HD.ready) return;
    const ref = HD.db.doc('claims/' + HD.uid), cur = await ref.get(); if (!cur.exists) return;
    const d = Object.assign({}, await hdClean(cur.data() || {})); if (!(await claimIs(d, FUSER)) || !d.mh) return;
    delete d.mh; delete d.mat; await ref.set(d); } catch (e) {}
}
/* accounts that set an email before this change get their fingerprint on the next sign-in */
if (FUSER) setTimeout(async () => {
  try {
    const r = getAcc(FUSER); if (!r || !r.rcv || (r.rcv.mh && r.rcv.mhv === 3) || !SET.rcMail) return;
    const mh = await rcMailHash(SET.rcMail);
    if (rcLocalOwner(mh)) return;
    if ((await rcMailFree(mh)) !== 'ok') return;
    if ((await rcClaimMail(mh)) === 'taken') return;
    const r2 = getAcc(FUSER); if (!r2 || !r2.rcv) return; r2.rcv.mh = mh; r2.rcv.mhv = 3; RAWLS.setItem(accKey(FUSER), JSON.stringify(r2)); persistNow();
  } catch (e) {}
}, 3500);

/* ---- loan comparison: add as many offers as you like, remove them, and name each one ---- */
const LC_MAX = 12;
const LC_F = [['amt', 'f_loanAmt', 'cur'], ['rate', 'f_rate', '%'], ['yrs', 'f_term', 'yrs'], ['fee', 'f_lcFee', 'cur'], ['pct', 'f_lcPct', '%'], ['mon', 'f_lcMon', 'cur']];
const LC_RT = [['fix', 'lc_rtFix'], ['prime', 'lc_rtPrime'], ['pmt', 'lc_rtPmt']];
function lcPrime(){ return (isFinite(+MKT.boi) ? +MKT.boi : 0) + PRIME_SPREAD; }
function lcFields(o){ const rt = o.rt || 'fix'; return LC_F.map(f => f[0] !== 'rate' ? f : rt === 'prime' ? ['mg', 'f_lcMargin', '%'] : rt === 'pmt' ? ['pay', 'f_lcPay', 'cur'] : f); }
function lcCalcTxt(o){
  const rt = o.rt || 'fix'; if (rt === 'fix') return '';
  const s = loanCmpSide(o);
  if (rt === 'prime') return t('lc_primeIs', {p: PC(lcPrime()), r: PC(s.rate)});
  return s.low ? t('lc_pmtLow') : t('lc_rateIs', {r: PC(s.rate)});
}
function lcSeed(){
  let a = {n: '', amt: 200000, rate: 5.5, yrs: 5, fee: 0, pct: 0, mon: 0}, b = {n: '', amt: 200000, rate: 4.9, yrs: 5, fee: 1500, pct: 0.5, mon: 10};
  try { const o = JSON.parse(LS.getItem('fin-vals') || 'null');     // keep what was typed in the old two-offer form
    if (o && o.lc_aamt != null){ const g = (p, k) => +o['lc_' + p + k] || 0;
      a = {n: '', amt: g('a', 'amt'), rate: g('a', 'rate'), yrs: g('a', 'yrs'), fee: g('a', 'fee'), pct: g('a', 'pct'), mon: g('a', 'mon')};
      b = {n: '', amt: g('b', 'amt'), rate: g('b', 'rate'), yrs: g('b', 'yrs'), fee: g('b', 'fee'), pct: g('b', 'pct'), mon: g('b', 'mon')}; } } catch (e) {}
  return [a, b];
}
function lcList(){ if (!Array.isArray(SET.lcOffers) || !SET.lcOffers.length) SET.lcOffers = lcSeed(); return SET.lcOffers; }
function lcName(o, i){ return String((o && o.n) || '').trim() || t('lc_def', {n: i + 1}); }
var LC_T = null;
function lcSave(){ clearTimeout(LC_T); LC_T = setTimeout(saveSet, 300); }
function lcRender(){
  const box = $('#lc_box'); if (!box) return;
  const L = lcList();
  box.innerHTML = L.map((o, i) => `<div class="lc-card" data-lci="${i}">
      <div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span><input class="lc-name" type="text" maxlength="30" dir="auto" data-lci="${i}" data-lck="n" value="${asEsc(o.n || '')}" placeholder="${asEsc(t('lc_def', {n: i + 1}) + ' · ' + t('lc_namePh'))}" aria-label="${asEsc(t('lc_name') + ' ' + (i + 1))}">
        ${L.length > 1 ? `<button type="button" class="lc-del" data-lcdel="${i}" aria-label="${asEsc(t('lc_del', {x: lcName(o, i)}))}">✕</button>` : ''}</div>
      <div class="seg lc-rt" role="group" aria-label="${asEsc(t('lc_rt'))}">${LC_RT.map(([k, l]) => `<button type="button" data-lcrt="${k}" data-lci="${i}" aria-pressed="${(o.rt || 'fix') === k}">${asEsc(t(l))}</button>`).join('')}</div>
      <p class="lc-calc" data-lcc="${i}"${(o.rt || 'fix') === 'fix' ? ' hidden' : ''}>${asEsc(lcCalcTxt(o))}</p>
      <div class="fields">${lcFields(o).map(([k, lab, u]) => `<div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t(lab))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-lci="${i}" data-lck="${k}" value="${o[k] == null ? '' : o[k]}" aria-label="${asEsc(t(lab) + ' · ' + lcName(o, i))}">${unitHTML(u)}</div></div>`).join('')}</div>
    </div>`).join('') +
    (L.length < LC_MAX ? `<button type="button" class="lc-add" id="lc_add"><span aria-hidden="true">＋</span> ${asEsc(t('lc_add'))}</button>` : `<p class="fine">${asEsc(t('lc_max', {n: LC_MAX}))}</p>`) +
    `<p class="fine lc-hint">${asEsc(t('lc_hint'))}</p>`;
  $$('[data-i]', box).forEach(el => { el.textContent = t(el.dataset.i); });
}
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.lck == null || !el.closest('#lc_box')) return;
  const L = lcList(), o = L[+el.dataset.lci]; if (!o) return;
  o[el.dataset.lck] = el.dataset.lck === 'n' ? el.value.slice(0, 30) : (el.value === '' ? 0 : +el.value);
  const c = $(`#lc_box [data-lcc="${el.dataset.lci}"]`); if (c && !c.hidden) c.textContent = lcCalcTxt(o);
  lcSave();
}, true);
document.addEventListener('click', e => {
  if (e.target.closest('#lc_add')){
    const L = lcList(); if (L.length >= LC_MAX) return;
    const last = L[L.length - 1] || {}; L.push(Object.assign({}, last, {n: ''}));
    saveSet(); lcRender(); calc(tab);
    const ins = $$('#lc_box .lc-name'), n = ins[ins.length - 1]; if (n){ n.focus(); n.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); }
    return;
  }
  const rb = e.target.closest('[data-lcrt]');
  if (rb){
    const o = lcList()[+rb.dataset.lci], rt = rb.dataset.lcrt; if (!o || (o.rt || 'fix') === rt) return;
    const cur = loanCmpSide(o);                       // keep the same rate when switching type
    if (rt === 'prime' && o.mg == null) o.mg = Math.round((cur.rate - lcPrime()) * 100) / 100;
    if (rt === 'pmt' && !o.pay) o.pay = Math.round(cur.pm);
    if (rt === 'fix' && o.rt) o.rate = Math.round(cur.rate * 100) / 100;
    o.rt = rt; saveSet(); lcRender(); calc(tab);
    const b = $(`#lc_box [data-lcrt="${rt}"][data-lci="${rb.dataset.lci}"]`); if (b) b.focus();
    return;
  }
  const d = e.target.closest('[data-lcdel]');
  if (d){ const L = lcList(); if (L.length <= 1) return; L.splice(+d.dataset.lcdel, 1); saveSet(); lcRender(); calc(tab); const a = $('#lc_add') || $('#lc_box .lc-name'); if (a) a.focus(); }
});
const _alLc = applyLang;
applyLang = function(){ const r = _alLc.apply(this, arguments); lcRender(); return r; };
lcRender();
if (tab === 'loancmp') calc(tab);

/* ---- split bill: a list of people with names; each mode reads its own value ---- */
const SP_MAX = 20;
const SP_KEY = {inc: ['inc', 'sp_vInc', 'cur'], pct: ['pct', 'sp_vPct', '%'], sh: ['sh', 'sp_vSh', ''], ex: ['ex', 'sp_vEx', 'cur'], paid: ['paid', 'sp_vPaid', 'cur']};
function spSeed(){
  let ia = 15000, ib = 10000;
  try { const o = JSON.parse(LS.getItem('fin-vals') || 'null'); if (o && o.sp_ia != null){ ia = +o.sp_ia || 0; ib = +o.sp_ib || 0; } } catch (e) {}
  return [{n: '', inc: ia, pct: 50, sh: 1, ex: 0, paid: 600}, {n: '', inc: ib, pct: 50, sh: 1, ex: 0, paid: 0}];
}
function spList(){ if (!Array.isArray(SET.spPeople) || SET.spPeople.length < 2) SET.spPeople = spSeed(); return SET.spPeople; }
function spName(p, i){ return String((p && p.n) || '').trim() || t('sp_person', {n: i + 1}); }
var SP_T = null;
function spRender(){
  const box = $('#sp_box'); if (!box) return;
  const mode = ($('#sp_mode') || {}).value || 'eq', K = SP_KEY[mode]; if (!K){ box.innerHTML = ''; return; }
  const [k, lab, u] = K, P = spList();
  box.innerHTML = P.map((p, i) => `<div class="sp-row" data-spi="${i}">
      <span class="lc-num" aria-hidden="true">${i + 1}</span>
      <input class="lc-name" type="text" maxlength="24" dir="auto" data-spi="${i}" data-spk="n" value="${asEsc(p.n || '')}" placeholder="${asEsc(t('sp_person', {n: i + 1}))}" aria-label="${asEsc(t('sp_name') + ' ' + (i + 1))}">
      <div class="control sp-v"><input type="number" inputmode="decimal" step="any" data-spi="${i}" data-spk="${k}" value="${p[k] == null ? '' : p[k]}" aria-label="${asEsc(t(lab) + ' · ' + spName(p, i))}">${unitHTML(u)}</div>
      ${P.length > 2 ? `<button type="button" class="lc-del" data-spdel="${i}" aria-label="${asEsc(t('lc_del', {x: spName(p, i)}))}">✕</button>` : '<span class="sp-gap"></span>'}
    </div>`).join('') +
    `<p class="sp-head">${asEsc(t(lab))}</p>` +
    (P.length < SP_MAX ? `<button type="button" class="lc-add" id="sp_add"><span aria-hidden="true">＋</span> ${asEsc(t('sp_add'))}</button>` : `<p class="fine">${asEsc(t('sp_max', {n: SP_MAX}))}</p>`) +
    `<p class="fine lc-hint">${asEsc(t('sp_hint_' + mode))}</p>`;
  const head = $('.sp-head', box); if (head) box.insertBefore(head, box.firstChild);
  $$('[data-i]', box).forEach(el => { el.textContent = t(el.dataset.i); });
}
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.spk == null || !el.closest('#sp_box')) return;
  const o = spList()[+el.dataset.spi]; if (!o) return;
  o[el.dataset.spk] = el.dataset.spk === 'n' ? el.value.slice(0, 24) : (el.value === '' ? 0 : +el.value);
  clearTimeout(SP_T); SP_T = setTimeout(saveSet, 300);
}, true);
document.addEventListener('change', e => { if (e.target.id === 'sp_mode') spRender(); }, true);
document.addEventListener('click', e => {
  if (e.target.closest('#sp_add')){
    const P = spList(); if (P.length >= SP_MAX) return;
    P.push({n: '', inc: 10000, pct: 0, sh: 1, ex: 0, paid: 0}); saveSet(); spRender(); calc(tab);
    const ins = $$('#sp_box .lc-name'), n = ins[ins.length - 1]; if (n){ n.focus(); n.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); }
    return;
  }
  const d = e.target.closest('[data-spdel]');
  if (d){ const P = spList(); if (P.length <= 2) return; P.splice(+d.dataset.spdel, 1); saveSet(); spRender(); calc(tab); const a = $('#sp_add') || $('#sp_box .lc-name'); if (a) a.focus(); }
});
const _alSp = applyLang;
applyLang = function(){ const r = _alSp.apply(this, arguments); spRender(); return r; };
spRender();
if (tab === 'split') calc(tab);

/* ---- security: devices signed in to the account and sign-in attempts, live.
   No tracking: no location, no IP address, no fixed device ID. A signed-in tab gets a random session id that dies
   with the session, and only the device type and browser are kept, in the account owner's private space. */
const SEC_ONLINE = 3 * 60000, SEC_KEEP = 14 * 864e5;
var SEC = {sid: '', timer: null, devs: null, cloudEv: [], col: null, h: '', known: '', alertT: Date.now(), summary: false, tick: null};
function secKey(n){ return 'fin-sec:' + accKey(n); }
function secGet(n){ try { const o = JSON.parse(RAWLS.getItem(secKey(n)) || 'null'); return o && Array.isArray(o.ev) ? o : {ev: [], seen: 0}; } catch (e) { return {ev: [], seen: 0}; } }
function devKind(){
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'phone';
  return 'computer';
}
function devBrowser(){
  const ua = navigator.userAgent || '';
  return /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : '';
}
function devLabel(k, b, app){ return ({phone: '📱', tablet: '📟', computer: '💻'}[k] || '📱') + ' ' + t('dev_' + (k || 'phone')) + (app === 'claude' ? ' · Claude' : b ? ' · ' + b : ''); }
function secLog(n, k){
  if (!n) return;
  const ev = {t: Date.now(), k, d: devKind(), b: devBrowser(), app: IN_CLAUDE ? 'claude' : 'site'};
  try { const s = secGet(n); s.ev.push(ev); s.ev = s.ev.slice(-40); RAWLS.setItem(secKey(n), JSON.stringify(s)); } catch (e) {}
  if (IN_CLAUDE) (async () => { try { if (!(await mvCloudInit())) return; const ref = MV.db.collection('data/users/' + MV.uid).doc('sec-' + txHash(String(n).toLowerCase()));
    const cur = await ref.get(), list = ((cur.exists && (cur.data() || {}).ev) || []).concat([ev]).slice(-40); await ref.set({ev: list}); } catch (e) {} })();
}
const _nfSec = noteFail;
noteFail = function(n, ok){ _nfSec.apply(this, arguments); if (!ok && n && (getAcc(n) || SEC.known === n)) secLog(n, 'fail'); };
const _mvrSec = mvRestore;
mvRestore = async function(pkg){ SEC.known = pkg && pkg.name || ''; try { return await _mvrSec.apply(this, arguments); } finally { SEC.known = ''; } };
const _usSec = unlockSession;
unlockSession = async function(name){ secLog(name, 'in'); try { SS.setItem('fin-justin', '1'); SS.removeItem('fin-sid'); SS.removeItem('fin-sst'); } catch (e) {} return _usSec.apply(this, arguments); };
function secEvents(){
  if (!FUSER || !SEC) return [];
  const seen = {}, out = [];
  secGet(FUSER).ev.concat(SEC.cloudEv || []).forEach(e => { const k = e.t + '|' + e.k; if (!seen[k]){ seen[k] = 1; out.push(e); } });
  return out.sort((a, b) => b.t - a.t);
}
function secUnseen(){ if (!FUSER) return 0; const seen = secGet(FUSER).seen || 0; return secEvents().filter(e => e.k === 'fail' && e.t > seen).length; }
function secMarkSeen(){ if (!FUSER) return; try { const s = secGet(FUSER); s.seen = Date.now(); RAWLS.setItem(secKey(FUSER), JSON.stringify(s)); } catch (e) {} const b = $('#sec_bar'); if (b) b.remove(); secHub(); }
function secAgo(ts){
  const d = Math.round((ts - Date.now()) / 1000), a = Math.abs(d);
  try { const rf = new Intl.RelativeTimeFormat(locOf(), {numeric: 'auto'});
    if (a < 45) return t('sec_now'); if (a < 3600) return rf.format(Math.round(d / 60), 'minute'); if (a < 86400) return rf.format(Math.round(d / 3600), 'hour'); if (a < 7 * 86400) return rf.format(Math.round(d / 86400), 'day'); } catch (e) {}
  try { return new Date(ts).toLocaleString(locOf(), {dateStyle: 'short', timeStyle: 'short'}); } catch (e) { return new Date(ts).toLocaleString(); }
}
function secHub(){
  const b = $('#sh_b_security'); if (!b || !SEC) return;
  const n = secUnseen(), online = (SEC.devs || []).filter(d => Date.now() - (d.seen || 0) < SEC_ONLINE).length;
  b.className = 'sh-badge' + (n ? ' alert' : online > 1 ? ' cnt' : '');
  b.textContent = n ? '!' : online > 1 ? String(online) : '';
}
function secAlert(n){
  if (!n) return;
  let bar = $('#sec_bar');
  if (!bar){ bar = document.createElement('div'); bar.id = 'sec_bar'; bar.className = 'sec-bar'; bar.setAttribute('role', 'alert'); document.body.appendChild(bar); }
  bar.innerHTML = `<span>⚠️ ${asEsc(t(n === 1 ? 'sec_alert1' : 'sec_alert', {n}))}</span><button type="button" class="sec-bar-go" id="sec_bar_go">${asEsc(t('sec_details'))}</button><button type="button" class="sec-bar-x" id="sec_bar_x" aria-label="${asEsc(t('del_cancel'))}">×</button>`;
}
function secCheckNew(){
  const fresh = secEvents().filter(e => e.k === 'fail' && e.t > SEC.alertT);
  if (fresh.length){ SEC.alertT = Math.max(...fresh.map(e => e.t)); toast(t('sec_alertNow')); secAlert(secUnseen()); }
  secHub(); secRender();
}
function secSummary(){
  if (SEC.summary) return; let flag = false; try { flag = !!SS.getItem('fin-justin'); } catch (e) {} if (!flag) return;
  const ev = secEvents(), ins = ev.filter(e => e.k === 'in');
  const prevIn = ins[1] ? ins[1].t : 0, curIn = ins[0] ? ins[0].t : Date.now();
  const n = ev.filter(e => e.k === 'fail' && e.t > prevIn && e.t <= curIn && e.t > (secGet(FUSER).seen || 0)).length;
  if (n) secAlert(n);
}
function secRender(){
  const box = $('#sec_box'); if (!box || !SEC) return;
  if (!FUSER){ box.innerHTML = `<p class="fine">${asEsc(t('sec_needLogin'))}</p><div class="btnrow"><button type="button" class="gold-btn" data-scat="account">${asEsc(t('sec_toAcc'))}</button></div>`; return; }
  const rec = getAcc(FUSER) || {}, rv = rec.rcv, ev = secEvents(), now = Date.now();
  const fails = ev.filter(e => e.k === 'fail'), f24 = fails.filter(e => now - e.t < 864e5), lk = lockLeft(FUSER);
  const devs = IN_CLAUDE && SEC.devs ? SEC.devs.filter(d => now - (d.seen || 0) < SEC_KEEP).sort((a, b) => (b.id === SEC.sid) - (a.id === SEC.sid) || b.seen - a.seen) : null;
  const online = devs ? devs.filter(d => now - (d.seen || 0) < SEC_ONLINE).length : 1;
  const mailOk = !!(rv && rv.ok), good = mailOk && !f24.length;
  const chk = (ok, warn, txt, act) => `<li class="sec-c ${ok ? 's-ok' : warn ? 's-warn' : 's-bad'}"><b aria-hidden="true">${ok ? '✓' : warn ? '!' : '✗'}</b><span>${asEsc(txt)}</span>${act || ''}</li>`;
  let h = '';
  if (f24.length) h += `<div class="sec-alert" role="alert">⚠️ ${asEsc(t(f24.length === 1 ? 'sec_f241' : 'sec_f24', {n: f24.length, w: secAgo(f24[0].t)}))}</div>`;
  if (lk > 0) h += `<div class="sec-alert">🔒 ${asEsc(t('sec_locked', {s: lk}))}</div>`;
  h += `<div class="sec-score ${good ? 's-ok' : 's-warn'}"><span class="sec-shield" aria-hidden="true">🛡️</span><div><b>${asEsc(t(good ? 'sec_high' : 'sec_mid'))}</b><small>${asEsc(t(good ? 'sec_highS' : 'sec_midS'))}</small></div></div>
    <ul class="sec-list">${chk(true, false, t('sec_cPw'))}${chk(mailOk, rv && !rv.ok, t(mailOk ? 'sec_cMailOk' : rv ? 'sec_cMailWait' : 'sec_cMailNo'), mailOk ? '' : `<button type="button" class="btn sec-mini" id="sec_toRc">${asEsc(t('sec_fix'))}</button>`)}${chk(!f24.length, true, f24.length ? t(f24.length === 1 ? 'sec_cFails1' : 'sec_cFails', {n: f24.length}) : t('sec_cNoFails'))}${chk(true, false, t('sec_cLock'))}</ul>`;
  h += `<h4 class="sec-h">${asEsc(t('sec_devT'))} <span class="sec-live" aria-hidden="true"></span><span class="sec-live-t">${asEsc(t('sec_live'))}</span></h4>`;
  if (devs){
    h += `<p class="sec-count"><b>${online}</b> ${asEsc(t('sec_onlineN'))} · <b>${devs.length}</b> ${asEsc(t('sec_signedN'))}</p><ul class="sec-devs">` + devs.map(d => {
      const me = d.id === SEC.sid, on = now - (d.seen || 0) < SEC_ONLINE;
      return `<li class="sec-dev${me ? ' me' : ''}"><div><b>${asEsc(devLabel(d.k, d.b, d.app))}</b><small>${asEsc(me ? t('sec_thisDev') : on ? t('sec_activeNow') : t('sec_lastSeen', {w: secAgo(d.seen)}))} · ${asEsc(t('sec_since', {w: secAgo(d.st || d.seen)}))}</small></div>${on ? '<i class="sec-dot" aria-hidden="true"></i>' : ''}${me ? '' : `<button type="button" class="btn danger sec-mini" data-kick="${asEsc(d.id)}">${asEsc(t('sec_kick'))}</button>`}</li>`; }).join('') + '</ul>';
    if (devs.length > 1) h += `<div class="btnrow"><button type="button" class="btn danger" id="sec_kickAll">${asEsc(t('sec_kickAll'))}</button></div>`;
  } else if (IN_CLAUDE){ h += `<p class="fine">${asEsc(t('m_wait'))}</p>`; }
  else h += `<ul class="sec-devs"><li class="sec-dev me"><div><b>${asEsc(devLabel(devKind(), devBrowser(), 'site'))}</b><small>${asEsc(t('sec_thisDev'))}</small></div><i class="sec-dot" aria-hidden="true"></i></li></ul><p class="fine">${asEsc(t('sec_siteOnly'))}</p>`;
  h += `<h4 class="sec-h">${asEsc(t('sec_actT'))}</h4>`;
  const icon = {fail: '❌', in: '✅', rc: '🔑', pw: '🔒', mail: '📧', kick: '⛔'};
  h += ev.length ? `<ul class="sec-act">${ev.slice(0, 15).map(e => `<li class="${e.k === 'fail' ? 's-bad' : ''}"><span aria-hidden="true">${icon[e.k] || '•'}</span><div><b>${asEsc(t('sec_ev_' + e.k))}</b><small>${asEsc(devLabel(e.d, e.b, e.app))} · ${asEsc(secAgo(e.t))}</small></div></li>`).join('')}</ul>
    <div class="btnrow"><button type="button" class="btn" id="sec_clear">${asEsc(t('sec_clear'))}</button></div>` : `<p class="fine">${asEsc(t('sec_noAct'))}</p>`;
  h += `<p class="fine sec-priv">🔒 ${asEsc(t('sec_privacy'))}</p><p class="gk-st" id="sec_st" role="status" aria-live="polite"></p>`;
  box.innerHTML = h;
}
async function secKick(only){
  if (!SEC.col) return;
  try { await SEC.col.doc('kick-' + SEC.h).set({at: Date.now(), by: SEC.sid, only: only || ''});
    if (only) await SEC.col.doc('sess-' + only).delete(); else for (const d of (SEC.devs || [])) if (d.id !== SEC.sid) await SEC.col.doc('sess-' + d.id).delete();
    secLog(FUSER, 'kick'); toast(t(only ? 'sec_kickedOne' : 'sec_kickedAll'));
  } catch (e) { toast(t('pol_fail')); }
}
async function secKicked(){
  clearInterval(SEC.timer);
  try { await persistNow0(); } catch (e) {}
  try { if (SEC.col) await SEC.col.doc('sess-' + SEC.sid).delete(); } catch (e) {}
  clearSession(); try { SS.removeItem('fin-sid'); SS.removeItem('fin-sst'); SS.setItem('fin-kicked', '1'); } catch (e) {}
  try { location.reload(); } catch (e) {}
}
async function secStart(){
  secRender();
  if (!FUSER || !IN_CLAUDE || !(await mvCloudInit())) { secHub(); return; }
  let sid = ''; try { sid = SS.getItem('fin-sid') || ''; if (!sid){ sid = Array.from(rnd(9), b => b.toString(16).padStart(2, '0')).join(''); SS.setItem('fin-sid', sid); SS.setItem('fin-sst', String(Date.now())); } } catch (e) {}
  SEC.sid = sid; SEC.h = txHash(FUSER.toLowerCase()); SEC.col = MV.db.collection('data/users/' + MV.uid);
  const st = +(SS.getItem('fin-sst') || Date.now());
  const beat = async () => { if (document.hidden || MV.dead || !FUSER) return; try { await SEC.col.doc('sess-' + SEC.sid).set({a: SEC.h, k: devKind(), b: devBrowser(), app: 'claude', st, seen: Date.now()}); } catch (e) {} };
  await beat(); SEC.timer = setInterval(beat, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
  try { SEC.col.where('a', '==', SEC.h).onSnapshot(q => {
    SEC.devs = (q.docs || []).filter(d => String(d.id).indexOf('sess-') === 0).map(d => Object.assign({}, d.data() || {}, {id: String(d.id).slice(5)}));
    if (SEC.sid && !SEC.devs.some(d => d.id === SEC.sid)) SEC.devs.push({id: SEC.sid, k: devKind(), b: devBrowser(), app: 'claude', st, seen: Date.now()});
    SEC.devs.filter(d => Date.now() - (d.seen || 0) > SEC_KEEP).forEach(d => { try { SEC.col.doc('sess-' + d.id).delete(); } catch (e) {} });
    secHub(); secRender(); }, () => {}); } catch (e) {}
  try { SEC.col.doc('kick-' + SEC.h).onSnapshot(d => { const k = d && d.exists ? (d.data() || {}) : null; if (k && +k.at > st && k.by !== SEC.sid && (!k.only || k.only === SEC.sid)) secKicked(); }, () => {}); } catch (e) {}
  try { SEC.col.doc('sec-' + SEC.h).onSnapshot(d => { SEC.cloudEv = (d && d.exists && (d.data() || {}).ev) || []; secSummary(); SEC.summary = true; secCheckNew(); }, () => {}); } catch (e) {}
}
window.addEventListener('storage', e => { if (FUSER && e.key === secKey(FUSER)) secCheckNew(); });
document.addEventListener('click', e => {
  const el = e.target;
  if (el.closest('#sec_bar_x')){ const b = $('#sec_bar'); if (b) b.remove(); return; }
  if (el.closest('#sec_bar_go')){ const ts = $('#tab-settings'); if (ts) ts.click(); setCat('security'); secMarkSeen(); secRender(); return; }
  if (el.closest('#sec_toRc')){ setCat('account'); const d = $('#rc_d'); if (d){ d.open = true; rcRender(); setTimeout(() => d.scrollIntoView({block: 'start', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}), 60); } return; }
  const k = el.closest('[data-kick]');
  if (k){ if (!k.dataset.sure){ k.dataset.sure = '1'; k.textContent = t('b_sure'); return; } secKick(k.dataset.kick); return; }
  const ka = el.closest('#sec_kickAll');
  if (ka){ if (!ka.dataset.sure){ ka.dataset.sure = '1'; ka.textContent = t('b_sure'); return; } secKick(''); return; }
  const cl = el.closest('#sec_clear');
  if (cl){ if (!cl.dataset.sure){ cl.dataset.sure = '1'; cl.textContent = t('b_sure'); return; }
    try { const s = secGet(FUSER); s.ev = []; RAWLS.setItem(secKey(FUSER), JSON.stringify(s)); } catch (er) {}
    if (SEC.col){ SEC.cloudEv = []; try { SEC.col.doc('sec-' + SEC.h).set({ev: []}); } catch (er) {} }
    secRender(); secHub(); return; }
  if (el.closest('.sh-row[data-scat="security"]')) setTimeout(() => { secMarkSeen(); secRender(); }, 50);
});
const _alSec = applyLang;
applyLang = function(){ const r = _alSec.apply(this, arguments); secRender(); secHub(); return r; };
SEC.tick = setInterval(() => { if (SCAT === 'security' && !document.hidden) secRender(); }, 30000);
try { if (SS.getItem('fin-kicked')){ SS.removeItem('fin-kicked'); setTimeout(() => toast(t('sec_youKicked')), 700); } } catch (e) {}
if (FUSER){ secSummary(); if (!IN_CLAUDE){ SEC.summary = true; } }
secStart().then(() => { try { SS.removeItem('fin-justin'); } catch (e) {} }, () => {});
/* signing out ends this session's record */
const _loSec = logoutNow;
logoutNow = async function(){ clearInterval(SEC.timer); try { if (SEC.col && SEC.sid) await SEC.col.doc('sess-' + SEC.sid).delete(); } catch (e) {} try { SS.removeItem('fin-sid'); SS.removeItem('fin-sst'); } catch (e) {} return _loSec.apply(this, arguments); };

/* ---- job offers and supermarket items: named lists you can add to and remove from ---- */
const JO_MAX = 8, UP_MAX = 15;
const JO_F = [['g', 'f_joGross', 'ils'], ['bonus', 'f_joBonus', 'ils'], ['erp', 'f_erPens', '%'], ['hish', 'f_erStudy', '%'], ['car', 'f_joCar', 'ils'], ['carv', 'f_joCarV', 'ils'], ['perk', 'f_joPerk', 'ils']];
function joList(){ if (!Array.isArray(SET.joOffers) || !SET.joOffers.length) SET.joOffers = [{n: '', g: 18000, bonus: 0, erp: 6.5, hish: 7.5, car: 0, carv: 0, perk: 0}, {n: '', g: 20000, bonus: 0, erp: 6.5, hish: 0, car: 0, carv: 0, perk: 400}]; return SET.joOffers; }
function joName(o, i){ return String((o && o.n) || '').trim() || t('jo_def', {n: i + 1}); }
function upList(){ if (!Array.isArray(SET.upItems) || !SET.upItems.length) SET.upItems = [{n: '', p: 12.9, q: 500, u: 'g', n2: 1}, {n: '', p: 21.9, q: 1, u: 'kg', n2: 1}]; return SET.upItems; }
function upName(o, i){ return String((o && o.n) || '').trim() || t('up_def', {n: i + 1}); }
var LIST_T = null;
function listSave(){ clearTimeout(LIST_T); LIST_T = setTimeout(saveSet, 300); }
function joRender(){
  const box = $('#jo_box'); if (!box) return;
  const L = joList();
  box.innerHTML = L.map((o, i) => `<div class="lc-card">
      <div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span><input class="lc-name" type="text" maxlength="30" dir="auto" data-jl="jo" data-li="${i}" data-lk="n" value="${asEsc(o.n || '')}" placeholder="${asEsc(t('jo_def', {n: i + 1}) + ' · ' + t('jo_namePh'))}" aria-label="${asEsc(t('jo_name') + ' ' + (i + 1))}">
        ${L.length > 1 ? `<button type="button" class="lc-del" data-jdel="jo" data-li="${i}" aria-label="${asEsc(t('lc_del', {x: joName(o, i)}))}">✕</button>` : ''}</div>
      <div class="fields">${JO_F.map(([k, lab, u]) => `<div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t(lab))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-jl="jo" data-li="${i}" data-lk="${k}" value="${o[k] == null ? '' : o[k]}" aria-label="${asEsc(t(lab) + ' · ' + joName(o, i))}">${unitHTML(u)}</div></div>`).join('')}</div>
    </div>`).join('') +
    (L.length < JO_MAX ? `<button type="button" class="lc-add" data-jadd="jo"><span aria-hidden="true">＋</span> ${asEsc(t('jo_add'))}</button>` : '') + `<p class="fine lc-hint">${asEsc(t('jo_hint'))}</p>`;
}
function upRender(){
  const box = $('#up_box'); if (!box) return;
  const L = upList(), units = [['g', 'u_g'], ['kg', 'u_kg'], ['ml', 'u_ml'], ['l', 'u_l'], ['u', 'u_unit']];
  box.innerHTML = L.map((o, i) => `<div class="lc-card">
      <div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span><input class="lc-name" type="text" maxlength="30" dir="auto" data-jl="up" data-li="${i}" data-lk="n" value="${asEsc(o.n || '')}" placeholder="${asEsc(t('up_def', {n: i + 1}) + ' · ' + t('up_namePh'))}" aria-label="${asEsc(t('up_name') + ' ' + (i + 1))}">
        ${L.length > 1 ? `<button type="button" class="lc-del" data-jdel="up" data-li="${i}" aria-label="${asEsc(t('lc_del', {x: upName(o, i)}))}">✕</button>` : ''}</div>
      <div class="fields up-fields">
        <div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t('f_upPrice'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-jl="up" data-li="${i}" data-lk="p" value="${o.p == null ? '' : o.p}" aria-label="${asEsc(t('f_upPrice') + ' · ' + upName(o, i))}">${unitHTML('cur')}</div></div>
        <div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t('f_upSize'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-jl="up" data-li="${i}" data-lk="q" value="${o.q == null ? '' : o.q}" aria-label="${asEsc(t('f_upSize') + ' · ' + upName(o, i))}"></div></div>
        <div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t('f_upUnit'))}</span><select data-jl="up" data-li="${i}" data-lk="u" aria-label="${asEsc(t('f_upUnit') + ' · ' + upName(o, i))}">${units.map(([k, l]) => `<option value="${k}"${o.u === k ? ' selected' : ''}>${asEsc(t(l))}</option>`).join('')}</select></div>
        <div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t('f_upPack'))}</span><div class="control"><input type="number" inputmode="numeric" step="1" min="1" data-jl="up" data-li="${i}" data-lk="n2" value="${o.n2 || 1}" aria-label="${asEsc(t('f_upPack') + ' · ' + upName(o, i))}"></div></div>
      </div></div>`).join('') +
    (L.length < UP_MAX ? `<button type="button" class="lc-add" data-jadd="up"><span aria-hidden="true">＋</span> ${asEsc(t('up_add'))}</button>` : '') + `<p class="fine lc-hint">${asEsc(t('up_hint'))}</p>`;
}
const LISTS = {jo: [joList, joRender, JO_MAX, () => Object.assign({}, joList()[joList().length - 1] || {}, {n: ''})], up: [upList, upRender, UP_MAX, () => Object.assign({}, upList()[upList().length - 1] || {}, {n: '', p: 0})]};
function listSet(el){
  const L = LISTS[el.dataset.jl]; if (!L) return;
  const o = L[0]()[+el.dataset.li]; if (!o) return;
  const k = el.dataset.lk; o[k] = k === 'n' || k === 'u' ? String(el.value).slice(0, 30) : (el.value === '' ? 0 : +el.value);
  listSave();
}
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.jl) listSet(e.target); }, true);
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.jl && e.target.tagName === 'SELECT') listSet(e.target); }, true);
document.addEventListener('click', e => {
  const a = e.target.closest('[data-jadd]');
  if (a){ const L = LISTS[a.dataset.jadd], list = L[0](); if (list.length >= L[2]) return; list.push(L[3]()); saveSet(); L[1](); calc(tab);
    const ins = $$('.lc-name[data-jl="' + a.dataset.jadd + '"]'), n = ins[ins.length - 1]; if (n){ n.focus(); n.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); } return; }
  const d = e.target.closest('[data-jdel]');
  if (d){ const L = LISTS[d.dataset.jdel], list = L[0](); if (list.length <= 1) return; list.splice(+d.dataset.li, 1); saveSet(); L[1](); calc(tab); }
});
/* appliance presets fill in the power */
document.addEventListener('change', e => {
  if (e.target.id !== 'ap_pre') return;
  const w = parseFloat(e.target.value); const f = $('#ap_w'); if (f && isFinite(w)){ f.value = w; f.dispatchEvent(new Event('input', {bubbles: true})); }
}, true);
const _alLists = applyLang;
applyLang = function(){ const r = _alLists.apply(this, arguments); joRender(); upRender(); return r; };
joRender(); upRender();
if (['joboffer', 'unitprice'].includes(tab)) calc(tab);

/* ---- live connections are shown only to the app owner (checked by claude.ai, never trusted from the page) ---- */
function liveOwner(){ return DEV_ON === true && (!IN_CLAUDE || PERM === 'owner'); }
/* everything about where the data comes from stays behind the scenes: only the owner (inside Claude) sees and manages it */
var OWN_SECS = ['set_src', 'set_live', 'set_figs', 'set_sync'], OWN_LAST = null;
function liveApply(){
  const own = liveOwner();
  OWN_SECS.forEach(k => { const sec = $(`#panel-settings .set-sec[data-sk="${k}"]`); if (sec){ sec.dataset.own = '1'; if (sec.hidden === own) GS_IDX = null; sec.hidden = !own; } });
  document.body.classList.toggle('own', own);
  if (!own){                                                   // the data sources themselves stay on for everyone; only the owner can switch them
    ['liveFiat', 'liveCrypto', 'boiDb', 'src_boiFx', 'src_boiInt', 'src_cpi', 'src_ecb', 'src_binance'].forEach(k => { if (SET[k] === '0') SET[k] = '1'; });
    if (!(+SET.autoRef > 0)) SET.autoRef = '5';
  }
  if (OWN_LAST !== own){ OWN_LAST = own; if (typeof figApply === 'function') try { figApply(true); } catch (e) {} if (typeof ixBoard === 'function' && tab === 'home') try { ixBoard(); } catch (e) {} }
  $$('[data-i="sc_conn"], [data-i="sc_connAi"]', $('#panel-settings') || document).forEach(el => { el.dataset.i = own ? 'sc_conn' : 'sc_connAi'; el.textContent = t(el.dataset.i); });
  const sub = $('#sh_sub_conn'); if (sub){ sub.dataset.i = own ? 'sc_connS' : 'sc_connAiS'; sub.textContent = t(sub.dataset.i); }
}
liveApply();
Promise.resolve(PERM_P).then(liveApply, liveApply);
const _rsLive = renderStamp;
renderStamp = function(){ _rsLive.apply(this, arguments); liveApply(); };

/* ---- salary: monthly costs out of the net pay (car, fuel and more, plus your own items) ---- */
const SE_PRE = [['fuel', 'se_fuel', 'm'], ['carloan', 'se_carloan', 'm'], ['carins', 'se_carins', 'y'], ['license', 'se_license', 'y'], ['service', 'se_service', 'y'], ['parking', 'se_parking', 'm'], ['tolls', 'se_tolls', 'm'], ['transit', 'se_transit', 'm']];
const SE_CAR = ['fuel', 'carloan', 'carins', 'license', 'service', 'parking', 'tolls'];
function seData(){
  let d = SET.salExp; if (!d || typeof d !== 'object') d = SET.salExp = {items: {}, custom: []};
  if (!d.items) d.items = {}; if (!Array.isArray(d.custom)) d.custom = [];
  SE_PRE.forEach(([k, , p]) => { if (!d.items[k]) d.items[k] = {a: 0, p}; });
  const f = d.items.fuel; if (f.km == null){ f.km = 1500; f.cons = 7; f.price = 8.27; f.calc = 0; }
  return d;
}
function seAmt(o){ return Math.max(0, +o.a || 0) / (o.p === 'y' ? 12 : 1); }
function seFuel(f){ return Math.max(0, +f.km || 0) / 100 * Math.max(0, +f.cons || 0) * Math.max(0, +f.price || 0); }
function seTotals(){
  const d = seData(); let car = 0, other = 0;
  SE_PRE.forEach(([k]) => { const o = d.items[k], m = k === 'fuel' && o.calc ? seFuel(o) : seAmt(o); if (SE_CAR.includes(k)) car += m; else other += m; });
  d.custom.forEach(o => { other += seAmt(o); });
  return {car, other, total: car + other};
}
function seRow(key, label, o, custom, i){
  const per = `<select data-sek="${key}" data-sef="p"${custom ? ` data-sei="${i}"` : ''} aria-label="${asEsc(t('se_per') + ' · ' + label)}"><option value="m"${o.p !== 'y' ? ' selected' : ''}>${asEsc(t('se_perM'))}</option><option value="y"${o.p === 'y' ? ' selected' : ''}>${asEsc(t('se_perY'))}</option></select>`;
  const name = custom ? `<input class="lc-name se-name" type="text" maxlength="30" dir="auto" data-sek="custom" data-sef="n" data-sei="${i}" value="${asEsc(o.n || '')}" placeholder="${asEsc(t('se_customPh'))}" aria-label="${asEsc(t('se_customName'))}">` : `<span class="se-l">${asEsc(label)}</span>`;
  const fuelCalc = key === 'fuel' && o.calc;
  const amt = fuelCalc ? `<b class="se-calc" aria-live="polite">${MI(seFuel(o))}</b>`
    : `<div class="control se-a"><input type="number" inputmode="decimal" step="any" data-sek="${key}" data-sef="a"${custom ? ` data-sei="${i}"` : ''} value="${o.a || ''}" placeholder="0" aria-label="${asEsc(label)}">${unitHTML('ils')}</div>`;
  let h = `<div class="se-row${custom ? ' se-cust' : ''}">${name}${amt}${fuelCalc ? '' : per}${custom ? `<button type="button" class="lc-del" data-sedel="${i}" aria-label="${asEsc(t('lc_del', {x: o.n || t('se_custom')}))}">✕</button>` : ''}</div>`;
  if (key === 'fuel'){
    h += `<button type="button" class="se-tog" data-setog="1" aria-expanded="${!!o.calc}">⛽ ${asEsc(t(o.calc ? 'se_fuelManual' : 'se_fuelByKm'))}</button>`;
    if (o.calc) h += `<div class="se-fuel">${[['km', 'se_km', 'km'], ['cons', 'se_cons', ''], ['price', 'se_price', 'ils']].map(([k, l, u]) => `<div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t(l))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-sek="fuel" data-sef="${k}" value="${o[k] == null ? '' : o[k]}" aria-label="${asEsc(t(l))}">${unitHTML(u)}</div></div>`).join('')}</div>`;
  }
  return h;
}
function seRender(){
  const box = $('#se_box'); if (!box) return;
  const d = seData(), tt = seTotals();
  box.innerHTML = `<p class="fine se-intro">${asEsc(t('se_intro'))}</p>
    <h4 class="se-h">🚗 ${asEsc(t('se_carT'))}</h4>${SE_PRE.filter(([k]) => SE_CAR.includes(k)).map(([k, l]) => seRow(k, t(l), d.items[k])).join('')}
    <h4 class="se-h">🧾 ${asEsc(t('se_otherT'))}</h4>${seRow('transit', t('se_transit'), d.items.transit)}${d.custom.map((o, i) => seRow('custom', '', o, true, i)).join('')}
    <button type="button" class="lc-add" id="se_add"><span aria-hidden="true">＋</span> ${asEsc(t('se_add'))}</button>
    <p class="se-sum" id="se_sum">${asEsc(t('se_sum', {x: MI(tt.total)}))}</p>`;
}
function seSumUpd(){ const el = $('#se_sum'); if (el) el.textContent = t('se_sum', {x: MI(seTotals().total)}); const c = $('#se_box .se-calc'); if (c) c.textContent = MI(seFuel(seData().items.fuel)); }
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || !el.dataset.sek || !el.closest('#se_box')) return;
  const d = seData(), f = el.dataset.sef, o = el.dataset.sek === 'custom' ? d.custom[+el.dataset.sei] : d.items[el.dataset.sek]; if (!o) return;
  o[f] = f === 'n' || f === 'p' ? String(el.value).slice(0, 30) : (el.value === '' ? 0 : +el.value);
  seSumUpd(); clearTimeout(LIST_T); LIST_T = setTimeout(saveSet, 300);
}, true);
document.addEventListener('change', e => { const el = e.target; if (el.tagName === 'SELECT' && el.dataset && el.dataset.sek && el.closest('#se_box')){ el.dispatchEvent(new Event('input', {bubbles: true})); } }, true);
document.addEventListener('click', e => {
  if (e.target.closest('#se_add')){ const d = seData(); if (d.custom.length >= 20) return; d.custom.push({n: '', a: 0, p: 'm'}); saveSet(); seRender(); calc(tab); const n = $$('#se_box .se-name'); if (n.length) n[n.length - 1].focus(); return; }
  const del = e.target.closest('[data-sedel]'); if (del){ seData().custom.splice(+del.dataset.sedel, 1); saveSet(); seRender(); calc(tab); return; }
  if (e.target.closest('[data-setog]')){ const f = seData().items.fuel; f.calc = f.calc ? 0 : 1; if (!f.calc) f.a = Math.round(seFuel(f)); saveSet(); seRender(); calc(tab); const b = $('#se_box [data-setog]'); if (b) b.focus(); }
});
const _alSe = applyLang;
applyLang = function(){ const r = _alSe.apply(this, arguments); seRender(); return r; };
seRender();
if (tab === 'salary') calc(tab);

/* ================= live data: each change reaches your other windows and devices right away, encrypted and private ================= */
var LIVE = {pulled: false, inAt: 0, outAt: 0, cloudAt: 0, cloudSeen: false, started: false, key: null, keyFor: '', q: new Set(), qT: null, qSrc: '', typedAt: 0, err: '', hash0: ''};
try { const b = JSON.parse(RAWLS.getItem(FUSER ? encName(FUSER) : '') || 'null'); if (b && b.at) LIVE_SEAL_AT = +b.at; } catch (e) {}
try { if (FUSER) LIVE.hash0 = (getAcc(FUSER) || {}).hash || ''; } catch (e) {}
document.addEventListener('input', () => { LIVE.typedAt = Date.now(); }, true);
document.addEventListener('focusout', () => { if (LIVE.q.size) setTimeout(liveFlush, 60); }, true);
function liveMode(){ return FUSER ? (IN_CLAUDE && MV.ok ? 'cloud' : 'tabs') : 'local'; }
function liveBusy(){
  const a = document.activeElement;
  const typing = a && a !== document.body && ((a.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit)$/.test(a.type)) || a.tagName === 'TEXTAREA' || a.isContentEditable);
  return !!typing && Date.now() - LIVE.typedAt < 5000;
}
function liveQueue(keys, src){ keys.forEach(k => LIVE.q.add(k)); LIVE.qSrc = src || LIVE.qSrc; liveFlush(); }
function liveFlush(){
  clearTimeout(LIVE.qT);
  if (!LIVE.q.size) return;
  if (liveBusy()){ LIVE.qT = setTimeout(liveFlush, 1200); return; }      // never pull the text out from under your fingers
  const keys = [...LIVE.q], src = LIVE.qSrc; LIVE.q.clear(); LIVE.qSrc = '';
  LIVE_APPLYING = true;
  try { liveApplyKeys(keys); } catch (e) {} finally { LIVE_APPLYING = false; }
  LIVE.inAt = Date.now();
  try { toast(t(src === 'cloud' ? 'lv_gotDev' : 'lv_gotWin')); } catch (e) {}
  lvRender();
}
var LV_DEFK = ['fee', 'pens', 'study', 'erPens', 'erSev', 'erStudy', 'loanRate', 'invRate', 'cpi', 'infl', 'gainTax', 'dealer', 'buyer', 'dtax', 'deptime', 'capkind'];
function liveApplyKeys(keys){
  const has = k => keys.includes(k);
  if (has('fin-set')){
    let sv = {}; try { sv = JSON.parse(LS.getItem('fin-set') || '{}') || {}; } catch (e) {}
    const old = SET;
    SET = Object.assign(cloneDef(), sv); SET.prof = Object.assign({}, SET_DEF.prof, sv.prof || {});
    const ch = Object.keys(Object.assign({}, old, SET)).filter(k => JSON.stringify(old[k]) !== JSON.stringify(SET[k]));
    try { applyTheme(); } catch (e) {}
    try { if (typeof applySize === 'function') applySize(); } catch (e) {}
    if (ch.some(k => LV_DEFK.includes(k))) try { applyDefaults(); } catch (e) {}
    if (ch.some(k => ['order', 'hidden', 'pins', 'sort', 'favCur'].includes(k))) try { rebuildNav(); } catch (e) {}
    if (ch.includes('autoRef')) try { schedRef(); } catch (e) {}
    if (ch.includes('figOv') && typeof figApply === 'function') figApply(false);
    [typeof lcRender === 'function' && lcRender, typeof spRender === 'function' && spRender, typeof joRender === 'function' && joRender,
     typeof upRender === 'function' && upRender, typeof seRender === 'function' && seRender, typeof fgRender === 'function' && fgRender].forEach(f => { if (f) try { f(); } catch (e) {} });
  }
  if (has('fin-lang')){ const l = LS.getItem('fin-lang'); if (l && l !== lang && LANG_LIST.some(x => x[0] === l)) lang = l; }
  if (has('fin-cur')){ const c = LS.getItem('fin-cur'); if (c && RATES[c] && c !== baseCur) try { setBase(c); } catch (e) {} }
  if (has('fin-scn')){ try { SCN = JSON.parse(LS.getItem('fin-scn') || '{}') || {}; } catch (e) {} }
  if (has('fin-vals') && SET.remember === '1'){
    let o = {}; try { o = JSON.parse(LS.getItem('fin-vals') || '{}') || {}; } catch (e) {}
    TOUCHED = String(o.__touched || '').split(',').filter(x => TABS.includes(x)); delete o.__touched;
    const a = document.activeElement; if (a && a.id && o[a.id] != null && liveBusy()) delete o[a.id];
    try { setVals(o); } catch (e) {}
  }
  if (has('fin-exp')){ EXP = null; if (tab === 'expenses') try { expRender(); } catch (e) {} }
  if (has('fin-clients')){ CL = null; if (tab === 'clients') try { clRender(); } catch (e) {} }
  if (has('fin-set') || has('fin-lang') || has('fin-cur') || has('fin-vals') || has('fin-scn')){ try { applyLang(true); } catch (e) { try { calc(tab); } catch (e2) {} } }
}
/* same device, guest: plain storage events */
window.addEventListener('storage', e => {
  try {
    if (!e.key) return;
    if (!FUSER){ if (DATA_KEYS.includes(e.key) && e.key !== 'fin-tab') liveQueue([e.key], 'tab'); return; }
    if (e.key === encName(FUSER) && e.newValue) liveFromBlob(e.newValue, 'tab');
    else if (e.key === accKey(FUSER) && e.newValue){
      const r = JSON.parse(e.newValue || 'null');
      if (r && LIVE.hash0 && r.hash !== LIVE.hash0) livePwMoved(null);     // the password changed in another window
    }
  } catch (err) {}
});
async function liveKey(){
  const ek = SS.getItem('fin-ek'); if (!ek) return null;
  if (LIVE.keyFor !== ek){ LIVE.key = await crypto.subtle.importKey('raw', u8(ek), 'AES-GCM', false, ['decrypt']); LIVE.keyFor = ek; }
  return LIVE.key;
}
async function liveFromBlob(str, src, at){
  let blob; try { blob = typeof str === 'string' ? JSON.parse(str) : str; } catch (e) { return false; }
  if (!blob || !blob.ct || blob.by === LIVE_ID) return false;
  let map;
  try { const key = await liveKey(); if (!key) return false; map = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(blob.iv)}, key, u8(blob.ct)))); }
  catch (e) { LIVE.err = 'key'; lvRender(); return false; }
  LIVE.err = '';
  liveMerge(map, src);
  return true;
}
function liveMerge(map, src){
  let lts = {}, rts = {};
  try { lts = JSON.parse(SS.getItem(WK('__ts')) || '{}') || {}; } catch (e) {}
  try { rts = JSON.parse(map.__ts || '{}') || {}; } catch (e) {}
  const changed = []; let mine = false;
  DATA_KEYS.forEach(k => {
    if (k === 'fin-tab') return;                              // each window keeps its own screen
    const rv = map[k], lv = SS.getItem(WK(k));
    if (rv === lv) return;
    const rt = +rts[k] || 0, lt = +lts[k] || 0;
    if (rv == null){ if (lv != null) mine = true; return; }
    if (rt >= lt){ SS.setItem(WK(k), rv); lts[k] = rt; changed.push(k); }
    else mine = true;                                          // what this window changed is newer
  });
  if (changed.length || mine) SS.setItem(WK('__ts'), JSON.stringify(lts));
  if (changed.length) liveQueue(changed, src);
  if (mine){ LIVE_FORCE = true; persistSoon(); }
  else if (changed.length && src === 'cloud') persistNow0();   // keep this device's sealed copy current, without echoing back
}
/* other devices: your private, encrypted copy in the cloud (inside Claude) */
async function liveCloudStart(){
  if (LIVE.started || !FUSER || !IN_CLAUDE) return;
  LIVE.started = true;
  if (!(await mvCloudInit())){ lvRender(); return; }
  try { await liveFromCloud(await mvDoc(FUSER).get()); } catch (e) {}
  if (LIVE.pulled && !LIVE.cloudSeen) mvCloudSave();           // first time: put this device's copy there
  try { mvDoc(FUSER).onSnapshot(d => { liveFromCloud(d); }, () => {}); } catch (e) {}
  lvRender();
}
async function liveFromCloud(d){
  if (!d) return;
  LIVE.pulled = true;                                          // this device has seen the cloud copy, so it may now send its own
  if (!d.exists) return;
  const x = d.data() || {}; LIVE.cloudSeen = true;
  if (x.by === LIVE_ID || !(+x.at > LIVE.cloudAt)) return;
  LIVE.cloudAt = +x.at;
  const pkg = mvParse(x.p); if (!pkg || hdNorm(pkg.name) !== hdNorm(FUSER)) return;
  const loc = getAcc(FUSER) || {};
  if (pkg.rec && pkg.rec.hash !== loc.hash){
    if ((+pkg.rec.pwAt || 0) > (+loc.pwAt || 0)) return livePwMoved(pkg);
    return;                                                    // this device holds the newer password; it reaches the cloud next save
  }
  if (pkg.rec){ let add = false; Object.keys(pkg.rec).forEach(k => { if (loc[k] == null && pkg.rec[k] != null){ loc[k] = pkg.rec[k]; add = true; } }); if (add) try { RAWLS.setItem(accKey(FUSER), JSON.stringify(loc)); } catch (e) {} }
  await liveFromBlob(pkg.enc, 'cloud', +pkg.at || +x.at);
}
function livePwMoved(pkg){
  if (pkg){ try { RAWLS.setItem(accKey(pkg.name), JSON.stringify(pkg.rec)); RAWLS.setItem(encName(pkg.name), JSON.stringify(pkg.enc)); } catch (e) {} }
  try { SS.setItem('fin-pwmoved', '1'); } catch (e) {}
  clearSession(); try { location.reload(); } catch (e) {}
}
try { if (SS.getItem('fin-pwmoved')){ SS.removeItem('fin-pwmoved'); setTimeout(() => { try { toast(t('lv_pwMoved')); accMsg('lv_pwMoved'); } catch (e) {} }, 900); } } catch (e) {}
/* changing the password stamps the time, so other devices know which one is newer */
const doChangeLv = doChange;
doChange = async function(){
  const h0 = (getAcc(FUSER) || {}).hash;
  const r = await doChangeLv.apply(this, arguments);
  const rec = getAcc(FUSER);
  if (rec && rec.hash !== h0){ rec.pwAt = Date.now(); try { RAWLS.setItem(accKey(FUSER), JSON.stringify(rec)); } catch (e) {} LIVE.hash0 = rec.hash; LIVE.key = null; LIVE_FORCE = true; persistNow(); }
  return r;
};
async function liveNow(){
  LIVE_FORCE = true;
  try { await persistNow0(); } catch (e) {}
  if (FUSER && IN_CLAUDE){ MV.sig = ''; try { await mvCloudSave(); const d = await mvDoc(FUSER).get(); LIVE.cloudAt = 0; await liveFromCloud(d); } catch (e) {} }
  else if (!FUSER){ LIVE.outAt = Date.now(); }
  LIVE.outAt = LIVE.outAt || Date.now();
  lvRender(); toast(t('lv_done'));
}
function lvAgo(ts){ return ts ? (typeof secAgo === 'function' ? secAgo(ts) : new Date(ts).toLocaleTimeString()) : t('lv_never'); }
function lvRender(){
  const box = $('#lv_box'); if (!box) return;
  const m = liveMode(), on = m !== 'cloud' || MV.ok;
  const msg = m === 'cloud' ? t('lv_cloud', {u: '@' + FUSER}) : m === 'tabs' ? t(IN_CLAUDE ? 'lv_tabsIn' : 'lv_tabs') : t('lv_local');
  let h = `<div class="lv-head"><span class="lv-pill ${on ? 'on' : ''}"><i></i>${asEsc(t(on ? 'lv_live' : 'lv_wait'))}</span><b>${asEsc(t(m === 'cloud' ? 'lv_tCloud' : m === 'tabs' ? 'lv_tTabs' : 'lv_tLocal'))}</b></div>`;
  h += `<p class="fine lv-msg">${asEsc(msg)}</p>`;
  if (LIVE.err === 'key') h += `<p class="warn">${asEsc(t('lv_keyErr'))}</p>`;
  h += `<dl class="lv-rows"><div><dt>${asEsc(t('lv_in'))}</dt><dd>${asEsc(lvAgo(LIVE.inAt))}</dd></div>${FUSER ? `<div><dt>${asEsc(t('lv_out'))}</dt><dd>${asEsc(lvAgo(LIVE.outAt))}</dd></div>` : ''}</dl>`;
  h += `<p class="fine">${asEsc(t('lv_what'))}</p>`;
  if (SET.remember !== '1') h += `<div class="lv-rem"><span>${asEsc(t('lv_remOff'))}</span><button type="button" class="mv wide" id="lv_rem">${asEsc(t('lv_remOn'))}</button></div>`;
  h += `<div class="btnrow">${FUSER ? `<button type="button" class="mv wide" id="lv_now">${asEsc(t('lv_now'))}</button>` : `<button type="button" class="mv wide" id="lv_acc">${asEsc(t('lv_toAcc'))}</button>`}</div>`;
  box.innerHTML = h;
}
document.addEventListener('click', e => {
  if (e.target.closest('#lv_now')) liveNow();
  else if (e.target.closest('#lv_rem')){ SET.remember = '1'; saveSet(); saveVals(); const s = $('#set_remember'); if (s) s.value = '1'; lvRender(); toast(t('lv_remDone')); }
  else if (e.target.closest('#lv_acc')){ const top = $('.set-sec[data-sk="set_account"]'); if (top) top.scrollIntoView({behavior: 'smooth', block: 'start'}); }
});
setInterval(() => { if (tab === 'settings' && !document.hidden) lvRender(); }, 20000);
lvRender();

/* ================= system figures: official values update live, and you can change any of them for yourself ================= */
var FG_LIST = [], FG_BY = {}, FG_BUILT = {}, FG_OFF = {}, FG_SRC = {src: 'built', at: 0, n: 0}, FG_MARKET = ['boi', 'cpi'];
function fgAdd(id, g, u, get, set, lab, p){ const f = {id, g, u, get, set, lab: lab || 'fg_' + id, p}; FG_LIST.push(f); FG_BY[id] = f; }
for (let i = 0; i < 5; i++) fgAdd('tb' + (i + 1), 'tax', 'm', () => TAX.brackets[i][0] / 12, v => { TAX.brackets[i][0] = v * 12; }, 'fg_tb', {n: i + 1});
for (let i = 0; i < 6; i++) fgAdd('tr' + (i + 1), 'tax', 'p', () => TAX.brackets[i][1] * 100, v => { TAX.brackets[i][1] = v / 100; }, 'fg_tr', {n: i + 1});
fgAdd('point', 'tax', 'm', () => TAX.point / 12, v => { TAX.point = v * 12; });
fgAdd('pensCr', 'tax', 'p', () => TAX.pensCreditRate * 100, v => { TAX.pensCreditRate = v / 100; });
fgAdd('pensDep', 'tax', 'p', () => TAX.pensDepRate * 100, v => { TAX.pensDepRate = v / 100; });
fgAdd('pensCap', 'tax', 'm', () => TAX.pensSalaryCap, v => { TAX.pensSalaryCap = v; });
fgAdd('surFrom', 'tax', 'y', () => TAX.surtaxFrom, v => { TAX.surtaxFrom = v; });
fgAdd('surRate', 'tax', 'p', () => TAX.surtaxRate * 100, v => { TAX.surtaxRate = v / 100; });
[['niCut', 'm'], ['niMax', 'm']].forEach(([k, u]) => fgAdd(k, 'ni', u, () => TAX[k], v => { TAX[k] = v; }));
['niLow', 'niHigh', 'hLow', 'hHigh', 'erNiLow', 'erNiHigh'].forEach(k => fgAdd(k, 'ni', 'p', () => TAX[k] * 100, v => { TAX[k] = v / 100; }));
if (typeof IL26 === 'object'){
  [['minHour', 'h'], ['hishCap', 'm'], ['hishSelfCap', 'y'], ['hishSelfCG', 'y'], ['childDep', 'm'], ['unMax1', 'd'], ['unMax2', 'd'], ['matMaxDay', 'd']].forEach(([k, u]) => fgAdd(k, 'work', u, () => IL26[k], v => { IL26[k] = v; }));
  fgAdd('hishErMax', 'work', 'p', () => IL26.hishErMax * 100, v => { IL26.hishErMax = v / 100; });
  fgAdd('carPct', 'car', 'p', () => IL26.carPct * 100, v => { IL26.carPct = v / 100; });
  fgAdd('carCap', 'car', 'i', () => IL26.carCap, v => { IL26.carCap = v; });
  [['carHy', 'hybrid'], ['carPl', 'plugin'], ['carEv', 'ev']].forEach(([id, k]) => fgAdd(id, 'car', 'm', () => IL26.carDed[k], v => { IL26.carDed[k] = v; }));
  fgAdd('vat', 'market', 'p', () => IL26.vat * 100, v => { IL26.vat = v / 100; });
}
fgAdd('boi', 'market', 'p', () => MKT.boi, v => { MKT.boi = v; });
fgAdd('prime', 'market', 'p', () => PRIME_SPREAD, v => { PRIME_SPREAD = v; });
fgAdd('cpi', 'market', 'p', () => MKT.cpi, v => { MKT.cpi = v; });
var FG_GROUPS = ['tax', 'ni', 'work', 'car', 'market'];
const fgR = x => Math.round(x * 1e6) / 1e6;
FG_LIST.forEach(f => { FG_BUILT[f.id] = FG_OFF[f.id] = fgR(f.get()); });
function fgOv(){ return liveOwner() && SET.figOv && typeof SET.figOv === 'object' ? SET.figOv : {}; }
function fgOvCount(){ const o = fgOv(); return Object.keys(o).filter(k => FG_BY[k] && isFinite(+o[k])).length; }
function figApply(recalc){
  const ov = fgOv();
  FG_LIST.forEach(f => { const v = ov[f.id] != null && isFinite(+ov[f.id]) ? +ov[f.id] : FG_OFF[f.id]; if (isFinite(v)) try { f.set(v); } catch (e) {} });
  if (recalc !== false){ try { if (tab === 'home' && typeof renderMarket === 'function') renderMarket(); else if (tab !== 'settings') calc(tab); } catch (e) {} }
  fgRender();
}
/* official values: built in, then refreshed live (the app owner's updates, Bank of Israel and CPI) */
function figOfficialSet(d, src){
  FG_LIST.forEach(f => { if (!FG_MARKET.includes(f.id)) FG_OFF[f.id] = FG_BUILT[f.id]; });
  const v = d && d.v && typeof d.v === 'object' ? d.v : {};
  let n = 0;
  Object.keys(v).forEach(id => { if (FG_BY[id] && !FG_MARKET.includes(id) && isFinite(+v[id]) && +v[id] >= 0){ FG_OFF[id] = +v[id]; n++; } });
  FG_SRC = {src: n ? src : 'built', at: +(d && d.asOf) || 0, n};
  figApply(true);
}
const applyMacroFg = applyMacro;
applyMacro = function(d){
  MKT.boi = FG_OFF.boi; MKT.cpi = FG_OFF.cpi;                 // let the official feed see the official numbers
  const r = applyMacroFg.apply(this, arguments);
  FG_OFF.boi = fgR(+MKT.boi); FG_OFF.cpi = fgR(+MKT.cpi);
  figApply(true);
  return r;
};
(async () => {
  if (!IN_CLAUDE) return;
  try { const db = await window.claude.use('db'); if (!db) return; FG_DB = db;
    db.doc('rates/figures').onSnapshot(s => { figOfficialSet(s && s.exists ? s.data() : null, 'db'); }, () => {}); } catch (e) {}
})();
var FG_DB = null, FG_SITE_AT = 0;
async function figSite(){
  if (IN_CLAUDE) return;
  try { const r = await fetch('figures.json?s=' + RJ_SLOT(), {cache: 'no-store'}); if (!r.ok) return; const d = await r.json(); FG_SITE_AT = Date.now(); if (d && typeof d === 'object') figOfficialSet(d, 'site'); } catch (e) {}
}
setTimeout(figSite, 1500);
rjEvery(figSite);
/* calculators that rely on these figures say so when you changed any */
var FG_SKIP = ['home', 'settings', 'convert', 'percent', 'expenses', 'clients', 'split', 'discount', 'unitprice', 'workdays', 'appliance', 'compound', 'yield', 'dividends', 'evfuel'];
const showFg = show;
show = function(id, res){
  const n = fgOvCount();
  if (n && res && !FG_SKIP.includes(id)) res = Object.assign({}, res, {warn: (res.warn || []).concat(t('fg_warn', {n}))});
  return showFg.call(this, id, res);
};
function fgFmt(x){ return isFinite(x) ? N(x, null, 4) : '—'; }
function fgUnit(u){ return u === 'p' ? '%' : u === 'i' ? '₪' : t('fg_u_' + u); }
function fgVal(f, x){ return fgFmt(x) + (f.u === 'p' ? '%' : ' ' + fgUnit(f.u)); }
var FG_OPEN = {};
function fgRender(){
  const box = $('#fg_box'); if (!box) return;
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;   // don't redraw under your cursor
  const ov = fgOv(), n = fgOvCount();
  const srcTxt = FG_SRC.src === 'built' ? t('fg_srcBuilt') : t('fg_srcLive') + (FG_SRC.at ? ' · ' + lvAgo(FG_SRC.at) : '');
  let h = `<div class="lv-head"><span class="lv-pill on"><i></i>${asEsc(t('lv_live'))}</span><b>${asEsc(n ? t('fg_nOv', {n}) : t('fg_none'))}</b></div>`;
  h += `<p class="fine">${asEsc(t('fg_intro'))}</p><p class="fine fg-src">${asEsc(t('fg_src', {s: srcTxt}))} · ${asEsc(t('fg_boiSrc'))}</p>`;
  if (n) h += `<div class="btnrow"><button type="button" class="mv wide" id="fg_resetAll">${asEsc(t('fg_resetAll'))}</button></div>`;
  FG_GROUPS.forEach(g => {
    const items = FG_LIST.filter(f => f.g === g); if (!items.length) return;
    const gn = items.filter(f => ov[f.id] != null).length;
    h += `<details class="fg-g" data-fgg="${g}"${FG_OPEN[g] ? ' open' : ''}><summary><span>${asEsc(t('fg_g_' + g))}</span>${gn ? `<span class="fg-n">${asEsc(t('fg_gN', {n: gn}))}</span>` : ''}</summary><div class="fg-list">`;
    items.forEach(f => {
      const mine = ov[f.id] != null && isFinite(+ov[f.id]), cur = mine ? +ov[f.id] : FG_OFF[f.id];
      h += `<div class="fg-row${mine ? ' mine' : ''}" data-fg="${f.id}"><label for="fg_${f.id}">${asEsc(t(f.lab, f.p))}</label>
        <div class="fg-in"><input id="fg_${f.id}" data-fgi="${f.id}" inputmode="decimal" autocomplete="off" value="${asEsc(String(fgR(cur)))}"><span class="u">${asEsc(fgUnit(f.u))}</span></div>
        <small class="fg-sub"><span>${asEsc(t('fg_off', {v: fgVal(f, FG_OFF[f.id])}))}</span>${mine ? `<b class="fg-tag">${asEsc(t('fg_mine'))}</b><button type="button" class="fg-x" data-fgx="${f.id}">↺ ${asEsc(t('fg_back'))}</button>` : ''}</small>
        <small class="fg-err" id="fge_${f.id}" hidden></small></div>`;
    });
    h += '</div></details>';
  });
  if (IN_CLAUDE && typeof PERM !== 'undefined' && PERM === 'owner' && liveOwner()){
    h += `<div class="fg-own"><b>${asEsc(t('fg_ownT'))}</b><p class="fine">${asEsc(t('fg_pubS'))}</p><div class="btnrow"><button type="button" class="gold-btn" id="fg_pub">${asEsc(t('fg_pub'))}</button>${FG_SRC.n ? `<button type="button" class="mv wide" id="fg_unpub">${asEsc(t('fg_unpub'))}</button>` : ''}</div><p class="fine" id="fg_pubMsg"></p></div>`;
  }
  box.innerHTML = h;
}
function fgCheck(f, v){
  if (!isFinite(v) || v < 0 || (f.u === 'p' && v > 100)) return 'fg_bad';
  const m = /^tb(\d)$/.exec(f.id);
  if (m){ const i = +m[1], prev = i > 1 ? FG_BY['tb' + (i - 1)].get() : 0, next = i < 5 ? FG_BY['tb' + (i + 1)].get() : Infinity; if (!(v > prev && v < next)) return 'fg_badOrder'; }
  return '';
}
var FG_T = null;
document.addEventListener('input', e => {
  const inp = e.target.closest && e.target.closest('[data-fgi]'); if (!inp) return;
  clearTimeout(FG_T);
  FG_T = setTimeout(() => {
    const f = FG_BY[inp.dataset.fgi]; if (!f) return;
    const raw = String(inp.value).replace(/[^\d.,-]/g, '').replace(',', '.'), v = parseFloat(raw), er = $('#fge_' + f.id);
    const bad = raw === '' ? '' : fgCheck(f, v);
    if (er){ er.hidden = !bad; er.textContent = bad ? t(bad) : ''; }
    if (bad || raw === '') return;
    const ov = Object.assign({}, fgOv());
    if (Math.abs(v - FG_OFF[f.id]) < 1e-9) delete ov[f.id]; else ov[f.id] = fgR(v);
    SET.figOv = ov; saveSet(); figApply(false);
    const row = inp.closest('.fg-row'); if (row) row.classList.toggle('mine', ov[f.id] != null);
  }, 450);
});
document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('[data-fgi]')) setTimeout(() => { if (!$('#fg_box') || !$('#fg_box').contains(document.activeElement)) fgRender(); }, 600); }, true);
document.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('fg-g')) FG_OPEN[d.dataset.fgg] = d.open; }, true);
document.addEventListener('click', async e => {
  const x = e.target.closest('[data-fgx]');
  if (x){ const ov = Object.assign({}, fgOv()); delete ov[x.dataset.fgx]; SET.figOv = ov; saveSet(); figApply(false); return; }
  if (e.target.closest('#fg_resetAll')){ SET.figOv = {}; saveSet(); figApply(false); toast(t('fg_resetDone')); return; }
  const pb = e.target.closest('#fg_pub, #fg_unpub');
  if (pb){
    if (!pb.dataset.sure){ pb.dataset.sure = '1'; pb.textContent = t('fg_pubSure'); return; }
    const msg = $('#fg_pubMsg'), un = pb.id === 'fg_unpub';
    try {
      if (!FG_DB) FG_DB = await window.claude.use('db');
      const v = {};
      if (!un) FG_LIST.forEach(f => { if (FG_MARKET.includes(f.id)) return; const cur = fgR(f.get()); if (Math.abs(cur - FG_BUILT[f.id]) > 1e-9) v[f.id] = cur; });
      await FG_DB.doc('rates/figures').set({v, asOf: Date.now()});
      const ov = Object.assign({}, fgOv()); Object.keys(ov).forEach(k => { if (!FG_MARKET.includes(k)) delete ov[k]; }); SET.figOv = ov; saveSet();
      toast(t(un ? 'fg_unpubOk' : 'fg_pubOk'));
    } catch (err) { if (msg) msg.textContent = t('fg_pubErr'); }
  }
});
['#set_reset', '#set_import', '#set_clear'].forEach(sel => document.addEventListener('click', e => { if (e.target.closest(sel)) setTimeout(() => figApply(true), 50); }));
const _alFg = applyLang;
applyLang = function(){ const r = _alFg.apply(this, arguments); fgRender(); lvRender(); return r; };
figApply(true);

/* ================= live indices: official price indices and market indices, used across the app and editable ================= */
var IX_BUILT = __IX_BUILT__;
var IX = {idx: Object.assign({}, (IX_BUILT && IX_BUILT.idx) || {}), mkt: Object.assign({}, ((IX_BUILT && IX_BUILT.mkt) || {}).items || {}), src: 'built', at: 0};
var IX_MK = ['ta35', 'ta125', 'spx', 'ndx', 'dji', 'ixic', 'rut', 'vix', 'dxy', 'tsx', 'ipc', 'bovespa', 'ftse', 'dax', 'stoxx', 'cac', 'ibex', 'ftmib', 'aex', 'smi', 'nikkei', 'hsi', 'ssec', 'kospi', 'nifty', 'asx', 'gold', 'silver', 'platinum', 'palladium', 'copper', 'brent', 'wti', 'natgas', 'gasoline', 'heatoil', 'wheat', 'corn', 'soy', 'coffee', 'sugar', 'cocoa', 'cotton'], IX_COM = ['gold', 'silver', 'platinum', 'palladium', 'copper', 'brent', 'wti', 'natgas', 'gasoline', 'heatoil', 'wheat', 'corn', 'soy', 'coffee', 'sugar', 'cocoa', 'cotton'], IX_CENT = ['wheat', 'corn', 'soy', 'coffee', 'sugar', 'cotton'], IX_DEF = ['ta35', 'ta125', 'spx', 'ndx', 'dji', 'ixic', 'rut', 'vix', 'ftse', 'dax', 'stoxx', 'nikkei', 'gold', 'silver', 'platinum', 'copper', 'brent', 'wti', 'natgas'], IX_RET = ['ta125', 'ta35', 'spx', 'ndx', 'dji', 'gold'];
var IX_SYM = {ta35: '.TA35', ta125: '.TA125', spx: '.SPX', ndx: '.NDX', dji: '.DJI', ixic: '.IXIC', rut: '.RUT', vix: '.VIX', ftse: '.FTSE', dax: '.GDAXI', stoxx: '.STOXX50E', nikkei: '.N225',
  gold: '@GC.1', silver: '@SI.1', platinum: '@PL.1', copper: '@HG.1', brent: '@LCO.1', wti: '@CL.1', natgas: '@NG.1',
  dxy: '.DXY', tsx: '.GSPTSE', ipc: '.MXX', bovespa: '.BVSP', cac: '.FCHI', ibex: '.IBEX', ftmib: '.FTMIB', aex: '.AEX', smi: '.SSMI', hsi: '.HSI', ssec: '.SSEC', kospi: '.KS11', nifty: '.NSEI', asx: '.AXJO',
  palladium: '@PA.1', gasoline: '@RB.1', heatoil: '@HO.1', wheat: '@W.1', corn: '@C.1', soy: '@S.1', coffee: '@KC.1', sugar: '@SB.1', cocoa: '@CC.1', cotton: '@CT.1'};
/* price with its unit: $ for most commodities, ¢ for grains and softs quoted in cents */
function ixFmtV(k, x){ if (!isFinite(x)) return '—'; const n = N(x, null, x >= 1000 ? 0 : 2); return IX_CENT.includes(k) ? n + '¢' : (IX_COM.includes(k) ? '$' + n : n); }
/* 12.9: your own stocks, currencies and crypto, added by symbol; they live in IX_MK / IX_SYM like the built-in ones */
var IX_USER = [];
function ixUserList(){ return Array.isArray(SET.ixCustom) ? SET.ixCustom.filter(c => c && c.k && c.sym) : []; }
function ixUserSync(){
  const L = ixUserList(), keys = L.map(c => c.k);
  IX_USER.filter(k => !keys.includes(k)).forEach(k => { const i = IX_MK.indexOf(k); if (i >= 0) IX_MK.splice(i, 1); delete IX_SYM[k]; try { delete IX.mkt[k]; } catch (e) {} });
  L.slice().reverse().forEach(c => { if (!IX_MK.includes(c.k)) IX_MK.unshift(c.k); IX_SYM[c.k] = c.sym; T['ix_' + c.k] = [c.n, c.n, c.n]; });
  IX_USER = keys;
}
const ixUser = k => ixUserList().find(c => c.k === k);
const _ixFmtV129 = ixFmtV;
ixFmtV = function(k, x){ const u = ixUser(k); if (!u || !isFinite(x)) return _ixFmtV129(k, x); const n = N(x, null, x >= 1000 ? 0 : x >= 1 ? 2 : 5), c = String(u.cur || '').toUpperCase(); return c === 'USD' ? '$' + n : c === 'ILS' ? '₪' + n : c === 'EUR' ? '€' + n : c ? n + ' ' + c : n; };
function ixShown(){ ixUserSync(); const v = String(SET.ixShow || '').split(',').filter(k => IX_MK.includes(k)); return v.length ? v : IX_USER.concat(IX_DEF); }
var IXE = {};
function ixOffVal(id){
  const c = IX.idx.cpi, b = IX.idx.build, h = IX.idx.house;
  if (id === 'cpiLvl') return c && c.v; if (id === 'buildLvl') return b && b.v; if (id === 'buildYoy') return b && b.yoy; if (id === 'houseYoy') return h && h.yoy;
  const m = /^(\w+)R$/.exec(id); if (m && IX.mkt[m[1]]) return IX.mkt[m[1]].r10;
  return NaN;
}
['cpiLvl', 'buildLvl', 'buildYoy', 'houseYoy'].forEach(id => fgAdd(id, 'idx', /Lvl$/.test(id) ? 'pt' : 'p', () => IXE[id], v => { IXE[id] = v; }));
IX_RET.forEach(k => fgAdd(k + 'R', 'mk', 'p', () => IXE[k + 'R'], v => { IXE[k + 'R'] = v; }, 'fg_mkR', {n: ''}));
FG_GROUPS.push('idx', 'mk');
FG_LIST.forEach(f => { if (f.g === 'idx' || f.g === 'mk'){ const v = fgR(+ixOffVal(f.id)); IXE[f.id] = v; FG_BUILT[f.id] = FG_OFF[f.id] = v; FG_MARKET.push(f.id); } });
function ixName(k){ return t('ix_' + k); }
const ixSg = x => '\u2066' + sgnPC(x) + '\u2069';
FG_LIST.forEach(f => { if (f.g === 'mk') f.p = {get n(){ return ixName(f.id.slice(0, -1)); }}; });
function ixEff(id){ const f = FG_BY[id]; return f ? +f.get() : NaN; }
/* the month-by-month series behind the linkage calculator; your own latest value replaces the official one */
function ixSeries(k){
  const s = (IX.idx[k] && Array.isArray(IX.idx[k].hist)) ? IX.idx[k].hist.map(x => [x[0], +x[1]]) : [];
  const ov = fgOv()[k + 'Lvl'];
  if (s.length && ov != null && isFinite(+ov) && (k === 'cpi' || k === 'build')) s[s.length - 1] = [s[s.length - 1][0], +ov];
  return s;
}
function ixRet(it){
  const out = {}, a = it.a || {}, p = it.p, now = it.t || Date.now() / 1000;
  [['y1', 'y1', 1], ['r5', 'y5', 5], ['r10', 'y10', 10]].forEach(([k, ak, yrs]) => {
    const x = a[ak]; if (!x || !(x[1] > 0) || !(p > 0)) return;
    const n = Math.max(0.5, (now - x[0]) / (365.25 * 86400));
    out[k] = Math.round((k === 'y1' ? (p / x[1] - 1) * 100 : (Math.pow(p / x[1], 1 / n) - 1) * 100) * 100) / 100;
  });
  if (a.ye && a.ye[1] > 0 && p > 0) out.ytd = Math.round((p / a.ye[1] - 1) * 10000) / 100;
  return out;
}
function ixOfficial(recalc){
  let ch = false;
  FG_LIST.forEach(f => { if (f.g !== 'idx' && f.g !== 'mk') return; const v = fgR(+ixOffVal(f.id)); if (isFinite(v) && Math.abs(v - (FG_OFF[f.id] || 0)) > 1e-9){ FG_OFF[f.id] = v; ch = true; } });
  if (ch) figApply(recalc !== false); else { if (tab === 'home') try { renderMarket(); } catch (e) {} }
}
function ixApply(d, src){
  if (!d || typeof d !== 'object') return;
  let ch = false;
  const idx = d.idx || {};
  ['cpi', 'build', 'house'].forEach(k => { const n = idx[k], o = IX.idx[k]; if (n && +n.v > 0 && n.m && Array.isArray(n.hist) && n.hist.length > 1 && (!o || n.m >= o.m)){ if (!o || JSON.stringify(o) !== JSON.stringify(n)){ IX.idx[k] = n; ch = true; } } });
  const items = (d.mkt && d.mkt.items) || {};
  Object.keys(items).forEach(k => { const n = items[k], o = IX.mkt[k]; if (IX_SYM[k] && n && +n.p > 0 && (!o || (+n.t || 0) >= (+o.t || 0) || !o.a)){ IX.mkt[k] = Object.assign({}, o || {}, n, o && o.live && (+o.t || 0) > (+n.t || 0) ? {p: o.p, pc: o.pc, chp: o.chp, t: o.t, live: true} : {}); ch = true; } });
  if (ch){ IX.src = src || IX.src; IX.at = Date.now(); ixOfficial(true); }
}
/* official data: the site's rates.json (kept fresh by the scheduled updater) and, inside Claude, the app's own database */
var IX_SITE_AT = 0;
async function ixSite(){
  if (IN_CLAUDE) return;
  IX_SITE_AT = Date.now();
  try { const x = await rjFetch('rates.json?s=' + RJ_SLOT(), {cache: 'no-store'}); if (x.ok){ const d = await x.json(); rjSeen(d); ixApply(d, 'site'); fxApplySnap(d.live); } } catch (e) {}
}
setTimeout(ixSite, 1400);
rjEvery(ixSite);
var IX_GH = SITE_BASE + 'rates.json', IX_GH_OK = null;
async function ixRemote(){
  if (!IN_CLAUDE || IX_GH_OK === false) return;
  try {
    const r = await rjFetch(IX_GH + '?s=' + RJ_SLOT(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (!r.ok) throw 0;
    const d = await r.json(); rjSeen(d); IX_GH_OK = true;
    if (d && d.usd && SET.boiDb !== '0'){ try { applyDbRates({usd: d.usd, asOf: d.asOf, crypto: d.crypto, cryptoAsOf: d.cryptoAsOf}); if (d.macro) applyMacro(Object.assign({asOf: d.asOf}, d.macro)); } catch (e) {} }
    ixApply(d, 'gh'); fxApplySnap(d.live);
  } catch (e) { IX_GH_OK = false; }
}
(async () => {
  if (!IN_CLAUDE) return;
  try { const db = await window.claude.use('db'); if (db){ IX_DB = db; db.doc('rates/indices').onSnapshot(s => { if (s && s.exists) ixApply(s.data(), 'db'); }, () => {}); db.doc('rates/live').onSnapshot(s => { if (s && s.exists) fxApplySnap(s.data()); }, () => {}); } } catch (e) {}
  setTimeout(ixRemote, 2500); rjEvery(() => { IX_GH_OK = null; ixRemote(); });
})();
/* live market quotes straight from the public quote feed while the screen is open (no account, no key, nothing sent about you) */
var IXL = {timer: null, ok: null, fails: 0, at: 0};
var FX_CN = {ILS: ['ILS=', 0], EUR: ['EUR=', 1], GBP: ['GBP=', 1], JPY: ['JPY=', 0], CHF: ['CHF=', 0], CAD: ['CAD=', 0], AUD: ['AUD=', 1], JOD: ['JOD=', 0], AED: ['AED=', 0], SAR: ['SAR=', 0], EGP: ['EGP=', 0], TRY: ['TRY=', 0], CNY: ['CNY=', 0], INR: ['INR=', 0]};
var FXL = {pin: {}, at: 0}, FXSRC = {};
const IX_QBASE = 'https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=';
const IX_QTAIL = '&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json&events=1';
function ixQurl(){ try { ixUserSync(); } catch (e) {} return IX_QBASE + IX_MK.map(k => encodeURIComponent(IX_SYM[k])).concat(Object.keys(FX_CN).map(k => encodeURIComponent(FX_CN[k][0]))).join('%7C') + IX_QTAIL; }
var IX_QURL = ixQurl();
const ixNum = x => { const n = parseFloat(String(x == null ? '' : x).replace(/[,%+\s]/g, '')); return isFinite(n) ? n : NaN; };
var IX_TABS = ['home', 'markets', 'convert', 'compound', 'yield', 'retire', 'cpilink', 'expenses'];
async function ixLiveTick(force){
  clearTimeout(IXL.timer); IXL.timer = null;
  if (!force && (SET.liveFx === '0' || IXL.ok === false)) return;
  if (!srcOk('fx', 'cnbc') && !srcOk('mkt', 'live')) return false;        // nothing to take from this feed with the sources picked now
  if (!force && (document.hidden || !IX_TABS.includes(tab) || navigator.onLine === false)){ IXL.timer = setTimeout(ixLiveTick, 20000); return; }
  let got = false;
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(ixQurl(), {signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    clearTimeout(to);
    if (!r.ok) throw new Error('http');
    const j = await r.json(), rows = (((j || {}).FormattedQuoteResult || {}).FormattedQuote) || [];
    let n = 0, nf = 0;
    rows.forEach(q => {
      const fk = Object.keys(FX_CN).find(x => FX_CN[x][0] === q.symbol);
      if (fk){
        const p = ixNum(q.last); if (!(p > 0) || SET.liveFiat === '0' || !srcOk('fx', 'cnbc')) return;
        const v = FX_CN[fk][1] ? 1 / p : p, old = RATES[fk]; if (old && (v / old < 0.8 || v / old > 1.25)) return;
        RATES[fk] = v; FXL.pin[fk] = Date.now(); FXSRC[fk] = {s: 'cnbc', at: Date.now()}; nf++; return;
      }
      const k = IX_MK.find(x => IX_SYM[x] === q.symbol); if (!k || !srcOk('mkt', 'live')) return;
      const p = ixNum(q.last), o = IX.mkt[k] || {}; if (!(p > 0) || (o.p && (p / o.p < 0.6 || p / o.p > 1.6))) return;
      const ts = Date.parse(q.last_time), it = Object.assign({}, o, {p, pc: ixNum(q.previous_day_closing), chp: ixNum(q.change_pct), t: isFinite(ts) ? Math.round(ts / 1000) : Math.round(Date.now() / 1000), rt: String(q.realTime) === 'true', live: true});
      Object.assign(it, ixRet(it)); IX.mkt[k] = it; n++;
    });
    if (nf){ RATES.USD = 1; FXL.at = Date.now(); META.live = true; META.official = false; META.mkt = false; META.unix = Math.floor(Date.now() / 1000); try { lastAt = new Date(); lastOk = true; renderStamp(); } catch (e) {} }
    if (n || nf){ got = true; IXL.ok = true; IXL.fails = 0; IXL.at = Date.now(); ixOfficial(tab !== 'home' && tab !== 'markets'); if (tab === 'home' || tab === 'markets') try { renderMarket(); } catch (e) {} else if (nf && tab === 'convert') try { calc(tab); } catch (e) {} }
  } catch (e) { IXL.fails++; if (!IXL.ok && IXL.fails >= 3) IXL.ok = false; }
  if (SET.liveFx !== '0' && IXL.ok !== false) IXL.timer = setTimeout(ixLiveTick, IXL.ok ? 15000 : 30000);
  return got;
}
setTimeout(ixLiveTick, 1800);
document.addEventListener('visibilitychange', () => { if (!document.hidden && IXL.ok !== false && Date.now() - IXL.at > 15000) ixLiveTick(); });
const activateIx = activate;
activate = function(id){ const r = activateIx.apply(this, arguments); if (IX_TABS.includes(id) && IXL.ok !== false && Date.now() - IXL.at > 15000) setTimeout(ixLiveTick, 300); return r; };
document.addEventListener('change', e => { if (e.target && e.target.id === 'fx_live') setTimeout(() => { IXL.ok = IXL.ok === false ? null : IXL.ok; ixLiveTick(); }, 300); });
/* the board on the home screen */
function ixTime(ts){ try { return new Intl.DateTimeFormat(locOf(), {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem'}).format(new Date(ts * 1000)); } catch (e) { return ''; } }
function ixDay(ts){ try { const d = new Date(ts * 1000), now = new Date(); return d.toDateString() === now.toDateString() ? ixTime(ts) : new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'short', timeZone: 'Asia/Jerusalem'}).format(d) + ' ' + ixTime(ts); } catch (e) { return ''; } }
function ixCh(x){ if (!isFinite(x)) return ''; const c = x > 0 ? 'up' : x < 0 ? 'down' : ''; return `<span class="ix-ch ${c}">${x > 0 ? '▲' : x < 0 ? '▼' : '•'} ${asEsc(sgnPC(x))}</span>`; }
function ixBoard(){
  const box = $('#hm'); if (!box) return;
  let ext = $('#hmx'); if (!ext){ ext = document.createElement('div'); ext.id = 'hmx'; ext.className = 'hmx'; box.parentNode.insertBefore(ext, box.nextSibling); }
  const card = (k, val, ch, meta, go, extra) => `<button type="button" class="mk ix-card" data-ixgo="${go}" data-ixk="${k}"${extra || ''}><span class="mk-l">${asEsc(ixName(k))}</span><b class="num">${val}</b>${ch}<small>${meta}</small></button>`;
  let h = `<h4 class="ix-g">${asEsc(t('ix_gPrice'))}</h4><div class="mkt">`;
  [['cpi', 'cpilink:cpi'], ['build', 'cpilink:build'], ['house', 'rentbuy']].forEach(([k, go]) => {
    const d = IX.idx[k]; if (!d) return;
    const meta = asEsc(lkLabel(d.m)) + ' · ' + asEsc(t('ix_yoy', {v: ixSg(+d.yoy)})) + (k === 'house' ? ' · ' + asEsc(t('ix_prov')) : '');
    h += card(k, N(+d.v, 1), ixCh(+d.mom), meta, go);
  });
  const SHOWU = ixShown().filter(k => IX_USER.includes(k));
  if (SHOWU.length){ h += `</div><h4 class="ix-g">⭐ ${asEsc(t('ix_gMine'))}</h4><div class="mkt">`;
    SHOWU.forEach(k => { const d = IX.mkt[k]; if (!d || !(d.p > 0)){ h += card(k, '…', '', asEsc(t('ix_uWait')), 'none'); return; }
      h += card(k, ixFmtV(k, d.p), ixCh(+d.chp), asEsc(ixDay(d.t)) + ' · ' + asEsc(t(d.rt ? 'ix_rt' : 'ix_delay')), 'none'); }); }
  h += `</div><h4 class="ix-g">${asEsc(t('ix_gMkt'))}${IXL.ok && srcOk('mkt', 'live') ? ` <span class="lv-pill on"><i></i>${asEsc(t('lv_live'))}</span>` : ''}</h4><div class="mkt">`;
  const SHOW = ixShown(); let comH = false;
  IX_MK.forEach((k, i) => {
    if (!SHOW.includes(k) || IX_USER.includes(k)) return;
    if (IX_COM.includes(k) && !comH){ comH = true; h += `</div><h4 class="ix-g">${asEsc(t('ix_gCom'))}</h4><div class="mkt">`; }      // indices first, then commodities
    const d = IX.mkt[k]; if (!d || !(d.p > 0)) return;
    const val = ixFmtV(k, d.p);
    const meta = asEsc(ixDay(d.t)) + ' · ' + asEsc(t(!d.live ? 'ix_snap' : d.rt ? 'ix_rt' : 'ix_delay')) + (isFinite(+d.ytd) ? ' · ' + asEsc(t('ix_ytd', {v: ixSg(+d.ytd)})) : '');
    h += card(k, val, ixCh(+d.chp), meta, IX_RET.includes(k) ? 'compound:' + k : 'none');
  });
  h += `</div>${DEV_ON === true ? `<div class="btnrow ix-pickrow"><button type="button" class="btn" id="ix_pick" aria-expanded="${IXP.open ? 'true' : 'false'}">✏️ ${asEsc(t('ix_pick'))} (${SHOW.length}/${IX_MK.length})</button></div>${IXP.open ? ixPickHTML(SHOW) : ''}` : ''}<p class="fine mkt-note">${asEsc(t('ix_note'))}${liveOwner() ? ` <button type="button" class="fg-x" id="ix_edit">${asEsc(t('ix_edit'))}</button>` : ''}</p>`;
  ext.innerHTML = h;
}
/* choose which indices and commodities the board shows (12.4) */
var IXP = {open: false};
function ixPickHTML(SHOW){
  const grp = (title, L) => `<div class="ix-pg"><b>${asEsc(t(title))}</b><div class="ix-pl">${L.map(k => `<button type="button" class="tchip${SHOW.includes(k) ? ' on' : ''}" data-ixp="${k}" aria-pressed="${SHOW.includes(k)}">${asEsc(ixName(k))}</button>`).join('')}</div></div>`;
  const mine = `<div class="ix-pg ix-mine"><b>⭐ ${asEsc(t('ix_gMine'))}</b><p class="fine">${asEsc(t('ix_uH'))}</p>
    <div class="ix-add"><input type="text" id="ix_uq" value="${asEsc(IXP.q || '')}" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="AAPL · NVDA · TEVA · EUR · BTC" aria-label="${asEsc(t('ix_uAdd'))}"><button type="button" class="gold-btn" id="ix_uadd">＋ ${asEsc(t('ix_uAdd'))}</button></div>
    <p class="fine ix-umsg" id="ix_umsg" role="status" aria-live="polite"></p>
    <div class="ix-pl">${IX_USER.map(k => `<span class="ix-uchip"><button type="button" class="tchip${SHOW.includes(k) ? ' on' : ''}" data-ixp="${k}" aria-pressed="${SHOW.includes(k)}">${asEsc(ixName(k))}</button><button type="button" class="mv ix-urm" data-ixurm="${k}" aria-label="${asEsc(t('cv_rm'))}">✕</button></span>`).join('')}</div></div>`;
  return `<div class="ix-pick" id="ix_pickbox"><p class="fine">${asEsc(t('ix_pickH'))}</p>${mine}${grp('ix_gMkt', IX_MK.filter(k => !IX_COM.includes(k) && !IX_USER.includes(k)))}${grp('ix_gCom', IX_COM)}
    <div class="btnrow"><button type="button" class="mv wide" data-ixpall="1">${asEsc(t('ix_pAll'))}</button><button type="button" class="mv wide" data-ixpdef="1">${asEsc(t('ix_pDef'))}</button><button type="button" class="gold-btn" data-ixpok="1">${asEsc(t('ix_pDone'))}</button></div></div>`;
}
/* find a symbol the live feed knows: a stock ticker as typed, a currency against the shekel (then the dollar), or a crypto coin */
async function ixUserFind(raw){
  const q = String(raw || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^\$/, '');
  if (!q || !/^[A-Z0-9.\-=^:]{1,15}$/.test(q)) return {err: 'ix_uBad'};
  const C = [], cur = /^[A-Z]{3}$/.test(q) && (typeof RATES === 'object' && (RATES[q] || q === 'USD'));
  if (cur && q !== 'ILS'){ C.push([q + 'ILS=', 'fx', q + '/ILS'], [q === 'USD' ? 'ILS=' : q + '=', 'fx', q === 'USD' ? 'USD/ILS' : q]); }
  C.push([q, 'stock', '']);
  if (/^[A-Z]{2,5}$/.test(q)) C.push([q + '.CM=', 'crypto', q]);
  let j; try { const r = await fetch(IX_QBASE + C.map(c => encodeURIComponent(c[0])).join('%7C') + IX_QTAIL, {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); j = await r.json(); } catch (e) { return {err: typeof PRIV !== 'undefined' && PRIV ? 'ix_uPriv' : 'ix_uNet'}; }
  const rows = (((j || {}).FormattedQuoteResult || {}).FormattedQuote) || [];
  for (const [sym, kind, nm] of C){
    const r = rows.find(x => x.symbol === sym); const p = r && ixNum(r.last);
    if (r && p > 0 && !r.code) return {sym, kind, n: String(r.name || r.shortName || nm || sym).slice(0, 40), cur: r.currencyCode || (kind === 'crypto' ? 'USD' : ''), p, r};
  }
  return {err: 'ix_uNone'};
}
async function ixUserAdd(){
  if (DEV_ON !== true) return;
  const inp = $('#ix_uq'), msg = $('#ix_umsg'), btn = $('#ix_uadd'); if (!inp) return;
  const L = ixUserList(); if (L.length >= 30){ if (msg) msg.textContent = t('ix_uMax'); return; }
  if (btn) btn.disabled = true; if (msg) msg.textContent = '⏳ ' + t('ix_uLook');
  const f = await ixUserFind(inp.value);
  if (btn) btn.disabled = false;
  if (f.err){ if (msg) msg.textContent = '⚠️ ' + t(f.err); return; }
  if (L.some(c => c.sym === f.sym)){ if (msg) msg.textContent = t('ix_uDup', {n: f.n}); return; }
  const k = 'u_' + f.sym.toLowerCase().replace(/[^a-z0-9]/g, '_');
  SET.ixCustom = L.concat([{k, sym: f.sym, n: f.n, cur: f.cur, kind: f.kind}]);
  if (String(SET.ixShow || '')) SET.ixShow = String(SET.ixShow) + ',' + k;
  saveSet(); ixUserSync();
  IX.mkt[k] = {p: f.p, pc: ixNum(f.r.previous_day_closing), chp: ixNum(f.r.change_pct), t: Math.round((Date.parse(f.r.last_time) || Date.now()) / 1000), rt: String(f.r.realTime) === 'true', live: true};
  const y = window.scrollY; try { ixBoard(); } catch (er) {} window.scrollTo(0, y);
  IXP.q = ''; try { ixBoard(); } catch (er) {} const m2 = $('#ix_umsg'); if (m2) m2.textContent = '✓ ' + t('ix_uOk', {n: f.n, v: ixFmtV(k, f.p)});
}
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'ix_uq' && e.key === 'Enter'){ e.preventDefault(); ixUserAdd(); } });
document.addEventListener('input', e => { if (e.target && e.target.id === 'ix_uq') IXP.q = e.target.value; }, true);
/* the board redraws itself (live prices); keep what you are typing and where the cursor is */
{
  const ixBoardKeep = ixBoard;
  ixBoard = function(){
    const a = document.activeElement, typing = a && a.id === 'ix_uq', pos = typing ? a.selectionStart : 0, msg = ($('#ix_umsg') || {}).textContent || '';
    const r = ixBoardKeep.apply(this, arguments);
    const m = $('#ix_umsg'); if (m && msg) m.textContent = msg;
    if (typing){ const i = $('#ix_uq'); if (i){ i.focus(); try { i.setSelectionRange(pos, pos); } catch (e) {} } }
    return r;
  };
}
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#ix_uadd')){ ixUserAdd(); return; }
  const rm = e.target.closest && e.target.closest('[data-ixurm]');
  if (rm && DEV_ON === true){ const k = rm.dataset.ixurm; SET.ixCustom = ixUserList().filter(c => c.k !== k); SET.ixShow = String(SET.ixShow || '').split(',').filter(x => x && x !== k).join(','); saveSet(); ixUserSync(); const y = window.scrollY; try { ixBoard(); } catch (er) {} window.scrollTo(0, y); return; }
});
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#ix_pick, [data-ixp], [data-ixpall], [data-ixpdef], [data-ixpok]'); if (!b || DEV_ON !== true) return;
  if (b.id === 'ix_pick'){ IXP.open = !IXP.open; }
  else if (b.dataset.ixp){ let S = ixShown(); const k = b.dataset.ixp; S = S.includes(k) ? S.filter(x => x !== k) : S.concat([k]); if (!S.length) return toast(t('ix_pMin')); SET.ixShow = IX_MK.filter(x => S.includes(x)).join(','); saveSet(); if (!IX.mkt[k] || !(IX.mkt[k].p > 0)) setTimeout(() => { try { ixLiveTick(true); } catch (er) {} }, 200); }
  else if (b.dataset.ixpall){ SET.ixShow = IX_MK.join(','); saveSet(); setTimeout(() => { try { ixLiveTick(true); } catch (er) {} }, 200); }
  else if (b.dataset.ixpdef){ SET.ixShow = ''; saveSet(); }
  else if (b.dataset.ixpok){ IXP.open = false; }
  const y = window.scrollY; try { ixBoard(); } catch (er) {} window.scrollTo(0, y);
  if (b.id === 'ix_pick' && IXP.open){ const box = $('#ix_pickbox'); if (box) box.scrollIntoView({block: 'nearest'}); }
});
const renderMarketIx = renderMarket;
renderMarket = function(){ const r = renderMarketIx.apply(this, arguments); try { ixBoard(); } catch (e) {} return r; };
panelsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-ixgo]');
  if (b){
    const [go, arg] = b.dataset.ixgo.split(':'); if (go === 'none') return;
    activate(go);
    setTimeout(() => {
      if (go === 'cpilink' && arg){ const s = $('#lk_idx'); if (s){ s.value = arg; const src = $('#lk_src'); if (src) src.value = 'auto'; calc('cpilink'); } }
      if (go === 'compound' && arg){ const s = $('#c_bench'); if (s){ s.value = arg; calc('compound'); } }
    }, 80);
    return;
  }
  if (e.target.closest('#ix_edit')){
    activate('settings');
    setTimeout(() => { const r = $('.sh-row[data-scat="calc"]'); if (r) r.click(); setTimeout(() => { FG_OPEN.idx = FG_OPEN.mk = true; fgRender(); const s = $('.set-sec[data-sk="set_figs"]'); if (s) s.scrollIntoView({block: 'start'}); }, 200); }, 120);
  }
});
/* investment calculators can take the long-run return of a real index (yours if you edited it) */
var IX_BENCH = {compound: ['c_bench', 'c_rate'], yield: ['y_bench', 'y_rate'], retire: ['rt_bench', 'rt_r1']};
function ixBenchSync(id){
  const b = IX_BENCH[id]; if (!b) return;
  const s = $('#' + b[0]), f = $('#' + b[1]); if (!s || !f || s.value === 'manual') return;
  const r = ixEff(s.value + 'R');
  if (isFinite(r)) { const nv = String(Math.round(r * 100) / 100); if (f.value !== nv){ f.value = nv; try { syncRanges(); } catch (e) {} } }
}
const calcIx = calc;
calc = function(id){ try { ixBenchSync(id); } catch (e) {} return calcIx.apply(this, arguments); };
panelsEl.addEventListener('input', e => {
  const id = e.target && (e.target.id || (e.target.classList && e.target.classList.contains('rng') && e.target.dataset.for)); if (!id) return;
  Object.keys(IX_BENCH).forEach(k => { const [bs, rf] = IX_BENCH[k]; if (id === rf){ const s = $('#' + bs); if (s && s.value !== 'manual'){ s.value = 'manual'; } } });
}, true);
panelsEl.addEventListener('change', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'lk_from' || el.id === 'lk_to'){ const k = el.dataset.k || 'cpi'; SET.lk = Object.assign({}, SET.lk || {}); SET.lk[k] = Object.assign({}, SET.lk[k] || {}, {[el.id === 'lk_from' ? 'from' : 'to']: el.value}); saveSet(); calc('cpilink'); }
});
/* results that depend on an index say which one and when it was published */
const showIx = show;
show = function(id, res){
  if (res && IX_BENCH[id]){ const s = $('#' + IX_BENCH[id][0]); if (s && s.value !== 'manual'){ const k = s.value, d = IX.mkt[k] || {}; const mine = fgOv()[k + 'R'] != null; res = Object.assign({}, res, {note: t('ix_benchNote', {n: ixName(k), r: PC(ixEff(k + 'R')), y1: isFinite(+d.y1) ? ixSg(+d.y1) : '—'}) + (mine ? ' ' + t('ix_benchMine') : '') + (res.note ? ' ' + res.note : '')}); } }
  return showIx.call(this, id, res);
};
const _alIx = applyLang;
applyLang = function(){ const r = _alIx.apply(this, arguments); if (tab === 'home') try { ixBoard(); } catch (e) {} return r; };
try { if (tab === 'home') ixBoard(); } catch (e) {}
ixOfficial(true);

/* ================= accurate rates: interbank quotes beat the once-a-day official rate, and one button refreshes everything ================= */
var IX_DB = null;
function fxApplySnap(L){
  if (!L || !L.usd || typeof L.usd !== 'object' || SET.boiDb === '0' || SET.liveFiat === '0') return false;
  const at = +L.asOf || 0, now = Date.now() / 1000;
  if (META.live && now - (META.unix || 0) < 180) return false;            // something fresher is already on screen
  if (!(at > (META.unix || 0))) return false;
  let n = 0;
  Object.keys(L.usd).forEach(k => { const v = +L.usd[k], old = RATES[k]; if (!/^[A-Z]{3}$/.test(k) || !(v > 0) || (old && (v / old < 0.8 || v / old > 1.25))) return; RATES[k] = v; FXSRC[k] = {s: 'snap', at: at * 1000}; n++; });
  if (!n) return false;
  RATES.USD = 1; META.unix = at; META.mkt = true; META.live = false; META.official = false;
  try { fillCurSelects(); renderStamp(); if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {}
  return true;
}
async function fxCoinbaseOnce(){
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    clearTimeout(to); if (!r.ok) return false;
    const j = await r.json(), rt = j && j.data && j.data.rates; if (!rt) return false;
    let n = 0, nc = 0;
    Object.keys(rt).forEach(k => {
      const v = parseFloat(rt[k]), old = RATES[k]; if (!(v > 0) || !old) return;
      if (FXL.pin[k] && Date.now() - FXL.pin[k] < 30000) return;
      const q = v / old, cr = !!CRYPTO[k];
      if (cr ? SET.liveCrypto === '0' : SET.liveFiat === '0') return;
      if (!srcOk(cr ? 'cr' : 'fx', 'coinbase')) return;
      if (cr ? (q < 0.5 || q > 2) : (q < 0.8 || q > 1.25)) return;
      RATES[k] = v; FXSRC[k] = {s: 'coinbase', at: Date.now()}; if (cr) nc++; else n++;
    });
    const now = Math.floor(Date.now() / 1000);
    if (n){ META.live = true; META.official = false; META.mkt = false; META.unix = now; }
    if (nc){ META.cryptoLive = true; META.cunix = now; }
    if (n + nc){ RATES.USD = 1; fxOkAt = Date.now(); return true; }
  } catch (e) {}
  return false;
}
async function rfOfficial(){
  if (IN_CLAUDE){
    try {
      const db = IX_DB || await window.claude.use('db'); if (!db) return false;
      const get = async p => { try { const x = await db.doc(p).get(); return x && x.exists ? x.data() : null; } catch (e) { return null; } };
      const [lt, mc, ix, lv, fg] = await Promise.all(['rates/latest', 'rates/macro', 'rates/indices', 'rates/live', 'rates/figures'].map(get));
      if (lt) applyDbRates(lt); if (mc) applyMacro(mc); if (ix) ixApply(ix, 'db'); if (lv) fxApplySnap(lv); if (fg) figOfficialSet(fg, 'db');
      await ixRemote();
      return !!(lt || ix || lv);
    } catch (e) { return false; }
  }
  try { await Promise.all([siteRates(), ixSite(), figSite()]); return true; } catch (e) { return false; }
}
var RF = {busy: false, at: 0};
function rfTime(d){ try { return new Intl.DateTimeFormat(locOf(), {hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(d || new Date()); } catch (e) { return ''; } }
function rfDataTime(){ const u = META.unix || 0; if (!u) return '—'; try { const d = new Date(u * 1000), same = d.toDateString() === new Date().toDateString(); return new Intl.DateTimeFormat(locOf(), same ? {hour: '2-digit', minute: '2-digit'} : {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(d); } catch (e) { return ''; } }
async function refreshEverything(manual){
  if (RF.busy) return RF.last;
  RF.busy = true;
  const btns = $$('#gRefresh, .rf-btn'); btns.forEach(b => { b.classList.add('spin'); b.setAttribute('aria-busy', 'true'); });
  const st = $('#x_status'); if (manual && st) st.textContent = t('st_loading');
  let live = false, off = false;
  try {
    const [a, b] = await Promise.all([fxCoinbaseOnce(), ixLiveTick(true).catch(() => false)]);
    live = !!(a || b);
    off = await rfOfficial();
    try { await tryLiveCrypto(); } catch (e) {}
    try { if (SET.liveFx === '1' && !fxTimer) fxTick(); } catch (e) {}
  } finally {
    RF.busy = false; RF.at = Date.now(); RF.last = live;
    btns.forEach(b => { b.classList.remove('spin'); b.removeAttribute('aria-busy'); });
  }
  try { fillCurSelects(); } catch (e) {}
  try { lastAt = new Date(); lastOk = live; renderStamp(); } catch (e) {}
  try { if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {}
  const msg = live ? t('rf_ok', {t: rfTime()}) : off ? t('rf_part', {t: rfDataTime()}) : t('rf_fail', {t: rfDataTime()});
  if (manual){ toast(msg); if (st) st.textContent = msg; }
  return live;
}
/* every refresh in the app now refreshes everything, and never labels a once-a-day rate as live */
tryLive = function(manual){ return refreshEverything(!!manual); };
document.addEventListener('click', e => { if (e.target.closest('.rf-btn')) refreshEverything(true); });

/* ================= data sources centre: for the developer only. Every number, where it comes from, when it changed and why it may lag ================= */
/* small synchronous SHA-256 (hex in, hex out) so the start-up check stays instant */
function devSha(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=Array.from(new TextEncoder().encode(String(str))), l=b.length*8; b.push(0x80); while(b.length%64!==56) b.push(0);
  for(let i=7;i>=0;i--) b.push(i>3?0:(l>>>(i*8))&255);
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const r=(x,n)=>(x>>>n)|(x<<(32-n)), w=new Array(64);
  for(let o=0;o<b.length;o+=64){
    for(let i=0;i<16;i++) w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
    for(let i=16;i<64;i++){ const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3), s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10); w[i]=(w[i-16]+s0+w[i-7]+s1)|0; }
    let [a,bb,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){ const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0, t2=((r(a,2)^r(a,13)^r(a,22))+((a&bb)^(a&c)^(bb&c)))|0; h=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0; }
    H=H.map((v,i)=>(v+[a,bb,c,d,e,f,g,h][i])|0);
  }
  return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
/* only a hash of the unlock value lives in the page; the value itself comes from the name + code and is kept on the owner's device */
var DEV_CHECK = '2ff82c4945c39ddf16442f25fdc6b3ee96b832d2ea9b26448813ba9087d1c285', DEV_ON = false;
/* 13.25: a backup code (given to the owner once, never stored in the page – only this hash) also opens developer mode, for when the code is forgotten */
var DEV_REC_CHECK = '';   // the RC- backup code is retired: the shared recovery code (below) is the way back in
/* the regular site never opens developer mode: only the admin version (/admin/, locked on the server) or the Claude app can */
var ADMIN_V = (!!window.__FIN_ADMIN__ && /(^|\.)workers\.dev$|^localhost$/.test(location.hostname) && location.pathname.indexOf('/admin/') === 0) || (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE);
const devOk = v => ADMIN_V && typeof v === 'string' && /^[0-9a-f]{64}$/.test(v) && (devSha(v) === DEV_CHECK || (!!DEV_REC_CHECK && devSha(v) === DEV_REC_CHECK));
/* 13.40: the developer key is never kept in the browser's long-term storage on the website (the regular site and /admin/ share it).
   On the website it lives only in this tab (sessionStorage); the admin version is opened by the server's lock, which marks the page (__FIN_ADMSES__). */
var DEVST = RAWLS;
try { if (!(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE)){ DEVST = SS;
  const o1 = RAWLS.getItem('fin-dev'), o2 = RAWLS.getItem('fin-dev-n');
  if (o1 && ADMIN_V && !SS.getItem('fin-dev')){ SS.setItem('fin-dev', o1); if (o2) SS.setItem('fin-dev-n', o2); }
  ['fin-dev', 'fin-dev-n', 'fin-gh-tok'].forEach(k => RAWLS.removeItem(k)); } } catch (e) {}
const devSrv = () => ADMIN_V && !(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) && window.__FIN_ADMSES__ === 1;
try { DEV_ON = devOk(DEVST.getItem('fin-dev')) || devSrv(); } catch (e) {}
var OFFI = {ils: NaN, eur: NaN, at: 0};
const applyDbRatesSrc = applyDbRates;
applyDbRates = function(d){ try { if (d && d.usd && +d.usd.ILS > 0 && +d.asOf >= (OFFI.at || 0)){ OFFI = {ils: +d.usd.ILS, eur: +d.usd.EUR > 0 ? +d.usd.ILS / +d.usd.EUR : NaN, at: +d.asOf}; } } catch (e) {} const r = applyDbRatesSrc.apply(this, arguments); try { if (d && META.official && META.unix === +d.asOf) Object.keys(d.usd || {}).forEach(k => { FXSRC[k] = {s: 'boi', at: +d.asOf * 1000}; }); } catch (e) {} return r; };
var SRC = {test: {}, testing: false, timer: null};
const SRC_L = {
  cnbcFx: s => 'https://www.cnbc.com/quotes/' + encodeURIComponent(s), gFin: q => 'https://www.google.com/finance/quote/' + q,
  boiFx: 'https://boi.org.il/roles/statistics/foreign-exchange-market/exchange-rates/', boi: 'https://www.boi.org.il/', cbs: 'https://www.cbs.gov.il/he/Pages/default.aspx',
  cbsApi: id => 'https://api.cbs.gov.il/index/data/price?id=' + id + '&format=json&download=false&last=3&lang=he',
  cb: 'https://api.coinbase.com/v2/exchange-rates?currency=USD', cbBtc: 'https://www.coinbase.com/price/bitcoin',
  bn: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', bnBtc: 'https://www.binance.com/en/price/bitcoin',
  gh: SITE_BASE + 'rates.json', ghAct: 'https://github.com/ysdesign-il/financial-calculator/actions'
};
const SRC_G = {ILS: 'USD-ILS', EUR: 'EUR-ILS', ta35: '142:TLV', ta125: '137:TLV', spx: '.INX:INDEXSP', ndx: 'NDX:INDEXNASDAQ', dji: '.DJI:INDEXDJX', gold: 'GCW00:COMEX', brent: 'BZW00:NYMEX'};
function srcAge(ms){
  if (!ms) return t('src_never');
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return t('src_sec', {n: s}); if (s < 3600) return t('src_min', {n: Math.round(s / 60)});
  if (s < 86400) return t('src_hr', {n: Math.round(s / 3600)}); return t('src_day', {n: Math.round(s / 86400)});
}
function srcWhen(ms){ if (!ms) return '—'; try { const d = new Date(ms), same = d.toDateString() === new Date().toDateString(); return new Intl.DateTimeFormat(locOf(), same ? {hour: '2-digit', minute: '2-digit', second: '2-digit'} : {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(d); } catch (e) { return ''; } }
function srcNextCbs(m){ const [y, mo] = String(m || '').split('-').map(Number); if (!y) return 0; const d = new Date(y, mo + 1, 15, 18, 30); return d.getTime(); }     // index for month m comes out on the 15th of m+1; the next one on the 15th of m+2
function srcItems(){
  const L = [], now = Date.now(), live = (ms, lim) => ms && now - ms < (lim || 120000);
  const fxRow = (k, name, val) => {
    const fs = FXSRC[k] || {s: 'built', at: 0}, at = fs.at, mode = fs.s;
    const st = (mode === 'cnbc' || mode === 'coinbase') && live(at) ? 'live' : mode === 'boi' ? 'sched' : 'stale';
    L.push({id: 'fx:' + k, g: 'fx', name, val, at, st, src: t('src_m_' + mode), why: t('src_w_' + mode), links: [[t('src_lSrc'), mode === 'boi' ? SRC_L.boiFx : mode === 'coinbase' ? SRC_L.cb : SRC_L.cnbcFx(k === 'ILS' ? 'ILS=' : 'EURILS=')], [t('src_lCheck'), SRC_L.gFin(SRC_G[k])], [t('src_lOfficial'), SRC_L.boiFx]]});
  };
  const fx = (a, b) => RATES[a] && RATES[b] ? RATES[b] / RATES[a] : NaN;
  fxRow('ILS', t('mk_usd'), N(fx('USD', 'ILS'), null, 4) + ' ₪');
  fxRow('EUR', t('mk_eur'), N(fx('EUR', 'ILS'), null, 4) + ' ₪');
  L.push({id: 'fx:boi', g: 'fx', name: t('src_boiRep'), val: isFinite(OFFI.ils) ? N(OFFI.ils, null, 4) + ' ₪' + (isFinite(OFFI.eur) ? ' · € ' + N(OFFI.eur, null, 4) : '') : '—', at: OFFI.at * 1000, st: 'sched', src: t('src_m_boi'), why: t('src_w_boiRep'), links: [[t('src_lSrc'), SRC_L.boiFx]]});
  const cs = FXSRC.BTC || {}, cm = (cs.s === 'binance' || cs.s === 'coinbase') && live(cs.at, 30000) ? cs.s : 'snap';
  L.push({id: 'cr:btc', g: 'cr', name: t('mk_btc'), val: RATES.BTC ? '$' + N(1 / RATES.BTC, null, 0) : '—', at: (META.cunix || 0) * 1000, st: cm !== 'snap' ? 'live' : 'stale', src: t('src_m_' + cm), why: t(cm === 'binance' ? 'src_w_binance' : cm === 'coinbase' ? 'src_w_crypto' : 'src_w_snap'),
    links: cm === 'binance' ? [[t('src_lSrc'), SRC_L.bnBtc], [t('src_lRaw'), SRC_L.bn]] : [[t('src_lSrc'), SRC_L.cbBtc], [t('src_lRaw'), SRC_L.cb]]});
  L.push({id: 'rate:boi', g: 'rate', name: t('mk_boi'), val: PC(MKT.boi), at: (typeof macroAt === 'number' ? macroAt : 0) * 1000, st: 'sched', src: t('src_m_boiInt'), why: t('src_w_boiInt', {d: MKT.boiDate || '—', n: MKT.boiNext || '—'}), links: [[t('src_lSrc'), SRC_L.boi]]});
  [['cpi', '120010'], ['build', '200010'], ['house', '40010']].forEach(([k, id]) => {
    const d = IX.idx[k]; if (!d) return;
    const next = srcNextCbs(d.m), late = next && now > next + 86400000;
    L.push({id: 'idx:' + k, g: 'idx', name: ixName(k), val: N(+d.v, 1) + ' · ' + lkLabel(d.m), at: next ? srcNextCbs(d.m) - 30 * 86400000 : 0, atTxt: t('src_pub', {m: lkLabel(d.m)}), st: late ? 'stale' : 'sched', src: t('src_m_cbs'),
      why: t(k === 'house' ? 'src_w_house' : 'src_w_cbs', {n: next ? srcWhen(next) : '—'}), links: [[t('src_lSrc'), SRC_L.cbs], [t('src_lRaw'), SRC_L.cbsApi(id)]]});
  });
  IX_MK.forEach(k => {
    const d = IX.mkt[k]; if (!d || !(d.p > 0)) return;
    const at = (+d.t || 0) * 1000, age = now - at, lv = d.live && IXL.ok;
    const pick = !srcOk('mkt', 'live');
    const st = pick ? (age < 2 * 3600000 ? 'sched' : 'stale') : lv && d.rt && age < 180000 ? 'live' : lv && !d.rt && age < 40 * 60000 ? 'delay' : 'stale';
    const why = pick ? t('src_w_pickSnap') : !lv ? t(IN_CLAUDE ? 'src_w_claude' : 'src_w_snapMk') : !d.rt ? t('src_w_prov') : age > 30 * 60000 ? t('src_w_closed') : t('src_w_rt');
    L.push({id: 'mkt:' + k, g: 'mkt', name: ixName(k), val: (k === 'gold' || k === 'brent' ? '$' : '') + N(d.p, null, d.p >= 1000 ? 0 : 2), at, st, src: t(lv ? 'src_m_cnbc' : 'src_m_snap'), why, links: [[t('src_lSrc'), SRC_L.cnbcFx(d.sym || IX_SYM[k])], [t('src_lCheck'), SRC_L.gFin(SRC_G[k])]]});
  });
  return L;
}
async function srcTest(){
  if (SRC.testing) return; SRC.testing = true; srcRender(true);
  const probe = async (k, url, ok) => { const t0 = performance.now(); try { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000); const r = await fetch(url, {signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); clearTimeout(to); const good = r.ok && (!ok || ok(await r.json())); SRC.test[k] = {ok: good, ms: Math.round(performance.now() - t0), at: Date.now()}; } catch (e) { SRC.test[k] = {ok: false, ms: Math.round(performance.now() - t0), at: Date.now(), blocked: true}; } };
  await Promise.all([
    probe('cnbc', ixQurl(), j => !!(j && j.FormattedQuoteResult)),
    probe('coinbase', SRC_L.cb, j => !!(j && j.data && j.data.rates)),
    probe('gh', IN_CLAUDE ? SRC_L.gh : 'rates.json?v=' + Date.now(), j => !!(j && j.usd))
  ]);
  if (IN_CLAUDE){ const t0 = performance.now(); try { const db = IX_DB || await window.claude.use('db'); const x = db ? await db.doc('rates/live').get() : null; SRC.test.db = {ok: !!(x && x.exists), ms: Math.round(performance.now() - t0), at: Date.now(), asOf: x && x.exists ? +(x.data() || {}).asOf || 0 : 0}; } catch (e) { SRC.test.db = {ok: false, ms: 0, at: Date.now()}; } }
  try { await refreshEverything(false); } catch (e) {}
  SRC.testing = false; srcRender(true);
}
function srcRender(force){
  const box = $('#src_box'); if (!box || !liveOwner()) return;
  if (!force && (box.closest('.set-cat') || {}).hidden) return;
  { const ae = document.activeElement; if (!force && (SRC.edit || (ae && box.contains(ae) && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)))) return; }      // never redraw under someone who is typing or choosing
  const items = srcItems(), cnt = {live: 0, delay: 0, sched: 0, stale: 0}; items.forEach(i => cnt[i.st]++);
  const env = IN_CLAUDE ? t('src_envClaude', {t: srcWhen((META.unix || 0) * 1000)}) : t('src_envSite');
  const pill = st => `<span class="src-st s-${st}">${asEsc(t('src_s_' + st))}</span>`;
  const lk = l => `<a href="${asEsc(l[1])}" target="_blank" rel="noopener noreferrer" class="src-a">${asEsc(l[0])} ↗</a>`;
  let h = `<p class="fine">${asEsc(t('src_intro'))}</p><div class="src-env">${asEsc(env)}</div><p class="fine src-pnote">${asEsc(t(IN_CLAUDE ? 'src_pickAll' : 'src_pickMe'))} ${asEsc(t('srl_note'))}</p>`;
  h += `<div class="src-sum">${['live', 'delay', 'sched', 'stale'].map(k => `<span class="src-st s-${k}">${asEsc(t('src_s_' + k))} · ${cnt[k]}</span>`).join('')}</div>`;
  h += `<div class="btnrow"><button type="button" class="gold-btn" id="src_test"${SRC.testing ? ' disabled' : ''}>${asEsc(t(SRC.testing ? 'src_testing' : 'src_testBtn'))}</button>${DEV_ON ? `<button type="button" class="mv wide" id="dev_off">${asEsc(t('dev_off'))}</button>` : ''}</div>`;
  const T = SRC.test;
  if (Object.keys(T).length){
    const row = (k, name) => T[k] ? `<li class="${T[k].ok ? 's-ok' : 's-bad'}"><b>${T[k].ok ? '✓' : '✗'}</b><span>${asEsc(name)}</span><small>${T[k].ok ? asEsc(t('src_ms', {n: T[k].ms})) : asEsc(t(T[k].blocked ? 'src_blocked' : 'src_failed'))}${k === 'db' && T.db.asOf ? ' · ' + asEsc(t('src_dbAt', {t: srcWhen(T.db.asOf * 1000)})) : ''}</small></li>` : '';
    h += `<ul class="src-tests">${row('cnbc', t('src_t_cnbc'))}${row('coinbase', t('src_t_cb'))}${row('gh', t('src_t_gh'))}${row('db', t('src_t_db'))}</ul>`;
  }
  ['fx', 'cr', 'rate', 'idx', 'mkt'].forEach(g => {
    const rows = items.filter(i => i.g === g); if (!rows.length) return;
    h += `<div class="src-gh"><h4 class="src-h">${asEsc(t('src_g_' + g))}</h4>${srcPickHtml(g)}</div><div class="src-list">`;
    rows.forEach(i => { h += `<div class="src-row" data-srcid="${asEsc(i.id)}"><div class="src-top"><b>${asEsc(i.name)}</b>${pill(i.st)}</div><div class="src-val num">${asEsc(i.val)}</div>
      <div class="src-meta">${asEsc(i.atTxt || t('src_upd', {t: srcWhen(i.at), a: srcAge(i.at)}))} · ${asEsc(i.src)}</div>${srlHtml(i.id, i.links, lk)}</div>`; });
    h += '</div>';
  });
  h += `<div class="src-foot" data-srcid="pipe"><p class="fine">${asEsc(t('src_pipe'))}</p>${srlHtml('pipe', [['rates.json', SRC_L.gh], ['GitHub Actions', SRC_L.ghAct]], lk)}</div>`;
  box.innerHTML = h;
}
document.addEventListener('click', e => {
  if (e.target.closest('#src_test')) srcTest();
  else if (e.target.closest('#dev_off')){ try { DEVST.removeItem('fin-dev'); DEVST.removeItem('fin-dev-n'); } catch (err) {} DEV_ON = false; DEV_NAME = ''; liveApply(); devPermSync(); try { activate('settings'); } catch (err) {} toast(t('dev_offDone')); }
  else if (e.target.closest('#src_open')){ activate('settings'); setTimeout(() => { const r = $('.sh-row[data-scat="conn"]'); if (r) r.click(); setTimeout(() => { srcRender(true); const s = $('.set-sec[data-sk="set_src"]'); if (s) s.scrollIntoView({block: 'start'}); }, 200); }, 120); }
});
setInterval(() => { if (!document.hidden && tab === 'settings' && SCAT === 'conn') srcRender(); }, 5000);
document.addEventListener('click', e => { if (e.target.closest('.sh-row[data-scat="conn"]')) setTimeout(() => srcRender(true), 150); });
/* developer mode on the website: tap the version number five times, then enter your private developer code */
var DEV_TAPS = [];
document.addEventListener('click', e => {
  if (!e.target.closest('#upd_cur') || !ADMIN_V) return;
  const now = Date.now(); DEV_TAPS = DEV_TAPS.filter(x => now - x < 3000).concat(now);
  if (DEV_TAPS.length < 5 || $('#dev_box')) return;
  DEV_TAPS = [];
  const box = e.target.closest('.upd-box') || e.target.parentNode;
  box.insertAdjacentHTML('beforeend', `<div class="dev-box" id="dev_box"><div class="dev-two"><div class="dev-f dev-fn"><label for="dev_name">${asEsc(t('dev_name'))}</label><input id="dev_name" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr"></div>
    <div class="dev-f"><label for="dev_code">${asEsc(t('dev_code'))}</label><input id="dev_code" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="FC-XXXX-XXXX-XXXX"></div></div>
    <div class="dev-row"><button type="button" class="mv wide" id="dev_paste">${asEsc(t('dev_paste'))}</button><button type="button" class="gold-btn" id="dev_go">${asEsc(t('dev_go'))}</button></div><small class="hint" id="dev_msg"></small>
    <button type="button" class="dev-forgot" id="dev_forgot">${asEsc(t('dev_forgot'))}</button>
    <div class="dev-rec" id="dev_rec" hidden><p class="fine">${asEsc(t('dev_recHow'))}</p><div class="dev-f"><label for="dev_rcode">${asEsc(t('dev_rcode'))}</label><input id="dev_rcode" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="RC-XXXXX-XXXXX-XXXXX-XXXXX"></div>
    <div class="dev-row"><button type="button" class="gold-btn" id="dev_rgo">${asEsc(t('dev_rgo'))}</button></div><small class="hint" id="dev_rmsg"></small></div></div>`);
  setTimeout(() => { const i = $('#dev_name'); if (i) i.focus(); }, 50);
});
/* both the owner's name and the developer code are needed; only a fingerprint of the pair is kept in the app */
const devNorm = s => String(s || '').replace(/^.*?(FC[-\s]?)/i, 'FC').replace(/[^0-9a-z]/gi, '').toUpperCase();
/* 13.41: the feedback inbox is locked with the inbox secret – a one-way fingerprint of the developer key that cannot sign in. The admin version only ever receives this secret; the app (with the key) derives it */
const ibSec = s => (typeof s === 'string' && /^[0-9a-f]{64}$/.test(s) && devSha(s) === DEV_CHECK) ? devSha('ib-v1:' + s) : s;
const devNameNorm = s => String(s || '').replace(/\s+/g, '').toUpperCase();
async function devTry(rawName, rawCode, quiet){
  const ni = $('#dev_name'), ci = $('#dev_code'), m = $('#dev_msg');
  const name = devNameNorm(rawName != null ? rawName : ni && ni.value), code = devNorm(rawCode != null ? rawCode : ci && ci.value);
  if (!name || code.length < 14){ if (!quiet && m) m.textContent = t(!name ? 'dev_needName' : 'dev_needCode'); return false; }
  let h = '';
  try { const b = await pbk(name + ':' + code, new TextEncoder().encode('fincalc-dev-v2'), 150000, 256); h = Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''); } catch (e) {}
  if (h && devOk(h)){
    try { DEVST.setItem('fin-dev', h); DEVST.setItem('fin-dev-n', name); } catch (e) {}
    DEV_ON = true; DEV_NAME = name; const b = $('#dev_box'); if (b) b.remove(); liveApply(); devPermSync(); toast(t('dev_onDone')); return true;
  }
  if (m) m.textContent = t('dev_bad2');
  return false;
}
/* forgot the code: the one-time backup code opens developer mode on this device */
async function devRecTry(){
  const i = $('#dev_rcode'), m = $('#dev_rmsg'); if (!i) return false;
  const n = String(i.value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!/^RC[0-9A-Z]{20}$/.test(n)){ if (m) m.textContent = t('dev_rNeed'); return false; }
  if (m) m.textContent = t('dev_rWait');
  let h = '';
  try { const b = await pbk('REC:' + n, new TextEncoder().encode('fincalc-dev-rec-v1'), 150000, 256); h = Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''); } catch (e) {}
  if (h && DEV_REC_CHECK && devSha(h) === DEV_REC_CHECK){
    try { DEVST.setItem('fin-dev', h); DEVST.removeItem('fin-dev-n'); } catch (e) {}
    DEV_ON = true; DEV_NAME = ''; const bx = $('#dev_box'); if (bx) bx.remove(); liveApply(); devPermSync(); toast(t('dev_rOk')); return true;
  }
  if (m) m.textContent = t('dev_rBad');
  return false;
}
document.addEventListener('click', e => {
  if (e.target.closest('#dev_forgot')){ const r = $('#dev_rec'); if (r){ r.hidden = !r.hidden; if (!r.hidden){ const i = $('#dev_rcode'); if (i) i.focus(); } } return; }
  if (e.target.closest('#dev_rgo')) devRecTry();
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'dev_rcode'){ e.preventDefault(); devRecTry(); } });
/* paste the code: a paste button, pasting straight into the field, or opening the site with #dev=CODE */
document.addEventListener('click', async e => {
  if (!e.target.closest('#dev_paste')) return;
  const i = $('#dev_code'), m = $('#dev_msg');
  try { const txt = await navigator.clipboard.readText(); if (txt && i){ const pair = /^\s*([A-Za-z]{2,})\s*[~:]\s*(FC.*)$/i.exec(txt.trim()); if (pair){ const n = $('#dev_name'); if (n) n.value = pair[1]; i.value = pair[2]; } else i.value = txt.trim(); devTry(null, null, true).then(ok => { if (!ok && m) m.textContent = t($('#dev_name') && !$('#dev_name').value ? 'dev_needName' : 'dev_bad2'); }); return; } } catch (err) {}
  if (i){ i.focus(); i.select(); } if (m) m.textContent = t('dev_pasteHint');
});
document.addEventListener('paste', e => { if (e.target && (e.target.id === 'dev_code' || e.target.id === 'dev_name')) setTimeout(() => devTry(null, null, true), 30); });
document.addEventListener('input', e => { if (e.target && (e.target.id === 'dev_code' || e.target.id === 'dev_name')) devTry(null, null, true); });
async function devFromHash(){
  if (IN_CLAUDE) return;
  if (!ADMIN_V) return;
  const m = /[#&]dev=([^&]+)/i.exec(location.hash || ''); if (!m) return;
  const raw = decodeURIComponent(m[1]), pair = /^([^~:]+)[~:](.+)$/.exec(raw);
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  if (!pair || !(await devTry(pair[1], pair[2], true))) toast(t('dev_bad2'));
}
devFromHash();
window.addEventListener('hashchange', devFromHash);
document.addEventListener('click', e => { if (e.target.closest('#dev_go')) devTry(); });
document.addEventListener('keydown', e => { if (e.target && (e.target.id === 'dev_code' || e.target.id === 'dev_name') && e.key === 'Enter'){ e.preventDefault(); devTry(); } });
/* a quiet shortcut for the developer under the home board */
const ixBoardSrc = ixBoard;
ixBoard = function(){ const r = ixBoardSrc.apply(this, arguments); const n = $('#hmx .mkt-note'); if (n && liveOwner() && !$('#src_open')) n.insertAdjacentHTML('beforeend', ` <button type="button" class="fg-x" id="src_open">${asEsc(t('src_open'))}</button>`); return r; };
liveApply();
try { if (tab === 'home') ixBoard(); } catch (e) {}

/* what changed in a version stays with the developer: people only see that the app was updated */
const verNoteOwn = verNote;
verNote = function(e){ return liveOwner() ? verNoteOwn(e) : ''; };
try { updRender(); } catch (e) {}
/* developer mode on the website shows you as the owner, everywhere the app names its owner */
const permRenderDev = permRender;
permRender = function(){
  if (!IN_CLAUDE && PERM !== 'wait') PERM = DEV_ON ? 'owner' : 'local';
  const r = permRenderDev.apply(this, arguments);
  const box = $('#perm'), tt = $('#perm_t'), ss = $('#perm_s');
  if (PERM === 'owner' && !liveOwner()){ if (box) box.className = 'perm view'; if (tt) tt.textContent = t(IN_CLAUDE ? 'perm_viewer' : 'perm_local'); if (ss) ss.textContent = t(IN_CLAUDE ? 'perm_viewerS' : 'perm_localS'); }
  else if (liveOwner()){ if (tt) tt.textContent = DEV_NAME ? t('perm_ownerN', {n: DEV_NAME}) : t('perm_owner'); if (ss) ss.textContent = t('perm_ownerDevS'); }
  ownPill();
  return r;
};
const shRenderDev = shRender;
shRender = function(){
  const r = shRenderDev.apply(this, arguments);
  const a = $('#sh_sub_account');
  if (a && PERM === 'owner'){ const who = liveOwner() ? (DEV_NAME ? t('perm_ownerN', {n: DEV_NAME}) : t('perm_owner')) : t(IN_CLAUDE ? 'perm_viewer' : 'perm_local'); a.textContent = (FUSER ? '@' + FUSER : t('sc_accountS')) + ' · ' + who; }
  return r;
};
function ownPill(){
  const own = liveOwner();
  $$('.brand').forEach(b => {
    let p = $('.own-pill', b);
    if (own && !p){ p = document.createElement('span'); p.className = 'own-pill'; b.appendChild(p); }
    if (p){ if (own) p.textContent = DEV_NAME ? t('own_pillN', {n: DEV_NAME}) : t('own_pillDev'); else p.remove(); }
  });
  const hh = $('.home-hello'); if (hh){ let p = $('.own-pill', hh.parentNode); if (own && !p){ p = document.createElement('span'); p.className = 'own-pill own-pill-h'; hh.insertAdjacentElement('afterend', p); } if (p){ if (own) p.textContent = DEV_NAME ? t('own_pillN', {n: DEV_NAME}) : t('own_pillDev'); else p.remove(); } }
}
var DEV_NAME = '';
try { if (DEV_ON) DEV_NAME = DEVST.getItem('fin-dev-n') || ''; } catch (e) {}
function devPermSync(){ try { permRender(); } catch (e) {} try { shRender(); } catch (e) {} ownPill(); }
Promise.resolve(PERM_P).then(devPermSync, devPermSync);
document.addEventListener('click', e => { if (e.target.closest('#dev_go, #dev_paste, #dev_off')) setTimeout(devPermSync, 900); });
document.addEventListener('paste', e => { if (e.target && e.target.id === 'dev_code') setTimeout(devPermSync, 900); });
window.addEventListener('hashchange', () => setTimeout(devPermSync, 900));
setTimeout(devPermSync, 1200);
const _alOwn = applyLang;
applyLang = function(){ const r = _alOwn.apply(this, arguments); devPermSync(); return r; };

/* ================= links: only the developer adds them; each one is either for you alone or for everyone ================= */
var LN = {pub: [], me: [], edit: null, uid: null, db: null, sure: null, cfg: {del: 'manual'}};
function lnUrl(u){
  let x = String(u || '').trim(); if (!x) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(x)) x = 'https://' + x;
  try { const p = new URL(x); return /^https?:$/.test(p.protocol) && p.hostname.includes('.') ? p.href : ''; } catch (e) { return ''; }
}
function lnHost(u){ try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
function lnClean(list){ return (Array.isArray(list) ? list : []).map(x => ({id: String(x && x.id || '').slice(0, 24) || Math.random().toString(36).slice(2, 10), n: String(x && x.n || '').slice(0, 40), u: lnUrl(x && x.u), d: String(x && x.d || '').slice(0, 90), st: x && x.st === 'stale' ? 'stale' : 'live', sa: +(x && x.sa) || 0})).filter(x => x.n && x.u).slice(0, 60); }
const lnLive = list => list.filter(x => x.st !== 'stale');
var LN_DEL = {manual: 0, auto0: 0, auto1: 86400000, auto7: 7 * 86400000};
async function lnDb(){
  if (!IN_CLAUDE) return null; if (LN.db) return LN.db;
  try { const db = await window.claude.use('db'); if (!db) return null; LN.db = db; try { const u = await window.claude.use('user'); LN.uid = u ? await u.id() : null; } catch (e) {} return db; } catch (e) { return null; }
}
async function lnLoad(){
  if (IN_CLAUDE){
    const db = await lnDb(); if (!db) return;
    try { db.doc('links/app').onSnapshot(s => { LN.pub = lnClean(s && s.exists ? (s.data() || {}).items : []); lnRender(); lnLabel(); }, () => {}); } catch (e) {}
    await lnLoadMe();
  } else {
    try { const r = await fetch('links.json?v=' + Math.floor(Date.now() / 300000), {cache: 'no-store'}); if (r.ok){ const j = await r.json(); LN.pub = lnClean(j && j.items); } } catch (e) {}
    await lnLoadMe(); lnRender(); lnLabel();
  }
}
async function lnLoadMe(){
  if (!liveOwner()){ LN.me = []; return; }
  if (IN_CLAUDE){ const db = await lnDb(); if (db && LN.uid){ try { const d = await db.collection('data/users/' + LN.uid).doc('devlinks').get(); const x = d && d.exists ? (d.data() || {}) : {}; LN.me = lnClean(x.items); if (x.cfg && LN_DEL[x.cfg.del] != null) LN.cfg = {del: x.cfg.del}; } catch (e) {} } }
  else { try { LN.me = lnClean(JSON.parse(RAWLS.getItem('fin-links-me') || '[]')); } catch (e) { LN.me = []; } try { const c = JSON.parse(RAWLS.getItem('fin-links-cfg') || 'null'); if (c && LN_DEL[c.del] != null) LN.cfg = {del: c.del}; } catch (e) {} }
  lnRender(); lnAuto();
}
async function lnSave(which){
  const items = lnClean(which === 'pub' ? LN.pub : LN.me);
  if (IN_CLAUDE){
    const db = await lnDb(); if (!db) throw new Error('db');
    if (which === 'pub') await db.doc('links/app').set({items, at: Date.now()});
    else { if (!LN.uid) throw new Error('uid'); await db.collection('data/users/' + LN.uid).doc('devlinks').set({items, cfg: LN.cfg, at: Date.now()}); }
  } else {
    if (which === 'pub') throw new Error('site');
    RAWLS.setItem('fin-links-me', JSON.stringify(items)); RAWLS.setItem('fin-links-cfg', JSON.stringify(LN.cfg));
  }
}
function lnLabel(){
  const own = liveOwner(), pubN = lnLive(LN.pub).length, k = own ? 'sc_conn' : pubN ? 'sc_connLn' : 'sc_connAi';
  $$('[data-i="sc_conn"], [data-i="sc_connAi"], [data-i="sc_connLn"]', $('#panel-settings') || document).forEach(el => { el.dataset.i = k; el.textContent = t(k); });
  const sub = $('#sh_sub_conn'); if (sub && !own){ sub.dataset.i = pubN ? 'sc_connLnS' : 'sc_connAiS'; sub.textContent = t(sub.dataset.i); }
}
function lnRender(){
  const box = $('#ln_box'); if (!box) return;
  const own = liveOwner(), sec = box.closest('.set-sec');
  const pubShown = own ? LN.pub : lnLive(LN.pub), show = own || pubShown.length > 0;
  if (sec){ if (sec.hidden === show) GS_IDX = null; sec.hidden = !show; if (!show) sec.dataset.own = '1'; else delete sec.dataset.own; }
  if (!show){ box.innerHTML = ''; return; }
  const autoTxt = x => { const d = LN_DEL[LN.cfg.del]; if (!/^auto/.test(LN.cfg.del) || x.st !== 'stale') return ''; const left = (x.sa || Date.now()) + d - Date.now(); return left <= 0 ? t('ln_autoNow') : t('ln_autoIn', {t: srcWhen((x.sa || Date.now()) + d)}); };
  const item = (x, which) => `<div class="ln-it${x.st === 'stale' ? ' stale' : ''}" data-lnid="${asEsc(x.id)}" data-lnw="${which}"><a class="ln-a" href="${asEsc(x.u)}" target="_blank" rel="noopener noreferrer"><span class="ln-av" aria-hidden="true">${asEsc((x.n.trim()[0] || '?').toUpperCase())}</span><span class="ln-tx"><b>${asEsc(x.n)}</b><small dir="ltr">${asEsc(lnHost(x.u))}</small>${x.d ? `<span class="ln-d">${asEsc(x.d)}</span>` : ''}</span>${own && which === 'me' ? `<span class="ln-tag">${asEsc(t('ln_meTag'))}</span>` : ''}<span class="ln-go" aria-hidden="true">↗</span></a>
    ${own ? `<div class="ln-ed"><button type="button" class="src-st s-${x.st === 'stale' ? 'stale' : 'live'} ln-st" data-lna="st" aria-pressed="${x.st !== 'stale'}" title="${asEsc(t('ln_stTip'))}">${asEsc(t(x.st === 'stale' ? 'src_s_stale' : 'src_s_live'))} ⇄</button><button type="button" class="ln-b" data-lna="up" aria-label="${asEsc(t('ln_up'))}">↑</button><button type="button" class="ln-b" data-lna="down" aria-label="${asEsc(t('ln_down'))}">↓</button><button type="button" class="ln-b" data-lna="edit">${asEsc(t('ln_edit'))}</button>${x.st === 'stale' ? `<button type="button" class="ln-b ln-del" data-lna="del">${asEsc(LN.sure === which + x.id ? t('ln_sure') : t('ln_del'))}</button>` : ''}${autoTxt(x) ? `<small class="ln-auto">${asEsc(autoTxt(x))}</small>` : ''}</div>` : ''}</div>`;
  let h = '';
  if (own){
    h += `<p class="fine">${asEsc(t('ln_intro'))}</p><div class="ln-cfg"><label for="ln_del">${asEsc(t('ln_delMode'))}</label><select id="ln_del">${Object.keys(LN_DEL).map(k => `<option value="${k}"${LN.cfg.del === k ? ' selected' : ''}>${asEsc(t('ln_del_' + k))}</option>`).join('')}</select><small class="hint">${asEsc(t('ln_delHint'))}</small></div>`;
  }
  if (own && LN.me.length) h += `<h4 class="ln-h">${asEsc(t('ln_hMe'))}</h4><div class="ln-list">${LN.me.map(x => item(x, 'me')).join('')}</div>`;
  if (pubShown.length) h += (own ? `<h4 class="ln-h">${asEsc(t('ln_hPub'))}</h4>` : '') + `<div class="ln-list">${pubShown.map(x => item(x, 'pub')).join('')}</div>`;
  if (own){
    const e = LN.edit || {n: '', u: '', d: '', w: 'me'};
    h += `<div class="ln-form"><h4 class="ln-h">${asEsc(t(LN.edit && LN.edit.id ? 'ln_editT' : 'ln_addT'))}</h4>
      <div class="ln-f"><label for="ln_n">${asEsc(t('ln_n'))}</label><input id="ln_n" maxlength="40" value="${asEsc(e.n)}" autocomplete="off"></div>
      <div class="ln-f"><label for="ln_u">${asEsc(t('ln_u'))}</label><input id="ln_u" dir="ltr" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://" value="${asEsc(e.u)}"></div>
      <div class="ln-f"><label for="ln_d">${asEsc(t('ln_d'))}</label><input id="ln_d" maxlength="90" value="${asEsc(e.d)}" autocomplete="off"></div>
      <div class="ln-f"><label for="ln_w">${asEsc(t('ln_w'))}</label><select id="ln_w"><option value="me"${e.w === 'me' ? ' selected' : ''}>${asEsc(t('ln_wMe'))}</option><option value="pub"${e.w === 'pub' ? ' selected' : ''}${IN_CLAUDE ? '' : ' disabled'}>${asEsc(t('ln_wPub'))}</option></select>${IN_CLAUDE ? '' : `<small class="hint">${asEsc(t('ln_sitePub'))}</small>`}</div>
      <div class="btnrow"><button type="button" class="gold-btn" id="ln_save">${asEsc(t(LN.edit && LN.edit.id ? 'ln_saveEd' : 'ln_add'))}</button>${LN.edit && LN.edit.id ? `<button type="button" class="mv wide" id="ln_cancel">${asEsc(t('ln_cancel'))}</button>` : ''}</div><small class="hint" id="ln_msg"></small></div>`;
  }
  box.innerHTML = h;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-lna]');
  if (b && liveOwner()){
    const it = b.closest('.ln-it'), id = it.dataset.lnid, which = it.dataset.lnw, list = which === 'pub' ? LN.pub : LN.me, i = list.findIndex(x => x.id === id); if (i < 0) return;
    const a = b.dataset.lna;
    if (a === 'edit'){ LN.edit = Object.assign({w: which}, list[i]); lnRender(); const n = $('#ln_n'); if (n){ n.focus(); n.scrollIntoView({block: 'center'}); } return; }
    if (a === 'del' && list[i].st !== 'stale') return;                 // only links that are not live can be deleted
    if (a === 'del' && LN.sure !== which + id){ LN.sure = which + id; lnRender(); return; }
    const before = JSON.stringify(list);
    if (a === 'st'){ const x = list[i]; if (x.st === 'stale'){ x.st = 'live'; x.sa = 0; } else { x.st = 'stale'; x.sa = Date.now(); } LN.sure = null; }
    else if (a === 'del'){ list.splice(i, 1); LN.sure = null; }
    else if (a === 'up' && i > 0){ [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
    else if (a === 'down' && i < list.length - 1){ [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
    lnRender();
    try { await lnSave(which); toast(t(a === 'st' ? (list[i] && list[i].st === 'stale' ? 'ln_toStale' : 'ln_toLive') : 'ln_saved')); } catch (err) { if (which === 'pub') LN.pub = JSON.parse(before); else LN.me = JSON.parse(before); lnRender(); toast(t('ln_fail')); }
    lnLabel(); if (a === 'st') lnAuto();
    return;
  }
  if (e.target.closest('#ln_cancel')){ LN.edit = null; lnRender(); return; }
  if (e.target.closest('#ln_save') && liveOwner()){
    const n = String(($('#ln_n') || {}).value || '').trim().slice(0, 40), u = lnUrl(($('#ln_u') || {}).value), d = String(($('#ln_d') || {}).value || '').trim().slice(0, 90), w = ($('#ln_w') || {}).value === 'pub' && IN_CLAUDE ? 'pub' : 'me', m = $('#ln_msg');
    if (!n){ if (m) m.textContent = t('ln_needN'); return; }
    if (!u){ if (m) m.textContent = t('ln_badU'); return; }
    const old = LN.edit && LN.edit.id ? LN.edit : null, id = old ? old.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const snapPub = JSON.stringify(LN.pub), snapMe = JSON.stringify(LN.me);
    if (old){ const ol = old.w === 'pub' ? LN.pub : LN.me, oi = ol.findIndex(x => x.id === old.id); if (oi >= 0) ol.splice(oi, 1); }
    const list = w === 'pub' ? LN.pub : LN.me, rec = {id, n, u, d, st: old ? old.st || 'live' : 'live', sa: old ? old.sa || 0 : 0};
    if (old && old.w === w){ const pos = (JSON.parse(w === 'pub' ? snapPub : snapMe)).findIndex(x => x.id === old.id); list.splice(Math.max(0, pos), 0, rec); } else list.push(rec);
    try { await lnSave(w); if (old && old.w !== w) await lnSave(old.w); LN.edit = null; lnRender(); lnLabel(); toast(t('ln_saved')); }
    catch (err) { LN.pub = JSON.parse(snapPub); LN.me = JSON.parse(snapMe); lnRender(); const mm = $('#ln_msg'); if (mm) mm.textContent = t('ln_fail'); }
  }
});
const liveApplyLn = liveApply;
liveApply = function(){ const r = liveApplyLn.apply(this, arguments); try { lnLabel(); } catch (e) {} if (LN_OWN !== liveOwner()){ LN_OWN = liveOwner(); lnLoadMe().then(lnRender); } return r; };
var LN_OWN = null;
const _alLn = applyLang;
applyLang = function(){ const r = _alLn.apply(this, arguments); lnRender(); lnLabel(); return r; };
setTimeout(lnLoad, 600);
Promise.resolve(PERM_P).then(() => { LN_OWN = null; liveApply(); });

/* deleting links that are not live: by hand, or automatically after the delay you pick */
document.addEventListener('change', async e => {
  if (!e.target || e.target.id !== 'ln_del' || !liveOwner()) return;
  const prev = LN.cfg.del; LN.cfg = {del: LN_DEL[e.target.value] != null ? e.target.value : 'manual'};
  try { await lnSave('me'); toast(t('ln_saved')); } catch (err) { LN.cfg = {del: prev}; toast(t('ln_fail')); }
  lnRender(); lnAuto();
});
var LN_AUTO_BUSY = false;
async function lnAuto(){
  if (LN_AUTO_BUSY || !liveOwner() || !/^auto/.test(LN.cfg.del)) return;
  LN_AUTO_BUSY = true;
  try {
    const d = LN_DEL[LN.cfg.del], now = Date.now(), gone = x => x.st === 'stale' && now - (x.sa || now) >= d;
    for (const which of ['me', 'pub']){
      if (which === 'pub' && !IN_CLAUDE) continue;
      const list = which === 'pub' ? LN.pub : LN.me, keep = list.filter(x => !gone(x));
      if (keep.length !== list.length){
        const before = list.slice();
        if (which === 'pub') LN.pub = keep; else LN.me = keep;
        try { await lnSave(which); toast(t('ln_autoDone', {n: before.length - keep.length})); } catch (err) { if (which === 'pub') LN.pub = before; else LN.me = before; }
      }
    }
  } finally { LN_AUTO_BUSY = false; }
  lnRender(); lnLabel();
}
setInterval(() => { if (!document.hidden) lnAuto(); }, 10 * 60000);

/* ================= the developer picks where each kind of data comes from, and edits every source link (Connections, developer only) ================= */
var SRCP_OPT = {fx: ['auto', 'cnbc', 'coinbase', 'boi'], cr: ['auto', 'coinbase', 'binance'], mkt: ['live', 'snap']};
var SRCP = {fx: 'auto', cr: 'auto', mkt: 'live'}, SRCP_REMOTE = null;
function srcpClean(d){ const o = {}; Object.keys(SRCP_OPT).forEach(g => { const v = d && d[g]; o[g] = SRCP_OPT[g].includes(v) ? v : SRCP_OPT[g][0]; }); return o; }
function srcOk(g, s){
  const P = (typeof SRCP === 'object' && SRCP) || {}, p = P[g];
  if (!p || p === 'auto') return true;
  if (g === 'fx') return p === 'cnbc' ? (s === 'cnbc' || s === 'snap') : p === s;     // "official only" lets no market rate in
  if (g === 'cr') return p === s;
  if (g === 'mkt') return p === 'live' || s === 'snap';
  return true;
}
/* what the app started with, the last official rates and the last saved market copy: switching source starts again from these */
var SRC_BASE = Object.assign({}, RATES), SRC_BASE_U = META.unix || 0, OFFDOC = null, FXLAST = null, IXLAST = null;
const applyDbRatesSp = applyDbRates;
applyDbRates = function(d){ try { if (d && d.usd && typeof d.usd === 'object' && +d.asOf >= (+(OFFDOC || {}).asOf || 0)) OFFDOC = {usd: d.usd, asOf: +d.asOf}; } catch (e) {} return applyDbRatesSp.apply(this, arguments); };
const fxApplySnapSp = fxApplySnap;
fxApplySnap = function(L){ try { if (L && L.usd && typeof L.usd === 'object' && (+L.asOf || 0) >= (+(FXLAST || {}).asOf || 0)) FXLAST = L; } catch (e) {} if (!srcOk('fx', 'snap')) return false; return fxApplySnapSp.apply(this, arguments); };
const ixApplySp = ixApply;
ixApply = function(d){ try { if (d && d.mkt && d.mkt.items) IXLAST = d; } catch (e) {} return ixApplySp.apply(this, arguments); };
const tryLiveCryptoSp = tryLiveCrypto;
tryLiveCrypto = async function(){
  if (!gemOn() && !srcOk('cr', 'coinbase')) return false;
  const r = await tryLiveCryptoSp.apply(this, arguments);
  if (r && !gemOn()) Object.keys(CRYPTO).forEach(c => { FXSRC[c] = {s: 'coinbase', at: Date.now()}; });
  return r;
};
function srcFxReset(){
  Object.keys(RATES).forEach(k => { if (k === 'USD' || CRYPTO[k]) return; if (SRC_BASE[k] > 0) RATES[k] = SRC_BASE[k]; FXSRC[k] = {s: 'built', at: 0}; });
  FXL.pin = {}; META.live = false; META.mkt = false; META.official = false; META.unix = SRC_BASE_U;
  try { if (OFFDOC) applyDbRates(OFFDOC); } catch (e) {}
  try { if (FXLAST) fxApplySnap(FXLAST); } catch (e) {}
}
function srcMktReset(){
  const base = (IXLAST && IXLAST.mkt && IXLAST.mkt.items) || ((IX_BUILT && IX_BUILT.mkt) || {}).items || {};
  IX_MK.forEach(k => { const o = IX.mkt[k]; if (!o || !o.live) return; const n = base[k]; IX.mkt[k] = n && +n.p > 0 ? Object.assign({}, n) : Object.assign({}, o, {live: false}); });
  try { ixOfficial(true); } catch (e) {}
}
function srcpSet(next){
  const prev = SRCP; SRCP = srcpClean(next);
  const ch = g => prev[g] !== SRCP[g];
  if (!ch('fx') && !ch('cr') && !ch('mkt')) return false;
  if (ch('fx')) srcFxReset();
  if (ch('mkt') && SRCP.mkt === 'snap') srcMktReset();
  if (ch('cr')){ try { binStart(); } catch (e) {} }
  try { if (!srcOk('fx', 'coinbase') && !srcOk('cr', 'coinbase')){ if (fxTimer){ clearTimeout(fxTimer); fxTimer = null; } fxStatus(''); } else if (SET.liveFx === '1' && !fxTimer) fxStart(); } catch (e) {}
  try { fillCurSelects(); renderStamp(); if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {}
  try { Promise.resolve(refreshEverything(false)).then(() => srcRender(), () => srcRender()); } catch (e) {}      // bring in right away whatever the new choice allows
  srcRender(true);
  return true;
}
async function srcpSave(next){
  const v = srcpClean(next);
  if (IN_CLAUDE){ const db = IX_DB || await window.claude.use('db'); if (!db) throw new Error('db'); await db.doc('rates/srcpref').set(Object.assign({}, v, {at: Date.now()})); }
  else RAWLS.setItem('fin-srcp', JSON.stringify(v));
}
function srcpSite(){ let mine = null; if (DEV_ON) try { mine = JSON.parse(RAWLS.getItem('fin-srcp') || 'null'); } catch (e) {} srcpSet(mine || SRCP_REMOTE || {}); }
async function srcpLoad(){
  if (IN_CLAUDE){
    try { const db = IX_DB || await window.claude.use('db'); if (db) db.doc('rates/srcpref').onSnapshot(s => { SRCP_REMOTE = s && s.exists ? srcpClean(s.data()) : null; srcpSet(SRCP_REMOTE || {}); }, () => {}); } catch (e) {}
    return;
  }
  srcpSite();                                                              // the developer's own choice on this device applies at once
  try { const r = await fetch('srcpref.json?v=' + Math.floor(Date.now() / 300000), {cache: 'no-store'}); if (r.ok) SRCP_REMOTE = srcpClean(await r.json()); } catch (e) {}
  srcpSite();
}
function srcPickHtml(g){
  if (!SRCP_OPT[g]) return `<span class="src-one">${asEsc(t('src_one'))}</span>`;
  return `<label class="src-pick"><span>${asEsc(t('src_pick'))}</span><select data-srcp="${g}" aria-label="${asEsc(t('src_pick') + ' · ' + t('src_g_' + g))}">${SRCP_OPT[g].map(o => `<option value="${o}"${SRCP[g] === o ? ' selected' : ''}>${asEsc(t('src_p_' + g + '_' + o))}</option>`).join('')}</select></label>`;
}
document.addEventListener('change', async e => {
  const s = e.target && e.target.closest && e.target.closest('[data-srcp]'); if (!s || !liveOwner()) return;
  const g = s.dataset.srcp; if (!SRCP_OPT[g] || !SRCP_OPT[g].includes(s.value)) return;
  const prev = Object.assign({}, SRCP), next = Object.assign({}, SRCP, {[g]: s.value});
  try { await srcpSave(next); try { s.blur(); } catch (err) {} srcpSet(next); toast(t('src_pSaved', {g: t('src_g_' + g), s: t('src_p_' + g + '_' + SRCP[g])})); }
  catch (err) { srcpSet(prev); srcRender(true); toast(t('src_pFail')); }
});
/* every link of every item: rename, change the address, reorder, delete, add, or go back to the default. Private to the developer */
var SRCLK = {}, SRL_MAX = 8;
Object.assign(SRC, {edit: null, draft: null, sure: null, msg: '', defs: {}});
function srlClean(items){
  const o = {};
  (Array.isArray(items) ? items : []).slice(0, 80).forEach(x => {
    const id = String(x && x.id || '').slice(0, 24); if (!/^[a-z]+(:[A-Za-z0-9]+)?$/.test(id)) return;
    o[id] = (Array.isArray(x.l) ? x.l : []).map(y => [String(y && y.n || '').trim().slice(0, 40), lnUrl(y && y.u)]).filter(y => y[1]).map(y => [y[0] || lnHost(y[1]), y[1]]).slice(0, SRL_MAX);
  });
  return o;
}
const srlPack = () => Object.keys(SRCLK).slice(0, 80).map(id => ({id, l: SRCLK[id].map(([n, u]) => ({n, u}))}));
const srlGet = (id, defs) => SRCLK[id] ? SRCLK[id] : defs;
async function srlLoad(){
  if (!liveOwner()){ SRCLK = {}; SRC.edit = null; return; }
  if (IN_CLAUDE){ const db = await lnDb(); if (db && LN.uid){ try { const d = await db.collection('data/users/' + LN.uid).doc('srclinks').get(); SRCLK = srlClean(d && d.exists ? (d.data() || {}).items : []); } catch (e) {} } }
  else { try { SRCLK = srlClean(JSON.parse(RAWLS.getItem('fin-srclinks') || '[]')); } catch (e) { SRCLK = {}; } }
  if (!SRC.edit) srcRender(true);
}
async function srlSave(){
  const items = srlPack();
  if (IN_CLAUDE){ const db = await lnDb(); if (!db || !LN.uid) throw new Error('db'); await db.collection('data/users/' + LN.uid).doc('srclinks').set({items, at: Date.now()}); }
  else RAWLS.setItem('fin-srclinks', JSON.stringify(items));
}
function srlHtml(id, defs, lk){
  SRC.defs[id] = defs;
  const cur = srlGet(id, defs), mine = SRCLK[id] != null;
  if (SRC.edit !== id) return `<div class="src-links">${cur.length ? cur.map(lk).join('') : `<small class="srl-none">${asEsc(t('srl_none'))}</small>`}<button type="button" class="srl-b srl-go" data-srl="edit" data-id="${asEsc(id)}">${asEsc(t('srl_edit'))}</button>${mine ? `<span class="srl-tag">${asEsc(t('srl_custom'))}</span>` : ''}</div>`;
  const d = SRC.draft || [], E = asEsc;
  let h = `<div class="srl-ed" data-id="${E(id)}">`;
  d.forEach((x, i) => {
    const sure = SRC.sure === 'd' + i;
    h += `<div class="srl-it"><small class="srl-no">${i + 1}</small>
      <input class="srl-n" data-i="${i}" maxlength="40" value="${E(x.n)}" placeholder="${E(t('srl_n'))}" aria-label="${E(t('srl_n') + ' ' + (i + 1))}" autocomplete="off">
      <input class="srl-u" data-i="${i}" dir="ltr" inputmode="url" autocapitalize="off" spellcheck="false" autocomplete="off" placeholder="https://" value="${E(x.u)}" aria-label="${E(t('srl_u') + ' ' + (i + 1))}">
      <div class="srl-acts"><button type="button" class="srl-b" data-srl="up" data-i="${i}" aria-label="${E(t('ln_up'))}"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" class="srl-b" data-srl="down" data-i="${i}" aria-label="${E(t('ln_down'))}"${i === d.length - 1 ? ' disabled' : ''}>↓</button><button type="button" class="srl-b del${sure ? ' sure' : ''}" data-srl="del" data-i="${i}">${E(t(sure ? 'srl_sure' : 'srl_del'))}</button></div></div>`;
  });
  if (!d.length) h += `<small class="srl-none">${E(t('srl_none'))}</small>`;
  h += `<div class="btnrow srl-bar"><button type="button" class="gold-btn" data-srl="save">${E(t('srl_save'))}</button><button type="button" class="mv" data-srl="add"${d.length >= SRL_MAX ? ' disabled' : ''}>${E(t('srl_add'))}</button>${mine ? `<button type="button" class="mv${SRC.sure === 'reset' ? ' sure' : ''}" data-srl="reset">${E(t(SRC.sure === 'reset' ? 'srl_resetSure' : 'srl_reset'))}</button>` : ''}<button type="button" class="mv" data-srl="cancel">${E(t('srl_cancel'))}</button></div>
    <small class="srl-msg" role="status">${E(SRC.msg || '')}</small></div>`;
  return h;
}
function srlFocus(sel){ setTimeout(() => { const el = $(sel); if (el){ try { el.focus({preventScroll: true}); } catch (e) { el.focus(); } el.scrollIntoView({block: 'center'}); } }, 30); }
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.classList || !(el.classList.contains('srl-n') || el.classList.contains('srl-u')) || !SRC.draft) return;
  const x = SRC.draft[+el.dataset.i]; if (x) x[el.classList.contains('srl-n') ? 'n' : 'u'] = el.value;
});
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-srl]'); if (!b || !liveOwner()) return;
  const a = b.dataset.srl, i = +b.dataset.i;
  if (a === 'edit'){ const id = b.dataset.id; SRC.edit = id; SRC.draft = srlGet(id, SRC.defs[id] || []).map(([n, u]) => ({n, u})); SRC.sure = null; SRC.msg = ''; srcRender(true); srlFocus('.srl-ed .srl-n'); return; }
  const id = SRC.edit; if (!id || !SRC.draft) return;
  const d = SRC.draft;
  if (a === 'cancel'){ SRC.edit = SRC.draft = SRC.sure = null; SRC.msg = ''; srcRender(true); return; }
  if (a === 'add'){ if (d.length >= SRL_MAX){ SRC.msg = t('srl_max', {n: SRL_MAX}); srcRender(true); return; } d.push({n: '', u: ''}); SRC.sure = null; SRC.msg = ''; srcRender(true); srlFocus(`.srl-n[data-i="${d.length - 1}"]`); return; }
  if (a === 'up' && i > 0){ [d[i - 1], d[i]] = [d[i], d[i - 1]]; SRC.sure = null; srcRender(true); return; }
  if (a === 'down' && i < d.length - 1){ [d[i + 1], d[i]] = [d[i], d[i + 1]]; SRC.sure = null; srcRender(true); return; }
  if (a === 'del'){ if (SRC.sure !== 'd' + i){ SRC.sure = 'd' + i; srcRender(true); return; } d.splice(i, 1); SRC.sure = null; SRC.msg = ''; srcRender(true); return; }
  const prev = SRCLK[id];
  if (a === 'reset'){
    if (SRC.sure !== 'reset'){ SRC.sure = 'reset'; srcRender(true); return; }
    delete SRCLK[id];
    try { await srlSave(); SRC.edit = SRC.draft = SRC.sure = null; SRC.msg = ''; srcRender(true); toast(t('srl_restored')); }
    catch (err) { SRCLK[id] = prev; SRC.sure = null; SRC.msg = t('srl_fail'); srcRender(true); }
    return;
  }
  if (a === 'save'){
    const out = [];
    for (let k = 0; k < d.length; k++){
      const n = String(d[k].n || '').trim().slice(0, 40), u0 = String(d[k].u || '').trim();
      if (!n && !u0) continue;
      const u = lnUrl(u0); if (!u){ SRC.msg = t('srl_bad', {n: k + 1}); srcRender(true); srlFocus(`.srl-u[data-i="${k}"]`); return; }
      out.push([n || lnHost(u), u]);
    }
    if (JSON.stringify(out) === JSON.stringify(SRC.defs[id] || [])) delete SRCLK[id]; else SRCLK[id] = out;
    try { await srlSave(); SRC.edit = SRC.draft = SRC.sure = null; SRC.msg = ''; srcRender(true); toast(t('srl_saved')); }
    catch (err) { if (prev) SRCLK[id] = prev; else delete SRCLK[id]; SRC.msg = t('srl_fail'); srcRender(true); }
  }
});
var SRL_OWN = null;
const liveApplySrl = liveApply;
liveApply = function(){
  const r = liveApplySrl.apply(this, arguments);
  if (SRL_OWN !== liveOwner()){ SRL_OWN = liveOwner(); srlLoad(); if (!IN_CLAUDE) srcpSite(); }
  return r;
};
setTimeout(srcpLoad, 500);
setTimeout(() => { SRL_OWN = null; liveApply(); }, 700);
setInterval(() => { if (!document.hidden && !IN_CLAUDE) srcpLoad(); }, 10 * 60000);

/* ================= saving on every screen: automatic or manual (switch any time), save now, discard, and clear this screen or everything ================= */
const SV_NAMES = {'fin-vals': 'sv_k_vals', 'fin-scn': 'sv_k_scn', 'fin-exp': 'sv_k_exp', 'fin-clients': 'sv_k_cl'};
const SV_IC = {
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>',
  bin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
  none: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/></svg>'
};
var SVU = {sure: '', sureT: null, open: null};
function svKind(id){
  if (id === 'expenses') return 'exp';
  if (id === 'clients') return 'cl';
  if (['home', 'settings', 'assist'].includes(id)) return '';
  const p = $('#panel-' + id); return p && $$('input[id],select[id]', p).some(e => e.type !== 'range' && !/^set_/.test(e.id) && !e.classList.contains('scn-name')) ? 'calc' : '';
}
function svTime(ms){ try { return new Intl.DateTimeFormat(locOf(), {hour: '2-digit', minute: '2-digit'}).format(new Date(ms)); } catch (e) { return ''; } }
function svBarHtml(){
  const man = SV.mode === 'manual', none = SV.mode === 'none', dirty = man && SV.pend.size > 0, E = asEsc;
  const what = [...SV.pend.keys()].map(k => t(SV_NAMES[k] || 'sv_k_vals')).filter((x, i, a) => a.indexOf(x) === i).join(', ');
  const st = dirty ? `<span class="sv-dot" aria-hidden="true"></span>${E(t('sv_stDirty', {w: what}))}`
    : none ? `<span class="sv-dot none" aria-hidden="true"></span>${E(t(SV.pend.size ? 'sv_stNoneDirty' : 'sv_stNone'))}` : man ? E(t('sv_stClean')) : SV.at ? E(t('sv_stAutoAt', {t: svTime(SV.at)})) : E(t('sv_stAuto'));
  return `<div class="sv-row"><div class="sv-seg" role="radiogroup" aria-label="${E(t('sv_mode'))}">
      <button type="button" role="radio" aria-checked="${!man && !none}" data-sv="auto">${SV_IC.auto}<span>${E(t('sv_auto'))}</span></button><button type="button" role="radio" aria-checked="${man}" data-sv="manual">${SV_IC.hand}<span>${E(t('sv_manual'))}</span></button><button type="button" role="radio" aria-checked="${none}" data-sv="none">${SV_IC.none}<span>${E(t('sv_none'))}</span></button></div>
    <span class="sv-gap"></span>
    ${man ? `<button type="button" class="sv-save${dirty ? ' dirty' : ''}" data-sv="save"${dirty ? '' : ' disabled'}>${E(t('sv_save'))}</button>` : ''}
    <button type="button" class="sv-clear" data-sv="clear">${SV_IC.bin}<span>${E(t('sv_clear'))}</span></button></div>
    <div class="sv-st${dirty ? ' dirty' : ''}${none ? ' none' : ''}" role="status">${st}${dirty ? ` <button type="button" class="sv-link${SVU.sure === 'discard' ? ' sure' : ''}" data-sv="discard">${E(t(SVU.sure === 'discard' ? 'sv_discardSure' : 'sv_discard'))}</button>` : ''}</div>`;
}
function svInject(){
  $$('section.panel[id^="panel-"]').forEach(p => {
    if (p.querySelector(':scope > .svbar')) return;
    p.insertAdjacentHTML('afterbegin', `<div class="svbar" data-svp="${asEsc(p.id.slice(6))}"></div>`);
  });
}
function svUi(){
  try { svInject(); } catch (e) {}
  const h = svBarHtml();
  [...document.getElementsByClassName('svbar')].forEach(b => { if (b.dataset.h !== h && !(b.parentNode && b.parentNode.hidden)){ b.innerHTML = h; b.dataset.h = h; } });   // hidden screens get their bar when they open (13.25: faster start)
  const s = $('#set_saveMode'); if (s && s.value !== SV.mode) s.value = SV.mode;
}
function svMode(m, quiet){
  m = m === 'manual' || m === 'none' ? m : 'auto';
  const prev = SV.mode; SV.mode = m; SET.saveMode = m; SET.remember = '1';
  try { saveSet(); } catch (e) {}
  if (prev !== 'auto' && m === 'auto') svSave(true);                  // switching to automatic keeps what was waiting
  svKeep();
  if (!quiet && prev !== m) toast(t(m === 'auto' ? 'sv_toAuto' : m === 'none' ? 'sv_toNone' : 'sv_toManual'));
}
function svSave(quiet){
  try { clearTimeout(svT); saveVals(); } catch (e) {}                 // take the last keystrokes too
  if (!SV.pend.size){ svKeep(); if (!quiet) toast(t('sv_nothing')); return false; }
  SV.direct = true;
  try { SV.pend.forEach((v, k) => { if (v == null) LS_RAW.removeItem(k); else LS_RAW.setItem(k, v); }); SV.pend.clear(); }
  finally { SV.direct = false; }
  SV.at = Date.now(); svKeep();
  if (!quiet) toast(t('sv_doneSave'));
  return true;
}
function svReload(keys){
  TABS.forEach(id => { try { resetPanel(id); } catch (e) {} });
  if (keys.includes('fin-scn')) SCN = {};
  try { liveApplyKeys(keys); } catch (e) {}
  try { $$('details.scn[data-tab]').forEach(b => renderScn(b.dataset.tab)); } catch (e) {}
  try { if (tab === 'expenses') expRender(); else if (tab === 'clients') clRender(); else calc(tab); } catch (e) {}
}
function svDiscard(){
  if (!SV.pend.size) return;
  const keys = [...SV.pend.keys()];
  SV.pend.clear(); svKeep(); svReload(['fin-vals', 'fin-scn', 'fin-exp', 'fin-clients'].filter(k => keys.includes(k) || k === 'fin-vals'));
  toast(t('sv_discarded'));
}
/* change what is stored (and what is waiting to be saved) at once, whatever the mode: clearing is never left half-done */
function svRaw(k, fn){
  SV.direct = true;
  try {
    if (!fn){ LS_RAW.removeItem(k); SV.pend.delete(k); }
    else {
      let o = {}; try { o = JSON.parse(LS_RAW.getItem(k) || '{}') || {}; } catch (e) {}
      const raw = JSON.stringify(fn(o)); LS_RAW.setItem(k, raw);
      if (SV.pend.has(k) && SV.pend.get(k) != null){ let q = {}; try { q = JSON.parse(SV.pend.get(k)) || {}; } catch (e) {} const v = JSON.stringify(fn(q)); if (v === raw) SV.pend.delete(k); else SV.pend.set(k, v); }
    }
  } finally { SV.direct = false; }
  SV.at = Date.now(); svKeep();
}
function svClearScreen(id){
  const kind = svKind(id);
  if (kind === 'calc'){
    const p = $('#panel-' + id), ids = $$('input[id],select[id]', p).map(e => e.id);
    try { resetPanel(id); } catch (e) {}
    TOUCHED = TOUCHED.filter(x => x !== id);
    svRaw('fin-vals', o => { ids.forEach(k => { delete o[k]; }); if (o.__touched != null) o.__touched = String(o.__touched).split(',').filter(x => x && x !== id).join(','); return o; });
    svRaw('fin-scn', o => { delete o[id]; return o; });
    delete SCN[id];
    try { clearTimeout(svT); saveVals(); saveScn(); } catch (e) {}
    try { renderScn(id); } catch (e) {}
    try { calc(id); } catch (e) {}
  } else if (kind === 'exp'){ svRaw('fin-exp', null); EXP = null; try { expRender(); } catch (e) {} }
  else if (kind === 'cl'){ svRaw('fin-clients', null); CL = null; try { clRender(); } catch (e) {} }
}
function svClearAll(){
  SAVE_KEYS.forEach(k => svRaw(k, null));
  SCN = {}; TOUCHED = []; EXP = null; CL = null;
  svReload(SAVE_KEYS.slice());
}
/* the clear sheet: this screen, or everything */
function svOpen(id){
  SVU.open = id; SVU.sure = '';
  if (!$('#svx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="svx" hidden><div class="cp-box sv-box" role="dialog" aria-modal="true" aria-labelledby="svx_t"><div class="cp-top"><h3 id="svx_t"></h3><button type="button" class="cp-x" id="svx_x">×</button></div><div id="svx_b"></div></div></div>`);
  svSheet();
  $('#svx').hidden = false; document.body.classList.add('cp-lock');
  setTimeout(() => { const b = $('#svx [data-svc]'); if (b) b.focus(); }, 40);
}
function svSheet(){
  const id = SVU.open, kind = svKind(id), E = asEsc, name = t('tab_' + id);
  $('#svx_t').textContent = t('sv_clT'); $('#svx_x').setAttribute('aria-label', t('sv_close'));
  const opt = (k, title, desc, danger) => `<button type="button" class="sv-opt${danger ? ' danger' : ''}${SVU.sure === k ? ' sure' : ''}" data-svc="${k}"><b>${E(SVU.sure === k ? t('sv_clSure') : title)}</b><small>${E(desc)}</small></button>`;
  let h = '';
  if (kind) h += opt('screen', t('sv_clScreen', {n: name}), t(kind === 'exp' ? 'sv_clScrExp' : kind === 'cl' ? 'sv_clScrCl' : 'sv_clScrCalc'));
  else h += `<p class="fine sv-none">${E(t('sv_clNone'))}</p>`;
  h += opt('all', t('sv_clAll'), t('sv_clAllD'), true);
  h += `<p class="fine sv-warn">${E(t('sv_clWarn'))}</p><div class="btnrow"><button type="button" class="mv wide" data-svc="cancel">${E(t('sv_cancel'))}</button></div>`;
  $('#svx_b').innerHTML = h;
}
function svClose(){ const o = $('#svx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } SVU.open = null; SVU.sure = ''; const b = $(`#panel-${tab} .sv-clear`); if (b) try { b.focus(); } catch (e) {} }
function svSure(k){ SVU.sure = k; clearTimeout(SVU.sureT); SVU.sureT = setTimeout(() => { SVU.sure = ''; if (SVU.open) svSheet(); svUi(); }, 5000); }
document.addEventListener('click', e => {
  const c = e.target.closest('[data-svc]');
  if (c){
    const k = c.dataset.svc, id = SVU.open;
    if (k === 'cancel'){ svClose(); return; }
    if (SVU.sure !== k){ svSure(k); svSheet(); return; }                 // every clear takes a second tap
    svClose();
    if (k === 'screen'){ svClearScreen(id); toast(t('sv_clDoneS')); }
    else { svClearAll(); toast(t('sv_clDoneA')); }
    svUi(); return;
  }
  if (e.target.closest('#svx_x') || e.target.id === 'svx'){ svClose(); return; }
  const b = e.target.closest('.svbar [data-sv]'); if (!b) return;
  const a = b.dataset.sv;
  if (a === 'auto' || a === 'manual' || a === 'none') svMode(a);
  else if (a === 'save') svSave();
  else if (a === 'clear') svOpen(b.closest('.svbar').dataset.svp);
  else if (a === 'discard'){ if (SVU.sure !== 'discard'){ svSure('discard'); svUi(); return; } SVU.sure = ''; svDiscard(); }
  svUi();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && SVU.open){ e.preventDefault(); svClose(); return; }
  if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey) && !e.altKey){ e.preventDefault(); if (SV.mode === 'manual') svSave(); else toast(t(SV.mode === 'none' ? 'sv_stNone' : 'sv_stAuto')); svUi(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ const r = e.target.closest && e.target.closest('.sv-seg [role=radio]'); if (r){ e.preventDefault(); const M = ['auto', 'manual', 'none'], i = M.indexOf(SV.mode), rtl = document.documentElement.dir === 'rtl'; svMode(M[(i + ((e.key === 'ArrowLeft') === rtl ? 1 : 2)) % 3]); svUi(); const n = $(`#panel-${tab} .sv-seg [aria-checked="true"]`); if (n) n.focus(); } }
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_saveMode'){ svMode(e.target.value); svUi(); } });
window.addEventListener('beforeunload', e => { if (SV.mode === 'manual' && SV.pend.size){ e.preventDefault(); e.returnValue = ''; } });
/* settings that arrive from your other devices carry the save mode too */
const liveApplyKeysSv = liveApplyKeys;
liveApplyKeys = function(keys){ const r = liveApplyKeysSv.apply(this, arguments); try { SET.remember = '1'; if (SET.saveMode !== SV.mode) svMode(SET.saveMode, true); svUi(); } catch (e) {} return r; };
/* the reset buttons in settings act at once, in either mode */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#set_clear, #set_resetcalcs'); if (!b) return;
  SV.direct = true;
  setTimeout(() => {
    try { if (b.id === 'set_clear'){ SAVE_KEYS.forEach(k => svRaw(k, null)); EXP = null; CL = null; } else { clearTimeout(svT); saveVals(); } } catch (err) {}
    SV.direct = false; svKeep();
  }, 0);
}, true);
const _alSv = applyLang;
applyLang = function(){ const r = _alSv.apply(this, arguments); try { $$('.svbar').forEach(b => { b.dataset.h = ''; }); svUi(); if (SVU.open) svSheet(); } catch (e) {} return r; };
svUi();
setInterval(() => { if (!document.hidden && SV.mode === 'auto' && SV.at) svUi(); }, 30000);

/* ================= AI built into every screen: the built-in model always, Claude when this view may ask it, Gemini with your own key ================= */
var CAI = {fn: null, tools: false, denied: false};
function claudeOk(){ return typeof CAI === 'object' && !!CAI && !!CAI.fn && !CAI.denied; }     // called early, before this module has run
async function claudeAsk(input, opts){
  try { const r = await CAI.fn(input, Object.assign({modelTier: 'default', cache: false}, opts || {})); return String((r && r.text) || '').trim(); }
  catch (e) { if (e && e.code === 'not_granted'){ CAI.denied = true; try { engRender(); aiFabSync(); } catch (x) {} } throw e; }
}
function aiCodeText(c){ return t(c === 'rate_limited' ? 'ai_busy' : c === 'not_granted' || c === 'sampling_disabled' ? 'ai_denied' : c === 'session_expired' ? 'ai_signin' : c === 'refused' ? 'ai_refused' : 'as_err', {e: c}); }
/* Claude is not used: the app's own personal AI answers everywhere */
/* what the AI can see on the current screen: fields with their ids, values and options, and the results */
function aiFields(id){
  const p = $('#panel-' + id); if (!p) return [];
  return $$('input[id],select[id],textarea[id]', p).filter(e => e.type !== 'range' && e.type !== 'search' && !e.classList.contains('scn-name') && !/^(set_|as_|ai_|dev_|acc_|ln_|srl|lk_from|lk_to)/.test(e.id)).map(e => {
    const f = e.closest('.field, .lk-c, .sentence'), l = f && ($('label', f) || null), u = f && $('.u', f);
    const lab = exClean(l ? l.textContent : e.getAttribute('aria-label') || e.dataset.ia && t(e.dataset.ia) || e.id);
    const o = {id: e.id, label: lab, value: e.value, shown: !(e.closest('[hidden]'))};
    if (e.tagName === 'SELECT') o.options = [...e.options].map(x => [x.value, exClean(x.textContent)]);
    else { o.type = e.type === 'date' ? 'date' : (e.type === 'number' || /decimal|numeric/.test(e.inputMode || '')) ? 'number' : 'text'; if (u) o.unit = exClean(u.textContent); }
    return o;
  }).slice(0, 70);
}
function aiScreenText(id){
  const name = t('tab_' + id), fs = aiFields(id), res = exResults(id);
  let s = 'Screen: ' + name + ' (id ' + id + ')' + (T['d_' + id] ? '\nWhat it does: ' + t('d_' + id) : '');
  if (fs.length) s += '\nFields (id | label | current value' + ' | options or unit):\n' + fs.map(f => '- ' + f.id + ' | ' + f.label + ' | ' + (f.value === '' ? '(empty)' : f.value) + (f.options ? ' | options: ' + f.options.map(o => o[0] + '=' + o[1]).join(', ') : f.unit ? ' | ' + f.unit : '') + (f.shown ? '' : ' | hidden now')).join('\n');
  if (res) s += '\nCurrent result: ' + res.main + '\n' + res.rows.map(x => '- ' + x).join('\n') + (res.note ? '\nNote: ' + res.note : '') + (res.warn ? '\nWarning: ' + res.warn : '');
  if (id === 'home'){ const L = aiMine(); if (L.length) s += '\nCalculators the person filled in, with their results:\n' + L.map(x => '- ' + x).join('\n'); }
  if (id === 'expenses'){ const e = aiExpSummary(); if (e) s += '\n' + e; }
  return s;
}
function aiMine(){ return (TOUCHED || []).filter(x => LAST[x] && LAST[x].hero).slice(0, 12).map(x => t('tab_' + x) + ': ' + exClean(LAST[x].hero.label) + ' ' + exClean(LAST[x].hero.value)); }
function aiExpSummary(){
  try {
    const d = expData(), ym = (typeof EXP_M === 'string' && EXP_M) || ymOf(new Date()), it = d.items.filter(x => String(x.date || '').slice(0, 7) === ym);
    if (!it.length) return '';
    const by = {}; it.forEach(x => { by[x.cat] = (by[x.cat] || 0) + (+x.amt || 0); });
    const tot = Object.values(by).reduce((a, b) => a + b, 0), inc = +(d.income || {})[ym] || 0;
    return 'Expenses in ' + ym + ': total ' + MI(tot) + (inc ? ', income ' + MI(inc) : '') + '\nBy category: ' + Object.keys(by).sort((a, b) => by[b] - by[a]).map(k => t('ec_' + k) + ' ' + MI(by[k]) + (d.budgets && d.budgets[k] ? ' (budget ' + MI(d.budgets[k]) + ')' : '')).join(', ');
  } catch (e) { return ''; }
}
function aiAllScreens(){ return TABS.filter(x => !['assist'].includes(x)).map(x => x + '=' + t('tab_' + x)).join('; '); }
function aiRules(){
  return 'You are the AI built into a personal-finance calculator app used in Israel (2026 tax figures). Reply in ' + exLangName() + ' unless the person writes in another language. ' +
    'Keep answers short (about 40-150 words), plain sentences, "- " bullets and **bold** only; no tables or headings. Use the person\'s numbers from the screen. The app\'s own results are correct for its inputs — explain them, never recompute tax rates or invent figures that are not shown. ' +
    'When a field should change, use the tool set_fields with field ids and option values exactly as listed (numbers as plain digits, no commas or units). To go to another calculator use open_screen with its id, then set its fields. After a change, say in one or two lines what changed in the result. ' +
    'Mention another calculator as [[id]] when it fits. This is general information, not personal financial advice; say so briefly only when you recommend something. ' +
    'All screens: ' + aiAllScreens() + '.';
}
/* changes made by the AI can always be undone */
var AIX = {open: false, hist: [], busy: false, ctl: null, undo: [], fill: false, pending: null};
function aiApply(id, changes){
  const p = $('#panel-' + id); if (!p) return {applied: [], skipped: changes.map(c => c.id)};
  const prev = [], applied = [], skipped = [];
  const list = changes.slice().sort((a, b) => { const A = document.getElementById(a.id), B = document.getElementById(b.id); return (B && B.tagName === 'SELECT') - (A && A.tagName === 'SELECT'); });
  list.forEach(c => {
    const el = document.getElementById(String(c.id)); if (!el || !p.contains(el) || /^(set_|dev_|acc_)/.test(el.id)){ skipped.push(String(c.id)); return; }
    let val = c.value;
    if (el.tagName === 'SELECT'){ const opt = [...el.options].find(o => o.value === String(val)) || [...el.options].find(o => exClean(o.textContent) === exClean(String(val))); if (!opt){ skipped.push(el.id); return; } val = opt.value; }
    else if (el.type === 'number' || /decimal|numeric/.test(el.inputMode || '')){ const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[,\s₪$%]/g, '')); if (!isFinite(n)){ skipped.push(el.id); return; } val = String(Math.round(n * 1e6) / 1e6); }
    else val = String(val).slice(0, 120);
    if (el.value === val) return;
    prev.push({id: el.id, value: el.value}); el.value = val; applied.push(el.id);
    el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true}));
  });
  try { syncRanges(); } catch (e) {}
  try { calc(id); } catch (e) {}
  if (prev.length) AIX.undo.push({id, prev});
  return {applied, skipped};
}
function aiUndo(){
  const u = AIX.undo.pop(); if (!u) return;
  if (tab !== u.id) activate(u.id);
  u.prev.forEach(x => { const el = document.getElementById(x.id); if (el){ el.value = x.value; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); } });
  try { syncRanges(); calc(u.id); } catch (e) {}
  aiLog('ai', t('ai_undone')); aiOpenFor(tab, true);
}
/* the built-in model fills a calculator from plain words: "salary 18,000, 2 kids, pension 6%" */
const AI_NUMW = {'אחד': 1, 'אחת': 1, 'שניים': 2, 'שתיים': 2, 'שני': 2, 'שתי': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6, 'שבע': 7, 'שבעה': 7, 'שמונה': 8, 'תשע': 9, 'תשעה': 9, 'עשר': 10, 'עשרה': 10, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5};
const AI_SYN = {'משכורת': 'שכר', 'תלוש': 'שכר', 'מרוויח': 'שכר', 'מרוויחה': 'שכר', 'salary': 'שכר', 'ילד': 'ילדים', 'שנה': 'שנים', 'תקופה': 'שנים', 'מחיר': 'מחיר', 'עולה': 'מחיר', 'תשואה': 'תשואה', 'ריבית': 'ריבית', 'הפקדה': 'הפקדה', 'מפקיד': 'הפקדה', 'חוסך': 'הפקדה', 'פנסיה': 'פנסיה', 'גמל': 'פנסיה'};
function aiForms(w){ const f = new Set([w]); if (AI_SYN[w]) f.add(AI_SYN[w]); if (/^[ובהלמשכ][א-ת]{3,}$/.test(w)){ const s = w.slice(1); f.add(s); if (AI_SYN[s]) f.add(AI_SYN[s]); } if (/^(וה|וב|ול|שה|מה|כש)[א-ת]{3,}$/.test(w)) f.add(w.slice(2)); if (/^[א-ת]{4,}(ים|ות)$/.test(w)) f.add(w.slice(0, -2)); return [...f]; }
function aiWordsMatch(a, b){ return a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 3 && Math.abs(a.length - b.length) <= 2); }
function aiParseFill(text, id){
  const fs = aiFields(id), nums = fs.filter(f => f.type === 'number'), sels = fs.filter(f => f.options);
  const out = new Map(), used = new Set();
  const clauses = String(text).split(/[,;\n]|\s+ו(?=\d)|\s+and\s+/);
  clauses.forEach(cl => {
    const toks = [], re = /(\d[\d,]*(?:\.\d+)?)\s*(אלף|אלפים|k|K|מיליון|מליון|מיל'|m|M)?\s*(%|אחוז|אחוזים)?|([^\s\d]+)/g;
    let m;
    while ((m = re.exec(cl))){
      if (m[1]){ let n = parseFloat(m[1].replace(/,/g, '')); const mul = m[2] || ''; if (/אלף|אלפים|k/i.test(mul)) n *= 1000; else if (mul) n *= 1e6; toks.push({n, pct: !!m[3]}); }
      else { const w = pmNorm(m[4]).trim(); if (!w) continue; if (AI_NUMW[w] != null) toks.push({n: AI_NUMW[w], pct: false, word: true}); else if (!PM_STOP.has(w)) toks.push({w}); }
    }
    toks.forEach((tk, i) => {
      if (tk.n == null) return;
      const ctx = []; for (let j = i - 1; j >= Math.max(0, i - 4) && toks[j].w; j--) ctx.push(toks[j].w); for (let j = i + 1; j <= Math.min(toks.length - 1, i + 2) && toks[j].w; j++) ctx.push(toks[j].w);
      let best = null, bs = 0;
      nums.forEach(f => {
        if (used.has(f.id)) return;
        const lw = pmNorm(f.label + ' ' + (f.unit || '')).trim().split(' ').filter(x => x.length >= 2);
        let s = 0; ctx.forEach(c => { const cf = aiForms(c); if (lw.some(l => aiForms(l).some(lf => cf.some(x => aiWordsMatch(x, lf))))) s += 1; });
        if (tk.pct) s += f.unit && /%/.test(f.unit) ? 0.8 : -0.6;
        if (f.shown) s += 0.1;
        if (s > bs){ bs = s; best = f; }
      });
      if (best && bs >= 0.9){ out.set(best.id, {id: best.id, value: tk.n, label: best.label, old: best.value}); used.add(best.id); }
    });
  });
  if (!out.size){                                                       // one bare number goes to the screen's main field
    const all = [...String(text).matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(אלף|k|מיליון)?/gi)];
    const main = nums.find(f => f.shown);
    if (all.length === 1 && main){ let n = parseFloat(all[0][1].replace(/,/g, '')); if (/אלף|k/i.test(all[0][2] || '')) n *= 1000; else if (all[0][2]) n *= 1e6; out.set(main.id, {id: main.id, value: n, label: main.label, old: main.value}); }
  }
  const nt = ' ' + pmNorm(text) + ' ';
  sels.forEach(f => {
    let best = null, bs = 0;
    f.options.forEach(([val, lab]) => {
      const lw = pmNorm(lab).trim().split(' ').filter(x => x.length >= 3 && !PM_STOP.has(x)); if (!lw.length) return;
      const hit = lw.filter(l => nt.split(' ').some(w => w && aiForms(w).some(x => aiWordsMatch(x, l)))).length;
      if (hit === lw.length && hit > bs){ bs = hit; best = [val, lab]; }
    });
    const uniq = best && f.options.filter(([v, l]) => pmNorm(l).includes(pmNorm(best[1]).trim())).length === 1;
    if (best && uniq && best[0] !== f.value) out.set(f.id, {id: f.id, value: best[0], label: f.label, old: (f.options.find(o => o[0] === f.value) || [])[1] || f.value, shownVal: best[1]});
  });
  return [...out.values()];
}
const AI_FILL = /(^|\s)(מלא|תמלא|תמלאי|תכניס|הכנס|תשנה|שנה|תעדכן|עדכן|הגדר|תגדיר|תשים|שים|set|fill|change|update|put|املأ|غيّر|ضع)(\s|$)/i;
const AI_ACT = /(מלא|תמלא|תכניס|הכנס|תשנה|שנה את|תעדכן|עדכן|הגדר|תגדיר|פתח|תפתח|עבור ל|תעבור|set|fill|change|open|املأ|غيّر|افتح)|\d/;
/* the AI sheet */
function aiEnsure(){
  if ($('#aix')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="aix" hidden><div class="cp-box ai-box" role="dialog" aria-modal="true" aria-labelledby="aix_t">
    <div class="cp-top"><h3 id="aix_t"></h3><button type="button" class="cp-x" id="aix_x">×</button></div>
    <div class="ai-engrow"><label for="aix_eng" id="aix_engl"></label><select id="aix_eng"></select><span class="fine" id="aix_now"></span></div>
    <div class="ai-chips" id="aix_chips"></div>
    <div class="ai-log" id="aix_log" aria-live="polite"></div>
    <form class="ai-ask" id="aix_form"><input id="aix_q" autocomplete="off" enterkeyhint="send"><button type="submit" class="gold-btn" id="aix_send"></button><button type="button" class="mv" id="aix_stop" hidden></button></form>
    <p class="fine ai-note" id="aix_note"></p></div></div>`);
}
function aiEngSync(){
  const s = $('#aix_eng'); if (!s) return;
  const opts = ['auto', 'personal'].concat(CAI.fn ? ['claude'] : [], IN_CLAUDE ? [] : ['gemini']), cur = opts.includes(SET.aiEngine) ? SET.aiEngine : 'auto';
  s.innerHTML = opts.map(o => `<option value="${o}"${o === cur ? ' selected' : ''}>${asEsc(o === 'personal' ? pmName() : t('eng_' + o))}</option>`).join('');
  const pk = aiPick(); $('#aix_now').textContent = t('as_engNow', {n: pk === 'personal' ? pmName() : pk === 'claude' ? 'Claude' : 'Gemini'});
  $('#aix_note').textContent = t(pk === 'claude' ? 'ai_noteClaude' : pk === 'gemini' ? 'ai_noteGemini' : 'ai_noteLocal');
}
function aiChipKeys(id){ return id === 'home' ? ['ai_cHome', 'ai_cWhich'] : id === 'expenses' ? ['ai_cExp', 'ai_cWhich'] : ['settings', 'clients', 'assist'].includes(id) ? ['ai_cWhich'] : ['ai_cExplain', 'ai_cImpact', 'ai_cFill', 'ai_cImprove']; }
function aiOpenFor(id, keep){
  aiEnsure();
  if (!keep || AIX.screen !== id){ if (AIX.screen !== id) AIX.hist = []; }
  AIX.screen = id;
  $('#aix_t').textContent = t('ai_title', {n: t('tab_' + id)});
  $('#aix_x').setAttribute('aria-label', t('cp_close')); $('#aix_engl').textContent = t('f_aiEngine');
  $('#aix_q').placeholder = t(AIX.fill ? 'ai_fillPh' : 'ai_ph'); $('#aix_send').textContent = t('ai_send'); $('#aix_stop').textContent = t('ai_stop');
  $('#aix_chips').innerHTML = aiChipKeys(id).map(k => `<button type="button" class="as-chip" data-aic="${k}">${asEsc(t(k))}</button>`).join('');
  aiEngSync();
}
function aiOpen(){
  aiOpenFor(tab);
  $('#aix').hidden = false; document.body.classList.add('cp-lock'); AIX.open = true; AIX.opener = document.activeElement;
  if (!$('#aix_log').children.length) aiLog('ai', t(aiChipKeys(tab).length > 2 ? 'ai_helloCalc' : 'ai_hello', {n: t('tab_' + tab)}));
  setTimeout(() => { const q = $('#aix_q'); if (q) q.focus({preventScroll: true}); }, 60);
}
function aiClose(){ if (AIX.ctl) try { AIX.ctl.abort(); } catch (e) {} const o = $('#aix'); if (o) o.hidden = true; document.body.classList.remove('cp-lock'); AIX.open = false; AIX.fill = false; if (AIX.opener && AIX.opener.focus) try { AIX.opener.focus(); } catch (e) {} }
function pmLinkify(h){ return h.replace(/(https:\/\/[a-z]{2,3}\.wikipedia\.org\/[^\s<"]+)/g, u => `<a class="src-a" href="${u}" target="_blank" rel="noopener noreferrer">${asEsc(t('pmx_wikiLink'))} ↗</a>`); }
function aiRich(s){ return pmLinkify(exFmt(s)).replace(/\[\[([a-z0-9]+)(?:\|([^\]]*))?\]\]/g, (_, c, f) => TABS.includes(c) && c !== 'assist' ? `<button type="button" class="as-go" data-aigo="${c}"${f ? ` data-aifill="${f}"` : ''}>${asEsc(f ? t('pm_openWith', {n: t('tab_' + c)}) : t('tab_' + c))}</button>` : ''); }
function aiLog(role, text, html){
  const log = $('#aix_log'); if (!log) return null;
  const d = document.createElement('div'); d.className = 'ai-m ' + role;
  if (html != null) d.innerHTML = html; else if (role === 'user') d.textContent = text; else d.innerHTML = aiRich(text);
  log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
}
function aiBusy(on){ AIX.busy = on; const s = $('#aix_send'), st = $('#aix_stop'); if (s) s.disabled = on; if (st) st.hidden = !on; }
function aiPropose(id, ch, intro){
  if (!ch.length) return aiLog('ai', t('ai_noFill'));
  AIX.pending = {id, ch};
  const fmt = c => { const el = document.getElementById(c.id); const u = el && el.closest('.field') && $('.u', el.closest('.field')); return (c.shownVal || (typeof c.value === 'number' ? N(c.value, null, 2) : String(c.value))) + (u && !c.shownVal ? ' ' + exClean(u.textContent) : ''); };
  aiLog('ai', '', `<p>${asEsc(intro || t('ai_prop'))}</p><ul class="ai-ch">${ch.map(c => `<li><b>${asEsc(c.label)}</b>: <span class="ai-old">${asEsc(c.old === '' || c.old == null ? '—' : isFinite(+c.old) && !c.shownVal ? N(+c.old, null, 2) : String(c.old))}</span> ← <span class="ai-new">${asEsc(fmt(c))}</span></li>`).join('')}</ul><div class="btnrow"><button type="button" class="gold-btn" data-aia="apply">${asEsc(t('ai_apply'))}</button><button type="button" class="mv" data-aia="drop">${asEsc(t('ai_cancel'))}</button></div>`);
}
function aiAfterApply(id, r){
  const res = exResults(id);
  aiLog('ai', '', `<p>${asEsc(t('ai_applied', {n: r.applied.length}))}${res ? ' <b>' + asEsc(res.main) + '</b>' : ''}</p><div class="btnrow"><button type="button" class="mv" data-aia="undo">${asEsc(t('ai_undo'))}</button></div>`);
}
/* one question to whichever engine answers */
async function aiAsk(q, kind){
  q = String(q || '').trim(); if (!q || AIX.busy) return;
  const id = tab, eng = aiPick(), fill = AIX.fill || kind === 'fill';
  AIX.fill = false; $('#aix_q').placeholder = t('ai_ph');
  aiLog('user', q);
  if (eng === 'personal' || (eng === 'gemini' && !gemKey())) return aiLocal(id, q, kind, fill);
  const ctx = aiScreenText(id), act = fill || (kind !== 'explain' && kind !== 'impact' && kind !== 'improve' && AI_ACT.test(q) && aiChipKeys(id).length > 2);
  const sens = kind === 'impact' || kind === 'improve' ? '\n' + aiSensText(id, true) : '';
  const prompt = kind === 'explain' ? exAsk('all', id) : kind === 'impact' ? ctx + sens + '\n\nWhich of the inputs above change the result the most? Name the top 3, and for each say roughly how the result moves, using the person\'s numbers. Short.' :
    kind === 'improve' ? ctx + sens + '\n\nGive 2-4 practical, specific ways the person could improve this result (for example, inputs they control), with the effect in their numbers when the screen shows it. Short.' : ctx + '\n\nThe person writes: ' + q;
  const turn = (AIX.hist.length ? '' : aiRules() + '\n\n') + prompt;
  const msgs = AIX.hist.concat([{role: 'user', content: turn}]);
  const out = aiLog('ai', '', `<p class="ex-wait">${asEsc(t('as_think'))}</p>`);
  aiBusy(true); AIX.ctl = new AbortController();
  try {
    let text = '';
    if (eng === 'claude'){
      const opts = {signal: AIX.ctl.signal, onText: ({text}) => { out.innerHTML = aiRich(text); $('#aix_log').scrollTop = 1e9; }};
      if (act && CAI.tools){
        opts.modelTier = 'quick';
        opts.tools = [
          {name: 'set_fields', description: 'Change input fields on the CURRENT screen and recalculate. Returns which fields changed and the new result. Use the exact field ids and option values from the screen description.',
            inputSchema: {type: 'object', properties: {fields: {type: 'object', description: 'Map of field id to the new value (number for numeric fields, option value for selects).'}}, required: ['fields']},
            execute: (inp, c) => { if (c && c.signal && c.signal.aborted) throw new Error('stopped'); const f = inp && typeof inp.fields === 'object' && inp.fields ? inp.fields : {}; const r = aiApply(tab, Object.keys(f).slice(0, 40).map(k => ({id: k, value: f[k]}))); if (r.applied.length) setTimeout(() => aiAfterApply(tab, r), 0); return {changed: r.applied, notFound: r.skipped, result: exResults(tab)}; }},
          {name: 'open_screen', description: 'Switch the app to another screen by its id (from the list of all screens). Returns that screen\'s fields and result so you can set them next.',
            inputSchema: {type: 'object', properties: {id: {type: 'string'}}, required: ['id']},
            execute: (inp) => { const s = String(inp && inp.id || ''); if (!TABS.includes(s) || s === 'assist') throw new Error('unknown screen ' + s); activate(s); aiOpenFor(s, true); aiLog('ai', t('ai_moved', {n: t('tab_' + s)})); return aiScreenText(s); }}
        ];
      } else opts.modelTier = 'default';
      text = await claudeAsk(msgs, opts);
    } else {
      if (act){
        const j = await gemChat([{role: 'user', content: turn + '\n\nReply with ONLY a JSON object: {"fields": {"<field id>": <new value>}, "reply": "<one short sentence for the person>"}. Use {} for fields when nothing should change.'}]);
        const m = String(j).match(/\{[\s\S]*\}/); let o = null; try { o = m && JSON.parse(m[0]); } catch (e) {}
        out.remove();
        if (o && o.fields && typeof o.fields === 'object' && Object.keys(o.fields).length){
          const fs = aiFields(id), ch = Object.keys(o.fields).map(k => { const f = fs.find(x => x.id === k); return f ? {id: k, value: o.fields[k], label: f.label, old: f.options ? ((f.options.find(x => x[0] === f.value) || [])[1] || f.value) : f.value, shownVal: f.options ? (f.options.find(x => x[0] === String(o.fields[k])) || [])[1] : ''} : null; }).filter(Boolean);
          aiPropose(id, ch, o.reply || '');
        } else aiLog('ai', (o && o.reply) || String(j));
        AIX.hist = msgs.concat([{role: 'assistant', content: String(j)}]).slice(-10);
        return;
      }
      text = await gemChat(msgs);
    }
    out.innerHTML = aiRich(text || t('as_empty'));
    AIX.hist = msgs.concat([{role: 'assistant', content: text || '…'}]).slice(-10);
  } catch (e) {
    if (e && (e.code === 'cancelled' || e.name === 'AbortError')){ if (!(e.text)) out.remove(); else out.innerHTML = aiRich(e.text); return; }
    if (e && e.code === 'not_granted'){ out.remove(); aiLog('ai', t('ai_denied')); aiEngSync(); return aiLocal(id, q, kind, fill, true); }
    out.innerHTML = `<p class="ex-err">${asEsc(aiErrText(e) || (e && e.code ? aiCodeText(e.code) : t('as_err', {e: (e && e.message) || ''})))}</p>` + (e && e.text ? aiRich(e.text) : '');
  } finally { aiBusy(false); AIX.ctl = null; const l = $('#aix_log'); if (l) l.scrollTop = 1e9; }
}
const aiNum = s => { const x = parseFloat(exClean(s).replace(/[−–]/g, '-').replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : NaN; };
function aiSens(id){
  const f = CALC[id]; if (typeof f !== 'function') return [];
  let base; try { base = f(); } catch (e) { return []; }
  const b0 = base && base.hero ? aiNum(base.hero.value) : NaN; if (!isFinite(b0)) return [];
  const out = [];
  aiFields(id).filter(x => x.type === 'number' && x.shown && isFinite(+x.value) && +x.value !== 0).slice(0, 24).forEach(x => {
    const el = document.getElementById(x.id), old = el.value;
    try { el.value = String(+old * 1.1); const r = f(), v = r && r.hero ? aiNum(r.hero.value) : NaN; if (isFinite(v) && Math.abs(v - b0) > 1e-9) out.push({id: x.id, label: x.label, d: v - b0, pct: b0 ? (v - b0) / Math.abs(b0) * 100 : NaN}); }
    catch (e) {} finally { el.value = old; }
  });
  try { calc(id); } catch (e) {}
  return out.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5);
}
function aiSensText(id, forAi){
  const S = aiSens(id), hero = LAST[id] && LAST[id].hero ? exClean(LAST[id].hero.label) : '';
  if (!S.length) return forAi ? '' : t('ai_sensNone');
  const row = s => (forAi ? s.label + ' (' + s.id + ')' : '**' + s.label + '**') + ': ' + (s.d > 0 ? '+' : '') + N(s.d, null, 2) + (isFinite(s.pct) ? ' (' + (s.pct > 0 ? '+' : '') + N(s.pct, null, 1) + '%)' : '');
  return (forAi ? 'Measured in the app: raising each input by 10% changes "' + hero + '" by:' : t('ai_sens', {h: hero})) + '\n' + S.map(s => '- ' + row(s)).join('\n');
}
function aiLocal(id, q, kind, fill, quiet){
  if (kind === 'explain'){ aiLog('ai', '', exLocal(id, 'all', q)); return; }
  if (kind === 'impact' || kind === 'improve'){ aiLog('ai', aiSensText(id) + (kind === 'improve' ? '\n\n' + t('ai_tip') : '')); return; }
  if (fill || (AI_FILL.test(q) && !/[?؟]\s*$/.test(q) && aiChipKeys(id).length > 2)){ aiPropose(id, aiParseFill(q, id)); return; }
  if (id === 'home' && /סכם|סיכום|summary|ملخص|לחשב|חישבתי/.test(q)){ const L = aiMine(); aiLog('ai', L.length ? t('ai_mine') + '\n' + L.map(x => '- ' + x).join('\n') : t('ai_mineNone')); return; }
  if (id === 'expenses' && /הוצא|נתח|ניתוח|expens|مصار|حلل/.test(q)){ const s = aiExpSummary(); aiLog('ai', s ? s.replace(/^Expenses in/, t('ai_expIn')).replace('By category:', t('ai_expBy')) : t('ai_expNone')); return; }
  const out = aiLog('ai', '', `<p class="ex-wait">${asEsc(t('as_think'))}</p>`);
  pmSmart(q, id).then(a => { out.innerHTML = aiRich(a); const l = $('#aix_log'); if (l) l.scrollTop = 1e9; }, () => { out.innerHTML = aiRich(pmAnswer(q)); });
}
/* the button on every screen */
function aiFabSync(){
  let b = $('#ai_fab');
  if (!b){ document.body.insertAdjacentHTML('beforeend', `<button type="button" class="ai-fab" id="ai_fab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg><span>AI</span></button>`); b = $('#ai_fab'); }
  b.hidden = tab === 'assist'; b.setAttribute('aria-label', t('ai_fabA', {n: t('tab_' + tab)}));
  if (AIX.open) aiEngSync();
}
document.addEventListener('click', e => {
  if (e.target.closest('#ai_fab')){ aiOpen(); return; }
  const ov = $('#aix'); if (!ov || ov.hidden) return;
  if (e.target === ov || e.target.closest('#aix_x')){ aiClose(); return; }
  if (e.target.closest('#aix_stop')){ if (AIX.ctl) try { AIX.ctl.abort(); } catch (x) {} return; }
  const c = e.target.closest('[data-aic]');
  if (c){ const k = c.dataset.aic; if (k === 'ai_cFill'){ AIX.fill = true; const q = $('#aix_q'); q.placeholder = t('ai_fillPh'); q.focus(); return; } aiAsk(t(k), {ai_cExplain: 'explain', ai_cImpact: 'impact', ai_cImprove: 'improve'}[k] || ''); return; }
  const g = e.target.closest('[data-aigo]'); if (g){ activate(g.dataset.aigo); aiOpenFor(g.dataset.aigo, true); aiLog('ai', t('ai_moved', {n: t('tab_' + g.dataset.aigo)})); return; }
  const a = e.target.closest('[data-aia]');
  if (a){
    const k = a.dataset.aia; const box = a.closest('.ai-m'); if (box) $$('[data-aia="apply"],[data-aia="drop"]', box).forEach(x => x.disabled = true);
    if (k === 'apply' && AIX.pending){ const {id, ch} = AIX.pending; AIX.pending = null; if (tab !== id) activate(id); aiAfterApply(id, aiApply(id, ch)); }
    else if (k === 'drop'){ AIX.pending = null; aiLog('ai', t('ai_dropped')); }
    else if (k === 'undo'){ a.disabled = true; aiUndo(); }
  }
});
document.addEventListener('submit', e => { if (e.target && e.target.id === 'aix_form'){ e.preventDefault(); const q = $('#aix_q'); const v = q.value; q.value = ''; aiAsk(v); } });
document.addEventListener('change', e => { if (e.target && e.target.id === 'aix_eng'){ SET.aiEngine = e.target.value; saveSet(); const s = $('#set_aiEngine'); if (s) s.value = SET.aiEngine; aiEngSync(); try { engRender(); } catch (x) {} } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && AIX.open){ e.preventDefault(); aiClose(); } });
const _actAi = activate;
activate = function(id){ const r = _actAi.apply(this, arguments); try { aiFabSync(); } catch (e) {} return r; };
const _alAi = applyLang;
applyLang = function(){ const r = _alAi.apply(this, arguments); try { aiFabSync(); if (AIX.open) aiOpenFor(AIX.screen || tab, true); } catch (e) {} return r; };
aiFabSync();

/* ================= the personal AI, upgraded: live data from the app, quick calculations, follow-ups, and online lookups ================= */
aiPick = function(){ return 'personal'; };                                 // one engine: the app's own
var PMX = {last: null, wiki: {}};
const pmOnline = () => SET.aiNet !== '0' && navigator.onLine !== false && !IN_CLAUDE;
const PM_CUR = {'דולר': 'USD', 'דולרים': 'USD', 'dollar': 'USD', 'dollars': 'USD', 'usd': 'USD', 'יורו': 'EUR', 'euro': 'EUR', 'euros': 'EUR', 'eur': 'EUR', 'שקל': 'ILS', 'שקלים': 'ILS', 'שח': 'ILS', 'ils': 'ILS', 'nis': 'ILS', 'shekel': 'ILS', 'shekels': 'ILS',
  'לישט': 'GBP', 'פאונד': 'GBP', 'פאונדים': 'GBP', 'gbp': 'GBP', 'pound': 'GBP', 'pounds': 'GBP', 'ין': 'JPY', 'yen': 'JPY', 'jpy': 'JPY', 'פרנק': 'CHF', 'chf': 'CHF', 'דינר': 'JOD', 'jod': 'JOD', 'ביטקוין': 'BTC', 'bitcoin': 'BTC', 'btc': 'BTC',
  'אתריום': 'ETH', 'איתריום': 'ETH', 'ethereum': 'ETH', 'eth': 'ETH', 'רובל': 'RUB', 'rub': 'RUB', 'דירהם': 'AED', 'aed': 'AED', 'יואן': 'CNY', 'cny': 'CNY', 'רופי': 'INR', 'inr': 'INR', 'cad': 'CAD', 'aud': 'AUD', 'try': 'TRY', 'egp': 'EGP',
  'دولار': 'USD', 'يورو': 'EUR', 'شيكل': 'ILS', 'جنيه': 'GBP', 'دينار': 'JOD', 'بيتكوين': 'BTC'};
const PM_SYM = {'$': 'USD', '€': 'EUR', '₪': 'ILS', '£': 'GBP', '¥': 'JPY'};
function pmNums(raw){          // every number in the text, with thousands/millions words and %
  const out = [], re = /(\d[\d,]*(?:\.\d+)?)\s*(אלף|אלפים|ק|k|K|מיליון|מליון|מיל|m|M|ألف|مليون)?\s*(%|אחוז|אחוזים|٪)?/g; let m;
  while ((m = re.exec(raw))){ let n = parseFloat(m[1].replace(/,/g, '')); const u = m[2] || ''; if (/אלף|אלפים|^ק$|k|ألف/i.test(u)) n *= 1000; else if (u) n *= 1e6; out.push({n, pct: !!m[3], at: m.index, end: m.index + m[0].length}); }
  return out;
}
function pmArith(raw){          // a small, safe calculator: + - * / ( ) and %, only when the message is an expression
  const e = String(raw).replace(/^\s*(כמה\s+זה|כמה\s+יוצא|כמה\s+יוצאים|כמה|מה\s+זה|תחשב(?:\s+לי)?|חשב(?:\s+לי)?|calculate|what\s+is|what's|كم\s+يساوي|كم|احسب)\s*/i, '').replace(/[=?؟\s]+$/, '');
  if (!/^[\d.,\s+\-*/×÷xX()%]+$/.test(e)) return null;
  const s = e.replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/,/g, '').trim();
  if (!/\d\s*[+\-*/]\s*[\d(]/.test(s)) return null;
  const tk = s.match(/\d+(?:\.\d+)?|[+\-*/()%]/g); if (!tk || tk.length > 60) return null;
  let i = 0;
  const peek = () => tk[i], next = () => tk[i++];
  function expr(){ let v = term(); while (peek() === '+' || peek() === '-'){ const o = next(), r = term(); v = o === '+' ? v + r : v - r; } return v; }
  function term(){ let v = fac(); while (peek() === '*' || peek() === '/'){ const o = next(), r = fac(); v = o === '*' ? v * r : v / r; } return v; }
  function fac(){ let v; const c = next(); if (c === '-') return -fac(); if (c === '('){ v = expr(); if (next() !== ')') throw 0; } else if (/^\d/.test(c || '')) v = parseFloat(c); else throw 0; if (peek() === '%'){ next(); v /= 100; } return v; }
  try { const v = expr(); return i === tk.length && isFinite(v) ? v : null; } catch (e) { return null; }
}
const pmF = (x, d) => N(x, null, d == null ? 2 : d);
function pmCurOf(raw, n){
  const found = []; const nt = pmNorm(raw).trim().split(' ');
  nt.forEach((w, i) => { const two = w + ' ' + (nt[i + 1] || ''); const c = PM_CUR[two] || aiForms(w).map(f => PM_CUR[f]).find(Boolean) || (/^[a-z]{3}$/.test(w) && RATES[w.toUpperCase()] && !PM_STOP.has(w) ? w.toUpperCase() : null); if (c && RATES[c] && !found.includes(c)) found.push(c); });
  Object.keys(PM_SYM).forEach(s => { if (raw.includes(s) && !found.includes(PM_SYM[s])) found.unshift(PM_SYM[s]); });
  return found;
}
function pmLiveTime(){ try { return typeof rfDataTime === 'function' ? rfDataTime() : ''; } catch (e) { return ''; } }
function pmRateSrc(){ return META.live ? t('pmx_srcLive') : META.mkt ? t('pmx_srcMkt') : META.official ? t('pmx_srcOff') : t('pmx_srcSnap'); }
/* each skill returns text (with [[calculator]] or [[calculator|field=value;…]] links) or null */
const PM_SKILLS = [
  function arith(q, raw){ if (/הלוואה|משכנתא|loan|mortgage|מע"?מ|vat|אחוז מ|% מ/i.test(raw)) return null; const v = pmArith(raw); return v == null ? null : t('pmx_arith', {v: pmF(v, 6)}); },
  function percentOf(q, raw){
    const m = raw.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:%|אחוז(?:ים)?|٪)\s*(?:מ-?|מתוך|of|من)\s*-?\s*(\d[\d,]*(?:\.\d+)?)/i); if (!m) return null;
    const p = parseFloat(m[1].replace(/,/g, '')), b = parseFloat(m[2].replace(/,/g, '')), v = p / 100 * b;
    PMX.last = {k: 'pct', p, b};
    return t('pmx_pct', {p: pmF(p), b: pmF(b), v: pmF(v)}) + '\n[[percent|pa_x=' + p + ';pa_y=' + b + ']]';
  },
  function vat(q, raw){
    if (!/מע"?מ|מעמ|vat|ضريبة القيمة/i.test(raw)) return null;
    const ns = pmNums(raw).filter(x => !x.pct); if (!ns.length) return t('pmx_vatRate', {r: pmF(vatPct(), 1)}) + '\n[[vat]]';
    const x = ns[0].n, r = vatPct() / 100, out = /בלי|ללא|לפני|מתוך|כולל|לחלץ|without|incl|extract|net|بدون/i.test(raw);
    if (out){ const net = x / (1 + r); return t('pmx_vatOut', {x: pmF(x), n: pmF(net), v: pmF(x - net), r: pmF(r * 100, 1)}) + '\n[[vat|v_mode=extract;v_amount=' + x + ']]'; }
    return t('pmx_vatIn', {x: pmF(x), g: pmF(x * (1 + r)), v: pmF(x * r), r: pmF(r * 100, 1)}) + '\n[[vat|v_mode=add;v_amount=' + x + ']]';
  },
  function loan(q, raw){
    const n = pmNorm(raw), isL = /הלוואה|הלוואת|משכנתא|משכנתה|loan|mortgage|قرض|רכב בתשלומים/.test(n);
    const fu = PMX.fu && PMX.last && PMX.last.k === 'loan';                 // a follow-up, like: and for 10 years?
    let L = isL ? null : fu ? Object.assign({}, PMX.last) : null;
    if (!isL && !L) return null;
    const ns = pmNums(raw), yrsM = raw.match(/(\d+(?:\.\d+)?)\s*(שנים|שנה|years?|سنوات|سنة)/i), moM = raw.match(/(\d+)\s*(חודשים|חודש|תשלומים|months?|أشهر)/i);
    const pct = ns.find(x => x.pct), amt = ns.filter(x => !x.pct && !(yrsM && raw.slice(x.at, x.end).includes(yrsM[1]) && x.at === yrsM.index) && !(moM && x.at === moM.index)).sort((a, b) => b.n - a.n)[0];
    if (!isL && !(pct || yrsM || moM || amt)) return null;
    if (!fu && !ns.length) return null;                                     // a question about loans without numbers is a question, not a calculation
    L = L || {k: 'loan'};
    if (amt && amt.n >= 500) L.amt = amt.n; if (pct) L.rate = pct.n; if (yrsM) L.n = Math.round(parseFloat(yrsM[1]) * 12); else if (moM) L.n = +moM[1];
    if (/פריים|prime/.test(n) && !pct){ const mg = raw.match(/פריים\s*([+\-−])\s*(\d+(?:\.\d+)?)/); L.rate = MKT.boi + PRIME_SPREAD + (mg ? (mg[1] === '+' ? 1 : -1) * parseFloat(mg[2]) : 0); L.prime = true; }
    if (!L.amt || !L.n){ PMX.last = L; return t('pmx_loanNeed'); }
    const rateGiven = L.rate != null, rate = rateGiven ? L.rate : MKT.boi + PRIME_SPREAD, pm = pmtOf(L.amt, rate, L.n), tot = pm * L.n;
    PMX.last = Object.assign(L, {rate});
    return t('pmx_loan', {a: pmF(L.amt, 0), y: fmtDur(L.n), r: pmF(rate, 2), p: pmF(pm), i: pmF(tot - L.amt, 0), tot: pmF(tot, 0)}) + (rateGiven ? '' : '\n' + t('pmx_loanAsm', {p: PC(rate)})) + '\n' + t('pmx_follow') + '\n[[loan|l_amount=' + L.amt + ';l_rate=' + Math.round(rate * 1e4) / 1e4 + ';l_years=' + Math.round(L.n / 12 * 100) / 100 + ']]';
  },
  function grow(q, raw){
    const n = pmNorm(raw), isG = /חיסכון|לחסוך|חוסך|ריבית דריבית|להשקיע|השקעה|אשקיע|יהיה לי|יצטבר|compound|invest|save|saving|ادخار|استثمار/.test(n);
    const fu = PMX.fu && PMX.last && PMX.last.k === 'grow';
    let G = isG ? null : fu ? Object.assign({}, PMX.last) : null;
    if (!isG && !G) return null;
    const ns = pmNums(raw), yrsM = raw.match(/(\d+(?:\.\d+)?)\s*(שנים|שנה|years?|سنوات|سنة)/i), pct = ns.find(x => x.pct);
    const vals = ns.filter(x => !x.pct && !(yrsM && x.at === yrsM.index));
    if (!isG && !(pct || yrsM || vals.length)) return null;
    if (!fu && !ns.length) return null;
    G = G || {k: 'grow', p0: 0, mo: 0};
    const monthly = /בחודש|לחודש|חודשי|a month|monthly|شهري/.test(n);
    if (vals.length){ if (monthly){ G.mo = vals[vals.length - 1].n; if (vals.length > 1) G.p0 = vals[0].n; } else G.p0 = vals[0].n; }
    if (pct) G.rate = pct.n; if (yrsM) G.y = parseFloat(yrsM[1]);
    if (!(G.p0 || G.mo) || !G.y){ PMX.last = G; return t('pmx_growNeed'); }
    const rate = G.rate != null ? G.rate : 5, rm = Math.pow(1 + rate / 100, 1 / 12) - 1, m = Math.round(G.y * 12);
    const fv = G.p0 * Math.pow(1 + rm, m) + (rm ? G.mo * (Math.pow(1 + rm, m) - 1) / rm : G.mo * m), put = G.p0 + G.mo * m;
    PMX.last = Object.assign(G, {rate});
    return t('pmx_grow', {a: pmF(G.p0, 0), mo: pmF(G.mo, 0), y: pmF(G.y, 1), r: pmF(rate, 2), v: pmF(fv, 0), put: pmF(put, 0), g: pmF(fv - put, 0)}) + (G.rate == null ? '\n' + t('pmx_growAsm') : '') + '\n' + t('pmx_follow') + '\n[[compound|c_mode=final;c_init=' + G.p0 + ';c_monthly=' + G.mo + ';c_rate=' + rate + ';c_years=' + G.y + ']]';
  },
  function salary(q, raw){
    const n = pmNorm(raw); if (!/נטו|ברוטו|משכורת|net|gross|صافي|إجمالي/.test(n) || /הלווא|משכנת|loan/.test(n)) return null;
    const ns = pmNums(raw).filter(x => !x.pct && x.n >= 1000); if (!ns.length) return null;
    const x = ns[0].n, near = raw.slice(ns[0].end, ns[0].end + 14) + ' | ' + raw.slice(Math.max(0, ns[0].at - 10), ns[0].at);    // the word next to the number says what it is
    const tagNet = /^[\s₪שח"׳'-]*(נטו|net|صافي)/i.test(raw.slice(ns[0].end)) || /(נטו|net|صافي)[\s:-]*$/i.test(raw.slice(0, ns[0].at)), tagGross = /^[\s₪שח"׳'-]*(ברוטו|gross|إجمالي)/i.test(raw.slice(ns[0].end)) || /(ברוטו|gross|إجمالي)[\s:-]*$/i.test(raw.slice(0, ns[0].at));
    const wantGross = tagNet ? true : tagGross ? false : /כמה ברוטו|ברוטו כדי|ברוטו בשביל|how much gross|gross to get|كم إجمالي/.test(n);
    const pts = 2.25, opts = {bonus: 0, benefit: 0, erPens: 6.5, erSev: 6, erStudy: 0};
    if (wantGross){ let lo = 0, hi = x * 4 + 1000; for (let i = 0; i < 80; i++){ const mid = (lo + hi) / 2; if (salaryCalc(mid, pts, 6, 0, opts).net < x) lo = mid; else hi = mid; } const g = (lo + hi) / 2;
      return t('pmx_n2g', {n: pmF(x, 0), g: pmF(g, 0)}) + '\n' + t('pmx_salAsm') + '\n[[salary|s_mode=n2g;s_per=m;s_amount=' + x + ']]'; }
    const r = salaryCalc(x, pts, 6, 0, opts);
    return t('pmx_g2n', {g: pmF(x, 0), n: pmF(r.net, 0), tx: pmF(r.tax, 0), ni: pmF(r.ni + r.health, 0), p: pmF(r.pens, 0)}) + '\n' + t('pmx_salAsm') + '\n[[salary|s_mode=g2n;s_per=m;s_amount=' + x + ']]';
  },
  function rates(q, raw){
    const n = pmNorm(raw);
    if (/פריים|prime|برايم/.test(n) && !/הלווא|משכנת|loan/.test(n)) return t('pmx_prime', {p: PC(MKT.boi + PRIME_SPREAD), b: PC(MKT.boi), d: MKT.boiDate || '—', x: MKT.boiNext || '—'}) + '\n[[prime]]';
    if (/ריבית בנק ישראל|ריבית בנק|ריבית הבסיס|boi rate|bank of israel|فائدة بنك/.test(n)) return t('pmx_boi', {b: PC(MKT.boi), d: MKT.boiDate || '—', x: MKT.boiNext || '—'}) + '\n[[prime]]';
    if (/תשומות|בנייה|construction/.test(n) && /מדד|index|مؤشر/.test(n)){ const d = IX.idx.build; if (d) return t('pmx_idx', {n: ixName('build'), v: pmF(+d.v, 1), m: lkLabel(d.m), mm: sgnPC(+d.mom), y: sgnPC(+d.yoy)}) + '\n[[cpilink]]'; }
    if (/מדד|אינפלצי|יוקר המחיה|cpi|inflation|تضخم|مؤشر الأسعار/.test(n) && !/מחשבון/.test(n)){ const d = IX.idx.cpi; if (d) return t('pmx_idx', {n: ixName('cpi'), v: pmF(+d.v, 1), m: lkLabel(d.m), mm: sgnPC(+d.mom), y: sgnPC(+d.yoy)}) + (isFinite(+MKT.cpiYtd) ? '\n' + t('pmx_ytd', {v: sgnPC(+MKT.cpiYtd)}) : '') + '\n[[inflation]]'; }
    const mk = [['ta35', /תא ?35|תל אביב 35|ta ?35/], ['ta125', /תא ?125|תל אביב 125|ta ?125/], ['spx', /s ?p ?500|אס אנד פי|sp500/], ['ndx', /נאסדק|nasdaq/], ['dji', /דאו|dow/], ['gold', /זהב|gold|ذهب/], ['brent', /נפט|ברנט|oil|brent|نفط/]];
    for (const [k, re] of mk){ if (re.test(n) && IX.mkt[k] && /מחיר|שער|כמה|עומד|נסחר|היום|עלה|ירד|עכשיו|price|level|trading|today|سعر|كم/.test(n)){ const d = IX.mkt[k]; return t('pmx_mkt', {n: ixName(k), v: (k === 'gold' || k === 'brent' ? '$' : '') + pmF(d.p, d.p >= 1000 ? 0 : 2), c: sgnPC(+d.chp), t: ixDay(d.t), y: isFinite(+d.ytd) ? sgnPC(+d.ytd) : '—'}); } }
    return null;
  },
  function currency(q, raw){
    const cs = pmCurOf(raw); if (!cs.length) return null;
    const ns = pmNums(raw).filter(x => !x.pct);
    if (!ns.length){
      if (!/שער|כמה|מה|rate|price|سعر|كم/i.test(raw)) return null;
      const c = cs.find(x => x !== 'ILS') || 'USD', v = RATES.ILS / RATES[c];
      return t('pmx_rate', {c: curName(c), v: pmF(v, CRYPTO[c] ? 0 : 4), s: pmRateSrc(), t: pmLiveTime()}) + (c === 'USD' && isFinite(OFFI.ils) && Math.abs(OFFI.ils - v) > 0.0005 ? '\n' + t('pmx_rateOff', {v: pmF(OFFI.ils, 4)}) : '') + '\n[[convert|x_amount=1;x_from=' + c + ';x_to=ILS]]';
    }
    const amt = ns[0].n, from = cs[0], to = cs[1] || (from === 'ILS' ? 'USD' : 'ILS'), v = amt * RATES[to] / RATES[from];
    PMX.last = {k: 'fx', amt, from, to};
    return t('pmx_fx', {a: pmF(amt), f: from, v: pmF(v, CRYPTO[to] ? 8 : 2), to, r: pmF(RATES[to] / RATES[from], 4), s: pmRateSrc(), t: pmLiveTime()}) + '\n[[convert|x_amount=' + amt + ';x_from=' + from + ';x_to=' + to + ']]';
  }
];
function pmHas(q){ const n = pmNorm(q); return PM_RX.thanks.test(n) || PM_RX.greet.test(n) || PM_RX.help.test(n) || pmMatchKB(q).length > 0 || pmCalcs(q).length > 0; }
async function pmWiki(q){
  const L = ['he', 'ar', 'en'].includes(lang) ? lang : 'he';
  const term = String(q).replace(/^\s*(מה\s+זה|מה\s+זאת|מהו|מהי|מה\s+הם|מה\s+הן|מה\s+פירוש|מה\s+המשמעות\s+של|מי\s+זה|מי\s+היה|תסביר(?:\s+לי)?(?:\s+מה\s+זה)?|הסבר(?:\s+לי)?|ספר\s+לי\s+על|what\s+is|what\s+are|who\s+is|who\s+was|explain|tell\s+me\s+about|ما\s+هو|ما\s+هي|من\s+هو|اشرح)\s*/i, '').replace(/[?؟!.]+\s*$/, '').trim();
  if (!term || term.length > 80) return null;
  const key = L + '|' + term; if (key in PMX.wiki) return PMX.wiki[key];
  const url = 'https://' + L + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&generator=search&gsrlimit=1&gsrsearch=' + encodeURIComponent(term) + '&prop=extracts%7Cinfo&exintro=1&explaintext=1&exsentences=3&inprop=url';
  let res = null;
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
    const r = await fetch(url, {signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer'}); clearTimeout(to);
    if (r.ok){ const j = await r.json(), pages = Object.values(((j || {}).query || {}).pages || {}); const p = pages.sort((a, b) => (a.index || 0) - (b.index || 0))[0];
      if (p && String(p.extract || '').trim().length >= 40) res = {title: p.title, text: String(p.extract).replace(/\s*\([^)]{0,80}\)/, '').trim().slice(0, 700), url: p.fullurl || ('https://' + L + '.wikipedia.org/wiki/' + encodeURIComponent(p.title))}; }
  } catch (e) {}
  PMX.wiki[key] = res; return res;
}
async function pmSmart(q, screen){
  const raw = String(q || '').trim(); if (!raw) return '';
  PMX.fu = false;
  for (const sk of PM_SKILLS){ try { const a = sk(pmNorm(raw), raw); if (a) return a; } catch (e) {} }
  if (/^\s*(ו|ומה|ואם|ואז|אז|and|what if|what about|و)/i.test(raw) || raw.split(/\s+/).length <= 4){       // a short follow-up to the last calculation
    PMX.fu = true;
    try { for (const sk of PM_SKILLS.filter(f => f.name === 'loan' || f.name === 'grow')){ const a = sk(pmNorm(raw), raw); if (a){ PMX.fu = false; return a; } } } catch (e) {}
    PMX.fu = false;
  }
  if (pmHas(raw)) return pmAnswer(raw);
  if (pmOnline()){
    const w = await pmWiki(raw);
    if (w) return t('pmx_wiki', {n: w.title}) + '\n' + w.text + '\n' + t('pmx_wikiSrc') + ' ' + w.url;
  }
  return pmAnswer(raw) + (pmOnline() || SET.aiNet === '0' ? '' : '\n\n' + t('pmx_offline'));
}
/* "open the calculator with these numbers" */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-aifill]'); if (!b) return;
  const id = b.dataset.aigo || b.dataset.go, ch = String(b.dataset.aifill).split(';').map(x => x.split('=')).filter(x => x[0] && x.length === 2).map(([k, v]) => ({id: k, value: v}));
  setTimeout(() => { const r = aiApply(id, ch); if (AIX.open && r.applied.length) aiAfterApply(id, r); }, 150);       // the link itself opens the calculator
}, true);
/* the AI sheet and the assistant tab no longer show an engine choice */
const aiEngSyncOld = aiEngSync;
aiEngSync = function(){ const row = $('.ai-engrow'); if (row) row.hidden = true; const n = $('#aix_note'); if (n) n.textContent = t(SET.aiNet === '0' ? 'ai_noteLocalOff' : 'ai_noteLocal2'); };
engRender = function(){ const r = $('.as-engrow'); if (r) r.hidden = true; };
engRender();
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_aiNet'){ SET.aiNet = e.target.value === '0' ? '0' : '1'; saveSet(); } });

/* ================= precise answers: answer exactly what was asked, and look anything else up online ================= */
const PM_QW = new Set(('מה מהו מהי מי מתי איפה היכן כמה למה מדוע איך כיצד האם זה זו זאת הוא היא הם הן יש אין היה הייתה יהיה תגיד תגידי תסביר הסבר ספר לי לנו בבקשה רוצה רציתי לדעת אפשר צריך ' +
  'של את על עם עבור כל גם אבל או אם כי אני אתה את מישהו משהו נכון באמת הבדל ההבדל בין לבין ללא בלי versus vs difference between الفرق بين מחשבים משלמים מקבלים נקבע נקבעת קובעים כדאי להגדיל להקטין לשלם לקבל פועל פועלת משפיע משפיעה ' +
  'what whats who whos when where which why how is are was were the a an of to in on for do does did can could would tell me please about explain know ' +
  'ما ماذا من متى أين كيف لماذا هل هو هي في على عن الى إلى').split(' '));
function pmFocus(q){ return [...new Set(pmNorm(q).trim().split(' ').filter(w => w && w.length >= 2 && !PM_QW.has(w) && !PM_STOP.has(w)))]; }
const pmIsDef = q => /^\s*(מה\s+זה|מה\s+זאת|מהו|מהי|מה\s+הם|מה\s+הן|מה\s+פירוש|מה\s+המשמעות|הסבר|תסביר|what\s+is|what\s+are|what's|define|meaning\s+of|ما\s+هو|ما\s+هي|ما\s+معنى)(?=[\s?؟]|$)/i.test(q);
const pmWantsCalc = q => /מחשבון|מחשבונים|לחשב|חישוב|איך מחשבים|איך לחשב|איזה כלי|calculator|calculate|حاسبة|احسب|كيف أحسب/i.test(q);
function pmWordHit(w, list){ const f = aiForms(w); return list.some(l => aiForms(l).some(x => f.some(y => aiWordsMatch(x, y)))); }
/* the built-in knowledge counts only when it is about the very thing that was asked */
function pmKBStrong(q){
  const focus = pmFocus(q); if (!focus.length) return [];
  const cands = pmMatchKB(q).slice(0, 3).map(e => { const words = pmTerms(e).join(' ').split(' ').concat(pmNorm(t('kbt_' + e[0])).trim().split(' ')); return {e, cov: focus.filter(w => pmWordHit(w, words))}; }).filter(c => c.cov.length);
  const out = [], got = new Set();
  for (const c of cands){ if (out.length >= 2) break; if (c.cov.some(w => !got.has(w))){ out.push(c.e); c.cov.forEach(w => got.add(w)); } }
  return got.size / focus.length >= (focus.length <= 2 ? 1 : focus.length === 3 ? 0.66 : 0.75) ? out : [];      // the key word of the question must be covered
}
/* things that change by the hour (weather, news, prices of goods) have no reliable source inside the app: say so and open a real search */
const pmIsLive = q => /מחר|מחרתיים|תחזית|מזג האוויר|מזג אוויר|חדשות|אתמול|השבוע|כרגע|תוצאת|תוצאות המשחק|כמה עולה|מחיר של|מחירי|weather|forecast|tomorrow|yesterday|news|score|how much does|price of|الطقس|أخبار|غدا|كم سعر/i.test(q);
async function pmGet(u){ const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000); try { const r = await fetch(u, {signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer'}); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(to); } }
/* look it up: search Wikipedia, read the top articles and keep the sentences that answer the question */
async function pmWebQA(q){
  const L = ['he', 'ar', 'en'].includes(lang) ? lang : 'he', focus = pmFocus(q), def = pmIsDef(q);
  if (!focus.length) return null;
  const key = 'qa|' + L + '|' + focus.join(' '); if (key in PMX.wiki) return PMX.wiki[key];
  const api = 'https://' + L + '.wikipedia.org/w/api.php?format=json&origin=*&';
  let titles = [];
  const tried = new Set();
  for (const words of [focus, focus.slice(0, 3), focus.slice(0, 2)]){
    if (!words.length || tried.has(words.join(' '))) continue; tried.add(words.join(' '));
    const s = await pmGet(api + 'action=query&list=search&srlimit=4&srprop=&srsearch=' + encodeURIComponent(words.join(' ')));
    titles = (((s || {}).query || {}).search || []).map(x => x.title); if (titles.length) break;
  }
  if (!titles.length){ PMX.wiki[key] = null; return null; }
  const e = await pmGet(api + 'action=query&prop=extracts%7Cinfo&explaintext=1&exintro=1&inprop=url&redirects=1&titles=' + encodeURIComponent(titles.join('|')));
  const pages = Object.values((((e || {}).query || {}).pages) || {}).filter(p => p.extract);
  let best = null;
  pages.forEach(p => {
    const rank = titles.indexOf(p.title) >= 0 ? titles.indexOf(p.title) : 3;
    const tWords = pmNorm(p.title).trim().split(' '), tHit = focus.filter(w => pmWordHit(w, tWords)).length;
    const sents = String(p.extract).replace(/\s*\([^()]{0,90}\)/g, '').replace(/\n+/g, ' ').replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').map(x => x.trim()).filter(x => x.length > 25).slice(0, 14);
    sents.forEach((st, i) => {
      const sw = pmNorm(st).trim().split(' '), hit = focus.filter(w => pmWordHit(w, sw)).length;
      const score = hit + 0.6 * tHit + (i === 0 ? (def ? 1.2 : 0.3) : 0) + (3 - rank) * 0.25;
      if (!best || score > best.score) best = {score, hit, tHit, title: p.title, url: p.fullurl, s: sents, i};
    });
  });
  const need = Math.max(1, Math.ceil(focus.length * 0.5));
  const ok = best && (best.hit + best.tHit >= need) && (best.hit >= 1 || best.tHit >= Math.min(focus.length, 2));
  const res = ok ? {title: best.title, url: best.url || ('https://' + L + '.wikipedia.org/wiki/' + encodeURIComponent(best.title)),
    text: best.s.slice(best.i, best.i + ((best.s[best.i] || '').length < 140 && best.s[best.i + 1] ? 2 : 1)).join(' ').slice(0, 520)} : null;
  PMX.wiki[key] = res; return res;
}
function pmSearchLink(q){ return 'https://www.google.com/search?q=' + encodeURIComponent(q); }
pmLinkify = function(h){
  return h.replace(/(https:\/\/[a-z]{2,3}\.wikipedia\.org\/[^\s<"]+)/g, u => `<a class="src-a" href="${u}" target="_blank" rel="noopener noreferrer">${asEsc(t('pmx_wikiLink'))} ↗</a>`)
          .replace(/(https:\/\/www\.google\.com\/search\?q=[^\s<"]+)/g, u => `<a class="src-a" href="${u}" target="_blank" rel="noopener noreferrer">${asEsc(t('pmx_google'))} ↗</a>`);
};
pmSmart = async function(q, screen){
  const raw = String(q || '').trim(); if (!raw) return '';
  const n = pmNorm(raw), def = pmIsDef(raw), hasNum = /\d/.test(raw);
  if (PM_RX.thanks.test(n) && n.trim().split(' ').length <= 4) return t('pm_thanks');
  if (PM_RX.greet.test(n) && n.trim().split(' ').length <= 3) return t('pm_hello', {n: pmName()});
  if (PM_RX.help.test(n)) return t('pm_help', {n: pmName()});
  PMX.fu = false;
  /* 1. a calculation or a live figure that was asked for */
  if (!def || hasNum) for (const sk of PM_SKILLS){ try { const a = sk(n, raw); if (a) return a; } catch (e) {} }
  if (/^\s*(ו|ומה|ואם|ואז|אז|and|what if|what about|و)/i.test(raw) || raw.split(/\s+/).length <= 4){
    PMX.fu = true;
    try { for (const sk of PM_SKILLS.filter(f => f.name === 'loan' || f.name === 'grow')){ const a = sk(n, raw); if (a){ PMX.fu = false; return a; } } } catch (e) {}
    PMX.fu = false;
  }
  /* 2. the person's own results */
  if (PM_RX.res.test(n) && (screen || PM_LASTCALC) && !def) return pmResults(screen && !['home', 'settings', 'assist'].includes(screen) ? screen : PM_LASTCALC);
  /* 3. built-in knowledge, only when it is about exactly this */
  const kb = pmKBStrong(raw);
  if (kb.length){
    let a = kb.map(pmKB).join('\n\n');
    if (def){ try { const live = PM_SKILLS.find(f => f.name === 'rates')(n.replace(/מה זה|מהו|מהי/g, ' כמה '), raw); if (live) a += '\n\n' + live.replace(/\n\[\[[^\]]*\]\]/g, ''); } catch (e) {} }
    return a + (kb[0][1] ? '\n[[' + kb[0][1] + ']]' : '');
  }
  /* 4. which calculator, only when that is the question */
  if (pmWantsCalc(raw)){ const cs = pmCalcs(raw).slice(0, 3); if (cs.length) return t('pm_calcFit') + '\n' + cs.map(id => '[[' + id + ']] ' + t('d_' + id)).join('\n'); }
  /* 5. anything else: look it up online */
  if (pmIsLive(raw)) return t('pmx_live') + '\n' + pmSearchLink(raw);
  if (pmOnline()){
    const w = await pmWebQA(raw);
    if (w) return w.text + '\n' + t('pmx_wikiSrc') + ' **' + w.title + '** ' + w.url;
    return t('pmx_noWeb') + '\n' + pmSearchLink(raw);
  }
  return t(SET.aiNet === '0' ? 'pmx_netOff' : 'pmx_offline2') + '\n' + pmSearchLink(raw);
};

/* ================= outside AI models that need no account: the question (and this screen's numbers) open in that service ================= */
var XAI = {
  perplexity: {n: 'Perplexity', max: 650, u: q => 'https://www.perplexity.ai/search?q=' + encodeURIComponent(q)},
  chatgpt: {n: 'ChatGPT', max: 1100, u: q => 'https://chatgpt.com/?q=' + encodeURIComponent(q)},
  copilot: {n: 'Copilot', max: 1100, u: q => 'https://copilot.microsoft.com/?q=' + encodeURIComponent(q)},
  googleai: {n: 'Google AI', max: 220, u: q => 'https://www.google.com/search?udm=50&q=' + encodeURIComponent(q)},
  duck: {n: 'Duck.ai', max: 900, u: q => 'https://duckduckgo.com/?ia=chat&duckai=1&q=' + encodeURIComponent(q)}
};
function xaiEngine(){ const e = SET.aiEngine; return e === 'personal' || XAI[e] ? e : 'perplexity'; }
const xaiCalc = id => id && !['home', 'settings', 'assist', 'clients'].includes(id) && TABS.includes(id);
function xaiCtx(id){
  if (!xaiCalc(id)) return '';
  const fs = aiFields(id).filter(f => f.shown && f.value !== '' && !(f.type === 'number' && +f.value === 0)).slice(0, 12).map(f => f.label + ': ' + (f.options ? ((f.options.find(o => o[0] === f.value) || [])[1] || f.value) : f.value + (f.unit ? ' ' + f.unit : '')));
  const r = exResults(id);
  return t('tab_' + id) + ' — ' + fs.join('; ') + (r ? '. ' + r.main + (r.rows.length ? '; ' + r.rows.slice(0, 4).join('; ') : '') : '');
}
function xaiPrompt(key, q, id){
  const X = XAI[key], rules = t('xai_rules');
  const ctx = xaiCtx(id), lab = t('xai_ctx'), base = q + '\n\n' + rules;
  let p = ctx ? q + '\n\n' + lab + ' ' + ctx + '\n\n' + rules : base;
  if (p.length > X.max){ const room = X.max - base.length - lab.length - 6; p = room > 60 && ctx ? q + '\n\n' + lab + ' ' + ctx.slice(0, room) + '…\n\n' + rules : base; }
  if (p.length > X.max) p = q.slice(0, X.max);
  return {short: p, full: q + (xaiCtx(id) ? '\n\n' + t('xai_ctx') + ' ' + xaiCtx(id) : '') + '\n\n' + rules};
}
function xaiCopy(txt){ try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(() => {}); } catch (e) {} }
/* open it now, from the tap itself, so the browser lets the new tab through */
function xaiOpen(key, q, id){
  const P = xaiPrompt(key, q, id), url = XAI[key].u(P.short);
  try { window.open(url, '_blank', 'noopener'); } catch (e) {}
  xaiCopy(P.full);
  return url;
}
function xaiRow(q, id){
  const P = k => XAI[k].u(xaiPrompt(k, q, id).short);
  return `<div class="xai-row"><span>${asEsc(t('xai_more'))}</span>${Object.keys(XAI).map(k => `<a class="xai-b" href="${asEsc(P(k))}" target="_blank" rel="noopener noreferrer" data-xai="${k}" data-q="${asEsc(q)}">${asEsc(XAI[k].n)} ↗</a>`).join('')}</div>`;
}
document.addEventListener('click', e => { const a = e.target.closest('a[data-xai]'); if (!a) return; const k = a.dataset.xai; if (XAI[k]) xaiCopy(xaiPrompt(k, a.dataset.q || '', AIX.screen || tab).full); });
/* what can be answered exactly inside the app, without waiting: calculations, live figures, built-in definitions, your own results */
function pmLocalSync(raw, screen){
  raw = String(raw || '').trim(); if (!raw) return null;
  const n = pmNorm(raw), def = pmIsDef(raw), hasNum = /\d/.test(raw);
  if (PM_RX.thanks.test(n) && n.trim().split(' ').length <= 4) return t('pm_thanks');
  if (PM_RX.greet.test(n) && n.trim().split(' ').length <= 3) return t('pm_hello', {n: pmName()});
  if (PM_RX.help.test(n)) return t('pm_help', {n: pmName()});
  PMX.fu = false;
  if (!def || hasNum) for (const sk of PM_SKILLS){ try { const a = sk(n, raw); if (a) return a; } catch (e) {} }
  if (/^\s*(ו|ומה|ואם|ואז|אז|and|what if|what about|و)/i.test(raw) || raw.split(/\s+/).length <= 4){
    PMX.fu = true;
    try { for (const sk of PM_SKILLS.filter(f => f.name === 'loan' || f.name === 'grow')){ const a = sk(n, raw); if (a){ PMX.fu = false; return a; } } } catch (e) {}
    PMX.fu = false;
  }
  if (PM_RX.res.test(n) && (screen || PM_LASTCALC) && !def) return pmResults(screen && !['home', 'settings', 'assist'].includes(screen) ? screen : PM_LASTCALC);
  const kb = pmKBStrong(raw);
  if (kb.length){
    let a = kb.map(pmKB).join('\n\n');
    if (def){ try { const live = PM_SKILLS.find(f => f.name === 'rates')(n.replace(/מה זה|מהו|מהי/g, ' כמה '), raw); if (live) a += '\n\n' + live.replace(/\n\[\[[^\]]*\]\]/g, ''); } catch (e) {} }
    return a + (kb[0][1] ? '\n[[' + kb[0][1] + ']]' : '');
  }
  if (pmWantsCalc(raw)){ const cs = pmCalcs(raw).slice(0, 3); if (cs.length) return t('pm_calcFit') + '\n' + cs.map(id => '[[' + id + ']] ' + t('d_' + id)).join('\n'); }
  return null;
}
pmSmart = async function(q, screen){
  const raw = String(q || '').trim(); if (!raw) return '';
  const loc = pmLocalSync(raw, screen); if (loc) return loc;
  if (pmIsLive(raw)) return t('pmx_live') + '\n' + pmSearchLink(raw);
  if (pmOnline()){
    const w = await pmWebQA(raw);
    if (w) return w.text + '\n' + t('pmx_wikiSrc') + ' **' + w.title + '** ' + w.url;
    return t('pmx_noWeb') + '\n' + pmSearchLink(raw);
  }
  return t(SET.aiNet === '0' ? 'pmx_netOff' : 'pmx_offline2') + '\n' + pmSearchLink(raw);
};
/* links to the outside models show as buttons wherever answers are shown */
const pmLinkifyX = pmLinkify;
pmLinkify = function(h){
  return pmLinkifyX(h).replace(/(https:\/\/(?:www\.perplexity\.ai|chatgpt\.com|copilot\.microsoft\.com|duckduckgo\.com)\/[^\s<"]+|https:\/\/www\.google\.com\/search\?udm=50[^\s<"]+)/g, u => {
    const k = /perplexity/.test(u) ? 'perplexity' : /chatgpt/.test(u) ? 'chatgpt' : /copilot/.test(u) ? 'copilot' : /duckduckgo/.test(u) ? 'duck' : 'googleai';
    return `<a class="xai-b" href="${u}" target="_blank" rel="noopener noreferrer">${asEsc(t('xai_openIn', {n: XAI[k].n}))} ↗</a>`;
  });
};
/* the AI sheet: free questions go to the chosen model; exact things stay in the app */
const aiAskX = aiAsk;
aiAsk = async function(q, kind){
  q = String(q || '').trim(); if (!q || AIX.busy) return;
  const eng = xaiEngine(), id = tab, fill = AIX.fill || kind === 'fill';
  if (eng === 'personal' || fill || kind === 'explain' || kind === 'impact' || kind === 'improve') return aiAskX.apply(this, arguments);
  if ((AI_FILL.test(q) && !/[?؟]\s*$/.test(q) && aiChipKeys(id).length > 2)) return aiAskX.apply(this, arguments);
  const loc = pmLocalSync(q, id);
  if (loc){ AIX.fill = false; aiLog('user', q); const d = aiLog('ai', '', aiRich(loc)); if (d) d.insertAdjacentHTML('beforeend', xaiRow(q, id)); return; }
  aiLog('user', q);
  const url = xaiOpen(eng, q, id);
  aiLog('ai', '', `<p>${asEsc(t('xai_opened', {n: XAI[eng].n}))}</p><p class="fine">${asEsc(t(xaiCalc(id) ? 'xai_sentCtx' : 'xai_sent'))}</p><p><a class="xai-b" href="${asEsc(url)}" target="_blank" rel="noopener noreferrer">${asEsc(t('xai_openIn', {n: XAI[eng].n}))} ↗</a></p>`);
};
/* every answer the app gives itself offers the outside models too */
const aiLocalX = aiLocal;
aiLocal = function(id, q, kind, fill, quiet){
  const before = $('#aix_log') ? $('#aix_log').children.length : 0;
  const r = aiLocalX.apply(this, arguments);
  const nq = pmNorm(q), small = (PM_RX.thanks.test(nq) || PM_RX.greet.test(nq)) && nq.trim().split(' ').length <= 4;
  if (!small && !fill && !(AI_FILL.test(q) && aiChipKeys(id).length > 2)) setTimeout(() => {
    const log = $('#aix_log'); if (!log) return; const last = log.lastElementChild;
    if (last && last.classList.contains('ai') && log.children.length > before && !last.querySelector('.xai-row')){
      const add = () => { if (!last.querySelector('.ex-wait') && !last.querySelector('.xai-row')) last.insertAdjacentHTML('beforeend', xaiRow(kind ? t('xai_aboutScreen', {n: t('tab_' + id)}) + ' ' + q : q, id)); else if (last.querySelector('.ex-wait')) setTimeout(add, 300); };
      add();
    }
  }, 0);
  return r;
};
/* the assistant tab: same rule */
const asAnswerX = asAnswer;
asAnswer = async function(q){
  const eng = xaiEngine();
  if (eng === 'personal') return asAnswerX.apply(this, arguments);
  const loc = pmLocalSync(q, PM_LASTCALC); if (loc) return loc;
  const url = xaiOpen(eng, q, null);
  return t('xai_opened', {n: XAI[eng].n}) + '\n' + url;
};
/* choosing who answers, in the sheet and in the assistant tab */
function xaiOpts(){ return ['perplexity', 'chatgpt', 'copilot', 'googleai', 'duck', 'personal'].map(k => `<option value="${k}"${xaiEngine() === k ? ' selected' : ''}>${asEsc(t(k === 'personal' ? 'o_xPersonal' : 'o_x' + {perplexity: 'Perplexity', chatgpt: 'Chatgpt', copilot: 'Copilot', googleai: 'Google', duck: 'Duck'}[k]))}</option>`).join(''); }
aiEngSync = function(){
  const row = $('.ai-engrow'); if (row) row.hidden = false;
  const s = $('#aix_eng'); if (s) s.innerHTML = xaiOpts();
  const l = $('#aix_engl'); if (l) l.textContent = t('f_aiWho');
  const e = xaiEngine(), now = $('#aix_now'); if (now) now.textContent = '';
  const n = $('#aix_note'); if (n) n.textContent = e === 'personal' ? t(SET.aiNet === '0' ? 'ai_noteLocalOff' : 'ai_noteLocal2') : t('xai_note', {n: XAI[e].n});
};
engRender = function(){
  const box = $('#as_eng'); if (!box) return;
  const row = box.closest('.as-engrow'); if (row) row.hidden = false;
  if (!$('#as_engsel')) box.innerHTML = `<label class="fine" for="as_engsel" id="as_engl"></label><select id="as_engsel"></select>`;
  $('#as_engl').textContent = t('f_aiWho'); $('#as_engsel').innerHTML = xaiOpts();
  const now = $('#as_engnow'); if (now) now.textContent = xaiEngine() === 'personal' ? '' : t('xai_note', {n: XAI[xaiEngine()].n});
};
document.addEventListener('change', e => {
  const s = e.target; if (!s || !['aix_eng', 'as_engsel', 'set_aiEngine'].includes(s.id)) return;
  SET.aiEngine = s.value; saveSet();
  ['aix_eng', 'as_engsel', 'set_aiEngine'].forEach(x => { const el = $('#' + x); if (el && el !== s) el.value = SET.aiEngine; });
  try { aiEngSync(); engRender(); } catch (err) {}
});
try { if (!XAI[SET.aiEngine] && SET.aiEngine !== 'personal'){ SET.aiEngine = 'perplexity'; } engRender(); } catch (e) {}

/* ================= 7.4: the main result is shown once (in the big box), not again in the list ================= */
function rsNorm(s){ return String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[\s ‎‏‪-‮⁦-⁩]+/g, ' ').trim(); }
function rsNums(s){ const m = rsNorm(s).replace(/[,٬]/g, '').match(/\d+(?:\.\d+)?/g); return m ? m.map(Number) : []; }
function rsSame(a, b){ if (rsNorm(a) === rsNorm(b)) return true; const x = rsNums(a), y = rsNums(b); return x.length > 0 && x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < 1e-9); }
function rsDedupe(res){
  if (!res || !res.hero || !Array.isArray(res.rows) || res.rows.length < 2) return res;
  const hl = rsNorm(res.hero.label); if (!hl) return res;
  const keep = res.rows.filter(r => !(r && rsNorm(r[0]) === hl && rsSame(r[1], res.hero.value)));
  return keep.length && keep.length < res.rows.length ? Object.assign({}, res, {rows: keep}) : res;
}
const showRs = show;
show = function(id, res){ return showRs.call(this, id, rsDedupe(res)); };

/* ================= developer mode: "forgot code" recovery — shared with the owner's other apps =================
   One recovery code works in all the owner's apps. Only a fingerprint and an encrypted bundle live in the source;
   the bundle holds the developer unlock value encrypted with a key derived from the recovery code (useless without it). */
var REC_CHECK = 'f431ecb574470c5c7be8dd2591d55dead915527fcf366a3dd849787bb6139036', REC_BUNDLE = 'nsr1.iWUL8ojgMNK6qJIp.JxT7Dcnxml12WgcvhJdS7RFevhkpINNl462Eybdg5Swvm2Xlp0fOCA1Vn7FTTFJovZJXcZ/oBUHOA2qJA4K7sRMCFKCY6IYbvJll4kaeWHU=';
Object.assign(T, {
  rec_forgot:['שכחתי קוד','نسيت الرمز','Forgot the code'], rec_title:['שחזור גישה למצב מפתח','استعادة الوصول إلى وضع المطوّر','Recover developer access'],
  rec_code:['קוד שחזור','رمز الاستعادة','Recovery code'], rec_go:['שחזור','استعادة','Recover'], rec_back:['חזרה','رجوع','Back'],
  rec_hint:['הקלידו את קוד השחזור ששמרתם.','اكتبوا رمز الاستعادة الذي حفظتموه.','Type the recovery code you saved.'],
  rec_none:['עוד לא הוגדר קוד שחזור. צרו אותו במצב מפתח באחת האפליקציות שלכם.','لم يُضبط رمز استعادة بعد. أنشئوه في وضع المطوّر في أحد تطبيقاتكم.','No recovery code has been set up yet. Create one in developer mode in one of your apps.'],
  rec_bad:['קוד השחזור לא נכון','رمز الاستعادة غير صحيح','The recovery code is not correct'], rec_lock:['יותר מדי ניסיונות. נסו שוב בעוד דקה.','محاولات كثيرة. حاولوا بعد دقيقة.','Too many attempts. Try again in a minute.'],
  rec_ok:['הגישה שוחזרה ✓','تمت استعادة الوصول ✓','Access restored ✓'], rec_new:['יצירת קוד שחזור','إنشاء رمز استعادة','Create a recovery code'], rec_have:['יש לי כבר קוד שחזור','لديّ رمز استعادة بالفعل','I already have a recovery code'],
  rec_show:['זה קוד השחזור שלכם. שמרו אותו במקום בטוח, למשל במנהל סיסמאות. הוא מוצג רק עכשיו. אפשר להשתמש בו בכל האפליקציות שלכם.','هذا رمز الاستعادة الخاص بكم. احفظوه في مكان آمن، مثل مدير كلمات المرور. يظهر الآن فقط، ويمكن استخدامه في كل تطبيقاتكم.','This is your recovery code. Keep it somewhere safe, like a password manager. It is shown only now, and it works in all your apps.'],
  rec_never:['אל תשלחו את קוד השחזור לאף אחד, גם לא בצ׳אט.','لا ترسلوا رمز الاستعادة لأي أحد، ولا حتى في المحادثة.','Never send the recovery code to anyone, not even in a chat.'],
  rec_send:['כדי להפעיל אותו, שלחו לפיתוח רק את השורה הזו. היא לא חושפת את הקוד:','لتفعيله، أرسلوا إلى التطوير هذا السطر فقط. لا يكشف الرمز:','To activate it, send only this line to development. It does not reveal the code:'],
  rec_copyCode:['העתקת הקוד','نسخ الرمز','Copy the code'], rec_copyLine:['העתקת השורה','نسخ السطر','Copy the line'], rec_copied:['הועתק','تم النسخ','Copied'], rec_close:['סגירה','إغلاق','Close'],
  rec_enter:['הקלידו את קוד השחזור הקיים. הוא לא נשלח לשום מקום.','اكتبوا رمز الاستعادة الحالي. لا يُرسَل إلى أي مكان.','Type your existing recovery code. It is not sent anywhere.'], rec_make:['הפקת השורה','إنشاء السطر','Create the line'],
  rec_len:['הקוד צריך 20 תווים','الرمز يحتاج 20 حرفًا','The code needs 20 characters'],
  rec_chg:['שינוי קוד מפתח','تغيير رمز المطوّر','Change the developer code'],
  rec_chgName:['שם הבעלים','اسم المالك','Owner name'],
  rec_chgNeed:['כדי שהשחזור ימשיך לעבוד, צריך גם את קוד השחזור. הוא לא נשלח לשום מקום.','لكي تستمر الاستعادة بالعمل، يلزم رمز الاستعادة أيضًا. لا يُرسَل إلى أي مكان.','So that recovery keeps working, the recovery code is needed too. It is not sent anywhere.'],
  rec_chgGo:['יצירת קוד חדש','إنشاء رمز جديد','Create a new code'],
  rec_chgNoName:['צריך שם בעלים','يلزم اسم المالك','An owner name is needed'],
  rec_chgShow:['זה קוד המפתח החדש שלכם. שמרו אותו. הוא מוצג רק עכשיו ויעבוד בכל האפליקציות שמשתמשות בקוד הזה.','هذا رمز المطوّر الجديد. احفظوه. يظهر الآن فقط ويعمل في كل التطبيقات التي تستخدم هذا الرمز.','This is your new developer code. Save it. It is shown only now and works in all the apps that use this code.'],
  rec_chgSend:['כדי להפעיל אותו, שלחו לפיתוח את השורה הזו. היא לא חושפת את הקוד. עד שהיא תוכנס, הקוד הישן ממשיך לעבוד.','لتفعيله، أرسلوا إلى التطوير هذا السطر. لا يكشف الرمز. وحتى يُطبَّق، يبقى الرمز القديم فعّالًا.','To activate it, send this line to development. It does not reveal the code. Until it is applied, the old code keeps working.'],
  rec_chgNever:['אל תשלחו את קוד המפתח לאף אחד.','لا ترسلوا رمز المطوّر لأي أحد.','Never send the developer code to anyone.'],
  rec_alsoShared:['אפשר להקליד כאן גם את קוד השחזור המשותף לכל האפליקציות (XXXX-XXXX-XXXX-XXXX-XXXX).','يمكن أيضًا كتابة رمز الاستعادة المشترك لكل التطبيقات هنا (XXXX-XXXX-XXXX-XXXX-XXXX).','You can also type the recovery code shared by all your apps here (XXXX-XXXX-XXXX-XXXX-XXXX).']
});
const recB64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), recUn64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const recHex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
async function recDerive(code){ const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); const k = await crypto.subtle.importKey('raw', new TextEncoder().encode('NSREC:' + c), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode('ns-recover-v1'), iterations: 200000}, k, 256)); }
async function recCheckOf(bytes){ return recHex(await crypto.subtle.digest('SHA-256', new Uint8Array([...new TextEncoder().encode('chk:'), ...bytes]))); }
const recAes = bytes => crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
function recNewCode(){ const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(20)); let s = ''; for (let i = 0; i < 20; i++){ s += A[r[i] % A.length]; if (i % 4 === 3 && i < 19) s += '-'; } return s; }
/* making a recovery line needs the developer key itself; the admin version doesn't keep it, so the owner types the name + code once, here */
var RECH = null;
async function recNeedH(){ let h = ''; try { h = DEVST.getItem('fin-dev') || ''; } catch (e) {} if (devOk(h)) return h;
  return new Promise(res => { RECH = res; recModal(`<p>${asEsc(t('rec_needKey'))}</p><label for="rk_n">${asEsc(t('dev_name'))}</label><input id="rk_n" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" value="${asEsc(DEV_NAME || '')}"><label for="rk_c">${asEsc(t('dev_code'))}</label><input id="rk_c" type="password" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="FC-XXXX-XXXX-XXXX"><button type="button" class="gold-btn" data-rec="hgo">${asEsc(t('dev_go'))}</button><small class="hint" id="rk_m"></small>`); setTimeout(() => { const i = $('#rk_c'); if (i) i.focus(); }, 50); }); }
async function recHGo(){ const m = $('#rk_m'), name = devNameNorm(($('#rk_n') || {}).value), code = devNorm(($('#rk_c') || {}).value);
  if (!name || code.length < 14){ if (m) m.textContent = t(!name ? 'dev_needName' : 'dev_needCode'); return; } if (m) m.textContent = '…';
  let h = ''; try { h = recHex(await pbk(name + ':' + code, new TextEncoder().encode('fincalc-dev-v2'), 150000, 256)); } catch (e) {}
  if (!devOk(h)){ if (m) m.textContent = t('dev_bad2'); return; } const r = RECH; RECH = null; const c = $('#rk_c'); if (c) c.value = ''; if (r) r(h); }
Object.assign(T, {rec_needKey:['כדי ליצור שורת שחזור צריך להקליד פעם אחת את השם וקוד המפתח. הם לא נשמרים.','لإنشاء سطر الاسترداد يجب كتابة الاسم ورمز المطوّر مرة واحدة. لا يتم حفظهما.','To make a recovery line, type the name and developer code once. They are not saved.']});
async function recLine(code, h0){ const h = h0 || await recNeedH(); if (!DEV_ON || !devOk(h)) return null;
  const kb = await recDerive(code), chk = await recCheckOf(kb), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await recAes(kb), new TextEncoder().encode(h)); return 'NSREC1~' + chk + '~nsr1.' + recB64(iv) + '.' + recB64(ct); }
function recModal(html){ let o = $('#rec_modal'); if (o) o.remove(); document.body.insertAdjacentHTML('beforeend', `<div id="rec_modal" class="rec-ov" role="dialog" aria-modal="true"><div class="rec-card">${html}<div class="btnrow"><button type="button" class="mv wide" data-rec="close">${asEsc(t('rec_close'))}</button></div></div></div>`); }
function recShowLine(line, code){ recModal(`${code ? `<p>${asEsc(t('rec_show'))}</p><div class="rec-code" dir="ltr">${code}</div><button type="button" class="mv wide" data-rec="copy" data-v="${code}">${asEsc(t('rec_copyCode'))}</button><p class="rec-warn">${asEsc(t('rec_never'))}</p>` : ''}
  <p>${asEsc(t('rec_send'))}</p><textarea class="rec-line" readonly rows="4" dir="ltr">${line}</textarea><button type="button" class="gold-btn" data-rec="copy" data-v="${line}">${asEsc(t('rec_copyLine'))}</button>`); }
async function recCreate(){ const code = recNewCode(), line = await recLine(code); if (line) recShowLine(line, code); }
function recExisting(){ recModal(`<p>${asEsc(t('rec_enter'))}</p><input id="rec_ex" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"><button type="button" class="gold-btn" data-rec="make">${asEsc(t('rec_make'))}</button><small class="hint" id="rec_exm"></small>`); }
function recForm(){ const b = $('#dev_box'); if (!b) return; b.innerHTML = REC_CHECK && REC_BUNDLE
  ? `<div class="dev-f"><label for="rec_code">${asEsc(t('rec_code'))}</label><input id="rec_code" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"></div><small class="hint">${asEsc(t('rec_hint'))}</small><div class="dev-row"><button type="button" class="gold-btn" data-rec="try">${asEsc(t('rec_go'))}</button></div><small class="hint" id="rec_msg"></small>`
  : `<small class="hint">${asEsc(t('rec_none'))}</small>`; }
async function recTry(){ const i = $('#rec_code'), m = $('#rec_msg'); let lock = 0; try { lock = +(RAWLS.getItem('fin-rec-lock') || 0); } catch (e) {} if (Date.now() < lock){ if (m) m.textContent = t('rec_lock'); return; }
  if (m) m.textContent = '…'; let ok = false;
  try { const kb = await recDerive(i && i.value); if (await recCheckOf(kb) === REC_CHECK){ const p = REC_BUNDLE.split('.'); const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: recUn64(p[1])}, await recAes(kb), recUn64(p[2]));
    const h = new TextDecoder().decode(pt); if (devOk(h)){ try { DEVST.setItem('fin-dev', h); RAWLS.removeItem('fin-rec-fail'); } catch (e) {} DEV_ON = true; ok = true; } } } catch (e) {}
  if (ok){ const b = $('#dev_box'); if (b) b.remove(); liveApply(); devPermSync(); toast(t('rec_ok')); return; }
  let f = 0; try { f = +(RAWLS.getItem('fin-rec-fail') || 0) + 1; if (f >= 5){ RAWLS.setItem('fin-rec-lock', Date.now() + 60e3); f = 0; } RAWLS.setItem('fin-rec-fail', f); } catch (e) {}
  if (m) m.textContent = t('rec_bad'); }
document.addEventListener('click', async e => { const b = e.target.closest('[data-rec]'); if (!b) return; const a = b.dataset.rec;
  if (a === 'forgot') recForm(); else if (a === 'try') recTry(); else if (a === 'new') recCreate(); else if (a === 'have') recExisting();
  else if (a === 'close'){ const o = $('#rec_modal'); if (o) o.remove(); if (RECH){ const r = RECH; RECH = null; r(''); } }
  else if (a === 'hgo') recHGo();
  else if (a === 'copy'){ try { await navigator.clipboard.writeText(b.dataset.v); const o = b.textContent; b.textContent = t('rec_copied'); setTimeout(() => b.textContent = o, 1500); } catch (err) { const ta = $('#rec_modal .rec-line'); if (ta){ ta.focus(); ta.select(); } } }
  else if (a === 'make'){ const v = String(($('#rec_ex') || {}).value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), m = $('#rec_exm'); if (v.length !== 20){ if (m) m.textContent = t('rec_len'); return; } if (m) m.textContent = '…'; const line = await recLine(v); if (line) recShowLine(line, ''); }
});
new MutationObserver(() => {
  const box = $('#dev_box'); if (box && !box.dataset.recDone){ box.dataset.recDone = '1'; const rh = $('#dev_rec .fine');
    if (rh) rh.insertAdjacentHTML('afterend', `<p class="fine">${asEsc(t('rec_alsoShared'))}</p>`);
    else if (!box.querySelector('[data-rec]')) box.insertAdjacentHTML('beforeend', `<div class="dev-row"><button type="button" class="mv wide" data-rec="forgot">${asEsc(t('rec_forgot'))}</button></div>`); }
  const off = $('#dev_off'); if (off && DEV_ON && !$('#rec_row')) off.closest('.btnrow').insertAdjacentHTML('afterend', `<div class="btnrow" id="rec_row"><button type="button" class="mv wide" data-rec="new">${asEsc(t('rec_new'))}</button><button type="button" class="mv wide" data-rec="have">${asEsc(t('rec_have'))}</button></div>`);
}).observe(document.body, {childList: true, subtree: true});

/* the shared code typed into the existing backup-code field (#dev_rcode) is checked here first */
async function recFromField(){ const i = $('#dev_rcode'), m = $('#dev_rmsg'); const v = String(i && i.value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 20) return false;
  if (m) m.textContent = '…'; let ok = false;
  try { const kb = await recDerive(v); if (REC_CHECK && await recCheckOf(kb) === REC_CHECK){ const p = REC_BUNDLE.split('.'); const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: recUn64(p[1])}, await recAes(kb), recUn64(p[2]));
    const h = new TextDecoder().decode(pt); if (devOk(h)){ try { DEVST.setItem('fin-dev', h); } catch (e) {} DEV_ON = true; ok = true; } } } catch (e) {}
  if (ok){ const b = $('#dev_box'); if (b) b.remove(); liveApply(); devPermSync(); toast(t('rec_ok')); }
  return ok; }
document.addEventListener('click', async e => { if (!e.target.closest('#dev_rgo')) return; const v = String(($('#dev_rcode') || {}).value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length === 20){ e.stopImmediatePropagation(); if (!(await recFromField())){ const m = $('#dev_rmsg'); if (m) m.textContent = t('rec_bad'); } } }, true);
document.addEventListener('keydown', async e => { if (e.key !== 'Enter' || !e.target || e.target.id !== 'dev_rcode') return; const v = String(e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length === 20){ e.preventDefault(); e.stopImmediatePropagation(); if (!(await recFromField())){ const m = $('#dev_rmsg'); if (m) m.textContent = t('rec_bad'); } } }, true);

/* change the developer code (shared with Quiet Breath): makes a new code + a line to apply; nothing changes until it is applied */
function devNewCode(){ const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(12)); let s = 'FC'; for (let i = 0; i < 12; i++){ if (i % 4 === 0) s += '-'; s += A[r[i] % A.length]; } return s; }
function recChange(){ let n = ''; try { n = DEVST.getItem('fin-dev-n') || ''; } catch (e) {}
  recModal(`<b>${asEsc(t('rec_chg'))}</b><label for="dc_name">${asEsc(t('rec_chgName'))}</label><input id="dc_name" type="text" autocomplete="off" autocapitalize="characters" dir="ltr" value="${asEsc(n)}"><p>${asEsc(t('rec_chgNeed'))}</p><input id="dc_rec" type="text" autocomplete="off" autocapitalize="characters" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"><button type="button" class="gold-btn" data-rec="chgGo">${asEsc(t('rec_chgGo'))}</button><small class="hint" id="dc_msg"></small><div id="dc_out"></div>`); }
async function recChangeGo(){ const m = $('#dc_msg'), name = devNameNorm(($('#dc_name') || {}).value), rc = ($('#dc_rec') || {}).value; if (!name){ if (m) m.textContent = t('rec_chgNoName'); return; }
  if (m) m.textContent = '…';
  try { const kb = await recDerive(rc); if (!REC_CHECK || await recCheckOf(kb) !== REC_CHECK){ if (m) m.textContent = t('rec_bad'); return; }
    const code = devNewCode(); const hb = await pbk(name + ':' + devNorm(code), new TextEncoder().encode('fincalc-dev-v2'), 150000, 256); const h2 = recHex(hb);
    const chk = recHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(h2))), iv = crypto.getRandomValues(new Uint8Array(12));
    const bundle = 'nsr1.' + recB64(iv) + '.' + recB64(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await recAes(kb), new TextEncoder().encode(h2)));
    let wrap = ''; try { if (await ibKey()){ wrap = await ibWrapKey(devSha('ib-v1:' + h2)); RAWLS.setItem('fin-ibkey-next', wrap); } } catch (e) {}
    const line = 'NSDEV1~' + chk + '~' + bundle + (wrap ? '~' + wrap : ''); if (m) m.textContent = ''; const r = $('#dc_rec'); if (r) r.value = '';
    $('#dc_out').innerHTML = `<p>${asEsc(t('rec_chgShow'))}</p><div class="rec-code" dir="ltr">${asEsc(name)} · ${code}</div><button type="button" class="mv wide" data-rec="copy" data-v="${code}">${asEsc(t('rec_copyCode'))}</button><p class="rec-warn">${asEsc(t('rec_chgNever'))}</p><p>${asEsc(t('rec_chgSend'))}</p><textarea class="rec-line" readonly rows="5" dir="ltr">${line}</textarea><button type="button" class="gold-btn" data-rec="copy" data-v="${line}">${asEsc(t('rec_copyLine'))}</button>`;
  } catch (e) { if (m) m.textContent = '⚠️'; } }
document.addEventListener('click', e => { const b = e.target.closest('[data-rec="chg"],[data-rec="chgGo"]'); if (!b) return; if (b.dataset.rec === 'chg') recChange(); else recChangeGo(); });
new MutationObserver(() => { const r = $('#rec_row'); if (r && !r.querySelector('[data-rec="chg"]')) r.insertAdjacentHTML('beforeend', `<button type="button" class="mv wide" data-rec="chg">${asEsc(t('rec_chg'))}</button>`); }).observe(document.body, {childList: true, subtree: true});
