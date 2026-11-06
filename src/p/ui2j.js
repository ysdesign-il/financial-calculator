/* ---- 13.74: deposits (all kinds) and comparing deposit offers — fields and icons (the engine is p/dep.js) ---- */
Object.assign(DEFS, {
  deposit: [
    SEL('dk_kind','f_dkKind','fix',[['fix','o_dkFix'],['var','o_dkVar'],['cpi','o_dkCpi'],['fx','o_dkFx'],['exit','o_dkExit'],['call','o_dkCall'],['struct','o_dkStruct']],{wide:true, hint:'h_dkKind'}),
    F('dk_amt','f_dkAmt','cur',100000,{wide:true}),
    F('dk_add','f_dkAdd','cur',0,{hint:'h_dkAdd', when:['dk_kind','fix|var|cpi|fx|exit|call']}),
    F('dk_mo','f_dkMo','mo',12),
    SEL('dk_cycle','f_dkCycle','day',[['day','o_dkDay'],['week','o_dkWeek'],['month','o_dkMonth']],{when:['dk_kind','call']}),
    F('dk_rate','f_dkRate','%',4,{hint:'h_dkRate', when:['dk_kind','fix|var|cpi|fx|exit|call']}),
    SEL('dk_comp','f_dkComp','end',[['end','o_dkcEnd'],['day','o_dkcDay'],['month','o_dkcMonth'],['quarter','o_dkcQ'],['year','o_dkcYear']],{wide:true, hint:'h_dkComp', when:['dk_kind','fix|var|cpi|fx|exit']}),
    F('dk_chg','f_dkChg','%',0,{hint:'h_dkChg', when:['dk_kind','var']}),
    F('dk_fx','f_dkFx','%',0,{hint:'h_dkFx', when:['dk_kind','fx']}),
    F('dk_every','f_dkEvery','mo',3,{when:['dk_kind','exit']}),
    F('dk_exit','f_dkExit','mo',0,{hint:'h_dkExit', when:['dk_kind','exit']}),
    F('dk_cut','f_dkCut','%',0,{hint:'h_dkCut', when:['dk_kind','exit']}),
    F('dk_smin','f_dkSmin','%',0,{hint:'h_dkStruct', when:['dk_kind','struct']}),
    F('dk_spart','f_dkSpart','%',50,{when:['dk_kind','struct']}),
    F('dk_sidx','f_dkSidx','%',5,{when:['dk_kind','struct']}),
    F('dk_scap','f_dkScap','%',20,{when:['dk_kind','struct']}),
    F('dk_cpi','f_dkCpi','%',2.5,{hint:'h_dkCpi'}),
    SEL('dk_tax','f_dkTax','auto',[['auto','o_dktAuto'],['none','o_dktNone'],['custom','o_dktCustom']],{adv:'m_adv'}),
    F('dk_taxp','f_dkTaxP','%',15,{adv:'m_adv', when:['dk_tax','custom']})
  ],
  depcmp: [
    F('dq_amt','f_dqAmt','cur',100000,{wide:true}),
    F('dq_cpi','f_dkCpi','%',2.5,{hint:'h_dkCpi'}),
    F('dq_chg','f_dkChg','%',0,{hint:'h_dkChg'}),
    F('dq_fx','f_dkFx','%',0,{hint:'h_dkFx'}),
    {type:'html', id:'dq_box', cls:'lc-wrap'}
  ]
});
Object.assign(ICON, {
  deposit: ic('<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 11h18"/><path d="M12 3v6M9.5 5.5L12 3l2.5 2.5"/>'),
  depcmp: ic('<rect x="3" y="9" width="7" height="10" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/><path d="M5.5 13h2M16.5 9h2"/>')
});
/* 13.75: the loan – full or partial grace, a partial balloon, and a table by month (added after "grace") */
(function(){
  const L = DEFS.loan, i = L.findIndex(f => f && f.id === 'l_grace');
  const add = [
    SEL('l_graceType','f_lGraceType','int',[['int','o_lgInt'],['full','o_lgFull']],{adv:'m_adv', hint:'h_lGraceType'}),
    F('l_balloon','f_lBalloon','%',0,{adv:'m_adv', hint:'h_lBalloon'}),
    SEL('l_tbl','f_lTbl','year',[['year','o_ltYear'],['month','o_ltMonth']],{adv:'m_adv'})
  ];
  if (i >= 0) L.splice(i + 1, 0, ...add); else L.push(...add);
})();
/* 13.76: investments – the scenario gap on "compound interest", and the investment channels by risk */
DEFS.compound.push({id:'c_spread', label:'f_cSpread', unit:'%', val:2, adv:'m_adv', hint:'h_cSpread'});
DEFS.invrisk = [
  {type:'sub', label:'s_irMix'},
  F('ir_tbill','ir_n_tbill','%',0), F('ir_gov','ir_n_gov','%',30), F('ir_corp','ir_n_corp','%',0), F('ir_mmf','ir_n_mmf','%',10),
  F('ir_mutual','ir_n_mutual','%',0), F('ir_etf','ir_n_etf','%',0), F('ir_index','ir_n_index','%',60), F('ir_stock','ir_n_stock','%',0),
  F('ir_re','ir_n_re','%',0), F('ir_gold','ir_n_gold','%',0), F('ir_fx','ir_n_fx','%',0), F('ir_crypto','ir_n_crypto','%',0), F('ir_alt','ir_n_alt','%',0)
];
ICON.invrisk = ic('<path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/><circle cx="18" cy="7" r="1.5"/><path d="M4 4v16"/>');
