/* ================= 10.1: when holidays overlap, the country decides which theme comes first ================= */
/* Israel (or no country chosen): Jewish holidays first. Muslim-majority countries: Muslim first. Everyone else: Christian first. */
const HOL_MUSLIM_CTY = 'AF AL AZ BH BD BN BF DZ DJ EG GM GN ID IR IQ JO KZ KM KW KG LB LY MV ML MR MA MY NE OM PK PS QA SA SN SL SO SD SY TJ TD TN TR TM AE UZ YE XK'.split(' ');
function holOrder(c){
  if (!c || c === 'IL') return ['jewish', 'muslim', 'christian'];
  if (HOL_MUSLIM_CTY.includes(c)) return ['muslim', 'christian', 'jewish'];
  return ['christian', 'jewish', 'muslim'];
}
const holidayNow101 = holidayNow;
holidayNow = function(d){
  const pick = SET.holAuto;
  if (pick !== 'all') return holidayNow101.apply(this, arguments);
  try {
    for (const g of holOrder(SET.country)){ SET.holAuto = g; const r = holidayNow101.call(this, d); if (r) return r; }
    return '';
  } finally { SET.holAuto = pick; }
};
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'set_country') return;
  setTimeout(() => { try { const was = HOL_ACTIVE; applyTheme(); if (was !== HOL_ACTIVE && typeof skRender === 'function') skRender(); } catch (er) {} }, 0);
});
try { applyTheme(); if (typeof skRender === 'function') skRender(); } catch (e) {}

/* ---------- the data file (and, inside Claude, the app's database) is pulled 6 times a day; live sources keep their own pace ---------- */
var RJ_MAN = false;
const refreshEverything101 = refreshEverything;
refreshEverything = async function(manual){ RJ_MAN = !!manual; try { return await refreshEverything101.apply(this, arguments); } finally { RJ_MAN = false; } };
const rfOfficial101 = rfOfficial;
rfOfficial = async function(){
  /* on open the data comes in by itself (and inside Claude the database pushes every change), then 6 times a day;
     an automatic refresh only renews the live quotes, while the refresh button always pulls everything */
  if (!RJ_MAN) return !!(META && META.unix);
  rjMark(); return rfOfficial101.apply(this, arguments);
};

/* ---------- the interface follows the phone's language (until one is picked by hand); a change on the phone applies right away ---------- */
window.addEventListener('languagechange', () => {
  if (!langAuto()) return; const L = devLang(); if (L === lang) return;
  lang = L; try { applyLang(true); } catch (e) {}
});

/* ================= 10.7: more language options ================= */
const E107 = s => asEsc(String(s == null ? '' : s));
const BCP = {he: 'he-IL', ar: 'ar', en: 'en-US'};
const bcp = l => BCP[l] || l;

/* ---------- week start: by country unless chosen ---------- */
function wkStart(){
  const w = SET.wkStart; if (w === 'sun' || w === 'mon') return w;
  const c = SET.country; return !c || c === 'IL' || HOL_MUSLIM_CTY.includes(c) ? 'sun' : 'mon';
}

