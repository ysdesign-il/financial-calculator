
/* ================= 7.5 ================= */

/* ---------- tax figures in salary and income tax: automatic (official) or typed in by hand ---------- */
var FIG_F = [['fPt', () => TAX.point / 12, x => { TAX.point = x * 12; }]]
  .concat([0, 1, 2, 3, 4].map(i => ['fB' + (i + 1), () => TAX.brackets[i][0] / 12, x => { TAX.brackets[i][0] = x * 12; }]))
  .concat(TAX.brackets.map((b, i) => ['fR' + (i + 1), () => TAX.brackets[i][1] * 100, x => { TAX.brackets[i][1] = x / 100; }]))
  .concat([
    ['fSur', () => TAX.surtaxFrom / 12, x => { TAX.surtaxFrom = x * 12; }], ['fSurR', () => TAX.surtaxRate * 100, x => { TAX.surtaxRate = x / 100; }],
    ['fNiCut', () => TAX.niCut, x => { TAX.niCut = x; }], ['fNiMax', () => TAX.niMax, x => { TAX.niMax = x; }],
    ['fNiL', () => TAX.niLow * 100, x => { TAX.niLow = x / 100; }], ['fNiH', () => TAX.niHigh * 100, x => { TAX.niHigh = x / 100; }],
    ['fHL', () => TAX.hLow * 100, x => { TAX.hLow = x / 100; }], ['fHH', () => TAX.hHigh * 100, x => { TAX.hHigh = x / 100; }],
    ['fPensCap', () => TAX.pensSalaryCap, x => { TAX.pensSalaryCap = x; }], ['fPensCr', () => TAX.pensCreditRate * 100, x => { TAX.pensCreditRate = x / 100; }]]);
const figR4 = x => String(Math.round(x * 10000) / 10000);
function figSync(p, manual){
  FIG_F.forEach(([k, get]) => {
    const el = document.getElementById(p + '_' + k); if (!el) return;
    el.disabled = !manual;
    if (!manual && document.activeElement !== el){ const v = figR4(get()); if (el.value !== v) el.value = v; }
    const f = el.closest('.field'); if (f) f.classList.toggle('fig-off', !manual);
  });
}
function figRun(p, fn){
  const manual = (document.getElementById(p + '_fig') || {}).value === 'manual';
  figSync(p, manual);
  if (!manual) return fn();
  const keep = Object.assign({}, TAX, {brackets: TAX.brackets.map(x => x.slice())});
  try {
    FIG_F.forEach(([k, , set]) => { const el = document.getElementById(p + '_' + k); const x = el ? parseFloat(el.value) : NaN; if (isFinite(x) && x >= 0) set(x); });
    let bad = false; for (let i = 1; i < 5; i++) if (!(TAX.brackets[i][0] > TAX.brackets[i - 1][0])) bad = true;
    const r = fn();
    if (r) r.warn = (r.warn || []).concat([t('w_figManual')]).concat(bad ? [t('w_figOrder')] : []);
    return r;
  } finally { Object.keys(keep).forEach(k => { TAX[k] = keep[k]; }); }
}
['salary', 'tax'].forEach(id => { const f = CALC[id]; if (typeof f === 'function') CALC[id] = () => figRun(id === 'salary' ? 's' : 't', f); });

