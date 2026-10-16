/* ================= 9.1: install button under the title, language that follows your keyboard ================= */
const E93 = s => asEsc(String(s == null ? '' : s));
/* ---------- the install button: right under "Financial calculator", on Home only ---------- */
function instSync(){
  const brand = $('.rail .brand'); if (!brand) return;
  let b = $('#pwa_inst');
  const show = tab === 'home' && insCan();
  if (!show){ if (b) b.remove(); $$('.pwa-br').forEach(x => x.remove()); return; }
  if (!b){ brand.insertAdjacentHTML('afterend', `<span class="pwa-br" aria-hidden="true"></span><button type="button" class="pwa-inst" id="pwa_inst"><span aria-hidden="true">📲</span> ${E93(t('pwa_btn'))}</button><span class="pwa-br" aria-hidden="true"></span>`); }
  else { const txt = '📲 ' + t('pwa_btn'); if (b.textContent.trim() !== txt) b.innerHTML = `<span aria-hidden="true">📲</span> ${E93(t('pwa_btn'))}`; }
}
const _act93 = activate;
activate = function(){ const r = _act93.apply(this, arguments); try { instSync(); } catch (e) {} return r; };
const _al93 = applyLang;
applyLang = function(){ const r = _al93.apply(this, arguments); try { const b = $('#pwa_inst'); if (b) b.remove(); $$('.pwa-br').forEach(x => x.remove()); instSync(); } catch (e) {} return r; };

/* ---------- the language follows the keyboard (off until you turn it on) ----------
   A web page cannot ask the phone which keyboard is open, so we look at what you type: a few Hebrew letters switch to Hebrew,
   Arabic letters to Arabic, Latin letters to English. Numbers and symbols change nothing. It switches when you pause typing. */
const KB_RX = [['he', /[֐-׿]/], ['ar', /[؀-ۿݐ-ݿ]/], ['en', /[A-Za-z]/]];
var KB = {want: '', n: 0, t: null};
document.addEventListener('input', e => {
  if (SET.kbLang !== '1') return;
  const el = e.target; if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName) || el.type === 'number' || el.type === 'password' || el.dataset.num) return;
  const ch = (e.data || '').slice(-1); if (!ch) return;
  const hit = KB_RX.find(([, rx]) => rx.test(ch)); if (!hit) return;
  const L = hit[0];
  if (L === lang || !LANG_LIST.some(x => x[0] === L)){ KB.want = ''; KB.n = 0; return; }
  if (KB.want === L) KB.n++; else { KB.want = L; KB.n = 1; }
  clearTimeout(KB.t);
  if (KB.n >= 2) KB.t = setTimeout(() => {
    if (KB.want !== L || lang === L) return;
    const id = el.id, pos = el.selectionStart;
    lang = L; try { LS.setItem('fin-lang', L); } catch (er) {} try { applyLang(true); } catch (er) {}
    KB.want = ''; KB.n = 0;
    try { toast(t('kb_switched')); } catch (er) {}
    if (id){ const n = document.getElementById(id); if (n){ n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) {} } }
  }, 900);
}, true);
try { instSync(); } catch (e) {}
