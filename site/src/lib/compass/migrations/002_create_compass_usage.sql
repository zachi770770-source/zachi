-- מכסת השימוש של „המצפן” — נאכפת בצד השרת, מבוססת מזהה אנונימי מאובטח.
-- שומרים אך ורק sha256 של המזהה (מעוגן ב-cookie httpOnly). לעולם לא IP גולמי,
-- לא כתובת אימייל, ולא את תוכן השאלה. רענון/חלון חדש אינם מאפסים את המכסה.

create table if not exists compass_usage (
  subject_hash   text primary key,          -- sha256 של המזהה האנונימי (hex)
  lifetime_count integer     not null default 0,
  window_start   timestamptz not null default now(),
  window_count   integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- הקשחה: הטבלה נקראת/נכתבת רק מהשרת (דרך DATABASE_URL), לא מהדפדפן.
alter table compass_usage enable row level security;
revoke all on table compass_usage from public, anon, authenticated;
