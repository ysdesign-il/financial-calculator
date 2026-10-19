/* ---------- 13.19: four new tools – electricity suppliers, a gift for an event, the real cost of a car, an arnona discount ----------
   Each keeps its own inputs on the phone (SET.nt[tool]); the published figures they use are dated in the texts. */
const ntE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const NT_TOOLS = ['elecsup', 'eventgift', 'carcost', 'arnona'];
function ntD(id){ const a = SET.nt && typeof SET.nt === 'object' ? SET.nt : (SET.nt = {}); return a[id] && typeof a[id] === 'object' ? a[id] : (a[id] = {}); }
const ntN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪%]/g, '')); return isFinite(x) ? x : NaN; };
const ntV = (id, k, def) => { const x = ntN(ntD(id)[k]); return isFinite(x) ? x : def; };
const ntM = (x, d) => M(isFinite(x) ? x : 0, d == null ? 0 : d, 'ILS');
const ntIn = (id, k, lab, ph, unit) => `<label class="bk-f"><span>${ntE(lab)}${unit ? ' (' + ntE(unit) + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" data-ntt="${id}" data-ntk="${k}" value="${ntE(ntD(id)[k] == null ? '' : ntD(id)[k])}" placeholder="${ntE(ph == null ? '' : ph)}"></label>`;
const ntSel = (id, k, lab, opts, def) => { const cur = ntD(id)[k] == null ? def : ntD(id)[k]; return `<label class="bk-f"><span>${ntE(lab)}</span><select data-ntt="${id}" data-ntk="${k}">${opts.map(([v, l]) => `<option value="${ntE(v)}"${String(cur) === String(v) ? ' selected' : ''}>${ntE(l)}</option>`).join('')}</select></label>`; };
const ntCk = (id, k, lab) => `<label class="prn-ck"><input type="checkbox" data-ntt="${id}" data-ntk="${k}"${ntD(id)[k] ? ' checked' : ''}> ${ntE(lab)}</label>`;
const ntRow = (a, b, key) => `<tr${key ? ' class="key"' : ''}><th scope="row">${ntE(a)}</th><td dir="auto">${ntE(b)}</td></tr>`;
const ntHero = (lab, val, sub) => `<div class="bk-hero"><span>${ntE(lab)}</span><b dir="auto">${ntE(val)}</b>${sub ? `<small>${ntE(sub)}</small>` : ''}</div>`;
const ntTip = (ic, h, p, k) => `<li class="bk-a${k ? ' bk-' + k : ''}"><span class="bk-ic" aria-hidden="true">${ic}</span><div><b>${ntE(h)}</b>${p ? `<p>${ntE(p)}</p>` : ''}</div></li>`;

/* ======== 1) electricity suppliers ======== */
/* published plans, checked October 2026: [supplier, kind, discount %, window, weekdays only, smart meter needed, note key]
   windows: all = all hours; day = 07–17; fam = 14–20; night = 23–07 */
const ES_PLANS = [['cellcom', 'fix', 7.5, 'all', true, false], ['electra', 'fix', 6.5, 'all', false, false], ['bezeq', 'fix', 6, 'all', false, false], ['amisragaz', 'fix', 6, 'all', false, false, 'es_nGas'],
  ['partner', 'fix', 5, 'all', false, false, 'es_nYears'], ['hot', 'fix', 5, 'all', false, false, 'es_nHot'], ['pazgaz', 'fix', 5, 'all', false, false],
  ['cellcom', 'day', 20, 'day', true, true], ['cellcom', 'fam', 18, 'fam', true, true], ['cellcom', 'night', 15, 'night', false, true],
  ['bezeq', 'day', 15, 'day', true, true], ['bezeq', 'night', 20, 'night', true, true], ['partner', 'day', 15, 'day', true, true], ['partner', 'night', 20, 'night', true, true],
  ['hot', 'day', 15, 'day', true, true], ['hot', 'night', 20, 'night', true, true]];
