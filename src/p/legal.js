/* ---------- 13.1: accessibility statement and privacy policy — in the app, in three languages, linked from every screen ---------- */
const LG_DATE = '26.10.2026';
const LG_DOCS = {
  a11y: {t: 'lg_a11yT', ic: '♿', parts: [
    ['', ['lg_a_intro']],
    ['lg_a_doneH', ['lg_a_d1', 'lg_a_d2', 'lg_a_d3', 'lg_a_d4', 'lg_a_d5', 'lg_a_d6', 'lg_a_d7', 'lg_a_d8', 'lg_a_d9', 'lg_a_d10', 'lg_a_d11', 'lg_a_d12', 'lg_a_d13', 'lg_a_d14', 'lg_a_d15'], true],
    ['lg_a_howH', ['lg_a_how']],
    ['lg_a_limH', ['lg_a_l1', 'lg_a_l2', 'lg_a_l3', 'lg_a_l4', 'lg_a_l5'], true],
    ['lg_contactH', ['lg_a_contact']],
    ['lg_histH', ['lg_h_a1910g', 'lg_h_a1910f', 'lg_h_a1910e', 'lg_h_a1910d', 'lg_h_a1910c', 'lg_h_a1910b', 'lg_h_a1910', 'lg_h_1810'], true]
  ]},
  terms: {t: 'lg_termsT', ic: '📜', parts: [
    ['', ['lg_t_intro']],
    ['lg_t_calcH', ['lg_t_calc1', 'lg_t_calc2', 'lg_t_lic']],
    ['lg_t_betaH', ['lg_t_beta']],
    ['lg_t_dataH', ['lg_t_data']],
    ['lg_t_aiH', ['lg_t_ai', 'lg_t_tf']],
    ['lg_t_liabH', ['lg_t_liab']],
    ['lg_t_useH', ['lg_t_use1', 'lg_t_use2', 'lg_t_use3', 'lg_t_use4', 'lg_t_prn', 'lg_t_sig', 'lg_t_pdf', 'lg_t_qr', 'lg_t_stamp'], true],
    ['lg_t_hostH', ['lg_t_host']],
    ['lg_t_ipH', ['lg_t_ip']],
    ['lg_t_chgH', ['lg_t_chg']],
    ['lg_t_lawH', ['lg_t_law']],
    ['lg_contactH', ['lg_t_contact']],
    ['lg_histH', ['lg_h_t2610', 'lg_h_t1910f', 'lg_h_t1910e', 'lg_h_t1910d', 'lg_h_t1910c', 'lg_h_t1910b', 'lg_h_t1910', 'lg_h_1810'], true]
  ]},
  cred: {t: 'lg_credT', ic: '🧾', parts: [
    ['', ['lg_c_intro']],
    ['lg_c_libH', ['lg_c_lib1', 'lg_c_lib3', 'lg_c_lib4', 'lg_c_lib2'], true],
    ['lg_c_dataH', ['lg_c_data1', 'lg_c_data2', 'lg_c_data3', 'lg_c_data4'], true]
  ], extra: () => `<p><a href="${(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) ? SITE_BASE : ''}lib/nerdamer.LICENSE.txt" target="_blank" rel="noopener">${lgE(t('lg_c_licLink'))}</a></p><p>${lgE(t('lg_c_licLinks'))} ${[['pdfjs/LICENSE.txt', 'pdf.js'], ['pdfjs/wasm/LICENSE_JBIG2', 'JBIG2'], ['pdfjs/wasm/LICENSE_OPENJPEG', 'OpenJPEG'], ['pdfjs/wasm/LICENSE_QCMS', 'QCMS'], ['pdf-lib.LICENSE.txt', 'pdf-lib'], ['jszip.LICENSE.txt', 'JSZip']].map(([f, n]) => `<a href="${(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) ? SITE_BASE : ''}lib/${f}" target="_blank" rel="noopener">${n}</a>`).join(' · ')}</p>`},
  priv: {t: 'lg_privT', ic: '🔒', parts: [
    ['', ['lg_p_intro']],
    ['lg_p_devH', ['lg_p_dev1', 'lg_p_dev2', 'lg_p_dev3', 'lg_p_dev4', 'lg_p_dev5', 'lg_p_dev6', 'lg_p_dev7', 'lg_p_dev8', 'lg_p_dev9', 'lg_p_dev10', 'lg_p_dev11', 'lg_p_dev12', 'lg_p_dev13', 'lg_p_dev14', 'lg_p_dev15']],
    ['lg_p_usH', ['lg_p_us1', 'lg_p_us2', 'lg_p_us3', 'lg_p_us5', 'lg_p_us4'], true],
    ['lg_p_extH', ['lg_p_ext0', 'lg_p_ext1', 'lg_p_ext2', 'lg_p_ext3', 'lg_p_ext4', 'lg_p_ext5', 'lg_p_ext6'], true],
    ['lg_p_permH', ['lg_p_perm']],
    ['lg_p_secH', ['lg_p_sec']],
    ['lg_p_noH', ['lg_p_no']],
    ['lg_p_privH', ['lg_p_priv']],
    ['lg_p_lawH', ['lg_p_law']],
    ['lg_p_rightsH', ['lg_p_r1', 'lg_p_r2', 'lg_p_r3'], true],
    ['lg_p_chgH', ['lg_p_chg']],
    ['lg_contactH', ['lg_p_contact']],
    ['lg_histH', ['lg_h_p2010', 'lg_h_p1910k', 'lg_h_p1910j', 'lg_h_p1910i', 'lg_h_p1910h', 'lg_h_p1910g', 'lg_h_p1910f', 'lg_h_p1910e', 'lg_h_p1910d', 'lg_h_p1910c', 'lg_h_p1910', 'lg_h_1810'], true]
  ]}
};
const lgE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* 13.55: every page is plain text with three simple marks – a blank line starts a new paragraph, a line that starts with "## " is a heading,
   a line that starts with "- " is a bullet. The owner may replace a page from the admin version (lgedit.js); it is kept on the server per
   language and read from legal.json. The text is always built with textContent – never as HTML. */
