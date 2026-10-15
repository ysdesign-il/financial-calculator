/* ================= 8.0: holiday effects — every holiday theme comes alive (in every design) =================
   ambient layer behind the content (flags, snow, sparks, lanterns' stars, leaves, hearts…), a celebration burst
   in front when the holiday starts (fireworks, a rain of flags), a garland across the top, and a greeting card on Home
   with a waving Israeli flag on Independence Day. Off switch in Settings → Display; reduced motion draws a still frame. */
const HX_IL = ['#0038B8', '#FFFFFF', '#4C8DFF', '#A9C8FF'];
const HXP = {
  atzmaut: {k: 'flag', n: 26, fw: HX_IL, rain: 'flag', gar: 'il', ic: 'flag'},
  yomyerushalayim: {k: 'dust', n: 46, c: ['#E8C97A', '#FFF1C9', '#C9A24A'], fw: ['#E8C97A', '#FFFFFF', '#4C8DFF'], ic: '✨'},
  roshhashana: {k: 'seed', n: 36, c: ['#C81D3A', '#E8475F', '#F4B942'], fw: ['#F4B942', '#E8475F', '#FFE3A0'], ic: '🍎'},
  yomkippur: {k: 'dust', n: 30, c: ['#FFFFFF', '#E6ECFF'], ic: '🕊️'},
  sukkot: {k: 'leaf', n: 30, c: ['#8CBF3F', '#D9A441', '#B5651D', '#6E9E2E'], ic: '🌿'},
  simchattorah: {k: 'confetti', n: 60, c: ['#F4B942', '#4C8DFF', '#FFFFFF', '#E04A5F'], fw: ['#F4B942', '#4C8DFF', '#FFFFFF'], ic: '📜'},
  hanukkah: {k: 'spark', n: 46, c: ['#FFD27A', '#9CC8FF', '#FFFFFF'], fw: ['#FFD27A', '#9CC8FF', '#FFFFFF'], ic: '🕎'},
  tubishvat: {k: 'petal', n: 40, c: ['#FFD1DC', '#FFFFFF', '#F7A9C0'], ic: '🌳'},
  purim: {k: 'confetti', n: 80, c: ['#FF5D8F', '#FFC93C', '#2EC4B6', '#9B5DE5', '#00BBF9'], rain: 'confetti', fw: ['#FF5D8F', '#FFC93C', '#2EC4B6', '#9B5DE5'], ic: '🎭'},
  passover: {k: 'petal', n: 30, c: ['#9BD07A', '#FFFFFF', '#E9C46A'], ic: '🍷'},
  lagbaomer: {k: 'ember', n: 60, c: ['#FFB347', '#FF6A3D', '#FFE08A'], ic: '🔥'},
  shavuot: {k: 'petal', n: 34, c: ['#FFFFFF', '#F6E7A1', '#BFE3A6'], ic: '🌾'},
  tubeav: {k: 'heart', n: 28, c: ['#FF6B8B', '#FFB3C1', '#FFFFFF'], ic: '💞'},
  christmas: {k: 'snow', n: 80, fw: ['#F2C14E', '#E5484D', '#5FD08F', '#FFFFFF'], ic: '🎄'},
  advent: {k: 'snow', n: 46, ic: '🕯️'},
  epiphany: {k: 'star', n: 40, c: ['#FFE29A', '#FFFFFF'], ic: '⭐'},
  newyear: {k: 'confetti', n: 70, c: ['#E8C77A', '#8FB8FF', '#F28AB2', '#7CE0B5', '#FFFFFF'], rain: 'confetti', fw: ['#E8C77A', '#8FB8FF', '#F28AB2', '#7CE0B5', '#FFFFFF'], ic: '🎆'},
  easter: {k: 'petal', n: 36, c: ['#F6C945', '#B7A4F2', '#7FD6B0', '#F7A9C0'], ic: '🥚'},
  valentine: {k: 'heart', n: 34, c: ['#FF4D6D', '#FF8FA3', '#FFFFFF'], ic: '💕'},
  palmsunday: {k: 'leaf', n: 26, c: ['#5E9E3A', '#8CC152', '#3F7D2A'], ic: '🌿'},
  ascension: {k: 'dust', n: 34, c: ['#FFFFFF', '#CFE3FF'], ic: '☁️'},
  pentecost: {k: 'ember', n: 40, c: ['#FF8A3D', '#FFD27A', '#FF5A4E'], ic: '🕊️'},
  assumption: {k: 'star', n: 30, c: ['#FFFFFF', '#CFE3FF', '#FFE29A'], ic: '✨'},
  allsaints: {k: 'dust', n: 30, c: ['#FFD27A', '#FFF1C9'], ic: '🕯️'},
  ramadan: {k: 'star', n: 46, c: ['#FFFFFF', '#F5D98C'], gar: 'lantern', ic: '🌙'},
  eidfitr: {k: 'star', n: 40, c: ['#FFFFFF', '#F7DE8F'], gar: 'lantern', fw: ['#E2B84B', '#FFFFFF', '#118A60'], ic: '🌙'},
  eidadha: {k: 'star', n: 40, c: ['#FFFFFF', '#FFF0C9'], gar: 'lantern', fw: ['#F2A93B', '#FFFFFF', '#3CC6C0'], ic: '🌙'}
};
const HX_GREET = ['atzmaut', 'roshhashana', 'yomkippur', 'sukkot', 'hanukkah', 'purim', 'passover', 'christmas', 'newyear', 'ramadan', 'eidfitr', 'eidadha', 'valentine', 'tubeav'];
const HXS = {key: '', still: false, w: 0, h: 0, dpr: 1, back: null, bx: null, front: null, fx2: null, ps: [], fw: [], rain: [], raf: 0, t0: 0, burstEnd: 0, sprites: {}, flagC: null, wave: null, waveRaf: 0};
const hxMotionOff = () => SET.motion === 'reduced' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const hxKey = () => { const k = (typeof HOL_ACTIVE !== 'undefined' && HOL_ACTIVE) || SET.theme; return SET.hfx !== '0' && HXP[k] ? k : ''; };
const hxR = (a, b) => a + Math.random() * (b - a);
const hxPick = a => a[Math.floor(Math.random() * a.length)];
/* ---------- drawing helpers ---------- */
function hxIlFlag(c, x, y, w, h){   /* the flag of Israel: two blue stripes and a Star of David */
  c.fillStyle = '#FFFFFF'; c.fillRect(x, y, w, h);
  c.fillStyle = '#0038B8'; c.fillRect(x, y + h * 15 / 160, w, h * 25 / 160); c.fillRect(x, y + h * 120 / 160, w, h * 25 / 160);
  const cx = x + w / 2, cy = y + h / 2, r = h * 0.205;
  c.strokeStyle = '#0038B8'; c.lineWidth = Math.max(1, h * 0.034); c.lineJoin = 'miter';
  for (const s of [-1, 1]){ c.beginPath(); for (let i = 0; i < 3; i++){ const a = (s * Math.PI / 2) + i * 2 * Math.PI / 3; const px = cx + r * Math.cos(a), py = cy - r * Math.sin(a); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.stroke(); }
}
function hxSprite(col, size){
  const key = col + size; if (HXS.sprites[key]) return HXS.sprites[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = size * 2; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(size, size, 0, size, size, size); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size * 2, size * 2); HXS.sprites[key] = cv; return cv;
}
function hxHeart(c, s){ c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s, -s * .4, -s * .45, -s * 1.1, 0, -s * .45); c.bezierCurveTo(s * .45, -s * 1.1, s, -s * .4, 0, s * .3); c.fill(); }
/* ---------- particles ---------- */
function hxNew(cfg, kind, top){
  const W = HXS.w, H = HXS.h, cols = cfg.c || ['#FFFFFF'];
  const p = {k: kind, x: hxR(0, W), y: top ? hxR(-H * .3, -10) : hxR(0, H), r: hxR(2, 5), c: hxPick(cols), ph: hxR(0, 6.28), vph: hxR(.02, .08), rot: hxR(0, 6.28), vr: hxR(-.04, .04), vx: hxR(-.3, .3), vy: hxR(.4, 1.2), a: hxR(.55, 1)};
  if (kind === 'snow'){ p.c = '#FFFFFF'; p.r = hxR(1.2, 3.6); p.vy = hxR(.3, 1.1); }
  if (kind === 'confetti'){ p.r = hxR(3, 6); p.vy = hxR(.8, 2); }
  if (kind === 'flag'){ p.r = hxR(5, 9); p.vy = hxR(.5, 1.3); p.vr = hxR(-.02, .02); }
  if (kind === 'heart' || kind === 'spark' || kind === 'ember'){ p.vy = -hxR(.3, kind === 'ember' ? 1.6 : .9); if (top) p.y = H + hxR(10, H * .3); }
  if (kind === 'heart') p.r = hxR(5, 10);
  if (kind === 'leaf' || kind === 'petal'){ p.r = hxR(4, 8); p.vy = hxR(.4, 1.1); }
  if (kind === 'star'){ p.vy = 0; p.vx = 0; p.r = hxR(1.5, 4); p.y = hxR(0, H * .8); }
  if (kind === 'dust'){ p.vy = hxR(-.25, .25); p.vx = hxR(-.25, .25); p.r = hxR(2, 6); }
  if (kind === 'seed'){ p.r = hxR(2.5, 4.5); p.vy = hxR(.6, 1.4); }
  return p;
}
function hxStep(p, cfg, dt){
  const W = HXS.w, H = HXS.h; p.ph += p.vph * dt; p.rot += p.vr * dt;
  p.x += (p.vx + Math.sin(p.ph) * (p.k === 'snow' || p.k === 'petal' || p.k === 'leaf' || p.k === 'flag' ? .6 : .25)) * dt; p.y += p.vy * dt;
  const out = p.vy < 0 ? p.y < -30 : p.y > H + 30;
  if (out || p.x < -40 || p.x > W + 40){ Object.assign(p, hxNew(cfg, p.k, true)); if (p.k === 'dust') { p.x = hxR(0, W); p.y = hxR(0, H); } }
}
function hxDraw(c, p){
  c.save(); c.globalAlpha = p.a; c.translate(p.x, p.y);
  switch (p.k){
    case 'snow': c.fillStyle = '#FFFFFF'; c.shadowColor = 'rgba(255,255,255,.8)'; c.shadowBlur = 4; c.beginPath(); c.arc(0, 0, p.r, 0, 6.283); c.fill(); break;
    case 'confetti': c.rotate(p.rot); c.scale(1, Math.cos(p.ph * 2)); c.fillStyle = p.c; c.fillRect(-p.r, -p.r * .4, p.r * 2, p.r * .8); break;
    case 'flag': { c.rotate(p.rot * .3); c.scale(Math.cos(p.ph * 1.6), 1); const w = p.r * 3, h = p.r * 2.2; c.shadowColor = 'rgba(0,20,80,.35)'; c.shadowBlur = 3; hxIlFlag(c, -w / 2, -h / 2, w, h); c.shadowBlur = 0; c.strokeStyle = 'rgba(0,40,120,.25)'; c.lineWidth = .6; c.strokeRect(-w / 2, -h / 2, w, h); break; }
    case 'heart': c.rotate(Math.sin(p.ph) * .3); c.fillStyle = p.c; c.globalAlpha = p.a * .85; hxHeart(c, p.r); break;
    case 'leaf': c.rotate(p.rot); c.fillStyle = p.c; c.beginPath(); c.ellipse(0, 0, p.r * 1.5, p.r * .7, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .7; c.beginPath(); c.moveTo(-p.r * 1.4, 0); c.lineTo(p.r * 1.4, 0); c.stroke(); break;
    case 'petal': c.rotate(p.rot); c.scale(1, .5 + .5 * Math.abs(Math.cos(p.ph))); c.fillStyle = p.c; c.beginPath(); c.ellipse(0, 0, p.r, p.r * .62, 0, 0, 6.283); c.fill(); break;
    case 'seed': c.fillStyle = p.c; c.beginPath(); c.ellipse(0, 0, p.r * .75, p.r, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-p.r * .25, -p.r * .35, p.r * .25, 0, 6.283); c.fill(); break;
    case 'star': { const tw = .35 + .65 * Math.abs(Math.sin(p.ph)), s = hxSprite(p.c, 12); c.globalAlpha = p.a * tw; c.drawImage(s, -p.r * 3, -p.r * 3, p.r * 6, p.r * 6); c.strokeStyle = p.c; c.lineWidth = .8; c.beginPath(); c.moveTo(-p.r * 2.4 * tw, 0); c.lineTo(p.r * 2.4 * tw, 0); c.moveTo(0, -p.r * 2.4 * tw); c.lineTo(0, p.r * 2.4 * tw); c.stroke(); break; }
    default: { const s = hxSprite(p.c, 16), fl = p.k === 'dust' ? .7 + .3 * Math.sin(p.ph) : .55 + .45 * Math.abs(Math.sin(p.ph * 2)); c.globalAlpha = p.a * fl; c.drawImage(s, -p.r * 2, -p.r * 2, p.r * 4, p.r * 4); }
  }
  c.restore();
}
/* ---------- fireworks (front layer, during the celebration) ---------- */
function hxRocket(cols){ const W = HXS.w, H = HXS.h; HXS.fw.push({rk: 1, x: hxR(W * .15, W * .85), y: H + 10, tx: 0, ty: hxR(H * .14, H * .42), vy: -hxR(9, 12), c: hxPick(cols), cols}); }
function hxBoom(r){
  const n = Math.round(hxR(55, 90)), ring = Math.random() < .35;
  for (let i = 0; i < n; i++){
    const a = (i / n) * 6.283 + hxR(-.05, .05), sp = ring ? 4.2 : hxR(1, 5.2);
    HXS.fw.push({x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, dec: hxR(.010, .018), c: Math.random() < .7 ? r.c : hxPick(r.cols), px: r.x, py: r.y});
  }
}
function hxFront(dt, now){
  const c = HXS.fx2, cfg = HXP[HXS.key]; if (!c || !cfg) return;
  const W = HXS.w, H = HXS.h, left = HXS.burstEnd - now, k = Math.max(0, Math.min(1, left / 1200)), into = Math.min(1, (now - HXS.t0) / 500);
  c.clearRect(0, 0, W, H);
  /* a night sky fades in behind the fireworks and away at the end */
  if (cfg.fw){ c.fillStyle = 'rgba(3,6,22,' + (.5 * Math.min(into, k)).toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
  if (cfg.fw && left > 1600 && Math.random() < .06 * dt) hxRocket(cfg.fw);
  c.globalCompositeOperation = 'lighter';
  for (let i = HXS.fw.length - 1; i >= 0; i--){
    const f = HXS.fw[i];
    if (f.rk){ f.y += f.vy * dt; f.vy += .12 * dt; c.fillStyle = f.c; c.globalAlpha = 1; c.beginPath(); c.arc(f.x, f.y, 2, 0, 6.283); c.fill(); if (f.vy >= -1 || f.y <= f.ty){ hxBoom(f); HXS.fw.splice(i, 1); } continue; }
    f.px = f.x; f.py = f.y; f.vx *= .985; f.vy = f.vy * .985 + .045 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= f.dec * dt;
    if (f.life <= 0){ HXS.fw.splice(i, 1); continue; }
    c.globalAlpha = Math.max(0, f.life) * Math.max(k, .2); c.strokeStyle = f.c; c.lineWidth = 2; c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(f.x, f.y); c.stroke();
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  /* a rain of flags / confetti */
  HXS.rain.forEach(p => { p.ph += p.vph * dt; p.rot += p.vr * dt; p.x += (p.vx + Math.sin(p.ph) * .8) * dt; p.y += p.vy * dt; p.a = Math.min(1, k * 1.2); hxDraw(c, p); });
}
/* ---------- the loop ---------- */
function hxLoop(now){
  HXS.raf = 0; const key = HXS.key, cfg = HXP[key]; if (!key || document.hidden) return;
  const dt = Math.min(3, ((now - (HXS.last || now)) / 16.7) || 1); HXS.last = now;
  const c = HXS.bx; c.clearRect(0, 0, HXS.w, HXS.h);
  HXS.ps.forEach(p => { hxStep(p, cfg, dt); hxDraw(c, p); });
  if (HXS.burstEnd > now) hxFront(dt, now);
  else if (HXS.front && !HXS.front.hidden){ HXS.front.hidden = true; HXS.fw = []; HXS.rain = []; }
  HXS.raf = requestAnimationFrame(hxLoop);
}
function hxSize(){
  const d = HXS.dpr = Math.min(2, window.devicePixelRatio || 1), W = HXS.w = innerWidth, H = HXS.h = innerHeight;
  [[HXS.back, HXS.bx], [HXS.front, HXS.fx2]].forEach(([cv, cx]) => { if (!cv) return; cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(d, 0, 0, d, 0, 0); });
}
function hxLayers(){
  if (HXS.back) return;
  HXS.back = document.createElement('canvas'); HXS.back.className = 'fx-back'; HXS.back.setAttribute('aria-hidden', 'true');
  HXS.front = document.createElement('canvas'); HXS.front.className = 'fx-front'; HXS.front.setAttribute('aria-hidden', 'true'); HXS.front.hidden = true;
  document.body.prepend(HXS.back); document.body.appendChild(HXS.front);
  HXS.bx = HXS.back.getContext('2d'); HXS.fx2 = HXS.front.getContext('2d'); hxSize();
  addEventListener('resize', () => { if (!HXS.key) return; hxSize(); hxSeed(); if (HXS.still) hxStill(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && HXS.key && !HXS.still && !HXS.raf){ HXS.last = 0; HXS.raf = requestAnimationFrame(hxLoop); } });
}
function hxSeed(){
  const cfg = HXP[HXS.key]; if (!cfg) { HXS.ps = []; return; }
  const n = Math.round(cfg.n * Math.max(.6, Math.min(1.6, (HXS.w * HXS.h) / (390 * 844))));
  HXS.ps = Array.from({length: n}, () => hxNew(cfg, cfg.k, false));
}
function hxStill(){ const c = HXS.bx; c.clearRect(0, 0, HXS.w, HXS.h); HXS.ps.forEach(p => hxDraw(c, p)); }
/* the celebration in front: fireworks and a rain of flags (or confetti) for about seven seconds */
function hxBurst(){
  const cfg = HXP[HXS.key]; if (!cfg || HXS.still || (!cfg.fw && !cfg.rain)) return;
  const now = performance.now(); HXS.t0 = now; HXS.burstEnd = now + 7000; HXS.fw = []; HXS.front.hidden = false;
  HXS.rain = cfg.rain ? Array.from({length: Math.round(34 * Math.max(.7, HXS.w / 600))}, () => { const p = hxNew(cfg, cfg.rain, true); p.vy = hxR(1.6, 3.4); p.r = cfg.rain === 'flag' ? hxR(7, 13) : hxR(4, 8); p.y = hxR(-HXS.h * .9, -10); return p; }) : [];
  if (cfg.fw) for (let i = 0; i < 3; i++) setTimeout(() => { if (HXS.burstEnd > performance.now()) hxRocket(cfg.fw); }, i * 260);
  if (!HXS.raf){ HXS.last = 0; HXS.raf = requestAnimationFrame(hxLoop); }
}
/* ---------- garland across the top (Israeli flags, or Ramadan lanterns) ---------- */
function hxGarland(type){
  $$('.fx-gar').forEach(g => g.remove()); if (!type) return;
  const host = $('.main-in'); if (!host) return;
  const g = document.createElement('div'); g.className = 'fx-gar fx-gar-' + type; g.setAttribute('aria-hidden', 'true');
  const n = Math.max(7, Math.min(16, Math.round((host.clientWidth || 360) / 46)));
  let h = '<svg class="fx-str" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 2 Q25 22 50 10 T100 2" /></svg>';
  for (let i = 0; i < n; i++){
    const x = (i + .5) / n, y = 2 + (x < .5 ? 16 * Math.sin(x * 2 * Math.PI) * .55 : 8 * Math.sin((x - .5) * 2 * Math.PI)) + 4;
    const st = `inset-inline-start:calc(${(x * 100).toFixed(2)}% - 11px);top:${(y * 1.35).toFixed(1)}px;animation-delay:${(-i * .37).toFixed(2)}s`;
    if (type === 'il') h += `<span class="fx-f" style="${st}"><svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><rect y="1.5" width="22" height="2.5" fill="#0038B8"/><rect y="12" width="22" height="2.5" fill="#0038B8"/><path d="M11 4.8l2.8 4.8H8.2zM11 11.2L8.2 6.4h5.6z" fill="none" stroke="#0038B8" stroke-width=".7"/></svg></span>`;
    else h += `<span class="fx-f fx-l" style="${st};--ln:${(10 + (i % 3) * 9)}px"><svg viewBox="0 0 20 34"><path d="M10 0v6" stroke="#C9A24A" stroke-width="1"/><path d="M5 8h10l-1 3H6z" fill="#C9A24A"/><path d="M6 11h8l2 6-2 9H6l-2-9z" fill="#3A2A10" stroke="#E2B84B" stroke-width="1"/><path d="M8 13h4l1 4-1 7H8l-1-7z" fill="#FFD27A" class="fx-glow"/><path d="M6 26h8l-2 3H8z" fill="#C9A24A"/></svg></span>`;
  }
  g.innerHTML = h; host.prepend(g);
}
/* ---------- the greeting card on Home, with a waving flag on Independence Day ---------- */
function hxWave(cv){
  cancelAnimationFrame(HXS.waveRaf);
  const d = Math.min(2, window.devicePixelRatio || 1), W = 132, H = 96; cv.width = W * d; cv.height = H * d; const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const fw = 104, fh = 74, off = document.createElement('canvas'); off.width = fw * 2; off.height = fh * 2; const o = off.getContext('2d'); o.scale(2, 2); hxIlFlag(o, 0, 0, fw, fh);
  const pole = 12, top = 10;
  const frame = t => {
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#C9A24A'; c.fillRect(pole - 3, 4, 3, H - 6); c.beginPath(); c.arc(pole - 1.5, 4, 3, 0, 6.283); c.fill();
    for (let x = 0; x < fw; x += 2){
      const ph = x * .07 - t * .004, k = x / fw, dy = Math.sin(ph) * 5 * k, sh = Math.cos(ph) * k;
      c.drawImage(off, x * 2, 0, 4, fh * 2, pole + x, top + dy, 2.4, fh);
      c.fillStyle = sh > 0 ? 'rgba(255,255,255,' + (sh * .18).toFixed(3) + ')' : 'rgba(0,10,40,' + (-sh * .22).toFixed(3) + ')'; c.fillRect(pole + x, top + dy, 2.4, fh);
    }
    if (!HXS.still && cv.isConnected) HXS.waveRaf = requestAnimationFrame(frame);
  };
  frame(0);
}
function hxCard(){
  const old = $('#fxHol'), key = HXS.key; if (!key){ if (old) old.remove(); return; }
  const home = $('#panel-home'); if (!home) return;
  const cfg = HXP[key], E = asEsc;
  const title = HX_GREET.includes(key) ? t('fx_g_' + key) : t('fx_gen', {n: t('sk_' + key)});
  const sub = key === 'atzmaut' ? t('fx_il', {n: new Date().getFullYear() - 1948}) : '';
  const art = cfg.ic === 'flag' ? '<canvas class="fx-wave" width="132" height="96"></canvas>' : `<span class="fx-emo">${cfg.ic}</span>`;
  const html = `<div class="fx-hol fx-hol-${key}" id="fxHol" role="note">${art}<div class="fx-txt"><b>${E(title)}</b>${sub ? `<small>${E(sub)}</small>` : ''}</div>${cfg.fw || cfg.rain ? `<button type="button" class="fx-go" id="fxGo" data-ia="fx_again">🎆</button>` : ''}</div>`;
  if (old && old.dataset.k === key && old.dataset.l === lang) return;
  if (old) old.remove();
  const at = $('.home-hello', home); if (!at) return;
  at.insertAdjacentHTML('beforebegin', html); const el = $('#fxHol'); el.dataset.k = key; el.dataset.l = lang;
  const b = $('#fxGo'); if (b){ b.setAttribute('aria-label', t('fx_again')); b.title = t('fx_again'); }
  const w = $('.fx-wave', el); if (w) hxWave(w);
}
/* ---------- switching ---------- */
function hxSync(){
  const key = hxKey(), r = document.documentElement, still = hxMotionOff();
  if (key === HXS.key && still === HXS.still){ hxCard(); return; }
  HXS.key = key; HXS.still = still; cancelAnimationFrame(HXS.raf); HXS.raf = 0; HXS.burstEnd = 0;
  if (!key){ delete r.dataset.fx; if (HXS.back){ HXS.bx.clearRect(0, 0, HXS.w, HXS.h); HXS.front.hidden = true; } hxGarland(''); hxCard(); return; }
  r.dataset.fx = key; hxLayers(); hxSize(); hxSeed(); hxGarland(HXP[key].gar || ''); hxCard();
  if (still){ hxStill(); return; }
  HXS.last = 0; HXS.raf = requestAnimationFrame(hxLoop);
  let seen = ''; try { seen = sessionStorage.getItem('fx-b') || ''; } catch (e) {}
  if (seen !== key){ try { sessionStorage.setItem('fx-b', key); } catch (e) {} setTimeout(hxBurst, 600); }
}
const _atHx = applyTheme;
applyTheme = function(){ const r = _atHx.apply(this, arguments); try { hxSync(); } catch (e) {} return r; };
const _rsHx = renderStamp;
renderStamp = function(){ const r = _rsHx.apply(this, arguments); try { if (HXS.key) hxCard(); } catch (e) {} return r; };
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#fxGo')) hxBurst(); });
try { if (SET.hfx == null) SET.hfx = '1'; hxSync(); } catch (e) {}
