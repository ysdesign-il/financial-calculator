/* ================= 8.5: one currency everywhere, and a coin for every currency ================= */

/* ---------- 1. changing the display currency moves the whole app to it ----------
   every calculator (the per-calculator currencies are cleared) and the converter's "from" side follow the new currency.
   Calculators that work by Israeli law (salary, tax, VAT…) stay in shekels, because the law is written in shekels. */
var CUR_ALL_LAST = null;
function curAll(next, prev){
  if (!next || next === prev) return;
  const had = SET.curBy && Object.keys(SET.curBy).length;
  SET.curBy = {}; saveSet();
  const xf = $('#x_from'), xt = $('#x_to');
  if (xf && RATES[next]){ if (xt && xt.value === next) xt.value = prev && RATES[prev] ? prev : (next === 'USD' ? 'ILS' : 'USD'); xf.value = next; }
  try { fillCB(); } catch (e) {} try { applyEffCur(tab); } catch (e) {} try { calc(tab); } catch (e) {}
  try { if (CUR_ALL_LAST !== null) toast(t('cur_allNow', {c: curFlag(next) + ' ' + next})); } catch (e) {}
  CUR_ALL_LAST = next;
}
const _setBase86 = setBase;
setBase = function(c){ const prev = baseCur; const r = _setBase86.apply(this, arguments); curAll(c, prev); coinsAll(); return r; };
let CUR_PREV = (typeof baseCur !== 'undefined' && baseCur) || 'ILS';
document.addEventListener('change', e => {
  const id = e.target && e.target.id; if (id !== 'cur' && id !== 'set_cur') return;
  setTimeout(() => { const now = baseCur; if (now !== CUR_PREV){ const p = CUR_PREV; CUR_PREV = now; curAll(now, p); } coinsAll(); }, 0);
});
CUR_ALL_LAST = CUR_PREV;

