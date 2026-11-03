/* ---------- 13.67: the mortgage calculator made clearer – three steps (the apartment · the income · the tracks), each track
   as its own card with its kind as buttons and its own monthly payment, a live check that the tracks add up to 100%,
   the expected CPI only when a track is linked to it, and the result first (two numbers and one sentence) with the
   full breakdown folded. Every field and every calculation stays as it was. ---------- */
Object.assign(T, {
  mu_s1:['הדירה','الشقة','The apartment'],
  mu_s2:['ההכנסה','الدخل','The income'],
  mu_s2h:['כדי לבדוק כמה מההכנסה הולך להחזר','لمعرفة كم من الدخل يذهب للقسط','To see how much of the income goes to the payment'],
  mu_s3:['המסלולים','المسارات','The tracks'],
  mu_s3h:['משכנתא היא בדרך כלל שילוב של כמה מסלולים. כאן יש עד שלושה.','الرهن عادة مزيج من عدة مسارات. هنا حتى ثلاثة.','A mortgage is usually a mix of several tracks. Up to three here.'],
  mu_kFix:['קבועה','ثابتة','Fixed'], mu_kCpi:['צמודה','مرتبطة','Linked'], mu_kVar:['משתנה','متغيرة','Variable'],
  mu_ltv:['משכנתא של {l} · מימון {a} מתוך {b} המותרים','رهن بقيمة {l} · تمويل {a} من أصل {b} المسموح','A {l} mortgage · {a} financing of the {b} allowed'],
  mu_ltvOver:['משכנתא של {l} · מימון {a} – יותר מ-{b} המותרים','رهن بقيمة {l} · تمويل {a} – أكثر من {b} المسموح','A {l} mortgage · {a} financing – more than the {b} allowed'],
  mu_pti:['ההחזר הראשון הוא {p} מההכנסה{x}','القسط الأول {p} من الدخل{x}','The first payment is {p} of the income{x}'],
  mu_ptiOk:[' – בתוך המקובל (עד 40%)',' – ضمن المقبول (حتى 40%)',' – within the usual range (up to 40%)'],
  mu_ptiHi:[' – גבוה; בנקים מגבילים לרוב עד 40%–50%',' – مرتفع؛ البنوك تحدّ عادة حتى 40%–50%',' – high; banks usually cap it at 40%–50%'],
  mu_tPay:['החזר: {p}','القسط: {p}','Payment: {p}'],
  mu_share:['החלוקה: {x} = {s}','التقسيم: {x} = {s}','The split: {x} = {s}'],
  mu_shareOk:['✓ בדיוק 100%','✓ بالضبط 100%','✓ exactly 100%'],
  mu_shareBad:['צריך שיגיע ל-100%','يجب أن يصل إلى 100%','should add up to 100%'],
  mu_tInt:['סך הריבית וההצמדה','إجمالي الفائدة والربط','Total interest and linkage'],
  mu_tTot:['סך הכול לתשלום','المجموع للدفع','Total to pay'],
  mu_say:['משכנתא של {l} ב-{n} מסלולים: ההחזר הראשון {p} בחודש. בסך הכול תחזירו {tot}, מתוכם {i} ריבית והצמדה.','رهن بقيمة {l} في {n} مسارات: القسط الأول {p} شهريًا. ستعيدون إجمالًا {tot}، منها {i} فائدة وربط.','A {l} mortgage in {n} tracks: the first payment is {p} a month. You will repay {tot} in all, of which {i} is interest and linkage.'],
  mu_say1:['משכנתא של {l} במסלול אחד: ההחזר הראשון {p} בחודש. בסך הכול תחזירו {tot}, מתוכם {i} ריבית והצמדה.','رهن بقيمة {l} في مسار واحد: القسط الأول {p} شهريًا. ستعيدون إجمالًا {tot}، منها {i} فائدة وربط.','A {l} mortgage in one track: the first payment is {p} a month. You will repay {tot} in all, of which {i} is interest and linkage.'],
  mu_hLed:['פירוט מלא','التفاصيل الكاملة','Full breakdown']
});
(function(){
  const st = document.createElement('style');
  st.textContent = `
#panel-mortgage .mu-step{grid-column:1/-1;display:flex;align-items:center;gap:10px;margin:18px 0 0;padding-top:16px;border-top:1px solid var(--line)}
#panel-mortgage .fields > .mu-step:first-child{border-top:0;padding-top:0;margin-top:0}
#panel-mortgage .mu-step b{font-size:1.05rem;font-weight:700;color:var(--ink)}
#panel-mortgage .mu-step small{display:block;font-size:.8rem;color:var(--ink-2);margin-top:1px;line-height:1.5}
#panel-mortgage .mu-n{flex:0 0 auto;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--gold-ui,#F2C45A);color:#1a1405;font-weight:700;font-size:.86rem}
#panel-mortgage .mu-line{grid-column:1/-1;padding:12px 14px;border-radius:14px;border:1px solid var(--line);font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.5}
#panel-mortgage .mu-line.ok{border-color:color-mix(in srgb,var(--gold-ui) 55%,var(--line))}
#panel-mortgage .mu-line.bad{border-color:#F0705A;color:#F0705A}
#panel-mortgage .mu-line:empty{display:none}
#panel-mortgage .mu-track{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:16px;border-radius:18px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 94%,var(--ink) 6%)}
#panel-mortgage .mu-track > .sub-h{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0}
#panel-mortgage .mu-track .mu-tp{font-size:.86rem;font-weight:600;color:var(--gold-ui);font-variant-numeric:tabular-nums}
#panel-mortgage .mu-track .field:has(select),#panel-mortgage .mu-track .field.mu-kind{grid-column:1/-1}
#panel-mortgage .mu-track .fi{display:none}
#panel-mortgage .mu-track .field:has(input[id^="m_y"]) .u{display:none}
#panel-mortgage .mu-track .field{min-width:0}
#panel-mortgage .mu-track .lu-seg button{min-width:0}
#panel-mortgage .mu-track.off{opacity:.55}
#mu-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
#mu-sum .mu-t{padding:12px 14px;border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:0}
#mu-sum .mu-t span{font-size:.82rem;color:var(--ink-2)}
#mu-sum .mu-t b{font-size:1.15rem;font-variant-numeric:tabular-nums;color:var(--ink)}
#mu-sum p{grid-column:1/-1;margin:2px 0 0;line-height:1.65;color:var(--ink)}
#panel-mortgage #hero-mortgage .hero-sub{display:none}
#panel-mortgage .mu-tog{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin:10px 0 0;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;text-align:start}
#panel-mortgage .mu-tog::after{content:"▾";margin-inline-start:auto;color:var(--ink-2);transition:transform .2s}
#panel-mortgage .mu-tog[aria-expanded="true"]::after{transform:rotate(180deg)}
#panel-mortgage.mu-c-led #led-mortgage{display:none!important}
@media (min-width:1180px){#panel-mortgage.panel:not(.panel-flat){grid-template-areas:"svbar svbar" "inputs hero" "inputs sum" "inputs detail";grid-template-rows:auto auto auto 1fr}
  #panel-mortgage > .svbar{grid-area:svbar}#panel-mortgage > #mu-sum{grid-area:sum;margin-top:14px}}
@media (max-width:380px){#mu-sum{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();
const muP = x => { const r = Math.round(x * 10) / 10; return N(r, r % 1 ? 1 : 0) + '%'; };
const muB = x => muE(x).replace(/-?[\d.,]+%/g, m => '<bdi>' + m + '</bdi>');
const muE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let MU_OPEN = false;
function muSetup(){
  const p = document.getElementById('panel-mortgage'), box = p && p.querySelector(':scope > .inputs > .fields');
  if (!box || box.dataset.mu) return;
  const fb = id => { const f = document.getElementById(id); return f && f.closest('.field'); };
  if (!fb('m_price') || !fb('m_s1')) return;
  box.dataset.mu = '1';
  const step = (n, k, h) => { const d = document.createElement('div'); d.className = 'mu-step';
    d.innerHTML = `<span class="mu-n" aria-hidden="true">${n}</span><div><b data-i="${k}" role="heading" aria-level="3">${muE(t(k))}</b>${h ? `<small data-i="${h}">${muE(t(h))}</small>` : ''}</div>`; return d; };
  const line = id => { const d = document.createElement('div'); d.className = 'mu-line'; d.id = id; d.setAttribute('aria-live', 'polite'); return d; };
  const subs = [...box.querySelectorAll(':scope > .sub-h')];
  const known = new Set(['m_price', 'm_down', 'm_type', 'm_income', 'm_cpi', 's1', 'r1', 'y1', 'k1', 's2', 'r2', 'y2', 'k2', 's3', 'r3', 'y3', 'k3'].map(x => fb(x.startsWith('m_') ? x : 'm_' + x)).filter(Boolean).concat(subs));
  const rest = [...box.children].filter(c => !known.has(c));
  box.appendChild(step(1, 'mu_s1')); ['m_price', 'm_down', 'm_type'].map(fb).filter(Boolean).forEach(b => box.appendChild(b)); box.appendChild(line('mu-ltv'));
  box.appendChild(step(2, 'mu_s2', 'mu_s2h')); if (fb('m_income')) box.appendChild(fb('m_income')); box.appendChild(line('mu-pti'));
  box.appendChild(step(3, 'mu_s3', 'mu_s3h'));
  [1, 2, 3].forEach(i => {
    const card = document.createElement('div'); card.className = 'mu-track'; card.id = 'mu-tr' + i;
    const sh = subs[i - 1]; if (sh){ card.appendChild(sh); sh.insertAdjacentHTML('beforeend', `<span class="mu-tp" id="mu-tp${i}"></span>`); }
    ['m_s' + i, 'm_r' + i, 'm_y' + i, 'm_k' + i].map(fb).filter(Boolean).forEach(b => card.appendChild(b));
    const kb = fb('m_k' + i); if (kb) kb.classList.add('mu-kind');
    box.appendChild(card);
  });
  box.appendChild(line('mu-share'));
  if (fb('m_cpi')) box.appendChild(fb('m_cpi'));
  rest.forEach(c => box.appendChild(c));
  try { if (typeof luSeg === 'function') [1, 2, 3].forEach(i => luSeg('m_k' + i, [['fix', 'mu_kFix'], ['cpi', 'mu_kCpi'], ['var', 'mu_kVar']])); } catch (e) {}
}
function muSegSync(){
  document.querySelectorAll('#panel-mortgage [data-lus]').forEach(b => { const s = document.getElementById(b.dataset.lus); const on = !!s && s.value === b.dataset.v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#panel-mortgage [data-lus]')) setTimeout(muSegSync, 0); });
function muLive(res){
  const row = k => { const r = res && res.rows ? res.rows.find(x => x[0] === k) : null; return r ? String(strip(r[1])) : ''; };
  const num = x => parseFloat(String(x).replace(/[^\d.\-]/g, ''));
  /* step 1: the loan and how much of the price it finances */
  const price = Math.max(0, v('m_price')), down = Math.max(0, v('m_down')), loan = Math.max(0, price - down), ltv = price > 0 ? loan / price * 100 : 0;
  const lim = {first: 75, upg: 70, inv: 50}[($('#m_type') || {}).value] || 75;
  const L = document.getElementById('mu-ltv');
  if (L){ const over = ltv > lim + 1e-9; L.className = 'mu-line ' + (over ? 'bad' : 'ok'); L.innerHTML = muB(t(over ? 'mu_ltvOver' : 'mu_ltv', {l: M(loan), a: muP(ltv), b: lim + '%'})); }
  /* step 2: payment to income */
  const P = document.getElementById('mu-pti'), pti = num(row(t('r_pti')));
  if (P){ if (isFinite(pti) && v('m_income') > 0){ P.className = 'mu-line ' + (pti > 40 ? 'bad' : 'ok'); P.innerHTML = muB(t('mu_pti', {p: muP(pti), x: t(pti > 40 ? 'mu_ptiHi' : 'mu_ptiOk')})); } else { P.textContent = ''; } }
  /* step 3: each track's payment, and whether the shares add up */
  const shares = [1, 2, 3].map(i => Math.max(0, v('m_s' + i)));
  [1, 2, 3].forEach(i => {
    const tp = document.getElementById('mu-tp' + i), card = document.getElementById('mu-tr' + i);
    const pay = row(t('r_trackPay', {n: i}));
    if (tp) tp.textContent = shares[i - 1] > 0 && pay ? t('mu_tPay', {p: pay}) : '';
    if (card) card.classList.toggle('off', !(shares[i - 1] > 0));
  });
  const S = document.getElementById('mu-share'), sum = shares.reduce((a, b) => a + b, 0), okS = Math.abs(sum - 100) < 0.01;
  if (S){ S.className = 'mu-line ' + (okS ? 'ok' : 'bad'); S.innerHTML = muB(t('mu_share', {x: shares.map(x => N(x, x % 1 ? 1 : 0) + '%').join(' + '), s: N(sum, sum % 1 ? 1 : 0) + '%'}) + ' · ' + t(okS ? 'mu_shareOk' : 'mu_shareBad')); }
  /* the expected CPI matters only when a track is linked to it */
  const cb = (document.getElementById('m_cpi') || {closest: () => null}).closest('.field');
  if (cb) cb.hidden = ![1, 2, 3].some(i => shares[i - 1] > 0 && (($('#m_k' + i) || {}).value === 'cpi'));
}
function muSummary(res){
  const hero = document.getElementById('hero-mortgage'); if (!hero) return;
  let s = document.getElementById('mu-sum');
  if (!s){ hero.insertAdjacentHTML('afterend', '<section id="mu-sum" aria-live="polite"></section>'); s = document.getElementById('mu-sum'); }
  if (!res || !res.rows || !res.rows.length){ s.hidden = true; return; }
  const row = k => { const r = res.rows.find(x => x[0] === t(k)); return r ? String(strip(r[1])) : ''; };
  const loan = row('r_mLoan'), first = row('r_firstTotal'), tint = row('r_mTotInt'), tot = row('r_mTotPaid');
  const n = [1, 2, 3].filter(i => v('m_s' + i) > 0).length;
  if (!first){ s.hidden = true; return; }
  s.hidden = false;
  s.innerHTML = [['mu_tInt', tint], ['mu_tTot', tot]].filter(x => x[1]).map(([k, val]) => `<div class="mu-t"><span>${muE(t(k))}</span><b class="num">${muE(val)}</b></div>`).join('')
    + `<p>${muE(t(n === 1 ? 'mu_say1' : 'mu_say', {l: loan, n: N(n, 0), p: first, tot, i: tint}))}</p>`;
}
function muFold(){
  const p = document.getElementById('panel-mortgage'), led = document.getElementById('led-mortgage'); if (!p || !led) return;
  if (!p.querySelector('[data-mut]')) led.insertAdjacentHTML('beforebegin', `<button type="button" class="mu-tog" data-mut="1" aria-expanded="false" aria-controls="led-mortgage"><span data-i="mu_hLed">${muE(t('mu_hLed'))}</span></button>`);
  p.classList.toggle('mu-c-led', !MU_OPEN);
  const b = p.querySelector('[data-mut]'); if (b) b.setAttribute('aria-expanded', String(MU_OPEN));
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-mut]'); if (!b) return; MU_OPEN = !MU_OPEN; muFold(); });
const showMU = show;
show = function(id, res){
  showMU.apply(this, arguments);
  if (id !== 'mortgage') return;
  try { muSetup(); } catch (e) {}
  try { muLive(res); } catch (e) {}
  try { muSummary(res); } catch (e) {}
  try { muFold(); } catch (e) {}
  try { muSegSync(); } catch (e) {}
};
try { muSetup(); } catch (e) {}
