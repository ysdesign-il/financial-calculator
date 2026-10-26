// The site is static files (admin panel v2). This small Worker locks the admin version (/admin/), keeps the admin panel's settings (KV),
// The main page and the public part of the panel (/__pub.js, written by the build) are plain static files, so opening the site
// costs a single Worker request (/cfg.json) – the free plan's daily quota then covers about 100,000 visits a day.
import {adminGate,publicConfig,publicDocs,errReport,ping,fontProxy} from './_gate.js';
import {healthCron} from './_push.js';
import {PUBCFG} from './pubcfg.js';
/* every half hour: are the sites up? (phone alert to the owner when one goes down or comes back) */
const HEALTH=[['calc','מחשבון פיננסי','https://financial-calculator.design-il.workers.dev'],['neshima','נשימה שקטה','https://neshima-shketa.pages.dev']];
const OPT={app:'calc',title:'מחשבון פיננסי',accent:PUBCFG.accent,priv:PUBCFG.priv,langLS:'fin-lang',store:{key:'fin-dev',name:'fin-dev-n'},
  gh:{repo:'ysdesign-il/financial-calculator',files:['devcode.json','srcpref.json','family.json','inboxkey.json'],wf:['test.yml']},
  parts:PUBCFG.parts,docs:['terms','priv','a11y'],
  kit:{langs:['he','ar','en'],inbox:{data:'/inbox.json',keyLS:['fin-ibkey','fin-ibkey-next'],keyFile:'/inboxkey.json',sec:'fin-dev'},screens:{type:'click',sel:'.nav [data-tab]',wait:900},
    changeCode:{click:'[data-rec="chg"]'},noReset:true,langLS:['fin-lang'],i18n:{files:['es','fr','hi','it','pt-BR','ru','zh-CN'],path:'/lang/'},
    links:[['דף הבית','/'],['משכנתא','/?go=mortgage'],['הלוואה','/?go=loan'],['ריבית דריבית','/?go=compound'],['מע״מ','/?go=vat'],['הוצאות','/?go=expenses']],
    
    data:[['ריביות, מטבעות ומדדים','/rates.json','updated|asOf',30],['מחירון רכב','/cars.json','asOf',240],['היסטוריית מדדים','/history.json','at',30]]}};
export default{async scheduled(ev,env,ctx){ctx.waitUntil(healthCron(env,HEALTH))},
  async fetch(req,env){const p=new URL(req.url).pathname;
  if(p==='/cfg.json')return publicConfig('calc',env,OPT,req);
  if(p==='/legal.json')return publicDocs('calc',env,OPT,req);
  if(p==='/__err')return errReport(req,'calc',env,OPT);
  if(p.startsWith('/gf/'))return fontProxy(req);
  if(p==='/__ping')return ping('calc',env,OPT,q=>env.ASSETS.fetch(new Request(new URL(q,req.url))));
  if(p==='/admin'||p.startsWith('/admin/'))return adminGate(req,async r=>{const q=new URL(r.url).pathname;
    if(q==='/admin/'||q==='/admin/index.html'){const a=await env.ASSETS.fetch(new Request(new URL('/',r.url),{headers:r.headers}));const h=(await a.text()).replace('<head>','<head><base href="/"><meta name="robots" content="noindex,nofollow"><script>window.__FIN_ADMIN__=1</script>');
      return new Response(h,{status:a.status,headers:{'content-type':'text/html; charset=utf-8'}})}
    return env.ASSETS.fetch(new Request(new URL(q.slice(6)||'/',r.url),{headers:r.headers}))},OPT,env);
  return env.ASSETS.fetch(req)}};
