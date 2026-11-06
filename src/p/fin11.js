/* ---------- 13.85: data you can trust ----------
   1. "Where the numbers come from" shows, under each value, its status: live (fetched in the last day), old (with the date it was
      last updated), official with its date, or built in for the tax year – so a stale value is never shown as if it were today's.
   2. Every record in your lists (policies, holdings, savings, journal, tax years, goals, saved plans, offers) gets a lasting id and
      the time it was last changed. Importing a settings backup now merges the lists by id – the newer copy of each record wins –
      instead of overwriting what is already on this device.
   3. The assistant and "Explain" also read the tables of the new screens (the financial picture, the report, tax by years). */

/* ---- 1. data status ---- */
(function(){
  const M0 = MINI.sources; if (!M0 || typeof M0.render !== 'function') return;
  const r0 = M0.render;
  M0.render = function(box, api){
    const out = r0.apply(this, arguments);
    try {
      const E = api.E, K = typeof MKT === 'object' ? MKT : {}, now = Date.now() / 1000;
      const fxAge = typeof META === 'object' && META.unix ? now - META.unix : Infinity, fxD = typeof META === 'object' && META.unix ? new Date(META.unix * 1000).toLocaleDateString() : '';
      const fixed = ['dst_fixed', {y: F10_TAXYEAR}], off = d => d ? ['dst_off', {d}] : ['dst_fixedNo', {}];
      const fx = fxAge < 86400 ? ['dst_live', {d: fxD}] : ['dst_old', {d: fxD}];
      const S = [fixed, fixed, fixed, fixed, fixed, fixed, fixed, off(K.boiDate), off(K.cpiMonth), off(K.fuelMonth), fx, fx];
      box.querySelectorAll('.so-tab tbody tr').forEach((tr, i) => { const s = S[i], td = tr.querySelector('td'); if (!s || !td || td.querySelector('.so-st')) return;
        const cls = s[0] === 'dst_live' ? 'live' : s[0] === 'dst_old' ? 'old' : 'fixed';
        td.insertAdjacentHTML('beforeend', `<small class="so-st ${cls}">${E(t(s[0], s[1]))}</small>`); });
      const tb = box.querySelector('.so-tab'); if (tb && !box.querySelector('.so-leg')) tb.insertAdjacentHTML('afterend', `<p class="fine so-leg">${E(t('dst_leg'))}</p>`);
    } catch (e) {}
    return out;
  };
})();

/* ---- 2. lasting ids, last-changed times, and merging a backup ---- */
const REC_LISTS = [['mpList'], ['rcList'], ['jrList'], ['tyList'], ['dqOffers'], ['pf', 'sav'], ['pf', 'hold'], ['lp', 'goals'], ['lp', 'saved'], ['lp', 'ev']];
const REC_MAPS = ['nwHist', 'pfHist'];
const recGet = (o, path) => path.reduce((x, k) => x && typeof x === 'object' ? x[k] : undefined, o);
const recId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const recHash = x => { const c = Object.assign({}, x); delete c._u; delete c._h; delete c.rid; let s = JSON.stringify(c), h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h.toString(36); };
/* gives each record an id, and a new "last changed" time whenever its content changed since the last look */
function recStamp(obj, quiet){
  let ch = 0; const now = Date.now();
  REC_LISTS.forEach(p => { const L = recGet(obj, p); if (!Array.isArray(L)) return;
    L.forEach(x => { if (!x || typeof x !== 'object') return; if (!x.rid){ x.rid = recId(); ch++; } const h = recHash(x); if (x._h !== h){ x._h = h; x._u = quiet && x._u ? x._u : now; ch++; } }); });
  return ch;
}
var REC_T = null;
function recSoon(){ clearTimeout(REC_T); REC_T = setTimeout(() => { try { if (recStamp(SET)) saveSet(); } catch (e) {} }, 1200); }
['input', 'change', 'click'].forEach(ev => document.addEventListener(ev, recSoon, true));
setTimeout(() => { try { if (recStamp(SET, true)) saveSet(); } catch (e) {} }, 2500);
/* merge: the records of both copies, matched by id; when both have one, the newer wins */
function recMerge(mine, inc){
  const out = JSON.parse(JSON.stringify(inc)), st = {add: 0, upd: 0, keep: 0};
  recStamp(mine, true); recStamp(out, true);
  REC_LISTS.forEach(p => {
    const A = recGet(mine, p); if (!Array.isArray(A) || !A.length) return;
    let parent = out; for (let i = 0; i < p.length - 1; i++){ if (!parent[p[i]] || typeof parent[p[i]] !== 'object') parent[p[i]] = {}; parent = parent[p[i]]; }
    const k = p[p.length - 1], B = Array.isArray(parent[k]) ? parent[k] : (parent[k] = []), byId = new Map(B.map((x, i) => [x && x.rid, i]));
    A.forEach(x => { if (!x || !x.rid) return; const j = byId.get(x.rid);
      if (j == null){ B.push(x); st.add++; }
      else if ((+x._u || 0) > (+B[j]._u || 0)){ B[j] = x; st.keep++; } else if (recHash(x) !== recHash(B[j])) st.upd++; });
  });
  REC_MAPS.forEach(k => { const A = mine[k]; if (!A || typeof A !== 'object') return; const B = out[k] && typeof out[k] === 'object' ? out[k] : (out[k] = {});
    Object.keys(A).forEach(m => { if (!B[m]){ B[m] = A[m]; st.add++; } else if ((+A[m].at || 0) > (+B[m].at || 0)){ B[m] = A[m]; st.keep++; } }); });
  return {out, st};
}
var REC_MSG = '';
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#set_import')) return;
  const ta = document.getElementById('set_json'); if (!ta) return; REC_MSG = '';
  try { const o = JSON.parse(ta.value); if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    const R = recMerge(JSON.parse(JSON.stringify(SET)), o); ta.value = JSON.stringify(R.out); REC_MSG = t('rec_merged', {a: R.st.add, k: R.st.keep, u: R.st.upd});
    setTimeout(() => { try { ta.value = JSON.stringify(o, null, 1); if (REC_MSG) toast(REC_MSG); } catch (er) {} }, 60);
  } catch (er) {}
}, true);

/* ---- 3. the assistant reads the tables too ---- */
(function(){
  const ai11 = aiScreenText;
  aiScreenText = function(id){
    let s = ai11.apply(this, arguments);
    try { const L = typeof LAST === 'object' && LAST[id]; if (L && L.table && Array.isArray(L.table.rows) && L.table.rows.length && ['fpic', 'myreport', 'taxyears', 'recmp', 'alerts', 'finjournal', 'mypolicies'].includes(id))
      s += '\nTable "' + String(L.table.title || '').replace(/<[^>]*>/g, '') + '":\n' + L.table.rows.slice(0, 30).map(r => '- ' + r.map(c => String(c).replace(/<[^>]*>/g, '')).join(' | ')).join('\n')
        + '\nThese figures are what the person typed on this device. Do not invent other numbers; say what is an assumption.'; } catch (e) {}
    return s;
  };
  const st = document.createElement('style');
  st.textContent = '.so-st{display:block;font-size:12px;margin-top:2px;color:var(--ink-2)}.so-st.live{color:var(--good,#1b8a4b)}.so-st.old{color:var(--warn,#b45309)}[data-theme="dark"] .so-st.live{color:#5EE08F}[data-theme="dark"] .so-st.old{color:#FBBF24}';
  document.head.appendChild(st);
})();
