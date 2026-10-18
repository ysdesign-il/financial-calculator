/* ================= CV builder: styled CVs drawn on canvas (the same drawing is the live preview, the PDF, the print and the image) =================
   Data stays on the device (per signed-in account, encrypted with the rest of the account data). Members only, like the advanced calculators. */
const CV_KEY = 'fin-cv';
try { if (Array.isArray(DATA_KEYS) && !DATA_KEYS.includes(CV_KEY)) DATA_KEYS.push(CV_KEY); } catch (e) {}
const CV_TPLS = ['modern', 'classic', 'minimal', 'bold', 'elegant', 'ats'];
const CV_COLORS = ['#2A5FD6', '#0F766E', '#7C3AED', '#B91C1C', '#C2410C', '#0E7490', '#1F2937', '#9A6A06', '#BE185D', '#15803D'];
const CV_FONTS = {
  sans: '"IBM Plex Sans Hebrew","IBM Plex Sans Arabic",Arial,sans-serif',
  heebo: 'Heebo,"IBM Plex Sans Arabic",Arial,sans-serif',
  rubik: 'Rubik,"IBM Plex Sans Arabic",Arial,sans-serif',
  serif: '"Frank Ruhl Libre","IBM Plex Sans Arabic",Georgia,serif'
};
const CV_SECS = ['summary', 'exp', 'edu', 'military', 'skills', 'langs', 'certs', 'courses', 'projects', 'vol', 'awards', 'hobbies', 'refs', 'custom'];
const CV_TEXTSEC = ['summary', 'hobbies'];
const CV_SIDE = ['skills', 'langs', 'certs', 'courses', 'hobbies'];
const CV_F = {
  exp: [['role', 'cv_fRole'], ['org', 'cv_fOrg'], ['city', 'cv_fCity'], ['from', 'cv_fFrom', 'month'], ['to', 'cv_fTo', 'month'], ['now', 'cv_fNow', 'check'], ['desc', 'cv_fDesc', 'area']],
  edu: [['degree', 'cv_fDegree'], ['school', 'cv_fSchool'], ['city', 'cv_fCity'], ['from', 'cv_fFrom', 'month'], ['to', 'cv_fTo', 'month'], ['now', 'cv_fNowStudy', 'check'], ['desc', 'cv_fDesc', 'area']],
  military: [['role', 'cv_fRole'], ['org', 'cv_fUnit'], ['from', 'cv_fFrom', 'month'], ['to', 'cv_fTo', 'month'], ['desc', 'cv_fDesc', 'area']],
  skills: [['n', 'cv_fSkill'], ['lvl', 'cv_fLevel', 'lvl']],
  langs: [['n', 'cv_fLang'], ['lvl', 'cv_fLevel', 'glvl']],
  certs: [['n', 'cv_fCert'], ['org', 'cv_fIssuer'], ['year', 'cv_fYear']],
  courses: [['n', 'cv_fCert'], ['org', 'cv_fIssuer'], ['year', 'cv_fYear']],
  projects: [['n', 'cv_fProject'], ['link', 'cv_fLink', 'url'], ['desc', 'cv_fDesc', 'area']],
  vol: [['role', 'cv_fRole'], ['org', 'cv_fOrg'], ['from', 'cv_fFrom', 'month'], ['to', 'cv_fTo', 'month'], ['desc', 'cv_fDesc', 'area']],
  awards: [['n', 'cv_fAward'], ['year', 'cv_fYear'], ['desc', 'cv_fDesc', 'area']],
  refs: [['n', 'cv_fRefName'], ['role', 'cv_fRefRole'], ['contact', 'cv_fRefContact']],
  custom: [['title', 'cv_fTitle'], ['desc', 'cv_fText', 'area']]
};
const CV_P = [['name', 'cv_fFull'], ['title', 'cv_fHeadline'], ['email', 'cv_fEmail', 'email'], ['phone', 'cv_fPhone', 'tel'], ['city', 'cv_fCityRes'], ['linkedin', 'cv_fLinkedin', 'url'], ['site', 'cv_fSite', 'url'], ['birth', 'cv_fBirth'], ['license', 'cv_fLicense'], ['avail', 'cv_fAvail']];
var CV = {db: null, tab: 'edit', open: new Set(['personal', 'summary', 'exp']), timer: null, rt: null, imgs: {}, sure: '', aiOut: '', busy: false};
const cvE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const cvLangOk = l => ['he', 'ar', 'en'].includes(l) ? l : 'en';
function cvBlank(){
  const l = cvLangOk(typeof lang === 'string' ? lang : 'he');
  return {tpl: 'modern', color: CV_COLORS[0], font: l === 'en' ? 'heebo' : 'sans', size: 'M', photoShape: 'circle', lang: l, dates: 'month', skillStyle: 'bars',
    p: {}, photo: '', summary: '', hobbies: '', refsReq: true, cover: '', coverInc: false, order: CV_SECS.slice(), hide: ['courses', 'vol', 'awards', 'custom', 'projects'],
    titles: {}, notes: {}, bg: '', bgMode: 'page', bgFade: 'light',
    exp: [{}], edu: [{}], military: [], skills: [], langs: [], certs: [], courses: [], projects: [], vol: [], awards: [], refs: [], custom: []};
}
function cvFix(d){
  const b = cvBlank(); d = Object.assign(b, d || {}); d.p = Object.assign({}, d.p || {});
  CV_SECS.forEach(s => { if (!CV_TEXTSEC.includes(s) && !Array.isArray(d[s])) d[s] = []; });
  if (!Array.isArray(d.order)) d.order = CV_SECS.slice(); CV_SECS.forEach(s => { if (!d.order.includes(s)) d.order.push(s); }); d.order = d.order.filter(s => CV_SECS.includes(s));
  if (!Array.isArray(d.hide)) d.hide = [];
  if (!d.titles || typeof d.titles !== 'object') d.titles = {}; if (!d.notes || typeof d.notes !== 'object') d.notes = {};
  if (!CV_TPLS.includes(d.tpl)) d.tpl = 'modern'; if (!CV_FONTS[d.font]) d.font = 'sans'; d.lang = cvLangOk(d.lang);
  return d;
}
function cvLoad(){
  if (CV.db) return CV.db;
  const db = toolsLoad(CV_KEY, null);
  CV.db = db && Array.isArray(db.items) ? db : {v: 1, cur: '', items: []};
  CV.db.items.forEach(x => { x.d = cvFix(x.d); });
  if (!CV.db.items.length) cvNew();
  if (!CV.db.items.some(x => x.id === CV.db.cur)) CV.db.cur = CV.db.items[0].id;
  return CV.db;
}
function cvSaveSoon(){ clearTimeout(CV.timer); CV.timer = setTimeout(() => { try { toolsSave(CV_KEY, CV.db); } catch (e) {} const s = $('#cv_st'); if (s) s.textContent = '✓ ' + t('cv_saved'); }, 400); }
function cvCur(){ const db = cvLoad(); return db.items.find(x => x.id === db.cur) || db.items[0]; }
function cvNew(d, name){
  const it = {id: Math.random().toString(36).slice(2, 10), name: name || t('cv_untitled') + (CV.db.items.length ? ' ' + (CV.db.items.length + 1) : ''), at: Date.now(), d: cvFix(d || cvBlank())};
  CV.db.items.push(it); CV.db.cur = it.id; return it;
}
const cvCI = d => ({he: 0, ar: 1, en: 2})[cvLangOk(d.lang)];
const cvL = (d, k) => { const v = T[k]; return Array.isArray(v) ? v[cvCI(d)] : k; };
const cvRtl = d => d.lang !== 'en';

/* ---------- example content ---------- */
function cvSample(l){
  const S = {
    he: {p: {name: 'נועה לוי', title: 'מעצבת מוצר UX/UI', email: 'noa.levi@example.com', phone: '050-1234567', city: 'תל אביב', linkedin: 'linkedin.com/in/noalevi', site: 'noalevi.design', license: 'B', avail: 'מיידית'},
      summary: 'מעצבת מוצר עם 6 שנות ניסיון בבניית אפליקציות ואתרים למיליוני משתמשים. מחברת בין צרכי המשתמשים ליעדי העסק, מובילה מחקר משתמשים ומערכות עיצוב, ועובדת צמוד עם צוותי פיתוח.',
      exp: [{role: 'מעצבת מוצר בכירה', org: 'פינטק בע״מ', city: 'תל אביב', from: '2021-03', now: true, desc: 'הובלתי עיצוב מחדש של האפליקציה שהעלה את ההמרה ב־18%\nבניתי מערכת עיצוב משותפת ל־4 צוותי מוצר\nהנחיתי 2 מעצבות צעירות'},
        {role: 'מעצבת UX/UI', org: 'סטודיו פיקסל', city: 'רמת גן', from: '2018-06', to: '2021-02', desc: 'עיצבתי אתרים ואפליקציות ל־20 לקוחות\nערכתי מחקרי משתמשים ובדיקות שמישות'}],
      edu: [{degree: 'B.Des עיצוב תקשורת חזותית', school: 'שנקר', city: 'רמת גן', from: '2014-10', to: '2018-06', desc: 'פרויקט גמר מצטיין'}],
      military: [{role: 'מפקדת צוות', org: 'חיל המודיעין', from: '2012-08', to: '2014-08'}],
      skills: [{n: 'Figma', lvl: 5}, {n: 'מחקר משתמשים', lvl: 4}, {n: 'מערכות עיצוב', lvl: 5}, {n: 'אב־טיפוס', lvl: 4}, {n: 'HTML/CSS', lvl: 3}],
      langs: [{n: 'עברית', lvl: 5}, {n: 'אנגלית', lvl: 4}], certs: [{n: 'Google UX Design', org: 'Coursera', year: '2020'}],
      hobbies: 'צילום, ריצות ארוכות, התנדבות בהדרכת נוער'},
    ar: {p: {name: 'نور حداد', title: 'مصممة منتجات UX/UI', email: 'nour.haddad@example.com', phone: '050-1234567', city: 'حيفا', linkedin: 'linkedin.com/in/nourhaddad', site: 'nour.design', license: 'B', avail: 'فوري'},
      summary: 'مصممة منتجات بخبرة 6 سنوات في بناء تطبيقات ومواقع لملايين المستخدمين. أربط بين احتياجات المستخدمين وأهداف العمل، وأقود أبحاث المستخدمين وأنظمة التصميم.',
      exp: [{role: 'مصممة منتجات أولى', org: 'فينتك م.ض.', city: 'حيفا', from: '2021-03', now: true, desc: 'قدت إعادة تصميم التطبيق مما رفع التحويل 18%\nبنيت نظام تصميم مشتركًا لأربعة فرق'},
        {role: 'مصممة UX/UI', org: 'ستوديو بكسل', city: 'الناصرة', from: '2018-06', to: '2021-02', desc: 'صممت مواقع وتطبيقات لعشرين عميلًا\nأجريت أبحاث واختبارات قابلية الاستخدام'}],
      edu: [{degree: 'بكالوريوس تصميم اتصال بصري', school: 'التخنيون', city: 'حيفا', from: '2014-10', to: '2018-06'}],
      skills: [{n: 'Figma', lvl: 5}, {n: 'أبحاث المستخدمين', lvl: 4}, {n: 'أنظمة التصميم', lvl: 5}, {n: 'النماذج الأولية', lvl: 4}],
      langs: [{n: 'العربية', lvl: 5}, {n: 'العبرية', lvl: 4}, {n: 'الإنجليزية', lvl: 4}], certs: [{n: 'Google UX Design', org: 'Coursera', year: '2020'}],
      hobbies: 'التصوير، الجري، التطوع مع الشباب'},
    en: {p: {name: 'Noa Levi', title: 'Product Designer, UX/UI', email: 'noa.levi@example.com', phone: '+972 50 123 4567', city: 'Tel Aviv', linkedin: 'linkedin.com/in/noalevi', site: 'noalevi.design', avail: 'Immediately'},
      summary: 'Product designer with 6 years of experience building apps and websites used by millions. I connect user needs with business goals, lead user research and design systems, and work closely with engineering.',
      exp: [{role: 'Senior Product Designer', org: 'Fintech Ltd.', city: 'Tel Aviv', from: '2021-03', now: true, desc: 'Led the app redesign that lifted conversion by 18%\nBuilt a shared design system for 4 product teams\nMentored 2 junior designers'},
        {role: 'UX/UI Designer', org: 'Pixel Studio', city: 'Ramat Gan', from: '2018-06', to: '2021-02', desc: 'Designed websites and apps for 20 clients\nRan user research and usability testing'}],
      edu: [{degree: 'B.Des Visual Communication', school: 'Shenkar College', city: 'Ramat Gan', from: '2014-10', to: '2018-06', desc: 'Graduated with distinction'}],
      skills: [{n: 'Figma', lvl: 5}, {n: 'User research', lvl: 4}, {n: 'Design systems', lvl: 5}, {n: 'Prototyping', lvl: 4}, {n: 'HTML/CSS', lvl: 3}],
      langs: [{n: 'Hebrew', lvl: 5}, {n: 'English', lvl: 5}], certs: [{n: 'Google UX Design', org: 'Coursera', year: '2020'}],
      hobbies: 'Photography, long-distance running, youth mentoring'}
  };
  return S[cvLangOk(l)];
}

