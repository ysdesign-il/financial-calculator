/* ================= fuel calculator: the panel shell (the module is fu.js) ================= */
function fuPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-fuelcalc" role="tabpanel" aria-labelledby="tab-fuelcalc" hidden><div id="fu_root"></div></section>`;
}
Object.assign(ICON, {fuelcalc: ic('<path d="M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15"/><path d="M3 20h12"/><path d="M6.5 8h5"/><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>')});
