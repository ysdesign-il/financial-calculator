// 13.92 tests: suspicious-activity log and owner alerts (local only – never the live site).
// Run: node scripts/security_alerts.mjs        (Node 22+, uses the built-in node:sqlite)
// Loads the REAL worker.js (with a copy of _fin.js that Node can import) against an in-memory SQLite stand-in for D1 and a
// Map stand-in for KV, sends requests through the worker's fetch, waits for the background jobs (ctx.waitUntil) and checks:
// events recorded, one alert per kind, no alert spam, the owner's list needs a session, no address stored, logging never
// breaks or slows an answer, old slots are removed. Prints PASS/FAIL per check and exits 1 on any FAIL.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
const REPO = process.argv[2] || path.resolve(new URL('.', import.meta.url).pathname, '..');
const HERE = fs.mkdtempSync(path.join(os.tmpdir(), 'fin-sx-')) + '/';
fs.writeFileSync(HERE + '_fin_copy.mjs', fs.readFileSync(REPO + '/_fin.js', 'utf8')
  .replace(/from '\.\/(_legacy_\w+\.json)'/g, (m, f) => `from '${REPO}/${f}' with {type: 'json'}`));
fs.writeFileSync(HERE + 'worker_copy.mjs', fs.readFileSync(REPO + '/worker.js', 'utf8')
  .replace(/from '\.\/_fin\.js'/, `from '${HERE}_fin_copy.mjs'`).replace(/from '\.\/([\w.]+\.js)'/g, (m, f) => `from '${REPO}/${f}'`));
globalThis.caches = {default: {async match(){ return null; }, async put(){}}};
const FETCHED = [];
globalThis.fetch = async u => { FETCHED.push(String(u)); return new Response('{}', {status: 503}); };   // nothing leaves this machine
const W = (await import(HERE + 'worker_copy.mjs')).default;

function mkDB(o = {}){
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(REPO + '/db/schema.sql', 'utf8').replace(/CREATE TABLE IF NOT EXISTS (secev|secalert)[\s\S]*?\n\);/g, ''));   // the code must create its own tables
  const st = sql => { const s = {sql, args: [], bind(...a){ const c = Object.create(s); c.args = a; return c; },
    async first(){ if (o.slow) await new Promise(r => setTimeout(r, o.slow)); return db.prepare(this.sql).get(...this.args) || null; },
    async all(){ return {results: db.prepare(this.sql).all(...this.args)}; },
    async run(){ if (o.slow) await new Promise(r => setTimeout(r, o.slow)); if (o.fail && /sec(ev|alert)/.test(this.sql)) throw new Error('db down'); const r = db.prepare(this.sql).run(...this.args); return {meta: {changes: Number(r.changes)}}; }};
    return s; };
  return {raw: db, prepare: st, batch: async a => { for (const x of a) await x.run(); }};
}
function mkKV(){ const m = new Map(); return {m,
  async get(k, t){ const v = m.has(k) ? m.get(k).v : null; if (v == null) return null; const ty = typeof t === 'string' ? t : t && t.type; return ty === 'json' ? JSON.parse(v) : v; },
  async put(k, v, o){ m.set(k, {v: String(v), meta: o && o.metadata}); }, async delete(k){ m.delete(k); },
  async list({prefix}){ return {keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({name, metadata: m.get(name).meta})), list_complete: true}; }}; }
const ASSETS = {fetch: async r => new URL(r.url).pathname === '/' ? new Response('<html><head></head><body>APP</body></html>', {headers: {'content-type': 'text/html'}}) : new Response('Not found', {status: 404})};
const mkEnv = o => ({DB: mkDB(o), CFG: mkKV(), ASSETS});

