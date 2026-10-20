/* 13.22: smarter results – what moves the result, explain a row, the whole picture for the assistant, quick shortcuts */
const cxE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let CX_BUSY = false;
/* 1. "what moves the result most" under every calculator */
function cxSensHTML(id){
  let S = [];
  CX_BUSY = true; try { S = aiSens(id); } catch (e) { S = []; } finally { CX_BUSY = false; }
  if (!S.length) return `<p class="fine">${cxE(t('cx_sensNone'))}</p>`;
  const max = Math.max.apply(null, S.map(s => Math.abs(s.d))) || 1;
  return `<p class="fine">${cxE(t('cx_sensHow'))}</p><ul class="cx-sens">` + S.map(s => {
    const w = Math.max(4, Math.round(Math.abs(s.d) / max * 100)), up = s.d > 0;
    return `<li><span class="cx-l">${cxE(exClean(s.label))}</span><span class="cx-bar"><i class="${up ? 'up' : 'dn'}" style="width:${w}%"></i></span><bdi dir="ltr" class="num cx-v">${up ? '+' : '−'}${cxE(N(Math.abs(s.d), null, Math.abs(s.d) < 10 ? 2 : 0))}${isFinite(s.pct) ? ` (${up ? '+' : '−'}${cxE(N(Math.abs(s.pct), null, 1))}%)` : ''}</bdi></li>`;
  }).join('') + '</ul>';
}
function cxSensFill(id){ const b = document.getElementById('cxs-' + id); if (b && b.closest('details').open) b.innerHTML = cxSensHTML(id); }
let cxSensT = 0;
function cxEnsure(id){
  const led = document.getElementById('led-' + id); if (!led || document.getElementById('cxd-' + id)) return;
  led.insertAdjacentHTML('afterend', `<details class="cx-d" id="cxd-${id}"><summary>🎯 <span data-cxt="cx_sens">${cxE(t('cx_sens'))}</span></summary><div id="cxs-${id}"></div></details>`);
  document.getElementById('cxd-' + id).addEventListener('toggle', () => cxSensFill(id));
  if (!EX_SKIP.includes(id)) cxLedObserve(led);
  const p = document.getElementById('panel-' + id);
  if (p) p.addEventListener('input', () => { clearTimeout(cxSensT); cxSensT = setTimeout(() => cxSensFill(id), 700); });
}
/* 2. result rows are explained on tap (existing); add keyboard access */
function cxLedMark(led){ led.querySelectorAll('dt').forEach(dt => { if (!dt.hasAttribute('tabindex')){ dt.tabIndex = 0; dt.setAttribute('role', 'button'); } }); }
function cxLedObserve(led){ cxLedMark(led); try { new MutationObserver(() => cxLedMark(led)).observe(led, {childList: true}); } catch (e) {} }
document.addEventListener('keydown', e => {  /* the existing row explanation, now reachable by keyboard too */
  const dt = e.target.closest && e.target.closest('.ledger dt');
  if (dt && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); dt.click(); }
});
{ const cxAct = activate; activate = function(id){ const r = cxAct.apply(this, arguments); try { cxEnsure(id); } catch (e) {} return r; }; }
try { cxEnsure(tab); } catch (e) {}
/* 3. opt-in: share the whole picture with the assistant */
function cxAll(){
  const L = [];
  try { const P = picData(); if (P.rows.length) L.push('Overview: ' + P.rows.map(r => r[2] + ' ' + exClean(r[3])).join('; ')); } catch (e) {}
  try { const s = aiExpSummary(); if (s) L.push(s); } catch (e) {}
  try { const R = rmD().items.filter(x => !x.done).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 6); if (R.length) L.push('Upcoming reminders: ' + R.map(x => x.title + ' (' + x.date + (x.amt ? ', ' + MI(+x.amt) : '') + ')').join('; ')); } catch (e) {}
  try { const d = pfD(), s = d.sav.reduce((a, x) => a + pfN(x.bal), 0), h = d.hold.reduce((a, x) => a + pfN(x.val), 0); if (s || h) L.push('Savings and investments: long-term savings ' + MI(s) + ', holdings ' + MI(h)); } catch (e) {}
  try { const M2 = aiMine(); if (M2.length) L.push('Calculators filled in: ' + M2.join('; ')); } catch (e) {}
  return L.length ? '\n\nThe person chose to share their whole picture from the app:\n' + L.map(x => '- ' + x).join('\n') : '';
}
{ const cxST = aiScreenText; aiScreenText = function(id){ let s = cxST.apply(this, arguments); try { if (SET.aiAll === '1' && (id === 'home' || id === 'assist' || id === 'expenses')) s += cxAll(); } catch (e) {} return s; }; }
{ const cxOF = aiOpenFor; aiOpenFor = function(){
  const r = cxOF.apply(this, arguments);
  try {
    if (!document.getElementById('aix_all')){
      const row = document.querySelector('#aix .ai-engrow');
      if (row){ row.insertAdjacentHTML('afterend', `<label class="cx-all"><input type="checkbox" id="aix_all"> <span id="aix_allL"></span></label>`);
        document.getElementById('aix_all').addEventListener('change', e => { SET.aiAll = e.target.checked ? '1' : ''; saveSet(); toast(t(e.target.checked ? 'cx_allOn' : 'cx_allOff')); }); }
    }
    const c = document.getElementById('aix_all'); if (c){ c.checked = SET.aiAll === '1'; document.getElementById('aix_allL').textContent = t('cx_all'); }
  } catch (e) {}
  return r;
}; }
/* 4. home-screen shortcuts: ?go=screen[&add=1] */
function cxGo(){
  let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  const go = q.get('go'); if (!go) return;
  try { q.delete('go'); q.delete('add'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
  if (!TABS.includes(go)) return;
  const add = CX_ADD;
  activate(go);
  if (!add) return;
  setTimeout(() => {
    try {
      if (go === 'expenses') expSheet();
      else if (go === 'reminders') rmNew();
      else { const b = document.querySelector('#panel-' + go + ' [id$="_add"]'); if (b) b.click(); }
    } catch (e) {}
  }, 120);
}
const CX_ADD = /[?&]add=1/.test(location.search);
setTimeout(cxGo, 0);
