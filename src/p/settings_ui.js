/* ================= settings panel ================= */
const LAST = {};
const ONOFF = [['1','o_on'],['0','o_off']];
const CUR_TABS = ['vat','loan','mortgage','compound','yield','dividends','capital'];
const NUMF = (id, label, unit, hint) => ({id, label, unit, val:'', wide:false, hint});
const PROFK = [['k0','f_k0'],['k12','f_k12'],['k3','f_k3'],['k45','f_k45'],['k617','f_k617'],['k18','f_k18']];
const SETDEFS = [
  ['set_look', [
    SEL('set_design','f_design','default',[['default','dz_default'],['orbit','dz_orbit'],['aurum','dz_aurum'],['pulse','dz_pulse'],['aurora','dz_aurora'],['mono','dz_mono'],['block','dz_block'],['emerald','dz_emerald'],['sunset','dz_sunset'],['edition','dz_edition'],['prism','dz_prism'],['titan','dz_titan'],['zen','dz_zen'],['clay','dz_clay']],{wide:true, hint:'h_design'}),
    SEL('set_theme','f_theme','system',[['system','o_th_sys'],['dark','sk_dark'],['light','sk_light'],['telaviv','sk_telaviv'],['jerusalem','sk_jerusalem'],['banknote','sk_banknote'],['deadsea','sk_deadsea'],['eilat','sk_eilat'],['terminal','sk_terminal'],['roshhashana','sk_roshhashana'],['hanukkah','sk_hanukkah'],['passover','sk_passover'],['christmas','sk_christmas'],['easter','sk_easter'],['newyear','sk_newyear'],['ramadan','sk_ramadan'],['eidfitr','sk_eidfitr'],['eidadha','sk_eidadha'],['yomkippur','sk_yomkippur'],['sukkot','sk_sukkot'],['simchattorah','sk_simchattorah'],['tubishvat','sk_tubishvat'],['purim','sk_purim'],['atzmaut','sk_atzmaut'],['lagbaomer','sk_lagbaomer'],['yomyerushalayim','sk_yomyerushalayim'],['shavuot','sk_shavuot'],['tubeav','sk_tubeav'],['advent','sk_advent'],['epiphany','sk_epiphany'],['valentine','sk_valentine'],['palmsunday','sk_palmsunday'],['ascension','sk_ascension'],['pentecost','sk_pentecost'],['assumption','sk_assumption'],['allsaints','sk_allsaints']],{wide:true, hint:'h_theme'}),
    SEL('set_holAuto','f_holAuto','all',[['0','o_off'],['all','o_holAll'],['jewish','o_holJ'],['christian','o_holC'],['muslim','o_holM']],{wide:true, hint:'h_holAuto'}),
    SEL('set_hfx','f_hfx','1',ONOFF,{wide:true, hint:'h_hfx'}),
    SEL('set_accent','f_accent','gold',[['gold','o_ac_gold'],['blue','o_ac_blue'],['green','o_ac_green'],['violet','o_ac_violet']]),
    SEL('set_size','f_size','m',[['s','o_sz_s'],['m','o_sz_m'],['l','o_sz_l']]),
    SEL('set_contrast','f_contrast','normal',[['normal','o_ct_normal'],['high','o_ct_high']]),
    SEL('set_motion','f_motion','full',[['full','o_mo_full'],['reduced','o_mo_reduced']]),
    SEL('set_font','f_font','default',[['default','o_fn_default'],['readable','o_fn_readable']]),
    SEL('set_sliders','f_sliders','1',ONOFF),
    SEL('set_sound','f_sound','soft',[['soft','o_snd_soft'],['full','o_snd_full'],['off','o_snd_off']],{wide:true, hint:'h_sound'}),
    SEL('set_tapSnd','f_tapSnd','0',[['0','o_off'],['1','o_on']])
  ]],
  ['set_lang', [
    SEL('set_lang','f_langSel','auto',[['auto','o_langDev']].concat(LANG_LIST.map(l => [l[0], '=' + l[1]])),{wide:true, hint:'h_langFallback'}),
    SEL('set_kbLang','f_kbLang','0',[['0','o_off'],['1','o_on']],{wide:true, hint:'h_kbLang'}),
    {id:'set_cur', label:'f_curSet', type:'cursel'},
    SEL('set_country','f_country','',[['','o_cNone'],['AD','=AD'],['AE','=AE'],['AF','=AF'],['AG','=AG'],['AI','=AI'],['AL','=AL'],['AM','=AM'],['AO','=AO'],['AQ','=AQ'],['AR','=AR'],['AS','=AS'],['AT','=AT'],['AU','=AU'],['AW','=AW'],['AX','=AX'],['AZ','=AZ'],['BA','=BA'],['BB','=BB'],['BD','=BD'],['BE','=BE'],['BF','=BF'],['BG','=BG'],['BH','=BH'],['BI','=BI'],['BJ','=BJ'],['BL','=BL'],['BM','=BM'],['BN','=BN'],['BO','=BO'],['BQ','=BQ'],['BR','=BR'],['BS','=BS'],['BT','=BT'],['BV','=BV'],['BW','=BW'],['BY','=BY'],['BZ','=BZ'],['CA','=CA'],['CC','=CC'],['CD','=CD'],['CF','=CF'],['CG','=CG'],['CH','=CH'],['CI','=CI'],['CK','=CK'],['CL','=CL'],['CM','=CM'],['CN','=CN'],['CO','=CO'],['CR','=CR'],['CU','=CU'],['CV','=CV'],['CW','=CW'],['CX','=CX'],['CY','=CY'],['CZ','=CZ'],['DE','=DE'],['DJ','=DJ'],['DK','=DK'],['DM','=DM'],['DO','=DO'],['DZ','=DZ'],['EC','=EC'],['EE','=EE'],['EG','=EG'],['EH','=EH'],['ER','=ER'],['ES','=ES'],['ET','=ET'],['FI','=FI'],['FJ','=FJ'],['FK','=FK'],['FM','=FM'],['FO','=FO'],['FR','=FR'],['GA','=GA'],['GB','=GB'],['GD','=GD'],['GE','=GE'],['GF','=GF'],['GG','=GG'],['GH','=GH'],['GI','=GI'],['GL','=GL'],['GM','=GM'],['GN','=GN'],['GP','=GP'],['GQ','=GQ'],['GR','=GR'],['GS','=GS'],['GT','=GT'],['GU','=GU'],['GW','=GW'],['GY','=GY'],['HK','=HK'],['HM','=HM'],['HN','=HN'],['HR','=HR'],['HT','=HT'],['HU','=HU'],['ID','=ID'],['IE','=IE'],['IL','=IL'],['IM','=IM'],['IN','=IN'],['IO','=IO'],['IQ','=IQ'],['IR','=IR'],['IS','=IS'],['IT','=IT'],['JE','=JE'],['JM','=JM'],['JO','=JO'],['JP','=JP'],['KE','=KE'],['KG','=KG'],['KH','=KH'],['KI','=KI'],['KM','=KM'],['KN','=KN'],['KP','=KP'],['KR','=KR'],['KW','=KW'],['KY','=KY'],['KZ','=KZ'],['LA','=LA'],['LB','=LB'],['LC','=LC'],['LI','=LI'],['LK','=LK'],['LR','=LR'],['LS','=LS'],['LT','=LT'],['LU','=LU'],['LV','=LV'],['LY','=LY'],['MA','=MA'],['MC','=MC'],['MD','=MD'],['ME','=ME'],['MF','=MF'],['MG','=MG'],['MH','=MH'],['MK','=MK'],['ML','=ML'],['MM','=MM'],['MN','=MN'],['MO','=MO'],['MP','=MP'],['MQ','=MQ'],['MR','=MR'],['MS','=MS'],['MT','=MT'],['MU','=MU'],['MV','=MV'],['MW','=MW'],['MX','=MX'],['MY','=MY'],['MZ','=MZ'],['NA','=NA'],['NC','=NC'],['NE','=NE'],['NF','=NF'],['NG','=NG'],['NI','=NI'],['NL','=NL'],['NO','=NO'],['NP','=NP'],['NR','=NR'],['NU','=NU'],['NZ','=NZ'],['OM','=OM'],['PA','=PA'],['PE','=PE'],['PF','=PF'],['PG','=PG'],['PH','=PH'],['PK','=PK'],['PL','=PL'],['PM','=PM'],['PN','=PN'],['PR','=PR'],['PS','=PS'],['PT','=PT'],['PW','=PW'],['PY','=PY'],['QA','=QA'],['RE','=RE'],['RO','=RO'],['RS','=RS'],['RU','=RU'],['RW','=RW'],['SA','=SA'],['SB','=SB'],['SC','=SC'],['SD','=SD'],['SE','=SE'],['SG','=SG'],['SH','=SH'],['SI','=SI'],['SJ','=SJ'],['SK','=SK'],['SL','=SL'],['SM','=SM'],['SN','=SN'],['SO','=SO'],['SR','=SR'],['SS','=SS'],['ST','=ST'],['SV','=SV'],['SX','=SX'],['SY','=SY'],['SZ','=SZ'],['TC','=TC'],['TD','=TD'],['TF','=TF'],['TG','=TG'],['TH','=TH'],['TJ','=TJ'],['TK','=TK'],['TL','=TL'],['TM','=TM'],['TN','=TN'],['TO','=TO'],['TR','=TR'],['TT','=TT'],['TV','=TV'],['TW','=TW'],['TZ','=TZ'],['UA','=UA'],['UG','=UG'],['US','=US'],['UY','=UY'],['UZ','=UZ'],['VA','=VA'],['VC','=VC'],['VE','=VE'],['VG','=VG'],['VI','=VI'],['VN','=VN'],['VU','=VU'],['WF','=WF'],['WS','=WS'],['XK','=XK'],['YE','=YE'],['YT','=YT'],['ZA','=ZA'],['ZM','=ZM'],['ZW','=ZW']],{wide:true, hint:'h_country'})
  ]],
  ['set_langX', [
    SEL('set_shareLang','f_shareLang','ui',[['ui','o_shUi'],['he','=עברית'],['ar','=العربية'],['en','=English']],{wide:true, hint:'h_shareLang'}),
    SEL('set_words','f_words','1',ONOFF,{wide:true, hint:'h_words'}),
    SEL('set_enTerms','f_enTerms','0',[['0','o_off'],['1','o_on']],{wide:true, hint:'h_enTerms'}),
    SEL('set_plain','f_plain','0',[['0','o_off'],['1','o_on']],{wide:true, hint:'h_plain'}),
    SEL('set_tts','f_tts','1',ONOFF,{wide:true, hint:'h_tts'}),
    SEL('set_voiceIn','f_voiceIn','0',[['0','o_off'],['1','o_on']],{wide:true, hint:'h_voiceIn'}),
    SEL('set_dfmt','f_dfmt','auto',[['auto','o_df_auto'],['dmy','o_df_dmy'],['mdy','o_df_mdy'],['ymd','o_df_ymd']]),
    SEL('set_wkStart','f_wkStart','auto',[['auto','o_wk_auto'],['sun','o_wk_sun'],['mon','o_wk_mon']],{hint:'h_wkStart'}),
    SEL('set_trFix','f_trFix','1',ONOFF,{wide:true, hint:'h_trFix'})
  ]],
  ['set_my', [
    {id:'set_myGross', label:'f_myGross', unit:'ils', val:'', wide:true, hint:'h_myGross'},
    {id:'set_myKids', label:'f_myKids', unit:'', val:'', hint:'h_myKids'},
    {id:'set_myBYear', label:'f_oaBYear', unit:'', val:''},
    {id:'set_myEq', label:'f_myEq', unit:'ils', val:'', wide:true, hint:'h_myEq'}
  ]],
  ['set_numbers', [
    SEL('set_digits','f_digits','latn',[['latn','o_dg_latn'],['native','o_dg_native']]),
    SEL('set_dec','f_dec','auto',[['auto','o_dec_auto'],['0','o_dec_0'],['2','o_dec_2']]),
    SEL('set_cpos','f_cpos','auto',[['auto','o_cp_auto'],['before','o_cp_before'],['after','o_cp_after']]),
    SEL('set_sep','f_sep','auto',[['auto','o_sp_auto'],['comma','o_sp_comma'],['dot','o_sp_dot'],['space','o_sp_space'],['apos','o_sp_apos'],['none','o_sp_none']],{hint:'h_sep'}),
    SEL('set_inGroup','f_inGroup','1',ONOFF,{wide:true, hint:'h_inGroup'}),
    SEL('set_compact','f_compact','0',[['0','o_off'],['1','o_on']],{wide:true})
  ]],
  ['set_calc', [
    SEL('set_start','f_start','home',[['home','o_start_home'],['last','o_start_last']].concat(TABS.filter(x => x !== 'home' && x !== 'settings').map(x => [x, 'tab_' + x])),{wide:true}),
    SEL('set_ptMode','f_ptMode','auto',[['auto','o_ptAuto'],['manual','o_ptManual']],{wide:true, hint:'h_ptMode'}),
    {id:'set_ptVal', label:'f_ptVal', unit:'ils', val:'', wide:true, hint:'h_ptVal'},
    SEL('set_saveMode','f_saveMode','auto',[['auto','o_saveAuto'],['manual','o_saveManual'],['none','o_saveNone']],{wide:true}),
    SEL('set_mktLive','f_mktLive','1',[['1','o_mktAuto'],['0','o_mktManual']],{wide:true, hint:'h_mktLive'}),
    SEL('set_mvAlert','f_mvAlert','1',[['1','o_on'],['0','o_off']],{wide:true, hint:'h_mvAlert'}),
    {id:'set_mvPct', label:'f_mvPct', unit:'%', val:2},
    SEL('set_vat','f_vatDef','18',[['18','o_vp18'],['17','o_vp17'],['0','o_vp0'],['16','o_vp16'],['14','o_vp14'],['15','o_vp15'],['5','o_vp5'],['19','o_vp19'],['20','o_vp20']],{wide:true}),
    SEL('set_dealer','f_dealer','murshe',[['murshe','o_murshe'],['patur','o_patur']],{wide:true}),
    SEL('set_buyer','f_buyerType','first',[['first','o_bt_first'],['upg','o_bt_upg'],['inv','o_bt_inv']],{wide:true}),
    SEL('set_capkind','f_capKind','sec',[['sec','o_ck_sec'],['sub','o_ck_sub'],['crypto','o_ck_crypto'],['div','o_ck_div'],['divsub','o_ck_divsub'],['int15','o_ck_int15'],['int25','o_ck_int25']],{wide:true}),
    SEL('set_dtax','f_taxPreset','25',[['25','o_tp25'],['30','o_tp30'],['15','o_tp15'],['0','o_tp0']]),
    SEL('set_deptime','f_depTime','end',[['end','o_endM'],['start','o_startM']]),
    NUMF('set_pens','f_pension','%'), NUMF('set_study','f_study','%'),
    NUMF('set_erPens','f_erPens','%'), NUMF('set_erSev','f_erSev','%'), NUMF('set_erStudy','f_erStudy','%'),
    NUMF('set_loanRate','f_loanRateDef','%'), NUMF('set_invRate','f_invRateDef','%'), NUMF('set_cpi','f_cpiDef','%'),
    NUMF('set_infl','f_infl','%'), NUMF('set_gainTax','f_taxGain','%')
  ]],
  ['set_profile', [
    SEL('set_sex','f_sexDef','m',[['m','o_man'],['f','o_woman']],{hint:'h_profile'}),
    SEL('set_p_single','f_single','0',yn), SEL('set_p_sold','f_sold','0',yn, {wide:true}),
    SEL('set_p_deg','f_deg','0',[[0,'o_degNone'],[1,'o_degBA'],[0.5,'o_degMA']],{wide:true})
  ].concat(PROFK.map(([k, l]) => ({id:'set_p_' + k, label:l, val:''}))).concat([{id:'set_p_res', label:'f_res', val:'', hint:'h_res'}, {id:'set_p_xp', label:'f_xp', val:''}])]
];
const PWREQ = `<ul class="pwreq" data-pw="%ID%"><li data-r="len" data-i="pw_len"></li><li data-r="up" data-i="pw_up"></li><li data-r="sp" data-i="pw_sp"></li></ul>`;
function anyAccount(){ try { for (let i = 0; i < RAWLS.length; i++){ if ((RAWLS.key(i) || '').indexOf('fin-acc:') === 0) return true; } } catch (e) {} return false; }
function signupLocalOpen(){ try { return RAWLS.getItem('fin-signup-open') === '1'; } catch (e) { return false; } }
function signupGlobalOpen(){ return typeof POL === 'undefined' || !POL || POL.open || (typeof PERM !== 'undefined' && PERM === 'owner'); }
function signupAllowed(){ if (!signupGlobalOpen()) return false; try { return !anyAccount() || signupLocalOpen(); } catch (e) { return true; } }
function accountHTML(){
  const msg = '<p class="fine acc-msg" id="acc_msg" role="alert" aria-live="polite"></p>';
  const pwf = (id, lab, ac) => `<div class="field wide"><label for="${id}" data-i="${lab}"></label><input id="${id}" type="password" autocomplete="${ac}" class="lookup"></div>`;
  if (FUSER) return `<p class="acc-who"><span data-i="l_loggedAs"></span> <b id="acc_name"></b></p>
    <div class="btnrow"><button type="button" class="gold-btn" id="mv_open" data-i="mv_tab"></button><button type="button" class="btn" id="acc_out" data-i="b_logout"></button></div>
    <details class="adv"><summary data-i="b_chgPw"></summary><div class="fields">${pwf('acc_cur','f_curPw','current-password')}${pwf('acc_new','f_newPw','new-password')}${pwf('acc_new2','f_newPw2','new-password')}</div>${PWREQ.replace('%ID%', 'acc_new')}
      <div class="btnrow"><button type="button" class="btn" id="acc_chg" data-i="b_chgPw"></button></div></details>
    <details class="adv rc-d" id="rc_d"><summary><span class="rc-sum"><span data-i="rc_title"></span><span class="rc-pill" id="rc_pill"></span></span></summary><div class="rc-box" id="rc_box"></div></details>
    <div class="field wide"><label for="acc_open" id="acc_open_l"></label><select id="acc_open"><option value="0" data-i="o_closed"></option><option value="1" data-i="o_open"></option></select><small class="hint" id="acc_open_h"></small></div>
    <div class="mvx" id="acc_f_mv" hidden></div>
    ${msg}<p class="fine" data-i="h_account"></p>
    <div class="acc-danger"><button type="button" class="btn danger del-open" id="del_open" aria-expanded="false" aria-controls="del_box">🗑️ <span data-i="del_btn"></span></button><div class="del-box" id="del_box" hidden></div></div>`;
  return `<div class="seg acc-seg" role="group"><button type="button" id="acc_tin" class="on" data-i="acc_signin"></button><button type="button" id="acc_tup" data-i="acc_signup"${signupAllowed() ? '' : ' hidden'}></button><button type="button" id="acc_tmv" data-i="mv_tab"${signupAllowed() ? '' : ' hidden'}></button></div>
    <div id="acc_f_in"><div class="field wide"><label for="acc_user" data-i="f_username"></label><input id="acc_user" type="text" maxlength="21" autocomplete="username" autocapitalize="none" spellcheck="false" dir="auto" class="lookup" placeholder="@"></div>
      ${pwf('acc_pass','f_password','current-password')}
      <div class="btnrow"><button type="button" class="btn" id="acc_in" data-i="b_login"></button></div>
      <button type="button" class="rc-link" id="rc_forgot" data-i="rc_forgot"></button></div>
    <div class="rc-box" id="acc_f_rc" hidden></div>
    <div id="acc_f_up" hidden><p class="acc-warn" role="note"><span aria-hidden="true">⚠️</span> <span data-i="acc_uniqWarn"></span></p><div class="field wide"><label for="acc_ruser" data-i="f_username"></label><input id="acc_ruser" type="text" maxlength="21" autocomplete="username" autocapitalize="none" spellcheck="false" dir="auto" class="lookup" placeholder="@"><small class="hint" data-i="hd_rules"></small><small class="hint hd-live" id="acc_hd"></small></div>
      ${pwf('acc_rpass','f_password','new-password')}${pwf('acc_rpass2','f_password2','new-password')}${PWREQ.replace('%ID%', 'acc_rpass')}
      <div class="btnrow"><button type="button" class="btn" id="acc_up" data-i="b_signup"></button></div></div>
    <div class="mvx" id="acc_f_mv" hidden></div>
    ${msg}<p class="fine" data-i="h_account"></p>`;
}
function settingsPanelHTML(){
  const sec = (k, body) => `<div class="set-sec" data-sk="${k}"><div class="sec-h">${sIcon(k)}<h3 class="sec-t" data-i="${k}"></h3></div>${body}</div>`;
  const fl = fs => `<div class="fields">${fs.map(fieldHTML).join('')}</div>`;
  const cb = CUR_TABS.map(id => `<div class="field"><label for="set_cb_${id}" data-i="tab_${id}"></label><select id="set_cb_${id}"></select></div>`).join('');
  return `<section class="panel panel-flat panel-set" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" hidden>
    <div class="perm" id="perm" role="status"><span class="perm-dot"></span><div><b id="perm_t"></b><small id="perm_s"></small></div></div>
    ${sec('set_account', accountHTML())}
    ${sec('set_security', '<div id="sec_box" class="sec-box"></div>')}
    ${sec('set_sync', '<div id="lv_box" class="lv-box" aria-live="polite"></div>')}
    ${sec('set_figs', '<div id="fg_box" class="fg-box"></div>')}
    ${SETDEFS.slice(0, 2).map(([k, fs]) => sec(k, (k === 'set_look' ? '<h4 class="skins-h dz-h" data-i="dz_gal"></h4><div class="dz-gal" id="dzGal" role="radiogroup" data-ia="f_design"></div><div class="skins" id="skins" role="radiogroup" data-ia="f_theme"></div>' : '') + fl(fs))).join('')}
    ${sec('set_clock', '<div class="cstyles" id="cstyles" role="radiogroup" data-ia="set_clock"></div><h4 class="ck-st-h" data-i="ck_studio"></h4><div class="ck-studio" id="ck_studio"></div><div class="fields">' + [
      SEL('set_clock24','f_clock24','1',[['1','o_24h'],['0','o_12h']]),
      SEL('set_clockSec','f_clockSec','0',[['1','o_on'],['0','o_off']]),
      SEL('set_clockHeb','f_clockHeb','1',[['1','o_on'],['0','o_off']],{hint:'h_clockHeb'}),
      SEL('set_clockHijri','f_clockHijri','0',[['1','o_on'],['0','o_off']])].map(fieldHTML).join('') + '</div>')}
    ${sec('set_langX', fl(SETDEFS.find(x => x[0] === 'set_langX')[1]))}
    ${sec('set_numbers', fl(SETDEFS.find(x => x[0] === 'set_numbers')[1]))}
    ${sec('set_my', fl(SETDEFS.find(x => x[0] === 'set_my')[1]))}
    ${sec('set_calc', fl(SETDEFS.find(x => x[0] === 'set_calc')[1]))}
    ${sec('set_profile', fl(SETDEFS.find(x => x[0] === 'set_profile')[1]))}
    ${sec('set_tabs', `<div class="fields">${fieldHTML(SEL('set_sort','f_sort','groups',[['groups','o_sortGroups'],['groupsAlpha','o_sortGroupsAlpha'],['alpha','o_sortAlpha']],{wide:true}))}</div><p class="fine" data-i="h_sort"></p><p class="fine" data-i="h_tabs"></p><div id="set_tabs" class="tabs-list"></div>`)}
    ${sec('set_curBy', `<div class="fields">${cb}</div>`)}
    ${sec('set_ai', `<div id="ai_sec"><div class="fields">${[
        SEL('set_aiEngine','f_aiWho','perplexity',[['perplexity','o_xPerplexity'],['chatgpt','o_xChatgpt'],['copilot','o_xCopilot'],['googleai','o_xGoogle'],['duck','o_xDuck'],['personal','o_xPersonal']],{wide:true, hint:'h_aiWho'}),
        SEL('set_aiNet','f_aiNet','1',[['1','o_on'],['0','o_off']],{wide:true, hint:'h_aiNet'}),
        SEL('set_pmStyle','f_pmStyle','short',[['short','o_pmShort'],['long','o_pmLong']])].map(fieldHTML).join('')}
      <div class="field"><label for="set_pmName" data-i="f_pmName"></label><input id="set_pmName" type="text" maxlength="24" autocomplete="off" class="lookup" dir="auto"></div></div>
      <div id="gk_wrap" hidden><div class="field wide"><label for="set_gkey" data-i="f_gkeyFree"></label><input id="set_gkey" type="password" autocomplete="off" spellcheck="false" class="lookup" dir="ltr" placeholder="AIza…"><small class="hint" data-i="h_gkeyFree"></small></div>
      <div class="btnrow"><button type="button" class="gold-btn" id="gk_ok" data-i="gk_ok"></button><button type="button" class="btn" id="gk_del" data-i="gk_del"></button></div>
      <p class="gk-st" id="gk_st" role="status" aria-live="polite"></p>
      <p class="fine"><a class="src-a" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"><span data-i="ln_gkey"></span> ↗</a></p></div></div>`)}
    ${sec('set_links', '<div id="ln_box" class="ln-box"></div>')}
    ${sec('set_src', '<div id="src_box" class="src-box"></div>')}
    ${sec('set_live', `<div class="conn-all"><button type="button" class="gold-btn" id="src_all" data-i="b_connAll"></button><p class="fine" data-i="h_connAll"></p></div>
      <div class="src-list" id="set_live_st"></div>
      <details class="adv-live"><summary data-i="m_advLive"></summary><div class="fields">${[
        SEL('set_fxInt','f_fxInt','1',[['1','o_fx1'],['5','o_fx5'],['15','o_fx15'],['30','o_fx30'],['60','o_fx60']]),
        SEL('set_liveFiat','f_liveFiat','1',[['1','o_on'],['0','o_off']]),
        SEL('set_liveCrypto','f_liveCrypto','1',[['1','o_on'],['0','o_off']]),
        SEL('set_autoRef','f_autoRef','5',[['0','o_off'],['1','o_ref1'],['5','o_ref5'],['15','o_ref15']],{hint:'h_autoRef'})
      ].map(fieldHTML).join('')}</div></details>
      <p class="fine" data-i="h_liveNoAcc"></p>`)}
    ${sec('set_upd', `<div class="upd-box"><div class="upd-row"><span data-i="upd_mine"></span> <b class="num" id="upd_cur" dir="ltr"></b></div>
      <p class="gk-st" id="upd_st" role="status" aria-live="polite"></p>
      <div class="btnrow"><button type="button" class="gold-btn" id="upd_chk" data-i="upd_chk"></button><button type="button" class="btn" id="upd_now" data-i="upd_go"></button></div>
      <div class="fields">${fieldHTML(SEL('set_autoUpd','f_autoUpd','1',[['1','o_on'],['0','o_off']],{wide:true}))}</div>
      <p class="fine" data-i="h_upd"></p></div>`)}
    ${sec('set_data', `<div class="field wide"><label for="set_json" data-i="f_export"></label><textarea id="set_json" class="lookup" rows="4" spellcheck="false"></textarea></div>
      <div class="btnrow"><button type="button" class="btn" id="set_export" data-i="b_export"></button><button type="button" class="btn" id="set_import" data-i="b_import"></button></div>
      <div class="btnrow"><button type="button" class="btn" id="set_resetcalcs" data-i="b_resetCalcs"></button><button type="button" class="btn" id="set_reset" data-i="b_reset"></button><button type="button" class="btn danger" id="set_clear" data-i="b_clearAll"></button></div>
      <p class="fine" id="set_msg" aria-live="polite"></p><p class="fine" id="set_info"></p>`)}
  </section>`;
}
const SMAP = {set_sound:'sound', set_tapSnd:'tapSnd', set_mvAlert:'mvAlert', set_mvPct:'mvPct', set_kbLang:'kbLang', set_design:'design', set_country:'country', set_hfx:'hfx', set_mktLive:'mktLive', set_inGroup:'inGroup', set_ptMode:'ptMode', set_ptVal:'ptVal', set_theme:'theme', set_size:'size', set_digits:'digits', set_dec:'dec', set_start:'start', set_vat:'vat', set_sex:'sex',
  set_accent:'accent', set_motion:'motion', set_contrast:'contrast', set_font:'font', set_sliders:'sliders', set_cpos:'cpos', set_sep:'sep',
  set_compact:'compact', set_fee:'fee', set_pens:'pens', set_study:'study', set_erPens:'erPens', set_erSev:'erSev', set_erStudy:'erStudy',
  set_loanRate:'loanRate', set_invRate:'invRate', set_cpi:'cpi', set_infl:'infl', set_gainTax:'gainTax', set_dealer:'dealer', set_buyer:'buyer',
  set_dtax:'dtax', set_deptime:'deptime', set_capkind:'capkind', set_remember:'remember', set_saveMode:'saveMode', set_aiNet:'aiNet', set_rateSrc:'rateSrc', set_gkey:'gkey', set_stale:'stale', set_sort:'sort', set_liveFx:'liveFx', set_fxInt:'fxInt', set_liveFiat:'liveFiat', set_liveCrypto:'liveCrypto', set_boiDb:'boiDb', set_autoRef:'autoRef', set_autoUpd:'autoUpd', set_holAuto:'holAuto', set_clock24:'clock24', set_clockSec:'clockSec', set_clockHeb:'clockHeb', set_clockHijri:'clockHijri', set_aiEngine:'aiEngine', set_pmName:'pmName', set_pmStyle:'pmStyle'};
Object.assign(SMAP, {set_myGross:'myGross', set_myKids:'myKids', set_myBYear:'myBYear', set_myEq:'myEq', set_shareLang:'shareLang', set_words:'words', set_enTerms:'enTerms', set_plain:'plain', set_tts:'tts', set_voiceIn:'voiceIn', set_dfmt:'dfmt', set_wkStart:'wkStart', set_trFix:'trFix'});
const DEFKEYS = ['vat','sex','fee','pens','study','erPens','erSev','erStudy','loanRate','invRate','cpi','infl','gainTax','dealer','buyer','dtax','deptime','capkind'];
function fillCB(){
  CUR_TABS.forEach(id => {
    const s = $('#set_cb_' + id); if (!s) return;
    s.innerHTML = `<option value="">${t('f_curDefault')}</option>` + curOptions((SET.curBy || {})[id] || '');
    s.value = (SET.curBy || {})[id] || '';
  });
  const f = $('#set_favCur');
  if (f){
    const keep = SET.favCur || [];
    f.innerHTML = Object.keys(RATES).sort().map(c => `<option value="${c}"${keep.includes(c) ? ' selected' : ''}>${c} – ${curName(c)}</option>`).join('');
  }
}
function syncSettingsUI(){
  const set = (id, val) => { const e = $('#' + id); if (e) e.value = val; };
  Object.keys(SMAP).forEach(id => set(id, SET[SMAP[id]]));
  set('set_lang', langAuto() ? 'auto' : lang); set('set_cur', baseCur || cur);
  set('set_p_single', SET.prof.single); set('set_p_sold', SET.prof.sold); set('set_p_deg', SET.prof.deg);
  PROFK.forEach(([k]) => set('set_p_' + k, SET.prof[k])); set('set_p_xp', SET.prof.xp); set('set_p_res', SET.prof.res == null ? '' : SET.prof.res);
  fillCB(); renderTabsList(); renderTiles(); renderBottom();
  if (typeof renderStamp === 'function') renderStamp();
  const an = $('#acc_name'); if (an){ an.textContent = '@' + FUSER; an.dir = 'ltr'; }
  const ao = $('#acc_open'); if (ao){ try { ao.value = RAWLS.getItem('fin-signup-open') === '1' ? '1' : '0'; } catch (e) {} if (typeof polSelRender === 'function') polSelRender(); }
  if (!FUSER && !signupAllowed()){ const m = $('#acc_msg'); if (m && !m.textContent) m.textContent = t('m_closed'); }
  const hu = $('#homeUser'); if (hu) hu.hidden = true;
  const hh = $('.home-hello');
  const nm = FUSER ? '@' + FUSER : '';
  if (hh && nm){ hh.removeAttribute('data-i'); hh.textContent = helloText(nm) + ' 👋'; }
  else if (hh){ hh.setAttribute('data-i', 'home_hello'); hh.textContent = t('home_hello'); }
  if ((SET.sort === 'alpha' || SET.sort === 'groupsAlpha') && typeof rebuildNav === 'function' && navEl) rebuildNav();
}
function syncRanges(){
  $$('.rng').forEach(r => { const n = $('#' + r.dataset.for); if (n){ r.value = n.value; rangeFill(r); } });
}
function applyDefaults(){
  const val = (ids, v) => { if (v === '' || v == null) return; ids.forEach(id => { const e = $('#' + id); if (e) e.value = v; }); };
  val(['x_fee'], SET.fee); val(['s_pension'], SET.pens); val(['s_study'], SET.study);
  val(['s_erPens'], SET.erPens); val(['s_erSev'], SET.erSev); val(['s_erStudy'], SET.erStudy);
  val(['l_rate'], SET.loanRate); val(['c_rate','y_rate'], SET.invRate); val(['l_cpi','m_cpi'], SET.cpi);
  val(['c_infl','y_infl'], SET.infl); val(['c_tax','y_tax'], SET.gainTax);
  val(['v_preset'], SET.vat); val(['e_dealer'], SET.dealer); val(['m_type'], SET.buyer); val(['d_taxP'], SET.dtax);
  val(['c_time'], SET.deptime); val(['cp_kind'], SET.capkind);
  ['s','e','t','r','q'].forEach(p => {
    val([p + '_sex'], SET.sex); val([p + '_single'], SET.prof.single); val([p + '_sold'], SET.prof.sold); val([p + '_deg'], SET.prof.deg);
    PROFK.forEach(([k]) => val([p + '_' + k], SET.prof[k])); val([p + '_xp'], SET.prof.xp); val([p + '_res'], SET.prof.res);
  });
  syncRanges();
}
function calcSettings(){
  $('#set_info').textContent = t('set_info', {d: dateStr()});
  if (typeof liveStRender === 'function') liveStRender();
  return null;
}
/* --- tabs list --- */
function renderTabsList(){
  const box = $('#set_tabs'); if (!box) return;
  normOrder();
  box.innerHTML = GROUPS.map(([gk, ids]) => {
    const sorted = ids.slice().sort((a, b) => SET.order.indexOf(a) - SET.order.indexOf(b));
    return `<div class="tl-g">${t(gk)}</div>` + sorted.map(id => {
      const fixed = NOHIDE.includes(id);
      return `<div class="trow" data-id="${id}"><span class="tn">${ICON[id] || ''}${t('tab_' + id)}</span>
        <label><input type="checkbox" data-act="vis"${isVisible(id) ? ' checked' : ''}${fixed ? ' disabled' : ''}> ${t('l_visible')}</label>
        <label><input type="checkbox" data-act="pin"${(SET.pins || []).includes(id) ? ' checked' : ''}${fixed ? ' disabled' : ''}> ${t('l_pin')}</label>
        <button type="button" class="mv" data-act="up" aria-label="${t('l_up')}">↑</button><button type="button" class="mv" data-act="down" aria-label="${t('l_down')}">↓</button></div>`;
    }).join('');
  }).join('');
}
function moveTab(id, dir){
  const g = GROUPS.find(x => x[1].includes(id)); if (!g) return;
  normOrder();
  const sorted = g[1].slice().sort((a, b) => SET.order.indexOf(a) - SET.order.indexOf(b));
  const i = sorted.indexOf(id), j = i + dir;
  if (j < 0 || j >= sorted.length) return;
  const a = SET.order.indexOf(sorted[i]), b = SET.order.indexOf(sorted[j]);
  [SET.order[a], SET.order[b]] = [SET.order[b], SET.order[a]];
}
function renderTiles(){
  const box = $('#tiles'); if (!box) return;
  const ids = viewGroups().flatMap(g => g[1]).filter(x => !NOHIDE.includes(x));
  const pins = (SET.pins || []).filter(x => ids.includes(x));
  const order = pins.concat(ids.filter(x => !pins.includes(x)));
  const tile = id => `<button type="button" class="tile${pins.includes(id) ? ' pinned' : ''}" data-go="${id}">${ICON[id]}<span>${t('tab_' + id)}</span></button>`;
  const head = k => `<h4 class="tiles-h">${t(k)}</h4>`;
  const all = viewGroups().filter(g => g[0] !== 'g_main');
  const chips = $('#tchips');
  if (!all.some(g => g[0] === TILE_F)) TILE_F = 'all';
  if (chips){
    chips.hidden = all.length < 2;
    chips.innerHTML = [['all', 'l_allCat']].concat(all.map(g => [g[0], 'gs_' + g[0].slice(2)])).map(([k, l]) =>
      `<button type="button" class="tchip${k === TILE_F ? ' on' : ''}" data-tf="${k}" aria-pressed="${k === TILE_F}">${t(l)}</button>`).join('');
  }
  if (TILE_F !== 'all'){
    const g = all.find(x => x[0] === TILE_F);
    box.innerHTML = g[1].filter(x => !NOHIDE.includes(x)).map(tile).join('');
    return;
  }
  const groups = all.map(([k, ids]) => [k, ids.filter(x => !pins.includes(x) && !NOHIDE.includes(x))]).filter(g => g[1].length);
  box.innerHTML = (pins.length ? head('l_pinned') + pins.map(tile).join('') : '') +
    groups.map(([k, ids]) => (groups.length > 1 || pins.length ? head(k) : '') + ids.map(tile).join('')).join('');
}
function renderBottom(){
  const el = $('#bottom'); if (!el) return;
  el.innerHTML = BOTTOM.filter(isVisible).map(id => `<button type="button" class="bt${id === tab ? ' on' : ''}" data-tab="${id}">${ICON[id]}<span>${t('tab_' + id)}</span></button>`).join('');
}
function markNav(){
  TABS.forEach(x => { const b = $('#tab-' + x); if (b){ b.setAttribute('aria-selected', x === tab ? 'true' : 'false'); b.tabIndex = x === tab ? 0 : -1; } });
  if (typeof navAcc === 'function') navAcc();
}
/* --- effective currency per calculator --- */
function applyEffCur(id){
  cur = effCur(id) || baseCur || 'ILS';
  $$('.u.cur').forEach(el => { el.textContent = symOf(cur); });
}
/* --- result export --- */
const strip = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.textContent.replace(/\s+/g, ' ').trim(); };
function resultRows(id){
  const r = LAST[id]; if (!r) return [];
  return [[strip(r.hero.label), strip(r.hero.value)]].concat(r.rows.map(x => [strip(x[0]), strip(x[1])]));
}
function copyText(txt){
  try { const p = navigator.clipboard.writeText(txt); if (p && p.catch) p.catch(() => legacyCopy(txt)); } catch(e) { legacyCopy(txt); }
}
function legacyCopy(txt){
  try { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch(e) {}
}
let toastT;
function toast(msg){
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.hidden = false; clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, 3200);
}
Object.assign(T, {st_fileSaved:['הקובץ נשמר','تم حفظ الملف','File saved']});
/* inside Claude a page may not download by itself: the viewer is asked to confirm the save. On the website a plain download works. */
async function fileSave(data, name, mime){
  if (window.claude && typeof window.claude.use === 'function'){
    try { const d = await window.claude.use('downloads'); if (!d) return 'fail'; await d.save({filename: name, data}); return 'saved'; }
    catch (e) { return e && e.code === 'declined' ? 'declined' : 'fail'; }
  }
  try {
    const url = URL.createObjectURL(new Blob([data], {type: mime}));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'saved';
  } catch (e) { return 'fail'; }
}
async function deliver(text, name, mime){
  const r = await fileSave(text, name, mime);
  if (r === 'saved') toast(t('st_fileSaved'));
  else if (r === 'fail'){ copyText(text); toast(t('st_copied')); }
}
function doAction(act, id){
  const rows = resultRows(id);
  if (act === 'copy'){ copyText($('#page-title').textContent + '\n' + rows.map(r => r.join(': ')).join('\n')); toast(t('st_copied')); }
  else if (act === 'print'){ try { window.print(); } catch(e) { toast('—'); } }
}
/* --- scenarios --- */
let SCN = {};
try { SCN = JSON.parse(localStorage.getItem('fin-scn') || '{}'); } catch(e) {}
const saveScn = () => { try { localStorage.setItem('fin-scn', JSON.stringify(SCN)); } catch(e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function panelVals(id){
  const o = {};
  $$('input[id],select[id]', $('#panel-' + id)).forEach(e => { if (e.type !== 'range' && !e.classList.contains('scn-name')) o[e.id] = e.value; });
  return o;
}
function setVals(vals){
  Object.keys(vals).forEach(k => { const e = $('#' + k); if (e && !(e.tagName === 'SELECT' && ![...e.options].some(o => o.value === vals[k]))) e.value = vals[k]; });
  syncRanges();
}
function renderScn(id){
  const box = $('#sc-' + id); if (!box) return;
  const list = SCN[id] || [];
  $('.scn-list', box).innerHTML = list.length ? list.map((s, i) =>
    `<div class="scn-row" data-i="${i}"><span class="scn-n">${esc(s.n)}</span><span class="scn-v num">${esc(s.hero.value)}</span>
     <button type="button" class="mv wide" data-sc="load">${t('b_scLoad')}</button><button type="button" class="mv wide" data-sc="del">${t('b_scDel')}</button></div>`).join('')
    : `<p class="fine">${t('sc_empty')}</p>`;
  const cmp = $('.scn-cmp', box);
  if (list.length > 1){
    const labels = []; list.forEach(s => s.rows.forEach(r => { if (!labels.includes(r[0])) labels.push(r[0]); }));
    cmp.innerHTML = `<table class="tbl"><thead><tr><th scope="col"></th>${list.map(s => `<th scope="col">${esc(s.n)}</th>`).join('')}</tr></thead><tbody>
      <tr><th scope="row">${t('sc_main')}</th>${list.map(s => `<td>${esc(s.hero.value)}</td>`).join('')}</tr>
      ${labels.map(l => `<tr><th scope="row">${esc(l)}</th>${list.map(s => { const r = s.rows.find(x => x[0] === l); return `<td>${r ? esc(r[1]) : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  } else cmp.innerHTML = '';
}
function saveScenario(id){
  const box = $('#sc-' + id), inp = $('.scn-name', box), r = LAST[id]; if (!r) return;
  const list = SCN[id] = SCN[id] || [];
  const n = inp.value.trim().slice(0, 40) || ('#' + (list.length + 1));
  list.push({n, vals: panelVals(id), hero: {label: strip(r.hero.label), value: strip(r.hero.value)}, rows: r.rows.map(x => [strip(x[0]), strip(x[1])]).slice(0, 16)});
  inp.value = ''; saveScn(); renderScn(id);
}
/* --- remembered values --- */
function saveVals(){
  if (SET.remember !== '1') return;
  const o = {};
  $$('#panels input[id],#panels select[id]').forEach(e => { if (e.type === 'range' || /^(set_|x_from|x_to)/.test(e.id) || e.classList.contains('scn-name')) return; o[e.id] = e.value; });
  o.__touched = TOUCHED.join(',');
  try { localStorage.setItem('fin-vals', JSON.stringify(o)); } catch(e) {}
}
function restoreVals(){
  if (SET.remember !== '1') return;
  try { const o = JSON.parse(localStorage.getItem('fin-vals') || '{}'); TOUCHED = String(o.__touched || '').split(',').filter(x => TABS.includes(x)); delete o.__touched; setVals(o); } catch(e) {}
}
function resetPanel(id){
  const p = $('#panel-' + id); if (!p) return;
  $$('input[id],select[id]', p).forEach(e => {
    if (e.type === 'range' || e.classList.contains('scn-name')) return;
    if (e.id === 'x_from') e.value = 'ILS'; else if (e.id === 'x_to') e.value = 'USD';
    else if (e.tagName === 'SELECT'){ const k = [...e.options].findIndex(o => o.defaultSelected); e.selectedIndex = k >= 0 ? k : 0; }
    else e.value = e.defaultValue;
  });
  applyDefaults();
}
function staleWarn(){
  return SET.stale !== '0' && (Date.now() / 1000 - META.unix) > (META.official ? 4 : 1) * 86400 ? [t('w_stale', {d: dateStr()})] : null;
}
