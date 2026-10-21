/* 13.33: a sign for a business – "hold your phone here" for an NFC sticker, with a QR code for phones without NFC; logo, photo and a design of its own */
var BZX = {logo: null, photo: null, busy: false};
const bzE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const BZ_SIZES = {a6: [105, 148], a5: [148, 210], square: [80, 80], card: [85, 55], a4: [210, 297]};
const BZ_TPL = ['clean', 'bold', 'elegant', 'photo', 'gradient', 'night'];
const BZ_FONTS = {modern: '-apple-system,"Segoe UI","Heebo","Assistant",Arial,sans-serif', classic: 'Georgia,"Frank Ruhl Libre","David","Times New Roman",serif', round: '"Varela Round","Arial Rounded MT Bold","Rubik",Arial,sans-serif'};
const BZ_PAL = [['#0f766e', '#f0fdfa'], ['#9a3412', '#fff7ed'], ['#1d4ed8', '#eff6ff'], ['#7e22ce', '#faf5ff'], ['#be123c', '#fff1f2'], ['#14532d', '#f0fdf4'], ['#111827', '#f9fafb'], ['#b45309', '#fffbeb']];
function bzD(){
  if (!SET.sign || typeof SET.sign !== 'object') SET.sign = {};
  const d = SET.sign; const def = {name: '', tag: '', url: '', cta: '', sub: '', tpl: 'clean', size: 'a6', font: 'modern', c1: '#0f766e', c2: '#f0fdfa', qr: true, nfc: true, dots: false};
  Object.keys(def).forEach(k => { if (d[k] == null) d[k] = def[k]; }); return d;
}
/* the contactless symbol and a phone, drawn */
function bzNfcIcon(x, cx, cy, r, col){
  x.save(); x.strokeStyle = col; x.lineCap = 'round';
  x.lineWidth = r * 0.12; x.beginPath(); const pw = r * 0.62, ph = r * 1.05; const rr = r * 0.12;
  x.roundRect ? x.roundRect(cx - r * 0.9 - pw / 2, cy - ph / 2, pw, ph, rr) : x.rect(cx - r * 0.9 - pw / 2, cy - ph / 2, pw, ph); x.stroke();
  x.lineWidth = r * 0.1; [0.35, 0.62, 0.9].forEach((k, i) => { x.globalAlpha = 1 - i * 0.18; x.beginPath(); x.arc(cx - r * 0.1, cy, r * k, -0.75, 0.75); x.stroke(); });
  x.restore();
}
function bzWrap(x, text, maxW){ const words = String(text).split(/\s+/), out = []; let line = ''; words.forEach(w => { const tr = line ? line + ' ' + w : w; if (x.measureText(tr).width > maxW && line){ out.push(line); line = w; } else line = tr; }); if (line) out.push(line); return out; }
function bzText(x, text, cx, y, maxW, size, weight, col, font, maxLines){
  if (!text) return y; x.fillStyle = col; x.font = weight + ' ' + size + 'px ' + font; x.textAlign = 'center'; x.textBaseline = 'top';
  try { x.direction = /[֐-ۿ]/.test(text) ? 'rtl' : 'ltr'; } catch (e) {}
  let s = size; while (s > size * 0.55 && bzWrap(x, text, maxW).length > (maxLines || 2)){ s -= 2; x.font = weight + ' ' + s + 'px ' + font; }
  const L = bzWrap(x, text, maxW).slice(0, maxLines || 2); L.forEach((l, i) => x.fillText(l, cx, y + i * s * 1.18)); return y + L.length * s * 1.18;
}
function bzCover(x, img, W, H){ const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k; x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }
function bzDraw(px){
  const d = bzD(), [mw, mh] = BZ_SIZES[d.size] || BZ_SIZES.a6, W = Math.round(mw / 25.4 * (px || 300)), H = Math.round(mh / 25.4 * (px || 300));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), F = BZ_FONTS[d.font] || BZ_FONTS.modern;
  const u = Math.min(W, H) / 100, wide = W > H * 1.2, tpl = d.tpl === 'photo' && !BZX.photo ? 'bold' : d.tpl;
  let fg = '#111827', sub = '#4b5563', accent = d.c1, qrFg = '#111111', qrBg = '#ffffff', card = false;
  /* background */
  if (tpl === 'clean'){ x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = d.c1; x.fillRect(0, 0, W, u * 3); x.fillRect(0, H - u * 3, W, u * 3); }
  else if (tpl === 'bold'){ x.fillStyle = d.c1; x.fillRect(0, 0, W, H); fg = '#ffffff'; sub = 'rgba(255,255,255,.85)'; accent = '#ffffff'; card = true; }
  else if (tpl === 'elegant'){ x.fillStyle = d.c2; x.fillRect(0, 0, W, H); x.strokeStyle = d.c1; x.lineWidth = u * 0.8; x.strokeRect(u * 4, u * 4, W - u * 8, H - u * 8); x.lineWidth = u * 0.3; x.strokeRect(u * 5.6, u * 5.6, W - u * 11.2, H - u * 11.2); fg = d.c1; sub = '#57534e'; }
  else if (tpl === 'photo'){ bzCover(x, BZX.photo, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(1, 'rgba(0,0,0,.72)'); x.fillStyle = g; x.fillRect(0, 0, W, H); fg = '#ffffff'; sub = 'rgba(255,255,255,.9)'; accent = '#ffffff'; card = true; }
  else if (tpl === 'gradient'){ const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, d.c1); g.addColorStop(1, bzShade(d.c1, -0.45)); x.fillStyle = g; x.fillRect(0, 0, W, H); fg = '#ffffff'; sub = 'rgba(255,255,255,.88)'; accent = '#ffffff'; card = true; }
  else { x.fillStyle = '#0b0f19'; x.fillRect(0, 0, W, H); fg = '#ffffff'; sub = '#cbd5e1'; accent = d.c1; qrFg = '#0b0f19'; card = true; }
  const cta = d.cta || t('bz_ctaDef'), subTxt = d.sub || t('bz_subDef');
  const qText = String(d.url || '').trim(), q = d.qr && qText ? qrEncode(qText, 1, true) : null;
  if (!wide){
    let y = u * 9;
    if (BZX.logo){ const lh = u * 16, lw = Math.min(W * 0.55, lh * BZX.logo.width / BZX.logo.height); x.drawImage(BZX.logo, (W - lw) / 2, y, lw, lw * BZX.logo.height / BZX.logo.width); y += lw * BZX.logo.height / BZX.logo.width + u * 4; }
    y = bzText(x, d.name || t('bz_nameDef'), W / 2, y, W * 0.84, u * 8.5, '800', fg, F, 2) + u * 1;
    y = bzText(x, d.tag, W / 2, y, W * 0.8, u * 4.2, '500', sub, F, 2) + u * 4;
    if (d.nfc){ const r = u * (q ? 9 : 14); x.fillStyle = card ? 'rgba(255,255,255,.14)' : bzAlpha(d.c1, 0.1); x.beginPath(); x.arc(W / 2, y + r * 1.25, r * 1.25, 0, 7); x.fill(); bzNfcIcon(x, W / 2 + r * 0.4, y + r * 1.25, r, accent); y += r * 2.5 + u * 3; }
    y = bzText(x, d.nfc ? cta : subTxt, W / 2, y, W * 0.84, u * 5.6, '700', fg, F, 2) + u * 2.5;
    if (q){ const room = H - y - u * 12, s = Math.max(u * 18, Math.min(room, W * 0.5)), qc = qrCanvas(q, {scale: 10, margin: 2, fg: qrFg, bg: qrBg, dots: d.dots}), qx = (W - s) / 2;
      if (card){ x.fillStyle = '#ffffff'; bzRound(x, qx - u * 2, y - u * 2, s + u * 4, s + u * 4, u * 3); x.fill(); }
      x.imageSmoothingEnabled = false; x.drawImage(qc, qx, y, s, s); x.imageSmoothingEnabled = true; y += s + u * 3.5;
      if (d.nfc) bzText(x, subTxt, W / 2, y, W * 0.8, u * 3.6, '500', sub, F, 1); }
  } else {
    /* business card / landscape: text on one side, QR on the other */
    const qs = q ? H * 0.62 : 0, gap = u * 6, rtl = document.documentElement.dir === 'rtl', textW = W - qs - gap * 3, tx = rtl ? W - gap - textW / 2 : gap + textW / 2, qx = rtl ? gap : W - gap - qs;
    let y = u * 9;
    if (BZX.logo){ const lh = u * 14, lw = Math.min(textW * 0.6, lh * BZX.logo.width / BZX.logo.height), h2 = lw * BZX.logo.height / BZX.logo.width; x.drawImage(BZX.logo, tx - lw / 2, y, lw, h2); y += h2 + u * 3; }
    y = bzText(x, d.name || t('bz_nameDef'), tx, y, textW, u * 9, '800', fg, F, 2) + u;
    y = bzText(x, d.tag, tx, y, textW, u * 4.6, '500', sub, F, 1) + u * 3;
    if (d.nfc){ const r = u * 7; bzNfcIcon(x, tx + r * 0.4, y + r, r, accent); y += r * 2 + u * 2; }
    bzText(x, d.nfc ? cta : subTxt, tx, y, textW, u * 5, '700', fg, F, 2);
    if (q){ const qc = qrCanvas(q, {scale: 10, margin: 2, fg: qrFg, bg: qrBg, dots: d.dots}), qy = (H - qs) / 2; if (card){ x.fillStyle = '#ffffff'; bzRound(x, qx - u * 2, qy - u * 2, qs + u * 4, qs + u * 4, u * 3); x.fill(); } x.imageSmoothingEnabled = false; x.drawImage(qc, qx, qy, qs, qs); x.imageSmoothingEnabled = true; }
  }
  return c;
}
function bzRound(x, X, Y, w, h, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function bzRgb(h){ const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function bzHex(r, g, b){ return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function bzShade(h, k){ const [r, g, b] = bzRgb(h); return k < 0 ? bzHex(r * (1 + k), g * (1 + k), b * (1 + k)) : bzHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k); }
function bzAlpha(h, a){ const [r, g, b] = bzRgb(h); return `rgba(${r},${g},${b},${a})`; }
/* the logo's own colour becomes the sign's colour */
function bzLogoColor(img){
  try { const c = document.createElement('canvas'), n = 40; c.width = n; c.height = n; const x = c.getContext('2d'); x.drawImage(img, 0, 0, n, n); const p = x.getImageData(0, 0, n, n).data; let best = null, bs = 0;
    for (let i = 0; i < p.length; i += 4){ if (p[i + 3] < 200) continue; const r = p[i], g = p[i + 1], b = p[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, lum = (r + g + b) / 3; const score = sat * (lum > 30 && lum < 225 ? 1 : 0.2); if (score > bs){ bs = score; best = [r, g, b]; } }
    if (!best || bs < 0.25) return null; let [r, g, b] = best; const lum = 0.299 * r + 0.587 * g + 0.114 * b; if (lum > 150){ const k = 150 / lum; r *= k; g *= k; b *= k; } return bzHex(r, g, b); } catch (e) { return null; }
}
function bzRender(root){
  const E = bzE, d = bzD();
  root.innerHTML = dsBar('🪧 ' + t('bz_title')) + `<p class="fine">${E(t('bz_intro'))}</p>
    <div class="bz-grid">
      <div class="bz-form">
        <div class="field"><label for="bz_name">${E(t('bz_name'))}</label><div class="control"><input id="bz_name" data-bz="name" dir="auto" maxlength="40" value="${E(d.name)}" placeholder="${E(t('bz_nameDef'))}"></div></div>
        <div class="field"><label for="bz_tag">${E(t('bz_tag'))}</label><div class="control"><input id="bz_tag" data-bz="tag" dir="auto" maxlength="60" value="${E(d.tag)}" placeholder="${E(t('bz_tagPh'))}"></div></div>
        <div class="field"><label for="bz_url">${E(t('bz_url'))}</label><div class="control"><input id="bz_url" data-bz="url" type="url" dir="ltr" maxlength="300" value="${E(d.url)}" placeholder="https://"></div><small class="hint">${E(t('bz_urlH'))}</small></div>
        <div class="field"><label for="bz_cta">${E(t('bz_cta'))}</label><div class="control"><input id="bz_cta" data-bz="cta" dir="auto" maxlength="40" value="${E(d.cta)}" placeholder="${E(t('bz_ctaDef'))}"></div></div>
        <div class="btnrow bz-imgs"><label class="mv">🏷️ ${E(t(BZX.logo ? 'bz_logoCh' : 'bz_logo'))}<input type="file" accept="image/*" id="bz_logoF" hidden></label>${BZX.logo ? `<button type="button" class="mv" id="bz_logoX">✕</button>` : ''}
          <label class="mv">🖼️ ${E(t(BZX.photo ? 'bz_photoCh' : 'bz_photo'))}<input type="file" accept="image/*" id="bz_photoF" hidden></label>${BZX.photo ? `<button type="button" class="mv" id="bz_photoX">✕</button>` : ''}</div>
        <div class="bz-sec"><b>${E(t('bz_design'))}</b><div class="ds-chips">${BZ_TPL.map(k => `<button type="button" class="ds-chip${d.tpl === k ? ' on' : ''}" data-bztpl="${k}">${E(t('bz_t_' + k))}</button>`).join('')}</div></div>
        <div class="bz-sec"><b>${E(t('bz_colors'))}</b><div class="bz-pal">${BZ_PAL.map(([a, b], i) => `<button type="button" class="bz-sw${d.c1 === a ? ' on' : ''}" data-bzpal="${i}" style="background:${a}" aria-label="${E(t('bz_color', {n: i + 1}))}"></button>`).join('')}<label class="bz-own">🎨<input type="color" id="bz_c1" value="${E(d.c1)}" aria-label="${E(t('bz_own'))}"></label><button type="button" class="mv" id="bz_rand">🎲 ${E(t('bz_rand'))}</button></div></div>
        <div class="bz-row"><div class="field cv-f"><label for="bz_size">${E(t('bz_size'))}</label><select id="bz_size" data-bz="size">${Object.keys(BZ_SIZES).map(k => `<option value="${k}"${d.size === k ? ' selected' : ''}>${E(t('bz_s_' + k))}</option>`).join('')}</select></div>
          <div class="field cv-f"><label for="bz_font">${E(t('bz_font'))}</label><select id="bz_font" data-bz="font">${Object.keys(BZ_FONTS).map(k => `<option value="${k}"${d.font === k ? ' selected' : ''}>${E(t('bz_f_' + k))}</option>`).join('')}</select></div></div>
        <label class="prn-ck"><input type="checkbox" data-bzck="nfc"${d.nfc ? ' checked' : ''}> ${E(t('bz_nfcOn'))}</label>
        <label class="prn-ck"><input type="checkbox" data-bzck="qr"${d.qr ? ' checked' : ''}> ${E(t('bz_qrOn'))}</label>
        <label class="prn-ck"><input type="checkbox" data-bzck="dots"${d.dots ? ' checked' : ''}> ${E(t('bz_dots'))}</label>
      </div>
      <div class="bz-prev"><div id="bz_pv" class="bz-pv" aria-label="${E(t('bz_prev'))}"></div>
        <div class="btnrow"><button type="button" class="gold-btn" id="bz_png">⬇️ ${E(t('bz_png'))}</button><button type="button" class="mv" id="bz_pdf">📄 PDF</button><button type="button" class="mv" id="bz_print">🖨️ ${E(t('bz_print'))}</button><button type="button" class="mv" id="bz_share">📤 ${E(t('bz_share'))}</button></div>
        <div class="btnrow"><button type="button" class="btn" id="bz_write">✍️ ${E(t('bz_write'))}</button></div>
        <p class="fine">${E(t('bz_how'))}</p></div>
    </div>`;
  bzPreview();
}
let BZ_T = 0;
function bzPreview(){ const pv = document.getElementById('bz_pv'); if (!pv) return; clearTimeout(BZ_T); BZ_T = setTimeout(() => { try { const c = bzDraw(110); c.className = 'bz-cv'; pv.replaceChildren(c); } catch (e) { pv.textContent = '⚠️'; } }, 60); }
async function bzOut(how){
  const d = bzD(); if (d.qr && !String(d.url || '').trim()){ toast(t('bz_needUrl')); const i = document.getElementById('bz_url'); if (i) i.focus(); return; }
  const c = bzDraw(300), name = ((d.name || t('bz_title')) + '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'sign';
  if (how === 'print'){ const [mw] = BZ_SIZES[d.size]; try { prnClean(); } catch (e) {} document.body.insertAdjacentHTML('beforeend', `<div id="prn_area" class="prn-qr"><img src="${c.toDataURL('image/png')}" alt="" style="width:${mw}mm;display:block;margin:10mm auto"></div>`); try { prnStyle('qr'); } catch (e) {} document.body.classList.add('prn-on'); PRN.live = true; PRN_FIRED = false; setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(() => { if (!PRN_FIRED){ prnClean(); toast(t('prn_blocked')); } }, 700); }, 120); return; }
  if (how === 'pdf'){ const [mw, mh] = BZ_SIZES[d.size], k = 72 / 25.4, w = mw * k, h = mh * k, items = [];
    const cols = Math.max(1, Math.floor((595.28 - 40) / (w + 14))), rows = Math.max(1, Math.floor((841.89 - 40) / (h + 14))), tile = d.size === 'card' || d.size === 'square';
    if (tile){ const gx = (595.28 - cols * w - (cols - 1) * 14) / 2, gy = (841.89 - rows * h - (rows - 1) * 14) / 2; for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) items.push({c, x: gx + cc * (w + 14), y: gy + r * (h + 14), w, h, frame: true}); }
    else items.push({c, x: (595.28 - w) / 2, y: (841.89 - h) / 2, w, h, frame: d.size !== 'a4'});
    try { const blob = await dsPdf([{items}], 0.95), r = await fileSave(blob, name + '.pdf', 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : 'pdf_fail')); } catch (e) { toast(t('pdf_fail')); } return; }
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); if (!blob) return;
  if (how === 'share'){ const f = new File([blob], name + '.png', {type: 'image/png'}); try { if (navigator.canShare && navigator.canShare({files: [f]})){ await navigator.share({files: [f]}); return; } } catch (e) { if (e && e.name === 'AbortError') return; } }
  const r = await fileSave(blob, name + '.png', 'image/png'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
}
async function bzImg(file, kind){
  if (!file) return; try { const c = await dsLoad(file); const img = new Image(); img.src = c.toDataURL('image/png'); await img.decode();
    BZX[kind] = img; const d = bzD();
    if (kind === 'logo'){ const col = bzLogoColor(img); if (col){ d.c1 = col; d.c2 = bzShade(col, 0.92); saveSet(); } }
    if (kind === 'photo' && d.tpl !== 'photo'){ d.tpl = 'photo'; saveSet(); }
    dscRender(); } catch (e) { toast(t('bz_imgFail')); }
}
{ const dsrSg = dscRender; dscRender = function(){
  const root = document.getElementById('ds_root');
  if (root && DSX.view === 'sign') return bzRender(root);
  const r = dsrSg.apply(this, arguments);
  try { const row = root && root.querySelector('.ds-toolrow'); if (row && !row.querySelector('[data-dstool="sign"]')) row.insertAdjacentHTML('beforeend', `<button type="button" class="ds-tool" data-dstool="sign"><span aria-hidden="true">🪧</span><b>${bzE(t('dst_sign'))}</b><small>${bzE(t('dst_signH'))}</small></button>`); } catch (e) {}
  return r;
}; }
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('[data-dstool="sign"]')){ DSX.view = 'sign'; dscRender(); return; }
  if (!t0.closest('#ds_root') || DSX.view !== 'sign') return; const d = bzD();
  if ((b = t0.closest('[data-bztpl]'))){ d.tpl = b.dataset.bztpl; saveSet(); dscRender(); return; }
  if ((b = t0.closest('[data-bzpal]'))){ const [a, c2] = BZ_PAL[+b.dataset.bzpal]; d.c1 = a; d.c2 = c2; saveSet(); dscRender(); return; }
  if (t0.closest('#bz_rand')){ const h = Math.floor(Math.random() * 360), s = 55 + Math.random() * 25, l = 28 + Math.random() * 14; const f = n => { const k = (n + h / 30) % 12, a = s / 100 * Math.min(l / 100, 1 - l / 100); return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; d.c1 = bzHex(f(0) * 255, f(8) * 255, f(4) * 255); d.c2 = bzShade(d.c1, 0.92); d.tpl = BZ_TPL[Math.floor(Math.random() * BZ_TPL.length)]; if (d.tpl === 'photo' && !BZX.photo) d.tpl = 'gradient'; d.font = Object.keys(BZ_FONTS)[Math.floor(Math.random() * 3)]; saveSet(); dscRender(); return; }
  if (t0.closest('#bz_logoX')){ BZX.logo = null; dscRender(); return; }
  if (t0.closest('#bz_photoX')){ BZX.photo = null; if (d.tpl === 'photo') d.tpl = 'clean'; saveSet(); dscRender(); return; }
  if (t0.closest('#bz_png')){ bzOut('png'); return; } if (t0.closest('#bz_pdf')){ bzOut('pdf'); return; } if (t0.closest('#bz_print')){ bzOut('print'); return; } if (t0.closest('#bz_share')){ bzOut('share'); return; }
  if (t0.closest('#bz_write')){ const u = String(d.url || '').trim(); if (!u){ toast(t('bz_needUrl')); return; } NFX.type = 'url'; NFX.f.url = u; NFX.tab = 'write'; DSX.view = 'nfc'; dscRender(); }
});
document.addEventListener('input', e => { const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'sign') return; const d = bzD();
  if (el.dataset.bz){ d[el.dataset.bz] = el.value; bzPreview(); try { clearTimeout(bzD.t); bzD.t = setTimeout(saveSet, 600); } catch (er) {} }
  if (el.id === 'bz_c1'){ d.c1 = el.value; d.c2 = bzShade(el.value, 0.92); bzPreview(); clearTimeout(bzD.t); bzD.t = setTimeout(saveSet, 600); } });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'sign') return; const d = bzD();
  if (el.id === 'bz_logoF' || el.id === 'bz_photoF'){ const f = el.files && el.files[0]; el.value = ''; bzImg(f, el.id === 'bz_logoF' ? 'logo' : 'photo'); return; }
  if (el.dataset.bzck){ d[el.dataset.bzck] = el.checked; saveSet(); bzPreview(); return; }
  if (el.tagName === 'SELECT' && el.dataset.bz){ d[el.dataset.bz] = el.value; saveSet(); bzPreview(); } });
