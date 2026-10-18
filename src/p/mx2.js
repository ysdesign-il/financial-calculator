/* ---------- 12.2: "full solution" tab — type a real exercise, get every step and a checked answer;
   and "mine" — your own functions, constants, keys and formulas, editable, used everywhere in the calculator ---------- */
MX.tab = 'solve';
const XS_MODES = ['auto', 'solve', 'diff', 'integ', 'limit', 'simp', 'factor'];
const XS_EX = ['2(x-3)+5 = 3x-4', 'x^2-5x+6 = 0', '3x^2-5x-2 = 0', 'x/(x-1) + 2/x = 3', 'x^3-6x^2+11x-6 = 0', '|2x-3| = 5', '3e^(2x) - 1 = 14', 'sin(x) = 0.5', 'x^2-4 > 0', 'x+y = 10; x-y = 2', '2x+3y-z = 5; x-y+2z = 3; 3x+y+z = 10',
  'גזור x^3*sin(x)', 'derivative (x^2+1)/(x-3)', '∫ x*e^x dx', 'integrate x^2 from 0 to 3', 'lim (x^2-4)/(x-2), x->2', 'פשט (x^2-1)/(x^2+2x+1)', 'פרק לגורמים x^3-6x^2+11x-6', '3/4 - 2/5 * 1/2'];
