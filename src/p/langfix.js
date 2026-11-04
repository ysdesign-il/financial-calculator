/* 13.69: after a language change, the home cards ("your data will show up here", "my picture", reminders, documents waiting) are drawn
   again in the new language – before, they kept the language the app was opened in until something else redrew them. */
(function(){
  let first = true;
  const alHome = applyLang;
  applyLang = function(){
    const r = alHome.apply(this, arguments);
    if (first){ first = false; return r; }      /* the app's own first call at start-up: home is drawn right after it anyway */
    try { calcHome(); } catch (e) {}
    return r;
  };
})();
