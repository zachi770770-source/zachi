import "server-only";

import type { CompassMatch, CompassSearchResponse, SqlClient } from "@/lib/compass/types";
import { normWord, expandWord, expandText, tokenize } from "@/lib/compass/hebrew";

/**
 * סף התאמה מינימלי (ציון מנורמל 0..1) — מתחתיו מסרבים להחזיר תוכן. מכויל מול
 * מערך-הבדיקה המתויג holdout75 על כתב-היד האמיתי, *לאחר* נרמול-והרחבת העברית
 * (ראו hebrew.ts): בסף 0.30 מתקבלים recall@5=76% ו-recall@1=45% (מול 61%/33%
 * לפני הנרמול), עם דחיית ~58% משאלות מחוץ-לספר; המודל ו-isBlockedRequest סוככים
 * על מה שנותר. העדיפות היא recall (שאלה אמיתית שנדחית = „לא עובד” בלי גיבוי).
 * ניתן לעקוף דרך COMPASS_MIN_SCORE (0..1).
 */
const DEFAULT_MIN_SCORE = 0.3;

/** הסף האפקטיבי: override תקין דרך COMPASS_MIN_SCORE, אחרת ברירת המחדל המכוילת. */
function defaultMinScore(): number {
  const raw = Number(process.env.COMPASS_MIN_SCORE);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : DEFAULT_MIN_SCORE;
}
/** מקסימום קטעים בתשובה — לעולם לא מחזירים יותר. */
const MAX_RESULTS = 5;
/**
 * כמה שורות למשוך לפני הדירוג-מחדש. הורחב מ-12 ל-30 כדי שלמדרג יהיה ממה
 * לבחור; מספר הקטעים שנשלחים למודל *לא* השתנה (MAX_RESULTS=5). זו הרחבה של
 * הבחירה, לא הגדלת הרעש.
 */
const FETCH_LIMIT = 30;
/**
 * חיזוק כשמונח מהשאלה מופיע בשם הפרק/הסעיף. כותרת היא ראיה חזקה בהרבה
 * ממופע מקרי בגוף הטקסט. מוגבל לשני מונחים כדי שלא יהפוך לדומיננטי.
 */
const TITLE_BOOST_PER_HIT = 0.25;
const TITLE_BOOST_MAX_HITS = 2;

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

/** מילות-הפונקציה בצורתן המנורמלת — כדי שההשוואה תעבוד אחרי נרמול הטוקן. */
const HEBREW_STOPWORDS_N = new Set([...HEBREW_STOPWORDS].map(normWord));

/**
 * בונה tsquery מסוג OR ממונחי התוכן של שאלה עברית:
 *   1. מפרק את השאלה לטוקנים (אותיות/ספרות בלבד — בטוח ל-to_tsquery).
 *   2. מסיר מילות-פונקציה/שאלה (בהשוואה מנורמלת).
 *   3. מנרמל *ומרחיב* כל טוקן (lib/compass/hebrew.ts): הצורה המנורמלת + הצורה
 *      ללא תחילית עברית נפוצה. אותו נרמול/הרחבה חלים על האינדוקס (בזמן הייבוא),
 *      כך ש„בפגישות” בשאלה תואם „פגישות” בספר ולהפך.
 *   4. מחבר את כל הווריאנטים ב-`|` (OR) — קטע רלוונטי אם הוא מכיל מונח אחד או
 *      יותר. הדירוג + הסף + התקרות מגבילים דיוק.
 * מחזיר מחרוזת ריקה כשאין מונחי תוכן — אז החיפוש מחזיר `matched:false`.
 */
export function buildTsQuery(question: string): string {
  const { original, derived } = splitQueryTerms(question);
  return [...original, ...derived].join(" | ");
}

/**
 * מפריד את מונחי השאלה לשתי קבוצות: מה שהמשתמש *כתב בפועל* (`original`), ומה
 * שנגזר ממנו בהסרת תחילית (`derived`). ההפרדה נחוצה כי לשתי הקבוצות אין אותה
 * מהימנות — ראו `gateDerivedTerms`.
 */
export function splitQueryTerms(question: string): { original: string[]; derived: string[] } {
  const seen = new Set<string>();
  const original: string[] = [];
  const derived: string[] = [];
  for (const raw of tokenize(question)) {
    const n = normWord(raw);
    if (n.length < 2 || HEBREW_STOPWORDS_N.has(n)) continue;
    for (const v of expandWord(raw)) {
      if (v.length < 2 || HEBREW_STOPWORDS_N.has(v) || seen.has(v)) continue;
      seen.add(v);
      (v === n ? original : derived).push(v);
    }
  }
  return { original, derived };
}

