/* 13.24: across the app – simple mode, first-visit questions, senior mode, sanity checks, "since last time",
   share as an image, voice search, a weekly summary, opportunities and glossary pop-ups */
const uxE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function uxD(){ if (!SET.ux || typeof SET.ux !== 'object') SET.ux = {}; const d = SET.ux; if (!d.adv || typeof d.adv !== 'object') d.adv = {}; if (!d.last || typeof d.last !== 'object') d.last = {}; return d; }
let UX_ST = 0;
const uxSave = () => { clearTimeout(UX_ST); UX_ST = setTimeout(() => { try { saveSet(); } catch (e) {} }, 1500); };
const uxIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const uxToday = () => uxIso(new Date());
const uxNum = s => { try { return aiNum(s); } catch (e) { const x = parseFloat(String(s).replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : NaN; } };
(function uxCss(){
  if (document.getElementById('ux2css')) return;
  const s = document.createElement('style'); s.id = 'ux2css';
  s.textContent = `.inputs.ux-simple .field.ux-more{display:none!important}
.ux-more-btn{display:flex;align-items:center;gap:6px;margin:8px 0 2px;padding:8px 14px;border-radius:999px;border:1px dashed var(--line);background:transparent;color:var(--ink-2);font:inherit;font-size:.86rem;cursor:pointer}
.ux-more-btn:hover{color:var(--ink);border-style:solid}
.ux-sure{display:block;color:var(--warn,#b45309);font-size:.76rem;margin-top:3px}
.ux-chg{margin:0 0 10px;padding:9px 12px;border-radius:12px;background:color-mix(in srgb,var(--gold,#9A6A06) 12%,transparent);border:1px solid color-mix(in srgb,var(--gold,#9A6A06) 35%,transparent);font-size:.86rem}
.ux-card{margin:10px 0;padding:14px;border-radius:16px;border:1px solid var(--line);background:var(--card,var(--surface,transparent))}
.ux-card h3{margin:0 0 6px;font-size:1rem}.ux-card p{margin:4px 0;font-size:.88rem}
.ux-q{margin:10px 0 4px;font-size:.86rem;font-weight:600}.ux-opts{display:flex;flex-wrap:wrap;gap:6px}
.ux-opt{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;font-size:.84rem;cursor:pointer}
.ux-opt[aria-pressed=true]{background:var(--gold,#9A6A06);border-color:var(--gold,#9A6A06);color:#fff}
.ux-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.ux-wk ul{margin:6px 0;padding-inline-start:18px;font-size:.88rem}
.ux-wi{margin:6px 0 10px;padding:10px;border-radius:12px;border:1px solid var(--line)}
.ux-wi label{display:block;font-size:.84rem;margin-bottom:4px}.ux-wi input[type=range]{width:100%}
.ux-wi-out{font-size:.86rem;margin:4px 0}.ux-wi .mv{margin-top:4px}
.ux-gsrow{display:flex;gap:6px;align-items:center}.ux-gsrow #gs_q{flex:1;min-width:0}
.ux-mic{flex:0 0 auto;width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:transparent;font-size:1.2rem;cursor:pointer}
.ux-mic.on{background:var(--gold,#9A6A06);color:#fff;animation:uxPulse 1s infinite}
@keyframes uxPulse{50%{opacity:.6}}
.ux-gl{all:unset;cursor:help;border-bottom:1px dotted currentColor}.ux-gl:focus-visible{outline:2px solid var(--focus,#1F4FB8);outline-offset:2px}
.ux-pop{position:absolute;z-index:60;max-width:300px;padding:10px 12px;border-radius:12px;background:var(--surface,#fff);color:var(--ink);border:1px solid var(--line);box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:.86rem}
.ux-pop b{display:block;margin-bottom:4px}.ux-pop button{margin-top:6px}
html.ux-senior{font-size:118%}html.ux-senior #ai_fab,html.ux-senior .cx-d,html.ux-senior .scn,html.ux-senior #tchips{display:none!important}
html.ux-senior .tile{min-height:110px}
@media (prefers-reduced-motion:reduce){.ux-mic.on{animation:none}}`;
  document.head.appendChild(s);
})();

/* ---------- 1) simple mode: the main fields first, the rest under "more options" ---------- */
const UX_K = 4, UX_OPEN = {}, UX_DEF = {};
const UX_NOSIMPLE = ['mortgage', 'debtplan', 'convert', 'networth', 'smartsplit'];   /* their fields are one list (tracks, debts, assets) – hiding part of it would mislead */
function uxDefaults(id){
  if (UX_DEF[id]) return UX_DEF[id];
  const m = {}; (DEFS[id] || []).forEach(f => { if (f.id) m[f.id] = f.val; }); return (UX_DEF[id] = m);
}
function uxMark(id){
  const p = document.getElementById('panel-' + id); if (!p || !DEFS[id]) return;
  const inputs = p.querySelector('.inputs'), box = inputs && inputs.querySelector(':scope > .fields'); if (!box) return;
  let btn = inputs.querySelector(':scope > .ux-more-btn');
  const all = uxD().allFields === '1' && !uxSenior();
  const fields = [...box.children].filter(f => f.classList && f.classList.contains('field'));
  fields.forEach(f => f.classList.remove('ux-more'));
  if (all || UX_NOSIMPLE.includes(id)){ inputs.classList.remove('ux-simple'); if (btn) btn.remove(); return; }
  const dm = uxDefaults(id), vis = fields.filter(f => !f.hidden && !f.closest('[hidden]'));
  if (vis.length <= UX_K + 1){ inputs.classList.remove('ux-simple'); if (btn) btn.remove(); return; }
  let shown = 0, more = 0;
  vis.forEach(f => {
    const ctl = f.querySelector('input:not([type=hidden]),select');
    if (!ctl){ return; }                                  // custom blocks (offers, tables) always stay
    const dv = dm[ctl.id], changed = dv != null && String(dv) !== '' && String(ctl.value) !== String(dv);
    if (shown < UX_K){ shown++; return; }
    const u = f.querySelector('.u'), lab = (f.querySelector('label') || {}).textContent || '';
    if (changed || document.activeElement === ctl || (u && u.textContent.trim() === '%' && UX_RATE.test(lab)) || (u && (u.dataset.i === 'u_yrs' || u.dataset.i === 'u_months'))) return;   /* a rate or a period is always a main field */
    f.classList.add('ux-more'); more++;
  });
  if (more < 2){ fields.forEach(f => f.classList.remove('ux-more')); inputs.classList.remove('ux-simple'); if (btn) btn.remove(); return; }
  const open = !!(UX_OPEN[id] || uxD().adv[id]);
  inputs.classList.toggle('ux-simple', !open);
  if (!btn){ box.insertAdjacentHTML('afterend', `<button type="button" class="ux-more-btn" data-uxmore="${id}" aria-expanded="false"></button>`); btn = inputs.querySelector(':scope > .ux-more-btn'); }
  const txt = open ? t('ux_less') : t('ux_more', {n: more});
  if (btn.textContent !== txt) btn.textContent = txt;
  btn.setAttribute('aria-expanded', String(open));
}
function uxReveal(id){ UX_OPEN[id] = true; try { uxMark(id); } catch (e) {} }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-uxmore]'); if (!b) return;
  const id = b.dataset.uxmore, d = uxD(), open = !(UX_OPEN[id] || d.adv[id]);
  UX_OPEN[id] = open; d.adv[id] = open; if (!open) delete d.adv[id]; uxSave(); uxMark(id);
});
{ const uxCalc = calc; calc = function(id){ const r = uxCalc.apply(this, arguments); try { if (id === tab){ uxMark(id); uxSnap(id); } } catch (e) {} return r; }; }
{ const uxGs = gsGo; gsGo = function(n){ const e = (typeof GS_RES !== 'undefined' && GS_RES) ? GS_RES[n] : null; const r = uxGs.apply(this, arguments); try { if (e && e.type === 'field') uxReveal(e.id); } catch (er) {} return r; }; }
{ const uxAp = aiApply; aiApply = function(id){ const r = uxAp.apply(this, arguments); try { uxReveal(id); } catch (e) {} return r; }; }

