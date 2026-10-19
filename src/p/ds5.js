/* ---------- 13.17: a smarter scanner – all worked out on the phone, nothing is sent ----------
   • straightens crooked text by itself (and a button per page)
   • finds blank pages and pages scanned twice, and removes them in one tap
   • splits an open book (two pages in one photo) into two pages
   • cleans the edges: shadows and fingers at the margins
   • fits the PDF under a size limit (for sites that accept up to 1 MB, 2 MB…)
   • suggests a file name from the recognised text */
let D5_RAW = false;
const d5Size = () => (DS_CARDS.find(c => c[0] === (DSC && DSC.type)) || [0, 0, 'free'])[2];
function d5Gray(c, maxSide){
  const k = Math.min(1, maxSide / Math.max(c.width, c.height)), w = Math.max(8, Math.round(c.width * k)), h = Math.max(8, Math.round(c.height * k));
  const t0 = document.createElement('canvas'); t0.width = w; t0.height = h; const x = t0.getContext('2d'); x.drawImage(c, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) g[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;
  return {w, h, g, d};
}

/* ---- straightening: the angle at which the text lines line up best (projection profile) ---- */
function d5SkewAngle(c){
  const {w, h, g} = d5Gray(c, 1000); let sum = 0; for (let i = 0; i < g.length; i++) sum += g[i];
  const mean = sum / g.length, th = Math.min(mean - 45, 150), mx = Math.round(w * 0.04), my = Math.round(h * 0.04), P = [];
  for (let y = my; y < h - my; y++) for (let x = mx; x < w - mx; x++){ const v = g[y * w + x]; if (v < th && g[y * w + x - 1] >= th) P.push(x, y); }   // left edges of ink: sharper peaks
  if (P.length < 600) return 0;
  const st = Math.max(1, Math.floor(P.length / 2 / 40000)) * 2;
  const score = a => { const tn = Math.tan(a * Math.PI / 180), off = Math.ceil(w * Math.abs(tn)) + 2, B = new Float32Array(h + 2 * off + 2);
    for (let i = 0; i < P.length; i += st) B[Math.round(P[i + 1] - P[i] * tn) + off]++;
    let s = 0; for (let i = 1; i < B.length; i++){ const d = B[i] - B[i - 1]; s += d * d; } return s; };
  const s0 = score(0); let best = 0, bs = s0;
  for (let a = -7; a <= 7.001; a += 0.5){ const s = score(a); if (s > bs){ bs = s; best = a; } }
  for (let a = best - 0.45; a <= best + 0.451; a += 0.05){ const s = score(a); if (s > bs){ bs = s; best = a; } }
  return bs > s0 * 1.08 ? Math.round(best * 100) / 100 : 0;
}
function d5Paper(c){
  const {g, d} = d5Gray(c, 64), idx = Array.from(g.keys()).sort((a, b) => g[b] - g[a]).slice(0, Math.max(1, Math.round(g.length * 0.3)));
  let r = 0, gg = 0, b = 0; idx.forEach(i => { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2]; }); const n = idx.length;
  return `rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})`;
}
function d5Straighten(p, a){
  if (!a) return false; const s = p.base, W = s.width, H = s.height, th = -a * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = d5Paper(s); x.fillRect(0, 0, W, H);
  x.imageSmoothingQuality = 'high'; x.translate(W / 2, H / 2); x.rotate(th); x.drawImage(s, -W / 2, -H / 2);
  const mv = (cx, cy) => { const px = (cx - 0.5) * W, py = (cy - 0.5) * H; return [(px * cs - py * sn) / W + 0.5, (px * sn + py * cs) / H + 0.5]; };
  p.red = (p.red || []).map(([rx, ry, rw, rh]) => { const [nx, ny] = mv(rx + rw / 2, ry + rh / 2); return [nx - rw / 2, ny - rh / 2, rw, rh]; });
  p.sig = (p.sig || []).map(sg => { const hF = sg.w * sg.c.height / sg.c.width * W / H, [nx, ny] = mv(sg.x + sg.w / 2, sg.y + hF / 2); return Object.assign({}, sg, {x: nx - sg.w / 2, y: ny - hF / 2}); });
  p.base = c; p._f = null; p._fk = null; p._d5 = null; p.skew = Math.round(((p.skew || 0) + a) * 100) / 100;
  return true;
}