/**
 * שיעור הקטעים שמעליו מונח *נגזר* נחשב גנרי מכדי להיות ראיה. נמדד מול מערך
 * הבדיקה: ב-12%–25% התוצאה זהה (recall 74%, 3/8 התאמות-שווא), ולכן הבחירה
 * אינה רגישה ו-20% הוא אמצע בטוח.
 */
const GENERIC_DERIVED_DF_RATIO = 0.2;

/**
 * מסנן מונחים נגזרים שהם „חברים כוזבים”.
 *
 * הבעיה שנמדדה: הסרת תחילית הופכת „בקשה” ל„קשה”. „בקשה” מופיע ב-15 קטעים,
 * „קשה” ב-96 (25% מהספר) — ולכן השאלה „איך מגישים בקשה לויזה?” תפסה קטעים על
 * קושי בזוגיות. הנגזרת קיבלה בדיוק אותו משקל כמו מילה שהמשתמש באמת כתב.
 *
 * הכלל כאן דטרמיניסטי ונגזר מהקורפוס עצמו — לא מילון ידני: מונח נגזר מושמט רק
 * כאשר *שני* התנאים מתקיימים — הוא גנרי בספר (DF מעל הסף), **וגם** לפחות מונח
 * מקורי אחד כבר מאומת בקורפוס. התנאי השני הוא הבטיחות: אם שום מילה שהמשתמש
 * כתב אינה מופיעה בספר, הנגזרות הן כל מה שיש, והן נשמרות. כך הסינון לא יכול
 * למחוק recall — הוא רק מסיר רעש כשכבר יש אות אמיתי.
 */
export function gateDerivedTerms(
  original: string[],
  derived: string[],
  df: Map<string, number>,
  totalChunks: number
): string[] {
  if (!derived.length) return [];
  const anyOriginalAttested = original.some((t) => (df.get(t) ?? 0) > 0);
  if (!anyOriginalAttested) return derived;
  const cap = GENERIC_DERIVED_DF_RATIO * totalChunks;
  return derived.filter((t) => (df.get(t) ?? 0) <= cap);
}

/**
 * שער-ביטחון לאחזור („I1”).
 *
 * הבעיה שנמדדה על מערך-חסימה עיוור (50 שאלות שהספר עונה עליהן, 25 שאלות
 * מחוץ-לספר, נכתב אחרי הקפאת האינדקס): 14 מתוך 25 שאלות מחוץ-לספר החזירו
 * קטעים ולכן הגיעו למודל. ניתוח המנגנונים הראה שלוש משפחות שניתן להפריד
 * דטרמיניסטית:
 *   A. „וו יחיד” — מילה נדירה מאוד שמופיעה במקרה פעם אחת בספר („משכנתה”,
 *      „שמרים”, „גרון”, „אולם”) מספיקה לעבור את סף-הציון בלי שום חיזוק.
 *   B. שאריות-תחילית — „כוכבים”→„וכבימ”, „הדרך”→„דרכ” — כשאין למעשה אף מילה
 *      *שהמשתמש כתב* שמעוגנת בספר.
 *   D. קלט חסר-תוכן — „אני לא יודע” — מונח תוכן יחיד.
 *
 * שני האותות שהפרידו בפועל (ממוצע: שאלות-אמת מול מחוץ-לספר):
 *   agree 5.41 מול 2.57, ומספר מונחים *מקוריים* מעוגנים 4.76 מול 2.29.
 * לעומתם, נדירות (maxIdf) כמעט אינה מפרידה — 5.15 מול 4.74 — ובכיוון ההפוך
 * מהאינטואיציה: הקישור היחיד של שאלה מחוץ-לספר הוא בדרך כלל דווקא מילה נדירה.
 *
 * לכן הכלל אינו סף-ציון ואינו „לפחות שני מונחים”: „לפחות שני מונחים” הסיר
 * שאלה אחת בלבד מתוך 14. הכלל הוא *חפיפה כפולה*:
 *   1. לפחות שני מונחים מקוריים (לא נגזרים) מעוגנים בספר, וגם
 *   2. לפחות שני מונחים מעוגנים מופיעים בפועל בקטעים שעומדים להישלח למודל.
 *
 * נמדד: 14/25 → 8/25 התאמות-שווא, בלי אף אובדן recall (49/50 לפני ואחרי,
 * R@5 ללא שינוי), ושלוש שאלות-העוגן של PR #81 שורדות.
 */
