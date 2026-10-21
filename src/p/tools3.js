/* 13.38: three tools – receipts (photo → expense by category), "who brings what" (a shared list through a link) and reservists (grants, credit points, reminders) */
/* ================= receipts ================= */
const RC_CATS = () => EXP_CATS.map(c => c[0]);
var RCX = {busy: false, form: null, ym: '', img: null, msg: ''};
function rcD(){ const d = miD('rcpt'); if (!Array.isArray(d.items)) d.items = []; return d; }
const rcIc = k => (EXP_CATS.find(c => c[0] === k) || [, '📦'])[1];
const rcVat = () => (typeof IL26 === 'object' && IL26 && IL26.vat) || 0.18;
const rcNum = v => { const x = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };
const rcDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : todayIso();
function rcPrompt(){
  return 'Read this photo of a shop receipt or invoice (it may be Hebrew, Arabic or English). Return ONLY JSON: {"store": the business name as printed, "date": "YYYY-MM-DD" (the purchase date), "total": the final amount paid as a number, "vat": the VAT amount as a number or null, "cur": the ISO currency code (ILS if shekels), "cat": the best category, one of ' + JSON.stringify(RC_CATS()) +
    ' (food = groceries and supermarkets, fun = restaurants, cafes and leisure, car = fuel, parking and public transport, bills = electricity, water, gas and municipal), "items": up to 25 lines [{"n": name, "p": price}]}. If the photo is not a receipt, return {"err": "not_receipt"}.';
}
async function rcRead(file){
  RCX.busy = true; RCX.msg = ''; miRender('rcpt');
  try {
    const blob = await vtShrink(file, 1600); RCX.img = blob;
    let f = {store: '', date: todayIso(), total: '', vat: '', cat: '', biz: false, pay: (expData().last || {}).pay || 'card', note: '', ai: false};
    if (slEngine()){
      try { const j = await dsAsk(rcPrompt(), [blob]);
        if (j && j.err) RCX.msg = t('rc_notReceipt');
        else if (j){ f = Object.assign(f, {store: String(j.store || '').slice(0, 60), date: rcDate(j.date), total: rcNum(j.total) || '', vat: rcNum(j.vat) || '', cat: RC_CATS().includes(j.cat) ? j.cat : '', ai: true, items: Array.isArray(j.items) ? j.items.slice(0, 25).map(x => ({n: String(x && x.n || '').slice(0, 40), p: rcNum(x && x.p)})).filter(x => x.n) : []});
          if (j.cur && j.cur !== 'ILS') RCX.msg = t('rc_otherCur', {c: String(j.cur).slice(0, 3)}); }
      } catch (e) { RCX.msg = t('rc_readFail'); }
    } else RCX.msg = t(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE ? 'rc_noAiC' : 'rc_noAi');
    if (!f.cat) f.cat = f.store ? x2Guess(f.store) : 'food';
    RCX.form = f;
  } catch (e) { RCX.msg = t('rc_imgFail'); }
  finally { RCX.busy = false; miRender('rcpt'); const n = document.getElementById(RCX.form && RCX.form.total ? 'rc_store' : 'rc_total'); if (n) try { n.focus(); } catch (e) {} }
}
function rcFormVals(box){
  const g = id => (box.querySelector('#' + id) || {}).value || '';
  const f = RCX.form; f.store = g('rc_store').trim().slice(0, 60); f.date = rcDate(g('rc_date')); f.total = g('rc_total'); f.vat = g('rc_vat'); f.cat = g('rc_cat') || f.cat; f.pay = g('rc_pay') || f.pay; f.note = g('rc_note').trim().slice(0, 120);
  return f;
}
async function rcSave(box, api){
  const f = rcFormVals(box), amt = rcNum(f.total);
  if (!(amt > 0)){ toast(t('rc_needAmt')); const n = box.querySelector('#rc_total'); if (n) n.focus(); return; }
  const d = rcD(), id = tId(), ed = f.id ? d.items.find(x => x.id === f.id) : null;
  const vat = f.vat === '' ? (f.biz ? Math.round(amt * rcVat() / (1 + rcVat()) * 100) / 100 : 0) : rcNum(f.vat);
  const rec = {store: f.store, date: f.date, amt, vat, cat: f.cat, biz: !!f.biz, pay: f.pay, note: f.note};
  /* the expense in "Monthly expenses" */
  const ex = expData(), note = (f.store || t('rc_receipt')) + (f.biz ? ' · ' + t('rc_biz') : '');
  if (ed){ Object.assign(ed, rec); const it = ex.items.find(x => x.id === ed.exp); if (it) Object.assign(it, {amt, oamt: amt, cat: f.cat, date: f.date, note, pay: f.pay}); }
  else {
    const eid = tId(); ex.items.push({id: eid, t: Date.now(), amt, bc: 'ILS', oamt: amt, cur: 'ILS', cat: f.cat, date: f.date, note, pay: f.pay, cc: 'IL', city: '', rec: false, rc: id});
    ex.last = Object.assign(ex.last || {}, {pay: f.pay});
    d.items.unshift(Object.assign({id, exp: eid, img: 0, at: Date.now()}, rec));
    if (RCX.img && !vtNoPics()){ try { await vtPut('rc_' + id, RCX.img); d.items[0].img = 1; } catch (e) {} }
  }
  toolsSave('fin-exp', ex); try { if (f.store) x2Learn(f.store, f.cat); } catch (e) {}
  RCX.form = null; RCX.img = null; RCX.msg = ''; RCX.ym = f.date.slice(0, 7); api.save(); toast(t(ed ? 'rc_updated' : 'rc_saved', {a: MI0(amt)})); api.redraw();
}
function rcDel(id, api){
  const d = rcD(), i = d.items.findIndex(x => x.id === id); if (i < 0) return;
  const it = d.items[i], ex = expData(); ex.items = ex.items.filter(x => x.id !== it.exp); toolsSave('fin-exp', ex);
  if (it.img) vtDel('rc_' + id); d.items.splice(i, 1); api.save(); toast(t('rc_deleted')); api.redraw();
}
function rcCsv(items){
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const head = [t('rc_c_date'), t('rc_c_store'), t('rc_c_cat'), t('rc_c_amt'), t('rc_c_vat'), t('rc_c_type'), t('rc_c_pay'), t('rc_c_note')];
  const rows = items.map(x => [x.date, x.store, t('ec_' + x.cat), x.amt.toFixed(2), (x.vat || 0).toFixed(2), t(x.biz ? 'rc_biz' : 'rc_home'), t('pay_' + (x.pay || 'other')), x.note]);
  return '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
}
function rcFormHTML(E){
  const f = RCX.form, pays = typeof EXP_PAY !== 'undefined' ? EXP_PAY : ['card', 'cash', 'other'];
  return `<div class="mi-card rc-form" id="rc_form">
    <h4 class="rc-h">${E(t(f.id ? 'rc_edit' : 'rc_check'))}</h4>
    ${RCX.img ? '<div class="rc-shot"><img id="rc_prev" alt=""></div>' : ''}
    ${RCX.msg ? `<p class="fine rc-msg">ℹ️ ${E(RCX.msg)}</p>` : ''}
    <div class="seg rc-type" role="group" aria-label="${E(t('rc_c_type'))}"><button type="button" data-rcbiz="0" class="${f.biz ? '' : 'on'}" aria-pressed="${!f.biz}">🏠 ${E(t('rc_home'))}</button><button type="button" data-rcbiz="1" class="${f.biz ? 'on' : ''}" aria-pressed="${!!f.biz}">💼 ${E(t('rc_biz'))}</button></div>
    <div class="bk-grid">
      <label class="bk-f"><span>${E(t('rc_c_store'))}</span><input type="text" id="rc_store" maxlength="60" dir="auto" value="${E(f.store)}" placeholder="${E(t('rc_storePh'))}"></label>
      <label class="bk-f"><span>${E(t('rc_c_amt'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="rc_total" value="${E(f.total)}"></label>
      <label class="bk-f"><span>${E(t('rc_c_date'))}</span><input type="date" id="rc_date" value="${E(f.date)}"></label>
      <label class="bk-f"><span>${E(t('rc_c_cat'))}</span><select id="rc_cat">${EXP_CATS.map(([k, ic]) => `<option value="${k}"${f.cat === k ? ' selected' : ''}>${ic} ${E(t('ec_' + k))}</option>`).join('')}</select></label>
      <label class="bk-f"><span>${E(t('rc_c_pay'))}</span><select id="rc_pay">${pays.map(k => `<option value="${k}"${f.pay === k ? ' selected' : ''}>${E(t('pay_' + k))}</option>`).join('')}</select></label>
      <label class="bk-f"${f.biz ? '' : ' hidden'} id="rc_vatf"><span>${E(t('rc_c_vat'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="rc_vat" value="${E(f.vat)}" placeholder="${E(t('rc_vatPh'))}"></label>
      <label class="bk-f rc-wide"><span>${E(t('rc_c_note'))}</span><input type="text" id="rc_note" maxlength="120" dir="auto" value="${E(f.note)}"></label>
    </div>
    ${f.items && f.items.length ? `<details class="rc-lines"><summary>${E(t('rc_lines', {n: f.items.length}))}</summary><ul>${f.items.map(x => `<li><span dir="auto">${E(x.n)}</span><bdi dir="ltr">${E(x.p ? MI0(x.p) : '')}</bdi></li>`).join('')}</ul></details>` : ''}
    <div class="btnrow"><button type="button" class="gold-btn" id="rc_save">✓ ${E(t('rc_saveBtn'))}</button><button type="button" class="btn" id="rc_cancel">${E(t('rm_cancel'))}</button></div>
  </div>`;
}
miniDef('rcpt', {
  intro: 'rc_intro',
  render(box, api){
    const E = api.E, d = rcD(), now = ymOf(new Date()); if (!RCX.ym) RCX.ym = now;
    const ym = RCX.ym, mine = d.items.filter(x => x.date.slice(0, 7) === ym).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);
    const sum = mine.reduce((s, x) => s + x.amt, 0), biz = mine.filter(x => x.biz), bizSum = biz.reduce((s, x) => s + x.amt, 0), vatSum = biz.reduce((s, x) => s + (x.vat || 0), 0);
    const by = {}; mine.forEach(x => { by[x.cat] = (by[x.cat] || 0) + x.amt; });
    const cats = Object.keys(by).sort((a, b) => by[b] - by[a]), mx = cats.length ? by[cats[0]] : 1;
    const eng = slEngine();
    box.innerHTML = `<div class="mi-card rc-top">
        <div class="rc-btns"><label class="gold-btn rc-cam">📷 ${E(t('rc_shoot'))}<input type="file" accept="image/*" capture="environment" id="rc_cam" hidden></label>
        <label class="btn">🖼️ ${E(t('rc_gallery'))}<input type="file" accept="image/*" id="rc_gal" hidden></label>
        <button type="button" class="btn" id="rc_manual">✍️ ${E(t('rc_manual'))}</button></div>
        <p class="fine">${E(t(eng ? 'rc_aiOn' : 'rc_aiOff'))}</p>
        ${RCX.busy ? `<p class="rc-busy" role="status">⏳ ${E(t('rc_reading'))}</p>` : ''}
      </div>
      ${RCX.form ? rcFormHTML(E) : ''}
      <div class="ex-month rc-month"><button type="button" class="ex-nav" data-rcm="-1" aria-label="${E(t('ex_prev'))}">‹</button><b>${E(ymLabel(ym))}</b><button type="button" class="ex-nav" data-rcm="1" aria-label="${E(t('ex_next'))}"${ym >= now ? ' disabled' : ''}>›</button></div>
      <div class="hero mi-hero"><span class="hero-label">${E(t('rc_monthSum', {n: mine.length}))}</span><span class="hero-value num">${E(MI0(sum))}</span>${biz.length ? `<div class="hero-sub">${E(t('rc_bizSub', {b: MI0(bizSum), v: MI0(vatSum)}))}</div>` : ''}</div>
      ${cats.length ? `<ul class="cx-sens mi-bars">${cats.map(k => `<li><span class="cx-l">${rcIc(k)} ${E(t('ec_' + k))}</span><span class="cx-bar"><i class="up" style="width:${Math.max(3, Math.round(by[k] / mx * 100))}%"></i></span><bdi dir="ltr" class="num cx-v">${E(MI0(by[k]))}</bdi></li>`).join('')}</ul>` : ''}
      <ul class="mi-list rc-list">${mine.map(x => `<li class="mi-item rc-it" data-rcid="${x.id}">
          <div class="rc-thumb" aria-hidden="true">${x.img ? `<img data-rcimg="${x.id}" alt="">` : rcIc(x.cat)}</div>
          <div class="rc-mid"><b dir="auto">${E(x.store || t('rc_receipt'))}</b><small>${E(dLabel(x.date))} · ${rcIc(x.cat)} ${E(t('ec_' + x.cat))}${x.biz ? ' · 💼 ' + E(t('rc_biz')) : ''}</small></div>
          <bdi dir="ltr" class="num rc-amt">${E(MI0(x.amt))}</bdi>
          <div class="rc-acts">${x.img ? `<button type="button" class="px-tb s" data-rcview="${x.id}" aria-label="${E(t('rc_view'))}">🖼️</button>` : ''}<button type="button" class="px-tb s" data-rced="${x.id}" aria-label="${E(t('rc_edit'))}">✏️</button><button type="button" class="px-tb s" data-rcdel="${x.id}" aria-label="${E(t('rc_del'))}">🗑️</button></div>
        </li>`).join('') || `<li class="fine bk-empty">${E(t('rc_none'))}</li>`}</ul>
      <div class="btnrow mi-acts">${mine.length ? `<button type="button" class="mv" id="rc_csv">⬇️ ${E(t('rc_csvM'))}</button>` : ''}${d.items.length ? `<button type="button" class="mv" id="rc_csvY">⬇️ ${E(t('rc_csvY', {y: ym.slice(0, 4)}))}</button>` : ''}
        <button type="button" class="mv" id="rc_exp">↗ ${E(t('tab_expenses'))}</button>${biz.length ? `<button type="button" class="mv" id="rc_self">↗ ${E(t('tab_selfemp'))}</button>` : ''}</div>
      <p class="fine">${E(t(vtNoPics() ? 'rc_privNoPics' : 'rc_priv'))}</p>`;
    /* the photos come from the phone's storage */
    box.querySelectorAll('[data-rcimg]').forEach(async im => { try { const b = await vtGet('rc_' + im.dataset.rcimg); if (b) im.src = URL.createObjectURL(b); else im.remove(); } catch (e) {} });
    const pv = box.querySelector('#rc_prev'); if (pv && RCX.img) pv.src = URL.createObjectURL(RCX.img);
    box.onchange = e => { const el = e.target; if ((el.id === 'rc_cam' || el.id === 'rc_gal') && el.files && el.files[0]){ const f = el.files[0]; el.value = ''; rcRead(f); } };
    box.oninput = e => { if (e.target.id === 'rc_store' && RCX.form && !RCX.form.ai && !RCX.form.catSet){ const s = e.target.value.trim(); if (s.length > 1){ const g = x2Guess(s); const sel = box.querySelector('#rc_cat'); if (sel && g !== 'other') sel.value = g; } } if (e.target.id === 'rc_cat' && RCX.form) RCX.form.catSet = true; };
    box.onclick = async e => { const T0 = e.target; let b;
      if (T0.closest('#rc_manual')){ RCX.img = null; RCX.msg = ''; RCX.form = {store: '', date: todayIso(), total: '', vat: '', cat: 'food', biz: false, pay: (expData().last || {}).pay || 'card', note: ''}; api.redraw(); const n = box.querySelector('#rc_store'); if (n) n.focus(); return; }
      if ((b = T0.closest('[data-rcbiz]')) && RCX.form){ rcFormVals(box); RCX.form.biz = b.dataset.rcbiz === '1'; api.redraw(); return; }
      if (T0.closest('#rc_save')){ rcSave(box, api); return; }
      if (T0.closest('#rc_cancel')){ RCX.form = null; RCX.img = null; RCX.msg = ''; api.redraw(); return; }
      if ((b = T0.closest('[data-rcm]'))){ RCX.ym = ymAdd(RCX.ym, +b.dataset.rcm); if (RCX.ym > now) RCX.ym = now; api.redraw(); return; }
      if ((b = T0.closest('[data-rcdel]'))){ if (b.dataset.sure){ rcDel(b.dataset.rcdel, api); } else { b.dataset.sure = '1'; b.textContent = t('rc_sure'); setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = '🗑️'; } }, 3500); } return; }
      if ((b = T0.closest('[data-rced]'))){ const x = d.items.find(y => y.id === b.dataset.rced); if (!x) return; RCX.img = null; RCX.msg = ''; RCX.form = Object.assign({}, x, {total: x.amt, vat: x.vat || '', ai: true}); api.redraw(); const fm = box.querySelector('#rc_form'); if (fm) fm.scrollIntoView({block: 'start'}); return; }
      if ((b = T0.closest('[data-rcview]'))){ const bl = await vtGet('rc_' + b.dataset.rcview); if (bl){ const u = URL.createObjectURL(bl), w = window.open(u, '_blank', 'noopener'); if (!w) fileSave(bl, 'receipt.jpg', 'image/jpeg'); } return; }
      if (T0.closest('#rc_csv')){ fileSave(new Blob([rcCsv(mine)], {type: 'text/csv;charset=utf-8'}), t('rc_file') + ' ' + ym + '.csv', 'text/csv'); return; }
      if (T0.closest('#rc_csvY')){ const y = ym.slice(0, 4); fileSave(new Blob([rcCsv(d.items.filter(x => x.date.slice(0, 4) === y).sort((a, c) => a.date.localeCompare(c.date)))], {type: 'text/csv;charset=utf-8'}), t('rc_file') + ' ' + y + '.csv', 'text/csv'); return; }
      if (T0.closest('#rc_exp')){ try { EXP_M = ym; } catch (er) {} activate('expenses'); return; }
      if (T0.closest('#rc_self')){ activate('selfemp'); return; }
    };
  },
  disc: 'rc_disc'
});
/* a receipt deleted from "Monthly expenses" leaves the receipts list too */
try { const rcExpDel = typeof expDel === 'function' ? expDel : null; if (rcExpDel){ expDel = function(id){ const it = expData().items.find(x => x.id === id); const r = rcExpDel.apply(this, arguments); try { if (it && it.rc){ const d = rcD(), i = d.items.findIndex(x => x.id === it.rc); if (i >= 0){ if (d.items[i].img) vtDel('rc_' + it.rc); d.items.splice(i, 1); saveSet(); } } } catch (e) {} return r; }; } } catch (e) {}

