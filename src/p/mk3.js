/* ---------- 12.7: the live TradingView board on the markets screen (no outside links) ----------
   Nothing loads from those sites until you tap to show it (they see your address and may set cookies); the choice is remembered.
   Inside the Claude app outside widgets cannot load, so there you get buttons that open the sites. */
/* symbols the free embeddable board actually streams (broker feeds, not exchange-licensed data). [symbol, name shown when it is a stand-in] */
const TV_SYM = {spx: ['OANDA:SPX500USD'], ndx: ['OANDA:NAS100USD'], dji: ['OANDA:US30USD'], rut: ['OANDA:US2000USD'], dxy: ['TVC:DXY'],
  ftse: ['OANDA:UK100GBP'], dax: ['OANDA:DE30EUR'], stoxx: ['OANDA:EU50EUR'], cac: ['OANDA:FR40EUR'], ibex: ['OANDA:ESPIXEUR'], aex: ['OANDA:NL25EUR'], smi: ['OANDA:CH20CHF'],
  nikkei: ['OANDA:JP225USD'], hsi: ['OANDA:HK33HKD'], ssec: ['OANDA:CN50USD', 'tv_cn50'], nifty: ['OANDA:IN50USD'], asx: ['OANDA:AU200AUD'],
  gold: ['OANDA:XAUUSD'], silver: ['OANDA:XAGUSD'], platinum: ['OANDA:XPTUSD'], palladium: ['OANDA:XPDUSD'], copper: ['OANDA:XCUUSD'], brent: ['OANDA:BCOUSD'], wti: ['OANDA:WTICOUSD'], natgas: ['OANDA:NATGASUSD'],
  wheat: ['OANDA:WHEATUSD'], corn: ['OANDA:CORNUSD'], soy: ['OANDA:SOYBNUSD'], sugar: ['OANDA:SUGARUSD']};
const TV_FX = [['FX_IDC:USDILS', 'USD/ILS'], ['FX_IDC:EURILS', 'EUR/ILS'], ['FX_IDC:GBPILS', 'GBP/ILS'], ['OANDA:EURUSD', 'EUR/USD'], ['OANDA:USDJPY', 'USD/JPY'], ['BITSTAMP:BTCUSD', 'Bitcoin'], ['BITSTAMP:ETHUSD', 'Ethereum']];
const tvLang = () => { const l = document.documentElement.lang || 'he'; return l === 'he' ? 'he_IL' : l === 'ar' ? 'ar_AE' : 'en'; };
const tvDark = () => document.documentElement.dataset.theme === 'dark';      // set by the theme itself – no style recalculation
const tvE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* a TradingView widget, loaded privately: our own frame straight to their widget page, with no cookies (a fresh, throw-away
   storage every time where the browser supports it), no referrer (they are not told which site it is on) and no script of theirs on our page */