/* ---------- 3) senior mode ---------- */
const uxSenior = () => uxD().senior === '1';
const UX_BASIC = ['salary', 'expenses', 'convert', 'retire', 'tax', 'loan', 'mortgage'];
function uxSeniorApply(){ document.documentElement.classList.toggle('ux-senior', uxSenior()); }
{ const uxRT = renderTiles; renderTiles = function(){
  const r = uxRT.apply(this, arguments);
  try { if (uxSenior()){ const box = document.getElementById('tiles'); if (box){ box.querySelectorAll('.tile').forEach(x => { if (!UX_BASIC.includes(x.dataset.go)) x.remove(); }); box.querySelectorAll('.tiles-h').forEach(h => { let n = h.nextElementSibling; if (!n || !n.classList.contains('tile')) h.remove(); }); } } } catch (e) {}
  return r;
}; }

/* ---------- 4) sanity check: an unrealistic value gets a quiet "are you sure?" ---------- */
const UX_RATE = /ריבית|תשואה|מדד|אינפלציה|דמי ניהול|עמלה|rate|return|yield|inflation|cpi|fee|فائدة|عائد|تضخم|مؤشر|رسوم|عمولة/i;
const UX_PAY = /שכר|משכורת|salary|wage|gross|راتب|أجر/i;
const UX_MONTHLY = /חודש|month|شهر/i;
let UX_SAN_T = 0;
function uxSanity(el){
  const f = el.closest('.field'); if (!f) return;
  let note = f.querySelector('.ux-sure');
  const v = parseFloat(String(el.value).replace(/[,\s₪%]/g, '')); if (!isFinite(v)){ if (note) note.remove(); return; }
  const u = f.querySelector('.u'), ut = u ? u.textContent.trim() : '', lab = (f.querySelector('label') || {}).textContent || '';
  const pct = ut === '%', money = u && (u.classList.contains('cur') || /₪|\$|€|£/.test(ut)), yrs = u && u.dataset.i === 'u_yrs';
  let bad = false;
  if (pct) bad = UX_RATE.test(lab) ? v > 40 : v > 100;
  else if (yrs) bad = v > 80;
  else if (money) bad = v > 50000000 || (UX_PAY.test(lab) && UX_MONTHLY.test(lab + ' ' + (f.querySelector('.hint') || {}).textContent) && v > 300000) || (UX_PAY.test(lab) && v > 300000 && !/שנ|year|سن/i.test(lab));
  if (bad && !note){ f.insertAdjacentHTML('beforeend', `<small class="ux-sure" role="status">${uxE(t('ux_sure'))}</small>`); }
  else if (!bad && note) note.remove();
}
document.addEventListener('input', e => {
  const el = e.target; if (!el || el.tagName !== 'INPUT' || !el.closest || !el.closest('.field .control')) return;
  const p = el.closest('section.panel'); if (!p || p.id !== 'panel-' + tab) return;
  clearTimeout(UX_SAN_T); UX_SAN_T = setTimeout(() => { try { uxSanity(el); } catch (er) {} }, 300);
});

/* ---------- 5) since last time: the official figures behind a calculator moved ---------- */
const UX_DEP = {boi: ['mortgage', 'prime', 'loan', 'refi', 'mortcap', 'loancmp', 'mortcmp'], cpi: ['inflation', 'cpilink', 'rentlaw'], fuel: ['fuelcalc', 'carcost', 'carvsbus']};
const uxMkt = () => ({boi: +MKT.boi, cpi: +MKT.cpi, fuel: typeof IL26 === 'object' ? +IL26.fuel95 : NaN});
const uxDeps = id => Object.keys(UX_DEP).filter(k => UX_DEP[k].includes(id));
const UX_PREV = {};
function uxSnap(id){
  if (!uxDeps(id).length || !LAST[id] || !LAST[id].hero) return;
  const m = uxMkt(), d = uxD(), old = d.last[id], hv = uxNum(LAST[id].hero.value);
  const rec = {d: uxToday(), boi: m.boi, cpi: m.cpi, fuel: m.fuel, v: isFinite(hv) ? hv : null};
  if (old && old.d === rec.d && old.boi === rec.boi && old.cpi === rec.cpi && old.fuel === rec.fuel && old.v === rec.v) return;
  d.last[id] = rec; uxSave();
}
function uxChgBanner(id){
  const p = document.getElementById('panel-' + id); if (!p) return;
  let b = document.getElementById('uxchg-' + id);
  const prev = UX_PREV[id], m = uxMkt(), msg = [];
  if (prev && prev.d && prev.d < uxToday()){
    const dl = (() => { try { return dLabel(prev.d); } catch (e) { return prev.d; } })();
    uxDeps(id).forEach(k => {
      const a = prev[k], c = m[k]; if (!isFinite(a) || !isFinite(c) || Math.abs(a - c) < (k === 'fuel' ? 0.01 : 0.05)) return;
      const up = c > a, dir = k === 'boi' ? t(up ? 'ux_upF' : 'ux_dnF') : t(up ? 'ux_upM' : 'ux_dnM');
      msg.push(t('ux_chg_' + k, {d: dl, dir, a: N(a, null, 2), b: N(c, null, 2)}));
    });
    if (msg.length && prev.v != null && LAST[id] && LAST[id].hero){ const hv = uxNum(LAST[id].hero.value); if (isFinite(hv) && Math.abs(hv - prev.v) >= 1) msg.push(t('ux_chgRes', {z: (hv > prev.v ? '+' : '−') + N(Math.abs(hv - prev.v), null, 0)})); }
  }
  if (!msg.length){ if (b) b.remove(); return; }
  if (!b){ const anchor = p.querySelector(':scope > .hero') || p.firstElementChild; (anchor || p).insertAdjacentHTML(anchor ? 'beforebegin' : 'afterbegin', `<p class="ux-chg" id="uxchg-${id}" role="status"></p>`); b = document.getElementById('uxchg-' + id); }
  b.textContent = '🔔 ' + msg.join(' · ');
}

