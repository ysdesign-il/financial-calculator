/* ---------- 13.83: the rest of the system review, together ----------
   1. Comparing properties for investment – each one runs the existing "apartment for investment" engine (no second formula);
      on top: a sale after N years at a yearly price change, sale value = price × (1 + change)^years, gain on sale = sale − price − costs
      (before tax and selling costs).
   2. Alerts in one place – reminders that are late or due within 7 days, insurance renewals within 60 days, this month's budget
      at 90%+ of a category, and a balance sheet not updated for 60 days. Each kind can be muted; each alert can be marked done.
   3. My financial report – the main figures from every part of the app on one screen (and so in one PDF from the share button).
   4. Saved scenarios from every calculator, with search, in the "Saved" screen.
   5. Expenses: income sources (salary, extra work, allowance, rent…) that add up to the month's income, and this year against
      last year (same months), by category. */
const fnum = s => { const x = parseFloat(String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[−–]/g, '-').replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : 0; };

/* ---- 1. comparing properties ---- */
const RC_F = [['price', 'ia_price', 'cur', 1800000], ['equity', 'ia_equity', 'cur', 900000], ['rate', 'ia_rate', '%', 5], ['years', 'ia_years', 'yrs', 25],
  ['rent', 'ia_rent', 'cur', 5500], ['vac', 'ia_vac', 'mo', 0.5], ['maint', 'ia_maint', 'cur', 6000], ['costs', 'ia_costs', '%', 2], ['grow', 'rc_grow', '%', 2], ['hold', 'rc_hold', 'yrs', 10]];