/* ---------- date format: numeric dates follow the chosen order; month names, other calendars and times are untouched ---------- */
(function dfmtInstall(){
  const DTF = Intl.DateTimeFormat;
  const want = (loc, o) => { const f = SET.dfmt; return f && f !== 'auto' && o && o.day && (o.month === 'numeric' || o.month === '2-digit') && !/-u-.*ca-/.test(String(loc || '')); };
  function DF(loc, o){
    const f = new DTF(loc, o);
    if (!want(loc, o)) return f;
    const ord = SET.dfmt, tOpt = {}, wOpt = {};
    ['hour', 'minute', 'second', 'hour12', 'hourCycle', 'timeZone'].forEach(k => { if (o[k] != null) tOpt[k] = o[k]; });
    if (o.weekday){ wOpt.weekday = o.weekday; if (o.timeZone) wOpt.timeZone = o.timeZone; }
    const tf = tOpt.hour || tOpt.minute ? new DTF(loc, tOpt) : null, wf = o.weekday ? new DTF(loc, wOpt) : null;
    const nf = new DTF('en-US', Object.assign({day: '2-digit', month: '2-digit'}, o.year ? {year: 'numeric'} : {}, o.timeZone ? {timeZone: o.timeZone} : {}));
    return {
      format(d){
        const p = {}; nf.formatToParts(d == null ? new Date() : d).forEach(x => { p[x.type] = x.value; });
        const dd = o.day === '2-digit' || ord === 'ymd' ? p.day : String(+p.day), mm = o.month === '2-digit' || ord === 'ymd' ? p.month : String(+p.month);
        const s = ord === 'ymd' ? [p.year, mm, dd].filter(Boolean).join('-') : (ord === 'mdy' ? [mm, dd, p.year] : [dd, mm, p.year]).filter(Boolean).join('/');
        return (wf ? wf.format(d) + ' ' : '') + '⁦' + s + '⁩' + (tf ? ' ' + tf.format(d) : '');
      },
      formatToParts(d){ return f.formatToParts(d); },
      resolvedOptions(){ return f.resolvedOptions(); }
    };
  }
  DF.supportedLocalesOf = DTF.supportedLocalesOf.bind(DTF);
  try { Intl.DateTimeFormat = DF; } catch (e) {}
  const tlds = Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString = function(loc, o){ if (want(loc, o)) return DF(loc, o).format(this); return tlds.apply(this, arguments); };
})();

