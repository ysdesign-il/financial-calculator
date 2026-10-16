/* ================= 9.1: feedback — users write to the developer; nobody sees anyone's private details ================= */
/* Inside the app: each person's notes go to their own slot in the app's database (feedback/<their id>); only the owner can read them.
   On the website there is no server of ours, so the note can only be copied (sending works inside the app).
   Emails, phone numbers and long digit runs are removed from the text before it is sent. The developer's details are never shown. */
const E94 = s => asEsc(String(s == null ? '' : s));
var FB = {db: null, uid: null};
(async function fbInit(){
  if (!IN_CLAUDE || !window.claude) return;
  try { const db = await window.claude.use('db'); if (!db) return; FB.db = db; const u = await window.claude.use('user'); if (u && u.id) FB.uid = await u.id(); fbBox(); fbOwner(); } catch (e) {}
})();
const fbClean = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[•]').replace(/\+?\d[\d\s\-()]{7,}\d/g, '[•]').slice(0, 1500);
function fbBox(){
  const sys = $('.set-cat[data-cat="system"]'); if (!sys) return;
  let box = $('#fb_box'); if (box){ if (box.dataset.db === String(!!FB.db)) return; box.remove(); }
  sys.insertAdjacentHTML('beforeend', `<div class="bk-box fb-box" id="fb_box" data-db="${!!FB.db}"><h4>💬 ${E94(t('fb_title'))}</h4><p class="fine">${E94(t('fb_note'))}</p>${FB.db ? '' : `<p class="fine fb-web">ℹ️ ${E94(t('fb_web'))}</p>`}
    <div class="fb-kinds" role="radiogroup" aria-label="${E94(t('fb_kind'))}">${['idea', 'bug', 'q', 'other'].map((k, i) => `<button type="button" role="radio" data-fbk="${k}" aria-checked="${i ? 'false' : 'true'}" class="${i ? '' : 'on'}">${E94(t('fb_k_' + k))}</button>`).join('')}</div>
    <div class="fb-stars" role="radiogroup" aria-label="${E94(t('fb_rate'))}">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" data-fbr="${n}" aria-label="${n}" aria-checked="false">★</button>`).join('')}</div>
    <textarea id="fb_msg" rows="4" maxlength="1500" dir="auto" placeholder="${E94(t('fb_ph'))}" aria-label="${E94(t('fb_title'))}"></textarea>
    <div class="bk-acts">${FB.db ? `<button type="button" class="lc-add" id="fb_send">📨 ${E94(t('fb_send'))}</button>` : ''}<button type="button" class="lc-add" id="fb_copy">📋 ${E94(t('b_copy'))}</button></div>
    <p class="fine fb-st" id="fb_st" aria-live="polite"></p></div>`);
}
var FBV = {k: 'idea', r: 0};
function fbItem(){ return {k: FBV.k, r: FBV.r, m: fbClean(($('#fb_msg') || {}).value), v: APP_VER, l: lang, s: tab === 'settings' ? '' : tab, at: Date.now()}; }
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  const k = e.target.closest('[data-fbk]'); if (k){ FBV.k = k.dataset.fbk; $$('[data-fbk]').forEach(b => { const on = b === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); return; }
  const r = e.target.closest('[data-fbr]'); if (r){ FBV.r = +r.dataset.fbr; $$('[data-fbr]').forEach(b => { const on = +b.dataset.fbr <= FBV.r; b.classList.toggle('on', on); b.setAttribute('aria-checked', +b.dataset.fbr === FBV.r); }); return; }
  const st = m => { const s = $('#fb_st'); if (s) s.textContent = t(m); };
  if (e.target.closest('#fb_copy')){ const it = fbItem(); if (!it.m) return st('fb_empty'); copyText(t('fb_k_' + it.k) + (it.r ? ' ' + '★'.repeat(it.r) : '') + '\n' + it.m + '\n— ' + APP_VER); toast(t('st_copied')); return; }
  if (!e.target.closest('#fb_send')) return;
  const it = fbItem(); if (!it.m && !it.r) return st('fb_empty');
  if (!(FB.db && FB.uid)) return st('fb_fail');
  {
    st('m_wait');
    try {
      let mine = []; try { mine = JSON.parse(LS.getItem('fin-fb') || '[]') || []; } catch (er) {}
      mine = mine.concat(it).slice(-20);
      await FB.db.doc('feedback/' + FB.uid).set({items: mine, at: Date.now()});
      try { LS.setItem('fin-fb', JSON.stringify(mine)); } catch (er) {}
      $('#fb_msg').value = ''; st('fb_ok'); toast(t('fb_ok'));
    } catch (er) { st('fb_fail'); }
    return;
  }
});
/* the owner reads everyone's notes here (developer mode, inside the app) */
async function fbOwner(){
  if (!FB.db || !liveOwner()) return;
  const sys = $('.set-cat[data-cat="system"]'); if (!sys) return;
  let box = $('#fb_own'); if (!box){ sys.insertAdjacentHTML('beforeend', `<div class="bk-box" id="fb_own"><h4>📥 ${E94(t('fb_inbox'))}</h4><div id="fb_list" class="fb-list">…</div><div class="bk-acts"><button type="button" class="lc-add" id="fb_ref">🔄 ${E94(t('ci_ref'))}</button></div></div>`); }
  try {
    const q = await FB.db.collection('feedback').get(), all = [];
    (q.docs || []).forEach(d => { const x = d.data() || {}; (x.items || []).forEach(i => all.push(i)); });
    all.sort((a, b) => (b.at || 0) - (a.at || 0));
    $('#fb_list').innerHTML = all.length ? all.slice(0, 100).map(i => `<div class="fb-it"><b>${E94(t('fb_k_' + i.k) || i.k)}</b>${i.r ? ` <span class="fb-r">${'★'.repeat(i.r)}</span>` : ''}<small>${E94(svdDate(i.at))} · ${E94(i.v || '')}${i.s ? ' · ' + E94(t('tab_' + i.s)) : ''}</small><p dir="auto">${E94(i.m)}</p></div>`).join('') : `<p class="fine">${E94(t('fb_none'))}</p>`;
  } catch (er) { const l = $('#fb_list'); if (l) l.textContent = t('fb_fail'); }
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#fb_ref')) fbOwner(); });
const _act94 = activate;
activate = function(id){ const r = _act94.apply(this, arguments); if (id === 'settings') try { fbBox(); fbOwner(); } catch (e) {} return r; };
try { fbBox(); } catch (e) {}
