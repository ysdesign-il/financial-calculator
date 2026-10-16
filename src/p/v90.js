/* ================= 8.8: a picture for every live index and commodity ================= */
/* drawn here as small vector pictures (no outside images): gold, silver, platinum and copper bars, oil barrels, a gas flame,
   a flag coin for each stock index, and pictures for the price indices */
(function mkDefs(){
  if (document.getElementById('mk-defs')) return;
  const g = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  document.body.insertAdjacentHTML('beforeend', `<svg id="mk-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${g('mkg-gold', '#fff3b0', '#e2b33c', '#8f6411')}${g('mkg-silver', '#ffffff', '#c3c8d0', '#6e7480')}${g('mkg-plat', '#f4fbff', '#b9cbd6', '#5f7684')}
    ${g('mkg-copper', '#ffd0a8', '#c8743a', '#6e3412')}${g('mkg-oil', '#4a4f5c', '#23262e', '#0b0c10')}${g('mkg-wti', '#5a4630', '#2c2116', '#0d0905')}
    ${g('mkg-flame', '#d6f0ff', '#3fa0ff', '#1a3fc4')}${g('mkg-vix', '#e8d4ff', '#9b5cff', '#4b1aa8')}${g('mkg-green', '#d9ffe9', '#2fbf71', '#0d6b3a')}
    ${g('mkg-cpi', '#fff1d6', '#ff9f43', '#b5530f')}${g('mkg-build', '#fff7c2', '#f5c518', '#8a6a00')}${g('mkg-house', '#e1f0ff', '#4c8dff', '#1d3f99')}
  </defs></svg>`);
})();
const MK_BAR = f => `<svg viewBox="0 0 32 32"><path d="M4 26h24l-3.4-7H7.4z" fill="url(#${f})" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M7.4 19h17.2l-1.2-2.4H8.6z" fill="#fff" opacity=".45"/><path d="M9.5 16.5h13l-3-6.5h-7z" fill="url(#${f})" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M12.5 10h7l-.7-1.4h-5.6z" fill="#fff" opacity=".55"/><path d="M11 23l2-3" stroke="#fff" stroke-width="1.2" opacity=".6" stroke-linecap="round"/></svg>`;
const MK_BARREL = (f, band) => `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="7" rx="8.5" ry="2.6" fill="#3b3f49"/><path d="M7.5 7v18c0 1.5 3.8 2.7 8.5 2.7s8.5-1.2 8.5-2.7V7c0 1.5-3.8 2.6-8.5 2.6S7.5 8.5 7.5 7z" fill="url(#${f})"/><path d="M7.5 12.5c0 1.4 3.8 2.6 8.5 2.6s8.5-1.2 8.5-2.6M7.5 20c0 1.4 3.8 2.6 8.5 2.6s8.5-1.2 8.5-2.6" fill="none" stroke="${band}" stroke-width="1.6"/><path d="M16 15.8c-1.6 2.3-2.3 3.4-2.3 4.4a2.3 2.3 0 0 0 4.6 0c0-1-.7-2.1-2.3-4.4z" fill="${band}"/><path d="M10 9.5v15" stroke="#fff" stroke-width="1" opacity=".18"/></svg>`;
const MK_SVG = {
  gold: MK_BAR('mkg-gold'), silver: MK_BAR('mkg-silver'), platinum: MK_BAR('mkg-plat'), copper: MK_BAR('mkg-copper'),
  brent: MK_BARREL('mkg-oil', '#f2b134'), wti: MK_BARREL('mkg-wti', '#e5533d'),
  natgas: `<svg viewBox="0 0 32 32"><path d="M16 3c1 5.5 7.5 8 7.5 15.2A7.5 7.5 0 0 1 8.5 18.2C8.5 13 12 11.4 12 7.6c2.4 1.6 3.4 3.6 3.4 5.6C17.6 11 17 7 16 3z" fill="url(#mkg-flame)"/><path d="M16 15c.6 2.6 3.4 3.6 3.4 6.7a3.4 3.4 0 0 1-6.8 0c0-2.2 1.6-3 1.8-5 1 .6 1.5 1.4 1.6 2.3.4-1.3.4-2.6 0-4z" fill="#eaf7ff"/></svg>`,
  vix: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="url(#mkg-vix)"/><path d="M18 5.5L9.5 17.5h6l-2 9 9-12.5h-6.2z" fill="#fff8d6" stroke="#5a2bb0" stroke-width=".8" stroke-linejoin="round"/></svg>`,
  cpi: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="url(#mkg-cpi)"/><path d="M8 10h2.4l2.2 9.2h9.2l1.9-6.6H11.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13.6" cy="22.6" r="1.5" fill="#fff"/><circle cx="20.6" cy="22.6" r="1.5" fill="#fff"/></svg>`,
  build: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="url(#mkg-build)"/><path d="M10 25V8h2v17M8 25h16M12 9l12 2.5M12 12.5l11-1M23 11.5v5" stroke="#3a2c00" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="20.5" y="16.5" width="5" height="3.4" rx=".6" fill="#3a2c00"/></svg>`,
  house: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="url(#mkg-house)"/><path d="M8 16.5L16 9l8 7.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 15v8h11v-8" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><rect x="14.4" y="18" width="3.2" height="5" fill="#fff"/></svg>`
};
const MK_FLAG = {ta35: '🇮🇱', ta125: '🇮🇱', spx: '🇺🇸', ndx: '🇺🇸', dji: '🇺🇸', ixic: '🇺🇸', rut: '🇺🇸', ftse: '🇬🇧', dax: '🇩🇪', stoxx: '🇪🇺', nikkei: '🇯🇵'};
function mkIcon(k){
  if (MK_SVG[k]) return `<span class="mk-ic mk-ic-${k}" aria-hidden="true">${MK_SVG[k]}${['gold', 'silver', 'platinum', 'copper'].includes(k) ? '<span class="mk-sh"><i></i></span>' : ''}</span>`;
  if (MK_FLAG[k]) return `<span class="cur-coin mk-flag" aria-hidden="true"><i>${MK_FLAG[k]}</i></span>`;
  return '';
}
function mkIconsAll(){
  $$('#hmx .ix-card[data-ixk]').forEach(c => {
    const l = c.querySelector('.mk-l'); if (!l || l.querySelector('.mk-ic, .cur-coin')) return;
    const h = mkIcon(c.dataset.ixk); if (h) l.insertAdjacentHTML('afterbegin', h);
  });
}
const _ixBoard90 = ixBoard;
ixBoard = function(){ const r = _ixBoard90.apply(this, arguments); try { mkIconsAll(); } catch (e) {} return r; };
try { mkIconsAll(); } catch (e) {}
