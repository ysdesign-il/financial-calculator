/* ---------- 13.88: the stock market and crypto ----------
   New calculators: profit and loss on a trade, hold or sell (at a gain or a loss), harvesting losses before the year ends,
   comparing shares, the world's stock exchanges, price alerts, options, leverage and margin, position size and risk,
   rebalancing, a crash test, monthly against all at once, crypto staking and the real cost of buying crypto.
   • Tax uses the existing capital-gains engine (calcCapital) – the same formula, never a second one.
   • Prices come from the server's delayed quote (/api/q), always shown with the source and the time; nothing about the
     person is sent, only the symbol.
   • Every screen says it is not financial advice; options and leverage carry a risk warning. */
const MK_NA = () => t('mk_notAdvice');
const mkSign = x => (x < 0 ? '−' : x > 0 ? '+' : '') + M(Math.abs(x));
const mkPct = (x, d) => isFinite(x) ? (x < 0 ? '−' : x > 0 ? '+' : '') + N(Math.abs(x), d == null ? 1 : d) + '%' : '—';
const mkSel = id => (document.getElementById(id) || {}).value || '';
function mkFx(cur){ try { return cur === 'ILS' ? 1 : RATES.ILS && RATES[cur] ? RATES.ILS / RATES[cur] : 1; } catch (e) { return 1; } }
/* the tax on a gain, from the existing capital-gains calculator */
function mkCapTax(o){
  try {
    const r = withVals({cp_kind: o.kind || 'sec', cp_buy: Math.max(0, o.buy), cp_sell: Math.max(0, o.sell), cp_fee: Math.max(0, o.fee || 0), cp_cpi: Math.max(0, o.cpi || 0), cp_loss: Math.max(0, o.loss || 0), cp_other: Math.max(0, o.other || 0)}, () => calcCapital());
    const x = f10num(r.hero.value); return isFinite(x) ? x : 0;
  } catch (e) { return Math.max(0, o.sell - o.buy - (o.fee || 0)) * 0.25; }
}
async function mkQuote(sym, yr){
  const r = await fetch(F12_API('api/q?s=' + encodeURIComponent(String(sym).trim().toUpperCase()) + (yr ? '&r=1y' : '')), {credentials: 'omit', referrerPolicy: 'no-referrer'});
  const j = await r.json(); return j && j.ok ? j : null;
}
const nPdf = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
function nCdf(x){ const k = 1 / (1 + 0.2316419 * Math.abs(x)), y = k * (0.319381530 + k * (-0.356563782 + k * (1.781477937 + k * (-1.821255978 + k * 1.330274429)))); const p = 1 - nPdf(x) * y; return x >= 0 ? p : 1 - p; }

/* ================= profit and loss on a trade ================= */
CALC.trade = function(){
  const crypto = mkSel('tq_kind') === 'crypto', cur = mkSel('tq_cur') || 'ILS', hold = mkSel('tq_state') === 'hold';
  const buy = Math.max(0, v('tq_buy')), sell = Math.max(0, v('tq_sell')), q = Math.max(0, v('tq_qty'));
  const fx0 = cur === 'ILS' ? 1 : Math.max(0.0001, v('tq_fx0')), fx1 = cur === 'ILS' ? 1 : Math.max(0.0001, v('tq_fx1'));
  const fp = Math.max(0, v('tq_feeP')) / 100, fmin = Math.max(0, v('tq_feeMin')), div = crypto ? 0 : Math.max(0, v('tq_div'));
  const months = Math.max(0.5, v('tq_months')), yrs = months / 12, cpi = Math.max(-50, v('tq_cpi')) / 100;
  const cost = buy * q, proc = sell * q, feeOf = a => a > 0 ? Math.max(a * fp, fp > 0 || fmin > 0 ? fmin : 0) : 0, fB = feeOf(cost), fS = feeOf(proc);
  const grossA = proc - cost + div - fB - fS;
  const costI = (cost + fB) * fx0, sellI = (proc - fS) * fx1, divI = div * fx1, gainI = sellI + divI - costI;
  const taxGain = mkCapTax({kind: crypto ? 'crypto' : 'sec', buy: costI, sell: sellI, fee: 0, cpi: crypto ? 0 : cpi * 100, loss: v('tq_loss'), other: v('tq_other')});
  const taxDiv = divI * 0.25, tax = taxGain + taxDiv, net = gainI - tax;
  const ret = costI > 0 ? net / costI : NaN, cagr = isFinite(ret) && ret > -1 ? Math.pow(1 + ret, 1 / yrs) - 1 : NaN, real = isFinite(ret) ? (1 + ret) / (1 + cpi) - 1 : NaN;
  const retA = cost + fB > 0 ? grossA / (cost + fB) : NaN, retI = costI > 0 ? gainI / costI : NaN, fxEff = cur === 'ILS' ? 0 : (retI - retA) * 100;
  const be = q > 0 ? (costI / fx1 - div + feeOf(cost)) / q : NaN, drop = Math.min(99, Math.max(0, v('tq_drop'))) / 100, rec = drop > 0 ? 1 / (1 - drop) - 1 : 0;
  const cs = cur === 'ILS' ? '₪' : cur, A = x => (x < 0 ? '−' : '') + N(Math.abs(x), 2) + ' ' + cs;
  const rows = [[t('r_tqGrossA'), (grossA >= 0 ? '+' : '') + A(grossA)], [t('r_tqFees'), A(-(fB + fS))]];
  if (cur !== 'ILS') rows.push([t('r_tqFx'), mkPct(fxEff, 1) + ' ' + t('u_pts')]);
  rows.push([t('r_tqGainI'), mkSign(gainI)], [t('r_tqTax'), '−' + M(tax)]);
  if (taxDiv > 0) rows.push([t('r_tqTaxDiv'), '−' + M(taxDiv)]);
  rows.push([t('r_tqNet'), mkSign(net), 'key'], [t('r_tqCagr'), mkPct(cagr * 100)], [t('r_tqReal'), mkPct(real * 100)], [t('r_tqBe'), isFinite(be) ? N(be, 2) + ' ' + cs : '—'], [t('r_tqRec', {p: N(drop * 100, 0)}), '+' + N(rec * 100, 1) + '%']);
  const warn = [];
  if (gainI < 0) warn.push(t('w_tqLoss', {v: M(-gainI), s: M(-gainI * 0.25)}));
  if (!crypto && div > 0 && cur !== 'ILS') warn.push(t('w_tqDivAbroad'));
  return {hero: {label: t(hold ? 'r_tqHeroHold' : 'r_tqHero'), value: mkSign(net), sub: [mkPct(ret * 100), t('r_tqYr', {p: mkPct(cagr * 100)}), t('r_tqRealS', {p: mkPct(real * 100)})].join(' · ')},
    rows, warn, note: t('n_trade') + ' ' + MK_NA(),
    split: {title: t('r_tqSplit'), items: [{name: t('r_tqCost'), v: costI, cls: 'c-ink', fmt: M(costI)}, {name: t('r_tqNet'), v: Math.max(0, net), cls: 'c-warm', fmt: mkSign(net)}, {name: t('r_tqTax'), v: tax, cls: 'c-ink', fmt: M(tax)}]}};
};

