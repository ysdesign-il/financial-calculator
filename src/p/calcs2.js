/* 13.31: unit converter, statistics and practice mode – inside the "calculators" topic (engine: mx_engine.js, steps: mx_solve.js) */
(function cs2Css(){ if (document.getElementById('cs2css')) return; const st = document.createElement('style'); st.id = 'cs2css';
  st.textContent = `.un-row{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:end}.un-row .bk-f{min-width:0}.un-row select{width:100%;max-width:100%}.un-swap{min-height:40px;min-width:44px;font-size:1.1rem}
.un-tbl,.st2-tbl{width:100%;border-collapse:collapse;font-size:.86rem;margin:6px 0}.un-tbl td,.st2-tbl td,.st2-tbl th{padding:5px 6px;border-bottom:1px solid var(--line);text-align:start}.un-tbl td:last-child{text-align:end;font-variant-numeric:tabular-nums}
.st2-tbl th{color:var(--ink-2);font-weight:600}.st2-tbl td.n{text-align:end;font-variant-numeric:tabular-nums}.st2-ta{width:100%;min-height:96px;font:16px/1.4 ui-monospace,Menlo,monospace;border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--surface,transparent);color:var(--ink)}
.st2-plot{width:100%;height:auto;margin:6px 0}.pr-q{font-size:1.5rem;font-weight:600;margin:6px 0 10px;text-align:center}.pr-txt{font-size:1.05rem;margin:4px 0;text-align:center}
.pr-ans{display:flex;gap:8px;align-items:center}.pr-ans button{flex:0 0 auto}.pr-ans input{flex:1 1 auto;min-width:0;width:100%;font:inherit;font-size:16px;min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface,transparent);color:var(--ink);padding:4px 10px}
.pr-ok{color:#1b7f4b;font-weight:700}.pr-no{color:#b3261e;font-weight:700}.pr-score{display:flex;gap:14px;flex-wrap:wrap;font-size:.85rem;color:var(--ink-2);margin:6px 0}`;
  document.head.appendChild(st); })();
const cs2N = v => { if (typeof v !== 'number' || !isFinite(v)) return '—'; return mxFmt(+v.toPrecision(12)); };
const cs2Num = s => { const x = parseFloat(String(s == null ? '' : s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[−–]/g, '-').replace(/,/g, '.').replace(/[^0-9.eE+\-]/g, '')); return isFinite(x) ? x : NaN; };

