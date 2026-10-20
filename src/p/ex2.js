/* ---------- 13.22: expenses – import a bank or credit-card statement, and categories that learn ----------
   The file (CSV, Excel .xlsx, or the HTML ".xls" many Israeli banks export) is read on the phone; nothing is sent.
   Each line gets a category from what you taught it (merchant → category), then from common store names. */
const x2E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var X2 = null;     // the import in progress: {rows: [{date, desc, amt, cat, on, dup}], kind, name}
const X2_KW = [[/סופר[-\s]?פארם|בית מרקחת|קופת חולים|מכבי|כללית|מאוחדת|לאומית|רופא|pharm|clinic|dent|صيدلية/i, 'health'], [/סופר|שופרסל|רמי לוי|rami levy|shufersal|yochananof|victory|osher ad|יוחננוף|ויקטורי|אושר עד|מגה|טיב טעם|קרפור|מכולת|יינות ביתן|חצי חינם|am:pm|supermarket|grocer|سوبر/i, 'food'],
  [/דלק|פז(?=\s|$)|סונול|דור אלון|ten\b|yellow|fuel|petrol|חניון|פנגו|סלופארק|כביש 6|cellopark|pango|רכבת|אגד|דן(?=\s|$)|רב.?קו|moovit|gett|yango|car|vroom/i, 'car'],
  [/חשמל|מים|ארנונה|עירייה|עיריית|גז(?=\s|$)|תאגיד|electric|water|כהרבאא|كهرباء/i, 'bills'], 
  [/מסעד|קפה|ארומה|קופיקס|גרג|לנדוור|מקדונלד|בורגר|פיצה|וולט|תן ביס|wolt|10bis|restaurant|cafe|coffee|bar\b|cinema|סינמה|יס פלנט|netflix|spotify|disney|apple\.com|google play|مطعم|مقهى/i, 'fun'],
  [/בגדים|אופנה|קסטרו|פוקס|זארה|h&m|הודיס|גולף|תמנון|נעליים|shein|asos|fashion|ملابس/i, 'clothes'], [/סלקום|פרטנר|פלאפון|הוט|בזק|גולן טלקום|019|012|we4g|cellcom|partner|bezeq|hot\b|yes\b/i, 'comm'],
  [/ביטוח|הראל|מגדל|כלל|הפניקס|מנורה|איילון|ביטוח ישיר|insurance|تأمين/i, 'insur'], [/גן ילדים|צהרון|בית ספר|חוג|מתנ"ס|קייטנה|school|kinder|טויס|toys/i, 'kids'],
  [/איקאה|ikea|הום סנטר|ace\b|טמבור|ווי? שופ|שכר דירה|שכירות|ועד בית|משכנתא|rent|home center/i, 'home'], [/הלוואה|ריבית|עמלה|כרטיס אשראי|loan|interest|fee\b/i, 'debt'], [/מתנה|gift|פרחים|flowers/i, 'gifts']];
const x2Key = s => String(s || '').toLowerCase().replace(/[\d#*"'.,()\-_/\\|]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 2).join(' ');
function x2Rules(){ const d = expData(); if (!d.rules || typeof d.rules !== 'object') d.rules = {}; return d.rules; }
function x2Guess(desc){ const k = x2Key(desc), R = x2Rules(); if (k && R[k]) return R[k]; const hit = X2_KW.find(([rx]) => rx.test(String(desc || ''))); return hit ? hit[1] : 'other'; }
function x2Learn(desc, cat){ const k = x2Key(desc); if (!k || k.length < 2 || !EXP_CATS.some(c => c[0] === cat)) return; const R = x2Rules(); if (R[k] === cat) return; R[k] = cat; const ks = Object.keys(R); if (ks.length > 600) delete R[ks[0]]; toolsSave('fin-exp', expData()); }

/* ---- reading the file ---- */
function x2Csv(txt){
  const first = txt.split(/\r?\n/).find(l => l.trim()) || '', dl = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0], rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < txt.length; i++){ const ch = txt[i];
    if (q){ if (ch === '"'){ const nx = txt[i + 1]; if (nx === '"'){ cell += '"'; i++; } else if (nx === undefined || nx === dl || nx === '\n' || nx === '\r') q = false; else cell += '"'; } else cell += ch; continue; }   // a stray quote inside a field (ת"א) stays
    if (ch === '"') q = true; else if (ch === dl){ row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r'){ if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch; }
  if (cell || row.length){ row.push(cell); rows.push(row); }
  return rows;
}
function x2Html(txt){ const doc = new DOMParser().parseFromString(txt, 'text/html'); return [...doc.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(c => c.textContent.replace(/\s+/g, ' ').trim())); }
async function x2Xlsx(buf){
  const JSZip = await pxZip(), z = await JSZip.loadAsync(buf), P = s => new DOMParser().parseFromString(s, 'application/xml');
  const ss = z.file('xl/sharedStrings.xml') ? [...P(await z.file('xl/sharedStrings.xml').async('string')).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
  const names = Object.keys(z.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(); const out = [];
  for (const n of names.slice(0, 3)){ const doc = P(await z.file(n).async('string'));
    for (const r of doc.getElementsByTagName('row')){ const row = [];
      for (const c of r.getElementsByTagName('c')){ const ref = c.getAttribute('r') || '', col = ref.replace(/\d+/g, '').split('').reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0) - 1, tp = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0];
        let val = tp === 's' && v ? ss[+v.textContent] : tp === 'inlineStr' && is ? is.textContent : v ? v.textContent : ''; row[col >= 0 ? col : row.length] = val; }
      out.push(Array.from(row, x => x == null ? '' : String(x))); } }
  return out;
}
async function x2Read(file){
  const name = file.name || '', buf = await file.arrayBuffer(), head = new Uint8Array(buf.slice(0, 4));
  if (head[0] === 0x50 && head[1] === 0x4B) return x2Xlsx(buf);                                   // xlsx (zip)
  if (head[0] === 0xD0 && head[1] === 0xCF) throw new Error('xls');                               // old binary Excel – ask for CSV/xlsx
  let txt = new TextDecoder('utf-8').decode(buf); if (/\uFFFD/.test(txt.slice(0, 2000))) txt = new TextDecoder('windows-1255').decode(buf);
  return /^\s*</.test(txt) ? x2Html(txt) : x2Csv(txt);
}
/* ---- understanding the columns ---- */
const X2_COL = {date: /תאריך עסקה|תאריך רכישה|תאריך ערך|תאריך|date/i, desc: /שם בית ה?עסק|בית עסק|תיאור|פרטים|הפעולה|אסמכתא|merchant|description|details|business/i,
  charge: /סכום חיוב|סכום לחיוב|חיוב בש|charge amount|billing amount/i, amt: /סכום עסקה|סכום|amount|sum/i, debit: /חובה|בחובה|debit|withdraw/i, credit: /זכות|בזכות|credit|deposit/i};
function x2Date(v){
  const s = String(v || '').trim(); let m;
  if (/^\d{5}(\.\d+)?$/.test(s)){ const d = new Date(Math.round((+s - 25569) * 864e5)); return isNaN(d) ? '' : d.toISOString().slice(0, 10); }   // Excel day number
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  if ((m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/.exec(s))){ const y = m[3].length === 2 ? '20' + m[3] : m[3]; if (+m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return '';
}
const x2Num = v => { let s = String(v == null ? '' : v).replace(/[₪$€\s‎‏]|ש"ח|NIS|ILS/g, ''); const neg = /^\(.*\)$/.test(s) || /-$/.test(s) || /^-/.test(s); s = s.replace(/[()\-]/g, ''); if (/,\d{2}$/.test(s) && !/\.\d/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); const x = parseFloat(s); return isFinite(x) ? (neg ? -x : x) : NaN; };
function x2Parse(rows){
  rows = rows.filter(r => r && r.some(c => String(c).trim()));
  let hi = -1, map = null;
  for (let i = 0; i < Math.min(rows.length, 40); i++){ const r = rows[i].map(c => String(c)), f = k => r.findIndex(c => X2_COL[k].test(c));
    const d = f('date'), ds = f('desc'), ch = f('charge'), a = f('amt'), db = f('debit'), cr = f('credit');
    if (d >= 0 && ds >= 0 && (ch >= 0 || a >= 0 || db >= 0)){ hi = i; map = {d, ds, a: ch >= 0 ? ch : a, db, cr}; break; } }
  if (!map) return null;
  const out = [], kind = map.db >= 0 ? 'bank' : 'card';
  for (const r of rows.slice(hi + 1)){
    const date = x2Date(r[map.d]); if (!date) continue;
    const desc = String(r[map.ds] || '').trim(); let amt = NaN;
    if (map.db >= 0){ const db = x2Num(r[map.db]); amt = db > 0 ? db : NaN; }            // a bank statement: only money that went out
    else { const a = x2Num(r[map.a]); amt = a > 0 ? a : NaN; }                             // a card statement: refunds (negative) are skipped
    if (!(amt > 0) || !desc) continue;
    out.push({date, desc: desc.slice(0, 80), amt: Math.round(amt * 100) / 100});
  }
  return {rows: out, kind};
}
/* ---- the import sheet ---- */
function x2Open(){
  if (!$('#x2x')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="x2x" hidden><div class="cp-box exp-box x2-box" role="dialog" aria-modal="true" aria-labelledby="x2_t"><div class="cp-top"><h3 id="x2_t"></h3><button type="button" class="cp-x" id="x2_close" aria-label="${x2E(t('cp_close'))}">✕</button></div><div id="x2_body"></div></div></div>`);
  $('#x2_t').textContent = t('x2_title'); X2 = null; x2Draw(); $('#x2x').hidden = false; document.body.classList.add('cp-lock');
}
function x2Close(){ const o = $('#x2x'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } X2 = null; }
function x2Draw(){
  const b = $('#x2_body'); if (!b) return; const E = x2E;
  if (!X2){ b.innerHTML = `<p class="fine">${E(t('x2_intro'))}</p><ol class="x2-how"><li>${E(t('x2_h1'))}</li><li>${E(t('x2_h2'))}</li><li>${E(t('x2_h3'))}</li></ol>
      <label class="gold-btn x2-pick">📄 ${E(t('x2_pick'))}<input type="file" id="x2_file" accept=".csv,.xlsx,.xls,.html,.htm,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden></label>
      <p class="fine sl-priv">🔒 ${E(t('x2_priv'))}</p><p class="fine" id="x2_msg" role="status" aria-live="polite"></p>`; return; }
  const on = X2.rows.filter(r => r.on), sum = on.reduce((s, r) => s + r.amt, 0), dups = X2.rows.filter(r => r.dup).length;
  b.innerHTML = `<p class="ds-found" role="status">✓ ${E(t('x2_found', {n: X2.rows.length, k: t(X2.kind === 'bank' ? 'x2_kBank' : 'x2_kCard')}))}${dups ? ' ' + E(t('x2_dups', {n: dups})) : ''}</p>
    <div class="btnrow"><button type="button" class="mv" id="x2_all">☑️ ${E(t('x2_all'))}</button><button type="button" class="mv" id="x2_none">⬜ ${E(t('x2_none'))}</button></div>
    <ul class="x2-list">${X2.rows.map((r, i) => `<li class="${r.dup ? 'dup' : ''}"><label class="x2-ck"><input type="checkbox" data-x2on="${i}"${r.on ? ' checked' : ''} aria-label="${E(r.desc)}"></label>
      <div class="x2-m"><b dir="auto">${E(r.desc)}</b><small>${E(dLabel(r.date))}${r.dup ? ' · ' + E(t('x2_dup')) : ''}</small></div>
      <select data-x2cat="${i}" aria-label="${E(t('exp_cat'))}">${EXP_CATS.map(([k, ic]) => `<option value="${k}"${r.cat === k ? ' selected' : ''}>${ic} ${E(t('ec_' + k))}</option>`).join('')}</select>
      <b class="x2-a num" dir="ltr">${E(M(r.amt, 0, 'ILS'))}</b></li>`).join('')}</ul>
    <div class="btnrow x2-go"><button type="button" class="gold-btn" id="x2_do"${on.length ? '' : ' disabled'}>⬇️ ${E(t('x2_do', {n: on.length, m: M(sum, 0, 'ILS')}))}</button><button type="button" class="btn" id="x2_back">${E(t('x2_other'))}</button></div>
    <p class="fine">${E(t('x2_learnH'))}</p>`;
}
async function x2File(f){
  const msg = $('#x2_msg'); if (msg) msg.textContent = t('x2_reading');
  try { const rows = await x2Read(f), P = x2Parse(rows);
    if (!P || !P.rows.length){ if (msg) msg.textContent = t('x2_noRows'); return; }
    const have = new Set(expData().items.map(it => it.date + '|' + Math.round(+it.amt * 100) + '|' + x2Key(it.note)));
    X2 = {kind: P.kind, name: f.name, rows: P.rows.map(r => { const dup = have.has(r.date + '|' + Math.round(r.amt * 100) + '|' + x2Key(r.desc)); return Object.assign(r, {cat: x2Guess(r.desc), on: !dup, dup}); })};
    x2Draw();
  } catch (e) { if (msg) msg.textContent = t(String(e && e.message) === 'xls' ? 'x2_oldXls' : 'x2_fail'); }
}
function x2Import(){
  const d = expData(), on = X2.rows.filter(r => r.on); if (!on.length) return;
  on.forEach(r => d.items.push({id: tId(), t: Date.now(), amt: r.amt, bc: 'ILS', oamt: r.amt, cur: 'ILS', cat: r.cat, date: r.date, note: r.desc, pay: X2.kind === 'bank' ? 'transfer' : 'card', cc: 'IL', city: '', rec: false, imp: 1}));
  toolsSave('fin-exp', d); const n = on.length; EXP_M = on.map(r => r.date).sort().pop().slice(0, 7); x2Close(); expRender(); toast(t('x2_done', {n}));
}
/* ---- wiring ---- */
{
  const er2 = expRender;
  expRender = function(){ const r = er2.apply(this, arguments); try { const tl = $('#panel-expenses .exp-tools'); if (tl && !tl.querySelector('#x2_open')) tl.insertAdjacentHTML('beforeend', `<button type="button" class="btn" id="x2_open">⬇️ ${x2E(t('x2_btn'))}</button>`); else if (tl){ const b = tl.querySelector('#x2_open'); if (b) b.textContent = '⬇️ ' + t('x2_btn'); } } catch (e) {} return r; };
  /* a saved expense teaches its category to the merchant name */
  const es2 = expSave; expSave = function(){ const note = ($('#exp_note') || {}).value || '', cat = EXP_CAT; const r = es2.apply(this, arguments); try { if (note.trim()) x2Learn(note, cat); } catch (e) {} return r; };
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#x2_open')){ x2Open(); return; }
  if (!t0.closest('#x2x')) return;
  if (t0.closest('#x2_close') || t0.id === 'x2x'){ x2Close(); return; }
  if (t0.closest('#x2_do')){ x2Import(); return; }
  if (t0.closest('#x2_back')){ X2 = null; x2Draw(); return; }
  if (t0.closest('#x2_all') || t0.closest('#x2_none')){ const v = !!t0.closest('#x2_all'); X2.rows.forEach(r => { r.on = v; }); x2Draw(); return; }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#x2x')) return;
  if (el.id === 'x2_file' && el.files && el.files[0]){ x2File(el.files[0]); el.value = ''; return; }
  if (el.dataset.x2on != null){ X2.rows[+el.dataset.x2on].on = el.checked; const on = X2.rows.filter(r => r.on), b = $('#x2_do'); if (b){ b.disabled = !on.length; b.textContent = '⬇️ ' + t('x2_do', {n: on.length, m: M(on.reduce((s, r) => s + r.amt, 0), 0, 'ILS')}); } return; }
  if (el.dataset.x2cat != null){ const r = X2.rows[+el.dataset.x2cat]; r.cat = el.value; x2Learn(r.desc, el.value);
    const k = x2Key(r.desc); X2.rows.forEach((o, i) => { if (o !== r && x2Key(o.desc) === k){ o.cat = el.value; const s = $(`[data-x2cat="${i}"]`); if (s) s.value = el.value; } }); }
});
/* typing a store name in a new expense picks its learned category */
document.addEventListener('input', e => { const el = e.target; if (!el || el.id !== 'exp_note' || EXP_ED) return; const k = x2Key(el.value), R = x2Rules(); const cat = (k && R[k]) || (el.value.length > 2 ? (X2_KW.find(([rx]) => rx.test(el.value)) || [])[1] : ''); if (cat && cat !== EXP_CAT){ const b = $(`#exx [data-excat="${cat}"]`); if (b) b.click(); } });
try { GS_SYN.expenses = (GS_SYN.expenses || '') + ' ייבוא דף חשבון פירוט אשראי ישראכרט מקס כאל אקסל import statement csv excel credit card استيراد كشف حساب'; } catch (e) {}