export const CONFIDENCE_MIN_ORIGINAL_TERMS = 2;
export const CONFIDENCE_MIN_AGREEING_TERMS = 2;

/**
 * מיישם את השער. `haystacks` הם הטקסטים המנורמלים-והמורחבים של הקטעים
 * ש*עומדים להישלח למודל* (אחרי הדירוג-מחדש), לא של כל מה שנשלף — הראיה
 * הרלוונטית היא מה שהמודל יראה בפועל.
 *
 * מוחזר גם `false` כשאין קטעים כלל, כדי שלקורא יהיה ערך אחד לבדוק.
 */
export function passesConfidenceGate(args: {
  /** מונחים שהמשתמש כתב בפועל (אחרי נרמול), לפני גזירת תחיליות. */
  original: string[];
  /** כל המונחים שנשלחו לשאילתה: מקוריים + נגזרים ששרדו את gateDerivedTerms. */
  terms: string[];
  /** DF בקורפוס לכל מונח. מונח עם DF=0 אינו מעוגן. */
  df: Map<string, number>;
  /** הטקסט המנורמל-והמורחב של הקטעים הנבחרים (טוקנים מופרדי-רווח). */
  haystacks: string[];
}): boolean {
  const { original, terms, df, haystacks } = args;
  if (!haystacks.length) return false;

  const attestedOriginal = new Set(original.filter((t) => (df.get(t) ?? 0) > 0));
  if (attestedOriginal.size < CONFIDENCE_MIN_ORIGINAL_TERMS) return false;

  // התאמת טוקן שלם, לא תת-מחרוזת: „בונימ” מכיל את „ונימ” כתת-מחרוזת, ולכן
  // התאמה טקסטואלית הייתה סופרת מונח נגזר כראיה *נוספת* למונח שממנו נגזר.
  // הטקסטים כאן הם פלט expandText — טוקנים מנורמלים מופרדי-רווח.
  const present = new Set<string>();
  for (const h of haystacks) for (const tok of h.split(/\s+/)) if (tok) present.add(tok);

  const attested = [...new Set(terms.filter((t) => (df.get(t) ?? 0) > 0))];
  let agreeing = 0;
  for (const t of attested) {
    if (present.has(t)) agreeing++;
    if (agreeing >= CONFIDENCE_MIN_AGREEING_TERMS) return true;
  }
  return false;
}

type Row = {
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
  content: string;
  /**
   * הטקסט המנורמל-והמורחב של הקטע (כותרות + גוף) — בדיוק מה שנמצא ב-tsvector.
   * פנימי בלבד: אינו חלק מ-CompassMatch ואינו נחשף לראוט/לדפדפן.
   */
  search_text?: string | null;
  score: number | string;
};

/** הטקסט שמולו נבדקת נוכחות מונח. נופל חזרה לנרמול ב-JS אם עמודות ה-`_s` ריקות. */
function searchTextOf(r: Row): string {
  const s = (r.search_text ?? "").trim();
  if (s) return s;
  return expandText(`${r.chapter_name} ${r.section_name ?? ""} ${r.content}`);
}

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
  if (!bookVersion) return { matched: false, bookVersion, results: [] };

  const { original, derived } = splitQueryTerms(q);
  if (!original.length && !derived.length) {
    return { matched: false, bookVersion, results: [] };
  }

  // שאילתה זולה אחת שמחזירה גם את מספר הקטעים הפעילים וגם את ה-DF של כל מונח,
  // כדי לסנן נגזרות-רעש (ראו gateDerivedTerms). סיבוב-הלוך-חזור אחד נוסף.
  const stats = await db.query(
    `select t,
            (select count(*) from compass_book_sections s
              where s.is_active and s.book_version = $2
                and s.search_tsv @@ to_tsquery('simple', t)) as df,
            (select count(*) from compass_book_sections s2
              where s2.is_active and s2.book_version = $2) as total
       from unnest($1::text[]) t`,
    [[...new Set([...original, ...derived])], bookVersion]
  );
  const df = new Map<string, number>();
  let totalChunks = 0;
  for (const row of stats.rows as Array<{ t: string; df: number | string; total: number | string }>) {
    df.set(row.t, Number(row.df));
    totalChunks = Number(row.total);
  }

  const keptDerived = gateDerivedTerms(original, derived, df, totalChunks);
  const terms = [...original, ...keptDerived];
  const tsQuery = terms.join(" | ");
  if (!tsQuery) return { matched: false, bookVersion, results: [] };

  // דירוג ממושקל ומנורמל ל-0..1 (דגל 32 = rank/(rank+1)).
  const res = await db.query(
    `select chapter_number, chapter_name, section_name, content,
            coalesce(chapter_name_s, '') || ' ' || coalesce(section_name_s, '') || ' '
              || coalesce(content_s, '') as search_text,
            ts_rank_cd(search_tsv, query, 32) as score
       from compass_book_sections,
            to_tsquery('simple', $1) query
      where book_version = $2 and is_active and search_tsv @@ query
      order by score desc
      limit $3`,
    [tsQuery, bookVersion, FETCH_LIMIT]
  );

  const rows = res.rows as Row[];
  const picked = rerank(rows, q, minScore);
  if (picked.length === 0) return { matched: false, bookVersion, results: [] };

  // שער-הביטחון נבדק מול הקטעים הנבחרים בלבד — הראיה היא מה שהמודל יראה.
  const byContent = new Map(rows.map((r) => [r.content, r]));
  const haystacks = picked.map((m) => {
    const row = byContent.get(m.content);
    return row ? searchTextOf(row) : expandText(`${m.chapterName} ${m.sectionName ?? ""} ${m.content}`);
  });
  if (!passesConfidenceGate({ original, terms, df, haystacks })) {
    return { matched: false, bookVersion, results: [] };
  }

  return { matched: true, bookVersion, results: picked };
}

