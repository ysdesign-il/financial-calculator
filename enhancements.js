/* Financial Calculator Enhancements
 * Drop-in module for the financial-calculator website.
 * Local-only saved items: data stays in this browser/device.
 * PDF uses the browser's native Print -> Save as PDF flow.
 */
(() => {
  "use strict";

  const KEY = "fc_enhancements_v1";
  const PREF_KEY = "fc_source_preferences_v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function activeCalculator() {
    const active = document.activeElement;
    const form = active?.closest?.("form");
    if (form) return form;
    const visibleForms = $$("form").filter(el => el.getClientRects().length);
    if (visibleForms.length === 1) return visibleForms[0];
    const candidates = $$("[data-calculator], .calculator, .calc, main form, main");
    return candidates.find(el => el.getClientRects().length) || document.body;
  }

  function fieldSnapshot(root) {
    return $$("input, select, textarea", root).filter(el => {
      if (["button", "submit", "reset", "file"].includes((el.type || "").toLowerCase())) return false;
      if (el.disabled || !el.name && !el.id) return false;
      return true;
    }).map((el, index) => ({
      key: el.name || el.id || `field-${index + 1}`,
      id: el.id || "",
      name: el.name || "",
      type: el.type || el.tagName.toLowerCase(),
      value: el.type === "checkbox" || el.type === "radio" ? !!el.checked : el.value,
      label: fieldLabel(el)
    }));
  }

  function fieldLabel(el) {
    if (el.labels?.length) return [...el.labels].map(x => x.innerText.trim()).join(" / ");
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    if (el.placeholder) return el.placeholder;
    return el.name || el.id || "שדה";
  }

  function calculatorTitle(root) {
    const heading = $("h1, h2, h3, [data-calculator-title]", root);
    return (heading?.innerText || document.title || "מחשבון").trim().slice(0, 120);
  }

  function resultText(root) {
    const candidates = [
      "[data-result]", ".result", ".results", ".calc-result", "[aria-live='polite']",
      "[class*='result']", "[id*='result']", "output"
    ];
    for (const selector of candidates) {
      const nodes = $$(selector, root).filter(el => el.getClientRects().length && el.innerText.trim());
      if (nodes.length) return nodes.map(n => n.innerText.trim()).join("\n\n").slice(0, 12000);
    }
    return "";
  }

  function capture(root = activeCalculator()) {
    return {
      id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: calculatorTitle(root),
      url: location.href,
      savedAt: new Date().toISOString(),
      fields: fieldSnapshot(root),
      result: resultText(root)
    };
  }

  async function copyText(text) {
    if (!text) throw new Error("לא נמצא טקסט להעתקה.");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("ההעתקה נחסמה על ידי הדפדפן.");
    }
  }

  function snapshotText(item) {
    const lines = [item.title, `תאריך: ${new Date(item.savedAt).toLocaleString()}`, ""];
    item.fields.forEach(f => lines.push(`${f.label}: ${typeof f.value === "boolean" ? (f.value ? "כן" : "לא") : f.value}`));
    if (item.result) lines.push("", "תוצאות:", item.result);
    return lines.join("\n");
  }

  function saveItem(item) {
    const items = readJSON(KEY, []);
    items.unshift(item);
    writeJSON(KEY, items.slice(0, 200));
    renderSaved();
  }

  function applyFields(item, target = activeCalculator()) {
    let applied = 0;
    item.fields.forEach(f => {
      let el = f.id ? document.getElementById(f.id) : null;
      if (!el && f.name) {
        el = $$(`[name="${CSS.escape(f.name)}"]`, target).find(x =>
          x.type !== "radio" || String(x.value) === String(f.value));
      }
      if (!el) return;
      if (el.type === "checkbox" || el.type === "radio") el.checked = !!f.value;
      else el.value = f.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      applied++;
    });
    return applied;
  }

  function duplicateCurrent() {
    const root = activeCalculator();
    const fields = fieldSnapshot(root);
    const title = calculatorTitle(root);
    const box = document.createElement("section");
    box.className = "fcx-duplicate";
    box.innerHTML = `
      <div class="fcx-dup-head">
        <strong>עותק של: ${esc(title)}</strong>
        <button type="button" data-close-dup aria-label="סגור">✕</button>
      </div>
      <p class="fcx-note">עותק של הערכים הנוכחיים. הוא מוצג בנפרד כדי לא לדרוס את המחשבון המקורי.</p>
      <div class="fcx-fields">
        ${fields.map((f,i)=>`
          <label class="fcx-field">
            <span>${esc(f.label)}</span>
            ${typeof f.value === "boolean"
              ? `<input type="checkbox" data-dup-index="${i}" ${f.value ? "checked" : ""}>`
              : `<input type="text" data-dup-index="${i}" value="${esc(f.value)}">`}
          </label>`).join("") || "<p>לא נמצאו שדות שניתן לשכפל.</p>"}
      </div>
      <button type="button" class="fcx-primary" data-copy-dup>העתק ערכי העותק</button>`;
    document.body.append(box);
    box.querySelector("[data-close-dup]").addEventListener("click", () => box.remove());
    box.querySelector("[data-copy-dup]").addEventListener("click", async () => {
      const values = fields.map((f,i) => `${f.label}: ${box.querySelector(`[data-dup-index="${i}"]`).type === "checkbox" ? box.querySelector(`[data-dup-index="${i}"]`).checked : box.querySelector(`[data-dup-index="${i}"]`).value}`);
      try { await copyText([title, ...values].join("\n")); toast("ערכי העותק הועתקו."); }
      catch (e) { toast(e.message, true); }
    });
  }

  function toast(message, error = false) {
    let el = $("#fcx-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "fcx-toast";
      document.body.append(el);
    }
    el.textContent = message;
    el.dataset.error = error ? "1" : "0";
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function exportPDF() {
    const oldTitle = document.title;
    document.title = `${calculatorTitle(activeCalculator())} - ${new Date().toLocaleDateString()}`;
    window.print();
    setTimeout(() => { document.title = oldTitle; }, 1200);
  }

  function renderSaved() {
    const list = $("#fcx-saved-list");
    if (!list) return;
    const items = readJSON(KEY, []);
    list.innerHTML = items.length ? items.map(item => `
      <article class="fcx-saved-item">
        <strong>${esc(item.title)}</strong>
        <small>${esc(new Date(item.savedAt).toLocaleString())}</small>
        <p>${esc(item.fields.length)} שדות · ${item.result ? "כולל תוצאות" : "ללא תוצאות מזוהות"}</p>
        <div class="fcx-actions">
          <button type="button" data-load="${esc(item.id)}">טעינת ערכים</button>
          <button type="button" data-copy="${esc(item.id)}">העתקת סיכום</button>
          <button type="button" data-delete="${esc(item.id)}">מחיקה</button>
        </div>
      </article>`).join("") : `<p class="fcx-note">עדיין אין פריטים שמורים. שמירה מתבצעת במכשיר ובדפדפן הזה בלבד.</p>`;

    list.querySelectorAll("[data-load]").forEach(btn => btn.addEventListener("click", () => {
      const item = readJSON(KEY, []).find(x => x.id === btn.dataset.load);
      if (!item) return;
      const count = applyFields(item);
      toast(count ? `נטענו ${count} שדות במחשבון הפעיל.` : "לא נמצאו שדות תואמים במחשבון הפעיל.", !count);
    }));
    list.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
      const item = readJSON(KEY, []).find(x => x.id === btn.dataset.copy);
      if (!item) return;
      try { await copyText(snapshotText(item)); toast("הסיכום הועתק."); }
      catch (e) { toast(e.message, true); }
    }));
    list.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => {
      writeJSON(KEY, readJSON(KEY, []).filter(x => x.id !== btn.dataset.delete));
      renderSaved();
    }));
  }

  function openSavedFolder() {
    $("#fcx-saved-drawer").classList.toggle("open");
    renderSaved();
  }

  function exportSavedJSON() {
    const blob = new Blob([JSON.stringify(readJSON(KEY, []), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "financial-calculator-saved.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function sourcePreferences() {
    const defaults = { market: "auto", commodities: "auto", fx: "auto", customMarketSymbols: "" };
    return { ...defaults, ...readJSON(PREF_KEY, {}) };
  }

  function openSources() {
    const p = sourcePreferences();
    const existing = $("#fcx-source-dialog");
    if (existing) existing.remove();
    const dialog = document.createElement("dialog");
    dialog.id = "fcx-source-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="fcx-source-form">
        <h2>מקורות נתונים</h2>
        <p class="fcx-note">בחירת המקור נשמרת בדפדפן. בחירת ספק כאן אינה מחברת API שלא הוגדר באתר.</p>
        ${sourceSelect("market", "מדדי בורסה", p.market)}
        ${sourceSelect("commodities", "סחורות", p.commodities)}
        ${sourceSelect("fx", "מטבעות", p.fx)}
        <label class="fcx-field"><span>סימולים מותאמים אישית (מופרדים בפסיק)</span>
          <input name="customMarketSymbols" value="${esc(p.customMarketSymbols)}" placeholder="למשל: ^GSPC, GC=F, CL=F">
        </label>
        <p class="fcx-note">אוטומטי יוכל לבחור רק בין ספקים שהוגדרו וחוברו בפועל. יש להציג לכל נתון את הספק ואת שעת העדכון, ולהימנע מהבטחת זמן אמת ללא רישיון מתאים.</p>
        <div class="fcx-actions"><button value="cancel">ביטול</button><button value="save" class="fcx-primary">שמירת העדפות</button></div>
      </form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.returnValue === "save") {
        const form = dialog.querySelector("form");
        const next = {
          market: form.elements.market.value,
          commodities: form.elements.commodities.value,
          fx: form.elements.fx.value,
          customMarketSymbols: form.elements.customMarketSymbols.value.trim()
        };
        writeJSON(PREF_KEY, next);
        toast("העדפות המקורות נשמרו בדפדפן.");
        document.dispatchEvent(new CustomEvent("fcx:source-preferences-changed", { detail: next }));
      }
      dialog.remove();
    });
    dialog.showModal();
  }

  function sourceSelect(name, label, value) {
    const options = [
      ["auto", "אוטומטי"],
      ["manual", "ידני / ספק מועדף"],
      ["site", "המקור הקיים באתר"]
    ];
    return `<label class="fcx-field"><span>${esc(label)}</span><select name="${name}">${options.map(([v,t])=>`<option value="${v}" ${v===value?"selected":""}>${t}</option>`).join("")}</select></label>`;
  }

  function addCalculatorCards() {
    const host = $("#fcx-new-calculators");
    if (!host) return;
    const calculators = [
      {id:"loan", title:"החזר הלוואה", desc:"החזר חודשי, סך ריבית ועלות כוללת", fields:[["סכום הלוואה",100000],["ריבית שנתית (%)",7],["תקופה בחודשים",60]], calc:v=>{const [p,r,n]=v;const i=r/1200;const payment=i===0?p/n:p*i/(1-Math.pow(1+i,-n));return {payment,total:payment*n,interest:payment*n-p};}},
      {id:"compound", title:"ריבית דריבית", desc:"צמיחת חיסכון עם הפקדה חודשית", fields:[["סכום התחלתי",10000],["הפקדה חודשית",500],["תשואה שנתית (%)",5],["שנים",10]], calc:v=>{const [p,monthly,r,years]=v;const n=Math.max(0,Math.round(years*12)), i=Math.pow(1+r/100,1/12)-1;const fv=p*Math.pow(1+i,n)+(i===0?monthly*n:monthly*(Math.pow(1+i,n)-1)/i);return {futureValue:fv, contributions:p+monthly*n, growth:fv-p-monthly*n};}},
      {id:"inflation", title:"שחיקת כסף באינפלציה", desc:"כוח קנייה עתידי לפי שיעור אינפלציה", fields:[["סכום כיום",10000],["אינפלציה שנתית (%)",3],["שנים",10]], calc:v=>{const [p,r,n]=v;const future=p*Math.pow(1+r/100,n);return {futureCost:future, purchasingPower:p/Math.pow(1+r/100,n)};}},
      {id:"goal", title:"חיסכון ליעד", desc:"הפקדה חודשית נדרשת להגיע ליעד", fields:[["יעד חיסכון",100000],["חיסכון קיים",10000],["תשואה שנתית (%)",4],["שנים",5]], calc:v=>{const [target,current,r,years]=v;const n=Math.max(1,Math.round(years*12)), i=Math.pow(1+r/100,1/12)-1;const remaining=target-current*Math.pow(1+i,n);return {monthlyNeeded:i===0?remaining/n:remaining*i/(Math.pow(1+i,n)-1)};}}
    ];
    host.innerHTML = calculators.map(c=>`
      <article class="fcx-card"><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p>
      <form data-newcalc="${c.id}">${c.fields.map((f,i)=>`<label class="fcx-field"><span>${esc(f[0])}</span><input type="number" step="any" value="${f[1]}" data-v="${i}" required></label>`).join("")}
      <button type="submit" class="fcx-primary">חשב</button><div class="fcx-calc-result" aria-live="polite"></div></form></article>`).join("");
    host.querySelectorAll("form[data-newcalc]").forEach(form => form.addEventListener("submit", ev => {
      ev.preventDefault();
      const c = calculators.find(x=>x.id===form.dataset.newcalc);
      const values = [...form.querySelectorAll("[data-v]")].map(x=>Number(x.value));
      if (values.some(x=>!Number.isFinite(x))) return;
      const result = c.calc(values);
      const labels = {
        payment:"החזר חודשי", total:"סך כל התשלומים", interest:"סך הריבית",
        futureValue:"שווי עתידי משוער", contributions:"סך ההפקדות", growth:"רווח משוער",
        futureCost:"עלות עתידית משוערת", purchasingPower:"כוח קנייה של הסכום בעתיד",
        monthlyNeeded:"הפקדה חודשית נדרשת"
      };
      const out = Object.entries(result).map(([k,v])=>`${labels[k]||k}: ${new Intl.NumberFormat("he-IL",{style:"currency",currency:"ILS",maximumFractionDigits:2}).format(v)}`).join("\n");
      form.querySelector(".fcx-calc-result").textContent = out;
    }));
  }

  function installStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #fcx-toolbar{position:fixed;z-index:9998;bottom:14px;left:14px;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100vw - 28px);font:14px system-ui,sans-serif}
      #fcx-toolbar button,.fcx-actions button{border:1px solid #bbb;border-radius:10px;padding:9px 12px;background:Canvas;color:CanvasText;cursor:pointer}
      #fcx-toolbar .fcx-primary,.fcx-primary{background:#155eef;color:white;border-color:#155eef}
      #fcx-saved-drawer{position:fixed;z-index:9999;top:0;right:0;height:100dvh;width:min(430px,94vw);background:Canvas;color:CanvasText;box-shadow:0 0 0 100vmax #0006;transform:translateX(110%);transition:transform .2s;padding:18px;overflow:auto;font:14px system-ui,sans-serif}
      #fcx-saved-drawer.open{transform:translateX(0)}
      .fcx-saved-item,.fcx-card{border:1px solid #bbb;border-radius:12px;padding:12px;margin:10px 0}
      .fcx-saved-item small{display:block;opacity:.7;margin-top:4px}.fcx-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
      .fcx-note{font-size:12px;opacity:.75;line-height:1.5}
      .fcx-duplicate{position:fixed;z-index:10000;inset:5vh 4vw auto auto;max-height:90vh;overflow:auto;width:min(520px,92vw);background:Canvas;color:CanvasText;border:1px solid #aaa;border-radius:16px;padding:16px;box-shadow:0 10px 40px #0004;font:14px system-ui,sans-serif}
      .fcx-dup-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.fcx-fields{display:grid;gap:10px}
      .fcx-field{display:grid;gap:5px;margin:9px 0}.fcx-field input,.fcx-field select{box-sizing:border-box;width:100%;padding:9px;border:1px solid #aaa;border-radius:8px;background:Canvas;color:CanvasText}
      #fcx-source-dialog{max-width:min(520px,92vw);border:1px solid #aaa;border-radius:16px;background:Canvas;color:CanvasText}
      #fcx-toast{position:fixed;z-index:10001;bottom:76px;left:14px;padding:10px 14px;background:#222;color:white;border-radius:10px;opacity:0;pointer-events:none;transition:opacity .15s;font:14px system-ui,sans-serif}
      #fcx-toast.show{opacity:1}#fcx-toast[data-error="1"]{background:#8b1e1e}
      @media print{#fcx-toolbar,#fcx-saved-drawer,#fcx-toast,.fcx-duplicate,#fcx-source-dialog{display:none!important}body{background:white!important;color:black!important}}
    `;
    document.head.append(style);
  }

  function installUI() {
    const toolbar = document.createElement("nav");
    toolbar.id = "fcx-toolbar";
    toolbar.setAttribute("aria-label", "כלים למחשבון");
    toolbar.innerHTML = `
      <button type="button" data-action="copy">העתק תוצאות</button>
      <button type="button" data-action="duplicate">שכפל מחשבון</button>
      <button type="button" data-action="save">שמור</button>
      <button type="button" data-action="saved">שמורים</button>
      <button type="button" data-action="pdf">PDF</button>
      <button type="button" data-action="sources">מקורות</button>`;
    document.body.append(toolbar);

    const drawer = document.createElement("aside");
    drawer.id = "fcx-saved-drawer";
    drawer.innerHTML = `<div class="fcx-dup-head"><h2>תיקיית שמורים</h2><button type="button" data-close-saved>סגירה ✕</button></div>
      <p class="fcx-note">הנתונים נשמרים מקומית בדפדפן הזה. ניקוי נתוני הדפדפן עלול למחוק אותם.</p>
      <div class="fcx-actions"><button type="button" data-export-saved>ייצוא גיבוי JSON</button><button type="button" data-clear-saved>מחיקת כל השמורים</button></div>
      <div id="fcx-saved-list"></div>`;
    document.body.append(drawer);

    toolbar.addEventListener("click", async ev => {
      const btn = ev.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "copy") {
        const root = activeCalculator();
        const text = resultText(root) || snapshotText(capture(root));
        try { await copyText(text); toast("הועתק ללוח."); } catch(e) { toast(e.message, true); }
      } else if (action === "duplicate") duplicateCurrent();
      else if (action === "save") {
        const item = capture();
        if (!item.fields.length) { toast("לא נמצאו שדות לשמירה.", true); return; }
        saveItem(item); toast("המחשבון נשמר בתיקיית שמורים.");
      } else if (action === "saved") openSavedFolder();
      else if (action === "pdf") exportPDF();
      else if (action === "sources") openSources();
    });
    drawer.querySelector("[data-close-saved]").addEventListener("click", () => drawer.classList.remove("open"));
    drawer.querySelector("[data-export-saved]").addEventListener("click", exportSavedJSON);
    drawer.querySelector("[data-clear-saved]").addEventListener("click", () => {
      if (confirm("למחוק את כל הפריטים השמורים בדפדפן הזה?")) { writeJSON(KEY, []); renderSaved(); }
    });
  }

  function init() {
    installStyles();
    installUI();
    // New calculators are provided in a separate section to avoid interfering with existing navigation.
    const section = document.createElement("section");
    section.id = "fcx-new-calculators";
    section.dir = "rtl";
    section.style.cssText = "max-width:1100px;margin:32px auto;padding:16px;font-family:system-ui,sans-serif";
    section.innerHTML = `<h2>מחשבונים נוספים</h2><p class="fcx-note">החישובים להמחשה בלבד. יש לבדוק הנחות, מסים, עמלות ותנאי מוצר לפני החלטה פיננסית.</p>`;
    const main = $("main");
    (main || document.body).append(section);
    addCalculatorCards();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  // Small public API for future integration with the app's real source adapters.
  window.FinancialCalculatorEnhancements = {
    capture,
    save: item => saveItem(item || capture()),
    getSaved: () => readJSON(KEY, []),
    getSourcePreferences: sourcePreferences,
    setSourcePreferences: p => writeJSON(PREF_KEY, { ...sourcePreferences(), ...p }),
    refreshSaved: renderSaved
  };
})();