function xsD0(){
  const d = mxData();
  if (!d.solve || typeof d.solve !== 'object') d.solve = {}; const so = d.solve; [['q', ''], ['mode', 'auto'], ['a', ''], ['b', '']].forEach(([k, v]) => { if (so[k] == null) so[k] = v; }); if (!Array.isArray(so.hist)) so.hist = [];
  if (!d.my || typeof d.my !== 'object') d.my = {}; ['fns', 'cs', 'keys'].forEach(k => { if (!Array.isArray(d.my[k])) d.my[k] = []; });
  return d;
}
/* ---------- your own things → the scope every screen starts from ---------- */
function mxBaseScope(){
  const d = xsD0(), S = {v: {}, f: {}};
  d.my.fns.forEach(f => { try { if (!f.n || !f.e) return; S.f[f.n] = {ps: f.ps, e: mxParse(f.e), src: f.e}; } catch (e) {} });
  d.my.cs.forEach(c => { try { if (!c.n || c.v === '') return; const v = mxEval(mxParse(String(c.v)), S); if (typeof v === 'number' || mxIsM(v)) S.v[c.n] = v; } catch (e) {} });
  return S;
}
const MX_RESERVED = () => new Set(Object.keys(MX_MATH).concat(Object.keys(MX_FIN), Object.keys(MX_CONST), MX_SYM, ['sigma', 'summation', 'product', 'nsolve', 'nintegrate', 'nderive', 'x', 'y', 'ans', 'mod', 'i']));
function mxMyCheck(kind, it){
  const nm = String(it.n || '').trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nm)) return 'xm_eName';
  if (kind === 'c' ? (nm in MX_CONST || ['x', 'y', 'ans', 'i'].includes(nm)) : MX_RESERVED().has(nm.toLowerCase())) return 'xm_eTaken';
  try {
    if (kind === 'f'){ if ((it.ps || []).some(p => !/^[A-Za-z_]\w*$/.test(p)) || !(it.ps || []).length) return 'xm_eParams'; const S = mxBaseScope(); const v = {}; it.ps.forEach(p => { v[p] = 1.3; }); mxEval(mxParse(it.e), {v: Object.assign({}, S.v, v), f: S.f}); }
    else if (kind === 'c'){ mxEval(mxParse(String(it.v)), mxBaseScope()); }
  } catch (e) { return e && e.mx ? e.mx : 'xm_eExpr'; }
  return '';
}
function mxMineHTML(){
  const d = xsD0(), M = d.my;
  const st = (k, it) => { const e = mxMyCheck(k, it); return e ? `<span class="mx-err xm-st">⚠️ ${mE(t(e))}</span>` : `<span class="mx-ok xm-st">✓</span>`; };
  return `<details class="adv mx-mine" id="mx_mine"${MX.mineOpen ? ' open' : ''}><summary>⭐ ${mE(t('xm_t'))} (${M.fns.length + M.cs.length + M.keys.length})</summary>
    <p class="fine">${mE(t('xm_h'))}</p>
    <h4 class="mx-h">ƒ ${mE(t('xm_fns'))}</h4>
    ${M.fns.map((f, i) => `<div class="xm-row" data-xmf="${i}"><div class="xm-line" dir="ltr"><input data-xk="n" value="${mE(f.n)}" placeholder="f" aria-label="${mE(t('xm_name'))}" class="xm-n" autocomplete="off" spellcheck="false">(<input data-xk="ps" value="${mE((f.ps || []).join(', '))}" placeholder="x" aria-label="${mE(t('xm_params'))}" class="xm-p" autocomplete="off" spellcheck="false">) = <input data-xk="e" value="${mE(f.e)}" placeholder="x^2 + 1" aria-label="${mE(t('xm_expr'))}" class="xm-e" autocomplete="off" spellcheck="false"></div>
      <div class="xm-line"><input data-xk="desc" value="${mE(f.desc || '')}" placeholder="${mE(t('xm_desc'))}" dir="auto" class="xm-d">${st('f', f)}<button type="button" class="mv" data-xmdel="f${i}" aria-label="${mE(t('cv_rm'))}">🗑</button></div></div>`).join('') || `<p class="fine">${mE(t('xm_noneF'))}</p>`}
    <div class="btnrow"><button type="button" class="btn" data-xmadd="f">＋ ${mE(t('xm_addF'))}</button></div>
    <h4 class="mx-h">𝑐 ${mE(t('xm_cs'))}</h4>
    ${M.cs.map((c, i) => `<div class="xm-row" data-xmc="${i}"><div class="xm-line" dir="ltr"><input data-xk="n" value="${mE(c.n)}" placeholder="g" class="xm-n" aria-label="${mE(t('xm_name'))}" autocomplete="off" spellcheck="false"> = <input data-xk="v" value="${mE(c.v)}" placeholder="9.81" class="xm-e" aria-label="${mE(t('xm_value'))}" autocomplete="off" spellcheck="false"></div>
      <div class="xm-line"><input data-xk="desc" value="${mE(c.desc || '')}" placeholder="${mE(t('xm_desc'))}" dir="auto" class="xm-d">${st('c', c)}<button type="button" class="mv" data-xmdel="c${i}" aria-label="${mE(t('cv_rm'))}">🗑</button></div></div>`).join('') || `<p class="fine">${mE(t('xm_noneC'))}</p>`}
    <div class="btnrow"><button type="button" class="btn" data-xmadd="c">＋ ${mE(t('xm_addC'))}</button></div>
    <h4 class="mx-h">⌨️ ${mE(t('xm_keys'))}</h4>
    ${M.keys.map((k, i) => `<div class="xm-row" data-xmk="${i}"><div class="xm-line" dir="ltr"><input data-xk="l" value="${mE(k.l)}" placeholder="${mE(t('xm_kLabel'))}" class="xm-n" dir="auto" maxlength="10" aria-label="${mE(t('xm_kLabel'))}"> → <input data-xk="v" value="${mE(k.v)}" placeholder="sqrt(" class="xm-e" dir="ltr" aria-label="${mE(t('xm_kText'))}" autocomplete="off" spellcheck="false"><button type="button" class="mv" data-xmdel="k${i}" aria-label="${mE(t('cv_rm'))}">🗑</button></div></div>`).join('') || `<p class="fine">${mE(t('xm_noneK'))}</p>`}
    <div class="btnrow"><button type="button" class="btn" data-xmadd="k">＋ ${mE(t('xm_addK'))}</button></div>
    <p class="fine">${mE(t('xm_where'))}</p></details>`;
}
function mxMyKeys(){ return (xsD0().my.keys || []).filter(k => k.l && k.v).map(k => [k.l, k.v]); }
function mxMyLib(){ const M = xsD0().my; return M.fns.filter(f => f.n && f.e && !mxMyCheck('f', f)).map(f => f.n + '(' + (f.ps || []).join(', ') + ')').concat(M.cs.filter(c => c.n && !mxMyCheck('c', c)).map(c => c.n)); }

