-- רשימת המתנה (Waitlist) — טבלה מתמשכת. הריצו migration זה על ה-Postgres
-- לפני חיבור ה-DATABASE_URL בפרודקשן.

create table if not exists waitlist_subscribers (
  id                bigint generated always as identity primary key,
  email_normalized  text        not null unique,
  email_original    text        not null,
  source            text        not null,
  consent_version   text        not null,
  consent_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text        not null default 'active'
                       check (status in ('active', 'unsubscribed')),
  notified_at       timestamptz
);

create index if not exists waitlist_subscribers_status_idx
  on waitlist_subscribers (status);

-- ── נעילת גישה (Supabase) ────────────────────────────────────────────
-- האפליקציה מתחברת ישירות ל-Postgres (Transaction Pooler) עם תפקיד הבעלים,
-- ולכן היא ממשיכה לעבוד. אנו נועלים את הטבלה מפני ה-PostgREST הציבורי:
-- מפעילים RLS (ללא policies → דחייה דרך ה-API הציבורי) ומבטלים כל הרשאה
-- מ-public/anon/authenticated, כך שאי אפשר לקרוא או לייצא אימיילים דרך ה-API.
--
-- שימו לב: אין להשתמש ב-FORCE RLS. ללא policies הוא מכפיף גם את בעל הטבלה
-- וחוסם את חיבור השרת. RLS רגיל מספיק כי חיבור השרת הוא בתפקיד הבעלים.
alter table public.waitlist_subscribers enable row level security;

revoke all on table public.waitlist_subscribers
  from public, anon, authenticated;
