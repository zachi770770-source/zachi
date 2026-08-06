-- שיוך פרסונה לרשומות רשימת ההמתנה (פילוח שיווקי בלבד; אינם נתונים אישיים).
-- הריצו migration זה על ה-Postgres שכבר מריץ את 001. הקוד גם מוסיף את העמודות
-- באופן אידמפוטנטי בעליית התהליך (add column if not exists), כך שהרשמה לא נכשלת
-- גם אם ה-migration טרם הורץ ידנית.
--
--   persona        — מזהה הפרסונה שנבחרה בזמן ההרשמה: single|breakup|divorced|married
--                    (או NULL אם לא נבחרה פרסונה).
--   persona_source — מאיפה נבחרה: hero|section|url|stored|none (או NULL).

alter table public.waitlist_subscribers
  add column if not exists persona text;

alter table public.waitlist_subscribers
  add column if not exists persona_source text;