/* ---------- market data: automatic (live) or manual (only when you tap refresh) ---------- */
var MKT_FORCE = false;
const mktHold = () => SET.mktLive === '0' && !MKT_FORCE;
const fxTick75 = fxTick;
fxTick = async function(){ if (mktHold()){ fxTimer = null; fxStatus('fx_paused'); return; } return fxTick75.apply(this, arguments); };
const binTick75 = binTick;
binTick = async function(){ if (mktHold()){ binTimer = null; SRC_ST.binance = 'off'; return; } return binTick75.apply(this, arguments); };
const ixLiveTick75 = ixLiveTick;
ixLiveTick = async function(force){ if (mktHold() && !force){ clearTimeout(IXL.timer); IXL.timer = null; return false; } return ixLiveTick75.apply(this, arguments); };
const tryLiveCrypto75 = tryLiveCrypto;
tryLiveCrypto = async function(){ if (mktHold()) return false; return tryLiveCrypto75.apply(this, arguments); };
const fxApplySnap75 = fxApplySnap;
fxApplySnap = function(){ if (mktHold()) return false; return fxApplySnap75.apply(this, arguments); };
const ixApply75 = ixApply;
ixApply = function(d){ if (mktHold() && d && d.mkt) d = Object.assign({}, d, {mkt: null}); return ixApply75.call(this, d, arguments[1]); };
const refreshEverything75 = refreshEverything;
refreshEverything = async function(manual){
  if (SET.mktLive === '0' && !manual){ try { await rfOfficial(); } catch (e) {} return false; }
  MKT_FORCE = SET.mktLive === '0';
  try { return await refreshEverything75.apply(this, arguments); } finally { MKT_FORCE = false; }
};
function mktApply(quiet){
  if (SET.mktLive === '0'){
    if (fxTimer){ clearTimeout(fxTimer); fxTimer = null; } if (binTimer){ clearTimeout(binTimer); binTimer = null; }
    clearTimeout(IXL.timer); IXL.timer = null; fxStatus('fx_paused');
  } else { try { fxStart(); binStart(); ixLiveTick(); } catch (e) {} }
  const s = $('#set_mktLive'); if (s) s.value = SET.mktLive || '1';
  try { if (tab === 'home') renderMarket(); } catch (e) {}
  if (!quiet) toast(t(SET.mktLive === '0' ? 'mk_offDone' : 'mk_onDone'));
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_mktLive'){ SET.mktLive = e.target.value === '0' ? '0' : '1'; saveSet(); mktApply(); } });
const ixBoard75 = ixBoard;
ixBoard = function(){
  const r = ixBoard75.apply(this, arguments);
  const ext = $('#hmx'); if (!ext) return r;
  const off = SET.mktLive === '0';
  if (off) $$('.ix-g .lv-pill', ext).forEach(p => p.remove());
  const g = $$('.ix-g', ext)[1];
  if (g && !$('.mk-mode', g)) g.insertAdjacentHTML('beforeend', ` <button type="button" class="mk-mode${off ? ' off' : ''}" id="mkt_tog" aria-pressed="${!off}">${asEsc(t(off ? 'mk_isOff' : 'mk_isOn'))}</button>`);
  return r;
};
document.addEventListener('click', e => { if (e.target.closest('#mkt_tog')){ SET.mktLive = SET.mktLive === '0' ? '1' : '0'; saveSet(); mktApply(); } });
if (SET.mktLive === '0') mktApply(true);

/* ---------- every Jewish and Christian holiday has its own theme ---------- */
const HOL_NEW = {
  yomkippur: mkSkin({group:'j', mode:'light', bg:'#F4F6FA', surface:'#FFFFFF', ink:'#1A2233', ink2:'#5E6B80', line:'rgba(26,34,51,.12)', navy:'#2B3A55', onNavy:'#F4F7FC', onNavy2:'#C2CCDD', acc:'#C9D4E8', accText:'#2F4A7A', heroVal:'#2F4A7A', heroTint:'rgba(47,74,122,.10)', heroBd:'rgba(47,74,122,.26)', c:['#2F4A7A','#8A9BB8','#C8A24A','#5E8C7A'],
    rail:'linear-gradient(180deg,#33456A,#222F48)', hh:'radial-gradient(160px 120px at 82% 18%,rgba(255,255,255,.95),transparent 70%),linear-gradient(135deg,#FFFFFF,#E3E9F3 60%,#CBD6E8)', hhBd:'rgba(47,74,122,.28)', hhL:'#3A4A66', hhV:'#22345A', hhS:'#5E6B80', bottom:'rgba(34,47,72,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(201,212,232,.55),transparent 60%),#F4F6FA'}),
  sukkot: mkSkin({group:'j', mode:'light', bg:'#F3F6E8', surface:'#FFFFFF', ink:'#1F2A12', ink2:'#5D6A48', line:'rgba(31,42,18,.13)', navy:'#2F5A1E', onNavy:'#F1F8E6', onNavy2:'#BFD6A6', acc:'#E8C547', accText:'#3E7A22', heroVal:'#3E7A22', heroTint:'rgba(62,122,34,.12)', heroBd:'rgba(62,122,34,.30)', c:['#3E7A22','#D9A82B','#8C5A2B','#2E7FA0'],
    rail:'linear-gradient(180deg,#3B6B26,#244516)', hh:'repeating-linear-gradient(100deg,rgba(40,70,20,.22) 0 3px,transparent 3px 15px),radial-gradient(70px 70px at 84% 26%,rgba(255,226,92,.75),transparent 70%),linear-gradient(135deg,#7DB247,#3E7A22 55%,#2A5617)', hhBd:'rgba(232,197,71,.55)', hhL:'#EAF5D8', hhV:'#FFF0A6', hhS:'#CFE5B0', bottom:'rgba(36,69,22,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(232,197,71,.18),transparent 60%),#F3F6E8'}),
  simchattorah: mkSkin({group:'j', mode:'dark', bg:'#0B1636', surface:'#13214A', field:'#0F1B40', ink:'#F1F5FF', ink2:'#A8B6DA', line:'rgba(241,245,255,.10)', navy:'#070F28', onNavy:'#F1F5FF', onNavy2:'#A8B6DA', acc:'#FFD166', heroVal:'#FFD166', heroTint:'rgba(255,209,102,.16)', heroBd:'rgba(255,209,102,.38)', c:['#FFD166','#5DADEC','#EF6F6C','#7BD389'],
    rail:'linear-gradient(180deg,#10204D,#070F28)', hh:'linear-gradient(115deg,transparent 0 62%,rgba(255,209,102,.30) 62% 66%,transparent 66% 72%,rgba(93,173,236,.30) 72% 76%,transparent 76%),radial-gradient(circle at 20% 30%,#FFD166 0 2px,transparent 2.6px),radial-gradient(circle at 44% 70%,#EF6F6C 0 2px,transparent 2.6px),linear-gradient(135deg,#2449A8,#16307A 55%,#0E1F55)', hhBd:'rgba(255,209,102,.5)', hhL:'#D6E2FF', hhV:'#FFE29A', hhS:'#AFC1EA', bottom:'rgba(7,15,40,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(255,209,102,.12),transparent 60%),#0B1636'}),
  tubishvat: mkSkin({group:'j', mode:'light', bg:'#F6F3EE', surface:'#FFFFFF', ink:'#2A2218', ink2:'#6B6152', line:'rgba(42,34,24,.12)', navy:'#4E6B2E', onNavy:'#F3F8EA', onNavy2:'#C8D9AE', acc:'#F2B8C6', accText:'#5B7F2E', heroVal:'#5B7F2E', heroTint:'rgba(229,143,166,.16)', heroBd:'rgba(91,127,46,.30)', c:['#5B7F2E','#E58FA6','#B07A3B','#3F8FA6'],
    rail:'linear-gradient(180deg,#5A7A36,#3E5622)', hh:'radial-gradient(circle at 18% 30%,#fff 0 3px,transparent 3.6px),radial-gradient(circle at 34% 64%,#fff 0 2.4px,transparent 3px),radial-gradient(circle at 70% 24%,#fff 0 2.8px,transparent 3.4px),radial-gradient(circle at 86% 60%,#fff 0 2.2px,transparent 2.8px),linear-gradient(135deg,#FCE4EA,#F6C9D4 50%,#E8A9B9)', hhBd:'rgba(91,127,46,.35)', hhL:'#6A3A4A', hhV:'#4E6B2E', hhS:'#7A5060', bottom:'rgba(62,86,34,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(242,184,198,.30),transparent 60%),#F6F3EE'}),
  purim: mkSkin({group:'j', mode:'dark', bg:'#1A0F2E', surface:'#261843', field:'#20133A', ink:'#FFF4FB', ink2:'#C9B6E3', line:'rgba(255,244,251,.10)', navy:'#110A20', onNavy:'#FFF4FB', onNavy2:'#C9B6E3', acc:'#FF9F43', heroVal:'#FFC857', heroTint:'rgba(255,159,67,.18)', heroBd:'rgba(255,200,87,.40)', c:['#FFC857','#FF5C8A','#5CE1E6','#9BE15D'],
    rail:'linear-gradient(180deg,#22143B,#110A20)', hh:'radial-gradient(circle at 12% 22%,#FFC857 0 2.4px,transparent 3px),radial-gradient(circle at 28% 74%,#5CE1E6 0 2.4px,transparent 3px),radial-gradient(circle at 48% 30%,#9BE15D 0 2px,transparent 2.6px),radial-gradient(circle at 66% 66%,#FFF 0 2px,transparent 2.6px),radial-gradient(circle at 88% 28%,#FF5C8A 0 2.6px,transparent 3.2px),linear-gradient(135deg,#7B2FF7,#C2185B 60%,#FF6F00)', hhBd:'rgba(255,200,87,.55)', hhL:'#FFE3F1', hhV:'#FFE29A', hhS:'#F4C6E0', bottom:'rgba(17,10,32,.93)', body:'radial-gradient(rgba(255,200,87,.10) 1.5px,transparent 2px) 0 0/30px 30px,radial-gradient(900px 480px at 80% -10%,rgba(194,24,91,.18),transparent 60%),#1A0F2E'}),
  atzmaut: mkSkin({group:'j', mode:'light', bg:'#EEF4FF', surface:'#FFFFFF', ink:'#0E1F45', ink2:'#4A5B80', line:'rgba(14,31,69,.12)', navy:'#0038B8', onNavy:'#FFFFFF', onNavy2:'#C6D6FF', acc:'#8FB4FF', accText:'#0038B8', heroVal:'#0038B8', heroTint:'rgba(0,56,184,.10)', heroBd:'rgba(0,56,184,.30)', c:['#0038B8','#4C8DFF','#F2B33D','#2EAD7A'],
    rail:'linear-gradient(180deg,#0A45C8,#002B8F)', hh:'linear-gradient(180deg,#FFFFFF 0 14%,#0038B8 14% 22%,#FFFFFF 22% 78%,#0038B8 78% 86%,#FFFFFF 86%)', hhBd:'rgba(0,56,184,.35)', hhL:'#22408A', hhV:'#0038B8', hhS:'#4A5B80', bottom:'rgba(0,43,143,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(76,141,255,.16),transparent 60%),#EEF4FF'}),
  lagbaomer: mkSkin({group:'j', mode:'dark', bg:'#140A06', surface:'#22120A', field:'#1B0E08', ink:'#FFF3E8', ink2:'#D7B49A', line:'rgba(255,243,232,.10)', navy:'#0D0603', onNavy:'#FFF3E8', onNavy2:'#D7B49A', acc:'#FF8A3D', heroVal:'#FFB347', heroTint:'rgba(255,138,61,.20)', heroBd:'rgba(255,138,61,.40)', c:['#FF8A3D','#FFD166','#E4572E','#7CC6FE'],
    rail:'linear-gradient(180deg,#24120A,#0D0603)', hh:'radial-gradient(150px 120px at 50% 118%,rgba(255,170,60,.85),transparent 70%),radial-gradient(90px 80px at 50% 100%,rgba(255,230,120,.7),transparent 70%),linear-gradient(160deg,#3A1A0C,#1F0E06)', hhBd:'rgba(255,138,61,.5)', hhL:'#FFD9BF', hhV:'#FFE0A3', hhS:'#E8B898', bottom:'rgba(13,6,3,.93)', body:'radial-gradient(800px 420px at 50% 110%,rgba(255,138,61,.16),transparent 60%),#140A06'}),
  yomyerushalayim: mkSkin({group:'j', mode:'light', bg:'#F6EFE2', surface:'#FFFDF8', ink:'#2E2414', ink2:'#6E5F45', line:'rgba(46,36,20,.13)', navy:'#6B5226', onNavy:'#FBF4E6', onNavy2:'#E0CDA6', acc:'#D9B26A', accText:'#8A6420', heroVal:'#8A6420', heroTint:'rgba(217,178,106,.18)', heroBd:'rgba(138,100,32,.30)', c:['#8A6420','#2F6E9E','#B5523B','#5E8C4A'],
    rail:'linear-gradient(180deg,#7A5E2C,#55401C)', hh:'linear-gradient(0deg,rgba(120,90,40,.16) 1px,transparent 1px) 0 0/100% 18px,linear-gradient(90deg,rgba(120,90,40,.12) 1px,transparent 1px) 0 0/36px 18px,radial-gradient(120px 80px at 84% 20%,rgba(255,236,190,.9),transparent 70%),linear-gradient(135deg,#F3E2BE,#E2C68E)', hhBd:'rgba(138,100,32,.35)', hhL:'#6E5022', hhV:'#5A3E12', hhS:'#7A6440', bottom:'rgba(85,64,28,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(217,178,106,.22),transparent 60%),#F6EFE2'}),
  shavuot: mkSkin({group:'j', mode:'light', bg:'#F7F5EA', surface:'#FFFFFF', ink:'#262414', ink2:'#6A6650', line:'rgba(38,36,20,.12)', navy:'#3F6B3A', onNavy:'#F4FAEE', onNavy2:'#C3D9B6', acc:'#F0C75E', accText:'#4D7A2E', heroVal:'#4D7A2E', heroTint:'rgba(240,199,94,.18)', heroBd:'rgba(77,122,46,.30)', c:['#4D7A2E','#E0A93A','#E07A8F','#4A8FC2'],
    rail:'linear-gradient(180deg,#4A7A44,#2F5229)', hh:'repeating-linear-gradient(75deg,rgba(190,140,40,.22) 0 2px,transparent 2px 12px),radial-gradient(circle at 80% 30%,#F59AB0 0 5px,transparent 5.6px),radial-gradient(circle at 90% 62%,#FFFFFF 0 4px,transparent 4.6px),linear-gradient(135deg,#FFF7D6,#F3E3A1 55%,#E7CC72)', hhBd:'rgba(77,122,46,.35)', hhL:'#6A5520', hhV:'#3F6B3A', hhS:'#7A6830', bottom:'rgba(47,82,41,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(240,199,94,.20),transparent 60%),#F7F5EA'}),
  tubeav: mkSkin({group:'j', mode:'dark', bg:'#1E0E18', surface:'#2D1524', field:'#25111E', ink:'#FFF0F6', ink2:'#DDB0C4', line:'rgba(255,240,246,.10)', navy:'#150910', onNavy:'#FFF0F6', onNavy2:'#DDB0C4', acc:'#FF7AA8', heroVal:'#FFB3CF', heroTint:'rgba(255,122,168,.18)', heroBd:'rgba(255,122,168,.40)', c:['#FF7AA8','#F5F0E6','#C77DFF','#FFD27A'],
    rail:'linear-gradient(180deg,#2A1220,#150910)', hh:'radial-gradient(circle at 80% 26%,rgba(255,255,255,.9) 0 10px,transparent 10.6px),radial-gradient(160px 110px at 18% 100%,rgba(255,122,168,.45),transparent 70%),linear-gradient(135deg,#B8326A,#7A1C46 55%,#3E0C24)', hhBd:'rgba(255,179,207,.5)', hhL:'#FFD3E4', hhV:'#FFFFFF', hhS:'#F0B7CD', bottom:'rgba(21,9,16,.93)', body:'radial-gradient(900px 480px at 80% -10%,rgba(255,122,168,.16),transparent 60%),#1E0E18'}),
  advent: mkSkin({group:'c', mode:'dark', bg:'#140C22', surface:'#201335', field:'#1A0F2C', ink:'#F6F0FF', ink2:'#B9A9D6', line:'rgba(246,240,255,.10)', navy:'#0D0718', onNavy:'#F6F0FF', onNavy2:'#B9A9D6', acc:'#C9A3FF', heroVal:'#FFD27A', heroTint:'rgba(201,163,255,.18)', heroBd:'rgba(201,163,255,.38)', c:['#C9A3FF','#FFD27A','#E8798B','#7FD1B9'],
    rail:'linear-gradient(180deg,#1E1233,#0D0718)', hh:[20, 40, 60, 80].map(x => 'radial-gradient(7px 12px at ' + x + '% 80%,rgba(255,214,130,.95),transparent 75%)').join(',') + ',linear-gradient(135deg,#4B2A7A,#2E1A50 55%,#1C1033)', hhBd:'rgba(201,163,255,.45)', hhL:'#E6D8FF', hhV:'#FFE3A6', hhS:'#C8B6E8', bottom:'rgba(13,7,24,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(201,163,255,.14),transparent 60%),#140C22'}),
  epiphany: mkSkin({group:'c', mode:'dark', bg:'#0A1024', surface:'#121B3A', field:'#0E1630', ink:'#F3F5FF', ink2:'#A7B0D6', line:'rgba(243,245,255,.10)', navy:'#060B1A', onNavy:'#F3F5FF', onNavy2:'#A7B0D6', acc:'#F4C95D', heroVal:'#F4C95D', heroTint:'rgba(244,201,93,.16)', heroBd:'rgba(244,201,93,.38)', c:['#F4C95D','#9AB6FF','#E07A5F','#81C995'],
    rail:'linear-gradient(180deg,#101A3A,#060B1A)', hh:'radial-gradient(circle at 82% 22%,#FFF6D6 0 4px,rgba(244,201,93,.6) 5px,transparent 26px),linear-gradient(118deg,transparent 0 60%,rgba(244,201,93,.18) 60% 63%,transparent 63%),linear-gradient(160deg,#1E2C66,#101A40)', hhBd:'rgba(244,201,93,.5)', hhL:'#D2DAFF', hhV:'#FFE29A', hhS:'#AFB8E0', bottom:'rgba(6,11,26,.93)', body:'radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.5px) 0 0/30px 30px,#0A1024'}),
  valentine: mkSkin({group:'c', mode:'light', bg:'#FFF1F4', surface:'#FFFFFF', ink:'#3A1020', ink2:'#7E5363', line:'rgba(58,16,32,.12)', navy:'#A0123E', onNavy:'#FFF0F4', onNavy2:'#F6BCCB', acc:'#FF8FAB', accText:'#C2185B', heroVal:'#C2185B', heroTint:'rgba(194,24,91,.10)', heroBd:'rgba(194,24,91,.28)', c:['#C2185B','#FF8FAB','#7B2D8E','#F2A541'],
    rail:'linear-gradient(180deg,#B3164A,#8A0F35)', hh:'radial-gradient(circle at 84% 24%,rgba(255,255,255,.85) 0 9px,transparent 9.6px),linear-gradient(135deg,#FFD1DC,#FF9EB5 55%,#F06292)', hhBd:'rgba(194,24,91,.35)', hhL:'#7A1236', hhV:'#5E0A28', hhS:'#8A3A55', bottom:'rgba(138,15,53,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(255,143,171,.22),transparent 60%),#FFF1F4'}),
  palmsunday: mkSkin({group:'c', mode:'light', bg:'#EFF6EC', surface:'#FFFFFF', ink:'#17301C', ink2:'#4F6A55', line:'rgba(23,48,28,.12)', navy:'#1F5A35', onNavy:'#F0F9F2', onNavy2:'#B5D8BE', acc:'#9CCC65', accText:'#2E7D32', heroVal:'#2E7D32', heroTint:'rgba(46,125,50,.12)', heroBd:'rgba(46,125,50,.30)', c:['#2E7D32','#C0A050','#5C8DBF','#B45F4A'],
    rail:'linear-gradient(180deg,#24683D,#16452A)', hh:'repeating-linear-gradient(60deg,rgba(255,255,255,.14) 0 2px,transparent 2px 10px),repeating-linear-gradient(-60deg,rgba(255,255,255,.10) 0 2px,transparent 2px 10px),linear-gradient(135deg,#7CC47F,#43A047 55%,#2E7D32)', hhBd:'rgba(46,125,50,.40)', hhL:'#F1FAEE', hhV:'#FFFFFF', hhS:'#E3F2DD', bottom:'rgba(22,69,42,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(156,204,101,.22),transparent 60%),#EFF6EC'}),
  ascension: mkSkin({group:'c', mode:'light', bg:'#EEF6FD', surface:'#FFFFFF', ink:'#102A43', ink2:'#4B637A', line:'rgba(16,42,67,.12)', navy:'#1E4E79', onNavy:'#F0F7FE', onNavy2:'#B8D3EC', acc:'#FFD27A', accText:'#1F6FB2', heroVal:'#1F6FB2', heroTint:'rgba(31,111,178,.10)', heroBd:'rgba(31,111,178,.28)', c:['#1F6FB2','#E8B04A','#69B7A8','#B47EDE'],
    rail:'linear-gradient(180deg,#245C8E,#173F63)', hh:'radial-gradient(110px 46px at 22% 70%,rgba(255,255,255,.9),transparent 70%),radial-gradient(90px 40px at 60% 82%,rgba(255,255,255,.8),transparent 70%),radial-gradient(120px 120px at 84% 10%,rgba(255,225,150,.9),transparent 70%),linear-gradient(180deg,#BFE3FF,#8CC8F5 60%,#5FA8E0)', hhBd:'rgba(31,111,178,.35)', hhL:'#0F3A63', hhV:'#0B2E52', hhS:'#24527E', bottom:'rgba(23,63,99,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(255,210,122,.20),transparent 60%),#EEF6FD'}),
  pentecost: mkSkin({group:'c', mode:'dark', bg:'#1C0808', surface:'#2B0F0F', field:'#230B0B', ink:'#FFF2EC', ink2:'#D9AFA2', line:'rgba(255,242,236,.10)', navy:'#120404', onNavy:'#FFF2EC', onNavy2:'#D9AFA2', acc:'#FF6B3D', heroVal:'#FFB15C', heroTint:'rgba(255,107,61,.18)', heroBd:'rgba(255,107,61,.40)', c:['#FF6B3D','#FFD166','#F25C78','#6CC4E8'],
    rail:'linear-gradient(180deg,#2A0C0C,#120404)', hh:[16, 38, 60, 82].map(x => 'radial-gradient(9px 18px at ' + x + '% 34%,rgba(255,190,90,.95),transparent 75%)').join(',') + ',linear-gradient(160deg,#C0392B,#7B1E1E 55%,#3A0B0B)', hhBd:'rgba(255,177,92,.5)', hhL:'#FFD8C8', hhV:'#FFE0A6', hhS:'#EDB8A6', bottom:'rgba(18,4,4,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(255,107,61,.14),transparent 60%),#1C0808'}),
  assumption: mkSkin({group:'c', mode:'light', bg:'#F0F5FC', surface:'#FFFFFF', ink:'#14254A', ink2:'#55678C', line:'rgba(20,37,74,.12)', navy:'#2A4C8C', onNavy:'#F2F6FD', onNavy2:'#BFD0EE', acc:'#9EC1F0', accText:'#2A5DB0', heroVal:'#2A5DB0', heroTint:'rgba(42,93,176,.10)', heroBd:'rgba(42,93,176,.28)', c:['#2A5DB0','#D4AF37','#7FB3D5','#C06C84'],
    rail:'linear-gradient(180deg,#30569C,#1F3C70)', hh:'radial-gradient(130px 110px at 80% 20%,rgba(255,255,255,.95),transparent 70%),radial-gradient(circle at 80% 20%,transparent 0 40px,rgba(212,175,55,.35) 41px 43px,transparent 44px),linear-gradient(135deg,#DCE9FA,#B3CDF2 55%,#86AEE6)', hhBd:'rgba(42,93,176,.35)', hhL:'#1E3B70', hhV:'#14305E', hhS:'#3A5684', bottom:'rgba(31,60,112,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(158,193,240,.30),transparent 60%),#F0F5FC'}),
  allsaints: mkSkin({group:'c', mode:'dark', bg:'#160F14', surface:'#241820', field:'#1D131A', ink:'#FBF2EA', ink2:'#C7B0A4', line:'rgba(251,242,234,.10)', navy:'#0E090C', onNavy:'#FBF2EA', onNavy2:'#C7B0A4', acc:'#E9A84B', heroVal:'#F2C46B', heroTint:'rgba(233,168,75,.18)', heroBd:'rgba(233,168,75,.38)', c:['#E9A84B','#B784C9','#E06C5A','#7FBFA0'],
    rail:'linear-gradient(180deg,#22161E,#0E090C)', hh:CANDLES + ',linear-gradient(160deg,#4A2638,#2A1520)', hhBd:'rgba(233,168,75,.5)', hhL:'#F0D9CB', hhV:'#FFE0A6', hhS:'#D4B8AA', bottom:'rgba(14,9,12,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(233,168,75,.12),transparent 60%),#160F14'})
};
Object.assign(SKINS, HOL_NEW);
['yomkippur', 'sukkot', 'simchattorah', 'tubishvat', 'purim', 'atzmaut', 'lagbaomer', 'yomyerushalayim', 'shavuot', 'tubeav'].forEach(k => { if (!SKIN_HOL.j.includes(k)) SKIN_HOL.j.push(k); });
['advent', 'epiphany', 'valentine', 'palmsunday', 'ascension', 'pentecost', 'assumption', 'allsaints'].forEach(k => { if (!SKIN_HOL.c.includes(k)) SKIN_HOL.c.push(k); });
(function(){
  let css = ''; for (const k in HOL_NEW){ css += ':root[data-skin="' + k + '"]{' + Object.entries(HOL_NEW[k].t).map(([p, v]) => p + ':' + v).join(';') + '}\n'; }
  const st = document.createElement('style'); st.id = 'skin-css-75'; st.textContent = css; document.head.appendChild(st);
})();
const holidayNow75 = holidayNow;
holidayNow = function(d){
  const pick = SET.holAuto; if (!pick || pick === '0') return '';
  d = d || new Date();
  const on = g => pick === 'all' || pick === g, he = holHeb(d), mo = d.getMonth() + 1, da = d.getDate(), y = d.getFullYear();
  const inH = segs => he && segs.some(([m, a, b]) => he[0] === m && he[1] >= a && he[1] <= b);
  const day = new Date(y, mo - 1, da), off = (e, a, b) => { const x = Math.round((day - new Date(e.getFullYear(), e.getMonth(), e.getDate())) / 864e5); return x >= a && x <= b; };
  if (on('jewish')){
    if (inH([['Tishri', 9, 10]])) return 'yomkippur';
    if (inH([['Tishri', 14, 21]])) return 'sukkot';
    if (inH([['Tishri', 22, 23]])) return 'simchattorah';
    if (inH([['Shevat', 13, 15]])) return 'tubishvat';
    if (inH([['Adar', 11, 15], ['Adar II', 11, 15]])) return 'purim';
    if (inH([['Iyar', 3, 6]])) return 'atzmaut';
    if (inH([['Iyar', 17, 18]])) return 'lagbaomer';
    if (inH([['Iyar', 27, 28]])) return 'yomyerushalayim';
    if (inH([['Sivan', 4, 7]])) return 'shavuot';
    if (inH([['Av', 14, 15]])) return 'tubeav';
  }
  if (on('christian')){
    const ew = easterW(y), eo = easterO(y);
    const adv = (() => { const c = new Date(y, 11, 25); const s = new Date(c); s.setDate(c.getDate() - ((c.getDay() + 7) % 7 || 7) - 21); return s; })();
    if (mo === 1 && da === 6) return 'epiphany';
    if (mo === 2 && (da === 13 || da === 14)) return 'valentine';
    if (off(ew, -7, -6) || off(eo, -7, -6)) return 'palmsunday';
    if (off(ew, 39, 40)) return 'ascension';
    if (off(ew, 49, 50)) return 'pentecost';
    if (mo === 8 && (da === 14 || da === 15)) return 'assumption';
    if ((mo === 10 && da === 31) || (mo === 11 && da <= 2)) return 'allsaints';
    if (day >= adv && mo === 12 && da <= 9) return 'advent';
    if (mo === 11 && day >= adv) return 'advent';
  }
  return holidayNow75.apply(this, arguments);
};
try { applyTheme(); skRender(); } catch (e) {}

/* ---------- AI: free questions go to outside AI models that need no account; exact things stay in the app ---------- */
Object.assign(XAI, {
  claude: {n: 'Claude', max: 1500, u: q => 'https://claude.ai/new?q=' + encodeURIComponent(q)},
  grok: {n: 'Grok', max: 1100, u: q => 'https://grok.com/?q=' + encodeURIComponent(q)},
  lechat: {n: 'Le Chat', max: 1100, u: q => 'https://chat.mistral.ai/chat?q=' + encodeURIComponent(q)},
  you: {n: 'You.com', max: 600, u: q => 'https://you.com/search?tbm=youchat&q=' + encodeURIComponent(q)}
});
var XAI_ORDER = ['chatgpt', 'claude', 'perplexity', 'copilot', 'googleai', 'grok', 'lechat', 'duck', 'you'];
xaiEngine = function(){ const e = SET.aiEngine; return XAI[e] ? e : 'chatgpt'; };
xaiOpts = function(){ return XAI_ORDER.filter(k => XAI[k]).map(k => `<option value="${k}"${xaiEngine() === k ? ' selected' : ''}>${asEsc(XAI[k].n)}</option>`).join(''); };
xaiRow = function(q, id){
  const P = k => XAI[k].u(xaiPrompt(k, q, id).short);
  return `<div class="xai-row"><span>${asEsc(t('xai_more'))}</span>${XAI_ORDER.filter(k => XAI[k]).map(k => `<a class="xai-b" href="${asEsc(P(k))}" target="_blank" rel="noopener noreferrer" data-xai="${k}" data-q="${asEsc(q)}">${asEsc(XAI[k].n)} ↗</a>`).join('')}</div>`;
};
/* in-app answers only for what the app knows exactly: calculations, live figures, your own results, which calculator fits */
pmLocalSync = function(raw, screen){
  raw = String(raw || '').trim(); if (!raw) return null;
  const n = pmNorm(raw), def = pmIsDef(raw), hasNum = /\d/.test(raw);
  if (PM_RX.thanks.test(n) && n.trim().split(' ').length <= 4) return t('pm_thanks');
  if (PM_RX.greet.test(n) && n.trim().split(' ').length <= 3) return t('xai_hello');
  PMX.fu = false;
  if (!def || hasNum) for (const sk of PM_SKILLS){ try { const a = sk(n, raw); if (a) return a; } catch (e) {} }
  if (/^\s*(ו|ומה|ואם|ואז|אז|and|what if|what about|و)/i.test(raw) || raw.split(/\s+/).length <= 4){
    PMX.fu = true;
    try { for (const sk of PM_SKILLS.filter(f => f.name === 'loan' || f.name === 'grow')){ const a = sk(n, raw); if (a){ PMX.fu = false; return a; } } } catch (e) {}
    PMX.fu = false;
  }
  if (PM_RX.res.test(n) && (screen || PM_LASTCALC) && !def) return pmResults(screen && !['home', 'settings', 'assist', 'saved'].includes(screen) ? screen : PM_LASTCALC);
  if (pmWantsCalc(raw)){ const cs = pmCalcs(raw).slice(0, 3); if (cs.length) return t('pm_calcFit') + '\n' + cs.map(id => '[[' + id + ']] ' + t('d_' + id)).join('\n'); }
  return null;
};
const aiAsk75 = aiAsk;
aiAsk = async function(q, kind){
  if (kind === 'explain' || kind === 'improve'){
    q = String(q || '').trim(); if (!q || AIX.busy) return;
    const eng = xaiEngine(), id = tab;
    aiLog('user', q);
    const ask = (kind === 'explain' ? t('xai_askExplain') : t('xai_askImprove')) + ' ' + t('tab_' + id);
    const url = xaiOpen(eng, ask, id);
    aiLog('ai', '', `<p>${asEsc(t('xai_opened', {n: XAI[eng].n}))}</p><p class="fine">${asEsc(t('xai_sentCtx'))}</p><p><a class="xai-b" href="${asEsc(url)}" target="_blank" rel="noopener noreferrer">${asEsc(t('xai_openIn', {n: XAI[eng].n}))} ↗</a></p>` + xaiRow(ask, id));
    return;
  }
  return aiAsk75.apply(this, arguments);
};
const pmLinkify75 = pmLinkify;
pmLinkify = function(h){
  return pmLinkify75(h).replace(/(https:\/\/(?:claude\.ai\/new|grok\.com\/|chat\.mistral\.ai\/chat|you\.com\/search)[^\s<"]*)/g, u => {
    const k = /claude/.test(u) ? 'claude' : /grok/.test(u) ? 'grok' : /mistral/.test(u) ? 'lechat' : 'you';
    return `<a class="xai-b" href="${u}" target="_blank" rel="noopener noreferrer">${asEsc(t('xai_openIn', {n: XAI[k].n}))} ↗</a>`;
  });
};
const engRender75 = engRender;
engRender = function(){ const r = engRender75.apply(this, arguments); const s = $('#set_aiEngine'); if (s){ s.innerHTML = xaiOpts(); } return r; };
try { if (!XAI[SET.aiEngine]){ SET.aiEngine = 'chatgpt'; saveSet(); } engRender(); aiEngSync(); } catch (e) {}

/* ---------- never keep personal identifiers: ID numbers, card numbers, bank accounts ---------- */
function piiLuhn(d){ let s = 0, alt = false; for (let i = d.length - 1; i >= 0; i--){ let n = +d[i]; if (alt){ n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; } return s % 10 === 0; }
function piiIlId(d){ if (!/^\d{8,9}$/.test(d)) return false; d = d.padStart(9, '0'); let s = 0; for (let i = 0; i < 9; i++){ let n = +d[i] * ((i % 2) + 1); if (n > 9) n -= 9; s += n; } return s % 10 === 0 && !/^(\d)\1+$/.test(d); }
function piiIn(str, numOnly){
  const s = String(str == null ? '' : str); if (!/\d{4}/.test(s.replace(/[\s-]/g, ''))) return '';
  for (const c of (s.match(/(?:\d[ -]?){13,19}/g) || [])){ const d = c.replace(/\D/g, ''); if (d.length >= 13 && d.length <= 19 && piiLuhn(d)) return 'card'; }
  if (numOnly) return '';
  if (/\bIL\s?\d{2}(?:[\s-]?\d){19}\b/i.test(s)) return 'iban';
  const idRx = /(^|[^\d.,])(\d{8,9})(?![\d.,])/g; let mm;
  while ((mm = idRx.exec(s))) if (piiIlId(mm[2])) return 'id';
  if (/(ת[\"״'׳]?ז|ת\.ז\.?|תעודת\s*זהות|מספר\s*זהות|דרכון|passport|cvv|cvc|\bid\s*(?:no|number|#)|رقم\s*الهوية|هوية|جواز)/i.test(s) && /\d{5,}/.test(s.replace(/[\s-]/g, ''))) return 'id';
  if (/(חשבון\s*בנק|מספר\s*חשבון|account\s*(?:no|number)|רישיון\s*נהיגה)/i.test(s) && /\d{5,}/.test(s.replace(/[\s-]/g, ''))) return 'acct';
  return '';
}
const PII_SKIP = /^(set_json|cl_json|mv_txt|mv_code_in|mv_pw|rc_|dev_|dc_|gh_|acc_|ln_u|del_|hd_q|fx_|fg_|cs_u|cs_p)/;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.tagName) return;
  if (el.type === 'password' || el.type === 'url' || el.type === 'range' || el.type === 'date' || el.type === 'tel' || el.dataset.piiOk != null || el.classList.contains('srl-u')) return;
  if (el.id && PII_SKIP.test(el.id)) return;
  const isText = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|email|number|)$/.test(el.type || ''));
  if (!isText) return;
  const kind = piiIn(el.value, el.type === 'number' || /decimal|numeric/.test(el.inputMode || ''));
  if (!kind) return;
  el.value = '';
  clearTimeout(piiIn.t); piiIn.t = setTimeout(() => toast(t('pii_block')), 30);
}, true);
/* anything saved before is cleaned as well */
(function piiScrub(){
  let ch = false;
  try { Object.keys(SCN || {}).forEach(k => (SCN[k] || []).forEach(s => { if (s && piiIn(s.n)){ s.n = '#'; ch = true; } })); if (ch) saveScn(); } catch (e) {}
  try { const d = expData(); let c2 = false; d.items.forEach(x => { ['note', 'name', 'title'].forEach(f => { if (x && piiIn(x[f])){ x[f] = ''; c2 = true; } }); }); if (c2) toolsSave('fin-exp', d); } catch (e) {}
  try { const d = clData(); let c3 = false; d.clients.forEach(c => { ['name', 'notes', 'tags'].forEach(f => { if (c && piiIn(c[f])){ c[f] = f === 'name' ? '—' : ''; c3 = true; } }); }); if (c3) toolsSave('fin-clients', d); } catch (e) {}
})();

/* ---------- recycle bin: deleted things wait 30 days, then they are gone ---------- */
const TR_MS = 30 * 864e5;
function trashAll(){
  let a = []; try { a = JSON.parse(LS.getItem('fin-trash') || '[]'); } catch (e) {}
  if (!Array.isArray(a)) a = [];
  const now = Date.now(), keep = a.filter(x => x && x.item && x.at && now - x.at < TR_MS);
  if (keep.length !== a.length) trashSet(keep);
  return keep;
}
function trashSet(a){ try { LS.setItem('fin-trash', JSON.stringify(a)); } catch (e) {} if (tab === 'saved') try { svdRender(); } catch (e) {} }
function trashPut(kind, tb, item){
  if (!item) return;
  const a = trashAll(); a.unshift({id: tId(), kind, tab: tb, item: JSON.parse(JSON.stringify(item)), at: Date.now()}); trashSet(a.slice(0, 500));
}
function trashRestore(id){
  const a = trashAll(), i = a.findIndex(x => x.id === id); if (i < 0) return;
  const x = a[i];
  if (x.kind === 'scn'){ (SCN[x.tab] = SCN[x.tab] || []).push(x.item); saveScn(); try { renderScn(x.tab); } catch (e) {} }
  else if (x.kind === 'exp'){ expData().items.push(x.item); toolsSave('fin-exp', EXP); }
  else if (x.kind === 'cl'){ clData().clients.push(x.item); toolsSave('fin-clients', CL); }
  a.splice(i, 1); trashSet(a); toast(t('svd_restored'));
}
/* a saved scenario that is deleted goes to the bin */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sc="del"]'); if (!b) return;
  const box = b.closest('.scn'), row = b.closest('.scn-row'); if (!box || !row) return;
  e.stopPropagation(); e.preventDefault();
  const id = box.dataset.tab, i = +row.dataset.i, list = SCN[id] || [];
  if (!list[i]) return;
  trashPut('scn', id, list[i]); list.splice(i, 1); saveScn(); renderScn(id); toast(t('svd_toTrash'));
}, true);
const saveScenario75 = saveScenario;
saveScenario = function(id){
  const n0 = (SCN[id] || []).length; const r = saveScenario75.apply(this, arguments);
  const L = SCN[id] || []; if (L.length > n0){ L[L.length - 1].at = Date.now(); saveScn(); toast(t('svd_savedIn', {c: t('tab_' + id)})); }
  return r;
};
const svClearScreen75 = svClearScreen;
svClearScreen = function(id){
  const k = svKind(id);
  if (k === 'calc') (SCN[id] || []).forEach(s => trashPut('scn', id, s));
  else if (k === 'exp') expData().items.forEach(x => trashPut('exp', 'expenses', x));
  else if (k === 'cl') clData().clients.forEach(c => trashPut('cl', 'clients', c));
  return svClearScreen75.apply(this, arguments);
};
function trashEverything(){
  Object.keys(SCN || {}).forEach(id => (SCN[id] || []).forEach(s => trashPut('scn', id, s)));
  try { expData().items.forEach(x => trashPut('exp', 'expenses', x)); } catch (e) {}
  try { clData().clients.forEach(c => trashPut('cl', 'clients', c)); } catch (e) {}
}
const svClearAll75 = svClearAll;
svClearAll = function(){ trashEverything(); return svClearAll75.apply(this, arguments); };
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#set_clear')) trashEverything(); }, true);
const svKind75 = svKind;
svKind = function(id){ return id === 'saved' ? '' : svKind75.apply(this, arguments); };