/**
 * בוחר את הקטעים שיישלחו למודל.
 *
 * הכלל הקודם — „עד שניים לכל פרק” — נשמע כמו גיוון, אבל כשהציונים צפופים הוא
 * הופך לשרירותי: לשאלה „איך נכון להתכונן לדייט?” שני קטעים כלליים מפרק 3 זכו
 * בתיקו, והתקרה מחקה את הסעיף «האודישן ההפוך» — הסעיף היחיד שבו נמצאת התשובה
 * בפועל („לפני הדייט, דבר אחד שאני לא מוחק…”).
 *
 * לכן הגיוון עובר לרמת ה*סעיף*: מעבר ראשון בוחר קטע אחד מכל סעיף נבדל, ורק
 * אחריו מתמלאות שאר המשבצות. סעיף שבו התשובה נמצאת אינו יכול עוד להימחק ע"י
 * שני קטעים מאותו פרק שקיבלו ציון זהה. הכותרות מקבלות חיזוק, כי התאמה בשם
 * הסעיף היא ראיה חזקה יותר ממופע מקרי בגוף הטקסט.
 */
function rerank(rows: Row[], question: string, minScore: number): CompassMatch[] {
  const terms = new Set<string>();
  for (const raw of tokenize(question)) for (const v of expandWord(raw)) terms.add(v);

  const scored = rows
    .map((r) => ({ row: r, score: Number(r.score) }))
    .filter((x) => Number.isFinite(x.score) && x.score >= minScore)
    .map((x) => {
      const title = `${normWord(x.row.chapter_name)} ${normWord(x.row.section_name ?? "")}`;
      let hits = 0;
      for (const t of terms) if (t.length >= 3 && title.includes(t)) hits++;
      const boost = 1 + TITLE_BOOST_PER_HIT * Math.min(hits, TITLE_BOOST_MAX_HITS);
      return { ...x, adjusted: x.score * boost };
    })
    .sort((a, b) => b.adjusted - a.adjusted);

  const toMatch = (x: { row: Row; score: number }): CompassMatch => ({
    chapterNumber: x.row.chapter_number,
    chapterName: x.row.chapter_name,
    sectionName: x.row.section_name,
    content: x.row.content,
    score: Number(x.score.toFixed(4)),
  });

  const sectionKey = (r: Row) => `${r.chapter_number}::${r.section_name ?? ""}`;
  const seenSection = new Set<string>();
  const picked: CompassMatch[] = [];
  const used = new Set<(typeof scored)[number]>();

  for (const x of scored) {
    const k = sectionKey(x.row);
    if (seenSection.has(k)) continue;
    seenSection.add(k);
    used.add(x);
    picked.push(toMatch(x));
    if (picked.length >= MAX_RESULTS) return picked;
  }
  for (const x of scored) {
    if (used.has(x)) continue;
    picked.push(toMatch(x));
    if (picked.length >= MAX_RESULTS) break;
  }
  return picked;
}
