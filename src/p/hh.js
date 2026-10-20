/* ---------- 13.22: family – a budget shared by a couple (no server: an encrypted message with a code), and kids' pocket money ---------- */
const hhE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
var HHT = 'couple', HHX = {pkg: '', code: ''};
function hhD(){ const d = SET.hh && typeof SET.hh === 'object' ? SET.hh : (SET.hh = {}); if (!Array.isArray(d.kids)) d.kids = []; if (!Array.isArray(d.partner)) d.partner = []; return d; }
const hhM = x => M(Math.round(isFinite(x) ? x : 0), 0, 'ILS');
/* ---- the couple: send my expenses, receive the partner's ---- */
async function hhKey(code, salt){ return crypto.subtle.importKey('raw', await pbk(mvFmt(code).replace('-', ''), salt, 100000, 256), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function hhSeal(){
  const d = hhD(), from = ymAdd(ymOf(new Date()), -2), items = expData().items.filter(it => String(it.date).slice(0, 7) >= from).slice(-300).map(it => [it.date, Math.round(+it.amt * 100) / 100, it.cat, String(it.note || '').slice(0, 30), it.sh ? 1 : 0]);
  const code = mvNewCode(), salt = rnd(16), iv = rnd(12), key = await hhKey(code, salt);
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify({v: 1, n: String(d.me || '').slice(0, 20), at: Date.now(), inc: (expIncome(ymOf(new Date())) || {}).v || 0, i: items})));
  return {code: mvFmt(code), pkg: 'FINHH1:' + btoa(JSON.stringify({s: b64(salt), iv: b64(iv), ct: b64(ct)}))};
}
async function hhOpen(txt, code){
  const m = /FINHH1:([A-Za-z0-9+/=]+)/.exec(String(txt || '')); if (!m) throw new Error('fmt');
  const o = JSON.parse(atob(m[1])), key = await hhKey(code, u8(o.s)), pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: u8(o.iv)}, key, u8(o.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
function hhCouple(v){
  const E = hhE, d = hhD(), ym = ymOf(new Date()), mine = expTotals(ym).sum, part = d.partner.filter(x => String(x[0]).slice(0, 7) === ym).reduce((s, x) => s + +x[1], 0);
  const myInc = +((expIncome(ym) || {}).v || 0), pInc = +(d.pInc || 0), rule = d.rule || 'half', share = rule === 'inc' && myInc + pInc > 0 ? myInc / (myInc + pInc) : 0.5, tot = mine + part, myPart = tot * share, diff = mine - myPart;
  v.innerHTML = `<p class="fine">${E(t('hh_intro'))}</p><div class="bk-grid"><label class="bk-f"><span>${E(t('hh_me'))}</span><input type="text" maxlength="20" dir="auto" data-hhk="me" value="${E(d.me || '')}" placeholder="${E(t('hh_mePh'))}"></label>
    <label class="bk-f"><span>${E(t('hh_rule'))}</span><select data-hhk="rule"><option value="half"${rule === 'half' ? ' selected' : ''}>${E(t('hh_rHalf'))}</option><option value="inc"${rule === 'inc' ? ' selected' : ''}>${E(t('hh_rInc'))}</option></select></label></div>
    ${d.partner.length ? `<div class="bk-hero"><span>${E(t('hh_month', {m: ymLabel(ym)}))}</span><b dir="auto">${E(Math.abs(diff) < 1 ? t('hh_even') : diff > 0 ? t('hh_owesMe', {n: d.pName || t('hh_partner'), m: hhM(diff)}) : t('hh_iOwe', {n: d.pName || t('hh_partner'), m: hhM(-diff)}))}</b><small>${E(t('hh_sum', {a: hhM(mine), b: hhM(part), n: d.pName || t('hh_partner'), p: Math.round(share * 100)}))}</small></div>
      <p class="fine">${E(t('hh_got', {n: d.pName || t('hh_partner'), c: d.partner.length, d: d.pAt ? new Date(d.pAt).toLocaleDateString(locOf()) : ''}))}</p>` : ''}
    <h3 class="ds-q">📤 ${E(t('hh_send'))}</h3><p class="fine">${E(t('hh_sendH'))}</p><div class="btnrow"><button type="button" class="gold-btn" id="hh_mk">🔐 ${E(t('hh_mk'))}</button></div>
    ${HHX.pkg ? `<div class="hh-pkg"><p><b>${E(t('hh_code'))}: <span dir="ltr" class="hh-code">${E(HHX.code)}</span></b></p><p class="fine">${E(t('hh_codeH'))}</p><div id="hh_qr"></div>
      <div class="btnrow">${navigator.share ? `<button type="button" class="btn" id="hh_share">📤 ${E(t('ds_share'))}</button>` : ''}<button type="button" class="btn" id="hh_copy">📋 ${E(t('hh_copy'))}</button></div></div>` : ''}
    <h3 class="ds-q">📥 ${E(t('hh_recv'))}</h3><label class="bk-f"><span>${E(t('hh_paste'))}</span><textarea id="hh_in" rows="3" dir="ltr" spellcheck="false" placeholder="FINHH1:…"></textarea></label>
    <div class="bk-grid"><label class="bk-f"><span>${E(t('hh_code'))}</span><input type="text" id="hh_cin" dir="ltr" maxlength="9" autocapitalize="characters" placeholder="XXXX-XXXX"></label></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="hh_open">🔓 ${E(t('hh_openB'))}</button>${d.partner.length ? `<button type="button" class="mv" id="hh_forget">🗑️ ${E(t('hh_forget'))}</button>` : ''}</div><p class="fine" id="hh_msg" role="status" aria-live="polite"></p>
    <p class="fine sl-priv">🔒 ${E(t('hh_priv'))}</p>`;
  if (HHX.pkg && HHX.pkg.length < 1800 && typeof qrEncode === 'function'){ try { const c = qrCanvas(qrEncode(HHX.pkg, 'L'), {scale: 3}); c.setAttribute('role', 'img'); c.setAttribute('aria-label', t('hh_qrA')); $('#hh_qr').appendChild(c); } catch (e) {} }
}
/* ---- kids' pocket money ---- */
function hhKids(v){
  const E = hhE, d = hhD();
  v.innerHTML = `<p class="fine">${E(t('hh_kIntro'))}</p><ul class="rm-list">${d.kids.map((k, i) => { const pct = +k.goal ? Math.min(100, Math.max(0, (+k.bal || 0) / +k.goal * 100)) : 0;
    return `<li class="rm-it"><div class="rm-ic" aria-hidden="true">${pct >= 100 ? '🎉' : '🐷'}</div><div class="rm-b"><div class="bk-grid">
      <label class="bk-f"><span>${E(t('hh_kName'))}</span><input type="text" maxlength="20" dir="auto" data-hhkid="${i}" data-hhkk="name" value="${E(k.name || '')}"></label>
      <label class="bk-f"><span>${E(t('hh_kWeek'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-hhkid="${i}" data-hhkk="week" value="${E(k.week || '')}"></label>
      <label class="bk-f"><span>${E(t('hh_kGoalN'))}</span><input type="text" maxlength="30" dir="auto" data-hhkid="${i}" data-hhkk="goalN" value="${E(k.goalN || '')}" placeholder="${E(t('hh_kGoalPh'))}"></label>
      <label class="bk-f"><span>${E(t('hh_kGoal'))} (₪)</span><input type="text" inputmode="decimal" dir="ltr" data-hhkid="${i}" data-hhkk="goal" value="${E(k.goal || '')}"></label></div>
      <b class="hh-bal" dir="ltr">${E(hhM(+k.bal || 0))}</b><span class="in-prog"><i style="width:${pct.toFixed(0)}%"></i></span>
      <span class="rm-w">${E(+k.goal ? (pct >= 100 ? t('hh_kDone', {g: k.goalN || ''}) : t('hh_kLeft', {m: hhM(+k.goal - (+k.bal || 0)), w: +k.week > 0 ? Math.ceil((+k.goal - (+k.bal || 0)) / +k.week) : '—'})) : t('hh_kNoGoal'))}</span>
      <div class="rm-acts"><button type="button" class="mv" data-hhpay="${i}">💰 ${E(t('hh_kPay'))}</button><button type="button" class="mv" data-hhadd="${i}">＋ ${E(t('hh_kAdd'))}</button><button type="button" class="mv" data-hhspend="${i}">➖ ${E(t('hh_kSpend'))}</button><button type="button" class="px-tb s" data-hhdel="${i}" aria-label="${E(t('lp_del', {n: k.name || ''}))}">🗑️</button></div>
      ${(k.log || []).length ? `<small class="hh-log">${(k.log || []).slice(-4).reverse().map(l => E(l[0] + ' · ' + (l[1] >= 0 ? '+' : '−') + hhM(Math.abs(l[1])) + (l[2] ? ' · ' + l[2] : ''))).join('<br>')}</small>` : ''}</div></li>`; }).join('') || `<li class="fine bk-empty">${E(t('hh_kNone'))}</li>`}</ul>
    <div class="btnrow"><button type="button" class="gold-btn" id="hh_kNew">＋ ${E(t('hh_kNew'))}</button></div>
    <h3 class="ds-q">💡 ${E(t('hh_kTipsH'))}</h3><ol class="bk-adv">${[1, 2, 3].map(i => `<li class="bk-a"><span class="bk-ic">${['🎯', '🫙', '🛒'][i - 1]}</span><div><b>${E(t('hh_kt' + i))}</b><p>${E(t('hh_kt' + i + 'P'))}</p></div></li>`).join('')}</ol>`;
}
function hhRender(){
  const root = $('#hr_household'); if (!root) return; const E = hhE;
  root.innerHTML = `<div class="ds-chips bk-tabs" role="tablist">${[['couple', '💑'], ['kids', '🧒']].map(([k, ic]) => `<button type="button" role="tab" class="ds-chip${HHT === k ? ' on' : ''}" aria-selected="${HHT === k}" data-hhtab="${k}">${ic} ${E(t('hh_t_' + k))}</button>`).join('')}</div><div id="hh_view"></div>`;
  (HHT === 'couple' ? hhCouple : hhKids)($('#hh_view'));
}
function hhKidMove(i, sign){ const k = hhD().kids[i]; if (!k) return; const v = parseFloat(String(prompt(t(sign > 0 ? 'hh_kAddQ' : 'hh_kSpendQ')) || '').replace(/[^\d.]/g, '')); if (!(v > 0)) return; if (sign < 0 && v > (+k.bal || 0)){ toast(t('hh_kNoMoney')); return; } const note = sign < 0 ? String(prompt(t('hh_kWhat')) || '').slice(0, 30) : '';
  k.bal = Math.round(((+k.bal || 0) + sign * v) * 100) / 100; (k.log = k.log || []).push([new Date().toISOString().slice(0, 10), sign * v, note]); if (k.log.length > 60) k.log.shift(); saveSet(); hhRender(); }
document.addEventListener('click', async e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#hr_household')) return; const d = hhD(); let b;
  if ((b = t0.closest('[data-hhtab]'))){ HHT = b.dataset.hhtab; hhRender(); return; }
  if (t0.closest('#hh_mk')){ try { const r = await hhSeal(); HHX.pkg = r.pkg; HHX.code = r.code; hhRender(); } catch (er) { toast(t('m_nocrypto')); } return; }
  if (t0.closest('#hh_copy')){ copyText(HHX.pkg); toast(t('st_copied')); return; }
  if (t0.closest('#hh_share')){ try { await navigator.share({title: t('hh_shareT'), text: HHX.pkg}); } catch (er) {} return; }
  if (t0.closest('#hh_open')){ const msg = $('#hh_msg'); try { const o = await hhOpen($('#hh_in').value, $('#hh_cin').value); d.partner = (o.i || []).filter(x => Array.isArray(x) && x.length >= 3).slice(0, 400); d.pName = String(o.n || '').slice(0, 20); d.pInc = +o.inc || 0; d.pAt = o.at || Date.now(); saveSet(); hhRender(); toast(t('hh_ok', {n: d.partner.length})); } catch (er) { if (msg) msg.textContent = t(String(er && er.message) === 'fmt' ? 'hh_badPkg' : 'hh_badCode'); } return; }
  if (t0.closest('#hh_forget')){ d.partner = []; d.pName = ''; d.pInc = 0; saveSet(); hhRender(); return; }
  if (t0.closest('#hh_kNew')){ d.kids.push({name: '', week: 20, bal: 0, goal: '', goalN: '', log: []}); saveSet(); hhRender(); return; }
  if ((b = t0.closest('[data-hhpay]'))){ const k = d.kids[+b.dataset.hhpay]; if (k && +k.week > 0){ k.bal = (+k.bal || 0) + +k.week; (k.log = k.log || []).push([new Date().toISOString().slice(0, 10), +k.week, t('hh_kPay')]); saveSet(); hhRender(); } return; }
  if ((b = t0.closest('[data-hhadd]'))){ hhKidMove(+b.dataset.hhadd, 1); return; }
  if ((b = t0.closest('[data-hhspend]'))){ hhKidMove(+b.dataset.hhspend, -1); return; }
  if ((b = t0.closest('[data-hhdel]'))){ const k = d.kids[+b.dataset.hhdel]; if (k && confirm(t('rm_delQ', {t: k.name || t('hh_kName')}))){ d.kids.splice(+b.dataset.hhdel, 1); saveSet(); hhRender(); } }
});
let HH_T = null;
document.addEventListener('input', e => { const el = e.target; if (!el || !el.dataset || !el.closest || !el.closest('#hr_household')) return; const d = hhD();
  if (el.dataset.hhk && el.tagName !== 'SELECT') d[el.dataset.hhk] = el.value; else if (el.dataset.hhkid != null) d.kids[+el.dataset.hhkid][el.dataset.hhkk] = el.value; else return; clearTimeout(HH_T); HH_T = setTimeout(saveSet, 300); });
document.addEventListener('change', e => { const el = e.target; if (!el || !el.dataset || !el.closest || !el.closest('#hr_household')) return; if (el.dataset.hhk && el.tagName === 'SELECT'){ hhD()[el.dataset.hhk] = el.value; saveSet(); hhRender(); } else if (el.dataset.hhkid != null && /goal|week/.test(el.dataset.hhkk)){ saveSet(); const i = el.dataset.hhkid, k = el.dataset.hhkk; hhRender(); const n = $(`[data-hhkid="${i}"][data-hhkk="${k}"]`); if (n) n.focus(); } });
CALC.household = () => null;
try { GS_SYN.household = 'משפחה זוג תקציב משותף בן זוג בת זוג חלוקת הוצאות מי חייב דמי כיס ילדים חיסכון לילד family couple shared budget partner split pocket money kids عائلة زوجان ميزانية مشتركة مصروف الأطفال'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindHh = svKind; svKind = function(id){ return id === 'household' ? '' : svKindHh.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('household'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('household'); } catch (e) {}
{
  const actHh = activate; activate = function(id){ const r = actHh.apply(this, arguments); if (id === 'household') hhRender(); return r; };
  const alHh = applyLang; applyLang = function(){ const r = alHh.apply(this, arguments); try { if (tab === 'household') hhRender(); } catch (e) {} return r; };
  try { if (tab === 'household') hhRender(); } catch (e) {}
}