/* ---------- 7) share the result as an image ---------- */
function uxImgChip(id){
  const ac = document.getElementById('ac-' + id); if (!ac || ac.querySelector('[data-uximg]')) return;
  ac.insertAdjacentHTML('beforeend', `<button type="button" class="chip" data-uximg="${id}" aria-label="${uxE(t('ux_imgA'))}">🖼️ ${uxE(t('ux_img'))}</button>`);
}
function uxCanvas(id){
  const r = LAST[id]; if (!r || !r.hero) return null;
  const rows = (r.rows || []).slice(0, 5).map(x => [exClean(x[0]), exClean(x[1])]).filter(x => x[0]);
  const W = 1080, pad = 70, H = 520 + rows.length * 74, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), rtl = lang !== 'en', font = '"Heebo","Assistant","Segoe UI",Arial,sans-serif';
  try { g.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
  const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#0f172a'); grd.addColorStop(1, '#1e293b'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = '#d4a73a'; g.fillRect(0, 0, W, 10);
  const X = rtl ? W - pad : pad, XE = rtl ? pad : W - pad;
  g.textAlign = rtl ? 'right' : 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#d4a73a'; g.font = `600 34px ${font}`; g.fillText(t('appTitle'), X, 90);
  g.fillStyle = '#e2e8f0'; g.font = `700 54px ${font}`; g.fillText(t('tab_' + id), X, 170, W - pad * 2);
  g.fillStyle = '#94a3b8'; g.font = `400 36px ${font}`; g.fillText(exClean(r.hero.label), X, 250, W - pad * 2);
  g.fillStyle = '#34d399'; g.font = `800 92px ${font}`; g.save(); try { g.direction = 'ltr'; } catch (e) {} g.textAlign = rtl ? 'right' : 'left'; g.fillText(exClean(r.hero.value), X, 350, W - pad * 2); g.restore();
  try { g.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
  let y = 440; g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
  rows.forEach(([a, b]) => {
    g.beginPath(); g.moveTo(pad, y - 50); g.lineTo(W - pad, y - 50); g.stroke();
    g.textAlign = rtl ? 'right' : 'left'; g.fillStyle = '#cbd5e1'; g.font = `400 34px ${font}`; g.fillText(a, X, y, W * 0.55);
    g.textAlign = rtl ? 'left' : 'right'; g.fillStyle = '#f8fafc'; g.font = `600 36px ${font}`; g.fillText(b, XE, y, W * 0.38);
    y += 74;
  });
  g.textAlign = 'center'; g.fillStyle = '#64748b'; g.font = `400 26px ${font}`;
  let ds = ''; try { ds = new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'short', year: 'numeric'}).format(new Date()); } catch (e) {}
  g.fillText(ds + ' · ' + t('ux_imgFoot'), W / 2, H - 40, W - pad * 2);
  return c;
}
async function uxShareImg(id){
  const c = uxCanvas(id); if (!c){ toast(t('ux_imgNone')); return; }
  const blob = await new Promise(res => c.toBlob(res, 'image/png')); if (!blob) return;
  const name = (id + '-' + uxToday()) + '.png';
  try { const file = new File([blob], name, {type: 'image/png'}); if (navigator.canShare && navigator.canShare({files: [file]}) && !IN_CLAUDE){ await navigator.share({files: [file], title: t('tab_' + id)}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await fileSave(blob, name, 'image/png'); } catch (e) {}
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-uximg]'); if (b){ e.preventDefault(); uxShareImg(b.dataset.uximg); } });

/* ---------- 8) voice search ---------- */
function uxMic(){
  const q = document.getElementById('gs_q'); if (!q || document.getElementById('ux_mic')) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  const row = document.createElement('div'); row.className = 'ux-gsrow'; q.parentNode.insertBefore(row, q); row.appendChild(q);
  row.insertAdjacentHTML('beforeend', `<button type="button" class="ux-mic" id="ux_mic" aria-label="${uxE(t('ux_mic'))}" title="${uxE(t('ux_mic'))}">🎤</button>`);
}
let UX_REC = null;
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#ux_mic'); if (!b) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  if (UX_REC){ try { UX_REC.stop(); } catch (er) {} return; }
  try {
    const r = new SR(); UX_REC = r; r.lang = lang === 'ar' ? 'ar-IL' : lang === 'en' ? 'en-US' : 'he-IL'; r.interimResults = false; r.maxAlternatives = 1;
    b.classList.add('on'); b.setAttribute('aria-label', t('ux_micListen'));
    r.onresult = ev => { const txt = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : ''; const q = document.getElementById('gs_q'); if (q && txt){ q.value = txt; q.dispatchEvent(new Event('input', {bubbles: true})); q.focus(); } };
    r.onerror = () => { toast(t('ux_micErr')); };
    r.onend = () => { UX_REC = null; b.classList.remove('on'); b.setAttribute('aria-label', t('ux_mic')); };
    r.start();
  } catch (er) { UX_REC = null; b.classList.remove('on'); toast(t('ux_micErr')); }
});
{ const uxGO = gsOpen; gsOpen = function(){ const r = uxGO.apply(this, arguments); try { uxMic(); } catch (e) {} return r; }; }

