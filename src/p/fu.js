/* ---------- 13.17: fuel calculator – by litres, with a fill-up log ----------
   Trip cost, filling the tank, a log of fill-ups (real consumption), monthly and yearly cost,
   comparisons (two cars, a cheaper station, 98 vs 95) and unit conversions. Everything stays on the phone. */
const fuE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fuN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪]/g, '')); return isFinite(x) ? x : NaN; };
const fuM = (x, d) => M(isFinite(x) ? x : 0, d == null ? 2 : d, 'ILS');
const FU_FULL = 0.26;                    // full-service surcharge per litre (Ministry of Energy, October 2026)
const FU_TABS = [['trip', '🛣️'], ['fill', '⛽'], ['log', '📒'], ['cost', '📅'], ['cmp', '⚖️'], ['conv', '🔁']];
var FUT = 'trip';
function fuD(){ const d = SET.fu && typeof SET.fu === 'object' ? SET.fu : (SET.fu = {}); if (!d.t || typeof d.t !== 'object') d.t = {}; if (!Array.isArray(d.log)) d.log = []; if (!d.kind) d.kind = '95'; if (!d.unit) d.unit = 'kpl'; return d; }
const fu95 = () => typeof IL26 === 'object' && isFinite(+IL26.fuel95) ? +IL26.fuel95 : 8;
/* the price per litre: what was typed, or the regulated 95 price (+ full service) */
function fuPrice(){ const d = fuD(), p = fuN(d.price); return isFinite(p) && p > 0 ? p : fu95() + (d.full ? FU_FULL : 0); }
/* consumption in km per litre, whatever unit it was typed in */
const fuKpl = (v, u) => { const x = fuN(v); return !(x > 0) ? NaN : u === 'l100' ? 100 / x : x; };
function fuCons(){ const d = fuD(), k = fuKpl(d.cons, d.unit); if (isFinite(k)) return k; const L = fuLogStats(); return L && isFinite(L.kpl) ? L.kpl : 14; }
const fuConsTxt = k => isFinite(k) && k > 0 ? t('fu_kplV', {v: N(k, 1)}) + ' · ' + t('fu_l100V', {v: N(100 / k, 1)}) : '—';
const fuTv = (id, def) => { const v = fuN(fuD().t[id]); return isFinite(v) ? v : def; };
const fuIn = (id, lab, ph, unit, extra) => `<label class="bk-f"><span>${fuE(lab)}${unit ? ' (' + fuE(unit) + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" id="${id}" data-fut="1" value="${fuE(fuD().t[id] == null ? '' : fuD().t[id])}" placeholder="${fuE(ph == null ? '' : ph)}"${extra || ''}></label>`;
const fuRow = (a, b, key) => `<tr${key ? ' class="key"' : ''}><th scope="row">${fuE(a)}</th><td dir="auto">${fuE(b)}</td></tr>`;
const fuHero = (lab, val, sub) => `<div class="bk-hero"><span>${fuE(lab)}</span><b dir="auto">${fuE(val)}</b>${sub ? `<small>${fuE(sub)}</small>` : ''}</div>`;
const fuTip = (ic, h, p, k) => `<li class="bk-a${k ? ' bk-' + k : ''}"><span class="bk-ic" aria-hidden="true">${ic}</span><div><b>${fuE(h)}</b>${p ? `<p>${fuE(p)}</p>` : ''}</div></li>`;

