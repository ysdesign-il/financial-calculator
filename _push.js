// Phone alerts for the owner (Web Push, standard VAPID + aes128gcm, nothing from outside). Shared by the apps through _gate.js.
// The signing keys are made on first use and kept in KV (vapid:k); the owner's phones are kept in KV (ps:all) for all apps together,
// so a feedback in one app reaches the phones that turned alerts on in any of them. Nothing about users is sent: only short Hebrew texts.
const enc = new TextEncoder();
const b64u = b => { const a = new Uint8Array(b); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const ub64 = s => { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const cat = (...xs) => { const n = xs.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of xs){ o.set(x, i); i += x.length; } return o; };
async function kvJ(env, k, d){ try { const v = await env.CFG.get(k, 'json'); return v == null ? d : v; } catch (e) { return d; } }
export const PUSH_EVENTS = [['login', 'כניסה לגרסת המנהל'], ['fb', 'משוב חדש'], ['err', 'תקלה חדשה אצל משתמשים'], ['down', 'אתר לא עולה (בדיקה כל חצי שעה)']];

export async function vapid(env){
  let k = await kvJ(env, 'vapid:k', null);
  if (!k || !k.pub || !k.jwk){
    const kp = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
    k = {pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), jwk: await crypto.subtle.exportKey('jwk', kp.privateKey), at: Date.now()};
    await env.CFG.put('vapid:k', JSON.stringify(k));
  }
  return k;
}
async function jwt(k, aud, sub){
  const h = b64u(enc.encode(JSON.stringify({typ: 'JWT', alg: 'ES256'}))), c = b64u(enc.encode(JSON.stringify({aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub})));
  const key = await crypto.subtle.importKey('jwk', k.jwk, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, key, enc.encode(h + '.' + c));
  return h + '.' + c + '.' + b64u(sig);
}
async function hkdf(salt, ikm, info, len){
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name: 'HKDF', hash: 'SHA-256', salt, info}, key, len * 8));
}
/* RFC 8291: the message is readable only by that one phone */
export async function encrypt(sub, payload){
  const ua = ub64(sub.keys.p256dh), auth = ub64(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, {name: 'ECDH', namedCurve: 'P-256'}, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({name: 'ECDH', public: uaKey}, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode('WebPush: info\0'), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16), nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const ck = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv: nonce}, ck, cat(enc.encode(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function sendOne(env, k, s, msg){
  const u = new URL(s.endpoint), body = await encrypt(s, JSON.stringify(msg));
  const t = await jwt(k, u.origin, 'https://financial-calculator.design-il.workers.dev');
  const r = await fetch(s.endpoint, {method: 'POST', headers: {authorization: 'vapid t=' + t + ', k=' + k.pub, 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '86400', urgency: 'high'}, body});
  return r.status;
}
/* send to every phone that turned alerts on (and wants this kind); phones that left are removed */
export async function pushAll(env, kind, msg){
  if (!(env && env.CFG)) return 0;
  const P = await kvJ(env, 'ps:all', {subs: [], pr: {}});
  if (!P.subs || !P.subs.length || (P.pr && P.pr[kind] === 0)) return 0;
  const k = await vapid(env); let ok = 0, gone = [];
  await Promise.all(P.subs.map(async s => { try { const st = await sendOne(env, k, s, msg); if (st === 404 || st === 410) gone.push(s.endpoint); else if (st < 300) ok++; } catch (e) {} }));
  if (gone.length){ P.subs = P.subs.filter(s => !gone.includes(s.endpoint)); await env.CFG.put('ps:all', JSON.stringify(P)); }
  return ok;
}
/* at most one alert of a kind per app every few minutes */
export async function pushSoft(env, kind, app, mins, msg){
  try {
    if (!(env && env.CFG)) return;
    const tk = 'pt:' + kind + ':' + app, last = +(await env.CFG.get(tk)) || 0;
    if (Date.now() - last < mins * 60e3) return;
    const P = await kvJ(env, 'ps:all', {subs: []}); if (!P.subs || !P.subs.length) return;
    await env.CFG.put(tk, String(Date.now()), {expirationTtl: Math.max(60, mins * 60 * 2)});
    await Promise.race([pushAll(env, kind, msg), new Promise(r => setTimeout(r, 4000))]);
  } catch (e) {}
}
/* the owner's phones: list, add, remove, which kinds, test */
export async function pushApi(req, env, o){
  const P = await kvJ(env, 'ps:all', {subs: [], pr: {}});
  if (req.method === 'GET'){ const k = await vapid(env); return {ok: true, key: k.pub, n: P.subs.length, ends: P.subs.map(s => s.endpoint.slice(-24)), pr: P.pr || {}, ev: PUSH_EVENTS}; }
  let d = {}; try { d = await req.json(); } catch (e) {}
  if (d.op === 'add'){
    const s = d.sub || {};
    if (!/^https:\/\/[^\s]{10,900}$/.test(s.endpoint || '') || !s.keys || !/^[A-Za-z0-9_-]{80,100}$/.test(s.keys.p256dh || '') || !/^[A-Za-z0-9_-]{16,30}$/.test(s.keys.auth || '')) return {ok: false, e: 'bad'};
    P.subs = P.subs.filter(x => x.endpoint !== s.endpoint).concat({endpoint: s.endpoint, keys: {p256dh: s.keys.p256dh, auth: s.keys.auth}, at: Date.now(), dev: String(d.dev || '').slice(0, 40), app: o.app}).slice(-10);
  } else if (d.op === 'del'){ P.subs = P.subs.filter(x => x.endpoint !== d.endpoint); }
  else if (d.op === 'pr'){ const pr = {}; PUSH_EVENTS.forEach(([k]) => { pr[k] = d.pr && d.pr[k] === 0 ? 0 : 1; }); P.pr = pr; }
  else if (d.op === 'test'){ const n = await pushAll(env, 'test', {t: '🔔 ' + (o.title || 'ניהול'), b: 'בדיקה: ההתראות עובדות במכשיר הזה.', u: '/admin/', tag: 'test'}); return {ok: true, sent: n}; }
  else return {ok: false, e: 'op'};
  await env.CFG.put('ps:all', JSON.stringify(P));
  return {ok: true, n: P.subs.length, pr: P.pr || {}};
}
/* every half hour (cron on the calculator's Worker): is every site up? An alert when one is down two checks in a row, and when it is back */
export async function healthCron(env, sites){
  const S = await kvJ(env, 'pt:health', {}), ch = [];
  for (const [id, name, url] of sites){
    let up = false; try { const r = await fetch(url + '/__ping?cron=' + Date.now(), {cf: {cacheTtl: 0}}); up = r.ok; } catch (e) {}
    if (!up){ try { const r = await fetch(url + '/', {method: 'GET'}); up = r.ok; } catch (e) {} }
    const f0 = typeof S[id] === 'number' ? S[id] : 0, f1 = up ? 0 : f0 + 1; S[id] = f1;     // two checks in a row, so a passing hiccup is not an alert
    if (f1 === 2) ch.push({t: '🔴 ' + name + ' לא עולה', b: 'הבדיקה האוטומטית לא הצליחה לפתוח את האתר. כדאי לבדוק.', u: '/admin/#admk-s-hl', tag: 'down-' + id});
    if (f0 >= 2 && up) ch.push({t: '🟢 ' + name + ' חזר לעבוד', b: 'האתר עולה שוב.', u: '/admin/', tag: 'down-' + id});
  }
  await env.CFG.put('pt:health', JSON.stringify(S));
  for (const m of ch) await pushAll(env, 'down', m);
  return ch.length;
}
export const PUSH_SW = `self.addEventListener('install',function(){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){d={b:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.t||'ניהול',{body:d.b||'',tag:d.tag||undefined,renotify:!!d.tag,dir:'rtl',lang:'he',data:{u:d.u||'/admin/'}}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=new URL((e.notification.data||{}).u||'/admin/',self.location.origin).href;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(L){for(var i=0;i<L.length;i++){if(L[i].url.indexOf(self.location.origin+'/admin/')===0&&'focus' in L[i]){try{L[i].navigate(u)}catch(x){}return L[i].focus()}}return self.clients.openWindow(u)}))});`;
