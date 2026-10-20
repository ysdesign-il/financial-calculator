/* ---------- 13.22: trips and events – a trip budget with spending in the local currency, and an event budget ---------- */
const tvlE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var TVT = 'trip';
function tvD(){ const d = SET.tv && typeof SET.tv === 'object' ? SET.tv : (SET.tv = {}); if (!d.trip || typeof d.trip !== 'object') d.trip = {}; if (!d.ev || typeof d.ev !== 'object') d.ev = {}; if (!Array.isArray(d.ev.items)) d.ev.items = null; return d; }
const tvM = (x, c) => M(Math.round(isFinite(x) ? x : 0), 0, c || 'ILS');
const tvN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪]/g, '')); return isFinite(x) ? x : NaN; };
/* ---- the trip: a country, dates and a budget; spending goes into the expenses tool with the country and currency ---- */
function tvTripItems(){ const T0 = tvD().trip; if (!T0.cc || !T0.from) return []; const to = T0.to || '9999-12-31'; return expData().items.filter(it => (it.cc || 'IL') === T0.cc && it.date >= T0.from && it.date <= to); }
function tvTrip(v){
  const E = tvlE, T0 = tvD().trip, cur = EXP_COUNTRIES[T0.cc] || 'USD', ccs = Object.keys(EXP_COUNTRIES).filter(k => k !== 'IL').map(k => [k, ccName(k)]).sort((a, b) => a[1].localeCompare(b[1], lang));
  const L = tvTripItems(), spent = L.reduce((s, it) => s + expBase(it), 0), bud = tvN(T0.bud) || 0, f = rmParse(T0.from), to = rmParse(T0.to), days = f && to ? Math.max(1, Math.round((to - f) / 864e5) + 1) : 0, gone = f ? Math.min(days || 1, Math.max(1, Math.round((rmToday() - f) / 864e5) + 1)) : 0, left = bud - spent;
  v.innerHTML = `<p class="fine">${E(t('tv_intro'))}</p><div class="bk-grid">
    <label class="bk-f"><span>${E(t('tv_cc'))}</span><select data-tvk="cc"><option value="">—</option>${ccs.map(([k, n]) => `<option value="${k}"${T0.cc === k ? ' selected' : ''}>${flagOf(k)} ${E(n)}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('tv_bud'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-tvk="bud" value="${E(T0.bud || '')}" placeholder="8000"></label>
    <label class="bk-f"><span>${E(t('tv_from'))}</span><input type="date" data-tvk="from" value="${E(T0.from || '')}"></label><label class="bk-f"><span>${E(t('tv_to'))}</span><input type="date" data-tvk="to" value="${E(T0.to || '')}"></label></div>
    ${T0.cc && T0.from ? `<div class="bk-hero"><span>${E(flagOf(T0.cc) + ' ' + ccName(T0.cc))}${days ? ' · ' + E(t('tv_days', {n: days})) : ''}</span><b dir="ltr">${E(tvM(spent))}${bud ? ' / ' + E(tvM(bud)) : ''}</b><small>${E(bud ? (left >= 0 ? t('tv_left', {m: tvM(left), d: days && gone < days ? tvM(left / (days - gone + 1)) : '—'}) : t('tv_over', {m: tvM(-left)})) : t('tv_noBud'))} · ${E(t('tv_rate', {c: cur, r: N(fxConv(1, cur, 'ILS'), 3)}))}</small></div>
      <h3 class="ds-q">＋ ${E(t('tv_addH'))}</h3><div class="bk-grid"><label class="bk-f"><span>${E(t('tv_amt'))} (${cur})</span><input type="text" inputmode="decimal" dir="ltr" id="tv_amt" placeholder="0"></label><label class="bk-f"><span>${E(t('exp_cat'))}</span><select id="tv_cat">${EXP_CATS.map(([k, ic]) => `<option value="${k}"${k === 'food' ? ' selected' : ''}>${ic} ${E(t('ec_' + k))}</option>`).join('')}</select></label><label class="bk-f"><span>${E(t('exp_note'))}</span><input type="text" id="tv_note" maxlength="60" dir="auto"></label></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="tv_add">＋ ${E(t('tv_add'))}</button></div><p class="fine" id="tv_conv" aria-live="polite"></p>
      <ul class="rm-list">${L.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map(it => `<li class="rm-it"><div class="rm-ic" aria-hidden="true">${(EXP_CATS.find(c => c[0] === it.cat) || [, '📦'])[1]}</div><div class="rm-b"><b dir="auto">${E(it.note || t('ec_' + it.cat))}</b><span class="rm-w" dir="auto">${E(dLabel(it.date))} · ${E(M(it.oamt != null ? it.oamt : it.amt, 2, it.cur || cur))} · ≈ ${E(tvM(expBase(it)))}</span></div></li>`).join('') || `<li class="fine bk-empty">${E(t('tv_none'))}</li>`}</ul>` : `<p class="fine bk-empty">${E(t('tv_pick'))}</p>`}
    <p class="fine">${E(t('tv_note2'))}</p>`;
}
/* ---- an event budget ---- */
const TV_EV = [['venue', 0], ['photo', 9000], ['music', 6000], ['dress', 5000], ['flowers', 4000], ['rabbi', 1500], ['invites', 1500], ['other', 3000]];
function tvEvent(v){
  const E = tvlE, ev = tvD().ev; if (!ev.items) ev.items = TV_EV.map(([k, c]) => ({k, c}));
  const g = tvN(ev.guests) || 0, pp = tvN(ev.pp) || 0, gift = tvN(ev.gift) || 0, att = (tvN(ev.att) || 85) / 100, venue = g * att * pp, extra = ev.items.filter(x => x.k !== 'venue').reduce((s, x) => s + (tvN(x.c) || 0), 0), cost = venue + extra, gifts = g * att / 2 * gift, net = gifts - cost;
  v.innerHTML = `<p class="fine">${E(t('tv_evIntro'))}</p><div class="bk-grid">
    <label class="bk-f"><span>${E(t('tv_guests'))}</span><input type="text" inputmode="numeric" dir="ltr" data-tve="guests" value="${E(ev.guests || '')}" placeholder="300"></label>
    <label class="bk-f"><span>${E(t('tv_att'))} (%)</span><input type="text" inputmode="numeric" dir="ltr" data-tve="att" value="${E(ev.att || '')}" placeholder="85"></label>
    <label class="bk-f"><span>${E(t('tv_pp'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-tve="pp" value="${E(ev.pp || '')}" placeholder="350"></label>
    <label class="bk-f"><span>${E(t('tv_gift'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-tve="gift" value="${E(ev.gift || '')}" placeholder="800"></label></div>
    <h3 class="ds-q">${E(t('tv_extras'))}</h3><div class="bk-grid">${ev.items.filter(x => x.k !== 'venue').map((x, i) => `<label class="bk-f"><span>${E(t('tv_x_' + x.k))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-tvx="${x.k}" value="${E(x.c)}"></label>`).join('')}</div>
    <div id="tv_out" aria-live="polite">${g && pp ? `<div class="bk-hero"><span>${E(t(net >= 0 ? 'tv_evPlus' : 'tv_evMinus'))}</span><b dir="ltr">${E(tvM(Math.abs(net)))}</b><small>${E(t('tv_evSub', {c: tvM(cost), g: tvM(gifts), n: Math.round(g * att)}))}</small></div>
      <table class="bk-plan"><tbody><tr><th scope="row">${E(t('tv_x_venue'))}</th><td dir="ltr">${E(tvM(venue))}</td></tr><tr><th scope="row">${E(t('tv_extras'))}</th><td dir="ltr">${E(tvM(extra))}</td></tr><tr class="key"><th scope="row">${E(t('tv_perGuest'))}</th><td dir="ltr">${E(tvM(g * att ? cost / (g * att) : 0))}</td></tr><tr><th scope="row">${E(t('tv_breakEven'))}</th><td dir="ltr">${E(tvM(g * att ? cost / (g * att / 2) : 0))}</td></tr></tbody></table>` : `<p class="fine bk-empty">${E(t('fu_fill'))}</p>`}</div>
    <p class="fine">${E(t('tv_evNote'))} <button type="button" class="lg-a" data-go="eventgift">${E(t('in_open', {n: t('tab_eventgift')}))}</button></p>`;
}
function tvRender(){
  const root = $('#hr_travel'); if (!root) return; const E = tvlE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['trip', '✈️'], ['event', '🎉']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${TVT === k ? ' on' : ''}" aria-selected="${TVT === k}" data-tvtab="${k}">${ic} ${E(t('tv_t_' + k))}</button>`).join('')}</div><div id="tv_view"></div><p class="fine sl-priv">🔒 ${E(t('pic_priv'))}</p>`;
  (TVT === 'trip' ? tvTrip : tvEvent)($('#tv_view'));
}
let TV_T = null;
document.addEventListener('input', e => { const el = e.target; if (!el || !el.closest || !el.closest('#hr_travel')) return; const d = tvD();
  if (el.id === 'tv_amt'){ const a = tvN(el.value), cur = EXP_COUNTRIES[d.trip.cc] || 'USD', o = $('#tv_conv'); if (o) o.textContent = a > 0 ? '≈ ' + tvM(fxConv(a, cur, 'ILS')) : ''; return; }
  if (el.dataset.tvk && el.tagName !== 'SELECT' && el.type !== 'date'){ d.trip[el.dataset.tvk] = el.value; clearTimeout(TV_T); TV_T = setTimeout(() => { saveSet(); }, 300); return; }
  if (el.dataset.tve){ d.ev[el.dataset.tve] = el.value; } else if (el.dataset.tvx){ const x = d.ev.items.find(y => y.k === el.dataset.tvx); if (x) x.c = el.value; } else return;
  clearTimeout(TV_T); TV_T = setTimeout(() => { saveSet(); const f = document.activeElement && document.activeElement.dataset ? [document.activeElement.dataset.tve, document.activeElement.dataset.tvx] : []; tvRender(); const n = f[0] ? $(`[data-tve="${f[0]}"]`) : f[1] ? $(`[data-tvx="${f[1]}"]`) : null; if (n){ n.focus(); const L = n.value.length; try { n.setSelectionRange(L, L); } catch (er) {} } }, 400); });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.closest || !el.closest('#hr_travel')) return; if (el.dataset.tvk && (el.tagName === 'SELECT' || el.type === 'date' || el.dataset.tvk === 'bud')){ tvD().trip[el.dataset.tvk] = el.value; saveSet(); tvRender(); } });
document.addEventListener('click', e => { const t0 = e.target; if (!t0.closest || !t0.closest('#hr_travel')) return; let b;
  if ((b = t0.closest('[data-tvtab]'))){ TVT = b.dataset.tvtab; tvRender(); return; }
  if (t0.closest('#tv_add')){ const T0 = tvD().trip, a = tvN($('#tv_amt').value); if (!(a > 0)){ $('#tv_amt').focus(); return; } const cur = EXP_COUNTRIES[T0.cc] || 'USD', d = expData(), date = todayIso() >= T0.from && (!T0.to || todayIso() <= T0.to) ? todayIso() : T0.from;
    d.items.push({id: tId(), t: Date.now(), amt: Math.round(fxConv(a, cur, expCur()) * 100) / 100, bc: expCur(), oamt: Math.round(a * 100) / 100, cur, cat: $('#tv_cat').value, date, note: $('#tv_note').value.trim().slice(0, 60), pay: 'card', cc: T0.cc, city: '', rec: false}); toolsSave('fin-exp', d); tvRender(); toast(t('cm_added', {m: tvM(fxConv(a, cur, 'ILS'))})); } });
CALC.travel = () => null;
try { GS_SYN.travel = 'טיול חופשה חו״ל תקציב טיול מטבע מקומי אירוע חתונה בר מצווה תקציב אירוע עלות אירוע מנה travel trip vacation abroad budget event wedding budget سفر رحلة عطلة ميزانية مناسبة عرس'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindTv = svKind; svKind = function(id){ return id === 'travel' ? '' : svKindTv.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('travel'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('travel'); } catch (e) {}
{
  const actTv = activate; activate = function(id){ const r = actTv.apply(this, arguments); if (id === 'travel') tvRender(); return r; };
  const alTv = applyLang; applyLang = function(){ const r = alTv.apply(this, arguments); try { if (tab === 'travel') tvRender(); } catch (e) {} return r; };
  try { if (tab === 'travel') tvRender(); } catch (e) {}
}
