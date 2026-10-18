
/* ================= 7.6: digit grouping while you type, your own separators, yesterday's close when live data is off,
   the credit point value in settings, more salary options, the company car from the government price list, AI at the top ================= */

/* ---------- separators: one choice for everything the app shows and everything you type ---------- */
var SEP_G = {comma: ',', dot: '.', space: ' ', apos: '’', none: ''};
var SEP_MEMO = {};   /* 8.3: the answer only changes with the language or the setting */
function sepGroup(){
  const s = SET.sep; if (s && s !== 'auto' && SEP_G[s] != null) return SEP_G[s];
  const k = 'g' + locOf(); if (SEP_MEMO[k] != null) return SEP_MEMO[k];
  try { return SEP_MEMO[k] = (new Intl.NumberFormat(locOf()).formatToParts(12345.5).find(p => p.type === 'group') || {}).value || ','; } catch (e) { return ','; }
}
function sepDec(){
  const s = SET.sep; if (s === 'dot') return ','; if (s && s !== 'auto') return '.';
  const k = 'd' + locOf(); if (SEP_MEMO[k] != null) return SEP_MEMO[k];
  try { return SEP_MEMO[k] = (new Intl.NumberFormat(locOf()).formatToParts(1.5).find(p => p.type === 'decimal') || {}).value || '.'; } catch (e) { return '.'; }
}
N = function(x, d, max){
  if (!isFinite(x)) return '—';
  const key = lang + SET.digits + '|' + d + '|' + max;
  let f = nfc[key];
  if (!f){
    const o = max != null ? {maximumFractionDigits: max} : d == null ? {maximumFractionDigits: 2} : {minimumFractionDigits: d, maximumFractionDigits: d};
    try { f = nfc[key] = new Intl.NumberFormat(locOf(), o); } catch (e) { f = nfc[key] = new Intl.NumberFormat('en-US', o); }
  }
  if (!SET.sep || SET.sep === 'auto') return f.format(x);
  const g = SEP_G[SET.sep] != null ? SEP_G[SET.sep] : ',', dc = SET.sep === 'dot' ? ',' : '.';
  return f.formatToParts(x).map(p => p.type === 'group' ? g : p.type === 'decimal' ? dc : p.value).join('');
};