/* ---------- small helpers for the drawing ---------- */
function cvYM(d, ym){
  if (!ym) return ''; const m = /^(\d{4})(?:-(\d{1,2}))?/.exec(String(ym)); if (!m) return String(ym);
  if (d.dates === 'year' || !m[2]) return m[1];
  try { return new Intl.DateTimeFormat({he: 'he-IL', ar: 'ar', en: 'en-GB'}[d.lang], {month: 'short', year: 'numeric', numberingSystem: 'latn'}).format(new Date(+m[1], +m[2] - 1, 1)); } catch (e) { return m[2] + '/' + m[1]; }
}
function cvRange(d, it){ const a = cvYM(d, it.from), b = it.now ? cvL(d, 'cv_present') : cvYM(d, it.to); return a && b ? a + ' – ' + b : a || b || ''; }
const cvHasR = s => /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(s);
function cvImg(src){
  if (!src) return Promise.resolve(null);
  if (CV.imgs[src]) return CV.imgs[src];
  return (CV.imgs[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
}
function cvHex(h, a){ const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return `rgba(42,95,214,${a})`; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function cvDark(h){ const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return true; const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 < 165; }

/* ---------- the renderer ---------- */
const CV_W = 1190, CV_H = 1684;
async function cvFonts(d){
  const fam = CV_FONTS[d.font] || CV_FONTS.sans;
  try { await Promise.all(['400', '700'].map(w => document.fonts.load(w + ' 24px ' + fam, 'אבגabcابت'))); await document.fonts.load('400 24px "Frank Ruhl Libre"', 'אבג'); } catch (e) {}
}
async function cvRender(d0, opt){
  const d = cvFix(JSON.parse(JSON.stringify(d0))); opt = opt || {};
  await cvFonts(d);
  const photo = d.photoShape !== 'none' && d.tpl !== 'ats' ? await cvImg(d.photo) : null;
  const bgIm = d.bg ? await cvImg(d.bg) : null, bgA = {light: .16, medium: .3, strong: .5}[d.bgFade] || .16;
  const rtl = cvRtl(d), K = {S: .92, M: 1, L: 1.08}[d.size] || 1, F = n => Math.round(n * K);
  const fam = CV_FONTS[d.font] || CV_FONTS.sans, serif = CV_FONTS.serif;
  const tp = d.tpl, acc = tp === 'ats' ? '#111111' : (d.color || CV_COLORS[0]);
  const ink = '#1d2230', mut = '#5d6577', line = '#dfe3ea';
  const pages = [];
  const M = tp === 'minimal' ? 96 : tp === 'elegant' ? 100 : 76;
  /* geometry: one column, or main + side */
  const two = tp === 'modern' || tp === 'bold';
  const sideW = tp === 'modern' ? 390 : tp === 'bold' ? 400 : 0;
  const sideAtStart = tp === 'modern';
  const L0 = (x, w) => rtl ? CV_W - x - w : x;       // logical (start-based) → physical
  const geo = {};
  if (two){
    const sideX = sideAtStart ? 0 : CV_W - sideW;     // in start-based coordinates
    geo.side = {x: L0(sideX, sideW) + 46, w: sideW - 92};
    geo.main = sideAtStart ? {x: L0(sideW + 56, CV_W - sideW - 56 - M), w: CV_W - sideW - 56 - M} : {x: L0(M, CV_W - sideW - M - 50), w: CV_W - sideW - M - 50};
    geo.sideBand = {x: L0(sideX, sideW), w: sideW};
  } else geo.main = {x: M, w: CV_W - 2 * M};
  const bandH = tp === 'bold' ? 300 : 0;
  const onSide = tp === 'modern' ? (cvDark(acc) ? '#ffffff' : '#111111') : ink;
  const onSideMut = tp === 'modern' ? (cvDark(acc) ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.7)') : mut;
  function page(i){
    while (pages.length <= i){
      const c = document.createElement('canvas'); c.width = CV_W; c.height = CV_H; const cx = c.getContext('2d');
      cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, CV_W, CV_H);
      const n = pages.length;
      const cover = (x, y, w, h, a) => { const r = Math.max(w / bgIm.width, h / bgIm.height), iw = bgIm.width * r, ih = bgIm.height * r; cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip(); cx.globalAlpha = a; cx.drawImage(bgIm, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); cx.restore(); };
      if (bgIm && d.bgMode !== 'header') cover(0, 0, CV_W, CV_H, bgA);
      if (bgIm && d.bgMode === 'header' && n === 0 && tp !== 'bold'){ cover(0, 0, CV_W, 330, Math.min(1, bgA * 1.6)); const g = cx.createLinearGradient(0, 200, 0, 330); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#ffffff'); cx.fillStyle = g; cx.fillRect(0, 200, CV_W, 130); }
      if (tp === 'modern'){ cx.fillStyle = acc; cx.fillRect(geo.sideBand.x, 0, sideW, CV_H); }
      if (tp === 'bold'){
        cx.fillStyle = cvHex(acc, .07); cx.fillRect(geo.sideBand.x, n === 0 ? bandH : 0, sideW, CV_H);
        if (n === 0){ cx.fillStyle = acc; cx.fillRect(0, 0, CV_W, bandH); if (bgIm){ cover(0, 0, CV_W, bandH, Math.min(.85, bgA * 2.2)); cx.fillStyle = cvHex(acc, .45); cx.fillRect(0, 0, CV_W, bandH); } }
      }
      if (tp === 'elegant'){ cx.strokeStyle = cvHex(acc, .5); cx.lineWidth = 2; cx.strokeRect(34, 34, CV_W - 68, CV_H - 68); }
      pages.push(c);
    }
    return pages[i].getContext('2d');
  }
  const font = (cx, size, w, f) => { cx.font = `${w || 400} ${F(size)}px ${f || fam}`; };
  /* draw a string at a logical alignment inside [x, x+w] */
  function text(cx, s, x, y, w, al, color){
    s = String(s || ''); if (!s) return;
    cx.fillStyle = color || ink; cx.direction = cvHasR(s) ? 'rtl' : 'ltr';
    const phys = al === 'center' ? 'center' : ((al === 'end') !== rtl ? 'right' : 'left');
    cx.textAlign = phys; cx.fillText(s, phys === 'center' ? x + w / 2 : phys === 'right' ? x + w : x, y);
  }
  function wrap(cx, s, w){
    const out = [];
    String(s || '').split('\n').forEach(par => {
      const words = par.split(/\s+/).filter(Boolean); let cur = '';
      if (!words.length){ out.push(''); return; }
      words.forEach(wd => { const tt = cur ? cur + ' ' + wd : wd; if (cx.measureText(tt).width <= w || !cur) cur = tt; else { out.push(cur); cur = wd; } });
      if (cur) out.push(cur);
    });
    return out;
  }
  const scratch = document.createElement('canvas').getContext('2d');
  /* ----- ops: each knows its height and how to draw itself ----- */
  const OPS = {main: [], side: []};
  const col = k => (two ? (k === 'side' ? geo.side : geo.main) : geo.main);
  const isSide = k => k === 'side' && tp === 'modern';
  const C = k => isSide(k) ? {ink: onSide, mut: onSideMut, acc: onSide} : {ink, mut, acc};
  function push(k, op){ OPS[two ? k : 'main'].push(op); }
  function opGap(k, h){ push(k, {h: F(h), draw(){}}); }
  function opHead(k, s){
    const c = C(k), w = col(k).w, side = isSide(k);
    const H = F(tp === 'minimal' ? 54 : tp === 'elegant' ? 64 : 58);
    push(k, {h: H, keep: true, draw(cx, x, y){
      const base = y + H - F(20);
      if (tp === 'elegant'){
        font(cx, 25, 700, serif); text(cx, s, x, base, w, 'center', acc);
        const tw = Math.min(cx.measureText(s).width, w), gap = 22; cx.strokeStyle = cvHex(acc, .55); cx.lineWidth = 1.5;
        const mid = base - F(8); cx.beginPath(); cx.moveTo(x + 10, mid); cx.lineTo(x + w / 2 - tw / 2 - gap, mid); cx.moveTo(x + w / 2 + tw / 2 + gap, mid); cx.lineTo(x + w - 10, mid); cx.stroke();
        return;
      }
      if (tp === 'minimal'){
        font(cx, 19, 700); cx.save(); try { cx.letterSpacing = rtl ? '0px' : '3px'; } catch (e) {}
        text(cx, rtl ? s : s.toUpperCase(), x, base, w, 'start', mut); cx.restore();
        cx.fillStyle = acc; const tw = cx.measureText(s).width; cx.fillRect(rtl ? x + w - Math.min(tw, w) : x, base + F(10), 34, 4); return;
      }
      if (tp === 'bold' && !side && k === 'main'){
        font(cx, 27, 700); cx.fillStyle = acc; cx.fillRect(rtl ? x + w - 8 : x, base - F(24), 8, F(30)); text(cx, s, rtl ? x : x + 20, base, w - 20, 'start', acc); return;
      }
      font(cx, side ? 23 : 26, 700); text(cx, tp === 'classic' && !rtl ? s.toUpperCase() : s, x, base, w, 'start', side ? c.ink : tp === 'ats' ? ink : acc);
      const rw = side ? Math.min(w, 120) : w;
      cx.fillStyle = side ? cvHex(cvDark(acc) ? '#ffffff' : '#000000', .45) : tp === 'ats' ? '#222' : tp === 'classic' ? acc : cvHex(acc, .35);
      cx.fillRect(side && rtl ? x + w - rw : x, base + F(12), rw, tp === 'classic' ? 3 : 2);
    }});
  }
  function opLines(k, s, o){
    o = o || {}; const c = C(k), w = col(k).w - (o.bullet ? F(26) : 0);
    font(scratch, o.size || 20, o.weight || 400, o.f); const L = wrap(scratch, s, w);
    const lh = F((o.size || 20) * 1.5);
    L.forEach((ln, i) => push(k, {h: lh, keep: o.keep && i === 0, draw(cx, x, y){
      font(cx, o.size || 20, o.weight || 400, o.f);
      const bx = rtl ? x : x + F(26);
      if (o.bullet && i === 0){ cx.fillStyle = o.bulletColor || (isSide(k) ? c.ink : acc); const cxp = rtl ? x + col(k).w - F(9) : x + F(9); cx.beginPath(); cx.arc(cxp, y + lh * .62 - F(6), F(4), 0, 7); cx.fill(); }
      text(cx, ln, o.bullet ? bx : x, y + lh * .72, w, o.align || 'start', o.color || c.ink);
    }}));
  }
  function opItem(k, title, sub, date){
    const c = C(k), w = col(k).w, side = isSide(k) || (two && k === 'side');
    font(scratch, side ? 21 : 23, 700); const tw = scratch.measureText(title || '').width;
    font(scratch, 19, 400); const dw = date ? scratch.measureText(date).width : 0;
    const same = !side && date && tw + dw + 30 < w;
    opLines(k, title || sub || '', {size: side ? 21 : 23, weight: 700, keep: true});
    const last = OPS[two ? k : 'main'][OPS[two ? k : 'main'].length - 1];
    if (same){ const d0 = last.draw; last.draw = (cx, x, y) => { d0(cx, x, y); font(cx, 19, 400); text(cx, date, x, y + last.h * .72, w, 'end', c.mut); }; }
    if (title && sub) opLines(k, sub, {size: 20, color: tp === 'ats' ? mut : side ? c.mut : (tp === 'modern' || tp === 'bold') ? acc : c.mut, keep: true, weight: 500});
    if (date && !same) opLines(k, date, {size: 19, color: c.mut, keep: true});
  }
  function opDesc(k, s){ String(s || '').split('\n').map(x => x.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean).forEach(ln => opLines(k, ln, {size: 20, bullet: true, color: C(k).ink})); }
  function drawLevel(cx, k, x, y, w, name, lvl, label, st){
    const c = C(k);
    font(cx, 20, 500);
    if (st === 'bars'){
      text(cx, name, x, y + F(24), w, 'start', c.ink); if (label){ font(cx, 17, 400); text(cx, label, x, y + F(24), w, 'end', c.mut); }
      const by = y + F(36), bh = F(8);
      cx.fillStyle = isSide(k) ? cvHex(cvDark(acc) ? '#ffffff' : '#000000', .25) : cvHex(acc, .15); cx.fillRect(x, by, w, bh);
      cx.fillStyle = isSide(k) ? c.ink : acc; const fw = w * lvl / 5; cx.fillRect(rtl ? x + w - fw : x, by, fw, bh);
    } else {
      const r = F(7), gap = F(20), tot = 5 * gap; text(cx, name, x, y + F(27), w - tot - 10, 'start', c.ink);
      for (let i = 0; i < 5; i++){
        const cxp = rtl ? x + r + i * gap : x + w - r - (4 - i) * gap, on = rtl ? (4 - i) < lvl : i < lvl;
        cx.beginPath(); cx.arc(cxp, y + F(20), r, 0, 7); cx.fillStyle = on ? (isSide(k) ? c.ink : acc) : (isSide(k) ? cvHex(cvDark(acc) ? '#ffffff' : '#000000', .25) : cvHex(acc, .18)); cx.fill();
      }
    }
  }
  /* skill / language levels: one per line in a side column, two per row in a one-column layout */
  function opLevels(k, list){
    const st = tp === 'ats' ? 'text' : d.skillStyle;
    if (st === 'text'){ list.forEach(([n, , lb]) => opLines(k, n + (lb ? ' – ' + lb : ''), {size: 20})); return; }
    const per = two ? 1 : 2, H = F(st === 'bars' ? 56 : 40), gap = 48;
    for (let i = 0; i < list.length; i += per){
      const row = list.slice(i, i + per);
      push(k, {h: H, draw(cx, x, y, w){
        const cw = per === 1 ? w : (w - gap) / 2;
        row.forEach(([n, lv, lb], j) => { const cx0 = rtl ? x + w - (j + 1) * cw - j * gap : x + j * (cw + gap); drawLevel(cx, k, cx0, y, cw, n, Math.max(1, Math.min(5, +lv || 3)), lb, st); });
      }});
    }
  }
  function opTags(k, items){
    const c = C(k), w = col(k).w; font(scratch, 19, 500);
    const rows = [[]]; let cw = 0; const padX = F(16), gap = F(10);
    items.forEach(s => { const tw = scratch.measureText(s).width + 2 * padX; if (cw + tw > w && rows[rows.length - 1].length){ rows.push([]); cw = 0; } rows[rows.length - 1].push([s, tw]); cw += tw + gap; });
    rows.forEach(r => push(k, {h: F(48), draw(cx, x, y){
      font(cx, 19, 500); let px = 0;
      r.forEach(([s, tw]) => {
        const bx = rtl ? x + w - px - tw : x + px, by = y + F(6), bh = F(36);
        cx.fillStyle = isSide(k) ? cvHex(cvDark(acc) ? '#ffffff' : '#000000', .16) : cvHex(acc, .1); cx.beginPath();
        if (cx.roundRect) cx.roundRect(bx, by, tw, bh, bh / 2); else cx.rect(bx, by, tw, bh); cx.fill();
        cx.fillStyle = isSide(k) ? c.ink : tp === 'ats' ? ink : acc; cx.direction = cvHasR(s) ? 'rtl' : 'ltr'; cx.textAlign = 'center'; cx.fillText(s, bx + tw / 2, by + bh * .68);
        px += tw + gap;
      });
    }}));
  }
  /* contact rows */
  const P = d.p || {};
  const contacts = [['☎', P.phone], ['✉', P.email], ['⌂', P.city], ['in', P.linkedin], ['◆', P.site], ['', P.birth ? cvL(d, 'cv_fBirth').replace(/\s*\(.*\)/, '') + ': ' + P.birth : ''], ['', P.license ? cvL(d, 'cv_fLicense') + ': ' + P.license : ''], ['', P.avail ? cvL(d, 'cv_fAvail') + ': ' + P.avail : '']].filter(x => x[1]);
  function opContactList(k){
    contacts.forEach(([ic, v]) => {
      const c = C(k), w = col(k).w; font(scratch, 19, 400); const L = wrap(scratch, v, w - F(34));
      L.forEach((ln, i) => push(k, {h: F(31), draw(cx, x, y){
        if (i === 0 && ic){ font(cx, 15, 700, 'Arial'); cx.fillStyle = isSide(k) ? c.ink : acc; cx.direction = 'ltr'; cx.textAlign = 'center'; cx.fillText(ic, rtl ? x + w - F(11) : x + F(11), y + F(22)); }
        font(cx, 19, 400); text(cx, ln, rtl ? x : x + F(34), y + F(22), w - F(34), 'start', c.ink);
      }}));
    });
  }
  /* ----- sections ----- */
  const ST = s => String((d.titles || {})[s] || '').trim() || cvL(d, 'cv_s_' + s);
  function sec(k, s){
    if ((d.hide || []).includes(s)) return;
    const list = d[s], note = String((d.notes || {})[s] || '').trim();
    if (s === 'summary' || s === 'hobbies'){ const v = String(d[s] || '').trim(); if (!v) return; opHead(k, ST(s)); opLines(k, v, {size: 20}); opGap(k, 16); return; }
    if (s === 'refs'){
      if (!d.refsReq && !list.some(x => x.n) && !note) return;
      opHead(k, ST('refs'));
      if (d.refsReq) opLines(k, cvL(d, 'cv_refsReq'), {size: 20, color: mut});
      else list.filter(x => x.n).forEach(x => { opLines(k, x.n, {size: 21, weight: 700, keep: true}); if (x.role) opLines(k, x.role, {size: 19, color: C(k).mut}); if (x.contact) opLines(k, x.contact, {size: 19}); opGap(k, 8); });
      if (note) opLines(k, note, {size: 20});
      opGap(k, 16); return;
    }
    const items = (list || []).filter(x => Object.keys(x).some(f => f !== 'lvl' && f !== 'now' && String(x[f] || '').trim()));
    if (!items.length && !note) return;
    if (s === 'custom'){ items.forEach(x => { if (x.title) opHead(k, x.title); if (x.desc) opLines(k, x.desc, {size: 20}); opGap(k, 16); }); if (note){ opLines(k, note, {size: 20}); opGap(k, 16); } return; }
    opHead(k, ST(s));
    if (s === 'skills'){
      const st = tp === 'ats' ? 'text' : d.skillStyle;
      if (st === 'tags') opTags(k, items.map(x => x.n).filter(Boolean));
      else if (st === 'text') opLines(k, items.map(x => x.n).filter(Boolean).join(' · '), {size: 20});
      else opLevels(k, items.map(x => [x.n, x.lvl, '']));
    } else if (s === 'langs'){
      const st = tp === 'ats' ? 'text' : d.skillStyle;
      if (st === 'tags' || st === 'text') opLines(k, items.map(x => x.n + (x.lvl ? ' (' + cvL(d, 'cv_g' + x.lvl) + ')' : '')).join(' · '), {size: 20});
      else opLevels(k, items.map(x => [x.n, x.lvl || 3, cvL(d, 'cv_g' + (x.lvl || 3))]));
    } else if (s === 'certs' || s === 'courses'){
      items.forEach(x => { opLines(k, x.n, {size: 20, weight: 700, keep: true}); const sub = [x.org, x.year].filter(Boolean).join(' · '); if (sub) opLines(k, sub, {size: 18, color: C(k).mut}); opGap(k, 6); });
    } else if (s === 'awards'){
      items.forEach(x => { opItem(k, x.n, '', x.year); opDesc(k, x.desc); opGap(k, 10); });
    } else if (s === 'projects'){
      items.forEach(x => { opItem(k, x.n, x.link, ''); opDesc(k, x.desc); opGap(k, 10); });
    } else {
      items.forEach(x => {
        const title = s === 'edu' ? x.degree : x.role, sub = (s === 'edu' ? [x.school, x.city] : [x.org, x.city]).filter(Boolean).join(' · ');
        opItem(k, title, sub, cvRange(d, x)); opDesc(k, x.desc); opGap(k, 14);
      });
    }
    if (note) opLines(k, note, {size: 20});
    opGap(k, 14);
  }
  /* ----- header (page 1) ----- */
  const hdr = {main: M, side: M};
  const cx0 = page(0);
  const nm = P.name || '', ti = P.title || '';
  function drawPhoto(cx, x, y, sz){
    if (!photo) return; cx.save(); cx.beginPath();
    if (d.photoShape === 'square'){ if (cx.roundRect) cx.roundRect(x, y, sz, sz, sz * .12); else cx.rect(x, y, sz, sz); } else cx.arc(x + sz / 2, y + sz / 2, sz / 2, 0, 7);
    cx.clip(); const s = Math.min(photo.width, photo.height); cx.drawImage(photo, (photo.width - s) / 2, (photo.height - s) / 2, s, s, x, y, sz, sz); cx.restore();
  }
  const contactLine = contacts.slice(0, 6).map(c => c[1]).join('   |   ');
  if (tp === 'modern'){
    let y = 80; const sx = geo.side.x, sw = geo.side.w;
    if (photo){ const sz = 230; drawPhoto(cx0, sx + (sw - sz) / 2, y, sz); y += sz + 40; }
    hdr.side = y;
    const mx = geo.main.x, mw = geo.main.w; let my = 96;
    font(cx0, 56, 700); wrap(cx0, nm, mw).forEach(ln => { text(cx0, ln, mx, my + F(50), mw, 'start', ink); my += F(66); });
    if (ti){ font(cx0, 27, 500); text(cx0, ti, mx, my + F(26), mw, 'start', acc); my += F(48); }
    cx0.fillStyle = cvHex(acc, .9); cx0.fillRect(rtl ? mx + mw - 90 : mx, my + 6, 90, 6);
    hdr.main = my + 40;
    opHead('side', cvL(d, 'cv_s_contact')); opContactList('side'); opGap('side', 20);
  } else if (tp === 'bold'){
    const sz = 200, pad = 70; let tx = pad, tw = CV_W - 2 * pad;
    if (photo){ const px = rtl ? CV_W - pad - sz : pad; drawPhoto(cx0, px, (bandH - sz) / 2, sz); tw -= sz + 44; tx = rtl ? pad : pad + sz + 44; }
    const onB = cvDark(acc) ? '#ffffff' : '#111111';
    font(cx0, 58, 700); const L = wrap(cx0, nm, tw).slice(0, 2); let ty = bandH / 2 - (L.length * F(64) + (ti ? F(40) : 0)) / 2 + F(52);
    L.forEach(ln => { text(cx0, ln, tx, ty, tw, 'start', onB); ty += F(64); });
    if (ti){ font(cx0, 27, 500); text(cx0, ti, tx, ty - F(6), tw, 'start', cvDark(acc) ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.75)'); }
    hdr.main = bandH + 56; hdr.side = bandH + 56;
    opHead('side', cvL(d, 'cv_s_contact')); opContactList('side'); opGap('side', 20);
  } else {
    const W = CV_W - 2 * M; let y = tp === 'elegant' ? 96 : 84;
    const center = tp === 'classic' || tp === 'elegant';
    if (photo && tp === 'elegant'){ const sz = 170; drawPhoto(cx0, (CV_W - sz) / 2, y, sz); y += sz + 28; }
    let tx = M, tw = W;
    if (photo && (tp === 'classic' || tp === 'minimal')){ const sz = tp === 'minimal' ? 150 : 160; const px = (tp === 'minimal') !== rtl ? CV_W - M - sz : M; drawPhoto(cx0, px, y - 6, sz); tw = W - sz - 40; tx = (px === M) ? M + sz + 40 : M; }
    const nf = tp === 'elegant' ? serif : fam;
    font(cx0, tp === 'ats' ? 46 : tp === 'minimal' ? 62 : 56, tp === 'minimal' ? 400 : 700, nf);
    wrap(cx0, nm, tw).forEach(ln => { text(cx0, ln, tx, y + F(52), tw, center ? 'center' : 'start', tp === 'minimal' ? ink : tp === 'ats' ? ink : tp === 'elegant' ? ink : acc); y += F(tp === 'minimal' ? 72 : 64); });
    if (ti){ font(cx0, tp === 'ats' ? 24 : 26, 500, nf); text(cx0, ti, tx, y + F(22), tw, center ? 'center' : 'start', tp === 'ats' ? ink : tp === 'minimal' ? acc : mut); y += F(44); }
    if (contactLine){ font(cx0, 18, 400); wrap(cx0, contactLine, tw).forEach(ln => { text(cx0, ln, tx, y + F(24), tw, center ? 'center' : 'start', mut); y += F(30); }); }
    if (photo && (tp === 'classic' || tp === 'minimal')) y = Math.max(y, 84 + 170);
    y += 18;
    if (tp === 'elegant'){ cx0.strokeStyle = cvHex(acc, .6); cx0.lineWidth = 1.5; cx0.beginPath(); cx0.moveTo(M, y); cx0.lineTo(CV_W - M, y); cx0.moveTo(M, y + 6); cx0.lineTo(CV_W - M, y + 6); cx0.stroke(); y += 24; }
    else if (tp === 'classic'){ cx0.fillStyle = acc; cx0.fillRect(M, y, W, 4); y += 26; }
    else if (tp === 'ats'){ cx0.fillStyle = '#222'; cx0.fillRect(M, y, W, 2); y += 22; }
    else y += 10;
    hdr.main = y;
  }
  /* ----- sections into columns ----- */
  d.order.forEach(s => sec(two && CV_SIDE.includes(s) ? 'side' : 'main', s));
  /* ----- flow the columns over pages ----- */
  const bottom = CV_H - 80;
  function flow(k){
    const ops = OPS[k]; if (!ops.length) return 0; const g = col(k); let pg = 0, y = hdr[k];
    for (let i = 0; i < ops.length; i++){
      const op = ops[i]; let need = op.h;
      if (op.keep){ let j = i; need = 0; while (j < ops.length && (j === i || ops[j - 1].keep)){ need += ops[j].h; j++; if (need > 300) break; } }
      if (y + need > bottom && y > (pg === 0 ? hdr[k] : 70) + 10){ pg++; y = tp === 'elegant' ? 90 : 70; }
      op.draw(page(pg), g.x, y, g.w); y += op.h;
    }
    return pg;
  }
  flow('main'); if (two) flow('side');
  /* ----- cover letter as the last page ----- */
  if (opt.cover !== false && d.coverInc && String(d.cover || '').trim()){
    const n = pages.length, cx = page(n), W = CV_W - 2 * 100; let y = 110;
    if (tp === 'bold' || tp === 'modern'){ cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, CV_W, CV_H); cx.fillStyle = acc; cx.fillRect(0, 0, CV_W, 14); }
    font(cx, 46, 700, tp === 'elegant' ? serif : fam); text(cx, nm, 100, y + 40, W, 'start', tp === 'ats' ? ink : acc); y += 70;
    if (ti){ font(cx, 24, 500); text(cx, ti, 100, y, W, 'start', mut); y += 36; }
    if (contactLine){ font(cx, 18, 400); wrap(cx, contactLine, W).forEach(ln => { text(cx, ln, 100, y + 6, W, 'start', mut); y += 28; }); }
    y += 18; cx.fillStyle = cvHex(acc, .5); cx.fillRect(100, y, W, 2); y += 50;
    try { font(cx, 20, 400); text(cx, new Intl.DateTimeFormat({he: 'he-IL', ar: 'ar', en: 'en-GB'}[d.lang], {dateStyle: 'long', numberingSystem: 'latn'}).format(new Date()), 100, y, W, 'start', mut); y += 50; } catch (e) {}
    font(cx, 21, 400); wrap(cx, d.cover, W).forEach(ln => { if (y > CV_H - 90) return; text(cx, ln, 100, y, W, 'start', ink); y += ln ? F(33) : F(20); });
  }
  /* page numbers */
  if (pages.length > 1) pages.forEach((c, i) => { const cx = c.getContext('2d'); font(cx, 15, 400); cx.direction = 'ltr'; cx.textAlign = 'center'; cx.fillStyle = '#9aa1ae'; cx.fillText((i + 1) + ' / ' + pages.length, CV_W / 2, CV_H - 54); });
  return pages;
}

/* ---------- how complete is it ---------- */
function cvScore(d){
  const P = d.p || {}, ex = (d.exp || []).filter(x => x.role || x.org);
  const tips = [
    ['cv_tip_name', !!P.name, 14], ['cv_tip_contact', !!(P.phone && P.email), 14], ['cv_tip_title', !!P.title, 8], ['cv_tip_summary', String(d.summary || '').trim().length > 60, 12],
    ['cv_tip_exp', ex.length > 0, 16], ['cv_tip_desc', ex.length > 0 && ex.every(x => String(x.desc || '').trim().length > 20), 10], ['cv_tip_edu', (d.edu || []).some(x => x.degree || x.school), 10],
    ['cv_tip_skills', (d.skills || []).filter(x => x.n).length >= 3, 8], ['cv_tip_langs', (d.langs || []).some(x => x.n), 5], ['cv_tip_photo', !!d.photo || d.tpl === 'ats' || d.photoShape === 'none', 3]
  ];
  return {p: tips.reduce((a, x) => a + (x[1] ? x[2] : 0), 0), miss: tips.filter(x => !x[1]).map(x => x[0])};
}

/* ---------- the editor ---------- */
function cvField(path, label, val, type, extra){
  const id = 'cvf_' + path.replace(/\W/g, '_');
  if (type === 'area') return `<div class="field wide cv-f"><label for="${id}">${cvE(t(label))}</label><textarea id="${id}" data-cv="${cvE(path)}" rows="${extra || 4}" dir="auto">${cvE(val)}</textarea></div>`;
  if (type === 'check') return `<label class="cv-chk"><input type="checkbox" data-cv="${cvE(path)}"${val ? ' checked' : ''}> ${cvE(t(label))}</label>`;
  if (type === 'lvl' || type === 'glvl'){
    const pre = type === 'lvl' ? 'cv_l' : 'cv_g'; val = +val || 3;
    return `<div class="field cv-f"><label for="${id}">${cvE(t(label))}</label><select id="${id}" data-cv="${cvE(path)}">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${n === val ? ' selected' : ''}>${cvE(t(pre + n))}</option>`).join('')}</select></div>`;
  }
  const it = type === 'month' ? 'month' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : type === 'url' ? 'url' : 'text';
  return `<div class="field cv-f"><label for="${id}">${cvE(t(label))}</label><input id="${id}" type="${it}" data-cv="${cvE(path)}" value="${cvE(val)}" dir="${it === 'text' ? 'auto' : 'ltr'}" autocomplete="off"></div>`;
}
function cvSecEdit(d, s){
  const open = CV.open.has(s) ? ' open' : '', hid = (d.hide || []).includes(s);
  const ttl = String((d.titles || {})[s] || '').trim() || t('cv_s_' + s);
  const head = `<summary><span class="cv-sum-t">${cvE(ttl)}</span>${hid ? `<span class="cv-off">⦸</span>` : ''}${Array.isArray(d[s]) && d[s].length ? `<span class="cv-cnt">${d[s].length}</span>` : ''}</summary>`;
  const tId = 'cvf_titles_' + s;
  let body = s === 'custom' ? '' : `<div class="field wide cv-f cv-ttl"><label for="${tId}">✏️ ${cvE(t('cv_secTitle'))}</label><input id="${tId}" type="text" maxlength="40" dir="auto" data-cv="titles.${s}" value="${cvE((d.titles || {})[s] || '')}" placeholder="${cvE(t('cv_s_' + s))}" autocomplete="off"></div>`;
  if (s === 'summary'){
    body += cvField('summary', 'cv_fSummary', d.summary, 'area', 5) + `<div class="btnrow cv-ai-row"><button type="button" class="mv" data-act="ai" data-k="sumWrite">✨ ${cvE(t('cv_aiSum'))}</button><button type="button" class="mv" data-act="ai" data-k="sumImprove">✨ ${cvE(t('cv_aiImprove'))}</button></div>`;
  } else if (s === 'hobbies'){
    body += cvField('hobbies', 'cv_fHobbies', d.hobbies, 'area', 3);
  } else {
    if (s === 'refs') body += cvField('refsReq', 'cv_refsReqL', d.refsReq, 'check');
    body += (d[s] || []).map((it, i) => `<div class="cv-item"><div class="cv-item-h"><b>${cvE(it.role || it.degree || it.n || it.title || t('cv_s_' + s) + ' ' + (i + 1))}</b><span class="cv-item-b">
        <button type="button" class="mv" data-act="up" data-sec="${s}" data-i="${i}" aria-label="${cvE(t('cv_up'))}">↑</button><button type="button" class="mv" data-act="down" data-sec="${s}" data-i="${i}" aria-label="${cvE(t('cv_down'))}">↓</button><button type="button" class="mv" data-act="rm" data-sec="${s}" data-i="${i}" aria-label="${cvE(t('cv_rm'))}">🗑</button></span></div>
      <div class="cv-grid">${CV_F[s].map(f => cvField(s + '.' + i + '.' + f[0], f[1], it[f[0]], f[2])).join('')}</div>
      ${CV_F[s].some(f => f[0] === 'desc') && s !== 'custom' ? `<button type="button" class="mv cv-ai-mini" data-act="ai" data-k="bullets" data-sec="${s}" data-i="${i}">✨ ${cvE(t('cv_aiBullets'))}</button>` : ''}</div>`).join('');
    body += `<button type="button" class="btn cv-add" data-act="add" data-sec="${s}">+ ${cvE(t('cv_add'))}</button>`;
    body += cvField('notes.' + s, 'cv_secNote', (d.notes || {})[s], 'area', 3);
  }
  return `<details class="cv-sec" data-sec="${s}"${open}>${head}<div class="cv-sec-b">${body}</div></details>`;
}
function cvEditHTML(d){
  const P = d.p || {};
  const personal = `<details class="cv-sec" data-sec="personal"${CV.open.has('personal') ? ' open' : ''}><summary><span class="cv-sum-t">${cvE(t('cv_s_personal'))}</span></summary><div class="cv-sec-b">
    <div class="cv-photo">${d.photo ? `<img src="${cvE(d.photo)}" alt="">` : '<span>👤</span>'}<div class="btnrow"><button type="button" class="btn" data-act="photo">📷 ${cvE(t('cv_photoAdd'))}</button>${d.photo ? `<button type="button" class="mv" data-act="photoDel">${cvE(t('cv_photoDel'))}</button>` : ''}</div></div>
    <div class="cv-grid">${CV_P.map(f => cvField('p.' + f[0], f[1], P[f[0]], f[2])).join('')}</div></div></details>`;
  return personal + d.order.map(s => cvSecEdit(d, s)).join('');
}
function cvDesignHTML(d){
  const sel = (path, label, opts) => `<div class="field cv-f"><label>${cvE(t(label))}</label><select data-cv="${path}">${opts.map(([v, k]) => `<option value="${v}"${String(d[path]) === String(v) ? ' selected' : ''}>${cvE(t(k))}</option>`).join('')}</select></div>`;
  return `<h4 class="cv-h">${cvE(t('cv_tpl'))}</h4><div class="cv-tpls">${CV_TPLS.map(k => `<button type="button" class="cv-tpl${d.tpl === k ? ' on' : ''}" data-act="tpl" data-v="${k}"><span class="cv-thumb" data-thumb="${k}"></span><span>${cvE(t('cv_tpl_' + k))}</span></button>`).join('')}</div>
    <h4 class="cv-h">${cvE(t('cv_color'))}</h4><div class="cv-colors">${CV_COLORS.map(c => `<button type="button" class="cv-sw${d.color === c ? ' on' : ''}" data-act="color" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<label class="cv-sw cv-swx" title="${cvE(t('cv_colorX'))}"><input type="color" data-cv="color" value="${cvE(d.color)}" aria-label="${cvE(t('cv_colorX'))}">🎨</label></div>
    <div class="cv-grid">
      ${sel('font', 'cv_font', [['sans', 'cv_font_sans'], ['heebo', 'cv_font_heebo'], ['rubik', 'cv_font_rubik'], ['serif', 'cv_font_serif']])}
      ${sel('size', 'cv_size', [['S', 'cv_sizeS'], ['M', 'cv_sizeM'], ['L', 'cv_sizeL']])}
      ${sel('lang', 'cv_lang', [['he', 'cv_ln_he'], ['ar', 'cv_ln_ar'], ['en', 'cv_ln_en']])}
      ${sel('photoShape', 'cv_photoShape', [['circle', 'cv_ps_circle'], ['square', 'cv_ps_square'], ['none', 'cv_ps_none']])}
      ${sel('skillStyle', 'cv_skillStyle', [['bars', 'cv_ss_bars'], ['dots', 'cv_ss_dots'], ['tags', 'cv_ss_tags'], ['text', 'cv_ss_text']])}
      ${sel('dates', 'cv_dates', [['month', 'cv_d_month'], ['year', 'cv_d_year']])}
    </div>
    <h4 class="cv-h">🖼️ ${cvE(t('cv_bg'))}</h4><p class="fine">${cvE(t('cv_bgH'))}</p>
    <div class="cv-bgrow">${d.bg ? `<img class="cv-bgthumb" src="${cvE(d.bg)}" alt="">` : ''}<div class="btnrow"><button type="button" class="btn" data-act="bg">${cvE(t(d.bg ? 'cv_bgChange' : 'cv_bgAdd'))}</button>${d.bg ? `<button type="button" class="mv" data-act="bgDel">${cvE(t('cv_bgDel'))}</button>` : ''}</div></div>
    ${d.bg ? `<div class="cv-grid">${sel('bgMode', 'cv_bgMode', [['page', 'cv_bg_page'], ['header', 'cv_bg_header']])}${sel('bgFade', 'cv_bgFade', [['light', 'cv_bg_light'], ['medium', 'cv_bg_medium'], ['strong', 'cv_bg_strong']])}</div>` : ''}
    <h4 class="cv-h">${cvE(t('cv_order'))}</h4><p class="fine">${cvE(t('cv_orderH'))}</p>
    <ul class="cv-order">${d.order.map((s, i) => `<li><label class="cv-chk"><input type="checkbox" data-cvshow="${s}"${(d.hide || []).includes(s) ? '' : ' checked'}> ${cvE(String((d.titles || {})[s] || '').trim() || t('cv_s_' + s))}</label><span><button type="button" class="mv" data-act="sup" data-i="${i}" aria-label="${cvE(t('cv_up'))}">↑</button><button type="button" class="mv" data-act="sdown" data-i="${i}" aria-label="${cvE(t('cv_down'))}">↓</button></span></li>`).join('')}</ul>`;
}
function cvAIHTML(d){
  const ok = cvAiOk();
  return `<p class="fine">${cvE(t('cv_aiH'))}</p>${ok ? '' : `<div class="gk-st new">${cvE(t('cv_aiNo'))}</div>`}
    <div class="cv-ai-card"><div class="btnrow"><button type="button" class="btn" data-act="ai" data-k="sumWrite"${ok ? '' : ' disabled'}>✨ ${cvE(t('cv_aiSum'))}</button><button type="button" class="btn" data-act="ai" data-k="review"${ok ? '' : ' disabled'}>🔎 ${cvE(t('cv_aiReview'))}</button></div></div>
    <div class="cv-ai-card"><h4 class="cv-h">🎯 ${cvE(t('cv_aiTailor'))}</h4><div class="field wide"><textarea id="cv_job" rows="4" dir="auto" placeholder="${cvE(t('cv_aiTailorPh'))}"></textarea></div><button type="button" class="btn" data-act="ai" data-k="tailor"${ok ? '' : ' disabled'}>${cvE(t('cv_aiTailorGo'))}</button></div>
    <div class="cv-ai-card"><h4 class="cv-h">🌐 ${cvE(t('cv_aiTr'))}</h4><div class="btnrow">${['he', 'ar', 'en'].filter(l => l !== d.lang).map(l => `<button type="button" class="btn" data-act="ai" data-k="translate" data-v="${l}"${ok ? '' : ' disabled'}>${cvE(t('cv_ln_' + l))}</button>`).join('')}</div></div>
    <div class="cv-ai-card"><h4 class="cv-h">✉️ ${cvE(t('cv_s_cover'))}</h4><div class="field wide"><textarea id="cv_coverIn" rows="3" dir="auto" placeholder="${cvE(t('cv_aiCoverPh'))}"></textarea></div><button type="button" class="btn" data-act="ai" data-k="cover"${ok ? '' : ' disabled'}>✨ ${cvE(t('cv_aiCover'))}</button>
      ${cvField('cover', 'cv_s_cover', d.cover, 'area', 8)}${cvField('coverInc', 'cv_coverInc', d.coverInc, 'check')}</div>
    <div id="cv_aiOut" aria-live="polite">${CV.aiOut}</div>`;
}
function cvViewHTML(){
  return `<div class="btnrow cv-exp"><button type="button" class="gold-btn" data-act="pdf">⬇️ ${cvE(t('cv_pdf'))}</button><button type="button" class="btn" data-act="print">🖨️ ${cvE(t('cv_print'))}</button><button type="button" class="btn" data-act="png">🖼️ ${cvE(t('cv_png'))}</button></div>
    <div class="btnrow cv-exp"><button type="button" class="mv" data-act="json">💾 ${cvE(t('cv_json'))}</button><button type="button" class="mv" data-act="import">📂 ${cvE(t('cv_import'))}</button><input type="file" accept="application/json,.json" data-cvfile="json" hidden></div>
    <p class="fine" id="cv_pgInfo"></p><div class="cv-pages" id="cv_pages"><p class="fine">${cvE(t('cv_making'))}</p></div>`;
}
function cvRender0(){
  const root = $('#cv_root'); if (!root) return;
  const db = cvLoad(), it = cvCur(), d = it.d, sc = cvScore(d);
  root.innerHTML = `<div class="cv-top">
      <div class="field cv-f"><label for="cv_pick">${cvE(t('cv_mine'))}</label><select id="cv_pick">${db.items.map(x => `<option value="${x.id}"${x.id === it.id ? ' selected' : ''}>${cvE(x.name)}</option>`).join('')}</select></div>
      <div class="field cv-f"><label for="cv_nm">${cvE(t('cv_name'))}</label><input id="cv_nm" type="text" maxlength="40" dir="auto" value="${cvE(it.name)}"></div>
      <div class="btnrow cv-top-b"><button type="button" class="mv" data-act="new">＋ ${cvE(t('cv_new'))}</button><button type="button" class="mv" data-act="dup">⧉ ${cvE(t('cv_dup'))}</button><button type="button" class="mv" data-act="sample">${cvE(t(CV.sure === 'sample' ? 'cv_sampleQ' : 'cv_sample'))}</button>${db.items.length > 1 ? `<button type="button" class="mv${CV.sure === 'del' ? ' warn' : ''}" data-act="del">${cvE(t(CV.sure === 'del' ? 'cv_delQ' : 'cv_del'))}</button>` : ''}</div>
    </div>
    <div class="cv-score"><div class="cv-bar"><i style="width:${sc.p}%"></i></div><b>${cvE(t('cv_done', {p: sc.p}))}</b><small id="cv_st"></small>
      ${sc.miss.length ? `<details class="cv-tips"><summary>${cvE(t('cv_tipsT'))}</summary><ul>${sc.miss.map(k => `<li>${cvE(t(k))}</li>`).join('')}</ul></details>` : ''}</div>
    <div class="seg cv-tabs" role="tablist">${['edit', 'design', 'ai', 'view'].map(k => `<button type="button" role="tab" data-act="tab" data-v="${k}" class="${CV.tab === k ? 'on' : ''}" aria-pressed="${CV.tab === k}" aria-selected="${CV.tab === k}">${cvE(t({edit: 'cv_tEdit', design: 'cv_tDesign', ai: 'cv_tAI', view: 'cv_tView'}[k]))}</button>`).join('')}</div>
    <input type="file" accept="image/*" data-cvfile="photo" hidden><input type="file" accept="image/*" capture="user" data-cvfile="photo" data-cam="1" hidden>
    <div class="cv-body" id="cv_body">${CV.tab === 'edit' ? cvEditHTML(d) : CV.tab === 'design' ? cvDesignHTML(d) : CV.tab === 'ai' ? cvAIHTML(d) : cvViewHTML()}</div>`;
  if (CV.tab === 'view') cvPreview();
  if (CV.tab === 'design') cvThumbs();
}
async function cvPreview(){
  const box = $('#cv_pages'); if (!box) return;
  const tk = CV.rt = Symbol('r');
  let pages; try { pages = await cvRender(cvCur().d); } catch (e) { box.innerHTML = `<p class="fine">${cvE(String(e && e.message || e))}</p>`; return; }
  if (CV.rt !== tk || !$('#cv_pages')) return;
  box.innerHTML = ''; pages.forEach(c => { const im = new Image(); im.src = c.toDataURL('image/jpeg', .9); im.alt = ''; im.className = 'cv-page'; box.appendChild(im); });
  const inf = $('#cv_pgInfo'); if (inf) inf.textContent = (pages.length === 1 ? t('cv_page1') : t('cv_pages', {n: pages.length})) + (pages.length > 1 ? ' · ' + t('cv_onePage') : '');
}
async function cvThumbs(){
  const d = cvCur().d, tk = CV.rt = Symbol('t');
  for (const k of CV_TPLS){
    const el = $(`[data-thumb="${k}"]`); if (!el || CV.rt !== tk) return;
    try { const pg = await cvRender(Object.assign({}, d, {tpl: k}), {cover: false}); if (CV.rt !== tk) return; const c = document.createElement('canvas'); c.width = 238; c.height = 337; c.getContext('2d').drawImage(pg[0], 0, 0, 238, 337); el.innerHTML = `<img src="${c.toDataURL('image/jpeg', .85)}" alt="">`; } catch (e) {}
  }
}
function cvSet(path, v){
  const d = cvCur().d, ks = path.split('.'); let o = d;
  for (let i = 0; i < ks.length - 1; i++){ const k = /^\d+$/.test(ks[i]) ? +ks[i] : ks[i]; if (o[k] == null) o[k] = {}; o = o[k]; }
  o[ks[ks.length - 1]] = v; cvCur().at = Date.now(); cvSaveSoon();
}
function cvScoreSync(){ const d = cvCur().d, sc = cvScore(d), b = $('#cv_root .cv-bar i'), l = $('#cv_root .cv-score b'); if (b) b.style.width = sc.p + '%'; if (l) l.textContent = t('cv_done', {p: sc.p}); }
async function cvPhoto(file){
  if (!file || !/^image\//.test(file.type)) return;
  const url = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(''); r.readAsDataURL(file); });
  const im = await cvImg(url); if (!im) return;
  const S = 420, c = document.createElement('canvas'); c.width = S; c.height = S; const s = Math.min(im.width, im.height);
  c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, S, S);
  cvSet('photo', c.toDataURL('image/jpeg', .85)); delete CV.imgs[url]; cvRender0();
}

async function cvBg(file){
  if (!file || !/^image\//.test(file.type)) return;
  const url = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(''); r.readAsDataURL(file); });
  const im = await cvImg(url); if (!im) return;
  const sc = Math.min(1, 1190 / im.width, 1684 / im.height), c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  cvSet('bg', c.toDataURL('image/jpeg', .8)); delete CV.imgs[url]; cvRender0();
}
/* ---------- photo access: ask once / allow always / blocked – changeable any time in Settings → Security ----------
   A web page never sees the gallery: the phone's own picker opens and only the chosen photo reaches the app, and it stays on this device. */
var PHA_T = 'cv';   /* which screen asked for a photo: the CV builder or the calculator's scanner */
function cvPick(cam){ const sel = PHA_T === 'mx' ? '#mx_root [data-mxfile]' : '#cv_root [data-cvfile="photo"]'; const f = $(`${sel}${cam ? '[data-cam]' : ':not([data-cam])'}`); if (f) f.click(); }
function cvPhotoAsk(){
  const m = SET.photoAccess || 'ask';
  if (m === 'never'){ toast(t('pha_blocked')); return; }
  if (m === 'always'){ cvPick(false); return; }
  let o = $('#phx');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="phx" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="phx_t"><div class="cp-top"><h3 id="phx_t"></h3><button type="button" class="cp-x" id="phx_x">×</button></div><div id="phx_b"></div></div></div>`); o = $('#phx'); }
  $('#phx_t').textContent = t('pha_title'); $('#phx_x').setAttribute('aria-label', t('cp_close'));
  $('#phx_b').innerHTML = `<p class="mb-ic">🖼️</p><p>${cvE(t('pha_why'))}</p>
    <div class="ph-opts"><button type="button" class="gold-btn" data-ph="once">${cvE(t('pha_once'))}</button><button type="button" class="btn" data-ph="always">${cvE(t('pha_always'))}</button><button type="button" class="btn" data-ph="cam">📷 ${cvE(t('pha_cam'))}</button><button type="button" class="mv" data-ph="no">${cvE(t('pha_no'))}</button></div>
    <p class="fine">${cvE(t('pha_note'))}</p>`;
  o.hidden = false; document.body.classList.add('cp-lock');
}
function cvPhClose(){ const o = $('#phx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
document.addEventListener('click', e => {
  if (!e.target.closest) return;
  if (e.target.closest('#phx_x') || e.target.id === 'phx'){ cvPhClose(); return; }
  const b = e.target.closest('[data-ph]'); if (!b) return;
  const k = b.dataset.ph; cvPhClose();
  if (k === 'always'){ SET.photoAccess = 'always'; try { saveSet(); } catch (er) {} toast(t('pha_alwaysOk')); phSetRender(); cvPick(false); }
  else if (k === 'once') cvPick(false);
  else if (k === 'cam') cvPick(true);
});
/* the setting, in Settings → Security */
function phSetRender(){
  const cat = $('.set-cat[data-cat="security"]'); if (!cat) return; let s = $('#ph_sec');
  if (!s){ cat.insertAdjacentHTML('beforeend', `<section class="set-sec" id="ph_sec"></section>`); s = $('#ph_sec'); }
  const v = SET.photoAccess || 'ask';
  s.innerHTML = `<div class="sec-h"><h3 class="sec-t">🖼️ ${cvE(t('pha_set'))}</h3></div><p class="fine">${cvE(t('pha_setH'))}</p>
    <div class="field wide"><label for="set_photoAccess">${cvE(t('pha_set'))}</label><select id="set_photoAccess">${[['ask', 'pha_o_ask'], ['always', 'pha_o_always'], ['never', 'pha_o_never']].map(([k, l]) => `<option value="${k}"${v === k ? ' selected' : ''}>${cvE(t(l))}</option>`).join('')}</select></div>`;
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'set_photoAccess'){ SET.photoAccess = e.target.value; try { saveSet(); } catch (er) {} toast(t('pha_saved')); } });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.sh-row[data-scat="security"]')) setTimeout(phSetRender, 150); });
setTimeout(phSetRender, 900);

/* ---------- AI ---------- */
function cvAiOk(){ try { const e = aiPick(); return (e === 'claude' && claudeOk()) || (e === 'gemini' && !!gemKey()); } catch (e) { return false; } }
async function cvAsk(prompt){
  const e = aiPick();
  if (e === 'claude' && claudeOk()) return claudeAsk(prompt, {modelTier: 'default'});
  if (e === 'gemini' && gemKey()) return gemChat([{role: 'user', content: prompt}]);
  throw new Error('noai');
}
const CV_LN = {he: 'Hebrew', ar: 'Arabic', en: 'English'};
function cvFacts(d){
  const P = d.p || {}, o = {name: P.name, title: P.title, city: P.city, summary: d.summary};
  ['exp', 'edu', 'military', 'projects', 'vol', 'certs', 'courses', 'awards'].forEach(s => { const a = (d[s] || []).filter(x => Object.values(x).some(Boolean)); if (a.length) o[s] = a; });
  const sk = (d.skills || []).map(x => x.n).filter(Boolean); if (sk.length) o.skills = sk;
  const lg = (d.langs || []).map(x => x.n).filter(Boolean); if (lg.length) o.languages = lg;
  return JSON.stringify(o);
}
const cvJSON = s => { const m = /\{[\s\S]*\}/.exec(String(s || '')); return m ? JSON.parse(m[0]) : null; };
function cvOut(html){ CV.aiOut = html; const o = $('#cv_aiOut'); if (o) o.innerHTML = html; else toast(String(html).replace(/<[^>]+>/g, ' ').slice(0, 140)); }
async function cvAI(k, btn){
  const it = cvCur(), d = it.d, L = CV_LN[d.lang], UL = CV_LN[cvLangOk(lang)] || 'English';
  if (!cvAiOk()){ toast(t('cv_aiNo')); return; }
  if (CV.busy) return; CV.busy = true;
  const old = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = '⏳ ' + t('cv_aiWait'); }
  try {
    if (k === 'sumImprove' || k === 'sumWrite'){
      if (k === 'sumImprove' && !String(d.summary || '').trim()){ toast(t('cv_aiNeed')); return; }
      if (k === 'sumWrite' && !(d.p.title || (d.exp || []).some(x => x.role))){ toast(t('cv_aiNeed')); return; }
      const pr = k === 'sumImprove'
        ? `Rewrite this CV profile in ${L}: 2-4 sentences, professional and specific, no clichés, keep every fact and invent nothing. Return only the text.\n\n${d.summary}`
        : `Write a CV profile (2-4 sentences) in ${L} for this person, based only on these facts (invent nothing, no placeholders). Return only the text.\n\n${cvFacts(d)}`;
      const r = await cvAsk(pr); if (!r) throw new Error('empty');
      d.summary = r.replace(/^["']|["']$/g, '').trim(); it.at = Date.now(); cvSaveSoon(); cvRender0(); toast(t('cv_aiApplied'));
    } else if (k === 'bullets'){
      const s = btn.dataset.sec, i = +btn.dataset.i, x = d[s][i];
      if (!x || !String(x.desc || x.role || '').trim()){ toast(t('cv_aiNeed')); return; }
      const r = await cvAsk(`Rewrite these CV points as 3-5 concise achievement bullets in ${L}, each starting with a strong action verb, keeping all facts and numbers and inventing nothing. One bullet per line, no bullet symbols or numbering. Return only the lines.\nRole: ${x.role || x.degree || x.n || ''} ${x.org || x.school ? 'at ' + (x.org || x.school) : ''}\nPoints:\n${x.desc || ''}`);
      if (!r) throw new Error('empty');
      x.desc = r.split('\n').map(z => z.replace(/^\s*[-•*·\d.)]+\s*/, '').trim()).filter(Boolean).join('\n'); it.at = Date.now(); cvSaveSoon(); cvRender0(); toast(t('cv_aiApplied'));
    } else if (k === 'review'){
      const r = await cvAsk(`You are an expert recruiter. Review this CV (JSON) and give 5-8 short, concrete improvement tips in ${UL}. One tip per line, no numbering, no intro.\n\n${cvFacts(d)}`);
      cvOut(`<div class="cv-ai-res"><h4 class="cv-h">🔎 ${cvE(t('cv_aiReview'))}</h4><ul>${r.split('\n').map(z => z.replace(/^\s*[-•*·\d.)]+\s*/, '').trim()).filter(Boolean).map(z => `<li>${cvE(z)}</li>`).join('')}</ul></div>`);
    } else if (k === 'tailor'){
      const ad = String(($('#cv_job') || {}).value || '').trim(); if (ad.length < 30){ toast(t('cv_aiTailorPh')); return; }
      const r = cvJSON(await cvAsk(`Job ad:\n${ad.slice(0, 6000)}\n\nCandidate CV (JSON):\n${cvFacts(d)}\n\nReturn JSON only: {"summary": "the CV profile rewritten in ${L} to fit this job, 2-4 sentences, only true facts from the CV", "skills": ["up to 8 keywords from the ad that the CV already shows evidence of but are missing from its skills list, in ${L}"], "tips": ["3-5 short tips in ${UL} on what to emphasise for this job"]}`));
      if (!r) throw new Error('json');
      CV.tailor = r;
      cvOut(`<div class="cv-ai-res"><h4 class="cv-h">🎯 ${cvE(t('cv_aiTailor'))}</h4>${r.summary ? `<p dir="auto">${cvE(r.summary)}</p><button type="button" class="btn" data-act="tApplySum">${cvE(t('cv_aiApply'))}</button>` : ''}
        ${Array.isArray(r.skills) && r.skills.length ? `<p class="cv-tags">${r.skills.map(z => `<span>${cvE(z)}</span>`).join('')}</p><button type="button" class="btn" data-act="tApplySk">${cvE(t('cv_aiSkillsAdd'))}</button>` : ''}
        ${Array.isArray(r.tips) && r.tips.length ? `<ul>${r.tips.map(z => `<li>${cvE(z)}</li>`).join('')}</ul>` : ''}</div>`);
    } else if (k === 'translate'){
      const to = btn.dataset.v, src = {p: {name: d.p.name, title: d.p.title, city: d.p.city, license: d.p.license, avail: d.p.avail}, summary: d.summary, hobbies: d.hobbies, cover: d.cover};
      const TX = {exp: ['role', 'org', 'city', 'desc'], edu: ['degree', 'school', 'city', 'desc'], military: ['role', 'org', 'desc'], skills: ['n'], langs: ['n'], certs: ['n', 'org'], courses: ['n', 'org'], projects: ['n', 'desc'], vol: ['role', 'org', 'desc'], awards: ['n', 'desc'], refs: ['role'], custom: ['title', 'desc']};
      Object.keys(TX).forEach(s => { src[s] = (d[s] || []).map(x => { const o = {}; TX[s].forEach(f => { if (x[f]) o[f] = x[f]; }); return o; }); });
      const r = cvJSON(await cvAsk(`Translate every string value in this CV JSON from ${L} to ${CV_LN[to]}. Keep the keys, the structure, numbers, emails, URLs and product names unchanged; transliterate personal and place names naturally. Return the JSON only.\n\n${JSON.stringify(src)}`));
      if (!r) throw new Error('json');
      const nd = JSON.parse(JSON.stringify(d)); nd.lang = to;
      if (r.p) Object.keys(r.p).forEach(f => { if (r.p[f]) nd.p[f] = r.p[f]; });
      ['summary', 'hobbies', 'cover'].forEach(f => { if (typeof r[f] === 'string') nd[f] = r[f]; });
      Object.keys(TX).forEach(s => { if (Array.isArray(r[s])) r[s].forEach((o, i) => { if (nd[s][i] && o) TX[s].forEach(f => { if (o[f]) nd[s][i][f] = o[f]; }); }); });
      if (to === 'en' && nd.font === 'sans') nd.font = 'heebo';
      const n = cvNew(nd, it.name + ' · ' + t('cv_ln_' + to)); cvSaveSoon(); CV.tab = 'view'; cvRender0(); toast(t('cv_aiTrDone', {n: n.name}));
    } else if (k === 'cover'){
      const job = String(($('#cv_coverIn') || {}).value || '').trim();
      const r = await cvAsk(`Write a cover letter in ${L} for this candidate${job ? ' for: ' + job.slice(0, 4000) : ''}. 180-260 words, warm and professional, 3-4 short paragraphs, sign off with the candidate's name, no placeholders in brackets, invent no facts. Return only the letter.\n\nCV (JSON):\n${cvFacts(d)}`);
      if (!r) throw new Error('empty');
      d.cover = r.trim(); d.coverInc = true; it.at = Date.now(); cvSaveSoon(); cvRender0(); toast(t('cv_aiApplied'));
    }
  } catch (e){
    const c = e && (e.code || e.message);
    toast(c === 'noai' ? t('cv_aiNo') : typeof aiCodeText === 'function' && e && e.code ? aiCodeText(e.code) : t('cv_aiErr'));
  } finally { CV.busy = false; if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}

