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
/* 13.77: where to put the money – one screen that compares a deposit, the stock market, paying off a loan and the current account */
DEFS.altcmp = [
  F('ac_lump','f_acLump','cur',100000,{wide:true}), F('ac_mon','f_acMon','cur',1000,{hint:'h_acMon'}), F('ac_yrs','f_acYrs','yrs',5), F('ac_cpi','f_dkCpi','%',2.5,{hint:'h_dkCpi'}),
  {type:'sub', label:'s_acDep'}, F('ac_depRate','f_acDepRate','%',4,{hint:'h_acDepRate'}),
  {type:'sub', label:'s_acMkt'}, F('ac_mktRet','f_acMktRet','%',6,{hint:'h_acMktRet'}), F('ac_mktFee','f_acMktFee','%',0.5),
  {type:'sub', label:'s_acLoan'}, F('ac_loanBal','f_acLoanBal','cur',0,{hint:'h_acLoanBal'}), F('ac_loanRate','f_acLoanRate','%',6), F('ac_loanFee','f_acLoanFee','cur',0)
];
ICON.altcmp = ic('<path d="M12 3v18"/><path d="M5 8l-3 6h6z"/><path d="M19 8l-3 6h6z"/><path d="M5 8h14"/><path d="M8 21h8"/>');
/* 13.79: my insurance policies – a list, like the loan offers */
DEFS.mypolicies = [{type:'html', id:'mp_box', cls:'lc-wrap'}];
ICON.mypolicies = ic('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12h6M9 15h4"/>');
/* 13.83: comparing properties, alerts in one place, my financial report */
DEFS.recmp = [{type:'html', id:'rcx_box', cls:'lc-wrap'}];
DEFS.alerts = [{type:'html', id:'al_box', cls:'al-wrap'}];
DEFS.myreport = [];
ICON.recmp = ic('<path d="M3 21V10l5-4 5 4v11"/><path d="M13 21V13l4-3 4 3v8"/><path d="M6 21v-5h4v5"/>');
ICON.alerts = ic('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>');
ICON.myreport = ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>');
/* 13.84: my financial picture, tax by years, the financial journal, kinds of report */
DEFS.fpic = [{type:'html', id:'fp_box', cls:'fp-wrap'}];
DEFS.taxyears = [{type:'html', id:'ty_box', cls:'lc-wrap'}];
DEFS.finjournal = [{type:'html', id:'jr_box', cls:'jr-wrap'}];
DEFS.myreport = [SEL('mr_type','f_mrType','full',['full','pic','mbud','ybud','nw','pf','pen','loans','goals','scn'].map(k => [k, 'o_mr_' + k]),{wide:true})];
ICON.fpic = ic('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/><path d="M12 12H3"/>');
ICON.taxyears = ic('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/><path d="M12.5 13h4M12.5 16h3"/>');
ICON.finjournal = ic('<path d="M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 8h7M8 12h7M8 16h4"/>');
