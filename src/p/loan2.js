/* ---------- 13.75: the loan calculator – full or partial grace, a partial balloon, a table by month, other terms side by side,
   and a picker of 13 loan kinds (what each is, what to check, and the calculator set for it) ----------
   Formulas (the same month-by-month engine as before, loanSim, with two additions):
   • full grace: in the grace months nothing is paid and the month's interest joins the debt.
   • partial balloon B (a share of the principal): the Spitzer payment is (balance − B/(1+r)^left) × r / (1 − (1+r)^−left),
     so B is still owed at the end and paid with the last payment; with r = 0 it is (balance − B) / left.
   Without those two the engine is the old one, unchanged. */
var LN2 = null;                                  /* set only while the loan screen is being worked out */
const loanSim0 = loanSim;
loanSim = function(o){
  const X = LN2;
  if (!X || (!X.full && !(X.bal > 0)) || !o || o.mort) return loanSim0.apply(this, arguments);
  const balloon = o.type === 'annuity' ? X.bal / 100 * o.amt : 0;
  if (!X.full && !balloon) return loanSim0.apply(this, arguments);
  const r0 = o.rate / 1200, ci = Math.pow(1 + o.ci / 100, 1 / 12) - 1;
  let bal = o.amt, m = 0, gAdd = 0;
  const out = [];
  while (bal > 0.005 && m < o.n){
    m++;
    const idx = bal * ci; bal += idx;
    const r = o.rateAt ? Math.max(0, o.rateAt(m)) / 1200 : r0;
    const int = bal * r, rem = o.n - m + 1;
    let pr, pay;
    if (m <= o.grace && X.full){ bal += int; gAdd += int; out.push({int, pr: -int, idx, pay: 0, bal}); continue; }
    if (m <= o.grace) pr = 0;
    else if (o.type === 'annuity'){
      const Bm = balloon;                                   // the balloon stays a fixed sum
      const pv = rem > 1 ? Bm / Math.pow(1 + r, rem) : 0;
      pay = r === 0 ? (bal - (rem > 1 ? Bm : 0)) / rem : (bal - pv) * r / (1 - Math.pow(1 + r, -rem));
      pr = pay - int;
    } else if (o.type === 'equal') pr = bal / rem;
    else pr = m >= o.n ? bal : 0;
    if (o.base && o.mode === 'shorten' && m > o.grace && o.base[m - 1] != null) pr = Math.max(0, o.base[m - 1] - int);
    if (o.extra) pr += o.extra;
    if (o.pre && m === o.preM) pr += o.pre;
    pr = Math.min(pr, bal);
    if (m === o.n) pr = bal;
    bal -= pr;
    out.push({int, pr, idx, pay: int + pr, bal: Math.max(0, bal)});
  }
  X.gAdd = gAdd;
  return out;
};
const calcLoan2 = CALC.loan;
CALC.loan = function(){
  const sel = id => (document.getElementById(id) || {}).value;
  const type = sel('l_type') || 'annuity', grace = Math.max(0, Math.round(v('l_grace') || 0));
  const X = {full: sel('l_graceType') === 'full' && grace > 0, bal: clamp(v('l_balloon') || 0, 0, 99), gAdd: 0, last: null};
  LN2 = X;
  const sim0 = loanSim; let lastSim = null;
  loanSim = function(){ const r = sim0.apply(this, arguments); lastSim = r; return r; };
  let res;
  try { res = calcLoan2.apply(this, arguments); } finally { loanSim = sim0; LN2 = null; }
  try {
    if (!res || !res.rows) return res;
    const warn = Array.isArray(res.warn) ? res.warn : (res.warn ? [res.warn] : []);
    if (X.bal > 0 && type !== 'annuity') warn.push(t('w_lBalloonMethod'));
    const sim = lastSim || [];
    const row = k => res.rows.findIndex(r => r[0] === t(k));
    if (X.full && sim.length > grace){
      const after = sim[grace].pay, i = row('r_firstPay');
      if (i >= 0) res.rows[i] = [t('r_lAfterGrace'), M(after, 2)];
      res.rows.splice(Math.max(0, i), 0, [t('r_lInGrace'), M(0, 2)]);
      if (X.gAdd > 0.005) res.rows.splice(Math.max(0, i) + 2, 0, [t('r_lGraceAdd'), M(X.gAdd, 2)]);
      if (res.hero){ res.hero.label = t('r_lAfterGrace'); res.hero.value = M(after, 2); }
    }
    if (X.bal > 0 && type === 'annuity' && sim.length) res.rows.push([t('r_lBalloonEnd'), M(sim[sim.length - 1].pay, 2)]);
    /* other terms, side by side (the same amount, rate and method; for a fixed-rate loan worked out by payment) */
    const mode = sel('l_mode') || 'pay', rt = sel('l_rateType') || 'fixed';
    if (mode === 'pay' && rt === 'fixed' && !X.full && !X.bal){
      const amt = Math.max(0, v('l_amount')), rate = Math.max(0, v('l_rate')), yrs = clamp(v('l_years'), 0.25, 50);
      const steps = yrs > 6 ? [-5, 5] : [-1, 1];
      steps.map(d => yrs + d).filter(y => y >= 0.5 && y <= 50).forEach(y => {
        const s = loanSim0({amt, rate, n: Math.round(y * 12), type, grace: 0, ci: 0, extra: 0, pre: 0, preM: 0});
        if (!s.length) return;
        res.rows.push([t('r_lTermAlt', {y: fmtDur(Math.round(y * 12))}), t('r_lTermAltV', {p: M(s[0].pay, 2), i: M(s.reduce((a, x) => a + x.int, 0), 0)})]);
      });
    }
    if (sel('l_tbl') === 'month' && sim.length){
      res.table = {title: t('t_amortM'), head: [t('w_month'), t('h_payment'), t('l_principal'), t('l_interest'), t('h_balance')],
        rows: sim.slice(0, 600).map((x, i) => [i + 1, M(x.pay, 2), M(Math.max(0, x.pr), 2), M(x.int + x.idx, 2), M(x.bal, 2)])};
    }
    res.warn = warn;
  } catch (e) {}
  return res;
};
/* the 13 kinds: [key, preset]. A preset sets only the structure (method, rate type, grace, balloon) – never the rate */
const LT_KINDS = [
  ['personal', {l_type: 'annuity', l_rateType: 'fixed', l_grace: 0, l_balloon: 0}],
  ['balloon', {l_type: 'bullet', l_grace: 0, l_balloon: 0}],
  ['grace', {l_type: 'annuity', l_grace: 6, l_graceType: 'int'}],
  ['spitzer', {l_type: 'annuity', l_balloon: 0}],
  ['prime', {l_rateType: 'prime'}],
  ['fixed', {l_rateType: 'fixed'}],
  ['variable', {l_rateType: 'var'}],
  ['mortgage', null],
  ['deposit', {l_type: 'annuity', l_rateType: 'prime'}],
  ['hish', {l_type: 'annuity', l_rateType: 'prime'}],
  ['car', {l_type: 'annuity', l_rateType: 'fixed', l_balloon: 0}],
  ['business', {l_type: 'annuity', l_rateType: 'fixed'}],
  ['nonbank', {l_type: 'annuity', l_rateType: 'fixed', l_grace: 0}]
];
function ltCard(){
  const p = document.getElementById('panel-loan'), inputs = p && p.querySelector('.inputs'); if (!inputs) return;
  let c = document.getElementById('lt-card');
  const E = asEsc, cur = (SET.ltKind && LT_KINDS.some(k => k[0] === SET.ltKind)) ? SET.ltKind : '';
  const html = `<label for="lt_sel" class="lt-h">${E(t('lt_h'))}</label>
    <div class="control"><select id="lt_sel"><option value="">${E(t('lt_pick'))}</option>${LT_KINDS.map(([k]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${E(t('lt_' + k))}</option>`).join('')}</select></div>
    <div id="lt_info" aria-live="polite">${cur ? `<p>${E(t('lt_' + cur + 'D'))}</p><p><b>${E(t('lt_check'))}</b> ${E(t('lt_' + cur + 'C'))}</p>
      <button type="button" class="btn lt-go" data-ltgo="${cur}">${E(t(cur === 'mortgage' ? 'lt_open' : 'lt_apply'))}</button>` : ''}</div>`;
  if (!c){ inputs.insertAdjacentHTML('afterbegin', `<div class="field wide lt-card" id="lt-card"></div>`); c = document.getElementById('lt-card'); }
  if (c.contains(document.activeElement) && document.activeElement.id === 'lt_sel') { const i = document.getElementById('lt_info'); if (i) i.outerHTML = html.slice(html.indexOf('<div id="lt_info"')); return; }
  c.innerHTML = html;
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'lt_sel') return;
  SET.ltKind = e.target.value; try { saveSet(); } catch (er) {} ltCard();
});
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ltgo]'); if (!b) return;
  const k = b.dataset.ltgo, pre = (LT_KINDS.find(x => x[0] === k) || [])[1];
  if (k === 'mortgage'){ try { activate('mortgage'); } catch (er) {} return; }
  if (!pre) return;
  Object.keys(pre).forEach(id => { const el = document.getElementById(id); if (!el) return; el.value = String(pre[id]); el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); });
  try { calc('loan'); } catch (er) {}
  try { toast(t('lt_done')); } catch (er) {}
});
(function(){
  const actLt = activate;
  activate = function(id){ const r = actLt.apply(this, arguments); if (id === 'loan'){ try { ltCard(); } catch (e) {} } return r; };
  const alLt = applyLang;
  applyLang = function(){ const r = alLt.apply(this, arguments); try { if (document.getElementById('lt-card')) ltCard(); } catch (e) {} return r; };
  setTimeout(() => { try { if (typeof tab !== 'undefined' && tab === 'loan') ltCard(); } catch (e) {} }, 0);
  const st = document.createElement('style');
  st.textContent = '.lt-card{border:1px solid var(--line);border-radius:16px;padding:12px 14px;background:var(--surface);margin-bottom:10px}.lt-h{font-weight:700;display:block;margin-bottom:6px;color:var(--ink)}'
    + '#lt_info p{margin:8px 0 0;font-size:14px;line-height:1.55;color:var(--ink)}#lt_info .lt-go{margin-top:10px}';
  document.head.appendChild(st);
})();
