-- הפעלות ערכת-הקורא (Reader Kit claims) — טבלה מתמשכת. הריצו migration זה על
-- ה-Postgres לפני חיבור ה-DATABASE_URL בפרודקשן. הוכחת-הרכישה (מזהה הזמנה)
-- אינה נכס ציבורי — הטבלה נעולה מפני ה-API הציבורי (RLS + revoke).

create table if not exists reader_claims (
  id                bigint generated always as identity primary key,
  name              text        not null,
  email_normalized  text        not null unique,
  email_original    text        not null,
  order_ref         text        not null,
  source            text        not null,
  consent_version   text        not null,
  consent_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text        not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  access_token      text        unique,
  approved_at       timestamptz
);

create index if not exists reader_claims_status_idx on reader_claims (status);
create index if not exists reader_claims_token_idx on reader_claims (access_token);

-- ── נעילת גישה (Supabase) ────────────────────────────────────────────
-- כמו waitlist_subscribers: RLS רגיל (ללא policies → דחייה דרך ה-API הציבורי)
-- וביטול כל הרשאה מ-public/anon/authenticated. חיבור השרת הוא בתפקיד הבעלים
-- ולכן ממשיך לעבוד. אין להשתמש ב-FORCE RLS.
alter table public.reader_claims enable row level security;

revoke all on table public.reader_claims from public, anon, authenticated;
