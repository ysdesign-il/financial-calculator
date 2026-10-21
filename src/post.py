def rep(old, new):
    global s
    assert old in s, old[:60]
    s = s.replace(old, new, 1)
rep("let lang = 'he', cur = 'ILS', tab = 'convert';", "let lang = 'he', cur = 'ILS', tab = 'home';")
rep("if (!TABS.includes(tab)) tab = 'convert';", "if (!TABS.includes(tab)) tab = 'home';")
rep("  $('#page-title').textContent = t('tab_' + tab);", "  $('#phead').hidden = tab === 'home'; document.body.dataset.tab = tab;\n  $('#page-title').textContent = t('tab_' + tab);")
rep("TABS.map(id => id === 'percent' ? percentPanelHTML() : panelHTML(id))", "TABS.map(id => id === 'percent' ? percentPanelHTML() : id === 'home' ? homePanelHTML() : panelHTML(id))")
rep("  try { localStorage.setItem('fin-tab', id); } catch(e) {}", "  try { localStorage.setItem('fin-tab', id); } catch(e) {}\n  $$('.bt').forEach(x => x.classList.toggle('on', x.dataset.tab === id));\n  window.scrollTo(0, 0);")
old = "$('.bar', sp).innerHTML = items.map(i =>\n      `<span class=\"${i.cls}\" style=\"flex:${i.v} 1 0\" title=\"${i.name}: ${i.fmt}\"></span>`).join('');"
rep(old, open('p/donut.js', encoding='utf-8').read())
rep("  } else tb.hidden = true;\n}", "  } else tb.hidden = true;\n  const tb2 = $('#tb2-'+id);\n  if (tb2){\n    if (res.table2){\n      tb2.hidden = false;\n      if (res.table2.open && !tb2._init){ tb2.open = true; tb2._init = true; }\n      $('summary', tb2).textContent = res.table2.title;\n      $('.scroll', tb2).innerHTML = `<table class=\"tbl\"><thead><tr>${res.table2.head.map(h => `<th scope=\"col\">${h}</th>`).join('')}</tr></thead><tbody>${\n        res.table2.rows.map(r => `<tr${r.key ? ' class=\"tot\"' : ''}>${r.c.map((c,i) => i ? `<td>${c}</td>` : `<th scope=\"row\">${c}</th>`).join('')}</tr>`).join('')\n      }</tbody></table>${res.table2.foot ? `<p class=\"fine tb2-f\">${res.table2.foot}</p>` : ''}`;\n    } else tb2.hidden = true;\n  }\n}")
rep("/* ================= init ================= */", open('p/speed.js', encoding='utf-8').read() + '\n' + open('p/init_extra.js', encoding='utf-8').read() + '\n' + open('p/v75.js', encoding='utf-8').read() + '\n' + open('p/v76.js', encoding='utf-8').read() + '\n' + open('p/dz_img.js', encoding='utf-8').read() + '\n' + open('p/v78.js', encoding='utf-8').read() + '\n' + open('p/v81.js', encoding='utf-8').read() + '\n' + open('p/v79.js', encoding='utf-8').read() + '\n' + open('p/v80.js', encoding='utf-8').read() + '\n' + open('p/v82.js', encoding='utf-8').read() + '\n' + open('p/v83.js', encoding='utf-8').read() + '\n' + open('p/v84.js', encoding='utf-8').read() + '\n' + open('p/v86.js', encoding='utf-8').read() + '\n' + open('p/v87.js', encoding='utf-8').read() + '\n' + open('p/v88.js', encoding='utf-8').read() + '\n' + open('p/v89.js', encoding='utf-8').read() + '\n' + open('p/v90.js', encoding='utf-8').read() + '\n' + open('p/v91.js', encoding='utf-8').read() + '\n' + open('p/v92.js', encoding='utf-8').read() + '\n' + open('p/v93.js', encoding='utf-8').read() + '\n' + open('p/v94.js', encoding='utf-8').read() + '\n' + open('p/v95.js', encoding='utf-8').read() + '\n' + open('p/v96.js', encoding='utf-8').read() + '\n' + open('p/v97.js', encoding='utf-8').read() + '\n' + open('p/v98.js', encoding='utf-8').read() + '\n' + open('p/v99.js', encoding='utf-8').read() + '\n' + open('p/v100.js', encoding='utf-8').read() + '\n' + open('p/v101.js', encoding='utf-8').read() + '\n' + open('p/v108.js', encoding='utf-8').read() + '\n' + open('p/cv.js', encoding='utf-8').read() + '\n' + open('p/ph_me.js', encoding='utf-8').read() + '\n' + open('p/mx_engine.js', encoding='utf-8').read() + '\n' + open('p/mx_solve.js', encoding='utf-8').read() + '\n' + open('p/mx.js', encoding='utf-8').read() + '\n' + open('p/mx2.js', encoding='utf-8').read() + '\n' + open('p/gk.js', encoding='utf-8').read() + '\n' + open('p/mk3.js', encoding='utf-8').read() + '\n' + open('p/legal.js', encoding='utf-8').read() + '\n' + open('p/slip.js', encoding='utf-8').read() + '\n' + open('p/ds2.js', encoding='utf-8').read() + '\n' + open('p/dsig.js', encoding='utf-8').read() + '\n' + open('p/qr_core.js', encoding='utf-8').read() + '\n' + open('p/qr.js', encoding='utf-8').read() + '\n' + open('p/pdfx.js', encoding='utf-8').read() + '\n' + open('p/cvt.js', encoding='utf-8').read() + '\n' + open('p/ds3.js', encoding='utf-8').read() + '\n' + open('p/ds4.js', encoding='utf-8').read() + '\n' + open('p/ds5.js', encoding='utf-8').read() + '\n' + open('p/tf.js', encoding='utf-8').read() + '\n' + open('p/bk.js', encoding='utf-8').read() + '\n' + open('p/fu.js', encoding='utf-8').read() + '\n' + open('p/rm.js', encoding='utf-8').read() + '\n' + open('p/pic.js', encoding='utf-8').read() + '\n' + open('p/nt.js', encoding='utf-8').read() + '\n' + open('p/scn2.js', encoding='utf-8').read() + '\n' + open('p/ex2.js', encoding='utf-8').read() + '\n' + open('p/ins.js', encoding='utf-8').read() + '\n' + open('p/cmd.js', encoding='utf-8').read() + '\n' + open('p/rt.js', encoding='utf-8').read() + '\n' + open('p/lp.js', encoding='utf-8').read() + '\n' + open('p/vt.js', encoding='utf-8').read() + '\n' + open('p/hh.js', encoding='utf-8').read() + '\n' + open('p/tv.js', encoding='utf-8').read() + '\n' + open('p/pf.js', encoding='utf-8').read() + '\n' + open('p/calcx.js', encoding='utf-8').read() + '\n' + open('p/fam.js', encoding='utf-8').read() + '\n' + open('p/mini.js', encoding='utf-8').read() + '\n' + open('p/mini_a.js', encoding='utf-8').read() + '\n' + open('p/mini_b.js', encoding='utf-8').read() + '\n' + open('p/mini_c.js', encoding='utf-8').read() + '\n' + open('p/calcs.js', encoding='utf-8').read() + '\n' + open('p/calcs2.js', encoding='utf-8').read() + '\n' + open('p/dualinc.js', encoding='utf-8').read() + '\n' + open('p/tools3.js', encoding='utf-8').read() + '\n' + open('p/nfc.js', encoding='utf-8').read() + '\n' + open('p/sign.js', encoding='utf-8').read() + '\n' + open('p/ux2.js', encoding='utf-8').read() + '\n' + open('p/speed_end.js', encoding='utf-8').read() + '\n' + open('p/ax.js', encoding='utf-8').read() + '\n' + open('p/prn.js', encoding='utf-8').read() + '\n' + open('p/mig.js', encoding='utf-8').read())
rep("let lang = 'he', cur = 'ILS', tab = 'home';", open('p/settings_pre.js', encoding='utf-8').read() + "let lang = devLang(), cur = 'ILS', tab = 'home';")
rep("[LANGS.indexOf(lang)]", "[langIdx()]")
rep("const key = lang + '|' + d + '|' + max;", "const key = lang + SET.digits + '|' + d + '|' + max;")
rep("f = nfc[key] = new Intl.NumberFormat(LOC[lang], o);", "try { f = nfc[key] = new Intl.NumberFormat(locOf(), o); } catch(e) { f = nfc[key] = new Intl.NumberFormat('en-US', o); }")
rep("new Intl.DateTimeFormat(LOC[lang],", "new Intl.DateTimeFormat(locOf(),")
i0 = s.index('function M(x, d=0, c=cur){'); i1 = s.index('const MI = ')
s = s[:i0] + open('p/m_fn.js', encoding='utf-8').read() + s[i1:]
rep("root.dir = lang === 'en' ? 'ltr' : 'rtl';", "root.dir = isRtl() ? 'rtl' : 'ltr';")
rep("  fillCurSelects();\n  updateHead();\n  if (recalc)", "  fillCurSelects();\n  syncSettingsUI();\n  updateHead();\n  if (recalc)")
rep("if (!LANGS.includes(lang)) lang = 'he';", "if (!LANG_LIST.some(l => l[0] === lang)){ lang = devLang(); try { localStorage.removeItem('fin-lang'); } catch (e) {} }")
rep("if (!TABS.includes(tab)) tab = 'home';", "if (!TABS.includes(tab)) tab = 'home';\nif (SET.start !== 'last') tab = TABS.includes(SET.start) ? SET.start : 'home';")
rep("id === 'home' ? homePanelHTML() :", "id === 'home' ? homePanelHTML() : id === 'settings' ? settingsPanelHTML() :")
rep("[['cur', cur], ['x_from','ILS'], ['x_to','USD']]", "[['cur', cur], ['set_cur', cur], ['x_from','ILS'], ['x_to','USD']]")
rep("$('#back').addEventListener('click', () => activate('home'));", open('p/set_events.js', encoding='utf-8').read())

