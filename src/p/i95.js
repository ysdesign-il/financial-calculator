/* 13.92: suspicious activity (owner only) */
Object.assign(T, {
  sx_title: ['פעילות חשודה', 'نشاط مريب', 'Suspicious activity'],
  sx_note: ['7 הימים האחרונים, מקובץ לפי סוג. לא נשמרות כתובות ולא פרטים אישיים – רק זמן, סוג, נתיב ומספר.',
            'آخر 7 أيام، مجمّعة حسب النوع. لا تُحفظ عناوين ولا تفاصيل شخصية – فقط الوقت والنوع والمسار والعدد.',
            'The last 7 days, grouped by kind. No addresses or personal details are kept – only time, kind, route and a count.'],
  sx_none: ['לא נרשמה פעילות חשודה ב־7 הימים האחרונים.', 'لم يُسجَّل نشاط مريب في آخر 7 أيام.', 'No suspicious activity in the last 7 days.'],
  sx_fail: ['לא ניתן לטעון את הרשימה כרגע.', 'تعذّر تحميل القائمة الآن.', 'The list cannot be loaded right now.'],
  sx_last: ['אחרון:', 'الأخير:', 'Last:'],
  sx_times: ['{n} פעמים', '{n} مرات', '{n} times'],
  sx_alerted: ['נשלחה התראה לתיבת ההודעות על הסוג הזה.', 'أُرسل تنبيه إلى صندوق الرسائل عن هذا النوع.', 'An alert about this kind was sent to the inbox.'],
  sx_k_login: ['כניסות שגויות לניהול', 'محاولات دخول خاطئة إلى الإدارة', 'Failed admin sign-ins'],
  sx_k_lock: ['נעילת הכניסה לניהול', 'قفل الدخول إلى الإدارة', 'Admin sign-in locked'],
  sx_k_rate: ['בקשות שנחסמו בגלל עומס', 'طلبات حُجبت بسبب كثرتها', 'Requests refused (too many)'],
  sx_k_xsite: ['בקשות מאתר אחר שנחסמו', 'طلبات من موقع آخر حُجبت', 'Cross-site requests blocked'],
  sx_k_big: ['בקשות גדולות מדי', 'طلبات كبيرة جدًا', 'Oversized requests'],
  sx_k_path: ['ניסיונות גישה לכתובות חסומות', 'محاولات وصول إلى عناوين محجوبة', 'Requests for blocked addresses'],
  sx_al_login: ['{n} ניסיונות כניסה שגויים לניהול בזמן קצר.', '{n} محاولات دخول خاطئة إلى الإدارة في وقت قصير.', '{n} failed admin sign-ins in a short time.'],
  sx_al_lock: ['הכניסה לניהול ננעלה זמנית אחרי ניסיונות שגויים רבים.', 'قُفل الدخول إلى الإدارة مؤقتًا بعد محاولات خاطئة كثيرة.', 'Admin sign-in was locked for a while after many wrong attempts.'],
  sx_al_rate: ['{n} בקשות נחסמו בגלל עומס חריג.', 'حُجب {n} طلبًا بسبب كثرة غير عادية.', '{n} requests were refused for unusual volume.'],
  sx_al_xsite: ['נחסמה בקשה לשינוי שהגיעה מאתר אחר.', 'حُجب طلب تغيير وصل من موقع آخر.', 'A request to change something, sent from another site, was blocked.']
});