const ORIGIN = 'https://calc.example', IPS = new Set();
let jobs = [];
const ctx = {waitUntil(p){ jobs.push(p); }};
const settle = async () => { while (jobs.length){ const a = jobs; jobs = []; await Promise.all(a); } };
async function send(env, p, o = {}){
  const ip = o.ip || '10.9.' + (Math.random() * 250 | 0) + '.' + (Math.random() * 250 | 0); IPS.add(ip);
  const m = o.method || (o.body != null ? 'POST' : 'GET');
  const r = new Request(ORIGIN + p, {method: m, headers: Object.assign({'content-type': 'application/json', 'cf-connecting-ip': ip, 'user-agent': 'Mozilla/5.0 (iPhone)'}, o.headers || {}),
    body: m === 'GET' || m === 'HEAD' ? undefined : (typeof o.body === 'string' ? o.body : JSON.stringify(o.body || {}))});
  if (o.cc) Object.defineProperty(r, 'cf', {value: {country: o.cc}});
  const res = await W.fetch(r, env, ctx); if (!o.nowait) await settle(); return res;
}
const rows = (env, kind) => { try { return env.DB.raw.prepare('SELECT * FROM secev' + (kind ? ' WHERE kind = ?' : '')).all(...(kind ? [kind] : [])); } catch (e) { return []; } };   // no table yet = nothing recorded
const total = (env, kind) => rows(env, kind).reduce((s, x) => s + x.n, 0);
const inboxSx = env => { const v = env.CFG.m.get('ib:calc'); return v ? (JSON.parse(v.v).m || []).filter(x => String(x.id).startsWith('sx-')) : []; };
const alertsOf = (env, k) => inboxSx(env).filter(x => x.id.startsWith('sx-' + k + '-'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (detail != null ? '  — ' + detail : '')); };
const rhex = k => crypto.randomBytes(k).toString('hex');

