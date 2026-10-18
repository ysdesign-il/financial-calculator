/* ================= Tax Free: the panel shell (the module is tf.js) ================= */
function tfPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-taxfree" role="tabpanel" aria-labelledby="tab-taxfree" hidden><div id="tf_root"></div></section>`;
}
Object.assign(ICON, {taxfree: ic('<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9.5 13.5l5-5"/><circle cx="9.8" cy="8.8" r="1"/><circle cx="14.2" cy="13.2" r="1"/><path d="M9 17h6"/>')});