/* ---- blank pages and pages scanned twice ---- */
function d5Info(p){
  if (p._d5 && p._d5b === p.base) return p._d5;
  const k = Math.min(1, 320 / Math.max(p.base.width, p.base.height)), s = document.createElement('canvas'); s.width = Math.max(8, Math.round(p.base.width * k)); s.height = Math.max(8, Math.round(p.base.height * k));
  s.getContext('2d').drawImage(p.base, 0, 0, s.width, s.height);
  /* ink = clearly darker than the paper around it (a blurred copy), so shadows and an uneven light don't count */
  const bgc = document.createElement('canvas'); bgc.width = s.width; bgc.height = s.height; const bx = bgc.getContext('2d'); bx.filter = 'blur(10px)'; bx.drawImage(s, 0, 0); bx.filter = 'none';
  const {w, h, g} = d5Gray(s, 320), B = d5Gray(bgc, 320).g, mx = Math.round(w * 0.06), my = Math.round(h * 0.06); let ink = 0, n = 0;
  for (let y = my; y < h - my; y++) for (let x = mx; x < w - mx; x++){ n++; if (g[y * w + x] < B[y * w + x] - 40) ink++; }
  /* a 40-pixel fingerprint, normalised – two pages match only when nearly every part looks the same */
  const q = d5Gray(s, 40), m = q.g.reduce((a, v) => a + v, 0) / q.g.length, sd = Math.sqrt(q.g.reduce((a, v) => a + (v - m) * (v - m), 0) / q.g.length) || 1, hash = Float32Array.from(q.g, v => (v - m) / sd);
  p._d5 = {blank: n ? ink / n < 0.0025 : false, hash, r: q.w / q.h}; p._d5b = p.base; return p._d5;
}
function d5Extra(){
  const P = (DSC && DSC.pages) || [], I = P.map(d5Info), blank = [], dup = [];
  I.forEach((a, i) => { if (a.blank){ blank.push(i); return; }
    for (let j = 0; j < i; j++){ const b = I[j]; if (b.blank || dup.some(d => d[0] === j) || Math.abs(a.r - b.r) > 0.08) continue; if (a.hash.length !== b.hash.length) continue; let cr = 0; for (let k = 0; k < a.hash.length; k++) cr += a.hash[k] * b.hash[k]; if (cr / a.hash.length >= 0.95){ dup.push([i, j]); break; } } });
  return {blank, dup};
}

/* ---- an open book: two pages in one photo ---- */
function d5Split(i){
  const p = DSC.pages[i]; if (!p) return; const s = p.base, W = s.width, H = s.height, {w, h, g} = d5Gray(s, 500);
  let gx = Math.round(w / 2), lo = 1e9; for (let x = Math.round(w * 0.42); x <= Math.round(w * 0.58); x++){ let sm = 0; for (let y = 0; y < h; y++) sm += g[y * w + x]; if (sm < lo){ lo = sm; gx = x; } }
  const cut = Math.round(gx / w * W), part = (x0, x1) => { const c = document.createElement('canvas'); c.width = x1 - x0; c.height = H; c.getContext('2d').drawImage(s, x0, 0, x1 - x0, H, 0, 0, x1 - x0, H); return {base: c, red: [], dpi: p.dpi, real: p.real, sharp: dsSharp(c)}; };
  const L = part(0, cut), R = part(cut, W), rtl = (document.documentElement.dir || '') === 'rtl';
  DSC.pages.splice(i, 1, ...(rtl ? [R, L] : [L, R]));
}

