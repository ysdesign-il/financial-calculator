/* 13.33: a sign for a business – "hold your phone here" for an NFC sticker, with a QR code for phones without NFC; logo, photo and a design of its own */
var BZX = {logo: null, photo: null, busy: false};
const bzE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const BZ_SIZES = {a6: [105, 148], a5: [148, 210], square: [80, 80], card: [85, 55], a4: [210, 297]};
const BZ_TPL = ['clean', 'wave', 'bold', 'elegant', 'photo', 'gradient', 'night'];
const BZ_FONTS = {modern: '-apple-system,"Segoe UI","Heebo","Assistant",Arial,sans-serif', classic: 'Georgia,"Frank Ruhl Libre","David","Times New Roman",serif', round: '"Varela Round","Arial Rounded MT Bold","Rubik",Arial,sans-serif'};
const BZ_PAL = [['#0f766e', '#f0fdfa'], ['#9a3412', '#fff7ed'], ['#1d4ed8', '#eff6ff'], ['#7e22ce', '#faf5ff'], ['#be123c', '#fff1f2'], ['#14532d', '#f0fdf4'], ['#111827', '#f9fafb'], ['#b45309', '#fffbeb']];
function bzD(){
  if (!SET.sign || typeof SET.sign !== 'object') SET.sign = {};
  const d = SET.sign; const def = {name: '', tag: '', url: '', cta: '', sub: '', tpl: 'clean', size: 'a6', font: 'modern', c1: '#0f766e', c2: '#f0fdfa', qr: true, nfc: true, dots: false, shape: 'rect'};
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
function bzDraw(px, opt){
  opt = opt || {};
  const d = bzD(), [mw, mh] = opt.dims || BZ_SIZES[d.size] || BZ_SIZES.a6, W = Math.round(mw / 25.4 * (px || 300)), H = Math.round(mh / 25.4 * (px || 300));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), F = BZ_FONTS[d.font] || BZ_FONTS.modern;
  const u = Math.min(W, H) / 100, wide = W > H * 1.2, tpl0 = d.tpl === 'photo' && !BZX.photo ? 'gradient' : d.tpl, tpl = opt.noBg && (tpl0 === 'wave' || tpl0 === 'photo') ? 'clean' : tpl0, c1 = d.c1, dk = bzShade(c1, -0.42), lt = bzShade(c1, 0.9);
  /* colours of each design: text, soft text, accent, does the content sit on a light card */
  const S = {clean: ['#111827', '#6b7280', c1, false], bold: ['#ffffff', 'rgba(255,255,255,.86)', '#ffffff', false], elegant: [dk, '#78716c', c1, false], photo: ['#111827', '#6b7280', c1, false],
    gradient: ['#ffffff', 'rgba(255,255,255,.88)', '#ffffff', false], night: ['#ffffff', '#cbd5e1', bzShade(c1, 0.35), false], wave: ['#111827', '#6b7280', c1, false]}[tpl] || ['#111827', '#6b7280', c1, false];
  let [fg, sub, accent] = S;
  /* ---- backgrounds ---- */
  let top = 0;                                   /* where the content area starts (below a picture band) */
  if (!opt.noBg){
  const blob = (cx, cy, r, col) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
  if (tpl === 'clean'){ x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); blob(0, 0, W * 0.75, bzAlpha(c1, 0.16)); blob(W, H, W * 0.8, bzAlpha(c1, 0.12)); x.fillStyle = c1; x.fillRect(0, H - u * 2.2, W, u * 2.2); }
  else if (tpl === 'bold'){ x.fillStyle = c1; x.fillRect(0, 0, W, H); x.save(); x.globalAlpha = 0.08; x.strokeStyle = '#fff'; x.lineWidth = u * 1.6; for (let k = -H; k < W; k += u * 7){ x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); } x.restore(); blob(W * 0.85, H * 0.12, W * 0.55, 'rgba(255,255,255,.18)'); }
  else if (tpl === 'elegant'){ x.fillStyle = d.c2 || lt; x.fillRect(0, 0, W, H); blob(W / 2, H * 0.35, W * 0.7, 'rgba(255,255,255,.7)'); if (!opt.shape){ x.strokeStyle = c1; x.lineWidth = u * 0.7; x.strokeRect(u * 4, u * 4, W - u * 8, H - u * 8); x.lineWidth = u * 0.25; x.strokeRect(u * 5.5, u * 5.5, W - u * 11, H - u * 11);
    x.fillStyle = c1; [[u * 4, u * 4], [W - u * 4, u * 4], [u * 4, H - u * 4], [W - u * 4, H - u * 4]].forEach(([a, b]) => { x.save(); x.translate(a, b); x.rotate(Math.PI / 4); x.fillRect(-u * 1.3, -u * 1.3, u * 2.6, u * 2.6); x.restore(); }); } }
  else if (tpl === 'photo' && wide){ bzCover(x, BZX.photo, W, H); x.fillStyle = 'rgba(255,255,255,.84)'; x.fillRect(0, 0, W, H); x.fillStyle = c1; x.fillRect(0, H - u * 2.2, W, u * 2.2); }
  else if (tpl === 'photo'){ const band = H * (BZX.logo ? 0.28 : 0.36) * (H > W * 1.15 ? 1 : 0.8); x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.save(); x.beginPath(); x.rect(0, 0, W, band); x.clip(); bzCover(x, BZX.photo, W, band); const g = x.createLinearGradient(0, band * 0.4, 0, band); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = g; x.fillRect(0, 0, W, band); x.restore();
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(0, band - u * 6); x.quadraticCurveTo(W / 2, band + u * 5, W, band - u * 6); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fill(); x.fillStyle = c1; x.fillRect(0, H - u * 2.2, W, u * 2.2); top = band - u * 2; }
  else if (tpl === 'gradient'){ const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, bzShade(c1, 0.12)); g.addColorStop(1, dk); x.fillStyle = g; x.fillRect(0, 0, W, H); blob(W * 0.15, H * 0.1, W * 0.7, 'rgba(255,255,255,.22)'); blob(W * 0.95, H * 0.75, W * 0.6, bzAlpha(bzShade(c1, 0.5), 0.35)); }
  else if (tpl === 'night'){ x.fillStyle = '#0a0e17'; x.fillRect(0, 0, W, H); blob(W / 2, H * 0.42, W * 0.7, bzAlpha(c1, 0.35)); x.save(); x.globalAlpha = 0.06; x.fillStyle = '#fff'; for (let yy = u * 3; yy < H; yy += u * 4) for (let xx = u * 3; xx < W; xx += u * 4){ x.beginPath(); x.arc(xx, yy, u * 0.35, 0, 7); x.fill(); } x.restore(); }
  else if (tpl === 'wave' && wide){ x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, H * 0.7, W, H); g.addColorStop(0, c1); g.addColorStop(1, dk); x.fillStyle = g; x.beginPath(); x.moveTo(0, H); x.lineTo(W, H); x.lineTo(W, H * 0.8); x.bezierCurveTo(W * 0.65, H * 0.95, W * 0.35, H * 0.7, 0, H * 0.86); x.closePath(); x.fill(); }
  else if (tpl === 'wave' && !wide){ x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); }
  else if (tpl === 'wave' && false){ const band = 0, g = x.createLinearGradient(0, 0, W, 1); g.addColorStop(0, c1); g.addColorStop(1, dk); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, band * 0.85); x.bezierCurveTo(W * 0.7, band * 1.25, W * 0.3, band * 0.55, 0, band); x.closePath(); x.fill();
    x.fillStyle = bzAlpha(c1, 0.12); x.beginPath(); x.moveTo(0, H); x.lineTo(W, H); x.lineTo(W, H - u * 10); x.bezierCurveTo(W * 0.6, H - u * 2, W * 0.35, H - u * 16, 0, H - u * 7); x.closePath(); x.fill(); }
  }
  if (opt.bgOnly) return c;
  const cta = d.cta || t('bz_ctaDef'), subTxt = d.sub || t('bz_subDef'), qText = String(d.url || '').trim(), q = d.qr && qText ? qrEncode(qText, 1, true) : null;
  let host = ''; try { host = qText ? new URL(/^[a-z]+:/i.test(qText) ? qText : 'https://' + qText).hostname.replace(/^www\./, '') : ''; } catch (e) {}
  const qrCard = (qx, qy, s) => { const qc = qrCanvas(q, {scale: 10, margin: 1, fg: '#111111', bg: '#ffffff', dots: d.dots}), p2 = u * 2.4; x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = u * 3; x.shadowOffsetY = u * 0.8; x.fillStyle = '#ffffff'; bzRound(x, qx - p2, qy - p2, s + p2 * 2, s + p2 * 2, u * 3); x.fill(); x.restore(); x.imageSmoothingEnabled = false; x.drawImage(qc, qx, qy, s, s); x.imageSmoothingEnabled = true; };
  const badge = (cx, cy, r) => { x.save(); const ring = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); const onDark = fg === '#ffffff';
      x.fillStyle = onDark ? 'rgba(255,255,255,.14)' : bzAlpha(c1, 0.1); x.beginPath(); x.arc(cx, cy, r * 1.32, 0, 7); x.fill();
      ring.addColorStop(0, onDark ? 'rgba(255,255,255,.95)' : bzShade(c1, 0.15)); ring.addColorStop(1, onDark ? 'rgba(255,255,255,.55)' : dk); x.strokeStyle = ring; x.lineWidth = r * 0.07; x.beginPath(); x.arc(cx, cy, r * 1.12, 0, 7); x.stroke();
      if (tpl === 'night'){ x.shadowColor = accent; x.shadowBlur = r * 0.5; }
      x.fillStyle = onDark ? 'rgba(255,255,255,.08)' : '#ffffff'; x.beginPath(); x.arc(cx, cy, r * 0.98, 0, 7); x.fill(); x.restore();
      bzNfcIcon(x, cx + r * 0.32, cy - r * 0.05, r * 0.72, accent);
      const pill = 'NFC'; x.font = '800 ' + Math.round(r * 0.28) + 'px ' + F; const pw = x.measureText(pill).width + r * 0.36, ph = r * 0.42; x.fillStyle = onDark ? '#ffffff' : c1; bzRound(x, cx - pw / 2, cy + r * 0.98, pw, ph, ph / 2); x.fill(); x.fillStyle = onDark ? (tpl === 'night' ? '#0a0e17' : c1) : '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.direction = 'ltr'; } catch (e) {} x.fillText(pill, cx, cy + r * 0.98 + ph / 2 + r * 0.01); };
  const ctaPill = (cx, y, maxW, text) => { const fs = u * 4.6; x.font = '700 ' + fs + 'px ' + F; let tw = x.measureText(text).width; const k = tw > maxW * 0.86 ? maxW * 0.86 / tw : 1; const f2 = fs * k; x.font = '700 ' + f2 + 'px ' + F; tw = x.measureText(text).width;
      const ph = f2 * 2.1, pw = tw + f2 * 2.2, onDark = fg === '#ffffff'; x.fillStyle = onDark ? '#ffffff' : c1; bzRound(x, cx - pw / 2, y, pw, ph, ph / 2); x.fill();
      x.fillStyle = onDark ? (tpl === 'night' ? '#0a0e17' : c1) : '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.direction = /[֐-ۿ]/.test(text) ? 'rtl' : 'ltr'; } catch (e) {} x.fillText(text, cx, y + ph / 2 + f2 * 0.04); return y + ph; };
  const divider = (cx, y, w) => { x.save(); x.strokeStyle = tpl === 'elegant' ? c1 : (fg === '#ffffff' ? 'rgba(255,255,255,.5)' : bzAlpha(c1, 0.5)); x.lineWidth = u * 0.35; x.beginPath(); x.moveTo(cx - w / 2, y); x.lineTo(cx - u * 2, y); x.moveTo(cx + u * 2, y); x.lineTo(cx + w / 2, y); x.stroke(); x.fillStyle = x.strokeStyle; x.translate(cx, y); x.rotate(Math.PI / 4); x.fillRect(-u * 0.9, -u * 0.9, u * 1.8, u * 1.8); x.restore(); };
  if (!wide){
    const nameCol = tpl === 'photo' ? '#111827' : tpl === 'wave' ? '#ffffff' : fg, tagCol = tpl === 'photo' ? '#6b7280' : tpl === 'wave' ? 'rgba(255,255,255,.88)' : sub;
    let headEnd = 0;
    const lay = draw => {
      const X = draw ? x : null; let y = 0; const meas = (fn) => { if (!draw){ const sv = x.save.bind(x); x.save(); const r = fn(); x.restore(); return r; } return fn(); };
      if (BZX.logo){ const lw = Math.min(W * 0.42, u * 22 * BZX.logo.width / BZX.logo.height), lh = lw * BZX.logo.height / BZX.logo.width;
        if (draw){ const b = u * 2; x.save(); x.shadowColor = 'rgba(0,0,0,.15)'; x.shadowBlur = u * 2; x.fillStyle = '#ffffff'; bzRound(x, (W - lw) / 2 - b, y - b, lw + b * 2, lh + b * 2, u * 3); x.fill(); x.restore(); x.drawImage(BZX.logo, (W - lw) / 2, y, lw, lh); }
        y += lh + u * 6; }
      y = meas(() => bzText(draw ? x : bzGhost(x), d.name || t('bz_nameDef'), W / 2, y, W * 0.82, u * 9, '800', nameCol, F, 2)) + u * 0.6;
      if (d.tag){ y = meas(() => bzText(draw ? x : bzGhost(x), d.tag, W / 2, y, W * 0.78, u * 4.2, '500', tagCol, F, 2)) + u * 2; }
      if (!draw) headEnd = y;
      if (draw && tpl !== 'wave') divider(W / 2, y + u * 1.5, W * 0.32); y += u * (tpl === 'wave' ? 8 : 5);
      if (d.nfc){ const r = u * (q ? 9.5 : 15); if (draw) badge(W / 2, y + r * 1.32, r); y += r * 2.64 + r * 0.55 + u * 2; }
      if (draw) ctaPill(W / 2, y, W * 0.84, d.nfc ? cta : subTxt); y += u * 4.6 * 2.1 + u * 4;
      if (q){ const s = Math.min(W * 0.42, Math.max(u * 22, H - y - u * 20 - top)); if (draw) qrCard((W - s) / 2, y + u * 2.4, s); y += s + u * 4.8 + u * 2.4;
        if (draw){ const t2 = d.nfc ? subTxt : ''; let yy = y; if (t2) yy = bzText(x, t2, W / 2, yy, W * 0.8, u * 3.5, '600', (tpl === 'wave' || tpl === 'photo' || tpl === 'clean' || tpl === 'elegant') ? '#4b5563' : sub, F, 1); if (host) bzText(x, host, W / 2, yy + u * 0.6, W * 0.8, u * 3.1, '700', (tpl === 'wave' || tpl === 'photo' || tpl === 'clean' || tpl === 'elegant') ? c1 : fg, F, 1); }
        y += u * 8; }
      return y; };
    const used = lay(false), room = H - top - u * 12, k = used > room ? room / used : 1;
    let y0 = top + Math.max(u * 6, (H - top - used * k) / 2);
    if (tpl === 'wave' && !opt.noBg){ y0 = u * 7; const band = y0 + headEnd * k + u * 5, g = x.createLinearGradient(0, 0, W, band); g.addColorStop(0, c1); g.addColorStop(1, dk); x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = g;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, band); x.bezierCurveTo(W * 0.7, band + u * 9, W * 0.3, band - u * 5, 0, band + u * 4); x.closePath(); x.fill();
      x.fillStyle = bzAlpha(c1, 0.12); x.beginPath(); x.moveTo(0, H); x.lineTo(W, H); x.lineTo(W, H - u * 10); x.bezierCurveTo(W * 0.6, H - u * 2, W * 0.35, H - u * 16, 0, H - u * 7); x.closePath(); x.fill();
      y0 = Math.max(y0, (H - used * k) / 2 > y0 ? y0 : y0); }
    x.save(); x.translate(W * (1 - k) / 2, y0); x.scale(k, k); lay(true); x.restore();
  } else {
    const qs = q ? H * 0.6 : 0, gap = u * 6, rtl = document.documentElement.dir === 'rtl', textW = W - qs - gap * 3, tx = rtl ? W - gap - textW / 2 : gap + textW / 2, qx = rtl ? gap * 1.2 : W - gap * 1.2 - qs;
    const nameCol = tpl === 'wave' || tpl === 'photo' ? '#111827' : fg;
    let y = u * 10;
    if (BZX.logo){ const lw = Math.min(textW * 0.5, u * 13 * BZX.logo.width / BZX.logo.height), h2 = lw * BZX.logo.height / BZX.logo.width; x.drawImage(BZX.logo, tx - lw / 2, y, lw, h2); y += h2 + u * 3; }
    y = bzText(x, d.name || t('bz_nameDef'), tx, y, textW, u * 9.5, '800', nameCol, F, 2) + u;
    if (d.tag) y = bzText(x, d.tag, tx, y, textW, u * 4.6, '500', tpl === 'wave' || tpl === 'photo' ? '#6b7280' : sub, F, 1) + u * 3;
    if (d.nfc){ const r = u * 7.5; badge(tx, y + r * 1.32, r); y += r * 3.3; }
    ctaPill(tx, y, textW, d.nfc ? cta : subTxt);
    if (q) qrCard(qx, (H - qs) / 2, qs);
  }
  return c;
}
/* the sign in the chosen shape: rectangle (by size), square, circle or triangle – the content is fitted inside the shape */
function bzShapePath(x, sh, S){ x.beginPath(); if (sh === 'circle'){ x.arc(S / 2, S / 2, S / 2 - S * 0.006, 0, 7); } else if (sh === 'triangle'){ const r = S * 0.06, P = [[S / 2, S * 0.035], [S * 0.975, S * 0.93], [S * 0.025, S * 0.93]];
  x.moveTo((P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2); for (let i = 0; i < 3; i++){ const a = P[i], b = P[(i + 1) % 3]; x.arcTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, r); } } else x.rect(0, 0, S, S); x.closePath(); }