/* how a home uses electricity over the day: shares of night 23–07, 07–14, 14–17, 17–20, 20–23, and of weekends */
const ES_PROF = {fam: [22, 22, 12, 20, 24, 30], home: [20, 34, 18, 14, 14, 28], night: [45, 15, 8, 14, 18, 28], out: [26, 12, 8, 26, 28, 34]};
function esShares(){
  const d = ntD('elecsup'), p = d.prof || 'fam', base = ES_PROF[p] || ES_PROF.fam, c = p === 'custom' ? ['n', 'm', 'a', 'e', 'l', 'w'].map((k, i) => ntV('elecsup', 'p_' + k, base[i])) : base;
  const tot = c[0] + c[1] + c[2] + c[3] + c[4] || 1, f = c.slice(0, 5).map(x => x / tot), we = Math.min(100, Math.max(0, c[5])) / 100;
  return {night: f[0], day: f[1] + f[2], fam: f[2] + f[3], all: 1, we};
}
function esEff(pl, S){ const w = S[pl[3]]; return pl[2] / 100 * w * (pl[4] ? 1 - S.we : 1); }
function esRender(v){
  const E = ntE, d = ntD('elecsup'), prof = d.prof || 'fam';
  v.innerHTML = `<p class="fine">${E(t('es_intro'))}</p><div class="bk-grid">${ntIn('elecsup', 'kwh', t('es_kwh'), '600', 'kWh')}${ntIn('elecsup', 'tar', t('es_tar'), N(typeof IL26 === 'object' ? IL26.kwh : 0.64, 4), '₪')}</div>
    ${ntSel('elecsup', 'prof', t('es_prof'), [['fam', t('es_p_fam')], ['home', t('es_p_home')], ['night', t('es_p_night')], ['out', t('es_p_out')], ['custom', t('es_p_custom')]], 'fam')}
    ${prof === 'custom' ? `<div class="bk-grid">${[['n', '23–07'], ['m', '07–14'], ['a', '14–17'], ['e', '17–20'], ['l', '20–23']].map(([k, h]) => ntIn('elecsup', 'p_' + k, h, String(ES_PROF.fam[['n', 'm', 'a', 'e', 'l'].indexOf(k)]), '%')).join('')}${ntIn('elecsup', 'p_w', t('es_we'), '30', '%')}</div>` : ''}
    ${ntCk('elecsup', 'smart', t('es_smart'))}
    <div id="nt_out_elecsup" aria-live="polite"></div>
    <p class="fine">${E(t('es_note'))}</p>`;
  esOut();
}
function esOut(){
  const box = $('#nt_out_elecsup'); if (!box) return; const E = ntE, d = ntD('elecsup'), kwh = ntV('elecsup', 'kwh', 600), tar = ntV('elecsup', 'tar', typeof IL26 === 'object' ? IL26.kwh : 0.64), S = esShares(), cost = kwh * tar;
  const R = ES_PLANS.map(pl => ({pl, eff: esEff(pl, S), ok: !pl[5] || d.smart})).map(r => Object.assign(r, {save: cost * r.eff})).sort((a, b) => (b.ok - a.ok) || (b.save - a.save));
  const best = R.find(r => r.ok) || R[0], bestSmart = R.filter(r => r.pl[5]).sort((a, b) => b.save - a.save)[0];
  box.innerHTML = ntHero(t('es_best', {s: t('es_s_' + best.pl[0])}), ntM(best.save * 12) + ' / ' + t('es_yr'), t('es_bestSub', {p: t('es_k_' + best.pl[1]), e: N(best.eff * 100, 1), m: ntM(best.save, 0)}))
    + `<div class="bk-scroll"><table class="bk-plan es-t"><thead><tr><th scope="col">${E(t('es_plan'))}</th><th scope="col">${E(t('es_disc'))}</th><th scope="col">${E(t('es_eff'))}</th><th scope="col">${E(t('es_saveY'))}</th></tr></thead><tbody>${R.map(r => `<tr class="${r === best ? 'best' : ''}${r.ok ? '' : ' es-no'}"><th scope="row">${E(t('es_s_' + r.pl[0]))} · ${E(t('es_k_' + r.pl[1]))}<small><bdi dir="ltr">${E(t('es_w_' + r.pl[3]))}</bdi>${r.pl[4] ? ' · ' + E(t('es_wk')) : ''}${r.pl[5] ? ' · ' + E(t('es_needSmart')) : ''}${r.pl[6] ? ' · ' + E(t(r.pl[6])) : ''}</small></th><td dir="ltr">${N(r.pl[2], 1)}%</td><td dir="ltr">${N(r.eff * 100, 1)}%</td><td dir="ltr">${E(ntM(r.save * 12))}</td></tr>`).join('')}</tbody></table></div>
    <ol class="bk-adv">${!d.smart && bestSmart && bestSmart.save > best.save ? ntTip('📟', t('es_tSmart', {m: ntM((bestSmart.save - best.save) * 12)}), t('es_tSmartP'), 'move') : ''}${ntTip('🔁', t('es_tHow'), t('es_tHowP'))}${ntTip('ℹ️', t('es_tFix'), t('es_tFixP'))}</ol>`;
}

