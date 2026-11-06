/* ---------- 13.80: shared tools – saved scenarios get a date and a "duplicate", and a button that hides the amounts on screen ----------
   • Every scenario saved from now on keeps the date and time it was saved; "duplicate" copies it under a new name.
   • "Hide amounts" blurs the results on every screen (for working in public); what you type stays visible. It is remembered on
     this device only. */
const saveScn7 = saveScenario;
saveScenario = function(id){
  const n0 = (SCN[id] || []).length, r = saveScn7.apply(this, arguments);
  try { const L = SCN[id] || []; if (L.length > n0){ L[L.length - 1].at = Date.now(); saveScn(); renderScn(id); } } catch (e) {}
  return r;
};
const renderScn7 = renderScn;
renderScn = function(id){
  const r = renderScn7.apply(this, arguments);
  try {
    const box = document.getElementById('sc-' + id), L = SCN[id] || []; if (!box) return r;
    box.querySelectorAll('.scn-row').forEach(row => {
      const s = L[+row.dataset.i]; if (!s || row.querySelector('[data-scdup]')) return;
      if (s.at) row.insertAdjacentHTML('beforeend', `<small class="scn-at">${asEsc(new Date(s.at).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}))}</small>`);
      row.querySelector('[data-sc="del"]').insertAdjacentHTML('beforebegin', `<button type="button" class="mv wide" data-scdup="${row.dataset.i}">${asEsc(t('sc_dup'))}</button>`);
    });
  } catch (e) {}
  return r;
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-scdup]'); if (!b) return;
  const id = b.closest('.scn') && b.closest('.scn').dataset.tab, L = id && SCN[id]; if (!L) return;
  const s = L[+b.dataset.scdup]; if (!s) return;
  L.push(Object.assign(JSON.parse(JSON.stringify(s)), {n: (s.n + ' ' + t('sc_copy')).slice(0, 40), at: Date.now()}));
  saveScn(); renderScn(id); try { toast(t('sc_dupDone')); } catch (er) {}
});

/* ---- hide amounts ---- */
(function(){
  let on = false; try { on = localStorage.getItem('fin-hideamt') === '1'; } catch (e) {}
  const apply = () => {
    document.body.classList.toggle('hide-amt', on);
    const b = document.getElementById('hideAmt');
    if (b){ b.setAttribute('aria-pressed', String(on)); const s = b.querySelector('span'); if (s) s.textContent = t(on ? 'ha_show' : 'ha_hide'); b.setAttribute('aria-label', t(on ? 'ha_show' : 'ha_hide')); b.title = t(on ? 'ha_show' : 'ha_hide'); }
  };
  const ensure = () => {
    if (document.getElementById('hideAmt')) return apply();
    const ref = document.getElementById('resetTab'); if (!ref) return;
    ref.insertAdjacentHTML('beforebegin', `<button type="button" class="ghost-btn" id="hideAmt" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg><span></span></button>`);
    apply();
  };
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('#hideAmt')) return;
    on = !on; try { if (on) localStorage.setItem('fin-hideamt', '1'); else localStorage.removeItem('fin-hideamt'); } catch (er) {}
    apply(); try { toast(t(on ? 'ha_onT' : 'ha_offT')); } catch (er) {}
  });
  const st = document.createElement('style');
  st.textContent = 'body.hide-amt :is(.hero-value,.hero-sub,.ledger dd,.lu-t b,.tbl td,.legend .num,.pfx-sum b,.pfx-r b,.lx-v,.scn-v,.svgwrap text.ax){filter:blur(7px);user-select:none}'
    + 'body.hide-amt .svgwrap rect{opacity:.35}#hideAmt[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}.scn-row{flex-wrap:wrap;row-gap:6px}.scn-row .scn-n{flex:1 1 100%;min-width:0}.scn-at{flex-basis:100%;font-size:12px;color:var(--ink-2);font-weight:400}';
  document.head.appendChild(st);
  setTimeout(ensure, 0);
  const al7 = applyLang;
  applyLang = function(){ const r = al7.apply(this, arguments); try { ensure(); } catch (e) {} return r; };
})();
