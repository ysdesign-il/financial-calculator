const LANG_LIST = [['he','עברית'],['ar','العربية'],['en','English'],['zh-CN','中文'],['hi','हिन्दी'],['es','Español'],['fr','Français'],['it','Italiano'],['pt-BR','Português'],['ru','Русский']];
const GREET = {"he": "שלום", "ar": "مرحبًا", "en": "Hello", "am": "ሰላም", "sq": "Përshëndetje", "hy": "Բարև", "az": "Salam", "eu": "Kaixo", "be": "Прывітанне", "bn": "নমস্কার", "bs": "Zdravo", "bg": "Здравей", "ca": "Hola", "zh-CN": "你好", "zh-TW": "你好", "hr": "Pozdrav", "cs": "Ahoj", "da": "Hej", "nl": "Hallo", "et": "Tere", "fil": "Kumusta", "fi": "Hei", "fr": "Bonjour", "ka": "გამარჯობა", "de": "Hallo", "el": "Γεια σου", "gu": "નમસ્તે", "ha": "Sannu", "hi": "नमस्ते", "hu": "Szia", "is": "Halló", "id": "Halo", "ga": "Dia duit", "it": "Ciao", "ja": "こんにちは", "kn": "ನಮಸ್ಕಾರ", "kk": "Сәлем", "km": "សួស្តី", "ko": "안녕하세요", "ky": "Салам", "lo": "ສະບາຍດີ", "lv": "Sveiki", "lt": "Labas", "mk": "Здраво", "ms": "Hai", "ml": "നമസ്കാരം", "mt": "Bonġu", "mr": "नमस्कार", "mn": "Сайн уу", "my": "မင်္ဂလာပါ", "ne": "नमस्ते", "nb": "Hei", "fa": "سلام", "pl": "Cześć", "pt-BR": "Olá", "pt-PT": "Olá", "pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "ps": "سلام", "ro": "Salut", "ru": "Привет", "sr": "Здраво", "si": "ආයුබෝවන්", "sk": "Ahoj", "sl": "Živjo", "so": "Salaam", "es": "Hola", "sw": "Habari", "sv": "Hej", "ta": "வணக்கம்", "te": "నమస్కారం", "th": "สวัสดี", "tr": "Merhaba", "uk": "Привіт", "ur": "سلام", "uz": "Salom", "vi": "Xin chào", "cy": "Helo", "yi": "שלום", "yo": "Báwo", "zu": "Sawubona"};
const GREET_SEP = {ar:'، ', fa:'، ', ur:'، ', ps:'، ', 'zh-CN':'，', 'zh-TW':'，', ja:'、'};
function helloText(name){
  const g = GREET[lang] || GREET.en, sep = GREET_SEP[lang] !== undefined ? GREET_SEP[lang] : ', ';
  return g + sep + '\u2068' + name + '\u2069';
}
const RTL = new Set(['he','ar','fa','ur','yi','ps','sd','ug','ckb','dv']);
var TOUCHED = [], TILE_F = 'all', MY_HANDLE = '';
try { MY_HANDLE = localStorage.getItem('fin-handle') || ''; } catch (e) {}
const MKT = {boi: 3.25, boiDate: '1.9.2026', boiNext: '21.10.2026', cpi: 1.5, cpiMonth: '08/2026', cpiYtd: 2.1, cpiYtdTo: 8, src: 'built'};
/* the interface follows the phone's language until a language is picked by hand (then it is kept in fin-lang) */
function devLang(){
  const has = c => LANG_LIST.some(l => l[0] === c);
  let list = []; try { list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).filter(Boolean); } catch (e) {}
  for (const raw of list){
    const tag = String(raw).replace('_', '-'), low = tag.toLowerCase(), base = low.split('-')[0];
    let c = '';
    if (base === 'iw') c = 'he'; else if (base === 'ji') c = 'yi'; else if (base === 'no' || base === 'nn' || base === 'nb') c = 'nb'; else if (base === 'tl' || base === 'fil') c = 'fil'; else if (base === 'in') c = 'id';
    else if (base === 'zh') c = 'zh-CN';
    else if (base === 'pt') c = 'pt-BR';
    else c = has(tag) ? tag : base;
    if (has(c)) return c;
  }
  return 'en';                                              // any other language: English
}
function langAuto(){ try { return !localStorage.getItem('fin-lang'); } catch (e) { return true; } }
const SET_DEF = {photoAccess:'ask', slip:{}, slips:[], tf:{}, bk:{}, fu:{}, rm:{}, nt:{}, axZoom:100, axLinks:'0', axSpace:'0', axFocus:'0', axGray:'0', axCursor:'0', axBtn:'1', ixShow:'', ixCustom:[], tvOn:'0', sound:'soft', tapSnd:'0', mvAlert:'1', mvPct:'2', kbLang:'0', design:'default', country:'', hfx:'1', mktLive:'1', inGroup:'1', ptMode:'auto', ptVal:'', clockStyle:'digital', clock24:'1', clockSec:'0', clockHeb:'1', clockHijri:'0', holAuto:'all', holMig:'1', myGross:'', myKids:'', myBYear:'', myEq:'', persona:'all', shareLang:'ui', words:'1', enTerms:'0', plain:'0', tts:'1', voiceIn:'0', dfmt:'auto', wkStart:'auto', trFix:'1', autoUpd:'1', aiEngine:'perplexity', aiNet:'1', pmName:'', pmStyle:'short', liveFx:'1', fxInt:'1', liveFiat:'1', liveCrypto:'1', boiDb:'1', autoRef:'5', src_boiFx:'1', src_boiInt:'1', src_cpi:'1', src_ecb:'1', src_binance:'1', theme:'system', start:'home', digits:'latn', dec:'auto', size:'m', vat:'18', sex:'m',
  accent:'gold', motion:'full', contrast:'normal', font:'default', sliders:'1', cpos:'auto', sep:'auto', compact:'0',
  fee:'', pens:'', study:'', erPens:'', erSev:'', erStudy:'', loanRate:'', invRate:'', cpi:'', infl:'', gainTax:'',
  dealer:'murshe', buyer:'first', dtax:'25', deptime:'end', capkind:'sec',
  prof:{single:'0', sold:'0', deg:'0', k0:'', k12:'', k3:'', k45:'', k617:'', k18:'', xp:''},
  remember:'1', saveMode:'auto', curBy:{}, rateSrc:'er', gkey:'', aiProv:'claude', aiModel:'', okey:'', stale:'1', favCur:[], order:null, hidden:[], pins:[], sort:'groups'};
