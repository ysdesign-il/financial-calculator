import re, os
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
ROOT = os.path.dirname(HERE)
L = open('orig.html', encoding='utf-8').read().split('\n')
P = lambda n: open('p/'+n, encoding='utf-8').read()
def seg(a, b): return '\n'.join(L[a-1:b])   # 1-indexed inclusive

assert L[528].startswith('const TABS') and L[612].strip()=='};' and L[615].startswith('function unitHTML')
assert L[743].startswith('const navEl') and L[860].startswith('/* ===') and 'navigation' in L[1243] and L[501].strip()=='};'
out = []
out.append(seg(1, 11)); out.append(P('tokens.css')); out.append(seg(38, 231)); out.append(P('css.css')); out.append(P('theme.css')); out.append(P('design.css'))
out.append(seg(232, 234)); out.append(P('body.html')); out.append(seg(267, 502)); out.append(P('i1.js')+P('i2.js')+P('i3.js')+P('i4.js')+P('i5.js')+P('i6.js')+P('i7.js')+P('i8.js')+P('i9.js')+P('i10.js')+P('i11.js')+P('i12.js')+P('i13.js')+P('i14.js')+P('i15.js')+P('i16.js')+P('i17.js'))
out.append(seg(503, 523)); out.append(P('crypto.js')); out.append(P('fx_official.js')); out.append(P('groups.js'))
out.append(seg(530, 613)); out.append(P('ico.js'))
out.append(seg(614, 615)); out.append(P('sico.js')+P('ui2a.js')+P('ui2b.js')+P('ui2d.js')+P('ui2c.js')+P('ui2e.js'))
out.append(P('home.js')+P('settings_ui.js')+P('tools.js')+P('saved_pre.js')); out.append(seg(744, 860)); out.append(P('c1.js')+P('c2.js')+P('c3.js')+P('c4.js')+P('c5.js')+P('c6.js')+P('c7.js')+P('c8.js'))
out.append(seg(1244, len(L)))
s = '\n'.join(out)
# show(): warnings
s = s.replace("  const nt = $('#nt-'+id);\n", """  const wn = $('#wn-'+id);
  if (res.warn && res.warn.length){ wn.hidden = false; wn.textContent = res.warn.join(' '); wn.className = 'warn' + (res.warnOk ? ' ok-note' : ''); }
  else wn.hidden = true;
  const nt = $('#nt-'+id);
""", 1)
s = s.replace("sub: t('r_taxLabel', {n: MI(best[1] / 12) + ' / ' + t('o_perMonth')})", "sub: t('r_netRent') + ': ' + MI(yr - best[1])")
exec(open('post.py',encoding='utf-8').read())
s = s.replace('localStorage.', 'LS.')
shim = '''const RAWLS = window.localStorage, SS = window.sessionStorage;
const ENC_NAME = u => encodeURIComponent(String(u).toLowerCase());
const FUSER = (() => { try { const u = SS.getItem('fin-user') || ''; return u && RAWLS.getItem('fin-acc:' + ENC_NAME(u)) && SS.getItem('fin-ek') ? u : ''; } catch (e) { return ''; } })();
const pk = k => FUSER ? k + ':' + ENC_NAME(FUSER) : k;
const WK = k => 'w:' + pk(k);
var persistTimer = null;
function persistSoon(){ clearTimeout(persistTimer); persistTimer = setTimeout(() => { persistNow(); }, 600); }
var LIVE_ID = (() => { try { return Array.from(crypto.getRandomValues(new Uint8Array(8)), x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return String(Math.random()).slice(2, 18); } })();
var LIVE_APPLYING = false, LIVE_FORCE = false, LIVE_SEALED = '', LIVE_SEAL_AT = 0;
function liveTouch(k){ if (LIVE_APPLYING || !FUSER) return; try { const ts = JSON.parse(SS.getItem(WK('__ts')) || '{}') || {}; ts[k] = Date.now(); SS.setItem(WK('__ts'), JSON.stringify(ts)); } catch (e) {} }
const LS = FUSER
  ? {getItem: k => SS.getItem(WK(k)), setItem: (k, v) => { v = String(v); if (SS.getItem(WK(k)) === v) return; SS.setItem(WK(k), v); liveTouch(k); persistSoon(); }, removeItem: k => { if (SS.getItem(WK(k)) == null) return; SS.removeItem(WK(k)); liveTouch(k); persistSoon(); }}
  : {getItem: k => RAWLS.getItem(k), setItem: (k, v) => RAWLS.setItem(k, v), removeItem: k => RAWLS.removeItem(k)};
const DATA_KEYS = ['fin-set', 'fin-vals', 'fin-scn', 'fin-lang', 'fin-cur', 'fin-tab', 'fin-exp', 'fin-clients', 'fin-trash'];
/* saving: automatic, or only when you tap Save. In manual mode your data changes wait here (and survive a reload of this tab) until you save */
const SAVE_KEYS = ['fin-vals', 'fin-scn', 'fin-exp', 'fin-clients'];
const LS_RAW = {getItem: LS.getItem, setItem: LS.setItem, removeItem: LS.removeItem};
const SV = {mode: 'auto', pend: new Map(), at: 0, direct: false, key: 'fin-pend' + (FUSER ? ':' + ENC_NAME(FUSER) : '')};
try { const s0 = JSON.parse(LS_RAW.getItem('fin-set') || 'null'); if (s0 && (s0.saveMode === 'manual' || s0.saveMode === 'none')) SV.mode = s0.saveMode; } catch (e) {}
try { if (SV.mode === 'manual'){ const p0 = JSON.parse(SS.getItem(SV.key) || '[]'); if (Array.isArray(p0)) p0.forEach(x => { if (Array.isArray(x) && SAVE_KEYS.includes(x[0])) SV.pend.set(x[0], x[1] == null ? null : String(x[1])); }); } else SS.removeItem(SV.key); } catch (e) {}
const svHold = k => SV.mode !== 'auto' && SAVE_KEYS.includes(k) && !LIVE_APPLYING && !SV.direct;
function svKeep(){ try { if (SV.pend.size && SV.mode === 'manual') SS.setItem(SV.key, JSON.stringify([...SV.pend])); else SS.removeItem(SV.key); } catch (e) {} try { if (typeof svUi === 'function') svUi(); } catch (e) {} }
LS.getItem = k => SV.pend.has(k) ? SV.pend.get(k) : LS_RAW.getItem(k);
LS.setItem = (k, v) => {
  if (svHold(k)){ v = String(v); if (LS_RAW.getItem(k) === v) SV.pend.delete(k); else SV.pend.set(k, v); svKeep(); return; }
  if (SV.pend.delete(k)) svKeep();
  LS_RAW.setItem(k, v); if (SAVE_KEYS.includes(k)){ SV.at = Date.now(); try { if (typeof svUi === 'function') svUi(); } catch (e) {} }
};
LS.removeItem = k => {
  if (svHold(k)){ if (LS_RAW.getItem(k) == null) SV.pend.delete(k); else SV.pend.set(k, null); svKeep(); return; }
  if (SV.pend.delete(k)) svKeep();
  LS_RAW.removeItem(k); if (SAVE_KEYS.includes(k)) SV.at = Date.now();
};
'''
assert s.count('let RATES =') == 1
s = s.replace('let RATES =', shim + 'let RATES =', 1)
import json as _j, datetime as _dt, zoneinfo as _zi
_cl = _j.load(open('p/changelog.json', encoding='utf-8'))
_now = _dt.datetime.now(_zi.ZoneInfo('Asia/Jerusalem'))
_build = _now.strftime('%Y%m%d.%H%M%S')
assert s.count('__CHANGELOG__') == 1 and s.count('__APP_BUILD__') == 1
s = s.replace('__CHANGELOG__', _j.dumps(_cl[:1], ensure_ascii=False)).replace('__APP_BUILD__', _build)
_rt = _j.load(open(os.path.join(ROOT, 'rates.json'), encoding='utf-8'))
assert s.count('__IX_BUILT__') == 1
s = s.replace('__IX_BUILT__', _j.dumps({'idx': _rt.get('idx', {}), 'mkt': _rt.get('mkt', {})}, ensure_ascii=False, separators=(',', ':')))
_ver = dict(_cl[0]); _ver['build'] = _build
_j.dump(_ver, open(os.path.join(ROOT, 'version.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('version', _ver['v'], _build)
open(os.path.join(ROOT, 'index.html'),'w',encoding='utf-8').write(s)
print(len(s.split('\n')), 'lines')
