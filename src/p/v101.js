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

/* ---------- the data file (and, inside Claude, the app's database) is pulled 6 times a day; live sources keep their own pace ---------- */
var RJ_MAN = false;
const refreshEverything101 = refreshEverything;
refreshEverything = async function(manual){ RJ_MAN = !!manual; try { return await refreshEverything101.apply(this, arguments); } finally { RJ_MAN = false; } };
const rfOfficial101 = rfOfficial;
rfOfficial = async function(){
  /* on open the data comes in by itself (and inside Claude the database pushes every change), then 6 times a day;
     an automatic refresh only renews the live quotes, while the refresh button always pulls everything */
  if (!RJ_MAN) return !!(META && META.unix);
  rjMark(); return rfOfficial101.apply(this, arguments);
};

/* ---------- the interface follows the phone's language (until one is picked by hand); a change on the phone applies right away ---------- */
window.addEventListener('languagechange', () => {
  if (!langAuto()) return; const L = devLang(); if (L === lang) return;
  lang = L; try { applyLang(true); } catch (e) {}
});
