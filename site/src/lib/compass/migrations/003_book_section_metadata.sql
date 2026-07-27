-- הרחבת compass_book_sections בשדות מטא-דאטה לעקיבות (סעיף 6, ייבוא 888):
--   section_type   — סוג החלק בספר (מבוא / פרק / סיום / נספח).
--   page_start/end — טווח העמודים במקור (null אם לא ידוע).
--   stable_chunk_id — מזהה יציב-דטרמיניסטי לקטע, זהה בין ייבוא חוזר של אותו מבנה.
-- אידמפוטנטי (ADD COLUMN IF NOT EXISTS). נוסף כ-nullable כדי לא להיכשל על
-- שורות קיימות; ייבוא חדש דרך src/lib/compass/importer.ts תמיד כותב את הערכים.
-- זהה ל-src/lib/compass/schema.ts.

alter table compass_book_sections
  add column if not exists section_type text not null default 'chapter';

-- אכיפת ערכים חוקיים (best-effort — ידלג אם האילוץ כבר קיים).
do $$
begin
  alter table compass_book_sections
    add constraint compass_book_sections_section_type_check
    check (section_type in ('intro', 'chapter', 'conclusion', 'appendix'));
exception
  when duplicate_object then null;
end
$$;

alter table compass_book_sections
  add column if not exists page_start integer;
alter table compass_book_sections
  add column if not exists page_end integer;
alter table compass_book_sections
  add column if not exists stable_chunk_id text;

-- מזהה-קטע יציב ייחודי בתוך כל גרסה.
create unique index if not exists compass_sections_stable_id_idx
  on compass_book_sections (book_version, stable_chunk_id);
