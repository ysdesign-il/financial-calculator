/* ================= 8.1: more app designs — PULSE, AURORA, MONO, BLOCK, EMERALD, SUNSET =================
   each one is a palette (used when no color theme is chosen) plus its own structure in design2.css; the banner art is drawn in CSS */
Object.assign(DZ, {
  pulse: mkSkin({mode:'dark', bg:'#07050F', surface:'#120C24', field:'#0D0820', ink:'#F2EEFF', ink2:'#9C92C4', line:'rgba(0,240,255,.16)', navy:'#05030B', onNavy:'#F2EEFF', onNavy2:'#9C92C4', navLine:'rgba(255,46,196,.22)',
    acc:'#FF2EC4', heroVal:'#00F0FF', heroTint:'rgba(255,46,196,.20)', heroBd:'rgba(0,240,255,.45)', c:['#FF2EC4', '#00F0FF', '#B6FF3B', '#FFD60A'],
    rail:'linear-gradient(180deg,#0B0618,#05030B)', hh:'linear-gradient(160deg,#1A0B33,#07050F)', hhBd:'rgba(255,46,196,.5)', hhL:'#C9B8FF', hhV:'#00F0FF', hhS:'#A99BD6',
    bottom:'rgba(7,5,15,.9)', body:'linear-gradient(transparent 0 62%,rgba(255,46,196,.10) 100%),repeating-linear-gradient(90deg,rgba(0,240,255,.05) 0 1px,transparent 1px 44px),repeating-linear-gradient(0deg,rgba(0,240,255,.05) 0 1px,transparent 1px 44px),radial-gradient(900px 500px at 50% -10%,rgba(138,92,255,.25),transparent 62%),#07050F'}),
  aurora: mkSkin({mode:'light', bg:'#EEF0FF', surface:'#FFFFFF', ink:'#1B1640', ink2:'#615C86', line:'rgba(27,22,64,.10)', navy:'#2A2370', onNavy:'#FFFFFF', onNavy2:'#D4D0FF',
    acc:'#6C5CE7', heroVal:'#6C5CE7', heroTint:'rgba(108,92,231,.14)', heroBd:'rgba(108,92,231,.28)', c:['#6C5CE7', '#00B8D9', '#FF6FB5', '#22C55E'],
    rail:'linear-gradient(120deg,rgba(108,92,231,.92),rgba(0,184,217,.88))', hh:'radial-gradient(220px 140px at 90% 0%,rgba(255,111,181,.45),transparent 70%),radial-gradient(240px 160px at 0% 100%,rgba(0,184,217,.45),transparent 70%),linear-gradient(135deg,#7B6CF0,#5546D6)', hhBd:'rgba(255,255,255,.7)', hhL:'#EDEBFF', hhV:'#FFFFFF', hhS:'#E2DFFF',
    bottom:'rgba(255,255,255,.7)', body:'radial-gradient(600px 420px at 10% 0%,rgba(108,92,231,.30),transparent 65%),radial-gradient(560px 420px at 100% 20%,rgba(0,184,217,.26),transparent 65%),radial-gradient(620px 460px at 40% 100%,rgba(255,111,181,.24),transparent 65%),#EEF0FF'}),
  mono: mkSkin({mode:'light', bg:'#F4F3EF', surface:'#FFFFFF', ink:'#111111', ink2:'#5E5E5E', line:'rgba(0,0,0,.16)', navy:'#111111', onNavy:'#FFFFFF', onNavy2:'#BDBDBD', navLine:'rgba(255,255,255,.18)',
    acc:'#E63312', accText:'#E63312', heroVal:'#111111', heroTint:'rgba(230,51,18,.0)', heroBd:'#111111', c:['#E63312', '#111111', '#2F6FEB', '#F2B705'],
    rail:'#111111', hh:'linear-gradient(90deg,#E63312 0 10px,#FFFFFF 10px)', hhBd:'#111111', hhL:'#5E5E5E', hhV:'#111111', hhS:'#5E5E5E',
    bottom:'rgba(255,255,255,.97)', body:'#F4F3EF'}),
  block: mkSkin({mode:'light', bg:'#FFF6E0', surface:'#FFFFFF', ink:'#111111', ink2:'#3D3D3D', line:'#111111', navy:'#111111', onNavy:'#FFFFFF', onNavy2:'#DADADA',
    acc:'#FFD23F', accText:'#111111', heroVal:'#111111', heroTint:'rgba(255,92,138,.0)', heroBd:'#111111', c:['#FF5C8A', '#3FA9F5', '#FFD23F', '#2BD99F'],
    rail:'#FF5C8A', hh:'#3FA9F5', hhBd:'#111111', hhL:'#111111', hhV:'#111111', hhS:'#111111',
    bottom:'#FFFFFF', body:'radial-gradient(#11111122 1.2px,transparent 1.6px) 0 0/22px 22px,#FFF6E0'}),
  emerald: mkSkin({mode:'dark', bg:'#06140F', surface:'#0C2219', field:'#091B14', ink:'#F3EEDF', ink2:'#A9B8A8', line:'rgba(214,190,130,.20)', navy:'#041009', onNavy:'#F3EEDF', onNavy2:'#A9B8A8', navLine:'rgba(214,190,130,.22)',
    acc:'#D6BE82', heroVal:'#EAD9A6', heroTint:'rgba(214,190,130,.14)', heroBd:'rgba(214,190,130,.45)', c:['#D6BE82', '#4FC59A', '#E8DDB8', '#8FB8A0'],
    rail:'linear-gradient(180deg,#0A1E16,#041009)', hh:'repeating-conic-gradient(from 0deg at 50% 120%,rgba(214,190,130,.10) 0 3deg,transparent 3deg 9deg),linear-gradient(160deg,#0F2C20,#06140F)', hhBd:'rgba(214,190,130,.55)', hhL:'#CFC6A8', hhV:'#EAD9A6', hhS:'#A9B8A8',
    bottom:'rgba(4,16,9,.94)', body:'radial-gradient(900px 520px at 90% -10%,rgba(79,197,154,.12),transparent 62%),radial-gradient(700px 480px at 0% 110%,rgba(214,190,130,.08),transparent 60%),#06140F'}),
  sunset: mkSkin({mode:'light', bg:'#FFF1E8', surface:'#FFFFFF', ink:'#3A1E1A', ink2:'#8A625A', line:'rgba(58,30,26,.10)', navy:'#4A1F2E', onNavy:'#FFF1E8', onNavy2:'#F3C9BC',
    acc:'#FF7A59', accText:'#D9472B', heroVal:'#D9472B', heroTint:'rgba(255,122,89,.16)', heroBd:'rgba(255,122,89,.35)', c:['#FF7A59', '#FFB547', '#E8457C', '#7A5CFA'],
    rail:'linear-gradient(120deg,#E8457C,#FF7A59 55%,#FFB547)', hh:'linear-gradient(180deg,#FFB547 0%,#FF7A59 45%,#E8457C 80%,#7A3E8E 100%)', hhBd:'rgba(255,255,255,.6)', hhL:'#FFF1E8', hhV:'#FFFFFF', hhS:'#FFE3D6',
    bottom:'rgba(255,255,255,.9)', body:'radial-gradient(700px 420px at 100% 0%,rgba(255,181,71,.30),transparent 62%),radial-gradient(600px 420px at 0% 100%,rgba(232,69,124,.16),transparent 62%),#FFF1E8'})
});
['pulse', 'aurora', 'mono', 'block', 'emerald', 'sunset'].forEach(k => { if (!DZ_KEYS.includes(k)) DZ_KEYS.push(k); });
Object.assign(DZ_FONT, {
  pulse: 'Orbitron:wght@600;800&family=Rubik:wght@500;700', aurora: 'Varela+Round', mono: 'Heebo:wght@400;800;900',
  block: 'Secular+One&family=Archivo+Black', emerald: 'Bellefair&family=Playfair+Display:wght@600', sunset: 'Rubik:wght@500;700;800'
});
Object.assign(DZ, {
  edition: mkSkin({mode:'light', bg:'#F5F0E8', surface:'#FFFDF8', ink:'#141210', ink2:'#6B645A', line:'rgba(20,18,16,.18)', navy:'#141210', onNavy:'#F5F0E8', onNavy2:'#BDB4A6',
    acc:'#B5121B', accText:'#B5121B', heroVal:'#141210', heroTint:'rgba(181,18,27,0)', heroBd:'#141210', c:['#141210', '#B5121B', '#C9A227', '#5A6B7A'],
    rail:'#141210', hh:'#FFFDF8', hhBd:'#141210', hhL:'#6B645A', hhV:'#141210', hhS:'#6B645A', bottom:'rgba(245,240,232,.97)', body:'#F5F0E8'}),
  prism: mkSkin({mode:'light', bg:'#F3F1F8', surface:'#FFFFFF', ink:'#1E1B2E', ink2:'#6E6A85', line:'rgba(30,27,46,.10)', navy:'#2B2545', onNavy:'#FFFFFF', onNavy2:'#D9D4F0',
    acc:'#8F7CFF', accText:'#6B55F0', heroVal:'#6B55F0', heroTint:'rgba(143,124,255,.14)', heroBd:'rgba(143,124,255,.3)', c:['#8F7CFF', '#4FD1C5', '#F78FB3', '#F6C177'],
    rail:'linear-gradient(115deg,#C9B8FF,#A6E8F0 35%,#FFC6DD 65%,#FFE1A8)', hh:'conic-gradient(from 200deg at 70% 40%,#C9B8FF,#A6E8F0,#FFC6DD,#FFE1A8,#C9B8FF)', hhBd:'rgba(255,255,255,.8)', hhL:'#3A3360', hhV:'#1E1B2E', hhS:'#4A4470',
    bottom:'rgba(255,255,255,.75)', body:'radial-gradient(500px 360px at 0% 0%,rgba(201,184,255,.45),transparent 65%),radial-gradient(500px 360px at 100% 30%,rgba(166,232,240,.45),transparent 65%),radial-gradient(560px 420px at 30% 100%,rgba(255,198,221,.40),transparent 65%),#F3F1F8'}),
  titan: mkSkin({mode:'dark', bg:'#0B0C0E', surface:'#16181C', field:'#101215', ink:'#ECEDEF', ink2:'#8B9098', line:'rgba(255,255,255,.09)', navy:'#08090A', onNavy:'#ECEDEF', onNavy2:'#8B9098',
    acc:'#C7CCD4', heroVal:'#F2F3F5', heroTint:'rgba(199,204,212,.10)', heroBd:'rgba(199,204,212,.30)', c:['#C7CCD4', '#FF9F0A', '#30D158', '#64D2FF'],
    rail:'linear-gradient(180deg,#17191D,#0B0C0E)', hh:'repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),linear-gradient(135deg,#2A2D33,#121417 60%)', hhBd:'rgba(199,204,212,.35)', hhL:'#A9AEB6', hhV:'#F2F3F5', hhS:'#8B9098',
    bottom:'rgba(16,18,21,.92)', body:'radial-gradient(900px 500px at 50% -15%,rgba(199,204,212,.10),transparent 62%),#0B0C0E'}),
  zen: mkSkin({mode:'light', bg:'#EFE9DF', surface:'#F8F4EC', ink:'#2B2622', ink2:'#7A7067', line:'rgba(43,38,34,.14)', navy:'#2B2622', onNavy:'#F8F4EC', onNavy2:'#C9BFB3',
    acc:'#C0392B', accText:'#B03325', heroVal:'#2B2622', heroTint:'rgba(192,57,43,.05)', heroBd:'rgba(43,38,34,.25)', c:['#C0392B', '#2B2622', '#7D8F69', '#B08D57'],
    rail:'#2B2622', hh:'#F8F4EC', hhBd:'rgba(43,38,34,.25)', hhL:'#7A7067', hhV:'#2B2622', hhS:'#7A7067', bottom:'rgba(248,244,236,.96)', body:'radial-gradient(rgba(43,38,34,.035) 1px,transparent 1.4px) 0 0/7px 7px,#EFE9DF'}),
  clay: mkSkin({mode:'light', bg:'#E6EDFF', surface:'#F5F8FF', ink:'#23304A', ink2:'#6A7894', line:'rgba(35,48,74,.08)', navy:'#3B4E86', onNavy:'#FFFFFF', onNavy2:'#D4DDFA',
    acc:'#6E8BFF', accText:'#4E6BF0', heroVal:'#4E6BF0', heroTint:'rgba(110,139,255,.14)', heroBd:'rgba(110,139,255,.0)', c:['#6E8BFF', '#FF8FB1', '#7BE0B5', '#FFC56E'],
    rail:'linear-gradient(135deg,#8AA2FF,#6E8BFF)', hh:'linear-gradient(135deg,#8AA2FF,#6E8BFF)', hhBd:'rgba(255,255,255,0)', hhL:'#EEF2FF', hhV:'#FFFFFF', hhS:'#E3E9FF',
    bottom:'#F5F8FF', body:'#E6EDFF'})
});
['edition', 'prism', 'titan', 'zen', 'clay'].forEach(k => { if (!DZ_KEYS.includes(k)) DZ_KEYS.push(k); });
Object.assign(DZ_FONT, {edition: 'Playfair+Display:ital,wght@0,700;1,600;1,800&family=David+Libre:wght@500;700', prism: 'Rubik:wght@500;700', titan: 'Heebo:wght@300;500;700', zen: 'Frank+Ruhl+Libre:wght@400;700&family=Shippori+Mincho:wght@600', clay: 'Varela+Round&family=Rubik:wght@600;800'});
(function dzCss81(){
  let css = '';
  ['pulse', 'aurora', 'mono', 'block', 'emerald', 'sunset', 'edition', 'prism', 'titan', 'zen', 'clay'].forEach(k => { css += ':root[data-design="' + k + '"][data-dzc="own"]{' + Object.entries(DZ[k].t).map(([p, v]) => p + ':' + v).join(';') + '}\n'; });
  const st = document.createElement('style'); st.id = 'dz-css81'; st.textContent = css; document.head.appendChild(st);
})();
/* the banner text for designs without a photo */
function dzBanText(){
  const d = dzOn(); if (!d || d === 'orbit' || d === 'aurum') return;
  const b = $('#dzXb'), k = $('#dzXk'), g = $('#dzXt'); if (!b) return;
  b.textContent = d.toUpperCase(); k.textContent = t('dz_' + d + 'Kick'); g.textContent = t('dz_' + d + 'Tag');
}
const _atDz81 = applyTheme;
applyTheme = function(){ const r = _atDz81.apply(this, arguments); try { dzBanText(); } catch (e) {} return r; };
const _rsDz81 = renderStamp;
renderStamp = function(){ const r = _rsDz81.apply(this, arguments); try { dzBanText(); } catch (e) {} return r; };
try { if (!DZ_KEYS.includes(SET.design)) SET.design = 'default'; applyTheme(); } catch (e) {}
