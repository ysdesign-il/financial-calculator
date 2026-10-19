/* ---------- 13.10: the PDF editor in the scanner ----------
   Opens PDFs (and pictures / documents turned into pages), and adds text, drawing, highlighting, shapes, white-out,
   real redaction, ticks, dates, signatures, pictures and QR codes; edits existing text (cover and retype), fills forms,
   and arranges pages. Everything runs on the phone. pdf.js (Apache-2.0) draws pages; pdf-lib (MIT) writes the file,
   keeping the original pages as they were (sharp text stays text) and adding the new things on top. */
const PX_PDFJS = '6.2.108', PX_CDN = 'https://cdn.jsdelivr.net/npm/';
var PXL = {pdfjs: null, res: '', lib: null, zip: null};
const pxE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const pxInClaude = () => typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE;
function pxScript(src){ return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load')); }; document.head.appendChild(s); }); }
async function pxPdfjs(){
  if (PXL.pdfjs) return PXL.pdfjs;
  const local = new URL('lib/pdfjs/', location.href).href, cdn = PX_CDN + 'pdfjs-dist@' + PX_PDFJS + '/';
  const bases = pxInClaude() ? [[cdn + 'legacy/build/', cdn]] : [[local, local], [cdn + 'legacy/build/', cdn]];
  for (const [js, res] of bases){ try { const m = await import(js + 'pdf.min.mjs'); m.GlobalWorkerOptions.workerSrc = js + 'pdf.worker.min.mjs'; PXL.res = res; PXL.pdfjs = m; return m; } catch (e) {} }
  throw new Error('pdfjs');
}
async function pxPdfLib(){
  if (window.PDFLib) return window.PDFLib;
  for (const u of pxInClaude() ? [PX_CDN + 'pdf-lib@1.17.1/dist/pdf-lib.min.js'] : ['lib/pdf-lib.min.js', PX_CDN + 'pdf-lib@1.17.1/dist/pdf-lib.min.js']){ try { await pxScript(u); if (window.PDFLib) return window.PDFLib; } catch (e) {} }
  throw new Error('pdflib');
}
async function pxZip(){
  if (window.JSZip) return window.JSZip;
  for (const u of pxInClaude() ? [PX_CDN + 'jszip@3.10.1/dist/jszip.min.js'] : ['lib/jszip.min.js', PX_CDN + 'jszip@3.10.1/dist/jszip.min.js']){ try { await pxScript(u); if (window.JSZip) return window.JSZip; } catch (e) {} }
  throw new Error('jszip');
}
/* open a PDF with pdf.js (asks for the password when there is one) */
async function pxOpenPdf(bytes, name){
  const L = await pxPdfjs(), R = PXL.res; let pw = undefined;
  for (let tries = 0; tries < 4; tries++){
    try { return await L.getDocument({data: bytes.slice(), password: pw, cMapUrl: R + 'cmaps/', cMapPacked: true, standardFontDataUrl: R + 'standard_fonts/', wasmUrl: R + 'wasm/', iccUrl: R + 'iccs/', isEvalSupported: false, enableXfa: false}).promise; }
    catch (e){ if (e && e.name === 'PasswordException'){ pw = prompt(t(tries ? 'px_pwBad' : 'px_pw', {n: name || 'PDF'})); if (pw == null) throw new Error('cancel'); continue; } throw e; }
  }
  throw new Error('pw');
}

/* ================= state ================= */
var PX = null;   // {docs: [{pdf, bytes, name, forms}], pages: [...], cur, tool, sel, zoom, hist, fut, name}
const PX_ST = {col: '#1d3fbf', fs: 14, font: 'sans', b: false, it: false, al: 'start', bg: '', lw: 2, op: 1, fill: '', hlCol: '#ffe14d'};
const PX_FONTS = {sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,"Noto Sans Hebrew","Noto Sans Arabic",sans-serif', serif: 'Georgia,"Times New Roman","David","Frank Ruehl CLM",serif', mono: '"Courier New",Consolas,monospace', hand: '"Segoe Print","Comic Sans MS","Chalkboard SE","Noteworthy",cursive'};
const PX_COLS = ['#111111', '#1d3fbf', '#c62828', '#2e7d32', '#ef6c00', '#6a1b9a', '#ffffff', '#ffe14d'];
const PX_TOOLS = [['select', '✋'], ['text', 'T'], ['edit', '✎'], ['pen', '✏️'], ['hl', '🖍️'], ['rect', '▭'], ['ell', '◯'], ['line', '╱'], ['arrow', '➚'], ['white', '⬜'], ['redact', '⬛'], ['check', '✓'], ['x', '✗'], ['dot', '●'], ['date', '📅']];
let PX_ID = 1;
function pxNew(){ return {docs: [], pages: [], cur: 0, tool: 'select', sel: null, zoom: 1, hist: [], fut: [], name: '', st: Object.assign({}, PX_ST), form: {}, flatForm: false}; }
const pxPage = () => PX && PX.pages[PX.cur];
const pxR = p => ((p.rot0 || 0) + (p.rot || 0)) % 360;
const pxW = p => pxR(p) % 180 ? p.h0 : p.w0, pxH = p => pxR(p) % 180 ? p.w0 : p.h0;
const pxSelObj = () => { const p = pxPage(); return p && PX.sel != null ? p.objs.find(o => o.id === PX.sel) : null; };
/* undo / redo: snapshots of the pages and their objects */
const pxClone = o => Object.assign({}, o, o.pts ? {pts: o.pts.map(a => a.slice())} : {});
function pxSnap(){ if (!PX) return; PX.hist.push({pages: PX.pages.map(p => Object.assign({}, p, {objs: p.objs.map(pxClone)})), cur: PX.cur}); if (PX.hist.length > 80) PX.hist.shift(); PX.fut = []; PX.dirty = true; }
function pxUndo(redo){ const A = redo ? PX.fut : PX.hist, B = redo ? PX.hist : PX.fut; if (!A.length) return; B.push({pages: PX.pages.map(p => Object.assign({}, p, {objs: p.objs.map(pxClone)})), cur: PX.cur}); const s = A.pop(); PX.pages = s.pages; PX.cur = Math.min(s.cur, PX.pages.length - 1); PX.sel = null; pxRender($('#ds_root')); pxSay(t(redo ? 'px_redone' : 'px_undone')); }

/* ================= adding files ================= */
async function pxAddFiles(files, at){
  if (!PX) PX = pxNew();
  const add = [];
  for (const f of files){
    const nm = f.name || 'file';
    try {
      if (/pdf/.test(f.type) || /\.pdf$/i.test(nm)){
        const bytes = new Uint8Array(await f.arrayBuffer()), pdf = await pxOpenPdf(bytes, nm), d = PX.docs.length;
        PX.docs.push({pdf, bytes, name: nm});
        for (let i = 0; i < pdf.numPages; i++){ const pg = await pdf.getPage(i + 1), v = pg.view; add.push({id: PX_ID++, d, i, w0: v[2] - v[0], h0: v[3] - v[1], vx: v[0], vy: v[1], rot0: pg.rotate || 0, rot: 0, objs: []}); }
        try { const fo = await pdf.getFieldObjects(); if (fo && Object.keys(fo).length) PX.docs[d].fields = fo; } catch (e) {}
      } else if (/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(nm)){
        const c = await dsLoad(f); add.push(pxImgPage(c, /png|gif|webp/.test(f.type)));
      } else if (typeof cvtToCanvases === 'function'){
        const L = await cvtToCanvases(f); L.forEach(c => add.push(pxImgPage(c, false)));
      }
      if (!PX.name) PX.name = nm.replace(/\.[a-z0-9]+$/i, '');
    } catch (e){ if (e && e.message === 'cancel') continue; toast(t('px_openFail', {n: nm})); }
  }
  if (!add.length) return 0;
  const pos = at == null ? PX.pages.length : at;
  pxSnap(); PX.pages.splice(pos, 0, ...add); PX.cur = pos;
  return add.length;
}
/* a picture as a page: the longer side 842 pt (A4 height), keeping its shape */
function pxImgPage(c, alpha){ const k = 842 / Math.max(c.width, c.height); return {id: PX_ID++, d: -1, img: c, alpha, w0: c.width * k, h0: c.height * k, vx: 0, vy: 0, rot0: 0, rot: 0, objs: []}; }
function pxBlank(w, h){ return {id: PX_ID++, d: -1, blank: true, w0: w || 595.28, h0: h || 841.89, vx: 0, vy: 0, rot0: 0, rot: 0, objs: []}; }
/* the scanned cards / pages of the scanner, as editable pages (each keeps its full resolution) */
function pxFromScan(){
  if (!DSC || !DSC.pages.length) return;
  PX = pxNew(); PX.name = dsCardName();
  dsPlan().forEach(pg => { const P = pxBlank(); pg.items.forEach(it => P.objs.push({id: PX_ID++, t: 'img', c: it.c, x: it.x, y: it.y, w: it.w, h: it.h, op: 1, base: true})); PX.pages.push(P); });
  PX.hist = []; DSX.view = 'pdf'; dscRender();
}

/* ================= drawing ================= */
const pxRtl = s => /^[^A-Za-zÀ-ɏ]*[֐-ࣿ]/.test(String(s || ''));
const PXM = document.createElement('canvas').getContext('2d');
function pxFont(o){ return (o.it ? 'italic ' : '') + (o.b ? '700 ' : '400 ') + o.fs + 'px ' + (PX_FONTS[o.font] || PX_FONTS.sans); }
function pxLines(o){
  PXM.font = pxFont(o); const out = [];
  String(o.txt || '').split('\n').forEach(par => { if (!o.w){ out.push(par); return; } let line = ''; par.split(/(\s+)/).forEach(wd => { const tr = line + wd; if (PXM.measureText(tr.trim()).width > o.w && line.trim()){ out.push(line.trim()); line = wd.trimStart(); } else line = tr; }); out.push(line.trim()); });
  return out;
}
function pxBox(o){
  if (o.t === 'text'){ const L = pxLines(o); PXM.font = pxFont(o); const w = o.w || Math.max(o.fs * 1.2, ...L.map(l => PXM.measureText(l || ' ').width)); return {x: o.x, y: o.y, w: w + o.fs * 0.3, h: Math.max(1, L.length) * o.fs * 1.28 + o.fs * 0.2}; }
  if (o.t === 'pen'){ let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; o.pts.forEach(([x, y]) => { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }); const m = o.lw / 2; return {x: a - m, y: b - m, w: c - a + o.lw, h: d - b + o.lw}; }
  if (o.t === 'line' || o.t === 'arrow'){ const m = o.lw * 2 + 3; return {x: Math.min(o.x1, o.x2) - m, y: Math.min(o.y1, o.y2) - m, w: Math.abs(o.x2 - o.x1) + m * 2, h: Math.abs(o.y2 - o.y1) + m * 2}; }
  if (o.t === 'mark') return {x: o.x, y: o.y, w: o.s, h: o.s};
  return {x: Math.min(o.x, o.x + o.w), y: Math.min(o.y, o.y + o.h), w: Math.abs(o.w), h: Math.abs(o.h)};
}
/* paint one object; the context is in page points */
function pxPaint(x, o, preview){
  x.save(); x.globalAlpha = o.op == null ? 1 : o.op;
  if (o.t === 'text'){
    const B = pxBox(o), L = pxLines(o), rtl = pxRtl(o.txt);
    if (o.bg){ x.fillStyle = o.bg; x.fillRect(B.x, B.y, B.w, B.h); }
    x.font = pxFont(o); x.fillStyle = o.col; x.textBaseline = 'top'; try { x.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
    const al = o.al || 'start', pad = o.fs * 0.15;
    L.forEach((l, i) => { const yy = o.y + pad + i * o.fs * 1.28; let xx;
      if (al === 'center'){ x.textAlign = 'center'; xx = B.x + B.w / 2; } else if ((al === 'start') !== rtl){ x.textAlign = 'left'; xx = B.x + pad; } else { x.textAlign = 'right'; xx = B.x + B.w - pad; }
      x.fillText(l, xx, yy); if (o.u){ const tw = x.measureText(l).width, ux = x.textAlign === 'left' ? xx : x.textAlign === 'right' ? xx - tw : xx - tw / 2; x.fillRect(ux, yy + o.fs * 1.08, tw, Math.max(0.6, o.fs / 16)); } });
    if (preview && !o.txt){ x.globalAlpha = 0.5; x.fillStyle = o.col; x.fillRect(B.x + pad, B.y + pad, 1, o.fs); }
  } else if (o.t === 'pen'){
    x.strokeStyle = o.col; x.lineWidth = o.lw; x.lineCap = o.hl ? 'butt' : 'round'; x.lineJoin = 'round'; if (o.hl) x.globalCompositeOperation = 'multiply';
    const P = o.pts; x.beginPath(); x.moveTo(P[0][0], P[0][1]);
    if (P.length === 1) x.lineTo(P[0][0] + 0.01, P[0][1]);
    for (let i = 1; i < P.length - 1; i++){ const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; x.quadraticCurveTo(P[i][0], P[i][1], mx, my); }
    if (P.length > 1) x.lineTo(P[P.length - 1][0], P[P.length - 1][1]); x.stroke();
  } else if (o.t === 'rect' || o.t === 'ell'){
    const B = pxBox(o); x.beginPath(); if (o.t === 'rect') x.rect(B.x, B.y, B.w, B.h); else x.ellipse(B.x + B.w / 2, B.y + B.h / 2, B.w / 2, B.h / 2, 0, 0, 7);
    if (o.fill){ x.fillStyle = o.fill; x.fill(); } if (o.lw > 0){ x.strokeStyle = o.col; x.lineWidth = o.lw; x.stroke(); }
  } else if (o.t === 'white' || o.t === 'redact'){
    const B = pxBox(o); x.globalAlpha = 1; x.fillStyle = o.t === 'redact' ? '#000' : (o.fill || '#fff'); x.fillRect(B.x, B.y, B.w, B.h);
    if (preview && o.t === 'white'){ x.setLineDash([3, 3]); x.strokeStyle = 'rgba(30,60,160,.45)'; x.lineWidth = 0.8; x.strokeRect(B.x, B.y, B.w, B.h); }
  } else if (o.t === 'line' || o.t === 'arrow'){
    x.strokeStyle = o.col; x.fillStyle = o.col; x.lineWidth = o.lw; x.lineCap = 'round'; x.beginPath(); x.moveTo(o.x1, o.y1); x.lineTo(o.x2, o.y2); x.stroke();
    if (o.t === 'arrow'){ const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1), L = Math.max(8, o.lw * 4); x.beginPath(); x.moveTo(o.x2, o.y2); x.lineTo(o.x2 - L * Math.cos(a - 0.45), o.y2 - L * Math.sin(a - 0.45)); x.lineTo(o.x2 - L * Math.cos(a + 0.45), o.y2 - L * Math.sin(a + 0.45)); x.closePath(); x.fill(); }
  } else if (o.t === 'mark'){
    const s = o.s; x.strokeStyle = o.col; x.fillStyle = o.col; x.lineWidth = Math.max(1.2, s / 7); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (o.k === 'check'){ x.moveTo(o.x + s * .12, o.y + s * .55); x.lineTo(o.x + s * .4, o.y + s * .85); x.lineTo(o.x + s * .9, o.y + s * .15); x.stroke(); }
    else if (o.k === 'x'){ x.moveTo(o.x + s * .15, o.y + s * .15); x.lineTo(o.x + s * .85, o.y + s * .85); x.moveTo(o.x + s * .85, o.y + s * .15); x.lineTo(o.x + s * .15, o.y + s * .85); x.stroke(); }
    else { x.arc(o.x + s / 2, o.y + s / 2, s * .3, 0, 7); x.fill(); }
  } else if (o.t === 'img'){ const B = pxBox(o); x.drawImage(o.c, B.x, B.y, B.w, B.h); }
  x.restore();
}
/* the page picture itself (the PDF page or the photo), at a given scale (pixels per point) */
async function pxPageCanvas(p, k, forPrint){
  const W = Math.max(1, Math.round(pxW(p) * k)), H = Math.max(1, Math.round(pxH(p) * k)), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  if (p.d >= 0){
    const D = PX.docs[p.d], pg = await D.pdf.getPage(p.i + 1), vp = pg.getViewport({scale: k, rotation: pxR(p)});
    const t0 = pg.render({canvasContext: x, viewport: vp, annotationMode: (PXL.pdfjs.AnnotationMode || {}).ENABLE_STORAGE || 3, intent: forPrint ? 'print' : 'display'}); PX.task = t0; await t0.promise;
  } else if (p.img){ x.save(); x.translate(W / 2, H / 2); x.rotate(pxR(p) * Math.PI / 180); const iw = p.w0 * k, ih = p.h0 * k; x.drawImage(p.img, -iw / 2, -ih / 2, iw, ih); x.restore(); }
  return c;
}
/* page + everything on it, for pictures, printing and "flat" files */
async function pxComposite(p, k){ const c = await pxPageCanvas(p, k, true), x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); p.objs.forEach(o => pxPaint(x, o, false)); return c; }

/* ================= the screen ================= */
function pxRender(root){
  if (!root) return;
  const E = pxE;
  if (!PX || !PX.pages.length){
    root.innerHTML = dsBar('📝 ' + t('px_title')) + `<p class="fine">${E(t('px_intro'))}</p>
      <div class="btnrow ds-go"><button type="button" class="gold-btn" id="px_open">📂 ${E(t('px_open'))}</button><button type="button" class="btn" id="px_blankDoc">📄 ${E(t('px_blankDoc'))}</button>${DSC && DSC.pages.length ? `<button type="button" class="btn" id="px_scan">🪪 ${E(t('px_fromScan'))}</button>` : ''}
      <input type="file" id="px_file" accept="application/pdf,image/*,.txt,.md,.csv,.html,.htm,.json,.docx,.xlsx,.pptx,.odt,.rtf" multiple hidden></div>
      <ul class="px-feat">${['px_f1', 'px_f2', 'px_f3', 'px_f4', 'px_f5', 'px_f6'].map(k => `<li>${E(t(k))}</li>`).join('')}</ul>
      <div class="sl-st" id="px_st" aria-live="polite"></div>
      <p class="fine sl-priv">🔒 ${E(t('px_priv'))}</p>`;
    return;
  }
  const p = pxPage(), so = pxSelObj(), tool = PX.tool, nf = PX.docs.reduce((a, d) => a + (d.fields ? Object.keys(d.fields).length : 0), 0);
  root.innerHTML = dsBar('📝 ' + (PX.name || t('px_title'))) + `
    <div class="px-tools" role="toolbar" aria-label="${E(t('px_toolbar'))}">${PX_TOOLS.map(([k, ic]) => `<button type="button" class="px-tb px-tl${tool === k ? ' on' : ''}" data-pxt="${k}" aria-pressed="${tool === k}" title="${E(t('px_t_' + k))}"><span aria-hidden="true">${ic}</span><small>${E(t('px_s_' + k))}</small></button>`).join('')}
      <button type="button" class="px-tb px-tl" id="px_sign" title="${E(t('px_t_sign'))}"><span aria-hidden="true">✍️</span><small>${E(t('px_s_sign'))}</small></button><button type="button" class="px-tb px-tl" id="px_img" title="${E(t('px_t_img'))}"><span aria-hidden="true">🖼️</span><small>${E(t('px_s_img'))}</small></button><button type="button" class="px-tb px-tl" id="px_qr" title="${E(t('px_t_qr'))}"><span aria-hidden="true">▦</span><small>QR</small></button>
      <input type="file" id="px_imgF" accept="image/*" hidden></div>
    <div class="px-sub"><span class="px-hint" id="px_hint">${E(t('px_h_' + tool))}</span><span class="px-gap"></span>
      <button type="button" class="px-tb s" id="px_undo" aria-label="${E(t('px_undo'))}" title="${E(t('px_undo'))}"${PX.hist.length ? '' : ' disabled'}>↶</button><button type="button" class="px-tb s" id="px_redo" aria-label="${E(t('px_redo'))}" title="${E(t('px_redo'))}"${PX.fut.length ? '' : ' disabled'}>↷</button>
      <button type="button" class="px-tb s" id="px_zo" aria-label="${E(t('px_zoomOut'))}" title="${E(t('px_zoomOut'))}">−</button><b class="px-z">${Math.round(PX.zoom * 100)}%</b><button type="button" class="px-tb s" id="px_zi" aria-label="${E(t('px_zoomIn'))}" title="${E(t('px_zoomIn'))}">+</button></div>
    <div class="px-props" id="px_props">${pxPropsHTML(so, tool)}</div>
    <div class="px-stage" id="px_stage" tabindex="0" aria-label="${E(t('px_stageA', {n: PX.cur + 1, m: PX.pages.length}))}"><div class="px-pagew" id="px_pagew"><canvas id="px_pg" aria-hidden="true"></canvas><canvas id="px_ov" aria-hidden="true"></canvas></div></div>
    <div class="px-pnav"><button type="button" class="mv" id="px_prev"${PX.cur ? '' : ' disabled'}>${document.documentElement.dir === 'rtl' ? '›' : '‹'} ${E(t('px_prevP'))}</button><b>${E(t('px_pageOf', {n: PX.cur + 1, m: PX.pages.length}))}</b><button type="button" class="mv" id="px_next"${PX.cur < PX.pages.length - 1 ? '' : ' disabled'}>${E(t('px_nextP'))} ${document.documentElement.dir === 'rtl' ? '‹' : '›'}</button></div>
    <div class="px-thumbs" id="px_thumbs" role="listbox" aria-label="${E(t('px_pages'))}">${PX.pages.map((q, i) => `<button type="button" role="option" class="px-th${i === PX.cur ? ' on' : ''}" aria-selected="${i === PX.cur}" data-pxp="${i}" aria-label="${E(t('ds_side', {n: i + 1}))}"><canvas data-pxth="${i}"></canvas><span>${i + 1}</span></button>`).join('')}</div>
    <div class="btnrow px-pops"><button type="button" class="mv" id="px_rotL" title="${E(t('px_rotL'))}">⟲</button><button type="button" class="mv" id="px_rotR" title="${E(t('px_rotR'))}">⟳</button><button type="button" class="mv" id="px_mvL" title="${E(t('px_mvB'))}">⇤</button><button type="button" class="mv" id="px_mvR" title="${E(t('px_mvF'))}">⇥</button><button type="button" class="mv" id="px_dup">⧉ ${E(t('px_dup'))}</button><button type="button" class="mv" id="px_addB">＋ ${E(t('px_addBlank'))}</button><button type="button" class="mv" id="px_addF">📎 ${E(t('px_addFile'))}</button><button type="button" class="mv" id="px_delP">🗑️ ${E(t('px_delPage'))}</button>
      <input type="file" id="px_addFF" accept="application/pdf,image/*,.txt,.md,.csv,.html,.htm,.json,.docx,.xlsx,.pptx,.odt,.rtf" multiple hidden></div>
    ${nf ? `<details class="ds-det px-form"${PX.formOpen ? ' open' : ''}><summary>📋 ${E(t('px_form', {n: nf}))}</summary><div id="px_formB">${pxFormHTML()}</div></details>` : ''}
    <details class="ds-det px-list"><summary>☰ ${E(t('px_objs', {n: p.objs.length}))}</summary><div class="px-ol">${p.objs.length ? p.objs.map(o => `<button type="button" class="px-oi${o.id === PX.sel ? ' on' : ''}" data-pxo="${o.id}">${E(pxObjName(o))}</button>`).join('') : `<p class="fine">${E(t('px_noObjs'))}</p>`}</div><p class="fine">${E(t('px_kbd'))}</p></details>
    <div class="px-save"><div class="field cv-f"><label for="px_name">${E(t('px_fname'))}</label><div class="control"><input id="px_name" type="text" maxlength="80" dir="auto" value="${E(PX.name)}"></div></div>
      <label class="prn-ck"><input type="checkbox" id="px_flat"${PX.flat ? ' checked' : ''}> ${E(t('px_flat'))}</label><p class="fine">${E(t('px_flatH'))}</p>
      <div class="btnrow ds-out"><button type="button" class="gold-btn" id="px_save">💾 ${E(t('px_save'))}</button>${navigator.share ? `<button type="button" class="btn" id="px_share">📤 ${E(t('ds_share'))}</button>` : ''}<button type="button" class="btn" id="px_png">🖼️ ${E(t('px_asImg'))}</button><button type="button" class="btn" id="px_print">🖨️ ${E(t('prn_btn'))}</button></div>
      <div class="btnrow"><button type="button" class="mv" id="px_close">✕ ${E(t('px_close'))}</button></div></div>
    <div class="sl-st" id="px_st" aria-live="polite"></div>
    <p class="fine sl-priv">🔒 ${E(t('px_priv'))}</p>`;
  pxDraw(true); pxThumbs();
}
function pxObjName(o){ const n = t('px_o_' + (o.t === 'mark' ? o.k : o.t === 'pen' && o.hl ? 'hl' : o.base ? 'scan' : o.sig ? 'sign' : o.qr ? 'qr' : o.t)); return o.t === 'text' ? n + ': ' + (String(o.txt || '').slice(0, 30) || '…') : n; }
function pxPropsHTML(o, tool){
  const E = pxE, st = PX.st, k = o ? (o.t === 'pen' && o.hl ? 'hl' : o.t) : tool, v = o || st;
  const cols = cur => `<div class="px-cols" role="radiogroup" aria-label="${E(t('px_color'))}">${PX_COLS.map(c => `<button type="button" role="radio" class="px-c${c === cur ? ' on' : ''}" aria-checked="${c === cur}" data-pxc="${c}" style="background:${c}" aria-label="${E(c)}"></button>`).join('')}<input type="color" id="px_ccol" value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#000000'}" aria-label="${E(t('px_colorMore'))}"></div>`;
  const acts = o ? `<div class="btnrow px-oact"><button type="button" class="mv" id="px_odup">⧉ ${E(t('px_dup'))}</button><button type="button" class="mv" id="px_ofront">⤒ ${E(t('px_front'))}</button><button type="button" class="mv" id="px_oback">⤓ ${E(t('px_back'))}</button><button type="button" class="mv px-del" id="px_odel">🗑️ ${E(t('px_del'))}</button></div>` : '';
  if (k === 'text' || k === 'date' || k === 'edit') return `${o && o.t === 'text' ? `<div class="field px-ta"><label for="px_txt">${E(t('px_text'))}</label><textarea id="px_txt" rows="2" dir="auto">${E(o.txt)}</textarea></div>` : ''}
    <div class="px-row"><button type="button" class="px-tb s" data-pxfs="-1" aria-label="${E(t('px_smaller'))}">A−</button><b class="px-z">${Math.round(v.fs || st.fs)}pt</b><button type="button" class="px-tb s" data-pxfs="1" aria-label="${E(t('px_bigger'))}">A+</button>
      <select id="px_font" aria-label="${E(t('px_font'))}">${Object.keys(PX_FONTS).map(f => `<option value="${f}"${(v.font || 'sans') === f ? ' selected' : ''}>${E(t('px_fn_' + f))}</option>`).join('')}</select>
      <button type="button" class="px-tb s${v.b ? ' on' : ''}" id="px_b" aria-pressed="${!!v.b}" aria-label="${E(t('px_bold'))}"><b>B</b></button><button type="button" class="px-tb s${v.it ? ' on' : ''}" id="px_i" aria-pressed="${!!v.it}" aria-label="${E(t('px_ital'))}"><i>I</i></button><button type="button" class="px-tb s${v.u ? ' on' : ''}" id="px_u" aria-pressed="${!!v.u}" aria-label="${E(t('px_under'))}"><u>U</u></button>
      ${['start', 'center', 'end'].map(a => `<button type="button" class="px-tb s${(v.al || 'start') === a ? ' on' : ''}" data-pxal="${a}" aria-pressed="${(v.al || 'start') === a}" aria-label="${E(t('px_al_' + a))}">${{start: '⇤', center: '↔', end: '⇥'}[a]}</button>`).join('')}
      <select id="px_bg" aria-label="${E(t('px_bgc'))}">${[['', 'px_bg0'], ['#ffffff', 'px_bgW'], ['#fff59d', 'px_bgY']].map(([c, l]) => `<option value="${c}"${(v.bg || '') === c ? ' selected' : ''}>${E(t(l))}</option>`).join('')}</select></div>${cols(v.col || st.col)}${acts}`;
  if (k === 'pen' || k === 'hl' || k === 'rect' || k === 'ell' || k === 'line' || k === 'arrow') return `<div class="px-row"><label>${E(t('px_lw'))} <input type="range" id="px_lw" min="${k === 'hl' ? 4 : 0.5}" max="${k === 'hl' ? 30 : 12}" step="0.5" value="${v.lw || (k === 'hl' ? 12 : st.lw)}"></label>${k !== 'hl' ? `<label>${E(t('px_op'))} <input type="range" id="px_op" min="0.1" max="1" step="0.05" value="${v.op == null ? 1 : v.op}"></label>` : ''}${k === 'rect' || k === 'ell' ? `<label class="prn-ck"><input type="checkbox" id="px_fill"${v.fill ? ' checked' : ''}> ${E(t('px_fillC'))}</label>` : ''}</div>${cols(k === 'hl' ? (v.col || st.hlCol) : (v.col || st.col))}${acts}`;
  if (k === 'mark' || k === 'check' || k === 'x' || k === 'dot') return `<div class="px-row"><button type="button" class="px-tb s" data-pxms="-1" aria-label="${E(t('px_smaller'))}">−</button><b class="px-z">${Math.round(v.s || 14)}pt</b><button type="button" class="px-tb s" data-pxms="1" aria-label="${E(t('px_bigger'))}">+</button></div>${cols(v.col || st.col)}${acts}`;
  if (k === 'img') return `<div class="px-row"><label>${E(t('px_op'))} <input type="range" id="px_op" min="0.1" max="1" step="0.05" value="${v.op == null ? 1 : v.op}"></label><button type="button" class="mv" id="px_ratio">${E(t('px_ratio'))}</button></div>${acts}`;
  if (k === 'white') return `<p class="fine">${E(t('px_whiteH'))}</p>${o ? `<div class="px-row"><label>${E(t('px_fillC'))} <input type="color" id="px_wcol" value="${o.fill || '#ffffff'}"></label></div>` : ''}${acts}`;
  if (k === 'redact') return `<p class="fine">⚠️ ${E(t('px_redactH'))}</p>${acts}`;
  return `<p class="fine">${E(t('px_selH'))}</p>`;
}
function pxFormHTML(){
  const E = pxE, rows = [];
  PX.docs.forEach((d, di) => { if (!d.fields) return; Object.entries(d.fields).forEach(([name, arr]) => { const f = (arr || []).find(x => x && x.type) || {}; if (!f.type || f.type === 'button' || f.type === 'signature') return;
    const id = 'pxff_' + di + '_' + rows.length, key = di + '|' + name, cur = PX.form[key] != null ? PX.form[key] : (f.value != null ? f.value : '');
    const lab = `<label for="${id}">${E(f.name || name)}</label>`;
    if (f.type === 'checkbox') rows.push(`<label class="prn-ck"><input type="checkbox" id="${id}" data-pxff="${E(key)}"${cur && cur !== 'Off' ? ' checked' : ''}> ${E(f.name || name)}</label>`);
    else if (f.type === 'radiobutton'){ const opts = (arr || []).filter(x => x.type).map(x => x.buttonValue).filter(Boolean); rows.push(`<div class="field cv-f">${lab}<select id="${id}" data-pxff="${E(key)}"><option value="">—</option>${opts.map(o => `<option${o === cur ? ' selected' : ''}>${E(o)}</option>`).join('')}</select></div>`); }
    else if (f.type === 'combobox' || f.type === 'listbox'){ const opts = (f.items || []).map(x => x.exportValue != null ? [x.exportValue, x.displayValue] : [x, x]); rows.push(`<div class="field cv-f">${lab}<select id="${id}" data-pxff="${E(key)}"><option value="">—</option>${opts.map(([vv, l]) => `<option value="${E(vv)}"${vv === cur ? ' selected' : ''}>${E(l)}</option>`).join('')}</select></div>`); }
    else rows.push(`<div class="field">${lab}<div class="control"><input id="${id}" data-pxff="${E(key)}" type="text" dir="auto" value="${E(cur)}"></div></div>`); }); });
  return rows.join('') + `<label class="prn-ck"><input type="checkbox" id="px_flatForm"${PX.flatForm ? ' checked' : ''}> ${E(t('px_flatForm'))}</label><p class="fine">${E(t('px_formH'))}</p>`;
}
/* apply form values to pdf.js' storage so the page shows them and the saved file keeps them */
function pxFormApply(key, val){
  PX.form[key] = val; const [di, name] = [+key.split('|')[0], key.slice(key.indexOf('|') + 1)], D = PX.docs[di]; if (!D || !D.fields) return;
  (D.fields[name] || []).forEach(f => { if (!f.id || !f.type) return; const st = D.pdf.annotationStorage;
    if (f.type === 'checkbox') st.setValue(f.id, {value: !!val});
    else if (f.type === 'radiobutton') st.setValue(f.id, {value: f.buttonValue === val});
    else st.setValue(f.id, {value: String(val)}); });
  PX.cache = null; pxDraw(true);
}
let PX_DRAW = 0;
async function pxDraw(full){
  const p = pxPage(), stg = $('#px_stage'), pc = $('#px_pg'), ov = $('#px_ov'), pw = $('#px_pagew'); if (!p || !stg || !pc) return;
  const avail = Math.max(200, stg.clientWidth - 2), cssW = avail * PX.zoom, k = cssW / pxW(p), cssH = pxH(p) * k, dpr = Math.min(3, window.devicePixelRatio || 1);
  pw.style.width = cssW + 'px'; pw.style.height = cssH + 'px';
  [pc, ov].forEach(c => { c.style.width = cssW + 'px'; c.style.height = cssH + 'px'; });
  const key = p.id + ':' + pxR(p) + ':' + Math.round(cssW) + ':' + dpr;
  if (full || !PX.cache || PX.cache.key !== key){
    const my = ++PX_DRAW;
    try { if (PX.task && PX.task.cancel) PX.task.cancel(); } catch (e) {}
    try { const c = await pxPageCanvas(p, k * dpr); if (my !== PX_DRAW) return; pc.width = c.width; pc.height = c.height; pc.getContext('2d').drawImage(c, 0, 0); PX.cache = {key}; }
    catch (e){ if (e && e.name === 'RenderingCancelledException') return; }
  }
  ov.width = Math.round(cssW * dpr); ov.height = Math.round(cssH * dpr);
  const x = ov.getContext('2d'); x.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  p.objs.forEach(o => pxPaint(x, o, true)); if (PX.draft) pxPaint(x, PX.draft, true);
  const so = pxSelObj();
  if (so){ const B = pxBox(so), m = 3 / k; x.save(); x.setLineDash([4 / k, 3 / k]); x.strokeStyle = '#1F4FB8'; x.lineWidth = 1.4 / k; x.strokeRect(B.x - m, B.y - m, B.w + m * 2, B.h + m * 2); x.setLineDash([]);
    const hs = 9 / k; x.fillStyle = '#fff'; x.strokeStyle = '#1F4FB8'; x.lineWidth = 1.6 / k; x.beginPath(); x.rect(B.x + B.w + m - hs / 2, B.y + B.h + m - hs / 2, hs, hs); x.fill(); x.stroke(); x.restore(); }
  PX.k = k;
}
async function pxThumbs(){
  const L = $$('#px_thumbs canvas[data-pxth]');
  for (const c of L){ const i = +c.dataset.pxth, p = PX.pages[i]; if (!p) continue; try { const k = 90 / Math.max(pxW(p), pxH(p)); const s = await pxComposite(p, k); if (!c.isConnected) return; c.width = s.width; c.height = s.height; c.getContext('2d').drawImage(s, 0, 0); } catch (e) {} }
  const on = $('#px_thumbs .px-th.on'); if (on) try { on.scrollIntoView({block: 'nearest', inline: 'center'}); } catch (e) {}
}
const pxSay = m => { const s = $('#px_st'); if (s) s.textContent = m; };
function pxRefresh(){ const so = pxSelObj(), pr = $('#px_props'); if (pr) pr.innerHTML = pxPropsHTML(so, PX.tool); const u = $('#px_undo'), r = $('#px_redo'); if (u) u.disabled = !PX.hist.length; if (r) r.disabled = !PX.fut.length;
  const ol = $('.px-ol'), p = pxPage(); if (ol && p){ ol.innerHTML = p.objs.length ? p.objs.map(o => `<button type="button" class="px-oi${o.id === PX.sel ? ' on' : ''}" data-pxo="${o.id}">${pxE(pxObjName(o))}</button>`).join('') : `<p class="fine">${pxE(t('px_noObjs'))}</p>`; const sm = $('.px-list summary'); if (sm) sm.textContent = '☰ ' + t('px_objs', {n: p.objs.length}); }
  pxDraw(false); }

/* ================= pointer work on the page ================= */
function pxPt(e){ const r = $('#px_ov').getBoundingClientRect(), p = pxPage(); return [(e.clientX - r.left) / r.width * pxW(p), (e.clientY - r.top) / r.height * pxH(p)]; }
function pxHit(p, x, y){
  const tol = 6 / (PX.k || 1);
  for (let i = p.objs.length - 1; i >= 0; i--){ const o = p.objs[i];
    if (o.t === 'pen'){ if (o.pts.some((a, j) => { const b = o.pts[j + 1] || a; return pxSegD(x, y, a, b) <= o.lw / 2 + tol; })) return o; continue; }
    if (o.t === 'line' || o.t === 'arrow'){ if (pxSegD(x, y, [o.x1, o.y1], [o.x2, o.y2]) <= o.lw / 2 + tol) return o; continue; }
    const B = pxBox(o); if (x >= B.x - tol && x <= B.x + B.w + tol && y >= B.y - tol && y <= B.y + B.h + tol) return o; }
  return null;
}
function pxSegD(x, y, a, b){ const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let tt = L ? ((x - a[0]) * dx + (y - a[1]) * dy) / L : 0; tt = Math.max(0, Math.min(1, tt)); return Math.hypot(x - a[0] - tt * dx, y - a[1] - tt * dy); }
function pxOnHandle(o, x, y){ const B = pxBox(o), m = 3 / PX.k, hs = 14 / PX.k; return Math.abs(x - (B.x + B.w + m)) <= hs && Math.abs(y - (B.y + B.h + m)) <= hs; }
function pxMove(o, dx, dy){ if (o.t === 'pen') o.pts.forEach(a => { a[0] += dx; a[1] += dy; }); else if (o.t === 'line' || o.t === 'arrow'){ o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy; } else { o.x += dx; o.y += dy; } }
function pxScale(o, B0, nx, ny){
  const sx = Math.max(0.05, (nx - B0.x) / B0.w), sy = Math.max(0.05, (ny - B0.y) / B0.h), O = o._o;
  if (o.t === 'text'){ o.fs = Math.max(4, Math.min(200, O.fs * Math.max(sx, sy))); if (O.w) o.w = O.w * sx; }
  else if (o.t === 'mark') o.s = Math.max(4, O.s * Math.max(sx, sy));
  else if (o.t === 'img'){ const s = o.free ? null : Math.max(sx, sy); o.w = O.w * (s || sx); o.h = O.h * (s || sy); }
  else if (o.t === 'pen') o.pts = O.pts.map(([a, b]) => [B0.x + (a - B0.x) * sx, B0.y + (b - B0.y) * sy]);
  else if (o.t === 'line' || o.t === 'arrow'){ o.x1 = B0.x + (O.x1 - B0.x) * sx; o.y1 = B0.y + (O.y1 - B0.y) * sy; o.x2 = B0.x + (O.x2 - B0.x) * sx; o.y2 = B0.y + (O.y2 - B0.y) * sy; }
  else { o.w = O.w * sx; o.h = O.h * sy; }
}
var PXD = null;
function pxDown(e){
  const p = pxPage(); if (!p || !e.target.closest('#px_ov')) return;
  const [x, y] = pxPt(e), T = PX.tool, st = PX.st;
  e.preventDefault(); try { e.target.setPointerCapture(e.pointerId); } catch (er) {}
  if (T === 'select'){
    const so = pxSelObj();
    if (so && pxOnHandle(so, x, y)){ pxSnap(); so._o = pxClone(so); PXD = {m: 'size', o: so, B0: pxBox(so)}; return; }
    const h = pxHit(p, x, y);
    if (h){ if (PX.sel !== h.id){ PX.sel = h.id; pxRefresh(); } pxSnap(); PXD = {m: 'move', o: h, x, y, moved: false}; return; }
    if (PX.sel != null){ PX.sel = null; pxRefresh(); }
    const s = $('#px_stage'); PXD = {m: 'pan', sx: e.clientX, sy: e.clientY, l: s.scrollLeft, t: s.scrollTop}; return;
  }
  if (T === 'text' || T === 'date'){
    const h = pxHit(p, x, y); if (h && h.t === 'text'){ PX.tool = 'select'; PX.sel = h.id; pxRender($('#ds_root')); setTimeout(() => { const ta = $('#px_txt'); if (ta) ta.focus(); }, 30); return; }
    pxSnap(); const o = {id: PX_ID++, t: 'text', x, y: y - st.fs * 0.7, txt: T === 'date' ? new Date().toLocaleDateString(locOf()) : '', fs: st.fs, col: st.col, font: st.font, b: st.b, it: st.it, u: st.u, al: st.al, bg: st.bg, w: 0, op: 1};
    p.objs.push(o); PX.sel = o.id; if (T === 'date'){ pxRefresh(); return; } PX.tool = 'select'; pxRender($('#ds_root')); setTimeout(() => { const ta = $('#px_txt'); if (ta) ta.focus(); }, 30); return;
  }
  if (T === 'edit'){ pxEditText(p, x, y); return; }
  if (T === 'pen' || T === 'hl'){ PX.draft = {id: PX_ID++, t: 'pen', pts: [[x, y]], col: T === 'hl' ? st.hlCol : st.col, lw: T === 'hl' ? (st.hlLw || 12) : st.lw, op: T === 'hl' ? 0.45 : st.op, hl: T === 'hl'}; PXD = {m: 'draw'}; pxDraw(false); return; }
  if (['rect', 'ell', 'white', 'redact'].includes(T)){ PX.draft = {id: PX_ID++, t: T, x, y, w: 0, h: 0, col: st.col, lw: T === 'rect' || T === 'ell' ? st.lw : 0, fill: T === 'white' ? '#ffffff' : (st.fillOn ? st.col : ''), op: T === 'rect' || T === 'ell' ? st.op : 1}; PXD = {m: 'shape', x, y}; return; }
  if (T === 'line' || T === 'arrow'){ PX.draft = {id: PX_ID++, t: T, x1: x, y1: y, x2: x, y2: y, col: st.col, lw: st.lw, op: st.op}; PXD = {m: 'line'}; return; }
  if (T === 'check' || T === 'x' || T === 'dot'){ pxSnap(); const s = st.ms || 14, o = {id: PX_ID++, t: 'mark', k: T, x: x - s / 2, y: y - s / 2, s, col: st.col, op: 1}; p.objs.push(o); PX.sel = o.id; pxRefresh(); pxSay(t('px_added', {n: pxObjName(o)})); return; }
}
function pxMoveEv(e){
  if (!PXD) return; const p = pxPage(); if (!p) return;
  if (PXD.m === 'pan'){ const s = $('#px_stage'); s.scrollLeft = PXD.l - (e.clientX - PXD.sx); s.scrollTop = PXD.t - (e.clientY - PXD.sy); return; }
  const [x, y] = pxPt(e);
  if (PXD.m === 'move'){ pxMove(PXD.o, x - PXD.x, y - PXD.y); PXD.x = x; PXD.y = y; PXD.moved = true; pxDraw(false); return; }
  if (PXD.m === 'size'){ pxScale(PXD.o, PXD.B0, x, y); pxDraw(false); return; }
  if (PXD.m === 'draw'){ const P = PX.draft.pts, l = P[P.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 0.6 / (PX.k || 1)) P.push([x, y]); if (PX.draft.hl && P.length > 1){ /* a highlighter goes straight along the line of text */ PX.draft.pts = [P[0], [x, P[0][1]]]; } pxDraw(false); return; }
  if (PXD.m === 'shape'){ PX.draft.w = x - PXD.x; PX.draft.h = y - PXD.y; pxDraw(false); return; }
  if (PXD.m === 'line'){ PX.draft.x2 = x; PX.draft.y2 = y; pxDraw(false); }
}
function pxUp(){
  if (!PXD) return; const p = pxPage(), D = PXD; PXD = null;
  if (D.m === 'move' && !D.moved){ PX.hist.pop(); }
  if (D.m === 'size' && D.o) delete D.o._o;
  if (PX.draft && p){ const o = PX.draft; PX.draft = null;
    if (o.t === 'rect' || o.t === 'ell' || o.t === 'white' || o.t === 'redact'){ if (Math.abs(o.w) < 3 && Math.abs(o.h) < 3){ o.w = o.t === 'redact' || o.t === 'white' ? 90 : 80; o.h = o.t === 'redact' || o.t === 'white' ? 16 : 50; } const B = pxBox(o); o.x = B.x; o.y = B.y; o.w = B.w; o.h = B.h; }
    if ((o.t === 'line' || o.t === 'arrow') && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 3){ o.x2 = o.x1 + 60; }
    pxSnap(); p.objs.push(o); if (o.t !== 'pen') PX.sel = o.id; pxSay(t('px_added', {n: pxObjName(o)}));
  }
  pxRefresh(); pxThumbOne(PX.cur);
}
async function pxThumbOne(i){ const c = $(`#px_thumbs canvas[data-pxth="${i}"]`), p = PX.pages[i]; if (!c || !p) return; try { const s = await pxComposite(p, 90 / Math.max(pxW(p), pxH(p))); c.width = s.width; c.height = s.height; c.getContext('2d').drawImage(s, 0, 0); } catch (e) {} }
/* edit existing text: cover the words with white and put an editable copy on top */
async function pxEditText(p, x, y){
  if (p.d < 0){ toast(t('px_editNo')); return; }
  try {
    const D = PX.docs[p.d], pg = await D.pdf.getPage(p.i + 1);
    if (!p.items){ const tc = await pg.getTextContent(), vp = pg.getViewport({scale: 1, rotation: pxR(p)}); p.items = tc.items.filter(it => it.str && it.str.trim()).map(it => {
      const [a, b, c, d, e, f] = it.transform, ul = Math.hypot(a, b) || 1, vl = Math.hypot(c, d) || 1, u = [a / ul, b / ul], v = [c / vl, d / vl], h = vl, w = it.width;
      const P = [[e - v[0] * h * 0.25, f - v[1] * h * 0.25], [e + u[0] * w - v[0] * h * 0.25, f + u[1] * w - v[1] * h * 0.25], [e + u[0] * w + v[0] * h, f + u[1] * w + v[1] * h], [e + v[0] * h, f + v[1] * h]].map(q => vp.convertToViewportPoint(q[0], q[1]));
      const xs = P.map(q => q[0]), ys = P.map(q => q[1]), st = tc.styles[it.fontName] || {};
      return {s: it.str, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), fs: h, bold: /bold|black|heavy/i.test(it.fontName + ' ' + (st.fontFamily || '')), serif: /serif|times|david|frank/i.test(st.fontFamily || '') && !/sans/i.test(st.fontFamily || '')}; }); }
    const it = p.items.find(q => x >= q.x - 1 && x <= q.x + q.w + 1 && y >= q.y - 1 && y <= q.y + q.h + 1);
    if (!it){ pxSay(t('px_editMiss')); return; }
    pxSnap();
    const wo = {id: PX_ID++, t: 'white', x: it.x - 0.5, y: it.y - 0.5, w: it.w + 1, h: it.h + 1, fill: '#ffffff', op: 1}, fs = Math.max(4, it.fs * 0.92);
    const o = {id: PX_ID++, t: 'text', x: it.x - fs * 0.15, y: it.y + it.h * 0.02 - fs * 0.15, txt: it.s, fs, col: '#000000', font: it.serif ? 'serif' : 'sans', b: it.bold, it: false, al: pxRtl(it.s) ? 'end' : 'start', bg: '', w: 0, op: 1, edit: true};
    p.objs.push(wo, o); PX.sel = o.id; PX.tool = 'select'; pxRender($('#ds_root')); setTimeout(() => { const ta = $('#px_txt'); if (ta){ ta.focus(); ta.select(); } }, 30);
  } catch (e) { toast(t('px_editNo')); }
}
/* pictures, signatures and QR codes go in the middle of what is on screen */
function pxInsertImage(c, kind){
  if (!PX || !PX.pages.length){ PX = pxNew(); PX.pages.push(pxBlank()); PX.name = t(kind === 'qr' ? 'qr_title' : 'px_title'); }
  DSX.view = 'pdf';
  const p = pxPage(), W = pxW(p), H = pxH(p), maxW = kind === 'sign' ? W * 0.3 : kind === 'qr' ? Math.min(W, H) * 0.25 : W * 0.5;
  let w = Math.min(maxW, c.width), h = w * c.height / c.width; if (h > H * 0.5){ h = H * 0.5; w = h * c.width / c.height; }
  const stg = $('#px_stage'); let cy = H / 2; if (stg && PX.k){ cy = Math.min(H - h / 2, Math.max(h / 2, (stg.scrollTop + stg.clientHeight / 2) / PX.k)); }
  pxSnap(); const o = {id: PX_ID++, t: 'img', c, x: (W - w) / 2, y: cy - h / 2, w, h, op: 1, alpha: kind !== 'photo', sig: kind === 'sign', qr: kind === 'qr'};
  p.objs.push(o); PX.sel = o.id; PX.tool = 'select'; dscRender(); pxSay(t('px_added', {n: pxObjName(o)}));
}
/* turning a page keeps everything written on it in the same place on the content */
function pxRotatePage(p, dir){
  const W = pxW(p), H = pxH(p), f = dir > 0 ? (x, y) => [H - y, x] : (x, y) => [y, W - x];
  p.objs.forEach(o => {
    if (o.t === 'pen') o.pts = o.pts.map(([a, b]) => f(a, b));
    else if (o.t === 'line' || o.t === 'arrow'){ [o.x1, o.y1] = f(o.x1, o.y1); [o.x2, o.y2] = f(o.x2, o.y2); }
    else if (o.t === 'rect' || o.t === 'ell' || o.t === 'white' || o.t === 'redact'){ const B = pxBox(o), a = f(B.x, B.y), b = f(B.x + B.w, B.y + B.h); o.x = Math.min(a[0], b[0]); o.y = Math.min(a[1], b[1]); o.w = Math.abs(a[0] - b[0]); o.h = Math.abs(a[1] - b[1]); }
    else { const B = pxBox(o), cc = f(B.x + B.w / 2, B.y + B.h / 2); pxMove(o, cc[0] - B.w / 2 - B.x, cc[1] - B.h / 2 - B.y); }
  });
  p.rot = ((p.rot || 0) + (dir > 0 ? 90 : 270)) % 360; delete p.items;
}

