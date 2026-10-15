/* ================= saved items: one folder for everything you saved, by category, with a 30-day recycle bin ================= */
function savedPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-saved" role="tabpanel" aria-labelledby="tab-saved" hidden><div id="svd_root"></div></section>`;
}
Object.assign(ICON, {saved: ic('<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9 8h6"/>')});
