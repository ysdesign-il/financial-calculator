// 13.87: optional cloud copy of an account, and documents in the cloud – end-to-end locked.
// The phone locks the account's data with the person's own password before it is sent (the same locked package that
// "move to another device" already makes). This server keeps only that locked package: it cannot read it, and neither can
// the site's owner. The account is found by a one-way fingerprint of the username (the name itself is not stored), and every
// request carries a second fingerprint of the password, of which only a hash is kept.
// Documents are locked on the phone with a random key that lives inside the account's (locked) data, and kept here in parts.
// Each account has a plan ("free" for now) so subscriptions can be added later without changing this.
// No IP address is stored: rate limits live only in memory, keyed by a one-way fingerprint.
const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}});
const enc = new TextEncoder(), hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const isHex = (s, n) => typeof s === 'string' && s.length === n && /^[0-9a-f]+$/.test(s);
const MAX_PKG = 1900000, PART = 900000, MAX_DOC = 6 * 1024 * 1024 * 1.4, MAX_ALL = 30 * 1024 * 1024 * 1.4, MAX_DOCS = 60;
const HITS = new Map(), BAD = new Map();
function hit(m, k, n, ms){ const now = Date.now(), a = (m.get(k) || []).filter(t => now - t < ms); a.push(now); m.set(k, a); if (m.size > 20000) m.clear(); return a.length > n; }
const ipKey = async req => (await sha('acct:' + (req.headers.get('cf-connecting-ip') || '?'))).slice(0, 16);
async function who(env, b){
  if (!isHex(b.id, 64) || !isHex(b.auth, 64)) return {e: 400};
  if ((BAD.get(b.id) || []).filter(t => Date.now() - t < 15 * 60e3).length >= 8) return {e: 429};
  const row = await env.DB.prepare('SELECT id, auth, ver, plan, size FROM acct WHERE id = ?').bind(b.id).first();
  if (!row) return {none: true};
  if (row.auth !== await sha('auth:' + b.auth)){ hit(BAD, b.id, 999, 15 * 60e3); return {e: 403}; }
  return {row};
}
export async function acctApi(req, env, path){
  if (!env.DB) return J({ok: false, e: 'off'}, 503);
  if (req.method !== 'POST') return J({ok: false}, 405);
  const og = req.headers.get('origin'), u = new URL(req.url); if (og && og !== u.origin) return J({ok: false, e: 'origin'}, 403);
  if (hit(HITS, await ipKey(req), 60, 60e3)) return J({ok: false, e: 'wait'}, 429);
  let b = null; try { b = await req.json(); } catch (e) {}
  if (!b || typeof b !== 'object') return J({ok: false}, 400);
  const W = await who(env, b); if (W.e) return J({ok: false, e: W.e === 403 ? 'auth' : W.e === 429 ? 'wait' : 'bad'}, W.e);
  const now = Date.now();
  if (path === '/api/acct/get'){
    if (W.none) return J({ok: false, e: 'none'}, 404);
    const r = await env.DB.prepare('SELECT blob, ver, plan, at FROM acct WHERE id = ?').bind(b.id).first();
    return J({ok: true, ver: r.ver, plan: r.plan, at: r.at, pkg: r.blob});
  }
  if (path === '/api/acct/put'){
    const pkg = typeof b.pkg === 'string' ? b.pkg : ''; if (!pkg || pkg.length > MAX_PKG) return J({ok: false, e: 'size'}, 413);
    if (W.none){
      await env.DB.prepare('INSERT INTO acct (id, auth, asalt, esalt, blob, ver, plan, created, at, size) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)')
        .bind(b.id, await sha('auth:' + b.auth), '-', '-', pkg, 'free', now, now, pkg.length).run();
      return J({ok: true, ver: 1, plan: 'free'});
    }
    const base = +b.base || 0;
    if (base !== W.row.ver){ const r = await env.DB.prepare('SELECT blob, ver FROM acct WHERE id = ?').bind(b.id).first(); return J({ok: false, e: 'conflict', ver: r.ver, pkg: r.blob}, 409); }
    const res = await env.DB.prepare('UPDATE acct SET blob = ?, ver = ver + 1, at = ?, size = ? WHERE id = ? AND ver = ?').bind(pkg, now, pkg.length, b.id, base).run();
    if (!res.meta || !res.meta.changes){ const r = await env.DB.prepare('SELECT blob, ver FROM acct WHERE id = ?').bind(b.id).first(); return J({ok: false, e: 'conflict', ver: r.ver, pkg: r.blob}, 409); }
    return J({ok: true, ver: base + 1, plan: W.row.plan});
  }
  if (W.none) return J({ok: false, e: 'none'}, 404);
  if (path === '/api/acct/del'){
    const ids = (await env.DB.prepare('SELECT id FROM docmeta WHERE owner = ?').bind(b.id).all()).results || [];
    for (const d of ids){ await env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(d.id).run(); }
    await env.DB.batch([env.DB.prepare('DELETE FROM docmeta WHERE owner = ?').bind(b.id), env.DB.prepare('DELETE FROM acct WHERE id = ?').bind(b.id)]);
    return J({ok: true});
  }
  /* ---- documents ---- */
  if (path === '/api/doc/list'){
    const r = (await env.DB.prepare('SELECT id, name, size, parts, at FROM docmeta WHERE owner = ? ORDER BY at DESC').bind(b.id).all()).results || [];
    return J({ok: true, docs: r, used: r.reduce((s, x) => s + x.size, 0), max: MAX_ALL});
  }
  const did = String(b.doc || ''); if (!isHex(did, 32)) return J({ok: false, e: 'bad'}, 400);
  const meta = await env.DB.prepare('SELECT owner, size, parts FROM docmeta WHERE id = ?').bind(did).first();
  if (meta && meta.owner !== b.id) return J({ok: false, e: 'auth'}, 403);
  if (path === '/api/doc/put'){
    const n = +b.n, parts = +b.parts, data = typeof b.data === 'string' ? b.data : '', size = +b.size || 0, name = String(b.name || '').slice(0, 400);
    if (!(n >= 0 && n < parts && parts <= Math.ceil(MAX_DOC / PART) + 1) || !data || data.length > PART + 64 || size > MAX_DOC) return J({ok: false, e: 'size'}, 413);
    if (n === 0){
      const all = await env.DB.prepare('SELECT COUNT(*) AS c, COALESCE(SUM(size), 0) AS s FROM docmeta WHERE owner = ? AND id != ?').bind(b.id, did).first();
      if (all.c >= MAX_DOCS || all.s + size > MAX_ALL) return J({ok: false, e: 'full'}, 413);
      await env.DB.batch([env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(did),
        env.DB.prepare('INSERT OR REPLACE INTO docmeta (id, owner, name, size, parts, at) VALUES (?, ?, ?, ?, ?, ?)').bind(did, b.id, name, size, parts, now)]);
    } else if (!meta) return J({ok: false, e: 'order'}, 409);
    await env.DB.prepare('INSERT OR REPLACE INTO docpart (id, n, data) VALUES (?, ?, ?)').bind(did, n, data).run();
    return J({ok: true});
  }
  if (!meta) return J({ok: false, e: 'none'}, 404);
  if (path === '/api/doc/get'){
    const n = +b.n || 0, r = await env.DB.prepare('SELECT data FROM docpart WHERE id = ? AND n = ?').bind(did, n).first();
    return r ? J({ok: true, parts: meta.parts, data: r.data}) : J({ok: false, e: 'none'}, 404);
  }
  if (path === '/api/doc/del'){
    await env.DB.batch([env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(did), env.DB.prepare('DELETE FROM docmeta WHERE id = ?').bind(did)]);
    return J({ok: true});
  }
  return J({ok: false}, 404);
}

