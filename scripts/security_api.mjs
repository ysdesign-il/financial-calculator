// 13.91 security tests: a local attack harness for the server code (no network, never the live site).
// Run: node scripts/security_api.mjs        (Node 22+, uses the built-in node:sqlite)
// Imports the REAL repo modules (_acct.js, _gate.js, a transformed copy of _fin.js) and runs them against
// an in-memory SQLite stand-in for D1 and a Map stand-in for KV. Prints one line per scenario:
//   SECURE <name>      the attack was blocked
//   VULNERABLE <name>  the attack worked
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
const REPO = process.argv[2] || path.resolve(new URL('.', import.meta.url).pathname, '..');
const HERE = fs.mkdtempSync(path.join(os.tmpdir(), 'fin-sec-')) + '/';
const bust = '?t=' + Date.now();
const {acctApi, quote} = await import(REPO + '/_acct.js' + bust);
const {adminGate} = await import(REPO + '/_gate.js' + bust);
// _fin.js imports JSON without import attributes (fine for the Workers bundler, not for Node): copy it with attributes
let finSrc = fs.readFileSync(REPO + '/_fin.js', 'utf8')
  .replace(/from '\.\/(_legacy_\w+\.json)'/g, (m, f) => `from '${REPO}/${f}' with {type: 'json'}`);
fs.writeFileSync(HERE + '_fin_copy.mjs', finSrc);
const {famCheck} = await import(HERE + '_fin_copy.mjs' + bust);
const {secApi} = await import(REPO + '/_sec.js' + bust);

/* ---------- stand-ins ---------- */
function mkDB(){
  const db = new DatabaseSync(':memory:');
  const schema = fs.existsSync(REPO + '/db/schema.sql') ? fs.readFileSync(REPO + '/db/schema.sql', 'utf8') :
    `CREATE TABLE acct (id TEXT PRIMARY KEY, auth TEXT NOT NULL, asalt TEXT NOT NULL, esalt TEXT NOT NULL, blob TEXT, ver INTEGER NOT NULL DEFAULT 0, plan TEXT NOT NULL DEFAULT 'free', created INTEGER NOT NULL, at INTEGER NOT NULL, size INTEGER NOT NULL DEFAULT 0);
     CREATE TABLE docmeta (id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, size INTEGER NOT NULL, parts INTEGER NOT NULL, at INTEGER NOT NULL);
     CREATE TABLE docpart (id TEXT NOT NULL, n INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (id, n));`;
  db.exec(schema);
  const st = sql => { const s = {sql, args: [], bind(...a){ const c = Object.create(s); c.args = a; return c; },
    first(){ return Promise.resolve(db.prepare(this.sql).get(...this.args) || null); },
    all(){ return Promise.resolve({results: db.prepare(this.sql).all(...this.args)}); },
    run(){ const r = db.prepare(this.sql).run(...this.args); return Promise.resolve({meta: {changes: Number(r.changes)}}); }}; return s; };
  return {raw: db, prepare: st, batch: async a => { db.exec('BEGIN'); try { for (const x of a) await x.run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } }};
}
function mkKV(){ const m = new Map(); return {m,
  async get(k, t){ const v = m.has(k) ? m.get(k).v : null; if (v == null) return null; const ty = typeof t === 'string' ? t : t && t.type; return ty === 'json' ? JSON.parse(v) : v; },
  async put(k, v, o){ m.set(k, {v: String(v), meta: o && o.metadata}); }, async delete(k){ m.delete(k); },
  async list({prefix}){ return {keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({name, metadata: m.get(name).meta})), list_complete: true}; }}; }
// caches.default and fetch are stubbed: /api/q must only ever reach the one quote host
const FETCHED = [];
globalThis.caches = {default: {async match(){ return null; }, async put(){}}};
globalThis.fetch = async (u) => { FETCHED.push(String(u)); return new Response(JSON.stringify({chart: {result: [{meta: {regularMarketPrice: 10, currency: 'USD'}, timestamp: [1, 2], indicators: {quote: [{close: [9, 10]}]}}]}}), {headers: {'content-type': 'application/json'}}); };

