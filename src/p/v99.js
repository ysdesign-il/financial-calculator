/* ================= 9.9: replying to website messages from the inbox on the website ================= */
/* A website message carries a secret reply code (made on the sender's phone and kept there). The developer's reply is locked
   with that code and goes through the same relay; the site's server collects it into replies.json. Only the sender's phone,
   which holds the code, can open it — nobody else can read it or tell who it is for. */
const E99 = s => asEsc(String(s == null ? '' : s));
const hex = u => Array.from(new Uint8Array(u), x => x.toString(16).padStart(2, '0')).join('');
async function rkId(rk){ return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('id:' + rk))).slice(0, 24); }
async function rkKey(rk){ const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('key:' + rk)); return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
function rkMine(){ try { return JSON.parse(LS.getItem('fin-fb-rk') || '[]') || []; } catch (e) { return []; } }
/* the sender: every website message gets its own reply code */
const _send99 = ibSendWeb;
ibSendWeb = async function(it){
  const rk = hex(crypto.getRandomValues(new Uint8Array(16)));
  const r = await _send99.call(this, Object.assign({}, it, {rk}));
  try { const L = rkMine().concat({rk, at: it.at || Date.now(), m: String(it.m || '').slice(0, 300), k: it.k, r: it.r}).slice(-30); LS.setItem('fin-fb-rk', JSON.stringify(L)); } catch (e) {}
  return r;
};
/* the developer (website, developer mode): reply to a website message */
async function rpSend(rk, msg){
  const iv = crypto.getRandomValues(new Uint8Array(12)), k = await rkKey(rk);
  const c = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, k, new TextEncoder().encode(JSON.stringify({m: msg, at: Date.now()})));
  const body = 'fr1.' + (await rkId(rk)) + '.' + ib64(iv) + '.' + ib64(c);
  const r = await fetch('https://ntfy.sh/' + INBOX_TOPIC, {method: 'POST', body, credentials: 'omit', referrerPolicy: 'no-referrer'});
  if (!r.ok) throw new Error('relay ' + r.status);
}
function rpSent(){ try { return JSON.parse(RAWLS.getItem('fin-ib-rp') || '{}') || {}; } catch (e) { return {}; } }
const _ibDraw99 = ibDraw;
ibDraw = function(){
  const r = _ibDraw99.apply(this, arguments);
  try {
    const L = IB.list.filter(i => IB.f === 'all' || i.src === IB.f), sent = rpSent();
    $$('#ibx .ib-list .fb-it').forEach((el, n) => {
      const i = L[n]; if (!i || i.src !== 'web' || i.locked || el.querySelector('.rp-web')) return;
      const note = [...el.querySelectorAll('p.fine')].find(p => p.textContent === t('ib_webReply')); if (note) note.remove();
      if (!i.rk){ if (i.e) el.insertAdjacentHTML('beforeend', `<p class="fine rp-web">${E99(t('ib_webReply'))}</p>`); return; }
      const mine = sent[i.id];
      el.insertAdjacentHTML('beforeend', `<div class="rp-web">${mine ? `<div class="fb-rp"><b>↩️ ${E99(t('fb_yourReply'))}</b><p dir="auto">${E99(mine.m)}</p></div>` : ''}
        ${IN_CLAUDE ? `<p class="fine">${E99(t('rp_fromSite'))}</p>` : `<details class="fb-ans"><summary>↩️ ${E99(t(mine ? 'fb_editReply' : 'fb_reply'))}</summary><textarea rows="3" maxlength="900" dir="auto"></textarea><button type="button" class="lc-add" data-rpweb="${E99(i.id)}">📨 ${E99(t('fb_sendReply'))}</button></details>`}</div>`);
    });
  } catch (e) {}
  return r;
};
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-rpweb]'); if (!b || !liveOwner()) return;
  const i = IB.list.find(x => x.id === b.dataset.rpweb), ta = b.parentNode.querySelector('textarea'), m = String(ta && ta.value || '').trim().slice(0, 900);
  if (!i || !i.rk) return; if (!m) return toast(t('fb_empty'));
  b.disabled = true;
  try { await rpSend(i.rk, m); const s = rpSent(); s[i.id] = {m, at: Date.now()}; try { RAWLS.setItem('fin-ib-rp', JSON.stringify(s)); } catch (er) {} toast(t('rp_sentWeb')); ibDraw(); }
  catch (er) { toast(t('fb_fail')); b.disabled = false; }
});
/* the sender: replies waiting for this phone appear under the feedback box */
async function rpCheck(){
  const mine = rkMine(); if (!mine.length) return;
  let j = null; try { const r = await fetch((IN_CLAUDE ? SITE_BASE : '') + 'replies.json?v=' + Math.floor(Date.now() / 60000), {cache: 'no-store', credentials: 'omit'}); if (r.ok) j = await r.json(); } catch (e) {}
  if (!j || !Array.isArray(j.r)) return;
  const got = [];
  for (const x of mine){
    const id = await rkId(x.rk), hits = j.r.filter(y => y.id === id); if (!hits.length) continue;
    const y = hits[hits.length - 1];
    try { const k = await rkKey(x.rk), p = String(y.c).split('.'); const d = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: 'AES-GCM', iv: ibUn64(p[0])}, k, ibUn64(p[1])))); got.push({x, d}); } catch (e) {}
  }
  if (!got.length) return;
  const fb = $('#fb_box'); if (fb){
    let box = $('#rp_web'); if (!box){ fb.insertAdjacentHTML('beforeend', '<div id="rp_web" class="fb-list"></div>'); box = $('#rp_web'); }
    box.innerHTML = `<h4>📬 ${E99(t('fb_replies'))}</h4>` + got.sort((a, b) => b.d.at - a.d.at).map(({x, d}) => `<div class="fb-it"><small>${E99(svdDate(x.at))}</small>${x.m ? `<p dir="auto">${E99(x.m)}</p>` : ''}<div class="fb-rp"><b>↩️ ${E99(t('fb_devReply'))}</b><p dir="auto">${E99(d.m)}</p></div></div>`).join('');
  }
  let seen = 0; try { seen = +LS.getItem('fin-rp-seen') || 0; } catch (e) {}
  const last = Math.max(...got.map(g => g.d.at || 0));
  if (last > seen){ toast('📬 ' + t('fb_newReply')); try { LS.setItem('fin-rp-seen', String(last)); } catch (e) {} }
}
setTimeout(rpCheck, 4000);
setInterval(() => { if (!document.hidden) rpCheck(); }, 300000);
const _act99 = activate;
activate = function(id){ const r = _act99.apply(this, arguments); if (id === 'settings') setTimeout(rpCheck, 300); return r; };
