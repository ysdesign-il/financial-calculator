/* 13.47: what the owner sets in the admin panel reaches the app as window.__ADMCFG (event 'admp-cfg'):
   1) calculators switched off one by one (cfg.offTabs, cfg.offMsg): hidden from every menu, and a link to one goes to the home
      screen with the owner's note. The admin version keeps everything open.
   2) the owner's published values (cfg.fig = {v, asOf}): the same official values as figures.json; the newest wins.
   In the admin version the app lists its screens for the panel (window.__ADM_SCREENS__), and the values editor can publish to everyone. */
const admIn = () => window.__FIN_ADMSES__ === 1;
var KS_OFF = [], KS_MSG = '', ADM_FIG = null;
function ksApply(c){
  KS_OFF = admIn() ? [] : (Array.isArray(c.offTabs) ? c.offTabs : []).filter(id => typeof id === 'string' && TABS.includes(id) && id !== 'home' && id !== 'settings');
  KS_MSG = String(c.offMsg || '').slice(0, 200);
  let st = document.getElementById('ks-st'); if (!st){ st = document.createElement('style'); st.id = 'ks-st'; document.head.appendChild(st); }
  st.textContent = KS_OFF.length ? KS_OFF.map(id => `button[data-go="${id}"],button[data-tab="${id}"],a[data-go="${id}"]`).join(',') + '{display:none!important}' : '';
  if (KS_OFF.includes(tab)) activate('home');
}
const activateKs = activate;
activate = function(id){
  if (KS_OFF.includes(id)){ try { toast(KS_MSG || t('ks_off')); } catch (e) {} return activateKs.call(this, 'home'); }
  return activateKs.apply(this, arguments);
};
/* the owner's values: newer than figures.json → used instead of it */
const figOfficialSetAdm = figOfficialSet;
figOfficialSet = function(d, src){
  if (ADM_FIG && +ADM_FIG.asOf > (+(d && d.asOf) || 0)) return figOfficialSetAdm.call(this, ADM_FIG, 'site');
  return figOfficialSetAdm.apply(this, arguments);
};
function figAdmApply(c){
  const f = c && c.fig;
  if (!f || typeof f !== 'object' || !f.v || typeof f.v !== 'object' || !(+f.asOf > 0)){ if (ADM_FIG){ ADM_FIG = null; figOfficialSetAdm({v: {}, asOf: 0}, 'built'); try { figSite(); } catch (e) {} } return; }
  if (ADM_FIG && +ADM_FIG.asOf === +f.asOf) return;
  ADM_FIG = {v: f.v, asOf: +f.asOf}; figOfficialSetAdm(ADM_FIG, 'site');
}
function admCfg(){ const c = window.__ADMCFG; if (!c || typeof c !== 'object') return; try { ksApply(c); } catch (e) {} try { figAdmApply(c); } catch (e) {} }
addEventListener('admp-cfg', admCfg); admCfg();

/* ---- admin version only ---- */
function admScreens(){ if (admIn()) window.__ADM_SCREENS__ = TABS.filter(id => id !== 'home' && id !== 'settings').map(id => { const x = T['tab_' + id] || []; return [id, x[0] || t('tab_' + id), x[2] || ''] }); }
admScreens();
const fgRenderAdm = fgRender;
fgRender = function(){
  const r = fgRenderAdm.apply(this, arguments);
  try {
    const box = $('#fg_box');
    if (box && !IN_CLAUDE && admIn() && liveOwner() && !box.querySelector('.fg-own')){
      box.insertAdjacentHTML('beforeend', `<div class="fg-own"><b>${asEsc(t('fg_ownT'))}</b><p class="fine">${asEsc(t('fg_pubS'))} ${asEsc(t('fg_admHist'))}</p><div class="btnrow"><button type="button" class="gold-btn" id="fg_pub2">${asEsc(t('fg_pub'))}</button>${ADM_FIG ? `<button type="button" class="mv wide" id="fg_unpub2">${asEsc(t('fg_unpub'))}</button>` : ''}</div><p class="fine" id="fg_pubMsg2"></p></div>`);
    }
  } catch (e) {}
  return r;
};
const fgDesc = (f, v) => { try { return t(f.lab, f.p) + ': ' + fgVal(f, v); } catch (e) { return f.id + ': ' + v; } };
document.addEventListener('click', async e => {
  const pb = e.target.closest && e.target.closest('#fg_pub2, #fg_unpub2'); if (!pb) return;
  if (!pb.dataset.sure){ pb.dataset.sure = '1'; pb.textContent = t('fg_pubSure'); return; }
  const msg = $('#fg_pubMsg2'), un = pb.id === 'fg_unpub2';
  if (typeof window.__ADMKIT_SAVE !== 'function'){ if (msg) msg.textContent = t('fg_pubErr'); return; }
  const v = {}, ch = [];
  if (!un) FG_LIST.forEach(f => { if (FG_MARKET.includes(f.id)) return; const cur = fgR(f.get()); if (Math.abs(cur - FG_BUILT[f.id]) > 1e-9) v[f.id] = cur; if (Math.abs(cur - FG_OFF[f.id]) > 1e-9) ch.push(fgDesc(f, FG_OFF[f.id]) + ' → ' + fgVal(f, cur)); });
  const note = un ? 'ערכים: חזרה לערכים המובנים' : 'ערכים: ' + (ch.length ? ch.slice(0, 4).join(' · ') + (ch.length > 4 ? ' ועוד ' + (ch.length - 4) : '') : 'פורסמו מחדש');
  pb.disabled = true;
  try {
    await window.__ADMKIT_SAVE({fig: un ? null : {v, asOf: Date.now()}}, note);
    const ov = Object.assign({}, fgOv()); Object.keys(ov).forEach(k => { if (!FG_MARKET.includes(k)) delete ov[k]; }); SET.figOv = ov; saveSet();
    if (un && ADM_FIG){ ADM_FIG = null; figOfficialSetAdm({v: {}, asOf: 0}, 'built'); try { figSite(); } catch (er) {} }
    figApply(true); toast(t(un ? 'fg_unpubOk' : 'fg_pubOk'));
  } catch (err) { pb.disabled = false; if (msg) msg.textContent = t('fg_pubErr'); }
});
Object.assign(T, {
  ks_off:['המחשבון הזה סגור זמנית. נחזור בקרוב.','هذه الحاسبة مغلقة مؤقتًا. نعود قريبًا.','This calculator is closed for now. Back soon.'],
  fg_admHist:['כל פרסום נשמר בהיסטוריה בלוח הניהול, ואפשר לשחזר ממנה בלחיצה.','كل نشر يُحفظ في السجل في لوحة الإدارة، ويمكن الاستعادة منه بنقرة.','Every publish is kept in the admin panel history and can be restored in one tap.'],
});
