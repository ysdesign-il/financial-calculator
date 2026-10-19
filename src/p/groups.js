const GROUPS = [
  ['g_main',    ['home','markets','saved','assist','settings']],
  ['g_job',     ['salary','empcost','selfemp','freelance','clients','overtime','leave','notice','severance','benefits','workgrant','reserve','carbenefit','joboffer','workdays','cv']],
  ['g_taxes',   ['tax','taxrefund','taxfree','capital','rental','purchasetax','landtax','vat']],
  ['g_credit',  ['loan','loancmp','prime','gooddebt','prepay','creditcard','debtplan','carlease']],
  ['g_realty',  ['mortgage','mortcmp','mortcap','refi','rentbuy']],
  ['g_invest',  ['compound','savegoal','yield','dividends','avgcost','networth','kidsave','mmf','invfees','childallow']],
  ['g_retire',  ['retire','pensfix','oldage','pencmp','mgmtfees','hishtalmut','fire','freedom']],
  ['g_budget',  ['expenses','bankacc','smartsplit','split','unitprice','discount','appliance','evfuel','breakeven']],
  ['g_compare', ['insurance','cellcmp','phonecmp']],
  ['g_fxtools', ['mathx','docscan','convert','inflation','cpilink','percent']]
];
const TABS = GROUPS.flatMap(g => g[1]);
