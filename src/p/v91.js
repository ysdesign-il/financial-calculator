/* ================= 8.9: photo fill, index charts, price alerts, install, mortgage and pension comparisons, a personal summary, backup ================= */
const E91 = s => asEsc(String(s == null ? '' : s));
const numIn = (lab, u, attrs, val, ph) => `<div class="field"><span class="lc-l" aria-hidden="true">${E91(lab)}</span><div class="control"><input type="number" inputmode="decimal" step="any" ${attrs} value="${val == null ? '' : E91(val)}"${ph != null ? ` placeholder="${E91(ph)}"` : ''} aria-label="${E91(lab)}">${unitHTML(u)}</div></div>`;
const cardTop = (i, sel, pre, L) => `<div class="lc-top"><span class="lc-num" aria-hidden="true">${i + 1}</span>${sel}
  <button type="button" class="lc-del ins-dup" data-${pre}edit="${i}" aria-label="${E91(t('ins_edit'))}" title="${E91(t('ins_edit'))}">✏️</button>
  <button type="button" class="lc-del ins-dup" data-${pre}dup="${i}" aria-label="${E91(t('ins_dup'))}" title="${E91(t('ins_dup'))}">⧉</button>
  ${L.length > 1 ? `<button type="button" class="lc-del" data-${pre}del="${i}" aria-label="${E91(t('ins_del'))}">✕</button>` : ''}</div>`;

