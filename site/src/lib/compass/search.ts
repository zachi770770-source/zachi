import "server-only";

import type { CompassMatch, CompassSearchResponse, SqlClient } from "@/lib/compass/types";

/**
 * סף התאמה מינימלי (ציון מנורמל 0..1) — מתחתיו מסרבים להחזיר תוכן. הסירוב
 * העיקרי על שאלה ללא מקור מתרחש ממילא כי websearch_to_tsquery דורש שכל
 * מונחי השאילתה יימצאו (AND) — שאלה לא רלוונטית מחזירה 0 שורות. הסף הזה
 * הוא רצפה נוספת נגד התאמות זעירות. ערך זה כויל מול פיקסצ'ר קצר; יש לכייל
 * אותו מחדש מול התפלגות הציונים של כתב היד האמיתי.
 */
const DEFAULT_MIN_SCORE = 0.01;
/** מקסימום קטעים בתשובה — לעולם לא מחזירים יותר. */
const MAX_RESULTS = 5;
/** מקסימום קטעים מאותו פרק — כדי לא להחזיר בפועל פרק שלם. */
const MAX_PER_CHAPTER = 2;
/** כמה שורות למשוך לפני סינון/הגבלה. */
const FETCH_LIMIT = 12;

type Row = {
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
  content: string;
  score: number | string;
};

/**
 * חיפוש בצד השרת: מקבל שאלה ומחזיר 3–5 קטעים רלוונטיים בלבד, מהגרסה
 * הפעילה בלבד. נתמך ע"י PostgreSQL Full-Text Search עם ציון ממושקל
 * (כותרות מקבלות משקל גבוה יותר). כאשר ההתאמה נמוכה — מסרב ומחזיר
 * `matched:false` בלי תוכן. לעולם לא מחזיר פרק שלם, ואין דרך למעבר סדרתי
 * בין כל הקטעים — הפונקציה הזו היא הממשק היחיד, והיא מונחית-שאילתה בלבד.
 *
 * הפונקציה מסומנת server-only ולכן לא ניתנת לייבוא מהדפדפן.
 */
/** מחזיר את מזהה הגרסה הפעילה (או null). בדיקה זולה לפני צריכת מכסה/מודל. */
export async function getActiveVersion(db: SqlClient): Promise<string | null> {
  const res = await db.query(
    `select version from compass_book_versions where status = 'active' limit 1`
  );
  return (res.rows[0] as { version?: string } | undefined)?.version ?? null;
}

export async function searchCompass(
  db: SqlClient,
  question: string,
  opts: { minScore?: number } = {}
): Promise<CompassSearchResponse> {
  const q = (question ?? "").trim();
  const minScore = opts.minScore ?? DEFAULT_MIN_SCORE;
  if (!q) return { matched: false, bookVersion: null, results: [] };

  // גרסה פעילה יחידה — מונע ערבוב גרסאות בתשובה אחת.
  const versionRes = await db.query(
    `select version from compass_book_versions where status = 'active' limit 1`
  );
  const bookVersion =
    (versionRes.rows[0] as { version?: string } | undefined)?.version ?? null;
  if (!bookVersion) return { matched: false, bookVersion: null, results: [] };

  // דירוג ממושקל ומנורמל ל-0..1 (דגל 32 = rank/(rank+1)).
  const res = await db.query(
    `select chapter_number, chapter_name, section_name, content,
            ts_rank_cd(search_tsv, query, 32) as score
       from compass_book_sections,
            websearch_to_tsquery('simple', $1) query
      where book_version = $2 and is_active and search_tsv @@ query
      order by score desc
      limit $3`,
    [q, bookVersion, FETCH_LIMIT]
  );

  const perChapter = new Map<number, number>();
  const results: CompassMatch[] = [];
  for (const row of res.rows as Row[]) {
    const score = Number(row.score);
    if (!Number.isFinite(score) || score < minScore) continue;
    const seen = perChapter.get(row.chapter_number) ?? 0;
    if (seen >= MAX_PER_CHAPTER) continue;
    perChapter.set(row.chapter_number, seen + 1);
    results.push({
      chapterNumber: row.chapter_number,
      chapterName: row.chapter_name,
      sectionName: row.section_name,
      content: row.content,
      score: Number(score.toFixed(4)),
    });
    if (results.length >= MAX_RESULTS) break;
  }

  if (results.length === 0) return { matched: false, bookVersion, results: [] };
  return { matched: true, bookVersion, results };
}
