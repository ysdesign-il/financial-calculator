// The site is static files. This small Worker locks the admin version (/admin/), keeps the admin panel's settings (KV),
// and adds the public part of the panel (message, what's new, parts switched off, forced update) to the main page.
import {adminGate,publicConfig,pubScript,injectPub} from './_gate.js';
const OPT={app:'calc',title:'מחשבון פיננסי',accent:'#8CC8FF',store:{key:'fin-dev',name:'fin-dev-n'},
  parts:[['assist','לשונית העוזר','.nav [data-tab="assist"]'],['clients','לשונית הלקוחות','.nav [data-tab="clients"]'],['expenses','לשונית ההוצאות','.nav [data-tab="expenses"]']],
  kit:{langs:['he','ar','en'],inbox:{data:'/inbox.json',keyLS:['fin-ibkey','fin-ibkey-next'],keyFile:'/inboxkey.json',sec:'fin-dev'},screens:{type:'click',sel:'.nav [data-tab]',wait:900},
    changeCode:{click:'[data-rec="chg"]'},noReset:true}};
export default{async fetch(req,env){const p=new URL(req.url).pathname;
  if(p==='/cfg.json')return publicConfig('calc',env,OPT);
  if(p==='/__pub.js')return pubScript(OPT);
  if(p==='/admin'||p.startsWith('/admin/'))return adminGate(req,r=>env.ASSETS.fetch(r),OPT,env);
  const r=await env.ASSETS.fetch(req);if(p==='/'||p==='/index.html')return injectPub(r);return r}};