/* ======== 2) a gift for an event ======== */
/* rule-of-thumb from amounts published for 2026 (a single guest: large hall ~550–650 ₪, garden ~450–550, boutique ~400–500) */
const EG_VEN = {hall: 600, garden: 500, boutique: 450, home: 350}, EG_REL = {acq: 0.7, work: 0.75, friend: 0.9, close: 1, rel: 1.05, sib: 1.7}, EG_EV = {wed: 1, bar: 0.85, brit: 0.6, bday: 0.4};
function egRender(v){
  v.innerHTML = `<p class="fine">${ntE(t('eg_intro'))}</p><div class="bk-grid">
    ${ntSel('eventgift', 'ev', t('eg_ev'), Object.keys(EG_EV).map(k => [k, t('eg_e_' + k)]), 'wed')}${ntSel('eventgift', 'rel', t('eg_rel'), Object.keys(EG_REL).map(k => [k, t('eg_r_' + k)]), 'friend')}
    ${ntSel('eventgift', 'who', t('eg_who'), [['one', t('eg_w_one')], ['two', t('eg_w_two')], ['kids', t('eg_w_kids')]], 'two')}${ntIn('eventgift', 'kids', t('eg_kids'), '2')}
    ${ntSel('eventgift', 'ven', t('eg_ven'), Object.keys(EG_VEN).map(k => [k, t('eg_v_' + k)]), 'hall')}${ntSel('eventgift', 'reg', t('eg_reg'), [['center', t('eg_g_center')], ['per', t('eg_g_per')]], 'center')}
    ${ntSel('eventgift', 'day', t('eg_day'), [['we', t('eg_d_we')], ['wk', t('eg_d_wk')]], 'we')}${ntSel('eventgift', 'bud', t('eg_bud'), [['avg', t('eg_b_avg')], ['tight', t('eg_b_tight')], ['comf', t('eg_b_comf')]], 'avg')}</div>
    <div id="nt_out_eventgift" aria-live="polite"></div><p class="fine">${ntE(t('eg_note'))}</p>`;
  egOut();
}
function egOut(){
  const box = $('#nt_out_eventgift'); if (!box) return; const d = ntD('eventgift'), g = (k, def) => d[k] == null ? def : d[k];
  const base = EG_VEN[g('ven', 'hall')] || 600, who = g('who', 'two'), kids = Math.max(0, Math.round(ntV('eventgift', 'kids', 2)));
  let a = base * (EG_REL[g('rel', 'friend')] || 1) * (who === 'one' ? 1 : 1.5) * (EG_EV[g('ev', 'wed')] || 1) * (g('reg', 'center') === 'per' ? 0.85 : 1) * (g('day', 'we') === 'wk' ? 0.95 : 1) * ({tight: 0.85, comf: 1.12}[g('bud', 'avg')] || 1);
  if (who === 'kids') a += kids * 150 * (EG_EV[g('ev', 'wed')] || 1);
  const r50 = x => Math.max(50, Math.round(x / 50) * 50), r18 = x => Math.max(18, Math.round(x / 18) * 18), lo = r50(a * 0.9), hi = r50(a * 1.1);
  box.innerHTML = ntHero(t('eg_rec'), ntM(r50(a)), t('eg_range', {a: ntM(lo), b: ntM(hi)}))
    + `<table class="bk-plan"><tbody>${ntRow(t('eg_chai'), ntM(r18(a)) + ' (' + N(r18(a) / 18, 0) + ' × 18)')}${ntRow(t('eg_perGuest'), ntM(a / (who === 'one' ? 1 : who === 'two' ? 2 : 2 + kids)) + ' ' + t('eg_perHead'))}</tbody></table>
    <ol class="bk-adv">${ntTip('💡', t('eg_t1'), t('eg_t1P'))}${ntTip('📲', t('eg_t2'), t('eg_t2P'))}</ol>`;
}

