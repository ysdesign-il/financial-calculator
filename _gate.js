// Server-side lock for the admin version (/admin/). The admin files are served only to a browser that proved it holds
// the developer key (the same name + code as developer mode). Nothing secret is stored here: only a fingerprint of the key.
// Used by a Cloudflare Pages Function or a Worker. Also serves the public settings the admin panel publishes (/cfg.json).
const DEV_CHECK='2ff82c4945c39ddf16442f25fdc6b3ee96b832d2ea9b26448813ba9087d1c285';
const REC_BUNDLE='nsr1.iWUL8ojgMNK6qJIp.JxT7Dcnxml12WgcvhJdS7RFevhkpINNl462Eybdg5Swvm2Xlp0fOCA1Vn7FTTFJovZJXcZ/oBUHOA2qJA4K7sRMCFKCY6IYbvJll4kaeWHU=';
const SB='https://cylzdgpubxzjyveeauqw.supabase.co';
const SBK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bHpkZ3B1Ynh6anl2ZWVhdXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTk2MzIsImV4cCI6MjEwNzkzNTYzMn0.kZ4Xmiva3bxWczXfo9098IZeAsQryL9aH_emF_6NP-o';
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function keyOk(h){return typeof h==='string'&&/^[0-9a-f]{64}$/.test(h)&&hex(await crypto.subtle.digest('SHA-256',enc.encode(h)))===DEV_CHECK}
function cookieKey(req){const m=/(?:^|;\s*)adm=([0-9a-f]{64})/.exec(req.headers.get('cookie')||'');return m?m[1]:''}
const FAILS=new Map();
function tooMany(ip){const now=Date.now(),a=(FAILS.get(ip)||[]).filter(t=>now-t<15*60e3);FAILS.set(ip,a);return a.length>=8}
function fail(ip){const a=FAILS.get(ip)||[];a.push(Date.now());FAILS.set(ip,a)}
const J=(o,st,extra)=>new Response(JSON.stringify(o),{status:st||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},extra||{})});
const SEC={'x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer','x-frame-options':'DENY','cache-control':'no-store, private'};
export async function publicConfig(app){
  try{const r=await fetch(SB+'/rest/v1/adm_config?select=data,updated_at&app=eq.'+encodeURIComponent(app),{headers:{apikey:SBK,Authorization:'Bearer '+SBK},cf:{cacheTtl:30}});
    if(r.ok){const a=await r.json();if(a&&a[0])return J(Object.assign({},a[0].data,{at:a[0].updated_at}),200,{'cache-control':'public, max-age=30'})}}catch(e){}
  return J({},200,{'cache-control':'public, max-age=30'})}
export async function adminGate(req,serve,o){
  const u=new URL(req.url),p=u.pathname,ip=req.headers.get('cf-connecting-ip')||'?';
  if(p==='/admin')return Response.redirect(u.origin+'/admin/',302);
  if(p==='/admin/__login'&&req.method==='POST'){
    if(tooMany(ip))return J({ok:false,e:'wait'},429);
    let h='';try{h=(await req.json()).h}catch(e){}
    if(await keyOk(h)){FAILS.delete(ip);return J({ok:true},200,{'set-cookie':`adm=${h}; Path=/admin; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`})}
    fail(ip);return J({ok:false},401)}
  if(p==='/admin/__logout')return new Response(null,{status:302,headers:{location:u.origin+'/admin/','set-cookie':'adm=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax','cache-control':'no-store'}});
  const h=cookieKey(req);
  if(!(await keyOk(h))){if(req.method!=='GET'&&req.method!=='HEAD')return J({ok:false},401);
    return new Response(loginPage(o),{status:200,headers:Object.assign({'content-type':'text/html; charset=utf-8'},SEC)})}
  if(p==='/admin/__cfg'&&req.method==='POST'){let d=null;try{d=await req.json()}catch(e){}
    if(!d||typeof d!=='object')return J({ok:false,e:'bad'},400);
    try{const r=await fetch(SB+'/rest/v1/rpc/adm_set_config',{method:'POST',headers:{apikey:SBK,Authorization:'Bearer '+SBK,'content-type':'application/json'},body:JSON.stringify({p_app:o.app,p_key:h,p_data:d})});
      if(r.ok)return J({ok:true,saved:await r.json()});return J({ok:false,e:'store',st:r.status},502)}catch(e){return J({ok:false,e:'store'},502)}}
  const r=await serve(req);const hd=new Headers(r.headers);for(const k in SEC)hd.set(k,SEC[k]);return new Response(r.body,{status:r.status,headers:hd})}
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
 if(r.ok){try{if(ST.key)localStorage.setItem(ST.key,h);if(ST.name&&name)localStorage.setItem(ST.name,name)}catch(e){}location.replace('/admin/');return}
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