/* ---------- export ---------- */
const cvFile = ext => (String(cvCur().d.p.name || cvCur().name || 'cv').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'cv') + '.' + ext;
async function cvExport(k, btn){
  const old = btn ? btn.textContent : ''; if (btn){ btn.disabled = true; btn.textContent = '⏳ ' + t('cv_making'); }
  try {
    if (k === 'json'){ await fileSave(new Blob([JSON.stringify({cvbuilder: 1, name: cvCur().name, d: cvCur().d})], {type: 'application/json'}), cvFile('json'), 'application/json'); return; }
    const pages = await cvRender(cvCur().d);
    if (k === 'pdf') await fileSave(pdfBytes(pages), cvFile('pdf'), 'application/pdf');
    else if (k === 'png'){ const b = await new Promise(r => pages[0].toBlob(r, 'image/png')); await fileSave(b, cvFile('png'), 'image/png'); }
    else if (k === 'print'){
      let box = $('#cv_print'); if (box) box.remove();
      document.body.insertAdjacentHTML('beforeend', '<div id="cv_print"></div>'); box = $('#cv_print');
      pages.forEach(c => { const im = new Image(); im.src = c.toDataURL('image/jpeg', .95); box.appendChild(im); });
      document.body.classList.add('cv-printing');
      await new Promise(r => setTimeout(r, 300));
      let ok = true; try { window.print(); } catch (e) { ok = false; }
      setTimeout(() => { document.body.classList.remove('cv-printing'); const b = $('#cv_print'); if (b) b.remove(); }, 1500);
      if (!ok) toast(t('cv_printNo'));
    }
  } catch (e){ toast(t('cv_aiErr')); }
  finally { if (btn && btn.isConnected){ btn.disabled = false; btn.textContent = old; } }
}

