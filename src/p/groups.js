const GROUPS = [
  ['g_main',  ['home','saved','assist','settings']],
  ['g_save',  ['expenses','freedom','networth','debtplan','savegoal','compound','yield','dividends','avgcost','retire','fire','mgmtfees','hishtalmut','kidsave']],
  ['g_work2', ['clients','salary','selfemp','tax','capital','rental','severance','notice','leave','overtime','taxrefund','joboffer','freelance','empcost','carbenefit','benefits']],
  ['g_loans', ['prime','loan','loancmp','prepay','creditcard','carlease','mortgage','refi','rentbuy','purchasetax','landtax','mortcap','evfuel']],
  ['g_tools', ['convert','vat','percent','inflation','cpilink','split','breakeven','unitprice','discount','workdays','appliance','insurance']]
];
const TABS = GROUPS.flatMap(g => g[1]);
