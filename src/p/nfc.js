/* 13.32: NFC in the smart scanner – read a tag (links, text, contacts, Wi-Fi notes) and write one; QR stays next door */
var NFX = {tab: 'read', ctl: null, busy: false, type: 'url', f: {}, last: null};
const nfE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nfOk = () => 'NDEFReader' in window;
const NF_TYPES = [['url', '🔗'], ['text', '📝'], ['phone', '📞'], ['email', '✉️'], ['contact', '👤']];
function nfStop(){ if (NFX.ctl){ try { NFX.ctl.abort(); } catch (e) {} NFX.ctl = null; } NFX.busy = false; }
function nfRender(root){
  const E = nfE;
  root.innerHTML = dsBar('📶 ' + t('nf_title')) + (nfOk() ? `<div class="seg qr-tabs" role="tablist">${['read', 'write'].map(k => `<button type="button" role="tab" aria-selected="${NFX.tab === k}" class="${NFX.tab === k ? 'on' : ''}" data-nftab="${k}">${E(t('nf_t_' + k))}</button>`).join('')}</div><div id="nf_body"></div>`
    : `<div class="ds-warn nf-no" role="note"><span aria-hidden="true">ℹ️</span><div><p><b>${E(t('nf_noTitle'))}</b></p><p>${E(t('nf_noWhy'))}</p><p>${E(t('nf_ios'))}</p></div></div><div class="btnrow"><button type="button" class="gold-btn" data-dstool="qr">▦ ${E(t('nf_useQr'))}</button></div>`);
  if (nfOk()) (NFX.tab === 'read' ? nfReadRender : nfWriteRender)();
}
function nfResults(){ return QRX.res.map((r, i) => [r, i]).filter(([r]) => r.fmt === 'nfc'); }
function nfReadRender(){
  const E = nfE, b = document.getElementById('nf_body'); if (!b) return;
  const L = nfResults();
  b.innerHTML = `<p class="fine">${E(t('nf_readHow'))}</p>
    <div class="nf-pad${NFX.busy ? ' on' : ''}" aria-live="polite"><div class="nf-ring" aria-hidden="true">📶</div><p id="nf_st">${E(t(NFX.busy ? 'nf_waiting' : 'nf_ready'))}</p></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="nf_go">${E(t(NFX.busy ? 'nf_stop' : 'nf_start'))}</button>${L.length ? `<button type="button" class="mv" id="nf_clr">🗑️ ${E(t('nf_clear'))}</button>` : ''}</div>
    ${NFX.last ? `<p class="fine nf-meta" dir="ltr">${NFX.last.sn ? 'ID ' + E(NFX.last.sn) + ' · ' : ''}${E(t('nf_recs', {n: NFX.last.n}))}</p>` : ''}
    <div class="qr-res">${L.map(([r, i]) => qrResHTML(r, i)).join('')}</div>
    <p class="fine">${E(t('nf_priv'))}</p>`;
}
function nfDecode(rec){
  const td = (enc) => { try { return new TextDecoder(enc || 'utf-8').decode(rec.data); } catch (e) { return ''; } };
  if (rec.recordType === 'url' || rec.recordType === 'absolute-url') return td();
  if (rec.recordType === 'text') return td(rec.encoding);
  if (rec.recordType === 'mime'){ const m = rec.mediaType || ''; if (/^text\/|json|vcard|x-vcard/i.test(m)) return td(); return '[' + m + ']'; }
  if (rec.recordType === 'smart-poster'){ try { return (rec.toRecords() || []).map(nfDecode).filter(Boolean).join('\n'); } catch (e) { return ''; } }
  if (rec.recordType === 'empty') return '';
  return rec.data ? td() : '';
}
async function nfRead(){
  if (NFX.busy){ nfStop(); nfReadRender(); return; }
  try {
    const r = new NDEFReader(); NFX.ctl = new AbortController(); NFX.busy = true; nfReadRender();
    await r.scan({signal: NFX.ctl.signal});
    r.onreadingerror = () => { const s = document.getElementById('nf_st'); if (s) s.textContent = t('nf_readErr'); };
    r.onreading = ev => {
      const recs = [...(ev.message && ev.message.records || [])], texts = recs.map(nfDecode).filter(x => x && x.trim());
      NFX.last = {sn: ev.serialNumber || '', n: recs.length};
      if (!texts.length) texts.push(t('nf_empty'));
      const n = qrAddRes(texts.map(x => ({text: x, fmt: 'nfc'})), 'NFC');
      try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
      if (!n) toast(t('nf_same'));
      nfReadRender();
    };
  } catch (e) { nfStop(); nfReadRender(); const s = document.getElementById('nf_st'); if (s) s.textContent = t(e && e.name === 'NotAllowedError' ? 'nf_denied' : 'nf_fail'); }
}
const NF_F = {url: [['url', 'url']], text: [['text', 'textarea']], phone: [['tel', 'tel']], email: [['to', 'email'], ['subj', 'text']], contact: [['first', 'text'], ['last', 'text'], ['tel', 'tel'], ['mail', 'email'], ['org', 'text']]};
function nfWriteRender(){
  const E = nfE, b = document.getElementById('nf_body'); if (!b) return;
  const fld = ([k, ty]) => { const id = 'nff_' + k, v = NFX.f[k] == null ? '' : NFX.f[k];
    return `<div class="field"><label for="${id}">${E(t('qr_f_' + k))}</label>${ty === 'textarea' ? `<textarea id="${id}" data-nff="${k}" rows="3" dir="auto" maxlength="600">${E(v)}</textarea>` : `<div class="control"><input id="${id}" data-nff="${k}" type="${ty}" dir="${ty === 'text' ? 'auto' : 'ltr'}" value="${E(v)}"></div>`}</div>`; };
  b.innerHTML = `<p class="fine">${E(t('nf_writeHow'))}</p>
    <div class="ds-chips qr-types" role="radiogroup" aria-label="${E(t('qr_type'))}">${NF_TYPES.map(([k, ic]) => `<button type="button" role="radio" class="ds-chip${NFX.type === k ? ' on' : ''}" aria-checked="${NFX.type === k}" data-nftype="${k}">${ic} ${E(t('qr_k_' + k))}</button>`).join('')}</div>
    <div class="qr-fields">${NF_F[NFX.type].map(fld).join('')}</div>
    <div class="nf-pad${NFX.busy ? ' on' : ''}" aria-live="polite"><div class="nf-ring" aria-hidden="true">✍️</div><p id="nf_st">${E(t(NFX.busy ? 'nf_wWaiting' : 'nf_wReady'))}</p></div>
    <div class="btnrow"><button type="button" class="gold-btn" id="nf_write">${E(t(NFX.busy ? 'nf_stop' : 'nf_write'))}</button></div>
    <p class="fine">${E(t('nf_wNote'))}</p>`;
}
function nfRecords(){
  const f = NFX.f, s = k => String(f[k] || '').trim();
  if (NFX.type === 'url'){ let u = s('url'); if (!u) return null; if (!/^[a-z]+:/i.test(u)) u = 'https://' + u; return [{recordType: 'url', data: u}]; }
  if (NFX.type === 'text'){ const x = s('text'); return x ? [{recordType: 'text', data: x, lang: lang}] : null; }
  if (NFX.type === 'phone'){ const x = s('tel').replace(/[^\d+]/g, ''); return x ? [{recordType: 'url', data: 'tel:' + x}] : null; }
  if (NFX.type === 'email'){ const x = s('to'); return x ? [{recordType: 'url', data: 'mailto:' + x + (s('subj') ? '?subject=' + encodeURIComponent(s('subj')) : '')}] : null; }
  if (NFX.type === 'contact'){ if (!s('first') && !s('last')) return null; const esc = v => v.replace(/([,;\\])/g, '\\$1');
    const vcf = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + esc(s('last')) + ';' + esc(s('first')), 'FN:' + esc((s('first') + ' ' + s('last')).trim()), s('tel') ? 'TEL:' + s('tel') : '', s('mail') ? 'EMAIL:' + s('mail') : '', s('org') ? 'ORG:' + esc(s('org')) : '', 'END:VCARD'].filter(Boolean).join('\r\n');
    return [{recordType: 'mime', mediaType: 'text/vcard', data: new TextEncoder().encode(vcf)}]; }
  return null;
}
async function nfWrite(){
  if (NFX.busy){ nfStop(); nfWriteRender(); return; }
  const recs = nfRecords(); if (!recs){ toast(t('nf_fill')); return; }
  try {
    const w = new NDEFReader(); NFX.ctl = new AbortController(); NFX.busy = true; nfWriteRender();
    await w.write({records: recs}, {signal: NFX.ctl.signal, overwrite: true});
    NFX.busy = false; NFX.ctl = null; nfWriteRender(); toast(t('nf_written')); try { navigator.vibrate && navigator.vibrate([40, 60, 40]); } catch (e) {}
  } catch (e) { const aborted = e && e.name === 'AbortError'; nfStop(); nfWriteRender(); if (!aborted){ const s = document.getElementById('nf_st'); if (s) s.textContent = t(e && e.name === 'NotAllowedError' ? 'nf_denied' : 'nf_wFail'); } }
}
/* the scanner: an NFC view, and an NFC button in its row of tools */
{ const dsrNf = dscRender; dscRender = function(){
  const root = document.getElementById('ds_root');
  if (root && DSX.view === 'nfc') return nfRender(root);
  nfStop();
  const r = dsrNf.apply(this, arguments);
  try { const row = root && root.querySelector('.ds-toolrow'); if (row && !row.querySelector('[data-dstool="nfc"]')) row.insertAdjacentHTML('beforeend', `<button type="button" class="ds-tool" data-dstool="nfc"><span aria-hidden="true">📶</span><b>${nfE(t('dst_nfc'))}</b><small>${nfE(t('dst_nfcH'))}</small></button>`); } catch (e) {}
  return r;
}; }
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('[data-dstool="nfc"]')){ DSX.view = 'nfc'; dscRender(); return; }
  if (!t0.closest('#ds_root') || DSX.view !== 'nfc') return;
  if ((b = t0.closest('[data-nftab]'))){ nfStop(); NFX.tab = b.dataset.nftab; dscRender(); return; }
  if (t0.closest('#nf_go')){ nfRead(); return; }
  if (t0.closest('#nf_clr')){ QRX.res = QRX.res.filter(r => r.fmt !== 'nfc'); NFX.last = null; nfReadRender(); return; }
  if ((b = t0.closest('[data-nftype]'))){ NFX.type = b.dataset.nftype; nfWriteRender(); return; }
  if (t0.closest('#nf_write')){ nfWrite(); }
});
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.nff != null) NFX.f[el.dataset.nff] = el.value; });
{ const actNf = activate; activate = function(id){ if (id !== 'docscan') nfStop(); return actNf.apply(this, arguments); }; }
document.addEventListener('visibilitychange', () => { if (document.hidden && NFX.busy){ nfStop(); try { if (DSX.view === 'nfc') dscRender(); } catch (e) {} } });
try { Object.assign(GS_SYN, {docscan: (GS_SYN.docscan || '') + ' nfc תג אן אף סי קריאת תג כתיבת תג nfc tag'}); } catch (e) {}
Object.assign(T, {
  dst_nfc:['NFC','NFC','NFC'], dst_nfcH:['קריאה וכתיבה של תגים','قراءة وكتابة الشارات','Read and write tags'],
  nf_title:['תגי NFC','شارات NFC','NFC tags'], nf_t_read:['קריאת תג','قراءة شارة','Read a tag'], nf_t_write:['כתיבה לתג','كتابة إلى شارة','Write a tag'],
  nf_noTitle:['הדפדפן הזה לא יכול לגשת ל־NFC','هذا المتصفح لا يمكنه الوصول إلى NFC','This browser can\'t use NFC'],
  nf_noWhy:['קריאה וכתיבה של תגי NFC מתוך אתר עובדות רק ב־Chrome באנדרואיד, עם NFC מופעל בהגדרות הטלפון.','قراءة وكتابة شارات NFC من موقع تعمل فقط في Chrome على أندرويد، مع تفعيل NFC في إعدادات الهاتف.','Reading and writing NFC tags from a website works only in Chrome on Android, with NFC turned on in the phone\'s settings.'],
  nf_ios:['באייפון: מקרבים את התג לחלק העליון של הטלפון, ואם יש בו קישור – האייפון מציע לפתוח אותו. לקודים מודפסים אפשר להשתמש בסורק ה־QR.','على آيفون: قرّبوا الشارة من أعلى الهاتف، وإذا كان فيها رابط يعرض آيفون فتحه. للرموز المطبوعة استخدموا ماسح QR.','On iPhone: hold the tag near the top of the phone – if it holds a link, the iPhone offers to open it. For printed codes, use the QR scanner.'],
  nf_useQr:['לסורק ה־QR','إلى ماسح QR','Open the QR scanner'],
  nf_readHow:['לוחצים "התחלת קריאה" ומקרבים את התג לגב הטלפון. אפשר לקרוא כמה תגים ברצף.','اضغطوا "بدء القراءة" وقرّبوا الشارة من ظهر الهاتف. يمكن قراءة عدة شارات متتالية.','Tap "Start reading" and hold the tag to the back of the phone. You can read several tags in a row.'],
  nf_ready:['מוכן לקריאה','جاهز للقراءة','Ready to read'], nf_waiting:['מחכה לתג… קרבו אותו לגב הטלפון','بانتظار الشارة… قرّبوها من ظهر الهاتف','Waiting for a tag… hold it to the back of the phone'],
  nf_start:['📶 התחלת קריאה','📶 بدء القراءة','📶 Start reading'], nf_stop:['עצירה','إيقاف','Stop'], nf_clear:['ניקוי','مسح','Clear'],
  nf_recs:['{n} רשומות בתג','{n} سجلات في الشارة','{n} records on the tag'], nf_empty:['התג ריק','الشارة فارغة','The tag is empty'], nf_same:['התג הזה כבר נקרא','تمت قراءة هذه الشارة','This tag was already read'],
  nf_readErr:['לא הצלחתי לקרוא את התג – נסו להחזיק אותו בלי לזוז','لم أتمكن من قراءة الشارة – حاولوا تثبيتها دون حركة','Couldn\'t read the tag – try holding it still'],
  nf_denied:['לא התקבלה הרשאה ל־NFC. אפשר לאשר בהגדרות האתר בדפדפן.','لم يُمنح إذن NFC. يمكن السماح به في إعدادات الموقع في المتصفح.','NFC permission was not granted. You can allow it in the browser\'s site settings.'],
  nf_fail:['לא ניתן להפעיל NFC. בדקו ש־NFC מופעל בהגדרות הטלפון.','تعذّر تشغيل NFC. تأكدوا أن NFC مفعّل في إعدادات الهاتف.','Couldn\'t start NFC. Check that NFC is on in the phone\'s settings.'],
  nf_priv:['התוכן של התג נשאר בטלפון ולא נשלח לשום מקום.','محتوى الشارة يبقى على الهاتف ولا يُرسل إلى أي مكان.','The tag\'s content stays on the phone and isn\'t sent anywhere.'],
  nf_writeHow:['בוחרים מה לכתוב, ממלאים, לוחצים "כתיבה לתג" ומקרבים תג NFC ריק או ניתן לכתיבה.','اختاروا ما تكتبونه، املؤوا، اضغطوا "كتابة إلى الشارة" وقرّبوا شارة NFC فارغة أو قابلة للكتابة.','Choose what to write, fill it in, tap "Write to tag" and hold a blank or writable NFC tag.'],
  nf_wReady:['מוכן לכתיבה','جاهز للكتابة','Ready to write'], nf_wWaiting:['קרבו את התג לגב הטלפון…','قرّبوا الشارة من ظهر الهاتف…','Hold the tag to the back of the phone…'], nf_write:['✍️ כתיבה לתג','✍️ كتابة إلى الشارة','✍️ Write to tag'],
  nf_written:['נכתב לתג ✓','تمت الكتابة إلى الشارة ✓','Written to the tag ✓'], nf_wFail:['הכתיבה נכשלה. ייתכן שהתג נעול או קטן מדי.','فشلت الكتابة. ربما الشارة مقفلة أو صغيرة جدًا.','Writing failed. The tag may be locked or too small.'], nf_fill:['מלאו קודם את הפרטים','املؤوا التفاصيل أولًا','Fill in the details first'],
  nf_wNote:['הכתיבה מחליפה את מה שהיה בתג. תגים נעולים לא ניתן לשנות. לרשתות Wi-Fi עדיף קוד QR.','الكتابة تستبدل ما كان في الشارة. الشارات المقفلة لا يمكن تغييرها. لشبكات Wi-Fi يُفضّل رمز QR.','Writing replaces what was on the tag. Locked tags can\'t be changed. For Wi-Fi networks a QR code works better.'],
});
