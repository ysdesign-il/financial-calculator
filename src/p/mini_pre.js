/* ================= 13.24: small calculators that live inside the topics – panel shells (engine: mini.js, tools: mini_*.js) ================= */
const MINI_IDS = [
  'payslip', 'realwage', 'raise', 'taxpack', 'inherit',
  'rentlaw', 'renov', 'invapt', 'vaad',
  'emergency', 'idlecash', 'windfall', 'latte', 'lumpsum', 'gradual', 'consol', 'tracks', 'kidcost', 'daycare', 'kidevent', 'teen',
  'afford', 'payday', 'fincal', 'famgoal', 'divorce', 'wedding', 'carvsbus', 'carsell', 'cardocs', 'deduct', 'renewals', 'insoverlap', 'lifeins', 'installments', 'letter', 'glossary', 'sources',
  'calcbasic', 'scical', 'units', 'stats', 'practice', 'dualinc'
];
HUB_IDS.push.apply(HUB_IDS, MINI_IDS);
ICON.glossary = ic('<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/><path d="M8 8h6"/>');
ICON.sources = ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>');
ICON.calcbasic = ic('<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="8" y="5.5" width="8" height="3.5" rx=".8"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>');
ICON.scical = ic('<path d="M4 6h6M7 3v6"/><path d="M14 6h6"/><path d="M4.5 15.5l5 5M9.5 15.5l-5 5"/><path d="M14 16h6M14 20h6"/>');
ICON.units = ic('<path d="M3 7h18M3 7l3-3M3 7l3 3M21 17H3M21 17l-3-3M21 17l-3 3"/>');
ICON.stats = ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>');
ICON.practice = ic('<path d="M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="m9 10 2 2 4-4"/>');
MINI_IDS.forEach(id => { if (!ICON[id]) ICON[id] = ICON[famLead(id)] || ''; });
