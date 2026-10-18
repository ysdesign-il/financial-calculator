/* ---------- 13.5: Tax Free — VAT refund on shopping abroad (and for tourists shopping in Israel) ----------
   Rules change from time to time: the minimums and rates here were checked in October 2026 and are shown as a guide,
   with a note to confirm in the shop. Nothing is sent anywhere; purchases are kept on this device. */
/* [country, flag, currency, VAT %, minimum per receipt (incl. VAT), language of the forms, group, typical fee % of the VAT, fixed fee per form, confirm-in-shop] */
const TF_C = [
  ['FR', '🇫🇷', 'EUR', 20, 100.01, 'fr', 'eu', 25, 0], ['IT', '🇮🇹', 'EUR', 22, 70.01, 'it', 'eu', 25, 0], ['ES', '🇪🇸', 'EUR', 21, 0, 'es', 'eu', 25, 0], ['DE', '🇩🇪', 'EUR', 19, 50.01, 'de', 'eu', 25, 0],
  ['GR', '🇬🇷', 'EUR', 24, 50, 'el', 'eu', 25, 0], ['NL', '🇳🇱', 'EUR', 21, 50, 'nl', 'eu', 25, 0], ['AT', '🇦🇹', 'EUR', 20, 75.01, 'de', 'eu', 25, 0], ['BE', '🇧🇪', 'EUR', 21, 125.01, 'fr', 'eu', 25, 0],
  ['PT', '🇵🇹', 'EUR', 23, 50, 'pt', 'eu', 25, 0, 1], ['CY', '🇨🇾', 'EUR', 19, 50, 'el', 'eu', 25, 0, 1], ['HR', '🇭🇷', 'EUR', 25, 100.01, 'hr', 'eu', 25, 0], ['CZ', '🇨🇿', 'CZK', 21, 2001, 'cs', 'eu', 25, 0],
  ['HU', '🇭🇺', 'HUF', 27, 70001, 'hu', 'eu', 25, 0, 1], ['PL', '🇵🇱', 'PLN', 23, 200, 'pl', 'eu', 25, 0], ['RO', '🇷🇴', 'RON', 21, 250, 'ro', 'eu', 25, 0, 1], ['BG', '🇧🇬', 'EUR', 20, 127.82, 'bg', 'eu', 25, 0, 1],
  ['SK', '🇸🇰', 'EUR', 23, 100.01, 'sk', 'eu', 25, 0], ['SI', '🇸🇮', 'EUR', 22, 50.01, 'sl', 'eu', 25, 0], ['DK', '🇩🇰', 'DKK', 25, 300.01, 'da', 'eu', 25, 0], ['SE', '🇸🇪', 'SEK', 25, 200, 'sv', 'eu', 25, 0],
  ['FI', '🇫🇮', 'EUR', 25.5, 40, 'fi', 'eu', 25, 0], ['EE', '🇪🇪', 'EUR', 24, 38.01, 'et', 'eu', 25, 0], ['LV', '🇱🇻', 'EUR', 21, 44, 'lv', 'eu', 25, 0], ['LT', '🇱🇹', 'EUR', 21, 55, 'lt', 'eu', 25, 0, 1],
  ['LU', '🇱🇺', 'EUR', 17, 74, 'fr', 'eu', 25, 0], ['MT', '🇲🇹', 'EUR', 18, 50, 'en', 'eu', 25, 0, 1], ['IE', '🇮🇪', 'EUR', 23, 0, 'en', 'eu', 25, 0, 1],
  ['CH', '🇨🇭', 'CHF', 8.1, 300, 'de', 'ot', 25, 0], ['NO', '🇳🇴', 'NOK', 25, 315, 'nb', 'ot', 25, 0], ['IS', '🇮🇸', 'ISK', 24, 12000, 'is', 'ot', 25, 0], ['TR', '🇹🇷', 'TRY', 20, 1000, 'tr', 'ot', 25, 0, 1],
  ['GE', '🇬🇪', 'GEL', 18, 200, 'ka', 'ot', 25, 0, 1], ['MA', '🇲🇦', 'MAD', 20, 2000, 'fr', 'ot', 25, 0, 1],
  ['AE', '🇦🇪', 'AED', 5, 250, 'ar', 'ae', 13, 4.8], ['JP', '🇯🇵', 'JPY', 10, 5000, 'ja', 'jp', 0, 0], ['KR', '🇰🇷', 'KRW', 10, 15000, 'ko', 'ot', 15, 0, 1], ['SG', '🇸🇬', 'SGD', 9, 100, 'en', 'ot', 20, 0],
  ['TH', '🇹🇭', 'THB', 7, 2000, 'th', 'th', 20, 0], ['AU', '🇦🇺', 'AUD', 10, 300, 'en', 'au', 0, 0],
  ['IL', '🇮🇱', 'ILS', 18, 186, 'he', 'il', 0, 27],
  ['GB', '🇬🇧', 'GBP', 20, -1, 'en', 'none', 0, 0], ['US', '🇺🇸', 'USD', 0, -1, 'en', 'none', 0, 0]
];
const TF_LANGS = ['en', 'he', 'ar', 'ru', 'fr', 'de', 'it', 'es', 'pt', 'nl', 'el', 'pl', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'da', 'sv', 'fi', 'nb', 'is', 'et', 'lv', 'lt', 'tr', 'ka', 'ja', 'ko', 'zh', 'th', 'hi', 'uk', 'am'];
const TF_FIELDS = ['name', 'nat', 'res', 'addr', 'city', 'zip', 'email', 'phone', 'pass', 'flight', 'dep'];
/* the form labels, ready in the languages tax-free forms usually come in (any other language is translated by the AI) */
const TF_LBL = {
  en: ['Full name (as in passport)', 'Nationality', 'Country of residence', 'Street address', 'City', 'Postal code', 'E-mail', 'Phone', 'Passport number', 'Flight number', 'Departure date'],
  fr: ['Nom complet (comme sur le passeport)', 'Nationalité', 'Pays de résidence', 'Adresse', 'Ville', 'Code postal', 'E-mail', 'Téléphone', 'Numéro de passeport', 'Numéro de vol', 'Date de départ'],
  de: ['Vollständiger Name (wie im Reisepass)', 'Staatsangehörigkeit', 'Wohnsitzland', 'Straße und Hausnummer', 'Stadt', 'Postleitzahl', 'E-Mail', 'Telefon', 'Reisepassnummer', 'Flugnummer', 'Abreisedatum'],
  it: ['Nome completo (come sul passaporto)', 'Nazionalità', 'Paese di residenza', 'Indirizzo', 'Città', 'CAP', 'E-mail', 'Telefono', 'Numero di passaporto', 'Numero di volo', 'Data di partenza'],
  es: ['Nombre completo (como en el pasaporte)', 'Nacionalidad', 'País de residencia', 'Dirección', 'Ciudad', 'Código postal', 'Correo electrónico', 'Teléfono', 'Número de pasaporte', 'Número de vuelo', 'Fecha de salida'],
  pt: ['Nome completo (como no passaporte)', 'Nacionalidade', 'País de residência', 'Morada', 'Cidade', 'Código postal', 'E-mail', 'Telefone', 'Número do passaporte', 'Número do voo', 'Data de partida'],
  nl: ['Volledige naam (zoals in paspoort)', 'Nationaliteit', 'Land van verblijf', 'Adres', 'Plaats', 'Postcode', 'E-mail', 'Telefoon', 'Paspoortnummer', 'Vluchtnummer', 'Vertrekdatum'],
  el: ['Ονοματεπώνυμο (όπως στο διαβατήριο)', 'Υπηκοότητα', 'Χώρα διαμονής', 'Διεύθυνση', 'Πόλη', 'Ταχυδρομικός κώδικας', 'E-mail', 'Τηλέφωνο', 'Αριθμός διαβατηρίου', 'Αριθμός πτήσης', 'Ημερομηνία αναχώρησης'],
  he: ['שם מלא (כמו בדרכון)', 'אזרחות', 'ארץ מגורים', 'כתובת', 'עיר', 'מיקוד', 'דוא״ל', 'טלפון', 'מספר דרכון', 'מספר טיסה', 'תאריך יציאה'],
  ar: ['الاسم الكامل (كما في الجواز)', 'الجنسية', 'بلد الإقامة', 'العنوان', 'المدينة', 'الرمز البريدي', 'البريد الإلكتروني', 'الهاتف', 'رقم الجواز', 'رقم الرحلة', 'تاريخ المغادرة'],
  ru: ['Полное имя (как в паспорте)', 'Гражданство', 'Страна проживания', 'Адрес', 'Город', 'Почтовый индекс', 'Эл. почта', 'Телефон', 'Номер паспорта', 'Номер рейса', 'Дата вылета']
};
var TFX = {tr: null, busy: false, big: false};
const tfE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function tfD(){ if (!SET.tf || typeof SET.tf !== 'object') SET.tf = {}; const d = SET.tf; if (!d.c) d.c = 'FR'; if (!Array.isArray(d.items)) d.items = []; if (!d.meth) d.meth = 'card'; if (d.form) delete d.form; return d; }
/* the personal details live in memory; a copy without the passport number is saved only if you tick "remember" */
function tfForm(){ if (!TFX.form){ const d = tfD(); TFX.form = d.keepForm && d.savedForm && typeof d.savedForm === 'object' ? Object.assign({}, d.savedForm) : {}; } return TFX.form; }
function tfKeepSave(){ const d = tfD(); if (d.keepForm){ const F = Object.assign({}, tfForm()); delete F.pass; d.savedForm = F; } else delete d.savedForm; saveSet(); }
const tfC = code => TF_C.find(c => c[0] === code) || TF_C[0];
const tfRegion = (code, l) => { try { return new Intl.DisplayNames([l || lang], {type: 'region'}).of(code) || code; } catch (e) { return code; } };
const tfLangN = (code, l) => { try { const n = new Intl.DisplayNames([l || lang], {type: 'language'}).of(code); return n ? n.charAt(0).toLocaleUpperCase(l || lang) + n.slice(1) : code; } catch (e) { return code; } };
const tfToIls = (x, c) => { try { if (c === 'ILS') return x; return RATES[c] && RATES.ILS ? x / RATES[c] * RATES.ILS : NaN; } catch (e) { return NaN; } };
const tfM = (x, c, d) => M(x, d == null ? 2 : d, c);
const tfN = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : 0; };

