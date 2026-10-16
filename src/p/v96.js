/* ================= 9.6: phones — a search engine, phones you type yourself, filters and up to four side by side ================= */
const E96 = s => asEsc(String(s == null ? '' : s));
const PH_ALIAS = [[/אייפון|ايفون|آيفون/g, 'iphone'], [/סמסונג|سامسونج/g, 'samsung'], [/גלקסי|جالكسي|غالاكسي/g, 'galaxy'], [/שיאומי|שאומי|شاومي/g, 'xiaomi'], [/פיקסל|بكسل/g, 'pixel'],
  [/רדמי|ريدمي/g, 'redmi'], [/פוקו|بوكو/g, 'poco'], [/אפל|ابل|آبل/g, 'apple'], [/גוגל|جوجل/g, 'google'], [/פרו/g, 'pro'], [/מקס/g, 'max'], [/אולטרה|אולטרא/g, 'ultra'], [/פלוס/g, 'plus'], [/נוט/g, 'note'], [/פולד/g, 'fold'], [/פליפ/g, 'flip']];
const phNorm = s => { let x = String(s || '').toLowerCase(); PH_ALIAS.forEach(([rx, to]) => { x = x.replace(rx, ' ' + to + ' '); }); return x.replace(/\+/g, ' plus ').replace(/[^a-z0-9א-ת؀-ۿ]+/g, ' ').trim(); };
function phFind(q){
  const words = phNorm(q).split(' ').filter(Boolean); if (!words.length) return [];
  return phAll().map(p => {
    const hay = phNorm(p.n + ' ' + p.b + ' ' + p.chip + ' ' + (p.b === 'apple' ? 'iphone apple' : p.b === 'samsung' ? 'galaxy samsung' : p.b === 'google' ? 'pixel google' : p.b === 'xiaomi' ? 'xiaomi redmi poco' : ''));
    let sc = 0; for (const w of words){ if (hay.split(' ').some(h => h === w)) sc += 3; else if (hay.includes(w)) sc += 1; else return null; }
    if (phNorm(p.n).startsWith(words.join(' '))) sc += 4;
    return {p, sc: sc + (+String(p.rel).slice(0, 4) || 2000) / 1e4};
  }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 8).map(x => x.p);
}
const phBrief = p => [p.d ? N(p.d, 1) + '″' : '', p.bat ? N(p.bat, 0) + 'mAh' : '', p.ram ? p.ram + 'GB RAM' : '', p.st ? p.st + 'GB' : ''].filter(Boolean).join(' · ');
const phPriceTxt = p => { const x = phIls(p); return isFinite(x.v) ? (x.own ? '' : '≈') + M(x.v) : ''; };
var PHS = {q: '', open: false};
function phsRender(){
  const box = $('#ph_sbox'); if (!box) return;
  const C = phCmpList(), act = document.activeElement, keepQ = act && act.id === 'phs_q', pos = keepQ ? act.selectionStart : 0;
  const res = phFind(PHS.q), mine = phMineList();
  box.innerHTML = `<div class="phs-cmp"><b>${E96(t('phs_cmpT', {n: C.length}))}</b><div class="phs-chips">${C.map(id => { const p = phById(id); return p ? `<span class="phs-chip">${E96(p.n)}<button type="button" data-phsrm="${E96(id)}" aria-label="${E96(t('ins_del'))}">✕</button></span>` : ''; }).join('') || `<span class="fine">${E96(t('phs_none'))}</span>`}</div></div>
    <div class="phs-search"><span aria-hidden="true">🔍</span><input id="phs_q" type="search" autocomplete="off" dir="auto" value="${E96(PHS.q)}" placeholder="${E96(t('phs_ph'))}" aria-label="${E96(t('phs_ph'))}" data-pii-ok></div>
    ${PHS.q ? `<div class="phs-res" role="listbox">${res.length ? res.map(p => { const on = C.includes(p.id); return `<button type="button" class="phs-it${on ? ' on' : ''}" data-phsadd="${E96(p.id)}" role="option" aria-selected="${on}"${!on && C.length >= 4 ? ' disabled' : ''}>
        <span class="phs-n">${p.mine ? '✍️ ' : ''}${E96(p.n)}</span><small>${E96(phBrief(p))}</small><span class="phs-p">${E96(phPriceTxt(p))}</span><span class="phs-a">${on ? '✓' : '＋'}</span></button>`; }).join('') : `<p class="fine">${E96(t('phs_noRes'))}</p>`}</div>` : ''}
    <details class="adv phs-my"${mine.length ? ' open' : ''}><summary>✍️ ${E96(t('phs_myT', {n: mine.length}))}</summary><p class="fine">${E96(t('phs_myN'))}</p>
      ${mine.map((o, i) => `<div class="lc-card phs-mcard"><div class="lc-top"><span class="lc-num" aria-hidden="true">✍️</span><input class="lc-name" type="text" maxlength="40" dir="auto" data-phm="${i}" data-phk="n" value="${E96(o.n || '')}" placeholder="${E96(t('phs_nPh'))}" aria-label="${E96(t('lc_name'))}"><button type="button" class="lc-del" data-phmdel="${i}" aria-label="${E96(t('ins_del'))}">✕</button></div>
        <div class="fields fields3">${[['price', 'ph_price', 'cur'], ['d', 'phs_d', ''], ['hz', 'phs_hz', ''], ['ram', 'phs_ram', ''], ['st', 'phs_st', ''], ['bat', 'phs_bat', ''], ['w', 'phs_w', ''], ['g', 'phs_g', '']].map(([k, lab, u]) => `<div class="field"><span class="lc-l" aria-hidden="true">${E96(t(lab))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-phm="${i}" data-phk="${k}" value="${o[k] == null || o[k] === '' ? '' : E96(o[k])}" aria-label="${E96(t(lab))}">${u ? unitHTML(u) : ''}</div></div>`).join('')}</div>
        <div class="fields fields3">${[['chip', 'ph_chip', 'Snapdragon…'], ['cam', 'phs_cam', '50+12+10'], ['ip', 'ph_water', 'IP68'], ['rel', 'ph_rel', '2026-09']].map(([k, lab, ph]) => `<div class="field"><span class="lc-l" aria-hidden="true">${E96(t(lab))}</span><div class="control"><input type="text" dir="ltr" data-phm="${i}" data-phk="${k}" value="${E96(o[k] || '')}" placeholder="${E96(ph)}" aria-label="${E96(t(lab))}" data-pii-ok></div></div>`).join('')}</div>
      </div>`).join('')}
      <button type="button" class="lc-add" id="phs_myAdd"><span aria-hidden="true">＋</span> ${E96(t('phs_myAdd'))}</button></details>`;
  if (keepQ){ const q = $('#phs_q'); if (q){ q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) {} } }
}
var PHS_T = null;
const phsRe = () => { clearTimeout(PHS_T); PHS_T = setTimeout(() => { try { saveSet(); } catch (e) {} if (tab === 'phonecmp') calc(tab); }, 300); };
document.addEventListener('input', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'phs_q'){ PHS.q = el.value; phsRender(); return; }
  if (el.dataset && el.dataset.phm != null && el.closest('#ph_sbox')){ const o = phMineList()[+el.dataset.phm]; if (!o) return; const k = el.dataset.phk; o[k] = el.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value.slice(0, 60); phsRe(); }
}, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const a = e.target.closest('[data-phsadd]'); if (a){ const C = phCmpList(), id = a.dataset.phsadd; if (C.includes(id)) SET.phCmp = C.filter(x => x !== id); else if (C.length < 4) C.push(id); else return toast(t('phs_max')); saveSet(); phsRender(); calc(tab); return; }
  const r = e.target.closest('[data-phsrm]'); if (r){ SET.phCmp = phCmpList().filter(x => x !== r.dataset.phsrm); saveSet(); phsRender(); calc(tab); return; }
  if (e.target.closest('#phs_myAdd')){ const L = phMineList(); L.push({n: '', price: '', d: '', hz: 120, ram: '', st: '', bat: '', w: '', g: '', chip: '', cam: '', ip: '', rel: ''}); const C = phCmpList(); if (C.length >= 4) C.pop(); C.push('my' + (L.length - 1)); saveSet(); phsRender(); calc(tab); const n = $$('#ph_sbox .phs-mcard .lc-name').pop(); if (n) n.focus(); return; }
  const d = e.target.closest('[data-phmdel]'); if (d){ const i = +d.dataset.phmdel, L = phMineList(); L.splice(i, 1);
    SET.phCmp = (SET.phCmp || []).filter(x => x !== 'my' + i).map(x => /^my\d+$/.test(x) && +x.slice(2) > i ? 'my' + (+x.slice(2) - 1) : x); saveSet(); phsRender(); calc(tab); }
});
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'phs_q' && e.key === 'Enter'){ e.preventDefault(); const b = $('#ph_sbox [data-phsadd]:not([disabled])'); if (b) b.click(); } });
const _calc96 = calc;
calc = function(id){ if (id === 'phonecmp' && $('#ph_sbox') && !$('#ph_sbox').children.length) phsRender(); return _calc96.apply(this, arguments); };
const _al96 = applyLang;
applyLang = function(){ const r = _al96.apply(this, arguments); try { phsRender(); } catch (e) {} return r; };
try { phsRender(); } catch (e) {}
if (location.hostname === 'localhost') window.__fin96 = {phFind: q => phFind(q).map(p => p.n)};
