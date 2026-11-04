/* 13.65: the app opens faster – some big features (scanner, math solver, CV …) load a moment after the app is already on screen.
   Input: the app's script with /*@@LATE:name*\/ … /*@@END:name*\/ marks around those features (src/build.py adds them).
   The whole app lives inside one closure, so the late part cannot simply be a second script. This tool:
   - cuts the marked features out into app-late.js, wrapped in function(__C, __L){ … };
   - in the late part, every name of the app it uses becomes __C.name (a live link to the app's variable: read and write);
   - in the app, every name it uses from the late part becomes __L.name (filled when the late part runs);
   - adds the bridge, the loader and a short wait to the end of the app: a screen that needs the late part waits for it.
   Usage: node splitter.cjs in.js core.js late.js "tab1,tab2"   (prints a JSON report) */
const path = require('path'), fs = require('fs');
const req = m => { for (const b of [process.env.NODE_TOOLS || '', path.join(__dirname, '..', 'node_modules'), '/opt/node-tools/node_modules']) { if (!b) continue; try { return require(path.join(b, m)); } catch (e) {} } return require(m); };
const acorn = req('acorn'), escope = req('eslint-scope');
const [, , IN, OUT_CORE, OUT_LATE, TABS_ARG] = process.argv;
const src = fs.readFileSync(IN, 'utf8');
const fail = m => { console.error('SPLIT FAILED: ' + m); process.exit(2); };

const regs = []; const re = /\/\*@@LATE:([a-z0-9_]+)\*\/([\s\S]*?)\/\*@@END:\1\*\//g; let mm;
while ((mm = re.exec(src))) regs.push({name: mm[1], start: mm.index, end: mm.index + mm[0].length});
if (!regs.length) fail('no marked modules');
const regOf = p => { for (const r of regs) if (p >= r.start && p < r.end) return r; return null; };

const ast = acorn.parse(src, {ecmaVersion: 'latest', sourceType: 'script', ranges: true});
let iife = null;
for (const st of ast.body) { const e = st.expression; if (e && e.type === 'CallExpression' && e.callee.type === 'FunctionExpression' && (!iife || e.callee.end - e.callee.start > iife.end - iife.start)) iife = e.callee; }
if (!iife) fail('the app closure was not found');
// every marked part must be whole statements of the closure's body
for (const st of iife.body.body) { const a = regOf(st.start), b = regOf(st.end - 1); if (a !== b) fail('a statement crosses the edge of ' + ((a || b).name)); }
for (const r of regs) if (r.start < iife.body.start || r.end > iife.body.end) fail(r.name + ' is outside the app closure');

const sm = escope.analyze(ast, {ecmaVersion: 2022, sourceType: 'script', fallback: 'iteration'});
const sc = sm.acquire(iife);
if (!sc) fail('no scope for the closure');

// parents, for the few places where a name cannot simply be replaced (shorthand {a}, calls a())
const parent = new Map();
(function walk(n, p){
  if (!n || typeof n.type !== 'string') return; if (p) parent.set(n, p);
  for (const k in n){ if (k === 'type' || k === 'start' || k === 'end') continue; const v = n[k];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && walk(x, n)); else if (v && typeof v.type === 'string') walk(v, n); }
})(ast, null);

