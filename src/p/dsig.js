/* ---------- 13.9: signing scanned documents ----------
   A signature is drawn with a finger, typed, or taken from a photo, then placed on the page. Everything happens on the phone:
   nothing is sent, and the signature is kept on the device only when "remember" is ticked (its own key, never in settings exports).
   This is a simple electronic signature (an image of a signature), not a certified digital signature. */
const SG_KEY = 'fin-sig';
var DSG = {view: 'make', how: 'draw', strokes: [], pen: '#10204a', font: 0, name: '', img: null, keep: false, date: false, sig: null, pg: 0, x: 0, y: 0, w: 0.32, all: false, drag: null};
const SG_FONTS = ['italic 600 {s}px "Segoe Script","Brush Script MT","Snell Roundhand","Lucida Handwriting",cursive', 'italic 500 {s}px Georgia,"Times New Roman","David","Frank Ruehl CLM",serif', '600 {s}px "Comic Sans MS","Chalkboard SE","Segoe Print","Noteworthy",cursive'];
const sgE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function sgSaved(){ try { return localStorage.getItem(SG_KEY) || ''; } catch (e) { return ''; } }
function sgSave(url){ try { if (url) localStorage.setItem(SG_KEY, url); else localStorage.removeItem(SG_KEY); } catch (e) {} }
/* cut a canvas down to what is drawn on it, with a small margin */
function sgTrim(c){
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let a = c.width, b = c.height, z = -1, w = -1;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 12){ if (i < a) a = i; if (i > z) z = i; if (j < b) b = j; if (j > w) w = j; }
  if (z < 0) return null;
  const m = Math.round(Math.max(z - a, w - b) * 0.04) + 2, o = document.createElement('canvas'); o.width = z - a + 1 + m * 2; o.height = w - b + 1 + m * 2;
  o.getContext('2d').drawImage(c, a - m, b - m, o.width, o.height, 0, 0, o.width, o.height); return o;
}
/* the finished signature, optionally with today's date under it */
function sgFinish(c){
  if (!c) return null;
  if (!DSG.date) return c;
  const ds = new Date().toLocaleDateString(locOf ? locOf() : 'he-IL'), fs = Math.max(18, Math.round(c.height * 0.22)), o = document.createElement('canvas'), x0 = o.getContext('2d');
  x0.font = '500 ' + fs + 'px -apple-system,"Segoe UI",Arial,sans-serif'; const tw = x0.measureText(ds).width;
  o.width = Math.max(c.width, Math.ceil(tw) + 8); o.height = c.height + Math.round(fs * 1.5);
  const x = o.getContext('2d'); x.drawImage(c, (o.width - c.width) / 2, 0); x.font = '500 ' + fs + 'px -apple-system,"Segoe UI",Arial,sans-serif'; x.fillStyle = DSG.pen; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(ds, o.width / 2, c.height + fs * 0.25);
  return o;
}
function sgFromDraw(){
  if (!DSG.strokes.length) return null;
  const S = 3, pad = $('#sg_pad'), W = (pad ? pad.clientWidth : 340) * S, H = (pad ? pad.clientHeight : 180) * S, c = document.createElement('canvas'); c.width = W; c.height = H;
  sgPaint(c.getContext('2d'), S); return sgTrim(c);
}
function sgPaint(x, S){
  x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = DSG.pen; x.fillStyle = DSG.pen;
  DSG.strokes.forEach(st => {
    if (st.length === 1){ x.beginPath(); x.arc(st[0][0] * S, st[0][1] * S, 1.6 * S, 0, 7); x.fill(); return; }
    x.lineWidth = 2.6 * S; x.beginPath(); x.moveTo(st[0][0] * S, st[0][1] * S);
    for (let i = 1; i < st.length - 1; i++){ const mx = (st[i][0] + st[i + 1][0]) / 2, my = (st[i][1] + st[i + 1][1]) / 2; x.quadraticCurveTo(st[i][0] * S, st[i][1] * S, mx * S, my * S); }
    const l = st[st.length - 1]; x.lineTo(l[0] * S, l[1] * S); x.stroke();
  });
}
function sgFromType(){
  const s = String(DSG.name || '').trim(); if (!s) return null;
  const fs = 120, c = document.createElement('canvas'), f = SG_FONTS[DSG.font].replace('{s}', fs); let x = c.getContext('2d'); x.font = f;
  c.width = Math.ceil(x.measureText(s).width + fs); c.height = Math.round(fs * 1.8); x = c.getContext('2d'); x.font = f; x.fillStyle = DSG.pen; x.textBaseline = 'middle'; x.direction = /[֐-ۿ]/.test(s) ? 'rtl' : 'ltr'; x.textAlign = 'center';
  x.fillText(s, c.width / 2, c.height / 2); return sgTrim(c);
}
/* a photo of a signature on paper: the paper becomes transparent, the ink stays (in the chosen pen colour) */
function sgFromImg(){
  const im = DSG.img; if (!im) return null;
  const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  const x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height); const D = x.getImageData(0, 0, c.width, c.height), d = D.data;
  let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; const avg = sum / (d.length / 4), th = avg * 0.72;
  const pr = parseInt(DSG.pen.slice(1, 3), 16), pg = parseInt(DSG.pen.slice(3, 5), 16), pb = parseInt(DSG.pen.slice(5, 7), 16);
  for (let i = 0; i < d.length; i += 4){ const v = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, a = v >= th ? 0 : Math.min(255, Math.round((th - v) / th * 255 * 2.2)); d[i] = pr; d[i + 1] = pg; d[i + 2] = pb; d[i + 3] = a; }
  x.putImageData(D, 0, 0); return sgTrim(c);
}
function sgMake(){ return DSG.how === 'draw' ? sgFromDraw() : DSG.how === 'type' ? sgFromType() : sgFromImg(); }
function sgLoadUrl(u){ return new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); res(c); }; im.onerror = rej; im.src = u; }); }