/* ---------- 1. mortgage offers ---------- */
var MC_EDIT = {};
function mcRender(){
  const box = $('#mc_box'); if (!box) return;
  const L = mcList(), act = document.activeElement, keep = act && box.contains(act) ? act.getAttribute('data-k91') : null;
  const kinds = ['fix', 'cpi', 'var'];
  box.innerHTML = phBtn('mortcmp') + `<div class="ins-head"><b>${E91(t('mc_offers'))}</b><span class="ins-count">${E91(t('ins_count', {n: L.length}))}</span></div>` +
    L.map((o, i) => `<div class="lc-card mc-card">
      ${cardTop(i, `<select class="lc-name ins-co" data-mci="${i}" data-mck="bank" data-k91="mc${i}bank" aria-label="${E91(t('mc_bank'))}"><option value="">${E91(t('mc_pick'))}</option>${MC_BANKS.map(b => `<option value="${b}"${b === o.bank ? ' selected' : ''}>${E91(t('lend_' + b))}</option>`).join('')}</select>`, 'mc', L)}
      ${o.bank === 'nonother' || MC_EDIT[i] || String(o.n || '').trim() ? `<input class="lc-name ins-nm" type="text" maxlength="30" dir="auto" data-mci="${i}" data-mck="n" data-k91="mc${i}n" value="${E91(o.n || '')}" placeholder="${E91(t('mc_namePh'))}" aria-label="${E91(t('lc_name'))}">` : ''}
      ${(o.tr || []).map((x, j) => `<div class="mc-tr"><div class="mc-trh"><span>${E91(t('mc_track', {n: j + 1}))}</span>
        <select data-mci="${i}" data-mct="${j}" data-mck="k" data-k91="mc${i}t${j}k" aria-label="${E91(t('f_tkKind'))}">${kinds.map(k => `<option value="${k}"${k === x.k ? ' selected' : ''}>${E91(t('o_tk_' + k))}</option>`).join('')}</select></div>
        <div class="fields fields3">${numIn(t('f_share'), '%', `data-mci="${i}" data-mct="${j}" data-mck="s" data-k91="mc${i}t${j}s"`, x.s)}${numIn(t('f_tkRate'), '%', `data-mci="${i}" data-mct="${j}" data-mck="r" data-k91="mc${i}t${j}r"`, x.r)}${numIn(t('f_tkYears'), 'yrs', `data-mci="${i}" data-mct="${j}" data-mck="y" data-k91="mc${i}t${j}y"`, x.y)}</div></div>`).join('')}
      <div class="fields">${numIn(t('mc_fee'), 'cur', `data-mci="${i}" data-mck="fee" data-k91="mc${i}fee"`, o.fee)}</div>
    </div>`).join('') +
    `<button type="button" class="lc-add" id="mc_add"><span aria-hidden="true">＋</span> ${E91(t('lc_add'))}</button><p class="fine lc-hint">${E91(t('h_mc'))}</p>`;
  if (keep){ const el = box.querySelector(`[data-k91="${keep}"]`); if (el) el.focus(); }
}
/* ---------- 2. pension / provident fund offers ---------- */
var PC_EDIT = {};
function pcRender(){
  const box = $('#pc_box'); if (!box) return;
  const L = pcList(), act = document.activeElement, keep = act && box.contains(act) ? act.getAttribute('data-k91') : null;
  box.innerHTML = phBtn('pencmp') + `<div class="ins-head"><b>${E91(t('pc_offers'))}</b><span class="ins-count">${E91(t('ins_count', {n: L.length}))}</span></div>` +
    L.map((o, i) => `<div class="lc-card pc-card">
      ${cardTop(i, `<select class="lc-name ins-co" data-pci="${i}" data-pck="co" data-k91="pc${i}co" aria-label="${E91(t('pc_co'))}"><option value="">${E91(t('pc_pick'))}</option>${PC_COS.map(c => `<option value="${c}"${c === o.co ? ' selected' : ''}>${E91(t('pc_co_' + c))}</option>`).join('')}</select>`, 'pc', L)}
      ${o.co === 'other' || PC_EDIT[i] || String(o.n || '').trim() ? `<input class="lc-name ins-nm" type="text" maxlength="30" dir="auto" data-pci="${i}" data-pck="n" data-k91="pc${i}n" value="${E91(o.n || '')}" placeholder="${E91(t('pc_namePh'))}" aria-label="${E91(t('lc_name'))}">` : ''}
      <div class="fields fields3">${numIn(t('f_mfDepFee'), '%', `data-pci="${i}" data-pck="dep" data-k91="pc${i}dep"`, o.dep)}${numIn(t('f_mfAccFee'), '%', `data-pci="${i}" data-pck="acc" data-k91="pc${i}acc"`, o.acc)}${numIn(t('pc_ret'), '%', `data-pci="${i}" data-pck="ret" data-k91="pc${i}ret"`, o.ret, t('pc_retPh'))}</div>
    </div>`).join('') +
    `<button type="button" class="lc-add" id="pc_add"><span aria-hidden="true">＋</span> ${E91(t('lc_add'))}</button><p class="fine lc-hint">${E91(t('h_pc'))}</p>`;
  if (keep){ const el = box.querySelector(`[data-k91="${keep}"]`); if (el) el.focus(); }
}
var T91 = null;
const re91 = () => { clearTimeout(T91); T91 = setTimeout(() => { try { saveSet(); } catch (e) {} if (tab === 'mortcmp' || tab === 'pencmp') calc(tab); }, 250); };
document.addEventListener('input', e => {
  const el = e.target; if (!el.dataset) return;
  if (el.dataset.mck != null && el.closest('#mc_box')){
    const o = mcList()[+el.dataset.mci]; if (!o) return; const k = el.dataset.mck;
    if (el.dataset.mct != null){ const x = o.tr[+el.dataset.mct]; if (x && k !== 'k') x[k] = el.value === '' ? 0 : +el.value; }
    else if (k === 'n') o.n = el.value.slice(0, 30); else if (k === 'fee') o.fee = el.value === '' ? 0 : +el.value;
    re91();
  } else if (el.dataset.pck != null && el.closest('#pc_box')){
    const o = pcList()[+el.dataset.pci]; if (!o) return; const k = el.dataset.pck;
    if (k === 'n') o.n = el.value.slice(0, 30); else if (k === 'ret') o.ret = el.value === '' ? '' : +el.value; else if (k !== 'co') o[k] = el.value === '' ? 0 : +el.value;
    re91();
  }
}, true);
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset || el.tagName !== 'SELECT') return;
  if (el.dataset.mck && el.closest('#mc_box')){
    const o = mcList()[+el.dataset.mci]; if (!o) return;
    if (el.dataset.mct != null){ o.tr[+el.dataset.mct].k = el.value; }
    else { o.bank = el.value; if (o.bank !== 'nonother' && !MC_EDIT[el.dataset.mci]) o.n = ''; }
    saveSet(); mcRender(); calc(tab);
    if (o.bank === 'nonother'){ const n = $(`#mc_box .ins-nm[data-mci="${el.dataset.mci}"]`); if (n) n.focus(); }
  } else if (el.dataset.pck === 'co' && el.closest('#pc_box')){
    const o = pcList()[+el.dataset.pci]; if (!o) return;
    o.co = el.value; if (o.co !== 'other' && !PC_EDIT[el.dataset.pci]) o.n = '';
    saveSet(); pcRender(); calc(tab);
    if (o.co === 'other'){ const n = $(`#pc_box .ins-nm[data-pci="${el.dataset.pci}"]`); if (n) n.focus(); }
  }
}, true);
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const sets = [['mc', mcList, mcRender, MC_EDIT, o => o.bank && o.bank !== 'nonother' ? t('lend_' + o.bank) : '', () => mcSeed()[0]], ['pc', pcList, pcRender, PC_EDIT, o => o.co && o.co !== 'other' ? t('pc_co_' + o.co) : '', () => pcSeed()[0]]];
  for (const [p, list, render, EDIT, autoName, seed] of sets){
    const L = list();
    if (e.target.closest('#' + p + '_add')){ const last = L[L.length - 1] || seed(); L.push(JSON.parse(JSON.stringify(Object.assign({}, last, {n: '', bank: '', co: ''})))); saveSet(); render(); calc(tab); const s = $$(`#${p}_box .ins-co`).pop(); if (s){ s.focus(); s.scrollIntoView({block: 'center'}); } return; }
    const ed = e.target.closest(`[data-${p}edit]`); if (ed){ const i = +ed.dataset[p + 'edit']; EDIT[i] = true; const o = L[i]; if (o && !String(o.n || '').trim()) o.n = autoName(o); render(); const n = $(`#${p}_box .ins-nm[data-${p}i="${i}"]`); if (n){ n.focus(); n.select(); } return; }
    const du = e.target.closest(`[data-${p}dup]`); if (du){ const i = +du.dataset[p + 'dup']; if (!L[i]) return; L.splice(i + 1, 0, JSON.parse(JSON.stringify(L[i]))); saveSet(); render(); calc(tab); return; }
    const de = e.target.closest(`[data-${p}del]`); if (de){ if (L.length <= 1) return; L.splice(+de.dataset[p + 'del'], 1); for (const k in EDIT) delete EDIT[k]; saveSet(); render(); calc(tab); return; }
  }
});