/* ================= hold or sell ================= */
function hzRun(o, alt){
  const g = Math.pow(1 + o.exp, o.y), endA = o.val * g, taxA = Math.max(0, endA * (1 - o.fs) - o.cost) * o.tax, netA = endA * (1 - o.fs) - taxA;
  const gainNow = o.val * (1 - o.fs) - o.cost, taxNow = Math.max(0, gainNow) * o.tax, loss = Math.max(0, -gainNow), used = Math.min(loss, o.gains), shield = used * o.tax, carry = loss - used;
  const inv = (o.val * (1 - o.fs) - taxNow + shield) * (1 - o.fb), endB = inv * Math.pow(1 + alt, o.y), taxB = Math.max(0, endB * (1 - o.fs) - inv - carry) * o.tax, netB = endB * (1 - o.fs) - taxB;
  return {netA, netB, taxNow, shield, carry, inv, gainNow};
}
CALC.holdsell = function(){
  const o = {val: Math.max(0, v('hz_val')), cost: Math.max(0, v('hz_cost')), exp: v('hz_exp') / 100, y: Math.max(0.25, v('hz_years')), fs: Math.max(0, v('hz_feeS')) / 100, fb: Math.max(0, v('hz_feeB')) / 100, gains: Math.max(0, v('hz_gains')), tax: Math.max(0, v('hz_tax')) / 100};
  const alt = v('hz_alt') / 100, R = hzRun(o, alt), d = R.netB - R.netA;
  let lo = -0.5, hi = 1; for (let i = 0; i < 60; i++){ const m = (lo + hi) / 2; if (hzRun(o, m).netB < R.netA) lo = m; else hi = m; }
  const need = (lo + hi) / 2, isLoss = R.gainNow < 0;
  const rows = [[t('r_hzHold', {y: N(o.y, 0)}), M(R.netA)], [t('r_hzSell', {y: N(o.y, 0)}), M(R.netB)], [t('r_hzDiff'), mkSign(d), 'key'],
    [t(isLoss ? 'r_hzLossNow' : 'r_hzTaxNow'), isLoss ? '−' + M(-R.gainNow) : M(R.taxNow)]];
  if (isLoss) rows.push([t('r_hzShield'), M(R.shield)], [t('r_hzCarry'), M(R.carry)]);
  rows.push([t('r_hzNeed'), mkPct(need * 100, 2)]);
  const warn = [];
  if (!isLoss && R.taxNow > 0) warn.push(t('w_hzTaxDrag', {v: M(R.taxNow)}));
  if (isLoss && o.gains === 0) warn.push(t('w_hzNoGains'));
  return {hero: {label: t('r_hzHero'), value: t(Math.abs(d) < o.val * 0.002 ? 'r_hzSame' : d > 0 ? 'r_hzBSell' : 'r_hzBHold'), sub: t('r_hzBy', {v: M(Math.abs(d)), y: N(o.y, 0)})},
    rows, warn, note: t('n_holdsell') + ' ' + MK_NA()};
};

/* ================= harvesting losses before the year ends (from your holdings) ================= */
function tlRows(){
  return pfD().hold.map((x, i) => { const c = pfxCalc(x); if (!c) return null; if (!x.rid) x.rid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7); const cur = x.cur || 'ILS', f0 = cur === 'ILS' ? 1 : pfN(x.fx0) || mkFx(cur), f1 = cur === 'ILS' ? 1 : pfN(x.fx1) || mkFx(cur);
    const g = (c.val + (pfN(x.div) || 0)) * f1 - c.base * f0; return {i, x, g, name: x.name || x.sym || t('pf_h_' + (x.type || 'other'))}; }).filter(Boolean);
}
CALC.taxloss = function(){
  const R = tlRows(), pick = SET.tlPick || {}, gains = Math.max(0, v('tl_gains')), cf = Math.max(0, v('tl_lossCf')), tax = Math.max(0, v('tl_tax')) / 100;
  const L = R.filter(r => r.g < 0), sel = L.filter(r => pick[r.x.rid || r.i]), lossSel = sel.reduce((s, r) => s - r.g, 0);
  const off = Math.min(gains, cf + lossSel), base = Math.max(0, gains - cf) * tax, after = Math.max(0, gains - cf - lossSel) * tax, saved = base - after;
  const box = document.getElementById('tl_box');
  if (box){ const E = asEsc;
    box.innerHTML = L.length ? `<h3 class="sec-t">${E(t('tl_list'))}</h3><ul class="pi-l">${L.map(r => `<li><label><input type="checkbox" data-tlp="${E(r.x.rid || r.i)}"${pick[r.x.rid || r.i] ? ' checked' : ''}> <b>${E(r.name)}</b> <span class="down">${E(mkSign(r.g))}</span><small class="wi-sm">${E(t('tl_saves', {v: M(Math.min(-r.g, Math.max(0, gains - cf)) * tax)}))}</small></label></li>`).join('')}</ul>`
      : `<p class="fine">${E(t(R.length ? 'tl_noLoss' : 'tl_noHold'))}</p><div class="fp-acts"><button type="button" class="as-chip" data-fpgo="portfolio">${E(t('fp_aPf'))}</button></div>`; }
  const rows = [[t('r_tlGains'), M(gains)], [t('r_tlSel'), M(lossSel)], [t('r_tlOff'), M(off)], [t('r_tlTaxBefore'), M(base)], [t('r_tlTaxAfter'), M(after)], [t('r_tlSaved'), M(saved), 'key']];
  const left = cf + lossSel - Math.min(gains, cf + lossSel); if (left > 0) rows.push([t('r_tlLeft'), M(left)]);
  return {hero: {label: t('r_tlHero'), value: M(saved), sub: t('r_tlSub', {n: sel.length})}, rows, warn: sel.length ? [t('w_tlWash')] : [], note: t('n_taxloss') + ' ' + MK_NA()};
};
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.tlp != null){ const P = SET.tlPick || (SET.tlPick = {}); if (el.checked) P[el.dataset.tlp] = 1; else delete P[el.dataset.tlp]; try { saveSet(); calc('taxloss'); } catch (er) {} } });

