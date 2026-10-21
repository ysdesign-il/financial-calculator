/* 13.23/13.24: fewer categories – related calculators live together in one screen with sub-tabs */
const FAMS = [
  ['g_main',    [['home'], ['assist'], ['saved'], ['markets'], ['settings']]],
  ['g_job',     [['salary', 'payslip', 'empcost', 'overtime', 'realwage', 'raise', 'workdays', 'carbenefit'], ['selfemp', 'dualinc', 'freelance', 'clients', 'breakeven'], ['leave', 'notice', 'severance', 'benefits', 'reserve', 'miluim', 'workgrant'], ['joboffer', 'cv']]],
  ['g_taxes',   [['tax', 'taxrefund', 'rights', 'taxpack', 'inherit'], ['capital', 'rental'], ['purchasetax', 'landtax'], ['vat', 'taxfree']]],
  ['g_credit',  [['mortgage', 'mortcmp', 'mortcap', 'refi', 'rentbuy', 'rentlaw', 'invapt', 'renov', 'vaad'], ['loan', 'loancmp', 'prepay', 'gooddebt', 'prime'], ['creditcard', 'debtplan']]],
  ['g_invest',  [['compound', 'emergency', 'savegoal', 'windfall', 'idlecash', 'latte', 'yield', 'mmf', 'dividends', 'avgcost'], ['portfolio', 'networth', 'invfees'], ['retire', 'lumpsum', 'gradual', 'pencmp', 'tracks', 'mgmtfees', 'consol', 'hishtalmut', 'pensfix', 'oldage'], ['lifeplan', 'fire', 'freedom'], ['kidsave', 'childallow', 'kidcost', 'daycare', 'kidevent', 'teen']]],
  ['g_budget',  [['expenses', 'rcpt', 'afford', 'payday', 'insights', 'smartsplit', 'bankacc', 'reminders', 'fincal'], ['household', 'famgoal', 'bring', 'split', 'divorce'], ['travel', 'wedding', 'eventgift'], ['fuelcalc', 'carcost', 'carvsbus', 'carsell', 'evfuel', 'carlease', 'deduct', 'cardocs'], ['elecsup', 'renewals', 'arnona', 'cellcmp', 'phonecmp', 'insurance', 'insoverlap', 'lifeins', 'appliance'], ['unitprice', 'discount', 'installments']]],
  ['g_fxtools', [['convert', 'inflation', 'cpilink'], ['calcbasic', 'scical', 'units', 'stats', 'practice', 'mathx', 'percent'], ['docscan', 'letter', 'vault'], ['glossary', 'sources']]]
];
const GROUPS = FAMS.map(([g, fs]) => [g, fs.flat()]);
const TABS = GROUPS.flatMap(g => g[1]);
const FAM_OF = {}; FAMS.forEach(([, fs]) => fs.forEach(f => f.forEach(id => { FAM_OF[id] = f; })));
const famLead = id => (FAM_OF[id] || [id])[0];