/* ---------- the Saved folder ---------- */
var SVD = {view: 'all', q: '', ren: null, sure: '', edit: null};
const svdDate = ms => { try { return new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).format(new Date(ms)); } catch (e) { return ''; } };
function svdCats(){
  const q = SVD.q.trim().toLowerCase(), out = [];
  TABS.forEach(id => {
    const L = (SCN[id] || []).map((s, i) => ({s, i})).filter(({s}) => !q || (String(s.n) + ' ' + (s.note || '') + ' ' + t('tab_' + id)).toLowerCase().includes(q));
    if (L.length) out.push({id, items: L});
  });
  return out;
}
function svdRender(){
  const box = $('#svd_root'); if (!box) return;
  const E = asEsc, bin = trashAll(), cats = svdCats();
  const nItems = Object.keys(SCN || {}).reduce((s, k) => s + (SCN[k] || []).length, 0);
  const exN = (() => { try { return expData().items.length; } catch (e) { return 0; } })(), clN = (() => { try { return clData().clients.length; } catch (e) { return 0; } })();
  let h = `<div class="svd-top"><p class="fine">${E(t('svd_intro'))}</p>
    <div class="seg svd-tabs" role="group"><button type="button" data-svdv="all" aria-pressed="${SVD.view === 'all'}">${E(t('svd_tabAll'))} · ${nItems}</button><button type="button" data-svdv="bin" aria-pressed="${SVD.view === 'bin'}">🗑️ ${E(t('svd_tabBin'))} · ${bin.length}</button></div></div>`;
  if (SVD.view === 'all'){
    h += `<input id="svd_q" type="search" class="cl-q" autocomplete="off" placeholder="${E(t('svd_search'))}" value="${E(SVD.q)}" data-pii-ok>`;
    if (!cats.length) h += `<div class="svd-empty"><b>${E(t(SVD.q ? 'svd_noMatch' : 'svd_empty'))}</b><p class="fine">${E(t('svd_howTo'))}</p></div>`;
    cats.forEach(({id, items}) => {
      h += `<section class="svd-cat"><h3 class="svd-ch"><span class="svd-ic">${ICON[id] || ''}</span><span>${E(t('tab_' + id))}</span><small>${items.length}</small><button type="button" class="fg-x" data-svdgo="${id}">${E(t('svd_openCalc'))}</button></h3>`;
      items.forEach(({s, i}) => {
        const key = id + ':' + i, ren = SVD.ren === key;
        h += `<div class="svd-it" data-svdk="${E(key)}">
          <div class="svd-h">${ren ? `<input class="svd-ren lookup" maxlength="40" dir="auto" value="${E(s.n)}" aria-label="${E(t('svd_rename'))}"><button type="button" class="gold-btn" data-svda="renok">${E(t('svd_ok'))}</button>` : `<b class="svd-n">${E(s.n)}</b>`}
            <span class="svd-v num">${E((s.hero && s.hero.value) || '')}</span></div>
          <small class="svd-meta">${E((s.hero && s.hero.label) || '')}${s.at ? ' · ' + E(t('svd_savedAt', {d: svdDate(s.at)})) : ''}${s.up ? ' · ' + E(t('svd_editedAt', {d: svdDate(s.up)})) : ''}</small>
          ${s.note ? `<p class="svd-note">${E(s.note)}</p>` : ''}
          <div class="svd-acts"><button type="button" class="mv" data-svda="open">${E(t('svd_open'))}</button><button type="button" class="mv" data-svda="edit">✏️ ${E(t('svd_edit'))}</button><button type="button" class="mv" data-svda="ren">${E(t('svd_rename'))}</button><button type="button" class="mv" data-svda="note">${E(t('svd_note'))}</button><button type="button" class="mv" data-svda="share">${E(t('b_share'))}</button><button type="button" class="mv danger" data-svda="del">🗑️ ${E(t('svd_del'))}</button></div></div>`;
      });
      h += '</section>';
    });
    if (exN || clN){
      h += `<section class="svd-cat"><h3 class="svd-ch"><span>${E(t('svd_tools'))}</span></h3><div class="svd-tools">`;
      if (exN) h += `<button type="button" class="svd-tool" data-svdgo="expenses"><span class="svd-ic">${ICON.expenses || ''}</span><b>${E(t('tab_expenses'))}</b><small>${E(t('svd_nRec', {n: exN}))}</small></button>`;
      if (clN) h += `<button type="button" class="svd-tool" data-svdgo="clients"><span class="svd-ic">${ICON.clients || ''}</span><b>${E(t('tab_clients'))}</b><small>${E(t('svd_nCl', {n: clN}))}</small></button>`;
      h += '</div></section>';
    }
  } else {
    h += `<p class="fine">${E(t('svd_binIntro'))}</p>`;
    if (!bin.length) h += `<div class="svd-empty"><b>${E(t('svd_binEmpty'))}</b></div>`;
    else h += `<div class="btnrow"><button type="button" class="btn danger" data-svdb="empty">${E(t(SVD.sure === 'empty' ? 'svd_sure' : 'svd_emptyBin'))}</button></div>`;
    bin.forEach(x => {
      const left = Math.max(1, Math.ceil((x.at + TR_MS - Date.now()) / 864e5));
      const name = x.kind === 'scn' ? x.item.n : x.kind === 'exp' ? ((x.item.note || t('ec_' + x.item.cat) || '') + ' · ' + M(+x.item.amt || 0, 2, x.item.cur || expCur())) : x.item.name;
      const cat = x.kind === 'scn' ? t('tab_' + x.tab) : t(x.kind === 'exp' ? 'tab_expenses' : 'tab_clients');
      h += `<div class="svd-it bin" data-trid="${E(x.id)}"><div class="svd-h"><b class="svd-n">${E(name || '—')}</b><span class="svd-cat-t">${E(cat)}</span></div>
        <small class="svd-meta">${E(t('svd_delAt', {d: svdDate(x.at)}))} · ${E(t('svd_left', {n: left}))}</small>
        <div class="svd-acts"><button type="button" class="gold-btn" data-svdb="restore">↺ ${E(t('svd_restore'))}</button><button type="button" class="mv danger" data-svdb="kill">${E(t(SVD.sure === x.id ? 'svd_sure' : 'svd_kill'))}</button></div></div>`;
    });
  }
  box.innerHTML = h;
}
function svdItem(key){ const [id, i] = String(key).split(':'); return {id, i: +i, s: (SCN[id] || [])[+i]}; }
document.addEventListener('click', e => {
  const el = e.target; if (!el.closest) return;
  const v = el.closest('[data-svdv]'); if (v){ SVD.view = v.dataset.svdv; SVD.sure = ''; svdRender(); return; }
  const g = el.closest('[data-svdgo]'); if (g){ activate(g.dataset.svdgo); return; }
  const a = el.closest('[data-svda]');
  if (a){
    const it = svdItem(a.closest('.svd-it').dataset.svdk); if (!it.s) return;
    const k = a.dataset.svda;
    if (k === 'open' || k === 'edit'){
      setVals(it.s.vals || {}); try { touch(it.id); } catch (er) {}
      SVD.edit = k === 'edit' ? {id: it.id, i: it.i} : null;
      activate(it.id); calc(it.id);
      if (k === 'edit'){ const d = $('#sc-' + it.id); if (d){ d.open = true; svdEditBar(it.id); setTimeout(() => d.scrollIntoView({block: 'center', behavior: SET.motion === 'reduce' ? 'auto' : 'smooth'}), 120); } }
      else toast(t('svd_opened', {n: it.s.n}));
      return;
    }
    if (k === 'ren'){ SVD.ren = it.id + ':' + it.i; svdRender(); const r = $('.svd-ren'); if (r){ r.focus(); r.select(); } return; }
    if (k === 'renok'){ const r = $('.svd-ren'); const n = r ? r.value.trim().slice(0, 40) : ''; if (n && !piiIn(n)){ it.s.n = n; it.s.up = Date.now(); saveScn(); try { renderScn(it.id); } catch (er) {} } SVD.ren = null; svdRender(); return; }
    if (k === 'note'){
      const cur = it.s.note || '';
      const n = (window.prompt ? window.prompt(t('svd_noteAsk'), cur) : null);
      if (n == null) return;
      const clean = String(n).slice(0, 300);
      if (piiIn(clean)){ toast(t('pii_block')); return; }
      it.s.note = clean.trim(); it.s.up = Date.now(); saveScn(); svdRender(); return;
    }
    if (k === 'share'){ shrOpen(null, svdScnText(it.id, it.s), it.s.n); return; }
    if (k === 'del'){ trashPut('scn', it.id, it.s); SCN[it.id].splice(it.i, 1); saveScn(); try { renderScn(it.id); } catch (er) {} svdRender(); toast(t('svd_toTrash')); return; }
  }
  const b = el.closest('[data-svdb]');
  if (b){
    const k = b.dataset.svdb, row = b.closest('.svd-it'), id = row && row.dataset.trid;
    if (k === 'restore'){ trashRestore(id); svdRender(); return; }
    if (k === 'kill'){ if (SVD.sure !== id){ SVD.sure = id; svdRender(); return; } SVD.sure = ''; trashSet(trashAll().filter(x => x.id !== id)); toast(t('svd_killed')); return; }
    if (k === 'empty'){ if (SVD.sure !== 'empty'){ SVD.sure = 'empty'; svdRender(); return; } SVD.sure = ''; trashSet([]); toast(t('svd_emptied')); return; }
  }
});
document.addEventListener('keydown', e => { if (e.target && e.target.classList && e.target.classList.contains('svd-ren') && e.key === 'Enter'){ e.preventDefault(); const b = e.target.parentNode.querySelector('[data-svda="renok"]'); if (b) b.click(); } });
document.addEventListener('input', e => { if (e.target && e.target.id === 'svd_q'){ SVD.q = e.target.value; const pos = e.target.selectionStart; svdRender(); const q = $('#svd_q'); if (q){ q.focus(); try { q.setSelectionRange(pos, pos); } catch (er) {} } } });
/* editing a saved item inside its calculator */
function svdEditBar(id){
  const box = $('#sc-' + id); if (!box) return;
  let bar = $('.scn-edit', box);
  const ed = SVD.edit && SVD.edit.id === id ? SVD.edit : null, s = ed && (SCN[id] || [])[ed.i];
  if (!s){ if (bar) bar.remove(); return; }
  if (!bar){ bar = document.createElement('div'); bar.className = 'scn-edit'; $('.scn-b', box).prepend(bar); }
  bar.innerHTML = `<span>✏️ ${asEsc(t('svd_editing', {n: s.n}))}</span><button type="button" class="gold-btn" data-sve="save">${asEsc(t('svd_saveEdit'))}</button><button type="button" class="mv" data-sve="cancel">${asEsc(t('svd_cancelEdit'))}</button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sve]'); if (!b || !SVD.edit) return;
  const {id, i} = SVD.edit, s = (SCN[id] || [])[i];
  if (b.dataset.sve === 'save' && s && LAST[id]){
    const r = LAST[id];
    s.vals = panelVals(id); s.hero = {label: strip(r.hero.label), value: strip(r.hero.value)}; s.rows = (r.rows || []).map(x => [strip(x[0]), strip(x[1])]).slice(0, 16); s.up = Date.now();
    saveScn(); toast(t('svd_editSaved', {n: s.n}));
  }
  SVD.edit = null; svdEditBar(id); renderScn(id);
});
const renderScn75 = renderScn;
renderScn = function(id){ const r = renderScn75.apply(this, arguments); try { svdEditBar(id); } catch (e) {} return r; };
CALC.saved = () => { svdRender(); return null; };
Object.assign(GS_SYN, {saved: 'שמורים שמירה תיקייה סל מיחזור saved folder trash recycle bin محفوظات سلة'});
if (typeof EX_SKIP !== 'undefined' && !EX_SKIP.includes('saved')) EX_SKIP.push('saved');
if (typeof FG_SKIP !== 'undefined' && !FG_SKIP.includes('saved')) FG_SKIP.push('saved');
if (typeof DASH_SKIP !== 'undefined' && !DASH_SKIP.includes('saved')) DASH_SKIP.push('saved');
const aiChipKeys75 = aiChipKeys;
aiChipKeys = function(id){ return id === 'saved' ? ['ai_cWhich'] : aiChipKeys75.apply(this, arguments); };
const activate75 = activate;
activate = function(id){ const r = activate75.apply(this, arguments); if (id === 'saved'){ SVD.ren = null; svdRender(); } return r; };
const applyLang75 = applyLang;
applyLang = function(){ const r = applyLang75.apply(this, arguments); if (tab === 'saved') try { svdRender(); } catch (e) {} return r; };
trashAll();

/* ---------- share, copy and PDF of what you entered on a screen ---------- */
function shrFields(id){
  if (!['calc'].includes(svKind(id)) && id !== 'percent') return [];
  const manual = (($('#s_fig') || {}).value === 'manual' && id === 'salary') || (($('#t_fig') || {}).value === 'manual' && id === 'tax');
  return aiFields(id).filter(f => f.shown && f.value !== '' && !(f.type === 'number' && +f.value === 0) && !(/^[st]_f(?!ig)/.test(f.id) && !manual))
    .map(f => [f.label, f.options ? ((f.options.find(o => o[0] === f.value) || [])[1] || f.value) : (f.type === 'number' ? N(+f.value, null, 4) : f.value) + (f.unit && !f.options ? ' ' + f.unit : '')]);
}
function shrResult(id){
  if (id === 'percent') return {rows: $$('#panel-percent .sentence').map(s => [exClean($('.s-line', s) ? $('.s-line', s).textContent : ''), exClean($('.s-result', s) ? $('.s-result', s).textContent : '')])};
  const r = LAST[id]; if (!r || !r.hero) return null;
  return {hero: [strip(r.hero.label), strip(r.hero.value), r.hero.sub ? strip(r.hero.sub) : ''], rows: (r.rows || []).map(x => [strip(x[0]), strip(x[1])]),
    note: r.note ? strip(r.note) : '', warn: (r.warn || []).map(strip), tables: [r.table2, r.table].filter(x => x && x.rows && x.rows.length).map(tb => ({title: strip(tb.title || ''), head: (tb.head || []).map(strip), rows: tb.rows.map(row => (Array.isArray(row) ? row : row.c || []).map(c => strip(c)))}))};
}
function shrExp(){
  const d = expData(), ym = (typeof EXP_M === 'string' && EXP_M) || ymOf(new Date());
  const it = d.items.filter(x => String(x.date || '').slice(0, 7) === ym || (x.rec && String(x.date || '').slice(0, 7) <= ym && (!x.end || x.end >= ym)));
  const tot = it.reduce((s, x) => s + (+x.amt || 0), 0);
  return {title: t('tab_expenses') + ' · ' + ymLabel(ym), rows: it.map(x => [(x.date ? dLabel(x.date) + ' · ' : '') + t('ec_' + x.cat) + (x.note ? ' · ' + x.note : ''), M(+x.amt || 0, 2, x.cur || expCur())]), total: M(tot, 2, expCur())};
}
function shrCl(){ return {title: t('tab_clients'), rows: clData().clients.map(c => [c.name + ' · ' + t('cl_t_' + c.type), t('cl_st_' + c.status) + (c.fee ? ' · ' + M(+c.fee, 0, expCur()) : '')])}; }
function shrText(id){
  const L = [], when = svdDate(Date.now());
  const kind = svKind(id);
  if (kind === 'exp' || kind === 'cl'){
    const x = kind === 'exp' ? shrExp() : shrCl();
    L.push(x.title + ' — ' + when, ''); x.rows.forEach(r => L.push('• ' + r[0] + ': ' + r[1])); if (x.total) L.push('', t('shr_total') + ': ' + x.total);
  } else {
    L.push(t('tab_' + id) + ' — ' + when);
    const F = shrFields(id); if (F.length){ L.push('', t('shr_inputs')); F.forEach(f => L.push('• ' + f[0] + ': ' + f[1])); }
    const R = shrResult(id);
    if (R){ L.push('', t('shr_results')); if (R.hero) L.push('★ ' + R.hero[0] + ': ' + R.hero[1]); R.rows.forEach(r => L.push('• ' + r[0] + (r[1] ? ': ' + r[1] : ''))); if (R.note) L.push('', R.note); }
  }
  L.push('', '— ' + t('shr_by'));
  return L.join('\n').replace(/[\u2066-\u2069]/g, '');
}
function svdScnText(id, s){
  const L = [t('tab_' + id) + ' — ' + s.n];
  if (s.hero) L.push('★ ' + s.hero.label + ': ' + s.hero.value);
  (s.rows || []).forEach(r => L.push('• ' + r[0] + ': ' + r[1]));
  if (s.note) L.push('', s.note);
  L.push('', '— ' + t('shr_by'));
  return L.join('\n').replace(/[\u2066-\u2069]/g, '');
}
var SHR = {text: '', title: '', id: null};
function shrOpen(id, text, title){
  SHR = {id, text: text || shrText(id), title: title || t('tab_' + id)};
  if (!$('#shx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="shx" hidden><div class="cp-box sh-box" role="dialog" aria-modal="true" aria-labelledby="shx_t"><div class="cp-top"><h3 id="shx_t"></h3><button type="button" class="cp-x" id="shx_x">×</button></div><div id="shx_b"></div></div></div>`);
  const E = asEsc, enc = encodeURIComponent, txt = SHR.text;
  $('#shx_t').textContent = t('shr_title'); $('#shx_x').setAttribute('aria-label', t('cp_close'));
  $('#shx_b').innerHTML = `<pre class="shr-pre" dir="auto">${E(txt)}</pre>
    <div class="shr-grid">
      ${navigator.share ? `<button type="button" class="shr-b" data-shx="sys">📤<span>${E(t('shr_sys'))}</span></button>` : ''}
      <a class="shr-b" href="https://wa.me/?text=${enc(txt)}" target="_blank" rel="noopener noreferrer">💬<span>WhatsApp</span></a>
      <a class="shr-b" href="https://t.me/share/url?url=${enc(' ')}&text=${enc(txt)}" target="_blank" rel="noopener noreferrer">✈️<span>Telegram</span></a>
      <a class="shr-b" href="mailto:?subject=${enc(SHR.title)}&body=${enc(txt)}" target="_blank" rel="noopener noreferrer">✉️<span>${E(t('shr_mail'))}</span></a>
      <button type="button" class="shr-b" data-shx="copy">📋<span>${E(t('b_copy'))}</span></button>
      ${id ? `<button type="button" class="shr-b" data-shx="pdf">📄<span>${E(t('b_pdf'))}</span></button>` : ''}
    </div><p class="fine">${E(t('shr_priv'))}</p>`;
  $('#shx').hidden = false; document.body.classList.add('cp-lock');
}
function shrClose(){ const o = $('#shx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
document.addEventListener('click', async e => {
  const el = e.target; if (!el.closest) return;
  const o = $('#shx');
  if (o && !o.hidden){
    if (el === o || el.closest('#shx_x')) return shrClose();
    const b = el.closest('[data-shx]');
    if (b){
      const k = b.dataset.shx;
      if (k === 'copy'){ copyText(SHR.text); toast(t('st_copied')); }
      else if (k === 'sys'){ try { await navigator.share({title: SHR.title, text: SHR.text}); } catch (er) { if (!er || er.name !== 'AbortError'){ copyText(SHR.text); toast(t('shr_copiedInstead')); } } }
      else if (k === 'pdf'){ shrClose(); pdfMake(SHR.id); }
    }
  }
  const s = el.closest('[data-shr]');
  if (s){ const id = s.closest('.svbar') ? s.closest('.svbar').dataset.svp : tab; const k = s.dataset.shr;
    if (k === 'copy'){ copyText(shrText(id)); toast(t('st_copied')); } else if (k === 'share') shrOpen(id); else if (k === 'pdf') pdfMake(id); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ const o = $('#shx'); if (o && !o.hidden){ e.preventDefault(); shrClose(); } } });
const doAction75 = doAction;
doAction = function(act, id){
  if (act === 'copy'){ copyText(shrText(id)); toast(t('st_copied')); return; }
  if (act === 'share'){ shrOpen(id); return; }
  if (act === 'pdf' || act === 'print'){ pdfMake(id); return; }
  return doAction75.apply(this, arguments);
};
const svBarHtml75 = svBarHtml;
svBarHtml = function(){
  return svBarHtml75.apply(this, arguments) + `<div class="sv-share"><button type="button" data-shr="copy">📋 ${asEsc(t('b_copy'))}</button><button type="button" data-shr="share">📤 ${asEsc(t('b_share'))}</button><button type="button" data-shr="pdf">📄 ${asEsc(t('b_pdf'))}</button></div>`;
};
/* the PDF is drawn here, page by page, and written as a real PDF file: no outside service, works offline and inside Claude */
function pdfModel(id){
  const kind = svKind(id), B = [];
  B.push({k: 'brand', s: t('shr_by')}, {k: 'title', s: t('tab_' + id)}, {k: 'date', s: svdDate(Date.now())}, {k: 'rule'});
  if (kind === 'exp' || kind === 'cl'){
    const x = kind === 'exp' ? shrExp() : shrCl();
    B.push({k: 'h2', s: x.title}, {k: 'kv', rows: x.rows}); if (x.total) B.push({k: 'kv', rows: [[t('shr_total'), x.total]], bold: true});
  } else {
    const F = shrFields(id), R = shrResult(id);
    if (F.length) B.push({k: 'h2', s: t('shr_inputs').replace(/:$/, '')}, {k: 'kv', rows: F});
    if (R){
      B.push({k: 'h2', s: t('shr_results').replace(/:$/, '')});
      if (R.hero) B.push({k: 'hero', a: R.hero[0], b: R.hero[1], c: R.hero[2]});
      if (R.rows.length) B.push({k: 'kv', rows: R.rows});
      (R.tables || []).forEach(tb => B.push({k: 'h3', s: tb.title}, {k: 'table', head: tb.head, rows: tb.rows.slice(0, 400)}));
      if (R.warn && R.warn.length) B.push({k: 'p', s: R.warn.join(' '), warn: true});
      if (R.note) B.push({k: 'p', s: R.note});
    }
  }
  B.push({k: 'rule'}, {k: 'foot', s: t('shr_pdfFoot')});
  return B;
}
function pdfPages(B){
  const O = arguments[1] || {}, W = O.W || 1190, H = O.H || 1684, M = O.M || 84, SC = O.S || 1, rtl = (document.documentElement.dir || 'rtl') === 'rtl', FF = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans Hebrew','Noto Sans Arabic',Arial,sans-serif";
  const pages = []; let cv, cx, y;
  const page = () => { cv = document.createElement('canvas'); cv.width = W * SC; cv.height = H * SC; cx = cv.getContext('2d'); if (SC !== 1) cx.scale(SC, SC); cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); try { cx.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {} cx.textBaseline = 'top'; pages.push(cv); y = M; };
  const font = (sz, w) => { cx.font = (w || 400) + ' ' + sz + 'px ' + FF; };
  const S = rtl ? W - M : M, E = rtl ? M : W - M;              // start and end edges of the text area
  const at = (x0, w, align) => align === 'start' ? (rtl ? x0 + w : x0) : (rtl ? x0 : x0 + w);
  const wrap = (txt, maxW) => { const out = []; String(txt == null ? '' : txt).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(wd => { const tr = line ? line + ' ' + wd : wd; if (cx.measureText(tr).width > maxW && line){ out.push(line); line = wd; } else line = tr; }); out.push(line); }); return out; };
  const need = h => { if (y + h > H - M) page(); };
  const numy = s => /^[\s\u200e\u200f\u2066-\u2069\-−+\d,.%₪$€£¥:/()]+$/.test(String(s)) && /\d/.test(String(s));
  const text = (s, x, align, color) => {
    cx.fillStyle = color || '#141821'; cx.textAlign = align === 'end' ? (rtl ? 'left' : 'right') : (rtl ? 'right' : 'left');
    const flip = rtl && numy(s); if (flip){ try { cx.direction = 'ltr'; } catch (e) {} }
    cx.fillText(String(s).replace(/[\u200e\u200f\u2066-\u2069]/g, ''), x, y);
    if (flip){ try { cx.direction = 'rtl'; } catch (e) {} }
  };
  page();
  B.forEach(b => {
    if (b.k === 'brand'){ font(22, 700); need(30); text(b.s, S, 'start', '#8a7020'); y += 32; }
    else if (b.k === 'title'){ font(48, 700); wrap(b.s, W - 2 * M).forEach(l => { need(60); text(l, S, 'start'); y += 60; }); }
    else if (b.k === 'date'){ font(22); need(30); text(b.s, S, 'start', '#5b6170'); y += 36; }
    else if (b.k === 'rule'){ need(20); cx.fillStyle = '#C9A227'; cx.fillRect(M, y + 6, W - 2 * M, 4); y += 26; }
    else if (b.k === 'h2' || b.k === 'h3'){ font(b.k === 'h2' ? 32 : 28, 700); need(70); y += 14; text(b.s, S, 'start', '#1f2a44'); y += b.k === 'h2' ? 46 : 40; }
    else if (b.k === 'hero'){
      font(26); const lab = wrap(b.a, W - 2 * M - 40); font(48, 700); const sub = b.c ? (font(22), wrap(b.c, W - 2 * M - 40)) : [];
      const h = 28 + lab.length * 34 + 62 + sub.length * 30 + 20; need(h);
      cx.fillStyle = '#fbf6e6'; cx.fillRect(M, y, W - 2 * M, h); cx.strokeStyle = '#ecd9a0'; cx.lineWidth = 2; cx.strokeRect(M, y, W - 2 * M, h);
      y += 22; font(26); lab.forEach(l => { text(l, rtl ? S - 20 : S + 20, 'start', '#3a3f4b'); y += 34; });
      font(48, 700); text(b.b, rtl ? S - 20 : S + 20, 'start', '#6b520e'); y += 62;
      font(22); sub.forEach(l => { text(l, rtl ? S - 20 : S + 20, 'start', '#5b6170'); y += 30; }); y += 44;
    }
    else if (b.k === 'kv'){
      b.rows.forEach(r => {
        font(25, b.bold ? 700 : 400); const vw = Math.min((W - 2 * M) * 0.45, cx.measureText(String(r[1] || '')).width + 10);
        const L = wrap(r[0], W - 2 * M - vw - 30); const h = Math.max(1, L.length) * 34 + 16; need(h);
        L.forEach((l, i) => { text(l, S, 'start', '#262b36'); if (i < L.length - 1) y += 34; });
        font(25, 700); text(String(r[1] || ''), E, 'end', '#141821'); y += 34 + 6;
        cx.fillStyle = '#e3e6ee'; cx.fillRect(M, y, W - 2 * M, 2); y += 10;
      });
    }
    else if (b.k === 'table'){
      const n = Math.max((b.head || []).length, ...b.rows.map(r => r.length)), cw = (W - 2 * M) / Math.max(1, n);
      const colX = i => rtl ? W - M - (i + 1) * cw : M + i * cw;
      const drawRow = (cells, head) => {
        font(21, head ? 700 : 400); const L = cells.map(c => wrap(c, cw - 16)); const h = Math.max(...L.map(x => x.length), 1) * 28 + 14;
        need(h); if (head){ cx.fillStyle = '#f4f6fa'; cx.fillRect(M, y, W - 2 * M, h); }
        const y0 = y; L.forEach((ls, i) => { ls.forEach((l, j) => { y = y0 + 7 + j * 28; text(l, at(colX(i), cw, 'start') + (rtl ? -8 : 8), 'start', '#141821'); }); });
        y = y0 + h; cx.fillStyle = '#e3e6ee'; cx.fillRect(M, y - 2, W - 2 * M, 2);
      };
      if (b.head && b.head.length) drawRow(b.head, true);
      b.rows.forEach(r => drawRow(r, false));
      y += 8;
    }
    else if (b.k === 'p'){ font(22); const L = wrap(b.s, W - 2 * M); need(Math.min(L.length, 4) * 30 + 16); y += 8; L.forEach(l => { need(30); text(l, S, 'start', b.warn ? '#8a3a12' : '#5b6170'); y += 30; }); y += 8; }
    else if (b.k === 'foot'){ font(19); wrap(b.s, W - 2 * M).forEach(l => { need(26); text(l, S, 'start', '#8a8f9c'); y += 26; }); }
  });
  return pages;
}
function pdfBytes(pages){
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const put = x => { const u = typeof x === 'string' ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const obj = (n, body) => { offs[n] = len; put(n + ' 0 obj\n'); body(); put('\nendobj\n'); };
  const imgs = pages.map(c => { const d = atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]); const u = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); return {u, w: c.width, h: c.height}; });
  const N = pages.length, PW = 595.28, PH = 841.89;
  put('%PDF-1.4\n'); put(new Uint8Array([37, 226, 227, 207, 211, 10]));
  obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => put('<< /Type /Pages /Count ' + N + ' /Kids [' + imgs.map((_, i) => (3 + i * 3) + ' 0 R').join(' ') + '] >>'));
  imgs.forEach((im, i) => {
    const p = 3 + i * 3, c = p + 1, x = p + 2, cs = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im' + i + ' Do Q';
    obj(p, () => put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im' + i + ' ' + x + ' 0 R >> >> /Contents ' + c + ' 0 R >>'));
    obj(c, () => put('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream'));
    obj(x, () => { put('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.u.length + ' >>\nstream\n'); put(im.u); put('\nendstream'); });
  });
  const total = 3 + N * 3, xref = len;
  put('xref\n0 ' + total + '\n0000000000 65535 f \n'); for (let n = 1; n < total; n++) put(String(offs[n]).padStart(10, '0') + ' 00000 n \n');
  put('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
  return new Blob(parts, {type: 'application/pdf'});
}
var PDF_BUSY = false;
async function pdfMake(id){
  if (PDF_BUSY) return; PDF_BUSY = true;
  toast(t('pdf_making'));
  try {
    try { await document.fonts.ready; } catch (e) {}
    const blob = pdfBytes(pdfPages(pdfModel(id)));
    const name = (t('tab_' + id) + ' ' + new Date().toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf';
    const r = await fileSave(blob, name, 'application/pdf');
    toast(t(r === 'saved' ? 'pdf_done' : r === 'declined' ? 'pdf_declined' : 'pdf_fail'));
  } catch (e) { toast(t('pdf_fail')); }
  finally { PDF_BUSY = false; }
}

/* ---------- a small, stable door for developer code: everything here updates every calculator at once ---------- */
var DC_HOOKS = [];
const showDc = show;
show = function(id, res){
  for (const f of DC_HOOKS){ try { const r = f(id, res); if (r && typeof r === 'object') res = r; } catch (e) {} }
  return showDc.call(this, id, res);
};
try {
  window.FinApp = Object.freeze({
    version: APP_VER, T, TAX, IL26: typeof IL26 === 'object' ? IL26 : null, MKT, CALC, DEFS, t,
    rates: () => RATES, settings: () => SET, tab: () => tab, last: id => LAST[id || tab],
    calc: id => { try { calc(id || tab); } catch (e) {} }, recalc: () => { try { if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {} },
    open: id => activate(id), toast: m => toast(String(m)),
    onResult: fn => { if (typeof fn === 'function') DC_HOOKS.push(fn); },
    addText: (k, he, ar, en) => { T[k] = [he, ar || en || he, en || he]; }
  });
} catch (e) {}
/* developer code, published from the app, the website or GitHub, runs in the app and on the website */
var DC = {pub: null, at: 0, ran: false, err: ''};
const DC_URL_GH = 'https://ysdesign-il.github.io/financial-calculator/devcode.json', DC_REPO = 'ysdesign-il/financial-calculator';
function dcSkip(){ return /[#&?]nocode\b/.test(location.hash + location.search); }
function dcRun(code){
  if (!code || DC.ran || dcSkip()) return;
  DC.ran = true;
  try {
    if (code.css){ const st = document.createElement('style'); st.id = 'devcode-css'; st.textContent = String(code.css); document.head.appendChild(st); }
    if (code.js){ const sc = document.createElement('script'); sc.id = 'devcode-js'; sc.textContent = '(function(FinApp){try{\n' + String(code.js) + '\n}catch(e){console.warn("devcode",e);}})(window.FinApp);'; document.body.appendChild(sc); }
    setTimeout(() => { try { if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {} }, 0);
  } catch (e) { DC.err = String(e && e.message || e); }
}
function dcDraft(){ try { return JSON.parse(RAWLS.getItem('fin-devcode-draft') || 'null'); } catch (e) { return null; } }
async function dcLoad(){
  let d = null;
  try { const r = await fetch((IN_CLAUDE ? DC_URL_GH : 'devcode.json') + '?v=' + Math.floor(Date.now() / 120000), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (r.ok) d = await r.json(); } catch (e) {}
  if (d && typeof d === 'object'){ DC.pub = {js: String(d.js || ''), css: String(d.css || ''), at: +d.at || 0}; DC.at = DC.pub.at; }
  let preview = false; try { preview = DEV_ON && RAWLS.getItem('fin-devcode-preview') === '1'; } catch (e) {}
  dcRun(preview ? dcDraft() : DC.pub);
  dcRender();
}
setTimeout(dcLoad, 300);

/* ---------- developer only: write code here, try it on your device, publish to everyone through GitHub ---------- */
function ghTok(){ try { return RAWLS.getItem('fin-gh-tok') || ''; } catch (e) { return ''; } }
const b64u = s => btoa(unescape(encodeURIComponent(s)));
async function ghPut(path, text, msg){
  const tok = ghTok(); if (!tok) throw new Error('notoken');
  const H = {Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'};
  const base = 'https://api.github.com/repos/' + DC_REPO + '/contents/' + path;
  let sha;
  const g = await fetch(base + '?ref=main', {headers: H, cache: 'no-store'});
  if (g.ok){ sha = (await g.json()).sha; } else if (g.status !== 404) throw new Error('gh' + g.status);
  const p = await fetch(base, {method: 'PUT', headers: Object.assign({'Content-Type': 'application/json'}, H), body: JSON.stringify({message: msg, content: b64u(text), branch: 'main', sha})});
  if (!p.ok) throw new Error('gh' + p.status);
  return true;
}
function dcRender(){
  const box = $('#dc_box'); if (!box || !liveOwner()) return;
  if (box.contains(document.activeElement) && /TEXTAREA|INPUT/.test(document.activeElement.tagName)) return;
  const E = asEsc, d = dcDraft() || DC.pub || {js: '', css: ''};
  let prev = false; try { prev = RAWLS.getItem('fin-devcode-preview') === '1'; } catch (e) {}
  box.innerHTML = `<p class="fine">${E(t('dc_intro'))}</p>
    <p class="gk-st ${prev ? 'new' : DC.pub && (DC.pub.js || DC.pub.css) ? 'ok' : ''}">${E(prev ? t('dc_stPreview') : DC.pub && (DC.pub.js || DC.pub.css) ? t('dc_stLive', {d: DC.at ? svdDate(DC.at) : '—'}) : t('dc_stNone'))}</p>
    <div class="field wide"><label for="dc_js">JavaScript</label><textarea id="dc_js" class="dc-code" rows="10" dir="ltr" spellcheck="false" autocapitalize="off" autocomplete="off" data-pii-ok placeholder="FinApp.TAX.point = 2904; FinApp.recalc();">${E(d.js || '')}</textarea></div>
    <div class="field wide"><label for="dc_css">CSS</label><textarea id="dc_css" class="dc-code" rows="5" dir="ltr" spellcheck="false" autocapitalize="off" autocomplete="off" data-pii-ok placeholder=".hero{border-radius:20px}">${E(d.css || '')}</textarea></div>
    <details class="adv"><summary>${E(t('dc_api'))}</summary><pre class="dc-help" dir="ltr">FinApp.TAX, FinApp.IL26, FinApp.MKT      // ${E(t('dc_apiFig'))}
FinApp.CALC.salary = () => ({...})       // ${E(t('dc_apiCalc'))}
FinApp.onResult((id, res) => res)        // ${E(t('dc_apiRes'))}
FinApp.addText('key', 'עברית', 'عربي', 'English')
FinApp.recalc(); FinApp.open('salary'); FinApp.toast('…')</pre></details>
    <div class="btnrow"><button type="button" class="mv" data-dc="draft">${E(t('dc_saveDraft'))}</button><button type="button" class="gold-btn" data-dc="try">${E(t(prev ? 'dc_tryAgain' : 'dc_try'))}</button>${prev ? `<button type="button" class="mv" data-dc="stop">${E(t('dc_stop'))}</button>` : ''}</div>
    <h4 class="sec-h">${E(t('dc_pubT'))}</h4><p class="fine">${E(t('dc_pubS'))}</p>
    <div class="field wide"><label for="gh_tok">${E(t('dc_tok'))}</label><input id="gh_tok" type="password" autocomplete="off" dir="ltr" class="lookup" placeholder="github_pat_…" value="${ghTok() ? '••••••••' : ''}"><small class="hint">${E(t('dc_tokH'))}</small></div>
    <div class="btnrow"><button type="button" class="gold-btn" data-dc="pub">${E(t('dc_pub'))}</button><button type="button" class="mv" data-dc="unpub">${E(t('dc_unpub'))}</button>${ghTok() ? `<button type="button" class="mv" data-dc="forget">${E(t('dc_forget'))}</button>` : ''}</div>
    <p class="fine" id="dc_msg" role="status"></p>
    <p class="fine">${E(t('dc_safe'))}</p>`;
}
function dcMsg(k, p){ const m = $('#dc_msg'); if (m) m.textContent = k ? t(k, p) : ''; }
function dcGet(){ return {js: ($('#dc_js') || {}).value || '', css: ($('#dc_css') || {}).value || '', at: Date.now()}; }
document.addEventListener('change', e => { if (e.target && e.target.id === 'gh_tok'){ const v = e.target.value.trim(); if (v && !/^•+$/.test(v)){ try { RAWLS.setItem('fin-gh-tok', v); } catch (er) {} e.target.value = '••••••••'; dcMsg('dc_tokSaved'); } } });
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-dc]'); if (!b || !liveOwner()) return;
  const k = b.dataset.dc;
  if (k === 'draft'){ try { RAWLS.setItem('fin-devcode-draft', JSON.stringify(dcGet())); } catch (er) {} dcMsg('dc_draftSaved'); return; }
  if (k === 'try'){ try { RAWLS.setItem('fin-devcode-draft', JSON.stringify(dcGet())); RAWLS.setItem('fin-devcode-preview', '1'); } catch (er) {} location.reload(); return; }
  if (k === 'stop'){ try { RAWLS.removeItem('fin-devcode-preview'); } catch (er) {} location.reload(); return; }
  if (k === 'forget'){ try { RAWLS.removeItem('fin-gh-tok'); } catch (er) {} dcRender(); return; }
  if (k === 'pub' || k === 'unpub'){
    if (k === 'unpub' && b.dataset.sure !== '1'){ b.dataset.sure = '1'; b.textContent = t('b_sure'); return; }
    const body = k === 'pub' ? dcGet() : {js: '', css: '', at: Date.now()};
    dcMsg('m_wait');
    try { await ghPut('devcode.json', JSON.stringify(Object.assign({v: 1}, body), null, 1), k === 'pub' ? 'Developer code update' : 'Developer code removed'); dcMsg('dc_pubOk'); toast(t('dc_pubOk')); }
    catch (er) { const m = String(er && er.message || ''); dcMsg(m === 'notoken' ? 'dc_needTok' : /gh40[13]/.test(m) ? 'dc_badTok' : /gh/.test(m) ? 'dc_ghErr' : 'dc_blocked', {e: m}); }
  }
});
/* ChatGPT and other AI tools can develop the app through GitHub: only people with access to the repository can change it */
function gptRender(){
  const box = $('#gpt_box'); if (!box || !liveOwner()) return;
  const E = asEsc;
  box.innerHTML = `<p class="fine">${E(t('gpt_intro'))}</p><ol class="mv-steps"><li>${E(t('gpt_s1'))}</li><li>${E(t('gpt_s2'))}</li><li>${E(t('gpt_s3'))}</li><li>${E(t('gpt_s4'))}</li></ol>
    <div class="btnrow"><a class="gold-btn" href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer">ChatGPT Codex ↗</a><a class="mv" href="https://chatgpt.com/#settings/Connectors" target="_blank" rel="noopener noreferrer">${E(t('gpt_conn'))} ↗</a><a class="mv" href="https://github.com/${DC_REPO}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>
    <p class="fine">🔒 ${E(t('gpt_safe'))}</p>`;
}
/* the developer's own sections sit in Connections, hidden from everyone else */
function v5DevSecs(){
  const page = $('#panel-settings .set-cat[data-cat="conn"]'); if (!page) return;
  [['set_devcode', 'dc_title', 'dc_box'], ['set_devgpt', 'gpt_title', 'gpt_box'], ['set_devsrc', 'cs_title', 'cs_box']].forEach(([sk, tk, bx]) => {
    if ($(`.set-sec[data-sk="${sk}"]`)) return;
    page.insertAdjacentHTML('beforeend', `<div class="set-sec" data-sk="${sk}" data-own="1" hidden><h3 class="sec-t" data-i="${tk}">${asEsc(t(tk))}</h3><div id="${bx}"></div></div>`);
    if (!OWN_SECS.includes(sk)) OWN_SECS.push(sk);
  });
}
v5DevSecs();
const liveApply75 = liveApply;
liveApply = function(){ const r = liveApply75.apply(this, arguments); try { dcRender(); gptRender(); csrcRender(); } catch (e) {} return r; };

/* ---------- developer only: data sources by hand, or from sources you add ---------- */
['fx', 'cr', 'mkt'].forEach(g => { if (!SRCP_OPT[g].includes('manual')) SRCP_OPT[g].push('manual'); });
const CS_KIND = ['ilsPer', 'usdPer', 'perUsd', 'value'];
function csClean(list){
  return (Array.isArray(list) ? list : []).slice(0, 20).map(x => ({id: String(x && x.id || '').replace(/[^a-z0-9]/g, '').slice(0, 12) || Math.random().toString(36).slice(2, 8), n: String(x && x.n || '').slice(0, 40), g: ['fx', 'cr', 'mkt'].includes(x && x.g) ? x.g : 'fx',
    u: lnUrl(x && x.u), p: String(x && x.p || '').replace(/[^\w.\[\]-]/g, '').slice(0, 120), k: String(x && x.k || '').replace(/[^\w.]/g, '').slice(0, 12), kind: CS_KIND.includes(x && x.kind) ? x.kind : 'ilsPer', s: Math.max(10, Math.min(86400, +(x && x.s) || 60))})).filter(x => x.n && x.u && x.k);
}
function manClean(m){ const o = {}; ['fx', 'cr', 'mkt'].forEach(g => { const src = m && m[g] && typeof m[g] === 'object' ? m[g] : {}; o[g] = {}; Object.keys(src).slice(0, 30).forEach(k => { const v = +src[k]; if (/^[\w.]{2,12}$/.test(k) && v > 0 && isFinite(v)) o[g][k] = v; }); }); return o; }
var SRC_MAN = {fx: {}, cr: {}, mkt: {}}, SRC_CUST = [];
const srcpClean75 = srcpClean;
srcpClean = function(d){
  const cust = csClean(d && d.cust), o = srcpClean75.call(this, d);
  Object.keys(SRCP_OPT).forEach(g => { const v = d && d[g]; if (typeof v === 'string' && /^c:[a-z0-9]{1,12}$/.test(v) && cust.some(c => 'c:' + c.id === v && c.g === g)) o[g] = v; });
  o.man = manClean(d && d.man); o.cust = cust;
  return o;
};
srcOk = function(g, s){
  const P = (typeof SRCP === 'object' && SRCP) || {}, p = P[g];
  if (!p || p === 'auto') return true;
  if (p === 'manual' || /^c:/.test(p)) return s === p;
  if (g === 'fx') return p === 'cnbc' ? (s === 'cnbc' || s === 'snap') : p === s;
  if (g === 'cr') return p === s;
  if (g === 'mkt') return p === 'live' || s === 'snap';
  return true;
};
function csApplyVal(g, k, kind, v, srcTag){
  if (!(v > 0) || !isFinite(v)) return false;
  const now = Date.now();
  if (g === 'mkt'){ const o = IX.mkt[k]; if (!o) return false; IX.mkt[k] = Object.assign({}, o, {p: v, t: Math.floor(now / 1000), live: false}); return true; }
  const code = k.toUpperCase(); if (!/^[A-Z0-9]{2,10}$/.test(code)) return false;
  let r;                                                         // RATES = units of the currency per 1 US dollar
  if (kind === 'perUsd') r = v; else if (kind === 'usdPer') r = 1 / v;
  else if (kind === 'ilsPer') r = code === 'USD' ? null : (RATES.ILS || 0) / v; else r = v;
  if (code === 'USD' && kind === 'ilsPer'){ RATES.ILS = v; FXSRC.ILS = {s: srcTag, at: now}; }
  else if (r > 0 && isFinite(r)){ RATES[code] = r; FXSRC[code] = {s: srcTag, at: now}; }
  else return false;
  RATES.USD = 1;
  if (g === 'fx'){ META.live = false; META.mkt = false; META.official = false; META.unix = Math.floor(now / 1000); }
  if (g === 'cr'){ META.cunix = Math.floor(now / 1000); }
  return true;
}
function srcManApply(){
  let n = 0;
  ['fx', 'cr', 'mkt'].forEach(g => {
    if (SRCP[g] !== 'manual') return;
    const m = SRC_MAN[g] || {}, keys = Object.keys(m).sort((a, b) => (b === 'USD') - (a === 'USD'));
    keys.forEach(k => { if (csApplyVal(g, k, g === 'fx' ? 'ilsPer' : g === 'cr' ? 'usdPer' : 'value', m[k], 'manual')) n++; });
  });
  if (n){ try { fillCurSelects(); renderStamp(); if (tab === 'home') renderMarket(); else calc(tab); } catch (e) {} }
}
function jPath(o, p){ return String(p || '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean).reduce((a, k) => a == null ? a : a[k], o); }
var CS_T = {}, CS_ST = {};
async function csFetch(c){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(c.u, {signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'}); if (!r.ok) throw new Error('http ' + r.status); const v = parseFloat(jPath(await r.json(), c.p)); if (!(v > 0)) throw new Error('path'); return v; }
  finally { clearTimeout(to); }
}
function csStart(){
  Object.keys(CS_T).forEach(k => { clearTimeout(CS_T[k]); delete CS_T[k]; });
  SRC_CUST.forEach(c => {
    if (SRCP[c.g] !== 'c:' + c.id) return;
    const tick = async () => {
      if (!document.hidden){
        try { const v = await csFetch(c); if (csApplyVal(c.g, c.k, c.g === 'mkt' ? 'value' : c.kind, v, 'custom')){ CS_ST[c.id] = {ok: true, v, at: Date.now()}; try { fillCurSelects(); if (tab === 'home') renderMarket(); else if (tab !== 'settings') calc(tab); } catch (e) {} } }
        catch (e) { CS_ST[c.id] = {ok: false, e: String(e && e.message || e), at: Date.now()}; }
        try { csrcRender(); } catch (e) {}
      }
      CS_T[c.id] = setTimeout(tick, c.s * 1000);
    };
    tick();
  });
}
const srcpSet75 = srcpSet;
srcpSet = function(next){
  SRC_MAN = manClean(next && next.man); SRC_CUST = csClean(next && next.cust);
  const r = srcpSet75.apply(this, arguments);
  srcManApply(); csStart();
  try { csrcRender(); } catch (e) {}
  return r;
};
/* while a group is set by hand or by an added source, the other feeds stay out of it */
const srcOwn = g => SRCP[g] === 'manual' || /^c:/.test(SRCP[g] || '');
const applyDbRates75 = applyDbRates;
applyDbRates = function(d){ if (d && (srcOwn('fx') || srcOwn('cr'))){ d = Object.assign({}, d); if (srcOwn('fx')) delete d.usd; if (srcOwn('cr')) delete d.crypto; } return applyDbRates75.call(this, d); };
const applyUsd75 = applyUsd;
applyUsd = function(){ if (srcOwn('fx')) return 0; return applyUsd75.apply(this, arguments); };
const ixApply75b = ixApply;
ixApply = function(d){ if (srcOwn('mkt') && d && d.mkt) d = Object.assign({}, d, {mkt: null}); return ixApply75b.call(this, d, arguments[1]); };
const srcPickHtml75 = srcPickHtml;
srcPickHtml = function(g){
  let h = srcPickHtml75.apply(this, arguments);
  const sel = h.indexOf('</select>');
  if (sel > 0 && SRC_CUST.some(c => c.g === g)) h = h.slice(0, sel) + SRC_CUST.filter(c => c.g === g).map(c => `<option value="c:${c.id}"${SRCP[g] === 'c:' + c.id ? ' selected' : ''}>${asEsc(t('cs_opt', {n: c.n}))}</option>`).join('') + h.slice(sel);
  if (SRCP[g] === 'manual'){
    const keys = g === 'fx' ? ['USD', 'EUR', 'GBP'] : g === 'cr' ? ['BTC', 'ETH'] : IX_MK.slice();
    const lab = k => g === 'fx' ? t('man_fx', {c: k}) : g === 'cr' ? t('man_cr', {c: k}) : ixName(k);
    h += `<div class="man-box" data-mang="${g}">${keys.map(k => `<label class="man-f"><span>${asEsc(lab(k))}</span><input type="number" inputmode="decimal" step="any" data-mank="${k}" value="${SRC_MAN[g] && SRC_MAN[g][k] != null ? SRC_MAN[g][k] : ''}" data-pii-ok></label>`).join('')}<button type="button" class="gold-btn" data-mansave="${g}">${asEsc(t('man_save'))}</button></div>`;
  }
  return h;
};
async function srcpSaveAll(next){
  await srcpSave(next);
  if (!IN_CLAUDE && ghTok()){ try { await ghPut('srcpref.json', JSON.stringify(Object.assign({}, srcpClean(next), {at: Date.now()}), null, 1), 'Data sources update'); toast(t('cs_pubSite')); } catch (e) {} }
}
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-mansave]'); if (!b || !liveOwner()) return;
  const g = b.dataset.mansave, box = b.closest('.man-box'), vals = {};
  $$('[data-mank]', box).forEach(i => { const v = parseFloat(i.value); if (v > 0) vals[i.dataset.mank] = v; });
  const next = Object.assign({}, SRCP, {man: Object.assign({}, SRC_MAN, {[g]: vals}), cust: SRC_CUST});
  try { await srcpSaveAll(next); srcpSet(next); toast(t('man_saved')); } catch (er) { toast(t('src_pFail')); }
});
/* the list of sources the developer added */
var CS_EDIT = null;
function csrcRender(){
  const box = $('#cs_box'); if (!box || !liveOwner()) return;
  if (box.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const E = asEsc, e0 = CS_EDIT ? (SRC_CUST.find(c => c.id === CS_EDIT) || {}) : {n: '', g: 'fx', u: '', p: '', k: '', kind: 'ilsPer', s: 60};
  let h = `<p class="fine">${E(t('cs_intro'))}</p>`;
  h += SRC_CUST.length ? `<div class="cs-list">${SRC_CUST.map(c => { const st = CS_ST[c.id], on = SRCP[c.g] === 'c:' + c.id;
    return `<div class="cs-it" data-csid="${c.id}"><div class="src-top"><b>${E(c.n)}</b><span class="src-st s-${on ? (st && st.ok ? 'live' : st ? 'stale' : 'sched') : 'sched'}">${E(on ? t('cs_on') : t('cs_offT'))}</span></div>
      <small dir="ltr" class="cs-u">${E(c.u)}</small><small>${E(t('src_g_' + c.g))} · ${E(c.k)} · ${E(t('cs_k_' + c.kind))} · ${E(t('cs_every', {n: c.s}))}${st ? ' · ' + E(st.ok ? t('cs_last', {v: N(st.v, null, 6)}) : t('cs_err', {e: st.e})) : ''}</small>
      <div class="btnrow"><button type="button" class="mv" data-csa="${on ? 'off' : 'on'}">${E(t(on ? 'cs_useOff' : 'cs_use'))}</button><button type="button" class="mv" data-csa="test">${E(t('cs_test'))}</button><button type="button" class="mv" data-csa="edit">${E(t('ln_edit'))}</button><button type="button" class="mv danger" data-csa="del">${E(t('ln_del'))}</button></div></div>`; }).join('')}</div>` : `<p class="fine">${E(t('cs_none'))}</p>`;
  h += `<div class="ln-form"><h4 class="ln-h">${E(t(CS_EDIT ? 'cs_editT' : 'cs_addT'))}</h4>
    <div class="ln-f"><label for="cs_n">${E(t('cs_n'))}</label><input id="cs_n" maxlength="40" value="${E(e0.n || '')}" data-pii-ok></div>
    <div class="ln-f"><label for="cs_g">${E(t('cs_g'))}</label><select id="cs_g">${['fx', 'cr', 'mkt'].map(g => `<option value="${g}"${e0.g === g ? ' selected' : ''}>${E(t('src_g_' + g))}</option>`).join('')}</select></div>
    <div class="ln-f"><label for="cs_u">${E(t('cs_u'))}</label><input id="cs_u" dir="ltr" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="https://…/data.json" value="${E(e0.u || '')}"></div>
    <div class="ln-f"><label for="cs_p">${E(t('cs_p'))}</label><input id="cs_p" dir="ltr" autocapitalize="off" spellcheck="false" placeholder="rates.ILS" value="${E(e0.p || '')}"><small class="hint">${E(t('cs_pH'))}</small></div>
    <div class="ln-f"><label for="cs_k">${E(t('cs_k'))}</label><input id="cs_k" dir="ltr" autocapitalize="characters" spellcheck="false" placeholder="USD / BTC / ta35" value="${E(e0.k || '')}" data-pii-ok></div>
    <div class="ln-f"><label for="cs_kind">${E(t('cs_kind'))}</label><select id="cs_kind">${CS_KIND.map(k => `<option value="${k}"${e0.kind === k ? ' selected' : ''}>${E(t('cs_k_' + k))}</option>`).join('')}</select></div>
    <div class="ln-f"><label for="cs_s">${E(t('cs_s'))}</label><input id="cs_s" type="number" inputmode="numeric" min="10" step="1" value="${E(String(e0.s || 60))}" data-pii-ok></div>
    <div class="btnrow"><button type="button" class="gold-btn" data-csa="save">${E(t(CS_EDIT ? 'ln_saveEd' : 'cs_add'))}</button>${CS_EDIT ? `<button type="button" class="mv" data-csa="cancel">${E(t('ln_cancel'))}</button>` : ''}</div><small class="hint" id="cs_msg"></small></div>`;
  box.innerHTML = h;
}
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-csa]'); if (!b || !liveOwner()) return;
  const k = b.dataset.csa, row = b.closest('.cs-it'), id = row && row.dataset.csid, c = id && SRC_CUST.find(x => x.id === id);
  const save = async (cust, picks) => { const next = Object.assign({}, SRCP, picks || {}, {man: SRC_MAN, cust}); await srcpSaveAll(next); srcpSet(next); };
  try {
    if (k === 'cancel'){ CS_EDIT = null; csrcRender(); return; }
    if (k === 'edit'){ CS_EDIT = id; csrcRender(); const n = $('#cs_n'); if (n) n.focus(); return; }
    if (k === 'test' && c){ const m = $('#cs_msg'); try { const v = await csFetch(c); CS_ST[c.id] = {ok: true, v, at: Date.now()}; } catch (er) { CS_ST[c.id] = {ok: false, e: String(er && er.message || er), at: Date.now()}; } csrcRender(); return; }
    if (k === 'on' && c){ await save(SRC_CUST, {[c.g]: 'c:' + c.id}); toast(t('man_saved')); return; }
    if (k === 'off' && c){ await save(SRC_CUST, {[c.g]: 'auto'}); toast(t('man_saved')); return; }
    if (k === 'del' && c){ if (b.dataset.sure !== '1'){ b.dataset.sure = '1'; b.textContent = t('b_sure'); return; } const picks = SRCP[c.g] === 'c:' + c.id ? {[c.g]: 'auto'} : {}; await save(SRC_CUST.filter(x => x.id !== id), picks); return; }
    if (k === 'save'){
      const v = s => ($('#' + s) || {}).value || '';
      const rec = {id: CS_EDIT || Math.random().toString(36).slice(2, 8), n: v('cs_n').trim(), g: v('cs_g'), u: v('cs_u').trim(), p: v('cs_p').trim(), k: v('cs_k').trim(), kind: v('cs_kind'), s: +v('cs_s')};
      const ok = csClean([rec])[0], m = $('#cs_msg');
      if (!ok){ if (m) m.textContent = t('cs_bad'); return; }
      const list = SRC_CUST.filter(x => x.id !== ok.id).concat(ok);
      CS_EDIT = null; await save(list); toast(t('man_saved')); return;
    }
  } catch (er) { toast(t('src_pFail')); }
});
try { csrcRender(); dcRender(); gptRender(); liveApply(); } catch (e) {}
/* the converter says where the rate came from when the developer set it by hand or from an added source */
const showSrc75 = show;
show = function(id, res){
  if (id === 'convert' && res && Array.isArray(res.rows) && srcOwn('fx')){
    const lab = t('r_rateSrc'), own = t('s_manual');
    res = Object.assign({}, res, {rows: res.rows.map(r => r && r[0] === lab && r[1] !== own ? [r[0], t(SRCP.fx === 'manual' ? 'src_m_manual' : 'src_m_custom')] : r)});
  }
  return showSrc75.call(this, id, res);
};
