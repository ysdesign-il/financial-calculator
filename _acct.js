// 13.87: optional cloud copy of an account, and documents in the cloud – end-to-end locked.
// The phone locks the account's data with the person's own password before it is sent (the same locked package that
// "move to another device" already makes). This server keeps only that locked package: it cannot read it, and neither can
// the site's owner. The account is found by a one-way fingerprint of the username (the name itself is not stored), and every
// request carries a second fingerprint of the password, of which only a hash is kept.
// Documents are locked on the phone with a random key that lives inside the account's (locked) data, and kept here in parts.
// Each account has a plan ("free" for now) so subscriptions can be added later without changing this.
// No IP address is stored: rate limits live only in memory, keyed by a one-way fingerprint.
const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}});
const enc = new TextEncoder(), hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const isHex = (s, n) => typeof s === 'string' && s.length === n && /^[0-9a-f]+$/.test(s);
const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const MAX_PKG = 1900000, PART = 900000, MAX_DOC = 6 * 1024 * 1024 * 1.4, MAX_ALL = 30 * 1024 * 1024 * 1.4, MAX_DOCS = 60, MAX_PARTS = Math.ceil(MAX_DOC / PART) + 1;
const MAX_BODY = MAX_PKG + 4096;   // the largest legitimate request (a full account package) plus its small fields
const HITS = new Map(), MISS = new Map(), NEW = new Map();
function hit(m, k, n, ms){ const now = Date.now(), a = (m.get(k) || []).filter(t => now - t < ms); a.push(now); m.set(k, a); if (m.size > 20000) m.clear(); return a.length > n; }
function seen(m, k, ms){ const now = Date.now(); return (m.get(k) || []).filter(t => now - t < ms).length; }
const ipKey = async req => (await sha('acct:' + (req.headers.get('cf-connecting-ip') || '?'))).slice(0, 16);
/* Security fix (13.91): where an account lives.
   Before, the row's key was only the fingerprint of the USERNAME – a public function of the name. So anyone could take a name
   first ("squatting": the real person's cloud copy then always failed), anyone could tell whether a name has a cloud copy
   (403 vs 404), and a few wrong guesses on a name locked its real owner out for 15 minutes.
   Now a new account's key is a fingerprint of the name fingerprint AND the password fingerprint together: two people who pick
   the same name simply get two separate places, a wrong password looks exactly like "no copy here", and the owner is never
   locked out by someone else's guesses (only answers that find nothing are counted and limited).
   Accounts stored before this change keep their old key and are found as before (old key + matching password fingerprint);
   nothing stored is moved or rewritten. */