/* ================= options ================= */
function opPay(o, S){ const intr = o.call ? Math.max(0, S - o.k) : Math.max(0, o.k - S), per = intr - o.prem; return (o.buy ? per : -per) * o.mult * o.n - o.fee * o.n; }
function opBS(o){
  const T = Math.max(1, o.days) / 365, s = Math.max(0.01, o.iv), r = o.r, S = o.s, K = Math.max(0.0001, o.k), d1 = (Math.log(S / K) + (r + s * s / 2) * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T);
  const call = S * nCdf(d1) - K * Math.exp(-r * T) * nCdf(d2), put = K * Math.exp(-r * T) * nCdf(-d2) - S * nCdf(-d1);
  const thetaC = (-S * nPdf(d1) * s / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nCdf(d2)) / 365, thetaP = (-S * nPdf(d1) * s / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * nCdf(-d2)) / 365;
  return {price: o.call ? call : put, delta: o.call ? nCdf(d1) : nCdf(d1) - 1, theta: o.call ? thetaC : thetaP, itm: o.call ? nCdf(d2) : nCdf(-d2)};
}
function opSvg(o){
  const lo = Math.max(0, o.s * 0.6), hi = o.s * 1.4, n = 60, P = []; for (let i = 0; i <= n; i++){ const S = lo + (hi - lo) * i / n; P.push([S, opPay(o, S)]); }
  const ys = P.map(p => p[1]), mn = Math.min(0, ...ys), mx = Math.max(0, ...ys), W = 320, H = 150, X = S => (S - lo) / (hi - lo) * W, Y = y => H - 8 - (y - mn) / ((mx - mn) || 1) * (H - 16);
  const path = P.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="op-svg" role="img" aria-label="${asEsc(t('op_chart'))}"><line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" class="op-0"/><line x1="${X(o.s)}" x2="${X(o.s)}" y1="0" y2="${H}" class="op-s"/><path d="${path}" class="op-l"/></svg>
    <div class="op-ax"><span>${N(lo, 0)}</span><span>${asEsc(t('op_now', {v: N(o.s, 2)}))}</span><span>${N(hi, 0)}</span></div>`;
}
CALC.options = function(){
  const o = {call: mkSel('op_type') !== 'put', buy: mkSel('op_side') !== 'sell', s: Math.max(0.01, v('op_s')), k: Math.max(0, v('op_k')), prem: Math.max(0, v('op_prem')), n: Math.max(0, Math.round(v('op_n'))), mult: Math.max(1, v('op_mult')), days: Math.max(0, v('op_days')), iv: Math.max(0, v('op_iv')) / 100, r: v('op_r') / 100, fee: Math.max(0, v('op_fee'))};
  const be = o.call ? o.k + o.prem : o.k - o.prem, unit = o.mult * o.n, premAll = o.prem * unit, B = opBS(o);
  const maxP = o.buy ? (o.call ? Infinity : (o.k - o.prem) * unit) : premAll, maxL = o.buy ? premAll : (o.call ? Infinity : (o.k - o.prem) * unit);
  const inf = t('op_inf'), Nm = x => (x < 0 ? '−' : '') + N(Math.abs(x), 2), fm = x => x === Infinity ? inf : Nm(x - o.fee * o.n), fl = x => x === Infinity ? inf : Nm(x + o.fee * o.n);
  const box = document.getElementById('op_box'); if (box) box.innerHTML = `<h3 class="sec-t">${asEsc(t('op_chart'))}</h3>${opSvg(o)}<p class="fine">${asEsc(t('op_chartH'))}</p>`;
  const rows = [[t(o.buy ? 'r_opPaid' : 'r_opGot'), Nm(premAll)], [t('r_opBe'), N(be, 2)], [t('r_opMaxP'), fm(maxP)], [t('r_opMaxL'), fl(maxL)],
    [t('r_opAtNow'), (opPay(o, o.s) > 0 ? '+' : '') + Nm(opPay(o, o.s))], [t('r_opTheo'), N(B.price, 2) + (B.price > 0 ? ' (' + mkPct((o.prem / B.price - 1) * 100, 0) + ' ' + t('r_opVsTheo') + ')' : '')], [t('r_opDelta'), N(B.delta, 2)], [t('r_opTheta'), N(B.theta * unit, 2)], [t('r_opItm'), PC(B.itm * 100)]];
  const warn = [t('w_opRisk')]; if (!o.buy && o.call) warn.unshift(t('w_opNaked'));
  return {hero: {label: t('r_opHero', {x: t(o.buy ? 'o_opBuy' : 'o_opSell') + ' ' + t(o.call ? 'o_opCall' : 'o_opPut')}), value: N(be, 2), sub: t('r_opHeroS', {p: fm(maxP), l: fl(maxL)})}, rows, warn, note: t('n_options') + ' ' + MK_NA()};
};

/* ================= leverage and margin ================= */
CALC.leverage = function(){
  const fut = mkSel('lm_kind') === 'futures', short = mkSel('lm_side') === 'short', own = Math.max(0, v('lm_own')), lev = Math.max(1, v('lm_lev')), mv = v('lm_move') / 100, days = Math.max(0, v('lm_days'));
  const mm = Math.max(0, v('lm_mm')) / 100, fee = Math.max(0, v('lm_fee')) / 100, pos = own * lev, borrowed = pos - own, dir = short ? -1 : 1;
  const carry = fut ? pos * Math.max(0, v('lm_fund')) / 100 * 3 * days : borrowed * Math.max(0, v('lm_rate')) / 100 * days / 365, fees = pos * fee * 2;
  const pnlOf = m => pos * m * dir - carry - fees;
  const liqMove = short ? (own / pos - mm) / (1 + mm) : -(own / pos - mm) / (1 - mm);   /* the price move at which the equity falls to the maintenance margin */
  const pnl = pnlOf(mv), liq = short ? mv >= liqMove : mv <= liqMove, res = liq ? -own : pnl;
  const noLev = own * mv * dir - own * fee * 2;
  const tbl = [-0.3, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.3].map(m => { const l = short ? m >= liqMove : m <= liqMove, p = l ? -own : pnlOf(m); return [mkPct(m * 100, 0), mkSign(p), mkPct(p / own * 100, 0), l ? t('r_lmLiqY') : '']; });
  const rows = [[t('r_lmPos'), M(pos)], [t('r_lmBorrow'), M(borrowed)], [t(fut ? 'r_lmFund' : 'r_lmInt', {d: N(days, 0)}), '−' + M(carry)], [t('r_tqFees'), '−' + M(fees)],
    [t('r_lmLiq'), mkPct(liqMove * 100, 1)], [t('r_lmPnl', {m: mkPct(mv * 100, 0)}), mkSign(res), 'key'], [t('r_lmNoLev'), mkSign(noLev)]];
  const warn = [t('w_lmRisk')]; if (liq) warn.unshift(t('w_lmLiq')); if (lev > 10) warn.unshift(t('w_lmHigh'));
  return {hero: {label: t('r_lmHero'), value: mkPct(res / own * 100, 0), sub: t('r_lmHeroS', {v: mkSign(res), l: mkPct(liqMove * 100, 1)})}, rows, warn, note: t('n_leverage') + ' ' + MK_NA(),
    table: {title: t('r_lmTbl'), head: [t('r_lmMove'), t('r_lmRes'), t('r_lmOnOwn'), ''], rows: tbl, open: true}};
};

/* ================= position size and risk ================= */
CALC.position = function(){
  const short = mkSel('pz_side') === 'short', acct = Math.max(0, v('pz_acct')), risk = Math.max(0, v('pz_risk')) / 100, e = Math.max(0, v('pz_entry')), st = Math.max(0, v('pz_stop')), tg = Math.max(0, v('pz_target')), fee = Math.max(0, v('pz_fee')) / 100;
  const per = Math.abs(e - st) + e * fee * 2, n = per > 0 ? Math.floor(acct * risk / per) : 0, pos = n * e, loss = n * per, gain = n * (Math.abs(tg - e) - e * fee * 2);
  const rr = Math.abs(e - st) > 0 ? Math.abs(tg - e) / Math.abs(e - st) : NaN, wr = isFinite(rr) ? 1 / (1 + rr) : NaN;
  const warn = [];
  if (short ? st <= e : st >= e) warn.push(t('w_pzStopSide')); if (short ? tg >= e : tg <= e) warn.push(t('w_pzTgSide'));
  if (pos > acct) warn.push(t('w_pzLev', {x: N(pos / Math.max(1, acct), 1)})); if (risk > 0.03) warn.push(t('w_pzRiskHigh'));
  return {hero: {label: t('r_pzHero'), value: N(n, 0), sub: t('r_pzHeroS', {v: M(pos), p: PC(acct > 0 ? pos / acct * 100 : 0)})},
    rows: [[t('r_pzLoss'), '−' + M(loss)], [t('r_pzGain'), mkSign(gain)], [t('r_pzRR'), isFinite(rr) ? '1 : ' + N(rr, 2) : '—', 'key'], [t('r_pzWr'), PC(wr * 100)], [t('r_pzPer'), N(per, 2)]],
    warn, note: t('n_position') + ' ' + MK_NA()};
};

/* ================= rebalancing (from your holdings) ================= */
const RB_CLS = {stock: ['stockIL', 'stockUS', 'etf', 'fund'], bond: ['bond'], crypto: ['crypto'], cash: ['cash'], other: ['other', 're', 'gold']};
const rbClsOf = ty => Object.keys(RB_CLS).find(k => RB_CLS[k].includes(ty)) || 'other';
CALC.rebalance = function(){
  const d = pfD(), add = Math.max(0, v('rbl_add')), onlyNew = mkSel('rbl_mode') === 'new', fee = Math.max(0, v('rbl_fee')) / 100, tax = Math.max(0, v('rbl_tax')) / 100;
  const cur = {}, base = {}; d.hold.forEach(x => { const k = rbClsOf(x.type || 'other'), val = Math.max(0, f10Hold(x)), c = pfxCalc(x), f0 = (x.cur || 'ILS') === 'ILS' ? 1 : pfN(x.fx0) || mkFx(x.cur); cur[k] = (cur[k] || 0) + val; base[k] = (base[k] || 0) + (c ? c.base * f0 : val); });
  const T = SET.rbT || (SET.rbT = {}), ks = Object.keys(RB_CLS).filter(k => cur[k] > 0 || +T[k] > 0), tot = ks.reduce((s, k) => s + (cur[k] || 0), 0), all = tot + add;
  const pctOf = k => T[k] == null ? (tot ? (cur[k] || 0) / tot * 100 : 0) : +T[k], tSum = ks.reduce((s2, k) => s2 + pctOf(k), 0);
  const box = document.getElementById('rbl_box'), E = asEsc;
  if (box && !(box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT'))
    box.innerHTML = ks.length ? `<h3 class="sec-t">${E(t('rb_tgt'))}</h3><div class="fields">${ks.map(k => `<div class="field"><label for="rbt_${k}">${E(t('rb_c_' + k))} <small>(${E(t('rb_now', {p: N(tot ? (cur[k] || 0) / tot * 100 : 0, 0)}))})</small></label><div class="control"><input id="rbt_${k}" type="number" inputmode="decimal" data-rbt="${k}" value="${E(T[k] == null ? Math.round(tot ? (cur[k] || 0) / tot * 100 : 0) : T[k])}"><span class="unit">%</span></div></div>`).join('')}</div><p class="fine">${E(t('rb_sum', {p: N(tSum, 0)}))}</p>`
      : `<p class="fine">${E(t('tl_noHold'))}</p><div class="fp-acts"><button type="button" class="as-chip" data-fpgo="portfolio">${E(t('fp_aPf'))}</button></div>`;
  if (!ks.length) return {hero: {label: t('r_rbHero'), value: '—', sub: ''}, rows: [], note: MK_NA()};
  const tgt = k => tSum > 0 ? pctOf(k) / tSum : 0;
  let rows = [], buyAll = 0, sellAll = 0, taxAll = 0;
  const L = ks.map(k => { let need = tgt(k) * all - (cur[k] || 0); if (onlyNew && need < 0) need = 0; return {k, need}; });
  if (onlyNew){ const pos = L.reduce((s, x) => s + x.need, 0); L.forEach(x => { x.need = pos > 0 ? x.need / pos * add : 0; }); }
  const tbl = L.map(x => { const c = cur[x.k] || 0, g = c > 0 ? Math.max(0, (c - (base[x.k] || 0)) / c) : 0, tx = x.need < 0 ? -x.need * g * tax : 0;
    if (x.need > 0) buyAll += x.need; else sellAll -= x.need; taxAll += tx;
    return [t('rb_c_' + x.k), M(c), PC(c / Math.max(1, tot) * 100), PC(tgt(x.k) * 100), (x.need >= 0 ? t('rb_buy') + ' ' : t('rb_sell') + ' ') + M(Math.abs(x.need))]; });
  rows = [[t('r_rbBuyT'), M(buyAll)], [t('r_rbSell'), M(sellAll)], [t('r_tqFees'), M((buyAll + sellAll) * fee)], [t('r_rbTax'), M(taxAll), 'key']];
  const warn = []; if (Math.abs(tSum - 100) > 0.5) warn.push(t('w_rbSum', {p: N(tSum, 0)})); if (taxAll > 0) warn.push(t('w_rbTax'));
  return {hero: {label: t('r_rbHero'), value: M(buyAll + sellAll), sub: t('r_rbHeroS', {v: M(all)})}, rows, warn, note: t('n_rebalance') + ' ' + MK_NA(),
    table: {title: t('r_rbTbl'), head: ['', t('pa_val'), t('rb_nowH'), t('rb_tgtH'), t('rb_act')], rows: tbl, open: true}};
};
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.rbt){ const T = SET.rbT || (SET.rbT = {}); T[el.dataset.rbt] = Math.max(0, +el.value || 0); clearTimeout(SET.__rbT); SET.__rbT = setTimeout(() => { try { delete SET.__rbT; saveSet(); } catch (er) {} }, 500); try { calc('rebalance'); } catch (er) {} } }, true);

/* ================= the crash test ================= */
const CR_SCN = {mild: [-10, -2, -30], severe: [-20, -5, -50], crash: [-40, -10, -70]};
CALC.crashtest = function(){
  const sc = mkSel('cr_scn') || 'severe', D = sc === 'custom' ? [v('cr_dS'), v('cr_dB'), v('cr_dC')] : CR_SCN[sc];
  const a = [Math.max(0, v('cr_stocks')), Math.max(0, v('cr_bonds')), Math.max(0, v('cr_crypto')), Math.max(0, v('cr_cash'))], before = a.reduce((s, x) => s + x, 0);
  const after = a[0] * (1 + D[0] / 100) + a[1] * (1 + D[1] / 100) + a[2] * (1 + D[2] / 100) + a[3], loss = before - after, r = Math.max(0.001, v('cr_ret') / 100);
  const yrs = after > 0 && after < before ? Math.log(before / after) / Math.log(1 + r) : 0;
  const rows = [[t('r_crBefore'), M(before)], [t('r_crAfter'), M(after)], [t('r_crLoss'), '−' + M(loss) + ' (' + mkPct(-loss / Math.max(1, before) * 100) + ')', 'key'],
    [t('f_crStocks'), mkPct(D[0], 0) + ' → −' + M(a[0] * -D[0] / 100)], [t('f_crBonds'), mkPct(D[1], 0) + ' → −' + M(a[1] * -D[1] / 100)], [t('f_crCrypto'), mkPct(D[2], 0) + ' → −' + M(a[2] * -D[2] / 100)], [t('r_crBack', {p: N(r * 100, 1)}), fmtDur(Math.round(yrs * 12))]];
  return {hero: {label: t('r_crHero'), value: '−' + M(loss), sub: t('r_crHeroS', {p: mkPct(-loss / Math.max(1, before) * 100), d: fmtDur(Math.round(yrs * 12))})}, rows, note: t('n_crashtest') + ' ' + MK_NA(),
    split: {title: t('r_crAfter'), items: [{name: t('f_crStocks'), v: a[0] * (1 + D[0] / 100), cls: 'c-ink', fmt: M(a[0] * (1 + D[0] / 100))}, {name: t('f_crBonds'), v: a[1] * (1 + D[1] / 100), cls: 'c-warm', fmt: M(a[1] * (1 + D[1] / 100))}, {name: t('f_crCrypto'), v: a[2] * (1 + D[2] / 100), cls: 'c-ink', fmt: M(a[2] * (1 + D[2] / 100))}, {name: t('f_crCash'), v: a[3], cls: 'c-warm', fmt: M(a[3])}]}};
};
/* the first time, the amounts come from the holdings */
function crFill(){
  if (f10Touched('crashtest')) return; const d = pfD(); if (!d.hold.length && !d.sav.length) return;
  const s = {stock: 0, bond: 0, crypto: 0, cash: 0}; d.hold.forEach(x => { const k = rbClsOf(x.type || 'other'), val = Math.max(0, f10Hold(x)); s[k === 'other' ? 'stock' : k] += val; });
  d.sav.filter(x => ['cash', 'deposit', 'mmf'].includes(x.type)).forEach(x => { s.cash += Math.max(0, pfN(x.bal) || 0); });
  [['cr_stocks', s.stock], ['cr_bonds', s.bond], ['cr_crypto', s.crypto], ['cr_cash', s.cash]].forEach(([id, x]) => { const el = document.getElementById(id); if (el) el.value = String(Math.round(x)); });
}

/* ================= monthly against all at once ================= */
function dlPath(seed, n, mu, sd){ let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; const out = []; for (let i = 0; i < n; i++){ const u = Math.max(1e-9, rnd()), w = rnd(), z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); out.push(Math.exp(mu + sd * z)); } return out; }
function dlRun(g, amt, k){ let lump = amt, dca = 0, cash = amt; const per = amt / k; g.forEach((m, i) => { lump *= m; if (i < k){ dca += per; cash -= per; } dca *= m; }); return {lump, dca: dca + cash}; }
CALC.dcalump = function(){
  const amt = Math.max(0, v('dl_amt')), k = clamp(Math.round(v('dl_months')), 1, 120), yrs = clamp(Math.round(v('dl_years')), 1, 40), n = Math.max(k, yrs * 12);
  const r = v('dl_ret') / 100, vol = Math.max(0, v('dl_vol')) / 100, mu = Math.log(1 + r) / 12 - vol * vol / 24, sd = vol / Math.sqrt(12);
  const flat = Array(n).fill(Math.pow(1 + r, 1 / 12)), dip = flat.map((m, i) => i < 6 ? Math.pow(0.7, 1 / 6) : i < 18 ? Math.pow(1 / 0.7, 1 / 12) * m : m), down = flat.map((m, i) => i < 12 ? Math.pow(0.8, 1 / 12) : m);
  const S = [['dl_sUp', flat], ['dl_sDip', dip], ['dl_sDown', down]].map(([l, g]) => [l, dlRun(g, amt, k)]);
  let win = 0, sumL = 0, sumD = 0; const runs = 600; for (let i = 0; i < runs; i++){ const R = dlRun(dlPath(i + 7, n, mu, sd), amt, k); if (R.lump > R.dca) win++; sumL += R.lump; sumD += R.dca; }
  const rows = S.map(([l, R]) => [t(l), t('r_dlPair', {a: M(R.lump), b: M(R.dca)})]).concat([[t('r_dlAvgL'), M(sumL / runs)], [t('r_dlAvgD'), M(sumD / runs)], [t('r_dlWin'), PC(win / runs * 100), 'key']]);
  return {hero: {label: t('r_dlHero'), value: PC(win / runs * 100), sub: t('r_dlHeroS', {n: runs, y: yrs})}, rows, note: t('n_dcalump') + ' ' + MK_NA(),
    chart: {title: t('r_dlChart'), unit: '', fmt: x => M(x), labels: S.map(([l]) => t(l)), layers: [{name: t('r_dlLump'), cls: 'c-ink', values: S.map(([, R]) => R.lump)}, {name: t('r_dlDca'), cls: 'c-warm', values: S.map(([, R]) => R.dca)}]}};
};

/* ================= crypto staking ================= */
CALC.staking = function(){
  const c0 = Math.max(0, v('sx_coins')), rr = Math.max(0, v('sx_rate')) / 100 * (1 - Math.max(0, v('sx_fee')) / 100), y = Math.max(0.1, v('sx_years')), px = Math.max(0, v('sx_px')), tax = Math.max(0, v('sx_tax')) / 100;
  const isApr = mkSel('sx_rtype') !== 'apy', n = +mkSel('sx_comp') || 365, apy = isApr ? Math.pow(1 + rr / n, n) - 1 : rr, apr = isApr ? rr : n * (Math.pow(1 + rr, 1 / n) - 1);
  const c1 = c0 * Math.pow(1 + apy, y), earned = c1 - c0, net = c0 + earned * (1 - tax), lo = v('sx_lo') / 100, hi = v('sx_hi') / 100;
  const sc = [['sx_sLo', lo], ['sx_sMid', 0], ['sx_sHi', hi]].map(([l, g]) => [l, px * Math.pow(1 + g, y)]);
  const yrsT = []; for (let i = 1; i <= Math.min(20, Math.ceil(y)); i++){ const cc = c0 * Math.pow(1 + apy, Math.min(i, y)); yrsT.push([String(i), N(cc, 4), N(cc - c0, 4), M(cc * px)]); }
  return {hero: {label: t('r_sxHero'), value: N(net, 4), sub: t('r_sxHeroS', {a: PC(apy * 100), e: N(earned, 4)})},
    rows: [[t('r_sxApy'), PC(apy * 100)], [t('r_sxApr'), PC(apr * 100)], [t('r_sxEarned'), N(earned, 4)], ...(tax > 0 ? [[t('r_sxAfterTax'), N(net, 4)]] : []), ...sc.map(([l, p]) => [t(l, {p: mkPct((l === 'sx_sLo' ? lo : l === 'sx_sHi' ? hi : 0) * 100, 0)}), t('r_sxVal', {a: M(c0 * p), b: M(net * p)})])],
    note: t('n_staking') + ' ' + MK_NA(),
    chart: {title: t('r_sxChart'), unit: '', fmt: x => M(x), labels: sc.map(([l]) => t(l, {p: mkPct((l === 'sx_sLo' ? lo : l === 'sx_sHi' ? hi : 0) * 100, 0)})), layers: [{name: t('r_sxNo'), cls: 'c-ink', values: sc.map(([, p]) => c0 * p)}, {name: t('r_sxWith'), cls: 'c-warm', values: sc.map(([, p]) => net * p)}]},
    table: {title: t('r_sxTbl'), head: [t('mk_year'), t('r_sxCoins'), t('r_sxEarned'), t('r_sxValNow')], rows: yrsT}};
};

/* ================= the real cost of buying crypto ================= */
CALC.cryptocost = function(){
  const a = Math.max(0, v('kq_amt')), f = [v('kq_card'), v('kq_fx'), v('kq_fee'), v('kq_spread')].map(x => Math.max(0, x) / 100), wd = Math.max(0, v('kq_wd')), n = Math.max(1, Math.round(v('kq_n'))), sell = Math.max(0, v('kq_sell')) / 100;
  let x = a; const steps = [['f_kqCard', f[0]], ['f_kqFx', f[1]], ['f_kqFee', f[2]], ['f_kqSpread', f[3]]].map(([l, p]) => { const c = x * p; x -= c; return [l, c]; });
  x = Math.max(0, x - wd); const cost = a - x, pct = a > 0 ? cost / a * 100 : 0, back = x * (1 - sell) * (1 - f[3]), round = a > 0 ? (1 - back / a) * 100 : 0, need = back > 0 ? (a / back - 1) * 100 : 0;
  return {hero: {label: t('r_kqHero'), value: M(x), sub: t('r_kqHeroS', {p: N(pct, 2), v: M(cost)})},
    rows: steps.filter(s => s[1] > 0).map(([l, c]) => [t(l), '−' + M(c)]).concat(wd > 0 ? [[t('f_kqWd'), '−' + M(wd)]] : []).concat([[t('r_kqPct'), PC(pct), 'key'], [t('r_kqYear', {n}), M(cost * n)], [t('r_kqRound'), PC(round)], [t('r_kqNeed'), '+' + N(need, 2) + '%']]),
    note: t('n_cryptocost') + ' ' + MK_NA()};
};

/* ================= comparing shares (delayed data) ================= */
var SQ = {data: {}, busy: false};
function sqList(){ if (!Array.isArray(SET.sqSyms) || !SET.sqSyms.length) SET.sqSyms = ['SPY', 'QQQ', 'TEVA.TA']; return SET.sqSyms; }
function sqSvg(D){
  const L = D.filter(x => x && x.y && x.y.w && x.y.w.length > 2); if (!L.length) return '';
  const W = 320, H = 150, cols = ['var(--gold)', 'var(--ink)', '#2E7D9A', '#B4533C', '#6B5BA8', '#3C8D5A'];
  const series = L.map(x => x.y.w.map(p => p[1] / x.y.w[0][1] * 100 - 100)), all = series.flat(), mn = Math.min(0, ...all), mx = Math.max(0, ...all), n = Math.max(...series.map(s => s.length));
  const X = i => i / (n - 1) * W, Y = y => H - 8 - (y - mn) / ((mx - mn) || 1) * (H - 16);
  return `<svg viewBox="0 0 ${W} ${H}" class="op-svg" role="img" aria-label="${asEsc(t('sq_chart'))}"><line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" class="op-0"/>${series.map((s, k) => `<path d="${s.map((y, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1)).join(' ')}" fill="none" stroke="${cols[k % cols.length]}" stroke-width="2"/>`).join('')}</svg>
    <p class="fp-leg">${L.map((x, k) => `<span style="background:${cols[k % cols.length]}"></span>${asEsc(x.s)}`).join(' ')}</p>`;
}
function sqRender(){
  const box = document.getElementById('sq_box'); if (!box) return; const E = asEsc, L = sqList(), D = L.map(s => SQ.data[s]);
  const rowsH = D.map((x, i) => x ? `<li><div class="sq-r1"><span><b>${E(x.s)}</b><small class="wi-sm">${E(x.name || '')}${x.ex ? ' · ' + E(x.ex) : ''}</small></span><bdi dir="ltr" class="num">${E(N(x.px, 2))} ${E(x.cur)}</bdi></div>
      <div class="sq-r2"><span>${E(t('sq_day'))} <bdi dir="ltr" class="${(x.chg || 0) >= 0 ? 'up' : 'down'}">${E(mkPct(x.chg, 2))}</bdi></span>${x.y ? `<span>${E(t('sq_y'))} <bdi dir="ltr" class="${x.y.ret >= 0 ? 'up' : 'down'}">${E(mkPct(x.y.ret, 1))}</bdi></span><span>${E(t('sq_vol'))} <bdi dir="ltr">${E(N(x.y.vol, 0))}%</bdi></span><span>${E(t('sq_fromHi'))} <bdi dir="ltr">${E(mkPct((x.px / x.y.hi - 1) * 100, 1))}</bdi></span>` : ''}</div></li>`
    : `<li><b>${E(L[i])}</b> <small class="wi-sm">${E(SQ.busy ? t('m_wait') : t('sq_noData'))}</small></li>`).join('');
  box.innerHTML = `<div class="sq-add"><input type="text" id="sq_in" dir="ltr" maxlength="15" placeholder="${E(t('sq_ph'))}" aria-label="${E(t('sq_ph'))}"><button type="button" class="gold-btn" id="sq_addB">＋ ${E(t('sq_add'))}</button><button type="button" class="btn" id="sq_go">⟳ ${E(t('sq_refresh'))}</button></div>
    <div class="fp-acts">${L.map((s, i) => `<button type="button" class="as-chip" data-sqdel="${i}" aria-label="${E(t('mpa_del', {x: s}))}">${E(s)} ✕</button>`).join('')}</div>
    <ul class="sq-l">${rowsH}</ul>
    ${sqSvg(D)}<p class="fine">${E(t('sq_note'))}</p>`;
}
async function sqLoad(){
  if (SQ.busy) return; SQ.busy = true; sqRender();
  try { await Promise.all(sqList().map(async s => { try { const q = await mkQuote(s, true); if (q) SQ.data[s] = q; } catch (e) {} })); } finally { SQ.busy = false; }
  sqRender(); try { calc('stockcmp'); } catch (e) {}
}
CALC.stockcmp = function(){
  if (!document.querySelector('#sq_box .sq-add')) sqRender();
  const D = sqList().map(s => SQ.data[s]).filter(x => x && x.y), best = D.slice().sort((a, b) => b.y.ret - a.y.ret)[0], calm = D.slice().sort((a, b) => a.y.vol - b.y.vol)[0];
  return {hero: {label: t('sq_hero'), value: best ? best.s + ' ' + mkPct(best.y.ret, 1) : '—', sub: best ? t('sq_heroS', {x: calm.s, v: N(calm.y.vol, 0)}) : t('sq_heroNo')},
    rows: D.map(x => [x.s, t('sq_rowV', {r: mkPct(x.y.ret, 1), v: N(x.y.vol, 0), s: N(x.y.vol > 0 ? x.y.ret / x.y.vol : 0, 2)})]), note: t('n_stockcmp') + ' ' + MK_NA()};
};

/* ================= the world's stock exchanges ================= */
const XB = [
  ['tase', 'Asia/Jerusalem', [[1, 5, '09:59', '17:25']], 'ILS', '^TA125.TA', 'TA-125'],
  ['nyse', 'America/New_York', [[1, 5, '09:30', '16:00']], 'USD', '^GSPC', 'S&P 500'],
  ['nasdaq', 'America/New_York', [[1, 5, '09:30', '16:00']], 'USD', '^IXIC', 'Nasdaq'],
  ['lse', 'Europe/London', [[1, 5, '08:00', '16:30']], 'GBP', '^FTSE', 'FTSE 100'],
  ['xetra', 'Europe/Berlin', [[1, 5, '09:00', '17:30']], 'EUR', '^GDAXI', 'DAX'],
  ['euronext', 'Europe/Paris', [[1, 5, '09:00', '17:30']], 'EUR', '^FCHI', 'CAC 40'],
  ['tse', 'Asia/Tokyo', [[1, 5, '09:00', '11:30'], [1, 5, '12:30', '15:30']], 'JPY', '^N225', 'Nikkei 225'],
  ['hkex', 'Asia/Hong_Kong', [[1, 5, '09:30', '12:00'], [1, 5, '13:00', '16:00']], 'HKD', '^HSI', 'Hang Seng'],
  ['sse', 'Asia/Shanghai', [[1, 5, '09:30', '11:30'], [1, 5, '13:00', '15:00']], 'CNY', '000001.SS', 'SSE Composite'],
  ['tsx', 'America/Toronto', [[1, 5, '09:30', '16:00']], 'CAD', '^GSPTSE', 'S&P/TSX'],
  ['crypto', 'UTC', [[0, 6, '00:00', '24:00']], 'USD', 'BTC-USD', 'Bitcoin']
];
var XBQ = {data: {}, busy: false};
function xbParts(tz, d){ const f = new Intl.DateTimeFormat('en-GB', {timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false}).formatToParts(d), g = k => (f.find(p => p.type === k) || {}).value;
  return {wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), m: (+g('hour') % 24) * 60 + +g('minute')}; }
/* minutes east of UTC for a time zone right now (daylight saving included) */
function xbOff(tz){ try { const s = new Intl.DateTimeFormat('en-US', {timeZone: tz, timeZoneName: 'shortOffset'}).formatToParts(new Date()).find(p => p.type === 'timeZoneName').value, m = /GMT([+-])(\d+)(?::(\d+))?/.exec(s); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0; } catch (e) { return 0; } }
/* the exchange's local opening time shown in Israel time */
function xbIL(tz, hhmm){ const [h, m] = hhmm.split(':').map(Number), x = (((h * 60 + m) + xbOff('Asia/Jerusalem') - xbOff(tz)) % 1440 + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); }
function xbOpen(tz, S){ if (tz === 'UTC') return true; const p = xbParts(tz, new Date()); return S.some(([a, b, o, c]) => { const [oh, om] = o.split(':').map(Number), [ch, cm] = c.split(':').map(Number); return p.wd >= a && p.wd <= b && p.m >= oh * 60 + om && p.m < ch * 60 + cm; }); }
function xbRender(){
  const box = document.getElementById('xb_box'); if (!box) return; const E = asEsc;
  box.innerHTML = `<div class="btnrow"><button type="button" class="btn" id="xb_go">⟳ ${E(t('xb_refresh'))}</button></div><ul class="xb-l">${XB.map(([id, tz, S, cur, sym, idx]) => { const q = XBQ.data[sym], op = xbOpen(tz, S);
    return `<li><div class="xb-h"><b>${E(t('xb_' + id))}</b><span class="xb-st ${op ? 'on' : ''}">${E(t(op ? 'xb_open' : 'xb_closed'))}</span></div>
      <small>${id === 'crypto' ? E(t('xb_247')) : S.map(([, , o, c]) => '<bdi dir="ltr">' + E(xbIL(tz, o) + '–' + xbIL(tz, c)) + '</bdi>').join(', ') + ' ' + E(t('xb_ilTime'))} · ${E(cur)}${id === 'tase' ? ' · ' + E(t('xb_taseFri')) : ''}</small>
      <div class="xb-q"><span>${E(idx)}</span>${q ? `<b>${E(N(q.px, 2))}</b><span class="${(q.chg || 0) >= 0 ? 'up' : 'down'}">${E(mkPct(q.chg, 2))}</span>${q.y ? `<span class="${q.y.ret >= 0 ? 'up' : 'down'}">${E(t('xb_y', {p: mkPct(q.y.ret, 1)}))}</span>` : ''}` : `<span class="fine">${E(XBQ.busy ? t('m_wait') : '—')}</span>`}</div>
      <p class="fine">${E(t('xb_n_' + id))}</p></li>`; }).join('')}</ul>
    <h3 class="sec-t">${E(t('xb_taxT'))}</h3><ul class="list">${['xb_t1', 'xb_t2', 'xb_t3', 'xb_t4', 'xb_t5'].map(k => `<li>${E(t(k))}</li>`).join('')}</ul><p class="fine">${E(t('xb_note'))}</p>`;
}
async function xbLoad(){ if (XBQ.busy) return; XBQ.busy = true; xbRender(); try { await Promise.all(XB.map(async x => { try { const q = await mkQuote(x[4], true); if (q) XBQ.data[x[4]] = q; } catch (e) {} })); } finally { XBQ.busy = false; } xbRender(); }
CALC.exchanges = function(){
  if (!document.querySelector('#xb_box .xb-l')) xbRender();
  const open = XB.filter(x => x[0] !== 'crypto' && xbOpen(x[1], x[2]));
  return {hero: {label: t('xb_hero'), value: N(open.length, 0), sub: open.length ? open.map(x => t('xb_' + x[0])).join(', ') : t('xb_none')}, rows: [], note: t('xb_noteR') + ' ' + MK_NA()};
};

/* ================= price alerts (checked when the app is open) ================= */
function palList(){ if (!Array.isArray(SET.palList)) SET.palList = []; return SET.palList; }
function palRender(){
  const box = document.getElementById('pal_box'); if (!box) return; if (box.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return; const E = asEsc, L = palList();
  box.innerHTML = `<div class="sq-add"><input type="text" id="pal_s" dir="ltr" maxlength="15" placeholder="${E(t('sq_ph'))}" aria-label="${E(t('sq_ph'))}"><select id="pal_c" aria-label="${E(t('pal_when'))}"><option value="ab">${E(t('pal_ab'))}</option><option value="be">${E(t('pal_be'))}</option></select><input type="number" id="pal_p" inputmode="decimal" step="any" placeholder="${E(t('sq_px'))}" aria-label="${E(t('sq_px'))}"><button type="button" class="gold-btn" id="pal_add">＋ ${E(t('pal_add'))}</button></div>
    ${L.length ? `<ul class="al-list">${L.map((x, i) => `<li class="al-it"><span class="al-dot" aria-hidden="true">${x.hit ? '🔔' : '⏳'}</span><span class="al-tx"><b>${E(x.s)}</b> ${E(t(x.c === 'be' ? 'pal_be' : 'pal_ab'))} <span class="num">${E(N(x.p, 2))}</span><small class="wi-sm">${x.last ? E(t('pal_last', {v: N(x.last, 2), d: new Date(x.at).toLocaleString()})) : E(t('pal_notYet'))}${x.hit ? ' · ' + E(t('pal_hitAt', {d: new Date(x.hit).toLocaleString()})) : ''}</small></span><span class="al-b"><button type="button" class="as-chip" data-paldel="${i}" aria-label="${E(t('mpa_del', {x: x.s}))}">✕</button></span></li>`).join('')}</ul>` : `<p class="al-none">${E(t('pal_empty'))}</p>`}
    <div class="btnrow"><button type="button" class="btn" id="pal_chk">⟳ ${E(t('pal_check'))}</button></div><p class="fine">${E(t('pal_note'))}</p>`;
}
async function palCheck(force){
  const L = palList().filter(x => !x.hit); if (!L.length) return; if (!force && Date.now() - (SET.palAt || 0) < 3600e3) return; SET.palAt = Date.now();
  let hits = 0;
  for (const x of L.slice(0, 12)){ try { const q = await mkQuote(x.s); if (!q) continue; x.last = q.px; x.at = q.at || Date.now(); if (x.c === 'be' ? q.px <= x.p : q.px >= x.p){ x.hit = Date.now(); hits++; } } catch (e) {} }
  try { saveSet(); } catch (e) {} palRender(); try { if (hits) toast(t('pal_hit', {n: hits})); } catch (e) {}
}
CALC.pricealert = function(){ if (!document.querySelector('#pal_box .sq-add')) palRender(); const L = palList(); return {hero: {label: t('pal_hero'), value: N(L.filter(x => !x.hit).length, 0), sub: t('pal_heroS', {n: L.filter(x => x.hit).length})}, rows: [], note: t('pal_note') + ' ' + MK_NA()}; };
const alItems14 = alItems;
alItems = function(){ const out = alItems14.apply(this, arguments); try { const mute = SET.alMute || {}, done = SET.alDone || {}; if (!mute.px) palList().filter(x => x.hit && !done['px:' + x.s + x.p]).forEach(x => out.unshift({k: 'px', id: 'px:' + x.s + x.p, lvl: 2, txt: t('pal_alert', {s: x.s, c: t(x.c === 'be' ? 'pal_be' : 'pal_ab'), p: N(x.p, 2), v: N(x.last, 2)}), go: 'pricealert'})); } catch (e) {} return out; };
AL_KINDS.push(['px', 'al_kPx']);
setTimeout(() => { try { palCheck(false); } catch (e) {} }, 6000);

/* ================= the portfolio: today's change after a price update ================= */
const pfHold14 = pfHold;
pfHold = function(v2){
  const r = pfHold14.apply(this, arguments);
  try { const d = pfD(), H = d.hold.filter(x => x.qchg != null && x.qsrc), pa = v2.querySelector('.pa'); if (pa && H.length && !pa.querySelector('.pa-day')){ const now = H.reduce((s, x) => s + f10Hold(x), 0), before = H.reduce((s, x) => s + f10Hold(x) / (1 + x.qchg / 100), 0);
    pa.querySelector('summary').insertAdjacentHTML('afterend', `<p class="pa-day">${asEsc(t('pa_day', {v: mkSign(now - before), p: mkPct((now / before - 1) * 100, 2), n: H.length}))}</p>`); } } catch (e) {}
  return r;
};
/* ---- wiring ---- */
document.addEventListener('click', e => {
  if (!e.target.closest) return; let b;
  if (e.target.closest('#sq_addB')){ const el = document.getElementById('sq_in'), s = String(el.value || '').trim().toUpperCase(); if (!/^[A-Z0-9.\-^=]{1,15}$/.test(s)) return; const L = sqList(); if (!L.includes(s) && L.length < 6){ L.push(s); try { saveSet(); } catch (er) {} } el.value = ''; sqLoad(); return; }
  if (e.target.closest('#sq_go')){ sqLoad(); return; }
  if ((b = e.target.closest('[data-sqdel]'))){ sqList().splice(+b.dataset.sqdel, 1); try { saveSet(); } catch (er) {} sqRender(); try { calc('stockcmp'); } catch (er) {} return; }
  if (e.target.closest('#xb_go')){ xbLoad(); return; }
  if (e.target.closest('#pal_add')){ const s = String(document.getElementById('pal_s').value || '').trim().toUpperCase(), p = parseFloat(document.getElementById('pal_p').value); if (!/^[A-Z0-9.\-^=]{1,15}$/.test(s) || !(p > 0)) return; palList().push({s, c: document.getElementById('pal_c').value === 'be' ? 'be' : 'ab', p, rid: ''}); try { saveSet(); } catch (er) {} palRender(); palCheck(true); return; }
  if ((b = e.target.closest('[data-paldel]'))){ palList().splice(+b.dataset.paldel, 1); try { saveSet(); } catch (er) {} palRender(); return; }
  if (e.target.closest('#pal_chk')){ palCheck(true); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'sq_in'){ e.preventDefault(); const bt = document.getElementById('sq_addB'); if (bt) bt.click(); } });
(function(){
  const act14 = activate;
  activate = function(id){ const r = act14.apply(this, arguments);
    try { if (id === 'stockcmp'){ sqRender(); if (!Object.keys(SQ.data).length) sqLoad(); }
      else if (id === 'exchanges'){ xbRender(); if (!Object.keys(XBQ.data).length) xbLoad(); calc('exchanges'); }
      else if (id === 'pricealert'){ palRender(); calc('pricealert'); }
      else if (id === 'crashtest'){ crFill(); calc('crashtest'); }
      else if (id === 'taxloss' || id === 'rebalance') calc(id); } catch (e) {}
    return r; };
  const al14 = applyLang; applyLang = function(){ const r = al14.apply(this, arguments); try { sqRender(); xbRender(); palRender(); } catch (e) {} return r; };
  const st = document.createElement('style');
  st.textContent = '#panel-stockcmp .scn,#panel-exchanges .scn,#panel-pricealert .scn,#panel-taxloss .scn{display:none}'
    + '.op-svg{width:100%;height:auto;display:block;background:var(--surface);border:1px solid var(--line);border-radius:12px}.op-0{stroke:var(--line);stroke-width:1.5}.op-s{stroke:var(--ink-2);stroke-dasharray:3 3}.op-l{fill:none;stroke:var(--gold);stroke-width:2.5}'
    + '.op-ax{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);direction:ltr}'
    + '.sq-add{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.sq-add input,.sq-add select{flex:1 1 90px;min-width:0;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--surface);color:var(--ink);font:inherit}.sq-l{list-style:none;margin:8px 0;padding:0}.sq-l li{border-top:1px solid var(--line);padding:8px 0;color:var(--ink)}.sq-r1{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.sq-r2{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13px;color:var(--ink-2);margin-top:4px}'
    + '.xb-l{list-style:none;margin:0;padding:0}.xb-l li{border-top:1px solid var(--line);padding:10px 0;color:var(--ink)}.xb-h{display:flex;justify-content:space-between;align-items:center}.xb-st{font-size:12px;border-radius:99px;padding:2px 8px;background:var(--line);color:var(--ink-2)}.xb-st.on{background:rgba(27,138,75,.14);color:var(--good,#1b8a4b)}'
    + '.xb-l small{display:block;color:var(--ink-2);margin:2px 0}.xb-q{display:flex;gap:10px;flex-wrap:wrap;align-items:baseline;direction:ltr;justify-content:flex-end}.list{padding-inline-start:18px}.list li{margin:4px 0;color:var(--ink)}.pa-day{font-weight:600;margin:6px 0}';
  document.head.appendChild(st);
})();
/* these screens need every input (premium, stop, cost…) – hiding part under "more options" would mislead */
try { if (typeof UX_NOSIMPLE !== 'undefined') ['trade', 'holdsell', 'options', 'leverage', 'position'].forEach(id => { if (!UX_NOSIMPLE.includes(id)) UX_NOSIMPLE.push(id); }); } catch (e) {}
