/* 13.82: no personal AI keys any more. Visitors never enter a Gemini (or other) key: the key cards and fields are gone,
   a key saved on a device before is erased, and the only AI is the site's own, through the server (when the owner turns it on).
   Without it the app answers on the device (and can open an outside AI tool), as before. */
(function(){
  const wipe = () => { let ch = false; ['gkey', 'gkOk', 'okey'].forEach(k => { if (SET[k] != null && SET[k] !== ''){ delete SET[k]; ch = true; } }); return ch; };
  try { if (wipe()) saveSet(); } catch (e) {}
  try { gkApprove = async function(){ return false; }; } catch (e) {}          // a key can no longer be saved (also not from the clipboard)
  try { gkPaste = async function(){ return false; }; } catch (e) {}
  const gS = gemKey;
  gemKey = function(){ const k = gS(); return k === 'srv' ? k : ''; };          // only the site's server, never a personal key
  const st = document.createElement('style');
  st.textContent = '#gk_card,#gk_wrap,#gk_inc,#as_kw,[data-gkgo]{display:none!important}';
  document.head.appendChild(st);
  try { gkGo = function(){ try { activate('settings'); } catch (e) {} }; } catch (e) {}
})();