/* ================= saving ================= */
/* displayed page point → PDF user space (the page's own rotation and crop box are taken into account) */
function pxToPdf(p, x, y){
  const R = pxR(p), W0 = p.w0, H0 = p.h0; let mx, my;
  if (R === 0){ mx = x; my = H0 - y; } else if (R === 90){ mx = y; my = x; } else if (R === 180){ mx = W0 - x; my = y; } else { mx = W0 - y; my = H0 - x; }
  return [mx + (p.vx || 0), my + (p.vy || 0)];
}
async function pxEmbed(out, c, alpha){
  if (alpha){ const b = await new Promise(r => c.toBlob(r, 'image/png')); return out.embedPng(new Uint8Array(await b.arrayBuffer())); }
  const b = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); return out.embedJpg(new Uint8Array(await b.arrayBuffer()));
}
/* one object as a picture at 4× (8× for small ones), so it stays sharp when printed */
function pxObjCanvas(o){
  const B = pxBox(o), pad = 2, area = (B.w + pad * 2) * (B.h + pad * 2), k = Math.max(2, Math.min(8, Math.sqrt(6e6 / Math.max(1, area)))), c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil((B.w + pad * 2) * k)); c.height = Math.max(1, Math.ceil((B.h + pad * 2) * k));
  const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, (-B.x + pad) * k, (-B.y + pad) * k);
  const o2 = Object.assign({}, o); if (o2.hl) o2.op = 1; pxPaint(x, o2, false);
  return {c, B: {x: B.x - pad, y: B.y - pad, w: B.w + pad * 2, h: B.h + pad * 2}};
}
async function pxDrawObj(L, out, page, p, o){
  const R = pxR(p), {degrees, rgb, BlendMode} = L;
  const place = B => { const [px, py] = pxToPdf(p, B.x, B.y + B.h); return {x: px, y: py, width: B.w, height: B.h, rotate: degrees(R)}; };
  if (o.t === 'white'){ const [r, g, b] = qrHex(o.fill || '#ffffff'); page.drawRectangle(Object.assign(place(pxBox(o)), {color: rgb(r / 255, g / 255, b / 255)})); return; }
  if (o.t === 'img' && !o.hl){ const im = await pxEmbed(out, o.c, o.alpha); page.drawImage(im, Object.assign(place(pxBox(o)), {opacity: o.op == null ? 1 : o.op})); return; }
  const {c, B} = pxObjCanvas(o), im = await pxEmbed(out, c, true);
  page.drawImage(im, Object.assign(place(B), o.hl ? {opacity: o.op || 0.45, blendMode: BlendMode.Multiply} : {}));
}
/* form values: Latin text goes into the real fields; other scripts (Hebrew, Arabic…) are drawn on the page instead,
   because the standard PDF fonts can't show them */
