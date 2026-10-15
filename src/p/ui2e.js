/* ---- new tools: 2026 figures, fields and icons (must exist before the screens are built) ---- */
const IL26 = {
  minWage: 6443.85, minHour: 35.40, avgWage: 13769,                 // minimum wage from 1.4.2026 (182 h), average wage for benefits
  hishCap: 15712, hishErMax: 0.075, hishSelfCap: 293397, hishSelfDed: 13203, hishSelfCG: 20566,
  carPct: 0.0248, carCap: 596860, carDed: {fuel: 0, hybrid: 580, plugin: 1150, ev: 1380},
  childDep: 58,
  unBase: 415, unMax1: 550.76, unMax2: 367.17, matMaxDay: 1752.33,
  fuel95: 8.27, kwh: 0.6352, vat: 0.18,
  kidGrant3: 291, kidGrant13: 291, kidGrant18: 582, kidGrant21: 582      // savings for every child: grants (2026). Born from 2017: 3 and bar/bat mitzvah instead of 18
};
/* 2026: self-employed contributions (Bituach Leumi + health), employer deposits that stay tax-free, donation credit limits */
Object.assign(TAX, {sNiLow: .0447, sNiHigh: .1283, sHLow: .0323, sHHigh: .0517, sMinBase: 3442,
  erPensCap: 33290, erPensRate: .075, erSevCap: 44100, erSevRate: .0833, donMin: 207, donMax: 10354816});
