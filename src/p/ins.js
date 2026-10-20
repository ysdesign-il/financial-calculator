/* ---------- 13.22: insights – what changed for you, trends, subscriptions, your cost of living, a monthly report, challenges ----------
   Everything is worked out on the phone from your own expenses, accounts and the official figures. */
const inE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const IN_TABS = [['chg', '🔔'], ['trend', '📈'], ['subs', '🔁'], ['infl', '🛒'], ['bench', '👥'], ['report', '🧾'], ['chal', '🏅']];
var INT = 'chg';
function inD(){ const d = SET.ins && typeof SET.ins === 'object' ? SET.ins : (SET.ins = {}); if (!Array.isArray(d.ev)) d.ev = []; if (!d.keep || typeof d.keep !== 'object') d.keep = {}; if (!Array.isArray(d.ch)) d.ch = []; return d; }
const inM0 = x => M(Math.round(isFinite(x) ? x : 0), 0, 'ILS');
const inYm = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth() + (n || 0), 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); };
const inTip = (ic, h, p, k, go) => `<li class="bk-a${k ? ' bk-' + k : ''}"><span class="bk-ic" aria-hidden="true">${ic}</span><div><b>${inE(h)}</b>${p ? `<p>${inE(p)}</p>` : ''}${go ? `<p><button type="button" class="lg-a" data-go="${go}">${inE(t('in_open', {n: t('tab_' + go)}))}</button></p>` : ''}</div></li>`;

