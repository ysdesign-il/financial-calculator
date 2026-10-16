/* ================= 10.1: when holidays overlap, the country decides which theme comes first ================= */
/* Israel (or no country chosen): Jewish holidays first. Muslim-majority countries: Muslim first. Everyone else: Christian first. */
const HOL_MUSLIM_CTY = 'AF AL AZ BH BD BN BF DZ DJ EG GM GN ID IR IQ JO KZ KM KW KG LB LY MV ML MR MA MY NE OM PK PS QA SA SN SL SO SD SY TJ TD TN TR TM AE UZ YE XK'.split(' ');
function holOrder(c){
  if (!c || c === 'IL') return ['jewish', 'muslim', 'christian'];
  if (HOL_MUSLIM_CTY.includes(c)) return ['muslim', 'christian', 'jewish'];
  return ['christian', 'jewish', 'muslim'];
}
const holidayNow101 = holidayNow;
holidayNow = function(d){
  const pick = SET.holAuto;
  if (pick !== 'all') return holidayNow101.apply(this, arguments);
  try {
    for (const g of holOrder(SET.country)){ SET.holAuto = g; const r = holidayNow101.call(this, d); if (r) return r; }
    return '';
  } finally { SET.holAuto = pick; }
};
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'set_country') return;
  setTimeout(() => { try { const was = HOL_ACTIVE; applyTheme(); if (was !== HOL_ACTIVE && typeof skRender === 'function') skRender(); } catch (er) {} }, 0);
});
try { applyTheme(); if (typeof skRender === 'function') skRender(); } catch (e) {}