/* ---------- the calculation ---------- */
function tfCalc(){
  const d = tfD(), C = tfC(d.c), [code, , cur, vat0, min, , grp, feeDef, fixDef] = C, none = grp === 'none';
  const fee = d.fee === '' || d.fee == null ? (d.meth === 'store' ? 0 : feeDef) : tfN(d.fee), fix = d.fix === '' || d.fix == null ? (d.meth === 'store' ? 0 : fixDef) : tfN(d.fix);
  const rows = d.items.map(it => {
    const a = tfN(it.a), v = it.v === '' || it.v == null ? vat0 : tfN(it.v), vatIn = a * v / (100 + v);
    const ok = !none && a > 0 && (min <= 0 || a >= min - 1e-9);
    let net = 0;
    if (ok){
      if (grp === 'il'){ net = vatIn - fixDef; }                                              // Israel: ₪27 per document checked
      else net = vatIn * (1 - fee / 100) - fix;
    }
    return {it, a, v, vatIn, ok, net: Math.max(0, net), short: !ok && !none && a > 0 ? min - a : 0};
  });
  const spent = rows.reduce((s, r) => s + r.a, 0), vatAll = rows.reduce((s, r) => s + r.vatIn, 0), vatOk = rows.reduce((s, r) => s + (r.ok ? r.vatIn : 0), 0);
  let net = rows.reduce((s, r) => s + r.net, 0);
  if (grp === 'il' && net > 0){ if (d.meth === 'cash') net -= net * 0.01 * 1.18; else if (d.meth === 'transfer') net -= 47.5; net = Math.max(0, net); }
  const thLow = grp === 'th' && vatOk > 0 && rows.filter(r => r.ok).reduce((s, r) => s + r.a, 0) < 5000;
  return {C, code, cur, grp, none, min, rows, spent, vatAll, vatOk, net, fee, fix, pct: spent > 0 ? net / spent * 100 : 0, thLow};
}