const lgLine = s => String(s == null ? '' : s).replace(/\s*\n\s*/g, ' ').trim();
function lgDefault(k){
  const D = LG_DOCS[k]; if (!D) return '';
  return D.parts.map(([h, L, list]) => (h ? '## ' + lgLine(t(h)) + '\n\n' : '') + (list ? L.map(x => '- ' + lgLine(t(x))).join('\n') : L.map(x => lgLine(t(x))).join('\n\n'))).join('\n\n');
}
function lgRender(box, txt){
  box.textContent = '';
  let ul = null, p = null;
  String(txt == null ? '' : txt).replace(/\r\n?/g, '\n').split('\n').forEach(line => {
    const s = line.trim();
    if (!s){ ul = null; p = null; return; }
    if (/^##\s/.test(s)){ ul = null; p = null; const h = document.createElement('h4'); h.textContent = s.replace(/^##\s+/, ''); box.appendChild(h); return; }
    if (/^-\s/.test(s)){ p = null; if (!ul){ ul = document.createElement('ul'); box.appendChild(ul); } const li = document.createElement('li'); li.textContent = s.replace(/^-\s+/, ''); ul.appendChild(li); return; }
    ul = null;
    if (p){ p.appendChild(document.createElement('br')); p.appendChild(document.createTextNode(s)); }
    else { p = document.createElement('p'); p.textContent = s; box.appendChild(p); }
  });
}
/* the owner's texts: {terms: {he: {x, at}}, …}. The last copy is kept on the phone so the page opens at once (and offline) */
var LGX = null, LGX_AT = 0, LGX_P = null;
try { const c0 = JSON.parse(RAWLS.getItem('fin-lgx') || 'null'); if (c0 && c0.d && typeof c0.d === 'object') LGX = c0.d; } catch (e) {}
function lgxSet(d){
  const v = d && typeof d === 'object' ? d : {}, was = JSON.stringify(LGX || {}), now = JSON.stringify(v);
  LGX = v; LGX_AT = Date.now();
  try { if (Object.keys(v).length) RAWLS.setItem('fin-lgx', JSON.stringify({d: v})); else RAWLS.removeItem('fin-lgx'); } catch (e) {}
  return was !== now;
}
function lgxLoad(){
  if (LGX_P) return LGX_P;
  if (LGX_AT && Date.now() - LGX_AT < 300000) return Promise.resolve(false);
  const url = ((typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) ? SITE_BASE : '') + 'legal.json?t=' + Math.floor(Date.now() / 60000);
  LGX_P = fetch(url, {cache: 'no-store', credentials: 'omit'}).then(r => r.ok ? r.json() : null).then(j => {
    LGX_P = null; if (!j || typeof j !== 'object' || !j.d || typeof j.d !== 'object'){ LGX_AT = Date.now(); return false; } return lgxSet(j.d);
  }, () => { LGX_P = null; LGX_AT = Date.now(); return false; });
  return LGX_P;
}
/* the owner's text for this page in this language, if there is one */
function lgEdited(k){ const d = LGX && LGX[k] && LGX[k][lang]; return d && typeof d.x === 'string' && d.x.trim() ? d : null; }
const lgDay = ms => { const d = new Date(+ms); return isNaN(d) ? LG_DATE : String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
var LG_CUR = '';
function lgPaint(k){
  const D = LG_DOCS[k], box = $('#lgx_b'); if (!D || !box) return;
  const ed = lgEdited(k);
  box.innerHTML = `<div class="lg-doc"></div>`
    + (D.extra ? D.extra() : '')
    + `<div class="btnrow"><button type="button" class="btn" data-lgfb="1">💬 ${lgE(t('lg_write'))}</button></div><div class="btnrow lg-other">${Object.keys(LG_DOCS).filter(x => x !== k).map(x => `<button type="button" class="mv wide" data-lgo="${x}">${LG_DOCS[x].ic} ${lgE(t(LG_DOCS[x].t))}</button>`).join('')}</div>`
    + `<p class="fine">${lgE(t('lg_updated', {d: ed ? lgDay(ed.at) : LG_DATE}))} · ${lgE(t('lg_notLegal'))}</p>`;
  lgRender(box.querySelector('.lg-doc'), ed ? ed.x : lgDefault(k));
}
function lgOpen(k){
  const D = LG_DOCS[k]; if (!D) return;
  if (!$('#lgx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="lgx" hidden><div class="cp-box lg-box" role="dialog" aria-modal="true" aria-labelledby="lgx_t"><div class="cp-top"><h3 id="lgx_t"></h3><button type="button" class="cp-x" id="lgx_x">×</button></div><div class="lg-body" id="lgx_b" tabindex="0"></div></div></div>`);
  $('#lgx_x').setAttribute('aria-label', t('cp_close'));
  $('#lgx_t').textContent = D.ic + ' ' + t(D.t);
  LG_CUR = k;
  const fresh = LGX_AT && Date.now() - LGX_AT < 300000;
  if (LGX || fresh || k === 'cred') lgPaint(k);
  else { const b = $('#lgx_b'); b.textContent = ''; const w = document.createElement('p'); w.className = 'fine'; w.textContent = t('lg_loading'); b.appendChild(w); }
  if (!fresh && k !== 'cred'){
    const my = k, first = !LGX;
    Promise.race([lgxLoad(), new Promise(r => setTimeout(() => r(null), 2500))]).then(ch => {
      const o = $('#lgx'); if (!o || o.hidden || LG_CUR !== my || $('#lge_ta')) return;
      if (ch || first || !$('#lgx_b .lg-doc')){ const sc = $('#lgx_b').scrollTop; lgPaint(my); $('#lgx_b').scrollTop = sc; }
    });
  }
  $('#lgx').hidden = false; document.body.classList.add('cp-lock'); $('#lgx_b').scrollTop = 0; setTimeout(() => { try { $('#lgx_x').focus(); } catch (e) {} }, 30);
}
function lgClose(){ const o = $('#lgx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
const lgCopy = () => { const y = new Date().getFullYear(); return t('lg_copy', {y: y > 2026 ? '2026–' + y : '2026'}); };
function lgLinks(){ return `<span class="lg-links">${['terms', 'priv', 'a11y'].map(k => `<button type="button" class="lg-a" data-lgo="${k}">${lgE(t(LG_DOCS[k].t))}</button>`).join(' · ')}<span class="lg-copy">${lgE(lgCopy())}</span></span>`; }
/* links: at the foot of every screen, in Settings → System, and next to the feedback form (where an e-mail may be asked for) */
function lgMount(){
  $$('.note').forEach(n => { const old = n.querySelector('.lg-links'); if (old && old.dataset.l === document.documentElement.lang) return; if (old) old.remove(); n.insertAdjacentHTML('beforeend', ' ' + lgLinks()); n.querySelector('.lg-links').dataset.l = document.documentElement.lang; });
  const sys = $('.set-cat[data-cat="system"]');
  if (sys){ let s = $('#lg_sec'); const lg = document.documentElement.lang;
    if (!s || s.dataset.l !== lg){ if (s) s.remove(); sys.insertAdjacentHTML('beforeend', `<section class="set-sec" id="lg_sec" data-l="${lg}"><div class="sec-h"><h3 class="sec-t">📄 ${lgE(t('lg_docs'))}</h3></div><div class="btnrow lg-docs">${['terms', 'priv', 'a11y', 'cred'].map(k => `<button type="button" class="btn" data-lgo="${k}">${LG_DOCS[k].ic} ${lgE(t(LG_DOCS[k].t))}</button>`).join('')}</div></section>`); } }
  const fb = $('#fb_box'); if (fb && !fb.querySelector('.lg-fb')) fb.insertAdjacentHTML('beforeend', `<p class="fine lg-fb">${lgE(t('lg_fbNote'))} <button type="button" class="lg-a" data-lgo="priv">${lgE(t('lg_privT'))}</button></p>`);
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if ((b = t0.closest('[data-lgo]'))){ e.preventDefault(); lgOpen(b.dataset.lgo); return; }
  if (t0.closest('#lgx_x') || t0.id === 'lgx'){ lgClose(); return; }
  if (t0.closest('[data-lgfb]')){ lgClose(); try { activate('settings'); } catch (er) {} setTimeout(() => { try { if (typeof setCat === 'function') setCat('system'); } catch (er) {} setTimeout(() => { const f = $('#fb_box'); if (f){ f.scrollIntoView({block: 'start', behavior: 'smooth'}); const ta = f.querySelector('textarea'); if (ta) ta.focus({preventScroll: true}); } }, 250); }, 120); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#lgx') && !$('#lgx').hidden && !(e.target && e.target.id === 'lge_ta')) lgClose(); });   // 13.55: Escape in the owner's editor box does not throw the text away
try { lgMount(); } catch (e) {}
setTimeout(() => { try { lgMount(); } catch (e) {} }, 1200);
{
  const actLg = activate; activate = function(){ const r = actLg.apply(this, arguments); setTimeout(() => { try { lgMount(); } catch (e) {} }, 60); return r; };
  const alLg = applyLang; applyLang = function(){ const r = alLg.apply(this, arguments); try { lgMount(); } catch (e) {} return r; };
  if (typeof setCat === 'function'){ const scLg = setCat; setCat = function(){ const r = scLg.apply(this, arguments); setTimeout(() => { try { lgMount(); } catch (e) {} }, 60); return r; }; }
}
