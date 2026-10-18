/* ---------- 13.5: the smart document scanner ----------
   🔎 auto: the AI says what the photo is and it goes to the right place
   🪪 personal cards (ID, passport, licences…): a clean, straightened scan to PDF — done only on the phone, nothing sent, nothing kept
   ✉️ letters: translation into many languages, a plain explanation, what to do and by when — nothing kept
   📄 payslip / offers / exercises: as before, into the matching calculator */
const DS_KINDS = [['auto', '🔎'], ['card', '🪪'], ['letter', '✉️'], ['other', '✍️'], ['payslip', '📄', 'salary'], ['insurance', '🛡️', 'insurance'], ['loancmp', '🏦', 'loancmp'], ['mortcmp', '🏠', 'mortcmp'], ['pencmp', '🌱', 'pencmp'], ['exercise', '✏️', 'mathx'], ['taxfree', '🧳', 'taxfree']];
const DS_CARDS = [['id', '🪪', 'card'], ['passport', '🛂', 'pass'], ['license', '🚗', 'card'], ['vehicle', '📋', 'free'], ['health', '🏥', 'card'], ['credit', '💳', 'card'], ['student', '🎓', 'card'], ['army', '🎖️', 'card'], ['oleh', '🧳', 'card'], ['disab', '♿', 'card'], ['ravkav', '🚌', 'card'], ['idold', '📘', 'free'], ['cert', '📜', 'a4'], ['receipt', '🧾', 'free'], ['other', '📎', 'free']];
const DS_MM = {card: [85.6, 54], pass: [125, 88], a4: [210, 297]};
const DS_LANGS = [['he', 'עברית'], ['ar', 'العربية'], ['en', 'English'], ['ru', 'Русский'], ['am', 'አማርኛ'], ['ti', 'ትግርኛ'], ['uk', 'Українська'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português'], ['de', 'Deutsch'], ['it', 'Italiano'], ['ro', 'Română'], ['pl', 'Polski'], ['hu', 'Magyar'], ['bg', 'Български'], ['el', 'Ελληνικά'], ['nl', 'Nederlands'], ['tr', 'Türkçe'], ['fa', 'فارسی'], ['ur', 'اردو'], ['hi', 'हिन्दी'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['th', 'ไทย'], ['vi', 'Tiếng Việt'], ['tl', 'Filipino'], ['ka', 'ქართული'], ['uz', 'Oʻzbekcha'], ['sw', 'Kiswahili'], ['yi', 'ייִדיש']];
const DS_RTL = ['he', 'ar', 'fa', 'ur', 'yi'];
var DSX = {kind: '', hint: '', det: null, busy: false, view: 'kinds', tl: '', red: false};
var DSC = null;      // the card scan in progress: {pages: [{base, red: []}], cur: {img, q}, type, filt, wm, lay}
var DSL = null;      // the letter result: {j, tl, blobs, reply}
const dsKind = () => DSX.kind || 'auto';
const dsTl = () => DSX.tl || (['he', 'ar', 'en'].includes(lang) ? lang : 'en');
const dsLangName = c => (DS_LANGS.find(l => l[0] === c) || [c, c])[1];
const dsDir = c => DS_RTL.includes(c) ? 'rtl' : 'ltr';
function dsName(k){ return k === 'payslip' ? t('sl_t') : ['auto', 'card', 'letter', 'other'].includes(k) ? t('ds_k_' + k) : k === 'exercise' ? t('ds_kEx') : t('tab_' + k); }
const dsSay = (key, cls, v) => { const s = $('#ds_st'); if (s){ s.textContent = t(key, v); s.className = 'sl-st ' + (cls || ''); } };
const dsNoAi = () => { const inClaude = typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE; return `<div class="gk-st new">${slE(t(inClaude ? 'ds_noAiC' : gkNo('ds_noAi')))}</div>${inClaude || !(typeof gkAllowed === 'function' && gkAllowed()) ? '' : `<div class="btnrow"><button type="button" class="btn" data-gkgo="1">✦ ${slE(t('xs_connect'))}</button></div>`}`; };
const dsPickBtns = (multi, lab) => `<div class="btnrow ds-go"><button type="button" class="gold-btn" data-dscam="1">📷 ${slE(t(lab || 'ds_cam'))}</button><button type="button" class="btn" data-dspick="1">🖼️ ${slE(t('sl_pick'))}</button>
  <input type="file" accept="image/*"${multi ? ' multiple' : ''} data-dsfile hidden><input type="file" accept="image/*" capture="environment" data-dsfile data-cam hidden></div>`;
const dsWarn = (key, v) => `<div class="ds-warn" role="note"><span aria-hidden="true">⚠️</span><p>${slE(t(key, v))}</p></div>`;
const dsBar = title => `<div class="ds-bar"><button type="button" class="mv ds-backb" id="ds_back">${document.documentElement.dir === 'rtl' ? '›' : '‹'} ${slE(t('ds_back'))}</button><b>${slE(title)}</b></div>`;

function dscRender(){
  const root = $('#ds_root'); if (!root) return;
  if (DSX.view === 'card' && DSC) return dsCardRender(root);
  if (DSX.view === 'letter' && DSL) return dsLetterRender(root);
  DSX.view = 'kinds';
  const k = dsKind(), eng = slEngine(), can = k === 'card' || k === 'other' || k === 'auto' || !!eng, go = (DS_KINDS.find(x => x[0] === k) || [])[2];
  root.innerHTML = `<h3 class="ds-q">${slE(t('ds_what'))}</h3>
    <div class="ds-kinds" role="radiogroup" aria-label="${slE(t('ds_what'))}">${DS_KINDS.map(([id, em]) => `<button type="button" role="radio" class="ds-k${id === k ? ' on' : ''}${id === 'auto' ? ' ds-wide' : ''}" aria-checked="${id === k}" data-dsk="${id}"><b><span class="ds-em" aria-hidden="true">${em}</span> ${slE(dsName(id))}</b><small>${slE(t('ds_d_' + id))}</small></button>`).join('')}</div>
    ${(k === 'letter' || k === 'auto') && !DSX.det && eng ? `<div class="field cv-f ds-tlf"><label for="ds_tl">${slE(t('ds_tl'))}</label><select id="ds_tl">${DS_LANGS.map(([c, n]) => `<option value="${c}"${c === dsTl() ? ' selected' : ''}>${slE(n)}</option>`).join('')}</select></div>` : ''}
    ${(k === 'auto' || k === 'letter' || k === 'other') && !DSX.det ? `<div class="field ds-wmf"><label for="ds_hint">✍️ ${slE(t(k === 'other' ? 'ds_hintO' : 'ds_hint'))}</label><div class="control"><input id="ds_hint" type="text" maxlength="60" dir="auto" value="${slE(DSX.hint)}" placeholder="${slE(t('ds_hintPh'))}"></div></div>` : ''}
    ${DSX.det ? dsDetHTML() : can ? dsPickBtns(k === 'letter') + `<div class="sl-st" id="ds_st" aria-live="polite"></div>` : dsNoAi()}
    ${k === 'payslip' ? `<div class="btnrow"><button type="button" class="mv" id="ds_manual">⌨️ ${slE(t('ds_manual'))}</button></div>` : go ? `<div class="btnrow"><button type="button" class="mv" id="ds_open">↗ ${slE(t('ds_open', {n: dsName(k)}))}</button></div>` : ''}
    ${DSX.det ? '' : k === 'card' || k === 'other' || (k === 'auto' && !eng) ? dsWarn('ds_warnId') : k === 'auto' || k === 'letter' ? dsWarn('ds_warnAi') : ''}
    <p class="fine sl-priv">🔒 ${slE(t(k === 'card' || k === 'other' ? 'ds_privCard' : k === 'auto' ? (eng ? 'ds_privAuto' : 'ds_privAutoL') : k === 'letter' ? 'ds_privLetter' : 'ds_priv'))}</p>`;
}

/* one call to whichever AI is available, with or without photos */
async function dsAsk(prompt, blobs, tier){
  blobs = blobs || [];
  if (slEngine() === 'claude'){
    const o = {cache: false, modelTier: tier || 'default'}; if (blobs.length) o.images = blobs;
    try { return await PH.s.json(prompt, o); }
    catch (e){ if (e && e.code === 'not_granted') throw e; const r = await PH.s(prompt, o); return slJSON(r && r.text); }
  }
  const parts = [{text: prompt}]; for (const b of blobs) parts.push({inline_data: {mime_type: 'image/jpeg', data: await mxB64(b)}});
  return slJSON(await gemTry([SET.gmodel].concat(GEM_FALLBACK), gemKey(), [{role: 'user', parts}], {generationConfig: {responseMimeType: 'application/json', temperature: 0.1}}));
}
const dsClassify = () => `Look at this photo and say what kind of document it is.${DSX.hint ? ' The user describes it as: "' + DSX.hint.replace(/["\\]/g, '') + '".' : ''} Return ONLY JSON: {"label": a short description of the document in ${({he: 'Hebrew', ar: 'Arabic', en: 'English'})[lang] || 'English'}, 2-6 words, like "Israeli driving licence" or "letter from the National Insurance Institute" – without any name or number, "kind": one of "payslip" (an Israeli or other payslip), "insurance" (an insurance offer or quote), "loan" (a loan offer), "mortgage" (a mortgage offer), "pension" (a pension, provident or study fund offer or report), "exercise" (homework, exercise or exam questions), "taxfree" (a tax-free / VAT refund form, or a shop receipt from abroad with VAT), "card" (an identity card, passport, driving or vehicle licence, health fund card, credit card, student or any other personal card or certificate), "letter" (a letter, notice, bill, fine, contract or any other text document), "cardType": if kind is card one of "id","passport","license","vehicle","health","credit","student","army","oleh","disab","ravkav","idold","cert","receipt","other", else "", "personal": true if the document shows personal identifying details (ID or passport number, account or card number, date of birth, home address, medical details), else false}. Do NOT return any name, number or other personal detail.`;
function dsDetHTML(){
  const D = DSX.det, opts = DS_KINDS.filter(x => x[0] !== 'auto');
  return `<div class="ds-found" role="status"><span class="ds-em" aria-hidden="true">${(DS_KINDS.find(x => x[0] === D.k) || ['', '🔎'])[1]}</span><div><small>🔎 ${slE(t('ds_seems'))}</small><b dir="auto">${slE(D.label || dsName(D.k))}</b><small>${slE(t('ds_willGo', {n: D.k === 'card' && D.cardType ? t('ds_c_' + D.cardType) : dsName(D.k)}))}</small></div></div>
    ${D.k === 'card' ? dsWarn('ds_warnDetCard') : D.personal ? dsWarn('ds_warnPers') : ''}
    <div class="field cv-f ds-tlf"><label for="ds_detk">${slE(t('ds_notIt'))}</label><select id="ds_detk">${opts.map(([id, em]) => `<option value="${id}"${id === D.k ? ' selected' : ''}>${em} ${slE(dsName(id))}</option>`).join('')}</select></div>
    ${D.k === 'letter' ? `<div class="field cv-f ds-tlf"><label for="ds_tl">${slE(t('ds_tl'))}</label><select id="ds_tl">${DS_LANGS.map(([c, n]) => `<option value="${c}"${c === dsTl() ? ' selected' : ''}>${slE(n)}</option>`).join('')}</select></div>` : ''}
    <div class="btnrow"><button type="button" class="gold-btn" id="ds_detok">✓ ${slE(t('ds_detGo'))}</button><button type="button" class="mv" id="ds_detno">${slE(t('ds_detCancel'))}</button></div>
    <div class="sl-st" id="ds_st" aria-live="polite"></div>`;
}
const DS_MAP = {payslip: 'payslip', insurance: 'insurance', loan: 'loancmp', mortgage: 'mortcmp', pension: 'pencmp', exercise: 'exercise', taxfree: 'taxfree', card: 'card', letter: 'letter'};

async function dsFile(files){
  const fs = Array.from(files || []).filter(x => /^image\//.test(x.type)).slice(0, 4); if (!fs.length || DSX.busy) return;
  if ((SET.photoAccess || 'ask') === 'never'){ toast(t('pha_blocked')); return; }
  let k = DSX.view === 'card' ? 'card' : dsKind();
  if (k === 'card') return dsCardStart(fs[0]);
  if (k === 'other'){ DSX.cardType = 'other'; DSX.cardName = DSX.hint; return dsCardStart(fs[0]); }
  if (k === 'auto' && !slEngine()) return dsCardStart(fs[0]);      // no AI: the shape tells what it is, on the phone
  if (!slEngine()) return;
  if (k === 'auto'){
    DSX.busy = true; dsSay('ds_detecting');
    try {
      const j = await dsAsk(dsClassify(), [await phShrink(fs[0])]);
      DSX.busy = false;
      DSX.det = {k: DS_MAP[j && j.kind] || 'letter', label: String((j && j.label) || '').replace(/\d{5,}/g, '').slice(0, 60), cardType: DS_CARDS.some(c => c[0] === (j && j.cardType)) ? j.cardType : '', personal: !!(j && j.personal), files: fs};
      dscRender(); const f0 = $('#ds_detok'); if (f0) f0.focus();
    } catch (er){ DSX.busy = false; dsSay(er && er.code === 'not_granted' ? 'ph_denied' : 'ds_failDetect', 'bad'); }
    return;
  }
  return dsRoute(k, fs);
}
async function dsRoute(k, fs){
  if (k === 'card' || k === 'other'){ if (k === 'other'){ DSX.cardType = 'other'; DSX.cardName = DSX.hint; } return dsCardStart(fs[0]); }
  if (k === 'letter') return dsLetterRun(fs);
  const go = (DS_KINDS.find(x => x[0] === k) || [])[2], f = fs[0];
  if (k === 'payslip'){
    activate('salary');
    setTimeout(() => { try { slMount(); const b = $('#sl_box'); if (b){ b.open = true; SLX.open = true; b.scrollIntoView({block: 'start', behavior: 'smooth'}); } slAdd([f]); } catch (e) {} }, 120);
    return;
  }
  if (k === 'taxfree'){
    DSX.busy = true; dsSay('ph_reading');
    try { const j = await dsAsk(TF_ASK(), [await phShrink(f)]); DSX.busy = false; tfFromScan(j); toast(t('tf_scanned')); activate('taxfree'); setTimeout(() => { const r = $('#tf_items'); if (r) r.scrollIntoView({block: 'center', behavior: 'smooth'}); }, 200); }
    catch (er){ DSX.busy = false; dsSay(er && er.code === 'not_granted' ? 'ph_denied' : 'ph_fail', 'bad'); }
    return;
  }
  if (k === 'exercise'){
    activate('mathx');
    setTimeout(async () => { try { MX.tab = 'scan'; MX.imgs.forEach(x => URL.revokeObjectURL(x.url)); MX.imgs = []; await mxScanAdd([f]); const g = $('#mx_scGo'); if (g){ g.scrollIntoView({block: 'center', behavior: 'smooth'}); g.click(); } } catch (e) {} }, 120);
    return;
  }
  DSX.busy = true; dsSay('ph_reading');
  try {
    const j = await dsAsk(PH_ASK[k](), [await phShrink(f)]);
    phApply(k, j); DSX.busy = false; toast(t('ph_done'));
    activate(go);
    setTimeout(() => { const cards = $$(`#panel-${go} .lc-card`), last = cards[cards.length - 1]; if (last){ last.classList.add('ph-new'); last.scrollIntoView({block: 'center', behavior: 'smooth'}); } }, 200);
  } catch (er){ DSX.busy = false; dsSay(er && er.code === 'not_granted' ? 'ph_denied' : 'ph_fail', 'bad'); }
}

/* ================= personal cards: crop, straighten, clean up, hide parts, watermark, PDF — all on the phone ================= */
function dsLoad(file){
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); };
    img.src = u;
  });
}
/* find the card in the photo: split light from dark (Otsu), take the biggest patch that is not the background, use its extreme points as corners */
function dsDetect(src){
  const S = 220, k = S / Math.max(src.width, src.height), w = Math.max(8, Math.round(src.width * k)), h = Math.max(8, Math.round(src.height * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h), hist = new Array(256).fill(0);
  /* how different each pixel is from the background (the average colour of the photo's edges) – so a coloured band on the card still counts as card */
  let br = 0, bg = 0, bb = 0, bc = 0; const eb = i => { br += d[i * 4]; bg += d[i * 4 + 1]; bb += d[i * 4 + 2]; bc++; };
  for (let i = 0; i < w; i++){ eb(i); eb((h - 1) * w + i); } for (let j = 0; j < h; j++){ eb(j * w); eb(j * w + w - 1); } br /= bc; bg /= bc; bb /= bc;
  for (let i = 0; i < w * h; i++){ const v = Math.min(255, (Math.abs(d[i * 4] - br) + Math.abs(d[i * 4 + 1] - bg) + Math.abs(d[i * 4 + 2] - bb)) / 2) | 0; g[i] = v; hist[v]++; }
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, th = 128;
  for (let i = 0; i < 256; i++){ wB += hist[i]; if (!wB) continue; const wF = w * h - wB; if (!wF) break; sB += i * hist[i]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > best){ best = v; th = i; } }
  th = Math.max(18, Math.min(th, 45));                                // anything clearly unlike the background is card, even a darker band on it
  let bl = 0, bn = 0; for (let i = 0; i < w; i++){ bl += g[i] > th; bl += g[(h - 1) * w + i] > th; bn += 2; } for (let j = 0; j < h; j++){ bl += g[j * w] > th; bl += g[j * w + w - 1] > th; bn += 2; }
  const fgLight = bl / bn < 0.5, fg = i => (g[i] > th) === fgLight;
  const seen = new Uint8Array(w * h); let bestPts = null, bestN = 0; const st = [];
  for (let s = 0; s < w * h; s++){
    if (seen[s] || !fg(s)) continue;
    let n = 0, a = [Infinity, 0], b = [-Infinity, 0], cc = [-Infinity, 0], dd = [Infinity, 0]; st.length = 0; st.push(s); seen[s] = 1;
    while (st.length){ const p = st.pop(), px = p % w, py = (p / w) | 0; n++;
      if (px + py < a[0]) a = [px + py, p]; if (px + py > b[0]) b = [px + py, p]; if (px - py > cc[0]) cc = [px - py, p]; if (px - py < dd[0]) dd = [px - py, p];
      if (px > 0 && !seen[p - 1] && fg(p - 1)){ seen[p - 1] = 1; st.push(p - 1); } if (px < w - 1 && !seen[p + 1] && fg(p + 1)){ seen[p + 1] = 1; st.push(p + 1); }
      if (py > 0 && !seen[p - w] && fg(p - w)){ seen[p - w] = 1; st.push(p - w); } if (py < h - 1 && !seen[p + w] && fg(p + w)){ seen[p + w] = 1; st.push(p + w); } }
    if (n > bestN){ bestN = n; bestPts = [a[1], cc[1], b[1], dd[1]]; }
  }
  const frac = bestN / (w * h);
  if (!bestPts || frac < 0.08 || frac > 0.97) return [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]];
  return bestPts.map(p => [(p % w + 0.5) / w, (((p / w) | 0) + 0.5) / h]);
}
/* the projective map that takes the output rectangle onto the four corners in the photo */
function dsHomo(W, H, q){
  const P = [[0, 0], [W, 0], [W, H], [0, H]], A = [], B = [];
  for (let i = 0; i < 4; i++){ const [x, y] = P[i], [u, v] = q[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
  for (let c = 0; c < 8; c++){ let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r; [A[c], A[m]] = [A[m], A[c]]; [B[c], B[m]] = [B[m], B[c]];
    for (let r = 0; r < 8; r++){ if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
  return B.map((b, i) => b / A[i][i]);
}
function dsWarp(src, qn, W, H){
  const sw = src.width, sh = src.height, q = qn.map(([x, y]) => [x * sw, y * sh]), h = dsHomo(W, H, q);
  const sd = src.getContext('2d').getImageData(0, 0, sw, sh).data, out = document.createElement('canvas'); out.width = W; out.height = H;
  const ox = out.getContext('2d'), od = ox.createImageData(W, H), o = od.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const z = h[6] * x + h[7] * y + 1, u = (h[0] * x + h[1] * y + h[2]) / z, v = (h[3] * x + h[4] * y + h[5]) / z;
    const x0 = Math.max(0, Math.min(sw - 2, u | 0)), y0 = Math.max(0, Math.min(sh - 2, v | 0)), fx = Math.max(0, Math.min(1, u - x0)), fy = Math.max(0, Math.min(1, v - y0)), i = (y * W + x) * 4;
    const a = (y0 * sw + x0) * 4, b = a + 4, c = a + sw * 4, d = c + 4;
    for (let ch = 0; ch < 3; ch++) o[i + ch] = (sd[a + ch] * (1 - fx) + sd[b + ch] * fx) * (1 - fy) + (sd[c + ch] * (1 - fx) + sd[d + ch] * fx) * fy;
    o[i + 3] = 255;
  }
  ox.putImageData(od, 0, 0); return out;
}
const dsDist = (a, b, sw, sh) => Math.hypot((a[0] - b[0]) * sw, (a[1] - b[1]) * sh);
function dsOutSize(src, q, type){
  const size = (DS_CARDS.find(c => c[0] === type) || [0, 0, 'free'])[2], sw = src.width, sh = src.height;
  const mw = (dsDist(q[0], q[1], sw, sh) + dsDist(q[3], q[2], sw, sh)) / 2, mh = (dsDist(q[0], q[3], sw, sh) + dsDist(q[1], q[2], sw, sh)) / 2, port = mh > mw;
  if (size === 'free'){ const k = Math.min(1.6, 1600 / Math.max(mw, mh)); return [Math.max(50, Math.round(mw * k)), Math.max(50, Math.round(mh * k))]; }
  const [a, b] = DS_MM[size], px = size === 'a4' ? 5.9 : 11.8;                       // ~150 dpi for a page, ~300 dpi for a card
  return port ? [Math.round(Math.min(a, b) * px), Math.round(Math.max(a, b) * px)] : [Math.round(Math.max(a, b) * px), Math.round(Math.min(a, b) * px)];
}
/* the look: improved (contrast stretched), original, grey, black-and-white (adaptive threshold – sharp text) */
function dsFilter(c, f){
  const W = c.width, H = c.height, out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d'); x.drawImage(c, 0, 0);
  if (f === 'orig') return out;
  const id = x.getImageData(0, 0, W, H), d = id.data, n = W * H, L = new Uint8Array(n), hist = new Array(256).fill(0);
  for (let i = 0; i < n; i++){ const v = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000 | 0; L[i] = v; hist[v]++; }
  let lo = 0, hi = 255, acc = 0; for (let i = 0; i < 256; i++){ acc += hist[i]; if (acc > n * 0.01){ lo = i; break; } } acc = 0; for (let i = 255; i >= 0; i--){ acc += hist[i]; if (acc > n * 0.01){ hi = i; break; } }
  const sp = Math.max(1, hi - lo), st = v => Math.max(0, Math.min(255, (v - lo) * 255 / sp));
  if (f === 'auto'){ for (let i = 0; i < n * 4; i += 4){ d[i] = st(d[i]); d[i + 1] = st(d[i + 1]); d[i + 2] = st(d[i + 2]); } }
  else if (f === 'gray'){ for (let i = 0; i < n; i++){ const v = st(L[i]); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; } }
  else if (f === 'bw'){
    const I = new Float64Array((W + 1) * (H + 1)); for (let y = 0; y < H; y++){ let r = 0; for (let xx = 0; xx < W; xx++){ r += L[y * W + xx]; I[(y + 1) * (W + 1) + xx + 1] = I[y * (W + 1) + xx + 1] + r; } }
    const s = Math.max(8, Math.round(Math.max(W, H) / 24));
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++){
      const x1 = Math.max(0, xx - s), x2 = Math.min(W, xx + s + 1), y1 = Math.max(0, y - s), y2 = Math.min(H, y + s + 1);
      const m = (I[y2 * (W + 1) + x2] - I[y1 * (W + 1) + x2] - I[y2 * (W + 1) + x1] + I[y1 * (W + 1) + x1]) / ((x2 - x1) * (y2 - y1));
      const v = L[y * W + xx] < m * 0.88 ? 0 : 255, i = (y * W + xx) * 4; d[i] = d[i + 1] = d[i + 2] = v; }
  }
  x.putImageData(id, 0, 0); return out;
}
/* a page as it will be saved: the look, the hidden parts and the watermark */
function dsCompose(p){
  if (!p._f || p._fk !== DSC.filt){ p._f = dsFilter(p.base, DSC.filt); p._fk = DSC.filt; }
  const W = p.base.width, H = p.base.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(p._f, 0, 0);
  x.fillStyle = '#000'; (p.red || []).forEach(r => x.fillRect(r[0] * W, r[1] * H, r[2] * W, r[3] * H));
  const wm = String(DSC.wm || '').trim();
  if (wm){
    const txt = wm + ' · ' + new Date().toLocaleDateString('he-IL'), fs = Math.max(14, Math.round(Math.min(W, H) / 11));
    x.save(); x.font = '700 ' + fs + 'px -apple-system,"Segoe UI","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif'; x.fillStyle = 'rgba(200,30,30,.30)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.translate(W / 2, H / 2); x.rotate(-Math.atan2(H, W)); const tw = x.measureText(txt).width + fs * 2, D = Math.hypot(W, H);
    for (let yy = -D / 2; yy < D / 2; yy += fs * 2.6) for (let xx = -D / 2 - ((yy / (fs * 2.6)) % 2 ? tw / 2 : 0); xx < D / 2 + tw; xx += tw) x.fillText(txt, xx, yy);
    x.restore();
  }
  return c;
}
async function dsCardStart(file){
  let img; try { img = await dsLoad(file); } catch (e) { toast(t('ph_fail')); return; }
  const fresh = !DSC;
  if (!DSC) DSC = {pages: [], type: 'id', filt: 'auto', wm: '', lay: 'sheet', name: '', typeSet: false};
  if (DSX.cardType){ DSC.type = DSX.cardType; DSC.typeSet = true; DSX.cardType = ''; }
  if (DSX.cardName){ DSC.name = DSX.cardName.slice(0, 60); DSX.cardName = ''; }
  DSC.cur = {img, q: dsDetect(img)};
  DSC.guess = fresh && !DSC.typeSet ? dsGuess(img, DSC.cur.q) : '';
  if (DSC.guess) DSC.type = DSC.guess; DSX.view = 'card'; DSX.red = false; dscRender();
  const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'});
}
/* say what it is from its shape alone (no AI): card size, passport page, A4 page */
function dsGuess(img, q){
  const sw = img.width, sh = img.height, mw = (dsDist(q[0], q[1], sw, sh) + dsDist(q[3], q[2], sw, sh)) / 2, mh = (dsDist(q[0], q[3], sw, sh) + dsDist(q[1], q[2], sw, sh)) / 2;
  if (!(mw > 0 && mh > 0)) return ''; const r = Math.max(mw, mh) / Math.min(mw, mh), port = mh > mw;
  if (r >= 1.5 && r <= 1.72) return 'id';
  if (r >= 1.36 && r < 1.5) return port ? 'cert' : 'passport';
  if (r > 1.72 && port) return 'receipt';
  return 'other';
}
const dsCardName = () => (DSC && String(DSC.name || '').trim()) || t('ds_c_' + (DSC ? DSC.type : 'other'));
function dsCardRender(root){
  const C = DSC, cur = C.cur;
  if (cur){
    root.innerHTML = dsBar(t('ds_cropT')) + `<p class="fine">${slE(t('ds_cropH'))}</p>
      <div class="ds-crop" id="ds_crop"><canvas id="ds_cv"></canvas>${cur.q.map((_, i) => `<button type="button" class="ds-hd" data-hi="${i}" aria-label="${slE(t('ds_corner', {n: i + 1}))}"></button>`).join('')}</div>
      <div class="btnrow ds-tools"><button type="button" class="mv" id="ds_rot">⟳ ${slE(t('ds_rot'))}</button><button type="button" class="mv" id="ds_whole">⛶ ${slE(t('ds_whole'))}</button><button type="button" class="mv" id="ds_redet">✨ ${slE(t('ds_redet'))}</button></div>
      <h4 class="ds-q">${slE(t('ds_cardType'))}</h4>
      ${C.guess ? `<p class="ds-found ds-found-s" role="status">🔎 ${slE(t('ds_shape', {n: t('ds_shape_' + C.guess)}))}</p>` : ''}
      <div class="ds-chips" role="radiogroup" aria-label="${slE(t('ds_cardType'))}">${DS_CARDS.map(([id, em]) => `<button type="button" role="radio" class="ds-chip${id === C.type ? ' on' : ''}" aria-checked="${id === C.type}" data-dct="${id}">${em} ${slE(t('ds_c_' + id))}</button>`).join('')}</div>
      <div class="field ds-wmf"><label for="ds_cname">✍️ ${slE(t('ds_cname'))}</label><div class="control"><input id="ds_cname" type="text" maxlength="60" dir="auto" value="${slE(C.name || '')}" placeholder="${slE(t('ds_c_' + C.type))}"></div></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="ds_cut">✓ ${slE(t('ds_cut'))}</button></div>
      <p class="fine sl-priv">🔒 ${slE(t('ds_privCard'))}</p>`;
    dsCropDraw();
    return;
  }
  const size = (DS_CARDS.find(c => c[0] === C.type) || [0, 0, 'free'])[2];
  root.innerHTML = dsBar(dsCardName()) + `
    <div class="ds-pages">${C.pages.map((p, i) => `<figure class="ds-pg"><div class="ds-pgw"><canvas data-pgc="${i}" aria-label="${slE(t('ds_side', {n: i + 1}))}"></canvas></div><figcaption>${slE(t('ds_side', {n: i + 1}))} <button type="button" class="lg-a" data-pgdel="${i}">${slE(t('cv_rm'))}</button></figcaption></figure>`).join('')}</div>
    <div class="btnrow ds-tools">${dsPickBtns(false, 'ds_add').replace('class="btnrow ds-go"', 'class="ds-addw"')}</div>
    <h4 class="ds-q">${slE(t('ds_filt'))}</h4>
    <div class="ds-chips" role="radiogroup" aria-label="${slE(t('ds_filt'))}">${['auto', 'orig', 'gray', 'bw'].map(f => `<button type="button" role="radio" class="ds-chip${f === C.filt ? ' on' : ''}" aria-checked="${f === C.filt}" data-dfl="${f}">${slE(t('ds_f_' + f))}</button>`).join('')}</div>
    <h4 class="ds-q">${slE(t('ds_red'))}</h4><p class="fine">${slE(t(C.type === 'credit' ? 'ds_credit' : 'ds_redH'))}</p>
    <div class="btnrow"><button type="button" class="btn${DSX.red ? ' on' : ''}" id="ds_redb" aria-pressed="${DSX.red}">🖍️ ${slE(t(DSX.red ? 'ds_redOn' : 'ds_redGo'))}</button><button type="button" class="mv" id="ds_redu">↶ ${slE(t('ds_redUndo'))}</button></div>
    <div class="field ds-wmf"><label for="ds_wm">💧 ${slE(t('ds_wm'))}</label><div class="control"><input id="ds_wm" type="text" maxlength="60" dir="auto" value="${slE(C.wm)}" placeholder="${slE(t('ds_wmPh'))}"></div></div><p class="fine">${slE(t('ds_wmH'))}</p>
    ${size === 'card' || size === 'pass' ? `<div class="field cv-f"><label for="ds_lay">${slE(t('ds_lay'))}</label><select id="ds_lay">${['sheet', 'sep'].map(v => `<option value="${v}"${v === C.lay ? ' selected' : ''}>${slE(t('ds_lay_' + v))}</option>`).join('')}</select></div>` : ''}
    ${dsWarn('ds_warnSend')}
    <div class="btnrow ds-out"><button type="button" class="gold-btn" id="ds_pdf">📄 ${slE(t('ds_pdf'))}</button><button type="button" class="btn" id="ds_img">🖼️ ${slE(t('ds_img'))}</button>${navigator.share ? `<button type="button" class="btn" id="ds_share">📤 ${slE(t('ds_share'))}</button>` : ''}</div>
    <div class="btnrow"><button type="button" class="mv" id="ds_new">🗑️ ${slE(t('ds_new'))}</button></div>
    <p class="fine sl-priv">🔒 ${slE(t('ds_cardKept'))}</p>`;
  dsPagesDraw();
}
function dsCropDraw(){
  const cv = $('#ds_cv'), box = $('#ds_crop'), cur = DSC && DSC.cur; if (!cv || !cur) return;
  const bw = box.clientWidth || 320, k = bw / cur.img.width, W = Math.round(cur.img.width * k), H = Math.round(cur.img.height * k), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.drawImage(cur.img, 0, 0, W, H);
  const q = cur.q.map(([a, b]) => [a * W, b * H]);
  x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.rect(0, 0, W, H); x.moveTo(q[0][0], q[0][1]); for (let i = 3; i >= 0; i--) x.lineTo(q[i][0], q[i][1]); x.closePath(); x.fill('evenodd');
  x.strokeStyle = '#f2c14e'; x.lineWidth = 2.5; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke();
  $$('#ds_crop .ds-hd').forEach((h, i) => { h.style.left = (cur.q[i][0] * 100) + '%'; h.style.top = (cur.q[i][1] * H) + 'px'; });
}
function dsPagesDraw(){
  $$('#ds_root canvas[data-pgc]').forEach(cv => {
    const p = DSC.pages[+cv.dataset.pgc]; if (!p) return; const c = dsCompose(p);
    cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0);
  });
}
function dsCut(){
  const C = DSC, cur = C.cur; if (!cur) return;
  const [W, H] = dsOutSize(cur.img, cur.q, C.type);
  C.pages.push({base: dsWarp(cur.img, cur.q, W, H), red: []}); C.cur = null; dscRender();
}
/* the sheets that go into the file: a card or passport page at its real size on A4 (so it prints right), or each page on its own */
function dsSheets(){
  const C = DSC, size = (DS_CARDS.find(c => c[0] === C.type) || [0, 0, 'free'])[2], imgs = C.pages.map(dsCompose);
  const A4W = 2480, A4H = 3508, MM = A4W / 210, out = [];
  const sheet = () => { const c = document.createElement('canvas'); c.width = A4W; c.height = A4H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, A4W, A4H); out.push(c); return x; };
  if ((size === 'card' || size === 'pass') && C.lay === 'sheet'){
    let x = sheet(), y = 25 * MM;
    imgs.forEach(im => {
      const [a, b] = DS_MM[size], port = im.height > im.width, w = (port ? Math.min(a, b) : Math.max(a, b)) * MM, h = (port ? Math.max(a, b) : Math.min(a, b)) * MM;
      if (y + h > A4H - 20 * MM){ x = sheet(); y = 25 * MM; }
      const x0 = (A4W - w) / 2; x.drawImage(im, x0, y, w, h); x.strokeStyle = '#c8ccd4'; x.lineWidth = 3; x.setLineDash([18, 12]); x.strokeRect(x0 - 6, y - 6, w + 12, h + 12); x.setLineDash([]);
      y += h + 18 * MM;
    });
    return out;
  }
  imgs.forEach(im => { const x = sheet(), M = size === 'a4' ? 0 : 15 * MM, k = Math.min((A4W - 2 * M) / im.width, (A4H - 2 * M) / im.height), w = im.width * k, h = im.height * k; x.drawImage(im, (A4W - w) / 2, size === 'a4' ? (A4H - h) / 2 : M, w, h); });
  return out;
}
const dsFileName = ext => (dsCardName() + ' ' + new Date().toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.' + ext;
const dsJpeg = c => new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.9));
async function dsOut(how){
  if (!DSC || !DSC.pages.length) return; toast(t('ds_making'));
  await new Promise(r => setTimeout(r, 30));
  try {
    if (how === 'img'){
      const size = (DS_CARDS.find(c => c[0] === DSC.type) || [0, 0, 'free'])[2], one = DSC.pages.length === 1 || !((size === 'card' || size === 'pass') && DSC.lay === 'sheet');
      const L = one ? DSC.pages.map(dsCompose) : dsSheets();
      for (let i = 0; i < L.length; i++){ const r = await fileSave(await dsJpeg(L[i]), dsFileName('jpg').replace('.jpg', L.length > 1 ? ' ' + (i + 1) + '.jpg' : '.jpg'), 'image/jpeg'); if (r !== 'saved'){ toast(t(r === 'declined' ? 'pdf_declined' : 'pdf_fail')); return; } }
      toast(t('ds_fileOk')); return;
    }
    const blob = pdfBytes(dsSheets()), name = dsFileName('pdf');
    if (how === 'share'){
      const f = new File([blob], name, {type: 'application/pdf'});
      if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f], title: name}); } catch (er) {} return; }
    }
    const r = await fileSave(blob, name, 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
  } catch (e) { toast(t('pdf_fail')); }
}
/* dragging the corners (and the arrow keys on a focused corner) */
var DSD = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('#ds_crop .ds-hd');
  if (h){ e.preventDefault(); DSD = {i: +h.dataset.hi, el: h}; try { h.setPointerCapture(e.pointerId); } catch (er) {} return; }
  const cv = DSX.red && e.target.closest && e.target.closest('#ds_root canvas[data-pgc]');
  if (cv){ e.preventDefault(); const r = cv.getBoundingClientRect(); DSD = {red: +cv.dataset.pgc, cv, x0: (e.clientX - r.left) / r.width, y0: (e.clientY - r.top) / r.height}; try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
});
document.addEventListener('pointermove', e => {
  if (!DSD) return;
  if (DSD.el && DSC && DSC.cur){ const r = $('#ds_cv').getBoundingClientRect(); DSC.cur.q[DSD.i] = [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; dsCropDraw(); return; }
  if (DSD.cv){ const r = DSD.cv.getBoundingClientRect(), x1 = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y1 = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); DSD.x1 = x1; DSD.y1 = y1;
    const p = DSC.pages[DSD.red], c = dsCompose(p), x = DSD.cv.getContext('2d'); x.drawImage(c, 0, 0); x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(Math.min(DSD.x0, x1) * c.width, Math.min(DSD.y0, y1) * c.height, Math.abs(x1 - DSD.x0) * c.width, Math.abs(y1 - DSD.y0) * c.height); }
});
const dsUp = () => {
  if (DSD && DSD.cv && DSD.x1 != null){ const w = Math.abs(DSD.x1 - DSD.x0), h = Math.abs(DSD.y1 - DSD.y0); if (w > 0.01 && h > 0.01) DSC.pages[DSD.red].red.push([Math.min(DSD.x0, DSD.x1), Math.min(DSD.y0, DSD.y1), w, h]); dsPagesDraw(); }
  DSD = null;
};
document.addEventListener('pointerup', dsUp); document.addEventListener('pointercancel', dsUp);
document.addEventListener('keydown', e => {
  const h = e.target.closest && e.target.closest('#ds_crop .ds-hd'); if (!h || !DSC || !DSC.cur) return;
  const m = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key]; if (!m) return; e.preventDefault();
  const q = DSC.cur.q[+h.dataset.hi], s = e.shiftKey ? 0.05 : 0.01; q[0] = Math.max(0, Math.min(1, q[0] + m[0] * s)); q[1] = Math.max(0, Math.min(1, q[1] + m[1] * s)); dsCropDraw();
});
window.addEventListener('resize', () => { if (DSX.view === 'card' && DSC && DSC.cur) dsCropDraw(); });

