/* ---------- 13.22: rights and tax – what you are probably entitled to, and the year-end tax checklist ----------
   A few questions → a list of benefits with where to check each one in the app. The answers stay on the phone. */
const rtE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var RTT = 'find';
function rtD(){ const d = SET.rt && typeof SET.rt === 'object' ? SET.rt : (SET.rt = {}); if (!d.a || typeof d.a !== 'object') d.a = {}; if (!d.done || typeof d.done !== 'object') d.done = {}; return d; }
/* the questions: [key, type] – ck = yes/no, num = a number */
const RT_Q = [['work', 'sel'], ['age', 'num'], ['woman', 'ck'], ['kids', 'num'], ['kidsSmall', 'num'], ['single', 'ck'], ['soldier', 'ck'], ['degree', 'ck'], ['oleh', 'ck'], ['disab', 'ck'], ['reserve', 'ck'], ['lowInc', 'ck'], ['jobs', 'ck'], ['gapYear', 'ck'], ['donate', 'ck'], ['privPens', 'ck'], ['rent', 'ck'], ['priority', 'ck'], ['retire', 'ck']];
const kz = q => 'https://www.kolzchut.org.il/w/index.php?search=' + encodeURIComponent(q);
/* the benefits: [key, when(a), app screen or '', kol-zchut search, value(a) in ILS a year or 0] */
const RT_LIST = [
  ['taxRefund', a => a.jobs || a.gapYear || a.donate || a.privPens || a.work === 'emp' && a.reserve, 'taxrefund', 'החזר מס', () => 0],
  ['soldier', a => a.soldier, 'tax', 'נקודות זיכוי לחיילים משוחררים', () => 2 * TAX.point],
  ['degree', a => a.degree, 'tax', 'נקודות זיכוי לבעלי תואר אקדמי', () => TAX.point],
  ['kidsPts', a => +a.kids > 0, 'tax', 'נקודות זיכוי בעד ילדים', () => 0],
  ['single', a => a.single && +a.kids > 0, 'tax', 'נקודות זיכוי להורה יחיד', () => TAX.point],
  ['oleh', a => a.oleh, 'tax', 'נקודות זיכוי לעולים חדשים', () => 0],
  ['childAllow', a => +a.kids > 0, 'childallow', 'קצבת ילדים', () => 0],
  ['kidSave', a => +a.kids > 0, 'kidsave', 'חיסכון לכל ילד', a => (+a.kids || 0) * (typeof IL26 === 'object' ? IL26.childDep : 58) * 12],
  ['workGrant', a => a.lowInc && (a.work === 'emp' || a.work === 'self') && (+a.kids > 0 || +a.age >= 55), 'workgrant', 'מענק עבודה', () => 0],
  ['unemp', a => a.work === 'none' && +a.age < 67, 'benefits', 'דמי אבטלה', () => 0],
  ['reserve', a => a.reserve, 'reserve', 'זכויות משרתי מילואים', () => 0],
  ['disab', a => a.disab, '', 'פטור ממס הכנסה לנכים', () => 0],
  ['arnona', a => a.disab || a.single || a.soldier && +a.age < 25 || a.oleh || +a.age >= 67 || a.lowInc || a.reserve, 'arnona', 'הנחה בארנונה', () => 0],
  ['oldAge', a => +a.age >= 62 || a.retire, 'oldage', 'קצבת אזרח ותיק', () => 0],
  ['pensFix', a => a.retire || +a.age >= 60, 'pensfix', 'קיבוע זכויות', () => 0],
  ['donate', a => a.donate, 'tax', 'זיכוי ממס על תרומות סעיף 46', () => 0],
  ['privPens', a => a.privPens, 'tax', 'זיכוי ממס על הפקדה לפנסיה עצמאית', () => 0],
  ['selfHish', a => a.work === 'self', 'hishtalmut', 'קרן השתלמות לעצמאים', () => 0],
  ['priority', a => a.priority, '', 'הטבות מס ליישובים מזכים', () => 0],
  ['rent', a => a.rent && a.lowInc, '', 'סיוע בשכר דירה', () => 0],
  ['woman', a => a.woman, 'salary', 'נקודות זיכוי לאישה', () => TAX.point / 2]
];
/* the year-end checklist: [key, deadline note] */
const RT_YEAR = ['r106', 'coord', 'donate', 'pens', 'hish', 'loss', 'kids', 'refund6', 'arnona', 'docs'];
function rtFind(v){
  const E = rtE, d = rtD(), a = d.a, q = ([k, ty]) => ty === 'ck' ? `<label class="prn-ck"><input type="checkbox" data-rtq="${k}"${a[k] ? ' checked' : ''}> ${E(t('rt_q_' + k))}</label>`
    : ty === 'num' ? `<label class="bk-f"><span>${E(t('rt_q_' + k))}</span><input type="text" inputmode="numeric" dir="ltr" data-rtq="${k}" value="${E(a[k] == null ? '' : a[k])}"></label>`
    : `<label class="bk-f"><span>${E(t('rt_q_' + k))}</span><select data-rtq="${k}">${['emp', 'self', 'both', 'student', 'none', 'ret'].map(o => `<option value="${o}"${(a[k] || 'emp') === o ? ' selected' : ''}>${E(t('rt_w_' + o))}</option>`).join('')}</select></label>`;
  v.innerHTML = `<p class="fine">${E(t('rt_intro'))}</p><div class="bk-grid">${RT_Q.filter(x => x[1] !== 'ck').map(q).join('')}</div><fieldset class="bk-flags"><legend>${E(t('rt_qH'))}</legend>${RT_Q.filter(x => x[1] === 'ck').map(q).join('')}</fieldset><div id="rt_out" aria-live="polite"></div>`;
  rtOut();
}
function rtOut(){
  const box = $('#rt_out'); if (!box) return; const E = rtE, a = Object.assign({work: 'emp'}, rtD().a), L = RT_LIST.filter(r => { try { return r[1](a); } catch (e) { return false; } });
  const tot = L.reduce((s, r) => s + (r[4](a) || 0), 0);
  box.innerHTML = L.length ? `${tot ? `<div class="bk-hero"><span>${E(t('rt_worth'))}</span><b dir="ltr">${E(M(tot, 0, 'ILS'))} / ${E(t('es_yr'))}</b><small>${E(t('rt_worthS', {n: L.length}))}</small></div>` : ''}
    <ol class="bk-adv">${L.map(r => { const val = r[4](a); return `<li class="bk-a"><span class="bk-ic" aria-hidden="true">✅</span><div><b>${E(t('rt_r_' + r[0]))}${val ? ' · ' + E(t('rt_about', {m: M(val, 0, 'ILS')})) : ''}</b><p>${E(t('rt_rp_' + r[0]))}</p><p class="rt-acts">${r[2] && TABS.includes(r[2]) ? `<button type="button" class="lg-a" data-go="${r[2]}">${E(t('in_open', {n: t('tab_' + r[2])}))}</button> · ` : ''}<a href="${kz(r[3])}" target="_blank" rel="noopener">${E(t('rt_kz'))}</a></p></div></li>`; }).join('')}</ol>
    <p class="fine">${E(t('rt_note'))}</p>` : `<p class="fine bk-empty">${E(t('rt_none'))}</p>`;
}
function rtYear(v){
  const E = rtE, d = rtD(), y = new Date().getFullYear(), left = Math.ceil((new Date(y, 11, 31) - new Date()) / 864e5), done = RT_YEAR.filter(k => d.done[y + ':' + k]).length;
  v.innerHTML = `<p class="fine">${E(t('rt_yIntro', {y}))}</p><div class="bk-hero"><span>${E(t('rt_yLeft'))}</span><b dir="ltr">${left}</b><small>${E(t('rt_yDone', {n: done, m: RT_YEAR.length}))}</small></div>
    <ul class="rm-list">${RT_YEAR.map(k => { const id = y + ':' + k, ck = !!d.done[id]; return `<li class="rm-it${ck ? ' done' : ''}"><label class="rt-yck"><input type="checkbox" data-rty="${id}"${ck ? ' checked' : ''}></label><div class="rm-b"><b>${E(t('rt_y_' + k, {y: y - 6}))}</b><small>${E(t('rt_yp_' + k, {y: y - 6}))}</small>
      <div class="rm-acts"><button type="button" class="mv" data-rtrem="${k}">⏰ ${E(t('rm_add'))}</button>${({r106: 'taxrefund', donate: 'tax', pens: 'tax', hish: 'hishtalmut', loss: 'capital', kids: 'tax', refund6: 'taxrefund', arnona: 'arnona'})[k] ? `<button type="button" class="mv" data-go="${({r106: 'taxrefund', donate: 'tax', pens: 'tax', hish: 'hishtalmut', loss: 'capital', kids: 'tax', refund6: 'taxrefund', arnona: 'arnona'})[k]}">↗ ${E(t('rt_check'))}</button>` : ''}</div></div></li>`; }).join('')}</ul>`;
}
function rtRender(){
  const root = $('#hr_rights'); if (!root) return; const E = rtE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['find', '🔎'], ['year', '📅']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${RTT === k ? ' on' : ''}" aria-selected="${RTT === k}" data-rttab="${k}">${ic} ${E(t('rt_t_' + k))}</button>`).join('')}</div><div id="rt_view"></div><p class="fine sl-priv">🔒 ${E(t('rt_priv'))}</p>`;
  (RTT === 'find' ? rtFind : rtYear)($('#rt_view'));
}
let RT_T = null;
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.dataset.rtq || el.type === 'checkbox' || el.tagName === 'SELECT') return; rtD().a[el.dataset.rtq] = el.value; clearTimeout(RT_T); RT_T = setTimeout(() => { saveSet(); rtOut(); }, 200); });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.dataset) return;
  if (el.dataset.rtq && (el.type === 'checkbox' || el.tagName === 'SELECT')){ rtD().a[el.dataset.rtq] = el.type === 'checkbox' ? el.checked : el.value; saveSet(); rtOut(); }
  if (el.dataset.rty){ const d = rtD(); if (el.checked) d.done[el.dataset.rty] = 1; else delete d.done[el.dataset.rty]; saveSet(); rtRender(); const n = $(`[data-rty="${el.dataset.rty}"]`); if (n) n.focus(); } });
