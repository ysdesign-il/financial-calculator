/* ---------- 13.8: moving to a new address without losing anything ----------
   The browser keeps the app's data per address, so a new domain starts empty. When MIG_TO is set:
   • on the old address the app shows "the app has moved": one tap opens the new address and hands it all the data
     directly, phone to phone (window.postMessage between the two tabs – no server, nothing in the link);
   • on the new address the app receives it, but only from the old addresses listed here.
   Encrypted accounts stay encrypted. Leave MIG_TO empty until the new address is live. */
const MIG_TO = 'https://financial-calculator.design-il.workers.dev';                                         // e.g. 'https://example.co.il' – no trailing slash
const MIG_FROM = ['https://ysdesign-il.github.io'];
const migE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const migKeys = () => { const L = []; try { for (let i = 0; i < RAWLS.length; i++){ const k = RAWLS.key(i); if (k && k.indexOf('fin-') === 0 && k !== 'fin-migrated') L.push(k); } } catch (e) {} return L; };
const migItems = () => { const o = {}; migKeys().forEach(k => { try { o[k] = RAWLS.getItem(k); } catch (e) {} }); return o; };
const migGo = () => location.replace(MIG_TO + '/' + location.search + (location.hash && !/^#mig/.test(location.hash) ? location.hash : ''));
function migOverlay(html){
  let o = $('#migx'); if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="mig-ov" id="migx" role="dialog" aria-modal="true" aria-labelledby="migx_t"><div class="mig-box" id="migx_b"></div></div>`); o = $('#migx'); }
  $('#migx_b').innerHTML = html; document.body.classList.add('cp-lock'); setTimeout(() => { const b = $('#migx_b button'); if (b) b.focus(); }, 30);
}
const migHost = () => { let h = MIG_TO; try { h = new URL(MIG_TO).host; } catch (e) {} return '\u2068' + h + '\u2069'; };

/* ---------- the old address ---------- */
var MIGS = {w: null, t: null, sent: false};
function migOld(){
  const n = (typeof FIN_K0 !== 'undefined' ? FIN_K0 : migKeys()).filter(k => !['fin-migrated', 'fin-ver', 'fin-tab', 'fin-lang', 'fin-upd-ntf', 'fin-fam-list'].includes(k)).length;
  let done = ''; try { done = RAWLS.getItem('fin-migrated') || ''; } catch (e) {}
  if (done || !n){ migGo(); return; }
  migOverlay(`<div class="mig-ic" aria-hidden="true">🚚</div><h2 id="migx_t">${migE(t('mig_t'))}</h2>
    <p>${migE(t('mig_h', {d: migHost()}))}</p>
    <div class="btnrow mig-btns"><button type="button" class="gold-btn" id="mig_go">📦 ${migE(t('mig_go'))}</button></div>
    <p class="fine">🔒 ${migE(t('mig_priv'))}</p>
    <div class="sl-st" id="mig_st" aria-live="polite"></div>
    <button type="button" class="lg-a" id="mig_skip">${migE(t('mig_skip'))}</button>`);
}
function migSend(){
  const items = migItems(); MIGS.sent = false;
  MIGS.w = window.open(MIG_TO + '/#mig', '_blank');
  const st = $('#mig_st');
  if (!MIGS.w){ migLink(items); return; }
  if (st){ st.textContent = t('mig_wait'); st.className = 'sl-st'; }
  clearTimeout(MIGS.t); MIGS.t = setTimeout(() => { if (!MIGS.sent){ const s = $('#mig_st'); if (s){ s.textContent = t('mig_slow'); s.className = 'sl-st bad'; } } }, 12000);
}
/* if the browser blocked the new tab: the data travels in the part of the link after #, which browsers never send to any server */
async function migLink(items){
  try {
    const raw = new TextEncoder().encode(JSON.stringify(items));
    let bytes = raw, z = '0';
    if (typeof CompressionStream === 'function'){ bytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); z = '1'; }
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (b64.length > 1500000){ const s = $('#mig_st'); if (s){ s.textContent = t('mig_big'); s.className = 'sl-st bad'; } return; }
    try { RAWLS.setItem('fin-migrated', String(Date.now())); } catch (e) {}
    location.href = MIG_TO + '/#migz=' + z + b64;
  } catch (e) { const s = $('#mig_st'); if (s){ s.textContent = t('mig_big'); s.className = 'sl-st bad'; } }
}
window.addEventListener('message', e => {
  if (!MIG_TO || e.origin !== MIG_TO || !e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'mig-ready' && MIGS.w && !MIGS.sent){ MIGS.sent = true; try { MIGS.w.postMessage({type: 'mig-data', v: 1, items: migItems()}, MIG_TO); } catch (er) {} return; }
  if (e.data.type === 'mig-done'){ clearTimeout(MIGS.t); try { RAWLS.setItem('fin-migrated', String(Date.now())); } catch (er) {}
    migOverlay(`<div class="mig-ic" aria-hidden="true">✅</div><h2 id="migx_t">${migE(t('mig_done'))}</h2><p>${migE(t('mig_doneH', {d: migHost()}))}</p>
      <div class="btnrow mig-btns"><button type="button" class="gold-btn" id="mig_open">↗ ${migE(t('mig_open'))}</button></div>`); }
});

/* ---------- the new address ---------- */
function migApply(items){
  if (!items || typeof items !== 'object') return false;
  // never on the owner pages, and never the owner's keys or code drafts (a crafted link must not be able to plant them)
  if (/^\/admin(\/|$)/.test(location.pathname)) return false;
  const keys = Object.keys(items).filter(k => /^fin-[\w:.\-+=/]*$/.test(k) && k !== 'fin-migrated' && !/^fin-(dev|ibkey|fam$|fam-)/.test(k) && typeof items[k] === 'string');
  if (!keys.length) return false;
  let mine = 0; try { mine = migKeys().filter(k => !['fin-lang', 'fin-ver', 'fin-tab', 'fin-upd-ntf'].includes(k)).length; } catch (e) {}
  if (!confirm(t('mig_over'))) return false;
  keys.forEach(k => { try { RAWLS.setItem(k, items[k]); } catch (e) {} });
  return true;
}
function migNew(){
  const h = location.hash || '';
  if (h === '#mig' && window.opener){
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    migOverlay(`<div class="mig-ic" aria-hidden="true">📥</div><h2 id="migx_t">${migE(t('mig_recv'))}</h2><p class="fine">${migE(t('mig_recvH'))}</p>`);
    const ok = e => {
      if (!MIG_FROM.includes(e.origin) || !e.data || e.data.type !== 'mig-data') return;
      window.removeEventListener('message', ok);
      const applied = migApply(e.data.items);
      try { e.source.postMessage({type: applied ? 'mig-done' : 'mig-no'}, e.origin); } catch (er) {}
      if (applied){ migOverlay(`<div class="mig-ic" aria-hidden="true">✅</div><h2 id="migx_t">${migE(t('mig_ok'))}</h2>`); setTimeout(() => location.reload(), 900); }
      else { const o = $('#migx'); if (o) o.remove(); document.body.classList.remove('cp-lock'); }
    };
    window.addEventListener('message', ok);
    MIG_FROM.forEach(o => { try { window.opener.postMessage({type: 'mig-ready'}, o); } catch (e) {} });
    return;
  }
  if (h.indexOf('#migz=') === 0){
    const data = h.slice(6);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}       // the data leaves the address bar at once
    (async () => {
      try {
        const z = data.charAt(0), b64 = data.slice(1).replace(/-/g, '+').replace(/_/g, '/'), bin = atob(b64 + '==='.slice((b64.length + 3) % 4)), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const txt = z === '1' ? await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : new TextDecoder().decode(u);
        if (migApply(JSON.parse(txt))){ toast(t('mig_ok')); setTimeout(() => location.reload(), 900); }
      } catch (e) { toast(t('mig_fail')); }
    })();
  }
}
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#mig_go')){ migSend(); return; }
  if (e.target.closest('#mig_skip')){ try { RAWLS.setItem('fin-migrated', 'skip'); } catch (er) {} migGo(); return; }
  if (e.target.closest('#mig_open')){ if (MIGS.w && !MIGS.w.closed){ try { MIGS.w.focus(); return; } catch (er) {} } migGo(); return; }
});
try {
  if (MIG_TO && typeof IN_CLAUDE !== 'undefined' && !IN_CLAUDE){
    if (MIG_FROM.includes(location.origin)) migOld(); else if (location.origin === MIG_TO) migNew();
  }
} catch (e) {}
