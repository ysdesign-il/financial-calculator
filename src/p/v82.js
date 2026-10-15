/* ================= 8.2: tidy Settings — every section folds; tap the title to open it =================
   sections start closed (a category with a single section opens it), the design and theme galleries fold too,
   and what you opened stays open for this visit. Search still lands on the right field: it opens <details> on the way. */
const ACC_KEY = 'fin-acc-open';
function accOpenSet(){ try { return new Set(JSON.parse(sessionStorage.getItem(ACC_KEY) || '[]')); } catch (e) { return new Set(); } }
function accRemember(id, open){ const s = accOpenSet(); if (open) s.add(id); else s.delete(id); try { sessionStorage.setItem(ACC_KEY, JSON.stringify([...s])); } catch (e) {} }
function accSum(sec){
  const k = sec.dataset.sk;
  if (k === 'set_look'){
    const d = (typeof dzOn === 'function' && dzOn()) || 'default', th = (typeof HOL_ACTIVE !== 'undefined' && HOL_ACTIVE) || SET.theme || 'system';
    return t('dz_' + d) + ' · ' + t(th === 'system' ? 'o_th_sys' : 'sk_' + th);
  }
  const labs = $$('.sec-body .field > label, .sec-body .field label:first-child', sec).map(l => l.textContent.trim()).filter(Boolean);
  const uniq = [...new Set(labs)];
  return uniq.slice(0, 3).join(' · ') + (uniq.length > 3 ? ' …' : '');
}
function accSub(host, key, summary, nodes){
  if (!host || !nodes.length || nodes[0].closest('details.sub-acc')) return;
  const d = document.createElement('details'); d.className = 'sub-acc'; d.dataset.acc = key;
  const s = document.createElement('summary'); s.className = 'sub-acc-s'; d.appendChild(s);
  nodes[0].before(d); nodes.forEach(n => d.appendChild(n));
  d.open = accOpenSet().has(key);
  d.addEventListener('toggle', () => accRemember(key, d.open));
}
function accTexts(){
  $$('.set-sec > details.sec-acc').forEach(d => { const sm = $('.sec-sum', d); if (sm) sm.textContent = accSum(d.parentElement); });
  const dz = $('details.sub-acc[data-acc="dz"] > summary'), th = $('details.sub-acc[data-acc="th"] > summary');
  if (dz) dz.textContent = t('acc_design', {n: t('dz_' + ((typeof dzOn === 'function' && dzOn()) || 'default'))});
  if (th){ const k = (typeof HOL_ACTIVE !== 'undefined' && HOL_ACTIVE) || SET.theme || 'system'; th.textContent = t('acc_theme', {n: t(k === 'system' ? 'o_th_sys' : 'sk_' + k)}); }
}
function accBuild(){
  const sp = $('#panel-settings'); if (!sp) return;
  const open = accOpenSet();
  $$('.set-cat .set-sec', sp).forEach(sec => {
    if (sec.querySelector(':scope > details.sec-acc')) return;
    const h = sec.querySelector(':scope > .sec-h'); if (!h) return;
    const cat = sec.closest('.set-cat'), only = cat && $$('.set-sec', cat).length === 1;
    const d = document.createElement('details'); d.className = 'sec-acc';
    const s = document.createElement('summary'); s.className = 'sec-sumr';
    const body = document.createElement('div'); body.className = 'sec-body';
    [...sec.childNodes].forEach(n => { if (n !== h) body.appendChild(n); });
    s.appendChild(h); const sm = document.createElement('small'); sm.className = 'sec-sum'; s.appendChild(sm);
    s.insertAdjacentHTML('beforeend', '<svg class="acc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
    d.appendChild(s); d.appendChild(body); sec.appendChild(d);
    const id = sec.dataset.sk || '';
    d.open = only || open.has(id);
    d.addEventListener('toggle', () => accRemember(id, d.open));
  });
  /* inside Look: the design gallery and the theme gallery fold on their own */
  const look = $('.set-sec[data-sk="set_look"] .sec-body', sp);
  if (look){
    accSub(look, 'dz', '', [$('.dz-h', look), $('#dzGal', look)].filter(Boolean));
    accSub(look, 'th', '', [$('#skins', look)].filter(Boolean));
  }
  accTexts();
}
/* search, links and anything that focuses a field inside a closed section opens it */
document.addEventListener('focusin', e => { let d = e.target.closest && e.target.closest('details'); while (d){ d.open = true; d = d.parentElement && d.parentElement.closest('details'); } });
const _actAcc = activate;
activate = function(id){ const r = _actAcc.apply(this, arguments); if (id === 'settings') try { accBuild(); } catch (e) {} return r; };
const _rsAcc = renderStamp;
renderStamp = function(){ const r = _rsAcc.apply(this, arguments); try { accBuild(); } catch (e) {} return r; };
const _atAcc = applyTheme;
applyTheme = function(){ const r = _atAcc.apply(this, arguments); try { accTexts(); } catch (e) {} return r; };
try { accBuild(); } catch (e) {}
