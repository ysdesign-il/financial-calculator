/* ================= 8.5: more live sources in every category (currencies, crypto, exchanges and commodities) =================
   The developer picks a source per category in Connections. Each new source is polled while live data is on and the screen is
   visible, and stops when live data is off (then the previous close is shown, as before). Inside Claude the page cannot reach
   these services, so there the site's server copy (updated every half hour) is used. */
const SRC_NEW = {
  fx: {
    frankfurter: {u: 'https://api.frankfurter.dev/v1/latest?base=USD', ms: 3600e3, pick: j => j && j.rates},
    erapi: {u: 'https://open.er-api.com/v6/latest/USD', ms: 3600e3, pick: j => j && j.rates},
    fawaz: {u: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', ms: 3600e3, pick: j => j && j.usd && Object.fromEntries(Object.entries(j.usd).map(([k, v]) => [k.toUpperCase(), v]))},
    cbx: {u: 'https://api.coinbase.com/v2/exchange-rates?currency=USD', ms: 60e3, pick: j => j && j.data && j.data.rates && Object.fromEntries(Object.entries(j.data.rates).filter(([k]) => !(typeof CRYPTO === 'object' && CRYPTO[k])).map(([k, v]) => [k, +v]))}
  },
  cr: {
    coingecko: {u: 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin,ethereum,solana,ripple,cardano,dogecoin,litecoin,tron,the-open-network,avalanche-2,chainlink,polkadot,bitcoin-cash,stellar,shiba-inu,uniswap,cosmos,near,aptos,sui,arbitrum,aave,algorand,filecoin,ethereum-classic,binancecoin,tether,usd-coin,dai',
      ms: 60e3, ids: {bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP', cardano: 'ADA', dogecoin: 'DOGE', litecoin: 'LTC', 'the-open-network': 'TON', 'avalanche-2': 'AVAX', chainlink: 'LINK', polkadot: 'DOT', 'bitcoin-cash': 'BCH', stellar: 'XLM', 'shiba-inu': 'SHIB', uniswap: 'UNI', cosmos: 'ATOM', near: 'NEAR', aptos: 'APT', sui: 'SUI', arbitrum: 'ARB', aave: 'AAVE', algorand: 'ALGO', filecoin: 'FIL', 'ethereum-classic': 'ETC', binancecoin: 'BNB', tether: 'USDT', 'usd-coin': 'USDC', dai: 'DAI'},
      pick(j){ const o = {}; Object.keys(j || {}).forEach(id => { const c = this.ids[id], p = j[id] && +j[id].usd; if (c && p > 0) o[c] = p; }); return o; }},
    kraken: {u: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,XRPUSD,ADAUSD,XDGUSD,LTCUSD,DOTUSD,LINKUSD,AVAXUSD,BCHUSD,XLMUSD',
      ms: 30e3, map: {XBT: 'BTC', ETH: 'ETH', SOL: 'SOL', XRP: 'XRP', ADA: 'ADA', XDG: 'DOGE', LTC: 'LTC', DOT: 'DOT', LINK: 'LINK', AVAX: 'AVAX', BCH: 'BCH', XLM: 'XLM'},
      pick(j){ const o = {}, R = (j && j.result) || {}; Object.keys(R).forEach(k => { const base = Object.keys(this.map).find(b => k.replace(/^X/, '').startsWith(b) || k.startsWith(b)); const p = R[k] && R[k].c && +R[k].c[0]; if (base && p > 0) o[this.map[base]] = p; }); return o; }},
    bitstamp: {u: 'https://www.bitstamp.net/api/v2/ticker/', ms: 30e3,
      pick(j){ const o = {}; (Array.isArray(j) ? j : []).forEach(x => { const m = /^([A-Z]+)\/USD$/.exec(x && x.pair || ''); const p = x && +x.last; if (m && p > 0 && typeof CRYPTO === 'object' && CRYPTO[m[1]]) o[m[1]] = p; }); return o; }}
  },
  mkt: {
    goldapi: {multi: [['gold', 'https://api.gold-api.com/price/XAU'], ['silver', 'https://api.gold-api.com/price/XAG'], ['platinum', 'https://api.gold-api.com/price/XPT'], ['palladium', 'https://api.gold-api.com/price/XPD'], ['copper', 'https://api.gold-api.com/price/HG']], ms: 60e3, pick: j => j && +j.price}
  }
};
Object.keys(SRC_NEW).forEach(g => Object.keys(SRC_NEW[g]).forEach(s => { if (!SRCP_OPT[g].includes(s)) SRCP_OPT[g].splice(SRCP_OPT[g].length - 1, 0, s); }));   // before "manual"
/* the metals source adds to the live exchanges feed instead of replacing it */
const _srcOk87 = srcOk;
srcOk = function(g, s){
  const p = (typeof SRCP === 'object' && SRCP && SRCP[g]) || '';
  if (g === 'mkt' && p === 'goldapi') return s === 'live' || s === 'snap' || s === 'goldapi';
  return _srcOk87.apply(this, arguments);
};
var SRCN = {timer: null, at: {}, st: {}};
const srcnOff = () => (typeof liveOff === 'function' && liveOff()) || SET.liveFx === '0';
async function srcnGet(u){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(u, {signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(to); }
}
async function srcnRun(g, name){
  const S = SRC_NEW[g][name]; if (!S) return 0;
  let n = 0;
  if (g === 'fx'){
    const j = await srcnGet(S.u), R = S.pick(j) || {};
    Object.keys(R).forEach(c => { const v = +R[c]; if (!/^[A-Z]{3}$/.test(c) || !(v > 0) || c === 'USD') return; const old = RATES[c]; if (old && (v / old < 0.8 || v / old > 1.25)) return; RATES[c] = v; FXSRC[c] = {s: name, at: Date.now()}; n++; });
    if (n){ RATES.USD = 1; FXL.at = Date.now(); META.live = true; META.official = false; META.mkt = false; META.unix = Math.floor(Date.now() / 1000); try { lastAt = new Date(); lastOk = true; renderStamp(); } catch (e) {} }
  } else if (g === 'cr'){
    const j = await srcnGet(S.u), R = S.pick(j) || {};
    Object.keys(R).forEach(c => { const p = +R[c]; if (!(p > 0)) return; const v = 1 / p, old = RATES[c]; if (old && (v / old < 0.5 || v / old > 2)) return; RATES[c] = v; FXSRC[c] = {s: name, at: Date.now()}; n++; });
    if (n){ META.cunix = Math.floor(Date.now() / 1000); }
  } else if (g === 'mkt'){
    for (const [k, u] of S.multi){
      try { const p = S.pick(await srcnGet(u)); const o = IX.mkt[k] || {}; if (p > 0 && (!o.p || (p / o.p > 0.6 && p / o.p < 1.6))){ IX.mkt[k] = Object.assign({}, o, {p, t: Math.floor(Date.now() / 1000), live: true, rt: true, chp: o.pc ? (p / o.pc - 1) * 100 : o.chp}); n++; } } catch (e) {}
    }
  }
  return n;
}
async function srcnTick(){
  clearTimeout(SRCN.timer); SRCN.timer = null;
  if (IN_CLAUDE || srcnOff() || document.hidden){ SRCN.timer = setTimeout(srcnTick, 30000); return; }
  let soon = 60e3, changed = 0;
  for (const g of Object.keys(SRC_NEW)){
    const name = (typeof SRCP === 'object' && SRCP[g]) || ''; const S = SRC_NEW[g][name]; if (!S) continue;
    soon = Math.min(soon, S.ms);
    if (Date.now() - (SRCN.at[g + name] || 0) < S.ms - 500) continue;
    SRCN.at[g + name] = Date.now();
    try { const n = await srcnRun(g, name); SRCN.st[g + ':' + name] = n ? 'ok' : 'empty'; changed += n; }
    catch (e) { SRCN.st[g + ':' + name] = 'bad'; }
  }
  if (changed){ try { fillCurSelects(); if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {} }
  SRCN.timer = setTimeout(srcnTick, Math.max(15000, Math.min(soon, 60000)));
}
/* when the developer picks one of these sources, start at once; and pick up a saved choice that was made before this list existed */
document.addEventListener('change', e => { if (e.target && e.target.closest && e.target.closest('[data-srcp]')) setTimeout(() => { SRCN.at = {}; srcnTick(); }, 300); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) srcnTick(); });
try { if (typeof srcpLoad === 'function') srcpLoad(); } catch (e) {}
setTimeout(srcnTick, 2500);
