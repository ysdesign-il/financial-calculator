// AI for every visitor, through the site's own server: the AI key is kept only here, as a secret of the server (AI_KEY),
// never in the page. Each visitor has a daily limit, and the whole site has one, so the cost stays under control.
// Nothing the visitor asks is stored: only two counters a day (a fingerprint of the visitor's address, never the address).
// Off until the owner adds the AI_KEY secret; while it is off, the site works as before (answers on the device, or the visitor's own key).
// Settings (optional, as server variables): AI_ON ("0" switches it off), AI_USER_DAY (requests a visitor a day, default 25),
// AI_DAY (requests for the whole site a day, default 400), AI_MAX_KB (largest request, default 1500 – pictures for reading documents).
const G = 'https://generativelanguage.googleapis.com/v1beta/';
const OKP = /^models\/gemini-[\w.\-]*flash[\w.\-]*:generateContent$/;   // only the fast, low-cost models; only "write an answer"
const J = (o, s = 200) => new Response(JSON.stringify(o), {status: s, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}});
const on = env => !!(env && env.AI_KEY) && String(env.AI_ON || '1') !== '0';
async function fp(s){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join(''); }
export function aiStatus(env){ return J({on: on(env)}); }
export async function aiProxy(req, env){
  if (req.method !== 'POST') return J({e: 'method'}, 405);
  if (!on(env)) return J({e: 'off'}, 503);
  const u = new URL(req.url), org = req.headers.get('origin') || '';
  if (org && new URL(org).host !== u.host) return J({e: 'origin'}, 403);           // only the site itself may use it
  const max = (+env.AI_MAX_KB || 1500) * 1024, len = +(req.headers.get('content-length') || 0);
  if (len > max) return J({e: 'big'}, 413);
  let q; try { const t = await req.text(); if (t.length > max) return J({e: 'big'}, 413); q = JSON.parse(t); } catch (e) { return J({e: 'bad'}, 400); }
  const p = String(q && q.p || ''); if (!OKP.test(p)) return J({e: 'path'}, 400);
  let body; try { body = JSON.parse(String(q.b || '')); } catch (e) { return J({e: 'bad'}, 400); }
  if (!body || !Array.isArray(body.contents) || body.contents.length > 24) return J({e: 'bad'}, 400);
  /* daily limits (approximate: the counters are eventually consistent, which is fine for a cost guard) */
  const day = new Date().toISOString().slice(0, 10), who = await fp((req.headers.get('cf-connecting-ip') || '') + '|' + day + '|' + (env.AI_SALT || 'fin'));
  const kv = env.CFG, kU = 'aiq:' + day + ':' + who, kA = 'aiq:' + day + ':all';
  let nU = 0, nA = 0;
  if (kv){ [nU, nA] = (await Promise.all([kv.get(kU), kv.get(kA)])).map(x => +x || 0);
    if (nU >= (+env.AI_USER_DAY || 25)) return J({e: 'quota_user'}, 429);
    if (nA >= (+env.AI_DAY || 400)) return J({e: 'quota_site'}, 429); }
  delete body.tools; delete body.cachedContent;                                      // plain answers only
  const r = await fetch(G + p, {method: 'POST', headers: {'content-type': 'application/json', 'x-goog-api-key': env.AI_KEY}, body: JSON.stringify(body)});
  if (kv && r.ok){ const ttl = {expirationTtl: 60 * 60 * 36}; await Promise.all([kv.put(kU, String(nU + 1), ttl), kv.put(kA, String(nA + 1), ttl)]); }
  const out = await r.text();
  return new Response(out, {status: r.status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}});
}
