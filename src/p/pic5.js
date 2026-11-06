/* ---------- 13.78: the emergency fund and the personal balance sheet, extended ----------
   Emergency fund: the months of cover can be picked (3, 6, 9, 12 or your own number; "by my work" keeps the old rule),
   and a target date in months gives the monthly amount needed: (goal − what you have) ÷ months, never below 0.
   Balance sheet ("my financial picture"): it stays the one place for assets and debts. It can be filled from what you already
   entered elsewhere (savings & investments, monthly expenses) – shown first, with where each number comes from and when it was
   entered, and copied only when you tap; nothing is added on top, so nothing is counted twice. Every month the result is kept,
   so you see the net worth over time. */
miniDef('emergency', Object.assign({}, MINI.emergency, {
  fields: [
    {k: 'spend', t: 'em_spend', type: 'num', u: '₪', def: () => Math.round(miSpend()) || 10000},
    {k: 'mode', t: 'em_months', type: 'sel', def: 'auto', opts: [['auto', 'em_mAuto'], ['3', 'em_m3'], ['6', 'em_m6'], ['9', 'em_m9'], ['12', 'em_m12'], ['custom', 'em_mCustom']]},
    {k: 'job', t: 'em_job', type: 'sel', def: 'emp', opts: [['emp', 'em_jEmp'], ['two', 'em_jTwo'], ['self', 'em_jSelf']], show: v => v.mode === 'auto'},
    {k: 'cm', t: 'em_cm', type: 'num', u: 'u_mo', def: 6, show: v => v.mode === 'custom'},
    {k: 'have', t: 'em_have', type: 'num', u: '₪', def: 0},
    {k: 'save', t: 'em_save', type: 'num', u: '₪', def: 1000},
    {k: 'by', t: 'em_by', type: 'num', u: 'u_mo', def: 0, h: 'em_byH'}
  ],
  calc(v){
    const auto = v.job === 'self' ? 9 : v.job === 'two' ? 3 : 6;
    const months = v.mode === 'auto' || !v.mode ? auto : v.mode === 'custom' ? Math.max(1, Math.round(miN(v.cm)) || 1) : +v.mode;
    const goal = v.spend * months, gap = Math.max(0, goal - v.have), n = v.save > 0 ? Math.ceil(gap / v.save) : Infinity, by = Math.max(0, Math.round(miN(v.by)));
    const pct = goal ? Math.min(100, v.have / goal * 100) : 0;
    const rows = [[t('em_have'), MI0(v.have)], [t('em_cover'), t('em_mo', {n: v.spend ? MIn(v.have / v.spend, 1) : 0})], [t('em_pct'), MIP(pct, 0)]];
    if (gap){ rows.push([t('em_when'), isFinite(n) ? t('em_mo', {n}) : '—', 'total']); if (by > 0) rows.push([t('em_need', {m: by}), MI0(gap / by), 'total']); }
    return {hero: {l: t('em_goal', {m: months}), v: MI0(goal), sub: gap ? t('em_gap', {g: MI0(gap)}) : t('em_done')},
      rows, bars: [{l: t('em_have'), v: Math.min(v.have, goal), max: goal, txt: MIP(pct, 0)}], note: t('em_where') + ' ' + t('em_plan')};
  }
}));