/* ---- clean edges, after the look and the brightness ---- */
{
  const f5 = dsFilter;
  dsFilter = function(c, f){
    const out = f5.apply(this, arguments); if (D5_RAW || !DSC || !DSC.edge) return out;
    const x = out.getContext('2d'), W = out.width, H = out.height, m = Math.max(2, Math.round(Math.min(W, H) * 0.025));
    x.fillStyle = f === 'orig' ? d5Paper(out) : '#fff'; x.fillRect(0, 0, W, m); x.fillRect(0, H - m, W, m); x.fillRect(0, 0, m, H); x.fillRect(W - m, 0, m, H);
    return out;
  };
}

/* ---- fit the PDF under a size limit ---- */
function d5Scale(c, k){ if (k >= 0.999) return c; const d = document.createElement('canvas'); d.width = Math.max(1, Math.round(c.width * k)); d.height = Math.max(1, Math.round(c.height * k)); const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height); return d; }
{
  const pdf5 = dsPdf;
  dsPdf = async function(pages, qual){
    const lim = DSC && +DSC.maxMB ? +DSC.maxMB * 1048576 : 0; let b = await pdf5.apply(this, arguments);
    if (DSC) DSC._fit = null; if (!lim) return b;
    if (b.size > lim){
      fit: for (const k of [1, 0.85, 0.72, 0.6, 0.5, 0.4, 0.32, 0.25]){
        const P = k === 1 ? pages : pages.map(pg => Object.assign({}, pg, {items: pg.items.map(it => Object.assign({}, it, {c: d5Scale(it.c, k)}))}));
        for (const q of [0.8, 0.7, 0.6, 0.5, 0.42]){ if (q >= qual && k === 1) continue; b = await pdf5.call(this, P, Math.min(q, qual)); if (b.size <= lim) break fit; }
      }
    }
    DSC._fit = {mb: b.size / 1048576, ok: b.size <= lim};
    const st = $('#d5_fitSt'); if (st) st.textContent = t(DSC._fit.ok ? 'd5_fitOk' : 'd5_fitNo', {s: N(DSC._fit.mb, 2), m: DSC.maxMB});
    return b;
  };
}

/* ---- automatic straightening right after a page is cut (documents, not cards) ---- */
{
  const cut5 = dsCut;
  dsCut = function(){
    const before = new Set((DSC && DSC.pages) || []), r = cut5.apply(this, arguments);
    if (!DSC || DSC.autoStr === false || !['a4', 'free'].includes(d5Size())) return r;
    const np = DSC.pages.find(p => !before.has(p)); if (!np || np.skew != null) return r;
    try { const a = d5SkewAngle(np.base); np.skew = 0; if (Math.abs(a) >= 0.3 && d5Straighten(np, a) && DSX.view === 'card'){ dscRender(); toast(t('d5_strOk', {a: N(Math.abs(a), 1)})); } } catch (e) {}
    return r;
  };
}

