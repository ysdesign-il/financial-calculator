$('#back').addEventListener('click', () => activate('home'));
$('#resetTab').addEventListener('click', () => { resetPanel(tab); TOUCHED = TOUCHED.filter(x => x !== tab); calc(tab); saveVals(); });
function setBase(c){
  baseCur = c; try { localStorage.setItem('fin-cur', c); } catch(e) {}
  const a = $('#cur'); if (a) a.value = c;
  const b = $('#set_cur'); if (b) b.value = c;
  applyEffCur(tab);
}
$('#cur').addEventListener('change', () => { baseCur = $('#cur').value; const b = $('#set_cur'); if (b) b.value = baseCur; applyEffCur(tab); calc(tab); });
function rebuildNav(){ renderNav(); markNav(); renderBottom(); renderTiles(); $$('[data-i]', navEl).forEach(el => { el.textContent = t(el.dataset.i); }); }
function jsonOut(){ const o = JSON.parse(JSON.stringify(SET)); o.lang = lang; o.cur = baseCur; delete o.gkey; delete o.okey; return JSON.stringify(o, null, 1); }
panelsEl.addEventListener('change', e => {
  const id = e.target.id, val = e.target.value;
  if (!id) return;
  if (id.indexOf('set_') !== 0){ return; }
  if (SMAP[id]){
    SET[SMAP[id]] = val;
    const k = SMAP[id];
    if (k === 'accent'){ const eff = (typeof HOL_ACTIVE !== 'undefined' && HOL_ACTIVE) || SET.theme; SET.accentFor = SKINS[eff] ? eff : ''; }
    if (k === 'theme') SET.accentFor = '';
    if (['theme','accent','contrast','motion','font','sliders','holAuto','design','hfx'].includes(k)){ applyTheme(); if (typeof skRender === 'function') skRender(); }
    if (k === 'size') applySize();
    if (DEFKEYS.includes(k)) applyDefaults();
    if (k === 'remember'){ if (val === '1') saveVals(); else { try { localStorage.removeItem('fin-vals'); } catch(err) {} } }
    if (k === 'rateSrc' || k === 'gkey') tryLive(true);
    if (k === 'sort') rebuildNav();
    if (['liveFx','fxInt','liveFiat','liveCrypto'].includes(k)){ saveSet(); fxStart(); fxSync(); }
    if (k === 'boiDb'){ saveSet(); dbSub(); }
    if (k === 'autoRef'){ saveSet(); schedRef(); }
  } else if (id.indexOf('set_p_') === 0){ SET.prof[id.slice(6)] = val; applyDefaults(); }
  else if (id === 'set_lang'){ lang = val; try { localStorage.setItem('fin-lang', lang); } catch(err) {} saveSet(); applyLang(true); return; }
  else if (id === 'set_cur'){ setBase(val); }
  else if (id.indexOf('set_cb_') === 0){ const tb = id.slice(7); if (val) SET.curBy[tb] = val; else delete SET.curBy[tb]; applyEffCur(tab); }
  else if (id === 'set_favCur'){ SET.favCur = [...e.target.selectedOptions].map(o => o.value); fillCurSelects(); fillCB(); }
  saveSet(); calc(tab);
});
panelsEl.addEventListener('change', e => {
  const act = e.target.dataset && e.target.dataset.act, row = e.target.closest && e.target.closest('.trow');
  if (!act || !row) return;
  const id = row.dataset.id;
  if (act === 'vis'){ SET.hidden = SET.hidden.filter(x => x !== id); if (!e.target.checked) SET.hidden.push(id); }
  else if (act === 'pin'){ SET.pins = SET.pins.filter(x => x !== id); if (e.target.checked) SET.pins.push(id); }
  saveSet(); renderTabsList(); rebuildNav();
});
panelsEl.addEventListener('click', e => {
  const T_ = e.target;
  const mv = T_.closest('.trow .mv');
  if (mv){ moveTab(mv.closest('.trow').dataset.id, mv.dataset.act === 'up' ? -1 : 1); saveSet(); renderTabsList(); rebuildNav(); return; }
  const ac = T_.closest('[data-ac]');
  if (ac){ doAction(ac.dataset.ac, ac.closest('.panel').id.slice(6)); return; }
  const sv = T_.closest('.scn-save');
  if (sv){ saveScenario(sv.closest('.scn').dataset.tab); return; }
  const sc = T_.closest('[data-sc]');
  if (sc){
    const id = sc.closest('.scn').dataset.tab, i = +sc.closest('.scn-row').dataset.i;
    if (sc.dataset.sc === 'load'){ setVals(SCN[id][i].vals); touch(id); calc(id); saveVals(); }
    else { SCN[id].splice(i, 1); saveScn(); renderScn(id); }
    return;
  }
  const msg = $('#set_msg');
  if (T_.closest('#set_export')){ const j = jsonOut(); $('#set_json').value = j; copyText(j); msg.textContent = t('st_exported'); }
  else if (T_.closest('#set_import')){
    try {
      const o = JSON.parse($('#set_json').value);
      if (o.lang && LANG_LIST.some(l => l[0] === o.lang)){ lang = o.lang; try { localStorage.setItem('fin-lang', lang); } catch(err) {} }
      SET = Object.assign(cloneDef(), o); SET.prof = Object.assign({}, SET_DEF.prof, o.prof || {});
      delete SET.lang; delete SET.cur; saveSet();
      if (o.cur && RATES[o.cur]) setBase(o.cur);
      applyTheme(); applySize(); applyDefaults(); applyLang(true); rebuildNav(); msg.textContent = t('st_imported');
    } catch(err) { msg.textContent = t('st_importFail'); }
  }
  else if (T_.closest('#set_resetcalcs')){ TABS.forEach(resetPanel); TOUCHED = []; calc(tab); msg.textContent = t('st_resetCalcs'); }
  else if (T_.closest('#set_reset')){
    SET = cloneDef(); saveSet(); lang = 'he'; try { localStorage.setItem('fin-lang', lang); } catch(err) {}
    setBase('ILS'); applyTheme(); applySize(); applyDefaults(); applyLang(true); rebuildNav(); msg.textContent = t('st_resetDone');
  }
  else if (T_.closest('#set_clear')){
    ['fin-set','fin-vals','fin-scn','fin-lang','fin-cur','fin-tab'].forEach(k => { try { localStorage.removeItem(k); } catch(err) {} });
    SET = cloneDef(); SCN = {}; lang = 'he'; setBase('ILS'); applyTheme(); applySize(); TABS.forEach(resetPanel); TOUCHED = [];
    applyLang(true); rebuildNav(); msg.textContent = t('st_cleared');
  }
});
let svT;
panelsEl.addEventListener('input', () => { clearTimeout(svT); svT = setTimeout(saveVals, 400); });
applyDefaults(); restoreVals(); syncRanges();
