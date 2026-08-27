-- הפעלות ערכת-הקורא (Reader Kit claims) — טבלה מתמשכת. הריצו migration זה על
-- ה-Postgres לפני חיבור ה-DATABASE_URL בפרודקשן.
--
-- זרימה: רכישה באמזון → העלאת הוכחת-רכישה → pending → בדיקה ידנית →
-- approved/rejected → מייל → גישה לערכה. הוכחת-הרכישה נשמרת כ-bytea *בתוך*
-- הטבלה (פרטי לחלוטין, נגיש שרת-בלבד, לעולם לא URL ציבורי) ונמחקת עם ההכרעה.
-- הגישה מנוהלת כסשן: נשמר רק ה-hash (SHA-256) של אסימון-הגישה, עם תפוגה.

create table if not exists reader_claims (
  id                       bigint generated always as identity primary key,
  email_normalized         text        not null unique,
  consent_version          text        not null,
  consent_at               timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  status                   text        not null default 'pending'
                             check (status in ('pending', 'approved', 'rejected')),
  proof_mime               text,
  proof_size               integer,
  proof_bytes              bytea,
  access_token_hash        text        unique,
  access_token_expires_at  timestamptz,
  reviewed_at              timestamptz,
  approved_at              timestamptz
);

create index if not exists reader_claims_status_idx on reader_claims (status);
create index if not exists reader_claims_token_idx on reader_claims (access_token_hash);

-- ── נעילת גישה (Supabase) ────────────────────────────────────────────
-- כמו waitlist_subscribers: RLS רגיל (ללא policies → דחייה דרך ה-API הציבורי)
-- וביטול כל הרשאה מ-public/anon/authenticated. חיבור השרת הוא בתפקיד הבעלים
-- ולכן ממשיך לעבוד. הוכחת-הרכישה לעולם אינה נחשפת דרך ה-API הציבורי.
alter table public.reader_claims enable row level security;

revoke all on table public.reader_claims from public, anon, authenticated;