/* ---- a file name from the recognised text ---- */
function d5NameIdea(){
  const L = String((DSC && DSC.ocr) || '').split('\n').map(s => s.replace(/[\\/:*?"<>|_#=~^]+/g, ' ').replace(/\s+/g, ' ').trim()).filter(s => (s.match(/\p{L}/gu) || []).length >= 3);
  const s = L.find(x => x.length >= 4 && x.length <= 50) || L[0] || ''; return s.length > 50 ? s.slice(0, 48).replace(/\s+\S*$/, '') : s;
}

/* ---- wiring into the scanned-pages screen ---- */
{
  const card5 = dsCardRender;
  dsCardRender = function(root){
    const r = card5.apply(this, arguments); if (!DSC || DSC.cur) return r; const E = d4E, X = d5Extra();
    $$('#ds_root .ds-pg').forEach((fig, i) => { const p = DSC.pages[i], tl = fig.querySelector('.d4-tools'), cap = fig.querySelector('figcaption'); if (!p || !cap) return;
      const land = p.base.width > p.base.height * 1.15;
      if (tl && !tl.querySelector('[data-d5str]')) tl.insertAdjacentHTML('beforeend', `<button type="button" class="px-tb s" data-d5str="${i}" aria-label="${E(t('d5_str', {n: i + 1}))}" title="${E(t('d5_str', {n: i + 1}))}">📐</button>${land ? `<button type="button" class="px-tb s" data-d5split="${i}" aria-label="${E(t('d5_split', {n: i + 1}))}" title="${E(t('d5_split', {n: i + 1}))}">📖</button>` : ''}`);
      const d = X.dup.find(z => z[0] === i), tag = X.blank.includes(i) ? '⚪ ' + t('d5_blankT') : d ? '👯 ' + t('d5_dupT', {n: d[1] + 1}) : p.skew ? '📐 ' + t('d5_strT', {a: N(Math.abs(p.skew), 1)}) : '';
      if (tag && !cap.querySelector('.d5-tag')) cap.insertAdjacentHTML('beforeend', `<span class="d5-tag${p.skew && !d && !X.blank.includes(i) ? ' ok' : ''}">${E(tag)}</span>`); });
    const pg = root.querySelector('.ds-pages'), n = X.blank.length + X.dup.length;
    if (pg && n && !root.querySelector('.d5-ban')) pg.insertAdjacentHTML('beforebegin', `<div class="ds-warn d5-ban" role="status"><span aria-hidden="true">🧹</span><div><p>${E(t('d5_found', {b: X.blank.length, d: X.dup.length}))}</p><button type="button" class="btn" id="d5_clean">${E(t('d5_clean', {n}))}</button></div></div>`);
    const adj = root.querySelector('.d4-adj');
    if (adj && !root.querySelector('#d5_edge')) adj.insertAdjacentHTML('afterend', `<label class="prn-ck d5-ck"><input type="checkbox" id="d5_edge"${DSC.edge ? ' checked' : ''}> ${E(t('d5_edge'))}</label><label class="prn-ck d5-ck"><input type="checkbox" id="d5_auto"${DSC.autoStr !== false ? ' checked' : ''}> ${E(t('d5_auto'))}</label>`);
    const q = $('#ds_q'), qf = q && q.closest('.field');
    if (qf && !root.querySelector('#d5_max')) qf.insertAdjacentHTML('afterend', `<div class="field cv-f"><label for="d5_max">${E(t('d5_max'))}</label><select id="d5_max">${[0, 0.5, 1, 2, 5, 10].map(v => `<option value="${v}"${+(DSC.maxMB || 0) === v ? ' selected' : ''}>${E(v ? t('d5_mb', {m: v}) : t('d5_noMax'))}</option>`).join('')}</select></div><p class="fine" id="d5_fitSt" aria-live="polite">${DSC._fit ? E(t(DSC._fit.ok ? 'd5_fitOk' : 'd5_fitNo', {s: N(DSC._fit.mb, 2), m: DSC.maxMB})) : DSC.maxMB ? E(t('d5_maxH')) : ''}</p>`);
    const oc = $('#ds_ocrcopy'), idea = d5NameIdea();
    if (oc && idea && !root.querySelector('#d5_name') && String(DSC.name || '').trim() !== idea) oc.closest('.btnrow').insertAdjacentHTML('afterend', `<div class="btnrow"><button type="button" class="mv" id="d5_name">✍️ ${E(t('d5_name', {s: idea}))}</button></div>`);
    return r;
  };
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root') || !DSC) return; let b;
  if ((b = t0.closest('[data-d5str]'))){ const i = +b.dataset.d5str, p = DSC.pages[i]; if (!p) return; b.disabled = true;
    setTimeout(() => { const a = d5SkewAngle(p.base); if (Math.abs(a) >= 0.1 && d5Straighten(p, a)) toast(t('d5_strOk', {a: N(Math.abs(a), 1)})); else toast(t('d5_strNo')); dscRender(); const n = $(`[data-d5str="${i}"]`); if (n) n.focus(); }, 20); return; }
  if ((b = t0.closest('[data-d5split]'))){ const i = +b.dataset.d5split; b.disabled = true; setTimeout(() => { d5Split(i); dscRender(); toast(t('d5_splitOk')); }, 20); return; }
  if (t0.closest('#d5_clean')){ const X = d5Extra(), rm = new Set([...X.blank, ...X.dup.map(d => d[0])]); if (rm.size >= DSC.pages.length) return; DSC.pages = DSC.pages.filter((_, i) => !rm.has(i)); dscRender(); toast(t('d5_cleaned', {n: rm.size})); return; }
  if (t0.closest('#d5_name')){ DSC.name = d5NameIdea().slice(0, 60); toast(t('d5_named', {s: DSC.name})); dscRender(); }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !DSC || !el.closest || !el.closest('#ds_root')) return;
  if (el.id === 'd5_edge'){ DSC.edge = el.checked; DSC.pages.forEach(p => { p._f = null; p._fk = null; }); dsPagesDraw(); }
  else if (el.id === 'd5_auto') DSC.autoStr = el.checked;
  else if (el.id === 'd5_max'){ DSC.maxMB = +el.value; DSC._fit = null; const st = $('#d5_fitSt'); if (st) st.textContent = DSC.maxMB ? t('d5_maxH') : ''; }
});
try { GS_SYN.docscan += ' יישור אוטומטי עמוד ריק כפול ספר פתוח פיצול גודל קובץ דחיסה straighten deskew blank duplicate book split file size compress تقويم صفحة فارغة مكررة كتاب تقسيم حجم الملف ضغط'; } catch (e) {}

/* ---- details found in the recognised text: phone numbers, e-mails, links, dates and amounts – each with an action ---- */
function d5Found(){
  const s = String((DSC && DSC.ocr) || ''); if (!s.trim()) return [];
  const out = [], seen = new Set(), add = (k, v, show) => { const key = k + '|' + v; if (seen.has(key) || out.length >= 14) return; seen.add(key); out.push({k, v, show: show || v}); };
  (s.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) || []).forEach(m => add('mail', m));
  (s.match(/\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi) || []).forEach(m => add('link', m.replace(/[.,;:)]+$/, '')));
  (s.match(/(?:\+972[-\s]?|\b0)(?:[23489]|5\d|7\d)[-\s]?\d{3}[-\s]?\d{4}\b|\*\d{4}\b|\b1[-\s]?[78]00[-\s]?\d{2,3}[-\s]?\d{3,4}\b/g) || []).forEach(m => add('tel', m.replace(/[\s-]/g, ''), m.trim()));
  (s.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})\b/g) || []).forEach(m => { const [d, mo, y0] = m.split(/[./-]/).map(Number), y = y0 < 100 ? 2000 + y0 : y0; if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2000 && y <= 2100) add('date', `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, m); });
  (s.match(/(?:₪\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:₪|ש["״]ח|NIS|ILS))/g) || []).forEach(m => add('sum', m.replace(/[^\d.]/g, ''), m.trim()));
  return out;
}
function d5FoundHTML(){
  const F = d5Found(); if (!F.length) return ''; const E = d4E, ic = {mail: '✉️', link: '🔗', tel: '📞', date: '📅', sum: '💰'};
  return `<div class="d5-found"><h4 class="ds-q">🔎 ${E(t('d5_foundH'))}</h4><p class="fine">${E(t('d5_foundP'))}</p><div class="ds-chips">${F.map((f, i) => f.k === 'tel' ? `<a class="ds-chip" href="tel:${E(f.v)}">${ic.tel} <span dir="ltr">${E(f.show)}</span></a>`
    : f.k === 'mail' ? `<a class="ds-chip" href="mailto:${E(f.v)}">${ic.mail} <span dir="ltr">${E(f.show)}</span></a>`
    : f.k === 'link' ? `<a class="ds-chip" href="${E(/^https?:/i.test(f.v) ? f.v : 'https://' + f.v)}" target="_blank" rel="noopener noreferrer">${ic.link} <span dir="ltr">${E(f.show.slice(0, 40))}</span></a>`
    : `<button type="button" class="ds-chip" data-d5f="${i}" aria-label="${E(t(f.k === 'date' ? 'd5_fDate' : 'd5_fSum', {v: f.show}))}">${ic[f.k]} <span dir="ltr">${E(f.show)}</span></button>`
      + (f.k === 'date' && typeof rmNew === 'function' ? `<button type="button" class="ds-chip" data-d5r="${i}" aria-label="${E(t('d5_fRem', {v: f.show}))}">⏰ ${E(t('tab_reminders'))}</button>` : '')
      + (f.k === 'sum' && typeof expSheet === 'function' ? `<button type="button" class="ds-chip" data-d5x="${i}" aria-label="${E(t('d5_fExp', {v: f.show}))}">🧾 ${E(t('tab_expenses'))}</button>` : '')).join('')}</div></div>`;
}
{
  const card5b = dsCardRender;
  dsCardRender = function(root){
    const r = card5b.apply(this, arguments); if (!DSC || DSC.cur) return r;
    const oc = $('#ds_ocrcopy'); if (oc && !root.querySelector('.d5-found')){ const h = d5FoundHTML(), row = oc.closest('.btnrow'); if (h && row) row.insertAdjacentHTML('afterend', h); }
    return r;
  };
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#ds_root [data-d5f]'); if (!b || !DSC) return; const f = d5Found()[+b.dataset.d5f]; if (!f) return;
  if (f.k === 'sum'){ copyText(f.v); toast(t('st_copied')); return; }
  /* a date: a reminder in the phone's calendar, on that day */
  const d = f.v.replace(/-/g, ''), name = (String(DSC.name || '').trim() || t('ds_c_' + DSC.type)).replace(/[\;,\n]/g, ' '), now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//fincalc//docscan//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@fincalc', 'DTSTAMP:' + now, 'DTSTART;VALUE=DATE:' + d, 'SUMMARY:' + name, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + name, 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  fileSave(new Blob([ics], {type: 'text/calendar'}), (name + ' ' + f.v).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.ics', 'text/calendar').then(r => toast(t(r === 'saved' ? 'd5_fCal' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'))).catch(() => toast(t('pdf_fail')));
});

/* a date → a reminder; a sum → an expense (the category guessed from the store's name) */
const D5_CAT = [[/סופר|שופרסל|רמי לוי|יוחננוף|ויקטורי|אושר עד|מגה|טיב טעם|מכולת|supermarket|grocery|سوبر/i, 'food'], [/דלק|פז|סונול|דור אלון|ten\b|yellow|fuel|petrol|gas station|وقود/i, 'car'],
  [/חשמל|מים|ארנונה|גז|חברת החשמל|תאגיד|electric|water|كهرباء|مياه/i, 'bills'], [/סופר[-\s]?פארם|בית מרקחת|קופת חולים|מכבי|כללית|מאוחדת|לאומית|pharm|clinic|صيدلية/i, 'health'],
  [/מסעדה|קפה|בר\b|פיצה|restaurant|cafe|coffee|مطعم|مقهى/i, 'fun'], [/בגדים|אופנה|קסטרו|זארה|h&m|fashion|ملابس/i, 'clothes'], [/סלקום|פרטנר|פלאפון|הוט|בזק|גולן|cellcom|partner|bezeq|hot/i, 'comm'], [/ביטוח|insurance|تأمين/i, 'insur']];
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root') || !DSC) return; let b;
  if ((b = t0.closest('[data-d5r]'))){ const f = d5Found()[+b.dataset.d5r]; if (f) rmNew({title: (String(DSC.name || '').trim() || d5NameIdea() || t('ds_c_' + DSC.type)).slice(0, 80), date: f.v, cat: 'docs', before: 7}); return; }
  if ((b = t0.closest('[data-d5x]'))){ const f = d5Found()[+b.dataset.d5x]; if (!f) return;
    const txt = String(DSC.ocr || ''), hit = D5_CAT.find(([rx]) => rx.test(txt)), date = (d5Found().find(x => x.k === 'date') || {}).v, note = (String(DSC.name || '').trim() || d5NameIdea()).slice(0, 80);
    activate('expenses'); EXP_CAT = hit ? hit[1] : 'other'; expSheet(null);
    setTimeout(() => { const a = $('#exp_amt'), dt = $('#exp_date'), n = $('#exp_note'); if (a){ a.value = f.v; a.dispatchEvent(new Event('input', {bubbles: true})); } if (dt && date && date <= todayIso()) dt.value = date; if (n && note) n.value = note; }, 60);
  }
});