rep("if (!RATES[cur]) cur = 'ILS';", "if (!RATES[cur]) cur = 'ILS';\nbaseCur = cur;")
rep("return f.format(x);", "if (SET.sep !== 'auto'){ const gs = {comma:',', dot:'.', space:'\\u00a0', none:''}[SET.sep]; return f.formatToParts(x).map(p => p.type === 'group' ? gs : p.value).join(''); }\n  return f.format(x);")
rep("const pin = PIN.filter(c => RATES[c]);", "const pin = pinList().filter(c => RATES[c]);")
rep("navEl.innerHTML = GROUPS.map(([gk, ids]) =>", "function renderNav(){ navEl.innerHTML = viewGroups().map(([gk, ids]) =>")
rep(").join('');\npanelsEl.innerHTML =", ").join(''); }\nrenderNav();\npanelsEl.innerHTML =")
rep("    const b = $('#tab-'+x);\n    b.setAttribute('aria-selected', on ? 'true' : 'false');\n    b.tabIndex = on ? 0 : -1;\n    $('#panel-'+x).hidden = !on;\n    if (on && focus) b.focus();",
    "    const b = $('#tab-'+x);\n    if (b){ b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }\n    $('#panel-'+x).hidden = !on;\n    if (on && focus && b) b.focus();")