/* ---------- 3. fill an offer from a photo (inside the app, with the real AI) ---------- */
var PH = {s: null, ok: false};
(async function phInit(){
  if (!IN_CLAUDE || !window.claude) return;
  try { const s = await window.claude.use('sample'); if (!s) return; PH.s = s; const L = await s.limits().catch(() => null); PH.ok = !!(L && L.images); if (PH.ok) phAll(); } catch (e) {}
})();
function phBtn(kind){ return PH.ok ? `<div class="ph-row"><button type="button" class="ph-btn" data-ph="${kind}"><span aria-hidden="true">📷</span> ${E91(t('ph_btn'))}</button><span class="ph-st" data-phst="${kind}"></span></div>` : ''; }
function phAll(){ try { insRender(); } catch (e) {} try { lcRender(); } catch (e) {} try { mcRender(); } catch (e) {} try { pcRender(); } catch (e) {} }
const _lcR91 = lcRender;
lcRender = function(){ const r = _lcR91.apply(this, arguments); const b = $('#lc_box'); if (b && PH.ok && !b.querySelector('.ph-row')) b.insertAdjacentHTML('afterbegin', phBtn('loancmp')); return r; };
const _insR91 = insRender;
insRender = function(){ const r = _insR91.apply(this, arguments); const b = $('#ins_box'); if (b && PH.ok && !b.querySelector('.ph-row')) b.insertAdjacentHTML('afterbegin', phBtn('insurance')); return r; };
function phShrink(file){
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(new Error('img')), 'image/jpeg', 0.85); };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); };
    img.src = u;
  });
}
const PH_ASK = {
  insurance: () => `Read this insurance offer/quote image. Return ONLY JSON: {"insurer": one of ${JSON.stringify(INS_COS.filter(c => c !== 'other'))} or "" if not one of them, "name": insurer or plan name as written (short), "monthlyPremium": number (per month, convert yearly to monthly), "yearlyIncreasePct": number or 0, "deductible": number or 0, "cover": sum insured number or 0, "discountPct": number or 0, "discountYears": number or 0, "addonsMonthly": number or 0}. Use numbers only, no currency signs. If a value is missing use 0.`,
  loancmp: () => `Read this loan offer image. Return ONLY JSON: {"lender": one of ${JSON.stringify(LEND.flatMap(g => g[1]).filter(c => c !== 'nonother'))} or "", "name": lender name as written (short), "amount": number, "annualRatePct": nominal yearly interest %, "years": number (convert months to years), "openingFee": number in money or 0, "feePct": fee as % of the loan or 0, "monthlyFee": number or 0}. Numbers only. Missing → 0.`,
  mortcmp: () => `Read this mortgage offer image (a mix of tracks). Return ONLY JSON: {"bank": one of ${JSON.stringify(MC_BANKS.filter(c => c !== 'nonother'))} or "", "name": bank name as written, "fees": total opening/appraisal fees or 0, "tracks": [ up to 3 items {"kind": "fix" for fixed not linked, "cpi" for linked to the CPI (צמודה), "var" for prime or variable, "sharePct": share of the mortgage %, "ratePct": yearly rate %, "years": number} ]}. Numbers only.`,
  pencmp: () => `Read this pension / provident / study fund offer image. Return ONLY JSON: {"company": one of ${JSON.stringify(PC_COS.filter(c => c !== 'other'))} or "", "name": company/track name as written, "depositFeePct": management fee from deposits %, "accumulationFeePct": management fee from savings %, "returnPct": expected or past yearly return % if shown, else null}. Numbers only.`
};
const n91 = x => { const v = typeof x === 'string' ? parseFloat(x.replace(/[^\d.\-]/g, '')) : +x; return isFinite(v) ? v : 0; };
function phApply(kind, j){
  if (!j || typeof j !== 'object') throw new Error('empty');
  if (kind === 'insurance'){
    const co = INS_COS.includes(j.insurer) ? j.insurer : '';
    insList().push({co, n: co ? '' : String(j.name || '').slice(0, 30), p: n91(j.monthlyPremium), g: n91(j.yearlyIncreasePct), d: n91(j.deductible), c: n91(j.cover), x: n91(j.discountPct), xy: n91(j.discountYears), e: n91(j.addonsMonthly)});
    insRender();
  } else if (kind === 'loancmp'){
    const all = LEND.flatMap(g => g[1]), lend = all.includes(j.lender) ? j.lender : '';
    lcList().push({n: lend ? t('lend_' + lend) : String(j.name || '').slice(0, 30), nAuto: !!lend, lend, amt: n91(j.amount), rate: n91(j.annualRatePct), yrs: n91(j.years) || 1, fee: n91(j.openingFee), pct: n91(j.feePct), mon: n91(j.monthlyFee)});
    lcRender();
  } else if (kind === 'mortcmp'){
    const bank = MC_BANKS.includes(j.bank) ? j.bank : '';
    const tr = (Array.isArray(j.tracks) ? j.tracks : []).slice(0, 3).map(x => ({k: ['fix', 'cpi', 'var'].includes(x && x.kind) ? x.kind : 'fix', s: n91(x && x.sharePct), r: n91(x && x.ratePct), y: n91(x && x.years) || 25}));
    while (tr.length < 3) tr.push({k: 'var', s: 0, r: 5, y: 25});
    mcList().push({bank, n: bank ? '' : String(j.name || '').slice(0, 30), fee: n91(j.fees), tr});
    mcRender();
  } else if (kind === 'pencmp'){
    const co = PC_COS.includes(j.company) ? j.company : '';
    pcList().push({co, n: co ? '' : String(j.name || '').slice(0, 30), dep: n91(j.depositFeePct), acc: n91(j.accumulationFeePct), ret: j.returnPct == null || j.returnPct === '' ? '' : n91(j.returnPct)});
    pcRender();
  }
  saveSet(); calc(tab);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ph]'); if (!b || !PH.ok) return;
  const kind = b.dataset.ph, inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const st = () => $(`[data-phst="${kind}"]`), say = (k, cls) => { const s = st(); if (s){ s.textContent = t(k); s.className = 'ph-st ' + (cls || ''); } };
    say('ph_reading');
    try {
      const blob = await phShrink(f);
      const j = await PH.s.json(PH_ASK[kind](), {images: [blob], cache: false, modelTier: 'default'});
      phApply(kind, j); toast(t('ph_done')); say('ph_done', 'ok');
      const cards = $$('.lc-card', b.closest('.lc-wrap') || document); const last = cards[cards.length - 1]; if (last){ last.classList.add('ph-new'); last.scrollIntoView({block: 'center'}); }
    } catch (er) { say(er && er.code === 'not_granted' ? 'ph_denied' : 'ph_fail', 'bad'); }
  };
  inp.click();
});

