{ const C = 2 * Math.PI * 54; let off = 0;
      $('.donut', sp).innerHTML = '<svg viewBox="0 0 140 140" aria-hidden="true">' + items.map(i => {
        const len = i.v / tot * C, c = `<circle class="${i.cls}" cx="70" cy="70" r="54" stroke-dasharray="${Math.max(0, len - 1.5).toFixed(2)} ${(C - len + 1.5).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${i.name}: ${i.fmt}</title></circle>`;
        off += len; return c; }).join('') + '</svg>'; }
