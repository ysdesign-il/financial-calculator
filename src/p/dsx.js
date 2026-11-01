/* scanner: warranties, ID expiry, bills, contract dates, documents waiting for you */
/* ---------- 13.56: the scanner keeps track of dates ----------
   🧾 warranties · 🪪 expiry dates of personal cards · 📈 bills · 🏠 contract dates · ⏰ "waiting for you" – one list of what needs doing.
   Everything is kept on this phone in 'fin-dsitems' (a list of document items, also in the backup and the encrypted account).
   Never an ID, card or account number, a birth date or an address – only the type, the dates and a label the user chose.
   Photos of receipts, bills and contracts go to the documents vault's on-phone store, and only when this device keeps photos.
   AI is used only when the user taps a button that says so and only when AI is available; personal cards are never sent.
   Other parts may add items with dsiAdd({kind, title, date, …}) and open their own items through DSI_OPEN[kind] = item => {…}. */
const DSI_KEY = 'fin-dsitems';
try { if (Array.isArray(DATA_KEYS) && !DATA_KEYS.includes(DSI_KEY)) DATA_KEYS.push(DSI_KEY); } catch (e) {}
var DSI_OPEN = {};
var DXX = {v: 'wait', ed: null, pre: null, img: null, f: 'all', wf: 'act', broke: null, bl: '', snz: null, cls: '', busy: false};
const dxE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const dsiNewId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---- dates (own helpers: this file loads before the reminders module) ---- */
const dxP2 = n => String(n).padStart(2, '0');
const dxIso = d => d.getFullYear() + '-' + dxP2(d.getMonth() + 1) + '-' + dxP2(d.getDate());
const dxParse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null; };
const dxToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const dxNow = () => dxIso(dxToday());
const dxDays = s => { const d = dxParse(s); return d ? Math.round((d - dxToday()) / 864e5) : NaN; };
const dxAdd = (s, n) => { const d = dxParse(s); if (!d) return ''; d.setDate(d.getDate() + n); return dxIso(d); };
const dxAddM = (s, n) => { const d = dxParse(s); if (!d || !(n > 0)) return ''; const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + Math.round(n)); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return dxIso(d); };
const dxFmt = (s, loc) => { const d = dxParse(s); if (!d) return ''; try { return new Intl.DateTimeFormat(loc || locOf(), {day: 'numeric', month: 'short', year: 'numeric'}).format(d); } catch (e) { return s; } };
const dxFmtM = s => { const m = /^(\d{4})-(\d{2})$/.exec(String(s || '')); if (!m) return ''; try { return new Intl.DateTimeFormat(locOf(), {month: 'short', year: 'numeric'}).format(new Date(+m[1], +m[2] - 1, 1)); } catch (e) { return s; } };
const dxRel = s => { const n = dxDays(s); return !isFinite(n) ? '' : n === 0 ? t('rm_today') : n === 1 ? t('rm_tomorrow') : n > 1 ? t('rm_inDays', {n}) : t('rm_late', {n: -n}); };
const dxNum = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[,\s₪]/g, '')); return isFinite(x) ? x : NaN; };
const dxM = x => +x ? M(+x, Math.abs(+x - Math.round(+x)) < 0.005 ? 0 : 2, 'ILS') : '';
function dxCfg(){ const c = SET.dsx && typeof SET.dsx === 'object' ? SET.dsx : (SET.dsx = {}); if (!(+c.pct > 0)) c.pct = 25; if (c.warr == null || !(+c.warr >= 0)) c.warr = 30; return c; }
const dxTab = id => { try { return TABS.includes(id); } catch (e) { return false; } };
const dxPics = () => { try { return typeof vtNoPics === 'function' && !vtNoPics(); } catch (e) { return false; } };

