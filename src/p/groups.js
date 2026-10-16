const GROUPS = [
  ['g_main',  ['home','markets','saved','assist','settings']],
  ['g_save',  ['expenses','freedom','networth','debtplan','savegoal','compound','yield','dividends','avgcost','retire','fire','smartsplit','mgmtfees','pencmp','hishtalmut','kidsave']],
  ['g_work2', ['clients','salary','selfemp','tax','capital','rental','severance','notice','leave','overtime','taxrefund','joboffer','freelance','empcost','carbenefit','benefits']],
  ['g_loans', ['prime','loan','loancmp','gooddebt','prepay','creditcard','carlease','mortgage','mortcmp','refi','rentbuy','purchasetax','landtax','mortcap','evfuel']],
  ['g_tools', ['convert','vat','percent','inflation','cpilink','split','breakeven','unitprice','discount','workdays','appliance','insurance','cellcmp','phonecmp']]
];
const TABS = GROUPS.flatMap(g => g[1]);
