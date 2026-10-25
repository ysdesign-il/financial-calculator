"""Writes the whole app as one self-contained HTML file (index.html with app.js inside) – for places that take a single file."""
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
h = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
app = open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()
m = re.search(r'<script src="app\.js\?v=[^"]*"></script>', h)
assert m, 'index.html does not load app.js'
h = h.replace('<script src="/__pub.js" defer></script>\n', '')
# 13.53: the three language packs go inside too (the page cannot load files of its own there)
tp = ''.join(open(os.path.join(ROOT, 'tp', l + '.js'), encoding='utf-8').read() for l in ('he', 'ar', 'en') if os.path.exists(os.path.join(ROOT, 'tp', l + '.js')))
if tp:
    i = h.index('<script>var HTML_BUILD')
    h = h[:i] + '<script>\n' + tp.replace('</script', '<\\/script') + '</script>\n' + h[i:]
m = re.search(r'<script src="app\.js\?v=[^"]*"></script>', h)
out = h[:m.start()] + '<script>\n' + app.replace('</script', '<\\/script') + '\n</script>' + h[m.end():]
dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'single.html')
open(dst, 'w', encoding='utf-8').write(out)
print(dst, len(out))
