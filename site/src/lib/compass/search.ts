import "server-only";

import type { CompassMatch, CompassSearchResponse, SqlClient } from "@/lib/compass/types";

/**
 * סף התאמה מינימלי (ציון מנורמל 0..1) — מתחתיו מסרבים להחזיר תוכן. מאחר
 * שהשאילתה בנויה כ-OR בין מונחי התוכן (ראו buildTsQuery), שאלה עלולה להתאים
 * *בחולשה* לקטע דרך מילה נפוצה בודדת (למשל „אוויר”, „חלב”), ולכן הסף הזה הוא
 * רצפה קריטית נגד התאמות-רעש כאלה.
 *
 * מכויל מול מערך-הבדיקה המתויג של כתב-היד האמיתי (גרסה 888, 382 קטעים,
 * holdout75 — 51 שאלות-ספר + 24 מחוץ-לספר). סריקת-סף על המערך:
 *   • recall@5 מגיע לתקרה (61%) בכל סף ≤ 0.25, ויורד ל-55% ב-0.30.
 *   • דחיית שאלות מחוץ-לספר עולה עם הסף (50%→58%→71%), אך המודל ושכבת-ההגנה
 *     (isBlockedRequest) ממילא סוככים על מה שנותר.
 * מכאן שהעדיפות היא recall (שאלה-אמיתית שנדחית = חוויית „לא עובד”, בלי גיבוי),
 * בעוד false-positive מחוץ-לספר נתפס ע"י המודל. 0.25 הוא הערך הגבוה ביותר
 * שאינו פוגע ב-recall (61%) ומשפר דחייה (58%). לפני הכיול הסף היה 0.01 —
 * נמוך מדי. ניתן לעקוף דרך COMPASS_MIN_SCORE (0..1).
 */
const DEFAULT_MIN_SCORE = 0.25;

/** הסף האפקטיבי: override תקין דרך COMPASS_MIN_SCORE, אחרת ברירת המחדל המכוילת. */
function defaultMinScore(): number {
  const raw = Number(process.env.COMPASS_MIN_SCORE);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : DEFAULT_MIN_SCORE;
}
/** מקסימום קטעים בתשובה — לעולם לא מחזירים יותר. */
const MAX_RESULTS = 5;
/** מקסימום קטעים מאותו פרק — כדי לא להחזיר בפועל פרק שלם. */
const MAX_PER_CHAPTER = 2;
/** כמה שורות למשוך לפני סינון/הגבלה. */
const FETCH_LIMIT = 12;

/**
 * מילות פונקציה/שאלה עבריות שאינן נחשבות מונחי תוכן — מוסרות לפני בניית
 * השאילתה כדי שה-OR יתבסס על מונחים משמעותיים בלבד ולא על מילים נפוצות.
 */
const HEBREW_STOPWORDS = new Set([
  "מה", "מהו", "מהי", "מהם", "איך", "כיצד", "האם", "למה", "מדוע", "מתי",
  "איפה", "היכן", "מי", "של", "על", "אל", "את", "עם", "גם", "כי", "זה", "זו",
  "זאת", "אלה", "אני", "אתה", "הוא", "היא", "אנחנו", "אתם", "אתן", "הם", "הן",
  "אם", "או", "כמו", "יש", "אין", "לא", "כן", "אבל", "רק", "עד", "כל", "כדי",
  "בין", "לבין", "אשר", "הזה", "הזו", "יותר", "פחות", "כך", "שם", "כאן", "הכי",
  "עוד", "כבר", "איזה", "איזו", "כמה", "לי", "לך", "לו", "לה", "היה", "להיות",
]);

/**
 * בונה tsquery מסוג OR ממונחי התוכן של שאלה עברית:
 *   1. מפרק את השאלה לפי גבולות לא-אלפאנומריים (Unicode) — כל טוקן מכיל
 *      אותיות/ספרות בלבד, ולכן בטוח ל-to_tsquery (אין תווים מיוחדים).
 *   2. מסיר טוקנים קצרים (אות בודדת) ומילות פונקציה/שאלה.
 *   3. מחבר את הנותרים ב-`|` (OR) — קטע רלוונטי אם הוא מכיל *מונח אחד או
 *      יותר*, במקום לדרוש את כולם (AND). כך משתפר האחזור בעברית ('simple'
 *      ללא גזירת שורש) בלי לפגוע בהגנות (הדירוג + הסף + התקרות ממילא מגבילים).
 * מחזיר מחרוזת ריקה כשאין מונחי תוכן — אז החיפוש מחזיר `matched:false`.
 */
export function buildTsQuery(question: string): string {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of (question ?? "").normalize("NFC").split(/[^\p{L}\p{N}]+/u)) {
    const term = raw.trim();
    if (term.length < 2) continue;
    if (HEBREW_STOPWORDS.has(term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
  }
  return terms.join(" | ");
}

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
  const minScore = opts.minScore ?? defaultMinScore();
  if (!q) return { matched: false, bookVersion: null, results: [] };

  // גרסה פעילה יחידה — מונע ערבוב גרסאות בתשובה אחת.
  const versionRes = await db.query(
    `select version from compass_book_versions where status = 'active' limit 1`
  );
  const bookVersion =
    (versionRes.rows[0] as { version?: string } | undefined)?.version ?? null;
  if (!bookVersion) return { matched: false, bookVersion: null, results: [] };

  // בונים tsquery מסוג OR ממונחי התוכן; ללא מונחים → אין התאמה.
  const tsQuery = buildTsQuery(q);
  if (!tsQuery) return { matched: false, bookVersion, results: [] };

  // דירוג ממושקל ומנורמל ל-0..1 (דגל 32 = rank/(rank+1)).
  const res = await db.query(
    `select chapter_number, chapter_name, section_name, content,
            ts_rank_cd(search_tsv, query, 32) as score
       from compass_book_sections,
            to_tsquery('simple', $1) query
      where book_version = $2 and is_active and search_tsv @@ query
      order by score desc
      limit $3`,
    [tsQuery, bookVersion, FETCH_LIMIT]
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