/* ---------- amounts in words (Hebrew, Arabic, English) ---------- */
function wordsHe(n){
  const o = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
  const te = ['עשרה', 'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר', 'שישה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר'];
  const tn = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
  const hu = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות'];
  const th = ['', 'אלף', 'אלפיים', 'שלושת אלפים', 'ארבעת אלפים', 'חמשת אלפים', 'ששת אלפים', 'שבעת אלפים', 'שמונת אלפים', 'תשעת אלפים', 'עשרת אלפים'];
  const tri = x => { const r = []; if (x >= 100){ r.push(hu[Math.floor(x / 100)]); x %= 100; } if (x >= 20){ r.push(tn[Math.floor(x / 10)]); x %= 10; if (x) r.push(o[x]); } else if (x >= 10) r.push(te[x - 10]); else if (x) r.push(o[x]); return r; };
  if (n === 0) return 'אפס';
  const tok = [], b = Math.floor(n / 1e9), m = Math.floor(n / 1e6) % 1000, k = Math.floor(n / 1e3) % 1000, r = n % 1000;
  if (b) tok.push(b === 1 ? 'מיליארד' : b === 2 ? 'שני מיליארד' : tri(b).join(' ') + ' מיליארד');
  if (m) tok.push(m === 1 ? 'מיליון' : m === 2 ? 'שני מיליון' : tri(m).join(' ') + ' מיליון');
  if (k) tok.push(k <= 10 ? th[k] : tri(k).join(' ') + ' אלף');
  tok.push(...tri(r));
  if (tok.length > 1) tok[tok.length - 1] = 'ו' + tok[tok.length - 1];
  return tok.join(' ');
}
function centsHe(n){
  const o = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  const te = ['עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה'];
  const tn = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
  if (n < 10) return o[n]; if (n < 20) return te[n - 10];
  return tn[Math.floor(n / 10)] + (n % 10 ? ' ו' + o[n % 10] : '');
}
function wordsAr(n){
  const o = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const te = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tn = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hu = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const tri = x => { const r = []; if (x >= 100){ r.push(hu[Math.floor(x / 100)]); x %= 100; } if (x >= 20){ const u = x % 10; r.push(u ? o[u] + ' و' + tn[Math.floor(x / 10)] : tn[Math.floor(x / 10)]); } else if (x >= 10) r.push(te[x - 10]); else if (x) r.push(o[x]); return r.join(' و'); };
  const big = (x, one, two, few, many) => x === 1 ? one : x === 2 ? two : x <= 10 ? tri(x) + ' ' + few : tri(x) + ' ' + many;
  if (n === 0) return 'صفر';
  const g = [], b = Math.floor(n / 1e9), m = Math.floor(n / 1e6) % 1000, k = Math.floor(n / 1e3) % 1000, r = n % 1000;
  if (b) g.push(big(b, 'مليار', 'ملياران', 'مليارات', 'مليار'));
  if (m) g.push(big(m, 'مليون', 'مليونان', 'ملايين', 'مليون'));
  if (k) g.push(big(k, 'ألف', 'ألفان', 'آلاف', 'ألف'));
  if (r) g.push(tri(r));
  return g.join(' و');
}
function wordsEn(n){
  const o = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const tri = x => { const r = []; if (x >= 100){ r.push(o[Math.floor(x / 100)] + ' hundred'); x %= 100; } if (x >= 20) r.push(tn[Math.floor(x / 10)] + (x % 10 ? '-' + o[x % 10] : '')); else if (x) r.push(o[x]); return r.join(' '); };
  if (n === 0) return 'zero';
  const g = [], u = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
  for (const [d, w] of u){ const q = Math.floor(n / d) % 1000; if (q) g.push(tri(q) + ' ' + w); }
  if (n % 1000) g.push(tri(n % 1000));
  return g.join(' ');
}
function curWord(c, n, L){
  if (c === 'ILS') return L === 'he' ? (n === 1 ? 'שקל' : 'שקלים') : L === 'ar' ? 'شيكل' : (n === 1 ? 'shekel' : 'shekels');
  try { const p = new Intl.NumberFormat(L, {style: 'currency', currency: c, currencyDisplay: 'name'}).formatToParts(n).find(x => x.type === 'currency'); if (p) return p.value; } catch (e) {}
  return c;
}
function amountWords(x, c, L){
  L = L || lang; if (!['he', 'ar', 'en'].includes(L) || !isFinite(x)) return '';
  const neg = x < 0; x = Math.abs(x); if (x >= 1e12) return '';
  let whole = Math.floor(x), cents = Math.round((x - whole) * 100); if (cents === 100){ whole++; cents = 0; }
  const W = L === 'he' ? wordsHe : L === 'ar' ? wordsAr : wordsEn;
  let s = (L === 'he' && whole === 1 ? curWord(c, 1, L) + ' אחד' : W(whole) + ' ' + curWord(c, whole, L));
  if (cents){
    if (c === 'ILS') s += L === 'he' ? ' ו' + (cents === 1 ? 'אגורה אחת' : centsHe(cents) + ' אגורות') : L === 'ar' ? ' و' + wordsAr(cents) + ' أغورة' : ' and ' + wordsEn(cents) + (cents === 1 ? ' agora' : ' agorot');
    else s += ' ' + (L === 'he' ? 'ו־' : L === 'ar' ? 'و' : 'and ') + '\u2066' + cents + '/100\u2069';
  }
  return (neg ? (L === 'he' ? 'מינוס ' : L === 'ar' ? 'سالب ' : 'minus ') : '') + s;
}
/* remember which number each formatted amount came from, so the result line can be put into words */
var MREC = new Map();
const M107 = M;
M = function(x, d, c){
  const s = M107.apply(this, arguments);
  if (typeof x === 'number' && isFinite(x)){ if (MREC.size > 600) MREC.clear(); MREC.set(s, [x, arguments.length > 2 && c ? c : cur]); }
  return s;
};

