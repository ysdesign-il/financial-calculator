/* ---------- 12.7: the live TradingView board on the markets screen (no outside links) ----------
   Nothing loads from those sites until you tap to show it (they see your address and may set cookies); the choice is remembered.
   Inside the Claude app outside widgets cannot load, so there you get buttons that open the sites. */
const TV_SYM = {ta35: 'TASE:TA35', ta125: 'TASE:TA125', spx: 'FOREXCOM:SPXUSD', ndx: 'FOREXCOM:NSXUSD', dji: 'FOREXCOM:DJI', ixic: 'NASDAQ:IXIC', rut: 'TVC:RUT', vix: 'TVC:VIX', dxy: 'TVC:DXY',
  tsx: 'TSX:TSX', ipc: 'BMV:ME', bovespa: 'BMFBOVESPA:IBOV', ftse: 'TVC:UKX', dax: 'XETR:DAX', stoxx: 'TVC:SX5E', cac: 'EURONEXT:PX1', ibex: 'BME:IBC', ftmib: 'TVC:FTMIB', aex: 'EURONEXT:AEX', smi: 'SIX:SMI',
  nikkei: 'TVC:NI225', hsi: 'TVC:HSI', ssec: 'SSE:000001', kospi: 'TVC:KOSPI', nifty: 'NSE:NIFTY', asx: 'ASX:XJO',
  gold: 'TVC:GOLD', silver: 'TVC:SILVER', platinum: 'TVC:PLATINUM', palladium: 'TVC:PALLADIUM', copper: 'COMEX:HG1!', brent: 'TVC:UKOIL', wti: 'TVC:USOIL', natgas: 'NYMEX:NG1!',
  gasoline: 'NYMEX:RB1!', heatoil: 'NYMEX:HO1!', wheat: 'CBOT:ZW1!', corn: 'CBOT:ZC1!', soy: 'CBOT:ZS1!', coffee: 'ICEUS:KC1!', sugar: 'ICEUS:SB1!', cocoa: 'ICEUS:CC1!', cotton: 'ICEUS:CT1!'};
const TV_FX = [['FX_IDC:USDILS', 'USD/ILS'], ['FX_IDC:EURILS', 'EUR/ILS'], ['FX_IDC:GBPILS', 'GBP/ILS'], ['FX:EURUSD', 'EUR/USD'], ['BITSTAMP:BTCUSD', 'Bitcoin'], ['BITSTAMP:ETHUSD', 'Ethereum']];
const tvLang = () => { const l = document.documentElement.lang || 'he'; return l === 'he' ? 'he_IL' : l === 'ar' ? 'ar_AE' : 'en'; };
const tvDark = () => { try { return getComputedStyle(document.documentElement).colorScheme.includes('dark') || document.documentElement.dataset.theme === 'dark'; } catch (e) { return false; } };
const tvE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* a TradingView widget: their standard embed (a script whose text is the settings), inside a box we own */
function tvWidget(host, name, cfg){
  host.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'tradingview-widget-container';
  const inner = document.createElement('div'); inner.className = 'tradingview-widget-container__widget'; wrap.appendChild(inner);
  const s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + name + '.js';
  s.text = JSON.stringify(Object.assign({locale: tvLang(), colorTheme: tvDark() ? 'dark' : 'light', isTransparent: true, width: '100%'}, cfg));
  s.onerror = () => { host.innerHTML = `<p class="fine">${tvE(t('tv_fail'))}</p>`; };
  wrap.appendChild(s); host.appendChild(wrap);
  const cr = document.createElement('div'); cr.className = 'tv-cr fine'; cr.textContent = t('tv_by'); host.appendChild(cr);
}
function tvOverviewCfg(){
  const S = typeof ixShown === 'function' ? ixShown() : IX_DEF, sym = k => ({s: TV_SYM[k], d: ixName(k)});
  const idx = S.filter(k => TV_SYM[k] && !IX_COM.includes(k)).map(sym), com = S.filter(k => TV_SYM[k] && IX_COM.includes(k)).map(sym);
  const tabs = [];
  if (idx.length) tabs.push({title: t('ix_gMkt'), symbols: idx, originalTitle: 'Indices'});
  if (com.length) tabs.push({title: t('ix_gCom'), symbols: com, originalTitle: 'Commodities'});
  tabs.push({title: t('tv_fx'), symbols: TV_FX.map(([s, d]) => ({s, d})), originalTitle: 'Forex'});
  return {dateRange: '1D', showChart: true, height: 560, showSymbolLogo: true, showFloatingTooltip: true, plotLineColorGrowing: '#1f9d55', plotLineColorFalling: '#d64545', tabs};
}
function tvBoxHTML(){
  const on = SET.tvOn === '1';
  if (IN_CLAUDE) return `<h4 class="ix-g">📺 ${tvE(t('tv_t'))}</h4><p class="fine">${tvE(t('tv_inClaude'))}</p>`;
  return `<h4 class="ix-g">📺 ${tvE(t('tv_t'))}</h4><p class="fine">${tvE(t(on ? 'tv_hOn' : 'tv_h'))}</p>
    <div class="btnrow"><button type="button" class="${on ? 'btn' : 'gold-btn'}" id="tv_tog">${tvE(t(on ? 'tv_hide' : 'tv_show'))}</button></div>
    <div id="tv_ov" class="tv-ov"${on ? '' : ' hidden'}></div>`;
}
var TVX = {sig: ''};
function tvMount(){
  const hm = $('#hmx'); if (!hm) return;
  let box = $('#tvx'); if (!box){ box = document.createElement('div'); box.id = 'tvx'; box.className = 'tvx'; hm.parentNode.insertBefore(box, hm.nextSibling); TVX.sig = ''; }
  /* rebuild only when something it depends on changed — the price board above refreshes every 15 seconds, the widget must not */
  const sig = [document.documentElement.lang, SET.tvOn, tvDark(), typeof ixShown === 'function' ? ixShown().join(',') : ''].join('|');
  if (sig === TVX.sig) return; TVX.sig = sig;
  box.innerHTML = tvBoxHTML();
  if (!IN_CLAUDE && SET.tvOn === '1'){ const ov = $('#tv_ov'); if (ov) tvWidget(ov, 'market-overview', tvOverviewCfg()); }
}
{
  const ixBoardTv = ixBoard;
  ixBoard = function(){ const r = ixBoardTv.apply(this, arguments); try { tvMount(); } catch (e) {} return r; };
  try { tvMount(); } catch (e) {}
}
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#tv_tog')){ SET.tvOn = SET.tvOn === '1' ? '0' : '1'; saveSet(); TVX.sig = ''; tvMount(); return; }

});
