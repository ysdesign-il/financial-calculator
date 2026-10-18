/* ---- crypto assets (units per 1 USD, snapshot 14 Oct 2026 from Coinbase exchange rates) ---- */
const CRYPTO = {
  BTC:['ביטקוין','بيتكوين','Bitcoin'], ETH:['אית׳ריום','إيثريوم','Ethereum'], USDT:['טתר','تيذر','Tether'], USDC:['USD Coin','USD Coin','USD Coin'],
  DAI:['Dai','Dai','Dai'], BNB:['BNB','BNB','BNB'], SOL:['סולנה','سولانا','Solana'], XRP:['ריפל','ريبل','XRP'], ADA:['קרדאנו','كاردانو','Cardano'],
  DOGE:['דוג׳קוין','دوجكوين','Dogecoin'], TON:['טונקוין','تون','Toncoin'], AVAX:['אבלאנץ׳','أفالانش','Avalanche'], LINK:['צ׳יינלינק','تشينلينك','Chainlink'],
  DOT:['פולקדוט','بولكادوت','Polkadot'], LTC:['לייטקוין','لايتكوين','Litecoin'], SHIB:['שיבה אינו','شيبا إينو','Shiba Inu'], XLM:['סטלר','ستيلر','Stellar'],
  BCH:['ביטקוין קאש','بيتكوين كاش','Bitcoin Cash'], NEAR:['NEAR','NEAR','NEAR Protocol'], ATOM:['קוסמוס','كوزموس','Cosmos'], UNI:['יוניסוואפ','يونيسواب','Uniswap'],
  ETC:['אית׳ריום קלאסיק','إيثريوم كلاسيك','Ethereum Classic'], APT:['אפטוס','أبتوس','Aptos'], SUI:['סווי','سوي','Sui'], ARB:['ארביטרום','أربيتروم','Arbitrum'],
  POL:['פוליגון','بوليغون','Polygon'], AAVE:['אאבה','آڤي','Aave'], ALGO:['אלגורנד','ألغorand','Algorand'], FIL:['פיילקוין','فايلكوين','Filecoin']
};
CRYPTO.ALGO[1] = 'ألغوراند';
Object.assign(RATES, {BTC:0.0000121389526487, ETH:0.0004061655937126, USDT:1.0012014417300761, USDC:1, DAI:1.0009282162083914, BNB:0.0013596377924921,
  SOL:0.0095020904599012, XRP:0.7391529307413704, ADA:4.3057050592034446, DOGE:12.0758362516604275, TON:0.7283321194464676, AVAX:0.0978186442335909,
  LINK:0.0790139064475348, DOT:0.8745080891998251, LTC:0.0163561720015048, SHIB:193798.4496124031, XLM:5.2399367015646451, BCH:0.0037569974076718,
  NEAR:0.1926077158650976, ATOM:0.5554012774229381, UNI:0.14194464158978, ETC:0.1243317170210121, APT:1.2647021626406981, SUI:0.968147933004163,
  ARB:5.4734537493158183, POL:9.9522292993630573, AAVE:0.0064077918749199, ALGO:8.4523708900346547, FIL:0.9033423667570009});
META.cunix = 1791925200;
const RN = x => N(x, null, x !== 0 && Math.abs(x) < 0.01 ? 10 : 4);
function cryptoWarn(a, b){
  if (!(CRYPTO[a] || CRYPTO[b])) return [];
  if (META.cryptoLive) return [t('w_cryptoLive')];
  let d; try { d = new Intl.DateTimeFormat(locOf(), {dateStyle:'medium', timeZone:'UTC'}).format(new Date(META.cunix * 1000)); } catch (e) { d = '14.10.2026'; }
  return [t('w_crypto', {d})];
}
async function tryLiveCrypto(){
  if (gemOn()) return await tryLiveGemini();
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {signal: ctl.signal});
    clearTimeout(to);
    if (!r.ok) return;
    const j = await r.json(), rt = j && j.data && j.data.rates;
    if (!rt) return;
    let n = 0;
    Object.keys(CRYPTO).forEach(c => { const x = parseFloat(rt[c]); if (x > 0){ RATES[c] = x; n++; } });
    if (n){ META.cryptoLive = true; META.cunix = Math.floor(Date.now() / 1000); if (tab === 'convert' || tab === 'home') calc(tab); }
    return n > 0;
  } catch (e) { /* keep snapshot */ }
  return false;
}

/* ---- Gemini (Google) as a rate source: the user's own API key, grounded with Google Search ---- */
const gemOn = () => SET.rateSrc === 'gemini' && !!(SET.gkey && SET.gkey.trim()) && (typeof gkAllowed !== 'function' || gkAllowed());
const GEM_FIAT = ['ILS','EUR','GBP','JPY','CHF','CAD','AUD','NZD','CNY','HKD','SGD','INR','RUB','TRY','AED','SAR','JOD','EGP','PLN','CZK','HUF','RON','SEK','NOK','DKK','BRL','MXN','ARS','ZAR','KRW','THB'];
var gemLast = 0, gemBusy = null;
async function tryLiveGemini(force){
  if (!gemOn()) return false;
  if (!force && Date.now() - gemLast < 60000 && META.gemini) return true;   // at most once a minute
  if (gemBusy) return gemBusy;
  gemBusy = (async () => {
    META.gerr = '';
    try {
      const codes = GEM_FIAT.filter(c => RATES[c]).concat(Object.keys(CRYPTO));
      const prompt = 'Use Google Search to find the current market exchange rates right now. For each code in this list, give how many units of that asset equal 1 US dollar (USD). ' +
        'Reply with ONLY one JSON object, no text, no markdown, in the form {"ILS":3.7,"EUR":0.92,...} using exactly these codes: ' + codes.join(', ') + '.';
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        method:'POST', signal: ctl.signal,
        headers:{'Content-Type':'application/json', 'x-goog-api-key': SET.gkey.trim()},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}], tools:[{google_search:{}}], generationConfig:{temperature:0}})
      });
      clearTimeout(to);
      if (!r.ok){ META.gerr = 'HTTP ' + r.status; return false; }
      const j = await r.json();
      const txt = (((j.candidates || [])[0] || {}).content || {}).parts;
      const raw = (txt || []).map(p => p.text || '').join('');
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m){ META.gerr = 'format'; return false; }
      const o = JSON.parse(m[0]);
      let n = 0;
      Object.keys(o).forEach(k => {
        const code = k.toUpperCase(), v = parseFloat(o[k]), old = RATES[code];
        if (!(v > 0) || !old) return;
        const crypto = !!CRYPTO[code], q = v / old;
        if (crypto ? (q < 0.2 || q > 5) : (q < 0.8 || q > 1.25)) return;   // reject implausible values
        RATES[code] = v; n++;
      });
      if (!n){ META.gerr = 'format'; return false; }
      RATES.USD = 1;
      META.gemini = true; META.live = true; META.cryptoLive = true;
      META.unix = META.cunix = Math.floor(Date.now() / 1000);
      gemLast = Date.now();
      fillCurSelects(); if (tab === 'convert' || tab === 'home') calc(tab);
      return true;
    } catch (e) { META.gerr = (e && e.name === 'AbortError') ? 'timeout' : 'blocked'; return false; }
    finally { gemBusy = null; }
  })();
  return gemBusy;
}
