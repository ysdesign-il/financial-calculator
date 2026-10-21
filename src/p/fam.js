/* 13.23: one menu entry per topic; the related calculators sit in a sub-tab row at the top of the screen */
const famIsLead = id => famLead(id) === id;
const famName = id => { const l = famLead(id); return T['fam_' + l] ? t('fam_' + l) : t('tab_' + l); };
const famE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* the menu, home tiles and settings list show only the first calculator of each topic */
{ const fVG = viewGroups; viewGroups = function(){ return fVG.apply(this, arguments).map(([g, ids]) => [g, ids.filter(famIsLead)]).filter(x => x[1].length); }; }
function famRelabel(root){
  if (!root) return;
  root.querySelectorAll('[data-tab],[data-go]').forEach(b => {
    const id = b.dataset.tab || b.dataset.go; if (!famIsLead(id) || (FAM_OF[id] || []).length < 2 || !T['fam_' + id]) return;
    const s = b.querySelector('span'); if (!s) return;
    if (s.dataset.i) s.dataset.i = 'fam_' + id;
    s.textContent = t('fam_' + id);
  });
}
{ const fRN = renderNav; renderNav = function(){ const r = fRN.apply(this, arguments); famRelabel(navEl); return r; }; }
{ const fRT = renderTiles; renderTiles = function(){ const r = fRT.apply(this, arguments); famRelabel(document.getElementById('tiles')); return r; }; }
{ const fRB = renderBottom; renderBottom = function(){ const r = fRB.apply(this, arguments); famRelabel(document.getElementById('bottom')); const el = document.getElementById('bottom'); if (el) el.querySelectorAll('.bt').forEach(b => b.classList.toggle('on', famLead(tab) === b.dataset.tab)); return r; }; }
/* the topic stays lit in the menu while any of its calculators is open */
{ const fMN = markNav; markNav = function(){
  const r = fMN.apply(this, arguments), L = famLead(tab);
  if (L !== tab){ const b = document.getElementById('tab-' + L); if (b){ b.setAttribute('aria-selected', 'true'); b.tabIndex = 0; const g = b.closest('.grp'); if (g && g.classList.contains('acc')){ g.classList.add('open'); const h = g.querySelector('.grp-h'); if (h) h.setAttribute('aria-expanded', 'true'); } } }
  return r;
}; }
/* settings: show and order topics, not every calculator */
renderTabsList = function(){
  const box = $('#set_tabs'); if (!box) return;
  normOrder();
  box.innerHTML = GROUPS.map(([gk, ids]) => {
    const sorted = ids.filter(famIsLead).sort((a, b) => SET.order.indexOf(a) - SET.order.indexOf(b));
    return `<div class="tl-g">${t(gk)}</div>` + sorted.map(id => {
      const fixed = NOHIDE.includes(id), n = (FAM_OF[id] || []).length;
      return `<div class="trow" data-id="${id}"><span class="tn">${ICON[id] || ''}${famE(famName(id))}${n > 1 ? ` <small class="fam-n">(${n})</small>` : ''}</span>
        <label><input type="checkbox" data-act="vis"${isVisible(id) ? ' checked' : ''}${fixed ? ' disabled' : ''}> ${t('l_visible')}</label>
        <label><input type="checkbox" data-act="pin"${(SET.pins || []).includes(id) ? ' checked' : ''}${fixed ? ' disabled' : ''}> ${t('l_pin')}</label>
        <button type="button" class="mv" data-act="up" aria-label="${t('l_up')}">↑</button><button type="button" class="mv" data-act="down" aria-label="${t('l_down')}">↓</button></div>`;
    }).join('');
  }).join('');
};
moveTab = function(id, dir){
  const g = GROUPS.find(x => x[1].includes(id)); if (!g) return;
  normOrder();
  const sorted = g[1].filter(famIsLead).sort((a, b) => SET.order.indexOf(a) - SET.order.indexOf(b));
  const i = sorted.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return;
  const a = SET.order.indexOf(sorted[i]), b = SET.order.indexOf(sorted[j]);
  [SET.order[a], SET.order[b]] = [SET.order[b], SET.order[a]];
};
/* the sub-tab row; calculators that need an account show a lock, like the home tiles */
const famLocked = id => { try { return typeof mbLocked === 'function' && mbLocked(id); } catch (e) { return false; } };
function famRow(){
  let row = document.getElementById('famrow');
  if (!row){ panelsEl.insertAdjacentHTML('beforebegin', '<div id="famrow" class="fam-row" role="navigation" hidden></div>'); row = document.getElementById('famrow'); }
  const F = (FAM_OF[tab] || [tab]).filter(id => id === tab || isVisible(id));
  if (F.length < 2){ row.hidden = true; row.innerHTML = ''; return; }
  row.setAttribute('aria-label', famName(tab));
  row.innerHTML = `<span class="fam-t">${ICON[F[0]] || ''}<b>${famE(famName(tab))}</b></span><div class="fam-chips">` + F.map(id =>
    `<button type="button" class="fam-c${id === tab ? ' on' : ''}${famLocked(id) ? ' locked' : ''}" data-famgo="${id}"${id === tab ? ' aria-current="page"' : ''}>${famLocked(id) ? '🔒 ' : ''}${famE(t('tab_' + id))}</button>`).join('') + '</div>';
  row.hidden = false;
  const on = row.querySelector('.fam-c.on'), box = row.querySelector('.fam-chips');   // keep the open one in view, without scrolling the page (13.32)
  if (on && box) requestAnimationFrame(() => { try { const r = on.offsetLeft + on.offsetWidth / 2 - box.clientWidth / 2; box.scrollLeft = r; } catch (e) {} });
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-famgo]'); if (b && b.dataset.famgo !== tab){ activate(b.dataset.famgo); try { window.scrollTo({top: 0}); } catch (er) {} } });
{ const fAct = activate; activate = function(){ const r = fAct.apply(this, arguments); try { famRow(); markNav(); renderBottom(); } catch (e) {} return r; }; }
{ const fAL = applyLang; applyLang = function(){ const r = fAL.apply(this, arguments); try { famRow(); famRelabel(navEl); famRelabel(document.getElementById('tiles')); famRelabel(document.getElementById('bottom')); renderTabsList(); } catch (e) {} return r; }; }
/* a calculator that was hidden under the old menu stays reachable through its topic */
try { renderNav(); $$('#nav [data-i]').forEach(e => { e.textContent = t(e.dataset.i); }); if (typeof navAcc === 'function') navAcc(); markNav(); renderTiles(); renderBottom(); famRow(); } catch (e) {}
