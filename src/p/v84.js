/* ================= 8.4: a real AI that knows the app, and the country of origin ================= */

/* ---------- 1. inside Claude the assistant is Claude itself (the real model), not the built-in keyword engine ---------- */
(async function aiReal(){
  if (!IN_CLAUDE) return;
  try {
    const s = await window.claude.use('sample'); if (!s) return;
    CAI.fn = (input, opts) => s(input, opts);
    try { const L = await s.limits(); CAI.tools = !!(L && L.tools); } catch (e) { CAI.tools = false; }
    aiInappMig();
    try { engRender(); } catch (e) {} try { aiEngSync(); } catch (e) {} try { aiFabSync(); } catch (e) {}
  } catch (e) {}
})();

/* ---------- 2. the AI knows the app: a guide to every part of it, the screen you are on, and your settings ---------- */
const APP_GUIDE = 'HOW THE APP WORKS (use this to answer questions about the app itself; describe the taps in the person\'s language and name buttons as they appear):\n' +
  '- Moving around: the bottom bar on a phone (the side menu on a computer). Home shows tiles for every calculator; the search box at the top finds any calculator or setting.\n' +
  '- Settings (gear): categories; inside a category every section is folded — tap its title to open it. "Display and language" holds: Look (14 designs: Default, ORBIT, AURUM, PULSE, AURORA, MONO, BLOCK, EMERALD, SUNSET, EDITION, PRISM, TITAN, ZEN, CLAY; color themes and holiday themes; holiday effects on/off; accent color; text size; contrast; motion; sliders), Clock and date, Language and region (interface language, display currency, country of origin), Numbers (digit style, decimals, currency sign position, thousands separator, grouping while typing).\n' +
  '- The palette button at the top opens designs and themes quickly. A color theme colors every design; "By device" keeps the design\'s own colors.\n' +
  '- Live data: currency and market rates update live (switch "Live updates" on Home; the "market data" option is in Settings → Calculations and profile → Calculation defaults). With live data off the app shows the previous trading day\'s closing rates with their date. The round arrow at the top refreshes everything.\n' +
  '- Saving: each screen has a bar with Automatic / Manual / None. The Saved folder (bookmark icon) keeps a file for every save, with Open, Download, Share and an immediate Delete, plus named scenarios and a recycle bin.\n' +
  '- On every calculator: "?" next to a field explains it, "Explain" explains the screen, the AI button at the top opens this assistant, the round arrow resets the screen, and Copy / Share / PDF share the results.\n' +
  '- Salary calculator: gross to net and back, credit points (your own point value can be set in Settings), pension and study fund, company car from the government price list (automatic or manual tax bracket), and the whole payslip: monthly or hourly pay, overtime 125%/150%, Shabbat, vacation, sick days by law, unpaid absence, holidays, reserve duty, mourning days, bonuses, expense refunds, advances and loans, and the vacation, sick-day and recuperation balances.\n' +
  '- Limits: year fields go up to 120 years and month fields up to 1440, so a huge number cannot freeze the app.\n' +
  '- Holiday themes come with effects (flags and fireworks on Independence Day, snow, lanterns, sparks); they can be turned off in Settings.\n' +
  '- Reset: the round arrow resets one screen; Settings → System → Data and reset resets the whole app. Settings → AI assistant holds the AI engine choice and (on the website) a free Gemini key for a real AI model.\n' +
  '- Privacy: the app never asks for ID, card or bank-account numbers and clears such input.\n' +
  'If something is not in this guide or on the screen, say you are not sure rather than guessing.';
function aiPersonCtx(){
  const out = [];
  if (SET.country) out.push('country of origin: ' + ctyName(SET.country, 'en'));
  out.push('display currency: ' + (baseCur || cur));
  out.push('design: ' + (SET.design || 'default') + ', theme: ' + (SET.theme || 'system'));
  out.push('live data: ' + (SET.mktLive === '0' || SET.liveFx === '0' ? 'off (closing rates)' : 'on'));
  return 'About this person\'s app: ' + out.join('; ') + '. Current screen: ' + t('tab_' + tab) + ' (' + tab + ').';
}
const _aiRules84 = aiRules;
aiRules = function(){ return _aiRules84.apply(this, arguments) + '\n\n' + APP_GUIDE + '\n' + aiPersonCtx(); };
const _asSys84 = asSystem;
asSystem = function(){ return _asSys84.apply(this, arguments) + '\n\n' + APP_GUIDE + '\n' + aiPersonCtx(); };

