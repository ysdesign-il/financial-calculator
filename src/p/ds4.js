/* ---------- 13.16: scanner improvements ----------
   • a magnifier while dragging a crop corner (precise on a phone)
   • turn a scanned page 90°, and move pages earlier / later
   • brightness and contrast for the whole scan
   • a document photo shaped like A4 is recognised as a document page
   • a "magic" look: clean white paper with stronger colours (stamps, signatures, highlighter)
   • crop a scanned page again from its original photo */
const d4E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/* ---- brightness / contrast, on top of the chosen filter ---- */
{
  const dsFilter4 = dsFilter;
  dsFilter = function(c, f){
    const out = f === 'magic' ? d4Magic(dsFilter4.call(this, c, 'doc')) : dsFilter4.apply(this, arguments), A = DSC && DSC.adj; if (!A || (!+A.b && !+A.c)) return out;
    const b = (+A.b || 0) * 2.55, k = (259 * ((+A.c || 0) * 2.55 + 255)) / (255 * (259 - (+A.c || 0) * 2.55)), L = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) L[i] = k * (i - 128) + 128 + b;
    const x = out.getContext('2d'), H = out.height, W = out.width, step = Math.max(1, Math.floor(4e6 / W));
    for (let y = 0; y < H; y += step){ const h = Math.min(step, H - y), D = x.getImageData(0, y, W, h), d = D.data; for (let i = 0; i < d.length; i += 4){ d[i] = L[d[i]]; d[i + 1] = L[d[i + 1]]; d[i + 2] = L[d[i + 2]]; } x.putImageData(D, 0, y); }
    return out;
  };
}
/* the magic look: the clean "document" paper, then the colours made more vivid (grey ink stays grey) */
function d4Magic(out){
  const x = out.getContext('2d'), H = out.height, W = out.width, step = Math.max(1, Math.floor(4e6 / W)), S = 1.45;
  for (let y = 0; y < H; y += step){ const h = Math.min(step, H - y), D = x.getImageData(0, y, W, h), d = D.data;
    for (let i = 0; i < d.length; i += 4){ const r = d[i], g = d[i + 1], b = d[i + 2], l = r * 0.299 + g * 0.587 + b * 0.114; d[i] = l + (r - l) * S; d[i + 1] = l + (g - l) * S; d[i + 2] = l + (b - l) * S; }
    x.putImageData(D, 0, y); }
  return out;
}
function d4AdjReset(){ (DSC.pages || []).forEach(p => { p._f = null; p._fk = null; }); }
function d4AdjHTML(){
  const A = DSC.adj || {b: 0, c: 0}, E = d4E;
  return `<details class="ds-det d4-adj"${(+A.b || +A.c) ? ' open' : ''}><summary>☀️ ${E(t('d4_adj'))}</summary>
    <div class="field"><label for="d4_b">${E(t('d4_bright'))} <b id="d4_bv">${+A.b || 0}</b></label><input type="range" id="d4_b" min="-50" max="50" step="1" value="${+A.b || 0}"></div>
    <div class="field"><label for="d4_c">${E(t('d4_contrast'))} <b id="d4_cv">${+A.c || 0}</b></label><input type="range" id="d4_c" min="-50" max="50" step="1" value="${+A.c || 0}"></div>
    <div class="btnrow"><button type="button" class="mv" id="d4_adjReset">↺ ${E(t('d4_reset'))}</button></div></details>`;
}
let D4_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !DSC || (el.id !== 'd4_b' && el.id !== 'd4_c')) return;
  DSC.adj = DSC.adj || {b: 0, c: 0}; DSC.adj[el.id === 'd4_b' ? 'b' : 'c'] = +el.value; const v = $('#' + el.id + 'v'); if (v) v.textContent = el.value;
  clearTimeout(D4_T); D4_T = setTimeout(() => { d4AdjReset(); dsPagesDraw(); }, 180);
});

