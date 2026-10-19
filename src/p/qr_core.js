/* ---------- 13.10: QR codes – our own encoder and decoder (no library, nothing sent anywhere) ----------
   Encoder: the full standard (versions 1–40, error correction L/M/Q/H, numeric / alphanumeric / byte UTF-8, best mask).
   Decoder: adaptive threshold, finder patterns, alignment pattern, perspective sampling, Reed–Solomon error correction. */
const QR_ECC = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]];
const QR_BLK = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]];
const QR_FMT = [1, 0, 3, 2];            // format bits of L, M, Q, H
const QR_ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
/* GF(256) */
const QR_EXP = new Uint8Array(512), QR_LOG = new Uint8Array(256);
{ let x = 1; for (let i = 0; i < 255; i++){ QR_EXP[i] = x; QR_LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; } for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255]; }
const qrMul = (a, b) => a && b ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0;
const qrDiv = (a, b) => a ? QR_EXP[(QR_LOG[a] + 255 - QR_LOG[b]) % 255] : 0;
function qrRawModules(v){ let r = (16 * v + 128) * v + 64; if (v >= 2){ const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; }
const qrDataCw = (v, e) => Math.floor(qrRawModules(v) / 8) - QR_ECC[e][v] * QR_BLK[e][v];
function qrAlignPos(v){
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, size = v * 4 + 17, step = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2, r = [6];
  for (let p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
  return r;
}
function qrRsDivisor(n){ const r = new Array(n).fill(0); r[n - 1] = 1; let root = 1; for (let i = 0; i < n; i++){ for (let j = 0; j < n; j++){ r[j] = qrMul(r[j], root); if (j + 1 < n) r[j] ^= r[j + 1]; } root = qrMul(root, 2); } return r; }
function qrRsRem(data, div){ const r = new Array(div.length).fill(0); for (const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= qrMul(c, f); }); } return r; }
/* function patterns of a version: which modules are fixed (finders, timing, alignment, format/version areas) */
function qrFunc(v){
  const size = v * 4 + 17, F = new Uint8Array(size * size), M = new Uint8Array(size * size);
  const set = (x, y, d) => { if (x < 0 || y < 0 || x >= size || y >= size) return; F[y * size + x] = 1; M[y * size + x] = d ? 1 : 0; };
  for (let i = 0; i < size; i++){ set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const A = qrAlignPos(v), n = A.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){ if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(A[i] + dx, A[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  for (let i = 0; i < 9; i++){ set(8, i, 0); set(i, 8, 0); } for (let i = 0; i < 8; i++){ set(size - 1 - i, 8, 0); set(8, size - 1 - i, 0); }
  set(8, size - 8, 1);
  if (v >= 7) for (let i = 0; i < 18; i++){ const a = size - 11 + i % 3, b = Math.floor(i / 3); set(a, b, 0); set(b, a, 0); }
  return {size, F, M};
}
function qrFmtBits(e, mask){ const d = QR_FMT[e] << 3 | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); return ((d << 10) | r) ^ 0x5412; }
function qrVerBits(v){ let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); return v << 12 | r; }
const QR_MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
/* the zigzag order of data modules */
function qrOrder(size, F){
  const out = [];
  for (let right = size - 1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++){ const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert; if (!F[y * size + x]) out.push(y * size + x); }
  }
  return out;
}
function qrPenalty(m, size){
  let p = 0; const at = (x, y) => m[y * size + x];
  for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++){
    let run = 1, prev = -1; const line = [];
    for (let b = 0; b < size; b++){ const c = pass ? at(a, b) : at(b, a); line.push(c); if (c === prev){ run++; if (run === 5) p += 3; else if (run > 5) p++; } else { run = 1; prev = c; } }
    const s = line.join('');
    let k = -1; while ((k = s.indexOf('10111010000', k + 1)) >= 0) p += 40; k = -1; while ((k = s.indexOf('00001011101', k + 1)) >= 0) p += 40;
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++){ const c = at(x, y); if (c === at(x + 1, y) && c === at(x, y + 1) && c === at(x + 1, y + 1)) p += 3; }
  let dark = 0; for (let i = 0; i < m.length; i++) dark += m[i];
  return p + Math.floor(Math.abs(dark * 20 - m.length * 10) / m.length) * 10;
}
/* text → modules. ecl: 0 L, 1 M, 2 Q, 3 H. Returns {size, mods (1 = dark), version, ecl} or null when it doesn't fit */
function qrEncode(text, ecl, boost){
  ecl = ecl == null ? 1 : ecl;
  const s = String(text == null ? '' : text);
  const mode = /^\d*$/.test(s) ? 1 : [...s].every(c => QR_ALNUM.includes(c)) ? 2 : 4;
  const bytes = mode === 4 ? [...new TextEncoder().encode(s)] : null, count = mode === 4 ? bytes.length : s.length;
  const ccBits = v => (mode === 1 ? [10, 12, 14] : mode === 2 ? [9, 11, 13] : [8, 16, 16])[v < 10 ? 0 : v < 27 ? 1 : 2];
  const dataBits = mode === 1 ? Math.floor(count / 3) * 10 + [0, 4, 7][count % 3] : mode === 2 ? Math.floor(count / 2) * 11 + (count % 2) * 6 : count * 8;
  let v = 1; for (; v <= 40; v++) if (4 + ccBits(v) + dataBits <= qrDataCw(v, ecl) * 8) break;
  if (v > 40) return null;
  if (boost !== false) for (let e = 3; e > ecl; e--) if (4 + ccBits(v) + dataBits <= qrDataCw(v, e) * 8){ ecl = e; break; }
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(mode, 4); put(count, ccBits(v));
  if (mode === 1) for (let i = 0; i < s.length; i += 3){ const g = s.slice(i, i + 3); put(+g, g.length * 3 + 1); }
  else if (mode === 2) for (let i = 0; i < s.length; i += 2){ if (i + 1 < s.length) put(QR_ALNUM.indexOf(s[i]) * 45 + QR_ALNUM.indexOf(s[i + 1]), 11); else put(QR_ALNUM.indexOf(s[i]), 6); }
  else bytes.forEach(b => put(b, 8));
  const cap = qrDataCw(v, ecl) * 8;
  put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8){ let b = 0; for (let j = 0; j < 8; j++) b = b << 1 | bits[i + j]; data.push(b); }
  /* blocks + error correction, interleaved */
  const nb = QR_BLK[ecl][v], el = QR_ECC[ecl][v], raw = Math.floor(qrRawModules(v) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = qrRsDivisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++){ const dat = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += dat.length; const ec = qrRsRem(dat, div); if (i < nShort) dat.push(0); blocks.push(dat.concat(ec)); }
  const cw = []; for (let i = 0; i < blocks[0].length; i++) for (let j = 0; j < nb; j++) if (i !== shortLen - el || j >= nShort) cw.push(blocks[j][i]);
  const {size, F, M} = qrFunc(v), order = qrOrder(size, F), base = M.slice();
  order.forEach((p, i) => { if (i < cw.length * 8) base[p] = (cw[i >>> 3] >>> (7 - (i & 7))) & 1; });
  const finish = mask => {
    const m = base.slice();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y * size + x] && QR_MASKS[mask](x, y)) m[y * size + x] ^= 1;
    const fb = qrFmtBits(ecl, mask), b = i => (fb >>> i) & 1, st = (x, y, d) => { m[y * size + x] = d; };
    for (let i = 0; i <= 5; i++) st(8, i, b(i)); st(8, 7, b(6)); st(8, 8, b(7)); st(7, 8, b(8)); for (let i = 9; i < 15; i++) st(14 - i, 8, b(i));
    for (let i = 0; i < 8; i++) st(size - 1 - i, 8, b(i)); for (let i = 8; i < 15; i++) st(8, size - 15 + i, b(i)); st(8, size - 8, 1);
    if (v >= 7){ const vb = qrVerBits(v); for (let i = 0; i < 18; i++){ const d = (vb >>> i) & 1, a = size - 11 + i % 3, c = Math.floor(i / 3); st(a, c, d); st(c, a, d); } }
    return m;
  };
  let best = null, bp = Infinity, bm = 0;
  for (let mask = 0; mask < 8; mask++){ const m = finish(mask), p = qrPenalty(m, size); if (p < bp){ bp = p; best = m; bm = mask; } }
  return {size, mods: best, version: v, ecl, mask: bm};
}
/* drawing */
function qrCanvas(q, o){
  o = o || {}; const mar = o.margin == null ? 4 : o.margin, sc = o.scale || 10, cap = o.caption || '', capH = cap ? Math.round(sc * 5) : 0;
  const c = document.createElement('canvas'), W = (q.size + mar * 2) * sc; c.width = W; c.height = W + capH;
  const x = c.getContext('2d'); x.fillStyle = o.bg || '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = o.fg || '#000';
  for (let y = 0; y < q.size; y++) for (let xx = 0; xx < q.size; xx++) if (q.mods[y * q.size + xx]){
    if (o.dots){ x.beginPath(); x.arc((xx + mar + .5) * sc, (y + mar + .5) * sc, sc * .46, 0, 7); x.fill(); } else x.fillRect((xx + mar) * sc, (y + mar) * sc, sc, sc);
  }
  if (o.dots){ /* keep the three finder patterns square so every reader still finds them */
    [[0, 0], [q.size - 7, 0], [0, q.size - 7]].forEach(([fx, fy]) => { x.fillStyle = o.bg || '#fff'; x.fillRect((fx + mar) * sc, (fy + mar) * sc, 7 * sc, 7 * sc); x.fillStyle = o.fg || '#000';
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) if (q.mods[(fy + dy) * q.size + fx + dx]) x.fillRect((fx + dx + mar) * sc, (fy + dy + mar) * sc, sc, sc); });
  }
  if (o.logo){ const L = o.logo, lw = W * 0.22, lh = lw * L.height / L.width; x.fillStyle = o.bg || '#fff'; const pd = sc * .8; x.fillRect((W - lw) / 2 - pd, (W - lh) / 2 - pd, lw + pd * 2, lh + pd * 2); x.drawImage(L, (W - lw) / 2, (W - lh) / 2, lw, lh); }
  if (cap){ x.fillStyle = o.fg || '#000'; x.font = '600 ' + Math.round(sc * 2.4) + 'px -apple-system,"Segoe UI",Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; try { x.direction = /[֐-ۿ]/.test(cap) ? 'rtl' : 'ltr'; } catch (e) {} x.fillText(cap.slice(0, 60), W / 2, W + capH * 0.35, W - sc * 4); }
  return c;
}
function qrSvg(q, o){
  o = o || {}; const mar = o.margin == null ? 4 : o.margin, n = q.size + mar * 2; let d = '';
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.mods[y * q.size + x]) d += `M${x + mar},${y + mar}h1v1h-1z`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${o.bg || '#fff'}"/><path d="${d}" fill="${o.fg || '#000'}"/></svg>`;
}

