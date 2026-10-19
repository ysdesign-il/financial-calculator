/* ---------- 13.15: bank accounts adviser – how to run several accounts together ----------
   Only a nickname per account (never an account number), the balance and the monthly flows.
   The advice is worked out on the phone: move money out of an overdraft, balance the monthly flows, cut fees,
   keep an emergency buffer and put idle money to work. The AI assistant can be asked on top. */
const BK_BANKS = ['hapoalim', 'leumi', 'discount', 'mizrahi', 'fibi', 'jerusalem', 'mercantile', 'yahav', 'massad', 'onezero', 'other'];
const BK_TYPES = ['cur', 'joint', 'biz', 'save'];
const bkE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let BK_ID = 1;
function bkD(){ const d = SET.bk && typeof SET.bk === 'object' ? SET.bk : (SET.bk = {}); if (!Array.isArray(d.accs)) d.accs = []; if (d.buf == null) d.buf = 3; return d; }
function bkNew(){ return {id: Date.now().toString(36) + (BK_ID++), nick: '', bank: 'other', type: 'cur', bal: '', lim: '', od: '', fee: '', inc: '', out: '', sal: false}; }
const bkN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪]/g, '')); return isFinite(x) ? x : 0; };
const bkM = x => M(Math.round(x), 0, 'ILS');
const bkName = (a, i) => String(a.nick || '').trim() || t('bk_accN', {n: i + 1});
const bkPrime = () => (typeof MKT !== 'undefined' && isFinite(+MKT.boi) ? +MKT.boi : 0) + 1.5;
/* the advice, highest saving first */
function bkAdvise(){
  const d = bkD(), A = d.accs.map((a, i) => ({a, i, name: bkName(a, i), bal: bkN(a.bal), lim: Math.abs(bkN(a.lim)), od: a.od === '' || a.od == null ? bkPrime() + 4 : bkN(a.od), odGuess: a.od === '' || a.od == null, fee: bkN(a.fee), inc: bkN(a.inc), out: bkN(a.out), save: a.type === 'save'}));
  A.forEach(x => { x.net = x.inc - x.out - x.fee; });
  const out = [], tot = {bal: A.reduce((s, x) => s + x.bal, 0), fees: A.reduce((s, x) => s + x.fee, 0) * 12, net: A.reduce((s, x) => s + x.net, 0), inc: A.reduce((s, x) => s + x.inc, 0), out: A.reduce((s, x) => s + x.out, 0)};
  if (!A.length) return {A, out, tot};
  /* 1) money in one account while another is in overdraft */
  const neg = A.filter(x => x.bal < 0).sort((p, q) => q.od - p.od), give = A.filter(x => x.bal > 0).map(x => ({x, can: Math.max(0, x.bal - Math.max(0, x.out))}));
  neg.forEach(n => { let need = -n.bal;
    give.sort((p, q) => (p.x.save - q.x.save) || (q.can - p.can)).forEach(g => { if (need <= 0 || g.can <= 0) return; const m = Math.min(need, g.can); g.can -= m; need -= m;
      out.push({k: 'move', pr: 1e6 + m * n.od / 100, h: t('bk_aMove', {m: bkM(m), a: g.x.name, b: n.name}), p: t('bk_aMoveP', {y: bkM(m * n.od / 100), r: N(n.od, 1)}) + (n.odGuess ? ' ' + t('bk_odGuess', {r: N(n.od, 1)}) : '')}); });
    if (need > 0) out.push({k: 'warn', pr: need * n.od / 100 + 1, h: t('bk_aOd', {a: n.name, m: bkM(need)}), p: t('bk_aOdP', {y: bkM(need * n.od / 100), r: N(n.od, 1)})}); });
  /* 2) accounts that drift down every month */
  A.filter(x => x.net < 0 && !x.save).forEach(x => {
    const room = x.bal + x.lim, months = room > 0 ? Math.floor(room / -x.net) : 0, src = A.filter(y => y !== x && y.net > 0).sort((p, q) => q.net - p.net)[0];
    out.push({k: src ? 'so' : 'warn', pr: -x.net * 12 * (x.od / 100) * 0.5 + 2, h: src ? t('bk_aSo', {m: bkM(-x.net), a: src.name, b: x.name}) : t('bk_aDrift', {a: x.name, m: bkM(-x.net)}), p: (room > 0 ? t('bk_aDriftP', {n: months}) : t('bk_aDriftNow')) + (src ? '' : ' ' + t('bk_aDriftFix'))});
  });
  if (tot.net < 0) out.push({k: 'warn', pr: -tot.net * 12, h: t('bk_aTotNeg', {m: bkM(-tot.net)}), p: t('bk_aTotNegP')});
  /* 3) fees */
  const feeAcc = A.filter(x => x.fee > 0 && !x.save);
  if (feeAcc.length >= 2){ const c = feeAcc.slice().sort((p, q) => (p.inc + p.out) - (q.inc + q.out))[0]; out.push({k: 'fee', pr: c.fee * 12, h: t('bk_aClose', {a: c.name, y: bkM(c.fee * 12)}), p: t('bk_aCloseP')}); }
  if (tot.fees > 0) out.push({k: 'fee', pr: tot.fees * 0.3, h: t('bk_aFees', {y: bkM(tot.fees)}), p: t('bk_aFeesP')});
  /* 4) emergency buffer and idle money */
  const exp = bkN(d.exp) || tot.out, buf = exp * (+d.buf || 3), liquid = A.filter(x => !x.save).reduce((s, x) => s + Math.max(0, x.bal), 0), saved = A.filter(x => x.save).reduce((s, x) => s + Math.max(0, x.bal), 0);
  const boi = typeof MKT !== 'undefined' && isFinite(+MKT.boi) ? +MKT.boi : 0;
  if (exp > 0){
    if (liquid + saved < buf){ const gap = buf - liquid - saved, mo = tot.net > 0 ? Math.ceil(gap / tot.net) : 0; out.push({k: 'buf', pr: gap * 0.05, h: t('bk_aBuf', {m: bkM(gap), b: bkM(buf), n: +d.buf || 3}), p: mo ? t('bk_aBufP', {n: mo}) : t('bk_aBufP0')}); }
    else if (liquid > Math.max(buf - saved, 0) + exp){ const idle = liquid - Math.max(buf - saved, 0) - exp, r = Math.max(0, boi - 0.3);
      out.push({k: 'idle', pr: idle * r / 100, h: t('bk_aIdle', {m: bkM(idle)}), p: (boi ? t('bk_aIdleP', {y: bkM(idle * r / 100), r: N(r, 2)}) : '') + ' ' + t('bk_aIdleP2')}); }
    else out.push({k: 'ok', pr: 0, h: t('bk_aBufOk', {b: bkM(buf)}), p: ''});
  }
  /* 5) the role of each account */
  const main = A.filter(x => !x.save).sort((p, q) => (q.inc + (q.a.sal ? 1e9 : 0)) - (p.inc + (p.a.sal ? 1e9 : 0)))[0];
  A.forEach(x => { x.role = x.save ? 'save' : x === main ? 'main' : x.a.type === 'biz' ? 'biz' : x.a.type === 'joint' ? 'joint' : (x.inc + x.out) < (main ? (main.inc + main.out) * 0.2 : 0) ? 'idle' : 'side'; });
  out.sort((p, q) => q.pr - p.pr);
  return {A, out, tot, buf, liquid, saved, boi};
}
function bkAdvRender(root){
  const d = bkD(), E = bkE;
  if (!d.accs.length){ d.accs.push(bkNew(), bkNew()); }
  const sel = (i, k, list, pre) => `<select data-bki="${i}" data-bkk="${k}" aria-label="${E(t('bk_f_' + k))}">${list.map(v => `<option value="${v}"${d.accs[i][k] === v ? ' selected' : ''}>${E(t(pre + v))}</option>`).join('')}</select>`;
  const num = (i, k, ph) => `<label class="bk-f"><span>${E(t('bk_f_' + k))}</span><input type="text" inputmode="decimal" dir="ltr" data-bki="${i}" data-bkk="${k}" value="${E(d.accs[i][k])}" placeholder="${E(ph || '0')}"></label>`;
  root.innerHTML = `<p class="fine">${E(t('bk_intro'))}</p>
    <div class="ds-warn" role="note"><span aria-hidden="true">🔒</span><p>${E(t('bk_noNum'))}</p></div>
    <div class="bk-accs">${d.accs.map((a, i) => `<fieldset class="bk-acc"><legend><input type="text" class="bk-nick" maxlength="30" dir="auto" data-bki="${i}" data-bkk="nick" value="${E(a.nick)}" placeholder="${E(t('bk_accN', {n: i + 1}))}" aria-label="${E(t('bk_f_nick'))}"></legend>
      <div class="bk-row">${sel(i, 'bank', BK_BANKS, 'bk_b_')}${sel(i, 'type', BK_TYPES, 'bk_t_')}</div>
      <div class="bk-grid">${num(i, 'bal', '-2,500')}${a.type === 'save' ? '' : num(i, 'lim') + num(i, 'od', N(bkPrime() + 4, 1) + '%')}${num(i, 'fee')}${num(i, 'inc')}${num(i, 'out')}</div>
      ${a.type === 'save' ? '' : `<label class="prn-ck"><input type="checkbox" data-bki="${i}" data-bkk="sal"${a.sal ? ' checked' : ''}> ${E(t('bk_f_sal'))}</label>`}
      ${d.accs.length > 1 ? `<button type="button" class="lg-a bk-rm" data-bkrm="${i}">${E(t('cv_rm'))}</button>` : ''}</fieldset>`).join('')}</div>
    <div class="btnrow">${d.accs.length < 8 ? `<button type="button" class="btn" id="bk_add">＋ ${E(t('bk_add'))}</button>` : ''}</div>
    <div class="bk-grid bk-house">${`<label class="bk-f"><span>${E(t('bk_exp'))}</span><input type="text" inputmode="decimal" dir="ltr" id="bk_exp" value="${E(d.exp == null ? '' : d.exp)}" placeholder="${E(t('bk_expPh'))}"></label>`}<label class="bk-f"><span>${E(t('bk_buf'))}</span><select id="bk_buf">${[1, 2, 3, 4, 6].map(n => `<option value="${n}"${+d.buf === n ? ' selected' : ''}>${E(t('bk_bufN', {n}))}</option>`).join('')}</select></label></div>
    <fieldset class="bk-flags"><legend>${E(t('bk_flagsH'))}</legend>${['biz', 'partner', 'unhappy', 'loan'].map(k => `<label class="prn-ck"><input type="checkbox" data-bkflag="${k}"${d.flags && d.flags[k] ? ' checked' : ''}> ${E(t('bk_fl_' + k))}</label>`).join('')}</fieldset>
    <div id="bk_out" aria-live="polite"></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="bk_ai">✦ ${E(t('bk_ai'))}</button><button type="button" class="mv" id="bk_clear">🗑️ ${E(t('bk_clear'))}</button></div>
    <p class="fine sl-priv">🔒 ${E(t('bk_priv'))}</p><p class="fine">${E(t('bk_disc'))}</p>`;
  bkOut();
}
function bkOut(){
  const box = $('#bk_out'); if (!box) return;
  const R = bkAdvise(), E = bkE, filled = R.A.some(x => x.bal || x.inc || x.out || x.fee);
  if (!filled){ box.innerHTML = `<p class="fine bk-empty">${E(t('bk_fill'))}</p>`; return; }
  const ic = {move: '↔️', so: '🔁', fee: '✂️', buf: '🛟', idle: '📈', warn: '⚠️', ok: '✅'};
  box.innerHTML = `<div class="bk-hero"><span>${E(t('bk_total'))}</span><b dir="ltr">${E(bkM(R.tot.bal))}</b><small>${E(t('bk_flow', {m: (R.tot.net >= 0 ? '+' : '') + bkM(R.tot.net)}))} · ${E(t('bk_feesY', {m: bkM(R.tot.fees)}))}</small></div>
    <h3 class="ds-q">${E(t('bk_advH'))}</h3>
    <ol class="bk-adv">${R.out.map(o => `<li class="bk-a bk-${o.k}"><span class="bk-ic" aria-hidden="true">${ic[o.k] || '•'}</span><div><b>${E(o.h)}</b>${o.p ? `<p>${E(o.p)}</p>` : ''}</div></li>`).join('') || `<li class="bk-a bk-ok"><span class="bk-ic">✅</span><div><b>${E(t('bk_allOk'))}</b></div></li>`}</ol>
    <h3 class="ds-q">${E(t('bk_planH'))}</h3>
    <table class="bk-plan"><thead><tr><th scope="col">${E(t('bk_f_nick'))}</th><th scope="col">${E(t('bk_role'))}</th><th scope="col">${E(t('bk_balS'))}</th><th scope="col">${E(t('bk_net'))}</th></tr></thead><tbody>${R.A.map(x => `<tr><th scope="row" dir="auto">${E(x.name)}</th><td>${E(t('bk_r_' + x.role))}</td><td dir="ltr" class="${x.bal < 0 ? 'neg' : ''}">${E(bkM(x.bal))}</td><td dir="ltr" class="${x.net < 0 ? 'neg' : ''}">${E((x.net >= 0 ? '+' : '') + bkM(x.net))}</td></tr>`).join('')}</tbody></table>
    <p class="fine">${E(t('bk_roleH'))}</p>
    <h3 class="ds-q">${E(t('bk_decH'))}</h3><ul class="bk-dec">${bkDecide(R).map(x => `<li class="bk-a bk-${x.k}"><span class="bk-ic" aria-hidden="true">${{open: '➕', close: '➖', move: '🔀', keep: '✋', info: 'ℹ️'}[x.k]}</span><div><b>${E(x.h)}</b>${x.p ? `<p>${E(x.p)}</p>` : ''}</div></li>`).join('')}</ul>
    <div class="btnrow"><button type="button" class="mv" data-bktab="switch">🔀 ${E(t('bk_tab_switch'))}</button></div>`;
}
/* open more accounts, close some, or move to another bank? */
function bkDecide(R){
  const d = bkD(), F = d.flags || {}, A = R.A, cur = A.filter(x => !x.save), pers = cur.filter(x => x.a.type === 'cur'), L = [];
  if (F.biz && !A.some(x => x.a.type === 'biz')) L.push({k: 'open', h: t('bk_dBiz'), p: t('bk_dBizP')});
  if (F.partner && !A.some(x => x.a.type === 'joint') && cur.length >= 2) L.push({k: 'open', h: t('bk_dJoint'), p: t('bk_dJointP')});
  const idle = A.filter(x => x.role === 'idle'); idle.forEach(x => L.push({k: 'close', h: t('bk_dCloseIdle', {a: x.name}), p: t('bk_dCloseIdleP') + (x.fee ? ' ' + t('bk_dSaveY', {y: bkM(x.fee * 12)}) : '')}));
  if (pers.length >= 3) L.push({k: 'close', h: t('bk_dTooMany', {n: pers.length}), p: t('bk_dTooManyP')});
  const avgFee = cur.length ? cur.reduce((s, x) => s + x.fee, 0) / cur.length : 0;
  if (F.unhappy || avgFee > 12) L.push({k: 'move', h: t('bk_dMove'), p: t(avgFee > 12 ? 'bk_dMoveFee' : 'bk_dMoveP', {m: bkM(avgFee)}) + ' ' + t('bk_dMoveHow')});
  if (F.loan) L.push({k: 'info', h: t('bk_dLoan'), p: t('bk_dLoanP')});
  if (!L.some(x => x.k === 'open')) L.push({k: 'keep', h: t('bk_dNoOpen'), p: t('bk_dNoOpenP')});
  return L;
}
var BKT = 'adv';
const BK_TABS = [['adv', '🧭'], ['od', '➖'], ['fees', '🧾'], ['save', '📈'], ['switch', '🔀']];
function bkRender(){
  const root = $('#bk_root'); if (!root) return; const E = bkE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist" aria-label="${E(t('tab_bankacc'))}">${BK_TABS.map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${BKT === k ? ' on' : ''}" aria-selected="${BKT === k}" data-bktab="${k}">${ic} ${E(t('bk_tab_' + k))}</button>`).join('')}</div><div id="bk_view"></div>`;
  const v = $('#bk_view'); if (BKT === 'adv') bkAdvRender(v); else if (BKT === 'od') bkOdRender(v); else if (BKT === 'fees') bkFeesRender(v); else if (BKT === 'save') bkSaveRender(v); else bkSwitchRender(v);
}
const bkIn = (id, lab, val, ph, unit) => `<label class="bk-f"><span>${bkE(lab)}${unit ? ' (' + bkE(unit) + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" id="${id}" data-bkt="1" value="${bkE(val == null ? '' : val)}" placeholder="${bkE(ph == null ? '' : ph)}"></label>`;
const bkT = () => { const d = bkD(); return d.t || (d.t = {}); };
const bkV = (id, def) => { const v = bkT()[id]; return v === '' || v == null ? def : bkN(v); };
/* the cost of the overdraft */
function bkOdRender(v){
  const E = bkE, T0 = bkT(), od = bkPrime() + 4, ln = bkPrime() + 2;
  v.innerHTML = `<p class="fine">${E(t('bk_odIntro'))}</p><div class="bk-grid">${bkIn('od_amt', t('bk_odAmt'), T0.od_amt, '5000', '₪')}${bkIn('od_days', t('bk_odDays'), T0.od_days, '30')}${bkIn('od_rate', t('bk_odRate'), T0.od_rate, N(od, 1), '%')}${bkIn('od_loan', t('bk_odLoan'), T0.od_loan, N(ln, 1), '%')}</div><div id="bk_tout" aria-live="polite"></div>`;
  bkOdOut();
}
function bkOdOut(){
  const box = $('#bk_tout'); if (!box) return; const E = bkE, amt = Math.abs(bkV('od_amt', 0)), days = Math.min(31, Math.max(0, bkV('od_days', 30))), r = bkV('od_rate', bkPrime() + 4), lr = bkV('od_loan', bkPrime() + 2);
  if (!amt){ box.innerHTML = `<p class="fine bk-empty">${E(t('bk_fill'))}</p>`; return; }
  const mo = amt * r / 100 / 365 * days, yr = mo * 12, loanYr = amt * lr / 100, save = Math.max(0, yr - loanYr);
  box.innerHTML = `<div class="bk-hero"><span>${E(t('bk_odYear'))}</span><b dir="ltr">${E(bkM(yr))}</b><small>${E(t('bk_odMonth', {m: bkM(mo)}))}</small></div>
    <ol class="bk-adv">${days >= 20 ? `<li class="bk-a bk-move"><span class="bk-ic">🔁</span><div><b>${E(t('bk_odFixed'))}</b><p>${E(t('bk_odFixedP', {y: bkM(save), r: N(lr, 1)}))}</p></div></li>` : ''}
    <li class="bk-a"><span class="bk-ic">💡</span><div><b>${E(t('bk_odTip1'))}</b><p>${E(t('bk_odTip1P'))}</p></div></li>
    <li class="bk-a"><span class="bk-ic">📅</span><div><b>${E(t('bk_odTip2'))}</b><p>${E(t('bk_odTip2P'))}</p></div></li></ol>`;
}
/* the 2026 fee reform: what the account should cost */
function bkFeesRender(v){
  const E = bkE, T0 = bkT(), curFee = bkD().accs.filter(a => a.type !== 'save').reduce((s, a) => s + bkN(a.fee), 0);
  v.innerHTML = `<p class="fine">${E(t('bk_feIntro'))}</p><div class="bk-grid">${bkIn('fe_act', t('bk_feAct'), T0.fe_act, '30')}${bkIn('fe_now', t('bk_feNow'), T0.fe_now, curFee ? String(curFee) : '25', '₪')}${bkIn('fe_card', t('bk_feCard'), T0.fe_card, '10', '₪')}</div><div id="bk_tout" aria-live="polite"></div>
    <p class="fine">${E(t('bk_feSrc'))} <a href="https://www.boi.org.il/media/m4whhvkl/202616.pdf" target="_blank" rel="noopener">${E(t('bk_feSrcL'))}</a></p>`;
  bkFeesOut();
}
function bkFeesOut(){
  const box = $('#bk_tout'); if (!box) return; const E = bkE, act = Math.max(0, bkV('fe_act', 30)), now = bkV('fe_now', 25), card = bkV('fe_card', 10);
  const cap = act <= 2 ? 5 : act <= 100 ? 10 : 10 + (act - 100), capCard = Math.min(card, 7), save = Math.max(0, (now - cap) + (card - capCard)) * 12;
  box.innerHTML = `<div class="bk-hero"><span>${E(t('bk_feCap'))}</span><b dir="ltr">${E(bkM(cap))} / ${E(t('bk_mo'))}</b><small>${E(t('bk_feCardCap', {m: bkM(capCard)}))}</small></div>
    <ol class="bk-adv"><li class="bk-a ${save > 0 ? 'bk-move' : 'bk-ok'}"><span class="bk-ic">${save > 0 ? '✂️' : '✅'}</span><div><b>${E(save > 0 ? t('bk_feSave', {y: bkM(save)}) : t('bk_feOk'))}</b><p>${E(t(save > 0 ? 'bk_feSaveP' : 'bk_feOkP'))}</p></div></li>
    <li class="bk-a"><span class="bk-ic">📅</span><div><b>${E(t('bk_feWhen'))}</b><p>${E(t('bk_feWhenP'))}</p></div></li></ol>`;
}
/* where to keep savings: current account, deposits or a money-market fund – after tax and inflation */
function bkSaveRender(v){
  const E = bkE, T0 = bkT(), boi = typeof MKT !== 'undefined' && isFinite(+MKT.boi) ? +MKT.boi : 3, inf = typeof MKT !== 'undefined' && isFinite(+MKT.cpi) ? +MKT.cpi : 2.5;
  v.innerHTML = `<p class="fine">${E(t('bk_svIntro'))}</p><div class="bk-grid">${bkIn('sv_amt', t('bk_svAmt'), T0.sv_amt, '50000', '₪')}${bkIn('sv_mo', t('bk_svMo'), T0.sv_mo, '12')}${bkIn('sv_dep', t('bk_svDep'), T0.sv_dep, N(Math.max(0, boi - 0.5), 2), '%')}${bkIn('sv_real', t('bk_svReal'), T0.sv_real, '1', '%')}${bkIn('sv_mmf', t('bk_svMmf'), T0.sv_mmf, N(Math.max(0, boi - 0.25), 2), '%')}${bkIn('sv_inf', t('bk_svInf'), T0.sv_inf, N(inf, 1), '%')}</div><div id="bk_tout" aria-live="polite"></div>`;
  bkSaveOut();
}
function bkSaveOut(){
  const box = $('#bk_tout'); if (!box) return; const E = bkE, boi = typeof MKT !== 'undefined' && isFinite(+MKT.boi) ? +MKT.boi : 3, infD = typeof MKT !== 'undefined' && isFinite(+MKT.cpi) ? +MKT.cpi : 2.5;
  const A = bkV('sv_amt', 0), m = Math.max(1, bkV('sv_mo', 12)), y = m / 12, dep = bkV('sv_dep', Math.max(0, boi - 0.5)) / 100, real = bkV('sv_real', 1) / 100, mmf = bkV('sv_mmf', Math.max(0, boi - 0.25)) / 100, inf = bkV('sv_inf', infD) / 100;
  if (!A){ box.innerHTML = `<p class="fine bk-empty">${E(t('bk_fill'))}</p>`; return; }
  const infAmt = A * (Math.pow(1 + inf, y) - 1);
  const rows = [['cur', 0, 0], ['dep', A * dep * y, 0.15], ['cpi', A * (Math.pow(1 + inf, y) * Math.pow(1 + real, y) - 1), 'real'], ['mmf', A * (Math.pow(1 + mmf, y) - 1), 'real']].map(([k, gross, tax]) => {
    const tx = tax === 'real' ? Math.max(0, gross - infAmt) * 0.25 : gross * tax, net = gross - tx; return {k, gross, tx, net, realNet: net - infAmt}; });
  const best = rows.slice(1).sort((p, q) => q.net - p.net)[0];
  box.innerHTML = `<div class="bk-scroll"><table class="bk-plan"><thead><tr><th scope="col">${E(t('bk_svWhere'))}</th><th scope="col">${E(t('bk_svGross'))}</th><th scope="col">${E(t('bk_svTax'))}</th><th scope="col">${E(t('bk_svNet'))}</th><th scope="col">${E(t('bk_svRealNet'))}</th></tr></thead><tbody>${rows.map(r => `<tr${r === best ? ' class="best"' : ''}><th scope="row">${E(t('bk_sv_' + r.k))}</th><td dir="ltr">${E(bkM(r.gross))}</td><td dir="ltr">${E(bkM(r.tx))}</td><td dir="ltr"><b>${E(bkM(r.net))}</b></td><td dir="ltr" class="${r.realNet < 0 ? 'neg' : ''}">${E(bkM(r.realNet))}</td></tr>`).join('')}</tbody></table></div>
    <ol class="bk-adv"><li class="bk-a bk-ok"><span class="bk-ic">🏆</span><div><b>${E(t('bk_svBest', {n: t('bk_sv_' + best.k), m: bkM(best.net)}))}</b><p>${E(t('bk_svBestP'))}</p></div></li>
    <li class="bk-a"><span class="bk-ic">⚠️</span><div><b>${E(t('bk_svCur'))}</b><p>${E(t('bk_svCurP', {m: bkM(infAmt)}))}</p></div></li></ol>
    <p class="fine">${E(t('bk_svTaxNote'))}</p>`;
}
/* moving to another bank (online switching) */
function bkSwitchRender(v){
  const E = bkE, steps = ['s1', 's2', 's3', 's4', 's5', 's6'];
  v.innerHTML = `<p class="fine">${E(t('bk_swIntro'))}</p>
    <h3 class="ds-q">${E(t('bk_swHow'))}</h3><ol class="bk-steps">${steps.map(k => `<li>${E(t('bk_sw_' + k))}</li>`).join('')}</ol>
    <div class="bk-two"><div class="bk-a bk-ok"><div><b>✅ ${E(t('bk_swYes'))}</b><p>${E(t('bk_swYesL'))}</p></div></div><div class="bk-a bk-warn"><div><b>⛔ ${E(t('bk_swNo'))}</b><p>${E(t('bk_swNoL'))}</p></div></div></div>
    <h3 class="ds-q">${E(t('bk_swVs'))}</h3><p>${E(t('bk_swVsP'))}</p>
    <p class="fine">${E(t('bk_swCant'))}</p>
    <p class="fine">${E(t('bk_swSrc'))} <a href="https://www.kolzchut.org.il/he/%D7%9E%D7%A2%D7%91%D7%A8_%D7%91%D7%99%D7%9F_%D7%91%D7%A0%D7%A7%D7%99%D7%9D_%D7%91%D7%90%D7%95%D7%A4%D7%9F_%D7%9E%D7%A7%D7%95%D7%95%D7%9F_(%D7%A0%D7%99%D7%95%D7%93)" target="_blank" rel="noopener">${E(t('bk_swSrcL'))}</a></p>`;
}
/* what the assistant sees on this screen (nicknames and numbers only) */
function bkAiText(){
  const R = bkAdvise();
  return 'Bank accounts of the person (nicknames only, amounts in ILS per month unless stated):\n' + R.A.map(x => `- ${x.name}: bank ${t('bk_b_' + x.a.bank)}, type ${t('bk_t_' + x.a.type)}, balance ${Math.round(x.bal)}, overdraft limit ${Math.round(x.lim)}, overdraft rate ${N(x.od, 1)}%${x.odGuess ? ' (assumed)' : ''}, fees ${Math.round(x.fee)}/month, money in ${Math.round(x.inc)}, money out ${Math.round(x.out)}${x.a.sal ? ', salary paid here' : ''}`).join('\n')
    + (() => { const F = bkD().flags || {}, f = Object.keys(F).filter(k => F[k]); return f.length ? '\nAbout them: ' + f.map(k => t('bk_fl_' + k)).join('; ') : ''; })()
    + `\nHousehold monthly expenses: ${Math.round(bkN(bkD().exp) || R.tot.out)}; wanted emergency buffer: ${bkD().buf} months. Bank of Israel rate now: ${R.boi || 'unknown'}%.\nThe app's own suggestions: ` + R.out.map(o => o.h).join(' | ') + '\nOpen/close/switch suggestions: ' + bkDecide(R).map(o => o.h).join(' | ')
    + '\nAdvise in plain words how to run these accounts together (where to keep what, transfers, standing orders, fees, buffer, idle money). Use their numbers. This is general information, not personal financial advice; mention checking with the bank where relevant.';
}
{ const aiStBk = aiScreenText; aiScreenText = function(id){ const s = aiStBk.apply(this, arguments); return id === 'bankacc' ? s + '\n' + bkAiText() : s; }; }
{ const aiChBk = aiChipKeys; aiChipKeys = function(id){ return id === 'bankacc' ? ['bk_c1', 'bk_c2', 'bk_c3', 'bk_c4'] : aiChBk.apply(this, arguments); }; }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-bktab]'); if (!b || !b.closest('#bk_root')) return; BKT = b.dataset.bktab; bkRender(); const n = $(`#bk_root .bk-tabs [data-bktab="${BKT}"]`); if (n) n.focus(); const r = $('#bk_root'); if (r && b.closest('#bk_view')) r.scrollIntoView({block: 'start', behavior: 'smooth'}); });
let BK_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#bk_root')) return; const d = bkD();
  if (el.dataset.bki != null){ const a = d.accs[+el.dataset.bki]; if (!a) return; const k = el.dataset.bkk; a[k] = el.type === 'checkbox' ? el.checked : el.value; }
  else if (el.id === 'bk_exp') d.exp = el.value;
  else if (el.dataset.bkt){ bkT()[el.id] = el.value; clearTimeout(BK_T); BK_T = setTimeout(() => { saveSet(); ({od: bkOdOut, fees: bkFeesOut, save: bkSaveOut})[BKT] && ({od: bkOdOut, fees: bkFeesOut, save: bkSaveOut})[BKT](); }, 200); return; }
  else return;
  clearTimeout(BK_T); BK_T = setTimeout(() => { saveSet(); bkOut(); }, 250);
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#bk_root')) return; const d = bkD();
  if (el.dataset.bki != null){ const a = d.accs[+el.dataset.bki]; if (!a) return; const k = el.dataset.bkk; a[k] = el.type === 'checkbox' ? el.checked : el.value; saveSet(); if (k === 'type'){ bkRender(); const n = $(`#bk_root [data-bki="${el.dataset.bki}"][data-bkk="type"]`); if (n) n.focus(); } else bkOut(); return; }
  if (el.id === 'bk_buf'){ d.buf = +el.value; saveSet(); bkOut(); return; }
  if (el.dataset.bkflag){ (d.flags || (d.flags = {}))[el.dataset.bkflag] = el.checked; saveSet(); bkOut(); }
});
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#bk_root')) return; const d = bkD(); let b;
  if (t0.closest('#bk_add')){ d.accs.push(bkNew()); saveSet(); bkRender(); const n = $$('#bk_root .bk-nick'); if (n.length) n[n.length - 1].focus(); return; }
  if ((b = t0.closest('[data-bkrm]'))){ d.accs.splice(+b.dataset.bkrm, 1); saveSet(); bkRender(); return; }
  if (t0.closest('#bk_clear')){ if (!confirm(t('bk_clearSure'))) return; SET.bk = {}; saveSet(); bkRender(); return; }
  if (t0.closest('#bk_ai')){ try { aiOpen(); } catch (er) {} return; }
});
CALC.bankacc = () => null;
try { GS_SYN.bankacc = 'חשבון בנק חשבונות בנק עו"ש עובר ושב מינוס מסגרת אשראי עמלות בנק פיקדון ניהול חשבונות כמה חשבונות bank account accounts overdraft fees checking savings حساب بنكي حسابات سحب على المكشوف عمولات'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindBk = svKind; svKind = function(id){ return id === 'bankacc' ? '' : svKindBk.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('bankacc'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('bankacc'); } catch (e) {}
{
  const actBk = activate; activate = function(id){ const r = actBk.apply(this, arguments); if (id === 'bankacc') bkRender(); return r; };
  const alBk = applyLang; applyLang = function(){ const r = alBk.apply(this, arguments); try { if (tab === 'bankacc') bkRender(); } catch (e) {} return r; };
  try { if (tab === 'bankacc') bkRender(); } catch (e) {}
}