document.addEventListener('click', e => { const t0 = e.target; if (!t0.closest || !t0.closest('#hr_rights')) return; let b;
  if ((b = t0.closest('[data-rttab]'))){ RTT = b.dataset.rttab; rtRender(); return; }
  if ((b = t0.closest('[data-rtrem]'))){ const y = new Date().getFullYear(), k = b.dataset.rtrem; rmNew({title: t('rt_y_' + k, {y: y - 6}), date: rmIso(new Date(y, 11, k === 'refund6' ? 15 : 10)), cat: 'tax', before: 7}); } });
CALC.rights = () => null;
try { GS_SYN.rights = 'זכויות מה מגיע לי הטבות נקודות זיכוי החזר מס מענק קצבה הנחה סוף שנה מס תרומות סעיף 46 תיאום מס 106 rights benefits entitlements tax credits year end checklist حقوق مستحقات نقاط ائتمان استرداد ضريبة'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindRt = svKind; svKind = function(id){ return id === 'rights' ? '' : svKindRt.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('rights'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('rights'); } catch (e) {}
{ const aiStRt = aiScreenText; aiScreenText = function(id){ const s = aiStRt.apply(this, arguments); if (id !== 'rights') return s; const o = $('#rt_out'); return s + '\nAnswers: ' + JSON.stringify(rtD().a) + '\nLikely benefits shown: ' + (o ? o.innerText.slice(0, 1200) : '') + '\nExplain in plain words what to do first. General information, not legal advice.'; }; }
{
  const actRt = activate; activate = function(id){ const r = actRt.apply(this, arguments); if (id === 'rights') rtRender(); return r; };
  const alRt = applyLang; applyLang = function(){ const r = alRt.apply(this, arguments); try { if (tab === 'rights') rtRender(); } catch (e) {} return r; };
  try { if (tab === 'rights') rtRender(); } catch (e) {}
}
