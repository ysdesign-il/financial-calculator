/* the website works offline: always try the network first (so updates arrive at once), and fall back to the last copy */
const CACHE = 'fin-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'fin-share').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
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
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(key).then(m => m || caches.match(r, {ignoreSearch: true})).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined)).then(m => m || Response.error())));
});