/* ================= unit converter ================= */
/* each unit: [id, factor to the category's base unit, he, ar, en] */
const UN_CATS = {
  len: [['mm', 1e-3, 'מילימטר', 'مليمتر', 'millimetre'], ['cm', 1e-2, 'סנטימטר', 'سنتيمتر', 'centimetre'], ['m', 1, 'מטר', 'متر', 'metre'], ['km', 1e3, 'קילומטר', 'كيلومتر', 'kilometre'], ['in', 0.0254, 'אינץ׳', 'إنش', 'inch'], ['ft', 0.3048, 'רגל', 'قدم', 'foot'], ['yd', 0.9144, 'יארד', 'ياردة', 'yard'], ['mi', 1609.344, 'מייל', 'ميل', 'mile'], ['nmi', 1852, 'מייל ימי', 'ميل بحري', 'nautical mile']],
  mass: [['mg', 1e-6, 'מיליגרם', 'مليغرام', 'milligram'], ['g', 1e-3, 'גרם', 'غرام', 'gram'], ['kg', 1, 'קילוגרם', 'كيلوغرام', 'kilogram'], ['t', 1e3, 'טון', 'طن', 'tonne'], ['oz', 0.028349523125, 'אונקיה', 'أونصة', 'ounce'], ['lb', 0.45359237, 'ליברה (פאונד)', 'رطل (باوند)', 'pound'], ['st', 6.35029318, 'סטון', 'ستون', 'stone']],
  vol: [['ml', 1e-3, 'מיליליטר', 'مليلتر', 'millilitre'], ['l', 1, 'ליטר', 'لتر', 'litre'], ['m3', 1e3, 'מטר מעוקב', 'متر مكعب', 'cubic metre'], ['tsp', 0.00492892159375, 'כפית (US)', 'ملعقة صغيرة (US)', 'teaspoon (US)'], ['tbsp', 0.01478676478125, 'כף (US)', 'ملعقة كبيرة (US)', 'tablespoon (US)'], ['cup', 0.2365882365, 'כוס (US)', 'كوب (US)', 'cup (US)'], ['floz', 0.0295735295625, 'אונקיית נוזל (US)', 'أونصة سائلة (US)', 'fluid ounce (US)'], ['gal', 3.785411784, 'גלון (US)', 'غالون (US)', 'gallon (US)'], ['galuk', 4.54609, 'גלון בריטי', 'غالون بريطاني', 'gallon (UK)']],
  temp: [['c', 0, 'צלזיוס (°C)', 'مئوية (°C)', 'Celsius (°C)'], ['f', 0, 'פרנהייט (°F)', 'فهرنهايت (°F)', 'Fahrenheit (°F)'], ['k', 0, 'קלווין (K)', 'كلفن (K)', 'Kelvin (K)']],
  area: [['cm2', 1e-4, 'סמ״ר', 'سم²', 'cm²'], ['m2', 1, 'מ״ר', 'م²', 'm²'], ['dunam', 1e3, 'דונם', 'دونم', 'dunam'], ['ha', 1e4, 'הקטר', 'هكتار', 'hectare'], ['km2', 1e6, 'קמ״ר', 'كم²', 'km²'], ['ft2', 0.09290304, 'רגל רבועה', 'قدم مربع', 'square foot'], ['acre', 4046.8564224, 'אקר', 'فدان (أكر)', 'acre']],
  speed: [['ms', 1, 'מטר לשנייה', 'متر/ثانية', 'metres per second'], ['kmh', 1 / 3.6, 'קמ״ש', 'كم/ساعة', 'km/h'], ['mph', 0.44704, 'מייל לשעה', 'ميل/ساعة', 'mph'], ['kn', 1852 / 3600, 'קשר', 'عقدة', 'knot'], ['fts', 0.3048, 'רגל לשנייה', 'قدم/ثانية', 'feet per second']],
  time: [['ms', 1e-3, 'מילישנייה', 'ملي ثانية', 'millisecond'], ['s', 1, 'שנייה', 'ثانية', 'second'], ['min', 60, 'דקה', 'دقيقة', 'minute'], ['h', 3600, 'שעה', 'ساعة', 'hour'], ['d', 86400, 'יום', 'يوم', 'day'], ['wk', 604800, 'שבוע', 'أسبوع', 'week'], ['yr', 31536000, 'שנה (365 ימים)', 'سنة (365 يومًا)', 'year (365 days)']],
  data: [['bit', 0.125, 'ביט', 'بت', 'bit'], ['b', 1, 'בייט', 'بايت', 'byte'], ['kb', 1e3, 'קילובייט (KB)', 'كيلوبايت (KB)', 'kilobyte (KB)'], ['mb', 1e6, 'מגהבייט (MB)', 'ميغابايت (MB)', 'megabyte (MB)'], ['gb', 1e9, 'ג׳יגהבייט (GB)', 'غيغابايت (GB)', 'gigabyte (GB)'], ['tb', 1e12, 'טרהבייט (TB)', 'تيرابايت (TB)', 'terabyte (TB)'], ['kib', 1024, 'KiB (1024 בייט)', 'KiB (1024 بايت)', 'KiB (1024 bytes)'], ['mib', 1048576, 'MiB', 'MiB', 'MiB'], ['gib', 1073741824, 'GiB', 'GiB', 'GiB']],
  energy: [['j', 1, 'ג׳אול', 'جول', 'joule'], ['kj', 1e3, 'קילוג׳אול', 'كيلوجول', 'kilojoule'], ['cal', 4.184, 'קלוריה', 'سعرة', 'calorie'], ['kcal', 4184, 'קילוקלוריה', 'كيلو سعرة', 'kilocalorie'], ['wh', 3600, 'ואט־שעה', 'واط ساعة', 'watt-hour'], ['kwh', 3.6e6, 'קוט״ש', 'كيلوواط ساعة', 'kilowatt-hour'], ['btu', 1055.05585262, 'BTU', 'BTU', 'BTU']],
  press: [['pa', 1, 'פסקל', 'باسكال', 'pascal'], ['kpa', 1e3, 'קילופסקל', 'كيلوباسكال', 'kilopascal'], ['bar', 1e5, 'בר', 'بار', 'bar'], ['atm', 101325, 'אטמוספרה', 'ضغط جوي', 'atmosphere'], ['psi', 6894.757293168, 'PSI', 'PSI', 'psi'], ['mmhg', 133.322387415, 'מ״מ כספית', 'ملم زئبق', 'mmHg']],
  fuel: [['l100', 0, 'ליטר ל־100 ק״מ', 'لتر/100 كم', 'L/100 km'], ['kml', 0, 'ק״מ לליטר', 'كم/لتر', 'km/L'], ['mpg', 0, 'מייל לגלון (US)', 'ميل/غالون (US)', 'mpg (US)']]
};
const UN_ORDER = ['len', 'mass', 'vol', 'temp', 'area', 'speed', 'time', 'data', 'energy', 'press', 'fuel'];
const UN_DEF = {len: ['km', 'mi'], mass: ['kg', 'lb'], vol: ['l', 'gal'], temp: ['c', 'f'], area: ['m2', 'dunam'], speed: ['kmh', 'mph'], time: ['h', 'min'], data: ['gb', 'mb'], energy: ['kwh', 'kj'], press: ['bar', 'psi'], fuel: ['l100', 'kml']};
const unLangI = () => ({he: 0, ar: 1, en: 2})[lang] != null ? ({he: 0, ar: 1, en: 2})[lang] : 2;
const unName = (cat, id) => { const u = UN_CATS[cat].find(x => x[0] === id); return u ? u[2 + unLangI()] : id; };
const UN_MPG = 1.609344 / 3.785411784;   // 1 mpg (US) in km/L
/* convert through a base: temperature → °C, fuel → km/L */
function unToBase(cat, id, v){
  if (cat === 'temp') return id === 'c' ? v : id === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
  if (cat === 'fuel') return id === 'kml' ? v : id === 'mpg' ? v * UN_MPG : (v ? 100 / v : NaN);
  return v * UN_CATS[cat].find(x => x[0] === id)[1];
}
function unFromBase(cat, id, b){
  if (cat === 'temp') return id === 'c' ? b : id === 'f' ? b * 9 / 5 + 32 : b + 273.15;
  if (cat === 'fuel') return id === 'kml' ? b : id === 'mpg' ? b / UN_MPG : (b ? 100 / b : NaN);
  return b / UN_CATS[cat].find(x => x[0] === id)[1];
}
const unConv = (cat, a, b, v) => unFromBase(cat, b, unToBase(cat, a, v));
/* the way: one line, or two for temperature through Celsius */
function unWay(cat, a, b, v, r){
  const n = cs2N, A = unName(cat, a), B = unName(cat, b);
  if (a === b) return [`${n(v)} = ${n(r)}`];
  if (cat === 'temp'){
    const toC = {f: x => `°C = (°F − 32) × 5/9 → (${n(x)} − 32) × 5/9 = ${n((x - 32) * 5 / 9)}`, k: x => `°C = K − 273.15 → ${n(x)} − 273.15 = ${n(x - 273.15)}`};
    const fromC = {f: c => `°F = °C × 9/5 + 32 → ${n(c)} × 9/5 + 32 = ${n(c * 9 / 5 + 32)}`, k: c => `K = °C + 273.15 → ${n(c)} + 273.15 = ${n(c + 273.15)}`};
    const L = [], c = unToBase('temp', a, v); if (a !== 'c') L.push(toC[a](v)); if (b !== 'c') L.push(fromC[b](c)); return L;
  }
  if (cat === 'fuel'){
    const L = [];
    if (a === 'l100') L.push(`km/L = 100 ÷ L/100km → 100 ÷ ${n(v)} = ${n(unToBase('fuel', a, v))}`);
    if (a === 'mpg') L.push(`km/L = mpg × 1.609344 ÷ 3.785411784 → ${n(v)} × ${n(UN_MPG)} = ${n(unToBase('fuel', a, v))}`);
    const k = unToBase('fuel', a, v);
    if (b === 'l100') L.push(`L/100km = 100 ÷ km/L → 100 ÷ ${n(k)} = ${n(r)}`);
    if (b === 'mpg') L.push(`mpg = km/L ÷ ${n(UN_MPG)} → ${n(k)} ÷ ${n(UN_MPG)} = ${n(r)}`);
    if (!L.length) L.push(`${n(v)} = ${n(r)}`); return L;
  }
  const f = UN_CATS[cat].find(x => x[0] === a)[1] / UN_CATS[cat].find(x => x[0] === b)[1];
  return [t('un_factor', {a: A, f: n(f), b: B}), `${n(v)} × ${n(f)} = ${n(r)}`];
}
function unD(){ const d = miD('units'); if (!UN_CATS[d.cat]) d.cat = 'len'; const ids = UN_CATS[d.cat].map(x => x[0]); if (!ids.includes(d.a)) d.a = UN_DEF[d.cat][0]; if (!ids.includes(d.b)) d.b = UN_DEF[d.cat][1]; if (d.v == null) d.v = '1'; return d; }
function unOut(){
  const box = document.getElementById('un_out'); if (!box) return; const d = unD(), E = csE, v = cs2Num(d.v);
  if (!isFinite(v)){ box.innerHTML = `<p class="fine">${E(t('un_need'))}</p>`; return; }
  const r = unConv(d.cat, d.a, d.b, v);
  if (!isFinite(r)){ box.innerHTML = `<p class="mx-err">⚠️ ${E(t('un_bad'))}</p>`; return; }
  const way = unWay(d.cat, d.a, d.b, v, r);
  box.innerHTML = `<div class="cs-res"><div class="mx-lab">${E(cs2N(v))} ${E(unName(d.cat, d.a))} =</div><div class="cs-big" dir="ltr">${E(cs2N(r))}</div><div class="mx-sub">${E(unName(d.cat, d.b))}</div></div>
    <details class="mx-steps xs-steps" open><summary>🪜 ${E(t('un_way'))}</summary><ol class="xs-ol">${way.map(w => /[\u0590-\u05FF\u0600-\u06FF]/.test(w) ? `<li><div class="xs-k">${xsKtxt(w)}</div></li>` : `<li><div class="xs-m" dir="ltr">${E(w)}</div></li>`).join('')}</ol></details>
    <details class="adv"><summary>📋 ${E(t('un_all'))}</summary><table class="un-tbl">${UN_CATS[d.cat].map(u => { const x = unConv(d.cat, d.a, u[0], v); return `<tr><td>${E(u[2 + unLangI()])}</td><td dir="ltr">${E(cs2N(x))}</td></tr>`; }).join('')}</table></details>`;
}
miniDef('units', {
  resettable: true,
  render(box){
    const d = unD(), E = csE, opts = sel => UN_CATS[d.cat].map(u => `<option value="${u[0]}"${u[0] === sel ? ' selected' : ''}>${E(u[2 + unLangI()])}</option>`).join('');
    box.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${UN_ORDER.map(c => `<button type="button" role="tab" class="ds-chip${c === d.cat ? ' on' : ''}" aria-selected="${c === d.cat}" data-uncat="${c}">${E(t('un_c_' + c))}</button>`).join('')}</div>
      <div class="mi-card"><label class="bk-f"><span>${E(t('un_value'))}</span><input type="text" inputmode="decimal" dir="ltr" id="un_v" value="${E(d.v)}"></label>
      <div class="un-row"><label class="bk-f"><span>${E(t('un_from'))}</span><select id="un_a">${opts(d.a)}</select></label><button type="button" class="mv un-swap" id="un_swap" aria-label="${E(t('un_swap'))}">⇄</button><label class="bk-f"><span>${E(t('un_to'))}</span><select id="un_b">${opts(d.b)}</select></label></div></div>
      <div id="un_out" aria-live="polite"></div>
      ${d.cat === 'vol' || d.cat === 'fuel' ? `<p class="fine">${E(t('un_usNote'))}</p>` : ''}${d.cat === 'data' ? `<p class="fine">${E(t('un_dataNote'))}</p>` : ''}`;
    unOut();
  }
});

/* ================= statistics ================= */
const st2Parse = s => String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[−–]/g, '-').split(/[\s,;|]+/).map(x => x.trim()).filter(Boolean).map(Number).filter(x => isFinite(x));
const st2Med = a => { const n = a.length; if (!n) return NaN; const m = Math.floor(n / 2); return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
function st2Calc(xs){
  const a = xs.slice().sort((p, q) => p - q), n = a.length, sum = a.reduce((s, x) => s + x, 0), mean = sum / n;
  const half = Math.floor(n / 2), lo = a.slice(0, half), hi = a.slice(n % 2 ? half + 1 : half);
  const q1 = n >= 4 ? st2Med(lo) : NaN, q3 = n >= 4 ? st2Med(hi) : NaN;
  const ss = a.reduce((s, x) => s + (x - mean) * (x - mean), 0), vp = ss / n, vs = n > 1 ? ss / (n - 1) : NaN;
  const cnt = {}; a.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }); const mx = Math.max.apply(null, Object.values(cnt));
  const modes = mx > 1 ? Object.keys(cnt).filter(k => cnt[k] === mx).map(Number) : [];
  return {a, n, sum, mean, med: st2Med(a), q1, q3, iqr: q3 - q1, min: a[0], max: a[n - 1], vp, vs, sp: Math.sqrt(vp), ssd: Math.sqrt(vs), ss, modes, mx, cv: mean ? Math.sqrt(vp) / Math.abs(mean) * 100 : NaN};
}
function st2Plot(R){
  if (R.n < 2 || R.max === R.min) return '';
  const W = 320, H = 70, P = 14, X = v => P + (v - R.min) / (R.max - R.min) * (W - 2 * P), y = 30;
  const dots = R.a.map(v => `<circle cx="${X(v).toFixed(1)}" cy="${y + 22}" r="3" fill="var(--gold,#9A6A06)" opacity=".7"/>`).join('');
  const box = isFinite(R.q1) ? `<rect x="${X(R.q1).toFixed(1)}" y="${y - 10}" width="${Math.max(1, X(R.q3) - X(R.q1)).toFixed(1)}" height="20" fill="none" stroke="currentColor" stroke-width="1.5" rx="3"/>` : '';
  return `<svg class="st2-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${csE(t('st2_plot'))}" dir="ltr"><line x1="${X(R.min)}" x2="${X(R.max)}" y1="${y}" y2="${y}" stroke="currentColor" stroke-width="1.2"/>${box}<line x1="${X(R.med).toFixed(1)}" x2="${X(R.med).toFixed(1)}" y1="${y - 10}" y2="${y + 10}" stroke="var(--gold,#9A6A06)" stroke-width="2.5"/><line x1="${X(R.mean).toFixed(1)}" x2="${X(R.mean).toFixed(1)}" y1="${y - 14}" y2="${y + 14}" stroke="currentColor" stroke-dasharray="2 2"/>${dots}<text x="${P}" y="12" font-size="10" fill="currentColor">${csE(cs2N(R.min))}</text><text x="${W - P}" y="12" font-size="10" fill="currentColor" text-anchor="end">${csE(cs2N(R.max))}</text></svg><p class="fine">${csE(t('st2_plotKey'))}</p>`;
}
function st2Out(){
  const box = document.getElementById('st2_out'); if (!box) return; const E = csE, xs = st2Parse(miD('stats').txt), n = cs2N;
  if (!xs.length){ box.innerHTML = `<p class="fine">${E(t('st2_need'))}</p>`; return; }
  if (xs.length > 5000){ box.innerHTML = `<p class="mx-err">⚠️ ${E(t('st2_many'))}</p>`; return; }
  const R = st2Calc(xs), row = (k, v) => `<tr><td>${E(t(k))}</td><td class="n" dir="ltr">${E(v)}</td></tr>`;
  const mid = R.n % 2 ? t('st2_midOdd', {p: (R.n + 1) / 2}) : t('st2_midEven', {p: R.n / 2, q: R.n / 2 + 1});
  const sorted = R.a.length <= 60 ? R.a.map(n).join(', ') : R.a.slice(0, 30).map(n).join(', ') + ', …';
  const devs = R.n <= 20 ? `<table class="st2-tbl" dir="ltr"><tr><th>x</th><th>x − x̄</th><th>(x − x̄)²</th></tr>${R.a.map(x => `<tr><td class="n">${E(n(x))}</td><td class="n">${E(n(x - R.mean))}</td><td class="n">${E(n((x - R.mean) * (x - R.mean)))}</td></tr>`).join('')}</table>` : `<p class="fine">${E(t('st2_devsBig'))}</p>`;
  box.innerHTML = `<div class="cs-res"><div class="mx-lab">${E(t('st2_mean'))}</div><div class="cs-big" dir="ltr">${E(n(R.mean))}</div><div class="mx-sub">${E(t('st2_nOf', {n: R.n}))}</div></div>
    ${st2Plot(R)}
    <table class="st2-tbl">${row('st2_count', String(R.n))}${row('st2_sum', n(R.sum))}${row('st2_mean', n(R.mean))}${row('st2_median', n(R.med))}${row('st2_mode', R.modes.length ? R.modes.slice(0, 6).map(n).join(', ') + (R.modes.length > 6 ? '…' : '') + ' (×' + R.mx + ')' : t('st2_noMode'))}
      ${row('st2_min', n(R.min))}${row('st2_max', n(R.max))}${row('st2_range', n(R.max - R.min))}${row('st2_q1', isFinite(R.q1) ? n(R.q1) : '—')}${row('st2_q3', isFinite(R.q3) ? n(R.q3) : '—')}${row('st2_iqr', isFinite(R.iqr) ? n(R.iqr) : '—')}
      ${row('st2_vp', n(R.vp))}${row('st2_sp', n(R.sp))}${row('st2_vs', isFinite(R.vs) ? n(R.vs) : '—')}${row('st2_ssd', isFinite(R.ssd) ? n(R.ssd) : '—')}${row('st2_cv', isFinite(R.cv) ? n(R.cv) + '%' : '—')}</table>
    <p class="fine">${E(t('st2_qNote'))}</p>
    <details class="mx-steps xs-steps"><summary>🪜 ${E(t('st2_way'))}</summary><ol class="xs-ol">
      <li><div class="xs-k">${xsKtxt(t('st2_wMean'))}</div><div class="xs-m" dir="ltr">x̄ = Σx ÷ n = ${E(n(R.sum))} ÷ ${R.n} = ${E(n(R.mean))}</div></li>
      <li><div class="xs-k">${xsKtxt(t('st2_wSort'))}</div><div class="xs-m" dir="ltr">${E(sorted)}</div></li>
      <li><div class="xs-k">${xsKtxt(t('st2_wMed') + ' ' + mid)}</div><div class="xs-m" dir="ltr">${R.n % 2 ? E(t('st2_medIs') + ' ' + n(R.med)) : E('(' + n(R.a[R.n / 2 - 1]) + ' + ' + n(R.a[R.n / 2]) + ') ÷ 2 = ' + n(R.med))}</div></li>
      <li><div class="xs-k">${xsKtxt(t('st2_wDev'))}</div>${devs}<div class="xs-m" dir="ltr">Σ(x − x̄)² = ${E(n(R.ss))}</div></li>
      <li><div class="xs-k">${xsKtxt(t('st2_wVar'))}</div><div class="xs-m" dir="ltr">σ² = ${E(n(R.ss))} ÷ ${R.n} = ${E(n(R.vp))} · σ = √${E(n(R.vp))} = ${E(n(R.sp))}${R.n > 1 ? `<br>s² = ${E(n(R.ss))} ÷ ${R.n - 1} = ${E(n(R.vs))} · s = √${E(n(R.vs))} = ${E(n(R.ssd))}` : ''}</div></li>
    </ol></details>`;
}
miniDef('stats', {
  resettable: true,
  render(box){
    const d = miD('stats'), E = csE; if (typeof d.txt !== 'string') d.txt = '4, 8, 15, 16, 23, 42';
    box.innerHTML = `<div class="mi-card"><label class="bk-f" for="st2_ta"><span>${E(t('st2_in'))}</span></label><textarea id="st2_ta" class="st2-ta" dir="ltr" spellcheck="false" inputmode="decimal">${E(d.txt)}</textarea>
      <div class="btnrow"><button type="button" class="mv" id="st2_ex">📚 ${E(t('st2_example'))}</button><button type="button" class="mv" id="st2_clr">${E(t('st2_clear'))}</button></div></div>
      <div id="st2_out" aria-live="polite"></div>`;
    st2Out();
  }
});

/* ================= practice mode ================= */
const PR_TOPICS = ['ops', 'frac', 'pct', 'lin', 'quad', 'pow'];
const prR = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const prNZ = (a, b) => { let x = 0; while (!x) x = prR(a, b); return x; };
const prG = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/* a polynomial-ish term list → "2x - 3" with clean signs */
function prLin(terms){ let s = ''; terms.forEach(([c, v], i) => { if (!c) return; const neg = c < 0, ab = Math.abs(c), body = v ? (ab === 1 ? v : ab + v) : String(ab); s += (s ? (neg ? ' - ' : ' + ') : (neg ? '-' : '')) + body; }); return s || '0'; }
function prMake(topic, lv){
  const L = lv === 'hard' ? 3 : lv === 'medium' ? 2 : 1;
  if (topic === 'ops'){
    if (L === 1){ const a = prR(2, 20), b = prR(2, 9), c = prR(2, 9); return {expr: `${a} + ${b} * ${c}`, ans: [a + b * c]}; }
    if (L === 2){ const a = prR(2, 12), b = prR(2, 12), c = prR(2, 6), e = prR(2, 6), dd = e * prR(1, 6); return {expr: `(${a} + ${b}) * ${c} - ${dd} / ${e}`, ans: [(a + b) * c - dd / e]}; }
    const a = prR(2, 6), b = prR(2, 9), c = prR(6, 15), dd = prR(1, 5), e = prR(1, 20); return {expr: `${a}^2 - ${b} * (${c} - ${dd}) + ${e}`, ans: [a * a - b * (c - dd) + e]};
  }
  if (topic === 'frac'){
    const den = L === 1 ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
    const b = den[prR(0, den.length - 1)], d = L === 1 ? b : den[prR(0, den.length - 1)], a = prR(1, b - 1 || 1), c = prR(1, d + 2);
    const op = L === 3 ? ['*', '/'][prR(0, 1)] : L === 2 ? ['+', '-'][prR(0, 1)] : '+';
    const v = op === '+' ? a / b + c / d : op === '-' ? a / b - c / d : op === '*' ? a / b * (c / d) : (a / b) / (c / d);
    return {expr: op === '/' ? `(${a}/${b}) / (${c}/${d})` : `${a}/${b} ${op} ${c}/${d}`, ans: [v], frac: true};
  }
  if (topic === 'pct'){
    if (L === 1){ const p = [10, 20, 25, 50, 5, 15][prR(0, 5)], y = prR(2, 40) * 20; return {expr: `${y} * ${p} / 100`, ans: [y * p / 100], q: t('pr_pctOf', {p, y})}; }
    if (L === 2){ const p = [10, 15, 20, 25, 30, 40][prR(0, 5)], y = prR(2, 50) * 20; return {expr: `${y} * (1 - ${p} / 100)`, ans: [y * (1 - p / 100)], q: t('pr_pctOff', {p, y})}; }
    const b = prR(2, 40) * 10, p = [5, 10, 12.5, 20, 25, 40, 60, 75][prR(0, 7)], a = b * p / 100; return {expr: `${a} / ${b} * 100`, ans: [p], q: t('pr_pctWhat', {a: cs2N(a), b})};
  }
  if (topic === 'lin'){
    const x0 = L === 1 ? prR(-5, 12) : prR(-10, 10);
    if (L === 1){ const a = prNZ(2, 9), b = prR(-15, 15), c = a * x0 + b; return {expr: `${prLin([[a, 'x'], [b, '']])} = ${c}`, ans: [x0], eq: true}; }
    if (L === 2){ let a = prNZ(-9, 9), c = prNZ(-9, 9); if (a === c) c = a + 1 || 2; const b = prR(-12, 12), d = (a - c) * x0 + b; return {expr: `${prLin([[a, 'x'], [b, '']])} = ${prLin([[c, 'x'], [d, '']])}`, ans: [x0], eq: true}; }
    let a = prNZ(2, 6), c = prNZ(-6, 6); if (a === c) c = a + 1; const b = prR(-6, 6), d = a * (x0 + b) - c * x0; return {expr: `${a}(x ${b < 0 ? '-' : '+'} ${Math.abs(b)}) = ${prLin([[c, 'x'], [d, '']])}`, ans: [x0], eq: true};
  }
  if (topic === 'quad'){
    const r1 = prR(-7, 7), r2 = L === 3 && Math.random() < .25 ? r1 : prR(-7, 7), a = L === 1 ? 1 : L === 2 ? prR(1, 3) : prNZ(-3, 3);
    return {expr: `${prLin([[a, 'x^2'], [-a * (r1 + r2), 'x'], [a * r1 * r2, '']])} = 0`, ans: r1 === r2 ? [r1] : [r1, r2], eq: true};
  }
  /* powers and roots */
  if (L === 1){ if (Math.random() < .5){ const a = prR(2, 15); return {expr: `${a}^2`, ans: [a * a]}; } const a = prR(2, 15); return {expr: `sqrt(${a * a})`, ans: [a]}; }
  if (L === 2){ const k = prR(0, 2); if (k === 0){ const a = prR(2, 6); return {expr: `${a}^3`, ans: [a ** 3]}; } if (k === 1){ const a = prR(2, 6); return {expr: `cbrt(${a ** 3})`, ans: [a]}; } const e = prR(3, 10); return {expr: `2^${e}`, ans: [2 ** e]}; }
  const T3 = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]][prR(0, 4)], m = prR(2, 4), e = prR(2, 4);
  return Math.random() < .5 ? {expr: `sqrt(${T3[0]}^2 + ${T3[1]}^2)`, ans: [T3[2]]} : {expr: `sqrt(${m * m}) * ${m}^${e}`, ans: [m * m ** e]};
}
/* the user's answer: numbers, fractions (3/4), mixed (1 3/4), roots separated by commas or "or" */
function prParseAns(s){
  const parts = String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[−–]/g, '-').replace(/x\s*\d?\s*=/gi, '').split(/[,;|]|\bor\b|או|أو/i).map(x => x.trim()).filter(Boolean);
  return parts.map(p => { let m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(p); if (m) return (m[1] ? -1 : 1) * (+m[2] + +m[3] / +m[4]);
    m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(p); if (m) return +m[2] ? +m[1] / +m[2] : NaN;
    const x = Number(p.replace(/%$/, '')); return isFinite(x) ? x : NaN; });
}
const prClose = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b)) || Math.abs(a - b) < 0.005 && Math.abs(b) > 1e-3 && !Number.isInteger(b) && Math.abs(a - b) / Math.abs(b) < 0.002;
function prCheck(user, ans){ if (!user.length || user.some(x => !isFinite(x))) return false; const u = [...new Set(user.map(x => +x.toFixed(9)))]; if (u.length !== ans.length) return false; return ans.every(a => u.some(x => prClose(x, a))); }
function prD(){ const d = miD('practice'); if (!PR_TOPICS.includes(d.topic)) d.topic = 'lin'; if (!['easy', 'medium', 'hard'].includes(d.lv)) d.lv = 'easy'; ['ok', 'n', 'streak', 'best'].forEach(k => { if (typeof d[k] !== 'number') d[k] = 0; }); return d; }
function prNew(){ const d = prD(); d.cur = prMake(d.topic, d.lv); d.res = null; d.shown = false; saveSet(); }
function prAnsTxt(c){ return c.ans.map(v => (c.frac && mxFrac(v)) || cs2N(v)).join(', '); }
function prRender(){
  const box = document.getElementById('pr_body'); if (!box) return; const d = prD(), E = csE; if (!d.cur) prNew(); const c = d.cur;
  let q = ''; try { q = mxHTML(mxParse(c.expr)); } catch (e) { q = E(c.expr); }
  box.innerHTML = `<div class="mi-card">${c.q ? `<p class="pr-txt">${E(c.q)}</p>` : `<p class="pr-txt">${E(t(c.eq ? (c.ans.length > 1 || d.topic === 'quad' ? 'pr_solveQ' : 'pr_solveL') : 'pr_calc'))}</p>`}
      <div class="pr-q" dir="ltr">${q}</div>
      <div class="pr-ans"><input id="pr_in" dir="ltr" autocomplete="off" inputmode="text" enterkeyhint="done" placeholder="${E(t(c.eq && d.topic === 'quad' ? 'pr_phRoots' : c.frac ? 'pr_phFrac' : 'pr_ph'))}" aria-label="${E(t(c.eq && d.topic === 'quad' ? 'pr_phRoots' : c.frac ? 'pr_phFrac' : 'pr_ph'))}" value="${E(d.last || '')}"><button type="button" class="gold-btn" id="pr_chk">${E(t('pr_check'))}</button></div>
      <div id="pr_res" aria-live="polite">${d.res ? (d.res === 'ok' ? `<p class="pr-ok">✓ ${E(t('pr_right'))}</p>` : `<p class="pr-no">✗ ${E(t('pr_wrong'))}${d.shown ? ' ' + E(t('pr_answerIs', {a: prAnsTxt(c)})) : ''}</p>`) : ''}</div>
      <div class="btnrow"><button type="button" class="mv" id="pr_sol">🪜 ${E(t('pr_show'))}</button><button type="button" class="mv" id="pr_next">➡️ ${E(t('pr_next'))}</button></div></div>
    <div id="pr_steps"></div>
    <div class="pr-score"><span>✓ ${E(t('pr_score', {ok: d.ok, n: d.n}))}</span><span>🔥 ${E(t('pr_streak', {s: d.streak}))}</span><span>🏆 ${E(t('pr_best', {b: d.best}))}</span></div>`;
}
async function prSolution(){
  const d = prD(), c = d.cur, out = document.getElementById('pr_steps'); if (!c || !out) return; const E = csE;
  if (d.res !== 'ok'){ d.shown = true; if (!d.res){ d.res = 'no'; d.n++; d.streak = 0; } saveSet(); prRender(); }
  const o2 = document.getElementById('pr_steps'); if (!o2) return;
  o2.innerHTML = `<div class="mx-card"><span class="mx-sub">⏳ ${E(t('mx_comp'))}</span></div>`;
  let r = null; try { r = await xsSolve(c.expr, mxBaseScope()); } catch (e) { r = null; }
  const o3 = document.getElementById('pr_steps'); if (!o3) return;
  if (!r || r.kind === 'fail' || !r.steps || !r.steps.length){ o3.innerHTML = `<div class="mx-card"><div class="mx-lab">${E(t('pr_answer'))}</div><div class="cs-big" dir="ltr">${E(prAnsTxt(c))}</div></div>`; return; }
  o3.innerHTML = `<div class="mx-card cs-res"><div class="mx-lab">${E(t(XS_KIND[r.kind] || 'xs_kCalc'))}</div><div class="cs-big" dir="ltr">${r.answer}</div></div>
    <details class="mx-steps xs-steps" open><summary>🪜 ${E(t('pr_way'))} (${r.steps.length})</summary><ol class="xs-ol">${r.steps.map(st => `<li><div class="xs-k">${xsKtxt(t(st.k, st.p || {}))}</div>${st.h ? `<div class="xs-m" dir="ltr">${st.h}</div>` : ''}</li>`).join('')}</ol></details>`;
}
function prDoCheck(){
  const d = prD(), i = document.getElementById('pr_in'); if (!i || !d.cur) return; const v = i.value.trim(); if (!v){ i.focus(); return; }
  d.last = v; const ok = prCheck(prParseAns(v), d.cur.ans);
  if (d.res !== 'ok'){ if (ok){ if (!d.res){ d.ok++; d.n++; d.streak++; d.best = Math.max(d.best, d.streak); } d.res = 'ok'; } else { if (!d.res){ d.n++; d.streak = 0; } d.res = 'no'; } }
  saveSet(); prRender(); const j = document.getElementById('pr_in'); if (j && d.res !== 'ok') j.focus();
}
miniDef('practice', {
  resettable: true,
  render(box){
    const d = prD(), E = csE;
    box.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${PR_TOPICS.map(k => `<button type="button" role="tab" class="ds-chip${k === d.topic ? ' on' : ''}" aria-selected="${k === d.topic}" data-prtopic="${k}">${E(t('pr_t_' + k))}</button>`).join('')}</div>
      <div class="ds-chips" role="radiogroup" aria-label="${E(t('pr_level'))}">${['easy', 'medium', 'hard'].map(k => `<button type="button" role="radio" class="ds-chip${k === d.lv ? ' on' : ''}" aria-checked="${k === d.lv}" data-prlv="${k}">${E(t('pr_l_' + k))}</button>`).join('')}</div>
      <div id="pr_body"></div><p class="fine">${E(t('pr_how'))}</p>`;
    prRender();
  }
});