/* suggested questions about the app itself, next to the ones about the screen */
const AI_APPQ = ['ai_qDesign', 'ai_qSaved', 'ai_qLive', 'ai_qWhat', 'ai_qCountry', 'ai_qPdf'];
const _aiChip84 = aiChipKeys;
aiChipKeys = function(id){
  const base = _aiChip84.apply(this, arguments);
  const calc = base.length > 2;
  const extra = calc ? [AI_APPQ[(new Date().getMinutes()) % AI_APPQ.length]] : AI_APPQ.slice(0, 4);
  return base.concat(extra.filter(k => !base.includes(k)));
};
const _asChips84 = asChips;
asChips = function(){
  const r = _asChips84.apply(this, arguments), c = $('#as_chips'); if (!c) return r;
  c.insertAdjacentHTML('beforeend', ['ai_qWhat', 'ai_qDesign', 'ai_qSaved'].map(k => `<button type="button" class="as-chip as-chip-app" data-q="${k}">${asEsc(t(k))}</button>`).join(''));
  return r;
};

/* ---------- who answers: a real model right here in the app, when there is one ----------
   7.5 sent every free question out to another site (Perplexity, ChatGPT…) — nothing answered inside the app. Now, when a real
   model can answer here (Claude inside Claude; Gemini on the website with your free key), "answers here" is the choice,
   and the outside sites stay available in the list. */
const aiInappOk = () => (typeof claudeOk === 'function' && claudeOk()) || (!IN_CLAUDE && !!(typeof gemKey === 'function' && gemKey()));
const aiInappName = () => (typeof claudeOk === 'function' && claudeOk()) ? 'Claude' : 'Gemini';
const aiInappOn = () => aiInappOk() && SET.aiEngine === 'inapp';
function aiInappMig(){ if (!SET.aiMig84 && aiInappOk()){ SET.aiMig84 = 1; SET.aiEngine = 'inapp'; saveSet(); } }
try { aiInappMig(); } catch (e) {}
const _xaiOpts84 = xaiOpts;
xaiOpts = function(){
  const base = _xaiOpts84.apply(this, arguments);
  if (!aiInappOk()) return base;
  const on = SET.aiEngine === 'inapp';
  return `<option value="inapp"${on ? ' selected' : ''}>${asEsc(t('o_xInapp', {n: aiInappName()}))}</option>` + (on ? base.replace(/ selected/g, '') : base);
};
const _aiEng84 = aiEngSync;
aiEngSync = function(){
  const r = _aiEng84.apply(this, arguments);
  const n = $('#aix_note'); if (n && aiInappOn()) n.textContent = t('ai_noteInapp', {n: aiInappName()});
  return r;
};
const _engR84 = engRender;
engRender = function(){
  const r = _engR84.apply(this, arguments);
  const now = $('#as_engnow'); if (now && aiInappOn()) now.textContent = t('ai_noteInapp', {n: aiInappName()});
  return r;
};
/* 7.x pinned every answer to the built-in engine; with "answers here" the real model answers */
aiPick = function(){
  if (SET.aiEngine === 'inapp'){ if (claudeOk()) return 'claude'; if (!IN_CLAUDE && gemKey()) return 'gemini'; }
  return 'personal';
};
const _aiAsk84 = aiAsk;
aiAsk = async function(q, kind){
  if (aiInappOn()) return aiAskX.apply(this, arguments);              // the real model, here
  if (!kind && !AIX.fill && !AIX.busy){ const a = appHelp(q); if (a){ aiLog('user', String(q).trim()); aiLog('ai', a); return; } }
  return _aiAsk84.apply(this, arguments);
};
const _asAns84 = asAnswer;
asAnswer = async function(q){
  if (aiInappOn()) return asAnswerX.apply(this, arguments);
  const a = appHelp(q); if (a) return a;
  return _asAns84.apply(this, arguments);
};

/* without a connected model, questions about the app still get a real answer from this guide */
const APP_HELP = [
  [/עיצוב|ערכ(ת|ות) נושא|צבע|theme|design|colou?r|skin|تصميم|سمة|ألوان/i, 'ah_design'],
  [/שמור|שמירה|קבצ|saved|save|file|محفوظ|حفظ|ملف/i, 'ah_saved'],
  [/נתונים חיים|בזמן אמת|שער(י)? (ה)?סגירה|live data|real.?time|closing rate|بيانات مباشرة|سعر الإغلاق/i, 'ah_live'],
  [/שפה|מטבע|מדינ|language|currency|country|لغة|عملة|دولة|بلد/i, 'ah_lang'],
  [/פסיק|נקודה|מפריד|separator|comma|decimal|فاصل|فاصلة/i, 'ah_sep'],
  [/pdf|שית(ו|ף)|העתק|share|copy|export|مشاركة|نسخ/i, 'ah_pdf'],
  [/חג|אפקט|זיקוק|דגל|holiday|effect|firework|عيد|مؤثر/i, 'ah_hol'],
  [/מחק|איפוס|לנקות|delete|reset|clear|حذف|مسح|إعادة/i, 'ah_reset'],
  [/מה (אפשר|יש)|מה האפליקציה|what can|what does this app|ماذا يمكن|ما الذي/i, 'ah_what'],
  [/בינה|ai\b|מודל|claude|gemini|ذكاء|نموذج/i, 'ah_ai']
];
const APP_HOWTO = /איך|איפה|היכן|אפשר ל|כיצד|how|where|can i|كيف|أين|هل يمكن|מה (אפשר|יש)|what can|what does this app/i;
function appHelp(q){
  const s = String(q || ''); if (!APP_HOWTO.test(s)) return '';
  const hit = APP_HELP.find(([rx]) => rx.test(s));
  return hit ? t(hit[1]) : '';
}
const _aiLocal84 = aiLocal;
aiLocal = function(id, q){ const a = appHelp(q); if (a){ aiLog('ai', a); return; } return _aiLocal84.apply(this, arguments); };
const _pmSmart84 = pmSmart;
pmSmart = async function(q){ const a = appHelp(q); return a || _pmSmart84.apply(this, arguments); };

