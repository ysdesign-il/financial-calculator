/* 8.5: comparing insurance offers */
const INS_KINDS0 = ['life', 'mortlife', 'mortprop', 'health', 'critical', 'disability', 'ltc', 'accident', 'carcomp', 'car3rd', 'carmand', 'homestruct', 'homecontent', 'travel', 'dental', 'pet', 'business'];
Object.assign(DEFS, {
  insurance: [
    SEL('ins_kind','f_insKind','life',INS_KINDS0.map(k => [k, 'o_ins_' + k]),{wide:true, hint:'h_insKind'}),
    SEL('ins_n','f_insN','2',[['2','=2'],['3','=3'],['4','=4']]),
    F('ins_years','f_insYears','yrs',10,{hint:'h_insYears'}),
    SEL('ins_by','f_insBy','total',[['total','o_insByTotal'],['cover','o_insByCover']],{wide:true}),
    F('ins_claims','f_insClaims','',0,{hint:'h_insClaims'}),
    F('ins_idx','f_insIdx','%',0,{adv:'m_adv', hint:'h_insIdx'}),
    ...['a','b','c','d'].flatMap((k, i) => {
      const w = i < 2 ? {} : {when: ['ins_n', i === 2 ? '3|4' : '4']};
      return [
        F('ins_p' + k, 'f_insP_' + k, 'cur', [180, 165, 200, 150][i], Object.assign({hint: i ? undefined : 'h_insP'}, w)),
        F('ins_g' + k, 'f_insG_' + k, '%', [0, 4, 0, 5][i], Object.assign({hint: i ? undefined : 'h_insG'}, w)),
        F('ins_d' + k, 'f_insD_' + k, 'cur', [0, 0, 0, 0][i], Object.assign({hint: i ? undefined : 'h_insD'}, w)),
        F('ins_c' + k, 'f_insC_' + k, 'cur', [1000000, 1000000, 1000000, 1000000][i], Object.assign({hint: i ? undefined : 'h_insC'}, w)),
        F('ins_x' + k, 'f_insX_' + k, '%', 0, Object.assign({adv: 'm_adv', hint: i ? undefined : 'h_insX'}, w)),
        F('ins_xy' + k, 'f_insXY_' + k, 'yrs', 0, Object.assign({adv: 'm_adv'}, w)),
        F('ins_e' + k, 'f_insE_' + k, 'cur', 0, Object.assign({adv: 'm_adv', hint: i ? undefined : 'h_insE'}, w))
      ];
    })
  ]
});
Object.assign(ICON, {insurance: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>')});
