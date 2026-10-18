/* ================= advanced calculator: the panel shell (the module is mx_engine.js + mx.js) ================= */
function mxPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-mathx" role="tabpanel" aria-labelledby="tab-mathx" hidden><div id="mx_root"></div></section>`;
}
Object.assign(ICON, {mathx: ic('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 11.5h2M12 11.5h0M15.5 10v3M14 11.5h3M8 16l2 2M10 16l-2 2M14 17h3"/>')});
