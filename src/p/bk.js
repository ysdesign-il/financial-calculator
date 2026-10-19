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
function bkRender(){
  const root = $('#bk_root'); if (!root) return;
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
    <p class="fine">${E(t('bk_roleH'))}</p>`;
}
/* what the assistant sees on this screen (nicknames and numbers only) */
function bkAiText(){
  const R = bkAdvise();
  return 'Bank accounts of the person (nicknames only, amounts in ILS per month unless stated):\n' + R.A.map(x => `- ${x.name}: bank ${t('bk_b_' + x.a.bank)}, type ${t('bk_t_' + x.a.type)}, balance ${Math.round(x.bal)}, overdraft limit ${Math.round(x.lim)}, overdraft rate ${N(x.od, 1)}%${x.odGuess ? ' (assumed)' : ''}, fees ${Math.round(x.fee)}/month, money in ${Math.round(x.inc)}, money out ${Math.round(x.out)}${x.a.sal ? ', salary paid here' : ''}`).join('\n')
    + `\nHousehold monthly expenses: ${Math.round(bkN(bkD().exp) || R.tot.out)}; wanted emergency buffer: ${bkD().buf} months. Bank of Israel rate now: ${R.boi || 'unknown'}%.\nThe app's own suggestions: ` + R.out.map(o => o.h).join(' | ')
    + '\nAdvise in plain words how to run these accounts together (where to keep what, transfers, standing orders, fees, buffer, idle money). Use their numbers. This is general information, not personal financial advice; mention checking with the bank where relevant.';
}
{ const aiStBk = aiScreenText; aiScreenText = function(id){ const s = aiStBk.apply(this, arguments); return id === 'bankacc' ? s + '\n' + bkAiText() : s; }; }
{ const aiChBk = aiChipKeys; aiChipKeys = function(id){ return id === 'bankacc' ? ['bk_c1', 'bk_c2', 'bk_c3'] : aiChBk.apply(this, arguments); }; }
let BK_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#bk_root')) return; const d = bkD();
  if (el.dataset.bki != null){ const a = d.accs[+el.dataset.bki]; if (!a) return; const k = el.dataset.bkk; a[k] = el.type === 'checkbox' ? el.checked : el.value; }
  else if (el.id === 'bk_exp') d.exp = el.value; else return;
  clearTimeout(BK_T); BK_T = setTimeout(() => { saveSet(); bkOut(); }, 250);
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#bk_root')) return; const d = bkD();
  if (el.dataset.bki != null){ const a = d.accs[+el.dataset.bki]; if (!a) return; const k = el.dataset.bkk; a[k] = el.type === 'checkbox' ? el.checked : el.value; saveSet(); if (k === 'type'){ bkRender(); const n = $(`#bk_root [data-bki="${el.dataset.bki}"][data-bkk="type"]`); if (n) n.focus(); } else bkOut(); return; }
  if (el.id === 'bk_buf'){ d.buf = +el.value; saveSet(); bkOut(); }
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