/* ================= events ================= */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if ((b = t0.closest('[data-uncat]'))){ const d = miD('units'); d.cat = b.dataset.uncat; d.a = UN_DEF[d.cat][0]; d.b = UN_DEF[d.cat][1]; saveSet(); miRender('units'); return; }
  if (t0.closest('#un_swap')){ const d = unD(); [d.a, d.b] = [d.b, d.a]; saveSet(); miRender('units'); return; }
  if (t0.closest('#st2_ex')){ const d = miD('stats'); d.txt = '72, 85, 90, 66, 85, 78, 93, 85, 70, 88'; saveSet(); miRender('stats'); return; }
  if (t0.closest('#st2_clr')){ const d = miD('stats'); d.txt = ''; saveSet(); miRender('stats'); const ta = document.getElementById('st2_ta'); if (ta) ta.focus(); return; }
  if ((b = t0.closest('[data-prtopic]'))){ const d = prD(); d.topic = b.dataset.prtopic; d.last = ''; prNew(); miRender('practice'); return; }
  if ((b = t0.closest('[data-prlv]'))){ const d = prD(); d.lv = b.dataset.prlv; d.last = ''; prNew(); miRender('practice'); return; }
  if (t0.closest('#pr_chk')){ prDoCheck(); return; }
  if (t0.closest('#pr_next')){ const d = prD(); d.last = ''; prNew(); prRender(); const i = document.getElementById('pr_in'); if (i) i.focus(); return; }
  if (t0.closest('#pr_sol')){ prSolution(); return; }
});
document.addEventListener('input', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'un_v'){ unD().v = el.value; unOut(); clearTimeout(unOut.t); unOut.t = setTimeout(() => { try { saveSet(); } catch (er) {} }, 600); }
  else if (el.id === 'st2_ta'){ miD('stats').txt = el.value; clearTimeout(st2Out.t); st2Out.t = setTimeout(() => { st2Out(); try { saveSet(); } catch (er) {} }, 250); }
});
document.addEventListener('change', e => { const el = e.target; if (!el) return; if (el.id === 'un_a' || el.id === 'un_b'){ unD()[el.id === 'un_a' ? 'a' : 'b'] = el.value; saveSet(); unOut(); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'pr_in'){ e.preventDefault(); prDoCheck(); } });
try { if (Array.isArray(FREE_TABS)) FREE_TABS.push('units', 'stats', 'practice'); renderTiles(); } catch (e) {}
try { Object.assign(GS_SYN, {
  units: 'המרה המרת יחידות מטר קילומטר מייל אינץ׳ קילו פאונד ליטר גלון צלזיוס פרנהייט דונם קמ״ש בייט קלוריות unit converter convert mile inch pound gallon celsius fahrenheit تحويل وحدات ميل رطل غالون',
  stats: 'סטטיסטיקה ממוצע חציון שכיח סטיית תקן שונות רבעון statistics mean median mode standard deviation variance quartile إحصاء متوسط وسيط انحراف معياري',
  practice: 'תרגול תרגילים מבחן בגרות שיעורי בית משוואות שברים practice exercises quiz homework equations fractions تمرين تمارين معادلات كسور'}); } catch (e) {}
