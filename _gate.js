// Server-side lock for the admin version (/admin/). The admin files are served only to a browser that proved it holds
// the developer key (the same name + code as developer mode). Nothing secret is stored here: only a fingerprint of the key.
// Used by a Cloudflare Pages Function or a Worker. Also serves the public settings the admin panel publishes (/cfg.json),
// kept in Cloudflare KV (binding CFG). A site without the binding (Pages) forwards to its own Worker copy (o.upstream).
import {KIT} from './_kit.js';
import {PUB} from './_pub.js';
import {QR} from './_qr.js';
const DEV_CHECK='2ff82c4945c39ddf16442f25fdc6b3ee96b832d2ea9b26448813ba9087d1c285';
const REC_BUNDLE='nsr1.iWUL8ojgMNK6qJIp.JxT7Dcnxml12WgcvhJdS7RFevhkpINNl462Eybdg5Swvm2Xlp0fOCA1Vn7FTTFJovZJXcZ/oBUHOA2qJA4K7sRMCFKCY6IYbvJll4kaeWHU=';
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
/* the developer key's fingerprint: a Cloudflare secret DEV_CHECK (when set) replaces the public one, so a new code is not exposed to offline guessing */
const devCheckOf=env=>(env&&typeof env.DEV_CHECK==='string'&&/^[0-9a-f]{64}$/.test(env.DEV_CHECK.trim()))?env.DEV_CHECK.trim():DEV_CHECK;
async function keyOk(h,env){return typeof h==='string'&&/^[0-9a-f]{64}$/.test(h)&&hex(await crypto.subtle.digest('SHA-256',enc.encode(h)))===devCheckOf(env)}
function cookieSes(req){const m=/(?:^|;\s*)adm=([0-9a-f]{40})(?:;|$)/.exec(req.headers.get('cookie')||'');return m?m[1]:''}
const FAILS=new Map(),ERRRATE=new Map(),OKSES=new Map();
function tooMany(ip){const now=Date.now(),a=(FAILS.get(ip)||[]).filter(t=>now-t<15*60e3);FAILS.set(ip,a);return a.length>=8}
function fail(ip){const a=FAILS.get(ip)||[];a.push(Date.now());FAILS.set(ip,a)}
const J=(o,st,extra)=>new Response(JSON.stringify(o),{status:st||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},extra||{})});
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob:; connect-src 'self' https: data: blob:; worker-src 'self' blob:; frame-src https:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'";
const SEC={'x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer','x-frame-options':'DENY','cache-control':'no-store, private','content-security-policy':CSP,'x-content-type-options':'nosniff'};
async function kvGet(env,k,d){try{const v=await env.CFG.get(k,k.indexOf('ses:')===0?{type:'json',cacheTtl:30}:'json');return v==null?d:v}catch(e){return d}}   // sessions: re-read every 30 s (the shortest KV allows), so a disconnected device is out within half a minute
const sh=async id=>hex(await crypto.subtle.digest('SHA-256',enc.encode('h:'+id))).slice(0,16);
const rid=()=>hex(crypto.getRandomValues(new Uint8Array(20)));
function devOf(req){const ua=req.headers.get('user-agent')||'';const os=/iPhone|iPad/.test(ua)?'iPhone/iPad':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'Mac':'אחר';const br=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'';return os+(br?' · '+br:'')}
const COOK=(id,age)=>`adm=${id}; Path=/admin; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
const SES_AGE=7*864e5;const sesLive=s=>s&&(s.exp||((s.at||0)+30*864e5))>Date.now();
/* ---------- sessions (kept in KV; the Pages site asks its Worker copy) ---------- */
async function sesNew(env,o,req,via){const k='ses:'+o.app,L=await kvGet(env,k,[]),id=rid(),cc=(req.cf&&req.cf.country)||'';
  L.push({id,at:Date.now(),exp:Date.now()+SES_AGE,dev:via&&via.dev||devOf(req),cc:via&&via.cc||cc});await env.CFG.put(k,JSON.stringify(L.filter(sesLive).slice(-20)));
  const lk='lg:'+o.app,G=await kvGet(env,lk,[]);G.push({at:Date.now(),dev:via&&via.dev||devOf(req),cc:via&&via.cc||cc,h:await sh(id)});await env.CFG.put(lk,JSON.stringify(G.slice(-100)));return id}
async function sesOk(env,o,id,req){if(!id)return false;
  if(env&&env.CFG){const L=await kvGet(env,'ses:'+o.app,[]);return L.some(s=>s.id===id&&sesLive(s))}
  if(!o.upstream)return false;const c=OKSES.get(id);if(c&&Date.now()-c<60e3)return true;
  try{const r=await fetch(o.upstream+'/admin/__who',{headers:{cookie:'adm='+id}});if(r.ok){OKSES.set(id,Date.now());return true}return false}catch(e){return false}}
/* ---------- public: settings, the public script, anonymous crash reports ---------- */
async function cfgOf(app,env,o){if(env&&env.CFG)return kvGet(env,'cfg:'+app,{});
  if(o&&o.upstream){try{const r=await fetch(o.upstream+'/cfg.json',{cf:{cacheTtl:20}});if(r.ok)return await r.json()}catch(e){}}return{}}
export async function publicConfig(app,env,o){return J(await cfgOf(app,env,o),200,{'cache-control':'public, max-age=20','access-control-allow-origin':'*'})}
/* health check read by the admin panels of the three apps: is the site up, which version is live, what is switched on */
export async function ping(app,env,o,asset){let v='',b='';
  try{const r=await asset('/version.json');if(r&&r.ok){const j=await r.json();v=String(j.v||'');b=String(j.build||'')}}catch(e){}
  if(!v&&!b){try{const r=await asset('/');if(r&&r.ok){const t=await r.text();const m=/APP_VERSION\s*=\s*['"]([^'"]{1,20})/.exec(t)||/HTML_BUILD\s*=\s*['"]([^'"]{1,30})/.exec(t);if(m)v=m[1]}}catch(e){}}
  const c=await cfgOf(app,env,o),now=Date.now(),act=x=>!!(x&&x.on&&!(x.from&&x.from>now)&&!(x.to&&x.to<=now));
  return J({ok:true,app,v,b,maint:act(c.maint),msg:act(c.msg),wn:!!(c.wn&&c.wn.on),off:(c.off||[]).length,t:now},200,{'access-control-allow-origin':'*','cache-control':'no-store'})}
export function pubScript(o){return new Response('window.__ADMPUBCFG='+JSON.stringify({parts:o.parts||[],accent:o.accent,priv:o.priv||''})+';\n'+PUB,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'public, max-age=300'}})}
export async function injectPub(r,o){const ct=r.headers.get('content-type')||'';if(!ct.includes('text/html'))return r;let h=(await r.text()).replace('</body>','<script src="/__pub.js" defer></script></body>');
  if(o&&o.langLS)h=h.replace('<head>','<head><script>try{var q=new URLSearchParams(location.search).get("lang");if(q&&/^[a-z]{2}(-[A-Z]{2})?$/.test(q))localStorage.setItem('+JSON.stringify(o.langLS)+',q)}catch(e){}</script>');const hd=new Headers(r.headers);hd.delete('content-length');return new Response(h,{status:r.status,headers:hd})}
const clean=s=>String(s==null?'':s).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[…]').replace(/\+?\d[\d\s\-]{7,}\d/g,'[…]').replace(/[?#].*$/,'').slice(0,300);
export async function errReport(req,app,env,o){
  if(req.method!=='POST')return J({ok:false},405);
  if(!(env&&env.CFG)){if(!o||!o.upstream)return J({ok:true});try{await fetch(o.upstream+'/__err',{method:'POST',headers:{'content-type':'application/json'},body:await req.text()})}catch(e){}return J({ok:true})}
  const ip=req.headers.get('cf-connecting-ip')||'?',now=Date.now(),a=(ERRRATE.get(ip)||[]).filter(t=>now-t<10*60e3);if(a.length>=5)return J({ok:true});a.push(now);ERRRATE.set(ip,a);
  let d={};try{d=await req.json()}catch(e){}const k='er:'+app,day=new Date().toISOString().slice(0,10);const L=await kvGet(env,k,{day,n:0,items:[]});if(L.day!==day){L.day=day;L.n=0;L.ip={}}if(L.n>=60)return J({ok:true});
  /* at most 5 reports a day from one connection (a short fingerprint, not the address), so one sender cannot fill the day's 60 */
  const ih=(await sh('ip:'+ip)).slice(0,6);L.ip=L.ip&&typeof L.ip==='object'?L.ip:{};if((L.ip[ih]||0)>=5)return J({ok:true});L.ip[ih]=(L.ip[ih]||0)+1;L.n++;
  const it={at:now,m:clean(d.m),src:clean(d.src),v:String(d.v||'').slice(0,40),s:String(d.s||'').slice(0,40),l:String(d.l||'').slice(0,5),dev:devOf(req)};
  const same=L.items.find(x=>x.m===it.m&&x.src===it.src);if(same){same.n=(same.n||1)+1;same.at=now;same.v=it.v}else L.items.push(it);L.items=L.items.slice(-200);await env.CFG.put(k,JSON.stringify(L));return J({ok:true})}
/* ---------- the lock ---------- */
export async function adminGate(req,serve,o,env){
  const u=new URL(req.url),p=u.pathname,ip=req.headers.get('cf-connecting-ip')||'?',KV=!!(env&&env.CFG);
  if(p==='/admin')return Response.redirect(u.origin+'/admin/',302);
  /* requests that change something must come from this very site (not a sibling app on the same domain) and be JSON: blocks forged forms */
  if(req.method!=='GET'&&req.method!=='HEAD'){const og=req.headers.get('origin'),ct=req.headers.get('content-type')||'';
    if(og&&og!==u.origin)return J({ok:false,e:'origin'},403);
    if(!(p==='/admin/__newses'&&req.headers.get('x-adm-key'))&&!og&&!/application\/json/i.test(ct))return J({ok:false,e:'origin'},403);
    if(og&&!/application\/json/i.test(ct))return J({ok:false,e:'type'},415)}
  if(p==='/admin/__login'&&req.method==='POST'){
    if(tooMany(ip))return J({ok:false,e:'wait'},429);
    let h='';try{h=(await req.json()).h}catch(e){}
    if(!(await keyOk(h,env))){fail(ip);return J({ok:false},401)}
    FAILS.delete(ip);let id='';
    if(KV)id=await sesNew(env,o,req);
    else if(o.upstream){try{const r=await fetch(o.upstream+'/admin/__newses',{method:'POST',headers:{'content-type':'application/json','x-adm-key':h},body:JSON.stringify({dev:devOf(req),cc:(req.cf&&req.cf.country)||''})});const j=await r.json();id=j.id||''}catch(e){}}
    if(!id)return J({ok:false,e:'store'},503);
    return J({ok:true},200,{'set-cookie':COOK(id,Math.round(SES_AGE/1000))})}
  if(p==='/admin/__newses'&&req.method==='POST'&&KV){if(!(await keyOk(req.headers.get('x-adm-key')||'',env)))return J({ok:false},401);let v={};try{v=await req.json()}catch(e){}return J({ok:true,id:await sesNew(env,o,req,v)})}
  const id=cookieSes(req);
  /* logging out only from the admin pages themselves (or a typed address): another site cannot sign the owner out with a link */
  if(p==='/admin/__logout'){const sf=req.headers.get('sec-fetch-site');if(sf&&sf!=='same-origin'&&sf!=='none')return new Response(null,{status:302,headers:{location:u.origin+'/admin/','cache-control':'no-store'}});if(id){if(KV){const L=await kvGet(env,'ses:'+o.app,[]);await env.CFG.put('ses:'+o.app,JSON.stringify(L.filter(s=>s.id!==id)))}else if(o.upstream){try{await fetch(o.upstream+'/admin/__logout',{headers:{cookie:'adm='+id},redirect:'manual'})}catch(e){}}OKSES.delete(id)}
    return new Response(null,{status:302,headers:{location:u.origin+'/admin/','set-cookie':COOK('',0),'cache-control':'no-store'}})}
  if(!(await sesOk(env,o,id,req))){if(req.method!=='GET'&&req.method!=='HEAD'||p.startsWith('/admin/__'))return J({ok:false},401);
    return new Response(loginPage(o),{status:200,headers:Object.assign({'content-type':'text/html; charset=utf-8'},SEC)})}
  if(p==='/admin/__kit.js')return new Response('window.__ADMKIT='+JSON.stringify(Object.assign({app:o.app,title:o.title,accent:o.accent,parts:o.parts||[]},o.kit||{}))+';\n'+KIT,{headers:Object.assign({'content-type':'text/javascript; charset=utf-8'},SEC)});
  if(p==='/admin/__qr.js')return new Response(QR,{headers:Object.assign({'content-type':'text/javascript; charset=utf-8'},SEC)});
  if(p==='/admin/__who')return J({ok:true});
  if(p.startsWith('/admin/__')){
    if(!KV){if(!o.upstream)return J({ok:false,e:'store'},503);
      const fr=await fetch(o.upstream+p,{method:req.method,headers:{cookie:'adm='+id,'content-type':'application/json'},body:req.method==='POST'?await req.text():undefined});return new Response(fr.body,{status:fr.status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
    const sk='st:'+o.app;let st=await kvGet(env,sk,{done:[],log:[],tpl:[]});
    if(p==='/admin/__sessions'){const L=await kvGet(env,'ses:'+o.app,[]);const out=[];for(const x of L.filter(sesLive))out.push({at:x.at,exp:x.exp||0,dev:x.dev,cc:x.cc,me:x.id===id,h:hex(await crypto.subtle.digest('SHA-256',enc.encode('h:'+x.id))).slice(0,16)});return J({ok:true,list:out})}
    if(p==='/admin/__revoke'&&req.method==='POST'){let d={};try{d=await req.json()}catch(e){}const L=await kvGet(env,'ses:'+o.app,[]);let keep,msg;
      if(d&&typeof d.one==='string'){const hs=[];for(const x of L)hs.push(hex(await crypto.subtle.digest('SHA-256',enc.encode('h:'+x.id))).slice(0,16));const tgt=L.find((x,i)=>hs[i]===d.one&&x.id!==id);if(!tgt)return J({ok:false,e:'nf'},404);keep=L.filter(x=>x!==tgt);msg='נותק מכשיר: '+(tgt.dev||'')}
      else{keep=L.filter(x=>x.id===id);msg='נותקו כל המכשירים האחרים'}
      await env.CFG.put('ses:'+o.app,JSON.stringify(keep));st.log=(st.log||[]).concat({at:Date.now(),t:msg}).slice(-300);await env.CFG.put(sk,JSON.stringify(st));return J({ok:true})}
    if(p==='/admin/__sum'){const er=await kvGet(env,'er:'+o.app,{items:[]}),lg=await kvGet(env,'lg:'+o.app,[]);return J({ok:true,me:await sh(id),errs:(er.items||[]).map(x=>x.at),logins:lg.slice(-50).map(x=>({at:x.at,h:x.h||''}))})}
    if(p==='/admin/__hist'){const hk='hi:'+o.app;let H=await kvGet(env,hk,[]);if(req.method!=='POST')return J({ok:true,list:H});
      let d={};try{d=await req.json()}catch(e){}const it=H.find(x=>x.at===d.restore);if(!it)return J({ok:false,e:'nf'},404);
      const cur=await kvGet(env,'cfg:'+o.app,{});H.push({at:Date.now(),t:'לפני שחזור',c:cur});await env.CFG.put(hk,JSON.stringify(H.slice(-25)));
      await env.CFG.put('cfg:'+o.app,JSON.stringify(it.c||{}));st.log=(st.log||[]).concat({at:Date.now(),t:'שוחזרו ההגדרות כפי שהיו ב־'+new Date(it.at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})}).slice(-300);await env.CFG.put(sk,JSON.stringify(st));return J({ok:true,cfg:it.c||{},state:st})}
    if(p==='/admin/__gh'&&req.method==='POST')return ghOp(req,env,o,st,sk);
    if(p==='/admin/__logins')return J({ok:true,list:await kvGet(env,'lg:'+o.app,[])});
    if(p==='/admin/__errs'){if(req.method==='POST'){await env.CFG.put('er:'+o.app,JSON.stringify({day:'',n:0,items:[]}));return J({ok:true,items:[]})}const L=await kvGet(env,'er:'+o.app,{items:[]});return J({ok:true,items:L.items||[]})}
    if(p==='/admin/__state'){if(req.method==='POST'){let d=null;try{d=await req.json()}catch(e){}const s2=d&&d.state||{};
        if(Array.isArray(s2.done))st.done=s2.done.filter(x=>typeof x==='string').slice(-3000);
        if(Array.isArray(s2.tpl))st.tpl=s2.tpl.filter(x=>typeof x==='string').map(x=>x.slice(0,1500)).slice(0,20);
        await env.CFG.put(sk,JSON.stringify(st))}return J({ok:true,state:st})}
    if(p==='/admin/__cfg'){if(req.method!=='POST')return J({ok:false},405);
      let d=null;try{d=await req.json()}catch(e){}if(!d||typeof d.cfg!=='object'||!d.cfg)return J({ok:false,e:'bad'},400);
      const txt=JSON.stringify(d.cfg);if(txt.length>60000)return J({ok:false,e:'big'},413);
      {const prev=await env.CFG.get('cfg:'+o.app);if(prev&&prev!==txt){const hk='hi:'+o.app,H=await kvGet(env,hk,[]);let c={};try{c=JSON.parse(prev)}catch(e){}H.push({at:Date.now(),t:String(d.log&&d.log.t||'שינוי הגדרות').slice(0,200),c});await env.CFG.put(hk,JSON.stringify(H.slice(-25)))}}
      await env.CFG.put('cfg:'+o.app,txt);if(d.log&&d.log.t){st.log=(st.log||[]).concat({at:Date.now(),t:String(d.log.t).slice(0,200)}).slice(-300);await env.CFG.put(sk,JSON.stringify(st))}
      return J({ok:true,state:st})}
    return J({ok:false},404)}
  const r=await serve(req);const hd=new Headers(r.headers);for(const k in SEC)hd.set(k,SEC[k]);
  if((hd.get('content-type')||'').includes('text/html')){hd.delete('content-length');const t=(await r.text()).replace('<head>','<head><script>window.__FIN_ADMSES__=1</script>').replace('</body>','<script src="/admin/__kit.js" defer></script></body>');return new Response(t,{status:r.status,headers:hd})}
  return new Response(r.body,{status:r.status,headers:hd})}
/* GitHub writes from the admin panel: only allowed files and workflows, with the key that lives in the Worker (secret GH_TOKEN) */
const b64=t=>{const u=enc.encode(t);let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
async function ghOp(req,env,o,st,sk){const G=o.gh||{};if(!G.repo)return J({ok:false,e:'off'},404);if(!env.GH_TOKEN)return J({ok:false,e:'notoken'},503);
  let d={};try{d=await req.json()}catch(e){}
  const H={authorization:'Bearer '+env.GH_TOKEN,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'admin-gate'};
  const logIt=async t=>{st.log=(st.log||[]).concat({at:Date.now(),t}).slice(-300);await env.CFG.put(sk,JSON.stringify(st))};
  if(d.op==='put'){if(!(G.files||[]).includes(d.path))return J({ok:false,e:'path'},403);const text=String(d.text==null?'':d.text);if(text.length>200000)return J({ok:false,e:'big'},413);
    const base='https://api.github.com/repos/'+G.repo+'/contents/'+d.path;let sha;const g=await fetch(base+'?ref=main',{headers:H});
    if(g.ok)sha=(await g.json()).sha;else if(g.status!==404)return J({ok:false,e:'gh'+g.status},502);
    const pr=await fetch(base,{method:'PUT',headers:Object.assign({'content-type':'application/json'},H),body:JSON.stringify({message:String(d.msg||'Update '+d.path).slice(0,120),content:b64(text),branch:'main',sha})});
    if(!pr.ok)return J({ok:false,e:'gh'+pr.status},502);await logIt('נשמר ב־GitHub: '+d.path);return J({ok:true})}
  if(d.op==='dispatch'){if(!(G.wf||[]).includes(d.wf))return J({ok:false,e:'wf'},403);
    const r=await fetch('https://api.github.com/repos/'+G.repo+'/actions/workflows/'+d.wf+'/dispatches',{method:'POST',headers:Object.assign({'content-type':'application/json'},H),body:JSON.stringify({ref:'main'})});
    return r.ok?J({ok:true}):J({ok:false,e:'gh'+r.status},502)}
  return J({ok:false,e:'op'},400)}
function loginPage(o){const t=o.title||'כניסת מנהל',acc=o.accent||'#F2C49B';
return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>כניסת מנהל · ${t}</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#16181D;color:#F4F5F7;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;display:flex;justify-content:center;padding:48px 18px}
main{width:100%;max-width:400px;display:flex;flex-direction:column;gap:18px}h1{margin:0;font-size:26px;text-align:center}.sub{margin:0;text-align:center;color:#B8BCC8;font-size:15px}
form{background:#23262E;border-radius:16px;padding:18px 16px;display:flex;flex-direction:column;gap:10px}label{font-size:14px;color:#B8BCC8}
input{font:16px system-ui,Arial,sans-serif;padding:13px 14px;border-radius:12px;border:1px solid #3A3E49;background:#16181D;color:#F4F5F7;direction:ltr;text-align:left}
button{min-height:50px;border:none;border-radius:999px;background:${acc};color:#16181D;font:700 17px system-ui,Arial,sans-serif;cursor:pointer}button[disabled]{opacity:.6}
.lnk{background:none;color:${acc};min-height:44px;font-weight:600;font-size:15px}.msg{min-height:22px;margin:0;font-size:14px;color:#FFB4A8;text-align:center}.foot{color:#8A8F9C;font-size:13px;text-align:center}
svg{display:block;margin:0 auto}</style></head><body><main>
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${acc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/></svg>
<h1>כניסת מנהל</h1><p class="sub">${t} · גרסת מנהל</p>
<form id="f1" autocomplete="off"><label for="n">שם הבעלים</label><input id="n" autocapitalize="off" autocorrect="off" spellcheck="false" required>
<label for="c">קוד מפתח</label><input id="c" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" required>
<button id="go">כניסה</button><p class="msg" id="m" aria-live="polite"></p></form>
<form id="f2" hidden autocomplete="off"><label for="r">קוד שחזור (20 תווים)</label><input id="r" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" required>
<button id="go2">כניסה עם קוד שחזור</button><p class="msg" id="m2" aria-live="polite"></p></form>
<button class="lnk" id="sw" type="button">יש לי קוד שחזור</button>
<p class="foot">מי שאין לו את הקוד לא יכול להיכנס לכאן. האתר הרגיל לא מכיל את כלי הניהול.</p></main>
<script>
const $=i=>document.getElementById(i),E=new TextEncoder(),H=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const U=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),ST=${JSON.stringify(o.store||{})},RB=${JSON.stringify(REC_BUNDLE)};
async function pb(t,salt,it){const k=await crypto.subtle.importKey('raw',E.encode(t),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:E.encode(salt),iterations:it},k,256))}
async function login(h,name,msg){const r=await fetch('/admin/__login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({h}),credentials:'same-origin'});
 if(r.ok){try{if(ST.key){sessionStorage.setItem(ST.key,h);localStorage.removeItem(ST.key)}if(ST.name){if(name)sessionStorage.setItem(ST.name,name);localStorage.removeItem(ST.name)}}catch(e){}location.replace('/admin/');return}
 msg.textContent=r.status===429?'יותר מדי ניסיונות. נסו שוב בעוד רבע שעה.':'השם או הקוד לא נכונים'}
$('f1').onsubmit=async e=>{e.preventDefault();const m=$('m'),g=$('go');const name=$('n').value.replace(/\\s+/g,'').toUpperCase();
 const code=String($('c').value||'').replace(/^.*?(FC[-\\s]?)/i,'FC').replace(/[^0-9a-z]/gi,'').toUpperCase();
 if(!name||code.length<14){m.textContent='צריך להקליד שם וקוד מלאים';return}g.disabled=true;m.textContent='בודק…';
 try{await login(H(await pb(name+':'+code,'fincalc-dev-v2',150000)),name,m)}catch(x){m.textContent='משהו השתבש, נסו שוב'}g.disabled=false};
$('f2').onsubmit=async e=>{e.preventDefault();const m=$('m2'),g=$('go2');const v=String($('r').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(v.length!==20){m.textContent='הקוד צריך 20 תווים';return}g.disabled=true;m.textContent='בודק…';
 try{const kb=await pb('NSREC:'+v,'ns-recover-v1',200000),p=RB.split('.');const ak=await crypto.subtle.importKey('raw',kb,'AES-GCM',false,['decrypt']);
  const h=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:U(p[1])},ak,U(p[2])));await login(h,'',m)}catch(x){m.textContent='קוד השחזור לא נכון'}g.disabled=false};
$('sw').onclick=()=>{const a=$('f1').hidden;$('f1').hidden=!a;$('f2').hidden=a;$('sw').textContent=a?'יש לי קוד שחזור':'כניסה עם שם וקוד';};
</script></body></html>`}
