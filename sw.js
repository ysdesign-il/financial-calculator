/* the website works offline: always try the network first (so updates arrive at once), and fall back to the last copy */
const CACHE = 'fin-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'fin-share').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
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
  if (u.pathname.endsWith('/app.js') && u.searchParams.get('v')){
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(m => m || fetch(r).then(res => {
      if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); c.keys().then(ks => Promise.all(ks.filter(k => k.url !== r.url && new URL(k.url).pathname.endsWith('/app.js')).map(k => c.delete(k)))).then(() => c.put(r, cp)).catch(() => {}); }
      return res;
    }))).catch(() => fetch(r)));
    return;
  }
  /* one kept copy per file: data files are asked for with a changing ?t=… so they are never stale – keep them without it, or the store grows forever */
  const key = u.origin + u.pathname;
  /* 13.51: opening the app on a slow or patchy mobile network: if the page has not arrived within 3 seconds, open the kept copy at once
     (the new version still arrives in the background and is used next time) instead of waiting on the network */
  if (r.mode === 'navigate'){
    const net = fetch(r).then(res => { if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); } return res; });
    const kept = () => caches.match(key).then(m => m || caches.match(r, {ignoreSearch: true})).then(m => m || caches.match('index.html'));
    e.respondWith(new Promise(ok => {
      let done = false; const fin = x => { if (!done && x){ done = true; ok(x); } };
      const t = setTimeout(() => kept().then(fin).catch(() => {}), 3000);
      net.then(res => { clearTimeout(t); fin(res); }, () => { clearTimeout(t); kept().then(m => { fin(m || Response.error()); }).catch(() => fin(Response.error())); });
    }));
    e.waitUntil(net.catch(() => {}));
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(key).then(m => m || caches.match(r, {ignoreSearch: true})).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined)).then(m => m || Response.error())));
});