function pxDropField(lib, form, field){
  try { const wd = field.acroField.getWidgets().map(w => w.dict); lib.getPages().forEach(pg => { const A = pg.node.Annots(); if (!A) return; for (let i = A.size() - 1; i >= 0; i--){ if (wd.includes(lib.context.lookup(A.get(i)))) A.remove(i); } }); } catch (e) {}
  try { form.removeField(field); } catch (e) {}
}
const pxLatin = v => /^[\x20-\x7E\u00A0-\u00FF]*$/.test(String(v));
function pxFormSet(lib, d){
  const D = PX.docs[d], over = []; if (!D.fields) return over;
  let form; try { form = lib.getForm(); } catch (e) { return over; }
  Object.keys(PX.form).filter(k => k.startsWith(d + '|')).forEach(k => {
    const name = k.slice(k.indexOf('|') + 1), val = PX.form[k], W = (D.fields[name] || []).filter(f => f.type); if (!W.length) return;
    let field; try { field = form.getField(name); } catch (e) { return; }
    const ty = W[0].type;
    try {
      if (ty === 'checkbox'){ if (val) field.check(); else field.uncheck(); }
      else if (ty === 'radiobutton'){ if (val) field.select(val); }
      else if (val === '' || val == null){ if (ty === 'text') field.setText(''); }
      else if (pxLatin(val)){ if (ty === 'text') field.setText(String(val)); else field.select(String(val)); }
      else { W.forEach(f => over.push({page: f.page, rect: f.rect, txt: String(val)})); pxDropField(lib, form, field); }
    } catch (e){ W.forEach(f => over.push({page: f.page, rect: f.rect, txt: String(val)})); pxDropField(lib, form, field); }
  });
  return over;
}
async function pxFormOverlay(out, page, ov){
  const [x1, y1, x2, y2] = ov.rect, w = Math.abs(x2 - x1), h = Math.abs(y2 - y1), fs = Math.max(6, Math.min(14, h * 0.68)), k = 6, c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * k)); c.height = Math.max(1, Math.ceil(h * k));
  const x = c.getContext('2d'), rtl = pxRtl(ov.txt); x.scale(k, k); x.font = '400 ' + fs + 'px ' + PX_FONTS.sans; x.fillStyle = '#000'; x.textBaseline = 'middle'; try { x.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {} x.textAlign = rtl ? 'right' : 'left';
  x.fillText(ov.txt, rtl ? w - 2 : 2, h / 2, w - 4);
  const im = await pxEmbed(out, c, true); page.drawImage(im, {x: Math.min(x1, x2), y: Math.min(y1, y2), width: w, height: h});
}
async function pxBuild(onlyPage){
  const L = await pxPdfLib(), flat = !!PX.flat, src = {}, over = {};
  const needRaster = p => flat || p.objs.some(o => o.t === 'redact');
  /* the simple, common case – one PDF, all its pages, in order: edit it in place, so bookmarks, links and form fields stay */
  const inPlace = onlyPage == null && PX.docs.length === 1 && !flat && PX.pages.length === PX.docs[0].pdf.numPages && PX.pages.every((p, i) => p.d === 0 && p.i === i && !needRaster(p));
  const load = async d => { if (src[d] !== undefined) return src[d]; try { src[d] = await L.PDFDocument.load(PX.docs[d].bytes); over[d] = pxFormSet(src[d], d); if (!inPlace || PX.flatForm){ try { src[d].getForm().flatten(); } catch (e) {} } } catch (e){ src[d] = null; } return src[d]; };
  let out;
  if (inPlace && await load(0)) out = src[0]; else out = await L.PDFDocument.create();
  out.setProducer('Financial Calculator · PDF editor'); out.setCreator('Financial Calculator');
  for (let i = 0; i < PX.pages.length; i++){
    if (onlyPage != null && i !== onlyPage) continue;
    const p = PX.pages[i];
    pxSay(t('px_saving', {n: i + 1, m: PX.pages.length}));
    if (needRaster(p) || (p.d >= 0 && !(await load(p.d)))){
      const k = p.img ? Math.min(4, Math.max(2, p.img.width / p.w0)) : 200 / 72, c = await pxComposite(p, k), im = await pxEmbed(out, c, false), pg = out.addPage([pxW(p), pxH(p)]);
      pg.drawImage(im, {x: 0, y: 0, width: pxW(p), height: pxH(p)}); continue;
    }
    let page;
    if (p.d >= 0){
      if (out === src[0] && p.d === 0) page = out.getPage(p.i);
      else { [page] = await out.copyPages(src[p.d], [p.i]); out.addPage(page); }
      page.setRotation(L.degrees(pxR(p)));
      for (const ov of (over[p.d] || []).filter(o => o.page === p.i)) await pxFormOverlay(out, page, ov);
    } else {
      page = out.addPage([p.w0, p.h0]); page.setRotation(L.degrees(pxR(p)));
      if (p.img){ const im = await pxEmbed(out, p.img, p.alpha); page.drawImage(im, {x: 0, y: 0, width: p.w0, height: p.h0}); }
    }
    for (const o of p.objs) await pxDrawObj(L, out, page, p, o);
  }
  return out.save();
}
const pxFile = ext => (String(PX.name || t('px_title')).replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'document') + '.' + ext;
async function pxSave(how){
  if (!PX || PX.busy) return; PX.busy = true;
  try {
    if (how === 'png'){
      const Z = PX.pages.length > 1 ? await pxZip() : null, zip = Z ? new Z() : null;
      for (let i = 0; i < PX.pages.length; i++){ pxSay(t('px_saving', {n: i + 1, m: PX.pages.length})); const p = PX.pages[i], c = await pxComposite(p, p.img ? Math.min(4, p.img.width / p.w0) : 200 / 72), b = await new Promise(r => c.toBlob(r, 'image/png'));
        if (zip) zip.file(pxFile('png').replace(/\.png$/, ' ' + (i + 1) + '.png'), b); else { const r = await fileSave(b, pxFile('png'), 'image/png'); toast(t(r === 'saved' ? 'ds_fileOk' : 'pdf_fail')); } }
      if (zip){ const b = await zip.generateAsync({type: 'blob'}); const r = await fileSave(b, pxFile('zip'), 'application/zip'); toast(t(r === 'saved' ? 'ds_fileOk' : 'pdf_fail')); }
      pxSay(''); return;
    }
    if (how === 'print'){ await pxPrint(); return; }
    const bytes = await pxBuild(), blob = new Blob([bytes], {type: 'application/pdf'}), name = pxFile('pdf');
    pxSay('');
    if (how === 'share'){ const f = new File([blob], name, {type: 'application/pdf'}); if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f], title: name}); } catch (e) {} return; } }
    const r = await fileSave(blob, name, 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail')); if (r === 'saved') PX.dirty = false;
  } catch (e){ pxSay(''); toast(t('px_saveFail')); }
  finally { PX.busy = false; }
}
async function pxPrint(){
  try { prnClean(); } catch (e) {}
  pxSay(t('ds_making'));
  const imgs = [];
  for (let i = 0; i < PX.pages.length; i++){ const p = PX.pages[i], c = await pxComposite(p, p.img ? Math.min(3, p.img.width / p.w0) : 200 / 72); imgs.push(`<div class="prn-sheet px-ps" style="width:${(pxW(p) * 25.4 / 72).toFixed(2)}mm;height:${(pxH(p) * 25.4 / 72).toFixed(2)}mm"><img src="${c.toDataURL('image/jpeg', .92)}" alt="" style="left:0;top:0;width:100%;height:100%"></div>`); }
  pxSay('');
  document.body.insertAdjacentHTML('beforeend', `<div id="prn_area" class="prn-scan">${imgs.join('')}</div>`);
  const p0 = PX.pages[0]; let s = $('#prn_page'); if (!s){ s = document.createElement('style'); s.id = 'prn_page'; document.head.appendChild(s); }
  s.textContent = `@page{size:${(pxW(p0) * 25.4 / 72).toFixed(1)}mm ${(pxH(p0) * 25.4 / 72).toFixed(1)}mm;margin:0}`;
  document.body.classList.add('prn-on'); PRN.live = true; PRN_FIRED = false;
  await Promise.all([...document.querySelectorAll('#prn_area img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  try { window.print(); } catch (e) {}
  setTimeout(() => { if (!PRN_FIRED){ prnClean(); toast(t('prn_blocked')); } }, 700);
}

/* ================= events ================= */
document.addEventListener('pointerdown', e => { if (DSX.view === 'pdf' && e.target && e.target.id === 'px_ov') pxDown(e); });
document.addEventListener('pointermove', e => { if (PXD) pxMoveEv(e); });
document.addEventListener('pointerup', () => { if (PXD) pxUp(); }); document.addEventListener('pointercancel', () => { if (PXD) pxUp(); });
async function pxOpenFiles(files, at){
  pxSay('⏳ ' + t('px_opening'));
  const n = await pxAddFiles([...files], at);
  if (!n && (!PX || !PX.pages.length)){ pxSay(t('px_openNone')); return; }
  PX.hist = PX.hist.length > 1 ? PX.hist : []; dscRender(); pxSay(n ? t('px_openOk', {n}) : '');
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root')) return; let b;
  if (t0.closest('[data-dstool="pdf"]')){ DSX.view = 'pdf'; dscRender(); return; }
  if (t0.closest('#ds_pxgo')){ pxFromScan(); return; }
  if (DSX.view !== 'pdf') return;
  if (t0.closest('#px_open')){ $('#px_file').click(); return; }
  if (t0.closest('#px_blankDoc')){ PX = pxNew(); PX.pages.push(pxBlank()); PX.name = t('px_newName'); dscRender(); return; }
  if (t0.closest('#px_scan')){ pxFromScan(); return; }
  if (!PX) return;
  const p = pxPage(), so = pxSelObj();
  if ((b = t0.closest('[data-pxt]'))){ PX.tool = b.dataset.pxt; if (PX.tool !== 'select') PX.sel = null; $$('#ds_root [data-pxt]').forEach(x => { const on = x.dataset.pxt === PX.tool; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); const h = $('#px_hint'); if (h) h.textContent = t('px_h_' + PX.tool); const ov = $('#px_ov'); if (ov) ov.style.cursor = PX.tool === 'select' ? 'default' : 'crosshair'; pxRefresh(); return; }
  if (t0.closest('#px_sign')){ sgOpen(c => pxInsertImage(c, 'sign')); return; }
  if (t0.closest('#px_img')){ $('#px_imgF').click(); return; }
  if (t0.closest('#px_qr')){ DSX.view = 'qr'; QRX.tab = 'make'; QRX.toPdf = true; dscRender(); return; }
  if (t0.closest('#px_undo')){ pxUndo(false); return; }
  if (t0.closest('#px_redo')){ pxUndo(true); return; }
  if (t0.closest('#px_zi')){ PX.zoom = Math.min(4, PX.zoom * 1.25); pxRender($('#ds_root')); return; }
  if (t0.closest('#px_zo')){ PX.zoom = Math.max(0.5, PX.zoom / 1.25); pxRender($('#ds_root')); return; }
  if ((b = t0.closest('[data-pxp]'))){ PX.cur = +b.dataset.pxp; PX.sel = null; pxRender($('#ds_root')); const n = $(`[data-pxp="${PX.cur}"]`); if (n) n.focus(); return; }
  if (t0.closest('#px_prev')){ if (PX.cur > 0){ PX.cur--; PX.sel = null; pxRender($('#ds_root')); } return; }
  if (t0.closest('#px_next')){ if (PX.cur < PX.pages.length - 1){ PX.cur++; PX.sel = null; pxRender($('#ds_root')); } return; }
  if (t0.closest('#px_rotL') || t0.closest('#px_rotR')){ pxSnap(); pxRotatePage(p, t0.closest('#px_rotR') ? 1 : -1); PX.cache = null; pxRender($('#ds_root')); return; }
  if (t0.closest('#px_mvL') || t0.closest('#px_mvR')){ const d = t0.closest('#px_mvR') ? 1 : -1, j = PX.cur + d; if (j < 0 || j >= PX.pages.length) return; pxSnap(); const a = PX.pages; [a[PX.cur], a[j]] = [a[j], a[PX.cur]]; PX.cur = j; pxRender($('#ds_root')); pxSay(t('px_moved', {n: j + 1})); return; }
  if (t0.closest('#px_dup')){ pxSnap(); PX.pages.splice(PX.cur + 1, 0, Object.assign({}, p, {id: PX_ID++, objs: p.objs.map(o => Object.assign(pxClone(o), {id: PX_ID++}))})); PX.cur++; pxRender($('#ds_root')); return; }
  if (t0.closest('#px_addB')){ pxSnap(); PX.pages.splice(PX.cur + 1, 0, pxBlank(p.w0 < p.h0 ? p.w0 : 595.28, p.w0 < p.h0 ? p.h0 : 841.89)); PX.cur++; pxRender($('#ds_root')); return; }
  if (t0.closest('#px_addF')){ $('#px_addFF').click(); return; }
  if (t0.closest('#px_delP')){ if (PX.pages.length === 1){ toast(t('px_lastPage')); return; } if (p.objs.length && !confirm(t('px_delSure'))) return; pxSnap(); PX.pages.splice(PX.cur, 1); PX.cur = Math.min(PX.cur, PX.pages.length - 1); pxRender($('#ds_root')); return; }
  if ((b = t0.closest('[data-pxo]'))){ PX.sel = +b.dataset.pxo; PX.tool = 'select'; pxRender($('#ds_root')); const st = $('#px_stage'); if (st) st.focus(); return; }
  /* properties */
  const apply = (fn, keyForDefault) => { if (so){ pxSnap(); fn(so); } else if (keyForDefault) fn(PX.st); pxRefresh(); if (so) pxThumbOne(PX.cur); };
  if ((b = t0.closest('[data-pxc]'))){ const c = b.dataset.pxc; apply(o => { if (o === PX.st){ if (PX.tool === 'hl') o.hlCol = c; else o.col = c; } else if (o.t === 'rect' || o.t === 'ell'){ o.col = c; if (o.fill) o.fill = c; } else o.col = c; }, true); return; }
  if ((b = t0.closest('[data-pxfs]'))){ const d = +b.dataset.pxfs; apply(o => { o.fs = Math.max(4, Math.min(200, Math.round((o.fs || 14) + d * ((o.fs || 14) >= 24 ? 2 : 1)))); }, true); return; }
  if ((b = t0.closest('[data-pxms]'))){ const d = +b.dataset.pxms; apply(o => { if (o === PX.st) o.ms = Math.max(6, (o.ms || 14) + d * 2); else o.s = Math.max(4, o.s + d * 2); }, true); return; }
  if (t0.closest('#px_b')){ apply(o => { o.b = !o.b; }, true); return; }
  if (t0.closest('#px_i')){ apply(o => { o.it = !o.it; }, true); return; }
  if (t0.closest('#px_u')){ apply(o => { o.u = !o.u; }, true); return; }
  if ((b = t0.closest('[data-pxal]'))){ const a = b.dataset.pxal; apply(o => { o.al = a; }, true); return; }
  if (t0.closest('#px_ratio') && so && so.t === 'img'){ pxSnap(); so.free = !so.free; if (!so.free) so.h = so.w * so.c.height / so.c.width; pxRefresh(); return; }
  if (t0.closest('#px_odel') && so){ pxSnap(); p.objs = p.objs.filter(o => o !== so); PX.sel = null; pxRefresh(); pxThumbOne(PX.cur); pxSay(t('px_deleted')); return; }
  if (t0.closest('#px_odup') && so){ pxSnap(); const c = Object.assign(pxClone(so), {id: PX_ID++}); pxMove(c, 12, 12); p.objs.push(c); PX.sel = c.id; pxRefresh(); return; }
  if (t0.closest('#px_ofront') && so){ pxSnap(); p.objs = p.objs.filter(o => o !== so).concat([so]); pxRefresh(); return; }
  if (t0.closest('#px_oback') && so){ pxSnap(); p.objs = [so].concat(p.objs.filter(o => o !== so)); pxRefresh(); return; }
  if (t0.closest('#px_save')){ pxSave('pdf'); return; }
  if (t0.closest('#px_share')){ pxSave('share'); return; }
  if (t0.closest('#px_png')){ pxSave('png'); return; }
  if (t0.closest('#px_print')){ pxSave('print'); return; }
  if (t0.closest('#px_close')){ if (PX.dirty && !confirm(t('px_leave'))) return; PX = null; dscRender(); return; }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el || !PX || DSX.view !== 'pdf' || !el.closest || !el.closest('#ds_root')) return; const so = pxSelObj();
  if (el.id === 'px_txt' && so && so.t === 'text'){ if (!PX.typing){ pxSnap(); PX.typing = true; } so.txt = el.value; pxDraw(false); const it = $(`.px-oi[data-pxo="${so.id}"]`); if (it) it.textContent = pxObjName(so); return; }
  if (el.id === 'px_lw'){ if (so){ if (!PX.typing){ pxSnap(); PX.typing = true; } so.lw = +el.value; pxDraw(false); } else if (PX.tool === 'hl') PX.st.hlLw = +el.value; else PX.st.lw = +el.value; return; }
  if (el.id === 'px_op'){ if (so){ if (!PX.typing){ pxSnap(); PX.typing = true; } so.op = +el.value; pxDraw(false); } else PX.st.op = +el.value; return; }
  if (el.id === 'px_name'){ PX.name = el.value.slice(0, 80); return; }
  if (el.dataset.pxff != null && el.type !== 'checkbox' && el.tagName !== 'SELECT'){ clearTimeout(PX.ft); const k = el.dataset.pxff, v = el.value; PX.ft = setTimeout(() => pxFormApply(k, v), 300); }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'pdf') return; const so = PX && pxSelObj();
  PX && (PX.typing = false);
  if (el.id === 'px_file' && el.files.length){ PX = null; pxOpenFiles(el.files); el.value = ''; return; }
  if (!PX) return;
  if (el.id === 'px_addFF' && el.files.length){ pxOpenFiles(el.files, PX.cur + 1); el.value = ''; return; }
  if (el.id === 'px_imgF' && el.files[0]){ const f = el.files[0]; dsLoad(f).then(c => pxInsertImage(c, /png|gif|webp/.test(f.type) ? 'png' : 'photo')).catch(() => toast(t('ph_fail'))); el.value = ''; return; }
  if (el.id === 'px_font'){ if (so){ pxSnap(); so.font = el.value; } else PX.st.font = el.value; pxRefresh(); return; }
  if (el.id === 'px_bg'){ if (so){ pxSnap(); so.bg = el.value; } else PX.st.bg = el.value; pxRefresh(); return; }
  if (el.id === 'px_fill'){ if (so){ pxSnap(); so.fill = el.checked ? so.col : ''; } else PX.st.fillOn = el.checked; pxRefresh(); return; }
  if (el.id === 'px_ccol'){ const c = el.value; if (so){ pxSnap(); so.col = c; if (so.fill) so.fill = c; } else if (PX.tool === 'hl') PX.st.hlCol = c; else PX.st.col = c; pxRefresh(); return; }
  if (el.id === 'px_wcol' && so){ pxSnap(); so.fill = el.value; pxRefresh(); return; }
  if (el.id === 'px_flat'){ PX.flat = el.checked; return; }
  if (el.id === 'px_flatForm'){ PX.flatForm = el.checked; return; }
  if (el.dataset.pxff != null){ pxFormApply(el.dataset.pxff, el.type === 'checkbox' ? el.checked : el.value); return; }
  if (el.id === 'px_txt' || el.id === 'px_lw' || el.id === 'px_op'){ pxThumbOne(PX.cur); }
});
/* leaving the editor with unsaved changes asks first (runs before the scanner's own Back) */
document.addEventListener('click', e => { if (DSX.view === 'pdf' && PX && PX.dirty && PX.pages.length && e.target.closest && e.target.closest('#ds_back') && !confirm(t('px_leave'))){ e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('toggle', e => { if (e.target && e.target.classList && e.target.classList.contains('px-form') && PX) PX.formOpen = e.target.open; }, true);
/* keyboard: arrows move, + and − resize, Delete removes, Ctrl+Z / Ctrl+Y undo and redo */
document.addEventListener('keydown', e => {
  if (DSX.view !== 'pdf' || !PX || !e.target || !e.target.closest || !e.target.closest('#ds_root')) return;
  const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if ((e.ctrlKey || e.metaKey) && !inField && (e.key === 'z' || e.key === 'Z')){ e.preventDefault(); pxUndo(e.shiftKey); return; }
  if ((e.ctrlKey || e.metaKey) && !inField && (e.key === 'y' || e.key === 'Y')){ e.preventDefault(); pxUndo(true); return; }
  if (inField || !e.target.closest('#px_stage')) return;
  const so = pxSelObj(), p = pxPage(); if (!so) return;
  const s = e.shiftKey ? 10 : 1, m = {ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s]}[e.key];
  if (m){ e.preventDefault(); if (!PX.kb){ pxSnap(); PX.kb = true; } pxMove(so, m[0], m[1]); pxDraw(false); return; }
  if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); pxSnap(); p.objs = p.objs.filter(o => o !== so); PX.sel = null; pxRefresh(); pxSay(t('px_deleted')); return; }
  if (e.key === '+' || e.key === '=' || e.key === '-'){ e.preventDefault(); pxSnap(); const B = pxBox(so), f = e.key === '-' ? 0.9 : 1.1; so._o = pxClone(so); pxScale(so, B, B.x + B.w * f, B.y + B.h * f); delete so._o; pxRefresh(); return; }
  if (e.key === 'Escape'){ PX.sel = null; pxRefresh(); }
});
document.addEventListener('keyup', () => { if (PX) PX.kb = false; });
window.addEventListener('resize', () => { if (DSX.view === 'pdf' && PX && PX.pages.length){ clearTimeout(PX.rt); PX.rt = setTimeout(() => pxDraw(true), 200); } });
/* scanned cards can go straight into the editor */
{
  const cardPx = dsCardRender;
  dsCardRender = function(root){ const r = cardPx.apply(this, arguments); if (DSC && !DSC.cur){ const o = root.querySelector('.ds-out'); if (o && !root.querySelector('#ds_pxgo')) o.insertAdjacentHTML('beforeend', `<button type="button" class="btn" id="ds_pxgo">📝 ${pxE(t('px_editScan'))}</button>`); } return r; };
}
