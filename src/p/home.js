/* ================= home + bottom nav + sliders ================= */
const ICO = {
  coin: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.4"/><circle cx="17" cy="17" r="2.4"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>'
};
const UNIT_ICO = {cur:'coin', ils:'coin', '%':'pct', yrs:'cal', mo:'cal'};
const RANGES = {
  v_amount:[0,100000,100], s_pension:[0,20,.5], e_rev:[0,2000000,5000], r_rent:[0,30000,100],
  l_amount:[0,5000000,10000], l_rate:[0,15,.1], l_years:[1,40,1],
  m_price:[0,10000000,50000], m_down:[0,5000000,25000],
  c_init:[0,1000000,1000], c_monthly:[0,50000,100], c_rate:[0,20,.1], c_years:[1,50,1], c_goal:[0,10000000,10000],
  y_start:[0,1000000,1000], y_rate:[0,30,.1], y_dep:[0,50000,100],
  d_price:[1,1000,1], d_shares:[1,10000,10], d_dps:[0,100,.1], d_growth:[0,20,.5], d_years:[1,40,1]
};
const BOTTOM = ['home','compound','mortgage','salary','settings'];
function rangeFill(r){
  const p = (r.value - r.min) / (r.max - r.min) * 100;
  r.style.setProperty('--p', clamp(p, 0, 100) + '%');
}
function homePanelHTML(){
  const tile = id => `<button type="button" class="tile" data-go="${id}">${ICON[id]}<span data-i="tab_${id}"></span></button>`;
  return `<section class="panel panel-home" id="panel-home" role="tabpanel" aria-labelledby="tab-home" hidden>
    <div class="dz-ban" id="dzBan" aria-hidden="true"><span class="dz-brand dz-o">ORBIT</span><span class="dz-brand dz-a">AURUM</span><span class="dz-kick dz-o" data-i="dz_orbitKick"></span><span class="dz-kick dz-a" data-i="dz_aurumKick"></span><span class="dz-tag dz-o" data-i="dz_orbitTag"></span><span class="dz-tag dz-a" data-i="dz_aurumTag"></span><span class="dz-art dz-x"></span><span class="dz-brand dz-x" id="dzXb"></span><span class="dz-kick dz-x" id="dzXk"></span><span class="dz-tag dz-x" id="dzXt"></span></div>
    <h2 class="home-hello" data-i="home_hello"></h2>
    <p class="home-sub" data-i="home_sub"></p>
    <div class="hclock" id="hclock"></div>
    <p class="home-user" id="homeUser" hidden></p>
    <div class="hhero" id="hh"></div>
    <div id="hrem"></div>
    <h3 class="sec-t" id="hs_t" data-i="home_mine" hidden></h3>
    <div class="mine" id="hs"></div>
    <div class="mk-head"><h3 class="sec-t" data-i="home_market"></h3>
      <div class="mk-acts"><button type="button" class="rf-btn" id="hm_rf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/></svg><span data-i="rf_all"></span></button>
      <label class="mk-sw"><input type="checkbox" id="fx_live"><span class="mk-knob" aria-hidden="true"></span><span data-i="fx_live"></span></label></div></div>
    <p class="mk-st" id="fx_st" aria-live="polite"></p>
    <div class="mkt" id="hm"></div>
    <p class="fine mkt-note" id="hm_n"></p>
    <h3 class="sec-t" data-i="home_popular"></h3>
    <div class="tchips" id="tchips"></div>
    <div class="tiles" id="tiles"></div>
    <div class="goal"><div><h3 data-i="home_goal_t"></h3><p data-i="home_goal_s"></p>
      <button type="button" class="gold-btn" data-go="compound" data-mode="dep" data-i="home_goal_b"></button></div>
      <svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="40" fill="none" stroke="#F2C45A" stroke-width="3" opacity=".8"/><circle cx="48" cy="48" r="26" fill="none" stroke="#F2C45A" stroke-width="3" opacity=".6"/><circle cx="48" cy="48" r="12" fill="#F2C45A"/><path d="M48 48L86 10M86 10h-12M86 10v12" stroke="#4F8CFF" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg></div>
  </section>`;
}
const DASH_SKIP = ['home', 'settings', 'assist', 'percent', 'expenses', 'clients'];
function touch(id){
  if (!id || DASH_SKIP.includes(id) || !CALC[id]) return;
  TOUCHED = [id].concat(TOUCHED.filter(x => x !== id)).slice(0, 12);
}
function dashResult(id){
  const keep = cur;
  try { cur = effCur(id) || baseCur || 'ILS'; const r = CALC[id](); return r && r.hero ? r : null; }
  catch (e) { return null; }
  finally { cur = keep; }
}
function sparkSVG(vals){
  const pts = vals.filter(x => isFinite(x));
  if (pts.length < 2) return '';
  const mx = Math.max(...pts), mn = Math.min(0, ...pts), W = 200, H = 100, span = (mx - mn) || 1;
  const xy = pts.map((b, i) => [i / (pts.length - 1) * W, H - 6 - (b - mn) / span * (H - 16)]);
  const d = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2C45A" stop-opacity=".45"/><stop offset="1" stop-color="#F2C45A" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${W} ${H} L0 ${H}Z" fill="url(#sg)"/><path d="${d}" fill="none" stroke="#FFD97A" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`;
}
function chartTotals(ch){
  if (!ch || !ch.layers || !ch.layers.length) return [];
  const n = Math.max(...ch.layers.map(l => (l.values || []).length));
  const out = [];
  for (let i = 0; i < n; i++) out.push(ch.layers.reduce((s, l) => s + (+(l.values || [])[i] || 0), 0));
  return out;
}
const hmTime = () => new Intl.DateTimeFormat(locOf(), {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date());
function renderMarket(){
  const box = $('#hm'); if (!box) return;
  const fx = (a, b) => RATES[a] && RATES[b] ? RATES[b] / RATES[a] : NaN;
  const dOnly = u => { try { return new Intl.DateTimeFormat(locOf(), {dateStyle:'medium', timeZone:'UTC'}).format(new Date(u * 1000)); } catch (e) { return ''; } };
  const liveS = t('mk_liveAt', {t: hmTime()});
  const tOnly = u => { try { const d = new Date(u * 1000), same = d.toDateString() === new Date().toDateString(); return new Intl.DateTimeFormat(locOf(), same ? {hour: '2-digit', minute: '2-digit'} : {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(d); } catch (e) { return ''; } };
  const fxS = META.live ? liveS : META.mkt ? t('mk_mktAt', {t: tOnly(META.unix)}) : META.official ? t('mk_official', {d: dOnly(META.unix)}) : t('mk_asof', {d: dOnly(META.unix)}), cd = dOnly(META.cunix);
  const btc = RATES.BTC ? 1 / RATES.BTC : NaN;
  const cards = [
    ['mk_usd', N(fx('USD', 'ILS'), null, 4) + ' ₪', fxS, fx('USD', 'ILS')],
    ['mk_eur', N(fx('EUR', 'ILS'), null, 4) + ' ₪', fxS, fx('EUR', 'ILS')],
    ['mk_btc', '$' + N(btc, null, 0), META.cryptoLive ? liveS : t('mk_asof', {d: cd}), btc],
    ['mk_boi', PC(MKT.boi), t('mk_boi_s', {d: MKT.boiDate, n: MKT.boiNext})],
    ['mk_prime', PC(MKT.boi + 1.5), t('mk_prime_s')],
    ['mk_cpi', PC(MKT.cpi), t('mk_cpi_s', {m: MKT.cpiMonth})]
  ];
  const prev = renderMarket.prev || {};
  box.innerHTML = cards.map(c => {
    const raw = c[3], p = prev[c[0]];
    const cls = raw != null && p != null && raw !== p ? (raw > p ? ' up' : ' down') : '';
    return `<div class="mk${cls}"><span class="mk-l">${t(c[0])}</span><b class="num">${c[1]}</b><small>${c[2]}</small></div>`;
  }).join('');
  renderMarket.prev = {}; cards.forEach(c => { if (c[3] != null) renderMarket.prev[c[0]] = c[3]; });
  const n = $('#hm_n'); if (n) n.textContent = t('mk_note');
}
function calcHome(){
  const items = [];
  TOUCHED.forEach(id => { const r = dashResult(id); if (r) items.push({id, r}); });
  const hh = $('#hh'), hs = $('#hs'), ht = $('#hs_t');
  if (items.length){
    const top = items[0], r = top.r;
    hh.classList.remove('empty');
    hh.innerHTML = `<div class="l">${t('tab_' + top.id)} · ${strip(r.hero.label)}</div><div class="v num">${r.hero.value}</div>
      <div class="s">${r.hero.sub ? strip(r.hero.sub) + '<br>' : ''}<span class="live-dot"></span>${t('home_live', {t: hmTime()})}</div>
      ${sparkSVG(chartTotals(r.chart))}
      <button type="button" class="hh-go" data-go="${top.id}" data-i="home_open">${t('home_open')}</button>`;
    const rest = items.slice(1);
    ht.hidden = !rest.length;
    hs.innerHTML = rest.map(({id, r}) => `<button type="button" class="mine-c" data-go="${id}">${ICON[id] || ''}
      <span class="mine-t">${t('tab_' + id)}</span><b class="num">${r.hero.value}</b><small>${strip(r.hero.label)}</small></button>`).join('');
  } else {
    hh.classList.add('empty');
    hh.innerHTML = `<div class="l">${t('home_empty_t')}</div><div class="s">${t('home_empty_s')}</div>
      <button type="button" class="gold-btn hh-start" data-go="compound">${t('home_empty_b')}</button>`;
    ht.hidden = true; hs.innerHTML = '';
  }
  const rem = $('#hrem');
  if (rem) rem.innerHTML = items.length && SET.remember !== '1'
    ? `<p class="home-rem">${t('home_rem')} <button type="button" class="as-go" id="home_rem">${t('home_rem_b')}</button></p>` : '';
  renderMarket();
  return null;
}

function assistPanelHTML(){
  return `<section class="panel" id="panel-assist" role="tabpanel" aria-labelledby="tab-assist" hidden>
    <div class="as-box"><input id="as_q" type="search" autocomplete="off" data-ia="as_ph" aria-label="search">
      <button type="button" class="gold-btn" id="as_ask" data-i="as_ask"></button></div>
    <div class="as-engrow"><div class="seg as-eng" id="as_eng" role="group" data-ia="f_aiEngine"></div><span class="fine" id="as_engnow"></span></div>
    <div class="as-chips" id="as_chips"></div>
    <div class="tiles" id="as_res"></div>
    <div class="as-log" id="as_log" aria-live="polite"></div>
    <p class="hint" data-i="as_note"></p>
  </section>`;
}
