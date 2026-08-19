-- שדרוג אחזור עברי ל„שאל את הספר”: נרמול-והרחבת עברית (תחיליות, אותיות סופיות,
-- ניקוד/גרש) גם באינדוקס וגם בשאילתה, כדי להעלות recall על ניסוחים יומיומיים.
-- הנרמול מחושב ב-TS (src/lib/compass/hebrew.ts) ומוזן לעמודות ה-*_s; ה-tsvector
-- נבנה מהן. השדות המקוריים נשמרים לתצוגה/ציטוט.
--
-- חשוב: לאחר הרצת המיגרציה יש *לייבא מחדש* את הגרסה הפעילה
--   (npx tsx scripts/compass.ts import <source.json> && … activate <version>)
-- כדי לאכלס את עמודות ה-*_s. עד לייבוא-מחדש, שורות ישנות יחזירו tsvector ריק.

alter table compass_book_sections
  add column if not exists chapter_name_s text,
  add column if not exists section_name_s text,
  add column if not exists content_s      text;

-- אי-אפשר לשנות עמודה generated במקום — מפילים ובונים מחדש מהעמודות המנורמלות.
alter table compass_book_sections drop column if exists search_tsv;

alter table compass_book_sections
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(chapter_name_s, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(section_name_s, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content_s, '')), 'C')
  ) stored;

create index if not exists compass_sections_tsv_idx
  on compass_book_sections using gin (search_tsv);