Object.assign(T, {
  tab_units:['המרת יחידות','تحويل الوحدات','Unit converter'], d_units:['אורך, משקל, נפח, טמפרטורה, שטח, מהירות, זמן, נתונים, אנרגיה, לחץ וצריכת דלק – עם הנוסחה והחישוב.','الطول والوزن والحجم والحرارة والمساحة والسرعة والوقت والبيانات والطاقة والضغط واستهلاك الوقود – مع المعادلة والحساب.','Length, mass, volume, temperature, area, speed, time, data, energy, pressure and fuel use – with the formula and the working.'],
  tab_stats:['סטטיסטיקה','الإحصاء','Statistics'], d_stats:['ממוצע, חציון, שכיח, רבעונים וסטיית תקן לרשימת מספרים – עם הדרך המלאה.','المتوسط والوسيط والمنوال والربيعيات والانحراف المعياري لقائمة أرقام – مع الطريقة كاملة.','Mean, median, mode, quartiles and standard deviation for a list of numbers – with the full working.'],
  tab_practice:['תרגול','تمرين','Practice'], d_practice:['תרגילים אקראיים לפי נושא ורמה – פותרים, בודקים, ורואים את הפתרון המלא שלב אחרי שלב.','تمارين عشوائية حسب الموضوع والمستوى – تحلّون وتتحققون وترون الحل الكامل خطوة بخطوة.','Random exercises by topic and level – solve, check, and see the full solution step by step.'],
  un_c_len:['אורך','الطول','Length'], un_c_mass:['משקל','الوزن','Mass'], un_c_vol:['נפח','الحجم','Volume'], un_c_temp:['טמפרטורה','الحرارة','Temperature'], un_c_area:['שטח','المساحة','Area'], un_c_speed:['מהירות','السرعة','Speed'], un_c_time:['זמן','الوقت','Time'], un_c_data:['נתונים','البيانات','Data'], un_c_energy:['אנרגיה','الطاقة','Energy'], un_c_press:['לחץ','الضغط','Pressure'], un_c_fuel:['צריכת דלק','استهلاك الوقود','Fuel use'],
  un_value:['ערך','القيمة','Value'], un_from:['מ־','من','From'], un_to:['אל','إلى','To'], un_swap:['החלפת כיוון','تبديل الاتجاه','Swap'], un_need:['הקלידו מספר.','اكتبوا رقمًا.','Type a number.'], un_bad:['אי אפשר להמיר את הערך הזה (למשל אפס בצריכת דלק).','لا يمكن تحويل هذه القيمة (مثل صفر في استهلاك الوقود).','This value can\'t be converted (e.g. zero fuel use).'],
  un_way:['הדרך','الطريقة','The working'], un_factor:['1 {a} = {f} {b}','1 {a} = {f} {b}','1 {a} = {f} {b}'], un_all:['הערך בכל היחידות','القيمة بكل الوحدات','The value in every unit'],
  un_usNote:['כוס, כפית, אונקיית נוזל, גלון ו־mpg הם לפי ההגדרה האמריקאית, אלא אם כתוב בריטי.','الكوب والملعقة والأونصة السائلة والغالون و mpg حسب التعريف الأمريكي ما لم يُذكر بريطاني.','Cup, teaspoon, fluid ounce, gallon and mpg are US measures unless marked UK.'],
  un_dataNote:['KB/MB/GB הם לפי 1000; KiB/MiB/GiB לפי 1024.','KB/MB/GB بأساس 1000؛ KiB/MiB/GiB بأساس 1024.','KB/MB/GB use 1000; KiB/MiB/GiB use 1024.'],
  st2_in:['מספרים (מופרדים בפסיק, ברווח או בשורה חדשה)','أرقام (مفصولة بفاصلة أو مسافة أو سطر جديد)','Numbers (separated by commas, spaces or new lines)'], st2_example:['דוגמה','مثال','Example'], st2_clear:['ניקוי','مسح','Clear'],
  st2_need:['הקלידו לפחות מספר אחד.','اكتبوا رقمًا واحدًا على الأقل.','Type at least one number.'], st2_many:['יותר מדי מספרים (עד 5,000).','أرقام كثيرة جدًا (حتى 5,000).','Too many numbers (up to 5,000).'], st2_nOf:['מתוך {n} מספרים','من {n} أرقام','from {n} numbers'],
  st2_count:['כמות (n)','العدد (n)','Count (n)'], st2_sum:['סכום','المجموع','Sum'], st2_mean:['ממוצע','المتوسط','Mean'], st2_median:['חציון','الوسيط','Median'], st2_mode:['שכיח','المنوال','Mode'], st2_noMode:['אין (כל ערך מופיע פעם אחת)','لا يوجد (كل قيمة مرة واحدة)','None (each value appears once)'],
  st2_min:['מינימום','الأدنى','Minimum'], st2_max:['מקסימום','الأقصى','Maximum'], st2_range:['טווח','المدى','Range'], st2_q1:['רבעון ראשון (Q1)','الربيع الأول (Q1)','First quartile (Q1)'], st2_q3:['רבעון שלישי (Q3)','الربيع الثالث (Q3)','Third quartile (Q3)'], st2_iqr:['טווח בין־רבעוני (IQR)','المدى الربيعي (IQR)','Interquartile range (IQR)'],
  st2_vp:['שונות (אוכלוסייה) σ²','التباين (مجتمع) σ²','Variance (population) σ²'], st2_sp:['סטיית תקן (אוכלוסייה) σ','الانحراف المعياري (مجتمع) σ','Standard deviation (population) σ'], st2_vs:['שונות (מדגם) s²','التباين (عينة) s²','Variance (sample) s²'], st2_ssd:['סטיית תקן (מדגם) s','الانحراف المعياري (عينة) s','Standard deviation (sample) s'], st2_cv:['מקדם השתנות','معامل الاختلاف','Coefficient of variation'],
  st2_qNote:['הרבעונים מחושבים בשיטת "חציון של כל חצי" (בלי החציון כשמספר הערכים אי־זוגי). מחשבונים אחרים עשויים להשתמש בשיטה מעט שונה.','الربيعيات محسوبة بطريقة "وسيط كل نصف" (دون الوسيط عند عدد فردي). قد تستخدم حاسبات أخرى طريقة مختلفة قليلًا.','Quartiles use the "median of each half" method (excluding the median when the count is odd). Other calculators may use a slightly different method.'],
  st2_plot:['תרשים קופסה ונקודות','مخطط الصندوق والنقاط','Box and dot plot'], st2_plotKey:['קו זהב: חציון · קו מקווקו: ממוצע · קופסה: Q1 עד Q3','الخط الذهبي: الوسيط · المتقطع: المتوسط · الصندوق: من Q1 إلى Q3','Gold line: median · dashed: mean · box: Q1 to Q3'],
  st2_way:['הדרך המלאה','الطريقة الكاملة','The full working'], st2_wMean:['ממוצע: מחברים את כל המספרים ומחלקים בכמות','المتوسط: نجمع كل الأرقام ونقسم على عددها','Mean: add all the numbers and divide by how many there are'], st2_wSort:['מסדרים את המספרים מהקטן לגדול','نرتّب الأرقام من الأصغر إلى الأكبر','Sort the numbers from smallest to largest'],
  st2_wMed:['חציון:','الوسيط:','Median:'], st2_midOdd:['כמות אי־זוגית – האיבר האמצעי הוא במקום {p}','عدد فردي – العنصر الأوسط في الموضع {p}','odd count – the middle value is at position {p}'], st2_midEven:['כמות זוגית – ממוצע האיברים במקומות {p} ו־{q}','عدد زوجي – متوسط العنصرين في الموضعين {p} و{q}','even count – the average of positions {p} and {q}'], st2_medIs:['החציון =','الوسيط =','Median ='],
  st2_wDev:['סטיות מהממוצע: מכל מספר מחסירים את הממוצע ומעלים בריבוע','الانحرافات عن المتوسط: نطرح المتوسط من كل رقم ونربّع','Deviations from the mean: subtract the mean from each number and square it'], st2_devsBig:['(טבלת הסטיות מוצגת עד 20 מספרים)','(جدول الانحرافات يظهر حتى 20 رقمًا)','(the deviations table is shown for up to 20 numbers)'],
  st2_wVar:['שונות וסטיית תקן: באוכלוסייה מחלקים ב־n, במדגם ב־n − 1, ואז שורש','التباين والانحراف المعياري: للمجتمع نقسم على n وللعينة على n − 1 ثم الجذر','Variance and standard deviation: divide by n for a population, by n − 1 for a sample, then take the root'],
  pr_t_ops:['סדר פעולות','ترتيب العمليات','Order of operations'], pr_t_frac:['שברים','الكسور','Fractions'], pr_t_pct:['אחוזים','النسب المئوية','Percent'], pr_t_lin:['משוואות ממעלה ראשונה','معادلات من الدرجة الأولى','Linear equations'], pr_t_quad:['משוואות ריבועיות','معادلات تربيعية','Quadratic equations'], pr_t_pow:['חזקות ושורשים','القوى والجذور','Powers and roots'],
  pr_level:['רמה','المستوى','Level'], pr_l_easy:['קל','سهل','Easy'], pr_l_medium:['בינוני','متوسط','Medium'], pr_l_hard:['קשה','صعب','Hard'],
  pr_calc:['חשבו:','احسبوا:','Calculate:'], pr_solveL:['פתרו את המשוואה (מה x?):','حلّوا المعادلة (ما قيمة x؟):','Solve the equation (what is x?):'], pr_solveQ:['פתרו את המשוואה (מצאו את כל הפתרונות):','حلّوا المعادلة (جدوا كل الحلول):','Solve the equation (find all solutions):'],
  pr_pctOf:['כמה זה {p}% מתוך {y}?','كم يساوي {p}% من {y}؟','What is {p}% of {y}?'], pr_pctOff:['מוצר עולה {y} ₪ ויש עליו הנחה של {p}%. כמה משלמים?','منتج سعره {y} ₪ وعليه خصم {p}%. كم ندفع؟','An item costs ₪{y} with a {p}% discount. How much do you pay?'], pr_pctWhat:['{a} הם כמה אחוזים מתוך {b}?','{a} تساوي كم بالمئة من {b}؟','{a} is what percent of {b}?'],
  pr_ph:['התשובה שלכם','إجابتكم','Your answer'], pr_phFrac:['למשל 7/12 או 0.58','مثلًا 7/12 أو 0.58','e.g. 7/12 or 0.58'], pr_phRoots:['למשל 2, 3','مثلًا 2, 3','e.g. 2, 3'],
  pr_check:['בדיקה','تحقق','Check'], pr_right:['נכון! כל הכבוד','صحيح! أحسنتم','Correct! Well done'], pr_wrong:['לא בדיוק – נסו שוב או הציגו את הפתרון.','ليس تمامًا – حاولوا مجددًا أو اعرضوا الحل.','Not quite – try again or show the solution.'], pr_answerIs:['התשובה: {a}','الإجابة: {a}','The answer: {a}'],
  pr_show:['הצגת הפתרון','عرض الحل','Show the solution'], pr_next:['תרגיל הבא','التمرين التالي','Next exercise'], pr_answer:['התשובה','الإجابة','The answer'], pr_way:['הפתרון שלב אחרי שלב','الحل خطوة بخطوة','The solution step by step'],
  pr_score:['{ok} נכונות מתוך {n}','{ok} صحيحة من {n}','{ok} right out of {n}'], pr_streak:['רצף: {s}','سلسلة: {s}','Streak: {s}'], pr_best:['שיא: {b}','الأفضل: {b}','Best: {b}'],
  pr_how:['אפשר לענות בשבר (3/4), במספר עשרוני, או בכמה פתרונות מופרדים בפסיק.','يمكن الإجابة بكسر (3/4) أو برقم عشري أو بعدة حلول مفصولة بفاصلة.','You can answer with a fraction (3/4), a decimal, or several solutions separated by commas.'],
});