/* ---------- the result: words under it, and a speaker to read it ---------- */
function heroPlain(id){ const h = $('#hero-' + id); if (!h) return ''; const l = $('.hero-label', h), v = $('.hero-value', h), w = $('.hero-words', h); return [l && l.textContent, v && v.textContent, w && w.textContent].filter(Boolean).join('. ').replace(/[⁦-⁩‎‏]/g, ''); }
const show107 = show;
show = function(id, res){
  const r = show107.apply(this, arguments);
  try {
    const h = $('#hero-' + id); if (!h || !res || !res.hero) return r;
    const rec = SET.words === '0' ? null : MREC.get(res.hero.value);
    const w = rec ? amountWords(rec[0], rec[1]) : '';
    if (w) h.insertAdjacentHTML('beforeend', `<div class="hero-words" dir="auto">${E107(w)}</div>`);
    if (SET.tts !== '0' && 'speechSynthesis' in window) h.insertAdjacentHTML('afterbegin', `<button type="button" class="hero-say" data-say="${E107(id)}" aria-label="${E107(t('say_btn'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg></button>`);
    lxDecorate($('#panel-' + id));
  } catch (e) {}
  return r;
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-say]'); if (!b) return;
  try {
    const ss = window.speechSynthesis; if (ss.speaking){ ss.cancel(); b.classList.remove('on'); return; }
    const u = new SpeechSynthesisUtterance(heroPlain(b.dataset.say)); u.lang = bcp(lang);
    const vs = ss.getVoices(), base = lang.split('-')[0], v = vs.find(x => x.lang && x.lang.toLowerCase().startsWith(base)); if (v) u.voice = v;
    u.onend = u.onerror = () => b.classList.remove('on'); b.classList.add('on'); ss.speak(u);
  } catch (er) {}
});

