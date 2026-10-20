/* 13.23: fewer categories – related calculators live together in one screen with sub-tabs */
const FAMS = [
  ['g_main',    [['home'], ['assist'], ['saved'], ['markets'], ['settings']]],
  ['g_job',     [['salary', 'empcost', 'overtime', 'workdays', 'carbenefit'], ['selfemp', 'freelance', 'clients', 'breakeven'], ['leave', 'notice', 'severance', 'benefits', 'reserve', 'workgrant'], ['joboffer', 'cv']]],
  ['g_taxes',   [['tax', 'taxrefund', 'rights'], ['capital', 'rental'], ['purchasetax', 'landtax'], ['vat', 'taxfree']]],
  ['g_credit',  [['mortgage', 'mortcmp', 'mortcap', 'refi', 'rentbuy'], ['loan', 'loancmp', 'prepay', 'gooddebt', 'prime'], ['creditcard', 'debtplan']]],
  ['g_invest',  [['compound', 'savegoal', 'yield', 'mmf', 'dividends', 'avgcost'], ['portfolio', 'networth', 'invfees'], ['retire', 'pencmp', 'mgmtfees', 'hishtalmut', 'pensfix', 'oldage'], ['lifeplan', 'fire', 'freedom'], ['kidsave', 'childallow']]],
  ['g_budget',  [['expenses', 'insights', 'smartsplit', 'bankacc', 'reminders'], ['household', 'split'], ['travel', 'eventgift'], ['fuelcalc', 'carcost', 'evfuel', 'carlease'], ['elecsup', 'arnona', 'cellcmp', 'phonecmp', 'insurance', 'appliance'], ['unitprice', 'discount']]],
  ['g_fxtools', [['convert', 'inflation', 'cpilink'], ['mathx', 'percent'], ['docscan', 'vault']]]
];
const GROUPS = FAMS.map(([g, fs]) => [g, fs.flat()]);
const TABS = GROUPS.flatMap(g => g[1]);
const FAM_OF = {}; FAMS.forEach(([, fs]) => fs.forEach(f => f.forEach(id => { FAM_OF[id] = f; })));
const famLead = id => (FAM_OF[id] || [id])[0];
