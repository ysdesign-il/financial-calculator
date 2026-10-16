"""Security watch: turns unusual GitHub activity into alerts for the developer.

Runs in GitHub Actions on pushes, branch/tag changes, forks, visibility and rule changes, releases, and once a day.
Alerts go to security.json (shown in the app's developer mode) and, when serious, to a GitHub issue,
which GitHub sends to the owner by email and to the GitHub mobile app. Standard library only."""
import json, os, subprocess, time, urllib.request

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
    if any(f in files for f in ('devcode.json', 'scripts/security_watch.py')) and actor != OWNER:
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

if not alerts:
    print('Nothing unusual.'); raise SystemExit(0)

path = os.path.join(ROOT, 'security.json')
for a in alerts: print('ALERT', a)
serious = [a for a in alerts if a['level'] == 'high']
if serious and TOKEN:
    try:
        api('/issues', 'POST', {'title': '🛡️ Security alert: ' + serious[0]['msg'][:80],
                                'body': '\n'.join(f"- **{a['level']}** {a['msg']} (account: {a['actor'] or '?'})" for a in alerts) +
                                        '\n\nIf this was not you: change your GitHub password, review Settings → Collaborators and deploy keys, and revoke unknown tokens.'})
    except Exception as e:
        print('issue not created:', e)
run = lambda *a: subprocess.run(list(a), cwd=ROOT, capture_output=True, text=True)
run('git', 'config', 'user.name', 'security-bot'); run('git', 'config', 'user.email', 'security-bot@users.noreply.github.com')
for attempt in range(5):                       # always start from the newest main, so no alert is ever lost or overwritten
    run('git', 'fetch', '--depth=1', 'origin', 'main'); run('git', 'checkout', '-B', 'main', 'origin/main')
    try:
        data = json.load(open(path, encoding='utf-8'))
    except Exception:
        data = {'alerts': []}
    old = data.get('alerts', [])
    sig = {(a.get('at'), a.get('kind'), a.get('msg')) for a in old}
    data['alerts'] = ([a for a in alerts if (a['at'], a['kind'], a['msg']) not in sig] + old)[:100]
    data['updated'] = int(time.time())
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    run('git', 'add', 'security.json'); run('git', 'commit', '-m', 'Security alert')
    r = run('git', 'push', 'origin', 'HEAD:main')
    if r.returncode == 0:
        run('git', 'push', '--force', 'origin', 'HEAD:gh-pages'); print('saved'); break
    print('push retry', attempt + 1, r.stderr[-200:]); time.sleep(5 + attempt * 5)
else:
    raise SystemExit('could not save the alert')
