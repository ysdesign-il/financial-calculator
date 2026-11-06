/* ---------- 13.79: retirement ages side by side, portfolio holdings with units and prices, and my insurance policies ----------
   • Retirement: the same retirement engine again with retiring 3 years earlier and 3 years later (no second formula).
   • Holdings (optional extras on each holding): symbol, units, buy price, current price, buy date, fees, dividends received.
     Profit in the holding's own currency = units × (current − buy price) + dividends − fees; return = profit ÷ (units × buy price + fees).
     The prices are what you typed (marked "typed by you", with the date you gave) – no live price is made up.
   • My policies: company, kind, coverage, premium (monthly or yearly), start and renewal dates, notes – no policy or ID numbers.
     Totals a month and a year, renewals in the next 60 days (with a reminder button), and the same kind twice flagged as
     "worth checking" – never as a proven double cover. */
const calcRt6 = CALC.retire;
CALC.retire = function(){
  const res = calcRt6.apply(this, arguments);
  try {
    const R = document.getElementById('rt_ret'), A = document.getElementById('rt_age'); if (!res || !res.rows || !R || !A) return res;
    const r0 = R.value, ret = v('rt_ret'), age = v('rt_age');
    const at = y => { R.value = String(y); let x = null; try { x = calcRt6.call(this); } catch (e) {} return x; };
    const pick = x => { if (!x || !x.rows) return '—'; const r = x.rows.find(q => q[0] === t('r_rtSust')); return r ? strip(r[1]) : strip(x.hero && x.hero.value || '—'); };
    try {
      [-3, 3].map(d => ret + d).filter(y => y > age && y < 90).forEach(y => res.rows.push([t('r_rtAgeAlt', {a: N(y, 0)}), pick(at(y))]));
    } finally { R.value = r0; }
  } catch (e) {}
  return res;
};

/* ---- holdings: units and prices ---- */
const PFX_F = [['sym', 'pfx_sym', 'text'], ['qty', 'pfx_qty', 'num'], ['cost', 'pfx_cost', 'num'], ['px', 'pfx_px', 'num'], ['date', 'pfx_date', 'date'], ['fee', 'pfx_fee', 'num'], ['div', 'pfx_div', 'num']];
function pfxCalc(x){
  const q = pfN(x.qty), c = pfN(x.cost), p = pfN(x.px), f = pfN(x.fee), dv = pfN(x.div);
  if (!(q > 0) || !(c > 0) || !(p > 0)) return null;
  const base = q * c + f, gain = q * (p - c) + dv - f;
  return {val: q * p, base, gain, pct: base > 0 ? gain / base * 100 : NaN};
}
const pfHold6 = pfHold;
pfHold = function(v){
  const r = pfHold6.apply(this, arguments);
  try {
    const d = pfD(), E = pfE, items = v && v.querySelectorAll ? v.querySelectorAll('.rm-list > li.rm-it') : [];
    let tb = 0, tg = 0, any = 0;
    items.forEach((li, i) => {
      const x = d.hold[i]; if (!x) return;
      const cur = x.cur && x.cur !== 'other' ? x.cur : '', fmt = n => (cur && cur !== 'ILS' ? N(n, 2) + ' ' + cur : M(n, 2));
      const c = pfxCalc(x); if (c && (!cur || cur === 'ILS')){ tb += c.base; tg += c.gain; any++; }
      const open = PFX_F.some(([k]) => x[k]);
      li.querySelector('.rm-b').insertAdjacentHTML('beforeend', `<details class="pfx"${open ? ' open' : ''}><summary>${E(t('pfx_more'))}</summary><div class="bk-grid">`
        + PFX_F.map(([k, l, ty]) => `<label class="bk-f"><span>${E(t(l))}</span><input type="${ty === 'date' ? 'date' : 'text'}"${ty === 'num' ? ' inputmode="decimal" dir="ltr"' : ty === 'text' ? ' maxlength="12" dir="ltr"' : ''} data-pfh="${i}" data-pfk="${k}" value="${E(x[k] || '')}"></label>`).join('')
        + `</div>${c ? `<p class="pfx-r"><b class="num ${c.gain >= 0 ? 'up' : 'down'}">${c.gain >= 0 ? '+' : '−'}${E(fmt(Math.abs(c.gain)))} (${E(PC(c.pct))})</b> <span>${E(t('pfx_gainOf', {v: fmt(c.val)}))}</span></p>` : ''}`
        + `<p class="fine">${E(t('pfx_typed'))}${x.date ? ' · ' + E(t('pfx_asOf', {d: x.date})) : ''}</p></details>`);
    });
    if (any && v.querySelector('.rm-list')) v.querySelector('.rm-list').insertAdjacentHTML('beforebegin', `<div class="pfx-sum"><span>${E(t('pfx_tot'))}</span> <b class="num ${tg >= 0 ? 'up' : 'down'}">${tg >= 0 ? '+' : '−'}${E(M(Math.abs(tg), 2))} (${E(PC(tb > 0 ? tg / tb * 100 : NaN))})</b><small>${E(t('pfx_totN'))}</small></div>`);
  } catch (e) {}
  return r;
};

