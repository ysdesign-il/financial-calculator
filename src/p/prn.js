/* ---------- 13.8: direct printing from every screen ----------
   The page is prepared here and handed to the device's own print window, so the printer, copies, pages, colour and
   two-sided printing are chosen there. Nothing is sent anywhere: the print area lives on this page only while printing. */
const prnE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var PRN = {mode: '', size: 1, bw: false, head: true, inputs: true, tables: true, open: true, paper: 'A4', orient: 'portrait'};
const PRN_SKIP = ['settings', 'assist'];
/* which kinds of print this screen offers */
function prnModes(id){
  const m = [];
  if (id === 'cv') return ['cv'];
  if (id === 'docscan' && typeof DSC !== 'undefined' && DSC && DSC.pages && DSC.pages.length) m.push('scan');
  try { if (pdfModel(id).some(b => b.k === 'h2' || b.k === 'hero')) m.push('report'); } catch (e) {}
  m.push('screen');
  return m;
}
function prnBtnMount(){
  const r = $('#resetTab'); if (!r || $('#prnBtn')) return;
  r.insertAdjacentHTML('beforebegin', `<button type="button" class="ghost-btn prn-btn" id="prnBtn" aria-haspopup="dialog" aria-controls="prnx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3"/><path d="M7 14h10v7H7z"/></svg><span></span></button>`);
  prnBtnLabel();
}
function prnBtnLabel(){ const b = $('#prnBtn'); if (!b) return; b.querySelector('span').textContent = t('prn_btn'); b.setAttribute('aria-label', t('prn_btnA')); b.title = t('prn_btnA'); b.hidden = PRN_SKIP.includes(tab); }
function prnOpen(id){
  id = id || tab; if (PRN_SKIP.includes(id)) return;
  const modes = prnModes(id); if (!modes.includes(PRN.mode)) PRN.mode = modes[0];
  PRN.id = id;
  let o = $('#prnx');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="prnx" hidden><div class="cp-box prn-box" role="dialog" aria-modal="true" aria-labelledby="prnx_t"><div class="cp-top"><h3 id="prnx_t"></h3><button type="button" class="cp-x" id="prnx_x">×</button></div><div id="prnx_b"></div></div></div>`); o = $('#prnx'); }
  prnPanel(); o.hidden = false; document.body.classList.add('cp-lock'); setTimeout(() => { const f = $('#prn_go'); if (f) f.focus(); }, 30);
}
function prnPanel(){
  const id = PRN.id, modes = prnModes(id), E = prnE, M0 = PRN.mode;
  const seg = (name, val, opts) => `<div class="seg prn-seg" role="radiogroup" aria-label="${E(t('prn_' + name))}">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${val === v}" class="${val === v ? 'on' : ''}" data-prs="${name}" data-v="${v}">${E(l)}</button>`).join('')}</div>`;
  const chk = (k, l) => `<label class="prn-ck"><input type="checkbox" data-prc="${k}"${PRN[k] ? ' checked' : ''}> ${E(t(l))}</label>`;
  $('#prnx_t').textContent = '🖨️ ' + t('prn_title') + ' · ' + t('tab_' + id); $('#prnx_x').setAttribute('aria-label', t('cp_close'));
  const fixed = M0 === 'cv' || M0 === 'scan';
  $('#prnx_b').innerHTML = `
    ${modes.length > 1 ? `<div class="prn-row"><b>${E(t('prn_mode'))}</b>${seg('mode', M0, modes.map(m => [m, t('prn_m_' + m)]))}<small>${E(t('prn_m_' + M0 + 'H'))}</small></div>` : `<p class="fine">${E(t('prn_m_' + M0 + 'H'))}</p>`}
    ${fixed ? '' : `<div class="prn-row"><b>${E(t('prn_size'))}</b>${seg('size', String(PRN.size), [['1', t('prn_s1')], ['2', t('prn_s2')], ['3', t('prn_s3')]])}</div>`}
    ${M0 === 'scan' ? '' : `<div class="prn-row"><b>${E(t('prn_paper'))}</b>${seg('paper', PRN.paper, [['A4', 'A4'], ['letter', 'Letter']])}${M0 === 'cv' ? '' : seg('orient', PRN.orient, [['portrait', t('prn_port')], ['landscape', t('prn_land')]])}</div>`}
    ${fixed ? '' : `<div class="prn-cks">${chk('bw', 'prn_bw')}${chk('head', 'prn_head')}${M0 === 'report' ? chk('tables', 'prn_tables') : ''}${M0 === 'screen' ? chk('inputs', 'prn_inputs') + chk('open', 'prn_open') : ''}</div>`}
    <div class="btnrow prn-foot"><button type="button" class="btn primary" id="prn_go">🖨️ ${E(t('prn_go'))}</button>${M0 === 'cv' || M0 === 'scan' || modes.includes('report') ? `<button type="button" class="btn" id="prn_pdf">📄 ${E(t('b_pdf'))}</button>` : ''}</div>
    <p class="fine">${E(t('prn_note'))}</p>`;
}
function prnClose(){ const o = $('#prnx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#prnBtn'); if (b && !b.hidden && b.offsetParent) b.focus(); } }
/* the printed header: app name, screen title and the date */
const prnHead = id => `<header class="prn-h"><small>${prnE(t('shr_by'))}</small><h1>${prnE(t('tab_' + id))}</h1><span>${prnE(svdDate(Date.now()))}</span></header>`;
const prnFoot = () => `<footer class="prn-f">${prnE(t('shr_pdfFoot'))}</footer>`;
/* a clean report, drawn from the same content as the PDF – real text, so it stays sharp and screen readers can follow it */
function prnReport(id){
  const B = pdfModel(id), H = [], E = prnE; let skipT = false;
  const kv = (rows, bold) => `<table class="prn-kv${bold ? ' b' : ''}"><tbody>${rows.map(r => `<tr><th scope="row">${E(r[0])}</th><td>${E(r[1])}</td></tr>`).join('')}</tbody></table>`;
  B.forEach(b => {
    if (['brand', 'title', 'date', 'foot'].includes(b.k)) return;
    if (b.k === 'rule'){ return; }
    if (b.k === 'h2') H.push(`<h2>${E(b.s)}</h2>`);
    else if (b.k === 'h3'){ skipT = !PRN.tables; if (!skipT) H.push(`<h3>${E(b.s)}</h3>`); }
    else if (b.k === 'kv') H.push(kv(b.rows, b.bold));
    else if (b.k === 'hero') H.push(`<div class="prn-hero"><span>${E(b.a)}</span><b>${E(b.b)}</b>${b.c ? `<small>${E(b.c)}</small>` : ''}</div>`);
    else if (b.k === 'table'){ if (!skipT) H.push(`<table class="prn-tb"><thead><tr>${(b.head || []).map(h => `<th scope="col">${E(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${E(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`); }
    else if (b.k === 'p') H.push(`<p class="${b.warn ? 'prn-warn' : ''}">${E(b.s)}</p>`);
  });
  return H.join('');
}
/* the screen as it is: a copy of the open panel with every field turned into its value */
function prnScreen(id){
  const src = $(`#panel-${id}`) || document.querySelector('#panels .panel:not([hidden])'); if (!src) return '';
  const cl = src.cloneNode(true), A = [src, ...src.querySelectorAll('*')], C = [cl, ...cl.querySelectorAll('*')], drop = [];
  A.forEach((a, i) => {
    const c = C[i]; if (!c) return;
    if (i && (a.hidden || (a.getClientRects().length === 0 && !a.closest('details:not([open])') && a.tagName !== 'OPTION' && a.tagName !== 'SCRIPT'))){ drop.push(c); return; }
    const tg = a.tagName;
    if (tg === 'CANVAS'){ try { const im = document.createElement('img'); im.src = a.toDataURL('image/png'); im.alt = a.getAttribute('aria-label') || ''; im.className = 'prn-cv'; c.replaceWith(im); } catch (e) { drop.push(c); } return; }
    if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA'){
      const ty = (a.type || '').toLowerCase(); if (['hidden', 'file', 'button', 'submit', 'password'].includes(ty)){ drop.push(c); return; }
      const v = ty === 'checkbox' || ty === 'radio' ? (a.checked ? '☑' : '☐') : tg === 'SELECT' ? ((a.options[a.selectedIndex] || {}).text || '') : a.value;
      const s = document.createElement('span'); s.className = 'prn-v' + (tg === 'TEXTAREA' ? ' ta' : ''); s.textContent = v || (ty === 'checkbox' || ty === 'radio' ? v : '—'); c.replaceWith(s); return;
    }
    if (tg === 'BUTTON' && !a.matches('[aria-pressed="true"],[aria-checked="true"],[aria-selected="true"],.on')) drop.push(c);
  });
  drop.forEach(c => { try { c.remove(); } catch (e) {} });
  cl.querySelectorAll('[id]').forEach(e => { e.dataset.pid = e.id; e.removeAttribute('id'); }); cl.removeAttribute('id');
  cl.querySelectorAll('.svbar,.sv-share,.acts,.scn,.ai-fab,.ax-fab,[data-noprint]').forEach(e => e.remove());
  if (!PRN.inputs) cl.querySelectorAll('.inputs').forEach(e => e.remove());
  if (PRN.open) cl.querySelectorAll('details').forEach(d => d.open = true);
  cl.hidden = false; cl.classList.add('prn-panel');
  const w = document.createElement('div'); w.appendChild(cl); return w.innerHTML;
}
/* scanned pages at their real size: a card prints as a card, an A4 page fills the sheet */
function prnScan(){
  const pt = v => (v * 25.4 / 72).toFixed(2) + 'mm';
  return dsPlan().map(pg => `<div class="prn-sheet">${pg.items.map(it => `<img src="${it.c.toDataURL('image/jpeg', .95)}" alt="" style="left:${pt(it.x)};top:${pt(it.y)};width:${pt(it.w)};height:${pt(it.h)}"${it.frame ? ' class="fr"' : ''}>`).join('')}</div>`).join('');
}
function prnStyle(mode){
  let s = $('#prn_page'); if (!s){ s = document.createElement('style'); s.id = 'prn_page'; document.head.appendChild(s); }
  s.textContent = mode === 'scan' ? '@page{size:A4 portrait;margin:0}' : mode === 'cv' ? '' : `@page{size:${PRN.paper} ${PRN.orient};margin:12mm}`;
}
function prnClean(){ document.body.classList.remove('prn-on'); const a = $('#prn_area'); if (a) a.remove(); const s = $('#prn_page'); if (s) s.textContent = ''; PRN.live = false; }
/* build the print area for this screen (also used when the browser's own Print menu or Ctrl+P is used) */
function prnBuild(id, mode){
  prnClean();
  let body = '';
  if (mode === 'scan') body = prnScan();
  else body = (PRN.head ? prnHead(id) : '') + (mode === 'report' ? prnReport(id) : prnScreen(id)) + (PRN.head ? prnFoot() : '');
  document.body.insertAdjacentHTML('beforeend', `<div id="prn_area" class="prn-${mode} prn-s${PRN.size}${PRN.bw && mode !== 'scan' ? ' prn-bw' : ''}" dir="${document.documentElement.dir || 'rtl'}" lang="${document.documentElement.lang || ''}">${body}</div>`);
  prnStyle(mode); document.body.classList.add('prn-on'); PRN.live = true;
}
var PRN_FIRED = false;
async function prnGo(){
  const id = PRN.id || tab, mode = PRN.mode; prnClose();
  if (mode === 'cv'){ try { await cvExport('print'); } catch (e) {} return; }
  try { if (mode === 'scan') toast(t('ds_making')); prnBuild(id, mode); } catch (e) { prnClean(); toast(t('prn_fail')); return; }
  const imgs = [...document.querySelectorAll('#prn_area img')];
  await Promise.all(imgs.map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  await new Promise(r => setTimeout(r, 80));
  PRN_FIRED = false; PRN.mine = true;
  let ok = true; try { window.print(); } catch (e) { ok = false; }
  /* where the device has no print window (some embedded viewers), say so and offer the PDF instead */
  setTimeout(() => { if (!ok || !PRN_FIRED){ prnClean(); PRN.mine = false; toast(t('prn_blocked')); } }, 700);
}
window.addEventListener('beforeprint', () => {
  PRN_FIRED = true;
  if (PRN.live) return;
  /* the browser's own Print (menu or Ctrl+P): print this screen the same clean way, with the last options */
  try { if (!PRN_SKIP.includes(tab) && tab !== 'cv' && !document.body.classList.contains('cv-printing')){ const m = prnModes(tab).filter(x => x !== 'scan' && x !== 'cv'); PRN.id = tab; prnBuild(tab, m.includes(PRN.mode) ? PRN.mode : m[0]); } } catch (e) { prnClean(); }
});
window.addEventListener('afterprint', () => { setTimeout(() => { prnClean(); PRN.mine = false; }, 300); });
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#prnBtn') || t0.closest('[data-shr="print"]')){ const s = t0.closest('.svbar'); prnOpen(s && s.dataset.svp ? s.dataset.svp : tab); return; }
  if (t0.closest('#prnx_x') || t0.id === 'prnx'){ prnClose(); return; }
  if (!t0.closest('#prnx')) return;
  if ((b = t0.closest('[data-prs]'))){ const k = b.dataset.prs, v = b.dataset.v; PRN[k] = k === 'size' ? +v : v; prnPanel(); const nb = $(`#prnx [data-prs="${k}"][data-v="${v}"]`); if (nb) nb.focus(); return; }
  if (t0.closest('#prn_go')){ prnGo(); return; }
  if (t0.closest('#prn_pdf')){ const id = PRN.id, m = PRN.mode; prnClose(); if (m === 'cv') cvExport('pdf'); else if (m === 'scan') dsOut('pdf'); else pdfMake(id); return; }
});
document.addEventListener('change', e => { const c = e.target && e.target.dataset && e.target.dataset.prc; if (c){ PRN[c] = e.target.checked; } });
document.addEventListener('keydown', e => {
  const o = $('#prnx'); if (!o || o.hidden) return;
  if (e.key === 'Escape'){ prnClose(); return; }
  if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button,input')].filter(x => x.offsetParent && !x.disabled); if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
});
/* the share row under results gets a Print button too, and the old "print" action opens the same window */
{ const sbPrn = svBarHtml; svBarHtml = function(){ return sbPrn.apply(this, arguments).replace(/(<button type="button" data-shr="pdf">)/, `<button type="button" data-shr="print">🖨️ ${prnE(t('prn_btn'))}</button>$1`); }; }
{ const daPrn = doAction; doAction = function(act, id){ if (act === 'print'){ prnOpen(id); return; } return daPrn.apply(this, arguments); }; }
{ const alPrn = applyLang; applyLang = function(){ const r = alPrn.apply(this, arguments); try { prnBtnLabel(); const o = $('#prnx'); if (o && !o.hidden) prnPanel(); } catch (e) {} return r; }; }
{ const acPrn = activate; activate = function(){ const r = acPrn.apply(this, arguments); try { prnBtnLabel(); } catch (e) {} return r; }; }
try { prnBtnMount(); } catch (e) {}