/* ---- 1) what changed: the official figures are remembered, and a change is turned into what it means for you ---- */
const inPmt = (P, r, n) => r ? P * r / 1200 / (1 - Math.pow(1 + r / 1200, -n)) : P / n;
function inNow(){ return {boi: +MKT.boi, cpi: +MKT.cpi, fuel: typeof IL26 === 'object' ? +IL26.fuel95 : NaN, usd: typeof RATES === 'object' ? +RATES.ILS : NaN}; }
function inSnap(){
  const d = inD(), n = inNow(), o = d.snap; if (!isFinite(n.boi) || !isFinite(n.cpi)) return;
  if (o){ const day = new Date().toISOString().slice(0, 10), add = (k, a, b) => d.ev.unshift({k, a, b, day});
    if (isFinite(o.boi) && Math.abs(n.boi - o.boi) >= 0.05) add('boi', o.boi, n.boi);
    if (isFinite(o.cpi) && Math.abs(n.cpi - o.cpi) >= 0.05) add('cpi', o.cpi, n.cpi);
    if (isFinite(o.fuel) && isFinite(n.fuel) && Math.abs(n.fuel - o.fuel) >= 0.05) add('fuel', o.fuel, n.fuel);
    if (isFinite(o.usd) && isFinite(n.usd) && Math.abs(n.usd / o.usd - 1) >= 0.03) add('usd', o.usd, n.usd);
    d.ev = d.ev.slice(0, 30); }
  d.snap = n; saveSet();
}
function inImpact(e){
  const L = [];
  if (e.k === 'boi'){ const dr = e.b - e.a, m = inPmt(100000, 5.5 + dr, 240) - inPmt(100000, 5.5, 240); L.push(t('in_iBoi', {m: inM0(Math.abs(m)), s: dr > 0 ? '+' : '−'}));
    try { const neg = bkD().accs.reduce((s, a) => s + Math.max(0, -bkN(a.bal)), 0); if (neg > 0) L.push(t('in_iOd', {m: inM0(neg * Math.abs(dr) / 100), s: dr > 0 ? '+' : '−'})); } catch (er) {} }
  if (e.k === 'cpi') L.push(t('in_iCpi', {m: inM0(100000 * Math.abs(e.b - e.a) / 100), s: e.b > e.a ? '+' : '−'}));
  if (e.k === 'fuel'){ try { const S = fuLogStats(), km = S && isFinite(S.kmMonth) ? S.kmMonth : 1250, l = km / fuCons(); L.push(t('in_iFuel', {m: inM0(Math.abs(e.b - e.a) * l), s: e.b > e.a ? '+' : '−'})); } catch (er) {} }
  if (e.k === 'usd') L.push(t('in_iUsd', {p: N(Math.abs(e.b / e.a - 1) * 100, 1), s: e.b > e.a ? t('in_up') : t('in_down')}));
  return L.join(' ');
}
function inPersonal(){
  const out = [];
  try { const ym = inYm(new Date()), now = expTotals(ym), prev = expTotals(inYm(new Date(), -1)), day = new Date().getDate(), dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const fc = now.sum / Math.max(1, day) * dim; if (now.sum > 0 && prev.sum > 0 && day >= 7){ const pc = (fc / prev.sum - 1) * 100; if (Math.abs(pc) >= 10) out.push({ic: pc > 0 ? '📈' : '📉', h: t(pc > 0 ? 'in_pUp' : 'in_pDown', {p: Math.round(Math.abs(pc))}), p: t('in_pFc', {m: inM0(fc)}), go: 'expenses', k: pc > 0 ? 'warn' : 'ok'}); }
    const bud = expData().budgets || {}; Object.keys(bud).forEach(k => { const b = +bud[k]; if (b > 0 && (now.by[k] || 0) > b) out.push({ic: '📊', h: t('pic_tBud', {n: t('ec_' + k)}), p: t('in_pBud', {a: inM0(now.by[k]), b: inM0(b)}), go: 'expenses', k: 'warn'}); });
  } catch (er) {}
  try { const due = rmD().items.filter(rmDue); if (due.length) out.push({ic: '⏰', h: t('pic_tRem', {n: due.length, t: due[0].title}), go: 'reminders', k: 'warn'}); } catch (er) {}
  return out;
}
function inChg(v){
  const d = inD(), E = inE, ev = d.ev.slice(0, 12), P = inPersonal(), n = inNow();
  v.innerHTML = `<p class="fine">${E(t('in_chgIntro'))}</p>
    <ol class="bk-adv">${P.map(x => inTip(x.ic, x.h, x.p, x.k, x.go)).join('')}${ev.map(e => inTip({boi: '🏦', cpi: '📊', fuel: '⛽', usd: '💵'}[e.k], t('in_e_' + e.k, {a: N(e.a, 2), b: N(e.b, 2)}) + ' · ' + fmtDay(e.day), inImpact(e), e.b > e.a && e.k !== 'usd' ? 'warn' : 'ok')).join('') || ''}</ol>
    ${!P.length && !ev.length ? `<p class="fine bk-empty">${E(t('in_chgNone'))}</p>` : ''}
    <h3 class="ds-q">${E(t('in_nowH'))}</h3><table class="bk-plan"><tbody>
      <tr><th scope="row">${E(t('in_n_boi'))}</th><td dir="ltr">${N(n.boi, 2)}% <small class="in-src">${E(t('in_src', {s: t('in_s_boi'), d: MKT.boiDate || ''}))}</small></td></tr>
      <tr><th scope="row">${E(t('in_n_cpi'))}</th><td dir="ltr">${N(n.cpi, 1)}% <small class="in-src">${E(t('in_src', {s: t('in_s_cbs'), d: MKT.cpiMonth || ''}))}</small></td></tr>
      ${isFinite(n.fuel) ? `<tr><th scope="row">${E(t('in_n_fuel'))}</th><td dir="ltr">${M(n.fuel, 2, 'ILS')} <small class="in-src">${E(t('in_src', {s: t('in_s_energy'), d: MKT.fuelMonth || ''}))}</small></td></tr>` : ''}
      ${isFinite(n.usd) ? `<tr><th scope="row">${E(t('in_n_usd'))}</th><td dir="ltr">${N(n.usd, 3)} ₪</td></tr>` : ''}</tbody></table>`;
  d.seen = d.ev.length ? d.ev[0].day + d.ev[0].k : ''; saveSet();
}
const fmtDay = s => { try { const [y, m, dd] = String(s).split('-').map(Number); return new Intl.DateTimeFormat(locOf(), {day: 'numeric', month: 'short'}).format(new Date(y, m - 1, dd)); } catch (e) { return s; } };