/* ---------- labels: the English term, and a plain-language line under professional terms ---------- */
const PLAIN = [[/ריבית בנק ישראל/, 'pl_boi'], [/מרווח/, 'pl_margin'], [/פריים/, 'pl_prime'], [/דמי ניהול/, 'pl_fee'], [/רווח הון/, 'pl_cgt'], [/מקדם המרה/, 'pl_coef'], [/נקוד(ת|ות) זיכוי/, 'pl_points'],
  [/השתלמות/, 'pl_study'], [/פיצויים/, 'pl_sev'], [/פנסיה|גמל/, 'pl_pens'], [/ביטוח לאומי/, 'pl_ni'], [/הבראה/, 'pl_havraa'], [/גרייס/, 'pl_grace'], [/דיבידנד/, 'pl_div'], [/מדרג/, 'pl_bracket'],
  [/שווי (רכב|שימוש|הטבות|טלפון|מתנה)/, 'pl_benefit'], [/הצמדה|מדד/, 'pl_cpi'], [/אינפלציה/, 'pl_infl'], [/תשואה/, 'pl_ret'], [/ריבית/, 'pl_rate'], [/עמל(ה|ת)/, 'pl_comm'], [/מע[״"]?מ/, 'pl_vat'], [/ברוטו/, 'pl_gross'], [/נטו/, 'pl_net']];
function lxDecorate(root){
  root = root || document;
  const en = SET.enTerms === '1' && lang !== 'en', pl = SET.plain === '1';
  $$('.field label[data-i]', root).forEach(l => {
    const k = l.dataset.i, src = T[k];
    if (en && src && src[2] && src[2] !== l.textContent) l.dataset.en = src[2]; else delete l.dataset.en;
    const f = l.closest('.field'); if (!f) return;
    let x = $(':scope > .plain-x, :scope > .fb > .plain-x', f);
    const hit = pl && src && PLAIN.find(p => p[0].test(src[0]));
    if (!hit){ if (x) x.remove(); return; }
    if (!x){ x = document.createElement('small'); x.className = 'plain-x'; (l.parentElement.classList.contains('fb') ? l.parentElement : f).appendChild(x); }
    const s = '💡 ' + t(hit[1]); if (x.textContent !== s) x.textContent = s;
  });
  if (SET.voiceIn === '1' && SR_OK) $$('.control input', root).forEach(i => {
    if (i.type === 'range' || i.type === 'date' || i.closest('.control').querySelector('.mic-b')) return;
    if (!(i.inputMode === 'decimal' || i.inputMode === 'numeric' || i.type === 'number' || i.dataset.num != null)) return;
    i.insertAdjacentHTML('afterend', `<button type="button" class="mic-b" data-mic="${E107(i.id)}" aria-label="${E107(t('mic_btn'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>`);
  });
  else $$('.mic-b', root).forEach(b => b.remove());
}
const _al107 = applyLang;
applyLang = function(){ const r = _al107.apply(this, arguments); try { lxDecorate(); } catch (e) {} return r; };

/* ---------- numbers by voice ---------- */
const SREC = window.SpeechRecognition || window.webkitSpeechRecognition, SR_OK = !!SREC;
const NUMW = {
  'אפס':0,'אחד':1,'אחת':1,'שתיים':2,'שניים':2,'שתי':2,'שני':2,'שלוש':3,'שלושה':3,'ארבע':4,'ארבעה':4,'חמש':5,'חמישה':5,'שש':6,'שישה':6,'שבע':7,'שבעה':7,'שמונה':8,'תשע':9,'תשעה':9,'עשר':10,'עשרה':10,
  'עשרים':20,'שלושים':30,'ארבעים':40,'חמישים':50,'שישים':60,'שבעים':70,'שמונים':80,'תשעים':90,'מאה':100,'מאתיים':200,'אלפיים':2000,'שלושת':3,'ארבעת':4,'חמשת':5,'ששת':6,'שבעת':7,'שמונת':8,'תשעת':9,'עשרת':10,'שנים':2,
  'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,
  'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90,
  'صفر':0,'واحد':1,'اثنان':2,'اثنين':2,'ثلاثة':3,'ثلاث':3,'أربعة':4,'اربعة':4,'خمسة':5,'خمس':5,'ستة':6,'ست':6,'سبعة':7,'سبع':7,'ثمانية':8,'ثماني':8,'تسعة':9,'تسع':9,'عشرة':10,'عشر':10,
  'عشرون':20,'عشرين':20,'ثلاثون':30,'ثلاثين':30,'أربعون':40,'أربعين':40,'خمسون':50,'خمسين':50,'ستون':60,'ستين':60,'سبعون':70,'سبعين':70,'ثمانون':80,'ثمانين':80,'تسعون':90,'تسعين':90,'مائة':100,'مئة':100,'مائتان':200,'مئتين':200,'ألفان':2000,'ألفين':2000
};
const MULW = [[/^(אלף|אלפים|thousand|thousands|k|ألف|آلاف|الف|ألفا|ألفًا)$/, 1e3], [/^(מיליון|מיליונים|million|millions|مليون|ملايين)$/, 1e6], [/^(מאות|hundred|hundreds|مئات)$/, 100]];
function parseSpoken(s){
  s = String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).toLowerCase();
  s = s.replace(/(\d)[,\s](?=\d{3}\b)/g, '$1').replace(/(\d),(\d)/g, '$1.$2').replace(/[־\-]/g, ' ').replace(/\band\b/g, ' ').replace(/(\d)([^\d\s.])/g, '$1 $2');
  let total = 0, curv = 0, seen = false;
  for (let w of s.split(/\s+/).filter(Boolean)){
    const bare = w in NUMW || MULW.some(([rx]) => rx.test(w)) || /^(חצי|half|نصف)$/.test(w) ? w : w.replace(/^[וو]/, '');
    w = bare;
    const num = /^\d+(\.\d+)?$/.test(w) ? parseFloat(w) : (w in NUMW ? NUMW[w] : null);
    if (num != null){ curv += num; seen = true; continue; }
    if (/^(חצי|half|نصف)$/.test(w)){ curv += 0.5; seen = true; continue; }
    if (/^(עשר|עשרה)$/.test(w)){ curv += 10; seen = true; continue; }
    const m = MULW.find(([rx]) => rx.test(w));
    if (m){ seen = true; if (m[1] === 100){ curv = (curv || 1) * 100; } else { total += (curv || 1) * m[1]; curv = 0; } }
  }
  return seen ? total + curv : null;
}
var MIC = null;
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-mic]'); if (!b) return;
  e.preventDefault();
  if (!SR_OK){ toast(t('voice_na')); return; }
  const inp = document.getElementById(b.dataset.mic); if (!inp) return;
  try { if (MIC){ MIC.abort(); MIC = null; } } catch (er) {}
  const r = new SREC(); MIC = r; r.lang = bcp(lang); r.interimResults = false; r.maxAlternatives = 3;
  b.classList.add('on'); toast(t('mic_listen'));
  r.onresult = ev => {
    const alts = [...(ev.results[0] || [])].map(a => a.transcript);
    let n = null; for (const a of alts){ n = parseSpoken(a); if (n != null) break; }
    if (n == null){ toast(t('mic_fail')); return; }
    inp.value = String(Math.round(n * 100) / 100);
    inp.dispatchEvent(new Event('input', {bubbles: true})); inp.dispatchEvent(new Event('change', {bubbles: true}));
  };
  r.onerror = () => { toast(t('mic_fail')); };
  r.onend = () => { b.classList.remove('on'); MIC = null; };
  try { r.start(); } catch (er) { b.classList.remove('on'); toast(t('voice_na')); }
});

