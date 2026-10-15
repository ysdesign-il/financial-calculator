/* 8.5: comparing insurance offers */
const INS_COS = ['harel','migdal','clal','phoenix','menora','ayalon','hachshara','direct','aig','shomera','libra','wesure','shlomo','passport','other'];
const INS_KINDS0 = ['life', 'mortlife', 'mortprop', 'health', 'critical', 'disability', 'ltc', 'accident', 'carcomp', 'car3rd', 'carmand', 'homestruct', 'homecontent', 'travel', 'dental', 'pet', 'business'];
Object.assign(DEFS, {
  insurance: [
    SEL('ins_kind','f_insKind','life',INS_KINDS0.map(k => [k, 'o_ins_' + k]),{wide:true, hint:'h_insKind'}),
    F('ins_years','f_insYears','yrs',10,{hint:'h_insYears'}),
    SEL('ins_by','f_insBy','total',[['total','o_insByTotal'],['cover','o_insByCover']],{wide:true}),
    F('ins_claims','f_insClaims','',0,{hint:'h_insClaims'}),
    {type:'html', id:'ins_box', cls:'lc-wrap ins-wrap'},
    F('ins_idx','f_insIdx','%',0,{adv:'m_adv', hint:'h_insIdx'})
  ]
});
Object.assign(ICON, {insurance: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>')});
