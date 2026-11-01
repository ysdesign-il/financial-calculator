/* ---------- reading text on the phone, without AI (on-device OCR) ----------
   Most people have no AI connection, so the scanner can read printed text itself: Hebrew, Arabic and English.
   The engine is Tesseract (tesseract.js-core 7.0.0, Apache-2.0) with the tessdata_fast language data (Apache-2.0), kept in lib/ocr7/.
   It is downloaded only when first needed (about 2–4 MB), then kept on the phone (sw.js keeps lib/ocr7/ after the first download).
   The picture never leaves the phone: it is read in a worker on this device.
   For other screens: ocrText(canvasOrBlob, langs?, opts?) -> Promise<{text, words: [{text, bbox: {x0, y0, x1, y1}, conf}], lines, conf, w, h}>
     langs: 'auto' | 'he' | 'ar' | 'en' | ['heb', 'eng', ...]  (default: the scanner's setting)
     opts:  {ui: false} hides the progress card · {onProgress(p, phase)} · {timeout: ms}
   Also: ocrSupported(), ocrReady(langs), ocrCancel(), ocrUse() (true when the scanner should read on the phone rather than with AI). */
const OCR_DIR = 'lib/ocr7/', OCR_CDN = 'https://cdn.jsdelivr.net/npm/';
const OCR_MB = {core: 1.06, heb: 0.48, ara: 0.72, eng: 1.98};          // download sizes (compressed)
const OCR_K = 'fin-ocr', OCR_GOT = 'fin-ocr-got';                         // settings {lang, phone} · the parts already downloaded
var OCRS = {w: null, core: false, langs: '', q: Promise.resolve(), id: 0, pend: null, idle: 0, run: null, pg: null, cache: new WeakMap()};
const ocrE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function ocrSet(){ try { const o = JSON.parse(localStorage.getItem(OCR_K) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function ocrSave(p){ try { localStorage.setItem(OCR_K, JSON.stringify(Object.assign(ocrSet(), p))); } catch (e) {} }
function ocrGot(){ try { const a = JSON.parse(localStorage.getItem(OCR_GOT) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function ocrGotAdd(k){ try { const a = ocrGot(); if (!a.includes(k)){ a.push(k); localStorage.setItem(OCR_GOT, JSON.stringify(a)); } } catch (e) {} }
const ocrInClaude = () => typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE;
function ocrSupported(){ try { return typeof WebAssembly === 'object' && typeof Worker === 'function' && typeof DecompressionStream === 'function' && typeof TextDecoder === 'function'; } catch (e) { return false; } }
/* true when the scanner should read the text on the phone: no AI here, or the person chose it */
function ocrUse(){ return !(typeof slEngine === 'function' && slEngine()) || !!ocrSet().phone; }
/* the document's language → the language files to use */
function ocrCodes(l){
  if (Array.isArray(l)){ const m = {he: 'heb', ar: 'ara', en: 'eng'}; const a = [...new Set(l.map(x => m[x] || x).filter(x => OCR_MB[x] && x !== 'core'))]; return a.length ? a : ['heb', 'eng']; }
  l = l || ocrSet().lang || 'auto';
  if (l === 'he') return ['heb', 'eng'];
  if (l === 'ar') return ['ara', 'eng'];
  if (l === 'en') return ['eng'];
  return lang === 'ar' ? ['ara', 'heb', 'eng'] : ['heb', 'eng'];
}
const ocrNeed = codes => ['core'].concat(codes).filter(k => !ocrGot().includes(k));
const ocrNeedMB = codes => ocrNeed(codes).reduce((s, k) => s + (OCR_MB[k] || 0), 0);
function ocrReady(l){ return ocrNeed(ocrCodes(l)).length === 0; }
const ocrMB = v => (Math.max(0.1, Math.round(v * 10) / 10)).toLocaleString(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar-EG' : 'en-US', {maximumFractionDigits: 1});
/* WebAssembly SIMD (faster engine) – the same tiny test the engine's own loader uses */
const ocrSimd = () => { try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) { return false; } };
const ocrBase = () => ocrInClaude() && typeof SITE_BASE === 'string' ? SITE_BASE + OCR_DIR : new URL(OCR_DIR, location.href).href;
const ocrLowMem = () => { try { const m = +navigator.deviceMemory || 0; return m > 0 && m <= 2; } catch (e) { return false; } };

/* ---- download one part (with progress), unpack it ---- */
async function ocrFetch(urls, mb, onBytes){
  let last;
  for (const u of urls){
    try {
      const r = await fetch(u, {credentials: 'omit'}); if (!r.ok) throw new Error('http ' + r.status);
      let buf;
      if (r.body && r.body.getReader){
        const rd = r.body.getReader(), parts = []; let got = 0;
        for (;;){ if (OCRS.run && OCRS.run.stop) { try { rd.cancel(); } catch (e) {} throw new Error('cancel'); }
          const {done, value} = await rd.read(); if (done) break; parts.push(value); got += value.length; onBytes(Math.min(got, mb * 1048576)); }
        buf = await new Blob(parts).arrayBuffer();
      } else buf = await r.arrayBuffer();
      const b = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
      if (b[0] === 0x1f && b[1] === 0x8b) buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      return buf;
    } catch (e){ last = e; if (e && e.message === 'cancel') throw e; }
  }
  throw last || new Error('fetch');
}
/* ---- the worker ---- */
function ocrKill(){
  try { if (OCRS.w) OCRS.w.terminate(); } catch (e) {}
  OCRS.w = null; OCRS.core = false; OCRS.langs = '';
  if (OCRS.pend){ const p = OCRS.pend; OCRS.pend = null; p.no(new Error('stopped')); }
}
function ocrIdle(){ clearTimeout(OCRS.idle); OCRS.idle = setTimeout(() => { if (!OCRS.pend) ocrKill(); }, 90000); }   // free the memory when not used for a while
function ocrCall(msg, tr, ms){
  return new Promise((ok, no) => {
    const id = ++OCRS.id; msg.id = id;
    const tm = ms ? setTimeout(() => { if (OCRS.pend && OCRS.pend.id === id){ OCRS.pend = null; ocrKill(); no(new Error('timeout')); } }, ms) : 0;
    OCRS.pend = {id, ok: v => { clearTimeout(tm); ok(v); }, no: e => { clearTimeout(tm); no(e); }};
    try { OCRS.w.postMessage(msg, tr || []); } catch (e){ OCRS.pend = null; clearTimeout(tm); no(e); }
  });
}
function ocrWorker(){
  if (OCRS.w) return OCRS.w;
  const base = ocrBase();
  let w;
  try { w = ocrInClaude() ? new Worker(URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(base + 'ocr-worker.js')});`], {type: 'text/javascript'}))) : new Worker(base + 'ocr-worker.js'); }
  catch (e){ throw new Error('worker'); }
  w.onmessage = e => { const d = e.data || {}, P = OCRS.pend;
    if (d.progress != null){ if (OCRS.run && OCRS.run.onRec) OCRS.run.onRec(d.progress); return; }
    if (!P || d.id !== P.id) return; OCRS.pend = null; d.ok ? P.ok(d) : P.no(new Error(d.err || 'ocr')); };
  w.onerror = ev => { try { ev.preventDefault(); } catch (er) {} const P = OCRS.pend; OCRS.pend = null; ocrKill(); if (P) P.no(new Error('worker')); };
  OCRS.w = w; return w;
}
/* make sure the engine and the language files are ready (downloads what is missing) */
async function ocrEngine(codes, prog){
  const key = codes.join('+'); clearTimeout(OCRS.idle);
  if (OCRS.w && OCRS.core && OCRS.langs === key) return;
  const base = ocrBase(), simd = ocrSimd(), coreName = simd ? 'tesseract-core-simd-lstm' : 'tesseract-core-lstm';
  const need = (OCRS.core ? [] : ['core']).concat(codes), mbAll = need.reduce((s, k) => s + OCR_MB[k], 0), got = {};
  const fresh = ocrNeed(codes).length > 0, done = {};
  const tick = () => prog && prog(Object.values(done).reduce((s, v) => s + v, 0) / (mbAll * 1048576), fresh);
  const data = {}; let wasm = null;
  await Promise.all(need.map(async k => {
    const urls = k === 'core' ? [base + coreName + '.wasm.gz', OCR_CDN + 'tesseract.js-core@7.0.0/' + coreName + '.wasm']
      : [base + k + '.traineddata.gz', OCR_CDN + '@tesseract.js-data/' + k + '/4.0.0_best_int/' + k + '.traineddata.gz'];
    const buf = await ocrFetch(urls, OCR_MB[k], n => { done[k] = n; tick(); }); done[k] = OCR_MB[k] * 1048576; tick();
    if (k === 'core') wasm = buf; else data[k] = buf; got[k] = 1;
  }));
  ocrWorker();
  const msg = {cmd: 'init', langs: key, data, core: base + coreName + '.js'}, tr = Object.values(data);
  if (wasm){ msg.wasm = wasm; tr.push(wasm); }
  await ocrCall(msg, tr, 120000);
  OCRS.core = true; OCRS.langs = key; Object.keys(got).forEach(ocrGotAdd);
}
/* any picture → a clean PNG for the engine (not too big for old phones, not too small to read) */
async function ocrPrep(src){
  let img = src;
  if (src instanceof Blob){ img = await (typeof createImageBitmap === 'function' ? createImageBitmap(src).catch(() => null) : null);
    if (!img){ img = await new Promise((ok, no) => { const u = URL.createObjectURL(src), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => { URL.revokeObjectURL(u); no(new Error('image')); }; im.src = u; }); } }
  const W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height; if (!(W0 > 0 && H0 > 0)) throw new Error('image');
  const max = ocrLowMem() ? 1800 : 2600, m = Math.max(W0, H0), k = m > max ? max / m : m < 1100 ? Math.min(2, 1400 / m) : 1;
  const W = Math.round(W0 * k), H = Math.round(H0 * k), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, W, H);
  try { if (img.close) img.close(); } catch (e) {}
  const b = await new Promise(r => c.toBlob(r, 'image/png')); if (!b) throw new Error('image');
  c.width = c.height = 1;
  return {buf: await b.arrayBuffer(), k, w: W0, h: H0};
}
/* ---- the progress card (one for every screen that reads text) ---- */
function ocrCard(st){
  let el = $('#ocr_run');
  if (!st){ if (el) el.remove(); return; }
  if (!el){ document.body.insertAdjacentHTML('beforeend', `<div class="ocr-run" id="ocr_run" role="status" aria-live="polite"><p class="ocr-t"></p><progress max="100" value="0"></progress><p class="fine ocr-s"></p><button type="button" class="mv" id="ocr_stop">✕ ${ocrE(t('ocr_stop'))}</button></div>`); el = $('#ocr_run'); }
  el.querySelector('.ocr-t').textContent = st.t; el.querySelector('.ocr-s').textContent = st.s || '';
  const pr = el.querySelector('progress'); pr.value = Math.round((st.p || 0) * 100); pr.setAttribute('aria-label', st.t);
}
/* stop whatever is being read now */
function ocrCancel(){ if (OCRS.run) OCRS.run.stop = true; ocrKill(); ocrCard(null); }
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#ocr_stop')){ ocrCancel(); toast(t('ocr_stopped')); } });

/* the main function: read the text of one picture (canvas, image, ImageBitmap or Blob) */
function ocrText(src, langs, opts){
  opts = opts || {};
  const job = OCRS.q.then(() => ocrRun(src, langs, opts));
  OCRS.q = job.catch(() => {});
  return job;
}
async function ocrRun(src, langs, opts){
  if (!ocrSupported()) throw new Error('old');
  const codes = ocrCodes(langs), ui = opts.ui !== false, run = OCRS.run = {stop: false};
  const say = (p, phase, extra) => { if (opts.onProgress) try { opts.onProgress(p, phase); } catch (e) {}
    if (ui && !run.stop) ocrCard(phase === 'dl' ? {t: t(extra ? 'ocr_dlFirst' : 'ocr_dlPrep', {m: ocrMB(ocrNeedMB(codes) || OCR_MB.core)}), s: t('ocr_dlNote'), p}
      : {t: opts.label || t('ocr_reading'), s: t('ocr_privRun'), p}); };
  try {
    say(0, 'dl', ocrNeed(codes).length > 0);
    await ocrEngine(codes, (p, fresh) => say(p, 'dl', fresh));
    if (run.stop) throw new Error('cancel');
    say(0, 'rec'); run.onRec = p => say(p, 'rec');
    const P = await ocrPrep(src); if (run.stop) throw new Error('cancel');
    const ms = opts.timeout || (ocrLowMem() ? 180000 : 120000);
    const r = await ocrCall({cmd: 'rec', img: P.buf}, [P.buf], ms);
    const sc = b => ({x0: Math.round(b.x0 / P.k), y0: Math.round(b.y0 / P.k), x1: Math.round(b.x1 / P.k), y1: Math.round(b.y1 / P.k)});
    const text = String(r.text || '').replace(/\n{3,}/g, '\n\n').trim();
    return {text, conf: r.conf || 0, w: P.w, h: P.h, words: (r.words || []).map(w => ({text: w.text, bbox: sc(w.bbox), conf: w.conf})), lines: (r.lines || []).map(l => ({text: l.text, bbox: sc(l.bbox), conf: l.conf}))};
  } catch (e){
    if (run.stop) throw new Error('cancel');
    throw e;
  } finally {
    if (OCRS.run === run){ OCRS.run = null; if (ui && !opts.keepCard) ocrCard(null); }
    if (OCRS.w) ocrIdle();
  }
}
const ocrErrKey = e => { const m = e && e.message; return m === 'cancel' || m === 'stopped' ? '' : m === 'old' ? 'ocr_old' : m === 'timeout' ? 'ocr_slow' : /fetch|http|Failed|network|Load/i.test(String(m)) ? 'ocr_net' : 'ocr_fail'; };

/* ================= the scanner ================= */
/* a page as the reader sees it: what will be saved (hidden parts stay hidden), without the watermark */
function ocrPageCanvas(p){ const wm = DSC.wm; DSC.wm = ''; try { return dsCompose(p, ocrLowMem() ? 1800 : 2600); } finally { DSC.wm = wm; } }
async function ocrPage(p, n, m){
  const sig = [DSC.filt, (p.red || []).length, p.base.width, p.base.height, ocrCodes().join('+')].join('|'), hit = OCRS.cache.get(p.base);
  if (hit && hit.sig === sig) return hit.r;
  const c = ocrPageCanvas(p), r = await ocrText(c, undefined, {label: m > 1 ? t('ocr_readingN', {n, m}) : t('ocr_reading'), keepCard: n < m});
  OCRS.cache.set(p.base, {sig, r}); return r;
}
/* all the pages → DSC.ocr (the text) and DSC.ocrLines (where each line is, for the searchable PDF) */
async function ocrScan(btn){
  if (!DSC || !DSC.pages.length || OCRS.busy) return false;
  if (!ocrSupported()){ toast(t('ocr_old')); return false; }
  OCRS.busy = true; if (btn) btn.disabled = true;
  try {
    const pages = DSC.pages.slice(0, 30), out = [], lines = [];
    for (let i = 0; i < pages.length; i++){
      const r = await ocrPage(pages[i], i + 1, pages.length), W = r.w || 1, H = r.h || 1;
      out.push(r.text); lines.push(r.lines.map(l => ({t: l.text, b: [l.bbox.x0 / W * 1000, l.bbox.y0 / H * 1000, l.bbox.x1 / W * 1000, l.bbox.y1 / H * 1000].map(v => Math.round(Math.max(0, Math.min(1000, v))))})));
    }
    DSC.ocrLines = lines.some(x => x.length) ? lines : null;
    DSC.ocr = out.join('\n\n').slice(0, 50000); DSC.ocrBy = 'phone';
    if (!DSC.ocr.trim()) toast(t('ocr_none'));
    dscRender(); const ta = $('#ds_ocr'); if (ta) ta.focus();
    return !!DSC.ocr.trim();
  } catch (e){ ocrCard(null); const k = ocrErrKey(e); if (k) toast(t(k)); return false; }
  finally { OCRS.busy = false; if (btn && btn.isConnected) btn.disabled = false; }
}
/* the "read the text" part of the scanned-pages screen */
function ocrBlockHTML(eng){
  const S = ocrSet(), l = S.lang || 'auto', codes = ocrCodes(), mb = ocrNeedMB(codes), ok = ocrSupported();
  return `<div class="ocr-box" id="ocr_box">
    ${eng ? `<label class="prn-ck"><input type="checkbox" id="ocr_phone"${S.phone ? ' checked' : ''}> 📱 ${ocrE(t('ocr_phoneCk'))}</label>` : ''}
    ${!eng || S.phone ? `<p class="fine">📱 ${ocrE(t('ocr_h'))}</p>
    <div class="field cv-f"><label for="ocr_lang">${ocrE(t('ocr_lang'))}</label><select id="ocr_lang">${['auto', 'he', 'ar', 'en'].map(v => `<option value="${v}"${v === l ? ' selected' : ''}>${ocrE(t('ocr_l_' + v))}</option>`).join('')}</select></div>
    ${ok ? `<div class="btnrow"><button type="button" class="btn" id="ocr_go">🔤 ${ocrE(t('ocr_go'))}</button>${DSC.ocr == null && typeof dsSearchablePdf === 'function' ? `<button type="button" class="gold-btn" id="ocr_spdf">🔎 ${ocrE(t('ds_searchPdf'))}</button>` : ''}</div>
    ${mb > 0 ? `<p class="fine" id="ocr_dlh">⬇️ ${ocrE(t('ocr_dlOnce', {m: ocrMB(mb)}))}</p>` : ''}` : `<div class="gk-st new">${ocrE(t('ocr_old'))}</div>`}
    <p class="fine ocr-acc">ℹ️ ${ocrE(t('ocr_acc'))}</p>` : ''}
  </div>`;
}
function ocrResultHTML(){
  return `<div class="field"><label for="ds_ocr">${ocrE(t('ds_ocrRes'))}</label><textarea id="ds_ocr" rows="8" dir="auto">${ocrE(DSC.ocr)}</textarea></div><div class="btnrow"><button type="button" class="mv" id="ds_ocrcopy">📋 ${ocrE(t('b_copy'))}</button><button type="button" class="mv" id="ds_ocrtxt">⬇️ TXT</button><button type="button" class="mv" id="ds_ocrdocx">⬇️ Word</button>${typeof dsSearchablePdf === 'function' ? `<button type="button" class="gold-btn" id="ds_spdf">🔎 ${ocrE(t('ds_searchPdf'))}</button>` : ''}</div>`;
}
{
  const cardO = dsCardRender;
  dsCardRender = function(root){
    const r = cardO.apply(this, arguments); if (!DSC || DSC.cur || root.querySelector('#ocr_box')) return r;
    try {
      const eng = typeof slEngine === 'function' && slEngine(), S = ocrSet(), phone = !eng || S.phone;
      const h4 = [...root.querySelectorAll('h4.ds-q')].find(h => h.textContent.indexOf(t('ds_ocrT')) !== -1);
      if (h4){
        if (!eng){
          /* no AI: the "needs AI" note becomes the on-phone reader */
          const p = h4.nextElementSibling; if (p && p.matches('p.fine')) p.remove();
          h4.insertAdjacentHTML('afterend', ocrBlockHTML(false) + (DSC.ocr != null ? ocrResultHTML() : ''));
          /* what the other parts add next to the text when it exists (file name, found details) */
          const oc = $('#ds_ocrcopy'), row = oc && oc.closest('.btnrow');
          if (row && typeof d5NameIdea === 'function'){ const idea = d5NameIdea(); if (idea && String(DSC.name || '').trim() !== idea && !root.querySelector('#d5_name')) row.insertAdjacentHTML('afterend', `<div class="btnrow"><button type="button" class="mv" id="d5_name">✍️ ${ocrE(t('d5_name', {s: idea}))}</button></div>`); }
          if (row && typeof d5FoundHTML === 'function' && !root.querySelector('.d5-found')){ const h = d5FoundHTML(); if (h) (root.querySelector('#d5_name') ? root.querySelector('#d5_name').closest('.btnrow') : row).insertAdjacentHTML('afterend', h); }
        } else {
          /* AI is here: a choice to read on the phone instead */
          const go = root.querySelector('#ds_ocrgo'), gr = go && go.closest('.btnrow'), hp = h4.nextElementSibling;
          if (phone){ if (hp && hp.matches('p.fine')) hp.hidden = true; if (gr) gr.hidden = true; }
          (gr || h4).insertAdjacentHTML('afterend', ocrBlockHTML(true));
        }
      }
      /* "text of this page" on every page */
      if (ocrSupported()) $$('#ds_root .ds-pg').forEach((fig, i) => { const tl = fig.querySelector('.d4-tools') || fig.querySelector('figcaption'); if (!tl || tl.querySelector('[data-ocrpg]')) return;
        tl.insertAdjacentHTML('beforeend', `<button type="button" class="px-tb s" data-ocrpg="${i}" aria-label="${ocrE(t('ocr_pg', {n: i + 1}))}" title="${ocrE(t('ocr_pg', {n: i + 1}))}">🔤</button>`);
        const G = OCRS.pg; if (G && G.base === DSC.pages[i].base) fig.insertAdjacentHTML('beforeend', ocrPgBoxHTML(i, G.text)); });
    } catch (e) {}
    return r;
  };
}
function ocrPgBoxHTML(i, text){
  return `<div class="ocr-pg" id="ocr_pg${i}"><label for="ocr_pgt${i}">🔤 ${ocrE(t('ocr_pgT', {n: i + 1}))}</label><textarea id="ocr_pgt${i}" rows="6" dir="auto" readonly>${ocrE(text)}</textarea>
    <div class="btnrow"><button type="button" class="mv" data-ocrpgc="${i}">📋 ${ocrE(t('b_copy'))}</button><button type="button" class="mv" data-ocrpgx="${i}">✕ ${ocrE(t('ocr_close'))}</button></div><p class="fine">ℹ️ ${ocrE(t('ocr_accS'))}</p></div>`;
}
async function ocrPgGo(i, btn){
  const p = DSC && DSC.pages[i]; if (!p || OCRS.busy) return;
  if (!ocrSupported()){ toast(t('ocr_old')); return; }
  OCRS.busy = true; btn.disabled = true;
  try {
    const r = await ocrPage(p, 1, 1);
    if (!r.text.trim()){ toast(t('ocr_none')); return; }
    OCRS.pg = {base: p.base, text: r.text}; dscRender();
    const ta = $('#ocr_pgt' + i); if (ta){ ta.focus(); ta.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
  } catch (e){ ocrCard(null); const k = ocrErrKey(e); if (k) toast(t(k)); }
  finally { OCRS.busy = false; if (btn.isConnected) btn.disabled = false; }
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root') || !DSC) return; let b;
  if ((b = t0.closest('#ocr_go'))){ ocrScan(b); return; }
  if ((b = t0.closest('#ocr_spdf'))){ ocrScan(b).then(ok => { if (ok && typeof dsSearchablePdf === 'function') dsSearchablePdf().catch(() => toast(t('pdf_fail'))); }); return; }
  if ((b = t0.closest('[data-ocrpg]'))){ ocrPgGo(+b.dataset.ocrpg, b); return; }
  if ((b = t0.closest('[data-ocrpgc]'))){ copyText((OCRS.pg && OCRS.pg.text) || ''); toast(t('st_copied')); return; }
  if ((b = t0.closest('[data-ocrpgx]'))){ const i = +b.dataset.ocrpgx; OCRS.pg = null; const box = $('#ocr_pg' + i); if (box) box.remove(); const f = $(`[data-ocrpg="${i}"]`); if (f) f.focus(); }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root')) return;
  if (el.id === 'ocr_lang'){ ocrSave({lang: el.value}); const h = $('#ocr_dlh'), mb = ocrNeedMB(ocrCodes()); if (h){ h.hidden = !(mb > 0); h.textContent = '⬇️ ' + t('ocr_dlOnce', {m: ocrMB(mb)}); } else if (mb > 0) dscRender(); }
  if (el.id === 'ocr_phone'){ ocrSave({phone: el.checked}); dscRender(); const n = $('#ocr_phone'); if (n) n.focus(); }
});
(() => {
  const s = document.createElement('style'); s.id = 'ocr_css';
  s.textContent = `.ocr-box{margin:6px 0}.ocr-box .prn-ck{margin:6px 0}.ocr-box .field{margin-top:12px}#ds_root #ds_ocr{width:100%;box-sizing:border-box}.ocr-acc{opacity:.9}
.ocr-run{position:fixed;z-index:60;inset-inline:16px;bottom:calc(92px + env(safe-area-inset-bottom,0px));max-width:420px;margin-inline:auto;padding:12px 14px;border-radius:14px;background:#0E1830;color:#EEF2FB;border:1px solid rgba(242,196,90,.5);box-shadow:0 10px 30px rgba(0,0,0,.4);display:grid;gap:6px}
.ocr-run p{margin:0}.ocr-run .ocr-t{font-weight:700;font-size:.92rem}.ocr-run .fine{color:#C9D3EA;font-size:.8rem}.ocr-run progress{width:100%;height:8px;accent-color:#F2C45A}.ocr-run .mv{justify-self:start;color:inherit}
.ocr-pg{margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.ocr-pg label{display:block;font-weight:600;margin-bottom:4px}.ocr-pg textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--field,transparent);color:var(--ink)}
@media print{.ocr-run{display:none!important}}`;
  document.head.appendChild(s);
})();
try { GS_SYN.docscan += ' זיהוי טקסט בלי AI זיהוי תווים OCR העתקת טקסט טקסט של העמוד text recognition without AI copy text on device OCR التعرف على النص بدون ذكاء اصطناعي نسخ النص'; } catch (e) {}