/* ================= letters: translate, explain simply, what to do and by when, reply ================= */
function dsLetterPrompt(tl){
  const L = dsLangName(tl) + ' (' + tl + ')';
  return `The image(s) show a letter or document, one or more pages in order.${DSX.hint ? ' The reader describes it as: "' + DSX.hint.replace(/["\\]/g, '') + '".' : ''} The reader wants it in ${L}.
Return ONLY JSON:
{"docLang":"the language of the original, named in ${L}","docCode":"its ISO 639-1 code","from":"the sending organisation or office (never a private person), or empty","title":"a short title in ${L}","summary":"what the letter says, in very plain and simple ${L}: 2-5 short sentences, as if to someone who does not know the bureaucracy","actions":[{"what":"what the reader needs to do, in ${L}","deadline":"DD/MM/YYYY or empty"}],"amounts":[{"label":"in ${L}","amount":"the amount with its currency as written"}],"terms":[{"term":"a hard official term as written in the letter","meaning":"a plain explanation in ${L}"}],"warnings":"what happens if it is ignored, in ${L}, or empty","personal":true if the letter shows personal identifying details (ID number, account or card number, date of birth, home address, medical details) else false,"translation":"a full and faithful translation of the whole text into ${L}, keeping paragraph breaks as \\n; if the letter is already in ${L}, rewrite it in plain language instead"}
Do not add anything that is not in the letter. Use empty arrays when there is nothing.`;
}
async function dsLetterRun(files, tlOverride){
  const tl = tlOverride || dsTl();
  DSX.busy = true; dsSay('ds_reading');
  try {
    const blobs = DSL && tlOverride ? DSL.blobs : await Promise.all(files.map(f => phShrink(f)));
    const j = await dsAsk(dsLetterPrompt(tl), blobs, 'default');
    if (!j || typeof j !== 'object' || !(j.translation || j.summary)) throw new Error('fmt');
    DSL = {j, tl, blobs, reply: null}; DSX.busy = false; DSX.view = 'letter'; dscRender();
    const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'});
  } catch (er){ DSX.busy = false; dsSay(er && er.code === 'not_granted' ? 'ph_denied' : 'ds_failLetter', 'bad'); }
}
const dsArr = a => Array.isArray(a) ? a.filter(x => x && typeof x === 'object') : [];
const dsParas = s => String(s || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
function dsLetterRender(root){
  const {j, tl, reply} = DSL, dir = dsDir(tl), A = dsArr(j.actions), M = dsArr(j.amounts), T0 = dsArr(j.terms);
  const voice = 'speechSynthesis' in window;
  root.innerHTML = dsBar(t('ds_k_letter')) + (j.personal ? dsWarn('ds_warnPersL') : '') + `<div class="mx-card ds-let">
    <div class="ds-lt" lang="${tl}" dir="${dir}"><b>${slE(j.title || '')}</b></div>
    <p class="fine">${j.from ? `${slE(t('ds_lFrom'))}: <bdi>${slE(j.from)}</bdi> · ` : ''}${slE(t('ds_lLangs', {a: '\u2068' + (j.docLang || '?') + '\u2069', b: '\u2068' + dsLangName(tl) + '\u2069'}))}</p>
    <h4>📝 ${slE(t('ds_lSum'))}</h4><div lang="${tl}" dir="${dir}">${dsParas(j.summary).map(p => `<p>${slE(p)}</p>`).join('')}</div>
    ${A.length ? `<h4>✅ ${slE(t('ds_lAct'))}</h4><ul class="ds-acts" dir="${dir}">${A.map((a, i) => `<li><span lang="${tl}">${slE(a.what || '')}</span>${a.deadline ? ` <span class="ds-dl">⏰ <bdi>${slE(a.deadline)}</bdi></span>${dsIcsDate(a.deadline) ? ` <button type="button" class="lg-a" data-dsics="${i}">📅 ${slE(t('ds_cal'))}</button>` : ''}` : ''}</li>`).join('')}</ul>` : ''}
    ${M.length ? `<h4>💰 ${slE(t('ds_lAmt'))}</h4><ul class="ds-acts" dir="${dir}">${M.map(m => `<li><span lang="${tl}">${slE(m.label || '')}</span>: <bdi>${slE(m.amount || '')}</bdi></li>`).join('')}</ul>` : ''}
    ${j.warnings ? `<div class="gk-st new"><b>⚠️ ${slE(t('ds_lWarn'))}</b><div lang="${tl}" dir="${dir}">${slE(j.warnings)}</div></div>` : ''}
    ${T0.length ? `<details class="ds-det"><summary>📖 ${slE(t('ds_lTerms'))}</summary><dl class="ds-terms">${T0.map(x => `<dt dir="auto">${slE(x.term || '')}</dt><dd lang="${tl}" dir="${dir}">${slE(x.meaning || '')}</dd>`).join('')}</dl></details>` : ''}
    <details class="ds-det" open><summary>🌐 ${slE(t('ds_lTr', {l: dsLangName(tl)}))}</summary><div class="ds-tr" lang="${tl}" dir="${dir}">${dsParas(j.translation).map(p => `<p>${slE(p)}</p>`).join('')}</div></details>
    <div class="btnrow ds-out"><button type="button" class="btn" id="ds_lcopy">📋 ${slE(t('ds_copy'))}</button>${voice ? `<button type="button" class="btn" id="ds_lsay">🔊 ${slE(t('ds_listen'))}</button>` : ''}<button type="button" class="btn" id="ds_lpdf">📄 ${slE(t('ds_pdf'))}</button>${navigator.share ? `<button type="button" class="btn" id="ds_lshare">📤 ${slE(t('ds_share'))}</button>` : ''}</div>
    <div class="btnrow"><button type="button" class="gold-btn" id="ds_lreply">✍️ ${slE(t('ds_reply'))}</button></div>
    <div id="ds_rep" aria-live="polite">${reply ? dsReplyHTML(reply) : ''}</div>
    <div class="field cv-f ds-tlf"><label for="ds_tl2">${slE(t('ds_again'))}</label><select id="ds_tl2">${DS_LANGS.map(([c, n]) => `<option value="${c}"${c === tl ? ' selected' : ''}>${slE(n)}</option>`).join('')}</select></div>
    <div class="sl-st" id="ds_st" aria-live="polite"></div>
    <p class="fine">${slE(t('ds_lDisc'))}</p><p class="fine sl-priv">🔒 ${slE(t('ds_lKept'))}</p></div>`;
}
function dsReplyHTML(r){
  const tl = DSL.tl, oc = String(DSL.j.docCode || '').slice(0, 5);
  return `<div class="mx-card ds-rep"><h4>✍️ ${slE(t('ds_replyT'))}</h4><div class="ds-tr" dir="${oc ? dsDir(oc) : 'auto'}"${oc ? ` lang="${slE(oc)}"` : ''}>${dsParas(r.reply).map(p => `<p>${slE(p)}</p>`).join('')}</div>
    ${r.replyTr && oc !== tl ? `<details class="ds-det"><summary>🌐 ${slE(t('ds_replyTr'))}</summary><div class="ds-tr" lang="${tl}" dir="${dsDir(tl)}">${dsParas(r.replyTr).map(p => `<p>${slE(p)}</p>`).join('')}</div></details>` : ''}
    <div class="btnrow"><button type="button" class="btn" id="ds_rcopy">📋 ${slE(t('ds_copy'))}</button></div></div>`;
}
const dsLetterText = () => { const j = DSL.j; return [j.title, '', ...dsParas(j.translation)].join('\n'); };
function dsIcsDate(s){ const m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(String(s || '').trim()); if (!m) return ''; const d = +m[1], mo = +m[2]; if (d < 1 || d > 31 || mo < 1 || mo > 12) return ''; return m[3] + String(mo).padStart(2, '0') + String(d).padStart(2, '0'); }
/* a calendar entry for a deadline – a small .ics file the phone's calendar opens */
async function dsIcs(i){
  const a = dsArr(DSL.j.actions)[i]; if (!a) return; const d = dsIcsDate(a.deadline); if (!d) return;
  const esc = s => String(s || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n'), now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//fincalc//docscan//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '-' + i + '@fincalc', 'DTSTAMP:' + now, 'DTSTART;VALUE=DATE:' + d, 'SUMMARY:' + esc(a.what), 'DESCRIPTION:' + esc(DSL.j.title), 'BEGIN:VALARM', 'TRIGGER:-P2D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(a.what), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const r = await fileSave(ics, 'deadline-' + d + '.ics', 'text/calendar'); toast(t(r === 'saved' ? 'ds_fileOk' : 'pdf_fail'));
}
/* the translation as a PDF, laid out in the reading direction of its language */
function dsTextPages(title, paras, code){
  const W = 1190, H = 1684, M = 96, rtl = dsDir(code) === 'rtl', FF = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans','Noto Sans Hebrew','Noto Sans Arabic','Noto Sans Ethiopic',Arial,sans-serif", pages = [];
  let cv, x, y;
  const page = () => { cv = document.createElement('canvas'); cv.width = W; cv.height = H; x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); try { x.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {} x.textAlign = rtl ? 'right' : 'left'; x.textBaseline = 'top'; y = M; pages.push(cv); };
  const wrap = (s, max) => { const out = []; let line = ''; String(s).split(/\s+/).forEach(w => { const tr = line ? line + ' ' + w : w; if (x.measureText(tr).width > max && line){ out.push(line); line = w; } else line = tr; }); if (line) out.push(line); return out; };
  const put = (s, sz, wt, col, lh) => { x.font = wt + ' ' + sz + 'px ' + FF; x.fillStyle = col; wrap(s, W - 2 * M).forEach(l => { if (y + lh > H - M) page(); x.fillText(l, rtl ? W - M : M, y); y += lh; }); };
  page(); put(title || '', 38, 700, '#141821', 52); y += 18;
  paras.forEach(p => { put(p, 26, 400, '#1c2230', 40); y += 16; });
  return pages;
}
async function dsLetterPdf(share){
  const j = DSL.j, blob = pdfBytes(dsTextPages(j.title, dsParas(j.translation), DSL.tl)), name = ((j.title || t('ds_k_letter')) + ' ' + DSL.tl).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) + '.pdf';
  if (share){ const f = new File([blob], name, {type: 'application/pdf'}); if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f], title: name}); } catch (er) {} return; }
    try { await navigator.share({title: j.title || '', text: dsLetterText()}); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
  const r = await fileSave(blob, name, 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
}
function dsSay2(){
  const ss = window.speechSynthesis; if (!ss) return; if (ss.speaking){ ss.cancel(); return; }
  const u = new SpeechSynthesisUtterance([DSL.j.summary, ...dsParas(DSL.j.translation)].join('\n')), tl = DSL.tl, v = (ss.getVoices() || []).find(v => String(v.lang || '').toLowerCase().startsWith(tl));
  u.lang = tl; if (v) u.voice = v; else if ((ss.getVoices() || []).length) toast(t('ds_noVoice'));
  ss.speak(u);
}
async function dsReply(btn){
  if (!slEngine()) return; const j = DSL.j, tl = DSL.tl, old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('ds_replying');
  try {
    const r = await dsAsk(`Here is a letter the reader received (originally written in ${j.docLang || 'its own language'}, code ${j.docCode || '?'}), given here in ${dsLangName(tl)}:
Title: ${j.title || ''}
${j.translation || ''}

Write a short, clear and polite reply that the reader can send back, in the ORIGINAL language of the letter (${j.docCode || j.docLang || 'the same language'}). It should acknowledge the letter, answer what is asked, and leave placeholders in square brackets for anything only the reader knows (their name, ID number, dates, the request itself). Also give its translation into ${dsLangName(tl)}.
Return ONLY JSON: {"reply":"...","replyTr":"..."}`, [], 'default');
    if (!r || !r.reply) throw new Error('fmt');
    DSL.reply = {reply: String(r.reply), replyTr: String(r.replyTr || '')}; const o = $('#ds_rep'); if (o){ o.innerHTML = dsReplyHTML(DSL.reply); o.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
  } catch (er){ toast(t(er && er.code === 'not_granted' ? 'ph_denied' : 'ds_failLetter')); }
  finally { if (btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root')) return; let b;
  if ((b = t0.closest('[data-dsk]'))){ DSX.kind = b.dataset.dsk; DSX.det = null; dscRender(); const n = $(`#ds_root [data-dsk="${dsKind()}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dscam]')) || (b = t0.closest('[data-dspick]'))){
    if ((SET.photoAccess || 'ask') === 'never'){ toast(t('pha_blocked')); return; }
    const w = b.parentElement, i = w && w.querySelector(`input[data-dsfile]${b.dataset.dscam ? '[data-cam]' : ':not([data-cam])'}`); if (i) i.click(); return; }
  if (t0.closest('#ds_back')){ if (DSX.view === 'card' && DSC && DSC.cur && DSC.pages.length){ DSC.cur = null; dscRender(); return; } DSX.view = 'kinds'; if (DSC && !DSC.pages.length) DSC = null; dscRender(); return; }
  if (t0.closest('#ds_manual')){ activate('salary'); setTimeout(() => { try { slMount(); const b2 = $('#sl_box'); if (b2){ b2.open = true; SLX.open = true; b2.scrollIntoView({block: 'start', behavior: 'smooth'}); const f = $('#sl_month'); if (f) f.focus({preventScroll: true}); } } catch (er) {} }, 120); return; }
  if (t0.closest('#ds_open')){ const go = (DS_KINDS.find(x => x[0] === dsKind()) || [])[2]; if (go){ if (go === 'mathx') MX.tab = 'scan'; activate(go); } return; }
  /* cards */
  if (t0.closest('#ds_rot')){ const cur = DSC.cur, s = cur.img, c = document.createElement('canvas'); c.width = s.height; c.height = s.width; const x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(s, 0, 0); cur.img = c; cur.q = cur.q.map(([a, b2]) => [1 - b2, a]); cur.q = [cur.q[3], cur.q[0], cur.q[1], cur.q[2]]; dsCropDraw(); return; }
  if (t0.closest('#ds_whole')){ DSC.cur.q = [[0, 0], [1, 0], [1, 1], [0, 1]]; dsCropDraw(); return; }
  if (t0.closest('#ds_redet')){ DSC.cur.q = dsDetect(DSC.cur.img); dsCropDraw(); return; }
  if ((b = t0.closest('[data-dct]'))){ DSC.type = b.dataset.dct; DSC.typeSet = true; $$('#ds_root [data-dct]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); const n = $('#ds_cname'); if (n){ n.placeholder = t('ds_c_' + DSC.type); if (DSC.type === 'other') n.focus(); } return; }
  if (t0.closest('#ds_detok')){ const D = DSX.det; if (!D) return; const k = ($('#ds_detk') || {}).value || D.k; DSX.det = null; if (k === 'card' && D.cardType) DSX.cardType = D.cardType; if (k === 'card' && D.label) DSX.cardName = D.label; dscRender(); dsRoute(k, D.files); return; }
  if (t0.closest('#ds_detno')){ DSX.det = null; dscRender(); return; }
  if (t0.closest('#ds_cut')){ const btn = t0.closest('#ds_cut'); btn.disabled = true; btn.textContent = '⏳'; setTimeout(() => { try { dsCut(); } catch (er) { toast(t('ph_fail')); dscRender(); } }, 30); return; }
  if ((b = t0.closest('[data-pgdel]'))){ DSC.pages.splice(+b.dataset.pgdel, 1); if (!DSC.pages.length){ DSC = null; DSX.view = 'kinds'; } dscRender(); return; }
  if ((b = t0.closest('[data-dfl]'))){ DSC.filt = b.dataset.dfl; dscRender(); return; }
  if (t0.closest('#ds_redb')){ DSX.red = !DSX.red; dscRender(); return; }
  if (t0.closest('#ds_redu')){ for (let i = DSC.pages.length - 1; i >= 0; i--) if (DSC.pages[i].red.length){ DSC.pages[i].red.pop(); break; } dsPagesDraw(); return; }
  if (t0.closest('#ds_pdf')){ dsOut('pdf'); return; }
  if (t0.closest('#ds_img')){ dsOut('img'); return; }
  if (t0.closest('#ds_share')){ dsOut('share'); return; }
  if (t0.closest('#ds_new')){ DSC = null; DSX.view = 'kinds'; DSX.red = false; dscRender(); return; }
  /* letters */
  if (t0.closest('#ds_lcopy')){ copyText(dsLetterText()); toast(t('st_copied')); return; }
  if (t0.closest('#ds_rcopy')){ copyText(DSL.reply ? DSL.reply.reply : ''); toast(t('st_copied')); return; }
  if (t0.closest('#ds_lsay')){ dsSay2(); return; }
  if (t0.closest('#ds_lpdf')){ dsLetterPdf(false); return; }
  if (t0.closest('#ds_lshare')){ dsLetterPdf(true); return; }
  if ((b = t0.closest('#ds_lreply'))){ dsReply(b); return; }
  if ((b = t0.closest('[data-dsics]'))){ dsIcs(+b.dataset.dsics); return; }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root')) return;
  if (el.hasAttribute('data-dsfile')){ dsFile(el.files); el.value = ''; return; }
  if (el.id === 'ds_tl'){ DSX.tl = el.value; return; }
  if (el.id === 'ds_detk' && DSX.det){ DSX.det.k = el.value; if (el.value !== 'card') DSX.det.cardType = ''; dscRender(); return; }
  if (el.id === 'ds_tl2' && DSL){ DSX.tl = el.value; dsLetterRun(null, el.value); return; }
  if (el.id === 'ds_lay'){ DSC.lay = el.value; return; }
});
document.addEventListener('input', e => {
  if (e.target && e.target.id === 'ds_hint'){ DSX.hint = e.target.value.slice(0, 60); return; }
  if (e.target && e.target.id === 'ds_cname' && DSC){ DSC.name = e.target.value.slice(0, 60); return; }
  if (e.target && e.target.id === 'ds_wm' && DSC){ DSC.wm = e.target.value.slice(0, 60); clearTimeout(DSX.wt); DSX.wt = setTimeout(dsPagesDraw, 250); } });
CALC.docscan = () => null;
try { GS_SYN.docscan = 'סורק סריקה סריקת מסמכים צילום מסמך תלוש קבלה הצעה תעודת זהות ת"ז דרכון רישיון כרטיס מכתב תרגום scan scanner document photo payslip id passport licence card letter translate ماسح مسح مستند تصوير قسيمة هوية جواز رخصة رسالة ترجمة'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindDs = svKind; svKind = function(id){ return id === 'docscan' ? '' : svKindDs.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('docscan'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('docscan'); } catch (e) {}
{
  const actDs = activate; activate = function(id){ const r = actDs.apply(this, arguments); if (id === 'docscan') dscRender(); return r; };
  const alDs = applyLang; applyLang = function(){ const r = alDs.apply(this, arguments); try { if (tab === 'docscan') dscRender(); } catch (e) {} return r; };
  if (typeof phRenderAll === 'function'){ const phDs = phRenderAll; phRenderAll = function(){ const r = phDs.apply(this, arguments); try { if (tab === 'docscan' && DSX.view === 'kinds') dscRender(); } catch (e) {} return r; }; }
  try { if (tab === 'docscan') dscRender(); } catch (e) {}
}
