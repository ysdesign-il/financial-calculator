/* ---------- 13.1: accessibility statement and privacy policy — in the app, in three languages, linked from every screen ---------- */
const LG_DATE = '21.10.2026';
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
    ['lg_t_calcH', ['lg_t_calc1', 'lg_t_calc2']],
    ['lg_t_dataH', ['lg_t_data']],
    ['lg_t_aiH', ['lg_t_ai', 'lg_t_tf']],
    ['lg_t_liabH', ['lg_t_liab']],
    ['lg_t_useH', ['lg_t_use1', 'lg_t_use2', 'lg_t_use3', 'lg_t_use4', 'lg_t_prn', 'lg_t_sig', 'lg_t_pdf', 'lg_t_qr', 'lg_t_stamp'], true],
    ['lg_t_hostH', ['lg_t_host']],
    ['lg_t_ipH', ['lg_t_ip']],
    ['lg_t_chgH', ['lg_t_chg']],
    ['lg_t_lawH', ['lg_t_law']],
    ['lg_contactH', ['lg_t_contact']],
    ['lg_histH', ['lg_h_t1910f', 'lg_h_t1910e', 'lg_h_t1910d', 'lg_h_t1910c', 'lg_h_t1910b', 'lg_h_t1910', 'lg_h_1810'], true]
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
function lgOpen(k){
  const D = LG_DOCS[k]; if (!D) return;
  if (!$('#lgx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="lgx" hidden><div class="cp-box lg-box" role="dialog" aria-modal="true" aria-labelledby="lgx_t"><div class="cp-top"><h3 id="lgx_t"></h3><button type="button" class="cp-x" id="lgx_x">×</button></div><div class="lg-body" id="lgx_b" tabindex="0"></div></div></div>`);
  $('#lgx_x').setAttribute('aria-label', t('cp_close'));
  $('#lgx_t').textContent = D.ic + ' ' + t(D.t);
  $('#lgx_b').innerHTML = D.parts.map(([h, L, list]) => (h ? `<h4>${lgE(t(h))}</h4>` : '') + (list ? `<ul>${L.map(x => `<li>${lgE(t(x))}</li>`).join('')}</ul>` : L.map(x => `<p>${lgE(t(x))}</p>`).join(''))).join('')
    + (D.extra ? D.extra() : '')
    + `<div class="btnrow"><button type="button" class="btn" data-lgfb="1">💬 ${lgE(t('lg_write'))}</button></div><div class="btnrow lg-other">${Object.keys(LG_DOCS).filter(x => x !== k).map(x => `<button type="button" class="mv wide" data-lgo="${x}">${LG_DOCS[x].ic} ${lgE(t(LG_DOCS[x].t))}</button>`).join('')}</div>`
    + `<p class="fine">${lgE(t('lg_updated', {d: LG_DATE}))} · ${lgE(t('lg_notLegal'))}</p>`;
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
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#lgx') && !$('#lgx').hidden) lgClose(); });
try { lgMount(); } catch (e) {}
setTimeout(() => { try { lgMount(); } catch (e) {} }, 1200);
{
  const actLg = activate; activate = function(){ const r = actLg.apply(this, arguments); setTimeout(() => { try { lgMount(); } catch (e) {} }, 60); return r; };
  const alLg = applyLang; applyLang = function(){ const r = alLg.apply(this, arguments); try { lgMount(); } catch (e) {} return r; };
  if (typeof setCat === 'function'){ const scLg = setCat; setCat = function(){ const r = scLg.apply(this, arguments); setTimeout(() => { try { lgMount(); } catch (e) {} }, 60); return r; }; }
}
