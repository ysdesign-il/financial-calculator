/* ---------- 13.22: savings and investments – all your savings on one map, and a simple portfolio view ---------- */
const pfE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var PFT = 'map';
const PF_SAV = [['pension', '🧓', 0.22], ['hish', '🎓', 0.6], ['gemel', '🏦', 0.6], ['kids', '🧒', 0], ['deposit', '💵', 0], ['mmf', '💧', 0], ['broker', '📈', 0], ['crypto', '🪙', 0], ['cash', '👛', 0], ['other', '📦', 0]];
const PF_HOLD = ['stockIL', 'stockUS', 'etf', 'bond', 'fund', 'crypto', 'cash', 'other'];
const PF_COL = ['#5B8CFF', '#F5A524', '#2FD08A', '#F0705A', '#A47BFF', '#38BDF8', '#94A3B8', '#FB7185', '#22C55E', '#C084FC'];
function pfD(){ const d = SET.pf && typeof SET.pf === 'object' ? SET.pf : (SET.pf = {}); if (!Array.isArray(d.sav)) d.sav = []; if (!Array.isArray(d.hold)) d.hold = []; return d; }
const pfN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪%]/g, '')); return isFinite(x) ? x : 0; };
const pfM = x => M(Math.round(x || 0), 0, 'ILS');
const pfDonut = parts => { const tot = parts.reduce((s, p) => s + p.v, 0) || 1; let a = 0; return `<div class="exp-donut pf-donut" style="background:conic-gradient(${parts.map(p => { const a0 = a; a += p.v / tot * 100; return `${p.col} ${a0.toFixed(2)}% ${a.toFixed(2)}%`; }).join(',')})" role="img" aria-label="${pfE(parts.map(p => p.n + ' ' + Math.round(p.v / tot * 100) + '%').join(', '))}"><div><b dir="ltr">${pfE(pfM(tot))}</b></div></div><ul class="pf-leg">${parts.map(p => `<li><i style="background:${p.col}"></i>${pfE(p.n)} <b dir="ltr">${Math.round(p.v / tot * 100)}%</b></li>`).join('')}</ul>`; };
function pfMap(v){
  const E = pfE, d = pfD(), tot = d.sav.reduce((s, x) => s + pfN(x.bal), 0), by = {}; d.sav.forEach(x => { by[x.type] = (by[x.type] || 0) + pfN(x.bal); });
  const parts = PF_SAV.filter(s => by[s[0]] > 0).map((s, i) => ({n: s[1] + ' ' + t('pf_s_' + s[0]), v: by[s[0]], col: PF_COL[i % PF_COL.length]}));
  const fees = d.sav.filter(x => pfN(x.fee) > 0).map(x => ({x, cost: pfN(x.bal) * pfN(x.fee) / 100}));
  v.innerHTML = `<p class="fine">${E(t('pf_mapIntro'))}</p>${d.sav.length && tot ? `<div class="pf-top">${pfDonut(parts)}</div>` : ''}
    <ul class="rm-list">${d.sav.map((x, i) => { const T = PF_SAV.find(s => s[0] === x.type) || PF_SAV[9], hi = T[2] && pfN(x.fee) > T[2];
      return `<li class="rm-it${hi ? ' due' : ''}"><div class="rm-ic" aria-hidden="true">${T[1]}</div><div class="rm-b"><div class="bk-grid">
        <label class="bk-f"><span>${E(t('pf_type'))}</span><select data-pfs="${i}" data-pfk="type">${PF_SAV.map(s => `<option value="${s[0]}"${x.type === s[0] ? ' selected' : ''}>${s[1]} ${E(t('pf_s_' + s[0]))}</option>`).join('')}</select></label>
        <label class="bk-f"><span>${E(t('pf_name'))}</span><input type="text" maxlength="30" dir="auto" data-pfs="${i}" data-pfk="name" value="${E(x.name || '')}" placeholder="${E(t('pf_namePh'))}"></label>
        <label class="bk-f"><span>${E(t('pf_bal'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-pfs="${i}" data-pfk="bal" value="${E(x.bal || '')}"></label>
        <label class="bk-f"><span>${E(t('pf_fee'))} (%)</span><input type="text" inputmode="decimal" dir="ltr" data-pfs="${i}" data-pfk="fee" value="${E(x.fee || '')}" placeholder="${T[2] ? N(T[2], 2) : '0'}"></label>
        <label class="bk-f"><span>${E(t('pf_dep'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-pfs="${i}" data-pfk="dep" value="${E(x.dep || '')}"></label></div>
        ${hi ? `<span class="rm-w">⚠️ ${E(t('pf_feeHi', {f: N(T[2], 2), y: pfM(pfN(x.bal) * (pfN(x.fee) - T[2]) / 100)}))}</span>` : ''}
        <div class="rm-acts"><button type="button" class="px-tb s" data-pfsdel="${i}" aria-label="${E(t('lp_del', {n: x.name || t('pf_s_' + x.type)}))}">🗑️</button></div></div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('pf_none'))}</li>`}</ul>
    <div class="ds-chips">${PF_SAV.map(s => `<button type="button" class="ds-chip" data-pfsadd="${s[0]}">＋ ${s[1]} ${E(t('pf_s_' + s[0]))}</button>`).join('')}</div>
    ${tot ? `<table class="bk-plan"><tbody><tr class="key"><th scope="row">${E(t('pf_tot'))}</th><td dir="ltr">${E(pfM(tot))}</td></tr><tr><th scope="row">${E(t('pf_depTot'))}</th><td dir="ltr">${E(pfM(d.sav.reduce((s, x) => s + pfN(x.dep), 0)))} / ${E(t('bk_mo'))}</td></tr><tr><th scope="row">${E(t('pf_feeTot'))}</th><td dir="ltr">${E(pfM(fees.reduce((s, f) => s + f.cost, 0)))} / ${E(t('es_yr'))}</td></tr></tbody></table>
      <p class="fine">${E(t('pf_mapNote'))} <button type="button" class="lg-a" data-go="mgmtfees">${E(t('in_open', {n: t('tab_mgmtfees')}))}</button></p>` : ''}`;
}
function pfHold(v){
  const E = pfE, d = pfD(), tot = d.hold.reduce((s, x) => s + pfN(x.val), 0), by = {}, byC = {}; d.hold.forEach(x => { by[x.type] = (by[x.type] || 0) + pfN(x.val); byC[x.cur || 'ILS'] = (byC[x.cur || 'ILS'] || 0) + pfN(x.val); });
  const big = d.hold.filter(x => tot && pfN(x.val) / tot > 0.25 && !['etf', 'fund', 'cash'].includes(x.type));
  v.innerHTML = `<p class="fine">${E(t('pf_holdIntro'))}</p>${tot ? `<div class="pf-two"><div><h4 class="ds-q">${E(t('pf_byType'))}</h4>${pfDonut(PF_HOLD.filter(k => by[k] > 0).map((k, i) => ({n: t('pf_h_' + k), v: by[k], col: PF_COL[i % PF_COL.length]})))}</div><div><h4 class="ds-q">${E(t('pf_byCur'))}</h4>${pfDonut(Object.keys(byC).filter(k => byC[k] > 0).map((k, i) => ({n: k, v: byC[k], col: PF_COL[(i + 4) % PF_COL.length]})))}</div></div>` : ''}
    ${big.length ? `<ol class="bk-adv">${big.map(x => `<li class="bk-a bk-warn"><span class="bk-ic">⚠️</span><div><b>${E(t('pf_conc', {n: x.name || t('pf_h_' + x.type), p: Math.round(pfN(x.val) / tot * 100)}))}</b><p>${E(t('pf_concP'))}</p></div></li>`).join('')}</ol>` : ''}
    <ul class="rm-list">${d.hold.map((x, i) => `<li class="rm-it"><div class="rm-b"><div class="bk-grid">
      <label class="bk-f"><span>${E(t('pf_hName'))}</span><input type="text" maxlength="30" dir="auto" data-pfh="${i}" data-pfk="name" value="${E(x.name || '')}" placeholder="${E(t('pf_hNamePh'))}"></label>
      <label class="bk-f"><span>${E(t('pf_type'))}</span><select data-pfh="${i}" data-pfk="type">${PF_HOLD.map(k => `<option value="${k}"${x.type === k ? ' selected' : ''}>${E(t('pf_h_' + k))}</option>`).join('')}</select></label>
      <label class="bk-f"><span>${E(t('pf_val'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-pfh="${i}" data-pfk="val" value="${E(x.val || '')}"></label>
      <label class="bk-f"><span>${E(t('pf_cur'))}</span><select data-pfh="${i}" data-pfk="cur">${['ILS', 'USD', 'EUR', 'GBP', 'other'].map(c => `<option value="${c}"${(x.cur || 'ILS') === c ? ' selected' : ''}>${c === 'other' ? E(t('pf_curO')) : c}</option>`).join('')}</select></label></div>
      <div class="rm-acts"><button type="button" class="px-tb s" data-pfhdel="${i}" aria-label="${E(t('lp_del', {n: x.name || ''}))}">🗑️</button></div></div></li>`).join('') || `<li class="fine bk-empty">${E(t('pf_hNone'))}</li>`}</ul>
    <div class="btnrow"><button type="button" class="gold-btn" id="pf_hadd">＋ ${E(t('pf_hAdd'))}</button></div><p class="fine">${E(t('pf_holdNote'))}</p>`;
}
function pfRender(){
  const root = $('#hr_portfolio'); if (!root) return; const E = pfE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['map', '🗺️'], ['hold', '📊']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${PFT === k ? ' on' : ''}" aria-selected="${PFT === k}" data-pftab="${k}">${ic} ${E(t('pf_t_' + k))}</button>`).join('')}</div><div id="pf_view"></div><p class="fine sl-priv">🔒 ${E(t('pic_priv'))}</p>`;
  (PFT === 'map' ? pfMap : pfHold)($('#pf_view'));
}
let PF_T = null;
const pfRefocus = (attr, i, k) => { const n = $(`[${attr}="${i}"][data-pfk="${k}"]`); if (n){ n.focus(); try { const L = n.value.length; n.setSelectionRange(L, L); } catch (e) {} } };
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.closest || !el.closest('#hr_portfolio') || el.tagName === 'SELECT') return; const d = pfD();
  const [arr, attr, i] = el.dataset.pfs != null ? [d.sav, 'data-pfs', el.dataset.pfs] : el.dataset.pfh != null ? [d.hold, 'data-pfh', el.dataset.pfh] : [null]; if (!arr) return;
  arr[+i][el.dataset.pfk] = el.value; const k = el.dataset.pfk; clearTimeout(PF_T); PF_T = setTimeout(() => { saveSet(); if (k !== 'name'){ pfRender(); pfRefocus(attr, i, k); } }, 600); });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.dataset || !el.closest || !el.closest('#hr_portfolio') || el.tagName !== 'SELECT') return; const d = pfD();
  if (el.dataset.pfs != null) d.sav[+el.dataset.pfs][el.dataset.pfk] = el.value; else if (el.dataset.pfh != null) d.hold[+el.dataset.pfh][el.dataset.pfk] = el.value; saveSet(); pfRender(); });
document.addEventListener('click', e => { const t0 = e.target; if (!t0.closest || !t0.closest('#hr_portfolio')) return; const d = pfD(); let b;
  if ((b = t0.closest('[data-pftab]'))){ PFT = b.dataset.pftab; pfRender(); return; }
  if ((b = t0.closest('[data-pfsadd]'))){ d.sav.push({type: b.dataset.pfsadd, name: '', bal: '', fee: '', dep: ''}); saveSet(); pfRender(); pfRefocus('data-pfs', d.sav.length - 1, 'bal'); return; }
  if ((b = t0.closest('[data-pfsdel]'))){ d.sav.splice(+b.dataset.pfsdel, 1); saveSet(); pfRender(); return; }
  if (t0.closest('#pf_hadd')){ d.hold.push({name: '', type: 'etf', val: '', cur: 'ILS'}); saveSet(); pfRender(); pfRefocus('data-pfh', d.hold.length - 1, 'name'); return; }
  if ((b = t0.closest('[data-pfhdel]'))){ d.hold.splice(+b.dataset.pfhdel, 1); saveSet(); pfRender(); } });
CALC.portfolio = () => null;
try { GS_SYN.portfolio = 'חסכונות מפת חסכונות פנסיה קרן השתלמות קופת גמל חיסכון לכל ילד פיקדון תיק השקעות מניות קרן סל פיזור savings map pension study fund provident portfolio stocks etf allocation diversification مدخرات تقاعد صندوق استكمال محفظة استثمار أسهم'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindPf = svKind; svKind = function(id){ return id === 'portfolio' ? '' : svKindPf.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('portfolio'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('portfolio'); } catch (e) {}
{ const aiStPf = aiScreenText; aiScreenText = function(id){ const s = aiStPf.apply(this, arguments); return id === 'portfolio' ? s + '\nSavings and holdings: ' + JSON.stringify({sav: pfD().sav, hold: pfD().hold}).slice(0, 1500) + '\nGeneral information only, not investment advice.' : s; }; }
{
  const actPf = activate; activate = function(id){ const r = actPf.apply(this, arguments); if (id === 'portfolio') pfRender(); return r; };
  const alPf = applyLang; applyLang = function(){ const r = alPf.apply(this, arguments); try { if (tab === 'portfolio') pfRender(); } catch (e) {} return r; };
  try { if (tab === 'portfolio') pfRender(); } catch (e) {}
}
