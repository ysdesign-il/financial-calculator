/* ================= tools: monthly expenses + client manager for accountants ================= */
const EXP_CATS = [
  ['home', '🏠', '#5B8CFF'], ['bills', '💡', '#F5A524'], ['food', '🛒', '#2FD08A'], ['car', '🚗', '#F0705A'],
  ['health', '💊', '#E46A8F'], ['kids', '🎓', '#A47BFF'], ['comm', '📱', '#38BDF8'], ['insur', '🛡️', '#94A3B8'],
  ['fun', '🎉', '#FB7185'], ['clothes', '👕', '#C084FC'], ['debt', '💳', '#EF4444'], ['save', '💰', '#22C55E'],
  ['gifts', '🎁', '#F472B6'], ['other', '📦', '#A3A3A3']
];
const CL_TYPES = ['patur', 'murshe', 'ltd', 'salaried', 'npo', 'other'];
const CL_STATUS = [['active', '#2fbf86'], ['docs', '#F5A524'], ['work', '#5B8CFF'], ['done', '#94A3B8']];
function toolsLoad(k, def){ try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : def; } catch (e) { return def; } }
function toolsSave(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function tEsc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function tId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function ymOf(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function ymAdd(ym, n){ const [y, m] = ym.split('-').map(Number); return ymOf(new Date(y, m - 1 + n, 1)); }
function ymLabel(ym){ const [y, m] = ym.split('-').map(Number); try { return new Intl.DateTimeFormat(locOf(), {month: 'long', year: 'numeric'}).format(new Date(y, m - 1, 1)); } catch (e) { return ym; } }
function dLabel(iso){ const [y, m, d] = iso.split('-').map(Number); try { return new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'short'}).format(new Date(y, m - 1, d)); } catch (e) { return iso; } }
function todayIso(){ const d = new Date(); return ymOf(d) + '-' + String(d.getDate()).padStart(2, '0'); }
function expCur(){ return baseCur || 'ILS'; }

/* ---------- monthly expenses ---------- */
const EXP_PAY = ['card', 'cash', 'bit', 'transfer', 'standing', 'check', 'other'];
const EXP_COUNTRIES = {IL:'ILS', US:'USD', GB:'GBP', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', PT:'EUR', NL:'EUR', BE:'EUR', AT:'EUR', GR:'EUR', CY:'EUR', IE:'EUR', FI:'EUR', HR:'EUR', ME:'EUR', CH:'CHF',
  CZ:'CZK', HU:'HUF', PL:'PLN', RO:'RON', BG:'BGN', RS:'RSD', GE:'GEL', AZ:'AZN', DK:'DKK', SE:'SEK', NO:'NOK', IS:'ISK', TR:'TRY', AE:'AED', BH:'BHD', EG:'EGP', JO:'JOD', MA:'MAD',
  TH:'THB', VN:'VND', IN:'INR', LK:'LKR', MV:'MVR', PH:'PHP', ID:'IDR', SG:'SGD', JP:'JPY', CN:'CNY', KR:'KRW', AU:'AUD', NZ:'NZD', CA:'CAD', MX:'MXN', BR:'BRL', AR:'ARS',
  ZA:'ZAR', KE:'KES', ET:'ETB', UA:'UAH', RU:'RUB'};