/* ---- share prices and index values, delayed, from a free public source; cached 15 minutes; nothing about the person is sent.
   ?s=SYMBOL           → price, currency, change since yesterday's close
   ?s=SYMBOL&r=1y      → also a year of weekly closes, the return over the year, yearly volatility, the year's high and low ---- */
export async function quote(req){
  const u = new URL(req.url), s = String(u.searchParams.get('s') || '').toUpperCase().trim(), yr = u.searchParams.get('r') === '1y';
  if (!/^[A-Z0-9.\-^=]{1,15}$/.test(s)) return J({ok: false, e: 'bad'}, 400);
  const cache = caches.default, key = new Request('https://q.local/' + s + (yr ? '/1y' : ''));
  let hitR = null; try { hitR = await cache.match(key); } catch (e) {} if (hitR) return hitR;
  let out = {ok: false, e: 'none', s};
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + (yr ? '?range=1y&interval=1d' : '?range=5d&interval=1d'), {headers: {'user-agent': 'Mozilla/5.0 (compatible; financial-calculator/1.0)', accept: 'application/json'}});
    if (r.ok){ const j = await r.json(), R = j && j.chart && j.chart.result && j.chart.result[0], m = R && R.meta;
      if (m && isFinite(+m.regularMarketPrice)){
        let px = +m.regularMarketPrice, cur = String(m.currency || '').toUpperCase(), k = 1;
        if (cur === 'ILA'){ k = 0.01; cur = 'ILS'; }           /* Tel Aviv prices come in agorot */
        const cl = ((R.indicators && R.indicators.quote && R.indicators.quote[0] && R.indicators.quote[0].close) || []).map(x => x == null ? null : +x * k);
        const ts = (R.timestamp || []).map(x => x * 1000), pairs = ts.map((t, i) => [t, cl[i]]).filter(p => isFinite(p[1]) && p[1] > 0);
        const prev = pairs.length >= 2 ? pairs[pairs.length - 2][1] : (+m.chartPreviousClose || 0) * k;
        out = {ok: true, s, px: px * k, cur, at: (+m.regularMarketTime || 0) * 1000, src: 'Yahoo Finance', delayed: true, name: String(m.shortName || m.longName || '').slice(0, 60), ex: String(m.fullExchangeName || m.exchangeName || '').slice(0, 30), prev, chg: prev > 0 ? (px * k / prev - 1) * 100 : null};
        if (yr && pairs.length > 20){
          const v = pairs.map(p => p[1]), lr = []; for (let i = 1; i < v.length; i++) lr.push(Math.log(v[i] / v[i - 1]));
          const mean = lr.reduce((a, b) => a + b, 0) / lr.length, sd = Math.sqrt(lr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, lr.length - 1));
          out.y = {ret: (v[v.length - 1] / v[0] - 1) * 100, vol: sd * Math.sqrt(252) * 100, hi: Math.max(...v), lo: Math.min(...v), from: pairs[0][0],
            w: pairs.filter((p, i) => i % 5 === 0 || i === pairs.length - 1).map(p => [p[0], Math.round(p[1] * 10000) / 10000])};
        }
      } }
  } catch (e) {}
  const resp = J(out); resp.headers.set('cache-control', 'public, max-age=900');
  if (out.ok){ try { await cache.put(key, resp.clone()); } catch (e) {} }
  return resp;
}