const rowKey = async b => sha('fin-acct-k2:' + b.id + ':' + b.auth);
async function who(env, b){
  if (!isHex(b.id, 64) || !isHex(b.auth, 64)) return {e: 400};
  const ah = await sha('auth:' + b.auth), k2 = await rowKey(b);
  let row = await env.DB.prepare('SELECT id, auth, ver, plan, size FROM acct WHERE id = ?').bind(k2).first();
  if (row && row.auth === ah) return {row, key: k2};
  row = await env.DB.prepare('SELECT id, auth, ver, plan, size FROM acct WHERE id = ?').bind(b.id).first();   // stored before 13.91
  if (row && row.auth === ah) return {row, key: b.id};
  /* nothing found for this name + password: count it, so guessing one person's password stays slow */
  if (seen(MISS, b.id, 15 * 60e3) >= 10) return {e: 429};
  hit(MISS, b.id, 1e9, 15 * 60e3);
  return {none: true, key: k2};
}
async function readBody(req){
  const cl = +(req.headers.get('content-length') || 0); if (cl > MAX_BODY) return {big: true};
  let t = ''; try { t = await req.text(); } catch (e) { return {}; }
  if (t.length > MAX_BODY) return {big: true};
  try { const b = JSON.parse(t); return {b: b && typeof b === 'object' && !Array.isArray(b) ? b : null}; } catch (e) { return {}; }
}
export async function acctApi(req, env, path){
  if (!env.DB) return J({ok: false, e: 'off'}, 503);
  if (req.method !== 'POST') return J({ok: false}, 405);
  const og = req.headers.get('origin'), u = new URL(req.url); if (og && og !== u.origin) return J({ok: false, e: 'origin'}, 403);
  const ip = await ipKey(req);
  if (hit(HITS, ip, 60, 60e3)) return J({ok: false, e: 'wait'}, 429);
  const R = await readBody(req); if (R.big) return J({ok: false, e: 'size'}, 413);
  const b = R.b; if (!b) return J({ok: false}, 400);
  const W = await who(env, b); if (W.e) return J({ok: false, e: W.e === 429 ? 'wait' : 'bad'}, W.e);
  const me = W.key, now = Date.now();
  if (path === '/api/acct/get'){
    if (W.none) return J({ok: false, e: 'none'}, 404);
    const r = await env.DB.prepare('SELECT blob, ver, plan, at FROM acct WHERE id = ?').bind(me).first();
    return J({ok: true, ver: r.ver, plan: r.plan, at: r.at, pkg: r.blob});
  }
  if (path === '/api/acct/put'){
    const pkg = typeof b.pkg === 'string' ? b.pkg : ''; if (!pkg || pkg.length > MAX_PKG) return J({ok: false, e: 'size'}, 413);
    if (W.none){
      if (seen(NEW, ip, 3600e3) >= 5) return J({ok: false, e: 'wait'}, 429);   // at most 5 new cloud accounts an hour from one address
      hit(NEW, ip, 1e9, 3600e3);
      await env.DB.prepare('INSERT INTO acct (id, auth, asalt, esalt, blob, ver, plan, created, at, size) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)')
        .bind(me, await sha('auth:' + b.auth), '-', '-', pkg, 'free', now, now, pkg.length).run();
      return J({ok: true, ver: 1, plan: 'free'});
    }
    const base = +b.base || 0;
    if (base !== W.row.ver){ const r = await env.DB.prepare('SELECT blob, ver FROM acct WHERE id = ?').bind(me).first(); return J({ok: false, e: 'conflict', ver: r.ver, pkg: r.blob}, 409); }
    const res = await env.DB.prepare('UPDATE acct SET blob = ?, ver = ver + 1, at = ?, size = ? WHERE id = ? AND ver = ?').bind(pkg, now, pkg.length, me, base).run();
    if (!res.meta || !res.meta.changes){ const r = await env.DB.prepare('SELECT blob, ver FROM acct WHERE id = ?').bind(me).first(); return J({ok: false, e: 'conflict', ver: r.ver, pkg: r.blob}, 409); }
    return J({ok: true, ver: base + 1, plan: W.row.plan});
  }
  if (W.none) return J({ok: false, e: 'none'}, 404);
  if (path === '/api/acct/del'){
    const ids = (await env.DB.prepare('SELECT id FROM docmeta WHERE owner = ?').bind(me).all()).results || [];
    for (const d of ids){ await env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(d.id).run(); }
    await env.DB.batch([env.DB.prepare('DELETE FROM docmeta WHERE owner = ?').bind(me), env.DB.prepare('DELETE FROM acct WHERE id = ?').bind(me)]);
    return J({ok: true});
  }
  /* ---- documents ---- */
  if (path === '/api/doc/list'){
    const r = (await env.DB.prepare('SELECT id, name, size, parts, at FROM docmeta WHERE owner = ? ORDER BY at DESC').bind(me).all()).results || [];
    return J({ok: true, docs: r, used: r.reduce((s, x) => s + x.size, 0), max: MAX_ALL});
  }
  const did = String(b.doc || ''); if (!isHex(did, 32)) return J({ok: false, e: 'bad'}, 400);
  const meta = await env.DB.prepare('SELECT owner, size, parts FROM docmeta WHERE id = ?').bind(did).first();
  if (meta && meta.owner !== me) return J({ok: false, e: 'auth'}, 403);
  if (path === '/api/doc/put'){
    /* Security fix (13.91): the sizes counted against the limits are the sizes really stored, never the size the phone declares
       (before, declaring a tiny size let one account store hundreds of MB), and part numbers must be whole numbers */
    const n = b.n, parts = b.parts, data = typeof b.data === 'string' ? b.data : '', name = String(b.name || '').slice(0, 400);
    if (!isInt(parts, 1, MAX_PARTS) || !isInt(n, 0, parts - 1) || !data || data.length > PART + 64) return J({ok: false, e: 'size'}, 413);
    if (n > 0 && (!meta || meta.parts !== parts)) return J({ok: false, e: 'order'}, 409);
    const other = n === 0 ? 0 : ((await env.DB.prepare('SELECT COALESCE(SUM(length(data)), 0) AS s FROM docpart WHERE id = ? AND n != ?').bind(did, n).first()).s || 0);
    const docSize = other + data.length; if (docSize > MAX_DOC) return J({ok: false, e: 'size'}, 413);
    const all = await env.DB.prepare('SELECT COUNT(*) AS c, COALESCE(SUM(size), 0) AS s FROM docmeta WHERE owner = ? AND id != ?').bind(me, did).first();
    if ((n === 0 && all.c >= MAX_DOCS) || all.s + docSize > MAX_ALL) return J({ok: false, e: 'full'}, 413);
    if (n === 0){
      await env.DB.batch([env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(did),
        env.DB.prepare('INSERT OR REPLACE INTO docmeta (id, owner, name, size, parts, at) VALUES (?, ?, ?, ?, ?, ?)').bind(did, me, name, docSize, parts, now),
        env.DB.prepare('INSERT INTO docpart (id, n, data) VALUES (?, ?, ?)').bind(did, n, data)]);
    } else {
      await env.DB.batch([env.DB.prepare('INSERT OR REPLACE INTO docpart (id, n, data) VALUES (?, ?, ?)').bind(did, n, data),
        env.DB.prepare('UPDATE docmeta SET size = ?, at = ? WHERE id = ? AND owner = ?').bind(docSize, now, did, me)]);
    }
    return J({ok: true});
  }
  if (!meta) return J({ok: false, e: 'none'}, 404);
  if (path === '/api/doc/get'){
    const n = +b.n || 0; if (!isInt(n, 0, MAX_PARTS)) return J({ok: false, e: 'bad'}, 400);
    const r = await env.DB.prepare('SELECT data FROM docpart WHERE id = ? AND n = ?').bind(did, n).first();
    return r ? J({ok: true, parts: meta.parts, data: r.data}) : J({ok: false, e: 'none'}, 404);
  }
  if (path === '/api/doc/del'){
    await env.DB.batch([env.DB.prepare('DELETE FROM docpart WHERE id = ?').bind(did), env.DB.prepare('DELETE FROM docmeta WHERE id = ? AND owner = ?').bind(did, me)]);
    return J({ok: true});
  }
  return J({ok: false}, 404);
}

/* ---- share prices and index values, delayed, from a free public source; cached 15 minutes; nothing about the person is sent.
   ?s=SYMBOL           → price, currency, change since yesterday's close
   ?s=SYMBOL&r=1y      → also a year of weekly closes, the return over the year, yearly volatility, the year's high and low ---- */
const QHITS = new Map();
export async function quote(req){
  if (req.method !== 'GET' && req.method !== 'HEAD') return J({ok: false}, 405);
  const u = new URL(req.url), s = String(u.searchParams.get('s') || '').toUpperCase().trim(), yr = u.searchParams.get('r') === '1y';
  /* a symbol starts with a letter, digit or ^ and never holds ".." – so it can only ever name a symbol on the one price source,
     never another path there (security fix 13.91) */
  if (!/^[A-Z0-9^][A-Z0-9.\-^=]{0,14}$/.test(s) || s.includes('..')) return J({ok: false, e: 'bad'}, 400);
  if (hit(QHITS, await ipKey(req), 120, 60e3)) return J({ok: false, e: 'wait'}, 429);   // the app asks for at most 25 at a time
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