/* ======== 3) the real cost of a car ======== */
function ccRender(v){
  let km0 = 1250, l100 = 7, pr = typeof IL26 === 'object' ? IL26.fuel95 : 8;
  try { const S = fuLogStats(); if (S && isFinite(S.kmMonth)) km0 = Math.round(S.kmMonth); const k = fuCons(); if (isFinite(k) && k > 0) l100 = Math.round(1000 / k) / 10; pr = fuPrice(); } catch (e) {}
  v.innerHTML = `<p class="fine">${ntE(t('cc_intro'))}</p>
    <h3 class="ds-q">${ntE(t('cc_hCar'))}</h3><div class="bk-grid">${ntIn('carcost', 'val', t('cc_val'), '90000', '₪')}${ntIn('carcost', 'dep', t('cc_dep'), '12', '%')}${ntIn('carcost', 'km', t('cc_km'), String(km0), 'km')}${ntIn('carcost', 'l100', t('cc_l100'), N(l100, 1))}${ntIn('carcost', 'fp', t('cc_fp'), N(pr, 2), '₪')}</div>
    <h3 class="ds-q">${ntE(t('cc_hYear'))}</h3><div class="bk-grid">${ntIn('carcost', 'ins', t('cc_ins'), '5500', '₪')}${ntIn('carcost', 'lic', t('cc_lic'), '1400', '₪')}${ntIn('carcost', 'test', t('cc_test'), '150', '₪')}${ntIn('carcost', 'svc', t('cc_svc'), '2500', '₪')}${ntIn('carcost', 'tire', t('cc_tire'), '800', '₪')}</div>
    <h3 class="ds-q">${ntE(t('cc_hMonth'))}</h3><div class="bk-grid">${ntIn('carcost', 'park', t('cc_park'), '150', '₪')}${ntIn('carcost', 'toll', t('cc_toll'), '80', '₪')}${ntIn('carcost', 'loan', t('cc_loan'), '0', '₪')}${ntIn('carcost', 'opp', t('cc_opp'), '4', '%')}</div>
    <div id="nt_out_carcost" aria-live="polite"></div><p class="fine">${ntE(t('cc_note'))}</p>`;
  ccOut();
}
function ccOut(){
  const box = $('#nt_out_carcost'); if (!box) return; let km0 = 1250, l100 = 7, pr = typeof IL26 === 'object' ? IL26.fuel95 : 8;
  try { const S = fuLogStats(); if (S && isFinite(S.kmMonth)) km0 = S.kmMonth; const k = fuCons(); if (isFinite(k) && k > 0) l100 = 100 / k; pr = fuPrice(); } catch (e) {}
  const g = (k, d) => Math.max(0, ntV('carcost', k, d)), val = g('val', 90000), dep = g('dep', 12) / 100, km = g('km', km0), fuel = km / 100 * g('l100', l100) * g('fp', pr);
  const depM = val * dep / 12, oppM = val * g('opp', 4) / 100 / 12, yearM = (g('ins', 5500) + g('lic', 1400) + g('test', 150) + g('svc', 2500) + g('tire', 800)) / 12, monthM = g('park', 150) + g('toll', 80) + g('loan', 0);
  const tot = depM + oppM + yearM + monthM + fuel, parts = [['cc_pDep', depM], ['cc_pFuel', fuel], ['cc_pYear', yearM], ['cc_pMonth', monthM], ['cc_pOpp', oppM]].sort((a, b) => b[1] - a[1]);
  let v5 = val, c5 = 0; for (let y = 0; y < 5; y++){ const dv = v5 * dep; c5 += dv + v5 * g('opp', 4) / 100 + (yearM + monthM + fuel) * 12; v5 -= dv; }
  box.innerHTML = ntHero(t('cc_tot'), ntM(tot) + ' / ' + t('bk_mo'), t('cc_sub', {k: km ? ntM(tot / km, 2) : '—', y: ntM(tot * 12)}))
    + `<table class="bk-plan"><tbody>${parts.map(([k, x]) => ntRow(t(k), ntM(x) + ' · ' + Math.round(x / (tot || 1) * 100) + '%')).join('')}${ntRow(t('cc_5y'), ntM(c5), true)}${ntRow(t('cc_val5'), ntM(v5))}</tbody></table>
    <ol class="bk-adv">${ntTip('💡', t('cc_t1', {p: t(parts[0][0])}), t('cc_t1P'))}${ntTip('🚌', t('cc_t2'), t('cc_t2P', {m: ntM(tot)}))}</ol>`;
}

