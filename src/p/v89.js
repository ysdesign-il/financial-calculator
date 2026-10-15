/* ================= 8.7: insurance offers with no limit, and lenders' names in the loan comparison ================= */

/* ---------- 1. insurance: a card per offer, as many as you like ---------- */
function insCoOpts(sel, kind){
  return `<option value="">${asEsc(t('o_insCo_none'))}</option>` + INS_COS.filter(c => insCoOk(c, kind)).map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>${asEsc(t('o_insCo_' + c))}</option>`).join('');
}
function insField(o, i, [k, lab, u]){
  return `<div class="field"><span class="lc-l" aria-hidden="true">${asEsc(t(lab))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-insi="${i}" data-insk="${k}" value="${o[k] == null ? '' : o[k]}" aria-label="${asEsc(t(lab))}">${unitHTML(u)}</div></div>`;
}
var INS_OPEN = {}, INS_EDIT = {};
function insRender(){
  const box = $('#ins_box'); if (!box) return;
  const L = insList(), kind = ($('#ins_kind') || {}).value || 'life';
  const act = document.activeElement, keep = act && box.contains(act) ? [act.dataset.insi, act.dataset.insk] : null;
  box.innerHTML = `<div class="ins-head"><b>${asEsc(t('ins_offers'))}</b><span class="ins-count">${asEsc(t('ins_count', {n: L.length}))}</span></div>` +
    L.map((o, i) => `<div class="lc-card ins-card" data-insi="${i}">
      <div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>
        <select class="lc-name ins-co" data-insi="${i}" data-insk="co" aria-label="${asEsc(t('f_insCox') + ' ' + (i + 1))}">${insCoOpts(o.co, kind)}</select>
        <button type="button" class="lc-del ins-dup" data-insedit="${i}" aria-label="${asEsc(t('ins_edit'))}" title="${asEsc(t('ins_edit'))}">✏️</button>
        <button type="button" class="lc-del ins-dup" data-insdup="${i}" aria-label="${asEsc(t('ins_dup'))}" title="${asEsc(t('ins_dup'))}">⧉</button>
        ${L.length > 1 ? `<button type="button" class="lc-del" data-insdel="${i}" aria-label="${asEsc(t('lc_del', {x: insName(o, i, L)}))}">✕</button>` : ''}</div>
      ${o.co === 'other' || INS_EDIT[i] || (o.n && String(o.n).trim()) ? `<input class="lc-name ins-nm" type="text" maxlength="30" dir="auto" data-insi="${i}" data-insk="n" value="${asEsc(o.n || '')}" placeholder="${asEsc(t('ins_namePh'))}" aria-label="${asEsc(t('lc_name') + ' ' + (i + 1))}">` : ''}
      <div class="fields">${INS_FK.slice(0, 4).map(f => insField(o, i, f)).join('')}</div>
      <details class="ins-more"${INS_OPEN[i] ? ' open' : ''} data-insmore="${i}"><summary>${asEsc(t('ins_more'))}</summary><div class="fields">${INS_FK.slice(4).map(f => insField(o, i, f)).join('')}</div></details>
    </div>`).join('') +
    `<button type="button" class="lc-add" id="ins_add"><span aria-hidden="true">＋</span> ${asEsc(t('lc_add'))}</button>` +
    `<p class="fine lc-hint">${asEsc(t('h_insCo'))}</p>`;
  if (keep){ const el = box.querySelector(`[data-insi="${keep[0]}"][data-insk="${keep[1]}"]`); if (el) el.focus(); }
}
var INS_T = null;
const insRecalc = () => { clearTimeout(INS_T); INS_T = setTimeout(() => { try { saveSet(); } catch (e) {} if (tab === 'insurance') calc(tab); }, 250); };
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.insk == null || !el.closest('#ins_box')) return;
  const o = insList()[+el.dataset.insi]; if (!o) return;
  const k = el.dataset.insk;
  if (k === 'n') o.n = el.value.slice(0, 30);
  else if (k !== 'co') o[k] = el.value === '' ? 0 : +el.value;
  insRecalc();
}, true);
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || el.dataset.insk !== 'co' || !el.closest('#ins_box')) return;
  const o = insList()[+el.dataset.insi]; if (!o) return;
  o.co = el.value; if (o.co !== 'other') o.n = '';
  try { saveSet(); } catch (er) {} insRender(); calc(tab);
  if (o.co === 'other'){ const n = $(`#ins_box .ins-nm[data-insi="${el.dataset.insi}"]`); if (n) n.focus(); }
}, true);
document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.insmore != null) INS_OPEN[d.dataset.insmore] = d.open; }, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const L = insList();
  if (e.target.closest('#ins_add')){
    const last = L[L.length - 1] || insSeed()[0]; L.push(Object.assign({}, last, {co: '', n: ''}));
    saveSet(); insRender(); calc(tab);
    const c = $$('#ins_box .ins-co'), s = c[c.length - 1]; if (s){ s.focus(); s.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}); }
    return;
  }
  const ed = e.target.closest('[data-insedit]');
  if (ed){ const i = +ed.dataset.insedit; INS_EDIT[i] = true; const o = L[i]; if (o && !String(o.n || '').trim() && o.co && o.co !== 'other') o.n = t('o_insCo_' + o.co); insRender(); const n = $(`#ins_box .ins-nm[data-insi="${i}"]`); if (n){ n.focus(); n.select(); } return; }
  const dup = e.target.closest('[data-insdup]');
  if (dup){ const i = +dup.dataset.insdup; if (!L[i]) return; L.splice(i + 1, 0, Object.assign({}, L[i])); saveSet(); insRender(); calc(tab); const s = $(`#ins_box .ins-co[data-insi="${i + 1}"]`); if (s) s.focus(); return; }
  const d = e.target.closest('[data-insdel]');
  if (d){ if (L.length <= 1) return; L.splice(+d.dataset.insdel, 1); INS_OPEN = {}; INS_EDIT = {}; saveSet(); insRender(); calc(tab); const a = $('#ins_add'); if (a) a.focus(); }
});
/* what was typed in the first version (offers A–D) becomes the first cards */
(function insMigrate(){
  if (Array.isArray(SET.insOffers) && SET.insOffers.length) return;
  try {
    const o = JSON.parse(LS.getItem('fin-vals') || 'null'); if (!o || o.ins_pa == null) return;
    const n = Math.min(4, Math.max(2, +o.ins_n || 2)), keys = ['p', 'g', 'd', 'c', 'x', 'xy', 'e'];
    SET.insOffers = ['a', 'b', 'c', 'd'].slice(0, n).map(k => { const r = {co: o['ins_co' + k] || ''}; keys.forEach(f => { r[f] = +o['ins_' + f + k] || 0; }); return r; });
    saveSet();
  } catch (e) {}
})();