/* ---- my insurance policies ---- */
const MP_KINDS = ['life', 'disab', 'health', 'ltc', 'mort', 'car', 'home', 'other'];
function mpList(){ if (!Array.isArray(SET.mpList)) SET.mpList = []; return SET.mpList; }
const mpMonthly = x => { const p = Math.max(0, pfN(x.prem)); return x.per === 'year' ? p / 12 : p; };
var MP_T = null;
function mpRender(force){
  const box = document.getElementById('mp_box'); if (!box) return;
  if (!force && box.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const E = asEsc, L = mpList();
  const opt = (list, cur, pre) => list.map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${E(t(pre + k))}</option>`).join('');
  box.innerHTML = L.map((x, i) => `<div class="lc-card"><div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>
      <input class="lc-name" type="text" maxlength="30" dir="auto" data-mpi="${i}" data-mpk="co" value="${E(x.co || '')}" placeholder="${E(t('mp_coPh'))}" aria-label="${E(t('mp_co') + ' ' + (i + 1))}">
      <button type="button" class="lc-del" data-mpdel="${i}" aria-label="${E(t('mp_del', {x: x.co || t('mp_kind_' + (x.kind || 'other'))}))}">✕</button></div>
    <div class="fields">
      <div class="field wide"><label for="mp_k${i}">${E(t('mp_kind'))}</label><div class="control"><select id="mp_k${i}" data-mpi="${i}" data-mpk="kind">${opt(MP_KINDS, x.kind || 'life', 'mp_kind_')}</select></div></div>
      <div class="field"><label for="mp_p${i}">${E(t('mp_prem'))}</label><div class="control"><input id="mp_p${i}" type="number" inputmode="decimal" step="any" data-mpi="${i}" data-mpk="prem" value="${E(x.prem || '')}">${unitHTML('cur')}</div></div>
      <div class="field"><label for="mp_e${i}">${E(t('mp_per'))}</label><div class="control"><select id="mp_e${i}" data-mpi="${i}" data-mpk="per">${opt(['month', 'year'], x.per || 'month', 'mp_per_')}</select></div></div>
      <div class="field"><label for="mp_c${i}">${E(t('mp_cover'))}</label><div class="control"><input id="mp_c${i}" type="number" inputmode="decimal" step="any" data-mpi="${i}" data-mpk="cover" value="${E(x.cover || '')}">${unitHTML('cur')}</div></div>
      <div class="field"><label for="mp_r${i}">${E(t('mp_renew'))}</label><div class="control"><input id="mp_r${i}" type="date" data-mpi="${i}" data-mpk="renew" value="${E(x.renew || '')}"></div></div>
      <div class="field"><label for="mp_s${i}">${E(t('mp_start'))}</label><div class="control"><input id="mp_s${i}" type="date" data-mpi="${i}" data-mpk="start" value="${E(x.start || '')}"></div></div>
      <div class="field wide"><label for="mp_n${i}">${E(t('mp_note'))}</label><div class="control"><input id="mp_n${i}" type="text" maxlength="120" dir="auto" data-mpi="${i}" data-mpk="note" value="${E(x.note || '')}" placeholder="${E(t('mp_notePh'))}"></div></div>
    </div>${x.renew ? `<button type="button" class="btn" data-mprem="${i}">⏰ ${E(t('mp_remind'))}</button>` : ''}</div>`).join('')
    + `<button type="button" class="lc-add" id="mp_add"><span aria-hidden="true">＋</span> ${E(t('mp_add'))}</button><p class="fine lc-hint">${E(t('mp_hint'))}</p>`;
}
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset || el.dataset.mpk == null || !el.closest('#mp_box')) return;
  const x = mpList()[+el.dataset.mpi]; if (!x) return;
  x[el.dataset.mpk] = el.value.slice(0, 120);
  clearTimeout(MP_T); MP_T = setTimeout(() => { try { saveSet(); } catch (er) {} }, 400);
  try { calc('mypolicies'); } catch (er) {}
}, true);
document.addEventListener('change', e => { const el = e.target; if (el && el.closest && el.closest('#mp_box') && (el.tagName === 'SELECT' || el.type === 'date')){ el.dispatchEvent(new Event('input', {bubbles: true})); if (el.type === 'date') mpRender(true); } }, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#mp_add')){ mpList().push({co: '', kind: 'life', prem: '', per: 'month'}); try { saveSet(); } catch (er) {} mpRender(true); try { calc('mypolicies'); } catch (er) {} const n = $$('#mp_box .lc-name'); if (n.length) n[n.length - 1].focus(); return; }
  const d = e.target.closest('[data-mpdel]');
  if (d){ mpList().splice(+d.dataset.mpdel, 1); try { saveSet(); } catch (er) {} mpRender(true); try { calc('mypolicies'); } catch (er) {} return; }
  const r = e.target.closest('[data-mprem]');
  if (r){ const x = mpList()[+r.dataset.mprem]; if (x && x.renew) try { rmNew({title: t('mp_remT', {k: t('mp_kind_' + (x.kind || 'other')), c: x.co || ''}).trim(), date: x.renew, rep: 'year', cat: 'insur', before: 30}); } catch (er) {} }
});
CALC.mypolicies = function(){
  if (!document.querySelector('#mp_box .lc-add')) mpRender();
  const L = mpList().filter(x => x && (x.co || pfN(x.prem) > 0)), mo = L.reduce((s, x) => s + mpMonthly(x), 0), warn = [];
  const now = Date.now(), soon = L.filter(x => x.renew && (new Date(x.renew) - now) / 864e5 <= 60 && (new Date(x.renew) - now) / 864e5 >= -1);
  const by = {}; L.forEach(x => { const k = x.kind || 'other'; by[k] = (by[k] || 0) + 1; });
  Object.keys(by).filter(k => by[k] > 1 && k !== 'other' && k !== 'car').forEach(k => warn.push(t('mp_w2', {k: t('mp_kind_' + k), n: by[k]})));
  const rows = [[t('mp_n'), N(L.length, 0)], [t('mp_mo'), M(mo, 2), 'key'], [t('mp_yr'), M(mo * 12, 2)]];
  MP_KINDS.forEach(k => { const s = L.filter(x => (x.kind || 'other') === k).reduce((a, x) => a + mpMonthly(x), 0); if (s > 0) rows.push([t('mp_kind_' + k), M(s, 2) + ' / ' + t('mp_per_month')]); });
  soon.forEach(x => rows.push([t('mp_soon', {k: t('mp_kind_' + (x.kind || 'other')), c: x.co || ''}), new Date(x.renew).toLocaleDateString()]));
  return {hero: {label: t('mp_hero'), value: M(mo, 2), sub: t('mp_sub', {y: M(mo * 12, 2), n: L.length})}, rows, warn, note: t('mp_noteR'),
    table: L.length ? {title: t('mp_q'), open: false, head: ['', ''], rows: ['mp_q1', 'mp_q2', 'mp_q3', 'mp_q4'].map((k, i) => [String(i + 1), t(k)])} : null};
};
(function(){
  const act6 = activate;
  activate = function(id){ const r = act6.apply(this, arguments); try { if (id === 'mypolicies'){ mpRender(); calc('mypolicies'); } } catch (e) {} return r; };
  const al6 = applyLang;
  applyLang = function(){ const r = al6.apply(this, arguments); try { mpRender(); } catch (e) {} return r; };
  const st = document.createElement('style');
  st.textContent = '.pfx{margin-top:8px}.pfx summary{cursor:pointer;color:var(--gold);font-size:14px}.pfx-r{margin:8px 0 0}.pfx-r .up{color:var(--good,#1b8a4b)}.pfx-r .down{color:var(--bad,#c0392b)}'
    + '.pfx-sum{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin:8px 0;background:var(--surface);color:var(--ink)}.pfx-sum small{display:block;color:var(--ink-2)}.pfx-sum .up{color:var(--good,#1b8a4b)}.pfx-sum .down{color:var(--bad,#c0392b)}'
    + '[data-theme="dark"] :is(.pfx-r,.pfx-sum) .up{color:#5EE08F}[data-theme="dark"] :is(.pfx-r,.pfx-sum) .down{color:#FF8A80}';
  document.head.appendChild(st);
})();
