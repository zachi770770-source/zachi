-- הפעלות ערכת-הקורא (Reader Kit activations) — טבלה מתמשכת. הריצו migration זה
-- על ה-Postgres לפני חיבור ה-DATABASE_URL בפרודקשן.
--
-- מודל: ההפעלה מבוססת קוד-הפעלה מהספר (proof-of-possession), לא מזהה-הזמנה
-- מאמזון. שומרים מינימום PII — אימייל + גרסת-הסכמה. הגישה מנוהלת כסשן: נשמר רק
-- ה-hash (SHA-256) של אסימון-הסשן, לצד תפוגה/ביטול. אסימון גולמי לעולם אינו במסד.

create table if not exists reader_activations (
  id                  bigint generated always as identity primary key,
  email_normalized    text        not null unique,
  consent_version     text        not null,
  consent_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  session_token_hash  text        unique,
  session_expires_at  timestamptz,
  session_revoked_at  timestamptz
);

create index if not exists reader_activations_session_idx
  on reader_activations (session_token_hash);

-- ── נעילת גישה (Supabase) ────────────────────────────────────────────
-- כמו waitlist_subscribers: RLS רגיל (ללא policies → דחייה דרך ה-API הציבורי)
-- וביטול כל הרשאה מ-public/anon/authenticated. חיבור השרת הוא בתפקיד הבעלים
-- ולכן ממשיך לעבוד. אין להשתמש ב-FORCE RLS.
alter table public.reader_activations enable row level security;

revoke all on table public.reader_activations from public, anon, authenticated;
