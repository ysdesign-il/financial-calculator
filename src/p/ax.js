/* ---------- 13.7: the accessibility button – one tap from every screen ----------
   Uses the app's own settings where they exist (contrast, readable font, motion), so the menu and Settings always agree. */
const AX_ZOOM = [100, 115, 130, 150, 175];
const axE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
/* [key, icon, is it on?, toggle] */
const AX_OPTS = [
  ['contrast', '◐', () => SET.contrast === 'high', () => { SET.contrast = SET.contrast === 'high' ? 'normal' : 'high'; }],
  ['font', 'Aa', () => SET.font === 'readable', () => { SET.font = SET.font === 'readable' ? 'default' : 'readable'; }],
  ['motion', '⏸', () => SET.motion === 'reduced', () => { SET.motion = SET.motion === 'reduced' ? 'full' : 'reduced'; }],
  ['links', '🔗', () => SET.axLinks === '1', () => { SET.axLinks = SET.axLinks === '1' ? '0' : '1'; }],
  ['space', '↕', () => SET.axSpace === '1', () => { SET.axSpace = SET.axSpace === '1' ? '0' : '1'; }],
  ['focus', '⬚', () => SET.axFocus === '1', () => { SET.axFocus = SET.axFocus === '1' ? '0' : '1'; }],
  ['gray', '◑', () => SET.axGray === '1', () => { SET.axGray = SET.axGray === '1' ? '0' : '1'; }],
  ['cursor', '➤', () => SET.axCursor === '1', () => { SET.axCursor = SET.axCursor === '1' ? '0' : '1'; }]
];
function axApply(){
  const r = document.documentElement;
  ['links', 'space', 'focus', 'gray', 'cursor'].forEach(k => { const v = SET['ax' + k.charAt(0).toUpperCase() + k.slice(1)] === '1'; if (v) r.dataset['ax' + k.charAt(0).toUpperCase() + k.slice(1)] = '1'; else delete r.dataset['ax' + k.charAt(0).toUpperCase() + k.slice(1)]; });
  try { applyTheme(); applySize(); } catch (e) {}
  const b = $('#axb'); if (b) b.hidden = SET.axBtn === '0';
}
/* text size: on top of the size chosen in Settings */
{ const asAx = applySize; applySize = function(){ const r = asAx.apply(this, arguments); const z = +SET.axZoom || 100; if (z !== 100){ const base = parseFloat(document.documentElement.style.fontSize) || 16; document.documentElement.style.fontSize = (base * z / 100) + 'px'; } return r; }; }
function axCount(){ return AX_OPTS.filter(o => o[2]()).length + ((+SET.axZoom || 100) !== 100 ? 1 : 0); }
function axBtnMount(){
  if ($('#axb')) return;
  document.body.insertAdjacentHTML('beforeend', `<button type="button" class="ax-fab" id="axb" aria-haspopup="dialog" aria-controls="axx"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.2" r="2.1"/><path d="M5 8.2c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.2v5.3M12 14.5l-3.4 6.3M12 14.5l3.4 6.3"/></svg><span class="ax-n" hidden></span></button>`);
  axBtnLabel();
}
function axBtnLabel(){ const b = $('#axb'); if (!b) return; b.setAttribute('aria-label', t('ax_btn')); b.title = t('ax_btn'); const n = axCount(), c = b.querySelector('.ax-n'); c.hidden = !n; c.textContent = n || ''; b.hidden = SET.axBtn === '0'; }
function axOpen(){
  let o = $('#axx');
  if (!o){ document.body.insertAdjacentHTML('beforeend', `<div class="cp-ov" id="axx" hidden><div class="cp-box ax-box" role="dialog" aria-modal="true" aria-labelledby="axx_t"><div class="cp-top"><h3 id="axx_t"></h3><button type="button" class="cp-x" id="axx_x">×</button></div><div id="axx_b"></div></div></div>`); o = $('#axx'); }
  axPanel(); o.hidden = false; document.body.classList.add('cp-lock'); setTimeout(() => { const f = $('#axx_b button:not([disabled])'); if (f) f.focus(); }, 30);
}
function axPanel(){
  const z = +SET.axZoom || 100, zi = AX_ZOOM.indexOf(z);
  $('#axx_t').textContent = '♿ ' + t('ax_title'); $('#axx_x').setAttribute('aria-label', t('cp_close'));
  $('#axx_b').innerHTML = `<div class="ax-zoom" role="group" aria-label="${axE(t('ax_size'))}"><span>${axE(t('ax_size'))}</span>
      <button type="button" class="ax-zb" data-axz="-1"${zi <= 0 ? ' disabled' : ''} aria-label="${axE(t('ax_smaller'))}">A−</button><b aria-live="polite">${z}%</b><button type="button" class="ax-zb" data-axz="1"${zi >= AX_ZOOM.length - 1 ? ' disabled' : ''} aria-label="${axE(t('ax_bigger'))}">A+</button></div>
    <div class="ax-grid">${AX_OPTS.map(([k, ic, on]) => `<button type="button" class="ax-o${on() ? ' on' : ''}" aria-pressed="${on()}" data-axo="${k}"><span class="ax-ic" aria-hidden="true">${ic}</span><b>${axE(t('ax_' + k))}</b><small>${axE(t('ax_' + k + 'H'))}</small></button>`).join('')}
      ${'speechSynthesis' in window ? `<button type="button" class="ax-o" data-axread="1"><span class="ax-ic" aria-hidden="true">🔊</span><b>${axE(t('ax_read'))}</b><small>${axE(t('ax_readH'))}</small></button>` : ''}</div>
    <div class="btnrow ax-foot"><button type="button" class="btn" id="ax_reset">↺ ${axE(t('ax_reset'))}</button><button type="button" class="mv" data-axdoc="1">📄 ${axE(t('lg_a11yT'))}</button></div>
    <label class="ax-hide"><input type="checkbox" id="ax_hidebtn"${SET.axBtn === '0' ? ' checked' : ''}> ${axE(t('ax_hideBtn'))}</label>
    <p class="fine">${axE(t('ax_note'))}</p>`;
}
function axClose(){ const o = $('#axx'); if (o){ o.hidden = true; document.body.classList.remove('cp-lock'); const b = $('#axb'); if (b && !b.hidden) b.focus(); } }
const axSave = () => { try { saveSet(); } catch (e) {} axApply(); axPanel(); axBtnLabel(); };
/* read the open screen aloud: its title, the main result and the visible text of the panel */
function axRead(){
  const ss = window.speechSynthesis; if (ss.speaking){ ss.cancel(); return; }
  const p = $(`#panel-${tab}`) || document.querySelector('main') || document.body, title = ($('#page-title') || {}).textContent || '';
  const txt = (title + '. ' + (p.innerText || '')).replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ' ').replace(/\s+/g, ' ').slice(0, 6000);
  const u = new SpeechSynthesisUtterance(txt); try { u.lang = bcp(lang); } catch (e) { u.lang = lang; }
  const v = (ss.getVoices() || []).find(x => x.lang && x.lang.toLowerCase().startsWith(lang.split('-')[0])); if (v) u.voice = v;
  axClose(); ss.speak(u); toast(t('ax_reading'));
}
document.addEventListener('click', e => {
  const t0 = e.target; if (!t0.closest) return; let b;
  if (t0.closest('#axb') || t0.closest('[data-axopen]')){ axOpen(); return; }
  if (t0.closest('#axx_x') || t0.id === 'axx'){ axClose(); return; }
  if (!t0.closest('#axx')) return;
  if ((b = t0.closest('[data-axz]'))){ const z = +SET.axZoom || 100, i = Math.max(0, Math.min(AX_ZOOM.length - 1, AX_ZOOM.indexOf(z) + +b.dataset.axz)); SET.axZoom = AX_ZOOM[i]; axSave(); const nb = $(`#axx [data-axz="${b.dataset.axz}"]`); if (nb && !nb.disabled) nb.focus(); return; }
  if ((b = t0.closest('[data-axo]'))){ const o = AX_OPTS.find(x => x[0] === b.dataset.axo); if (o){ o[3](); axSave(); const nb = $(`#axx [data-axo="${o[0]}"]`); if (nb) nb.focus(); } return; }
  if (t0.closest('[data-axread]')){ axRead(); return; }
  if (t0.closest('#ax_reset')){ SET.axZoom = 100; SET.contrast = 'normal'; SET.font = 'default'; SET.motion = 'full'; ['axLinks', 'axSpace', 'axFocus', 'axGray', 'axCursor'].forEach(k => SET[k] = '0'); axSave(); toast(t('ax_resetDone')); return; }
  if (t0.closest('[data-axdoc]')){ axClose(); try { lgOpen('a11y'); } catch (er) {} return; }
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'ax_hidebtn'){ SET.axBtn = e.target.checked ? '0' : '1'; axSave(); if (e.target.checked) toast(t('ax_hidden')); } });
document.addEventListener('keydown', e => {
  const o = $('#axx'); if (!o || o.hidden) return;
  if (e.key === 'Escape'){ axClose(); return; }
  if (e.key === 'Tab'){ const f = [...o.querySelectorAll('button:not([disabled]),input,[tabindex="0"]')].filter(x => x.offsetParent); if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
});
/* also reachable from Settings → System, next to the accessibility statement (so it can come back after being hidden) */
{ const lmAx = lgMount; lgMount = function(){ const r = lmAx.apply(this, arguments); const s = $('#lg_sec .lg-docs'); if (s && !s.querySelector('[data-axopen]')) s.insertAdjacentHTML('afterbegin', `<button type="button" class="btn" data-axopen="1">♿ ${axE(t('ax_title'))}</button>`); return r; }; }
{ const alAx = applyLang; applyLang = function(){ const r = alAx.apply(this, arguments); try { axBtnLabel(); const o = $('#axx'); if (o && !o.hidden) axPanel(); const s = $('#lg_sec [data-axopen]'); if (s) s.innerHTML = '♿ ' + axE(t('ax_title')); } catch (e) {} return r; }; }
try { axBtnMount(); axApply(); } catch (e) {}
