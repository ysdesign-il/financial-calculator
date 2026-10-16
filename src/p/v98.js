/* ================= 9.8: a Sounds page in Settings, and phone plans by company — pick, rename and edit ================= */
const E98 = s => asEsc(String(s == null ? '' : s));

/* ---------- 1. Settings → Sounds ---------- */
SICO.set_sound = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>';
const SND_TRY = [['ok', 'snd_k_ok'], ['up', 'snd_k_up'], ['down', 'snd_k_down'], ['alert', 'snd_k_alert'], ['mail', 'snd_k_mail'], ['err', 'snd_k_err'], ['tap', 'snd_k_tap']];
function sndPage(){
  const sp = $('#panel-settings'), hub = $('#set_hub'); if (!sp || !hub || $('.set-cat[data-cat="sound"]', sp)) return;
  const grp = hub.querySelector('.sh-row[data-scat="display"]'); if (!grp) return;
  grp.insertAdjacentHTML('afterend', `<button type="button" class="sh-row" data-scat="sound"><span class="sh-ic c-gold">${scIcon('set_sound')}</span>
    <span class="sh-tx"><b data-i="sc_sound">${E98(t('sc_sound'))}</b><small data-i="sc_soundS">${E98(t('sc_soundS'))}</small></span><span class="sh-badge" id="sh_b_sound"></span>
    <svg class="sh-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`);
  const page = document.createElement('div'); page.className = 'set-cat'; page.dataset.cat = 'sound'; page.hidden = true;
  page.innerHTML = `<div class="sc-head"><button type="button" class="sc-back" data-scat=""><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span data-i="tab_settings">${E98(t('tab_settings'))}</span></button>
      <h3 class="sc-t"><span class="sh-ic c-gold">${scIcon('set_sound')}</span><span data-i="sc_sound">${E98(t('sc_sound'))}</span></h3></div>
    <section class="set-sec snd-sec"><div class="fields" id="snd_fields"></div>
      <h4 class="snd-h" data-i="snd_try">${E98(t('snd_try'))}</h4><div class="snd-try">${SND_TRY.map(([k, l]) => `<button type="button" class="snd-b" data-sndtry="${k}"><span aria-hidden="true">▶</span> <span data-i="${l}">${E98(t(l))}</span></button>`).join('')}</div>
      <p class="fine" data-i="h_sound">${E98(t('h_sound'))}</p></section>
    <section class="set-sec snd-sec"><h4 class="snd-h" data-i="snd_mvH">${E98(t('snd_mvH'))}</h4><div class="fields" id="snd_mv"></div></section>`;
  sp.appendChild(page);
  /* the controls move here from Display and Calculations, so there is one place for everything that makes a sound */
  [['set_sound', 'snd_fields'], ['set_tapSnd', 'snd_fields'], ['set_mvAlert', 'snd_mv'], ['set_mvPct', 'snd_mv']].forEach(([id, to]) => { const f = $('#' + id); const fld = f && f.closest('.field'); if (fld) $('#' + to).appendChild(fld); });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sndtry]'); if (!b) return;
  if (SET.sound === 'off'){ toast(t('snd_isOff')); return; }
  snd(b.dataset.sndtry);
});
try { sndPage(); } catch (e) {}

