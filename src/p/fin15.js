/* ---------- 13.92: suspicious activity, for the owner only ----------
   1. The server counts refused and blocked requests (wrong admin sign-ins, sign-in lock, too many requests, requests from
      another site, oversized requests, blocked files) – no address and no personal data, only time, kind, route and a count.
   2. When something crosses a line it adds one alert to the owner's inbox (at most one an hour of each kind); here the alert
      is shown in the reader's language.
   3. The inbox (admin version only) shows a short "Suspicious activity" list: the last 7 days, grouped by kind and route. */
(function(){
  const adm = () => typeof f12Adm === 'function' && f12Adm();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const tx = (k, o) => { try { return T[k] ? t(k, o || {}) : ''; } catch (e) { return ''; } };
  const when = ms => { try { return svdDate(ms); } catch (e) { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); } };
  /* alerts written by the server carry their kind: show them in the reader's language */
  const ibLoad0 = ibLoad;
  ibLoad = async function(){
    const L = await ibLoad0.apply(this, arguments);
    try { (L || []).forEach(i => { if (i && i.sx && T['sx_al_' + i.sx]) i.m = tx('sx_al_' + i.sx, {n: +i.n || 0}); }); } catch (e) {}
    return L;
  };
  const SX = {d: null, at: 0, err: false, busy: false};
  async function sxLoad(force){
    if (!adm() || SX.busy || (!force && SX.d && Date.now() - SX.at < 60000)) return;
    SX.busy = true;
    try {
      const r = await fetch('/admin/suspicious.json?v=' + Date.now(), {cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer'});
      if (r.ok && /json/.test(r.headers.get('content-type') || '')){ SX.d = await r.json(); SX.err = false; } else SX.err = true;
    } catch (e) { SX.err = true; }
    SX.at = Date.now(); SX.busy = false; sxDraw();
  }
  function sxHTML(){
    const d = SX.d, G = d && Array.isArray(d.groups) ? d.groups : [], A = d && Array.isArray(d.alerts) ? d.alerts : [];
    if (!d) return `<p class="fine">${SX.err ? esc(tx('sx_fail')) : '…'}</p>`;
    if (!G.length) return `<p class="fine">${esc(tx('sx_none'))}</p>`;
    const sent = new Set(A.map(a => a.kind));
    return `<ul class="sec-list sx-list">${G.map(g => `<li><b dir="auto">${esc(tx('sx_k_' + g.kind) || g.kind)} · ${esc(tx('sx_times', {n: g.n}))}${sent.has(g.kind) ? ' 🔔' : ''}</b>
      <small><bdi dir="ltr">${esc(g.route)}</bdi> · ${esc(tx('sx_last'))} ${esc(when(g.last))}${(g.cc || []).length ? ' · ' + esc(g.cc.join(', ')) : ''}</small></li>`).join('')}</ul>
      ${A.length ? `<p class="fine">🔔 ${esc(tx('sx_alerted'))}</p>` : ''}`;
  }
  function sxDraw(){
    const box = document.getElementById('ibx_b'); if (!box || !adm()) return;
    let el = document.getElementById('sx_box');
    if (!el){ box.insertAdjacentHTML('afterbegin', `<details class="bk-box sx-box" id="sx_box"><summary>🛡️ <b>${esc(tx('sx_title'))}</b></summary><p class="fine">${esc(tx('sx_note'))}</p><div id="sx_list"></div></details>`); el = document.getElementById('sx_box'); if (SX.open) el.open = true; }
    const l = document.getElementById('sx_list'); if (l) l.innerHTML = sxHTML();
  }
  const ibDraw0 = ibDraw;
  ibDraw = function(){ const r = ibDraw0.apply(this, arguments); try { if (adm()){ sxDraw(); sxLoad(false); } } catch (e) {} return r; };
  document.addEventListener('toggle', e => { const el = e.target; if (el && el.id === 'sx_box'){ SX.open = el.open; if (el.open) sxLoad(true); } }, true);
})();
