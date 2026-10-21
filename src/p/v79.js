/* ================= 7.9: saved files — every Save (or automatic saving) keeps a file in the Saved folder ================= */
/* manual mode: each tap on Save adds a new file for every calculator changed since the last save.
   automatic mode: each calculator you work on keeps one file that follows your changes.
   deleting a file is immediate and final (it does not go to the recycle bin). */
const FL_KEY = 'fin-files', FL_MAX = 300;
var FL = {dirty: new Set(), t: null, sure: false, sureT: null};
function flAll(){ let a = []; try { a = JSON.parse(LS.getItem(FL_KEY) || '[]'); } catch (e) {} return Array.isArray(a) ? a.filter(x => x && x.id && x.tab) : []; }
function flSet(a){
  try { LS.setItem(FL_KEY, JSON.stringify(a.slice(0, FL_MAX))); } catch (e) {}
  if (tab === 'saved') try { svdRender(); } catch (e) {}
}
function flSnap(id){
  const r = LAST[id]; if (!r || !r.hero) return null;
  return {vals: panelVals(id), hero: {label: strip(r.hero.label), value: strip(r.hero.value)}, rows: (r.rows || []).map(x => [strip(x[0]), strip(x[1])]).slice(0, 16)};
}
function flCalcTab(id){ return TABS.includes(id) && svKind(id) === 'calc' && !['saved', 'home', 'settings', 'assist'].includes(id); }
function flMake(ids, src, name){
  const now = Date.now(); let a = flAll(), n = 0;
  ids.forEach(id => {
    if (!flCalcTab(id)) return;
    try { if (!LAST[id]) calc(id); } catch (e) {}
    const s = flSnap(id); if (!s) return;
    if (src === 'auto'){
      const i = a.findIndex(x => x.src === 'auto' && x.tab === id);
      if (i >= 0){ const f = a[i]; if (JSON.stringify(f.vals) === JSON.stringify(s.vals)) return; Object.assign(f, s, {up: now}); a.splice(i, 1); a.unshift(f); n++; return; }
    }
    a.unshift(Object.assign({id: tId(), tab: id, src, at: now, up: now}, name ? {n: String(name).slice(0, 40)} : {}, s)); n++;
  });
  if (n) flSet(a);
  return n;
}
/* which calculators changed */
function flMark(e){
  const el = e.target; if (!el || !el.closest) return;
  const p = el.closest('section.panel[id^="panel-"]'); if (!p) return;
  const id = p.id.slice(6); if (!flCalcTab(id) || el.classList.contains('scn-name') || el.closest('.svbar')) return;
  FL.dirty.add(id);
  if (SV.mode === 'auto' && SET.remember === '1'){
    clearTimeout(FL.t);
    FL.t = setTimeout(() => { const ids = [...FL.dirty]; FL.dirty.clear(); flMake(ids, 'auto'); }, 1500);
  }
}
document.addEventListener('input', flMark, true);
document.addEventListener('change', flMark, true);
const svSave79 = svSave;
svSave = function(quiet){
  const ids = [...FL.dirty], ok = svSave79.apply(this, arguments);
  if (ok && ids.length){ FL.dirty.clear(); const n = flMake(ids, SV.mode === 'auto' ? 'auto' : 'manual'); if (n && !quiet) setTimeout(() => toast(t('fl_made', {n})), 1700); }
  return ok;
};
/* saving a named calculation (the Save button in a calculator) keeps a file too */
const saveScenario79 = saveScenario;
saveScenario = function(id){
  const n0 = (SCN[id] || []).length, r = saveScenario79.apply(this, arguments), L = SCN[id] || [];
  if (L.length > n0) flMake([id], 'manual', L[L.length - 1].n);
  return r;
};
/* clearing everything clears the files too */
const svClearAll79 = svClearAll;
svClearAll = function(){ const r = svClearAll79.apply(this, arguments); FL.dirty.clear(); flSet([]); return r; };
const svClearScreen79 = svClearScreen;
svClearScreen = function(id){ const r = svClearScreen79.apply(this, arguments); FL.dirty.delete(id); return r; };
/* ---------- the Files view in the Saved folder ---------- */
SVD.view = 'files';
function flRender(box){
  const E = asEsc, all = flAll(), q = SVD.q.trim().toLowerCase();
  const list = all.filter(f => !q || (t('tab_' + f.tab) + ' ' + (f.n || '') + ' ' + ((f.hero && f.hero.value) || '')).toLowerCase().includes(q));
  const top = box.querySelector('.svd-top'); if (top){ const p = top.querySelector('p.fine'); if (p) p.textContent = t('fl_intro'); }
  let h = `<input id="svd_q" type="search" class="cl-q" autocomplete="off" placeholder="${E(t('svd_search'))}" aria-label="${E(t('svd_search'))}" value="${E(SVD.q)}" data-pii-ok>`;
  if (all.length) h += `<div class="btnrow fl-bar"><button type="button" class="btn danger" data-fl="all">🗑️ ${E(t(FL.sure ? 'fl_delAllSure' : 'fl_delAll', {n: all.length}))}</button></div>`;
  if (!list.length) h += `<div class="svd-empty"><b>${E(t(q ? 'svd_noMatch' : 'fl_empty'))}</b><p class="fine">${E(t(SV.mode === 'none' ? 'fl_howNone' : 'fl_how'))}</p></div>`;
  list.forEach(f => {
    const name = t('tab_' + f.tab) + (f.n ? ' — ' + f.n : ''), badge = t(f.src === 'auto' ? 'fl_auto' : 'fl_manual');
    h += `<div class="svd-it fl-it" data-flid="${E(f.id)}">
      <div class="svd-h"><span class="fl-ic" aria-hidden="true">📄</span><b class="svd-n">${E(name)}</b><span class="fl-b fl-${f.src === 'auto' ? 'a' : 'm'}">${E(badge)}</span><span class="svd-v num">${E((f.hero && f.hero.value) || '')}</span></div>
      <small class="svd-meta">${E((f.hero && f.hero.label) || '')} · ${E(t(f.src === 'auto' && f.up !== f.at ? 'svd_editedAt' : 'svd_savedAt', {d: svdDate(f.up || f.at)}))}</small>
      <div class="svd-acts"><button type="button" class="mv" data-fla="open">${E(t('svd_open'))}</button><button type="button" class="mv" data-fla="dl">⬇️ ${E(t('fl_dl'))}</button><button type="button" class="mv" data-fla="share">${E(t('b_share'))}</button><button type="button" class="mv danger" data-fla="del">🗑️ ${E(t('fl_del'))}</button></div></div>`;
  });
  [...box.children].forEach(c => { if (!c.classList.contains('svd-top')) c.remove(); });
  box.insertAdjacentHTML('beforeend', h);
}
const svdRender79 = svdRender;
svdRender = function(){
  const box = $('#svd_root'), v = SVD.view;
  if (v === 'files') SVD.view = 'all';
  const r = svdRender79.apply(this, arguments);
  SVD.view = v;
  if (!box) return r;
  const tabs = box.querySelector('.svd-tabs');
  if (tabs && !tabs.querySelector('[data-svdv="files"]')){
    tabs.insertAdjacentHTML('afterbegin', `<button type="button" data-svdv="files" aria-pressed="${v === 'files'}">📄 ${asEsc(t('fl_tab'))} · ${flAll().length}</button>`);
    if (v === 'files') tabs.querySelectorAll('[data-svdv]:not([data-svdv="files"])').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }
  if (v === 'files') flRender(box);
  return r;
};
function flFile(el){ const row = el.closest('[data-flid]'); const id = row && row.dataset.flid; return flAll().find(f => f.id === id); }
document.addEventListener('click', e => {
  const el = e.target; if (!el.closest) return;
  const b = el.closest('[data-fl="all"]');
  if (b){
    if (!FL.sure){ FL.sure = true; clearTimeout(FL.sureT); FL.sureT = setTimeout(() => { FL.sure = false; if (tab === 'saved') svdRender(); }, 5000); svdRender(); return; }
    FL.sure = false; clearTimeout(FL.sureT); flSet([]); toast(t('fl_allGone')); return;
  }
  const a = el.closest('[data-fla]'); if (!a) return;
  const f = flFile(a); if (!f) return;
  const k = a.dataset.fla, s = {n: f.n || svdDate(f.up || f.at), hero: f.hero, rows: f.rows};
  if (k === 'del'){ flSet(flAll().filter(x => x.id !== f.id)); toast(t('fl_gone')); return; }
  if (k === 'open'){ setVals(f.vals || {}); try { touch(f.tab); } catch (er) {} activate(f.tab); calc(f.tab); toast(t('svd_opened', {n: t('tab_' + f.tab)})); return; }
  if (k === 'share'){ shrOpen(null, svdScnText(f.tab, s), t('tab_' + f.tab)); return; }
  if (k === 'dl'){
    const d = new Date(f.up || f.at), pad = x => String(x).padStart(2, '0');
    const nm = (t('tab_' + f.tab) + ' ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + pad(d.getMinutes())).replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.txt';
    deliver(svdScnText(f.tab, s), nm, 'text/plain;charset=utf-8'); return;
  }
});
