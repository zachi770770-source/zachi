/**
 * שכבת הידע של „המצפן של מדייטים לאהבה” — טיפוסים משותפים.
 *
 * זו שכבת נתונים בלבד: סכימה, חלוקה סמנטית וחיפוש בצד השרת. אין כאן ממשק
 * צ׳אט ואין ספק מודל. תוכן הספר אינו נחשף לדפדפן — כל הקוד כאן רץ בשרת.
 */

/** מקור הספר המובנה — נטען ע"י סקריפט הייבוא מהגרסה המאושרת. */
export interface BookSourceSection {
  /** שם הסעיף (אופציונלי). */
  name?: string | null;
  /** פסקאות הסעיף, לפי הסדר. */
  paragraphs: string[];
}
export interface BookSourceChapter {
  number: number;
  name: string;
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
  chapterNumber: number;
  chapterName: string;
  sectionName: string | null;
  /** סדר הקטע בתוך הגרסה (רציף, מ-1). */
  sectionOrder: number;
  content: string;
  /** sha256 של התוכן — לזיהוי שינויים בין גרסאות. */
  checksum: string;
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
