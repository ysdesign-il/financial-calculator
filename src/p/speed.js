/* 13.25: speed – work that only fills hidden screens waits until that screen opens */
let PF_FORCE = false;
const PF_DIRTY = new Set();
const pfHidden = id => { const p = document.getElementById('panel-' + id); return !!p && p.hidden; };
function pfLazy(name, panel, fn, keep){
  return function(){
    if (!PF_FORCE && pfHidden(panel)){ PF_DIRTY.add(name); if (keep) try { keep(); } catch (e) {} return; }
    return fn.apply(this, arguments);
  };
}
/* settings: the form, the country list, the sections and the skins are drawn when Settings opens; the home tiles and the bottom bar still update right away */
syncSettingsUI = pfLazy('sync', 'settings', syncSettingsUI, () => { renderTiles(); renderBottom(); if (typeof renderStamp === 'function') renderStamp(); });
ctyUi = pfLazy('cty', 'settings', ctyUi);
accBuild = pfLazy('acc', 'settings', accBuild);
skRender = pfLazy('sk', 'settings', skRender);
function pfFlush(id){
  if (id !== 'settings' || !PF_DIRTY.size) return;
  const run = [...PF_DIRTY]; PF_DIRTY.clear(); PF_FORCE = true;
  try {
    if (run.includes('sync')) syncSettingsUI();
    if (run.includes('cty')) ctyUi();
    if (run.includes('sk')) skRender();
    if (run.includes('acc')) accBuild();
  } catch (e) {} finally { PF_FORCE = false; }
}
{ const actPf = activate; activate = function(id){ const r = actPf.apply(this, arguments); try { pfFlush(id); if (typeof svUi === 'function') svUi(); } catch (e) {} return r; }; }