/* ---------- the "full solution" tab ---------- */
function xsSolveHTML(){
  const d = xsD0(), so = d.solve, m = so.mode || 'auto';
  const keys = MX_KEYS.concat(mxMyKeys());
  return `<p class="fine">${mE(t('xs_h'))}</p>
    <div class="seg mx-subseg xs-modes" role="group" aria-label="${mE(t('xs_modeL'))}">${XS_MODES.map(k => `<button type="button" data-xsm="${k}" aria-pressed="${m === k}">${mE(t('xs_m_' + k))}</button>`).join('')}</div>
    <textarea id="xs_in" class="mx-in-ta xs-in" rows="3" dir="auto" spellcheck="false" autocapitalize="none" autocomplete="off" placeholder="${mE(t('xs_ph'))}">${mE(so.q)}</textarea>
    ${m === 'integ' ? `<div class="mx-fgrid"><div class="field cv-f"><label for="xs_a">${mE(t('xs_from'))}</label><input id="xs_a" data-xsb="a" dir="ltr" inputmode="decimal" value="${mE(so.a)}" placeholder="${mE(t('xs_opt'))}"></div><div class="field cv-f"><label for="xs_b">${mE(t('xs_to'))}</label><input id="xs_b" data-xsb="b" dir="ltr" inputmode="decimal" value="${mE(so.b)}" placeholder="${mE(t('xs_opt'))}"></div></div>` : ''}
    ${m === 'limit' ? `<div class="field cv-f"><label for="xs_a">${mE(t('xs_toward'))}</label><input id="xs_a" data-xsb="a" dir="ltr" value="${mE(so.a)}" placeholder="0, 2, inf"></div>` : ''}
    ${m === 'diff' ? `<div class="field cv-f"><label for="xs_a">${mE(t('xs_atPt'))}</label><input id="xs_a" data-xsb="a" dir="ltr" inputmode="decimal" value="${mE(so.a)}" placeholder="${mE(t('xs_opt'))}"></div>` : ''}
    <div class="mx-keys">${keys.map(([l, v]) => `<button type="button" data-xsk="${mE(v)}">${mE(l)}</button>`).join('')}</div>
    <div class="btnrow"><button type="button" class="gold-btn" id="xs_go">✓ ${mE(t('xs_go'))}</button><button type="button" class="btn" id="xs_aiGo">🤖 ${mE(t('xs_aiGo'))}</button><button type="button" class="mv" id="xs_clr">${mE(t('mx_clear'))}</button></div>
    <details class="adv xs-exs"><summary>📚 ${mE(t('xs_exs'))}</summary><div class="mx-libl">${XS_EX.map(x => `<button type="button" data-xsex="${mE(x)}" dir="auto">${mE(x)}</button>`).join('')}</div></details>
    <div id="xs_out" aria-live="polite"></div>
    ${so.hist.length ? `<details class="adv xs-hist"${MX.histOpen ? ' open' : ''}><summary>🕘 ${mE(t('xs_hist'))} (${so.hist.length})</summary>${so.hist.map((h, i) => `<div class="xs-hrow"><button type="button" class="xs-hq" data-xsh="${i}" dir="auto">${mE(h.q)}</button><button type="button" class="mv" data-xshe="${i}" aria-label="${mE(t('mx_edit'))}">✏️</button><button type="button" class="mv" data-xshd="${i}" aria-label="${mE(t('cv_rm'))}">🗑</button></div>`).join('')}<div class="btnrow"><button type="button" class="mv" id="xs_hClr">${MX.sure === 'xsh' ? '⚠️ ' + mE(t('xs_sure')) : '🗑 ' + mE(t('xs_hClr'))}</button></div></details>` : ''}
    ${mxMineHTML()}
    <details class="adv mx-help"><summary>❓ ${mE(t('mx_help'))}</summary><p class="fine" dir="auto">${mE(t('xs_helpTxt'))}</p></details>`;
}
/* keep the maths inside a Hebrew/Arabic sentence left-to-right */
function xsKtxt(txt){ const h = mE(txt); return /^(he|ar)/.test(document.documentElement.lang || '') ? h.replace(/([A-Za-z0-9²³(Δ√±][A-Za-z0-9²³±√Δ()+\-−=\/·÷←↔.,′ |]*[A-Za-z0-9²³)′Δ])/g, '<bdi dir="ltr">$1</bdi>') : h; }
const XS_KIND = {eq: 'xs_kEq', sys: 'xs_kSys', ineq: 'xs_kIneq', diff: 'xs_kDiff', integ: 'xs_kInteg', limit: 'xs_kLimit', simp: 'xs_kSimp', calc: 'xs_kCalc'};
function xsTaskText(){
  const d = xsD0(), so = d.solve, q = String(so.q || '').trim(), m = so.mode || 'auto';
  if (!q) return '';
  if (m === 'auto') return q;
  const body = q.replace(/\n/g, '; ');
  if (m === 'solve') return /=|<|>/.test(q) || q.includes(';') || q.includes('\n') ? q : q + ' = 0';
  if (m === 'diff') return 'diff(' + body + ', x' + (String(so.a).trim() ? ', ' + so.a.trim() : '') + ')';
  if (m === 'integ') return String(so.a).trim() !== '' && String(so.b).trim() !== '' ? 'integrate(' + body + ', x, ' + so.a.trim() + ', ' + so.b.trim() + ')' : 'integrate(' + body + ', x)';
  if (m === 'limit') return 'limit(' + body + ', x, ' + (String(so.a).trim() || '0') + ')';
  if (m === 'simp') return 'simplify(' + body + ')';
  if (m === 'factor') return 'factor(' + body + ')';
  return q;
}
async function xsRun(){
  const out = $('#xs_out'); if (!out) return; const d = xsD0(), so = d.solve;
  const raw = xsTaskText(); if (!raw){ out.innerHTML = ''; return; }
  out.innerHTML = `<div class="mx-card"><span class="mx-sub">⏳ ${mE(t('mx_comp'))}</span></div>`;
  let r = null;
  try { r = await xsSolve(raw, mxBaseScope()); } catch (e) { r = {kind: 'fail', steps: [], why: 'err', err: e}; }
  MX.xs = {r, raw};
  /* history: newest first, no duplicates, 20 at most */
  so.hist = [{q: so.q, mode: so.mode, a: so.a, b: so.b}].concat(so.hist.filter(h => !(h.q === so.q && h.mode === so.mode))).slice(0, 20); mxSave();
  out.innerHTML = xsResHTML(r, raw);
  mxRender();
}
function xsResHTML(r, raw){
  if (!r || r.kind === 'fail'){
    const why = r && r.why, msg = why === 'fdef' ? 'xs_fFdef' : why === 'words' ? 'xs_fWords' : why === 'vars' ? 'xs_fVars' : why === 'parse' ? 'xs_fParse' : 'xs_fNo';
    return `<div class="mx-card xs-res"><div class="mx-err">⚠️ ${mE(t(msg))}</div>${xsAiBlock(raw, true)}</div>`;
  }
  const steps = r.steps.map(s => `<li><div class="xs-k">${xsKtxt(t(s.k, s.p || {}))}</div>${s.h ? `<div class="xs-m" dir="ltr">${s.h}</div>` : ''}</li>`).join('');
  return `<div class="mx-card xs-res"><div class="mx-lab">${mE(t(XS_KIND[r.kind] || 'xs_kCalc'))}${r.viaLib ? ' · ' + mE(t('xs_viaLib')) : ''}</div>
    <div class="xs-ans"><small>${mE(t('mx_scAns'))}</small><div dir="ltr">${r.answer}</div></div>
    <div class="${r.ok ? 'mx-ok' : 'mx-err'} xs-ver">${r.ok ? '✓ ' + mE(t('xs_verOk')) : '⚠️ ' + mE(t('xs_verNo'))}</div>
    <details class="mx-steps xs-steps" open><summary>${mE(t('xs_way'))} (${r.steps.length})</summary><ol class="xs-ol">${steps}</ol></details>
    <div class="btnrow"><button type="button" class="mv" id="xs_copy">📋 ${mE(t('xs_copy'))}</button><button type="button" class="mv" id="xs_toSheet">➕ ${mE(t('mx_toSheet'))}</button><button type="button" class="mv" id="xs_edit">✏️ ${mE(t('xs_editQ'))}</button></div>
    ${xsAiBlock(raw, false)}</div>`;
}
function xsAiBlock(raw, primary){
  const ok = typeof cvAiOk === 'function' && cvAiOk();
  return `<div class="xs-ai">${ok ? `<button type="button" class="${primary ? 'gold-btn' : 'mv mx-aib'}" id="xs_ai" data-p="${primary ? 1 : 0}">🤖 ${mE(t(primary ? 'xs_aiSolve' : 'xs_aiExplain'))}</button>` : `<p class="fine">${mE(t(gkNo('xs_aiNone')))}</p>${gkAllowed() && !(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) ? `<button type="button" class="btn" data-gkgo="1">✦ ${mE(t('xs_connect'))}</button>` : ''}`}<div class="mx-aiout xs-aiout" id="xs_aiout" hidden></div></div>`;
}
function xsCopyText(r){
  const strip = h => { const el = document.createElement('div'); el.innerHTML = h; return el.innerText.replace(/\s+/g, ' ').trim(); };
  return [xsD0().solve.q, ''].concat(r.steps.map((s, i) => (i + 1) + '. ' + t(s.k, s.p || {}) + (s.h ? ': ' + strip(s.h) : '')), ['', t('mx_scAns') + ': ' + strip(r.answer)]).join('\n');
}
/* the AI: a full worked solution (word problems too), checked by the calculator; or an explanation in words of the steps above */
async function xsAi(btn){
  const o = $('#xs_aiout'); if (!o) return; const d = xsD0(), q = d.solve.q, primary = btn.dataset.p === '1';
  const UL = {he: 'Hebrew', ar: 'Arabic', en: 'English'}[typeof lang === 'string' && ['he', 'ar', 'en'].includes(lang) ? lang : 'en'];
  const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('mx_aiWait');
  try {
    if (!primary && MX.xs && MX.xs.r && MX.xs.r.kind !== 'fail'){
      const r = MX.xs.r, steps = xsCopyText(r);
      const txt = await cvAsk(`You are a patient maths teacher. In ${UL}, explain in words, for a student preparing for an exam, why each of the following solution steps is done and what rule is used. Keep the same numbering, keep maths in plain text (use ^, sqrt, /), do not change the answer, and end with a one-line summary and a tip for similar exercises.\n\n${steps}`);
      o.hidden = false; o.innerHTML = `<div dir="auto" class="xs-aitxt">${mE(txt || t('cv_aiErr'))}</div>`;
    } else {
      const res = mxJSON(await cvAsk(`You are an expert teacher and exam grader in mathematics, statistics, economics, finance and accounting. Solve the following exercise completely and rigorously, step by step, exactly as a full exam answer: state each formula or rule, substitute, show every intermediate result. Write in ${UL}. Return JSON only: {"topic":"...","steps":["..."],"answer":"...","check":"ONE calculator expression that computes the main numeric final answer, or empty"}. Calculator syntax: + - * / ^ ( ), sqrt, ln, log, exp, sin/cos/tan (radians), ncr(n,k), normcdf(x,mu,sd), binompdf(n,p,k), npv(rate,[cf0,..]), irr([..]), pmt(rate,n,pv), fv, pv, mean([..]), std([..]).\n\nExercise:\n${q}`));
      if (!res || !res.steps) throw new Error('fmt');
      const ver = mxScanVerify(res), steps = (Array.isArray(res.steps) ? res.steps : [String(res.steps)]).filter(Boolean);
      o.hidden = false;
      o.innerHTML = `<div class="mx-lab">🤖 ${mE(t('xs_aiSol'))}${res.topic ? ' · ' + mE(res.topic) : ''}</div><ol class="xs-ol xs-aiol">${steps.map(s => `<li dir="auto">${mE(s)}</li>`).join('')}</ol>
        <div class="xs-ans"><small>${mE(t('mx_scAns'))}</small><div dir="auto">${mE(res.answer || '')}</div></div>
        ${ver.k === 'ok' ? `<div class="mx-ok">${mE(t('mx_scOk', {v: mxFmt(ver.v)}))}</div>` : ver.k === 'diff' ? `<div class="mx-err">${mE(t('mx_scDiff', {v: mxFmt(ver.v)}))}</div>` : `<div class="mx-sub">${mE(t('mx_scNoCheck'))}</div>`}
        ${res.check ? `<div class="btnrow"><button type="button" class="mv" data-mxsend="${mE(res.check)}">➕ ${mE(t('mx_scToSheet'))}</button></div>` : ''}<p class="fine">${mE(t('mx_scDisc'))}</p>`;
    }
  } catch (e) { o.hidden = false; o.textContent = e && e.message === 'noai' ? t(gkNo('cv_aiNo')) : t('cv_aiErr'); }
  finally { if (btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}
function xsInsert(txt){
  const ta = $('#xs_in'); if (!ta) return; const s = ta.selectionStart == null ? ta.value.length : ta.selectionStart, e = ta.selectionEnd == null ? s : ta.selectionEnd;
  ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e); const p = s + txt.length; ta.focus(); try { ta.setSelectionRange(p, p); } catch (er) {}
  xsD0().solve.q = ta.value; mxSave();
}
/* ---------- your formulas as forms on the finance screen ---------- */
function mxMyFinHTML(){
  const d = xsD0(), nm = MX.finK.slice(3), f = d.my.fns.find(z => z.n === nm);
  if (!f) return '';
  const V = (d.fin && d.fin[MX.finK]) || [];
  return `<div class="mx-fgrid">${f.ps.map((p, i) => `<div class="field cv-f"><label for="mxp_${i}">${mE(p)}</label><input id="mxp_${i}" data-mxp="${i}" type="text" inputmode="decimal" dir="ltr" value="${mE(V[i] != null ? V[i] : '')}" autocomplete="off"></div>`).join('')}</div>${f.desc ? `<p class="fine" dir="auto">${mE(f.desc)}</p>` : ''}`;
}
function mxMyFinRun(box){
  const d = xsD0(), nm = MX.finK.slice(3), f = d.my.fns.find(z => z.n === nm); if (!f) return;
  try {
    const raw = f.ps.map((p, i) => String(($('#mxp_' + i) || {}).value || '').trim()); d.fin = d.fin || {}; d.fin[MX.finK] = raw; mxSave();
    const S = mxBaseScope(), vals = raw.map((s, i) => { if (!s) throw MX_ERR('mx_eArgs', {n: f.ps[i]}); return mxEval(mxParse(s), S); });
    const v = Object.assign({}, S.v); f.ps.forEach((p, i) => { v[p] = vals[i]; });
    const node = mxParse(f.e), res = mxEval(node, {v, f: S.f});
    const st = mxSteps(node, {v, f: S.f});
    const call = f.n + '(' + raw.join(', ') + ')';
    box.innerHTML = `<div class="mx-card mx-big"><div class="mx-lab">${mE(f.desc || f.n)}</div><div class="mx-res"><b class="mx-val">${mE(mxFmt(res, mxDec()))}</b></div>
      <div class="mx-st"><b>${mE(t('mx_formula'))}:</b> <span dir="ltr">${mxHTML({t: 'fdef', n: f.n, ps: f.ps, e: node})}</span></div>${st.map(s => `<div class="mx-st" dir="ltr">${s.k ? `<small>${mE(t(s.k))}:</small> ` : '⟶ '}${s.h}</div>`).join('')}
      <div class="btnrow"><button type="button" class="mv" data-mxsend="${mE(call)}">➕ ${mE(t('mx_toSheet'))}</button></div></div>`;
    MX.finLast = call + ' = ' + mxFmt(res);
  } catch (e){ box.innerHTML = `<div class="mx-card"><span class="mx-err">⚠️ ${mE(mxErrTxt(e))}</span></div>`; }
}
/* ---------- events ---------- */
document.addEventListener('input', e => {
  const el = e.target; if (!el.closest || !el.closest('#mx_root')) return;
  if (el.id === 'xs_in'){ xsD0().solve.q = el.value; mxSave(); return; }
  if (el.dataset.xsb){ xsD0().solve[el.dataset.xsb] = el.value; mxSave(); return; }
  const row = el.closest('.xm-row'); if (row && el.dataset.xk){
    const M = xsD0().my, kind = row.dataset.xmf != null ? 'f' : row.dataset.xmc != null ? 'c' : 'k', i = +(row.dataset.xmf || row.dataset.xmc || row.dataset.xmk);
    const it = (kind === 'f' ? M.fns : kind === 'c' ? M.cs : M.keys)[i]; if (!it) return;
    it[el.dataset.xk] = el.dataset.xk === 'ps' ? el.value.split(/[,\s]+/).map(s => s.trim()).filter(Boolean) : el.value.trim ? (el.dataset.xk === 'desc' || el.dataset.xk === 'l' ? el.value : el.value.trim()) : el.value;
    mxSave();
    if (kind !== 'k'){ const old = row.querySelector('.xm-st'); if (old){ const er = mxMyCheck(kind, it); old.className = (er ? 'mx-err' : 'mx-ok') + ' xm-st'; old.textContent = er ? '⚠️ ' + t(er) : '✓'; } }
    clearTimeout(MX.timer); MX.timer = setTimeout(() => { if (MX.tab === 'sheet') mxRunSheet(); }, 500);
  }
});
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'xs_in' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); xsRun(); } });
document.addEventListener('toggle', e => { const el = e.target; if (!el || !el.classList) return; if (el.classList.contains('mx-mine')) MX.mineOpen = el.open; if (el.classList.contains('xs-hist')) MX.histOpen = el.open; }, true);
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if ((b = t0.closest('[data-gkgo]'))){ if (typeof gkGo === 'function') gkGo(); return; }
  if (!t0.closest('#mx_root')) return; const d = xsD0();
  if (!t0.closest('#xs_hClr') && MX.sure === 'xsh') MX.sure = '';
  if ((b = t0.closest('[data-xsm]'))){ d.solve.mode = b.dataset.xsm; mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-xsk]'))){ xsInsert(b.dataset.xsk); return; }
  if ((b = t0.closest('[data-xsex]'))){ Object.assign(d.solve, {q: b.dataset.xsex, mode: 'auto', a: '', b: ''}); mxSave(); mxRender(); xsRun(); return; }
  if (t0.closest('#xs_go')){ xsRun(); return; }
  if (t0.closest('#xs_aiGo')){ const out = $('#xs_out'); if (!String(d.solve.q || '').trim()){ const ta = $('#xs_in'); if (ta) ta.focus(); return; } MX.xs = null; if (out){ out.innerHTML = `<div class="mx-card xs-res">${xsAiBlock(d.solve.q, true)}</div>`; const bb = $('#xs_ai'); if (bb) xsAi(bb); } return; }
  if (t0.closest('#xs_clr')){ Object.assign(d.solve, {q: '', a: '', b: ''}); mxSave(); MX.xs = null; mxRender(); setTimeout(() => { const ta = $('#xs_in'); if (ta) ta.focus(); }, 30); return; }
  if ((b = t0.closest('#xs_ai'))){ xsAi(b); return; }
  if (t0.closest('#xs_copy') && MX.xs && MX.xs.r){ copyText(xsCopyText(MX.xs.r)); toast(t('st_copied')); return; }
  if (t0.closest('#xs_toSheet') && MX.xs){ const line = MX.xs.raw.replace(/\n/g, '; '); d.sheet = (String(d.sheet || '').trim() ? d.sheet.replace(/\s*$/, '\n') : '') + (mxSplitCall(line) || /=/.test(line) ? line : line); mxSave(); toast(t('mx_copied')); return; }
  if (t0.closest('#xs_edit')){ const ta = $('#xs_in'); if (ta){ ta.focus(); ta.scrollIntoView({block: 'center'}); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (er) {} } return; }
  if ((b = t0.closest('[data-xsh]')) || (b = t0.closest('[data-xshe]'))){ const h = d.solve.hist[+(b.dataset.xsh || b.dataset.xshe)]; if (!h) return; Object.assign(d.solve, {q: h.q, mode: h.mode || 'auto', a: h.a || '', b: h.b || ''}); mxSave(); mxRender(); if (b.dataset.xsh != null) xsRun(); else setTimeout(() => { const ta = $('#xs_in'); if (ta){ ta.focus(); ta.scrollIntoView({block: 'center'}); } }, 30); return; }
  if ((b = t0.closest('[data-xshd]'))){ d.solve.hist.splice(+b.dataset.xshd, 1); MX.histOpen = true; mxSave(); mxRender(); return; }
  if (t0.closest('#xs_hClr')){ if (MX.sure !== 'xsh'){ MX.sure = 'xsh'; const bb = $('#xs_hClr'); if (bb) bb.textContent = '⚠️ ' + t('xs_sure'); return; } MX.sure = ''; d.solve.hist = []; mxSave(); mxRender(); return; }
  if ((b = t0.closest('[data-xmadd]'))){ const k = b.dataset.xmadd, M = d.my; MX.mineOpen = true;
    if (k === 'f') M.fns.push({n: 'f' + (M.fns.length ? M.fns.length + 1 : ''), ps: ['x'], e: 'x^2 + 1', desc: ''}); else if (k === 'c') M.cs.push({n: 'k' + (M.cs.length + 1), v: '1', desc: ''}); else M.keys.push({l: '√', v: 'sqrt('});
    mxSave(); mxRender();
    setTimeout(() => { const rows = $$('#mx_mine .xm-row[data-xm' + k + ']'); const r = rows[rows.length - 1]; if (r){ const i = r.querySelector('input'); if (i){ i.focus(); i.select(); } } }, 40); return; }
  if ((b = t0.closest('[data-xmdel]'))){ const k = b.dataset.xmdel[0], i = +b.dataset.xmdel.slice(1), M = d.my; (k === 'f' ? M.fns : k === 'c' ? M.cs : M.keys).splice(i, 1); MX.mineOpen = true; mxSave(); mxRender(); return; }
});
try { if (tab === 'mathx' && !(typeof mbLocked === 'function' && mbLocked('mathx'))) mxRender(); } catch (e) {}