/* the car: fuel type, service, price and consumption – shared by all the tabs */
function fuCarHTML(){
  const d = fuD(), E = fuE, reg = d.kind === '95';
  return `<fieldset class="bk-acc fu-car"><legend>🚗 ${E(t('fu_car'))}</legend>
    <div class="bk-row"><select id="fu_kind" aria-label="${E(t('fu_kind'))}">${['95', '98', 'diesel'].map(k => `<option value="${k}"${d.kind === k ? ' selected' : ''}>${E(t('fu_k_' + k))}</option>`).join('')}</select>
    <select id="fu_full" aria-label="${E(t('fu_service'))}"><option value="0"${d.full ? '' : ' selected'}>${E(t('fu_self'))}</option><option value="1"${d.full ? ' selected' : ''}>${E(t('fu_fullS', {m: fuM(FU_FULL)}))}</option></select></div>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('fu_price'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="fu_price" value="${E(d.price == null ? '' : d.price)}" placeholder="${E(N(fu95() + (d.full ? FU_FULL : 0), 2))}"></label>
    <label class="bk-f fu-wide"><span>${E(t('fu_cons'))}</span><span class="fu-cu"><input type="text" inputmode="decimal" dir="ltr" id="fu_cons" value="${E(d.cons == null ? '' : d.cons)}" placeholder="${E(d.unit === 'l100' ? '7' : '14')}"><select id="fu_unit" aria-label="${E(t('fu_unit'))}"><option value="kpl"${d.unit === 'kpl' ? ' selected' : ''}>${E(t('fu_u_kpl'))}</option><option value="l100"${d.unit === 'l100' ? ' selected' : ''}>${E(t('fu_u_l100'))}</option></select></span></label></div>
    <p class="fine" id="fu_carNote">${E(reg ? t('fu_regNote', {m: fuM(fu95())}) : t('fu_freeNote'))}${fuLogStats() && !isFinite(fuKpl(d.cons, d.unit)) ? ' ' + E(t('fu_fromLog')) : ''}</p></fieldset>`;
}
function fuRender(){
  const root = $('#fu_root'); if (!root) return; const E = fuE;
  root.innerHTML = `<p class="fine">${E(t('fu_intro'))}</p>
    <div class="ds-chips bk-tabs" role="tablist" aria-label="${E(t('tab_fuelcalc'))}">${FU_TABS.map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${FUT === k ? ' on' : ''}" aria-selected="${FUT === k}" data-futab="${k}">${ic} ${E(t('fu_tab_' + k))}</button>`).join('')}</div>
    ${FUT === 'conv' ? '' : fuCarHTML()}<div id="fu_view"></div>
    <p class="fine sl-priv">🔒 ${E(t('fu_priv'))}</p>`;
  fuView();
}
function fuView(){
  const v = $('#fu_view'); if (!v) return;
  ({trip: fuTrip, fill: fuFill, log: fuLog, cost: fuCost, cmp: fuCmp, conv: fuConv})[FUT](v);
}
function fuOut(){ const f = ({trip: fuTripOut, fill: fuFillOut, log: fuLogOut, cost: fuCostOut, cmp: fuCmpOut, conv: fuConvOut})[FUT]; if (f) f(); }

/* ---- 1) a trip ---- */
function fuTrip(v){
  const E = fuE, d = fuD();
  v.innerHTML = `<div class="bk-grid">${fuIn('tr_km', t('fu_trKm'), '120', 'km')}${fuIn('tr_ppl', t('fu_trPpl'), '1')}${fuIn('tr_toll', t('fu_trToll'), '0', '₪')}${fuIn('tr_park', t('fu_trPark'), '0', '₪')}</div>
    <label class="prn-ck"><input type="checkbox" id="tr_rt" data-fuck="1"${d.t.tr_rt ? ' checked' : ''}> ${E(t('fu_trRt'))}</label>
    <div id="fu_out" aria-live="polite"></div>`;
  fuTripOut();
}
function fuTripOut(){
  const box = $('#fu_out'); if (!box) return; const E = fuE, d = fuD(), km0 = Math.max(0, fuTv('tr_km', 0)), km = km0 * (d.t.tr_rt ? 2 : 1);
  if (!km){ box.innerHTML = `<p class="fine bk-empty">${E(t('fu_fill'))}</p>`; return; }
  const k = fuCons(), p = fuPrice(), L = km / k, fuel = L * p, extra = Math.max(0, fuTv('tr_toll', 0)) + Math.max(0, fuTv('tr_park', 0)), tot = fuel + extra, ppl = Math.max(1, Math.round(fuTv('tr_ppl', 1)));
  box.innerHTML = fuHero(t('fu_trCost'), fuM(tot, 0), t('fu_trSub', {l: N(L, 1), km: N(km, 0)}))
    + `<table class="bk-plan fu-t"><tbody>${fuRow(t('fu_liters'), N(L, 1) + ' L')}${fuRow(t('fu_fuelCost'), fuM(fuel))}${extra ? fuRow(t('fu_extra'), fuM(extra)) : ''}${fuRow(t('fu_perKm'), fuM(tot / km))}${ppl > 1 ? fuRow(t('fu_perPerson', {n: ppl}), fuM(tot / ppl), true) : ''}${fuRow(t('fu_consUsed'), fuConsTxt(k))}${fuRow(t('fu_priceUsed'), fuM(p) + ' / L')}</tbody></table>`;
}

/* ---- 2) filling the tank ---- */
function fuFill(v){
  const E = fuE, d = fuD(), lv = d.t.fi_lv == null ? 25 : +d.t.fi_lv;
  v.innerHTML = `<div class="bk-grid">${fuIn('fi_tank', t('fu_fiTank'), '50', 'L')}${fuIn('fi_bud', t('fu_fiBud'), '200', '₪')}</div>
    <div class="field"><label for="fi_lv">${E(t('fu_fiLv'))} <b id="fi_lvv">${lv}%</b></label><input type="range" id="fi_lv" min="0" max="100" step="5" value="${lv}" class="fu-range"></div>
    <div class="bk-grid">${fuIn('fi_lit', t('fu_fiLit'), '30', 'L')}</div>
    <div id="fu_out" aria-live="polite"></div>`;
  fuFillOut();
}
function fuFillOut(){
  const box = $('#fu_out'); if (!box) return; const d = fuD(), k = fuCons(), p = fuPrice(), tank = Math.max(1, fuTv('fi_tank', 50)), lv = Math.min(100, Math.max(0, d.t.fi_lv == null ? 25 : +d.t.fi_lv));
  const need = tank * (1 - lv / 100), bud = fuTv('fi_bud', NaN), lit = fuTv('fi_lit', NaN);
  let h = fuHero(t('fu_fiToFull'), fuM(need * p, 0), t('fu_fiToFullS', {l: N(need, 1)}))
    + `<table class="bk-plan fu-t"><tbody>${fuRow(t('fu_fiRangeNow'), N(tank * lv / 100 * k, 0) + ' km')}${fuRow(t('fu_fiRangeFull'), N(tank * k, 0) + ' km', true)}${fuRow(t('fu_fiTankCost'), fuM(tank * p, 0))}`;
  if (bud > 0){ const bl = Math.min(bud / p, need); h += fuRow(t('fu_fiBudL', {m: fuM(bud, 0)}), N(bl, 1) + ' L · +' + N(bl * k, 0) + ' km', true) + (bud / p > need + 0.05 ? fuRow(t('fu_fiOver'), fuM(need * p, 0)) : ''); }
  if (lit > 0) h += fuRow(t('fu_fiLitM', {l: N(lit, 1)}), fuM(lit * p) + ' · +' + N(lit * k, 0) + ' km');
  box.innerHTML = h + '</tbody></table>';
}

/* ---- 3) the fill-up log: the real consumption, from one full tank to the next ---- */
function fuLogStats(){
  const L = fuD().log.filter(x => fuN(x.odo) > 0 && fuN(x.l) > 0).slice().sort((a, b) => fuN(a.odo) - fuN(b.odo)); if (L.length < 2) return null;
  const fulls = L.map((x, i) => x.full ? i : -1).filter(i => i >= 0); let km = 0, lit = 0;
  const seg = {}; for (let s = 0; s + 1 < fulls.length; s++){ const a = fulls[s], b = fulls[s + 1], dk = fuN(L[b].odo) - fuN(L[a].odo); let dl = 0; for (let j = a + 1; j <= b; j++) dl += fuN(L[j].l); if (dk > 0 && dl > 0){ km += dk; lit += dl; seg[L[b].id] = dk / dl; } }
  const first = L[0], last = L[L.length - 1], dist = fuN(last.odo) - fuN(first.odo), money = L.slice(1).reduce((s, x) => s + fuLogSum(x), 0), litAll = L.slice(1).reduce((s, x) => s + fuN(x.l), 0);
  const days = Math.max(1, (new Date(last.d) - new Date(first.d)) / 864e5);
  return {kpl: lit > 0 ? km / lit : (dist > 0 && litAll > 0 ? dist / litAll : NaN), seg, perKm: dist > 0 ? money / dist : NaN, month: isFinite(days) && days >= 7 ? money / days * 30.4 : NaN, kmMonth: isFinite(days) && days >= 7 ? dist / days * 30.4 : NaN, dist, money, n: L.length, exact: lit > 0};
}
const fuLogSum = x => { const s = fuN(x.sum); if (s > 0) return s; const p = fuN(x.p); return p > 0 ? p * fuN(x.l) : fuN(x.l) * fuPrice(); };
function fuLog(v){
  const E = fuE, d = fuD(), today = new Date().toISOString().slice(0, 10), last = d.log.length ? d.log[d.log.length - 1] : null;
  v.innerHTML = `<p class="fine">${E(t('fu_lgIntro'))}</p>
    <fieldset class="bk-acc"><legend>➕ ${E(t('fu_lgAdd'))}</legend><div class="bk-grid">
      <label class="bk-f"><span>${E(t('fu_lgDate'))}</span><input type="date" id="lg_d" value="${today}" max="${today}"></label>
      <label class="bk-f"><span>${E(t('fu_lgOdo'))} (km)</span><input type="text" inputmode="numeric" dir="ltr" id="lg_odo" placeholder="${E(last ? String(Math.round(fuN(last.odo) + 500)) : '45000')}"></label>
      <label class="bk-f"><span>${E(t('fu_lgL'))} (L)</span><input type="text" inputmode="decimal" dir="ltr" id="lg_l" placeholder="40"></label>
      <label class="bk-f"><span>${E(t('fu_lgSum'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="lg_sum" placeholder="${E(N(40 * fuPrice(), 0))}"></label></div>
      <label class="prn-ck"><input type="checkbox" id="lg_full" checked> ${E(t('fu_lgFull'))}</label>
      <div class="btnrow"><button type="button" class="gold-btn" id="lg_add">＋ ${E(t('fu_lgSave'))}</button></div></fieldset>
    <div id="fu_out" aria-live="polite"></div>`;
  fuLogOut();
}
function fuLogOut(){
  const box = $('#fu_out'); if (!box) return; const E = fuE, d = fuD(), S = fuLogStats();
  if (!d.log.length){ box.innerHTML = `<p class="fine bk-empty">${E(t('fu_lgEmpty'))}</p>`; return; }
  const L = d.log.slice().sort((a, b) => fuN(b.odo) - fuN(a.odo));
  box.innerHTML = (S && isFinite(S.kpl) ? fuHero(t('fu_lgReal'), t('fu_kplV', {v: N(S.kpl, 1)}), t('fu_l100V', {v: N(100 / S.kpl, 1)}) + (S.exact ? '' : ' · ' + t('fu_lgApprox')))
      + `<table class="bk-plan fu-t"><tbody>${isFinite(S.perKm) ? fuRow(t('fu_perKm'), fuM(S.perKm)) : ''}${isFinite(S.month) ? fuRow(t('fu_lgMonth'), fuM(S.month, 0), true) : ''}${isFinite(S.kmMonth) ? fuRow(t('fu_lgKmMonth'), N(S.kmMonth, 0) + ' km') : ''}${fuRow(t('fu_lgTotal', {n: S.n}), fuM(S.money, 0) + ' · ' + N(S.dist, 0) + ' km')}</tbody></table>
      <div class="btnrow"><button type="button" class="btn" id="lg_use">✓ ${E(t('fu_lgUse'))}</button></div>`
    : `<p class="fine">${E(t('fu_lgMore'))}</p>`)
    + `<h3 class="ds-q">${E(t('fu_lgList'))}</h3><ul class="fu-log">${L.map(x => { const k = S && S.seg[x.id]; return `<li><div><b dir="ltr">${E(N(fuN(x.odo), 0))} km</b> · ${E(fuDate(x.d))}${x.full ? '' : ` · <span class="fine">${E(t('fu_lgPart'))}</span>`}<br><span dir="ltr">${E(N(fuN(x.l), 1))} L · ${E(fuM(fuLogSum(x)))}${fuN(x.l) > 0 ? ' · ' + E(fuM(fuLogSum(x) / fuN(x.l))) + '/L' : ''}</span>${k ? ` · <b>${E(t('fu_kplV', {v: N(k, 1)}))}</b>` : ''}</div><button type="button" class="lg-a" data-lgdel="${E(x.id)}" aria-label="${E(t('fu_lgDel', {d: fuDate(x.d)}))}">${E(t('cv_rm'))}</button></li>`; }).join('')}</ul>
    <div class="btnrow"><button type="button" class="mv" id="lg_csv">⬇️ ${E(t('fu_lgCsv'))}</button><button type="button" class="mv" id="lg_clear">🗑️ ${E(t('fu_lgClear'))}</button></div>`;
}
const fuDate = s => { try { const [y, m, dd] = String(s).split('-'); return y && m && dd ? `${+dd}.${+m}.${y}` : String(s || ''); } catch (e) { return ''; } };

/* ---- 4) a month and a year of driving ---- */
function fuCost(v){
  const S = fuLogStats(), km0 = S && isFinite(S.kmMonth) ? Math.round(S.kmMonth) : 1250;
  v.innerHTML = `<div class="bk-grid">${fuIn('co_km', t('fu_coKm'), String(km0), 'km')}${fuIn('co_rise', t('fu_coRise'), '0.30', '₪')}</div><div id="fu_out" aria-live="polite"></div>`;
  fuCostOut();
}
function fuCostOut(){
  const box = $('#fu_out'); if (!box) return; const S = fuLogStats(), km = Math.max(0, fuTv('co_km', S && isFinite(S.kmMonth) ? S.kmMonth : 1250)), k = fuCons(), p = fuPrice(), rise = fuTv('co_rise', 0.3);
  const Lm = km / k, m = Lm * p, y = m * 12, better = y - y / 1.1;
  box.innerHTML = fuHero(t('fu_coMonth'), fuM(m, 0), t('fu_coSub', {y: fuM(y, 0), l: N(Lm, 0)}))
    + `<table class="bk-plan fu-t"><tbody>${fuRow(t('fu_coLy'), N(Lm * 12, 0) + ' L')}${fuRow(t('fu_coKmY'), N(km * 12, 0) + ' km')}${fuRow(t('fu_perKm'), fuM(p / k))}${fuRow(t('fu_coRiseR', {m: fuM(rise)}), '+' + fuM(Lm * 12 * rise, 0) + ' / ' + t('fu_yr'), true)}${fuRow(t('fu_coAgora'), '+' + fuM(Lm * 12 * 0.1, 0) + ' / ' + t('fu_yr'))}</tbody></table>
    <h3 class="ds-q">${fuE(t('fu_tipsH'))}</h3><ol class="bk-adv">${fuTip('💡', t('fu_coBetter', {y: fuM(better, 0)}), t('fu_coBetterP'), 'ok')}${['tire', 'speed', 'ac', 'load', 'idle', 'service'].map(x => fuTip({tire: '🛞', speed: '🐢', ac: '❄️', load: '🧳', idle: '⏱️', service: '🔧'}[x], t('fu_tip_' + x), t('fu_tip_' + x + 'P'))).join('')}</ol>`;
}

/* ---- 5) comparisons ---- */
function fuCmp(v){
  const E = fuE, d = fuD(), mode = d.t.cm_mode || 'station';
  v.innerHTML = `<div class="ds-chips" role="radiogroup" aria-label="${E(t('fu_tab_cmp'))}">${['station', 'cars', 'oct'].map(m => `<button type="button" role="radio" class="ds-chip${m === mode ? ' on' : ''}" aria-checked="${m === mode}" data-fucm="${m}">${E(t('fu_cm_' + m))}</button>`).join('')}</div>
    <div class="bk-grid">${mode === 'station' ? fuIn('cs_p2', t('fu_csP2'), N(Math.max(0, fuPrice() - 0.3), 2), '₪') + fuIn('cs_l', t('fu_csL'), '40', 'L') + fuIn('cs_km', t('fu_csKm'), '6', 'km')
      : mode === 'cars' ? fuIn('cc_a', t('fu_ccA'), N(fuCons(), 1), t('fu_u_kpl')) + fuIn('cc_b', t('fu_ccB'), '20', t('fu_u_kpl')) + fuIn('cc_km', t('fu_ccKm'), '15000', 'km') + fuIn('cc_y', t('fu_ccY'), '5')
      : fuIn('co_p98', t('fu_coP98'), N(fuPrice() + 0.6, 2), '₪') + fuIn('co_l', t('fu_coL'), '1500', 'L')}</div>
    <div id="fu_out" aria-live="polite"></div>`;
  fuCmpOut();
}
function fuCmpOut(){
  const box = $('#fu_out'); if (!box) return; const d = fuD(), mode = d.t.cm_mode || 'station', p = fuPrice(), k = fuCons();
  if (mode === 'station'){
    const p2 = fuTv('cs_p2', Math.max(0, p - 0.3)), L = Math.max(0, fuTv('cs_l', 40)), km = Math.max(0, fuTv('cs_km', 6)), gain = (p - p2) * L, cost = km / k * p2, net = gain - cost;
    box.innerHTML = fuHero(t(net > 0 ? 'fu_csWorth' : 'fu_csNot'), fuM(Math.abs(net)), t('fu_csSub', {g: fuM(gain), c: fuM(cost)}))
      + `<ol class="bk-adv">${fuTip(net > 0 ? '✅' : '✋', t(net > 0 ? 'fu_csYes' : 'fu_csNo', {km: N(gain > 0 ? gain / (p2 / k) : 0, 1)}), t('fu_csP'), net > 0 ? 'ok' : 'warn')}</ol>`;
  } else if (mode === 'cars'){
    const a = Math.max(0.1, fuTv('cc_a', k)), b = Math.max(0.1, fuTv('cc_b', 20)), km = Math.max(0, fuTv('cc_km', 15000)), y = Math.max(1, fuTv('cc_y', 5)), ca = km / a * p, cb = km / b * p, df = ca - cb;
    box.innerHTML = fuHero(t('fu_ccDiff'), fuM(Math.abs(df) * y, 0), t('fu_ccSub', {y: N(y, 0), m: fuM(Math.abs(df) / 12, 0)}))
      + `<table class="bk-plan fu-t"><tbody>${fuRow(t('fu_ccCostA'), fuM(ca, 0) + ' / ' + t('fu_yr'))}${fuRow(t('fu_ccCostB'), fuM(cb, 0) + ' / ' + t('fu_yr'))}${fuRow(t(df >= 0 ? 'fu_ccBsaves' : 'fu_ccAsaves'), fuM(Math.abs(df), 0) + ' / ' + t('fu_yr'), true)}</tbody></table>`;
  } else {
    const p98 = fuTv('co_p98', p + 0.6), L = Math.max(0, fuTv('co_l', 1500)), extra = (p98 - p) * L;
    box.innerHTML = fuHero(t('fu_coExtra'), fuM(extra, 0) + ' / ' + t('fu_yr'), t('fu_coExtraS', {m: fuM(p98 - p)})) + `<ol class="bk-adv">${fuTip('ℹ️', t('fu_coOctH'), t('fu_coOctP'))}</ol>`;
  }
}

/* ---- 6) conversions ---- */
const FU_CU = {kpl: [1, 'fu_u_kpl'], l100: [0, 'fu_u_l100'], mpgus: [2.35215, 'fu_u_mpgus'], mpguk: [2.82481, 'fu_u_mpguk']};
const fuToKpl = (x, u) => !(x > 0) ? NaN : u === 'l100' ? 100 / x : x / FU_CU[u][0];
function fuConv(v){
  const E = fuE, d = fuD(), u = d.t.cv_u || 'kpl';
  v.innerHTML = `<h3 class="ds-q">${E(t('fu_cvCons'))}</h3><div class="bk-grid">${fuIn('cv_v', t('fu_cvVal'), '15')}<label class="bk-f"><span>${E(t('fu_unit'))}</span><select id="cv_u" data-fusel="1">${Object.keys(FU_CU).map(k => `<option value="${k}"${k === u ? ' selected' : ''}>${E(t(FU_CU[k][1]))}</option>`).join('')}</select></label></div>
    <div id="fu_out" aria-live="polite"></div>
    <h3 class="ds-q">${E(t('fu_cvVol'))}</h3><div class="bk-grid">${fuIn('cv_l', t('fu_cvL'), '40', 'L')}${fuIn('cv_g', t('fu_cvG'), '', 'US gal')}</div><div id="fu_out2" aria-live="polite"></div>`;
  fuConvOut();
}
function fuConvOut(){
  const box = $('#fu_out'), b2 = $('#fu_out2'); if (!box) return; const d = fuD(), u = d.t.cv_u || 'kpl', k = fuToKpl(fuTv('cv_v', NaN), u);
  box.innerHTML = isFinite(k) ? `<table class="bk-plan fu-t"><tbody>${Object.keys(FU_CU).filter(x => x !== u).map(x => fuRow(t(FU_CU[x][1]), N(x === 'l100' ? 100 / k : k * FU_CU[x][0], 2))).join('')}</tbody></table>` : '';
  if (b2){ const L = fuTv('cv_l', NaN), G = fuTv('cv_g', NaN), rows = [];
    if (L > 0) rows.push(fuRow(N(L, 1) + ' L', N(L / 3.78541, 2) + ' US gal · ' + N(L / 4.54609, 2) + ' UK gal'));
    if (G > 0) rows.push(fuRow(N(G, 2) + ' US gal', N(G * 3.78541, 2) + ' L'));
    b2.innerHTML = rows.length ? `<table class="bk-plan fu-t"><tbody>${rows.join('')}</tbody></table>` : ''; }
}

/* what the assistant sees on this screen */
function fuAiText(){
  const d = fuD(), S = fuLogStats();
  return `Fuel calculator. Fuel: ${d.kind}${d.full ? ', full service' : ', self-service'}; price used ${N(fuPrice(), 2)} ILS/L (regulated 95 price now ${N(fu95(), 2)}); consumption used ${N(fuCons(), 1)} km/L.`
    + (S ? ` Fill-up log: ${S.n} fill-ups, ${isFinite(S.kpl) ? 'real consumption ' + N(S.kpl, 1) + ' km/L, ' : ''}${isFinite(S.month) ? 'about ' + Math.round(S.month) + ' ILS a month, ' : ''}${isFinite(S.kmMonth) ? Math.round(S.kmMonth) + ' km a month' : ''}.` : '')
    + ' Help with fuel costs and saving fuel in plain words. General information only.';
}
{ const aiStFu = aiScreenText; aiScreenText = function(id){ const s = aiStFu.apply(this, arguments); return id === 'fuelcalc' ? s + '\n' + fuAiText() : s; }; }
{ const aiChFu = aiChipKeys; aiChipKeys = function(id){ return id === 'fuelcalc' ? ['fu_c1', 'fu_c2', 'fu_c3'] : aiChFu.apply(this, arguments); }; }

/* events */
let FU_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#fu_root')) return; const d = fuD();
  if (el.id === 'fu_price') d.price = el.value; else if (el.id === 'fu_cons') d.cons = el.value;
  else if (el.id === 'fi_lv'){ d.t.fi_lv = +el.value; const o = $('#fi_lvv'); if (o) o.textContent = el.value + '%'; }
  else if (el.dataset.fut) d.t[el.id] = el.value; else return;
  clearTimeout(FU_T); FU_T = setTimeout(() => { saveSet(); fuOut(); }, 180);
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#fu_root')) return; const d = fuD();
  if (el.id === 'fu_kind'){ d.kind = el.value; if (el.value !== '95' && !(fuN(d.price) > 0)) toast(t('fu_freeNote')); }
  else if (el.id === 'fu_full') d.full = el.value === '1';
  else if (el.id === 'fu_unit'){ const k = fuKpl(d.cons, d.unit); d.unit = el.value; if (isFinite(k)) d.cons = String(Math.round((el.value === 'l100' ? 100 / k : k) * 10) / 10); }
  else if (el.dataset.fuck) d.t[el.id] = el.checked;
  else if (el.dataset.fusel) d.t[el.id] = el.value;
  else return;
  saveSet();
  if (el.id === 'fu_kind' || el.id === 'fu_full' || el.id === 'fu_unit'){ const id = el.id; fuRender(); const n = $('#' + id); if (n) n.focus(); } else fuOut();
});
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#fu_root')) return; const d = fuD(); let b;
  if ((b = t0.closest('[data-futab]'))){ FUT = b.dataset.futab; fuRender(); const n = $(`#fu_root [data-futab="${FUT}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-fucm]'))){ d.t.cm_mode = b.dataset.fucm; saveSet(); fuView(); const n = $(`#fu_root [data-fucm="${d.t.cm_mode}"]`); if (n) n.focus(); return; }
  if (t0.closest('#lg_add')){
    const odo = fuN($('#lg_odo').value), l = fuN($('#lg_l').value), sum = fuN($('#lg_sum').value), dt = $('#lg_d').value || new Date().toISOString().slice(0, 10);
    if (!(odo > 0) || !(l > 0)){ toast(t('fu_lgNeed')); ($('#lg_odo').value ? $('#lg_l') : $('#lg_odo')).focus(); return; }
    const prev = d.log.filter(x => fuN(x.odo) >= odo); if (prev.length && prev.some(x => fuN(x.odo) === odo)){ toast(t('fu_lgDup')); return; }
    d.log.push({id: Date.now().toString(36), d: dt, odo: String(odo), l: String(l), sum: sum > 0 ? String(sum) : '', full: $('#lg_full').checked});
    if (d.log.length > 300) d.log.splice(0, d.log.length - 300);
    saveSet(); fuRender(); toast(t('fu_lgSaved')); const n = $('#lg_odo'); if (n) n.focus(); return;
  }
  if ((b = t0.closest('[data-lgdel]'))){ d.log = d.log.filter(x => x.id !== b.dataset.lgdel); saveSet(); fuRender(); return; }
  if (t0.closest('#lg_use')){ const S = fuLogStats(); if (S && isFinite(S.kpl)){ d.cons = String(Math.round((d.unit === 'l100' ? 100 / S.kpl : S.kpl) * 10) / 10); saveSet(); fuRender(); toast(t('fu_lgUsed')); } return; }
  if (t0.closest('#lg_clear')){ if (!confirm(t('fu_lgClearQ'))) return; d.log = []; saveSet(); fuRender(); return; }
  if (t0.closest('#lg_csv')){
    const rows = [['date', 'odometer_km', 'litres', 'total_ils', 'price_per_l', 'full_tank']].concat(d.log.slice().sort((a, b) => fuN(a.odo) - fuN(b.odo)).map(x => [x.d, fuN(x.odo), fuN(x.l), Math.round(fuLogSum(x) * 100) / 100, Math.round(fuLogSum(x) / fuN(x.l) * 1000) / 1000, x.full ? 1 : 0]));
    fileSave(new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], {type: 'text/csv'}), 'fuel-log.csv', 'text/csv').then(r => toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'))).catch(() => toast(t('pdf_fail')));
  }
});
CALC.fuelcalc = () => null;
try { GS_SYN.fuelcalc = 'דלק בנזין סולר ליטר ליטרים תדלוק מילוי מיכל צריכת דלק קילומטר לליטר עלות נסיעה מחיר דלק 95 98 יומן תדלוקים fuel petrol gasoline diesel litre liter fill up tank consumption km per litre mpg trip cost fuel log وقود بنزين سولار لتر تعبئة خزان استهلاك كلفة رحلة'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindFu = svKind; svKind = function(id){ return id === 'fuelcalc' ? '' : svKindFu.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('fuelcalc'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('fuelcalc'); } catch (e) {}
{
  const actFu = activate; activate = function(id){ const r = actFu.apply(this, arguments); if (id === 'fuelcalc') fuRender(); return r; };
  const alFu = applyLang; applyLang = function(){ const r = alFu.apply(this, arguments); try { if (tab === 'fuelcalc') fuRender(); } catch (e) {} return r; };
  try { if (tab === 'fuelcalc') fuRender(); } catch (e) {}
}
