/* 13.31: employee and self-employed at the same time – one income tax on both, National Insurance split between the two, and the tax advances the business part needs */
function diNI(S, I){
  /* monthly: S = salary, I = business profit after the deductible pension. The reduced rate and the ceiling are shared, the salary uses them first */
  const cut = TAX.niCut, mx = TAX.niMax;
  const empLo = Math.min(S, cut), empHi = Math.max(0, Math.min(S, mx) - cut);
  const emp = {ni: empLo * TAX.niLow + empHi * TAX.niHigh, h: empLo * TAX.hLow + empHi * TAX.hHigh};
  const cut2 = Math.max(0, cut - S), mx2 = Math.max(0, mx - S);
  const part = (B, lo, hi) => { const b = Math.min(B, mx2), l = Math.min(b, cut2), h = Math.max(0, b - cut2); return l * lo + h * hi; };
  let self = {ni: 0, h: 0, base: 0};
  if (I > 0 && mx2 > 0){ let a = 0, z = I; for (let i = 0; i < 70; i++){ const m = (a + z) / 2; if (m + 0.52 * part(m, TAX.sNiLow, TAX.sNiHigh) < I) a = m; else z = m; }
    const B = S > 0 ? (a + z) / 2 : Math.max((a + z) / 2, TAX.sMinBase || 0); self = {ni: part(B, TAX.sNiLow, TAX.sNiHigh), h: part(B, TAX.sHLow, TAX.sHHigh), base: B}; }
  return {emp, self};
}
function diCalc(v){
  const S = Math.max(0, v.sal), months = Math.min(12, Math.max(0, v.months)), salY = S * months;
  const profit = Math.max(0, v.rev - v.exp), pts = Math.max(0, +v.pts) + Math.max(0, v.extra);
  /* employee pension: credit on up to 7% of the salary up to the cap */
  const empPens = S * Math.max(0, v.salPens) / 100, empCred = TAX.pensCreditRate * Math.min(empPens, TAX.pensDepRate * Math.min(S, TAX.pensSalaryCap)) * months;
  /* self-employed pension: part is a credit (5.5%), part a deduction (11%), on the business income up to the cap */
  const qual = Math.min(profit, 232800), selfIn = Math.max(0, v.selfPens);
  const credPart = Math.min(selfIn, 0.055 * qual), dedPart = Math.min(Math.max(0, selfIn - credPart), 0.11 * qual);
  const I = Math.max(0, (profit - dedPart) / 12), ni = diNI(S, I), ni0 = diNI(0, I);      // months with a salary, and months without one
  const niEmpY = (ni.emp.ni + ni.emp.h) * months, selfNiY = ni.self.ni * months + ni0.self.ni * (12 - months);
  const niSelfY = selfNiY + ni.self.h * months + ni0.self.h * (12 - months), niDed = selfNiY * 0.52;
  const busTaxable = Math.max(0, profit - niDed - dedPart), taxable = salY + busTaxable;
  const credits = pts * TAX.point;
  const all = taxByBrackets(taxable), totalTax = Math.max(0, all.tax - credits - empCred - TAX.pensCreditRate * credPart) + all.sur;
  /* what the employer already takes, as if the salary were the only income */
  const sb = taxByBrackets(salY), withheld = Math.max(0, sb.tax - credits - empCred) + sb.sur;
  const due = Math.max(0, totalTax - withheld);
  const netSal = salY - niEmpY - withheld - empPens * months, netBus = profit - niSelfY - due - selfIn;
  const gross = salY + profit, net = netSal + netBus;
  return {S, salY, profit, ni, niEmpY, niSelfY, niDed, dedPart, credPart, busTaxable, taxable, totalTax, withheld, due, netSal, netBus, gross, net, pts, months,
    marg: marginalRate(taxable) * 100, eff: gross ? (niEmpY + niSelfY + totalTax) / gross * 100 : 0, busShare: profit ? (niSelfY + due) / profit * 100 : 0};
}
miniDef('dualinc', {
  intro: 'di_intro',
  fields: [
    {k: 'sal', t: 'di_sal', type: 'num', u: '₪', def: 12000, h: 'di_salH'},
    {k: 'months', t: 'di_months', type: 'num', u: 'u_mo', def: 12},
    {k: 'salPens', t: 'di_salPens', type: 'num', u: '%', def: 6},
    {k: 'rev', t: 'di_rev', type: 'num', u: '₪', def: 120000, h: 'di_revH'},
    {k: 'exp', t: 'di_exp', type: 'num', u: '₪', def: 20000},
    {k: 'selfPens', t: 'di_selfPens', type: 'num', u: '₪', def: 6000, h: 'di_selfPensH'},
    {k: 'pts', t: 'di_pts', type: 'sel', def: '2.25', opts: [['2.25', 'di_man'], ['2.75', 'di_woman']]},
    {k: 'extra', t: 'di_extra', type: 'num', def: 0, h: 'di_extraH'}
  ],
  calc(v){
    const r = diCalc(v), M0 = MI0, P = x => MIP(x, 1);
    const adv = r.due / 12;
    return {
      hero: {l: t('di_netM'), v: M0(r.net / 12), sub: t('di_netSub', {s: M0(r.netSal / 12), b: M0(r.netBus / 12)})},
      warn: r.due > 0 ? t('di_advWarn', {a: M0(adv)}) : '',
      rows: [
        [t('di_r_salY'), M0(r.salY)], [t('di_r_profit'), M0(r.profit)], [t('di_r_gross'), M0(r.gross), 'key'],
        [t('di_r_niEmp'), M0(-r.niEmpY)], [t('di_r_niSelf'), M0(-r.niSelfY)], [t('di_r_niDed'), M0(r.niDed)],
        r.dedPart > 0 ? [t('di_r_pensDed'), M0(r.dedPart)] : null,
        [t('di_r_taxable'), M0(r.taxable)],
        [t('di_r_taxAll'), M0(-r.totalTax)], [t('di_r_withheld'), M0(-r.withheld)], [t('di_r_due'), M0(-r.due), 'key'],
        [t('di_r_adv'), M0(adv)],
        [t('di_r_netY'), M0(r.net), 'key'],
        [t('di_r_eff'), P(r.eff)], [t('di_r_marg'), P(r.marg)], [t('di_r_busShare'), P(r.busShare)]
      ].filter(Boolean),
      bars: [{l: t('di_b_netSal'), v: Math.max(0, r.netSal)}, {l: t('di_b_netBus'), v: Math.max(0, r.netBus)}, {l: t('di_b_ni'), v: r.niEmpY + r.niSelfY, dn: true}, {l: t('di_b_tax'), v: r.totalTax, dn: true}],
      tips: [t('di_t1'), t('di_t2'), t('di_t3'), t('di_t4')],
      note: t('di_note'),
      acts: [{t: '↗ ' + t('tab_salary'), fn: () => activate('salary')}, {t: '↗ ' + t('tab_selfemp'), fn: () => activate('selfemp')}, {t: '🔔 ' + t('di_remAdv'), fn: () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 15); miRemind(t('di_remT'), d.toISOString().slice(0, 10), t('di_remN', {a: MI0(adv)}), Math.round(adv)); }}]
    };
  },
  disc: 'mi_notAdvice'
});
try { Object.assign(GS_SYN, {dualinc: 'שכיר ועצמאי שכיר+עצמאי גם וגם הכנסה משולבת מקדמות עוסק employee self-employed both side business advances موظف ومستقل'}); } catch (e) {}
Object.assign(T, {
  tab_dualinc:['שכיר + עצמאי','موظف + مستقل','Employee + self-employed'], d_dualinc:['גם שכיר וגם עצמאי? מס הכנסה אחד על שתי ההכנסות, ביטוח לאומי משותף, וכמה מקדמות צריך לשלם על העסק.','موظف ومستقل معًا؟ ضريبة دخل واحدة على الدخلين، تأمين وطني مشترك، وكم دفعات مقدّمة تلزم عن العمل الحر.','Both an employee and self-employed? One income tax on both incomes, shared National Insurance, and the tax advances the business needs.'],
  di_intro:['המעסיק מנכה מס כאילו המשכורת היא ההכנסה היחידה. ההכנסה מהעסק נוספת מעליה ומחויבת במדרגות הגבוהות – לכן צריך לשלם עליה מקדמות.','صاحب العمل يقتطع الضريبة كأن الراتب هو الدخل الوحيد. دخل العمل الحر يُضاف فوقه ويُفرض عليه في الشرائح الأعلى – لذا تلزم دفعات مقدّمة.','The employer withholds tax as if the salary were your only income. Business income comes on top, in the higher brackets – so it needs tax advances.'],
  di_sal:['משכורת ברוטו חודשית','الراتب الإجمالي الشهري','Monthly gross salary'], di_salH:['מהתלוש, לפני ניכויים','من القسيمة، قبل الاستقطاعات','From the payslip, before deductions'], di_months:['חודשי עבודה כשכיר בשנה','أشهر العمل كموظف في السنة','Months as an employee this year'], di_salPens:['הפרשת עובד לפנסיה','اقتطاع الموظف للتقاعد','Employee pension deduction'],
  di_rev:['הכנסות העסק בשנה','دخل العمل الحر السنوي','Business revenue per year'], di_revH:['בלי מע״מ','بدون ضريبة القيمة المضافة','Without VAT'], di_exp:['הוצאות מוכרות בשנה','المصاريف المعترف بها سنويًا','Deductible expenses per year'], di_selfPens:['הפקדה לפנסיה כעצמאי בשנה','إيداع تقاعد كمستقل سنويًا','Self-employed pension deposit per year'], di_selfPensH:['חלק מקבל זיכוי וחלק ניכוי','جزء يحصل على خصم ضريبي وجزء تنزيل','Part gets a credit, part a deduction'],
  di_pts:['נקודות זיכוי בסיס','نقاط الخصم الأساسية','Base credit points'], di_man:['גבר – 2.25','رجل – 2.25','Man – 2.25'], di_woman:['אישה – 2.75','امرأة – 2.75','Woman – 2.75'], di_extra:['נקודות נוספות','نقاط إضافية','Extra points'], di_extraH:['ילדים, תואר, שירות צבאי – אפשר לבדוק במסך הזכויות','أطفال، شهادة، خدمة عسكرية – يمكن الفحص في شاشة الحقوق','Children, degree, army service – check them on the rights screen'],
  di_netM:['נטו בחודש משתי ההכנסות','الصافي الشهري من الدخلين','Net per month from both incomes'], di_netSub:['מהמשכורת {s} · מהעסק {b}','من الراتب {s} · من العمل الحر {b}','Salary {s} · business {b}'],
  di_advWarn:['על העסק כדאי לשלם מקדמות מס של כ־{a} בחודש, אחרת יהיה חוב בסוף השנה.','يُستحسن دفع دفعات ضريبية مقدّمة عن العمل الحر بنحو {a} شهريًا، وإلا سيكون دين في نهاية السنة.','Pay tax advances of about {a} a month on the business, or there will be a debt at year end.'],
  di_r_salY:['משכורת שנתית','الراتب السنوي','Annual salary'], di_r_profit:['רווח העסק','ربح العمل الحر','Business profit'], di_r_gross:['סך ההכנסה','إجمالي الدخل','Total income'],
  di_r_niEmp:['ביטוח לאומי ובריאות – שכיר','تأمين وطني وصحة – موظف','NI and health – employee'], di_r_niSelf:['ביטוח לאומי ובריאות – עצמאי','تأمين وطني وصحة – مستقل','NI and health – self-employed'], di_r_niDed:['ניכוי 52% מדמי הביטוח הלאומי','تنزيل 52% من رسوم التأمين الوطني','52% of NI deducted'],
  di_r_pensDed:['ניכוי פנסיה כעצמאי','تنزيل التقاعد كمستقل','Self-employed pension deduction'], di_r_taxable:['הכנסה חייבת במס (משותפת)','الدخل الخاضع للضريبة (مشترك)','Taxable income (combined)'],
  di_r_taxAll:['מס הכנסה על שתי ההכנסות','ضريبة الدخل على الدخلين','Income tax on both incomes'], di_r_withheld:['מתוכו נוכה במשכורת','منها اقتُطع من الراتب','Of which withheld from salary'], di_r_due:['נשאר לשלם על העסק','المتبقي للدفع عن العمل الحر','Left to pay on the business'], di_r_adv:['מקדמה חודשית מומלצת','دفعة مقدّمة شهرية موصى بها','Suggested monthly advance'],
  di_r_netY:['נטו לשנה','الصافي السنوي','Net per year'], di_r_eff:['שיעור מס ממוצע (כולל ביטוח לאומי)','معدل الضريبة المتوسط (مع التأمين الوطني)','Average rate (incl. NI)'], di_r_marg:['מדרגת מס שולית','شريحة الضريبة الحدّية','Marginal tax bracket'], di_r_busShare:['מכל שקל רווח בעסק הולך למס ולביטוח לאומי','من كل شيكل ربح يذهب للضريبة والتأمين','Of each shekel of business profit, tax and NI take'],
  di_b_netSal:['נטו מהמשכורת','صافي الراتب','Net from salary'], di_b_netBus:['נטו מהעסק','صافي العمل الحر','Net from business'], di_b_ni:['ביטוח לאומי ובריאות','تأمين وطني وصحة','NI and health'], di_b_tax:['מס הכנסה','ضريبة الدخل','Income tax'],
  di_t1:['פותחים תיק במס הכנסה ובביטוח לאומי כעצמאי, ומדווחים בביטוח לאומי שיש לכם גם משכורת – כך לא משלמים כפל מעל התקרה.','افتحوا ملفًا لدى ضريبة الدخل والتأمين الوطني كمستقل، وأبلغوا التأمين الوطني أن لديكم راتبًا – حتى لا تدفعوا مضاعفًا فوق السقف.','Open a self-employed file with the tax office and National Insurance, and tell NI you also have a salary – so you don\'t pay twice above the ceiling.'],
  di_t2:['מקדמות המס נקבעות באחוז מהמחזור. אם השנה שונה מהקודמת – אפשר לבקש לעדכן אותן.','الدفعات المقدّمة تُحدَّد كنسبة من المبيعات. إذا تغيّرت السنة يمكن طلب تحديثها.','Tax advances are set as a percent of turnover. If this year differs, you can ask to update them.'],
  di_t3:['בסוף השנה מגישים דוח שנתי (טופס 1301) עם טופס 106 מהמעסיק – ושם מתקזז הכול.','في نهاية السنة يُقدَّم تقرير سنوي (نموذج 1301) مع نموذج 106 من صاحب العمل – وهناك تتم التسوية.','At year end you file an annual return (form 1301) with form 106 from the employer – everything is settled there.'],
  di_t4:['הפקדה לפנסיה ולקרן השתלמות כעצמאי מקטינה את המס בדיוק בחלק שמחויב במדרגה הגבוהה.','الإيداع للتقاعد وصندوق الاستكمال كمستقل يقلّل الضريبة تحديدًا في الجزء الخاضع للشريحة العليا.','Pension and study-fund deposits as self-employed cut tax exactly on the part in the high bracket.'],
  di_note:['הערכה לשנת 2026: מדרגות מס, נקודות זיכוי וביטוח לאומי לפי הכללים הכלליים. לא כולל מע״מ, הוצאות מיוחדות או הכנסות נוספות.','تقدير لسنة 2026: شرائح الضريبة ونقاط الخصم والتأمين الوطني حسب القواعد العامة. لا يشمل ض.ق.م أو مصاريف خاصة أو دخلًا إضافيًا.','A 2026 estimate: tax brackets, credit points and NI by the general rules. Excludes VAT, special expenses or other income.'],
  di_remAdv:['תזכורת למקדמה','تذكير بالدفعة المقدّمة','Advance reminder'], di_remT:['מקדמת מס – עסק','دفعة ضريبة مقدّمة – عمل حر','Tax advance – business'], di_remN:['כ־{a} לפי המחשבון שכיר + עצמאי','نحو {a} حسب حاسبة موظف + مستقل','About {a} by the employee + self-employed calculator'],
});
