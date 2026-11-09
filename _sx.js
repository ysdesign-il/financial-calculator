// 13.92: suspicious activity – a small log of security events on this server, and one alert in the owner's inbox when
// something crosses a line. Nothing about a person is stored: no IP address, no name, no fingerprint, no request body –
// only the time (a 10-minute slot), the kind, the route (one of a fixed list, never what the request typed), a count and,
// when the platform gives one, a two-letter country code.
// • Events are added up per kind per route per 10-minute slot (one row each), so a flood cannot make thousands of rows,
//   and are kept 30 days (the half-hourly cron removes older slots).
// • A flood is also added up in memory first: after the first 20 writes of a kind in a slot, a write happens at most every
//   2 seconds (or every 25 events), carrying the count since the last write.
// • An alert goes to the owner's inbox (locked with the inbox's public key, like every website message) at most once an
//   hour per kind. The owner reads the list in the admin version (/admin/suspicious.json, behind the admin sign-in).
// • Everything here runs after the answer was sent (ctx.waitUntil) and never throws: a failure only loses a count.
const SLOT = 600000, KEEP_DAYS = 30, VIEW_DAYS = 7, HOUR = 3600e3;
/* when to tell the owner: at least n events of the kind within about `min` minutes (whole 10-minute slots are counted) */
export const SX_RULES = {login: {n: 5, min: 15}, lock: {n: 1, min: 10}, rate: {n: 50, min: 10}, xsite: {n: 1, min: 10}};
const KINDS = ['login', 'lock', 'rate', 'xsite', 'big', 'path'];
const ROUTES = ['/api/acct', '/api/doc', '/api/fam', '/api/q', '/api/sec', '/api/*', '/admin/login', '/admin', '/inbox.json', '/family.json', '/security.json'];
const HE = {login: n => n + ' ניסיונות כניסה שגויים לניהול בזמן קצר.', lock: () => 'הכניסה לניהול ננעלה זמנית אחרי ניסיונות שגויים רבים.',
  rate: n => n + ' בקשות נחסמו בגלל עומס חריג.', xsite: () => 'נחסמה בקשה לשינוי שהגיעה מאתר אחר.'};