/* ---------- events ---------- */
document.addEventListener('input', e => {
  const el = e.target; if (!el.closest || !el.closest('#cv_root')) return;
  if (el.id === 'cv_nm'){ cvCur().name = el.value.trim() || t('cv_untitled'); cvSaveSoon(); const o = $(`#cv_pick option[value="${cvCur().id}"]`); if (o) o.textContent = cvCur().name; return; }
  if (el.dataset.cv && el.type !== 'checkbox' && el.tagName !== 'SELECT'){ cvSet(el.dataset.cv, el.value); cvScoreSync(); if (el.dataset.cv === 'color') $$('#cv_root .cv-sw').forEach(b => b.classList.remove('on')); }
});
document.addEventListener('change', e => {
  const el = e.target; if (!el.closest || !el.closest('#cv_root')) return;
  if (el.id === 'cv_pick'){ cvLoad().cur = el.value; CV.sure = ''; CV.aiOut = ''; cvSaveSoon(); cvRender0(); return; }
  if (el.dataset.cvfile === 'photo'){ const f = el.files && el.files[0]; el.value = ''; if (CV.phKind === 'bg') cvBg(f); else cvPhoto(f); return; }
  if (el.dataset.cvfile === 'json'){
    const f = el.files && el.files[0]; el.value = ''; if (!f) return;
    const r = new FileReader(); r.onload = () => { try { const j = JSON.parse(r.result); if (!j || !j.cvbuilder || !j.d) throw 0; cvNew(j.d, j.name); cvSaveSoon(); cvRender0(); toast(t('cv_imported')); } catch (er) { toast(t('cv_badFile')); } }; r.readAsText(f); return;
  }
  if (el.dataset.cvshow){ const d = cvCur().d, s = el.dataset.cvshow; d.hide = (d.hide || []).filter(x => x !== s); if (!el.checked) d.hide.push(s); cvSaveSoon(); cvThumbs(); return; }
  if (el.dataset.cv){
    const v = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' && /\.lvl$/.test(el.dataset.cv) ? +el.value : el.value;
    cvSet(el.dataset.cv, v); cvScoreSync();
    if (['tpl', 'color', 'font', 'size', 'lang', 'photoShape', 'skillStyle', 'dates', 'bgMode', 'bgFade'].includes(el.dataset.cv)) cvThumbs();
    if (el.dataset.cv === 'lang' || el.dataset.cv === 'photoShape') cvRender0();
  }
});
document.addEventListener('toggle', e => { const el = e.target; if (el.classList && el.classList.contains('cv-sec')){ if (el.open) CV.open.add(el.dataset.sec); else CV.open.delete(el.dataset.sec); } }, true);
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#cv_root [data-act]'); if (!b) return;
  const a = b.dataset.act, it = cvCur(), d = it.d;
  if (a !== 'del' && a !== 'sample') CV.sure = '';
  const re = () => { it.at = Date.now(); cvSaveSoon(); cvRender0(); };
  if (a === 'tab'){ CV.tab = b.dataset.v; cvRender0(); return; }
  if (a === 'new'){ cvNew(); CV.tab = 'edit'; CV.aiOut = ''; cvSaveSoon(); cvRender0(); return; }
  if (a === 'dup'){ cvNew(JSON.parse(JSON.stringify(d)), it.name + ' (2)'); cvSaveSoon(); cvRender0(); return; }
  if (a === 'del'){ if (CV.sure !== 'del'){ CV.sure = 'del'; cvRender0(); setTimeout(() => { if (CV.sure === 'del'){ CV.sure = ''; cvRender0(); } }, 6000); return; } CV.sure = ''; const db = cvLoad(); db.items = db.items.filter(x => x.id !== it.id); db.cur = db.items[0].id; cvSaveSoon(); cvRender0(); return; }
  if (a === 'sample'){
    const empty = !d.p.name && !(d.exp || []).some(x => x.role);
    if (!empty && CV.sure !== 'sample'){ CV.sure = 'sample'; cvRender0(); setTimeout(() => { if (CV.sure === 'sample'){ CV.sure = ''; cvRender0(); } }, 6000); return; }
    CV.sure = ''; const keep = {tpl: d.tpl, color: d.color, font: d.font, size: d.size, photo: d.photo};
    it.d = cvFix(Object.assign(cvBlank(), keep, cvSample(lang), {lang: cvLangOk(lang), hide: ['courses', 'vol', 'awards', 'custom', 'projects']})); re(); return;
  }
  if (a === 'add'){ const s = b.dataset.sec; d[s].push(s === 'skills' || s === 'langs' ? {lvl: s === 'langs' ? 4 : 4} : {}); CV.open.add(s); if ((d.hide || []).includes(s)) d.hide = d.hide.filter(x => x !== s); re(); setTimeout(() => { const f = $$(`#cv_root [data-sec="${s}"] .cv-item`).pop(); if (f){ const i = f.querySelector('input,textarea'); if (i) i.focus(); } }, 50); return; }
  if (a === 'rm'){ d[b.dataset.sec].splice(+b.dataset.i, 1); re(); return; }
  if (a === 'up' || a === 'down'){ const L = d[b.dataset.sec], i = +b.dataset.i, j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; re(); return; }
  if (a === 'sup' || a === 'sdown'){ const L = d.order, i = +b.dataset.i, j = a === 'sup' ? i - 1 : i + 1; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; re(); return; }
  if (a === 'tpl'){ d.tpl = b.dataset.v; $$('#cv_root .cv-tpl').forEach(x => x.classList.toggle('on', x === b)); it.at = Date.now(); cvSaveSoon(); return; }
  if (a === 'color'){ d.color = b.dataset.v; $$('#cv_root .cv-sw').forEach(x => x.classList.toggle('on', x === b)); const ci = $('#cv_root input[type=color]'); if (ci) ci.value = d.color; it.at = Date.now(); cvSaveSoon(); cvThumbs(); return; }
  if (a === 'photo'){ PHA_T = 'cv'; CV.phKind = 'photo'; cvPhotoAsk(); return; }
  if (a === 'bg'){ PHA_T = 'cv'; CV.phKind = 'bg'; cvPhotoAsk(); return; }
  if (a === 'bgDel'){ d.bg = ''; re(); return; }
  if (a === 'photoDel'){ d.photo = ''; re(); return; }
  if (a === 'import'){ const f = $('#cv_root [data-cvfile="json"]'); if (f) f.click(); return; }
  if (a === 'ai'){ cvAI(b.dataset.k, b); return; }
  if (a === 'tApplySum' && CV.tailor && CV.tailor.summary){ d.summary = CV.tailor.summary; it.at = Date.now(); cvSaveSoon(); b.disabled = true; b.textContent = '✓ ' + t('cv_aiApplied'); return; }
  if (a === 'tApplySk' && CV.tailor && Array.isArray(CV.tailor.skills)){ const have = new Set((d.skills || []).map(x => String(x.n || '').toLowerCase())); CV.tailor.skills.forEach(s => { if (s && !have.has(String(s).toLowerCase())) d.skills.push({n: s, lvl: 4}); }); it.at = Date.now(); cvSaveSoon(); b.disabled = true; b.textContent = '✓ ' + t('cv_aiApplied'); return; }
  if (['pdf', 'png', 'print', 'json'].includes(a)){ cvExport(a, b); return; }
});

/* ---------- wiring into the app ---------- */
CALC.cv = () => null;
if (typeof svKind === 'function'){ const svKindCv = svKind; svKind = function(id){ return id === 'cv' ? '' : svKindCv.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('cv'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('cv'); } catch (e) {}
{
  const activateCv = activate;
  activate = function(id){ const r = activateCv.apply(this, arguments); if (id === 'cv' && !(typeof mbLocked === 'function' && mbLocked('cv'))) cvRender0(); return r; };
}
if (typeof applyLang === 'function'){ const applyLangCv = applyLang; applyLang = function(){ const r = applyLangCv.apply(this, arguments); try { if (tab === 'cv') cvRender0(); phSetRender(); } catch (e) {} return r; }; }
try { if (tab === 'cv' && !(typeof mbLocked === 'function' && mbLocked('cv'))) cvRender0(); } catch (e) {}
