/* ---- settings icons (24px, stroke style) ---- */
const SICO = {
  set_links:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  set_src:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/><path d="M8.5 11h5M11 8.5v5"/>',
  set_sync:'<path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  set_figs:'<path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 5-6"/><circle cx="19" cy="7" r="1.2"/>',
  set_account:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  set_look:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  set_lang:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  set_numbers:'<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  set_calc:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  set_profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  set_tabs:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  set_curBy:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  set_fx:'<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/>',
  set_data:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3 3 7 3s7-1.3 7-3"/>',
  set_design:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="16" cy="8.5" r="1.5"/>',
  set_hfx:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="2.5"/>',
  set_theme:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  set_accent:'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  set_size:'<path d="M4 19l5-13 5 13M6 14h6M16 19h5M18.5 12v7"/>',
  set_contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  set_motion:'<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>',
  set_font:'<path d="M5 19L10 6l5 13M7 14h6M18 8v11"/>',
  set_sliders:'<path d="M4 12h16"/><circle cx="9" cy="12" r="3" fill="currentColor"/>',
  set_langSel:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  set_lang_:'',
  set_cur:'<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5C14 8.5 13 8 12 8c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8m0 8v1.5"/>',
  set_digits:'<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  set_dec:'<circle cx="7" cy="17" r="1.3" fill="currentColor"/><path d="M12 6h5v12h-5z"/>',
  set_cpos:'<path d="M4 8h16M4 16h16M8 12h8"/>',
  set_sep:'<path d="M6 18c2 0 2-2 2-3M12 6v6M16 18h2"/>',
  set_compact:'<path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"/>',
  set_start:'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  set_saveMode:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  set_remember:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  set_vat:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 9h6M9 13h4"/>',
  set_dealer:'<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  set_buyer:'<path d="M4 20V9l7-5 7 5v11M9 20v-5h4v5"/>',
  set_capkind:'<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>',
  set_dtax:'<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  set_deptime:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  set_sex:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  set_p_single:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  set_p_sold:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  set_p_deg:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5"/>',
  set_live:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  set_liveFx:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  set_fxInt:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  set_liveFiat:'<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
  set_liveCrypto:'<path d="M9 6h5a3 3 0 0 1 0 6H9zM9 12h6a3 3 0 0 1 0 6H9zM9 4v16M12 4v2M12 18v2"/>',
  set_boiDb:'<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  set_autoRef:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  set_sort:'<path d="M4 7h16M4 12h10M4 17h6"/>',
  set_gkey:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  set_rateSrc:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  set_stale:'<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4.5L3 18a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z"/>',
  set_favCur:'<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.7z"/>',
  set_tune:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'
};
const sIcon = k => SICO[k] ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${SICO[k]}</svg>` : '';
SICO.set_p_res = '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>';
SICO.set_links = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
SICO.set_handle = '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>';
SICO.set_ai = '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/>';
SICO.set_gkey = SICO.set_gkey || '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>';
SICO.set_upd = '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>';
SICO.set_clock = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';

SICO.set_security = '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>';
