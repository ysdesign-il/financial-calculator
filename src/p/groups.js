const GROUPS = [
  ['g_main',    ['home','insights','markets','saved','assist','settings']],
  ['g_job',     ['salary','empcost','selfemp','freelance','clients','overtime','leave','notice','severance','benefits','workgrant','reserve','carbenefit','joboffer','workdays','cv']],
  ['g_taxes',   ['rights','tax','taxrefund','taxfree','capital','rental','purchasetax','landtax','vat','arnona']],
  ['g_credit',  ['loan','loancmp','prime','gooddebt','prepay','creditcard','debtplan','carlease']],
  ['g_realty',  ['mortgage','mortcmp','mortcap','refi','rentbuy']],
  ['g_invest',  ['lifeplan','portfolio','compound','savegoal','yield','dividends','avgcost','networth','kidsave','mmf','invfees','childallow']],
  ['g_retire',  ['retire','pensfix','oldage','pencmp','mgmtfees','hishtalmut','fire','freedom']],
  ['g_budget',  ['expenses','reminders','household','travel','bankacc','smartsplit','split','unitprice','discount','appliance','elecsup','eventgift','fuelcalc','carcost','evfuel','breakeven']],
  ['g_compare', ['insurance','cellcmp','phonecmp']],
  ['g_fxtools', ['mathx','docscan','vault','convert','inflation','cpilink','percent']]
];
const TABS = GROUPS.flatMap(g => g[1]);
