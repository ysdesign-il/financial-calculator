/* 13.25: speed – when fresh rates, indexes and figures arrive one after another, the market board on Home is drawn once for the batch instead of once per update.
   Installed last, so every earlier layer of renderMarket still runs, together, a moment later. The first drawing at start-up has already happened by now. */
{ const rmNow = renderMarket; let rmT = 0;
  renderMarket = function(){ clearTimeout(rmT); rmT = setTimeout(() => { rmT = 0; try { rmNow(); } catch (e) {} }, 120); };
  const actRm = activate; activate = function(id){ if (rmT && (id === 'home' || id === 'markets')){ clearTimeout(rmT); rmT = 0; try { rmNow(); } catch (e) {} } return actRm.apply(this, arguments); };
}
