/* 8.9: mortgage and pension comparisons */
Object.assign(DEFS, {
  mortcmp: [
    F('mc_amt','f_mcAmt','cur',1200000,{wide:true}),
    F('mc_cpi','f_mCpi','%',2.5,{hint:'h_mcCpi'}),
    {type:'html', id:'mc_box', cls:'lc-wrap mc-wrap'}
  ],
  pencmp: [
    SEL('pc_kind','f_pcKind','pension',[['pension','o_pc_pension'],['gemel','o_pc_gemel'],['hish','o_pc_hish'],['invg','o_pc_invg'],['policy','o_pc_policy']],{wide:true}),
    F('pc_bal','f_mfBal','cur',150000), F('pc_dep','f_mfDep','cur',2000), F('pc_yrs','f_term','yrs',25), F('pc_ret','f_mfRet','%',5,{hint:'h_pcRet'}),
    {type:'html', id:'pc_box', cls:'lc-wrap pc-wrap'}
  ]
});
Object.assign(ICON, {
  mortcmp: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/><path d="M17 4v3"/>'),
  pencmp: ic('<path d="M4 20V10M10 20V6M16 20v-8M21 20H3"/><path d="M14 4l3 3 3-3"/>')
});
