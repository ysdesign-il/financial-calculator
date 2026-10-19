/* ---------- 13.19: scenarios side by side – the current values next to the saved ones, with the difference ---------- */
const scnNum = s => { const m = String(s == null ? '' : s).replace(/[,‎‏\s]/g, '').match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
{
  const rs2 = renderScn;
  renderScn = function(id){
    const r0 = rs2.apply(this, arguments);
    try {
      const box = $('#sc-' + id), list = SCN[id] || [], cur = LAST[id]; if (!box || !list.length || !cur || !cur.hero) return r0;
      const cmp = $('.scn-cmp', box), nowRows = (cur.rows || []).map(x => [strip(x[0]), strip(x[1])]), base = list[0];
      const labels = []; [base].concat(list).forEach(s => s.rows.forEach(r => { if (!labels.includes(r[0])) labels.push(r[0]); })); nowRows.forEach(r => { if (!labels.includes(r[0])) labels.push(r[0]); });
      const cell = (a, b) => { const x = scnNum(a), y = scnNum(b); if (!isFinite(x) || !isFinite(y) || x === y) return '<td class="scn-d">—</td>'; const d = y - x; return `<td class="scn-d ${d > 0 ? 'up' : 'dn'}" dir="ltr">${d > 0 ? '+' : '−'}${N(Math.abs(d), Math.abs(d) < 10 && d % 1 ? 2 : 0)}</td>`; };
      const nowHero = strip(cur.hero.value);
      cmp.innerHTML = `<p class="fine">${esc(t('sc2_hint', {n: base.n}))}</p><table class="tbl scn2"><thead><tr><th scope="col"></th>${list.map(s => `<th scope="col">${esc(s.n)}</th>`).join('')}<th scope="col" class="scn-now">${esc(t('sc2_now'))}</th><th scope="col">${esc(t('sc2_diff'))}</th></tr></thead><tbody>
        <tr class="key"><th scope="row">${t('sc_main')}</th>${list.map(s => `<td>${esc(s.hero.value)}</td>`).join('')}<td class="scn-now">${esc(nowHero)}</td>${cell(base.hero.value, nowHero)}</tr>
        ${labels.map(l => { const nr = nowRows.find(x => x[0] === l), br = base.rows.find(x => x[0] === l); return `<tr><th scope="row">${esc(l)}</th>${list.map(s => { const r = s.rows.find(x => x[0] === l); return `<td>${r ? esc(r[1]) : '—'}</td>`; }).join('')}<td class="scn-now">${nr ? esc(nr[1]) : '—'}</td>${cell(br && br[1], nr && nr[1])}</tr>`; }).join('')}</tbody></table>`;
    } catch (e) {}
    return r0;
  };
  const calcSc2 = calc;
  calc = function(id){ const r = calcSc2.apply(this, arguments); try { const box = $('#sc-' + id); if (box && box.open && (SCN[id] || []).length) renderScn(id); } catch (e) {} return r; };
}
document.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('scn') && d.open && d.dataset.tab) try { renderScn(d.dataset.tab); } catch (er) {} }, true);
