/* ================= 7.8: app designs — the current look (default), ORBIT and AURUM ================= */
const DZ_KEYS = ['default', 'orbit', 'aurum'];
const DZ = {
  orbit: mkSkin({mode:'dark', bg:'#050817', surface:'#0D1330', field:'#0A1029', ink:'#EEF2FF', ink2:'#9AA6D2', line:'rgba(150,170,255,.16)', navy:'#040612', onNavy:'#EEF2FF', onNavy2:'#9AA6D2', navLine:'rgba(150,170,255,.18)',
    acc:'#E8C27A', heroVal:'#F4D08A', heroTint:'rgba(124,92,255,.24)', heroBd:'rgba(120,150,255,.34)', c:['#E8C27A', '#38D2FF', '#9B6BFF', '#3EE6A0'],
    rail:'linear-gradient(180deg,rgba(11,16,48,.96),rgba(5,8,23,.96))', hh:'linear-gradient(160deg,rgba(18,22,60,.55),rgba(5,8,23,.92))', hhBd:'rgba(120,150,255,.40)', hhL:'#C9D2FF', hhV:'#F4D08A', hhS:'#A8B3DE',
    bottom:'rgba(8,12,34,.82)', body:'radial-gradient(1.2px 1.2px at 12% 18%,rgba(255,255,255,.7),transparent 60%),radial-gradient(1px 1px at 72% 9%,rgba(255,255,255,.6),transparent 60%),radial-gradient(1px 1px at 38% 62%,rgba(255,255,255,.45),transparent 60%),radial-gradient(1.2px 1.2px at 88% 44%,rgba(255,255,255,.55),transparent 60%),radial-gradient(900px 520px at 85% -10%,rgba(124,92,255,.22),transparent 62%),radial-gradient(800px 520px at 0% 30%,rgba(56,210,255,.12),transparent 60%),radial-gradient(700px 500px at 60% 110%,rgba(232,194,122,.10),transparent 60%),#050817'}),
  aurum: mkSkin({mode:'dark', bg:'#080705', surface:'#13110C', field:'#0E0C08', ink:'#F6EEDB', ink2:'#A99B7E', line:'rgba(212,175,95,.20)', navy:'#060504', onNavy:'#F6EEDB', onNavy2:'#A99B7E', navLine:'rgba(212,175,95,.22)',
    acc:'#D8B46A', heroVal:'#E9C982', heroTint:'rgba(212,175,95,.16)', heroBd:'rgba(212,175,95,.45)', c:['#D8B46A', '#F3E2B3', '#9C7A3C', '#E7D3A0'],
    rail:'linear-gradient(180deg,#0E0C08,#060504)', hh:'linear-gradient(160deg,rgba(30,24,12,.55),rgba(8,7,5,.94))', hhBd:'rgba(212,175,95,.5)', hhL:'#D9C79F', hhV:'#E9C982', hhS:'#B5A584',
    bottom:'rgba(10,9,6,.92)', body:'radial-gradient(900px 520px at 90% -12%,rgba(212,175,95,.12),transparent 62%),radial-gradient(700px 480px at 0% 110%,rgba(212,175,95,.07),transparent 60%),#080705'})
};
DZ.orbit.t['--dz-hero'] = 'url(' + DZ_IMG.orbitHero + ')'; DZ.orbit.t['--dz-head'] = 'url(' + DZ_IMG.orbitHead + ')';
DZ.aurum.t['--dz-hero'] = 'url(' + DZ_IMG.aurumHero + ')'; DZ.aurum.t['--dz-head'] = 'url(' + DZ_IMG.aurumHead + ')';
(function dzCss(){
  /* a design keeps its own colors only when no color theme is chosen ("by device", dark or light); with a color theme it takes the theme's colors */
  let css = ''; for (const k in DZ){
    const img = ['--dz-hero', '--dz-head'], t0 = Object.entries(DZ[k].t);
    css += ':root[data-design="' + k + '"][data-dzc="own"]{' + t0.filter(([p]) => !img.includes(p)).map(([p, v]) => p + ':' + v).join(';') + '}\n';
    css += ':root[data-design="' + k + '"]{' + t0.filter(([p]) => img.includes(p)).map(([p, v]) => p + ':' + v).join(';') + '}\n';
  }
  const st = document.createElement('style'); st.id = 'dz-css'; st.textContent = css; document.head.appendChild(st);
})();
const dzOn = () => DZ[SET.design] ? SET.design : '';
const DZ_FONT = {aurum: 'Cormorant+Garamond:wght@500;600;700'};
function dzFont(){
  const d = dzOn(), f = DZ_FONT[d]; if (!f || document.getElementById('font-dz-' + d)) return;
  const l = document.createElement('link'); l.id = 'font-dz-' + d; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + f + '&display=swap'; document.head.appendChild(l);
}
const _atDz = applyTheme;
applyTheme = function(){
  const r0 = _atDz.apply(this, arguments);
  const d = dzOn(), r = document.documentElement;
  if (d){
    const sk = SKINS[HOL_ACTIVE || SET.theme];
    r.dataset.design = d; r.dataset.dzc = sk ? 'skin' : 'own';
    if (!sk){
      r.dataset.theme = DZ[d].mode || 'dark'; r.dataset.skin = 'dz-' + d;
      ['--gold-ui', '--gold', '--brass'].forEach(p => r.style.removeProperty(p));
      const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = DZ[d].t['--navy'];
    }
    dzFont();
  } else { delete r.dataset.design; delete r.dataset.dzc; }
  try { dzGal(); } catch (e) {}
  return r0;
};
function dzCard(k){
  const on = (dzOn() || 'default') === k;
  const pv = DZ_IMG[k + 'Hero'] ? ` style="--dz-pv:url(${DZ_IMG[k + 'Hero']})"` : '';
  return `<button type="button" class="dz-c dz-c-${k}" role="radio" data-dz-pick="${k}" aria-checked="${on}"><span class="dz-pv"${pv} aria-hidden="true"><b>${k === 'default' ? '₪' : k.toUpperCase()}</b><i></i><i></i><i></i></span><span class="skin-n">${asEsc(t('dz_' + k))}</span><small>${asEsc(t('dz_' + k + 'S'))}</small></button>`;
}
function dzGalHTML(){ return DZ_KEYS.map(dzCard).join(''); }
function dzGal(){
  const g = document.getElementById('dzGal'); if (g) g.innerHTML = dzGalHTML();
  const s = document.getElementById('set_design'); if (s && s.value !== (dzOn() || 'default')) s.value = dzOn() || 'default';
  const box = document.querySelector('#skx .skins');
  if (box){
    let w = box.querySelector('.dz-in');
    if (!w){ w = document.createElement('div'); w.className = 'dz-in'; box.prepend(w); }
    w.innerHTML = `<h4 class="skins-h">${asEsc(t('dz_gal'))}</h4><div class="dz-gal" role="radiogroup">${dzGalHTML()}</div>`;
  }
  $$('.dz-note').forEach(n => n.remove());
  if (dzOn()) $$('.skins').forEach(b => { const h = b.querySelector('.skins-h:not(.dz-in .skins-h)') || b.firstElementChild; const p = document.createElement('p'); p.className = 'skins-now dz-note'; p.textContent = t('dz_skinNote'); if (h) h.insertAdjacentElement('beforebegin', p); else b.prepend(p); });
}
function dzPick(k){
  if (!DZ_KEYS.includes(k)) return;
  SET.design = k; saveSet(); applyTheme();
  try { skRender(); } catch (e) {}
  try { calc(tab); } catch (e) {}
  const c = document.querySelector('[data-dz-pick="' + k + '"]'); if (c) c.focus();
}
const _skRDz = skRender;
skRender = function(){ const r = _skRDz.apply(this, arguments); try { dzGal(); } catch (e) {} return r; };
document.addEventListener('click', e => { const c = e.target.closest('[data-dz-pick]'); if (c){ e.preventDefault(); dzPick(c.dataset.dzPick); } });
document.addEventListener('keydown', e => {
  const c = e.target.closest && e.target.closest('.dz-c'); if (!c || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const rtl = document.documentElement.dir === 'rtl', all = $$('.dz-c', c.parentElement), i = all.indexOf(c), fw = e.key === 'ArrowDown' || (e.key === 'ArrowLeft' ? rtl : e.key === 'ArrowRight' ? !rtl : false);
  const n = all[(i + (fw ? 1 : -1) + all.length) % all.length]; if (n){ e.preventDefault(); n.focus(); }
});
try { if (!SET.design) SET.design = 'default'; applyTheme(); } catch (e) {}   /* unknown designs are checked once all designs are registered (v81) */