/* ---------- drawing the signatures onto a page (called from dsCompose, after hiding and before the watermark) ---------- */
function dsSigDraw(p, x, W, H){
  (p.sig || []).forEach(s => { const w = s.w * W, h = w * s.c.height / s.c.width; x.drawImage(s.c, s.x * W, s.y * H, w, h); });
}
function dsSigHTML(){
  const n = DSC ? DSC.pages.reduce((a, p) => a + (p.sig || []).length, 0) : 0;
  return `<h4 class="ds-q">✍️ ${sgE(t('sg_title'))}</h4><p class="fine">${sgE(t('sg_hint'))}</p>
    <div class="btnrow"><button type="button" class="btn" id="sg_open">✍️ ${sgE(t(n ? 'sg_more' : 'sg_add'))}</button>${n ? `<button type="button" class="mv" id="sg_undo">↶ ${sgE(t('sg_undo'))}</button>` : ''}</div>
    ${n ? `<p class="ds-found ds-found-s" role="status">✓ ${sgE(t('sg_count', {n}))}</p>` : ''}`;
}

/* ---------- the dialog ---------- */
function sgOpen(){
  if (!DSC || !DSC.pages.length) return;
  Object.assign(DSG, {view: 'make', strokes: [], img: null, sig: null, pg: DSC.pages.length - 1, all: false});
  DSG.keep = !!sgSaved();
  let o = $('#dssg');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="dssg" hidden><div class="cp-box sg-box" role="dialog" aria-modal="true" aria-labelledby="dssg_t"><div class="cp-top"><h3 id="dssg_t"></h3><button type="button" class="cp-x" id="dssg_x">×</button></div><div id="dssg_b"></div></div></div>`); o = $('#dssg'); }
  o.hidden = false; document.body.classList.add('cp-lock'); sgPanel();
  setTimeout(() => { const f = $('#dssg_b button'); if (f) f.focus(); }, 30);
}
function sgClose(){ const o = $('#dssg'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#sg_open'); if (b) b.focus(); } }
function sgPanel(){
  const E = sgE, saved = sgSaved();
  $('#dssg_x').setAttribute('aria-label', t('cp_close'));
  if (DSG.view === 'place') return sgPlacePanel();
  $('#dssg_t').textContent = '✍️ ' + t('sg_makeT');
  const tabs = [['draw', '✍️'], ['type', '⌨️'], ['img', '🖼️']];
  $('#dssg_b').innerHTML = `
    ${saved ? `<div class="sg-saved"><img src="${saved}" alt="${E(t('sg_savedA'))}"><div class="btnrow"><button type="button" class="gold-btn" id="sg_useSaved">✓ ${E(t('sg_useSaved'))}</button><button type="button" class="mv" id="sg_delSaved">🗑️ ${E(t('sg_delSaved'))}</button></div></div><p class="fine">${E(t('sg_orNew'))}</p>` : ''}
    <div class="seg sg-tabs" role="tablist">${tabs.map(([k, ic]) => `<button type="button" role="tab" aria-selected="${DSG.how === k}" class="${DSG.how === k ? 'on' : ''}" data-sgh="${k}">${ic} ${E(t('sg_h_' + k))}</button>`).join('')}</div>
    <div id="sg_body">${DSG.how === 'draw' ? `<div class="sg-padw"><canvas id="sg_pad" aria-label="${E(t('sg_padA'))}"></canvas><span class="sg-line" aria-hidden="true"></span><span class="sg-ph" aria-hidden="true"${DSG.strokes.length ? ' hidden' : ''}>${E(t('sg_padPh'))}</span></div>
        <div class="btnrow"><button type="button" class="mv" id="sg_clr">🧽 ${E(t('sg_clear'))}</button><button type="button" class="mv" id="sg_bk">↶ ${E(t('sg_back1'))}</button></div><p class="fine">${E(t('sg_drawH'))}</p>`
      : DSG.how === 'type' ? `<div class="field"><label for="sg_name">${E(t('sg_name'))}</label><div class="control"><input id="sg_name" type="text" maxlength="40" dir="auto" autocomplete="off" value="${E(DSG.name)}"></div></div>
        <div class="sg-fonts" role="radiogroup" aria-label="${E(t('sg_style'))}">${SG_FONTS.map((f, i) => `<button type="button" role="radio" aria-checked="${DSG.font === i}" class="sg-font${DSG.font === i ? ' on' : ''}" data-sgf="${i}" style="font:${E(f.replace('{s}', 26))};color:${DSG.pen}">${E(DSG.name || t('sg_sample'))}</button>`).join('')}</div>`
      : `<div class="btnrow"><button type="button" class="btn" id="sg_pickImg">📷 ${E(t('sg_pickImg'))}</button><input type="file" accept="image/*" id="sg_file" hidden></div>${DSG.img ? `<div class="sg-prev" id="sg_imgPrev"></div>` : ''}<p class="fine">${E(t('sg_imgH'))}</p>`}</div>
    <div class="sg-pens" role="radiogroup" aria-label="${E(t('sg_pen'))}">${[['#10204a', 'sg_pBlue'], ['#111111', 'sg_pBlack'], ['#1d4ed8', 'sg_pBright']].map(([c, l]) => `<button type="button" role="radio" aria-checked="${DSG.pen === c}" class="sg-pen${DSG.pen === c ? ' on' : ''}" data-sgp="${c}"><i style="background:${c}"></i>${E(t(l))}</button>`).join('')}</div>
    <label class="prn-ck"><input type="checkbox" id="sg_date"${DSG.date ? ' checked' : ''}> ${E(t('sg_date'))}</label>
    <label class="prn-ck"><input type="checkbox" id="sg_keep"${DSG.keep ? ' checked' : ''}> ${E(t('sg_keep'))}</label>
    <div class="btnrow"><button type="button" class="gold-btn" id="sg_next">${E(t('sg_next'))} ›</button></div>
    <p class="fine sl-priv">🔒 ${E(t('sg_priv'))}</p>`;
  if (DSG.how === 'draw') sgPadDraw();
  if (DSG.how === 'img' && DSG.img){ const c = sgFromImg(), b = $('#sg_imgPrev'); if (b){ if (c){ c.setAttribute('aria-label', t('sg_savedA')); b.appendChild(c); } else b.textContent = t('sg_none'); } }
}
function sgPadDraw(){
  const cv = $('#sg_pad'); if (!cv) return; const w = cv.clientWidth || 320, h = cv.clientHeight || 180, r = Math.min(3, window.devicePixelRatio || 1);
  cv.width = w * r; cv.height = h * r; const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); sgPaint(x, r);
  const ph = $('#dssg .sg-ph'); if (ph) ph.hidden = !!DSG.strokes.length;
}
/* step 2: put it on the page */
function sgPlacePanel(){
  const E = sgE, P = DSC.pages, many = P.length > 1;
  $('#dssg_t').textContent = '✍️ ' + t('sg_placeT');
  $('#dssg_b').innerHTML = `
    ${many ? `<div class="ds-chips" role="radiogroup" aria-label="${E(t('sg_page'))}">${P.map((_, i) => `<button type="button" role="radio" class="ds-chip${i === DSG.pg ? ' on' : ''}" aria-checked="${i === DSG.pg}" data-sgpg="${i}">${E(t('ds_side', {n: i + 1}))}</button>`).join('')}</div>` : ''}
    <p class="fine">${E(t('sg_placeH'))}</p>
    <div class="sg-stage" id="sg_stage"><canvas id="sg_pagecv" aria-hidden="true"></canvas><img id="sg_mark" tabindex="0" role="img" alt="" draggable="false"></div>
    <div class="field"><label for="sg_size">${E(t('sg_size'))}</label><input type="range" id="sg_size" min="8" max="70" step="1" value="${Math.round(DSG.w * 100)}"></div>
    ${many ? `<label class="prn-ck"><input type="checkbox" id="sg_all"${DSG.all ? ' checked' : ''}> ${E(t('sg_all'))}</label>` : ''}
    <div class="btnrow"><button type="button" class="gold-btn" id="sg_apply">✓ ${E(t('sg_apply'))}</button><button type="button" class="mv" id="sg_back">‹ ${E(t('sg_backMake'))}</button></div>
    <p class="fine">${E(t('sg_legalShort'))}</p>`;
  const m = $('#sg_mark'); m.src = DSG.sig.toDataURL('image/png'); m.setAttribute('aria-label', t('sg_markA'));
  sgStageDraw();
}
function sgStageDraw(){
  const cv = $('#sg_pagecv'), st = $('#sg_stage'); if (!cv || !st) return;
  const p = DSC.pages[DSG.pg], c = dsCompose(p, 1200); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0);
  sgMarkPos();
}
function sgMarkPos(){
  const m = $('#sg_mark'), p = DSC.pages[DSG.pg]; if (!m || !p) return;
  const hFrac = DSG.w * DSG.sig.height / DSG.sig.width * p.base.width / p.base.height;
  DSG.x = Math.max(0, Math.min(1 - DSG.w, DSG.x)); DSG.y = Math.max(0, Math.min(1 - hFrac, DSG.y));
  m.style.left = (DSG.x * 100) + '%'; m.style.top = (DSG.y * 100) + '%'; m.style.width = (DSG.w * 100) + '%';
}
function sgToPlace(){
  const c = sgFinish(sgMake()); if (!c){ toast(t('sg_none')); return; }
  DSG.sig = c;
  if (DSG.keep){ try { sgSave(sgMake().toDataURL('image/png')); } catch (e) {} }
  sgStartPlace();
}
function sgStartPlace(){
  const p = DSC.pages[DSG.pg], rtl = document.documentElement.dir === 'rtl', size = (DS_CARDS.find(c => c[0] === DSC.type) || [0, 0, 'free'])[2];
  DSG.w = size === 'card' || size === 'pass' ? 0.4 : 0.3;
  const hFrac = DSG.w * DSG.sig.height / DSG.sig.width * p.base.width / p.base.height;
  DSG.x = rtl ? 0.08 : 1 - DSG.w - 0.08; DSG.y = Math.max(0, 0.86 - hFrac);
  DSG.view = 'place'; sgPanel(); setTimeout(() => { const m = $('#sg_mark'); if (m) m.focus(); }, 40);
}
function sgApply(){
  const L = DSG.all ? DSC.pages : [DSC.pages[DSG.pg]];
  L.forEach(p => { (p.sig = p.sig || []).push({c: DSG.sig, x: DSG.x, y: DSG.y, w: DSG.w}); });
  sgClose(); dscRender(); toast(t('sg_done'));
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#sg_open')){ sgOpen(); return; }
  if (t0.closest('#sg_undo')){ for (let i = DSC.pages.length - 1; i >= 0; i--){ const s = DSC.pages[i].sig; if (s && s.length){ const last = s[s.length - 1]; DSC.pages.forEach(p => { if (p.sig && p.sig[p.sig.length - 1] === last) p.sig.pop(); }); break; } } dscRender(); const u = $('#sg_undo') || $('#sg_open'); if (u) u.focus(); return; }
  if (!t0.closest('#dssg')) return;
  if (t0.closest('#dssg_x') || t0.id === 'dssg'){ sgClose(); return; }
  if ((b = t0.closest('[data-sgh]'))){ DSG.how = b.dataset.sgh; sgPanel(); const n = $(`#dssg [data-sgh="${DSG.how}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-sgp]'))){ DSG.pen = b.dataset.sgp; sgPanel(); const n = $(`#dssg [data-sgp="${DSG.pen}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-sgf]'))){ DSG.font = +b.dataset.sgf; sgPanel(); const n = $(`#dssg [data-sgf="${DSG.font}"]`); if (n) n.focus(); return; }
  if (t0.closest('#sg_clr')){ DSG.strokes = []; sgPadDraw(); return; }
  if (t0.closest('#sg_bk')){ DSG.strokes.pop(); sgPadDraw(); return; }
  if (t0.closest('#sg_pickImg')){ const f = $('#sg_file'); if (f) f.click(); return; }
  if (t0.closest('#sg_useSaved')){ sgLoadUrl(sgSaved()).then(c => { DSG.sig = sgFinish(c); sgStartPlace(); }).catch(() => toast(t('sg_none'))); return; }
  if (t0.closest('#sg_delSaved')){ sgSave(''); DSG.keep = false; sgPanel(); toast(t('sg_deleted')); return; }
  if (t0.closest('#sg_next')){ sgToPlace(); return; }
  if (t0.closest('#sg_back')){ DSG.view = 'make'; sgPanel(); return; }
  if ((b = t0.closest('[data-sgpg]'))){ DSG.pg = +b.dataset.sgpg; sgPlacePanel(); return; }
  if (t0.closest('#sg_apply')){ sgApply(); return; }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#dssg')) return;
  if (el.id === 'sg_date') DSG.date = el.checked;
  if (el.id === 'sg_keep'){ DSG.keep = el.checked; if (!el.checked && sgSaved()){ sgSave(''); toast(t('sg_deleted')); } }
  if (el.id === 'sg_all') DSG.all = el.checked;
  if (el.id === 'sg_file' && el.files && el.files[0]){ dsLoad(el.files[0]).then(c => { DSG.img = c; sgPanel(); }).catch(() => toast(t('ph_fail'))); el.value = ''; }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'sg_name'){ DSG.name = el.value.slice(0, 40); $$('#dssg .sg-font').forEach(b => b.textContent = DSG.name || t('sg_sample')); }
  if (el.id === 'sg_size'){ DSG.w = +el.value / 100; sgMarkPos(); }
});
/* drawing on the pad, and dragging the signature on the page */
document.addEventListener('pointerdown', e => {
  const t0 = e.target; if (!t0.closest) return;
  if (t0.id === 'sg_pad'){ e.preventDefault(); const r = t0.getBoundingClientRect(); DSG.drag = {pad: t0}; DSG.strokes.push([[e.clientX - r.left, e.clientY - r.top]]); try { t0.setPointerCapture(e.pointerId); } catch (er) {} sgPadDraw(); return; }
  if (t0.id === 'sg_mark'){ e.preventDefault(); const r = $('#sg_stage').getBoundingClientRect(); DSG.drag = {mark: true, dx: (e.clientX - r.left) / r.width - DSG.x, dy: (e.clientY - r.top) / r.height - DSG.y}; try { t0.setPointerCapture(e.pointerId); } catch (er) {} t0.focus(); }
});
document.addEventListener('pointermove', e => {
  const D = DSG.drag; if (!D) return;
  if (D.pad){ const r = D.pad.getBoundingClientRect(); DSG.strokes[DSG.strokes.length - 1].push([e.clientX - r.left, e.clientY - r.top]); sgPadDraw(); return; }
  if (D.mark){ const r = $('#sg_stage').getBoundingClientRect(); DSG.x = (e.clientX - r.left) / r.width - D.dx; DSG.y = (e.clientY - r.top) / r.height - D.dy; sgMarkPos(); }
});
const sgUp = () => { DSG.drag = null; };
document.addEventListener('pointerup', sgUp); document.addEventListener('pointercancel', sgUp);
document.addEventListener('keydown', e => {
  const o = $('#dssg'); if (!o || o.hidden) return;
  if (e.key === 'Escape'){ sgClose(); return; }
  if (e.target && e.target.id === 'sg_mark'){
    const s = e.shiftKey ? 0.05 : 0.01, m = {ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s]}[e.key];
    if (m){ e.preventDefault(); DSG.x += m[0]; DSG.y += m[1]; sgMarkPos(); return; }
    if (e.key === '+' || e.key === '='){ e.preventDefault(); DSG.w = Math.min(0.7, DSG.w + 0.02); sgMarkPos(); const r = $('#sg_size'); if (r) r.value = Math.round(DSG.w * 100); return; }
    if (e.key === '-'){ e.preventDefault(); DSG.w = Math.max(0.08, DSG.w - 0.02); sgMarkPos(); const r = $('#sg_size'); if (r) r.value = Math.round(DSG.w * 100); return; }
    if (e.key === 'Enter'){ e.preventDefault(); sgApply(); return; }
  }
  if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button,input,[tabindex="0"]')].filter(x => x.offsetParent && !x.disabled && x.type !== 'file'); if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
});
window.addEventListener('resize', () => { const o = $('#dssg'); if (o && !o.hidden){ if (DSG.view === 'make' && DSG.how === 'draw') sgPadDraw(); else if (DSG.view === 'place') sgMarkPos(); } });
{ const alSg = applyLang; applyLang = function(){ const r = alSg.apply(this, arguments); try { const o = $('#dssg'); if (o && !o.hidden) sgPanel(); } catch (e) {} return r; }; }
try { GS_SYN.docscan += ' חתימה לחתום חתימה דיגיטלית חתימה אלקטרונית sign signature e-signature توقيع توقيع إلكتروني'; } catch (e) {}
