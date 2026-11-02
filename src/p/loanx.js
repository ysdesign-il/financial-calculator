/* ---------- 13.59: the loan calculator – the interest step by step (Bank of Israel → prime → what the bank offers → what you pay),
   quick buttons for "prime plus / minus", and a plain guide to every loan option ---------- */
var LX = null;                                   /* the last calculation's interest parts, for the card */
const lxE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const lxNum = x => { const r = Math.round(Math.abs(+x) * 100) / 100; return N(r, r % 1 ? (Math.round(r * 100) % 10 ? 2 : 1) : 0); };
const lxSg = x => (x > 0 ? '+ ' : x < 0 ? '− ' : '') + lxNum(x) + '%';
const calcLoanX = CALC.loan;
CALC.loan = function(){
  const res = calcLoanX.apply(this, arguments);
  try {
    const rt = ($('#l_rateType') || {}).value || 'fixed', mode = ($('#l_mode') || {}).value || 'pay';
    const live = typeof MKT === 'object' && MKT.boi > 0 ? +MKT.boi : NaN;
    const boi = rt === 'prime' ? v('l_boi') : live, spread = rt === 'prime' ? v('l_spread') : 1.5;
    const prime = isFinite(boi) ? boi + spread : NaN, margin = rt === 'prime' ? v('l_margin') : NaN;
    const rate = rt === 'prime' ? Math.max(0, prime + margin) : Math.max(0, v('l_rate'));
    const aprRow = res && res.rows ? res.rows.find(r => r[0] === t('r_apr')) : null;
    LX = {rt, mode, boi, spread, prime, margin, rate, live, apr: aprRow ? aprRow[1] : '', every: v('l_varEvery'),
      date: typeof MKT === 'object' ? MKT.boiDate : '', next: typeof MKT === 'object' ? MKT.boiNext : ''};
    /* the old one-line rows are now in the card above, with an explanation each */
    if (res && res.rows && mode !== 'rate'){
      const drop = ['r_lBoi', 'r_lSpread', 'r_lPrime', 'r_lMargin', 'r_lYour', 'r_lBoiNow', 'r_lPrimeNow'].map(k => t(k));
      res.rows = res.rows.filter(r => !drop.includes(r[0]));
    }
  } catch (e) { LX = null; }
  return res;
};
function lxRow(k, val, sub, what, key){
  return `<div class="lx-row${key ? ' key' : ''}"><div class="lx-top"><span class="lx-k">${lxE(k)}</span><b class="lx-v num"${/^[+−-]/.test(String(val)) ? ' dir="ltr"' : ''}>${lxE(val)}</b></div>`
    + (sub ? `<div class="lx-sub">${lxE(sub)}</div>` : '')
    + (what ? `<details class="lx-what"><summary>${lxE(t('lx_what'))}</summary><p>${lxE(what)}</p></details>` : '') + '</div>';
}
function lxCard(){
  const host = $('#led-loan'); if (!host) return;
  let c = document.getElementById('lx-card');
  if (!LX || LX.mode === 'rate'){ if (c) c.hidden = true; return; }
  if (!c){ host.insertAdjacentHTML('beforebegin', '<section id="lx-card" class="lx-card" aria-labelledby="lx-h"></section>'); c = document.getElementById('lx-card'); }
  c.hidden = false;
  const L = LX, has = isFinite(L.boi), when = [L.date ? t('lx_asOf', {d: L.date}) : '', L.next ? t('lx_next', {d: L.next}) : ''].filter(Boolean).join(' · ');
  let offer, offSub, yourSub;
  if (L.rt === 'prime'){
    offer = t('lx_offPrime', {m: lxSg(L.margin)});
    offSub = L.margin > 0 ? t('lx_offAbove', {m: lxNum(L.margin)}) : L.margin < 0 ? t('lx_offBelow', {m: lxNum(L.margin)}) : t('lx_offFlat');
    yourSub = t('lx_yourPrime', {p: PC(L.prime), m: lxSg(L.margin), r: PC(L.rate)});
  } else {
    offer = L.rt === 'var' ? t('lx_offVar', {r: PC(L.rate), y: N(L.every || 5, 0)}) : t('lx_offFix', {r: PC(L.rate)});
    offSub = has ? t(L.rate >= L.prime ? 'lx_vsPrimeUp' : 'lx_vsPrimeDown', {d: N(Math.abs(L.rate - L.prime), 2)}) : '';
    yourSub = t(L.rt === 'var' ? 'lx_yourVar' : 'lx_yourFix');
  }
  c.innerHTML = `<h3 id="lx-h">${lxE(t('lx_h'))}</h3><p class="lx-intro">${lxE(t('lx_intro'))}</p>`
    + lxRow(t('lx_boi'), has ? PC(L.boi) : '—', (L.rt === 'prime' && isFinite(L.live) && Math.abs(L.boi - L.live) > 1e-9) ? t('lx_boiYours', {r: PC(L.live)}) : when, t('lx_boiW'))
    + lxRow(t('lx_spread'), '+ ' + lxNum(L.spread) + '%', t('lx_spreadSub'), t('lx_spreadW'))
    + lxRow(t('lx_prime'), has ? PC(L.prime) : '—', has ? t('lx_primeSub', {b: PC(L.boi), s: lxNum(L.spread)}) : '', t('lx_primeW'))
    + lxRow(t('lx_offer'), offer, offSub, t(L.rt === 'prime' ? 'lx_offerW' : 'lx_offerWfix'))
    + lxRow(t('lx_your'), t('lx_perYear', {r: PC(L.rate)}), yourSub, t(L.rt === 'prime' ? 'lx_yourW' : L.rt === 'var' ? 'lx_yourWvar' : 'lx_yourWfix'), true)
    + (L.apr ? lxRow(t('lx_apr'), strip(L.apr), '', t('lx_aprW')) : '')
    + `<p class="fine lx-fine">${lxE(t('lx_fine'))}</p>`;
}
const showLX = show;
show = function(id, res){ showLX.apply(this, arguments); if (id === 'loan'){ try { lxCard(); lxChips(); } catch (e) {} } };
/* quick buttons under "the bank's margin": prime −1 … +3, and the sentence the bank says */
function lxChips(){
  const f = $('#l_margin'), box = f && f.closest('.field'); if (!box) return;
  let w = document.getElementById('lx-chipbox');
  if (!w){
    box.insertAdjacentHTML('afterend', `<div class="field wide lx-chipbox" id="lx-chipbox"><span class="lx-ask">${lxE(t('lx_ask'))}</span><div class="lx-chips" role="group" aria-label="${lxE(t('lx_chipsAria'))}">${[-1, -0.5, 0, 0.5, 1, 2, 3].map(x => `<button type="button" class="lx-chip" data-lxm="${x}">${lxE(t('lx_chip', {m: lxSg(x)}))}</button>`).join('')}</div><p class="lx-say" aria-live="polite"></p></div>`);
    w = document.getElementById('lx-chipbox');
  }
  w.hidden = !!(box.hidden || box.closest('[hidden]') || !LX || LX.rt !== 'prime');
  const m = v('l_margin');
  w.querySelectorAll('[data-lxm]').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(+b.dataset.lxm - m) < 1e-9)));
  const say = w.querySelector('.lx-say');
  if (say && LX && LX.rt === 'prime') say.textContent = t('lx_say', {m: lxSg(m), p: PC(LX.prime), r: PC(LX.rate)});
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-lxm]'); if (!b) return;
  const f = $('#l_margin'); if (!f) return;
  f.value = String(+b.dataset.lxm); f.dispatchEvent(new Event('input', {bubbles: true})); f.dispatchEvent(new Event('change', {bubbles: true}));
});
/* the guide: every loan option, what it is and what it means for you */
const LX_GUIDE = [
  ['lx_g_rate', ['lx_g_fix', 'lx_g_var', 'lx_g_prime']],
  ['lx_g_link', ['lx_g_nolink', 'lx_g_cpi']],
  ['lx_g_method', ['lx_g_spitzer', 'lx_g_equal', 'lx_g_bullet']],
  ['lx_g_more', ['lx_g_grace', 'lx_g_extra', 'lx_g_pre', 'lx_g_fees', 'lx_g_apr', 'lx_g_ins']],
  ['lx_g_ask', ['lx_g_q1', 'lx_g_q2', 'lx_g_q3', 'lx_g_q4', 'lx_g_q5']]
];
function lxGuide(){
  const p = document.getElementById('panel-loan'), inputs = p && p.querySelector('.inputs'); if (!inputs || document.getElementById('lx-guide')) return;
  inputs.insertAdjacentHTML('beforeend', `<details id="lx-guide" class="lx-guide"><summary>${lxE(t('lx_g_h'))}</summary><p class="fine">${lxE(t('lx_g_intro'))}</p>`
    + LX_GUIDE.map(([h, ks]) => `<h4>${lxE(t(h))}</h4><dl>` + ks.map(k => `<dt>${lxE(t(k))}</dt><dd>${lxE(t(k + 'D'))}</dd>`).join('') + '</dl>').join('')
    + `<p class="fine">${lxE(t('lx_fine'))}</p></details>`);
}
const actLX = activate;
activate = function(id){ const r = actLX.apply(this, arguments); if (id === 'loan'){ try { lxGuide(); } catch (e) {} } return r; };
setTimeout(() => { try { if (typeof tab !== 'undefined' && tab === 'loan') lxGuide(); } catch (e) {} }, 0);
(function(){ const st = document.createElement('style'); st.textContent =
  '.lx-card{border:1px solid var(--line);border-radius:16px;padding:14px;margin:10px 0 14px;background:var(--surface);color:var(--ink)}.lx-card h3{margin:0 0 4px;font-size:17px;color:var(--ink)}.lx-intro{margin:0 0 10px;font-size:14px;color:var(--ink-2)}'
  + '.lx-row{border-top:1px solid var(--line);padding:10px 0}.lx-row.key{background:color-mix(in srgb,var(--gold) 12%,transparent);border:1px solid color-mix(in srgb,var(--gold) 45%,transparent);border-radius:12px;padding:10px;margin-top:4px}'
  + '.lx-top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.lx-k{font-weight:600;color:var(--ink)}.lx-v{font-size:18px;white-space:nowrap;color:var(--gold)}.lx-sub{font-size:13.5px;color:var(--ink-2);margin-top:2px}'
  + '.lx-what summary{cursor:pointer;font-size:13.5px;color:var(--gold);margin-top:4px}.lx-what p{margin:6px 0 0;font-size:14px;line-height:1.6;color:var(--ink)}.lx-fine{margin:10px 0 0;color:var(--ink-2)}'
  + '.lx-ask{display:block;font-weight:600;color:var(--ink)}.lx-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.lx-chip{border:1px solid var(--line);background:var(--field);color:var(--ink);border-radius:999px;padding:6px 10px;font:inherit;font-size:13.5px;cursor:pointer;min-height:36px;white-space:nowrap}'
  + '.lx-chip[aria-pressed="true"]{background:var(--gold);color:var(--bg);border-color:var(--gold);font-weight:700}.lx-say{margin:8px 0 0;font-size:14px;font-weight:600;color:var(--gold);grid-column:1/-1}'
  + '.lx-guide{margin-top:14px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--surface);color:var(--ink)}.lx-guide summary{cursor:pointer;font-weight:700}.lx-guide h4{margin:14px 0 4px;font-size:15px;color:var(--gold)}.lx-guide dt{font-weight:600;margin-top:8px}.lx-guide dd{margin:2px 0 0;line-height:1.6;font-size:14px;color:var(--ink-2)}';
  document.head.appendChild(st); })();
