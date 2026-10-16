/* 9.0: phone plans, smart split, good and bad loans, employer cost from net */
Object.assign(DEFS, {
  cellcmp: [
    F('cl_gb','f_clGb','',50,{hint:'h_clGb'}),
    SEL('cl_5g','f_cl5g','any',[['any','o_clAny'],['yes','o_clYes']]),
    SEL('cl_abroad','f_clAbroad','any',[['any','o_clAny'],['yes','o_clYes']]),
    F('cl_months','f_clMonths','mo',24,{hint:'h_clMonths'}),
    F('cl_lines','f_clLines','',1),
    F('cl_now','f_clNow','cur',0,{hint:'h_clNow'}),
    SEL('cl_calls','f_clCalls','yes',[['yes','o_clCallsYes'],['no','o_clCallsNo']],{adv:'m_adv'}),
    {type:'html', id:'cl_box', cls:'lc-wrap cl-wrap'}
  ],
  smartsplit: [
    F('ss_inc','f_ssInc','cur',14000,{wide:true,hint:'h_ssInc'}),
    SEL('ss_plan','f_ssPlan','50202010',[['50202010','o_ss50202010'],['503020','o_ss503020'],['60201010','o_ss60201010'],['70101010','o_ss70101010'],['custom','o_ssCustom']],{wide:true}),
    F('ss_need','f_ssNeed','%',50), F('ss_want','f_ssWant','%',20), F('ss_inv','f_ssInv','%',20), F('ss_safe','f_ssSafe','%',10),
    F('ss_years','f_years','yrs',20),
    F('ss_ret','f_ssRet','%',7,{hint:'h_ssRet'}), F('ss_safeRet','f_ssSafeRet','%',4,{hint:'h_ssSafeRet'}),
    F('ss_infl','f_inflation','%',2.5),
    F('ss_grow','f_ssGrow','%',2,{adv:'m_adv',hint:'h_ssGrow'}), F('ss_tax','f_ssTax','%',25,{adv:'m_adv',hint:'h_ssTax'}), F('ss_fee','f_ssFee','%',0.5,{adv:'m_adv'})
  ],
  gooddebt: [
    F('gd_amt','f_gdAmt','cur',100000,{wide:true}),
    F('gd_rate','f_gdRate','%',7,{hint:'h_gdRate'}), F('gd_years','f_years','yrs',5),
    SEL('gd_use','f_gdUse','invest',[['invest','o_gdInvest'],['property','o_gdProperty'],['study','o_gdStudy'],['car','o_gdCar'],['consume','o_gdConsume']],{wide:true,hint:'h_gdUse'}),
    F('gd_ret','f_gdRet','%',8,{when:['gd_use','invest|property'],hint:'h_gdRet'}),
    F('gd_inc','f_gdInc','cur',800,{when:['gd_use','study'],hint:'h_gdInc'}),
    F('gd_dep','f_gdDep','%',15,{when:['gd_use','car'],hint:'h_gdDep'}),
    F('gd_alt','f_gdAlt','%',4,{hint:'h_gdAlt'}),
    F('gd_infl','f_inflation','%',2.5)
  ]
});
DEFS.empcost = [
  SEL('ec_mode','f_ecMode','gross',[['gross','o_ecFromGross'],['net','o_ecFromNet']],{wide:true,hint:'h_ecMode'}),
  F('ec_net','f_ecNet','ils',10000,{wide:true,when:['ec_mode','net']}),
  F('ec_gross','f_ecGross','ils',12000,{wide:true,when:['ec_mode','gross']}),
  F('ec_pts','f_ecPts','',2.25,{hint:'h_ecPts'}),
  F('ec_eeP','f_ecEeP','%',6), F('ec_eeS','f_ecEeS','%',0,{hint:'h_ecEeS'}),
  F('ec_pens','f_erPens','%',6.5), F('ec_sev','f_erSev','%',8.33),
  F('ec_hish','f_erStudy','%',0), F('ec_other','f_ecOther','ils',0,{hint:'h_ecOther'}), F('ec_over','f_ecOver','%',0,{adv:'m_adv',hint:'h_ecOver'})
];
Object.assign(ICON, {
  cellcmp: ic('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/><path d="M3.5 8a6 6 0 0 1 0 8M20.5 8a6 6 0 0 1 0 8"/>'),
  smartsplit: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6 6"/><path d="M12 12H3.5"/>'),
  gooddebt: ic('<path d="M4 17l5-5 4 3 7-8"/><path d="M4 7l5 5"/><path d="M15 7h5v5"/>'),
  markets: ic('<path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/><path d="M2 20h20"/>')
});
/* 9.0: phones */
const PHONES_IDS = [['ip18p', 'iPhone 18 Pro'], ['ip18pm', 'iPhone 18 Pro Max'], ['ipduo', 'iPhone Duo'], ['ipair', 'iPhone Air'], ['ip17', 'iPhone 17'], ['ip17p', 'iPhone 17 Pro'], ['ip17pm', 'iPhone 17 Pro Max'], ['ip17e', 'iPhone 17e'], ['ip16', 'iPhone 16'], ['ip16plus', 'iPhone 16 Plus'], ['ip16p', 'iPhone 16 Pro'], ['ip16pm', 'iPhone 16 Pro Max'], ['ip16e', 'iPhone 16e'], ['s26', 'Galaxy S26'], ['s26plus', 'Galaxy S26+'], ['s26u', 'Galaxy S26 Ultra'], ['s25', 'Galaxy S25'], ['s25plus', 'Galaxy S25+'], ['s25u', 'Galaxy S25 Ultra'], ['s25edge', 'Galaxy S25 Edge'], ['s25fe', 'Galaxy S25 FE'], ['s24fe', 'Galaxy S24 FE'], ['fold8u', 'Galaxy Z Fold8 Ultra'], ['fold8', 'Galaxy Z Fold8'], ['flip8', 'Galaxy Z Flip8'], ['fold7', 'Galaxy Z Fold7'], ['flip7', 'Galaxy Z Flip7'], ['flip7fe', 'Galaxy Z Flip7 FE'], ['a57', 'Galaxy A57'], ['a37', 'Galaxy A37'], ['a56', 'Galaxy A56'], ['a36', 'Galaxy A36'], ['a26', 'Galaxy A26'], ['a17', 'Galaxy A17 5G'], ['a16', 'Galaxy A16 5G'], ['a07', 'Galaxy A07'], ['x17', 'Xiaomi 17'], ['x17p', 'Xiaomi 17 Pro'], ['x17pm', 'Xiaomi 17 Pro Max'], ['x17u', 'Xiaomi 17 Ultra'], ['x17t', 'Xiaomi 17T'], ['x17tp', 'Xiaomi 17T Pro'], ['x15', 'Xiaomi 15'], ['x15u', 'Xiaomi 15 Ultra'], ['x15t', 'Xiaomi 15T'], ['x15tp', 'Xiaomi 15T Pro'], ['x14t', 'Xiaomi 14T'], ['x14tp', 'Xiaomi 14T Pro'], ['rn15', 'Redmi Note 15 5G'], ['rn15p', 'Redmi Note 15 Pro 5G'], ['rn15pp', 'Redmi Note 15 Pro+ 5G'], ['r15', 'Redmi 15'], ['r15c', 'Redmi 15C'], ['pocof8u', 'POCO F8 Ultra'], ['pocof8p', 'POCO F8 Pro'], ['pocof7', 'POCO F7'], ['pocof7p', 'POCO F7 Pro'], ['pocof7u', 'POCO F7 Ultra'], ['pocox7p', 'POCO X7 Pro'], ['pocox8p', 'POCO X8 Pro'], ['pocox8pm', 'POCO X8 Pro Max'], ['px11xl', 'Pixel 11 Pro XL'], ['px11p', 'Pixel 11 Pro'], ['px11', 'Pixel 11']];
(function(){
  const opts = [['none', 'o_ph_noneSel']].concat(PHONES_IDS.map(x => [x[0], '=' + x[1]]));
  DEFS.phonecmp = [
    SEL('ph_by','f_phBy','balanced',[['balanced','o_ph_balanced'],['price','o_ph_price'],['camera','o_ph_camera'],['battery','o_ph_battery'],['small','o_ph_small'],['big','o_ph_big']],{wide:true}),
    SEL('ph_brand','f_phBrand','all',[['all','o_ph_all'],['apple','=Apple'],['samsung','=Samsung'],['google','=Google'],['xiaomi','=Xiaomi']]),
    F('ph_budget','f_phBudget','cur',0,{hint:'h_phBudget'}),
    SEL('ph_a','f_phA','ip17',opts), SEL('ph_b','f_phB','s26',opts), SEL('ph_c','f_phC','px11',opts),
    {type:'html', id:'ph_box', cls:'lc-wrap ph-wrap'}
  ];
  ICON.phonecmp = ic('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 5h4"/><circle cx="12" cy="18" r="1"/>');
})();