const env = mkEnv();
/* ---- ordinary requests leave no trace ---- */
{
  const A = {id: rhex(32), auth: rhex(32)};
  const r1 = await send(env, '/api/acct/put', {body: {...A, pkg: 'P', base: 0}, headers: {origin: ORIGIN}});
  const r2 = await send(env, '/api/acct/get', {body: A});
  const r3 = await send(env, '/api/fam', {body: {h: rhex(32)}});
  check('ordinary requests are answered as before and record nothing', r1.status === 200 && r2.status === 200 && r3.status === 200 && rows(env).length === 0, 'statuses ' + [r1.status, r2.status, r3.status] + ', rows ' + rows(env).length);
}
/* ---- failed admin sign-ins and the lock ---- */
{
  const ip = '41.1.1.1';
  for (let i = 0; i < 4; i++) await send(env, '/admin/__login', {ip, body: {h: rhex(32)}, headers: {origin: ORIGIN}, cc: 'NL'});
  check('4 failed admin sign-ins are counted, no alert yet (threshold 5)', total(env, 'login') === 4 && alertsOf(env, 'login').length === 0, 'counted ' + total(env, 'login') + ', alerts ' + alertsOf(env, 'login').length);
  await send(env, '/admin/__login', {ip, body: {h: rhex(32)}, headers: {origin: ORIGIN}, cc: 'NL'});
  const a = alertsOf(env, 'login');
  check('the 5th failed sign-in adds ONE alert to the owner inbox', a.length === 1, a.length + ' alert(s)');
  check('the alert is in the inbox format (fc1, locked with the inbox key)', a.length === 1 && /^fc1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(a[0].c) && Buffer.from(a[0].c.split('.')[1], 'base64').length === 256 && Number.isInteger(a[0].t), a[0] && (a[0].c.slice(0, 12) + '… t=' + a[0].t));
  let st = [];
  for (let i = 0; i < 7; i++) st.push((await send(env, '/admin/__login', {ip, body: {h: rhex(32)}, headers: {origin: ORIGIN}})).status);
  check('after 8 wrong keys the sign-in locks (429) and the lock is recorded', st.includes(429) && total(env, 'lock') >= 1, 'statuses ' + st.join(',') + ', lock events ' + total(env, 'lock'));
  check('the lock adds ONE alert', alertsOf(env, 'lock').length === 1, alertsOf(env, 'lock').length + ' alert(s)');
  for (let i = 0; i < 6; i++) await send(env, '/admin/__login', {body: {h: rhex(32)}, headers: {origin: ORIGIN}});
  for (let i = 0; i < 5; i++) await send(env, '/admin/__login', {ip, body: {h: rhex(32)}, headers: {origin: ORIGIN}});
  check('no alert spam: more failed sign-ins and locks within the hour add no more alerts', alertsOf(env, 'login').length === 1 && alertsOf(env, 'lock').length === 1, 'login alerts ' + alertsOf(env, 'login').length + ', lock alerts ' + alertsOf(env, 'lock').length + ', login events ' + total(env, 'login'));
  check('a country code is kept as the only hint', rows(env, 'login').some(x => x.hint === 'NL') && rows(env).every(x => /^([A-Z][A-Z0-9])?$/.test(x.hint)), JSON.stringify(rows(env, 'login').map(x => x.hint)));
}
/* ---- a flood of refused requests is added up, not stored row by row ---- */
{
  const ip = '50.5.5.5';
  let refused = 0; for (let i = 0; i < 100; i++){ const r = await send(env, '/api/fam', {ip, body: {h: rhex(32)}, nowait: true}); if (r.status === 429) refused++; }
  await settle();
  const t = total(env, 'rate'), rr = rows(env, 'rate').length;
  check('a flood of ' + refused + ' refusals (429) makes at most 2 rows (one per 10-minute slot)', rr >= 1 && rr <= 2, rr + ' row(s)');
  check('the flood is counted (at most 24 events still waiting in memory)', t <= refused && t >= refused - 24 && t >= 50, t + ' counted of ' + refused);
  check('50+ refusals add ONE "too many requests" alert', alertsOf(env, 'rate').length === 1, alertsOf(env, 'rate').length + ' alert(s)');
  for (let i = 0; i < 80; i++) await send(env, '/api/fam', {ip, body: {h: rhex(32)}, nowait: true});
  await settle();
  check('no alert spam: a second flood in the same hour adds no alert', alertsOf(env, 'rate').length === 1, alertsOf(env, 'rate').length + ' alert(s), ' + total(env, 'rate') + ' counted');
}
/* ---- cross-site writes, oversized bodies, blocked paths ---- */
{
  const A = {id: rhex(32), auth: rhex(32)};
  const r = await send(env, '/api/acct/get', {body: A, headers: {origin: 'https://evil.example'}});
  check('a cross-site POST to the account API is blocked (403) and recorded', r.status === 403 && total(env, 'xsite') === 1, 'status ' + r.status + ', events ' + total(env, 'xsite'));
  check('any blocked cross-site write adds ONE alert', alertsOf(env, 'xsite').length === 1, alertsOf(env, 'xsite').length + ' alert(s)');
  const r2 = await send(env, '/admin/__cfg', {body: {cfg: {x: 1}}, headers: {origin: 'https://evil.example'}});
  const r3 = await send(env, '/admin/__cfg', {body: '{"cfg":{}}', headers: {'content-type': 'text/plain'}});
  check('cross-site writes to the admin version are recorded too, without a second alert', r2.status === 403 && r3.status === 403 && total(env, 'xsite') === 3 && alertsOf(env, 'xsite').length === 1, 'statuses ' + r2.status + ',' + r3.status + ', events ' + total(env, 'xsite') + ', alerts ' + alertsOf(env, 'xsite').length);
  const big = await send(env, '/api/fam', {body: JSON.stringify({h: 'a'.repeat(64), pad: 'x'.repeat(100000)})});
  check('an oversized body (413) is recorded, with no alert', big.status === 413 && total(env, 'big') === 1 && alertsOf(env, 'big').length === 0, 'status ' + big.status);
  const p1 = await send(env, '/inbox.json'), p2 = await send(env, '/api/../../etc/passwd'), p3 = await send(env, '/api/wp-login.php');
  const pr = rows(env, 'path');
  check('requests for blocked files and unknown /api/ addresses are recorded under a fixed route name', p1.status === 404 && p3.status === 404 && total(env, 'path') >= 2 && pr.every(x => ['/inbox.json', '/api/*'].includes(x.route)), JSON.stringify(pr.map(x => [x.route, x.n])));
  const acct404 = await send(env, '/api/acct/get', {body: {id: rhex(32), auth: rhex(32)}});
  check('an ordinary "no cloud copy" answer (404) is not counted as suspicious', acct404.status === 404 && pr.every(x => x.route !== '/api/acct'), 'status ' + acct404.status);
}
/* ---- one alert per kind per HOUR (not forever) ---- */
{
  env.DB.raw.prepare("UPDATE secalert SET at = at - 2 * 3600000 WHERE kind = 'xsite'").run();
  await send(env, '/api/acct/get', {body: {id: rhex(32), auth: rhex(32)}, headers: {origin: 'https://evil.example'}});
  check('an hour after the last alert, a new event of that kind alerts again', alertsOf(env, 'xsite').length === 2, alertsOf(env, 'xsite').length + ' alert(s)');
}
/* ---- the owner's list ---- */
{
  const r = await send(env, '/admin/suspicious.json'); const t = await r.text();
  check('GET /admin/suspicious.json without a session shows only the sign-in page', !/"groups"/.test(t) && !/"kind"/.test(t), 'status ' + r.status);
  const r1 = await send(env, '/admin/suspicious.json', {headers: {cookie: 'adm=' + rhex(20)}}); const t1 = await r1.text();
  check('… and with a made-up session cookie', !/"groups"/.test(t1), 'status ' + r1.status);
  const sid = rhex(20); await env.CFG.put('sx:calc:' + sid, JSON.stringify({at: Date.now(), dev: 'x', cc: '', dk: ''}));
  const r2 = await send(env, '/admin/suspicious.json', {headers: {cookie: 'adm=' + sid}}); let j = null; try { j = await r2.json(); } catch (e) {}
  const kinds = j && j.groups ? [...new Set(j.groups.map(g => g.kind))].sort() : [];
  check('with the owner\'s session it lists the last 7 days grouped by kind and route', r2.status === 200 && j && j.days === 7 && ['big', 'lock', 'login', 'path', 'rate', 'xsite'].every(k => kinds.includes(k)) && j.groups.length < 15, 'kinds ' + kinds.join(',') + ', groups ' + (j && j.groups.length) + ', alerts ' + (j && j.alerts.length));
}
/* ---- nothing about a person is stored ---- */
{
  const dump = JSON.stringify(env.DB.raw.prepare('SELECT * FROM secev').all()) + JSON.stringify(env.DB.raw.prepare('SELECT * FROM secalert').all()) + JSON.stringify([...env.CFG.m.entries()]);
  const leaked = [...IPS].filter(ip => dump.includes(ip) || dump.includes(crypto.createHash('sha256').update('rl:' + ip).digest('hex').slice(0, 16)) || dump.includes(crypto.createHash('sha256').update('fam:' + ip).digest('hex').slice(0, 16)));
  const cols = env.DB.raw.prepare('PRAGMA table_info(secev)').all().map(c => c.name).join(',');
  check('no IP address (or its fingerprint) is stored anywhere, ' + IPS.size + ' test addresses checked', !leaked.length, leaked.length ? 'found: ' + leaked.slice(0, 3).join(' ') : 'none found');
  check('the log holds only slot, kind, route, count and hint', cols === 'b,kind,route,n,hint', cols);
  check('nothing was sent over the network while logging', FETCHED.length === 0, FETCHED.length + ' request(s)');
}
/* ---- logging never breaks or slows an answer ---- */
{
  const e1 = mkEnv({fail: true});
  let ok = true; try { for (let i = 0; i < 12; i++){ const r = await send(e1, '/admin/__login', {ip: '60.6.6.6', body: {h: rhex(32)}, headers: {origin: ORIGIN}}); if (![401, 429].includes(r.status)) ok = false; } } catch (e) { ok = false; }
  check('when the log storage fails, answers are unchanged and nothing throws', ok);
  const e2 = {CFG: mkKV(), ASSETS};
  const r = await send(e2, '/admin/__login', {body: {h: rhex(32)}, headers: {origin: ORIGIN}});
  check('without a database the sign-in still answers (401)', r.status === 401);
  const e3 = mkEnv({slow: 400}); jobs = [];
  const t0 = Date.now(); const r3 = await send(e3, '/admin/__login', {body: {h: rhex(32)}, headers: {origin: ORIGIN}, nowait: true}); const dt = Date.now() - t0;
  check('the answer does not wait for the log (log storage 400 ms slow)', r3.status === 401 && dt < 300 && jobs.length === 1, dt + ' ms');
  await settle();
}
/* ---- 30 days kept ---- */
{
  const old = Math.floor((Date.now() - 40 * 864e5) / 600000);
  env.DB.raw.prepare("INSERT INTO secev (b, kind, route, n, hint) VALUES (?, 'rate', '/api/q', 9, '')").run(old);
  const before = rows(env).length; jobs = [];
  await W.scheduled({}, env, ctx); await settle();
  const after = rows(env), gone = !after.some(x => x.b === old);
  check('the half-hourly job removes slots older than 30 days and keeps the rest', gone && after.length === before - 1, before + ' → ' + after.length + ' rows');
}
console.log('\n' + n + ' checks, ' + (n - bad) + ' passed, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