const ORIGIN = 'https://calc.example';
let ipN = 1;
const req = (path, body, o = {}) => new Request(ORIGIN + path, {method: o.method || 'POST', headers: Object.assign({'content-type': 'application/json', 'cf-connecting-ip': o.ip || '10.0.0.' + (ipN++ % 250)}, o.origin ? {origin: o.origin} : {}, o.headers || {}),
  body: (o.method || 'POST') === 'GET' ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))});
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const rhex = n => crypto.randomBytes(n).toString('hex');
const results = [];
const report = (name, secure, detail) => { results.push({name, secure}); console.log((secure ? 'SECURE     ' : 'VULNERABLE ') + name + (detail ? '  — ' + detail : '')); };
const call = async (env, path, body, o) => { const r = await acctApi(req(path, body, o), env, path); let j = null; try { j = await r.clone().json(); } catch (e) {} return {st: r.status, j, h: r.headers}; };
// the client's real derivations (src/p/fin13.js): id = SHA-256("fin-cloud-id:v1:"+name), auth = PBKDF2(pw, "fin-cloud-auth:v1:"+name, 200000)
const idOf = name => sha('fin-cloud-id:v1:' + name.toLowerCase());
const authOf = (name, pw) => crypto.pbkdf2Sync(pw, 'fin-cloud-auth:v1:' + name.toLowerCase(), 2000 /* fewer rounds: test speed only */, 32, 'sha256').toString('hex');