/* ---------- copy, share and PDF in another language ---------- */
var SHL_BUSY = false;
function withShareLang(fn, id){
  const L = SET.shareLang;
  if (!L || L === 'ui' || L === lang || SHL_BUSY) return fn();
  const prev = lang, y = window.scrollY; SHL_BUSY = true;
  try { lang = L; applyLang(true); if (id && id !== tab) try { calc(id); } catch (e) {} return fn(); }
  finally { lang = prev; try { applyLang(true); if (id && id !== tab) calc(id); } catch (e) {} SHL_BUSY = false; try { window.scrollTo(0, y); } catch (e) {} }
}
const shrText107 = shrText;
shrText = function(id){ const a = arguments; return withShareLang(() => shrText107.apply(this, a), id); };
const pdfModel107 = pdfModel;
pdfModel = function(id){
  const a = arguments, L = SET.shareLang && SET.shareLang !== 'ui' ? SET.shareLang : lang;
  const B = withShareLang(() => pdfModel107.apply(this, a), id);
  try { B._dir = L === 'en' ? 'ltr' : (L === 'he' || L === 'ar') ? 'rtl' : document.documentElement.dir; } catch (e) {}
  return B;
};
const pdfPages107 = pdfPages;
pdfPages = function(B){
  const r = document.documentElement, d0 = r.dir;
  if (B && B._dir && B._dir !== d0) r.dir = B._dir;
  try { return pdfPages107.apply(this, arguments); } finally { if (r.dir !== d0) r.dir = d0; }
};

