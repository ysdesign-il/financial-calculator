/* 13.38: two tools – receipts (photo → expense by category) and reservists (grants, credit points, reminders) */
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

try { FREE_TABS.push('miluim'); } catch (e) {}

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