function rcList(){ if (!Array.isArray(SET.rcList) || !SET.rcList.length) SET.rcList = [{n: ''}, {n: '', price: 1400000, equity: 700000, rent: 4800}]; return SET.rcList; }
const rcVal = (o, k, d) => o[k] === '' || o[k] == null || !isFinite(+o[k]) ? d : +o[k];
function rcRender(force){
  const box = document.getElementById('rcx_box'); if (!box) return;
  if (!force && box.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const E = asEsc, L = rcList();
  box.innerHTML = L.map((o, i) => `<div class="lc-card"><div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>
      <input class="lc-name" type="text" maxlength="30" dir="auto" data-rci="${i}" data-rck="n" value="${E(o.n || '')}" placeholder="${E(t('rc_def', {n: i + 1}))}" aria-label="${E(t('rc_name') + ' ' + (i + 1))}">
      ${L.length > 1 ? `<button type="button" class="lc-del" data-rcdel="${i}" aria-label="${E(t('dq_del', {x: o.n || t('rc_def', {n: i + 1})}))}">✕</button>` : ''}</div>
    <div class="fields">${RC_F.map(([k, l, u, d]) => `<div class="field"><label for="rc_${k}${i}">${E(t(l))}</label><div class="control"><input id="rc_${k}${i}" type="number" inputmode="decimal" step="any" data-rci="${i}" data-rck="${k}" value="${E(rcVal(o, k, d))}">${unitHTML(u)}</div></div>`).join('')}</div></div>`).join('')
    + (L.length < 8 ? `<button type="button" class="lc-add" id="rc_add"><span aria-hidden="true">＋</span> ${E(t('rc_add'))}</button>` : '') + `<p class="fine lc-hint">${E(t('rc_hint'))}</p>`;
}
CALC.recmp = function(){
  if (!document.querySelector('#rcx_box .lc-add, #rcx_box .lc-card')) rcRender(true);
  const M0 = MINI.invapt, warn = [];
  const R = rcList().map((o, i) => {
    const v = {track: 'exempt', marg: 31, ptax: 0}; RC_F.forEach(([k, , , d]) => { v[k] = rcVal(o, k, d); });
    const r = M0.calc(v), row = k => { const x = (r.rows || []).find(q => q[0] === t(k)); return x ? x[1] : ''; };
    const sale = v.price * Math.pow(1 + v.grow / 100, v.hold), gain = sale - v.price - v.price * v.costs / 100;
    return {name: asEsc(String(o.n || '').trim() || t('rc_def', {n: i + 1})), cash: fnum(r.hero && r.hero.v), cashS: r.hero && r.hero.v, gross: row('ia_gross'), net: fnum(row('ia_netEq')), netS: row('ia_netEq'),
      inv: row('ia_inv'), pmt: row('ia_pmt'), sale, gain, hold: v.hold, w: r.warn};
  });
  R.forEach(x => { if (x.w) warn.push(x.name + ': ' + x.w); });
  const S = R.slice().sort((a, b) => b.net - a.net), best = S[0], next = S[1];
  const table = {title: t('rc_t'), open: true, head: ['', t('ia_cash'), t('ia_gross'), t('ia_netEq'), t('ia_pmt'), t('ia_inv'), t('rc_sale'), t('rc_gain')],
    rows: S.map(x => [(next && x === best ? '★ ' : '') + x.name, x.cashS, x.gross, x.netS, x.pmt, x.inv, M(x.sale), M(x.gain)])};
  return {hero: {label: t('rc_best', {x: best.name}), value: best.netS, sub: next ? t('rc_sub', {y: next.name, v: next.netS}) : ''},
    rows: [[t('ia_cash') + ' · ' + best.name, best.cashS, 'key'], [t('rc_gain') + ' · ' + best.name, M(best.gain)]], warn, note: t('rc_note') + ' ' + t('ia_note'), table};
};

/* ---- 2. alerts in one place ---- */
function alItems(){
  const out = [], now = Date.now();
  try { rmD().items.filter(it => !it.done).forEach(it => { const d = rmDays(it.date); if (isFinite(d) && d <= 7) out.push({k: 'rem', id: 'rm:' + (it.id || it.title + it.date), lvl: d < 0 ? 2 : 1, txt: t(d < 0 ? 'al_late' : 'al_soon', {x: it.title, d: Math.abs(d)}), go: 'reminders'}); }); } catch (e) {}
  try { (SET.mpList || []).forEach(x => { if (!x.renew) return; const d = Math.round((new Date(x.renew) - now) / 864e5); if (d >= -1 && d <= 60) out.push({k: 'ins', id: 'mp:' + (x.co || '') + x.renew, lvl: d <= 14 ? 2 : 1, txt: t('al_ins', {x: [t('mp_kind_' + (x.kind || 'other')), x.co].filter(Boolean).join(' · '), d}), go: 'mypolicies'}); }); } catch (e) {}
  try {
    const d = expData(), ym = ymOf(new Date()), tot = expTotals(ym, 'cat').by;
    Object.keys(d.budgets || {}).forEach(c => { const b = +d.budgets[c], s = +tot[c] || 0; if (b > 0 && s >= b * 0.9) out.push({k: 'bud', id: 'bud:' + ym + ':' + c, lvl: s > b ? 2 : 1, txt: t(s > b ? 'al_budOver' : 'al_budNear', {x: t('ec_' + c), p: N(s / b * 100, 0)}), go: 'expenses'}); });
  } catch (e) {}
  try { const H = SET.nwHist || {}, ks = Object.keys(H).sort(); if (ks.length){ const last = H[ks[ks.length - 1]].at || 0; if (now - last > 60 * 864e5) out.push({k: 'nw', id: 'nw:' + ks[ks.length - 1], lvl: 1, txt: t('al_nw'), go: 'networth'}); } } catch (e) {}
  const mute = SET.alMute || {}, done = SET.alDone || {};
  return out.filter(a => !mute[a.k] && !(done[a.id] && now - done[a.id] < 30 * 864e5)).sort((a, b) => b.lvl - a.lvl);
}
const AL_KINDS = [['rem', 'al_kRem'], ['ins', 'al_kIns'], ['bud', 'al_kBud'], ['nw', 'al_kNw']];
function alRender(){
  const box = document.getElementById('al_box'); if (!box) return;
  const E = asEsc, L = alItems(), mute = SET.alMute || {};
  box.innerHTML = (L.length ? `<ul class="al-list">${L.map(a => `<li class="al-it lv${a.lvl}"><span class="al-dot" aria-hidden="true">${a.lvl > 1 ? '⚠' : '•'}</span><span class="al-tx">${E(a.txt)}</span>
      <span class="al-b"><button type="button" class="as-chip" data-algo="${a.go}">${E(t('al_open'))}</button><button type="button" class="as-chip" data-aldone="${E(a.id)}">${E(t('al_done'))}</button></span></li>`).join('')}</ul>`
      : `<p class="al-none">${E(t('al_none'))}</p>`)
    + `<details class="al-set"><summary>${E(t('al_kinds'))}</summary>${AL_KINDS.map(([k, l]) => `<label class="al-k"><input type="checkbox" data-almute="${k}"${mute[k] ? '' : ' checked'}> ${E(t(l))}</label>`).join('')}</details>`;
}
CALC.alerts = function(){
  alRender();
  const L = alItems(), hi = L.filter(a => a.lvl > 1).length;
  return {hero: {label: t('al_hero'), value: N(L.length, 0), sub: hi ? t('al_hi', {n: hi}) : t(L.length ? 'al_ok' : 'al_none')}, rows: [], note: t('al_note')};
};

/* ---- 3. my financial report ---- */
CALC.myreport = function(){
  const rows = [], tbl = [], E = s => s;
  const add = (sec, k, v) => tbl.push([t(sec), t(k), v]);
  try { const H = SET.nwHist || {}, ks = Object.keys(H).sort(); if (ks.length){ const h = H[ks[ks.length - 1]]; add('mr_sNw', 'mr_nw', M(h.a - h.l)); add('mr_sNw', 'mr_assets', M(h.a)); add('mr_sNw', 'mr_debts', M(h.l)); add('mr_sNw', 'nw_upd', new Date(h.at).toLocaleDateString()); } } catch (e) {}
  try {
    const ym = ymOf(new Date()), tot = expTotals(ym, 'cat').sum, inc = expIncome(ym);
    const prev = [1, 2, 3].map(n => expTotals(ymAdd(ym, -n), 'cat').sum).filter(x => x > 0), avg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
    if (tot || avg){ add('mr_sBud', 'mr_spendNow', M(tot)); if (avg) add('mr_sBud', 'mr_spendAvg', M(avg)); }
    if (inc && inc.v > 0){ add('mr_sBud', 'mr_income', M(inc.v)); if (avg) add('mr_sBud', 'mr_saveRate', PC((inc.v - avg) / inc.v * 100)); }
  } catch (e) {}
  try { const L = (SET.mpList || []).filter(x => x && (x.co || pfN(x.prem) > 0)); if (L.length){ const mo = L.reduce((s, x) => s + (x.per === 'year' ? pfN(x.prem) / 12 : pfN(x.prem)), 0); add('mr_sIns', 'mp_mo', M(mo)); add('mr_sIns', 'mp_n', N(L.length, 0)); } } catch (e) {}
  try { const d = pfD(), sv = (d.sav || []).reduce((s, x) => s + Math.max(0, pfN(x.bal)), 0), hv = (d.hold || []).reduce((s, x) => s + Math.max(0, pfN(x.val)), 0); if (sv) add('mr_sInv', 'mr_saved', M(sv)); if (hv) add('mr_sInv', 'mr_hold', M(hv)); } catch (e) {}
  try { const n = alItems().length; add('mr_sAl', 'al_hero', N(n, 0)); } catch (e) {}
  try { const sc = Object.keys(SCN || {}).reduce((s, k) => s + (SCN[k] || []).length, 0); if (sc) add('mr_sAl', 'mr_scn', N(sc, 0)); } catch (e) {}
  const nwRow = tbl.find(r => r[1] === t('mr_nw'));
  return {hero: {label: t('mr_hero'), value: nwRow ? nwRow[2] : '—', sub: t(nwRow ? 'mr_sub' : 'mr_empty')},
    rows: tbl.slice(0, 6).map(r => [r[1], r[2]]), note: t('mr_note'),
    table: tbl.length ? {title: t('mr_t'), open: true, head: [t('mr_hSec'), '', ''], rows: tbl} : null};
};

/* ---- 4. saved scenarios from every calculator, with search ---- */
var SVQ = '';
function svAll(){
  const box = document.getElementById('sv_all'); if (!box) return;
  const E = asEsc, q = SVQ.trim().toLowerCase(), L = [];
  Object.keys(SCN || {}).forEach(id => (SCN[id] || []).forEach((s, i) => L.push({id, i, n: s.n, at: s.at || 0, tab: t('tab_' + id)})));
  const F = L.filter(x => !q || (x.n + ' ' + x.tab).toLowerCase().includes(q)).sort((a, b) => b.at - a.at);
  const list = box.querySelector('.sva-l');
  const html = F.length ? F.slice(0, 60).map(x => `<li><span><b>${E(x.n)}</b> <small>${E(x.tab)}${x.at ? ' · ' + E(new Date(x.at).toLocaleDateString()) : ''}</small></span><button type="button" class="as-chip" data-svopen="${x.id}|${x.i}">${E(t('sva_open'))}</button></li>`).join('') : `<li class="fine">${E(t(L.length ? 'sva_none' : 'sva_empty'))}</li>`;
  if (list){ list.innerHTML = html; return; }
  box.innerHTML = `<h3 class="sec-t">${E(t('sva_t'))}</h3><input type="search" id="sva_q" class="sva-q" placeholder="${E(t('sva_ph'))}" aria-label="${E(t('sva_ph'))}" value="${E(SVQ)}"><ul class="sva-l">${html}</ul>`;
}
function svMount(){ const P = document.getElementById('panel-saved'); if (!P) return; if (!document.getElementById('sv_all')) P.insertAdjacentHTML('beforeend', '<div class="sva" id="sv_all"></div>'); svAll(); }

/* ---- 5. expenses: income sources, and this year against last year ---- */
function exIncCard(){
  const box = document.getElementById('panel-expenses'), anchor = box && box.querySelector('.exp-list-h'); if (!anchor) return;
  const d = expData(), L = Array.isArray(d.incSrc) ? d.incSrc : (d.incSrc = []), E = asEsc, sum = L.reduce((s, x) => s + Math.max(0, +x.amt || 0), 0);
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, by = (yr) => { const o = {}; for (let k = 1; k <= m; k++){ const ym = yr + '-' + String(k).padStart(2, '0'), b = expTotals(ym, 'cat').by; Object.keys(b).forEach(c => { o[c] = (o[c] || 0) + b[c]; }); } return o; };
  const A = by(y), B = by(y - 1), cats = Object.keys(Object.assign({}, A, B)).filter(c => (A[c] || 0) + (B[c] || 0) > 0).sort((a, b) => (A[b] || 0) - (A[a] || 0));
  const sA = Object.values(A).reduce((a, b) => a + b, 0), sB = Object.values(B).reduce((a, b) => a + b, 0);
  let c = document.getElementById('ex_inc');
  if (!c){ anchor.insertAdjacentHTML('beforebegin', '<div id="ex_inc" class="ex-inc"></div>'); c = document.getElementById('ex_inc'); }
  if (c.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  c.innerHTML = `<details${L.length ? ' open' : ''}><summary class="sec-t">${E(t('exi_t'))}</summary>
    ${L.map((x, i) => `<div class="exi-r"><input type="text" maxlength="24" dir="auto" data-exi="${i}" data-exk="n" value="${E(x.n || '')}" placeholder="${E(t('exi_nPh'))}" aria-label="${E(t('exi_n'))}"><input type="text" inputmode="decimal" dir="ltr" data-exi="${i}" data-exk="amt" value="${E(x.amt || '')}" aria-label="${E(t('exi_amt'))}"><button type="button" class="lc-del" data-exidel="${i}" aria-label="${E(t('dq_del', {x: x.n || t('exi_n')}))}">✕</button></div>`).join('')}
    <div class="btnrow"><button type="button" class="btn" id="exi_add">＋ ${E(t('exi_add'))}</button>${L.length ? `<button type="button" class="gold-btn" id="exi_use">${E(t('exi_use', {v: M(sum)}))}</button>` : ''}</div>
    <p class="fine">${E(t('exi_h'))}</p></details>
    ${sB || sA ? `<details><summary class="sec-t">${E(t('exy_t', {a: y, b: y - 1}))}</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${y}</th><th>${y - 1}</th><th>${E(t('exy_d'))}</th></tr></thead><tbody>
      ${cats.map(k => { const a = A[k] || 0, b = B[k] || 0; return `<tr><td>${E(t('ec_' + k))}</td><td>${E(M(a))}</td><td>${E(M(b))}</td><td>${b ? E((a >= b ? '+' : '−') + PC(Math.abs(a - b) / b * 100)) : '—'}</td></tr>`; }).join('')}
      <tr class="tot"><td>${E(t('exy_sum'))}</td><td>${E(M(sA))}</td><td>${E(M(sB))}</td><td>${sB ? E((sA >= sB ? '+' : '−') + PC(Math.abs(sA - sB) / sB * 100)) : '—'}</td></tr></tbody></table></div>
      <p class="fine">${E(t('exy_h', {m}))}</p></details>` : ''}`;
}

/* ---- events and wiring ---- */
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.dataset) return;
  if (el.dataset.rck != null && el.closest('#rcx_box')){ const o = rcList()[+el.dataset.rci]; if (!o) return; o[el.dataset.rck] = el.dataset.rck === 'n' ? el.value.slice(0, 30) : el.value; clearTimeout(SET.__rcT); SET.__rcT = setTimeout(() => { try { delete SET.__rcT; saveSet(); } catch (er) {} }, 400); try { calc('recmp'); } catch (er) {} return; }
  if (el.id === 'sva_q'){ SVQ = el.value; svAll(); return; }
  if (el.dataset.exk != null && el.closest('#ex_inc')){ const d = expData(), x = (d.incSrc || [])[+el.dataset.exi]; if (!x) return; x[el.dataset.exk] = el.dataset.exk === 'amt' ? String(el.value).replace(/[^\d.]/g, '') : el.value.slice(0, 24); clearTimeout(SET.__exT); SET.__exT = setTimeout(() => { try { delete SET.__exT; expSave(); } catch (er) {} }, 500); }
}, true);
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.dataset || el.dataset.almute == null) return;
  const m = SET.alMute || (SET.alMute = {}); if (el.checked) delete m[el.dataset.almute]; else m[el.dataset.almute] = 1; try { saveSet(); } catch (er) {} try { calc('alerts'); } catch (er) {}
});
document.addEventListener('click', e => {
  if (!e.target.closest) return; let b;
  if (e.target.closest('#rc_add')){ const L = rcList(); if (L.length < 8){ L.push(Object.assign({}, L[L.length - 1], {n: ''})); try { saveSet(); } catch (er) {} rcRender(true); try { calc('recmp'); } catch (er) {} } return; }
  if ((b = e.target.closest('[data-rcdel]'))){ const L = rcList(); if (L.length > 1){ L.splice(+b.dataset.rcdel, 1); try { saveSet(); } catch (er) {} rcRender(true); try { calc('recmp'); } catch (er) {} } return; }
  if ((b = e.target.closest('[data-algo]'))){ try { activate(b.dataset.algo); } catch (er) {} return; }
  if ((b = e.target.closest('[data-aldone]'))){ const d = SET.alDone || (SET.alDone = {}); d[b.dataset.aldone] = Date.now(); Object.keys(d).forEach(k => { if (Date.now() - d[k] > 60 * 864e5) delete d[k]; }); try { saveSet(); } catch (er) {} try { calc('alerts'); } catch (er) {} return; }
  if ((b = e.target.closest('[data-svopen]'))){ const [id, i] = b.dataset.svopen.split('|'), s = (SCN[id] || [])[+i]; if (!s) return; try { activate(id); setVals(s.vals); touch(id); calc(id); saveVals(); toast(t('sva_loaded', {x: s.n})); } catch (er) {} return; }
  if (e.target.closest('#exi_add')){ const d = expData(); (d.incSrc = d.incSrc || []).push({n: '', amt: ''}); expSave(); exIncCard(); const r = $$('#ex_inc [data-exk="n"]'); if (r.length) r[r.length - 1].focus(); return; }
  if ((b = e.target.closest('[data-exidel]'))){ const d = expData(); (d.incSrc || []).splice(+b.dataset.exidel, 1); expSave(); exIncCard(); return; }
  if (e.target.closest('#exi_use')){ const d = expData(), s = (d.incSrc || []).reduce((a, x) => a + Math.max(0, +x.amt || 0), 0); if (s > 0){ d.income[EXP_M || ymOf(new Date())] = s; expSave(); try { expRender(); } catch (er) {} try { toast(t('exi_done', {v: M(s)})); } catch (er) {} } return; }
});
(function(){
  const act9 = activate;
  activate = function(id){ const r = act9.apply(this, arguments);
    try { if (id === 'recmp'){ rcRender(true); calc('recmp'); } else if (id === 'alerts') calc('alerts'); else if (id === 'saved') svMount(); else if (id === 'myreport') calc('myreport'); } catch (e) {} return r; };
  const er9 = expRender;
  expRender = function(){ const r = er9.apply(this, arguments); try { exIncCard(); } catch (e) {} return r; };
  const al9 = applyLang;
  applyLang = function(){ const r = al9.apply(this, arguments); try { rcRender(); svAll(); } catch (e) {} return r; };
  const st = document.createElement('style');
  st.textContent = '.al-list{list-style:none;margin:0;padding:0}.al-it{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:10px 0;border-top:1px solid var(--line);color:var(--ink)}.al-it.lv2 .al-dot{color:var(--warn,#b45309)}'
    + '.al-tx{flex:1 1 60%}.al-b{display:flex;gap:6px}.al-none{color:var(--ink-2)}.al-set{margin-top:12px}.al-k{display:flex;gap:8px;align-items:center;padding:6px 0}'
    + '.sva{margin-top:18px}.sva-q{width:100%;margin:6px 0 8px}.sva-l{list-style:none;margin:0;padding:0}.sva-l li{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}.sva-l small{display:block;color:var(--ink-2)}'
    + '#panel-myreport .inputs,#panel-alerts .scn,#panel-myreport .scn{display:none}.ex-inc{margin:12px 0}.ex-inc details{border:1px solid var(--line);border-radius:14px;padding:8px 12px;margin-bottom:10px;background:var(--surface)}.exi-r{display:flex;gap:6px;margin:6px 0}.exi-r input{flex:1;min-width:0}.exi-r input[data-exk="amt"]{flex:0 0 32%}.ex-inc .tot td{font-weight:700}';
  document.head.appendChild(st);
})();