/* ---------- the screen ---------- */
function tfRender(){
  const root = $('#tf_root'); if (!root) return;
  const d = tfD(), R = tfCalc(), C = R.C, [code, flag, cur, vat, min, flang, grp] = C, eng = typeof slEngine === 'function' && slEngine();
  const act = document.activeElement, keep = act && root.contains(act) ? act.getAttribute('data-tfk') : null, selS = keep && act.selectionStart;
  const sorted = TF_C.slice().sort((a, b) => a[0] === 'IL' ? 1 : b[0] === 'IL' ? -1 : tfRegion(a[0]).localeCompare(tfRegion(b[0]), lang));
  const meths = grp === 'il' ? ['cash', 'check', 'transfer'] : ['card', 'cash', 'store'];
  if (!meths.includes(d.meth)) d.meth = meths[0];
  const minTxt = min > 0 ? tfM(min, cur) : t('tf_noMin'), minIls = min > 0 && cur !== 'ILS' && isFinite(tfToIls(min, cur)) ? '≈ ' + M(tfToIls(min, cur), 0, 'ILS') : '';
  root.innerHTML = `
  <section class="tf-sec"><h3 class="ds-q">🌍 ${tfE(t('tf_where'))}</h3>
    <div class="field cv-f"><label for="tf_c">${tfE(t('tf_country'))}</label><select id="tf_c" data-tfk="c">${sorted.map(c => `<option value="${c[0]}"${c[0] === code ? ' selected' : ''}>${c[1]} ${tfE(tfRegion(c[0]))}${c[0] === 'IL' ? ' – ' + tfE(t('tf_forTourists')) : ''}</option>`).join('')}</select></div>
    ${R.none ? `<div class="ds-warn" role="note"><span aria-hidden="true">ℹ️</span><p>${tfE(t('tf_n_' + code.toLowerCase()))}</p></div>` : `
    <div class="tf-facts"><div><small>${tfE(t('tf_vat'))}</small><b>${vat}%</b></div><div><small>${tfE(t('tf_min'))}</small><b><bdi>${tfE(minTxt)}</bdi></b>${minIls ? `<small><bdi>${tfE(minIls)}</bdi></small>` : ''}</div><div><small>${tfE(t('tf_inPrice'))}</small><b>${(vat / (100 + vat) * 100).toFixed(1)}%</b></div></div>
    <p class="fine">${tfE(t('tf_n_' + (['eu', 'ot'].includes(grp) ? grp : code.toLowerCase())))}${C[9] ? ' ' + tfE(t('tf_verify')) : ''}</p>`}
  </section>
  ${R.none ? '' : `
  <section class="tf-sec"><h3 class="ds-q">🛍️ ${tfE(t('tf_items'))}</h3>
    <div id="tf_items">${R.rows.map((r, i) => `<div class="lc-card tf-it${r.ok ? '' : ' tf-no'}">
      <div class="tf-ith"><input type="text" class="lc-name" maxlength="40" dir="auto" data-tfi="${i}" data-tff="s" data-tfk="s${i}" value="${tfE(r.it.s || '')}" placeholder="${tfE(t('tf_store'))}" aria-label="${tfE(t('tf_store'))}"><button type="button" class="lc-del" data-tfdel="${i}" aria-label="${tfE(t('cv_rm'))}">✕</button></div>
      <div class="fields fields3">
        <div class="field"><span class="lc-l">${tfE(t('tf_amount'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-tfi="${i}" data-tff="a" data-tfk="a${i}" value="${tfE(r.it.a == null ? '' : r.it.a)}" aria-label="${tfE(t('tf_amount'))}"><span class="u">${tfE(symOf(cur))}</span></div></div>
        <div class="field"><span class="lc-l">${tfE(t('tf_rate'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" data-tfi="${i}" data-tff="v" data-tfk="v${i}" value="${tfE(r.it.v == null ? '' : r.it.v)}" placeholder="${vat}" aria-label="${tfE(t('tf_rate'))}"><span class="u">%</span></div></div>
        <div class="field"><span class="lc-l">${tfE(t('tf_date'))}</span><div class="control"><input type="date" data-tfi="${i}" data-tff="d" data-tfk="d${i}" value="${tfE(r.it.d || '')}" aria-label="${tfE(t('tf_date'))}"></div></div>
      </div>
      <p class="fine tf-itr">${r.a > 0 ? (r.ok ? `✅ ${tfE(t('tf_itOk', {v: tfM(r.vatIn, cur), n: tfM(r.net, cur)}))}` : `⚠️ ${tfE(t('tf_itShort', {m: tfM(r.short, cur)}))}`) : tfE(t('tf_itEmpty'))}</p>
    </div>`).join('')}</div>
    <div class="btnrow"><button type="button" class="lc-add" id="tf_add"><span aria-hidden="true">＋</span> ${tfE(t('tf_add'))}</button></div>
    ${eng ? `<div class="btnrow ds-go"><button type="button" class="btn" id="tf_scan">📷 ${tfE(t('tf_scan'))}</button><input type="file" accept="image/*" capture="environment" id="tf_file" hidden></div>` : ''}
  </section>
  <section class="tf-sec"><h3 class="ds-q">💳 ${tfE(t('tf_how'))}</h3>
    <div class="ds-chips" role="radiogroup" aria-label="${tfE(t('tf_how'))}">${meths.map(m => `<button type="button" role="radio" class="ds-chip${m === d.meth ? ' on' : ''}" aria-checked="${m === d.meth}" data-tfm="${m}">${tfE(t('tf_m_' + m))}</button>`).join('')}</div>
    ${grp === 'il' ? `<p class="fine">${tfE(t('tf_ilFees'))}</p>` : `<div class="fields">
      <div class="field"><span class="lc-l">${tfE(t('tf_fee'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" id="tf_fee" data-tfk="fee" value="${tfE(d.fee == null ? '' : d.fee)}" placeholder="${R.fee}" aria-label="${tfE(t('tf_fee'))}"><span class="u">%</span></div></div>
      <div class="field"><span class="lc-l">${tfE(t('tf_fix'))}</span><div class="control"><input type="number" inputmode="decimal" step="any" id="tf_fix" data-tfk="fix" value="${tfE(d.fix == null ? '' : d.fix)}" placeholder="${R.fix}" aria-label="${tfE(t('tf_fix'))}"><span class="u">${tfE(symOf(cur))}</span></div></div></div>
      <p class="fine">${tfE(t('tf_feeH'))}</p>`}
  </section>
  <section class="tf-sec tf-res" aria-live="polite"><h3 class="ds-q">💰 ${tfE(t('tf_result'))}</h3>
    <div class="tf-big"><small>${tfE(t('tf_back'))}</small><b>${tfM(R.net, cur)}</b>${cur !== 'ILS' && isFinite(tfToIls(R.net, cur)) ? `<span>≈ ${M(tfToIls(R.net, cur), 0, 'ILS')}</span>` : ''}</div>
    <div class="tf-facts"><div><small>${tfE(t('tf_spent'))}</small><b>${tfM(R.spent, cur)}</b></div><div><small>${tfE(t('tf_vatAll'))}</small><b>${tfM(R.vatAll, cur)}</b></div><div><small>${tfE(t('tf_eff'))}</small><b>${R.pct.toFixed(1)}%</b></div></div>
    ${R.vatAll > R.vatOk + 0.005 ? `<p class="fine">⚠️ ${tfE(t('tf_lost', {v: tfM(R.vatAll - R.vatOk, cur)}))}</p>` : ''}
    ${R.thLow ? `<p class="fine">⚠️ ${tfE(t('tf_thTotal'))}</p>` : ''}
    <p class="fine">${tfE(t('tf_disc'))}</p>
  </section>
  <details class="tf-sec ds-det"${d.items.length ? '' : ' open'}><summary>📋 ${tfE(t('tf_steps'))}</summary><ol class="tf-steps">${tfSteps(grp).map(k => `<li>${tfE(t(k))}</li>`).join('')}</ol></details>
  ${tfFormHTML(d, C)}`}`;
  if (keep){ const el = root.querySelector(`[data-tfk="${keep}"]`); if (el){ el.focus(); try { if (selS != null && el.setSelectionRange) el.setSelectionRange(selS, selS); } catch (e) {} } }
}
function tfSteps(grp){
  if (grp === 'il') return ['tf_s_il1', 'tf_s_il2', 'tf_s_il3', 'tf_s_il4', 'tf_s_il5'];
  if (grp === 'eu') return ['tf_s_1', 'tf_s_2', 'tf_s_3', 'tf_s_eu4', 'tf_s_eu5', 'tf_s_6'];
  if (grp === 'au') return ['tf_s_au1', 'tf_s_au2', 'tf_s_au3'];
  if (grp === 'jp') return ['tf_s_1', 'tf_s_jp2', 'tf_s_jp3'];
  return ['tf_s_1', 'tf_s_2', 'tf_s_3', 'tf_s_ot4', 'tf_s_6'];
}