const cloneDef = () => JSON.parse(JSON.stringify(SET_DEF));
let SET = cloneDef();
try { const sv = JSON.parse(localStorage.getItem('fin-set') || '{}'); Object.assign(SET, sv); SET.prof = Object.assign({}, SET_DEF.prof, sv.prof || {});
  if (sv.holMig !== '1'){ SET.holAuto = 'all'; SET.holMig = '1'; try { localStorage.setItem('fin-set', JSON.stringify(SET)); } catch(e2) {} }   // one time: holiday themes on for everyone; users can turn it off later
} catch(e) {}
SET.remember = '1'; SET.saveMode = SV.mode;                 // values are always kept now; when they are written is up to the save mode
const saveSet = () => { try { localStorage.setItem('fin-set', JSON.stringify(SET)); } catch(e) {} };
/* data that has no live source comes from the data file 6 times a day: slots start 01:25, 05:25, 09:25, 13:25, 17:25, 21:25 UTC,
   a few minutes after the scheduled updater writes rates.json */
const RJ_SLOT = () => Math.floor((Date.now() - 85 * 60000) / 144e5);
var RJ_UPD = 0;                                            // when the data file was last written (its "updated" field)
function rjSeen(d){ try { const u = Date.parse(d && d.updated); if (u > RJ_UPD) RJ_UPD = u; } catch (e) {} }
var RJ_LAST = {s: RJ_SLOT(), at: Date.now()}, RJ_FNS = [];
/* one download of the data file is shared by everything that reads it at the same moment */
var RJ_C = {};
function rjFetch(u, o){
  const c = RJ_C[u]; if (c && Date.now() - c.at < 30000) return c.p.then(r => r.clone());
  const p = fetch(u, o); RJ_C[u] = {at: Date.now(), p}; p.catch(() => { delete RJ_C[u]; });
  return p.then(r => r.clone());
}
/* due once per slot; if the scheduled job ran late and the file is still from the previous run, again every 15 minutes
   for up to 2.5 hours into the slot */
