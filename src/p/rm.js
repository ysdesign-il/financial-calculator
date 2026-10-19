/* ---------- 13.19: reminders – dates that cost money if you miss them ----------
   Add, edit, repeat, mark done, export to the phone's calendar (.ics). Kept on this device only.
   Shown on Home when something is due; the scanner can turn a date it found into a reminder. */
const rmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const RM_CATS = [['car', '🚗'], ['home', '🏠'], ['tax', '🧾'], ['bills', '💡'], ['insur', '🛡️'], ['docs', '📄'], ['money', '💰'], ['family', '👪'], ['other', '📌']];
const RM_REP = ['none', 'week', 'month', 'year'];
const RM_BEFORE = [0, 1, 3, 7, 14, 30];
/* ready-made reminders: [key, category, repeat, days before] */
const RM_SUG = [['carLic', 'car', 'year', 14], ['carIns', 'car', 'year', 30], ['carTest', 'car', 'year', 14], ['homeIns', 'insur', 'year', 30], ['taxRefund', 'tax', 'year', 7],
  ['arnona', 'bills', 'month', 3], ['passport', 'docs', 'none', 90], ['drvLic', 'docs', 'none', 30], ['subEnd', 'money', 'none', 3], ['warranty', 'home', 'none', 14], ['deposit', 'money', 'none', 3], ['mortRev', 'money', 'year', 30]];