const J = (o, st) => new Response(JSON.stringify(o), {status: st || 200, headers: {'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}});

/* the route, from a fixed list: what an attacker typed is never stored */
export function sxRoute(p){
  if (p === '/admin/__login') return '/admin/login';
  if (p === '/admin' || p.startsWith('/admin/')) return '/admin';
  for (const r of ['/api/acct', '/api/doc']) if (p.startsWith(r + '/')) return r;
  if (ROUTES.includes(p)) return p;
  return p.startsWith('/api/') ? '/api/*' : '';
}
/* which kind of event an answer is (or '' for an ordinary answer) */
export async function sxKind(req, res, p){
  const s = res && res.status, api = p.startsWith('/api/'), adm = p === '/admin' || p.startsWith('/admin/');
  if (!api && !adm) return '';
  if (s === 429) return p === '/admin/__login' ? 'lock' : 'rate';
  if (s === 401 && p === '/admin/__login' && req.method === 'POST') return 'login';
  if (s === 413) return 'big';
  if (s === 403 && req.method !== 'GET' && req.method !== 'HEAD'){
    let e = ''; try { e = (await res.clone().json()).e; } catch (er) {}
    if (e === 'origin') return 'xsite';
  }
  return '';
}
const ccOf = req => { const c = String((req && req.cf && req.cf.country) || ''); return /^[A-Z][A-Z0-9]$/.test(c) ? c : ''; };

let READY = false;
async function ensure(db){
  if (READY) return;
  await db.prepare('CREATE TABLE IF NOT EXISTS secev (b INTEGER NOT NULL, kind TEXT NOT NULL, route TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, hint TEXT NOT NULL DEFAULT \'\', PRIMARY KEY (b, kind, route))').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS secalert (kind TEXT PRIMARY KEY, at INTEGER NOT NULL)').run();
  READY = true;
}
const PEND = new Map();
/* count one event; returns a promise for ctx.waitUntil that never rejects */
export function sxRecord(env, req, kind, route, alert){
  try {
    if (!env || !env.DB || !KINDS.includes(kind) || !ROUTES.includes(route)) return Promise.resolve();
    const now = Date.now(), b = Math.floor(now / SLOT), k = kind + '|' + route, cc = ccOf(req);
    let e = PEND.get(k); if (!e || e.b !== b){ e = {b, n: 0, w: 0, last: 0, cc: ''}; PEND.set(k, e); if (PEND.size > 200){ PEND.clear(); PEND.set(k, e); } }
    e.n++; if (cc && !e.cc) e.cc = cc;
    if (e.w >= 20 && now - e.last < 2000 && e.n < 25) return Promise.resolve();   // a flood: counted here, written with a later event
    const n = e.n, hint = e.cc; e.n = 0; e.cc = ''; e.w++; e.last = now;
    return write(env, kind, route, n, hint, now, alert).catch(() => {});
  } catch (er) { return Promise.resolve(); }
}
async function write(env, kind, route, n, hint, now, alert){
  const db = env.DB; await ensure(db);
  const b = Math.floor(now / SLOT);
  await db.prepare('INSERT INTO secev (b, kind, route, n, hint) VALUES (?, ?, ?, ?, ?) ON CONFLICT(b, kind, route) DO UPDATE SET n = secev.n + excluded.n, hint = CASE WHEN secev.hint = \'\' THEN excluded.hint ELSE secev.hint END')
    .bind(b, kind, route, n, hint).run();
  const R = SX_RULES[kind]; if (!R || typeof alert !== 'function') return;
  const sum = (await db.prepare('SELECT COALESCE(SUM(n), 0) AS s FROM secev WHERE kind = ? AND b >= ?').bind(kind, Math.floor((now - R.min * 60e3) / SLOT)).first()).s || 0;
  if (sum < R.n) return;
  /* at most one alert per kind per hour – claimed in one statement, so two requests at once cannot both send */
  const c = await db.prepare('INSERT INTO secalert (kind, at) VALUES (?, ?) ON CONFLICT(kind) DO UPDATE SET at = excluded.at WHERE secalert.at <= ?').bind(kind, now, now - HOUR).run();
  if (!c || !c.meta || !c.meta.changes) return;
  await alert(env, {k: 'sec', r: 0, m: HE[kind](sum), l: 'he', s: '', at: now, sx: kind, n: sum}, 'sx-' + kind + '-' + now.toString(36));
}
/* the half-hourly cron: forget slots older than 30 days */
export async function sxPrune(env){
  try { if (!env || !env.DB) return; await ensure(env.DB); const old = Date.now() - KEEP_DAYS * 864e5;
    await env.DB.prepare('DELETE FROM secev WHERE b < ?').bind(Math.floor(old / SLOT)).run();
    await env.DB.prepare('DELETE FROM secalert WHERE at < ?').bind(old).run(); } catch (e) {}
}
/* /admin/suspicious.json – the last 7 days, grouped by kind and route (served only behind the admin sign-in) */
export async function sxAdmin(env){
  if (!env || !env.DB) return J({ok: true, days: VIEW_DAYS, groups: [], alerts: []});
  try {
    await ensure(env.DB); const since = Date.now() - VIEW_DAYS * 864e5;
    const g = (await env.DB.prepare('SELECT kind, route, SUM(n) AS n, MIN(b) AS b0, MAX(b) AS b1, group_concat(DISTINCT hint) AS cc FROM secev WHERE b >= ? GROUP BY kind, route ORDER BY b1 DESC LIMIT 60').bind(Math.floor(since / SLOT)).all()).results || [];
    const a = (await env.DB.prepare('SELECT kind, at FROM secalert WHERE at >= ? ORDER BY at DESC').bind(since).all()).results || [];
    return J({ok: true, days: VIEW_DAYS, groups: g.map(x => ({kind: x.kind, route: x.route, n: x.n, first: x.b0 * SLOT, last: x.b1 * SLOT + SLOT - 1,
      cc: String(x.cc || '').split(',').filter(Boolean).slice(0, 6)})), alerts: a, rules: SX_RULES});
  } catch (e) { return J({ok: false, groups: [], alerts: []}, 500); }
}
