/* ================= 10.9: new calculators ================= */
/* --- work grant (negative income tax): who is eligible, by the 2025 income bands --- */
function calcWorkGrant(){
  const fam = $('#wg_fam').value, inc = Math.max(0, v('wg_inc')), mo = clamp(Math.round(v('wg_mo')), 0, 12), prop = $('#wg_prop').value === '1', self = $('#wg_kind').value === 'self';
  const band = IL26B.wgBands[fam], why = [];
  if (fam === 'none') why.push(t('wg_noFam'));
  if (band && !(inc > band[0] && inc < band[1])) why.push(t('wg_noBand', {a: MI(band[0]), b: MI(band[1])}));
  if (mo < 1) why.push(t('wg_noMonths'));
  if (prop) why.push(t('wg_noProp'));
  const ok = !why.length, tod = Math.max(0, Math.round(v('wg_tod')));
  const rows = [[t('r_wgInc'), MI(inc)], [t('r_wgBand'), band ? MI(band[0]) + ' – ' + MI(band[1]) : '—'], [t('r_wgMonths'), mo], [t('r_wgStatus'), t(ok ? 'r_wgYes' : 'r_wgNo'), 'key']];
  if (ok && tod > 0) rows.push([t('r_wgTod'), t('r_wgTodV', {n: tod})]);
  return {hero: {label: t('r_wgHero'), value: t(ok ? 'r_wgYes' : 'r_wgNo'), sub: ok ? t('r_wgSubOk') : why[0]},
    rows, warn: ok ? [] : why, note: t('n_wg') + (self ? ' ' + t('n_wgSelf') : '')};
}
/* --- reservist pay: Bituach Leumi compensation and the 2026 grants --- */
function calcReserve(){
  const days = Math.max(0, Math.round(v('rs_days'))), inc = Math.max(0, v('rs_inc')), unit = $('#rs_unit').value;
  const kids = $('#rs_kids').value === '1', active = $('#rs_active').value === '1';
  const avg = inc / 90, day = clamp(avg, IL26B.rsMin, IL26B.rsMax), comp = day * days;
  const extra = days >= 40 ? days - 40 : 0;
  const pers = extra * IL26B.rsPers[unit], famG = kids ? extra * IL26B.rsFam[unit] : 0, house = active ? IL26B.rsHouse : 0;
  const total = comp + pers + famG + house;
  const rows = [[t('r_rsAvg'), MI(avg, 2)], [t('r_rsDay'), MI(day, 2)], [t('r_rsComp', {n: days}), MI(comp), 'key'],
    [t('r_rsPers'), MI(pers)], [t('r_rsFam'), MI(famG)], [t('r_rsHouse'), MI(house)], [t('r_rsTotal'), MI(total), 'key']];
  const warn = [];
  if (avg < IL26B.rsMin) warn.push(t('w_rsMin', {m: MI(IL26B.rsMin, 2)}));
  if (avg > IL26B.rsMax) warn.push(t('w_rsMax', {m: MI(IL26B.rsMax, 2)}));
  if (days > 0 && days < 40) warn.push(t('w_rs40'));
  return {hero: {label: t('r_rsTotal'), value: MI(total), sub: t('r_rsSub', {d: MI(day, 2)})}, rows, warn, note: t('n_rs')};
}
/* --- fixation of rights: how much of the pension is tax-free (2026) --- */
function calcPensFix(){
  const pens = Math.max(0, v('pf_pens')), sev = Math.max(0, v('pf_sev')), share = clamp(v('pf_share'), 0, 100) / 100;
  const other = Math.max(0, v('pf_other')), pts = Math.max(0, v('pf_pts'));
  const pot = IL26B.pfCeil * 180 * IL26B.pfPct, used = sev * IL26B.pfMul, left = Math.max(0, pot - used);
  const toPens = left * share, toCap = left - toPens;
  const exM = Math.min(pens, toPens / 180, IL26B.pfCeil * IL26B.pfPct);
  const taxNo = incTaxOf((pens + other) * 12, pts) / 12, taxYes = incTaxOf((pens - exM + other) * 12, pts) / 12, save = Math.max(0, taxNo - taxYes);
  return {hero: {label: t('r_pfEx'), value: MI(exM), sub: t('r_pfSave', {n: MI(save)})},
    rows: [[t('r_pfPot'), MI(pot)], [t('r_pfUsed'), MI(-used)], [t('r_pfLeft'), MI(left)], [t('r_pfToPens'), MI(toPens)], [t('r_pfEx'), MI(exM), 'key'],
      [t('r_pfToCap'), MI(toCap)], [t('r_pfTaxNo'), MI(taxNo)], [t('r_pfTaxYes'), MI(taxYes)], [t('r_pfSaveRow'), MI(save), 'key'], [t('r_pfSaveY'), MI(save * 12)]],
    warn: used > pot ? [t('w_pfUsed')] : [], note: t('n_pf')};
}
/* --- bank deposit or money-market fund --- */
function calcMmf(){
  const amt = Math.max(0, v('mm_amt')), y = clamp(v('mm_mo'), 0, 600) / 12, dep = v('mm_dep') / 100, yld = v('mm_yld') / 100, fee = Math.max(0, v('mm_fee')) / 100, infl = v('mm_infl') / 100;
  const dG = amt * (Math.pow(1 + dep, y) - 1), dT = Math.max(0, dG) * 0.15, dN = dG - dT;
  const fG = amt * (Math.pow(1 + yld - fee, y) - 1), real = fG - amt * (Math.pow(1 + infl, y) - 1), fT = Math.max(0, real) * 0.25, fN = fG - fT;
  const best = fN > dN ? 'f' : 'd', diff = Math.abs(fN - dN);
  return {hero: {label: t(best === 'f' ? 'r_mmBestF' : 'r_mmBestD'), value: MI(diff), sub: t('r_mmSub', {n: Math.round(y * 12)})},
    rows: [[t('r_mmDepG'), MI(dG)], [t('r_mmDepT'), MI(-dT)], [t('r_mmDepN'), MI(dN), 'key'],
      [t('r_mmFG'), MI(fG)], [t('r_mmFT'), MI(-fT)], [t('r_mmFN'), MI(fN), 'key'], [t('r_mmDiff'), MI(diff)]],
    note: t('n_mm', {b: PC(IL26B.boi)})};
}
/* --- investment fees: index fund, managed portfolio, mutual fund --- */
function calcInvFees(){
  const init = Math.max(0, v('if_init')), mon = Math.max(0, v('if_mon')), yrs = clamp(v('if_yrs'), 0, 60), ret = v('if_ret');
  const fv = fee => { const r = mRate(ret - fee); let b = init; for (let m = 0; m < Math.round(yrs * 12); m++) b = b * (1 + r) + mon; return b; };
  const f = [v('if_f1'), v('if_f2'), v('if_f3')].map(x => Math.max(0, x)), base = fv(0), vals = f.map(fv), dep = init + mon * Math.round(yrs * 12);
  const rows = [[t('r_ifDep'), MI(dep)], [t('r_ifNoFee'), MI(base)]];
  ['r_if1', 'r_if2', 'r_if3'].forEach((k, i) => { rows.push([t(k, {f: PC(f[i])}), MI(vals[i]), i === 0 ? 'key' : ''], [t('r_ifCost'), MI(base - vals[i])]); });
  const gap = vals[0] - Math.min(vals[1], vals[2]);
  return {hero: {label: t('r_ifHero', {y: N(yrs)}), value: MI(gap), sub: t('r_ifSub')}, rows, note: t('n_if'),
    split: {title: t('r_ifCostT'), items: [{name: t('r_if1', {f: PC(f[0])}), v: base - vals[0], cls: 'c-ink', fmt: MI(base - vals[0])},
      {name: t('r_if2', {f: PC(f[1])}), v: base - vals[1], cls: 'c-accent', fmt: MI(base - vals[1])}, {name: t('r_if3', {f: PC(f[2])}), v: base - vals[2], cls: 'c-warm', fmt: MI(base - vals[2])}]}};
}
/* --- child allowance and savings for every child (2026) --- */
function calcChildAllow(){
  const n = clamp(Math.round(v('ca_kids')), 0, 20), par = $('#ca_par').value === '1';
  let al = 0; for (let i = 1; i <= n; i++) al += i === 1 ? IL26B.ca1 : i <= 4 ? IL26B.ca2 : IL26B.ca5;
  const sv = n * IL26.childDep, pv = par ? sv : 0;
  return {hero: {label: t('r_caAl'), value: MI(al), sub: t('r_caSub', {n: MI(sv + pv)})},
    rows: [[t('r_caAl'), MI(al), 'key'], [t('r_caAlY'), MI(al * 12)], [t('r_caSv'), MI(sv)], [t('r_caPv'), MI(pv)], [t('r_caOut'), MI(al - pv)]],
    note: t('n_ca')};
}
/* --- old-age pension (2026) --- */
function calcOldAge(){
  const sex = $('#oa_sex').value, by = Math.round(v('oa_byear')), age = new Date().getFullYear() - by, yrs = Math.max(0, v('oa_yrs'));
  const sp = $('#oa_sp').value === '1', kids = clamp(Math.round(v('oa_kids')), 0, 2);
  const base = age >= 80 ? IL26B.oa80 : IL26B.oaBase, sen = Math.min(0.5, Math.floor(yrs) * 0.02), senAmt = IL26B.oaBase * sen;
  const total = base + senAmt + (sp ? IL26B.oaSpouse : 0) + kids * IL26B.oaChild;
  const warn = [];
  if (sex === 'm' && age < 67) warn.push(t('w_oaAgeM'));
  if (sex === 'f' && age < 62) warn.push(t('w_oaAgeF'));
  return {hero: {label: t('r_oaHero'), value: MI(total), sub: t('r_oaSub', {p: Math.round(sen * 100) + '%'})},
    rows: [[t('r_oaBase'), MI(base)], [t('r_oaSen', {p: Math.round(sen * 100) + '%'}), MI(senAmt)], [t('r_oaSp'), MI(sp ? IL26B.oaSpouse : 0)], [t('r_oaKids'), MI(kids * IL26B.oaChild)], [t('r_oaHero'), MI(total), 'key']],
    warn, note: t('n_oa')};
}
Object.assign(CALC, {workgrant: calcWorkGrant, reserve: calcReserve, pensfix: calcPensFix, mmf: calcMmf, invfees: calcInvFees, childallow: calcChildAllow, oldage: calcOldAge});