/* ---------- number fields show 15,000 while you type; every calculation still reads the plain number ---------- */
var NUM_VAL = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
var NUM_SKIP = /^(in_from|in_to|wd_|dev_|acc_|mv_|rc_|del_|hd_|ln_|srl|cl_dueDay|cs_|dc_|gh_|fx_|aix_|as_q|gs_q|cp_q|ex_q|scn-in-|exp_date)/;
const numGrpOn = () => SET.inGroup !== '0';
function numPlain(v){                                   // a number written by code: always "." for decimals
  let s = String(v == null ? '' : v).trim();
  if (/e[+-]?\d/i.test(s) && isFinite(+s)) s = String(+s);
  s = s.replace(/[^\d.\-]/g, '');
  const neg = s.charAt(0) === '-'; s = s.replace(/-/g, '');
  const i = s.indexOf('.'); if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  return (neg ? '-' : '') + s;
}
function numRead(disp){                                  // what the person typed, in their separators → a plain number
  let s = String(disp == null ? '' : disp).replace(/[\s  ’'`]/g, '');
  const g = numGrpOn() ? sepGroup() : '', dc = sepDec();
  s = s.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6F0));
  if (dc === ','){
    const ld = s.lastIndexOf('.');                       // a keyboard with only "." still gives decimals: ".5" at the end is a decimal point
    if (s.indexOf(',') < 0 && ld >= 0 && s.length - ld - 1 <= 2) s = s.slice(0, ld).replace(/\./g, '') + ',' + s.slice(ld + 1);
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '');
    if (g && g !== ',' && g !== '.') s = s.split(g).join('');
  }
  return numPlain(s);
}
function numShow(raw){
  raw = String(raw == null ? '' : raw);
  if (raw === '' || raw === '-' || raw === '.') return raw === '.' ? '0' + sepDec() : raw;
  const neg = raw.charAt(0) === '-', r = neg ? raw.slice(1) : raw, i = r.indexOf('.');
  let ip = i < 0 ? r : r.slice(0, i); const fp = i < 0 ? null : r.slice(i + 1);
  ip = ip.replace(/^0+(?=\d)/, '');
  if (ip === '' && fp != null) ip = '0';
  const g = numGrpOn() ? sepGroup() : '';
  if (g && ip.length > 3) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, g);
  return (neg ? '-' : '') + ip + (fp != null ? sepDec() + fp : '');
}
function numSetDisp(el, raw){ const d = numShow(raw); NUM_VAL.set.call(el, d); el.__raw = raw; el.__disp = d; }
function numEnhance(el){
  if (!el || el.__num || el.tagName !== 'INPUT' || el.readOnly && el.dataset.numSkip) return;
  if (NUM_SKIP.test(el.id || '') || el.classList.contains('rng') || el.classList.contains('lc-name')) return;
  const im = el.getAttribute('inputmode') || '';
  if (!(el.type === 'number' || (el.type === 'text' && /decimal|numeric/.test(im)))) return;
  const raw0 = numPlain(NUM_VAL.get.call(el));
  if (el.type === 'number'){ el.type = 'text'; if (!im) el.setAttribute('inputmode', 'decimal'); }
  el.__num = true; el.setAttribute('data-num', '1'); el.setAttribute('autocomplete', 'off'); el.setAttribute('spellcheck', 'false');
  if (!el.getAttribute('dir')) el.setAttribute('dir', 'ltr');
  Object.defineProperty(el, 'value', {configurable: true,
    get(){ const d = NUM_VAL.get.call(this); return d === this.__disp ? this.__raw : numRead(d); },
    set(v){ numSetDisp(this, numPlain(v)); }});
  numSetDisp(el, raw0);
}
function numScan(root){ $$('input', root || document).forEach(numEnhance); }
function numRefresh(){ $$('input[data-num]').forEach(el => numSetDisp(el, el.__raw != null ? el.__raw : numRead(NUM_VAL.get.call(el)))); }
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.__num) return;
  const disp = NUM_VAL.get.call(el), pos = el.selectionStart == null ? disp.length : el.selectionStart;
  const before = disp.slice(0, pos), nd = (before.match(/\d/g) || []).length;
  const raw = numRead(disp), out = numShow(raw);
  el.__raw = raw;
  if (out === disp){ el.__disp = out; return; }
  NUM_VAL.set.call(el, out); el.__disp = out;
  let k = 0, p = 0; while (p < out.length && k < nd){ if (/\d/.test(out.charAt(p))) k++; p++; }
  if (/[.,]$/.test(before) && out.charAt(p) === sepDec()) p++;
  if (nd === 0 && /^-/.test(out)) p = Math.max(p, 1);
  try { if (document.activeElement === el) el.setSelectionRange(p, p); } catch (err) {}
}, true);
document.addEventListener('focusin', e => { const el = e.target; if (el && el.__num) try { const n = NUM_VAL.get.call(el).length; setTimeout(() => { try { if (document.activeElement === el && el.selectionStart === el.selectionEnd) el.setSelectionRange(n, n); } catch (x) {} }, 0); } catch (err) {} });
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes){ if (n.nodeType !== 1) continue; if (n.tagName === 'INPUT') numEnhance(n); else if (n.querySelector && n.querySelector('input')) numScan(n); } })
  .observe(document.body, {childList: true, subtree: true});
numScan();
document.addEventListener('change', e => {
  const id = e.target && e.target.id;
  if (id === 'set_sep' || id === 'set_inGroup' || id === 'set_digits' || id === 'set_lang'){ setTimeout(() => { numRefresh(); try { calc(tab); } catch (x) {} sepHint(); }, 0); }
});
function sepHint(){
  const s = $('#set_sep'); if (!s) return;
  const f = s.closest('.field'); if (!f) return;
  let ex = $('.sep-ex', f); if (!ex){ ex = document.createElement('small'); ex.className = 'hint sep-ex'; ex.setAttribute('dir', 'ltr'); f.appendChild(ex); }
  ex.textContent = t('sep_ex', {a: N(1234567.89, 2), b: numShow('15000')});
}
setTimeout(sepHint, 0);

