"""Checks run by GitHub on every change: the page builds, its scripts parse, every text has 3 languages, and nothing private is inside."""
import json, re, subprocess, sys, os
ok = True
def fail(m):
    global ok; ok = False; print("FAIL:", m)
h = open("index.html", encoding="utf-8").read()
app = open("app.js", encoding="utf-8").read() if os.path.exists("app.js") else ""
js = "\n;\n".join(s for a, s in re.findall(r"<script([^>]*)>(.*?)</script>", h, re.S) if "src=" not in a and "json" not in a) + ("\n;\n" + app if app else "")
open("/tmp/chk.js", "w", encoding="utf-8").write(js)
r = subprocess.run(["node", "--check", "/tmp/chk.js"], capture_output=True, text=True)
if r.returncode: fail("script syntax: " + r.stderr[:500])
for bad in [r"sk-ant-[A-Za-z0-9]", r"ghp_[A-Za-z0-9]{20}", r"github_pat_[A-Za-z0-9_]{20}", r"AIza[0-9A-Za-z_\-]{30}"]:
    if re.search(bad, h + app): fail("looks like a secret key inside the page: " + bad)
for f in ["version.json", "rates.json", "manifest.webmanifest"]:
    if os.path.exists(f):
        try: json.load(open(f, encoding="utf-8"))
        except Exception as e: fail(f + " is not valid JSON: %s" % e)
if "app.js?v=" in h and not app: fail("index.html loads app.js but app.js is missing")
n = 0
for m in re.finditer(r"\b([a-zA-Z_][\w]*):\s*\[('(?:[^'\\]|\\.)*'),\s*('(?:[^'\\]|\\.)*'),\s*('(?:[^'\\]|\\.)*')\]", h + app):
    n += 1
# 13.53: keys kept in app.js are written as "key":["he","ar","en"], the rest are in the language packs (tp/*.js)
for m in re.finditer(r'"[A-Za-z_][\w$]*":\["(?:[^"\\]|\\.)*", ?"(?:[^"\\]|\\.)*", ?"(?:[^"\\]|\\.)*"\]', app):
    n += 1
packs = {}
for l in ("he", "ar", "en"):
    f = os.path.join("tp", l + ".js")
    if os.path.exists(f):
        mm = re.search(r"=(\{.*\});\s*$", open(f, encoding="utf-8").read(), re.S)
        packs[l] = json.loads(mm.group(1)) if mm else {}
if packs:
    if set(packs.get("he", {})) != set(packs.get("ar", {})) or set(packs.get("he", {})) != set(packs.get("en", {})): fail("the language packs do not have the same texts")
    n += len(packs.get("en", {}))
print("texts with 3 languages:", n)
if n < 1000: fail("too few translated texts (%d)" % n)
print("OK" if ok else "FAILED")
sys.exit(0 if ok else 1)