/* ---- the balance sheet: fill from my data, and the net worth over time ---- */
function nwSources(){
  const out = [];
  try {
    const d = pfD(), sv = d.sav || [], when = d.at || d.updated || 0;
    const sum = types => sv.filter(x => types.includes(x.type)).reduce((s, x) => s + Math.max(0, pfN(x.bal)), 0);
    const pen = sum(['pension', 'hish', 'gemel', 'kids']), inv = sum(['deposit', 'mmf', 'broker', 'crypto', 'other']), cash = sum(['cash']);
    const hold = (d.hold || []).reduce((s, x) => s + Math.max(0, pfN(x.val)), 0);
    if (pen > 0) out.push({id: 'nw_pen', v: pen, src: 'tab_portfolio', at: when});
    if (inv + hold > 0) out.push({id: 'nw_inv', v: inv + hold, src: 'tab_portfolio', at: when});
    if (cash > 0) out.push({id: 'nw_cash', v: cash, src: 'tab_portfolio', at: when});
  } catch (e) {}
  try {
    const d = expData(), now = new Date(), yms = [1, 2, 3].map(k => { const x = new Date(now.getFullYear(), now.getMonth() - k, 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); });
    const per = yms.map(ym => { try { return expTotals(ym).sum || 0; } catch (e) { return 0; } }).filter(x => x > 0);
    if (per.length) out.push({id: 'nw_exp', v: Math.round(per.reduce((a, b) => a + b, 0) / per.length), src: 'tab_expenses', at: 0, avg: per.length});
    const inc = yms.map(ym => +((d.income || {})[ym]) || 0).filter(x => x > 0);
    if (inc.length) out.push({id: 'nw_inc', v: Math.round(inc.reduce((a, b) => a + b, 0) / inc.length), src: 'tab_expenses', at: 0, avg: inc.length});
  } catch (e) {}
  return out;
}
function nwFillCard(){
  const p = document.getElementById('panel-networth'), inputs = p && p.querySelector('.inputs'); if (!inputs) return;
  const S = nwSources(), E = asEsc;
  let c = document.getElementById('nw-fill');
  if (!S.length){ if (c) c.remove(); return; }
  if (!c){ inputs.insertAdjacentHTML('afterbegin', '<div class="field wide nw-fill" id="nw-fill"></div>'); c = document.getElementById('nw-fill'); }
  const lab = id => { const el = document.getElementById(id), f = el && el.closest('.field'), l = f && f.querySelector('label'); return l ? l.textContent.trim() : id; };
  c.innerHTML = `<b>${E(t('nw_fillT'))}</b><p class="fine">${E(t('nw_fillS'))}</p><ul>${S.map(s => `<li><span>${E(lab(s.id))}</span> <b class="num">${E(M(s.v))}</b> <small>${E(t('nw_from', {x: t(s.src)}))}${s.avg ? ' · ' + E(t('nw_avg', {n: s.avg})) : ''}${s.at ? ' · ' + E(new Date(s.at).toLocaleDateString()) : ''}</small></li>`).join('')}</ul>
    <button type="button" class="btn" id="nw_fillGo">${E(t('nw_fillGo'))}</button>`;
}
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#nw_fillGo')) return;
  nwSources().forEach(s => { const el = document.getElementById(s.id); if (!el) return; el.value = String(s.v); el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); });
  try { calc('networth'); } catch (er) {} try { toast(t('nw_filled')); } catch (er) {}
});
const calcNw5 = CALC.networth;
CALC.networth = function(){
  const res = calcNw5.apply(this, arguments);
  try {
    const g = id => Math.max(0, v(id)), ta = ['nw_cash', 'nw_inv', 'nw_pen', 'nw_prop', 'nw_oa'].reduce((s, id) => s + g(id), 0), tl = ['nw_mort', 'nw_loan', 'nw_card', 'nw_ol'].reduce((s, id) => s + g(id), 0);
    const now = new Date(), ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const H = SET.nwHist && typeof SET.nwHist === 'object' ? SET.nwHist : (SET.nwHist = {});
    const cur = H[ym];
    if (typeof tab !== 'undefined' && tab === 'networth' && (!cur || cur.a !== ta || cur.l !== tl)){ H[ym] = {a: ta, l: tl, at: Date.now()}; clearTimeout(SET.__nwT); SET.__nwT = setTimeout(() => { try { delete SET.__nwT; saveSet(); } catch (e) {} }, 1500); }
    const ks = Object.keys(H).sort().slice(-24);
    if (H[ym]) res.rows.push([t('nw_upd'), new Date(H[ym].at).toLocaleDateString()]);
    const prev = ks.filter(k => k < ym), net = k => H[k].a - H[k].l;
    if (prev.length){ const k = prev[prev.length - 1], d = (ta - tl) - net(k); res.rows.push([t('nw_vsPrev', {m: k}), (d >= 0 ? '+' : '−') + M(Math.abs(d))]); }
    const yAgo = (now.getFullYear() - 1) + ym.slice(4);
    if (H[yAgo]){ const d = (ta - tl) - net(yAgo); res.rows.push([t('nw_vsYear'), (d >= 0 ? '+' : '−') + M(Math.abs(d))]); }
    if (ks.length >= 2) res.chart = {title: t('nw_hist'), unit: '', fmt: x => M(x), labels: ks.map(k => k.slice(5) + '/' + k.slice(2, 4)),
      layers: [{name: t('nw_histNet'), cls: 'c-ink', values: ks.map(k => Math.max(0, net(k)))}]};
  } catch (e) {}
  return res;
};
(function(){
  const actNw = activate;
  activate = function(id){ const r = actNw.apply(this, arguments); if (id === 'networth'){ try { nwFillCard(); } catch (e) {} } return r; };
  const st = document.createElement('style');
  st.textContent = '.nw-fill{border:1px solid var(--line);border-radius:16px;padding:12px 14px;background:var(--surface);margin-bottom:10px;color:var(--ink)}.nw-fill ul{list-style:none;margin:8px 0;padding:0}'
    + '.nw-fill li{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;padding:4px 0;border-top:1px solid var(--line)}.nw-fill li small{color:var(--ink-2);width:100%}';
  document.head.appendChild(st);
})();
