/**
 * שכבת הידע של „המצפן של מדייטים לאהבה” — טיפוסים משותפים.
 *
 * זו שכבת נתונים בלבד: סכימה, חלוקה סמנטית וחיפוש בצד השרת. אין כאן ממשק
 * צ׳אט ואין ספק מודל. תוכן הספר אינו נחשף לדפדפן — כל הקוד כאן רץ בשרת.
 */

/** סוג החלק בספר. משמש לאימות מבנה (מבוא / 13 פרקים / סיום / נספחים). */
export type SectionType = "intro" | "chapter" | "conclusion" | "appendix";

/** מקור הספר המובנה — נטען ע"י סקריפט הייבוא מהגרסה המאושרת. */
export interface BookSourceSection {
  /** שם הסעיף (אופציונלי). */
  name?: string | null;
  /** פסקאות הסעיף, לפי הסדר. */
  paragraphs: string[];
  /** עמוד התחלה/סיום של הסעיף במקור (לעקיבות; אופציונלי). */
  pageStart?: number | null;
  pageEnd?: number | null;
}
export interface BookSourceChapter {
  /**
   * מספר החלק לסדר. לפרק אמיתי זהו מספר הפרק (1..13); למבוא/סיום/נספח
   * זהו מספר סידורי לצורך סדר בלבד (ההבחנה נעשית לפי `type`).
   */
  number: number;
  name: string;
  /** סוג החלק. ברירת מחדל: "chapter". */
  type?: SectionType;
  sections: BookSourceSection[];
}
export interface BookSource {
  /** מזהה גרסת הספר (למשל "medaytim-laahava-888-final"). */
  version: string;
  title?: string;
  chapters: BookSourceChapter[];
}

/** קטע סמנטי אחרי חלוקה — יחידת האחסון והחיפוש. */
export interface BookChunk {
  bookVersion: string;
  /** סוג החלק שאליו שייך הקטע. */
  sectionType: SectionType;
  chapterNumber: number;
  chapterName: string;
  sectionName: string | null;
  /** סדר הקטע בתוך הגרסה (רציף, מ-1). */
  sectionOrder: number;
  /** עמוד התחלה/סיום של הקטע במקור (null אם לא ידוע). */
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  /** sha256 של התוכן — לזיהוי שינויים בין גרסאות. */
  checksum: string;
  /**
   * מזהה יציב ודטרמיניסטי לקטע (זהה בין ייבוא חוזר של אותו מבנה):
   * sha256(version|sectionType|chapterNumber|localOrder).
   */
  stableChunkId: string;
}

/** תוצאת חיפוש בודדת — קטע קצר בלבד, לעולם לא פרק שלם. */
export interface CompassMatch {
  chapterNumber: number;
  chapterName: string;
  sectionName: string | null;
  content: string;
  /** ציון התאמה מנורמל (0..1). */
  score: number;
}

/** תשובת החיפוש. `matched=false` כאשר אין התאמה מספקת. */
export interface CompassSearchResponse {
  matched: boolean;
  /** מוחזר כדי למנוע ערבוב גרסאות — כל התוצאות מאותה גרסה פעילה. */
  bookVersion: string | null;
  results: CompassMatch[];
}

/** קליינט SQL גנרי (מסופק ע"י Pool של pg) — לשם בדיקוּת והפרדה. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}
