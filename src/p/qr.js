/* ---------- 13.10: QR codes in the scanner – create and read, all on the phone ---------- */
var QRX = {tab: 'make', type: 'url', f: {}, ecl: 1, fg: '#000000', bg: '#ffffff', dots: false, margin: 4, cap: '', logo: null, res: [], cam: null, busy: false};
const qrE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const QR_TYPES = [['url', '🔗'], ['text', '📝'], ['wifi', '📶'], ['contact', '👤'], ['phone', '📞'], ['sms', '💬'], ['email', '✉️'], ['wa', '🟢'], ['geo', '📍'], ['event', '📅']];
/* the fields of each type: [key, input type, required] */
const QR_FIELDS = {
  url: [['url', 'url', 1]], text: [['text', 'textarea', 1]],
  wifi: [['ssid', 'text', 1], ['pass', 'text'], ['sec', 'sel:WPA,WEP,nopass'], ['hidden', 'check']],
  contact: [['first', 'text', 1], ['last', 'text'], ['tel', 'tel'], ['mail', 'email'], ['org', 'text'], ['title', 'text'], ['web', 'url'], ['addr', 'text'], ['note', 'textarea']],
  phone: [['tel', 'tel', 1]], sms: [['tel', 'tel', 1], ['msg', 'textarea']], email: [['to', 'email', 1], ['subj', 'text'], ['body', 'textarea']],
  wa: [['tel', 'tel', 1], ['msg', 'textarea']], geo: [['addr', 'text'], ['lat', 'text'], ['lng', 'text']],
  event: [['title', 'text', 1], ['start', 'datetime-local', 1], ['end', 'datetime-local'], ['place', 'text'], ['desc', 'textarea']]
};
const qrEsc = s => String(s || '').replace(/([\\;,:"])/g, '\\$1');
const qrIcsT = v => v ? v.replace(/[-:]/g, '').slice(0, 13) + '00' : '';
/* what goes inside the code */
function qrPayload(){
  const f = QRX.f, T = QRX.type, s = k => String(f[k] || '').trim();
  if (T === 'url'){ const u = s('url'); return !u ? '' : /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u; }
  if (T === 'text') return s('text');
  if (T === 'wifi') return s('ssid') ? `WIFI:T:${f.sec || 'WPA'};S:${qrEsc(s('ssid'))};${(f.sec || 'WPA') === 'nopass' ? '' : 'P:' + qrEsc(s('pass')) + ';'}${f.hidden ? 'H:true;' : ''};` : '';
  if (T === 'contact'){ if (!s('first') && !s('last')) return ''; const L = ['BEGIN:VCARD', 'VERSION:3.0', `N:${qrEsc(s('last'))};${qrEsc(s('first'))};;;`, `FN:${qrEsc((s('first') + ' ' + s('last')).trim())}`];
    if (s('org')) L.push('ORG:' + qrEsc(s('org'))); if (s('title')) L.push('TITLE:' + qrEsc(s('title'))); if (s('tel')) L.push('TEL;TYPE=CELL:' + s('tel')); if (s('mail')) L.push('EMAIL:' + s('mail'));
    if (s('web')) L.push('URL:' + s('web')); if (s('addr')) L.push('ADR:;;' + qrEsc(s('addr')) + ';;;;'); if (s('note')) L.push('NOTE:' + qrEsc(s('note'))); L.push('END:VCARD'); return L.join('\n'); }
  if (T === 'phone') return s('tel') ? 'tel:' + s('tel').replace(/[^\d+*#]/g, '') : '';
  if (T === 'sms') return s('tel') ? `SMSTO:${s('tel').replace(/[^\d+]/g, '')}:${s('msg')}` : '';
  if (T === 'email'){ if (!s('to')) return ''; const q = []; if (s('subj')) q.push('subject=' + encodeURIComponent(s('subj'))); if (s('body')) q.push('body=' + encodeURIComponent(s('body'))); return 'mailto:' + s('to') + (q.length ? '?' + q.join('&') : ''); }
  if (T === 'wa'){ let n = s('tel').replace(/\D/g, ''); if (!n) return ''; if (n.startsWith('0')) n = '972' + n.slice(1); return 'https://wa.me/' + n + (s('msg') ? '?text=' + encodeURIComponent(s('msg')) : ''); }
  if (T === 'geo'){ const la = parseFloat(s('lat')), ln = parseFloat(s('lng')); if (isFinite(la) && isFinite(ln)) return `geo:${la},${ln}`; return s('addr') ? 'https://maps.google.com/?q=' + encodeURIComponent(s('addr')) : ''; }
  if (T === 'event'){ if (!s('title') || !s('start')) return ''; const L = ['BEGIN:VEVENT', 'SUMMARY:' + qrEsc(s('title')), 'DTSTART:' + qrIcsT(s('start'))]; if (s('end')) L.push('DTEND:' + qrIcsT(s('end'))); if (s('place')) L.push('LOCATION:' + qrEsc(s('place'))); if (s('desc')) L.push('DESCRIPTION:' + qrEsc(s('desc'))); L.push('END:VEVENT'); return L.join('\n'); }
  return '';
}
function qrHex(c){ const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return [0, 0, 0]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function qrLum(c){ return qrHex(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); }
function qrBuild(scale){
  const txt = qrPayload(); if (!txt) return null;
  const q = qrEncode(txt, QRX.logo ? 3 : QRX.ecl, !QRX.logo); if (!q) return {err: 'big'};
  return {q, txt, c: qrCanvas(q, {scale: scale || 12, margin: +QRX.margin, fg: QRX.fg, bg: QRX.bg, dots: QRX.dots, caption: QRX.cap, logo: QRX.logo})};
}

/* ---------- screens ---------- */
function qrRender(root){
  const E = qrE;
  root.innerHTML = dsBar('▦ ' + t('qr_title')) + `<div class="seg qr-tabs" role="tablist">${['make', 'scan'].map(k => `<button type="button" role="tab" aria-selected="${QRX.tab === k}" class="${QRX.tab === k ? 'on' : ''}" data-qrt="${k}">${E(t('qr_t_' + k))}</button>`).join('')}</div><div id="qr_body"></div>`;
  QRX.tab === 'make' ? qrMakeRender() : qrScanRender();
}
function qrMakeRender(){
  const E = qrE, b = $('#qr_body'); if (!b) return;
  const fld = ([k, ty, req]) => {
    const id = 'qrf_' + k, v = QRX.f[k] == null ? '' : QRX.f[k], lab = `<label for="${id}">${E(t('qr_f_' + k))}${req ? ' *' : ''}</label>`;
    if (ty === 'check') return `<label class="prn-ck"><input type="checkbox" id="${id}" data-qrf="${k}"${v ? ' checked' : ''}> ${E(t('qr_f_' + k))}</label>`;
    if (ty.startsWith('sel:')) return `<div class="field cv-f">${lab}<select id="${id}" data-qrf="${k}">${ty.slice(4).split(',').map(o => `<option value="${o}"${(v || ty.slice(4).split(',')[0]) === o ? ' selected' : ''}>${E(t('qr_o_' + o))}</option>`).join('')}</select></div>`;
    if (ty === 'textarea') return `<div class="field">${lab}<textarea id="${id}" data-qrf="${k}" rows="3" dir="auto" maxlength="1500">${E(v)}</textarea></div>`;
    return `<div class="field">${lab}<div class="control"><input id="${id}" data-qrf="${k}" type="${ty}" dir="${ty === 'url' || ty === 'email' || ty === 'tel' ? 'ltr' : 'auto'}" value="${E(v)}"${ty === 'url' ? ' inputmode="url" placeholder="https://"' : ''}${ty === 'tel' ? ' inputmode="tel"' : ''} autocomplete="off"></div></div>`;
  };
  b.innerHTML = `<div class="ds-chips qr-types" role="radiogroup" aria-label="${E(t('qr_type'))}">${QR_TYPES.map(([k, ic]) => `<button type="button" role="radio" class="ds-chip${QRX.type === k ? ' on' : ''}" aria-checked="${QRX.type === k}" data-qrty="${k}">${ic} ${E(t('qr_y_' + k))}</button>`).join('')}</div>
    <div class="qr-fields">${QR_FIELDS[QRX.type].map(fld).join('')}${QRX.type === 'geo' ? `<div class="btnrow"><button type="button" class="mv" id="qr_here">📍 ${E(t('qr_here'))}</button></div>` : ''}${QRX.type === 'wifi' ? `<p class="fine">${E(t('qr_wifiH'))}</p>` : ''}</div>
    <div class="qr-out"><div class="qr-prev" id="qr_prev" aria-live="polite"></div><p class="fine" id="qr_info"></p></div>
    <details class="ds-det qr-adv"><summary>🎨 ${E(t('qr_design'))}</summary>
      <div class="field cv-f"><label for="qr_ecl">${E(t('qr_ecl'))}</label><select id="qr_ecl">${[0, 1, 2, 3].map(i => `<option value="${i}"${QRX.ecl === i ? ' selected' : ''}>${E(t('qr_ecl' + i))}</option>`).join('')}</select></div>
      <div class="qr-cols"><label>${E(t('qr_fg'))} <input type="color" id="qr_fg" value="${QRX.fg}"></label><label>${E(t('qr_bg'))} <input type="color" id="qr_bg" value="${QRX.bg}"></label></div>
      <label class="prn-ck"><input type="checkbox" id="qr_dots"${QRX.dots ? ' checked' : ''}> ${E(t('qr_dots'))}</label>
      <div class="field"><label for="qr_margin">${E(t('qr_margin'))}</label><input type="range" id="qr_margin" min="0" max="8" value="${QRX.margin}"></div>
      <div class="field"><label for="qr_cap">${E(t('qr_cap'))}</label><div class="control"><input id="qr_cap" type="text" maxlength="60" dir="auto" value="${E(QRX.cap)}" placeholder="${E(t('qr_capPh'))}"></div></div>
      <div class="btnrow"><button type="button" class="mv" id="qr_logo">🖼️ ${E(t(QRX.logo ? 'qr_logoX' : 'qr_logo'))}</button><input type="file" accept="image/*" id="qr_logoF" hidden></div><p class="fine">${E(t('qr_logoH'))}</p>
    </details>
    <div class="btnrow ds-out"><button type="button" class="gold-btn" id="qr_png">⬇️ PNG</button><button type="button" class="btn" id="qr_svg">⬇️ SVG</button>${navigator.share ? `<button type="button" class="btn" id="qr_share">📤 ${E(t('ds_share'))}</button>` : ''}<button type="button" class="btn" id="qr_print">🖨️ ${E(t('prn_btn'))}</button><button type="button" class="btn" id="qr_topdf">📝 ${E(t('qr_toPdf'))}</button></div>
    <p class="fine sl-priv">🔒 ${E(t('qr_privMake'))}</p>`;
  qrPreview();
}
function qrPreview(){
  const box = $('#qr_prev'), info = $('#qr_info'); if (!box) return;
  const r = qrBuild(8); box.innerHTML = '';
  if (!r){ box.innerHTML = `<div class="qr-empty">${qrE(t('qr_fill'))}</div>`; info.textContent = ''; return; }
  if (r.err){ box.innerHTML = `<div class="qr-empty bad">${qrE(t('qr_big'))}</div>`; info.textContent = ''; return; }
  r.c.setAttribute('role', 'img'); r.c.setAttribute('aria-label', t('qr_prevA', {s: r.txt.slice(0, 80)})); box.appendChild(r.c);
  const lb = qrLum(QRX.bg), lf = qrLum(QRX.fg), ratio = (Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05);
  info.textContent = t('qr_info', {v: r.q.version, e: 'LMQH'[r.q.ecl], n: new TextEncoder().encode(r.txt).length}) + (lf > lb ? ' · ⚠️ ' + t('qr_inv') : ratio < 4 ? ' · ⚠️ ' + t('qr_lowc') : '');
}
const qrName = ext => ('QR ' + t('qr_y_' + QRX.type) + ' ' + new Date().toISOString().slice(0, 10)).replace(/[\\/:*?"<>|]+/g, ' ') + '.' + ext;
async function qrOut(how){
  const r = qrBuild(how === 'png' || how === 'share' ? 24 : 12); if (!r || r.err){ toast(t(r ? 'qr_big' : 'qr_fill')); return; }
  if (how === 'svg'){ const res = await fileSave(new Blob([qrSvg(r.q, {margin: +QRX.margin, fg: QRX.fg, bg: QRX.bg})], {type: 'image/svg+xml'}), qrName('svg'), 'image/svg+xml'); toast(t(res === 'saved' ? 'ds_fileOk' : 'pdf_fail')); return; }
  const blob = await new Promise(res => r.c.toBlob(res, 'image/png'));
  if (how === 'share'){ const f = new File([blob], qrName('png'), {type: 'image/png'}); if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f]}); } catch (e) {} return; } }
  if (how === 'print'){ qrPrint(r.c); return; }
  if (how === 'pdf'){ if (typeof pxInsertImage === 'function') pxInsertImage(r.c, 'qr'); return; }
  const res = await fileSave(blob, qrName('png'), 'image/png'); toast(t(res === 'saved' ? 'ds_fileOk' : res === 'declined' ? 'pdf_declined' : 'pdf_fail'));
}
function qrPrint(c){
  try { prnClean(); } catch (e) {}
  document.body.insertAdjacentHTML('beforeend', `<div id="prn_area" class="prn-qr"><img src="${c.toDataURL('image/png')}" alt="" style="width:70mm;display:block;margin:20mm auto"></div>`);
  try { prnStyle('qr'); } catch (e) {} document.body.classList.add('prn-on'); PRN.live = true; PRN_FIRED = false;
  setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(() => { if (!PRN_FIRED){ prnClean(); toast(t('prn_blocked')); } }, 700); }, 120);
}

/* ---------- reading codes ---------- */
function qrScanRender(){
  const E = qrE, b = $('#qr_body'); if (!b) return;
  const live = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  b.innerHTML = `<p class="fine">${E(t('qr_scanH'))}</p>
    <div class="btnrow ds-go">${live ? `<button type="button" class="gold-btn" id="qr_live">${QRX.cam ? '⏹ ' + E(t('qr_stop')) : '📷 ' + E(t('qr_live'))}</button>` : ''}<button type="button" class="btn" id="qr_photo">📸 ${E(t('qr_photo'))}</button><button type="button" class="btn" id="qr_file">🖼️ ${E(t('qr_fromFile'))}</button>
      <input type="file" accept="image/*" capture="environment" id="qr_camF" hidden><input type="file" accept="image/*,application/pdf" multiple id="qr_fileF" hidden></div>
    <div class="qr-cam" id="qr_cam"${QRX.cam ? '' : ' hidden'}><video id="qr_vid" playsinline muted></video><div class="qr-aim" aria-hidden="true"></div></div>
    <div class="sl-st" id="qr_st" aria-live="polite"></div>
    <div id="qr_res">${QRX.res.map((r, i) => qrResHTML(r, i)).join('')}</div>
    ${QRX.res.length ? `<div class="btnrow"><button type="button" class="mv" id="qr_clear">🗑️ ${E(t('qr_clear'))}</button></div>` : ''}
    <p class="fine sl-priv">🔒 ${E(t('qr_privScan'))}</p>`;
  if (QRX.cam){ const v = $('#qr_vid'); v.srcObject = QRX.cam.stream; v.play().catch(() => {}); }
}
const QR_SHORT = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'tiny.cc', 's.id', 'shorturl.at', 'buff.ly', 'rebrand.ly', 't.ly', 'v.gd', 'qrco.de', 'lnkd.in'];
/* warnings for a link before opening it (QR codes are a common way to send people to fake sites) */
function qrUrlWarn(u){
  const W = []; let x; try { x = new URL(u); } catch (e) { return ['qr_w_bad']; }
  const h = x.hostname.toLowerCase();
  if (x.protocol === 'http:') W.push('qr_w_http');
  if (!/^https?:$/.test(x.protocol)) W.push('qr_w_scheme');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':')) W.push('qr_w_ip');
  if (h.split('.').some(p => p.startsWith('xn--'))) W.push('qr_w_puny');
  if (QR_SHORT.includes(h.replace(/^www\./, ''))) W.push('qr_w_short');
  if (x.username || x.password || /@/.test(u.split('?')[0].replace(/^[a-z]+:\/\//i, ''))) W.push('qr_w_at');
  if (/(gov|bituach|btl|mof|taxes|police|israelpost|bank|leumi|hapoalim|discount|mizrahi|paybox|bit)/.test(h) && !/(\.gov\.il|\.org\.il|\.co\.il|\.ac\.il)$/.test(h)) W.push('qr_w_look');
  if (u.length > 300) W.push('qr_w_long');
  return W;
}
function qrKind(s){
  if (/^https?:\/\//i.test(s)) return 'url';
  if (/^WIFI:/i.test(s)) return 'wifi';
  if (/^BEGIN:VCARD/i.test(s) || /^MECARD:/i.test(s)) return 'contact';
  if (/^BEGIN:VEVENT/i.test(s) || /^BEGIN:VCALENDAR/i.test(s)) return 'event';
  if (/^tel:/i.test(s)) return 'phone';
  if (/^(SMSTO|sms):/i.test(s)) return 'sms';
  if (/^mailto:/i.test(s) || /^MATMSG:/i.test(s)) return 'email';
  if (/^geo:/i.test(s)) return 'geo';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return 'otherurl';
  return 'text';
}
function qrWifiParse(s){ const o = {}; s.replace(/^WIFI:/i, '').replace(/(^|;)([TSPH]):((?:\\.|[^;])*)/g, (m, a, k, v) => { o[k] = v.replace(/\\(.)/g, '$1'); }); return o; }
function qrVcfParse(s){ const g = k => { const m = new RegExp('^' + k + '[^:\\n]*:(.*)$', 'im').exec(s); return m ? m[1].replace(/\\(.)/g, '$1').trim() : ''; }; if (/^MECARD:/i.test(s)){ const m = k => { const r = new RegExp(k + ':((?:\\\\.|[^;])*)', 'i').exec(s); return r ? r[1].replace(/\\(.)/g, '$1') : ''; }; return {n: m('N').split(',').reverse().join(' '), tel: m('TEL'), mail: m('EMAIL')}; } return {n: g('FN') || g('N').split(';').reverse().join(' ').trim(), tel: g('TEL'), mail: g('EMAIL'), org: g('ORG')}; }
function qrResHTML(r, i){
  const E = qrE, s = r.text, k = qrKind(s), fmt = r.fmt && r.fmt !== 'qr_code' ? r.fmt.toUpperCase().replace(/_/g, '-') : 'QR';
  let body = '', acts = `<button type="button" class="mv" data-qrcopy="${i}">📋 ${E(t('b_copy'))}</button>`;
  if (k === 'url'){ const W = qrUrlWarn(s); let host = ''; try { host = new URL(s).hostname; } catch (e) {}
    body = `<p class="qr-host" dir="ltr"><b>${E(host)}</b></p><p class="qr-raw" dir="ltr">${E(s)}</p>${W.length ? `<div class="ds-warn" role="note"><span aria-hidden="true">⚠️</span><p>${W.map(w => E(t(w))).join(' ')}</p></div>` : `<p class="fine">✓ ${E(t('qr_w_ok'))}</p>`}`;
    acts = `<button type="button" class="${W.length ? 'btn' : 'gold-btn'}" data-qropen="${i}">↗ ${E(t(W.length ? 'qr_openAny' : 'qr_open'))}</button>` + acts; }
  else if (k === 'wifi'){ const w = qrWifiParse(s); body = `<dl class="qr-dl"><dt>${E(t('qr_f_ssid'))}</dt><dd dir="auto">${E(w.S || '')}</dd><dt>${E(t('qr_f_sec'))}</dt><dd>${E(w.T || 'nopass')}</dd>${w.P ? `<dt>${E(t('qr_f_pass'))}</dt><dd dir="ltr"><span class="qr-pw" data-pw="${i}">••••••••</span> <button type="button" class="lg-a" data-qrshow="${i}">${E(t('qr_show'))}</button></dd>` : ''}</dl><p class="fine">${E(t('qr_wifiJoin'))}</p>`;
    acts = (w.P ? `<button type="button" class="gold-btn" data-qrpw="${i}">📋 ${E(t('qr_copyPw'))}</button>` : '') + acts; }
  else if (k === 'contact'){ const c = qrVcfParse(s); body = `<dl class="qr-dl"><dt>${E(t('qr_name'))}</dt><dd dir="auto">${E(c.n)}</dd>${c.tel ? `<dt>${E(t('qr_f_tel'))}</dt><dd dir="ltr">${E(c.tel)}</dd>` : ''}${c.mail ? `<dt>${E(t('qr_f_mail'))}</dt><dd dir="ltr">${E(c.mail)}</dd>` : ''}${c.org ? `<dt>${E(t('qr_f_org'))}</dt><dd dir="auto">${E(c.org)}</dd>` : ''}</dl>`;
    acts = `<button type="button" class="gold-btn" data-qrvcf="${i}">👤 ${E(t('qr_saveC'))}</button>` + acts; }
  else if (k === 'event'){ const g = x => { const m = new RegExp('^' + x + '[^:\\n]*:(.*)$', 'im').exec(s); return m ? m[1].replace(/\\(.)/g, '$1') : ''; }; body = `<dl class="qr-dl"><dt>${E(t('qr_f_title'))}</dt><dd dir="auto">${E(g('SUMMARY'))}</dd><dt>${E(t('qr_f_start'))}</dt><dd dir="ltr">${E(g('DTSTART'))}</dd>${g('LOCATION') ? `<dt>${E(t('qr_f_place'))}</dt><dd dir="auto">${E(g('LOCATION'))}</dd>` : ''}</dl>`;
    acts = `<button type="button" class="gold-btn" data-qrics="${i}">📅 ${E(t('qr_addCal'))}</button>` + acts; }
  else if (k === 'phone' || k === 'sms' || k === 'email' || k === 'geo'){ const href = k === 'sms' ? s.replace(/^SMSTO:([^:]*):?(.*)$/i, (m, n, b2) => 'sms:' + n + (b2 ? '?body=' + encodeURIComponent(b2) : '')) : k === 'geo' ? 'https://maps.google.com/?q=' + encodeURIComponent(s.replace(/^geo:/i, '').split('?')[0]) : s;
    body = `<p class="qr-raw" dir="ltr">${E(s)}</p>`; acts = `<a class="gold-btn" href="${E(href)}" target="_blank" rel="noopener noreferrer">${{phone: '📞', sms: '💬', email: '✉️', geo: '📍'}[k]} ${E(t('qr_go_' + k))}</a>` + acts; }
  else body = `<p class="qr-raw" dir="auto">${E(s)}</p>${k === 'otherurl' ? `<div class="ds-warn" role="note"><span aria-hidden="true">⚠️</span><p>${E(t('qr_w_scheme'))}</p></div>` : ''}`;
  return `<article class="qr-r"><header><span class="qr-badge">${E(fmt)}</span> <b>${E(t('qr_k_' + (k === 'otherurl' ? 'text' : k)))}</b>${r.from ? ` <small>· ${E(r.from)}</small>` : ''}</header>${body}<div class="btnrow">${acts}</div></article>`;
}
function qrAddRes(list, from){
  let added = 0;
  list.forEach(r => { if (!r || r.text == null) return; if (QRX.res.some(x => x.text === r.text)) return; QRX.res.unshift({text: r.text, fmt: r.fmt, from}); added++; });
  QRX.res = QRX.res.slice(0, 12);
  return added;
}
async function qrDetect(src){
  const out = [];
  if ('BarcodeDetector' in window){ try { const d = new BarcodeDetector(); const r = await d.detect(src); r.forEach(x => out.push({text: x.rawValue, fmt: x.format})); } catch (e) {} }
  if (!out.length){ try { const r = qrDecodeCanvas(src); if (r) out.push({text: r.text, fmt: 'qr_code'}); } catch (e) {} }
  return out;
}
async function qrFromFiles(files){
  const st = $('#qr_st'); let n = 0;
  for (const f of files){
    if (st) st.textContent = '⏳ ' + t('qr_reading');
    try {
      if (/pdf/.test(f.type) || /\.pdf$/i.test(f.name)){
        const doc = await pxOpenPdf(new Uint8Array(await f.arrayBuffer()));
        for (let i = 1; i <= Math.min(doc.numPages, 30); i++){ const pg = await doc.getPage(i), vp = pg.getViewport({scale: 2.2}), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; await pg.render({canvasContext: c.getContext('2d'), viewport: vp}).promise; n += qrAddRes(await qrDetect(c), f.name + ' · ' + t('ds_side', {n: i})); }
      } else { const c = await dsLoad(f); n += qrAddRes(await qrDetect(c), f.name); }
    } catch (e) {}
  }
  qrScanRender(); const s2 = $('#qr_st'); if (s2) s2.textContent = n ? '✓ ' + t('qr_found', {n}) : t('qr_none');
}
async function qrLive(){
  if (QRX.cam){ qrStop(); qrScanRender(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}}, audio: false});
    QRX.cam = {stream, t: 0}; qrScanRender();
    const v = $('#qr_vid'), bd = 'BarcodeDetector' in window ? new BarcodeDetector() : null, c = document.createElement('canvas');
    const tick = async () => {
      if (!QRX.cam || !v.isConnected) return;
      if (v.readyState >= 2){
        let r = [];
        if (bd){ try { r = (await bd.detect(v)).map(x => ({text: x.rawValue, fmt: x.format})); } catch (e) {} }
        else { const k = Math.min(1, 900 / Math.max(v.videoWidth, v.videoHeight)); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); const q = qrDecodeCanvas(c); if (q) r = [{text: q.text, fmt: 'qr_code'}]; }
        if (r.length){ const n = qrAddRes(r, t('qr_cam')); if (n){ try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} qrStop(); qrScanRender(); const s = $('#qr_st'); if (s) s.textContent = '✓ ' + t('qr_found', {n}); return; } }
      }
      QRX.cam.t = setTimeout(tick, bd ? 150 : 280);
    };
    tick();
  } catch (e) { qrStop(); const s = $('#qr_st'); if (s) s.textContent = t('qr_camNo'); }
}
function qrStop(){ if (QRX.cam){ clearTimeout(QRX.cam.t); try { QRX.cam.stream.getTracks().forEach(x => x.stop()); } catch (e) {} QRX.cam = null; } }

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest || !t0.closest('#ds_root')) return; let b;
  if (t0.closest('[data-dstool="qr"]')){ DSX.view = 'qr'; dscRender(); return; }
  if (DSX.view !== 'qr') return;
  if (t0.closest('#ds_back')){ qrStop(); }
  if ((b = t0.closest('[data-qrt]'))){ QRX.tab = b.dataset.qrt; if (QRX.tab !== 'scan') qrStop(); qrRender($('#ds_root')); const n = $(`[data-qrt="${QRX.tab}"]`); if (n) n.focus(); return; }
  if ((b = t0.closest('[data-qrty]'))){ QRX.type = b.dataset.qrty; qrMakeRender(); const n = $(`[data-qrty="${QRX.type}"]`); if (n) n.focus(); return; }
  if (t0.closest('#qr_here')){ if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(p => { QRX.f.lat = p.coords.latitude.toFixed(6); QRX.f.lng = p.coords.longitude.toFixed(6); qrMakeRender(); }, () => toast(t('qr_geoNo')), {timeout: 10000}); return; }
  if (t0.closest('#qr_logo')){ if (QRX.logo){ QRX.logo = null; qrMakeRender(); return; } const f = $('#qr_logoF'); if (f) f.click(); return; }
  if (t0.closest('#qr_png')){ qrOut('png'); return; }
  if (t0.closest('#qr_svg')){ qrOut('svg'); return; }
  if (t0.closest('#qr_share')){ qrOut('share'); return; }
  if (t0.closest('#qr_print')){ qrOut('print'); return; }
  if (t0.closest('#qr_topdf')){ qrOut('pdf'); return; }
  if (t0.closest('#qr_live')){ qrLive(); return; }
  if (t0.closest('#qr_photo')){ const f = $('#qr_camF'); if (f) f.click(); return; }
  if (t0.closest('#qr_file')){ const f = $('#qr_fileF'); if (f) f.click(); return; }
  if (t0.closest('#qr_clear')){ QRX.res = []; qrScanRender(); return; }
  const R = i => QRX.res[+i] || {text: ''};
  if ((b = t0.closest('[data-qrcopy]'))){ copyText(R(b.dataset.qrcopy).text); toast(t('st_copied')); return; }
  if ((b = t0.closest('[data-qropen]'))){ const s = R(b.dataset.qropen).text, W = qrUrlWarn(s); if (W.length && !confirm(t('qr_sure') + '\n\n' + s)) return; window.open(s, '_blank', 'noopener,noreferrer'); return; }
  if ((b = t0.closest('[data-qrshow]'))){ const w = qrWifiParse(R(b.dataset.qrshow).text), sp = $(`[data-pw="${b.dataset.qrshow}"]`); if (sp){ const hid = sp.textContent.startsWith('•'); sp.textContent = hid ? (w.P || '') : '••••••••'; b.textContent = t(hid ? 'qr_hide' : 'qr_show'); } return; }
  if ((b = t0.closest('[data-qrpw]'))){ copyText(qrWifiParse(R(b.dataset.qrpw).text).P || ''); toast(t('st_copied')); return; }
  if ((b = t0.closest('[data-qrvcf]'))){ let s = R(b.dataset.qrvcf).text; if (/^MECARD:/i.test(s)){ const c = qrVcfParse(s); s = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + c.n, c.tel ? 'TEL:' + c.tel : '', c.mail ? 'EMAIL:' + c.mail : '', 'END:VCARD'].filter(Boolean).join('\n'); } fileSave(new Blob([s.replace(/\r?\n/g, '\r\n')], {type: 'text/vcard'}), 'contact.vcf', 'text/vcard'); return; }
  if ((b = t0.closest('[data-qrics]'))){ let s = R(b.dataset.qrics).text; if (!/BEGIN:VCALENDAR/i.test(s)) s = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//fincalc//QR//EN\n' + s + '\nEND:VCALENDAR'; fileSave(new Blob([s.replace(/\r?\n/g, '\r\n')], {type: 'text/calendar'}), 'event.ics', 'text/calendar'); return; }
});
let QR_T = null;
document.addEventListener('input', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'qr') return;
  if (el.dataset.qrf){ QRX.f[el.dataset.qrf] = el.type === 'checkbox' ? el.checked : el.value; }
  else if (el.id === 'qr_fg') QRX.fg = el.value; else if (el.id === 'qr_bg') QRX.bg = el.value; else if (el.id === 'qr_margin') QRX.margin = +el.value; else if (el.id === 'qr_cap') QRX.cap = el.value.slice(0, 60);
  else return;
  clearTimeout(QR_T); QR_T = setTimeout(qrPreview, 180);
});
document.addEventListener('change', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#ds_root') || DSX.view !== 'qr') return;
  if (el.dataset.qrf){ QRX.f[el.dataset.qrf] = el.type === 'checkbox' ? el.checked : el.value; qrPreview(); return; }
  if (el.id === 'qr_ecl'){ QRX.ecl = +el.value; qrPreview(); return; }
  if (el.id === 'qr_dots'){ QRX.dots = el.checked; qrPreview(); return; }
  if (el.id === 'qr_logoF' && el.files[0]){ dsLoad(el.files[0]).then(c => { QRX.logo = c; qrMakeRender(); }).catch(() => toast(t('ph_fail'))); el.value = ''; return; }
  if ((el.id === 'qr_camF' || el.id === 'qr_fileF') && el.files.length){ qrFromFiles([...el.files]); el.value = ''; }
});
/* the scanner's home gets a row of tools; and QR codes in a scanned page are found by themselves */
{
  const dsrQr = dscRender;
  dscRender = function(){
    const root = $('#ds_root');
    if (root && DSX.view === 'qr') return qrRender(root);
    if (root && DSX.view === 'pdf' && typeof pxRender === 'function') return pxRender(root);
    if (root && DSX.view === 'conv' && typeof cvtRender === 'function') return cvtRender(root);
    qrStop();
    const r = dsrQr.apply(this, arguments);
    if (root && DSX.view === 'kinds' && !DSX.det && !root.querySelector('.ds-toolrow')) root.insertAdjacentHTML('afterbegin', `<div class="ds-toolrow" role="group" aria-label="${qrE(t('dst_title'))}">${[['pdf', '📝'], ['conv', '🔄'], ['qr', '▦']].map(([k, ic]) => `<button type="button" class="ds-tool" data-dstool="${k}"><span aria-hidden="true">${ic}</span><b>${qrE(t('dst_' + k))}</b><small>${qrE(t('dst_' + k + 'H'))}</small></button>`).join('')}</div>`);
    return r;
  };
  const cutQr = dsCut;
  dsCut = function(){
    const r = cutQr.apply(this, arguments);
    const p = DSC && DSC.pages[DSC.pages.length - 1];
    if (p && !p.qrDone){ p.qrDone = true; setTimeout(async () => { try { const f = await qrDetect(p.base); if (f.length){ p.qr = f; qrAddRes(f, t('dst_scanned')); dscRender(); } } catch (e) {} }, 60); }
    return r;
  };
  const cardQr = dsCardRender;
  dsCardRender = function(root){
    const r = cardQr.apply(this, arguments);
    if (DSC && !DSC.cur){ const f = DSC.pages.filter(p => p.qr && p.qr.length).length; if (f){ const pg = root.querySelector('.ds-pages'); if (pg && !root.querySelector('.qr-found')) pg.insertAdjacentHTML('afterend', `<div class="ds-found ds-found-s qr-found" role="status">▦ ${qrE(t('qr_inScan'))} <button type="button" class="lg-a" data-dstool="qr" data-qrgo="scan">${qrE(t('qr_seeIt'))}</button></div>`); } }
    return r;
  };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-qrgo]'); if (b){ QRX.tab = b.dataset.qrgo; } }, true);
}
try { GS_SYN.docscan += ' קוד QR ברקוד סריקת QR יצירת QR qr code barcode scan qr رمز QR باركود'; } catch (e) {}
