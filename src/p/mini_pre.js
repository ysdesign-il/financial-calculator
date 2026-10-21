/* ================= 13.24: small calculators that live inside the topics – panel shells (engine: mini.js, tools: mini_*.js) ================= */
const MINI_IDS = [
  'payslip', 'realwage', 'raise', 'taxpack', 'inherit',
  'rentlaw', 'renov', 'invapt', 'vaad',
  'emergency', 'idlecash', 'windfall', 'latte', 'lumpsum', 'gradual', 'consol', 'tracks', 'kidcost', 'daycare', 'kidevent', 'teen',
  'afford', 'payday', 'fincal', 'famgoal', 'divorce', 'wedding', 'carvsbus', 'carsell', 'cardocs', 'deduct', 'renewals', 'insoverlap', 'lifeins', 'installments', 'letter', 'glossary', 'sources'
];
HUB_IDS.push.apply(HUB_IDS, MINI_IDS);
ICON.glossary = ic('<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/><path d="M8 8h6"/>');
ICON.sources = ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>');
MINI_IDS.forEach(id => { if (!ICON[id]) ICON[id] = ICON[famLead(id)] || ''; });
