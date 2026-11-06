/* 13.82: no personal AI keys any more. Visitors never enter a Gemini (or other) key: the key cards and fields are gone,
   a key saved on a device before is erased, and no key is kept anywhere for visitors.
   The app answers on the device, and can open an outside AI tool with the question ready – no account or key needed. */
(function(){
  const wipe = () => { let ch = false; ['gkey', 'gkOk', 'okey'].forEach(k => { if (SET[k] != null && SET[k] !== ''){ delete SET[k]; ch = true; } }); return ch; };
  try { if (wipe()) saveSet(); } catch (e) {}
  try { gkApprove = async function(){ return false; }; } catch (e) {}          // a key can no longer be saved (also not from the clipboard)
  try { gkPaste = async function(){ return false; }; } catch (e) {}
  const gS = gemKey;
  gemKey = function(){ return ''; };                                              // never a personal key
  const st = document.createElement('style');
  st.textContent = '#gk_card,#gk_wrap,#gk_inc,#as_kw,[data-gkgo]{display:none!important}';
  document.head.appendChild(st);
  try { gkGo = function(){ try { activate('settings'); } catch (e) {} }; } catch (e) {}
})();

/* the assistant's rules, sharpened: it explains the app's real results and never works out numbers of its own */
(function(){
  const r0 = aiRules;
  aiRules = function(){
    return r0.apply(this, arguments) + ' Every number you mention must come from the screen text above (inputs, results, notes) – never calculate, estimate or invent one; if a number the person needs is not there, say which calculator or field gives it. ' +
      'Point out inputs that look like mistakes (for example an interest rate above 30%, a term of 0, a negative amount, a split that does not add up to 100%). ' +
      'When the person weighs options, give short pros and cons and say plainly when they differ in risk or in access to the money. ' +
      'Say which figures are real data (marked with a date or source) and which are the person\'s assumptions. Offer one useful next simulation when it fits.';
  };
})();
