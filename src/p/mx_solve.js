/* ---------- 12.2: the step-by-step solver: a real exercise in, the whole way to the answer out ----------
   Exact fractions and polynomials of its own (no library): linear, quadratic and higher equations (rational roots,
   synthetic division, substitution), fractional equations with domain, isolating x through inverse operations,
   inequalities with a sign table, linear systems by elimination (and substitution for two equations), derivatives rule by
   rule, integrals (linearity, table, linear substitution), limits (substitution, cancelling, L'Hôpital), simplifying and
   factoring. Every answer is checked by substituting back. Anything else falls back to the algebra library or to numbers. */
var XS = {};
/* ---------- exact fractions ---------- */
const xsG = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a || 1; };
function xF(n, d){ d = d == null ? 1 : d; if (!d) throw MX_ERR('mx_eDiv0'); if (!Number.isFinite(n) || !Number.isFinite(d)) throw new Error('nonrat'); if (d < 0){ n = -n; d = -d; } const g = xsG(n, d); n /= g; d /= g; if (Math.abs(n) > 1e15 || d > 1e15) throw new Error('nonrat'); return {n, d}; }
function xFnum(v){
  if (Number.isInteger(v)) return xF(v, 1);
  if (!Number.isFinite(v)) throw new Error('nonrat');
  for (let k = 1; k <= 9; k++){ const m = Math.pow(10, k), r = Math.round(v * m); if (Math.abs(r / m - v) < 1e-12 * Math.max(1, Math.abs(v))) return xF(r, m); }
  const fr = mxFrac(v); if (fr){ const [a, b] = fr.split('/').map(Number); return xF(a, b); }
  throw new Error('nonrat');
}
const xFadd = (a, b) => xF(a.n * b.d + b.n * a.d, a.d * b.d), xFsub = (a, b) => xF(a.n * b.d - b.n * a.d, a.d * b.d);
const xFmul = (a, b) => xF(a.n * b.n, a.d * b.d), xFdiv = (a, b) => { if (!b.n) throw MX_ERR('mx_eDiv0'); return xF(a.n * b.d, a.d * b.n); };
const xFneg = a => ({n: -a.n, d: a.d}), xFv = a => a.n / a.d, xF0 = a => a.n === 0, xF1 = {n: 1, d: 1}, xFZ = {n: 0, d: 1};
const xFeq = (a, b) => a.n === b.n && a.d === b.d;
function xFnode(f){ const s = f.d === 1 ? {t: 'num', v: Math.abs(f.n)} : {t: 'op', o: '/', a: {t: 'num', v: Math.abs(f.n)}, b: {t: 'num', v: f.d}}; return f.n < 0 ? {t: 'neg', a: s} : s; }
const xFtxt = f => (f.n < 0 ? '−' : '') + Math.abs(f.n) + (f.d === 1 ? '' : '/' + f.d);
/* ---------- polynomials: arrays of fractions, index = power ---------- */
const xPtrim = p => { const q = p.slice(); while (q.length > 1 && xF0(q[q.length - 1])) q.pop(); return q.length ? q : [xFZ]; };
const xPdeg = p => { const q = xPtrim(p); return q.length === 1 && xF0(q[0]) ? -1 : q.length - 1; };
const xPc = (p, k) => p[k] || xFZ;
function xPadd(a, b){ const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push(xFadd(xPc(a, i), xPc(b, i))); return xPtrim(r); }
function xPsub(a, b){ return xPadd(a, b.map(xFneg)); }
function xPmul(a, b){ const r = []; for (let i = 0; i < a.length + b.length - 1; i++) r.push(xFZ); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = xFadd(r[i + j], xFmul(x, y)); })); return xPtrim(r); }
const xPscale = (p, f) => xPtrim(p.map(c => xFmul(c, f)));
function xPdivmod(a, b){
  a = xPtrim(a); b = xPtrim(b); const db = xPdeg(b); if (db < 0) throw MX_ERR('mx_eDiv0');
  let r = a.slice(); const q = []; for (let i = 0; i <= Math.max(0, xPdeg(a) - db); i++) q.push(xFZ);
  while (xPdeg(r) >= db && xPdeg(r) >= 0){ const k = xPdeg(r) - db, c = xFdiv(r[xPdeg(r)], b[db]); q[k] = c; const sub = []; for (let i = 0; i < k; i++) sub.push(xFZ); r = xPsub(r, xPmul(sub.concat([c]), b)); }
  return {q: xPtrim(q), r: xPtrim(r)};
}
function xPmonic(p){ const d = xPdeg(p); return d < 0 ? p : xPscale(p, xFdiv(xF1, p[d])); }
function xPgcd(a, b){ a = xPtrim(a); b = xPtrim(b); let n = 0; while (xPdeg(b) >= 0 && n++ < 40){ const r = xPdivmod(a, b).r; a = b; b = r; } return xPdeg(a) <= 0 ? [xF1] : xPmonic(a); }
const xPeval = (p, x) => p.reduceRight((s, c) => xFadd(xFmul(s, x), c), xFZ);
const xPevalN = (p, x) => p.reduceRight((s, c) => s * x + xFv(c), 0);
const xPder = p => xPtrim(p.slice(1).map((c, i) => xFmul(c, xF(i + 1))));
/* integer coefficients with no common factor: returns {p, m} where p = m·original */
function xPint(p){
  let L = 1; p.forEach(c => { L = L / xsG(L, c.d) * c.d; }); let q = p.map(c => xFmul(c, xF(L)));
  let g = 0; q.forEach(c => { g = xsG(g, c.n); }); if (g > 1) q = q.map(c => xF(c.n / g)); let m = xF(L, g);
  if (xPdeg(q) >= 0 && q[xPdeg(q)].n < 0){ q = q.map(xFneg); m = xFneg(m); }
  return {p: xPtrim(q), m};
}
/* display a polynomial in x, highest power first */
function xPnode(p, x){
  p = xPtrim(p); let node = null;
  for (let k = p.length - 1; k >= 0; k--){
    const c = p[k]; if (xF0(c) && !(k === 0 && !node)) continue;
    const ac = {n: Math.abs(c.n), d: c.d}, neg = c.n < 0;
    const xp = k === 0 ? null : k === 1 ? {t: 'sym', n: x} : {t: 'op', o: '^', a: {t: 'sym', n: x}, b: {t: 'num', v: k}};
    let term = !xp ? xFnode(ac) : (ac.n === 1 && ac.d === 1) ? xp : {t: 'op', o: '*', a: xFnode(ac), b: xp, imp: true};
    if (!node) node = neg ? {t: 'neg', a: term} : term;
    else node = {t: 'op', o: neg ? '-' : '+', a: node, b: term};
  }
  return node || {t: 'num', v: 0};
}
/* ---------- expression helpers ---------- */
const xN = v => ({t: 'num', v}), xS = n => ({t: 'sym', n}), xO = (o, a, b) => ({t: 'op', o, a, b}), xFn = (n, ...args) => ({t: 'fn', n, args});
const xHas = (n, x) => !!n && typeof n === 'object' && ((n.t === 'sym' && n.n === x) || ['a', 'b', 'e'].some(k => xHas(n[k], x)) || (n.args || []).some(a => xHas(a, x)) || (n.rows || []).some(r => r.some(a => xHas(a, x))));
const xCount = (n, x) => !n || typeof n !== 'object' ? 0 : (n.t === 'sym' && n.n === x ? 1 : 0) + ['a', 'b', 'e'].reduce((s, k) => s + xCount(n[k], x), 0) + (n.args || []).reduce((s, a) => s + xCount(a, x), 0);
const xClone = o => JSON.parse(JSON.stringify(o));
function xStr(n){
  const P = {'+': 1, '-': 1, '*': 2, '/': 2, mod: 2, '^': 4};
  const go = (n, pp) => {
    switch (n.t){
      case 'num': return n.v < 0 && pp > 1 ? '(' + n.v + ')' : String(n.v);
      case 'sym': return n.n;
      case 'par': return '(' + go(n.a, 0) + ')';
      case 'neg': { const s = '-' + go(n.a, 3); return pp > 1 ? '(' + s + ')' : s; }
      case 'fact': return go(n.a, 5) + '!';
      case 'pct': return go(n.a, 5) + '%';
      case 'fn': return n.n + '(' + n.args.map(a => go(a, 0)).join(', ') + ')';
      case 'mat': return '[' + n.rows.map(r => r.map(a => go(a, 0)).join(', ')).join('; ') + ']';
      case 'eq': return go(n.a, 0) + ' = ' + go(n.b, 0);
      case 'op': { if (!(n.o in P)) return go(n.a, 0) + ' ' + n.o + ' ' + go(n.b, 0); const p = P[n.o]; const s = n.o === '^' ? go(n.a, 5) + '^' + go(n.b, 5) : go(n.a, p) + (n.o === '*' ? '*' : ' ' + n.o + ' ') + go(n.b, p + (n.o === '-' || n.o === '/' ? 1 : 0)); return p < pp ? '(' + s + ')' : s; }
    }
    return '';
  };
  return go(n, 0);
}
/* numeric value of an expression with x = v */
function xVal(node, x, v, S){ const sc = {v: Object.assign({}, (S || {}).v || {}), f: (S || {}).f || {}}; if (x) sc.v[x] = v; try { const r = mxEval(node, sc); return typeof r === 'number' ? r : NaN; } catch (e) { return NaN; } }
const xIsC = (n, S) => { try { return typeof mxEval(n, S || {v: {}, f: {}}) === 'number'; } catch (e) { return false; } };
/* a light simplifier: fold numbers, drop 0 and 1, tidy signs */
function xSimp(n){
  if (!n || typeof n !== 'object') return n;
  n = Object.assign({}, n);
  if (n.a) n.a = xSimp(n.a); if (n.b) n.b = xSimp(n.b); if (n.args) n.args = n.args.map(xSimp);
  const num = k => k && k.t === 'num', isV = (k, v) => num(k) && k.v === v;
  switch (n.t){
    case 'par': return n.a.t === 'num' || n.a.t === 'sym' || n.a.t === 'fn' || n.a.t === 'par' ? n.a : n;
    case 'neg': if (num(n.a)) return xN(-n.a.v); if (n.a.t === 'neg') return n.a.a; return n;
    case 'op': {
      const un = k => k && k.t === 'par' && (k.a.t === 'neg' || k.a.t === 'num' || k.a.t === 'sym' || k.a.t === 'fn' || (n.o !== '^' && k.a.t === 'op' && (k.a.o === '*' || k.a.o === '/' || k.a.o === '^') && n.o !== '/')) ? k.a : k;
      if (n.o !== '^' || (n.b && n.b.t === 'par')){ n.a = n.o === '^' ? n.a : un(n.a); n.b = un(n.b); }
      const {a, b} = n;
      if (n.o === '+'){ if (isV(a, 0)) return b; if (isV(b, 0)) return a; if (num(a) && num(b)) return xN(a.v + b.v); if (b.t === 'neg') return xSimp(xO('-', a, b.a)); if (num(b) && b.v < 0) return xO('-', a, xN(-b.v)); }
      if (n.o === '-'){ if (isV(b, 0)) return a; if (isV(a, 0)) return xSimp({t: 'neg', a: b}); if (num(a) && num(b)) return xN(a.v - b.v); if (b.t === 'neg') return xSimp(xO('+', a, b.a)); if (num(b) && b.v < 0) return xO('+', a, xN(-b.v)); if (JSON.stringify(a) === JSON.stringify(b)) return xN(0); }
      if (n.o === '*'){ if (isV(a, 0) || isV(b, 0)) return xN(0); if (isV(a, 1)) return b; if (isV(b, 1)) return a; if (isV(a, -1)) return xSimp({t: 'neg', a: b}); if (isV(b, -1)) return xSimp({t: 'neg', a}); if (num(a) && num(b)) return xN(a.v * b.v);
        if (num(b) && !num(a)) return xSimp(xO('*', b, a));
        if (num(a) && b.t === 'op' && b.o === '*' && num(b.a)) return xSimp(xO('*', xN(a.v * b.a.v), b.b));
        if (a.t === 'neg') return xSimp({t: 'neg', a: xO('*', a.a, b)}); if (b.t === 'neg') return xSimp({t: 'neg', a: xO('*', a, b.a)});
        return Object.assign(xO('*', a, b), {imp: num(a) && (b.t === 'sym' || b.t === 'fn' || (b.t === 'op' && b.o === '^') || b.t === 'par')}); }
      if (n.o === '/'){ if (isV(a, 0)) return xN(0); if (isV(b, 1)) return a; if (num(a) && num(b) && b.v && Number.isInteger(a.v) && Number.isInteger(b.v)){ const f = xF(a.v, b.v); return f.d === 1 ? xN(f.n) : f.n < 0 ? {t: 'neg', a: xO('/', xN(-f.n), xN(f.d))} : xO('/', xN(f.n), xN(f.d)); } if (a.t === 'neg') return xSimp({t: 'neg', a: xO('/', a.a, b)}); }
      if (n.o === '^'){ if (isV(b, 0)) return xN(1); if (isV(b, 1)) return a; if (num(a) && num(b) && Number.isInteger(b.v) && Math.abs(b.v) < 20) return xN(Math.pow(a.v, b.v)); if (a.t === 'op' && a.o === '^' && num(a.b) && num(b)) return xO('^', a.a, xN(a.b.v * b.v)); }
      return n;
    }
  }
  return n;
}
/* ---------- expression → rational function N(x)/D(x) with exact coefficients (throws if not rational) ---------- */
function xRat(node, x, S){
  const R = (n, d) => ({n: xPtrim(n), d: xPtrim(d || [xF1])});
  const add = (A, B) => R(xPadd(xPmul(A.n, B.d), xPmul(B.n, A.d)), xPmul(A.d, B.d));
  const mul = (A, B) => R(xPmul(A.n, B.n), xPmul(A.d, B.d));
  const red = A => { const g = xPgcd(A.n, A.d); if (xPdeg(g) > 0){ A = R(xPdivmod(A.n, g).q, xPdivmod(A.d, g).q); } const lc = A.d[xPdeg(A.d)]; return R(xPscale(A.n, xFdiv(xF1, lc)), xPscale(A.d, xFdiv(xF1, lc))); };
  function go(n){
    switch (n.t){
      case 'num': return R([xFnum(n.v)]);
      case 'sym': if (n.n === x) return R([xFZ, xF1]); if (S && n.n in S.v && typeof S.v[n.n] === 'number') return R([xFnum(S.v[n.n])]); throw new Error('nonrat');
      case 'par': return go(n.a);
      case 'neg': { const A = go(n.a); return R(A.n.map(xFneg), A.d); }
      case 'pct': { const A = go(n.a); return R(xPscale(A.n, xF(1, 100)), A.d); }
      case 'op': {
        if (n.o === '+' || n.o === '-'){ const A = go(n.a), B = go(n.b); return red(add(A, n.o === '-' ? R(B.n.map(xFneg), B.d) : B)); }
        if (n.o === '*') return red(mul(go(n.a), go(n.b)));
        if (n.o === '/'){ const B = go(n.b); if (xPdeg(B.n) < 0) throw MX_ERR('mx_eDiv0'); return red(mul(go(n.a), R(B.d, B.n))); }
        if (n.o === '^'){ if (xHas(n.b, x)) throw new Error('nonrat'); const e = mxEval(n.b, S || {v: {}, f: {}}); if (!Number.isInteger(e) || Math.abs(e) > 12) throw new Error('nonrat'); const A = go(n.a); let P = R([xF1]); for (let i = 0; i < Math.abs(e); i++) P = mul(P, A); return red(e < 0 ? R(P.d, P.n) : P); }
        throw new Error('nonrat');
      }
      case 'fn': if (!xHas(n, x)){ const v = mxEval(n, S || {v: {}, f: {}}); if (typeof v === 'number') return R([xFnum(v)]); } throw new Error('nonrat');
    }
    throw new Error('nonrat');
  }
  return red(go(node));
}
const xRatOk = (node, x, S) => { try { return xRat(node, x, S); } catch (e) { return null; } };
/* ---------- steps ---------- */
function xsStep(L, k, p, h){ L.push({k, p: p || {}, h: h || ''}); }
const xH = n => mxHTML(n, 0);
const xEqH = (a, b, o) => xH(a) + ' ' + (o || '=') + ' ' + xH(b);
const xNumH = v => mxEsc(mxFmt(v));
/* ---------- roots of a polynomial, with the full way ---------- */
function xsSqrtSimp(m){ /* √m = k√r */ let k = 1, r = m; for (let f = 2; f * f <= r; f++){ while (r % (f * f) === 0){ r /= f * f; k *= f; } } return {k, r}; }
function xsPolyRoots(p0, x, L){
  let roots = [];
  let {p} = xPint(p0); const deg = xPdeg(p);
  if (!xsSame(p, p0) && xPdeg(p) > 0) xsStep(L, 'xs_stInt', {}, xEqH(xPnode(p, x), xN(0)));
  if (deg < 0){ xsStep(L, 'xs_stAll'); return {all: true, roots}; }
  if (deg === 0){ xsStep(L, 'xs_stNone0', {}, xEqH(xPnode(p, x), xN(0))); return {roots}; }
  /* common factor x^k */
  let k0 = 0; while (k0 < deg && xF0(p[k0])) k0++;
  if (k0 > 0 && deg > 1){
    const q = p.slice(k0), xk = k0 === 1 ? xS(x) : xO('^', xS(x), xN(k0));
    xsStep(L, 'xs_stCommon', {f: x + (k0 > 1 ? '^' + k0 : '')}, xEqH({t: 'op', o: '*', a: xk, b: {t: 'par', a: xPnode(q, x)}, imp: true}, xN(0)));
    xsStep(L, 'xs_stZeroProd', {}, xEqH(xS(x), xN(0)) + '&nbsp;&nbsp;<span class="mx-sub">' + mxEsc(t('xs_or')) + '</span>&nbsp;&nbsp;' + xEqH(xPnode(q, x), xN(0)));
    roots.push({v: 0, ex: xN(0)});
    if (xPdeg(q) > 0) roots = roots.concat(xsPolyRoots(q, x, L).roots);
    return {roots};
  }
  if (deg === 1){
    const a = p[1], b = p[0];
    xsStep(L, 'xs_stLin', {}, xEqH(xO('*', xFnode(a), xS(x)), xFnode(xFneg(b))));
    const r = xFdiv(xFneg(b), a); xsStep(L, 'xs_stDiv', {a: xFtxt(a)}, xEqH(xS(x), xFnode(r)));
    roots.push({v: xFv(r), ex: xFnode(r)}); return {roots};
  }
  if (deg === 2){
    const a = p[2], b = p[1], c = p[0];
    if (xF0(b)){ /* ax² + c = 0 */
      const r = xFdiv(xFneg(c), a); xsStep(L, 'xs_stIsoSq', {}, xEqH(xO('^', xS(x), xN(2)), xFnode(r)));
      if (r.n < 0){ xsStep(L, 'xs_stNoReal', {}, xEqH(xO('^', xS(x), xN(2)), xFnode(r)) + ' &lt; 0'); return {roots, complex: true}; }
      const sq = xsSurd(r); xsStep(L, 'xs_stSqrtBoth', {}, xS(x).n ? xH(xS(x)) + ' = ± ' + xH(sq.node) : '');
      roots.push({v: Math.sqrt(xFv(r)), ex: sq.node}); if (r.n) roots.push({v: -Math.sqrt(xFv(r)), ex: {t: 'neg', a: sq.node}}); return {roots};
    }
    xsStep(L, 'xs_stQuadId', {a: xFtxt(a), b: xFtxt(b), c: xFtxt(c)}, xH(xS('a')) + ' = ' + xH(xFnode(a)) + ', &nbsp;' + xH(xS('b')) + ' = ' + xH(xFnode(b)) + ', &nbsp;' + xH(xS('c')) + ' = ' + xH(xFnode(c)));
    const D = xFsub(xFmul(b, b), xFmul(xF(4), xFmul(a, c)));
    xsStep(L, 'xs_stDisc', {}, 'Δ = ' + xH(xS('b')) + '<sup>2</sup> − 4' + xH(xS('a')) + xH(xS('c')) + ' = ' + xH(xFnode(b).t === 'neg' ? {t: 'par', a: xFnode(b)} : xFnode(b)) + '<sup>2</sup> − 4·' + xH(xFnode(a).t === 'neg' ? {t: 'par', a: xFnode(a)} : xFnode(a)) + '·' + xH(xFnode(c).t === 'neg' ? {t: 'par', a: xFnode(c)} : xFnode(c)) + ' = ' + xH(xFnode(D)));
    const formula = xH(xS(x)) + '<sub>1,2</sub> = <span class="mxfr"><span class="mxfr-n">−<i class="mxv">b</i> ± √Δ</span><span class="mxfr-d">2<i class="mxv">a</i></span></span>';
    if (D.n < 0){
      xsStep(L, 'xs_stDneg');
      const re = xFdiv(xFneg(b), xFmul(xF(2), a)), im = Math.sqrt(-xFv(D)) / (2 * Math.abs(xFv(a)));
      xsStep(L, 'xs_stComplex', {}, xH(xS(x)) + ' = ' + xNumH(xFv(re)) + ' ± ' + xNumH(im) + '<i class="mxv">i</i>');
      return {roots, complex: true};
    }
    xsStep(L, 'xs_stFormula', {}, formula);
    if (xF0(D)){ const r = xFdiv(xFneg(b), xFmul(xF(2), a)); xsStep(L, 'xs_stD0', {}, xH(xS(x)) + ' = ' + xH(xO('/', xFnode(xFneg(b)), xFnode(xFmul(xF(2), a)))) + ' = ' + xH(xFnode(r))); roots.push({v: xFv(r), ex: xFnode(r), dbl: true}); return {roots}; }
    const sq = xsSurd(D), a2 = xFmul(xF(2), a), mb = xFneg(b);
    if (sq.exact){
      const r1 = xFdiv(xFadd(mb, sq.f), a2), r2 = xFdiv(xFsub(mb, sq.f), a2);
      xsStep(L, 'xs_stSqrtD', {}, '√Δ = √' + xH(xFnode(D)) + ' = ' + xH(xFnode(sq.f)));
      xsStep(L, 'xs_stTwo', {}, xH(xS(x)) + '<sub>1</sub> = ' + xH(xO('/', xO('+', xFnode(mb), xFnode(sq.f)), xFnode(a2))) + ' = ' + xH(xFnode(r1)) + ' &nbsp;&nbsp; ' + xH(xS(x)) + '<sub>2</sub> = ' + xH(xO('/', xO('-', xFnode(mb), xFnode(sq.f)), xFnode(a2))) + ' = ' + xH(xFnode(r2)));
      if (Number.isInteger(xFv(r1)) && Number.isInteger(xFv(r2)) && a.d === 1 && a.n === 1) xsStep(L, 'xs_stFactored', {}, xEqH({t: 'op', o: '*', a: {t: 'par', a: xPnode([xFneg(r1), xF1], x)}, b: {t: 'par', a: xPnode([xFneg(r2), xF1], x)}, imp: true}, xN(0)));
      roots.push({v: xFv(r1), ex: xFnode(r1)}, {v: xFv(r2), ex: xFnode(r2)});
    } else {
      xsStep(L, 'xs_stSqrtD', {}, '√Δ = √' + xH(xFnode(D)) + (sq.k !== 1 ? ' = ' + xH(sq.node) : '') + ' ≈ ' + xNumH(Math.sqrt(xFv(D))));
      const mk = sgn => { /* (−b ± k√r)/(2a), reduced when the integers share a factor */
        let A = mb, K = xF(sq.k * (sgn), 1), Dn = a2; const ints = [A, K, Dn].every(f => f.d === 1);
        if (ints){ const g = xsG(xsG(A.n, K.n), Dn.n); if (g > 1){ A = xF(A.n / g); K = xF(K.n / g); Dn = xF(Dn.n / g); } if (Dn.n < 0){ A = xFneg(A); K = xFneg(K); Dn = xFneg(Dn); } }
        const rt = xFn('sqrt', xN(sq.r)), kr = Math.abs(K.n) === 1 && K.d === 1 ? rt : {t: 'op', o: '*', a: xFnode({n: Math.abs(K.n), d: K.d}), b: rt, imp: true};
        let top = xF0(A) ? (K.n < 0 ? {t: 'neg', a: kr} : kr) : xO(K.n < 0 ? '-' : '+', xFnode(A), kr);
        return Dn.n === 1 && Dn.d === 1 ? top : xO('/', top, xFnode(Dn));
      };
      const e1 = mk(1), e2 = mk(-1), v1 = (xFv(mb) + Math.sqrt(xFv(D))) / xFv(a2), v2 = (xFv(mb) - Math.sqrt(xFv(D))) / xFv(a2);
      xsStep(L, 'xs_stTwo', {}, xH(xS(x)) + '<sub>1</sub> = ' + xH(e1) + ' ≈ ' + xNumH(v1) + ' &nbsp;&nbsp; ' + xH(xS(x)) + '<sub>2</sub> = ' + xH(e2) + ' ≈ ' + xNumH(v2));
      roots.push({v: v1, ex: e1}, {v: v2, ex: e2});
    }
    return {roots};
  }
  /* biquadratic: only even powers → t = x² */
  if (deg === 4 && xF0(p[1]) && xF0(p[3])){
    const q = [p[0], p[2], p[4]];
    xsStep(L, 'xs_stBiq', {x}, xEqH(xPnode(q, 't'), xN(0)));
    const sub = xsPolyRoots(q, 't', L);
    sub.roots.forEach(r => {
      if (r.v < -1e-12){ xsStep(L, 'xs_stBiqNeg', {}, xH(xS('t')) + ' = ' + xH(r.ex) + ' &lt; 0'); return; }
      const f = xsTryF(r.v), sq = f ? xsSurd(f) : null, node = sq ? sq.node : xFn('sqrt', r.ex);
      xsStep(L, 'xs_stBiqBack', {}, xH(xO('^', xS(x), xN(2))) + ' = ' + xH(r.ex) + ' ⟹ ' + xH(xS(x)) + ' = ± ' + xH(node));
      roots.push({v: Math.sqrt(r.v), ex: node}); if (Math.abs(r.v) > 1e-12) roots.push({v: -Math.sqrt(r.v), ex: {t: 'neg', a: node}});
    });
    return {roots};
  }
  /* rational root test + synthetic division */
  const an = Math.abs(p[deg].n), a0 = Math.abs(p[0].n), dv = n => { const o = []; for (let i = 1; i <= Math.min(n, 100000); i++) if (n % i === 0) o.push(i); return o; };
  const cands = []; dv(a0).forEach(pp => dv(an).forEach(qq => { [pp / qq, -pp / qq].forEach(v => { if (!cands.some(c => Math.abs(c - v) < 1e-12)) cands.push(v); }); }));
  cands.sort((u, v) => Math.abs(u) - Math.abs(v) || v - u);
  for (const v of cands){
    const f = xsTryF(v); if (!f || !xF0(xPeval(p, f))) continue;
    xsStep(L, 'xs_stRatRoot', {r: xFtxt(f)}, xH(xFn('P', xFnode(f))) + ' = 0');
    const {q} = xPdivmod(p, [xFneg(f), xF1]);
    xsStep(L, 'xs_stSynth', {r: xFtxt(f)}, xsSynthHTML(p, f) + '<div>' + xH({t: 'op', o: '*', a: {t: 'par', a: xPnode([xFneg(f), xF1], x)}, b: {t: 'par', a: xPnode(q, x)}, imp: true}) + ' = 0</div>');
    roots.push({v: xFv(f), ex: xFnode(f)});
    xsStep(L, 'xs_stRest', {}, xEqH(xPnode(q, x), xN(0)));
    roots = roots.concat(xsPolyRoots(q, x, L).roots);
    return {roots};
  }
  /* no rational root: numbers */
  xsStep(L, 'xs_stNoRat', {}, '');
  xsNumRootsPoly(p).forEach(v => roots.push({v, ex: null}));
  xsStep(L, 'xs_stNewton', {}, roots.map((r, i) => xH(xS(x)) + '<sub>' + (i + 1) + '</sub> ≈ ' + xNumH(r.v)).join(' &nbsp; ') || mxEsc(t('xs_none')));
  return {roots};
}
const xsSame = (a, b) => a.length === b.length && a.every((c, i) => xFeq(c, b[i]));
function xsTryF(v){ try { return xFnum(v); } catch (e) { return null; } }
function xsSurd(f){ /* √(p/q) as exact fraction or k√r node */
  const sn = Math.sqrt(f.n), sd = Math.sqrt(f.d);
  if (Number.isInteger(sn) && Number.isInteger(sd)) return {exact: true, f: xF(sn, sd), node: xFnode(xF(sn, sd)), k: 1};
  if (f.d === 1){ const {k, r} = xsSqrtSimp(f.n); const rt = xFn('sqrt', xN(r)); return {exact: false, k, r, node: k === 1 ? rt : {t: 'op', o: '*', a: xN(k), b: rt, imp: true}}; }
  return {exact: false, k: 1, r: f.n * f.d, node: xFn('sqrt', xFnode(f))};
}
function xsSynthHTML(p, r){
  const c = p.slice().reverse(), out = [c[0]]; for (let i = 1; i < c.length; i++) out.push(xFadd(c[i], xFmul(out[i - 1], r)));
  const mid = [''].concat(out.slice(0, -1).map(v => xFtxt(xFmul(v, r))));
  return `<table class="mx-syn" dir="ltr"><tr><th>${mxEsc(xFtxt(r))}</th>${c.map(v => `<td>${mxEsc(xFtxt(v))}</td>`).join('')}</tr><tr><th></th>${mid.map(v => `<td>${mxEsc(v)}</td>`).join('')}</tr><tr class="tot"><th></th>${out.map(v => `<td>${mxEsc(xFtxt(v))}</td>`).join('')}</tr></table>`;
}
function xsNumRootsPoly(p){
  const f = x => xPevalN(p, x), d = xPder(p), fd = x => xPevalN(d, x), out = [];
  let B = 1; const lc = Math.abs(xFv(p[xPdeg(p)])); p.forEach(c => { B = Math.max(B, 1 + Math.abs(xFv(c)) / lc); });
  return xsScan(f, -B - 1, B + 1, 4000, fd).concat(out);
}
/* every real root of f on [a, b]: sign changes and touching points, refined */
function xsScan(f, a, b, n, fd){
  const out = [], h = (b - a) / n; let xp = a, fp = f(a);
  const push = v => { if (isFinite(v) && !out.some(o => Math.abs(o - v) < 1e-7 * Math.max(1, Math.abs(v)))) out.push(Math.abs(v) < 1e-12 ? 0 : v); };
  for (let i = 1; i <= n; i++){
    const xc = a + i * h, fc = f(xc);
    if (isFinite(fp) && isFinite(fc)){
      if (fp === 0) push(xp);
      else if (fp * fc < 0){ let lo = xp, hi = xc, flo = fp; for (let k = 0; k < 80; k++){ const m = (lo + hi) / 2, fm = f(m); if (!isFinite(fm)) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } const r = (lo + hi) / 2; if (Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(fp), Math.abs(fc))) push(r); }
    }
    xp = xc; fp = fc;
  }
  if (fp === 0) push(xp);
  /* touching roots (double roots) via the derivative's sign changes */
  if (fd){ for (let i = 1; i <= n; i++){ const x0 = a + (i - 1) * h, x1 = a + i * h, d0 = fd(x0), d1 = fd(x1); if (d0 * d1 < 0){ let lo = x0, hi = x1; for (let k = 0; k < 80; k++){ const m = (lo + hi) / 2; if (fd(lo) * fd(m) <= 0) hi = m; else lo = m; } const r = (lo + hi) / 2; if (Math.abs(f(r)) < 1e-9) push(r); } } }
  return out.sort((u, v) => u - v);
}
/* ---------- one equation in one unknown ---------- */
function xsEquation(eq, x, S, L){
  const A = eq.a, B = eq.b;
  xsStep(L, 'xs_stGiven', {}, xEqH(A, B));
  let RA = xRatOk(A, x, S), RB = xRatOk(B, x, S);
  let roots = [], excl = [], all = false, how = '';
  if (xCount(A, x) + xCount(B, x) === 1){ const L0 = [], r0 = xsIsolate(xHas(A, x) ? A : B, xHas(A, x) ? B : A, x, S, L0); if (!r0.fail){ L0.forEach(z => L.push(z)); roots = r0.roots; how = 'iso'; RA = RB = null; RA = 'done'; } }
  if (RA === 'done'){ /* isolated */ }
  else if (RA && RB){
    const D = xPmul(RA.d, RB.d), hasDen = xPdeg(RA.d) > 0 || xPdeg(RB.d) > 0;
    if (hasDen){
      const dr = xsRealRootsSilent(xPmul(RA.d, RB.d));
      excl = dr; xsStep(L, 'xs_stDomain', {}, dr.length ? dr.map(v => xH(xS(x)) + ' ≠ ' + xH(xsExact(v))).join(', ') : mxEsc(t('xs_allReal')));
      const g = xPgcd(RA.d, RB.d), lcd = xPdivmod(xPmul(RA.d, RB.d), g).q;
      xsStep(L, 'xs_stLCD', {}, xH(xPnode(lcd, x)));
      const N = xPsub(xPmul(RA.n, xPdivmod(lcd, RA.d).q), xPmul(RB.n, xPdivmod(lcd, RB.d).q));
      xsStep(L, 'xs_stMulOut', {}, xEqH(xPnode(xPmul(RA.n, xPdivmod(lcd, RA.d).q), x), xPnode(xPmul(RB.n, xPdivmod(lcd, RB.d).q), x)));
      xsStep(L, 'xs_stStd', {}, xEqH(xPnode(N, x), xN(0)));
      const r = xsPolyRoots(N, x, L); roots = r.roots; all = r.all; how = 'rat';
      void D;
    } else {
      const pa = RA.n, pb = RB.n, expA = xPnode(pa, x), expB = xPnode(pb, x);
      if (xStr(expA) !== xStr(A) || xStr(expB) !== xStr(B)) xsStep(L, 'xs_stExpand', {}, xEqH(expA, expB));
      const N = xPsub(pa, pb), dg = xPdeg(N);
      if (dg === 1 && (xPdeg(pa) <= 1 && xPdeg(pb) <= 1)){
        const a = xFsub(xPc(pa, 1), xPc(pb, 1)), c = xFsub(xPc(pb, 0), xPc(pa, 0));
        { const aL = xPc(pa, 1), aR = xPc(pb, 1), cL = xPc(pa, 0), cR = xPc(pb, 0);
          const lhs = xF0(aR) ? xPnode([xFZ, aL], x) : xF0(aL) ? {t: 'neg', a: xPnode([xFZ, aR], x)} : xO(aR.n < 0 ? '+' : '-', xPnode([xFZ, aL], x), xPnode([xFZ, {n: Math.abs(aR.n), d: aR.d}], x));
          const rhs = xF0(cL) ? xFnode(cR) : xF0(cR) ? xFnode(xFneg(cL)) : xO(cL.n < 0 ? '+' : '-', xFnode(cR), xFnode({n: Math.abs(cL.n), d: cL.d}));
          if (!(xF0(aR) && xF0(cL))) xsStep(L, 'xs_stMove', {}, xEqH(lhs, rhs)); }
        if (!(xF0(xPc(pb, 1)) && xF0(xPc(pa, 0)))) xsStep(L, 'xs_stCollect', {}, xEqH(xPnode([xFZ, a], x), xFnode(c)));
        const r = xFdiv(c, a); if (!(a.n === 1 && a.d === 1)) xsStep(L, 'xs_stDiv', {a: xFtxt(a)}, xEqH(xS(x), xFnode(r)));
        roots = [{v: xFv(r), ex: xFnode(r)}]; how = 'lin';
      } else {
        if (xStr(xPnode(N, x)) !== xStr(A) || xStr(B) !== '0') xsStep(L, 'xs_stStd', {}, xEqH(xPnode(N, x), xN(0)));
        const r = xsPolyRoots(N, x, L); roots = r.roots; all = r.all; how = 'poly';
      }
    }
  } else if (xCount(A, x) + xCount(B, x) === 1){
    const r = xsIsolate(xHas(A, x) ? A : B, xHas(A, x) ? B : A, x, S, L); roots = r.roots; how = 'iso'; if (r.fail) roots = null;
  } else roots = null;
  if (roots === null){ /* numbers */
    const f = v => xVal(A, x, v, S) - xVal(B, x, v, S);
    const rr = xsScan(f, -50, 50, 20000); roots = rr.map(v => ({v, ex: null})); how = 'num';
    xsStep(L, 'xs_stNumeric', {a: -50, b: 50}, rr.length ? rr.slice(0, 12).map((v, i) => xH(xS(x)) + '<sub>' + (i + 1) + '</sub> ≈ ' + xNumH(v)).join(' &nbsp; ') + (rr.length > 12 ? ' …' : '') : mxEsc(t('xs_none')));
    if (rr.length) xsStep(L, 'xs_stNewtonTbl', {}, xsNewtonTbl(f, rr[0], x));
  }
  /* rejected roots and duplicates */
  const kept = [];
  roots.forEach(r => {
    if (excl.some(e => Math.abs(e - r.v) < 1e-9)){ xsStep(L, 'xs_stReject', {}, xH(xS(x)) + ' = ' + xH(r.ex || xN(r.v))); return; }
    if (!kept.some(k => Math.abs(k.v - r.v) < 1e-9)) kept.push(r);
  });
  kept.sort((a, b) => a.v - b.v);
  return {roots: kept, all, how, excl};
}
function xsRealRootsSilent(p){ const L2 = []; try { return xsPolyRoots(p, 'x', L2).roots.map(r => r.v).filter((v, i, a) => a.findIndex(w => Math.abs(w - v) < 1e-9) === i); } catch (e) { return []; } }
function xsExact(v){ const f = xsTryF(v); return f && f.d <= 1000 ? xFnode(f) : xN(+v.toPrecision(10)); }
function xsNewtonTbl(f, r, x){
  let v = Math.round(r) === 0 ? 1 : Math.round(r) + 0.5; const rows = [];
  for (let i = 0; i < 8; i++){ const fv = f(v), d = (f(v + 1e-6) - f(v - 1e-6)) / 2e-6; rows.push([i, v, fv]); if (!d || !isFinite(fv) || Math.abs(fv) < 1e-12) break; const nv = v - fv / d; if (Math.abs(nv - v) < 1e-13){ v = nv; break; } v = nv; }
  if (Math.abs(f(v)) > 1e-6) return '';
  return `<div class="mx-sub">${mxEsc(t('xs_newtonF'))}</div><div class="scroll"><table class="tbl mx-tbl" dir="ltr"><thead><tr><th>n</th><th>${mxEsc(x)}ₙ</th><th>f(${mxEsc(x)}ₙ)</th></tr></thead><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${mxFmt(r[1], 10)}</td><td>${mxFmt(r[2], 8)}</td></tr>`).join('')}</tbody></table></div>`;
}
/* ---------- isolate x when it appears once: undo one operation at a time ---------- */
function xsIsolate(E, R, x, S, L){
  let br = [{E, R}], out = [], guard = 0;
  const C = n => { const s = xSimp(n); try { const v = mxEval(s, S || {v: {}, f: {}}); if (typeof v === 'number' && isFinite(v)){ const f = xsTryF(v); if (f && f.d <= 1000 && Math.abs(f.n) < 1e9) return xFnode(f); if (/pi/.test(xStr(s))){ const pn = xsPi(v); if (pn) return pn; } } } catch (e) {} return s; };
  const show = (k, b, p) => xsStep(L, k, p || {}, xEqH(b.E, b.R) + (xIsC(b.R, S) && b.R.t !== 'num' && !(b.R.t === 'neg' && b.R.a.t === 'num') ? ' &nbsp;<span class="mx-sub">≈ ' + xNumH(mxEval(b.R, S || {v: {}, f: {}})) + '</span>' : ''));
  while (br.length && guard++ < 80){
    const nb = [];
    for (const b of [br.shift()]){
      let {E, R} = b;
      if (E.t === 'sym' && E.n === x){ out.push(b); continue; }
      if (E.t === 'par'){ nb.push({E: E.a, R}); continue; }
      if (E.t === 'neg'){ const n2 = {E: E.a, R: C({t: 'neg', a: R})}; show('xs_stMulNeg', n2); nb.push(n2); continue; }
      if (E.t === 'op'){
        const inA = xHas(E.a, x), K = inA ? E.b : E.a, X = inA ? E.a : E.b, Kp = K.t === 'op' || K.t === 'neg' ? {t: 'par', a: K} : K, Rp = R.t === 'op' || R.t === 'neg' ? {t: 'par', a: R} : R;
        let n2 = null, key = '', pk = xStr(K);
        switch (E.o){
          case '+': n2 = {E: X, R: C(xO('-', R, Kp))}; key = 'xs_stSub'; break;
          case '-': if (inA){ n2 = {E: X, R: C(xO('+', R, Kp))}; key = 'xs_stAdd'; } else { n2 = {E: X, R: C(xO('-', Kp, Rp))}; key = 'xs_stSwap'; } break;
          case '*': n2 = {E: X, R: C(xO('/', R, K))}; key = 'xs_stDiv'; break;
          case '/': if (inA){ n2 = {E: X, R: C(xO('*', Rp, Kp))}; key = 'xs_stMul'; } else { n2 = {E: X, R: C(xO('/', K, R))}; key = 'xs_stRecip'; } break;
          case '^':
            if (inA){ /* X^n = R */
              const n = mxEval(K, S || {v: {}, f: {}});
              if (Number.isInteger(n) && n % 2 === 0){ const rv = mxEval(R, S || {v: {}, f: {}}); if (rv < 0){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R)); continue; }
                const rt = C(n === 2 ? xFn('sqrt', R) : xFn('root', R, K)); xsStep(L, 'xs_stRootBoth', {n}, xH(X) + ' = ± ' + xH(rt)); nb.push({E: X, R: rt}); if (rv > 0) nb.push({E: X, R: C({t: 'neg', a: rt})}); continue; }
              n2 = {E: X, R: C(n === 3 ? xFn('root', R, xN(3)) : xO('^', Rp, xO('/', xN(1), Kp)))}; key = 'xs_stRoot'; pk = String(n);
            } else { /* K^X = R → X = ln R / ln K */
              const rv = mxEval(R, S || {v: {}, f: {}}); if (!(rv > 0)){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R)); continue; }
              n2 = {E: X, R: C(K.t === 'sym' && K.n === 'e' ? xFn('ln', R) : xO('/', xFn('ln', R), xFn('ln', K)))}; key = 'xs_stLog';
            }
            break;
          default: return {fail: true, roots: []};
        }
        if (n2.E.t === 'par') n2.E = n2.E.a;
        show(key, n2, {a: pk}); nb.push(n2); continue;
      }
      if (E.t === 'fn' && E.args.length >= 1 && xHas(E.args[0], x)){
        const f = E.n.toLowerCase(), X = E.args[0], rv = (() => { try { return mxEval(R, S || {v: {}, f: {}}); } catch (e) { return NaN; } })(); let n2 = null, key = 'xs_stInv';
        if (f === 'exp'){ if (!(rv > 0)){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R)); continue; } n2 = {E: X, R: C(xFn('ln', R))}; }
        else if (f === 'ln'){ n2 = {E: X, R: C(xO('^', xS('e'), R))}; }
        else if (f === 'log' && E.args.length === 1){ n2 = {E: X, R: C(xO('^', xN(10), R))}; }
        else if (f === 'log' && E.args.length === 2){ n2 = {E: X, R: C(xO('^', E.args[1], R))}; }
        else if (f === 'log2'){ n2 = {E: X, R: C(xO('^', xN(2), R))}; }
        else if (f === 'sqrt'){ if (rv < 0){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R)); continue; } n2 = {E: X, R: C(xO('^', R.t === 'num' ? R : {t: 'par', a: R}, xN(2)))}; key = 'xs_stSquare'; }
        else if (f === 'root' && E.args.length === 2){ n2 = {E: X, R: C(xO('^', {t: 'par', a: R}, E.args[1]))}; }
        else if (f === 'abs'){ if (rv < 0){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R)); continue; } xsStep(L, 'xs_stAbs', {}, xH(X) + ' = ' + xH(R) + ' &nbsp;' + mxEsc(t('xs_or')) + '&nbsp; ' + xH(X) + ' = ' + xH(C({t: 'neg', a: R}))); nb.push({E: X, R: C(R)}); if (rv > 0) nb.push({E: X, R: C({t: 'neg', a: R})}); continue; }
        else if (f === 'sin' || f === 'cos' || f === 'tan'){
          if (f !== 'tan' && Math.abs(rv) > 1){ xsStep(L, 'xs_stNoReal', {}, xEqH(E, R) + ' (|' + xNumH(rv) + '| &gt; 1)'); continue; }
          const deg = !!MXE.deg, P = deg ? 360 : 2 * Math.PI, base = Math[{sin: 'asin', cos: 'acos', tan: 'atan'}[f]](rv) * (deg ? 180 / Math.PI : 1);
          const sols = f === 'sin' ? [base, (deg ? 180 : Math.PI) - base] : f === 'cos' ? [base, -base] : [base];
          const per = f === 'tan' ? (deg ? 180 : Math.PI) : P;
          const kS = (deg ? mxFmt(per) + '°' : (f === 'tan' ? 'π' : '2π')) + 'k';
          const angH = s => { const pn = deg ? null : xsPi(s); return pn ? xH(pn) : xNumH(s) + (deg ? '°' : ''); };
          xsStep(L, 'xs_stTrig', {f}, sols.map(s => xH(X) + ' = ' + angH(s) + ' + ' + mxEsc(kS)).join(' &nbsp;' + mxEsc(t('xs_or')) + '&nbsp; '));
          XS.trigNote = true;
          const uniq = sols.filter((s, i) => sols.findIndex(u => Math.abs(((u - s) % per + per) % per) < 1e-9 || Math.abs(((u - s) % per + per) % per - per) < 1e-9) === i);
          uniq.forEach(s => { let v = ((s % per) + per) % per; const pn = deg ? null : xsPi(v); nb.push({E: X, R: pn || xN(+v.toPrecision(12))}); });
          continue;
        }
        else return {fail: true, roots: []};
        if (n2.E.t === 'par') n2.E = n2.E.a;
        show(key, n2, {f}); nb.push(n2); continue;
      }
      return {fail: true, roots: []};
    }
    br = nb.concat(br);
  }
  const roots = [];
  out.forEach(b => { const v = (() => { try { return mxEval(b.R, S || {v: {}, f: {}}); } catch (e) { return NaN; } })(); if (isFinite(v)) roots.push({v, ex: b.R.t === 'num' || (b.R.t === 'neg' && b.R.a.t === 'num') || (b.R.t === 'op' && b.R.o === '/' && b.R.a.t === 'num' && b.R.b.t === 'num') ? b.R : xS(xStr(b.R)).n ? b.R : null}); });
  return {roots};
}
/* ---------- verification by substitution ---------- */
function xsVerify(eq, x, roots, S, L){
  let ok = true; const rows = [];
  roots.forEach(r => { const a = xVal(eq.a, x, r.v, S), b = xVal(eq.b, x, r.v, S), good = Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b)); if (!good) ok = false; rows.push(`${xH(xS(x))} = ${xNumH(r.v)}: &nbsp; ${xNumH(a)} ${good ? '=' : '≠'} ${xNumH(b)} ${good ? '✓' : '✗'}`); });
  if (rows.length) xsStep(L, 'xs_stCheck', {}, rows.join('<br>'));
  return ok;
}
/* ---------- inequalities: critical points and a sign table ---------- */
function xsInequality(node, x, S, L){
  const o = node.o, A = node.a, B = node.b;
  xsStep(L, 'xs_stGiven', {}, xEqH(A, B, {'<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥'}[o]));
  const F = xO('-', A, B), R = xRatOk(F, x, S);
  let crit = [], holes = [], f;
  if (R){
    xsStep(L, 'xs_stIneqOne', {}, xH(xPdeg(R.d) > 0 ? xO('/', xPnode(R.n, x), xPnode(R.d, x)) : xPnode(R.n, x)) + ' ' + {'<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥'}[o] + ' 0');
    const L2 = []; const nr = xPdeg(R.n) > 0 ? xsPolyRoots(R.n, x, L2).roots.map(r => r.v) : [];
    holes = xPdeg(R.d) > 0 ? xsRealRootsSilent(R.d) : [];
    crit = nr; f = v => xPevalN(R.n, v) / xPevalN(R.d, v);
    if (nr.length) xsStep(L, 'xs_stZeros', {}, nr.map(v => xH(xS(x)) + ' = ' + xH(xsExact(v))).join(', '));
    if (holes.length) xsStep(L, 'xs_stHoles', {}, holes.map(v => xH(xS(x)) + ' ≠ ' + xH(xsExact(v))).join(', '));
  } else {
    f = v => xVal(A, x, v, S) - xVal(B, x, v, S); crit = xsScan(f, -50, 50, 20000);
    xsStep(L, 'xs_stZerosNum', {}, crit.map(v => xH(xS(x)) + ' ≈ ' + xNumH(v)).join(', ') || mxEsc(t('xs_none')));
  }
  const pts = crit.concat(holes).filter((v, i, a) => a.findIndex(w => Math.abs(w - v) < 1e-9) === i).sort((a, b) => a - b);
  const test = [], segs = [];
  const sample = (lo, hi) => lo === -Infinity ? (hi === Infinity ? 0 : hi - 1) : hi === Infinity ? lo + 1 : (lo + hi) / 2;
  const ed = [-Infinity].concat(pts, [Infinity]);
  const good = v => o === '<' ? v < 0 : o === '>' ? v > 0 : o === '<=' ? v <= 0 : v >= 0;
  for (let i = 0; i < ed.length - 1; i++){ const m = sample(ed[i], ed[i + 1]), v = f(m); test.push({lo: ed[i], hi: ed[i + 1], m, s: v > 0 ? '+' : v < 0 ? '−' : '0', ok: good(v)}); }
  const fmtE = v => v === -Infinity ? '−∞' : v === Infinity ? '∞' : mxFmt(v);
  xsStep(L, 'xs_stSignTbl', {}, `<div class="scroll"><table class="tbl mx-tbl mx-sign" dir="ltr"><thead><tr><th>${mxEsc(t('xs_interval'))}</th><th>${mxEsc(t('xs_testPt'))}</th><th>${mxEsc(t('xs_sign'))}</th></tr></thead><tbody>${test.map(r => `<tr class="${r.ok ? 'ok' : ''}"><th>(${fmtE(r.lo)}, ${fmtE(r.hi)})</th><td>${mxFmt(r.m)}</td><td>${r.s}${r.ok ? ' ✓' : ''}</td></tr>`).join('')}</tbody></table></div>`);
  /* build intervals */
  const incl = v => (o === '<=' || o === '>=') && !holes.some(h => Math.abs(h - v) < 1e-9);
  const ivs = [];
  test.forEach(r => { if (!r.ok) return; const last = ivs[ivs.length - 1]; if (last && last.hi === r.lo && incl(r.lo)){ last.hi = r.hi; last.ic = incl(r.hi) && r.hi !== Infinity; } else ivs.push({lo: r.lo, hi: r.hi, lc: r.lo !== -Infinity && incl(r.lo), ic: r.hi !== Infinity && incl(r.hi)}); });
  const isolated = (o === '<=' || o === '>=') ? crit.filter(v => !ivs.some(iv => v >= iv.lo - 1e-12 && v <= iv.hi + 1e-12)) : [];
  const txt = ivs.map(iv => (iv.lc ? '[' : '(') + fmtE(iv.lo) + ', ' + fmtE(iv.hi) + (iv.ic ? ']' : ')')).concat(isolated.map(v => '{' + mxFmt(v) + '}')).join(' ∪ ') || '∅';
  return {txt, ivs};
}
/* ---------- systems ---------- */
function xsLinear(node, vars, S){ /* expression → {c: {var: frac}, k: frac} or throw */
  const go = n => {
    switch (n.t){
      case 'num': return {c: {}, k: xFnum(n.v)};
      case 'sym': if (vars.includes(n.n)) return {c: {[n.n]: xF1}, k: xFZ}; if (S && n.n in S.v && typeof S.v[n.n] === 'number') return {c: {}, k: xFnum(S.v[n.n])}; throw new Error('nonlin');
      case 'par': return go(n.a);
      case 'neg': return sc(go(n.a), xF(-1));
      case 'op': {
        const A = go(n.a), B = go(n.b), isK = X => !Object.keys(X.c).some(k => !xF0(X.c[k]));
        if (n.o === '+') return ad(A, B); if (n.o === '-') return ad(A, sc(B, xF(-1)));
        if (n.o === '*'){ if (isK(A)) return sc(B, A.k); if (isK(B)) return sc(A, B.k); throw new Error('nonlin'); }
        if (n.o === '/'){ if (isK(B)) return sc(A, xFdiv(xF1, B.k)); throw new Error('nonlin'); }
        throw new Error('nonlin');
      }
    }
    throw new Error('nonlin');
  };
  const sc = (X, f) => { const c = {}; Object.keys(X.c).forEach(k => { c[k] = xFmul(X.c[k], f); }); return {c, k: xFmul(X.k, f)}; };
  const ad = (X, Y) => { const c = Object.assign({}, X.c); Object.keys(Y.c).forEach(k => { c[k] = c[k] ? xFadd(c[k], Y.c[k]) : Y.c[k]; }); return {c, k: xFadd(X.k, Y.k)}; };
  return go(node);
}
function xsMatHTML(M, vars){
  return `<table class="mx-aug" dir="ltr"><tbody>${M.map(r => `<tr>${r.map((c, j) => `<td${j === r.length - 1 ? ' class="bar"' : ''}>${mxEsc(xFtxt(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function xsSystem(eqs, S, L){
  const vars = []; eqs.forEach(e => (xStr(e).match(/[A-Za-z_]\w*/g) || []).forEach(v => { if (!(v in S.v) && !(v in MX_CONST) && !MX_MATH[v.toLowerCase()] && !S.f[v] && !vars.includes(v)) vars.push(v); }));
  vars.sort();
  xsStep(L, 'xs_stGivenSys', {}, eqs.map(e => xEqH(e.a, e.b)).join('<br>'));
  let lin = null;
  try { lin = eqs.map(e => { const l = xsLinear(xO('-', e.a, e.b), vars, S); return vars.map(v => l.c[v] || xFZ).concat([xFneg(l.k)]); }); } catch (e) { lin = null; }
  if (lin){
    const stdH = lin.map(r => xEqH(vars.reduce((acc, v, j) => { const c = r[j]; if (xF0(c)) return acc; const term = c.n === c.d ? xS(v) : c.n === -c.d ? {t: 'neg', a: xS(v)} : {t: 'op', o: '*', a: xFnode(c), b: xS(v), imp: true}; if (!acc) return term; return term.t === 'neg' ? xO('-', acc, term.a) : (term.t === 'op' && term.a.t === 'neg') ? xO('-', acc, {t: 'op', o: '*', a: term.a.a, b: term.b, imp: true}) : xO('+', acc, term); }, null) || xN(0), xFnode(r[r.length - 1]))).join('<br>');
    if (stdH !== eqs.map(e => xEqH(e.a, e.b)).join('<br>')) xsStep(L, 'xs_stStdSys', {}, stdH);
    xsStep(L, 'xs_stAug', {}, xsMatHTML(lin, vars));
    const M = lin.map(r => r.slice()), m = M.length, n = vars.length; let row = 0; const piv = [];
    for (let col = 0; col < n && row < m; col++){
      let pr = -1; for (let i = row; i < m; i++) if (!xF0(M[i][col])){ pr = i; break; }
      if (pr < 0) continue;
      if (pr !== row){ [M[pr], M[row]] = [M[row], M[pr]]; xsStep(L, 'xs_stSwapR', {a: 'R' + (row + 1), b: 'R' + (pr + 1)}, xsMatHTML(M, vars)); }
      if (!xFeq(M[row][col], xF1)){ const f = M[row][col]; M[row] = M[row].map(c => xFdiv(c, f)); xsStep(L, 'xs_stScaleR', {r: 'R' + (row + 1), f: xFtxt(f)}, xsMatHTML(M, vars)); }
      for (let i = 0; i < m; i++){ if (i === row || xF0(M[i][col])) continue; const f = M[i][col]; M[i] = M[i].map((c, j) => xFsub(c, xFmul(f, M[row][j]))); xsStep(L, 'xs_stElim', {r: 'R' + (i + 1), f: xFtxt(f), p: 'R' + (row + 1)}, xsMatHTML(M, vars)); }
      piv.push(col); row++;
    }
    for (let i = row; i < m; i++) if (!xF0(M[i][n])){ xsStep(L, 'xs_stIncons', {r: 'R' + (i + 1)}, '0 = ' + mxEsc(xFtxt(M[i][n]))); return {none: true, vars}; }
    if (piv.length < n){ const free = vars.filter((v, j) => !piv.includes(j)); xsStep(L, 'xs_stInf', {f: free.join(', ')}, piv.map((c, i) => xH(xS(vars[c])) + ' = ' + mxEsc(xFtxt(M[i][n])) + vars.map((v, j) => j !== c && !xF0(M[i][j]) ? ' − ' + mxEsc(xFtxt(M[i][j])) + '·' + mxEsc(v) : '').join('')).join('<br>')); return {inf: true, vars}; }
    const sol = {}; piv.forEach((c, i) => { sol[vars[c]] = M[i][n]; });
    xsStep(L, 'xs_stSolSys', {}, vars.map(v => xH(xS(v)) + ' = ' + xH(xFnode(sol[v]))).join(', &nbsp;'));
    const out = {}; vars.forEach(v => { out[v] = xFv(sol[v]); });
    xsVerifySys(eqs, [out], S, L);
    return {sols: [out], vars, exact: sol};
  }
  /* two equations, one of them linear in some variable: substitution */
  if (eqs.length === 2 && vars.length === 2){
    for (let i = 0; i < 2; i++) for (const v of vars){
      const e = eqs[i], other = eqs[1 - i], w = vars.find(u => u !== v);
      let l; try { l = xsLinear(xO('-', e.a, e.b), [v], {v: Object.assign({}, S.v), f: S.f}); } catch (er) { l = null; }
      /* linear in v with the other variable symbolic: try isolating v when v appears once */
      if (xCount(xO('-', e.a, e.b), v) !== 1) continue;
      const L3 = [], iso = xsIsolate(xHas(e.a, v) ? e.a : e.b, xHas(e.a, v) ? e.b : e.a, v, {v: {}, f: S.f}, L3);
      void l; void iso;
      const lhsHas = xHas(e.a, v); let E = lhsHas ? e.a : e.b, R = lhsHas ? e.b : e.a, ok = true, g = 0;
      while (!(E.t === 'sym' && E.n === v) && g++ < 20){
        if (E.t === 'par'){ E = E.a; continue; }
        if (E.t === 'neg'){ E = E.a; R = {t: 'neg', a: R}; continue; }
        if (E.t === 'op' && ['+', '-', '*', '/'].includes(E.o)){ const inA = xHas(E.a, v), K = inA ? E.b : E.a, X = inA ? E.a : E.b, Kp = {t: 'par', a: K}, Rp = {t: 'par', a: R};
          if (E.o === '+') R = xO('-', Rp, Kp); else if (E.o === '-') R = inA ? xO('+', Rp, Kp) : xO('-', Kp, Rp); else if (E.o === '*') R = xO('/', Rp, Kp); else R = inA ? xO('*', Rp, Kp) : xO('/', Kp, Rp); E = X; continue; }
        ok = false; break;
      }
      if (!ok) continue;
      const Rs = xsTidy(R, w, S);
      xsStep(L, 'xs_stIsoVar', {v, i: i + 1}, xH(xS(v)) + ' = ' + xH(Rs));
      const subst = n => { if (!n || typeof n !== 'object') return n; if (n.t === 'sym' && n.n === v) return {t: 'par', a: xClone(Rs)}; const o = Object.assign({}, n); ['a', 'b', 'e'].forEach(k => { if (o[k]) o[k] = subst(o[k]); }); if (o.args) o.args = o.args.map(subst); return o; };
      const eq2 = {t: 'eq', a: subst(other.a), b: subst(other.b)};
      xsStep(L, 'xs_stSubIn', {v, i: 2 - i}, xEqH(eq2.a, eq2.b));
      const r = xsEquation(eq2, w, S, L);
      const sols = [];
      r.roots.forEach(rt => { const vv = xVal(Rs, w, rt.v, S); xsStep(L, 'xs_stBack', {v}, xH(xS(w)) + ' = ' + xNumH(rt.v) + ' ⟹ ' + xH(xS(v)) + ' = ' + xNumH(vv)); sols.push({[w]: rt.v, [v]: vv}); });
      xsVerifySys(eqs, sols, S, L);
      return {sols, vars};
    }
  }
  return null;
}
function xsTidy(n, x, S){ const R = xRatOk(n, x, S); if (R){ if (xPdeg(R.d) <= 0) return xPnode(xPscale(R.n, xFdiv(xF1, R.d[0])), x); return xO('/', xPnode(R.n, x), xPnode(R.d, x)); } return xSimp(n); }
function xsVerifySys(eqs, sols, S, L){
  const rows = []; let ok = true;
  sols.forEach(s => eqs.forEach(e => { const sc = {v: Object.assign({}, S.v, s), f: S.f}; let a, b; try { a = mxEval(e.a, sc); b = mxEval(e.b, sc); } catch (er) { a = NaN; b = 0; } const g = Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b)); if (!g) ok = false; rows.push(xEqH(e.a, e.b) + ' : &nbsp;' + xNumH(a) + (g ? ' = ' : ' ≠ ') + xNumH(b) + (g ? ' ✓' : ' ✗')); }));
  if (rows.length) xsStep(L, 'xs_stCheck', {}, rows.join('<br>'));
  return ok;
}
/* ---------- derivatives, rule by rule ---------- */
function xsD(n, x, L, depth){
  depth = depth || 0;
  const rec = (k, h) => { if (depth < 6) xsStep(L, k, {}, h); };
  const D = m => xsD(m, x, L, depth + 1);
  const P = m => (m.t === 'op' && (m.o === '+' || m.o === '-')) || m.t === 'neg' ? {t: 'par', a: m} : m;
  const Pw = m => m.t === 'op' || m.t === 'neg' ? {t: 'par', a: m} : m;
  const dH = m => `<span class="mxfr"><span class="mxfr-n">d</span><span class="mxfr-d">d<i class="mxv">${mxEsc(x)}</i></span></span><span class="mxp">[</span>${xH(m)}<span class="mxp">]</span>`;
  if (!xHas(n, x)) return xN(0);
  switch (n.t){
    case 'sym': return xN(1);
    case 'par': return D(n.a);
    case 'neg': return xSimp({t: 'neg', a: D(n.a)});
    case 'op': {
      const {a, b} = n;
      if (n.o === '+' || n.o === '-'){ const r = xSimp(xO(n.o, D(a), D(b))); rec('xs_dSum', dH(n) + ' = ' + dH(a) + (n.o === '+' ? ' + ' : ' − ') + dH(b) + ' = ' + xH(r)); return r; }
      if (n.o === '*'){
        if (!xHas(a, x)){ const r = xSimp(xO('*', a, P(D(b)))); rec('xs_dConst', dH(n) + ' = ' + xH(P(a)) + '·' + dH(b) + ' = ' + xH(r)); return r; }
        if (!xHas(b, x)){ const r = xSimp(xO('*', b, P(D(a)))); rec('xs_dConst', dH(n) + ' = ' + xH(P(b)) + '·' + dH(a) + ' = ' + xH(r)); return r; }
        const da = D(a), db = D(b), r = xSimp(xO('+', xO('*', P(da), P(b)), xO('*', P(a), P(db))));
        rec('xs_dProd', `<div>(u·v)′ = u′·v + u·v′</div>u = ${xH(a)}, &nbsp;v = ${xH(b)} &nbsp;⟹&nbsp; u′ = ${xH(da)}, &nbsp;v′ = ${xH(db)}<div>${dH(n)} = ${xH(r)}</div>`); return r;
      }
      if (n.o === '/'){
        if (!xHas(b, x)){ const r = xSimp(xO('/', P(D(a)), P(b))); rec('xs_dConst', dH(n) + ' = ' + xH(r)); return r; }
        const da = D(a), db = D(b), r = xSimp(xO('/', xO('-', xO('*', P(da), P(b)), xO('*', P(a), P(db))), xO('^', Pw(b), xN(2))));
        rec('xs_dQuot', `<div>(u/v)′ = (u′·v − u·v′) / v²</div>u = ${xH(a)}, &nbsp;v = ${xH(b)} &nbsp;⟹&nbsp; u′ = ${xH(da)}, &nbsp;v′ = ${xH(db)}<div>${dH(n)} = ${xH(r)}</div>`); return r;
      }
      if (n.o === '^'){
        if (!xHas(b, x)){ /* power rule + chain */
          const nb = xSimp(xO('-', b, xN(1))), base = xSimp(xO('*', b, xO('^', Pw(a), nb.t === 'num' && nb.v < 0 ? nb : Pw(nb))));
          if (a.t === 'sym'){ rec('xs_dPow', '(' + xH(xS(x)) + '<sup>n</sup>)′ = n·' + xH(xS(x)) + '<sup>n−1</sup> &nbsp;⟹&nbsp; ' + dH(n) + ' = ' + xH(base)); return base; }
          const da = D(a), r = xSimp(xO('*', base, P(da)));
          rec('xs_dChain', `<div>(u<sup>n</sup>)′ = n·u<sup>n−1</sup>·u′</div>u = ${xH(a)} &nbsp;⟹&nbsp; u′ = ${xH(da)}<div>${dH(n)} = ${xH(r)}</div>`); return r;
        }
        if (!xHas(a, x)){ /* a^u */
          const du = D(b), ln = a.t === 'sym' && a.n === 'e' ? null : xFn('ln', a), r = xSimp(ln ? xO('*', xO('*', n, ln), P(du)) : xO('*', n, P(du)));
          rec('xs_dExp', (ln ? '(a<sup>u</sup>)′ = a<sup>u</sup>·ln(a)·u′' : '(e<sup>u</sup>)′ = e<sup>u</sup>·u′') + ' &nbsp;⟹&nbsp; ' + dH(n) + ' = ' + xH(r)); return r;
        }
        /* u^v = e^(v ln u) */
        const r = xSimp(xO('*', n, P(D(xO('*', b, xFn('ln', a))))));
        rec('xs_dLogDiff', dH(n) + ' = ' + xH(r)); return r;
      }
      break;
    }
    case 'fn': {
      const f = n.n.toLowerCase(), u = n.args[0];
      const TBL = {sin: u => xFn('cos', u), cos: u => ({t: 'neg', a: xFn('sin', u)}), tan: u => xO('/', xN(1), xO('^', xFn('cos', u), xN(2))), exp: u => xFn('exp', u), ln: u => xO('/', xN(1), P(u)), log: u => xO('/', xN(1), xO('*', P(u), xFn('ln', xN(10)))), log2: u => xO('/', xN(1), xO('*', P(u), xFn('ln', xN(2)))),
        sqrt: u => xO('/', xN(1), xO('*', xN(2), xFn('sqrt', u))), asin: u => xO('/', xN(1), xFn('sqrt', xO('-', xN(1), xO('^', P(u), xN(2))))), acos: u => ({t: 'neg', a: xO('/', xN(1), xFn('sqrt', xO('-', xN(1), xO('^', P(u), xN(2)))))}), atan: u => xO('/', xN(1), xO('+', xN(1), xO('^', P(u), xN(2)))),
        sinh: u => xFn('cosh', u), cosh: u => xFn('sinh', u), cot: u => ({t: 'neg', a: xO('/', xN(1), xO('^', xFn('sin', u), xN(2)))}), sec: u => xO('*', xFn('sec', u), xFn('tan', u)), abs: u => xO('/', u, xFn('abs', u))};
      if (f === 'log' && n.args.length === 2){ return D(xO('/', xFn('ln', u), xFn('ln', n.args[1]))); }
      if (f === 'root' && n.args.length === 2){ return D(xO('^', u, xO('/', xN(1), n.args[1]))); }
      if (TBL[f] && n.args.length === 1){
        const outer = TBL[f](u);
        if (u.t === 'sym' && u.n === x){ const r = xSimp(outer); rec('xs_dTable', dH(n) + ' = ' + xH(r)); return r; }
        const du = D(u), r = xSimp(xO('*', P(xSimp(outer)), P(du)));
        rec('xs_dChain2', `<div>(f(u))′ = f′(u)·u′</div>u = ${xH(u)} &nbsp;⟹&nbsp; u′ = ${xH(du)}<div>${dH(n)} = ${xH(r)}</div>`); return r;
      }
      break;
    }
  }
  throw MX_ERR('xs_eDiff');
}
/* ---------- integrals ---------- */
function xsI(n, x, L, S){
  const P = m => (m.t === 'op' && (m.o === '+' || m.o === '-')) || m.t === 'neg' ? {t: 'par', a: m} : m;
  const iH = m => `<span class="mxbig-s">∫</span>${xH(P(m))} d<i class="mxv">${mxEsc(x)}</i>`;
  const lin = u => { const R = xRatOk(u, x, S); return R && xPdeg(R.d) <= 0 && xPdeg(R.n) === 1 ? {a: xFdiv(R.n[1], R.d[0]), b: xFdiv(R.n[0], R.d[0])} : null; };
  if (!xHas(n, x)){ const r = xSimp(xO('*', P(n), xS(x))); xsStep(L, 'xs_iConst', {}, iH(n) + ' = ' + xH(r)); return r; }
  if (n.t === 'par') return xsI(n.a, x, L, S);
  if (n.t === 'neg'){ const r = xsI(n.a, x, L, S); return r && xSimp({t: 'neg', a: r}); }
  if (n.t === 'op' && (n.o === '+' || n.o === '-')){
    xsStep(L, 'xs_iSum', {}, iH(n) + ' = ' + iH(n.a) + (n.o === '+' ? ' + ' : ' − ') + iH(n.b));
    const A = xsI(n.a, x, L, S), B = xsI(n.b, x, L, S); return A && B ? xSimp(xO(n.o, A, P(B))) : null;
  }
  if (n.t === 'op' && n.o === '*' && (!xHas(n.a, x) || !xHas(n.b, x))){
    const c = xHas(n.a, x) ? n.b : n.a, f = xHas(n.a, x) ? n.a : n.b;
    xsStep(L, 'xs_iConstOut', {}, iH(n) + ' = ' + xH(P(c)) + '·' + iH(f));
    const r = xsI(f, x, L, S); return r ? xSimp(xO('*', P(c), P(r))) : null;
  }
  if (n.t === 'op' && n.o === '/' && !xHas(n.b, x)){
    xsStep(L, 'xs_iConstOut', {}, iH(n) + ' = ' + xH(xO('/', xN(1), n.b)) + '·' + iH(n.a));
    const r = xsI(n.a, x, L, S); return r ? xSimp(xO('/', P(r), P(n.b))) : null;
  }
  /* c / (ax+b) and c / x^n */
  if (n.t === 'op' && n.o === '/' && !xHas(n.a, x)){
    const l = lin(n.b);
    if (l){ const r = xSimp(xO('*', xO('/', n.a, xFnode(l.a)), xFn('ln', xFn('abs', n.b)))); xsStep(L, l.a.n === 1 && l.a.d === 1 ? 'xs_iLn' : 'xs_iLinSub', {a: xFtxt(l.a)}, iH(n) + ' = ' + xH(r)); return r; }
    if (n.b.t === 'op' && n.b.o === '^' && !xHas(n.b.b, x)) return xsI(xO('*', n.a, xO('^', n.b.a, {t: 'neg', a: n.b.b})), x, L, S);
    if (n.b.t === 'fn' && n.b.n === 'sqrt') return xsI(xO('*', n.a, xO('^', n.b.args[0], xN(-0.5))), x, L, S);
  }
  /* (ax+b)^n */
  if (n.t === 'op' && n.o === '^' && !xHas(n.b, x)){
    const l = lin(n.a), k = mxEval(n.b, S || {v: {}, f: {}});
    if (l && k !== -1){ const r = xSimp(xO('/', xO('^', P(n.a), xN(k + 1)), xFnode(xFmul(l.a, xFnum(k + 1))))); xsStep(L, n.a.t === 'sym' ? 'xs_iPow' : 'xs_iLinSub', {a: xFtxt(l.a)}, (n.a.t === 'sym' ? '∫' + xH(xS(x)) + '<sup>n</sup> d' + xH(xS(x)) + ' = ' + xH(xS(x)) + '<sup>n+1</sup>/(n+1) + C &nbsp;⟹&nbsp; ' : '') + iH(n) + ' = ' + xH(r)); return r; }
    if (l && k === -1) return xsI(xO('/', xN(1), n.a), x, L, S);
  }
  if (n.t === 'sym' && n.n === x){ const r = xO('/', xO('^', xS(x), xN(2)), xN(2)); xsStep(L, 'xs_iPow', {}, iH(n) + ' = ' + xH(r)); return r; }
  if (n.t === 'fn' && n.args.length === 1){
    const f = n.n.toLowerCase(), u = n.args[0], l = lin(u);
    const T = {sin: u => ({t: 'neg', a: xFn('cos', u)}), cos: u => xFn('sin', u), exp: u => xFn('exp', u), sqrt: u => xO('*', xO('/', xN(2), xN(3)), xO('^', P(u), xO('/', xN(3), xN(2)))), sinh: u => xFn('cosh', u), cosh: u => xFn('sinh', u), tan: u => ({t: 'neg', a: xFn('ln', xFn('abs', xFn('cos', u)))}), ln: u => xO('-', xO('*', P(u), xFn('ln', u)), P(u))};
    if (T[f] && l){ const base = T[f](u), r = l.a.n === 1 && l.a.d === 1 ? xSimp(base) : xSimp(xO('*', xO('/', xN(1), xFnode(l.a)), P(base))); xsStep(L, u.t === 'sym' ? 'xs_iTable' : 'xs_iLinSub', {a: xFtxt(l.a)}, iH(n) + ' = ' + xH(r)); return r; }
  }
  if (n.t === 'op' && n.o === '^' && !xHas(n.a, x)){ /* a^(kx+b) */
    const l = lin(n.b); if (l){ const isE = n.a.t === 'sym' && n.a.n === 'e', den = isE ? xFnode(l.a) : xO('*', xFnode(l.a), xFn('ln', n.a)), r = xSimp(xO('/', n, den)); xsStep(L, isE && l.a.n === 1 && l.a.d === 1 ? 'xs_iTable' : 'xs_iLinSub', {a: xFtxt(l.a)}, iH(n) + ' = ' + xH(r)); return r; }
  }
  /* integration by parts: polynomial × (e^…, sin, cos) or ln × polynomial */
  if (n.t === 'op' && n.o === '*' && (XS.parts || 0) < 6){
    const isPoly = m => { const r = xRatOk(m, x, S); return r && xPdeg(r.d) <= 0 && xPdeg(r.n) >= 1; };
    const isTr = m => (m.t === 'fn' && ['sin', 'cos', 'exp'].includes(m.n.toLowerCase()) && lin(m.args[0])) || (m.t === 'op' && m.o === '^' && !xHas(m.a, x) && lin(m.b));
    const isLn = m => m.t === 'fn' && m.n.toLowerCase() === 'ln' && lin(m.args[0]);
    let u = null, dv = null;
    if (isPoly(n.a) && isTr(n.b)){ u = n.a; dv = n.b; } else if (isPoly(n.b) && isTr(n.a)){ u = n.b; dv = n.a; }
    else if (isLn(n.a) && (isPoly(n.b) || !xHas(n.b, x))){ u = n.a; dv = n.b; } else if (isLn(n.b) && (isPoly(n.a) || !xHas(n.a, x))){ u = n.b; dv = n.a; }
    if (u){
      XS.parts = (XS.parts || 0) + 1;
      const L2 = [], du = xSimp(xsD(u, x, L2)), v = xsI(dv, x, [], S);
      if (v){
        const rest = xSimp(xO('*', v, du));
        xsStep(L, 'xs_iParts', {}, `<div>∫u·dv = u·v − ∫v·du</div>u = ${xH(u)}, &nbsp;dv = ${xH(dv)} d${mxEsc(x)} &nbsp;⟹&nbsp; du = ${xH(du)} d${mxEsc(x)}, &nbsp;v = ${xH(v)}<div>${iH(n)} = ${xH(xO('*', P(u), P(v)))} − ${iH(rest)}</div>`);
        const W = xsI(rest, x, L, S);
        if (W) return xSimp(xO('-', xO('*', P(u), P(v)), P(W)));
      }
    }
  }
  /* polynomial (or rational with a constant denominator) written as a product: expand first */
  const R = xRatOk(n, x, S);
  if (R && xPdeg(R.d) <= 0 && xPdeg(R.n) >= 0){ const p = xPscale(R.n, xFdiv(xF1, R.d[0])), pn = xPnode(p, x); if (xStr(pn) !== xStr(n)){ xsStep(L, 'xs_iExpand', {}, xH(n) + ' = ' + xH(pn)); return xsI(pn, x, L, S); } }
  return null;
}
/* ---------- limits ---------- */
function xsLimit(f, x, a, S, L){
  const isInf = !isFinite(a);
  xsStep(L, 'xs_stGivenLim', {}, 'lim<sub>' + xH(xS(x)) + '→' + (isInf ? (a > 0 ? '∞' : '−∞') : xNumH(a)) + '</sub> ' + xH(f));
  if (!isInf){ const v = xVal(f, x, a, S); if (isFinite(v)){ xsStep(L, 'xs_stDirect', {}, xH(f) + ' |<sub>' + mxEsc(x) + '=' + xNumH(a) + '</sub> = ' + xNumH(v)); return v; } }
  let R = xRatOk(f, x, S);
  if (f.t === 'op' && f.o === '/'){ const RN = xRatOk(f.a, x, S), RD = xRatOk(f.b, x, S); if (RN && RD && xPdeg(RN.d) <= 0 && xPdeg(RD.d) <= 0) R = {n: xPscale(RN.n, xFdiv(xF1, RN.d[0])), d: xPscale(RD.n, xFdiv(xF1, RD.d[0]))}; }
  if (R && xPdeg(R.d) > 0){
    if (isInf){
      const dn = xPdeg(R.n), dd = xPdeg(R.d);
      xsStep(L, 'xs_stLead', {n: dn, d: dd}, xH(xO('/', xPnode([...Array(Math.max(0, dn)).fill(xFZ), R.n[dn]], x), xPnode([...Array(dd).fill(xFZ), R.d[dd]], x))));
      if (dn < dd){ xsStep(L, 'xs_stLimRes', {}, '= 0'); return 0; }
      if (dn === dd){ const v = xFv(R.n[dn]) / xFv(R.d[dd]); xsStep(L, 'xs_stLimRes', {}, '= ' + xH(xFnode(xFdiv(R.n[dn], R.d[dd])))); return v; }
      const s = Math.sign(xFv(R.n[dn]) / xFv(R.d[dd])) * (((dn - dd) % 2 === 0) || a > 0 ? 1 : -1); xsStep(L, 'xs_stLimRes', {}, '= ' + (s > 0 ? '∞' : '−∞')); return s * Infinity;
    }
    const fa = xsTryF(a);
    if (fa && xF0(xPeval(R.n, fa)) && xF0(xPeval(R.d, fa))){
      xsStep(L, 'xs_st00', {}, '0/0');
      let N = R.n, Dd = R.d, k = 0; const fac = [xFneg(fa), xF1];
      while (k++ < 6 && xF0(xPeval(N, fa)) && xF0(xPeval(Dd, fa))){ N = xPdivmod(N, fac).q; Dd = xPdivmod(Dd, fac).q; }
      const fN = xsFactorPoly(R.n, x, null), fD = xsFactorPoly(R.d, x, null);
      xsStep(L, 'xs_stFactorND', {}, xH(xO('/', xPnode(R.n, x), xPnode(R.d, x))) + ' = ' + xH(xO('/', fN, fD)));
      xsStep(L, 'xs_stCancel', {f: xStr(xPnode(fac, x))}, xH(xPdeg(Dd) <= 0 ? xPnode(xPscale(N, xFdiv(xF1, Dd[0])), x) : xO('/', xPnode(N, x), xPnode(Dd, x))));
      const den = xPevalN(Dd, a), num = xPevalN(N, a);
      if (Math.abs(den) > 1e-14){ const v = num / den; xsStep(L, 'xs_stDirect', {}, '= ' + xH(xsExact(v))); return v; }
    }
  }
  /* L'Hôpital for a quotient */
  let cur = f, k = 0;
  while (cur.t === 'op' && cur.o === '/' && k++ < 4 && !isInf){
    const na = xVal(cur.a, x, a, S), nb = xVal(cur.b, x, a, S);
    const zz = Math.abs(na) < 1e-12 && Math.abs(nb) < 1e-12, ii = !isFinite(na) && !isFinite(nb);
    if (!zz && !ii) break;
    xsStep(L, zz ? 'xs_st00' : 'xs_stInfInf', {}, zz ? '0/0' : '∞/∞');
    let da, db; try { const L2 = []; da = xSimp(xsD(cur.a, x, L2)); db = xSimp(xsD(cur.b, x, L2)); } catch (e) { break; }
    cur = xO('/', da, db); xsStep(L, 'xs_stLHop', {}, xH(cur));
    const v = xVal(cur, x, a, S); if (isFinite(v)){ xsStep(L, 'xs_stDirect', {}, '= ' + xNumH(v)); return v; }
  }
  /* numbers from both sides */
  const pts = isInf ? [10, 100, 1000, 1e5, 1e7].map(h => a > 0 ? h : -h) : [1e-2, 1e-3, 1e-5, 1e-7];
  const rows = isInf ? pts.map(p => [p, xVal(f, x, p, S)]) : pts.map(h => [h, xVal(f, x, a - h, S), xVal(f, x, a + h, S)]);
  xsStep(L, 'xs_stLimNum', {}, `<div class="scroll"><table class="tbl mx-tbl" dir="ltr"><thead><tr>${isInf ? `<th>${mxEsc(x)}</th><th>f(${mxEsc(x)})</th>` : `<th>h</th><th>f(a−h)</th><th>f(a+h)</th>`}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${mxFmt(c, 8)}</td>` : `<th>${mxFmt(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`);
  const last = rows[rows.length - 1];
  if (isInf) return last[1];
  if (Math.abs(last[1] - last[2]) < 1e-4 * Math.max(1, Math.abs(last[1]))) return (last[1] + last[2]) / 2;
  xsStep(L, 'xs_stLimDNE'); return NaN;
}
/* ---------- understand a typed exercise ---------- */
const XS_W = {
  diff: /(נגזרת|גזור|גזרו|גזרי|derivative|differentiate|d\/dx|مشتقة|اشتق|المشتقة)/i,
  integ: /(אינטגרל|integral|integrate|∫|تكامل|التكامل)/i,
  limit: /(גבול|limit|\blim\b|نهاية)/i,
  factor: /(פרק(?:ו|י)? לגורמים|פירוק לגורמים|פרק|factor|حلل|تحليل)/i,
  expand: /(פתח(?:ו|י)? סוגריים|פתיחת סוגריים|פתח|expand|فك الأقواس|انشر)/i,
  simp: /(פשט|פשטו|צמצם|simplify|reduce|بسّط|بسط|اختصر)/i,
  solve: /(פתור|פתרו|פתרי|מצא|מצאו|חשב|חשבו|solve|find|calculate|compute|evaluate|حل|احسب|أوجد)/i
};
function xsParseTask(raw, S){
  let s = String(raw || '').replace(/[‎‏]/g, '').replace(/\r/g, '').trim();
  for (let i = 0; i < 4 && /\|[^|]+\|/.test(s); i++) s = s.replace(/\|([^|]+)\|/g, 'abs($1)');
  if (!s) return null;
  const balancedCall = z => { const m = /^\s*[A-Za-z]+\s*\(/.exec(z); if (!m) return false; let d = 0; for (let i = m[0].length - 1; i < z.length; i++){ if (z[i] === '(') d++; else if (z[i] === ')'){ d--; if (d === 0) return z.slice(i + 1).trim() === ''; } } return false; };
  const call = balancedCall(s) ? mxSplitCall(s.replace(/\s+/g, ' ')) : null;
  if (call && ['solve', 'diff', 'derivative', 'integrate', 'limit', 'factor', 'expand', 'simplify'].includes(call.n)){
    const m = {diff: 'diff', derivative: 'diff', integrate: 'integ', limit: 'limit', factor: 'factor', expand: 'expand', simplify: 'simp', solve: 'solve'}[call.n];
    return {mode: m, body: call.a[0], v: call.a[1], a: call.a[2], b: call.a[3], call: true};
  }
  let mode = '';
  for (const k of ['diff', 'integ', 'limit', 'factor', 'expand', 'simp', 'solve']) if (XS_W[k].test(s)){ mode = k; break; }
  if (/\b[a-z]\s*'\s*\(\s*[a-z]\s*\)|\by\s*'/.test(s)) mode = 'diff';
  let a = null, b = null, v = null;
  /* "x -> 2", "x→∞", "כאשר x שואף ל-2" */
  const lm = /([a-z])\s*(?:->|→|שואף\s*ל-?|tends to|approaches|يؤول إلى)\s*(-?\s*(?:∞|inf|infinity|אינסוף|\d+(?:\.\d+)?|pi|π|e))/i.exec(s);
  if (lm){ v = lm[1]; a = lm[2].replace(/\s+/g, ''); s = s.replace(lm[0], ' '); if (!mode) mode = 'limit'; }
  /* definite integral bounds: "from 0 to 3", "בין 0 ל-3", "מ-0 עד 3", "∫_0^3" */
  const bm = /(?:from|מ-?|بين|من)\s*(-?[\d.]+|pi|π)\s*(?:to|עד|ל-?|إلى|و)\s*(-?[\d.]+|pi|π)/i.exec(s) || /(?:בין)\s*(-?[\d.]+|pi|π)\s*(?:ל-?|לבין)\s*(-?[\d.]+|pi|π)/i.exec(s) || /∫\s*_\s*\{?(-?[\d.]+|pi|π)\}?\s*\^\s*\{?(-?[\d.]+|pi|π)\}?/.exec(s);
  if (bm && (mode === 'integ' || /∫/.test(s))){ a = bm[1]; b = bm[2]; s = s.replace(bm[0], ' '); mode = 'integ'; }
  /* strip the words and keep the maths */
  s = s.replace(/∫/g, ' ').replace(/\bd([a-z])\b\s*$/i, (m0, vv) => { v = v || vv; return ' '; }).replace(/\blim\b/gi, ' ');
  s = s.replace(/(^|\s)([a-z])\s*:\s*/i, (m0, sp, vv) => { v = v || vv; return sp; });
  s = s.replace(/[֐-׿؀-ۿ"״׳:?؟]+(?:[\s,\-]+[֐-׿؀-ۿ"״׳:?؟]+)*/g, ' ');
  s = s.replace(/\b(solve|find|calculate|compute|evaluate|derivative|differentiate|of|the|integral|integrate|limit|factor|expand|simplify|reduce|for|with respect to|wrt|and|equation|function)\b/gi, ' ').replace(/d\/d([a-z])/i, (m0, vv) => { v = v || vv; return ' '; });
  s = s.replace(/^\s*[,.;:\-]+|[,.;:\-]+\s*$/g, '').replace(/\s{2,}/g, ' ').trim();
  /* f(x) = ..., y = ... for a derivative / integral / limit */
  if (['diff', 'integ', 'limit', 'factor', 'expand', 'simp'].includes(mode)){ const fm = /^\s*(?:[a-z]\s*'?\s*\(\s*([a-z])\s*\)|y\s*'?)\s*=\s*([\s\S]+)$/i.exec(s); if (fm){ if (fm[1]) v = v || fm[1]; s = fm[2]; } }
  const FILL = /^(את|של|הבא|הבאה|הבאות|הבאים|המשוואה|המשוואות|הביטוי|הפונקציה|התרגיל|עבור|כאשר|שואף|אינסוף|בין|עד|לבין|לפי|the|of|for|and|to|from|between|with|respect|wrt|equation|expression|function|following|dx|dy|lim|inf|infinity|pi|sqrt|root|abs|ln|log|log2|exp|sin|cos|tan|cot|sec|csc|asin|acos|atan|sinh|cosh|tanh|mod|diff|integrate|limit|solve|factor|expand|simplify|derivative|integral|المعادلة|الدالة|التعبير|التالية|عندما|إلى|من|بين)$/i;
  const words = String(raw).replace(/[^\u0590-\u05FF\u0600-\u06FFA-Za-z]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 1 && !FILL.test(w) && !Object.keys(XS_W).some(k => XS_W[k].test(w)) && !(S && (w in S.v || S.f[w])) && !MX_MATH[w.toLowerCase()] && !MX_FIN[w.toLowerCase()]);
  const lines = s.split(/\n|;/).map(z => z.trim()).filter(Boolean);
  return {mode, body: lines.length > 1 ? lines : s, v, a, b, words: words.length, raw: String(raw)};
}
/* ---------- the main entry: returns {kind, steps, answer (html), answerTxt, ok, nerd?} ---------- */
async function xsSolve(raw, S0){
  XS.trigNote = false;
  const S = S0 || {v: {}, f: {}}, L = [];
  const task = xsParseTask(raw, S); if (!task) return null;
  const parse = src => { try { return mxParse(src); } catch (e) { return null; } };
  const unknowns = node => { const o = []; (xStr(node).match(/[A-Za-z_]\w*/g) || []).forEach(v => { if (!(v in S.v) && !(v in MX_CONST) && !MX_MATH[v.toLowerCase()] && !MX_FIN[v.toLowerCase()] && !S.f[v] && !['sqrt', 'root', 'abs', 'ln', 'log', 'exp', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'cot', 'sec', 'csc', 'log2'].includes(v.toLowerCase()) && !o.includes(v)) o.push(v); }); return o; };
  const pickVar = (node, hint) => { if (hint && /^[A-Za-z]\w*$/.test(hint)) return hint; const u = unknowns(node); return u.includes('x') ? 'x' : u[0] || 'x'; };
  const R = (kind, answer, answerTxt, ok, extra) => Object.assign({kind, steps: L, answer, answerTxt, ok}, extra || {});
  /* systems */
  if (Array.isArray(task.body)){
    /* lines like "a = 2" give values; the rest is the exercise */
    task.body = task.body.filter(l => { const n = parse(l); if (n && n.t === 'assign' && !unknowns(n.e).length){ try { const v = mxEval(n.e, S); if (typeof v === 'number'){ S.v[n.n] = v; xsStep(L, 'xs_stGivenVal', {}, xH(xS(n.n)) + ' = ' + xNumH(v)); return false; } } catch (e) {} } if (n && n.t === 'fdef'){ S.f[n.n] = {ps: n.ps, e: n.e, src: l.slice(l.indexOf('=') + 1).trim()}; xsStep(L, 'xs_stGivenVal', {}, xH(n)); return false; } return true; });
    if (task.body.length === 1) task.body = task.body[0];
  }
  if (Array.isArray(task.body)){
    const eqs = task.body.map(l => { const n = parse(l); return n && n.t === 'eq' ? n : null; });
    if (eqs.some(e => !e)) return R('fail', '', '', false, {why: 'parse'});
    const r = xsSystem(eqs, S, L);
    if (!r) return R('fail', '', '', false, {why: 'sys'});
    if (r.none) return R('sys', mxEsc(t('xs_noSol')), t('xs_noSol'), true);
    if (r.inf) return R('sys', mxEsc(t('xs_infSol')), t('xs_infSol'), true);
    const ans = r.sols.map(s => r.vars.map(v => xH(xS(v)) + ' = ' + (r.exact ? xH(xFnode(r.exact[v])) : xNumH(s[v]))).join(', ')).join(' &nbsp;|&nbsp; ') || mxEsc(t('xs_noSol'));
    return R('sys', ans, r.sols.map(s => r.vars.map(v => v + ' = ' + mxFmt(s[v])).join(', ')).join(' | '), true);
  }
  let src = task.body;
  if (!src) return R('fail', '', '', false, {why: task.words >= 2 ? 'words' : 'empty'});
  if (task.words >= 2) return R('fail', '', '', false, {why: 'words'});
  /* derivative */
  if (task.mode === 'diff'){
    const n = parse(src); if (!n || n.t === 'eq' || n.t === 'assign') return R('fail', '', '', false, {why: 'parse'});
    const node = n.t === 'fdef' ? n.e : n, x = pickVar(node, task.v);
    xsStep(L, 'xs_stGivenD', {}, `<i class="mxv">f</i>(<i class="mxv">${mxEsc(x)}</i>) = ${xH(node)}`);
    let d; try { d = xSimp(xsD(node, x, L)); } catch (e) { return R('fail', '', '', false, {why: 'diff', node, x}); }
    let nice = d;
    const Rd = xRatOk(d, x, S);
    if (!Rd){ const nn = await xsNicer(d, x, S); if (nn){ nice = nn; xsStep(L, 'xs_stSimp', {}, xH(d) + ' = ' + xH(nn)); } }
    if (Rd){ const tn = xPdeg(Rd.d) <= 0 ? xPnode(xPscale(Rd.n, xFdiv(xF1, Rd.d[0])), x) : xO('/', xPnode(Rd.n, x), xsFactorPoly(Rd.d, x, null)); if (xStr(tn) !== xStr(d)){ nice = tn; xsStep(L, 'xs_stSimp', {}, xH(d) + ' = ' + xH(tn)); } }
    /* numeric check */
    let ok = true; const chk = [0.37, 1.3, 2.1].map(p => { const h = 1e-5, num = (xVal(node, x, p + h, S) - xVal(node, x, p - h, S)) / (2 * h), sym = xVal(nice, x, p, S); if (isFinite(num) && isFinite(sym) && Math.abs(num - sym) > 1e-4 * Math.max(1, Math.abs(num))) ok = false; return isFinite(num) && isFinite(sym) ? `${mxEsc(x)} = ${p}: &nbsp;${xNumH(sym)} ≈ ${xNumH(num)} ${Math.abs(num - sym) <= 1e-4 * Math.max(1, Math.abs(num)) ? '✓' : '✗'}` : ''; }).filter(Boolean);
    if (chk.length) xsStep(L, 'xs_stCheckD', {}, chk.join('<br>'));
    let ans = `<i class="mxv">f</i>′(<i class="mxv">${mxEsc(x)}</i>) = ${xH(nice)}`, txt = "f'(" + x + ') = ' + xStr(nice);
    if (task.a != null && task.a !== ''){ const at = Number(String(task.a).replace('π', String(Math.PI)).replace(/^pi$/, String(Math.PI))); if (isFinite(at)){ const v = xVal(nice, x, at, S); xsStep(L, 'xs_stAt', {}, `<i class="mxv">f</i>′(${xNumH(at)}) = ${xNumH(v)}`); ans += ` &nbsp;·&nbsp; <i class="mxv">f</i>′(${xNumH(at)}) = ${xNumH(v)}`; txt += '; f\'(' + at + ') = ' + mxFmt(v); } }
    return R('diff', ans, txt, ok);
  }
  /* integral */
  if (task.mode === 'integ'){
    const n = parse(src); if (!n || n.t === 'eq') return R('fail', '', '', false, {why: 'parse'});
    const node = n.t === 'fdef' ? n.e : n, x = pickVar(node, task.v), def = task.a != null && task.b != null && task.a !== '' && task.b !== '';
    xsStep(L, 'xs_stGivenI', {}, def ? `<span class="mxbig"><span class="mxbig-t">${mxEsc(task.b)}</span><span class="mxbig-s">∫</span><span class="mxbig-b">${mxEsc(task.a)}</span></span>${xH(node)} d<i class="mxv">${mxEsc(x)}</i>` : `<span class="mxbig-s">∫</span>${xH(node)} d<i class="mxv">${mxEsc(x)}</i>`);
    XS.parts = 0; let F = xsI(node, x, L, S), viaLib = false;
    if (!F){
      try { const N = await mxNerd(); const r = String(N('integrate(' + xStr(node).replace(/\bln\(/g, 'log(') + ',' + x + ')').toString()).replace(/\blog\(/g, 'ln('); const fn = parse(r); if (fn && !/integrate/.test(r)){ F = fn; viaLib = true; xsStep(L, 'xs_iLib', {}, xH(F)); } } catch (e) {}
    }
    if (!F) return R('fail', '', '', false, {why: 'integ', node, x});
    F = xSimp(F);
    { const RF = xRatOk(F, x, S); if (RF && xPdeg(RF.d) <= 0){ const tn = xPnode(xPscale(RF.n, xFdiv(xF1, RF.d[0])), x); if (xStr(tn) !== xStr(F)){ xsStep(L, 'xs_stSimp', {}, xH(F) + ' = ' + xH(tn)); F = tn; } }
      else if (!viaLib){ const nn = await xsNicer(F, x, S); if (nn){ xsStep(L, 'xs_stSimp', {}, xH(F) + ' = ' + xH(nn)); F = nn; } } }
    /* check: F' = f */
    let ok = true; const chk = [0.41, 1.7].map(p => { const h = 1e-5, dF = (xVal(F, x, p + h, S) - xVal(F, x, p - h, S)) / (2 * h), f = xVal(node, x, p, S); if (isFinite(dF) && isFinite(f) && Math.abs(dF - f) > 1e-4 * Math.max(1, Math.abs(f))) ok = false; return isFinite(dF) && isFinite(f) ? `F′(${p}) = ${xNumH(dF)} ≈ f(${p}) = ${xNumH(f)} ${Math.abs(dF - f) <= 1e-4 * Math.max(1, Math.abs(f)) ? '✓' : '✗'}` : ''; }).filter(Boolean);
    if (!def){
      if (chk.length) xsStep(L, 'xs_stCheckI', {}, chk.join('<br>'));
      return R('integ', `${xH(F)} + <i class="mxv">C</i>`, xStr(F) + ' + C', ok, {viaLib});
    }
    const ev = s => mxEval(mxParse(String(s).replace('π', 'pi')), S), A = ev(task.a), B = ev(task.b), FB = xVal(F, x, B, S), FA = xVal(F, x, A, S), v = FB - FA;
    xsStep(L, 'xs_iFTC', {}, `F(${mxEsc(x)}) = ${xH(F)}<div>F(${mxEsc(task.b)}) − F(${mxEsc(task.a)}) = ${xNumH(FB)} − ${FA < 0 ? '(' + xNumH(FA) + ')' : xNumH(FA)} = <b>${xNumH(v)}</b></div>`);
    const simp = mxSimpson(z => xVal(node, x, z, S), A, B); if (isFinite(simp)){ const g = Math.abs(simp - v) <= 1e-5 * Math.max(1, Math.abs(v)); if (!g) ok = false; xsStep(L, 'xs_stCheckNum', {}, `Simpson ≈ ${xNumH(simp)} ${g ? '✓' : '✗'}`); }
    const fr = mxFrac(v);
    return R('integ', `<b>${xNumH(v)}</b>${fr ? ' <span class="mx-sub">= ' + mxEsc(fr) + '</span>' : ''}`, mxFmt(v), ok && isFinite(v), {viaLib});
  }
  /* limit */
  if (task.mode === 'limit'){
    const n = parse(src); if (!n || n.t === 'eq') return R('fail', '', '', false, {why: 'parse'});
    const node = n.t === 'fdef' ? n.e : n, x = pickVar(node, task.v);
    const as = String(task.a == null ? '0' : task.a).replace(/^-?(∞|inf|infinity|אינסוף)$/i, m => (m[0] === '-' ? '-' : '') + 'Infinity');
    const a = /Infinity/.test(as) ? Number(as) : mxEval(mxParse(as.replace('π', 'pi')), S);
    const v = xsLimit(node, x, a, S, L);
    return R('limit', isNaN(v) ? mxEsc(t('xs_dne')) : `<b>${v === Infinity ? '∞' : v === -Infinity ? '−∞' : mxEsc(mxFmt(v))}</b>${mxFrac(v) ? ' <span class="mx-sub">= ' + mxEsc(mxFrac(v)) + '</span>' : ''}`, isNaN(v) ? 'DNE' : mxFmt(v), !isNaN(v));
  }
  let n = parse(src);
  if (!n) return R('fail', '', '', false, {why: task.words > 2 ? 'words' : 'parse'});
  if (n.t === 'fdef' && (MX_MATH[n.n.toLowerCase()] || ['sin', 'cos', 'tan', 'ln', 'log', 'exp', 'sqrt', 'abs'].includes(n.n.toLowerCase()))) n = {t: 'eq', a: {t: 'fn', n: n.n, args: n.ps.map(xS)}, b: n.e};
  /* inequality */
  if (n.t === 'op' && ['<', '>', '<=', '>='].includes(n.o)){
    const x = pickVar(n, task.v); const r = xsInequality(n, x, S, L);
    return R('ineq', `<span dir="ltr">${xH(xS(x))} ∈ ${mxEsc(r.txt)}</span>`, x + ' ∈ ' + r.txt, true);
  }
  /* equation */
  if (n.t === 'eq' || (n.t === 'assign' && unknowns(n.e).length)){
    const eq = n.t === 'eq' ? n : {t: 'eq', a: xS(n.n), b: n.e};
    const u = unknowns(eq);
    if (!u.length){ const a = mxEval(eq.a, S), b = mxEval(eq.b, S), g = Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a)); xsStep(L, 'xs_stGiven', {}, xEqH(eq.a, eq.b)); xsStep(L, 'xs_stCompare', {}, xNumH(a) + (g ? ' = ' : ' ≠ ') + xNumH(b)); return R('eq', mxEsc(t(g ? 'xs_true' : 'xs_false')), t(g ? 'xs_true' : 'xs_false'), true); }
    const x = pickVar(eq, task.v);
    if (u.length > 1) return R('fail', '', '', false, {why: 'vars'});
    const r = xsEquation(eq, x, S, L);
    if (r.all){ return R('eq', mxEsc(t('xs_allSol')), t('xs_allSol'), true); }
    const ok = r.roots.length ? xsVerify(eq, x, r.roots, S, L) : true;
    const ans = r.roots.length ? r.roots.map((rt, i) => xH(xS(x)) + (r.roots.length > 1 ? '<sub>' + (i + 1) + '</sub>' : '') + ' = ' + (rt.ex ? xH(rt.ex) + (rt.ex.t !== 'num' && !(rt.ex.t === 'neg' && rt.ex.a.t === 'num') ? ' <span class="mx-sub">≈ ' + xNumH(rt.v) + '</span>' : '') : xNumH(rt.v))).join(' &nbsp;,&nbsp; ') + (XS.trigNote ? `<div class="mx-sub">${mxEsc(t('xs_trigNote'))}</div>` : '') : mxEsc(t('xs_noSol'));
    return R('eq', ans, r.roots.length ? r.roots.map(rt => x + ' = ' + mxFmt(rt.v)).join(', ') : t('xs_noSol'), ok, {how: r.how});
  }
  if (n.t === 'fdef' || n.t === 'assign') return R('fail', '', '', false, {why: 'fdef'});
  if (n.t === 'sym' && !(n.n in S.v) && !(n.n in MX_CONST)) return R('fail', '', '', false, {why: 'expr'});
  /* an expression */
  const u = unknowns(n);
  if (!u.length){ /* arithmetic */
    let v; try { v = mxEval(n, S); } catch (e) { return R('fail', '', '', false, {why: 'eval', err: e}); }
    xsStep(L, 'xs_stGivenE', {}, xH(n));
    const ex = xRatOk(n, '_', S), exactOk = ex && /\//.test(xStr(n)) && !/\d\.\d/.test(xStr(n)) && !/[a-z]/i.test(xStr(n));
    if (exactOk) xsExactSteps(n, L); else mxSteps(n, S).forEach(s => xsStep(L, s.k || 'xs_stCalc', {}, s.h));
    if (!exactOk && ex && typeof v === 'number' && ex.n.length === 1 && ex.d.length === 1){ const f = xFdiv(ex.n[0], ex.d[0]); if (f.d !== 1) xsStep(L, 'xs_stFracRes', {}, xH(n) + ' = ' + xH(xFnode(f))); }
    const fr = typeof v === 'number' ? mxFrac(v) : '';
    return R('calc', (mxIsM(v) ? mxValHTML(v) : `<b>${mxEsc(mxFmt(v, mxDec()))}</b>`) + (fr ? ' <span class="mx-sub">= ' + mxEsc(fr) + '</span>' : ''), mxFmt(v), true);
  }
  const x = pickVar(n, task.v), Rr = xRatOk(n, x, S);
  xsStep(L, 'xs_stGivenE', {}, xH(n));
  if (Rr && u.length === 1){
    const md = task.mode === 'factor' ? 'factor' : task.mode === 'expand' ? 'expand' : 'simp';
    if (xPdeg(Rr.d) <= 0){
      const p = xPscale(Rr.n, xFdiv(xF1, Rr.d[0])), pe = xPnode(p, x);
      if (xStr(pe) !== xStr(n)) xsStep(L, 'xs_stExpanded', {}, xH(n) + ' = ' + xH(pe));
      if (md === 'expand' || xPdeg(p) < 2){ return R('simp', xH(pe), xStr(pe), true); }
      const fac = xsFactorPoly(p, x, L);
      return R('simp', xH(md === 'factor' ? fac : pe) + (md !== 'factor' && xStr(fac) !== xStr(pe) ? `<div class="mx-sub">${mxEsc(t('xs_factored'))}: ${xH(fac)}</div>` : ''), xStr(md === 'factor' ? fac : pe), true);
    }
    /* a rational expression: factor, cancel, one fraction */
    const Nn = xPnode(Rr.n, x), Dn = xPnode(Rr.d, x);
    const q0 = n.t === 'par' ? n.a : n;
    if (q0.t === 'op' && q0.o === '/'){ const RN = xRatOk(q0.a, x, S), RD = xRatOk(q0.b, x, S);
      if (RN && RD && xPdeg(RN.d) <= 0 && xPdeg(RD.d) <= 0){ const pN = xPscale(RN.n, xFdiv(xF1, RN.d[0])), pD = xPscale(RD.n, xFdiv(xF1, RD.d[0])); xsStep(L, 'xs_stFactorND', {}, xH(xO('/', xsFactorPoly(pN, x, null), xsFactorPoly(pD, x, null)))); const g = xPgcd(pN, pD); if (xPdeg(g) > 0) xsStep(L, 'xs_stCancel', {f: xStr(xsFactorPoly(g, x, null))}, xH(xO('/', Nn, Dn))); } }
    else xsStep(L, 'xs_stOneFrac', {}, xH(n) + ' = ' + xH(xO('/', Nn, Dn)));
    const fN = xsFactorPoly(Rr.n, x, []), fD = xsFactorPoly(Rr.d, x, []);
    if (!(q0.t === 'op' && q0.o === '/') && (xStr(fN) !== xStr(Nn) || xStr(fD) !== xStr(Dn))) xsStep(L, 'xs_stFactorND', {}, xH(xO('/', fN, fD)));
    const holes = xsRealRootsSilent(Rr.d);
    if (holes.length) xsStep(L, 'xs_stDomain', {}, holes.map(v => xH(xS(x)) + ' ≠ ' + xH(xsExact(v))).join(', '));
    return R('simp', xH(xO('/', fN, fD)), xStr(xO('/', Nn, Dn)), true);
  }
  /* other expressions: the algebra library */
  try {
    const N = await mxNerd(), cmd = task.mode === 'factor' ? 'factor' : task.mode === 'expand' ? 'expand' : 'simplify';
    const r = String(N(cmd + '(' + xStr(n).replace(/\bln\(/g, 'log(') + ')').toString()).replace(/\blog\(/g, 'ln('); const rn = parse(r);
    if (rn){ const g = Math.abs(xVal(rn, x, 0.83, S) - xVal(n, x, 0.83, S)) < 1e-8 * Math.max(1, Math.abs(xVal(n, x, 0.83, S))); xsStep(L, 'xs_stLib', {}, xH(n) + ' = ' + xH(rn)); xsStep(L, 'xs_stCheckNum', {}, `${mxEsc(x)} = 0.83: ${xNumH(xVal(n, x, 0.83, S))} ${g ? '=' : '≠'} ${xNumH(xVal(rn, x, 0.83, S))} ${g ? '✓' : '✗'}`); return R('simp', xH(rn), r, g, {viaLib: true}); }
  } catch (e) {}
  return R('fail', '', '', false, {why: 'expr'});
}
/* factor a polynomial over the rationals, with the steps */
function xsFactorPoly(p, x, L){
  const {p: q, m} = xPint(p); const c = xFdiv(xF1, m);
  const L2 = []; const roots = xsPolyRoots(q, x, L2).roots.filter(r => r.ex && (r.ex.t === 'num' || (r.ex.t === 'neg' && r.ex.a.t === 'num') || (r.ex.t === 'op' && r.ex.o === '/') || (r.ex.t === 'neg' && r.ex.a.t === 'op' && r.ex.a.o === '/')));
  let rest = q; const facs = [];
  roots.forEach(r => { const f = xsTryF(r.v); if (!f) return; let k = 0; while (k++ < 8 && xPdeg(rest) > 0 && xF0(xPeval(rest, f))){ const lin = f.d === 1 ? [xFneg(f), xF1] : [xF(-f.n), xF(f.d)]; rest = xPdivmod(rest, lin).q; facs.push(lin); } });
  let lead = xFmul(c, rest.length === 1 ? rest[0] : xF1); if (rest.length > 1) facs.push(rest);
  const parts = {}; facs.forEach(f => { const k = xStr(xPnode(f, x)); parts[k] = parts[k] ? {f, n: parts[k].n + 1} : {f, n: 1}; });
  const nodes = Object.values(parts).map(({f, n}) => { const pn = xPnode(f, x), b = xPdeg(f) === 1 && f[0] && xF0(f[0]) && xFeq(f[1], xF1) ? pn : {t: 'par', a: pn}; return n > 1 ? xO('^', b, xN(n)) : b; });
  if (!nodes.length) return xFnode(lead);
  let node = nodes.reduce((a, b) => ({t: 'op', o: '*', a, b, imp: true}));
  if (!(lead.n === 1 && lead.d === 1)) node = lead.n === -1 && lead.d === 1 ? {t: 'neg', a: node} : {t: 'op', o: '*', a: xFnode(lead), b: node, imp: true};
  if (Array.isArray(L) && L !== L2){ L2.forEach(s => L.push(s)); xsStep(L, 'xs_stFactored', {}, xH(xPnode(p, x)) + ' = ' + xH(node)); }
  return node;
}

/* exact arithmetic with fractions, one operation at a time, with the common denominator shown */
function xsExactSteps(n0, L){
  const isK = m => m.t === 'num' || (m.t === 'neg' && isK(m.a)) || (m.t === 'op' && m.o === '/' && m.a.t === 'num' && m.b.t === 'num' && Number.isInteger(m.a.v) && Number.isInteger(m.b.v));
  const val = m => m.t === 'num' ? xFnum(m.v) : m.t === 'neg' ? xFneg(val(m.a)) : xF(m.a.v, m.b.v);
  let cur = xClone(n0);
  const step = (m) => {
    if (isK(m)) return null;
    if (m.t === 'par') { if (isK(m.a)) return {r: m.a}; const r = step(m.a); return r ? {r: Object.assign({}, m, {a: r.r}), pre: r.pre} : null; }
    for (const k of ['a', 'b']) if (m[k] && !isK(m[k])){ const r = step(m[k]); if (!r) return null; return {r: Object.assign({}, m, {[k]: r.r}), pre: r.pre ? Object.assign({}, m, {[k]: r.pre}) : null}; }
    if (m.t === 'neg') return {r: xFnode(xFneg(val(m.a)))};
    if (m.t === 'op'){
      const A = val(m.a), B = val(m.b);
      if ((m.o === '+' || m.o === '-') && A.d !== B.d && (A.d > 1 || B.d > 1)){
        const Lc = A.d / xsG(A.d, B.d) * B.d, fa = xF(A.n * (Lc / A.d), Lc), fb = xF(B.n * (Lc / B.d), Lc);
        const pre = xO(m.o, A.n < 0 ? {t: 'neg', a: xO('/', xN(Math.abs(A.n) * Lc / A.d), xN(Lc))} : xO('/', xN(A.n * Lc / A.d), xN(Lc)), B.n < 0 ? {t: 'par', a: {t: 'neg', a: xO('/', xN(Math.abs(B.n) * Lc / B.d), xN(Lc))}} : xO('/', xN(B.n * Lc / B.d), xN(Lc)));
        void fa; void fb;
        return {r: xFnode(m.o === '+' ? xFadd(A, B) : xFsub(A, B)), pre};
      }
      let r; switch (m.o){ case '+': r = xFadd(A, B); break; case '-': r = xFsub(A, B); break; case '*': r = xFmul(A, B); break; case '/': r = xFdiv(A, B); break; case '^': { if (B.d !== 1 || Math.abs(B.n) > 20) throw new Error('nonrat'); r = xF1; for (let i = 0; i < Math.abs(B.n); i++) r = xFmul(r, A); if (B.n < 0) r = xFdiv(xF1, r); break; } default: throw new Error('nonrat'); }
      return {r: xFnode(r)};
    }
    throw new Error('nonrat');
  };
  try {
    for (let i = 0; i < 40; i++){ const r = step(cur); if (!r) break; if (r.pre) xsStep(L, 'xs_stLCDn', {}, xH(r.pre)); cur = r.r; xsStep(L, 'xs_stCalc', {}, xH(cur)); if (isK(cur)) break; }
  } catch (e) { mxSteps(n0, {v: {}, f: {}}).forEach(s => xsStep(L, s.k || 'xs_stCalc', {}, s.h)); }
}
/* a multiple of π as π/6, 2π/3 … (for angles) */
function xsPi(v){ const q = v / Math.PI; for (let d = 1; d <= 12; d++){ const nn = Math.round(q * d); if (nn && Math.abs(q * d - nn) < 1e-9){ const g = xsG(nn, d), a = nn / g, b = d / g, top = Math.abs(a) === 1 ? xS('pi') : {t: 'op', o: '*', a: xN(Math.abs(a)), b: xS('pi'), imp: true}, fr = b === 1 ? top : xO('/', top, xN(b)); return a < 0 ? {t: 'neg', a: fr} : fr; } } return null; }

/* a shorter, equal form through the algebra library (only when it checks out numerically) */
async function xsNicer(node, x, S){
  try {
    const N = await mxNerd(); const st = xStr(node).replace(/\bln\(/g, 'log(');
    let best = null;
    for (const cmd of ['expand', 'simplify']){
      let r; try { r = String(N(cmd + '(' + st + ')').toString()).replace(/\blog\(/g, 'ln('); } catch (e) { continue; }
      const rn = (() => { try { return mxParse(r); } catch (e) { return null; } })(); if (!rn) continue;
      const okAll = [0.37, 1.21, 2.6].every(p => { const a = xVal(node, x, p, S), b = xVal(rn, x, p, S); return isFinite(a) && isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)); });
      if (okAll && r.length < (best ? best.s.length : st.length * 0.75)) best = {n: xSimp(rn), s: r};
    }
    return best ? best.n : null;
  } catch (e) { return null; }
}
