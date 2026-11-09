// The security alerts live on the server only (not as a file of the site or of the code repository).
// • The repository's security watch (GitHub Actions) reads and adds alerts here. It proves who it is with GitHub's own signed
//   token for that run (OIDC) – no password or key is shared: the server checks GitHub's signature, that the token is for this
//   repository's security workflow, for this server ("aud"), and not expired.
// • The owner reads them in developer mode of the locked admin version (/admin/security.json, behind the admin sign-in).
// • A serious alert also goes to the owner's phone as a notification (when the phone has notifications on).
import {pushAll} from './_push.js';
const REPO = 'ysdesign-il/financial-calculator', AUD = 'fin-sec', ISS = 'https://token.actions.githubusercontent.com';
const KEY = 'sec:alerts';
const J = (o, s = 200) => new Response(JSON.stringify(o), {status: s, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}});
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
let JWKS = null, JWKS_AT = 0;
async function verifyGh(req){
  const a = req.headers.get('authorization') || '', tok = a.startsWith('Bearer ') ? a.slice(7).trim() : '';
  const parts = tok.split('.'); if (parts.length !== 3) return null;
  let h, c; try { h = JSON.parse(new TextDecoder().decode(b64u(parts[0]))); c = JSON.parse(new TextDecoder().decode(b64u(parts[1]))); } catch (e) { return null; }
  if (h.alg !== 'RS256' || !h.kid) return null;
  if (!JWKS || Date.now() - JWKS_AT > 36e5){ const r = await fetch(ISS + '/.well-known/jwks'); if (!r.ok) return null; JWKS = (await r.json()).keys || []; JWKS_AT = Date.now(); }
  const jwk = JWKS.find(k => k.kid === h.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) return null;
  const now = Date.now() / 1000;
  if (c.iss !== ISS || c.aud !== AUD || c.repository !== REPO || !(c.exp > now) || (c.nbf && c.nbf > now + 60)) return null;
  if (!String(c.workflow_ref || '').startsWith(REPO + '/.github/workflows/security.yml@')) return null;
  return c;
}
async function load(env){ try { return JSON.parse(await env.CFG.get(KEY) || 'null') || {alerts: [], updated: 0}; } catch (e) { return {alerts: [], updated: 0}; } }
/* /api/sec – for the repository's security watch only */
export async function secApi(req, env){
  if (!(env && env.CFG)) return J({e: 'nostore'}, 503);
  const who = await verifyGh(req); if (!who) return J({e: 'auth'}, 401);
  const D = await load(env);
  if (req.method === 'GET') return J(D);
  if (req.method !== 'POST') return J({e: 'method'}, 405);
  let q; try { const t = await req.text(); if (t.length > 200000) return J({e: 'big'}, 413); q = JSON.parse(t); } catch (e) { return J({e: 'bad'}, 400); }
  const clean = a => ({at: +a.at || 0, level: String(a.level || 'low').slice(0, 10), kind: String(a.kind || '').slice(0, 40), actor: String(a.actor || '').slice(0, 60), msg: String(a.msg || '').slice(0, 300),
    p: Object.fromEntries(Object.entries(a.p && typeof a.p === 'object' ? a.p : {}).slice(0, 10).map(([k, v]) => [String(k).slice(0, 30), String(v).slice(0, 200)]))});
  const add = (Array.isArray(q.alerts) ? q.alerts : []).slice(0, 50).map(clean), seed = (Array.isArray(q.seed) && !D.alerts.length ? q.seed : []).slice(0, 100).map(clean);
  const sig = new Set(D.alerts.map(a => a.at + '|' + a.kind + '|' + a.msg)), fresh = add.filter(a => !sig.has(a.at + '|' + a.kind + '|' + a.msg));
  D.alerts = fresh.concat(D.alerts, seed).sort((x, y) => y.at - x.at).slice(0, 100); D.updated = Math.floor(Date.now() / 1000);
  await env.CFG.put(KEY, JSON.stringify(D));
  const hi = fresh.filter(a => a.level === 'high');
  if (hi.length){ try { await pushAll(env, 'sec', {t: '🛡️ התראת אבטחה', b: hi[0].msg.slice(0, 120) + (hi.length > 1 ? ' (+' + (hi.length - 1) + ')' : ''), u: '/admin/', tag: 'sec'}); } catch (e) {} }
  return J({ok: true, added: fresh.length, total: D.alerts.length});
}
/* /admin/security.json – served only after the admin sign-in (the admin lock calls this) */
export async function secAdmin(env){ return J(env && env.CFG ? await load(env) : {alerts: []}); }