/* ---- 2) trends, unusual charges and the month-end forecast ---- */
function inTrend(v){
  const E = inE, now = new Date(), ym = inYm(now), cur = expTotals(ym), pm = [1, 2, 3].map(i => expTotals(inYm(now, -i))), have = pm.filter(x => x.sum > 0);
  const day = now.getDate(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), fc = cur.sum / Math.max(1, day) * dim;
  if (!cur.sum && !have.length){ v.innerHTML = `<p class="fine bk-empty">${E(t('in_noExp'))}</p><div class="btnrow"><button type="button" class="btn" data-go="expenses">🧾 ${E(t('tab_expenses'))}</button></div>`; return; }
  const avg = k => have.length ? have.reduce((s, x) => s + (x.by[k] || 0), 0) / have.length : 0, avgAll = have.length ? have.reduce((s, x) => s + x.sum, 0) / have.length : 0;
  const rows = EXP_CATS.map(c => c[0]).filter(k => cur.by[k] || avg(k)).map(k => ({k, now: cur.by[k] || 0, fc: (cur.by[k] || 0) / Math.max(1, day) * dim, avg: avg(k)})).sort((a, b) => b.now - a.now);
  /* unusual: an expense more than 2.5× the usual one in its category */
  const items = expData().items.filter(it => !it.rec && it.date && it.date.slice(0, 7) >= inYm(now, -3)), un = [];
  EXP_CATS.forEach(([k]) => { const L = items.filter(it => it.cat === k).map(it => +it.amt).sort((a, b) => a - b); if (L.length < 4) return; const med = L[Math.floor(L.length / 2)];
    items.filter(it => it.cat === k && it.date.slice(0, 7) === ym && +it.amt > med * 2.5 && +it.amt > 150).forEach(it => un.push({it, med})); });
  /* new: a store you never paid before, appearing this month */
  const seen = new Set(expData().items.filter(it => it.date && it.date.slice(0, 7) < ym).map(it => x2Key(it.note)).filter(Boolean)), fresh = expData().items.filter(it => it.date && it.date.slice(0, 7) === ym && it.note && !seen.has(x2Key(it.note)));
  v.innerHTML = `<div class="bk-hero"><span>${E(t('in_fcH'))}</span><b dir="ltr">${E(inM0(fc))}</b><small>${E(t('in_fcSub', {s: inM0(cur.sum), d: day, a: avgAll ? inM0(avgAll) : '—'}))}</small></div>
    <div class="bk-scroll"><table class="bk-plan"><thead><tr><th scope="col">${E(t('exp_cat'))}</th><th scope="col">${E(t('in_tNow'))}</th><th scope="col">${E(t('in_tFc'))}</th><th scope="col">${E(t('in_tAvg'))}</th></tr></thead><tbody>${rows.map(r => { const pc = r.avg ? (r.fc / r.avg - 1) * 100 : 0;
      return `<tr><th scope="row">${E((EXP_CATS.find(c => c[0] === r.k) || [, ''])[1] + ' ' + t('ec_' + r.k))}</th><td dir="ltr">${E(inM0(r.now))}</td><td dir="ltr">${E(inM0(r.fc))}${r.avg && Math.abs(pc) >= 15 ? ` <small class="${pc > 0 ? 'in-up' : 'in-dn'}">${pc > 0 ? '▲' : '▼'}${Math.round(Math.abs(pc))}%</small>` : ''}</td><td dir="ltr">${E(r.avg ? inM0(r.avg) : '—')}</td></tr>`; }).join('')}</tbody></table></div>
    ${un.length || fresh.length ? `<h3 class="ds-q">${E(t('in_unH'))}</h3><ol class="bk-adv">${un.slice(0, 5).map(({it, med}) => inTip('⚠️', t('in_un', {n: it.note || t('ec_' + it.cat), m: inM0(it.amt)}), t('in_unP', {u: inM0(med)}), 'warn')).join('')}${fresh.slice(0, 5).map(it => inTip('🆕', t('in_new', {n: it.note, m: inM0(it.amt)}), '')).join('')}</ol>` : ''}`;
}