/* ---------- 4. a chart for every live index and commodity ---------- */
const HIST_URL = IN_CLAUDE ? 'https://ysdesign-il.github.io/financial-calculator/history.json' : 'history.json';
var HIST = {d: null, at: 0, p: null};
function histLoad(){
  if (HIST.d && Date.now() - HIST.at < 3600e3) return Promise.resolve(HIST.d);
  if (HIST.p) return HIST.p;
  HIST.p = fetch(HIST_URL + '?v=' + Math.floor(Date.now() / 3600e3), {credentials: 'omit', referrerPolicy: 'no-referrer'}).then(r => r.ok ? r.json() : null).catch(() => null)
    .then(j => { HIST.p = null; if (j && j.s){ HIST.d = j; HIST.at = Date.now(); } return HIST.d; });
  return HIST.p;
}
const CH_R = [['1m', 31], ['6m', 183], ['1y', 366], ['5y', 1830]];
var CH = {k: '', r: '1y', go: 'none'};
function chOpen(k, go){
  CH = {k, r: SET.chRange || '1y', go: go || 'none'};
  if (!$('#chx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="chx" hidden><div class="cp-box ch-box" role="dialog" aria-modal="true" aria-labelledby="chx_t"><div class="cp-top"><h3 id="chx_t"></h3><button type="button" class="cp-x" id="chx_x">×</button></div><div id="chx_b"></div></div></div>`);
  $('#chx_x').setAttribute('aria-label', t('cp_close'));
  $('#chx').hidden = false; document.body.classList.add('cp-lock');
  chDraw(); histLoad().then(chDraw);
}
function chClose(){ const o = $('#chx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
function chSeries(){
  const k = CH.k, d = HIST.d && HIST.d.s && HIST.d.s[k];
  let pts = Array.isArray(d) ? d.map(x => [x[0] * 864e5, +x[1]]).filter(x => x[1] > 0) : [];
  const live = IX.mkt[k]; if (live && live.p > 0){ const ts = (live.t ? live.t * 1000 : Date.now()); if (!pts.length || ts > pts[pts.length - 1][0] + 36e5) pts.push([ts, live.p]); else pts[pts.length - 1] = [pts[pts.length - 1][0], live.p]; }
  const days = (CH_R.find(r => r[0] === CH.r) || CH_R[2])[1], from = Date.now() - days * 864e5;
  return pts.filter(x => x[0] >= from);
}
function chDraw(){
  const box = $('#chx_b'); if (!box || $('#chx').hidden) return;
  $('#chx_t').innerHTML = (typeof mkIcon === 'function' ? mkIcon(CH.k) : '') + ' ' + E91(ixName(CH.k));
  const P = chSeries(), com = IX_COM.includes(CH.k), fmt = x => (com ? '$' : '') + N(x, null, x >= 1000 ? 0 : 2);
  const head = `<div class="ch-rng" role="tablist">${CH_R.map(([r]) => `<button type="button" role="tab" data-chr="${r}" class="${r === CH.r ? 'on' : ''}" aria-selected="${r === CH.r}">${E91(t('ch_' + r))}</button>`).join('')}</div>`;
  const go = CH.go && CH.go !== 'none' ? `<button type="button" class="lc-add ch-go" data-chgo="1">🧮 ${E91(t('ch_go'))}</button>` : '';
  if (P.length < 2){
    box.innerHTML = head + `<div class="ch-empty">${E91(t(HIST.p ? 'ch_loading' : 'ch_none'))}</div>` + go; return;
  }
  const W = 340, H = 190, pad = 6, xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), dy = (y1 - y0) || 1;
  const X = x => pad + (x - x0) / ((x1 - x0) || 1) * (W - 2 * pad), Y = y => pad + (1 - (y - y0) / dy) * (H - 2 * pad);
  const path = P.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
  const first = P[0][1], last = P[P.length - 1][1], ch = (last / first - 1) * 100, up = ch >= 0, col = up ? 'var(--ch-up,#1f9d55)' : 'var(--ch-dn,#d64545)';
  const dl = ms => new Date(ms).toLocaleDateString(typeof langLocale === 'function' ? langLocale() : (document.documentElement.lang || undefined), {day: 'numeric', month: 'short', year: '2-digit'});
  box.innerHTML = head + `<div class="ch-top"><b class="num">${E91(fmt(last))}</b><span class="ix-ch ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${E91(sgnPC(ch))}</span><small>${E91(t('ch_over', {r: t('ch_' + CH.r)}))}</small></div>
    <div class="ch-wrap" dir="ltr"><svg class="ch-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${E91(ixName(CH.k) + ' ' + fmt(first) + ' → ' + fmt(last))}">
      <defs><linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${up ? '#2fbf71' : '#e05252'}" stop-opacity=".35"/><stop offset="1" stop-color="${up ? '#2fbf71' : '#e05252'}" stop-opacity="0"/></linearGradient></defs>
      <path d="${path} L${X(x1).toFixed(1)} ${H} L${X(x0).toFixed(1)} ${H} Z" fill="url(#chg)"/>
      <path d="${path}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <line class="ch-cur" x1="0" x2="0" y1="0" y2="${H}" stroke="currentColor" stroke-opacity=".35" vector-effect="non-scaling-stroke" hidden/>
    </svg><div class="ch-tip" hidden></div>
    <div class="ch-ax"><span>${E91(dl(x0))}</span><span>${E91(dl(x1))}</span></div>
    <div class="ch-mm"><span>${E91(t('ch_min'))}: <b>${E91(fmt(y0))}</b></span><span>${E91(t('ch_max'))}: <b>${E91(fmt(y1))}</b></span></div></div>
    <p class="fine">${E91(t('ch_src'))}</p>` + go;
  const svg = box.querySelector('.ch-svg'), tip = box.querySelector('.ch-tip'), cur = box.querySelector('.ch-cur');
  const move = ev => {
    const r = svg.getBoundingClientRect(), fx = (ev.clientX - r.left) / r.width, tx = x0 + fx * (x1 - x0);
    let bi = 0, bd = Infinity; P.forEach((p, i) => { const d = Math.abs(p[0] - tx); if (d < bd){ bd = d; bi = i; } });
    const p = P[bi]; cur.removeAttribute('hidden'); cur.setAttribute('x1', X(p[0])); cur.setAttribute('x2', X(p[0]));
    tip.hidden = false; tip.textContent = dl(p[0]) + ' · ' + fmt(p[1]); tip.style.left = Math.min(r.width - 120, Math.max(0, fx * r.width - 60)) + 'px';
  };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => { tip.hidden = true; cur.setAttribute('hidden', ''); });
}
var CH_PASS = false;
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  const o = $('#chx');
  if (o && !o.hidden){
    if (e.target === o || e.target.closest('#chx_x')) return chClose();
    const r = e.target.closest('[data-chr]'); if (r){ CH.r = r.dataset.chr; SET.chRange = CH.r; try { saveSet(); } catch (er) {} chDraw(); return; }
    if (e.target.closest('[data-chgo]')){ const card = $(`#hmx .ix-card[data-ixk="${CH.k}"]`); chClose(); if (card){ CH_PASS = true; card.click(); CH_PASS = false; } return; }
  }
  const c = e.target.closest('#hmx .ix-card[data-ixk]');
  if (c && !CH_PASS && IX_MK.includes(c.dataset.ixk)){ e.stopPropagation(); e.preventDefault(); chOpen(c.dataset.ixk, c.dataset.ixgo); }
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ const o = $('#chx'); if (o && !o.hidden){ e.preventDefault(); chClose(); } } });

