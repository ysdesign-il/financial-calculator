/* 13.73 (security, stage 0 of the upgrade):
   1. Developer code from GitHub may change only the look (CSS) – it can no longer run scripts on everyone's device.
      A script that reaches everyone could read people's data if the GitHub account were ever taken over; real changes go
      through the normal build, with its checks. A draft can still be tried on the owner's own device in developer mode.
   2. The security alerts are no longer a public file of the website: developer mode reads them through the locked admin
      version, with its sign-in cookie. */
(function(){
  const dcRun0 = dcRun;
  dcRun = function(code){
    if (!code) return dcRun0.call(this, code);
    let mine = false; try { mine = typeof DEV_ON !== 'undefined' && DEV_ON && RAWLS.getItem('fin-devcode-preview') === '1' && code === dcDraft(); } catch (e) {}
    return dcRun0.call(this, mine ? code : {css: code.css || '', js: '', at: code.at});
  };
  secLoad = async function(){
    if (typeof DEV_ON === 'undefined' || !DEV_ON) return;
    try {
      const adm = typeof ADMIN_V !== 'undefined' && ADMIN_V && !(typeof IN_CLAUDE !== 'undefined' && IN_CLAUDE);
      if (!adm) return;
      const r = await fetch('/admin/security.json?t=' + Date.now(), {cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer'});
      if (!r.ok) return;
      const d = await r.json(); SEC.list = Array.isArray(d && d.alerts) ? d.alerts : []; SEC.at = Date.now(); secRender();
    } catch (e) {}
  };
})();
