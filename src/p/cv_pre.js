/* ================= CV builder: the panel shell (the module itself is cv.js) ================= */
function cvPanelHTML(){
  return `<section class="panel panel-flat tool-panel" id="panel-cv" role="tabpanel" aria-labelledby="tab-cv" hidden><div id="cv_root"></div></section>`;
}
Object.assign(ICON, {cv: ic('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="2.4"/><path d="M8.5 15.5c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4M8.5 18.5h7"/>')});
