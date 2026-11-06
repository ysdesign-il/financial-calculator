/* 13.83: texts – comparing properties, alerts in one place, my financial report, saved scenarios search, income sources, year against year */
Object.assign(T, {
  tab_recmp:['השוואת נכסים להשקעה','مقارنة عقارات للاستثمار','Compare investment properties'],
  d_recmp:['כמה דירות להשקעה זו מול זו: תזרים חודשי, תשואה, החזר משכנתא ורווח במכירה.','عدة شقق استثمارية جنبًا إلى جنب: التدفق الشهري والعائد وقسط الرهن والربح عند البيع.','Several investment flats side by side: monthly cash flow, yield, mortgage payment and gain on sale.'],
  rc_def:['נכס {n}','عقار {n}','Property {n}'], rc_name:['שם הנכס','اسم العقار','Property name'], rc_add:['הוספת נכס','إضافة عقار','Add a property'],
  rc_grow:['שינוי מחיר בשנה (הנחה)','تغيّر السعر سنويًا (افتراض)','Yearly price change (assumption)'], rc_hold:['מוכרים אחרי','البيع بعد','Sell after'],
  rc_hint:['כל נכס מחושב במחשבון "דירה להשקעה". המכירה והשינוי במחיר הם הנחות שלכם.','كل عقار يُحسب بحاسبة "شقة للاستثمار". البيع وتغيّر السعر افتراضات منكم.','Each property uses the "flat for investment" calculator. The sale and price change are your assumptions.'],
  rc_t:['הנכסים זה מול זה','العقارات جنبًا إلى جنب','The properties side by side'], rc_sale:['שווי במכירה','القيمة عند البيع','Value at sale'], rc_gain:['רווח במכירה (לפני מס)','الربح عند البيع (قبل الضريبة)','Gain on sale (before tax)'],
  rc_best:['התשואה הגבוהה על ההון: {x}','أعلى عائد على رأس المال: {x}','Highest return on equity: {x}'], rc_sub:['לעומת {y}: {v}','مقابل {y}: {v}','Against {y}: {v}'],
  rc_note:['רווח במכירה = שווי במכירה פחות המחיר ועלויות הקנייה, לפני מס שבח ועלויות מכירה.','الربح عند البيع = القيمة عند البيع ناقص السعر وتكاليف الشراء، قبل ضريبة التحسين وتكاليف البيع.','Gain on sale = value at sale minus the price and buying costs, before capital-gains tax and selling costs.'],

  tab_alerts:['מרכז התראות','مركز التنبيهات','Alerts'],
  d_alerts:['כל מה שדורש תשומת לב במקום אחד: תזכורות, חידושי ביטוח, תקציב שעומד להיגמר ומאזן שלא עודכן.','كل ما يحتاج انتباهًا في مكان واحد: تذكيرات، تجديد تأمينات، ميزانية توشك أن تنفد وميزانية شخصية لم تُحدَّث.','Everything that needs attention in one place: reminders, insurance renewals, a budget about to run out and a balance sheet not updated.'],
  al_hero:['התראות פעילות','تنبيهات نشطة','Active alerts'], al_hi:['{n} דחופות','{n} عاجلة','{n} urgent'], al_ok:['אין משהו דחוף','لا شيء عاجل','Nothing urgent'], al_none:['אין התראות כרגע.','لا توجد تنبيهات حاليًا.','No alerts right now.'],
  al_late:['באיחור: {x} (לפני {d} ימים)','متأخر: {x} (قبل {d} أيام)','Late: {x} ({d} days ago)'], al_soon:['בקרוב: {x} (בעוד {d} ימים)','قريبًا: {x} (بعد {d} أيام)','Soon: {x} (in {d} days)'],
  al_ins:['חידוש ביטוח: {x} בעוד {d} ימים','تجديد تأمين: {x} بعد {d} أيام','Insurance renewal: {x} in {d} days'],
  al_budNear:['תקציב {x}: נוצלו {p}%','ميزانية {x}: استُخدم {p}%','{x} budget: {p}% used'], al_budOver:['חריגה בתקציב {x}: {p}%','تجاوز ميزانية {x}: {p}%','{x} budget over: {p}%'],
  al_nw:['המאזן האישי לא עודכן יותר מחודשיים.','لم تُحدَّث الميزانية الشخصية منذ أكثر من شهرين.','The balance sheet has not been updated for over two months.'],
  al_open:['פתיחה','فتح','Open'], al_done:['טופל','تمّت المعالجة','Done'], al_kinds:['אילו התראות להציג','أي تنبيهات تُعرض','Which alerts to show'],
  al_kRem:['תזכורות','تذكيرات','Reminders'], al_kIns:['חידושי ביטוח','تجديد التأمينات','Insurance renewals'], al_kBud:['תקציב החודש','ميزانية الشهر','This month\'s budget'], al_kNw:['עדכון המאזן','تحديث الميزانية الشخصية','Balance sheet update'],
  al_note:['ההתראות מחושבות מהנתונים שלכם במכשיר הזה בלבד. "טופל" מסתיר התראה ל־30 יום.','تُحسب التنبيهات من بياناتكم على هذا الجهاز فقط. "تمّت المعالجة" يخفي التنبيه لمدة 30 يومًا.','Alerts are worked out from your data on this device only. "Done" hides an alert for 30 days.'],

  tab_myreport:['הדוח הפיננסי שלי','تقريري المالي','My financial report'],
  d_myreport:['המספרים העיקריים מכל חלקי האפליקציה במסך אחד – ומשם ל־PDF.','الأرقام الرئيسية من كل أجزاء التطبيق في شاشة واحدة – ومنها إلى PDF.','The main figures from every part of the app on one screen – and from there to a PDF.'],
  mr_hero:['השווי הנקי שלכם','صافي ثروتكم','Your net worth'], mr_sub:['לפי המאזן האחרון ששמרתם','حسب آخر ميزانية حفظتموها','From the last balance sheet you saved'], mr_empty:['מלאו את "המאזן האישי" כדי לראות כאן את התמונה המלאה','املؤوا "الميزانية الشخصية" لرؤية الصورة الكاملة هنا','Fill in the balance sheet to see the full picture here'],
  mr_t:['הדוח המלא','التقرير الكامل','The full report'], mr_hSec:['תחום','المجال','Area'],
  mr_sNw:['מאזן','الميزانية','Balance sheet'], mr_nw:['שווי נקי','صافي الثروة','Net worth'], mr_assets:['נכסים','الأصول','Assets'], mr_debts:['התחייבויות','الالتزامات','Debts'],
  mr_sBud:['תקציב','الميزانية الشهرية','Budget'], mr_spendNow:['הוצאות החודש עד כה','مصاريف الشهر حتى الآن','Spending this month so far'], mr_spendAvg:['ממוצע 3 חודשים אחרונים','متوسط آخر 3 أشهر','Average of the last 3 months'], mr_income:['הכנסה חודשית','الدخل الشهري','Monthly income'], mr_saveRate:['שיעור חיסכון משוער','نسبة الادخار التقديرية','Estimated savings rate'],
  mr_sIns:['ביטוחים','التأمينات','Insurance'], mr_sInv:['חסכונות והשקעות','المدخرات والاستثمارات','Savings and investments'], mr_saved:['בחסכונות','في المدخرات','In savings'], mr_hold:['בהחזקות','في الحيازات','In holdings'],
  mr_sAl:['מעקב','المتابعة','Follow-up'], mr_scn:['תרחישים שמורים','سيناريوهات محفوظة','Saved scenarios'],
  mr_note:['הדוח נבנה מהנתונים שהזנתם במכשיר הזה. מידע לתכנון, לא ייעוץ. לשמירה או שליחה – כפתור השיתוף וה־PDF.','يُبنى التقرير من البيانات التي أدخلتموها على هذا الجهاز. معلومات للتخطيط وليست استشارة. للحفظ أو الإرسال – زر المشاركة وPDF.','The report is built from what you entered on this device. Planning information, not advice. To save or send it, use the share and PDF button.'],

  sva_t:['תרחישים שמורים מכל המחשבונים','سيناريوهات محفوظة من كل الحاسبات','Saved scenarios from every calculator'], sva_ph:['חיפוש תרחיש או מחשבון','بحث عن سيناريو أو حاسبة','Search a scenario or calculator'],
  sva_open:['פתיחה','فتح','Open'], sva_none:['לא נמצא תרחיש כזה.','لم يُعثر على سيناريو كهذا.','No such scenario.'], sva_empty:['עוד אין תרחישים שמורים. שומרים אותם בתחתית כל מחשבון.','لا توجد سيناريوهات محفوظة بعد. تُحفظ في أسفل كل حاسبة.','No saved scenarios yet. Save them at the bottom of any calculator.'], sva_loaded:['נטען: {x}','تم التحميل: {x}','Loaded: {x}'],

  exi_t:['מקורות הכנסה','مصادر الدخل','Income sources'], exi_n:['מקור','المصدر','Source'], exi_nPh:['משכורת, עבודה נוספת, קצבה…','راتب، عمل إضافي، مخصّص…','Salary, extra work, allowance…'], exi_amt:['סכום בחודש','المبلغ شهريًا','Amount a month'],
  exi_add:['הוספת מקור','إضافة مصدر','Add a source'], exi_use:['להגדיר כהכנסת החודש: {v}','تعيين كدخل الشهر: {v}','Set as this month\'s income: {v}'], exi_done:['הכנסת החודש עודכנה: {v}','تم تحديث دخل الشهر: {v}','This month\'s income is now {v}'],
  exi_h:['המקורות נשמרים, וכל חודש אפשר לעדכן בלחיצה את ההכנסה לפי הסכום שלהם.','تُحفظ المصادر، ويمكن كل شهر تحديث الدخل بنقرة حسب مجموعها.','The sources are kept, and each month one tap sets the income to their total.'],
  exy_t:['{a} מול {b}','{a} مقابل {b}','{a} against {b}'], exy_d:['שינוי','التغيّر','Change'], exy_sum:['סך הכול','المجموع','Total'],
  exy_h:['משווים את אותם חודשים בשתי השנים (ינואר עד חודש {m}).','نقارن الأشهر نفسها في السنتين (يناير حتى الشهر {m}).','The same months are compared in both years (January to month {m}).']
});
/* no hosting or storage service named on the site (generic wording) */
Object.assign(T, {
  lg_p_ext6:['האתר מתארח אצל ספק אחסון בענן, שרואה את כתובת ה-IP בכל טעינה של האתר, לפי מדיניות הפרטיות שלו. הקוד והנתונים המשותפים (שערים, מדדים) נשמרים במאגר קוד, ומשם הם עוברים לאתר. הכתובת הקודמת מעבירה לכאן, ובלחיצה אחת גם את הנתונים שלך – ישירות בתוך הטלפון.','الموقع مستضاف لدى مزوّد استضافة سحابية يرى عنوان IP عند كل تحميل للموقع، وفق سياسة الخصوصية الخاصة به. الكود والبيانات المشتركة (الأسعار والمؤشرات) محفوظة في مستودع كود، ومنه تنتقل إلى الموقع. العنوان السابق يحوّل إلى هنا، وبضغطة واحدة ينقل بياناتك أيضًا – مباشرة داخل الهاتف.','The website is hosted by a cloud hosting provider, which sees your IP address each time the site loads, under its privacy policy. The code and shared data (rates, indices) are kept in a code repository and reach the site from there. The previous address forwards here and, with one tap, moves your data too – directly on your phone.'],
  dc_needSecret:['חסר מפתח GitHub בשרת: צריך להוסיף סוד בשם GH_TOKEN בהגדרות השרת (Variables and Secrets).','مفتاح GitHub غير موجود في الخادم: يجب إضافة سرّ باسم GH_TOKEN في إعدادات الخادم (Variables and Secrets).','The server has no GitHub key: add a secret named GH_TOKEN in the server settings (Variables and Secrets).']
});
