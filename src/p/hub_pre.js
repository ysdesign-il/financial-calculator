/* ================= 13.22: topic screens – the panel shells (modules: ins, rt, lp, vt, hh, tv, pf) ================= */
const HUB_IDS = ['insights', 'rights', 'lifeplan', 'vault', 'household', 'travel', 'portfolio'];
const hubPanelHTML = id => `<section class="panel panel-flat tool-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" hidden><div id="hr_${id}"></div></section>`;
Object.assign(ICON, {
  insights: ic('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/><circle cx="19" cy="5" r="2"/>'),
  rights: ic('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  lifeplan: ic('<path d="M3 20h18"/><path d="M5 20V10l4-3 4 3v10"/><path d="M15 20v-6l3-2 3 2v6"/><path d="M9 4V2M5 6 4 5M13 6l1-1"/>'),
  vault: ic('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="m15 17 1.5 1.5L19 16"/>'),
  household: ic('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M14 20c0-2.6 1.3-4.6 3-4.6s4 2 4 4.6"/>'),
  travel: ic('<path d="M2 16l20-8-6 12-3-5z"/><path d="m13 15-4 4"/>'),
  portfolio: ic('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/><path d="M12 12H3"/>')
});
