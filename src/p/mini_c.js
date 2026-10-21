/* 13.24: household, car, bills, shopping and tools – small calculators (engine: mini.js) */
const mcIso = d => rmIso(d);
const mcAddDays = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const mcFmt = d => { try { return new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'long', year: 'numeric'}).format(d); } catch (e) { return mcIso(d); } };
const mcLang = () => ({he: 'Hebrew', ar: 'Arabic', en: 'English'})[lang] || 'Hebrew';
const mcDaysTxt = n => !isFinite(n) ? '—' : n < 0 ? t('cd_late', {n: -n}) : n === 0 ? t('cd_today') : t('cd_left', {n});
/* ---------- can I afford it ---------- */
miniDef('afford', {
  intro: 'af_intro',
  fields: [
    {k: 'price', t: 'af_price', type: 'num', u: '₪', def: 3000},
    {k: 'pay', t: 'af_pay', type: 'sel', def: 'cash', opts: [['cash', 'af_cash'], ['inst', 'af_inst']]},
    {k: 'n', t: 'af_n', type: 'num', def: 12, show: v => v.pay === 'inst'},
    {k: 'inc', t: 'af_inc', type: 'num', u: '₪', def: () => Math.round(miIncome()) || 15000},
    {k: 'spend', t: 'af_spend', type: 'num', u: '₪', def: () => Math.round(miSpend()) || 12000},
    {k: 'sav', t: 'af_sav', type: 'num', u: '₪', def: 0},
    {k: 'emerg', t: 'af_emerg', type: 'num', u: '₪', def: () => (Math.round(miSpend()) || 12000) * 3, h: 'af_emergH'}
  ],
  calc(v){
    const free = v.inc - v.spend, extra = Math.max(0, v.sav - v.emerg), n = Math.max(1, Math.round(v.n) || 1);
    let verdict, sub = '';
    if (v.pay === 'inst'){
      const m = v.price / n;
      if (free > 0 && m <= free * 0.5){ verdict = t('af_yes'); sub = t('af_instOk', {m: MI0(m)}); }
      else if (free > 0 && m <= free){ verdict = t('af_tight'); sub = t('af_instTight', {m: MI0(m), p: MIP(m / free * 100, 0)}); }
      else { verdict = t('af_notNow'); sub = t('af_instNo', {m: MI0(m)}); }
      return {hero: {l: t('af_ans'), v: verdict, sub}, rows: [[t('af_free'), MI0(free)], [t('af_monthly'), MI0(m)], [t('af_share'), free > 0 ? MIP(m / free * 100, 0) : '—', 'total']],
        note: t('af_instNote')};
    }
    if (v.price <= free){ verdict = t('af_yes'); sub = t('af_fromMonth'); }
    else if (v.price <= Math.max(0, free) + extra){ verdict = t('af_yes'); sub = t('af_fromSav', {s: MI0(v.price - Math.max(0, free))}); }
    else if (free > 0){ const w = Math.ceil((v.price - extra) / free); verdict = t('af_wait', {n: w}); sub = t('af_waitSub', {m: MI0(free)}); }
    else { verdict = t('af_notNow'); sub = t('af_noFree'); }
    return {hero: {l: t('af_ans'), v: verdict, sub},
      rows: [[t('af_free'), MI0(free)], [t('af_extra'), MI0(extra)], [t('af_price'), MI0(v.price), 'total']],
      warn: v.sav < v.emerg ? t('af_noEmerg') : ''};
  }
});
/* ---------- payday countdown ---------- */
miniDef('payday', {
  intro: 'pd_intro',
  fields: [
    {k: 'day', t: 'pd_day', type: 'num', def: 10},
    {k: 'left', t: 'pd_left', type: 'num', u: '₪', def: 3000},
    {k: 'bills', t: 'pd_bills', type: 'num', u: '₪', def: 0, h: 'pd_billsH'}
  ],
  calc(v){
    const today = mcAddDays(0), dd = Math.min(28, Math.max(1, Math.round(v.day) || 1));
    let next = new Date(today.getFullYear(), today.getMonth(), dd);
    if (next <= today) next = new Date(today.getFullYear(), today.getMonth() + 1, dd);
    const days = Math.max(1, Math.round((next - today) / 864e5)), money = v.left - v.bills, per = money / days;
    return {hero: {l: t('pd_per'), v: MI0(per), sub: t('pd_until', {d: mcFmt(next), n: days})},
      rows: [[t('pd_daysL'), String(days)], [t('pd_after'), MI0(money)], [t('pd_week'), MI0(per * 7), 'total']],
      warn: money < 0 ? t('pd_neg') : '', note: t('pd_note')};
  }
});
/* ---------- divorce / separation (general) ---------- */
miniDef('divorce', {
  intro: 'dv_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'apt', t: 'dv_apt', type: 'num', u: '₪', def: 0, h: 'dv_aptH'},
    {k: 'sav', t: 'dv_sav', type: 'num', u: '₪', def: 0},
    {k: 'pens', t: 'dv_pens', type: 'num', u: '₪', def: 0, h: 'dv_pensH'},
    {k: 'car', t: 'dv_car', type: 'num', u: '₪', def: 0},
    {k: 'other', t: 'dv_other', type: 'num', u: '₪', def: 0},
    {k: 'debts', t: 'dv_debts', type: 'num', u: '₪', def: 0},
    {k: 'pct', t: 'dv_pct', type: 'num', u: '%', def: 50}
  ],
  calc(v){
    const assets = v.apt + v.sav + v.pens + v.car + v.other, net = assets - v.debts, p = Math.min(100, Math.max(0, v.pct)) / 100;
    return {hero: {l: t('dv_net'), v: MI0(net)},
      rows: [[t('dv_assets'), MI0(assets)], [t('dv_debts'), (v.debts > 0 ? '−' : '') + MI0(v.debts)], [t('dv_sideA', {p: MIn(p * 100)}), MI0(net * p), 'total'], [t('dv_sideB', {p: MIn(100 - p * 100)}), MI0(net * (1 - p)), 'total']],
      tips: [t('dv_t1'), t('dv_t2'), t('dv_t3'), t('dv_t4')],
      links: [{t: t('dv_link'), url: 'https://www.kolzchut.org.il/he/%D7%92%D7%99%D7%A8%D7%95%D7%A9%D7%99%D7%9F'}]};
  }
});
/* ---------- wedding ---------- */
miniDef('wedding', {
  intro: 'wd_intro',
  fields: [
    {k: 'guests', t: 'wd_guests', type: 'num', def: 300},
    {k: 'att', t: 'wd_att', type: 'num', u: '%', def: 85},
    {k: 'pp', t: 'wd_pp', type: 'num', u: '₪', def: 350, h: 'wd_ppH'},
    {k: 'min', t: 'wd_min', type: 'num', def: 0, h: 'wd_minH'},
    {k: 'photo', t: 'wd_photo', type: 'num', u: '₪', def: 12000},
    {k: 'music', t: 'wd_music', type: 'num', u: '₪', def: 9000},
    {k: 'dress', t: 'wd_dress', type: 'num', u: '₪', def: 10000},
    {k: 'extra', t: 'wd_extra', type: 'num', u: '₪', def: 8000, h: 'wd_extraH'},
    {k: 'gift', t: 'wd_gift', type: 'num', u: '₪', def: 450},
    {k: 'share', t: 'wd_share', type: 'num', u: '₪', def: 0}
  ],
  calc(v){
    const came = Math.round(v.guests * Math.min(100, Math.max(0, v.att)) / 100), billed = Math.max(came, v.min), food = billed * v.pp,
      ext = v.photo + v.music + v.dress + v.extra, cost = food + ext, gifts = came * v.gift, bal = gifts + v.share - cost;
    return {hero: {l: t(bal >= 0 ? 'wd_plus' : 'wd_minus'), v: MI0(Math.abs(bal)), sub: t('wd_came', {n: came})},
      rows: [[t('wd_food', {n: billed}), MI0(food)], [t('wd_ext'), MI0(ext)], [t('wd_cost'), MI0(cost), 'total'], [t('wd_gifts'), MI0(gifts)], [t('wd_share'), MI0(v.share)]],
      bars: [{l: t('wd_cost'), v: cost, txt: MI0(cost)}, {l: t('wd_gifts'), v: gifts + v.share, txt: MI0(gifts + v.share), dn: true}],
      note: t('wd_note')};
  }
});
/* ---------- car vs public transport ---------- */
miniDef('carvsbus', {
  intro: 'cb_intro',
  fields: [
    {k: 'val', t: 'cb_val', type: 'num', u: '₪', def: 90000},
    {k: 'dep', t: 'cb_dep', type: 'num', u: '%', def: 12},
    {k: 'ins', t: 'cb_ins', type: 'num', u: '₪', def: 7000, h: 'cb_insH'},
    {k: 'fm', t: 'cb_fm', type: 'sel', def: 'km', opts: [['km', 'cb_fmKm'], ['amt', 'cb_fmAmt']]},
    {k: 'km', t: 'cb_km', type: 'num', u: 'u_km', def: 1200, show: v => v.fm === 'km'},
    {k: 'l100', t: 'cb_l100', type: 'num', def: 7, show: v => v.fm === 'km'},
    {k: 'fuel', t: 'cb_fuel', type: 'num', u: '₪', def: 700, show: v => v.fm === 'amt'},
    {k: 'maint', t: 'cb_maint', type: 'num', u: '₪', def: 3500},
    {k: 'park', t: 'cb_park', type: 'num', u: '₪', def: 0},
    {k: 'pass', t: 'cb_pass', type: 'num', u: '₪', def: 250, h: 'cb_passH'},
    {k: 'taxi', t: 'cb_taxi', type: 'num', u: '₪', def: 250},
    {k: 'rd', t: 'cb_rd', type: 'num', def: 12},
    {k: 'rp', t: 'cb_rp', type: 'num', u: '₪', def: 250}
  ],
  calc(v){
    const fp = (typeof IL26 === 'object' && +IL26.fuel95) || 8, fuel = v.fm === 'km' ? v.km * v.l100 / 100 * fp : v.fuel,
      depM = v.val * v.dep / 100 / 12, car = depM + v.ins / 12 + fuel + v.maint / 12 + v.park, alt = v.pass + v.taxi + v.rd * v.rp / 12, diff = car - alt;
    return {hero: {l: t(diff > 0 ? 'cb_busWins' : 'cb_carWins'), v: MI0(Math.abs(diff)) + ' ' + t('cb_perMo'), sub: t('cb_year', {y: MI0(Math.abs(diff) * 12)})},
      rows: [[t('cb_depM'), MI0(depM)], [t('cb_fuelM'), MI0(fuel)], [t('cb_fixedM'), MI0(v.ins / 12 + v.maint / 12 + v.park)], [t('cb_car'), MI0(car), 'total'], [t('cb_alt'), MI0(alt), 'total']],
      bars: [{l: t('cb_car'), v: car}, {l: t('cb_alt'), v: alt, dn: true}],
      note: t('cb_note', {p: N(fp, null, 2)})};
  }
});
/* ---------- when to sell the car ---------- */
miniDef('carsell', {
  intro: 'cs_intro',
  fields: [
    {k: 'val', t: 'cs_val', type: 'num', u: '₪', def: 60000},
    {k: 'dep', t: 'cs_dep', type: 'num', u: '%', def: 12},
    {k: 'r1', t: 'cs_r', type: 'num', u: '₪', def: 2000, h: 'cs_r1'},
    {k: 'r2', t: 'cs_r', type: 'num', u: '₪', def: 3000, h: 'cs_r2'},
    {k: 'r3', t: 'cs_r', type: 'num', u: '₪', def: 4500, h: 'cs_r3'},
    {k: 'r4', t: 'cs_r', type: 'num', u: '₪', def: 6000, h: 'cs_r4'},
    {k: 'r5', t: 'cs_r', type: 'num', u: '₪', def: 8000, h: 'cs_r5'}
  ],
  calc(v){
    let val = v.val, cum = 0, pick = 0; const rows = [];
    for (let y = 1; y <= 5; y++){
      const drop = val * v.dep / 100, rep = v['r' + y]; val -= drop; cum += rep;
      if (!pick && rep > drop) pick = y;
      rows.push([t('cs_yr', {y}), t('cs_row', {v: MI0(val), d: MI0(drop), r: MI0(rep)}), rep > drop ? 'neg' : '']);
    }
    return {hero: {l: t('cs_best'), v: pick ? t('cs_yrN', {y: pick}) : t('cs_keep'), sub: pick ? t('cs_why') : t('cs_keepSub')},
      rows: rows.concat([[t('cs_cum'), MI0(cum), 'total']]), note: t('cs_note')};
  }
});
/* ---------- insurance deductible ---------- */
miniDef('deduct', {
  intro: 'dd_intro',
  fields: [
    {k: 'p1', t: 'dd_p1', type: 'num', u: '₪', def: 2800}, {k: 'd1', t: 'dd_d1', type: 'num', u: '₪', def: 1800},
    {k: 'p2', t: 'dd_p2', type: 'num', u: '₪', def: 3400}, {k: 'd2', t: 'dd_d2', type: 'num', u: '₪', def: 700},
    {k: 'c', t: 'dd_c', type: 'num', def: 0.2, h: 'dd_cH'}
  ],
  calc(v){
    const e1 = v.p1 + v.c * v.d1, e2 = v.p2 + v.c * v.d2, be = v.d1 !== v.d2 ? (v.p2 - v.p1) / (v.d1 - v.d2) : NaN, best = e1 <= e2 ? 'A' : 'B';
    return {hero: {l: t('dd_best'), v: t(best === 'A' ? 'dd_A' : 'dd_B'), sub: t('dd_save', {s: MI0(Math.abs(e1 - e2))})},
      rows: [[t('dd_e1'), MI0(e1)], [t('dd_e2'), MI0(e2)], [t('dd_be'), isFinite(be) && be > 0 ? t('dd_beV', {n: N(be, null, 2), y: be > 0 ? N(1 / be, null, 1) : '—'}) : '—', 'total']],
      note: t('dd_note')};
  }
});
/* ---------- life insurance need ---------- */
miniDef('lifeins', {
  intro: 'li_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'mort', t: 'li_mort', type: 'num', u: '₪', def: 0},
    {k: 'debts', t: 'li_debts', type: 'num', u: '₪', def: 0},
    {k: 'spend', t: 'li_spend', type: 'num', u: '₪', def: () => Math.round((miSpend() || 10000) * 12)},
    {k: 'years', t: 'li_years', type: 'num', u: 'u_yrs', def: 10},
    {k: 'kids', t: 'li_kids', type: 'num', def: 2},
    {k: 'edu', t: 'li_edu', type: 'num', u: '₪', def: 50000},
    {k: 'sav', t: 'li_sav', type: 'num', u: '₪', def: 0},
    {k: 'pens', t: 'li_pens', type: 'num', u: '₪', def: 0, h: 'li_pensH'},
    {k: 'have', t: 'li_have', type: 'num', u: '₪', def: 0}
  ],
  calc(v){
    const need = v.mort + v.debts + v.spend * v.years + v.kids * v.edu, offs = v.sav + v.pens + v.have, gap = need - offs;
    return {hero: {l: t(gap > 0 ? 'li_gap' : 'li_ok'), v: MI0(Math.max(0, gap))},
      rows: [[t('li_needT'), MI0(need)], [t('li_offs'), MI0(offs)], [t('li_cover'), need ? MIP(Math.min(100, offs / need * 100), 0) : '—', 'total']],
      bars: [{l: t('li_needT'), v: need}, {l: t('li_offs'), v: offs, dn: true}], note: t('li_note')};
  }
});
/* ---------- installments vs cash ---------- */
miniDef('installments', {
  intro: 'in2_intro',
  fields: [
    {k: 'price', t: 'in2_price', type: 'num', u: '₪', def: 6000},
    {k: 'disc', t: 'in2_disc', type: 'num', u: '%', def: 5},
    {k: 'n', t: 'in2_n', type: 'num', def: 12},
    {k: 'free', t: 'in2_free', type: 'chk', def: true},
    {k: 'rate', t: 'in2_rate', type: 'num', u: '%', def: 9, show: v => !v.free},
    {k: 'dep', t: 'in2_dep', type: 'num', u: '%', def: 4, h: 'in2_depH'}
  ],
  calc(v){
    const n = Math.max(1, Math.round(v.n) || 1), cash = v.price * (1 - Math.min(100, Math.max(0, v.disc)) / 100), pmt = v.free ? v.price / n : miPmt(v.price, v.rate, n), r = v.dep / 1200;
    let pv = 0; for (let k = 0; k < n; k++) pv += pmt / Math.pow(1 + r, k);
    const best = cash <= pv ? 'cash' : 'inst';
    return {hero: {l: t('in2_best'), v: t(best === 'cash' ? 'in2_cashW' : 'in2_instW'), sub: t('in2_by', {s: MI0(Math.abs(pv - cash))})},
      rows: [[t('in2_cashP'), MI0(cash)], [t('in2_pmt', {n}), MI0(pmt)], [t('in2_total'), MI0(pmt * n)], [t('in2_pv'), MI0(pv), 'total']], note: t('in2_note')};
  }
});
/* ---------- insurance overlap ---------- */
const IO_KEYS = ['shaban', 'privH', 'life', 'mortL', 'crit', 'nursK', 'nursP', 'acc', 'travC', 'travP'];
miniDef('insoverlap', {
  intro: 'io_intro', disc: 'mi_notAdvice',
  fields: IO_KEYS.map(k => ({k, t: 'io_' + k, type: 'chk', def: false})),
  calc(v){
    const W = [];
    if (v.shaban && v.privH) W.push(t('io_wHealth'));
    if (v.nursK && v.nursP) W.push(t('io_wNurs'));
    if (v.acc && v.life) W.push(t('io_wAcc'));
    if (v.mortL && v.life) W.push(t('io_wMort'));
    if (v.travC && v.travP) W.push(t('io_wTrav'));
    const n = IO_KEYS.filter(k => v[k]).length;
    return {hero: {l: t('io_found'), v: String(W.length), sub: t('io_have', {n})},
      tips: W.length ? W : [t(n ? 'io_none' : 'io_pick')],
      links: [{t: t('io_har'), url: 'https://harb.cma.gov.il'}], note: t('io_note')};
  }
});
/* ---------- financial calendar ---------- */
function fcItems(d){
  const now = mcAddDays(0), y = now.getFullYear(), L = [];
  let cpi = new Date(y, now.getMonth(), 15); if (cpi < now) cpi = new Date(y, now.getMonth() + 1, 15);
  L.push({k: 'cpi', ic: '📈', date: cpi, rep: 'month', cat: 'money', before: 0});
  L.push({k: 'yearEnd', ic: '🧾', date: new Date(y, 11, 31), rep: 'year', cat: 'tax', before: 30});
  L.push({k: 'refund', ic: '💸', date: new Date(y, 11, 31), rep: 'year', cat: 'tax', before: 60, p: {y: y - 6}});
  let f106 = new Date(y, 2, 31); if (f106 < now) f106 = new Date(y + 1, 2, 31);
  L.push({k: 'f106', ic: '📄', date: f106, rep: 'year', cat: 'tax', before: 0});
  let wg = new Date(y, 5, 1); if (wg < now) wg = new Date(y + 1, 5, 1);
  L.push({k: 'grant', ic: '🎁', date: wg, rep: 'year', cat: 'money', before: 0});
  if (d.car && rmParse(d.car)){ let c = rmParse(d.car); while (c < now) c = new Date(c.getFullYear() + 1, c.getMonth(), c.getDate()); L.push({k: 'car', ic: '🚗', date: c, rep: 'year', cat: 'car', before: 14}); }
  return L.sort((a, b) => a.date - b.date);
}
function fcRem(it){ return miRemAdd({title: t('fc_' + it.k + 'T', it.p), date: mcIso(it.date), rep: it.rep, cat: it.cat, before: it.before, note: t('fc_' + it.k + 'N', it.p)}); }
miniDef('fincal', {
  intro: 'fc_intro',
  render(box, api){
    const E = api.E, L = fcItems(api.d), boiNext = typeof MKT === 'object' && MKT.boiNext ? String(MKT.boiNext) : '';
    box.innerHTML = `<ul class="mi-list">${L.map((it, i) => { const n = rmDays(mcIso(it.date));
      return `<li class="mi-item"><h4>${it.ic} ${E(t('fc_' + it.k + 'T', it.p))}</h4><p><b>${E(mcFmt(it.date))}</b> · ${E(mcDaysTxt(n))}${it.rep === 'month' ? ' · ' + E(t('fc_monthly')) : ''}</p><p class="fine">${E(t('fc_' + it.k + 'N', it.p))}</p><div class="btnrow"><button type="button" class="mv" data-fc="${i}">➕ ${E(t('mi_remind'))}</button></div></li>`; }).join('')}
      <li class="mi-item"><h4>🏦 ${E(t('fc_boiT'))}</h4><p class="fine">${E(t('fc_boiN'))}${boiNext ? ' ' + E(t('fc_boiNext', {d: '\u2066' + boiNext + '\u2069'})) : ''}</p><p><a class="src-a" href="https://www.boi.org.il" target="_blank" rel="noopener noreferrer">${E(t('fc_boiL'))} ↗</a></p></li></ul>
      <label class="bk-f"><span>${E(t('fc_carD'))}</span><input type="date" id="fc_car" value="${E(api.d.car || '')}"></label>
      <div class="btnrow"><button type="button" class="gold-btn" id="fc_all">➕ ${E(t('fc_all'))}</button></div><p class="fine">${E(t('fc_note'))}</p>`;
    box.onclick = e => { const b = e.target.closest('[data-fc]'); if (b){ toast(t(fcRem(L[+b.dataset.fc]) ? 'fc_added' : 'fc_exists')); return; }
      if (e.target.closest('#fc_all')){ const n = L.filter(fcRem).length; toast(t('fc_addedN', {n})); } };
    box.onchange = e => { if (e.target.id === 'fc_car'){ api.d.car = e.target.value; api.save(); api.redraw(); } };
  }
});
/* ---------- shared family goal ---------- */
miniDef('famgoal', {
  intro: 'fg_intro',
  render(box, api){
    const E = api.E, d = api.d; if (!Array.isArray(d.goals)) d.goals = [];
    const sum = g => (g.c || []).reduce((s, x) => s + miN(x.amt), 0);
    box.innerHTML = `<ul class="mi-list">${d.goals.map((g, i) => {
      const s = sum(g), tg = miN(g.target), due = rmParse(g.due), mo = due ? Math.max(1, Math.round((due - mcAddDays(0)) / (30.44 * 864e5))) : 0, need = Math.max(0, tg - s), by = {};
      (g.c || []).forEach(x => { const w = String(x.who || '').trim() || t('fg_anon'); by[w] = (by[w] || 0) + miN(x.amt); });
      return `<li class="mi-item"><h4>🎯 ${E(g.name || t('fg_goal'))}</h4>
        <p><b>${E(MI0(s))}</b> / ${E(MI0(tg))}${due ? ' · ' + E(mcFmt(due)) : ''}</p>
        <div class="cx-bar fg-bar"><i class="up" style="width:${tg ? Math.min(100, Math.round(s / tg * 100)) : 0}%"></i></div>
        <p class="fine">${need ? E(mo ? t('fg_need', {m: MI0(need / mo), n: mo}) : t('fg_left', {m: MI0(need)})) : '🎉 ' + E(t('fg_done'))}</p>
        ${Object.keys(by).length ? `<p class="fine">${Object.keys(by).map(w => E(w) + ': ' + E(MI0(by[w]))).join(' · ')}</p>` : ''}
        <div class="bk-grid"><label class="bk-f"><span>${E(t('fg_who'))}</span><input type="text" maxlength="30" data-fgw="${i}" placeholder="${E(t('fg_whoPh'))}"></label><label class="bk-f"><span>${E(t('fg_amt'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-fga="${i}"></label></div>
        <div class="btnrow"><button type="button" class="mv" data-fgadd="${i}">＋ ${E(t('fg_add'))}</button><button type="button" class="px-tb s" data-fgdel="${i}" aria-label="${E(t('fg_del', {n: g.name || ''}))}">🗑️</button></div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('fg_none'))}</li>`}</ul>
      <div class="mi-card"><div class="bk-grid"><label class="bk-f"><span>${E(t('fg_name'))}</span><input type="text" id="fg_n" maxlength="40" placeholder="${E(t('fg_namePh'))}"></label><label class="bk-f"><span>${E(t('fg_target'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="fg_t"></label><label class="bk-f"><span>${E(t('fg_due'))}</span><input type="date" id="fg_d"></label></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="fg_new">＋ ${E(t('fg_new'))}</button></div></div>`;
    box.onclick = e => { let b;
      if (e.target.closest('#fg_new')){ const n = box.querySelector('#fg_n').value.trim(), tg = miN(box.querySelector('#fg_t').value); if (!n || !(tg > 0)){ toast(t('fg_needNT')); return; } d.goals.push({name: n.slice(0, 40), target: tg, due: box.querySelector('#fg_d').value || '', c: []}); api.save(); api.redraw(); return; }
      if ((b = e.target.closest('[data-fgadd]'))){ const i = +b.dataset.fgadd, a = miN(box.querySelector(`[data-fga="${i}"]`).value); if (!a){ toast(t('fg_needA')); return; } (d.goals[i].c = d.goals[i].c || []).push({who: box.querySelector(`[data-fgw="${i}"]`).value.trim().slice(0, 30), amt: a, date: mcIso(mcAddDays(0))}); api.save(); api.redraw(); return; }
      if ((b = e.target.closest('[data-fgdel]'))){ d.goals.splice(+b.dataset.fgdel, 1); api.save(); api.redraw(); } };
  }
});
/* ---------- car documents ---------- */
const CD_KEYS = ['lic', 'comp', 'full', 'test', 'drv'];
miniDef('cardocs', {
  intro: 'cd_intro',
  render(box, api){
    const E = api.E, d = api.d;
    box.innerHTML = `<ul class="mi-list">${CD_KEYS.map(k => { const v = d[k] || '', n = v ? rmDays(v) : NaN, cls = !v ? '' : n < 0 ? 'rm-w' : n <= 30 ? 'rm-w' : '';
      return `<li class="mi-item"><h4>${E(t('cd_' + k))}</h4><label class="bk-f"><span>${E(t('cd_until'))}</span><input type="date" data-cd="${k}" value="${E(v)}"></label>
        ${v ? `<p class="${cls}">${n <= 30 ? '⚠️ ' : '✅ '}${E(mcDaysTxt(n))}</p><div class="btnrow"><button type="button" class="mv" data-cdr="${k}">➕ ${E(t('mi_remind'))}</button></div>` : ''}</li>`; }).join('')}</ul>
      <div class="btnrow"><button type="button" class="gold-btn" id="cd_all">➕ ${E(t('cd_all'))}</button></div><p class="fine">${E(t('cd_note'))}</p>`;
    const rem = k => d[k] && rmParse(d[k]) ? miRemAdd({title: t('cd_remT', {n: t('cd_' + k).replace(/^[^\p{L}]+/u, '')}), date: d[k], cat: 'car', before: 14, rep: k === 'drv' ? 'none' : 'year'}) : false;
    box.onchange = e => { const k = e.target.dataset && e.target.dataset.cd; if (k){ d[k] = e.target.value; api.save(); api.redraw(); } };
    box.onclick = e => { const b = e.target.closest('[data-cdr]'); if (b){ toast(t(rem(b.dataset.cdr) ? 'fc_added' : 'fc_exists')); return; }
      if (e.target.closest('#cd_all')){ const n = CD_KEYS.filter(rem).length; toast(t('fc_addedN', {n})); } };
  }
});
/* ---------- fixed prices that jump after a year ---------- */
const RN2_TYPES = ['insur', 'cell', 'net', 'tv', 'other'];
miniDef('renewals', {
  intro: 'rn2_intro',
  render(box, api){
    const E = api.E, d = api.d; if (!Array.isArray(d.items)) d.items = [];
    const now = mcAddDays(0), nextAnn = s => { const st = rmParse(s); if (!st) return null; let a = new Date(st.getFullYear() + 1, st.getMonth(), st.getDate()); while (a < now) a = new Date(a.getFullYear() + 1, a.getMonth(), a.getDate()); return a; };
    box.innerHTML = `<ul class="mi-list">${d.items.map((x, i) => { const a = nextAnn(x.start), n = a ? Math.round((a - now) / 864e5) : NaN, soon = isFinite(n) && n <= 31;
      return `<li class="mi-item"><h4>${E(x.name || t('rn2_t_' + x.type))} <small class="fine">· ${E(t('rn2_t_' + x.type))}</small></h4>
        <p>${x.price ? E(MI0(miN(x.price))) + ' ' + E(t('rn2_perMo')) + ' · ' : ''}${a ? E(t('rn2_ann', {d: mcFmt(a)})) : ''}</p>
        ${soon ? `<p class="rm-w">⚠️ ${E(t('rn2_soon', {n}))}</p>` : ''}
        <div class="btnrow">${a ? `<button type="button" class="mv" data-rnr="${i}">➕ ${E(t('mi_remind'))}</button>` : ''}<button type="button" class="px-tb s" data-rnd="${i}" aria-label="${E(t('fg_del', {n: x.name || ''}))}">🗑️</button></div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('rn2_none'))}</li>`}</ul>
      <div class="mi-card"><div class="bk-grid"><label class="bk-f"><span>${E(t('rn2_name'))}</span><input type="text" id="rn_n" maxlength="40" placeholder="${E(t('rn2_namePh'))}"></label>
      <label class="bk-f"><span>${E(t('rn2_type'))}</span><select id="rn_t">${RN2_TYPES.map(k => `<option value="${k}">${E(t('rn2_t_' + k))}</option>`).join('')}</select></label>
      <label class="bk-f"><span>${E(t('rn2_price'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="rn_p"></label><label class="bk-f"><span>${E(t('rn2_start'))}</span><input type="date" id="rn_s"></label></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="rn_add">＋ ${E(t('rn2_add'))}</button></div></div><p class="fine">${E(t('rn2_note'))}</p>`;
    box.onclick = e => { let b;
      if (e.target.closest('#rn_add')){ const s = box.querySelector('#rn_s').value; if (!s){ toast(t('rn2_needS')); return; } d.items.push({name: box.querySelector('#rn_n').value.trim().slice(0, 40), type: box.querySelector('#rn_t').value, price: box.querySelector('#rn_p').value, start: s}); api.save(); api.redraw(); return; }
      if ((b = e.target.closest('[data-rnr]'))){ const x = d.items[+b.dataset.rnr], a = nextAnn(x.start); if (!a) return; const r = new Date(a); r.setDate(r.getDate() - 30);
        toast(t(miRemAdd({title: t('rn2_remT', {n: x.name || t('rn2_t_' + x.type)}), date: mcIso(r < now ? now : r), cat: x.type === 'insur' ? 'insur' : 'bills', rep: 'year', before: 0, note: t('rn2_remN')}) ? 'fc_added' : 'fc_exists')); return; }
      if ((b = e.target.closest('[data-rnd]'))){ d.items.splice(+b.dataset.rnd, 1); api.save(); api.redraw(); } };
  }
});
/* ---------- explain an official letter ---------- */
const LTX = {files: [], busy: false, res: null};
miniDef('letter', {
  intro: 'lt2_intro',
  render(box, api){
    const E = api.E, eng = slEngine(), inClaude = typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE, R = LTX.res;
    box.innerHTML = (eng ? `<div class="btnrow"><label class="gold-btn">📷 ${E(t('lt2_photo'))}<input type="file" accept="image/*" capture="environment" id="lt_f" hidden multiple></label><label class="btn">🖼️ ${E(t('vt_gallery'))}<input type="file" accept="image/*" id="lt_g" hidden multiple></label></div>
      <p class="fine" aria-live="polite">${LTX.files.length ? E(t('vt_pages', {n: LTX.files.length})) : ''}</p>
      ${LTX.files.length ? `<div class="btnrow"><button type="button" class="gold-btn" id="lt_go"${LTX.busy ? ' disabled' : ''}>✦ ${E(t(LTX.busy ? 'ph_reading' : 'lt2_go'))}</button><button type="button" class="mv" id="lt_clr">🗑️ ${E(t('vt_clr'))}</button></div>` : ''}
      <p class="fine sl-priv">🔒 ${E(t('lt2_priv'))}</p>`
      : `<div class="gk-st new">${E(t(inClaude ? 'sl_noAiC' : (typeof gkNo === 'function' ? gkNo('sl_noAi') : 'sl_noAi')))}</div>`) +
      (R ? `<div class="bk-hero"><span>${E(R.from || '')}</span><b dir="auto">${E(R.title || '')}</b><small dir="auto">${E(R.summary || '')}</small></div>
        <dl class="ledger mi-led">${R.required ? `<div class="row"><dt>${E(t('lt2_req'))}</dt><dd dir="auto">${E(R.required)}</dd></div>` : ''}${R.deadline ? `<div class="row"><dt>${E(t('lt2_due'))}</dt><dd dir="auto">${E(rmParse(R.deadline) ? mcFmt(rmParse(R.deadline)) : R.deadline)}</dd></div>` : ''}${R.amount ? `<div class="row"><dt>${E(t('lt2_amt'))}</dt><dd dir="auto">${E(R.amount)}</dd></div>` : ''}</dl>
        ${Array.isArray(R.steps) && R.steps.length ? `<ol class="bk-adv">${R.steps.slice(0, 6).map(x => `<li class="bk-a bk-ok"><span class="bk-ic">✅</span><div><b dir="auto">${E(x)}</b></div></li>`).join('')}</ol>` : ''}
        ${rmParse(R.deadline) ? `<div class="btnrow"><button type="button" class="mv" id="lt_rem">➕ ${E(t('mi_remind'))}</button></div>` : ''}<p class="fine">${E(t('lt2_noteAi'))}</p>` : '');
    const add = fl => { LTX.files = LTX.files.concat([...fl]).slice(0, 5); LTX.res = null; api.redraw(); };
    box.onchange = e => { if ((e.target.id === 'lt_f' || e.target.id === 'lt_g') && e.target.files && e.target.files.length) add(e.target.files); };
    box.onclick = async e => {
      if (e.target.closest('#lt_clr')){ LTX.files = []; LTX.res = null; api.redraw(); return; }
      if (e.target.closest('#lt_rem') && R){ toast(t(miRemAdd({title: t('lt2_remT', {n: R.title || R.from || ''}).slice(0, 80), date: R.deadline, cat: 'docs', before: 3, note: String(R.required || '').slice(0, 300), amt: miN(R.amount) > 0 ? miN(R.amount) : ''}) ? 'fc_added' : 'fc_exists')); return; }
      if (!e.target.closest('#lt_go') || LTX.busy || !LTX.files.length) return;
      LTX.busy = true; api.redraw();
      try { const blobs = []; for (const f of LTX.files) blobs.push(await vtShrink(f, 2000));
        const j = await dsAsk(`These are photos of an official letter (for example from the tax authority, National Insurance, a bank, a court, a municipality or an insurance company). Read it carefully and explain it to an ordinary person. Answer in ${mcLang()}, in plain simple words. Return ONLY JSON: {"from": who sent it (max 6 words), "title": what the letter is about (max 8 words), "summary": what it means, 2-3 short sentences, "required": what the reader must do, one sentence or "" if nothing, "deadline": the due date as YYYY-MM-DD or "" if none is written, "amount": the amount to pay or receive as written or "", "steps": [up to 5 short next steps]}. Do not invent details that are not in the letter.`, blobs);
        LTX.res = j && typeof j === 'object' ? j : {summary: String(j || '')};
      } catch (er) { toast(t('ph_fail')); }
      LTX.busy = false; api.redraw();
    };
  }
});
/* ---------- glossary ---------- */
const GL_TERMS = [['prime', 'prime'], ['compound', 'compound'], ['cpi', 'inflation'], ['link', 'cpilink'], ['pensfix', 'pensfix'], ['annfac', 'lumpsum'], ['fees', 'mgmtfees'], ['hish', 'hishtalmut'], ['gemel', 'pencmp'], ['polsav', 'pencmp'],
  ['landtax', 'landtax'], ['purch', 'purchasetax'], ['point', 'tax'], ['gross', 'salary'], ['net', 'salary'], ['ni', 'salary'], ['marginal', 'tax'], ['refund', 'taxrefund'], ['f106', 'taxrefund'], ['f161', 'severance'],
  ['sev', 'severance'], ['grant', 'workgrant'], ['lease', 'carlease'], ['prepay', 'prepay'], ['balloon', 'mortgage'], ['cpitrack', 'mortgage'], ['var', 'mortgage'], ['bond', ''], ['stock', ''], ['etf', ''],
  ['yield', 'yield'], ['infl', 'inflation'], ['dti', 'mortcap'], ['ltv', 'mortcap'], ['od', 'bankacc'], ['dd', 'bankacc'], ['shaban', 'insoverlap'], ['nurs', 'insoverlap'], ['exempt', 'selfemp'], ['licensed', 'selfemp']];