function rjDue(L){
  L = L || RJ_LAST; const n = RJ_SLOT(), now = Date.now(), start = n * 144e5 + 85 * 60000;
  return n !== L.s || !!(RJ_UPD && RJ_UPD < start - 18 * 60000 && now - start < 150 * 60000 && now - L.at >= 15 * 60000);
}
function rjMark(L){ L = L || RJ_LAST; L.s = RJ_SLOT(); L.at = Date.now(); }
function rjEvery(fn){
  RJ_FNS.push(fn);
  if (RJ_FNS.length > 1) return;
  const tick = () => { if (document.hidden || !rjDue()) return; rjMark(); RJ_FNS.forEach(f => { try { f(); } catch (e) {} }); };
  setInterval(tick, 60000); document.addEventListener('visibilitychange', tick);
}
const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
const AC = {gold:['#F2C45A','#9A6A06'], blue:['#6FA8FF','#2A5FD6'], green:['#46E3A4','#0D8A5B'], violet:['#B79CFF','#6B46D6']};
/* ---- themes: each one is a complete look (palette, chrome, home card), switchable at any time ---- */
const SKINS = {
  telaviv: {mode: 'light', pv: ['#E8F3F6', '#0A4F6E', '#FFFFFF', '#0B6E96', '#FFB23F', '#0B7CC2'],
    t: {'--bg':'#E8F3F6','--surface':'#FFFFFF','--field':'#FFFFFF','--ink':'#0A2A3B','--ink-2':'#4E6B79','--line':'rgba(10,42,59,.13)','--navy':'#0A4F6E','--hero-bg':'#0A4F6E','--on-navy':'#F2FBFF','--on-navy-2':'#A8D3E2','--nav-line':'rgba(255,255,255,.16)','--gold-ui':'#FFB23F','--gold':'#A35F00','--brass':'#A35F00','--focus':'#0B7CC2','--g1':'#FFFFFF','--g2':'#F2F9FB','--track':'rgba(10,42,59,.16)','--shadow':'rgba(10,60,90,.12)','--hero-label':'#2E5C70','--hero-val':'#0B7CC2','--hero-grad':'linear-gradient(135deg,rgba(11,124,194,.16),#FFFFFF 65%)','--hero-bd':'rgba(11,124,194,.35)','--c1':'#0B7CC2','--c2':'#F0A030','--c3':'#E0604A','--c4':'#1AA37A',
       '--sk-rail':'linear-gradient(180deg,#0B5A7C,#083F58)','--sk-hh':'linear-gradient(135deg,#0B6E96 0%,#0A4F6E 55%,#083A52 100%)','--sk-hh-bd':'rgba(255,178,63,.5)','--sk-hh-l':'#CDEBF5','--sk-hh-v':'#FFD27A','--sk-hh-s':'#A8D3E2','--sk-bottom':'rgba(8,63,88,.94)','--sk-body':'linear-gradient(180deg,#E8F3F6 0%,#EEF3EE 55%,#F5EEDF 100%)'}},
  jerusalem: {mode: 'light', serif: true, pv: ['#EEE7D8', '#39352A', '#FBF8F1', '#5B6B3A', '#D1AE55', '#4E6A2B'],
    t: {'--bg':'#EEE7D8','--surface':'#FBF8F1','--field':'#FFFDF8','--ink':'#2A2318','--ink-2':'#6D6150','--line':'rgba(42,35,24,.14)','--navy':'#39352A','--hero-bg':'#39352A','--on-navy':'#F5EFE0','--on-navy-2':'#C9BEA5','--nav-line':'rgba(245,239,224,.14)','--gold-ui':'#D1AE55','--gold':'#7A5A10','--brass':'#7A5A10','--focus':'#4E6A2B','--g1':'#FDFBF6','--g2':'#F4EDDF','--track':'rgba(42,35,24,.16)','--shadow':'rgba(60,45,20,.12)','--hero-label':'#4E5A35','--hero-val':'#4E6A2B','--hero-grad':'linear-gradient(135deg,rgba(78,106,43,.16),#FBF8F1 65%)','--hero-bd':'rgba(78,106,43,.38)','--c1':'#4E6A2B','--c2':'#C08A2A','--c3':'#B4553A','--c4':'#2F7D6A',
       '--sk-rail':'linear-gradient(180deg,#433E31,#2F2B21)','--sk-hh':'linear-gradient(135deg,#5B6B3A,#3A4426 60%,#2B321C)','--sk-hh-bd':'rgba(209,174,85,.55)','--sk-hh-l':'#E3DCC2','--sk-hh-v':'#F3D98E','--sk-hh-s':'#CFC6A6','--sk-bottom':'rgba(47,43,33,.94)','--sk-body':'radial-gradient(1100px 560px at 85% -10%,rgba(209,174,85,.18),transparent 60%),#EEE7D8'}},
  banknote: {mode: 'light', pv: ['#E4EFE6', '#123A2B', '#F7FBF7', '#1B5A40', '#D9B95E', '#13704B'],
    t: {'--bg':'#E4EFE6','--surface':'#F7FBF7','--field':'#FFFFFF','--ink':'#0F2A1F','--ink-2':'#4C6A5B','--line':'rgba(15,42,31,.14)','--navy':'#123A2B','--hero-bg':'#123A2B','--on-navy':'#EAF6EE','--on-navy-2':'#A9CBB8','--nav-line':'rgba(234,246,238,.15)','--gold-ui':'#D9B95E','--gold':'#6E5A10','--brass':'#6E5A10','--focus':'#13704B','--g1':'#FBFEFA','--g2':'#EDF5EE','--track':'rgba(15,42,31,.16)','--shadow':'rgba(15,60,40,.12)','--hero-label':'#2E5A46','--hero-val':'#13704B','--hero-grad':'linear-gradient(135deg,rgba(19,112,75,.16),#F7FBF7 65%)','--hero-bd':'rgba(19,112,75,.38)','--c1':'#13704B','--c2':'#C69A2E','--c3':'#B85A43','--c4':'#2D6FA3',
       '--sk-rail':'linear-gradient(180deg,#154532,#0F3125)','--sk-hh':'repeating-radial-gradient(circle at 100% 0,rgba(217,185,94,.13) 0 1px,transparent 1px 7px),linear-gradient(135deg,#1B5A40,#123A2B 60%,#0D2A1F)','--sk-hh-bd':'rgba(217,185,94,.55)','--sk-hh-l':'#CFE6D7','--sk-hh-v':'#F0DC98','--sk-hh-s':'#A9CBB8','--sk-bottom':'rgba(15,49,37,.94)','--sk-body':'repeating-radial-gradient(circle at 0 0,rgba(19,112,75,.05) 0 1px,transparent 1px 11px),repeating-radial-gradient(circle at 100% 100%,rgba(19,112,75,.05) 0 1px,transparent 1px 11px),#E4EFE6'}},
  deadsea: {mode: 'dark', pv: ['#05181A', '#041315', '#0B2A2D', '#0F4D4A', '#5EDFCB', '#F3EAD6'],
    t: {'--bg':'#05181A','--surface':'#0B2A2D','--field':'#082124','--ink':'#E6F5F2','--ink-2':'#8DB3AD','--line':'rgba(230,245,242,.10)','--navy':'#041315','--hero-bg':'#0B2A2D','--on-navy':'#E6F5F2','--on-navy-2':'#8DB3AD','--nav-line':'rgba(230,245,242,.10)','--gold-ui':'#5EDFCB','--gold':'#5EDFCB','--brass':'#5EDFCB','--focus':'#5EDFCB','--g1':'rgba(230,245,242,.055)','--g2':'rgba(230,245,242,.02)','--track':'rgba(230,245,242,.14)','--shadow':'rgba(0,0,0,.35)','--hero-label':'#BFE3DC','--hero-val':'#F3EAD6','--hero-grad':'linear-gradient(135deg,rgba(94,223,203,.20),rgba(11,42,45,.92) 62%)','--hero-bd':'rgba(94,223,203,.35)','--c1':'#5EDFCB','--c2':'#F2C46B','--c3':'#F07A68','--c4':'#7FB8FF',
       '--sk-rail':'linear-gradient(180deg,#07211F,#041315)','--sk-hh':'linear-gradient(135deg,#0F4D4A,#0A2F31 55%,#061C1E)','--sk-hh-bd':'rgba(94,223,203,.45)','--sk-hh-l':'#BFE3DC','--sk-hh-v':'#F3EAD6','--sk-hh-s':'#8DB3AD','--sk-bottom':'rgba(4,22,24,.92)','--sk-body':'radial-gradient(1100px 560px at 80% -10%,rgba(94,223,203,.12),transparent 60%),radial-gradient(800px 500px at 0% 100%,rgba(243,234,214,.05),transparent 60%),#05181A'}},
  eilat: {mode: 'dark', pv: ['#160B20', '#110718', '#22132F', '#C2456E', '#FF9F6E', '#FFD38A'],
    t: {'--bg':'#160B20','--surface':'#22132F','--field':'#1B0F27','--ink':'#FBEFF3','--ink-2':'#B89DB5','--line':'rgba(251,239,243,.10)','--navy':'#110718','--hero-bg':'#22132F','--on-navy':'#FBEFF3','--on-navy-2':'#B89DB5','--nav-line':'rgba(251,239,243,.10)','--gold-ui':'#FF9F6E','--gold':'#FF9F6E','--brass':'#FF9F6E','--focus':'#FFB38A','--g1':'rgba(251,239,243,.055)','--g2':'rgba(251,239,243,.02)','--track':'rgba(251,239,243,.14)','--shadow':'rgba(0,0,0,.4)','--hero-label':'#F2C7B6','--hero-val':'#FFD38A','--hero-grad':'linear-gradient(135deg,rgba(255,120,92,.26),rgba(34,19,47,.92) 62%)','--hero-bd':'rgba(255,159,110,.40)','--c1':'#FF9F6E','--c2':'#FFD38A','--c3':'#FF6B8B','--c4':'#8FD3FF',
       '--sk-rail':'linear-gradient(180deg,#1E0F2B,#110718)','--sk-hh':'linear-gradient(160deg,#FF7A59 0%,#C2456E 38%,#4A1D5C 78%,#2A1238 100%)','--sk-hh-bd':'rgba(255,159,110,.5)','--sk-hh-l':'#FFE3D6','--sk-hh-v':'#FFF1C9','--sk-hh-s':'#F6C9C9','--sk-bottom':'rgba(17,7,24,.92)','--sk-body':'radial-gradient(900px 420px at 50% -8%,rgba(255,122,89,.20),transparent 62%),radial-gradient(800px 500px at 100% 0%,rgba(194,69,110,.14),transparent 60%),#160B20'}},
  terminal: {mode: 'dark', mono: true, pv: ['#000000', '#000000', '#0C0A06', '#0C0A06', '#FFB000', '#FFB000'],
    t: {'--bg':'#000000','--surface':'#0C0A06','--field':'#070603','--ink':'#FFC247','--ink-2':'#B88B2C','--line':'rgba(255,176,0,.20)','--navy':'#000000','--hero-bg':'#0C0A06','--on-navy':'#FFC247','--on-navy-2':'#B88B2C','--nav-line':'rgba(255,176,0,.22)','--gold-ui':'#FFB000','--gold':'#FFB000','--brass':'#FFB000','--focus':'#FFB000','--g1':'rgba(255,176,0,.04)','--g2':'rgba(255,176,0,.015)','--track':'rgba(255,176,0,.22)','--shadow':'rgba(0,0,0,.6)','--hero-label':'#B88B2C','--hero-val':'#FFB000','--hero-grad':'linear-gradient(135deg,rgba(255,176,0,.10),#0C0A06 62%)','--hero-bd':'rgba(255,176,0,.45)','--c1':'#FFB000','--c2':'#3FD3FF','--c3':'#FF5A4E','--c4':'#4CE07A',
       '--sk-rail':'#000000','--sk-hh':'#0C0A06','--sk-hh-bd':'rgba(255,176,0,.55)','--sk-hh-l':'#B88B2C','--sk-hh-v':'#FFB000','--sk-hh-s':'#B88B2C','--sk-bottom':'rgba(0,0,0,.95)','--sk-body':'#000000'}}
};
const SKIN_PV = {dark: ['#060C1C', '#0A1226', '#0E1830', '#6b4d12', '#F2C45A', '#FFE29A'], light: ['#EDF1F8', '#0A1226', '#FFFFFF', '#6b4d12', '#F2C45A', '#0D9A66']};
const SKIN_ORDER = ['system', 'dark', 'light', 'telaviv', 'jerusalem', 'banknote', 'deadsea', 'eilat', 'terminal'];
/* ---- holiday themes (Jewish, Christian, Muslim) and automatic switching during the holiday ---- */
function mkSkin(o){
  const L = o.mode === 'light';
  const t = {'--bg':o.bg,'--surface':o.surface,'--field':o.field || (L ? '#FFFFFF' : o.surface),'--ink':o.ink,'--ink-2':o.ink2,'--line':o.line,
    '--navy':o.navy,'--hero-bg':o.surface,'--on-navy':o.onNavy,'--on-navy-2':o.onNavy2,'--nav-line':o.navLine || 'rgba(255,255,255,.14)',
    '--gold-ui':o.acc,'--gold':o.accText || o.acc,'--brass':o.accText || o.acc,'--focus':o.focus || o.accText || o.acc,
    '--g1':L ? '#FFFFFF' : 'rgba(255,255,255,.055)','--g2':L ? o.bg : 'rgba(255,255,255,.02)','--track':L ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.14)','--shadow':L ? 'rgba(0,0,0,.10)' : 'rgba(0,0,0,.38)',
    '--hero-label':o.ink2,'--hero-val':o.heroVal,'--hero-grad':'linear-gradient(135deg,' + o.heroTint + ',' + o.surface + ' 64%)','--hero-bd':o.heroBd,
    '--c1':o.c[0],'--c2':o.c[1],'--c3':o.c[2],'--c4':o.c[3],
    '--sk-rail':o.rail,'--sk-hh':o.hh,'--sk-hh-bd':o.hhBd,'--sk-hh-l':o.hhL,'--sk-hh-v':o.hhV,'--sk-hh-s':o.hhS,'--sk-bottom':o.bottom,'--sk-body':o.body};
  return {mode: o.mode, group: o.group, pv: [o.bg, o.navy, o.surface, o.hh, o.acc, o.hhV], t};
}
const CANDLES = [10, 20, 30, 40, 60, 70, 80, 90].map(x => 'radial-gradient(7px 12px at ' + x + '% 86%,rgba(255,210,122,.95),transparent 75%)').join(',') + ',radial-gradient(8px 14px at 50% 74%,rgba(255,226,150,1),transparent 75%)';
Object.assign(SKINS, {
  roshhashana: mkSkin({group:'j', mode:'dark', bg:'#1C070E', surface:'#2B0D17', field:'#230A13', ink:'#FFF1E6', ink2:'#D2A9A3', line:'rgba(255,241,230,.10)', navy:'#15050A', onNavy:'#FFF1E6', onNavy2:'#D2A9A3', acc:'#F4B942', heroVal:'#F4B942', heroTint:'rgba(244,185,66,.20)', heroBd:'rgba(244,185,66,.38)', c:['#F4B942','#E04A5F','#8CCB5E','#F59E6B'],
    rail:'linear-gradient(180deg,#260A13,#15050A)', hh:'radial-gradient(130px 100px at 86% 18%,rgba(244,185,66,.38),transparent 70%),linear-gradient(140deg,#9E1B32 0%,#6E1024 50%,#3A0814 100%)', hhBd:'rgba(244,185,66,.5)', hhL:'#FFD9C7', hhV:'#FFD36B', hhS:'#E8B3A8', bottom:'rgba(21,5,10,.93)', body:'radial-gradient(900px 480px at 85% -10%,rgba(244,185,66,.14),transparent 60%),radial-gradient(700px 400px at 0% 100%,rgba(179,38,62,.18),transparent 60%),#1C070E'}),
  hanukkah: mkSkin({group:'j', mode:'dark', bg:'#081333', surface:'#0F1E4A', field:'#0B1840', ink:'#EEF4FF', ink2:'#9FB3DE', line:'rgba(238,244,255,.11)', navy:'#050D26', onNavy:'#EEF4FF', onNavy2:'#9FB3DE', acc:'#9CC8FF', heroVal:'#FFD27A', heroTint:'rgba(156,200,255,.18)', heroBd:'rgba(156,200,255,.38)', c:['#9CC8FF','#FFD27A','#F27D72','#62D2A2'],
    rail:'linear-gradient(180deg,#0B1A45,#050D26)', hh:CANDLES + ',linear-gradient(135deg,#1B3A8C,#10255E 55%,#0A1840)', hhBd:'rgba(156,200,255,.45)', hhL:'#CFE0FF', hhV:'#F2F6FF', hhS:'#A9BFEA', bottom:'rgba(5,13,38,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(156,200,255,.14),transparent 60%),#081333'}),
  passover: mkSkin({group:'j', mode:'light', bg:'#EEF5E8', surface:'#FFFFFF', ink:'#2B1D16', ink2:'#6A5F52', line:'rgba(43,29,22,.13)', navy:'#5C1428', onNavy:'#FBEFF2', onNavy2:'#E2B9C3', acc:'#E9C46A', accText:'#8C1D3A', heroVal:'#8C1D3A', heroTint:'rgba(140,29,58,.12)', heroBd:'rgba(140,29,58,.32)', c:['#8C1D3A','#C99A2E','#4E8F3A','#2E6FA0'],
    rail:'linear-gradient(180deg,#6B1830,#4A0F21)', hh:'repeating-linear-gradient(0deg,rgba(120,70,20,.10) 0 2px,transparent 2px 9px),radial-gradient(circle,rgba(120,70,20,.16) 1px,transparent 1.6px) 0 0/14px 14px,linear-gradient(135deg,#F1DFB5,#E4C98E)', hhBd:'rgba(140,29,58,.35)', hhL:'#6B4A1C', hhV:'#5C1428', hhS:'#7A5A2C', bottom:'rgba(74,15,33,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(78,143,58,.16),transparent 60%),#EEF5E8'}),
  christmas: mkSkin({group:'c', mode:'dark', bg:'#071F15', surface:'#0D2E20', field:'#0A2619', ink:'#F4FAF6', ink2:'#A3C2B1', line:'rgba(244,250,246,.10)', navy:'#04160E', onNavy:'#F4FAF6', onNavy2:'#A3C2B1', acc:'#F2C14E', heroVal:'#F2C14E', heroTint:'rgba(229,72,77,.20)', heroBd:'rgba(242,193,78,.38)', c:['#F2C14E','#E5484D','#5FD08F','#9CC8FF'],
    rail:'linear-gradient(180deg,#0A2A1C,#04160E)', hh:'radial-gradient(rgba(255,255,255,.55) 1px,transparent 1.7px) 0 0/22px 22px,linear-gradient(140deg,#B3202E 0%,#7A1420 45%,#0D3B26 100%)', hhBd:'rgba(242,193,78,.5)', hhL:'#FFE1DD', hhV:'#FFE7A3', hhS:'#F3C2BD', bottom:'rgba(4,22,14,.93)', body:'radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.5px) 0 0/26px 26px,radial-gradient(900px 480px at 80% -10%,rgba(229,72,77,.16),transparent 60%),#071F15'}),
  easter: mkSkin({group:'c', mode:'light', bg:'#F2EEFB', surface:'#FFFFFF', ink:'#241B3A', ink2:'#6A6185', line:'rgba(36,27,58,.12)', navy:'#4B3A86', onNavy:'#F7F4FF', onNavy2:'#CFC6F0', acc:'#F6C945', accText:'#6A45C9', heroVal:'#6A45C9', heroTint:'rgba(106,69,201,.12)', heroBd:'rgba(106,69,201,.30)', c:['#6A45C9','#E8A92A','#3FAE84','#E46A8F'],
    rail:'linear-gradient(180deg,#56449A,#3E3074)', hh:'radial-gradient(90px 90px at 86% 16%,rgba(246,201,69,.6),transparent 70%),linear-gradient(135deg,#B7A4F2 0%,#8E73E3 45%,#6A45C9 100%)', hhBd:'rgba(246,201,69,.55)', hhL:'#F3EEFF', hhV:'#FFF3B8', hhS:'#E7DEFF', bottom:'rgba(62,48,116,.94)', body:'linear-gradient(180deg,#F2EEFB 0%,#EEF7F2 100%)'}),
  newyear: mkSkin({group:'c', mode:'dark', bg:'#0B0A14', surface:'#17142A', field:'#120F22', ink:'#F7F3FF', ink2:'#A9A2C8', line:'rgba(247,243,255,.10)', navy:'#07060E', onNavy:'#F7F3FF', onNavy2:'#A9A2C8', acc:'#E8C77A', heroVal:'#E8C77A', heroTint:'rgba(232,199,122,.16)', heroBd:'rgba(232,199,122,.38)', c:['#E8C77A','#8FB8FF','#F28AB2','#7CE0B5'],
    rail:'linear-gradient(180deg,#120F22,#07060E)', hh:'radial-gradient(circle at 15% 25%,#F28AB2 0 2px,transparent 2.6px),radial-gradient(circle at 35% 70%,#8FB8FF 0 2px,transparent 2.6px),radial-gradient(circle at 58% 28%,#E8C77A 0 2.4px,transparent 3px),radial-gradient(circle at 86% 62%,#7CE0B5 0 2px,transparent 2.6px),radial-gradient(circle at 74% 14%,#F28AB2 0 1.6px,transparent 2.2px),radial-gradient(circle at 26% 48%,#E8C77A 0 1.6px,transparent 2.2px),linear-gradient(135deg,#2A2150,#16122C 60%,#0E0B1D)', hhBd:'rgba(232,199,122,.5)', hhL:'#D9D1F5', hhV:'#F6E2A8', hhS:'#B6AED6', bottom:'rgba(7,6,14,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(232,199,122,.12),transparent 60%),#0B0A14'}),
  ramadan: mkSkin({group:'m', mode:'dark', bg:'#0A0D2A', surface:'#141A45', field:'#0F1438', ink:'#F3F1FF', ink2:'#A7AAD6', line:'rgba(243,241,255,.10)', navy:'#060820', onNavy:'#F3F1FF', onNavy2:'#A7AAD6', acc:'#E9C46A', heroVal:'#E9C46A', heroTint:'rgba(233,196,106,.16)', heroBd:'rgba(233,196,106,.38)', c:['#E9C46A','#7FB2FF','#E57C8E','#5FD3B0'],
    rail:'linear-gradient(180deg,#0E1338,#060820)', hh:'radial-gradient(circle at 86.5% 19%,#1E2560 0 12px,transparent 12.5px),radial-gradient(circle at 84% 23%,#F5D98C 0 14px,transparent 14.5px),radial-gradient(circle at 62% 16%,rgba(255,255,255,.8) 0 1.2px,transparent 1.8px),radial-gradient(circle at 72% 42%,rgba(255,255,255,.7) 0 1px,transparent 1.6px),radial-gradient(circle at 93% 48%,rgba(255,255,255,.7) 0 1px,transparent 1.6px),radial-gradient(160px 90px at 20% 100%,rgba(233,160,70,.28),transparent 70%),linear-gradient(160deg,#27306E 0%,#141A45 60%,#0B0F2E)', hhBd:'rgba(233,196,106,.5)', hhL:'#D7D9FF', hhV:'#F5D98C', hhS:'#B3B6E0', bottom:'rgba(6,8,32,.93)', body:'radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.6px) 0 0/34px 34px,radial-gradient(900px 480px at 80% -10%,rgba(233,196,106,.10),transparent 60%),#0A0D2A'}),
  eidfitr: mkSkin({group:'m', mode:'light', bg:'#EAF5EF', surface:'#FFFFFF', ink:'#10281E', ink2:'#4F6D5F', line:'rgba(16,40,30,.12)', navy:'#0B4A35', onNavy:'#EFFAF4', onNavy2:'#A9D6C1', acc:'#E2B84B', accText:'#0E7A55', heroVal:'#0E7A55', heroTint:'rgba(14,122,85,.14)', heroBd:'rgba(14,122,85,.32)', c:['#0E7A55','#D4A53A','#2D79B5','#C2556B'],
    rail:'linear-gradient(180deg,#0E5A41,#083826)', hh:'conic-gradient(from 45deg,rgba(226,184,75,.20) 25%,transparent 0 50%,rgba(226,184,75,.20) 0 75%,transparent 0) 0 0/26px 26px,linear-gradient(135deg,#118A60,#0B5E43 55%,#073F2D)', hhBd:'rgba(226,184,75,.55)', hhL:'#D2F0E2', hhV:'#F7DE8F', hhS:'#A9D6C1', bottom:'rgba(8,56,38,.94)', body:'radial-gradient(1000px 520px at 85% -10%,rgba(226,184,75,.16),transparent 60%),#EAF5EF'}),
  eidadha: mkSkin({group:'m', mode:'dark', bg:'#1B130C', surface:'#2A1D12', field:'#22180F', ink:'#FFF4E6', ink2:'#CDB49A', line:'rgba(255,244,230,.10)', navy:'#120C07', onNavy:'#FFF4E6', onNavy2:'#CDB49A', acc:'#F2A93B', heroVal:'#F2C46B', heroTint:'rgba(242,169,59,.18)', heroBd:'rgba(242,169,59,.38)', c:['#F2A93B','#3CC6C0','#E0645A','#9FD36B'],
    rail:'linear-gradient(180deg,#24180E,#120C07)', hh:'radial-gradient(150px 90px at 14% 14%,rgba(60,198,192,.26),transparent 70%),linear-gradient(170deg,#E08A2E 0%,#A44A2A 45%,#4A2414 100%)', hhBd:'rgba(242,169,59,.5)', hhL:'#FFE2C2', hhV:'#FFF0C9', hhS:'#F0C7A6', bottom:'rgba(18,12,7,.93)', body:'radial-gradient(900px 480px at 50% -10%,rgba(242,169,59,.14),transparent 60%),#1B130C'})
});
const SKIN_HOL = {j: ['roshhashana', 'hanukkah', 'passover'], c: ['christmas', 'easter', 'newyear'], m: ['ramadan', 'eidfitr', 'eidadha']};
function holHeb(d){ try { const p = new Intl.DateTimeFormat('en-u-ca-hebrew', {month: 'long', day: 'numeric'}).formatToParts(d); return [p.find(x => x.type === 'month').value, +p.find(x => x.type === 'day').value]; } catch (e) { return null; } }
function holIsl(d){ try { const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {month: 'numeric', day: 'numeric'}).formatToParts(d); return [+p.find(x => x.type === 'month').value, +p.find(x => x.type === 'day').value]; } catch (e) { return null; } }
function easterW(y){ const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114; return new Date(y, Math.floor(n / 31) - 1, n % 31 + 1); }
function easterO(y){ const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, n = d + e + 114, j = new Date(y, Math.floor(n / 31) - 1, n % 31 + 1); j.setDate(j.getDate() + 13); return j; }
function holidayNow(d){
  const pick = SET.holAuto; if (!pick || pick === '0') return '';
  d = d || new Date();
  const on = g => pick === 'all' || pick === g, he = holHeb(d), is = holIsl(d), mo = d.getMonth() + 1, da = d.getDate();
  const inH = segs => he && segs.some(([m, a, b]) => he[0] === m && he[1] >= a && he[1] <= b);
  const inI = segs => is && segs.some(([m, a, b]) => is[0] === m && is[1] >= a && is[1] <= b);
  const inG = segs => segs.some(([m, a, b]) => mo === m && da >= a && da <= b);
  const day = new Date(d.getFullYear(), mo - 1, da), near = e => { const x = (day - e) / 864e5; return x >= -7 && x <= 1; };
  if (on('jewish')){ if (inH([['Elul', 22, 30], ['Tishri', 1, 3]])) return 'roshhashana'; if (inH([['Kislev', 24, 30], ['Tevet', 1, 3]])) return 'hanukkah'; if (inH([['Nisan', 10, 22]])) return 'passover'; }
  if (on('muslim')){ if (inI([[9, 1, 30]])) return 'ramadan'; if (inI([[10, 1, 4]])) return 'eidfitr'; if (inI([[12, 8, 13]])) return 'eidadha'; }
  if (on('christian')){ if (inG([[12, 10, 27], [1, 5, 8]])) return 'christmas'; if (inG([[12, 28, 31], [1, 1, 2]])) return 'newyear'; const y = d.getFullYear(); if (near(easterW(y)) || near(easterO(y))) return 'easter'; }
  return '';
}
var HOL_ACTIVE = '';
(function skinCss(){
  let css = '';
  for (const k in SKINS){ css += ':root[data-skin="' + k + '"]{' + Object.entries(SKINS[k].t).map(([p, v]) => p + ':' + v).join(';') + '}\n'; }
  const st = document.createElement('style'); st.id = 'skin-css'; st.textContent = css; document.head.appendChild(st);
})();
function skinFont(){
  const eff = HOL_ACTIVE || SET.theme; if (SKINS[eff] && SKINS[eff].mono && !document.getElementById('font-mono')){
    const l = document.createElement('link'); l.id = 'font-mono'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap'; document.head.appendChild(l);
  }
}
function applyTheme(){
  HOL_ACTIVE = holidayNow();
  const eff = HOL_ACTIVE || SET.theme, sk = SKINS[eff];
  const th = sk ? sk.mode : eff === 'system' ? (mq && mq.matches ? 'light' : 'dark') : eff;
  const r = document.documentElement;
  r.dataset.theme = th;
  if (sk) r.dataset.skin = eff; else delete r.dataset.skin;
  if (sk && SET.accentFor !== eff){ ['--gold-ui', '--gold', '--brass'].forEach(p => r.style.removeProperty(p)); }
  else {
    const a = AC[SET.accent] || AC.gold, g = th === 'light' ? a[1] : a[0];
    r.style.setProperty('--gold-ui', a[0]); r.style.setProperty('--gold', g); r.style.setProperty('--brass', g);
  }
  r.dataset.contrast = SET.contrast; r.dataset.motion = SET.motion; r.dataset.font = SET.font; r.dataset.sliders = SET.sliders;
  skinFont();
  const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = sk ? sk.t['--navy'] : '#0A1226';
}
function applySize(){ document.documentElement.style.fontSize = {s:'14px', m:'16px', l:'18px'}[SET.size] || '16px'; }
applyTheme(); applySize();
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (SET.theme === 'system') applyTheme(); });
const langIdx = () => lang === 'he' ? 0 : lang === 'ar' ? 1 : 2;
const isRtl = () => RTL.has(lang.split('-')[0]);
const locOf = () => {
  const base = {he:'he-IL', ar:'ar', en:'en-US'}[lang] || lang;
  return SET.digits === 'latn' ? base + '-u-nu-latn' : base;
};
const pinList = () => (SET.favCur || []).filter(c => RATES[c]).concat(PIN.filter(c => !(SET.favCur || []).includes(c)));
const NOHIDE = ['home', 'markets', 'settings'];
function normOrder(){
  if (SET.orderV !== 2){ SET.order = null; SET.orderV = 2; }
  const o = (SET.order || []).filter(id => TABS.includes(id));
  TABS.forEach((id, i) => {
    if (o.includes(id)) return;
    const next = TABS.slice(i + 1).find(x => o.includes(x));
    if (next) o.splice(o.indexOf(next), 0, id); else o.push(id);
  });
  SET.order = o;
}
const isVisible = id => NOHIDE.includes(id) || !SET.hidden.includes(id);
function viewGroups(){
  normOrder();
  const g = GROUPS.map(([gk, ids]) => [gk, ids.filter(isVisible).sort((a, b) => SET.order.indexOf(a) - SET.order.indexOf(b))]).filter(x => x[1].length);
  if (SET.sort !== 'alpha' && SET.sort !== 'groupsAlpha') return g;
  let cmp; try { cmp = new Intl.Collator(locOf()).compare; } catch (e) { cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0; }
  if (SET.sort === 'groupsAlpha') return g.map(([gk, ids]) => [gk, gk === 'g_main' ? ids : ids.slice().sort((a, b) => cmp(t('tab_' + a), t('tab_' + b)))]);   // A-Z inside each category
  const main = g.filter(x => x[0] === 'g_main');
  const rest = g.filter(x => x[0] !== 'g_main').flatMap(x => x[1]);
  rest.sort((a, b) => cmp(t('tab_' + a), t('tab_' + b)));
  return main.concat(rest.length ? [['g_all', rest]] : []);
}
let baseCur = null;
const effCur = id => { const c = SET.curBy && SET.curBy[id]; return c && RATES[c] ? c : baseCur; };