/* ======== 4) an arnona discount ======== */
/* by the national arnona-discount regulations, as municipalities publish them: [key, discount %, area limit m² (0 = all)] – only the single highest discount applies */
const AR_CATS = [['oldInc', 100, 100], ['senior', 25, 100], ['disab75', 80, 150], ['disab90', 40, 150], ['blind', 80, 0], ['care', 70, 0], ['childDis', 33, 100], ['single', 20, 0], ['soldier', 100, 70], ['oleh', 90, 100], ['resCmd', 25, 100], ['reserve', 5, 0]];
/* income test – monthly household income ceilings published for 2025 (by household size): 80% / 60% / 40% (7+ persons: 90% / 70% / 50%) */
const AR_INC = {1: [3218, 3701, 4184], 2: [4826, 5550, 6274], 3: [5599, 6439, 7279], 4: [6371, 7327, 8282], 5: [8155, 9378, 10601], 6: [9939, 11429, 12920], 7: [11722, 13481, 15239], 8: [13506, 15532, 17558], 9: [15290, 17583, 19877]};
function arRender(v){
  v.innerHTML = `<p class="fine">${ntE(t('ar_intro'))}</p><div class="bk-grid">${ntIn('arnona', 'amt', t('ar_amt'), '6000', '₪')}${ntIn('arnona', 'area', t('ar_area'), '90', 'm²')}${ntIn('arnona', 'ppl', t('ar_ppl'), '3')}${ntIn('arnona', 'inc', t('ar_inc'), '9000', '₪')}</div>
    <fieldset class="bk-flags"><legend>${ntE(t('ar_who'))}</legend>${AR_CATS.map(c => ntCk('arnona', 'c_' + c[0], t('ar_c_' + c[0]))).join('')}</fieldset>
    <div id="nt_out_arnona" aria-live="polite"></div><p class="fine">${ntE(t('ar_note'))}</p>`;
  arOut();
}
function arIncPct(ppl, inc){
  if (!(inc >= 0) || !(ppl >= 1)) return 0; const n = Math.min(9, Math.round(ppl)), L = AR_INC[n], big = n >= 7, P = big ? [90, 70, 50] : [80, 60, 40];
  for (let i = 0; i < 3; i++) if (inc <= L[i]) return P[i]; return 0;
}
function arOut(){
  const box = $('#nt_out_arnona'); if (!box) return; const d = ntD('arnona'), amt = ntV('arnona', 'amt', 0), area = ntV('arnona', 'area', 0), ppl = ntV('arnona', 'ppl', NaN), inc = ntV('arnona', 'inc', NaN);
  const val = (pct, lim) => amt * pct / 100 * (lim && area > lim ? lim / area : 1);
  const L = AR_CATS.filter(c => d['c_' + c[0]]).map(c => ({k: 'ar_c_' + c[0], pct: c[1], lim: c[2], save: val(c[1], c[2])}));
  const ip = isFinite(ppl) && isFinite(inc) ? arIncPct(ppl, inc) : 0; if (ip) L.push({k: 'ar_incT', pct: ip, lim: 150, save: val(ip, 150)});
  L.sort((a, b) => b.save - a.save);
  if (!amt){ box.innerHTML = `<p class="fine bk-empty">${ntE(t('fu_fill'))}</p>`; return; }
  if (!L.length){ box.innerHTML = `<ol class="bk-adv">${ntTip('🔎', t('ar_none'), t('ar_noneP'))}</ol>`; return; }
  const b = L[0];
  box.innerHTML = ntHero(t('ar_best'), ntM(b.save) + ' / ' + t('es_yr'), t('ar_bestSub', {n: t(b.k), p: b.pct, m: ntM(b.save / 12)}))
    + `<table class="bk-plan"><thead><tr><th scope="col">${ntE(t('ar_kind'))}</th><th scope="col">${ntE(t('ar_pct'))}</th><th scope="col">${ntE(t('es_saveY'))}</th></tr></thead><tbody>${L.map(x => `<tr${x === b ? ' class="best"' : ''}><th scope="row">${ntE(t(x.k))}${x.lim ? `<small>${ntE(t('ar_upTo', {n: x.lim}))}</small>` : ''}</th><td dir="ltr">${x.pct}%</td><td dir="ltr">${ntE(ntM(x.save))}</td></tr>`).join('')}</tbody></table>
    <ol class="bk-adv">${L.length > 1 ? ntTip('☝️', t('ar_one'), t('ar_oneP')) : ''}${ntTip('📝', t('ar_how'), t('ar_howP'))}</ol>`;
}