/* ---------- the credit point value: official, or your own (Settings → Calculators) ---------- */
function ptOfficial(){ const o = typeof FG_OFF === 'object' && FG_OFF.point; return isFinite(+o) && +o > 0 ? +o : 242; }
function ptMine(){ const v = parseFloat(SET.ptVal); return SET.ptMode === 'manual' && v > 0 && v < 5000 ? v : 0; }
function ptApply(){ const m = ptMine(); if (m) TAX.point = m * 12; }
const figApply76 = figApply;
figApply = function(){ const r = figApply76.apply(this, arguments); ptApply(); try { ptUi(); } catch (e) {} return r; };
function ptUi(){
  const m = $('#set_ptMode'), f = $('#set_ptVal'); if (!m || !f) return;
  m.value = SET.ptMode === 'manual' ? 'manual' : 'auto';
  const man = m.value === 'manual';
  f.disabled = !man; const box = f.closest('.field'); if (box) box.classList.toggle('fld-off', !man);
  if (!man || !(parseFloat(SET.ptVal) > 0)){ if (document.activeElement !== f) f.value = man ? (SET.ptVal || '') : String(ptOfficial()); }
  let h = box && $('.pt-now', box); if (box && !h){ h = document.createElement('small'); h.className = 'hint pt-now'; box.appendChild(h); }
  if (h) h.textContent = t('pt_now', {v: MI(TAX.point / 12, 2), y: MI(TAX.point), o: MI(ptOfficial(), 2)});
}
document.addEventListener('change', e => {
  const id = e.target && e.target.id; if (id !== 'set_ptMode' && id !== 'set_ptVal') return;
  if (id === 'set_ptVal'){ const v = parseFloat(e.target.value); SET.ptVal = v > 0 ? String(v) : ''; if (v > 0) SET.ptMode = 'manual'; }
  saveSet(); figApply(false); try { calc(tab); } catch (x) {}
  toast(t(ptMine() ? 'pt_set' : 'pt_auto', {v: MI(TAX.point / 12, 2)}));
});
const showPt = show;
show = function(id, res){
  if (ptMine() && res && !FG_SKIP.includes(id) && !['vat', 'loan', 'mortgage', 'prime', 'loancmp', 'refi', 'prepay', 'savegoal', 'retire', 'creditcard', 'rentbuy', 'carlease', 'avgcost', 'breakeven', 'networth', 'debtplan', 'fire', 'freedom', 'inflation', 'cpilink', 'mgmtfees', 'kidsave', 'benefits', 'mortcap', 'empcost'].includes(id))
    res = Object.assign({}, res, {warn: (res.warn || []).concat(t('w_ptMine', {v: MI(ptMine(), 2)}))});
  return showPt.call(this, id, res);
};
ptApply(); setTimeout(ptUi, 0);
const applyLangPt = applyLang;
applyLang = function(){ const r = applyLangPt.apply(this, arguments); try { ptUi(); sepHint(); } catch (e) {} return r; };

/* ---------- salary: more credit points (new immigrant, child with a disability, alimony) ---------- */
function olehPts(){
  const k = ($('#s_oleh') || {}).value, m = Math.max(1, Math.floor(v('s_olehM') || 1));
  if (k === 'new') return m <= 12 ? 1 : m <= 30 ? 3 : m <= 42 ? 2 : m <= 54 ? 1 : 0;      // from 2022: 1/12, then 1/4, 1/6, 1/12 point a month
  if (k === 'old') return m <= 18 ? 3 : m <= 30 ? 2 : m <= 42 ? 1 : 0;                    // before 2022: 1/4, 1/6, 1/12 point a month
  return 0;
}
const pointsOf76 = pointsOf;
pointsOf = function(p){
  let pts = pointsOf76.apply(this, arguments);
  if (p === 's'){
    pts += olehPts();
    pts += 2 * Math.max(0, Math.floor(v('s_dkids') || 0));
    if (($('#s_alim') || {}).value === '1') pts += 1;
  }
  return pts;
};
/* fields that only matter with a company car stay hidden without one */
const applyWhen76 = applyWhen;
applyWhen = function(id){
  const r = applyWhen76.apply(this, arguments);
  if (id === 'salary'){
    const co = ($('#s_car') || {}).value === 'co', mode = ($('#s_carMode') || {}).value;
    ['s_carMode', 's_carKind', 's_carGil', 's_carPay', 's_carExtra', 's_carBr'].forEach(k => { const f = $('#' + k); const box = f && f.closest('.field'); if (box) box.hidden = !co; });
    const bx = $('#s_carBrRate'), bb = bx && bx.closest('.field'); if (bb) bb.hidden = !co || ($('#s_carBr') || {}).value !== 'manual';
    const pr = $('#s_carPrice'), pb = pr && pr.closest('.field'); if (pb) pb.hidden = !co || mode === 'value';
    const vv = $('#s_carVal'), vb = vv && vv.closest('.field'); if (vb) vb.hidden = !co || mode !== 'value';
    const pk = $('#s_carPick'); if (pk) pk.hidden = !co || mode !== 'list';
    if (pr){ pr.readOnly = co && mode === 'list'; pr.classList.toggle('ro', pr.readOnly); }
    const kd = $('#s_carKind'); if (kd) kd.disabled = co && mode === 'list' && !!(SET.carPick && SET.carPick.p);
    if (co && mode === 'list') carPickRender();
  }
  return r;
};

