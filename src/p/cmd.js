/* ---------- 13.22: say it in one sentence – commands in the search box ----------
   "תדלקתי ב-320" → an expense; "תזכיר לי ביטוח רכב ב-15/11" → a reminder; "כמה נטו על 18000" → the salary calculator.
   Understood on the phone with simple rules (Hebrew, Arabic, English); nothing is sent. */
const cmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const CM_NUM = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(אלף|k|K|الف|ألف|מיליון|million|m\b|M\b|مليون)?/;
const cmAmt = m => { let v = parseFloat(String(m[1]).replace(/,/g, '')); if (m[2]) v *= /מיליון|million|m|M|مليون/.test(m[2]) && !/^k$/i.test(m[2]) ? 1e6 : 1000; return v; };
function cmDate(q){
  const now = new Date(), iso = d => d.toISOString().slice(0, 10); let m;
  if (/מחרתיים|after tomorrow|بعد غد/i.test(q)) return iso(new Date(now.getTime() + 2 * 864e5));
  if (/מחר|tomorrow|غدا|غدًا/i.test(q)) return iso(new Date(now.getTime() + 864e5));
  if ((m = /(?:בעוד|in|بعد)\s*(\d{1,3})\s*(ימים|יום|days?|أيام|يوم)/i.exec(q))) return iso(new Date(now.getTime() + +m[1] * 864e5));
  if ((m = /(?:בעוד|in|بعد)\s*(\d{1,2})?\s*(שבועות|שבוע|weeks?|أسابيع|أسبوع)/i.exec(q))) return iso(new Date(now.getTime() + (+m[1] || 1) * 7 * 864e5));
  if ((m = /(?:בעוד|in|بعد)\s*(\d{1,2})?\s*(חודשים|חודש|months?|أشهر|شهر)/i.exec(q))){ const d = new Date(now); d.setMonth(d.getMonth() + (+m[1] || 1)); return iso(d); }
  if ((m = /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/.exec(q))){ let y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : now.getFullYear(); const d = new Date(y, +m[2] - 1, +m[1]); if (!m[3] && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d.setFullYear(y + 1); return isNaN(d) ? '' : rmIso(d); }
  return '';
}
const CM_SKIP = new Set(['ב', 'ב-', 'ב־', 'על', 'של', 'ל', 'ל-', 'ל־', 'עבור', 'of', 'for', 'on', 'in', 'at', 'to', 'بـ', 'ب', 'على', 'في', 'لـ']);
/* "בשופרסל" → "שופרסל", "לחשמל" → "חשמל" – a Hebrew prefix comes off only when what's left is a known store or bill */
function cmClean(s){ return s.split(/\s+/).filter(w => w && !CM_SKIP.has(w)).map(w => { const st = w.replace(/^[בלו][-־]?/, ''); if (st !== w && st.length >= 3 && X2_KW.some(([rx]) => { const m = rx.exec(st); return m && m.index === 0; })) return st; return w; }).join(' '); }
function cmParse(q){
  q = String(q || '').trim(); if (q.length < 3) return null; let m;
  /* a reminder */
  if ((m = /^(?:תזכיר(?:י)? לי|תזכורת|להזכיר לי|remind me(?: to)?|reminder|ذكرني|ذكّرني|تذكير)\s+(.+)$/i.exec(q))){
    const date = cmDate(m[1]), title = m[1].replace(/(?:ב|ב-|ב־|on|في)?\s*\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?/g, '').replace(/מחרתיים|מחר|tomorrow|غدًا|غدا|(?:בעוד|in|بعد)\s*\d*\s*(ימים|יום|days?|שבועות|שבוע|weeks?|חודשים|חודש|months?|أيام|يوم|أسابيع|أسبوع|أشهر|شهر)/gi, '').replace(/\s+/g, ' ').trim();
    if (title) return {k: 'rem', title: title.slice(0, 80), date, ic: '⏰', h: t('cm_rem', {t: title, d: date ? rmFmt(date) : t('cm_pickDate')})};
  }
  /* the salary calculator */
  if ((m = /(?:כמה נטו|נטו|ברוטו|משכורת|שכר|net|gross|salary|راتب|صافي)\D{0,12}/i.exec(q)) && (m = CM_NUM.exec(q))){ const v = cmAmt(m); if (v >= 1000 && v < 1e6) return {k: 'calc', id: 'salary', set: {s_amount: v}, ic: '💼', h: t('cm_sal', {m: M(v, 0, 'ILS')})}; }
  if (/משכנת|mortgage|رهن/i.test(q) && (m = CM_NUM.exec(q))){ const v = cmAmt(m); if (v >= 10000) return {k: 'calc', id: 'mortgage', set: {m_price: v}, ic: '🏠', h: t('cm_mort', {m: M(v, 0, 'ILS')})}; }
  if (/הלוואה|loan|قرض/i.test(q) && (m = CM_NUM.exec(q))){ const v = cmAmt(m); if (v >= 500) return {k: 'calc', id: 'loan', set: {l_amount: v}, ic: '💳', h: t('cm_loan', {m: M(v, 0, 'ILS')})}; }
  if ((m = /(?:המר|תמיר|להמיר|convert|حوّل|حول)\s*(\d[\d,.]*)\s*(דולר|יורו|ליש"ט|פאונד|usd|eur|gbp|\$|€|£|دولار|يورو)?/i.exec(q))){ const v = parseFloat(m[1].replace(/,/g, '')), c = (m[2] || '').toLowerCase(), cur = /יורו|eur|€|يورو/.test(c) ? 'EUR' : /ליש|פאונד|gbp|£/.test(c) ? 'GBP' : 'USD'; return {k: 'calc', id: 'convert', set: {x_amount: v, x_from: cur, x_to: 'ILS'}, ic: '💱', h: t('cm_conv', {v: N(v, 0), c: cur})}; }
  /* an expense: a verb or a store, and an amount */
  const verb = /(קניתי|שילמתי|הוצאתי|הוצאה|תדלקתי|תדלוק|spent|paid|bought|expense|fuel|دفعت|اشتريت|مصروف)/i, n = CM_NUM.exec(q);
  if (n && (verb.test(q) || /₪|ש"ח|שקל|nis|ils/i.test(q))){
    const amt = cmAmt(n); if (!(amt > 0 && amt < 1e6)) return null;
    const fuel = /תדלק|דלק|fuel|petrol|وقود|بنزين/i.test(q);
    let note = cmClean(q.replace(n[0], ' ').replace(verb, ' ').replace(/₪|ש"ח|שקלים|שקל|nis|ils/gi, ' ').replace(/\s+/g, ' ').trim());
    if (fuel && (!note || /^(דלק|fuel|petrol|وقود|بنزين)$/i.test(note))) note = t('cm_fuel');
    const cat = fuel ? 'car' : x2Guess(note), date = cmDate(q.replace(n[0], ''));
    return {k: 'exp', amt, note: note.slice(0, 80), cat, date: date && date <= todayIso() ? date : todayIso(), ic: '🧾', h: t('cm_exp', {m: M(amt, 0, 'ILS'), n: note || t('ec_' + cat), c: t('ec_' + cat)})};
  }
  return null;
}
function cmRun(c){
  if (c.k === 'rem'){ rmNew({title: c.title, date: c.date || undefined, cat: 'other', before: 1}); return; }
  if (c.k === 'calc'){ activate(c.id); setTimeout(() => { try { setVals(Object.fromEntries(Object.entries(c.set).map(([k, v]) => [k, String(v)]))); Object.keys(c.set).forEach(k => { const e = $('#' + k); if (e){ e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); } }); calc(c.id); } catch (e) {} }, 60); return; }
  if (c.k === 'exp'){
    const d = expData(); d.items.push({id: tId(), t: Date.now(), amt: c.amt, bc: 'ILS', oamt: c.amt, cur: 'ILS', cat: c.cat, date: c.date, note: c.note, pay: (d.last && d.last.pay) || 'card', cc: 'IL', city: '', rec: false});
    toolsSave('fin-exp', d); try { if (c.note) x2Learn(c.note, c.cat); } catch (e) {}
    EXP_M = c.date.slice(0, 7); activate('expenses'); toast(t('cm_added', {m: M(c.amt, 0, 'ILS')}));
  }
}
var CM_LAST = null;
{
  const gsR2 = gsRender;
  gsRender = function(){
    const r = gsR2.apply(this, arguments); const box = $('#gs_list'), q = ($('#gs_q') || {}).value || ''; CM_LAST = cmParse(q);
    if (box){
      if (CM_LAST) box.insertAdjacentHTML('afterbegin', `<div class="cp-h">${cmE(t('cm_h'))}</div><button type="button" class="gs-it gs-cmd" role="option" data-n="-1"><span class="gs-ic" aria-hidden="true">${CM_LAST.ic}</span><span class="gs-tx"><b>${cmE(CM_LAST.h)}</b><small>${cmE(t('cm_sub'))}</small></span></button>`);
      else if (!q.trim()) box.insertAdjacentHTML('beforeend', `<p class="gs-tip">💬 ${cmE(t('cm_tip'))}</p>`);
    }
    return r;
  };
  const gsG2 = gsGo;
  gsGo = function(n){ if (n === -1 && CM_LAST){ const c = CM_LAST; $('#gsx').hidden = true; document.body.classList.remove('cp-lock'); cmRun(c); return; } return gsG2.apply(this, arguments); };
}
