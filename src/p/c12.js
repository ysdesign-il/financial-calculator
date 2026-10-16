/* ================= 9.0: phones side by side — official specs and launch prices (checked October 2026) ================= */
/* d: display ", hz: refresh, chip, ram GB (0 = not published), st: base storage GB, cam: rear cameras MP, bat: mAh (0 = not published), w: wired W, g: grams,
   pr: [launch price, currency, country], rel: launch month, src: where the figures come from */
var PHONES = {
  at: '2026-10-16',
  list: [
    {id: 'ip18pm', b: 'apple', n: 'iPhone 18 Pro Max', d: 6.9, hz: 120, chip: 'A20 Pro (2nm)', ram: 0, st: 256, cam: [48], bat: 0, w: 0, g: 249, ip: 'IP68', pr: [1299, 'USD', 'US'], rel: '2026-09', src: 'Apple'},
    {id: 'ip18p', b: 'apple', n: 'iPhone 18 Pro', d: 6.3, hz: 120, chip: 'A20 Pro (2nm)', ram: 0, st: 256, cam: [48], bat: 0, w: 0, g: 211, ip: 'IP68', pr: [1199, 'USD', 'US'], rel: '2026-09', src: 'Apple'},
    {id: 'ipair', b: 'apple', n: 'iPhone Air', d: 6.5, hz: 120, chip: 'A19 Pro', ram: 12, st: 256, cam: [48], bat: 3149, w: 20, g: 165, ip: 'IP68', pr: [999, 'USD', 'US'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'ip17', b: 'apple', n: 'iPhone 17', d: 6.3, hz: 120, chip: 'A19', ram: 8, st: 256, cam: [48, 48], bat: 3692, w: 0, g: 177, ip: 'IP68', pr: [799, 'USD', 'US'], rel: '2025-09', src: 'TechCrunch'},
    {id: 'ip17e', b: 'apple', n: 'iPhone 17e', d: 6.1, hz: 60, chip: 'A19', ram: 8, st: 256, cam: [48], bat: 4005, w: 20, g: 169, ip: 'IP68', pr: [599, 'USD', 'US'], rel: '2026-02', src: 'PhoneArena'},
    {id: 's26u', b: 'samsung', n: 'Galaxy S26 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [200, 50, 10, 50], bat: 5000, w: 60, g: 214, ip: 'IP68', pr: [139999, 'INR', 'IN'], rel: '2026-02', src: 'Free Press Journal'},
    {id: 's26p', b: 'samsung', n: 'Galaxy S26+', d: 6.7, hz: 120, chip: 'Snapdragon 8 Elite Gen 5 / Exynos 2600', ram: 12, st: 256, cam: [50, 12, 10], bat: 4900, w: 45, g: 190, ip: 'IP68', pr: [119999, 'INR', 'IN'], rel: '2026-02', src: 'Free Press Journal'},
    {id: 's26', b: 'samsung', n: 'Galaxy S26', d: 6.3, hz: 120, chip: 'Snapdragon 8 Elite Gen 5 / Exynos 2600', ram: 12, st: 256, cam: [50, 12, 10], bat: 4300, w: 25, g: 167, ip: 'IP68', pr: [87999, 'INR', 'IN'], rel: '2026-02', src: 'Free Press Journal'},
    {id: 'a57', b: 'samsung', n: 'Galaxy A57 5G', d: 6.7, hz: 120, chip: 'Exynos 1680', ram: 8, st: 128, cam: [50, 13, 5], bat: 5000, w: 45, g: 179, ip: '', pr: [550, 'USD', 'US'], rel: '2026-03', src: 'PhoneArena'},
    {id: 'px11xl', b: 'google', n: 'Pixel 11 Pro XL', d: 6.8, hz: 120, chip: 'Tensor G6 (2nm)', ram: 16, st: 128, cam: [50, 48, 48], bat: 5115, w: 45, g: 0, ip: 'IP68', pr: [134999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'},
    {id: 'px11p', b: 'google', n: 'Pixel 11 Pro', d: 6.3, hz: 120, chip: 'Tensor G6 (2nm)', ram: 16, st: 128, cam: [50, 48, 48], bat: 4850, w: 30, g: 0, ip: 'IP68', pr: [119999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'},
    {id: 'px11', b: 'google', n: 'Pixel 11', d: 6.3, hz: 120, chip: 'Tensor G6 (2nm)', ram: 12, st: 128, cam: [48, 13, 10.8], bat: 4985, w: 30, g: 0, ip: 'IP68', pr: [89999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'},
    {id: 'x17u', b: 'xiaomi', n: 'Xiaomi 17 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 16, st: 512, cam: [50, 50, 200], bat: 6000, w: 90, g: 0, ip: 'IP68', pr: [1499, 'EUR', 'EU'], rel: '2026-03', src: 'GSMArena'},
    {id: 'x17p', b: 'xiaomi', n: 'Xiaomi 17 Pro', d: 6.3, hz: 144, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 50, 50], bat: 6300, w: 100, g: 192, ip: 'IP68', pr: [0, '', ''], rel: '2025-09', src: 'Smartprix'},
    {id: 'rn15p', b: 'xiaomi', n: 'Redmi Note 15 Pro 5G', d: 6.8, hz: 120, chip: 'Dimensity 7400 Ultra', ram: 8, st: 256, cam: [200, 8], bat: 6580, w: 45, g: 210, ip: '', pr: [449, 'EUR', 'EU'], rel: '2026-01', src: 'PhoneArena'}
  ]
};
function phMine(){ if (!SET.phPrice || typeof SET.phPrice !== 'object') SET.phPrice = {}; return SET.phPrice; }
/* the price in shekels: what you typed (a real Israeli price), or the launch price converted at today's rate (marked as an estimate) */
function phIls(p){
  const own = +phMine()[p.id]; if (own > 0) return {v: own, own: 1};
  const [x, c] = p.pr; if (!(x > 0) || !RATES[c] || !RATES.ILS) return {v: NaN};
  return {v: x * RATES.ILS / RATES[c], own: 0};
}
const phById = id => PHONES.list.find(p => p.id === id);
const phCam = p => p.cam.length + ' · ' + p.cam.map(x => N(x, x % 1 ? 1 : 0)).join('+') + 'MP';
function phScore(p, by){
  const pr = phIls(p).v;
  if (by === 'price') return isFinite(pr) ? -pr : -1e9;
  if (by === 'battery') return (p.bat || 0) + (p.w || 0) * 10;
  if (by === 'camera') return Math.max(...p.cam) / 4 + p.cam.length * 40 + (p.cam.length > 2 ? 30 : 0);
  if (by === 'small') return -(p.d * 100 + (p.g || 200) / 2);
  if (by === 'big') return p.d * 100 + p.hz;
  /* balanced: the specs per shekel */
  const spec = (p.bat || 4500) / 50 + p.cam.length * 25 + (p.ram || 8) * 4 + p.hz / 2 + p.st / 16;
  return isFinite(pr) && pr > 0 ? spec / pr * 1000 : spec / 10;
}
function calcPhoneCmp(){
  const by = ($('#ph_by') || {}).value || 'balanced', brand = ($('#ph_brand') || {}).value || 'all', budget = Math.max(0, v('ph_budget'));
  const pick = ['ph_a', 'ph_b', 'ph_c'].map(id => ($('#' + id) || {}).value).filter(x => x && x !== 'none').map(phById).filter(Boolean);
  let L = PHONES.list.filter(p => brand === 'all' || p.b === brand);
  if (budget > 0) L = L.filter(p => { const x = phIls(p).v; return !isFinite(x) || x <= budget; });
  const S = L.slice().sort((a, b) => phScore(b, by) - phScore(a, by));
  const pr = p => { const x = phIls(p); return isFinite(x.v) ? (x.own ? '' : '≈') + M(x.v) : '—'; };
  const note = t('n_ph', {d: PHONES.at});
  const best = S[0];
  /* the phones you picked, side by side */
  const cmp = pick.length >= 2 ? pick : S.slice(0, 3);
  const spec = [[t('ph_price'), p => pr(p)], [t('ph_launch'), p => p.pr[0] > 0 ? N(p.pr[0], 0) + ' ' + p.pr[1] + ' (' + p.pr[2] + ')' : t('ph_na')], [t('ph_screen'), p => N(p.d, 1) + '″ · ' + p.hz + 'Hz'],
    [t('ph_chip'), p => p.chip], [t('ph_ram'), p => p.ram ? p.ram + 'GB' : t('ph_na')], [t('ph_storage'), p => p.st >= 1000 ? p.st / 1024 + 'TB' : p.st + 'GB'], [t('ph_cam'), phCam],
    [t('ph_bat'), p => p.bat ? N(p.bat, 0) + ' mAh' : t('ph_na')], [t('ph_charge'), p => p.w ? p.w + 'W' : t('ph_na')], [t('ph_weight'), p => p.g ? p.g + 'g' : t('ph_na')], [t('ph_water'), p => p.ip || '—'], [t('ph_rel'), p => p.rel]];
  const rows = [];
  if (best) rows.push([t('ph_bestBy', {b: t('o_ph_' + by)}), best.n + ' · ' + pr(best), 'key']);
  S.slice(1, 5).forEach((p, i) => rows.push([(i + 2) + '. ' + p.n, pr(p)]));
  rows.push([t('ph_count', {n: S.length, a: PHONES.list.length}), '']);
  const warn = [];
  if (cmp.some(p => !phIls(p).own)) warn.push(t('w_phEst'));
  return {
    hero: best ? {label: t('ph_hero', {b: t('o_ph_' + by)}), value: best.n, sub: pr(best) + ' · ' + N(best.d, 1) + '″ · ' + (best.bat ? N(best.bat, 0) + ' mAh · ' : '') + phCam(best)} : {label: t('ph_none'), value: '—'},
    rows, warn,
    table2: {title: t('t_phSide'), open: true, head: [''].concat(cmp.map(p => p.n)), rows: spec.map(([lab, f]) => ({c: [lab].concat(cmp.map(f))}))},
    table: {title: t('t_phAll'), head: ['', t('ph_price'), t('ph_screen'), t('ph_bat'), t('ph_cam'), t('ph_chip')], rows: S.map(p => [p.n, pr(p), N(p.d, 1) + '″', p.bat ? N(p.bat, 0) : '—', phCam(p), p.chip])},
    note
  };
}
Object.assign(CALC, {phonecmp: calcPhoneCmp});
