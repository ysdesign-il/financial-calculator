"""Translate the app's interface texts into every language and write lang/<code>.json packs.

Runs in GitHub Actions with a free Gemini key stored as the repository secret GEMINI_API_KEY.
Only missing or changed texts are translated, so every run continues where the last one
stopped and a new interface text is picked up automatically. Standard library only.
"""
import json, os, re, subprocess, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = json.load(open(os.path.join(ROOT, 'i18n', 'source.json'), encoding='utf-8'))
STR, LANGS = SRC['strings'], SRC['langs']
TOKEN = os.environ.get('GITHUB_TOKEN', '').strip()
GKEY = os.environ.get('GEMINI_API_KEY', '').strip()
DEADLINE = time.time() + float(os.environ.get('MAX_MINUTES', '45')) * 60
PRIORITY = ['ru', 'am', 'fr', 'es', 'uk', 'de', 'pt-BR', 'it', 'tr', 'fa', 'zh-CN', 'hi', 'ja', 'ko', 'pl', 'ro', 'yi', 'pt-PT', 'nl', 'hu']
PH = re.compile(r'\{[A-Za-z0-9_]+\}')
LOG = {'started': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()), 'events': [], 'langs': {}}
def note(msg):
    print(msg); LOG['events'].append(msg[:400]) if len(LOG['events']) < 200 else None

def err_body(e):
    try: return e.read().decode('utf-8', 'replace')[:300]
    except Exception: return ''

def fnv(s):                                   # same hash as the page (UTF-16 code units, FNV-1a 32-bit, base 36)
    h, data = 0x811c9dc5, s.encode('utf-16-le')
    for i in range(0, len(data), 2):
        h ^= data[i] | (data[i + 1] << 8)
        h = (h * 0x01000193) & 0xffffffff
    digits, out = '0123456789abcdefghijklmnopqrstuvwxyz', ''
    while True:
        h, r = divmod(h, 36); out = digits[r] + out
        if not h: return out

HASH = {k: fnv(v) for k, v in STR.items()}

def ph_ok(en, tr): return sorted(PH.findall(en)) == sorted(PH.findall(tr))

def prompt(lang, chunk):
    L = lang['name']
    return ('You translate the user interface of a personal-finance calculator web app used mainly in Israel.\n'
            f'Translate every value of the JSON object below from English into {L} (language code "{lang["code"]}"). '
            'Return ONLY a JSON object with exactly the same keys.\nRules:\n'
            '- Natural, concise wording a native speaker expects in a finance app; keep button and menu labels short.\n'
            '- Keep placeholders such as {v}, {n}, {e}, {h} exactly as written.\n'
            '- Keep emoji, symbols (· → ↗ ✓ ✗ ★ ●), numbers, %, currency codes (ILS, USD, EUR), URLs, and these names unchanged: '
            'Gemini, Claude, Google, GitHub, Binance, Coinbase, Blink, inter.il, AI Studio, ECB.\n'
            f'- Israeli terms: translate the meaning; for official bodies (Bank of Israel, National Insurance / Bituach Leumi, Kol Zchut, '
            f'Tax Authority, Keren Hishtalmut) use the established name in {L} if one exists.\n'
            '- No explanations, no notes, no markdown.\nJSON:\n' + json.dumps(chunk, ensure_ascii=False))

def parse(text):
    a, b = text.find('{'), text.rfind('}')
    if a < 0 or b <= a: return None
    try: return json.loads(text[a:b + 1])
    except Exception: return None

def http(url, body=None, headers=None, timeout=180):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers=dict({'Content-Type': 'application/json', 'Accept': 'application/json',
                                               'User-Agent': 'translate-ui'}, **(headers or {})))
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        if (r.headers.get('Content-Encoding') or '').lower() == 'gzip':
            import gzip; raw = gzip.decompress(raw)
        try: return json.loads(raw.decode('utf-8'))
        except ValueError:
            raise ValueError(f'non-JSON reply {r.status} {r.headers.get("Content-Type")} {r.geturl()} {raw[:200]!r}')

