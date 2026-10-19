/* ---------- 13.10: converting files both ways, in the scanner ----------
   Into PDF: pictures, Word (.docx), Excel (.xlsx), PowerPoint text (.pptx), OpenDocument text, web pages, text, Markdown, CSV.
   Out of PDF: pictures (PNG / JPG, zipped), text, Word, single pages, a page range, a smaller file. Also merging and
   picture-format changes. Nothing leaves the phone. */
var CVT = {files: [], target: '', o: {size: 'a4', margin: 'm', dpi: 150, fmt: 'png', range: '', q: 'm', docx: 'text', ifmt: 'jpg', imax: 0}, busy: false};
const cvtE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const cvtKind = f => /pdf/.test(f.type) || /\.pdf$/i.test(f.name) ? 'pdf' : /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|svg)$/i.test(f.name) ? 'img' : 'doc';
const cvtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const cvtBase = n => String(n || 'file').replace(/\.[a-z0-9]+$/i, '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'file';

/* ================= reading documents into simple blocks ================= */
const cvtXml = s => new DOMParser().parseFromString(s, 'application/xml');
const cvtKids = (el, name) => Array.from(el ? el.childNodes : []).filter(n => n.nodeType === 1 && (n.localName === name || n.nodeName === name));
const cvtAll = (el, name) => Array.from(el ? el.getElementsByTagNameNS('*', name) : []);
async function cvtDocx(buf){
  const Z = await pxZip(), z = await Z.loadAsync(buf), doc = cvtXml(await z.file('word/document.xml').async('string')), B = [];
  const relsF = z.file('word/_rels/document.xml.rels'), rels = {};
  if (relsF) cvtAll(cvtXml(await relsF.async('string')), 'Relationship').forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
  const ptext = p => { let s = ''; p.querySelectorAll('*').forEach(n => { if (n.localName === 't') s += n.textContent; else if (n.localName === 'tab') s += '\t'; else if (n.localName === 'br' || n.localName === 'cr') s += '\n'; }); return s; };
  const body = cvtAll(doc, 'body')[0]; if (!body) return B;
  for (const el of Array.from(body.childNodes)){
    if (el.nodeType !== 1) continue;
    if (el.localName === 'p'){
      const pPr = cvtKids(el, 'w:pPr')[0] || cvtAll(el, 'pPr')[0], st = pPr ? (cvtAll(pPr, 'pStyle')[0] || {getAttribute: () => ''}).getAttribute('w:val') || '' : '', jc = pPr ? (cvtAll(pPr, 'jc')[0] || {getAttribute: () => ''}).getAttribute('w:val') || '' : '';
      const runs = cvtAll(el, 'r'), bold = runs.length && runs.every(r => cvtAll(r, 'b').length), num = pPr && cvtAll(pPr, 'numPr').length;
      for (const bl of cvtAll(el, 'blip')){ const id = bl.getAttribute('r:embed') || bl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed'), tg = rels[id]; const f = tg && z.file('word/' + tg.replace(/^\/?word\//, '').replace(/^\.\//, '')); if (f){ try { const im = await cvtImgFromBlob(new Blob([await f.async('uint8array')])); B.push({k: 'img', c: im}); } catch (e) {} } }
      const s = ptext(el); if (!s.trim() && !cvtAll(el, 'blip').length){ B.push({k: 'sp'}); continue; } if (!s.trim()) continue;
      const k = /^(Title|Heading1|Heading 1|1)$/i.test(st) || /title/i.test(st) ? 'h1' : /heading ?2|^2$/i.test(st) ? 'h2' : /heading ?[3-9]|subtitle/i.test(st) ? 'h3' : num ? 'li' : 'p';
      B.push({k, s, b: bold, al: jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc === 'left' || jc === 'start' ? 'left' : ''});
    } else if (el.localName === 'tbl'){
      const rows = cvtKids(el, 'w:tr').length ? cvtKids(el, 'w:tr') : cvtAll(el, 'tr');
      B.push({k: 'table', rows: rows.map(tr => (cvtKids(tr, 'w:tc').length ? cvtKids(tr, 'w:tc') : cvtAll(tr, 'tc')).map(tc => cvtAll(tc, 'p').map(ptext).join('\n'))), head: true});
    }
  }
  return B;
}
async function cvtXlsx(buf){
  const Z = await pxZip(), z = await Z.loadAsync(buf), B = [], ss = [];
  const sf = z.file('xl/sharedStrings.xml'); if (sf) cvtAll(cvtXml(await sf.async('string')), 'si').forEach(si => ss.push(cvtAll(si, 't').map(x => x.textContent).join('')));
  const wb = cvtXml(await z.file('xl/workbook.xml').async('string')), rels = {}, rf = z.file('xl/_rels/workbook.xml.rels');
  if (rf) cvtAll(cvtXml(await rf.async('string')), 'Relationship').forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
  const col = ref => { const m = /^([A-Z]+)/.exec(ref || ''); if (!m) return 0; let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const sheets = cvtAll(wb, 'sheet').slice(0, 8);
  for (const sh of sheets){
    const id = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'), tg = (rels[id] || '').replace(/^\/?xl\//, ''), f = z.file('xl/' + tg); if (!f) continue;
    const x = cvtXml(await f.async('string')), grid = [];
    cvtAll(x, 'row').slice(0, 3000).forEach(r => { const row = []; cvtAll(r, 'c').forEach(c => { const i = col(c.getAttribute('r')); if (i > 40) return; const ty = c.getAttribute('t'), v = (cvtAll(c, 'v')[0] || {}).textContent || ''; let s = ty === 's' ? ss[+v] || '' : ty === 'inlineStr' ? cvtAll(c, 't').map(q => q.textContent).join('') : ty === 'b' ? (v === '1' ? 'TRUE' : 'FALSE') : v;
      if (!ty && v && isFinite(+v) && /\./.test(v) && v.length > 10) s = String(+(+v).toPrecision(10)); row[i] = s; }); grid.push(row); });
    const w = Math.max(0, ...grid.map(r => r.length)); if (!w) continue;
    B.push({k: 'h2', s: sh.getAttribute('name') || ''}, {k: 'table', rows: grid.map(r => Array.from({length: w}, (_, i) => r[i] == null ? '' : String(r[i]))), head: true});
  }
  return B;
}
async function cvtPptx(buf){
  const Z = await pxZip(), z = await Z.loadAsync(buf), B = [], names = Object.keys(z.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
  for (let i = 0; i < names.length; i++){ const x = cvtXml(await z.file(names[i]).async('string')); B.push({k: 'h2', s: t('cvt_slide', {n: i + 1})}); cvtAll(x, 'p').forEach(p => { const s = cvtAll(p, 't').map(q => q.textContent).join(''); if (s.trim()) B.push({k: 'p', s}); }); if (i < names.length - 1) B.push({k: 'hr'}); }
  return B;
}
async function cvtOdt(buf){ const Z = await pxZip(), z = await Z.loadAsync(buf), x = cvtXml(await z.file('content.xml').async('string')), B = []; Array.from(x.getElementsByTagName('*')).forEach(n => { if (n.localName === 'h') B.push({k: 'h2', s: n.textContent}); else if (n.localName === 'p' && n.parentNode && n.parentNode.localName !== 'list-item') B.push({k: 'p', s: n.textContent}); else if (n.localName === 'p') B.push({k: 'li', s: n.textContent}); }); return B; }
function cvtHtml(s){
  const d = new DOMParser().parseFromString(s, 'text/html'), B = [];
  d.querySelectorAll('script,style,noscript,template').forEach(n => n.remove());
  const walk = el => { for (const n of Array.from(el.children)){ const tg = n.tagName;
    if (/^H[1-6]$/.test(tg)) B.push({k: tg === 'H1' ? 'h1' : tg === 'H2' ? 'h2' : 'h3', s: n.textContent.trim()});
    else if (tg === 'P' || tg === 'BLOCKQUOTE' || tg === 'PRE') B.push({k: 'p', s: n.innerText || n.textContent, mono: tg === 'PRE'});
    else if (tg === 'LI') B.push({k: 'li', s: n.textContent.trim()});
    else if (tg === 'TABLE') B.push({k: 'table', rows: Array.from(n.rows).map(r => Array.from(r.cells).map(c => c.textContent.trim())), head: !!n.tHead || !!n.querySelector('th')});
    else if (tg === 'HR') B.push({k: 'hr'});
    else if (n.children.length) walk(n); else if (n.textContent.trim()) B.push({k: 'p', s: n.textContent.trim()}); } };
  walk(d.body || d.documentElement); return B;
}
function cvtCsv(s){
  const first = s.split('\n')[0], sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < s.length; i++){ const ch = s[i]; if (q){ if (ch === '"' && s[i + 1] === '"'){ cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === sep){ row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r'){ if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length){ row.push(cur); rows.push(row); }
  return [{k: 'table', rows: rows.slice(0, 5000), head: true}];
}
function cvtMd(s){ const B = []; s.split(/\r?\n/).forEach(l => { const m = /^(#{1,6})\s+(.*)$/.exec(l); if (m) B.push({k: m[1].length === 1 ? 'h1' : m[1].length === 2 ? 'h2' : 'h3', s: m[2]}); else if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) B.push({k: 'li', s: l.replace(/^\s*([-*+]|\d+[.)])\s+/, '')}); else if (/^\s*(---|\*\*\*)\s*$/.test(l)) B.push({k: 'hr'}); else if (!l.trim()) B.push({k: 'sp'}); else B.push({k: 'p', s: l.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')}); }); return B; }
function cvtRtf(s){ const txt = s.replace(/\\par[d]?/g, '\n').replace(/\{\\\*[^}]*\}/g, '').replace(/\\u(-?\d+)\??/g, (m, n) => String.fromCharCode(+n < 0 ? +n + 65536 : +n)).replace(/\\'([0-9a-f]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, ''); return txt.split('\n').map(l => l.trim() ? {k: 'p', s: l} : {k: 'sp'}); }
function cvtImgFromBlob(b){ return new Promise((res, rej) => { const u = URL.createObjectURL(b), im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); URL.revokeObjectURL(u); res(c); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); }; im.src = u; }); }
async function cvtBlocks(f){
  const n = f.name.toLowerCase();
  if (/\.docx$/.test(n)) return cvtDocx(await f.arrayBuffer());
  if (/\.xlsx$/.test(n)) return cvtXlsx(await f.arrayBuffer());
  if (/\.pptx$/.test(n)) return cvtPptx(await f.arrayBuffer());
  if (/\.odt$/.test(n)) return cvtOdt(await f.arrayBuffer());
  const s = await f.text();
  if (/\.html?$/.test(n) || /^\s*<(!doctype|html)/i.test(s)) return cvtHtml(s);
  if (/\.csv$/.test(n) || /\.tsv$/.test(n)) return cvtCsv(s);
  if (/\.md$|\.markdown$/.test(n)) return cvtMd(s);
  if (/\.rtf$/.test(n) || /^\{\\rtf/.test(s)) return cvtRtf(s);
  if (/\.json$/.test(n)){ let p = s; try { p = JSON.stringify(JSON.parse(s), null, 2); } catch (e) {} return p.split('\n').map(l => ({k: 'p', s: l || ' ', mono: true, tight: true})); }
  if (/\.(doc|xls|ppt|pages|numbers|key)$/.test(n)) throw new Error('old');
  return s.split(/\r?\n/).map(l => l.trim() ? {k: 'p', s: l} : {k: 'sp'});
}
const cvtTextOf = B => B.map(b => b.k === 'table' ? b.rows.map(r => r.join('\t')).join('\n') : b.k === 'li' ? '• ' + b.s : b.k === 'hr' ? '———' : b.k === 'sp' ? '' : b.k === 'img' ? '' : b.s).join('\n');
/* lay the blocks out on A4 pages (150 DPI), right-to-left where the text is Hebrew or Arabic */
function cvtLayout(B, title){
  const W = 1240, H = 1754, M = 110, FF = '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif', pages = []; let c, x, y;
  const page = () => { c = document.createElement('canvas'); c.width = W; c.height = H; x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.textBaseline = 'top'; y = M; pages.push(c); };
  const rtlOf = s => /^[^A-Za-zÀ-ɏ]*[֐-ࣿ]/.test(String(s || '').trim());
  const wrap = (s, max) => { const out = []; String(s).split('\n').forEach(par => { let line = ''; par.split(/(\s+)/).forEach(w => { const tr = line + w; if (x.measureText(tr.trim()).width > max && line.trim()){ out.push(line.trim()); line = w.trimStart(); while (x.measureText(line).width > max && line.length > 1){ let k = line.length; while (k > 1 && x.measureText(line.slice(0, k)).width > max) k--; out.push(line.slice(0, k)); line = line.slice(k); } } else line = tr; }); out.push(line.trim()); }); return out; };
  const text = (s, sz, wt, col, lh, o) => { o = o || {}; x.font = wt + ' ' + sz + 'px ' + (o.mono ? '"Courier New",monospace' : FF); x.fillStyle = col; const rtl = rtlOf(s), ind = o.ind || 0, max = W - 2 * M - ind;
    wrap(s, max).forEach((l, i) => { if (y + lh > H - M) page(); x.font = wt + ' ' + sz + 'px ' + (o.mono ? '"Courier New",monospace' : FF); x.fillStyle = col; try { x.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
      const al = o.al || (rtl ? 'right' : 'left'); x.textAlign = al === 'center' ? 'center' : al;
      const xx = al === 'center' ? W / 2 : al === 'right' ? W - M - (rtl ? ind : 0) : M + (rtl ? 0 : ind);
      if (o.bullet && i === 0){ x.fillText('•', rtl ? W - M - ind + 30 : M + ind - 30, y); }
      x.fillText(l, xx, y); y += lh; }); };
  page();
  if (title){ text(title, 40, 700, '#141821', 54); y += 14; }
  for (const b of B){
    if (b.k === 'h1'){ y += 18; text(b.s, 40, 700, '#141821', 54, {al: b.al}); y += 10; }
    else if (b.k === 'h2'){ y += 14; text(b.s, 33, 700, '#1c2230', 46, {al: b.al}); y += 8; }
    else if (b.k === 'h3'){ y += 10; text(b.s, 29, 700, '#1c2230', 40, {al: b.al}); y += 6; }
    else if (b.k === 'p'){ text(b.s, b.mono ? 22 : 26, b.b ? 700 : 400, '#1c2230', b.mono ? 30 : 38, {al: b.al, mono: b.mono}); y += b.tight ? 0 : 10; }
    else if (b.k === 'li'){ text(b.s, 26, 400, '#1c2230', 38, {ind: 44, bullet: true}); y += 4; }
    else if (b.k === 'sp') y += 18;
    else if (b.k === 'hr'){ if (y + 30 > H - M) page(); x.fillStyle = '#c9cfdb'; x.fillRect(M, y + 12, W - 2 * M, 2); y += 30; }
    else if (b.k === 'img'){ const im = b.c, maxW = W - 2 * M; let w = Math.min(maxW, im.width), h = w * im.height / im.width; if (h > H - 2 * M){ h = H - 2 * M; w = h * im.width / im.height; } if (y + h > H - M) page(); x.drawImage(im, (W - w) / 2, y, w, h); y += h + 16; }
    else if (b.k === 'table'){
      const R = b.rows.filter(r => r.some(v => String(v).trim())); if (!R.length) continue;
      const n = Math.max(...R.map(r => r.length)), fs = n > 8 ? 17 : n > 5 ? 20 : 22, lh = fs * 1.35, pad = 8; x.font = fs + 'px ' + FF;
      const want = Array.from({length: n}, (_, i) => Math.min(420, Math.max(40, ...R.slice(0, 200).map(r => x.measureText(String(r[i] == null ? '' : r[i])).width + pad * 2)))), sum = want.reduce((a, v) => a + v, 0), avail = W - 2 * M, cw = want.map(v => v / sum * avail);
      const rtl = R.slice(0, 20).some(r => r.some(rtlOf));
      const drawRow = (r, head) => { x.font = (head ? '700 ' : '400 ') + fs + 'px ' + FF; const cells = cw.map((w, i) => wrap(String(r[i] == null ? '' : r[i]), w - pad * 2)), rh = Math.max(1, ...cells.map(cl => cl.length)) * lh + pad * 2;
        if (y + rh > H - M){ page(); if (b.head && !head && R[0]) drawRow(R[0], true); x.font = (head ? '700 ' : '400 ') + fs + 'px ' + FF; }
        let cx = rtl ? W - M : M;
        cells.forEach((cl, i) => { const w = cw[i], x0 = rtl ? cx - w : cx; if (head){ x.fillStyle = '#eef1f6'; x.fillRect(x0, y, w, rh); } x.strokeStyle = '#b8c0cc'; x.lineWidth = 1; x.strokeRect(x0, y, w, rh); x.fillStyle = '#1c2230';
          cl.forEach((l, j) => { const r2 = rtlOf(l) || (rtl && !/[A-Za-z]/.test(l)); try { x.direction = r2 ? 'rtl' : 'ltr'; } catch (e) {} x.textAlign = r2 ? 'right' : 'left'; x.fillText(l, r2 ? x0 + w - pad : x0 + pad, y + pad + j * lh); });
          cx = rtl ? cx - w : cx + w; });
        y += rh; };
      R.forEach((r, i) => drawRow(r, b.head && i === 0)); y += 18;
    }
  }
  return pages;
}
/* any document (not PDF, not a picture) → page pictures (used by the editor too) */
async function cvtToCanvases(f){ const B = await cvtBlocks(f); return cvtLayout(B, ''); }

/* ================= PDF helpers ================= */
async function cvtPdfDoc(f){ return pxOpenPdf(new Uint8Array(await f.arrayBuffer()), f.name); }
async function cvtRenderPage(pdf, i, dpi){ const pg = await pdf.getPage(i), vp = pg.getViewport({scale: dpi / 72}), c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({canvasContext: x, viewport: vp, annotationMode: (PXL.pdfjs.AnnotationMode || {}).ENABLE_FORMS || 2}).promise; return c; }
/* the text of a PDF page, with line breaks where the lines are */
async function cvtPdfText(pdf, i){
  const pg = await pdf.getPage(i), tc = await pg.getTextContent(), lines = []; let cur = null;
  tc.items.forEach(it => { if (!('str' in it)) return; const y = Math.round(it.transform[5]), h = Math.hypot(it.transform[2], it.transform[3]) || 10;
    if (!cur || Math.abs(cur.y - y) > h * 0.5){ cur = {y, parts: []}; lines.push(cur); } cur.parts.push({x: it.transform[4], s: it.str, rtl: it.dir === 'rtl'}); if (it.hasEOL) cur = null; });
  return lines.map(l => { const rtl = l.parts.filter(p => p.rtl).length > l.parts.length / 2; l.parts.sort((a, b) => rtl ? b.x - a.x : a.x - b.x); return l.parts.map(p => p.s).join('').replace(/\s+/g, ' ').trim(); }).filter((l, i, a) => l || (a[i - 1] || '').length).join('\n');
}
function cvtRange(s, n){ const out = []; String(s || '').split(/[,،;\s]+/).filter(Boolean).forEach(p => { const m = /^(\d+)(?:-(\d*))?$/.exec(p); if (!m) return; const a = +m[1], b = m[2] === undefined ? a : m[2] === '' ? n : +m[2]; for (let i = Math.max(1, Math.min(a, b)); i <= Math.min(n, Math.max(a, b)); i++) if (!out.includes(i)) out.push(i); }); return out; }
/* a small Word file writer (paragraphs, right-to-left where needed, page breaks, pictures) */
async function cvtDocxMake(items){
  const Z = await pxZip(), z = new Z(), xe = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const rels = [], body = []; let img = 0;
  for (const it of items){
    if (it.k === 'br'){ body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>'); continue; }
    if (it.k === 'img'){ img++; const id = 'rIdImg' + img, b = await new Promise(r => it.c.toBlob(r, 'image/jpeg', 0.9)); z.file('word/media/image' + img + '.jpg', b); rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${img}.jpg"/>`);
      const cx = Math.round((it.w || 6.27) * 914400), cy = Math.round(cx * it.c.height / it.c.width);
      body.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${img}" name="Page ${img}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${img}" name="image${img}.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`); continue; }
    const rtl = /^[^A-Za-z]*[֐-ࣿ]/.test(it.s || ''), sz = it.k === 'h1' ? 36 : it.k === 'h2' ? 30 : 22;
    body.push(`<w:p><w:pPr>${rtl ? '<w:bidi/><w:jc w:val="right"/>' : ''}<w:spacing w:after="80"/></w:pPr><w:r><w:rPr>${rtl ? '<w:rtl/>' : ''}${it.k !== 'p' ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xe(it.s || '')}</w:t></w:r></w:p>`);
  }
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels.join('') + '</Relationships>');
  z.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body.join('') + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>');
  return z.generateAsync({type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ================= the conversion screen ================= */
function cvtTargets(){
  const K = CVT.files.map(cvtKind), has = k => K.includes(k), T = [];
  if (!K.length) return T;
  T.push('pdf');
  if (has('pdf')) T.push('img', 'txt', 'docx', 'split', 'extract', 'compress');
  if (!has('pdf') && has('doc')) T.push('txt');
  if (K.every(k => k === 'img')) T.push('imgfmt');
  T.push('edit');
  return T;
}
function cvtRender(root){
  const E = cvtE, T = cvtTargets(); if (!T.includes(CVT.target)) CVT.target = T[0] || '';
  const ic = k => ({pdf: '📕', img: '🖼️', doc: '📄'})[k];
  const o = CVT.o, tg = CVT.target;
  const sel = (id, key, opts) => `<div class="field cv-f"><label for="${id}">${E(t('cvt_o_' + key))}</label><select id="${id}" data-cvo="${key}">${opts.map(([v, l]) => `<option value="${v}"${String(o[key]) === String(v) ? ' selected' : ''}>${E(l)}</option>`).join('')}</select></div>`;
  let opts = '';
  if (tg === 'pdf') opts = sel('cvt_size', 'size', [['a4', 'A4'], ['letter', 'Letter'], ['fit', t('cvt_fit')]]) + sel('cvt_margin', 'margin', [['0', t('cvt_m0')], ['s', t('cvt_ms')], ['m', t('cvt_mm')]]);
  if (tg === 'img') opts = sel('cvt_fmt', 'fmt', [['png', 'PNG'], ['jpg', 'JPG']]) + sel('cvt_dpi', 'dpi', [[96, '96 DPI · ' + t('cvt_screen')], [150, '150 DPI'], [300, '300 DPI · ' + t('cvt_printQ')]]) + `<div class="field"><label for="cvt_range">${E(t('cvt_o_range'))}</label><div class="control"><input id="cvt_range" data-cvo="range" type="text" dir="ltr" inputmode="numeric" placeholder="1-3, 5" value="${E(o.range)}"></div></div>`;
  if (tg === 'extract' || tg === 'txt' || tg === 'docx') opts = `<div class="field"><label for="cvt_range">${E(t('cvt_o_range'))}</label><div class="control"><input id="cvt_range" data-cvo="range" type="text" dir="ltr" inputmode="numeric" placeholder="1-3, 5" value="${E(o.range)}"></div></div>`;
  if (tg === 'docx') opts += sel('cvt_docx', 'docx', [['text', t('cvt_dText')], ['img', t('cvt_dImg')], ['both', t('cvt_dBoth')]]);
  if (tg === 'compress') opts = sel('cvt_q', 'q', [['l', t('cvt_qL')], ['m', t('cvt_qM')], ['h', t('cvt_qH')]]) + `<p class="fine">⚠️ ${E(t('cvt_compH'))}</p>`;
  if (tg === 'imgfmt') opts = sel('cvt_ifmt', 'ifmt', [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WEBP']]) + sel('cvt_imax', 'imax', [[0, t('cvt_orig')], [3000, '3000 px'], [2000, '2000 px'], [1280, '1280 px'], [800, '800 px']]);
  root.innerHTML = dsBar('🔄 ' + t('cvt_title')) + `<p class="fine">${E(t('cvt_intro'))}</p>
    <div class="btnrow ds-go"><button type="button" class="gold-btn" id="cvt_pick">📂 ${E(t(CVT.files.length ? 'cvt_more' : 'cvt_pick'))}</button>${CVT.files.length ? `<button type="button" class="mv" id="cvt_clear">🗑️ ${E(t('cvt_clear'))}</button>` : ''}<input type="file" id="cvt_file" multiple hidden accept="application/pdf,image/*,.txt,.md,.csv,.tsv,.html,.htm,.json,.docx,.xlsx,.pptx,.odt,.rtf"></div>
    ${CVT.files.length ? `<ol class="cvt-list">${CVT.files.map((f, i) => `<li><span aria-hidden="true">${ic(cvtKind(f))}</span><span class="cvt-n" dir="auto">${E(f.name)}</span><small>${cvtSize(f.size)}</small><button type="button" class="px-tb s" data-cvup="${i}" aria-label="${E(t('cvt_up'))}"${i ? '' : ' disabled'}>↑</button><button type="button" class="px-tb s" data-cvdn="${i}" aria-label="${E(t('cvt_down'))}"${i < CVT.files.length - 1 ? '' : ' disabled'}>↓</button><button type="button" class="px-tb s" data-cvrm="${i}" aria-label="${E(t('cv_rm'))}">✕</button></li>`).join('')}</ol>
      <h4 class="ds-q">${E(t('cvt_to'))}</h4><div class="ds-chips" role="radiogroup" aria-label="${E(t('cvt_to'))}">${T.map(k => `<button type="button" role="radio" class="ds-chip${k === tg ? ' on' : ''}" aria-checked="${k === tg}" data-cvt="${k}">${E(t('cvt_t_' + k))}</button>`).join('')}</div>
      <p class="fine">${E(t('cvt_t_' + tg + 'H'))}</p>${opts}
      <div class="btnrow ds-out"><button type="button" class="gold-btn" id="cvt_go"${CVT.busy ? ' disabled' : ''}>${tg === 'edit' ? '📝' : '⚡'} ${E(t(tg === 'edit' ? 'cvt_goEdit' : 'cvt_go'))}</button></div>` : `<ul class="px-feat">${['cvt_f1', 'cvt_f2', 'cvt_f3', 'cvt_f4'].map(k => `<li>${E(t(k))}</li>`).join('')}</ul>`}
    <div class="sl-st" id="cvt_st" aria-live="polite"></div>
    <p class="fine sl-priv">🔒 ${E(t('cvt_priv'))}</p>`;
}
const cvtSay = m => { const s = $('#cvt_st'); if (s) s.textContent = m; };
async function cvtSave(blob, name, mime){ const r = await fileSave(blob, name, mime); return r === 'saved'; }
async function cvtOutMany(list, zipName){
  if (list.length === 1){ const ok = await cvtSave(list[0].b, list[0].n, list[0].b.type || 'application/octet-stream'); toast(t(ok ? 'ds_fileOk' : 'pdf_fail')); return; }
  const Z = await pxZip(), z = new Z(); const used = {}; list.forEach(x => { let n = x.n; while (used[n]) n = n.replace(/(\.[a-z0-9]+)$/i, '_$1'); used[n] = 1; z.file(n, x.b); });
  const ok = await cvtSave(await z.generateAsync({type: 'blob'}), zipName, 'application/zip'); toast(t(ok ? 'ds_fileOk' : 'pdf_fail'));
}
async function cvtGo(){
  if (CVT.busy || !CVT.files.length) return; CVT.busy = true; const tg = CVT.target, o = CVT.o, F = CVT.files, base = cvtBase(F[0].name) + (F.length > 1 ? ' +' + (F.length - 1) : '');
  const btn = $('#cvt_go'); if (btn) btn.disabled = true;
  try {
    if (tg === 'edit'){ PX = null; DSX.view = 'pdf'; dscRender(); await pxOpenFiles(F); return; }
    if (tg === 'pdf'){
      const L = await pxPdfLib(), out = await L.PDFDocument.create(), PS = o.size === 'letter' ? [612, 792] : [595.28, 841.89], MG = {0: 0, s: 18, m: 36}[o.margin] || 0;
      const putImg = async (im, w, h) => { let pw, ph; if (o.size === 'fit'){ pw = w; ph = h; } else { const land = w > h; pw = land ? PS[1] : PS[0]; ph = land ? PS[0] : PS[1]; } const pg = out.addPage([pw, ph]), k = Math.min((pw - MG * 2) / w, (ph - MG * 2) / h); const dw = o.size === 'fit' ? pw - MG * 2 : w * k, dh = o.size === 'fit' ? ph - MG * 2 : h * k; if (o.size === 'fit' && MG){ pg.setSize(w + MG * 2, h + MG * 2); pg.drawImage(im, {x: MG, y: MG, width: w, height: h}); } else pg.drawImage(im, {x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh}); };
      for (let i = 0; i < F.length; i++){ const f = F[i], k = cvtKind(f); cvtSay(t('cvt_working', {n: i + 1, m: F.length}));
        if (k === 'pdf'){ try { const src = await L.PDFDocument.load(new Uint8Array(await f.arrayBuffer())); (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p)); } catch (e){ const pdf = await cvtPdfDoc(f); for (let j = 1; j <= pdf.numPages; j++){ const c = await cvtRenderPage(pdf, j, 200), im = await pxEmbed(out, c, false), pg = out.addPage([c.width * 72 / 200, c.height * 72 / 200]); pg.drawImage(im, {x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight()}); } } }
        else if (k === 'img'){ let im, w, h; const bytes = new Uint8Array(await f.arrayBuffer());
          if (/jpe?g/.test(f.type) || /\.jpe?g$/i.test(f.name)){ try { im = await out.embedJpg(bytes); } catch (e) {} } else if (/png/.test(f.type) || /\.png$/i.test(f.name)){ try { im = await out.embedPng(bytes); } catch (e) {} }
          if (!im){ const c = await dsLoad(f); im = await pxEmbed(out, c, false); }
          const k2 = 72 / 150; w = im.width * k2; h = im.height * k2; if (o.size !== 'fit'){ w = im.width; h = im.height; } await putImg(im, w, h); }
        else { const pages = await cvtToCanvases(f); for (const c of pages){ const im = await pxEmbed(out, c, false), pg = out.addPage(o.size === 'letter' ? [612, 792] : [595.28, 841.89]); pg.drawImage(im, {x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight()}); } }
      }
      out.setProducer('Financial Calculator'); const ok = await cvtSave(new Blob([await out.save()], {type: 'application/pdf'}), base + '.pdf', 'application/pdf'); toast(t(ok ? 'ds_fileOk' : 'pdf_fail')); cvtSay(ok ? t('cvt_done') : ''); return;
    }
    if (tg === 'imgfmt'){
      const list = [], mime = {jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp'}[o.ifmt];
      for (let i = 0; i < F.length; i++){ cvtSay(t('cvt_working', {n: i + 1, m: F.length})); let c = await dsLoad(F[i]); if (+o.imax && Math.max(c.width, c.height) > +o.imax){ const k = +o.imax / Math.max(c.width, c.height), d = document.createElement('canvas'); d.width = Math.round(c.width * k); d.height = Math.round(c.height * k); const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height); c = d; }
        if (o.ifmt === 'jpg'){ const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const x = d.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, d.width, d.height); x.drawImage(c, 0, 0); c = d; }
        const b = await new Promise(r => c.toBlob(r, mime, 0.92)); list.push({b, n: cvtBase(F[i].name) + '.' + o.ifmt}); }
      await cvtOutMany(list, base + '.zip'); cvtSay(t('cvt_done')); return;
    }
    /* everything else starts from PDFs (and turns other files into PDF pages on the way) */
    const docs = [];
    for (const f of F){ const k = cvtKind(f); if (k === 'pdf') docs.push({f, pdf: await cvtPdfDoc(f)}); else if (tg === 'txt' && k === 'doc') docs.push({f, blocks: await cvtBlocks(f)}); }
    if (!docs.length){ toast(t('cvt_needPdf')); return; }
    if (tg === 'txt'){
      const list = [];
      for (const d of docs){ let s = ''; if (d.blocks) s = cvtTextOf(d.blocks); else { const R = cvtRange(o.range, d.pdf.numPages), P = R.length ? R : Array.from({length: d.pdf.numPages}, (_, i) => i + 1); for (const i of P){ cvtSay(t('cvt_page', {n: i, m: d.pdf.numPages})); s += (s ? '\n\n' : '') + await cvtPdfText(d.pdf, i); } }
        if (!s.trim() && d.pdf) s = t('cvt_noText'); list.push({b: new Blob(['﻿' + s], {type: 'text/plain;charset=utf-8'}), n: cvtBase(d.f.name) + '.txt'}); }
      await cvtOutMany(list, base + ' text.zip'); cvtSay(t('cvt_done')); return;
    }
    if (tg === 'img'){
      const list = [], mime = o.fmt === 'jpg' ? 'image/jpeg' : 'image/png';
      for (const d of docs){ const R = cvtRange(o.range, d.pdf.numPages), P = R.length ? R : Array.from({length: d.pdf.numPages}, (_, i) => i + 1); for (const i of P){ cvtSay(t('cvt_page', {n: i, m: d.pdf.numPages})); const c = await cvtRenderPage(d.pdf, i, +o.dpi); list.push({b: await new Promise(r => c.toBlob(r, mime, 0.92)), n: cvtBase(d.f.name) + (d.pdf.numPages > 1 ? ' ' + i : '') + '.' + o.fmt}); } }
      await cvtOutMany(list, base + ' images.zip'); cvtSay(t('cvt_done')); return;
    }
    if (tg === 'docx'){
      for (const d of docs){ const R = cvtRange(o.range, d.pdf.numPages), P = R.length ? R : Array.from({length: d.pdf.numPages}, (_, i) => i + 1), items = [];
        for (let j = 0; j < P.length; j++){ const i = P[j]; cvtSay(t('cvt_page', {n: i, m: d.pdf.numPages}));
          if (o.docx !== 'text'){ const pg = await d.pdf.getPage(i), v = pg.getViewport({scale: 1}); items.push({k: 'img', c: await cvtRenderPage(d.pdf, i, 150), w: Math.min(6.27, v.width / 72 * 0.98)}); }
          if (o.docx !== 'img'){ const s = await cvtPdfText(d.pdf, i); s.split('\n').forEach(l => items.push({k: 'p', s: l})); }
          if (j < P.length - 1) items.push({k: 'br'}); }
        const ok = await cvtSave(await cvtDocxMake(items), cvtBase(d.f.name) + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); toast(t(ok ? 'ds_fileOk' : 'pdf_fail')); }
      cvtSay(t('cvt_done')); return;
    }
    const L = await pxPdfLib();
    if (tg === 'split' || tg === 'extract'){
      const list = [];
      for (const d of docs){ let src; try { src = await L.PDFDocument.load(new Uint8Array(await d.f.arrayBuffer())); } catch (e){ toast(t('cvt_locked')); continue; }
        const n = src.getPageCount(), R = cvtRange(o.range, n);
        if (tg === 'extract'){ if (!R.length){ toast(t('cvt_rangeNeed')); return; } const out = await L.PDFDocument.create(); (await out.copyPages(src, R.map(i => i - 1))).forEach(p => out.addPage(p)); list.push({b: new Blob([await out.save()], {type: 'application/pdf'}), n: cvtBase(d.f.name) + ' (' + o.range.replace(/\s+/g, '') + ').pdf'}); }
        else for (let i = 0; i < n; i++){ cvtSay(t('cvt_page', {n: i + 1, m: n})); const out = await L.PDFDocument.create(); const [p] = await out.copyPages(src, [i]); out.addPage(p); list.push({b: new Blob([await out.save()], {type: 'application/pdf'}), n: cvtBase(d.f.name) + ' ' + (i + 1) + '.pdf'}); } }
      if (list.length) await cvtOutMany(list, base + ' pages.zip'); cvtSay(list.length ? t('cvt_done') : ''); return;
    }
    if (tg === 'compress'){
      const Q = {l: [96, 0.6], m: [130, 0.72], h: [170, 0.82]}[o.q] || [130, 0.72];
      for (const d of docs){ const out = await L.PDFDocument.create();
        for (let i = 1; i <= d.pdf.numPages; i++){ cvtSay(t('cvt_page', {n: i, m: d.pdf.numPages})); const pg = await d.pdf.getPage(i), v = pg.getViewport({scale: 1}), c = await cvtRenderPage(d.pdf, i, Q[0]), b = await new Promise(r => c.toBlob(r, 'image/jpeg', Q[1])), im = await out.embedJpg(new Uint8Array(await b.arrayBuffer())), p = out.addPage([v.width, v.height]); p.drawImage(im, {x: 0, y: 0, width: v.width, height: v.height}); }
        const bytes = await out.save(), ok = await cvtSave(new Blob([bytes], {type: 'application/pdf'}), cvtBase(d.f.name) + ' (small).pdf', 'application/pdf');
        cvtSay(t('cvt_sizes', {a: cvtSize(d.f.size), b: cvtSize(bytes.length)})); toast(t(ok ? 'ds_fileOk' : 'pdf_fail')); }
      return;
    }
  } catch (e){ cvtSay(''); toast(t(e && e.message === 'old' ? 'cvt_old' : 'cvt_fail')); }
  finally { CVT.busy = false; const b2 = $('#cvt_go'); if (b2) b2.disabled = false; }
}
/* smart extra: the text of the scanned pages, read by the AI (only when asked) */
async function cvtOcr(btn){
  if (!DSC || !DSC.pages.length || !slEngine()) return;
  const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('ph_reading');
  try {
    const blobs = []; for (const p of DSC.pages.slice(0, 4)){ const c = dsCompose(p, 2000); blobs.push(await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9))); }
    const j = await dsAsk('Transcribe ALL the text in these ' + blobs.length + ' scanned page image(s) exactly as written, in its original language and reading order. Do not translate, summarise or add anything. Return ONLY JSON: {"text": all the text with line breaks (tabs between table cells), "pages": [one entry per image, in order: {"lines": [{"t": the text of one printed line, "b": [left, top, right, bottom] of that line as numbers from 0 to 1000 relative to the image width and height]}]}]}', blobs, 'default');
    const pg = Array.isArray(j && j.pages) ? j.pages.map(x => Array.isArray(x && x.lines) ? x.lines.filter(l => l && typeof l.t === 'string').slice(0, 400) : []) : [];
    DSC.ocrLines = pg.some(x => x.length) ? pg : null;
    DSC.ocr = String((j && j.text) || pg.map(x => x.map(l => l.t).join('\n')).join('\n\n') || '').slice(0, 50000); dscRender(); const ta = $('#ds_ocr'); if (ta) ta.focus();
  } catch (e){ toast(t('ph_fail')); }
  finally { if (btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}
/* ================= events ================= */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root')) return; let b;
  if (t0.closest('[data-dstool="conv"]')){ DSX.view = 'conv'; dscRender(); return; }
  if ((b = t0.closest('#ds_ocrgo'))){ cvtOcr(b); return; }
  if (t0.closest('#ds_ocrcopy')){ copyText(DSC.ocr || ''); toast(t('st_copied')); return; }
  if (t0.closest('#ds_ocrtxt')){ fileSave(new Blob(['﻿' + (DSC.ocr || '')], {type: 'text/plain;charset=utf-8'}), dsFileName('txt'), 'text/plain'); return; }
  if (t0.closest('#ds_ocrdocx')){ cvtDocxMake(String(DSC.ocr || '').split('\n').map(s => ({k: 'p', s}))).then(bl => fileSave(bl, dsFileName('docx'), bl.type)); return; }
  if (DSX.view !== 'conv') return;
  if (t0.closest('#cvt_pick')){ $('#cvt_file').click(); return; }
  if (t0.closest('#cvt_clear')){ CVT.files = []; dscRender(); return; }
  if ((b = t0.closest('[data-cvrm]'))){ CVT.files.splice(+b.dataset.cvrm, 1); dscRender(); return; }
  if ((b = t0.closest('[data-cvup]'))){ const i = +b.dataset.cvup; [CVT.files[i - 1], CVT.files[i]] = [CVT.files[i], CVT.files[i - 1]]; dscRender(); return; }
  if ((b = t0.closest('[data-cvdn]'))){ const i = +b.dataset.cvdn; [CVT.files[i + 1], CVT.files[i]] = [CVT.files[i], CVT.files[i + 1]]; dscRender(); return; }
  if ((b = t0.closest('[data-cvt]'))){ CVT.target = b.dataset.cvt; dscRender(); const n = $(`[data-cvt="${CVT.target}"]`); if (n) n.focus(); return; }
  if (t0.closest('#cvt_go')){ cvtGo(); return; }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root')) return;
  if (el.id === 'cvt_file' && el.files.length){ CVT.files = CVT.files.concat([...el.files]).slice(0, 40); el.value = ''; dscRender(); return; }
  if (el.dataset && el.dataset.cvo){ CVT.o[el.dataset.cvo] = el.value; }
});
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.cvo && el.closest && el.closest('#ds_root')) CVT.o[el.dataset.cvo] = el.value; if (el && el.id === 'ds_ocr' && DSC) DSC.ocr = el.value; });
/* the scanned pages screen gets "read the text" (AI) */
{
  const cardCv = dsCardRender;
  dsCardRender = function(root){
    const r = cardCv.apply(this, arguments);
    if (DSC && !DSC.cur && !root.querySelector('#ds_ocrgo')){ const w = root.querySelector('.ds-out'); const eng = slEngine();
      if (w) w.insertAdjacentHTML('afterend', `<h4 class="ds-q">🔤 ${cvtE(t('ds_ocrT'))}</h4>${eng ? `<p class="fine">${cvtE(t('ds_ocrH'))}</p><div class="btnrow"><button type="button" class="btn" id="ds_ocrgo">🔤 ${cvtE(t('ds_ocrGo'))}</button></div>${DSC.ocr != null ? `<div class="field"><label for="ds_ocr">${cvtE(t('ds_ocrRes'))}</label><textarea id="ds_ocr" rows="8" dir="auto">${cvtE(DSC.ocr)}</textarea></div><div class="btnrow"><button type="button" class="mv" id="ds_ocrcopy">📋 ${cvtE(t('b_copy'))}</button><button type="button" class="mv" id="ds_ocrtxt">⬇️ TXT</button><button type="button" class="mv" id="ds_ocrdocx">⬇️ Word</button></div>` : ''}` : `<p class="fine">${cvtE(t('ds_ocrNoAi'))}</p>`}`); }
    return r;
  };
}
try { GS_SYN.docscan += ' המרה המרת קבצים PDF לוורד וורד ל-PDF תמונה ל-PDF איחוד PDF פיצול PDF כיווץ PDF עריכת PDF חילוץ טקסט convert pdf to word word to pdf merge split compress edit pdf ocr تحويل PDF دمج تقسيم ضغط تعديل'; } catch (e) {}