/* ================= decoder ================= */
/* 1) black and white: each pixel against the average of its neighbourhood (works with shadows and uneven light) */
function qrOtsu(img, w, h){
  const d = img.data, g = new Uint8Array(w * h), hist = new Array(256).fill(0);
  for (let i = 0; i < w * h; i++){ g[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8; hist[g[i]]++; }
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, th = 128; for (let i = 0; i < 256; i++){ wB += hist[i]; if (!wB) continue; const wF = w * h - wB; if (!wF) break; sB += i * hist[i]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > best){ best = v; th = i; } }
  const out = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) out[i] = g[i] <= th ? 1 : 0; return out;
}
function qrBinarize(img, w, h, invert){
  const g = new Uint8Array(w * h), d = img.data;
  for (let i = 0; i < w * h; i++) g[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8;
  const B = 8, bw = Math.ceil(w / B), bh = Math.ceil(h / B), avg = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++){
    let s = 0, n = 0, mn = 255, mx = 0;
    for (let y = by * B; y < Math.min(h, by * B + B); y++) for (let x = bx * B; x < Math.min(w, bx * B + B); x++){ const v = g[y * w + x]; s += v; n++; if (v < mn) mn = v; if (v > mx) mx = v; }
    let a = s / n; if (mx - mn <= 24){ a = mn / 2; if (by > 0 && bx > 0){ const nb = (avg[(by - 1) * bw + bx] + 2 * avg[by * bw + bx - 1] + avg[(by - 1) * bw + bx - 1]) / 4; if (mn < nb) a = nb; } }
    avg[by * bw + bx] = a;
  }
  const out = new Uint8Array(w * h);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++){
    let s = 0, n = 0; for (let yy = Math.max(0, by - 2); yy <= Math.min(bh - 1, by + 2); yy++) for (let xx = Math.max(0, bx - 2); xx <= Math.min(bw - 1, bx + 2); xx++){ s += avg[yy * bw + xx]; n++; }
    const th = s / n;
    for (let y = by * B; y < Math.min(h, by * B + B); y++) for (let x = bx * B; x < Math.min(w, bx * B + B); x++){ const dk = g[y * w + x] <= th ? 1 : 0; out[y * w + x] = invert ? 1 - dk : dk; }
  }
  return out;
}
/* 2) the three finder patterns: runs of dark-light-dark-light-dark in the ratio 1:1:3:1:1, checked across and down */
function qrFinders(bm, w, h){
  const at = (x, y) => bm[y * w + x];
  const ratio = (c, n) => { const tot = c.reduce((a, b) => a + b, 0); if (tot < n) return 0; const m = tot / n, v = m / 2; for (let i = 0; i < c.length; i++){ const e = c.length === 5 && i === 2 ? 3 : 1; if (Math.abs(c[i] - m * e) >= v * e) return 0; } return m; };
  const cross = (cx, cy, dx, dy, maxC) => { /* counts the 5 runs through (cx, cy) along a direction; returns [counts] or null */
    const c = [0, 0, 0, 0, 0]; let x = cx, y = cy;
    const inb = () => x >= 0 && y >= 0 && x < w && y < h;
    while (inb() && at(x, y)){ c[2]++; x -= dx; y -= dy; } if (!inb()) return null;
    while (inb() && !at(x, y) && c[1] <= maxC){ c[1]++; x -= dx; y -= dy; } if (!inb() || c[1] > maxC) return null;
    while (inb() && at(x, y) && c[0] <= maxC){ c[0]++; x -= dx; y -= dy; } if (c[0] > maxC) return null;
    const back = [x + dx, y + dy];
    x = cx + dx; y = cy + dy; while (inb() && at(x, y)){ c[2]++; x += dx; y += dy; } if (!inb()) return null;
    while (inb() && !at(x, y) && c[3] < maxC){ c[3]++; x += dx; y += dy; } if (!inb() || c[3] >= maxC) return null;
    while (inb() && at(x, y) && c[4] < maxC){ c[4]++; x += dx; y += dy; } if (c[4] >= maxC) return null;
    return {c, end: [x, y], back};
  };
  const cands = [];
  const consider = (c, x, y) => {
    let ms = ratio(c, 7); if (!ms) return;
    const cx = Math.round(x - c[4] - c[3] - c[2] / 2);
    const vr = cross(cx, y, 0, 1, c[2] * 2); if (!vr || !(ms = ratio(vr.c, 7))) return;
    const cy = Math.round(vr.end[1] - vr.c[4] - vr.c[3] - vr.c[2] / 2);
    const hr = cross(cx, cy, 1, 0, c[2] * 2); if (!hr) return; const ms2 = ratio(hr.c, 7); if (!ms2) return;
    const fx = hr.end[0] - hr.c[4] - hr.c[3] - hr.c[2] / 2, fy = cy + 0.5, size = (ms + ms2) / 2;
    /* also a diagonal check, which rules out most false hits in text and pictures */
    const dr = cross(Math.round(fx), Math.round(fy), 1, 1, c[2] * 2); if (!dr || !ratio(dr.c, 7)) return;
    const f = cands.find(p => Math.abs(p.x - fx) <= size * 2 && Math.abs(p.y - fy) <= size * 2 && Math.abs(p.s - size) <= Math.max(1, p.s * 0.5));
    if (f){ const n = f.n + 1; f.x = (f.x * f.n + fx) / n; f.y = (f.y * f.n + fy) / n; f.s = (f.s * f.n + size) / n; f.n = n; } else cands.push({x: fx, y: fy, s: size, n: 1});
  };
  const step = Math.max(1, Math.floor(h / 400));
  for (let y = 0; y < h; y += step){
    const c = [0, 0, 0, 0, 0]; let st = 0;
    for (let x = 0; x < w; x++){
      const v = at(x, y);
      if (v){ if (st & 1) st++; c[st]++; }
      else if (st & 1) c[st]++;
      else if (st === 4){ consider(c, x, y); c[0] = c[2]; c[1] = c[3]; c[2] = c[4]; c[3] = 1; c[4] = 0; st = 3; }
      else { st++; c[st]++; }
    }
    if (st === 4) consider(c, w, y);
  }
  return cands;
}
const qrDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/* choose three finders that make a sensible square corner: similar size, right angle, two equal sides */
function qrPick(cands){
  const C = cands.filter(c => c.n >= 2).length >= 3 ? cands.filter(c => c.n >= 2) : cands;
  C.sort((a, b) => b.n - a.n); const L = C.slice(0, 12), out = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) for (let k = j + 1; k < L.length; k++){
    const P = [L[i], L[j], L[k]], ss = P.map(p => p.s), smin = Math.min(...ss), smax = Math.max(...ss); if (smax > smin * 1.7) continue;
    const d = [qrDist(P[1], P[2]), qrDist(P[0], P[2]), qrDist(P[0], P[1])], hi = d.indexOf(Math.max(...d)), tl = P[hi], o = P.filter((_, x) => x !== hi);
    const a = qrDist(tl, o[0]), b = qrDist(tl, o[1]); if (Math.min(a, b) / Math.max(a, b) < 0.55) continue;
    const cos = ((o[0].x - tl.x) * (o[1].x - tl.x) + (o[0].y - tl.y) * (o[1].y - tl.y)) / (a * b); if (Math.abs(cos) > 0.35) continue;
    const ms = (ss[0] + ss[1] + ss[2]) / 3; if ((a + b) / 2 / ms < 10) continue;
    let tr = o[0], bl = o[1]; if ((tr.x - tl.x) * (bl.y - tl.y) - (tr.y - tl.y) * (bl.x - tl.x) < 0){ tr = o[1]; bl = o[0]; }
    out.push({tl, tr, bl, ms, score: Math.abs(cos) + Math.abs(1 - a / b) + (smax - smin) / smax - (L[i].n + L[j].n + L[k].n) * 0.002});
  }
  return out.sort((x, y) => x.score - y.score).slice(0, 4);
}
/* 3) perspective: module coordinates → image pixels */
/* (zxing's PerspectiveTransform, field order a11 a21 a31 a12 a22 a32 a13 a23 a33) */
function qrSquareToQuad(x0, y0, x1, y1, x2, y2, x3, y3){
  const dx3 = x0 - x1 + x2 - x3, dy3 = y0 - y1 + y2 - y3;
  if (dx3 === 0 && dy3 === 0) return [x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0, 0, 1];
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
  const a13 = (dx3 * dy2 - dx2 * dy3) / den, a23 = (dx1 * dy3 - dx3 * dy1) / den;
  return [x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0, y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0, a13, a23, 1];
}
function qrAdj(m){ const [a11, a21, a31, a12, a22, a32, a13, a23, a33] = m;
  return [a22 * a33 - a23 * a32, a23 * a31 - a21 * a33, a21 * a32 - a22 * a31, a13 * a32 - a12 * a33, a11 * a33 - a13 * a31, a12 * a31 - a11 * a32, a12 * a23 - a13 * a22, a13 * a21 - a11 * a23, a11 * a22 - a12 * a21]; }
