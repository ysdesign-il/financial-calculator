/* ================= advanced calculator: the engine — parser, evaluator, step-by-step reduction, math rendering, finance & economics functions =================
   Self-contained (no libraries). Symbolic algebra (solve / integrate / expand / factor / limit) loads the nerdamer library on demand. */
var MXE = {deg: false};
const MX_ERR = (k, p) => { const e = new Error(k); e.mx = k; e.p = p; return e; };
/* ---------- tokenizer ---------- */
function mxTok(src){
  const s = String(src).replace(/[×✕·]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/≠/g, '!=').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/‏|‎/g, '');
  const T = []; let i = 0;
  while (i < s.length){
    const c = s[i];
    if (/\s/.test(c)){ i++; continue; }
    let m;
    if ((m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)))){ T.push({t: 'num', v: parseFloat(m[0])}); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i)))){ T.push({t: 'id', v: m[0]}); i += m[0].length; continue; }
    if ((m = /^(<=|>=|==|!=)/.exec(s.slice(i)))){ T.push({t: 'op', v: m[0]}); i += 2; continue; }
    if ('+-*/^%!(),=[];<>'.includes(c)){ T.push({t: 'op', v: c}); i++; continue; }
    throw MX_ERR('mx_eChar', {c});
  }
  return T;
}
/* ---------- parser (precedence climbing, implicit multiplication) ---------- */
function mxParse(src){
  const T = mxTok(src); let p = 0;
  const peek = () => T[p], isOp = v => T[p] && T[p].t === 'op' && T[p].v === v;
  const eat = v => { if (!isOp(v)) throw MX_ERR('mx_eExpect', {c: v}); p++; };
  function list(close){ const a = []; if (isOp(close)) return a; a.push(expr()); while (isOp(',')){ p++; a.push(expr()); } return a; }
  function primary(){
    const k = peek(); if (!k) throw MX_ERR('mx_eEnd');
    if (k.t === 'num'){ p++; return {t: 'num', v: k.v}; }
    if (k.t === 'id'){
      p++;
      if (isOp('(')){ p++; const args = list(')'); eat(')'); return {t: 'fn', n: k.v, args}; }
      return {t: 'sym', n: k.v};
    }
    if (isOp('(')){ p++; const e = expr(); eat(')'); return {t: 'par', a: e}; }
    if (isOp('[')){ p++; const rows = [[]];
      if (!isOp(']')){ rows[0].push(expr()); while (isOp(',') || isOp(';')){ if (T[p].v === ';') rows.push([]); p++; rows[rows.length - 1].push(expr()); } }
      eat(']'); return {t: 'mat', rows}; }
    if (isOp('-')){ p++; return {t: 'neg', a: power()}; }
    if (isOp('+')){ p++; return power(); }
    throw MX_ERR('mx_eTok', {c: k.v});
  }
  function postfix(){ let e = primary(); for (;;){ if (isOp('!')){ p++; e = {t: 'fact', a: e}; } else if (isOp('%') && !(T[p + 1] && (T[p + 1].t === 'num' || T[p + 1].t === 'id' || (T[p + 1].t === 'op' && T[p + 1].v === '(')))){ p++; e = {t: 'pct', a: e}; } else break; } return e; }
  function power(){ const b = postfix(); if (isOp('^')){ p++; const ex = isOp('-') ? (p++, {t: 'neg', a: power()}) : power(); return {t: 'op', o: '^', a: b, b: ex}; } return b; }
  function implicitNext(){ const k = peek(); return k && (k.t === 'num' || (k.t === 'id' && k.v !== 'mod') || (k.t === 'op' && (k.v === '(' || k.v === '['))); }
  function term(){
    let e = unary();
    for (;;){
      if (T[p] && T[p].t === 'id' && T[p].v === 'mod'){ p++; e = {t: 'op', o: 'mod', a: e, b: unary()}; continue; }
      if (isOp('*') || isOp('/') || (isOp('%') && T[p + 1] && (T[p + 1].t === 'num' || T[p + 1].t === 'id' || T[p + 1].v === '('))){ const o = T[p].v; p++; e = {t: 'op', o: o === '%' ? 'mod' : o, a: e, b: unary()}; }
      else if (implicitNext()){ e = {t: 'op', o: '*', a: e, b: power(), imp: true}; }
      else break;
    }
    return e;
  }
  function unary(){ if (isOp('-')){ p++; return {t: 'neg', a: unary()}; } if (isOp('+')){ p++; return unary(); } return power(); }
  function arith(){ let e = term(); while (isOp('+') || isOp('-')){ const o = T[p].v; p++; let b = term(); if (b && b.t === 'pct') b = {t: 'op', o: '*', a: e, b}; e = {t: 'op', o, a: e, b}; } return e; }
  function cmp(){ let e = arith(); while (T[p] && T[p].t === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(T[p].v)){ const o = T[p].v; p++; e = {t: 'op', o, a: e, b: arith()}; } return e; }
  function expr(){ return cmp(); }
  function top(){
    const e = expr();
    if (isOp('=')){
      p++; const r = expr();
      if (e.t === 'sym') return {t: 'assign', n: e.n, e: r};
      if (e.t === 'fn' && e.args.every(a => a.t === 'sym')) return {t: 'fdef', n: e.n, ps: e.args.map(a => a.n), e: r};
      return {t: 'eq', a: e, b: r};
    }
    return e;
  }
  const r = top(); if (p < T.length) throw MX_ERR('mx_eTok', {c: T[p].v}); return r;
}
/* ---------- values ---------- */
const mxIsM = v => Array.isArray(v);
const mxRows = v => mxIsM(v) ? (mxIsM(v[0]) ? v : [v]) : [[v]];
function mxFlat(args){ const o = []; args.forEach(a => { if (mxIsM(a)) mxRows(a).forEach(r => r.forEach(x => o.push(x))); else o.push(a); }); return o; }
function mxNum(v, name){ if (typeof v !== 'number') throw MX_ERR('mx_eNum', {n: name || ''}); return v; }
const mxGamma = z => { if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * mxGamma(1 - z)); z -= 1; const g = 7, C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; let x = C[0]; for (let i = 1; i < g + 2; i++) x += C[i] / (z + i); const t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; };
const mxFact = n => { if (n < 0) throw MX_ERR('mx_eDomain'); if (Number.isInteger(n) && n <= 170){ let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; } return mxGamma(n + 1); };
/* matrix helpers */
function mxMatOp(o, A, B){
  const a = mxIsM(A), b = mxIsM(B);
  if (o === '*' && a && b){ const X = mxRows(A), Y = mxRows(B); if (X[0].length !== Y.length) throw MX_ERR('mx_eDim'); return X.map(r => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0))); }
  if (o === '^' && a){ let R = mxRows(A), n = B; if (!Number.isInteger(n)) throw MX_ERR('mx_eDim'); if (n < 0){ R = mxInv(R); n = -n; } let out = R.map((r, i) => r.map((_, j) => i === j ? 1 : 0)); for (let i = 0; i < n; i++) out = mxMatOp('*', out, R); return out; }
  const f = (x, y) => mxScalar(o, x, y);
  if (a && b){ const X = mxRows(A), Y = mxRows(B); if (X.length !== Y.length || X[0].length !== Y[0].length) throw MX_ERR('mx_eDim'); return X.map((r, i) => r.map((v, j) => f(v, Y[i][j]))); }
  if (a) return mxRows(A).map(r => r.map(v => f(v, B)));
  return mxRows(B).map(r => r.map(v => f(A, v)));
}
function mxDet(M){ M = mxRows(M); const n = M.length; if (M.some(r => r.length !== n)) throw MX_ERR('mx_eSquare'); const A = M.map(r => r.slice()); let d = 1; for (let i = 0; i < n; i++){ let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; if (Math.abs(A[p][i]) < 1e-14) return 0; if (p !== i){ [A[p], A[i]] = [A[i], A[p]]; d = -d; } d *= A[i][i]; for (let r = i + 1; r < n; r++){ const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; } } return d; }
function mxInv(M){ M = mxRows(M); const n = M.length; if (M.some(r => r.length !== n)) throw MX_ERR('mx_eSquare'); const A = M.map((r, i) => r.concat(r.map((_, j) => i === j ? 1 : 0))); for (let i = 0; i < n; i++){ let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; if (Math.abs(A[p][i]) < 1e-14) throw MX_ERR('mx_eSingular'); [A[p], A[i]] = [A[i], A[p]]; const d = A[i][i]; for (let c = 0; c < 2 * n; c++) A[i][c] /= d; for (let r = 0; r < n; r++) if (r !== i){ const f = A[r][i]; for (let c = 0; c < 2 * n; c++) A[r][c] -= f * A[i][c]; } } return A.map(r => r.slice(n)); }
function mxScalar(o, x, y){
  mxNum(x); mxNum(y);
  switch (o){
    case '+': return x + y; case '-': return x - y; case '*': return x * y;
    case '/': if (y === 0) throw MX_ERR('mx_eDiv0'); return x / y;
    case '^': { if (x < 0 && !Number.isInteger(y)){ for (let q = 1; q < 100; q += 2){ const pq = y * q; if (Math.abs(pq - Math.round(pq)) < 1e-9){ const v = Math.pow(-x, y); return Math.round(pq) % 2 ? -v : v; } } throw MX_ERR('mx_eDomain'); } const v = Math.pow(x, y); if (isNaN(v)) throw MX_ERR('mx_eDomain'); return v; } case 'mod': return ((x % y) + y) % y;
    case '<': return +(x < y); case '>': return +(x > y); case '<=': return +(x <= y); case '>=': return +(x >= y); case '==': return +(Math.abs(x - y) < 1e-12); case '!=': return +(Math.abs(x - y) >= 1e-12);
  }
  throw MX_ERR('mx_eTok', {c: o});
}
function mxBin(o, a, b){ return mxIsM(a) || mxIsM(b) ? mxMatOp(o, a, b) : mxScalar(o, a, b); }
/* ---------- built-in functions ---------- */
const mxT = x => MXE.deg ? x * Math.PI / 180 : x, mxTi = x => MXE.deg ? x * 180 / Math.PI : x;
/* an angle where tan/cot/sec/csc has no value: 90°+k·180° (or k·180° from 0°); in radians π/2+kπ within rounding */
const mxPole = (x, at) => { const d = MXE.deg ? x : x * 180 / Math.PI, k = (d - at) / 180; return Math.abs(k - Math.round(k)) < (MXE.deg ? 1e-12 : 1e-10); };
/* tiny rounding leftovers (cos 90° = 6e-17) shown as the exact value */
const mxSnap = v => Math.abs(v) < 1e-15 ? 0 : Math.abs(v - Math.round(v)) < 1e-15 ? Math.round(v) : v;
const MX_MATH = {
  sqrt: x => { if (x < 0) throw MX_ERR('mx_eDomain'); return Math.sqrt(x); }, cbrt: Math.cbrt, root: (x, n) => x < 0 && n % 2 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n), abs: x => mxIsM(x) ? mxDet(x) : Math.abs(x),
  exp: Math.exp, ln: x => { if (x <= 0) throw MX_ERR('mx_eDomain'); return Math.log(x); }, log: (x, b) => { if (x <= 0) throw MX_ERR('mx_eDomain'); return b == null ? Math.log10(x) : Math.log(x) / Math.log(b); }, log2: Math.log2, log10: Math.log10,
  sin: x => mxSnap(Math.sin(mxT(x))), cos: x => mxSnap(Math.cos(mxT(x))), tan: x => { if (mxPole(x, 90)) throw MX_ERR('mx_eDomain'); return mxSnap(Math.tan(mxT(x))); }, cot: x => { if (mxPole(x, 0)) throw MX_ERR('mx_eDomain'); return mxSnap(1 / Math.tan(mxT(x))); }, sec: x => { if (mxPole(x, 90)) throw MX_ERR('mx_eDomain'); return 1 / Math.cos(mxT(x)); }, csc: x => { if (mxPole(x, 0)) throw MX_ERR('mx_eDomain'); return 1 / Math.sin(mxT(x)); },
  asin: x => mxTi(Math.asin(x)), acos: x => mxTi(Math.acos(x)), atan: x => mxTi(Math.atan(x)), atan2: (y, x) => mxTi(Math.atan2(y, x)),
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
  floor: Math.floor, ceil: Math.ceil, round: (x, d) => { const k = Math.pow(10, d || 0); return Math.round(x * k) / k; }, trunc: Math.trunc, sign: Math.sign,
  fact: mxFact, gamma: mxGamma, ncr: (n, k) => Math.round(mxFact(n) / (mxFact(k) * mxFact(n - k))), npr: (n, k) => Math.round(mxFact(n) / mxFact(n - k)),
  gcd: (...a) => mxFlat(a).reduce((x, y) => { x = Math.abs(x); y = Math.abs(y); while (y){ [x, y] = [y, x % y]; } return x; }), lcm: (...a) => mxFlat(a).reduce((x, y) => Math.abs(x * y) / MX_MATH.gcd(x, y)),
  mod: (x, y) => mxScalar('mod', x, y), hypot: Math.hypot, deg: x => x * 180 / Math.PI, rad: x => x * Math.PI / 180,
  min: (...a) => Math.min(...mxFlat(a)), max: (...a) => Math.max(...mxFlat(a)), sum: (...a) => mxFlat(a).reduce((s, x) => s + x, 0), prod: (...a) => mxFlat(a).reduce((s, x) => s * x, 1),
  mean: (...a) => { const v = mxFlat(a); return v.reduce((s, x) => s + x, 0) / v.length; },
  median: (...a) => { const v = mxFlat(a).sort((x, y) => x - y), n = v.length; return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2; },
  mode: (...a) => { const c = {}; mxFlat(a).forEach(x => { c[x] = (c[x] || 0) + 1; }); return +Object.keys(c).sort((x, y) => c[y] - c[x])[0]; },
  variance: (...a) => { const v = mxFlat(a), m = MX_MATH.mean(v); return v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1); },
  varp: (...a) => { const v = mxFlat(a), m = MX_MATH.mean(v); return v.reduce((s, x) => s + (x - m) * (x - m), 0) / v.length; },
  std: (...a) => Math.sqrt(MX_MATH.variance(...a)), stdp: (...a) => Math.sqrt(MX_MATH.varp(...a)),
  det: mxDet, inv: mxInv, transpose: M => { const R = mxRows(M); return R[0].map((_, j) => R.map(r => r[j])); }, trace: M => mxRows(M).reduce((s, r, i) => s + r[i], 0),
  identity: n => Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => +(i === j))),
  linsolve: (A, b) => mxMatOp('*', mxInv(A), mxIsM(b) && mxRows(b).length === 1 ? MX_MATH.transpose(b) : b),
  dot: (a, b) => mxFlat([a]).reduce((s, x, i) => s + x * mxFlat([b])[i], 0), cross: (a, b) => { const x = mxFlat([a]), y = mxFlat([b]); return [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]]; },
  norm: a => Math.sqrt(mxFlat([a]).reduce((s, x) => s + x * x, 0)), len: a => mxFlat([a]).length
};
/* probability, regression, number theory, sequences */
function mxErf(x){ const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const mxNcdf = (x, m, s) => 0.5 * (1 + mxErf((x - (m || 0)) / ((s || 1) * Math.SQRT2)));
function mxNinv(p, m, s){ if (p <= 0 || p >= 1) throw MX_ERR('mx_eDomain'); let lo = -40, hi = 40; for (let i = 0; i < 200; i++){ const md = (lo + hi) / 2; if (mxNcdf(md, 0, 1) < p) lo = md; else hi = md; } return (m || 0) + (s || 1) * (lo + hi) / 2; }
function mxLinreg(xs, ys){ const x = mxFlat([xs]), y = mxFlat([ys]), n = x.length; if (n !== y.length || n < 2) throw MX_ERR('mx_eDim'); const mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++){ sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } const b = sxy / sxx; return {b, a: my - b * mx, r: sxy / Math.sqrt(sxx * syy), n}; }
function mxPrimeFactors(n){ n = Math.round(Math.abs(n)); const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0){ f.push(p); n /= p; } if (n > 1) f.push(n); return f; }
function mxRref(M){ const A = mxRows(M).map(r => r.slice()), R = A.length, C = A[0].length; let lead = 0; for (let r = 0; r < R && lead < C; r++){ let i = r; while (Math.abs(A[i][lead]) < 1e-12){ i++; if (i === R){ i = r; lead++; if (lead === C) return A; } } [A[i], A[r]] = [A[r], A[i]]; const lv = A[r][lead]; A[r] = A[r].map(v => v / lv); for (let k = 0; k < R; k++) if (k !== r){ const f = A[k][lead]; A[k] = A[k].map((v, j) => v - f * A[r][j]); } lead++; } return A.map(r => r.map(v => Math.abs(v) < 1e-12 ? 0 : v)); }
Object.assign(MX_MATH, {
  isprime: n => { n = Math.round(n); if (n < 2) return 0; for (let p = 2; p * p <= n; p++) if (n % p === 0) return 0; return 1; },
  factorint: n => mxPrimeFactors(n).reduce((o, p) => { const k = o.find(x => x[0] === p); if (k) k[1]++; else o.push([p, 1]); return o; }, []).map(([p, e]) => e > 1 ? p + '^' + e : String(p)).join(' · ') || '1',
  divisors: n => { n = Math.round(Math.abs(n)); const d = []; for (let i = 1; i * i <= n; i++) if (n % i === 0){ d.push(i); if (i * i !== n) d.push(n / i); } return d.sort((a, b) => a - b); },
  fib: n => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; },
  bin: n => Math.round(n).toString(2), hex: n => Math.round(n).toString(16).toUpperCase(), oct: n => Math.round(n).toString(8), tobase: (n, b) => Math.round(n).toString(b).toUpperCase(),
  erf: mxErf, beta: (a, b) => mxGamma(a) * mxGamma(b) / mxGamma(a + b),
  normpdf: (x, m, s) => { m = m || 0; s = s || 1; return Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)); }, normcdf: mxNcdf, norminv: mxNinv,
  binompdf: (n, p, k) => MX_MATH.ncr(n, k) * p ** k * (1 - p) ** (n - k), binomcdf: (n, p, k) => { let s = 0; for (let i = 0; i <= k; i++) s += MX_MATH.binompdf(n, p, i); return s; },
  poissonpdf: (l, k) => Math.exp(-l) * l ** k / mxFact(k), poissoncdf: (l, k) => { let s = 0; for (let i = 0; i <= k; i++) s += MX_MATH.poissonpdf(l, i); return s; },
  exppdf: (x, l) => x < 0 ? 0 : l * Math.exp(-l * x), expcdf: (x, l) => x < 0 ? 0 : 1 - Math.exp(-l * x), zscore: (x, m, s) => (x - m) / s,
  percentile: (d, p) => { const v = mxFlat([d]).sort((a, b) => a - b), i = (v.length - 1) * p / 100, lo = Math.floor(i); return v[lo] + (v[Math.min(lo + 1, v.length - 1)] - v[lo]) * (i - lo); },
  quartiles: d => [MX_MATH.percentile(d, 25), MX_MATH.percentile(d, 50), MX_MATH.percentile(d, 75)], iqr: d => MX_MATH.percentile(d, 75) - MX_MATH.percentile(d, 25),
  geomean: (...a) => { const v = mxFlat(a); return Math.exp(v.reduce((s, x) => s + Math.log(x), 0) / v.length); }, harmean: (...a) => { const v = mxFlat(a); return v.length / v.reduce((s, x) => s + 1 / x, 0); },
  range: (...a) => Math.max(...mxFlat(a)) - Math.min(...mxFlat(a)), count: (...a) => mxFlat(a).length,
  cov: (x, y) => { const a = mxFlat([x]), b = mxFlat([y]), ma = MX_MATH.mean(a), mb = MX_MATH.mean(b); return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / (a.length - 1); },
  corr: (x, y) => mxLinreg(x, y).r, slope: (x, y) => mxLinreg(x, y).b, intercept: (x, y) => mxLinreg(x, y).a, rsq: (x, y) => mxLinreg(x, y).r ** 2, linreg: (x, y) => { const L = mxLinreg(x, y); return [L.b, L.a]; },
  forecast: (x0, x, y) => { const L = mxLinreg(x, y); return L.a + L.b * x0; },
  rref: mxRref, rank: M => mxRref(M).filter(r => r.some(v => Math.abs(v) > 1e-10)).length,
  pctchange: (a, b) => (b - a) / a * 100, pctof: (part, whole) => part / whole * 100,
  arith: (a1, d, n) => n * (2 * a1 + (n - 1) * d) / 2, geom: (a1, r, n) => r === 1 ? a1 * n : a1 * (1 - r ** n) / (1 - r),
  gini: (...a) => { const v = mxFlat(a).sort((x, y) => x - y), n = v.length, s = v.reduce((x, y) => x + y, 0); return v.reduce((acc, x, i) => acc + (2 * (i + 1) - n - 1) * x, 0) / (n * s); },
  nsolve: null, quad: null
});
const MX_CONST = {pi: Math.PI, e: Math.E, phi: (1 + Math.sqrt(5)) / 2, tau: 2 * Math.PI, inf: Infinity};
/* ---------- finance & economics (each explains itself) ---------- */
const mxP = x => (Math.round(x * 1e6) / 1e4) + '%';
function mxPV(r, n, pmt, fv, type){ fv = fv || 0; type = type || 0; if (r === 0) return -(pmt * n + fv); const f = Math.pow(1 + r, n); return -(pmt * (1 + r * type) * (f - 1) / r + fv) / f; }
function mxFV(r, n, pmt, pv, type){ pv = pv || 0; type = type || 0; if (r === 0) return -(pv + pmt * n); const f = Math.pow(1 + r, n); return -(pv * f + pmt * (1 + r * type) * (f - 1) / r); }
function mxPMT(r, n, pv, fv, type){ fv = fv || 0; type = type || 0; if (r === 0) return -(pv + fv) / n; const f = Math.pow(1 + r, n); return -(r * (pv * f + fv)) / ((1 + r * type) * (f - 1)); }
function mxNPER(r, pmt, pv, fv, type){ fv = fv || 0; type = type || 0; if (r === 0) return -(pv + fv) / pmt; const z = pmt * (1 + r * type) / r; return Math.log((-fv + z) / (pv + z)) / Math.log(1 + r); }
function mxRATE(n, pmt, pv, fv, type, guess){ let r = guess || 0.05; for (let i = 0; i < 200; i++){ const f = mxFV(r, n, pmt, pv, type) - (fv || 0) * -1, h = 1e-7, d = (mxFV(r + h, n, pmt, pv, type) - mxFV(r - h, n, pmt, pv, type)) / (2 * h); const nr = r - (mxFV(r, n, pmt, pv, type) + (fv || 0)) / d; if (!isFinite(nr)) break; if (Math.abs(nr - r) < 1e-12) return nr; r = nr; } return r; }
const mxNPV = (r, cf) => cf.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
function mxIRR(cf, guess){ let r = guess || 0.1; for (let i = 0; i < 300; i++){ const f = mxNPV(r, cf), d = cf.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0); const nr = r - f / d; if (!isFinite(nr)) break; if (Math.abs(nr - r) < 1e-12) return nr; r = nr; }
  let lo = -0.9999, hi = 10; if (mxNPV(lo, cf) * mxNPV(hi, cf) > 0) throw MX_ERR('mx_eIrr'); for (let i = 0; i < 300; i++){ const m = (lo + hi) / 2; if (mxNPV(lo, cf) * mxNPV(m, cf) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
const N6 = x => mxFmt(x, 6), M2 = x => mxFmt(x, 2);
/* each: [params], fn → value, ex → {f: formula, s: substitution lines, tbl?} */
const MX_FIN = {
  pv: {ps: ['rate', 'nper', 'pmt', 'fv?', 'type?'], fn: mxPV, ex: (r, n, pmt, fv, ty) => ({f: 'PV = −[PMT·(1+r·type)·((1+r)^n − 1)/r + FV] / (1+r)^n', s: [`r = ${mxP(r)}, n = ${N6(n)}, PMT = ${M2(pmt)}, FV = ${M2(fv || 0)}, type = ${ty || 0}`, `(1+r)^n = ${N6(Math.pow(1 + r, n))}`]})},
  fv: {ps: ['rate', 'nper', 'pmt', 'pv?', 'type?'], fn: mxFV, ex: (r, n, pmt, pv, ty) => ({f: 'FV = −[PV·(1+r)^n + PMT·(1+r·type)·((1+r)^n − 1)/r]', s: [`r = ${mxP(r)}, n = ${N6(n)}, PMT = ${M2(pmt)}, PV = ${M2(pv || 0)}`, `(1+r)^n = ${N6(Math.pow(1 + r, n))}`]})},
  pmt: {ps: ['rate', 'nper', 'pv', 'fv?', 'type?'], fn: mxPMT, ex: (r, n, pv, fv, ty) => ({f: 'PMT = −r·[PV·(1+r)^n + FV] / [(1+r·type)·((1+r)^n − 1)]', s: [`r = ${mxP(r)}, n = ${N6(n)}, PV = ${M2(pv)}, FV = ${M2(fv || 0)}`, `(1+r)^n = ${N6(Math.pow(1 + r, n))}`, `${'Σ'} ${M2(-mxPMT(r, n, pv, fv, ty) * n)} = PMT × n`]})},
  nper: {ps: ['rate', 'pmt', 'pv', 'fv?', 'type?'], fn: mxNPER, ex: (r, pmt, pv) => ({f: 'n = ln[(PMT/r − FV)/(PMT/r + PV)] / ln(1+r)', s: [`r = ${mxP(r)}, PMT = ${M2(pmt)}, PV = ${M2(pv)}`]})},
  rate: {ps: ['nper', 'pmt', 'pv', 'fv?', 'type?'], fn: mxRATE, ex: () => ({f: 'FV(r) = 0 → Newton–Raphson', s: []})},
  npv: {ps: ['rate', 'cashflows[]'], fn: (r, cf) => mxNPV(r, mxFlat([cf])), ex: (r, cf) => { cf = mxFlat([cf]); return {f: 'NPV = Σ CFₜ / (1+r)ᵗ  (t = 0…n)', s: cf.map((c, t) => `t=${t}: ${M2(c)} / ${N6(Math.pow(1 + r, t))} = ${M2(c / Math.pow(1 + r, t))}`)}; }},
  irr: {ps: ['cashflows[]'], fn: cf => mxIRR(mxFlat([cf])), ex: cf => { cf = mxFlat([cf]); const r = mxIRR(cf); return {f: 'NPV(IRR) = Σ CFₜ / (1+IRR)ᵗ = 0', s: [`IRR = ${mxP(r)}`, `NPV @ IRR = ${M2(mxNPV(r, cf))}`]}; }},
  mirr: {ps: ['cashflows[]', 'finance_rate', 'reinvest_rate'], fn: (cf, fr, rr) => { cf = mxFlat([cf]); const n = cf.length - 1; const fvp = cf.reduce((s, c, t) => s + (c > 0 ? c * Math.pow(1 + rr, n - t) : 0), 0), pvn = cf.reduce((s, c, t) => s + (c < 0 ? c / Math.pow(1 + fr, t) : 0), 0); return Math.pow(fvp / -pvn, 1 / n) - 1; },
    ex: (cf, fr, rr) => ({f: 'MIRR = (FV⁺ / −PV⁻)^(1/n) − 1', s: [`n = ${mxFlat([cf]).length - 1}`]})},
  payback: {ps: ['cashflows[]'], fn: cf => { cf = mxFlat([cf]); let c = 0; for (let t = 0; t < cf.length; t++){ const prev = c; c += cf[t]; if (c >= 0 && t > 0) return t - 1 + (-prev) / cf[t]; } return NaN; },
    ex: cf => { cf = mxFlat([cf]); let c = 0; return {f: 'Payback = t − 1 + |cumulative CFₜ₋₁| / CFₜ', s: cf.map((x, t) => `t=${t}: Σ = ${M2(c += x)}`)}; }},
  dpayback: {ps: ['rate', 'cashflows[]'], fn: (r, cf) => { cf = mxFlat([cf]).map((x, t) => x / Math.pow(1 + r, t)); return MX_FIN.payback.fn(cf); }, ex: (r, cf) => ({f: 'Discounted payback: payback of CFₜ/(1+r)ᵗ', s: mxFlat([cf]).map((x, t) => `t=${t}: ${M2(x / Math.pow(1 + r, t))}`)})},
  profindex: {ps: ['rate', 'cashflows[]'], fn: (r, cf) => { cf = mxFlat([cf]); return mxNPV(r, [0].concat(cf.slice(1))) / -cf[0]; }, ex: () => ({f: 'PI = PV(future CF) / initial investment', s: []})},
  cagr: {ps: ['begin', 'end', 'years'], fn: (a, b, n) => Math.pow(b / a, 1 / n) - 1, ex: (a, b, n) => ({f: 'CAGR = (End / Begin)^(1/n) − 1', s: [`(${M2(b)} / ${M2(a)})^(1/${N6(n)}) − 1 = ${N6(Math.pow(b / a, 1 / n))} − 1`]})},
  effrate: {ps: ['nominal', 'periods'], fn: (j, m) => Math.pow(1 + j / m, m) - 1, ex: (j, m) => ({f: 'EAR = (1 + j/m)^m − 1', s: [`(1 + ${N6(j)}/${m})^${m} − 1`]})},
  nomrate: {ps: ['effective', 'periods'], fn: (i, m) => m * (Math.pow(1 + i, 1 / m) - 1), ex: () => ({f: 'j = m·[(1+EAR)^(1/m) − 1]', s: []})},
  contrate: {ps: ['nominal'], fn: j => Math.exp(j) - 1, ex: () => ({f: 'EAR = e^j − 1 (continuous)', s: []})},
  realrate: {ps: ['nominal', 'inflation'], fn: (i, pi) => (1 + i) / (1 + pi) - 1, ex: (i, pi) => ({f: '1 + r = (1 + i) / (1 + π)  (Fisher)', s: [`(1 + ${N6(i)}) / (1 + ${N6(pi)}) − 1`]})},
  sln: {ps: ['cost', 'salvage', 'life'], fn: (c, s, l) => (c - s) / l, ex: (c, s, l) => ({f: 'D = (Cost − Salvage) / Life', s: [`(${M2(c)} − ${M2(s)}) / ${l}`], tbl: mxDepTbl('sln', c, s, l)})},
  ddb: {ps: ['cost', 'salvage', 'life', 'period', 'factor?'], fn: (c, s, l, p, f) => mxDepRow('ddb', c, s, l, p, f), ex: (c, s, l, p, f) => ({f: 'Dₜ = BVₜ₋₁ × factor / Life  (not below salvage)', s: [`factor = ${f || 2}`], tbl: mxDepTbl('ddb', c, s, l, f)})},
  syd: {ps: ['cost', 'salvage', 'life', 'period'], fn: (c, s, l, p) => (c - s) * (l - p + 1) * 2 / (l * (l + 1)), ex: (c, s, l, p) => ({f: 'Dₜ = (Cost − Salvage) × (Life − t + 1) / SYD,  SYD = n(n+1)/2', s: [`SYD = ${l * (l + 1) / 2}`], tbl: mxDepTbl('syd', c, s, l)})},
  amort: {ps: ['principal', 'annual_rate', 'months'], fn: (P, r, n) => -mxPMT(r / 12, n, P), ex: (P, r, n) => ({f: 'PMT = P·i / (1 − (1+i)^−n),  i = annual / 12', s: [`i = ${mxP(r / 12)}`], tbl: mxAmortTbl(P, r, n)})},
  bondprice: {ps: ['face', 'coupon_rate', 'ytm', 'years', 'freq?'], fn: (F, c, y, n, m) => { m = m || 1; const N = n * m, C = F * c / m, r = y / m; return C * (1 - Math.pow(1 + r, -N)) / r + F / Math.pow(1 + r, N); },
    ex: (F, c, y, n, m) => { m = m || 1; return {f: 'P = C·[1 − (1+y/m)^−N]/(y/m) + F/(1+y/m)^N', s: [`C = ${M2(F * c / m)}, N = ${n * m}, y/m = ${mxP(y / m)}`]}; }},
  ytm: {ps: ['price', 'face', 'coupon_rate', 'years', 'freq?'], fn: (P, F, c, n, m) => { let lo = -0.99, hi = 5; const f = y => MX_FIN.bondprice.fn(F, c, y, n, m) - P; for (let i = 0; i < 200; i++){ const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } return (lo + hi) / 2; }, ex: () => ({f: 'Price(YTM) = market price → solved numerically', s: []})},
  duration: {ps: ['face', 'coupon_rate', 'ytm', 'years', 'freq?'], fn: (F, c, y, n, m) => { m = m || 1; const N = n * m, C = F * c / m, r = y / m; let pv = 0, w = 0; for (let t = 1; t <= N; t++){ const cf = C + (t === N ? F : 0), d = cf / Math.pow(1 + r, t); pv += d; w += t * d; } return w / pv / m; },
    ex: (F, c, y, n, m) => { const D = MX_FIN.duration.fn(F, c, y, n, m); return {f: 'D = Σ t·PV(CFₜ) / Σ PV(CFₜ);  D* = D / (1 + y/m)', s: [`Macaulay D = ${N6(D)}`, `Modified D* = ${N6(D / (1 + y / (m || 1)))}`]}; }},
  capm: {ps: ['rf', 'beta', 'rm'], fn: (rf, b, rm) => rf + b * (rm - rf), ex: (rf, b, rm) => ({f: 'E(R) = Rf + β·(Rm − Rf)', s: [`${N6(rf)} + ${N6(b)} × (${N6(rm)} − ${N6(rf)})`]})},
  wacc: {ps: ['equity', 'debt', 're', 'rd', 'tax'], fn: (E, D, re, rd, t) => E / (E + D) * re + D / (E + D) * rd * (1 - t), ex: (E, D, re, rd, t) => ({f: 'WACC = E/V·Re + D/V·Rd·(1 − T)', s: [`V = ${M2(E + D)}`, `${N6(E / (E + D))}·${N6(re)} + ${N6(D / (E + D))}·${N6(rd)}·${N6(1 - t)}`]})},
  ddm: {ps: ['d1', 'r', 'g'], fn: (d1, r, g) => { if (r <= g) throw MX_ERR('mx_eDomain'); return d1 / (r - g); }, ex: (d1, r, g) => ({f: 'P₀ = D₁ / (r − g)  (Gordon)', s: [`${M2(d1)} / (${N6(r)} − ${N6(g)})`]})},
  breakeven: {ps: ['fixed', 'price', 'varcost'], fn: (F, p, v) => F / (p - v), ex: (F, p, v) => ({f: 'Q* = Fixed / (Price − Variable cost);  Revenue* = Q*·Price', s: [`CM = ${M2(p - v)}`, `Q* = ${M2(F)} / ${M2(p - v)} = ${N6(F / (p - v))}`, `Revenue* = ${M2(F / (p - v) * p)}`]})},
  margin: {ps: ['cost', 'price'], fn: (c, p) => (p - c) / p, ex: (c, p) => ({f: 'Margin = (Price − Cost) / Price', s: [`(${M2(p)} − ${M2(c)}) / ${M2(p)}`, `Markup = ${mxP((p - c) / c)}`]})},
  markup: {ps: ['cost', 'price'], fn: (c, p) => (p - c) / c, ex: (c, p) => ({f: 'Markup = (Price − Cost) / Cost', s: [`(${M2(p)} − ${M2(c)}) / ${M2(c)}`, `Margin = ${mxP((p - c) / p)}`]})},
  vat: {ps: ['amount', 'rate'], fn: (a, r) => a * (1 + r), ex: (a, r) => ({f: 'Gross = Net × (1 + VAT);  Net = Gross / (1 + VAT)', s: [`VAT = ${M2(a * r)}`, `${M2(a)} incl. VAT → net ${M2(a / (1 + r))}, VAT ${M2(a - a / (1 + r))}`]})},
  inflate: {ps: ['amount', 'rate', 'years'], fn: (a, r, n) => a * Math.pow(1 + r, n), ex: (a, r, n) => ({f: 'Future = Amount × (1 + π)^n', s: [`(1 + ${N6(r)})^${n} = ${N6(Math.pow(1 + r, n))}`]})},
  elasticity: {ps: ['q1', 'q2', 'p1', 'p2'], fn: (q1, q2, p1, p2) => ((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2)), ex: (q1, q2, p1, p2) => ({f: 'E = [ΔQ / avg(Q)] / [ΔP / avg(P)]  (arc / midpoint)', s: [`%ΔQ = ${mxP((q2 - q1) / ((q1 + q2) / 2))}`, `%ΔP = ${mxP((p2 - p1) / ((p1 + p2) / 2))}`]})},
  multiplier: {ps: ['mpc'], fn: c => 1 / (1 - c), ex: c => ({f: 'k = 1 / (1 − MPC)', s: [`1 / (1 − ${N6(c)})`]})},
  eoq: {ps: ['demand', 'order_cost', 'holding_cost'], fn: (D, S, H) => Math.sqrt(2 * D * S / H), ex: (D, S, H) => ({f: 'EOQ = √(2·D·S / H)', s: [`√(2 × ${M2(D)} × ${M2(S)} / ${M2(H)})`]})},
  simple: {ps: ['principal', 'rate', 'years'], fn: (P, r, t) => P * (1 + r * t), ex: (P, r, t) => ({f: 'A = P·(1 + r·t)', s: [`interest = ${M2(P * r * t)}`]})},
  compound: {ps: ['principal', 'rate', 'years', 'periods?'], fn: (P, r, t, m) => P * Math.pow(1 + r / (m || 1), (m || 1) * t), ex: (P, r, t, m) => ({f: 'A = P·(1 + r/m)^(m·t)', s: [`(1 + ${N6(r)}/${m || 1})^${(m || 1) * t} = ${N6(Math.pow(1 + r / (m || 1), (m || 1) * t))}`]})}
};
/* ---------- more explained functions ---------- */
function mxInvVal(qty, cost, sold, how){
  const Q = mxFlat([qty]), C = mxFlat([cost]); if (Q.length !== C.length) throw MX_ERR('mx_eDim');
  const tq = Q.reduce((a, b) => a + b, 0), tc = Q.reduce((a, q, i) => a + q * C[i], 0); if (sold > tq) throw MX_ERR('mx_eDomain');
  if (how === 'avg'){ const avg = tc / tq; return {cogs: sold * avg, end: (tq - sold) * avg, lines: [`avg = ${M2(tc)} / ${N6(tq)} = ${N6(avg)}`]}; }
  const order = Q.map((q, i) => [q, C[i]]); if (how === 'lifo') order.reverse();
  let left = sold, cogs = 0; const lines = [];
  for (const [q, c] of order){ if (left <= 0) break; const take = Math.min(q, left); cogs += take * c; left -= take; lines.push(`${N6(take)} × ${M2(c)} = ${M2(take * c)}`); }
  return {cogs, end: tc - cogs, lines};
}
function mxBS(S, K, T, r, v, put){ const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T); return {d1, d2, c: put ? K * Math.exp(-r * T) * mxNcdf(-d2) - S * mxNcdf(-d1) : S * mxNcdf(d1) - K * Math.exp(-r * T) * mxNcdf(d2)}; }
Object.assign(MX_FIN, {
  quad: {ps: ['a', 'b', 'c'], fn: (a, b, c) => { const D = b * b - 4 * a * c; if (a === 0) return -c / b; if (D < 0) return mxFmt(-b / (2 * a)) + ' ± ' + mxFmt(Math.sqrt(-D) / (2 * a)) + 'i'; const r = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)]; return D === 0 ? r[0] : r; },
    ex: (a, b, c) => { const D = b * b - 4 * a * c; return {f: 'x = (−b ± √(b² − 4ac)) / 2a', s: [`a = ${N6(a)}, b = ${N6(b)}, c = ${N6(c)}`, `Δ = b² − 4ac = ${N6(b * b)} − ${N6(4 * a * c)} = ${N6(D)}`, D < 0 ? 'Δ < 0 → complex roots' : `√Δ = ${N6(Math.sqrt(D))}`, D < 0 ? `x = ${N6(-b / (2 * a))} ± ${N6(Math.sqrt(-D) / (2 * a))}i` : `x₁ = (${N6(-b)} − ${N6(Math.sqrt(D))}) / ${N6(2 * a)} = ${N6((-b - Math.sqrt(D)) / (2 * a))},  x₂ = (${N6(-b)} + ${N6(Math.sqrt(D))}) / ${N6(2 * a)} = ${N6((-b + Math.sqrt(D)) / (2 * a))}`, `vertex: (${N6(-b / (2 * a))}, ${N6(c - b * b / (4 * a))})`]}; }},
  perp: {ps: ['c', 'r'], fn: (c, r) => c / r, ex: (c, r) => ({f: 'PV = C / r', s: [`${M2(c)} / ${N6(r)}`]})},
  gperp: {ps: ['c', 'r', 'g'], fn: (c, r, g) => { if (r <= g) throw MX_ERR('mx_eDomain'); return c / (r - g); }, ex: (c, r, g) => ({f: 'PV = C₁ / (r − g)', s: [`${M2(c)} / (${N6(r)} − ${N6(g)})`]})},
  gannuity: {ps: ['c', 'r', 'g', 'nper'], fn: (c, r, g, n) => r === g ? c * n / (1 + r) : c / (r - g) * (1 - Math.pow((1 + g) / (1 + r), n)), ex: () => ({f: 'PV = C₁/(r − g) · [1 − ((1+g)/(1+r))ⁿ]', s: []})},
  rule72: {ps: ['rate'], fn: r => Math.log(2) / Math.log(1 + r), ex: r => ({f: 'n = ln 2 / ln(1+r)   (rule of 72 ≈ 72 / r%)', s: [`72 / ${N6(r * 100)} ≈ ${N6(72 / (r * 100))}`]})},
  aftertax: {ps: ['rate', 'tax'], fn: (r, t) => r * (1 - t), ex: (r, t) => ({f: 'r_net = r × (1 − tax)', s: [`${N6(r)} × ${N6(1 - t)}`]})},
  balance: {ps: ['principal', 'annual_rate', 'months', 'paid'], fn: (P, r, n, k) => { const i = r / 12, pay = -mxPMT(i, n, P); return P * Math.pow(1 + i, k) - pay * (Math.pow(1 + i, k) - 1) / i; }, ex: (P, r, n) => ({f: 'B_k = P(1+i)^k − PMT·((1+i)^k − 1)/i', s: [`PMT = ${M2(-mxPMT(r / 12, n, P))}`]})},
  uop: {ps: ['cost', 'salvage', 'total_units', 'units'], fn: (c, s, tu, u) => (c - s) / tu * u, ex: (c, s, tu) => ({f: 'D = (Cost − Salvage) / total units × units this year', s: [`${M2((c - s) / tu)} per unit`]})},
  eps: {ps: ['net_income', 'shares'], fn: (ni, sh) => ni / sh, ex: () => ({f: 'EPS = Net income / Shares', s: []})},
  pe: {ps: ['price', 'eps'], fn: (p, e) => p / e, ex: (p, e) => ({f: 'P/E = Price / EPS', s: [`earnings yield = ${mxP(e / p)}`]})},
  divyield: {ps: ['dividend', 'price'], fn: (d, p) => d / p, ex: () => ({f: 'Yield = Dividend / Price', s: []})},
  sharpe: {ps: ['ret', 'rf', 'sd'], fn: (r, rf, sd) => (r - rf) / sd, ex: () => ({f: 'Sharpe = (Rp − Rf) / σp', s: []})},
  bscall: {ps: ['S', 'K', 'T', 'r', 'sigma'], fn: (S, K, T, r, v) => mxBS(S, K, T, r, v).c, ex: (S, K, T, r, v) => { const b = mxBS(S, K, T, r, v); return {f: 'C = S·N(d₁) − K·e^(−rT)·N(d₂)', s: [`d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T) = ${N6(b.d1)}`, `d₂ = d₁ − σ√T = ${N6(b.d2)}`, `N(d₁) = ${N6(mxNcdf(b.d1))}, N(d₂) = ${N6(mxNcdf(b.d2))}`]}; }},
  bsput: {ps: ['S', 'K', 'T', 'r', 'sigma'], fn: (S, K, T, r, v) => mxBS(S, K, T, r, v, 1).c, ex: (S, K, T, r, v) => { const b = mxBS(S, K, T, r, v, 1); return {f: 'P = K·e^(−rT)·N(−d₂) − S·N(−d₁)', s: [`d₁ = ${N6(b.d1)}, d₂ = ${N6(b.d2)}`, `put–call parity: C − P = S − K·e^(−rT) = ${M2(S - K * Math.exp(-r * T))}`]}; }},
  forward: {ps: ['spot', 'r_dom', 'r_for', 'T'], fn: (S, rd, rf, T) => S * Math.pow((1 + rd) / (1 + rf), T), ex: (S, rd, rf, T) => ({f: 'F = S × [(1 + r_dom) / (1 + r_for)]^T  (interest parity)', s: [`${N6(S)} × (${N6(1 + rd)} / ${N6(1 + rf)})^${T}`]})},
  fifo: {ps: ['qty[]', 'cost[]', 'sold'], fn: (q, c, s) => mxInvVal(q, c, s, 'fifo').cogs, ex: (q, c, s) => { const r = mxInvVal(q, c, s, 'fifo'); return {f: 'FIFO: oldest layers are sold first', s: r.lines.concat([`COGS = ${M2(r.cogs)}`, `Ending inventory = ${M2(r.end)}`])}; }},
  lifo: {ps: ['qty[]', 'cost[]', 'sold'], fn: (q, c, s) => mxInvVal(q, c, s, 'lifo').cogs, ex: (q, c, s) => { const r = mxInvVal(q, c, s, 'lifo'); return {f: 'LIFO: newest layers are sold first', s: r.lines.concat([`COGS = ${M2(r.cogs)}`, `Ending inventory = ${M2(r.end)}`])}; }},
  wavg: {ps: ['qty[]', 'cost[]', 'sold'], fn: (q, c, s) => mxInvVal(q, c, s, 'avg').cogs, ex: (q, c, s) => { const r = mxInvVal(q, c, s, 'avg'); return {f: 'Weighted average cost', s: r.lines.concat([`COGS = ${M2(r.cogs)}`, `Ending inventory = ${M2(r.end)}`])}; }},
  cpiinfl: {ps: ['cpi0', 'cpi1'], fn: (a, b) => b / a - 1, ex: (a, b) => ({f: 'π = CPI₁ / CPI₀ − 1', s: [`${N6(b)} / ${N6(a)} − 1`]})},
  realgdp: {ps: ['nominal_gdp', 'deflator'], fn: (n, d) => n / d * 100, ex: () => ({f: 'Real GDP = Nominal GDP / Deflator × 100', s: []})},
  ppp: {ps: ['price_home', 'price_foreign'], fn: (h, f) => h / f, ex: () => ({f: 'Implied exchange rate = P_home / P_foreign  (PPP)', s: []})},
  moneymult: {ps: ['reserve_ratio'], fn: rr => 1 / rr, ex: rr => ({f: 'm = 1 / reserve ratio', s: [`1 / ${N6(rr)}`]})}
});
function mxDepRow(k, c, s, l, p, f){ const T = mxDepTbl(k, c, s, l, f); const r = T.rows[p - 1]; return r ? r[1] : 0; }
function mxDepTbl(k, c, s, l, f){
  const rows = []; let bv = c; f = f || 2;
  for (let t = 1; t <= l; t++){
    let d = k === 'sln' ? (c - s) / l : k === 'syd' ? (c - s) * (l - t + 1) * 2 / (l * (l + 1)) : Math.min(bv * f / l, Math.max(0, bv - s));
    if (k === 'ddb' && t === l) d = Math.max(0, bv - s);
    bv -= d; rows.push([t, d, c - bv, bv]);
  }
  return {head: ['mx_hYear', 'mx_hDep', 'mx_hAcc', 'mx_hBook'], rows};
}
function mxAmortTbl(P, r, n){
  const i = r / 12, pay = -mxPMT(i, n, P), rows = []; let bal = P, ti = 0;
  for (let t = 1; t <= n; t++){ const int = bal * i, prin = pay - int; bal -= prin; ti += int; if (t <= 24 || t > n - 3 || t % 12 === 0) rows.push([t, pay, int, prin, Math.max(0, bal)]); }
  rows.push(['Σ', pay * n, ti, P, 0]);
  return {head: ['mx_hMonth', 'mx_hPay', 'mx_hInt', 'mx_hPrin', 'mx_hBal'], rows};
}
/* ---------- evaluator ---------- */
function mxEval(node, S){
  S = S || {v: {}, f: {}};
  switch (node.t){
    case 'num': return node.v;
    case 'par': return mxEval(node.a, S);
    case 'sym': if (node.n in S.v) return S.v[node.n]; if (node.n in MX_CONST) return MX_CONST[node.n]; throw MX_ERR('mx_eSym', {n: node.n});
    case 'neg': { const a = mxEval(node.a, S); return mxIsM(a) ? mxMatOp('*', a, -1) : -a; }
    case 'fact': return mxFact(mxEval(node.a, S));
    case 'pct': return mxEval(node.a, S) / 100;
    case 'op': return mxBin(node.o, mxEval(node.a, S), mxEval(node.b, S));
    case 'mat': { const R = node.rows.map(r => r.map(e => mxEval(e, S))); return R.length === 1 ? R[0] : R; }
    case 'fn': {
      const n = node.n.toLowerCase();
      if (S.f[node.n]){ const fd = S.f[node.n]; if (fd.ps.length !== node.args.length) throw MX_ERR('mx_eArgs', {n: node.n}); const v = Object.assign({}, S.v); fd.ps.forEach((p, i) => { v[p] = mxEval(node.args[i], S); }); return mxEval(fd.e, {v, f: S.f}); }
      if (MX_FIN[n]){ const a = node.args.map(x => mxEval(x, S)); const ps = MX_FIN[n].ps.filter(p => !p.endsWith('?')).length; if (a.length < ps) throw MX_ERR('mx_eArgs', {n}); return MX_FIN[n].fn(...a); }
      if (MX_MATH[n]){ const a = node.args.map(x => mxEval(x, S)); return MX_MATH[n](...a); }
      if (n === 'sigma' || n === 'summation'){ /* sigma(expr, k, a, b) */ const [e, k, a, b] = node.args; if (!k || k.t !== 'sym') throw MX_ERR('mx_eArgs', {n}); let s = 0; const lo = mxEval(a, S), hi = mxEval(b, S); for (let i = lo; i <= hi; i++) s += mxEval(e, {v: Object.assign({}, S.v, {[k.n]: i}), f: S.f}); return s; }
      if (n === 'product'){ const [e, k, a, b] = node.args; let s = 1; for (let i = mxEval(a, S); i <= mxEval(b, S); i++) s *= mxEval(e, {v: Object.assign({}, S.v, {[k.n]: i}), f: S.f}); return s; }
      if (n === 'nsolve'){ /* nsolve(f(x), x, guess): Newton, then a bracket scan */
        const [e, k, g] = node.args; if (!k || k.t !== 'sym') throw MX_ERR('mx_eArgs', {n}); const f = x => mxEval(e, {v: Object.assign({}, S.v, {[k.n]: x}), f: S.f});
        let x = g ? mxEval(g, S) : 1; for (let i = 0; i < 100; i++){ const fx = f(x), d = (f(x + 1e-6) - f(x - 1e-6)) / 2e-6; if (!isFinite(fx) || !d) break; const nx = x - fx / d; if (Math.abs(nx - x) < 1e-12){ x = nx; break; } x = nx; }
        if (isFinite(x) && Math.abs(f(x)) < 1e-8) return x;
        for (let a = -1000; a < 1000; a += 0.5){ const fa = f(a), fb = f(a + 0.5); if (isFinite(fa) && isFinite(fb) && fa * fb <= 0){ let lo = a, hi = a + 0.5; for (let i = 0; i < 100; i++){ const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; } }
        throw MX_ERR('mx_eSymFail');
      }
      if (n === 'nintegrate'){ const [e, k, a, b] = node.args; return mxSimpson(x => mxEval(e, {v: Object.assign({}, S.v, {[k.n]: x}), f: S.f}), mxEval(a, S), mxEval(b, S)); }
      if (n === 'nderive'){ const [e, k, a] = node.args, x0 = mxEval(a, S), h = 1e-5, g = x => mxEval(e, {v: Object.assign({}, S.v, {[k.n]: x}), f: S.f}); return (g(x0 + h) - g(x0 - h)) / (2 * h); }
      throw MX_ERR('mx_eFn', {n: node.n});
    }
  }
  throw MX_ERR('mx_eTok', {c: node.t});
}
function mxSimpson(f, a, b){ const n = 2000, h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
/* ---------- formatting ---------- */
function mxFmt(x, d){
  if (mxIsM(x)) return '[' + mxRows(x).map(r => r.map(v => mxFmt(v, d)).join(', ')).join('; ') + ']';
  if (typeof x !== 'number') return String(x);
  if (!isFinite(x)) return isNaN(x) ? 'NaN' : (x > 0 ? '∞' : '−∞');
  if (Math.abs(x) < 1e-13) return '0';
  const ax = Math.abs(x);
  if (ax >= 1e15 || ax < 1e-6) return x.toExponential(Math.min(d == null ? 8 : d, 12)).replace(/\.?0+e/, 'e');
  const dd = d == null ? Math.max(0, Math.min(10, 10 - Math.floor(Math.log10(ax) + 1))) : d;
  let s = (Math.round(x * Math.pow(10, dd)) / Math.pow(10, dd)).toFixed(dd);
  if (d == null && s.includes('.')) s = s.replace(/\.?0+$/, '');
  const [i, f] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
}
function mxFrac(x){
  if (typeof x !== 'number' || !isFinite(x) || Number.isInteger(x) || Math.abs(x) > 1e7) return '';
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
  for (let i = 0; i < 25; i++){ const a = Math.floor(b); [h1, h0] = [a * h1 + h0, h1]; [k1, k0] = [a * k1 + k0, k1]; if (Math.abs(x - h1 / k1) < 1e-12 * Math.max(1, Math.abs(x))) break; b = 1 / (b - a); }
  return k1 > 1 && k1 <= 360 && Math.abs(h1) <= 100000 && Math.abs(x - h1 / k1) < 1e-10 ? h1 + '/' + k1 : '';
}
/* ---------- rendering an expression as math ---------- */
const mxEsc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const MX_GREEK = {alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', pi: 'π', phi: 'φ', tau: 'τ', inf: '∞', epsilon: 'ε', rho: 'ρ'};
const MX_PREC = {'<': 0, '>': 0, '<=': 0, '>=': 0, '==': 0, '!=': 0, '+': 1, '-': 1, '*': 2, '/': 2, 'mod': 2, '^': 4};
function mxHTML(n, parentPrec){
  parentPrec = parentPrec || 0;
  const wrap = (h, prec) => prec < parentPrec ? `<span class="mxp">(</span>${h}<span class="mxp">)</span>` : h;
  switch (n.t){
    case 'str': return `<span class="mxn">${mxEsc(n.v)}</span>`;
    case 'num': { const s = mxFmt(n.v); return n.v < 0 && parentPrec > 1 ? `<span class="mxp">(</span>${s}<span class="mxp">)</span>` : `<span class="mxn">${s}</span>`; }
    case 'sym': return `<i class="mxv">${mxEsc(MX_GREEK[n.n] || n.n)}</i>`;
    case 'par': return `<span class="mxp">(</span>${mxHTML(n.a, 0)}<span class="mxp">)</span>`;
    case 'neg': return wrap('−' + mxHTML(n.a, n.a.t === 'op' && ['*', '/', '^'].includes(n.a.o) ? 2 : 3), 3);
    case 'fact': return mxHTML(n.a, 5) + '!';
    case 'pct': return mxHTML(n.a, 5) + '%';
    case 'assign': return `<i class="mxv">${mxEsc(n.n)}</i> = ${mxHTML(n.e, 0)}`;
    case 'fdef': return `<span class="mxf">${mxEsc(n.n)}</span><span class="mxp">(</span>${n.ps.map(p => `<i class="mxv">${mxEsc(p)}</i>`).join(', ')}<span class="mxp">)</span> = ${mxHTML(n.e, 0)}`;
    case 'eq': return mxHTML(n.a, 0) + ' = ' + mxHTML(n.b, 0);
    case 'mat': return `<span class="mxm"><span class="mxm-g" style="grid-template-columns:repeat(${Math.max(...n.rows.map(r => r.length))},auto)">${n.rows.map(r => r.map(e => `<span>${mxHTML(e, 0)}</span>`).join('')).join('')}</span></span>`;
    case 'op': {
      const pr = MX_PREC[n.o];
      if (n.o === '/') return `<span class="mxfr"><span class="mxfr-n">${mxHTML(n.a, 0)}</span><span class="mxfr-d">${mxHTML(n.b, 0)}</span></span>`;
      if (n.o === '^') return wrap(`${mxHTML(n.a, 5)}<sup>${mxHTML(n.b, 0)}</sup>`, pr);
      const impOk = n.imp && !(n.b.t === 'num' || n.b.t === 'neg' || (n.b.t === 'op' && n.b.o === '^' && n.b.a.t === 'num') || (n.b.t === 'op' && n.b.o === '*'));
      const sym = {'*': impOk ? '' : '·', '+': ' + ', '-': ' − ', mod: ' mod ', '<': ' &lt; ', '>': ' &gt; ', '<=': ' ≤ ', '>=': ' ≥ ', '==': ' = ', '!=': ' ≠ '}[n.o];
      return wrap(mxHTML(n.a, pr) + `<span class="mxo">${sym}</span>` + mxHTML(n.b, pr + (n.o === '-' || n.o === '/' ? 1 : 0)), pr);
    }
    case 'fn': {
      const f = n.n.toLowerCase(), A = n.args;
      if (f === 'sqrt' && A.length === 1) return `<span class="mxsq"><span class="mxsq-s">√</span><span class="mxsq-b">${mxHTML(A[0], 0)}</span></span>`;
      if (f === 'root' && A.length === 2) return `<span class="mxsq"><sup class="mxsq-i">${mxHTML(A[1], 0)}</sup><span class="mxsq-s">√</span><span class="mxsq-b">${mxHTML(A[0], 0)}</span></span>`;
      if (f === 'abs' && A.length === 1) return `<span class="mxab">|${mxHTML(A[0], 0)}|</span>`;
      if ((f === 'sigma' || f === 'summation') && A.length === 4) return `<span class="mxbig"><span class="mxbig-t">${mxHTML(A[3], 0)}</span><span class="mxbig-s">Σ</span><span class="mxbig-b">${mxHTML(A[1], 0)}=${mxHTML(A[2], 0)}</span></span>${mxHTML(A[0], 3)}`;
      if ((f === 'integrate' || f === 'nintegrate') && A.length === 4) return `<span class="mxbig"><span class="mxbig-t">${mxHTML(A[3], 0)}</span><span class="mxbig-s">∫</span><span class="mxbig-b">${mxHTML(A[2], 0)}</span></span>${mxHTML(A[0], 3)} d<i class="mxv">${mxEsc(A[1].n || 'x')}</i>`;
      if (f === 'integrate' && A.length <= 2) return `<span class="mxbig-s">∫</span>${mxHTML(A[0], 3)} d<i class="mxv">${mxEsc((A[1] && A[1].n) || 'x')}</i>`;
      if ((f === 'diff' || f === 'derivative') && A.length >= 1) return `<span class="mxfr"><span class="mxfr-n">d</span><span class="mxfr-d">d<i class="mxv">${mxEsc((A[1] && A[1].n) || 'x')}</i></span></span><span class="mxp">(</span>${mxHTML(A[0], 0)}<span class="mxp">)</span>`;
      if (f === 'fact') return mxHTML(A[0], 5) + '!';
      return `<span class="mxf">${mxEsc(n.n)}</span><span class="mxp">(</span>${A.map(a => mxHTML(a, 0)).join(', ')}<span class="mxp">)</span>`;
    }
  }
  return '';
}
const mxValNode = v => typeof v === 'string' ? {t: 'str', v} : mxIsM(v) ? {t: 'mat', rows: mxRows(v).map(r => r.map(x => ({t: 'num', v: x})))} : {t: 'num', v};
function mxValHTML(v){ return mxHTML(mxValNode(v), 0); }
/* ---------- steps: substitute variables, then reduce the innermost operation each time ---------- */
function mxSteps(node, S){
  const out = []; const clone = o => JSON.parse(JSON.stringify(o));
  let cur = clone(node);
  /* 1. substitute variables */
  let sub = false;
  const subst = n => { if (n.t === 'sym' && (n.n in S.v) && !mxIsM(S.v[n.n])){ sub = true; return {t: 'num', v: S.v[n.n]}; } if (n.t === 'sym' && n.n in MX_CONST && n.n !== 'inf'){ sub = true; return {t: 'num', v: MX_CONST[n.n]}; }
    ['a', 'b', 'e'].forEach(k => { if (n[k] && typeof n[k] === 'object') n[k] = subst(n[k]); }); if (n.args && !['sigma', 'summation', 'product', 'nintegrate', 'nderive', 'nsolve'].includes((n.n || '').toLowerCase())) n.args = n.args.map(subst); if (n.rows) n.rows = n.rows.map(r => r.map(subst)); return n; };
  cur = subst(cur); if (sub) out.push({k: 'mx_stSub', h: mxHTML(cur)});
  /* 2. reduce */
  const isC = n => n.t === 'num';
  function reduce(n){
    if (n.t === 'par'){ if (isC(n.a)) return n.a; const r = reduce(n.a); if (r){ n.a = r; return n; } return null; }
    const kids = n.t === 'op' ? ['a', 'b'] : n.t === 'neg' || n.t === 'fact' || n.t === 'pct' ? ['a'] : [];
    for (const k of kids){ if (!isC(n[k])){ const r = reduce(n[k]); if (r){ n[k] = r; return n; } return null; } }
    if (n.t === 'fn'){ for (let i = 0; i < n.args.length; i++){ if (n.args[i].t !== 'num' && n.args[i].t !== 'mat'){ if (['sigma', 'summation', 'product', 'nintegrate', 'nderive', 'nsolve'].includes(n.n.toLowerCase())) break; const r = reduce(n.args[i]); if (r){ n.args[i] = r; return n; } return null; } } }
    if (n.t === 'num' || n.t === 'mat' || n.t === 'sym') return null;
    try { const v = mxEval(n, S); if (mxIsM(v)) return null; return {t: 'num', v}; } catch (e) { return null; }
  }
  for (let i = 0; i < 60; i++){ const before = JSON.stringify(cur); const r = reduce(cur); if (!r) break; cur = r; const h = mxHTML(cur); if (JSON.stringify(cur) === before) break; out.push({k: '', h}); if (cur.t === 'num') break; }
  return out;
}
/* ---------- symbolic algebra through nerdamer (loaded on demand) ---------- */
const MX_SYM = ['solve', 'integrate', 'diff', 'derivative', 'expand', 'factor', 'simplify', 'limit', 'taylor', 'partfrac', 'roots'];
var MXN = {p: null};
function mxLoadScript(u){ return new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.async = true; s.crossOrigin = 'anonymous'; s.onload = () => res(); s.onerror = () => rej(new Error('load')); document.head.appendChild(s); }); }
const MX_NERD_CDN = 'https://cdn.jsdelivr.net/gh/jiggzson/nerdamer@v1.1.12/all.min.js';
function mxNerd(){
  if (window.nerdamer) return Promise.resolve(window.nerdamer);
  if (MXN.p) return MXN.p;
  const urls = (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) ? [MX_NERD_CDN] : ['lib/nerdamer.min.js', MX_NERD_CDN];
  return (MXN.p = (async () => { for (const u of urls){ try { await mxLoadScript(u); if (window.nerdamer) return window.nerdamer; } catch (e) {} } MXN.p = null; throw MX_ERR('mx_eLib'); })());
}
/* split "name(arg1, arg2, ...)" at top-level commas, keeping the raw text of each argument */
function mxSplitCall(src){
  const m = /^\s*([A-Za-z]+)\s*\(([\s\S]*)\)\s*$/.exec(src); if (!m) return null;
  const parts = []; let d = 0, cur = '';
  for (const c of m[2]){ if ('([{'.includes(c)) d++; if (')]}'.includes(c)) d--; if (c === ',' && d === 0){ parts.push(cur.trim()); cur = ''; } else cur += c; }
  if (cur.trim()) parts.push(cur.trim());
  return {n: m[1].toLowerCase(), a: parts};
}
async function mxSymbolic(src, S){
  const c = mxSplitCall(src); if (!c) return null;
  const N = await mxNerd();
  const prep = s => String(s).replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\bln\(/g, 'log(');
  /* variables you defined are substituted, except the variable being solved/differentiated */
  const free = c.a[1] && /^[A-Za-z]\w*$/.test(c.a[1]) ? c.a[1] : 'x';
  const withVars = e => { let s = prep(e); Object.keys(S.v).forEach(k => { if (k !== free && !mxIsM(S.v[k])) s = s.replace(new RegExp('\\b' + k + '\\b', 'g'), '(' + S.v[k] + ')'); }); Object.keys(S.f).forEach(k => { const fd = S.f[k]; s = s.replace(new RegExp('\\b' + k + '\\(([^()]*)\\)', 'g'), (_, arg) => '(' + fd.src.replace(new RegExp('\\b' + fd.ps[0] + '\\b', 'g'), '(' + arg + ')') + ')'); }); return s; };
  const toS = r => String(r.toString()).replace(/\blog\(/g, 'ln(');
  const num = r => { try { const v = Number(N(r.toString()).evaluate().text('decimals')); return isFinite(v) ? v : null; } catch (e) { return null; } };
  let res = '', extra = [];
  switch (c.n){
    case 'solve': {
      const eqs = c.a[0].startsWith('[') ? c.a[0].slice(1, -1).split(';').map(withVars) : null;
      if (eqs){ const r = N.solveEquations(eqs); res = r.map(p => p[0] + ' = ' + p[1]).join(',  '); break; }
      let e = withVars(c.a[0]); if (!e.includes('=')) e += '=0';
      const sol = N.solve(e, free); const arr = String(sol.toString()).replace(/^\[|\]$/g, '').split(',').filter(Boolean);
      res = arr.length ? arr.map(v => free + ' = ' + v.replace(/\blog\(/g, 'ln(')).join(',  ') : '∅';
      arr.forEach(v => { try { const d = Number(N(v).evaluate().text('decimals')); if (isFinite(d) && String(d) !== v) extra.push(free + ' ≈ ' + mxFmt(d)); } catch (er) {} });
      break;
    }
    case 'integrate': {
      if (c.a.length >= 4){ const r = N('defint(' + withVars(c.a[0]) + ',' + prep(c.a[2]) + ',' + prep(c.a[3]) + ',' + free + ')'); res = toS(r); const v = num(r); if (v != null && mxFmt(v) !== res) extra.push('≈ ' + mxFmt(v)); }
      else { res = toS(N('integrate(' + withVars(c.a[0]) + ',' + free + ')')) + ' + C'; }
      break;
    }
    case 'diff': case 'derivative': res = toS(N('diff(' + withVars(c.a[0]) + ',' + free + (c.a[2] ? ',' + prep(c.a[2]) : '') + ')')); break;
    case 'expand': res = toS(N('expand(' + withVars(c.a[0]) + ')')); break;
    case 'factor': res = toS(N('factor(' + withVars(c.a[0]) + ')')); break;
    case 'simplify': res = toS(N('simplify(' + withVars(c.a[0]) + ')')); break;
    case 'partfrac': res = toS(N('partfrac(' + withVars(c.a[0]) + ',' + free + ')')); break;
    case 'roots': res = toS(N('roots(' + withVars(c.a[0]) + ')')); break;
    case 'limit': { const r = N('limit(' + withVars(c.a[0]) + ',' + free + ',' + prep(c.a[2] || '0') + ')'); res = toS(r); break; }
    case 'taylor': { /* taylor(f, x, a, n) via repeated derivatives */
      const a = c.a[2] || '0', n = Math.min(12, +(c.a[3] || 5)); let d = withVars(c.a[0]); const terms = [];
      for (let k = 0; k <= n; k++){ const v = N(d, {[free]: a}).evaluate(); const coef = toS(v); if (coef !== '0') terms.push('(' + coef + ')/' + mxFact(k) + '*(' + free + '-(' + a + '))^' + k); d = N('diff(' + d + ',' + free + ')').toString(); }
      res = toS(N('expand(' + (terms.join('+') || '0') + ')')); break;
    }
    default: return null;
  }
  return {res, extra};
}
