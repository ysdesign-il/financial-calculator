/* scanner: yearly tax folder and sending a document to a family member */
/* ---------- 13.57: 📁 a yearly tax folder, and 👨‍👩‍👧 sending a document to a family member ----------
   📁 Scans and files tagged by tax year and kind, kept only in this browser's own storage (the same store as the documents archive), never
      uploaded. A checklist of the documents often needed for a tax refund, notes for the year, and the whole year as one PDF or a ZIP for the
      accountant. Parts blacked out in the scanner are kept as boxes and stay hidden in anything shared while "hide personal details" is on.
   👨‍👩‍👧 The app has no server storage for passing files between people (family mode is only a way to sign in), so nothing new is built on a
      server: the document is masked, then locked on the phone with a one-time password (PBKDF2 + AES-GCM) into one file that opens in any
      browser or in this app, and shared through the phone's share sheet. The password is said aloud, never sent with the file, and the file
      stops opening after 1, 3 or 7 days (the date is sealed into the encryption). No ID, card or account number is ever stored as text. */
const txE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* long runs of digits (ID, card, account or phone numbers) never stay in names or notes; dates and amounts are left alone */
const txSafe = s => String(s == null ? '' : s).replace(/\d(?:[ \-]?\d){6,}/g, m => /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : '•'.repeat(Math.min(12, m.replace(/\D/g, '').length)));
const TX_CATS = [['f106', '💼'], ['f867', '🏦'], ['donate', '💝'], ['pens', '🌱'], ['insur', '🛡️'], ['btl', '🏛️'], ['credit', '🧾'], ['kids', '🧒'], ['degree', '🎓'], ['soldier', '🎖️'], ['move', '🏘️'], ['rent', '🏠'], ['other', '📎']];
/* the checklist: the kinds that are commonly asked for (the wording of some rows is shared with the yearly pack) */
const TX_CK = ['f106', 'f867', 'donate', 'pens', 'insur', 'btl', 'credit', 'kids', 'degree', 'soldier', 'move', 'rent'];
const TX_TP = ['f106', 'f867', 'donate', 'degree', 'soldier', 'move', 'rent'];
const txCkL = k => TX_TP.includes(k) && T['tp_i_' + k] ? 'tp_i_' + k : 'tx_i_' + k;
const txCkH = k => TX_TP.includes(k) && T['tp_h_' + k] ? 'tp_h_' + k : 'tx_h_' + k;
const txIc = c => (TX_CATS.find(x => x[0] === c) || TX_CATS[TX_CATS.length - 1])[1];
const TX_MAX = 2000;          // the longest side of a stored page (about 170 DPI for an A4 page – sharp enough to read and print)
const TX_TAXSITE = 'https://www.gov.il/he/departments/israel_tax_authority';
const txY0 = () => new Date().getFullYear() - 1;       // a refund is asked for a year that has ended
var TXV = {y: 0, tab: 'docs', ed: null, cat: '', pend: null, mask: true, busy: false, back: '', st: ''};
function txD(){
  const d = SET.taxf && typeof SET.taxf === 'object' ? SET.taxf : (SET.taxf = {});
  if (!Array.isArray(d.items)) d.items = []; if (!d.notes || typeof d.notes !== 'object') d.notes = {}; if (!d.na || typeof d.na !== 'object') d.na = {};
  return d;
}
const txYear = () => +TXV.y || txY0();
const txOf = y => txD().items.filter(x => +x.year === +y).sort((a, b) => TX_CATS.findIndex(c => c[0] === a.cat) - TX_CATS.findIndex(c => c[0] === b.cat) || (a.created || 0) - (b.created || 0));
const txKey = (id, i) => 'tx:' + id + ':' + i;
const txNoFiles = () => typeof vtNoPics === 'function' && vtNoPics();
const txId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const txYears = () => { const Y = new Date().getFullYear(), s = new Set([Y, Y - 1, Y - 2, Y - 3, Y - 4, Y - 5, Y - 6]); txD().items.forEach(x => { if (+x.year > 1990) s.add(+x.year); }); return [...s].sort((a, b) => b - a); };
const txCatName = c => t('tx_c_' + (TX_CATS.some(x => x[0] === c) ? c : 'other'));
const txFileName = s => String(s).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

/* ---- pages: stored as JPEG in the browser's own storage; the hidden parts are kept as boxes ---- */
function txJpeg(c, q){ return new Promise((ok, no) => { try { c.toBlob(b => b ? ok(b) : no(new Error('blob')), 'image/jpeg', q || 0.86); } catch (e) { no(e); } }); }
function txFit(src, max){
  const k = Math.min(1, max / Math.max(src.width, src.height)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k));
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height); return c;
}
const txBoxes = (x, W, H, red) => { x.fillStyle = '#000'; (red || []).forEach(r => x.fillRect(r[0] * W, r[1] * H, r[2] * W, r[3] * H)); };
/* the scan on screen, as it looks but without the black boxes and the watermark (the boxes are kept apart and put back when sharing) */
function txFromScan(){
  if (!DSC || !DSC.pages.length) return [];
  const wm = DSC.wm; DSC.wm = '';
  try { return DSC.pages.slice(0, 30).map(p => ({c: txFit(dsCompose(Object.assign({}, p, {red: []})), TX_MAX), red: (p.red || []).map(r => r.slice(0, 4))})); }
  finally { DSC.wm = wm; }
}
async function txFromFiles(files){
  const out = [];
  for (const f of [...files].slice(0, 10)){
    if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name || '')){
      const doc = await pxOpenPdf(new Uint8Array(await f.arrayBuffer()), f.name);
      for (let i = 1; i <= Math.min(doc.numPages, 20); i++){
        const pg = await doc.getPage(i), v0 = pg.getViewport({scale: 1}), v = pg.getViewport({scale: Math.min(3, TX_MAX / Math.max(v0.width, v0.height))});
        const c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        await pg.render({canvasContext: x, viewport: v}).promise; out.push({c, red: []});
      }
      try { doc.destroy(); } catch (e) {}
    } else if (/^image\//i.test(f.type)) out.push({c: txFit(await dsLoad(f), TX_MAX), red: []});
  }
  return out;
}
async function txPages(it){
  const out = []; if (!it || !(it.n > 0)) return out;
  for (let i = 0; i < it.n; i++){ const b = await vtGet(txKey(it.id, i)); if (b) out.push({b, i, red: (it.red || [])[i] || [], w: ((it.dims || [])[i] || [])[0] || 0, h: ((it.dims || [])[i] || [])[1] || 0}); }
  return out;
}
async function txCanvas(pg, mask){ const c = await dsLoad(pg.b); if (mask) txBoxes(c.getContext('2d'), c.width, c.height, pg.red); return c; }
/* a page that is only read from storage when the PDF writer asks for it – a whole year never sits in memory at once */
function txLazy(pg, mask){
  return {width: pg.w, height: pg.h, toBlob(cb){ (async () => (mask && pg.red.length) ? txJpeg(await txCanvas(pg, true), 0.88) : pg.b)().then(cb, () => cb(null)); }};
}
async function txDelFiles(it){ for (let i = 0; i < (it.n || 0) + 2; i++) await vtDel(txKey(it.id, i)); }
/* a first guess of the kind and year from the recognised text (only on the phone) */
function txGuess(s){
  s = String(s || '');
  if (/(^|\D)106(\D|$)/.test(s)) return 'f106'; if (/(^|\D)867(\D|$)/.test(s)) return 'f867';
  if (/תרומ|סעיף\s*46|donat|تبرع/i.test(s)) return 'donate';
  if (/פנסי|גמל|השתלמות|pension|provident|study fund|تقاعد|صندوق/i.test(s)) return 'pens';
  if (/ביטוח חיים|אובדן כושר|life insur|disabilit(y|ies) insur|تأمين حياة/i.test(s)) return 'insur';
  if (/ביטוח לאומי|national insurance|التأمين الوطني/i.test(s)) return 'btl';
  if (/מעון|צהרון|daycare|childcare|حضانة/i.test(s)) return 'kids';
  if (/זכאות לתואר|degree|لقب/i.test(s)) return 'degree'; if (/תעודת שחרור|discharge|تسريح/i.test(s)) return 'soldier';
  if (/שכירות|rental|إيجار/i.test(s)) return 'rent';
  return '';
}
function txGuessYear(s){ const m = /(?:לשנת(?: המס)?|שנת המס|tax year|for the year|لسنة)\s*(20\d\d)/i.exec(String(s || '')); const y = m ? +m[1] : 0; return y && y <= new Date().getFullYear() ? y : 0; }

