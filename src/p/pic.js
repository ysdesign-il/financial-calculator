/* ---------- 13.19: "my picture" on Home – one card from your own tools ----------
   Bank accounts, this month's expenses and income, the fuel log, debts and reminders, turned into a
   financial health score with three things to do this month. Worked out on the phone; nothing is sent. */
const picE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function picData(){
  const P = {parts: [], rows: [], tips: []}, add = (k, got, max) => P.parts.push({k, got: Math.max(0, Math.min(max, got)), max}), M0 = x => M(Math.round(x), 0, 'ILS');
  /* this month: income and spending */
  let inc = 0, spend = 0;
  try { const ym = ymOf(new Date()), tt = expTotals(ym), ii = expIncome(ym); spend = tt.sum; inc = ii ? +ii.v || 0 : 0;
    if (spend > 0) P.rows.push(['exp', '🧾', t('pic_spend'), M0(spend), 'expenses']);
    if (inc > 0 && spend > 0){ const sr = (inc - spend) / inc; P.sr = sr; P.rows.push(['sr', '💰', t('pic_sr'), Math.round(sr * 100) + '%', 'expenses']);
      add('sr', sr >= 0.2 ? 25 : sr >= 0.1 ? 15 + (sr - 0.1) * 100 : sr >= 0 ? 5 + sr * 100 : 0, 25);
      if (sr < 0.1) P.tips.push({p: 60 + (0.1 - sr) * 100, ic: '💰', h: t(sr < 0 ? 'pic_tOver' : 'pic_tSave'), go: 'expenses'}); }
    const bud = expData().budgets || {}, over = Object.keys(bud).filter(k => +bud[k] > 0 && (tt.by[k] || 0) > +bud[k]);
    if (over.length){ add('bud', Math.max(0, 10 - over.length * 4), 10); P.tips.push({p: 40 + over.length * 5, ic: '📊', h: t('pic_tBud', {n: over.map(k => t('ec_' + k)).slice(0, 2).join(', ')}), go: 'expenses'}); }
    else if (Object.keys(bud).some(k => +bud[k] > 0)) add('bud', 10, 10);
  } catch (e) {}
  /* bank accounts: balance, overdraft, buffer, fees */
  try { const d = bkD(); if (d.accs.some(a => bkN(a.bal) || bkN(a.inc) || bkN(a.out))){
    const R = bkAdvise(), neg = R.A.filter(x => x.bal < 0), exp = bkN(d.exp) || spend || R.tot.out, months = exp > 0 ? (R.liquid + R.saved) / exp : NaN;
    P.rows.push(['bal', '🏦', t('pic_bal'), M0(R.tot.bal), 'bankacc']);
    if (isFinite(months)){ P.rows.push(['buf', '🛟', t('pic_buf'), t('pic_months', {n: N(Math.max(0, months), 1)}), 'bankacc']); add('buf', months >= 6 ? 25 : months >= 3 ? 18 + (months - 3) * 2.3 : months >= 1 ? 8 + (months - 1) * 5 : months * 8, 25);
      if (months < 3) P.tips.push({p: 70 - months * 10, ic: '🛟', h: t('pic_tBuf', {m: M0(Math.max(0, 3 * exp - R.liquid - R.saved))}), go: 'bankacc'}); }
    add('od', neg.length ? Math.max(0, 20 - neg.length * 8 - neg.reduce((s, x) => s - x.bal, 0) / 1000) : 20, 20);
    if (neg.length) P.tips.push({p: 90, ic: '➖', h: (R.out.find(o => o.k === 'move' || o.k === 'warn') || {h: t('pic_tOd')}).h, go: 'bankacc'});
    if (R.tot.fees > 0){ add('fee', R.tot.fees <= 300 ? 10 : R.tot.fees <= 600 ? 6 : 3, 10); if (R.tot.fees > 300) P.tips.push({p: 30 + R.tot.fees / 50, ic: '✂️', h: t('pic_tFee', {y: M0(R.tot.fees)}), go: 'bankacc'}); }
    const idle = R.out.find(o => o.k === 'idle'); if (idle) P.tips.push({p: 35, ic: '📈', h: idle.h, go: 'bankacc'});
  } } catch (e) {}
  /* debts (only if the debt plan was filled in) */
  try { if (TOUCHED.includes('debtplan')){ const debt = [1, 2, 3].reduce((s, i) => s + Math.max(0, v('dp_b' + i) || 0), 0); if (debt > 0){ P.rows.push(['debt', '💳', t('pic_debt'), M0(debt), 'debtplan']);
    const yr = (inc || 0) * 12; if (yr > 0){ const r = debt / yr; add('debt', r < 0.2 ? 15 : r < 0.5 ? 10 : r < 1 ? 5 : 0, 15); if (r >= 0.5) P.tips.push({p: 65, ic: '💳', h: t('pic_tDebt'), go: 'debtplan'}); } } } } catch (e) {}
  /* fuel */
  try { const S = fuLogStats(); if (S && isFinite(S.month)) P.rows.push(['fuel', '⛽', t('pic_fuel'), M0(S.month), 'fuelcalc']); } catch (e) {}
  /* reminders */
  try { const due = rmD().items.filter(rmDue); if (due.length) P.tips.push({p: 80 + due.length, ic: '⏰', h: t('pic_tRem', {n: due.length, t: due[0].title}), go: 'reminders'}); } catch (e) {}
  const got = P.parts.reduce((s, x) => s + x.got, 0), max = P.parts.reduce((s, x) => s + x.max, 0);
  P.score = max >= 40 ? Math.round(got / max * 100) : null;
  P.tips.sort((a, b) => b.p - a.p); P.tips = P.tips.slice(0, 3);
  return P;
}
function picRender(){
  const hh = $('#hh'); if (!hh) return; let box = $('#hpic'); const E = picE, P = picData();
  if (!box){ (($('#hrm') || hh)).insertAdjacentHTML('afterend', '<section id="hpic" class="hpic" aria-labelledby="hpic_t"></section>'); box = $('#hpic'); }
  if (!P.rows.length){ box.innerHTML = `<h3 class="sec-t" id="hpic_t">📊 ${E(t('pic_h'))}</h3><p class="fine">${E(t('pic_empty'))}</p><div class="btnrow"><button type="button" class="btn" data-go="bankacc">🏦 ${E(t('tab_bankacc'))}</button><button type="button" class="btn" data-go="expenses">🧾 ${E(t('tab_expenses'))}</button></div>`; return; }
  const sc = P.score, col = sc == null ? '' : sc >= 75 ? 'ok' : sc >= 50 ? 'mid' : 'low';
  box.innerHTML = `<h3 class="sec-t" id="hpic_t">📊 ${E(t('pic_h'))}</h3>
    <div class="hpic-top">${sc != null ? `<div class="hpic-score ${col}" role="img" aria-label="${E(t('pic_scoreA', {n: sc}))}" style="--p:${sc}"><b>${sc}</b><small dir="ltr">/100</small></div>` : ''}
    <div class="hpic-st"><b>${E(sc == null ? t('pic_more') : t(sc >= 75 ? 'pic_good' : sc >= 50 ? 'pic_ok' : 'pic_low'))}</b><small>${E(t('pic_from'))}</small></div></div>
    <div class="hpic-rows">${P.rows.map(([k, ic, l, val, go]) => `<button type="button" class="hpic-r" data-go="${go}"><span>${ic} ${E(l)}</span><b dir="ltr">${E(val)}</b></button>`).join('')}</div>
    ${P.tips.length ? `<h4 class="ds-q">${E(t('pic_tipsH'))}</h4><ol class="hpic-tips">${P.tips.map(x => `<li><button type="button" data-go="${x.go}"><span aria-hidden="true">${x.ic}</span> ${E(x.h)}</button></li>`).join('')}</ol>` : ''}
    <p class="fine sl-priv">🔒 ${E(t('pic_priv'))}</p>`;
}
{
  const chPic = calcHome; calcHome = function(){ const r = chPic.apply(this, arguments); try { picRender(); } catch (e) {} return r; };
  const actPic = activate; activate = function(id){ const r = actPic.apply(this, arguments); if (id === 'home'){ try { picRender(); } catch (e) {} } return r; };
  try { if (tab === 'home') picRender(); } catch (e) {}
}
