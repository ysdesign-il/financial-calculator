/* ---------- 13.67: periods of time read naturally in every calculator ----------
   Before: "0 שנים ו-6 חודשים", and in a number box (left-to-right) it even showed as "שנים ו- 6 חודשים 0".
   Now: parts that are 0 are left out, one and two get their own words (שנה, שנתיים, חודש, חודשיים / سنة، سنتان، شهر، شهران /
   1 year, 1 month), and the text is isolated so it always reads in its own direction, whatever box it is in. */
function durText(months){
  months = Math.max(0, Math.round(+months || 0));
  const y = Math.floor(months / 12), m = months % 12, n = x => N(x, 0);
  let parts;
  if (lang === 'he'){
    const Y = y === 1 ? 'שנה' : y === 2 ? 'שנתיים' : n(y) + ' שנים', Mo = m === 1 ? 'חודש' : m === 2 ? 'חודשיים' : n(m) + ' חודשים';
    parts = y && m ? Y + ' ו' + (/^[0-9]/.test(Mo) || /^[٠-٩]/.test(Mo) ? '־' : '') + Mo : y ? Y : m ? Mo : '0 חודשים';
  } else if (lang === 'ar'){
    const Y = y === 1 ? 'سنة واحدة' : y === 2 ? 'سنتان' : n(y) + (y <= 10 ? ' سنوات' : ' سنة'), Mo = m === 1 ? 'شهر واحد' : m === 2 ? 'شهران' : n(m) + (m <= 10 ? ' أشهر' : ' شهرًا');
    parts = y && m ? Y + ' و' + Mo : y ? Y : m ? Mo : '0 أشهر';
  } else if (lang === 'en'){
    const Y = n(y) + (y === 1 ? ' year' : ' years'), Mo = n(m) + (m === 1 ? ' month' : ' months');
    parts = y && m ? Y + ' and ' + Mo : y ? Y : m ? Mo : '0 months';
  } else {
    /* the other interface languages: their own translated words, still without the parts that are 0 */
    parts = y && m ? t('w_yrsMonths', {y: n(y), m: n(m)}) : y ? t('w_durY', {y: n(y)}) : t('w_durM', {m: n(m)});
  }
  return '⁨' + parts + '⁩';
}
fmtDur = durText;
/* the same in every other sentence of the app: "1 שנים" → "שנה אחת", "2 חודשים" → "חודשיים", "1 years" → "1 year" */
const DUR_RX = /(^|[^0-9.,٠-٩])([12]) (שנים|חודשים)(?![א-ת])|(^|[^0-9.,])1 (years|months)\b/g;
const DUR_HE = {'1 שנים': 'שנה אחת', '2 שנים': 'שנתיים', '1 חודשים': 'חודש אחד', '2 חודשים': 'חודשיים'};
const tDur0 = t;
t = function(){
  const s = tDur0.apply(this, arguments);
  if (typeof s !== 'string' || s.length > 600 || !/[12] (?:שנים|חודשים)|1 (?:years|months)/.test(s)) return s;
  return s.replace(DUR_RX, (all, p1, d, he, p2, en) => he ? p1 + DUR_HE[d + ' ' + he] : p2 + '1 ' + en.slice(0, -1));
};