/* ---------- 2) first visit: five quick questions to arrange the screen ---------- */
const UX_Q = [['work', ['emp', 'self', 'both', 'none']], ['home', ['own', 'rent', 'fam']], ['kids', ['yes', 'no']], ['car', ['yes', 'no']], ['age', ['age1', 'age2', 'age3', 'age4']]];
let UX_ANS = {};
function uxOnbHTML(){
  return `<h3>${uxE(t('ux_onbT'))}</h3><p>${uxE(t('ux_onbP'))}</p>` + UX_Q.map(([q, opts]) => `<div class="ux-q" id="uxq_${q}">${uxE(t('ux_q_' + q))}</div><div class="ux-opts" role="group" aria-labelledby="uxq_${q}">${opts.map(o => `<button type="button" class="ux-opt" data-uxq="${q}" data-uxa="${o}" aria-pressed="${UX_ANS[q] === o}">${uxE(t('ux_a_' + (q === 'kids' || q === 'car' ? o : o)))}</button>`).join('')}</div>`).join('') +
    `<div class="ux-row"><button type="button" class="gold-btn" id="ux_onbGo">${uxE(t('ux_onbGo'))}</button><button type="button" class="mv" id="ux_onbSkip">${uxE(t('ux_onbSkip'))}</button></div>`;
}
function uxOnbShow(force){
  const hh = document.getElementById('hh'); if (!hh) return;
  let box = document.getElementById('uxonb');
  if (!force && uxD().onb){ if (box) box.remove(); return; }
  if (!box){ hh.insertAdjacentHTML('afterend', '<section id="uxonb" class="ux-card ux-onb" aria-labelledby="uxonb_t"></section>'); box = document.getElementById('uxonb'); }
  box.innerHTML = uxOnbHTML(); const h = box.querySelector('h3'); if (h) h.id = 'uxonb_t';
}
function uxOnbApply(){
  const a = UX_ANS, d = uxD(), pins = ['expenses'], hide = [];
  if (a.work === 'emp' || a.work === 'both') pins.push('salary', 'tax');
  if (a.work === 'self' || a.work === 'both') pins.push('selfemp', 'vat');
  if (a.work === 'emp' || a.work === 'none') hide.push('selfemp');
  if (a.home === 'own' || a.home === 'rent') pins.push('mortgage');
  if (a.kids === 'yes') pins.push('kidsave', 'household'); else if (a.kids === 'no') hide.push('kidsave');
  if (a.car === 'yes') pins.push('fuelcalc');
  if (a.age === 'age1') pins.push('compound', 'joboffer');
  if (a.age === 'age3') pins.push('retire', 'portfolio');
  if (a.age === 'age4'){ pins.push('retire'); if (a.work === 'none') hide.push('joboffer', 'leave'); }
  const keep = id => ['home', 'settings', 'assist', 'saved', 'markets'].includes(id) || (typeof NOHIDE !== 'undefined' && NOHIDE.includes(id));
  const lead = x => (typeof famLead === 'function' ? famLead(x) : x);
  const P = [...new Set(pins.map(lead))].filter(x => TABS.includes(x)), Hd = [...new Set(hide.map(lead))].filter(x => TABS.includes(x) && !keep(x) && !P.includes(x));
  if (!Array.isArray(SET.hidden)) SET.hidden = [];
  const before = Array.isArray(d.onbHid) ? d.onbHid : [];
  SET.hidden = SET.hidden.filter(x => !before.includes(x));
  Hd.forEach(x => { if (!SET.hidden.includes(x)) SET.hidden.push(x); });
  SET.pins = P; d.onbHid = Hd; d.onb = {a: Object.assign({}, a), at: uxToday()};
  try { saveSet(); } catch (e) {}
  try { renderNav(); $$('#nav [data-i]').forEach(e => { e.textContent = t(e.dataset.i); }); if (typeof navAcc === 'function') navAcc(); markNav(); renderTiles(); renderBottom(); renderTabsList(); } catch (e) {}
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if ((b = t0.closest('[data-uxq]'))){ UX_ANS[b.dataset.uxq] = b.dataset.uxa; b.parentNode.querySelectorAll('.ux-opt').forEach(x => x.setAttribute('aria-pressed', String(x === b))); return; }
  if (t0.closest('#ux_onbGo')){ uxOnbApply(); const box = document.getElementById('uxonb'); if (box){ box.innerHTML = `<p role="status">✅ ${uxE(t('ux_onbDone'))}</p>`; setTimeout(() => { const x = document.getElementById('uxonb'); if (x) x.remove(); }, 4000); } return; }
  if (t0.closest('#ux_onbSkip')){ uxD().onb = {skip: true, at: uxToday()}; try { saveSet(); } catch (er) {} const box = document.getElementById('uxonb'); if (box) box.remove(); return; }
  if (t0.closest('#ux_onbAgain')){ UX_ANS = Object.assign({}, (uxD().onb && uxD().onb.a) || {}); activate('home'); setTimeout(() => { uxOnbShow(true); const x = document.getElementById('uxonb'); if (x) x.scrollIntoView({block: 'start'}); }, 60); }
});

