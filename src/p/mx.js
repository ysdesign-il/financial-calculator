/* ================= advanced calculator: the screens — formula sheet, finance & economics, accounting, graphs ================= */
const MX_KEY = 'fin-mathx';
try { if (Array.isArray(DATA_KEYS) && !DATA_KEYS.includes(MX_KEY)) DATA_KEYS.push(MX_KEY); } catch (e) {}
var MX = {d: null, tab: 'sheet', at: 'journal', run: 0, scope: {v: {}, f: {}}, timer: null, ai: {}, sure: '', finK: 'npv', gv: null};
const mE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function mxData(){
  if (MX.d) return MX.d;
  const d = toolsLoad(MX_KEY, null) || {};
  MX.d = Object.assign({sheet: '', deg: false, dec: '', fin: {}, acct: null, graph: null}, d);
  if (!MX.d.acct) MX.d.acct = {accounts: mxDefAccounts(), entries: []};
  if (!MX.d.graph) MX.d.graph = {fns: ['sin(x)', 'x^2/4 - 2'], x0: -10, x1: 10};
  MXE.deg = !!MX.d.deg;
  return MX.d;
}
function mxSave(){ clearTimeout(MX.st); MX.st = setTimeout(() => { try { toolsSave(MX_KEY, MX.d); } catch (e) {} }, 400); }
const mxDec = () => MX.d && MX.d.dec !== '' && MX.d.dec != null ? +MX.d.dec : null;
const mxErrTxt = e => e && e.mx ? t(e.mx, e.p || {}) : t('mx_eSymFail');

/* ---------- examples ---------- */
const MX_EX = {
  basic: '# ' + 'Arithmetic\n2(3+4)^2 - sqrt(16)/2\n1/3 + 1/6\n15% * 240\n5!\n17 mod 5\nround(22/7, 3)',
  alg: 'a = 3\nb = -5\nf(x) = a*x^2 + b*x - 2\nf(2)\nsolve(3x^2 - 5x - 2 = 0, x)\nsolve([x + y = 10; x - y = 2])\nfactor(x^2 - 9)\nexpand((x + 2)^3)',
  calc: 'diff(x^3 * sin(x), x)\nintegrate(x^2 * e^x, x)\nintegrate(x^2, x, 0, 3)\nlimit(sin(x)/x, x, 0)\ntaylor(e^x, x, 0, 5)\nsigma(k^2, k, 1, 10)',
  mat: 'A = [2, 1; 1, 3]\nb = [3; 5]\ndet(A)\ninv(A)\nA * A\nlinsolve(A, b)\ncross([1,0,0], [0,1,0])',
  stat: 'data = [12, 15, 11, 19, 15, 22, 14]\nmean(data)\nmedian(data)\nmode(data)\nstd(data)\nvariance(data)\nmax(data) - min(data)',
  trig: 'sin(pi/6)\ncos(pi/3)^2 + sin(pi/3)^2\natan(1)\nhypot(3, 4)',
  fin: 'npv(0.08, [-10000, 3000, 4000, 4500, 2000])\nirr([-10000, 3000, 4000, 4500, 2000])\npmt(0.05/12, 300, 800000)\nfv(0.04, 20, -5000)\ncagr(100000, 180000, 6)\nbondprice(1000, 0.05, 0.06, 10, 2)\nwacc(600, 400, 0.12, 0.06, 0.23)'
};

