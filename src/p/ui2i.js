/* ---- 10.9: new calculators — fields and icons ---- */
const IL26B = {
  rsMin: 328.76, rsMax: 1730.33,                                                   // reservist daily compensation, Bituach Leumi from 1.1.2026
  rsPers: {ap: 46, a: 39, b: 31, d: 18, e: 11}, rsFam: {ap: 83, a: 71, b: 60, d: 33, e: 21}, rsHouse: 1250,   // 2026 grants, from day 41 (40+ days)
  pfCeil: 9430, pfPct: 0.575, pfMul: 1.35,                                         // fixation of rights 2026: exempt pension ceiling, exemption share, severance factor
  ca1: 173, ca2: 219, ca5: 173,                                                    // child allowance 2026 per child: 1st, 2nd–4th, 5th+
  oaBase: 1838, oa80: 1941, oaSpouse: 924, oaChild: 581,                          // old-age pension 2026
  wgBands: {p12: [2450, 7289], p3: [2450, 8020], s12: [1510, 11190], s3: [1510, 13660], a55: [2450, 7289], w60: [920, 8930]},   // work grant 2025: monthly income bands
  boi: 3.25
};
Object.assign(DEFS, {
  workgrant: [
    SEL('wg_fam','f_wgFam','p12',[['p12','o_wgP12'],['p3','o_wgP3'],['s12','o_wgS12'],['s3','o_wgS3'],['a55','o_wgA55'],['w60','o_wgW60'],['none','o_wgNone']],{wide:true}),
    F('wg_inc','f_wgInc','ils',5000,{wide:true,hint:'h_wgInc'}), F('wg_mo','f_wgMo','mo',12),
    SEL('wg_kind','f_wgKind','emp',[['emp','o_wgEmp'],['self','o_wgSelf']]),
    SEL('wg_prop','f_wgProp','0',[['0','o_no'],['1','o_yes']],{wide:true,hint:'h_wgProp'}),
    F('wg_tod','f_wgTod','',0,{adv:'m_adv',hint:'h_wgTod'})
  ],
  reserve: [
    F('rs_days','f_rsDays','',30,{wide:true}), F('rs_inc','f_rsInc','ils',36000,{wide:true,hint:'h_rsInc'}),
    SEL('rs_unit','f_rsUnit','b',[['ap','o_rsAp'],['a','o_rsA'],['b','o_rsB'],['d','o_rsD'],['e','o_rsE']],{wide:true,hint:'h_rsUnit'}),
    SEL('rs_kids','f_rsKids','0',[['0','o_no'],['1','o_yes']],{hint:'h_rsKids'}),
    SEL('rs_active','f_rsActive','1',[['1','o_yes'],['0','o_no']],{hint:'h_rsActive'})
  ],
  pensfix: [
    F('pf_pens','f_pfPens','ils',8000,{wide:true}), F('pf_sev','f_pfSev','ils',0,{wide:true,hint:'h_pfSev'}),
    F('pf_share','f_pfShare','%',100,{hint:'h_pfShare'}), F('pf_other','f_pfOther','ils',0,{hint:'h_pfOther'}),
    F('pf_pts','f_points','',2.25,{adv:'m_adv'})
  ],
  mmf: [
    F('mm_amt','f_amount','ils',100000,{wide:true}), F('mm_mo','f_mmMo','mo',12),
    F('mm_dep','f_mmDep','%',3,{hint:'h_mmDep'}), F('mm_yld','f_mmYld','%',3.15,{hint:'h_mmYld'}),
    F('mm_fee','f_mmFee','%',0.2,{hint:'h_mmFee'}), F('mm_infl','f_mmInfl','%',2,{hint:'h_mmInfl'})
  ],
  invfees: [
    F('if_init','f_ifInit','ils',100000,{wide:true}), F('if_mon','f_ifMon','ils',1000), F('if_yrs','f_term','yrs',20),
    F('if_ret','f_ifRet','%',7,{hint:'h_ifRet'}),
    {type:'sub', label:'s_ifOpts'},
    F('if_f1','f_ifF1','%',0.1), F('if_f2','f_ifF2','%',0.7), F('if_f3','f_ifF3','%',1.2)
  ],
  childallow: [
    F('ca_kids','f_caKids','',2,{wide:true}),
    SEL('ca_par','f_ksPar','1',[['1','o_ksPar1'],['0','o_ksPar0']],{wide:true})
  ],
  oldage: [
    SEL('oa_sex','f_sex','m',[['m','o_man'],['f','o_woman']]), F('oa_byear','f_oaBYear','',1959,{hint:'h_oaBYear'}),
    F('oa_yrs','f_oaYrs','yrs',35,{hint:'h_oaYrs'}),
    SEL('oa_sp','f_oaSp','0',[['0','o_no'],['1','o_yes']],{hint:'h_oaSp'}),
    F('oa_kids','f_oaKids','',0,{adv:'m_adv',hint:'h_oaKids'})
  ]
});
Object.assign(ICON, {
  workgrant: ic('<path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h9"/>'),
  reserve: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  pensfix: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M4 4l3 3"/>'),
  mmf: ic('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>'),
  invfees: ic('<path d="M4 19l5-6 4 3 7-9"/><path d="M4 5h6M4 9h3"/>'),
  childallow: ic('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21v-3a5 5 0 0 1 10 0v3M13 21v-2a4 4 0 0 1 8 0v2"/>'),
  oldage: ic('<circle cx="11" cy="5" r="2.5"/><path d="M11 8v6l-3 7M11 14l3 7M7 11h8M17 10v11"/>')
});