try { Object.assign(GS_SYN, {docscan: (GS_SYN.docscan || '') + ' שלט לעסק שלט nfc מדבקה קרבו את הטלפון business sign sticker لافتة'}); } catch (e) {}
Object.assign(T, {
  dst_sign:['שלט לעסק','لافتة للمصلحة','Business sign'], dst_signH:['NFC + QR עם עיצוב משלכם','NFC + QR بتصميمكم','NFC + QR in your own design'],
  bz_title:['שלט לעסק','لافتة للمصلحة','Business sign'], bz_intro:['שלט להדבקה מעל מדבקת NFC: לקוחות מקרבים את הטלפון, ומי שאין לו NFC סורק את הקוד. הלוגו, התמונה והצבעים – שלכם.','لافتة تُلصق فوق ملصق NFC: الزبائن يقرّبون الهاتف، ومن لا يملك NFC يمسح الرمز. الشعار والصورة والألوان – لكم.','A sign to stick over an NFC sticker: customers tap their phone, and anyone without NFC scans the code. Your logo, photo and colours.'],
  bz_name:['שם העסק','اسم المصلحة','Business name'], bz_nameDef:['שם העסק','اسم المصلحة','Your business'], bz_tag:['שורה נוספת','سطر إضافي','Extra line'], bz_tagPh:['למשל: התפריט שלנו · ביקורת בגוגל · וואטסאפ','مثلًا: قائمتنا · تقييم في غوغل · واتساب','e.g. Our menu · Google review · WhatsApp'],
  bz_url:['הקישור שהלקוח יגיע אליו','الرابط الذي يصل إليه الزبون','The link customers reach'], bz_urlH:['אותו קישור נכתב למדבקת ה־NFC ונכנס לקוד ה־QR','نفس الرابط يُكتب على ملصق NFC ويدخل في رمز QR','The same link goes on the NFC sticker and into the QR code'],
  bz_cta:['הכיתוב הראשי','النص الرئيسي','Main text'], bz_ctaDef:['קרבו את הטלפון כאן','قرّبوا الهاتف هنا','Tap your phone here'], bz_subDef:['או סרקו את הקוד במצלמה','أو امسحوا الرمز بالكاميرا','or scan the code with your camera'],
  bz_logo:['הוספת לוגו','إضافة شعار','Add a logo'], bz_logoCh:['החלפת לוגו','تغيير الشعار','Change logo'], bz_photo:['תמונת רקע','صورة خلفية','Background photo'], bz_photoCh:['החלפת תמונה','تغيير الصورة','Change photo'], bz_imgFail:['לא הצלחתי לטעון את התמונה','لم أتمكن من تحميل الصورة','Couldn\'t load the image'],
  bz_design:['עיצוב','التصميم','Design'], bz_t_clean:['נקי','بسيط','Clean'], bz_t_bold:['צבעוני','ملوّن','Bold'], bz_t_elegant:['אלגנטי','أنيق','Elegant'], bz_t_photo:['תמונה','صورة','Photo'], bz_t_gradient:['מעבר צבע','تدرّج','Gradient'], bz_t_night:['כהה','داكن','Dark'],
  bz_colors:['צבעים','الألوان','Colours'], bz_color:['צבע {n}','لون {n}','Colour {n}'], bz_own:['צבע משלכם','لونكم الخاص','Your own colour'], bz_rand:['הפתעה','مفاجأة','Surprise me'],
  bz_size:['גודל','الحجم','Size'], bz_s_a6:['A6 – שלט שולחן','A6 – لافتة طاولة','A6 – table sign'], bz_s_a5:['A5 – שלט בינוני','A5 – لافتة متوسطة','A5 – medium sign'], bz_s_square:['מדבקה 8×8 ס״מ','ملصق 8×8 سم','Sticker 8×8 cm'], bz_s_card:['כרטיס ביקור','بطاقة عمل','Business card'], bz_s_a4:['A4 – שלט גדול','A4 – لافتة كبيرة','A4 – large sign'],
  bz_font:['גופן','الخط','Font'], bz_f_modern:['מודרני','حديث','Modern'], bz_f_classic:['קלאסי','كلاسيكي','Classic'], bz_f_round:['מעוגל','دائري','Rounded'],
  bz_nfcOn:['סמל NFC וכיתוב "קרבו את הטלפון"','رمز NFC ونص "قرّبوا الهاتف"','NFC symbol and "tap your phone" text'], bz_qrOn:['קוד QR לגיבוי','رمز QR احتياطي','Backup QR code'], bz_dots:['קוד QR בנקודות','رمز QR بالنقاط','Dotted QR code'],
  bz_prev:['תצוגה מקדימה','معاينة','Preview'], bz_png:['שמירת תמונה','حفظ صورة','Save image'], bz_print:['הדפסה','طباعة','Print'], bz_share:['שיתוף','مشاركة','Share'], bz_write:['כתיבת הקישור למדבקת NFC','كتابة الرابط إلى ملصق NFC','Write the link to an NFC sticker'],
  bz_needUrl:['כתבו קודם את הקישור','اكتبوا الرابط أولًا','Enter the link first'],
  bz_how:['מדפיסים, מדביקים מדבקת NFC מאחורי הסמל, וכותבים אליה את הקישור בכפתור למעלה (Chrome באנדרואיד). מדבקות NTAG213/215 מתאימות.','اطبعوا، ألصقوا ملصق NFC خلف الرمز، واكتبوا إليه الرابط بالزر أعلاه (Chrome على أندرويد). ملصقات NTAG213/215 مناسبة.','Print it, put an NFC sticker behind the symbol, and write the link to it with the button above (Chrome on Android). NTAG213/215 stickers work.'],
});
