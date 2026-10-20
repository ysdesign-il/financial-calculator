/* ---------- 13.22: life planning – life events over the years, if I lose my job, goals, moving home ---------- */
const lpE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var LPT = 'sim';
function lpD(){ const d = SET.lp && typeof SET.lp === 'object' ? SET.lp : (SET.lp = {}); ['ev', 'goals'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; }); if (!d.v || typeof d.v !== 'object') d.v = {}; return d; }
const lpN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪%]/g, '')); return isFinite(x) ? x : NaN; };
const lpV = (k, def) => { const x = lpN(lpD().v[k]); return isFinite(x) ? x : def; };
const lpM = x => M(Math.round(isFinite(x) ? x : 0), 0, 'ILS');
const lpIn = (k, lab, ph, unit) => `<label class="bk-f"><span>${lpE(lab)}${unit ? ' (' + lpE(unit) + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" data-lpv="${k}" value="${lpE(lpD().v[k] == null ? '' : lpD().v[k])}" placeholder="${lpE(ph == null ? '' : ph)}"></label>`;
/* what we already know about you, as starting values */
function lpBase(){
  let inc = 0, exp = 0, sav = 0;
  try { const ym = ymOf(new Date()), ii = expIncome(ym); if (ii) inc = +ii.v; const L = [1, 2, 3].map(i => expTotals(ymAdd(ym, -i)).sum).filter(x => x > 0); if (L.length) exp = L.reduce((s, x) => s + x, 0) / L.length; } catch (e) {}
  try { const R = bkAdvise(); if (R.A.length){ sav = Math.max(0, R.liquid + R.saved); if (!exp) exp = bkN(bkD().exp) || R.tot.out; if (!inc) inc = R.tot.inc; } } catch (e) {}
  return {inc: Math.round(inc) || 15000, exp: Math.round(exp) || 12000, sav: Math.round(sav) || 50000};
}
/* ---- 1) life events ---- */
const LP_EV = {baby: ['👶', {cost: 1500, years: 18, lose: 3}], home: ['🏠', {down: 400000, pay: 5500, years: 25}], job: ['💼', {pct: 15}], car: ['🚗', {price: 120000, cost: 1200}], study: ['🎓', {years: 3, pct: 50, cost: 1000}], retire: ['🌴', {pct: 60}], move: ['🚚', {cost: 15000, diff: -800}]};
function lpSim(v){
  const E = lpE, d = lpD(), B = lpBase();
  v.innerHTML = `<p class="fine">${E(t('lp_simIntro'))}</p><div class="bk-grid">${lpIn('inc', t('lp_inc'), B.inc, '₪')}${lpIn('exp', t('lp_exp'), B.exp, '₪')}${lpIn('sav', t('lp_sav'), B.sav, '₪')}${lpIn('ret', t('lp_ret'), '4', '%')}${lpIn('grow', t('lp_grow'), '2', '%')}${lpIn('yrs', t('lp_yrs'), '15')}</div>
    <h3 class="ds-q">${E(t('lp_evH'))}</h3><ul class="rm-list">${d.ev.map((e, i) => lpEvRow(e, i)).join('')}</ul>
    <div class="ds-chips">${Object.keys(LP_EV).map(k => `<button type="button" class="ds-chip" data-lpadd="${k}">${LP_EV[k][0]} ${E(t('lp_e_' + k))}</button>`).join('')}</div>
    <div id="lp_out" aria-live="polite"></div>`;
  lpSimOut();
}
function lpEvRow(e, i){
  const E = lpE, P = LP_EV[e.k][1], f = (k, unit) => `<label class="bk-f"><span>${E(t('lp_f_' + k))}${unit ? ' (' + unit + ')' : ''}</span><input type="text" inputmode="decimal" dir="ltr" data-lpe="${i}" data-lpk="${k}" value="${E(e[k] == null ? P[k] : e[k])}"></label>`;
  return `<li class="rm-it"><div class="rm-ic" aria-hidden="true">${LP_EV[e.k][0]}</div><div class="rm-b"><b>${E(t('lp_e_' + e.k))}</b><div class="bk-grid">${f('year')}${Object.keys(P).map(k => f(k, /pct/.test(k) ? '%' : /years|lose/.test(k) ? '' : '₪')).join('')}</div>
    <div class="rm-acts"><button type="button" class="px-tb s" data-lpdel="${i}" aria-label="${E(t('lp_del', {n: t('lp_e_' + e.k)}))}">🗑️</button></div></div></li>`;
}
function lpProject(){
  const d = lpD(), B = lpBase(), yrs = Math.max(1, Math.min(40, Math.round(lpV('yrs', 15)))), r = lpV('ret', 4) / 100, g = lpV('grow', 2) / 100;
  let inc = lpV('inc', B.inc), exp = lpV('exp', B.exp), sav = lpV('sav', B.sav); const rows = [], y0 = new Date().getFullYear();
  for (let y = 1; y <= yrs; y++){
    let incY = inc * 12 * Math.pow(1 + g, y - 1), expY = exp * 12 * Math.pow(1 + g * 0.8, y - 1), once = 0, notes = [];
    d.ev.forEach(e => { const P = Object.assign({}, LP_EV[e.k][1], e), at = Math.round(+P.year || 1), N1 = k => +P[k] || 0;
      if (e.k === 'baby' && y >= at && y < at + N1('years')){ expY += N1('cost') * 12; if (y === at){ incY -= inc * N1('lose') * 0.25; notes.push('👶'); } }
      if (e.k === 'home' && y === at){ once -= N1('down'); notes.push('🏠'); } if (e.k === 'home' && y >= at && y < at + N1('years')) expY += N1('pay') * 12;
      if (e.k === 'job' && y >= at){ incY *= 1 + N1('pct') / 100; if (y === at) notes.push('💼'); }
      if (e.k === 'car' && y === at){ once -= N1('price'); notes.push('🚗'); } if (e.k === 'car' && y >= at) expY += N1('cost') * 12;
      if (e.k === 'study' && y >= at && y < at + N1('years')){ incY *= 1 - N1('pct') / 100; expY += N1('cost') * 12; if (y === at) notes.push('🎓'); }
      if (e.k === 'retire' && y >= at){ incY *= N1('pct') / 100; if (y === at) notes.push('🌴'); }
      if (e.k === 'move' && y === at){ once -= N1('cost'); notes.push('🚚'); } if (e.k === 'move' && y >= at) expY += N1('diff') * 12; });
    sav = sav * (1 + (sav > 0 ? r : 0)) + incY - expY + once;
    rows.push({y: y0 + y, inc: incY, exp: expY, once, sav, notes});
  }
  return rows;
}
function lpSimOut(){
  const box = $('#lp_out'); if (!box) return; const E = lpE, R = lpProject(), mx = Math.max(1, ...R.map(r => Math.abs(r.sav))), low = R.find(r => r.sav < 0), end = R[R.length - 1];
  box.innerHTML = `<div class="bk-hero"><span>${E(t('lp_end', {y: end.y}))}</span><b dir="ltr">${E(lpM(end.sav))}</b><small>${E(low ? t('lp_low', {y: low.y}) : t('lp_ok'))}</small></div>
    <div class="lp-chart" role="img" aria-label="${E(t('lp_chartA'))}">${R.map(r => `<div class="lp-col${r.sav < 0 ? ' neg' : ''}" title="${r.y}: ${E(lpM(r.sav))}"><i style="height:${(Math.abs(r.sav) / mx * 100).toFixed(1)}%"></i><small>${String(r.y).slice(2)}</small><span class="lp-n">${r.notes.join('')}</span></div>`).join('')}</div>
    <div class="bk-scroll"><table class="bk-plan"><thead><tr><th scope="col">${E(t('lp_year'))}</th><th scope="col">${E(t('lp_incY'))}</th><th scope="col">${E(t('lp_expY'))}</th><th scope="col">${E(t('lp_savY'))}</th></tr></thead><tbody>${R.map(r => `<tr${r.sav < 0 ? ' class="lp-neg"' : ''}><th scope="row">${r.y} ${r.notes.join('')}</th><td dir="ltr">${E(lpM(r.inc))}</td><td dir="ltr">${E(lpM(r.exp - r.once))}</td><td dir="ltr">${E(lpM(r.sav))}</td></tr>`).join('')}</tbody></table></div>
    <p class="fine">${E(t('lp_simNote'))}</p>`;
}
/* ---- 2) if I lose my job ---- */
function lpJob(v){
  const E = lpE, B = lpBase(); let cut = 0; try { const ym = ymOf(new Date()), L = [1, 2, 3].map(i => expTotals(ymAdd(ym, -i))).filter(x => x.sum > 0); if (L.length) cut = ['fun', 'clothes', 'gifts', 'other'].reduce((s, k) => s + L.reduce((q, x) => q + (x.by[k] || 0), 0) / L.length, 0) * 0.5; } catch (e) {}
  v.innerHTML = `<p class="fine">${E(t('lp_jobIntro'))}</p><div class="bk-grid">${lpIn('jsav', t('lp_jsav'), B.sav, '₪')}${lpIn('jexp', t('lp_jexp'), B.exp, '₪')}${lpIn('jben', t('lp_jben'), '0', '₪')}${lpIn('jben_m', t('lp_jbenM'), '6')}${lpIn('jcut', t('lp_jcut'), String(Math.round(cut)), '₪')}${lpIn('jside', t('lp_jside'), '0', '₪')}</div><div id="lp_out" aria-live="polite"></div>`;
  lpJobOut();
}
function lpJobOut(){
  const box = $('#lp_out'); if (!box) return; const E = lpE, B = lpBase(), sav = lpV('jsav', B.sav), exp = lpV('jexp', B.exp), ben = lpV('jben', 0), bm = lpV('jben_m', 6), cut = lpV('jcut', 0), side = lpV('jside', 0);
  const run = c => { let s = sav, m = 0; while (s > 0 && m < 600){ s -= exp - c - side - (m < bm ? ben : 0); m++; } return m; }, a = run(0), b = run(cut);
  box.innerHTML = `<div class="bk-hero"><span>${E(t('lp_runway'))}</span><b dir="ltr">${a >= 600 ? '∞' : t('pic_months', {n: a})}</b><small>${E(cut ? t('lp_withCut', {n: b >= 600 ? '∞' : b, m: lpM(cut)}) : '')}</small></div>
    <ol class="bk-adv">${a < 3 ? '<li class="bk-a bk-warn"><span class="bk-ic">⚠️</span><div><b>' + E(t('lp_jWarn')) + '</b></div></li>' : ''}<li class="bk-a"><span class="bk-ic">📝</span><div><b>${E(t('lp_j1'))}</b><p>${E(t('lp_j1P'))}</p><p><button type="button" class="lg-a" data-go="benefits">${E(t('in_open', {n: t('tab_benefits')}))}</button></p></div></li>
    <li class="bk-a"><span class="bk-ic">✂️</span><div><b>${E(t('lp_j2'))}</b><p>${E(t('lp_j2P'))}</p></div></li><li class="bk-a"><span class="bk-ic">💰</span><div><b>${E(t('lp_j3'))}</b><p>${E(t('lp_j3P'))}</p><p><button type="button" class="lg-a" data-go="severance">${E(t('in_open', {n: t('tab_severance')}))}</button></p></div></li></ol>`;
}
/* ---- 3) goals ---- */
function lpGoals(v){
  const E = lpE, d = lpD(), B = lpBase(), free = lpV('inc', B.inc) - lpV('exp', B.exp);
  v.innerHTML = `<p class="fine">${E(t('lp_gIntro'))}</p><ul class="rm-list">${d.goals.map((g, i) => { const left = Math.max(0, (+g.target || 0) - (+g.saved || 0)), dd = rmParse(g.date), mo = dd ? Math.max(1, (dd.getFullYear() - new Date().getFullYear()) * 12 + dd.getMonth() - new Date().getMonth()) : 0, need = mo ? left / mo : 0, pct = +g.target ? Math.min(100, (+g.saved || 0) / +g.target * 100) : 0;
    return `<li class="rm-it"><div class="rm-ic" aria-hidden="true">${pct >= 100 ? '🏁' : '🎯'}</div><div class="rm-b"><div class="bk-grid">
      <label class="bk-f"><span>${E(t('lp_gName'))}</span><input type="text" dir="auto" maxlength="40" data-lpg="${i}" data-lpk="name" value="${E(g.name || '')}" placeholder="${E(t('lp_gNamePh'))}"></label>
      <label class="bk-f"><span>${E(t('lp_gTarget'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-lpg="${i}" data-lpk="target" value="${E(g.target || '')}"></label>
      <label class="bk-f"><span>${E(t('lp_gSaved'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-lpg="${i}" data-lpk="saved" value="${E(g.saved || '')}"></label>
      <label class="bk-f"><span>${E(t('lp_gDate'))}</span><input type="date" data-lpg="${i}" data-lpk="date" value="${E(g.date || '')}"></label></div>
      <span class="in-prog"><i style="width:${pct.toFixed(0)}%"></i></span><span class="rm-w">${E(mo ? t('lp_gNeed', {m: lpM(need), n: mo}) + (free > 0 ? ' · ' + t(need <= free ? 'lp_gOk' : 'lp_gHard', {f: lpM(free)}) : '') : t('lp_gPick'))}</span>
      <div class="rm-acts"><button type="button" class="px-tb s" data-lpgdel="${i}" aria-label="${E(t('lp_del', {n: g.name || ''}))}">🗑️</button></div></div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('lp_gNone'))}</li>`}</ul>
    <div class="ds-chips">${['home', 'car', 'trip', 'buffer', 'study', 'wedding'].map(k => `<button type="button" class="ds-chip" data-lpgadd="${k}">＋ ${E(t('lp_gs_' + k))}</button>`).join('')}</div>`;
}
/* ---- 4) moving home ---- */
function lpMove(v){
  const E = lpE, side = s => `<fieldset class="bk-acc"><legend>${E(t('lp_m' + s))}</legend><div class="bk-grid">${lpIn('m' + s + '_rent', t('lp_mRent'), s === 'A' ? '5500' : '4500', '₪')}${lpIn('m' + s + '_arn', t('lp_mArn'), '450', '₪')}${lpIn('m' + s + '_km', t('lp_mKm'), s === 'A' ? '10' : '35')}${lpIn('m' + s + '_pt', t('lp_mPt'), '0', '₪')}${lpIn('m' + s + '_kid', t('lp_mKid'), '0', '₪')}${lpIn('m' + s + '_oth', t('lp_mOth'), '0', '₪')}</div></fieldset>`;
  v.innerHTML = `<p class="fine">${E(t('lp_mIntro'))}</p>${side('A')}${side('B')}<div class="bk-grid">${lpIn('m_kmc', t('lp_mKmc'), '1.5', '₪')}${lpIn('m_days', t('lp_mDays'), '21')}${lpIn('m_once', t('lp_mOnce'), '12000', '₪')}</div><div id="lp_out" aria-live="polite"></div>`;
  lpMoveOut();
}
function lpMoveOut(){
  const box = $('#lp_out'); if (!box) return; const E = lpE, kmc = lpV('m_kmc', 1.5), days = lpV('m_days', 21);
  const cost = s => lpV('m' + s + '_rent', s === 'A' ? 5500 : 4500) + lpV('m' + s + '_arn', 450) + lpV('m' + s + '_km', s === 'A' ? 10 : 35) * 2 * days * kmc + lpV('m' + s + '_pt', 0) + lpV('m' + s + '_kid', 0) + lpV('m' + s + '_oth', 0);
  const a = cost('A'), b = cost('B'), diff = a - b, once = lpV('m_once', 12000), be = diff > 0 ? once / diff : NaN;
  box.innerHTML = `<div class="bk-hero"><span>${E(t(diff > 0 ? 'lp_mSave' : 'lp_mMore'))}</span><b dir="ltr">${E(lpM(Math.abs(diff)))} / ${E(t('bk_mo'))}</b><small>${E(isFinite(be) ? t('lp_mBe', {n: N(be, 1)}) : t('lp_mNoBe'))}</small></div>
    <table class="bk-plan"><tbody><tr><th scope="row">${E(t('lp_mA'))}</th><td dir="ltr">${E(lpM(a))}</td></tr><tr><th scope="row">${E(t('lp_mB'))}</th><td dir="ltr">${E(lpM(b))}</td></tr><tr class="key"><th scope="row">${E(t('lp_mYear'))}</th><td dir="ltr">${E(lpM(diff * 12))}</td></tr></tbody></table>
    <p class="fine">${E(t('lp_mNote'))}</p>`;
}
function lpRender(){
  const root = $('#hr_lifeplan'); if (!root) return; const E = lpE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['sim', '🗺️'], ['job', '🛟'], ['goals', '🎯'], ['move', '🚚']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${LPT === k ? ' on' : ''}" aria-selected="${LPT === k}" data-lptab="${k}">${ic} ${E(t('lp_t_' + k))}</button>`).join('')}</div><div id="lp_view"></div><p class="fine sl-priv">🔒 ${E(t('pic_priv'))}</p>`;
  ({sim: lpSim, job: lpJob, goals: lpGoals, move: lpMove})[LPT]($('#lp_view'));
}
const lpOut = () => ({sim: lpSimOut, job: lpJobOut, move: lpMoveOut})[LPT];
let LP_T = null;
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.closest || !el.closest('#hr_lifeplan')) return; const d = lpD();
  if (el.dataset.lpv) d.v[el.dataset.lpv] = el.value; else if (el.dataset.lpe != null) d.ev[+el.dataset.lpe][el.dataset.lpk] = el.value; else if (el.dataset.lpg != null){ d.goals[+el.dataset.lpg][el.dataset.lpk] = el.value; clearTimeout(LP_T); LP_T = setTimeout(saveSet, 300); return; } else return;
  clearTimeout(LP_T); LP_T = setTimeout(() => { saveSet(); const f = lpOut(); if (f) f(); }, 200); });
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.lpg != null && el.closest('#hr_lifeplan')){ saveSet(); const i = el.dataset.lpg, k = el.dataset.lpk; lpRender(); const n = $(`[data-lpg="${i}"][data-lpk="${k}"]`); if (n) n.focus(); } });
document.addEventListener('click', e => { const t0 = e.target; if (!t0.closest || !t0.closest('#hr_lifeplan')) return; const d = lpD(); let b;
  if ((b = t0.closest('[data-lptab]'))){ LPT = b.dataset.lptab; lpRender(); return; }
  if ((b = t0.closest('[data-lpadd]'))){ if (d.ev.length >= 8) return; d.ev.push({k: b.dataset.lpadd, year: 2}); saveSet(); lpRender(); return; }
  if ((b = t0.closest('[data-lpdel]'))){ d.ev.splice(+b.dataset.lpdel, 1); saveSet(); lpRender(); return; }
  if ((b = t0.closest('[data-lpgadd]'))){ const k = b.dataset.lpgadd, y = new Date().getFullYear(); d.goals.push({name: t('lp_gs_' + k), target: {home: 300000, car: 80000, trip: 15000, buffer: lpBase().exp * 6, study: 60000, wedding: 100000}[k], saved: 0, date: (y + ({home: 4, car: 2, trip: 1, buffer: 1, study: 3, wedding: 2}[k])) + '-01-01'}); saveSet(); lpRender(); return; }
  if ((b = t0.closest('[data-lpgdel]'))){ d.goals.splice(+b.dataset.lpgdel, 1); saveSet(); lpRender(); } });