function flagOf(cc){ return String.fromCodePoint(...cc.split('').map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)); }
function ccName(cc){ try { return new Intl.DisplayNames([lang, 'en'], {type: 'region'}).of(cc) || cc; } catch (e) { return cc; } }
function fxConv(x, from, to){ if (from === to || !RATES[from] || !RATES[to]) return x; return x / RATES[from] * RATES[to]; }
var EXP = null, EXP_M = '', EXP_F = '', EXP_CAT = 'food', EXP_VIEW = 'cat', EXP_ED = null;
function expData(){
  if (!EXP){ EXP = toolsLoad('fin-exp', {items: []}); if (!Array.isArray(EXP.items)) EXP.items = []; EXP.budgets = EXP.budgets || {}; EXP.income = EXP.income || {}; EXP.last = EXP.last || {cc: 'IL', pay: 'card'}; }
  return EXP;
}
function expBase(it){ return fxConv(it.amt, it.bc || expCur(), expCur()); }             // every amount, in today's display currency
function expMonthItems(ym){
  return expData().items.filter(it => {
    const m0 = it.date.slice(0, 7);
    if (!it.rec) return m0 === ym;
    return m0 <= ym && (!it.end || ym <= it.end);
  }).map(it => it.rec && it.date.slice(0, 7) !== ym ? Object.assign({}, it, {date: ym + it.date.slice(7), copy: true}) : it);
}
function expKey(it, view){ return view === 'pay' ? (it.pay || 'other') : view === 'cc' ? (it.cc || 'IL') : it.cat; }
function expTotals(ym, view){
  const by = {}; let sum = 0;
  expMonthItems(ym).forEach(it => { const v = expBase(it), k = expKey(it, view || 'cat'); by[k] = (by[k] || 0) + v; sum += v; });
  return {by, sum};
}
function expIncome(ym){ const inc = expData().income; if (inc[ym] != null) return {v: +inc[ym], own: true}; const ks = Object.keys(inc).filter(k => k < ym).sort(); return ks.length ? {v: +inc[ks[ks.length - 1]], own: false} : null; }
const EXP_PALETTE = ['#5B8CFF', '#F5A524', '#2FD08A', '#F0705A', '#E46A8F', '#A47BFF', '#38BDF8', '#94A3B8', '#FB7185', '#C084FC', '#22C55E', '#F472B6'];
function expensesPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-expenses" role="tabpanel" aria-labelledby="tab-expenses" hidden>
    <div class="ex-month"><button type="button" class="ex-nav" data-exm="-1" data-ia="ex_prev">‹</button><b id="exp_ml"></b><button type="button" class="ex-nav" data-exm="1" data-ia="ex_next">›</button></div>
    <div class="exp-hero" id="exp_hero"></div>
    <div class="exp-tools"><button type="button" class="gold-btn" data-expadd="1" data-i="exp_add"></button><button type="button" class="btn" id="exp_budBtn" data-i="exp_budgets"></button></div>
    <div class="exp-vh"><h3 class="sec-t" data-i="exp_breakdown"></h3><div class="seg exp-views" id="exp_views" role="group"></div></div>
    <div class="exp-chart" id="exp_chart"></div>
    <div class="exp-list-h"><h3 class="sec-t" data-i="exp_list"></h3><button type="button" class="as-chip" id="exp_clear" hidden></button></div>
    <div class="exp-list" id="exp_list"></div>
    <p class="fine" data-i="tools_local"></p>
    <button type="button" class="exp-fab" data-expadd="1" data-ia="exp_add">+</button>
  </section>`;
}
function expSegs(){ return {cat: 'exp_vCat', pay: 'exp_vPay', cc: 'exp_vCc'}; }
function expMeta(view, k, i){
  if (view === 'pay') return {ic: {card: '💳', cash: '💵', bit: '📲', transfer: '🏦', standing: '🔁', check: '🧾', other: '📦'}[k] || '📦', name: t('pay_' + k), col: EXP_PALETTE[EXP_PAY.indexOf(k) % EXP_PALETTE.length]};
  if (view === 'cc') return {ic: flagOf(k), name: ccName(k), col: EXP_PALETTE[i % EXP_PALETTE.length]};
  const c = EXP_CATS.find(x => x[0] === k) || EXP_CATS[EXP_CATS.length - 1]; return {ic: c[1], name: t('ec_' + c[0]), col: c[2]};
}
function expRender(){
  const box = $('#panel-expenses'); if (!box) return;
  if (!EXP_M) EXP_M = ymOf(new Date());
  const c = expCur(), data = expData(), cur = expTotals(EXP_M), prev = expTotals(ymAdd(EXP_M, -1)), items = expMonthItems(EXP_M), inc = expIncome(EXP_M);
  $('#exp_ml').textContent = ymLabel(EXP_M);
  const diff = cur.sum - prev.sum, pct = prev.sum ? diff / prev.sum * 100 : 0;
  const left = inc ? inc.v - cur.sum : null, used = inc && inc.v > 0 ? Math.min(100, cur.sum / inc.v * 100) : 0;
  $('#exp_hero').innerHTML = `<span class="l">${tEsc(t('exp_total'))}</span><b class="v num">${M(cur.sum, 0, c)}</b>
    <span class="s">${items.length ? tEsc(t('exp_count', {n: items.length})) : tEsc(t('exp_none'))}${prev.sum ? ` · <span class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '▲' : '▼'} ${M(Math.abs(diff), 0, c)} (${Math.abs(pct).toFixed(0)}%)</span> ${tEsc(t('exp_vsPrev'))}` : ''}</span>
    <div class="exp-inc"><label for="exp_incIn">${tEsc(t('exp_income'))}</label><input id="exp_incIn" type="text" inputmode="decimal" value="${inc ? Math.round(inc.v) : ''}" placeholder="${tEsc(t('exp_incPh'))}">${inc && !inc.own ? `<small>${tEsc(t('exp_incCarry'))}</small>` : ''}</div>
    ${inc ? `<div class="exp-left ${left < 0 ? 'neg' : ''}"><span>${tEsc(t(left < 0 ? 'exp_over' : 'exp_left'))}</span><b class="num">${M(Math.abs(left), 0, c)}</b></div><span class="exp-meter"><i style="width:${used.toFixed(1)}%"></i></span>` : ''}`;
  const segs = expSegs();
  $('#exp_views').innerHTML = Object.keys(segs).map(k => `<button type="button" data-expv="${k}" aria-pressed="${EXP_VIEW === k}">${tEsc(t(segs[k]))}</button>`).join('');
  const tot = expTotals(EXP_M, EXP_VIEW), prevV = expTotals(ymAdd(EXP_M, -1), EXP_VIEW), budgets = data.budgets;
  const keys = EXP_VIEW === 'cat' ? EXP_CATS.map(x => x[0]).filter(k => tot.by[k] || budgets[k]) : Object.keys(tot.by);
  const rows = keys.map((k, i) => Object.assign({k, v: tot.by[k] || 0, p: tot.sum ? (tot.by[k] || 0) / tot.sum * 100 : 0, b: EXP_VIEW === 'cat' ? +budgets[k] || 0 : 0}, expMeta(EXP_VIEW, k, i))).sort((a, b) => b.v - a.v);
  let acc = 0;
  const arcs = rows.filter(r => r.v > 0).map(r => { const a0 = acc; acc += r.p; return `${r.col} ${a0.toFixed(2)}% ${acc.toFixed(2)}%`; }).join(',');
  $('#exp_chart').innerHTML = rows.length ? `${tot.sum ? `<div class="exp-donut" style="background:conic-gradient(${arcs})" role="img" aria-label="${tEsc(t(segs[EXP_VIEW]))}"><div><b class="num">${M(tot.sum, 0, c)}</b><small>${tEsc(ymLabel(EXP_M))}</small></div></div>` : ''}
    <div class="exp-bars">${rows.map(r => { const over = r.b && r.v > r.b, w = r.b ? Math.min(100, r.v / r.b * 100) : Math.max(2, r.p);
      return `<button type="button" class="exp-bar${EXP_F === EXP_VIEW + ':' + r.k ? ' on' : ''}${over ? ' over' : ''}" data-exf="${EXP_VIEW}:${r.k}" style="--cc:${r.col}">
      <span class="eb-h"><span>${r.ic} ${tEsc(r.name)}</span><b class="num">${M(r.v, 0, c)}</b></span>
      <span class="eb-t"><i style="width:${w.toFixed(1)}%"></i></span><small>${r.b ? tEsc(t(over ? 'exp_budOver' : 'exp_budOf', {b: M(r.b, 0, c), p: (r.v / r.b * 100).toFixed(0)})) : r.p.toFixed(0) + '%'}${prevV.by[r.k] ? ' · ' + tEsc(t('exp_lastM')) + ' ' + M(prevV.by[r.k], 0, c) : ''}</small></button>`; }).join('')}</div>`
    : `<p class="exp-empty">${tEsc(t('exp_empty'))}</p>`;
  const [fv, fk] = EXP_F ? EXP_F.split(':') : ['', ''];
  const list = items.filter(it => !EXP_F || expKey(it, fv) === fk).sort((a, b) => b.date.localeCompare(a.date) || (b.t || 0) - (a.t || 0));
  const clr = $('#exp_clear'); clr.hidden = !EXP_F; if (EXP_F) clr.textContent = '✕ ' + expMeta(fv, fk, 0).name;
  $('#exp_list').innerHTML = list.length ? list.map(it => { const cat = EXP_CATS.find(x => x[0] === it.cat) || EXP_CATS[EXP_CATS.length - 1];
    const orig = it.cur && it.cur !== c ? ` · ${M(it.oamt, 2, it.cur)}` : '', where = (it.cc && it.cc !== 'IL' ? flagOf(it.cc) + ' ' : '') + (it.city || '');
    return `<div class="exp-it" style="--cc:${cat[2]}"><button type="button" class="ei-main" data-exedit="${it.id}"><span class="ei-ic" aria-hidden="true">${cat[1]}</span><span class="ei-t"><b>${tEsc(it.note || t('ec_' + it.cat))}</b>
      <small>${tEsc(dLabel(it.date))} · ${tEsc(t('ec_' + it.cat))}${it.pay ? ' · ' + tEsc(t('pay_' + it.pay)) : ''}${where ? ' · ' + tEsc(where) : ''}${it.rec ? ' · 🔁' : ''}${tEsc(orig)}</small></span>
      <b class="ei-a num">${M(expBase(it), 0, c)}</b></button><button type="button" class="ei-del" data-exdel="${it.id}" aria-label="${tEsc(t('exp_del'))}">✕</button></div>`; }).join('')
    : `<p class="exp-empty">${tEsc(EXP_F ? t('exp_noneCat') : t('exp_empty'))}</p>`;
}
function expSheet(it){
  const data = expData(); EXP_ED = it ? it.id : null;
  if (!$('#exx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="exx" hidden><div class="cp-box exp-box" role="dialog" aria-modal="true" aria-labelledby="exf_t"><div class="cp-top"><h3 id="exf_t"></h3><button type="button" class="cp-x" id="exf_x">×</button></div><form id="exf" class="exp-add" autocomplete="off"></form></div></div>`);
  const cc = it ? (it.cc || 'IL') : data.last.cc, cur0 = it ? (it.cur || it.bc || expCur()) : (EXP_COUNTRIES[cc] === expCur() || cc === 'IL' ? expCur() : EXP_COUNTRIES[cc] || expCur());
  if (it) EXP_CAT = it.cat;
  const curs = [...new Set([expCur(), 'ILS', 'USD', 'EUR', 'GBP', cur0].concat(Object.values(EXP_COUNTRIES)))].filter(k => RATES[k]);
  const ccs = Object.keys(EXP_COUNTRIES).map(k => [k, ccName(k)]).sort((a, b) => a[0] === 'IL' ? -1 : b[0] === 'IL' ? 1 : a[1].localeCompare(b[1], lang));
  $('#exf_t').textContent = t(it ? 'exp_editT' : 'exp_add');
  $('#exf').innerHTML = `<div class="exp-amt"><label for="exp_amt">${tEsc(t('exp_amount'))}</label><div class="exp-amtrow"><input id="exp_amt" type="text" inputmode="decimal" placeholder="0" value="${it ? (it.oamt != null ? it.oamt : it.amt) : ''}" required>
      <select id="exp_cur" aria-label="${tEsc(t('exp_currency'))}">${curs.map(k => `<option value="${k}"${k === cur0 ? ' selected' : ''}>${k}</option>`).join('')}</select></div><small class="exp-conv" id="exp_conv"></small></div>
    <div class="exp-cats" id="exp_cats" role="radiogroup" aria-label="${tEsc(t('exp_cat'))}">${EXP_CATS.map(([k, ic, col]) => `<button type="button" role="radio" class="exp-cat" data-excat="${k}" aria-checked="${k === EXP_CAT}" style="--cc:${col}"><span aria-hidden="true">${ic}</span>${tEsc(t('ec_' + k))}</button>`).join('')}</div>
    <div class="exp-row"><div class="exp-f"><label for="exp_date">${tEsc(t('exp_date'))}</label><input id="exp_date" type="date" value="${it ? it.date : (EXP_M === ymOf(new Date()) ? todayIso() : EXP_M + '-01')}"></div>
      <div class="exp-f grow"><label for="exp_pay">${tEsc(t('exp_pay'))}</label><select id="exp_pay">${EXP_PAY.map(k => `<option value="${k}"${k === (it ? it.pay || 'other' : data.last.pay) ? ' selected' : ''}>${tEsc(t('pay_' + k))}</option>`).join('')}</select></div></div>
    <div class="exp-f"><label for="exp_note">${tEsc(t('exp_note'))}</label><input id="exp_note" type="text" maxlength="80" dir="auto" value="${tEsc(it ? it.note : '')}"></div>
    <div class="exp-row"><div class="exp-f grow"><label for="exp_cc">${tEsc(t('exp_country'))}</label><select id="exp_cc">${ccs.map(([k, n]) => `<option value="${k}"${k === cc ? ' selected' : ''}>${flagOf(k)} ${tEsc(n)}</option>`).join('')}</select></div>
      <div class="exp-f grow"><label for="exp_city">${tEsc(t('exp_city'))}</label><input id="exp_city" type="text" maxlength="40" dir="auto" value="${tEsc(it ? it.city || '' : '')}"></div></div>
    <label class="exp-rec"><input type="checkbox" id="exp_rec"${it && it.rec ? ' checked' : ''}><span>${tEsc(t('exp_rec'))}</span></label>
    <div class="btnrow"><button type="submit" class="gold-btn">${tEsc(t(it ? 'cl_save' : 'exp_add'))}</button>${it ? `<button type="button" class="btn danger" id="exf_del">${tEsc(t('exp_del'))}</button>` : ''}</div>
    <p class="fine exp-msg" id="exp_msg" role="status" aria-live="polite"></p>`;
  expConvHint();
  $('#exx').hidden = false; document.body.classList.add('cp-lock');
  setTimeout(() => $('#exp_amt').focus(), 40);
}
function expConvHint(){
  const h = $('#exp_conv'); if (!h) return;
  const a = parseFloat(String($('#exp_amt').value || '').replace(/[^\d.,]/g, '').replace(',', '.')), cu = $('#exp_cur').value;
  h.textContent = cu !== expCur() && a > 0 ? '≈ ' + M(fxConv(a, cu, expCur()), 0, expCur()) : '';
}
function expClose(){ const o = $('#exx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
function expSave(){
  const raw = String($('#exp_amt').value || '').replace(/[^\d.,]/g, '').replace(',', '.'), oamt = parseFloat(raw), msg = $('#exp_msg');
  if (!(oamt > 0)){ msg.textContent = t('exp_badAmt'); $('#exp_amt').focus(); return; }
  const data = expData(), cu = $('#exp_cur').value, bc = expCur(), cc = $('#exp_cc').value, pay = $('#exp_pay').value;
  const rec = {amt: Math.round(fxConv(oamt, cu, bc) * 100) / 100, bc, oamt: Math.round(oamt * 100) / 100, cur: cu, cat: EXP_CAT, date: $('#exp_date').value || todayIso(),
    note: $('#exp_note').value.trim(), pay, cc, city: $('#exp_city').value.trim(), rec: $('#exp_rec').checked};
  const old = data.items.find(x => x.id === EXP_ED);
  if (old) Object.assign(old, rec); else data.items.push(Object.assign({id: tId(), t: Date.now()}, rec));
  data.last = {cc, pay}; toolsSave('fin-exp', data);
  EXP_M = rec.date.slice(0, 7); expClose(); expRender();
}
function expDel(id){
  const it = expData().items.find(x => x.id === id); if (!it) return;
  if (it.rec && it.date.slice(0, 7) < EXP_M){ it.end = ymAdd(EXP_M, -1); }       // a monthly expense stops from this month on
  else { if (typeof trashPut === 'function') trashPut('exp', 'expenses', it); EXP.items = EXP.items.filter(x => x.id !== id); }
  toolsSave('fin-exp', EXP); expRender();
}
function expBudgets(){
  const data = expData();
  if (!$('#ebx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="ebx" hidden><div class="cp-box exp-box" role="dialog" aria-modal="true" aria-labelledby="ebf_t"><div class="cp-top"><h3 id="ebf_t"></h3><button type="button" class="cp-x" id="ebf_x">×</button></div><form id="ebf" class="exp-budf"></form></div></div>`);
  $('#ebf_t').textContent = t('exp_budgets');
  $('#ebf').innerHTML = `<p class="fine">${tEsc(t('exp_budHint', {c: expCur()}))}</p>` + EXP_CATS.map(([k, ic]) => `<label class="exp-budr"><span>${ic} ${tEsc(t('ec_' + k))}</span><input type="text" inputmode="decimal" data-bud="${k}" value="${data.budgets[k] ? Math.round(data.budgets[k]) : ''}" placeholder="—"></label>`).join('') +
    `<div class="btnrow"><button type="submit" class="gold-btn">${tEsc(t('cl_save'))}</button></div>`;
  $('#ebx').hidden = false; document.body.classList.add('cp-lock');
}
function expBudClose(){ const o = $('#ebx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }

/* ---------- client manager for accountants ---------- */
var CL = null, CL_Q = '', CL_FS = '', CL_EDIT = null;
function clData(){ if (!CL){ CL = toolsLoad('fin-clients', {clients: [], dueDay: 15}); if (!Array.isArray(CL.clients)) CL.clients = []; CL.clients.forEach(c => { if (c && 'idn' in c) delete c.idn; }); if (!CL.dueDay) CL.dueDay = 15; } return CL; }
function clDue(c, kind, now){
  const freq = c[kind]; if (!freq || freq === 'n') return null;
  const D = clData().dueDay;
  for (let i = -1; i < 3; i++){
    const due = new Date(now.getFullYear(), now.getMonth() + i, D), dm = due.getMonth() + 1;
    if (freq === 'b' && dm % 2 === 0) continue;                                  // bi-monthly reports are due in odd months
    const key = kind + ':' + ymOf(due), per = freq === 'b' ? [ymAdd(ymOf(due), -2), ymAdd(ymOf(due), -1)] : [ymAdd(ymOf(due), -1)];
    if ((c.done || {})[key]) continue;
    if (i === -1 && c.created && new Date(c.created) > due) continue;              // no back-dated duty for a brand-new client
    return {kind, key, due, per};
  }
  return null;
}
function clDuties(now){
  const out = [];
  clData().clients.filter(c => c.status !== 'done').forEach(c => {
    ['vat', 'adv'].forEach(k => { const d = clDue(c, k, now); if (d) out.push(Object.assign({c}, d)); });
    (c.tasks || []).filter(x => !x.done && x.due).forEach(x => { const [y, m, dd] = x.due.split('-').map(Number); out.push({c, kind: 'task', task: x, due: new Date(y, m - 1, dd), key: 'task:' + x.id}); });
  });
  return out.sort((a, b) => a.due - b.due);
}
function clientsPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-clients" role="tabpanel" aria-labelledby="tab-clients" hidden>
    <div class="cl-stats" id="cl_stats"></div>
    <div class="cl-h"><h3 class="sec-t" data-i="cl_upcoming"></h3></div>
    <div class="cl-due" id="cl_due"></div>
    <div class="cl-h"><h3 class="sec-t" data-i="cl_list"></h3><button type="button" class="gold-btn" id="cl_new" data-i="cl_new"></button></div>
    <input id="cl_q" type="search" class="cl-q" autocomplete="off" data-ia="cl_search">
    <div class="cl-fs" id="cl_fs"></div>
    <div class="cl-list" id="cl_list"></div>
    <details class="adv cl-more"><summary data-i="cl_more"></summary>
      <div class="fields"><div class="field"><label for="cl_dueDay" data-i="cl_dueDay"></label><input id="cl_dueDay" type="number" min="1" max="28" inputmode="numeric"><small class="hint" data-i="h_clDueDay"></small></div></div>
      <div class="field wide"><label for="cl_json" data-i="cl_backup"></label><textarea id="cl_json" rows="4" class="lookup" spellcheck="false"></textarea></div>
      <div class="btnrow"><button type="button" class="btn" id="cl_exp" data-i="b_export"></button><button type="button" class="btn" id="cl_imp" data-i="b_import"></button></div>
      <p class="fine" id="cl_bmsg" role="status"></p>
    </details>
    <p class="fine" data-i="tools_local"></p>
  </section>`;
}
function clPhone(p){ const d = String(p || '').replace(/[^\d+]/g, ''); return d.startsWith('0') ? '972' + d.slice(1) : d.replace(/^\+/, ''); }
function clRender(){
  const box = $('#panel-clients'); if (!box) return;
  const now = new Date(), data = clData(), duties = clDuties(now), soon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const active = data.clients.filter(c => c.status !== 'done'), fees = active.reduce((s, c) => s + (+c.fee || 0), 0);
  const late = duties.filter(d => d.due < today0).length, monthDue = duties.filter(d => d.due.getMonth() === now.getMonth() && d.due.getFullYear() === now.getFullYear()).length;
  $('#cl_stats').innerHTML = [['cl_sActive', active.length, ''], ['cl_sMonth', monthDue, ''], ['cl_sLate', late, late ? 'bad' : ''], ['cl_sFees', M(fees, 0, expCur()), '']]
    .map(([k, v, cls]) => `<div class="cl-stat ${cls}"><b class="num">${v}</b><small>${tEsc(t(k))}</small></div>`).join('');
  const up = duties.filter(d => d.due <= soon);
  $('#cl_due').innerHTML = up.length ? up.map(d => {
    const lateD = d.due < today0, what = d.kind === 'task' ? d.task.title : t('cl_k_' + d.kind) + ' · ' + d.per.map(ymLabel).join('–');
    return `<div class="cl-duty${lateD ? ' late' : ''}"><button type="button" class="cl-chk" data-cldone="${d.c.id}|${d.key}" aria-label="${tEsc(t('cl_markDone'))}">✓</button>
      <span class="cd-t"><b>${tEsc(d.c.name)}</b><small>${tEsc(what)}</small></span><span class="cd-d">${lateD ? tEsc(t('cl_late')) + ' · ' : ''}${tEsc(dLabel(ymOf(d.due) + '-' + String(d.due.getDate()).padStart(2, '0')))}</span></div>`;
  }).join('') : `<p class="exp-empty">${tEsc(t(data.clients.length ? 'cl_noDue' : 'cl_emptyAll'))}</p>`;
  $('#cl_fs').innerHTML = [['', 'cl_all']].concat(CL_STATUS.map(([k]) => [k, 'cl_st_' + k])).map(([k, l]) => `<button type="button" class="as-chip${CL_FS === k ? ' on' : ''}" data-clfs="${k}">${tEsc(t(l))}${k ? ' · ' + data.clients.filter(c => c.status === k).length : ''}</button>`).join('');
  const q = CL_Q.trim().toLowerCase();
  const list = data.clients.filter(c => (!CL_FS || c.status === CL_FS) && (!q || [c.name, c.phone, c.email, c.tags, c.notes].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  const nextOf = c => duties.find(d => d.c === c);
  $('#cl_list').innerHTML = list.length ? list.map(c => {
    const st = CL_STATUS.find(x => x[0] === c.status) || CL_STATUS[0], nx = nextOf(c), ph = clPhone(c.phone);
    return `<div class="cl-card" style="--sc:${st[1]}"><div class="cc-top"><span class="cc-n"><b>${tEsc(c.name)}</b><small>${tEsc(t('cl_t_' + c.type))}</small></span><span class="cc-st">${tEsc(t('cl_st_' + c.status))}</span></div>
      ${nx ? `<p class="cc-next${nx.due < today0 ? ' late' : ''}">⏰ ${tEsc(nx.kind === 'task' ? nx.task.title : t('cl_k_' + nx.kind))} · ${tEsc(dLabel(ymOf(nx.due) + '-' + String(nx.due.getDate()).padStart(2, '0')))}</p>` : ''}
      ${c.notes ? `<p class="cc-notes">${tEsc(c.notes)}</p>` : ''}
      <div class="cc-act">${ph ? `<a class="cc-b" href="tel:${tEsc(c.phone.replace(/[^\d+]/g, ''))}" aria-label="${tEsc(t('cl_call'))}">📞</a><a class="cc-b" href="https://wa.me/${tEsc(ph)}" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>` : ''}${c.email ? `<a class="cc-b" href="mailto:${tEsc(c.email)}" aria-label="${tEsc(t('cl_mail'))}">✉️</a>` : ''}
        ${c.fee ? `<span class="cc-fee num">${M(+c.fee, 0, expCur())}${tEsc(t('cl_perM'))}</span>` : ''}<button type="button" class="cc-b cc-edit" data-cledit="${c.id}">✏️ ${tEsc(t('cl_edit'))}</button></div></div>`;
  }).join('') : `<p class="exp-empty">${tEsc(t(data.clients.length ? 'cl_noMatch' : 'cl_emptyAll'))}</p>`;
  const dd = $('#cl_dueDay'); if (dd && document.activeElement !== dd) dd.value = data.dueDay;
  const qi = $('#cl_q'); if (qi) qi.placeholder = t('cl_search');
}
function clForm(c){
  CL_EDIT = c ? c.id : null; c = c || {name: '', type: 'murshe', phone: '', email: '', vat: 'b', adv: 'm', fee: '', status: 'active', notes: '', tags: '', tasks: []};
  if (!$('#clx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="clx" hidden><div class="cp-box cl-box" role="dialog" aria-modal="true" aria-labelledby="clf_t"><div class="cp-top"><h3 id="clf_t"></h3><button type="button" class="cp-x" id="clf_x">×</button></div><form id="clf" class="cl-form" autocomplete="off"></form></div></div>`);
  const opt = (name, vals, cur, pre) => `<select id="clf_${name}">${vals.map(v => `<option value="${v}"${v === cur ? ' selected' : ''}>${tEsc(t(pre + v))}</option>`).join('')}</select>`;
  const fld = (id, lab, html, wide) => `<div class="field${wide ? ' wide' : ''}"><label for="clf_${id}">${tEsc(t(lab))}</label>${html}</div>`;
  const inp = (id, v, type, extra) => `<input id="clf_${id}" type="${type || 'text'}" value="${tEsc(v)}" ${extra || ''}>`;
  $('#clf_t').textContent = t(CL_EDIT ? 'cl_editT' : 'cl_newT');
  $('#clf').innerHTML = `<div class="fields">
    ${fld('name', 'cl_name', inp('name', c.name, 'text', 'required maxlength="80" dir="auto"'), true)}
    ${fld('type', 'cl_type', opt('type', CL_TYPES, c.type, 'cl_t_'))}
    ${fld('status', 'cl_status', opt('status', CL_STATUS.map(x => x[0]), c.status, 'cl_st_'))}
    ${fld('fee', 'cl_fee', inp('fee', c.fee, 'text', 'inputmode="decimal" dir="ltr"'))}
    ${fld('phone', 'cl_phone', inp('phone', c.phone, 'tel', 'dir="ltr" maxlength="20"'))}
    ${fld('email', 'cl_email', inp('email', c.email, 'email', 'dir="ltr" maxlength="80"'))}
    ${fld('vat', 'cl_vat', opt('vat', ['m', 'b', 'n'], c.vat, 'cl_f_'))}
    ${fld('adv', 'cl_adv', opt('adv', ['m', 'b', 'n'], c.adv, 'cl_f_'))}
    ${fld('tags', 'cl_tags', inp('tags', c.tags, 'text', 'maxlength="80" dir="auto"'), true)}
    ${fld('notes', 'cl_notes', `<textarea id="clf_notes" rows="3" maxlength="600" dir="auto">${tEsc(c.notes)}</textarea>`, true)}</div>
    <h4 class="cl-th">${tEsc(t('cl_tasks'))}</h4><div class="cl-tasks" id="clf_tasks">${(c.tasks || []).map(x => clTaskRow(x)).join('')}</div>
    <div class="cl-addtask"><input id="clf_tt" type="text" maxlength="80" dir="auto" placeholder="${tEsc(t('cl_taskPh'))}"><input id="clf_td" type="date"><button type="button" class="btn" id="clf_ta">+</button></div>
    <div class="btnrow"><button type="submit" class="gold-btn">${tEsc(t('cl_save'))}</button>${CL_EDIT ? `<button type="button" class="btn danger" id="clf_del">${tEsc(t('cl_delete'))}</button>` : ''}</div>
    <p class="fine" id="clf_msg" role="status"></p>`;
  $('#clx').hidden = false; document.body.classList.add('cp-lock');
  setTimeout(() => $('#clf_name').focus(), 40);
}
function clTaskRow(x){ return `<div class="cl-task" data-tid="${x.id}"><label><input type="checkbox"${x.done ? ' checked' : ''} data-tdone="${x.id}"> <span>${tEsc(x.title)}</span></label><small>${x.due ? tEsc(dLabel(x.due)) : ''}</small><button type="button" class="ei-del" data-tdel="${x.id}">✕</button></div>`; }
function clClose(){ const o = $('#clx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
var CL_TMP_TASKS = null;
function clSave(){
  const v = id => ($('#clf_' + id) || {}).value || '', name = v('name').trim();
  if (!name){ $('#clf_msg').textContent = t('cl_needName'); $('#clf_name').focus(); return; }
  const data = clData(), old = data.clients.find(c => c.id === CL_EDIT);
  const tasks = $$('#clf_tasks .cl-task').map(r => { const id = r.dataset.tid, prev = ((old && old.tasks) || []).concat(CL_TMP_TASKS || []).find(x => x.id === id) || {}; return Object.assign({}, prev, {done: $('[data-tdone]', r).checked}); });
  const c = Object.assign(old || {id: tId(), created: Date.now(), done: {}}, {name, type: v('type'), status: v('status'), fee: v('fee').replace(/[^\d.]/g, ''),
    phone: v('phone').trim(), email: v('email').trim(), vat: v('vat'), adv: v('adv'), tags: v('tags').trim(), notes: v('notes').trim(), tasks});
  if (!old) data.clients.push(c);
  CL_TMP_TASKS = null; toolsSave('fin-clients', data); clClose(); clRender();
}
document.addEventListener('click', e => {
  const el = e.target;
  // expenses
  const m = el.closest('[data-exm]'); if (m){ EXP_M = ymAdd(EXP_M || ymOf(new Date()), +m.dataset.exm); EXP_F = ''; expRender(); return; }
  if (el.closest('[data-expadd]')){ expSheet(null); return; }
  if (el.closest('#exp_budBtn')){ expBudgets(); return; }
  const ev = el.closest('[data-expv]'); if (ev){ EXP_VIEW = ev.dataset.expv; EXP_F = ''; expRender(); return; }
  const ec = el.closest('[data-excat]'); if (ec){ EXP_CAT = ec.dataset.excat; $$('#exp_cats [data-excat]').forEach(b => b.setAttribute('aria-checked', b === ec)); return; }
  const ef = el.closest('[data-exf]'); if (ef){ EXP_F = EXP_F === ef.dataset.exf ? '' : ef.dataset.exf; expRender(); return; }
  if (el.closest('#exp_clear')){ EXP_F = ''; expRender(); return; }
  const ee = el.closest('[data-exedit]'); if (ee){ expSheet(expData().items.find(x => x.id === ee.dataset.exedit)); return; }
  const ed = el.closest('[data-exdel]'); if (ed){ if (ed.dataset.sure){ expDel(ed.dataset.exdel); } else { ed.dataset.sure = '1'; ed.textContent = t('exp_sure'); ed.classList.add('sure'); setTimeout(() => { if (ed.isConnected){ delete ed.dataset.sure; ed.textContent = '✕'; ed.classList.remove('sure'); } }, 2500); } return; }
  const ex = $('#exx');
  if (ex && !ex.hidden){
    if (el === ex || el.closest('#exf_x')) return expClose();
    const dl = el.closest('#exf_del'); if (dl){ if (!dl.dataset.sure){ dl.dataset.sure = '1'; dl.textContent = t('exp_sure'); return; } expClose(); { const it0 = EXP.items.find(x => x.id === EXP_ED); if (it0 && typeof trashPut === 'function') trashPut('exp', 'expenses', it0); } EXP.items = EXP.items.filter(x => x.id !== EXP_ED); toolsSave('fin-exp', EXP); expRender(); return; }
  }
  const eb = $('#ebx'); if (eb && !eb.hidden && (el === eb || el.closest('#ebf_x'))) return expBudClose();
  // clients
  if (el.closest('#cl_new')){ CL_TMP_TASKS = []; clForm(null); return; }
  const ce = el.closest('[data-cledit]'); if (ce){ CL_TMP_TASKS = []; clForm(clData().clients.find(c => c.id === ce.dataset.cledit)); return; }
  const cf = el.closest('[data-clfs]'); if (cf){ CL_FS = cf.dataset.clfs; clRender(); return; }
  const cd = el.closest('[data-cldone]'); if (cd){
    const [cid, key] = cd.dataset.cldone.split('|'), c = clData().clients.find(x => x.id === cid); if (!c) return;
    if (key.indexOf('task:') === 0){ const tk = (c.tasks || []).find(x => 'task:' + x.id === key); if (tk) tk.done = true; } else { c.done = c.done || {}; c.done[key] = Date.now(); }
    toolsSave('fin-clients', CL); clRender(); return; }
  const ov = $('#clx');
  if (ov && !ov.hidden){
    if (el === ov || el.closest('#clf_x')) return clClose();
    if (el.closest('#clf_ta')){ const tt = $('#clf_tt').value.trim(); if (!tt) return; const x = {id: tId(), title: tt, due: $('#clf_td').value, done: false}; CL_TMP_TASKS.push(x); $('#clf_tasks').insertAdjacentHTML('beforeend', clTaskRow(x)); $('#clf_tt').value = ''; return; }
    const td = el.closest('[data-tdel]'); if (td){ td.closest('.cl-task').remove(); return; }
    const dl = el.closest('#clf_del'); if (dl){ if (!dl.dataset.sure){ dl.dataset.sure = '1'; dl.textContent = t('cl_sureDel'); return; } { const c0 = CL.clients.find(c => c.id === CL_EDIT); if (c0 && typeof trashPut === 'function') trashPut('cl', 'clients', c0); } CL.clients = CL.clients.filter(c => c.id !== CL_EDIT); toolsSave('fin-clients', CL); clClose(); clRender(); return; }
  }
  if (el.closest('#cl_exp')){ $('#cl_json').value = JSON.stringify(clData(), null, 1); $('#cl_bmsg').textContent = t('cl_expDone'); try { if (navigator.clipboard) navigator.clipboard.writeText($('#cl_json').value).catch(() => {}); } catch (err) {} return; }
  if (el.closest('#cl_imp')){ try { const d = JSON.parse($('#cl_json').value); if (!d || !Array.isArray(d.clients)) throw 0; d.clients.forEach(c => { if (c && typeof c === 'object') delete c.idn; }); CL = d; toolsSave('fin-clients', CL); $('#cl_bmsg').textContent = t('cl_impDone', {n: d.clients.length}); clRender(); } catch (err) { $('#cl_bmsg').textContent = t('cl_impBad'); } return; }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'exf'){ e.preventDefault(); expSave(); }
  if (e.target.id === 'ebf'){ e.preventDefault(); const d = expData(); $$('[data-bud]', e.target).forEach(i => { const v = parseFloat(String(i.value).replace(/[^\d.]/g, '')); if (v > 0) d.budgets[i.dataset.bud] = v; else delete d.budgets[i.dataset.bud]; }); toolsSave('fin-exp', d); expBudClose(); expRender(); }
  if (e.target.id === 'clf'){ e.preventDefault(); clSave(); }
});
document.addEventListener('input', e => { if (e.target.id === 'cl_q'){ CL_Q = e.target.value; clRender(); } if (e.target.id === 'exp_amt') expConvHint(); });
document.addEventListener('change', e => {
  if (e.target.id === 'exp_cur') expConvHint();
  if (e.target.id === 'exp_cc'){ const cu = e.target.value === 'IL' ? 'ILS' : EXP_COUNTRIES[e.target.value]; const s = $('#exp_cur'); if (cu && s && [...s.options].some(o => o.value === cu)){ s.value = cu; expConvHint(); } }
  if (e.target.id === 'exp_incIn'){ const v = parseFloat(String(e.target.value).replace(/[^\d.]/g, '')); const d = expData(); if (v > 0) d.income[EXP_M] = v; else delete d.income[EXP_M]; toolsSave('fin-exp', d); expRender(); }
  if (e.target.id === 'cl_dueDay'){ const n = Math.min(28, Math.max(1, Math.round(+e.target.value || 15))); clData().dueDay = n; toolsSave('fin-clients', CL); clRender(); } });
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; const o = $('#clx'); if (o && !o.hidden) clClose(); const x = $('#exx'); if (x && !x.hidden) expClose(); const b = $('#ebx'); if (b && !b.hidden) expBudClose(); });
Object.assign(ICON, {
  expenses: ic('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/><path d="M16 3l-2 3M10 3l2 3"/>'),
  clients: ic('<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15 6h6M15 10h6M17 14h4"/>')
});
