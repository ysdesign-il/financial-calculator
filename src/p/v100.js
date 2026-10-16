/* ================= 10.0: splitting a bill paid in another currency ================= */
/* The bill (and what each person paid) can be in one currency and settled in another, at today's rate or your own,
   with the card's conversion fee. Everything is shown in the currency you settle in, with the original next to it. */
const E100 = s => asEsc(String(s == null ? '' : s));
function spFx(){ if (!SET.spFx || typeof SET.spFx !== 'object') SET.spFx = {on: 0, bill: 'EUR', pay: '', fee: 0, mode: 'live', rate: ''}; return SET.spFx; }
const spPay = () => { const X = spFx(); return X.pay && RATES[X.pay] ? X.pay : (baseCur || 'ILS'); };
const spBill = () => { const X = spFx(); return X.bill && RATES[X.bill] ? X.bill : 'EUR'; };
function spRate(from, to){
  const X = spFx();
  if (from === spBill() && to === spPay() && X.mode === 'manual' && +X.rate > 0) return +X.rate;
  try { return rateOf(from, to); } catch (e) { return RATES[to] / RATES[from]; }
}
const spFee = () => Math.max(0, +spFx().fee || 0) / 100;
function spFxRender(){
  const box = $('#sp_fx'); if (!box) return;
  const X = spFx(), b = spBill(), p = spPay(), r = spRate(b, p), act = document.activeElement, keep = act && box.contains(act) ? act.id : null;
  box.innerHTML = `<label class="sp-fxon"><input type="checkbox" id="spx_on"${X.on ? ' checked' : ''}> 💱 <b>${E100(t('spx_on'))}</b></label>
    ${X.on ? `<div class="fields">
      <div class="field"><label for="spx_bill">${E100(t('spx_bill'))}</label><div class="control"><select id="spx_bill">${curOptions(b, true)}</select></div></div>
      <div class="field"><label for="spx_pay">${E100(t('spx_pay'))}</label><div class="control"><select id="spx_pay">${curOptions(p, true)}</select></div></div>
      <div class="field"><label for="spx_mode">${E100(t('spx_mode'))}</label><div class="control"><select id="spx_mode"><option value="live"${X.mode !== 'manual' ? ' selected' : ''}>${E100(t('spx_live'))}</option><option value="manual"${X.mode === 'manual' ? ' selected' : ''}>${E100(t('spx_manual'))}</option></select></div></div>
      ${X.mode === 'manual' ? `<div class="field"><label for="spx_rate">${E100(t('spx_rate', {a: b, b: p}))}</label><div class="control"><input id="spx_rate" type="number" inputmode="decimal" step="any" value="${E100(X.rate)}" placeholder="${E100(N(spRate(b, p) || 0, 4))}"></div></div>` : ''}
      <div class="field"><label for="spx_fee">${E100(t('spx_fee'))}</label><div class="control"><input id="spx_fee" type="number" inputmode="decimal" step="any" value="${E100(X.fee || 0)}">${unitHTML('%')}</div><small class="hint">${E100(t('h_spxFee'))}</small></div>
    </div>
    <p class="sp-fxline">${typeof curFlag === 'function' ? curFlag(b) + ' ' : ''}1 ${E100(b)} = ${E100(N(r, 4))} ${E100(p)}${spFee() ? ' · ' + E100(t('spx_withFee', {r: N(r * (1 + spFee()), 4)})) : ''}</p>` : ''}`;
  if (keep){ const el = document.getElementById(keep); if (el) el.focus(); }
}
const spRe = () => { try { saveSet(); } catch (e) {} spFxRender(); spRender(); if (tab === 'split') calc(tab); };
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#sp_fx')) return; const X = spFx();
  if (el.id === 'spx_on') X.on = el.checked ? 1 : 0;
  else if (el.id === 'spx_bill') X.bill = el.value; else if (el.id === 'spx_pay') X.pay = el.value; else if (el.id === 'spx_mode') X.mode = el.value; else return;
  spRe();
}, true);
var SPX_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || (el.id !== 'spx_fee' && el.id !== 'spx_rate')) return;
  spFx()[el.id === 'spx_fee' ? 'fee' : 'rate'] = el.value === '' ? '' : +el.value;
  clearTimeout(SPX_T); SPX_T = setTimeout(spRe, 350);
}, true);
/* who paid in which currency (the "who paid what" mode) */
const _spRender100 = spRender;
spRender = function(){
  const r = _spRender100.apply(this, arguments);
  const X = spFx(), mode = ($('#sp_mode') || {}).value; if (!X.on) return r;
  const box = $('#sp_box'); if (!box) return r;
  const P = spList(), money = mode === 'paid' ? 'paid' : mode === 'ex' ? 'ex' : null; if (!money) return r;
  const opts = [...new Set([spBill(), spPay(), 'ILS', 'USD', 'EUR', 'GBP'])].filter(c => RATES[c]);
  $$('.sp-row', box).forEach(row => {
    const i = +row.dataset.spi, p = P[i]; if (!p || row.querySelector('.sp-cur')) return;
    const c = p.cur && RATES[p.cur] ? p.cur : spBill();
    const u = row.querySelector('.sp-v .unit, .sp-v .u'); if (u) u.remove();
    row.querySelector('.sp-v').insertAdjacentHTML('beforeend', `<select class="sp-cur" data-spcur="${i}" aria-label="${E100(t('spx_cur'))}">${opts.concat(opts.includes(c) ? [] : [c]).map(k => `<option value="${k}"${k === c ? ' selected' : ''}>${typeof curFlag === 'function' ? curFlag(k) + ' ' : ''}${k}</option>`).join('')}</select>`);
  });
  return r;
};
document.addEventListener('change', e => { const s = e.target; if (!s || s.dataset.spcur == null) return; const p = spList()[+s.dataset.spcur]; if (!p) return; p.cur = s.value; try { saveSet(); } catch (er) {} if (tab === 'split') calc(tab); }, true);
/* the calculation: the bill's amounts are turned into the settling currency (with the fee), then split as before */
const _calcSplit100 = CALC.split;
CALC.split = function(){
  const X = spFx(); if (!X.on) return _calcSplit100.apply(this, arguments);
  const b = spBill(), p = spPay(), fee = spFee(), f = spRate(b, p) * (1 + fee), P = spList(), mode = ($('#sp_mode') || {}).value || 'eq';
  const tot = $('#sp_total'), keepTot = tot ? tot.value : null, keepP = P.map(x => ({paid: x.paid, ex: x.ex})), keepCur = cur;
  const total0 = Math.max(0, v('sp_total')), tip = Math.max(0, v('sp_tip')) / 100;
  let res;
  try {
    cur = p;
    if (tot) tot.value = String(total0 * f);
    P.forEach(x => {
      const pf = spRate(x.cur && RATES[x.cur] ? x.cur : b, p) * (1 + ((x.cur || b) === p ? 0 : fee));
      if (mode === 'paid') x.paid = (+x.paid || 0) * pf;
      if (mode === 'ex') x.ex = (+x.ex || 0) * pf;
    });
    res = _calcSplit100.apply(this, arguments);
    if (!res) return res;
    const billOrig = mode === 'paid' ? NaN : total0 * (1 + tip), billPay = billOrig * f, rows = [];
    rows.push([t('spx_rateRow'), '1 ' + b + ' = ' + N(spRate(b, p), 4) + ' ' + p + (X.mode === 'manual' && +X.rate > 0 ? ' (' + t('spx_manual') + ')' : '')]);
    if (isFinite(billOrig)) rows.push([t('spx_billOrig'), M(billOrig, 2, b)], [t('spx_billPay'), M(billPay, 2, p), 'key']);
    if (fee && isFinite(billOrig)) rows.push([t('spx_feeCost', {f: PC(fee * 100)}), M(billOrig * spRate(b, p) * fee, 2, p)]);
    if (mode === 'eq'){ const n = Math.max(1, Math.round(v('sp_n'))); rows.push([t('spx_eachOrig'), M(billOrig / n, 2, b)]); res.hero.sub = (res.hero.sub ? res.hero.sub + ' · ' : '') + '≈ ' + M(billOrig / n, 2, b); }
    res.rows = rows.concat(res.rows || []);
    res.note = t('n_spx') + ' ' + (res.note || '');
  } finally {
    cur = keepCur; if (tot && keepTot != null) tot.value = keepTot;
    P.forEach((x, i) => { x.paid = keepP[i].paid; x.ex = keepP[i].ex; });
  }
  return res;
};
const _calc100 = calc;
calc = function(id){
  if (id === 'split' && $('#sp_fx') && !$('#sp_fx').children.length) spFxRender();
  const r = _calc100.apply(this, arguments);
  if (id === 'split'){ const u = $('#sp_total') && $('#sp_total').parentNode.querySelector('.u.cur'); if (u){ const want = spFx().on ? symOf(spBill()) : symOf(cur); if (u.textContent !== want) u.textContent = want; } }
  return r;
};
const _al100 = applyLang;
applyLang = function(){ const r = _al100.apply(this, arguments); try { spFxRender(); } catch (e) {} return r; };
try { spFxRender(); } catch (e) {}