/* ---- turning and ordering pages ---- */
function d4Rotate(i, dir){
  const p = DSC.pages[i]; if (!p) return;
  const s = p.base, c = document.createElement('canvas'); c.width = s.height; c.height = s.width; const x = c.getContext('2d');
  if (dir > 0){ x.translate(c.width, 0); x.rotate(Math.PI / 2); } else { x.translate(0, c.height); x.rotate(-Math.PI / 2); }
  x.drawImage(s, 0, 0);
  const oW = s.width, oH = s.height;
  /* hidden areas and signatures keep their place on the page */
  p.red = (p.red || []).map(([rx, ry, rw, rh]) => dir > 0 ? [1 - ry - rh, rx, rh, rw] : [ry, 1 - rx - rw, rh, rw]);
  p.sig = (p.sig || []).map(g => { const hF = g.w * g.c.height / g.c.width * oW / oH, cx = g.x + g.w / 2, cy = g.y + hF / 2, ncx = dir > 0 ? 1 - cy : cy, ncy = dir > 0 ? cx : 1 - cx, nw = g.w * oW / oH, nh = nw * g.c.height / g.c.width * oH / oW;
    return Object.assign({}, g, {w: nw, x: ncx - nw / 2, y: ncy - nh / 2}); });
  p.base = c; p._f = null; p._fk = null; delete p.qr;
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root') || !DSC) return; let b;
  if ((b = t0.closest('[data-d4rot]'))){ const [i, d] = b.dataset.d4rot.split(':').map(Number); b.disabled = true; setTimeout(() => { d4Rotate(i, d); dscRender(); const n = $(`[data-d4rot="${i}:${d}"]`); if (n) n.focus(); }, 20); return; }
  if ((b = t0.closest('[data-d4mv]'))){ const [i, d] = b.dataset.d4mv.split(':').map(Number), j = i + d; if (j < 0 || j >= DSC.pages.length) return; const P = DSC.pages; [P[i], P[j]] = [P[j], P[i]]; dscRender(); const n = $(`[data-d4mv="${j}:${d}"]`); if (n && !n.disabled) n.focus(); return; }
  if ((b = t0.closest('[data-d4crop]'))){ const i = +b.dataset.d4crop, p = DSC.pages[i]; if (!p || !p.src) return; DSC.cur = {img: p.src.img, q: p.src.q.map(v => v.slice())}; DSC.recrop = i; DSC.guess = ''; dscRender(); const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'}); return; }
  if (t0.closest('#d4_adjReset')){ DSC.adj = {b: 0, c: 0}; d4AdjReset(); dscRender(); }
});