function qrTimes(p, o){ const [a11, a21, a31, a12, a22, a32, a13, a23, a33] = p, [b11, b21, b31, b12, b22, b32, b13, b23, b33] = o;
  return [a11 * b11 + a21 * b12 + a31 * b13, a11 * b21 + a21 * b22 + a31 * b23, a11 * b31 + a21 * b32 + a31 * b33, a12 * b11 + a22 * b12 + a32 * b13, a12 * b21 + a22 * b22 + a32 * b23, a12 * b31 + a22 * b32 + a32 * b33, a13 * b11 + a23 * b12 + a33 * b13, a13 * b21 + a23 * b22 + a33 * b23, a13 * b31 + a23 * b32 + a33 * b33]; }
/* the transform taking the src quad to the dst quad: f(x, y) → [X, Y] */
function qrPersp(src, dst){
  const m = qrTimes(qrSquareToQuad(...dst), qrAdj(qrSquareToQuad(...src)));
  return (x, y) => { const den = m[6] * x + m[7] * y + m[8]; return [(m[0] * x + m[1] * y + m[2]) / den, (m[3] * x + m[4] * y + m[5]) / den]; };
}
/* the bottom-right alignment pattern: a small dark dot inside a light ring inside a dark ring */
function qrFindAlign(bm, w, h, ex, ey, ms){
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? bm[y * w + x] : 0, R = Math.max(4, Math.round(ms * 6));
  const runs = (cx, cy, dx, dy) => { const c = [0, 0, 0]; let x = cx, y = cy, lim = ms * 3;
    while (at(x, y) && c[1] < lim){ c[1]++; x -= dx; y -= dy; } while (!at(x, y) && c[0] < lim){ c[0]++; x -= dx; y -= dy; }
    x = cx + dx; y = cy + dy; while (at(x, y) && c[1] < lim * 2){ c[1]++; x += dx; y += dy; } const e1 = [x, y]; while (!at(x, y) && c[2] < lim){ c[2]++; x += dx; y += dy; }
    return {c, e1}; };
  let best = null, bd = Infinity;
  for (let r = 0; r <= R; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++){
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = Math.round(ex + dx), y = Math.round(ey + dy); if (!at(x, y)) continue;
    const H = runs(x, y, 1, 0), V = runs(x, y, 0, 1), ok = q => q.c.every(v => v > ms * 0.4 && v < ms * 1.9);
    if (ok(H) && ok(V) && at(x - Math.round(ms * 2), y) && at(x + Math.round(ms * 2), y) && at(x, y - Math.round(ms * 2)) && at(x, y + Math.round(ms * 2))){
      const d = dx * dx + dy * dy; if (d < bd){ bd = d; best = {x: x + 0.5, y: y + 0.5}; } }
    if (best && r > Math.sqrt(bd) + 2) return best;
  }
  return best;
}
/* 4) Reed–Solomon: correct up to half of the error-correction codewords in a block */
function qrRsFix(cw, ne){
  const n = cw.length, S = new Array(ne).fill(0); let bad = false;
  for (let i = 0; i < ne; i++){ let s = 0; const a = QR_EXP[i]; for (let j = 0; j < n; j++) s = qrMul(s, a) ^ cw[j]; S[i] = s; if (s) bad = true; }
  if (!bad) return true;
  let Lm = [1], B = [1], L = 0, m = 1, b = 1;
  for (let k = 0; k < ne; k++){
    let d = S[k]; for (let i = 1; i <= L; i++) d ^= qrMul(Lm[i] || 0, S[k - i]);
    if (!d){ m++; continue; }
    const coef = qrDiv(d, b), T = Lm.slice(), nl = Math.max(Lm.length, B.length + m), NL = new Array(nl).fill(0);
    for (let i = 0; i < Lm.length; i++) NL[i] = Lm[i]; for (let i = 0; i < B.length; i++) NL[i + m] ^= qrMul(coef, B[i]);
    if (2 * L <= k){ L = k + 1 - L; B = T; b = d; m = 1; } else m++;
    Lm = NL;
  }
  const ev = (p, x) => { let r = 0; for (let i = p.length - 1; i >= 0; i--) r = qrMul(r, x) ^ p[i]; return r; };
  const pos = [];
  for (let j = 0; j < n; j++){ const xi = QR_EXP[(255 - (n - 1 - j) % 255) % 255]; if (ev(Lm, xi) === 0) pos.push(j); }
  if (pos.length !== L || L * 2 > ne) return false;
  const Om = new Array(ne).fill(0); for (let i = 0; i < ne; i++) for (let j = 0; j < Lm.length && i + j < ne; j++) Om[i + j] ^= qrMul(S[i], Lm[j]);
  const dL = []; for (let i = 1; i < Lm.length; i += 2){ dL[i - 1] = Lm[i]; } for (let i = 0; i < dL.length; i++) if (dL[i] == null) dL[i] = 0;
  for (const j of pos){ const X = QR_EXP[(n - 1 - j) % 255], Xi = qrDiv(1, X), den = ev(dL, Xi); if (!den) return false; cw[j] ^= qrMul(X, qrDiv(ev(Om, Xi), den)); }
  for (let i = 0; i < ne; i++){ let s = 0; const a = QR_EXP[i]; for (let j = 0; j < n; j++) s = qrMul(s, a) ^ cw[j]; if (s) return false; }
  return true;
}
/* 5) read the grid: format → unmask → codewords → error correction → text */
function qrReadGrid(g, size){
  const at = (x, y) => g[y * size + x];
  let f1 = 0, f2 = 0;
  for (let i = 0; i <= 5; i++) f1 |= at(8, i) << i; f1 |= at(8, 7) << 6 | at(8, 8) << 7 | at(7, 8) << 8; for (let i = 9; i < 15; i++) f1 |= at(14 - i, 8) << i;
  for (let i = 0; i < 8; i++) f2 |= at(size - 1 - i, 8) << i; for (let i = 8; i < 15; i++) f2 |= at(8, size - 15 + i) << i;
  let fm = null, fd = 99;
  for (let e = 0; e < 4; e++) for (let mk = 0; mk < 8; mk++){ const fb = qrFmtBits(e, mk); for (const f of [f1, f2]){ let x = fb ^ f, c = 0; while (x){ c += x & 1; x >>>= 1; } if (c < fd){ fd = c; fm = [e, mk]; } } }
  if (fd > 3) return null;
  let v = (size - 17) / 4;
  if (v >= 7){
    let v1 = 0, v2 = 0; for (let i = 0; i < 18; i++){ const a = size - 11 + i % 3, b = Math.floor(i / 3); v1 |= at(b, a) << i; v2 |= at(a, b) << i; }
    let bv = 0, bd = 99; for (let vv = 7; vv <= 40; vv++){ const vb = qrVerBits(vv); for (const x0 of [v1, v2]){ let x = vb ^ x0, c = 0; while (x){ c += x & 1; x >>>= 1; } if (c < bd){ bd = c; bv = vv; } } }
    if (bd <= 3 && bv !== v) return {resize: bv * 4 + 17};
  }
  if (v < 1 || v > 40 || v !== Math.floor(v)) return null;
  const [ecl, mask] = fm, {F} = qrFunc(v), order = qrOrder(size, F), raw = Math.floor(qrRawModules(v) / 8), cw = new Array(raw).fill(0);
  order.forEach((p, i) => { if (i >= raw * 8) return; const x = p % size, y = (p / size) | 0; let bit = g[p]; if (QR_MASKS[mask](x, y)) bit ^= 1; if (bit) cw[i >>> 3] |= 1 << (7 - (i & 7)); });
  const nb = QR_BLK[ecl][v], el = QR_ECC[ecl][v], nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [];
  for (let j = 0; j < nb; j++) blocks.push([]);
  let k = 0; for (let i = 0; i < shortLen + 1; i++) for (let j = 0; j < nb; j++){ if (i === shortLen - el && j < nShort) continue; if (k < raw) blocks[j].push(cw[k++]); }
  /* blocks are filled data-first; reorder so that short blocks get their data then ecc in the right places */
  const data = [];
  for (let j = 0; j < nb; j++){
    const len = shortLen + (j < nShort ? 0 : 1), dl = len - el, b = blocks[j];
    if (b.length !== len) return null;
    if (!qrRsFix(b, el)) return null;
    for (let i = 0; i < dl; i++) data.push(b[i]);
  }
  return {text: qrParse(data, v), version: v, ecl};
}
function qrParse(data, v){
  let bp = 0; const rd = n => { let r = 0; for (let i = 0; i < n; i++){ const by = data[bp >>> 3]; r = r << 1 | (by == null ? 0 : (by >>> (7 - (bp & 7))) & 1); bp++; } return r; };
  const out = []; let utf8 = true, bytes = [];
  const flush = () => { if (!bytes.length) return; let s; try { s = new TextDecoder(utf8 ? 'utf-8' : 'iso-8859-1', {fatal: true}).decode(new Uint8Array(bytes)); } catch (e) { s = new TextDecoder('iso-8859-1').decode(new Uint8Array(bytes)); } out.push(s); bytes = []; };
  const ci = v < 10 ? 0 : v < 27 ? 1 : 2;
  while (bp + 4 <= data.length * 8){
    const mode = rd(4); if (!mode) break;
    if (mode === 1){ flush(); let n = rd([10, 12, 14][ci]); let s = ''; while (n >= 3){ s += String(rd(10)).padStart(3, '0'); n -= 3; } if (n === 2) s += String(rd(7)).padStart(2, '0'); else if (n === 1) s += String(rd(4)); out.push(s); }
    else if (mode === 2){ flush(); let n = rd([9, 11, 13][ci]); let s = ''; while (n >= 2){ const x = rd(11); s += QR_ALNUM[Math.floor(x / 45)] + QR_ALNUM[x % 45]; n -= 2; } if (n) s += QR_ALNUM[rd(6)]; out.push(s); }
    else if (mode === 4){ const n = rd([8, 16, 16][ci]); for (let i = 0; i < n; i++) bytes.push(rd(8)); }
    else if (mode === 7){ flush(); let e = rd(8); if ((e & 0x80) === 0){} else if ((e & 0xC0) === 0x80) e = (e & 0x3F) << 8 | rd(8); else e = (e & 0x1F) << 16 | rd(16); utf8 = e === 26 || e === 0 || e > 900 ? true : e === 3 || e === 1 ? false : true; }
    else if (mode === 3){ rd(16); }
    else if (mode === 8){ flush(); const n = rd([8, 10, 12][ci]); for (let i = 0; i < n; i++) rd(13); }
    else break;
  }
  flush();
  return out.join('');
}
/* sample a grid of the given size from the image through the transform */
function qrSample(bm, w, h, size, T){
  const g = new Uint8Array(size * size);
  const pt = (mx, my) => { const [px, py] = T(mx, my), ix = Math.floor(px), iy = Math.floor(py); return ix >= 0 && iy >= 0 && ix < w && iy < h ? bm[iy * w + ix] : 0; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++){ const c = pt(x + 0.5, y + 0.5); g[y * size + x] = (c * 2 + pt(x + 0.3, y + 0.3) + pt(x + 0.7, y + 0.3) + pt(x + 0.3, y + 0.7) + pt(x + 0.7, y + 0.7)) >= 3 ? 1 : 0; }
  return g;
}
function qrTryPick(bm, w, h, P){
  const {tl, tr, bl, ms} = P;
  let dim = Math.round((qrDist(tl, tr) + qrDist(tl, bl)) / 2 / ms) + 7;
  const sizes = []; const m4 = dim % 4; if (m4 === 1) sizes.push(dim, dim + 4, dim - 4); else if (m4 === 0) sizes.push(dim + 1, dim - 3); else if (m4 === 2) sizes.push(dim - 1, dim + 3); else sizes.push(dim - 2, dim + 2);
  const tried = new Set();
  for (let qi = 0; qi < sizes.length; qi++){
    const size = sizes[qi]; if (size < 21 || size > 177 || tried.has(size)) continue; tried.add(size);
    const n = size - 7, br0 = {x: tr.x + bl.x - tl.x, y: tr.y + bl.y - tl.y};
    let quads = [];
    if (size > 21){
      const ax = size - 6.5, k = (ax - 3.5) / n, ex = tl.x + (tr.x - tl.x) * k + (bl.x - tl.x) * k, ey = tl.y + (tr.y - tl.y) * k + (bl.y - tl.y) * k;
      const al = qrFindAlign(bm, w, h, ex, ey, ms);
      if (al) quads.push([[3.5, 3.5, size - 3.5, 3.5, ax, ax, 3.5, size - 3.5], [tl.x, tl.y, tr.x, tr.y, al.x, al.y, bl.x, bl.y]]);
    }
    quads.push([[3.5, 3.5, size - 3.5, 3.5, size - 3.5, size - 3.5, 3.5, size - 3.5], [tl.x, tl.y, tr.x, tr.y, br0.x, br0.y, bl.x, bl.y]]);
    /* a tilted photo moves the far corner: try nearby positions for it (the error correction tells the right one) */
    const ux = (tr.x - tl.x) / n, uy = (tr.y - tl.y) / n, vx = (bl.x - tl.x) / n, vy = (bl.y - tl.y) / n, R = Math.min(4, Math.max(2, Math.round(size / 12)));
    for (let r = 1; r <= R; r++) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++){ if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue;
      quads.push([[3.5, 3.5, size - 3.5, 3.5, size - 3.5, size - 3.5, 3.5, size - 3.5], [tl.x, tl.y, tr.x, tr.y, br0.x + ux * a + vx * b, br0.y + uy * a + vy * b, bl.x, bl.y]]); }
    for (const [src, dst] of quads){
      let T; try { T = qrPersp(src, dst); } catch (e) { continue; }
      const g = qrSample(bm, w, h, size, T); let r = null; try { r = qrReadGrid(g, size); } catch (e) {}
      if (r && r.resize && !tried.has(r.resize)) sizes.push(r.resize);
      else if (r && r.text != null) return Object.assign(r, {corners: [T(0, 0), T(size, 0), T(size, size), T(0, size)]});
    }
  }
  return null;
}
/* the whole decoder: ImageData → {text, version, ecl, corners} or null */
function qrDecode(img){
  const w = img.width, h = img.height;
  for (const mode of ['a', 'o', 'i']){
    const bm = mode === 'o' ? qrOtsu(img, w, h) : qrBinarize(img, w, h, mode === 'i'), C = qrFinders(bm, w, h); if (C.length < 3) continue;
    for (const P of qrPick(C)){ const r = qrTryPick(bm, w, h, P); if (r) return r; }
  }
  return null;
}
/* from any picture: tries a few sizes, since very large photos make the patterns hard to see and small ones lose detail */
function qrDecodeCanvas(src){
  const W0 = src.width, H0 = src.height, M0 = Math.max(W0, H0), tries = M0 < 700 ? [M0, 900, 1400] : [1000, 1600, 700, 2400];
  for (const t of tries){
    const k = M0 < 700 ? t / M0 : Math.min(1, t / M0), w = Math.max(1, Math.round(W0 * k)), h = Math.max(1, Math.round(H0 * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', {willReadFrequently: true}); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
    const r = qrDecode(x.getImageData(0, 0, w, h)); if (r){ if (k !== 1 && r.corners) r.corners = r.corners.map(([a, b]) => [a / k, b / k]); return r; }
    if (k === 1 && M0 >= 700) break;
  }
  return null;
}