/* ---------- 2. phone plans: every plan shows its company; your own plans get a company and a name you can change ---------- */
const CL_COS = ['019', 'pelephone', 'cellcom', 'partner', 'golan', 'hot', 'wecom', 'xphone', 'ramilevy', 'other'];
const clCoName = c => c && c !== 'other' ? t('cp_' + c) : '';
cellName = pl => (pl.mine ? '✍️ ' : '') + (clCoName(pl.p) ? clCoName(pl.p) + ' · ' : '') + pl.n;
const _cellAll98 = cellAll;
cellAll = function(){
  const all = _cellAll98.apply(this, arguments).map(pl => pl.mine ? Object.assign({}, pl, {p: (cellMineList()[pl.i] || {}).co || 'other'}) : pl);
  const co = ($('#cl_co') || {}).value || 'all';
  return co === 'all' ? all : all.filter(pl => co === 'other' ? pl.mine : pl.p === co);
};
var CL_EDIT = {};
clRender = function(){
  const box = $('#cl_box'); if (!box) return;
  const L = cellMineList(), act = document.activeElement, keep = act && box.contains(act) ? act.getAttribute('data-k98') : null;
  const num = (lab, u, i, k, val) => `<div class="field"><span class="lc-l" aria-hidden="true">${E98(lab)}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-cli="${i}" data-clk="${k}" data-k98="cl${i}${k}" value="${val == null ? '' : E98(val)}" aria-label="${E98(lab)}">${unitHTML(u)}</div></div>`;
  box.innerHTML = `<p class="cl-src">📅 ${E98(t('cl_srcAt', {d: CELL.at}))} ${CELL.src.map(s => `<a href="${E98(s[1])}" target="_blank" rel="noopener noreferrer">${E98(s[0])}</a>`).join(' · ')}</p>
    <div class="cl-copy"><label for="cl_copyFrom">✏️ ${E98(t('cl_copyL'))}</label><select id="cl_copyFrom"><option value="">${E98(t('cl_copyPick'))}</option>${CL_COS.filter(c => c !== 'other').map(c => { const P = CELL.plans.map((p, i) => [p, i]).filter(([p]) => p.p === c); return P.length ? `<optgroup label="${E98(t('cp_' + c))}">${P.map(([p, i]) => `<option value="${i}">${E98(p.n)} · ${E98(M(cellPrice(p, 1, 1), 2))}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></div>
    <div class="ins-head"><b>${E98(t('cl_mine'))}</b><span class="ins-count">${E98(t('cl_mineN', {n: L.length}))}</span></div>` +
    L.map((o, i) => `<div class="lc-card cl-card"><div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>
        <select class="lc-name ins-co" data-cli="${i}" data-clk="co" data-k98="cl${i}co" aria-label="${E98(t('f_clCo'))}"><option value="">${E98(t('cl_coPick'))}</option>${CL_COS.map(c => `<option value="${c}"${c === o.co ? ' selected' : ''}>${E98(c === 'other' ? t('o_clCoOther') : t('cp_' + c))}</option>`).join('')}</select>
        <button type="button" class="lc-del ins-dup" data-cledit="${i}" aria-label="${E98(t('ins_edit'))}" title="${E98(t('ins_edit'))}">✏️</button>
        <button type="button" class="lc-del ins-dup" data-cldup="${i}" aria-label="${E98(t('ins_dup'))}" title="${E98(t('ins_dup'))}">⧉</button>
        <button type="button" class="lc-del" data-cldel="${i}" aria-label="${E98(t('ins_del'))}">✕</button></div>
      ${o.co === 'other' || CL_EDIT[i] || String(o.n || '').trim() ? `<input class="lc-name ins-nm" type="text" maxlength="40" dir="auto" data-cli="${i}" data-clk="n" data-k98="cl${i}n" value="${E98(o.n || '')}" placeholder="${E98(t('cl_namePh'))}" aria-label="${E98(t('lc_name'))}">` : ''}
      <div class="fields">${num(t('cl_price'), 'cur', i, 'price', o.price)}${num(t('h_clGb'), '', i, 'gb', o.gb)}${num(t('cl_pp'), 'cur', i, 'pp', o.pp)}${num(t('cl_pm'), 'mo', i, 'pm', o.pm)}</div>
      <div class="cl-chk"><label><input type="checkbox" data-cli="${i}" data-clk="g5"${o.g5 ? ' checked' : ''}> 5G</label><label><input type="checkbox" data-cli="${i}" data-clk="ab"${o.ab ? ' checked' : ''}> ${E98(t('cl_ab'))}</label></div>
    </div>`).join('') +
    `<button type="button" class="lc-add" id="cl_add"><span aria-hidden="true">＋</span> ${E98(t('cl_add'))}</button><p class="fine lc-hint">${E98(t('h_cl2'))}</p>`;
  if (keep){ const el = box.querySelector(`[data-k98="${keep}"]`); if (el) el.focus(); }
};
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#cl_box')) return;
  if (el.id === 'cl_copyFrom' && el.value !== ''){
    const p = CELL.plans[+el.value]; if (!p) return;
    const s = p.s || [[1, 0]], pm = s.length > 1 ? s[1][0] - 1 : 0;
    cellMineList().push({co: p.p, n: p.n, price: s.length > 1 ? s[s.length - 1][1] : s[0][1], pp: s.length > 1 ? s[0][1] : 0, pm, gb: p.gb >= 1e6 ? 0 : p.gb, g5: p.g5 ? 1 : 0, ab: p.ab ? 1 : 0});
    saveSet(); clRender(); calc(tab); toast(t('cl_copied')); const c = $$('#cl_box .cl-card').pop(); if (c) c.scrollIntoView({block: 'center'});
    return;
  }
  if (el.dataset && el.dataset.clk === 'co'){ const o = cellMineList()[+el.dataset.cli]; if (!o) return; o.co = el.value; saveSet(); clRender(); calc(tab); if (o.co === 'other'){ const n = $(`#cl_box .ins-nm[data-cli="${el.dataset.cli}"]`); if (n) n.focus(); } }
}, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const ed = e.target.closest('[data-cledit]'); if (ed){ const i = +ed.dataset.cledit; CL_EDIT[i] = true; clRender(); const n = $(`#cl_box .ins-nm[data-cli="${i}"]`); if (n){ n.focus(); n.select(); } return; }
  const du = e.target.closest('[data-cldup]'); if (du){ const L = cellMineList(), i = +du.dataset.cldup; if (!L[i]) return; L.splice(i + 1, 0, JSON.parse(JSON.stringify(L[i]))); saveSet(); clRender(); calc(tab); }
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'cl_co' && tab === 'cellcmp') setTimeout(() => calc(tab), 0); });
const _al98 = applyLang;
applyLang = function(){ const r = _al98.apply(this, arguments); try { const pg = $('.set-cat[data-cat="sound"]'); if (pg) $$('[data-i]', pg).forEach(x => { x.textContent = t(x.dataset.i); }); const row = $('.sh-row[data-scat="sound"]'); if (row) $$('[data-i]', row).forEach(x => { x.textContent = t(x.dataset.i); }); clRender(); } catch (e) {} return r; };
try { clRender(); } catch (e) {}

