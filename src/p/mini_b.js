/* 13.24: saving, retirement and children – small calculators (engine: mini.js) */
miniDef('emergency', {
  intro: 'em_intro',
  fields: [
    {k: 'spend', t: 'em_spend', type: 'num', u: '₪', def: () => Math.round(miSpend()) || 10000},
    {k: 'job', t: 'em_job', type: 'sel', def: 'emp', opts: [['emp', 'em_jEmp'], ['two', 'em_jTwo'], ['self', 'em_jSelf']]},
    {k: 'have', t: 'em_have', type: 'num', u: '₪', def: 0},
    {k: 'save', t: 'em_save', type: 'num', u: '₪', def: 1000}
  ],
  calc(v){
    const months = v.job === 'self' ? 9 : v.job === 'two' ? 3 : 6, goal = v.spend * months, gap = Math.max(0, goal - v.have), n = v.save > 0 ? Math.ceil(gap / v.save) : Infinity;
    return {hero: {l: t('em_goal', {m: months}), v: MI0(goal), sub: gap ? t('em_gap', {g: MI0(gap)}) : t('em_done')},
      rows: [[t('em_have'), MI0(v.have)], [t('em_cover'), t('em_mo', {n: v.spend ? MIn(v.have / v.spend, 1) : 0})], gap ? [t('em_when'), isFinite(n) ? t('em_mo', {n}) : '—', 'total'] : null].filter(Boolean),
      bars: [{l: t('em_have'), v: Math.min(v.have, goal), max: goal, txt: MIP(goal ? Math.min(100, v.have / goal * 100) : 0, 0)}],
      note: t('em_where')};
  }
});
Object.assign(T, {
  tab_emergency:['קרן חירום','صندوق الطوارئ','Emergency fund'], d_emergency:['כמה כסף כדאי שיהיה בצד ליום סגריר, ובכמה זמן תגיעו לשם.','كم من المال يجب أن يكون جانبًا ليوم صعب، ومتى ستصلون إليه.','How much to keep aside for a rainy day, and how soon you\'ll get there.'],
  em_intro:['קרן חירום מכסה כמה חודשי הוצאות אם ההכנסה נעצרת. היא באה לפני השקעות.','صندوق الطوارئ يغطي بضعة أشهر من المصاريف إذا توقف الدخل. يأتي قبل الاستثمار.','An emergency fund covers a few months of spending if income stops. It comes before investing.'],
  em_spend:['הוצאות חודשיות','المصاريف الشهرية','Monthly spending'], em_job:['מצב תעסוקה','الوضع الوظيفي','Work situation'], em_jEmp:['שכיר/ה, הכנסה אחת','موظف، دخل واحد','Employee, one income'], em_jTwo:['שתי הכנסות יציבות','دخلان ثابتان','Two steady incomes'], em_jSelf:['עצמאי/ת או הכנסה לא קבועה','مستقل أو دخل غير ثابت','Self-employed or irregular income'],
  em_have:['כבר יש בצד','موجود جانبًا','Already set aside'], em_save:['אפשר לשים בצד כל חודש','يمكن ادخاره شهريًا','Can set aside each month'],
  em_goal:['יעד: {m} חודשי הוצאות','الهدف: {m} أشهر من المصاريف','Goal: {m} months of spending'], em_gap:['חסרים {g}','ينقص {g}','{g} to go'], em_done:['יש לכם קרן חירום מלאה 👏','لديكم صندوق طوارئ كامل 👏','Your emergency fund is full 👏'],
  em_cover:['הכסף שיש מכסה','المال الموجود يغطي','What you have covers'], em_mo:['{n} חודשים','{n} أشهر','{n} months'], em_when:['מתי תגיעו ליעד','متى ستصلون للهدف','When you\'ll reach it'],
  em_where:['כדאי להחזיק אותה במקום נזיל ובטוח – פיקדון קצר או קרן כספית – ולא במניות.','يُستحسن الاحتفاظ به في مكان سائل وآمن – وديعة قصيرة أو صندوق نقدي – لا في الأسهم.','Keep it somewhere liquid and safe – a short deposit or money-market fund – not in stocks.'],
});
/* ---- shared ---- */
const mbBoi = () => (typeof MKT !== 'undefined' && isFinite(+MKT.boi) && +MKT.boi > 0) ? +MKT.boi : 4.5;
const mbBank = () => { try { const d = bkD(); return d.accs.filter(a => a.type !== 'sav').reduce((s, a) => s + Math.max(0, miN(a.bal)), 0); } catch (e) { return 0; } };
const mbF = x => isFinite(x) ? x : 0;
/* ---- idle cash ---- */
miniDef('idlecash', {
  intro: 'ic_intro',
  fields: [
    {k: 'bal', t: 'ic_bal', type: 'num', u: '₪', def: () => Math.round(mbBank()) || 30000},
    {k: 'spend', t: 'ic_spend', type: 'num', u: '₪', def: () => Math.round(miSpend()) || 10000},
    {k: 'buf', t: 'ic_buf', type: 'num', u: 'u_mo', def: 2},
    {k: 'rate', t: 'ic_rate', type: 'num', u: '%', def: () => Math.max(0, Math.round((mbBoi() - 0.3) * 10) / 10)}
  ],
  calc(v){
    const keep = v.spend * Math.max(0, v.buf), idle = Math.max(0, v.bal - keep), lost = idle * v.rate / 100;
    return {hero: {l: t('ic_idle'), v: MI0(idle), sub: idle > 0 ? t('ic_lost', {x: MI0(lost)}) : t('ic_ok')},
      rows: [[t('ic_bal'), MI0(v.bal)], [t('ic_keep'), MI0(keep)], [t('ic_year'), MI0(lost), 'total'], [t('ic_5y'), MI0(miFV(idle, 0, v.rate, 60) - idle)]],
      note: t('ic_note'), acts: [{t: t('ic_mmf'), fn: () => activate('mmf')}]};
  }
});
/* ---- windfall ---- */
miniDef('windfall', {
  intro: 'wf_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'amt', t: 'wf_amt', type: 'num', u: '₪', def: 100000},
    {k: 'cc', t: 'wf_cc', type: 'num', u: '₪', def: 0}, {k: 'ccr', t: 'wf_ccr', type: 'num', u: '%', def: () => Math.round((mbBoi() + 1.5 + 5) * 10) / 10},
    {k: 'loan', t: 'wf_loan', type: 'num', u: '₪', def: 0}, {k: 'loanr', t: 'wf_loanr', type: 'num', u: '%', def: 8},
    {k: 'emer', t: 'wf_emer', type: 'num', u: '₪', def: 0, h: 'wf_emerH'},
    {k: 'mort', t: 'wf_mort', type: 'num', u: '%', def: 4.8, h: 'wf_mortH'},
    {k: 'ret', t: 'wf_ret', type: 'num', u: '%', def: 6}
  ],
  calc(v){
    let left = Math.max(0, v.amt); const steps = [];
    const take = (x, label, why) => { const a = Math.min(left, Math.max(0, x)); if (a > 0){ steps.push([label, MI0(a), why]); left -= a; } return a; };
    const debts = [{a: v.cc, r: v.ccr, l: t('wf_s_cc')}, {a: v.loan, r: v.loanr, l: t('wf_s_loan')}].filter(d => d.a > 0).sort((p, q) => q.r - p.r);
    const hi = debts.filter(d => d.r > v.ret), lo = debts.filter(d => d.r <= v.ret);
    hi.forEach(d => take(d.a, d.l, t('wf_w_debt', {r: MIP(d.r)})));
    take(v.emer, t('wf_s_emer'), t('wf_w_emer'));
    lo.forEach(d => take(d.a, d.l, t('wf_w_debt', {r: MIP(d.r)})));
    const prepay = v.mort > 0 && v.mort >= v.ret - 1;
    if (left > 0) steps.push([prepay ? t('wf_s_mort') : t('wf_s_inv'), MI0(left), prepay ? t('wf_w_mort', {m: MIP(v.mort), r: MIP(v.ret)}) : t('wf_w_inv', {m: MIP(v.mort), r: MIP(v.ret)})]);
    const g = (r) => mbF(v.amt * Math.pow(1 + r / 100, 10) - v.amt);
    const bars = [{l: t('wf_b_inv'), v: g(v.ret)}, {l: t('wf_b_mort'), v: g(v.mort)}];
    if (debts.length) bars.unshift({l: t('wf_b_debt'), v: g(debts[0].r)});
    bars.push({l: t('wf_b_dep'), v: g(Math.max(0, mbBoi() - 0.3))});
    return {hero: {l: t('wf_first'), v: steps.length ? steps[0][0] : '—', sub: steps.length ? steps[0][2] : ''},
      rows: steps.map((s, i) => [(i + 1) + '. ' + s[0], s[1]]),
      tips: steps.map(s => s[0] + ': ' + s[2]), bars, note: t('wf_barsN')};
  }
});
/* ---- latte ---- */
miniDef('latte', {
  intro: 'lt_intro',
  fields: [
    {k: 'cost', t: 'lt_cost', type: 'num', u: '₪', def: 18}, {k: 'week', t: 'lt_week', type: 'num', def: 5},
    {k: 'yrs', t: 'lt_yrs', type: 'num', u: 'u_yrs', def: 10}, {k: 'ret', t: 'lt_ret', type: 'num', u: '%', def: 5}
  ],
  calc(v){
    const mo = v.cost * v.week * 52 / 12, n = Math.max(0, Math.round(v.yrs * 12)), spent = mo * n, fv = miFV(0, mo, v.ret, n);
    return {hero: {l: t('lt_fv', {y: MIn(v.yrs)}), v: MI0(fv)},
      rows: [[t('lt_mo'), MI0(mo)], [t('lt_yr'), MI0(mo * 12)], [t('lt_spent'), MI0(spent)], [t('lt_gain'), MI0(fv - spent), 'total']],
      bars: [{l: t('lt_spent'), v: spent}, {l: t('lt_fvS'), v: fv}], note: t('lt_note')};
  }
});
/* ---- lump sum or annuity ---- */
miniDef('lumpsum', {
  intro: 'ls_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'bal', t: 'ls_bal', type: 'num', u: '₪', def: 1000000}, {k: 'fac', t: 'ls_fac', type: 'num', def: 200, h: 'ls_facH'},
    {k: 'age', t: 'ls_age', type: 'num', u: 'u_yrs', def: 67}, {k: 'ret', t: 'ls_ret', type: 'num', u: '%', def: 4},
    {k: 'sex', t: 'ls_sex', type: 'sel', def: 'm', opts: [['m', 'ls_m'], ['f', 'ls_f']]},
    {k: 'life', t: 'ls_life', type: 'num', u: 'u_yrs', def: 0, h: 'ls_lifeH'}
  ],
  calc(v){
    const ann = v.fac > 0 ? v.bal / v.fac : 0, life = v.life > 0 ? v.life : (v.sex === 'f' ? 88 : 85), yrs = Math.max(0, life - v.age);
    const be = ann > 0 ? v.bal / ann / 12 : 0;
    /* how long the lump sum lasts if you pay yourself the same monthly amount */
    const r = v.ret / 1200; let b = v.bal, m = 0; while (b > 0 && m < 1200 && ann > 0){ b = b * (1 + r) - ann; m++; }
    const lasts = m >= 1200 ? Infinity : m / 12, total = ann * 12 * yrs;
    return {hero: {l: t('ls_ann'), v: MI0(ann), sub: t('ls_be', {a: MIn(v.age + be, 1)})},
      rows: [[t('ls_beY'), t('ls_y', {n: MIn(be, 1)})], [t('ls_tot', {a: MIn(life)}), MI0(total)], [t('ls_lasts'), isFinite(lasts) ? t('ls_untilA', {a: MIn(v.age + lasts, 1)}) : t('ls_forever'), 'total']],
      tips: [t('ls_t1'), t('ls_t2'), t('ls_t3')], note: t('ls_tax')};
  }
});
/* ---- gradual retirement ---- */
miniDef('gradual', {
  intro: 'gr_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'sal', t: 'gr_sal', type: 'num', u: '₪', def: () => Math.round(miIncome()) || 15000}, {k: 'age', t: 'gr_age', type: 'num', u: 'u_yrs', def: 60},
    {k: 'from', t: 'gr_from', type: 'num', u: 'u_yrs', def: 62}, {k: 'ret', t: 'gr_retA', type: 'num', u: 'u_yrs', def: 67},
    {k: 'pct', t: 'gr_pct', type: 'num', u: '%', def: 50}, {k: 'bal', t: 'gr_bal', type: 'num', u: '₪', def: 800000},
    {k: 'dep', t: 'gr_dep', type: 'num', u: '%', def: 18.5, h: 'gr_depH'}, {k: 'r', t: 'gr_r', type: 'num', u: '%', def: 4}, {k: 'fac', t: 'ls_fac', type: 'num', def: 200}
  ],
  calc(v){
    const sim = part => { let b = v.bal; const r = v.r / 1200; for (let a = v.age; a < v.ret; a += 1 / 12){ const s = a >= v.from && part ? v.sal * v.pct / 100 : v.sal; b = b * (1 + r) + s * v.dep / 100; } return b; };
    const full = sim(false), part = sim(true), f = v.fac > 0 ? v.fac : 200, lostSal = Math.max(0, v.ret - Math.max(v.from, v.age)) * 12 * v.sal * (1 - v.pct / 100);
    return {hero: {l: t('gr_diff'), v: MI0((full - part) / f), sub: t('gr_diffS')},
      rows: [[t('gr_full'), MI0(full)], [t('gr_part'), MI0(part)], [t('gr_penF'), MI0(full / f)], [t('gr_penP'), MI0(part / f)], [t('gr_lost'), MI0(lostSal), 'total']],
      bars: [{l: t('gr_full'), v: full}, {l: t('gr_part'), v: part}], note: t('gr_note')};
  }
});
/* ---- consolidating old funds (a list) ---- */
miniDef('consol', {
  intro: 'co_intro', disc: 'mi_notAdvice', resettable: true,
  render(root, api){
    const d = api.d, E = api.E; if (!Array.isArray(d.funds) || !d.funds.length) d.funds = [{n: '', bal: '', fee: '', dep: ''}];
    if (d.tfee == null) d.tfee = '0.3'; if (d.ret == null) d.ret = '4';
    const calc = () => {
      const F = d.funds.map(f => ({bal: miN(f.bal), fee: miN(f.fee)})), tot = F.reduce((s, f) => s + f.bal, 0), now = F.reduce((s, f) => s + f.bal * f.fee / 100, 0), tf = miN(d.tfee), aft = tot * tf / 100;
      const g = (fee) => { let b = tot; for (let y = 0; y < 20; y++) b = b * (1 + (miN(d.ret) - fee) / 100); return b; }, avg = tot ? now / tot * 100 : 0;
      const small = d.funds.filter(f => miN(f.bal) > 0 && miN(f.bal) < 20000).length;
      return `<div class="hero mi-hero"><span class="hero-label">${E(t('co_save20'))}</span><span class="hero-value num">${E(MI0(mbF(g(tf) - g(avg))))}</span><div class="hero-sub">${E(t('co_yearS', {x: MI0(Math.max(0, now - aft))}))}</div></div>
        <dl class="ledger mi-led"><div class="row"><dt>${E(t('co_tot'))}</dt><dd class="num">${E(MI0(tot))}</dd></div><div class="row"><dt>${E(t('co_avg'))}</dt><dd class="num">${E(MIP(avg, 2))}</dd></div><div class="row"><dt>${E(t('co_now'))}</dt><dd class="num">${E(MI0(now))}</dd></div><div class="row total"><dt>${E(t('co_aft'))}</dt><dd class="num">${E(MI0(aft))}</dd></div></dl>
        ${small ? `<p class="fine">💡 ${E(t('co_small', {n: small}))}</p>` : ''}<ul class="mi-tips"><li>${E(t('co_t1'))}</li><li>${E(t('co_t2'))}</li><li>${E(t('co_t3'))}</li></ul>`;
    };
    root.innerHTML = `<div class="mi-card"><ul class="mi-list">${d.funds.map((f, i) => `<li class="mi-item"><div class="bk-grid">
      <label class="bk-f"><span>${E(t('co_name'))}</span><input type="text" data-co="${i}" data-ck="n" value="${E(f.n)}" placeholder="${E(t('co_nameP', {n: i + 1}))}"></label>
      <label class="bk-f"><span>${E(t('co_bal'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-co="${i}" data-ck="bal" value="${E(f.bal)}"></label>
      <label class="bk-f"><span>${E(t('co_fee'))} (%)</span><input type="text" inputmode="decimal" dir="ltr" data-co="${i}" data-ck="fee" value="${E(f.fee)}"></label>
      <label class="bk-f"><span>${E(t('co_dep'))} (%)</span><input type="text" inputmode="decimal" dir="ltr" data-co="${i}" data-ck="dep" value="${E(f.dep)}"></label></div>
      ${d.funds.length > 1 ? `<div class="rm-acts"><button type="button" class="px-tb s" data-codel="${i}" aria-label="${E(t('co_del', {n: f.n || i + 1}))}">🗑️</button></div>` : ''}</li>`).join('')}</ul>
      <div class="btnrow"><button type="button" class="mv" id="co_add">＋ ${E(t('co_add'))}</button></div>
      <div class="bk-grid"><label class="bk-f"><span>${E(t('co_tfee'))} (%)</span><input type="text" inputmode="decimal" dir="ltr" data-co="x" data-ck="tfee" value="${E(d.tfee)}"></label>
      <label class="bk-f"><span>${E(t('co_ret'))} (%)</span><input type="text" inputmode="decimal" dir="ltr" data-co="x" data-ck="ret" value="${E(d.ret)}"></label></div></div><div class="mi-out" id="co_out" aria-live="polite">${calc()}</div>`;
    let T0 = 0;
    root.oninput = e => { const el = e.target; if (!el.dataset || el.dataset.co == null) return; if (el.dataset.co === 'x') d[el.dataset.ck] = el.value; else d.funds[+el.dataset.co][el.dataset.ck] = el.value; root.querySelector('#co_out').innerHTML = calc(); clearTimeout(T0); T0 = setTimeout(api.save, 500); };
    root.onclick = e => { const b = e.target.closest('#co_add,[data-codel]'); if (!b) return; if (b.id === 'co_add'){ if (d.funds.length < 12) d.funds.push({n: '', bal: '', fee: '', dep: ''}); } else d.funds.splice(+b.dataset.codel, 1); api.save(); api.redraw(); };
  }
});
/* ---- investment tracks ---- */
miniDef('tracks', {
  intro: 'tr_intro', disc: 'mi_notAdvice',
  fields: [
    {k: 'bal', t: 'tr_bal', type: 'num', u: '₪', def: 200000}, {k: 'dep', t: 'tr_dep', type: 'num', u: '₪', def: 2000}, {k: 'yrs', t: 'tr_yrs', type: 'num', u: 'u_yrs', def: 20},
    {k: 'r1', t: 'tr_r1', type: 'num', u: '%', def: 6.5}, {k: 'r2', t: 'tr_r2', type: 'num', u: '%', def: 5}, {k: 'r3', t: 'tr_r3', type: 'num', u: '%', def: 3.5},
    {k: 'd1', t: 'tr_d1', type: 'num', u: '%', def: -25}, {k: 'd2', t: 'tr_d2', type: 'num', u: '%', def: -15}, {k: 'd3', t: 'tr_d3', type: 'num', u: '%', def: -5}
  ],
  calc(v){
    const n = Math.max(0, Math.round(v.yrs * 12)), T3 = [['eq', v.r1, v.d1], ['gen', v.r2, v.d2], ['bond', v.r3, v.d3]].map(([k, r, dr]) => ({k, r, dr, fv: miFV(v.bal, v.dep, r, n)}));
    const best = T3.reduce((a, b) => b.fv > a.fv ? b : a);
    return {hero: {l: t('tr_best', {n: t('tr_' + best.k)}), v: MI0(best.fv), sub: t('tr_bestS', {y: MIn(v.yrs)})},
      bars: T3.map(x => ({l: t('tr_' + x.k), v: x.fv})),
      rows: T3.map(x => [t('tr_worst', {n: t('tr_' + x.k), p: MIP(Math.abs(x.dr), 0)}), MI0(miFV(v.bal, v.dep, x.r, Math.round(n / 2)) * x.dr / 100)]),
      tips: [t('tr_t1'), t('tr_t2'), t('tr_t3')], note: t('tr_note')};
  }
});
/* ---- cost of raising a child ---- */
miniDef('kidcost', {
  intro: 'kc_intro',
  fields: [
    {k: 'age', t: 'kc_age', type: 'num', u: 'u_yrs', def: 0},
    {k: 's1', t: 'kc_s1', type: 'num', u: '₪', def: 4500, h: 'kc_s1H'}, {k: 's2', t: 'kc_s2', type: 'num', u: '₪', def: 3200, h: 'kc_s2H'}, {k: 's3', t: 'kc_s3', type: 'num', u: '₪', def: 2800, h: 'kc_s3H'},
    {k: 'inf', t: 'kc_inf', type: 'num', u: '%', def: 2.5}
  ],
  calc(v){
    const a0 = Math.max(0, Math.min(18, Math.floor(v.age))); let tot = 0, rest = 0; const per = [0, 0, 0];
    for (let a = 0; a < 18; a++){ const st = a < 3 ? 0 : a < 6 ? 1 : 2, base = [v.s1, v.s2, v.s3][st] * 12, y = a - a0, c = base * Math.pow(1 + v.inf / 100, Math.max(0, y)); tot += base; per[st] += base; if (a >= a0) rest += c; }
    return {hero: {l: t('kc_rest', {a: a0}), v: MI0(rest), sub: t('kc_restS')},
      rows: [[t('kc_tot'), MI0(tot)], [t('kc_avgY'), MI0(tot / 18)], [t('kc_avgM'), MI0(tot / 216), 'total']],
      bars: [{l: t('kc_b1'), v: per[0]}, {l: t('kc_b2'), v: per[1]}, {l: t('kc_b3'), v: per[2]}], note: t('kc_note'),
      acts: [{t: t('kc_save'), fn: () => activate('kidsave')}]};
  }
});
/* ---- daycare / after-school ---- */
miniDef('daycare', {
  intro: 'dc_intro',
  fields: [1, 2, 3].flatMap(i => [
    {k: 'p' + i, t: 'dc_p' + i, type: 'num', u: '₪', def: i === 1 ? 3800 : i === 2 ? 3200 : 0},
    {k: 'h' + i, t: 'dc_h', type: 'num', u: 'u_hrs', def: i === 3 ? 0 : 9, h: 'dc_hH', show: v => v['p' + i] > 0},
    {k: 'x' + i, t: 'dc_x', type: 'num', u: '₪', def: 0, show: v => v['p' + i] > 0}
  ]).concat([{k: 'mo', t: 'dc_mo', type: 'num', u: 'u_mo', def: 11}, {k: 'sub', t: 'dc_sub', type: 'num', u: '₪', def: 0, h: 'dc_subH'}]),
  calc(v){
    const O = [1, 2, 3].filter(i => v['p' + i] > 0).map(i => { const net = Math.max(0, v['p' + i] + v['x' + i] - v.sub), y = net * v.mo, hrs = v['h' + i] * 21.5 * v.mo; return {i, y, ph: hrs > 0 ? y / hrs : 0}; });
    if (!O.length) return {note: t('dc_none')};
    const best = O.reduce((a, b) => b.y < a.y ? b : a);
    return {hero: {l: t('dc_best', {n: best.i}), v: MI0(best.y), sub: t('dc_perY')},
      rows: O.map(o => [t('dc_opt', {n: o.i}), MI0(o.y) + (o.ph ? ' · ' + t('dc_ph', {x: MI0(o.ph)}) : '')]),
      bars: O.map(o => ({l: t('dc_opt', {n: o.i}), v: o.y})), note: t('dc_note'),
      links: [{t: t('dc_link'), url: 'https://www.kolzchut.org.il/w/index.php?search=' + encodeURIComponent('סבסוד מעונות יום')}]};
  }
});
/* ---- bar/bat mitzvah or a child's wedding ---- */
miniDef('kidevent', {
  intro: 'ke_intro',
  fields: [
    {k: 'type', t: 'ke_type', type: 'sel', def: 'bm', opts: [['bm', 'ke_bm'], ['wed', 'ke_wed'], ['other', 'ke_other']]},
    {k: 'yrs', t: 'ke_yrs', type: 'num', u: 'u_yrs', def: 6}, {k: 'cost', t: 'ke_cost', type: 'num', u: '₪', def: () => 60000, h: 'ke_costH'},
    {k: 'inf', t: 'ke_inf', type: 'num', u: '%', def: 2.5}, {k: 'ret', t: 'ke_ret', type: 'num', u: '%', def: 4}, {k: 'have', t: 'ke_have', type: 'num', u: '₪', def: 0}
  ],
  calc(v){
    const n = Math.max(1, Math.round(v.yrs * 12)), future = v.cost * Math.pow(1 + v.inf / 100, v.yrs), haveF = miFV(v.have, 0, v.ret, n), need = Math.max(0, future - haveF), r = v.ret / 1200;
    const mo = need <= 0 ? 0 : r ? need * r / (Math.pow(1 + r, n) - 1) : need / n;
    return {hero: {l: t('ke_mo'), v: MI0(mo), sub: t('ke_moS', {n: t(v.type === 'wed' ? 'ke_wed' : v.type === 'bm' ? 'ke_bm' : 'ke_other'), y: MIn(v.yrs)})},
      rows: [[t('ke_future'), MI0(future)], [t('ke_haveF'), MI0(haveF)], [t('ke_need'), MI0(need), 'total']],
      note: t('ke_note'), acts: [{t: t('ke_goal'), fn: () => activate('savegoal')}]};
  }
});
/* ---- teens: learning mode ---- */
const TN_L = [
  {k: 'slip', a: 1, n: 3}, {k: 'net', a: 0, n: 3}, {k: 'early', a: 2, n: 3, live: true}, {k: 'debt', a: 1, n: 3}, {k: 'bud', a: 0, n: 3}, {k: 'scam', a: 2, n: 3}
];
miniDef('teen', {
  intro: 'tn_intro', resettable: true,
  render(root, api){
    const d = api.d, E = api.E; if (!d.done || typeof d.done !== 'object') d.done = {}; if (!d.ans || typeof d.ans !== 'object') d.ans = {};
    const n = TN_L.filter(l => d.done[l.k]).length; let yrs = miN(d.yrs || 40); let TY = 0;
    const early = () => { const a = miFV(0, 200, 6, 12 * yrs), b = miFV(0, 200, 6, 12 * Math.max(0, yrs - 10)); return `<label class="bk-f"><span>${E(t('tn_slider', {y: yrs}))}</span><input type="range" min="10" max="50" step="1" value="${yrs}" data-tny></label><p class="num">${E(t('tn_earlyR', {a: MI0(a), b: MI0(b)}))}</p>`; };
    root.innerHTML = `<p class="fine">${E(t('tn_prog', {n, m: TN_L.length}))} ${'⭐'.repeat(n)}</p><ul class="mi-list">${TN_L.map((l, i) => {
      const ans = d.ans[l.k];
      return `<li class="mi-item"><h4>${d.done[l.k] ? '✅' : (i + 1) + '.'} ${E(t('tn_' + l.k))}</h4><p>${E(t('tn_' + l.k + 'B'))}</p>${l.live ? `<div class="tn-live">${early()}</div>` : ''}
      <p><b>${E(t('tn_' + l.k + 'Q'))}</b></p><div class="ds-chips">${Array.from({length: l.n}, (_, j) => `<button type="button" class="ds-chip${ans === j ? ' on' : ''}" data-tnq="${l.k}" data-tna="${j}" aria-pressed="${ans === j}">${E(t('tn_' + l.k + 'A' + j))}</button>`).join('')}</div>
      ${ans != null ? `<p class="${ans === l.a ? 'fine' : 'rm-w'}">${ans === l.a ? '✔️ ' + E(t('tn_right')) : '✖️ ' + E(t('tn_wrong'))} ${E(t('tn_' + l.k + 'X'))}</p>` : ''}</li>`; }).join('')}</ul>
      ${n === TN_L.length ? `<p class="mi-intro">🎓 ${E(t('tn_all'))}</p>` : ''}`;
    root.onclick = e => { const b = e.target.closest('[data-tnq]'); if (!b) return; const k = b.dataset.tnq, a = +b.dataset.tna, L = TN_L.find(x => x.k === k); d.ans[k] = a; if (a === L.a) d.done[k] = true; api.save(); api.redraw(); };
    root.oninput = e => { if (e.target.hasAttribute('data-tny')){ d.yrs = e.target.value; yrs = miN(d.yrs); const host = e.target.closest('.tn-live'); host.innerHTML = early(); const s = host.querySelector('[data-tny]'); if (s) s.focus(); clearTimeout(TY); TY = setTimeout(api.save, 500); } };
  }
});
Object.assign(T, {
  tab_idlecash:['כסף ששוכב בעו״ש','مال راكد في الحساب الجاري','Idle cash in checking'], d_idlecash:['כמה כסף שוכב בעו״ש בלי להרוויח, וכמה ריבית מפסידים עליו בשנה.','كم من المال راكد في الحساب الجاري بلا عائد، وكم فائدة تخسرون عليه سنويًا.','How much money sits in checking earning nothing, and how much interest that costs you a year.'],
  ic_intro:['בעו״ש כמעט אין ריבית. מעבר לכרית קטנה להוצאות, את השאר אפשר להעביר לפיקדון או לקרן כספית.','الحساب الجاري لا يدرّ فائدة تقريبًا. ما يزيد عن احتياطي صغير للمصاريف يمكن نقله إلى وديعة أو صندوق نقدي.','Checking pays almost no interest. Beyond a small cushion for spending, the rest can go to a deposit or money-market fund.'],
  ic_bal:['יתרה בעו״ש','الرصيد في الحساب الجاري','Checking balance'], ic_spend:['הוצאות חודשיות','المصاريف الشهرية','Monthly spending'], ic_buf:['כרית שכדאי להשאיר','الاحتياطي الذي يُترك','Cushion to keep'], ic_rate:['ריבית בפיקדון או בקרן כספית','الفائدة في وديعة أو صندوق نقدي','Deposit or money-market rate'],
  ic_idle:['כסף שאפשר להזיז','مال يمكن نقله','Money you could move'], ic_lost:['מפסידים בערך {x} ריבית בשנה','تخسرون نحو {x} فائدة سنويًا','You lose about {x} interest a year'], ic_ok:['היתרה בגובה הכרית – אין כסף שוכב סתם 👍','الرصيد بحجم الاحتياطي – لا مال راكد 👍','The balance matches the cushion – nothing sitting idle 👍'],
  ic_keep:['להשאיר בעו״ש','يبقى في الحساب الجاري','Keep in checking'], ic_year:['ריבית שמפסידים בשנה','الفائدة الضائعة سنويًا','Interest lost per year'], ic_5y:['ריבית על פני 5 שנים','الفائدة خلال 5 سنوات','Interest over 5 years'],
  ic_note:['קרן כספית ופיקדון קצר נזילים כמעט כמו עו״ש. הריבית בהם משתנה עם ריבית בנק ישראל.','الصندوق النقدي والوديعة القصيرة سائلان تقريبًا كالحساب الجاري. فائدتهما تتغير مع فائدة بنك إسرائيل.','Money-market funds and short deposits are nearly as liquid as checking. Their rate moves with the Bank of Israel rate.'],
  ic_mmf:['להשוואת פיקדון וקרן כספית','لمقارنة الوديعة والصندوق النقدي','Compare deposit vs money-market'],
  tab_windfall:['מה לעשות עם סכום כסף','ماذا أفعل بمبلغ من المال','What to do with a lump of money'], d_windfall:['קיבלתם בונוס, ירושה או פיצויים? סדר עדיפויות: חובות יקרים, קרן חירום, משכנתא או השקעה.','حصلتم على مكافأة أو ميراث أو تعويض؟ ترتيب الأولويات: ديون مكلفة، صندوق طوارئ، رهن أو استثمار.','Got a bonus, inheritance or severance? An order of priorities: costly debt, emergency fund, mortgage or investing.'],
  wf_intro:['הכלל: קודם סוגרים חוב שהריבית שלו גבוהה מהתשואה הצפויה, אחר כך משלימים קרן חירום, ורק אז משווים בין פירעון משכנתא להשקעה.','القاعدة: أولًا يُسدد الدين الذي فائدته أعلى من العائد المتوقع، ثم يُكمل صندوق الطوارئ، وبعدها فقط المقارنة بين سداد الرهن والاستثمار.','The rule: first clear debt costing more than the expected return, then fill the emergency fund, and only then weigh mortgage prepayment against investing.'],
  wf_amt:['הסכום','المبلغ','Amount'], wf_cc:['מינוס או חוב באשראי','سحب زائد أو دين بطاقة','Overdraft or card debt'], wf_ccr:['ריבית המינוס','فائدة السحب الزائد','Overdraft rate'], wf_loan:['יתרת הלוואה','رصيد القرض','Loan balance'], wf_loanr:['ריבית ההלוואה','فائدة القرض','Loan rate'],
  wf_emer:['חסר בקרן החירום','النقص في صندوق الطوارئ','Missing from emergency fund'], wf_emerH:['אפשר לבדוק במחשבון קרן חירום','يمكن الفحص في حاسبة صندوق الطوارئ','Check it in the emergency fund calculator'], wf_mort:['ריבית המשכנתא','فائدة الرهن','Mortgage rate'], wf_mortH:['0 אם אין משכנתא','0 إن لم يوجد رهن','0 if no mortgage'], wf_ret:['תשואה צפויה בהשקעה','العائد المتوقع للاستثمار','Expected investment return'],
  wf_s_cc:['לסגור את המינוס','إغلاق السحب الزائد','Clear the overdraft'], wf_s_loan:['לפרוע את ההלוואה','سداد القرض','Pay off the loan'], wf_s_emer:['להשלים קרן חירום','إكمال صندوق الطوارئ','Fill the emergency fund'], wf_s_mort:['פירעון מוקדם של משכנתא','سداد مبكر للرهن','Prepay the mortgage'], wf_s_inv:['להשקיע לטווח ארוך','الاستثمار لأمد طويل','Invest for the long term'],
  wf_w_debt:['ריבית של {r} – כל שקל שסוגרים חוסך את הריבית הזו בוודאות.','فائدة {r} – كل شيكل يُسدد يوفّر هذه الفائدة بالتأكيد.','A {r} rate – every shekel repaid saves that interest for sure.'], wf_w_emer:['שקט נפשי, וכדי לא לחזור למינוס בפעם הבאה שמשהו קורה.','راحة بال، وكي لا تعودوا للسحب الزائد عند أي طارئ.','Peace of mind, and no slipping back into overdraft next time something happens.'],
  wf_w_mort:['המשכנתא ({m}) עולה בערך כמו התשואה הצפויה ({r}) – פירעון הוא רווח בטוח. בדקו עמלת פירעון מוקדם.','الرهن ({m}) يكلف تقريبًا كالعائد المتوقع ({r}) – السداد ربح مضمون. افحصوا عمولة السداد المبكر.','The mortgage ({m}) costs about as much as the expected return ({r}) – prepaying is a sure gain. Check the prepayment fee.'],
  wf_w_inv:['התשואה הצפויה ({r}) גבוהה מריבית המשכנתא ({m}) – לטווח ארוך השקעה צפויה להשתלם יותר, עם סיכון.','العائد المتوقع ({r}) أعلى من فائدة الرهن ({m}) – على المدى الطويل يُتوقع أن يكون الاستثمار أربح، مع مخاطرة.','The expected return ({r}) beats the mortgage rate ({m}) – long term, investing should pay more, with risk.'],
  wf_b_inv:['השקעה','استثمار','Investing'], wf_b_mort:['פירעון משכנתא','سداد الرهن','Mortgage prepayment'], wf_b_debt:['סגירת החוב היקר','سداد الدين المكلف','Clearing the costly debt'], wf_b_dep:['פיקדון','وديعة','Deposit'],
  wf_first:['הצעד הראשון','الخطوة الأولى','First step'], wf_barsN:['הפסים: כמה כל אפשרות מרוויחה או חוסכת על כל הסכום בתוך 10 שנים, לפי הריביות שהזנתם.','الأشرطة: كم تربح أو توفر كل إمكانية على كامل المبلغ خلال 10 سنوات، حسب الفوائد المدخلة.','Bars: how much each option earns or saves on the whole amount over 10 years, at the rates you entered.'],
  tab_latte:['חיסכון במקום','ادخار بدلًا من ذلك','Save instead'], d_latte:['מה שווה ויתור קטן וקבוע – קפה, סיגריות, משלוחים – אם משקיעים אותו.','كم يساوي تنازل صغير ومنتظم – قهوة، سجائر، توصيلات – إذا استُثمر.','What a small regular habit – coffee, cigarettes, deliveries – is worth if you invest it instead.'],
  lt_intro:['הוצאה קטנה שחוזרת על עצמה מצטברת לסכום גדול, במיוחד כשהכסף עובד בריבית דריבית.','نفقة صغيرة متكررة تتراكم لمبلغ كبير، خاصة عندما يعمل المال بالفائدة المركبة.','A small repeated expense adds up to a big sum, especially when the money compounds.'],
  lt_cost:['מחיר לפעם','السعر للمرة','Cost each time'], lt_week:['כמה פעמים בשבוע','كم مرة في الأسبوع','Times per week'], lt_yrs:['לכמה זמן','لكم من الوقت','For how long'], lt_ret:['תשואה שנתית','العائد السنوي','Yearly return'],
  lt_fv:['שווה בעוד {y} שנים אם משקיעים','قيمته بعد {y} سنوات إذا استُثمر','Worth in {y} years if invested'], lt_mo:['בחודש','شهريًا','Per month'], lt_yr:['בשנה','سنويًا','Per year'], lt_spent:['סך הכול מוציאים','المجموع المصروف','Total spent'], lt_gain:['רווח מהשקעה','ربح الاستثمار','Investment gain'], lt_fvS:['אם משקיעים','إذا استُثمر','If invested'],
  lt_note:['לא חייבים לוותר על הכול – גם חצי מההרגל עושה הבדל.','ليس عليكم التنازل عن كل شيء – حتى نصف العادة يُحدث فرقًا.','You don\'t have to give it all up – even half the habit makes a difference.'],
  tab_lumpsum:['הון או קצבה','مبلغ مقطوع أم معاش','Lump sum or pension'], d_lumpsum:['למשוך את החיסכון בבת אחת או לקבל קצבה חודשית – מתי הקצבה משתלמת יותר.','سحب المدخرات دفعة واحدة أم معاش شهري – متى يكون المعاش أربح.','Take your savings at once or as a monthly pension – when the pension pays off.'],
  ls_intro:['קצבה = הצבירה חלקי מקדם ההמרה. היא משולמת כל החיים, גם אם תחיו הרבה. סכום חד־פעמי גמיש, אבל עלול להיגמר.','المعاش = المدخرات مقسومة على معامل التحويل. يُدفع مدى الحياة. المبلغ المقطوع مرن لكنه قد ينفد.','Pension = balance ÷ conversion factor. It\'s paid for life, however long. A lump sum is flexible but can run out.'],
  ls_bal:['צבירה בגיל פרישה','المدخرات عند التقاعد','Balance at retirement'], ls_fac:['מקדם המרה','معامل التحويل','Conversion factor'], ls_facH:['מופיע בדוח השנתי של הקרן. ככל שהוא נמוך – הקצבה גבוהה.','يظهر في التقرير السنوي للصندوق. كلما انخفض – ارتفع المعاش.','It\'s in the fund\'s annual report. Lower factor = higher pension.'],
  ls_age:['גיל פרישה','سن التقاعد','Retirement age'], ls_ret:['תשואה אם מושכים ומשקיעים','العائد إذا سُحب واستُثمر','Return if taken and invested'], ls_sex:['תוחלת חיים לפי','متوسط العمر حسب','Life expectancy for'], ls_m:['גבר (85)','رجل (85)','Man (85)'], ls_f:['אישה (88)','امرأة (88)','Woman (88)'],
  ls_life:['תוחלת חיים משלכם','متوسط عمر خاص بكم','Your own life expectancy'], ls_lifeH:['0 = לפי הממוצע','0 = حسب المتوسط','0 = use the average'],
  ls_ann:['קצבה חודשית','معاش شهري','Monthly pension'], ls_be:['הקצבה מחזירה את הצבירה בגיל {a}','المعاش يعيد المدخرات في سن {a}','The pension pays back the balance by age {a}'], ls_beY:['זמן עד שהקצבה מחזירה את הסכום','الوقت حتى يعيد المعاش المبلغ','Time until the pension repays the sum'], ls_y:['{n} שנים','{n} سنوات','{n} years'],
  ls_tot:['סך הקצבאות עד גיל {a}','مجموع المعاشات حتى سن {a}','Total pension to age {a}'], ls_lasts:['סכום חד־פעמי עם אותה משיכה חודשית יספיק','المبلغ المقطوع بنفس السحب الشهري يكفي','A lump sum with the same monthly draw lasts'], ls_untilA:['עד גיל {a}','حتى سن {a}','until age {a}'], ls_forever:['כל החיים – התשואה מכסה את המשיכה','مدى الحياة – العائد يغطي السحب','for life – the return covers the draw'],
  ls_t1:['אם חיים יותר מהממוצע – הקצבה משתלמת יותר.','إذا عشتم أكثر من المتوسط – المعاش أربح.','If you live past the average, the pension wins.'], ls_t2:['סכום חד־פעמי מאפשר להוריש ולשלם חוב, אבל דורש משמעת בהשקעה.','المبلغ المقطوع يتيح التوريث وسداد الديون، لكنه يتطلب انضباطًا.','A lump sum can be left to heirs or repay debt, but needs discipline.'], ls_t3:['אפשר גם לשלב: חלק כקצבה וחלק כהון.','يمكن الدمج أيضًا: جزء معاش وجزء مبلغ مقطوع.','You can also mix: part pension, part lump sum.'],
  ls_tax:['המס על קצבה ועל משיכה בהון שונה ותלוי בהרבה פרטים – לא נכלל כאן. כדאי לבדוק עם יועץ פנסיוני.','الضريبة على المعاش وعلى السحب المقطوع مختلفة وتعتمد على تفاصيل كثيرة – غير مشمولة هنا. يُستحسن الفحص مع مستشار تقاعد.','Tax on a pension and on a lump-sum withdrawal differs and depends on many details – not included. Check with a pension advisor.'],
  tab_gradual:['פרישה הדרגתית','التقاعد التدريجي','Gradual retirement'], d_gradual:['מה קורה לפנסיה אם עוברים לחצי משרה כמה שנים לפני הפרישה.','ماذا يحدث للمعاش إذا انتقلتم لنصف وظيفة قبل التقاعد ببضع سنوات.','What happens to your pension if you go part-time a few years before retiring.'],
  gr_intro:['פחות שעות בשנים האחרונות זה פחות הפקדות לפנסיה. כאן רואים בכמה זה מוריד את הקצבה.','ساعات أقل في السنوات الأخيرة تعني إيداعات أقل للمعاش. هنا ترون كم يخفض ذلك المعاش.','Fewer hours in the last years means smaller pension deposits. Here you see how much that lowers the pension.'],
  gr_sal:['שכר חודשי היום','الراتب الشهري اليوم','Monthly salary today'], gr_age:['גיל היום','العمر اليوم','Age today'], gr_from:['מאיזה גיל משרה חלקית','من أي سن وظيفة جزئية','Part-time from age'], gr_retA:['גיל פרישה','سن التقاعد','Retirement age'], gr_pct:['היקף המשרה החלקית','حجم الوظيفة الجزئية','Part-time share'],
  gr_bal:['צבירה בפנסיה היום','مدخرات المعاش اليوم','Pension balance today'], gr_dep:['הפקדה לפנסיה מהשכר','الإيداع للمعاش من الراتب','Pension deposit of salary'], gr_depH:['עובד + מעסיק + פיצויים, בדרך כלל 18.5%','عامل + مشغّل + تعويضات، عادةً 18.5%','Employee + employer + severance, usually 18.5%'], gr_r:['תשואה שנתית','العائد السنوي','Yearly return'],
  gr_diff:['הקצבה תרד בכ־','سينخفض المعاش بنحو','Pension drops by about'], gr_diffS:['בחודש, לעומת משרה מלאה עד הפרישה','شهريًا، مقارنة بوظيفة كاملة حتى التقاعد','a month, vs full-time until retirement'], gr_full:['צבירה – משרה מלאה','المدخرات – وظيفة كاملة','Balance – full-time'], gr_part:['צבירה – משרה חלקית','المدخرات – وظيفة جزئية','Balance – part-time'],
  gr_penF:['קצבה – משרה מלאה','المعاش – وظيفة كاملة','Pension – full-time'], gr_penP:['קצבה – משרה חלקית','المعاش – وظيفة جزئية','Pension – part-time'], gr_lost:['שכר שמוותרים עליו עד הפרישה','الراتب المتنازل عنه حتى التقاعد','Salary given up until retirement'],
  gr_note:['אפשר לבקש מהמעסיק להמשיך להפריש לפנסיה לפי השכר המלא – כדאי לשאול.','يمكن طلب استمرار الإيداع للمعاش حسب الراتب الكامل – يستحق السؤال.','You can ask the employer to keep pension deposits at the full salary – worth asking.'],
  tab_consol:['ריכוז קופות ישנות','تجميع الصناديق القديمة','Consolidate old funds'], d_consol:['כמה חוסכים בדמי ניהול אם מאחדים כמה קופות קטנות לקופה אחת.','كم توفرون في رسوم الإدارة عند دمج عدة صناديق صغيرة في صندوق واحد.','How much you save in fees by merging several small funds into one.'],
  co_intro:['קופות ישנות ממקומות עבודה קודמים גובות לעיתים דמי ניהול גבוהים. איחוד שלהן לקופה אחת עם דמי ניהול נמוכים יכול לחסוך הרבה לאורך השנים.','الصناديق القديمة من أماكن عمل سابقة تجبي أحيانًا رسومًا عالية. دمجها في صندوق برسوم منخفضة قد يوفر الكثير.','Old funds from past jobs often charge high fees. Merging them into one low-fee fund can save a lot over the years.'],
  co_name:['שם הקופה','اسم الصندوق','Fund name'], co_nameP:['קופה {n}','صندوق {n}','Fund {n}'], co_bal:['צבירה','المدخرات','Balance'], co_fee:['דמי ניהול מצבירה','رسوم من المدخرات','Fee on balance'], co_dep:['דמי ניהול מהפקדה','رسوم من الإيداع','Fee on deposits'], co_del:['מחיקת {n}','حذف {n}','Delete {n}'], co_add:['קופה נוספת','صندوق إضافي','Another fund'],
  co_tfee:['דמי ניהול בקופה המאוחדת','الرسوم في الصندوق الموحد','Fee in the merged fund'], co_ret:['תשואה שנתית לפני דמי ניהול','العائد السنوي قبل الرسوم','Yearly return before fees'],
  co_save20:['חיסכון משוער ב־20 שנה','توفير تقديري خلال 20 سنة','Estimated saving over 20 years'], co_yearS:['כ־{x} בשנה כבר עכשיו','نحو {x} سنويًا من الآن','About {x} a year right away'], co_tot:['סך הצבירה','مجموع المدخرات','Total balance'], co_avg:['דמי ניהול ממוצעים היום','متوسط الرسوم اليوم','Average fee today'], co_now:['דמי ניהול בשנה היום','الرسوم السنوية اليوم','Fees per year today'], co_aft:['דמי ניהול בשנה אחרי איחוד','الرسوم السنوية بعد الدمج','Fees per year after merging'],
  co_small:['{n} קופות קטנות מ־20,000 ₪ – קופות קטנות ולא פעילות כדאי לאחד ראשונות.','{n} صناديق أقل من 20,000 ₪ – يُستحسن دمج الصغيرة وغير النشطة أولًا.','{n} funds under ₪20,000 – small inactive funds are worth merging first.'],
  co_t1:['את כל הקופות שלכם אפשר למצוא במסלקה הפנסיונית (הר הכסף).','يمكن إيجاد جميع صناديقكم في المقاصة التقاعدية (هار هكيسف).','You can find all your funds in the pension clearing house (Har HaKesef).'], co_t2:['לפני איחוד בודקים שלא מאבדים ביטוח, מסלול ותיק או מקדם המרה מובטח.','قبل الدمج تأكدوا من عدم فقدان تأمين أو مسار قديم أو معامل تحويل مضمون.','Before merging, check you don\'t lose insurance, an old track or a guaranteed conversion factor.'], co_t3:['אפשר לבקש מהקופה להוריד דמי ניהול – לעיתים קרובות מסכימים.','يمكن طلب تخفيض الرسوم من الصندوق – كثيرًا ما يوافقون.','You can ask the fund to lower its fee – they often agree.'],
  tab_tracks:['מסלולי השקעה','مسارات الاستثمار','Investment tracks'], d_tracks:['מסלול מנייתי, כללי או אג״ח בפנסיה ובהשתלמות – מה ההבדל לאורך השנים, ומה קורה בשנה רעה.','مسار أسهم أو عام أو سندات في التقاعد وصندوق الاستكمال – ما الفرق عبر السنين، وماذا يحدث في سنة سيئة.','Equity, general or bond tracks in pension and study funds – the difference over the years, and in a bad year.'],
  tr_intro:['התשואות כאן הן הנחות להמחשה בלבד, לא תחזית. מניות צפויות להניב יותר לאורך זמן, אבל יורדות יותר בשנים רעות.','العوائد هنا افتراضات للتوضيح فقط، لا توقعات. الأسهم يُتوقع أن تدر أكثر مع الوقت، لكنها تنخفض أكثر في السنوات السيئة.','Returns here are illustrative assumptions, not forecasts. Stocks tend to earn more over time but fall harder in bad years.'],
  tr_bal:['צבירה היום','المدخرات اليوم','Balance today'], tr_dep:['הפקדה חודשית','الإيداع الشهري','Monthly deposit'], tr_yrs:['שנים עד שצריך את הכסף','سنوات حتى الحاجة للمال','Years until you need it'],
  tr_r1:['תשואה – מנייתי','العائد – أسهم','Return – equity'], tr_r2:['תשואה – כללי','العائد – عام','Return – general'], tr_r3:['תשואה – אג״ח','العائد – سندات','Return – bonds'], tr_d1:['שנה רעה – מנייתי','سنة سيئة – أسهم','Bad year – equity'], tr_d2:['שנה רעה – כללי','سنة سيئة – عام','Bad year – general'], tr_d3:['שנה רעה – אג״ח','سنة سيئة – سندات','Bad year – bonds'],
  tr_eq:['מנייתי','أسهم','Equity'], tr_gen:['כללי','عام','General'], tr_bond:['אג״ח','سندات','Bonds'], tr_best:['הכי הרבה במסלול {n}','الأكثر في مسار {n}','Most in the {n} track'], tr_bestS:['בעוד {y} שנים, לפי ההנחות','بعد {y} سنوات، حسب الافتراضات','in {y} years, by the assumptions'],
  tr_worst:['ירידה של {p} באמצע הדרך – {n}','انخفاض {p} في منتصف الطريق – {n}','A {p} fall halfway – {n}'],
  tr_t1:['כשנשארו הרבה שנים – יש זמן להתאושש מירידות.','عندما تبقى سنوات كثيرة – هناك وقت للتعافي.','With many years left there\'s time to recover from falls.'], tr_t2:['כשמתקרבים לפרישה – כדאי להקטין סיכון.','عند الاقتراب من التقاعد – يُستحسن تقليل المخاطرة.','Close to retirement, it\'s worth lowering risk.'], tr_t3:['מסלול תלוי גיל עושה את זה אוטומטית.','المسار المرتبط بالعمر يفعل ذلك تلقائيًا.','An age-based track does this automatically.'],
  tr_note:['החלפת מסלול בפנסיה ובהשתלמות לא יוצרת אירוע מס.','تغيير المسار في التقاعد وصندوق الاستكمال لا يُنشئ حدثًا ضريبيًا.','Switching tracks in pension and study funds isn\'t a taxable event.'],
  tab_kidcost:['עלות גידול ילד','تكلفة تربية طفل','Cost of raising a child'], d_kidcost:['הערכה של כמה עולה ילד מלידה ועד גיל 18, לפי ההוצאות שלכם.','تقدير كم يكلف الطفل من الولادة حتى 18، حسب مصاريفكم.','An estimate of what a child costs from birth to 18, by your own figures.'],
  kc_intro:['הסכומים ההתחלתיים הם הערכה כללית – שנו אותם לפי מה שאתם מוציאים בפועל.','المبالغ الأولية تقدير عام – غيّروها حسب ما تصرفونه فعلًا.','The starting amounts are a rough guess – change them to what you actually spend.'],
  kc_age:['גיל הילד היום','عمر الطفل اليوم','Child\'s age today'], kc_s1:['גיל 0–3, בחודש','عمر 0–3، شهريًا','Age 0–3, per month'], kc_s1H:['מעון, חיתולים, אוכל, ציוד','حضانة، حفاضات، طعام، معدات','Daycare, nappies, food, gear'], kc_s2:['גיל 3–6, בחודש','عمر 3–6، شهريًا','Age 3–6, per month'], kc_s2H:['גן, צהרון, חוגים, ביגוד','روضة، دوام بعد الظهر، نشاطات، ملابس','Kindergarten, after-school, clubs, clothes'],
  kc_s3:['גיל 6–18, בחודש','عمر 6–18، شهريًا','Age 6–18, per month'], kc_s3H:['בית ספר, חוגים, טלפון, דמי כיס','مدرسة، نشاطات، هاتف، مصروف','School, clubs, phone, pocket money'], kc_inf:['אינפלציה צפויה','التضخم المتوقع','Expected inflation'],
  kc_rest:['עוד צפוי מגיל {a} עד 18','المتوقع من عمر {a} حتى 18','Still to come from age {a} to 18'], kc_restS:['כולל עליית מחירים','شاملًا ارتفاع الأسعار','including price rises'], kc_tot:['סך הכול 0–18 (במחירי היום)','المجموع 0–18 (بأسعار اليوم)','Total 0–18 (today\'s prices)'], kc_avgY:['ממוצע לשנה','المتوسط السنوي','Average per year'], kc_avgM:['ממוצע לחודש','المتوسط الشهري','Average per month'],
  kc_b1:['0–3','0–3','0–3'], kc_b2:['3–6','3–6','3–6'], kc_b3:['6–18','6–18','6–18'], kc_note:['קצבת ילדים והחיסכון לכל ילד מקזזים חלק מההוצאה.','مخصصات الأطفال والتوفير لكل طفل يعوّضان جزءًا من النفقة.','Child allowance and the savings-per-child plan offset part of the cost.'], kc_save:['לחיסכון לכל ילד','للتوفير لكل طفل','To savings per child'],
  tab_daycare:['מעון וצהרון','حضانة ودوام بعد الظهر','Daycare & after-school'], d_daycare:['השוואה בין עד שלוש מסגרות – עלות שנתית אחרי סבסוד, ולשעה.','مقارنة حتى ثلاثة أطر – التكلفة السنوية بعد الدعم، وللساعة.','Compare up to three options – yearly cost after subsidy, and per hour.'],
  dc_intro:['הזינו את המחיר החודשי של כל מסגרת. אם מגיע לכם סבסוד מהמדינה – הזינו את הסכום החודשי.','أدخلوا السعر الشهري لكل إطار. إن كان يحق لكم دعم حكومي – أدخلوا المبلغ الشهري.','Enter each option\'s monthly price. If you get a government subsidy, enter the monthly amount.'],
  dc_p1:['מסגרת 1 – מחיר חודשי','إطار 1 – سعر شهري','Option 1 – monthly price'], dc_p2:['מסגרת 2 – מחיר חודשי','إطار 2 – سعر شهري','Option 2 – monthly price'], dc_p3:['מסגרת 3 – מחיר חודשי','إطار 3 – سعر شهري','Option 3 – monthly price'], dc_h:['שעות ביום','ساعات يوميًا','Hours a day'], dc_hH:['להשוואת מחיר לשעה','لمقارنة السعر للساعة','To compare price per hour'], dc_x:['תוספות בחודש (ארוחות, חוגים)','إضافات شهرية (وجبات، نشاطات)','Extras per month (meals, clubs)'],
  dc_mo:['חודשי פעילות בשנה','أشهر النشاط سنويًا','Months a year'], dc_sub:['סבסוד בחודש','الدعم الشهري','Subsidy per month'], dc_subH:['אם יש – מה שאושר לכם','إن وجد – ما تمت الموافقة عليه','If any – what you were approved'], dc_none:['הזינו מחיר לפחות למסגרת אחת.','أدخلوا سعرًا لإطار واحد على الأقل.','Enter a price for at least one option.'],
  dc_best:['הכי זולה: מסגרת {n}','الأرخص: إطار {n}','Cheapest: option {n}'], dc_perY:['בשנה, אחרי סבסוד','سنويًا، بعد الدعم','a year, after subsidy'], dc_opt:['מסגרת {n}','إطار {n}','Option {n}'], dc_ph:['{x} לשעה','{x} للساعة','{x}/hour'],
  dc_note:['זכאות לסבסוד תלויה בהכנסה, בשעות עבודה ובסוג המסגרת (מעון מוכר).','استحقاق الدعم يعتمد على الدخل وساعات العمل ونوع الإطار (حضانة معترف بها).','Subsidy eligibility depends on income, working hours and the type of setting (a recognised daycare).'], dc_link:['בדיקת זכאות לסבסוד','فحص استحقاق الدعم','Check subsidy eligibility'],
  tab_kidevent:['בר מצווה או חתונה','بلوغ أو زفاف','Bar mitzvah or wedding'], d_kidevent:['כמה לחסוך כל חודש מהיום לאירוע גדול של ילד – בר/בת מצווה או חתונה.','كم تدخرون شهريًا من اليوم لمناسبة كبيرة لطفل – بلوغ أو زفاف.','How much to save each month for a child\'s big event – bar/bat mitzvah or a wedding.'],
  ke_intro:['ככל שמתחילים מוקדם, ההפרשה החודשית קטנה יותר.','كلما بدأتم مبكرًا، صغر الادخار الشهري.','The earlier you start, the smaller the monthly amount.'], ke_type:['סוג האירוע','نوع المناسبة','Event type'], ke_bm:['בר/בת מצווה','بلوغ (بار/بات متسفا)','Bar/bat mitzvah'], ke_wed:['חתונה של ילד','زفاف الابن/الابنة','Child\'s wedding'], ke_other:['אירוע אחר','مناسبة أخرى','Another event'],
  ke_yrs:['בעוד כמה שנים','بعد كم سنة','In how many years'], ke_cost:['עלות צפויה במחירי היום','التكلفة المتوقعة بأسعار اليوم','Expected cost in today\'s prices'], ke_costH:['כולל מה שאתם מתכננים לתת','شاملًا ما تخططون لتقديمه','Including what you plan to give'], ke_inf:['אינפלציה צפויה','التضخم المتوقع','Expected inflation'], ke_ret:['תשואה על החיסכון','العائد على الادخار','Return on savings'], ke_have:['כבר חסכתם','ادخرتم حتى الآن','Already saved'],
  ke_mo:['לחסוך כל חודש','ادخار شهري','Save each month'], ke_moS:['ל{n} בעוד {y} שנים','لـ{n} بعد {y} سنوات','for the {n} in {y} years'], ke_future:['עלות צפויה ביום האירוע','التكلفة المتوقعة يوم المناسبة','Expected cost on the day'], ke_haveF:['החיסכון הקיים יגדל ל־','المدخرات الحالية ستنمو إلى','Current savings grow to'], ke_need:['עוד צריך לצבור','ما زال يجب جمعه','Still to build up'],
  ke_note:['החיסכון לכל ילד מביטוח לאומי יכול לכסות חלק – הוא נפתח בגיל 18.','التوفير لكل طفل من التأمين الوطني قد يغطي جزءًا – يُفتح في سن 18.','The national savings-per-child plan can cover part – it opens at 18.'], ke_goal:['ליעד חיסכון','لهدف ادخار','To a savings goal'],
  tab_teen:['לומדים כסף','نتعلم المال','Learning about money'], d_teen:['שישה שיעורים קצרים לנוער: תלוש ראשון, ברוטו ונטו, חיסכון, אשראי, תקציב והונאות.','ستة دروس قصيرة للشباب: أول قسيمة راتب، الإجمالي والصافي، الادخار، الائتمان، الميزانية والاحتيال.','Six short lessons for teens: a first payslip, gross vs net, saving, credit, budgeting and scams.'],
  tn_intro:['כל שיעור לוקח דקה, ובסופו שאלה אחת. אפשר לעשות את זה יחד עם ההורים.','كل درس يستغرق دقيقة، وفي نهايته سؤال واحد. يمكن القيام بذلك مع الأهل.','Each lesson takes a minute and ends with one question. You can do it with your parents.'],
  tn_prog:['{n} מתוך {m} שיעורים','{n} من {m} دروس','{n} of {m} lessons'], tn_right:['נכון!','صحيح!','Right!'], tn_wrong:['לא בדיוק.','ليس تمامًا.','Not quite.'], tn_all:['סיימתם את כל השיעורים – כל הכבוד!','أنهيتم كل الدروس – أحسنتم!','You finished every lesson – well done!'],
  tn_slider:['מתחילים לחסוך 200 ₪ בחודש ל־{y} שנים','نبدأ بادخار 200 ₪ شهريًا لـ{y} سنة','Saving ₪200 a month for {y} years'], tn_earlyR:['מתחילים עכשיו: {a}. מתחילים 10 שנים אחר כך: {b}.','البدء الآن: {a}. البدء بعد 10 سنوات: {b}.','Start now: {a}. Start 10 years later: {b}.'],
  tn_slip:['התלוש הראשון','قسيمة الراتب الأولى','Your first payslip'], tn_slipB:['בתלוש רואים את השכר, את הניכויים (מס, ביטוח לאומי, פנסיה) ואת מה שנכנס לחשבון. כדאי לבדוק כל חודש שהשעות והתעריף נכונים.','في القسيمة ترون الراتب والخصومات (ضريبة، تأمين وطني، تقاعد) وما يدخل الحساب. يُستحسن فحص الساعات والأجر كل شهر.','A payslip shows your pay, the deductions (tax, national insurance, pension) and what reaches your account. Check the hours and rate every month.'],
  tn_slipQ:['מה עושים אם השעות בתלוש לא נכונות?','ماذا نفعل إن كانت الساعات في القسيمة خاطئة؟','What if the hours on the payslip are wrong?'], tn_slipA0:['לא אומרים כלום','لا نقول شيئًا','Say nothing'], tn_slipA1:['פונים למעסיק עם רישום השעות','نتوجه للمشغّل مع سجل الساعات','Ask the employer, with your hours record'], tn_slipA2:['מתפטרים','نستقيل','Quit'],
  tn_slipX:['שמרו רישום של השעות שלכם – זה הבסיס לכל בירור.','احتفظوا بسجل ساعاتكم – هذا أساس أي استيضاح.','Keep your own record of hours – it\'s the basis for any query.'],
  tn_net:['ברוטו ונטו','الإجمالي والصافي','Gross and net'], tn_netB:['ברוטו = השכר לפני ניכויים. נטו = מה שנכנס לחשבון בפועל. נער שמרוויח מעט בדרך כלל לא משלם מס הכנסה, אבל עדיין יש ניכויים קטנים.','الإجمالي = الراتب قبل الخصومات. الصافي = ما يدخل الحساب فعلًا. الشاب الذي يكسب قليلًا عادةً لا يدفع ضريبة دخل، لكن توجد خصومات صغيرة.','Gross = pay before deductions. Net = what actually reaches your account. A teen earning a little usually pays no income tax, but small deductions remain.'],
  tn_netQ:['מה גדול יותר?','أيهما أكبر؟','Which is bigger?'], tn_netA0:['ברוטו','الإجمالي','Gross'], tn_netA1:['נטו','الصافي','Net'], tn_netA2:['תמיד שווים','دائمًا متساويان','Always equal'], tn_netX:['הנטו הוא הברוטו פחות הניכויים.','الصافي هو الإجمالي ناقص الخصومات.','Net is gross minus deductions.'],
  tn_early:['למה לחסוך מוקדם','لماذا نبدأ الادخار مبكرًا','Why save early'], tn_earlyB:['בריבית דריבית הכסף מרוויח גם על הרווחים הקודמים. הזמן הוא הדבר הכי חשוב – הזיזו את הסליידר וראו.','في الفائدة المركبة يربح المال أيضًا على الأرباح السابقة. الوقت هو الأهم – حرّكوا المؤشر وانظروا.','With compound interest money also earns on earlier gains. Time matters most – move the slider and see.'],
  tn_earlyQ:['מה משפיע הכי הרבה על החיסכון לאורך זמן?','ما الأكثر تأثيرًا على الادخار مع الوقت؟','What matters most for savings over time?'], tn_earlyA0:['מזל','الحظ','Luck'], tn_earlyA1:['סכום גדול פעם אחת','مبلغ كبير مرة واحدة','One big amount'], tn_earlyA2:['להתחיל מוקדם ולהתמיד','البدء مبكرًا والمثابرة','Starting early and sticking with it'], tn_earlyX:['גם סכום קטן, לאורך הרבה שנים, הופך לגדול.','حتى المبلغ الصغير، عبر سنوات كثيرة، يصبح كبيرًا.','Even a small amount over many years becomes big.'],
  tn_debt:['כרטיס אשראי וחובות','بطاقة الائتمان والديون','Credit cards and debt'], tn_debtB:['כרטיס אשראי זה לא כסף נוסף – זה תשלום מאוחר. תשלומים ומינוס עולים ריבית, ולפעמים הרבה.','بطاقة الائتمان ليست مالًا إضافيًا – إنها دفع مؤجل. التقسيط والسحب الزائد يكلفان فائدة، وأحيانًا كثيرًا.','A credit card isn\'t extra money – it\'s paying later. Instalments and overdraft cost interest, sometimes a lot.'],
  tn_debtQ:['קנית ב־12 תשלומים "עם ריבית". מה זה אומר?','اشتريت بـ12 قسطًا "مع فائدة". ماذا يعني ذلك؟','You bought in 12 instalments "with interest". What does that mean?'], tn_debtA0:['שזה בחינם','أنه مجاني','It\'s free'], tn_debtA1:['שתשלמו יותר מהמחיר','أنكم ستدفعون أكثر من السعر','You\'ll pay more than the price'], tn_debtA2:['שתקבלו הנחה','أنكم ستحصلون على خصم','You get a discount'],
  tn_debtX:['תמיד בדקו כמה תשלמו בסך הכול.','افحصوا دائمًا كم ستدفعون إجمالًا.','Always check the total you\'ll pay.'],
  tn_bud:['תקציב פשוט','ميزانية بسيطة','A simple budget'], tn_budB:['שיטת 50/30/20: חצי לדברים הכרחיים, 30% למה שבא לכם, ו־20% לחיסכון. לא חייבים בדיוק – זה כיוון.','طريقة 50/30/20: نصف للضروريات، 30% لما تحبون، و20% للادخار. ليس بدقة – إنها اتجاه.','The 50/30/20 rule: half for needs, 30% for wants, 20% for savings. It\'s a guide, not exact.'],
  tn_budQ:['קיבלת 500 ₪. לפי 50/30/20, כמה לחיסכון?','حصلت على 500 ₪. حسب 50/30/20، كم للادخار؟','You got ₪500. By 50/30/20, how much to save?'], tn_budA0:['100 ₪','100 ₪','₪100'], tn_budA1:['250 ₪','250 ₪','₪250'], tn_budA2:['0 ₪','0 ₪','₪0'], tn_budX:['20% מ־500 זה 100 ₪.','20% من 500 هي 100 ₪.','20% of 500 is ₪100.'],
  tn_scam:['הונאות ופישינג','الاحتيال والتصيّد','Scams and phishing'], tn_scamB:['הודעה דחופה עם קישור, "זכית בפרס" או בקשה לקוד שקיבלת ב־SMS – כמעט תמיד הונאה. בנק או חברה אמיתיים לא יבקשו סיסמה או קוד.','رسالة عاجلة مع رابط، "ربحت جائزة" أو طلب رمز وصلك بالـSMS – غالبًا احتيال. البنك أو الشركة الحقيقية لن يطلبوا كلمة سر أو رمزًا.','An urgent message with a link, "you won a prize" or a request for an SMS code is almost always a scam. A real bank or company won\'t ask for a password or code.'],
  tn_scamQ:['קיבלת SMS: "החשבון שלך ייחסם, היכנס לקישור". מה עושים?','وصلتك رسالة: "سيُحظر حسابك، ادخل الرابط". ماذا نفعل؟','You got an SMS: "Your account will be blocked, tap the link". What do you do?'], tn_scamA0:['נכנסים מהר','ندخل بسرعة','Tap it quickly'], tn_scamA1:['שולחים את הקוד','نرسل الرمز','Send the code'], tn_scamA2:['לא לוחצים, ובודקים ישירות מול הבנק','لا نضغط، ونتحقق مباشرة مع البنك','Don\'t tap – check directly with the bank'],
  tn_scamX:['אם יש ספק – מתקשרים לבנק למספר הרשמי, לא למספר שבהודעה.','عند الشك – اتصلوا بالبنك على الرقم الرسمي، لا الرقم الذي في الرسالة.','If in doubt, call the bank\'s official number, not the one in the message.'],
});