const edits = [];
const lateVars = [], coreForLate = new Map(), lateForCore = new Map();
function rewrite(id, expr){
  const p = parent.get(id);
  if (p && p.type === 'Property' && p.shorthand && (p.value === id || (p.value && p.value.type === 'AssignmentPattern' && p.value.left === id))){
    edits.push([id.start, id.end, id.name + ': ' + expr]); return; }
  if (p && ((p.type === 'CallExpression' && p.callee === id) || (p.type === 'TaggedTemplateExpression' && p.tag === id))){ edits.push([id.start, id.end, '(0, ' + expr + ')']); return; }
  if (p && p.type === 'NewExpression' && p.callee === id){ edits.push([id.start, id.end, '(' + expr + ')']); return; }
  edits.push([id.start, id.end, expr]);
}
for (const v of sc.variables){
  if (!v.defs.length) continue;
  const homes = new Set(v.defs.map(d => regOf(d.name.start)));
  if (homes.size > 1) fail('"' + v.name + '" is declared both inside and outside the late part (or in two late modules)');
  const home = [...homes][0];
  const kind = v.defs[0].type === 'Variable' ? v.defs[0].parent.kind : v.defs[0].type;
  if (home){
    lateVars.push(v.name);
    for (const rf of v.references){ if (regOf(rf.identifier.start)) continue; lateForCore.set(v.name, kind); rewrite(rf.identifier, '__L.' + v.name); }
  } else {
    for (const rf of v.references){ if (!regOf(rf.identifier.start)) continue; coreForLate.set(v.name, kind); rewrite(rf.identifier, '__C.' + v.name); }
  }
}
// late code must not use arguments/this of the closure, or names that only exist through "with"/eval
for (const r of regs){ const body = src.slice(r.start, r.end); if (/\beval\s*\(/.test(body)) fail(r.name + ' uses eval'); }

// apply the edits (from the end, so earlier positions stay right)
edits.sort((a, b) => b[0] - a[0]);
for (let i = 1; i < edits.length; i++) if (edits[i][1] > edits[i - 1][0]) fail('overlapping edits at ' + edits[i][0]);
let txt = src;
for (const [a, b, s] of edits) txt = txt.slice(0, a) + s + txt.slice(b);
// positions of the marks in the edited text
const regs2 = []; re.lastIndex = 0; while ((mm = re.exec(txt))) regs2.push({name: mm[1], start: mm.index, end: mm.index + mm[0].length, body: mm[2]});

const acc = (name, kind) => name + ': {get: () => ' + name + (kind === 'const' ? '' : ', set: v => { ' + name + ' = v; }') + ', configurable: true}';
const late = '/* the parts of the app that load a moment after it opens (built from the app\'s source – do not edit by hand) */\n'
  + '(function(f){ f.b = \'__LATE_BUILD__\'; if (window.__FIN_LATE) window.__FIN_LATE(f); else window.__FIN_LATE_Q = f; })(function(__C, __L){\n\'use strict\';\n'
  + (lateForCore.size ? 'Object.defineProperties(__L, {' + [...lateForCore].map(([n, k]) => acc(n, k)).join(', ') + '});\n' : '')
  + regs2.map(r => '/* ' + r.name + ' */\n' + r.body).join('\n') + '\n});\n';

let core = txt;
for (const r of regs2.slice().reverse()) core = core.slice(0, r.start) + '/* ' + r.name + ': in app-late.js */' + core.slice(r.end);
// the bridge + loader go at the very end of the closure
const end = core.lastIndexOf('})();'); if (end < 0) fail('end of the closure not found');
const LATE_TABS = (TABS_ARG || '').split(',').filter(Boolean);
const bridge = `
/* ---------- 13.65: the late part (app-late.js) – see src/splitter.cjs ---------- */
const __C = Object.defineProperties({}, {${[...coreForLate].map(([n, k]) => acc(n, k)).join(', ')}});
const __L = {};
const LATE_TABS = ${JSON.stringify(LATE_TABS)};
let __lateDone = false, __lateInit = false, __lateWant = null, __lateRetry = 0;
function __lateRun(f){
  if (__lateDone || typeof f !== 'function' || f.b !== '__LATE_BUILD__') return;
  __lateDone = true;
  try { f(__C, __L); } catch (e) { try { console.error(e); } catch (er) {} }
  try { document.documentElement.dataset.late = '1'; document.body.classList.remove('late-wait'); } catch (e) {}
  const w = __lateWant; __lateWant = null;
  if (w) { try { activate.apply(w.self, w.a); } catch (e) {} }
  else if (LATE_TABS.includes(tab)) { try { activate(tab); } catch (e) {} }
  else if (tab === 'home') { try { if (typeof calcHome === 'function') calcHome(); } catch (e) {} }
}
/* the late part has not arrived: ask for it again (a lost download on a weak connection) */
function __lateFetch(){
  if (__lateDone || __lateRetry > 2) return;
  const s0 = document.querySelector('script[data-late]'); if (!s0) return __lateLoad();
  __lateRetry++;
  const s = document.createElement('script'); s.async = true; s.dataset.late = '1'; s.src = s0.src.replace(/([?&])r=[0-9]+/, '') + (s0.src.indexOf('?') < 0 ? '?' : '&') + 'r=' + __lateRetry;
  document.head.appendChild(s);
}
function __lateKick(){ const f = window.__FIN_LATE_Q; if (f){ window.__FIN_LATE_Q = null; __lateRun(f); } }
window.__FIN_LATE = f => { if (__lateInit) setTimeout(() => __lateRun(f), 0); else window.__FIN_LATE_Q = f; };
{ const act0 = activate;
  activate = function(id){
    if (__lateInit && !__lateDone){
      if (LATE_TABS.includes(id)){
        __lateWant = {self: this, a: arguments}; __lateKick();
        if (!__lateDone){
          try { document.body.classList.add('late-wait'); if (typeof toast === 'function') toast(t('late_wait')); } catch (e) {}
          clearTimeout(__lateFetch.t); __lateFetch.t = setTimeout(__lateFetch, 4000);
        }
        return;
      }
      __lateWant = null; try { document.body.classList.remove('late-wait'); } catch (e) {}
    }
    return act0.apply(this, arguments);
  }; }
try { const st = document.createElement('style'); st.textContent = 'body.late-wait{cursor:progress}body.late-wait::before{content:"";position:fixed;top:0;inset-inline:0;height:3px;z-index:99999;background:linear-gradient(90deg,transparent,var(--gold,#E8B13A),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:lateBar 1s linear infinite}@keyframes lateBar{from{background-position:-50% 0}to{background-position:150% 0}}@media (prefers-reduced-motion:reduce){body.late-wait::before{animation:none;background:var(--gold,#E8B13A);opacity:.6}}'; document.head.appendChild(st); } catch (e) {}
`;
const tailInit = `
__lateInit = true;
/* after the first paint: run the late part (it is usually already downloaded) */
/* it is asked for only now, so on a slow connection the app itself arrives first (in a single-file copy it is already inside) */
function __lateLoad(){
  __lateKick(); if (__lateDone || document.querySelector('script[data-late]')) return;
  const me = document.querySelector('script[src*="app.js"]'); if (!me) return;
  const s = document.createElement('script'); s.async = true; s.dataset.late = '1'; s.src = me.src.replace(/app[.]js([?][^#]*)?$/, 'app-late.js?v=__LATE_BUILD__');
  document.head.appendChild(s);
}
try { requestAnimationFrame(() => setTimeout(__lateLoad, 0)); } catch (e) { setTimeout(__lateLoad, 0); }
`;
// the init calls (applyLang/activate/tryLive) are the last statements: put the bridge before them, and the start of the late part after them
const initAt = core.lastIndexOf('\napplyLang(false);', end);
if (initAt < 0) fail('the init calls were not found');
core = core.slice(0, initAt) + bridge + core.slice(initAt, end) + tailInit + core.slice(end);
fs.writeFileSync(OUT_CORE, core); fs.writeFileSync(OUT_LATE, late);
console.log(JSON.stringify({modules: regs.map(r => r.name), lateNames: lateVars.length, appNamesUsedByLate: coreForLate.size, lateNamesUsedByApp: [...lateForCore.keys()], edits: edits.length, core: core.length, late: late.length}));
