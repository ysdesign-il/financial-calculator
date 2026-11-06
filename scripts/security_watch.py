"""Security watch: turns unusual GitHub activity into alerts for the developer.

Runs in GitHub Actions on pushes, branch/tag changes, forks, visibility and rule changes, releases, and once a day.
Alerts are kept on the site's server only (shown in developer mode of the locked admin version), never as a public file.
The script proves it is this repository's security workflow with GitHub's signed token for the run (OIDC, audience "fin-sec").
A serious alert also goes to the owner's phone (from the server) and opens a GitHub issue with no details – the details stay
on the server. Standard library only."""
import json, os, re, subprocess, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OWNER = 'ysdesign-il'
TRUSTED = {OWNER, 'github-actions[bot]', 'dependabot[bot]'}
EV = os.environ.get('GITHUB_EVENT_NAME', '')
REPO = os.environ.get('GITHUB_REPOSITORY', '')
TOKEN = os.environ.get('GITHUB_TOKEN', '')
try:
    E = json.load(open(os.environ.get('GITHUB_EVENT_PATH', ''), encoding='utf-8'))
except Exception:
    E = {}
actor = os.environ.get('GITHUB_ACTOR', '') or (E.get('sender') or {}).get('login', '')
alerts = []

def add(level, kind, msg, **p):
    alerts.append({'at': int(time.time()), 'level': level, 'kind': kind, 'actor': actor, 'msg': msg[:300], 'p': {k: str(v)[:200] for k, v in p.items()}})

def api(path, method='GET', body=None):
    req = urllib.request.Request('https://api.github.com/repos/' + REPO + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'security-watch', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read() or b'null')

