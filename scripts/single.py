"""Writes the whole app as one self-contained HTML file (index.html with app.js inside) – for places that take a single file."""
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
h = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
app = open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()
m = re.search(r'<script src="app\.js\?v=[^"]*"></script>', h)
assert m, 'index.html does not load app.js'
out = h[:m.start()] + '<script>\n' + app.replace('</script', '<\\/script') + '\n</script>' + h[m.end():]
dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'single.html')
open(dst, 'w', encoding='utf-8').write(out)
print(dst, len(out))