/* ================= account and document API ================= */
{
  const env = {DB: mkDB()};
  const A = {id: idOf('alice'), auth: authOf('alice', 'pw-A')}, B = {id: idOf('bob'), auth: authOf('bob', 'pw-B')};
  const ip = '1.1.1.1';
  let r = await call(env, '/api/acct/put', {...A, pkg: 'ALICE-SECRET-PKG', base: 0}, {ip});
  report('legit: Alice creates her cloud copy', r.st === 200, 'status ' + r.st);
  r = await call(env, '/api/acct/get', A, {ip}); report('legit: Alice reads her copy back', r.st === 200 && r.j.pkg === 'ALICE-SECRET-PKG', 'status ' + r.st);
  r = await call(env, '/api/acct/put', {...A, pkg: 'ALICE-V2', base: r.j.ver}, {ip}); report('legit: Alice updates (optimistic version)', r.st === 200 && r.j.ver === 2, 'status ' + r.st);
  await call(env, '/api/acct/put', {...B, pkg: 'BOB', base: 0}, {ip: '2.2.2.2'});
  // IDOR: Bob uses Alice's id with his own password fingerprint
  r = await call(env, '/api/acct/get', {id: A.id, auth: B.auth}, {ip: '2.2.2.2'});
  report('IDOR: read another user\'s cloud copy with own auth', !(r.j && r.j.pkg), 'status ' + r.st);
  r = await call(env, '/api/acct/put', {id: A.id, auth: B.auth, pkg: 'OVERWRITTEN', base: 2}, {ip: '2.2.2.2'});
  const aNow = await call(env, '/api/acct/get', A, {ip});
  report('IDOR: overwrite another user\'s cloud copy', aNow.j && aNow.j.pkg === 'ALICE-V2', 'Alice still has ' + (aNow.j && aNow.j.pkg));
  r = await call(env, '/api/acct/del', {id: A.id, auth: B.auth}, {ip: '2.2.2.2'});
  const aStill = await call(env, '/api/acct/get', A, {ip});
  report('IDOR: delete another user\'s account', aStill.st === 200, 'Alice get after attack: ' + aStill.st);
  // documents
  const doc = rhex(16);
  r = await call(env, '/api/doc/put', {...A, doc, n: 0, parts: 1, size: 10, name: 'enc-name', data: 'ALICE-DOC'}, {ip});
  report('legit: Alice uploads a document', r.st === 200, 'status ' + r.st);
  r = await call(env, '/api/doc/get', {...B, doc, n: 0}, {ip: '2.2.2.2'});
  report('IDOR: download another user\'s document by id', !(r.j && r.j.data), 'status ' + r.st);
  r = await call(env, '/api/doc/put', {...B, doc, n: 0, parts: 1, size: 5, name: 'x', data: 'EVIL'}, {ip: '2.2.2.2'});
  r = await call(env, '/api/doc/get', {...A, doc, n: 0}, {ip});
  report('IDOR: replace another user\'s document', r.j && r.j.data === 'ALICE-DOC', 'Alice now reads ' + (r.j && r.j.data));
  await call(env, '/api/doc/del', {...B, doc}, {ip: '2.2.2.2'});
  r = await call(env, '/api/doc/get', {...A, doc, n: 0}, {ip});
  report('IDOR: delete another user\'s document', r.st === 200, 'Alice get after attack: ' + r.st);
  r = await call(env, '/api/doc/list', B, {ip: '2.2.2.2'});
  report('IDOR: another user\'s documents in own list', r.st === 200 && !(r.j.docs || []).some(d => d.id === doc), (r.j.docs || []).length + ' docs listed for Bob');
  // SQL injection: every identifier must be hex, everything else is a bound value
  r = await call(env, '/api/acct/get', {id: "' OR 1=1 --", auth: A.auth}, {ip});
  report('SQLi: id = \' OR 1=1 --', r.st === 400, 'status ' + r.st);
  r = await call(env, '/api/doc/get', {...A, doc: "x' OR '1'='1", n: 0}, {ip});
  report('SQLi: doc = x\' OR \'1\'=\'1', r.st === 400, 'status ' + r.st);
  const doc2 = rhex(16);
  r = await call(env, '/api/doc/put', {...A, doc: doc2, n: 0, parts: 1, size: 5, name: "'); DROP TABLE acct; --", data: 'x'}, {ip});
  const alive = env.DB.raw.prepare('SELECT COUNT(*) c FROM acct').get().c;
  report('SQLi: name = \'); DROP TABLE acct; -- (stored as text)', alive >= 2, 'acct rows after: ' + alive);
  r = await call(env, '/api/doc/get', {...A, doc, n: '0 OR 1=1'}, {ip});
  report('SQLi: n = "0 OR 1=1"', !(r.j && r.j.data && r.j.data !== 'ALICE-DOC'), 'status ' + r.st);
  // NoSQL-style type confusion: objects/arrays instead of strings
  r = await call(env, '/api/acct/get', {id: {$ne: ''}, auth: {$ne: ''}}, {ip});
  report('type confusion: id/auth as objects', r.st === 400, 'status ' + r.st);
  // origin check (CSRF-style cross-site POST)
  r = await call(env, '/api/acct/get', A, {ip, origin: 'https://evil.example'});
  report('cross-site request with a foreign Origin', r.st === 403, 'status ' + r.st);
  r = await call(env, '/api/acct/get', A, {ip, method: 'GET'});
  report('GET on a POST-only API', r.st === 405, 'status ' + r.st);
}
/* ---- account squatting and enumeration (the id is a public function of the username) ---- */
{
  const env = {DB: mkDB()};
  const V = {id: idOf('victim'), auth: authOf('victim', 'victim-pw')}, X = {id: idOf('victim'), auth: authOf('victim', 'attacker-pw')};
  let r = await call(env, '/api/acct/put', {...X, pkg: 'SQUAT', base: 0}, {ip: '6.6.6.6'});
  r = await call(env, '/api/acct/get', V, {ip: '7.7.7.7'});
  const vPut = await call(env, '/api/acct/put', {...V, pkg: 'VICTIM-DATA', base: 0}, {ip: '7.7.7.7'});
  const vGet = await call(env, '/api/acct/get', V, {ip: '7.7.7.7'});
  report('squatting: attacker pre-registers a victim\'s username so the victim cannot use the cloud copy', vPut.st === 200 && vGet.j && vGet.j.pkg === 'VICTIM-DATA', 'victim put ' + vPut.st + ', get ' + vGet.st);
  const xGet = await call(env, '/api/acct/get', X, {ip: '6.6.6.6'});
  report('squatting: the squatter cannot read the victim\'s data', !(xGet.j && xGet.j.pkg === 'VICTIM-DATA'), 'squatter get ' + xGet.st + ' ' + (xGet.j && xGet.j.pkg));
  const e1 = await call(env, '/api/acct/get', {id: idOf('victim'), auth: rhex(32)}, {ip: '8.8.8.1'});
  const e2 = await call(env, '/api/acct/get', {id: idOf('nobody-' + rhex(4)), auth: rhex(32)}, {ip: '8.8.8.2'});
  report('enumeration: "has a cloud copy" vs "no such user" look the same', e1.st === e2.st && JSON.stringify(e1.j) === JSON.stringify(e2.j), 'existing name → ' + e1.st + ' ' + JSON.stringify(e1.j) + ', unknown name → ' + e2.st + ' ' + JSON.stringify(e2.j));
}
/* ---- legacy rows (made before the fix) must keep working ---- */
{
  const env = {DB: mkDB()};
  const L = {id: idOf('legacy'), auth: authOf('legacy', 'old-pw')};
  env.DB.raw.prepare("INSERT INTO acct (id, auth, asalt, esalt, blob, ver, plan, created, at, size) VALUES (?, ?, '-', '-', 'LEGACY', 3, 'free', 1, 1, 6)").run(L.id, sha('auth:' + L.auth));
  env.DB.raw.prepare("INSERT INTO docmeta (id, owner, name, size, parts, at) VALUES (?, ?, 'n', 4, 1, 1)").run('a'.repeat(32), L.id);
  env.DB.raw.prepare("INSERT INTO docpart (id, n, data) VALUES (?, 0, 'LDOC')").run('a'.repeat(32));
  let r = await call(env, '/api/acct/get', L, {ip: '9.9.9.1'});
  report('compat: an account stored before the change still opens', r.st === 200 && r.j.pkg === 'LEGACY' && r.j.ver === 3, 'status ' + r.st);
  r = await call(env, '/api/acct/put', {...L, pkg: 'LEGACY2', base: 3}, {ip: '9.9.9.1'});
  report('compat: and can be updated', r.st === 200 && r.j.ver === 4, 'status ' + r.st);
  r = await call(env, '/api/doc/list', L, {ip: '9.9.9.1'});
  report('compat: and still lists its documents', r.st === 200 && r.j.docs.length === 1, 'docs ' + (r.j.docs || []).length);
  r = await call(env, '/api/doc/get', {...L, doc: 'a'.repeat(32), n: 0}, {ip: '9.9.9.1'});
  report('compat: and still downloads them', r.st === 200 && r.j.data === 'LDOC', 'status ' + r.st);
}
/* ---- brute force of one user's password fingerprint, and the lockout of the real owner ---- */
{
  const env = {DB: mkDB()};
  const V = {id: idOf('target'), auth: authOf('target', 'real-pw')};
  await call(env, '/api/acct/put', {...V, pkg: 'T', base: 0}, {ip: '3.3.3.3'});
  let blocked = 0, n = 0;
  for (let i = 0; i < 40; i++){ const r = await call(env, '/api/acct/get', {id: V.id, auth: rhex(32)}, {ip: '4.4.' + i + '.1'}); n++; if (r.st === 429) blocked++; }
  report('brute force: 40 password guesses on one user from 40 addresses', blocked >= 25, blocked + ' of ' + n + ' guesses refused');
  const own = await call(env, '/api/acct/get', V, {ip: '3.3.3.3'});
  report('lockout: the real owner can still sign in during an attack on their name', own.st === 200, 'owner status ' + own.st);
}
/* ---- abuse: storage quota, mass sign-ups, oversized bodies ---- */
{
  const env = {DB: mkDB()};
  const A = {id: idOf('quota'), auth: authOf('quota', 'pw')}, ip = '5.5.5.5';
  await call(env, '/api/acct/put', {...A, pkg: 'Q', base: 0}, {ip});
  const part = 'x'.repeat(900000);
  let stored = 0;
  for (let d = 0; d < 6; d++){ const doc = rhex(16);
    for (let n = 0; n < 11; n++){ const r = await call(env, '/api/doc/put', {...A, doc, n, parts: 11, size: 1, name: 'n', data: part}, {ip: '5.5.' + d + '.' + n}); if (r.st === 200) stored += part.length; else break; } }
  report('quota: declared size 1 byte, then 6 documents x 11 parts of 900 KB', stored <= 30 * 1024 * 1024 * 1.4, Math.round(stored / 1048576) + ' MB stored (limit 42 MB per account, 8.4 MB per document)');
  const real = env.DB.raw.prepare('SELECT COALESCE(SUM(size),0) s FROM docmeta').get().s, act = env.DB.raw.prepare('SELECT COALESCE(SUM(length(data)),0) s FROM docpart').get().s;
  report('quota: the size the server counts is the real size', real === act, 'counted ' + real + ' vs real ' + act);
  const A2 = {id: idOf('frac'), auth: authOf('frac', 'pw')}; await call(env, '/api/acct/put', {...A2, pkg: 'F', base: 0}, {ip: '5.6.0.1'});
  const doc = rhex(16);
  await call(env, '/api/doc/put', {...A2, doc, n: 0, parts: 3, size: 3, name: 'n', data: 'x'}, {ip: '5.6.0.2'});
  const r = await call(env, '/api/doc/put', {...A2, doc, n: 1.5, parts: 3, size: 3, name: 'n', data: 'y'}, {ip: '5.6.0.3'});
  report('validation: a fractional part number', r.st !== 200, 'status ' + r.st);
  let made = 0;
  for (let i = 0; i < 30; i++){ const K = {id: rhex(32), auth: rhex(32)}; const q = await call(env, '/api/acct/put', {...K, pkg: 'y'.repeat(1000), base: 0}, {ip: '66.66.66.66'}); if (q.st === 200) made++; }
  report('mass sign-up: 30 new accounts from one address in a minute', made <= 10, made + ' created');
  const big = '{"id":"' + 'a'.repeat(64) + '","auth":"' + 'b'.repeat(64) + '","pad":"' + 'z'.repeat(5 * 1024 * 1024) + '"}';
  const q = await acctApi(new Request(ORIGIN + '/api/acct/get', {method: 'POST', headers: {'content-type': 'application/json', 'content-length': String(big.length), 'cf-connecting-ip': '77.7.7.7'}, body: big}), env, '/api/acct/get');
  report('oversized body (5 MB) is refused', q.status === 413, 'status ' + q.status);
}
/* ---- headers on API answers ---- */
{
  const env = {DB: mkDB()};
  const r = await call(env, '/api/acct/get', {id: 'zz', auth: 'zz'}, {ip: '1.2.3.4'});
  report('API answers carry X-Content-Type-Options: nosniff', r.h.get('x-content-type-options') === 'nosniff', 'header: ' + r.h.get('x-content-type-options'));
}
/* ================= /api/q (share prices) ================= */
{
  FETCHED.length = 0;
  const bad = ['../../admin', '..', '.', 'A/B', 'http://x', 'A%2F..', '@evil.example', 'A B', '%00', 'X'.repeat(16)];
  let reached = [];
  for (const s of bad){ FETCHED.length = 0; const r = await quote(new Request(ORIGIN + '/api/q?s=' + encodeURIComponent(s), {headers: {'cf-connecting-ip': '20.0.0.1'}})); if (FETCHED.length) reached.push(s + ' → ' + FETCHED[0].replace(/\?.*$/, '')); }
  report('SSRF / path traversal through the symbol', !reached.length, reached.length ? 'reached: ' + reached.join(' | ') : 'none reached the quote host');
  FETCHED.length = 0;
  const ok = await quote(new Request(ORIGIN + '/api/q?s=TEVA.TA', {headers: {'cf-connecting-ip': '20.0.0.2'}}));
  const all = FETCHED.every(u => u.startsWith('https://query1.finance.yahoo.com/v8/finance/chart/'));
  report('legit: a normal symbol gets a price, only the quote host is contacted', ok.status === 200 && all, 'status ' + ok.status);
  let lim = 0; for (let i = 0; i < 150; i++){ const r = await quote(new Request(ORIGIN + '/api/q?s=S' + i, {headers: {'cf-connecting-ip': '21.0.0.1'}})); if (r.status === 429) lim++; }
  report('rate limit: 150 price requests a minute from one address', lim > 0, lim + ' refused');
  const pr = await quote(new Request(ORIGIN + '/api/q?s=AAPL', {method: 'POST', body: 'x', headers: {'cf-connecting-ip': '22.0.0.1'}}));
  report('method: POST to the price endpoint', pr.status === 405, 'status ' + pr.status);
}
/* ================= /api/fam ================= */
{
  const env = {CFG: mkKV()};
  let lim = 0; for (let i = 0; i < 15; i++){ const r = await famCheck(req('/api/fam', {h: rhex(32)}, {ip: '30.0.0.1'}), env); if (r.status === 429) lim++; }
  report('family check: guessing is rate-limited (15 tries a minute)', lim >= 4, lim + ' refused');
  const r = await famCheck(req('/api/fam', {h: "' or 1=1"}, {ip: '30.0.0.2'}), env);
  report('family check: malformed fingerprint refused', r.status === 400, 'status ' + r.status);
  const g = await famCheck(req('/api/fam', null, {ip: '30.0.0.3', method: 'GET'}), env);
  report('family check: the list is never returned (GET)', g.status === 405, 'status ' + g.status);
  if (fs.existsSync(REPO + '/_legacy_family.json')){
    const env2 = {CFG: mkKV()}, leg = JSON.parse(fs.readFileSync(REPO + '/_legacy_family.json', 'utf8')), h0 = (leg.m[0] || {}).h;   // never printed
    const y = await famCheck(req('/api/fam', {h: h0}, {ip: '30.0.0.4'}), env2); const yj = await y.json();
    report('legit: a fingerprint on the family list is accepted', yj.ok === true, 'ok=' + yj.ok);
    report('seed: the family list is copied into private storage on first read (seed file can then be removed)', env2.CFG.m.has('fam:calc'), 'stored=' + env2.CFG.m.has('fam:calc'));
  }
  const big = await famCheck(new Request(ORIGIN + '/api/fam', {method: 'POST', headers: {'content-type': 'application/json', 'cf-connecting-ip': '30.0.0.5'}, body: JSON.stringify({h: 'a'.repeat(64), pad: 'x'.repeat(100000)})}), env);
  report('family check: oversized body refused', big.status === 413, 'status ' + big.status);
}
/* ================= /api/sec (GitHub's signed token, JWT) ================= */
{
  const env = {CFG: mkKV()};
  const b64u = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000), claims = {iss: 'https://token.actions.githubusercontent.com', aud: 'fin-sec', repository: 'ysdesign-il/financial-calculator', workflow_ref: 'ysdesign-il/financial-calculator/.github/workflows/security.yml@refs/heads/main', exp: now + 600};
  const tries = [['no token', ''], ['alg "none"', b64u({alg: 'none'}) + '.' + b64u(claims) + '.'], ['HS256 (algorithm confusion)', b64u({alg: 'HS256', kid: 'x'}) + '.' + b64u(claims) + '.' + b64u('sig')],
    ['RS256 signed by an unknown key', (() => { const {privateKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048}); const h = b64u({alg: 'RS256', kid: 'attacker'}) + '.' + b64u(claims); return h + '.' + crypto.sign('sha256', Buffer.from(h), privateKey).toString('base64url'); })()]];
  for (const [n, tok] of tries){ const r = await secApi(new Request(ORIGIN + '/api/sec', {method: 'POST', headers: tok ? {authorization: 'Bearer ' + tok} : {}, body: '{"alerts":[{"msg":"x"}]}'}), env);
    report('JWT: security alerts endpoint with ' + n, r.status === 401 && !env.CFG.m.has('sec:alerts'), 'status ' + r.status); }
}
/* ================= /admin (the server-side lock) ================= */
{
  const env = {CFG: mkKV(), GH_TOKEN: 'test-only'};
  const OPT = {app: 'calc', title: 't', store: {key: 'fin-dev'}, docs: ['terms'], gh: {repo: 'o/r', files: ['devcode.json']}};
  const served = [];
  const serve = async r => { served.push(new URL(r.url).pathname); return new Response('<html><head></head><body>ADMIN-APP</body></html>', {headers: {'content-type': 'text/html'}}); };
  const gate = (path, o = {}) => adminGate(new Request(ORIGIN + path, {method: o.method || 'GET', headers: Object.assign({'cf-connecting-ip': o.ip || '40.0.0.1'}, o.headers || {}), body: o.body}), serve, OPT, env);
  for (const p of ['/admin/', '/admin/inbox.json', '/admin/fam', '/admin/security.json', '/admin/__kit.js', '/admin/__dk', '/admin/__fb', '/admin/__logins', '/admin/__errs', '/admin/__sessions', '/admin/__docs']){
    served.length = 0; const r = await gate(p); const t = await r.text();
    report('auth: GET ' + p + ' without a session', !served.length && !t.includes('ADMIN-APP') && !/__ADMKIT|"k":/.test(t), 'status ' + r.status);
  }
  for (const p of ['/admin/__cfg', '/admin/__docs', '/admin/__gh', '/admin/__state', '/admin/__revoke', '/admin/__errs', '/admin/__hist', '/admin/fam']){
    const r = await gate(p, {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN}, body: '{"cfg":{"msg":{"on":true,"t":"x"}}}'});
    report('auth: POST ' + p + ' without a session', r.status === 401 && !env.CFG.m.has('cfg:calc'), 'status ' + r.status);
  }
  const fake = 'adm=' + rhex(20);
  let r = await gate('/admin/__cfg', {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN, cookie: fake}, body: '{"cfg":{}}'});
  report('session: a made-up session cookie', r.status === 401, 'status ' + r.status);
  r = await gate('/admin/__login', {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN}, body: JSON.stringify({h: 'not-hex'})});
  report('login: a malformed key', r.status === 401, 'status ' + r.status);
  let lim = 0; for (let i = 0; i < 12; i++){ const q = await gate('/admin/__login', {ip: '41.0.0.1', method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN}, body: JSON.stringify({h: rhex(32)})}); if (q.status === 429) lim++; }
  report('login brute force: 12 wrong keys from one address', lim >= 3, lim + ' refused');
  // a real session made directly in the stand-in store, to test CSRF with a valid cookie
  const sid = rhex(20); await env.CFG.put('sx:calc:' + sid, JSON.stringify({at: Date.now(), dev: 'x', cc: '', dk: ''}));
  r = await gate('/admin/__cfg', {method: 'POST', headers: {'content-type': 'application/json', origin: 'https://evil.example', cookie: 'adm=' + sid}, body: '{"cfg":{"pwned":1}}'});
  report('CSRF: cross-site POST with the owner\'s cookie (foreign Origin)', r.status === 403 && !env.CFG.m.has('cfg:calc'), 'status ' + r.status);
  r = await gate('/admin/__cfg', {method: 'POST', headers: {'content-type': 'text/plain', cookie: 'adm=' + sid}, body: '{"cfg":{"pwned":1}}'});
  report('CSRF: form-style text/plain POST without Origin', r.status === 403 && !env.CFG.m.has('cfg:calc'), 'status ' + r.status);
  r = await gate('/admin/__cfg', {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN, cookie: 'adm=' + sid}, body: '{"cfg":{"ok":1}}'});
  report('legit: the owner\'s own same-site POST works', r.status === 200, 'status ' + r.status);
  r = await gate('/admin/__gh', {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN, cookie: 'adm=' + sid}, body: JSON.stringify({op: 'put', path: '../../.github/workflows/x.yml', text: 'x'})});
  report('GitHub writes: a path outside the allowed list', r.status === 403, 'status ' + r.status);
  r = await gate('/admin/__docs', {method: 'POST', headers: {'content-type': 'application/json', origin: ORIGIN, cookie: 'adm=' + sid}, body: JSON.stringify({doc: '__proto__', l: 'he', x: 'x'})});
  report('legal texts: an unknown document name (prototype key)', r.status === 400, 'status ' + r.status);
}
const bad = results.filter(r => !r.secure).length;
console.log('\n' + results.length + ' scenarios, ' + (results.length - bad) + ' secure, ' + bad + ' vulnerable');
process.exit(bad ? 1 : 0);
