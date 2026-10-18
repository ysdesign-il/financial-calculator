/* ---------- 13.4: payslip check — scan a payslip (or type its numbers) and check it against the salary calculator ----------
   The photo goes to the AI only to read the numbers and is never kept; only the numbers are saved, on this device. */
const SL_F = [
  ['month', 'sl_fMonth', 'txt'],
  ['base', 'sl_fBase'], ['gross', 'sl_fGross'], ['benefits', 'sl_fBen'],
  ['tax', 'sl_fTax'], ['ni', 'sl_fNi'], ['health', 'sl_fHealth'], ['pens', 'sl_fPens'], ['study', 'sl_fStudy'], ['other', 'sl_fOther'],
  ['net', 'sl_fNet'], ['pts', 'sl_fPts', 'n'],
  ['erPens', 'sl_fErPens'], ['erSev', 'sl_fErSev'], ['erStudy', 'sl_fErStudy'], ['vacBal', 'sl_fVac', 'd'], ['sickBal', 'sl_fSick', 'd']
];
const SL_MAIN = ['month', 'base', 'gross', 'benefits', 'tax', 'ni', 'health', 'pens', 'study', 'other', 'net', 'pts'];
var SLX = {imgs: [], busy: false, res: null, open: false};
const slE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const slN = x => { if (x == null || x === '') return NaN; const n = typeof x === 'number' ? x : parseFloat(String(x).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : NaN; };
const slD = x => N(x, Math.abs(x - Math.round(x)) < 0.005 ? 0 : Math.abs(x * 10 - Math.round(x * 10)) < 0.05 ? 1 : 2);
const slV = (d, k) => { const n = slN(d[k]); return isFinite(n) ? n : 0; };
function slData(){ if (!SET.slip || typeof SET.slip !== 'object') SET.slip = {}; return SET.slip; }
function slHist(){ if (!Array.isArray(SET.slips)) SET.slips = []; return SET.slips; }
function slEngine(){
  try { if (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) return typeof PH === 'object' && PH && PH.ok ? 'claude' : '';
    return typeof gemKey === 'function' && gemKey() ? 'gemini' : ''; } catch (e) { return ''; }
}
function slFieldHTML([k, l, kind]){
  const d = slData(), val = d[k] == null ? '' : d[k];
  const inp = kind === 'txt'
    ? `<input id="sl_${k}" data-slk="${k}" type="text" maxlength="20" dir="auto" value="${slE(val)}" placeholder="09/2026">`
    : `<input id="sl_${k}" data-slk="${k}" type="number" inputmode="decimal" step="any" value="${slE(val)}" placeholder="0">${kind ? (kind === 'd' ? `<span class="unit">${slE(t('sl_days'))}</span>` : '') : unitHTML('ils')}`;
  return `<div class="field"><label for="sl_${k}">${slE(t(l))}</label><div class="control">${inp}</div></div>`;
}
function slBoxHTML(){
  const eng = slEngine(), inClaude = typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE;
  const ai = eng ? `<div class="btnrow"><button type="button" class="gold-btn" id="sl_cam">📷 ${slE(t('sl_cam'))}</button><button type="button" class="btn" id="sl_pick">🖼️ ${slE(t('sl_pick'))}</button>
      <input type="file" accept="image/*" data-slfile hidden><input type="file" accept="image/*" capture="environment" data-slfile data-cam hidden></div>
      <p class="fine sl-priv">🔒 ${slE(t('sl_priv'))}</p><div class="sl-st" id="sl_st" aria-live="polite"></div>`
    : `<div class="gk-st new">${slE(t(inClaude ? 'sl_noAiC' : gkNo('sl_noAi')))}</div>${inClaude || !(typeof gkAllowed === 'function' && gkAllowed()) ? '' : `<div class="btnrow"><button type="button" class="btn" data-gkgo="1">✦ ${slE(t('xs_connect'))}</button></div>`}`;
  const H = slHist();
  return `<summary>📄 ${slE(t('sl_t'))}</summary><div class="sl-in">
    <p class="fine">${slE(t('sl_h'))}</p>${ai}<p class="fine">${slE(t('sl_manual'))}</p>
    <h4 class="sl-h">${slE(t('sl_numbers'))}</h4>
    <div class="fields sl-grid">${SL_F.filter(f => SL_MAIN.includes(f[0])).map(slFieldHTML).join('')}</div>
    <details class="sl-more"${slData()._more ? ' open' : ''}><summary>${slE(t('sl_more'))}</summary><div class="fields sl-grid">${SL_F.filter(f => !SL_MAIN.includes(f[0])).map(slFieldHTML).join('')}</div></details>
    <div class="btnrow"><button type="button" class="gold-btn" id="sl_go">✓ ${slE(t('sl_go'))}</button><button type="button" class="mv" id="sl_clr">${slE(t('sl_clear'))}</button></div>
    <div id="sl_out" aria-live="polite">${SLX.res ? slResHTML(SLX.res) : ''}</div>
    ${H.length ? `<p class="fine">${slE(t('sl_saved', {n: H.length}))} <button type="button" class="lg-a" id="sl_hdel">${slE(t('sl_hDel'))}</button></p>` : ''}
  </div>`;
}
function slMount(){
  const p = $('#panel-salary'); if (!p) return;
  const inp = p.querySelector('.inputs'); if (!inp) return;
  let b = $('#sl_box'); const sig = document.documentElement.lang + '|' + slEngine() + '|' + slHist().length;
  if (b && b.dataset.sig === sig) return;
  const open = b ? b.open : SLX.open;
  if (!b){ b = document.createElement('details'); b.id = 'sl_box'; b.className = 'adv sl-box';
    inp.insertBefore(b, inp.firstChild);
    b.addEventListener('input', e => { e.stopPropagation(); const el = e.target; if (el.dataset && el.dataset.slk){ slData()[el.dataset.slk] = el.value; saveSet(); } });
    b.addEventListener('change', e => { e.stopPropagation(); if (e.target.hasAttribute && e.target.hasAttribute('data-slfile')){ slAdd(e.target.files); e.target.value = ''; } });
    b.addEventListener('toggle', e => { if (e.target === b) SLX.open = b.open; else if (e.target.classList && e.target.classList.contains('sl-more')){ slData()._more = e.target.open; saveSet(); } }, true);
  }
  b.innerHTML = slBoxHTML(); b.dataset.sig = sig; b.open = !!open;
}
function slRead(){ const d = slData(); $$('#sl_box [data-slk]').forEach(el => { d[el.dataset.slk] = el.value; }); return d; }

/* ---------- the check ---------- */
function slCheck(d){
  const R = [], g = slV(d, 'gross'), base = slV(d, 'base') || g, ben = slV(d, 'benefits');
  const tax = slV(d, 'tax'), ni = slV(d, 'ni'), health = slV(d, 'health'), pens = slV(d, 'pens'), study = slV(d, 'study'), other = slV(d, 'other'), net = slV(d, 'net');
  const add = (k, title, txt) => R.push({k, title, txt});
  const M = x => MI(Math.abs(x));
  if (!(g > 0)){ add('warn', t('sl_cNoGross'), t('sl_cNoGrossT')); return {rows: R, issues: 1}; }
  /* 1. the slip's own arithmetic */
  if (net > 0){
    const exp = g - tax - ni - health - pens - study - other, diff = net - exp;
    if (Math.abs(diff) <= 2) add('ok', t('sl_cSum'), t('sl_cSumOk', {g: MI(g), n: MI(net)}));
    else add('warn', t('sl_cSum'), t('sl_cSumBad', {e: MI(exp), n: MI(net), x: M(diff)}));
  }
  /* 2. income tax and National Insurance, worked out by the salary calculator */
  let ptsSlip = slN(d.pts), ptsMe = NaN;
  try { if ($('#s_sex')) ptsMe = pointsOf('s'); } catch (e) {}
  const pts = isFinite(ptsSlip) && ptsSlip > 0 ? ptsSlip : isFinite(ptsMe) ? ptsMe : 2.25;
  const o = {bonus: 0, benefit: ben, cash: 0, extra: Math.max(0, g - base), otherDed: 0, don: 0, locRate: 0, locCap: 0, second: false, age: 'reg', union: 0, lifeIns: 0, coord: 0,
    erPens: base > 0 ? slV(d, 'erPens') / base * 100 : 0, erSev: base > 0 ? slV(d, 'erSev') / base * 100 : 0, erStudy: base > 0 ? slV(d, 'erStudy') / base * 100 : 0};
  let r = null;
  try { r = salaryCalc(base, pts, base > 0 ? pens / base * 100 : 0, base > 0 ? study / base * 100 : 0, o); } catch (e) {}
  if (r){
    const dt = tax - r.tax, tol = Math.max(40, r.tax * 0.06);
    const ptsNote = isFinite(ptsSlip) && ptsSlip > 0 ? '' : ' ' + t('sl_cPtsAssumed', {p: slD(pts)});
    if (Math.abs(dt) <= tol) add('ok', t('sl_cTax'), t('sl_cTaxOk', {a: MI(tax), b: MI(r.tax)}) + ptsNote);
    else if (dt > 0) add('warn', t('sl_cTax'), t('sl_cTaxHi', {a: MI(tax), b: MI(r.tax), x: M(dt)}) + ptsNote);
    else add('info', t('sl_cTax'), t('sl_cTaxLo', {a: MI(tax), b: MI(r.tax), x: M(dt)}) + ptsNote);
    const sn = ni + health, en = r.ni + r.health, dn = sn - en;
    if (sn > 0 || en > 0){
      if (Math.abs(dn) <= Math.max(15, en * 0.04)) add('ok', t('sl_cNi'), t('sl_cNiOk', {a: MI(sn), b: MI(en)}));
      else add('warn', t('sl_cNi'), t('sl_cNiBad', {a: MI(sn), b: MI(en), x: M(dn)}));
    }
  }
  /* 3. credit points against your details in the salary calculator */
  if (isFinite(ptsSlip) && ptsSlip > 0 && isFinite(ptsMe)){
    if (ptsSlip < ptsMe - 0.01) add('warn', t('sl_cPts'), t('sl_cPtsLow', {a: slD(ptsSlip), b: slD(ptsMe), x: MI((ptsMe - ptsSlip) * TAX.point / 12)}));
    else if (ptsSlip > ptsMe + 0.01) add('info', t('sl_cPts'), t('sl_cPtsHi', {a: slD(ptsSlip), b: slD(ptsMe)}));
    else add('ok', t('sl_cPts'), t('sl_cPtsOk', {a: slD(ptsSlip)}));
  } else if (!(ptsSlip > 0)) add('info', t('sl_cPts'), t('sl_cPtsNone'));
  /* 4. pension: the law's minimum is 6% from you, 6.5% from the employer and 6% for severance */
  const erP = slV(d, 'erPens'), erS = slV(d, 'erSev'), pc = x => slD(base > 0 ? x / base * 100 : 0) + '%';
  if (pens <= 0 && erP <= 0) add('warn', t('sl_cPens'), t('sl_cPensNone'));
  else {
    const low = [];
    if (pens > 0 && pens / base < 0.0595) low.push(t('sl_cPensYou', {p: pc(pens)}));
    if (erP > 0 && erP / base < 0.0645) low.push(t('sl_cPensEr', {p: pc(erP)}));
    if (erS > 0 && erS / base < 0.0595) low.push(t('sl_cPensSev', {p: pc(erS)}));
    if (low.length) add('warn', t('sl_cPens'), t('sl_cPensLow', {l: low.join(', ')}));
    else add('ok', t('sl_cPens'), t('sl_cPensOk', {a: pc(pens), b: erP > 0 ? pc(erP) : '—', c: erS > 0 ? pc(erS) : '—'}));
    if (erP > 0 && !(erS > 0)) add('info', t('sl_cPens'), t('sl_cSevMiss'));
  }
  /* 5. minimum wage */
  if (typeof IL26 === 'object' && base > 0 && base < IL26.minWage - 1) add('info', t('sl_cMin'), t('sl_cMinT', {m: MI(IL26.minWage, 2), h: MI(IL26.minHour, 2)}));
  /* 6. balances */
  const vb = slN(d.vacBal), sb = slN(d.sickBal);
  if ((isFinite(vb) && vb < 0) || (isFinite(sb) && sb < 0)) add('warn', t('sl_cBal'), t('sl_cBalNeg'));
  else if (isFinite(vb) || isFinite(sb)) add('ok', t('sl_cBal'), t('sl_cBalOk', {v: isFinite(vb) ? slD(vb) : '—', s: isFinite(sb) ? slD(sb) : '—'}));
  /* 7. against the previous payslip you checked */
  const key = String(d.month || '').trim(), prev = slHist().filter(h => h.month && h.month !== key).slice(-1)[0];
  if (prev){
    const sg = x => (x > 0 ? '+' : x < 0 ? '−' : '') + MI(Math.abs(x));
    add('info', t('sl_cPrev', {m: prev.month}), t('sl_cPrevT', {g: sg(g - prev.gross), n: sg(net - prev.net), x: sg(tax - prev.tax)}));
  }
  return {rows: R, issues: R.filter(x => x.k === 'warn').length, r};
}
function slResHTML(res){
  const ic = {ok: '✅', warn: '⚠️', info: 'ℹ️'};
  return `<div class="mx-card sl-res"><div class="sl-sum ${res.issues ? 'bad' : 'good'}">${slE(res.issues ? (res.issues === 1 ? t('sl_sumBad1') : t('sl_sumBad', {n: res.issues})) : t('sl_sumOk'))}</div>
    <ul class="sl-list">${res.rows.map(x => `<li class="sl-${x.k}"><span class="sl-ic" aria-hidden="true">${ic[x.k]}</span><div><b>${slE(x.title)}</b><p>${slE(x.txt)}</p></div></li>`).join('')}</ul>
    ${res.notes ? `<p class="fine"><b>${slE(t('sl_aiNote'))}:</b> <span dir="auto">${slE(res.notes)}</span></p>` : ''}
    <div class="btnrow"><button type="button" class="btn" id="sl_fill">➡️ ${slE(t('sl_fill'))}</button></div>
    <p class="fine">${slE(t('sl_disc'))}</p></div>`;
}
function slRun(notes){
  const d = slRead(); saveSet();
  const res = slCheck(d); res.notes = notes || '';
  SLX.res = res;
  /* keep the numbers (only) for comparing with next month */
  const key = String(d.month || '').trim();
  if (key && slV(d, 'gross') > 0){
    const H = slHist(), e = {month: key.slice(0, 20), gross: slV(d, 'gross'), net: slV(d, 'net'), tax: slV(d, 'tax'), at: Date.now()};
    const i = H.findIndex(h => h.month === e.month); if (i >= 0) H.splice(i, 1);
    H.push(e); while (H.length > 24) H.shift(); saveSet();
  }
  slMount(); const o = $('#sl_out'); if (o){ o.innerHTML = slResHTML(res); o.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
}

/* ---------- reading the photo ---------- */
async function slAdd(files){
  const f = Array.from(files || []).find(x => /^image\//.test(x.type)); if (!f || SLX.busy) return;
  const eng = slEngine(); if (!eng) return;
  const st = () => $('#sl_st'), say = (k, cls) => { const s = st(); if (s){ s.textContent = t(k); s.className = 'sl-st ' + (cls || ''); } };
  SLX.busy = true; say('sl_reading');
  const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[typeof lang === 'string' && ['he', 'ar', 'en'].includes(lang) ? lang : 'en'];
  const prompt = `This image is an Israeli payslip (תלוש שכר) for one month. Read its numbers. Return ONLY JSON:
{"month":"the pay month as MM/YYYY","base":basic salary (שכר יסוד / משכורת בסיס),"gross":total gross payments in money (סה"כ תשלומים / ברוטו), without non-cash benefit values,"benefits":total non-cash taxable values (זקיפות / שווי: car, phone, gifts, employer deposits above the cap) or 0,"tax":income tax (מס הכנסה),"ni":National Insurance (ביטוח לאומי) – if it is shown together with health tax put the total here and 0 in health,"health":health tax (מס בריאות),"pension":the employee's pension or provident deduction (תגמולי עובד / פנסיה עובד),"study":the employee's study fund deduction (קרן השתלמות עובד),"other":the total of all other deductions (union, loans, advances, meals and so on),"net":net to pay (נטו לתשלום),"points":tax credit points (נקודות זיכוי),"erPension":the employer's pension contribution (תגמולי מעביד),"erSeverance":the employer's severance contribution (פיצויים),"erStudy":the employer's study fund contribution,"vacationBalance":vacation days balance (יתרת חופשה),"sickBalance":sick days balance (יתרת מחלה),"notes":"a short note in ${UL} on anything unreadable or unusual, else empty"}
Numbers only, without currency signs or thousands separators. A value that is not on the payslip → null.
Do NOT return names, ID numbers, employee numbers, addresses, bank details or any other personal identifier.`;
  try {
    const blob = typeof phShrink === 'function' ? await phShrink(f) : f;
    let j = null;
    if (eng === 'claude'){
      try { j = await PH.s.json(prompt, {images: [blob], cache: false, modelTier: 'default'}); }
      catch (e){ if (e && e.code === 'not_granted') throw e; const r = await PH.s(prompt, {images: [blob], cache: false, modelTier: 'default'}); j = slJSON(r && r.text); }
    } else {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
      const txt = await gemTry([SET.gmodel].concat(GEM_FALLBACK), gemKey(), [{role: 'user', parts: [{text: prompt}, {inline_data: {mime_type: 'image/jpeg', data: b64}}]}], {generationConfig: {responseMimeType: 'application/json', temperature: 0}});
      j = slJSON(txt);
    }
    if (!j || typeof j !== 'object') throw new Error('fmt');
    const map = {month: 'month', base: 'base', gross: 'gross', benefits: 'benefits', tax: 'tax', ni: 'ni', health: 'health', pension: 'pens', study: 'study', other: 'other', net: 'net', points: 'points',
      erPension: 'erPens', erSeverance: 'erSev', erStudy: 'erStudy', vacationBalance: 'vacBal', sickBalance: 'sickBal'};
    const d = slData(); Object.keys(d).forEach(k => { if (k !== '_more') delete d[k]; });
    Object.keys(map).forEach(k => { const to = map[k] === 'points' ? 'pts' : map[k], v = j[k];
      if (to === 'month') d.month = v == null ? '' : String(v).replace(/[^\d/.\-א-תء-يA-Za-z ]/g, '').trim().slice(0, 20);
      else { const n = slN(v); d[to] = isFinite(n) ? String(Math.round(n * 100) / 100) : ''; } });
    if (['erPens', 'erSev', 'erStudy', 'vacBal', 'sickBal'].some(k => d[k] !== '')) d._more = true;
    saveSet(); SLX.busy = false;
    const bx = $('#sl_box'); if (bx){ bx.dataset.sig = ''; slMount(); }      // show the numbers that were read before checking them
    slRun(String(j.notes || '').slice(0, 400));
    toast(t('sl_done'));
  } catch (er){ SLX.busy = false; say(er && er.code === 'not_granted' ? 'ph_denied' : 'sl_fail', 'bad'); }
}
const slJSON = s => { const m = /\{[\s\S]*\}/.exec(String(s || '')); try { return m ? JSON.parse(m[0]) : null; } catch (e) { return null; } };

/* ---------- send the numbers to the salary calculator ---------- */
function slFill(){
  const d = slRead(), g = slV(d, 'gross'), base = slV(d, 'base') || g; if (!(base > 0)) return;
  const pct = x => String(Math.round(x / base * 10000) / 100);
  const set = (id, val) => { const el = $('#' + id); if (el) el.value = val; };
  set('s_per', 'm'); set('s_mode', 'g2n'); set('s_payType', 'month');
  set('s_amount', String(base)); set('s_extra', String(Math.max(0, Math.round((g - base) * 100) / 100))); set('s_benefit', String(slV(d, 'benefits')));
  set('s_pension', pct(slV(d, 'pens'))); set('s_study', pct(slV(d, 'study')));
  set('s_erPens', pct(slV(d, 'erPens'))); set('s_erSev', pct(slV(d, 'erSev'))); set('s_erStudy', pct(slV(d, 'erStudy')));
  const a = $('#s_amount'); if (a) a.dispatchEvent(new Event('change', {bubbles: true}));
  try { calc('salary'); } catch (e) {}
  toast(t('sl_filled'));
  const h = $('#hero-salary'); if (h) h.scrollIntoView({block: 'start', behavior: 'smooth'});
}

document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#sl_box')) return;
  if (t0.closest('#sl_cam')){ const i = $('#sl_box input[data-slfile][data-cam]'); if (i) i.click(); return; }
  if (t0.closest('#sl_pick')){ const i = $('#sl_box input[data-slfile]:not([data-cam])'); if (i) i.click(); return; }
  if (t0.closest('#sl_go')){ slRun(SLX.res && SLX.res.notes); return; }
  if (t0.closest('#sl_fill')){ slFill(); return; }
  if (t0.closest('#sl_clr')){ const d = slData(); Object.keys(d).forEach(k => { if (k !== '_more') delete d[k]; }); SLX.res = null; saveSet(); const b = $('#sl_box'); if (b) b.dataset.sig = ''; slMount(); return; }
  if (t0.closest('#sl_hdel')){ if (!confirm(t('sl_hDelQ'))) return; SET.slips = []; saveSet(); slMount(); toast(t('sl_hDone')); return; }
});
{
  const actSl = activate; activate = function(id){ const r = actSl.apply(this, arguments); if (id === 'salary') setTimeout(() => { try { slMount(); } catch (e) {} }, 40); return r; };
  const alSl = applyLang; applyLang = function(){ const r = alSl.apply(this, arguments); try { const b = $('#sl_box'); if (b) b.dataset.sig = ''; slMount(); } catch (e) {} return r; };
  if (typeof phRenderAll === 'function'){ const phSl = phRenderAll; phRenderAll = function(){ const r = phSl.apply(this, arguments); try { slMount(); } catch (e) {} return r; }; }
  try { slMount(); } catch (e) {}
  setTimeout(() => { try { slMount(); } catch (e) {} }, 1300);
}

