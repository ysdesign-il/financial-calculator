// The site is static files. This small Worker only locks the admin version (/admin/) and serves the published settings (/cfg.json).
import {adminGate,publicConfig} from './_gate.js';
const OPT={app:'calc',title:'מחשבון פיננסי',accent:'#8CC8FF',store:{key:'fin-dev',name:'fin-dev-n'}};
export default{async fetch(req,env){const p=new URL(req.url).pathname;
  if(p==='/cfg.json')return publicConfig('calc');
  if(p==='/admin'||p.startsWith('/admin/'))return adminGate(req,r=>env.ASSETS.fetch(r),OPT);
  return env.ASSETS.fetch(req)}};
