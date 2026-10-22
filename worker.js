// The site is static files (admin panel v2). This small Worker locks the admin version (/admin/), keeps the admin panel's settings (KV),
// and adds the public part of the panel (message, what's new, parts switched off, forced update) to the main page.
import {adminGate,publicConfig,pubScript,injectPub,errReport,ping} from './_gate.js';
const OPT={app:'calc',title:'מחשבון פיננסי',accent:'#8CC8FF',priv:'fin-priv',langLS:'fin-lang',store:{key:'fin-dev',name:'fin-dev-n'},
  gh:{repo:'ysdesign-il/financial-calculator',files:['devcode.json','srcpref.json','family.json','inboxkey.json'],wf:['test.yml']},
  parts:[['assist','לשונית העוזר','.nav [data-tab="assist"]'],['clients','לשונית הלקוחות','.nav [data-tab="clients"]'],['expenses','לשונית ההוצאות','.nav [data-tab="expenses"]']],
  kit:{langs:['he','ar','en'],inbox:{data:'/inbox.json',keyLS:['fin-ibkey','fin-ibkey-next'],keyFile:'/inboxkey.json',sec:'fin-dev'},screens:{type:'click',sel:'.nav [data-tab]',wait:900},
    changeCode:{click:'[data-rec="chg"]'},noReset:true,langLS:['fin-lang'],i18n:{files:['es','fr','hi','it','pt-BR','ru','zh-CN'],path:'/lang/'},
    links:[['דף הבית','/'],['משכנתא','/?go=mortgage'],['הלוואה','/?go=loan'],['ריבית דריבית','/?go=compound'],['מע״מ','/?go=vat'],['הוצאות','/?go=expenses']],
    
    data:[['ריביות, מטבעות ומדדים','/rates.json','updated|asOf',30],['מחירון רכב','/cars.json','asOf',240],['היסטוריית מדדים','/history.json','at',30]]}};
export default{async fetch(req,env){const p=new URL(req.url).pathname;
  if(p==='/cfg.json')return publicConfig('calc',env,OPT);
  if(p==='/__pub.js')return pubScript(OPT);
  if(p==='/__err')return errReport(req,'calc',env,OPT);
  if(p==='/__ping')return ping('calc',env,OPT,q=>env.ASSETS.fetch(new Request(new URL(q,req.url))));
  if(p==='/admin'||p.startsWith('/admin/'))return adminGate(req,r=>env.ASSETS.fetch(r),OPT,env);
  const r=await env.ASSETS.fetch(req);if(p==='/'||p==='/index.html')return injectPub(r,OPT);return r}};