/* ---------- 5. price alerts ---------- */
const AL_CUR = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'BTC', 'ETH'];
function alList(){ if (!Array.isArray(SET.alerts)) SET.alerts = []; return SET.alerts; }
function alName(k){ return IX_MK.includes(k) ? ixName(k) : (typeof curFlag === 'function' ? curFlag(k) + ' ' : '') + k + ' → ' + baseCur; }
function alNow(k){
  if (IX_MK.includes(k)){ const d = IX.mkt[k]; return d && d.p > 0 ? d.p : NaN; }
  const a = RATES[baseCur], b = RATES[k]; return a > 0 && b > 0 ? a / b : NaN;
}
const alFmt = (k, x) => !isFinite(x) ? '—' : IX_MK.includes(k) ? (IX_COM.includes(k) ? '$' : '') + N(x, null, x >= 1000 ? 0 : 2) : M(x, x >= 100 ? 0 : x >= 1 ? 3 : 6, baseCur);
function alCheck(){
  const L = alList(); let hit = 0;
  L.forEach(a => {
    if (!a.on || a.hit) return; const x = alNow(a.k); if (!isFinite(x)) return;
    if ((a.op === '>' && x >= a.v) || (a.op === '<' && x <= a.v)){
      a.hit = Date.now(); hit++;
      const msg = t('al_fired', {n: alName(a.k), v: alFmt(a.k, x), op: t(a.op === '>' ? 'al_up' : 'al_dn'), t: alFmt(a.k, a.v)});
      try { toast('🔔 ' + msg); } catch (e) {}
      try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'granted') new Notification(t('al_title'), {body: msg, icon: 'icon-192.png', tag: 'al-' + a.id}); } catch (e) {}
    }
  });
  if (hit){ try { saveSet(); } catch (e) {} alBtn(); if ($('#alx') && !$('#alx').hidden) alDraw(); }
}
function alBtn(){
  const note = $('#hmx .mkt-note'); if (!note) return;
  let b = $('#al_open');
  const n = alList().filter(a => a.on && !a.hit).length, fired = alList().filter(a => a.hit).length;
  const html = `🔔 ${E91(t('al_btn'))}${n ? ` <span class="al-n">${n}</span>` : ''}${fired ? ` <span class="al-n hit">${fired}</span>` : ''}`;
  if (!b){ note.insertAdjacentHTML('beforebegin', `<div class="al-row"><button type="button" class="al-open" id="al_open">${html}</button></div>`); }
  else if (b.innerHTML !== html) b.innerHTML = html;
}
function alOpen(){
  if (!$('#alx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="alx" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="alx_t"><div class="cp-top"><h3 id="alx_t"></h3><button type="button" class="cp-x" id="alx_x">×</button></div><div id="alx_b"></div></div></div>`);
  $('#alx_t').textContent = t('al_title'); $('#alx_x').setAttribute('aria-label', t('cp_close'));
  $('#alx').hidden = false; document.body.classList.add('cp-lock'); alDraw();
}
function alDraw(){
  const box = $('#alx_b'); if (!box) return;
  const L = alList(), keys = IX_MK.filter(k => IX.mkt[k] && IX.mkt[k].p > 0).concat(AL_CUR.filter(c => c !== baseCur && RATES[c]));
  const sel = box.querySelector('#al_k') ? box.querySelector('#al_k').value : (keys[0] || 'gold');
  box.innerHTML = `<div class="al-list">${L.length ? L.map((a, i) => `<div class="al-it${a.hit ? ' hit' : ''}"><div><b>${a.hit ? '✅' : '🔔'} ${E91(alName(a.k))}</b><small>${E91(t(a.op === '>' ? 'al_up' : 'al_dn'))} ${E91(alFmt(a.k, a.v))} · ${E91(t('al_now'))} ${E91(alFmt(a.k, alNow(a.k)))}</small></div>
      ${a.hit ? `<button type="button" class="fg-x" data-alre="${i}">${E91(t('al_rearm'))}</button>` : ''}<button type="button" class="lc-del" data-aldel="${i}" aria-label="${E91(t('ins_del'))}">✕</button></div>`).join('') : `<p class="fine">${E91(t('al_empty'))}</p>`}</div>
    <div class="al-add"><b>${E91(t('al_new'))}</b>
      <select id="al_k" aria-label="${E91(t('al_what'))}">${keys.map(k => `<option value="${k}"${k === sel ? ' selected' : ''}>${E91(alName(k))}</option>`).join('')}</select>
      <div class="al-line"><select id="al_op" aria-label="${E91(t('al_when'))}"><option value=">">${E91(t('al_up'))}</option><option value="<">${E91(t('al_dn'))}</option></select>
      <input id="al_v" type="number" inputmode="decimal" step="any" aria-label="${E91(t('al_val'))}" placeholder="${E91(alFmt(sel, alNow(sel)))}"></div>
      <button type="button" class="lc-add" id="al_add">＋ ${E91(t('al_addB'))}</button>
      <p class="fine">${E91(t(IN_CLAUDE ? 'al_noteApp' : 'al_noteWeb'))}</p></div>`;
  const v = $('#al_v'); const now = alNow(sel); if (v && isFinite(now)) v.value = String(+now.toPrecision(5));
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'al_k'){ const v = $('#al_v'), now = alNow(e.target.value); if (v){ v.value = isFinite(now) ? String(+now.toPrecision(5)) : ''; v.placeholder = alFmt(e.target.value, now); } } });
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  if (e.target.closest('#al_open')){ alOpen(); return; }
  const o = $('#alx'); if (!o || o.hidden) return;
  if (e.target === o || e.target.closest('#alx_x')){ o.hidden = true; document.body.classList.remove('cp-lock'); return; }
  if (e.target.closest('#al_add')){
    const k = $('#al_k').value, op = $('#al_op').value, v = +$('#al_v').value; if (!k || !(v > 0)) return toast(t('al_bad'));
    alList().push({id: Date.now().toString(36), k, op, v, on: true, hit: 0}); saveSet();
    try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); } catch (er) {}
    alDraw(); alBtn(); toast(t('al_added')); alCheck(); return;
  }
  const d = e.target.closest('[data-aldel]'); if (d){ alList().splice(+d.dataset.aldel, 1); saveSet(); alDraw(); alBtn(); return; }
  const r = e.target.closest('[data-alre]'); if (r){ const a = alList()[+r.dataset.alre]; if (a){ a.hit = 0; saveSet(); alDraw(); alBtn(); alCheck(); } }
});
setInterval(() => { try { alCheck(); } catch (e) {} }, 60000);