/* ---------- the form: type your details in your own language, get them ready in the language of the form ---------- */
function tfFormHTML(d, C){
  const F = tfForm(), tl = d.fl || C[5] || 'en', T = TFX.tr;
  return `<details class="tf-sec ds-det" id="tf_formd"${d.formOpen ? ' open' : ''}><summary>📝 ${tfE(t('tf_form'))}</summary>
    <p class="fine">${tfE(t('tf_formH'))}</p>
    <div class="ds-warn" role="note"><span aria-hidden="true">⚠️</span><p>${tfE(t('tf_formWarn'))}</p></div>
    <div class="fields tf-ff">${TF_FIELDS.map((k, i) => `<div class="field${k === 'addr' || k === 'name' ? ' wide' : ''}"><label for="tf_f_${k}">${tfE(t('tf_f_' + k))}</label><div class="control"><input id="tf_f_${k}" data-tfk="f_${k}" data-tfform="${k}" type="${k === 'email' ? 'email' : k === 'dep' ? 'date' : k === 'phone' ? 'tel' : 'text'}" dir="auto" maxlength="80" value="${tfE(F[k] || '')}"${k === 'pass' ? ' autocomplete="off"' : ''}></div></div>`).join('')}</div>
    <label class="tf-keep"><input type="checkbox" id="tf_keep"${d.keepForm ? ' checked' : ''}> ${tfE(t('tf_keep'))}</label>
    <div class="field cv-f"><label for="tf_fl">${tfE(t('tf_formLang'))}</label><select id="tf_fl">${TF_LANGS.map(c => `<option value="${c}"${c === tl ? ' selected' : ''}>${tfE(tfLangN(c, c))}</option>`).join('')}</select></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="tf_tr">🌐 ${tfE(t('tf_trGo'))}</button></div>
    <div class="sl-st" id="tf_st" aria-live="polite"></div>
    <div id="tf_out">${T ? tfOutHTML(T) : ''}</div>
  </details>`;
}
/* letters only, for the offline fallback: Hebrew, Arabic and Cyrillic in Latin letters (a first draft – the AI does it properly) */
const TF_TRL = {'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'ch', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ء': '',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'};
/* Hebrew has no written vowels: vav and yod in the middle of a word are read as o and i, bet/kaf/pe after the first letter as v/ch/f */
const tfHeb = w => { const L = w.split(''); return L.map((ch, i) => { const first = i === 0, last = i === L.length - 1, prev = L[i - 1];
  if (ch === 'ו') return first ? 'v' : (prev === 'ו' ? '' : (L[i + 1] === 'ו' ? 'v' : 'o'));
  if (ch === 'י') return first ? 'y' : (prev === 'י' ? '' : (last ? 'i' : 'i'));
  if (ch === 'ב') return first ? 'b' : 'v'; if (ch === 'כ') return first ? 'k' : 'ch'; if (ch === 'פ') return first ? 'p' : 'f';
  if (ch === 'א' || ch === 'ע') return 'a';
  if (ch === 'ה') return last ? 'a' : 'h';
  return TF_TRL[ch] != null ? TF_TRL[ch] : ch; }).join(''); };
const tfLatin = s => String(s || '').split(/(\s+)/).map(w => { const o = /[\u0590-\u05FF]/.test(w) ? tfHeb(w) : w.split('').map(ch => { const lo = ch.toLowerCase(); return TF_TRL[lo] != null ? TF_TRL[lo] : ch; }).join(''); return o.charAt(0).toUpperCase() + o.slice(1); }).join('');
/* a country typed in any language → its code, so its name can be given in the language of the form */
function tfCountryCode(s){
  const v = String(s || '').trim().toLowerCase(); if (!v) return '';
  const codes = 'IL US GB FR DE IT ES PT NL BE AT CH GR CY TR RU UA PL CZ HU RO BG HR SK SI DK SE NO FI IS EE LV LT LU MT IE CA AU NZ JP KR CN IN TH SG AE MA EG JO GE AR BR MX ZA ET'.split(' ');
  for (const c of codes) for (const l of [lang, 'he', 'ar', 'en', 'ru', 'fr']) { const n = tfRegion(c, l).toLowerCase(); if (n === v || (v.length > 3 && n.startsWith(v))) return c; }
  if (/^(ישראלי|ישראלית|israeli|إسرائيلي)$/.test(v)) return 'IL';
  return '';
}
function tfOffline(F, tl){
  const out = {};
  TF_FIELDS.forEach(k => { const v = String(F[k] || '').trim(); if (!v) return;
    if (k === 'nat' || k === 'res'){ const c = tfCountryCode(v); out[k] = c ? tfRegion(c, tl) + (tl !== 'en' ? ' / ' + tfRegion(c, 'en') : '') : tfLatin(v); }
    else if (k === 'dep'){ const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); out[k] = m ? m[3] + '/' + m[2] + '/' + m[1] : v; }
    else out[k] = /[^\x00-\x7F]/.test(v) && !['email', 'phone', 'pass', 'flight', 'zip'].includes(k) ? tfLatin(v) : v; });
  return {v: out, labels: TF_LBL[tl] || null, tl, ai: false};
}
async function tfTranslate(btn){
  const d = tfD(), C = tfC(d.c), tl = d.fl || C[5] || 'en', FF = tfForm(), F = {}; TF_FIELDS.forEach(k => { const v = String(FF[k] || '').trim(); if (v && k !== 'pass') F[k] = v; });
  const pass = String(FF.pass || '').trim();
  if (!Object.keys(F).length && !pass){ toast(t('tf_formEmpty')); return; }
  let res = tfOffline(FF, tl);
  if (typeof slEngine === 'function' && slEngine()){
    const old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ ' + t('tf_trWait');
    try {
      const j = await dsAsk(`Prepare a traveller's details for a tax-free (VAT refund) form in ${tfLangN(tl, 'en')} (${tl}).
For each field: names, street and city go in Latin letters exactly as an English passport would spell them (transliterate, do not translate personal names); countries and nationalities are given in ${tfLangN(tl, 'en')} followed by " / " and English (unless the form language is English); dates as DD/MM/YYYY; e-mail, phone and codes unchanged.
Also translate these field labels into ${tfLangN(tl, 'en')}: ${JSON.stringify(TF_LBL.en)}.
Details: ${JSON.stringify(F)}
Return ONLY JSON: {"values": {same keys as the details}, "labels": [11 labels in the same order]}`, [], 'default');
      if (j && j.values && typeof j.values === 'object'){ const v = {}; TF_FIELDS.forEach(k => { if (j.values[k] != null && String(j.values[k]).trim()) v[k] = String(j.values[k]).slice(0, 120); }); res = {v, labels: Array.isArray(j.labels) && j.labels.length === 11 ? j.labels.map(x => String(x).slice(0, 60)) : (TF_LBL[tl] || null), tl, ai: true}; }
    } catch (e) {}
    if (btn.isConnected){ btn.disabled = false; btn.textContent = old; }
  }
  if (pass) res.v.pass = pass;                                        // the passport number is never sent to the AI
  TFX.tr = res; const o = $('#tf_out'); if (o){ o.innerHTML = tfOutHTML(res); o.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
}
function tfOutHTML(T){
  const L = T.labels || TF_LBL.en, dir = ['he', 'ar'].includes(T.tl) ? 'rtl' : 'ltr';
  const rows = TF_FIELDS.map((k, i) => T.v[k] ? `<div class="tf-or"><small lang="${T.tl}" dir="${dir}">${tfE(L[i])}${T.tl !== 'en' ? ` · <span lang="en" dir="ltr">${tfE(TF_LBL.en[i])}</span>` : ''}</small><b dir="ltr">${tfE(T.v[k])}</b><button type="button" class="lg-a" data-tfcp="${k}">${tfE(t('ds_copy'))}</button></div>` : '').join('');
  return `<div class="mx-card tf-out"><h4>${tfE(t('tf_ready', {l: tfLangN(T.tl)}))}</h4>${rows}
    ${T.ai ? '' : `<p class="fine">${tfE(t('tf_offline'))}</p>`}<p class="fine">${tfE(t('tf_checkPass'))}</p>
    <div class="btnrow"><button type="button" class="btn" id="tf_cpall">📋 ${tfE(t('tf_cpAll'))}</button><button type="button" class="gold-btn" id="tf_show">🔍 ${tfE(t('tf_show'))}</button></div></div>`;
}
const tfOutText = () => { const T = TFX.tr; if (!T) return ''; const L = T.labels || TF_LBL.en; return TF_FIELDS.map((k, i) => T.v[k] ? `${L[i]}: ${T.v[k]}` : '').filter(Boolean).join('\n'); };
/* a big, clear view to hand the phone to the shop assistant */
function tfShowBig(){
  const T = TFX.tr; if (!T) return; const L = T.labels || TF_LBL.en, C = tfC(tfD().c);
  let o = $('#tfx'); if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="tfx" hidden><div class="cp-box tf-bigbox" role="dialog" aria-modal="true" aria-labelledby="tfx_t"><div class="cp-top"><h3 id="tfx_t"></h3><button type="button" class="cp-x" id="tfx_x">×</button></div><div id="tfx_b"></div></div></div>`); o = $('#tfx'); }
  $('#tfx_t').textContent = 'Tax Free · ' + tfRegion(C[0], T.tl); $('#tfx_x').setAttribute('aria-label', t('cp_close'));
  $('#tfx_b').innerHTML = TF_FIELDS.map((k, i) => T.v[k] ? `<div class="tf-bg"><small lang="${T.tl}">${tfE(L[i])}</small><b dir="ltr">${tfE(T.v[k])}</b></div>` : '').join('');
  o.hidden = false; document.body.classList.add('cp-lock');
}

/* ---------- reading a receipt or tax-free form from a photo ---------- */
const TF_ASK = () => `This image is a shop receipt or a tax-free (VAT refund) form from a purchase. Return ONLY JSON: {"store": the shop name (short), "date": "YYYY-MM-DD" or "", "total": the total paid including VAT as a number, "currency": ISO 4217 code, "country": ISO 3166-1 alpha-2 code of the shop's country if you can tell, else "", "vatRate": the VAT rate in % if shown, else null}. Numbers only. Do NOT return card numbers, names or any personal detail.`;
function tfFromScan(j){
  if (!j || typeof j !== 'object') throw new Error('fmt');
  const d = tfD(), total = tfN(j.total); if (!(total > 0)) throw new Error('fmt');
  const byC = TF_C.find(c => c[0] === String(j.country || '').toUpperCase()), byCur = TF_C.find(c => c[2] === String(j.currency || '').toUpperCase());
  if (!d.items.length && (byC || byCur)) d.c = (byC || byCur)[0];
  const cur = tfC(d.c)[2], rc = String(j.currency || '').toUpperCase();
  let a = total; if (rc && rc !== cur && RATES[rc] && RATES[cur]) a = Math.round(total / RATES[rc] * RATES[cur] * 100) / 100;
  d.items.push({s: String(j.store || '').slice(0, 40), d: /^\d{4}-\d{2}-\d{2}$/.test(j.date || '') ? j.date : '', a, v: j.vatRate == null || j.vatRate === '' ? '' : tfN(j.vatRate)});
  saveSet(); if (tab === 'taxfree') tfRender();
}

/* ---------- events ---------- */
var TFT = null;
const tfLater = () => { clearTimeout(TFT); TFT = setTimeout(() => { try { saveSet(); } catch (e) {} tfRender(); }, 350); };
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#tf_root')) return; const d = tfD();
  if (el.dataset.tfi != null){ const it = d.items[+el.dataset.tfi]; if (!it) return; const f = el.dataset.tff; it[f] = f === 's' || f === 'd' ? el.value.slice(0, 40) : el.value; if (f !== 's') tfLater(); else { clearTimeout(TFT); TFT = setTimeout(() => { try { saveSet(); } catch (er) {} }, 400); } return; }
  if (el.id === 'tf_fee' || el.id === 'tf_fix'){ d[el.id === 'tf_fee' ? 'fee' : 'fix'] = el.value; tfLater(); return; }
  if (el.dataset.tfform){ tfForm()[el.dataset.tfform] = el.value.slice(0, 80); TFX.tr = null; if (d.keepForm){ clearTimeout(TFT); TFT = setTimeout(() => { try { tfKeepSave(); } catch (er) {} }, 400); } return; }
}, true);
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#tf_root')) return; const d = tfD();
  if (el.id === 'tf_c'){ d.c = el.value; d.fee = ''; d.fix = ''; d.fl = ''; TFX.tr = null; saveSet(); tfRender(); return; }
  if (el.id === 'tf_fl'){ d.fl = el.value; TFX.tr = null; saveSet(); const o = $('#tf_out'); if (o) o.innerHTML = ''; return; }
  if (el.id === 'tf_keep'){ d.keepForm = el.checked; tfKeepSave(); return; }
  if (el.id === 'tf_file'){ tfScanFile(el.files && el.files[0]); el.value = ''; return; }
  if (el.dataset.tff === 'd'){ saveSet(); return; }
});
async function tfScanFile(f){
  if (!f || TFX.busy) return; const st = $('#tf_st'); TFX.busy = true; toast(t('ph_reading'));
  try { const j = await dsAsk(TF_ASK(), [await phShrink(f)]); TFX.busy = false; tfFromScan(j); toast(t('tf_scanned')); }
  catch (er){ TFX.busy = false; toast(t(er && er.code === 'not_granted' ? 'ph_denied' : 'ph_fail')); }
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#tfx_x') || t0.id === 'tfx'){ const o = $('#tfx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } return; }
  if (!t0.closest('#tf_root')) return; const d = tfD();
  if (t0.closest('#tf_add')){ d.items.push({s: '', a: '', v: '', d: (x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'))(new Date())}); saveSet(); tfRender(); const n = $$('#tf_root [data-tff="a"]').pop(); if (n){ n.focus(); n.scrollIntoView({block: 'center'}); } return; }
  if ((b = t0.closest('[data-tfdel]'))){ d.items.splice(+b.dataset.tfdel, 1); saveSet(); tfRender(); return; }
  if ((b = t0.closest('[data-tfm]'))){ d.meth = b.dataset.tfm; d.fee = ''; d.fix = ''; saveSet(); tfRender(); return; }
  if (t0.closest('#tf_scan')){ if ((SET.photoAccess || 'ask') === 'never'){ toast(t('pha_blocked')); return; } const i = $('#tf_file'); if (i) i.click(); return; }
  if ((b = t0.closest('#tf_tr'))){ tfTranslate(b); return; }
  if ((b = t0.closest('[data-tfcp]'))){ const T = TFX.tr; if (T && T.v[b.dataset.tfcp]){ copyText(T.v[b.dataset.tfcp]); toast(t('st_copied')); } return; }
  if (t0.closest('#tf_cpall')){ copyText(tfOutText()); toast(t('st_copied')); return; }
  if (t0.closest('#tf_show')){ tfShowBig(); return; }
});
document.addEventListener('toggle', e => { if (e.target && e.target.id === 'tf_formd'){ tfD().formOpen = e.target.open; } }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#tfx') && !$('#tfx').hidden){ $('#tfx').hidden = true; document.body.classList.remove('cp-lock'); } });
CALC.taxfree = () => null;
try { GS_SYN.taxfree = 'טקס פרי tax free החזר מע"מ מעמ קניות בחו"ל תייר נתב"ג VAT refund tourist duty استرداد ضريبة القيمة المضافة تاكس فري'; } catch (e) {}
if (typeof svKind === 'function'){ const svKindTf = svKind; svKind = function(id){ return id === 'taxfree' ? '' : svKindTf.apply(this, arguments); }; }
try { if (Array.isArray(DASH_SKIP)) DASH_SKIP.push('taxfree'); if (Array.isArray(EX_SKIP)) EX_SKIP.push('taxfree'); } catch (e) {}
{
  const actTf = activate; activate = function(id){ const r = actTf.apply(this, arguments); if (id === 'taxfree') tfRender(); return r; };
  const alTf = applyLang; applyLang = function(){ const r = alTf.apply(this, arguments); try { if (tab === 'taxfree') tfRender(); } catch (e) {} return r; };
  try { if (tab === 'taxfree') tfRender(); } catch (e) {}
}
