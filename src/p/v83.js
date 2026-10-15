/* ================= 8.3: a smoother interface — less work on every refresh =================
   live data refreshes every 15 seconds; until now each refresh rebuilt every currency list (about 170 options each, which also
   closed a list you had open on the phone), every Settings currency list and the whole theme gallery. Now each is rebuilt only
   when what it shows has changed, and the Settings lists wait until Settings is opened. */
const PF = {cur: '', cb: '', cbWait: false, sk: ''};
const pfCurSig = () => [lang, SET.digits, (SET.favCur || []).join(','), Object.keys(RATES).sort().join(',')].join('|');
const _fcsPf = fillCurSelects;
fillCurSelects = function(){
  const sig = pfCurSig(), els = ['cur', 'x_from', 'x_to'].map(id => document.getElementById(id));
  if (sig === PF.cur && els.every(s => s && s.options.length)){
    [['cur', cur], ['x_from', 'ILS'], ['x_to', 'USD']].forEach(([id, def]) => { const s = document.getElementById(id); if (s && !RATES[s.value]) s.value = def; });
    return;
  }
  PF.cur = sig; return _fcsPf.apply(this, arguments);
};
const _fcbPf = fillCB;
fillCB = function(){
  if (tab !== 'settings'){ PF.cbWait = true; return; }
  const sig = pfCurSig() + '|' + JSON.stringify(SET.curBy || {});
  if (sig === PF.cb && !PF.cbWait) return;
  PF.cb = sig; PF.cbWait = false; return _fcbPf.apply(this, arguments);
};
const _skPf = skRender;
skRender = function(){
  const boxes = $$('.skins'); if (!boxes.length) return;
  const sig = [lang, SET.theme, typeof HOL_ACTIVE !== 'undefined' ? HOL_ACTIVE : '', SET.holAuto, SET.design || '', SET.accent || ''].join('|');
  if (sig === PF.sk && boxes.every(b => b.dataset.pf === sig && b.childElementCount)) return;
  const r = _skPf.apply(this, arguments);
  PF.sk = sig; $$('.skins').forEach(b => { b.dataset.pf = sig; });
  return r;
};
const _actPf = activate;
activate = function(id){
  const r = _actPf.apply(this, arguments);
  if (id === 'settings' && PF.cbWait) try { fillCB(); } catch (e) {}
  return r;
};

/* ---------- limits: years, months and counts can't be so large that a calculation runs for minutes ---------- */
const LIM_IDS = {c_years: 120, d_years: 120, in_years: 120, lv_yrs: 120, mf_yrs: 120, pp_yrs: 120, pr_years: 120, rb_yrs: 120, rb_hz: 120, rf_left: 120, rf_nyrs: 120, sg_years: 120,
  nt_months: 1440, pr_months: 1440, l_grace: 1440, l_preM: 1440, in_from: 2100, in_to: 2100, pr_days: 36600, wd_off: 3660,
  cl_n: 10000, ds_n: 10000, sp_n: 10000, ds_qty: 100000, ds_buy: 10000, ds_free: 10000, pr_dAt: 36600};
function limScan(root){
  (root || document).querySelectorAll('input[id]').forEach(e => {
    if (e.dataset.lim) return;
    const u = e.parentElement && e.parentElement.querySelector(':scope > .u'), ui = u && u.dataset.i;
    const L = LIM_IDS[e.id] || (ui === 'u_yrs' ? 120 : ui === 'u_months' ? 1440 : 0);
    if (L) e.dataset.lim = L;
  });
}
limScan();
/* when you leave the field, a value above the limit is shown as the limit, so what you see is what was calculated */
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.dataset || !el.dataset.lim) return;
  const n = parseFloat(el.value), L = +el.dataset.lim;
  if (isFinite(n) && n > L){ el.value = L; try { toast(t('w_lim', {n: N(L)})); } catch (er) {} el.dispatchEvent(new Event('input', {bubbles: true})); }
}, true);
/* the "?" buttons get their names once the texts are in place, and again after a language change */
const _alPf = applyLang;
applyLang = function(){ const r = _alPf.apply(this, arguments); try { EXL_SIG = ''; exLabels(); } catch (e) {} return r; };
try { EXL_SIG = ''; exLabels(); } catch (e) {}