/* ---------- 6. a personal summary on Home ---------- */
function dsCard(id, ic, lab, val, sub){ return `<button type="button" class="ds-c" data-dsgo="${id}"><span class="ds-ic" aria-hidden="true">${ic}</span><span class="ds-l">${E91(lab)}</span><b class="num">${E91(val)}</b>${sub ? `<small>${E91(sub)}</small>` : ''}</button>`; }
function dsBest(id){ try { const r = (CALC[id] || (() => null))(); return r && r.hero ? [strip(r.hero.label), strip(r.hero.value)] : null; } catch (e) { return null; } }
function dsRender(){
  const hm = $('#hm'); if (!hm || tab !== 'home') return;
  const sec = hm.closest('section') || hm.parentNode;
  let box = $('#dsb'); if (!box){ box = document.createElement('div'); box.id = 'dsb'; box.className = 'dsb'; const head = sec.querySelector('.mk-head'); (head || hm).parentNode.insertBefore(box, head || hm); }
  const C = [];
  try { const d = expData(), ym = new Date().toISOString().slice(0, 7), it = d.items.filter(x => String(x.date || '').slice(0, 7) === ym); if (it.length) C.push(dsCard('expenses', '🧾', t('ds_exp'), M(it.reduce((s, x) => s + (+x.amt || 0), 0), 0, expCur()), t('ds_expN', {n: it.length}))); } catch (e) {}
  try { const vals = JSON.parse(LS.getItem('fin-vals') || '{}') || {}; if (vals.nw_cash != null || vals.nw_inv != null){ const b = dsBest('networth'); if (b) C.push(dsCard('networth', '💎', t('ds_nw'), b[1], '')); } } catch (e) {}
  [['insOffers', 'insurance', '🛡️', 'ds_ins'], ['lcOffers', 'loancmp', '🏦', 'ds_loan'], ['mcOffers', 'mortcmp', '🏠', 'ds_mort'], ['pcOffers', 'pencmp', '📈', 'ds_pen']].forEach(([k, id, ic, lab]) => {
    if (Array.isArray(SET[k]) && SET[k].length){ const b = dsBest(id); if (b){ const nm = String(b[0]).split(/[:：]/).slice(1).join(':').split(/[,،]/)[0].trim() || b[0]; C.push(dsCard(id, ic, t(lab), nm, b[1])); } }
  });
  try { const n = (JSON.parse(LS.getItem('fin-files') || '[]') || []).length; if (n) C.push(dsCard('saved', '📁', t('ds_saved'), N(n, 0), '')); } catch (e) {}
  const al = alList().filter(a => a.on && !a.hit).length; if (al) C.push(`<button type="button" class="ds-c" data-dsal="1"><span class="ds-ic" aria-hidden="true">🔔</span><span class="ds-l">${E91(t('ds_al'))}</span><b class="num">${N(al, 0)}</b></button>`);
  box.innerHTML = `<div class="ds-head"><h3 class="sec-t">${E91(t('ds_title'))}</h3></div>` +
    (C.length ? `<div class="ds-grid">${C.join('')}</div>` : `<p class="fine ds-empty">${E91(t('ds_empty'))}</p>`);
}
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('[data-dsgo],[data-dsal]'); if (!c) return;
  if (c.dataset.dsal){ alOpen(); return; }
  try { activate(c.dataset.dsgo); } catch (er) {}
});

