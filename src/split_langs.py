"""13.53: the interface texts are split by language, so a phone downloads only its own language.

The built script keeps every text as T[key] = [Hebrew, Arabic, English]. Most keys are only ever read through t() in the current
language, so they move out of app.js into tp/he.js, tp/ar.js and tp/en.js (English also serves the other 7 interface languages,
whose packs in lang/ sit on top). index.html loads the right pack before app.js; when the language changes, the app loads the
other pack and redraws (see the 13.53 block in speed_end.js).

Keys that some feature reads in more than one language stay in app.js with all three: screen and topic names, field labels
(the "show English labels" option and search in any language), screen descriptions, glossary terms, CV document texts and group
names. A text block that is not plain data (it uses a variable or a function) is left exactly as it was.
"""
import json, re, subprocess, os, hashlib

KEEP_PREFIX = ('tab_', 'fam_', 'gl_t_', 'gs_', 'cv_', 'd_', 'f_', 'g_')
KEEP_KEYS = {'ux_lbl', 'ux_lblH', 'cl_name', 'cl_phone'}
START = re.compile(r'(?m)^(const T = \{|Object\.assign\(T, \{)')
NODE_EVAL = r"""
const vm = require('vm'), fs = require('fs');
const blocks = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), out = [];
for (const b of blocks){
  try {
    const ctx = {T: {}};
    vm.runInNewContext(b.replace(/^const T = \{/, 'Object.assign(T, {').replace(/\};\s*$/, '});'), ctx, {timeout: 2000});
    const e = Object.keys(ctx.T).map(k => [k, ctx.T[k]]);
    out.push(e.every(([k, v]) => Array.isArray(v) && v.length === 3 && v.every(x => typeof x === 'string')) ? {ok: true, e} : {ok: false});
  } catch (err) { out.push({ok: false}); }
}
process.stdout.write(JSON.stringify(out));
"""


def keep3(k):
    return k.startswith(KEEP_PREFIX) or k in KEEP_KEYS


def split(app, tmp='/tmp'):
    """returns (new app text, {'he': {...}, 'ar': {...}, 'en': {...}})"""
    spans = []
    for m in START.finditer(app):
        st = m.start()
        end = app.find('\n});', st) if m.group(1).startswith('Object') else app.find('\n};', st)
        if end < 0:
            continue
        end = app.find('\n', end + 1)
        end = len(app) if end < 0 else end
        if spans and st < spans[-1][1]:
            continue
        spans.append((st, end))
    blocks = [app[a:b] for a, b in spans]
    bf, jf = os.path.join(tmp, 'fin_tblocks.json'), os.path.join(tmp, 'fin_teval.js')
    json.dump(blocks, open(bf, 'w', encoding='utf-8'))
    open(jf, 'w').write(NODE_EVAL)
    res = json.loads(subprocess.run(['node', jf, bf], capture_output=True, text=True, check=True).stdout)
    assert len(res) == len(blocks)
    # a key that also appears in a block we leave untouched must never move out
    pinned = set()
    for b, r in zip(blocks, res):
        if not r['ok']:
            pinned.update(re.findall(r'(?m)^\s*([A-Za-z_$][\w$]*)\s*:', b))
    packs = {'he': {}, 'ar': {}, 'en': {}}
    out, pos, first_const = [], 0, True
    for (a, b), blk, r in zip(spans, blocks, res):
        out.append(app[pos:a]); pos = b
        if not r['ok']:
            out.append(blk); continue
        kept = []
        for k, v in r['e']:
            if keep3(k) or k in pinned:
                kept.append((k, v))
            else:
                packs['he'][k], packs['ar'][k], packs['en'][k] = v
        # a later block that keeps a key overrides an earlier moved value: drop it from the packs
        for k, _ in kept:
            for p in packs.values():
                p.pop(k, None)
        body = ',\n'.join('  %s:%s' % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in kept)
        if blk.startswith('const T'):
            out.append('const T = {\n' + body + '\n};\n'
                       '/* 13.53: the texts of this phone\'s language (tp/<lang>.js, loaded before this script) – every slot gets it, so t() works as before */\n'
                       '(function(){ const W = window.__FIN_TP || {}, L = window.__FIN_TPL && W[window.__FIN_TPL] ? window.__FIN_TPL : (W.he ? \'he\' : W.ar ? \'ar\' : \'en\'), P = W[L] || {};\n'
                       '  for (const k in P){ const v = P[k]; T[k] = [v, v, v]; } window.__FIN_TPL = L; })();')
            first_const = False
        else:
            out.append('Object.assign(T, {\n' + body + '\n});' if kept else '')
    out.append(app[pos:])
    new = ''.join(out)
    assert not first_const, 'the main text table (const T = {) was not plain data'
    return new, packs


def pack_js(lang, d):
    return 'window.__FIN_TP=window.__FIN_TP||{};window.__FIN_TP[%s]=%s;\n' % (json.dumps(lang), json.dumps(d, ensure_ascii=False, separators=(',', ':')))
