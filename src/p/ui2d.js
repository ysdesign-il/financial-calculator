/* ---- definitions for the extra calculators ---- */
const F = (id, label, unit, val, extra) => Object.assign({id, label, unit, val}, extra || {});
Object.assign(DEFS, {
  severance: [
    SEL('sv_why','f_svWhy','yes',[['yes','o_svYes'],['no','o_svNo']],{wide:true}),
    F('sv_sal','f_svSal','ils',12000,{wide:true}), F('sv_years','f_svYears','yrs',8), F('sv_other','f_svOther','ils',120000,{hint:'h_svOther'})
  ].concat(creditDefs('q')),
  notice: [
    SEL('nt_type','f_ntType','m',[['m','o_ntM'],['d','o_ntD']],{wide:true}),
    F('nt_months','f_ntMonths','',18,{wide:true}), F('nt_sal','f_ntSal','ils',12000,{wide:true})
  ],
  leave: [
    F('lv_sal','f_svSal','ils',12000,{wide:true}), F('lv_div','f_lvDiv','',25,{hint:'h_lvDiv'}),
    F('lv_ent','f_lvEnt','',12,{hint:'h_lvEnt'}), F('lv_mo','f_lvMo','',12), F('lv_used','f_lvUsed','',3), F('lv_carry','f_lvCarry','',0),
    F('lv_yrs','f_lvYrs','',3,{hint:'h_lvYrs'}), F('lv_scope','f_lvScope','%',100), F('lv_hpaid','f_lvHpaid','ils',0), F('lv_tmo','f_lvTmo','',24)
  ],
  purchasetax: [
    SEL('pt_kind','f_ptKind','single',[['single','o_ptSingle'],['add','o_ptAdd'],['oleh','o_ptOleh']],{wide:true}),
    F('pt_price','f_ptPrice','ils',2500000,{wide:true}), F('pt_lawyer','f_ptLawyer','%',0.5), F('pt_agent','f_ptAgent','%',2),
    F('pt_other','f_ptOther','ils',0,{adv:'m_adv',hint:'h_ptOther'})
  ],
  landtax: [
    F('lt_sell','f_ltSell','ils',3000000,{wide:true}), F('lt_buy','f_ltBuy','ils',1500000), F('lt_bexp','f_ltBexp','ils',50000,{hint:'h_ltBexp'}),
    F('lt_sexp','f_ltSexp','ils',60000), F('lt_impr','f_ltImpr','ils',0), F('lt_cpi','f_ltCpi','%',20,{hint:'h_ltCpi'}),
    SEL('lt_exempt','f_ltExempt','0',[['0','o_no'],['1','o_ltExYes']],{wide:true}),
    F('lt_ceil','f_ltCeil','ils',5008000,{adv:'m_adv',hint:'h_ltCeil'}), F('lt_other','f_otherInc','ils',0,{adv:'m_adv'})
  ],
  refi: [
    F('rf_bal','f_rfBal','cur',800000,{wide:true}), F('rf_rate','f_rfRate','%',5.2), F('rf_left','f_rfLeft','yrs',20),
    F('rf_nrate','f_rfNRate','%',4.2), F('rf_nyrs','f_rfNYrs','yrs',20),
    F('rf_fee','f_rfFee','cur',3000), F('rf_feePct','f_rfFeePct','%',0,{adv:'m_adv'}), F('rf_pen','f_rfPen','cur',0,{adv:'m_adv',hint:'h_rfPen'})
  ],
  loancmp: [
    {type:'html', id:'lc_box', cls:'lc-wrap'}
  ],
  prepay: [
    F('pp_bal','f_ppBal','cur',400000), F('pp_rate','f_ppRate','%',5), F('pp_yrs','f_rfLeft','yrs',15), F('pp_lump','f_ppLump','cur',100000),
    F('pp_ret','f_ppRet','%',7), F('pp_tax','f_ppTax','%',25),
    SEL('pp_after','f_ppAfter','reduce',[['reduce','o_ppReduce'],['short','o_ppShort']],{wide:true,adv:'m_adv'}), F('pp_fee','f_ppFee','cur',0,{adv:'m_adv',hint:'h_ppFee'})
  ],
  savegoal: [
    SEL('sg_mode','f_sgMode','dep',[['dep','o_sgDep'],['time','o_sgTime']],{wide:true}),
    F('sg_goal','f_sgGoal','cur',500000,{wide:true}), F('sg_now','f_sgNow','cur',20000), F('sg_rate','f_yieldYr','%',5),
    F('sg_years','f_term','yrs',10,{when:['sg_mode','dep']}), F('sg_dep','f_sgDepIn','cur',2000,{when:['sg_mode','time']}),
    F('sg_infl','f_inflation','%',2,{adv:'m_adv'}), F('sg_tax','f_taxGain','%',0,{adv:'m_adv',hint:'h_sgTax'}), F('sg_fee','f_mfAccFee','%',0,{adv:'m_adv'})
  ],
  retire: [
    F('rt_age','f_rtAge','',35), F('rt_ret','f_rtRet','',67), F('rt_life','f_rtLife','',90),
    F('rt_have','f_rtHave','cur',100000), F('rt_dep','f_rtDep','cur',2500), F('rt_need','f_rtNeed','cur',12000,{wide:true,hint:'h_rtNeed'}),
    F('rt_other','f_rtOther','cur',0,{hint:'h_rtOther'}), SEL('rt_bench','f_bench','manual',BENCH,{hint:'h_bench'}), F('rt_r1','f_rtR1','%',5), F('rt_r2','f_rtR2','%',3), F('rt_infl','f_inflation','%',2.5),
    F('rt_fee','f_mfAccFee','%',0,{adv:'m_adv'}), F('rt_coef','f_rtCoef','',200,{adv:'m_adv',hint:'h_rtCoef'})
  ],
  creditcard: [
    F('cc_bal','f_ccBal','cur',10000,{wide:true}), F('cc_apr','f_ccApr','%',15),
    SEL('cc_mode','f_ccMode','min',[['min','o_ccMin'],['fix','o_ccFix']]),
    F('cc_minPct','f_ccMinPct','%',3,{when:['cc_mode','min']}), F('cc_floor','f_ccFloor','cur',100,{when:['cc_mode','min']}),
    F('cc_pay','f_ccPay','cur',500,{when:['cc_mode','fix']}),
    F('cc_extra','f_ccExtra','cur',0,{when:['cc_mode','min'],hint:'h_ccExtra'})
  ],
  rentbuy: [
    F('rb_price','f_ptPrice','cur',2500000,{wide:true}), F('rb_down','f_down','cur',700000), F('rb_rate','f_rate','%',4.5), F('rb_yrs','f_term','yrs',25),
    F('rb_g','f_rbG','%',3), F('rb_rent','f_rbRent','cur',6500), F('rb_rg','f_rbRg','%',2), F('rb_ret','f_rbRet','%',5), F('rb_hz','f_rbHz','yrs',10),
    F('rb_cost','f_rbCost','%',3,{adv:'m_adv'}), F('rb_sell','f_rbSell','%',2,{adv:'m_adv'}), F('rb_maint','f_rbMaint','%',1,{adv:'m_adv'})
  ],
  carlease: [
    F('cl_price','f_clPrice','cur',150000,{wide:true}), F('cl_down','f_down','cur',30000), F('cl_rate','f_rate','%',5), F('cl_n','f_clN','',48), F('cl_resale','f_clResale','%',45),
    F('cl_brun','f_clBrun','cur',12000), {type:'sub',label:'w_lease'}, F('cl_lm','f_clLm','cur',3000), F('cl_lup','f_clLup','cur',10000), F('cl_lrun','f_clLrun','cur',6000),
    F('cl_opp','f_clOpp','%',3,{adv:'m_adv'})
  ],
  avgcost: [
    F('da_sh','f_daSh','',100), F('da_avg','f_daAvg','cur',50), F('da_buy','f_daBuy','cur',5000), F('da_pr','f_daPr','cur',40), F('da_cur','f_daCur','cur',42),
    F('da_fee','f_daFee','cur',0,{adv:'m_adv',hint:'h_daFee'}), F('da_tgt','f_daTgt','cur',0,{adv:'m_adv',hint:'h_daTgt'})
  ],
  breakeven: [
    F('be_fix','f_beFix','cur',20000,{wide:true}), F('be_price','f_bePrice','cur',100), F('be_var','f_beVar','cur',40), F('be_target','f_beTarget','cur',5000), F('be_units','f_beUnits','',500),
    F('be_tax','f_beTax','%',0,{adv:'m_adv',hint:'h_beTax'})
  ],
  split: [
    SEL('sp_mode','f_spMode','eq',[['eq','o_spEq'],['inc','o_spInc'],['pct','o_spPct'],['sh','o_spSh'],['ex','o_spEx'],['paid','o_spPaid']],{wide:true}),
    F('sp_total','f_spTotal','cur',600,{wide:true,when:['sp_mode','eq|inc|pct|sh|ex']}), F('sp_tip','f_spTip','%',10,{when:['sp_mode','eq|inc|pct|sh|ex']}),
    F('sp_n','f_spN','',4,{when:['sp_mode','eq']}),
    SEL('sp_round','f_spRound','0',[['0','o_rnd0'],['1','o_rnd1'],['5','o_rnd5'],['10','o_rnd10']],{when:['sp_mode','eq|inc|pct|sh|ex']}),
    {type:'html', id:'sp_box', cls:'lc-wrap', when:['sp_mode','inc|pct|sh|ex|paid']}
  ]
});
Object.assign(DEFS, {
  freedom: [
    F('fr_inc','f_frInc','cur',15000), F('fr_exp','f_frExp','cur',11000),
    F('fr_debt','f_frDebt','cur',60000), F('fr_drate','f_frDRate','%',9),
    F('fr_assets','f_frAssets','cur',10000), F('fr_em','f_frEm','',6,{hint:'h_frEm'}),
    F('fr_ret','f_rtR1','%',5), F('fr_wd','f_fiWd','%',4,{hint:'h_fiWd'}),
    F('fr_raise','f_frRaise','%',0,{adv:'m_adv',hint:'h_frRaise'})
  ],
  debtplan: [
    SEL('dp_method','f_dpMethod','ava',[['ava','o_dpAva'],['snow','o_dpSnow'],['min','o_dpMin']],{wide:true}),
    F('dp_extra','f_dpExtra','cur',500,{wide:true,hint:'h_dpExtra'}),
    {type:'sub',label:'w_debt1'}, F('dp_b1','f_dpBal','cur',20000), F('dp_r1','f_rate','%',16), F('dp_m1','f_dpMin','cur',600),
    {type:'sub',label:'w_debt2'}, F('dp_b2','f_dpBal','cur',30000), F('dp_r2','f_rate','%',8), F('dp_m2','f_dpMin','cur',500),
    {type:'sub',label:'w_debt3'}, F('dp_b3','f_dpBal','cur',8000), F('dp_r3','f_rate','%',4), F('dp_m3','f_dpMin','cur',200),
    {type:'sub',label:'w_debt4'}, F('dp_b4','f_dpBal','cur',0), F('dp_r4','f_rate','%',0), F('dp_m4','f_dpMin','cur',0)
  ],
  networth: [
    {type:'sub',label:'w_assets'}, F('nw_cash','f_nwCash','cur',20000), F('nw_inv','f_nwInv','cur',50000), F('nw_pen','f_nwPen','cur',150000), F('nw_prop','f_nwProp','cur',0), F('nw_oa','f_nwOa','cur',0),
    {type:'sub',label:'w_liab'}, F('nw_mort','f_nwMort','cur',0), F('nw_loan','f_nwLoan','cur',30000), F('nw_card','f_nwCard','cur',5000), F('nw_ol','f_nwOl','cur',0),
    {type:'sub',label:'w_monthly'}, F('nw_inc','f_frInc','cur',15000), F('nw_exp','f_frExp','cur',11000),
    F('nw_wd','f_nwWd','%',4,{adv:'m_adv',hint:'h_nwWd'})
  ],
  fire: [
    F('fi_age','f_rtAge','',35), F('fi_exp','f_fiExp','cur',10000,{wide:true}), F('fi_have','f_rtHave','cur',100000), F('fi_dep','f_rtDep','cur',3000),
    F('fi_ret','f_rtR1','%',6), F('fi_infl','f_inflation','%',2.5), F('fi_wd','f_fiWd','%',4,{hint:'h_fiWd'}),
    F('fi_other','f_fiOther','cur',0,{adv:'m_adv',hint:'h_fiOther'}), F('fi_cAge','f_fiCAge','',65,{adv:'m_adv'})
  ]
,
  inflation: [
    SEL('in_mode','f_inMode','past',[['past','o_inPast'],['future','o_inFuture'],['real','o_inReal']],{wide:true}),
    F('in_amt','f_amount','cur',100,{wide:true}),
    F('in_from','f_inFrom','',2010,{when:['in_mode','past']}), F('in_to','f_inTo','',2026,{when:['in_mode','past'],hint:'h_inTo'}),
    F('in_years','f_term','yrs',10,{when:['in_mode','future|real']}),
    F('in_nom','f_inNom','%',5,{when:['in_mode','real']}),
    F('in_rate','f_inflation','%',2,{when:['in_mode','future|real'],hint:'h_inRate'})
  ]
,
  prime: [
    SEL('pr_mode','f_prMode','loan',[['loan','o_prLoan'],['overdraft','o_prOver'],['deposit','o_prDep'],['convert','o_prConv'],['simple','o_prSimple']],{wide:true}),
    F('pr_amt','f_amount','cur',500000,{wide:true}),
    F('pr_boi','f_prBoi','%',3.25,{hint:'h_prBoi'}),
    F('pr_margin','f_prMargin','%',-0.5,{hint:'h_prMargin'}),
    F('pr_years','f_term','yrs',20,{when:['pr_mode','loan']}),
    SEL('pr_method','f_method','annuity',[['annuity','o_annuity'],['equal','o_equal']],{when:['pr_mode','loan']}),
    F('pr_days','f_prDays','',30,{when:['pr_mode','overdraft']}),
    F('pr_months','f_prMonths','',12,{when:['pr_mode','deposit']}),
    SEL('pr_comp','f_prComp','m',[['m','o_prCompM'],['e','o_prCompE']],{when:['pr_mode','deposit']}),
    F('pr_tax','f_prTax','%',15,{when:['pr_mode','deposit'],hint:'h_prTax'}),
    F('pr_rate','f_prRate','%',4.75,{when:['pr_mode','convert']}),
    SEL('pr_freq','f_prFreq','12',[['12','o_prF12'],['4','o_prF4'],['365','o_prF365'],['1','o_prF1']],{when:['pr_mode','convert']}),
    F('pr_dRate','f_prDRate','%',0,{when:['pr_mode','loan'],adv:'m_adv',hint:'h_prDRate'}),
    F('pr_dAt','f_prDAt','yrs',1,{when:['pr_mode','loan'],adv:'m_adv'})
  ]
});
