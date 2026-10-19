/* ================= bank accounts adviser: the panel shell (the module is bk.js) ================= */
function bkPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-bankacc" role="tabpanel" aria-labelledby="tab-bankacc" hidden><div id="bk_root"></div></section>`;
}
Object.assign(ICON, {bankacc: ic('<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/><path d="M16 4.5l2.5 1.5"/>')});
