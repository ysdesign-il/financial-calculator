/* 13.24: work, tax and housing – small calculators (engine: mini.js) */

/* ---- payslip check: the existing payslip checker (slip.js) gets its own tab; it moves back to the salary screen when that opens ---- */
miniDef('payslip', {
  intro: 'ps_intro',
  render(box, api){
    const E = api.E;
    box.innerHTML = `<div id="ps_host"></div><p class="fine">${E(t('ps_how'))}</p><div class="btnrow"><button type="button" class="mv" data-go="salary">↗ ${E(t('in_open', {n: t('tab_salary')}))}</button></div>`;
    try { slMount(); const b = document.getElementById('sl_box'), h = document.getElementById('ps_host'); if (b && h){ h.appendChild(b); b.open = true; SLX.open = true; } } catch (e) {}
  }
});
{ const actPs = activate; activate = function(id){
  if (id === 'salary'){ try { const b = document.getElementById('sl_box'), inp = document.querySelector('#panel-salary .inputs'); if (b && inp && b.parentNode !== inp){ inp.insertBefore(b, inp.firstChild); b.open = false; SLX.open = false; } } catch (e) {} }
  return actPs.apply(this, arguments);
}; }

/* ---- real hourly wage ---- */
miniDef('realwage', {
  intro: 'rw_intro',
  fields: [
    {k: 'net', t: 'rw_net', type: 'num', u: '₪', def: () => Math.round(miIncome()) || 12000},
    {k: 'hpw', t: 'rw_hpw', type: 'num', u: 'u_hrs', def: 42},
    {k: 'days', t: 'rw_days', type: 'num', def: 22},
    {k: 'cmin', t: 'rw_cmin', type: 'num', def: 60, h: 'rw_cminH'},
    {k: 'ccost', t: 'rw_ccost', type: 'num', u: '₪', def: 300},
    {k: 'wcost', t: 'rw_wcost', type: 'num', u: '₪', def: 400, h: 'rw_wcostH'}
  ],
  calc(v){
    const hrs = Math.max(0, v.hpw) * 52 / 12, comm = Math.max(0, v.cmin) / 60 * Math.max(0, v.days), costs = Math.max(0, v.ccost) + Math.max(0, v.wcost);
    if (!hrs || v.net <= 0) return {warn: t('rw_need')};
    const nom = v.net / hrs, real = (v.net - costs) / (hrs + comm), drop = nom ? (1 - real / nom) * 100 : 0;
    return {hero: {l: t('rw_real'), v: M(real, 1, 'ILS'), sub: t('rw_sub', {n: M(nom, 1, 'ILS'), p: MIP(drop, 0)})},
      rows: [[t('rw_nom'), M(nom, 1, 'ILS')], [t('rw_hrsM'), t('rw_h', {n: MIn(hrs)})], [t('rw_commM'), t('rw_h', {n: MIn(comm)})], [t('rw_costM'), MI0(costs)], [t('rw_left'), MI0(v.net - costs), 'total']],
      bars: [{l: t('rw_nom'), v: nom, txt: M(nom, 1, 'ILS')}, {l: t('rw_real'), v: Math.max(0, real), dn: true, txt: M(real, 1, 'ILS')}],
      note: t('rw_note')};
  }
});

/* ---- asking for a raise ---- */
miniDef('raise', {
  intro: 'rs_intro',
  fields: [
    {k: 'gross', t: 'rs_gross', type: 'num', u: '₪', def: 15000},
    {k: 'months', t: 'rs_months', type: 'num', u: 'u_mo', def: 12},
    {k: 'cpi', t: 'rs_cpi', type: 'num', u: '%', def: () => Math.round((typeof MKT === 'object' && isFinite(+MKT.cpi) ? +MKT.cpi : 2) * 10) / 10, h: 'rs_cpiH'},
    {k: 'perf', t: 'rs_perf', type: 'sel', def: 'good', opts: [['ok', 'rs_pOk'], ['good', 'rs_pGood'], ['top', 'rs_pTop']]},
    {k: 'role', t: 'rs_role', type: 'chk', def: false}
  ],
  calc(v){
    const cpiSince = Math.max(0, v.cpi) * Math.max(0, v.months) / 12, base = v.perf === 'top' ? 6 : v.perf === 'good' ? 4 : 2, ask = Math.min(25, cpiSince + base + (v.role ? 5 : 0));
    const lose = v.gross * cpiSince / 100, add = v.gross * ask / 100;
    const q = t('rs_aiQ', {g: MI0(v.gross), m: MIn(v.months), c: MIP(cpiSince), p: MIP(ask), n: MI0(v.gross + add)});
    return {hero: {l: t('rs_ask'), v: MIP(ask), sub: t('rs_askS', {a: MI0(add), n: MI0(v.gross + add)})},
      rows: [[t('rs_lost'), MIP(cpiSince)], [t('rs_loseM'), MI0(lose)], [t('rs_new'), MI0(v.gross + add), 'total'], [t('rs_year'), MI0(add * 12)]],
      tips: [t('rs_t1'), t('rs_t2'), t('rs_t3')],
      acts: [{t: '✍️ ' + t('rs_draft'), fn: () => { try { aiOpen(); aiAsk(q); } catch (e) { toast(t('mi_err')); } }}]};
  }
});