var RMV = {f: 'up', q: '', ed: null};
function rmD(){ const d = SET.rm && typeof SET.rm === 'object' ? SET.rm : (SET.rm = {}); if (!Array.isArray(d.items)) d.items = []; return d; }
const rmToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const rmParse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const rmIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const rmDays = s => { const d = rmParse(s); return d ? Math.round((d - rmToday()) / 864e5) : NaN; };
/* the next date of a repeating reminder (31 Jan + month = 28/29 Feb, never March) */
function rmNext(s, rep){
  const d = rmParse(s); if (!d) return s;
  if (rep === 'week') d.setDate(d.getDate() + 7);
  else if (rep === 'month' || rep === 'year'){ const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + (rep === 'year' ? 12 : 1)); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); }
  return rmIso(d);
}
const rmCat = k => RM_CATS.find(c => c[0] === k) || RM_CATS[RM_CATS.length - 1];
const rmFmt = s => { const d = rmParse(s); if (!d) return ''; try { return new Intl.DateTimeFormat(locOf(), {weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined}).format(d); } catch (e) { return s; } };
function rmWhen(it){
  const n = rmDays(it.date); if (!isFinite(n)) return '';
  return n === 0 ? t('rm_today') : n === 1 ? t('rm_tomorrow') : n > 1 ? t('rm_inDays', {n}) : t('rm_late', {n: -n});
}
/* due = from "days before" until it's done */
const rmDue = it => !it.done && isFinite(rmDays(it.date)) && rmDays(it.date) <= (+it.before || 0);
function rmList(){
  const q = RMV.q.trim().toLowerCase(), L = rmD().items.slice().sort((a, b) => (a.done - b.done) || String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')));
  return L.filter(it => (!q || (String(it.title) + ' ' + String(it.note || '')).toLowerCase().includes(q))
    && (RMV.f === 'all' ? true : RMV.f === 'done' ? it.done : RMV.f === 'late' ? !it.done && rmDays(it.date) < 0 : RMV.f.startsWith('c:') ? it.cat === RMV.f.slice(2) && !it.done : !it.done));
}

/* ---- the screen ---- */
function rmRender(){
  const root = $('#rm_root'); if (!root) return; const E = rmE, d = rmD(), L = rmList(), late = d.items.filter(it => !it.done && rmDays(it.date) < 0).length, due = d.items.filter(rmDue).length;
  const used = new Set(d.items.map(x => x.cat));
  root.innerHTML = `<p class="fine">${E(t('rm_intro'))}</p>
    ${due ? `<div class="ds-warn rm-ban" role="status"><span aria-hidden="true">⏰</span><p>${E(t('rm_dueN', {n: due}))}${late ? ' ' + E(t('rm_lateN', {n: late})) : ''}</p></div>` : ''}
    <div class="btnrow"><button type="button" class="gold-btn" id="rm_add">＋ ${E(t('rm_add'))}</button>${d.items.length ? `<button type="button" class="btn" id="rm_icsAll">📅 ${E(t('rm_icsAll'))}</button>` : ''}${'Notification' in window && !IN_CLAUDE && Notification.permission === 'default' ? `<button type="button" class="mv" id="rm_notif">🔔 ${E(t('rm_notif'))}</button>` : ''}</div>
    <div id="rm_ed"></div>
    ${d.items.length ? `<div class="rm-bar"><input type="search" id="rm_q" value="${E(RMV.q)}" placeholder="${E(t('rm_search'))}" aria-label="${E(t('rm_search'))}" dir="auto">
      <div class="ds-chips" role="radiogroup" aria-label="${E(t('rm_filter'))}">${[['up', t('rm_fUp')], ['late', t('rm_fLate') + (late ? ' (' + late + ')' : '')], ['done', t('rm_fDone')], ['all', t('rm_fAll')]].concat(RM_CATS.filter(c => used.has(c[0])).map(c => ['c:' + c[0], c[1] + ' ' + t('rm_c_' + c[0])])).map(([k, l]) => `<button type="button" role="radio" class="ds-chip${RMV.f === k ? ' on' : ''}" aria-checked="${RMV.f === k}" data-rmf="${E(k)}">${E(l)}</button>`).join('')}</div></div>` : ''}
    <ul class="rm-list">${L.map(it => rmCard(it)).join('') || `<li class="fine bk-empty">${E(t(d.items.length ? 'rm_noneF' : 'rm_none'))}</li>`}</ul>
    <h3 class="ds-q">💡 ${E(t('rm_sugH'))}</h3><div class="ds-chips rm-sug">${RM_SUG.filter(s => !d.items.some(x => x.sug === s[0])).map(s => `<button type="button" class="ds-chip" data-rmsug="${s[0]}">${rmCat(s[1])[1]} ${E(t('rm_s_' + s[0]))}</button>`).join('')}</div>
    <p class="fine sl-priv">🔒 ${E(t('rm_priv'))}</p>`;
  if (RMV.ed) rmEditor(RMV.ed === 'new' ? null : d.items.find(x => x.id === RMV.ed), RMV.pre);
}
function rmCard(it){
  const E = rmE, c = rmCat(it.cat), n = rmDays(it.date), cls = it.done ? 'done' : n < 0 ? 'late' : rmDue(it) ? 'due' : '';
  return `<li class="rm-it ${cls}"><div class="rm-ic" aria-hidden="true">${c[1]}</div><div class="rm-b"><b dir="auto">${E(it.title)}</b>
    <span class="rm-w">${E(rmFmt(it.date))}${it.time ? ' · <span dir="ltr">' + E(it.time) + '</span>' : ''} · <span class="rm-rel">${E(it.done ? t('rm_isDone') : rmWhen(it))}</span>${it.rep !== 'none' ? ' · 🔁 ' + E(t('rm_r_' + it.rep)) : ''}${+it.amt ? ' · <span dir="ltr">' + E(M(+it.amt, 0, 'ILS')) + '</span>' : ''}</span>
    ${it.note ? `<small dir="auto">${E(it.note)}</small>` : ''}
    <div class="rm-acts"><button type="button" class="px-tb s" data-rmdone="${E(it.id)}" aria-label="${E(t(it.done ? 'rm_undo' : it.rep !== 'none' ? 'rm_doneNext' : 'rm_done', {t: it.title}))}" title="${E(t(it.done ? 'rm_undo' : it.rep !== 'none' ? 'rm_doneNext' : 'rm_done', {t: it.title}))}">${it.done ? '↩️' : '✓'}</button>
    <button type="button" class="px-tb s" data-rmedit="${E(it.id)}" aria-label="${E(t('rm_edit', {t: it.title}))}" title="${E(t('rm_edit', {t: it.title}))}">✏️</button>
    <button type="button" class="px-tb s" data-rmics="${E(it.id)}" aria-label="${E(t('rm_ics', {t: it.title}))}" title="${E(t('rm_ics', {t: it.title}))}">📅</button>
    <button type="button" class="px-tb s" data-rmdup="${E(it.id)}" aria-label="${E(t('rm_dup', {t: it.title}))}" title="${E(t('rm_dup', {t: it.title}))}">⧉</button>
    <button type="button" class="px-tb s" data-rmdel="${E(it.id)}" aria-label="${E(t('rm_del', {t: it.title}))}" title="${E(t('rm_del', {t: it.title}))}">🗑️</button></div></div></li>`;
}
/* the editor: everything about a reminder can be changed */
function rmEditor(it, pre){
  const box = $('#rm_ed'); if (!box) return; const E = rmE, v = Object.assign({title: '', date: rmIso(new Date(Date.now() + 7 * 864e5)), time: '', rep: 'none', cat: 'other', before: 3, note: '', amt: ''}, pre || {}, it || {});
  box.innerHTML = `<form class="bk-acc rm-form" id="rm_form" novalidate><fieldset><legend>${it ? '✏️ ' + E(t('rm_editT')) : '＋ ' + E(t('rm_add'))}</legend>
    <label class="bk-f"><span>${E(t('rm_fTitle'))}</span><input type="text" id="rmf_title" maxlength="80" dir="auto" value="${E(v.title)}" required placeholder="${E(t('rm_fTitlePh'))}"></label>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('rm_fDate'))}</span><input type="date" id="rmf_date" value="${E(v.date)}" required></label>
    <label class="bk-f"><span>${E(t('rm_fTime'))}</span><input type="time" id="rmf_time" value="${E(v.time)}"></label>
    <label class="bk-f"><span>${E(t('rm_fRep'))}</span><select id="rmf_rep">${RM_REP.map(r => `<option value="${r}"${v.rep === r ? ' selected' : ''}>${E(t('rm_r_' + r))}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('rm_fBefore'))}</span><select id="rmf_before">${RM_BEFORE.map(b => `<option value="${b}"${+v.before === b ? ' selected' : ''}>${E(b ? t('rm_b_n', {n: b}) : t('rm_b_0'))}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('rm_fCat'))}</span><select id="rmf_cat">${RM_CATS.map(([k, ic]) => `<option value="${k}"${v.cat === k ? ' selected' : ''}>${ic} ${E(t('rm_c_' + k))}</option>`).join('')}</select></label>
    <label class="bk-f"><span>${E(t('rm_fAmt'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" id="rmf_amt" value="${E(v.amt || '')}" placeholder="0"></label></div>
    <label class="bk-f"><span>${E(t('rm_fNote'))}</span><textarea id="rmf_note" rows="2" maxlength="300" dir="auto">${E(v.note || '')}</textarea></label>
    <p class="fine" id="rmf_msg" role="status" aria-live="polite"></p>
    <div class="btnrow"><button type="submit" class="gold-btn">✓ ${E(t('rm_save'))}</button><button type="button" class="btn" id="rmf_cancel">${E(t('rm_cancel'))}</button>${it ? `<button type="button" class="btn danger" data-rmdel="${E(it.id)}">🗑️ ${E(t('rm_delB'))}</button>` : ''}</div></fieldset></form>`;
  box.dataset.sug = (pre && pre.sug) || (it && it.sug) || '';
  setTimeout(() => { const f = $('#rmf_title'); if (f){ f.focus(); box.scrollIntoView({block: 'nearest', behavior: 'smooth'}); } }, 30);
}
function rmSave(){
  const d = rmD(), title = $('#rmf_title').value.trim(), date = $('#rmf_date').value, msg = $('#rmf_msg');
  if (!title){ msg.textContent = t('rm_needTitle'); $('#rmf_title').focus(); return; }
  if (!rmParse(date)){ msg.textContent = t('rm_needDate'); $('#rmf_date').focus(); return; }
  const amt = parseFloat(String($('#rmf_amt').value || '').replace(/[,\s₪]/g, ''));
  const rec = {title: title.slice(0, 80), date, time: $('#rmf_time').value || '', rep: $('#rmf_rep').value, before: +$('#rmf_before').value || 0, cat: $('#rmf_cat').value, note: $('#rmf_note').value.trim().slice(0, 300), amt: amt > 0 ? Math.round(amt * 100) / 100 : ''};
  const old = RMV.ed && RMV.ed !== 'new' ? d.items.find(x => x.id === RMV.ed) : null;
  if (old){ Object.assign(old, rec); if (rmDays(date) >= 0) old.done = false; }
  else { const sg = ($('#rm_ed') || {dataset: {}}).dataset.sug; d.items.push(Object.assign({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), done: false, at: Date.now()}, rec, sg ? {sug: sg} : {})); if (d.items.length > 500) d.items.splice(0, d.items.length - 500); }
  RMV.ed = null; RMV.pre = null; saveSet(); rmRender(); rmHome(); toast(t(old ? 'rm_saved' : 'rm_added'));
}
/* ---- the phone's calendar ---- */
function rmIcsEv(it){
  const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/[;,]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  const d = String(it.date).replace(/-/g, ''), now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const start = it.time ? 'DTSTART:' + d + 'T' + it.time.replace(':', '') + '00' : 'DTSTART;VALUE=DATE:' + d;
  const rr = {week: 'FREQ=WEEKLY', month: 'FREQ=MONTHLY', year: 'FREQ=YEARLY'}[it.rep];
  return ['BEGIN:VEVENT', 'UID:' + it.id + '@fincalc-rm', 'DTSTAMP:' + now, start, 'SUMMARY:' + esc(it.title)].concat(it.note ? ['DESCRIPTION:' + esc(it.note)] : [], rr ? ['RRULE:' + rr] : [],
    ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(it.title), 'TRIGGER:-P' + (+it.before || 0) + 'D' + (it.time || +it.before ? '' : 'T0H'), 'END:VALARM', 'END:VEVENT']);
}
function rmIcs(items, name){
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//fincalc//reminders//EN', 'CALSCALE:GREGORIAN'].concat(...items.map(rmIcsEv), ['END:VCALENDAR']).join('\r\n');
  fileSave(new Blob([ics], {type: 'text/calendar'}), String(name).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.ics', 'text/calendar')
    .then(r => toast(t(r === 'saved' ? 'd5_fCal' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'))).catch(() => toast(t('pdf_fail')));
}
/* ---- on Home, and once a day when the app opens ---- */
function rmHome(){
  const hh = $('#hh'); if (!hh) return; let box = $('#hrm');
  const due = rmD().items.filter(rmDue).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!due.length){ if (box) box.remove(); return; }
  if (!box){ hh.insertAdjacentHTML('afterend', '<div id="hrm" class="hrm"></div>'); box = $('#hrm'); }
  const E = rmE;
  box.innerHTML = `<button type="button" class="hrm-in" data-go="reminders"><span class="hrm-h">⏰ ${E(t('rm_homeH', {n: due.length}))}</span>${due.slice(0, 3).map(it => `<span class="hrm-r${rmDays(it.date) < 0 ? ' late' : ''}">${rmCat(it.cat)[1]} <b dir="auto">${E(it.title)}</b> · ${E(rmWhen(it))}</span>`).join('')}${due.length > 3 ? `<span class="hrm-m">${E(t('rm_more', {n: due.length - 3}))}</span>` : ''}</button>`;
}
function rmWake(){
  const d = rmD(), today = rmIso(new Date()), due = d.items.filter(rmDue); if (!due.length || d.shown === today) return;
  d.shown = today; saveSet();
  setTimeout(() => toast(t('rm_toast', {n: due.length, t: due[0].title})), 1800);
  try { if (!IN_CLAUDE && 'Notification' in window && Notification.permission === 'granted') new Notification(t('tab_reminders'), {body: due.slice(0, 3).map(x => x.title + ' – ' + rmWhen(x)).join('\n'), icon: 'icon-192.png', tag: 'rm-' + today}); } catch (e) {}
}
/* open the editor from elsewhere (the scanner's dates) */
function rmNew(pre){ RMV.ed = 'new'; RMV.pre = pre || null; activate('reminders'); }

/* what the assistant sees on this screen */
function rmAiText(){
  const L = rmD().items.filter(x => !x.done).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 25);
  return 'Reminders of the person (title, date, repeat):\n' + (L.map(x => `- ${x.title}: ${x.date}${x.rep !== 'none' ? ' (every ' + x.rep + ')' : ''}${+x.amt ? ', ' + x.amt + ' ILS' : ''}`).join('\n') || '(none)') + '\nToday is ' + rmIso(new Date()) + '. Help plan and prioritise in plain words.';
}
{ const aiStRm = aiScreenText; aiScreenText = function(id){ const s = aiStRm.apply(this, arguments); return id === 'reminders' ? s + '\n' + rmAiText() : s; }; }
{ const aiChRm = aiChipKeys; aiChipKeys = function(id){ return id === 'reminders' ? ['rm_c1', 'rm_c2'] : aiChRm.apply(this, arguments); }; }

/* events */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#rm_root')) return; const d = rmD(); let b;
  if (t0.closest('#rm_add')){ RMV.ed = 'new'; RMV.pre = null; rmEditor(null); return; }
  if (t0.closest('#rmf_cancel')){ RMV.ed = null; RMV.pre = null; $('#rm_ed').innerHTML = ''; const a = $('#rm_add'); if (a) a.focus(); return; }
  if ((b = t0.closest('[data-rmsug]'))){ const s = RM_SUG.find(x => x[0] === b.dataset.rmsug); if (!s) return; RMV.ed = 'new'; RMV.pre = {title: t('rm_s_' + s[0]), cat: s[1], rep: s[2], before: s[3], note: t('rm_sn_' + s[0]), sug: s[0]}; rmEditor(null, RMV.pre); return; }
  if ((b = t0.closest('[data-rmedit]'))){ RMV.ed = b.dataset.rmedit; RMV.pre = null; rmEditor(d.items.find(x => x.id === RMV.ed)); return; }
  if ((b = t0.closest('[data-rmdone]'))){ const it = d.items.find(x => x.id === b.dataset.rmdone); if (!it) return;
    if (it.done) it.done = false; else if (it.rep !== 'none'){ let n = rmNext(it.date, it.rep), g = 0; while (rmDays(n) < 0 && g++ < 600) n = rmNext(n, it.rep); it.date = n; toast(t('rm_movedTo', {d: rmFmt(n)})); } else it.done = true;
    saveSet(); rmRender(); rmHome(); const n2 = $(`[data-rmdone="${it.id}"]`); if (n2) n2.focus(); return; }
  if ((b = t0.closest('[data-rmdup]'))){ const it = d.items.find(x => x.id === b.dataset.rmdup); if (!it) return; const cp = Object.assign({}, it, {id: Date.now().toString(36) + 'c', title: it.title + ' ' + t('rm_copy'), done: false}); delete cp.sug; d.items.push(cp); saveSet(); RMV.ed = cp.id; rmRender(); return; }
  if ((b = t0.closest('[data-rmdel]'))){ const it = d.items.find(x => x.id === b.dataset.rmdel); if (!it || !confirm(t('rm_delQ', {t: it.title}))) return; d.items = d.items.filter(x => x !== it); if (RMV.ed === it.id) RMV.ed = null; saveSet(); rmRender(); rmHome(); toast(t('rm_deleted')); return; }
  if ((b = t0.closest('[data-rmics]'))){ const it = d.items.find(x => x.id === b.dataset.rmics); if (it) rmIcs([it], it.title + ' ' + it.date); return; }
  if (t0.closest('#rm_icsAll')){ const L = d.items.filter(x => !x.done); if (L.length) rmIcs(L, t('tab_reminders')); return; }
  if (t0.closest('#rm_notif')){ try { Notification.requestPermission().then(() => rmRender()); } catch (er) {} return; }
  if ((b = t0.closest('[data-rmf]'))){ RMV.f = b.dataset.rmf; rmRender(); const n = $(`[data-rmf="${RMV.f}"]`); if (n) n.focus(); }
});
document.addEventListener('submit', e => { if (e.target && e.target.id === 'rm_form'){ e.preventDefault(); rmSave(); } });
let RM_T = null;
document.addEventListener('input', e => { if (e.target && e.target.id === 'rm_q'){ RMV.q = e.target.value; clearTimeout(RM_T); RM_T = setTimeout(() => { const box = $('#rm_root .rm-list'); if (box) box.innerHTML = rmList().map(rmCard).join('') || `<li class="fine bk-empty">${rmE(t('rm_noneF'))}</li>`; }, 150); } });
CALC.reminders = () => null;
try { GS_SYN.reminders = 'תזכורת תזכורות תאריך יומן חידוש רישיון רכב ביטוח החזר מס ארנונה דרכון תוקף מנוי אחריות פיקדון reminder reminders date calendar renewal licence insurance tax refund passport expiry subscription warranty تذكير تذكيرات تاريخ تقويم تجديد رخصة تأمين جواز'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindRm = svKind; svKind = function(id){ return id === 'reminders' ? '' : svKindRm.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('reminders'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('reminders'); } catch (e) {}
{
  const actRm = activate; activate = function(id){ const r = actRm.apply(this, arguments); if (id === 'reminders') rmRender(); else if (id === 'home') rmHome(); return r; };
  const alRm = applyLang; applyLang = function(){ const r = alRm.apply(this, arguments); try { if (tab === 'reminders') rmRender(); rmHome(); } catch (e) {} return r; };
  const chRm = calcHome; calcHome = function(){ const r = chRm.apply(this, arguments); try { rmHome(); } catch (e) {} return r; };
  try { if (tab === 'reminders') rmRender(); rmHome(); rmWake(); } catch (e) {}
}
