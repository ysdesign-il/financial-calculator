/* ---- 13.88: the stock market and crypto – fields and icons (the engines are in p/fin14.js) ---- */
const MK_CUR = [['ILS', 'o_cILS'], ['USD', 'o_cUSD'], ['EUR', 'o_cEUR'], ['GBP', 'o_cGBP']];
Object.assign(DEFS, {
  trade: [
    SEL('tq_kind', 'f_tqKind', 'stock', [['stock', 'o_tqStock'], ['crypto', 'o_tqCrypto']], {wide: true}),
    SEL('tq_state', 'f_tqState', 'sold', [['sold', 'o_tqSold'], ['hold', 'o_tqHold']], {wide: true, hint: 'h_tqState'}),
    F('tq_buy', 'f_tqBuy', '', 120), F('tq_sell', 'f_tqSell', '', 165), F('tq_qty', 'f_tqQty', '', 50),
    SEL('tq_cur', 'f_tqCur', 'USD', MK_CUR),
    F('tq_fx0', 'f_tqFx0', '', 3.7, {when: ['tq_cur', 'USD|EUR|GBP']}), F('tq_fx1', 'f_tqFx1', '', 3.62, {when: ['tq_cur', 'USD|EUR|GBP'], hint: 'h_tqFx1'}),
    F('tq_feeP', 'f_tqFeeP', '%', 0.1), F('tq_feeMin', 'f_tqFeeMin', '', 5, {hint: 'h_tqFeeMin'}),
    F('tq_div', 'f_tqDiv', '', 180, {when: ['tq_kind', 'stock'], hint: 'h_tqDiv'}),
    F('tq_months', 'f_tqMonths', 'mo', 27), F('tq_cpi', 'f_tqCpi', '%', 5.8, {hint: 'h_tqCpi'}),
    F('tq_loss', 'f_lossCf', 'ils', 0, {adv: 'm_adv'}), F('tq_other', 'f_otherInc', 'ils', 0, {adv: 'm_adv'}), F('tq_drop', 'f_tqDrop', '%', 30, {adv: 'm_adv'})
  ],
  holdsell: [
    F('hz_val', 'f_hzVal', 'cur', 100000, {wide: true}), F('hz_cost', 'f_hzCost', 'cur', 80000, {hint: 'h_hzCost'}),
    F('hz_exp', 'f_hzExp', '%', 6, {hint: 'h_hzExp'}), F('hz_alt', 'f_hzAlt', '%', 6, {hint: 'h_hzAlt'}), F('hz_years', 'f_years', 'yrs', 5),
    F('hz_feeS', 'f_hzFeeS', '%', 0.1), F('hz_feeB', 'f_hzFeeB', '%', 0.1),
    F('hz_gains', 'f_hzGains', 'cur', 0, {hint: 'h_hzGains'}), F('hz_tax', 'f_hzTax', '%', 25, {adv: 'm_adv'})
  ],
  taxloss: [F('tl_gains', 'f_tlGains', 'cur', 20000, {wide: true, hint: 'h_tlGains'}), F('tl_lossCf', 'f_lossCf', 'cur', 0), F('tl_tax', 'f_hzTax', '%', 25, {adv: 'm_adv'}), {type: 'html', id: 'tl_box', cls: 'lc-wrap'}],
  stockcmp: [{type: 'html', id: 'sq_box', cls: 'lc-wrap'}],
  exchanges: [{type: 'html', id: 'xb_box', cls: 'lc-wrap'}],
  pricealert: [{type: 'html', id: 'pal_box', cls: 'lc-wrap'}],
  options: [
    SEL('op_type', 'f_opType', 'call', [['call', 'o_opCall'], ['put', 'o_opPut']]), SEL('op_side', 'f_opSide', 'buy', [['buy', 'o_opBuy'], ['sell', 'o_opSell']]),
    F('op_s', 'f_opS', '', 100, {hint: 'h_opS'}), F('op_k', 'f_opK', '', 105), F('op_prem', 'f_opPrem', '', 3, {hint: 'h_opPrem'}),
    F('op_n', 'f_opN', '', 1), F('op_mult', 'f_opMult', '', 100, {hint: 'h_opMult'}), F('op_days', 'f_opDays', '', 30),
    F('op_iv', 'f_opIv', '%', 30, {adv: 'm_adv', hint: 'h_opIv'}), F('op_r', 'f_opR', '%', 4, {adv: 'm_adv'}), F('op_fee', 'f_opFee', '', 1, {adv: 'm_adv'}),
    {type: 'html', id: 'op_box', cls: 'op-wrap'}
  ],
  leverage: [
    SEL('lm_kind', 'f_lmKind', 'margin', [['margin', 'o_lmMargin'], ['futures', 'o_lmFut']], {wide: true}),
    SEL('lm_side', 'f_lmSide', 'long', [['long', 'o_lmLong'], ['short', 'o_lmShort']]),
    F('lm_own', 'f_lmOwn', 'cur', 10000), F('lm_lev', 'f_lmLev', '', 3, {hint: 'h_lmLev'}), F('lm_move', 'f_lmMove', '%', -10, {hint: 'h_lmMove'}), F('lm_days', 'f_lmDays', '', 30),
    F('lm_rate', 'f_lmRate', '%', 8, {when: ['lm_kind', 'margin'], hint: 'h_lmRate'}), F('lm_fund', 'f_lmFund', '%', 0.01, {when: ['lm_kind', 'futures'], hint: 'h_lmFund'}),
    F('lm_mm', 'f_lmMm', '%', 25, {hint: 'h_lmMm'}), F('lm_fee', 'f_lmFee', '%', 0.1, {adv: 'm_adv'})
  ],
  position: [
    SEL('pz_side', 'f_lmSide', 'long', [['long', 'o_lmLong'], ['short', 'o_lmShort']]),
    F('pz_acct', 'f_pzAcct', 'cur', 100000, {wide: true}), F('pz_risk', 'f_pzRisk', '%', 1, {hint: 'h_pzRisk'}),
    F('pz_entry', 'f_pzEntry', '', 50), F('pz_stop', 'f_pzStop', '', 46, {hint: 'h_pzStop'}), F('pz_target', 'f_pzTarget', '', 62), F('pz_fee', 'f_lmFee', '%', 0.1, {adv: 'm_adv'})
  ],
  rebalance: [F('rbl_add', 'f_rblAdd', 'cur', 0, {wide: true, hint: 'h_rblAdd'}), SEL('rbl_mode', 'f_rblMode', 'full', [['full', 'o_rblFull'], ['new', 'o_rblNew']], {wide: true}), F('rbl_fee', 'f_lmFee', '%', 0.1, {adv: 'm_adv'}), F('rbl_tax', 'f_hzTax', '%', 25, {adv: 'm_adv'}), {type: 'html', id: 'rbl_box', cls: 'lc-wrap'}],
  crashtest: [
    SEL('cr_scn', 'f_crScn', 'severe', [['mild', 'o_crMild'], ['severe', 'o_crSevere'], ['crash', 'o_crCrash'], ['custom', 'o_crCustom']], {wide: true}),
    {type: 'sub', label: 's_crHave'},
    F('cr_stocks', 'f_crStocks', 'cur', 60000, {hint: 'h_crFill'}), F('cr_bonds', 'f_crBonds', 'cur', 30000), F('cr_crypto', 'f_crCrypto', 'cur', 5000), F('cr_cash', 'f_crCash', 'cur', 5000),
    {type: 'sub', label: 's_crDrop', when: ['cr_scn', 'custom']},
    F('cr_dS', 'f_crDS', '%', -25, {when: ['cr_scn', 'custom']}), F('cr_dB', 'f_crDB', '%', -5, {when: ['cr_scn', 'custom']}), F('cr_dC', 'f_crDC', '%', -60, {when: ['cr_scn', 'custom']}),
    F('cr_ret', 'f_crRet', '%', 7, {hint: 'h_crRet'})
  ],
  dcalump: [F('dl_amt', 'f_dlAmt', 'cur', 120000, {wide: true}), F('dl_months', 'f_dlMonths', 'mo', 12, {hint: 'h_dlMonths'}), F('dl_ret', 'f_dlRet', '%', 7), F('dl_vol', 'f_dlVol', '%', 18, {hint: 'h_dlVol'}), F('dl_years', 'f_years', 'yrs', 10)],
  staking: [
    F('sx_coins', 'f_sxCoins', '', 10, {wide: true}), F('sx_rate', 'f_sxRate', '%', 4), SEL('sx_rtype', 'f_sxRtype', 'apr', [['apr', 'o_sxApr'], ['apy', 'o_sxApy']], {hint: 'h_sxRtype'}),
    SEL('sx_comp', 'f_sxComp', '365', [['365', 'o_dkcDay'], ['52', 'o_sxWeek'], ['12', 'o_dkcMonth'], ['1', 'o_dkcYear']], {when: ['sx_rtype', 'apr']}),
    F('sx_years', 'f_years', 'yrs', 3), F('sx_px', 'f_sxPx', 'cur', 11500, {hint: 'h_sxPx'}),
    F('sx_lo', 'f_sxLo', '%', -20), F('sx_hi', 'f_sxHi', '%', 40), F('sx_fee', 'f_sxFee', '%', 0, {adv: 'm_adv', hint: 'h_sxFee'}), F('sx_tax', 'f_sxTax', '%', 0, {adv: 'm_adv', hint: 'h_sxTax'})
  ],
  cryptocost: [
    F('kq_amt', 'f_kqAmt', 'cur', 1000, {wide: true}), F('kq_fee', 'f_kqFee', '%', 1.5), F('kq_spread', 'f_kqSpread', '%', 1, {hint: 'h_kqSpread'}), F('kq_fx', 'f_kqFx', '%', 0.5, {hint: 'h_kqFx'}),
    F('kq_card', 'f_kqCard', '%', 0), F('kq_wd', 'f_kqWd', 'cur', 0, {hint: 'h_kqWd'}), F('kq_n', 'f_kqN', '', 12, {hint: 'h_kqN'}), F('kq_sell', 'f_kqSell', '%', 1.5)
  ]
});
Object.assign(ICON, {
  trade: ic('<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/><path d="M4 21h16"/>'),
  holdsell: ic('<path d="M7 4v16M7 4l-3 3M7 4l3 3"/><path d="M17 20V4M17 20l-3-3M17 20l3-3"/>'),
  taxloss: ic('<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  stockcmp: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  exchanges: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  pricealert: ic('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M9 11l2 2 4-4"/>'),
  options: ic('<path d="M3 17h7l4-10h7"/><path d="M14 17h7"/><circle cx="10" cy="17" r="1.5"/>'),
  leverage: ic('<path d="M3 20h18"/><path d="M5 20l7-12 7 12"/><path d="M2 8h20"/><circle cx="12" cy="8" r="2"/>'),
  position: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  rebalance: ic('<path d="M12 3v18M5 7h14"/><path d="M5 7l-3 7h6zM19 7l-3 7h6z"/>'),
  crashtest: ic('<path d="M3 5l6 6 4-3 8 10"/><path d="M15 18h6v-6"/>'),
  dcalump: ic('<rect x="3" y="14" width="3" height="6" rx="1"/><rect x="8" y="11" width="3" height="9" rx="1"/><rect x="13" y="8" width="3" height="12" rx="1"/><rect x="18" y="4" width="3" height="16" rx="1"/>'),
  staking: ic('<circle cx="12" cy="12" r="8"/><path d="M9.5 9h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4M12 7v2M12 15v2"/>'),
  cryptocost: ic('<path d="M4 7h16v12H4z"/><path d="M4 11h16"/><path d="M8 15h3"/>')
});
