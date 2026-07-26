-- שכבת הידע של „המצפן של מדייטים לאהבה”.
-- חיפוש מבוסס PostgreSQL Full-Text Search (ללא pgvector, ללא שירות חיצוני).
-- ה-tsvector ממושקל: שם פרק A, שם סעיף B, תוכן C.
-- RLS + שלילת הרשאות מבטיחים שתוכן הספר לא ייקרא מהדפדפן (שרת בלבד).
-- זהה ל-src/lib/compass/schema.ts; מורץ אידמפוטנטית.

create table if not exists compass_book_versions (
  version         text primary key,
  status          text not null default 'importing'
                     check (status in ('importing', 'inactive', 'active', 'failed')),
  section_count   integer not null default 0,
  source_checksum text,
  notes           text,
  imported_at     timestamptz not null default now(),
  activated_at    timestamptz,
  updated_at      timestamptz not null default now()
);

create table if not exists compass_book_sections (
  id             bigint generated always as identity primary key,
  book_version   text not null references compass_book_versions(version) on delete cascade,
  chapter_number integer not null,
  chapter_name   text not null,
  section_name   text,
  section_order  integer not null,
  content        text not null,
  checksum       text not null,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(chapter_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(section_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
  ) stored,
  unique (book_version, section_order)
);

create index if not exists compass_sections_tsv_idx
  on compass_book_sections using gin (search_tsv);
create index if not exists compass_sections_active_idx
  on compass_book_sections (book_version, is_active);

-- גרסה פעילה יחידה בכל רגע (מונע ערבוב גרסאות).
create unique index if not exists compass_one_active_version_idx
  on compass_book_versions ((status)) where status = 'active';

alter table compass_book_sections enable row level security;
alter table compass_book_versions enable row level security;
revoke all on table compass_book_sections from public, anon, authenticated;
revoke all on table compass_book_versions from public, anon, authenticated;
