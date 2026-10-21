/* 13.31: a regular calculator and a scientific calculator with the full way to the answer (engine: mx_engine.js, steps: mx_solve.js) */
const csE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* typed symbols → what the engine reads */
const csNorm = s => String(s || '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√\(/g, 'sqrt(').replace(/∛\(/g, 'cbrt(').replace(/\^\(-1\)/g, '^(-1)').replace(/,(?=\d{3}\b)/g, '');
function csEval(src, deg){
  const old = MXE.deg; MXE.deg = !!deg;
  try { return mxEval(mxParse(csNorm(src)), mxBaseScope()); } finally { MXE.deg = old; }
}
const csFmt = v => typeof v === 'number' ? mxFmt(v) : mxFmt(v);
let CS_KEYS = false;
/* 7/4 → 1 3/4 */
const csMixed = fr => { const m = /^(-?)(\d+)\/(\d+)$/.exec(fr); if (!m) return ''; const n = +m[2], dd = +m[3]; if (n < dd) return ''; const w = Math.floor(n / dd), r = n % dd; return r ? m[1] + w + ' ' + r + '/' + dd : ''; };
/* 30.5° → 30° 30′ 0″ */
const csDMS = v => { if (typeof v !== 'number' || !isFinite(v)) return ''; const sg = v < 0 ? '−' : ''; let a = Math.abs(v), dg = Math.floor(a), mn = Math.floor((a - dg) * 60), sc = Math.round(((a - dg) * 60 - mn) * 60 * 100) / 100; if (sc >= 60){ sc = 0; mn++; } if (mn >= 60){ mn = 0; dg++; } return sg + dg + '° ' + mn + '′ ' + sc + '″'; };

/* ================= the regular calculator ================= */
const CB_KEYS = [['MC', 'mc'], ['MR', 'mr'], ['M−', 'm-'], ['M+', 'm+'],
  ['AC', 'ac'], ['±', 'neg'], ['%', 'pct'], ['÷', '÷'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['×', '×'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['−', '−'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+'],
  ['⌫', 'back'], ['0', '0'], ['.', '.'], ['=', '=']];
const cbOp = c => ['+', '−', '×', '÷'].includes(c);
function cbD(){ const d = miD('calcbasic'); if (typeof d.e !== 'string') d.e = ''; if (!Array.isArray(d.h)) d.h = []; if (typeof d.m !== 'number') d.m = 0; return d; }
function cbLast(e){ const m = /(-?\d*\.?\d*)$/.exec(e); return m ? m[1] : ''; }
function cbValue(e){ let s = e; while (s && cbOp(s.slice(-1))) s = s.slice(0, -1); if (!s) return 0; return csEval(s); }
function cbPress(k){
  const d = cbD(); let e = d.e;
  if (d.done && /^[0-9.]$/.test(k)){ e = ''; } d.done = false;
  if (/^[0-9]$/.test(k)){ const last = cbLast(e); if (last === '0' && !e.endsWith('.0')) e = e.slice(0, -1); e += k; }
  else if (k === '.'){ const last = cbLast(e); if (!last.includes('.')) e += (last === '' || last === '-' ? '0' : '') + '.'; }
  else if (cbOp(k)){ if (!e) e = k === '−' ? '-' : '0'; if (e === '-') return cbShow(); if (cbOp(e.slice(-1))) e = e.slice(0, -1); if (k !== '−' || e !== '-') e += k; }
  else if (k === 'ac'){ e = ''; }
  else if (k === 'back'){ e = e.slice(0, -1); }
  else if (k === 'neg'){ const last = cbLast(e); if (last && last !== '-'){ const base = e.slice(0, e.length - last.length); e = base + (last.startsWith('-') ? last.slice(1) : '-' + last); } else if (!e) e = '-'; }
  else if (k === 'pct'){ const last = cbLast(e); if (last && last !== '-'){ const base = e.slice(0, e.length - last.length), op = base.slice(-1), n = parseFloat(last);
      let v = n / 100; if (op === '+' || op === '−'){ try { v = cbValue(base.slice(0, -1)) * n / 100; } catch (er) {} }
      e = base + String(+v.toPrecision(12)); } }
  else if (k === '='){ if (!e) return cbShow(); try { const v = cbValue(e); if (typeof v === 'number' && isFinite(v)){ d.h.unshift({e: e.replace(/[+−×÷]$/, ''), v: +v.toPrecision(14)}); d.h = d.h.slice(0, 30); e = String(+v.toPrecision(14)); d.done = true; } else { toast(t(typeof v === 'number' && !isNaN(v) ? 'mx_eDiv0' : 'cs_err')); } } catch (er) { toast(er && er.mx ? mxErrTxt(er) : t('cs_err')); } }
  else if (k === 'vat+' || k === 'vat-'){ try { const v0 = cbValue(e), r = IL26.vat || 0.18; if (typeof v0 === 'number' && isFinite(v0)){ const v = k === 'vat+' ? v0 * (1 + r) : v0 / (1 + r); d.h.unshift({e: (e || '0').replace(/[+−×÷]$/, '') + (k === 'vat+' ? ' + ' : ' − ') + t('cs_vatShort', {p: Math.round(r * 100)}), v: +v.toPrecision(14)}); d.h = d.h.slice(0, 30); e = String(+v.toFixed(2)); d.done = true; } } catch (er) { toast(t('cs_err')); } }
  else if (k === 'mc') d.m = 0;
  else if (k === 'mr'){ const v = String(+d.m.toPrecision(14)); if (d.done || !e || cbOp(e.slice(-1))){ if (d.done) e = ''; e += v; } }
  else if (k === 'm+' || k === 'm-'){ try { const v = cbValue(e); if (typeof v === 'number' && isFinite(v)) d.m += k === 'm+' ? v : -v; } catch (er) {} }
  d.e = e.slice(0, 120); clearTimeout(cbD.t); cbD.t = setTimeout(() => { try { saveSet(); } catch (er) {} }, 600);
  cbShow();
}
function cbShow(){
  const d = cbD(), ex = document.getElementById('cb_ex'), out = document.getElementById('cb_out'), mem = document.getElementById('cb_mem'); if (!ex) return;
  ex.textContent = d.e.replace(/-/g, '−') || '0';
  let live = '';
  if (d.e && !d.done){ try { const v = cbValue(d.e); if (typeof v === 'number' && isFinite(v) && /[+−×÷]/.test(d.e.replace(/^-/, ''))) live = '= ' + csFmt(v); } catch (er) {} }
  out.textContent = d.done ? '' : live;
  mem.textContent = d.m ? 'M ' + csFmt(d.m) : '';
  cbTape();
  const h = document.getElementById('cb_hist'); if (h) h.innerHTML = d.h.length ? d.h.map((x, i) => `<li><button type="button" data-cbh="${i}" dir="ltr"><span>${csE(x.e.replace(/-/g, '−'))}</span><b>= ${csE(csFmt(x.v))}</b></button></li>`).join('') : `<li class="fine">${csE(t('cs_noHist'))}</li>`;
}
/* the tape: every number of the current calculation on its own line; tap a number to fix it and the result follows */
function cbParts(e){ const out = []; let cur = ''; for (let i = 0; i < e.length; i++){ const c = e[i]; if (cbOp(c) && cur !== '' && cur !== '-'){ out.push(cur, c); cur = ''; } else cur += c; } if (cur !== '') out.push(cur); return out; }
function cbTape(){
  const box = document.getElementById('cb_tape'); if (!box) return; const d = cbD(), P = cbParts(d.done ? '' : d.e), nums = P.filter((x, i) => i % 2 === 0);
  if (nums.length < 2){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="cs-tape-h">${csE(t('cs_tape'))}</div>` + P.map((x, i) => i % 2 ? '' : `<div class="cs-tl" dir="ltr"><span class="cs-top">${i ? csE(P[i - 1]) : ''}</span>${CB_EDIT === i ? `<input class="cs-tin" id="cb_tin" inputmode="decimal" dir="ltr" value="${csE(x)}" data-cbi="${i}">` : `<button type="button" class="cs-tn" data-cbt="${i}" aria-label="${csE(t('cs_tapeEdit', {n: x}))}">${csE(x.replace(/-/g, '−'))}</button>`}</div>`).join('');
  const inp = document.getElementById('cb_tin'); if (inp){ inp.focus(); try { inp.select(); } catch (er) {} }
}
let CB_EDIT = -1;
function cbTapeSet(i, val){ const d = cbD(), P = cbParts(d.e), v = String(val || '').replace(/[,\s]/g, '').replace(/[−–]/g, '-'); if (/^-?\d*\.?\d+$/.test(v)){ P[i] = v; d.e = P.join(''); } CB_EDIT = -1; cbShow(); try { saveSet(); } catch (er) {} }
/* share the calculation as text or as a picture */
function cbText(){ const d = cbD(); let v = ''; try { v = csFmt(cbValue(d.e)); } catch (er) {} const ex = (d.done && d.h[0] ? d.h[0].e : d.e).replace(/-/g, '−'); return ex + ' = ' + (d.done && d.h[0] ? csFmt(d.h[0].v) : v); }
async function cbImage(){
  const txt = cbText(), [ex, res] = txt.split(' = '), cv = document.createElement('canvas'), W = 900, H = 420; cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const dark = document.documentElement.dataset.theme === 'dark'; g.fillStyle = dark ? '#111827' : '#fbf8f1'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#9A6A06'; g.fillRect(0, 0, W, 10); g.textAlign = 'right'; g.direction = 'ltr';
  g.fillStyle = dark ? '#cbd5e1' : '#57534e'; g.font = '600 34px system-ui, sans-serif'; g.fillText(ex.length > 40 ? '…' + ex.slice(-40) : ex, W - 50, 150);
  g.fillStyle = dark ? '#ffffff' : '#111827'; g.font = '800 84px system-ui, sans-serif'; g.fillText('= ' + res, W - 50, 270);
  g.textAlign = 'left'; g.direction = document.documentElement.dir || 'rtl'; g.fillStyle = dark ? '#94a3b8' : '#78716c'; g.font = '500 26px system-ui, sans-serif'; g.fillText(t('appTitle') || '', 50, 375);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png')); if (!blob) return;
  const file = new File([blob], 'calculation.png', {type: 'image/png'});
  try { if (navigator.canShare && navigator.canShare({files: [file]})){ await navigator.share({files: [file], text: txt}); return; } } catch (er) { if (er && er.name === 'AbortError') return; }
  try { await fileSave(blob, 'calculation.png', 'image/png'); } catch (er) {}
}
miniDef('calcbasic', {
  resettable: true,
  render(box){
    box.innerHTML = `<div class="cs-calc cb">
      <div class="cs-disp" aria-live="polite"><div class="cs-mem" id="cb_mem"></div><div class="cs-ex" id="cb_ex" dir="ltr"></div><div class="cs-out" id="cb_out" dir="ltr"></div></div>
      <div class="cs-pad cb-pad" dir="ltr">${CB_KEYS.map(([l, k]) => `<button type="button" class="cs-k${cbOp(k) ? ' op' : ''}${k === '=' ? ' eq' : ''}${/^m/.test(k) ? ' mem' : ''}${['ac', 'neg', 'pct', 'back'].includes(k) ? ' fn' : ''}" data-cb="${csE(k)}">${csE(l)}</button>`).join('')}</div>
      <div class="cs-pad cb-vat" dir="ltr"><button type="button" class="cs-k mem" data-cb="vat+">${csE(t('cs_vatAdd', {p: Math.round((IL26.vat || 0.18) * 100)}))}</button><button type="button" class="cs-k mem" data-cb="vat-">${csE(t('cs_vatSub', {p: Math.round((IL26.vat || 0.18) * 100)}))}</button></div>
      <div class="cs-tape" id="cb_tape" hidden></div>
      <div class="btnrow cs-acts"><button type="button" class="mv" id="cb_copy">📋 ${csE(t('cs_copy'))}</button><button type="button" class="mv" id="cb_share">📤 ${csE(t('cs_share'))}</button><button type="button" class="mv" id="cb_img">🖼️ ${csE(t('cs_img'))}</button><button type="button" class="mv" data-go="scical">🔬 ${csE(t('tab_scical'))}</button></div>
      <details class="adv cs-hist"><summary>🕘 ${csE(t('cs_hist'))}</summary><ul id="cb_hist" class="cs-hl"></ul><button type="button" class="mv" id="cb_hclr">${csE(t('cs_hClr'))}</button></details>
      <p class="fine">${csE(t('cs_kbd'))}</p></div>`;
    cbShow();
  }
});

/* ================= the scientific calculator ================= */
const SC_KEYS = [
  [['2nd', '@2nd'], ['DEG', '@deg'], ['(', '('], [')', ')'], ['x', 'x'], ['AC', '@ac']],
  [['x²', '^2', 'x³', '^3'], ['xʸ', '^', 'ʸ√x', 'root('], ['√', '√(', '∛', '∛('], ['1/x', '^(-1)', '|x|', 'abs('], ['n!', '!', 'mod', ' mod '], ['⌫', '@back']],
  [['sin', 'sin(', 'sin⁻¹', 'asin('], ['cos', 'cos(', 'cos⁻¹', 'acos('], ['tan', 'tan(', 'tan⁻¹', 'atan('], ['ln', 'ln(', 'eˣ', 'exp('], ['log', 'log(', '10ˣ', '10^'], ['EE', '*10^']],
  [['π', 'π'], ['e', 'e'], ['nCr', 'ncr(', 'nPr', 'npr('], ['|x|', 'abs('], ['mod', ' mod '], ['=', '=']],
  [['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷'], [',', ','], ['ans', 'ans']],
  [['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'], ['%', '/100'], ['<', '<', '>', '>']],
  [['1', '1'], ['2', '2'], ['3', '3'], ['−', '−'], ['sinh', 'sinh(', 'asinh', 'asinh('], ['cosh', 'cosh(', 'acosh', 'acosh(']],
  [['0', '0'], ['.', '.'], ['±', '(-'], ['+', '+'], ['tanh', 'tanh(', 'atanh', 'atanh('], ['↵', '@go']]
];
function scD(){ const d = miD('scical'); if (typeof d.e !== 'string') d.e = ''; if (!Array.isArray(d.h)) d.h = []; if (d.deg == null) d.deg = true; return d; }
const scHasX = s => /(^|[^a-z])x([^a-z]|$)/i.test(csNorm(s).replace(/\bexp\b|\bmax\b|\bmin\b/g, ''));
function scInput(){ return document.getElementById('sc_in'); }
function scInsert(txt){
  const i = scInput(); if (!i) return; const d = scD();
  if (d.done && /^[0-9.(πexsclatn√∛]/.test(txt)){ i.value = ''; } else if (d.done && /^[\^!×÷+−*%]/.test(txt)){ i.value = 'ans'; }
  d.done = false;
  const a = i.selectionStart == null ? i.value.length : i.selectionStart, b = i.selectionEnd == null ? a : i.selectionEnd;
  i.value = i.value.slice(0, a) + txt + i.value.slice(b); const p = a + txt.length; try { i.setSelectionRange(p, p); } catch (e) {}
  d.e = i.value; scLive();
}
function scLive(){
  const i = scInput(), pv = document.getElementById('sc_pv'), lv = document.getElementById('sc_live'); if (!i || !pv) return;
  const s = i.value.trim(); let html = '', live = '';
  if (s){ try { html = mxHTML(mxParse(csNorm(s))); } catch (e) {} if (!/=|<|>/.test(s) && !scHasX(s)){ try { const v = csEval(s, scD().deg); if (typeof v === 'number' && isFinite(v)) live = '= ' + csFmt(v); } catch (e) {} } }
  pv.innerHTML = html; lv.textContent = live;
  clearTimeout(scLive.t); scLive.t = setTimeout(() => { try { saveSet(); } catch (e) {} }, 700);
}
async function scGo(){
  const i = scInput(), out = document.getElementById('sc_out'); if (!i || !out) return; const d = scD(), s = i.value.trim(); if (!s) return;
  out.innerHTML = `<div class="mx-card"><span class="mx-sub">⏳ ${csE(t('mx_comp'))}</span></div>`;
  const isTask = /=|<|>/.test(s) || scHasX(s);
  let num = null, numErr = '';
  if (!isTask){ try { num = csEval(s, d.deg); } catch (e) { numErr = mxErrTxt(e); } }
  let r = null; const old = MXE.deg; MXE.deg = !!d.deg;
  try { r = await xsSolve(csNorm(s), mxBaseScope()); } catch (e) { r = null; } finally { MXE.deg = old; }
  let html = '';
  if (!isTask){
    if (typeof num === 'number' || mxIsM(num)){
      const fr = typeof num === 'number' ? mxFrac(num) : '';
      const mixed = fr ? csMixed(fr) : '', dms = typeof num === 'number' && d.deg && /\ba(sin|cos|tan)\(|⁻¹/.test(csNorm(s)) ? csDMS(num) : '';
      html += `<div class="cs-res"><div class="cs-big" dir="ltr">= ${csE(csFmt(num))}${dms ? '°' : ''}</div>${fr ? `<div class="mx-sub" dir="ltr">= ${csE(fr)}${mixed ? ' = ' + csE(mixed) : ''}</div>` : ''}${dms ? `<div class="mx-sub" dir="ltr">= ${csE(dms)}</div>` : ''}</div>`;
      if (typeof num === 'number'){ d.h.unshift({e: s, v: csFmt(num)}); d.h = d.h.slice(0, 30); d.done = true; }
    } else html += `<div class="mx-err">⚠️ ${csE(numErr || t('cs_err'))}</div>`;
  }
  if (r && r.kind !== 'fail' && r.steps && r.steps.length){
    if (isTask){ html += `<div class="cs-res"><div class="mx-lab">${csE(t(XS_KIND[r.kind] || 'xs_kCalc'))}</div><div class="cs-big" dir="ltr">${r.answer}</div><div class="${r.ok ? 'mx-ok' : 'mx-err'} xs-ver">${r.ok ? '✓ ' + csE(t('xs_verOk')) : '⚠️ ' + csE(t('xs_verNo'))}</div></div>`; d.h.unshift({e: s, v: r.answerTxt || ''}); d.h = d.h.slice(0, 30); }
    html += `<details class="mx-steps xs-steps cs-steps" ${isTask ? 'open' : ''}><summary>🪜 ${csE(t('cs_way'))} (${r.steps.length})</summary><ol class="xs-ol">${r.steps.map(st => `<li><div class="xs-k">${xsKtxt(t(st.k, st.p || {}))}</div>${st.h ? `<div class="xs-m" dir="ltr">${st.h}</div>` : ''}</li>`).join('')}</ol></details>`;
  } else if (isTask){
    html += `<div class="mx-err">⚠️ ${csE(t('cs_noSolve'))}</div>`;
  }
  html += `<div class="btnrow"><button type="button" class="mv" id="sc_toMx">📐 ${csE(t('cs_toMx'))}</button>${typeof cvAiOk === 'function' && cvAiOk() ? `<button type="button" class="mv" id="sc_ai">🤖 ${csE(t('cs_ai'))}</button>` : ''}</div><div id="sc_aiout" hidden></div>`;
  const gx = scHasX(s); if (gx) html += `<div class="cs-graph"><canvas id="sc_cv" width="640" height="320" aria-label="${csE(t('cs_graph'))}"></canvas><p class="fine" id="sc_gnote"></p></div>`;
  out.innerHTML = html; scHist(); try { saveSet(); } catch (e) {}
  if (gx) try { scGraph(s, d.deg); } catch (e) {}
}
/* the graph next to the solution: f(x), or left side − right side for an equation; zeros marked */
function scGraph(src, deg){
  const cv = document.getElementById('sc_cv'), note = document.getElementById('sc_gnote'); if (!cv) return;
  const n = csNorm(src), m = /^(.*?)(<=|>=|=|<|>)(.*)$/.exec(n), expr = m ? '(' + m[1] + ')-(' + m[3] + ')' : n;
  let node; try { node = mxParse(expr); } catch (e) { cv.parentNode.hidden = true; return; }
  const S = mxBaseScope(), old = MXE.deg; MXE.deg = !!deg;
  const f = x => { S.v.x = x; try { const v = mxEval(node, S); return typeof v === 'number' && isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
  try {
    /* find zeros on a wide range to choose the window */
    const zs = [], trig = deg && /\b(a?sin|a?cos|a?tan)h?\(/.test(n), R = trig ? 400 : 50, st = trig ? 0.25 : 0.05; let px = -R, pv = f(px);
    for (let x = -R + st; x <= R; x += st){ const v = f(x); if (isFinite(v) && isFinite(pv) && (v === 0 || (v > 0) !== (pv > 0)) && Math.abs(v - pv) < 1e3){ let a = x - st, b = x, fa = pv; for (let k = 0; k < 40; k++){ const mm = (a + b) / 2, fm = f(mm); if ((fm > 0) === (fa > 0)){ a = mm; fa = fm; } else b = mm; } const z = (a + b) / 2; if (!zs.some(q => Math.abs(q - z) < 1e-6)) zs.push(+z.toFixed(6)); } px = x; pv = v; }
    let x0 = -10, x1 = 10; if (zs.length){ const lo = Math.min.apply(null, zs), hi = Math.max.apply(null, zs), pad = Math.max(2, (hi - lo) * 0.4); x0 = Math.floor(lo - pad); x1 = Math.ceil(hi + pad); }
    const W = cv.width, H = cv.height, N = 400, pts = []; for (let i = 0; i <= N; i++){ const x = x0 + (x1 - x0) * i / N; pts.push([x, f(x)]); }
    const ys = pts.map(p => p[1]).filter(isFinite).sort((a, b) => a - b); if (!ys.length){ cv.parentNode.hidden = true; return; }
    let y0 = ys[Math.floor(ys.length * 0.03)], y1 = ys[Math.floor(ys.length * 0.97)]; if (y0 > 0) y0 = 0; if (y1 < 0) y1 = 0; if (y1 - y0 < 1e-9){ y0 -= 1; y1 += 1; } const yp = (y1 - y0) * 0.12; y0 -= yp; y1 += yp;
    const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H, g = cv.getContext('2d'), cs = getComputedStyle(document.body);
    const ink = cs.getPropertyValue('--ink').trim() || '#111', ink2 = cs.getPropertyValue('--ink-2').trim() || '#666', gold = cs.getPropertyValue('--gold').trim() || '#9A6A06';
    g.clearRect(0, 0, W, H); g.lineWidth = 1; g.strokeStyle = ink2; g.globalAlpha = 0.25;
    const step = Math.pow(10, Math.floor(Math.log10((x1 - x0) / 2))); for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step){ g.beginPath(); g.moveTo(X(gx), 0); g.lineTo(X(gx), H); g.stroke(); }
    g.globalAlpha = 0.8; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke(); if (x0 < 0 && x1 > 0){ g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = ink2; g.font = '12px system-ui'; g.fillText(String(x0), 4, Y(0) - 4); g.textAlign = 'right'; g.fillText(String(x1), W - 4, Y(0) - 4); g.textAlign = 'left';
    g.strokeStyle = gold; g.lineWidth = 2.5; g.beginPath(); let pen = false; pts.forEach(([x, y]) => { if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)){ pen = false; return; } if (!pen){ g.moveTo(X(x), Y(y)); pen = true; } else g.lineTo(X(x), Y(y)); }); g.stroke();
    g.fillStyle = ink; zs.filter(z => z >= x0 && z <= x1).forEach(z => { g.beginPath(); g.arc(X(z), Y(0), 5, 0, 7); g.fill(); g.fillText(mxFmt(+z.toFixed(4)), X(z) + 6, Y(0) + 16); });
    if (note) note.textContent = (m ? t('cs_gEq') : t('cs_gFn')) + (zs.length ? ' ' + t('cs_gZeros', {z: zs.slice(0, 6).map(z => mxFmt(+z.toFixed(4))).join(', ')}) : '');
  } finally { MXE.deg = old; }
}
/* a photo of an exercise: the AI reads it, the calculator solves it */
async function scPhoto(file){
  const out = document.getElementById('sc_out'), i = scInput(); if (!file || !out || !i) return;
  if (typeof slEngine !== 'function' || !slEngine()){ toast(t('cs_noAi')); return; }
  out.innerHTML = `<div class="mx-card"><span class="mx-sub">📷 ${csE(t('cs_reading'))}</span></div>`;
  try {
    const blob = typeof vtShrink === 'function' ? await vtShrink(file, 1800) : file;
    const j = await dsAsk('This is a photo of a maths exercise (it may be handwritten, Hebrew or Arabic text around it). Return ONLY JSON: {"exercise": the exercise in one line of plain calculator syntax — use * / ^ ( ) sqrt() abs() sin() cos() tan() log() ln() pi, x for the unknown, = for equations, < > for inequalities; no words; "" if there is no exercise}', [blob]);
    const ex = String(j && j.exercise || '').trim().slice(0, 200);
    if (!ex){ out.innerHTML = `<div class="mx-err">⚠️ ${csE(t('cs_noEx'))}</div>`; return; }
    i.value = ex; scD().e = ex; scD().done = false; scLive(); scGo();
  } catch (e) { out.innerHTML = `<div class="mx-err">⚠️ ${csE(t('cs_photoFail'))}</div>`; }
}
document.addEventListener('change', e => { const el = e.target; if (!el) return;
  if (el.id === 'sc_cam' || el.id === 'sc_gal'){ const f = el.files && el.files[0]; el.value = ''; scPhoto(f); }
  if (el.id === 'cb_tin') cbTapeSet(+el.dataset.cbi, el.value); });
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'cb_tin'){ if (e.key === 'Enter'){ e.preventDefault(); cbTapeSet(+e.target.dataset.cbi, e.target.value); } else if (e.key === 'Escape'){ CB_EDIT = -1; cbTape(); } } });
function scHist(){ const h = document.getElementById('sc_hist'); if (!h) return; const d = scD(); h.innerHTML = d.h.length ? d.h.map((x, i) => `<li><button type="button" data-sch="${i}" dir="ltr"><span>${csE(x.e)}</span><b>${x.v ? '= ' + csE(x.v) : ''}</b></button></li>`).join('') : `<li class="fine">${csE(t('cs_noHist'))}</li>`; }
function scPad(){ const d = scD(), two = !!d.two; return SC_KEYS.map(row => row.map(k => {
    const alt = k.length > 2 && two, l = alt ? k[2] : k[0], v = alt ? k[3] : k[1];
    const cls = v === '@go' ? ' eq' : v === '@2nd' ? (two ? ' on fn' : ' fn') : v === '@deg' ? ' fn' : /^[0-9.]$/.test(v) ? '' : ['÷', '×', '−', '+'].includes(v) ? ' op' : ' sf';
    const lab = v === '@deg' ? (d.deg ? 'DEG' : 'RAD') : l;
    return `<button type="button" class="cs-k${cls}" data-sck="${csE(v)}">${csE(lab)}</button>`; }).join('')).join(''); }
miniDef('scical', {
  resettable: true,
  render(box){
    const d = scD();
    box.innerHTML = `<div class="cs-calc sc">
      <div class="cs-disp sc-disp"><input id="sc_in" class="sc-in" dir="ltr" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" enterkeyhint="go" value="${csE(d.e)}" placeholder="${csE(t('cs_scPh'))}" aria-label="${csE(t('cs_scLab'))}">
        <div class="sc-pv" id="sc_pv" dir="ltr"></div><div class="cs-out" id="sc_live" dir="ltr"></div></div>
      <div class="btnrow cs-photo"><label class="mv">📷 ${csE(t('cs_photo'))}<input type="file" accept="image/*" capture="environment" id="sc_cam" hidden></label><label class="mv">🖼️ ${csE(t('cs_gallery'))}<input type="file" accept="image/*" id="sc_gal" hidden></label></div>
      <div class="cs-pad sc-pad" dir="ltr" id="sc_pad">${scPad()}</div>
      <p class="fine">${csE(t('cs_scHow'))}</p>
      <div id="sc_out" aria-live="polite"></div>
      <details class="adv cs-hist"><summary>🕘 ${csE(t('cs_hist'))}</summary><ul id="sc_hist" class="cs-hl"></ul><button type="button" class="mv" id="sc_hclr">${csE(t('cs_hClr'))}</button></details>
      <details class="adv"><summary>📚 ${csE(t('cs_exs'))}</summary><div class="mx-libl">${['2(3+4)^2 − √(16)/2', '3/4 + 5/6', 'sin(30) + cos(60)', 'x^2 − 5x + 6 = 0', '2x + 3 = 11', '(x+1)/(x−2) = 3', 'x^2 − 4 > 0', 'ncr(10, 3)', 'log(1000) + ln(e^2)'].map(x => `<button type="button" data-scex="${csE(x)}" dir="ltr">${csE(x)}</button>`).join('')}</div></details></div>`;
    scLive(); scHist();
  }
});
/* keys, history and buttons */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if ((b = t0.closest('[data-cb]'))){ cbPress(b.dataset.cb); return; }
  if ((b = t0.closest('[data-cbh]'))){ const d = cbD(), x = d.h[+b.dataset.cbh]; if (x){ d.e = String(x.v); d.done = true; cbShow(); } return; }
  if ((b = t0.closest('[data-cbt]'))){ CB_EDIT = +b.dataset.cbt; cbTape(); return; }
  if (t0.closest('#cb_share')){ const txt = cbText(); try { if (navigator.share){ navigator.share({text: txt}).catch(() => {}); return; } } catch (er) {} copyText(txt); toast(t('cs_copied')); return; }
  if (t0.closest('#cb_img')){ cbImage(); return; }
  if (t0.closest('#cb_hclr')){ cbD().h = []; saveSet(); cbShow(); return; }
  if (t0.closest('#cb_copy')){ const d = cbD(); let v = d.e; try { v = String(+cbValue(d.e).toPrecision(14)); } catch (er) {} copyText(v); toast(t('cs_copied')); return; }
  if ((b = t0.closest('[data-sck]'))){
    const v = b.dataset.sck, d = scD(), i = scInput();
    if (v === '@2nd'){ d.two = !d.two; const p = document.getElementById('sc_pad'); if (p) p.innerHTML = scPad(); return; }
    if (v === '@deg'){ d.deg = !d.deg; saveSet(); const p = document.getElementById('sc_pad'); if (p) p.innerHTML = scPad(); scLive(); return; }
    if (v === '@ac'){ if (i){ i.value = ''; d.e = ''; } const o = document.getElementById('sc_out'); if (o) o.innerHTML = ''; scLive(); return; }
    if (v === '@back'){ if (i){ const a = i.selectionStart == null ? i.value.length : i.selectionStart, bb = i.selectionEnd == null ? a : i.selectionEnd; if (a !== bb){ i.value = i.value.slice(0, a) + i.value.slice(bb); i.setSelectionRange(a, a); } else if (a > 0){ i.value = i.value.slice(0, a - 1) + i.value.slice(a); i.setSelectionRange(a - 1, a - 1); } d.e = i.value; d.done = false; scLive(); } return; }
    if (v === '@go'){ scGo(); return; }
    scInsert(v); if (d.two && b.closest('#sc_pad')){ d.two = false; const p = document.getElementById('sc_pad'); if (p) p.innerHTML = scPad(); }
    return;
  }
  if ((b = t0.closest('[data-scex]'))){ const i = scInput(); if (i){ i.value = b.dataset.scex; scD().e = i.value; scD().done = false; scLive(); scGo(); } return; }
  if ((b = t0.closest('[data-sch]'))){ const i = scInput(), x = scD().h[+b.dataset.sch]; if (i && x){ i.value = x.e; scD().e = x.e; scD().done = false; scLive(); i.focus(); } return; }
  if (t0.closest('#sc_hclr')){ scD().h = []; saveSet(); scHist(); return; }
  if (t0.closest('#sc_toMx')){ const s = (scInput() || {}).value || ''; try { const d = xsD0(); d.solve.q = s; d.solve.mode = 'auto'; MX.tab = 'solve'; mxSave(); } catch (er) {} activate('mathx'); return; }
  if (t0.closest('#sc_ai')){ const s = (scInput() || {}).value || '', o = document.getElementById('sc_aiout'), btn = t0.closest('#sc_ai'); if (!o) return;
    const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[lang] || 'English'; btn.disabled = true;
    o.hidden = false; o.innerHTML = `<p class="fine">⏳ ${csE(t('mx_aiWait'))}</p>`;
    cvAsk(`You are a patient maths teacher. In ${UL}, solve and explain step by step, as for a student, the exercise: ${s}. Use short numbered steps, plain text maths, and end with the final answer.`).then(txt => { o.innerHTML = `<div dir="auto" class="xs-aitxt">${csE(txt || t('cv_aiErr'))}</div>`; }, () => { o.innerHTML = `<p class="mx-err">${csE(t('cv_aiErr'))}</p>`; }).finally(() => { btn.disabled = false; });
    return; }
});
document.addEventListener('input', e => { if (e.target && e.target.id === 'sc_in'){ const d = scD(); d.e = e.target.value; d.done = false; scLive(); } });
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'sc_in' && e.key === 'Enter'){ e.preventDefault(); scGo(); return; }
  if (tab !== 'calcbasic' || e.ctrlKey || e.metaKey || e.altKey) return;
  const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
  if (document.querySelector('.cp-ov:not([hidden])')) return;
  const map = {'+': '+', '-': '−', '*': '×', 'x': '×', '/': '÷', 'Enter': '=', '=': '=', 'Backspace': 'back', 'Escape': 'ac', '%': 'pct', '.': '.', ',': '.'};
  const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key]; if (!k) return; e.preventDefault(); cbPress(k);
});
try { if (Array.isArray(FREE_TABS)) FREE_TABS.push('calcbasic', 'scical'); renderTiles(); } catch (e) {}
try { Object.assign(GS_SYN, {calcbasic: 'מחשבון פשוט רגיל כיס חיבור חילוק calculator basic حاسبة آلة', scical: 'מחשבון מדעי סינוס לוגריתם משוואה פתרון שלבים scientific calculator sin log equation steps حاسبة علمية معادلة'}); } catch (e) {}
Object.assign(T, {
  tab_calcbasic:['מחשבון','الآلة الحاسبة','Calculator'], d_calcbasic:['מחשבון רגיל: חשבון, אחוזים, זיכרון והיסטוריה של החישובים.','آلة حاسبة عادية: حساب ونسب وذاكرة وسجل العمليات.','A regular calculator: arithmetic, percent, memory and a history of calculations.'],
  tab_scical:['מחשבון מדעי','الآلة الحاسبة العلمية','Scientific calculator'], d_scical:['מחשבון מדעי מקצועי: טריגונומטריה, לוגריתמים, חזקות ושורשים, קומבינטוריקה – ומשוואות, אי־שוויונים ושברים עם כל הדרך לפתרון שלב אחרי שלב.','آلة حاسبة علمية احترافية: مثلثات ولوغاريتمات وقوى وجذور وتوافيق – ومعادلات ومتباينات وكسور مع كل خطوات الحل.','A professional scientific calculator: trigonometry, logarithms, powers and roots, combinatorics – plus equations, inequalities and fractions with the full way to the answer, step by step.'],
  fam_calcbasic:['מחשבונים','الآلات الحاسبة','Calculators'],
  cs_copy:['העתקת התוצאה','نسخ النتيجة','Copy the result'], cs_copied:['הועתק','تم النسخ','Copied'], cs_err:['התרגיל לא שלם או לא תקין','العملية غير مكتملة أو غير صحيحة','The expression is incomplete or invalid'],
  cs_hist:['היסטוריה','السجل','History'], cs_noHist:['עוד אין חישובים.','لا عمليات بعد.','No calculations yet.'], cs_hClr:['ניקוי ההיסטוריה','مسح السجل','Clear history'],
  cs_kbd:['אפשר להקליד גם מהמקלדת: ספרות, + − * /, Enter לתוצאה, Backspace למחיקה.','يمكن الكتابة من لوحة المفاتيح أيضًا: أرقام، + − * /، Enter للنتيجة، Backspace للحذف.','You can type on a keyboard too: digits, + − * /, Enter for the result, Backspace to delete.'],
  cs_scPh:['תרגיל או משוואה, למשל 2x+3=11','عملية أو معادلة، مثلًا 2x+3=11','An expression or equation, e.g. 2x+3=11'], cs_scLab:['תרגיל','العملية','Expression'],
  cs_scHow:['↵ מחשב. כשיש x או סימן = – המחשבון פותר את המשוואה ומראה את כל הדרך. 2nd מחליף לפונקציות ההפוכות.','↵ للحساب. عند وجود x أو علامة = تُحل المعادلة وتظهر كل الخطوات. 2nd للدوال العكسية.','↵ calculates. With x or an = sign it solves the equation and shows every step. 2nd switches to inverse functions.'],
  cs_way:['הדרך לפתרון, שלב אחרי שלב','طريقة الحل خطوة بخطوة','The way to the answer, step by step'], cs_noSolve:['לא הצלחתי לפתור את זה כאן. אפשר לנסות במחשבון המתקדם או עם ה־AI.','لم أتمكن من حل هذا هنا. جرّبوا الحاسبة المتقدمة أو الذكاء الاصطناعي.','I couldn\'t solve this here. Try the advanced calculator or the AI.'],
  cs_graph:['גרף','رسم بياني','Graph'], cs_gEq:['הגרף מראה את ההפרש בין שני האגפים – הפתרונות הם המקומות שבהם הוא חוצה את ציר ה־x.','يُظهر الرسم الفرق بين الطرفين – الحلول هي حيث يقطع محور x.','The graph shows left side minus right side – the solutions are where it crosses the x-axis.'], cs_gFn:['הגרף של הביטוי.','رسم العبارة.','The graph of the expression.'], cs_gZeros:['נקודות אפס: {z}','نقاط الصفر: {z}','Zeros: {z}'],
  cs_photo:['צילום תרגיל','تصوير تمرين','Photograph an exercise'], cs_gallery:['מהגלריה','من المعرض','From gallery'], cs_reading:['קורא את התרגיל מהתמונה…','أقرأ التمرين من الصورة…','Reading the exercise from the photo…'], cs_noEx:['לא מצאתי תרגיל בתמונה. נסו צילום ברור יותר, תרגיל אחד בכל פעם.','لم أجد تمرينًا في الصورة. جرّبوا صورة أوضح، تمرينًا واحدًا كل مرة.','No exercise found in the photo. Try a clearer photo, one exercise at a time.'], cs_photoFail:['לא הצלחתי לקרוא את התמונה.','لم أتمكن من قراءة الصورة.','Couldn\'t read the photo.'], cs_noAi:['צילום תרגיל צריך את מנוע ה־AI (בהגדרות).','تصوير التمرين يحتاج محرك الذكاء الاصطناعي (في الإعدادات).','Photographing an exercise needs the AI engine (in Settings).'],
  cs_vatAdd:['+ מע״מ {p}%','+ ض.ق.م {p}%','+ VAT {p}%'], cs_vatSub:['− מע״מ {p}%','− ض.ق.م {p}%','− VAT {p}%'], cs_vatShort:['מע״מ {p}%','ض.ق.م {p}%','VAT {p}%'],
  cs_tape:['סרט החישוב – לחצו על מספר כדי לתקן אותו','شريط الحساب – اضغطوا على رقم لتصحيحه','Calculation tape – tap a number to fix it'], cs_tapeEdit:['תיקון {n}','تصحيح {n}','Fix {n}'],
  cs_share:['שיתוף','مشاركة','Share'], cs_img:['כתמונה','كصورة','As an image'],
  cs_toMx:['פתיחה במחשבון המתקדם','فتح في الحاسبة المتقدمة','Open in the advanced calculator'], cs_ai:['הסבר מפורט ב־AI','شرح مفصّل بالذكاء الاصطناعي','Detailed AI explanation'], cs_exs:['דוגמאות','أمثلة','Examples'],
});