/* ---- the "waiting for you" list and reminders ---- */
function txLinkTodo(it){
  try {
    if (!it.todo){ if (it.dsi && typeof dsiRemove === 'function') dsiRemove(it.dsi); it.dsi = ''; return; }
    if (typeof dsiAdd !== 'function') return;
    const date = it.todoDate || rmIso(new Date(Date.now() + 30 * 864e5)), title = it.todo + ' – ' + it.title;
    if (it.dsi && typeof dsiUpdate === 'function'){ dsiUpdate(it.dsi, {title, date, year: +it.year}); return; }
    const r = dsiAdd({kind: 'tax', title, date, year: +it.year, meta: {tx: it.id}, created: Date.now()});
    it.dsi = typeof r === 'string' ? r : (r && r.id) || '';
  } catch (e) {}
}

/* ================= the tax folder screen ================= */
function txItemHTML(it){
  const E = txE, sub = [txCatName(it.cat), it.n ? t('tx_pages', {n: it.n}) : t('tx_noFile'), +it.amount ? M(+it.amount, 0, 'ILS') : ''].filter(Boolean).join(' · ');
  return `<li class="rm-it${it.todo ? ' due' : ''}"><div class="rm-ic" aria-hidden="true">${txIc(it.cat)}</div><div class="rm-b"><b dir="auto">${E(it.title)}</b><span class="rm-w">${E(sub)}</span>
    ${it.note ? `<small dir="auto">${E(it.note)}</small>` : ''}${it.todo ? `<small dir="auto">📌 ${E(it.todo)}${it.todoDate ? ' · ' + E(rmFmt(it.todoDate)) : ''}</small>` : ''}
    <div class="rm-acts">${it.n ? `<button type="button" class="px-tb s" data-txview="${E(it.id)}" aria-label="${E(t('tx_viewA', {n: it.title}))}" title="${E(t('tx_viewA', {n: it.title}))}">👁️</button><button type="button" class="px-tb s" data-txmask="${E(it.id)}" aria-label="${E(t('tx_maskA', {n: it.title}))}" title="${E(t('tx_maskA', {n: it.title}))}">🖍️</button><button type="button" class="px-tb s" data-txfam="${E(it.id)}" aria-label="${E(t('tx_famA', {n: it.title}))}" title="${E(t('tx_famA', {n: it.title}))}">👨‍👩‍👧</button>` : ''}<button type="button" class="px-tb s" data-txed="${E(it.id)}" aria-label="${E(t('rm_edit', {t: it.title}))}" title="${E(t('rm_edit', {t: it.title}))}">✏️</button><button type="button" class="px-tb s" data-txrem="${E(it.id)}" aria-label="${E(t('tx_remA', {n: it.title}))}" title="${E(t('tx_remA', {n: it.title}))}">⏰</button><button type="button" class="px-tb s" data-txdel="${E(it.id)}" aria-label="${E(t('rm_del', {t: it.title}))}" title="${E(t('rm_del', {t: it.title}))}">🗑️</button></div></div></li>`;
}
function txEditorHTML(){
  const E = txE, d = txD(), it = TXV.ed && TXV.ed !== 'new' ? d.items.find(x => x.id === TXV.ed) : null, P = TXV.pend;
  const v = Object.assign({title: '', cat: TXV.cat || 'other', year: txYear(), amount: '', note: '', todo: '', todoDate: ''}, it || {}, TXV.pre || {});
  const pages = P ? (P.replace ? t('tx_pgReplace', {n: P.pages.length}) : t('tx_pgAdd', {n: P.pages.length})) : it && it.n ? t('tx_pages', {n: it.n}) : t('tx_noFile');
  return `<form class="bk-acc rm-form" id="tx_form" novalidate><fieldset><legend>${it ? '✏️' : '＋'} ${E(t(it ? 'tx_editT' : 'tx_newT'))}</legend>
    <p class="fine" role="status">📄 ${E(pages)}${P && P.pages.some(p => p.red.length) ? ' · 🖍️ ' + E(t('tx_hasMask')) : ''}</p>
    ${P && txNoFiles() ? `<div class="ds-warn" role="note"><span aria-hidden="true">🔒</span><p>${E(t('tx_noPics'))}</p></div>` : ''}
    <label class="bk-f"><span>${E(t('tx_fTitle'))}</span><input type="text" id="txf_title" maxlength="80" dir="auto" value="${E(v.title)}" placeholder="${E(t('tx_fTitlePh'))}" required></label>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('tx_fCat'))}</span><select id="txf_cat">${TX_CATS.map(([c, ic]) => `<option value="${c}"${c === v.cat ? ' selected' : ''}>${ic} ${E(txCatName(c))}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('tx_year'))}</span><select id="txf_year">${txYears().map(y => `<option value="${y}"${+y === +v.year ? ' selected' : ''}>${y}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('tx_fAmt'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="txf_amt" maxlength="12" value="${E(v.amount)}"></label></div>
    <label class="bk-f"><span>${E(t('rm_fNote'))}</span><textarea id="txf_note" rows="2" maxlength="300" dir="auto">${E(v.note)}</textarea></label>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('tx_fTodo'))}</span><input type="text" id="txf_todo" maxlength="80" dir="auto" value="${E(v.todo)}" placeholder="${E(t('tx_fTodoPh'))}"></label>
    <label class="bk-f"><span>${E(t('tx_fTodoD'))}</span><input type="date" id="txf_todod" value="${E(v.todoDate)}"></label></div>
    <p class="fine">🔒 ${E(t('tx_fPriv'))}</p>
    <div class="btnrow"><button type="submit" class="gold-btn">✓ ${E(t('rm_save'))}</button><button type="button" class="btn" id="txf_cancel">${E(t('rm_cancel'))}</button></div></fieldset></form>`;
}
function txDocs(){
  const E = txE, y = txYear(), L = txOf(y);
  return `${TXV.ed ? txEditorHTML() : `<div class="btnrow"><button type="button" class="gold-btn" id="tx_scan">📷 ${E(t('tx_scan'))}</button><label class="btn">📎 ${E(t('tx_file'))}<input type="file" id="tx_file" accept="image/*,application/pdf" multiple hidden></label><button type="button" class="mv" id="tx_rec">＋ ${E(t('tx_noFileAdd'))}</button></div>`}
    <p class="fine" id="txf_st" role="status" aria-live="polite">${E(TXV.st || '')}</p>
    <ul class="rm-list" aria-label="${E(t('tx_listA', {y}))}">${L.map(txItemHTML).join('') || `<li class="fine bk-empty">${E(t('tx_none', {y}))}</li>`}</ul>`;
}
function txCheck(){
  const E = txE, y = txYear(), d = txD(), L = txOf(y), na = d.na[y] || [], rel = TX_CK.filter(k => !na.includes(k)), have = rel.filter(k => L.some(x => x.cat === k));
  return `<div class="ds-warn" role="note"><span aria-hidden="true">ℹ️</span><p>${E(t('tx_ckNote'))}</p></div>
    <div class="bk-hero"><span>${E(t('tx_ckProg', {y}))}</span><b dir="ltr">${have.length} / ${rel.length}</b><small>${E(rel.length - have.length ? t('tx_ckMiss', {n: rel.length - have.length}) : t('tx_ckAll'))}</small></div>
    <ul class="rm-list tx-ck">${TX_CK.map(k => { const n = L.filter(x => x.cat === k).length, off = na.includes(k);
      return `<li class="rm-it${n ? '' : off ? ' done' : ''}"><div class="rm-ic" aria-hidden="true">${n ? '✅' : off ? '➖' : txIc(k)}</div><div class="rm-b"><b>${E(t(txCkL(k)))}</b>
        <span class="rm-w">${E(n ? t('tx_ckHave', {n}) : off ? t('tx_ckNa') : t('tx_ckNo'))}${k === 'f106' && n === 1 ? ' · ' + E(t('tx_ck106')) : ''}</span><small>${E(t(txCkH(k)))}</small>
        <div class="rm-acts"><button type="button" class="mv" data-txckadd="${k}" aria-label="${E(t('tx_ckAddA', {n: t(txCkL(k))}))}">＋ ${E(t('tx_ckAdd'))}</button><label class="prn-ck"><input type="checkbox" data-txna="${k}"${off ? ' checked' : ''}> ${E(t('tx_ckNaL'))}</label></div></div></li>`; }).join('')}</ul>
    <div class="btnrow"><button type="button" class="btn" data-go="taxrefund">↗ ${E(t('tab_taxrefund'))}</button><a class="btn" href="${TX_TAXSITE}" target="_blank" rel="noopener noreferrer">↗ ${E(t('tx_taxSite'))}</a></div>`;
}
function txNotes(){
  const E = txE, y = txYear();
  return `<label class="bk-f"><span>${E(t('tx_notesL', {y}))}</span><textarea id="tx_notes" rows="8" maxlength="4000" dir="auto" placeholder="${E(t('tx_notesPh'))}">${E(txD().notes[y] || '')}</textarea></label>
    <p class="fine">🔒 ${E(t('tx_notesH'))}</p>`;
}
function txOut(){
  const E = txE, y = txYear(), L = txOf(y), pg = L.reduce((s, x) => s + (x.n || 0), 0);
  return `<p class="fine">${E(t('tx_outIntro'))}</p>
    <div class="bk-hero"><span>${E(t('tx_outSum', {y}))}</span><b>${E(t('tx_outN', {n: L.length, p: pg}))}</b></div>
    <label class="prn-ck"><input type="checkbox" id="tx_maskck"${TXV.mask ? ' checked' : ''}> ${E(t('tx_maskL'))}</label><p class="fine">${E(t('tx_maskH'))}</p>
    <div class="btnrow ds-out"><button type="button" class="gold-btn" data-txout="pdf"${L.length && !TXV.busy ? '' : ' disabled'}>📄 ${E(t('tx_outPdf'))}</button><button type="button" class="btn" data-txout="zip"${L.length && !TXV.busy ? '' : ' disabled'}>🗜️ ${E(t('tx_outZip'))}</button>${navigator.share ? `<button type="button" class="btn" data-txout="share"${L.length && !TXV.busy ? '' : ' disabled'}>📤 ${E(t('ds_share'))}</button>` : ''}</div>
    <p class="fine" id="tx_ost" role="status" aria-live="polite">${E(TXV.busy ? t('ds_making') : L.length ? '' : t('tx_none', {y}))}</p>
    <p class="fine sl-priv">🔒 ${E(t('tx_outPriv'))}</p>`;
}
function txfRender(root){
  const E = txE, y = txYear(), n = txOf(y).length;
  root.innerHTML = dsBar('📁 ' + t('tx_title')) + `<p class="fine">${E(t('tx_intro'))}</p>
    ${txNoFiles() ? `<div class="ds-warn" role="note"><span aria-hidden="true">🔒</span><p>${E(t('tx_noPics'))}</p></div>` : ''}
    <div class="field cv-f"><label for="tx_y">${E(t('tx_year'))}</label><select id="tx_y">${txYears().map(z => `<option value="${z}"${z === y ? ' selected' : ''}>${z}${z === txY0() ? ' · ' + E(t('tx_yPrev')) : ''}</option>`).join('')}</select></div>
    <div class="ds-chips bk-tabs" role="tablist" aria-label="${E(t('tx_title'))}">${[['docs', '📄', t('tx_t_docs', {n})], ['ck', '✅', t('tx_t_ck')], ['notes', '📝', t('tx_t_notes')], ['out', '📤', t('tx_t_out')]].map(([k, ic, l]) => `<button type="button" role="tab" id="txt_${k}" class="ds-chip${TXV.tab === k ? ' on' : ''}" aria-selected="${TXV.tab === k}" aria-controls="tx_body" data-txtab="${k}">${ic} ${E(l)}</button>`).join('')}</div>
    <div id="tx_body" role="tabpanel" aria-labelledby="txt_${TXV.tab}">${({docs: txDocs, ck: txCheck, notes: txNotes, out: txOut})[TXV.tab]()}</div>`;
}
function txGo(tab, pre){
  try { if (typeof tab === 'string' && tab) TXV.tab = tab; if (pre) Object.assign(TXV, pre); if (tab !== 'docscan') activate('docscan'); } catch (e) {}
  DSX.view = 'taxf'; dscRender(); const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'});
}
async function txSave(){
  const d = txD(), title = txSafe($('#txf_title').value.trim()).slice(0, 80);
  if (!title){ $('#txf_title').focus(); toast(t('tx_needTitle')); return; }
  if (TXV.busy) return; TXV.busy = true;
  const rec = {title, cat: $('#txf_cat').value, year: +$('#txf_year').value || txYear(), amount: $('#txf_amt').value.replace(/[^\d.]/g, '').slice(0, 12), note: txSafe($('#txf_note').value.trim()).slice(0, 300), todo: txSafe($('#txf_todo').value.trim()).slice(0, 80), todoDate: $('#txf_todod').value || ''};
  let it = TXV.ed && TXV.ed !== 'new' ? d.items.find(x => x.id === TXV.ed) : null;
  if (it) Object.assign(it, rec); else { it = Object.assign({id: txId(), created: Date.now(), n: 0, red: [], dims: []}, rec); d.items.push(it); }
  const P = TXV.pend; let fail = false;
  if (P && P.pages.length && !txNoFiles()){
    try {
      if (P.replace){ await txDelFiles(it); it.n = 0; it.red = []; it.dims = []; }
      for (const pg of P.pages){ await vtPut(txKey(it.id, it.n), await txJpeg(pg.c)); it.red[it.n] = pg.red; it.dims[it.n] = [pg.c.width, pg.c.height]; it.n++; }
    } catch (e) { fail = true; }
  }
  txLinkTodo(it);
  TXV.ed = null; TXV.pend = null; TXV.pre = null; TXV.busy = false; TXV.y = it.year; TXV.tab = 'docs';
  if (DSC && DSC.txId === undefined && P && !P.replace) DSC.txId = it.id;
  saveSet(); txfRender($('#ds_root')); toast(t(fail ? 'vt_picFail' : 'tx_saved', {y: it.year}));
  const s = $('#txf_st'); if (s) s.textContent = t('tx_saved', {y: it.year});
}
/* the pages of a folder item back in the scanner – to hide more, sign or add pages; "save" there brings them back */
async function txToScan(it){
  if (!it || !it.n) return;
  if (DSC && DSC.pages.length && DSC.txId !== it.id && !confirm(t('tx_replaceScan'))) return;
  const P = await txPages(it); if (!P.length){ toast(t('vt_picGone')); return; }
  const pages = []; for (const p of P){ const c = await dsLoad(p.b); pages.push({base: c, red: p.red.map(r => r.slice()), dpi: 0, real: 0, sharp: 100, qrDone: true}); }
  DSC = {pages, type: 'other', filt: 'orig', filtSet: true, wm: '', lay: 'sep', name: it.title, typeSet: true, q: 'max', txId: it.id};
  DSX.view = 'card'; DSX.red = true; dscRender(); toast(t('tx_maskHint'));
  const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'});
}
async function txView(it){
  const P = await txPages(it); if (!P.length){ toast(t('vt_picGone')); return; }
  let o = $('#txv');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="txv" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="txv_h"><div class="cp-top"><h3 id="txv_h"></h3><button type="button" class="cp-x" id="txv_x" aria-label="${txE(t('cp_close'))}">✕</button></div><div class="tx-view" id="txv_b"></div></div></div>`); o = $('#txv'); }
  $('#txv_h').textContent = it.title; const b = $('#txv_b'); b.innerHTML = '';
  for (const p of P){ const c = txFit(await txCanvas(p, true), 1400); c.setAttribute('role', 'img'); c.setAttribute('aria-label', t('ds_side', {n: p.i + 1})); b.appendChild(c); }
  o.hidden = false; document.body.classList.add('cp-lock'); const x = $('#txv_x'); if (x) x.focus();
}
function txViewClose(){ const o = $('#txv'); if (!o || o.hidden) return; o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#txv_b'); if (b) b.innerHTML = ''; }

/* ---- the year for the accountant: a summary page, then every document ---- */
const TX_A4 = [595.28, 841.89];
function txCover(y, docs, starts, mask){
  const W = 1240, H = 1754, rtl = document.documentElement.dir === 'rtl', pages = [];
  const F = (w, s) => w + ' ' + s + 'px -apple-system,"Segoe UI","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif', X = v => rtl ? W - v : v;
  let c, x, yy;
  const page = () => { c = document.createElement('canvas'); c.width = W; c.height = H; x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = 'start'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#0B1F3A'; x.fillRect(0, 0, W, 150); x.fillStyle = '#F2C45A'; x.font = F('700', 50); x.fillText(t('tx_pdfT', {y}), X(80), 88); x.fillStyle = '#fff'; x.font = F('400', 28); x.fillText(t('tx_pdfS', {d: new Date().toLocaleDateString(locOf())}) + (pages.length ? ' · ' + (pages.length + 1) : ''), X(80), 128);
    x.fillStyle = '#8A94A6'; x.font = F('400', 22); x.fillText(t('tx_pdfFoot'), X(80), H - 50); pages.push(c); yy = 220; };
  const wrap = (s, font, maxW) => { x.font = font; const out = []; String(s).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(w => { const tt = line ? line + ' ' + w : w; if (x.measureText(tt).width > maxW && line){ out.push(line); line = w; } else line = tt; }); out.push(line); }); return out; };
  const need = h => { if (yy + h > H - 100) page(); };
  const line = (s, font, col, h, ind) => { need(h); x.font = font; x.fillStyle = col; x.fillText(s, X(80 + (ind || 0)), yy); yy += h; };
  page();
  line(t('tx_pdfList', {n: docs.length}), F('700', 34), '#0B1F3A', 58);
  docs.forEach((dc, i) => { const it = dc.it, sub = [txCatName(it.cat), +it.amount ? M(+it.amount, 0, 'ILS') : '', dc.P.length ? (starts ? (dc.P.length > 1 ? t('tx_pdfPg', {a: starts[i], b: starts[i] + dc.P.length - 1}) : t('tx_pdfPg1', {a: starts[i]})) : t('tx_pages', {n: dc.P.length})) : t('tx_noFile')].filter(Boolean).join(' · ');
    need(96); line(txIc(it.cat) + '  ' + (mask ? txSafe(it.title) : it.title), F('700', 30), '#0B1F3A', 42); line(sub, F('400', 26), '#4E5B6E', 54, 50); });
  const d = txD(), na = d.na[y] || [], miss = TX_CK.filter(k => !na.includes(k) && !docs.some(dc => dc.it.cat === k));
  if (miss.length){ yy += 10; line(t('tx_pdfMiss'), F('700', 32), '#0B1F3A', 52); miss.forEach(k => line('○  ' + t(txCkL(k)), F('400', 27), '#4E5B6E', 44)); }
  const notes = String(d.notes[y] || '').trim();
  if (notes){ yy += 10; line(t('tx_t_notes'), F('700', 32), '#0B1F3A', 52); wrap(mask ? txSafe(notes) : notes, F('400', 27), W - 160).forEach(s => line(s, F('400', 27), '#26324A', 40)); }
  return pages;
}
async function txGather(y){ const out = []; for (const it of txOf(y)) out.push({it, P: txNoFiles() ? [] : await txPages(it)}); return out; }
const txA4 = c => ({items: [{c, x: 0, y: 0, w: TX_A4[0], h: TX_A4[1]}]});
function txFitPage(pg, mask){
  const [PW, PH] = TX_A4, m = 12 * 72 / 25.4, k = Math.min((PW - 2 * m) / pg.w, (PH - 2 * m) / pg.h), w = pg.w * k, h = pg.h * k;
  return {items: [{c: txLazy(pg, mask), x: (PW - w) / 2, y: (PH - h) / 2, w, h}]};
}
async function txYearPdf(y, mask){
  const docs = await txGather(y), n0 = txCover(y, docs, null, mask).length, starts = []; let at = n0 + 1;
  docs.forEach(dc => { starts.push(at); at += dc.P.length; });
  const pages = txCover(y, docs, starts, mask).map(txA4);
  docs.forEach(dc => dc.P.forEach(pg => pages.push(txFitPage(pg, mask))));
  return dsPdf(pages, 0.9);
}
async function txYearZip(y, mask){
  const JSZip = await pxZip(), z = new JSZip(), docs = await txGather(y);
  z.file('00 ' + txFileName(t('tx_pdfT', {y})) + '.pdf', await dsPdf(txCover(y, docs, null, mask).map(txA4), 0.9));
  let i = 0;
  for (const dc of docs){ i++; if (!dc.P.length) continue; const nm = String(i).padStart(2, '0') + ' ' + txFileName(txCatName(dc.it.cat) + ' - ' + (mask ? txSafe(dc.it.title) : dc.it.title)) + '.pdf';
    z.file(nm, await dsPdf(dc.P.map(pg => txFitPage(pg, mask)), 0.9)); }
  const notes = String(txD().notes[y] || '').trim(); if (notes) z.file(txFileName(t('tx_t_notes')) + '.txt', '﻿' + (mask ? txSafe(notes) : notes));
  return z.generateAsync({type: 'blob', compression: 'STORE', mimeType: 'application/zip'});
}
async function txExport(how){
  const y = txYear(); if (!txOf(y).length || TXV.busy) return;
  TXV.busy = true; txfRender($('#ds_root')); await new Promise(r => setTimeout(r, 30));
  const base = txFileName(t('tx_pdfT', {y}));
  try {
    if (how === 'zip'){ const b = await txYearZip(y, TXV.mask), r = await fileSave(b, base + '.zip', 'application/zip'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail')); }
    else {
      const b = await txYearPdf(y, TXV.mask), name = base + '.pdf';
      if (how === 'share'){ const f = new File([b], name, {type: 'application/pdf'}); if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f], title: name}); } catch (e) {} TXV.busy = false; txfRender($('#ds_root')); return; } }
      const r = await fileSave(b, name, 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
    }
  } catch (e) { toast(t('pdf_fail')); }
  TXV.busy = false; if (DSX.view === 'taxf') txfRender($('#ds_root'));
}

/* ================= 👨‍👩‍👧 sending a document to a family member ================= */
var FXV = {tab: 'send', src: '', exp: 3, ok: false, note: '', out: null, recv: null, busy: false, back: ''};
const FX_SENS = ['id', 'passport', 'license', 'health', 'credit', 'student', 'army', 'oleh', 'disab', 'ravkav', 'idold'];
const FX_IT = 310000;
function fxB64(u){ u = u instanceof Uint8Array ? u : new Uint8Array(u); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function fxPw(){       // 12 characters that are easy to say and hard to confuse (about 59 bits)
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', out = [];
  while (out.length < 12){ const r = crypto.getRandomValues(new Uint8Array(16)); for (const v of r) if (v < 248 && out.length < 12) out.push(A[v % 31]); }
  return out.join('').replace(/(.{4})(?=.)/g, '$1-');
}
const fxNorm = s => String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
async function fxDerive(pw, salt, it, use){
  const k0 = await crypto.subtle.importKey('raw', new TextEncoder().encode(fxNorm(pw)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it}, k0, {name: 'AES-GCM', length: 256}, false, [use]);
}
/* the source: the scan on screen (as it will look, hidden parts black) or a document from the tax folder */
function fxSources(){
  const L = []; if (DSC && DSC.pages.length) L.push({id: 'scan', name: dsCardName(), n: DSC.pages.length, sens: FX_SENS.includes(DSC.type)});
  if (!txNoFiles()) txD().items.filter(x => x.n > 0).sort((a, b) => (b.created || 0) - (a.created || 0)).forEach(x => L.push({id: 'tx:' + x.id, name: x.title + ' · ' + x.year, n: x.n, it: x}));
  return L;
}
async function fxCanvases(src, max){
  const out = [];
  if (src.id === 'scan'){ for (const p of DSC.pages.slice(0, 10)) out.push(txFit(dsCompose(p), max)); return out; }
  for (const pg of (await txPages(src.it)).slice(0, 10)) out.push(txFit(await txCanvas(pg, true), max));
  return out;
}
function fxOpenerHTML(pkg, dir, lg){
  const S = {t: t('fx_oTitle'), lead: t('fx_oLead'), pw: t('fx_pwL'), go: t('fx_oGo'), wait: t('fx_oWait'), bad: t('fx_badPw'), exp: t('fx_expired'), until: t('fx_until'), pdf: t('fx_savePdf'), del: t('fx_oDel'), priv: t('fx_oPriv'), nocrypto: t('m_nocrypto'), page: t('ds_side', {n: '{n}'})};
  const J = o => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="${lg}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>${txE(S.t)}</title>
<style>:root{color-scheme:light dark}body{margin:0;font:16px/1.5 -apple-system,"Segoe UI","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif;background:#0B1F3A;color:#EEF2FB}main{max-width:640px;margin:0 auto;padding:20px 16px 40px}h1{font-size:1.3rem;color:#F2C45A;margin:0 0 6px}p{margin:8px 0}.box{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin:14px 0}label{display:block;font-weight:600;margin-bottom:6px}input{box-sizing:border-box;width:100%;font:600 1.2rem ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;padding:12px;border-radius:12px;border:1.5px solid rgba(255,255,255,.25);background:#fff;color:#111;direction:ltr;text-align:center}button{font:inherit;font-weight:700;padding:12px 18px;border-radius:12px;border:0;background:#F2C45A;color:#1a1202;margin-top:12px;cursor:pointer;min-height:44px}small,.fine{opacity:.8;font-size:.86rem}#st{min-height:1.5em;font-weight:600}img{display:block;width:100%;height:auto;background:#fff;border-radius:8px;margin:10px 0}[hidden]{display:none}</style></head>
<body><main><h1>🔒 ${txE(S.t)}</h1><p>${txE(S.lead)}</p><p class="fine" id="ex"></p>
<form class="box" id="f"><label for="pw">${txE(S.pw)}</label><input id="pw" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" required><button type="submit">${txE(S.go)}</button></form>
<p id="st" role="status" aria-live="polite"></p><div id="out" hidden><p id="nm" dir="auto"></p><p id="nt" dir="auto"></p><button type="button" id="pdf">${txE(S.pdf)}</button><div id="pg"></div><p class="fine">${txE(S.del)}</p></div>
<p class="fine">${txE(S.priv)}</p></main>
<script type="application/json" id="fd">${J(pkg)}</script><script type="application/json" id="fs">${J(S)}</script>
<script>(function(){'use strict';var D=JSON.parse(document.getElementById('fd').textContent),S=JSON.parse(document.getElementById('fs').textContent),$=function(i){return document.getElementById(i)},O=null;
function u8(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
var dt='';try{dt=new Date(D.x).toLocaleString(document.documentElement.lang)}catch(e){dt=new Date(D.x).toISOString()}
if(Date.now()>D.x){$('f').hidden=true;$('st').textContent=S.exp.replace('{d}',dt);return}$('ex').textContent=S.until.replace('{d}',dt);
$('f').addEventListener('submit',async function(e){e.preventDefault();$('st').textContent=S.wait;try{if(!window.crypto||!crypto.subtle)throw new Error('nc');if(Date.now()>D.x){$('st').textContent=S.exp.replace('{d}',dt);return}
var pw=$('pw').value.toUpperCase().replace(/[^0-9A-Z]/g,''),k0=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']),
k=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:u8(D.s),iterations:D.it},k0,{name:'AES-GCM',length:256},false,['decrypt']),
pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u8(D.i),additionalData:new TextEncoder().encode('fdoc1|'+D.x)},k,u8(D.c));O=JSON.parse(new TextDecoder().decode(pt));show()}
catch(er){$('st').textContent=er&&er.message==='nc'?S.nocrypto:S.bad}});
function show(){$('f').hidden=true;$('st').textContent='';$('nm').textContent=O.n||'';$('nt').textContent=O.m||'';var g=$('pg');g.innerHTML='';O.p.forEach(function(p,i){var im=new Image();im.src='data:image/jpeg;base64,'+p.d;im.alt=S.page.replace('{n}',i+1);g.appendChild(im)});$('out').hidden=false}
$('pdf').addEventListener('click',function(){var enc=new TextEncoder(),parts=[],offs=[],len=0,put=function(x){var u=typeof x==='string'?enc.encode(x):x;parts.push(u);len+=u.length},PW=595.28,PH=841.89,n=3,P=[];
O.p.forEach(function(p){P.push({id:n++,cid:n++,im:n++,u:u8(p.d),w:p.w,h:p.h})});var obj=function(i,f){offs[i]=len;put(i+' 0 obj\\n');f();put('\\nendobj\\n')};
put('%PDF-1.4\\n');obj(1,function(){put('<< /Type /Catalog /Pages 2 0 R >>')});obj(2,function(){put('<< /Type /Pages /Count '+P.length+' /Kids ['+P.map(function(p){return p.id+' 0 R'}).join(' ')+'] >>')});
P.forEach(function(p){var m=34,k=Math.min((PW-2*m)/p.w,(PH-2*m)/p.h),w=p.w*k,h=p.h*k,cs='q '+w.toFixed(2)+' 0 0 '+h.toFixed(2)+' '+((PW-w)/2).toFixed(2)+' '+((PH-h)/2).toFixed(2)+' cm /Im0 Do Q';
obj(p.id,function(){put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+PW+' '+PH+'] /Resources << /XObject << /Im0 '+p.im+' 0 R >> >> /Contents '+p.cid+' 0 R >>')});
obj(p.cid,function(){put('<< /Length '+enc.encode(cs).length+' >>\\nstream\\n'+cs+'\\nendstream')});
obj(p.im,function(){put('<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.u.length+' >>\\nstream\\n');put(p.u);put('\\nendstream')})});
var x=len;put('xref\\n0 '+n+'\\n0000000000 65535 f \\n');for(var i=1;i<n;i++)put(String(offs[i]||0).padStart(10,'0')+' 00000 n \\n');put('trailer\\n<< /Size '+n+' /Root 1 0 R >>\\nstartxref\\n'+x+'\\n%%EOF');
var a=document.createElement('a'),u=URL.createObjectURL(new Blob(parts,{type:'application/pdf'}));a.href=u;a.download=(O.n||'document').replace(/[\\\\/:*?"<>|]+/g,' ')+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)});
})();</script></body></html>`;
}
async function fxSeal(src){
  const C = await fxCanvases(src, 1800); if (!C.length) throw new Error('empty');
  const p = []; for (const c of C){ const b = await txJpeg(c, 0.84); p.push({w: c.width, h: c.height, d: fxB64(new Uint8Array(await b.arrayBuffer()))}); }
  const pw = fxPw(), salt = rnd(16), iv = rnd(12), x = Date.now() + FXV.exp * 864e5, name = txSafe(src.id === 'scan' ? dsCardName() : src.it.title).slice(0, 80);
  const key = await fxDerive(pw, salt, FX_IT, 'encrypt');
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('fdoc1|' + x)}, key, new TextEncoder().encode(JSON.stringify({v: 1, n: name, m: txSafe(FXV.note).slice(0, 160), at: Date.now(), x, p})));
  const pkg = {fdoc: 1, it: FX_IT, s: fxB64(salt), i: fxB64(iv), x, c: fxB64(new Uint8Array(ct))};
  const html = fxOpenerHTML(pkg, document.documentElement.dir || 'rtl', document.documentElement.lang || 'he');
  const fname = txFileName('🔒 ' + name) + '.html';
  return {pw, x, name, file: new File([html], fname, {type: 'text/html'})};
}
async function fxShare(){
  const o = FXV.out; if (!o) return;
  if (navigator.canShare && navigator.canShare({files: [o.file]})){ try { await navigator.share({files: [o.file], title: o.name, text: t('fx_shareTxt')}); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const r = await fileSave(o.file, o.file.name, 'text/html'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
}
async function fxOpen(file, pw){
  const txt = await file.text(), m = /<script type="application\/json" id="fd">([\s\S]*?)<\/script>/.exec(txt); if (!m) throw new Error('fmt');
  const D = JSON.parse(m[1]); if (!D || D.fdoc !== 1 || !(D.it >= 100000 && D.it <= 2000000) || !(D.x > 0)) throw new Error('fmt');
  if (Date.now() > D.x) { const e = new Error('exp'); e.x = D.x; throw e; }
  const key = await fxDerive(pw, u8(D.s), D.it, 'decrypt');
  let pt; try { pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(D.i), additionalData: new TextEncoder().encode('fdoc1|' + D.x)}, key, u8(D.c)); } catch (e) { throw new Error('pw'); }
  return JSON.parse(new TextDecoder().decode(pt));
}
const fxDate = x => { try { return new Date(x).toLocaleString(locOf(), {dateStyle: 'medium', timeStyle: 'short'}); } catch (e) { return new Date(x).toISOString(); } };
function fxSendHTML(){
  const E = txE, L = fxSources();
  if (FXV.out){ const o = FXV.out;
    return `<div class="ds-found" role="status"><span class="ds-em" aria-hidden="true">🔐</span><div><b>${E(t('fx_ready'))}</b><small>${E(t('fx_readyS', {d: fxDate(o.x)}))}</small></div></div>
      <h4 class="ds-q">🗣️ ${E(t('fx_pwH'))}</h4><p class="tx-pw" dir="ltr" id="fx_pw" tabindex="0" aria-label="${E(t('fx_pwA', {p: o.pw.split('').join(' ')}))}">${E(o.pw)}</p>
      <p class="fine">${E(t('fx_pwSay'))}</p>
      <div class="btnrow"><button type="button" class="gold-btn" id="fx_share">📤 ${E(t(navigator.share ? 'fx_shareB' : 'fx_saveB'))}</button>${navigator.share ? `<button type="button" class="btn" id="fx_save">💾 ${E(t('fx_saveB'))}</button>` : ''}<button type="button" class="mv" id="fx_done">✓ ${E(t('fx_done'))}</button></div>
      <div class="ds-warn" role="note"><span aria-hidden="true">⏳</span><p>${E(t('fx_expNote', {n: t(FXV.exp === 1 ? 'fx_day1' : 'fx_days', {n: FXV.exp})}))}</p></div>`; }
  if (!L.length) return `<p class="fine bk-empty">${E(t('fx_noSrc'))}</p><div class="btnrow"><button type="button" class="gold-btn" id="fx_scan">📷 ${E(t('fx_scanNew'))}</button><button type="button" class="btn" data-txgo="docs">📁 ${E(t('tx_title'))}</button></div>`;
  if (!L.some(s => s.id === FXV.src)) FXV.src = L[0].id;
  const S = L.find(s => s.id === FXV.src);
  return `<div class="field cv-f"><label for="fx_src">${E(t('fx_srcL'))}</label><select id="fx_src">${L.map(s => `<option value="${E(s.id)}"${s.id === FXV.src ? ' selected' : ''}>${E((s.id === 'scan' ? '📷 ' + t('fx_cur') + ': ' : '📁 ') + s.name)} (${E(t('tx_pages', {n: s.n}))})</option>`).join('')}</select></div>
    <h4 class="ds-q">👀 ${E(t('fx_prevH'))}</h4><p class="fine">${E(t('fx_prevP'))}</p><div class="tx-thumbs" id="fx_thumbs" aria-busy="true"></div>
    ${S.sens ? `<div class="ds-warn" role="note"><span aria-hidden="true">🪪</span><p>${E(t('fx_sens'))}</p></div>` : ''}
    <div class="btnrow"><button type="button" class="btn" id="fx_mask">🖍️ ${E(t('fx_maskMore'))}</button></div>
    <label class="prn-ck"><input type="checkbox" id="fx_ok"${FXV.ok ? ' checked' : ''}> ${E(t('fx_okL'))}</label>
    <h4 class="ds-q" id="fx_expH">⏳ ${E(t('fx_expL'))}</h4><div class="ds-chips" role="radiogroup" aria-labelledby="fx_expH">${[1, 3, 7].map(n => `<button type="button" role="radio" class="ds-chip${FXV.exp === n ? ' on' : ''}" aria-checked="${FXV.exp === n}" data-fxexp="${n}">${E(t(n === 1 ? 'fx_day1' : 'fx_days', {n}))}</button>`).join('')}</div>
    <label class="bk-f"><span>${E(t('fx_noteL'))}</span><input type="text" id="fx_note" maxlength="160" dir="auto" value="${E(FXV.note)}" placeholder="${E(t('fx_notePh'))}"></label>
    <div class="btnrow"><button type="button" class="gold-btn" id="fx_go"${FXV.ok && !FXV.busy ? '' : ' disabled'} aria-describedby="fx_goH">🔐 ${E(t(FXV.busy ? 'ds_making' : 'fx_go'))}</button></div><p class="fine" id="fx_goH">${E(t(FXV.ok ? 'fx_goH' : 'fx_needOk'))}</p>`;
}
function fxOpenHTML(){
  const E = txE, R = FXV.recv;
  if (R) return `<div class="ds-found" role="status"><span class="ds-em" aria-hidden="true">📬</span><div><b dir="auto">${E(R.n || t('fx_oTitle'))}</b><small>${E(t('fx_until', {d: fxDate(R.x)}))}</small></div></div>${R.m ? `<p dir="auto">💬 ${E(R.m)}</p>` : ''}
    <div class="tx-view" id="fx_rv"></div><div class="btnrow"><button type="button" class="gold-btn" id="fx_rpdf">📄 ${E(t('fx_savePdf'))}</button><button type="button" class="mv" id="fx_rclose">🗑️ ${E(t('fx_rClose'))}</button></div><p class="fine">${E(t('fx_oDel'))}</p>`;
  return `<p class="fine">${E(t('fx_openIntro'))}</p>
    <div class="btnrow"><label class="btn">📂 ${E(t('fx_pick'))}<input type="file" id="fx_file" accept=".html,.htm,text/html" hidden></label><span class="fine" id="fx_fname" dir="auto">${E(FXV.fname || '')}</span></div>
    <form id="fx_oform" novalidate><label class="bk-f"><span>${E(t('fx_pwL'))}</span><input type="text" id="fx_opw" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" maxlength="20"></label>
    <div class="btnrow"><button type="submit" class="gold-btn" id="fx_ogo"${FXV.busy ? ' disabled' : ''}>🔓 ${E(t('fx_oGo'))}</button></div></form><p class="fine" id="fx_ost" role="status" aria-live="polite"></p>`;
}
function fxRender(root){
  const E = txE;
  root.innerHTML = dsBar('👨‍👩‍👧 ' + t('fx_title')) + `<p class="fine">${E(t('fx_intro'))}</p>
    <div class="ds-chips bk-tabs" role="tablist" aria-label="${E(t('fx_title'))}">${[['send', '📤'], ['open', '📥']].map(([k, ic]) => `<button type="button" role="tab" id="fxt_${k}" class="ds-chip${FXV.tab === k ? ' on' : ''}" aria-selected="${FXV.tab === k}" aria-controls="fx_body" data-fxtab="${k}">${ic} ${E(t('fx_t_' + k))}</button>`).join('')}</div>
    <div id="fx_body" role="tabpanel" aria-labelledby="fxt_${FXV.tab}">${FXV.tab === 'send' ? fxSendHTML() : fxOpenHTML()}</div>
    <details class="ds-det"><summary>ℹ️ ${E(t('fx_howT'))}</summary><p class="fine">${E(t('fx_how'))}</p></details>
    <p class="fine sl-priv">🔒 ${E(t('fx_priv'))}</p>`;
  fxThumbs();
  if (FXV.tab === 'open' && FXV.recv){ const v = $('#fx_rv'); if (v) FXV.recv.p.forEach((p, i) => { const im = new Image(); im.src = 'data:image/jpeg;base64,' + p.d; im.alt = t('ds_side', {n: i + 1}); v.appendChild(im); }); }
}
let FX_TH = 0;
async function fxThumbs(){
  const box = $('#fx_thumbs'); if (!box) return; const my = ++FX_TH, S = fxSources().find(s => s.id === FXV.src); if (!S) return;
  try { const C = await fxCanvases(S, 360); if (my !== FX_TH || !box.isConnected) return; box.innerHTML = ''; C.forEach((c, i) => { c.setAttribute('role', 'img'); c.setAttribute('aria-label', t('ds_side', {n: i + 1})); box.appendChild(c); }); } catch (e) {}
  box.removeAttribute('aria-busy');
}
function fxGo(pre){
  try { if (tab !== 'docscan') activate('docscan'); } catch (e) {}
  FXV.out = null; FXV.tab = 'send'; FXV.ok = false; if (pre) Object.assign(FXV, pre);
  DSX.view = 'famx'; dscRender(); const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'});
}

/* ================= wiring into the scanner ================= */
(function txCss(){ if (document.getElementById('txcss')) return; const st = document.createElement('style'); st.id = 'txcss';
  st.textContent = '.tx-thumbs{display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px;min-height:60px}.tx-thumbs canvas{height:130px;width:auto;flex:none;border-radius:8px;border:1px solid var(--line);background:#fff}'
    + '.tx-pw{font:700 1.45rem/1.3 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em;text-align:center;padding:14px 8px;margin:6px 0;border-radius:14px;border:2px dashed var(--gold-ui,#d4a017);word-break:break-all;user-select:all}'
    + '.tx-view{overflow:auto;display:flex;flex-direction:column;gap:10px}.tx-view canvas,.tx-view img{display:block;width:100%;height:auto;border-radius:8px;background:#fff}'
    + '.tx-ck .rm-acts{flex-wrap:wrap;align-items:center;gap:8px}.tx-ck .prn-ck{margin:0}';
  document.head.appendChild(st); })();
{
  const dsrTx = dscRender;
  dscRender = function(){
    const root = $('#ds_root');
    if (root && DSX.view === 'taxf') return txfRender(root);
    if (root && DSX.view === 'famx') return fxRender(root);
    return dsrTx.apply(this, arguments);
  };
  const cardTx = dsCardRender;
  dsCardRender = function(root){
    const r = cardTx.apply(this, arguments);
    if (DSC && !DSC.cur){ const o = root.querySelector('.ds-out'); if (o && !root.querySelector('#tx_add')) o.insertAdjacentHTML('beforeend', `<button type="button" class="btn" id="tx_add">📁 ${txE(t(DSC.txId && txD().items.some(x => x.id === DSC.txId) ? 'tx_addBack' : 'tx_add'))}</button><button type="button" class="btn" id="fx_send">👨‍👩‍👧 ${txE(t('fx_send'))}</button>`); }
    return r;
  };
  /* the two tools join the scanner's row of tools – added last, after every other part has built the row */
  setTimeout(() => {
    const dsrTx2 = dscRender;
    dscRender = function(){
      const r = dsrTx2.apply(this, arguments), root = $('#ds_root');
      try { const row = root && DSX.view === 'kinds' && root.querySelector('.ds-toolrow'); if (row && !row.querySelector('[data-dstool="taxf"]')) row.insertAdjacentHTML('beforeend', `<button type="button" class="ds-tool" data-dstool="taxf"><span aria-hidden="true">📁</span><b>${txE(t('tx_title'))}</b><small>${txE(t('tx_toolH'))}</small></button><button type="button" class="ds-tool" data-dstool="famx"><span aria-hidden="true">👨‍👩‍👧</span><b>${txE(t('fx_tool'))}</b><small>${txE(t('fx_toolH'))}</small></button>`); } catch (e) {}
      return r;
    };
    try { if (tab === 'docscan' || (document.getElementById('panel-docscan') && !document.getElementById('panel-docscan').hidden)) dscRender(); } catch (e) {}
  }, 0);
}
/* back from the folder or the family screen to the scan they were opened from */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#ds_back'); if (!b || (DSX.view !== 'taxf' && DSX.view !== 'famx')) return;
  const back = DSX.view === 'taxf' ? TXV.back : FXV.back;
  TXV.ed = null; TXV.pend = null; TXV.pre = null; TXV.back = ''; FXV.out = null; FXV.recv = null; FXV.back = ''; FXV.ok = false;
  if (back === 'card' && DSC && DSC.pages.length){ e.stopPropagation(); e.preventDefault(); DSX.view = 'card'; dscRender(); }
}, true);
document.addEventListener('click', async e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#txv_x') || t0.id === 'txv'){ txViewClose(); return; }
  if ((b = t0.closest('[data-txgo]'))){ txGo(b.dataset.txgo); return; }
  if (t0.closest('[data-dstool="taxf"]')){ TXV.back = ''; txGo(); return; }
  if (t0.closest('[data-dstool="famx"]')){ fxGo({back: ''}); return; }
  if (!t0.closest('#ds_root')) return;
  /* from the scanned pages */
  if (t0.closest('#tx_add')){ if (!DSC || !DSC.pages.length) return;
    const own = DSC.txId && txD().items.find(x => x.id === DSC.txId), txt = String(DSC.ocr || '') + ' ' + String(DSC.name || '');
    TXV.pend = {pages: txFromScan(), replace: !!own}; TXV.ed = own ? own.id : 'new'; TXV.back = 'card'; TXV.tab = 'docs';
    TXV.pre = own ? null : {title: txSafe(dsCardName()).slice(0, 80), cat: txGuess(txt) || (DSC.type === 'receipt' ? 'credit' : 'other'), year: txGuessYear(txt) || txYear()};
    if (!own && TXV.pre.year) TXV.y = TXV.pre.year;
    txGo(); const i = $('#txf_title'); if (i) i.focus(); return; }
  if (t0.closest('#fx_send')){ fxGo({src: 'scan', back: 'card'}); return; }
  /* the tax folder */
  if (DSX.view === 'taxf'){
    const d = txD();
    if ((b = t0.closest('[data-txtab]'))){ TXV.tab = b.dataset.txtab; txfRender($('#ds_root')); const n = $('#txt_' + TXV.tab); if (n) n.focus(); return; }
    if (t0.closest('#tx_scan')){ DSX.kind = 'card'; DSX.cardType = 'doc'; DSX.view = 'kinds'; DSX.det = null; dscRender(); const p = $('#ds_root [data-dscam]'); if (p) p.focus(); toast(t('tx_scanHint')); return; }
    if (t0.closest('#tx_rec')){ TXV.ed = 'new'; TXV.pend = null; TXV.pre = {cat: TXV.cat || 'other', year: txYear()}; txfRender($('#ds_root')); const i = $('#txf_title'); if (i) i.focus(); return; }
    if (t0.closest('#txf_cancel')){ TXV.ed = null; TXV.pend = null; TXV.pre = null; txfRender($('#ds_root')); const s = $('#tx_scan'); if (s) s.focus(); return; }
    if ((b = t0.closest('[data-txed]'))){ TXV.ed = b.dataset.txed; TXV.pend = null; TXV.pre = null; txfRender($('#ds_root')); const i = $('#txf_title'); if (i){ i.focus(); i.scrollIntoView({block: 'center'}); } return; }
    if ((b = t0.closest('[data-txview]'))){ const it = d.items.find(x => x.id === b.dataset.txview); if (it) txView(it); return; }
    if ((b = t0.closest('[data-txmask]'))){ const it = d.items.find(x => x.id === b.dataset.txmask); if (it) txToScan(it); return; }
    if ((b = t0.closest('[data-txfam]'))){ fxGo({src: 'tx:' + b.dataset.txfam, back: ''}); return; }
    if ((b = t0.closest('[data-txrem]'))){ const it = d.items.find(x => x.id === b.dataset.txrem); if (it) rmNew({title: (it.todo || t('tx_remT')) + ' – ' + it.title, date: it.todoDate || rmIso(new Date(Date.now() + 14 * 864e5)), cat: 'tax', note: t('tx_remN', {y: it.year})}); return; }
    if ((b = t0.closest('[data-txdel]'))){ const it = d.items.find(x => x.id === b.dataset.txdel); if (!it || !confirm(t('rm_delQ', {t: it.title}))) return;
      d.items = d.items.filter(x => x !== it); await txDelFiles(it); try { if (it.dsi && typeof dsiRemove === 'function') dsiRemove(it.dsi); } catch (er) {}
      if (DSC && DSC.txId === it.id) delete DSC.txId; saveSet(); txfRender($('#ds_root')); toast(t('tx_deleted')); return; }
    if ((b = t0.closest('[data-txckadd]'))){ TXV.tab = 'docs'; TXV.ed = 'new'; TXV.pend = null; TXV.pre = {cat: b.dataset.txckadd, year: txYear(), title: t(txCkL(b.dataset.txckadd))}; txfRender($('#ds_root')); const i = $('#txf_title'); if (i) i.focus(); return; }
    if ((b = t0.closest('[data-txout]'))){ txExport(b.dataset.txout); return; }
    return;
  }
  /* the family screen */
  if (DSX.view === 'famx'){
    if ((b = t0.closest('[data-fxtab]'))){ FXV.tab = b.dataset.fxtab; fxRender($('#ds_root')); const n = $('#fxt_' + FXV.tab); if (n) n.focus(); return; }
    if ((b = t0.closest('[data-fxexp]'))){ FXV.exp = +b.dataset.fxexp; fxRender($('#ds_root')); const n = $(`[data-fxexp="${FXV.exp}"]`); if (n) n.focus(); return; }
    if (t0.closest('#fx_scan')){ DSX.kind = 'card'; DSX.view = 'kinds'; DSX.det = null; dscRender(); toast(t('fx_scanHint')); return; }
    if (t0.closest('#fx_mask')){ const S = fxSources().find(s => s.id === FXV.src); if (!S) return; if (S.id === 'scan'){ DSX.view = 'card'; DSX.red = true; dscRender(); toast(t('tx_maskHint')); } else txToScan(S.it); return; }
    if (t0.closest('#fx_go')){ const S = fxSources().find(s => s.id === FXV.src); if (!S || !FXV.ok || FXV.busy) return;
      if (!(window.crypto && crypto.subtle)){ toast(t('m_nocrypto')); return; }
      FXV.busy = true; fxRender($('#ds_root'));
      try { FXV.out = await fxSeal(S); } catch (er) { toast(t('pdf_fail')); }
      FXV.busy = false; FXV.ok = false; fxRender($('#ds_root')); const p = $('#fx_pw'); if (p) p.focus(); if (FXV.out) fxShare(); return; }
    if (t0.closest('#fx_share')){ fxShare(); return; }
    if (t0.closest('#fx_save')){ const o = FXV.out; if (o){ const r = await fileSave(o.file, o.file.name, 'text/html'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail')); } return; }
    if (t0.closest('#fx_done')){ FXV.out = null; FXV.note = ''; fxRender($('#ds_root')); toast(t('fx_doneT')); return; }
    if (t0.closest('#fx_rclose')){ FXV.recv = null; FXV.file = null; FXV.fname = ''; fxRender($('#ds_root')); return; }
    if (t0.closest('#fx_rpdf')){ const R = FXV.recv; if (!R) return;
      try { const pages = []; for (const p of R.p){ const c = await dsLoad(new Blob([u8(p.d)], {type: 'image/jpeg'})); pages.push(txFitPage({w: c.width, h: c.height, red: [], b: null}, false)); pages[pages.length - 1].items[0].c = c; }
        const r = await fileSave(await dsPdf(pages, 0.9), txFileName(R.n || t('fx_oTitle')) + '.pdf', 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail')); } catch (er) { toast(t('pdf_fail')); }
      return; }
  }
});
document.addEventListener('submit', async e => {
  if (e.target && e.target.id === 'tx_form'){ e.preventDefault(); txSave(); return; }
  if (e.target && e.target.id === 'fx_oform'){ e.preventDefault(); const st = $('#fx_ost'), pw = $('#fx_opw').value;
    if (!FXV.file){ if (st) st.textContent = t('fx_needFile'); return; } if (fxNorm(pw).length < 8){ if (st) st.textContent = t('fx_badPw'); $('#fx_opw').focus(); return; }
    if (st) st.textContent = t('fx_oWait'); FXV.busy = true;
    try { const o = await fxOpen(FXV.file, pw); FXV.recv = o; FXV.busy = false; fxRender($('#ds_root')); toast(t('fx_opened')); }
    catch (er){ FXV.busy = false; const m = String(er && er.message); if (st) st.textContent = m === 'exp' ? t('fx_expired', {d: fxDate(er.x)}) : m === 'fmt' ? t('fx_badFile') : t('fx_badPw'); }
  }
});
document.addEventListener('change', async e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root')) return;
  if (el.id === 'tx_y'){ TXV.y = +el.value; TXV.ed = null; TXV.pend = null; txfRender($('#ds_root')); const n = $('#tx_y'); if (n) n.focus(); return; }
  if (el.id === 'tx_maskck'){ TXV.mask = el.checked; return; }
  if (el.dataset && el.dataset.txna){ const d = txD(), y = txYear(), L = (d.na[y] = (d.na[y] || []).filter(k => k !== el.dataset.txna)); if (el.checked) L.push(el.dataset.txna); if (!L.length) delete d.na[y]; saveSet(); const k = el.dataset.txna; txfRender($('#ds_root')); const n = $(`[data-txna="${k}"]`); if (n) n.focus(); return; }
  if (el.id === 'tx_notes'){ const v = txSafe(el.value).slice(0, 4000); if (v !== el.value) el.value = v; const d = txD(); if (v.trim()) d.notes[txYear()] = v; else delete d.notes[txYear()]; saveSet(); return; }
  if (el.id === 'tx_file' && el.files && el.files.length){ const st = $('#txf_st'); if (st) st.textContent = t('ds_making');
    try { const pages = await txFromFiles(el.files); if (!pages.length) throw new Error('none'); const f0 = el.files[0];
      TXV.pend = {pages}; TXV.ed = 'new'; TXV.pre = {title: txSafe(String(f0.name || '').replace(/\.[a-z0-9]{2,5}$/i, '')).slice(0, 80), cat: txGuess(f0.name) || 'other', year: txYear()}; txfRender($('#ds_root')); const i = $('#txf_title'); if (i) i.focus(); }
    catch (er){ if (st) st.textContent = String(er && er.message) === 'cancel' ? '' : t('tx_fileFail'); }
    el.value = ''; return; }
  if (el.id === 'fx_src'){ FXV.src = el.value; FXV.ok = false; fxRender($('#ds_root')); const n = $('#fx_src'); if (n) n.focus(); return; }
  if (el.id === 'fx_ok'){ FXV.ok = el.checked; const g = $('#fx_go'), h = $('#fx_goH'); if (g) g.disabled = !FXV.ok; if (h) h.textContent = t(FXV.ok ? 'fx_goH' : 'fx_needOk'); return; }
  if (el.id === 'fx_file' && el.files && el.files[0]){ FXV.file = el.files[0]; FXV.fname = el.files[0].name; const s = $('#fx_fname'); if (s) s.textContent = FXV.fname; const p = $('#fx_opw'); if (p) p.focus(); el.value = ''; }
});
let TX_NT = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'tx_notes'){ const y = txYear(), v = el.value; clearTimeout(TX_NT); TX_NT = setTimeout(() => { const d = txD(), s = txSafe(v).slice(0, 4000); if (s.trim()) d.notes[y] = s; else delete d.notes[y]; saveSet(); }, 500); }
  else if (el.id === 'fx_note') FXV.note = el.value;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#txv') && !$('#txv').hidden) txViewClose(); });
/* leaving the family screen forgets the password on screen and any document that was opened */
{ const acTx = activate; activate = function(id){ if (id !== 'docscan'){ FXV.out = null; FXV.recv = null; FXV.file = null; FXV.fname = ''; } const r = acTx.apply(this, arguments);
    try { if (id === 'taxrefund'){ const p = document.getElementById('panel-taxrefund'); if (p && !p.querySelector('#tx_fromRefund')) p.insertAdjacentHTML('beforeend', `<div class="btnrow" id="tx_fromRefund"><button type="button" class="btn" data-txgo="ck">📁 ${txE(t('tx_fromRefund'))}</button></div>`); else if (p){ const b = p.querySelector('#tx_fromRefund button'); if (b) b.textContent = '📁 ' + t('tx_fromRefund'); } } } catch (e) {}
    return r; }; }
try { GS_SYN.docscan += ' תיק מס שנתי החזר מס טופס 106 טופס 867 קבלות תרומה סעיף 46 רואה חשבון שליחה לבן משפחה מסמך מוצפן סיסמה tax folder yearly form 106 867 donation receipts accountant send to family encrypted document password ملف ضريبي سنوي نموذج 106 تبرعات محاسب إرسال لفرد من العائلة مستند مشفر'; } catch (e) {}