SITE = 'https://financial-calculator.design-il.workers.dev/'
NB = r'(?<![A-Za-z0-9_-])'
SECRET_PATTERNS = [(label, re.compile(NB + rx)) for label, rx in [
    ('Google API key', r'AIza[0-9A-Za-z_-]{35}'),
    ('OpenAI / Anthropic key', r'sk-(?:ant-|proj-)?[A-Za-z0-9_-]{30,}'),
    ('GitHub token', r'(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{30,}'),
    ('Stripe secret key', r'sk_(?:live|test)_[A-Za-z0-9]{16,}'),
    ('Supabase secret key', r'sb_secret_[A-Za-z0-9_-]{20,}'),
    ('Slack token', r'xox[abprs]-[A-Za-z0-9-]{20,}'),
    ('ntfy access token', r'tk_[a-z0-9]{29}'),
    ('Private key', r'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
]]

def secrets_in(text):
    return sorted({label for label, rx in SECRET_PATTERNS if rx.search(text)})

def oidc():
    """GitHub's signed token for this run, made for the site's server (needs `id-token: write`)."""
    u, t = os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL', ''), os.environ.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN', '')
    if not u or not t: return ''
    req = urllib.request.Request(u + ('&' if '?' in u else '?') + 'audience=fin-sec', headers={'Authorization': 'Bearer ' + t, 'User-Agent': 'security-watch'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read()).get('value', '')

def server(method='GET', body=None):
    req = urllib.request.Request(SITE + 'api/sec', method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + oidc(), 'Content-Type': 'application/json', 'User-Agent': 'security-watch'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read() or b'null')

OLD = None
def old_alerts():
    global OLD
    if OLD is None:
        try: OLD = (server() or {}).get('alerts', [])
        except Exception as e: print('could not read the saved alerts:', e); OLD = []
    return OLD

def raised_recently(kind, days=30):
    """True if an alert of this kind was already saved in the last `days` days (so daily checks don't repeat it)."""
    return any(a.get('kind') == kind and a.get('at', 0) > time.time() - days * 86400 for a in old_alerts())

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': 'security-watch'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.geturl(), r.read().decode('utf-8', 'replace')

def live_check():
    """Daily: no secrets in the repository or on the live site, the security policy (CSP) is in place, HTTPS is enforced."""
    # 1. secrets anywhere in the repository (everything here is public)
    found = {}
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__')]
        for n in names:
            p = os.path.join(base, n)
            if os.path.getsize(p) > 5_000_000 or n.endswith(('.png', '.jpg', '.ico', '.webp', '.woff2')):
                continue
            try:
                hits = secrets_in(open(p, encoding='utf-8', errors='ignore').read())
            except Exception:
                continue
            if hits:
                found[os.path.relpath(p, ROOT)] = hits
    for f, hits in sorted(found.items()):
        add('high', 'secret', f'Possible secret in the public repository: {", ".join(hits)} in {f}. Revoke it now, then remove it.', f=f)
    # 2. the live site
    status, final, html = fetch(SITE)
    if status != 200:
        add('medium', 'site', f'The live site did not answer normally (HTTP {status})')
        return
    for name, text in [('index.html', html)] + [(u, fetch(SITE + u)[2]) for u in ('sw.js', 'app.js')]:
        hits = secrets_in(text)
        if hits:
            add('high', 'secret', f'Possible secret on the live site: {", ".join(hits)} in {name}. Revoke it now.', f=name)
    m = re.search(r'<meta[^>]+http-equiv=["\']Content-Security-Policy["\'][^>]*?content=(["\'])(.*?)\1', html, re.I | re.S)
    if not m:
        if not raised_recently('csp'):
            add('low', 'csp', 'The live site has no security policy (CSP) — scripts from other sites are not restricted')
    else:
        csp = m.group(2).lower()
        missing = [d for d in ('default-src', "object-src 'none'", "base-uri 'self'") if d not in csp]
        if missing and not raised_recently('csp'):
            add('medium', 'csp', 'The security policy (CSP) lost: ' + ', '.join(missing))
        if "'unsafe-eval'" in csp and not raised_recently('csp-eval'):
            add('medium', 'csp-eval', "The security policy (CSP) allows 'unsafe-eval'")
    # 3. HTTPS is enforced (http:// must redirect to https://)
    try:
        _, final_http, _ = fetch(SITE.replace('https://', 'http://', 1))
        if not final_http.startswith('https://') and not raised_recently('https'):
            add('medium', 'https', 'The site opens without HTTPS — turn on "Enforce HTTPS" in Settings → Pages')
    except Exception as e:
        print('https check skipped:', e)

if EV == 'push':
    ref = E.get('ref', '')
    files = set()
    for c in E.get('commits') or []:
        files.update(c.get('added', []) + c.get('modified', []) + c.get('removed', []))
    before, after = E.get('before', ''), E.get('after', '')
    if before and after and not before.startswith('0000000'):            # the exact change of this push, whatever the payload lists
        try: files.update(f.get('filename', '') for f in (api(f'/compare/{before}...{after}') or {}).get('files', []))
        except Exception as e: print('compare skipped:', e)
    print('push', ref, 'by', actor, 'files:', sorted(files)[:30])
    if actor not in TRUSTED:
        add('high', 'push', f'Push to {ref} by an unknown account', r=ref)
    if E.get('forced') and (ref == 'refs/heads/main' or actor not in TRUSTED):      # bots rebasing their own pull-request branches is normal
        add('high', 'force', f'Force push to {ref} — history was rewritten', r=ref)
    wf = sorted(f for f in files if f.startswith('.github/'))
    if wf and actor != 'dependabot[bot]' and ref == 'refs/heads/main':
        add('medium', 'workflow', 'Automation files changed: ' + ', '.join(wf)[:200], f=', '.join(wf))
    if 'family.json' in files and ref == 'refs/heads/main':
        add('medium', 'family', 'The family-mode member list changed')
    if any(f in files for f in ('devcode.json', 'scripts/security_watch.py')) and actor != OWNER and ref == 'refs/heads/main':
        add('high', 'code', 'Developer code or the security watch was changed')
elif EV == 'create' and actor not in TRUSTED:
    add('medium', 'create', f'New {E.get("ref_type", "ref")} "{E.get("ref", "")}" created', r=E.get('ref', ''))
elif EV == 'delete':
    if actor not in TRUSTED or E.get('ref_type') == 'tag':
        add('medium', 'delete', f'{E.get("ref_type", "ref").capitalize()} "{E.get("ref", "")}" deleted', r=E.get('ref', ''))
elif EV == 'fork':
    add('low', 'fork', 'Someone copied (forked) the repository: ' + ((E.get('forkee') or {}).get('full_name') or ''), r=(E.get('forkee') or {}).get('full_name') or '')
elif EV == 'public':
    add('high', 'public', 'The repository visibility was changed to public')
elif EV == 'branch_protection_rule':
    add('high', 'rules', f'Branch protection rule {E.get("action", "changed")}', r=E.get('action', ''))
elif EV == 'release':
    add('medium', 'release', f'Release {E.get("action", "")}: {(E.get("release") or {}).get("tag_name", "")}', r=(E.get('release') or {}).get('tag_name', ''))
elif EV in ('schedule', 'workflow_dispatch'):
    try:
        people = [c.get('login') for c in api('/collaborators?per_page=100') or []]
        extra = [p for p in people if p and p != OWNER]
        if extra:
            add('high', 'collab', 'Accounts with access besides the owner: ' + ', '.join(extra), r=', '.join(extra))
    except Exception as e:
        print('collaborators check skipped:', e)
    try:
        live_check()
    except Exception as e:
        print('live site check skipped:', e)

seed = []
try:                                   # once: the alerts from the old public file move to the server (the file is removed in the same change)
    seed = json.load(open(os.path.join(ROOT, 'security.json'), encoding='utf-8')).get('alerts', [])
except Exception:
    try:
        import base64
        prev = E.get('before') or ''
        if prev and TOKEN and not old_alerts():
            f = api('/contents/security.json?ref=' + prev) or {}
            seed = json.loads(base64.b64decode(f.get('content', '')).decode('utf-8')).get('alerts', [])
    except Exception:
        pass
if not alerts and not seed:
    print('Nothing unusual.'); raise SystemExit(0)

for a in alerts: print('ALERT', a['level'], a['kind'])
serious = [a for a in alerts if a['level'] == 'high']
if serious and TOKEN:
    try:
        api('/issues', 'POST', {'title': '🛡️ Security alert – details in developer mode of the admin version',
                                'body': f"{len(serious)} serious alert(s). The details are kept on the site's server only – open developer mode in the admin version (/admin/).\n\nIf you did not expect this: change your GitHub password, review Settings → Collaborators and deploy keys, and revoke unknown tokens."})
    except Exception as e:
        print('issue not created:', e)
for attempt in range(4):
    try:
        r = server('POST', {'alerts': alerts, 'seed': seed}); print('saved on the server', r); break
    except Exception as e:
        print('save retry', attempt + 1, e); time.sleep(5 + attempt * 5)
else:
    raise SystemExit('could not save the alert')