CALC.lifeplan = () => null;
try { GS_SYN.lifeplan = 'תכנון חיים אירועי חיים תינוק דירה החלפת עבודה פרישה מוקדמת לימודים אם אאבד את העבודה פיטורים כרית יעדים יעד חיסכון מעבר דירה עיר life planning life events baby home job loss runway goals moving تخطيط الحياة طفل شقة فقدان العمل أهداف انتقال'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindLp = svKind; svKind = function(id){ return id === 'lifeplan' ? '' : svKindLp.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('lifeplan'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('lifeplan'); } catch (e) {}
{ const aiStLp = aiScreenText; aiScreenText = function(id){ const s = aiStLp.apply(this, arguments); if (id !== 'lifeplan') return s; const o = $('#lp_out'); return s + '\nLife plan: ' + JSON.stringify({v: lpD().v, events: lpD().ev, goals: lpD().goals}).slice(0, 1500) + '\n' + (o ? o.innerText.slice(0, 800) : ''); }; }
{
  const actLp = activate; activate = function(id){ const r = actLp.apply(this, arguments); if (id === 'lifeplan') lpRender(); return r; };
  const alLp = applyLang; applyLang = function(){ const r = alLp.apply(this, arguments); try { if (tab === 'lifeplan') lpRender(); } catch (e) {} return r; };
  try { if (tab === 'lifeplan') lpRender(); } catch (e) {}
}