rep("function show(id, res){", "function show(id, res){\n  LAST[id] = res;")
rep("  $$('.bt').forEach(x => x.classList.toggle('on', x.dataset.tab === id));", "  applyEffCur(id);\n  $$('.bt').forEach(x => x.classList.toggle('on', x.dataset.tab === id));")
rep("fetch('https://open.er-api.com/v6/latest/USD'", "fetch(SET.rateSrc === 'ecb' ? 'https://api.frankfurter.app/latest?from=USD' : 'https://open.er-api.com/v6/latest/USD'")
rep("if (j && j.result === 'success' && j.rates && j.rates.ILS && j.rates.USD){\n        RATES = j.rates;", "if (j && (j.result === 'success' || j.date) && j.rates && j.rates.ILS){\n        RATES = Object.assign({}, RATES, j.rates, {USD: 1});")
rep("META.unix = j.time_last_update_unix || META.unix;", "META.unix = j.time_last_update_unix || (j.date ? Date.parse(j.date) / 1000 : META.unix);")

rep("  if (manual && st) st.textContent = ok ? t('st_ok', {d: dateStr()}) : t('st_fail', {d: dateStr()});\n}", "  if (manual && st) st.textContent = ok ? t('st_ok', {d: dateStr()}) : t('st_fail', {d: dateStr()});\n  if (typeof stampUpdate === 'function') stampUpdate(ok);\n}")

