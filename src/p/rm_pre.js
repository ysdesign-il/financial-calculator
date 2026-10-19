/* ================= reminders: the panel shell (the module is rm.js) ================= */
function rmPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-reminders" role="tabpanel" aria-labelledby="tab-reminders" hidden><div id="rm_root"></div></section>`;
}
Object.assign(ICON, {reminders: ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2.5 2 4.5M20 2.5l2 2"/>')});
