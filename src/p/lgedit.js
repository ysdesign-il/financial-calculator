/* ---------- 13.55: the owner edits the three legal pages (terms, privacy, accessibility) from the admin version ----------
   "Edit" opens the page's current text in a box with a live preview. "Save for everyone" sends it to the server (/admin/__docs,
   which accepts it only from a signed-in admin session, up to 30,000 characters); "Back to the original text" removes the edit.
   Each language has its own text; the language you are in is the one you edit. Everything is drawn with textContent (lgRender). */
const LGE_DOCS = ['terms', 'priv', 'a11y'], LGE_MAX = 30000;
const lgeOn = () => !IN_CLAUDE && typeof admIn === 'function' && admIn();
const lgeLangName = () => { const x = LANG_LIST.find(l => l[0] === lang); return x ? x[1] : lang; };
const lgPaintBase = lgPaint;
lgPaint = function(k){
  const r = lgPaintBase.apply(this, arguments);
  try { if (lgeOn() && LGE_DOCS.includes(k)) lgeBar(k); } catch (e) {}
  return r;
};
function lgeBar(k){
  const box = $('#lgx_b'); if (!box || box.querySelector('.lge-bar')) return;
  const ed = lgEdited(k), bar = document.createElement('div'); bar.className = 'lge-bar';
  const st = document.createElement('span'); st.className = 'fine'; st.textContent = ed ? t('lge_stEd', {d: lgDay(ed.at)}) : t('lge_stOrig');
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mv'; b.dataset.lge = k; b.textContent = '✏️ ' + t('lge_edit');
  bar.appendChild(st); bar.appendChild(b); box.insertBefore(bar, box.firstChild);
}
function lgeCount(){
  const ta = $('#lge_ta'), c = $('#lge_cnt'); if (!ta || !c) return;
  const n = ta.value.length; c.textContent = t('lge_cnt', {n: n.toLocaleString(), m: LGE_MAX.toLocaleString()}); c.classList.toggle('bad', n > LGE_MAX);
}
function lgePreview(){ const ta = $('#lge_ta'), pv = $('#lge_pv'); if (ta && pv) lgRender(pv, ta.value); lgeCount(); }
function lgeOpen(k){
  const box = $('#lgx_b'); if (!box || !lgeOn()) return;
  const ed = lgEdited(k);
  box.innerHTML = `<div class="lge" data-doc="${lgE(k)}">
    <ul class="fine lge-help">${[['lge_h1', ''], ['lge_h2', '## '], ['lge_h3', '- ']].map(([key, c]) => `<li>${lgE(t(key, {c: '\u0001'})).replace('\u0001', `<bdi dir="ltr" class="lge-code">${lgE(c)}</bdi>`)}</li>`).join('')}</ul>
    <p class="fine">${lgE(t('lge_lang', {n: lgeLangName()}))}</p>
    <label class="lge-l" for="lge_ta">${lgE(t('lge_taL'))}</label>
    <textarea id="lge_ta" class="lge-ta" dir="auto" rows="14" spellcheck="true" autocomplete="off"></textarea>
    <p class="fine lge-cnt" id="lge_cnt" aria-live="polite"></p>
    <h4 class="lge-pvh" id="lge_pvh">${lgE(t('lge_pv'))}</h4>
    <div class="lge-pv lg-doc" id="lge_pv" role="region" aria-labelledby="lge_pvh"></div>
    <div class="btnrow lge-acts"><button type="button" class="gold-btn" id="lge_save">${lgE(t('lge_save'))}</button><button type="button" class="mv wide" id="lge_reset">${lgE(t('lge_reset'))}</button><button type="button" class="mv wide" id="lge_cancel">${lgE(t('lge_cancel'))}</button></div>
    <p class="fine" id="lge_msg" role="status" aria-live="polite"></p>
  </div>`;
  $('#lge_ta').value = ed ? ed.x : lgDefault(k);
  lgePreview(); box.scrollTop = 0;
  setTimeout(() => { try { $('#lge_ta').focus({preventScroll: true}); } catch (e) {} }, 30);
}
async function lgePost(body){
  const r = await fetch('/admin/__docs', {method: 'POST', headers: {'content-type': 'application/json'}, credentials: 'same-origin', cache: 'no-store', body: JSON.stringify(body)});
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok || j.ok === false){ const er = new Error(j.e || String(r.status)); er.st = r.status; throw er; }
  return j;
}
const lgeErr = er => er && er.st === 401 ? t('lge_errAuth') : er && er.message === 'big' ? t('lge_errBig', {m: LGE_MAX.toLocaleString()}) : er && er.message === 'empty' ? t('lge_errEmpty') : t('lge_err');
function lgeDone(k, j, msg){
  if (j && j.docs && j.docs.d && typeof j.docs.d === 'object') lgxSet(j.docs.d);
  lgPaint(k); $('#lgx_b').scrollTop = 0;
  try { toast(msg); } catch (e) {}
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'lge_ta') lgePreview(); });
document.addEventListener('click', async e => {
  const t0 = e.target; if (!t0.closest) return;
  let b = t0.closest('[data-lge]');
  if (b){ e.preventDefault(); lgeOpen(b.dataset.lge); return; }
  const root = t0.closest('.lge'); if (!root) return;
  const k = root.dataset.doc, msg = $('#lge_msg');
  if (!LGE_DOCS.includes(k) || !lgeOn()) return;
  if (t0.closest('#lge_cancel')){ lgPaint(k); return; }
  if ((b = t0.closest('#lge_save'))){
    const x = $('#lge_ta').value;
    if (!x.trim()){ msg.textContent = t('lge_errEmpty'); return; }
    if (x.length > LGE_MAX){ msg.textContent = t('lge_errBig', {m: LGE_MAX.toLocaleString()}); return; }
    b.disabled = true; msg.textContent = '';
    try { lgeDone(k, await lgePost({doc: k, l: lang, x}), t('lge_saved')); }
    catch (er) { b.disabled = false; msg.textContent = lgeErr(er); }
    return;
  }
  if ((b = t0.closest('#lge_reset'))){
    if (!b.dataset.sure){ b.dataset.sure = '1'; b.textContent = t('lge_resetSure'); clearTimeout(b._t); b._t = setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = t('lge_reset'); } }, 5000); return; }
    clearTimeout(b._t);
    if (!lgEdited(k)){ lgeDone(k, null, t('lge_resetOk')); return; }
    b.disabled = true; msg.textContent = '';
    try { lgeDone(k, await lgePost({doc: k, l: lang, reset: true}), t('lge_resetOk')); }
    catch (er) { b.disabled = false; delete b.dataset.sure; b.textContent = t('lge_reset'); msg.textContent = lgeErr(er); }
  }
});
