/* the website works offline: always try the network first (so updates arrive at once), and fall back to the last copy */
const CACHE = 'fin-v2';  /* 13.60 – kept on purpose in 13.64, so the copies people already have stay */
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'fin-share').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* one kept copy per versioned file (app.js?v=…, tp/he.js?v=…): opened from the copy; a download already on its way is shared */
const INFLIGHT = new Map();
function keepVer(url, same){
  return caches.open(CACHE).then(c => c.match(url).then(m => {
    if (m) return m;
    if (INFLIGHT.has(url)) return INFLIGHT.get(url).then(x => x.clone());
    const p = fetch(url, {credentials: 'same-origin'}).then(res => {
      if (res && res.ok && res.type === 'basic'){
        const cp = res.clone();
        c.keys().then(ks => Promise.all(ks.filter(k => k.url !== url && new URL(k.url).pathname.endsWith(same)).map(k => c.delete(k)))).then(() => c.put(url, cp)).catch(() => {});
      }
      return res;
    });
    INFLIGHT.set(url, p); const end = () => INFLIGHT.delete(url); p.then(end, end);
    return p.then(x => x.clone());
  }));
}
/* after a newer page arrives in the background: bring its app script too, so moving to the new version is instant */
function warmFrom(res){
  res.text().then(h => {
    const m = h.match(/src="(app\.js\?v=[^"]+)"/);
    if (m) keepVer(new URL(m[1], self.registration.scope).href, '/app.js').then(x => x.arrayBuffer()).catch(() => {});
    const m2 = h.match(/src="(app-late\.js\?v=[^"]+)"/);
    if (m2) keepVer(new URL(m2[1], self.registration.scope).href, '/app-late.js').then(x => x.arrayBuffer()).catch(() => {});
  }).catch(() => {});
}
self.addEventListener('fetch', e => {
  const r = e.request;
  /* the admin version and the published settings always come from the network (the server locks /admin/) */
  { const p0 = new URL(r.url); if (p0.origin === location.origin && (p0.pathname.indexOf('/admin') === 0 || p0.pathname.indexOf('/api/') === 0 || p0.pathname === '/cfg.json')) return; }
  /* files shared to the installed app from other apps (Android "Share"): kept here for a moment, then the app opens them */
  if (r.method === 'POST' && new URL(r.url).pathname.endsWith('/share-target')){
    e.respondWith((async () => {
      try {
        const fd = await r.formData(), c = await caches.open('fin-share'); for (const k of await c.keys()) await c.delete(k);
        let i = 0; for (const f of fd.getAll('files')){ if (!f || typeof f === 'string') continue; await c.put('__share/' + (i++), new Response(f, {headers: {'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || 'file')}})); }
        const txt = [fd.get('title'), fd.get('text'), fd.get('url')].filter(x => typeof x === 'string' && x).join('\n');
        if (txt) await c.put('__share/text', new Response(txt, {headers: {'content-type': 'text/plain;charset=utf-8'}}));
      } catch (er) {}
      return Response.redirect('./?share=1', 303);
    })());
    return;
  }
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;     // only this site's own files
  /* the app's script: each version has its own address (app.js?v=…), so a kept copy is always right – open at once, no download */
  const u = new URL(r.url);
  if (/\/app(-late)?\.js$/.test(u.pathname) && u.searchParams.get('v')){   /* 13.65: also the late part (app-late.js) */
    e.respondWith(keepVer(r.url, u.pathname).catch(() => fetch(r)));
    return;
  }
  /* 13.64: the language file (tp/he.js?v=…) the same way – one kept copy per language and version, opened without asking the network */
  if (/\/tp\/[a-z]{2}\.js$/.test(u.pathname) && u.searchParams.get('v')){
    e.respondWith(keepVer(r.url, u.pathname).catch(() => fetch(r)));
    return;
  }
  /* one kept copy per file: data files are asked for with a changing ?t=… so they are never stale – keep them without it, or the store grows forever */
  const key = u.origin + u.pathname;
  /* the on-device text reader (lib/ocr7/: the engine and the language files, several MB, never change – a new version gets a new folder):
     kept after the first download and opened from the kept copy, so it is downloaded only once */
  if (u.pathname.indexOf('/lib/ocr') !== -1){
    e.respondWith(caches.open(CACHE).then(c => c.match(key).then(m => m || fetch(r).then(res => { if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); c.put(key, cp).catch(() => {}); } return res; }))).catch(() => fetch(r)));
    return;
  }
  /* 13.64: open the app at once from the kept copy and bring the newest page in the background (the app then moves to it by
     itself, see updMaybeAuto). An update reload (?v=<build>) opens the kept copy only when it already is that version;
     without a kept copy it works as before: the network, or the kept copy after 2.5 seconds on a slow connection */
  if (r.mode === 'navigate'){
    const want = u.searchParams.get('v') || '';
    const net = fetch(r.url, {cache: 'no-cache', credentials: 'same-origin'}).then(res => {
      if (res && res.ok && res.type === 'basic'){ const cp = res.clone(), cp2 = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); warmFrom(cp2); }
      return res;
    });
    e.waitUntil(net.catch(() => {}));
    const kept = () => caches.match(key).then(m => m || caches.match(r, {ignoreSearch: true})).then(m => m || caches.match('index.html'));
    e.respondWith((async () => {
      let k = null; try { k = await kept(); } catch (er) {}
      if (k && (!want || (/(?:HTML_BUILD = '|data-build=")([^'"]+)/.exec(await k.clone().text().catch(() => '')) || [])[1] === want)) return k;
      return new Promise(ok => {
        let done = false; const fin = x => { if (!done && x){ done = true; ok(x); } };
        const t = setTimeout(() => { if (k) fin(k); }, 2500);
        net.then(res => { clearTimeout(t); fin(res); }, () => { clearTimeout(t); fin(k || Response.error()); });
      });
    })());
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(key).then(m => m || caches.match(r, {ignoreSearch: true})).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined)).then(m => m || Response.error())));
});