/* ---------- 9) the weekly summary on Home ---------- */
function uxWeekKey(){ const d = new Date(); d.setDate(d.getDate() - d.getDay()); return uxIso(d); }
function uxWeekly(){
  const hh = document.getElementById('hh'); if (!hh) return;
  let box = document.getElementById('uxwk'); const d = uxD(), wk = uxWeekKey();
  if (d.wkSeen === wk || !d.onb){ if (box) box.remove(); return; }
  const from = new Date(); from.setDate(from.getDate() - 7); const f = uxIso(from), to = uxToday();
  let items = []; try { items = expData().items.filter(x => x.date && x.date > f && x.date <= to && !x.rec); } catch (e) {}
  const spent = items.reduce((s, x) => s + (+x.amt || 0), 0), by = {}; items.forEach(x => { by[x.cat] = (by[x.cat] || 0) + (+x.amt || 0); });
  const top = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
  let rem = []; try { const end = new Date(); end.setDate(end.getDate() + 7); const e2 = uxIso(end); rem = rmD().items.filter(x => !x.done && x.date >= to && x.date <= e2); } catch (e) {}
  let tip = ''; try { const P = picData(); const tp = (P.tips || []).sort((a, b) => b.p - a.p)[0]; if (tp) tip = tp.h; } catch (e) {}
  if (!items.length && !rem.length && !tip){ if (box) box.remove(); return; }
  const M0 = x => M(Math.round(x), 0, 'ILS');
  const L = [items.length ? t('ux_wkSpent', {s: M0(spent)}) : t('ux_wkNone')];
  if (top) L.push(t('ux_wkTop', {c: t('ec_' + top), s: M0(by[top])}));
  L.push(rem.length ? t('ux_wkRem', {n: rem.length}) + ': ' + rem.slice(0, 3).map(x => x.title).join(', ') : t('ux_wkRemNone'));
  if (!box){ const anchor = document.getElementById('uxonb') || hh; anchor.insertAdjacentHTML('afterend', '<section id="uxwk" class="ux-card ux-wk" aria-labelledby="uxwk_t"></section>'); box = document.getElementById('uxwk'); }
  box.innerHTML = `<h3 id="uxwk_t">${uxE(t('ux_wkT'))}</h3><ul>${L.map(x => `<li>${uxE(x)}</li>`).join('')}</ul>${tip ? `<p>💡 ${uxE(tip)}</p>` : ''}<div class="ux-row"><button type="button" class="mv" data-go="expenses">🧾 ${uxE(t('tab_expenses'))}</button><button type="button" class="mv" id="ux_wkOk">${uxE(t('ux_wkOk'))}</button></div>`;
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#ux_wkOk')){ uxD().wkSeen = uxWeekKey(); try { saveSet(); } catch (er) {} const b = document.getElementById('uxwk'); if (b) b.remove(); } });

/* ---------- 10) opportunities (shown in Insights and as one line on Home) ---------- */
function uxOpps(){
  const L = [], d = uxD(), m = uxMkt(), M0 = x => M(Math.round(x), 0, 'ILS');
  try {
    const snaps = ['mortgage', 'refi', 'mortcmp', 'mortcap'].map(k => d.last[k]).filter(x => x && isFinite(x.boi));
    const old = snaps.length ? Math.max.apply(null, snaps.map(x => x.boi)) : NaN;
    if (isFinite(old) && isFinite(m.boi) && old - m.boi >= 0.25) L.push({k: 'refi', ic: '🏠', h: t('ux_oRefiH'), p: t('ux_oRefiP', {a: N(old, null, 2), b: N(m.boi, null, 2)}), go: 'refi', w: 90});
    const ls = ['loan', 'loancmp', 'prime'].map(k => d.last[k]).filter(x => x && isFinite(x.boi)), lo = ls.length ? Math.max.apply(null, ls.map(x => x.boi)) : NaN;
    if (isFinite(lo) && isFinite(m.boi) && lo - m.boi >= 0.25) L.push({k: 'loan', ic: '💳', h: t('ux_oLoanH'), p: t('ux_oRefiP', {a: N(lo, null, 2), b: N(m.boi, null, 2)}), go: 'prepay', w: 70});
  } catch (e) {}
  try { const S = pfD().sav.filter(x => miN(x.bal) > 0 && miN(x.fee) > 0.5 && (x.type === 'pension' || !x.type)); if (S.length){ const x = S.sort((a, b) => miN(b.fee) * miN(b.bal) - miN(a.fee) * miN(a.bal))[0]; L.push({k: 'fee', ic: '📉', h: t('ux_oFeeH'), p: t('ux_oFeeP', {f: N(miN(x.fee), null, 2), y: M0(miN(x.bal) * (miN(x.fee) - 0.22) / 100)}), go: MINI_IDS.includes('consol') ? 'consol' : 'mgmtfees', w: 80}); } } catch (e) {}
  try { const B = bkD(); let idle = 0; B.accs.filter(a => a.type === 'cur').forEach(a => { const bal = bkN(a.bal), out = Math.max(0, bkN(a.out)); idle += Math.max(0, bal - Math.max(out * (+B.buf || 3), 5000)); }); if (idle >= 10000) L.push({k: 'idle', ic: '💤', h: t('ux_oIdleH'), p: t('ux_oIdleP', {s: M0(idle)}), go: 'idlecash', w: 60}); } catch (e) {}
  try { const sp = miSpend(), em = SET.mini && SET.mini.emergency, have = em && em.have != null ? miN(em.have) : null; if (sp > 0 && (have == null ? true : have < sp * 3)) L.push({k: 'em', ic: '🛟', h: t(have == null ? 'ux_oEmH' : 'ux_oEmLowH'), p: t('ux_oEmP', {s: M0(sp * 3)}), go: 'emergency', w: 50}); } catch (e) {}
  try { const S = inSubsList().filter(s => inD().keep[s.k] !== 'gone'); if (S.length >= 3){ const tot = S.reduce((q, x) => q + x.amt, 0); L.push({k: 'subs', ic: '🔁', h: t('ux_oSubH', {n: S.length}), p: t('ux_oSubP', {s: M0(tot)}), go: 'renewals', w: 40}); } } catch (e) {}
  return L.filter(x => TABS.includes(x.go)).sort((a, b) => b.w - a.w);
}

/* ---------- 12) glossary pop-ups ---------- */
const UX_GL = ['prime', 'cpi', 'credit', 'fees', 'compound', 'landtax', 'hish', 'equity'];
function uxGlTerms(){
  const out = [];
  try { if (typeof glsTerms === 'function') (glsTerms() || []).forEach(x => { const term = typeof x === 'string' ? x : (x.term || x.t || x[0]); if (term) out.push({term: String(term), key: x.k || x.key || null}); }); } catch (e) {}
  UX_GL.forEach(k => { const term = t('ux_gt_' + k); if (term && !out.some(o => o.term === term)) out.push({term, k}); });
  return out.filter(o => o.term.length >= 3).sort((a, b) => b.term.length - a.term.length);
}
function uxGlDef(o){
  try { if (typeof glsDef === 'function'){ const r = glsDef(o.key || o.term); if (r) return typeof r === 'string' ? r : (r.d || r.def || r.text || ''); } } catch (e) {}
  return o.k ? t('ux_gd_' + o.k) : '';
}
function uxGlDecorate(el){
  if (!el || el.dataset.uxgl === lang + ':' + el.textContent.length) return;
  const terms = uxGlTerms(); if (!terms.length) return;
  const done = new Set();
  const walk = node => {
    if (node.nodeType === 3){
      let txt = node.nodeValue; const parts = []; let hit = false;
      for (const o of terms){
        if (done.has(o.term)) continue;
        const i = txt.indexOf(o.term); if (i < 0) continue;
        const def = uxGlDef(o); if (!def) continue;
        done.add(o.term); hit = true;
        const span = document.createElement('button'); span.type = 'button'; span.className = 'ux-gl'; span.textContent = o.term; span.dataset.gld = def; span.dataset.glt = o.term;
        parts.push([i, o.term.length, span]);
      }
      if (!hit) return;
      parts.sort((a, b) => a[0] - b[0]);
      const frag = document.createDocumentFragment(); let pos = 0;
      parts.forEach(([i, len, span]) => { if (i < pos) return; frag.appendChild(document.createTextNode(txt.slice(pos, i))); frag.appendChild(span); pos = i + len; });
      frag.appendChild(document.createTextNode(txt.slice(pos))); node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) [...node.childNodes].forEach(walk);
  };
  try { walk(el); } catch (e) {}
  el.dataset.uxgl = lang + ':' + el.textContent.length;
}
function uxGlClose(){ const p = document.getElementById('uxglp'); if (p) p.remove(); }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.ux-gl');
  if (b){
    e.preventDefault(); e.stopPropagation();
    const was = document.getElementById('uxglp'); if (was && was.dataset.for === b.dataset.glt){ uxGlClose(); return; } uxGlClose();
    const r = b.getBoundingClientRect(), hasG = TABS.includes('glossary');
    document.body.insertAdjacentHTML('beforeend', `<div class="ux-pop" id="uxglp" role="dialog" aria-label="${uxE(b.dataset.glt)}" data-for="${uxE(b.dataset.glt)}"><b>${uxE(b.dataset.glt)}</b><span>${uxE(b.dataset.gld)}</span>${hasG ? `<br><button type="button" class="lg-a" id="uxglgo">📖 ${uxE(t('ux_glGo'))}</button>` : ''}</div>`);
    const p = document.getElementById('uxglp'), w = Math.min(300, window.innerWidth - 24);
    let x = r.left + window.scrollX; if (x + w > window.scrollX + window.innerWidth - 12) x = window.scrollX + window.innerWidth - 12 - w; if (x < window.scrollX + 12) x = window.scrollX + 12;
    p.style.left = x + 'px'; p.style.top = (r.bottom + window.scrollY + 6) + 'px'; p.style.maxWidth = w + 'px';
    const go = document.getElementById('uxglgo'); if (go){ go.onclick = () => { uxGlClose(); activate('glossary'); }; go.focus({preventScroll: true}); }
    return;
  }
  if (!(e.target.closest && e.target.closest('#uxglp'))) uxGlClose();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') uxGlClose(); });
function uxGlRun(){ try { uxGlDecorate(document.getElementById('page-desc')); const nt = document.getElementById('nt-' + tab); if (nt && !nt.hidden) uxGlDecorate(nt); } catch (e) {} }
{ const uxUH = updateHead; updateHead = function(){ const r = uxUH.apply(this, arguments); try { const pd = document.getElementById('page-desc'); if (pd) delete pd.dataset.uxgl; setTimeout(uxGlRun, 0); } catch (e) {} return r; }; }

/* ---------- settings: a small section ---------- */
function uxSettings(){
  const ps = document.getElementById('panel-settings'); if (!ps || document.getElementById('ux_sec')) return;
  const before = ps.querySelector('[data-sk="set_tabs"]'); if (!before) return;
  const sel = (id, k, h) => `<div class="field wide"><label for="${id}" data-i="${k}"></label><select id="${id}"><option value="0" data-i="o_off"></option><option value="1" data-i="o_on"></option></select>${h ? `<small class="hint" data-i="${h}"></small>` : ''}</div>`;
  before.insertAdjacentHTML('beforebegin', `<div class="set-sec" data-sk="ux_set" id="ux_sec"><div class="sec-h"><h3 class="sec-t" data-i="ux_set"></h3></div><div class="fields">${sel('ux_allf', 'ux_allF', 'ux_allFh')}${sel('ux_sen', 'ux_senior', 'ux_seniorH')}${uxNeedLast ? sel('ux_last', 'ux_lastT', 'ux_lastH') : ''}</div><div class="btnrow"><button type="button" class="btn" id="ux_onbAgain" data-i="ux_onbAgain"></button></div></div>`);
  const sec = document.getElementById('ux_sec'); sec.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
  uxSettingsSync();
}
function uxSettingsSync(){ const d = uxD(), s = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; }; s('ux_allf', d.allFields === '1' ? '1' : '0'); s('ux_sen', d.senior === '1' ? '1' : '0'); s('ux_last', d.lastTab === '1' ? '1' : '0'); }
document.addEventListener('change', e => {
  const id = e.target && e.target.id; if (!['ux_allf', 'ux_sen', 'ux_last'].includes(id)) return;
  const d = uxD(), v = e.target.value === '1' ? '1' : '';
  if (id === 'ux_allf') d.allFields = v; else if (id === 'ux_sen'){ d.senior = v; uxSeniorApply(); try { renderTiles(); } catch (er) {} } else d.lastTab = v;
  try { saveSet(); } catch (er) {} toast(t('ux_saved'));
});