/* ---------- 7. install as an app (the website) ---------- */
var PWA = {ev: null};
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '');
function insCan(){ return !IN_CLAUDE && !isStandalone() && (PWA.ev || isIOS()); }
(function pwaInit(){
  if (IN_CLAUDE || !/^https?:$/.test(location.protocol)) return;
  const head = document.head;
  if (!head.querySelector('link[rel=manifest]')) head.insertAdjacentHTML('beforeend', '<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">');
  if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.ev = e; try { instSync(); } catch (er) {} });
  window.addEventListener('appinstalled', () => { PWA.ev = null; toast(t('pwa_done')); try { instSync(); } catch (er) {} });
})();
document.addEventListener('click', async e => {
  if (!e.target.closest || !e.target.closest('#pwa_inst')) return;
  if (PWA.ev){ try { PWA.ev.prompt(); await PWA.ev.userChoice; } catch (er) {} PWA.ev = null; instSync(); }
  else if (isIOS()) alert(t('pwa_ios'));
});

/* ---------- 8. backup and restore (in Saved) ---------- */
const BK_SKIP = /key|tok|secret|pass|pin/i;
function bkMake(){
  const o = {app: 'financial-calculator', v: 1, ver: APP_VER, at: new Date().toISOString(), data: {}};
  DATA_KEYS.forEach(k => {
    let v = LS.getItem(k); if (v == null) return;
    if (k === 'fin-set'){ try { const s = JSON.parse(v); Object.keys(s).forEach(x => { if (BK_SKIP.test(x)) delete s[x]; }); v = JSON.stringify(s); } catch (e) {} }
    o.data[k] = v;
  });
  return o;
}
async function bkSave(){
  const blob = new Blob([JSON.stringify(bkMake(), null, 1)], {type: 'application/json'});
  const r = await fileSave(blob, 'financial-calculator-backup-' + new Date().toISOString().slice(0, 10) + '.json', 'application/json');
  toast(t(r === 'saved' ? 'bk_saved' : r === 'declined' ? 'pdf_declined' : 'bk_fail'));
}
function bkLoad(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    try {
      if (f.size > 5e6) throw new Error('big');
      const j = JSON.parse(await f.text());
      if (!j || j.app !== 'financial-calculator' || !j.data || typeof j.data !== 'object') throw new Error('bad');
      if (!confirm(t('bk_sure', {d: String(j.at || '').slice(0, 10)}))) return;
      const keep = {}; try { const cur0 = JSON.parse(LS.getItem('fin-set') || '{}'); Object.keys(cur0).forEach(x => { if (BK_SKIP.test(x)) keep[x] = cur0[x]; }); } catch (e) {}
      Object.keys(j.data).forEach(k => {
        if (!DATA_KEYS.includes(k) || typeof j.data[k] !== 'string') return;
        let v = j.data[k];
        if (k === 'fin-set'){ try { const s = JSON.parse(v); Object.keys(s).forEach(x => { if (BK_SKIP.test(x)) delete s[x]; }); v = JSON.stringify(Object.assign(s, keep)); } catch (e) { return; } }
        try { JSON.parse(v); } catch (e) { if (!['fin-lang', 'fin-cur', 'fin-tab'].includes(k)) return; }
        SV.direct = true; try { LS.setItem(k, v); } finally { SV.direct = false; }
        try { if (k === 'fin-exp' || k === 'fin-clients') localStorage.setItem(k, v); } catch (e) {}
      });
      toast(t('bk_done')); setTimeout(() => location.reload(), 900);
    } catch (er) { toast(t('bk_bad')); }
  };
  inp.click();
}
const _svdR91 = svdRender;
svdRender = function(){
  const r = _svdR91.apply(this, arguments);
  const root = $('#svd_root'); if (root && !root.querySelector('.bk-box')) root.insertAdjacentHTML('beforeend', `<div class="bk-box"><h4>💾 ${E91(t('bk_title'))}</h4><p class="fine">${E91(t('bk_note'))}</p><div class="bk-acts"><button type="button" class="lc-add" id="bk_save">⬇️ ${E91(t('bk_saveB'))}</button><button type="button" class="lc-add" id="bk_load">⬆️ ${E91(t('bk_loadB'))}</button></div></div>`);
  return r;
};
document.addEventListener('click', e => { if (!e.target.closest) return; if (e.target.closest('#bk_save')) bkSave(); else if (e.target.closest('#bk_load')) bkLoad(); });