class Exhausted(Exception): pass

class Gemini:
    name, size = 'gemini', 8000
    models = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-flash-lite-latest']
    def __init__(self): self.dead = set()
    def ask(self, text):
        for m in self.models:
            if m in self.dead: continue
            try:
                j = http(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent',
                         {'contents': [{'role': 'user', 'parts': [{'text': text}]}],
                          'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0.2}},
                         {'x-goog-api-key': GKEY})
                parts = ((j.get('candidates') or [{}])[0].get('content') or {}).get('parts') or []
                return ''.join(p.get('text', '') for p in parts if not p.get('thought'))
            except urllib.error.HTTPError as e:
                note(f'  gemini {m}: HTTP {e.code} {err_body(e)}')
                if e.code in (429,): self.dead.add(m); continue
                if e.code in (400, 401, 403): raise Exhausted('gemini key refused (%s)' % e.code)
                if e.code in (404,): self.dead.add(m); continue
                time.sleep(5)
            except Exception: time.sleep(5)
        raise Exhausted('gemini quota used up')

HEAVY = {'am','ti','hy','ka','bn','gu','hi','kn','ml','mr','ne','pa','si','ta','te','th','lo','km','my','el','fa','ps','ur','yi','mn','ky','kk','be','bg','mk','ru','sr','uk','zh-CN','zh-TW','ja','ko'}

class GitHubModels:
    name, size = 'github-models', 3000
    prefer = ['openai/gpt-4.1-mini', 'openai/gpt-4o-mini', 'openai/gpt-5-mini', 'openai/gpt-4.1', 'openai/gpt-4o',
              'openai/gpt-4.1-nano', 'deepseek/DeepSeek-V3-0324', 'mistral-ai/mistral-medium-2505',
              'meta/Llama-4-Maverick-17B-128E-Instruct-FP8']
    def __init__(self):
        self.dead = set(); self.models = list(self.prefer)
        try:
            cat = http('https://models.github.ai/catalog/models', headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json'})
            ids = [m.get('id') for m in (cat if isinstance(cat, list) else cat.get('models', [])) if m.get('id')]
            chat = [i for i in ids if any(x in i.lower() for x in ('gpt', 'deepseek-v3', 'mistral-medium', 'llama-4', 'grok'))]
            self.models = [m for m in self.prefer if m in ids] + [m for m in chat if m not in self.prefer]
        except urllib.error.HTTPError as e:
            note(f'catalog: HTTP {e.code} {err_body(e)}')
        except Exception as e:
            note(f'catalog unavailable: {e}')
        note('models: ' + ', '.join(self.models[:12]))
    def ask(self, text):
        for m in self.models:
            if m in self.dead: continue
            for attempt in range(2):
                try:
                    j = http('https://models.github.ai/inference/chat/completions',
                             {'model': m, 'temperature': 0.2, 'max_tokens': 4000,
                              'messages': [{'role': 'system', 'content': 'You are a professional software localizer. Reply with JSON only.'},
                                           {'role': 'user', 'content': text}]},
                             {'Authorization': 'Bearer ' + TOKEN})
                    return (j.get('choices') or [{}])[0].get('message', {}).get('content') or ''
                except urllib.error.HTTPError as e:
                    wait = int(e.headers.get('retry-after') or 0) if e.headers else 0
                    if e.code == 429 and 0 < wait <= 90 and attempt == 0: time.sleep(wait + 1); continue
                    self.dead.add(m); note(f'  {m}: HTTP {e.code} {err_body(e)}'); break
                except Exception as e:
                    note(f'  {m}: {e}'); time.sleep(5)
        raise Exhausted('GitHub Models limit reached for today')

def load(code):
    p = os.path.join(ROOT, 'lang', code + '.json')
    try: d = json.load(open(p, encoding='utf-8'))
    except Exception: d = {}
    t, h = d.get('t', {}), d.get('h', {})
    return {k: v for k, v in t.items() if k in STR and h.get(k) == HASH[k] and isinstance(v, str) and v and ph_ok(STR[k], v)}

def save(code, tx):
    keys = sorted(k for k in tx if k in STR)
    d = {'lang': code, 'n': len(STR), 'done': len(keys), 'h': {k: HASH[k] for k in keys}, 't': {k: tx[k] for k in keys}}
    os.makedirs(os.path.join(ROOT, 'lang'), exist_ok=True)
    json.dump(d, open(os.path.join(ROOT, 'lang', code + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)

def publish(code):
    """Commit and publish one finished language right away (only inside GitHub Actions)."""
    if os.environ.get('PUBLISH') != '1': return
    sh = lambda *a: subprocess.run(list(a), cwd=ROOT, capture_output=True, text=True)
    sh('git', 'config', 'user.name', 'translate-bot'); sh('git', 'config', 'user.email', 'translate-bot@users.noreply.github.com')
    sh('git', 'add', 'lang')
    if sh('git', 'diff', '--cached', '--quiet').returncode == 0: return
    sh('git', 'commit', '-m', f'Translate interface: {code}')
    sh('git', 'pull', '--rebase', 'origin', 'main')
    r = sh('git', 'push', 'origin', 'HEAD:main')
    if r.returncode == 0: sh('git', 'push', '--force', 'origin', 'HEAD:gh-pages'); note(f'published {code}')
    else: note(f'publish {code} failed: {r.stderr[-200:]}')

def chunks(keys, size):
    out, cur, n = [], {}, 0
    for k in keys:
        ln = len(STR[k]) + len(k) + 8
        if n and n + ln > size: out.append(cur); cur, n = {}, 0
        cur[k] = STR[k]; n += ln
    if cur: out.append(cur)
    return out

def main():
    providers = [Gemini()] if GKEY else []
    if not providers:
        LOG['needs'] = 'GEMINI_API_KEY'; note('No Gemini key: add the repository secret GEMINI_API_KEY to translate automatically.'); return 0
    order = sorted(LANGS, key=lambda l: (PRIORITY.index(l['code']) if l['code'] in PRIORITY else 99))
    total_new = 0
    for lang in order:
        code = lang['code']; tx = load(code)
        missing = [k for k in STR if k not in tx]
        if not missing: continue
        print(f'{code}: {len(tx)}/{len(STR)} done, {len(missing)} to go')
        for prov in list(providers):
            size = prov.size // 2 if (code in HEAVY and prov.name == 'github-models') else prov.size
            for ch in chunks(missing, size):
                if time.time() > DEADLINE: save(code, tx); print('time limit reached'); return total_new
                try: res = parse(prov.ask(prompt(lang, ch)))
                except Exhausted as e:
                    note(f'  {prov.name}: {e}'); providers.remove(prov); break
                if not isinstance(res, dict): continue
                for k, en in ch.items():
                    tr = res.get(k)
                    if isinstance(tr, str) and tr.strip() and ph_ok(en, tr): tx[k] = tr.strip(); total_new += 1
                save(code, tx)
            missing = [k for k in STR if k not in tx]
            if not missing: break
        save(code, tx); print(f'{code}: {len(tx)}/{len(STR)}'); LOG['langs'][code] = len(tx)
        publish(code)
        if not providers: print('All translation services are at their limit; the next run continues.'); break
    return total_new

if __name__ == '__main__':
    try: n = main()
    finally:
        LOG['finished'] = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
        done = {}
        for l in LANGS:
            try: done[l['code']] = json.load(open(os.path.join(ROOT, 'lang', l['code'] + '.json'), encoding='utf-8')).get('done', 0)
            except Exception: done[l['code']] = 0
        LOG['coverage'] = done; LOG['total'] = len(STR)
        json.dump(LOG, open(os.path.join(ROOT, 'i18n', 'status.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('new translations:', n)
