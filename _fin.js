// 13.86: private storage on the server for the developer's inbox and the family sign-in list (they used to be public files).
// • Website feedback is still locked on the sender's phone with the developer's PUBLIC key and handed to the relay. Every half hour
//   this server collects it into its own private storage (KV), instead of a public file in the repository. Only the locked admin
//   version reads it, and only developer mode can unlock it.
// • The family list (fingerprints of name + code, and of the shared family password) is kept only here. The site asks
//   "is this fingerprint on the list?" and gets yes/no, a few times a minute at most – so it can no longer be copied and guessed offline.
// • 13.94 (security fix): the list no longer holds the phone's fingerprint itself – only a one-way server tag of it
//   (SHA-256 of "fam-srv-v1:" + fingerprint), compared in constant time. Before, the fingerprint was both what was stored and
//   what was sent, so anyone who saw a stored value (an old public seed file) could send it and get "yes". Now a stored value
//   cannot be sent back: the phone must derive the fingerprint from the real name/code or password. Lists stored before this
//   change are turned into tags on the first read. The old seed file is gone; a password that was in it must be changed.
// • Signed family changes from developer mode (fcs1) are checked here with the developer's public key, as the old bot did.
// No IP address is stored: the limit lives only in memory, keyed by a one-way fingerprint.
import LEG_INBOX from './_legacy_inbox.json';

const APP = 'calc', TOPIC = 'fc-in-318ca4899cb6f959f4e4de51';
const PUB = {kty: 'RSA', e: 'AQAB', n: 'wxtR5meXd5lblZDdURSscmj48iXULVTtEJtrqAj6Lsm6GnSd18JVzEuhQfgRZJZ-3BXPJNaUWFEwRh2YAYsNpeceOWkrKeq3R4vigswqUDVSphAe-v_UUQoCpRXT3vypPYbBps_6ndsVcn96UjdW1Azz12ZrIn0JJprYVhZEh7UDpVoXM0WUHOxItdNHWfeOJ_D9dZXrYPlup9GANJsPMygFPbIv2bdIwHjoPxhir3ZmmGilH5yqTvOJw1Rc504ofLc9JY3oM1cR0pedexJbU8vZwrU2i5atTNvFRNvlh31HH7HrR5FZ1NZxHnRlyMit-lqGIlxA2THDeLLkqr_INQ'};
const K_IB = 'ib:' + APP, K_RP = 'rp:' + APP, K_FAM = 'fam:' + APP;
const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}});
const enc = new TextEncoder(), hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const b64d = s => Uint8Array.from(atob(String(s)), c => c.charCodeAt(0));
async function kv(env, k, d){ try { const v = await env.CFG.get(k, 'json'); return v == null ? d : v; } catch (e) { return d; } }
const put = (env, k, v) => env.CFG.put(k, JSON.stringify(v));
/* 13.91: the first read copies the old seed files into the private storage, so the seed files can later be deleted
   from the repository without losing anything (they hold fingerprints that should not stay in a public repository) */
