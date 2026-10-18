/* ---------- 13.1: accessibility statement and privacy policy — in the app, in three languages, linked from every screen ---------- */
const LG_DATE = '18.10.2026';
const LG_DOCS = {
  a11y: {t: 'lg_a11yT', ic: '♿', parts: [
    ['', ['lg_a_intro']],
    ['lg_a_doneH', ['lg_a_d1', 'lg_a_d2', 'lg_a_d3', 'lg_a_d4', 'lg_a_d5', 'lg_a_d6', 'lg_a_d7', 'lg_a_d8'], true],
    ['lg_a_howH', ['lg_a_how']],
    ['lg_a_limH', ['lg_a_l1', 'lg_a_l2', 'lg_a_l3'], true],
    ['lg_contactH', ['lg_a_contact']]
  ]},
  priv: {t: 'lg_privT', ic: '🔒', parts: [
    ['', ['lg_p_intro']],
    ['lg_p_devH', ['lg_p_dev1', 'lg_p_dev2', 'lg_p_dev3']],
    ['lg_p_usH', ['lg_p_us1', 'lg_p_us2', 'lg_p_us3', 'lg_p_us4'], true],
    ['lg_p_extH', ['lg_p_ext0', 'lg_p_ext1', 'lg_p_ext2', 'lg_p_ext3', 'lg_p_ext4', 'lg_p_ext5', 'lg_p_ext6'], true],
    ['lg_p_noH', ['lg_p_no']],
    ['lg_p_privH', ['lg_p_priv']],
    ['lg_p_rightsH', ['lg_p_r1', 'lg_p_r2', 'lg_p_r3'], true],
    ['lg_p_chgH', ['lg_p_chg']],
    ['lg_contactH', ['lg_p_contact']]
  ]}
};
const lgE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function lgOpen(k){
  const D = LG_DOCS[k]; if (!D) return;
  if (!$('#lgx')) document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="lgx" hidden><div class="cp-box lg-box" role="dialog" aria-modal="true" aria-labelledby="lgx_t"><div class="cp-top"><h3 id="lgx_t"></h3><button type="button" class="cp-x" id="lgx_x">×</button></div><div class="lg-body" id="lgx_b" tabindex="0"></div></div></div>`);
  $('#lgx_x').setAttribute('aria-label', t('cp_close'));
  $('#lgx_t').textContent = D.ic + ' ' + t(D.t);
  $('#lgx_b').innerHTML = D.parts.map(([h, L, list]) => (h ? `<h4>${lgE(t(h))}</h4>` : '') + (list ? `<ul>${L.map(x => `<li>${lgE(t(x))}</li>`).join('')}</ul>` : L.map(x => `<p>${lgE(t(x))}</p>`).join(''))).join('')
    + `<div class="btnrow"><button type="button" class="btn" data-lgfb="1">💬 ${lgE(t('lg_write'))}</button><button type="button" class="mv wide" data-lgo="${k === 'a11y' ? 'priv' : 'a11y'}">${lgE(t(k === 'a11y' ? 'lg_privT' : 'lg_a11yT'))}</button></div>`
    + `<p class="fine">${lgE(t('lg_updated', {d: LG_DATE}))} · ${lgE(t('lg_notLegal'))}</p>`;
  $('#lgx').hidden = false; document.body.classList.add('cp-lock'); $('#lgx_b').scrollTop = 0; setTimeout(() => { try { $('#lgx_x').focus(); } catch (e) {} }, 30);
}
function lgClose(){ const o = $('#lgx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); } }
function lgLinks(){ return `<span class="lg-links"><button type="button" class="lg-a" data-lgo="a11y">${lgE(t('lg_a11yT'))}</button> · <button type="button" class="lg-a" data-lgo="priv">${lgE(t('lg_privT'))}</button></span>`; }
/* links: at the foot of every screen, in Settings → System, and next to the feedback form (where an e-mail may be asked for) */
function lgMount(){
  $$('.note').forEach(n => { const old = n.querySelector('.lg-links'); if (old && old.dataset.l === document.documentElement.lang) return; if (old) old.remove(); n.insertAdjacentHTML('beforeend', ' ' + lgLinks()); n.querySelector('.lg-links').dataset.l = document.documentElement.lang; });
  const sys = $('.set-cat[data-cat="system"]');
  if (sys){ let s = $('#lg_sec'); const lg = document.documentElement.lang;
    if (!s || s.dataset.l !== lg){ if (s) s.remove(); sys.insertAdjacentHTML('beforeend', `<section class="set-sec" id="lg_sec" data-l="${lg}"><div class="sec-h"><h3 class="sec-t">📄 ${lgE(t('lg_docs'))}</h3></div><div class="btnrow"><button type="button" class="btn" data-lgo="a11y">♿ ${lgE(t('lg_a11yT'))}</button><button type="button" class="btn" data-lgo="priv">🔒 ${lgE(t('lg_privT'))}</button></div></section>`); } }
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
