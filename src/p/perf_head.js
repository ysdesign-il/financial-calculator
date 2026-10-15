/* 8.3: one shared cache for date and number formatters — building one is slow, and the clock, the market board and
   every number on screen asked for a new one each time */
(function(){
  const wrap = (C) => {
    if (!C || C.__cached) return C;
    const cache = new Map();
    const F = function(loc, opt){
      let k; try { k = JSON.stringify([loc == null ? null : loc, opt == null ? null : opt]); } catch (e) { return new C(loc, opt); }
      let f = cache.get(k); if (!f){ f = new C(loc, opt); if (cache.size > 400) cache.clear(); cache.set(k, f); }
      return f;
    };
    F.prototype = C.prototype; F.supportedLocalesOf = C.supportedLocalesOf.bind(C); F.__cached = true;
    return F;
  };
  try { Intl.DateTimeFormat = wrap(Intl.DateTimeFormat); Intl.NumberFormat = wrap(Intl.NumberFormat); } catch (e) {}
})();
