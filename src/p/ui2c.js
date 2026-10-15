/* ================= build DOM ================= */
function panelHTML(id){
  const defs = DEFS[id];
  const basic = defs.filter(f => !f.adv);
  const groups = [];
  defs.filter(f => f.adv).forEach(f => {
    let g = groups.find(x => x[0] === f.adv);
    if (!g) groups.push(g = [f.adv, []]);
    g[1].push(f);
  });
  const advHTML = groups.map(([k, fs]) =>
    `<details class="adv"><summary data-i="${k}"></summary><div class="fields">${fs.map(fieldHTML).join('')}</div></details>`).join('');
  return `<section class="panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" hidden>
    <div class="hero" id="hero-${id}"></div>
    <div class="inputs"><div class="fields">${basic.map(fieldHTML).join('')}</div>${advHTML}</div>
    <div class="detail">
      <p class="warn" id="wn-${id}" hidden></p>
      <div class="acts" id="ac-${id}"><button type="button" class="chip" data-ac="copy" data-i="b_copy"></button><button type="button" class="chip" data-ac="share" data-i="b_share"></button><button type="button" class="chip" data-ac="pdf" data-i="b_pdf"></button></div>
      <dl class="ledger" id="led-${id}"></dl>
      <p class="fine" id="nt-${id}" hidden></p>
      <figure class="chart" id="sp-${id}" hidden><figcaption></figcaption><div class="donutwrap"><div class="donut"></div><div class="legend"></div></div></figure>
      <figure class="chart" id="ch-${id}" hidden><figcaption></figcaption><div class="svgwrap"></div><div class="legend"></div></figure>
      <details class="sched" id="tb2-${id}" hidden><summary></summary><div class="scroll"></div></details>
      <details class="sched" id="tb-${id}" hidden><summary></summary><div class="scroll"></div></details>
      <details class="adv scn" id="sc-${id}" data-tab="${id}"><summary data-i="sc_title"></summary><div class="scn-b">
        <label class="scn-l" for="scn-in-${id}" data-i="f_scName"></label>
        <div class="scn-form"><input type="text" id="scn-in-${id}" class="scn-name lookup" maxlength="40"><button type="button" class="btn scn-save" data-i="b_scSave"></button></div>
        <div class="scn-list"></div><div class="scn-cmp scroll"></div></div></details>
    </div>
  </section>`;
}
function percentPanelHTML(){
  const S = (line, res) => `<div class="sentence"><p class="s-line">${line}</p><p class="s-result" id="${res}"></p></div>`;
  const sp = k => `<span data-i="${k}"></span>`;
  const opSel = (id, a, b) => `<select id="${id}" class="inl-select" data-ia="a_action"><option value="add" data-i="${a}"></option><option value="sub" data-i="${b}"></option></select>`;
  return `<section class="panel panel-flat" id="panel-percent" role="tabpanel" aria-labelledby="tab-percent" hidden>
    ${S(sp('p_s1a') + inl('pa_x',15,'%','a_pct') + sp('p_s1b') + inl('pa_y',2000,'','a_amount') + sp('p_q'), 'pr_a')}
    ${S(inl('pb_x',300,'','a_number') + sp('p_s2') + inl('pb_y',1200,'','a_amount') + sp('p_q'), 'pr_b')}
    ${S(sp('p_s3a') + inl('pc_a',80,'','a_start') + sp('p_s3b') + inl('pc_b',100,'','a_end'), 'pr_c')}
    ${S(inl('pd_x',500,'','a_amount') + opSel('pd_op','o_plus','o_minus') + inl('pd_p',18,'%','a_pct'), 'pr_d')}
    ${S(inl('pe_x',30,'','a_number') + sp('p_s5m') + inl('pe_p',12,'%','a_pct') + sp('p_s5e'), 'pr_e')}
    ${S(sp('p_s6a') + inl('pf_x',118,'','a_amount') + opSel('pf_op','o_afterAdd','o_afterSub') + inl('pf_p',18,'%','a_pct') + sp('p_s6e'), 'pr_f')}
    ${S(sp('p_s7a') + inl('pg_a',20,'%','a_pct') + sp('p_s7b') + inl('pg_b',-20,'%','a_pct') + sp('p_s7c'), 'pr_g')}
  </section>`;
}