/* ---- the yearly pack for a tax refund or the accountant ---- */
const TP_ITEMS = ['f106', 'two', 'donate', 'life', 'pens', 'kids', 'degree', 'soldier', 'move', 'unemp', 'reserve', 'f867', 'rent'];
function tpYear(api){ const y = new Date().getFullYear(); return +api.d.y || (new Date().getMonth() < 4 ? y - 1 : y); }
function tpSummary(y){
  let spend = 0, recs = 0, rms = 0;
  try { for (let m = 1; m <= 12; m++) spend += expTotals(y + '-' + String(m).padStart(2, '0')).sum || 0; } catch (e) {}
  try { recs = vtD().items.filter(x => String(x.date || '').slice(0, 4) === String(y)).length; } catch (e) {}
  try { rms = rmD().items.filter(x => x.cat === 'tax' && !x.done).length; } catch (e) {}
  return {spend, recs, rms};
}
async function tpPdf(api){
  const y = tpYear(api), d = api.d, S = tpSummary(y), W = 1240, H = 1754, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), rtl = document.documentElement.dir === 'rtl', F = (w, s) => w + ' ' + s + 'px -apple-system,"Segoe UI","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif', X = v => rtl ? W - v : v;
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = 'start'; x.fillStyle = '#0B1F3A'; x.fillRect(0, 0, W, 170);
  x.fillStyle = '#F2C45A'; x.font = F('700', 52); x.fillText(t('tp_pdfT'), X(80), 95); x.fillStyle = '#fff'; x.font = F('400', 34); x.fillText(t('tp_year', {y}), X(80), 145);
  let yy = 250;
  x.fillStyle = '#0B1F3A'; x.font = F('700', 36); x.fillText(t('tp_listH'), X(80), yy); yy += 56;
  TP_ITEMS.forEach(k => { const ok = !!(d.ck || {})[k]; x.fillStyle = ok ? '#15803D' : '#8A94A6'; x.font = F('700', 30); x.fillText(ok ? '✓' : '○', X(80), yy); x.fillStyle = '#0B1F3A'; x.font = F('400', 29); x.fillText(t('tp_i_' + k), X(130), yy); yy += 52; });
  yy += 20; x.fillStyle = '#0B1F3A'; x.font = F('700', 36); x.fillText(t('tp_sumH'), X(80), yy); yy += 56;
  [[t('tp_spend'), MI0(S.spend)], [t('tp_recs'), String(S.recs)], [t('tp_rms'), String(S.rms)]].forEach(([l, v]) => { x.fillStyle = '#4E5B6E'; x.font = F('400', 30); x.textAlign = 'start'; x.fillText(l, X(80), yy); x.fillStyle = '#0B1F3A'; x.font = F('700', 30); x.textAlign = 'end'; x.fillText(v, X(W - 80), yy); x.textAlign = 'start'; yy += 52; });
  x.fillStyle = '#8A94A6'; x.font = F('400', 24); x.fillText(t('tp_foot'), X(80), H - 70);
  try { const blob = await dsPdf([{items: [{c, x: 0, y: 0, w: 595.28, h: 841.89}]}], 0.9), r = await fileSave(blob, (t('tp_pdfT') + ' ' + y).replace(/[\\/:*?"<>|]+/g, ' ') + '.pdf', 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : 'mi_err')); } catch (e) { toast(t('mi_err')); }
}
miniDef('taxpack', {
  intro: 'tp_intro', disc: 'mi_notAdvice', resettable: true,
  render(box, api){
    const E = api.E, d = api.d; if (!d.ck || typeof d.ck !== 'object') d.ck = {};
    const y = tpYear(api), S = tpSummary(y), done = TP_ITEMS.filter(k => d.ck[k]).length, Y0 = new Date().getFullYear();
    box.innerHTML = `<label class="bk-f"><span>${E(t('tp_yearL'))}</span><select id="tp_y">${[Y0, Y0 - 1, Y0 - 2, Y0 - 3, Y0 - 4, Y0 - 5].map(z => `<option value="${z}"${z === y ? ' selected' : ''}>${z}</option>`).join('')}</select></label>
      <div class="hero mi-hero"><span class="hero-label">${E(t('tp_prog'))}</span><span class="hero-value num">${done} / ${TP_ITEMS.length}</span></div>
      <ul class="mi-list">${TP_ITEMS.map(k => `<li class="mi-item"><label class="mi-chk"><input type="checkbox" data-tpck="${k}"${d.ck[k] ? ' checked' : ''}> <span><b>${E(t('tp_i_' + k))}</b></span><small class="fine">${E(t('tp_h_' + k))}</small></label></li>`).join('')}</ul>
      <h4>${E(t('tp_sumH'))}</h4><dl class="ledger mi-led"><div class="row"><dt>${E(t('tp_spend'))}</dt><dd class="num">${E(MI0(S.spend))}</dd></div><div class="row"><dt>${E(t('tp_recs'))}</dt><dd class="num">${S.recs}</dd></div><div class="row"><dt>${E(t('tp_rms'))}</dt><dd class="num">${S.rms}</dd></div></dl>
      <div class="btnrow"><button type="button" class="gold-btn" id="tp_pdf">📄 ${E(t('tp_pdf'))}</button><button type="button" class="mv" id="tp_rem">⏰ ${E(t('tp_rem'))}</button><button type="button" class="mv" data-go="taxrefund">↗ ${E(t('tab_taxrefund'))}</button><button type="button" class="mv" data-go="vault">↗ ${E(t('tab_vault'))}</button></div>`;
    box.querySelectorAll('[data-tpck]').forEach(el => el.addEventListener('change', () => { d.ck[el.dataset.tpck] = el.checked; api.save(); api.redraw(); const n = document.querySelector(`[data-tpck="${el.dataset.tpck}"]`); if (n) n.focus(); }));
    box.querySelector('#tp_y').addEventListener('change', e => { d.y = e.target.value; api.save(); api.redraw(); });
    box.querySelector('#tp_pdf').addEventListener('click', () => tpPdf(api));
    box.querySelector('#tp_rem').addEventListener('click', () => miRemind(t('tp_remT', {y}), rmIso(new Date(Date.now() + 30 * 864e5)), t('tp_remN'), ''));
  }
});

/* ---- inheritance: a guide with a checklist ---- */
const IH_ITEMS = ['cert', 'order', 'banks', 'pens', 'insur', 'debts', 'apt', 'car', 'tax', 'nii'];
miniDef('inherit', {
  intro: 'ih_intro', disc: 'mi_notAdvice', resettable: true,
  render(box, api){
    const E = api.E, d = api.d; if (!d.ck || typeof d.ck !== 'object') d.ck = {};
    const done = IH_ITEMS.filter(k => d.ck[k]).length;
    box.innerHTML = `<div class="hero mi-hero"><span class="hero-label">${E(t('ih_prog'))}</span><span class="hero-value num">${done} / ${IH_ITEMS.length}</span><div class="hero-sub">${E(t('ih_noTax'))}</div></div>
      <ul class="mi-list">${IH_ITEMS.map(k => `<li class="mi-item"><label class="mi-chk"><input type="checkbox" data-ihck="${k}"${d.ck[k] ? ' checked' : ''}> <span><b>${E(t('ih_i_' + k))}</b></span></label><p>${E(t('ih_p_' + k))}</p></li>`).join('')}</ul>
      <p class="mi-links"><a class="src-a" href="https://www.kolzchut.org.il/w/index.php?search=${encodeURIComponent('ירושה')}" target="_blank" rel="noopener noreferrer">${E(t('rt_kz'))} ↗</a> <a class="src-a" href="https://www.gov.il/he/departments/the_inheritance_registrar" target="_blank" rel="noopener noreferrer">${E(t('ih_reg'))} ↗</a></p>`;
    box.querySelectorAll('[data-ihck]').forEach(el => el.addEventListener('change', () => { d.ck[el.dataset.ihck] = el.checked; api.save(); api.redraw(); const n = document.querySelector(`[data-ihck="${el.dataset.ihck}"]`); if (n) n.focus(); }));
  }
});

/* ---- rent: CPI update and the legal cap on the guarantee ---- */
miniDef('rentlaw', {
  intro: 'rl_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'rent', t: 'rl_rent', type: 'num', u: '₪', def: 5000},
    {k: 'linked', t: 'rl_linked', type: 'chk', def: true},
    {k: 'cpi', t: 'rl_cpi', type: 'num', u: '%', def: () => Math.round((typeof MKT === 'object' && isFinite(+MKT.cpi) ? +MKT.cpi : 2) * 10) / 10, h: 'rl_cpiH', show: v => v.linked},
    {k: 'months', t: 'rl_months', type: 'num', u: 'u_mo', def: 12},
    {k: 'guar', t: 'rl_guar', type: 'num', u: '₪', def: 15000, h: 'rl_guarH'}
  ],
  calc(v){
    const rent = Math.max(0, v.rent), nr = v.linked ? rent * (1 + v.cpi / 100) : rent, cap = Math.min(3 * rent, rent * Math.max(0, v.months) / 3), over = v.guar > cap + 0.5;
    return {hero: {l: t('rl_new'), v: MI0(nr), sub: v.linked ? t('rl_diff', {d: MI0(nr - rent), y: MI0((nr - rent) * 12)}) : t('rl_notLinked')},
      warn: over ? t('rl_over', {c: MI0(cap)}) : '',
      rows: [[t('rl_cap'), MI0(cap), 'total'], [t('rl_capWhy'), t('rl_capRule')], [t('rl_guar'), MI0(v.guar)]],
      tips: [t('rl_t1'), t('rl_t2'), t('rl_t3')],
      links: [{t: t('rt_kz'), url: 'https://www.kolzchut.org.il/w/index.php?search=' + encodeURIComponent('שכירות הוגנת')}]};
  }
});

/* ---- an investment apartment ---- */
const iaPtax = price => { try { return bracketTax(price, PT_BR.add).tot; } catch (e) { return price * 0.08; } };
miniDef('invapt', {
  intro: 'ia_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'price', t: 'ia_price', type: 'num', u: '₪', def: 1800000},
    {k: 'equity', t: 'ia_equity', type: 'num', u: '₪', def: 900000, h: 'ia_equityH'},
    {k: 'rate', t: 'ia_rate', type: 'num', u: '%', def: 5},
    {k: 'years', t: 'ia_years', type: 'num', u: 'u_yrs', def: 25},
    {k: 'rent', t: 'ia_rent', type: 'num', u: '₪', def: 5500},
    {k: 'vac', t: 'ia_vac', type: 'num', u: 'u_mo', def: 0.5, h: 'ia_vacH'},
    {k: 'maint', t: 'ia_maint', type: 'num', u: '₪', def: 6000, h: 'ia_maintH'},
    {k: 'costs', t: 'ia_costs', type: 'num', u: '%', def: 2, h: 'ia_costsH'},
    {k: 'ptax', t: 'ia_ptax', type: 'num', u: '₪', def: 0, h: 'ia_ptaxH'},
    {k: 'track', t: 'ia_track', type: 'sel', def: 'exempt', opts: [['exempt', 'ia_tEx'], ['ten', 'ia_tTen'], ['marg', 'ia_tMarg']], h: 'ia_trackH'},
    {k: 'marg', t: 'ia_marg', type: 'num', u: '%', def: 31, show: v => v.track === 'marg'}
  ],
  calc(v){
    const price = Math.max(0, v.price), eq = Math.min(price, Math.max(0, v.equity)), loan = price - eq, pt = v.ptax > 0 ? v.ptax : iaPtax(price), costs = price * Math.max(0, v.costs) / 100;
    const yrRent = Math.max(0, v.rent) * Math.max(0, 12 - Math.max(0, v.vac)), maint = Math.max(0, v.maint);
    const tax = v.track === 'ten' ? yrRent * 0.1 : v.track === 'marg' ? Math.max(0, yrRent - maint) * Math.max(0, v.marg) / 100 : 0;
    const pmt = miPmt(loan, v.rate, Math.max(1, v.years) * 12), interest1 = loan * v.rate / 100, cash = (yrRent - maint - tax) / 12 - pmt, inv = eq + pt + costs;
    const gross = price ? yrRent / price * 100 : 0, netEq = inv ? (yrRent - maint - tax - interest1) / inv * 100 : 0;
    return {hero: {l: t('ia_cash'), v: (cash < 0 ? '−' : '') + MI0(Math.abs(cash)), sub: t(cash < 0 ? 'ia_neg' : 'ia_pos')},
      warn: price && eq < price * 0.5 ? t('ia_ltv') : '',
      rows: [[t('ia_gross'), MIP(gross, 2)], [t('ia_netEq'), MIP(netEq, 2), 'total'], [t('ia_pmt'), MI0(pmt)], [t('ia_ptaxR'), MI0(pt)], [t('ia_costsR'), MI0(costs)], [t('ia_inv'), MI0(inv)], [t('ia_yrRent'), MI0(yrRent)], [t('ia_taxR'), MI0(tax)]],
      note: t('ia_note')};
  }
});

/* ---- renovation ---- */
miniDef('renov', {
  intro: 'rn_intro',
  fields: [
    {k: 'kitchen', t: 'rn_kitchen', type: 'num', u: '₪', def: 45000, h: 'rn_kitchenH'},
    {k: 'baths', t: 'rn_baths', type: 'num', def: 1},
    {k: 'bath', t: 'rn_bath', type: 'num', u: '₪', def: 25000, h: 'rn_bathH'},
    {k: 'floor', t: 'rn_floor', type: 'num', u: 'u_m2', def: 0},
    {k: 'floorP', t: 'rn_floorP', type: 'num', u: '₪', def: 250, h: 'rn_floorPH'},
    {k: 'paint', t: 'rn_paint', type: 'num', u: '₪', def: 8000},
    {k: 'elec', t: 'rn_elec', type: 'num', u: '₪', def: 0},
    {k: 'other', t: 'rn_other', type: 'num', u: '₪', def: 0},
    {k: 'cont', t: 'rn_cont', type: 'num', u: '%', def: 15, h: 'rn_contH'},
    {k: 'value', t: 'rn_value', type: 'num', u: '₪', def: 0, h: 'rn_valueH'},
    {k: 'up', t: 'rn_up', type: 'num', u: '%', def: 0, show: v => v.value > 0}
  ],
  calc(v){
    const parts = [[t('rn_kitchen'), v.kitchen], [t('rn_bath'), v.baths * v.bath], [t('rn_floor'), v.floor * v.floorP], [t('rn_paint'), v.paint], [t('rn_elec'), v.elec], [t('rn_other'), v.other]].map(([l, x]) => [l, Math.max(0, x || 0)]).filter(p => p[1] > 0);
    const sub = parts.reduce((s, p) => s + p[1], 0), cont = sub * Math.max(0, v.cont) / 100, tot = sub + cont, gain = v.value > 0 ? v.value * Math.max(0, v.up) / 100 : 0;
    return {hero: {l: t('rn_total'), v: MI0(tot), sub: t('rn_withCont', {c: MI0(cont)})},
      bars: parts.map(p => ({l: p[0], v: p[1]})),
      rows: [[t('rn_sub'), MI0(sub)], [t('rn_contR'), MI0(cont)], [t('rn_total'), MI0(tot), 'total']].concat(gain ? [[t('rn_gain'), MI0(gain)], [t('rn_net'), (gain - tot < 0 ? '−' : '') + MI0(Math.abs(gain - tot))]] : []),
      note: t('rn_note')};
  }
});

/* ---- building committee: split the cost ---- */
miniDef('vaad', {
  intro: 'va_intro', resettable: true,
  render(box, api){
    const E = api.E, d = api.d; if (!Array.isArray(d.apts) || !d.apts.length) d.apts = Array.from({length: 8}, () => '90');
    const total = miN(d.total == null ? 2400 : d.total), mode = d.mode || 'equal', A = d.apts.map(miN), sum = A.reduce((s, x) => s + Math.max(0, x), 0);
    const share = i => mode === 'area' ? (sum ? total * Math.max(0, A[i]) / sum : 0) : total / A.length;
    box.innerHTML = `<div class="mi-card"><div class="bk-grid mi-grid"><label class="bk-f"><span>${E(t('va_total'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="va_total" value="${E(d.total == null ? '2400' : d.total)}"></label>
      <label class="bk-f"><span>${E(t('va_mode'))}</span><select id="va_mode"><option value="equal"${mode === 'equal' ? ' selected' : ''}>${E(t('va_equal'))}</option><option value="area"${mode === 'area' ? ' selected' : ''}>${E(t('va_area'))}</option></select></label></div></div>
      <div class="hero mi-hero"><span class="hero-label">${E(t('va_avg'))}</span><span class="hero-value num">${E(MI0(total / A.length))}</span><div class="hero-sub">${E(t('va_year', {y: MI0(total * 12)}))}</div></div>
      <ul class="mi-list">${A.map((x, i) => `<li class="mi-item"><div class="bk-grid mi-grid"><label class="bk-f"><span>${E(t('va_apt', {n: i + 1}))}${mode === 'area' ? ' (' + E(t('u_m2')) + ')' : ''}</span>${mode === 'area' ? `<input type="text" inputmode="decimal" dir="ltr" data-vaa="${i}" value="${E(d.apts[i])}">` : `<b class="num">${E(MI0(share(i)))}</b>`}</label>${mode === 'area' ? `<span class="bk-f"><span>${E(t('va_share'))}</span><b class="num" data-vas="${i}">${E(MI0(share(i)))}</b></span>` : ''}</div></li>`).join('')}</ul>
      <div class="btnrow"><button type="button" class="mv" id="va_add">＋ ${E(t('va_addApt'))}</button><button type="button" class="mv" id="va_del"${A.length < 2 ? ' disabled' : ''}>− ${E(t('va_delApt'))}</button></div>`;
    let T0 = 0; const later = () => { clearTimeout(T0); T0 = setTimeout(() => api.save(), 400); };
    box.querySelector('#va_total').addEventListener('input', e => { d.total = e.target.value; later(); const tot = miN(e.target.value); box.querySelector('.hero-value').textContent = MI0(tot / A.length); box.querySelector('.hero-sub').textContent = t('va_year', {y: MI0(tot * 12)}); box.querySelectorAll('[data-vas]').forEach(n => { const i = +n.dataset.vas, S = d.apts.map(miN).reduce((s, x) => s + Math.max(0, x), 0); n.textContent = MI0(S ? tot * Math.max(0, miN(d.apts[i])) / S : 0); }); if (mode === 'equal') box.querySelectorAll('.mi-item b.num').forEach(n => { n.textContent = MI0(tot / A.length); }); });
    box.querySelector('#va_mode').addEventListener('change', e => { d.mode = e.target.value; api.save(); api.redraw(); });
    box.querySelectorAll('[data-vaa]').forEach(el => el.addEventListener('input', () => { d.apts[+el.dataset.vaa] = el.value; later(); const tot = miN(d.total == null ? 2400 : d.total), S = d.apts.map(miN).reduce((s, x) => s + Math.max(0, x), 0); box.querySelectorAll('[data-vas]').forEach(n => { n.textContent = MI0(S ? tot * Math.max(0, miN(d.apts[+n.dataset.vas])) / S : 0); }); }));
    box.querySelector('#va_add').addEventListener('click', () => { d.apts.push(d.apts[d.apts.length - 1] || '90'); api.save(); api.redraw(); });
    box.querySelector('#va_del').addEventListener('click', () => { if (d.apts.length > 1){ d.apts.pop(); api.save(); api.redraw(); } });
  }
});

try { Object.assign(GS_SYN, {payslip: 'תלוש משכורת בדיקה טעות payslip check قسيمة راتب', realwage: 'שכר לשעה נסיעות hourly wage commute أجر الساعة', raise: 'העלאה העלאת שכר raise salary increase زيادة راتب', taxpack: 'רואה חשבון החזר מס 106 תרומות accountant tax refund pack محاسب استرداد ضريبة', inherit: 'ירושה צוואה צו ירושה inheritance will probate ميراث وصية', rentlaw: 'שכירות ערבות הצמדה חוק שכירות הוגנת rent guarantee deposit إيجار كفالة', invapt: 'דירה להשקעה תשואה investment apartment yield شقة استثمارية', renov: 'שיפוץ מטבח אמבטיה renovation شقة ترميم', vaad: 'ועד בית חלוקה building committee لجنة البناية'}); } catch (e) {}

Object.assign(T, {
  /* rights: new immigrants */
  rt_q_oleh22:['עליתי בשנת 2022 או אחריה','قدمت في عام 2022 أو بعده','I made aliyah in 2022 or later'], rt_q_olehMo:['חודשים מאז העלייה (לעולים)','أشهر منذ القدوم (للقادمين الجدد)','Months since aliyah (immigrants)'],
  /* payslip */
  tab_payslip:['בדיקת תלוש','فحص قسيمة الراتب','Payslip check'], d_payslip:['צלמו או הקלידו את התלוש, ובדקו שהמס, הביטוח הלאומי וההפרשות נכונים.','صوّروا القسيمة أو اكتبوا أرقامها، وتحققوا من صحة الضريبة والتأمين الوطني والاقتطاعات.','Photograph or type your payslip and check the tax, National Insurance and deductions.'],
  ps_intro:['טעויות בתלוש נפוצות יותר ממה שנדמה – נקודות זיכוי שחסרות, הפרשה לפנסיה שלא נכנסה או מס גבוה מדי.','الأخطاء في القسيمة أكثر شيوعًا مما يبدو – نقاط ائتمان ناقصة، أو اقتطاع تقاعد لم يُسجَّل، أو ضريبة مرتفعة.','Payslip mistakes are more common than you think – missing credit points, a pension deposit that didn\'t go in, or too much tax.'],
  ps_how:['הבדיקה משווה את התלוש לחישוב במחשבון השכר. כדי שתהיה מדויקת, מלאו שם את פרטי השכר שלכם.','يقارن الفحص القسيمة بحساب حاسبة الراتب. لدقة أكبر املؤوا هناك تفاصيل راتبكم.','The check compares the payslip with the salary calculator. For accuracy, fill in your salary details there.'],
  /* real hourly wage */
  tab_realwage:['שווי שעה אמיתי','قيمة الساعة الحقيقية','Real hourly wage'], d_realwage:['כמה אתם מרוויחים באמת לשעה, אחרי נסיעות, זמן בדרך והוצאות של העבודה.','كم تكسبون فعلًا في الساعة بعد المواصلات ووقت الطريق ومصاريف العمل.','What you really earn per hour after commuting, travel time and work costs.'],
  rw_intro:['השכר לשעה בתלוש לא מספר את כל הסיפור: הדרך לעבודה והוצאות העבודה מורידים ממנו.','الأجر بالساعة في القسيمة لا يروي القصة كاملة: الطريق إلى العمل ومصاريفه تُنقصه.','The hourly wage on the payslip isn\'t the whole story: the commute and work costs eat into it.'],
  rw_net:['שכר נטו בחודש','الراتب الصافي شهريًا','Monthly net pay'], rw_hpw:['שעות עבודה בשבוע','ساعات العمل أسبوعيًا','Work hours a week'], rw_days:['ימי עבודה בחודש','أيام العمل شهريًا','Work days a month'],
  rw_cmin:['דקות נסיעה ביום (הלוך וחזור)','دقائق السفر يوميًا (ذهابًا وإيابًا)','Commute minutes a day (both ways)'], rw_cminH:['הזמן הזה הוא חלק מיום העבודה שלכם, גם אם לא משלמים עליו.','هذا الوقت جزء من يوم عملكم حتى لو لم يُدفع عنه.','This time is part of your workday even if it isn\'t paid.'],
  rw_ccost:['עלות נסיעות בחודש','تكلفة المواصلات شهريًا','Commuting cost a month'], rw_wcost:['הוצאות עבודה אחרות בחודש','مصاريف عمل أخرى شهريًا','Other work costs a month'], rw_wcostH:['אוכל בחוץ, בגדים לעבודה, חניה, מטפלת בשעות העבודה.','أكل في الخارج، ملابس عمل، موقف، جليسة خلال ساعات العمل.','Eating out, work clothes, parking, childcare during work hours.'],
  rw_need:['מלאו שכר ושעות עבודה.','املؤوا الراتب وساعات العمل.','Fill in pay and work hours.'], rw_real:['שווי שעה אמיתי','قيمة الساعة الحقيقية','Real hourly wage'], rw_sub:['לעומת {n} לפי התלוש – {p} פחות','مقابل {n} حسب القسيمة – أقل بـ{p}','vs {n} on paper – {p} less'],
  rw_nom:['לשעה לפי התלוש (נטו)','بالساعة حسب القسيمة (صافي)','Per hour on paper (net)'], rw_hrsM:['שעות עבודה בחודש','ساعات العمل شهريًا','Work hours a month'], rw_commM:['שעות בדרך בחודש','ساعات في الطريق شهريًا','Hours commuting a month'], rw_h:['{n} שעות','{n} ساعة','{n} h'],
  rw_costM:['הוצאות העבודה בחודש','مصاريف العمل شهريًا','Work costs a month'], rw_left:['נשאר בכיס בחודש','يبقى في الجيب شهريًا','Left in your pocket a month'],
  rw_note:['שימושי להשוואת הצעות עבודה: עבודה קרובה יותר עם שכר נמוך מעט יכולה להשתלם יותר.','مفيد لمقارنة عروض العمل: عمل أقرب براتب أقل قليلًا قد يكون مجديًا أكثر.','Handy for comparing job offers: a closer job with slightly lower pay can be worth more.'],
  /* raise */
  tab_raise:['בקשת העלאה','طلب زيادة','Asking for a raise'], d_raise:['כמה לבקש, כמה האינפלציה כבר שחקה מהשכר, ונוסח מנומס לבקשה.','كم تطلبون، وكم أكل التضخم من الراتب، وصياغة مهذبة للطلب.','How much to ask for, how much inflation has eaten into your pay, and a polite draft.'],
  rs_intro:['בלי העלאה, השכר שלכם יורד כל שנה בגובה האינפלציה. הנה בסיס מספרי לשיחה.','بدون زيادة ينخفض راتبكم كل سنة بقدر التضخم. إليكم أساسًا رقميًا للمحادثة.','Without a raise your pay shrinks every year by inflation. Here\'s a number-based starting point.'],
  rs_gross:['שכר ברוטו היום','الراتب الإجمالي اليوم','Gross pay today'], rs_months:['חודשים מאז ההעלאה האחרונה','أشهر منذ آخر زيادة','Months since the last raise'], rs_cpi:['אינפלציה שנתית','التضخم السنوي','Yearly inflation'], rs_cpiH:['ברירת המחדל היא המדד ב־12 החודשים האחרונים.','القيمة الافتراضية هي المؤشر في آخر 12 شهرًا.','The default is the CPI over the last 12 months.'],
  rs_perf:['איך הלך לכם השנה','كيف كان أداؤكم هذا العام','How your year went'], rs_pOk:['כרגיל','عادي','As usual'], rs_pGood:['טוב – עמדתי ביעדים','جيد – حققت الأهداف','Good – met my goals'], rs_pTop:['מצוין – מעבר לציפיות','ممتاز – فوق التوقعات','Excellent – beyond expectations'],
  rs_role:['התפקיד או האחריות גדלו','زادت الوظيفة أو المسؤولية','My role or responsibility grew'],
  rs_ask:['כדאי לבקש בערך','يُستحسن طلب حوالي','Ask for about'], rs_askS:['תוספת של {a} בחודש – שכר חדש {n}','زيادة {a} شهريًا – راتب جديد {n}','{a} more a month – new pay {n}'],
  rs_lost:['האינפלציה מאז ההעלאה','التضخم منذ الزيادة','Inflation since the raise'], rs_loseM:['ערך שנשחק בחודש','قيمة تآكلت شهريًا','Value lost a month'], rs_new:['השכר המבוקש','الراتب المطلوب','Requested pay'], rs_year:['תוספת בשנה','الزيادة سنويًا','Extra a year'],
  rs_t1:['הכינו 3 דוגמאות להצלחות מהשנה, עם מספרים אם אפשר.','حضّروا 3 أمثلة لنجاحات هذا العام، مع أرقام إن أمكن.','Prepare 3 examples of this year\'s wins, with numbers if you can.'], rs_t2:['בקשו פגישה מראש, לא במסדרון.','اطلبوا اجتماعًا مسبقًا، لا في الممر.','Ask for a meeting in advance, not in the corridor.'], rs_t3:['אם התשובה "לא עכשיו" – סכמו מתי חוזרים לנושא ומה צריך לקרות עד אז.','إذا كان الجواب "ليس الآن" – اتفقوا على موعد العودة للموضوع وما يجب أن يحدث حتى ذلك الحين.','If the answer is "not now", agree when you\'ll revisit it and what needs to happen first.'],
  rs_draft:['ניסוח בקשה עם העוזר','صياغة الطلب مع المساعد','Draft the request with the assistant'],
  rs_aiQ:['נסח לי בקשה קצרה ומנומסת להעלאת שכר למנהל/ת שלי. השכר היום {g} ברוטו, עברו {m} חודשים מההעלאה האחרונה, האינפלציה מאז בערך {c}. אני רוצה לבקש בערך {p} – שכר של {n}. בלי שמות, 5–7 משפטים.','صغ لي طلبًا قصيرًا ومهذبًا لزيادة الراتب لمديري. راتبي اليوم {g} إجمالي، مرّ {m} شهرًا منذ آخر زيادة، والتضخم منذ ذلك الحين حوالي {c}. أريد طلب حوالي {p} – راتب {n}. بدون أسماء، 5–7 جمل.','Draft a short, polite raise request to my manager. My pay today is {g} gross, {m} months since the last raise, inflation since then about {c}. I want to ask for about {p} – {n}. No names, 5–7 sentences.'],
  /* tax pack */
  tab_taxpack:['תיק שנתי לרו״ח','الملف السنوي للمحاسب','Yearly pack for the accountant'], d_taxpack:['רשימה מסודרת של כל מה שצריך להחזר מס או לרואה החשבון, וסיכום PDF בלחיצה.','قائمة منظمة بكل ما يلزم لاسترداد الضريبة أو للمحاسب، وملخص PDF بنقرة.','A tidy list of everything needed for a tax refund or the accountant, and a PDF summary in one tap.'],
  tp_intro:['סמנו מה כבר אספתם. בסוף שומרים סיכום PDF ושולחים לרואה החשבון או מצרפים לבקשה להחזר מס.','ضعوا علامة على ما جمعتموه. في النهاية احفظوا ملخص PDF وأرسلوه للمحاسب أو أرفقوه بطلب الاسترداد.','Tick what you\'ve collected. Then save a PDF summary to send to the accountant or attach to a refund request.'],
  tp_yearL:['שנת המס','سنة الضريبة','Tax year'], tp_year:['שנת המס {y}','سنة الضريبة {y}','Tax year {y}'], tp_prog:['נאסף','تم جمعه','Collected'], tp_listH:['מסמכים','المستندات','Documents'], tp_sumH:['מהאפליקציה','من التطبيق','From the app'],
  tp_i_f106:['טופס 106 מכל מעסיק','نموذج 106 من كل مشغّل','Form 106 from each employer'], tp_h_f106:['מקבלים מהמעסיק עד סוף מרץ.','يُستلم من المشغّل حتى نهاية آذار.','Employers issue it by the end of March.'],
  tp_i_two:['עבודה ביותר ממקום אחד באותה שנה','العمل في أكثر من مكان في السنة نفسها','More than one job in the same year'], tp_h_two:['סיבה נפוצה להחזר מס, במיוחד בלי תיאום מס.','سبب شائع لاسترداد الضريبة خاصة بدون تنسيق ضريبي.','A common reason for a refund, especially without tax coordination.'],
  tp_i_donate:['קבלות על תרומות (סעיף 46)','إيصالات تبرعات (البند 46)','Donation receipts (section 46)'], tp_h_donate:['רק לעמותות מוכרות. שומרים את הקבלה המקורית.','فقط لجمعيات معترف بها. احتفظوا بالإيصال الأصلي.','Only to recognised charities. Keep the original receipt.'],
  tp_i_life:['ביטוח חיים פרטי','تأمين حياة خاص','Private life insurance'], tp_h_life:['אישור שנתי מחברת הביטוח.','تأكيد سنوي من شركة التأمين.','An annual statement from the insurer.'],
  tp_i_pens:['הפקדות עצמאיות לפנסיה','إيداعات ذاتية للتقاعد','Self-made pension deposits'], tp_h_pens:['אישור שנתי מהקופה.','تأكيد سنوي من الصندوق.','An annual statement from the fund.'],
  tp_i_kids:['ילדים – תעודות לידה או ספח','الأطفال – شهادات ميلاد أو ملحق الهوية','Children – birth certificates or ID appendix'], tp_h_kids:['לנקודות זיכוי על ילדים.','لنقاط الائتمان عن الأطفال.','For child credit points.'],
  tp_i_degree:['אישור זכאות לתואר','شهادة استحقاق اللقب','Degree certificate'], tp_h_degree:['נקודת זיכוי בשנים שאחרי סיום התואר.','نقطة ائتمان في السنوات التي تلي إنهاء اللقب.','A credit point in the years after graduating.'],
  tp_i_soldier:['תעודת שחרור','شهادة تسريح','Discharge certificate'], tp_h_soldier:['נקודות זיכוי ב־3 השנים שאחרי השחרור.','نقاط ائتمان في 3 سنوات بعد التسريح.','Credit points in the 3 years after discharge.'],
  tp_i_move:['מעבר דירה או יישוב מזכה','الانتقال إلى بلدة مؤهلة','Moving to an eligible town'], tp_h_move:['אישור תושבות מהרשות.','تأكيد سكن من السلطة المحلية.','A residence certificate from the council.'],
  tp_i_unemp:['דמי אבטלה או לידה','بدل بطالة أو ولادة','Unemployment or maternity pay'], tp_h_unemp:['טופס 106 מביטוח לאומי.','نموذج 106 من التأمين الوطني.','Form 106 from National Insurance.'],
  tp_i_reserve:['תגמולי מילואים','بدلات الاحتياط','Reserve-duty pay'], tp_h_reserve:['אישור מביטוח לאומי על התשלומים.','تأكيد من التأمين الوطني على الدفعات.','A statement from National Insurance.'],
  tp_i_f867:['טופס 867 – מכירת מניות וריביות','نموذج 867 – بيع أسهم وفوائد','Form 867 – share sales and interest'], tp_h_f867:['מהבנק או מבית ההשקעות; מאפשר לקזז הפסדים.','من البنك أو بيت الاستثمار؛ يتيح مقاصة الخسائر.','From the bank or broker; lets you offset losses.'],
  tp_i_rent:['הכנסה משכירות','دخل من الإيجار','Rental income'], tp_h_rent:['חוזים וקבלות; בודקים איזה מסלול מס משתלם.','عقود وإيصالات؛ افحصوا أي مسار ضريبي أجدى.','Contracts and receipts; check which tax track pays off.'],
  tp_spend:['הוצאות שנרשמו בשנה','المصاريف المسجلة في السنة','Spending logged this year'], tp_recs:['קבלות שמורות מהשנה','إيصالات محفوظة من السنة','Receipts saved this year'], tp_rms:['תזכורות מס פתוחות','تذكيرات ضريبية مفتوحة','Open tax reminders'],
  tp_pdf:['שמירת סיכום PDF','حفظ ملخص PDF','Save a PDF summary'], tp_rem:['תזכורת להגשה','تذكير بالتقديم','Reminder to file'], tp_pdfT:['תיק שנתי לרואה חשבון','الملف السنوي للمحاسب','Yearly pack for the accountant'],
  tp_remT:['הגשת בקשה להחזר מס לשנת {y}','تقديم طلب استرداد ضريبة لسنة {y}','File a tax refund request for {y}'], tp_remN:['אפשר להגיש עד 6 שנים אחורה.','يمكن التقديم حتى 6 سنوات للوراء.','You can file up to 6 years back.'],
  tp_foot:['נוצר במחשבון הפיננסי · מידע כללי, לא ייעוץ מס','أُنشئ في الحاسبة المالية · معلومات عامة وليست استشارة ضريبية','Made with the financial calculator · general information, not tax advice'],
  /* inheritance */
  tab_inherit:['ירושה','الميراث','Inheritance'], d_inherit:['מה עושים עם חשבונות, פנסיה, ביטוחים ודירה שעוברים בירושה – רשימה מסודרת.','ماذا تفعلون بالحسابات والتقاعد والتأمينات والشقة الموروثة – قائمة منظمة.','What to do with accounts, pensions, insurance and an apartment that are inherited – a tidy list.'],
  ih_intro:['רשימה כללית שעוזרת לא לפספס דברים בתקופה לא פשוטה. הפרטים משתנים ממקרה למקרה.','قائمة عامة تساعد على ألا يفوتكم شيء في فترة صعبة. التفاصيل تختلف من حالة لأخرى.','A general list to help you not miss things at a hard time. Details vary case by case.'],
  ih_prog:['טופל','تمت معالجته','Handled'], ih_noTax:['בישראל אין מס ירושה.','لا توجد ضريبة ميراث في إسرائيل.','Israel has no inheritance tax.'], ih_reg:['הרשם לענייני ירושה','مسجّل شؤون الميراث','Inheritance registrar'],
  ih_i_cert:['תעודת פטירה','شهادة وفاة','Death certificate'], ih_p_cert:['נדרשת כמעט לכל פנייה – כדאי להוציא כמה עותקים.','مطلوبة لكل توجه تقريبًا – يُستحسن استخراج عدة نسخ.','Needed for almost everything – get several copies.'],
  ih_i_order:['צו ירושה או צו קיום צוואה','أمر ميراث أو أمر تنفيذ وصية','Succession order or probate order'], ih_p_order:['מגישים לרשם לענייני ירושה. בלי הצו רוב הגופים לא ישחררו כספים.','يُقدَّم لمسجّل شؤون الميراث. بدون الأمر معظم الجهات لن تحرر الأموال.','Filed with the inheritance registrar. Without it most institutions won\'t release funds.'],
  ih_i_banks:['חשבונות בנק','حسابات البنك','Bank accounts'], ih_p_banks:['החשבון מוקפא עד הצגת הצו. הוראות קבע והכנסות קבועות כדאי לעדכן.','يُجمَّد الحساب حتى عرض الأمر. يُستحسن تحديث الأوامر الثابتة والمداخيل الثابتة.','The account is frozen until the order is shown. Update standing orders and regular income.'],
  ih_i_pens:['פנסיה, השתלמות וגמל','التقاعد، صندوق الاستكمال والادخار','Pension, study and provident funds'], ih_p_pens:['הכסף עובר למוטבים שנרשמו בקופה, ואם אין – לפי הצו. לפעמים מגיעה גם קצבת שארים.','المال ينتقل للمستفيدين المسجلين في الصندوق، وإن لم يوجدوا – حسب الأمر. أحيانًا تُستحق أيضًا مخصصات ورثة.','Money goes to the beneficiaries named in the fund, or by the order if none. Sometimes a survivors\' pension is due too.'],
  ih_i_insur:['ביטוחי חיים ומשכנתא','تأمينات الحياة والرهن','Life and mortgage insurance'], ih_p_insur:['בודקים בהר הביטוח אילו פוליסות היו, ומגישים תביעה.','افحصوا في "هار هبيطواح" أي بوالص كانت وقدموا مطالبة.','Check the insurance registry for policies and file claims.'],
  ih_i_debts:['חובות','الديون','Debts'], ih_p_debts:['חובות משולמים מתוך העיזבון בלבד, לא מהכסף הפרטי של היורשים.','تُسدد الديون من التركة فقط، لا من مال الورثة الخاص.','Debts are paid from the estate only, not from the heirs\' own money.'],
  ih_i_apt:['דירה','الشقة','Apartment'], ih_p_apt:['רישום בטאבו לפי הצו. מכירה של דירה שהתקבלה בירושה יכולה להיות פטורה ממס שבח בתנאים מסוימים – כדאי לבדוק לפני מכירה.','تسجيل في الطابو حسب الأمر. بيع شقة موروثة قد يُعفى من ضريبة الشفاح بشروط معينة – افحصوا قبل البيع.','Register in the land registry by the order. Selling an inherited apartment may be exempt from capital-gains tax under some conditions – check before selling.'],
  ih_i_car:['רכב','السيارة','Car'], ih_p_car:['העברת בעלות במשרד הרישוי ועדכון הביטוח.','نقل الملكية في مكتب الترخيص وتحديث التأمين.','Transfer ownership at the licensing office and update the insurance.'],
  ih_i_tax:['דוח למס הכנסה','تقرير لضريبة الدخل','Income tax return'], ih_p_tax:['לפעמים צריך להגיש דוח על השנה האחרונה – ולפעמים מגיע החזר.','أحيانًا يجب تقديم تقرير عن السنة الأخيرة – وأحيانًا يُستحق استرداد.','Sometimes a return is due for the last year – and sometimes a refund.'],
  ih_i_nii:['ביטוח לאומי','التأمين الوطني','National Insurance'], ih_p_nii:['מענק פטירה וקצבת שארים לבני זוג וילדים, לפי הזכאות.','منحة وفاة ومخصصات ورثة للأزواج والأطفال حسب الاستحقاق.','A death grant and survivors\' allowance for spouses and children, if eligible.'],
  /* rent */
  tab_rentlaw:['שכירות: הצמדה וערבות','الإيجار: الربط والكفالة','Rent: indexation & guarantee'], d_rentlaw:['כמה תעלה השכירות לפי המדד, ומה הערבות המקסימלית שמותר לבקש לפי חוק השכירות ההוגנת.','كم سيرتفع الإيجار حسب المؤشر، وما أقصى كفالة يُسمح بطلبها حسب قانون الإيجار العادل.','How much the rent rises with the CPI, and the most a landlord may ask as a guarantee under the Fair Rental Law.'],
  rl_intro:['חוזה שכירות צמוד מדד מתעדכן לפי השינוי במדד מאז החתימה. החוק גם מגביל את גובה הערבות.','عقد الإيجار المربوط بالمؤشر يتحدث حسب تغير المؤشر منذ التوقيع. والقانون يحدد أيضًا سقف الكفالة.','A CPI-linked lease updates by the change in the CPI since signing. The law also caps the guarantee.'],
  rl_rent:['שכירות חודשית היום','الإيجار الشهري اليوم','Monthly rent today'], rl_linked:['החוזה צמוד למדד','العقد مربوط بالمؤشر','The lease is CPI-linked'], rl_cpi:['שינוי במדד מאז החתימה','تغير المؤشر منذ التوقيع','CPI change since signing'], rl_cpiH:['ברירת המחדל היא המדד ב־12 החודשים האחרונים. אם יש לכם מדד בסיס ומדד נוכחי – חשבו את השינוי ביניהם.','القيمة الافتراضية هي المؤشر في آخر 12 شهرًا. إن كان لديكم مؤشر أساس ومؤشر حالي – احسبوا التغير بينهما.','The default is the last 12 months\' CPI. If you have a base and a current index, use the change between them.'],
  rl_months:['תקופת השכירות','مدة الإيجار','Lease period'], rl_guar:['ערבות שהמשכיר מבקש','الكفالة التي يطلبها المؤجر','Guarantee the landlord asks for'], rl_guarH:['פיקדון, צ׳ק ביטחון או ערבות בנקאית.','وديعة، شيك ضمان أو كفالة بنكية.','A deposit, security cheque or bank guarantee.'],
  rl_new:['השכירות אחרי ההצמדה','الإيجار بعد الربط','Rent after indexation'], rl_diff:['+{d} בחודש, {y} בשנה','+{d} شهريًا، {y} سنويًا','+{d} a month, {y} a year'], rl_notLinked:['החוזה לא צמוד – השכירות לא משתנה','العقد غير مربوط – الإيجار لا يتغير','Not linked – the rent stays the same'],
  rl_cap:['הערבות המקסימלית לפי החוק','الحد الأقصى للكفالة حسب القانون','Legal maximum guarantee'], rl_capWhy:['הכלל','القاعدة','The rule'], rl_capRule:['הנמוך מבין 3 חודשי שכירות לבין שליש מכל השכירות לתקופה','الأقل بين 3 أشهر إيجار وثلث مجموع الإيجار للمدة','The lower of 3 months\' rent and a third of the total rent for the period'],
  rl_over:['הערבות שמבקשים גבוהה מהמותר לפי החוק ({c}).','الكفالة المطلوبة أعلى من المسموح حسب القانون ({c}).','The guarantee asked is above the legal cap ({c}).'],
  rl_t1:['המשכיר צריך להחזיר את הערבות תוך 60 יום מסוף השכירות, אלא אם יש חוב או נזק.','على المؤجر إعادة الكفالة خلال 60 يومًا من نهاية الإيجار إلا إذا وُجد دين أو ضرر.','The landlord must return the guarantee within 60 days of the lease ending, unless there\'s a debt or damage.'], rl_t2:['תיווך משלם מי שהזמין את המתווך – ברוב המקרים המשכיר.','يدفع السمسرة من طلب السمسار – في معظم الحالات المؤجر.','Agency fees are paid by whoever hired the agent – usually the landlord.'], rl_t3:['ביטוח מבנה ותיקונים של בלאי רגיל – על המשכיר.','تأمين المبنى وإصلاح البلى العادي – على المؤجر.','Building insurance and normal wear repairs are on the landlord.'],
  /* investment apartment */
  tab_invapt:['דירה להשקעה','شقة استثمارية','Investment apartment'], d_invapt:['תשואה אמיתית על דירה להשקעה – אחרי מס רכישה, משכנתא, תחזוקה וחודשים בלי שוכר.','العائد الحقيقي على شقة استثمارية – بعد ضريبة الشراء والرهن والصيانة وأشهر بلا مستأجر.','The real return on an investment apartment – after purchase tax, mortgage, upkeep and empty months.'],
  ia_intro:['תשואה "על הנייר" של 3% יכולה להפוך לתזרים שלילי. הנה התמונה המלאה.','عائد 3% "على الورق" قد يتحول إلى تدفق سلبي. إليكم الصورة الكاملة.','A 3% "paper" yield can turn into negative cash flow. Here\'s the full picture.'],
  ia_price:['מחיר הדירה','سعر الشقة','Apartment price'], ia_equity:['הון עצמי','رأس المال الذاتي','Equity'], ia_equityH:['לדירה נוספת אפשר לקבל משכנתא עד 50% ממחיר הדירה.','لشقة إضافية يمكن الحصول على رهن حتى 50% من سعرها.','For an additional apartment, a mortgage is up to 50% of the price.'],
  ia_rate:['ריבית משכנתא','فائدة الرهن','Mortgage rate'], ia_years:['תקופת המשכנתא','مدة الرهن','Mortgage term'], ia_rent:['שכירות חודשית','الإيجار الشهري','Monthly rent'], ia_vac:['חודשים בלי שוכר בשנה','أشهر بلا مستأجر سنويًا','Empty months a year'], ia_vacH:['חצי חודש בשנה זו הערכה סבירה.','نصف شهر سنويًا تقدير معقول.','Half a month a year is a fair guess.'],
  ia_maint:['תחזוקה ותיקונים בשנה','الصيانة والتصليحات سنويًا','Upkeep and repairs a year'], ia_maintH:['כולל ביטוח, ועד בית שלא משולם ע״י השוכר ותיקונים.','يشمل التأمين، لجنة البناية التي لا يدفعها المستأجر والتصليحات.','Including insurance, building fees not paid by the tenant and repairs.'],
  ia_costs:['עו״ד, תיווך ועלויות קנייה','محامٍ، سمسرة وتكاليف شراء','Lawyer, agent and buying costs'], ia_costsH:['באחוזים ממחיר הדירה.','كنسبة من سعر الشقة.','As a share of the price.'],
  ia_ptax:['מס רכישה','ضريبة الشراء','Purchase tax'], ia_ptaxH:['השאירו 0 לחישוב אוטומטי לפי מדרגות דירה נוספת.','اتركوا 0 للحساب التلقائي حسب درجات الشقة الإضافية.','Leave 0 to calculate it with the additional-apartment brackets.'],
  ia_track:['מס על השכירות','الضريبة على الإيجار','Tax on the rent'], ia_tEx:['פטור (מתחת לתקרה)','معفى (تحت السقف)','Exempt (under the ceiling)'], ia_tTen:['מסלול 10%','مسار 10%','10% track'], ia_tMarg:['מס שולי','ضريبة هامشية','Marginal tax'], ia_trackH:['תקרת הפטור מתעדכנת כל שנה – בדקו במחשבון הכנסה משכירות.','سقف الإعفاء يتحدث سنويًا – افحصوا في حاسبة دخل الإيجار.','The exemption ceiling changes yearly – check in the rental-income calculator.'],
  ia_marg:['שיעור המס השולי','نسبة الضريبة الهامشية','Marginal tax rate'],
  ia_cash:['תזרים חודשי','التدفق الشهري','Monthly cash flow'], ia_neg:['כל חודש תוסיפו מהכיס','ستضيفون من جيبكم كل شهر','You\'ll top up every month'], ia_pos:['השכירות מכסה את ההוצאות','الإيجار يغطي المصاريف','The rent covers the costs'],
  ia_ltv:['ההון העצמי נמוך מ־50% – לדירה נוספת סביר שהבנק לא יאשר משכנתא כזו.','رأس المال الذاتي أقل من 50% – لشقة إضافية على الأرجح لن يوافق البنك على رهن كهذا.','Equity is under 50% – for an additional apartment the bank likely won\'t approve such a mortgage.'],
  ia_gross:['תשואה ברוטו','العائد الإجمالي','Gross yield'], ia_netEq:['תשואה נטו על ההון שהשקעתם','العائد الصافي على رأس المال المستثمر','Net return on your money'], ia_pmt:['החזר משכנתא חודשי','قسط الرهن الشهري','Monthly mortgage payment'], ia_ptaxR:['מס רכישה','ضريبة الشراء','Purchase tax'], ia_costsR:['עלויות קנייה','تكاليف الشراء','Buying costs'],
  ia_inv:['סך הכסף שלכם בעסקה','مجموع أموالكم في الصفقة','Your total money in'], ia_yrRent:['שכירות בשנה','الإيجار سنويًا','Rent a year'], ia_taxR:['מס על השכירות בשנה','الضريبة على الإيجار سنويًا','Tax on rent a year'],
  ia_note:['לא כולל עליית ערך הדירה ומס שבח במכירה. התשואה נטו מחושבת לשנה הראשונה.','لا يشمل ارتفاع قيمة الشقة وضريبة الشفاح عند البيع. العائد الصافي محسوب للسنة الأولى.','Excludes price growth and capital-gains tax on sale. Net return is for the first year.'],
  /* renovation */
  tab_renov:['שיפוץ','الترميم','Renovation'], d_renov:['תקציב שיפוץ לפי חלקים בבית, עם מרווח לחריגות.','ميزانية ترميم حسب أجزاء البيت مع هامش للتجاوزات.','A renovation budget by part of the home, with room for overruns.'],
  rn_intro:['המחירים בברירת המחדל הם הערכה גסה בלבד – החליפו אותם בהצעות מחיר אמיתיות.','الأسعار الافتراضية تقدير تقريبي فقط – استبدلوها بعروض أسعار حقيقية.','The default prices are rough guesses – replace them with real quotes.'],
  rn_kitchen:['מטבח','المطبخ','Kitchen'], rn_kitchenH:['מטבח חדש: בערך 30–80 אלף ₪.','مطبخ جديد: حوالي 30–80 ألف ₪.','New kitchen: about ₪30–80k.'], rn_baths:['מספר חדרי רחצה','عدد الحمامات','Number of bathrooms'], rn_bath:['חדר רחצה אחד','حمام واحد','One bathroom'], rn_bathH:['בערך 15–40 אלף ₪ לחדר.','حوالي 15–40 ألف ₪ للحمام.','About ₪15–40k each.'],
  rn_floor:['ריצוף','البلاط','Flooring'], rn_floorP:['מחיר למ״ר','السعر للمتر المربع','Price per m²'], rn_floorPH:['כולל עבודה: בערך 180–400 ₪.','شامل العمل: حوالي 180–400 ₪.','Including labour: about ₪180–400.'], rn_paint:['צבע','الدهان','Paint'], rn_elec:['חשמל ואינסטלציה','الكهرباء والسباكة','Electrics and plumbing'], rn_other:['אחר','أخرى','Other'],
  rn_cont:['מרווח לחריגות','هامش للتجاوزات','Contingency'], rn_contH:['כמעט כל שיפוץ חורג – 10–20% זה סביר.','كل ترميم تقريبًا يتجاوز – 10–20% معقول.','Almost every renovation overruns – 10–20% is sensible.'], rn_value:['שווי הדירה היום (לא חובה)','قيمة الشقة اليوم (اختياري)','Home value today (optional)'], rn_valueH:['כדי לראות אם השיפוץ מעלה את הערך.','لمعرفة إن كان الترميم يرفع القيمة.','To see if the renovation adds value.'], rn_up:['עליית ערך צפויה','ارتفاع القيمة المتوقع','Expected value increase'],
  rn_total:['עלות השיפוץ','تكلفة الترميم','Renovation cost'], rn_withCont:['כולל {c} מרווח לחריגות','شاملًا {c} هامشًا للتجاوزات','Including {c} for overruns'], rn_sub:['לפני מרווח','قبل الهامش','Before contingency'], rn_contR:['מרווח לחריגות','هامش للتجاوزات','Contingency'], rn_gain:['עליית ערך','ارتفاع القيمة','Value increase'], rn_net:['רווח או הפסד מהשיפוץ','ربح أو خسارة من الترميم','Gain or loss from it'],
  rn_note:['קחו לפחות 3 הצעות מחיר, וסכמו בכתב מה כלול ולוח תשלומים לפי התקדמות.','خذوا 3 عروض أسعار على الأقل واتفقوا كتابيًا على ما يشمله العمل وجدول دفعات حسب التقدم.','Get at least 3 quotes, and agree in writing what\'s included and payments by progress.'],
  /* building committee */
  tab_vaad:['ועד בית','لجنة البناية','Building committee'], d_vaad:['חלוקה הוגנת של הוצאות הבניין – שווה בשווה או לפי גודל הדירה.','تقسيم عادل لمصاريف البناية – بالتساوي أو حسب مساحة الشقة.','A fair split of building costs – equally or by apartment size.'],
  va_intro:['לפי חוק המקרקעין, ברירת המחדל היא חלוקה לפי שטח הדירה, אלא אם התקנון קובע אחרת.','حسب قانون الأراضي، الافتراض هو التقسيم حسب مساحة الشقة ما لم ينص النظام على غير ذلك.','By land law the default is to split by apartment size, unless the building\'s bylaws say otherwise.'],
  va_total:['הוצאות הבניין בחודש','مصاريف البناية شهريًا','Building costs a month'], va_mode:['איך מחלקים','طريقة التقسيم','How to split'], va_equal:['שווה בשווה','بالتساوي','Equally'], va_area:['לפי שטח הדירה','حسب مساحة الشقة','By apartment size'],
  va_avg:['ממוצע לדירה בחודש','المعدل لكل شقة شهريًا','Average per apartment a month'], va_year:['{y} לכל הבניין בשנה','{y} للبناية كلها سنويًا','{y} for the building a year'], va_apt:['דירה {n}','شقة {n}','Apartment {n}'], va_share:['חלק בחודש','الحصة شهريًا','Share a month'], va_addApt:['דירה','شقة','Apartment'], va_delApt:['דירה','شقة','Apartment'],
});