/* ---------- the formula sheet ---------- */
function mxLineNode(src){ try { return mxParse(src); } catch (e) { try { return mxParse(src.replace(/([^<>!=])=([^=])/g, '$1==$2')); } catch (e2) { return null; } } }
function mxIsSym(src){ const c = mxSplitCall(src); return !!(c && MX_SYM.includes(c.n)); }
function mxRunSheet(){
  const out = $('#mx_out'); if (!out) return;
  const d = mxData(), lines = String(d.sheet || '').split('\n'), run = ++MX.run, S = {v: {}, f: {}};
  const cards = [];
  lines.forEach((raw, i) => {
    const src = raw.trim(); if (!src) return;
    if (src.startsWith('#')){ cards.push(`<h4 class="mx-h">${mE(src.replace(/^#+\s*/, ''))}</h4>`); return; }
    const id = 'mxl' + i;
    let symSrc = mxIsSym(src) ? src : '';
    if (!symSrc && /[^<>!=]=[^=]/.test(src)){ const n0 = mxLineNode(src); if (n0 && n0.t === 'eq'){ const vs = (src.match(/[A-Za-z_]\w*/g) || []).filter(v => !(v in S.v) && !(v in MX_CONST) && !MX_MATH[v.toLowerCase()] && !S.f[v]); symSrc = 'solve(' + src + ', ' + (vs.includes('x') ? 'x' : vs[0] || 'x') + ')'; } }
    if (symSrc){
      const srcShown = src;
      const n = mxLineNode(srcShown);
      cards.push(`<div class="mx-card" data-l="${i}"><div class="mx-in" dir="ltr">${n ? mxHTML(n) : mE(srcShown)}</div><div class="mx-res" id="${id}" dir="ltr">⏳ ${mE(t('mx_comp'))}</div>${mxCardBtns(i)}</div>`);
      const Sc = {v: Object.assign({}, S.v), f: Object.assign({}, S.f)};
      mxSymbolic(symSrc, Sc).then(r => {
        if (run !== MX.run) return; const el = document.getElementById(id); if (!el) return;
        if (!r || !r.res){ el.innerHTML = `<span class="mx-err">${mE(t('mx_eSymFail'))}</span>`; return; }
        el.innerHTML = '= ' + r.res.split(',  ').map(part => { const pn = mxLineNode(part.replace(/\s*\+\s*C$/, '')); return pn ? mxHTML(pn) + (/\+\s*C$/.test(part) ? ' + <i class="mxv">C</i>' : '') : mE(part); }).join('<span class="mx-sep">,</span> ')
          + (r.extra.length ? `<div class="mx-sub">${r.extra.map(mE).join(' · ')}</div>` : '');
        MX.ai[i] = r.res + (r.extra.length ? ' (' + r.extra.join(', ') + ')' : '');
      }).catch(e => { if (run !== MX.run) return; const el = document.getElementById(id); if (el) el.innerHTML = `<span class="mx-err">${mE(mxErrTxt(e))}</span>`; });
      return;
    }
    let n = null, html = '';
    try {
      n = mxParse(src);
      if (n.t === 'assign'){ const v = mxEval(n.e, S); S.v[n.n] = v; html = mxResHTML(v, n.e, S, `<i class="mxv">${mE(n.n)}</i> = `); MX.ai[i] = n.n + ' = ' + mxFmt(v, mxDec()); }
      else if (n.t === 'fdef'){ S.f[n.n] = {ps: n.ps, e: n.e, src: src.slice(src.indexOf('=') + 1).trim()}; html = `<span class="mx-ok">✓ ${mE(t('mx_defined'))}</span>`; MX.ai[i] = ''; }
      else { const v = mxEval(n, S); S.v.ans = v; html = mxResHTML(v, n, S, '= '); MX.ai[i] = mxFmt(v, mxDec());
        if (n.t === 'fn' && MX_PCTOUT.includes(n.n.toLowerCase()) && typeof v === 'number') html += ` <span class="mx-sub">= ${mE(mxFmt(v * 100, 4))}%</span>`; }
    } catch (e){ html = `<span class="mx-err">⚠️ ${mE(mxErrTxt(e))}</span>`; MX.ai[i] = ''; }
    cards.push(`<div class="mx-card" data-l="${i}"><div class="mx-in" dir="ltr">${n ? mxHTML(n) : mE(src)}</div><div class="mx-res" dir="ltr">${html}</div>${n && n.t !== 'fdef' ? mxStepsHTML(n, S) : ''}${mxCardBtns(i)}</div>`);
  });
  MX.scope = S;
  out.innerHTML = cards.join('') || '';
}
function mxResHTML(v, node, S, pre){
  const fr = typeof v === 'number' ? mxFrac(v) : '';
  return pre + (mxIsM(v) ? mxValHTML(v) : `<b class="mx-val">${mE(mxFmt(v, mxDec()))}</b>`) + (fr ? ` <span class="mx-sub">= ${mE(fr)}</span>` : '');
}
function mxCardBtns(i){ return `<div class="mx-btns"><button type="button" class="mv mx-aib" data-mxai="${i}">🤖 ${mE(t('mx_ai'))}</button></div><div class="mx-aiout" id="mxai${i}" hidden></div>`; }
function mxStepsHTML(n, S){
  const node = n.t === 'assign' ? n.e : n; let parts = [];
  /* finance functions explain themselves */
  if (node.t === 'fn' && MX_FIN[node.n.toLowerCase()]){
    try { const f = MX_FIN[node.n.toLowerCase()], a = node.args.map(x => mxEval(x, S)), ex = f.ex(...a);
      parts.push(`<div class="mx-st"><b>${mE(t('mx_formula'))}:</b> <span dir="ltr">${mE(ex.f)}</span></div>`);
      (ex.s || []).forEach(s => parts.push(`<div class="mx-st" dir="ltr">${mE(s)}</div>`));
      if (ex.tbl) parts.push(mxTblHTML(ex.tbl));
    } catch (e) {}
  }
  const st = mxSteps(node, S), fin = parts.length > 0;
  if (!fin && st.length < 2) return '';
  st.forEach(s => parts.push(`<div class="mx-st" dir="ltr">${s.k ? `<small>${mE(t(s.k))}:</small> ` : '⟶ '}${s.h}</div>`));
  if (!parts.length) return '';
  return `<details class="mx-steps"><summary>${mE(t('mx_steps'))} (${parts.length})</summary>${parts.join('')}</details>`;
}
function mxTblHTML(tb){
  const f = x => typeof x === 'number' ? mxFmt(x, 2) : mE(x);
  return `<div class="scroll"><table class="tbl mx-tbl"><thead><tr>${tb.head.map(h => `<th>${mE(t(h))}</th>`).join('')}</tr></thead><tbody>${tb.rows.map(r => `<tr>${r.map((c, j) => j ? `<td>${f(c)}</td>` : `<th>${mE(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const MX_KEYS = [['(', '('], [')', ')'], ['^', '^'], ['√', 'sqrt('], ['π', 'pi'], ['e', 'e'], ['x', 'x'], ['=', ' = '], [',', ', '], ['[', '['], [']', ']'], [';', '; '], ['!', '!'], ['%', '%'], ['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['ln', 'ln('], ['log', 'log('], ['|x|', 'abs('],
  ['Σ', 'sigma(k, k, 1, 10)'], ['∫', 'integrate(x^2, x)'], ['d/dx', 'diff(x^2, x)'], ['solve', 'solve(x^2 - 4 = 0, x)']];
/* every function, grouped, tap to insert */
const MX_LIB = [
  ['basic', ['sqrt(x)', 'root(x, n)', 'abs(x)', 'exp(x)', 'ln(x)', 'log(x)', 'log(x, b)', 'log2(x)', 'round(x, d)', 'floor(x)', 'ceil(x)', 'trunc(x)', 'sign(x)', 'x mod n', 'n!', 'pctchange(old, new)', 'pctof(part, whole)', 'hypot(a, b)', 'min(…)', 'max(…)', 'sum(…)', 'prod(…)']],
  ['alg', ['solve(x^2 - 5x + 6 = 0, x)', 'solve([x + y = 10; x - y = 2])', 'quad(a, b, c)', 'nsolve(x^3 - 2x - 5, x, 2)', 'expand((x + 1)^3)', 'factor(x^2 - 9)', 'simplify((x^2 - 1)/(x - 1))', 'partfrac(1/(x^2 - 1), x)', 'roots(x^3 - 6x^2 + 11x - 6)']],
  ['calc', ['diff(x^3, x)', 'diff(sin(x), x, 2)', 'integrate(x^2, x)', 'integrate(x^2, x, 0, 3)', 'nintegrate(e^(-x^2), x, 0, 1)', 'nderive(x^3, x, 2)', 'limit(sin(x)/x, x, 0)', 'taylor(e^x, x, 0, 5)', 'sigma(k^2, k, 1, 10)', 'product(k, k, 1, 5)']],
  ['trig', ['sin(x)', 'cos(x)', 'tan(x)', 'cot(x)', 'sec(x)', 'csc(x)', 'asin(x)', 'acos(x)', 'atan(x)', 'atan2(y, x)', 'sinh(x)', 'cosh(x)', 'tanh(x)', 'deg(x)', 'rad(x)']],
  ['stat', ['mean(data)', 'median(data)', 'mode(data)', 'std(data)', 'stdp(data)', 'variance(data)', 'varp(data)', 'percentile(data, 90)', 'quartiles(data)', 'iqr(data)', 'range(data)', 'count(data)', 'geomean(data)', 'harmean(data)', 'zscore(x, mu, sigma)', 'cov(xs, ys)', 'corr(xs, ys)', 'linreg(xs, ys)', 'slope(xs, ys)', 'intercept(xs, ys)', 'rsq(xs, ys)', 'forecast(x, xs, ys)', 'gini(data)']],
  ['prob', ['ncr(n, k)', 'npr(n, k)', 'normpdf(x, mu, sigma)', 'normcdf(x, mu, sigma)', 'norminv(p, mu, sigma)', 'binompdf(n, p, k)', 'binomcdf(n, p, k)', 'poissonpdf(lambda, k)', 'poissoncdf(lambda, k)', 'exppdf(x, lambda)', 'expcdf(x, lambda)', 'erf(x)', 'gamma(x)', 'beta(a, b)']],
  ['mat', ['[1, 2; 3, 4]', 'det(A)', 'inv(A)', 'transpose(A)', 'trace(A)', 'rank(A)', 'rref(A)', 'identity(3)', 'linsolve(A, b)', 'A^2', 'dot(u, v)', 'cross(u, v)', 'norm(v)']],
  ['num', ['isprime(n)', 'factorint(n)', 'divisors(n)', 'gcd(a, b)', 'lcm(a, b)', 'fib(n)', 'bin(n)', 'hex(n)', 'oct(n)', 'tobase(n, b)', 'arith(a1, d, n)', 'geom(a1, r, n)']],
  ['fin', Object.keys(MX_FIN).filter(k => k !== 'quad').map(k => k + '(' + MX_FIN[k].ps.map(p => p.replace('?', '')).join(', ') + ')')]
];
function mxLibHTML(){
  const q = String(MX.libQ || '').toLowerCase();
  return `<details class="adv mx-lib"${MX.libOpen ? ' open' : ''}><summary>📖 ${mE(t('mx_lib'))}</summary><input type="search" id="mx_libq" dir="ltr" value="${mE(MX.libQ || '')}" placeholder="${mE(t('mx_libQ'))}" autocomplete="off">
    ${MX_LIB.map(([g, L]) => { const F = L.filter(x => !q || x.toLowerCase().includes(q)); return F.length ? `<div class="mx-libg"><b>${mE(t('mx_lg_' + g))}</b><div class="mx-libl">${F.map(x => `<button type="button" data-mxlib="${mE(x)}" dir="ltr">${mE(x)}</button>`).join('')}</div></div>` : ''; }).join('')}</details>`;
}
function mxSheetHTML(){
  const d = mxData();
  return `<p class="fine">${mE(t('mx_sheetH'))}</p>
    <div class="mx-bar"><select id="mx_ex" aria-label="${mE(t('mx_examples'))}"><option value="">📚 ${mE(t('mx_examples'))}</option>${Object.keys(MX_EX).map(k => `<option value="${k}">${mE(t('mx_ex_' + k))}</option>`).join('')}</select>
      <div class="seg mx-seg"><button type="button" data-mxdeg="0" aria-pressed="${!d.deg}">${mE(t('mx_rad'))}</button><button type="button" data-mxdeg="1" aria-pressed="${!!d.deg}">${mE(t('mx_deg'))}</button></div>
      <select id="mx_dec" aria-label="${mE(t('mx_dec'))}" title="${mE(t('mx_dec'))}"><option value="">${mE(t('mx_decAuto'))}</option>${[0, 2, 4, 6, 10].map(n => `<option value="${n}"${String(d.dec) === String(n) ? ' selected' : ''}>${n}</option>`).join('')}</select>
      <button type="button" class="mv" id="mx_clr">${mE(t('mx_clear'))}</button></div>
    <textarea id="mx_in" class="mx-in-ta" rows="6" dir="ltr" spellcheck="false" autocapitalize="none" autocomplete="off" placeholder="${mE(t('mx_ph'))}">${mE(d.sheet)}</textarea>
    <div class="mx-keys">${MX_KEYS.map(([l, v]) => `<button type="button" data-mxk="${mE(v)}">${mE(l)}</button>`).join('')}</div>
    ${mxLibHTML()}
    <div class="mx-bar mx-saves"><select id="mx_sheets" aria-label="${mE(t('mx_sheets'))}"><option value="">🗂 ${mE(t('mx_sheets'))} (${Object.keys(d.sheets || {}).length})</option>${Object.keys(d.sheets || {}).map(k => `<option value="${mE(k)}">${mE(k)}</option>`).join('')}</select>
      <input type="text" id="mx_sname" dir="auto" maxlength="30" placeholder="${mE(t('mx_sname'))}"><button type="button" class="mv" id="mx_ssave">💾 ${mE(t('mx_ssave'))}</button>${Object.keys(d.sheets || {}).length ? `<button type="button" class="mv" id="mx_sdel">🗑 ${mE(t('mx_sdel'))}</button>` : ''}<button type="button" class="mv" id="mx_copyAll">📋 ${mE(t('mx_copyAll'))}</button></div>
    <div id="mx_out" class="mx-out" aria-live="polite"></div>
    <details class="adv mx-help"><summary>❓ ${mE(t('mx_help'))}</summary><p class="fine" dir="auto">${mE(t('mx_helpTxt'))}</p></details>`;
}

/* ---------- finance & economics forms ---------- */
const MX_FGROUPS = [['tvm', ['pv', 'fv', 'pmt', 'nper', 'rate', 'simple', 'compound', 'amort', 'balance', 'rule72']], ['inv', ['npv', 'irr', 'mirr', 'payback', 'dpayback', 'profindex', 'cagr']], ['rates', ['effrate', 'nomrate', 'contrate', 'realrate', 'aftertax']],
  ['dep', ['sln', 'ddb', 'syd', 'uop']], ['bond', ['bondprice', 'ytm', 'duration']], ['corp', ['capm', 'wacc']], ['val', ['ddm', 'perp', 'gperp', 'gannuity', 'eps', 'pe', 'divyield', 'sharpe']], ['opt', ['bscall', 'bsput', 'forward']],
  ['cost', ['breakeven', 'margin', 'markup', 'vat']], ['invt', ['fifo', 'lifo', 'wavg']], ['eco', ['inflate', 'cpiinfl', 'realgdp', 'elasticity', 'multiplier', 'moneymult', 'ppp', 'eoq']]];
const MX_PCT = ['rate', 'annual_rate', 'nominal', 'effective', 'inflation', 'coupon_rate', 'ytm', 'rf', 'rm', 're', 'rd', 'tax', 'r', 'g', 'finance_rate', 'reinvest_rate', 'sigma', 'ret', 'sd', 'r_dom', 'r_for', 'reserve_ratio'];
const MX_PCTOUT = ['irr', 'mirr', 'rate', 'cagr', 'effrate', 'nomrate', 'contrate', 'realrate', 'ytm', 'capm', 'wacc', 'margin', 'markup', 'cpiinfl', 'aftertax', 'divyield'];
const MX_FDEF = {pv: [5, 10, -1000], fv: [5, 10, -1000], pmt: [0.5, 240, 500000], nper: [0.5, -3000, 300000], rate: [10, -100, 800], simple: [10000, 4, 3], compound: [10000, 4, 10, 12], amort: [500000, 5, 240],
  npv: [8, '-10000, 3000, 4000, 4500, 2000'], irr: ['-10000, 3000, 4000, 4500, 2000'], mirr: ['-10000, 3000, 4000, 4500, 2000', 8, 6], payback: ['-10000, 3000, 4000, 4500, 2000'], dpayback: [8, '-10000, 3000, 4000, 4500, 2000'], profindex: [8, '-10000, 3000, 4000, 4500, 2000'], cagr: [100000, 180000, 6],
  effrate: [12, 12], nomrate: [12.68, 12], contrate: [10], realrate: [6, 3], sln: [50000, 5000, 5], ddb: [50000, 5000, 5, 1], syd: [50000, 5000, 5, 1], bondprice: [1000, 5, 6, 10, 2], ytm: [950, 1000, 5, 10, 2], duration: [1000, 5, 6, 10, 2],
  capm: [4, 1.2, 9], wacc: [600, 400, 12, 6, 23], ddm: [5, 9, 3], breakeven: [100000, 50, 30], margin: [60, 100], markup: [60, 100], vat: [1000, 18], inflate: [1000, 3, 10], elasticity: [1000, 800, 10, 12], multiplier: [0.8], eoq: [12000, 100, 2.4], balance: [500000, 5, 240, 60], rule72: [7], aftertax: [5, 25], uop: [50000, 5000, 100000, 18000], perp: [1000, 8], gperp: [1000, 8, 3], gannuity: [1000, 8, 3, 10], eps: [5000000, 1000000], pe: [120, 6], divyield: [4, 120], sharpe: [11, 4, 15],
  bscall: [100, 100, 1, 5, 20], bsput: [100, 100, 1, 5, 20], forward: [3.7, 4.5, 5, 1], fifo: ['100, 200, 150', '10, 12, 13', 300], lifo: ['100, 200, 150', '10, 12, 13', 300], wavg: ['100, 200, 150', '10, 12, 13', 300], cpiinfl: [104.2, 107.5], realgdp: [2000, 125], ppp: [20, 5.5], moneymult: [10]};
function mxFinHTML(){
  const d = mxData(), k = MX.finK, f = MX_FIN[k], V = (d.fin && d.fin[k]) || MX_FDEF[k] || [];
  return `<p class="fine">${mE(t('mx_finH'))}</p>
    <div class="field wide"><label for="mx_fk">${mE(t('mx_finPick'))}</label><select id="mx_fk">${MX_FGROUPS.map(([g, L]) => `<optgroup label="${mE(t('mx_g_' + g))}">${L.map(x => `<option value="${x}"${x === k ? ' selected' : ''}>${mE(t('mx_f_' + x))}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="mx-fgrid">${f.ps.map((p, i) => { const nm = p.replace(/[?\[\]]/g, ''), opt = p.endsWith('?'), list = p.endsWith('[]'), v = V[i] != null ? V[i] : '';
      return `<div class="field cv-f${list ? ' wide' : ''}"><label for="mxp_${i}">${mE(t('mx_p_' + nm))}${opt ? ' <small>(' + mE(t('mx_opt')) + ')</small>' : ''}</label>${list ? `<textarea id="mxp_${i}" data-mxp="${i}" rows="2" dir="ltr">${mE(v)}</textarea>` : `<input id="mxp_${i}" data-mxp="${i}" type="text" inputmode="decimal" dir="ltr" value="${mE(v)}" autocomplete="off">`}</div>`; }).join('')}</div>
    <div id="mx_fres" class="mx-fres" aria-live="polite"></div>`;
}
function mxFinArgs(){
  const f = MX_FIN[MX.finK], a = [], raw = [];
  for (let i = 0; i < f.ps.length; i++){
    const p = f.ps[i], nm = p.replace(/[?\[\]]/g, ''), el = $('#mxp_' + i); const s = String(el ? el.value : '').trim(); raw.push(s);
    if (p.endsWith('[]')){ const L = s.split(/[,;\s]+/).filter(Boolean).map(Number); if (!L.length || L.some(isNaN)) throw MX_ERR('mx_eNum'); a.push(L); continue; }
    if (!s){ if (p.endsWith('?')){ a.push(undefined); continue; } throw MX_ERR('mx_eArgs', {n: t('mx_p_' + nm)}); }
    let v = Number(s.replace(/,/g, '')); if (isNaN(v)) throw MX_ERR('mx_eNum'); if (MX_PCT.includes(nm)) v /= 100; a.push(v);
  }
  return {a, raw};
}
function mxFinRun(){
  const box = $('#mx_fres'); if (!box) return; const k = MX.finK, f = MX_FIN[k];
  try {
    const {a, raw} = mxFinArgs(); const d = mxData(); d.fin = d.fin || {}; d.fin[k] = raw; mxSave();
    const v = f.fn(...a), ex = f.ex(...a), pct = MX_PCTOUT.includes(k);
    let extra = '';
    if (k === 'breakeven') extra = ` <span class="mx-sub">(${mE(t('mx_p_price'))}×Q = ${mE(mxFmt(v * a[1], 2))})</span>`;
    const call = k + '(' + a.filter(x => x !== undefined).map(x => Array.isArray(x) ? '[' + x.join(', ') + ']' : String(Math.round(x * 1e10) / 1e10)).join(', ') + ')';
    box.innerHTML = `<div class="mx-card mx-big"><div class="mx-lab">${mE(t('mx_f_' + k))}</div><div class="mx-res"><b class="mx-val">${pct ? mE(mxFmt(v * 100, 4)) + '%' : mE(mxFmt(v, mxDec() == null ? 2 : mxDec()))}</b>${extra}</div>
      <div class="mx-st"><b>${mE(t('mx_formula'))}:</b> <span dir="ltr">${mE(ex.f)}</span></div>${(ex.s || []).map(s => `<div class="mx-st" dir="ltr">${mE(s)}</div>`).join('')}${ex.tbl ? mxTblHTML(ex.tbl) : ''}
      <div class="mx-st" dir="ltr"><code>${mE(call)}</code></div>
      <div class="btnrow"><button type="button" class="mv" data-mxsend="${mE(call)}">➕ ${mE(t('mx_toSheet'))}</button><button type="button" class="mv mx-aib" data-mxaifin="1">🤖 ${mE(t('mx_ai'))}</button></div><div class="mx-aiout" id="mxaifin" hidden></div></div>`;
    MX.finLast = call + ' = ' + (pct ? mxFmt(v * 100, 4) + '%' : mxFmt(v, 2));
  } catch (e){ box.innerHTML = `<div class="mx-card"><span class="mx-err">⚠️ ${mE(mxErrTxt(e))}</span></div>`; }
}

/* ---------- accounting ---------- */
const MX_ACC0 = [['cash', 'ca'], ['bank', 'ca'], ['ar', 'ca'], ['inv', 'ca'], ['prepaid', 'ca'], ['vatin', 'ca'], ['equip', 'nca'], ['accdep', 'nca', 1], ['ap', 'cl'], ['vatout', 'cl'], ['wagespay', 'cl'], ['loanst', 'cl'], ['loanlt', 'ncl'],
  ['capital', 'eq'], ['retained', 'eq'], ['sales', 'rev'], ['service', 'rev'], ['cogs', 'exp'], ['wages', 'exp'], ['rent', 'exp'], ['util', 'exp'], ['depexp', 'exp'], ['interest', 'exp'], ['other', 'exp']];
function mxDefAccounts(){ return MX_ACC0.map(([id, ty, contra]) => ({id, ty, k: 'mx_ac_' + id, contra: !!contra})); }
const mxAccName = a => a.k ? t(a.k) : a.n;
const MX_TYPES = ['ca', 'nca', 'cl', 'ncl', 'eq', 'rev', 'exp'];
const mxDebitNormal = a => (['ca', 'nca', 'exp'].includes(a.ty)) !== !!a.contra;
function mxEntryBal(en){ let d = 0, c = 0; (en.lines || []).forEach(l => { d += +l.dr || 0; c += +l.cr || 0; }); return {d, c, ok: Math.abs(d - c) < 0.005 && d > 0}; }
function mxLedger(){
  const A = mxData().acct, L = {};
  A.accounts.forEach(a => { L[a.id] = {a, dr: [], cr: [], td: 0, tc: 0}; });
  A.entries.forEach((en, ei) => { if (!mxEntryBal(en).ok) return; (en.lines || []).forEach(l => { const x = L[l.acc]; if (!x) return; if (+l.dr){ x.dr.push([ei + 1, +l.dr]); x.td += +l.dr; } if (+l.cr){ x.cr.push([ei + 1, +l.cr]); x.tc += +l.cr; } }); });
  Object.values(L).forEach(x => { x.bal = mxDebitNormal(x.a) ? x.td - x.tc : x.tc - x.td; });
  return L;
}
const M2a = x => mxFmt(x, 2);
function mxAcctHTML(){
  const A = mxData().acct, at = MX.at;
  const sub = `<div class="seg mx-subseg">${['journal', 'T', 'TB', 'reports'].map(k => `<button type="button" data-mxat="${k}" aria-pressed="${at === k}">${mE(t({journal: 'mx_aJournal', T: 'mx_aT', TB: 'mx_aTB', reports: 'mx_aReports'}[k]))}</button>`).join('')}</div>`;
  const tools = `<div class="btnrow"><button type="button" class="mv" id="mx_aSample">📘 ${mE(t('mx_aSample'))}</button><button type="button" class="mv${MX.sure === 'aclr' ? ' warn' : ''}" id="mx_aClr">${mE(t(MX.sure === 'aclr' ? 'mx_aClearQ' : 'mx_aClear'))}</button></div>`;
  if (at === 'journal'){
    const opts = sel => A.accounts.map(a => `<option value="${mE(a.id)}"${a.id === sel ? ' selected' : ''}>${mE(mxAccName(a))}</option>`).join('');
    const ents = A.entries.map((en, ei) => { const b = mxEntryBal(en);
      return `<div class="mx-entry" data-e="${ei}"><div class="mx-eh"><b>#${ei + 1}</b><input type="date" data-ae="date" value="${mE(en.date || '')}" aria-label="${mE(t('mx_aDate'))}"><input type="text" data-ae="desc" dir="auto" value="${mE(en.desc || '')}" placeholder="${mE(t('mx_aDesc'))}"><button type="button" class="mv" data-adel="${ei}" aria-label="${mE(t('mx_aDel'))}">🗑</button></div>
        <div class="mx-lines"><div class="mx-lh"><span>${mE(t('mx_aAcc'))}</span><span>${mE(t('mx_aDr'))}</span><span>${mE(t('mx_aCr'))}</span><span></span></div>${(en.lines || []).map((l, li) => `<div class="mx-line" data-li="${li}"><select data-al="acc">${opts(l.acc)}</select><input type="text" inputmode="decimal" dir="ltr" data-al="dr" value="${mE(l.dr || '')}" placeholder="${mE(t('mx_aDr'))}" aria-label="${mE(t('mx_aDr'))}"><input type="text" inputmode="decimal" dir="ltr" data-al="cr" value="${mE(l.cr || '')}" placeholder="${mE(t('mx_aCr'))}" aria-label="${mE(t('mx_aCr'))}"><button type="button" class="mv" data-alrm="${li}" aria-label="${mE(t('cv_rm'))}">✕</button></div>`).join('')}</div>
        <div class="mx-ef"><button type="button" class="mv" data-aadd="${ei}">+ ${mE(t('mx_aAddLine'))}</button><span class="mx-eb ${b.ok ? 'ok' : 'bad'}">${b.ok ? '✓ ' + mE(t('mx_aBal')) + ' · ' + M2a(b.d) : mE(t('mx_aUnbal', {d: M2a(Math.abs(b.d - b.c))}))}</span></div></div>`; }).join('');
    return sub + tools + (ents || `<p class="fine">${mE(t('mx_aEmpty'))}</p>`) + `<button type="button" class="gold-btn" id="mx_aNew">+ ${mE(t('mx_aNew'))}</button>
      <details class="adv"${MX.accOpen ? ' open' : ''} id="mx_accBox"><summary>${mE(t('mx_aAccounts'))} (${A.accounts.length})</summary><p class="fine">${mE(t('mx_accH'))}</p>
        <div class="mx-accl">${A.accounts.map((a, ai) => { const used = A.entries.some(en => (en.lines || []).some(l => l.acc === a.id));
          return `<div class="mx-acc"><input type="text" data-acn="${ai}" dir="auto" value="${mE(mxAccName(a))}" aria-label="${mE(t('mx_aAccName'))}"><select data-act2="${ai}" aria-label="${mE(t('mx_aAccType'))}">${MX_TYPES.map(ty => `<option value="${ty}"${a.ty === ty ? ' selected' : ''}>${mE(t('mx_ty_' + ty))}</option>`).join('')}</select>
            <label class="cv-chk mx-contra" title="${mE(t('mx_contraH'))}"><input type="checkbox" data-acc2="${ai}"${a.contra ? ' checked' : ''}> ${mE(t('mx_contra'))}</label>
            <button type="button" class="mv" data-acdel="${ai}"${used ? ' disabled title="' + mE(t('mx_accInUse')) + '"' : ''} aria-label="${mE(t('cv_rm'))}">🗑</button></div>`; }).join('')}</div>
        <button type="button" class="mv" id="mx_accReset">↺ ${mE(t('mx_accReset'))}</button>
        <div class="mx-newacc"><input type="text" id="mx_accN" dir="auto" placeholder="${mE(t('mx_aAccName'))}"><select id="mx_accT">${MX_TYPES.map(ty => `<option value="${ty}">${mE(t('mx_ty_' + ty))}</option>`).join('')}</select><button type="button" class="btn" id="mx_accAdd">+ ${mE(t('mx_aNewAcc'))}</button></div></details>`;
  }
  const L = mxLedger(), used = Object.values(L).filter(x => x.td || x.tc), skip = A.entries.some(en => !mxEntryBal(en).ok) ? `<p class="fine">⚠️ ${mE(t('mx_aSkip'))}</p>` : '';
  if (!used.length) return sub + tools + `<p class="fine">${mE(t('mx_aEmpty'))}</p>`;
  if (at === 'T'){
    return sub + skip + `<div class="mx-ts">${used.map(x => `<div class="mx-t"><div class="mx-tt">${mE(mxAccName(x.a))}</div><div class="mx-tb"><div class="mx-td">${x.dr.map(([e, v]) => `<div><small>#${e}</small> ${M2a(v)}</div>`).join('')}</div><div class="mx-tc">${x.cr.map(([e, v]) => `<div><small>#${e}</small> ${M2a(v)}</div>`).join('')}</div></div>
      <div class="mx-tb mx-tsum"><div>${M2a(x.td)}</div><div>${M2a(x.tc)}</div></div><div class="mx-tbal">${mE(t('mx_rBalance'))}: ${M2a(Math.abs(x.td - x.tc))} ${x.td >= x.tc ? mE(t('mx_aDr')) : mE(t('mx_aCr'))}</div></div>`).join('')}</div>`;
  }
  if (at === 'TB'){
    let sd = 0, sc = 0; const rows = used.map(x => { const v = x.td - x.tc; if (v >= 0) sd += v; else sc -= v; return `<tr><th>${mE(mxAccName(x.a))}</th><td>${v >= 0 ? M2a(v) : ''}</td><td>${v < 0 ? M2a(-v) : ''}</td></tr>`; }).join('');
    return sub + skip + `<div class="scroll"><table class="tbl"><thead><tr><th>${mE(t('mx_aAcc'))}</th><th>${mE(t('mx_aDr'))}</th><th>${mE(t('mx_aCr'))}</th></tr></thead><tbody>${rows}<tr class="tot"><th>${mE(t('mx_rTot'))}</th><td>${M2a(sd)}</td><td>${M2a(sc)}</td></tr></tbody></table></div>
      <p class="${Math.abs(sd - sc) < 0.005 ? 'mx-ok' : 'mx-err'}">${Math.abs(sd - sc) < 0.005 ? mE(t('mx_tbOk')) : mE(t('mx_rBad', {d: M2a(sd - sc)}))}</p>`;
  }
  /* reports */
  const by = ty => used.filter(x => x.a.ty === ty), sum = arr => arr.reduce((s, x) => s + x.bal, 0);
  const rev = by('rev'), exp = by('exp'), R = sum(rev), E = sum(exp), NI = R - E, cogs = (L.cogs && L.cogs.bal) || 0;
  const ca = by('ca'), nca = by('nca'), cl = by('cl'), ncl = by('ncl'), eq = by('eq');
  const CA = sum(ca), NCA = nca.reduce((s, x) => s + (x.a.contra ? -x.bal : x.bal), 0), CL = sum(cl), NCL = sum(ncl), EQ = sum(eq) + NI, TA = CA + NCA, TLE = CL + NCL + EQ;
  const list = (arr, neg) => arr.map(x => `<tr><td>${mE(mxAccName(x.a))}</td><td>${neg && x.a.contra ? '(' + M2a(x.bal) + ')' : M2a(x.bal)}</td></tr>`).join('');
  const sec = (h, rows, tot) => `<tr class="mx-rh"><th colspan="2">${mE(h)}</th></tr>${rows}${tot != null ? `<tr class="tot"><td>${mE(t('mx_rTot'))}</td><td>${M2a(tot)}</td></tr>` : ''}`;
  const inv = (L.inv && L.inv.bal) || 0, ratio = (a, b) => b ? mxFmt(a / b, 2) : '—', pc = (a, b) => b ? mxFmt(a / b * 100, 1) + '%' : '—';
  return sub + skip + `<h4 class="mx-h">${mE(t('mx_rIS'))}</h4><div class="scroll"><table class="tbl mx-rep"><tbody>${sec(t('mx_ty_rev'), list(rev), R)}${cogs ? `<tr class="tot"><td>${mE(t('mx_rGross'))}</td><td>${M2a(R - cogs)}</td></tr>` : ''}${sec(t('mx_ty_exp'), list(exp), E)}<tr class="tot mx-ni"><td>${mE(t('mx_rNI'))}</td><td>${M2a(NI)}</td></tr></tbody></table></div>
    <h4 class="mx-h">${mE(t('mx_rBS'))}</h4><div class="mx-bs"><div class="scroll"><table class="tbl mx-rep"><tbody>${sec(t('mx_ty_ca'), list(ca), CA)}${sec(t('mx_ty_nca'), list(nca, 1), NCA)}<tr class="tot mx-ni"><td>${mE(t('mx_rAssets'))}</td><td>${M2a(TA)}</td></tr></tbody></table></div>
      <div class="scroll"><table class="tbl mx-rep"><tbody>${sec(t('mx_ty_cl'), list(cl), CL)}${sec(t('mx_ty_ncl'), list(ncl), NCL)}${sec(t('mx_ty_eq'), list(eq) + `<tr><td>${mE(t('mx_rCurNI'))}</td><td>${M2a(NI)}</td></tr>`, EQ)}<tr class="tot mx-ni"><td>${mE(t('mx_rLE'))}</td><td>${M2a(TLE)}</td></tr></tbody></table></div></div>
    <p class="${Math.abs(TA - TLE) < 0.005 ? 'mx-ok' : 'mx-err'}">${Math.abs(TA - TLE) < 0.005 ? mE(t('mx_rOk')) : mE(t('mx_rBad', {d: M2a(TA - TLE)}))}</p>
    <h4 class="mx-h">${mE(t('mx_rRatios'))}</h4><div class="pm-list">${[['mx_ra_cur', ratio(CA, CL)], ['mx_ra_quick', ratio(CA - inv, CL)], ['mx_ra_de', ratio(CL + NCL, EQ)], ['mx_ra_gm', pc(R - cogs, R)], ['mx_ra_nm', pc(NI, R)], ['mx_ra_roa', pc(NI, TA)], ['mx_ra_roe', pc(NI, EQ)]].map(([k, v]) => `<div><dt>${mE(t(k))}</dt><dd dir="ltr">${v}</dd></div>`).join('')}</div>`;
}
function mxAcctSample(){
  const y = new Date().getFullYear() + '-01-';
  const E = (dd, desc, lines) => ({date: y + dd, desc, lines: lines.map(([acc, dr, cr]) => ({acc, dr: dr || '', cr: cr || ''}))});
  const he = typeof lang === 'string' && lang === 'he';
  return [E('02', he ? 'השקעת בעלים' : 'Owner investment', [['bank', 100000], ['capital', 0, 100000]]), E('03', he ? 'רכישת ציוד באשראי' : 'Equipment on credit', [['equip', 40000], ['ap', 0, 40000]]),
    E('05', he ? 'קניית מלאי במזומן' : 'Inventory for cash', [['inv', 30000], ['bank', 0, 30000]]), E('12', he ? 'מכירה באשראי' : 'Sale on credit', [['ar', 45000], ['sales', 0, 45000]]),
    E('12', he ? 'עלות המכר' : 'Cost of goods sold', [['cogs', 20000], ['inv', 0, 20000]]), E('20', he ? 'גבייה מלקוחות' : 'Collected from customers', [['bank', 30000], ['ar', 0, 30000]]),
    E('28', he ? 'תשלום שכר ושכירות' : 'Wages and rent paid', [['wages', 12000], ['rent', 5000], ['bank', 0, 17000]]), E('31', he ? 'פחת ציוד' : 'Equipment depreciation', [['depexp', 1000], ['accdep', 0, 1000]]),
    E('31', he ? 'תשלום לספק' : 'Paid supplier', [['ap', 15000], ['bank', 0, 15000]])];
}

/* ---------- graphs ---------- */
const MX_GC = ['#2A5FD6', '#E0900A', '#14A66B', '#D2523B', '#7C3AED'];
function mxGraphHTML(){
  const g = mxData().graph;
  return `<p class="fine">${mE(t('mx_gH'))}</p>
    <div class="mx-gfns">${g.fns.map((f, i) => `<div class="mx-gfn"><span class="mx-gdot" style="background:${MX_GC[i]}"></span><span dir="ltr">y =</span><input type="text" data-mxg="${i}" dir="ltr" value="${mE(f)}" autocomplete="off" spellcheck="false"><button type="button" class="mv" data-mxgrm="${i}" aria-label="${mE(t('cv_rm'))}">✕</button></div>`).join('')}
      ${g.fns.length < 5 ? `<button type="button" class="mv" id="mx_gAdd">+ ${mE(t('mx_gAdd'))}</button>` : ''}</div>
    <div class="mx-gbar"><label>${mE(t('mx_gFrom'))} <input type="text" inputmode="decimal" id="mx_gx0" dir="ltr" value="${mE(g.x0)}"></label><label>${mE(t('mx_gTo'))} <input type="text" inputmode="decimal" id="mx_gx1" dir="ltr" value="${mE(g.x1)}"></label>
      <button type="button" class="mv" data-mxgz="0.5" aria-label="${mE(t('mx_gZin'))}">＋</button><button type="button" class="mv" data-mxgz="2" aria-label="${mE(t('mx_gZout'))}">－</button><button type="button" class="mv" id="mx_gRes">${mE(t('mx_gReset'))}</button></div>
    <div class="mx-gwrap"><canvas id="mx_cv" height="340"></canvas><div class="mx-gread" id="mx_gread" dir="ltr"></div></div>
    <div id="mx_gan" class="mx-gan"></div>`;
}
function mxGFuncs(){
  const g = mxData().graph, S = MX.scope || {v: {}, f: {}};
  return g.fns.map((src, i) => { try { const n = mxParse(src); return {i, src, f: x => { try { const v = mxEval(n, {v: Object.assign({}, S.v, {x}), f: S.f}); return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; } }}; } catch (e) { return {i, src, f: () => NaN, bad: true}; } });
}
function mxDraw(){
  const cv = $('#mx_cv'); if (!cv) return; const g = mxData().graph, F = mxGFuncs();
  const W = cv.clientWidth || 340, H = 340, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; const cx = cv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const x0 = +g.x0, x1 = +g.x1; if (!(x1 > x0)) return;
  /* y range from the data */
  let ys = []; F.forEach(fn => { for (let k = 0; k <= 200; k++){ const y = fn.f(x0 + (x1 - x0) * k / 200); if (isFinite(y)) ys.push(y); } });
  ys.sort((a, b) => a - b); let y0 = ys.length ? ys[Math.floor(ys.length * 0.02)] : -10, y1 = ys.length ? ys[Math.ceil(ys.length * 0.98) - 1] : 10;
  if (g.y0 != null && g.y1 != null){ y0 = g.y0; y1 = g.y1; } if (!(y1 > y0)){ y0 -= 1; y1 += 1; } const pad = (y1 - y0) * 0.1; y0 -= pad; y1 += pad;
  MX.gv = {x0, x1, y0, y1, W, H};
  const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H;
  const css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim() || '#222', line = 'rgba(127,127,127,.25)';
  cx.clearRect(0, 0, W, H); cx.direction = 'ltr';
  const step = v => { const r = v / 8, p = Math.pow(10, Math.floor(Math.log10(r))); return [1, 2, 5, 10].map(m => m * p).find(s => s >= r); };
  const sx = step(x1 - x0), sy = step(y1 - y0);
  cx.lineWidth = 1; cx.strokeStyle = line; cx.fillStyle = ink; cx.font = '11px sans-serif'; cx.textAlign = 'center';
  for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx){ cx.beginPath(); cx.moveTo(X(x), 0); cx.lineTo(X(x), H); cx.stroke(); if (Math.abs(x) > 1e-9) cx.fillText(mxFmt(+x.toPrecision(6)), X(x), Math.min(H - 4, Math.max(12, Y(0) + 13))); }
  cx.textAlign = 'left';
  for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy){ cx.beginPath(); cx.moveTo(0, Y(y)); cx.lineTo(W, Y(y)); cx.stroke(); if (Math.abs(y) > 1e-9) cx.fillText(mxFmt(+y.toPrecision(6)), Math.min(W - 40, Math.max(3, X(0) + 4)), Y(y) - 3); }
  cx.strokeStyle = ink; cx.lineWidth = 1.4; cx.beginPath(); if (y0 < 0 && y1 > 0){ cx.moveTo(0, Y(0)); cx.lineTo(W, Y(0)); } if (x0 < 0 && x1 > 0){ cx.moveTo(X(0), 0); cx.lineTo(X(0), H); } cx.stroke();
  F.forEach(fn => {
    cx.strokeStyle = MX_GC[fn.i]; cx.lineWidth = 2.2; cx.beginPath(); let on = false, py = null;
    for (let px = 0; px <= W; px += 1){ const x = x0 + (x1 - x0) * px / W, y = fn.f(x); if (!isFinite(y) || (py != null && Math.abs(Y(y) - py) > H * 2)){ on = false; py = null; continue; } const yy = Y(y); if (!on){ cx.moveTo(px, yy); on = true; } else cx.lineTo(px, yy); py = yy; }
    cx.stroke();
  });
  if (MX.gpt != null){ const x = MX.gpt; cx.strokeStyle = 'rgba(127,127,127,.6)'; cx.setLineDash([4, 4]); cx.beginPath(); cx.moveTo(X(x), 0); cx.lineTo(X(x), H); cx.stroke(); cx.setLineDash([]);
    const rd = $('#mx_gread'); if (rd) rd.innerHTML = `x = ${mE(mxFmt(x, 4))}` + F.map(fn => { const y = fn.f(x); if (isFinite(y)){ cx.fillStyle = MX_GC[fn.i]; cx.beginPath(); cx.arc(X(x), Y(y), 4, 0, 7); cx.fill(); } return ` · <span style="color:${MX_GC[fn.i]}">y${fn.i + 1} = ${mE(isFinite(y) ? mxFmt(y, 4) : '—')}</span>`; }).join(''); }
  mxAnalyse(F, x0, x1);
}
function mxAnalyse(F, x0, x1){
  const box = $('#mx_gan'); if (!box) return; const N = 800, fmt = v => mxFmt(+v.toPrecision(8), 4);
  const bis = (f, a, b) => { let fa = f(a); for (let i = 0; i < 60; i++){ const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
  const scan = f => { const R = []; let px = x0, pv = f(x0); for (let k = 1; k <= N; k++){ const x = x0 + (x1 - x0) * k / N, v = f(x); if (isFinite(v) && isFinite(pv)){ if (v === 0) R.push(x); else if (pv * v < 0){ const r = bis(f, px, x); if (Math.abs(f(r)) < 1e-6 * (1 + Math.abs(v - pv) * 1e3)) R.push(r); } } px = x; pv = v; } return R.filter((r, i, a) => !i || Math.abs(r - a[i - 1]) > (x1 - x0) / N); };
  const rows = F.filter(fn => !fn.bad).map(fn => {
    const roots = scan(fn.f), d = x => (fn.f(x + 1e-5) - fn.f(x - 1e-5)) / 2e-5, crit = scan(d), mins = [], maxs = [];
    crit.forEach(x => { const s = (fn.f(x + 1e-3) + fn.f(x - 1e-3)) / 2 - fn.f(x); if (s > 0) mins.push(x); else if (s < 0) maxs.push(x); });
    const y0 = fn.f(0), pts = arr => arr.length ? arr.slice(0, 8).map(x => `(${fmt(x)}, ${fmt(fn.f(x))})`).join(' ') : t('mx_gNone');
    return `<div class="mx-gr"><b style="color:${MX_GC[fn.i]}">y${fn.i + 1} = ${mE(fn.src)}</b><div>${mE(t('mx_gRoots'))}: <span dir="ltr">${roots.length ? roots.slice(0, 10).map(fmt).join(', ') : mE(t('mx_gNone'))}</span></div>
      <div>${mE(t('mx_gYint'))}: <span dir="ltr">${isFinite(y0) && x0 <= 0 && x1 >= 0 ? fmt(y0) : '—'}</span></div><div>${mE(t('mx_gMin'))}: <span dir="ltr">${pts(mins)}</span></div><div>${mE(t('mx_gMax'))}: <span dir="ltr">${pts(maxs)}</span></div></div>`;
  });
  const inter = []; const G = F.filter(fn => !fn.bad);
  for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++){ const h = x => G[i].f(x) - G[j].f(x); scan(h).slice(0, 6).forEach(x => inter.push(`y${G[i].i + 1}∩y${G[j].i + 1}: (${fmt(x)}, ${fmt(G[i].f(x))})`)); }
  box.innerHTML = `<h4 class="mx-h">${mE(t('mx_gAnalysis'))}</h4>${rows.join('')}${G.length > 1 ? `<div class="mx-gr"><b>${mE(t('mx_gInter'))}</b><div dir="ltr">${inter.length ? inter.join('<br>') : mE(t('mx_gNone'))}</div></div>` : ''}`;
}

/* ---------- AI explanation ---------- */
async function mxAI(prompt, outId, btn){
  const o = $('#' + outId); if (!o) return;
  if (typeof cvAiOk !== 'function' || !cvAiOk()){ o.hidden = false; o.textContent = t('cv_aiNo'); return; }
  const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('mx_aiWait');
  const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[typeof lang === 'string' && ['he', 'ar', 'en'].includes(lang) ? lang : 'en'];
  try { const r = await cvAsk(`You are a patient maths, finance and accounting teacher. Explain in ${UL}, step by step and in full detail, how to solve the following, showing every formula and intermediate result with numbered steps. Keep maths in plain text (use ^, sqrt, /). Finish with the final answer.\n\n${prompt}`); o.hidden = false; o.textContent = r || t('cv_aiErr'); }
  catch (e){ o.hidden = false; o.textContent = e && e.message === 'noai' ? t('cv_aiNo') : t('cv_aiErr'); }
  finally { btn.disabled = false; btn.textContent = old; }
}

/* ---------- scan & practice: a photo of an exercise/exam → transcription, full solution, independent check ---------- */
MX.imgs = [];
function mxScanEngine(){
  try { if (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) return typeof PH === 'object' && PH && PH.ok ? 'claude' : '';
    return typeof gemKey === 'function' && gemKey() ? 'gemini' : ''; } catch (e) { return ''; }
}
function mxScanHTML(){
  const d = mxData(), sc = d.scan || {}, eng = mxScanEngine();
  return `<p class="fine">${mE(t('mx_scH'))}</p>${eng ? '' : `<div class="gk-st new">${mE(t('mx_scNoAI'))}</div>`}
    <div class="mx-fgrid"><div class="field cv-f"><label for="mx_scSubj">${mE(t('mx_scSubj'))}</label><select id="mx_scSubj">${['auto', 'math', 'calc', 'stat', 'fin', 'acct', 'eco'].map(k => `<option value="${k}"${(sc.subj || 'auto') === k ? ' selected' : ''}>${mE(t('mx_sc_' + k))}</option>`).join('')}</select></div>
      <div class="field cv-f"><label for="mx_scMode">${mE(t('mx_scMode'))}</label><select id="mx_scMode">${['full', 'practice'].map(k => `<option value="${k}"${(sc.mode || 'full') === k ? ' selected' : ''}>${mE(t('mx_sc_' + k))}</option>`).join('')}</select></div></div>
    <div class="btnrow"><button type="button" class="btn" id="mx_scCam">📷 ${mE(t('mx_scCam'))}</button><button type="button" class="btn" id="mx_scPick">🖼️ ${mE(t('mx_scPick'))}</button>
      <input type="file" accept="image/*" multiple data-mxfile hidden><input type="file" accept="image/*" capture="environment" data-mxfile data-cam hidden></div>
    <div class="mx-scimgs">${MX.imgs.map((x, i) => `<span class="mx-scimg"><img src="${x.url}" alt=""><button type="button" data-scrm="${i}" aria-label="${mE(t('cv_rm'))}">✕</button></span>`).join('')}</div>
    ${MX.imgs.length ? `<p class="fine">${mE(t('mx_scPages', {n: MX.imgs.length}))}</p><div class="btnrow"><button type="button" class="gold-btn" id="mx_scGo"${eng ? '' : ' disabled'}>✨ ${mE(t('mx_scGo'))}</button><button type="button" class="mv" id="mx_scClr">${mE(t('mx_scClear'))}</button></div>` : ''}
    <div id="mx_scOut" aria-live="polite">${sc.res ? mxScanResHTML(sc.res, sc.mode) : ''}</div>`;
}
/* run the AI's own check expression through the calculator and compare it with the numbers in its answer */
function mxScanVerify(q){
  const ck = String(q.check || '').trim(); if (!ck) return {k: 'none'};
  let v; try { v = mxEval(mxParse(ck), {v: {}, f: {}}); } catch (e) { return {k: 'none'}; }
  if (typeof v !== 'number' || !isFinite(v)) return {k: 'none'};
  const nums = (String(q.answer || '').replace(/(\d),(\d{3})/g, '$1$2').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const close = x => Math.abs(x - v) <= Math.max(0.006, Math.abs(v) * 0.005) || Math.abs(x - v * 100) <= Math.max(0.006, Math.abs(v * 100) * 0.005);
  return {k: nums.some(close) ? 'ok' : 'diff', v};
}
function mxScanResHTML(res, mode){
  const Q = Array.isArray(res.questions) ? res.questions : [];
  if (!Q.length) return `<div class="mx-card"><span class="mx-err">${mE(t('mx_scFail'))}</span></div>`;
  return Q.map((q, i) => {
    const ver = mxScanVerify(q), steps = (Array.isArray(q.steps) ? q.steps : [String(q.steps || '')]).filter(Boolean);
    const vtxt = ver.k === 'ok' ? `<div class="mx-ok">${mE(t('mx_scOk', {v: mxFmt(ver.v)}))}</div>` : ver.k === 'diff' ? `<div class="mx-err">${mE(t('mx_scDiff', {v: mxFmt(ver.v)}))}</div>` : `<div class="mx-sub">${mE(t('mx_scNoCheck'))}</div>`;
    const sol = `<div class="mx-scsol"${mode === 'practice' ? ' hidden' : ''} id="mxsol${i}"><b>${mE(t('mx_scSteps'))}</b><ol>${steps.map(s => `<li dir="auto">${mE(s)}</li>`).join('')}</ol>
      <div class="mx-scans"><b>${mE(t('mx_scAns'))}:</b> <span dir="auto">${mE(q.answer || '')}</span></div>${vtxt}
      ${q.check ? `<div class="btnrow"><button type="button" class="mv" data-mxsend="${mE(q.check)}">➕ ${mE(t('mx_scToSheet'))}</button></div>` : ''}</div>`;
    const ed = `<details class="mx-sced"><summary>✏️ ${mE(t('mx_edit'))}</summary>
      <div class="field wide cv-f"><label>${mE(t('mx_scTextL'))}</label><textarea data-sce="text" data-q="${i}" rows="3" dir="auto">${mE(q.text || '')}</textarea></div>
      <div class="field wide cv-f"><label>${mE(t('mx_scStepsL'))}</label><textarea data-sce="steps" data-q="${i}" rows="5" dir="auto">${mE(steps.join('\n'))}</textarea></div>
      <div class="field wide cv-f"><label>${mE(t('mx_scAns'))}</label><input data-sce="answer" data-q="${i}" type="text" dir="auto" value="${mE(q.answer || '')}"></div>
      <div class="field wide cv-f"><label>${mE(t('mx_scCheckL'))}</label><input data-sce="check" data-q="${i}" type="text" dir="ltr" value="${mE(q.check || '')}"></div>
      <div class="btnrow"><button type="button" class="btn" data-scsave="${i}">✓ ${mE(t('mx_scSaveV'))}</button><button type="button" class="mv" data-scre="${i}">✨ ${mE(t('mx_scResolve'))}</button><button type="button" class="mv" data-scdel="${i}">🗑 ${mE(t('cv_rm'))}</button></div></details>`;
    return `<div class="mx-card mx-scq"><div class="mx-lab">${mE(t('mx_scQ', {n: q.n || i + 1}))}${q.topic ? ' · ' + mE(q.topic) : ''}</div><div class="mx-sctext" dir="auto">${mE(q.text || '')}</div>
      ${mode === 'practice' && q.hint ? `<details class="mx-steps"><summary>💡 ${mE(t('mx_scHint'))}</summary><div dir="auto">${mE(q.hint)}</div></details><button type="button" class="btn" data-scshow="${i}">${mE(t('mx_scShow'))}</button>` : ''}${sol}${ed}</div>`;
  }).join('') + (res.notes ? `<div class="mx-card"><b>${mE(t('mx_scNote'))}:</b> <span dir="auto">${mE(res.notes)}</span></div>` : '') + `<p class="fine">${mE(t('mx_scDisc'))}</p>`;
}
async function mxScanAdd(files){
  for (const f of Array.from(files || []).slice(0, 4 - MX.imgs.length)){
    if (!/^image\//.test(f.type)) continue;
    try { const blob = typeof phShrink === 'function' ? await phShrink(f) : f; MX.imgs.push({blob, url: URL.createObjectURL(blob)}); } catch (e) {}
  }
  mxRender();
}
const mxB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
async function mxScanRun(btn){
  const eng = mxScanEngine(); if (!eng || !MX.imgs.length) return;
  const d = mxData(), subj = ($('#mx_scSubj') || {}).value || 'auto', mode = ($('#mx_scMode') || {}).value || 'full';
  const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[typeof lang === 'string' && ['he', 'ar', 'en'].includes(lang) ? lang : 'en'];
  const prompt = `You are an expert teacher and exam grader in mathematics, statistics, economics, finance and accounting.${subj !== 'auto' ? ' Subject: ' + ({math: 'mathematics', calc: 'calculus', stat: 'statistics and probability', fin: 'finance and investments', acct: 'financial accounting', eco: 'economics'}[subj]) + '.' : ''}
The image(s) contain exercise or exam questions. For EACH question:
1. Transcribe it exactly, in its original language (keep numbers and symbols).
2. Name the topic.
3. Solve it completely and rigorously, step by step, exactly as an exam answer should look: state the formula, substitute the numbers, show every intermediate result, keep enough decimal places, and state units. For accounting, write journal entries as "Dr Account amount / Cr Account amount" lines and tables as text.
4. Give the final answer clearly.
5. Give "check": ONE expression in this calculator's syntax that computes the main numeric final answer (or "" if the answer is not a number). Syntax: + - * / ^ ( ), sqrt(), ln(), log(), exp(), sin()/cos()/tan() (radians), ncr(n,k), normcdf(x,mu,sd), norminv(p,mu,sd), binompdf(n,p,k), binomcdf(n,p,k), poissonpdf(lambda,k), mean([..]), std([..]), npv(rate,[cf0,cf1,..]), irr([cf0,..]), pmt(rate,nper,pv), fv(rate,nper,pmt,pv), pv(rate,nper,pmt,fv), bondprice(face,coupon,ytm,years,freq), bscall(S,K,T,r,sigma). Rates as decimals (0.05).
6. Give "hint": a first nudge that does not reveal the answer.
Write topic, steps, answer and hint in ${UL}. Return JSON only:
{"questions":[{"n":"1","text":"...","topic":"...","hint":"...","steps":["step 1 ...","step 2 ..."],"answer":"...","check":"..."}],"notes":"anything unreadable or ambiguous, else empty"}`;
  const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('mx_scWait');
  const out = $('#mx_scOut'); if (out) out.innerHTML = `<div class="mx-card"><span class="mx-sub">⏳ ${mE(t('mx_scWait'))}</span></div>`;
  try {
    let res;
    if (eng === 'claude'){
      try { res = await PH.s.json(prompt, {images: MX.imgs.map(x => x.blob), cache: false, modelTier: 'complex'}); }
      catch (e){ const r = await PH.s(prompt, {images: MX.imgs.map(x => x.blob), cache: false, modelTier: 'complex'}); res = mxJSON(r && r.text); }
    } else {
      const parts = [{text: prompt}]; for (const x of MX.imgs) parts.push({inline_data: {mime_type: 'image/jpeg', data: await mxB64(x.blob)}});
      const txt = await gemTry([SET.gmodel].concat(GEM_FALLBACK), gemKey(), [{role: 'user', parts}], {generationConfig: {responseMimeType: 'application/json', temperature: 0.1}});
      res = mxJSON(txt);
    }
    if (!res || !Array.isArray(res.questions)) throw new Error('fmt');
    d.scan = {res, mode, subj, at: Date.now()}; mxSave();
    if (out) out.innerHTML = mxScanResHTML(res, mode);
  } catch (e){ if (out) out.innerHTML = `<div class="mx-card"><span class="mx-err">${mE(e && e.code && typeof aiCodeText === 'function' ? aiCodeText(e.code) : t('mx_scFail'))}</span></div>`; }
  finally { if (btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}
/* solve one (edited) question again from its text, no image needed */
async function mxScanResolve(i, btn){
  const d = mxData(), res = d.scan.res, q = res.questions[i];
  if (typeof cvAiOk !== 'function' || !cvAiOk()){ toast(t('cv_aiNo')); return; }
  const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[typeof lang === 'string' && ['he', 'ar', 'en'].includes(lang) ? lang : 'en'];
  const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('mx_scWait');
  try {
    const r = mxJSON(await cvAsk(`You are an expert teacher and exam grader. Solve this exam question completely and rigorously, step by step (formula, substitution, every intermediate result), in ${UL}. Return JSON only: {"topic":"...","hint":"...","steps":["..."],"answer":"...","check":"ONE calculator expression for the numeric final answer, or empty"}. Calculator syntax: + - * / ^, sqrt, ln, log, exp, normcdf(x,mu,sd), binompdf(n,p,k), ncr, npv(rate,[cf0,..]), irr([..]), pmt(rate,n,pv), fv, pv, mean([..]), std([..]).\n\nQuestion:\n${q.text}`));
    if (!r || !r.steps) throw new Error('fmt');
    Object.assign(q, {topic: r.topic || q.topic, hint: r.hint || q.hint, steps: r.steps, answer: r.answer || '', check: r.check || ''}); mxSave();
    const o = $('#mx_scOut'); if (o) o.innerHTML = mxScanResHTML(res, d.scan.mode);
  } catch (e){ toast(t('cv_aiErr')); if (btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}
const mxJSON = s => { const m = /\{[\s\S]*\}/.exec(String(s || '')); try { return m ? JSON.parse(m[0]) : null; } catch (e) { return null; } };
document.addEventListener('change', e => {
  const el = e.target; if (!el.closest || !el.closest('#mx_root')) return;
  if (el.hasAttribute && el.hasAttribute('data-mxfile')){ mxScanAdd(el.files); el.value = ''; return; }
  if (el.id === 'mx_scSubj' || el.id === 'mx_scMode'){ const d = mxData(); d.scan = Object.assign(d.scan || {}, {[el.id === 'mx_scSubj' ? 'subj' : 'mode']: el.value}); mxSave(); if (el.id === 'mx_scMode' && d.scan.res){ const o = $('#mx_scOut'); if (o) o.innerHTML = mxScanResHTML(d.scan.res, el.value); } }
});
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#mx_root')) return; let b;
  if (t0.closest('#mx_scCam')){ PHA_T = 'mx'; if ((SET.photoAccess || 'ask') === 'never') return toast(t('pha_blocked')); cvPick(true); return; }
  if (t0.closest('#mx_scPick')){ PHA_T = 'mx'; cvPhotoAsk(); return; }
  if ((b = t0.closest('[data-scrm]'))){ const x = MX.imgs.splice(+b.dataset.scrm, 1)[0]; if (x) URL.revokeObjectURL(x.url); mxRender(); return; }
  if (t0.closest('#mx_scClr')){ MX.imgs.forEach(x => URL.revokeObjectURL(x.url)); MX.imgs = []; const d = mxData(); if (d.scan) delete d.scan.res; mxSave(); mxRender(); return; }
  if ((b = t0.closest('#mx_scGo'))){ mxScanRun(b); return; }
  if ((b = t0.closest('[data-scsave]')) || (b = t0.closest('[data-scre]')) || (b = t0.closest('[data-scdel]'))){
    const d = mxData(), res = d.scan && d.scan.res; if (!res) return; const i = +(b.dataset.scsave || b.dataset.scre || b.dataset.scdel), q = res.questions[i]; if (!q) return;
    if (b.dataset.scdel != null){ res.questions.splice(i, 1); mxSave(); const o = $('#mx_scOut'); if (o) o.innerHTML = mxScanResHTML(res, d.scan.mode); return; }
    const card = b.closest('.mx-scq'), val = k => { const el = card.querySelector(`[data-sce="${k}"]`); return el ? el.value : ''; };
    q.text = val('text'); q.steps = val('steps').split('\n').map(x => x.trim()).filter(Boolean); q.answer = val('answer'); q.check = val('check').trim();
    if (b.dataset.scre != null){ mxScanResolve(i, b); return; }
    mxSave(); const o = $('#mx_scOut'); if (o) o.innerHTML = mxScanResHTML(res, d.scan.mode); toast(t('mx_scSaved')); return;
  }
  if ((b = t0.closest('[data-scshow]'))){ const s2 = $('#mxsol' + b.dataset.scshow); if (s2) s2.hidden = false; b.remove(); return; }
});

/* ---------- the panel ---------- */
function mxRender(){
  const root = $('#mx_root'); if (!root) return; mxData();
  root.innerHTML = `<div class="seg mx-tabs" role="tablist">${['sheet', 'fin', 'acct', 'graph', 'scan'].map(k => `<button type="button" role="tab" data-mxt="${k}" aria-pressed="${MX.tab === k}" aria-selected="${MX.tab === k}">${mE(t({sheet: 'mx_tSheet', fin: 'mx_tFin', acct: 'mx_tAcct', graph: 'mx_tGraph', scan: 'mx_tScan'}[k]))}</button>`).join('')}</div>
    <div class="mx-body">${MX.tab === 'sheet' ? mxSheetHTML() : MX.tab === 'fin' ? mxFinHTML() : MX.tab === 'acct' ? mxAcctHTML() : MX.tab === 'graph' ? mxGraphHTML() : mxScanHTML()}</div>`;
  if (MX.tab === 'sheet') mxRunSheet();
  if (MX.tab === 'fin') mxFinRun();
  if (MX.tab === 'graph'){ mxRunSheetSilent(); setTimeout(mxDraw, 30); }
}
function mxRunSheetSilent(){ const S = {v: {}, f: {}}; String(mxData().sheet || '').split('\n').forEach(raw => { const src = raw.trim(); if (!src || src.startsWith('#') || mxIsSym(src)) return; try { const n = mxParse(src); if (n.t === 'assign') S.v[n.n] = mxEval(n.e, S); else if (n.t === 'fdef') S.f[n.n] = {ps: n.ps, e: n.e, src}; } catch (e) {} }); MX.scope = S; }
function mxInsert(txt){
  const ta = $('#mx_in'); if (!ta) return; const s = ta.selectionStart || ta.value.length, e = ta.selectionEnd || s;
  ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e); const p = s + txt.length - (txt.endsWith('(') ? 0 : 0); ta.focus(); try { ta.setSelectionRange(p, p); } catch (er) {}
  mxData().sheet = ta.value; mxSave(); clearTimeout(MX.timer); MX.timer = setTimeout(mxRunSheet, 250);
}
document.addEventListener('input', e => {
  const el = e.target; if (!el.closest || !el.closest('#mx_root')) return; const d = mxData();
  if (el.id === 'mx_libq'){ MX.libQ = el.value; MX.libOpen = true; const box = el.closest('.mx-lib'); const pos = el.selectionStart; box.outerHTML = mxLibHTML(); const q = $('#mx_libq'); if (q){ q.focus(); try { q.setSelectionRange(pos, pos); } catch (er) {} } return; }
  if (el.id === 'mx_in'){ d.sheet = el.value; mxSave(); clearTimeout(MX.timer); MX.timer = setTimeout(mxRunSheet, 450); return; }
  if (el.dataset.mxp != null){ clearTimeout(MX.timer); MX.timer = setTimeout(mxFinRun, 350); return; }
  if (el.dataset.mxg != null){ d.graph.fns[+el.dataset.mxg] = el.value; mxSave(); clearTimeout(MX.timer); MX.timer = setTimeout(mxDraw, 300); return; }
  if (el.id === 'mx_gx0' || el.id === 'mx_gx1'){ const v = +el.value; if (isFinite(v)){ d.graph[el.id === 'mx_gx0' ? 'x0' : 'x1'] = v; d.graph.y0 = d.graph.y1 = null; mxSave(); clearTimeout(MX.timer); MX.timer = setTimeout(mxDraw, 300); } return; }
  if (el.dataset.acn != null){ const a = d.acct.accounts[+el.dataset.acn]; if (a){ a.n = el.value.trim() || mxAccName(a); delete a.k; mxSave(); } return; }
  const en = el.closest('.mx-entry'); if (en){
    const E = d.acct.entries[+en.dataset.e]; if (!E) return;
    if (el.dataset.ae){ E[el.dataset.ae] = el.value; mxSave(); return; }
    const ln = el.closest('.mx-line'); if (ln && el.dataset.al){ const L = E.lines[+ln.dataset.li]; L[el.dataset.al] = el.dataset.al === 'acc' ? el.value : el.value.replace(/[^\d.\-]/g, ''); if (el.dataset.al === 'dr' && +L.dr) L.cr = ''; if (el.dataset.al === 'cr' && +L.cr) L.dr = ''; mxSave();
      const b = mxEntryBal(E), tag = en.querySelector('.mx-eb'); if (tag){ tag.className = 'mx-eb ' + (b.ok ? 'ok' : 'bad'); tag.textContent = b.ok ? '✓ ' + t('mx_aBal') + ' · ' + M2a(b.d) : t('mx_aUnbal', {d: M2a(Math.abs(b.d - b.c))}); } }
  }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.closest || !el.closest('#mx_root')) return; const d = mxData();
  if (el.id === 'mx_sheets' && el.value){ d.sheet = (d.sheets || {})[el.value] || ''; mxSave(); const v = el.value; mxRender(); const s2 = $('#mx_sheets'); if (s2) s2.value = v; return; }
  if (el.id === 'mx_ex' && el.value){ d.sheet = MX_EX[el.value]; mxSave(); mxRender(); return; }
  if (el.id === 'mx_dec'){ d.dec = el.value; mxSave(); mxRunSheet(); return; }
  if (el.id === 'mx_fk'){ MX.finK = el.value; mxRender(); return; }
  if (el.dataset.al === 'acc'){ el.dispatchEvent(new Event('input', {bubbles: true})); }
  if (el.dataset.act2 != null){ const a = d.acct.accounts[+el.dataset.act2]; if (a){ a.ty = el.value; mxSave(); } return; }
  if (el.dataset.acc2 != null){ const a = d.acct.accounts[+el.dataset.acc2]; if (a){ a.contra = el.checked; mxSave(); } return; }
});
document.addEventListener('toggle', e => { if (e.target && e.target.classList && e.target.classList.contains('mx-lib')) MX.libOpen = e.target.open; }, true);
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#mx_root')) return; const d = mxData(); let b;
  if (!t0.closest('#mx_aClr')) MX.sure = '';
  if ((b = t0.closest('[data-mxt]'))){ MX.tab = b.dataset.mxt; mxRender(); return; }
  if ((b = t0.closest('[data-mxk]'))){ mxInsert(b.dataset.mxk); return; }
  if ((b = t0.closest('[data-mxdeg]'))){ d.deg = b.dataset.mxdeg === '1'; MXE.deg = d.deg; mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-mxlib]'))){ mxInsert((String(d.sheet || '').trim() && !/\n$/.test(($('#mx_in') || {}).value || '') ? '\n' : '') + b.dataset.mxlib.replace(/^n!$/, '5!').replace('x mod n', '17 mod 5')); return; }
  if (t0.closest('#mx_ssave')){ const nm = String(($('#mx_sname') || {}).value || '').trim() || ('#' + (Object.keys(d.sheets || {}).length + 1)); d.sheets = d.sheets || {}; d.sheets[nm] = d.sheet; mxSave(); toast(t('mx_ssaved', {n: nm})); mxRender(); return; }
  if (t0.closest('#mx_sdel')){ const k = ($('#mx_sheets') || {}).value; if (k && d.sheets[k] != null){ delete d.sheets[k]; mxSave(); mxRender(); } else toast(t('mx_spick')); return; }
  if (t0.closest('#mx_copyAll')){ const txt = $$('#mx_out .mx-card').map(c => c.querySelector('.mx-in').innerText.replace(/\s+/g, ' ').trim() + '  ' + c.querySelector('.mx-res').innerText.replace(/\s+/g, ' ').trim()).join('\n'); copyText(txt); toast(t('st_copied')); return; }
  if (t0.closest('#mx_clr')){ d.sheet = ''; mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-mxai]'))){ const i = +b.dataset.mxai, line = String(d.sheet || '').split('\n')[i] || ''; mxAI(`Exercise: ${line}\nCalculator result: ${MX.ai[i] || '(see steps)'}\nOther lines on the sheet (context):\n${d.sheet}`, 'mxai' + i, b); return; }
  if ((b = t0.closest('[data-mxaifin]'))){ mxAI(`${t('mx_f_' + MX.finK)} — ${MX.finLast || ''}`, 'mxaifin', b); return; }
  if ((b = t0.closest('[data-mxsend]'))){ d.sheet = (String(d.sheet || '').trim() ? d.sheet.replace(/\s*$/, '\n') : '') + b.dataset.mxsend; mxSave(); toast(t('mx_copied')); return; }
  if ((b = t0.closest('[data-mxat]'))){ MX.at = b.dataset.mxat; mxRender(); return; }
  if (t0.closest('#mx_aNew')){ d.acct.entries.push({date: new Date().toISOString().slice(0, 10), desc: '', lines: [{acc: 'bank', dr: '', cr: ''}, {acc: 'sales', dr: '', cr: ''}]}); mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-aadd]'))){ d.acct.entries[+b.dataset.aadd].lines.push({acc: d.acct.accounts[0].id, dr: '', cr: ''}); mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-alrm]'))){ const en = b.closest('.mx-entry'); d.acct.entries[+en.dataset.e].lines.splice(+b.dataset.alrm, 1); mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-adel]'))){ d.acct.entries.splice(+b.dataset.adel, 1); mxSave(); mxRender(); return; }
  if (t0.closest('#mx_aSample')){ d.acct.entries = mxAcctSample(); mxSave(); mxRender(); return; }
  if (t0.closest('#mx_aClr')){ if (MX.sure !== 'aclr'){ MX.sure = 'aclr'; mxRender(); return; } MX.sure = ''; d.acct.entries = []; mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-acdel]')) && !b.disabled){ d.acct.accounts.splice(+b.dataset.acdel, 1); MX.accOpen = true; mxSave(); mxRender(); return; }
  if (t0.closest('#mx_accReset')){ const used = new Set(d.acct.entries.flatMap(en => (en.lines || []).map(l => l.acc))); const def = mxDefAccounts(), ids = new Set(def.map(a => a.id)); d.acct.accounts = def.concat(d.acct.accounts.filter(a => !ids.has(a.id) && used.has(a.id))); MX.accOpen = true; mxSave(); mxRender(); toast(t('mx_accResetDone')); return; }
  if (t0.closest('#mx_accAdd')){ MX.accOpen = true; const n = String(($('#mx_accN') || {}).value || '').trim(); if (!n) return; d.acct.accounts.push({id: 'u' + Date.now().toString(36), n, ty: ($('#mx_accT') || {}).value || 'exp'}); mxSave(); mxRender(); return; }
  if (t0.closest('#mx_gAdd')){ d.graph.fns.push(''); mxSave(); mxRender(); setTimeout(() => { const i = $$('#mx_root [data-mxg]').pop(); if (i) i.focus(); }, 50); return; }
  if ((b = t0.closest('[data-mxgrm]'))){ d.graph.fns.splice(+b.dataset.mxgrm, 1); mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-mxgz]'))){ const g = d.graph, k = +b.dataset.mxgz, c = (g.x0 + g.x1) / 2, h = (g.x1 - g.x0) / 2 * k; g.x0 = +(c - h).toPrecision(8); g.x1 = +(c + h).toPrecision(8); g.y0 = g.y1 = null; mxSave(); mxRender(); return; }
  if (t0.closest('#mx_gRes')){ Object.assign(d.graph, {x0: -10, x1: 10, y0: null, y1: null}); MX.gpt = null; mxSave(); mxRender(); return; }
});
/* graph: drag to pan, tap to read */
document.addEventListener('pointerdown', e => {
  const cv = e.target.closest && e.target.closest('#mx_cv'); if (!cv || !MX.gv) return;
  const r = cv.getBoundingClientRect(), g = mxData().graph, st = {x: e.clientX, y: e.clientY, x0: g.x0, x1: g.x1, moved: false};
  const mv = ev => { const dx = ev.clientX - st.x; if (Math.abs(dx) > 4) st.moved = true; if (!st.moved) return; const span = st.x1 - st.x0, sh = -dx / r.width * span; g.x0 = +(st.x0 + sh).toPrecision(8); g.x1 = +(st.x1 + sh).toPrecision(8); mxDraw(); };
  const up = ev => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (!st.moved){ const v = MX.gv; MX.gpt = v.x0 + (ev.clientX - r.left) / r.width * (v.x1 - v.x0); mxDraw(); } else { mxSave(); const a = $('#mx_gx0'), b2 = $('#mx_gx1'); if (a) a.value = g.x0; if (b2) b2.value = g.x1; } };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
});
window.addEventListener('resize', () => { if (MX.tab === 'graph' && $('#mx_cv')) mxDraw(); });

/* ---------- wiring into the app ---------- */
CALC.mathx = () => null;
if (typeof svKind === 'function'){ const svKindMx = svKind; svKind = function(id){ return id === 'mathx' ? '' : svKindMx.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('mathx'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('mathx'); } catch (e) {}
{
  const activateMx = activate;
  activate = function(id){ const r = activateMx.apply(this, arguments); if (id === 'mathx' && !(typeof mbLocked === 'function' && mbLocked('mathx'))) mxRender(); return r; };
  const applyLangMx = applyLang;
  applyLang = function(){ const r = applyLangMx.apply(this, arguments); try { if (tab === 'mathx' && $('#mx_root') && $('#mx_root').children.length) mxRender(); } catch (e) {} return r; };
}
try { if (tab === 'mathx' && !(typeof mbLocked === 'function' && mbLocked('mathx'))) mxRender(); } catch (e) {}