const isoDay = off => { const d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/* --- fields --- */
Object.assign(DEFS, {
  cpilink: [
    F('lk_amt','f_amount','cur',5000,{wide:true}),
    SEL('lk_idx','f_lkIdx','cpi',[['cpi','o_lkCpi'],['build','o_lkBuild']],{wide:true}),
    SEL('lk_src','f_lkSrc','auto',[['auto','o_lkAuto'],['manual','o_lkManual']],{wide:true}),
    {type:'html', id:'lk_box', cls:'lk-box', when:['lk_src','auto']},
    F('lk_v1','f_lkV1','',100,{when:['lk_src','manual']}), F('lk_v2','f_lkV2','',105,{when:['lk_src','manual']}),
    F('lk_fut','f_lkFut','yrs',0,{adv:'m_adv', hint:'h_lkFut'})
  ],
  overtime: [
    SEL('ot_basis','f_otBasis','hour',[['hour','o_otHour'],['month','o_otMonth']],{wide:true}),
    F('ot_rate','f_otRate','ils',45,{when:['ot_basis','hour']}), F('ot_month','f_otMonth','ils',12000,{when:['ot_basis','month']}),
    F('ot_reg','f_otReg','',182,{when:['ot_basis','hour'],hint:'h_otReg'}),
    F('ot_125','f_ot125','',20,{hint:'h_ot125'}), F('ot_150','f_ot150','',6),
    F('ot_sh','f_otSh','',0,{hint:'h_otSh'}),
    F('ot_sh175','f_otSh175','',0,{adv:'m_adv'}), F('ot_sh200','f_otSh200','',0,{adv:'m_adv'}), F('ot_pts','f_points','',2.25,{adv:'m_adv'})
  ],
  taxrefund: [
    F('tr_gross','f_trGross','ils',120000,{wide:true,hint:'h_trGross'}), F('tr_paid','f_trPaid','ils',9000,{wide:true,hint:'h_trPaid'}),
    F('tr_pts','f_points','',2.25,{hint:'h_trPts'}),
    F('tr_don','f_trDon','ils',0), F('tr_life','f_trLife','ils',0,{adv:'m_adv'}), F('tr_pens','f_trPens','ils',0,{adv:'m_adv'})
  ],
  joboffer: [F('jo_pts','f_points','',2.25), {type:'html', id:'jo_box', cls:'lc-wrap'}],
  freelance: [
    F('fl_net','f_flNet','cur',15000,{wide:true}), F('fl_exp','f_flExp','cur',2000),
    F('fl_hpd','f_flHpd','',8), F('fl_bill','f_flBill','%',70,{hint:'h_flBill'}), F('fl_off','f_flOff','',25,{hint:'h_flOff'}),
    SEL('fl_vat','f_dealer','murshe',[['murshe','o_murshe'],['patur','o_patur']]), F('fl_pts','f_points','',2.25,{adv:'m_adv'}),
    F('fl_buf','f_flBuf','%',0,{adv:'m_adv',hint:'h_flBuf'})
  ],
  empcost: [
    F('ec_gross','f_ecGross','ils',12000,{wide:true}), F('ec_pens','f_erPens','%',6.5), F('ec_sev','f_erSev','%',8.33),
    F('ec_hish','f_erStudy','%',0), F('ec_other','f_ecOther','ils',0,{hint:'h_ecOther'}), F('ec_over','f_ecOver','%',0,{adv:'m_adv',hint:'h_ecOver'})
  ],
  mgmtfees: [
    F('mf_bal','f_mfBal','ils',150000), F('mf_dep','f_mfDep','ils',2000), F('mf_yrs','f_term','yrs',25), F('mf_ret','f_mfRet','%',5),
    {type:'sub',label:'w_mfA'}, F('mf_ad','f_mfDepFee','%',3), F('mf_aa','f_mfAccFee','%',0.3),
    {type:'sub',label:'w_mfB'}, F('mf_bd','f_mfDepFee','%',1), F('mf_ba','f_mfAccFee','%',0.15)
  ],
  hishtalmut: [
    SEL('kh_type','f_khType','emp',[['emp','o_khEmp'],['self','o_khSelf']],{wide:true}),
    F('kh_sal','f_khSal','ils',15000,{when:['kh_type','emp']}), F('kh_er','f_khEr','%',7.5,{when:['kh_type','emp']}), F('kh_ee','f_khEe','%',2.5,{when:['kh_type','emp']}),
    F('kh_inc','f_khInc','ils',200000,{when:['kh_type','self']}), F('kh_dep','f_khDep','ils',13203,{when:['kh_type','self'],hint:'h_khDep'}),
    F('kh_yrs','f_term','yrs',6), F('kh_ret','f_mfRet','%',5), F('kh_bal','f_khBal','ils',0,{adv:'m_adv'}), F('kh_fee','f_mfAccFee','%',0.5,{adv:'m_adv'})
  ],
  kidsave: [
    F('ks_age','f_ksAge','yrs',0), SEL('ks_par','f_ksPar','1',[['1','o_ksPar1'],['0','o_ksPar0']],{wide:true}),
    SEL('ks_to','f_ksTo','21',[['18','o_ks18'],['21','o_ks21']]), F('ks_ret','f_mfRet','%',4,{hint:'h_ksRet'}),
    F('ks_bal','f_khBal','ils',0,{adv:'m_adv'}), F('ks_fee','f_mfAccFee','%',0,{adv:'m_adv'})
  ],
  benefits: [
    SEL('bn_kind','f_bnKind','un',[['un','o_bnUn'],['mat','o_bnMat']],{wide:true}),
    F('bn_w6','f_bnW6','ils',72000,{wide:true,when:['bn_kind','un'],hint:'h_bnW6'}), F('bn_age','f_bnAge','',35,{when:['bn_kind','un']}),
    SEL('bn_dep','f_bnDep','2',[['2','o_bnDep2'],['3','o_bnDep3']],{when:['bn_kind','un']}),
    F('bn_w3','f_bnW3','ils',36000,{wide:true,when:['bn_kind','mat'],hint:'h_bnW3'}), SEL('bn_wk','f_bnWk','15',[['15','o_bnWk15'],['8','o_bnWk8']],{when:['bn_kind','mat'],hint:'h_bnWk'})
  ],
  mortcap: [
    F('mc_inc','f_mcInc','ils',22000,{wide:true}), F('mc_other','f_mcOther','ils',0), F('mc_eq','f_mcEq','ils',500000),
    SEL('mc_type','f_buyerType','first',[['first','o_mcFirst'],['upgrade','o_mcUp'],['invest','o_mcInv']],{wide:true}),
    F('mc_rate','f_mcRate','%',4.8), F('mc_yrs','f_term','yrs',30), F('mc_pti','f_mcPti','%',35,{hint:'h_mcPti'})
  ],
  carbenefit: [
    F('cb_price','f_cbPrice','ils',180000,{wide:true,hint:'h_cbPrice'}), SEL('cb_kind','f_cbKind','fuel',[['fuel','o_cbFuel'],['hybrid','o_cbHybrid'],['plugin','o_cbPlugin'],['ev','o_cbEv']],{wide:true}),
    F('cb_gross','f_cbGross','ils',18000), F('cb_pts','f_points','',2.25), F('cb_pay','f_cbPay','ils',0,{adv:'m_adv',hint:'h_cbPay'})
  ],
  evfuel: [
    F('ev_km','f_evKm','km',15000,{wide:true}), F('ev_fp','f_evFp','ils',IL26.fuel95,{hint:'h_evFp'}), F('ev_fc','f_evFc','',7),
    F('ev_kwh','f_evKwh','ils',IL26.kwh,{hint:'h_apTar'}), F('ev_ec','f_evEc','',16), F('ev_diff','f_evDiff','ils',20000,{hint:'h_evDiff'}),
    F('ev_pub','f_evPub','%',20,{adv:'m_adv'}), F('ev_pubp','f_evPubp','ils',1.9,{adv:'m_adv'}), F('ev_mf','f_evMf','ils',3500,{adv:'m_adv'}), F('ev_me','f_evMe','ils',2000,{adv:'m_adv'}), F('ev_hz','f_evHz','yrs',5,{adv:'m_adv'})
  ],
  appliance: [
    SEL('ap_pre','f_apPre','c',[['c','o_apC'],['900','o_apAc'],['2500','o_apBoiler'],['2000','o_apHeater'],['2400','o_apDryer'],['2000o','o_apOven'],['150','o_apFridge'],['100','o_apTv'],['250','o_apPc']],{wide:true}),
    F('ap_w','f_apW','W',1000), F('ap_h','f_apH','',4), F('ap_d','f_apD','',30), F('ap_tar','f_apTar','ils',IL26.kwh,{hint:'h_apTar'}), F('ap_q','f_apQ','',1,{adv:'m_adv'}), F('ap_sb','f_apSb','W',0,{adv:'m_adv',hint:'h_apSb'})
  ],
  unitprice: [{type:'html', id:'up_box', cls:'lc-wrap'}],
  discount: [
    SEL('ds_mode','f_dsMode','pct',[['pct','o_dsPct'],['stack','o_dsStack'],['bogo','o_dsBogo'],['second','o_dsSecond'],['nfor','o_dsNfor'],['coupon','o_dsCoupon']],{wide:true}),
    F('ds_price','f_dsPrice','cur',50), F('ds_qty','f_dsQty','',1,{when:['ds_mode','pct|stack|coupon']}),
    F('ds_pct','f_dsPctF','%',20,{when:['ds_mode','pct|stack|second']}), F('ds_pct2','f_dsPct2','%',10,{when:['ds_mode','stack']}),
    F('ds_buy','f_dsBuy','',1,{when:['ds_mode','bogo']}), F('ds_free','f_dsFree','',1,{when:['ds_mode','bogo']}),
    F('ds_n','f_dsN','',3,{when:['ds_mode','nfor']}), F('ds_deal','f_dsDeal','cur',120,{when:['ds_mode','nfor']}),
    F('ds_coupon','f_dsCoupon','cur',30,{when:['ds_mode','coupon']}), F('ds_min','f_dsMin','cur',0,{when:['ds_mode','coupon']})
  ],
  workdays: [
    {type:'date', id:'wd_from', label:'f_wdFrom', val: isoDay(0)}, {type:'date', id:'wd_to', label:'f_wdTo', val: isoDay(30)},
    SEL('wd_week','f_wdWeek','5',[['5','o_wd5'],['6','o_wd6']]), SEL('wd_hol','f_wdHol','1',[['1','o_on'],['0','o_off']]),
    SEL('wd_end','f_wdEnd','1',[['1','o_yes'],['0','o_no']]),
    F('wd_off','f_wdOff','',0,{adv:'m_adv',hint:'h_wdOff'}), F('wd_hrs','f_wdHrs','',0,{adv:'m_adv',hint:'h_wdHrs'})
  ]
});
Object.assign(ICON, {
  overtime: ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
  taxrefund: ic('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 9h6M9 13h4"/><path d="M15 15l2 2 3-4"/>'),
  joboffer: ic('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>'),
  freelance: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/><path d="M17 3l1 2"/>'),
  empcost: ic('<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5"/><path d="M17 9h4M19 7v4"/>'),
  mgmtfees: ic('<path d="M4 19l5-6 4 3 7-9"/><path d="M15 7h5v5"/><circle cx="7" cy="6" r="2"/>'),
  hishtalmut: ic('<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>'),
  kidsave: ic('<circle cx="12" cy="7" r="3"/><path d="M7 21v-5a5 5 0 0 1 10 0v5"/><path d="M10 15h4"/>'),
  benefits: ic('<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>'),
  mortcap: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M12 13v4M10 15h4"/>'),
  carbenefit: ic('<path d="M5 16l1.5-5h11L19 16"/><rect x="3" y="16" width="18" height="4" rx="1"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M12 4v4M10 6h4"/>'),
  evfuel: ic('<path d="M13 3L6 13h5l-1 8 7-10h-5z"/>'),
  appliance: ic('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 8l-2 4h4l-2 4"/>'),
  unitprice: ic('<path d="M3 3h2l2 12h11l2-8H7"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>'),
  discount: ic('<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/><path d="M10 15l5-5"/>'),
  workdays: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 15l2 2 4-4"/>'),
  cpilink: ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>')
});