rep("function curOptions(selected){", "function curOptions(selected, withCrypto){")
rep("const pin = pinList().filter(c => RATES[c]);", "const pin = pinList().filter(c => RATES[c] && (withCrypto || !CRYPTO[c]));")
rep("const rest = Object.keys(RATES).filter(c => !pin.includes(c)).sort();", "const rest = Object.keys(RATES).filter(c => !pin.includes(c) && !CRYPTO[c]).sort();\n  const cry = withCrypto ? Object.keys(CRYPTO).filter(c => RATES[c] && !pin.includes(c)) : [];")
rep("<optgroup label=\"${t('allCur')}\">${rest.map(opt).join('')}</optgroup>`;", "<optgroup label=\"${t('allCur')}\">${rest.map(opt).join('')}</optgroup>${cry.length ? `<optgroup label=\"${t('cryptoCur')}\">${cry.map(opt).join('')}</optgroup>` : ''}`;")
rep("s.innerHTML = curOptions(sel);", "s.innerHTML = curOptions(sel, id === 'x_from' || id === 'x_to');")
rep("try { return DN ? (DN.of(c) || c) : c; }", "try { if (CRYPTO[c]) return CRYPTO[c][langIdx()]; return DN ? (DN.of(c) || c) : c; }")
rep("  if (manual && st) st.textContent = ok ?", "  await tryLiveCrypto();\n  if (manual && st) st.textContent = ok ?")

rep("  try {\n    const ctl = new AbortController();\n    const to = setTimeout(() => ctl.abort(), 6000);\n    const r = await fetch(SET.rateSrc === 'ecb'",
    "  let gmsg = '';\n  if (SET.rateSrc === 'gemini'){\n    if (!gemOn()) gmsg = t('st_gnokey');\n    else if (await tryLiveGemini(!!manual)){ ok = true; }\n    else gmsg = META.gerr === 'blocked' || META.gerr === 'timeout' ? t('st_gblocked', {d: dateStr()}) : t('st_gerr', {e: META.gerr || '?', d: dateStr()});\n  }\n  if (!ok) try {\n    const ctl = new AbortController();\n    const to = setTimeout(() => ctl.abort(), 6000);\n    const r = await fetch(SET.rateSrc === 'ecb'")
rep("  if (manual && st) st.textContent = ok ? t('st_ok', {d: dateStr()}) : t('st_fail', {d: dateStr()});",
    "  if (manual && st) st.textContent = ok ? t(META.gemini && SET.rateSrc === 'gemini' ? 'st_gok' : 'st_ok', {d: dateStr()}) : (gmsg || t('st_fail', {d: dateStr()}));")

rep("id === 'settings' ? settingsPanelHTML() :", "id === 'settings' ? settingsPanelHTML() : id === 'assist' ? assistPanelHTML() :")
rep("    const s = $('#'+id);\n    const sel = RATES[s.value]", "    const s = $('#'+id); if (!s) return;\n    const sel = RATES[s.value]")

rep("async function tryLive(manual){\n", "async function tryLive(manual){\n  if (typeof fxRecent === 'function' && fxRecent()){ stampUpdate(true); return; }\n")

rep("function activate(id, focus){\n  tab = id;\n", "function activate(id, focus){\n  tab = id;\n  if (typeof navAcc === 'function') navAcc();\n")

rep("let s = (T[k] || [k,k,k])[langIdx()];", "let s = (TX && TX[k] != null && langIdx() === 2 && lang !== 'en') ? TX[k] : (T[k] || [k,k,k])[langIdx()];")

rep("id === 'assist' ? assistPanelHTML() :", "id === 'assist' ? assistPanelHTML() : id === 'expenses' ? expensesPanelHTML() : id === 'saved' ? savedPanelHTML() : id === 'markets' ? marketsPanelHTML() : id === 'clients' ? clientsPanelHTML() : id === 'cv' ? cvPanelHTML() : id === 'mathx' ? mxPanelHTML() : id === 'docscan' ? dsPanelHTML() : id === 'taxfree' ? tfPanelHTML() : id === 'bankacc' ? bkPanelHTML() : id === 'fuelcalc' ? fuPanelHTML() : id === 'reminders' ? rmPanelHTML() : ['elecsup', 'eventgift', 'carcost', 'arnona'].includes(id) ? ntPanelHTML(id) : HUB_IDS.includes(id) ? hubPanelHTML(id) :")
rep(": panelHTML(id)).join('');", ": pzShell(id)).join('');")   # 13.32: generic calculator screens are built on first use
# 8.3: formatter cache first thing in the app script
rep("const $ = (s, r=document) => r.querySelector(s);", open('p/perf_head.js', encoding='utf-8').read() + "const $ = (s, r=document) => r.querySelector(s);")
# 8.3: a value read for a calculation respects the field's limit (years, months, counts), so a huge number cannot freeze the app
rep("const v = id => { const n = parseFloat($('#'+id).value); return isFinite(n) ? n : 0; };", "const v = id => { const e = $('#'+id); if (!e) return 0; const n = parseFloat(e.value); if (!isFinite(n)) return 0; const L = e.dataset.lim; return L && n > +L ? +L : n; };")