/* ---------- 2. loans: pick the bank, card company or lender for each offer ---------- */
const LEND = [
  ['bank', ['leumi', 'hapoalim', 'discount', 'mizrahi', 'fibi', 'mercantile', 'jerusalem', 'massad', 'yahav', 'otsar', 'onezero', 'pepper']],
  ['card', ['isracard', 'cal', 'max']],
  ['non', ['mimun', 'blender', 'tarya', 'policy', 'gemel', 'carfin', 'nonother']]
];
function lendOpts(sel){
  return `<option value="">${asEsc(t('lend_pick'))}</option>` + LEND.map(([g, L]) => `<optgroup label="${asEsc(t('lend_g_' + g))}">${L.map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>${asEsc(t('lend_' + c))}</option>`).join('')}</optgroup>`).join('');
}
function lendDecorate(){
  const box = $('#lc_box'); if (!box) return;
  const L = lcList();
  $$('.lc-card', box).forEach(card => {
    const i = +card.dataset.lci, o = L[i]; if (!o || card.querySelector('.lc-lend')) return;
    const top = card.querySelector('.lc-top'); if (!top) return;
    top.insertAdjacentHTML('afterend', `<label class="lc-lendrow"><span class="lc-lendic" aria-hidden="true">🏦</span><select class="lc-lend" data-lclend="${i}" aria-label="${asEsc(t('lend_label') + ' ' + (i + 1))}">${lendOpts(o.lend || '')}</select></label>`);
  });
}
const _lcRender89 = lcRender;
lcRender = function(){ const r = _lcRender89.apply(this, arguments); try { lendDecorate(); } catch (e) {} return r; };
document.addEventListener('change', e => {
  const s = e.target; if (!s.dataset || s.dataset.lclend == null) return;
  const o = lcList()[+s.dataset.lclend]; if (!o) return;
  const prevAuto = o.lend ? t('lend_' + o.lend) : '';
  o.lend = s.value;
  /* the name follows the pick, unless you wrote your own */
  if (!String(o.n || '').trim() || o.n === prevAuto || o.nAuto) { o.n = s.value ? t('lend_' + s.value) : ''; o.nAuto = !!s.value; }
  saveSet(); lcRender(); calc(tab);
  const ns = $(`#lc_box [data-lclend="${s.dataset.lclend}"]`); if (ns) ns.focus();
}, true);
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.lck === 'n' && el.closest('#lc_box')){ const o = lcList()[+el.dataset.lci]; if (o) o.nAuto = false; } }, true);

