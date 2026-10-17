/* phones: my phone (detected in the browser) and the full specs rows */
Object.assign(T, {
  pm_title:['הטלפון שלי – מה המכשיר הזה מדווח','هاتفي – ما يُبلغ عنه هذا الجهاز','My phone – what this device reports'],
  pm_helpMe:['נקרא ישירות מהדפדפן במכשיר הזה ולא נשלח לשום מקום. חלק מהנתונים הדפדפן מסתיר או מעגל.','يُقرأ مباشرة من المتصفح على هذا الجهاز ولا يُرسل إلى أي مكان. يخفي المتصفح أو يقرّب بعض البيانات.','Read straight from the browser on this device and sent nowhere. The browser hides or rounds some figures.'],
  pm_reading:['קורא את נתוני המכשיר…','جارٍ قراءة بيانات الجهاز…','Reading the device…'], pm_na:['לא ידוע','غير معروف','Unknown'],
  pm_hidden:['מוסתר על ידי הדפדפן','يخفيه المتصفح','Hidden by the browser'], pm_hiddenBr:['הדפדפן הזה לא מדווח','هذا المتصفح لا يُبلغ','This browser does not report it'],
  pm_model:['דגם','الطراز','Model'], pm_os:['מערכת הפעלה','نظام التشغيل','Operating system'], pm_browser:['דפדפן','المتصفح','Browser'],
  pm_ram:['זיכרון (RAM)','الذاكرة (RAM)','Memory (RAM)'], pm_ramX:['כ־{n}GB','نحو {n}GB','About {n}GB'], pm_ram8:['8GB ומעלה (הדפדפן לא מדווח יותר מ־8)','8GB أو أكثر (لا يُبلغ المتصفح عن أكثر من 8)','8GB or more (browsers report at most 8)'],
  pm_storage:['נפח אחסון','سعة التخزين','Storage'], pm_diskX:['כ־{n} (הערכה)','نحو {n} (تقدير)','About {n} (estimate)'],
  pm_quota:['מקום שהדפדפן מקצה לאפליקציה','المساحة المخصصة للتطبيق','Space the browser gives this app'], pm_usedX:['בשימוש {n}','مستخدم {n}','{n} used'],
  pm_cores:['ליבות מעבד','أنوية المعالج','Processor cores'], pm_res:['רזולוציית מסך','دقة الشاشة','Screen resolution'], pm_dprX:['צפיפות ×{n}','كثافة ×{n}','Density ×{n}'],
  pm_hz:['קצב רענון (נמדד)','معدل التحديث (مقاس)','Refresh rate (measured)'], pm_color:['תצוגת צבע','عرض الألوان','Colour display'],
  pm_bat:['סוללה','البطارية','Battery'], pm_charging:['בטעינה','قيد الشحن','Charging'], pm_net:['רשת','الشبكة','Network'], pm_offline:['לא מחובר','غير متصل','Offline'],
  pm_touch:['מסך מגע','شاشة لمس','Touch screen'], pm_touchX:['כן · עד {n} אצבעות','نعم · حتى {n} أصابع','Yes · up to {n} fingers'], pm_noTouch:['לא','لا','No'], pm_lang:['שפה ואזור זמן','اللغة والمنطقة الزمنية','Language and time zone'],
  pm_add:['הוספת הטלפון שלי להשוואה','إضافة هاتفي إلى المقارنة','Add my phone to the comparison'], pm_again:['קריאה מחדש','قراءة مجددًا','Read again'],
  pm_mine:['הטלפון שלי','هاتفي','My phone'], pm_added:['נוסף להשוואה – אפשר להשלים את שאר הפרטים ב"טלפונים שהקלדתי"','أُضيف إلى المقارنة – أكمل التفاصيل في "هواتف أدخلتها"','Added to the comparison – fill in the rest under "phones I typed"'],
  pm_limits:['האפליקציה לא קוראת את דגם המכשיר, ושום נתון מכאן לא נשמר או נשלח. אייפון לא חושף זיכרון ואחסון לאתרים.','لا يقرأ التطبيق طراز الجهاز، ولا يُحفظ أو يُرسل أي من هذه البيانات. الآيفون لا يكشف الذاكرة والتخزين للمواقع.','The app never reads the device model, and nothing here is saved or sent. iPhones hide memory and storage from websites.'],
  /* full specs rows */
  phe_title:['תיקון נתונים','تصحيح البيانات','Fix the data'], phe_help:['מצאתם נתון שגוי? בחרו טלפון ושנו כל שדה. התיקון נשמר אצלכם, מסומן ב־✏️ בהשוואה, ואפשר לחזור לנתון המקורי בכל רגע. השדה הריק מציג את הערך המקורי.','وجدت بيانًا خاطئًا؟ اختر هاتفًا وغيّر أي حقل. يُحفظ التصحيح لديك ويُعلَّم بـ✏️ في المقارنة ويمكن العودة للأصل في أي وقت.','Found a wrong figure? Pick a phone and change any field. Your fix is saved on this device, marked ✏️ in the comparison, and can be reset any time.'],
  phe_pick:['איזה טלפון','أي هاتف','Which phone'], phe_ils:['מחיר בישראל (₪)','السعر في إسرائيل (₪)','Price in Israel (₪)'], phe_launch:['מחיר השקה','سعر الإطلاق','Launch price'], phe_vars:['גרסאות אחסון','إصدارات التخزين','Storage options'], phe_panel:['סוג תצוגה','نوع الشاشة','Panel type'],
  phe_varsH:['גרסאות אחסון בפורמט נפח:מחיר:RAM, מופרדות ב־| (למשל 256:1199 | 512:1399:16). 1TB = 1024.','الإصدارات بصيغة السعة:السعر:RAM مفصولة بـ| (مثل 256:1199 | 512:1399:16).','Storage options as size:price:RAM separated by | (e.g. 256:1199 | 512:1399:16). 1TB = 1024.'],
  phe_reset:['חזרה לנתונים המקוריים של הטלפון הזה','العودة للبيانات الأصلية لهذا الهاتف','Reset this phone'], phe_resetAll:['ביטול כל התיקונים','إلغاء كل التصحيحات','Undo all fixes'], phe_resetDone:['הוחזרו הנתונים המקוריים','أُعيدت البيانات الأصلية','Original data restored'],
  ph_vars:['גרסאות אחסון ומחיר','إصدارات التخزين والسعر','Storage options & price'], ph_os:['מערכת הפעלה','نظام التشغيل','Operating system'], ph_upd:['עדכוני מערכת מובטחים','تحديثات النظام المضمونة','Guaranteed OS updates'],
  ph_res:['רזולוציה ותצוגה','الدقة والشاشة','Resolution & panel'], ph_nits:['בהירות מרבית','أقصى سطوع','Peak brightness'], ph_cover:['מסך חיצוני','الشاشة الخارجية','Cover screen'],
  ph_front:['מצלמה קדמית','الكاميرا الأمامية','Front camera'], ph_zoom:['זום אופטי','تقريب بصري','Optical zoom'], ph_wl:['טעינה אלחוטית','شحن لاسلكي','Wireless charging'],
  ph_dim:['מידות (מ״מ)','الأبعاد (مم)','Dimensions (mm)'], ph_sim:['SIM','SIM','SIM'], ph_usb:['חיבור','المنفذ','Port'], ph_wifi:['Wi‑Fi','Wi‑Fi','Wi‑Fi'],
  ph_sd:['כרטיס זיכרון','بطاقة ذاكرة','Memory card'], ph_jack:['שקע אוזניות','مقبس سماعات','Headphone jack'], ph_colors:['צבעים','الألوان','Colours'],
  ph_yes:['יש','نعم','Yes'], ph_no:['אין','لا','No'], ph_yrs:['{n} שנים','{n} سنوات','{n} years'], ph_ncol:['{n} צבעים','{n} ألوان','{n} colours'], ph_sources:['מקורות','المصادر','Sources']
});