/* ---------- 3. stars alone are feedback too: a rating is sent by itself a moment after it is chosen ---------- */
var FBR = {t: null, sent: 0};
document.addEventListener('click', e => {
  const r = e.target.closest && e.target.closest('#fb_box [data-fbr]'); if (!r) return;
  clearTimeout(FBR.t);
  FBR.t = setTimeout(async () => {
    const msg = String(($('#fb_msg') || {}).value || '').trim();
    if (msg || !FBV.r || FBV.r === FBR.sent) return;            // with text, the Send button sends both together
    const it = Object.assign(fbItem(), {k: 'rate'}), st = $('#fb_st');
    try {
      if (FB.db && FB.uid){
        let mine = []; try { const d = await FB.db.doc('feedback/' + FB.uid).get(); if (d && d.exists) mine = (d.data() || {}).items || []; } catch (er) {}
        mine = mine.concat(it).slice(-20); const ref = FB.db.doc('feedback/' + FB.uid);
        try { await ref.update({items: mine, at: Date.now()}); } catch (er) { await ref.set({items: mine, at: Date.now()}); }
      } else await ibSendWeb(it);
      FBR.sent = FBV.r; if (st) st.textContent = t('fb_rated'); toast(t('fb_rated'));
    } catch (er) { if (st) st.textContent = t('fb_fail'); }
  }, 1500);
});

/* ---------- 4. the sender can sign with a name, or stay anonymous (the default) ---------- */
function fbNameRow(){
  const box = $('#fb_box'), mail = $('#fb_mail'); if (!box || !mail || $('#fb_who')) return;
  mail.insertAdjacentHTML('beforebegin', `<div class="fb-who" id="fb_who" role="radiogroup" aria-label="${E98(t('fb_whoL'))}">
      <button type="button" role="radio" data-fbwho="anon" class="${SET.fbWho === 'name' ? '' : 'on'}" aria-checked="${SET.fbWho !== 'name'}">🕶️ ${E98(t('fb_anon'))}</button>
      <button type="button" role="radio" data-fbwho="name" class="${SET.fbWho === 'name' ? 'on' : ''}" aria-checked="${SET.fbWho === 'name'}">🙋 ${E98(t('fb_signed'))}</button></div>
    <input id="fb_name" type="text" maxlength="40" dir="auto" autocomplete="name" placeholder="${E98(t('fb_namePh'))}" aria-label="${E98(t('fb_namePh'))}" value="${E98(SET.fbName || '')}"${SET.fbWho === 'name' ? '' : ' hidden'} data-pii-ok>`);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fbwho]'); if (!b) return;
  SET.fbWho = b.dataset.fbwho; try { saveSet(); } catch (er) {}
  $$('[data-fbwho]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
  const n = $('#fb_name'); if (n){ n.hidden = SET.fbWho !== 'name'; if (!n.hidden) n.focus(); }
});
document.addEventListener('input', e => { if (e.target && e.target.id === 'fb_name'){ SET.fbName = e.target.value.slice(0, 40); try { saveSet(); } catch (er) {} } });
const _fbItem98 = fbItem;
fbItem = function(){ const it = _fbItem98.apply(this, arguments); const nm = String(SET.fbName || '').trim().slice(0, 40); if (SET.fbWho === 'name' && nm) it.nm = nm; return it; };
const _fbBox98 = fbBox;
fbBox = function(){ const r = _fbBox98.apply(this, arguments); try { fbNameRow(); } catch (e) {} return r; };
try { fbNameRow(); } catch (e) {}
/* the inbox shows who wrote (or "anonymous") */
const _ibDraw98 = ibDraw;
ibDraw = function(){
  const r = _ibDraw98.apply(this, arguments);
  try { const L = IB.list.filter(i => IB.f === 'all' || i.src === IB.f); $$('#ibx .ib-list .fb-it').forEach((el, k) => { const i = L[k]; if (!i || i.locked || el.querySelector('.ib-who')) return; const h = el.querySelector('small'); if (h) h.insertAdjacentHTML('beforebegin', `<div class="ib-who">${i.nm ? '🙋 ' + E98(i.nm) : '🕶️ ' + E98(t('fb_anon'))}</div>`); }); } catch (e) {}
  return r;
};