/* ---------- 13) open the last calculator on launch (only if the app doesn't already) ---------- */
let uxNeedLast = true;   /* the app opens on Home; this optional setting reopens the last screen */

/* ---------- wiring ---------- */
{ const uxAct = activate; activate = function(id){
  const d = uxD(); UX_PREV[id] = d.last[id] ? Object.assign({}, d.last[id]) : null;
  if (id !== 'home' && id !== 'settings' && d.lt !== id){ d.lt = id; uxSave(); }
  const r = uxAct.apply(this, arguments);
  try { uxMark(id); uxImgChip(id); uxChgBanner(id); uxSnap(id); } catch (e) {}
  try { if (id === 'home'){ uxOnbShow(); uxWeekly(); } } catch (e) {}
  uxGlClose();
  return r;
}; }
{ const uxAL = applyLang; applyLang = function(){ const r = uxAL.apply(this, arguments); try { uxMark(tab); if (document.getElementById('uxonb')) uxOnbShow(true); uxWeekly(); const b = document.querySelector('[data-uximg]'); document.querySelectorAll('[data-uximg]').forEach(x => { x.innerHTML = '🖼️ ' + uxE(t('ux_img')); x.setAttribute('aria-label', t('ux_imgA')); }); const sec = document.getElementById('ux_sec'); if (sec) sec.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); }); uxGlRun(); } catch (e) {} return r; }; }
setTimeout(() => {
  try { uxSeniorApply(); uxSettings(); if (uxSenior()) renderTiles(); } catch (e) {}
  try { const d = uxD(); if (d.lastTab === '1' && d.lt && TABS.includes(d.lt) && tab === 'home' && !/[?&]go=/.test(location.search)) activate(d.lt); } catch (e) {}
  try { UX_PREV[tab] = UX_PREV[tab] || (uxD().last[tab] ? Object.assign({}, uxD().last[tab]) : null); uxMark(tab); uxImgChip(tab); uxChgBanner(tab); uxSnap(tab); if (tab === 'home'){ uxOnbShow(); uxWeekly(); } uxGlRun(); } catch (e) {}
}, 0);

