/* ================= 13.32: speed – a calculator's screen is built when it is first opened (or quietly in the background), not all at start-up ================= */
const PZ = {ids: new Set(), built: new Set()};
const pzShell = id => { PZ.ids.add(id); return `<section class="panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" hidden data-pz="1"></section>`; };