/* ================= the shared list of document items ================= */
const DSI_FIELDS = ['id', 'kind', 'title', 'date', 'amount', 'vendor', 'fileId', 'year', 'done', 'created'];
const DSI_BAD = /(^|_)(idno|idnum|tz|teudat|passno|passportno|cardno|cardnum|account|acct|iban|birth|dob|address|addr)/i;
/* long runs of digits (ID, card or account numbers) never get into a label */
const dsiScrub = (s, max) => String(s == null ? '' : s).replace(/\d[\d\s-]{6,}\d/g, '…').replace(/\s+/g, ' ').trim().slice(0, max || 80);
function dsiClean(x){
  const o = {}; x = x || {};
  DSI_FIELDS.forEach(k => { if (x[k] !== undefined) o[k] = x[k]; });
  if (o.title != null) o.title = dsiScrub(o.title, 80);
  if (o.vendor != null) o.vendor = dsiScrub(o.vendor, 60);
  if (o.date != null && !dxParse(o.date)) o.date = '';
  if (o.amount != null && o.amount !== ''){ const n = dxNum(o.amount); o.amount = isFinite(n) && n ? Math.round(n * 100) / 100 : ''; }
  if (o.done != null) o.done = !!o.done;
  if (x.meta && typeof x.meta === 'object'){ o.meta = {}; Object.keys(x.meta).forEach(k => { if (!DSI_BAD.test(k)) o.meta[k] = x.meta[k]; }); }
  return o;
}
function dsiAll(){ try { const a = JSON.parse(LS.getItem(DSI_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => x && typeof x === 'object' && x.id && x.kind) : []; } catch (e) { return []; } }
function dsiPut(a){ try { LS.setItem(DSI_KEY, JSON.stringify(a.slice(-1500))); } catch (e) { try { toast(t('dx_saveFail')); } catch (er) {} } try { dxHome(); } catch (e) {} }
function dsiAdd(item){
  if (!item || !item.kind) return null;
  const a = dsiAll(); if (item.id && a.some(x => x.id === item.id)) return dsiUpdate(item.id, item);
  const it = Object.assign({id: dsiNewId(), created: Date.now(), done: false}, dsiClean(item)); if (!it.id) it.id = dsiNewId();
  a.push(it); dsiPut(a); dxRemSync(it); return it;
}
function dsiUpdate(id, patch){
  const a = dsiAll(), it = a.find(x => x.id === id); if (!it) return null;
  const c = dsiClean(patch); delete c.id; const m = c.meta; delete c.meta; Object.assign(it, c); if (m) it.meta = Object.assign({}, it.meta || {}, m);
  dsiPut(a); dxRemSync(it); return it;
}
function dsiRemove(id){
  const a = dsiAll(), it = a.find(x => x.id === id); if (!it) return false;
  dsiPut(a.filter(x => x !== it)); dxRemSync(it, true); dxFileDrop(it); return true;
}
/* the photo goes with the item: a warranty's receipt is a vault entry, other photos are kept under 'dsx-<id>' */
function dxFileDrop(it){
  if (!it.fileId) return;
  try {
    if (it.kind === 'warranty' && typeof vtD === 'function'){ const v = vtD(); if (v.items.some(x => x.id === it.fileId)){ v.items = v.items.filter(x => x.id !== it.fileId); saveSet(); } vtDel(it.fileId); }
    else if (String(it.fileId).startsWith('dsx-') && typeof vtDel === 'function') vtDel(it.fileId);
  } catch (e) {}
}
const dxHasPic = it => { if (!it || !it.fileId) return false; if (it.kind === 'warranty'){ try { const v = vtD().items.find(x => x.id === it.fileId); return !!(v && v.img); } catch (e) { return false; } } return !!(it.meta && it.meta.pic); };

/* the name shown: a bill or a contract without its own name, and a card type, follow the screen's language */
function dxTitle(it){ const m = it.meta || {}; if (it.kind === 'bill' && !it.vendor) return t('dx_b_' + (m.type || 'other')); if (it.kind === 'contract' && m.autoT) return t('dx_ct_' + (m.ctype || 'other')); if (it.kind === 'idexp' && m.ctype) return t('ds_c_' + m.ctype) + (m.nick ? ' – ' + m.nick : ''); return it.title || ''; }
/* ---- the dates of an item that need something done ---- */
function dxNotice(it){ const m = it.meta || {}, end = m.end || it.date; return +m.notice > 0 && dxParse(end) ? dxAdd(end, -(+m.notice)) : ''; }
function dxRows(it){
  const m = it.meta || {}, dd = Array.isArray(m.dd) ? m.dd : [], R = [], n = dxTitle(it) || '';
  const add = (k, d, w, leads) => { if (d && dxParse(d) && !dd.includes(k)) R.push({it, k, key: it.id + ':' + k, d, w, leads: leads.map(x => Math.max(0, +x || 0))}); };
  if (it.kind === 'warranty') add('end', it.date, t('dx_rWarr', {n}), [m.remind != null ? m.remind : dxCfg().warr]);
  else if (it.kind === 'bill'){ if (!it.done) add('due', it.date, t('dx_rBill', {n}), [3]); }
  else if (it.kind === 'contract'){ const nd = dxNotice(it); if (nd) add('notice', nd, t('dx_rNotice', {n}), [14, 0]); add('upd', m.upd, t('dx_rUpd', {n}), [14]); add('end', m.end || it.date, t('dx_rEnd', {n}), [30]); }
  else if (it.kind === 'idexp') add('exp', it.date, t('dx_rExp', {n}), Array.isArray(m.leads) && m.leads.length ? m.leads : [90, 30]);
  else add('d', it.date, n, [m.lead != null ? m.lead : 3]);
  return R;
}
/* a passed warranty end or contract date needs nothing any more; a late bill, an expired card or a missed letter date does */
const dxKeepLate = r => !['warranty', 'contract'].includes(r.it.kind);
const dxSnoozed = it => !!(it.meta && it.meta.snooze && dxDays(it.meta.snooze) > 0);
const dxIsDue = r => dxDays(r.d) <= Math.max(0, ...r.leads);
function dxOpenRows(items){ return (items || dsiAll()).filter(it => !it.done).flatMap(dxRows).filter(r => dxDays(r.d) >= 0 || dxKeepLate(r)).sort((a, b) => a.d.localeCompare(b.d)); }
const dxDueRows = () => dxOpenRows().filter(r => !dxSnoozed(r.it) && dxIsDue(r));
const DX_IC = {warranty: '🧾', bill: '📈', contract: '🏠', idexp: '🪪', letter: '✉️', tax: '📂'};
const dxIc = it => it.kind === 'bill' ? (DX_BILLS.find(b => b[0] === (it.meta || {}).type) || ['', '📈'])[1] : it.kind === 'contract' ? (DX_CT.find(b => b[0] === (it.meta || {}).ctype) || ['', '🏠'])[1] : it.kind === 'idexp' ? ((typeof DS_CARDS !== 'undefined' && DS_CARDS.find(c => c[0] === (it.meta || {}).ctype)) || ['', '🪪'])[1] : DX_IC[it.kind] || '📌';

/* ---- the reminders module: each item's dates become reminders (tagged, so editing or deleting the item updates them) ---- */
const dxCat = it => { const m = it.meta || {}; return it.kind === 'warranty' ? 'home' : it.kind === 'bill' ? 'bills' : it.kind === 'tax' ? 'tax' : it.kind === 'contract' ? (m.ctype === 'insur' ? 'insur' : m.ctype === 'rent' ? 'home' : m.ctype === 'lease' ? 'car' : 'money') : it.kind === 'idexp' ? (['license', 'vehicle'].includes(m.ctype) ? 'car' : 'docs') : 'docs'; };
function dxRemSync(it, gone){
  if (typeof rmD !== 'function') return; let d; try { d = rmD(); } catch (e) { return; }
  const n0 = d.items.length; d.items = d.items.filter(x => x.dsi !== it.id); let changed = d.items.length !== n0;
  if (!gone && !it.done && it.meta && it.meta.rem){
    const RB = [0, 1, 3, 7, 14, 30], seen = new Set();
    dxRows(it).forEach(r => {
      if (dxDays(r.d) < 0) return; let any = false;
      const put = (date, before, title) => { const k = date + '|' + before; if (seen.has(k)) return; seen.add(k); any = true;
        d.items.push({id: dsiNewId(), title: dsiScrub(title, 80), date, time: '', rep: 'none', before, cat: dxCat(it), note: t('dx_remNote'), amt: +it.amount && it.kind === 'bill' ? it.amount : '', done: false, at: Date.now(), dsi: it.id}); };
      r.leads.slice().sort((a, b) => b - a).forEach(L => { if (RB.includes(L)) put(r.d, L, r.w); else { const a = dxAdd(r.d, -L); if (dxDays(a) >= 0) put(a, 0, r.w + ' · ' + dxFmt(r.d)); } });
      if (!any) put(r.d, 0, r.w);
    });
    changed = true;
  }
  if (changed){ saveSet(); try { rmHome(); } catch (e) {} }
}

/* ================= types ================= */
const DX_BILLS = [['elec', '💡'], ['water', '🚰'], ['arnona', '🏛️'], ['gas', '🔥'], ['phone', '📶'], ['other', '🧾']];
const DX_CMP = {elec: ['elecsup'], phone: ['cellcmp', 'renewals'], arnona: ['arnona']};
const DX_CT = [['rent', '🏠'], ['lease', '🚗'], ['sub', '🔁'], ['gym', '🏋️'], ['insur', '🛡️'], ['other', '📄']];
const DX_IDT = ['id', 'passport', 'license', 'vehicle', 'health', 'credit', 'student', 'army', 'oleh', 'disab', 'ravkav', 'idold', 'other'];
const DX_VIEWS = [['wait', '⏰'], ['warranty', '🧾'], ['bill', '📈'], ['contract', '🏠'], ['idexp', '🪪']];

/* ---- reading a photo: AI (only when available and asked), or the phone's own text recognition, or by hand ---- */
const dxLangName = () => ({he: 'Hebrew', ar: 'Arabic', en: 'English'})[lang] || 'English';
const DX_NO = ' Never return a private person\'s name, an ID, card or account number, a date of birth or an address. Use "" or null when something is not written.';
const DX_ASK = {
  warranty: () => `This photo is a shop receipt, an invoice or a warranty card. Return ONLY JSON: {"product": what was bought, short, in ${dxLangName()}, "store": the shop or company, "date": the purchase date as YYYY-MM-DD, "price": the total paid as a number, "months": the warranty length in months as a number if it is written}.` + DX_NO,
  bill: () => `This photo is a bill. Return ONLY JSON: {"type": one of "elec" (electricity), "water", "arnona" (municipal tax), "gas", "phone" (phone, mobile, internet or TV), "other", "provider": the company or authority, "period": the month the bill is for as YYYY-MM (the last month if it covers several), "amount": the total to pay as a number, "due": the date to pay by as YYYY-MM-DD}.` + DX_NO,
  contract: () => `This photo is a contract or policy (rental, lease, subscription, gym, insurance or other). Return ONLY JSON: {"ctype": one of "rent","lease","sub","gym","insur","other", "title": a short title in ${dxLangName()}, "party": the company or business on the other side (never a private person), "start": YYYY-MM-DD, "end": YYYY-MM-DD, "noticeDays": how many days before the end notice must be given, as a number, "price": the monthly price or rent as a number, "update": the date the price or rent is updated, YYYY-MM-DD, "auto": true if it renews automatically, false if it does not, null if not written}.` + DX_NO
};
const dxD = v => dxParse(v) ? v : '';
function dxFromAi(k, j){
  j = j && typeof j === 'object' ? j : {}; const n = x => { const v = dxNum(x); return isFinite(v) && v > 0 ? v : ''; };
  if (k === 'warranty'){ const mo = n(j.months); return {title: j.product || '', vendor: j.store || '', purchase: dxD(j.date), amount: n(j.price), len: mo ? (mo % 12 === 0 && mo >= 12 ? mo / 12 : mo) : '', unit: mo && mo % 12 === 0 && mo >= 12 ? 'y' : 'm', _ai: 1}; }
  if (k === 'bill') return {type: DX_BILLS.some(b => b[0] === j.type) ? j.type : 'other', vendor: j.provider || '', period: /^\d{4}-\d{2}$/.test(j.period || '') ? j.period : '', amount: n(j.amount), date: dxD(j.due), _ai: 1};
  if (k === 'contract') return {ctype: DX_CT.some(c => c[0] === j.ctype) ? j.ctype : 'other', title: j.title || '', vendor: j.party || '', start: dxD(j.start), end: dxD(j.end), notice: n(j.noticeDays), amount: n(j.price), upd: dxD(j.update), auto: j.auto === true ? 'y' : j.auto === false ? 'n' : '', _ai: 1};
  return {};
}
/* the on-device text (from the scanner's own recognition, or the phone's text-recognition part when it is there) */
async function dxOcr(canvas){
  if (DSC && String(DSC.ocr || '').trim()) return String(DSC.ocr);
  if (typeof ocrText !== 'function') return '';
  try { const r = await ocrText(canvas, undefined, {label: t('dx_reading')}); return String(typeof r === 'string' ? r : (r && r.text) || ''); } catch (e) { return ''; }
}
const DX_RX = {elec: /חשמל|קוט["״]?ש|kwh|electric|كهرباء/i, water: /מים|תאגיד|water|مياه|ماء/i, arnona: /ארנונה|עירייה|מועצה|arnona|municipal|أرنونا|بلدية/i, gas: /\bגז\b|gas\b|غاز/i, phone: /סלולר|טלפון|אינטרנט|סיבים|cellcom|partner|pelephone|bezeq|\bhot\b|golan|mobile|internet|هاتف|خلوي|إنترنت/i};
function dxGuess(k, s){
  s = String(s || ''); const dates = [], sums = [];
  (s.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})\b/g) || []).forEach(m => { const [d, mo, y0] = m.split(/[./-]/).map(Number), y = y0 < 100 ? 2000 + y0 : y0; const iso = y + '-' + dxP2(mo) + '-' + dxP2(d); if (y >= 2000 && y <= 2100 && dxParse(iso)) dates.push(iso); });
  dates.sort();
  const tot = /(סה["״]?כ|לתשלום|total|amount due|المجموع|للدفع)[^\d\n]{0,20}(\d[\d,]*(?:\.\d{1,2})?)/i.exec(s);
  (s.match(/(?:₪\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:₪|ש["״]ח|NIS|ILS))/g) || []).forEach(m => { const v = dxNum(m.replace(/[^\d.,]/g, '')); if (v > 0) sums.push(v); });
  const amount = tot ? dxNum(tot[2]) : sums.length ? Math.max(...sums) : '';
  const out = {_ocr: 1};
  if (k === 'warranty'){ const past = dates.filter(d => d <= dxNow()); out.purchase = past[past.length - 1] || ''; out.amount = amount || '';
    const mo = /(\d{1,2})\s*(חודשים|חודש|months?|شهرا?|أشهر)/i.exec(s), yr = /(\d)\s*(שנים|שנה|שנות|years?|سنة|سنوات)/i.exec(s); if (mo){ out.len = +mo[1]; out.unit = 'm'; } else if (yr){ out.len = +yr[1]; out.unit = 'y'; } }
  else if (k === 'bill'){ out.type = (Object.keys(DX_RX).find(x => DX_RX[x].test(s))) || 'other'; out.amount = amount || ''; const fut = dates.filter(d => d >= dxNow()); out.date = fut[0] || dates[dates.length - 1] || ''; out.period = dates.length ? dates[0].slice(0, 7) : ''; }
  else if (k === 'contract'){ out.start = dates[0] || ''; out.end = dates.length > 1 ? dates[dates.length - 1] : ''; out.amount = amount || ''; const nd = /(\d{2,3})\s*(ימים|יום|days|يوما|أيام)/i.exec(s); if (nd) out.notice = +nd[1]; out.ctype = /שכירות|שוכר|משכיר|rent|إيجار/i.test(s) ? 'rent' : /ביטוח|פוליסה|insurance|policy|تأمين/i.test(s) ? 'insur' : /חדר כושר|gym|نادي/i.test(s) ? 'gym' : /ליסינג|lease|تأجير/i.test(s) ? 'lease' : /מנוי|subscription|اشتراك/i.test(s) ? 'sub' : 'other'; }
  return out;
}
/* open a list, optionally with its form ready ('new' or an item id) and filled in */
function dxOpen(v, ed, pre){
  DXX.v = v || 'wait'; DXX.ed = ed || null; DXX.pre = pre || null; DXX.broke = null; DXX.snz = null; if (!ed) DXX.img = null;
  try { if (typeof d3BatchStop === 'function') d3BatchStop(); } catch (e) {}
  DSX.view = 'dx'; DSX.det = null;
  if (tab !== 'docscan') activate('docscan'); else dscRender();
  setTimeout(() => { const r = $('#ds_root'); if (r && tab === 'docscan') r.scrollIntoView({block: 'start', behavior: 'smooth'}); const f = $('#dx_form input:not([type=hidden]):not([type=file]), #dx_form select'); if (f) f.focus({preventScroll: true}); }, 80);
}
/* the AI path: read the photo, then the form opens filled in */
async function dxScanAi(k, src, btn){
  if (DXX.busy || !slEngine()) return; DXX.busy = true; const st = $('#dx_st'); if (st){ st.textContent = t('dx_reading'); st.className = 'sl-st'; } if (btn) btn.disabled = true;
  try {
    const blob = src instanceof File ? await phShrink(src) : src;
    const j = await dsAsk(DX_ASK[k](), [blob]);
    DXX.busy = false; DXX.img = blob; dxOpen(k, 'new', dxFromAi(k, j));
  } catch (er){ DXX.busy = false; if (btn && btn.isConnected) btn.disabled = false; const s2 = $('#dx_st'); if (s2){ s2.textContent = t(er && er.code === 'not_granted' ? 'ph_denied' : 'dx_aiFail'); s2.className = 'sl-st bad'; } }
}

/* ================= the screens (inside the scanner) ================= */
const dxBar = title => `<div class="ds-bar"><button type="button" class="mv ds-backb" id="dx_back">${document.documentElement.dir === 'rtl' ? '›' : '‹'} ${dxE(t('ds_back'))}</button><b>${dxE(title)}</b></div>
  <nav class="ds-chips bk-tabs dx-nav" aria-label="${dxE(t('dx_hubH'))}">${DX_VIEWS.map(([k, ic]) => `<button type="button" class="ds-chip${DXX.v === k ? ' on' : ''}"${DXX.v === k ? ' aria-current="page"' : ''} data-dxgo="${k}">${ic} ${dxE(t('dx_v_' + k))}${k === 'wait' ? dxBadgeHTML() : ''}</button>`).join('')}</nav>`;
function dxBadgeHTML(){ const n = dxDueRows().length; return n ? ` <span class="dx-n" aria-label="${dxE(t('dx_nDue', {n}))}">${n}</span>` : ''; }
function dxRender(root){
  if (DXX.v === 'warranty') dxAdopt();
  const V = {wait: dxWaitHTML, warranty: dxWarrHTML, bill: dxBillHTML, contract: dxContrHTML, idexp: dxIdHTML};
  const v = V[DXX.v] ? DXX.v : 'wait'; DXX.v = v;
  root.innerHTML = dxBar(t('dx_v_' + v)) + `<div class="sl-st" id="dx_st" aria-live="polite"></div>` + V[v]();
  dxLenSync();
}
const dxEmpty = key => `<li class="fine bk-empty">${dxE(t(key))}</li>`;
const dxBtn = (attr, id, ic, lab) => `<button type="button" class="px-tb s" ${attr}="${dxE(id)}" aria-label="${dxE(lab)}" title="${dxE(lab)}">${ic}</button>`;
const dxCommon = it => `${dxHasPic(it) ? dxBtn('data-dxpic', it.id, '👁️', t('dx_pic', {n: dxTitle(it)})) : ''}${dxBtn('data-dxed', it.id, '✏️', t('rm_edit', {t: dxTitle(it)}))}${dxBtn('data-dxdel', it.id, '🗑️', t('rm_del', {t: dxTitle(it)}))}`;
const dxAddBtn = (k) => DXX.ed ? '' : `<div class="btnrow"><button type="button" class="gold-btn" id="dx_add" data-k="${k}">＋ ${dxE(t('dx_add_' + k))}</button></div>`;
const dxOf = k => dsiAll().filter(x => x.kind === k);

/* ---- ⏰ waiting for you ---- */
function dxWaitHTML(){
  const all = dsiAll(), open = dxOpenRows(all), f = DXX.f, kinds = [...new Set(open.map(r => r.it.kind))];
  let rows = f === 'done' ? [] : open.filter(r => f === 'snz' ? dxSnoozed(r.it) : !dxSnoozed(r.it));
  if (f === 'due') rows = rows.filter(dxIsDue); else if (f === 'late') rows = rows.filter(r => dxDays(r.d) < 0); else if (f.startsWith('k:')) rows = rows.filter(r => r.it.kind === f.slice(2));
  const due = open.filter(r => !dxSnoozed(r.it) && dxIsDue(r)).length, late = open.filter(r => !dxSnoozed(r.it) && dxDays(r.d) < 0).length, done = all.filter(x => x.done);
  const chips = [['all', t('rm_fAll')], ['due', t('dx_fDue') + (due ? ' (' + due + ')' : '')], ['late', t('rm_fLate') + (late ? ' (' + late + ')' : '')], ['snz', t('dx_fSnz')], ['done', t('rm_fDone')]].concat(kinds.map(k => ['k:' + k, DX_IC[k] + ' ' + t('dx_k_' + k)]));
  const c = dxCfg();
  return `<p class="fine">${dxE(t('dx_waitIntro'))}</p>
    ${due ? `<div class="ds-warn rm-ban" role="status"><span aria-hidden="true">⏰</span><p>${dxE(t('dx_nDue', {n: due}))}${late ? ' ' + dxE(t('rm_lateN', {n: late})) : ''}</p></div>` : ''}
    ${all.length ? `<div class="ds-chips" role="radiogroup" aria-label="${dxE(t('rm_filter'))}">${chips.map(([k, l]) => `<button type="button" role="radio" class="ds-chip${f === k ? ' on' : ''}" aria-checked="${f === k}" data-dxf="${dxE(k)}">${dxE(l)}</button>`).join('')}</div>` : ''}
    <ul class="rm-list">${f === 'done' ? done.map(dxDoneRow).join('') || dxEmpty('dx_noneDone') : rows.map(dxRowHTML).join('') || dxEmpty(all.length ? 'dx_noneF' : 'dx_noneAll')}</ul>
    ${!all.length ? `<div class="btnrow">${DX_VIEWS.slice(1).map(([k, ic]) => `<button type="button" class="btn" data-dxgo="${k}" data-dxnew="1">${ic} ${dxE(t('dx_add_' + k))}</button>`).join('')}</div>` : ''}
    ${open.length ? `<div class="btnrow"><button type="button" class="btn" id="dx_ics">📅 ${dxE(t('dx_icsAll'))}</button>${typeof rmD === 'function' ? `<button type="button" class="btn" id="dx_remAll">⏰ ${dxE(t('dx_remAll'))}</button>` : ''}</div>` : ''}
    <details class="ds-det"><summary>⚙️ ${dxE(t('dx_set'))}</summary><div class="bk-grid">
      <label class="bk-f"><span>${dxE(t('dx_setPct'))}</span><input type="number" inputmode="numeric" min="5" max="300" step="5" id="dxc_pct" value="${dxE(c.pct)}" dir="ltr"></label>
      <label class="bk-f"><span>${dxE(t('dx_setWarr'))}</span><select id="dxc_warr">${[7, 14, 30, 60, 90].map(n => `<option value="${n}"${+c.warr === n ? ' selected' : ''}>${dxE(t('rm_b_n', {n}))}</option>`).join('')}</select></label></div></details>
    <p class="fine sl-priv">🔒 ${dxE(t('dx_priv'))}</p>`;
}
const dxCanOpen = it => ['warranty', 'bill', 'contract', 'idexp'].includes(it.kind) || typeof DSI_OPEN[it.kind] === 'function' || !!(it.meta && it.meta.go && dxTab(it.meta.go));
function dxRowHTML(r){
  const it = r.it, n = dxDays(r.d), cls = n < 0 ? 'late' : dxIsDue(r) ? 'due' : '', sub = [it.vendor, it.kind === 'letter' && it.meta && it.meta.lt ? it.meta.lt : ''].filter(Boolean).join(' · ');
  return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${dxIc(it)}</div><div class="rm-b"><b dir="auto">${dxE(r.w)}</b>
    <span class="rm-w">${dxE(dxFmt(r.d))} · <span class="rm-rel">${dxE(dxRel(r.d))}</span>${+it.amount ? ' · <bdi dir="ltr">' + dxE(dxM(it.amount)) + '</bdi>' : ''}${dxSnoozed(it) ? ' · 💤 ' + dxE(t('dx_snzTo', {d: dxFmt(it.meta.snooze)})) : ''}</span>${sub ? `<small dir="auto">${dxE(sub)}</small>` : ''}
    <div class="rm-acts"><button type="button" class="mv" data-dxdone="${dxE(r.key)}">✓ ${dxE(t(it.kind === 'bill' ? 'dx_paid' : 'dx_done'))}</button><button type="button" class="mv" data-dxsnz="${dxE(it.id)}" aria-expanded="${DXX.snz === it.id}">💤 ${dxE(t(dxSnoozed(it) ? 'dx_unsnz' : 'dx_snz'))}</button>${dxCanOpen(it) ? `<button type="button" class="mv" data-dxopen="${dxE(it.id)}">↗ ${dxE(t('dx_open'))}</button>` : ''}${dxBtn('data-dxdel', it.id, '🗑️', t('rm_del', {t: dxTitle(it)}))}</div>
    ${DXX.snz === it.id && !dxSnoozed(it) ? `<div class="ds-chips" role="group" aria-label="${dxE(t('dx_snz'))}">${[1, 3, 7, 30].map(d => `<button type="button" class="ds-chip" data-dxsz="${dxE(it.id)}" data-n="${d}">${dxE(d === 1 ? t('rm_tomorrow') : t('rm_inDays', {n: d}))}</button>`).join('')}</div>` : ''}</div></li>`;
}
const dxDoneRow = it => `<li class="rm-it done"><div class="rm-ic" aria-hidden="true">${dxIc(it)}</div><div class="rm-b"><b dir="auto">${dxE(dxTitle(it))}</b><span class="rm-w">${dxE(t('dx_k_' + it.kind))}${it.date ? ' · ' + dxE(dxFmt(it.date)) : ''}</span>
  <div class="rm-acts"><button type="button" class="mv" data-dxundo="${dxE(it.id)}">↩️ ${dxE(t('dx_undo'))}</button>${dxBtn('data-dxdel', it.id, '🗑️', t('rm_del', {t: dxTitle(it)}))}</div></div></li>`;
/* a row is done: a bill is paid; a contract has several dates, each is done on its own */
function dxRowDone(key){
  const [id, k] = String(key).split(':'), it = dsiAll().find(x => x.id === id); if (!it) return;
  const rows = dxRows(it), m = it.meta || {};
  if (rows.length > 1){ const dd = (Array.isArray(m.dd) ? m.dd : []).concat(k); dsiUpdate(id, {done: rows.every(r => dd.includes(r.k)), meta: {dd}}); }
  else dsiUpdate(id, it.kind === 'bill' ? {done: true, meta: {paid: dxNow()}} : {done: true});
  toast(t(it.kind === 'bill' ? 'dx_paidOk' : 'dx_doneOk'));
}

/* ---- 🧾 warranties ---- */
const dxWEnd = it => it.date;
function dxWStat(it){ const n = dxDays(it.date); return !isFinite(n) ? 'act' : n < 0 ? 'exp' : n <= Math.max(30, +((it.meta || {}).remind) || 0) ? 'soon' : 'act'; }
/* warranties already kept in the documents vault join the list */
function dxAdopt(){
  if (typeof vtD !== 'function') return; let v; try { v = vtD(); } catch (e) { return; }
  const a = dsiAll(), by = new Map(a.filter(x => x.kind === 'warranty' && x.fileId).map(x => [x.fileId, x])); let ch = false;
  v.items.forEach(vi => {
    const end = +vi.months > 0 ? dxAddM(vi.date, +vi.months) : ''; if (!end) return; const it = by.get(vi.id);
    if (!it){ a.push(Object.assign({id: dsiNewId(), created: Date.now(), done: false}, dsiClean({kind: 'warranty', title: vi.name, vendor: vi.store, date: end, amount: vi.price, fileId: vi.id, meta: {purchase: vi.date, months: +vi.months, rem: false}}))); ch = true; return; }
    const m = it.meta || {}; if (dxTitle(it) !== dsiScrub(vi.name, 80) || it.date !== end || m.purchase !== vi.date || (it.vendor || '') !== dsiScrub(vi.store || '', 60)){ Object.assign(it, dsiClean({title: vi.name, vendor: vi.store, date: end, amount: vi.price})); it.meta = Object.assign({}, m, {purchase: vi.date, months: +vi.months}); ch = true; }
  });
  if (ch) dsiPut(a);
}
function dxWarrHTML(){
  const L = dxOf('warranty').sort((a, b) => String(a.date).localeCompare(String(b.date))), cnt = {act: 0, soon: 0, exp: 0}; L.forEach(x => cnt[dxWStat(x)]++);
  const f = DXX.wf, show = L.filter(x => f === 'all' || dxWStat(x) === f || (f === 'act' && dxWStat(x) === 'soon'));
  return `<p class="fine">${dxE(t('dx_wIntro'))}</p>${dxAddBtn('warranty')}${DXX.ed ? dxFormWarr() : ''}
    ${L.length ? `<div class="ds-chips" role="radiogroup" aria-label="${dxE(t('rm_filter'))}">${[['act', t('dx_wAct')], ['soon', t('dx_wSoon')], ['exp', t('dx_wExp')], ['all', t('rm_fAll')]].map(([k, l]) => `<button type="button" role="radio" class="ds-chip${f === k ? ' on' : ''}" aria-checked="${f === k}" data-dxwf="${k}">${dxE(l)}${k !== 'all' ? ' (' + (k === 'act' ? cnt.act + cnt.soon : cnt[k]) + ')' : ''}</button>`).join('')}</div>` : ''}
    <ul class="rm-list">${show.map(dxWarrRow).join('') || dxEmpty(L.length ? 'dx_noneF' : 'dx_wNone')}</ul>
    <p class="fine sl-priv">🔒 ${dxE(t('dx_wPriv'))}</p>`;
}
function dxWarrRow(it){
  const m = it.meta || {}, s = dxWStat(it), n = dxDays(it.date);
  return `<li class="rm-it ${s === 'exp' ? 'done' : s === 'soon' ? 'due' : ''}"><div class="rm-ic" aria-hidden="true">🧾</div><div class="rm-b"><b dir="auto">${dxE(dxTitle(it))}</b>
    <span class="rm-w">${dxE([it.vendor, m.purchase ? t('dx_wBought', {d: dxFmt(m.purchase)}) : '', dxM(it.amount)].filter(Boolean).join(' · '))}</span>
    <span class="rm-w">${dxE(s === 'exp' ? t('vt_expired', {d: dxFmt(it.date)}) : t('dx_wUntil', {d: dxFmt(it.date), r: dxRel(it.date)}))}</span>
    <div class="rm-acts">${s !== 'exp' ? `<button type="button" class="mv" data-dxbrk="${dxE(it.id)}" aria-expanded="${DXX.broke === it.id}">🛠️ ${dxE(t('dx_brk'))}</button>` : ''}${dxCommon(it)}</div>
    ${DXX.broke === it.id ? dxBrokeHTML(it) : ''}</div></li>`;
}
/* "my product broke – what now": a ready message to the store (in Hebrew, Arabic or English) and general information */
const DX_BL = [['he', 'עברית', 'he-IL'], ['ar', 'العربية', 'ar'], ['en', 'English', 'en-GB']];
function dxBrokeMsg(it, L){
  const i = Math.max(0, ['he', 'ar', 'en'].indexOf(L)), loc = DX_BL[i][2], m = it.meta || {}, g = k => { const v = T[k]; return Array.isArray(v) ? (v[i] || v[2] || '') : t(k); };
  return g('dx_mBody').split('{to}').join(it.vendor ? g('dx_mTo').split('{s}').join(it.vendor) + '\n\n' : '').split('{p}').join(dxTitle(it)).split('{d}').join(m.purchase ? dxFmt(m.purchase, loc) : '[…]').split('{e}').join(dxFmt(it.date, loc));
}
function dxBrokeHTML(it){
  const L = DXX.bl || (['he', 'ar', 'en'].includes(lang) ? lang : 'en'), msg = dxBrokeMsg(it, L);
  return `<div class="mx-card dx-brk"><h4 class="ds-q">🛠️ ${dxE(t('dx_brkH'))}</h4>
    <div class="field cv-f"><label for="dx_bl">${dxE(t('dx_brkLang'))}</label><select id="dx_bl" data-id="${dxE(it.id)}">${DX_BL.map(([c, nm]) => `<option value="${c}"${c === L ? ' selected' : ''}>${dxE(nm)}</option>`).join('')}</select></div>
    <label class="bk-f rm-form"><span>${dxE(t('dx_brkMsg'))}</span><textarea id="dx_bmsg" rows="9" lang="${L}" dir="${L === 'en' ? 'ltr' : 'rtl'}">${dxE(msg)}</textarea></label>
    <div class="btnrow"><button type="button" class="btn" id="dx_bcopy">📋 ${dxE(t('ds_copy'))}</button>${navigator.share ? `<button type="button" class="btn" id="dx_bshare">📤 ${dxE(t('ds_share'))}</button>` : ''}${dxHasPic(it) ? `<button type="button" class="btn" data-dxpic="${dxE(it.id)}">👁️ ${dxE(t('dx_rcpt'))}</button>` : ''}</div>
    <h4 class="ds-q">ℹ️ ${dxE(t('dx_infoH'))}</h4><ul class="mi-tips">${[1, 2, 3, 4, 5].map(i => `<li>${dxE(t('dx_info' + i))}</li>`).join('')}</ul><p class="fine">${dxE(t('dx_infoDisc'))}</p></div>`;
}

/* ---- 📈 bills ---- */
const dxBKey = it => ((it.meta || {}).period || String(it.date || '').slice(0, 7) || '') + '|' + (it.date || '') + '|' + (it.created || 0);
const dxBType = it => (it.meta || {}).type || 'other';
/* this bill against the average of the 3 bills of the same kind before it */
function dxBillAlert(it, all){
  const L = (all || dxOf('bill')).filter(x => dxBType(x) === dxBType(it) && x.id !== it.id && +x.amount > 0 && dxBKey(x) < dxBKey(it)).sort((a, b) => dxBKey(b).localeCompare(dxBKey(a))).slice(0, 3);
  if (L.length < 2 || !(+it.amount > 0)) return null; const avg = L.reduce((s, x) => s + +x.amount, 0) / L.length, pct = (+it.amount / avg - 1) * 100;
  return pct >= dxCfg().pct ? {avg, pct: Math.round(pct), n: L.length} : null;
}
function dxBillHTML(){
  const all = dxOf('bill'), types = DX_BILLS.filter(([k]) => all.some(x => dxBType(x) === k));
  return `<p class="fine">${dxE(t('dx_bIntro'))}</p>${dxAddBtn('bill')}${DXX.ed ? dxFormBill() : ''}
    ${types.map(([k, ic]) => { const L = all.filter(x => dxBType(x) === k).sort((a, b) => dxBKey(b).localeCompare(dxBKey(a))), last = L[0], al = last ? dxBillAlert(last, all) : null, H = L.slice(0, 6).reverse(), mx = Math.max(1, ...H.map(x => +x.amount || 0));
      const avg3 = L.slice(0, 3).filter(x => +x.amount > 0), av = avg3.length ? avg3.reduce((s, x) => s + +x.amount, 0) / avg3.length : 0;
      return `<section class="dx-sec" aria-labelledby="dxb_${k}"><h3 class="ds-q" id="dxb_${k}">${ic} ${dxE(t('dx_b_' + k))}</h3>
        ${al ? `<div class="ds-warn" role="status"><span aria-hidden="true">📈</span><div><p>${dxE(t('dx_bHigh', {p: al.pct, a: dxM(al.avg), n: al.n}))}</p>${(DX_CMP[k] || []).filter(dxTab).map(id => `<button type="button" class="btn" data-dxtab="${id}">↗ ${dxE(t('tab_' + id))}</button>`).join(' ')}</div></div>` : ''}
        ${H.length > 1 ? `<ul class="cx-sens mi-bars" aria-label="${dxE(t('dx_bHist', {n: t('dx_b_' + k)}))}">${H.map(x => `<li><span class="cx-l">${dxE(dxFmtM((x.meta || {}).period) || dxFmt(x.date))}</span><span class="cx-bar"><i class="${x === last && al ? 'dn' : 'up'}" style="width:${Math.max(3, Math.round((+x.amount || 0) / mx * 100))}%"></i></span><bdi dir="ltr" class="num cx-v">${dxE(dxM(x.amount) || '–')}</bdi></li>`).join('')}</ul>` : ''}
        ${av ? `<p class="fine">${dxE(t('dx_bAvg', {a: dxM(av), n: avg3.length}))}</p>` : ''}
        <ul class="rm-list">${L.slice(0, 12).map(dxBillRow).join('')}</ul></section>`; }).join('') || `<ul class="rm-list">${dxEmpty('dx_bNone')}</ul>`}
    <p class="fine sl-priv">🔒 ${dxE(t('dx_priv'))}</p>`;
}
function dxBillRow(it){
  const m = it.meta || {}, n = dxDays(it.date), cls = it.done ? 'done' : n < 0 ? 'late' : n <= 3 ? 'due' : '';
  return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${dxIc(it)}</div><div class="rm-b"><b dir="auto">${dxE(dxTitle(it))}${m.period ? ' · ' + dxE(dxFmtM(m.period)) : ''}</b>
    <span class="rm-w"><bdi dir="ltr">${dxE(dxM(it.amount))}</bdi>${it.date ? ' · ' + dxE(t('dx_bDue', {d: dxFmt(it.date)})) : ''} · <span class="rm-rel">${dxE(it.done ? t('dx_bPaid') + (m.paid ? ' ' + dxFmt(m.paid) : '') : it.date ? dxRel(it.date) : t('dx_bUnpaid'))}</span></span>
    <div class="rm-acts"><button type="button" class="mv" data-dxpay="${dxE(it.id)}">${it.done ? '↩️ ' + dxE(t('dx_bUnpay')) : '✓ ' + dxE(t('dx_paid'))}</button>${typeof expSheet === 'function' && +it.amount ? dxBtn('data-dxexp', it.id, '🧾', t('dx_toExp', {n: dxTitle(it)})) : ''}${dxCommon(it)}</div></div></li>`;
}

/* ---- 🏠 contracts ---- */
function dxContrHTML(){
  const L = dxOf('contract').sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return `<p class="fine">${dxE(t('dx_cIntro'))}</p>${dxAddBtn('contract')}${DXX.ed ? dxFormContr() : ''}
    <ul class="rm-list">${L.map(dxContrRow).join('') || dxEmpty('dx_cNone')}</ul><p class="fine">${dxE(t('dx_cNote'))}</p><p class="fine sl-priv">🔒 ${dxE(t('dx_priv'))}</p>`;
}
function dxContrRow(it){
  const m = it.meta || {}, end = m.end || it.date, nd = dxNotice(it), nn = nd ? dxDays(nd) : NaN, ne = dxDays(end), cls = ne < 0 ? 'done' : isFinite(nn) && nn >= 0 && nn <= 14 ? 'due' : '';
  return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${dxIc(it)}</div><div class="rm-b"><b dir="auto">${dxE(dxTitle(it))}</b>
    <span class="rm-w">${dxE([it.vendor, m.autoT ? '' : t('dx_ct_' + (m.ctype || 'other')), dxM(it.amount) ? dxM(it.amount) + ' ' + t('rn2_perMo') : ''].filter(Boolean).join(' · '))}</span>
    <span class="rm-w">${dxE([m.start ? dxFmt(m.start) : '', dxFmt(end)].filter(Boolean).join(' – '))} · <span class="rm-rel">${dxE(ne < 0 ? t('dx_cEnded') : dxRel(end))}</span>${m.auto === 'y' ? ' · 🔁 ' + dxE(t('dx_cAutoY')) : m.auto === 'n' ? ' · ' + dxE(t('dx_cAutoN')) : ''}</span>
    ${nd ? `<span class="rm-w">📣 ${dxE(t('dx_cNoticeBy', {d: dxFmt(nd), r: dxRel(nd)}))}</span>` : ''}${m.upd ? `<span class="rm-w">💱 ${dxE(t('dx_cUpdOn', {d: dxFmt(m.upd)}))}</span>` : ''}
    <div class="rm-acts">${m.ctype === 'rent' && dxTab('rentlaw') ? `<button type="button" class="mv" data-dxtab="rentlaw">↗ ${dxE(t('tab_rentlaw'))}</button>` : ''}${['insur', 'sub', 'gym'].includes(m.ctype) && m.start && dxTab('renewals') ? `<button type="button" class="mv" data-dxrn="${dxE(it.id)}">➕ ${dxE(t('dx_toRn'))}</button>` : ''}${dxCommon(it)}</div></div></li>`;
}

/* ---- 🪪 expiry dates ---- */
function dxIdHTML(){
  const L = dxOf('idexp').sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return `<p class="fine">${dxE(t('dx_iIntro'))}</p>${dxAddBtn('idexp')}${DXX.ed ? dxFormId() : ''}
    <ul class="rm-list">${L.map(it => { const n = dxDays(it.date), m = it.meta || {}, lead = Math.max(0, ...(m.leads || [90])), cls = n < 0 ? 'late' : n <= lead ? 'due' : '';
      return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${dxIc(it)}</div><div class="rm-b"><b dir="auto">${dxE(dxTitle(it))}</b>
        <span class="rm-w">${dxE(n < 0 ? t('dx_iExpd', {d: dxFmt(it.date)}) : t('dx_iUntil', {d: dxFmt(it.date)}))} · <span class="rm-rel">${dxE(dxRel(it.date))}</span></span>
        ${(m.leads || []).length ? `<small>⏰ ${dxE((m.leads || []).map(dxLeadName).join(' · '))}</small>` : ''}<div class="rm-acts">${dxCommon(it)}</div></div></li>`; }).join('') || dxEmpty('dx_iNone')}</ul>
    <p class="fine">${dxE(t('dx_iPass'))}</p><p class="fine sl-priv">🔒 ${dxE(t('dx_iPriv'))}</p>`;
}
const dxLeadName = n => n === 90 ? t('dx_l90') : n === 30 ? t('dx_l30') : n === 7 ? t('dx_l7') : n === 180 ? t('dx_l180') : t('rm_b_n', {n});

/* ================= the forms ================= */
const dxF = (id, lab, inner, req) => `<label class="bk-f"><span>${dxE(lab)}${req ? ' *' : ''}</span>${inner}</label>`;
const dxIn = (id, v, o) => `<input id="${id}" type="${(o && o.type) || 'text'}"${o && o.num ? ' inputmode="decimal" dir="ltr"' : ' dir="auto"'}${o && o.max ? ` maxlength="${o.max}"` : ''}${o && o.req ? ' required aria-required="true"' : ''}${o && o.ph ? ` placeholder="${dxE(o.ph)}"` : ''}${o && o.attr ? ' ' + o.attr : ''} value="${dxE(v == null ? '' : v)}">`;
const dxSel = (id, v, opts) => `<select id="${id}">${opts.map(([k, l]) => `<option value="${dxE(k)}"${String(v) === String(k) ? ' selected' : ''}>${dxE(l)}</option>`).join('')}</select>`;
const dxCk = (id, on, lab) => `<label class="prn-ck"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${dxE(lab)}</label>`;
function dxPhotoRow(it){
  if (!dxPics()) return `<p class="fine">🔒 ${dxE(t('vt_noPics'))}</p>`;
  const has = DXX.img || dxHasPic(it);
  return `<div class="btnrow dx-ph"><button type="button" class="btn" data-dxphb="cam">📷 ${dxE(t(has ? 'dx_phRe' : 'dx_phCam'))}</button><button type="button" class="btn" data-dxphb="pick">🖼️ ${dxE(t('vt_gallery'))}</button>
    <input type="file" accept="image/*" capture="environment" data-dxph="cam" hidden><input type="file" accept="image/*" data-dxph="pick" hidden><span class="fine" id="dxf_ph" aria-live="polite">${has ? '✓ ' + dxE(t(DXX.img ? 'dx_phNew' : 'vt_hasPhoto')) : ''}</span></div>`;
}
const dxFillNote = p => p && p._ai ? `<p class="fine gk-st new">✦ ${dxE(t('dx_fillAi'))}</p>` : p && p._ocr ? `<p class="fine gk-st new">🔤 ${dxE(t('dx_fillOcr'))}</p>` : '';
const dxFormEnd = it => `<p class="fine" id="dxf_msg" role="status" aria-live="polite"></p>
  <div class="btnrow"><button type="submit" class="gold-btn">✓ ${dxE(t('rm_save'))}</button><button type="button" class="btn" id="dxf_cancel">${dxE(t('rm_cancel'))}</button>${it ? `<button type="button" class="btn danger" data-dxdel="${dxE(it.id)}">🗑️ ${dxE(t('rm_delB'))}</button>` : ''}</div></fieldset></form>`;
const dxFormStart = (k, it) => `<form class="bk-acc rm-form" id="dx_form" data-k="${k}" novalidate><fieldset><legend>${it ? '✏️ ' + dxE(t('dx_edit_' + k)) : '＋ ' + dxE(t('dx_add_' + k))}</legend>${dxFillNote(DXX.pre)}`;
const dxEdItem = () => DXX.ed && DXX.ed !== 'new' ? dsiAll().find(x => x.id === DXX.ed) : null;
function dxFormWarr(){
  const it = dxEdItem(), m = (it && it.meta) || {}, p = DXX.pre || {}, mo = +m.months || 0, unit = p.unit || m.unit || (mo && mo % 12 === 0 ? 'y' : 'm');
  const v = {title: p.title != null ? p.title : it ? dxTitle(it) : '', vendor: p.vendor != null ? p.vendor : it ? it.vendor || '' : '', purchase: p.purchase || m.purchase || dxNow(), len: p.len || (mo ? (unit === 'y' ? mo / 12 : mo) : 12), amount: p.amount || (it ? it.amount || '' : ''), remind: m.remind != null ? m.remind : dxCfg().warr, rem: it ? !!m.rem : true};
  return dxFormStart('warranty', it) + dxF('dxf_title', t('dx_wProd'), dxIn('dxf_title', v.title, {max: 60, req: 1, ph: t('vt_namePh')}), 1)
    + `<div class="bk-grid">${dxF('dxf_vendor', t('vt_store'), dxIn('dxf_vendor', v.vendor, {max: 40}))}${dxF('dxf_purchase', t('vt_date'), dxIn('dxf_purchase', v.purchase, {type: 'date', req: 1}), 1)}</div>
    <div class="bk-f" role="group" aria-labelledby="dxf_lenL"><span id="dxf_lenL">${dxE(t('vt_months'))} *</span><div class="dx-len"><input id="dxf_len" type="number" inputmode="numeric" min="1" max="600" dir="ltr" value="${dxE(v.len)}" aria-label="${dxE(t('dx_wLen'))}" required>${dxSel('dxf_unit', unit, [['m', t('dx_months')], ['y', t('dx_years')]]).replace('<select', `<select aria-label="${dxE(t('dx_unit'))}"`)}</div>
      <div class="ds-chips">${[12, 24, 36].map(n => `<button type="button" class="ds-chip" data-dxlen="${n}">${dxE(t('dx_nMonths', {n}))}</button>`).join('')}</div></div>
    <p class="fine" id="dxf_endv" aria-live="polite"></p>
    <div class="bk-grid">${dxF('dxf_amount', t('vt_price') + ' (₪)', dxIn('dxf_amount', v.amount, {num: 1, max: 12}))}${dxF('dxf_remind', t('dx_remBefore'), dxSel('dxf_remind', v.remind, [7, 14, 30, 60, 90].map(n => [n, t('rm_b_n', {n})])))}</div>
    ${dxCk('dxf_rem', v.rem, t('dx_toRem'))}${dxPhotoRow(it)}` + dxFormEnd(it);
}
function dxFormBill(){
  const it = dxEdItem(), m = (it && it.meta) || {}, p = DXX.pre || {};
  const v = {type: p.type || m.type || 'elec', vendor: p.vendor != null ? p.vendor : it ? it.vendor || '' : '', period: p.period || m.period || dxNow().slice(0, 7), amount: p.amount || (it ? it.amount || '' : ''), date: p.date || (it ? it.date || '' : ''), paid: it ? !!it.done : false, rem: it ? !!m.rem : true};
  return dxFormStart('bill', it) + `<div class="bk-grid">${dxF('dxf_type', t('dx_bType'), dxSel('dxf_type', v.type, DX_BILLS.map(([k, ic]) => [k, ic + ' ' + t('dx_b_' + k)])))}${dxF('dxf_vendor', t('dx_bProv'), dxIn('dxf_vendor', v.vendor, {max: 40}))}
    ${dxF('dxf_period', t('dx_bPeriod'), dxIn('dxf_period', v.period, {type: 'month', attr: 'dir="ltr"'}))}${dxF('dxf_amount', t('dx_bAmt') + ' (₪)', dxIn('dxf_amount', v.amount, {num: 1, max: 12, req: 1}), 1)}
    ${dxF('dxf_date', t('dx_bDueL'), dxIn('dxf_date', v.date, {type: 'date'}))}</div>${dxCk('dxf_paid', v.paid, t('dx_bPaidQ'))}${dxCk('dxf_rem', v.rem, t('dx_toRem'))}${dxPhotoRow(it)}` + dxFormEnd(it);
}
function dxFormContr(){
  const it = dxEdItem(), m = (it && it.meta) || {}, p = DXX.pre || {};
  const v = {ctype: p.ctype || m.ctype || 'rent', title: p.title != null ? p.title : it && !m.autoT ? it.title : '', vendor: p.vendor != null ? p.vendor : it ? it.vendor || '' : '', start: p.start || m.start || '', end: p.end || m.end || '', notice: p.notice || m.notice || '', amount: p.amount || (it ? it.amount || '' : ''), upd: p.upd || m.upd || '', auto: p.auto != null && p.auto !== '' ? p.auto : m.auto || '', rem: it ? !!m.rem : true};
  return dxFormStart('contract', it) + `<div class="bk-grid">${dxF('dxf_ctype', t('dx_cType'), dxSel('dxf_ctype', v.ctype, DX_CT.map(([k, ic]) => [k, ic + ' ' + t('dx_ct_' + k)])))}${dxF('dxf_title', t('dx_cTitle'), dxIn('dxf_title', v.title, {max: 60, ph: t('dx_ct_' + v.ctype)}))}
    ${dxF('dxf_vendor', t('dx_cParty'), dxIn('dxf_vendor', v.vendor, {max: 40}))}${dxF('dxf_amount', t('dx_cPrice') + ' (₪)', dxIn('dxf_amount', v.amount, {num: 1, max: 12}))}
    ${dxF('dxf_start', t('dx_cStart'), dxIn('dxf_start', v.start, {type: 'date'}))}${dxF('dxf_end', t('dx_cEnd'), dxIn('dxf_end', v.end, {type: 'date', req: 1}), 1)}
    ${dxF('dxf_notice', t('dx_cNotice'), dxIn('dxf_notice', v.notice, {type: 'number', attr: 'inputmode="numeric" min="0" max="365" dir="ltr"'}))}${dxF('dxf_upd', t('dx_cUpd'), dxIn('dxf_upd', v.upd, {type: 'date'}))}
    ${dxF('dxf_auto', t('dx_cAuto'), dxSel('dxf_auto', v.auto, [['', t('dx_cAuto0')], ['y', t('dx_yes')], ['n', t('dx_no')]]))}</div>
    <p class="fine" id="dxf_endv" aria-live="polite"></p>${dxCk('dxf_rem', v.rem, t('dx_toRem'))}${dxPhotoRow(it)}` + dxFormEnd(it);
}
function dxFormId(){
  const it = dxEdItem(), m = (it && it.meta) || {}, p = DXX.pre || {}, ct = p.ctype || m.ctype || 'passport', leads = Array.isArray(m.leads) ? m.leads : [90, 30];
  return dxFormStart('idexp', it) + `<p class="fine">🔒 ${dxE(t('dx_iForm'))}</p><div class="bk-grid">${dxF('dxf_ctype', t('ds_cardType'), dxSel('dxf_ctype', ct, DX_IDT.map(k => [k, ((typeof DS_CARDS !== 'undefined' && DS_CARDS.find(c => c[0] === k)) || ['', ''])[1] + ' ' + t('ds_c_' + k)])))}
    ${dxF('dxf_nick', t('dx_iNick'), dxIn('dxf_nick', m.nick || '', {max: 30, ph: t('dx_iNickPh')}))}${dxF('dxf_date', t('dx_iDate'), dxIn('dxf_date', it ? it.date : '', {type: 'date', req: 1}), 1)}</div>
    <fieldset class="prn-cks"><legend class="fine">${dxE(t('dx_iWhen'))}</legend>${[180, 90, 30, 7].map(n => `<label class="prn-ck"><input type="checkbox" data-dxlead="${n}"${leads.includes(n) ? ' checked' : ''}> ${dxE(dxLeadName(n))}</label>`).join('')}</fieldset>
    ${dxCk('dxf_rem', it ? !!m.rem : true, t('dx_toRem'))}` + dxFormEnd(it);
}
/* the warranty's end date / the contract's notice date, shown while typing */
function dxLenSync(){
  const o = $('#dxf_endv'), f = $('#dx_form'); if (!o || !f) return;
  if (f.dataset.k === 'warranty'){ const n = +($('#dxf_len') || {}).value || 0, mo = ($('#dxf_unit') || {}).value === 'y' ? n * 12 : n, e = dxAddM(($('#dxf_purchase') || {}).value, mo); o.textContent = e ? '📅 ' + t('dx_wEnds', {d: dxFmt(e), r: dxRel(e)}) : ''; }
  else if (f.dataset.k === 'contract'){ const end = ($('#dxf_end') || {}).value, n = +($('#dxf_notice') || {}).value || 0, nd = n > 0 && dxParse(end) ? dxAdd(end, -n) : ''; o.textContent = nd ? '📣 ' + t('dx_cNoticeBy', {d: dxFmt(nd), r: dxRel(nd)}) : ''; }
}
const dxV = id => { const e = $('#' + id); return e ? String(e.value || '').trim() : ''; };
const dxCkV = id => { const e = $('#' + id); return !!(e && e.checked); };
function dxBad(id, key){ const m = $('#dxf_msg'); if (m) m.textContent = t(key); const e = $('#' + id); if (e){ e.setAttribute('aria-invalid', 'true'); e.focus(); } return false; }
async function dxSave(form){
  const k = form.dataset.k, old = dxEdItem(), img = DXX.img, rec = {kind: k};
  if (k === 'warranty'){
    const title = dxV('dxf_title'), purchase = dxV('dxf_purchase'), n = +dxV('dxf_len') || 0, months = dxV('dxf_unit') === 'y' ? n * 12 : n;
    if (!title) return dxBad('dxf_title', 'vt_needName'); if (!dxParse(purchase)) return dxBad('dxf_purchase', 'rm_needDate'); if (!(months > 0 && months <= 600)) return dxBad('dxf_len', 'dx_needLen');
    const amount = dxNum(dxV('dxf_amount')), vendor = dxV('dxf_vendor');
    let vid = old && old.fileId;
    if (typeof vtD === 'function'){ const v = vtD(); let vi = vid && v.items.find(x => x.id === vid); const vr = {name: dsiScrub(title, 60), store: dsiScrub(vendor, 40), date: purchase, price: amount > 0 ? String(amount) : '', months};
      if (vi) Object.assign(vi, vr); else { vid = dsiNewId(); vi = Object.assign({id: vid, note: ''}, vr); v.items.push(vi); }
      if (img && dxPics()){ try { await vtPut(vid, img); vi.img = 1; } catch (e) { toast(t('vt_picFail')); } } saveSet(); }
    Object.assign(rec, {title, vendor, date: dxAddM(purchase, months), amount: amount > 0 ? amount : '', fileId: vid || '', meta: {purchase, months, unit: dxV('dxf_unit'), remind: +dxV('dxf_remind') || 0, rem: dxCkV('dxf_rem')}});
  } else if (k === 'bill'){
    const amount = dxNum(dxV('dxf_amount')), type = dxV('dxf_type') || 'other', vendor = dxV('dxf_vendor'), date = dxV('dxf_date'), period = /^\d{4}-\d{2}$/.test(dxV('dxf_period')) ? dxV('dxf_period') : '';
    if (!(amount > 0)) return dxBad('dxf_amount', 'dx_needAmt'); if (date && !dxParse(date)) return dxBad('dxf_date', 'rm_needDate');
    const paid = dxCkV('dxf_paid');
    Object.assign(rec, {title: vendor || t('dx_b_' + type), vendor, date, amount, done: paid, meta: {type, period, rem: dxCkV('dxf_rem'), paid: paid ? ((old && old.meta && old.meta.paid) || dxNow()) : ''}});
  } else if (k === 'contract'){
    const ctype = dxV('dxf_ctype') || 'other', end = dxV('dxf_end'), start = dxV('dxf_start'), upd = dxV('dxf_upd'), notice = Math.max(0, Math.min(365, Math.round(+dxV('dxf_notice') || 0)));
    if (!dxParse(end)) return dxBad('dxf_end', 'dx_needEnd'); if (start && (!dxParse(start) || start > end)) return dxBad('dxf_start', 'dx_badStart');
    const amount = dxNum(dxV('dxf_amount')), nd = notice ? dxAdd(end, -notice) : '';
    Object.assign(rec, {title: dxV('dxf_title') || t('dx_ct_' + ctype), vendor: dxV('dxf_vendor'), date: nd && dxDays(nd) >= 0 ? nd : end, amount: amount > 0 ? amount : '', meta: {autoT: !dxV('dxf_title'), ctype, start: dxParse(start) ? start : '', end, notice, upd: dxParse(upd) ? upd : '', auto: dxV('dxf_auto'), rem: dxCkV('dxf_rem'), dd: []}});
    if (old) rec.done = false;
  } else if (k === 'idexp'){
    const ctype = dxV('dxf_ctype') || 'other', date = dxV('dxf_date'), nick = dsiScrub(dxV('dxf_nick').replace(/\d{4,}/g, ''), 30), leads = $$('#dx_form [data-dxlead]').filter(x => x.checked).map(x => +x.dataset.dxlead);
    if (!dxParse(date)) return dxBad('dxf_date', 'dx_needExp');
    Object.assign(rec, {title: t('ds_c_' + ctype) + (nick ? ' – ' + nick : ''), date, done: false, meta: {ctype, nick, leads, rem: dxCkV('dxf_rem')}});
  }
  let it = old ? dsiUpdate(old.id, rec) : dsiAdd(rec);
  /* the photo of a bill or a contract: kept under its own name in the vault's store */
  if (it && img && k !== 'warranty' && dxPics()){ try { const fid = it.fileId && String(it.fileId).startsWith('dsx-') ? it.fileId : 'dsx-' + it.id; await vtPut(fid, img); it = dsiUpdate(it.id, {fileId: fid, meta: {pic: 1}}); } catch (e) { toast(t('vt_picFail')); } }
  DXX.ed = null; DXX.pre = null; DXX.img = null; dscRender();
  const al = it && k === 'bill' ? dxBillAlert(it) : null;
  toast(al ? t('dx_bHighT', {p: al.pct}) : t(old ? 'dx_saved' : 'dx_added'));
  setTimeout(() => { const a = $('#dx_add'); if (a) a.focus({preventScroll: true}); if (al){ const w = $('#ds_root .dx-sec .ds-warn'); if (w) w.scrollIntoView({block: 'center', behavior: 'smooth'}); } }, 40);
  return true;
}

/* ================= hooks into the scanner ================= */
/* the AI's first look also says whether it is a receipt, a bill or a contract */
const DX_CLS_Q = 'Look at this photo and say what kind of document it is.';
const DX_CLS_ADD = ' Also add to the JSON "doc": "receipt" (a shop receipt or invoice for something bought), "warranty" (a warranty card), "bill" (an electricity, water, gas, arnona, phone or internet bill), "contract" (a rental, lease, subscription, gym or insurance contract or policy) or "" for anything else.';
{
  const askX = dsAsk;
  dsAsk = async function(prompt){
    const a = Array.from(arguments), cls = typeof prompt === 'string' && prompt.startsWith(DX_CLS_Q); if (cls) a[0] = prompt + DX_CLS_ADD;
    const r = await askX.apply(this, a); if (cls) DXX.cls = r && typeof r === 'object' ? String(r.doc || '') : ''; return r;
  };
}
const DX_DOC = {receipt: 'warranty', warranty: 'warranty', bill: 'bill', contract: 'contract'};
function dxOfferHTML(main, how, attr){
  return `<div class="mx-card dx-offer"><h4 class="ds-q">📂 ${dxE(t(main ? 'dx_off_' + main : 'dx_offQ'))}</h4><p class="fine">${dxE(t(how))}</p>
    <div class="btnrow">${['warranty', 'bill', 'contract'].map(k => `<button type="button" class="${k === main ? 'gold-btn' : 'btn'}" ${attr}="${k}">${DX_IC[k]} ${dxE(t('dx_track_' + k))}</button>`).join('')}</div></div>`;
}
function dxKindsAdd(root){
  if (DSX.det){
    const D = DSX.det; if (D.dx == null){ D.dx = DXX.cls || ''; DXX.cls = ''; }
    if (D.k === 'card' || !slEngine() || root.querySelector('.dx-offer')) return; const row = root.querySelector('#ds_detok'); if (!row) return;
    row.closest('.btnrow').insertAdjacentHTML('afterend', dxOfferHTML(DX_DOC[D.dx] || '', 'dx_offAi', 'data-dxdet'));
    return;
  }
  if (root.querySelector('.dx-hub')) return; const ks = root.querySelector('.ds-kinds'); if (!ks) return;
  ks.insertAdjacentHTML('afterend', `<section class="dx-hub" aria-labelledby="dx_hubh"><h3 class="ds-q" id="dx_hubh">📂 ${dxE(t('dx_hubH'))}</h3><div class="ds-chips">${DX_VIEWS.map(([k, ic]) => `<button type="button" class="ds-chip" data-dxgo="${k}">${ic} ${dxE(t('dx_v_' + k))}${k === 'wait' ? dxBadgeHTML() : ''}</button>`).join('')}</div></section>`);
}
{
  const dsrX = dscRender;
  dscRender = function(){
    const root = $('#ds_root');
    if (root && DSX.view === 'dx') return dxRender(root);
    const r = dsrX.apply(this, arguments);
    try { if (root && DSX.view === 'kinds') dxKindsAdd(root); } catch (e) {}
    return r;
  };
  /* after a card or a page is scanned: an expiry reminder for a personal card (the date is typed, nothing is read), or tracking for a receipt, bill or contract (read on the phone) */
  const dcrX = dsCardRender;
  dsCardRender = function(root){
    const r = dcrX.apply(this, arguments);
    try {
      if (DSC && !DSC.cur && DSC.pages.length && !root.querySelector('.dx-offer')){ const pg = root.querySelector('.ds-pages');
        if (pg){ const idc = DX_IDT.includes(DSC.type) && DSC.type !== 'other';
          pg.insertAdjacentHTML('afterend', idc ? `<div class="mx-card dx-offer"><h4 class="ds-q">⏰ ${dxE(t('dx_off_idexp'))}</h4><p class="fine">${dxE(t('dx_offId'))}</p><div class="btnrow"><button type="button" class="gold-btn" data-dxcard="idexp">🪪 ${dxE(t('dx_add_idexp'))}</button></div></div>`
            : dxOfferHTML(DSC.type === 'receipt' ? 'warranty' : '', typeof ocrText === 'function' || String(DSC.ocr || '').trim() ? 'dx_offOcr' : 'dx_offHand', 'data-dxcard').replace('</div></div>', DSC.type === 'other' ? `<button type="button" class="btn" data-dxcard="idexp">🪪 ${dxE(t('dx_add_idexp'))}</button></div></div>` : '</div></div>')); } }
    } catch (e) {}
    return r;
  };
  /* letters: every "do this by" date goes into "waiting for you" (with an undo), and a bill or contract can be tracked */
  const dlrX = dsLetterRender;
  dsLetterRender = function(root){
    const r = dlrX.apply(this, arguments);
    try { dxLetterHook(root); } catch (e) {}
    return r;
  };
  const icsX = dsIcs;
  dsIcs = async function(i){ const r = await icsX.apply(this, arguments); try { const a = dsArr(DSL.j.actions)[i], d = a && dsIcsDate(a.deadline); if (d){ const x = dxLetterAdd(a, d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6)); if (x && x.isNew && DSL._dx) DSL._dx.ids.push(x.it.id); } } catch (e) {} return r; };
}
function dxLetterAdd(a, iso){
  const j = DSL.j, title = dsiScrub(a.what || j.title || t('ds_k_letter'), 80), ex = dsiAll().find(x => x.kind === 'letter' && x.title === title && x.date === iso);
  if (ex) return {it: ex, isNew: false};
  return {it: dsiAdd({kind: 'letter', title, date: iso, vendor: j.from || '', meta: {lt: dsiScrub(j.title || '', 80), lead: 3}}), isNew: true};
}
function dxLetterHook(root){
  if (!DSL || !DSL.j) return;
  if (!DSL._dx){ DSL._dx = {ids: [], n: 0}; dsArr(DSL.j.actions).forEach(a => { const d = dsIcsDate(a.deadline); if (!d) return; const x = dxLetterAdd(a, d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6)); if (x && x.it){ DSL._dx.n++; if (x.isNew) DSL._dx.ids.push(x.it.id); } }); }
  const n = DSL._dx.undone ? 0 : DSL._dx.n, out = root.querySelector('.ds-out'); if (!out || root.querySelector('.dx-offer')) return;
  out.insertAdjacentHTML('afterend', (n ? `<div class="ds-found ds-found-s dx-ladd" role="status">⏰ <span>${dxE(t('dx_lAdded', {n}))}</span> <button type="button" class="lg-a" data-dxgo="wait">${dxE(t('dx_open'))}</button>${DSL._dx.ids.length ? ` <button type="button" class="lg-a" id="dx_lundo">${dxE(t('dx_undo'))}</button>` : ''}</div>` : '')
    + (slEngine() && DSL.blobs && DSL.blobs.length ? dxOfferHTML('', 'dx_offLet', 'data-dxlet') : ''));
}

/* ================= on Home ================= */
function dxHome(){
  const hh = $('#hh'); let box = $('#hdsx'), rows = [];
  try { if (isMember()) rows = dxDueRows(); } catch (e) {}
  if (!hh || !rows.length){ if (box) box.remove(); return; }
  if (!box){ ($('#hrm') || hh).insertAdjacentHTML('afterend', '<div id="hdsx" class="hrm"></div>'); box = $('#hdsx'); }
  box.innerHTML = `<button type="button" class="hrm-in" id="hdsx_go"><span class="hrm-h">📂 ${dxE(t('dx_homeH', {n: rows.length}))}</span>${rows.slice(0, 3).map(r => `<span class="hrm-r${dxDays(r.d) < 0 ? ' late' : ''}">${dxIc(r.it)} <b dir="auto">${dxE(r.w)}</b> · ${dxE(dxRel(r.d))}</span>`).join('')}${rows.length > 3 ? `<span class="hrm-m">${dxE(t('rm_more', {n: rows.length - 3}))}</span>` : ''}</button>`;
}

/* ================= events ================= */
function dxIcsAll(){
  const rows = dxOpenRows().filter(r => !dxSnoozed(r.it) && dxDays(r.d) >= 0); if (!rows.length){ toast(t('dx_noneAll')); return; }
  const L = rows.map(r => ({id: r.key.replace(/[^\w-]/g, '-'), date: r.d, time: '', title: r.w, note: [r.it.vendor, dxM(r.it.amount)].filter(Boolean).join(' · '), rep: 'none', before: Math.max(0, ...r.leads)}));
  if (typeof rmIcs === 'function') rmIcs(L, t('dx_v_wait'));
}
async function dxCardGo(k){
  if (k === 'idexp'){ dxOpen('idexp', 'new', {ctype: DX_IDT.includes(DSC.type) ? DSC.type : 'other'}); return; }
  const st = $('#ds_root .dx-offer .fine'); if (st) st.textContent = '⏳ ' + t('dx_reading');
  let c = null, blob = null, txt = '';
  try { c = dsCompose(DSC.pages[0], 1600); blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)); } catch (e) {}
  try { if (c) txt = await dxOcr(c); } catch (e) {}
  DXX.img = blob; dxOpen(k, 'new', txt ? dxGuess(k, txt) : {});
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#hdsx_go')){ dxOpen('wait'); return; }
  if (!t0.closest('#ds_root')) return;
  if ((b = t0.closest('[data-dxgo]'))){ const k = b.dataset.dxgo; DXX.f = DXX.v === k ? DXX.f : DXX.f; dxOpen(k, b.dataset.dxnew ? 'new' : null); return; }
  if ((b = t0.closest('[data-dxdet]'))){ const D = DSX.det; if (D && D.files && D.files[0]) dxScanAi(b.dataset.dxdet, D.files[0], b); return; }
  if ((b = t0.closest('[data-dxlet]'))){ if (DSL && DSL.blobs && DSL.blobs[0]){ DSL._dx = DSL._dx || {ids: [], n: 0}; dxScanAi(b.dataset.dxlet, DSL.blobs[0], b); } return; }
  if ((b = t0.closest('[data-dxcard]'))){ if (DSC) dxCardGo(b.dataset.dxcard); return; }
  if (t0.closest('#dx_lundo')){ (DSL._dx.ids || []).forEach(dsiRemove); DSL._dx.ids = []; DSL._dx.undone = true; toast(t('dx_undone')); dscRender(); return; }
  if (DSX.view !== 'dx') return;
  if (t0.closest('#dx_back')){ if (DXX.ed){ DXX.ed = null; DXX.pre = null; DXX.img = null; dscRender(); return; } DSX.view = 'kinds'; dscRender(); const r = $('#ds_root'); if (r) r.scrollIntoView({block: 'start', behavior: 'smooth'}); return; }
  if ((b = t0.closest('#dx_add'))){ DXX.ed = 'new'; DXX.pre = null; DXX.img = null; dscRender(); const f = $('#dx_form input, #dx_form select'); if (f) f.focus(); return; }
  if (t0.closest('#dxf_cancel')){ DXX.ed = null; DXX.pre = null; DXX.img = null; dscRender(); const a = $('#dx_add'); if (a) a.focus(); return; }
  if ((b = t0.closest('[data-dxphb]'))){ const i = $(`#dx_form input[data-dxph="${b.dataset.dxphb}"]`); if (i) i.click(); return; }
  if ((b = t0.closest('[data-dxlen]'))){ const l = $('#dxf_len'), u = $('#dxf_unit'); if (l){ l.value = b.dataset.dxlen; if (u) u.value = 'm'; dxLenSync(); } return; }
  if ((b = t0.closest('[data-dxf]'))){ DXX.f = b.dataset.dxf; DXX.snz = null; dscRender(); const n = $(`[data-dxf="${CSS.escape(DXX.f)}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dxwf]'))){ DXX.wf = b.dataset.dxwf; dscRender(); const n = $(`[data-dxwf="${DXX.wf}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dxed]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxed); if (!it) return; DXX.v = ['warranty', 'bill', 'contract', 'idexp'].includes(it.kind) ? it.kind : DXX.v; DXX.ed = it.id; DXX.pre = null; DXX.img = null; dscRender(); const f = $('#dx_form input, #dx_form select'); if (f){ f.focus(); f.scrollIntoView({block: 'center', behavior: 'smooth'}); } return; }
  if ((b = t0.closest('[data-dxdel]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxdel); if (!it || !confirm(t(it.kind === 'warranty' && it.fileId ? 'dx_delQW' : 'rm_delQ', {t: dxTitle(it)}))) return; dsiRemove(it.id); if (DXX.ed === it.id){ DXX.ed = null; DXX.img = null; } dscRender(); toast(t('dx_deleted')); const a = $('#dx_add') || $('#dx_back'); if (a) a.focus(); return; }
  if ((b = t0.closest('[data-dxpic]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxpic); if (it && it.fileId && typeof vtShow === 'function') vtShow(it.fileId).then(() => { const h = $('#vtx h3'), im = $('#vtx_img'); if (h) h.textContent = dxTitle(it); if (im) im.alt = dxTitle(it); const x = $('#vtx_x'); if (x) x.focus(); }); return; }
  if ((b = t0.closest('[data-dxdone]'))){ const k = b.dataset.dxdone; dxRowDone(k); dscRender(); const n = $('#ds_root [data-dxdone]') || $('#dx_back'); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dxundo]'))){ dsiUpdate(b.dataset.dxundo, {done: false, meta: {dd: [], paid: ''}}); dscRender(); toast(t('dx_undone')); return; }
  if ((b = t0.closest('[data-dxsnz]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxsnz); if (!it) return; if (dxSnoozed(it)){ dsiUpdate(it.id, {meta: {snooze: ''}}); DXX.snz = null; } else DXX.snz = DXX.snz === it.id ? null : it.id; dscRender(); const n = $(`[data-dxsnz="${it.id}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dxsz]'))){ const d = dxAdd(dxNow(), +b.dataset.n || 1); dsiUpdate(b.dataset.dxsz, {meta: {snooze: d}}); DXX.snz = null; dscRender(); toast(t('dx_snzOk', {d: dxFmt(d)})); return; }
  if ((b = t0.closest('[data-dxopen]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxopen); if (!it) return;
    if (typeof DSI_OPEN[it.kind] === 'function'){ try { DSI_OPEN[it.kind](it); } catch (er) {} return; }
    if (it.meta && it.meta.go && dxTab(it.meta.go)){ activate(it.meta.go); return; }
    DXX.v = it.kind; DXX.ed = null; DXX.wf = 'all'; dscRender(); return; }
  if ((b = t0.closest('[data-dxpay]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxpay); if (!it) return; dsiUpdate(it.id, it.done ? {done: false, meta: {paid: ''}} : {done: true, meta: {paid: dxNow()}}); dscRender(); toast(t(it.done ? 'dx_undone' : 'dx_paidOk')); const n = $(`[data-dxpay="${it.id}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-dxexp]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxexp); if (!it) return; activate('expenses'); try { EXP_CAT = 'bills'; expSheet(null); } catch (er) { return; }
    setTimeout(() => { const a = $('#exp_amt'), dt = $('#exp_date'), n = $('#exp_note'); if (a){ a.value = it.amount; a.dispatchEvent(new Event('input', {bubbles: true})); } const d0 = (it.meta && it.meta.paid) || it.date; if (dt && d0 && d0 <= dxNow()) dt.value = d0; if (n) n.value = dxTitle(it) + ((it.meta || {}).period ? ' ' + it.meta.period : ''); }, 60); return; }
  if ((b = t0.closest('[data-dxtab]'))){ activate(b.dataset.dxtab); return; }
  if ((b = t0.closest('[data-dxrn]'))){ const it = dsiAll().find(x => x.id === b.dataset.dxrn); if (!it || typeof miD !== 'function') return; const d = miD('renewals'), m = it.meta || {}; if (!Array.isArray(d.items)) d.items = [];
    if (d.items.some(x => x.name === dxTitle(it).slice(0, 40) && x.start === m.start)){ toast(t('dx_rnExists')); return; }
    d.items.push({name: dxTitle(it).slice(0, 40), type: m.ctype === 'insur' ? 'insur' : 'other', price: it.amount ? String(it.amount) : '', start: m.start}); saveSet(); toast(t('dx_rnOk')); return; }
  if ((b = t0.closest('[data-dxbrk]'))){ DXX.broke = DXX.broke === b.dataset.dxbrk ? null : b.dataset.dxbrk; dscRender(); const n = DXX.broke ? $('#dx_bmsg') : $(`[data-dxbrk="${b.dataset.dxbrk}"]`); if (n){ n.focus({preventScroll: true}); n.scrollIntoView({block: 'center', behavior: 'smooth'}); } return; }
  if (t0.closest('#dx_bcopy')){ copyText(($('#dx_bmsg') || {}).value || ''); toast(t('st_copied')); return; }
  if (t0.closest('#dx_bshare')){ try { navigator.share({text: ($('#dx_bmsg') || {}).value || ''}).catch(() => {}); } catch (er) {} return; }
  if (t0.closest('#dx_ics')){ dxIcsAll(); return; }
  if (t0.closest('#dx_remAll')){ const L = dsiAll().filter(x => !x.done && !(x.meta && x.meta.rem) && dxRows(x).some(r => dxDays(r.d) >= 0)); L.forEach(x => dsiUpdate(x.id, {meta: {rem: true}})); toast(t(L.length ? 'fc_addedN' : 'dx_remNone', {n: L.length})); return; }
});
document.addEventListener('submit', e => { if (e.target && e.target.id === 'dx_form'){ e.preventDefault(); dxSave(e.target).catch(() => toast(t('dx_saveFail'))); } });
document.addEventListener('input', e => { const el = e.target; if (!el || !el.closest || !el.closest('#dx_form')) return; el.removeAttribute('aria-invalid'); if (['dxf_len', 'dxf_purchase', 'dxf_end', 'dxf_notice'].includes(el.id)) dxLenSync(); });
document.addEventListener('change', async e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'dx') return;
  if (['dxf_unit', 'dxf_purchase', 'dxf_end'].includes(el.id)){ dxLenSync(); return; }
  if (el.id === 'dxf_ctype' && $('#dxf_title')){ $('#dxf_title').placeholder = t('dx_ct_' + el.value); return; }
  if (el.id === 'dx_bl'){ DXX.bl = el.value; const it = dsiAll().find(x => x.id === el.dataset.id), ta = $('#dx_bmsg'); if (it && ta){ ta.value = dxBrokeMsg(it, el.value); ta.lang = el.value; ta.dir = el.value === 'en' ? 'ltr' : 'rtl'; } return; }
  if (el.id === 'dxc_pct'){ const v = Math.round(+el.value); if (v >= 5 && v <= 300){ dxCfg().pct = v; saveSet(); toast(t('dx_saved')); } return; }
  if (el.id === 'dxc_warr'){ dxCfg().warr = +el.value; saveSet(); dsiAll().filter(x => x.kind === 'warranty' && x.meta && x.meta.rem && x.meta.remind == null).forEach(dxRemSync); toast(t('dx_saved')); return; }
  if (el.hasAttribute('data-dxph') && el.files && el.files[0]){
    if ((SET.photoAccess || 'ask') === 'never'){ toast(t('pha_blocked')); el.value = ''; return; }
    try { DXX.img = await vtShrink(el.files[0], 1600); const s = $('#dxf_ph'); if (s) s.textContent = '✓ ' + t('dx_phNew'); } catch (er) { toast(t('ph_fail')); } el.value = '';
  }
});

/* ================= wiring ================= */
(function(){
  const st = document.createElement('style');
  st.textContent = '.dx-hub{margin:14px 0 4px}.dx-hub .ds-chips,.dx-offer .btnrow{flex-wrap:wrap}.dx-nav{margin:6px 0 4px}.dx-n{display:inline-block;min-width:1.35em;padding:0 5px;margin-inline-start:4px;border-radius:999px;background:#b42318;color:#fff;font-size:.76rem;font-weight:700;line-height:1.5;text-align:center}'
    + '.dx-offer{margin:12px 0}.dx-sec{margin:12px 0 4px}.dx-len{display:flex;gap:6px}.dx-len input{flex:1 1 40%;min-width:0}.dx-len select{flex:1 1 60%}.dx-brk{margin-top:8px}.dx-brk textarea{min-height:12em}.dx-ladd{flex-wrap:wrap;gap:6px}#dx_form .ds-chips{margin-top:4px}#dx_form [aria-invalid=true]{border-color:#b42318}';
  document.head.appendChild(st);
})();
try { GS_SYN.docscan += ' אחריות קבלה תעודת אחריות חשבון חשבונות חשמל מים ארנונה גז חוזה שכירות מנוי ביטוח הודעה מוקדמת תוקף דרכון תעודה פג תוקף מחכה לך warranty receipt bill bills electricity water arnona contract lease subscription notice expiry passport waiting كفالة إيصال فاتورة كهرباء مياه أرنونا عقد إيجار اشتراك إشعار انتهاء جواز بانتظارك'; } catch (e) {}
{
  const actDx = activate; activate = function(id){ const r = actDx.apply(this, arguments); try { if (id === 'home') dxHome(); } catch (e) {} return r; };
  const alDx = applyLang; applyLang = function(){ const r = alDx.apply(this, arguments); try { dxHome(); } catch (e) {} return r; };
  if (typeof calcHome === 'function'){ const chDx = calcHome; calcHome = function(){ const r = chDx.apply(this, arguments); try { dxHome(); } catch (e) {} return r; }; }
  setTimeout(() => { try { dxHome(); } catch (e) {} }, 300);
}
