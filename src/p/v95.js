/* ================= 9.2: one inbox for the developer — messages from the app and from the website ================= */
/* From the website a message is locked (encrypted) on the person's phone with the developer's PUBLIC key and handed to a relay
   (ntfy.sh). The site's server collects it twice an hour into inbox.json. Only the app, in developer mode, holds the PRIVATE key
   (in its own database, readable only by the owner), so only the developer can read website messages. The person just taps "Send". */
const INBOX_TOPIC = 'fc-in-318ca4899cb6f959f4e4de51', INBOX_PUB = {"kty": "RSA", "n": "wxtR5meXd5lblZDdURSscmj48iXULVTtEJtrqAj6Lsm6GnSd18JVzEuhQfgRZJZ-3BXPJNaUWFEwRh2YAYsNpeceOWkrKeq3R4vigswqUDVSphAe-v_UUQoCpRXT3vypPYbBps_6ndsVcn96UjdW1Azz12ZrIn0JJprYVhZEh7UDpVoXM0WUHOxItdNHWfeOJ_D9dZXrYPlup9GANJsPMygFPbIv2bdIwHjoPxhir3ZmmGilH5yqTvOJw1Rc504ofLc9JY3oM1cR0pedexJbU8vZwrU2i5atTNvFRNvlh31HH7HrR5FZ1NZxHnRlyMit-lqGIlxA2THDeLLkqr_INQ", "e": "AQAB", "alg": "RSA-OAEP-256"};
const INBOX_URL = IN_CLAUDE ? 'https://ysdesign-il.github.io/financial-calculator/inbox.json' : 'inbox.json';
const ib64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), ibUn64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function ibLock(obj){
  const S = crypto.subtle, pk = await S.importKey('jwk', INBOX_PUB, {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['encrypt']);
  const ak = await S.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt']), iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await S.encrypt({name: 'AES-GCM', iv}, ak, new TextEncoder().encode(JSON.stringify(obj)));
  const k = await S.encrypt({name: 'RSA-OAEP'}, pk, await S.exportKey('raw', ak));
  return 'fc1.' + ib64(k) + '.' + ib64(iv) + '.' + ib64(c);
}
async function ibUnlock(txt, jwk){
  const p = String(txt || '').split('.'); if (p[0] !== 'fc1' || p.length !== 4) throw new Error('fmt');
  const S = crypto.subtle, sk = await S.importKey('jwk', jwk, {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['decrypt']);
  const raw = await S.decrypt({name: 'RSA-OAEP'}, sk, ibUn64(p[1])), ak = await S.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await S.decrypt({name: 'AES-GCM', iv: ibUn64(p[2])}, ak, ibUn64(p[3]))));
}
async function ibSendWeb(it){
  const body = await ibLock(it);
  const r = await fetch('https://ntfy.sh/' + INBOX_TOPIC, {method: 'POST', body, credentials: 'omit', referrerPolicy: 'no-referrer'});
  if (!r.ok) throw new Error('relay ' + r.status);
}
/* ---------- the inbox (developer mode, inside the app) ---------- */
var IB = {key: null, list: [], f: 'all'};
async function ibKey(){
  if (IB.key || !FB.db) return IB.key;
  try { const d = await FB.db.doc('devkeys/inbox').get(); if (d && d.exists) IB.key = (d.data() || {}).jwk || null; } catch (e) {}
  return IB.key;
}
async function ibLoad(){
  const all = [];
  if (FB.db){
    try { const q = await FB.db.collection('feedback').get(); (q.docs || []).forEach(d => { const x = d.data() || {}, rp = x.rp || {}; (x.items || []).forEach(i => all.push(Object.assign({}, i, {src: 'app', doc: d.id, id: 'a' + d.id + i.at, rp: rp[String(i.at)]}))); }); } catch (e) {}
  }
  try {
    const r = await fetch(INBOX_URL + '?v=' + Date.now(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (r.ok){ const j = await r.json(), key = await ibKey();
      for (const m of (j.m || []).slice(-500)){
        if (!key){ all.push({src: 'web', id: 'w' + m.id, at: (m.t || 0) * 1000, locked: 1}); continue; }
        try { const x = await ibUnlock(m.c, key); all.push(Object.assign({}, x, {src: 'web', id: 'w' + m.id, at: x.at || (m.t || 0) * 1000})); } catch (e) {}
      }
    }
  } catch (e) {}
  const hide = (SET.ibHide || []);
  IB.list = all.filter(i => !hide.includes(i.id)).sort((a, b) => (b.at || 0) - (a.at || 0));
  return IB.list;
}
const ibUnread = () => IB.list.filter(i => (i.at || 0) > (+SET.ibSeen || 0)).length;
function ibBtn(){
  const brand = $('.rail .brand'); let b = $('#ib_open');
  if (!IN_CLAUDE || !liveOwner() || !brand){ if (b) b.remove(); return; }
  const n = ibUnread(), html = `📥 ${E95(t('ib_title'))}${n ? ` <span class="al-n">${n}</span>` : ''}`;
  if (!b){ (($('#pwa_inst')) || brand).insertAdjacentHTML('afterend', `<button type="button" class="pwa-inst ib-open" id="ib_open">${html}</button>`); }
  else if (b.innerHTML !== html) b.innerHTML = html;
}
const E95 = s => asEsc(String(s == null ? '' : s));
function ibDraw(){
  const box = $('#ibx_b'); if (!box) return;
  const L = IB.list.filter(i => IB.f === 'all' || i.src === IB.f), seen = +SET.ibSeen || 0;
  box.innerHTML = `<div class="ch-rng" role="tablist">${['all', 'app', 'web'].map(f => `<button type="button" role="tab" data-ibf="${f}" class="${f === IB.f ? 'on' : ''}">${E95(t('ib_f_' + f))} (${IB.list.filter(i => f === 'all' || i.src === f).length})</button>`).join('')}</div>
    ${IB.list.some(i => i.locked) ? `<p class="fine bad">${E95(t('ib_nokey'))}</p>` : ''}
    <div class="fb-list ib-list">${L.length ? L.map(i => `<div class="fb-it${(i.at || 0) > seen ? ' ib-new' : ''}">
      <div class="ib-h"><b>${i.locked ? '🔒' : E95(t('fb_k_' + i.k) || i.k || '')}</b>${i.r ? ` <span class="fb-r">${'★'.repeat(i.r)}</span>` : ''}<span class="ib-src">${E95(t('ib_s_' + i.src))}</span>
      <button type="button" class="lc-del" data-ibdel="${E95(i.id)}" aria-label="${E95(t('ins_del'))}">✕</button></div>
      <small>${E95(svdDate(i.at))}${i.v ? ' · ' + E95(i.v) : ''}${i.s ? ' · ' + E95(t('tab_' + i.s)) : ''}</small>
      ${i.e ? `<a class="fb-mail" dir="ltr" href="mailto:${E95(i.e)}">✉️ ${E95(i.e)}</a>` : ''}${i.m ? `<p dir="auto">${E95(i.m)}</p>` : ''}
      ${i.rp ? `<div class="fb-rp"><b>↩️ ${E95(t('fb_yourReply'))}</b><p dir="auto">${E95(i.rp.m)}</p></div>` : ''}
      ${i.src === 'app' ? `<details class="fb-ans"><summary>↩️ ${E95(t(i.rp ? 'fb_editReply' : 'fb_reply'))}</summary><textarea rows="3" maxlength="1500" dir="auto">${E95(i.rp ? i.rp.m : '')}</textarea><button type="button" class="lc-add" data-fbsend="${E95(i.doc)}|${i.at}">📨 ${E95(t('fb_sendReply'))}</button></details>`
        : i.e ? `<p class="fine">${E95(t('ib_webReply'))}</p>` : ''}
    </div>`).join('') : `<p class="fine">${E95(t('fb_none'))}</p>`}</div>`;
}
async function ibOpen(){
  if (!$('#ibx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="ibx" hidden><div class="cp-box ib-box" role="dialog" aria-modal="true" aria-labelledby="ibx_t"><div class="cp-top"><h3 id="ibx_t"></h3><button type="button" class="fg-x" id="ibx_r">🔄</button><button type="button" class="cp-x" id="ibx_x">×</button></div><div id="ibx_b"><p class="fine">…</p></div></div></div>`);
  $('#ibx_t').textContent = '📥 ' + t('ib_title'); $('#ibx_x').setAttribute('aria-label', t('cp_close')); $('#ibx_r').setAttribute('aria-label', t('ci_ref'));
  $('#ibx').hidden = false; document.body.classList.add('cp-lock');
  await ibLoad(); ibDraw();
  SET.ibSeen = Math.max(+SET.ibSeen || 0, ...IB.list.map(i => i.at || 0)); try { saveSet(); } catch (e) {} ibBtn();
}
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  if (e.target.closest('#ib_open, [data-ibgo]')) return ibOpen();
  const o = $('#ibx'); if (!o || o.hidden) return;
  if (e.target === o || e.target.closest('#ibx_x')){ o.hidden = true; document.body.classList.remove('cp-lock'); return; }
  if (e.target.closest('#ibx_r')){ await ibLoad(); return ibDraw(); }
  const f = e.target.closest('[data-ibf]'); if (f){ IB.f = f.dataset.ibf; return ibDraw(); }
  const d = e.target.closest('[data-ibdel]'); if (d){ SET.ibHide = (SET.ibHide || []).concat(d.dataset.ibdel).slice(-2000); try { saveSet(); } catch (er) {} IB.list = IB.list.filter(i => i.id !== d.dataset.ibdel); return ibDraw(); }
  if (e.target.closest('[data-fbsend]')) setTimeout(async () => { await ibLoad(); ibDraw(); }, 900);
});
/* the old in-settings list becomes a door to the inbox */
fbOwner = async function(){
  if (!FB.db || !liveOwner()) return;
  const sys = $('.set-cat[data-cat="system"]'); if (!sys || $('#fb_own')) return;
  sys.insertAdjacentHTML('beforeend', `<div class="bk-box" id="fb_own"><h4>📥 ${E95(t('ib_title'))}</h4><p class="fine">${E95(t('ib_note'))}</p><div class="bk-acts"><button type="button" class="lc-add" data-ibgo="1">📥 ${E95(t('ib_openB'))}</button></div></div>`);
};
(async function ibStart(){
  if (!IN_CLAUDE) return;
  /* the database and the owner check both arrive a moment after the page opens: wait for them (up to two minutes) */
  for (let i = 0; i < 240 && !(FB.db && liveOwner()); i++) await new Promise(r => setTimeout(r, 500));
  if (!FB.db || !liveOwner()) return;
  try { ibBottom(); ibBtn(); } catch (e) {}
  await ibLoad(); ibBtn();
  setInterval(async () => { if (!document.hidden && liveOwner()){ await ibLoad(); ibBtn(); } }, 300000);
})();
const _act95 = activate;
activate = function(){ const r = _act95.apply(this, arguments); try { ibBtn(); } catch (e) {} return r; };
if (location.hostname === 'localhost') window.__fin95 = {ibLock, ibUnlock};
/* in developer mode (inside the app) the bottom bar's "Salary" button becomes the inbox */
const IB_ICON = ic('<path d="M3 13l2.5-8h13L21 13v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>');
function ibBottom(){
  const el = $('#bottom'); if (!el) return;
  const s = el.querySelector('.bt[data-tab="salary"]'), cur = el.querySelector('#ib_bt');
  if (!(IN_CLAUDE && liveOwner())){ if (cur){ try { renderBottom(); } catch (e) {} } return; }
  const n = ibUnread(), html = `${IB_ICON}<span>${E95(t('ib_title'))}</span>${n ? `<i class="ib-badge">${n > 99 ? '99+' : n}</i>` : ''}`;
  if (s){ s.outerHTML = `<button type="button" class="bt ib-bt" id="ib_bt" data-ibgo="1" aria-label="${E95(t('ib_title'))}">${html}</button>`; return; }
  if (cur && cur.innerHTML !== html) cur.innerHTML = html;
}
const _rb95 = renderBottom;
renderBottom = function(){ const r = _rb95.apply(this, arguments); try { ibBottom(); } catch (e) {} return r; };
const _ibBtn95 = ibBtn;
ibBtn = function(){ const r = _ibBtn95.apply(this, arguments); try { ibBottom(); } catch (e) {} return r; };
try { ibBottom(); } catch (e) {}

/* whenever the owner check or developer mode changes, update the bar at once */
const _pr95 = permRender;
permRender = function(){ const r = _pr95.apply(this, arguments); try { ibBottom(); ibBtn(); } catch (e) {} return r; };
const _la95 = liveApply;
liveApply = function(){ const r = _la95.apply(this, arguments); try { ibBottom(); ibBtn(); } catch (e) {} return r; };
/* a recalculation for a screen that has no page (e.g. a developer tool) is simply skipped */
const _calc95 = calc;
calc = function(id){ if (!id || !document.getElementById('panel-' + id)) return; return _calc95.apply(this, arguments); };
/* the inbox button in the bottom bar opens the inbox and is not a screen to switch to */
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#ib_bt'); if (!b) return; e.stopPropagation(); e.preventDefault(); ibOpen(); }, true);