/* ---------- start ---------- */
const _al89 = applyLang;
applyLang = function(){ const r = _al89.apply(this, arguments); try { insRender(); } catch (e) {} return r; };
try { insRender(); lcRender(); if (tab === 'insurance' || tab === 'loancmp') calc(tab); } catch (e) {}

/* ---------- 3. sharing: choose text or a picture ---------- */
/* the picture is drawn here from the same layout as the PDF (no outside service), as one tall image */
const SHR_IMG_ROWS = 40;
async function shrImgBlob(id){
  try { await document.fonts.ready; } catch (e) {}
  /* a phone-sized page: wide tables become a short card per line */
  const B = pdfModel(id).map(b => {
    if (b.k !== 'table' || !b.rows) return b;
    const cols = Math.max((b.head || []).length, ...b.rows.map(r => r.length));
    if (cols <= 4){
      if (b.rows.length <= SHR_IMG_ROWS) return b;
      return [Object.assign({}, b, {rows: b.rows.slice(0, SHR_IMG_ROWS)}), {k: 'p', s: t('shr_imgMore', {n: b.rows.length - SHR_IMG_ROWS})}];
    }
    const cap = 12, out = [];
    b.rows.slice(0, cap).forEach(r => { out.push({k: 'h3', s: String(r[0] || '')}); out.push({k: 'kv', rows: (b.head || []).slice(1).map((h, i) => [h, r[i + 1]]).filter(x => x[0] && x[1] != null && String(x[1]).trim() !== '')}); });
    if (b.rows.length > cap) out.push({k: 'p', s: t('shr_imgMore', {n: b.rows.length - cap})});
    return out;
  }).flat();
  const SC = 2, pages = pdfPages(B, {W: 640, H: 1400, M: 36, S: SC}), W = pages[0].width, PH = pages[0].height, MG = 36 * SC;
  /* where the ink ends on the last page */
  const lp = pages[pages.length - 1], d = lp.getContext('2d').getImageData(0, 0, W, PH).data;
  let end = MG * 2;
  for (let y = PH - 1; y > 0; y--){ let ink = false; for (let x = 0; x < W; x += 4){ const i = (y * W + x) * 4; if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240){ ink = true; break; } } if (ink){ end = Math.min(PH, y + MG * 0.6); break; } }
  const cuts = pages.map((p, i) => [i ? MG : 0, i < pages.length - 1 ? PH - MG : end]);
  const total = cuts.reduce((s, c) => s + c[1] - c[0], 0) + 14;
  const k = Math.min(1, 16000 / total), out = document.createElement('canvas');
  out.width = Math.round(W * k); out.height = Math.round(total * k);
  const cx = out.getContext('2d'); cx.scale(k, k);
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, total);
  const g = cx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#b8902a'); g.addColorStop(.5, '#f1d27a'); g.addColorStop(1, '#b8902a');
  cx.fillStyle = g; cx.fillRect(0, 0, W, 14);
  let y = 14; pages.forEach((p, i) => { const [a, b] = cuts[i]; cx.drawImage(p, 0, a, W, b - a, 0, y, W, b - a); y += b - a; });
  return await new Promise((res, rej) => out.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/png'));
}
var SHR_IMG = {blob: null, url: '', id: null};
function shrImgName(){ return ((SHR.title || t('tab_' + SHR.id)) + ' ' + new Date().toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.png'; }
function shrModeSet(m){
  const box = $('#shx_b'); if (!box) return;
  SET.shrMode = m; try { saveSet(); } catch (e) {}
  $$('[data-shm]', box).forEach(b => { const on = b.dataset.shm === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  const pre = $('.shr-pre', box), grid = $('.shr-grid', box), im = $('#shr_imgbox', box);
  if (pre) pre.hidden = m === 'img'; if (grid) grid.hidden = m === 'img'; if (im) im.hidden = m !== 'img';
  if (m === 'img') shrImgShow();
}
async function shrImgShow(){
  const im = $('#shr_imgbox'); if (!im) return;
  if (SHR_IMG.blob && SHR_IMG.id === SHR.id && SHR_IMG.at === SHR.at) return;
  im.innerHTML = `<p class="shr-imgwait">${asEsc(t('shr_imgMaking'))}</p>`;
  try {
    const blob = await shrImgBlob(SHR.id);
    if (SHR_IMG.url) try { URL.revokeObjectURL(SHR_IMG.url); } catch (e) {}
    SHR_IMG = {blob, url: URL.createObjectURL(blob), id: SHR.id, at: SHR.at};
    const file = new File([blob], shrImgName(), {type: 'image/png'});
    const canFile = !!(navigator.canShare && (() => { try { return navigator.canShare({files: [file]}); } catch (e) { return false; } })());
    const canCopy = !!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write);
    im.innerHTML = `<div class="shr-imgwrap"><img src="${SHR_IMG.url}" alt="${asEsc(t('shr_mImg') + ': ' + (SHR.title || ''))}"></div>
      <div class="shr-grid">
        ${canFile ? `<button type="button" class="shr-b" data-shi="share">📤<span>${asEsc(t('shr_imgShare'))}</span></button>` : ''}
        <button type="button" class="shr-b" data-shi="save">💾<span>${asEsc(t('shr_imgSave'))}</span></button>
        ${canCopy ? `<button type="button" class="shr-b" data-shi="copy">📋<span>${asEsc(t('shr_imgCopy'))}</span></button>` : ''}
      </div><p class="fine">${asEsc(t(canFile ? 'shr_imgHint' : 'shr_imgHint2'))}</p>`;
  } catch (e) { im.innerHTML = `<p class="fine">${asEsc(t('shr_imgFail'))}</p>`; }
}
const _shrOpen89 = shrOpen;
shrOpen = function(id, text, title){
  const r = _shrOpen89.apply(this, arguments);
  SHR.at = Date.now();
  const box = $('#shx_b');
  if (box && id && !text){                       // a picture of the result (not for custom text like a saved scenario)
    box.insertAdjacentHTML('afterbegin', `<div class="shr-mode" role="tablist" aria-label="${asEsc(t('shr_mLabel'))}"><button type="button" role="tab" data-shm="text">📝 ${asEsc(t('shr_mText'))}</button><button type="button" role="tab" data-shm="img">🖼️ ${asEsc(t('shr_mImg'))}</button></div>`);
    const pre = $('.shr-pre', box); if (pre) pre.insertAdjacentHTML('afterend', '<div id="shr_imgbox" hidden></div>');
    shrModeSet(SET.shrMode === 'img' ? 'img' : 'text');
  }
  return r;
};
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  const m = e.target.closest('[data-shm]'); if (m){ shrModeSet(m.dataset.shm); return; }
  const b = e.target.closest('[data-shi]'); if (!b || !SHR_IMG.blob) return;
  const k = b.dataset.shi, name = shrImgName();
  if (k === 'share'){
    try { await navigator.share({files: [new File([SHR_IMG.blob], name, {type: 'image/png'})], title: SHR.title}); }
    catch (er) { if (!er || er.name !== 'AbortError'){ const r = await fileSave(SHR_IMG.blob, name, 'image/png'); toast(t(r === 'saved' ? 'shr_imgSaved' : 'shr_imgFail')); } }
  } else if (k === 'save'){
    const r = await fileSave(SHR_IMG.blob, name, 'image/png'); toast(t(r === 'saved' ? 'shr_imgSaved' : r === 'declined' ? 'pdf_declined' : 'shr_imgFail'));
  } else if (k === 'copy'){
    try { await navigator.clipboard.write([new ClipboardItem({'image/png': SHR_IMG.blob})]); toast(t('shr_imgCopied')); } catch (er) { toast(t('shr_imgFail')); }
  }
});