function tvWidget(host, name, cfg){
  host.innerHTML = '';
  const c = Object.assign({locale: tvLang(), colorTheme: tvDark() ? 'dark' : 'light', isTransparent: true, width: '100%'}, cfg);
  const f = document.createElement('iframe');
  f.setAttribute('credentialless', ''); f.credentialless = true;
  f.referrerPolicy = 'no-referrer'; f.setAttribute('referrerpolicy', 'no-referrer');
    f.loading = 'lazy'; f.title = t('tv_t'); f.className = 'tv-frame';
  f.style.cssText = 'width:100%;border:0;display:block;height:' + (c.height || 400) + 'px';
  f.src = 'https://www.tradingview-widget.com/embed-widget/' + name + '/?locale=' + encodeURIComponent(c.locale) + '#' + encodeURIComponent(JSON.stringify(c));
  host.appendChild(f);
  const cr = document.createElement('div'); cr.className = 'tv-cr fine'; cr.textContent = t('tv_by') + (('credentialless' in HTMLIFrameElement.prototype) ? ' · ' + t('tv_noCookie') : ''); host.appendChild(cr);
}
function tvOverviewCfg(){
  const S = typeof ixShown === 'function' ? ixShown() : IX_DEF, sym = k => ({s: TV_SYM[k][0], d: TV_SYM[k][1] ? t(TV_SYM[k][1]) : IX_COM.includes(k) ? ixName(k).replace(/\s*\(.*\)$/, '') : ixName(k)});
  const pick = S.filter(k => TV_SYM[k]).length >= 3 ? S : IX_MK.filter(k => TV_SYM[k]);      // too few of the picked ones stream here → show all that do
  const idx = pick.filter(k => TV_SYM[k] && !IX_COM.includes(k)).map(sym), com = pick.filter(k => TV_SYM[k] && IX_COM.includes(k)).map(sym);
  const tabs = [];
  const U = (typeof ixUserList === 'function' ? ixUserList() : []).filter(c => S.includes(c.k)).map(c => {
    const sym = c.kind === 'fx' ? 'FX_IDC:' + (c.sym === 'ILS=' ? 'USDILS' : /^[A-Z]{3}=$/.test(c.sym) ? (['EUR', 'GBP', 'AUD', 'NZD'].includes(c.sym.slice(0, 3)) ? c.sym.slice(0, 3) + 'USD' : 'USD' + c.sym.slice(0, 3)) : c.sym.replace('=', '')) : c.kind === 'crypto' ? 'CRYPTO:' + c.sym.replace('.CM=', '') + 'USD' : c.sym;
    return {s: sym, d: c.n}; });
  if (U.length) tabs.push({title: '⭐ ' + t('ix_gMine'), symbols: U, originalTitle: 'Mine'});
  if (idx.length) tabs.push({title: t('ix_gMkt'), symbols: idx, originalTitle: 'Indices'});
  if (com.length) tabs.push({title: t('ix_gCom'), symbols: com, originalTitle: 'Commodities'});
  tabs.push({title: t('tv_fx'), symbols: TV_FX.map(([s, d]) => ({s, d})), originalTitle: 'Forex'});
  return {dateRange: '1D', showChart: true, height: 560, showSymbolLogo: true, showFloatingTooltip: true, plotLineColorGrowing: '#1f9d55', plotLineColorFalling: '#d64545', tabs};
}
function tvBoxHTML(){
  const on = SET.tvOn === '1';
  if (IN_CLAUDE) return `<h4 class="ix-g">📺 ${tvE(t('tv_t'))}</h4><p class="fine">${tvE(t('tv_inClaude'))}</p>`;
  if (typeof PRIV !== 'undefined' && PRIV) return `<h4 class="ix-g">📺 ${tvE(t('tv_t'))}</h4><p class="fine">🔒 ${tvE(t('tv_priv'))}</p>`;
  return `<h4 class="ix-g">📺 ${tvE(t('tv_t'))}</h4><p class="fine">${tvE(t(on ? 'tv_hOn' : 'tv_h'))}</p>
    <div class="btnrow"><button type="button" class="${on ? 'btn' : 'gold-btn'}" id="tv_tog">${tvE(t(on ? 'tv_hide' : 'tv_show'))}</button></div>
    <div id="tv_ov" class="tv-ov"${on ? '' : ' hidden'}></div>${on ? tvMissNote() : ''}`;
}
function tvMissNote(){ const S = typeof ixShown === 'function' ? ixShown() : IX_DEF, miss = S.filter(k => !TV_SYM[k] && !(typeof IX_USER !== 'undefined' && IX_USER.includes(k))); return miss.length ? `<p class="fine">${tvE(t('tv_miss', {n: miss.map(ixName).join(', ')}))}</p>` : ''; }
var TVX = {sig: ''};
function tvMount(){
  const hm = $('#hmx'); if (!hm) return;
  let box = $('#tvx'); if (!box){ box = document.createElement('div'); box.id = 'tvx'; box.className = 'tvx'; hm.parentNode.insertBefore(box, hm.nextSibling); TVX.sig = ''; }
  /* rebuild only when something it depends on changed — the price board above refreshes every 15 seconds, the widget must not */
  const sig = [document.documentElement.lang, SET.tvOn, typeof PRIV !== 'undefined' && PRIV, tvDark(), typeof ixShown === 'function' ? ixShown().join(',') : ''].join('|');
  if (sig === TVX.sig) return; TVX.sig = sig;
  box.innerHTML = tvBoxHTML();
  if (!IN_CLAUDE && !(typeof PRIV !== 'undefined' && PRIV) && SET.tvOn === '1'){ const ov = $('#tv_ov'); if (ov) tvWidget(ov, 'market-overview', tvOverviewCfg()); }
}
{
  const ixBoardTv = ixBoard;
  ixBoard = function(){ const r = ixBoardTv.apply(this, arguments); try { tvMount(); } catch (e) {} return r; };
  try { tvMount(); } catch (e) {}
}
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#tv_tog')){ SET.tvOn = SET.tvOn === '1' ? '0' : '1'; saveSet(); TVX.sig = ''; tvMount(); return; }

});

/* ---------- full private mode: the switch in Settings → Security, and a note on the markets screen ---------- */
function pvSetRender(){
  const cat = $('.set-cat[data-cat="security"]'); if (!cat) return; let s = $('#pv_sec');
  if (!s){ cat.insertAdjacentHTML('afterbegin', `<section class="set-sec" id="pv_sec"></section>`); s = $('#pv_sec'); }
  const on = typeof PRIV !== 'undefined' && PRIV;
  s.innerHTML = `<div class="sec-h"><h3 class="sec-t">🔒 ${tvE(t('pv_t'))}</h3></div><p class="fine">${tvE(t('pv_h'))}</p>
    <label class="mk-sw pv-sw"><input type="checkbox" id="pv_tog"${on ? ' checked' : ''}><span class="mk-knob"></span><span>${tvE(t(on ? 'pv_on' : 'pv_off'))}</span></label>
    <p class="fine">${tvE(t('pv_note'))}</p>`;
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'pv_tog') return;
  try { if (e.target.checked) RAWLS.setItem('fin-priv', '1'); else RAWLS.removeItem('fin-priv'); } catch (er) {}
  toast(t(e.target.checked ? 'pv_reloadOn' : 'pv_reloadOff')); setTimeout(() => location.reload(), 900);
});
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.sh-row[data-scat="security"]')) setTimeout(pvSetRender, 160); });
setTimeout(pvSetRender, 950);
{
  const ixBoardPv = ixBoard;
  ixBoard = function(){ const r = ixBoardPv.apply(this, arguments);
    try { if (typeof PRIV !== 'undefined' && PRIV){ const hm = $('#hmx'); if (hm && !hm.querySelector('.pv-pill')) hm.insertAdjacentHTML('afterbegin', `<p class="fine pv-pill">🔒 ${tvE(t('pv_pill'))}</p>`); } } catch (e) {}
    return r; };
}

/* the markets screen redraws its board wherever the app asks to recalculate the open screen */
{ const calcMk = calc; calc = function(id){ if (id === 'markets'){ try { renderMarket(); } catch (e) {} return; } return calcMk.apply(this, arguments); }; }