/* ---- shared wiring ---- */
const NT_R = {elecsup: [esRender, esOut], eventgift: [egRender, egOut], carcost: [ccRender, ccOut], arnona: [arRender, arOut]};
function ntRender(id){ const v = $('#nt_root_' + id); if (v && NT_R[id]) NT_R[id][0](v); }
let NT_T = null;
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.dataset.ntt || el.type === 'checkbox' || el.tagName === 'SELECT') return; ntD(el.dataset.ntt)[el.dataset.ntk] = el.value; const id = el.dataset.ntt; clearTimeout(NT_T); NT_T = setTimeout(() => { saveSet(); NT_R[id][1](); }, 180); });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.dataset || !el.dataset.ntt || !(el.type === 'checkbox' || el.tagName === 'SELECT')) return; const id = el.dataset.ntt, k = el.dataset.ntk;
  ntD(id)[k] = el.type === 'checkbox' ? el.checked : el.value; saveSet(); if (k === 'prof'){ ntRender(id); const n = $(`[data-ntt="${id}"][data-ntk="prof"]`); if (n) n.focus(); } else NT_R[id][1](); });
NT_TOOLS.forEach(id => { CALC[id] = () => null; });
try { GS_SYN.elecsup = 'ספק חשמל ספקי חשמל הנחה בחשמל רפורמת החשמל מונה חכם סלקום אנרגיה בזק אנרגיה פרטנר הוט אלקטרה אמישראגז פזגז electricity supplier power discount smart meter مزود كهرباء خصم عداد ذكي';
  GS_SYN.eventgift = 'מתנה לחתונה כמה לתת בחתונה צ׳ק לחתונה בר מצווה בת מצווה ברית מתנה לאירוע wedding gift how much to give bar mitzvah هدية عرس كم أعطي';
  GS_SYN.carcost = 'עלות רכב אחזקת רכב כמה עולה רכב בחודש ירידת ערך ביטוח טסט טיפולים car cost of ownership monthly car cost depreciation كلفة السيارة صيانة';
  GS_SYN.arnona = 'ארנונה הנחה בארנונה זכאות הנחה מבחן הכנסה אזרח ותיק נכות חייל עולה חדש הורה יחיד arnona municipal tax discount أرنونا خصم'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindNt = svKind; svKind = function(id){ return NT_TOOLS.includes(id) ? '' : svKindNt.apply(this, arguments); }; }
try { NT_TOOLS.forEach(id => { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push(id); if (Array.isArray(EX_SKIP)) EX_SKIP.push(id); }); } catch (e) {}
{ const aiStNt = aiScreenText; aiScreenText = function(id){ const s = aiStNt.apply(this, arguments); if (!NT_TOOLS.includes(id)) return s; const o = $('#nt_out_' + id); return s + '\n' + (o ? o.innerText.slice(0, 1500) : '') + '\nGeneral information only; figures are estimates.'; }; }
{
  const actNt = activate; activate = function(id){ const r = actNt.apply(this, arguments); if (NT_TOOLS.includes(id)) ntRender(id); return r; };
  const alNt = applyLang; applyLang = function(){ const r = alNt.apply(this, arguments); try { if (NT_TOOLS.includes(tab)) ntRender(tab); } catch (e) {} return r; };
  try { if (NT_TOOLS.includes(tab)) ntRender(tab); } catch (e) {}
}
