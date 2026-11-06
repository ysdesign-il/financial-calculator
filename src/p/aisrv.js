/* ---------- 13.81: AI for every visitor through the site's own server (no account and no key of your own) ----------
   When the server has AI switched on (the owner added the key there), the assistant, explanations and document reading use it.
   The visitor agrees once ("allow"), since the question and the screen's numbers go to the AI service. A visitor's own key,
   when there is one, is still used first. Full private mode, or the server off, keeps everything on the device as before.
   How: every request that would go to the AI service with the stand-in key "srv" is sent to /api/ai instead; the server adds
   the real key, checks the daily limits and passes the answer back unchanged – so the rest of the app needs no change. */
var AISRV = {on: false, ui: false};
(function(){
  const GB = 'https://generativelanguage.googleapis.com/v1beta/';
  const priv = () => { try { return typeof PRIV !== 'undefined' && PRIV; } catch (e) { return false; } };
  const gk0 = gemKey;
  gemKey = function(){ const k = gk0(); if (k) return k; return AISRV.on && SET.aiSrvOk && !AISRV.ui && !priv() ? 'srv' : ''; };
  const f0 = window.fetch.bind(window);
  window.fetch = function(u, o){
    try {
      const url = typeof u === 'string' ? u : (u && u.url) || '';
      const h = o && o.headers, key = h && (typeof h.get === 'function' ? h.get('x-goog-api-key') : h['x-goog-api-key']);
      if (key === 'srv' && url.indexOf(GB) === 0){
        if (!o.method || o.method === 'GET') return Promise.resolve(new Response('{"models":[]}', {status: 200, headers: {'content-type': 'application/json'}}));
        return f0('/api/ai', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'omit', referrerPolicy: 'no-referrer', signal: o.signal,
          body: JSON.stringify({p: url.slice(GB.length).split('?')[0], b: typeof o.body === 'string' ? o.body : ''})});
      }
    } catch (e) {}
    return f0.apply(window, arguments);
  };
  /* the key card is for the owner now: visitors do not need a key once the server has AI */
  const gkR = gkRender;
  gkRender = function(){
    AISRV.ui = true; let r; try { r = gkR.apply(this, arguments); } finally { AISRV.ui = false; }
    try { const c = document.getElementById('gk_card'); if (c) c.hidden = AISRV.on && !(typeof DEV_ON !== 'undefined' && DEV_ON) && !gk0(); } catch (e) {}
    return r;
  };
  /* one-time permission, shown in the assistant */
  function consent(){
    const log = document.getElementById('aix_log'); if (!log) return;
    let c = document.getElementById('aisrv_ok');
    const need = AISRV.on && !SET.aiSrvOk && !gk0() && !priv() && !(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE);
    if (!need){ if (c) c.remove(); return; }
    if (c) return;
    log.insertAdjacentHTML('afterbegin', `<div class="aisrv-ok" id="aisrv_ok" role="note"><p>${asEsc(t('aisrv_q'))}</p><p class="fine">${asEsc(t('aisrv_d'))}</p>
      <button type="button" class="gold-btn" id="aisrv_yes">${asEsc(t('aisrv_yes'))}</button></div>`);
  }
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('#aisrv_yes')) return;
    SET.aiSrvOk = 1; SET.aiEngine = 'inapp'; try { saveSet(); } catch (er) {}   // answers here, through the server
    const c = document.getElementById('aisrv_ok'); if (c) c.remove();
    try { aiEngSync(); } catch (er) {} try { toast(t('aisrv_on')); } catch (er) {}
  });
  const aof = aiOpenFor;
  aiOpenFor = function(){ const r = aof.apply(this, arguments); try { consent(); } catch (e) {} return r; };
  const st = document.createElement('style');
  st.textContent = '.aisrv-ok{border:1px solid var(--gold);border-radius:14px;padding:10px 12px;margin:6px 0 10px;background:var(--surface);color:var(--ink)}.aisrv-ok p{margin:0 0 6px}';
  document.head.appendChild(st);
  /* is AI on at the server? (not inside Claude, not in full private mode, not from a file) */
  setTimeout(async () => {
    if (priv() || (typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE) || !/^https?:$/.test(location.protocol)) return;
    try { const r = await f0('/api/ai/status', {cache: 'no-store', credentials: 'omit'}); if (r.ok){ const j = await r.json(); AISRV.on = !!(j && j.on); } } catch (e) {}
    if (AISRV.on){ try { gkRender(); } catch (e) {} try { aiEngSync(); } catch (e) {} try { consent(); } catch (e) {} }
  }, 1200);
})();
/* the assistant's rules, sharpened: it explains the app's real results and never works out numbers of its own */
(function(){
  const r0 = aiRules;
  aiRules = function(){
    return r0.apply(this, arguments) + ' Every number you mention must come from the screen text above (inputs, results, notes) – never calculate, estimate or invent one; if a number the person needs is not there, say which calculator or field gives it. ' +
      'Point out inputs that look like mistakes (for example an interest rate above 30%, a term of 0, a negative amount, a split that does not add up to 100%). ' +
      'When the person weighs options, give short pros and cons and say plainly when they differ in risk or in access to the money. ' +
      'Say which figures are real data (marked with a date or source) and which are the person\'s assumptions. Offer one useful next simulation when it fits.';
  };
})();