/* ================= who brings what ================= */
const BR_API = () => (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE ? SITE_BASE : (location.origin + '/')) + 'api/bring';
const BR_LINK = id => (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE ? SITE_BASE : location.origin + location.pathname) + '#bring=' + id;
const BR_TPL = {
  shabbat: ['br_i_challah', 'br_i_wine', 'br_i_salads', 'br_i_main', 'br_i_side', 'br_i_dessert', 'br_i_drinks', 'br_i_fruit'],
  bbq: ['br_i_meat', 'br_i_coal', 'br_i_pitas', 'br_i_salads', 'br_i_sauces', 'br_i_drinks', 'br_i_ice', 'br_i_dispos', 'br_i_water'],
  trip: ['br_i_water', 'br_i_sandw', 'br_i_snacks', 'br_i_fruit', 'br_i_firstaid', 'br_i_sun', 'br_i_mat', 'br_i_trash'],
  party: ['br_i_cake', 'br_i_drinks', 'br_i_snacks', 'br_i_dispos', 'br_i_decor', 'br_i_candles', 'br_i_music'],
  picnic: ['br_i_mat', 'br_i_sandw', 'br_i_fruit', 'br_i_drinks', 'br_i_snacks', 'br_i_dispos', 'br_i_ball'],
  empty: []
};
const BR_IC = {shabbat: '🍽️', bbq: '🔥', trip: '🏕️', party: '🎂', picnic: '🧺', empty: '✍️'};
var BRX = {open: '', data: null, v: 0, busy: false, err: '', tpl: '', poll: 0, at: 0};
function brD(){ const d = miD('bring'); if (!Array.isArray(d.lists)) d.lists = []; if (typeof d.name !== 'string') d.name = ''; return d; }
const brKey = () => { const a = crypto.getRandomValues(new Uint8Array(18)); return [...a].map(x => x.toString(16).padStart(2, '0')).join(''); };
async function brCall(path, body){
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(BR_API() + path, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: ctl.signal, credentials: 'omit'} : {signal: ctl.signal, cache: 'no-store', credentials: 'omit'});
    const j = await r.json().catch(() => ({err: 'server'})); if (!r.ok && !j.err) j.err = 'server'; return j;
  } catch (e) { return {err: 'net'}; } finally { clearTimeout(tm); }
}
const brMine = id => brD().lists.find(x => x.id === id);
function brTake(j){
  if (j && j.data){ BRX.data = j.data; BRX.v = j.v; BRX.at = Date.now(); const m = brMine(BRX.open); if (m && (m.t !== j.data.t || m.d !== j.data.d)){ m.t = j.data.t; m.d = j.data.d; saveSet(); } }
  if (j && j.err){ BRX.err = j.err; if (j.err === 'gone'){ BRX.data = null; } } else BRX.err = '';
}
async function brLoad(id, quiet){
  if (!id) return; if (!quiet){ BRX.busy = true; BRX.err = ''; if (BRX.open !== id) BRX.data = null; BRX.open = id; miRender('bring'); }
  const j = await brCall('/' + id); if (BRX.open !== id) return;
  const before = JSON.stringify(BRX.data); brTake(j); BRX.busy = false;
  if (!quiet || JSON.stringify(BRX.data) !== before || j.err){ if (!brTyping()) miRender('bring'); }
}
const brTyping = () => { const a = document.activeElement; return !!(a && a.closest && a.closest('#hr_bring') && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && a.value); };
async function brOp(body){
  const m = brMine(BRX.open); if (m && m.key) body.key = m.key;
  BRX.busy = true; const j = await brCall('/' + BRX.open, body); BRX.busy = false; brTake(j);
  if (j.err && j.err !== 'gone') toast(t('br_e_' + (['owner', 'full', 'net', 'name'].includes(j.err) ? j.err : 'server')));
  miRender('bring'); return !j.err;
}
function brPoll(){
  clearInterval(BRX.poll);
  BRX.poll = setInterval(() => { if (document.hidden || tab !== 'bring' || !BRX.open || BRX.busy) return; brLoad(BRX.open, true); }, 7000);
}
function brShareText(){
  const d = BRX.data || {}; return t('br_shareTxt', {t: d.t || t('tab_bring'), d: d.d ? ' (' + dLabel(d.d) + ')' : ''}) + '\n' + BR_LINK(BRX.open);
}
function brSummary(){
  const d = BRX.data || {items: []}, lines = d.items.map(x => { const got = x.c.reduce((s, c) => s + c.q, 0); return (got >= x.q ? '✅ ' : '⬜ ') + x.x + (x.q > 1 ? ' ×' + x.q : '') + (x.c.length ? ' – ' + x.c.map(c => c.n + (c.q > 1 ? ' ×' + c.q : '')).join(', ') : ''); });
  return (d.t || t('tab_bring')) + (d.d ? ' · ' + dLabel(d.d) : '') + '\n' + lines.join('\n') + '\n' + BR_LINK(BRX.open);
}
function brHomeHTML(E){
  const d = brD(), tp = BRX.tpl;
  return `<div class="mi-card br-new"><h4 class="rc-h">＋ ${E(t('br_new'))}</h4>
      <div class="ds-chips br-tpls">${Object.keys(BR_TPL).map(k => `<button type="button" class="ds-chip${tp === k ? ' on' : ''}" data-brtpl="${k}" aria-pressed="${tp === k}">${BR_IC[k]} ${E(t('br_t_' + k))}</button>`).join('')}</div>
      ${tp ? `<div class="bk-grid"><label class="bk-f"><span>${E(t('br_title'))}</span><input type="text" id="br_t" maxlength="60" dir="auto" value="${E(tp === 'empty' ? '' : t('br_t_' + tp))}"></label>
        <label class="bk-f"><span>${E(t('br_date'))}</span><input type="date" id="br_d"></label>
        <label class="bk-f rc-wide"><span>${E(t('br_note'))}</span><input type="text" id="br_n" maxlength="200" dir="auto" placeholder="${E(t('br_notePh'))}"></label></div>
        ${BR_TPL[tp].length ? `<p class="fine">${E(t('br_willAdd'))}: ${BR_TPL[tp].map(k => E(t(k))).join(' · ')}</p>` : ''}
        <div class="btnrow"><button type="button" class="gold-btn" id="br_create"${BRX.busy ? ' disabled' : ''}>✓ ${E(t('br_create'))}</button></div>` : ''}
    </div>
    <h4 class="sec-t">${E(t('br_mine'))}</h4>
    <ul class="mi-list">${d.lists.map(x => `<li class="mi-item br-li"><button type="button" class="br-open" data-bropen="${E(x.id)}"><b dir="auto">${E(x.t || t('tab_bring'))}</b><small>${x.d ? E(dLabel(x.d)) + ' · ' : ''}${E(t(x.key ? 'br_owner' : 'br_guest'))}</small></button><button type="button" class="px-tb s" data-brforget="${E(x.id)}" aria-label="${E(t('br_forget'))}">✕</button></li>`).join('') || `<li class="fine bk-empty">${E(t('br_none'))}</li>`}</ul>
    ${BRX.err === 'net' ? `<p class="rm-w">⚠️ ${E(t('br_e_net'))}</p>` : ''}
    <p class="fine">${E(t('br_how'))}</p>`;
}
function brListHTML(E){
  const D = brD(), L = BRX.data, m = brMine(BRX.open), own = !!(m && m.key), me = D.name;
  if (!L) return `<div class="btnrow"><button type="button" class="btn" id="br_back">‹ ${E(t('br_back'))}</button></div>` + (BRX.busy ? `<p class="rc-busy" role="status">⏳ ${E(t('br_loading'))}</p>` : `<p class="rm-w">⚠️ ${E(t(BRX.err === 'gone' ? 'br_e_gone' : BRX.err === 'net' ? 'br_e_net' : 'br_e_server'))}</p><div class="btnrow"><button type="button" class="btn" id="br_retry">↻ ${E(t('br_retry'))}</button></div>`);
  const done = L.items.filter(x => x.c.reduce((s, c) => s + c.q, 0) >= x.q).length;
  return `<div class="btnrow br-bar"><button type="button" class="btn" id="br_back">‹ ${E(t('br_back'))}</button><button type="button" class="gold-btn" id="br_share">📤 ${E(t('br_share'))}</button><button type="button" class="btn" id="br_copy">📋 ${E(t('br_copySum'))}</button></div>
    <div class="hero mi-hero br-hero"><span class="hero-label" dir="auto">${E(L.t || t('tab_bring'))}${L.d ? ' · ' + E(dLabel(L.d)) : ''}</span><span class="hero-value num">${done}/${L.items.length}</span><div class="hero-sub">${E(t('br_covered'))}</div>${L.n ? `<p class="br-note" dir="auto">${E(L.n)}</p>` : ''}</div>
    ${BRX.err === 'net' ? `<p class="rm-w">⚠️ ${E(t('br_e_net'))}</p>` : ''}
    <label class="bk-f br-me"><span>${E(t('br_me'))}</span><input type="text" id="br_me" maxlength="24" dir="auto" value="${E(me)}" placeholder="${E(t('br_mePh'))}"></label>
    <ul class="mi-list br-items">${L.items.map(x => { const got = x.c.reduce((s, c) => s + c.q, 0), mine = me && x.c.find(c => c.n === me), full = got >= x.q;
      return `<li class="mi-item br-it${full ? ' full' : ''}"><div class="br-row"><b dir="auto">${full ? '✅ ' : ''}${E(x.x)}${x.q > 1 ? ` <small>×${x.q}</small>` : ''}</b>
        ${mine ? `<button type="button" class="btn br-un" data-brun="${E(x.i)}">✓ ${E(t('br_mine1'))} · ${E(t('br_cancel'))}</button>` : `<span class="br-take">${x.q > 1 ? `<select data-brq="${E(x.i)}" aria-label="${E(t('br_qty'))}">${Array.from({length: Math.min(20, x.q)}, (_, k) => `<option value="${k + 1}"${k + 1 === Math.max(1, Math.min(x.q, x.q - got)) ? ' selected' : ''}>${k + 1}</option>`).join('')}</select>` : ''}<button type="button" class="gold-btn br-claim" data-brclaim="${E(x.i)}">🙋 ${E(t('br_bring'))}</button></span>`}
        ${own ? `<button type="button" class="px-tb s" data-brdel="${E(x.i)}" aria-label="${E(t('rc_del'))}">🗑️</button>` : ''}</div>
        ${x.c.length ? `<div class="br-who">${x.c.map(c => `<span class="br-chip${c.n === me ? ' me' : ''}" dir="auto">${E(c.n)}${c.q > 1 ? ' ×' + c.q : ''}</span>`).join('')}</div>` : `<div class="br-who fine">${E(t('br_nobody'))}</div>`}</li>`; }).join('') || `<li class="fine bk-empty">${E(t('br_empty'))}</li>`}</ul>
    <div class="mi-card br-add"><div class="bk-grid"><label class="bk-f rc-wide"><span>${E(t('br_addItem'))}</span><input type="text" id="br_x" maxlength="60" dir="auto" placeholder="${E(t('br_addPh'))}"></label>
      <label class="bk-f"><span>${E(t('br_qty'))}</span><input type="text" inputmode="numeric" dir="ltr" id="br_q" value="1"></label></div>
      <div class="btnrow"><button type="button" class="btn" id="br_addgo">＋ ${E(t('br_add'))}</button></div></div>
    ${own ? `<details class="br-own"><summary>⚙️ ${E(t('br_manage'))}</summary><div class="bk-grid"><label class="bk-f"><span>${E(t('br_title'))}</span><input type="text" id="br_mt" maxlength="60" dir="auto" value="${E(L.t)}"></label><label class="bk-f"><span>${E(t('br_date'))}</span><input type="date" id="br_md" value="${E(L.d)}"></label><label class="bk-f rc-wide"><span>${E(t('br_note'))}</span><input type="text" id="br_mn" maxlength="200" dir="auto" value="${E(L.n)}"></label></div>
      <div class="btnrow"><button type="button" class="btn" id="br_msave">✓ ${E(t('br_msave'))}</button><button type="button" class="btn br-drop" id="br_drop">🗑️ ${E(t('br_drop'))}</button></div></details>` : ''}
    <p class="fine">${E(t('br_live'))}</p>`;
}
miniDef('bring', {
  intro: 'br_intro',
  render(box, api){
    const E = api.E, D = brD();
    box.innerHTML = BRX.open ? brListHTML(E) : brHomeHTML(E);
    if (BRX.open) brPoll(); else clearInterval(BRX.poll);
    const needName = () => { const n = (box.querySelector('#br_me') || {}).value; const v = String(n || '').trim().slice(0, 24); if (v !== D.name){ D.name = v; api.save(); } if (!v){ toast(t('br_e_name')); const el = box.querySelector('#br_me'); if (el) el.focus(); } return v; };
    box.onchange = e => { if (e.target.id === 'br_me'){ D.name = e.target.value.trim().slice(0, 24); api.save(); } };
    box.onkeydown = e => { if (e.key === 'Enter' && e.target.id === 'br_x'){ e.preventDefault(); const b = box.querySelector('#br_addgo'); if (b) b.click(); } };
    box.onclick = async e => { const T0 = e.target; let b;
      if ((b = T0.closest('[data-brtpl]'))){ BRX.tpl = BRX.tpl === b.dataset.brtpl ? '' : b.dataset.brtpl; api.redraw(); const n = box.querySelector('#br_t'); if (n) n.focus(); return; }
      if (T0.closest('#br_create')){
        const g = id => ((box.querySelector('#' + id) || {}).value || '').trim(), key = brKey(), tp = BRX.tpl;
        const data = {t: g('br_t') || t('br_t_' + (tp || 'empty')), d: g('br_d'), n: g('br_n'), items: (BR_TPL[tp] || []).map(k => ({x: t(k), q: 1, c: []}))};
        BRX.busy = true; api.redraw(); const j = await brCall('', {key, data}); BRX.busy = false;
        if (j.err || !j.id){ BRX.err = j.err || 'server'; toast(t('br_e_' + (j.err === 'net' ? 'net' : 'server'))); api.redraw(); return; }
        D.lists.unshift({id: j.id, t: j.data.t, d: j.data.d, key, at: Date.now()}); D.lists = D.lists.slice(0, 40); api.save();
        BRX.tpl = ''; BRX.open = j.id; brTake(j); api.redraw(); toast(t('br_created')); return;
      }
      if ((b = T0.closest('[data-bropen]'))){ brLoad(b.dataset.bropen); return; }
      if ((b = T0.closest('[data-brforget]'))){ const x = brMine(b.dataset.brforget); if (x && x.key && !b.dataset.sure){ b.dataset.sure = '1'; b.textContent = t('br_forgetSure'); setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = '✕'; } }, 4000); return; }
        D.lists = D.lists.filter(y => y.id !== b.dataset.brforget); api.save(); api.redraw(); return; }
      if (T0.closest('#br_back')){ BRX.open = ''; BRX.data = null; BRX.err = ''; clearInterval(BRX.poll); api.redraw(); return; }
      if (T0.closest('#br_retry')){ brLoad(BRX.open); return; }
      if (T0.closest('#br_share')){ const txt = brShareText(); if (typeof shrOpen === 'function') shrOpen('', txt, BRX.data && BRX.data.t || t('tab_bring')); else { copyText(txt); toast(t('st_copied')); } return; }
      if (T0.closest('#br_copy')){ copyText(brSummary()); toast(t('st_copied')); return; }
      if ((b = T0.closest('[data-brclaim]'))){ const n = needName(); if (!n) return; const q = box.querySelector(`[data-brq="${b.dataset.brclaim}"]`); brOp({op: 'claim', item: b.dataset.brclaim, name: n, q: q ? +q.value : 1}); return; }
      if ((b = T0.closest('[data-brun]'))){ brOp({op: 'unclaim', item: b.dataset.brun, name: D.name}); return; }
      if ((b = T0.closest('[data-brdel]'))){ if (!b.dataset.sure){ b.dataset.sure = '1'; b.textContent = t('rc_sure'); setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = '🗑️'; } }, 3500); return; } brOp({op: 'del', item: b.dataset.brdel}); return; }
      if (T0.closest('#br_addgo')){ const x = ((box.querySelector('#br_x') || {}).value || '').trim(); if (!x){ const el = box.querySelector('#br_x'); if (el) el.focus(); return; }
        const q = Math.max(1, Math.min(99, parseInt((box.querySelector('#br_q') || {}).value, 10) || 1)); const nm = ((box.querySelector('#br_me') || {}).value || '').trim();
        if (await brOp({op: 'add', text: x, q, name: nm})) { const el = box.querySelector('#br_x'); if (el) el.focus(); } return; }
      if (T0.closest('#br_msave')){ const g = id => ((box.querySelector('#' + id) || {}).value || '').trim(); if (await brOp({op: 'meta', t: g('br_mt'), d: g('br_md'), n: g('br_mn')})) toast(t('br_saved')); return; }
      if ((b = T0.closest('#br_drop'))){ if (!b.dataset.sure){ b.dataset.sure = '1'; b.textContent = t('br_dropSure'); return; }
        const m = brMine(BRX.open); const j = await brCall('/' + BRX.open, {op: 'drop', key: m && m.key}); if (j.err){ toast(t('br_e_' + (j.err === 'net' ? 'net' : 'server'))); return; }
        D.lists = D.lists.filter(y => y.id !== BRX.open); api.save(); BRX.open = ''; BRX.data = null; toast(t('br_dropped')); api.redraw(); return; }
    };
  },
  disc: ''
});
/* a link "…#bring=ID" opens the list, without signing up */
function brFromHash(){
  const m = /[#&]bring=([A-Za-z0-9]{12,24})/.exec(location.hash || ''); if (!m) return;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  const id = m[1], D = brD(); if (!brMine(id)){ D.lists.unshift({id, t: '', d: '', at: Date.now()}); D.lists = D.lists.slice(0, 40); try { saveSet(); } catch (e) {} }
  BRX.open = id; BRX.data = null; activate('bring'); brLoad(id);
}
window.addEventListener('hashchange', brFromHash);
setTimeout(() => { try { brFromHash(); } catch (e) {} }, 0);
try { FREE_TABS.push('bring', 'miluim'); } catch (e) {}
document.addEventListener('visibilitychange', () => { if (!document.hidden && tab === 'bring' && BRX.open && Date.now() - BRX.at > 5000) brLoad(BRX.open, true); });

/* ================= reservists: grants, credit points and reminders ================= */
const ML_PT = 2904;                     // value of one credit point in 2026 (₪ a year)
function mlGrant(days){ return days >= 37 ? 2 : days >= 20 ? 1.5 : days >= 15 ? 1 : days >= 10 ? 0.5 : 0; }
function mlPoints(days, y){
  if (y >= 2027) return days < 20 ? 0 : Math.min(4, 0.75 + Math.floor((days - 20) / 5) * 0.25);
  if (days < 30) return 0; if (days < 40) return 0.5; if (days < 50) return 0.75;
  return Math.min(4, 1 + Math.floor((days - 50) / 5) * 0.25);
}
function mlCalc(v){
  const y = +v.year || 2026, days = Math.max(0, Math.min(366, Math.round(v.days * 2) / 2)), tier = v.tier || 'b', B = typeof IL26B === 'object' ? IL26B : {rsPers: {}, rsFam: {}, rsHouse: 1250};
  const g = mlGrant(days) * ML_PT;
  const spec = days >= 32 ? (Math.min(days, 60) - 31) * 133.33 : 0;
  const extra = y === 2026 && days > 40 ? Math.floor(days - 40) : 0;
  const pers = extra * ((B.rsPers || {})[tier] || 0), fam = v.kids ? extra * ((B.rsFam || {})[tier] || 0) : 0;
  const house = y === 2026 && v.active ? (B.rsHouse || 1250) : 0;
  const once = y === 2026 && days >= 45 ? ({ap: 1250, a: 1065, b: 815}[tier] || 0) : 0;
  const pts = v.combat ? mlPoints(days, y) : 0, credit = pts * ML_PT;
  return {y, days, g, spec, pers, fam, house, once, pts, credit, total: g + spec + pers + fam + house + once + credit, cash: g + spec + pers + fam + house + once};
}
function mlRems(r){
  const L = [], ny = r.y + 1;
  if (r.g > 0) L.push({title: t('ml_rem_grant', {y: r.y}), date: ny + '-05-01', cat: 'money', before: 7, note: t('ml_rem_grantN', {a: MI0(r.g + r.spec)}), amt: Math.round(r.g + r.spec)});
  if (r.pts > 0) L.push({title: t('ml_rem_101', {y: ny}), date: ny + '-01-10', cat: 'tax', before: 10, note: t('ml_rem_101N', {p: r.pts, a: MI0(r.credit)})});
  if (r.pts > 0) L.push({title: t('ml_rem_slip', {y: ny}), date: ny + '-02-15', cat: 'tax', before: 3, note: t('ml_rem_slipN')});
  if (r.days >= 10) L.push({title: t('ml_rem_arnona'), date: (r.y < new Date().getFullYear() ? new Date().getFullYear() : ny) + '-01-15', cat: 'home', before: 7, note: t('ml_rem_arnonaN')});
  return L;
}
miniDef('miluim', {
  intro: 'ml_intro',
  fields: [
    {k: 'year', t: 'ml_year', type: 'sel', def: '2026', opts: [['2026', 'ml_y2026'], ['2025', 'ml_y2025']]},
    {k: 'days', t: 'ml_days', type: 'num', u: 'ml_u_days', def: 30, h: 'ml_daysH'},
    {k: 'combat', t: 'ml_combat', type: 'chk', def: false, h: 'ml_combatH'},
    {k: 'tier', t: 'f_rsUnit', type: 'sel', def: 'b', opts: [['ap', 'o_rsAp'], ['a', 'o_rsA'], ['b', 'o_rsB'], ['d', 'o_rsD'], ['e', 'o_rsE']], h: 'h_rsUnit', show: v => v.year === '2026'},
    {k: 'kids', t: 'f_rsKids', type: 'chk', def: false, show: v => v.year === '2026'},
    {k: 'active', t: 'f_rsActive', type: 'chk', def: true, h: 'h_rsActive', show: v => v.year === '2026'}
  ],
  calc(v){
    const r = mlCalc(v), ny = r.y + 1;
    return {
      hero: {l: t('ml_hero', {y: r.y}), v: MI0(r.total), sub: t('ml_heroSub', {c: MI0(r.cash), p: MI0(r.credit)})},
      warn: r.days < 10 ? t('ml_w10') : '',
      rows: [
        [t('ml_r_grant', {y: ny}), MI0(r.g)],
        r.spec > 0 ? [t('ml_r_spec', {y: ny}), MI0(r.spec)] : null,
        r.y === 2026 ? [t('ml_r_pers'), MI0(r.pers)] : null,
        r.y === 2026 && v.kids ? [t('ml_r_fam'), MI0(r.fam)] : null,
        r.y === 2026 ? [t('ml_r_house'), MI0(r.house)] : null,
        r.once > 0 ? [t('ml_r_once'), MI0(r.once)] : null,
        [t('ml_r_cash'), MI0(r.cash), 'key'],
        [t('ml_r_pts', {y: ny}), v.combat ? MIn(r.pts, 2) : t('ml_onlyCombat')],
        [t('ml_r_credit', {y: ny}), MI0(r.credit), 'key']
      ].filter(Boolean),
      bars: [{l: t('ml_b_grant'), v: r.g + r.spec}, {l: t('ml_b_daily'), v: r.pers + r.fam}, {l: t('ml_b_house'), v: r.house + r.once}, {l: t('ml_b_tax'), v: r.credit}].filter(b => b.v > 0),
      tips: [t('ml_t_pay'), t('ml_t_tax'), t('ml_t_family'), t('ml_t_birth'), t('ml_t_more'), t('ml_t_job'), t('ml_t_arnona'), t('ml_t_student')],
      note: t('ml_note'),
      links: [{t: t('ml_l_points'), url: 'https://www.kolzchut.org.il/he/%D7%A0%D7%A7%D7%95%D7%93%D7%95%D7%AA_%D7%96%D7%99%D7%9B%D7%95%D7%99_%D7%9E%D7%9E%D7%A1_%D7%94%D7%9B%D7%A0%D7%A1%D7%94_%D7%9C%D7%9C%D7%95%D7%97%D7%9E%D7%99_%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D'},
        {t: t('ml_l_grant'), url: 'https://www.kolzchut.org.il/he/%D7%AA%D7%92%D7%9E%D7%95%D7%9C_%D7%A0%D7%95%D7%A1%D7%A3_%D7%9C%D7%97%D7%99%D7%99%D7%9C%D7%99_%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D'},
        {t: t('ml_l_house'), url: 'https://www.kolzchut.org.il/he/%D7%9E%D7%A2%D7%A0%D7%A7_%D7%9B%D7%9C%D7%9B%D7%9C%D7%AA_%D7%94%D7%91%D7%99%D7%AA_%D7%9C%D7%9E%D7%A9%D7%A8%D7%AA%D7%99_%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D_%D7%A4%D7%A2%D7%99%D7%9C%D7%99%D7%9D'},
        {t: t('ml_l_idf'), url: 'https://www.miluim.idf.il/'}],
      acts: [{t: '🔔 ' + t('ml_addRems'), fn: () => { const L = mlRems(r); let n = 0; L.forEach(x => { if (miRemAdd(x)) n++; }); toast(n ? t('fc_addedN', {n}) : t('fc_exists')); }},
        {t: '↗ ' + t('tab_reserve'), fn: () => activate('reserve')}]
    };
  },
  disc: 'mi_notAdvice'
});
try { Object.assign(GS_SYN, {
  rcpt: 'קבלה קבלות סריקת קבלה צילום קבלה הוצאות עסק מע״מ תשומות חשבונית receipt receipts scan invoice expenses vat إيصال إيصالات فاتورة مصاريف',
  bring: 'מי מביא מה רשימה משותפת ארוחת שישי על האש טיול מסיבה פיקניק potluck who brings what shared list من يحضر ماذا قائمة مشتركة',
  miluim: 'מילואים זכויות מילואים מענק מילואים נקודות זיכוי לוחם תגמול נוסף בני זוג reservist reserve duty grants credit points الاحتياط حقوق جنود الاحتياط منحة'
}); } catch (e) {}
Object.assign(T, {
  tab_rcpt:['סורק קבלות','ماسح الإيصالات','Receipt scanner'], d_rcpt:['מצלמים קבלה – והיא נכנסת להוצאות בקטגוריה הנכונה. לבית ולעסק.','صوّروا الإيصال – فيدخل إلى المصاريف في الفئة الصحيحة. للبيت وللعمل.','Snap a receipt – it goes into your expenses in the right category. For home and business.'],
  rc_intro:['מצלמים קבלה, בודקים את הסכום והקטגוריה – והיא נשמרת גם כאן וגם ב„הוצאות חודשיות”. קבלות עסקיות נספרות בנפרד, עם המע״מ.','صوّروا الإيصال، تحقّقوا من المبلغ والفئة – فيُحفظ هنا وفي „المصاريف الشهرية”. إيصالات العمل تُحسب على حدة مع ض.ق.م.','Snap a receipt, check the amount and category – it is saved here and in "Monthly expenses". Business receipts are counted separately, with the VAT.'],
  rc_shoot:['צילום קבלה','تصوير إيصال','Snap a receipt'], rc_gallery:['מהגלריה','من المعرض','From gallery'], rc_manual:['הקלדה ידנית','إدخال يدوي','Type it in'],
  rc_aiOn:['הקבלה נקראת אוטומטית: שם העסק, התאריך, הסכום והמע״מ. תמיד אפשר לתקן לפני השמירה.','يُقرأ الإيصال تلقائيًا: اسم المحل والتاريخ والمبلغ وض.ق.م. يمكن التصحيح دائمًا قبل الحفظ.','The receipt is read automatically: business name, date, amount and VAT. You can always fix it before saving.'],
  rc_aiOff:['התמונה נשמרת עם הקבלה; מקלידים את הסכום, והקטגוריה מוצעת לפי שם העסק.','تُحفظ الصورة مع الإيصال؛ تُدخلون المبلغ، وتُقترح الفئة حسب اسم المحل.','The photo is kept with the receipt; type the amount, and the category is suggested from the business name.'],
  rc_noAi:['קריאה אוטומטית של הקבלה פועלת עם עוזר AI מחובר. בינתיים – מקלידים את הסכום ושם העסק.','القراءة التلقائية للإيصال تعمل مع مساعد ذكاء اصطناعي متصل. حاليًا – أدخلوا المبلغ واسم المحل.','Automatic reading works with a connected AI assistant. For now – type the amount and business name.'],
  rc_noAiC:['כאן אין גישה לקריאת תמונות – מקלידים את הסכום ושם העסק.','لا توجد هنا قراءة للصور – أدخلوا المبلغ واسم المحل.','Image reading isn’t available here – type the amount and business name.'],
  rc_reading:['קורא את הקבלה…','جارٍ قراءة الإيصال…','Reading the receipt…'], rc_readFail:['לא הצלחתי לקרוא את הקבלה – אפשר להשלים ידנית.','لم أتمكن من قراءة الإيصال – يمكن الإكمال يدويًا.','Couldn’t read the receipt – you can fill it in by hand.'],
  rc_notReceipt:['זו לא נראית כמו קבלה – אפשר להשלים ידנית או לצלם שוב.','لا يبدو هذا إيصالًا – يمكن الإكمال يدويًا أو التصوير مجددًا.','This doesn’t look like a receipt – fill it in or snap again.'],
  rc_otherCur:['הקבלה במטבע {c} – הסכום נשמר בשקלים, כדאי לבדוק.','الإيصال بعملة {c} – يُحفظ المبلغ بالشيكل، يُستحسن التحقق.','The receipt is in {c} – the amount is saved in shekels, worth checking.'],
  rc_imgFail:['לא הצלחתי לפתוח את התמונה.','تعذّر فتح الصورة.','Couldn’t open the image.'],
  rc_check:['בדיקה לפני שמירה','تحقق قبل الحفظ','Check before saving'], rc_edit:['עריכת קבלה','تعديل الإيصال','Edit receipt'],
  rc_home:['בית','بيت','Home'], rc_biz:['עסק','عمل','Business'], rc_receipt:['קבלה','إيصال','Receipt'],
  rc_c_store:['שם העסק','اسم المحل','Business name'], rc_c_amt:['סכום','المبلغ','Amount'], rc_c_date:['תאריך','التاريخ','Date'], rc_c_cat:['קטגוריה','الفئة','Category'], rc_c_pay:['אמצעי תשלום','وسيلة الدفع','Payment'],
  rc_c_vat:['מע״מ','ض.ق.م','VAT'], rc_c_type:['סוג','النوع','Type'], rc_c_note:['הערה','ملاحظة','Note'],
  rc_storePh:['למשל: שופרסל','مثلًا: شوفرسال','e.g. Shufersal'], rc_vatPh:['ריק = חישוב אוטומטי','فارغ = حساب تلقائي','Empty = automatic'],
  rc_lines:['{n} שורות בקבלה','{n} سطرًا في الإيصال','{n} lines on the receipt'], rc_saveBtn:['שמירה להוצאות','حفظ في المصاريف','Save to expenses'],
  rc_needAmt:['חסר סכום','المبلغ مفقود','The amount is missing'], rc_saved:['נשמר: {a}','تم الحفظ: {a}','Saved: {a}'], rc_updated:['עודכן: {a}','تم التحديث: {a}','Updated: {a}'], rc_deleted:['הקבלה נמחקה','حُذف الإيصال','Receipt deleted'],
  rc_monthSum:['קבלות החודש ({n})','إيصالات الشهر ({n})','This month’s receipts ({n})'], rc_bizSub:['עסק: {b} · מע״מ תשומות: {v}','عمل: {b} · ض.ق.م المدخلات: {v}','Business: {b} · input VAT: {v}'],
  rc_none:['אין קבלות בחודש הזה.','لا توجد إيصالات هذا الشهر.','No receipts this month.'], rc_view:['תמונה','صورة','Photo'], rc_del:['מחיקה','حذف','Delete'], rc_sure:['למחוק?','حذف؟','Delete?'],
  rc_csvM:['קובץ לחודש','ملف للشهر','Month file'], rc_csvY:['קובץ לשנת {y}','ملف لسنة {y}','{y} file'], rc_file:['קבלות','إيصالات','Receipts'],
  rc_priv:['הקבלות והתמונות נשמרות רק בטלפון שלך. הקובץ לרואה החשבון נוצר כאן.','تُحفظ الإيصالات والصور على هاتفك فقط. يُنشأ ملف المحاسب هنا.','Receipts and photos stay on your phone only. The accountant file is made here.'],
  rc_privNoPics:['במצב פרטי או בחשבון מוצפן התמונות לא נשמרות – רק פרטי הקבלה.','في الوضع الخاص أو الحساب المشفّر لا تُحفظ الصور – فقط تفاصيل الإيصال.','In private mode or an encrypted account photos aren’t kept – only the receipt details.'],
  rc_disc:['לצורכי מס כדאי לשמור גם את הקבלה המקורית או סריקה שלה לפי הוראות רשות המסים.','لأغراض الضريبة يُستحسن الاحتفاظ بالإيصال الأصلي أو مسحه حسب تعليمات سلطة الضرائب.','For tax purposes, keep the original receipt or a scan of it as the Tax Authority requires.'],
  tab_bring:['מי מביא מה','من يحضر ماذا','Who brings what'], d_bring:['רשימה משותפת לארוחת שישי, על האש, טיול או מסיבה – כל אחד מסמן מה הוא מביא דרך קישור, בלי הרשמה.','قائمة مشتركة لعشاء الجمعة أو الشواء أو رحلة أو حفلة – كل واحد يحدد ما يحضره عبر رابط، بدون تسجيل.','A shared list for Friday dinner, a BBQ, a trip or a party – everyone marks what they bring through a link, no sign-up.'],
  br_intro:['פותחים רשימה, שולחים את הקישור לקבוצה – וכל אחד מסמן מה הוא מביא. כולם רואים את אותה רשימה, מתעדכנת מעצמה.','افتحوا قائمة، أرسلوا الرابط للمجموعة – وكل واحد يحدد ما يحضره. الجميع يرى القائمة نفسها، وتتحدث تلقائيًا.','Open a list, send the link to the group – everyone marks what they bring. Everyone sees the same list, updated by itself.'],
  br_new:['רשימה חדשה','قائمة جديدة','New list'], br_t_shabbat:['ארוחת שישי','عشاء الجمعة','Friday dinner'], br_t_bbq:['על האש','شواء','BBQ'], br_t_trip:['טיול','رحلة','Trip'], br_t_party:['מסיבה','حفلة','Party'], br_t_picnic:['פיקניק','نزهة','Picnic'], br_t_empty:['רשימה ריקה','قائمة فارغة','Empty list'],
  br_title:['שם האירוע','اسم المناسبة','Event name'], br_date:['תאריך','التاريخ','Date'], br_note:['הערה לכולם','ملاحظة للجميع','Note for everyone'], br_notePh:['למשל: מתחילים ב־19:30, אצל סבתא','مثلًا: نبدأ الساعة 19:30، عند الجدة','e.g. Starting 7:30pm, at Grandma’s'],
  br_willAdd:['פריטים שיתווספו (אפשר לשנות אחר כך)','عناصر ستُضاف (يمكن التغيير لاحقًا)','Items to add (you can change them later)'], br_create:['יצירת הרשימה','إنشاء القائمة','Create the list'], br_created:['הרשימה מוכנה – שלחו את הקישור','القائمة جاهزة – أرسلوا الرابط','The list is ready – send the link'],
  br_mine:['הרשימות שלי','قوائمي','My lists'], br_none:['עוד אין רשימות. פתחו רשימה חדשה או פתחו קישור שקיבלתם.','لا توجد قوائم بعد. افتحوا قائمة جديدة أو رابطًا وصلكم.','No lists yet. Start one, or open a link you received.'],
  br_owner:['פתחת אותה','أنشأتَها','You started it'], br_guest:['הוזמנת','مدعوّ','Invited'], br_forget:['הסרה מהרשימות שלי','إزالة من قوائمي','Remove from my lists'], br_forgetSure:['להסיר?','إزالة؟','Remove?'],
  br_how:['הרשימה נשמרת בשרת של האפליקציה רק כדי שכולם יראו אותה – בלי הרשמה ובלי פרטים אישיים, רק השמות שכל אחד בוחר. רשימה שלא נגעו בה 5 חודשים נמחקת.','تُحفظ القائمة على خادم التطبيق فقط ليراها الجميع – بلا تسجيل ولا بيانات شخصية، فقط الأسماء التي يختارها كل واحد. القائمة التي لم تُستخدم 5 أشهر تُحذف.','The list is kept on the app’s server only so everyone sees it – no sign-up, no personal details, just the names people choose. A list untouched for 5 months is deleted.'],
  br_back:['הרשימות שלי','قوائمي','My lists'], br_share:['שליחת קישור','إرسال الرابط','Send link'], br_copySum:['העתקת סיכום','نسخ الملخص','Copy summary'],
  br_covered:['פריטים מכוסים','عناصر مغطاة','items covered'], br_me:['השם שלי','اسمي','My name'], br_mePh:['איך יראו אותך ברשימה','كيف سيظهر اسمك في القائمة','How you’ll appear on the list'],
  br_bring:['אני מביא/ה','أنا أحضر','I’ll bring it'], br_mine1:['אני מביא/ה','أنا أحضر','I’m bringing it'], br_cancel:['ביטול','إلغاء','cancel'], br_qty:['כמות','الكمية','Qty'], br_nobody:['עוד אף אחד','لا أحد بعد','Nobody yet'],
  br_empty:['הרשימה ריקה – הוסיפו פריט.','القائمة فارغة – أضيفوا عنصرًا.','The list is empty – add an item.'], br_addItem:['פריט חדש','عنصر جديد','New item'], br_addPh:['למשל: עוגה','مثلًا: كعكة','e.g. Cake'], br_add:['הוספה','إضافة','Add'],
  br_manage:['ניהול הרשימה','إدارة القائمة','Manage the list'], br_msave:['שמירה','حفظ','Save'], br_saved:['נשמר','تم الحفظ','Saved'], br_drop:['מחיקת הרשימה לכולם','حذف القائمة للجميع','Delete the list for everyone'], br_dropSure:['בטוח? לחצו שוב','متأكد؟ اضغطوا مجددًا','Sure? Tap again'], br_dropped:['הרשימה נמחקה','حُذفت القائمة','The list was deleted'],
  br_live:['הרשימה מתעדכנת כל כמה שניות. רק מי שפתח אותה יכול למחוק פריטים או לשנות את הפרטים.','تتحدث القائمة كل بضع ثوانٍ. فقط من أنشأها يمكنه حذف العناصر أو تغيير التفاصيل.','The list refreshes every few seconds. Only whoever started it can delete items or change details.'],
  br_loading:['טוען את הרשימה…','جارٍ تحميل القائمة…','Loading the list…'], br_retry:['לנסות שוב','المحاولة مجددًا','Try again'],
  br_shareTxt:['מי מביא מה ל{t}{d}? מסמנים כאן, בלי הרשמה:','من يحضر ماذا لـ{t}{d}؟ حدّدوا هنا، بدون تسجيل:','Who brings what for {t}{d}? Mark it here, no sign-up:'],
  br_e_net:['אין חיבור כרגע – הרשימה תתעדכן כשהחיבור יחזור.','لا يوجد اتصال حاليًا – ستتحدث القائمة عند عودة الاتصال.','No connection right now – the list will update when it’s back.'], br_e_server:['משהו השתבש – נסו שוב.','حدث خطأ – حاولوا مجددًا.','Something went wrong – try again.'],
  br_e_gone:['הרשימה הזו נמחקה או שהקישור שגוי.','هذه القائمة حُذفت أو الرابط خاطئ.','This list was deleted or the link is wrong.'], br_e_owner:['רק מי שפתח את הרשימה יכול לעשות זאת.','فقط من أنشأ القائمة يمكنه ذلك.','Only whoever started the list can do that.'],
  br_e_full:['הרשימה מלאה (80 פריטים).','القائمة ممتلئة (80 عنصرًا).','The list is full (80 items).'], br_e_name:['כתבו קודם את השם שלכם','اكتبوا اسمكم أولًا','Write your name first'],
  br_i_challah:['חלות','خبز الحلة','Challah'], br_i_wine:['יין','نبيذ','Wine'], br_i_salads:['סלטים','سلطات','Salads'], br_i_main:['מנה עיקרית','طبق رئيسي','Main course'], br_i_side:['תוספת','طبق جانبي','Side dish'], br_i_dessert:['קינוח','حلوى','Dessert'],
  br_i_drinks:['שתייה','مشروبات','Drinks'], br_i_fruit:['פירות','فواكه','Fruit'], br_i_meat:['בשר','لحم','Meat'], br_i_coal:['פחמים ומנגל','فحم ومنقل','Charcoal & grill'], br_i_pitas:['פיתות','خبز','Pitas'], br_i_sauces:['רטבים','صلصات','Sauces'],
  br_i_ice:['קרח','ثلج','Ice'], br_i_dispos:['כלים חד־פעמיים','أدوات للاستعمال مرة واحدة','Disposable plates & cups'], br_i_water:['מים','ماء','Water'], br_i_sandw:['כריכים','سندويشات','Sandwiches'], br_i_snacks:['חטיפים','وجبات خفيفة','Snacks'],
  br_i_firstaid:['ערכת עזרה ראשונה','حقيبة إسعافات أولية','First-aid kit'], br_i_sun:['קרם הגנה','واقي شمس','Sunscreen'], br_i_mat:['מחצלת','حصيرة','Picnic mat'], br_i_trash:['שקיות זבל','أكياس قمامة','Trash bags'],
  br_i_cake:['עוגה','كعكة','Cake'], br_i_decor:['קישוטים','زينة','Decorations'], br_i_candles:['נרות','شموع','Candles'], br_i_music:['רמקול ומוזיקה','سماعة وموسيقى','Speaker & music'], br_i_ball:['כדור','كرة','Ball'],
  tab_miluim:['מילואים – זכויות ומענקים','الاحتياط – حقوق ومنح','Reservists – rights & grants'], d_miluim:['כמה מגיע על ימי המילואים: מענק שנתי, תגמול מיוחד, מענקי 2026, נקודות זיכוי ללוחמים – ותזכורות.','كم يستحق عن أيام الاحتياط: منحة سنوية، تعويض خاص، منح 2026، نقاط خصم للمقاتلين – وتذكيرات.','What your reserve days earn: annual grant, special pay, 2026 grants, credit points for fighters – and reminders.'],
  ml_intro:['מכניסים כמה ימי מילואים עשיתם בשנה – ומקבלים את המענקים שמגיעים, מתי הם נכנסים, ונקודות הזיכוי ללוחמים. את התגמול היומי מביטוח לאומי מחשבים ב„פיצוי מילואים”.','أدخلوا عدد أيام الاحتياط في السنة – واحصلوا على المنح المستحقة، ومتى تُدفع، ونقاط الخصم للمقاتلين. التعويض اليومي من التأمين الوطني يُحسب في „تعويض الاحتياط”.','Enter how many reserve days you served in the year – see the grants you’re owed, when they’re paid, and fighters’ credit points. The daily pay from Bituach Leumi is in "Reservist pay".'],
  ml_year:['שנת השירות','سنة الخدمة','Service year'], ml_y2026:['2026','2026','2026'], ml_y2025:['2025','2025','2025'], ml_days:['ימי מילואים בשנה','أيام الاحتياط في السنة','Reserve days in the year'], ml_u_days:['ימים','أيام','days'],
  ml_daysH:['מצטבר בכל השנה, לפי אישור צה״ל (טופס 3010).','تراكمي طوال السنة، حسب تأكيد الجيش (نموذج 3010).','Total for the year, per the IDF confirmation (form 3010).'],
  ml_combat:['לוחם/ת או תומך/ת לחימה','مقاتل/ة أو داعم/ة قتال','Fighter or combat support'], ml_combatH:['מזכה בנקודות זיכוי ממס הכנסה בשנה שאחרי.','يؤهل لنقاط خصم من ضريبة الدخل في السنة التالية.','Earns income-tax credit points the following year.'],
  ml_hero:['שווי ההטבות על שירות {y}','قيمة الامتيازات عن خدمة {y}','Value of benefits for {y} service'], ml_heroSub:['מענקים {c} · הקלה במס {p}','منح {c} · تخفيف ضريبي {p}','Grants {c} · tax relief {p}'],
  ml_w10:['מתחת ל־10 ימים בשנה אין מענק שנתי. נקודות זיכוי ללוחמים מתחילות מ־30 ימים (מ־2027: מ־20).','أقل من 10 أيام في السنة لا توجد منحة سنوية. نقاط الخصم للمقاتلين تبدأ من 30 يومًا (من 2027: من 20).','Under 10 days a year there’s no annual grant. Fighters’ credit points start at 30 days (from 2027: 20).'],
  ml_r_grant:['תגמול נוסף שנתי – נכנס עד 1 במאי {y}','تعويض سنوي إضافي – يُدفع حتى 1 أيار {y}','Annual extra pay – paid by 1 May {y}'], ml_r_spec:['תגמול מיוחד (ימים 32–60) – מאי {y}','تعويض خاص (الأيام 32–60) – أيار {y}','Special pay (days 32–60) – May {y}'],
  ml_r_pers:['מענק הוצאות אישיות (מהיום ה־41)','منحة المصاريف الشخصية (من اليوم 41)','Personal expenses grant (from day 41)'], ml_r_fam:['מענק משפחה (מהיום ה־41)','منحة العائلة (من اليوم 41)','Family grant (from day 41)'],
  ml_r_house:['מענק כלכלת הבית','منحة اقتصاد البيت','Household grant'], ml_r_once:['תוספת חד־פעמית 2026 (45+ ימים)','إضافة لمرة واحدة 2026 (45+ يومًا)','One-time 2026 top-up (45+ days)'], ml_r_cash:['סה״כ מענקים','مجموع المنح','Total grants'],
  ml_r_pts:['נקודות זיכוי בשנת המס {y}','نقاط الخصم في سنة الضريبة {y}','Credit points in tax year {y}'], ml_r_credit:['הקלה במס בשנת {y}','التخفيف الضريبي في سنة {y}','Tax relief in {y}'], ml_onlyCombat:['ללוחמים בלבד','للمقاتلين فقط','Fighters only'],
  ml_b_grant:['מענק שנתי ותגמול מיוחד','منحة سنوية وتعويض خاص','Annual grant & special pay'], ml_b_daily:['מענקים יומיים','منح يومية','Daily grants'], ml_b_house:['כלכלת הבית','اقتصاد البيت','Household'], ml_b_tax:['נקודות זיכוי','نقاط الخصم','Credit points'],
  ml_t_pay:['התגמול השנתי והתגמול המיוחד מביטוח לאומי נכנסים אוטומטית לחשבון הבנק עד 1 במאי בשנה שאחרי השירות – לא צריך להגיש בקשה. כדאי לוודא שפרטי הבנק מעודכנים.','التعويض السنوي والخاص من التأمين الوطني يُحوَّلان تلقائيًا إلى الحساب البنكي حتى 1 أيار من السنة التالية – لا حاجة لطلب. تأكدوا من تحديث تفاصيل البنك.','The annual and special pay from Bituach Leumi go into your bank automatically by 1 May the year after – no claim needed. Make sure your bank details are current.'],
  ml_t_tax:['נקודות זיכוי ללוחמים: מגישים למעסיק טופס 101 עם אישור צה״ל על ימי השירות בשנה הקודמת. עצמאים – בדוח השנתי. שכחתם? אפשר לבקש החזר מס עד 6 שנים אחורה.','نقاط الخصم للمقاتلين: قدّموا لصاحب العمل نموذج 101 مع تأكيد الجيش على أيام الخدمة في السنة السابقة. المستقلون – في التقرير السنوي. نسيتم؟ يمكن طلب استرداد ضريبي حتى 6 سنوات.','Fighters’ credit points: give your employer form 101 with the IDF confirmation of last year’s days. Self-employed – in the annual return. Forgot? You can claim a refund up to 6 years back.'],
  ml_t_family:['בני/בנות הזוג: יש מסלולי סיוע נפרדים – טיפול רגשי לכל המשפחה, השתתפות בנופש משפחתי, מענק להורים לילד עם צרכים מיוחדים, וסבסוד מעונות וצהרונים. בודקים בקרן הסיוע למילואים.','الأزواج: توجد مسارات مساعدة منفصلة – علاج نفسي للعائلة، مساهمة في عطلة عائلية، منحة لأهالي طفل ذي احتياجات خاصة، ودعم الحضانات. تحققوا في صندوق مساعدة جنود الاحتياط.','Spouses: there are separate support tracks – emotional care for the whole family, help with a family vacation, a grant for parents of a child with special needs, and daycare subsidies. Check with the reservists’ assistance fund.'],
  ml_t_birth:['בת זוג שהאריכה חופשת לידה בגלל המילואים של בן הזוג יכולה לקבל מענק חד־פעמי של כ־10,700 ₪ מקרן הסיוע – צריך להגיש בקשה.','الزوجة التي مدّدت إجازة الولادة بسبب خدمة الزوج في الاحتياط يمكنها الحصول على منحة لمرة واحدة بنحو 10,700 ₪ من صندوق المساعدة – يجب تقديم طلب.','A spouse who extended maternity leave because of the partner’s reserve duty can get a one-time grant of about ₪10,700 from the assistance fund – a claim is required.'],
  ml_t_more:['ארנק דיגיטלי של עד 5,000 ₪ לפנאי ולאגרות (מהיום ה־10), ומענקי מפקדים – לפי דרגת היחידה. מענקי הקרן לא תמיד אוטומטיים – שמרו את אישורי השירות.','محفظة رقمية حتى 5,000 ₪ للترفيه والرسوم (من اليوم 10)، ومنح للقادة – حسب درجة الوحدة. منح الصندوق ليست تلقائية دائمًا – احتفظوا بتأكيدات الخدمة.','A digital wallet of up to ₪5,000 for leisure and fees (from day 10), and commanders’ grants – by unit rank. Fund grants aren’t always automatic – keep your service confirmations.'],
  ml_t_job:['אסור לפטר בזמן המילואים ועד 30 יום אחריהם בלי היתר. ימי המילואים לא יורדים מהחופשה ולא פוגעים בוותק או בפנסיה.','يُمنع الفصل أثناء الاحتياط وحتى 30 يومًا بعده دون تصريح. أيام الاحتياط لا تُخصم من الإجازة ولا تمس الأقدمية أو التقاعد.','You can’t be dismissed during reserve duty or for 30 days after without a permit. Reserve days don’t come off your vacation and don’t hurt seniority or pension.'],
  ml_t_arnona:['הנחה בארנונה: רשויות רבות נותנות הנחה למשרתי מילואים פעילים – פונים לעירייה עם אישור השירות.','خصم الأرنونا: سلطات كثيرة تمنح خصمًا لجنود الاحتياط الفاعلين – توجهوا للبلدية مع تأكيد الخدمة.','Arnona discount: many municipalities discount active reservists – apply to the city with your service confirmation.'],
  ml_t_student:['סטודנטים ביחידות לוחמות: מימון שכר לימוד עד 100% בשנת הלימודים תשפ״ו, ונקודות אקדמיות – לפי תנאי המוסד.','الطلاب في الوحدات القتالية: تمويل الرسوم الدراسية حتى 100% في السنة الدراسية 2025–2026، ونقاط أكاديمية – حسب شروط المؤسسة.','Students in combat units: up to 100% tuition for the 2025–26 academic year, and academic credits – per the institution’s terms.'],
  ml_note:['הערכה לפי המדיניות שפורסמה ל־2026 וערך נקודת זיכוי של 2,904 ₪. הסכומים בפועל נקבעים לפי אישורי צה״ל וביטוח לאומי, ודרגת היחידה משפיעה על המענקים היומיים.','تقدير حسب السياسة المعلنة لعام 2026 وقيمة نقطة الخصم 2,904 ₪. المبالغ الفعلية تُحدد حسب تأكيدات الجيش والتأمين الوطني، ودرجة الوحدة تؤثر على المنح اليومية.','An estimate based on the published 2026 policy and a credit point worth ₪2,904. Actual amounts follow IDF and Bituach Leumi records; the unit rank affects the daily grants.'],
  ml_l_points:['נקודות זיכוי ללוחמים – כל זכות','نقاط الخصم للمقاتلين – كول زخوت','Fighters’ credit points – Kol Zchut'], ml_l_grant:['תגמול נוסף – כל זכות','تعويض إضافي – كول زخوت','Extra pay – Kol Zchut'], ml_l_house:['מענק כלכלת הבית – כל זכות','منحة اقتصاد البيت – كول زخوت','Household grant – Kol Zchut'], ml_l_idf:['אתר המילואים של צה״ל','موقع الاحتياط في الجيش','IDF reserves site'],
  ml_addRems:['הוספת התזכורות','إضافة التذكيرات','Add the reminders'],
  ml_rem_grant:['מענק מילואים על {y} – לבדוק שנכנס','منحة الاحتياط عن {y} – تحقق من وصولها','Reserve grant for {y} – check it arrived'], ml_rem_grantN:['צפוי כ־{a} מביטוח לאומי','متوقع نحو {a} من التأمين الوطني','About {a} expected from Bituach Leumi'],
  ml_rem_101:['טופס 101 + אישור לוחם ל־{y}','نموذج 101 + تأكيد مقاتل لـ{y}','Form 101 + fighter confirmation for {y}'], ml_rem_101N:['{p} נקודות זיכוי, שווי כ־{a} בשנה','{p} نقاط خصم، بقيمة نحو {a} سنويًا','{p} credit points, worth about {a} a year'],
  ml_rem_slip:['לבדוק בתלוש: נקודות מילואים {y}','تحقق في القسيمة: نقاط الاحتياط {y}','Check the payslip: reserve points {y}'], ml_rem_slipN:['אם הנקודות לא מופיעות – לפנות למעסיק או לבקש החזר מס.','إن لم تظهر النقاط – توجهوا لصاحب العمل أو اطلبوا استردادًا.','If the points aren’t there – ask your employer or claim a refund.'],
  ml_rem_arnona:['הנחת ארנונה למשרתי מילואים','خصم الأرنونا لجنود الاحتياط','Arnona discount for reservists'], ml_rem_arnonaN:['לפנות לעירייה עם אישור השירות.','التوجه للبلدية مع تأكيد الخدمة.','Apply to the city with your service confirmation.'],
});