/* ---------- 2. flags and coins ---------- */
const CUR_SYM = {BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$', DAI: '◈', BNB: '◆', SOL: '◎', XRP: '✕', ADA: '₳', DOGE: 'Ð', TON: '◇', LTC: 'Ł', BCH: 'Ƀ', ETC: 'ξ', XLM: '✦', DOT: '●', AVAX: '▲', LINK: '⬡', SHIB: '🐕', UNI: '🦄', ATOM: '⚛', NEAR: 'Ⓝ', APT: '◐', SUI: '💧', ARB: '◮', POL: '⬢', AAVE: '👻', ALGO: 'Ⱥ', FIL: '⨎'};
const CUR_FLAG = {EUR: '🇪🇺', XAU: '🥇', XAG: '🥈', XPT: '⚪', XPD: '⚪', XDR: '🌐', ANG: '🇨🇼', XAF: '🌍', XOF: '🌍', XCD: '🌴', XPF: '🇵🇫'};
const CUR_DN = (() => { try { return new Intl.DisplayNames(['en'], {type: 'region'}); } catch (e) { return null; } })();
function curFlag(c){
  c = String(c || '').toUpperCase();
  if (CUR_FLAG[c]) return CUR_FLAG[c];
  if (typeof CRYPTO === 'object' && CRYPTO[c]) return '🪙';
  const cc = c.slice(0, 2);
  try { if (/^[A-Z]{2}$/.test(cc) && CUR_DN && CUR_DN.of(cc) !== cc) return String.fromCodePoint(...[...cc].map(x => 0x1F1E6 + x.charCodeAt(0) - 65)); } catch (e) {}
  return '💱';
}
const isCrypto = c => typeof CRYPTO === 'object' && !!CRYPTO[c];
function coinHtml(c, big){
  c = String(c || '').toUpperCase();
  const cr = isCrypto(c), sym = cr ? (CUR_SYM[c] || c.slice(0, 1)) : '';
  return `<span class="cur-coin${cr ? ' crypto' : ''}${big ? ' big' : ''}" data-c="${c}" aria-hidden="true"><i>${cr ? sym : curFlag(c)}</i></span>`;
}
/* every currency list shows the flag first */
const _curOpt86 = curOptions;
curOptions = function(sel){
  return _curOpt86.apply(this, arguments).replace(/<option value="([A-Z0-9]{2,10})"([^>]*)>/g, (m, c, rest) => m + (isCrypto(c) ? (CUR_SYM[c] || '🪙') : curFlag(c)) + ' ');
};
const _fillCB86 = fillCB;
fillCB = function(){
  const r = _fillCB86.apply(this, arguments);
  const f = $('#set_favCur'); if (f) [...f.options].forEach(o => { if (o.value && !o.dataset.fl){ o.dataset.fl = '1'; o.textContent = curFlag(o.value) + ' ' + o.textContent; } });
  return r;
};
/* coins on the screen: next to the currency picker, on the market cards, in the converter */
function coinBeside(sel){
  if (!sel) return;
  let c = sel.previousElementSibling && sel.previousElementSibling.classList && sel.previousElementSibling.classList.contains('cur-coin') ? sel.previousElementSibling : null;
  const v = sel.value; if (!v) return;
  if (!c){ sel.insertAdjacentHTML('beforebegin', coinHtml(v)); c = sel.previousElementSibling; c.classList.add('coin-pick'); return; }
  if (c.dataset.c !== v){ c.outerHTML = coinHtml(v).replace('class="cur-coin', 'class="cur-coin coin-pick spin'); }
}
const MK_COIN = [[/דולר|دولار|dollar/i, 'USD'], [/אירו|يورو|euro/i, 'EUR'], [/ביטקוין|بيتكوين|bitcoin/i, 'BTC'], [/אית׳ריום|إيثريوم|ethereum/i, 'ETH'], [/ליש״ט|לירה שטרלינג|جنيه إسترليني|pound/i, 'GBP']];
function coinsAll(){
  try { coinBeside($('#cur')); } catch (e) {}
  /* market cards on Home */
  ['hm', 'hmx'].flatMap(id => { const r = document.getElementById(id); return r ? [...r.getElementsByClassName('mk')] : []; }).forEach(card => {
    if (card.querySelector('.cur-coin')) return;
    const l = card.querySelector('.mk-l'); if (!l) return;
    const hit = MK_COIN.find(([rx]) => rx.test(l.textContent)); if (!hit) return;
    l.insertAdjacentHTML('afterbegin', coinHtml(hit[1]));
  });
  /* the converter: a pair of coins in the result, and a coin for each line of the rates list */
  const h = $('#hero-convert'), xf = $('#x_from'), xt = $('#x_to');
  if (h && xf && xt){
    let pr = h.querySelector('.coin-pair');
    const key = xf.value + '>' + xt.value;
    if (!pr || pr.dataset.k !== key){
      if (pr) pr.remove();
      h.insertAdjacentHTML('afterbegin', `<span class="coin-pair" data-k="${key}">${coinHtml(xf.value, true)}<b aria-hidden="true">⇄</b>${coinHtml(xt.value, true)}</span>`);
    }
  }
  $$('#panel-convert .ledger .row dt').forEach(dt => {
    if (dt.querySelector('.cur-coin')) return;
    const m = dt.textContent.trim().match(/^([A-Z]{3,5})\b/); if (m && RATES[m[1]]) dt.insertAdjacentHTML('afterbegin', coinHtml(m[1]));
  });
}
const _rm86 = renderMarket;
renderMarket = function(){ const r = _rm86.apply(this, arguments); try { coinsAll(); } catch (e) {} return r; };
const _calc86 = calc;
calc = function(id){ const r = _calc86.apply(this, arguments); if (id === 'convert' || id === 'home') try { coinsAll(); } catch (e) {} return r; };
document.addEventListener('change', e => { const id = e.target && e.target.id; if (id === 'x_from' || id === 'x_to' || id === 'cur') setTimeout(coinsAll, 0); });
const _fcs86 = fillCurSelects;
fillCurSelects = function(){ const r = _fcs86.apply(this, arguments); try { coinsAll(); } catch (e) {} return r; };
try { if (typeof PF === 'object'){ PF.cur = ''; PF.cb = ''; } fillCurSelects(); coinsAll(); } catch (e) {}