/* ---- the magnifier while dragging a corner ---- */
function d4Loupe(show){
  const box = $('#ds_crop'); if (!box) return; let L = $('#d4_loupe');
  if (!show){ if (L) L.hidden = true; return; }
  if (!L){ box.insertAdjacentHTML('beforeend', '<canvas id="d4_loupe" class="d4-loupe" width="240" height="240" aria-hidden="true"></canvas>'); L = $('#d4_loupe'); }
  const cur = DSC && DSC.cur, i = DSD && DSD.i; if (!cur || i == null) return;
  const [qx, qy] = cur.q[i], img = cur.img, x = L.getContext('2d'), Z = 3, R = 120 / Z, sx = qx * img.width, sy = qy * img.height, k = img.width / box.clientWidth;
  x.clearRect(0, 0, 240, 240); x.save(); x.beginPath(); x.arc(120, 120, 118, 0, 7); x.clip(); x.fillStyle = '#000'; x.fillRect(0, 0, 240, 240);
  x.drawImage(img, sx - R * k, sy - R * k, 2 * R * k, 2 * R * k, 0, 0, 240, 240);
  /* the crop lines through this corner */
  const toL = ([a, b2]) => [120 + (a * img.width - sx) / (R * k) * 120, 120 + (b2 * img.height - sy) / (R * k) * 120];
  x.strokeStyle = '#f2c14e'; x.lineWidth = 2.5; [cur.q[(i + 1) % 4], cur.q[(i + 3) % 4]].forEach(o => { const [ox, oy] = toL(o); x.beginPath(); x.moveTo(120, 120); x.lineTo(ox, oy); x.stroke(); });
  x.restore(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(120, 120, 118, 0, 7); x.stroke();
  x.strokeStyle = '#ff3b30'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(108, 120); x.lineTo(132, 120); x.moveTo(120, 108); x.lineTo(120, 132); x.stroke();
  /* place it above the finger, away from the corner, inside the photo */
  const bw = box.clientWidth, bh = box.clientHeight, px = qx * bw, py = qy * bh, size = Math.min(130, bw * 0.38);
  L.style.width = size + 'px'; L.style.height = size + 'px';
  let lx = px < bw / 2 ? bw - size - 8 : 8, ly = Math.max(8, Math.min(bh - size - 8, py - size - 40));
  L.style.left = lx + 'px'; L.style.top = ly + 'px'; L.hidden = false;
}
document.addEventListener('pointermove', () => { if (DSD && DSD.el && DSC && DSC.cur) d4Loupe(true); });
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#ds_crop .ds-hd')) setTimeout(() => d4Loupe(true), 0); }, true);
const d4Up = () => d4Loupe(false); document.addEventListener('pointerup', d4Up); document.addEventListener('pointercancel', d4Up);

/* ---- an A4-shaped photo is a document page ---- */
{ const g4 = dsGuess; dsGuess = function(img, q){ const r = g4.apply(this, arguments); if (r !== 'cert' && r !== 'other') return r;
    try { const sw = img.width, sh = img.height, mw = (dsDist(q[0], q[1], sw, sh) + dsDist(q[3], q[2], sw, sh)) / 2, mh = (dsDist(q[0], q[3], sw, sh) + dsDist(q[1], q[2], sw, sh)) / 2, rr = Math.max(mw, mh) / Math.min(mw, mh); if (mh > mw && rr >= 1.33 && rr <= 1.5) return 'doc'; } catch (e) {}
    return r; }; }

/* ---- wiring into the scanned-pages screen ---- */
{
  const card4 = dsCardRender;
  dsCardRender = function(root){
    const r = card4.apply(this, arguments);
    if (DSC && !DSC.cur){
      const n = DSC.pages.length;
      $$('#ds_root .ds-pg').forEach((fig, i) => { const cap = fig.querySelector('figcaption'); if (!cap || cap.querySelector('.d4-tools')) return;
        cap.insertAdjacentHTML('beforeend', `<span class="d4-tools">${DSC.pages[i].src ? `<button type="button" class="px-tb s" data-d4crop="${i}" aria-label="${d4E(t('d4_recrop', {n: i + 1}))}" title="${d4E(t('d4_recrop', {n: i + 1}))}">✂️</button>` : ''}<button type="button" class="px-tb s" data-d4rot="${i}:-1" aria-label="${d4E(t('d4_rotL', {n: i + 1}))}" title="${d4E(t('d4_rotL', {n: i + 1}))}">⟲</button><button type="button" class="px-tb s" data-d4rot="${i}:1" aria-label="${d4E(t('d4_rotR', {n: i + 1}))}" title="${d4E(t('d4_rotR', {n: i + 1}))}">⟳</button>${n > 1 ? `<button type="button" class="px-tb s" data-d4mv="${i}:-1" aria-label="${d4E(t('d4_up', {n: i + 1}))}"${i ? '' : ' disabled'}>↑</button><button type="button" class="px-tb s" data-d4mv="${i}:1" aria-label="${d4E(t('d4_down', {n: i + 1}))}"${i < n - 1 ? '' : ' disabled'}>↓</button>` : ''}</span>`); });
      const fl = root.querySelector('[data-dfl]'); const chips = fl && fl.closest('.ds-chips'); if (chips && !root.querySelector('.d4-adj')) chips.insertAdjacentHTML('afterend', d4AdjHTML());
    } else if (DSC && DSC.cur){ const tips = root.querySelector('.ds-tips'); if (tips && !root.querySelector('.d4-hint')) tips.insertAdjacentHTML('afterend', `<p class="fine d4-hint">🔍 ${d4E(t('d4_loupeH'))}</p>`); }
    return r;
  };
}
try { GS_SYN.docscan += ' סיבוב עמוד סידור עמודים בהירות ניגודיות rotate page reorder brightness contrast تدوير ترتيب سطوع تباين'; } catch (e) {}

/* ---- crop again: keep the original photo of the last pages (up to 8, to spare the phone's memory) ---- */
{
  const cut4 = dsCut;
  dsCut = function(){
    const C = DSC, cur = C && C.cur; if (!cur) return cut4.apply(this, arguments);
    const src = {img: cur.img, q: cur.q.map(v => v.slice())}, ri = C.recrop, n0 = C.pages.length;
    const r = cut4.apply(this, arguments);
    if (DSC && DSC.pages.length === n0 + 1){
      const np = DSC.pages[n0]; np.src = src;
      if (ri != null && ri >= 0 && ri < n0){ const old = DSC.pages[ri]; np.red = old.red || []; if (old.sig) np.sig = old.sig; DSC.pages.splice(n0, 1); DSC.pages[ri] = np; }
      const withSrc = DSC.pages.filter(p => p.src); withSrc.slice(0, Math.max(0, withSrc.length - 8)).forEach(p => { delete p.src; });
      DSC.recrop = null; if (DSX.view === 'card') dscRender();
    }
    return r;
  };
  const start4 = dsCardStart;
  dsCardStart = async function(){ if (DSC) DSC.recrop = null; return start4.apply(this, arguments); };
}
