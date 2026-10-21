/* 13.24: engine for the small calculators inside the topics.
   A tool is registered with miniDef(id, {fields, calc, intro, disc, render}).
   - fields: [{k, t: label text key, type: 'num'|'sel'|'chk'|'date'|'text', def: value or () => value, u: unit text ('₪', '%', or a text key), opts: [[value, text key]], h: hint text key, show: v => bool}]
   - calc(v) returns {hero: {l, v, sub}, rows: [[label, value, cls]], bars: [{l, v, max, txt}], note, warn, tips: [], links: [{t, url}], acts: [{t, fn}]} – all labels already translated
   - render(root, api) replaces the standard form for tools that are lists or guides; api = {d, save, redraw, E}
   - intro / disc: text keys shown above the form / at the bottom (disc for "not advice" notes) */
const MINI = {};
function miniDef(id, def){ MINI[id] = def; }
const miE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const miN = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪%]/g, '')); return isFinite(x) ? x : 0; };
const MI0 = x => M(Math.round(isFinite(x) ? x : 0), 0, 'ILS');
const MIP = (x, d) => N(isFinite(x) ? x : 0, null, d == null ? 1 : d) + '%';
const MIn = (x, d) => N(isFinite(x) ? x : 0, null, d == null ? 0 : d);
/* a payment over n months at a yearly rate (%) */
const miPmt = (P, ratePct, n) => { const r = ratePct / 1200; if (!n) return 0; return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; };
/* future value of a monthly deposit and a starting balance */
const miFV = (start, monthly, ratePct, months) => { const r = ratePct / 1200; let b = start; for (let i = 0; i < months; i++) b = b * (1 + r) + monthly; return b; };
/* the app's own data, for sensible defaults */
const miIncome = () => { try { const ym = ymOf(new Date()); return +expIncome(ym) || +expIncome(ymAdd(ym, -1)) || 0; } catch (e) { return 0; } };
const miSpend = () => { try { const ym = ymOf(new Date()), a = expTotals(ymAdd(ym, -1)).sum || 0, b = expTotals(ymAdd(ym, -2)).sum || 0, c = expTotals(ymAdd(ym, -3)).sum || 0, L = [a, b, c].filter(x => x > 0); return L.length ? L.reduce((s, x) => s + x, 0) / L.length : (expTotals(ym).sum || 0); } catch (e) { return 0; } };
function miD(id){ if (!SET.mini || typeof SET.mini !== 'object') SET.mini = {}; if (!SET.mini[id] || typeof SET.mini[id] !== 'object') SET.mini[id] = {}; return SET.mini[id]; }
const miDef = f => { try { return typeof f.def === 'function' ? f.def() : f.def; } catch (e) { return f.type === 'num' ? 0 : ''; } };
function miVals(id){
  const def = MINI[id], d = miD(id), v = {};
  (def.fields || []).forEach(f => {
    const raw = d[f.k], dv = miDef(f);
    v[f.k] = f.type === 'chk' ? (raw == null ? !!dv : !!raw) : f.type === 'num' ? (raw == null || raw === '' ? miN(dv) : miN(raw)) : (raw == null ? (dv == null ? '' : dv) : raw);
  });
  return v;
}
const miUnit = u => !u ? '' : (u === '₪' || u === '%' || u === '$') ? u : t(u);
function miField(id, f, v){
  const d = miD(id), E = miE, lab = t(f.t), u = miUnit(f.u), val = d[f.k] != null ? d[f.k] : miDef(f);
  let inner;
  if (f.type === 'sel') inner = `<select data-mi="${f.k}">${f.opts.map(([o, k]) => `<option value="${E(o)}"${String(v[f.k]) === String(o) ? ' selected' : ''}>${E(t(k))}</option>`).join('')}</select>`;
  else if (f.type === 'chk') return `<label class="mi-chk" data-mik="${f.k}"><input type="checkbox" data-mi="${f.k}"${v[f.k] ? ' checked' : ''}> <span>${E(lab)}</span>${f.h ? `<small class="fine">${E(t(f.h))}</small>` : ''}</label>`;
  else if (f.type === 'date') inner = `<input type="date" data-mi="${f.k}" value="${E(val || '')}">`;
  else if (f.type === 'text') inner = `<input type="text" data-mi="${f.k}" value="${E(val == null ? '' : val)}"${f.ph ? ` placeholder="${E(t(f.ph))}"` : ''}>`;
  else inner = `<input type="text" inputmode="decimal" dir="ltr" data-mi="${f.k}" value="${E(val == null || val === '' ? '' : val)}">`;
  return `<label class="bk-f mi-f" data-mik="${f.k}"><span>${E(lab)}${u ? ` (${E(u)})` : ''}</span>${inner}${f.h ? `<small class="fine">${E(t(f.h))}</small>` : ''}</label>`;
}
let MIA = [];
function miOut(id){
  const box = document.getElementById('mio_' + id), def = MINI[id]; if (!box || !def.calc) return;
  const v = miVals(id), E = miE; let o;
  try { o = def.calc(v) || {}; } catch (e) { o = {warn: t('mi_err')}; }
  MIA = [];
  (def.fields || []).forEach(f => { if (!f.show) return; const el = box.parentNode.querySelector(`[data-mik="${f.k}"]`); if (el) el.hidden = !f.show(v); });
  const max = o.bars && o.bars.length ? Math.max.apply(null, o.bars.map(b => Math.abs(b.max != null ? b.max : b.v))) || 1 : 1;
  box.innerHTML = (o.hero ? `<div class="hero mi-hero"><span class="hero-label">${E(o.hero.l)}</span><span class="hero-value num">${E(o.hero.v)}</span>${o.hero.sub ? `<div class="hero-sub">${E(o.hero.sub)}</div>` : ''}</div>` : '') +
    (o.warn ? `<p class="rm-w mi-warn">⚠️ ${E(o.warn)}</p>` : '') +
    (o.rows && o.rows.length ? `<dl class="ledger mi-led">${o.rows.map(r => `<div class="row${r[2] ? ' ' + r[2] : ''}"><dt>${E(r[0])}</dt><dd class="num">${E(r[1])}</dd></div>`).join('')}</dl>` : '') +
    (o.bars && o.bars.length ? `<ul class="cx-sens mi-bars">${o.bars.map(b => `<li><span class="cx-l">${E(b.l)}</span><span class="cx-bar"><i class="${b.dn ? 'dn' : 'up'}" style="width:${Math.max(3, Math.round(Math.abs(b.v) / max * 100))}%"></i></span><bdi dir="ltr" class="num cx-v">${E(b.txt != null ? b.txt : MI0(b.v))}</bdi></li>`).join('')}</ul>` : '') +
    (o.tips && o.tips.length ? `<ul class="mi-tips">${o.tips.map(x => `<li>${E(x)}</li>`).join('')}</ul>` : '') +
    (o.note ? `<p class="fine">${E(o.note)}</p>` : '') +
    (o.links && o.links.length ? `<p class="mi-links">${o.links.map(l => `<a class="src-a" href="${E(l.url)}" target="_blank" rel="noopener noreferrer">${E(l.t)} ↗</a>`).join(' ')}</p>` : '') +
    (o.acts && o.acts.length ? `<div class="btnrow mi-acts">${o.acts.map(a => { MIA.push(a.fn); return `<button type="button" class="mv" data-mia="${MIA.length - 1}">${E(a.t)}</button>`; }).join('')}</div>` : '');
  MINI_LAST[id] = o;
}
const MINI_LAST = {};
function miRender(id){
  const root = document.getElementById('hr_' + id), def = MINI[id]; if (!root || !def) return;
  const E = miE; const pn = document.getElementById('panel-' + id); if (pn) pn.classList.add('mini-panel');
  if (def.render){
    const api = {d: miD(id), save: () => saveSet(), redraw: () => miRender(id), E, id};
    root.innerHTML = (def.intro ? `<p class="fine mi-intro">${E(t(def.intro))}</p>` : '') + '<div class="mi-body"></div>' + (def.disc ? `<p class="fine mi-disc">${E(t(def.disc))}</p>` : '');
    try { def.render(root.querySelector('.mi-body'), api); } catch (e) { root.querySelector('.mi-body').innerHTML = `<p class="rm-w">${E(t('mi_err'))}</p>`; }
    return;
  }
  const v = miVals(id);
  root.innerHTML = (def.intro ? `<p class="fine mi-intro">${E(t(def.intro))}</p>` : '') +
    `<div class="mi-card"><div class="bk-grid mi-grid">${(def.fields || []).map(f => miField(id, f, v)).join('')}</div></div>` +
    `<div class="mi-out" id="mio_${id}" aria-live="polite"></div>` +
    (def.disc ? `<p class="fine mi-disc">${E(t(def.disc))}</p>` : '');
  miOut(id);
}
let MI_T = 0;
function miInput(e){
  const el = e.target; if (!el || !el.dataset || el.dataset.mi == null || !el.closest) return;
  const host = el.closest('[id^="hr_"]'); if (!host) return;
  const id = host.id.slice(3); if (!MINI[id] || MINI[id].render) return;
  const d = miD(id); d[el.dataset.mi] = el.type === 'checkbox' ? el.checked : el.value;
  miOut(id); clearTimeout(MI_T); MI_T = setTimeout(() => { try { saveSet(); } catch (er) {} }, 500);
}
document.addEventListener('input', miInput);
document.addEventListener('change', e => { const el = e.target; if (el && (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date')) miInput(e); });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-mia]'); if (b && MIA[+b.dataset.mia]) try { MIA[+b.dataset.mia](); } catch (er) {} });
/* the screen's reset button clears the tool's values */
document.addEventListener('click', e => { if (!e.target.closest || !e.target.closest('#resetTab') || !miIs(tab)) return; e.preventDefault(); e.stopImmediatePropagation();
  if (MINI[tab].render && !MINI[tab].resettable) return; SET.mini[tab] = {}; saveSet(); miRender(tab); toast(t('mi_reset')); }, true);
/* a reminder from a tool */
function miRemind(title, dateIso, note, amt){ try { rmNew({title, date: dateIso, note: note || '', amt: amt || ''}); } catch (e) { toast(t('mi_err')); } }
/* add a reminder directly (no form); skips one that already exists with the same title and date. cat: car, home, tax, bills, insur, docs, money, family, other; rep: none, month, year */
function miRemAdd(rec){
  try { const d = rmD(); if (d.items.some(x => x.title === rec.title && x.date === rec.date)) return false;
    d.items.push(Object.assign({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), done: false, at: Date.now(), time: '', rep: 'none', before: 3, cat: 'other', note: '', amt: ''}, rec)); saveSet(); try { rmHome(); } catch (e) {} return true; } catch (e) { return false; }
}
/* registration with the rest of the app */
const miIs = id => MINI_IDS.includes(id) && !!MINI[id];
MINI_IDS.forEach(id => { CALC[id] = () => null; });
try { MINI_IDS.forEach(id => { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push(id); if (Array.isArray(EX_SKIP)) EX_SKIP.push(id); }); } catch (e) {}
if (typeof svKind === 'function'){ const svKindMi = svKind; svKind = function(id){ return MINI_IDS.includes(id) ? '' : svKindMi.apply(this, arguments); }; }
{ const aiStMi = aiScreenText; aiScreenText = function(id){
  const s = aiStMi.apply(this, arguments); if (!miIs(id)) return s;
  const def = MINI[id], v = miVals(id), o = MINI_LAST[id] || {};
  const fs = (def.fields || []).map(f => t(f.t) + ' = ' + (f.type === 'sel' ? t((f.opts.find(x => String(x[0]) === String(v[f.k])) || ['', ''])[1]) : v[f.k])).join('; ');
  return s + (fs ? '\nValues: ' + fs : '') + (o.hero ? '\nResult: ' + o.hero.l + ' ' + o.hero.v : '') + (o.rows ? '\n' + o.rows.map(r => '- ' + r[0] + ': ' + r[1]).join('\n') : '');
}; }
{ const actMi = activate; activate = function(id){ const r = actMi.apply(this, arguments); if (miIs(id)) miRender(id); return r; }; }
{ const alMi = applyLang; applyLang = function(){ const r = alMi.apply(this, arguments); try { if (miIs(tab)) miRender(tab); } catch (e) {} return r; }; }
setTimeout(() => { try { if (miIs(tab)) miRender(tab); } catch (e) {} }, 0);
Object.assign(T, {
  mi_err:['משהו לא הסתדר בחישוב – בדקו את הערכים.','حدث خطأ في الحساب – تحققوا من القيم.','Something went wrong – check the values.'],
  mi_notAdvice:['מידע כללי בלבד – לא ייעוץ משפטי, פיננסי או מס. לפני החלטה כדאי להתייעץ עם איש מקצוע.','معلومات عامة فقط – ليست استشارة قانونية أو مالية أو ضريبية. قبل القرار يُستحسن استشارة مختص.','General information only – not legal, financial or tax advice. Consult a professional before deciding.'],
  mi_reset:['הערכים חזרו לברירת המחדל','عادت القيم إلى الافتراضية','Values reset to defaults'],
  mi_remind:['הוספה לתזכורות','إضافة إلى التذكيرات','Add to reminders'],
  u_yrs:['שנים','سنوات','years'], u_mo:['חודשים','أشهر','months'], u_km:['ק״מ','كم','km'], u_hrs:['שעות','ساعات','hours'], u_ppl:['אנשים','أشخاص','people'], u_m2:['מ״ר','م²','m²'],
  fam_glossary:['מידע ומקורות','معلومات ومصادر','Info & sources'],
});