async function seeded(env, k, leg){
  const d = leg && Array.isArray(leg.m) ? leg : {v: 1, m: []};
  let v = null; try { v = await env.CFG.get(k, 'json'); } catch (e) { return d; }
  if (v == null){ if (d.m.length){ try { await put(env, k, d); } catch (e) {} } return d; }
  return v;
}
async function inbox(env){ return seeded(env, K_IB, LEG_INBOX); }
/* 13.94: the server tag of a family fingerprint, and a constant-time compare */
const famTag = async h => hex(await crypto.subtle.digest('SHA-256', enc.encode('fam-srv-v1:' + h)));
const HEX64 = /^[0-9a-f]{64}$/;
function sameHex(a, b){ a = String(a || ''); b = String(b || ''); if (a.length !== 64 || b.length !== 64) return false; let d = 0; for (let i = 0; i < 64; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
/* a stored entry keeps only {id, s (tag), at, p}; an entry still holding the raw fingerprint (h) is turned into a tag */
async function famEntry(x){
  if (!x || typeof x !== 'object') return null;
  const s = HEX64.test(String(x.s || '')) ? String(x.s) : HEX64.test(String(x.h || '')) ? await famTag(String(x.h)) : '';
  if (!s) return null;
  return {id: String(x.id || '').slice(0, 24), s, at: +x.at || Date.now(), ...(x.p ? {p: 1} : {})};
}
async function famClean(L){
  const src = L && Array.isArray(L.m) ? L.m : [], m = [];
  let ch = !(L && Array.isArray(L.m));
  for (const x of src){ const e = await famEntry(x); if (!e){ ch = true; continue; } if (x.h || !x.s) ch = true; m.push(e); }
  return {L: {v: 1, m}, ch};
}
async function family(env){
  let v = null; try { v = await env.CFG.get(K_FAM, 'json'); } catch (e) { return {v: 1, m: []}; }
  if (v == null) return {v: 1, m: []};
  const {L, ch} = await famClean(v);
  if (ch){ try { await put(env, K_FAM, L); } catch (e) {} }   // never leave a raw fingerprint in storage
  return L;
}
async function replies(env){ return kv(env, K_RP, {v: 1, r: []}); }

/* ---- the family check: yes or no, rate-limited ---- */
const HITS = new Map();
const ipKey = async req => hex(await crypto.subtle.digest('SHA-256', enc.encode('fam:' + (req.headers.get('cf-connecting-ip') || '?')))).slice(0, 16);
function limited(k){ const now = Date.now(), a = (HITS.get(k) || []).filter(t => now - t < 60e3); a.push(now); HITS.set(k, a); if (HITS.size > 5000) HITS.clear(); return a.length > 10; }
/* 13.94: the platform's shared limit (binding RL_AUTH in wrangler.jsonc), on top of the in-memory one; without the binding only the memory limit applies */
async function rlOk(b, key){ if (!b || typeof b.limit !== 'function') return true; try { const r = await b.limit({key}); return !(r && r.success === false); } catch (e) { return true; } }
export async function famCheck(req, env){
  if (req.method !== 'POST') return J({ok: false}, 405);
  const ik = await ipKey(req);
  if (limited(ik) || !(await rlOk(env && env.RL_AUTH, 'fam:' + ik))) return J({ok: false, e: 'wait'}, 429);
  let h = ''; try { const t = await req.text(); if (t.length > 2000) return J({ok: false}, 413); h = String(JSON.parse(t).h || ''); } catch (e) {}
  if (!HEX64.test(h)) return J({ok: false}, 400);
  const L = await family(env), tag = await famTag(h);
  let ok = false; for (const x of L.m || []) ok = sameHex(x && x.s, tag) || ok;   // every entry is compared, so the time says nothing
  return J({ok});
}
/* ---- admin only (behind the admin lock): read the inbox, read and change the family list ---- */
export async function finAdmin(req, env, path){
  if (path === '/admin/inbox.json') return J(await inbox(env));
  if (path === '/admin/fam'){
    if (req.method === 'GET') return J(await family(env));
    if (req.method === 'PUT'){
      let d = null; try { d = await req.json(); } catch (e) {}
      /* a new entry comes as the phone's fingerprint (h) and is stored only as its tag; entries read back from here come as tags (s) */
      if (!d || !Array.isArray(d.m) || d.m.length > 200 || d.m.some(x => !x || !(HEX64.test(String(x.h || '')) || HEX64.test(String(x.s || ''))))) return J({ok: false}, 400);
      const m = []; for (const x of d.m) m.push(await famEntry(x));
      await put(env, K_FAM, {v: 1, m}); return J({ok: true});
    }
  }
  return null;
}
/* 13.92: a message from this server itself (a suspicious-activity alert) – locked with the inbox's public key exactly like a
   website message, so it shows in the owner's inbox and only the owner can open it */
const ib64 = u => btoa(String.fromCharCode(...new Uint8Array(u)));
export async function inboxAdd(env, obj, id){
  if (!env || !env.CFG) return false;
  const S = crypto.subtle, pk = await S.importKey('jwk', PUB, {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['encrypt']);
  const ak = await S.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt']), iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await S.encrypt({name: 'AES-GCM', iv}, ak, enc.encode(JSON.stringify(obj)));
  const k = await S.encrypt({name: 'RSA-OAEP'}, pk, await S.exportKey('raw', ak));
  const box = await inbox(env); box.m = Array.isArray(box.m) ? box.m : [];
  if (box.m.some(m => m.id === id)) return false;
  box.m.push({id: String(id).slice(0, 40), t: Math.floor(Date.now() / 1000), c: 'fc1.' + ib64(k) + '.' + ib64(iv) + '.' + ib64(c)});
  box.m = box.m.slice(-1000); await put(env, K_IB, box); return true;
}
export async function repliesPublic(env){ const r = await replies(env); return new Response(JSON.stringify(r), {headers: {'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}}); }

/* ---- every half hour: collect from the relay ---- */
async function verify(raw, sig){
  try { const k = await crypto.subtle.importKey('jwk', PUB, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify']); return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, sig, raw); } catch (e) { return false; }
}
async function famCmd(fam, msg){
  const p = msg.split('.'); if (p.length !== 3) return false;
  const raw = b64d(p[1]), sig = b64d(p[2]); if (!(await verify(raw, sig))) return false;
  let c; try { c = JSON.parse(new TextDecoder().decode(raw)); } catch (e) { return false; }
  const at = +c.at || 0; if (Math.abs(Date.now() - at) > 3 * 864e5) return false;
  if (c.k === 'famrevoke'){ const keep = fam.m.filter(x => x.p || (+x.at || 0) > at); if (keep.length === fam.m.length) return false; fam.m = keep; return true; }
  const h = String(c.h || ''); if (c.k !== 'famset' || !/^[0-9a-f]{64}$/.test(h)) return false;
  const cur = fam.m.find(x => x.p); if (cur && (+cur.at || 0) >= at) return false;
  fam.m = fam.m.filter(x => !x.p).concat([{id: 'p', p: 1, s: await famTag(h), at}]); return true;
}
export async function finCron(env){
  if (!env || !env.CFG) return;
  let raw = ''; try { const r = await fetch('https://ntfy.sh/' + TOPIC + '/json?poll=1&since=all', {headers: {'user-agent': 'financial-calculator-inbox/2.0'}}); if (!r.ok) return; raw = await r.text(); } catch (e) { return; }
  const box = await inbox(env), reps = await replies(env), fam = await family(env);
  const have = new Set((box.m || []).map(m => m.id).concat((reps.r || []).map(x => x.e)));
  let nb = 0, nr = 0, nf = false;
  for (const line of raw.split('\n')){
    let e; try { e = JSON.parse(line); } catch (er) { continue; }
    const msg = String(e.message || ''); if (e.event !== 'message' || have.has(e.id) || msg.length > 6000) continue;
    if (msg.startsWith('fr1.') && nr < 40){ const p = msg.split('.'); if (p.length === 4){ reps.r.push({id: p[1].slice(0, 24), c: p[2] + '.' + p[3], t: +e.time || 0, e: e.id}); have.add(e.id); nr++; } continue; }
    if (msg.startsWith('fcs1.')){ if (await famCmd(fam, msg)) nf = true; have.add(e.id); continue; }
    if (msg.startsWith('fc1.') && nb < 40){ box.m.push({id: e.id, t: +e.time || 0, c: msg}); have.add(e.id); nb++; }
  }
  if (nb){ box.m = box.m.slice(-1000); await put(env, K_IB, box); }
  if (nr){ reps.r = reps.r.slice(-1000); await put(env, K_RP, reps); }
  if (nf) await put(env, K_FAM, fam);
}