Object.assign(T, {
  ux_more:['⚙️ עוד אפשרויות ({n})','⚙️ خيارات أخرى ({n})','⚙️ More options ({n})'], ux_less:['⚙️ פחות אפשרויות','⚙️ خيارات أقل','⚙️ Fewer options'],
  ux_set:['תצוגה ופשטות','العرض والبساطة','Display & simplicity'],
  ux_allF:['להציג תמיד את כל השדות','عرض كل الحقول دائمًا','Always show all fields'], ux_allFh:['כבוי: בכל מחשבון רואים קודם את השדות העיקריים, והשאר נפתח ב"עוד אפשרויות". שדה ששיניתם תמיד נשאר גלוי.','مطفأ: في كل حاسبة تظهر الحقول الرئيسية أولًا، والباقي تحت "خيارات أخرى". الحقل الذي غيّرتموه يبقى ظاهرًا دائمًا.','Off: each calculator shows the main fields first and the rest under "More options". A field you changed always stays visible.'],
  ux_senior:['מצב מבוגרים – טקסט גדול ומסך פשוט','وضع كبار السن – نص كبير وشاشة بسيطة','Senior mode – larger text, simpler screen'], ux_seniorH:['טקסט גדול יותר, בלי כפתורים מתקדמים, ובדף הבית רק המחשבונים הבסיסיים.','نص أكبر، بلا أزرار متقدمة، وفي الرئيسية الحاسبات الأساسية فقط.','Larger text, no advanced buttons, and only the basic calculators on Home.'],
  ux_lastT:['פתיחה במחשבון האחרון','الفتح على آخر حاسبة','Open the last calculator'], ux_lastH:['כשפותחים את האפליקציה – חוזרים למסך האחרון שהיה פתוח.','عند فتح التطبيق – العودة لآخر شاشة كانت مفتوحة.','When the app opens, go back to the last screen you used.'],
  ux_onbAgain:['שאלות היכרות מחדש','أسئلة التعارف من جديد','Ask the setup questions again'], ux_saved:['נשמר','تم الحفظ','Saved'],
  ux_onbT:['👋 נכיר בקצרה?','👋 نتعارف بسرعة؟','👋 A quick intro?'], ux_onbP:['5 שאלות קצרות, ונסדר את המסך לפי מה שרלוונטי לכם. אפשר לשנות הכול אחר כך בהגדרות.','5 أسئلة قصيرة، ونرتّب الشاشة حسب ما يهمكم. يمكن تغيير كل شيء لاحقًا في الإعدادات.','5 quick questions and we\'ll arrange the screen around what matters to you. You can change everything later in settings.'],
  ux_q_work:['במה אתם עובדים?','ما طبيعة عملكم؟','How do you work?'], ux_q_home:['איפה אתם גרים?','أين تسكنون؟','Where do you live?'], ux_q_kids:['יש ילדים?','هل لديكم أولاد؟','Any children?'], ux_q_car:['יש רכב?','هل لديكم سيارة؟','Do you have a car?'], ux_q_age:['גיל','العمر','Age'],
  ux_a_emp:['שכיר/ה','موظف/ة','Employee'], ux_a_self:['עצמאי/ת','مستقل/ة','Self-employed'], ux_a_both:['גם וגם','الاثنان','Both'], ux_a_none:['לא עובד/ת כרגע','لا أعمل حاليًا','Not working now'],
  ux_a_own:['בדירה שלנו','في شقتنا','In our own home'], ux_a_rent:['בשכירות','بالإيجار','Renting'], ux_a_fam:['אצל המשפחה','عند العائلة','With family'],
  ux_a_yes:['כן','نعم','Yes'], ux_a_no:['לא','لا','No'],
  ux_a_age1:['עד 30','حتى 30','Under 30'], ux_a_age2:['30–50','30–50','30–50'], ux_a_age3:['50–67','50–67','50–67'], ux_a_age4:['67+','67+','67+'],
  ux_onbGo:['סדרו לי את המסך','رتّبوا لي الشاشة','Arrange my screen'], ux_onbSkip:['אולי אחר כך','ربما لاحقًا','Maybe later'], ux_onbDone:['המסך סודר לפי התשובות. אפשר לשנות בכל רגע בהגדרות.','تم ترتيب الشاشة حسب الإجابات. يمكن التغيير في أي وقت من الإعدادات.','Your screen is arranged. You can change it any time in settings.'],
  ux_sure:['בטוח? הערך נראה גבוה מאוד.','متأكد؟ القيمة تبدو مرتفعة جدًا.','Sure? That value looks very high.'],
  ux_upF:['עלתה','ارتفعت','went up'], ux_dnF:['ירדה','انخفضت','went down'], ux_upM:['עלה','ارتفع','went up'], ux_dnM:['ירד','انخفض','went down'],
  ux_chg_boi:['מאז הפעם הקודמת ({d}) ריבית בנק ישראל {dir} מ־{a}% ל־{b}%','منذ المرة السابقة ({d}) فائدة بنك إسرائيل {dir} من {a}% إلى {b}%','Since last time ({d}) the Bank of Israel rate {dir} from {a}% to {b}%'],
  ux_chg_cpi:['מאז הפעם הקודמת ({d}) המדד השנתי {dir} מ־{a}% ל־{b}%','منذ المرة السابقة ({d}) المؤشر السنوي {dir} من {a}% إلى {b}%','Since last time ({d}) yearly inflation {dir} from {a}% to {b}%'],
  ux_chg_fuel:['מאז הפעם הקודמת ({d}) מחיר הדלק {dir} מ־{a} ל־{b} ₪ לליטר','منذ المرة السابقة ({d}) سعر الوقود {dir} من {a} إلى {b} ₪ للتر','Since last time ({d}) the fuel price {dir} from {a} to {b} ₪ a litre'],
  ux_chgRes:['התוצאה השתנתה ב־{z}','تغيّرت النتيجة بـ {z}','the result changed by {z}'],
  ux_img:['תמונה','صورة','Image'], ux_imgA:['שיתוף התוצאה כתמונה','مشاركة النتيجة كصورة','Share the result as an image'], ux_imgFoot:['מידע כללי בלבד','معلومات عامة فقط','General information only'], ux_imgNone:['אין עדיין תוצאה לשתף.','لا توجد نتيجة للمشاركة بعد.','No result to share yet.'],
  ux_mic:['חיפוש בקול','البحث بالصوت','Search by voice'], ux_micListen:['מקשיב…','أستمع…','Listening…'], ux_micErr:['לא הצלחתי לשמוע. נסו שוב.','لم أتمكن من السماع. حاولوا مجددًا.','Couldn\'t hear that. Try again.'],
  ux_wkT:['🗓️ הסיכום השבועי שלכם','🗓️ ملخصكم الأسبوعي','🗓️ Your weekly summary'], ux_wkSpent:['ב־7 הימים האחרונים הוצאתם {s}','في آخر 7 أيام صرفتم {s}','In the last 7 days you spent {s}'], ux_wkNone:['השבוע לא נרשמו הוצאות.','لم تُسجَّل مصاريف هذا الأسبوع.','No spending logged this week.'],
  ux_wkTop:['הכי הרבה על {c} ({s})','الأكثر على {c} ({s})','Most on {c} ({s})'], ux_wkRem:['{n} תזכורות בשבוע הקרוב','{n} تذكيرات في الأسبوع القادم','{n} reminders in the coming week'], ux_wkRemNone:['אין תזכורות בשבוע הקרוב','لا تذكيرات في الأسبوع القادم','No reminders in the coming week'], ux_wkOk:['הבנתי','فهمت','Got it'],
  in_t_opp:['שווה לבדוק','يستحق الفحص','Worth checking'], ux_oppIntro:['דברים שהאפליקציה שמה לב אליהם לפי הנתונים שלכם – כל אחד עם קיצור למחשבון המתאים.','أمور لاحظها التطبيق من بياناتكم – كل منها مع اختصار للحاسبة المناسبة.','Things the app noticed from your data – each with a shortcut to the right calculator.'],
  ux_oppNone:['כרגע אין משהו דחוף לבדוק 👌','لا يوجد حاليًا شيء عاجل للفحص 👌','Nothing urgent to check right now 👌'], ux_oppGo:['לבדיקה','للفحص','Check it'],
  ux_oRefiH:['הריבית ירדה מאז שחישבתם משכנתא','انخفضت الفائدة منذ حسبتم الرهن','Rates fell since you calculated your mortgage'], ux_oRefiP:['ריבית בנק ישראל ירדה מ־{a}% ל־{b}%. אולי שווה לבדוק מחזור.','فائدة بنك إسرائيل انخفضت من {a}% إلى {b}%. ربما يستحق فحص إعادة التمويل.','The Bank of Israel rate fell from {a}% to {b}%. Refinancing may be worth a look.'],
  ux_oLoanH:['הריבית ירדה מאז שחישבתם הלוואה','انخفضت الفائدة منذ حسبتم القرض','Rates fell since you calculated a loan'],
  ux_oFeeH:['דמי ניהול גבוהים בפנסיה','رسوم إدارة مرتفعة في التقاعد','High pension fees'], ux_oFeeP:['דמי הניהול מהצבירה {f}% – גבוהים מהמקובל. מעבר או ריכוז יכולים לחסוך בערך {y} בשנה.','رسوم الإدارة من المتراكم {f}% – أعلى من المعتاد. الانتقال أو الدمج قد يوفر نحو {y} سنويًا.','Fees on balance are {f}% – above typical. Switching or merging could save about {y} a year.'],
  ux_oIdleH:['כסף שוכב בעו״ש','مال راكد في الحساب الجاري','Money sitting in checking'], ux_oIdleP:['בערך {s} בעו״ש מעבר לצורך השוטף – אפשר להרוויח עליהם ריבית.','نحو {s} في الجاري فوق الحاجة الجارية – يمكن أن يربح فائدة.','About {s} in checking beyond everyday needs – it could be earning interest.'],
  ux_oEmH:['אין עדיין קרן חירום','لا يوجد صندوق طوارئ بعد','No emergency fund yet'], ux_oEmLowH:['קרן החירום קטנה','صندوق الطوارئ صغير','Your emergency fund is small'], ux_oEmP:['כדאי שיהיו בצד לפחות 3 חודשי הוצאות – בערך {s}.','يُستحسن أن يكون جانبًا 3 أشهر مصاريف على الأقل – نحو {s}.','Aim for at least 3 months of spending aside – about {s}.'],
  ux_oSubH:['{n} חיובים קבועים','{n} مدفوعات ثابتة','{n} regular charges'], ux_oSubP:['ביחד {s} בחודש. כדאי לבדוק מחיר לפני שעוברת שנה מההצטרפות.','معًا {s} شهريًا. يُستحسن فحص السعر قبل مرور سنة على الاشتراك.','Together {s} a month. Check prices before a year from joining.'],
  ux_bAd:['מבוגרים בבית','البالغون في البيت','Adults at home'], ux_bKid:['ילדים','أولاد','Children'], ux_bScaled:['הממוצע הותאם לגודל משק הבית שלכם לפי סולם שקילות מקובל – הערכה בלבד.','تمت ملاءمة المعدل لحجم أسرتكم وفق سلّم تكافؤ متبع – تقدير فقط.','The average is adjusted to your household size with a standard equivalence scale – an estimate only.'],
  ux_wiT:['מה אם "{f}" ישתנה?','ماذا لو تغيّر "{f}"؟','What if "{f}" changes?'], ux_wiNow:['הזיזו כדי לראות את ההשפעה','حرّكوا لرؤية التأثير','Slide to see the effect'], ux_wiApply:['להחיל את הערך','تطبيق القيمة','Apply this value'],
  ux_wiRes:['{f} {v} ({p}) ← {h}: {r} ({d})','{f} {v} ({p}) ← {h}: {r} ({d})','{f} {v} ({p}) → {h}: {r} ({d})'],
  ux_glGo:['למילון המונחים','إلى قاموس المصطلحات','Open the glossary'],
  ux_gt_prime:['פריים','البرايم','prime'], ux_gd_prime:['ריבית בנק ישראל ועוד 1.5%. ההלוואות והמשכנתאות במסלול פריים זזות איתה.','فائدة بنك إسرائيل زائد 1.5%. القروض والرهون بمسار البرايم تتحرك معها.','The Bank of Israel rate plus 1.5%. Prime-linked loans and mortgages move with it.'],
  ux_gt_cpi:['מדד','المؤشر','index'], ux_gd_cpi:['מדד המחירים לצרכן – כמה המחירים עלו. הלוואה "צמודה למדד" גדלה כשהמדד עולה.','مؤشر أسعار المستهلك – كم ارتفعت الأسعار. القرض "المرتبط بالمؤشر" يكبر عندما يرتفع المؤشر.','The consumer price index – how much prices rose. An "index-linked" loan grows when it rises.'],
  ux_gt_credit:['נקודות זיכוי','نقاط الإعفاء','credit points'], ux_gd_credit:['הנחה ממס הכנסה. כל נקודה שווה 242 ₪ בחודש ב־2026.','خصم من ضريبة الدخل. كل نقطة تساوي 242 ₪ شهريًا في 2026.','A discount on income tax. Each point is worth ₪242 a month in 2026.'],
  ux_gt_fees:['דמי ניהול','رسوم الإدارة','management fees'], ux_gd_fees:['מה שהקופה גובה כל שנה – מההפקדות ומהצבירה. גם הבדל קטן מצטבר להרבה כסף.','ما يقتطعه الصندوق كل سنة – من الإيداعات ومن المتراكم. حتى فرق صغير يتراكم لمبلغ كبير.','What the fund charges each year – on deposits and on the balance. Even a small difference adds up.'],
  ux_gt_compound:['ריבית דריבית','الفائدة المركبة','compound interest'], ux_gd_compound:['ריבית שמרוויחה ריבית: הרווח נשאר בפנים וממשיך לגדול.','فائدة تربح فائدة: الربح يبقى ويستمر في النمو.','Interest earning interest: the gain stays in and keeps growing.'],
  ux_gt_landtax:['מס שבח','ضريبة الشبح','betterment tax'], ux_gd_landtax:['מס על הרווח במכירת דירה. דירה יחידה פטורה בדרך כלל בתנאים.','ضريبة على الربح من بيع شقة. الشقة الوحيدة معفاة عادة بشروط.','Tax on the gain from selling a home. A single home is usually exempt under conditions.'],
  ux_gt_hish:['קרן השתלמות','صندوق الاستكمال','study fund'], ux_gd_hish:['חיסכון לטווח בינוני עם הטבת מס. אפשר למשוך בלי מס אחרי 6 שנים.','ادخار متوسط المدى مع إعفاء ضريبي. يمكن السحب بلا ضريبة بعد 6 سنوات.','Medium-term savings with a tax benefit. Tax-free withdrawal after 6 years.'],
  ux_gt_equity:['הון עצמי','رأس المال الذاتي','down payment'], ux_gd_equity:['הכסף שלכם בקניית דירה, בלי המשכנתא. לדירה ראשונה צריך לפחות 25% ממחיר הדירה.','مالكم عند شراء شقة دون الرهن. للشقة الأولى يلزم 25% على الأقل من السعر.','Your own money in a home purchase, without the mortgage. A first home needs at least 25% of the price.'],
});
