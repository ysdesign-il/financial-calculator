/* ================= 8.5: Claude on the website too, the same as inside the Claude app =================
   Inside Claude the app asks Claude through the viewer's own Claude account. A website has no such account, so here the person
   can add their OWN Claude API key. It stays on this device only: its own storage slot, never synced, never exported, never in
   the code. With it, the same assistant (screen, numbers, filling fields) runs on the website. Without it, the AI sheet offers
   to open the app inside Claude, where no key is needed. */
const AK_LS = 'fin-akey', AK_APP = 'https://claude.ai/artifact/RftN1HAGyqVLpE5DDGtBRg';
const AK_MODELS = {quick: 'claude-haiku-5-5', default: 'claude-sonnet-5-5', complex: 'claude-opus-5-5'};
const akGet = () => { try { return String(RAWLS.getItem(AK_LS) || '').replace(/\s+/g, ''); } catch (e) { return ''; } };
const akPut = v => { try { if (v) RAWLS.setItem(AK_LS, v); else RAWLS.removeItem(AK_LS); } catch (e) {} };
var AK = {st: '', e: ''};
async function akCall(key, body, signal){
  const r = await fetch('https://api.anthropic.com/v1/messages', {method: 'POST', signal,
    headers: {'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'},
    body: JSON.stringify(body)});
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!r.ok){
    const m = (j && j.error && j.error.message) || ('HTTP ' + r.status);
    throw {code: r.status === 401 || r.status === 403 ? 'bad_key' : r.status === 429 ? 'rate_limited' : r.status === 400 && /credit|balance|billing/i.test(m) ? 'no_credit' : 'upstream_error', message: m};
  }
  return j;
}
/* the same shape as Claude's in-app "sample", so every AI feature of the app works unchanged */
async function akSample(input, opts){
  opts = opts || {};
  const key = akGet(); if (!key) throw {code: 'not_granted', message: 'no key'};
  const msgs = [];
  (typeof input === 'string' ? [{role: 'user', content: input}] : input).forEach(m => {
    const l = msgs[msgs.length - 1];
    if (l && l.role === m.role && typeof l.content === 'string') l.content += '\n\n' + m.content; else msgs.push({role: m.role, content: String(m.content)});
  });
  const model = AK_MODELS[opts.modelTier] || AK_MODELS.default;
  const tools = (opts.tools || []).map(x => ({name: x.name, description: x.description, input_schema: x.inputSchema || {type: 'object', properties: {}}}));
  let text = '';
  for (let round = 0; round < 6; round++){
    if (opts.signal && opts.signal.aborted) throw {code: 'cancelled', message: 'cancelled', text};
    const body = {model, max_tokens: 1500, messages: msgs}; if (tools.length) body.tools = tools;
    let j;
    try { j = await akCall(key, body, opts.signal); }
    catch (e) {
      if (e && e.name === 'AbortError') throw {code: 'cancelled', message: 'cancelled', text};
      if (e instanceof TypeError) throw {code: 'upstream_error', message: 'network', text};
      throw Object.assign({text}, e);
    }
    const parts = j.content || [], add = parts.filter(p => p.type === 'text').map(p => p.text).join('');
    if (add){ text += (text ? '\n\n' : '') + add; try { if (opts.onText) opts.onText({text, delta: add}); } catch (e) {} }
    const uses = parts.filter(p => p.type === 'tool_use');
    if (j.stop_reason !== 'tool_use' || !uses.length) break;
    msgs.push({role: 'assistant', content: parts});
    const results = [];
    for (const u of uses){
      const tl = (opts.tools || []).find(x => x.name === u.name); let out, bad = false;
      try { out = tl ? await tl.execute(u.input || {}, {signal: opts.signal || new AbortController().signal}) : 'Error: unknown tool'; }
      catch (e) { out = 'Error: ' + ((e && e.message) || e); bad = true; }
      results.push({type: 'tool_result', tool_use_id: u.id, content: typeof out === 'string' ? out : JSON.stringify(out), is_error: bad});
    }
    msgs.push({role: 'user', content: results});
  }
  if (!text) throw {code: 'empty_completion', message: 'empty'};
  return {text, truncated: false, modelTierApplied: opts.modelTier || 'default'};
}
function akActivate(){
  if (IN_CLAUDE) return;
  if (akGet()){ CAI.fn = akSample; CAI.tools = true; CAI.denied = false; }
  else if (CAI.fn === akSample){ CAI.fn = null; CAI.tools = false; }
  try { aiInappMig(); } catch (e) {}
  try { engRender(); } catch (e) {} try { aiEngSync(); } catch (e) {} try { aiFabSync(); } catch (e) {}
}
const _aiCode85 = aiCodeText;
aiCodeText = function(c){ return c === 'bad_key' ? t('ak_eBad') : c === 'no_credit' ? t('ak_eCredit') : _aiCode85.apply(this, arguments); };
/* ---------- Settings → AI assistant: your Claude key (website only) ---------- */
function akUi(){
  if (IN_CLAUDE) return;
  const gk = $('#gk_wrap'), host = (gk && gk.parentElement) || $('#ai_sec'); if (!host) return;
  let w = $('#ak_wrap');
  if (!w){
    host.insertAdjacentHTML('beforeend', `<div id="ak_wrap" class="ak-wrap"><h4 class="skins-h" id="ak_h"></h4><p class="fine" id="ak_intro"></p>
      <div class="field wide"><label for="ak_key" id="ak_l"></label><input id="ak_key" type="password" autocomplete="off" spellcheck="false" class="lookup" dir="ltr" placeholder="sk-ant-…" data-pii-ok><small class="hint" id="ak_hint"></small></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="ak_ok"></button><button type="button" class="btn" id="ak_del"></button></div>
      <p class="gk-st" id="ak_st" role="status" aria-live="polite"></p>
      <p class="fine"><a class="src-a" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"><span id="ak_ln"></span> ↗</a> · <a class="src-a" href="${AK_APP}" target="_blank" rel="noopener noreferrer"><span id="ak_app"></span> ↗</a></p></div>`);
    w = $('#ak_wrap');
  }
  $('#ak_h').textContent = t('ak_h'); $('#ak_intro').textContent = t('ak_intro'); $('#ak_l').textContent = t('f_akey'); $('#ak_hint').textContent = t('h_akey');
  $('#ak_ok').textContent = t('ak_ok'); $('#ak_del').textContent = t('ak_del'); $('#ak_ln').textContent = t('ak_ln'); $('#ak_app').textContent = t('ak_openApp');
  const st = $('#ak_st'), has = !!akGet();
  st.className = 'gk-st' + (AK.st === 'ok' || (has && !AK.st) ? ' ok' : AK.st && AK.st !== 'wait' && AK.st !== 'del' ? ' bad' : '');
  st.textContent = AK.st === 'wait' ? t('ak_wait') : AK.st === 'ok' ? '✓ ' + t('ak_good') : AK.st === 'del' ? t('ak_gone') : AK.st ? '✗ ' + t(AK.st) + (AK.e ? ' (' + AK.e + ')' : '') : has ? '✓ ' + t('ak_saved') : '';
  $('#ak_del').style.display = has ? '' : 'none'; $('#ak_ok').disabled = AK.st === 'wait';
}
async function akApprove(){
  const inp = $('#ak_key'); if (!inp || AK.st === 'wait') return;
  const key = inp.value.replace(/\s+/g, '');
  if (!/^sk-ant-/.test(key)){ AK = {st: 'ak_eFormat', e: ''}; return akUi(); }
  AK = {st: 'wait', e: ''}; akUi();
  try {
    await akCall(key, {model: AK_MODELS.quick, max_tokens: 5, messages: [{role: 'user', content: 'Reply with OK.'}]});
    akPut(key); inp.value = ''; AK = {st: 'ok', e: ''};
    SET.aiEngine = 'inapp'; saveSet(); akActivate();
  } catch (e) {
    AK = {st: e && e.code === 'bad_key' ? 'ak_eBad' : e && e.code === 'no_credit' ? 'ak_eCredit' : e && e.code === 'rate_limited' ? 'ak_eBusy' : e instanceof TypeError ? 'ak_eNet' : 'ak_eOther', e: (e && e.message && e.code !== 'bad_key') ? String(e.message).slice(0, 80) : ''};
  }
  akUi();
}
function akDelete(){ akPut(''); AK = {st: 'del', e: ''}; akActivate(); akUi(); }
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#ak_ok')) akApprove();
  else if (e.target.closest && e.target.closest('#ak_del')) akDelete();
});
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'ak_key' && e.key === 'Enter'){ e.preventDefault(); akApprove(); } });
/* ---------- the AI sheet on the website without a key: open the app inside Claude ---------- */
const _aiEng85 = aiEngSync;
aiEngSync = function(){
  const r = _aiEng85.apply(this, arguments);
  if (!IN_CLAUDE){
    const n = $('#aix_note'); let a = $('#aix_claude');
    if (n && !claudeOk()){
      if (!a){ n.insertAdjacentHTML('afterend', `<p class="fine ak-go" id="aix_claude"><a class="xai-b" href="${AK_APP}" target="_blank" rel="noopener noreferrer"></a> <span></span></p>`); a = $('#aix_claude'); }
      a.hidden = false; $('a', a).textContent = t('ak_openApp') + ' ↗'; $('span', a).textContent = t('ak_orKey');
    } else if (a) a.hidden = true;
  }
  return r;
};
const _actAk = activate;
activate = function(id){ const r = _actAk.apply(this, arguments); if (id === 'settings') try { akUi(); } catch (e) {} return r; };
const _alAk = applyLang;
applyLang = function(){ const r = _alAk.apply(this, arguments); try { akUi(); aiEngSync(); } catch (e) {} return r; };
try { akActivate(); akUi(); } catch (e) {}