/* ---- 3) subscriptions: the same store, a similar amount, month after month ---- */
function inSubsList(){
  const items = expData().items.filter(it => it.note || it.rec), G = {};
  items.forEach(it => { const k = it.rec ? 'rec:' + it.id : x2Key(it.note); if (!k) return; (G[k] = G[k] || []).push(it); });
  const out = [];
  Object.entries(G).forEach(([k, L]) => {
    if (k.startsWith('rec:')){ const it = L[0]; out.push({k, name: it.note || t('ec_' + it.cat), amt: +it.amt, last: it.date, n: 0, rec: true, cat: it.cat}); return; }
    if (['food', 'car', 'clothes', 'health', 'gifts'].includes(L[0].cat)) return;                 // shopping, not a subscription
    const byM = {}, cnt = {}; L.forEach(it => { const m = String(it.date).slice(0, 7); byM[m] = byM[m] || it; cnt[m] = (cnt[m] || 0) + 1; });
    if (Object.values(cnt).some(c => c > 1)) return;                                                    // a subscription is charged once a month
    const ms = Object.keys(byM).sort(), amts = ms.map(m => +byM[m].amt); if (ms.length < 2) return;
    const span = (+ms[ms.length - 1].slice(0, 4) - +ms[0].slice(0, 4)) * 12 + (+ms[ms.length - 1].slice(5) - +ms[0].slice(5)) + 1; if (ms.length < span * 0.8) return;   // month after month, not now and then
    const avg = amts.reduce((s, x) => s + x, 0) / amts.length; if (!amts.every(a => Math.abs(a - avg) <= Math.max(5, avg * 0.1)) || avg > 2500) return;
    const last = byM[ms[ms.length - 1]]; out.push({k, name: last.note, amt: avg, last: last.date, n: ms.length, cat: last.cat});
  });
  return out.sort((a, b) => b.amt - a.amt);
}
function inSubs(v){
  const E = inE, d = inD(), L = inSubsList(), act = L.filter(s => d.keep[s.k] !== 'gone'), tot = act.reduce((s, x) => s + x.amt, 0);
  if (!L.length){ v.innerHTML = `<p class="fine">${E(t('in_subsIntro'))}</p><p class="fine bk-empty">${E(t('in_subsNone'))}</p><div class="btnrow"><button type="button" class="btn" id="x2_open">⬇️ ${E(t('x2_btn'))}</button></div>`; return; }
  v.innerHTML = `<p class="fine">${E(t('in_subsIntro'))}</p><div class="bk-hero"><span>${E(t('in_subsTot', {n: act.length}))}</span><b dir="ltr">${E(inM0(tot * 12))} / ${E(t('es_yr'))}</b><small>${E(t('in_subsMo', {m: inM0(tot)}))}</small></div>
    <ul class="rm-list">${L.map(s => { const st = d.keep[s.k] || ''; return `<li class="rm-it${st === 'gone' ? ' done' : ''}"><div class="rm-ic" aria-hidden="true">${(EXP_CATS.find(c => c[0] === s.cat) || [, '🔁'])[1]}</div><div class="rm-b"><b dir="auto">${E(s.name)}</b>
      <span class="rm-w" dir="auto">${E(inM0(s.amt))} / ${E(t('bk_mo'))} · ${E(inM0(s.amt * 12))} / ${E(t('es_yr'))}${s.n ? ' · ' + E(t('in_subsN', {n: s.n})) : ''} · ${E(t('in_subsLast', {d: dLabel(s.last)}))}</span>
      <div class="rm-acts"><button type="button" class="mv" data-insk="${E(s.k)}" data-inst="keep"${st === 'keep' ? ' aria-pressed="true"' : ''}>👍 ${E(t('in_keep'))}</button><button type="button" class="mv" data-insk="${E(s.k)}" data-inst="gone">✂️ ${E(t('in_gone'))}</button><button type="button" class="mv" data-insrem="${E(s.name)}">⏰ ${E(t('in_remCancel'))}</button></div></div></li>`; }).join('')}</ul>`;
}

