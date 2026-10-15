  const ui = UNIT_ICO[f.unit], R = RANGES[f.id];
  const nf = x => x.toLocaleString('en-US');
  const inner = `<label for="${f.id}" data-i="${f.label}"></label>
    <div class="control"><input id="${f.id}" type="number" inputmode="decimal" step="any" value="${f.val}">${unitHTML(f.unit)}</div>` +
    (R ? `<input type="range" class="rng" data-for="${f.id}" data-ia="${f.label}" min="${R[0]}" max="${R[1]}" step="${R[2]}" value="${f.val}"><div class="rl"><span>${nf(R[0])}</span><span>${nf(R[1])}</span></div>` : '') + hint;
  if (ui) return `<div class="field${wide} ic-field"${w}><div class="fi"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICO[ui]}</svg></div><div class="fb">${inner}</div></div>`;
  return `<div class="field${wide}"${w}>${inner}</div>`;
}