function glsDef(term){
  const q = String(term || '').trim().toLowerCase(); if (!q) return '';
  const hit = GL_TERMS.find(([k]) => (T['gl_t_' + k] || []).some(x => String(x).toLowerCase() === q)) || GL_TERMS.find(([k]) => (T['gl_t_' + k] || []).some(x => String(x).toLowerCase().includes(q)));
  return hit ? t('gl_d_' + hit[0]) : '';
}
let GL_Q = '';
miniDef('glossary', {
  intro: 'gl_intro',
  render(box, api){
    const E = api.E;
    box.innerHTML = `<label class="bk-f"><span>${E(t('gl_search'))}</span><input type="search" id="gl_q" value="${E(GL_Q)}" placeholder="${E(t('gl_ph'))}" autocomplete="off"></label><ul class="mi-list" id="gl_list"></ul>`;
    const list = box.querySelector('#gl_list'), draw = () => {
      const q = GL_Q.trim().toLowerCase(), L = GL_TERMS.filter(([k]) => !q || (t('gl_t_' + k) + ' ' + t('gl_d_' + k) + ' ' + (T['gl_t_' + k] || []).join(' ')).toLowerCase().includes(q));
      list.innerHTML = L.map(([k, go]) => `<li class="mi-item"><h4>${E(t('gl_t_' + k))}</h4><p>${E(t('gl_d_' + k))}</p>${go && TABS.includes(go) ? `<button type="button" class="as-go" data-glgo="${go}">${ICON[go] || ''} ${E(t('tab_' + go))} ←</button>` : ''}</li>`).join('') || `<li class="fine bk-empty">${E(t('gl_none'))}</li>`;
    };
    draw();
    box.oninput = e => { if (e.target.id === 'gl_q'){ GL_Q = e.target.value; draw(); } };
    box.onclick = e => { const b = e.target.closest('[data-glgo]'); if (b){ activate(b.dataset.glgo); try { window.scrollTo({top: 0}); } catch (er) {} } };
  }
});
/* ---------- where the numbers come from ---------- */
miniDef('sources', {
  intro: 'so_intro',
  render(box, api){
    const E = api.E, I = typeof IL26 === 'object' ? IL26 : {}, X = typeof TAX === 'object' ? TAX : {}, K = typeof MKT === 'object' ? MKT : {}, R = typeof RATES === 'object' ? RATES : {};
    const fx = c => R.ILS && R[c] ? N(R.ILS / R[c], null, 3) + ' ₪' : '—', br = Array.isArray(X.brackets) ? X.brackets : [];
    const S = {tax: 'https://www.gov.il/he/departments/israel_tax_authority', btl: 'https://www.btl.gov.il', boi: 'https://www.boi.org.il', cbs: 'https://www.cbs.gov.il', energy: 'https://www.gov.il/he/departments/ministry_of_energy', labor: 'https://www.gov.il/he/departments/ministry_of_labor'};
    const rows = [
      ['so_vat', I.vat ? MIP(I.vat * 100, 0) : '—', 'tax', ''],
      ['so_point', X.point ? MI0(X.point / 12) + ' ' + t('so_perMo') + ' · ' + MI0(X.point) + ' ' + t('so_perYr') : '—', 'tax', ''],
      ['so_br', br.length ? MIP(br[0][1] * 100, 0) + ' – ' + MIP(br[br.length - 1][1] * 100, 0) : '—', 'tax', ''],
      ['so_ni', X.niLow != null ? MIP((X.niLow + (X.hLow || 0)) * 100, 2) + ' / ' + MIP((X.niHigh + (X.hHigh || 0)) * 100, 2) + (X.niCut ? ' · ' + t('so_niCut', {c: MI0(X.niCut)}) : '') : '—', 'btl', ''],
      ['so_min', I.minWage ? MI0(I.minWage) : '—', 'labor', ''],
      ['so_avg', I.avgWage ? MI0(I.avgWage) : '—', 'btl', ''],
      ['so_kid', I.childDep ? MI0(I.childDep) + ' ' + t('so_perMo') : '—', 'btl', ''],
      ['so_boi', K.boi != null ? MIP(K.boi, 2) : '—', 'boi', K.boiDate ? t('so_since', {d: '\u2066' + K.boiDate + '\u2069'}) : ''],
      ['so_cpi', K.cpi != null ? MIP(K.cpi, 1) : '—', 'cbs', K.cpiMonth ? t('so_month', {d: '\u2066' + K.cpiMonth + '\u2069'}) : ''],
      ['so_fuel', I.fuel95 ? N(I.fuel95, null, 2) + ' ₪' : '—', 'energy', K.fuelMonth ? t('so_month', {d: '\u2066' + K.fuelMonth + '\u2069'}) : ''],
      ['so_usd', fx('USD'), 'boi', ''], ['so_eur', fx('EUR'), 'boi', '']
    ];
    box.innerHTML = `<table class="bk-plan so-tab"><thead><tr><th scope="col">${E(t('so_what'))}</th><th scope="col">${E(t('so_val'))}</th><th scope="col">${E(t('so_src'))}</th></tr></thead><tbody>${rows.map(([k, v, s, w]) =>
      `<tr><th scope="row">${E(t(k))}${w ? `<br><small class="fine">${E(w)}</small>` : ''}</th><td><bdi>${E(v)}</bdi></td><td><a class="src-a" style="white-space:nowrap" href="${S[s]}" target="_blank" rel="noopener noreferrer">${E(t('so_s_' + s))} ↗</a></td></tr>`).join('')}</tbody></table>
      <p class="fine">${E(t('so_note'))}</p>`;
  }
});
Object.assign(T, {
  /* tabs */
  tab_afford:['אפשר להרשות לעצמי?','هل أستطيع تحمّل ذلك؟','Can I afford it?'], d_afford:['בודק קנייה מול ההכנסה, ההוצאות והחיסכון שלכם.','يفحص الشراء مقابل الدخل والمصاريف والادخار.','Checks a purchase against your income, spending and savings.'],
  tab_payday:['עד המשכורת','حتى الراتب','Until payday'], d_payday:['כמה נשאר להוציא ביום עד המשכורת הבאה.','كم يتبقى للإنفاق يوميًا حتى الراتب القادم.','How much you can spend per day until the next payday.'],
  tab_fincal:['לוח שנה פיננסי','التقويم المالي','Financial calendar'], d_fincal:['תאריכים כספיים קבועים בישראל – ובלחיצה הם נכנסים לתזכורות.','مواعيد مالية ثابتة في إسرائيل – وبضغطة تدخل إلى التذكيرات.','Fixed money dates in Israel – one tap adds them to your reminders.'],
  tab_famgoal:['יעד משפחתי','هدف عائلي','Family goal'], d_famgoal:['חוסכים יחד למטרה – כל אחד מוסיף, וכולם רואים את ההתקדמות.','نوفّر معًا لهدف – كل واحد يضيف والجميع يرى التقدم.','Save together for a goal – everyone adds and sees the progress.'],
  tab_divorce:['פרידה וחלוקת רכוש','الانفصال وتقسيم الممتلكات','Separation & assets'], d_divorce:['הערכה כללית של חלוקת הרכוש המשותף, עם מידע ראשוני.','تقدير عام لتقسيم الممتلكات المشتركة مع معلومات أولية.','A general estimate of splitting joint assets, with basic information.'],
  tab_wedding:['תקציב חתונה','ميزانية العرس','Wedding budget'], d_wedding:['עלות האירוע, המתנות הצפויות ומה נשאר בסוף.','تكلفة الحفل والهدايا المتوقعة وما يتبقى في النهاية.','The cost, the expected gifts and what\'s left at the end.'],
  tab_carvsbus:['רכב או תחבורה ציבורית','سيارة أم مواصلات عامة','Car or public transport'], d_carvsbus:['העלות החודשית האמיתית של רכב מול אוטובוס, מוניות ושכירות מדי פעם.','التكلفة الشهرية الحقيقية للسيارة مقابل الحافلة وسيارات الأجرة والاستئجار أحيانًا.','The real monthly cost of a car vs buses, taxis and an occasional rental.'],
  tab_carsell:['מתי למכור את הרכב','متى أبيع السيارة','When to sell the car'], d_carsell:['מתי התיקונים מתחילים לעלות יותר מירידת הערך.','متى تبدأ التصليحات بالتكلفة أكثر من انخفاض القيمة.','When repairs start costing more than the car loses in value.'],
  tab_cardocs:['רישיון, ביטוח וטסט','الترخيص والتأمين والفحص','Licence, insurance & test'], d_cardocs:['כל תאריכי הרכב במקום אחד, עם תזכורת לפני שפג תוקף.','كل مواعيد السيارة في مكان واحد مع تذكير قبل انتهاء الصلاحية.','All car dates in one place, with a reminder before they expire.'],
  tab_deduct:['השתתפות עצמית','المشاركة الذاتية','Insurance deductible'], d_deduct:['השתתפות עצמית גבוהה או נמוכה – מה משתלם לפי מספר התביעות הצפוי.','مشاركة ذاتية مرتفعة أم منخفضة – أيهما أوفر حسب عدد المطالبات المتوقع.','High or low deductible – which pays off for your expected claims.'],
  tab_renewals:['מחירים שקופצים אחרי שנה','أسعار تقفز بعد سنة','Prices that jump after a year'], d_renewals:['ביטוח, סלולר, אינטרנט וטלוויזיה – תזכורת לבדוק מחיר לפני שההטבה נגמרת.','تأمين، خلوي، إنترنت وتلفزيون – تذكير بفحص السعر قبل انتهاء العرض.','Insurance, mobile, internet and TV – a reminder to check the price before the deal ends.'],
  tab_insoverlap:['כפל ביטוחים','ازدواجية التأمين','Insurance overlap'], d_insoverlap:['מסמנים אילו ביטוחים יש לכם ומקבלים אזהרה על כיסוי כפול.','حدّدوا تأميناتكم واحصلوا على تنبيه بالتغطية المزدوجة.','Tick the insurance you have and get a warning about double cover.'],
  tab_lifeins:['ביטוח חיים לפי הצורך','تأمين الحياة حسب الحاجة','Life insurance need'], d_lifeins:['כמה כיסוי המשפחה צריכה באמת – לפי משכנתא, ילדים וחיסכון.','كم تحتاج العائلة فعلًا من تغطية – حسب الرهن والأطفال والادخار.','How much cover the family really needs – by mortgage, children and savings.'],
  tab_installments:['תשלומים או מזומן','تقسيط أم نقدًا','Installments or cash'], d_installments:['האם "12 תשלומים ללא ריבית" באמת עדיף על הנחה במזומן.','هل "12 دفعة بلا فائدة" أفضل فعلًا من خصم نقدي.','Whether "12 interest-free payments" really beats a cash discount.'],
  tab_letter:['הסבר מכתב רשמי','شرح رسالة رسمية','Explain an official letter'], d_letter:['מצלמים מכתב ממס הכנסה, ביטוח לאומי, בנק או עירייה – ומקבלים הסבר פשוט.','صوّروا رسالة من ضريبة الدخل أو التأمين الوطني أو البنك أو البلدية – واحصلوا على شرح بسيط.','Photograph a letter from the tax authority, National Insurance, a bank or council – get a plain explanation.'],
  tab_glossary:['מילון מונחים','قاموس المصطلحات','Glossary'], d_glossary:['מה זה פריים, קיבוע זכויות או מס שבח – במשפט אחד.','ما هو البرايم أو تثبيت الحقوق أو ضريبة التحسين – بجملة واحدة.','What prime, pension fixing or betterment tax mean – in one sentence.'],
  tab_sources:['מקורות הנתונים','مصادر البيانات','Where the numbers come from'], d_sources:['הנתונים הרשמיים שהמחשבונים משתמשים בהם, והמקור של כל אחד.','البيانات الرسمية التي تستخدمها الحاسبات ومصدر كل منها.','The official figures the calculators use, and where each comes from.'],
  /* afford */
  af_intro:['כותבים מה רוצים לקנות – והמחשבון בודק אם זה מסתדר עם החודש, בלי לגעת בקרן החירום.','اكتبوا ما تريدون شراءه – والحاسبة تفحص إن كان يناسب الشهر دون المساس بصندوق الطوارئ.','Enter what you want to buy – it checks whether it fits this month without touching your emergency fund.'],
  af_price:['מחיר','السعر','Price'], af_pay:['איך משלמים','طريقة الدفع','How you pay'], af_cash:['בבת אחת','دفعة واحدة','In one go'], af_inst:['בתשלומים','بالتقسيط','In installments'], af_n:['מספר תשלומים','عدد الدفعات','Number of payments'],
  af_inc:['הכנסה חודשית','الدخل الشهري','Monthly income'], af_spend:['הוצאות חודשיות','المصاريف الشهرية','Monthly spending'], af_sav:['חסכונות נזילים','مدخرات سائلة','Liquid savings'], af_emerg:['קרן חירום רצויה','صندوق الطوارئ المرغوب','Emergency fund target'], af_emergH:['ברירת מחדל: 3 חודשי הוצאות. את הסכום הזה לא נוגעים.','الافتراضي: 3 أشهر مصاريف. لا نمسّ هذا المبلغ.','Default: 3 months of spending. This amount stays untouched.'],
  af_ans:['התשובה','الجواب','The answer'], af_yes:['כן ✅','نعم ✅','Yes ✅'], af_tight:['אפשר, אבל צפוף','ممكن لكنه ضيق','Possible, but tight'], af_notNow:['לא עכשיו','ليس الآن','Not now'], af_wait:['כן, אם תחכו {n} חודשים','نعم، إذا انتظرتم {n} أشهر','Yes, if you wait {n} months'],
  af_fromMonth:['העודף של החודש מכסה את הקנייה.','فائض الشهر يغطي الشراء.','This month\'s surplus covers it.'], af_fromSav:['{s} יגיעו מהחיסכון שמעל קרן החירום.','{s} ستأتي من الادخار فوق صندوق الطوارئ.','{s} comes from savings above the emergency fund.'],
  af_waitSub:['חוסכים {m} בחודש עד שהסכום מצטבר.','توفير {m} شهريًا حتى يتجمع المبلغ.','Save {m} a month until it adds up.'], af_noFree:['ההוצאות שוות להכנסה או גבוהות ממנה – קודם כדאי לפנות מקום בתקציב.','المصاريف تساوي الدخل أو تزيد – الأفضل أولًا إفساح مجال في الميزانية.','Spending equals or exceeds income – first make room in the budget.'],
  af_instOk:['תשלום של {m} בחודש – פחות מחצי מהעודף החודשי.','دفعة {m} شهريًا – أقل من نصف الفائض الشهري.','A payment of {m} a month – less than half your monthly surplus.'], af_instTight:['תשלום של {m} בחודש – {p} מהעודף. לא יישאר הרבה לחיסכון.','دفعة {m} شهريًا – {p} من الفائض. لن يبقى الكثير للادخار.','A payment of {m} a month – {p} of the surplus. Little left for saving.'], af_instNo:['תשלום של {m} בחודש גדול מהעודף החודשי.','دفعة {m} شهريًا أكبر من الفائض الشهري.','A payment of {m} a month is more than your monthly surplus.'],
  af_free:['עודף חודשי','الفائض الشهري','Monthly surplus'], af_extra:['חיסכון מעל קרן החירום','ادخار فوق صندوق الطوارئ','Savings above the emergency fund'], af_monthly:['תשלום חודשי','الدفعة الشهرية','Monthly payment'], af_share:['חלק מהעודף','حصة من الفائض','Share of the surplus'],
  af_instNote:['תשלומים הם התחייבות לחודשים הבאים – כדאי לוודא שגם הם יהיו דומים.','التقسيط التزام للأشهر القادمة – تأكدوا أنها ستكون مشابهة أيضًا.','Installments commit future months too – make sure they\'ll look similar.'], af_noEmerg:['עדיין אין קרן חירום מלאה – כדאי להשלים אותה לפני קניות גדולות.','لا يوجد بعد صندوق طوارئ كامل – يُستحسن إكماله قبل المشتريات الكبيرة.','Your emergency fund isn\'t full yet – worth completing before big purchases.'],
  /* payday */
  pd_intro:['כמה כסף אפשר להוציא כל יום עד שהמשכורת נכנסת, אחרי החשבונות שעוד צריכים לרדת.','كم يمكن إنفاقه يوميًا حتى يدخل الراتب، بعد الفواتير التي ستُخصم.','How much you can spend each day until payday, after bills still to come.'],
  pd_day:['יום המשכורת בחודש','يوم الراتب في الشهر','Payday (day of month)'], pd_left:['כמה נשאר בחשבון עכשיו','كم تبقى في الحساب الآن','Left in the account now'], pd_bills:['חשבונות שעוד ירדו החודש','فواتير ستُخصم هذا الشهر','Bills still due this month'], pd_billsH:['שכירות, הוראות קבע, כרטיס אשראי…','إيجار، أوامر دائمة، بطاقة ائتمان…','Rent, direct debits, credit card…'],
  pd_per:['אפשר להוציא ביום','يمكن إنفاقه يوميًا','You can spend per day'], pd_until:['עד {d} · עוד {n} ימים','حتى {d} · بعد {n} أيام','Until {d} · {n} days left'], pd_daysL:['ימים עד המשכורת','أيام حتى الراتب','Days to payday'], pd_after:['נשאר אחרי החשבונות','يتبقى بعد الفواتير','Left after bills'], pd_week:['לשבוע','للأسبوع','Per week'],
  pd_neg:['החשבונות גבוהים מהיתרה – יש סיכון למינוס עד המשכורת.','الفواتير أعلى من الرصيد – هناك خطر سحب على المكشوف حتى الراتب.','Bills exceed the balance – you may go overdrawn before payday.'], pd_note:['אם המשכורת נכנסת בסוף שבוע או בחג, היא יכולה להקדים או להתאחר ביום-יומיים.','إذا صادف الراتب نهاية أسبوع أو عيدًا فقد يتقدم أو يتأخر يومًا أو يومين.','If payday falls on a weekend or holiday it may come a day or two early or late.'],
  /* divorce */
  dv_intro:['הערכה ראשונית בלבד של הרכוש שנצבר בתקופת הנישואים. בפועל החלוקה נקבעת בהסכם או בבית משפט.','تقدير أولي فقط للممتلكات التي تراكمت خلال الزواج. فعليًا يُحدَّد التقسيم باتفاق أو في المحكمة.','A first estimate only of what was built up during the marriage. The actual split is set by agreement or a court.'],
  dv_apt:['הון עצמי בדירה','حقوق الملكية في الشقة','Equity in the home'], dv_aptH:['שווי הדירה פחות יתרת המשכנתא','قيمة الشقة ناقص رصيد الرهن','Home value minus the mortgage balance'], dv_sav:['חסכונות והשקעות','مدخرات واستثمارات','Savings & investments'], dv_pens:['פנסיה וקרנות שנצברו בנישואים','تقاعد وصناديق تراكمت خلال الزواج','Pensions built up during the marriage'], dv_pensH:['כולל השתלמות וגמל','بما في ذلك صندوق الاستكمال والادخار','Including study and provident funds'],
  dv_car:['רכב','سيارة','Car'], dv_other:['רכוש אחר','ممتلكات أخرى','Other assets'], dv_debts:['חובות משותפים','ديون مشتركة','Joint debts'], dv_pct:['חלק צד א׳','حصة الطرف أ','Side A\'s share'],
  dv_net:['רכוש משותף נטו','صافي الممتلكات المشتركة','Net joint assets'], dv_assets:['סך הנכסים','مجموع الأصول','Total assets'], dv_sideA:['צד א׳ ({p}%)','الطرف أ ({p}%)','Side A ({p}%)'], dv_sideB:['צד ב׳ ({p}%)','الطرف ب ({p}%)','Side B ({p}%)'],
  dv_t1:['לפי חוק יחסי ממון, ככלל מאזנים בין בני הזוג את הרכוש שנצבר בתקופת הנישואים, אלא אם נחתם הסכם ממון.','وفق قانون العلاقات المالية، تتم عادة موازنة الممتلكات التي تراكمت خلال الزواج ما لم يوقَّع اتفاق مالي.','Under Israel\'s property relations law, assets built up during the marriage are generally balanced, unless there\'s a prenup.'],
  dv_t2:['רכוש שהיה לפני הנישואים, ירושות ומתנות – בדרך כלל לא נכללים, אבל יש חריגים.','الممتلكات قبل الزواج والإرث والهدايا – عادة لا تُشمل، لكن هناك استثناءات.','Assets from before the marriage, inheritances and gifts are usually excluded, with exceptions.'],
  dv_t3:['מזונות ילדים נקבעים בהסכם או בבית משפט לפי צורכי הילדים והכנסות ההורים – הם לא חלק מחלוקת הרכוש.','نفقة الأطفال تُحدَّد باتفاق أو في المحكمة حسب احتياجاتهم ودخل الوالدين – وليست جزءًا من تقسيم الممتلكات.','Child support is set by agreement or court by the children\'s needs and parents\' incomes – it isn\'t part of the asset split.'],
  dv_t4:['חלוקת פנסיה מחייבת פסק דין או הסכם שקיבל תוקף, ואז קרן הפנסיה מפצלת את הזכויות.','تقسيم التقاعد يتطلب حكمًا أو اتفاقًا مصادقًا عليه، ثم يقسّم صندوق التقاعد الحقوق.','Splitting a pension needs a court ruling or an approved agreement; then the fund divides the rights.'],
  dv_link:['מידע מלא בכל זכות','معلومات كاملة في كول زخوت','Full information on Kol Zchut'],
  /* wedding */
  wd_intro:['כמה יעלה האירוע, כמה צפוי להיכנס מהמתנות – ומה נשאר בסוף.','كم سيكلف الحفل، كم يُتوقع أن يدخل من الهدايا – وما يتبقى في النهاية.','What the event costs, what the gifts are likely to bring in – and what\'s left.'],
  wd_guests:['מוזמנים','مدعوون','Invited guests'], wd_att:['שיעור הגעה','نسبة الحضور','Attendance rate'], wd_pp:['מחיר למנה','السعر للوجبة','Price per guest'], wd_ppH:['כולל שתייה ושירות, אם הם בנפרד','بما في ذلك المشروبات والخدمة إن كانت منفصلة','Including drinks and service if separate'], wd_min:['מינימום מנות באולם','الحد الأدنى للوجبات في القاعة','Venue minimum guests'], wd_minH:['משלמים על לפחות כמות כזו','يُدفع على هذا العدد على الأقل','You pay for at least this many'],
  wd_photo:['צילום ווידאו','تصوير وفيديو','Photo & video'], wd_music:['תקליטן / להקה','دي جي / فرقة','DJ / band'], wd_dress:['שמלה וחליפה','فستان وبدلة','Dress & suit'], wd_extra:['שאר ההוצאות','باقي المصاريف','Everything else'], wd_extraH:['עיצוב, הזמנות, רבנות, איפור, הסעות…','تزيين، دعوات، تسجيل الزواج، مكياج، مواصلات…','Decor, invitations, registration, make-up, transport…'],
  wd_gift:['מתנה ממוצעת לאורח','متوسط الهدية لكل ضيف','Average gift per guest'], wd_share:['עזרה מהמשפחות','مساعدة من العائلات','Help from the families'],
  wd_plus:['נשאר לכם בסוף','يتبقى لكم في النهاية','You\'re left with'], wd_minus:['חסר לכם בסוף','ينقصكم في النهاية','You\'ll be short'], wd_came:['כ-{n} אורחים צפויים להגיע','يُتوقع حضور نحو {n} ضيف','About {n} guests expected'], wd_food:['אוכל ואולם ({n} מנות)','طعام وقاعة ({n} وجبة)','Food & venue ({n} guests)'], wd_ext:['ספקים ושאר ההוצאות','المزوّدون والباقي','Suppliers & the rest'], wd_cost:['עלות האירוע','تكلفة الحفل','Event cost'], wd_gifts:['מתנות צפויות','الهدايا المتوقعة','Expected gifts'],
  wd_note:['גובה המתנות משתנה מאוד לפי הקהל והאזור – כדאי להעריך בזהירות.','قيمة الهدايا تختلف كثيرًا حسب المدعوين والمنطقة – قدّروا بحذر.','Gift amounts vary a lot by crowd and region – estimate carefully.'],
});
Object.assign(T, {
  /* car vs bus */
  cb_intro:['מחשבים את כל עלויות הרכב – גם ירידת הערך שלא רואים – ומשווים לתחבורה ציבורית, מוניות ושכירות מדי פעם.','نحسب كل تكاليف السيارة – حتى انخفاض القيمة غير المرئي – ونقارنها بالمواصلات العامة وسيارات الأجرة والاستئجار أحيانًا.','Count every car cost – even the hidden loss in value – and compare with transit, taxis and occasional rentals.'],
  cb_val:['שווי הרכב','قيمة السيارة','Car value'], cb_dep:['ירידת ערך בשנה','انخفاض القيمة سنويًا','Depreciation per year'], cb_ins:['ביטוח ורישיון לשנה','تأمين وترخيص سنويًا','Insurance & licence per year'], cb_insH:['חובה, מקיף ואגרת רישוי','إلزامي، شامل ورسوم الترخيص','Compulsory, comprehensive and licence fee'],
  cb_fm:['דלק לפי','الوقود حسب','Fuel by'], cb_fmKm:['קילומטרים','كيلومترات','Kilometres'], cb_fmAmt:['סכום חודשי','مبلغ شهري','Monthly amount'], cb_km:['נסיעה בחודש','قيادة شهريًا','Driving per month'], cb_l100:['צריכה (ליטר ל-100 ק״מ)','الاستهلاك (لتر لكل 100 كم)','Consumption (L/100 km)'], cb_fuel:['דלק בחודש','وقود شهريًا','Fuel per month'],
  cb_maint:['טיפולים ותיקונים לשנה','صيانة وتصليحات سنويًا','Service & repairs per year'], cb_park:['חניה בחודש','موقف شهريًا','Parking per month'], cb_pass:['תחבורה ציבורית בחודש','مواصلات عامة شهريًا','Public transport per month'], cb_passH:['חופשי חודשי או נסיעות ברב-קו','اشتراك شهري أو رحلات بالراف-كاف','Monthly pass or Rav-Kav rides'],
  cb_taxi:['מוניות בחודש','سيارات أجرة شهريًا','Taxis per month'], cb_rd:['ימי שכירות רכב בשנה','أيام استئجار سيارة سنويًا','Car rental days per year'], cb_rp:['מחיר ליום שכירות','سعر يوم الاستئجار','Rental price per day'],
  cb_busWins:['בלי רכב חוסכים','بدون سيارة توفّرون','Without a car you save'], cb_carWins:['הרכב זול יותר ב-','السيارة أرخص بـ','The car is cheaper by'], cb_perMo:['בחודש','شهريًا','a month'], cb_year:['{y} בשנה','{y} سنويًا','{y} a year'],
  cb_depM:['ירידת ערך בחודש','انخفاض القيمة شهريًا','Depreciation per month'], cb_fuelM:['דלק בחודש','وقود شهريًا','Fuel per month'], cb_fixedM:['ביטוח, טיפולים וחניה בחודש','تأمين وصيانة وموقف شهريًا','Insurance, service & parking per month'], cb_car:['עלות הרכב בחודש','تكلفة السيارة شهريًا','Car per month'], cb_alt:['בלי רכב בחודש','بدون سيارة شهريًا','Without a car per month'],
  cb_note:['מחיר הדלק בחישוב: {p} ₪ לליטר (המחיר המפוקח). זמן נסיעה ונוחות לא נכללים.','سعر الوقود في الحساب: {p} ₪ للتر (السعر المراقَب). وقت السفر والراحة غير مشمولين.','Fuel price used: ₪{p} per litre (the regulated price). Travel time and comfort aren\'t included.'],
  /* car sell */
  cs_intro:['רכב ישן מאבד פחות ערך, אבל התיקונים גדלים. כשהתיקונים בשנה עוברים את ירידת הערך – זה בדרך כלל הזמן להחליף.','السيارة القديمة تفقد قيمة أقل، لكن التصليحات تزداد. عندما تتجاوز التصليحات السنوية انخفاض القيمة – غالبًا حان وقت الاستبدال.','An older car loses less value but repairs grow. When yearly repairs pass the loss in value, it\'s usually time to switch.'],
  cs_val:['שווי הרכב היום','قيمة السيارة اليوم','Car value today'], cs_dep:['ירידת ערך בשנה','انخفاض القيمة سنويًا','Depreciation per year'], cs_r:['תיקונים צפויים','تصليحات متوقعة','Expected repairs'], cs_r1:['בשנה הקרובה','في السنة القادمة','Next year'], cs_r2:['בעוד שנתיים','بعد سنتين','In 2 years'], cs_r3:['בעוד 3 שנים','بعد 3 سنوات','In 3 years'], cs_r4:['בעוד 4 שנים','بعد 4 سنوات','In 4 years'], cs_r5:['בעוד 5 שנים','بعد 5 سنوات','In 5 years'],
  cs_best:['כדאי לשקול להחליף','يُستحسن التفكير بالاستبدال','Consider replacing it'], cs_yrN:['בעוד {y} שנים','بعد {y} سنوات','In {y} years'], cs_why:['זו השנה הראשונה שבה התיקונים עולים יותר מירידת הערך.','هذه أول سنة تتجاوز فيها التصليحات انخفاض القيمة.','The first year repairs cost more than the drop in value.'], cs_keep:['להמשיך לנסוע בו','الاستمرار بقيادتها','Keep driving it'], cs_keepSub:['ב-5 השנים הקרובות התיקונים נמוכים מירידת הערך.','في السنوات الخمس القادمة التصليحات أقل من انخفاض القيمة.','For the next 5 years repairs stay below the drop in value.'],
  cs_yr:['שנה {y}','السنة {y}','Year {y}'], cs_row:['שווי {v} · ירידה {d} · תיקונים {r}','قيمة {v} · انخفاض {d} · تصليحات {r}','Value {v} · drop {d} · repairs {r}'], cs_cum:['סך התיקונים ב-5 שנים','مجموع التصليحات في 5 سنوات','Total repairs over 5 years'],
  cs_note:['גם בטיחות, צריכת דלק ואמינות חשובים – לא רק הכסף.','السلامة واستهلاك الوقود والموثوقية مهمة أيضًا – ليس المال فقط.','Safety, fuel use and reliability matter too – not just money.'],
  /* deductible */
  dd_intro:['השתתפות עצמית נמוכה עולה יותר בפרמיה. משווים את העלות הצפויה בשנה לפי כמה תביעות צפויות.','المشاركة الذاتية المنخفضة تكلّف أكثر في القسط. نقارن التكلفة المتوقعة سنويًا حسب عدد المطالبات المتوقعة.','A low deductible costs more in premium. Compare the expected yearly cost by how many claims you expect.'],
  dd_p1:['הצעה א׳ – פרמיה לשנה','العرض أ – القسط السنوي','Offer A – premium per year'], dd_d1:['הצעה א׳ – השתתפות עצמית','العرض أ – المشاركة الذاتية','Offer A – deductible'], dd_p2:['הצעה ב׳ – פרמיה לשנה','العرض ب – القسط السنوي','Offer B – premium per year'], dd_d2:['הצעה ב׳ – השתתפות עצמית','العرض ب – المشاركة الذاتية','Offer B – deductible'],
  dd_c:['תביעות צפויות בשנה','مطالبات متوقعة سنويًا','Expected claims per year'], dd_cH:['0.2 = תביעה אחת בערך כל 5 שנים','0.2 = مطالبة واحدة تقريبًا كل 5 سنوات','0.2 = about one claim every 5 years'],
  dd_best:['משתלם יותר','الأوفر','Better value'], dd_A:['הצעה א׳','العرض أ','Offer A'], dd_B:['הצעה ב׳','العرض ب','Offer B'], dd_save:['חיסכון צפוי של {s} בשנה','توفير متوقع {s} سنويًا','Expected saving of {s} a year'],
  dd_e1:['עלות צפויה בשנה – א׳','التكلفة المتوقعة سنويًا – أ','Expected yearly cost – A'], dd_e2:['עלות צפויה בשנה – ב׳','التكلفة المتوقعة سنويًا – ب','Expected yearly cost – B'], dd_be:['נקודת האיזון','نقطة التعادل','Break-even'], dd_beV:['{n} תביעות בשנה (אחת לכל {y} שנים)','{n} مطالبة سنويًا (واحدة كل {y} سنوات)','{n} claims a year (one every {y} years)'],
  dd_note:['אם תביעה אחת גבוהה תפגע בכם מאוד – השתתפות נמוכה נותנת שקט גם כשהיא קצת יקרה יותר.','إذا كانت مطالبة واحدة مرتفعة ستؤذيكم كثيرًا – المشاركة المنخفضة تمنح راحة بال حتى لو كانت أغلى قليلًا.','If one big claim would really hurt, a low deductible buys peace of mind even if it costs a bit more.'],
  /* life insurance */
  li_intro:['כמה כסף המשפחה תצטרך אם יקרה משהו – פחות מה שכבר יש. התוצאה היא הכיסוי שחסר.','كم من المال ستحتاج العائلة إن حدث شيء – ناقص ما هو موجود. النتيجة هي التغطية الناقصة.','How much the family would need if something happened – minus what\'s already there. The result is the missing cover.'],
  li_mort:['יתרת משכנתא','رصيد الرهن','Mortgage balance'], li_debts:['חובות אחרים','ديون أخرى','Other debts'], li_spend:['הוצאות המשפחה בשנה','مصاريف العائلة سنويًا','Family spending per year'], li_years:['כמה שנים לתמוך','كم سنة من الدعم','Years of support'], li_kids:['ילדים','أطفال','Children'], li_edu:['לימודים לכל ילד','تعليم لكل طفل','Education per child'],
  li_sav:['חסכונות','مدخرات','Savings'], li_pens:['קצבת שארים / סכום מהפנסיה','مخصصات الورثة / مبلغ من التقاعد','Survivors\' pension / lump sum'], li_pensH:['מופיע בדוח השנתי של קרן הפנסיה','يظهر في التقرير السنوي لصندوق التقاعد','Shown in your pension fund\'s annual report'], li_have:['ביטוח חיים קיים','تأمين حياة قائم','Existing life cover'],
  li_gap:['כיסוי חסר','تغطية ناقصة','Missing cover'], li_ok:['הכיסוי מספיק','التغطية كافية','Cover is enough'], li_needT:['הצורך הכולל','الحاجة الكلية','Total need'], li_offs:['מה שכבר יש','ما هو موجود','What you already have'], li_cover:['אחוז כיסוי','نسبة التغطية','Covered'],
  li_note:['ביטוח משכנתא מכסה רק את המשכנתא. כדאי לבדוק גם את קצבת השארים מביטוח לאומי.','تأمين الرهن يغطي الرهن فقط. افحصوا أيضًا مخصصات الورثة من التأمين الوطني.','Mortgage insurance covers only the mortgage. Also check survivors\' benefits from National Insurance.'],
  /* installments */
  in2_intro:['"ללא ריבית" לא תמיד זול: לפעמים מוותרים על הנחה במזומן. משווים את הערך האמיתי של שתי האפשרויות.','"بلا فائدة" ليس دائمًا أرخص: أحيانًا نتنازل عن خصم نقدي. نقارن القيمة الحقيقية للخيارين.','"Interest-free" isn\'t always cheaper: sometimes you give up a cash discount. Compare the real value of both.'],
  in2_price:['מחיר מלא','السعر الكامل','Full price'], in2_disc:['הנחה במזומן','خصم نقدي','Cash discount'], in2_n:['מספר תשלומים','عدد الدفعات','Number of payments'], in2_free:['תשלומים ללא ריבית','دفعات بلا فائدة','Interest-free payments'], in2_rate:['ריבית שנתית על התשלומים','فائدة سنوية على الدفعات','Yearly interest on payments'], in2_dep:['תשואה על הכסף אם נשאר אצלכם','عائد المال إن بقي معكم','Return on money you keep'], in2_depH:['למשל ריבית בפיקדון או קרן כספית','مثلًا فائدة وديعة أو صندوق نقدي','e.g. a deposit or money-market fund'],
  in2_best:['משתלם יותר','الأوفر','Better deal'], in2_cashW:['מזומן','نقدًا','Cash'], in2_instW:['תשלומים','التقسيط','Installments'], in2_by:['בערך {s} בערך של היום','بنحو {s} بقيمة اليوم','by about {s} in today\'s money'],
  in2_cashP:['מחיר במזומן','السعر نقدًا','Cash price'], in2_pmt:['תשלום חודשי ({n} תשלומים)','دفعة شهرية ({n} دفعات)','Monthly payment ({n})'], in2_total:['סך כל התשלומים','مجموع الدفعات','Total of payments'], in2_pv:['שווי התשלומים בכסף של היום','قيمة الدفعات بمال اليوم','Payments in today\'s money'],
  in2_note:['שווי בכסף של היום = כמה הכסף שתשלמו בהמשך שווה עכשיו, אם בינתיים הוא מרוויח תשואה.','القيمة بمال اليوم = كم يساوي الآن المال الذي ستدفعونه لاحقًا إن ربح عائدًا في الأثناء.','Today\'s money = what later payments are worth now if the money earns a return meanwhile.'],
  /* overlap */
  io_intro:['סמנו את הביטוחים שיש לכם. המחשבון מזהה כפילויות נפוצות שכדאי לבדוק מול הפוליסות.','حدّدوا تأميناتكم. الحاسبة تكشف الازدواجيات الشائعة التي يجب فحصها مقابل البوالص.','Tick the insurance you have. It spots common overlaps worth checking against your policies.'],
  io_shaban:['ביטוח משלים בקופת חולים (שב״ן)','التأمين المكمّل في صندوق المرضى','Health fund supplementary plan'], io_privH:['ביטוח בריאות פרטי','تأمين صحي خاص','Private health insurance'], io_life:['ביטוח חיים (ריסק)','تأمين حياة','Life insurance'], io_mortL:['ביטוח חיים למשכנתא','تأمين حياة للرهن','Mortgage life insurance'], io_crit:['מחלות קשות','أمراض خطيرة','Critical illness'],
  io_nursK:['ביטוח סיעודי דרך הקופה','تأمين تمريضي عبر الصندوق','Long-term care via the health fund'], io_nursP:['ביטוח סיעודי פרטי','تأمين تمريضي خاص','Private long-term care'], io_acc:['תאונות אישיות','حوادث شخصية','Personal accident'], io_travC:['ביטוח נסיעות דרך כרטיס אשראי','تأمين سفر عبر بطاقة الائتمان','Travel insurance via a credit card'], io_travP:['ביטוח נסיעות נפרד','تأمين سفر منفصل','Separate travel insurance'],
  io_found:['כפילויות אפשריות','ازدواجيات محتملة','Possible overlaps'], io_have:['סימנתם {n} ביטוחים','حدّدتم {n} تأمينات','You ticked {n} policies'],
  io_wHealth:['שב״ן + ביטוח בריאות פרטי: ייתכן כפל בניתוחים ובהתייעצויות. אם הפרטי הוא "משלים שב״ן" – הוא זול יותר ומשלים, לא כופל.','المكمّل + تأمين صحي خاص: قد يكون هناك ازدواج في العمليات والاستشارات. إن كان الخاص "مكمّلًا للصندوق" فهو أرخص ويكمّل ولا يكرّر.','Supplementary plan + private health: surgeries and consultations may overlap. A private policy "above the supplementary plan" is cheaper and complements it.'],
  io_wNurs:['סיעודי בקופה וגם פרטי: בדקו שהסכום הכולל באמת נחוץ לכם, ושהתנאים לא חופפים.','تمريضي في الصندوق وخاص أيضًا: تحققوا أن المبلغ الكلي ضروري فعلًا وأن الشروط لا تتداخل.','Care via the fund and private too: check you really need the combined amount and the terms don\'t overlap.'],
  io_wAcc:['תאונות אישיות + ביטוח חיים: רכיב המוות מתאונה בתאונות אישיות חופף חלקית לביטוח החיים.','حوادث شخصية + تأمين حياة: مكوّن الوفاة بحادث يتداخل جزئيًا مع تأمين الحياة.','Accident + life: the accidental-death part overlaps partly with life cover.'],
  io_wMort:['ביטוח חיים פרטי + ביטוח חיים למשכנתא: אפשר לפעמים לשעבד את הפוליסה הקיימת לבנק במקום לקנות נוספת.','تأمين حياة خاص + تأمين حياة للرهن: يمكن أحيانًا رهن البوليصة القائمة للبنك بدل شراء أخرى.','Private life + mortgage life: you can sometimes pledge the existing policy to the bank instead of buying another.'],
  io_wTrav:['ביטוח נסיעות בכרטיס אשראי + נפרד: בדקו מה הכרטיס כבר מכסה לפני שקונים עוד.','تأمين سفر في البطاقة + منفصل: افحصوا ما تغطيه البطاقة قبل شراء المزيد.','Card travel cover + separate policy: check what the card already covers before buying more.'],
  io_none:['לא נמצאו כפילויות נפוצות בין מה שסימנתם.','لم نجد ازدواجيات شائعة بين ما حددتم.','No common overlaps among what you ticked.'], io_pick:['סמנו למעלה את הביטוחים שיש לכם.','حدّدوا أعلاه التأمينات التي لديكم.','Tick the insurance you have above.'],
  io_har:['הר הביטוח – כל הפוליסות שלכם במקום אחד','جبل التأمين – كل بوالصكم في مكان واحد','Har HaBituach – all your policies in one place'], io_note:['באתר הר הביטוח של רשות שוק ההון אפשר לראות את כל הביטוחים הרשומים על שמכם.','في موقع "جبل التأمين" التابع لسلطة سوق المال يمكن رؤية كل التأمينات المسجلة باسمكم.','The Capital Market Authority\'s Har HaBituach site shows every policy in your name.'],
});
Object.assign(T, {
  cd_late:['פג לפני {n} ימים','انتهى قبل {n} أيام','Expired {n} days ago'], cd_today:['היום','اليوم','Today'], cd_left:['עוד {n} ימים','بعد {n} أيام','{n} days left'],
  /* calendar */
  fc_intro:['תאריכים שחוזרים כל שנה או כל חודש. לחיצה על ➕ מוסיפה אותם לתזכורות שלכם.','مواعيد تتكرر كل سنة أو كل شهر. الضغط على ➕ يضيفها إلى تذكيراتكم.','Dates that repeat every year or month. Tap ➕ to add them to your reminders.'],
  fc_cpiT:['פרסום מדד המחירים לצרכן','نشر مؤشر أسعار المستهلك','Consumer price index published'], fc_cpiN:['ב-15 בכל חודש בערב (מוקדם יותר אם יוצא בסוף שבוע או בחג). משפיע על משכנתא צמודה, שכירות והלוואות.','في 15 من كل شهر مساءً (أبكر إن صادف نهاية أسبوع أو عيدًا). يؤثر على الرهن المرتبط والإيجار والقروض.','On the 15th of each month in the evening (earlier on weekends or holidays). Affects linked mortgages, rent and loans.'],
  fc_yearEndT:['סוף שנת המס','نهاية السنة الضريبية','End of the tax year'], fc_yearEndN:['עד 31 בדצמבר: תרומות לזיכוי מס, והפקדות עצמאיים לפנסיה ולקרן השתלמות כדי לקבל את ההטבה השנה.','حتى 31 ديسمبر: تبرعات لخصم ضريبي، وإيداعات المستقلين للتقاعد وصندوق الاستكمال للحصول على الميزة هذا العام.','By 31 December: donations for tax credit, and self-employed pension and study-fund deposits to get this year\'s benefit.'],
  fc_refundT:['החזר מס – שנת {y} נסגרת','استرداد الضريبة – سنة {y} تُغلق','Tax refund – {y} closes'], fc_refundN:['אפשר לבקש החזר מס על 6 השנים האחרונות. בסוף השנה כבר אי אפשר לבקש על {y}.','يمكن طلب استرداد الضريبة عن آخر 6 سنوات. في نهاية السنة لا يعود ممكنًا طلبه عن {y}.','You can claim refunds for the last 6 years. After year-end, {y} can no longer be claimed.'],
  fc_f106T:['טופס 106 מהמעסיק','نموذج 106 من المشغّل','Form 106 from your employer'], fc_f106N:['המעסיק צריך לתת טופס 106 על השנה הקודמת עד סוף מרץ. צריך אותו להחזר מס.','على المشغّل تسليم نموذج 106 عن السنة السابقة حتى نهاية آذار. تحتاجونه لاسترداد الضريبة.','Your employer should give form 106 for last year by the end of March. You need it for a tax refund.'],
  fc_grantT:['מענק עבודה (מס הכנסה שלילי)','منحة العمل (ضريبة دخل سلبية)','Work grant (negative income tax)'], fc_grantN:['ההגשה נפתחת בדרך כלל באמצע השנה – כדאי לבדוק את המועד המדויק באתר gov.il.','يُفتح التقديم عادة في منتصف السنة – تحققوا من الموعد الدقيق في gov.il.','Applications usually open mid-year – check the exact date on gov.il.'],
  fc_carT:['חידוש רישיון וביטוח רכב','تجديد ترخيص وتأمين السيارة','Car licence & insurance renewal'], fc_carN:['כדאי להשוות הצעות ביטוח כשבועיים לפני החידוש.','يُستحسن مقارنة عروض التأمين قبل نحو أسبوعين من التجديد.','Compare insurance quotes about two weeks before renewal.'],
  fc_boiT:['החלטת הריבית של בנק ישראל','قرار الفائدة لبنك إسرائيل','Bank of Israel rate decision'], fc_boiN:['כמה פעמים בשנה, לפי לוח שבנק ישראל מפרסם מראש. משפיע על הפריים ועל הלוואות ומשכנתאות.','عدة مرات في السنة حسب جدول ينشره بنك إسرائيل مسبقًا. يؤثر على البرايم والقروض والرهن.','Several times a year on a schedule the Bank of Israel publishes. Affects prime, loans and mortgages.'], fc_boiNext:['ההחלטה הבאה לפי הנתונים באפליקציה: {d}.','القرار التالي حسب بيانات التطبيق: {d}.','Next decision per the app\'s data: {d}.'], fc_boiL:['לוח ההחלטות באתר בנק ישראל','جدول القرارات في موقع بنك إسرائيل','The schedule on the Bank of Israel site'],
  fc_monthly:['כל חודש','كل شهر','Monthly'], fc_carD:['מתי מתחדש רישיון הרכב שלכם (לא חובה)','متى يتجدد ترخيص سيارتكم (اختياري)','When your car licence renews (optional)'], fc_all:['להוסיף הכול לתזכורות','إضافة الكل إلى التذكيرات','Add all to reminders'],
  fc_added:['נוסף לתזכורות','أُضيف إلى التذكيرات','Added to reminders'], fc_exists:['כבר קיים בתזכורות','موجود مسبقًا في التذكيرات','Already in your reminders'], fc_addedN:['נוספו {n} תזכורות','أُضيفت {n} تذكيرات','{n} reminders added'],
  fc_note:['התאריכים כלליים. מועדים מדויקים מתפרסמים באתרי הרשויות.','المواعيد عامة. المواعيد الدقيقة تُنشر في مواقع السلطات.','Dates are general. Exact deadlines are published on the authorities\' websites.'],
  /* family goal */
  fg_intro:['יעד משותף למשפחה – חופשה, רכב או מחשב. כל אחד רושם כמה הוסיף, וכולם רואים כמה נשאר.','هدف مشترك للعائلة – عطلة أو سيارة أو حاسوب. كل واحد يسجل كم أضاف والجميع يرى كم تبقى.','A shared family goal – a holiday, car or computer. Everyone logs what they added and sees what\'s left.'],
  fg_goal:['יעד','هدف','Goal'], fg_anon:['בלי שם','بلا اسم','No name'], fg_need:['כדי להגיע בזמן: {m} בחודש ({n} חודשים)','للوصول في الوقت: {m} شهريًا ({n} أشهر)','To make it on time: {m} a month ({n} months)'], fg_left:['נשארו {m}','تبقى {m}','{m} to go'], fg_done:['הגעתם ליעד!','وصلتم إلى الهدف!','Goal reached!'],
  fg_who:['מי הוסיף','من أضاف','Who added'], fg_whoPh:['למשל: אמא','مثلًا: أمي','e.g. Mum'], fg_amt:['סכום','المبلغ','Amount'], fg_add:['הוספת סכום','إضافة مبلغ','Add amount'], fg_del:['מחיקת {n}','حذف {n}','Delete {n}'], fg_none:['עוד אין יעדים. הוסיפו יעד ראשון למטה.','لا أهداف بعد. أضيفوا هدفًا أول أدناه.','No goals yet. Add the first one below.'],
  fg_name:['שם היעד','اسم الهدف','Goal name'], fg_namePh:['למשל: חופשה באילת','مثلًا: عطلة في إيلات','e.g. Holiday in Eilat'], fg_target:['סכום יעד','المبلغ المستهدف','Target amount'], fg_due:['עד מתי (לא חובה)','حتى متى (اختياري)','By when (optional)'], fg_new:['יעד חדש','هدف جديد','New goal'],
  fg_needNT:['כתבו שם וסכום יעד.','اكتبوا اسمًا ومبلغًا مستهدفًا.','Enter a name and a target.'], fg_needA:['כתבו סכום.','اكتبوا مبلغًا.','Enter an amount.'],
  /* car documents */
  cd_intro:['רושמים מתי כל מסמך של הרכב נגמר – והאפליקציה מזכירה שבועיים לפני.','سجّلوا متى ينتهي كل مستند للسيارة – والتطبيق يذكّر قبل أسبوعين.','Enter when each car document expires – the app reminds you two weeks ahead.'],
  cd_lic:['🚗 רישיון רכב','🚗 ترخيص السيارة','🚗 Vehicle licence'], cd_comp:['🛡️ ביטוח חובה','🛡️ تأمين إلزامي','🛡️ Compulsory insurance'], cd_full:['🛡️ ביטוח מקיף / צד ג׳','🛡️ تأمين شامل / طرف ثالث','🛡️ Comprehensive / third party'], cd_test:['🔧 טסט שנתי','🔧 الفحص السنوي','🔧 Annual test'], cd_drv:['🪪 רישיון נהיגה','🪪 رخصة القيادة','🪪 Driving licence'],
  cd_until:['בתוקף עד','صالح حتى','Valid until'], cd_all:['תזכורת לכל המסמכים','تذكير لكل المستندات','Reminders for all documents'], cd_remT:['לחדש: {n}','تجديد: {n}','Renew: {n}'],
  cd_note:['בדרך כלל עושים טסט וחידוש רישיון רכב באותו זמן. ביטוח חובה הוא תנאי לחידוש.','عادة يتم الفحص وتجديد الترخيص في الوقت نفسه. التأمين الإلزامي شرط للتجديد.','The test and licence renewal usually happen together. Compulsory insurance is required to renew.'],
  /* renewals */
  rn2_intro:['הרבה מבצעים נגמרים אחרי שנה והמחיר קופץ בשקט. רשמו מתי הצטרפתם – ותקבלו תזכורת חודש לפני.','كثير من العروض تنتهي بعد سنة ويقفز السعر بصمت. سجّلوا متى انضممتم – وستصلكم تذكرة قبل شهر.','Many deals end after a year and the price quietly jumps. Note when you joined – get a reminder a month ahead.'],
  rn2_t_insur:['ביטוח','تأمين','Insurance'], rn2_t_cell:['סלולר','خلوي','Mobile'], rn2_t_net:['אינטרנט','إنترنت','Internet'], rn2_t_tv:['טלוויזיה','تلفزيون','TV'], rn2_t_other:['אחר','أخرى','Other'],
  rn2_perMo:['בחודש','شهريًا','a month'], rn2_ann:['שנה מלאה ב-{d}','سنة كاملة في {d}','Full year on {d}'], rn2_soon:['עוד {n} ימים מסתיימת שנה – המחיר עלול לעלות. זה הזמן לבדוק הצעות.','بعد {n} أيام تنتهي السنة – قد يرتفع السعر. هذا وقت فحص العروض.','A year ends in {n} days – the price may rise. Time to check offers.'], rn2_none:['עוד אין שירותים ברשימה.','لا خدمات في القائمة بعد.','No services listed yet.'],
  rn2_name:['שם השירות','اسم الخدمة','Service name'], rn2_namePh:['למשל: חבילת סלולר','مثلًا: باقة خلوي','e.g. Mobile plan'], rn2_type:['סוג','النوع','Type'], rn2_price:['מחיר חודשי','السعر الشهري','Monthly price'], rn2_start:['תאריך הצטרפות','تاريخ الانضمام','Start date'], rn2_add:['הוספה','إضافة','Add'], rn2_needS:['בחרו תאריך הצטרפות.','اختاروا تاريخ الانضمام.','Choose a start date.'],
  rn2_remT:['לבדוק מחיר: {n}','فحص السعر: {n}','Check the price: {n}'], rn2_remN:['השנה הראשונה נגמרת בעוד חודש – כדאי להתקשר ולבקש לשמור על המחיר או להשוות הצעות.','السنة الأولى تنتهي بعد شهر – اتصلوا واطلبوا الحفاظ على السعر أو قارنوا العروض.','The first year ends in a month – call to keep the price or compare offers.'],
  rn2_note:['טיפ: לפעמים מספיקה שיחה אחת לשירות הלקוחות כדי לשמור על המחיר.','نصيحة: أحيانًا تكفي مكالمة واحدة لخدمة العملاء للحفاظ على السعر.','Tip: sometimes one call to customer service keeps the price.'],
  /* letter */
  lt2_intro:['צלמו מכתב רשמי – מס הכנסה, ביטוח לאומי, בנק, עירייה או חברת ביטוח – וקבלו הסבר פשוט: מה רוצים מכם, עד מתי וכמה.','صوّروا رسالة رسمية – ضريبة الدخل، التأمين الوطني، بنك، بلدية أو شركة تأمين – واحصلوا على شرح بسيط: ماذا يريدون، حتى متى وكم.','Photograph an official letter – tax authority, National Insurance, bank, council or insurer – and get a plain explanation: what they want, by when and how much.'],
  lt2_photo:['צילום המכתב','تصوير الرسالة','Photograph the letter'], lt2_go:['להסביר לי','اشرح لي','Explain it'], lt2_priv:['התמונות נשלחות ל-AI רק כשלוחצים "להסביר לי", ולא נשמרות.','تُرسل الصور للذكاء الاصطناعي فقط عند الضغط على "اشرح لي" ولا تُحفظ.','Photos go to the AI only when you tap "Explain it", and aren\'t kept.'],
  lt2_req:['מה צריך לעשות','ما المطلوب','What to do'], lt2_due:['עד מתי','حتى متى','Deadline'], lt2_amt:['סכום','المبلغ','Amount'], lt2_remT:['מכתב: {n}','رسالة: {n}','Letter: {n}'],
  lt2_noteAi:['ההסבר נוצר אוטומטית ועלול לטעות. בכל ספק – פנו לגוף ששלח את המכתב.','الشرح آلي وقد يخطئ. عند الشك – توجهوا للجهة المرسِلة.','The explanation is automatic and may be wrong. If in doubt, contact the sender.'],
  /* glossary */
  gl_intro:['מונחים פיננסיים בשפה פשוטה. מכל מונח אפשר לקפוץ למחשבון שקשור אליו.','مصطلحات مالية بلغة بسيطة. من كل مصطلح يمكن الانتقال إلى الحاسبة المرتبطة.','Money terms in plain words. Jump from each term to its calculator.'],
  gl_search:['חיפוש מונח','بحث عن مصطلح','Search a term'], gl_ph:['למשל: פריים','مثلًا: برايم','e.g. prime'], gl_none:['לא נמצא מונח כזה.','لم يُعثر على مصطلح كهذا.','No such term.'],
  /* sources */
  so_intro:['אלה הנתונים הרשמיים שהמחשבונים משתמשים בהם כרגע, ומאיפה הם מגיעים. שערים, ריבית, מדד ודלק מתעדכנים אוטומטית.','هذه البيانات الرسمية التي تستخدمها الحاسبات حاليًا ومن أين تأتي. الأسعار والفائدة والمؤشر والوقود تتحدث تلقائيًا.','These are the official figures the calculators use right now, and where they come from. Rates, interest, CPI and fuel update automatically.'],
  so_what:['נתון','البيان','Figure'], so_val:['ערך','القيمة','Value'], so_src:['מקור','المصدر','Source'], so_perMo:['בחודש','شهريًا','a month'], so_perYr:['בשנה','سنويًا','a year'],
  so_vat:['מע״מ','ضريبة القيمة المضافة','VAT'], so_point:['נקודת זיכוי','نقطة الاستحقاق','Tax credit point'], so_br:['מדרגות מס הכנסה','شرائح ضريبة الدخل','Income tax brackets'], so_ni:['ביטוח לאומי ובריאות לעובד (מופחת / מלא)','التأمين الوطني والصحة للعامل (مخفض / كامل)','Employee NI & health (reduced / full)'], so_niCut:['מדרגה עד {c}','الشريحة حتى {c}','reduced up to {c}'],
  so_min:['שכר מינימום חודשי','الحد الأدنى للأجور الشهري','Monthly minimum wage'], so_avg:['השכר הממוצע במשק','متوسط الأجر في الاقتصاد','Average wage'], so_kid:['חיסכון לכל ילד – הפקדה','التوفير لكل طفل – إيداع','Savings for every child – deposit'],
  so_boi:['ריבית בנק ישראל','فائدة بنك إسرائيل','Bank of Israel rate'], so_since:['מ-{d}','منذ {d}','since {d}'], so_cpi:['אינפלציה ב-12 חודשים','التضخم خلال 12 شهرًا','Inflation over 12 months'], so_month:['נכון ל-{d}','حتى {d}','as of {d}'], so_fuel:['מחיר בנזין 95 לליטר','سعر بنزين 95 للتر','Petrol 95 per litre'], so_usd:['דולר','دولار','US dollar'], so_eur:['אירו','يورو','Euro'],
  so_s_tax:['רשות המסים','سلطة الضرائب','Tax Authority'], so_s_btl:['ביטוח לאומי','التأمين الوطني','National Insurance'], so_s_boi:['בנק ישראל','بنك إسرائيل','Bank of Israel'], so_s_cbs:['הלמ״ס','دائرة الإحصاء','CBS'], so_s_energy:['משרד האנרגיה','وزارة الطاقة','Ministry of Energy'], so_s_labor:['משרד העבודה','وزارة العمل','Ministry of Labor'],
  so_note:['הנתונים הקבועים (מס, ביטוח לאומי, שכר מינימום) מתעדכנים עם גרסת האפליקציה. אם משהו נראה לא מעודכן – בדקו במקור.','البيانات الثابتة (الضريبة، التأمين الوطني، الحد الأدنى للأجور) تتحدث مع إصدار التطبيق. إن بدا شيء غير محدّث – افحصوا المصدر.','Fixed figures (tax, NI, minimum wage) update with the app version. If something looks out of date, check the source.'],
});
Object.assign(T, {
  gl_t_prime:['פריים','البرايم','Prime rate'], gl_d_prime:['ריבית הבסיס של הבנקים: ריבית בנק ישראל ועוד 1.5%. הלוואות ומסלולי משכנתא רבים צמודים אליה.','فائدة الأساس في البنوك: فائدة بنك إسرائيل زائد 1.5%. كثير من القروض ومسارات الرهن مرتبطة بها.','Banks\' base rate: the Bank of Israel rate plus 1.5%. Many loans and mortgage tracks follow it.'],
  gl_t_compound:['ריבית דריבית','الفائدة المركّبة','Compound interest'], gl_d_compound:['ריבית שמתקבלת גם על הריבית שכבר הצטברה. לאורך שנים זה מה שגורם לחיסכון לגדול מהר.','فائدة تُحتسب أيضًا على الفائدة المتراكمة. على مدى سنوات هذا ما يجعل الادخار ينمو بسرعة.','Interest earned on interest already added. Over years it\'s what makes savings grow fast.'],
  gl_t_cpi:['מדד המחירים לצרכן','مؤشر أسعار المستهلك','Consumer price index'], gl_d_cpi:['מדד שהלמ״ס מפרסמת כל חודש ומודד את שינוי המחירים של סל מוצרים ושירותים.','مؤشر تنشره دائرة الإحصاء شهريًا ويقيس تغيّر أسعار سلة سلع وخدمات.','A monthly CBS index measuring price changes in a basket of goods and services.'],
  gl_t_link:['הצמדה למדד','الربط بالمؤشر','CPI linkage'], gl_d_link:['כשסכום צמוד למדד, הוא עולה ויורד יחד עם המחירים – למשל משכנתא צמודה או שכירות.','عندما يكون المبلغ مرتبطًا بالمؤشر فإنه يرتفع وينخفض مع الأسعار – مثل رهن مرتبط أو إيجار.','A linked amount moves with prices – like a linked mortgage or rent.'],
  gl_t_pensfix:['קיבוע זכויות','تثبيت الحقوق','Pension rights fixing'], gl_d_pensfix:['בקשה ממס הכנסה בגיל פרישה שקובעת כמה מהקצבה ומהמענקים יהיו פטורים ממס. כדאי להגיש.','طلب من ضريبة الدخل في سن التقاعد يحدد كم من المخصصات والمنح ستكون معفاة. يُستحسن تقديمه.','A request to the tax authority at retirement setting how much pension and grants are tax-free. Worth filing.'],
  gl_t_annfac:['מקדם המרה','معامل التحويل','Annuity factor'], gl_d_annfac:['המספר שבו מחלקים את הצבירה בפנסיה כדי לחשב את הקצבה החודשית. מקדם נמוך = קצבה גבוהה.','الرقم الذي يُقسم عليه الرصيد التقاعدي لحساب المخصص الشهري. معامل منخفض = مخصص أعلى.','The number your pension balance is divided by to get the monthly pension. Lower factor = higher pension.'],
  gl_t_fees:['דמי ניהול','رسوم الإدارة','Management fees'], gl_d_fees:['העמלה שגוף החיסכון גובה – מההפקדות ומהצבירה. הבדל קטן באחוזים הוא הרבה כסף לאורך שנים.','العمولة التي تتقاضاها جهة الادخار – من الإيداعات ومن الرصيد. فرق صغير بالنسب يعني مالًا كثيرًا على مدى سنوات.','The fee a savings fund charges on deposits and balance. A small difference adds up to a lot over years.'],
  gl_t_hish:['קרן השתלמות','صندوق الاستكمال','Study fund (Keren Hishtalmut)'], gl_d_hish:['חיסכון לטווח בינוני עם הטבת מס: נזיל אחרי 6 שנים, והרווחים פטורים ממס עד תקרה.','ادخار متوسط الأمد مع ميزة ضريبية: سائل بعد 6 سنوات والأرباح معفاة حتى سقف.','Medium-term savings with a tax break: liquid after 6 years, gains tax-free up to a cap.'],
  gl_t_gemel:['קופת גמל','صندوق الادخار (جيمل)','Provident fund'], gl_d_gemel:['חיסכון ארוך טווח לפרישה. יש גם קופת גמל להשקעה שאפשר למשוך ממנה בכל זמן (עם מס על הרווח).','ادخار طويل الأمد للتقاعد. هناك أيضًا صندوق استثماري يمكن السحب منه في أي وقت (مع ضريبة على الربح).','Long-term retirement savings. An investment provident fund can be withdrawn anytime (with tax on gains).'],
  gl_t_polsav:['פוליסת חיסכון','بوليصة ادخار','Savings policy'], gl_d_polsav:['חיסכון דרך חברת ביטוח שאפשר למשוך בכל זמן. משלמים מס רק על הרווח הריאלי.','ادخار عبر شركة تأمين يمكن سحبه في أي وقت. تُدفع الضريبة على الربح الحقيقي فقط.','Savings through an insurer, withdrawable anytime. Tax is only on the real gain.'],
  gl_t_landtax:['מס שבח','ضريبة التحسين','Betterment tax'], gl_d_landtax:['מס על הרווח במכירת נכס נדל״ן. דירת מגורים יחידה פטורה בדרך כלל, בתנאים.','ضريبة على الربح من بيع عقار. الشقة السكنية الوحيدة معفاة عادة بشروط.','Tax on the profit from selling property. A single home is usually exempt, with conditions.'],
  gl_t_purch:['מס רכישה','ضريبة الشراء','Purchase tax'], gl_d_purch:['מס שהקונה משלם בקניית נכס. על דירה יחידה יש מדרגה פטורה.','ضريبة يدفعها المشتري عند شراء عقار. للشقة الوحيدة شريحة معفاة.','Tax the buyer pays on property. A single home has a tax-free bracket.'],
  gl_t_point:['נקודת זיכוי','نقطة الاستحقاق','Tax credit point'], gl_d_point:['סכום קבוע שמקטין את מס ההכנסה. לכל תושב יש נקודות, ונוספות לנשים, להורים, לחיילים משוחררים ועוד.','مبلغ ثابت يقلّل ضريبة الدخل. لكل مقيم نقاط، وتُضاف للنساء والأهالي والجنود المسرّحين وغيرهم.','A fixed amount that cuts income tax. Every resident has points; more for women, parents, discharged soldiers and others.'],
  gl_t_gross:['ברוטו','الإجمالي (بروتو)','Gross pay'], gl_d_gross:['השכר לפני כל הניכויים – מס, ביטוח לאומי ופנסיה.','الراتب قبل كل الاقتطاعات – الضريبة والتأمين الوطني والتقاعد.','Pay before any deductions – tax, National Insurance and pension.'],
  gl_t_net:['נטו','الصافي (نيتو)','Net pay'], gl_d_net:['מה שנכנס בפועל לחשבון אחרי כל הניכויים.','ما يدخل فعليًا إلى الحساب بعد كل الاقتطاعات.','What actually reaches your account after all deductions.'],
  gl_t_ni:['ביטוח לאומי','التأمين الوطني','National Insurance'], gl_d_ni:['תשלום חובה שממן קצבאות כמו אבטלה, לידה וזקנה, יחד עם דמי ביטוח בריאות.','دفعة إلزامية تموّل مخصصات مثل البطالة والولادة والشيخوخة، مع رسوم التأمين الصحي.','A compulsory payment funding benefits like unemployment, maternity and old age, plus health insurance.'],
  gl_t_marginal:['מס שולי','الضريبة الحدّية','Marginal tax'], gl_d_marginal:['שיעור המס על השקל הבא שתרוויחו. הוא גבוה מהמס הממוצע שאתם משלמים.','نسبة الضريبة على الشيكل التالي الذي تربحونه. أعلى من متوسط الضريبة.','The tax rate on your next shekel. It\'s higher than your average rate.'],
  gl_t_refund:['החזר מס','استرداد الضريبة','Tax refund'], gl_d_refund:['כסף שמס הכנסה מחזיר כששילמתם יותר מדי – למשל בהחלפת עבודה או בגלל זיכויים שלא נוצלו.','مال تعيده ضريبة الدخل عند الدفع الزائد – مثل تغيير العمل أو استحقاقات لم تُستغل.','Money returned when you overpaid – e.g. after changing jobs or unused credits.'],
  gl_t_f106:['טופס 106','نموذج 106','Form 106'], gl_d_f106:['סיכום שנתי מהמעסיק: כמה הרווחתם וכמה מס נוכה. צריך אותו להחזר מס.','ملخص سنوي من المشغّل: كم ربحتم وكم اقتُطع من ضريبة. تحتاجونه لاسترداد الضريبة.','Your employer\'s yearly summary of pay and tax withheld. Needed for a refund.'],
  gl_t_f161:['טופס 161','نموذج 161','Form 161'], gl_d_f161:['טופס שהמעסיק ממלא בסיום עבודה, כדי לקבוע את המס על הפיצויים.','نموذج يملؤه المشغّل عند انتهاء العمل لتحديد الضريبة على التعويضات.','Filled by the employer when a job ends, to set the tax on severance.'],
  gl_t_sev:['פיצויי פיטורים','تعويضات الفصل','Severance pay'], gl_d_sev:['כסף שמגיע לעובד שפוטר אחרי שנת עבודה לפחות – בדרך כלל משכורת חודשית לכל שנה.','مال يستحقه العامل المفصول بعد سنة عمل على الأقل – عادة راتب شهري عن كل سنة.','Money due to a dismissed worker after at least a year – usually a month\'s pay per year.'],
  gl_t_grant:['מענק עבודה','منحة العمل','Work grant'], gl_d_grant:['מענק ממס הכנסה לעובדים ועצמאים עם הכנסה נמוכה. צריך להגיש בקשה כל שנה.','منحة من ضريبة الدخل للعاملين والمستقلين ذوي الدخل المنخفض. يجب تقديم طلب كل سنة.','A tax-authority grant for low-income workers and self-employed. You apply each year.'],
  gl_t_lease:['ליסינג','الليسنغ (التأجير)','Leasing'], gl_d_lease:['שכירות רכב לתקופה ארוכה בתשלום חודשי. הרכב לא שלכם בסוף, אלא אם קונים אותו.','استئجار سيارة لمدة طويلة بدفعة شهرية. السيارة ليست لكم في النهاية إلا إذا اشتريتموها.','Renting a car long-term for a monthly fee. It isn\'t yours at the end unless you buy it.'],
  gl_t_prepay:['עמלת פירעון מוקדם','عمولة السداد المبكر','Early repayment fee'], gl_d_prepay:['עמלה שהבנק יכול לגבות כשמחזירים הלוואה או משכנתא לפני הזמן, בעיקר במסלולים קבועים.','عمولة قد يتقاضاها البنك عند سداد القرض أو الرهن قبل موعده، خاصة في المسارات الثابتة.','A fee a bank may charge when you repay early, mainly on fixed-rate tracks.'],
  gl_t_balloon:['משכנתא בלון','رهن بالون','Balloon mortgage'], gl_d_balloon:['משכנתא שבה משלמים רק ריבית בזמן התקופה, ואת הקרן מחזירים בבת אחת בסוף.','رهن تُدفع فيه الفائدة فقط خلال المدة ويُسدد الأصل دفعة واحدة في النهاية.','A mortgage where you pay only interest during the term and the principal at the end.'],
  gl_t_cpitrack:['מסלול צמוד','مسار مرتبط','CPI-linked track'], gl_d_cpitrack:['מסלול משכנתא שבו יתרת ההלוואה עולה עם המדד. ההחזר ההתחלתי נמוך, אבל הוא גדל עם האינפלציה.','مسار رهن يرتفع فيه الرصيد مع المؤشر. الدفعة الأولية منخفضة لكنها تكبر مع التضخم.','A mortgage track whose balance rises with CPI. Low starting payment that grows with inflation.'],
  gl_t_var:['ריבית משתנה','فائدة متغيرة','Variable rate'], gl_d_var:['ריבית שמתעדכנת לאורך ההלוואה – כל 5 שנים או לפי הפריים.','فائدة تتحدث خلال القرض – كل 5 سنوات أو حسب البرايم.','A rate that resets during the loan – every 5 years or with prime.'],
  gl_t_bond:['אג״ח','السندات','Bond'], gl_d_bond:['הלוואה שנותנים למדינה או לחברה ומקבלים עליה ריבית. בדרך כלל פחות תנודתי ממניות.','قرض تمنحونه للدولة أو لشركة مقابل فائدة. عادة أقل تقلبًا من الأسهم.','A loan to a government or company that pays interest. Usually less volatile than stocks.'],
  gl_t_stock:['מניה','السهم','Stock'], gl_d_stock:['חלק קטן בבעלות על חברה. יכולה לעלות או לרדת הרבה בטווח קצר.','حصة صغيرة في ملكية شركة. قد ترتفع أو تنخفض كثيرًا على المدى القصير.','A small share of a company. It can rise or fall a lot short-term.'],
  gl_t_etf:['קרן סל','صندوق المؤشرات','ETF (index fund)'], gl_d_etf:['קרן שעוקבת אחרי מדד, כמו ת״א 125 או S&P 500. פיזור רחב בדמי ניהול נמוכים.','صندوق يتتبع مؤشرًا مثل تل أبيب 125 أو S&P 500. تنويع واسع برسوم منخفضة.','A fund tracking an index like TA-125 or the S&P 500. Broad spread with low fees.'],
  gl_t_yield:['תשואה','العائد','Return'], gl_d_yield:['כמה ההשקעה הרוויחה או הפסידה, באחוזים, בתקופה מסוימת.','كم ربح الاستثمار أو خسر بالنسبة المئوية خلال فترة.','How much an investment gained or lost, in percent, over a period.'],
  gl_t_infl:['אינפלציה','التضخم','Inflation'], gl_d_infl:['עליית מחירים כללית. כסף שלא מרוויח לפחות את האינפלציה – מאבד מכוח הקנייה שלו.','ارتفاع عام في الأسعار. المال الذي لا يربح على الأقل بقدر التضخم يفقد قوته الشرائية.','A general rise in prices. Money that earns less than inflation loses buying power.'],
  gl_t_dti:['יחס החזר','نسبة السداد','Payment-to-income ratio'], gl_d_dti:['איזה חלק מההכנסה הולך להחזר המשכנתא. בנקים מגבילים אותו, ובדרך כלל ממליצים עד כשליש.','أي جزء من الدخل يذهب لسداد الرهن. البنوك تحدّه وعادة توصي بحتى الثلث تقريبًا.','The share of income going to the mortgage payment. Banks cap it; around a third is usually advised.'],
  gl_t_ltv:['שיעור מימון (LTV)','نسبة التمويل (LTV)','Loan-to-value (LTV)'], gl_d_ltv:['כמה אחוז משווי הדירה מממנת המשכנתא. בדירה יחידה המימון מוגבל ל-75%.','كم بالمئة من قيمة الشقة يموّل الرهن. في الشقة الوحيدة التمويل محدود بـ 75%.','The percent of the home\'s value the mortgage covers. Capped at 75% for a single home.'],
  gl_t_od:['אוברדרפט (מינוס)','السحب على المكشوف','Overdraft'], gl_d_od:['יתרה שלילית בחשבון הבנק. זו הלוואה יקרה עם ריבית גבוהה.','رصيد سالب في الحساب البنكي. هذا قرض مكلف بفائدة عالية.','A negative bank balance. It\'s an expensive loan with high interest.'],
  gl_t_dd:['הוראת קבע','أمر دائم','Direct debit'], gl_d_dd:['הרשאה לגוף מסוים לחייב את החשבון כל חודש. כדאי לעבור עליהן מדי פעם ולבטל מה שלא צריך.','تفويض لجهة معينة بالخصم من الحساب كل شهر. يُستحسن مراجعتها أحيانًا وإلغاء غير الضروري.','Permission for a company to charge your account monthly. Review them now and then.'],
  gl_t_shaban:['שב״ן','التأمين المكمّل (شابان)','Supplementary health plan'], gl_d_shaban:['ביטוח משלים של קופת החולים – מעבר לסל הבריאות. בדרך כלל זול יחסית.','تأمين مكمّل من صندوق المرضى – فوق سلة الصحة. عادة رخيص نسبيًا.','A health fund\'s extra plan beyond the basic basket. Usually fairly cheap.'],
  gl_t_nurs:['ביטוח סיעודי','التأمين التمريضي','Long-term care insurance'], gl_d_nurs:['ביטוח שמשלם כשמישהו צריך עזרה קבועה בפעולות יומיומיות, בדרך כלל בגיל מבוגר.','تأمين يدفع عندما يحتاج شخص مساعدة دائمة في الأنشطة اليومية، عادة في سن متقدمة.','Pays when someone needs ongoing help with daily activities, usually in old age.'],
  gl_t_exempt:['עוסק פטור','مشتغل معفى','Exempt dealer'], gl_d_exempt:['עצמאי עם מחזור נמוך שלא גובה מע״מ מהלקוחות. מעל תקרה שנתית צריך לעבור לעוסק מורשה.','مستقل بدخل منخفض لا يجبي ضريبة القيمة المضافة. فوق سقف سنوي يجب الانتقال لمشتغل مرخّص.','Self-employed with low turnover who doesn\'t charge VAT. Above a yearly cap you become licensed.'],
  gl_t_licensed:['עוסק מורשה','مشتغل مرخّص','Licensed dealer'], gl_d_licensed:['עצמאי שגובה מע״מ מהלקוחות, מעביר אותו לרשות ומקזז מע״מ על הוצאות.','مستقل يجبي ضريبة القيمة المضافة ويحوّلها للسلطة ويخصم ضريبة المصاريف.','Self-employed who charges VAT, pays it on, and deducts VAT on expenses.'],
});