/* ---------- 3. country of origin (Settings → Language and region) ---------- */
const CTY_CUR = {IL: 'ILS', PS: 'ILS', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', CH: 'CHF', JP: 'JPY', CN: 'CNY', IN: 'INR', TR: 'TRY', EG: 'EGP', JO: 'JOD',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', MA: 'MAD', TN: 'TND', DZ: 'DZD', LB: 'LBP', IQ: 'IQD', RU: 'RUB', UA: 'UAH', BY: 'BYN', GE: 'GEL', AZ: 'AZN',
  AM: 'AMD', KZ: 'KZT', UZ: 'UZS', MD: 'MDL', PL: 'PLN', RO: 'RON', HU: 'HUF', CZ: 'CZK', BG: 'BGN', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK', ET: 'ETB', ZA: 'ZAR',
  NG: 'NGN', KE: 'KES', BR: 'BRL', AR: 'ARS', MX: 'MXN', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU', KR: 'KRW', TH: 'THB', PH: 'PHP', SG: 'SGD', HK: 'HKD', TW: 'TWD',
  ID: 'IDR', MY: 'MYR', VN: 'VND', PK: 'PKR', BD: 'BDT', RS: 'RSD'};
['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK'].forEach(c => { CTY_CUR[c] = 'EUR'; });
const ctyFlag = c => /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65)) : '';
const CTY_DN = {};
function ctyName(c, l){
  l = l || lang; try { const d = CTY_DN[l] || (CTY_DN[l] = new Intl.DisplayNames([l], {type: 'region'})); return d.of(c) || c; } catch (e) { return c; }
}
function ctyUi(){
  const s = $('#set_country'); if (!s) return;
  const val = SET.country || '';
  const opts = [...s.options].filter(o => o.value);
  const coll = (() => { try { return new Intl.Collator(lang); } catch (e) { return null; } })();
  opts.forEach(o => { o.textContent = ctyFlag(o.value) + ' ' + ctyName(o.value); });
  opts.sort((a, b) => coll ? coll.compare(ctyName(a.value), ctyName(b.value)) : 0);
  /* Israel first, then everyone in alphabetical order */
  const il = opts.findIndex(o => o.value === 'IL'); if (il > 0) opts.unshift(opts.splice(il, 1)[0]);
  opts.forEach(o => s.appendChild(o));
  if (s.options[0] && !s.options[0].value) s.options[0].textContent = t('o_cNone');
  s.value = val;
  ctyOffer();
}
function ctyOffer(){
  const s = $('#set_country'); if (!s) return;
  const f = s.closest('.field'); let box = $('#cty_offer'); if (!box && f){ box = document.createElement('p'); box.id = 'cty_offer'; box.className = 'fine cty-offer'; f.insertAdjacentElement('afterend', box); }
  if (!box) return;
  const c = SET.country, k = c && CTY_CUR[c], now = baseCur || cur;
  if (!k || k === now || !RATES[k]){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `${asEsc(t('cty_cur', {c: ctyName(c), k}))} <button type="button" class="mv" data-cty-cur="${k}">${asEsc(t('cty_use', {k}))}</button>`;
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'set_country') return;
  SET.country = e.target.value; saveSet(); ctyOffer();
});
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-cty-cur]'); if (!b) return;
  const k = b.dataset.ctyCur, s = $('#set_cur') || $('#cur');
  try { if (typeof setBase === 'function') setBase(k); else if (s){ s.value = k; s.dispatchEvent(new Event('change', {bubbles: true})); } } catch (er) {}
  const sc = $('#set_cur'); if (sc){ sc.value = k; }
  try { calc(tab); } catch (er) {}
  ctyOffer(); try { toast(t('cty_done', {k})); } catch (er) {}
});
const _alCty = applyLang;
applyLang = function(){ const r = _alCty.apply(this, arguments); try { ctyUi(); } catch (e) {} return r; };
try { if (SET.country == null) SET.country = ''; ctyUi(); } catch (e) {}
