/* --- inflation (Israeli CPI) --- */
/* Annual change in Israel's consumer price index, % (source: inflationtool.com, from CBS CPI data).
   2026: change since the start of the year up to August 2026 (CBS release of 15.9.2026). */
const INFL_IL = {1990:17.6,1991:18.0,1992:9.4,1993:11.2,1994:14.5,1995:8.1,1996:10.6,1997:7.0,1998:8.6,1999:1.3,
  2000:0,2001:1.4,2002:6.5,2003:-1.9,2004:1.2,2005:2.4,2006:-0.1,2007:3.4,2008:3.8,2009:3.9,2010:2.7,2011:2.2,2012:1.6,
  2013:1.8,2014:-0.2,2015:-1.0,2016:-0.2,2017:0.4,2018:0.8,2019:0.6,2020:-0.7,2021:2.8,2022:5.3,2023:3.0,2024:3.2,2025:2.6,2026:2.1};
function inflYtd(){ const x = typeof MKT === 'object' ? +MKT.cpiYtd : NaN; if (isFinite(x)) INFL_IL[INFL_Y1] = x; return INFL_IL[INFL_Y1]; }
const INFL_Y0 = 1989, INFL_Y1 = 2026;
function calcInflation(){
  const mode = $('#in_mode').value, amt = Math.max(0, v('in_amt'));
  const warn = [];
  if (mode === 'past'){
    inflYtd();
    let y0 = Math.round(v('in_from')), y1 = Math.round(v('in_to'));
    if (!(y0 >= INFL_Y0 && y0 <= INFL_Y1) || !(y1 >= INFL_Y0 && y1 <= INFL_Y1)) warn.push(t('w_inRange', {a: INFL_Y0, b: INFL_Y1}));
    y0 = clamp(y0 || 2010, INFL_Y0, INFL_Y1); y1 = clamp(y1 || INFL_Y1, INFL_Y0, INFL_Y1);
    const back = y1 < y0, lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    let f = 1; const Y = [{y: lo, f: 1, r: null}];
    for (let y = lo + 1; y <= hi; y++){ f *= 1 + INFL_IL[y] / 100; Y.push({y, f, r: INFL_IL[y]}); }
    const fac = back ? 1 / f : f, out = amt * fac, n = hi - lo;
    const avg = n > 0 ? (Math.pow(f, 1 / n) - 1) * 100 : 0;
    return {
      hero: {label: t('r_inEq', {a: M(amt), y0, y1}), value: M(out, 2), sub: t('r_inCum') + ': ' + PC((f - 1) * 100) + ' (' + lo + '–' + hi + ')'},
      rows: [
        [t('r_inEq', {a: M(amt), y0, y1}), M(out, 2), 'key'],
        [t('r_inCum'), PC((f - 1) * 100)],
        [t('r_inAvg'), PC(avg)],
        [t('r_inPower', {a: M(amt), y: hi, y0: lo}), M(amt / f, 2)],
        [t('r_inLost'), PC((1 - 1 / f) * 100)]
      ],
      warn: warn.length ? warn : null, note: t('n_inPast') + (hi === 2026 ? ' ' + t('w_in2026', {m: monthName(MKT.cpiYtdTo), v: PC(MKT.cpiYtd)}) : ''),
      chart: {title: t('c_inPrice', {a: M(amt), y: lo}), unit: t('w_year'), fmt: x => M(x),
        layers: [{name: t('l_inBase'), cls:'c-ink', values: Y.map(() => amt)}, {name: t('l_inAdd'), cls:'c-accent', values: Y.map(r => Math.max(0, amt * r.f - amt))}],
        labels: Y.map(r => r.y)},
      table: {title: t('t_inYears'), head: [t('w_year'), t('h_inYr'), t('h_inValue', {a: M(amt), y: lo})],
        rows: Y.map(r => [r.y + (r.y === 2026 ? '*' : ''), r.r == null ? '—' : PC(r.r), M(amt * r.f, 2)])}
    };
  }
  const n = clamp(Math.round(v('in_years')), 1, 60), i = v('in_rate') / 100;
  if (mode === 'future'){
    const Y = []; for (let y = 0; y <= n; y++) Y.push({y, p: amt * Math.pow(1 + i, y)});
    const fut = amt * Math.pow(1 + i, n), real = amt / Math.pow(1 + i, n);
    return {
      hero: {label: t('r_inFut', {a: M(amt), n}), value: M(fut, 2), sub: t('r_inReal', {n}) + ': ' + M(real, 2)},
      rows: [[t('r_inFut', {a: M(amt), n}), M(fut, 2), 'key'], [t('r_inReal', {n}), M(real, 2)], [t('r_inLost'), PC((1 - real / Math.max(amt, 1e-9)) * 100)],
             [t('r_inCum'), PC((Math.pow(1 + i, n) - 1) * 100)]],
      note: t('n_inFuture'),
      chart: {title: t('c_inFuture'), unit: t('w_year'), fmt: x => M(x),
        layers: [{name: t('l_inBase'), cls:'c-ink', values: Y.map(() => amt)}, {name: t('l_inAdd'), cls:'c-accent', values: Y.map(r => Math.max(0, r.p - amt))}],
        labels: Y.map(r => r.y)},
      table: {title: t('t_yearly'), head: [t('w_year'), t('h_inCost'), t('h_inReal')], rows: Y.map(r => [r.y, M(r.p, 2), M(amt * amt / r.p || 0, 2)])}
    };
  }
  const r = v('in_nom') / 100, rr = (1 + r) / (1 + i) - 1;
  const Y = []; for (let y = 0; y <= n; y++){ const nom = amt * Math.pow(1 + r, y); Y.push({y, nom, real: nom / Math.pow(1 + i, y)}); }
  const last = Y[Y.length - 1];
  return {
    hero: {label: t('r_inRR'), value: PC(rr * 100), sub: t('r_inRealEnd', {n}) + ': ' + M(last.real)},
    rows: [[t('r_inRR'), PC(rr * 100), 'key'], [t('r_inNomEnd', {n}), M(last.nom)], [t('r_inRealEnd', {n}), M(last.real), 'key'],
           [t('r_inRealGain'), M(last.real - amt)], [t('r_inEaten'), M(last.nom - last.real)]],
    warn: rr < 0 ? [t('w_inNeg')] : null, warnOk: rr >= 0 ? t('ok_inPos') : null, note: t('n_inReal'),
    chart: {title: t('c_inReal'), unit: t('w_year'), fmt: x => M(x),
      layers: [{name: t('l_inRealV'), cls:'c-ink', values: Y.map(y => y.real)}, {name: t('l_inEaten'), cls:'c-accent', values: Y.map(y => Math.max(0, y.nom - y.real))}],
      labels: Y.map(y => y.y)},
    table: {title: t('t_yearly'), head: [t('w_year'), t('h_inNom'), t('h_inReal')], rows: Y.map(y => [y.y, M(y.nom), M(y.real)])}
  };
}
Object.assign(CALC, {inflation: calcInflation});
