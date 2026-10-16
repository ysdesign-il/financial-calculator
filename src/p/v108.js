/* ================= 10.8+: improvements — compact result while scrolling, warnings on data that may be out of date ================= */
const E108 = s => asEsc(String(s == null ? '' : s));

/* ---------- on a phone the result card stays on top while you scroll; once you scroll it shrinks to the number itself ---------- */
(function heroCompact(){
  let on = false, raf = 0;
  const upd = () => { raf = 0; const v = window.scrollY > 260; if (v !== on){ on = v; document.body.classList.toggle('hero-min', v); } };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, {passive: true});
  upd();
})();

/* ---------- figures that age: say so on the result ---------- */
const FIG_YEAR = 2026;
const YEAR_TABS = ['salary', 'empcost', 'selfemp', 'freelance', 'overtime', 'leave', 'notice', 'severance', 'benefits', 'carbenefit', 'joboffer', 'tax', 'taxrefund',
  'capital', 'rental', 'purchasetax', 'landtax', 'hishtalmut', 'mortcap', 'kidsave', 'workgrant', 'reserve', 'pensfix', 'childallow', 'oldage'];
function daysSince(iso){ const d = Date.parse(String(iso || '').slice(0, 10)); return isFinite(d) ? Math.floor((Date.now() - d) / 864e5) : 0; }
const show108 = show;
show = function(id, res){
  try {
    if (res && typeof res === 'object'){
      const w = [];
      if (YEAR_TABS.includes(id) && new Date().getFullYear() > FIG_YEAR) w.push(t('w_figYear', {y: FIG_YEAR}));
      const at = id === 'cellcmp' && typeof CELL === 'object' ? CELL.at : id === 'phonecmp' && typeof PHONES === 'object' ? PHONES.at : '';
      if (at && daysSince(at) > 45) w.push(t('w_dataOld', {d: at.slice(0, 10)}));
      if (w.length) res = Object.assign({}, res, {warn: (res.warn || []).concat(w)});
    }
  } catch (e) {}
  return show108.apply(this, [id, res].concat([].slice.call(arguments, 2)));
};
