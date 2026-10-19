/* ================= four tools (module nt.js): the panel shells ================= */
const ntPanelHTML = id => `<section class="panel panel-flat tool-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" hidden><div id="nt_root_${id}"></div></section>`;
Object.assign(ICON, {
  elecsup: ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/><path d="M19 3v4M21 5h-4"/>'),
  eventgift: ic('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M7.5 8a2.5 2.5 0 1 1 4.5-1.5A2.5 2.5 0 1 1 16.5 8"/>'),
  carcost: ic('<path d="M5 17h14M6 17l1.5-5h9l1.5 5"/><circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/><path d="M17 4v5M15 6.5h4"/>'),
  arnona: ic('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/><path d="M15 3.5h4M17 1.5v4"/>')
});