/* ---- 4) your cost of living: your spending now against a year ago (or the months before), next to the index ---- */
function inInfl(v){
  const E = inE, now = new Date(), win = o => [1, 2, 3].map(i => expTotals(inYm(now, -i - o))), a = win(0), b = win(12), c = win(3), s = L => L.reduce((x, y) => x + y.sum, 0), full = L => L.every(m => m.sum > 0);
  const useY = full(b), base = useY ? b : c, sa = full(a) ? s(a) : 0, sb = full(base) ? s(base) : 0;
  if (!sa || !sb){ v.innerHTML = `<p class="fine">${E(t('in_inflIntro'))}</p><p class="fine bk-empty">${E(t('in_inflNone'))}</p>`; return; }
  const pc = (sa / sb - 1) * 100, rows = EXP_CATS.map(([k]) => { const x = a.reduce((q, m) => q + (m.by[k] || 0), 0), y = base.reduce((q, m) => q + (m.by[k] || 0), 0); return {k, x, y}; }).filter(r => r.x || r.y).sort((p, q) => (q.x - q.y) - (p.x - p.y));
  v.innerHTML = `<p class="fine">${E(t('in_inflIntro'))}</p><div class="bk-hero"><span>${E(t(useY ? 'in_inflY' : 'in_inflQ'))}</span><b dir="ltr">${pc >= 0 ? '+' : '−'}${N(Math.abs(pc), 1)}%</b><small>${E(t('in_inflCpi', {c: N(+MKT.cpi, 1)}))}</small></div>
    <table class="bk-plan"><thead><tr><th scope="col">${E(t('exp_cat'))}</th><th scope="col">${E(t('in_before'))}</th><th scope="col">${E(t('in_now3'))}</th></tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${E(t('ec_' + r.k))}</th><td dir="ltr">${E(inM0(r.y / 3))}</td><td dir="ltr">${E(inM0(r.x / 3))}${r.y ? ` <small class="${r.x > r.y ? 'in-up' : 'in-dn'}">${r.x >= r.y ? '+' : '−'}${Math.round(Math.abs(r.x / r.y - 1) * 100)}%</small>` : ''}</td></tr>`).join('')}</tbody></table>
    <p class="fine">${E(t('in_inflNote'))}</p>`;
}

/* ---- 5) against the average Israeli household (CBS household expenditure survey, 2023) ---- */
const IN_AVG = {tot: 18088, home: 0.253, move: 0.186, food: 0.179};
function inBench(v){
  const E = inE, now = new Date(), L = [1, 2, 3].map(i => expTotals(inYm(now, -i))).filter(x => x.sum > 0), cur = expTotals(inYm(now));
  const use = L.length ? L : (cur.sum ? [cur] : []); if (!use.length){ v.innerHTML = `<p class="fine bk-empty">${E(t('in_noExp'))}</p>`; return; }
  const avg = k => use.reduce((s, x) => s + (k ? (Array.isArray(k) ? k.reduce((q, kk) => q + (x.by[kk] || 0), 0) : (x.by[k] || 0)) : x.sum), 0) / use.length;
  const R = [['in_bTot', avg(), IN_AVG.tot], ['in_bHome', avg('home'), IN_AVG.tot * IN_AVG.home], ['in_bMove', avg(['car', 'comm']), IN_AVG.tot * IN_AVG.move], ['in_bFood', avg('food'), IN_AVG.tot * IN_AVG.food]];
  v.innerHTML = `<p class="fine">${E(t('in_benchIntro'))}</p><ul class="in-bars">${R.map(([k, me, av]) => { const mx = Math.max(me, av, 1); return `<li><b>${E(t(k))}</b><div class="in-bar"><span>${E(t('in_me'))}</span><i style="width:${(me / mx * 100).toFixed(1)}%"></i><em dir="ltr">${E(inM0(me))}</em></div><div class="in-bar avg"><span>${E(t('in_avg'))}</span><i style="width:${(av / mx * 100).toFixed(1)}%"></i><em dir="ltr">${E(inM0(av))}</em></div></li>`; }).join('')}</ul>
    <p class="fine">${E(t('in_benchNote'))}</p>`;
}

/* ---- 6) the monthly report: one page, drawn on the phone, saved as PDF ---- */
function inReportData(ym){
  const T0 = expTotals(ym), inc = expIncome(ym), prev = expTotals(inYm(new Date(+ym.slice(0, 4), +ym.slice(5) - 1, 1), -1));
  const cats = EXP_CATS.map(c => ({k: c[0], ic: c[1], col: c[2], v: T0.by[c[0]] || 0})).filter(c => c.v > 0).sort((a, b) => b.v - a.v);
  let score = null; try { score = picData().score; } catch (e) {}
  return {ym, sum: T0.sum, inc: inc ? +inc.v : 0, prev: prev.sum, cats, score, subs: (() => { try { return inSubsList().reduce((s, x) => s + x.amt, 0); } catch (e) { return 0; } })()};
}
function inReport(v){
  const E = inE, d = inD(), ym = d.rym || inYm(new Date(), -1), R = inReportData(ym), opts = [0, -1, -2, -3, -4, -5].map(i => inYm(new Date(), i));
  v.innerHTML = `<p class="fine">${E(t('in_repIntro'))}</p><label class="bk-f"><span>${E(t('in_repM'))}</span><select id="in_rym">${opts.map(m => `<option value="${m}"${m === ym ? ' selected' : ''}>${E(ymLabel(m))}</option>`).join('')}</select></label>
    <div class="bk-hero"><span>${E(ymLabel(ym))}</span><b dir="ltr">${E(inM0(R.sum))}</b><small>${E(R.inc ? t('in_repSub', {i: inM0(R.inc), s: inM0(R.inc - R.sum)}) : t('in_repNoInc'))}</small></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="in_pdf"${R.sum ? '' : ' disabled'}>📄 ${E(t('in_repPdf'))}</button></div>`;
}
async function inReportPdf(){
  const d = inD(), ym = d.rym || inYm(new Date(), -1), R = inReportData(ym), W = 1240, H = 1754, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), rtl = document.documentElement.dir === 'rtl', F = (w, s) => w + ' ' + s + 'px -apple-system,"Segoe UI","Noto Sans Hebrew","Noto Sans Arabic",Arial,sans-serif', X = v => rtl ? W - v : v;
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = 'start'; x.fillStyle = '#0B1F3A'; x.fillRect(0, 0, W, 170);
  x.fillStyle = '#F2C45A'; x.font = F('700', 54); x.fillText(t('in_repTitle'), X(80), 95); x.fillStyle = '#fff'; x.font = F('400', 34); x.fillText(ymLabel(ym), X(80), 145);
  let y = 260; const line = (l, v, big) => { x.fillStyle = '#4E5B6E'; x.font = F('400', big ? 34 : 30); x.textAlign = 'start'; x.fillText(l, X(80), y); x.fillStyle = '#0B1F3A'; x.font = F('700', big ? 44 : 32); x.textAlign = 'end'; x.fillText(v, X(W - 80), y); x.textAlign = 'start'; y += big ? 70 : 54; };
  line(t('in_repSpent'), inM0(R.sum), true); if (R.inc){ line(t('exp_income'), inM0(R.inc)); line(t('in_repSaved'), inM0(R.inc - R.sum) + '  (' + Math.round((R.inc - R.sum) / R.inc * 100) + '%)'); }
  if (R.prev) line(t('in_repVs'), '\u200e' + (R.sum >= R.prev ? '+' : '−') + inM0(Math.abs(R.sum - R.prev)));
  if (R.subs) line(t('in_repSubs'), inM0(R.subs)); if (R.score != null) line(t('pic_h'), R.score + ' / 100');
  y += 30; x.fillStyle = '#0B1F3A'; x.font = F('700', 38); x.fillText(t('exp_breakdown'), X(80), y); y += 50;
  const mx = Math.max(1, ...R.cats.map(c2 => c2.v));
  R.cats.slice(0, 12).forEach(cc => { x.fillStyle = '#0B1F3A'; x.font = F('400', 30); x.fillText(t('ec_' + cc.k), X(80), y + 30); x.textAlign = 'end'; x.font = F('700', 30); x.fillText(inM0(cc.v) + '  ' + Math.round(cc.v / R.sum * 100) + '%', X(W - 80), y + 30); x.textAlign = 'start';
    const bw = (W - 160) * cc.v / mx; x.fillStyle = cc.col; x.fillRect(rtl ? W - 80 - bw : 80, y + 44, bw, 14); y += 80; });
  x.fillStyle = '#8A94A6'; x.font = F('400', 24); x.fillText(t('in_repFoot'), X(80), H - 70);
  try { const blob = await dsPdf([{items: [{c, x: 0, y: 0, w: 595.28, h: 841.89}]}], 0.9), r = await fileSave(blob, (t('in_repTitle') + ' ' + ym).replace(/[\\/:*?"<>|]+/g, ' ') + '.pdf', 'application/pdf'); toast(t(r === 'saved' ? 'ds_fileOk' : r === 'declined' ? 'pdf_declined' : 'pdf_fail')); } catch (e) { toast(t('pdf_fail')); }
}

/* ---- 7) challenges and streaks ---- */
const IN_CH = [['nospend', 7, '🚫'], ['fun', 30, '🎉'], ['save', 3, '💰'], ['fuel', 30, '⛽']];
function inChalState(k, ch){
  const now = new Date(), it = expData().items;
  if (k === 'nospend'){ const days = new Set(it.filter(x => !x.rec).map(x => x.date)); let n = 0; for (let i = 0; i < 7; i++){ const d = new Date(now - i * 864e5).toISOString().slice(0, 10); if (!days.has(d)) n++; } return {got: n, goal: 3, txt: t('in_c_nospendS', {n})}; }
  if (k === 'fun'){ const s = expTotals(inYm(now)).by.fun || 0, goal = +(ch && ch.target) || 500; return {got: Math.max(0, goal - s), goal, ok: s <= goal, txt: t('in_c_funS', {s: inM0(s), g: inM0(goal)})}; }
  if (k === 'save'){ let n = 0; for (let i = 1; i <= 24; i++){ const ym = inYm(now, -i), s = expTotals(ym).sum, inc = expIncome(ym); if (inc && +inc.v > s && s > 0) n++; else break; } return {got: n, goal: 3, txt: t('in_c_saveS', {n})}; }
  if (k === 'fuel'){ let m = NaN; try { const S = fuLogStats(); m = S ? +S.month : NaN; } catch (e) {} const goal = +(ch && ch.target) || 600; return {got: Number.isFinite(m) ? Math.max(0, goal - m) : 0, goal, ok: Number.isFinite(m) && m <= goal, txt: Number.isFinite(m) ? t('in_c_fuelS', {s: inM0(m), g: inM0(goal)}) : t('in_c_fuelNo')}; }
  return {got: 0, goal: 1, txt: ''};
}
function inChal(v){
  const E = inE, d = inD();
  v.innerHTML = `<p class="fine">${E(t('in_chalIntro'))}</p><ul class="rm-list">${IN_CH.map(([k, , ic]) => { const ch = d.ch.find(x => x.k === k), S = inChalState(k, ch), pct = Math.max(0, Math.min(100, S.goal ? S.got / S.goal * 100 : 0)), done = S.ok || S.got >= S.goal;
    return `<li class="rm-it${done ? ' in-done' : ''}"><div class="rm-ic" aria-hidden="true">${done ? '🏅' : ic}</div><div class="rm-b"><b>${E(t('in_c_' + k))}</b><span class="rm-w">${E(S.txt)}</span><span class="in-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(0)}%"></i></span>
      ${k === 'fun' || k === 'fuel' ? `<label class="bk-f in-tg"><span>${E(t('in_target'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-inct="${k}" value="${E(ch && ch.target || '')}" placeholder="${k === 'fun' ? 500 : 600}"></label>` : ''}</div></li>`; }).join('')}</ul>
    <p class="fine">${E(t('in_badges', {n: (d.badges || []).length}))}</p>`;
}

/* ---- the screen ---- */
function inRender(){
  const root = $('#hr_insights'); if (!root) return; inSnap(); const E = inE, d = inD(), unseen = d.ev.length && d.seen !== d.ev[0].day + d.ev[0].k;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist" aria-label="${E(t('tab_insights'))}">${IN_TABS.map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${INT === k ? ' on' : ''}" aria-selected="${INT === k}" data-intab="${k}">${ic} ${E(t('in_t_' + k))}${k === 'chg' && unseen ? ' •' : ''}</button>`).join('')}</div><div id="in_view"></div><p class="fine sl-priv">🔒 ${E(t('pic_priv'))}</p>`;
  const v = $('#in_view'); ({chg: inChg, trend: inTrend, subs: inSubs, infl: inInfl, bench: inBench, report: inReport, chal: inChal})[INT](v);
}
/* a badge when a challenge is met (kept, never shown twice) */
function inBadges(){ try { const d = inD(); d.badges = d.badges || []; IN_CH.forEach(([k]) => { const S = inChalState(k, d.ch.find(x => x.k === k)), id = k + ':' + inYm(new Date()); if ((S.ok || S.got >= S.goal) && !d.badges.includes(id)){ d.badges.push(id); if (d.badges.length > 120) d.badges.shift(); setTimeout(() => toast(t('in_badge', {n: t('in_c_' + k)})), 2500); } }); saveSet(); } catch (e) {} }
/* on Home: a line when something changed since the last look */
function inHome(){
  const hh = $('#hh'); if (!hh) return; const d = inD(); let box = $('#hin');
  const fresh = d.ev.length && d.seen !== d.ev[0].day + d.ev[0].k ? d.ev[0] : null;
  if (!fresh){ if (box) box.remove(); return; }
  if (!box){ (($('#hpic') || $('#hrm') || hh)).insertAdjacentHTML('beforebegin', '<div id="hin" class="hrm hin"></div>'); box = $('#hin'); }
  box.innerHTML = `<button type="button" class="hrm-in" data-go="insights"><span class="hrm-h">🔔 ${inE(t('in_e_' + fresh.k, {a: N(fresh.a, 2), b: N(fresh.b, 2)}))}</span><span class="hrm-r">${inE(inImpact(fresh))}</span></button>`;
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#hr_insights')) return; const d = inD(); let b;
  if ((b = t0.closest('[data-intab]'))){ INT = b.dataset.intab; inRender(); const n = $(`[data-intab="${INT}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-insk]'))){ const k = b.dataset.insk, st = b.dataset.inst; d.keep[k] = d.keep[k] === st ? '' : st; saveSet(); inRender(); return; }
  if ((b = t0.closest('[data-insrem]'))){ rmNew({title: t('in_remT', {n: b.dataset.insrem}), cat: 'money', before: 1, date: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)}); return; }
  if (t0.closest('#in_pdf')){ inReportPdf(); }
});
document.addEventListener('change', e => { const el = e.target; if (!el || !el.closest || !el.closest('#hr_insights')) return; if (el.id === 'in_rym'){ inD().rym = el.value; saveSet(); inRender(); } });
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.dataset.inct) return; const d = inD(), k = el.dataset.inct; let ch = d.ch.find(x => x.k === k); if (!ch){ ch = {k}; d.ch.push(ch); } ch.target = el.value; clearTimeout(inD.t); inD.t = setTimeout(() => { saveSet(); const S = inChalState(k, ch), li = el.closest('.rm-b'); if (li){ li.querySelector('.rm-w').textContent = S.txt; const pct = Math.max(0, Math.min(100, S.goal ? S.got / S.goal * 100 : 0)); li.querySelector('.in-prog i').style.width = pct.toFixed(0) + '%'; } }, 250); });
function inAiText(){ try { const ym = inYm(new Date()), c = expTotals(ym), s = inSubsList(); return `Insights: spent this month ${Math.round(c.sum)} ILS; subscriptions found: ${s.length} (${Math.round(s.reduce((q, x) => q + x.amt, 0))} ILS a month); recent official changes: ${inD().ev.slice(0, 5).map(e => e.k + ' ' + e.a + '→' + e.b).join(', ') || 'none'}.`; } catch (e) { return ''; } }
{ const aiStIn = aiScreenText; aiScreenText = function(id){ const s = aiStIn.apply(this, arguments); return id === 'insights' ? s + '\n' + inAiText() : s; }; }
{ const aiChIn = aiChipKeys; aiChipKeys = function(id){ return id === 'insights' ? ['in_c1', 'in_c2'] : aiChIn.apply(this, arguments); }; }
CALC.insights = () => null;
try { GS_SYN.insights = 'תובנות מגמות חריגות תחזית מנויים מנוי חודשי אינפלציה אישית יוקר המחיה השוואה לממוצע דוח חודשי אתגרים רצף מה השתנה insights trends subscriptions forecast monthly report challenges what changed رؤى اتجاهات اشتراكات تقرير شهري تحديات'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindIn = svKind; svKind = function(id){ return id === 'insights' ? '' : svKindIn.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('insights'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('insights'); } catch (e) {}
{
  const actIn = activate; activate = function(id){ const r = actIn.apply(this, arguments); if (id === 'insights') inRender(); else if (id === 'home'){ try { inHome(); } catch (e) {} } return r; };
  const alIn = applyLang; applyLang = function(){ const r = alIn.apply(this, arguments); try { if (tab === 'insights') inRender(); inHome(); } catch (e) {} return r; };
  const chIn = calcHome; calcHome = function(){ const r = chIn.apply(this, arguments); try { inHome(); } catch (e) {} return r; };
  setTimeout(() => { try { inSnap(); inHome(); inBadges(); } catch (e) {} }, 9000);
  try { if (tab === 'insights') inRender(); } catch (e) {}
}
