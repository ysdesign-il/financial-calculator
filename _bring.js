// "Who brings what": a shared list that several people edit through a link, without signing up.
// Stored in Cloudflare D1 (binding DB, table lists). Only a fingerprint of the organiser's key is kept; no names of accounts, no personal details.
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(String(s))));
const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'};
const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: Object.assign({'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}, CORS)});
const ID_RX = /^[A-Za-z0-9]{12,24}$/, ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const rid = n => { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(x => ABC[x % ABC.length]).join(''); };
const S = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const Q = v => Math.max(1, Math.min(99, Math.round(+v) || 1));
const DAY = 864e5, KEEP = 150 * DAY, MAX_ITEMS = 80, MAX_CLAIMS = 30;
function clean(d){
  d = d && typeof d === 'object' ? d : {};
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, MAX_ITEMS).map(it => ({
    i: it && typeof it.i === 'string' && /^[A-Za-z0-9]{4,10}$/.test(it.i) ? it.i : rid(6), x: S(it && it.x, 60), q: Q(it && it.q), a: S(it && it.a, 24),
    c: (Array.isArray(it && it.c) ? it.c : []).slice(0, MAX_CLAIMS).map(c => ({n: S(c && c.n, 24), q: Q(c && c.q)})).filter(c => c.n)
  })).filter(it => it.x);
  return {t: S(d.t, 60), d: /^\d{4}-\d{2}-\d{2}$/.test(d.d) ? d.d : '', n: S(d.n, 200), items};
}
function apply(d, b, owner){
  const it = () => d.items.find(x => x.i === b.item);
  switch (b.op){
    case 'claim': { const x = it(); if (!x) return 'gone'; const n = S(b.name, 24); if (!n) return 'name'; x.c = x.c.filter(c => c.n !== n); x.c.push({n, q: Q(b.q)}); x.c = x.c.slice(-MAX_CLAIMS); return ''; }
    case 'unclaim': { const x = it(); if (!x) return ''; const n = S(b.name, 24); x.c = x.c.filter(c => c.n !== n); return ''; }
    case 'add': { if (d.items.length >= MAX_ITEMS) return 'full'; const x = S(b.text, 60); if (!x) return 'text'; d.items.push({i: rid(6), x, q: Q(b.q), a: S(b.name, 24), c: []}); return ''; }
    case 'del': { if (!owner) return 'owner'; d.items = d.items.filter(x => x.i !== b.item); return ''; }
    case 'meta': { if (!owner) return 'owner'; d.t = S(b.t, 60) || d.t; d.d = /^\d{4}-\d{2}-\d{2}$/.test(b.d) ? b.d : (b.d === '' ? '' : d.d); d.n = S(b.n, 200); return ''; }
    default: return 'op';
  }
}
export async function bringApi(req, env){
  if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers: CORS});
  if (!env.DB) return J({err: 'off'}, 503);
  const p = new URL(req.url).pathname.replace(/\/+$/, ''), id = p.split('/')[3] || '';
  try {
    if (req.method === 'GET'){
      if (!ID_RX.test(id)) return J({err: 'id'}, 400);
      const r = await env.DB.prepare('SELECT v, data FROM lists WHERE id = ?').bind(id).first();
      return r ? J({v: r.v, data: JSON.parse(r.data)}) : J({err: 'gone'}, 404);
    }
    if (req.method !== 'POST') return J({err: 'method'}, 405);
    const txt = await req.text(); if (txt.length > 24000) return J({err: 'big'}, 413);
    let b; try { b = JSON.parse(txt); } catch (e) { return J({err: 'json'}, 400); }
    const now = Date.now();
    if (!id){                                                    // a new list
      if (typeof b.key !== 'string' || b.key.length < 16 || b.key.length > 80) return J({err: 'key'}, 400);
      const data = clean(b.data), nid = rid(14);
      await env.DB.prepare('INSERT INTO lists (id, v, data, owner, created, updated) VALUES (?, 1, ?, ?, ?, ?)').bind(nid, JSON.stringify(data), await sha(b.key), now, now).run();
      if (Math.random() < 0.05) await env.DB.prepare('DELETE FROM lists WHERE updated < ?').bind(now - KEEP).run();
      return J({id: nid, v: 1, data});
    }
    if (!ID_RX.test(id)) return J({err: 'id'}, 400);
    for (let k = 0; k < 5; k++){                                  // change it, without losing what someone else did at the same moment
      const r = await env.DB.prepare('SELECT v, data, owner FROM lists WHERE id = ?').bind(id).first();
      if (!r) return J({err: 'gone'}, 404);
      const owner = typeof b.key === 'string' && b.key && (await sha(b.key)) === r.owner;
      if (b.op === 'drop'){ if (!owner) return J({err: 'owner'}, 403); await env.DB.prepare('DELETE FROM lists WHERE id = ?').bind(id).run(); return J({ok: 1}); }
      const d = clean(JSON.parse(r.data)), e = apply(d, b, owner);
      if (e) return J({err: e, v: r.v, data: d}, e === 'owner' ? 403 : 400);
      const s = JSON.stringify(clean(d)); if (s.length > 20000) return J({err: 'big'}, 413);
      const u = await env.DB.prepare('UPDATE lists SET data = ?, v = v + 1, updated = ? WHERE id = ? AND v = ?').bind(s, now, id, r.v).run();
      if (u.meta && u.meta.changes === 1) return J({v: r.v + 1, data: JSON.parse(s)});
    }
    return J({err: 'busy'}, 409);
  } catch (e) { return J({err: 'server'}, 500); }
}