/* ---------- the company car straight from the Ministry of Transport price list ---------- */
var CARS = {d: null, st: '', at: 0, q: ''};
function carsUrl(){ return IN_CLAUDE ? 'https://ysdesign-il.github.io/financial-calculator/cars.json' : 'cars.json'; }
async function carsLoad(){
  if (CARS.d || CARS.st === 'wait') return CARS.d;
  CARS.st = 'wait'; carPickRender();
  try {
    const r = await fetch(carsUrl() + '?v=' + Math.floor(Date.now() / 86400000), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (!r.ok) throw 0;
    const d = await r.json(); if (!d || !d.makes) throw 0;
    CARS.d = d; CARS.st = 'ok';
  } catch (e) { CARS.st = 'fail'; }
  carPickRender();
  return CARS.d;
}
var CAR_HE = {'קורולה': 'corolla', 'יאריס': 'yaris', 'קאמרי': 'camry', 'ראב': 'rav4', 'פריוס': 'prius', 'סי אייץ': 'c-hr', 'הילנדר': 'highlander', 'לנד קרוזר': 'land cruiser',
  'איוניק': 'ioniq', 'טוסון': 'tucson', 'קונה': 'kona', 'אלנטרה': 'elantra', 'סונטה': 'sonata', 'סנטה פה': 'santa fe', 'i10': 'i10', 'i20': 'i20', 'i30': 'i30',
  'ספורטז': 'sportage', 'פיקנטו': 'picanto', 'ניירו': 'niro', 'סיד': 'ceed', 'סורנטו': 'sorento', 'סטוניק': 'stonic', 'אוקטביה': 'octavia', 'סופרב': 'superb', 'קודיאק': 'kodiaq', 'קארוק': 'karoq', 'פאביה': 'fabia', 'קאמיק': 'kamiq', 'אניאק': 'enyaq',
  'גולף': 'golf', 'פולו': 'polo', 'פאסאט': 'passat', 'טיגואן': 'tiguan', 'טי רוק': 't-roc', 'מאזדה': 'mazda', 'סיוויק': 'civic', 'ג\'אז': 'jazz', 'סוויפט': 'swift', 'ויטרה': 'vitara', 'קשקאי': 'qashqai', 'ג\'וק': 'juke', 'מיקרה': 'micra',
  'טסלה': 'tesla', 'מודל 3': 'model 3', 'מודל y': 'model y', 'אטו 3': 'atto 3', 'דולפין': 'dolphin', 'סיל': 'seal', 'קליו': 'clio', 'קפצ\'ור': 'captur', 'מגאן': 'megane', 'דאסטר': 'duster', 'סנדרו': 'sandero', 'ג\'וגר': 'jogger',
  '208': '208', '2008': '2008', '3008': '3008', 'קורסה': 'corsa', 'אסטרה': 'astra', 'מוקה': 'mokka', 'סיד ספורטס': 'ceed', 'אאוטלנדר': 'outlander', 'אקליפס': 'eclipse', 'ספייס סטאר': 'space star', 'פורסטר': 'forester', 'XV': 'xv'};
function carAlias(q){ let s = ' ' + q + ' '; Object.keys(CAR_HE).forEach(h => { const n = pmNorm(h).trim(); if (n && s.includes(' ' + n + ' ')) s = s.replace(' ' + n + ' ', ' ' + CAR_HE[h] + ' '); }); return pmNorm(s).trim(); }
const carKindName = k => t({fuel: 'o_cbFuel', hybrid: 'o_cbHybrid', plugin: 'o_cbPlugin', ev: 'o_cbEv'}[k] || 'o_cbFuel');
function carPickRender(){
  const box = $('#s_carPick'); if (!box || box.hidden) return;
  if (!CARS.d){
    if (CARS.st !== 'wait' && CARS.st !== 'fail') { carsLoad(); return; }
    box.innerHTML = `<p class="fine car-st">${asEsc(t(CARS.st === 'fail' ? 'car_fail' : 'car_loading'))}</p>${CARS.st === 'fail' ? `<button type="button" class="mv wide" id="car_retry">${asEsc(t('car_retry'))}</button>` : ''}`;
    return;
  }
  const P = SET.carPick || {}, M = CARS.d.makes, makes = Object.keys(M);
  const key = [lang, P.mk, P.md, P.i, CARS.q, CARS.d.asOf].join('|'); if (box.dataset.k === key) return; box.dataset.k = key;
  const opt = (v, l, on) => `<option value="${asEsc(v)}"${on ? ' selected' : ''}>${asEsc(l)}</option>`;
  const q = carAlias(pmNorm(CARS.q || '').trim());
  let hits = '';
  if (q.length >= 2){
    const words = q.split(' '), res = [];
    makes.forEach(mk => Object.keys(M[mk]).forEach(md => { const tx = pmNorm(mk + ' ' + md).toLowerCase(); if (words.every(w => tx.includes(w))) res.push([mk, md]); }));
    hits = `<div class="car-hits">${res.slice(0, 30).map(([mk, md]) => `<button type="button" class="as-chip" data-carhit="${asEsc(mk)}|${asEsc(md)}">${asEsc(md)} · <small>${asEsc(mk)}</small></button>`).join('') || `<p class="fine">${asEsc(t('car_none'))}</p>`}</div>`;
  }
  const mdl = P.mk && M[P.mk] ? Object.keys(M[P.mk]) : [], vers = P.mk && P.md && M[P.mk] && M[P.mk][P.md] ? M[P.mk][P.md] : [];
  box.innerHTML = `<div class="car-h"><b>${asEsc(t('car_title'))}</b><small>${asEsc(t('car_src', {d: new Date((CARS.d.asOf || 0) * 1000).toLocaleDateString(locOf())}))}</small></div>
    <input type="search" class="car-q lookup" id="car_q" placeholder="${asEsc(t('car_qPh'))}" value="${asEsc(CARS.q || '')}" autocomplete="off">${hits}
    <div class="car-sel"><label><span>${asEsc(t('car_make'))}</span><select id="car_mk"><option value="">—</option>${makes.map(m => opt(m, m, m === P.mk)).join('')}</select></label>
    <label><span>${asEsc(t('car_model'))}</span><select id="car_md"${mdl.length ? '' : ' disabled'}><option value="">—</option>${mdl.map(m => opt(m, m, m === P.md)).join('')}</select></label>
    <label class="wide"><span>${asEsc(t('car_ver'))}</span><select id="car_v"${vers.length ? '' : ' disabled'}><option value="">—</option>${vers.map((x, i) => opt(String(i), [x[0], x[1], MI(x[2]), carKindName(x[3])].filter(Boolean).join(' · '), String(i) === String(P.i))).join('')}</select></label></div>
    ${P.p ? `<p class="car-pk">✓ ${asEsc(t('car_picked', {p: MI(P.p), k: carKindName(P.k)}))}</p>` : `<p class="fine">${asEsc(t('car_hint'))}</p>`}`;
}
function carSetPick(p){
  SET.carPick = p; saveSet();
  const v0 = p.mk && p.md && CARS.d && CARS.d.makes[p.mk] && CARS.d.makes[p.mk][p.md] ? CARS.d.makes[p.mk][p.md][+p.i] : null;
  if (v0 && p.i !== '' && p.i != null){
    SET.carPick = Object.assign(p, {p: v0[2], k: v0[3]}); saveSet();
    const pr = $('#s_carPrice'), kd = $('#s_carKind');
    if (pr){ pr.value = v0[2]; pr.dispatchEvent(new Event('input', {bubbles: true})); }
    if (kd){ kd.value = v0[3]; kd.dispatchEvent(new Event('change', {bubbles: true})); }
  } else { delete SET.carPick.p; delete SET.carPick.k; saveSet(); }
  carPickRender(); try { calc('salary'); } catch (e) {}
}
document.addEventListener('change', e => {
  const id = e.target && e.target.id;
  if (id === 'car_mk') carSetPick({mk: e.target.value, md: '', i: ''});
  else if (id === 'car_md') carSetPick({mk: (SET.carPick || {}).mk, md: e.target.value, i: ''});
  else if (id === 'car_v') carSetPick(Object.assign({}, SET.carPick || {}, {i: e.target.value}));
});
document.addEventListener('input', e => { if (e.target && e.target.id === 'car_q'){ CARS.q = e.target.value; const pos = e.target.selectionStart; carPickRender(); const q = $('#car_q'); if (q){ q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } } });
document.addEventListener('click', e => {
  const h = e.target.closest && e.target.closest('[data-carhit]');
  if (h){ const [mk, md] = h.dataset.carhit.split('|'); CARS.q = ''; const vs = CARS.d.makes[mk][md] || []; carSetPick({mk, md, i: vs.length === 1 ? '0' : ''}); const v = $('#car_v'); if (v && vs.length > 1) v.focus(); return; }
  if (e.target.closest && e.target.closest('#car_retry')){ CARS.st = ''; carPickRender(); }
});

/* ---------- live data off: yesterday's closing rates, at the close of trading ---------- */
var CLOSE = {usd: null, at: 0, on: false, d: null, pc: {}, T: null};
var CLOSE_KEYS = {s_mkt: 'cl_s_mkt', st_mkt: 'cl_st_mkt', mk_mktAt: 'cl_mk_mktAt'};
function closeTexts(on){                                     // labels say "closing rate" while live data is off
  if (on && !CLOSE.T){ CLOSE.T = {}; Object.keys(CLOSE_KEYS).forEach(k => { CLOSE.T[k] = T[k]; T[k] = T[CLOSE_KEYS[k]]; }); }
  else if (!on && CLOSE.T){ Object.keys(CLOSE.T).forEach(k => { T[k] = CLOSE.T[k]; }); CLOSE.T = null; }
}
function prevTradingDay(){ const d = new Date(); do { d.setDate(d.getDate() - 1); } while (d.getDay() === 0 || d.getDay() === 6); return d; }
function tzUnix(day, hh, mm, tz){
  const y = day.getFullYear(), mo = day.getMonth(), d = day.getDate(), guess = Date.UTC(y, mo, d, hh, mm);
  try {
    const p = new Intl.DateTimeFormat('en-US', {timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}).formatToParts(new Date(guess));
    const g = k => +(p.find(x => x.type === k) || {}).value;
    const asTz = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
    return Math.round((guess - (asTz - guess)) / 1000);
  } catch (e) { return Math.round(guess / 1000); }
}
const closeLabel = () => { const d = CLOSE.d || prevTradingDay(); try { return new Intl.DateTimeFormat(locOf(), {weekday: 'short', day: 'numeric', month: 'short'}).format(d); } catch (e) { return d.toDateString(); } };
async function closeFetchLive(){                           // on the website the quote feed gives the previous close directly
  if (IN_CLAUDE) return false;
  try {
    const r = await fetch(ixQurl(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (!r.ok) return false;
    const rows = ((((await r.json()) || {}).FormattedQuoteResult || {}).FormattedQuote) || [], usd = {};
    rows.forEach(q => {
      const fk = Object.keys(FX_CN).find(x => FX_CN[x][0] === q.symbol), pc = ixNum(q.previous_day_closing);
      if (fk && pc > 0){ usd[fk] = FX_CN[fk][1] ? 1 / pc : pc; return; }
      const k = IX_MK.find(x => IX_SYM[x] === q.symbol); if (k && pc > 0) CLOSE.pc[k] = pc;
    });
    if (Object.keys(usd).length >= 3){ CLOSE.usd = usd; CLOSE.at = Date.now(); return true; }
  } catch (e) {}
  return false;
}
function closeApply(){
  if (SET.mktLive !== '0') return;
  const day = prevTradingDay(); CLOSE.d = day; CLOSE.on = true; closeTexts(true);
  let n = 0;
  if (CLOSE.usd){
    Object.keys(CLOSE.usd).forEach(k => { const v = +CLOSE.usd[k], old = RATES[k]; if (!(v > 0) || (old && (v / old < 0.8 || v / old > 1.25))) return; RATES[k] = v; FXSRC[k] = {s: 'close', at: tzUnix(day, 17, 0, 'America/New_York') * 1000}; n++; });
  } else if (typeof OFFDOC === 'object' && OFFDOC){ try { applyDbRates(OFFDOC); } catch (e) {} }
  if (n){ RATES.USD = 1; META.live = false; META.official = false; META.mkt = true; META.unix = tzUnix(day, 17, 0, 'America/New_York'); }
  IX_MK.forEach(k => {
    const it = IX.mkt[k], pc = +CLOSE.pc[k] || (it && +it.pc); if (!it || !(pc > 0)) return;
    const ta = k === 'ta35' || k === 'ta125';
    IX.mkt[k] = Object.assign({}, it, {p: pc, pc, chp: NaN, live: false, closed: true, t: ta ? tzUnix(day, 17, 25, 'Asia/Jerusalem') : tzUnix(day, 16, 0, 'America/New_York')});
  });
  try { fillCurSelects(); renderStamp(); if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {}
}
const fxApplySnap76 = fxApplySnap;
fxApplySnap = function(L){
  try { if (L && L.close && typeof L.close === 'object' && Object.keys(L.close).length >= 3){ CLOSE.usd = L.close; CLOSE.at = +L.asOf || 0; } } catch (e) {}
  const r = fxApplySnap76.apply(this, arguments);
  if (SET.mktLive === '0' && !MKT_FORCE) setTimeout(closeApply, 0);
  return r;
};
const ixApply76 = ixApply;
ixApply = function(d){
  try { const it = d && d.mkt && d.mkt.items; if (it) Object.keys(it).forEach(k => { if (+it[k].pc > 0) CLOSE.pc[k] = +it[k].pc; }); } catch (e) {}
  const r = ixApply76.apply(this, arguments); if (SET.mktLive === '0' && !MKT_FORCE) setTimeout(closeApply, 0); return r; };
const rfDataTime76 = rfDataTime;
rfDataTime = function(){ return CLOSE.on && SET.mktLive === '0' ? closeLabel() : rfDataTime76.apply(this, arguments); };
const mktApply76 = mktApply;
mktApply = function(quiet){
  const r = mktApply76.apply(this, arguments);
  if (SET.mktLive === '0'){ closeFetchLive().then(closeApply, closeApply); closeApply(); }
  else if (CLOSE.on){ CLOSE.on = false; closeTexts(false); try { refreshEverything(true); } catch (e) {} }
  return r;
};
const ixBoardClose = ixBoard;
ixBoard = function(){
  const r = ixBoardClose.apply(this, arguments);
  if (CLOSE.on && SET.mktLive === '0'){ const n = $('#hmx .mkt-note'); if (n && !$('.close-note', n.parentNode)) n.insertAdjacentHTML('beforebegin', `<p class="fine close-note">🕔 ${asEsc(t('mk_closeNote', {d: closeLabel()}))}</p>`); }
  return r;
};
if (SET.mktLive === '0') setTimeout(() => { closeFetchLive().then(closeApply, closeApply); }, 2600);

/* ---------- AI at the top of every calculator ---------- */
var AI_TOP_SKIP = ['home', 'settings', 'assist'];
const aiFabSync76 = aiFabSync;
aiFabSync = function(){
  const r = aiFabSync76.apply(this, arguments);
  const b = $('#ai_fab'), h = $('#phead'); if (!b || !h) return r;
  const top = !AI_TOP_SKIP.includes(tab);
  if (top){ const anchor = $('.ph-t', h); if (b.parentNode !== h || b.previousElementSibling !== anchor) anchor ? anchor.insertAdjacentElement('afterend', b) : h.appendChild(b); }
  else if (b.parentNode !== document.body) document.body.appendChild(b);
  b.classList.toggle('ai-top', top); b.hidden = tab === 'assist';
  return r;
};
try { aiFabSync(); } catch (e) {}

/* ---------- live data off means off: nothing updates, every price stays at the previous trading day's close, with its date ---------- */
const liveOff = () => SET.mktLive === '0' || SET.liveFx === '0';
function liveSync(off){                                    // the home switch, the converter switch and the settings choice are one switch
  SET.mktLive = off ? '0' : '1'; SET.liveFx = off ? '0' : '1';
  $$('#fx_live, .fx-live-cb').forEach(c => { c.checked = !off; });
  const s1 = $('#set_mktLive'); if (s1) s1.value = SET.mktLive; const s2 = $('#set_liveFx'); if (s2) s2.value = SET.liveFx;
}
if (liveOff()) liveSync(true);
var CLOSE_OK = false;                                      // set while the close itself is being applied
const ixLiveTickOff = ixLiveTick;
ixLiveTick = async function(){ if (liveOff()){ clearTimeout(IXL.timer); IXL.timer = null; return false; } return ixLiveTickOff.apply(this, arguments); };
const fxCoinbaseOnceOff = fxCoinbaseOnce;
fxCoinbaseOnce = async function(){ return liveOff() ? false : fxCoinbaseOnceOff.apply(this, arguments); };
const tryLiveGeminiOff = tryLiveGemini;
tryLiveGemini = async function(){ return liveOff() ? false : tryLiveGeminiOff.apply(this, arguments); };
const pullBoiFxOff = pullBoiFx, pullEcbOff = pullEcb;
pullBoiFx = async function(){ if (liveOff()){ SRC_ST.boiFx = 'off'; return; } return pullBoiFxOff.apply(this, arguments); };
pullEcb = async function(){ if (liveOff()){ SRC_ST.ecb = 'off'; return; } return pullEcbOff.apply(this, arguments); };
const applyUsdOff = applyUsd;
applyUsd = function(){ return liveOff() ? 0 : applyUsdOff.apply(this, arguments); };
const applyDbRatesOff = applyDbRates;
applyDbRates = function(d){
  if (liveOff() && !CLOSE_OK){ try { if (d && d.usd && +d.asOf >= (+(OFFDOC || {}).asOf || 0)) OFFDOC = {usd: d.usd, asOf: +d.asOf}; } catch (e) {} return; }
  return applyDbRatesOff.apply(this, arguments);
};
/* where the close comes from: the app's data file (kept by the scheduled updater), and on the website the quote feed itself */
async function closeLoad(){
  let got = false;
  try {
    const r = await rjFetch((IN_CLAUDE ? IX_GH : 'rates.json') + '?s=' + RJ_SLOT(), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
    if (r.ok){
      const d = await r.json(), L = d && d.live, it = d && d.mkt && d.mkt.items; rjSeen(d);
      if (L && L.close && Object.keys(L.close).length >= 3){ CLOSE.usd = L.close; CLOSE.at = +L.asOf || 0; got = true; }
      if (it) Object.keys(it).forEach(k => { if (+it[k].pc > 0) CLOSE.pc[k] = +it[k].pc; });
      if (d && d.usd && d.asOf) OFFDOC = {usd: d.usd, asOf: +d.asOf};
    }
  } catch (e) {}
  if (!got) got = await closeFetchLive();
  return got;
}
const closeApplyOff = closeApply;
closeApply = function(){
  if (!liveOff()) return;
  SET.mktLive = '0';
  CLOSE_OK = true;
  try {
    META.live = false; META.cryptoLive = false;
    if (fxTimer){ clearTimeout(fxTimer); fxTimer = null; } if (binTimer){ clearTimeout(binTimer); binTimer = null; } clearTimeout(IXL.timer); IXL.timer = null;
    closeApplyOff.apply(this, arguments);
    T.mk_mktAt = [0, 1, 2].map(i => (T.cl_mk_mktAt[i] || '').replace('{t}', closeLabel()));
    if (CLOSE.T) CLOSE.T.ix_snap = CLOSE.T.ix_snap || T.ix_snap; else CLOSE.T = {ix_snap: T.ix_snap};
    T.ix_snap = T.cl_ix_snap;
    try { if (tab === 'home') renderMarket(); renderStamp(); } catch (e) {}
  } finally { CLOSE_OK = false; }
};
const closeTextsOff = closeTexts;
closeTexts = function(on){ if (!on && CLOSE.T && CLOSE.T.ix_snap){ T.ix_snap = CLOSE.T.ix_snap; delete CLOSE.T.ix_snap; } return closeTextsOff.apply(this, arguments); };
/* refreshing while live data is off brings the latest close, never a live price */
const refreshEverythingOff = refreshEverything;
refreshEverything = async function(manual){
  if (!liveOff()) return refreshEverythingOff.apply(this, arguments);
  const btns = $$('#gRefresh, .rf-btn'); btns.forEach(b => b.classList.add('spin'));
  try { await closeLoad(); closeApply(); } finally { btns.forEach(b => b.classList.remove('spin')); }
  if (manual){ const m = t('mk_offRefresh', {d: closeLabel()}); toast(m); const st = $('#x_status'); if (st) st.textContent = m; }
  return false;
};
tryLive = function(manual){ return refreshEverything(!!manual); };
const renderStampOff = renderStamp;
renderStamp = function(){
  const r = renderStampOff.apply(this, arguments);
  if (liveOff()){ const g = $('#gStamp'); if (g) g.textContent = t('st_offClose', {d: closeLabel()}); $$('#fx_st, .fx-st').forEach(s => { s.textContent = t('st_offClose', {d: closeLabel()}); }); }
  return r;
};
const mktApplyOff = mktApply;
mktApply = function(quiet){
  liveSync(SET.mktLive === '0'); saveSet();
  if (liveOff()){ closeLoad().then(closeApply, closeApply); }
  return mktApplyOff.apply(this, arguments);
};
/* every live switch in the app now turns the same thing on and off */
document.addEventListener('change', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'fx_live' || (el.classList && el.classList.contains('fx-live-cb'))){ const off = !el.checked; setTimeout(() => { SET.mktLive = off ? '0' : '1'; mktApply(); }, 0); }
  else if (el.id === 'set_liveFx'){ const off = el.value === '0'; setTimeout(() => { SET.mktLive = off ? '0' : '1'; mktApply(); }, 0); }
});
if (liveOff()) setTimeout(() => { closeLoad().then(closeApply, closeApply); }, 300);