function bzFinal(px){
  const d = bzD(), sh = d.shape || 'rect'; if (sh === 'rect') return bzDraw(px);
  const [mw, mh] = BZ_SIZES[d.size] || BZ_SIZES.a6, side = Math.min(mw, mh);
  if (sh === 'square') return bzDraw(px, {dims: [side, side]});
  const P = px || 300, S = Math.round(side / 25.4 * P), c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S);
  const box = sh === 'circle' ? [0.2, 0.08, 0.6, 0.84] : [0.3, 0.34, 0.4, 0.56];
  x.save(); bzShapePath(x, sh, S); x.clip();
  x.drawImage(bzDraw(P, {dims: [side, side], bgOnly: true, shape: sh}), 0, 0, S, S);
  const inner = bzDraw(P, {dims: [side * box[2], side * box[3]], noBg: true, shape: sh}); x.drawImage(inner, S * box[0], S * box[1], S * box[2], S * box[3]);
  x.restore();
  if (d.tpl === 'elegant'){ x.save(); x.strokeStyle = d.c1; x.lineWidth = S * 0.008; x.translate(S * 0.04, S * 0.04); x.scale(0.92, 0.92); bzShapePath(x, sh, S); x.stroke(); x.restore(); }
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = Math.max(1, S * 0.002); x.setLineDash([S * 0.01, S * 0.008]); bzShapePath(x, sh, S); x.stroke();
  return c;
}
const bzMM = () => { const d = bzD(), [mw, mh] = BZ_SIZES[d.size] || BZ_SIZES.a6; return (d.shape || 'rect') === 'rect' ? [mw, mh] : [Math.min(mw, mh), Math.min(mw, mh)]; };
/* measure text without drawing it */
function bzGhost(x){ return {set fillStyle(v){}, get font(){ return x.font; }, set font(v){ x.font = v; }, set textAlign(v){}, set textBaseline(v){}, set direction(v){}, measureText: s => x.measureText(s), fillText(){}}; }
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
        <div class="bz-sec"><b>${E(t('bz_shape'))}</b><div class="ds-chips">${[['rect', '▭'], ['square', '◻'], ['circle', '◯'], ['triangle', '△']].map(([k, ic]) => `<button type="button" class="ds-chip${d.shape === k ? ' on' : ''}" data-bzshape="${k}" aria-pressed="${d.shape === k}">${ic} ${E(t('bz_sh_' + k))}</button>`).join('')}</div></div>
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
function bzPreview(){ const pv = document.getElementById('bz_pv'); if (!pv) return; clearTimeout(BZ_T); BZ_T = setTimeout(() => { try { const c = bzFinal(110); c.className = 'bz-cv'; pv.replaceChildren(c); } catch (e) { pv.textContent = '⚠️'; } }, 60); }
async function bzOut(how){
  const d = bzD(); if (d.qr && !String(d.url || '').trim()){ toast(t('bz_needUrl')); const i = document.getElementById('bz_url'); if (i) i.focus(); return; }
  const c = bzFinal(300), name = ((d.name || t('bz_title')) + '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'sign';
  if (how === 'print'){ const [mw] = bzMM(); try { prnClean(); } catch (e) {} document.body.insertAdjacentHTML('beforeend', `<div id="prn_area" class="prn-qr"><img src="${c.toDataURL('image/png')}" alt="" style="width:${mw}mm;display:block;margin:10mm auto"></div>`); try { prnStyle('qr'); } catch (e) {} document.body.classList.add('prn-on'); PRN.live = true; PRN_FIRED = false; setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(() => { if (!PRN_FIRED){ prnClean(); toast(t('prn_blocked')); } }, 700); }, 120); return; }
  if (how === 'pdf'){ const [mw, mh] = bzMM(), k = 72 / 25.4, w = mw * k, h = mh * k, items = [];
    const cols = Math.max(1, Math.floor((595.28 - 40) / (w + 14))), rows = Math.max(1, Math.floor((841.89 - 40) / (h + 14))), tile = d.size === 'card' || d.size === 'square' || (d.shape || 'rect') !== 'rect' && mw < 110;
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
  if ((b = t0.closest('[data-bzshape]'))){ d.shape = b.dataset.bzshape; saveSet(); bzRender(document.getElementById('ds_root')); return; }
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
  bz_design:['עיצוב','التصميم','Design'], bz_t_clean:['נקי','بسيط','Clean'], bz_t_bold:['צבעוני','ملوّن','Bold'], bz_t_elegant:['אלגנטי','أنيق','Elegant'], bz_t_photo:['תמונה','صورة','Photo'], bz_t_gradient:['מעבר צבע','تدرّج','Gradient'], bz_t_night:['כהה','داكن','Dark'], bz_t_wave:['גל','موجة','Wave'],
  bz_colors:['צבעים','الألوان','Colours'], bz_color:['צבע {n}','لون {n}','Colour {n}'], bz_own:['צבע משלכם','لونكم الخاص','Your own colour'], bz_rand:['הפתעה','مفاجأة','Surprise me'],
  bz_shape:['צורה','الشكل','Shape'], bz_sh_rect:['מלבן','مستطيل','Rectangle'], bz_sh_square:['ריבוע','مربع','Square'], bz_sh_circle:['עיגול','دائرة','Circle'], bz_sh_triangle:['משולש','مثلث','Triangle'],
  bz_size:['גודל','الحجم','Size'], bz_s_a6:['A6 – שלט שולחן','A6 – لافتة طاولة','A6 – table sign'], bz_s_a5:['A5 – שלט בינוני','A5 – لافتة متوسطة','A5 – medium sign'], bz_s_square:['מדבקה 8×8 ס״מ','ملصق 8×8 سم','Sticker 8×8 cm'], bz_s_card:['כרטיס ביקור','بطاقة عمل','Business card'], bz_s_a4:['A4 – שלט גדול','A4 – لافتة كبيرة','A4 – large sign'],
  bz_font:['גופן','الخط','Font'], bz_f_modern:['מודרני','حديث','Modern'], bz_f_classic:['קלאסי','كلاسيكي','Classic'], bz_f_round:['מעוגל','دائري','Rounded'],
  bz_nfcOn:['סמל NFC וכיתוב "קרבו את הטלפון"','رمز NFC ونص "قرّبوا الهاتف"','NFC symbol and "tap your phone" text'], bz_qrOn:['קוד QR לגיבוי','رمز QR احتياطي','Backup QR code'], bz_dots:['קוד QR בנקודות','رمز QR بالنقاط','Dotted QR code'],
  bz_prev:['תצוגה מקדימה','معاينة','Preview'], bz_png:['שמירת תמונה','حفظ صورة','Save image'], bz_print:['הדפסה','طباعة','Print'], bz_share:['שיתוף','مشاركة','Share'], bz_write:['כתיבת הקישור למדבקת NFC','كتابة الرابط إلى ملصق NFC','Write the link to an NFC sticker'],
  bz_needUrl:['כתבו קודם את הקישור','اكتبوا الرابط أولًا','Enter the link first'],
  bz_how:['מדפיסים, מדביקים מדבקת NFC מאחורי הסמל, וכותבים אליה את הקישור בכפתור למעלה (Chrome באנדרואיד). מדבקות NTAG213/215 מתאימות.','اطبعوا، ألصقوا ملصق NFC خلف الرمز، واكتبوا إليه الرابط بالزر أعلاه (Chrome على أندرويد). ملصقات NTAG213/215 مناسبة.','Print it, put an NFC sticker behind the symbol, and write the link to it with the button above (Chrome on Android). NTAG213/215 stickers work.'],
});
