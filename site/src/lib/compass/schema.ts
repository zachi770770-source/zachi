import type { SqlClient } from "@/lib/compass/types";

/**
 * סכימת שכבת הידע של „המצפן”. זהה ל-migration הקנוני
 * (migrations/001_create_compass_book.sql). נוצרת אידמפוטנטית.
 *
 * החיפוש מבוסס PostgreSQL Full-Text Search (ללא pgvector — אינו זמין/נדרש,
 * וללא שירות חיצוני בתשלום). ה-tsvector ממושקל: שם הפרק A, שם הסעיף B,
 * התוכן C — כך שכותרות מקבלות משקל גבוה יותר בדירוג.
 */

/** גרסאות הספר — מעקב סטטוס, כדי למנוע ערבוב גרסאות ולאפשר rollback. */
const CREATE_VERSIONS = `
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
  )
`;

/** קטעי הספר — יחידת האחסון והחיפוש. search_tsv מחושב אוטומטית (generated). */
const CREATE_SECTIONS = `
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
  )
`;

/**
 * הקשחה best-effort: אינדקס GIN לחיפוש, אינדקס לסינון גרסה פעילה, אכיפת
 * גרסה פעילה יחידה, ו-RLS + שלילת הרשאות מ-anon/authenticated כדי שתוכן
 * הספר לעולם לא ייקרא מהדפדפן (רק מהשרת, דרך DATABASE_URL).
 */
const HARDENING = [
  `create index if not exists compass_sections_tsv_idx
     on compass_book_sections using gin (search_tsv)`,
  `create index if not exists compass_sections_active_idx
     on compass_book_sections (book_version, is_active)`,
  `create unique index if not exists compass_one_active_version_idx
     on compass_book_versions ((status)) where status = 'active'`,
  `alter table compass_book_sections enable row level security`,
  `alter table compass_book_versions enable row level security`,
  `revoke all on table compass_book_sections from public, anon, authenticated`,
  `revoke all on table compass_book_versions from public, anon, authenticated`,
];

export const COMPASS_SCHEMA_STATEMENTS = [CREATE_VERSIONS, CREATE_SECTIONS, ...HARDENING];

/**
 * יוצר את הסכימה אידמפוטנטית. הטבלאות קריטיות; ההקשחה best-effort (הרשאה
 * חסרה עליה לא תבטל את יצירת הטבלאות).
 */
export async function ensureCompassSchema(db: SqlClient): Promise<void> {
  await db.query(CREATE_VERSIONS);
  await db.query(CREATE_SECTIONS);
  for (const stmt of HARDENING) {
    try {
      await db.query(stmt);
    } catch {
      /* best-effort — לא חוסם */
    }
  }
}
