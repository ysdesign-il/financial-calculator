/* ---------- 13.22: documents and receipts – a warranty archive on the phone, and an AI check of an offer or a contract ----------
   Receipt photos are kept in this browser's own storage (IndexedDB), never uploaded. The AI check sends the photos only when asked. */
const vtE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var VTT = 'rec', VTX = {ed: null, img: null, chk: null, busy: false, kind: 'loan', files: []};
function vtD(){ const d = SET.vt && typeof SET.vt === 'object' ? SET.vt : (SET.vt = {}); if (!Array.isArray(d.items)) d.items = []; return d; }
const vtNoPics = () => (typeof PRIV !== 'undefined' && PRIV) || (typeof FUSER !== 'undefined' && FUSER);      // private mode / an encrypted account: no photos at rest
/* ---- the photo store ---- */
function vtDb(){ return new Promise((ok, no) => { try { const r = indexedDB.open('fin-vault', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }); }
async function vtPut(k, blob){ const db = await vtDb(); return new Promise((ok, no) => { const tx = db.transaction('img', 'readwrite'); tx.objectStore('img').put(blob, k); tx.oncomplete = () => ok(); tx.onerror = () => no(tx.error); }); }
async function vtGet(k){ const db = await vtDb(); return new Promise(ok => { const r = db.transaction('img').objectStore('img').get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); }
async function vtDel(k){ try { const db = await vtDb(); db.transaction('img', 'readwrite').objectStore('img').delete(k); } catch (e) {} }
async function vtShrink(file, max){ const img = await dsLoad(file), k = Math.min(1, (max || 1600) / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return new Promise(r => c.toBlob(r, 'image/jpeg', 0.82)); }
/* ---- warranties ---- */
const vtEnd = it => { const d = rmParse(it.date); if (!d || !(+it.months > 0)) return ''; d.setMonth(d.getMonth() + +it.months); return rmIso(d); };
function vtRec(v){
  const E = vtE, d = vtD(), L = d.items.slice().sort((a, b) => String(vtEnd(a) || '9999').localeCompare(String(vtEnd(b) || '9999')));
  v.innerHTML = `<p class="fine">${E(t('vt_recIntro'))}</p>${vtNoPics() ? `<div class="ds-warn" role="note"><span aria-hidden="true">🔒</span><p>${E(t('vt_noPics'))}</p></div>` : ''}
    <div class="btnrow"><button type="button" class="gold-btn" id="vt_add">＋ ${E(t('vt_add'))}</button></div><div id="vt_ed"></div>
    <ul class="rm-list">${L.map(it => { const end = vtEnd(it), n = end ? rmDays(end) : NaN, cls = !end ? '' : n < 0 ? 'done' : n <= 30 ? 'due' : '';
      return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${it.img ? '🧾' : '📦'}</div><div class="rm-b"><b dir="auto">${E(it.name)}</b><span class="rm-w">${E([it.store, it.date ? rmFmt(it.date) : '', +it.price ? M(+it.price, 0, 'ILS') : ''].filter(Boolean).join(' · '))}</span>
        <span class="rm-w">${E(end ? (n < 0 ? t('vt_expired', {d: rmFmt(end)}) : t('vt_until', {d: rmFmt(end), n})) : t('vt_noWar'))}</span>${it.note ? `<small dir="auto">${E(it.note)}</small>` : ''}
        <div class="rm-acts">${it.img ? `<button type="button" class="px-tb s" data-vtimg="${E(it.id)}" aria-label="${E(t('vt_view', {n: it.name}))}">👁️</button>` : ''}<button type="button" class="px-tb s" data-vted="${E(it.id)}" aria-label="${E(t('rm_edit', {t: it.name}))}">✏️</button>${end && n >= 0 ? `<button type="button" class="px-tb s" data-vtrem="${E(it.id)}" aria-label="${E(t('vt_rem', {n: it.name}))}">⏰</button>` : ''}<button type="button" class="px-tb s" data-vtdel="${E(it.id)}" aria-label="${E(t('rm_del', {t: it.name}))}">🗑️</button></div></div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('vt_none'))}</li>`}</ul>`;
  if (VTX.ed) vtEditor(VTX.ed === 'new' ? null : d.items.find(x => x.id === VTX.ed));
}
function vtEditor(it){
  const box = $('#vt_ed'); if (!box) return; const E = vtE, v = Object.assign({name: '', store: '', date: todayIso(), price: '', months: 12, note: ''}, it || {});
  box.innerHTML = `<form class="bk-acc rm-form" id="vt_form" novalidate><fieldset><legend>${it ? '✏️' : '＋'} ${E(t(it ? 'vt_editT' : 'vt_add'))}</legend>
    <label class="bk-f"><span>${E(t('vt_name'))}</span><input type="text" id="vtf_name" maxlength="60" dir="auto" value="${E(v.name)}" placeholder="${E(t('vt_namePh'))}"></label>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('vt_store'))}</span><input type="text" id="vtf_store" maxlength="40" dir="auto" value="${E(v.store)}"></label><label class="bk-f"><span>${E(t('vt_date'))}</span><input type="date" id="vtf_date" value="${E(v.date)}"></label>
    <label class="bk-f"><span>${E(t('vt_price'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="vtf_price" value="${E(v.price)}"></label><label class="bk-f"><span>${E(t('vt_months'))}</span><select id="vtf_months">${[0, 3, 6, 12, 24, 36, 60].map(m => `<option value="${m}"${+v.months === m ? ' selected' : ''}>${E(m ? t('vt_m', {n: m}) : t('vt_noWar'))}</option>`).join('')}</select></label></div>
    <label class="bk-f"><span>${E(t('rm_fNote'))}</span><textarea id="vtf_note" rows="2" maxlength="200" dir="auto">${E(v.note)}</textarea></label>
    ${vtNoPics() ? '' : `<div class="btnrow"><label class="btn">📷 ${E(t('vt_photo'))}<input type="file" accept="image/*" capture="environment" id="vtf_cam" hidden></label><label class="btn">🖼️ ${E(t('vt_gallery'))}<input type="file" accept="image/*" id="vtf_pick" hidden></label><span class="fine" id="vtf_ph">${v.img || VTX.img ? '✓ ' + E(t('vt_hasPhoto')) : ''}</span></div>`}
    <div class="btnrow"><button type="submit" class="gold-btn">✓ ${E(t('rm_save'))}</button><button type="button" class="btn" id="vtf_cancel">${E(t('rm_cancel'))}</button></div></fieldset></form>`;
}
async function vtSave(){
  const d = vtD(), name = $('#vtf_name').value.trim(); if (!name){ $('#vtf_name').focus(); toast(t('vt_needName')); return; }
  const rec = {name: name.slice(0, 60), store: $('#vtf_store').value.trim().slice(0, 40), date: $('#vtf_date').value, price: $('#vtf_price').value.replace(/[^\d.]/g, ''), months: +$('#vtf_months').value || 0, note: $('#vtf_note').value.trim().slice(0, 200)};
  let it = VTX.ed && VTX.ed !== 'new' ? d.items.find(x => x.id === VTX.ed) : null;
  if (it) Object.assign(it, rec); else { it = Object.assign({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5)}, rec); d.items.push(it); }
  if (VTX.img && !vtNoPics()){ try { await vtPut(it.id, VTX.img); it.img = 1; } catch (e) { toast(t('vt_picFail')); } }
  VTX.ed = null; VTX.img = null; saveSet(); vtRender(); toast(t('rm_saved'));
}
async function vtShow(id){
  const b = await vtGet(id); if (!b){ toast(t('vt_picGone')); return; } const url = URL.createObjectURL(b);
  if (!$('#vtx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="vtx" hidden><div class="cp-box vt-box" role="dialog" aria-modal="true" aria-label="${vtE(t('vt_photo'))}"><div class="cp-top"><h3></h3><button type="button" class="cp-x" id="vtx_x" aria-label="${vtE(t('cp_close'))}">✕</button></div><img id="vtx_img" alt=""></div></div>`);
  const it = vtD().items.find(x => x.id === id); $('#vtx h3').textContent = it ? it.name : ''; const im = $('#vtx_img'); if (im.dataset.u) URL.revokeObjectURL(im.dataset.u); im.src = url; im.dataset.u = url; im.alt = it ? it.name : '';
  $('#vtx').hidden = false; document.body.classList.add('cp-lock');
}
/* ---- the AI check of a document ---- */
const VT_KINDS = ['loan', 'insur', 'rent', 'pens', 'other'];
const VT_PROMPT = {loan: 'a loan or credit offer: find the real yearly cost (APR including fees), interest type (fixed/prime/CPI-linked), all fees, early-repayment penalties and the total to repay',
  insur: 'an insurance policy or offer: what is covered, deductibles, exclusions, price changes over time, cancellation terms, and anything unusual',
  rent: 'a residential rental contract in Israel: rent and its linkage (CPI), guarantees and deposit amount, who pays for repairs, early-exit terms, option to extend, and clauses that are unfair to the tenant or unusual',
  pens: 'an annual pension / provident / study fund report: management fees from deposits and from savings (compare with typical market fees of about 1% from deposits and 0.2% from savings), insurance cover, return, and whether the fees are worth negotiating',
  other: 'a financial document: what it is, the key numbers, costs and anything the reader should check'};
function vtChk(v){
  const E = vtE, eng = slEngine(), inClaude = typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE, R = VTX.chk;
  v.innerHTML = `<p class="fine">${E(t('vt_chkIntro'))}</p><div class="ds-chips" role="radiogroup" aria-label="${E(t('vt_kind'))}">${VT_KINDS.map(k => `<button type="button" role="radio" class="ds-chip${VTX.kind === k ? ' on' : ''}" aria-checked="${VTX.kind === k}" data-vtk="${k}">${E(t('vt_k_' + k))}</button>`).join('')}</div>
    ${eng ? `<div class="btnrow"><label class="gold-btn">📷 ${E(t('vt_chkPhoto'))}<input type="file" accept="image/*" capture="environment" id="vt_cf" hidden multiple></label><label class="btn">🖼️ ${E(t('vt_gallery'))}<input type="file" accept="image/*" id="vt_cg" hidden multiple></label></div>
      <p class="fine" id="vt_cst" aria-live="polite">${VTX.files.length ? E(t('vt_pages', {n: VTX.files.length})) : ''}</p>${VTX.files.length ? `<div class="btnrow"><button type="button" class="gold-btn" id="vt_go"${VTX.busy ? ' disabled' : ''}>✦ ${E(t(VTX.busy ? 'ph_reading' : 'vt_go'))}</button><button type="button" class="mv" id="vt_clr">🗑️ ${E(t('vt_clr'))}</button></div>` : ''}
      <p class="fine sl-priv">🔒 ${E(t('vt_chkPriv'))}</p>`
    : `<div class="gk-st new">${E(t(inClaude ? 'sl_noAiC' : gkNo('sl_noAi')))}</div>${inClaude || !(typeof gkAllowed === 'function' && gkAllowed()) ? '' : `<div class="btnrow"><button type="button" class="btn" data-gkgo="1">✦ ${E(t('xs_connect'))}</button></div>`}`}
    ${R ? `<div class="bk-hero"><span>${E(t('vt_k_' + R.kind))}</span><b dir="auto">${E(R.title || '')}</b><small dir="auto">${E(R.summary || '')}</small></div>
      ${Array.isArray(R.numbers) && R.numbers.length ? `<table class="bk-plan"><tbody>${R.numbers.slice(0, 12).map(n => `<tr><th scope="row" dir="auto">${E(n.label)}</th><td dir="auto">${E(n.value)}</td></tr>`).join('')}</tbody></table>` : ''}
      <ol class="bk-adv">${(R.risks || []).slice(0, 8).map(x => `<li class="bk-a bk-warn"><span class="bk-ic">⚠️</span><div><b dir="auto">${E(x)}</b></div></li>`).join('')}${(R.actions || []).slice(0, 6).map(x => `<li class="bk-a bk-ok"><span class="bk-ic">✅</span><div><b dir="auto">${E(x)}</b></div></li>`).join('')}</ol>
      <p class="fine">${E(t('vt_chkNote'))}</p>` : ''}`;
}
async function vtGo(){
  if (!VTX.files.length || VTX.busy) return; VTX.busy = true; vtRender();
  try { const blobs = []; for (const f of VTX.files.slice(0, 5)) blobs.push(await vtShrink(f, 2000));
    const lang = ({he: 'Hebrew', ar: 'Arabic', en: 'English'})[document.documentElement.lang] || 'Hebrew';
    const j = await dsAsk(`These are photos of ${VT_PROMPT[VTX.kind]}. Read them carefully. Answer in ${lang}, in plain words. Return ONLY JSON: {"title": what the document is (max 8 words), "summary": 2 sentences, "numbers": [{"label": ..., "value": ...}] key figures as written, "risks": [things to watch out for, each one short sentence], "actions": [what the reader should do or ask, each one short sentence]}. Do not invent figures that are not in the document.`, blobs);
    VTX.chk = Object.assign({kind: VTX.kind}, j && typeof j === 'object' ? j : {summary: String(j || '')});
  } catch (e) { toast(t('ph_fail')); }
  VTX.busy = false; vtRender();
}
function vtRender(){
  const root = $('#hr_vault'); if (!root) return; const E = vtE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['rec', '🧾'], ['chk', '🔍']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${VTT === k ? ' on' : ''}" aria-selected="${VTT === k}" data-vttab="${k}">${ic} ${E(t('vt_t_' + k))}</button>`).join('')}</div><div id="vt_view"></div>`;
  (VTT === 'rec' ? vtRec : vtChk)($('#vt_view'));
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#vtx_x') || t0.id === 'vtx'){ const o = $('#vtx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } return; }
  if (!t0.closest('#hr_vault')) return; const d = vtD();
  if ((b = t0.closest('[data-vttab]'))){ VTT = b.dataset.vttab; vtRender(); return; }
  if (t0.closest('#vt_add')){ VTX.ed = 'new'; VTX.img = null; vtEditor(null); $('#vtf_name').focus(); return; }
  if (t0.closest('#vtf_cancel')){ VTX.ed = null; VTX.img = null; $('#vt_ed').innerHTML = ''; return; }
  if ((b = t0.closest('[data-vted]'))){ VTX.ed = b.dataset.vted; VTX.img = null; vtEditor(d.items.find(x => x.id === VTX.ed)); $('#vtf_name').focus(); return; }
  if ((b = t0.closest('[data-vtimg]'))){ vtShow(b.dataset.vtimg); return; }
  if ((b = t0.closest('[data-vtrem]'))){ const it = d.items.find(x => x.id === b.dataset.vtrem); if (it){ const end = vtEnd(it), dd = rmParse(end); dd.setDate(dd.getDate() - 14); rmNew({title: t('vt_remT', {n: it.name}), date: rmIso(dd), cat: 'home', before: 3, note: t('vt_remN')}); } return; }
  if ((b = t0.closest('[data-vtdel]'))){ const it = d.items.find(x => x.id === b.dataset.vtdel); if (!it || !confirm(t('rm_delQ', {t: it.name}))) return; d.items = d.items.filter(x => x !== it); vtDel(it.id); saveSet(); vtRender(); return; }
  if ((b = t0.closest('[data-vtk]'))){ VTX.kind = b.dataset.vtk; vtRender(); return; }
  if (t0.closest('#vt_go')){ vtGo(); return; }
  if (t0.closest('#vt_clr')){ VTX.files = []; VTX.chk = null; vtRender(); }
});
document.addEventListener('submit', e => { if (e.target && e.target.id === 'vt_form'){ e.preventDefault(); vtSave(); } });
document.addEventListener('change', async e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#hr_vault') || !el.files || !el.files.length) return;
  if (el.id === 'vtf_cam' || el.id === 'vtf_pick'){ try { VTX.img = await vtShrink(el.files[0], 1600); const s = $('#vtf_ph'); if (s) s.textContent = '✓ ' + t('vt_hasPhoto'); } catch (er) { toast(t('ph_fail')); } el.value = ''; return; }
  if (el.id === 'vt_cf' || el.id === 'vt_cg'){ VTX.files = VTX.files.concat([...el.files]).slice(0, 5); VTX.chk = null; el.value = ''; vtRender(); }
});
CALC.vault = () => null;
try { GS_SYN.vault = 'קבלות קבלה אחריות תעודת אחריות ארכיון מסמכים בדיקת חוזה חוזה שכירות הצעת הלוואה פוליסה ביטוח דוח שנתי פנסיה דמי ניהול receipts warranty documents contract check loan offer insurance policy pension report إيصالات كفالة مستندات فحص عقد إيجار قرض تأمين'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindVt = svKind; svKind = function(id){ return id === 'vault' ? '' : svKindVt.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('vault'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('vault'); } catch (e) {}
{
  const actVt = activate; activate = function(id){ const r = actVt.apply(this, arguments); if (id === 'vault') vtRender(); return r; };
  const alVt = applyLang; applyLang = function(){ const r = alVt.apply(this, arguments); try { if (tab === 'vault') vtRender(); } catch (e) {} return r; };
  try { if (tab === 'vault') vtRender(); } catch (e) {}
}
