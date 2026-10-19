/* ---------- 13.11: scanner extras ----------
   1) open files shared from other apps (Android "Share", installed app) and files opened with the app
   2) the PDF editor keeps a draft on the device and offers to continue
   3) stamps, page numbers, header / footer and a watermark in the editor
   4) scanning many pages in a row (live camera with automatic cropping, or several photos at once)
   5) a searchable PDF from a scan (the text read by the AI is placed invisibly under the picture)
   + a quick scanner button on every calculator screen */
const d3E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/* ================= 1) shared and opened files ================= */
var DSH = {files: [], text: ''};
async function d3TakeShared(){
  try {
    if (!/[?&]share=1/.test(location.search) || !('caches' in window)) return;
    const c = await caches.open('fin-share'), keys = await c.keys(), files = [];
    for (const k of keys){ const r = await c.match(k); if (!r) continue; const nm = decodeURIComponent(r.headers.get('x-name') || 'file'), ty = r.headers.get('content-type') || '';
      if (/__share\/text$/.test(k.url)) DSH.text = await r.text(); else files.push(new File([await r.blob()], nm, {type: ty})); }
    await caches.delete('fin-share');
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    DSH.files = files; if (files.length || DSH.text) d3ShareOpen();
  } catch (e) {}
}
function d3ShareOpen(){ activate('docscan'); DSX.view = 'share'; dscRender(); }
function d3ShareRender(root){
  const E = d3E, F = DSH.files, url = (DSH.text.match(/https?:\/\/\S+/) || [])[0];
  root.innerHTML = dsBar('📥 ' + t('sh_title')) + `<p class="fine">${E(t('sh_got', {n: F.length}))}</p>
    ${F.length ? `<ol class="cvt-list">${F.map(f => `<li><span aria-hidden="true">${({pdf: '📕', img: '🖼️', doc: '📄'})[cvtKind(f)]}</span><span class="cvt-n" dir="auto">${E(f.name)}</span><small>${cvtSize(f.size)}</small></li>`).join('')}</ol>` : ''}
    ${DSH.text ? `<p class="qr-raw" dir="auto">${E(DSH.text.slice(0, 300))}</p>` : ''}
    <div class="ds-toolrow">${F.length ? `<button type="button" class="ds-tool" data-shgo="edit"><span aria-hidden="true">📝</span><b>${E(t('dst_pdf'))}</b></button><button type="button" class="ds-tool" data-shgo="conv"><span aria-hidden="true">🔄</span><b>${E(t('dst_conv'))}</b></button><button type="button" class="ds-tool" data-shgo="qr"><span aria-hidden="true">▦</span><b>${E(t('sh_findQr'))}</b></button>` : ''}${url || DSH.text ? `<button type="button" class="ds-tool" data-shgo="mkqr"><span aria-hidden="true">▦</span><b>${E(t('sh_makeQr'))}</b></button>` : ''}</div>
    <p class="fine sl-priv">🔒 ${E(t('sh_priv'))}</p>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-shgo]'); if (!b) return; const k = b.dataset.shgo, F = DSH.files;
  if (k === 'edit'){ PX = null; DSX.view = 'pdf'; dscRender(); pxOpenFiles(F); }
  else if (k === 'conv'){ CVT.files = F.slice(0, 40); DSX.view = 'conv'; dscRender(); }
  else if (k === 'qr'){ DSX.view = 'qr'; QRX.tab = 'scan'; dscRender(); qrFromFiles(F); }
  else if (k === 'mkqr'){ const url = (DSH.text.match(/https?:\/\/\S+/) || [])[0]; QRX.tab = 'make'; if (url){ QRX.type = 'url'; QRX.f.url = url; } else { QRX.type = 'text'; QRX.f.text = DSH.text.slice(0, 1500); } DSX.view = 'qr'; dscRender(); }
});
/* files opened with the installed app (desktop "Open with") */
try { if ('launchQueue' in window) window.launchQueue.setConsumer(async p => { if (!p || !p.files || !p.files.length) return; DSH.files = await Promise.all(p.files.map(h => h.getFile())); DSH.text = ''; d3ShareOpen(); }); } catch (e) {}

/* ================= 2) the editor's draft ================= */
const D3_DB = 'fin-pxdraft';
const d3CanDraft = () => !(typeof PRIV !== 'undefined' && PRIV) && !(typeof FUSER !== 'undefined' && FUSER) && 'indexedDB' in window;
function d3Db(){ return new Promise((res, rej) => { const r = indexedDB.open(D3_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('d'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function d3Put(v){ const db = await d3Db(); await new Promise((res, rej) => { const tx = db.transaction('d', 'readwrite'); if (v == null) tx.objectStore('d').delete('px'); else tx.objectStore('d').put(v, 'px'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); db.close(); }
async function d3Get(){ try { const db = await d3Db(); const v = await new Promise(res => { const r = db.transaction('d').objectStore('d').get('px'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); db.close(); return v; } catch (e) { return null; } }
const D3_BLOB = new WeakMap();
async function d3Blob(c, alpha){ if (D3_BLOB.has(c)) return D3_BLOB.get(c); const b = await new Promise(r => c.toBlob(r, alpha ? 'image/png' : 'image/jpeg', 0.92)); D3_BLOB.set(c, b); return b; }
let D3_T = null, D3_INFO = null;
function pxDraftSoon(){ if (!d3CanDraft() || !PX) return; clearTimeout(D3_T); D3_T = setTimeout(pxDraftSave, 1500); }
async function pxDraftSave(){
  if (!PX || !PX.pages.length || PX.busy) return;
  try {
    if (PX.docs.reduce((a, d) => a + d.bytes.length, 0) > 80e6) return;
    const pages = [];
    for (const p of PX.pages){ const q = Object.assign({}, p); delete q.items; if (p.img) q.img = await d3Blob(p.img, p.alpha);
      q.objs = []; for (const o of p.objs){ const r = Object.assign({}, o); if (o.c) r.c = await d3Blob(o.c, o.alpha); delete r._o; q.objs.push(r); } pages.push(q); }
    await d3Put({v: 1, at: Date.now(), name: PX.name, cur: PX.cur, flat: !!PX.flat, flatForm: !!PX.flatForm, form: PX.form, deco: PX.deco || null, docs: PX.docs.map(d => ({bytes: d.bytes, name: d.name})), pages});
  } catch (e) {}
}
async function pxDraftClear(){ clearTimeout(D3_T); D3_INFO = null; try { await d3Put(null); } catch (e) {} }
async function pxDraftLoad(){
  const v = await d3Get(); if (!v) return false;
  PX = pxNew(); PX.name = v.name || ''; PX.flat = v.flat; PX.flatForm = v.flatForm; PX.deco = v.deco || null;
  for (const d of v.docs){ const pdf = await pxOpenPdf(d.bytes, d.name); const D = {pdf, bytes: d.bytes, name: d.name}; try { const fo = await pdf.getFieldObjects(); if (fo && Object.keys(fo).length) D.fields = fo; } catch (e) {} PX.docs.push(D); }
  for (const q of v.pages){ const p = Object.assign({}, q, {id: PX_ID++}); if (q.img) p.img = await cvtImgFromBlob(q.img);
    p.objs = []; for (const o of q.objs){ const r = Object.assign({}, o, {id: PX_ID++}); if (o.c instanceof Blob) r.c = await cvtImgFromBlob(o.c); p.objs.push(r); } PX.pages.push(p); }
  Object.entries(v.form || {}).forEach(([k, val]) => { try { pxFormApply(k, val); } catch (e) {} });
  PX.cur = Math.min(v.cur || 0, PX.pages.length - 1); PX.dirty = true; return true;
}
async function pxDraftCard(){
  const box = $('#px_draft'); if (!box || !d3CanDraft()) return;
  const v = await d3Get(); if (!v || !v.pages || !v.pages.length){ box.innerHTML = ''; return; }
  let when = ''; try { when = new Intl.DateTimeFormat(locOf(), {dateStyle: 'short', timeStyle: 'short'}).format(new Date(v.at)); } catch (e) {}
  box.innerHTML = `<div class="ds-found px-dr" role="status"><span class="ds-em" aria-hidden="true">📝</span><div><b dir="auto">${d3E(v.name || t('px_title'))}</b><small>${d3E(t('px_draftAt', {d: when, n: v.pages.length}))}</small></div></div><div class="btnrow"><button type="button" class="gold-btn" id="px_drGo">↩ ${d3E(t('px_draftGo'))}</button><button type="button" class="mv" id="px_drDel">🗑️ ${d3E(t('px_draftDel'))}</button></div>`;
}
document.addEventListener('click', async e => {
  const t0 = e.target; if (!t0.closest) return;
  if (t0.closest('#px_drGo')){ const b = t0.closest('#px_drGo'); b.disabled = true; try { if (await pxDraftLoad()){ DSX.view = 'pdf'; dscRender(); pxSay(t('px_draftBack')); } } catch (er){ toast(t('px_openFail', {n: t('px_draftWord')})); b.disabled = false; } return; }
  if (t0.closest('#px_drDel')){ await pxDraftClear(); const box = $('#px_draft'); if (box) box.innerHTML = ''; toast(t('px_draftGone')); }
});

/* ================= 3) stamps and page decorations ================= */
const D3_STAMPS = ['paid', 'approved', 'received', 'copy', 'conf', 'draft', 'void', 'custom'];
function pxStampCanvas(st){
  const txt = st.k === 'custom' ? String(st.txt || '').trim() || t('px_stp_custom') : t('px_stp_' + st.k), col = st.col || '#c62828', date = st.date ? new Date().toLocaleDateString(locOf()) : '';
  const F = '800 120px -apple-system,"Segoe UI",Arial,"Noto Sans Hebrew",sans-serif', m = document.createElement('canvas').getContext('2d'); m.font = F;
  const tw = m.measureText(txt).width, W = Math.max(520, tw + 140), H = date ? 290 : 220, c = document.createElement('canvas'), ang = -0.07;
  const cw = Math.ceil(W * Math.cos(-ang) + H * Math.sin(-ang)) + 20, ch = Math.ceil(W * Math.sin(-ang) + H * Math.cos(-ang)) + 20; c.width = cw; c.height = ch;
  const x = c.getContext('2d'); x.translate(cw / 2, ch / 2); x.rotate(ang); x.strokeStyle = col; x.fillStyle = col; x.globalAlpha = 0.88;
  const rr = (w, h, r) => { x.beginPath(); x.moveTo(-w / 2 + r, -h / 2); x.arcTo(w / 2, -h / 2, w / 2, h / 2, r); x.arcTo(w / 2, h / 2, -w / 2, h / 2, r); x.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r); x.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r); x.closePath(); };
  x.lineWidth = 14; rr(W - 14, H - 14, 30); x.stroke(); x.lineWidth = 5; rr(W - 52, H - 52, 18); x.stroke();
  x.font = F; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.direction = /[֐-ࣿ]/.test(txt) ? 'rtl' : 'ltr'; } catch (e) {}
  x.fillText(txt, 0, date ? -28 : 4, W - 90); if (date){ x.font = '700 54px -apple-system,"Segoe UI",Arial,sans-serif'; x.fillText(date, 0, 74); }
  return c;
}
function pxStampProps(){
  const E = d3E, st = PX.st.stamp || (PX.st.stamp = {k: 'paid', col: '#c62828', date: true, txt: ''});
  return `<div class="ds-chips px-stamps" role="radiogroup" aria-label="${E(t('px_t_stamp'))}">${D3_STAMPS.map(k => `<button type="button" role="radio" class="ds-chip${st.k === k ? ' on' : ''}" aria-checked="${st.k === k}" data-pxstp="${k}">${E(t('px_stp_' + k))}</button>`).join('')}</div>
    ${st.k === 'custom' ? `<div class="field"><label for="px_stpTxt">${E(t('px_stpTxt'))}</label><div class="control"><input id="px_stpTxt" type="text" maxlength="24" dir="auto" value="${E(st.txt)}"></div></div>` : ''}
    <div class="px-row">${[['#c62828', 'px_stc_r'], ['#1d3fbf', 'px_stc_b'], ['#2e7d32', 'px_stc_g'], ['#111111', 'px_stc_k']].map(([c, l]) => `<button type="button" class="px-c${st.col === c ? ' on' : ''}" data-pxstc="${c}" style="background:${c}" aria-label="${E(t(l))}" aria-pressed="${st.col === c}"></button>`).join('')}<label class="prn-ck"><input type="checkbox" id="px_stpDate"${st.date ? ' checked' : ''}> ${E(t('px_stpDate'))}</label></div>
    <p class="fine">${E(t('px_h_stamp'))}</p>`;
}
const D3_POS = ['bc', 'br', 'bl', 'tc', 'tr', 'tl'], D3_FMT = ['{n}', 'p', 'pm', 'nm', 'dash'];
function pxDecoFmt(f, n, m){ return f === 'p' ? t('px_pn_p', {n}) : f === 'pm' ? t('px_pn_pm', {n, m}) : f === 'nm' ? n + ' / ' + m : f === 'dash' ? '– ' + n + ' –' : String(n); }
/* the page decorations as (not selectable) objects for page i */
function pxDeco(i){
  const D = PX && PX.deco; if (!D) return []; const p = PX.pages[i]; if (!p) return [];
  const W = pxW(p), H = pxH(p), M = 26, out = [], txt = (s, top, al, fs) => out.push({t: 'text', x: M, y: top ? M * 0.7 : H - M * 0.7 - fs * 1.5, w: W - 2 * M, txt: s, fs, col: D.col || '#333333', font: 'sans', b: false, it: false, al, bg: '', op: 1, deco: true});
  const al = pos => pos[1] === 'c' ? 'center' : pos[1] === 'r' ? 'right' : 'left';
  if (D.pn && (!D.skip1 || i > 0)){ const n = i + (+D.start || 1) - (D.skip1 ? 1 : 0), m = PX.pages.length + (+D.start || 1) - 1 - (D.skip1 ? 1 : 0); txt(pxDecoFmt(D.fmt || '{n}', n, m), D.pos[0] === 't', al(D.pos || 'bc'), +D.fs || 10); }
  if (D.head && D.head.trim()) txt(D.head.trim(), true, D.pn && D.pos && D.pos[0] === 't' && D.pos[1] === 'c' ? 'right' : 'center', +D.fs || 10);
  if (D.foot && D.foot.trim()) txt(D.foot.trim(), false, D.pn && D.pos && D.pos[0] === 'b' && D.pos[1] === 'c' ? 'right' : 'center', +D.fs || 10);
  if (D.wm && D.wm.trim()) out.push({t: 'wm', x: 0, y: 0, w: W, h: H, txt: D.wm.trim(), col: D.wmCol || '#c62828', op: +D.wmOp || 0.15, deco: true});
  return out;
}
function pxDecoHTML(){
  const E = d3E, D = PX.deco || {pos: 'bc', fmt: 'p', start: 1, fs: 10, wmOp: 0.15, wmCol: '#c62828'};
  const sel = (id, key, opts) => `<select id="${id}" data-pxdk="${key}">${opts.map(([v, l]) => `<option value="${v}"${String(D[key] == null ? '' : D[key]) === String(v) ? ' selected' : ''}>${E(l)}</option>`).join('')}</select>`;
  return `<details class="ds-det px-deco"${PX.decoOpen ? ' open' : ''}><summary>📄 ${E(t('px_deco'))}</summary>
    <label class="prn-ck"><input type="checkbox" data-pxdk="pn"${D.pn ? ' checked' : ''}> ${E(t('px_pn'))}</label>
    <div class="px-row"><label>${E(t('px_pnPos'))} ${sel('px_dpos', 'pos', D3_POS.map(k => [k, t('px_pos_' + k)]))}</label><label>${E(t('px_pnFmt'))} ${sel('px_dfmt', 'fmt', D3_FMT.map(k => [k, pxDecoFmt(k, 2, 5)]))}</label></div>
    <div class="px-row"><label>${E(t('px_pnStart'))} <input type="number" data-pxdk="start" min="0" max="9999" value="${E(D.start == null ? 1 : D.start)}" style="width:5em"></label><label class="prn-ck"><input type="checkbox" data-pxdk="skip1"${D.skip1 ? ' checked' : ''}> ${E(t('px_pnSkip'))}</label></div>
    <div class="field"><label for="px_dhead">${E(t('px_head'))}</label><div class="control"><input id="px_dhead" type="text" dir="auto" maxlength="120" data-pxdk="head" value="${E(D.head || '')}"></div></div>
    <div class="field"><label for="px_dfoot">${E(t('px_foot'))}</label><div class="control"><input id="px_dfoot" type="text" dir="auto" maxlength="120" data-pxdk="foot" value="${E(D.foot || '')}"></div></div>
    <div class="px-row"><label>${E(t('px_dfs'))} ${sel('px_dfs', 'fs', [[8, '8'], [9, '9'], [10, '10'], [11, '11'], [12, '12'], [14, '14']])}</label></div>
    <div class="field"><label for="px_dwm">${E(t('px_wm'))}</label><div class="control"><input id="px_dwm" type="text" dir="auto" maxlength="40" data-pxdk="wm" value="${E(D.wm || '')}" placeholder="${E(t('px_wmPh'))}"></div></div>
    <div class="px-row"><label>${E(t('px_op'))} <input type="range" min="0.05" max="0.5" step="0.01" data-pxdk="wmOp" value="${E(D.wmOp || 0.15)}"></label><label>${E(t('px_color'))} <input type="color" data-pxdk="wmCol" value="${E(D.wmCol || '#c62828')}"></label></div>
    <p class="fine">${E(t('px_decoH'))}</p></details>`;
}
function d3DecoSet(el){
  if (!PX) return; const D = PX.deco || (PX.deco = {pos: 'bc', fmt: 'p', start: 1, fs: 10, wmOp: 0.15, wmCol: '#c62828'}), k = el.dataset.pxdk;
  D[k] = el.type === 'checkbox' ? el.checked : el.value; PX.dirty = true; pxDraftSoon();
  clearTimeout(PX.dt); PX.dt = setTimeout(() => { pxDraw(false); pxThumbs(); }, 150);
}
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.pxdk && el.type !== 'checkbox' && el.tagName !== 'SELECT') d3DecoSet(el); if (el && el.id === 'px_stpTxt' && PX){ PX.st.stamp.txt = el.value.slice(0, 24); } });
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.pxdk && (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color')) d3DecoSet(el); if (el && el.id === 'px_stpDate' && PX) PX.st.stamp.date = el.checked; });
document.addEventListener('toggle', e => { if (e.target && e.target.classList && e.target.classList.contains('px-deco') && PX) PX.decoOpen = e.target.open; }, true);
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !PX) return; let b;
  if ((b = t0.closest('[data-pxstp]'))){ PX.st.stamp.k = b.dataset.pxstp; pxRefresh(); if (PX.st.stamp.k === 'custom') setTimeout(() => { const i = $('#px_stpTxt'); if (i) i.focus(); }, 20); return; }
  if ((b = t0.closest('[data-pxstc]'))){ PX.st.stamp.col = b.dataset.pxstc; pxRefresh(); }
});

/* ================= 4) many pages in a row ================= */
var DSB = {stream: null, t: 0, q: null, hist: [], auto: false, cool: 0, busy: false, last: null};
function d3BatchStart(){ if (!DSC) DSC = {pages: [], type: 'doc', filt: 'doc', filtSet: true, wm: '', lay: 'sep', name: '', typeSet: true}; DSX.view = 'batch'; dscRender(); }
function d3BatchRender(root){
  const E = d3E, live = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), n = DSC ? DSC.pages.length : 0;
  root.innerHTML = dsBar('📚 ' + t('bt_title')) + `<p class="fine">${E(t('bt_intro'))}</p>
    ${live ? `<div class="qr-cam bt-cam" id="bt_cam"${DSB.stream ? '' : ' hidden'}><video id="bt_vid" playsinline muted></video><canvas id="bt_ov" aria-hidden="true"></canvas></div>
      <div class="btnrow ds-go">${DSB.stream ? `<button type="button" class="gold-btn bt-shot" id="bt_shot" aria-label="${E(t('bt_shot'))}">📸 ${E(t('bt_shot'))}</button><button type="button" class="mv" id="bt_stop">⏹ ${E(t('qr_stop'))}</button>` : `<button type="button" class="gold-btn" id="bt_live">📷 ${E(t('bt_live'))}</button>`}</div>
      ${DSB.stream ? `<label class="prn-ck"><input type="checkbox" id="bt_auto"${DSB.auto ? ' checked' : ''}> ${E(t('bt_auto'))}</label>` : ''}` : ''}
    <div class="btnrow"><button type="button" class="btn" id="bt_photo">📸 ${E(t('bt_photo'))}</button><button type="button" class="btn" id="bt_pick">🖼️ ${E(t('bt_pick'))}</button>
      <input type="file" accept="image/*" capture="environment" id="bt_photoF" hidden><input type="file" accept="image/*" multiple id="bt_pickF" hidden></div>
    <div class="sl-st" id="bt_st" aria-live="polite">${n ? E(t('bt_count', {n})) : ''}</div>
    ${n ? `<div class="px-thumbs bt-th">${DSC.pages.map((p, i) => `<figure class="px-th"><canvas data-btth="${i}"></canvas><span>${i + 1}</span></figure>`).join('')}</div>` : ''}
    <div class="btnrow ds-out"><button type="button" class="gold-btn" id="bt_done"${n ? '' : ' disabled'}>✓ ${E(t('bt_done', {n}))}</button></div>
    <p class="fine">${E(t('bt_tip'))}</p><p class="fine sl-priv">🔒 ${E(t('ds_privCard'))}</p>`;
  $$('#ds_root canvas[data-btth]').forEach(cv => { const p = DSC.pages[+cv.dataset.btth]; if (!p) return; const c = dsCompose(p, 160); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); });
  if (DSB.stream){ const v = $('#bt_vid'); v.srcObject = DSB.stream; v.play().catch(() => {}); }
}
/* one photo → straightened page, without the manual crop step */
function d3AddPage(img){
  const q = dsDetect(img); DSC.cur = {img, q};
  if (!DSC.typeSet){ DSC.type = 'doc'; DSC.typeSet = true; }
  dsCut(); DSX.view = 'batch';
}
async function d3BatchLive(){
  try {
    DSB.stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment', width: {ideal: 3840}, height: {ideal: 2160}}, audio: false});
    DSB.hist = []; dscRender();
    const loop = () => {
      if (!DSB.stream) return; const v = $('#bt_vid'), ov = $('#bt_ov'); if (!v || !v.isConnected){ d3BatchStop(); return; }
      if (v.readyState >= 2 && v.videoWidth){
        const k = 360 / Math.max(v.videoWidth, v.videoHeight), c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        const q = dsDetect(c); DSB.q = q;
        const area = Math.abs((q[1][0] - q[0][0]) * (q[3][1] - q[0][1])), whole = q[0][0] < 0.01 && q[0][1] < 0.01 && q[2][0] > 0.99 && q[2][1] > 0.99;
        ov.width = v.clientWidth; ov.height = v.clientHeight; const x = ov.getContext('2d'); x.clearRect(0, 0, ov.width, ov.height);
        if (!whole && area > 0.15){ x.strokeStyle = '#3ddc84'; x.lineWidth = 3; x.fillStyle = 'rgba(61,220,132,.15)'; x.beginPath(); q.forEach((p, i) => { const px = p[0] * ov.width, py = p[1] * ov.height; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill(); x.stroke(); }
        /* automatic shutter: the page has been still for about a second and a half */
        DSB.hist.push(q); if (DSB.hist.length > 5) DSB.hist.shift();
        const still = DSB.hist.length >= 5 && DSB.hist.every(h => h.every((p, i) => Math.abs(p[0] - q[i][0]) < 0.02 && Math.abs(p[1] - q[i][1]) < 0.02));
        const moved = !DSB.last || DSB.last.some((p, i) => Math.abs(p[0] - q[i][0]) > 0.08 || Math.abs(p[1] - q[i][1]) > 0.08);
        if (DSB.auto && still && !whole && area > 0.2 && Date.now() > DSB.cool && moved && !DSB.busy) d3BatchShot(true);
      }
      DSB.t = setTimeout(loop, 300);
    };
    loop();
  } catch (e){ d3BatchStop(); const s = $('#bt_st'); if (s) s.textContent = t('qr_camNo'); }
}
function d3BatchStop(){ clearTimeout(DSB.t); if (DSB.stream){ try { DSB.stream.getTracks().forEach(x => x.stop()); } catch (e) {} } DSB.stream = null; }
async function d3BatchShot(auto){
  const v = $('#bt_vid'); if (!v || !v.videoWidth || DSB.busy) return; DSB.busy = true;
  try {
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    d3AddPage(c); DSB.last = DSB.q; DSB.cool = Date.now() + 2500; DSB.hist = [];
    try { navigator.vibrate && navigator.vibrate(auto ? [40, 40, 40] : 50); } catch (e) {}
    const keepAuto = DSB.auto; dscRender(); DSB.auto = keepAuto; const s = $('#bt_st'); if (s) s.textContent = t('bt_added', {n: DSC.pages.length});
  } catch (e){ toast(t('ph_fail')); }
  finally { DSB.busy = false; }
}
async function d3BatchFiles(files){
  const s = $('#bt_st');
  for (let i = 0; i < files.length; i++){ if (s) s.textContent = '⏳ ' + t('bt_working', {n: i + 1, m: files.length}); try { const img = await dsLoad(files[i]); d3AddPage(img); } catch (e) {} }
  dscRender();
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root')) return;
  if (t0.closest('#ds_batch')){ d3BatchStart(); return; }
  if (DSX.view !== 'batch') return;
  if (t0.closest('#ds_back')){ d3BatchStop(); return; }
  if (t0.closest('#bt_live')){ d3BatchLive(); return; }
  if (t0.closest('#bt_stop')){ d3BatchStop(); dscRender(); return; }
  if (t0.closest('#bt_shot')){ d3BatchShot(false); return; }
  if (t0.closest('#bt_photo')){ $('#bt_photoF').click(); return; }
  if (t0.closest('#bt_pick')){ $('#bt_pickF').click(); return; }
  if (t0.closest('#bt_done')){ d3BatchStop(); DSX.view = 'card'; DSC.cur = null; dscRender(); return; }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || DSX.view !== 'batch') return;
  if ((el.id === 'bt_photoF' || el.id === 'bt_pickF') && el.files.length){ d3BatchFiles([...el.files]); el.value = ''; }
  if (el.id === 'bt_auto') DSB.auto = el.checked;
});

/* ================= 5) a searchable PDF from the scan ================= */
/* visual order for right-to-left lines, so that PDF readers (which re-order) give back the right text */
function d3Visual(s){
  if (!/[֐-ࣿ]/.test(s)) return s;
  const runs = []; let cur = '', rtl = null;
  for (const ch of s){ const r = /[֐-ࣿ]/.test(ch) ? true : /[A-Za-z0-9À-ɏ]/.test(ch) ? false : null; if (r === null || r === rtl || rtl === null){ cur += ch; if (r !== null) rtl = r; } else { runs.push([cur, rtl]); cur = ch; rtl = r; } }
  if (cur) runs.push([cur, rtl]);
  const m = /[A-Za-z\u00C0-\u024F\u0590-\u08FF]/.exec(s), base = m && /[\u0590-\u08FF]/.test(m[0]);
  if (!base) return runs.map(([x, r]) => r ? [...x].reverse().join('') : x).join('');
  return runs.reverse().map(([x, r]) => r === false ? x : [...x].reverse().join('')).join('');
}
/* an invisible font: every character uses an empty glyph, and the ToUnicode map tells readers which letter it is */
function d3Fonts(L, doc, chars){
  const ctx = doc.context, list = [...chars], fonts = [], map = new Map();
  const glyph = ctx.register(ctx.stream('500 0 d0'));
  for (let f = 0; f * 250 < list.length; f++){
    const part = list.slice(f * 250, f * 250 + 250), n = part.length;
    const hex = v => v.toString(16).toUpperCase().padStart(2, '0'), u16 = ch => { const cp = ch.codePointAt(0); if (cp < 0x10000) return cp.toString(16).toUpperCase().padStart(4, '0'); const v = cp - 0x10000; return ((0xD800 + (v >> 10)).toString(16) + (0xDC00 + (v & 1023)).toString(16)).toUpperCase(); };
    const lines = []; for (let i = 0; i < n; i += 100) lines.push(part.slice(i, i + 100).length + ' beginbfchar\n' + part.slice(i, i + 100).map((ch, j) => `<${hex(i + j + 1)}> <${u16(ch)}>`).join('\n') + '\nendbfchar');
    const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /FinOCR${f} def\n/CMapType 2 def\n1 begincodespacerange\n<01> <FF>\nendcodespacerange\n${lines.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
    const tu = ctx.register(ctx.stream(cmap));
    const font = ctx.obj({Type: 'Font', Subtype: 'Type3', FontBBox: [0, 0, 500, 700], FontMatrix: [0.001, 0, 0, 0.001, 0, 0], CharProcs: ctx.obj({g: glyph}), Encoding: ctx.obj({Type: 'Encoding', Differences: [1, ...part.map(() => L.PDFName.of('g'))]}), FirstChar: 1, LastChar: n, Widths: part.map(() => 500), ToUnicode: tu, Resources: ctx.obj({})});
    const ref = ctx.register(font); fonts.push(ref); part.forEach((ch, j) => map.set(ch, [f, j + 1]));
  }
  return {fonts, map};
}
async function dsSearchablePdf(){
  if (!DSC || !DSC.pages.length || !DSC.ocr) return;
  const L = await pxPdfLib(), doc = await L.PDFDocument.create(), plan = dsPlan(), std = DSC.q === 'std', lines = DSC.ocrLines || [];
  const all = new Set(); (lines.length ? lines.flat().map(l => l.t) : [DSC.ocr]).forEach(s => { for (const ch of d3Visual(String(s || ''))) if (ch.trim()) all.add(ch); }); all.add(' ');
  const F = d3Fonts(L, doc, all); let k = 0;
  for (const pg of plan){
    const page = doc.addPage([595.28, 841.89]); let ops = '';
    for (const it of pg.items){
      const b = await new Promise(r => it.c.toBlob(r, 'image/jpeg', std ? 0.82 : 0.92)), im = await doc.embedJpg(new Uint8Array(await b.arrayBuffer()));
      page.drawImage(im, {x: it.x, y: 841.89 - it.y - it.h, width: it.w, height: it.h});
      const LN = lines[k] && lines[k].length ? lines[k] : (k === 0 && !lines.length ? String(DSC.ocr).split('\n').map((s, i, a) => ({t: s, b: [40, 30 + i * 940 / Math.max(1, a.length), 960, 30 + (i + 0.8) * 940 / Math.max(1, a.length)]})) : []);
      LN.forEach(l => { const s = d3Visual(String(l.t || '')); if (!s.trim() || !Array.isArray(l.b) || l.b.length < 4) return;
        const [x0, y0, x1, y1] = l.b.map(Number), lx = it.x + Math.min(x0, x1) / 1000 * it.w, top = it.y + Math.min(y0, y1) / 1000 * it.h, lw = Math.abs(x1 - x0) / 1000 * it.w, lh = Math.max(2, Math.abs(y1 - y0) / 1000 * it.h);
        const fs = Math.max(2, lh * 0.85), n = [...s].length, tz = Math.max(10, Math.min(400, lw / Math.max(1, n * 0.5 * fs) * 100)), by = 841.89 - top - lh * 0.8;
        let seg = '', cf = -1; const parts = [];
        for (const ch of s){ const m = F.map.get(ch); if (!m){ if (ch === ' ' || !ch.trim()){ const sp = F.map.get(' '); if (sp){ if (sp[0] !== cf){ if (seg) parts.push([cf, seg]); seg = ''; cf = sp[0]; } seg += sp[1].toString(16).padStart(2, '0'); } } continue; } if (m[0] !== cf){ if (seg) parts.push([cf, seg]); seg = ''; cf = m[0]; } seg += m[1].toString(16).padStart(2, '0'); }
        if (seg) parts.push([cf, seg]);
        ops += `BT 3 Tr ${tz.toFixed(1)} Tz ${lx.toFixed(2)} ${by.toFixed(2)} Td ` + parts.map(([f, h]) => `/FOcr${f} ${fs.toFixed(2)} Tf <${h}> Tj`).join(' ') + ' ET\n'; });
      k++;
    }
    if (ops){ F.fonts.forEach((ref, i) => page.node.setFontDictionary(L.PDFName.of('FOcr' + i), ref)); const cs = doc.context.register(doc.context.stream('q\n' + ops + 'Q')); page.node.addContentStream(cs); }
  }
  doc.setProducer('Financial Calculator'); doc.setTitle(dsCardName());
  const bytes = await doc.save(), r = await fileSave(new Blob([bytes], {type: 'application/pdf'}), dsFileName('pdf').replace(/\.pdf$/, ' (' + t('ds_searchTag') + ').pdf'), 'application/pdf');
  toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
}

/* ================= the quick scanner button on every calculator screen ================= */
const D3_NOSCAN = ['docscan', 'settings', 'assist', 'home'];
function d3ScanBtn(){
  const r = $('#prnBtn') || $('#resetTab'); if (!r) return;
  let b = $('#scanBtn');
  if (!b){ r.insertAdjacentHTML('beforebegin', `<button type="button" class="ghost-btn scan-btn" id="scanBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 9h8M8 12h8M8 15h5"/></svg><span></span></button>`); b = $('#scanBtn'); }
  b.querySelector('span').textContent = t('scan_q'); b.setAttribute('aria-label', t('scan_qA')); b.title = t('scan_qA'); b.hidden = D3_NOSCAN.includes(tab);
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#scanBtn')){ const from = tab; activate('docscan'); try { DSX.from = from; } catch (er) {} const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'}); } });

/* ================= wiring into the scanner ================= */
{
  const dsr3 = dscRender;
  dscRender = function(){
    const root = $('#ds_root');
    if (root && DSX.view === 'share') return d3ShareRender(root);
    if (root && DSX.view === 'batch') return d3BatchRender(root);
    if (DSX.view !== 'batch') d3BatchStop();
    const r = dsr3.apply(this, arguments);
    if (root && DSX.view === 'kinds' && !DSX.det && !root.querySelector('#ds_batch')){ const go = root.querySelector('.ds-go'); if (go) go.insertAdjacentHTML('afterend', `<div class="btnrow"><button type="button" class="btn" id="ds_batch">📚 ${d3E(t('bt_title'))}</button></div>`); }
    if (root && DSX.view === 'pdf' && (!PX || !PX.pages.length)){ const ft = root.querySelector('.px-feat'); if (ft && !root.querySelector('#px_draft')){ ft.insertAdjacentHTML('beforebegin', '<div id="px_draft"></div>'); pxDraftCard(); } }
    return r;
  };
  const card3 = dsCardRender;
  dsCardRender = function(root){
    const r = card3.apply(this, arguments);
    if (DSC && !DSC.cur){
      const add = root.querySelector('.ds-addw'); if (add && !root.querySelector('#ds_batch')) add.insertAdjacentHTML('afterend', `<button type="button" class="btn" id="ds_batch">📚 ${d3E(t('bt_more'))}</button>`);
      const ocr = root.querySelector('#ds_ocrdocx'); if (ocr && !root.querySelector('#ds_spdf')) ocr.insertAdjacentHTML('afterend', `<button type="button" class="gold-btn" id="ds_spdf">🔎 ${d3E(t('ds_searchPdf'))}</button>`);
    }
    return r;
  };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#ds_spdf'); if (b){ b.disabled = true; dsSearchablePdf().catch(() => toast(t('pdf_fail'))).finally(() => { if (b.isConnected) b.disabled = false; }); } });
  const acD3 = activate; activate = function(){ const r = acD3.apply(this, arguments); try { d3ScanBtn(); } catch (e) {} return r; };
  const alD3 = applyLang; applyLang = function(){ const r = alD3.apply(this, arguments); try { d3ScanBtn(); } catch (e) {} return r; };
  try { d3ScanBtn(); } catch (e) {}
  setTimeout(d3TakeShared, 400);
}
try { GS_SYN.docscan += ' סריקה ברצף כמה דפים חותמת מספור עמודים סימן מים PDF עם חיפוש batch scan stamp page numbers watermark searchable مسح متعدد ختم ترقيم علامة مائية'; } catch (e) {}
