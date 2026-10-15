function unitHTML(u){
  if (!u) return '';
  if (u === 'cur') return `<span class="u cur">${symOf(cur)}</span>`;
  if (u === 'ils') return `<span class="u">₪</span>`;
  if (u === 'yrs') return `<span class="u" data-i="u_yrs"></span>`;
  if (u === 'mo') return `<span class="u" data-i="u_months"></span>`;
  return `<span class="u">${u}</span>`;
}
function fieldHTML0(f){
  const hint = f.hint ? `<small class="hint" data-i="${f.hint}"></small>` : '';
  const w = f.when ? ` data-when="${f.when[0]}=${f.when[1]}"` : '';
  const wide = f.wide ? ' wide' : '';
  if (f.type === 'sub') return `<div class="sub-h" data-i="${f.label}"${w}></div>`;
  if (f.type === 'swap')
    return `<div class="field wide"${w}><button type="button" class="btn" id="${f.id}" data-i="${f.label}"></button></div>`;
  if (f.type === 'refresh')
    return `<div class="field wide"><button type="button" class="btn" id="${f.id}" data-i="${f.label}"></button><small class="hint" id="x_status" aria-live="polite"></small></div>`;
  if (f.type === 'cursel')
    return `<div class="field"><label for="${f.id}" data-i="${f.label}"></label><select id="${f.id}"></select></div>`;
  if (f.type === 'select')
    return `<div class="field${wide}"${w}><label for="${f.id}" data-i="${f.label}"></label>
      <select id="${f.id}">${f.opts.map(([val,k]) => `<option value="${val}"${String(val)===String(f.val)?' selected':''}${k[0]==='=' ? '>' + k.slice(1) : ' data-i="' + k + '">'}</option>`).join('')}</select>${hint}</div>`;
  const ui = UNIT_ICO[f.unit], R = RANGES[f.id];
  const nf = x => x.toLocaleString('en-US');
  const inner = `<label for="${f.id}" data-i="${f.label}"></label>
    <div class="control"><input id="${f.id}" type="number" inputmode="decimal" step="any" value="${f.val}">${unitHTML(f.unit)}</div>` +
    (R ? `<input type="range" class="rng" data-for="${f.id}" data-ia="${f.label}" min="${R[0]}" max="${R[1]}" step="${R[2]}" value="${f.val}"><div class="rl"><span>${nf(R[0])}</span><span>${nf(R[1])}</span></div>` : '') + hint;
  if (ui) return `<div class="field${wide} ic-field"${w}><div class="fi"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICO[ui]}</svg></div><div class="fb">${inner}</div></div>`;
  return `<div class="field${wide}"${w}>${inner}</div>`;
}
function inl(id, val, unit, ariaKey){
  return `<span class="control sm"><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" data-ia="${ariaKey}">${unitHTML(unit)}</span>`;
}
const yn = [[0,'o_no'],[1,'o_yes']];
const creditDefs = p => {
  const A = 'g_credits';
  const kid = (s, k) => ({id:`${p}_${s}`, label:k, val:0, adv:A});
  return [
    {id:p+'_sex', label:'f_sex', type:'select', val:'m', adv:A, opts:[['m','o_man'],['f','o_woman']]},
    {id:p+'_single', label:'f_single', type:'select', val:0, adv:A, opts:yn},
    kid('k0','f_k0'), kid('k12','f_k12'), kid('k3','f_k3'), kid('k45','f_k45'), kid('k617','f_k617'), kid('k18','f_k18'),
    {id:p+'_sold', label:'f_sold', type:'select', val:0, adv:A, opts:yn},
    {id:p+'_res', label:'f_res', val:0, adv:A, hint:'h_res'},
    {id:p+'_deg', label:'f_deg', type:'select', val:0, adv:A, opts:[[0,'o_degNone'],[1,'o_degBA'],[0.5,'o_degMA']]},
    {id:p+'_xp', label:'f_xp', val:0, adv:A, hint:'h_xp'}
  ];
};
/* the tax figures a calculator uses: automatic (the official 2026 values) or typed in by hand */
const figDefs = p => {
  const A = 'g_taxFig', r4 = x => Math.round(x * 10000) / 10000;
  const F = (k, lab, unit, val, hint) => ({id: p + '_' + k, label: lab, unit, val: r4(val), adv: A, hint});
  return [SEL(p + '_fig', 'f_figMode', 'auto', [['auto', 'o_figAuto'], ['manual', 'o_figManual']], {wide: true, adv: A, hint: 'h_figMode'}),
    F('fPt', 'f_fPt', 'ils', TAX.point / 12, 'h_fPt')]
    .concat(TAX.brackets.slice(0, 5).map((b, i) => F('fB' + (i + 1), 'f_fB' + (i + 1), 'ils', b[0] / 12)))
    .concat(TAX.brackets.map((b, i) => F('fR' + (i + 1), 'f_fR' + (i + 1), '%', b[1] * 100)))
    .concat([F('fSur', 'f_fSur', 'ils', TAX.surtaxFrom / 12), F('fSurR', 'f_fSurR', '%', TAX.surtaxRate * 100),
      F('fNiCut', 'f_fNiCut', 'ils', TAX.niCut), F('fNiMax', 'f_fNiMax', 'ils', TAX.niMax),
      F('fNiL', 'f_fNiL', '%', TAX.niLow * 100), F('fNiH', 'f_fNiH', '%', TAX.niHigh * 100),
      F('fHL', 'f_fHL', '%', TAX.hLow * 100), F('fHH', 'f_fHH', '%', TAX.hHigh * 100),
      F('fPensCap', 'f_fPensCap', 'ils', TAX.pensSalaryCap), F('fPensCr', 'f_fPensCr', '%', TAX.pensCreditRate * 100)]);
};
/* Reserve duty (combat): days served in the previous year → credit points (tax years 2026–2027; source: Kol Zchut) */
const resPts = d => { d = Math.floor(Math.max(0, d || 0)); if (d < 30) return 0; if (d < 40) return 0.5; if (d < 50) return 0.75; return Math.min(4, 1 + 0.25 * Math.floor((d - 50) / 5)); };
const ptsTxt = (p, pts) => { const r = resPts(v(p + '_res')); return N(pts, 2) + (r ? ' ' + t('r_ptsRes', {n: N(r, 2)}) : ''); };
function pointsOf(p){
  const n = s => Math.max(0, Math.floor(v(`${p}_${s}`)));
  const f = $(`#${p}_sex`).value === 'f';
  let pts = 2.25 + (f ? 0.5 : 0);
  pts += n('k0') * 2.5 + n('k12') * 4.5 + n('k3') * 3.5 + n('k45') * 2.5 + n('k617') * (f ? 2 : 1) + n('k18') * (f ? 0.5 : 0);
  if ($(`#${p}_single`).value === '1') pts += 1;
  if ($(`#${p}_sold`).value === '1') pts += 2;
  pts += parseFloat($(`#${p}_deg`).value) || 0;
  pts += resPts(v(`${p}_res`));
  return pts + Math.max(0, v(`${p}_xp`));
}

function fieldHTML(f){
  if (f.type === 'date') return `<div class="field"${f.when ? ` data-when="${f.when[0]}=${f.when[1]}"` : ''}><label for="${f.id}" data-i="${f.label}"></label><div class="control"><input id="${f.id}" type="date" value="${f.val || ''}"></div></div>`;
  if (f.type === 'html') return `<div class="field wide ${f.cls || ''}" id="${f.id}"${f.when ? ` data-when="${f.when[0]}=${f.when[1]}"` : ''}></div>`;
  const r = fieldHTML0(f);
  if (!(f.type === 'select' || f.type === 'cursel') || !f.id || f.id.indexOf('set_') !== 0) return r;
  const ic = sIcon(f.id) || sIcon(f.id.indexOf('set_p_') === 0 ? 'set_p_single' : 'set_tune');
  const i = r.indexOf('>'), j = r.lastIndexOf('</div>');
  if (i < 0 || j < 0) return r;
  const head = r.slice(0, i + 1).replace('class="field', 'class="ic-field field');
  return head + `<div class="fi">${ic}</div><div class="fb">` + r.slice(i + 1, j) + '</div></div>';
}