/* ---------- suggest a better translation: long-press any text ---------- */
var TRF = {t: null, x: 0, y: 0, el: null, fired: false};
function trTarget(el){ const x = el && el.closest && el.closest('[data-i]'); return x && !x.closest('#trf, input, textarea, select') ? x : null; }
document.addEventListener('pointerdown', e => {
  if (SET.trFix === '0' || e.button > 0) return;
  const el = trTarget(e.target); if (!el) return;
  TRF.x = e.clientX; TRF.y = e.clientY; TRF.el = el; TRF.fired = false; clearTimeout(TRF.t);
  TRF.t = setTimeout(() => { TRF.fired = true; trOpen(TRF.el); }, 650);
}, true);
['pointerup', 'pointercancel', 'scroll'].forEach(ev => document.addEventListener(ev, () => clearTimeout(TRF.t), true));
document.addEventListener('pointermove', e => { if (Math.abs(e.clientX - TRF.x) + Math.abs(e.clientY - TRF.y) > 12) clearTimeout(TRF.t); }, true);
document.addEventListener('click', e => { if (TRF.fired){ TRF.fired = false; e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener('contextmenu', e => { if (SET.trFix !== '0' && trTarget(e.target)) e.preventDefault(); }, true);
function trOpen(el){
  const k = el.dataset.i, now = el.textContent.trim(); if (!k || !now) return;
  try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
  let o = $('#trf');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="trf" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="trf_t"><div class="cp-top"><h3 id="trf_t"></h3><button type="button" class="cp-x" id="trf_x">×</button></div><div id="trf_b"></div></div></div>`); o = $('#trf'); }
  $('#trf_t').textContent = t('tr_title'); $('#trf_x').setAttribute('aria-label', t('cp_close'));
  $('#trf_b').innerHTML = `<p class="fine">${E107(t('tr_now'))}</p><p class="trf-now" dir="auto">${E107(now)}</p>
    <label class="scn-l" for="trf_in">${E107(t('tr_new'))}</label><textarea id="trf_in" class="lookup" rows="3" dir="auto" maxlength="400" data-pii-ok>${E107(now)}</textarea>
    <div class="btnrow"><button type="button" class="gold-btn" id="trf_go" data-k="${E107(k)}">${E107(t('tr_send'))}</button></div><p class="fine" id="trf_st" role="status"></p>`;
  o.hidden = false; document.body.classList.add('cp-lock'); TRF.now = now;
  setTimeout(() => { const i = $('#trf_in'); if (i){ i.focus(); i.select(); } }, 50);
}
function trClose(){ const o = $('#trf'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
document.addEventListener('click', async e => {
  const o = $('#trf'); if (!o || o.hidden || !e.target.closest) return;
  if (e.target === o || e.target.closest('#trf_x')) return trClose();
  const g = e.target.closest('#trf_go'); if (!g) return;
  const sug = String(($('#trf_in') || {}).value || '').trim(), st = $('#trf_st');
  if (!sug || sug === TRF.now){ if (st) st.textContent = t('tr_same'); return; }
  const clean = s => (typeof fbClean === 'function' ? fbClean(s) : s).slice(0, 400);
  const it = {k: 'tr', r: 0, m: clean('[' + lang + '] ' + g.dataset.k + '\n«' + TRF.now + '»\n→ «' + sug + '»'), v: APP_VER, l: lang, s: tab === 'settings' ? '' : tab, at: Date.now()};
  try {
    if (typeof FB !== 'undefined' && FB.db && FB.uid){
      let mine = []; try { const d = await FB.db.doc('feedback/' + FB.uid).get(); if (d && d.exists) mine = (d.data() || {}).items || []; } catch (er) {}
      mine = mine.concat(it).slice(-20); const ref = FB.db.doc('feedback/' + FB.uid);
      try { await ref.update({items: mine, at: Date.now()}); } catch (er) { await ref.set({items: mine, at: Date.now()}); }
    } else await ibSendWeb(it);
    trClose(); toast(t('tr_sent'));
  } catch (er) { if (st) st.textContent = t('fb_fail'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ const o = $('#trf'); if (o && !o.hidden){ e.preventDefault(); trClose(); } } });

/* ---------- settings changes take effect at once ---------- */
document.addEventListener('change', e => {
  const id = e.target && e.target.id; if (!id) return;
  if (['set_words', 'set_tts', 'set_dfmt', 'set_wkStart'].includes(id)) setTimeout(() => { try { if (tab === 'home') renderMarket(); else calc(tab); } catch (er) {} }, 0);
  if (['set_enTerms', 'set_plain', 'set_voiceIn'].includes(id)) setTimeout(() => { try { lxDecorate(); } catch (er) {} }, 0);
  if (id === 'set_voiceIn' && e.target.value === '1' && !SR_OK) setTimeout(() => toast(t('voice_na')), 0);
});
try { lxDecorate(); } catch (e) {}