/* ---------- start ---------- */
const _ixB91 = ixBoard;
ixBoard = function(){ const r = _ixB91.apply(this, arguments); try { alBtn(); alCheck(); } catch (e) {} try { dsRender(); } catch (e) {} return r; };
const _al91 = applyLang;
applyLang = function(){ const r = _al91.apply(this, arguments); try { mcRender(); pcRender(); } catch (e) {} return r; };
const _calc91 = calc;
calc = function(id){ if (id === 'mortcmp' && $('#mc_box') && !$('#mc_box').children.length) mcRender(); if (id === 'pencmp' && $('#pc_box') && !$('#pc_box').children.length) pcRender(); return _calc91.apply(this, arguments); };
try { mcRender(); pcRender(); if (tab === 'home') dsRender(); else if (tab === 'mortcmp' || tab === 'pencmp') calc(tab); } catch (e) {}

/* ---------- 9. lighter Settings: the 13 per-calculator currency lists hold one option until you open them ---------- */
var LZ = new Map();
function lzCollapse(){
  $$('select[id^="set_cb_"]').forEach(s => {
    LZ.set(s.id, s.innerHTML); const v = s.value, o = s.selectedOptions[0];
    s.innerHTML = o ? o.outerHTML : `<option value="">${E91(t('f_curDefault'))}</option>`; s.value = v; s.dataset.lz = '1';
  });
}
function lzOpen(s){ if (!s || !s.dataset.lz) return; const v = s.value, h = LZ.get(s.id); if (h){ s.innerHTML = h; s.value = v; } delete s.dataset.lz; }
['pointerdown', 'focusin', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, e => { const s = e.target && e.target.closest && e.target.closest('select[data-lz]'); if (s) lzOpen(s); }, {capture: true, passive: true}));
const _fillCB91 = fillCB;
fillCB = function(){ $$('select[data-lz]').forEach(s => delete s.dataset.lz); const r = _fillCB91.apply(this, arguments); try { lzCollapse(); } catch (e) {} return r; };
try { lzCollapse(); } catch (e) {}
/* ---------- 10. the automatic checks: developer mode only ---------- */
const CI_API = 'https://api.github.com/repos/' + DC_REPO + '/actions/workflows/test.yml';
async function ciLoad(){
  const box = $('#ci_box'); if (!box || !liveOwner()) return;
  const H = {Accept: 'application/vnd.github+json'}; const tok = ghTok(); if (tok) H.Authorization = 'Bearer ' + tok;
  let html = '';
  try {
    const r = await fetch(CI_API + '/runs?per_page=3', {headers: H, cache: 'no-store'});
    if (!r.ok) throw new Error('gh' + r.status);
    const j = await r.json(), L = (j.workflow_runs || []);
    html = L.length ? L.map(x => { const st = x.status !== 'completed' ? '⏳ ' + t('ci_run') : x.conclusion === 'success' ? '✅ ' + t('ci_ok') : '❌ ' + t('ci_bad'); return `<li><a href="${E91(x.html_url)}" target="_blank" rel="noopener noreferrer">${E91(st)}</a> · ${E91(svdDate(Date.parse(x.created_at)))}</li>`; }).join('') : `<li>${E91(t('ci_none'))}</li>`;
  } catch (e) { html = `<li>${E91(t('ci_err'))}</li>`; }
  const l = $('#ci_list'); if (l) l.innerHTML = html;
}
function ciBox(){
  const dc = $('#dc_box'); if (!dc || !liveOwner()) { const o = $('#ci_box'); if (o) o.remove(); return; }
  if ($('#ci_box')) return;
  dc.insertAdjacentHTML('afterend', `<div class="bk-box" id="ci_box"><h4>🧪 ${E91(t('ci_title'))}</h4><p class="fine">${E91(t('ci_note'))}</p><ul class="ci-list" id="ci_list"><li>…</li></ul>
    <div class="bk-acts"><button type="button" class="lc-add" id="ci_go">▶️ ${E91(t('ci_go'))}</button><button type="button" class="lc-add" id="ci_ref">🔄 ${E91(t('ci_ref'))}</button></div></div>`);
  ciLoad();
}
const _dcR91 = dcRender;
dcRender = function(){ const r = _dcR91.apply(this, arguments); try { ciBox(); } catch (e) {} return r; };
document.addEventListener('click', async e => {
  if (!e.target.closest) return;
  if (e.target.closest('#ci_ref')) return ciLoad();
  if (!e.target.closest('#ci_go') || !liveOwner()) return;
  const tok = ghTok(); if (!tok) return toast(t('ci_tok'));
  try {
    const r = await fetch(CI_API + '/dispatches', {method: 'POST', headers: {Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json'}, body: JSON.stringify({ref: 'main'})});
    if (!r.ok) throw new Error('gh' + r.status);
    toast(t('ci_started')); setTimeout(ciLoad, 4000);
  } catch (er) { toast(t('ci_err')); }
});

/* for the automatic tests only (local copy) */
if (location.hostname === 'localhost') window.__fin91 = {phApply, insList, mcList, lcList, pcList, alList, bkMake, setTab: x => { tab = x; }};
