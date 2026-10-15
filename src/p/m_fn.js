function M(x, d=0, c=cur){
  if (!isFinite(x)) return '—';
  const s = x < 0 ? '-' : '', ax = Math.abs(x);
  const a = SET.compact === '1' && ax >= 1e6 ? N(ax / 1e6, 2) + 'M' : N(ax, SET.dec === 'auto' ? d : +SET.dec);
  const sy = c === 'ILS' ? '₪' : symOf(c);
  const pos = SET.cpos === 'auto' ? (c === 'ILS' ? 'after' : 'before') : SET.cpos;
  const gap = (sy.length > 1 || c === 'ILS' || pos === 'after') ? ' ' : '';
  return pos === 'after' ? `${s}${a}${gap}${sy}` : `${s}${sy}${gap}${a}`;
}
