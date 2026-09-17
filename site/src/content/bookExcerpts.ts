/**
 * מאגר-הציטוטים המאושר של ספר-ההירו המונפש.
 *
 * ── מה זה ולמה ─────────────────────────────────────────────────────────────
 * הספר שעל עמוד-הבית אינו קורא-ספר ואינו דמו-WebGL: הוא **טריילר**. לכן כל
 * כפולה שנחשפת צריכה להחזיק מחשבה אחת שכדאי לעצור בשבילה, ולא „טקסט-מילוי
 * שנראה כמו ספר”.
 *
 * עד עכשיו היו כאן שלוש כפולות בלבד, והן התחלפו ב-‎n % 3‎ — כלומר הדפדוף
 * הראשון, הרביעי והשביעי הציגו בדיוק את אותו תוכן. זה מה שנקרא „חזרתיות
 * נראית לעין”. הקובץ הזה מחליף את שלוש הכפולות ב-24 ציטוטים מאושרים.
 *
 * ── גבולות ─────────────────────────────────────────────────────────────────
 * • **הניסוח הוא ציטוט מדויק.** אין כאן פרפרזה, אין קיצור, אין ניסוח מחדש
 *   ואין המצאה. שבירות-השורה הן אלו שנמסרו — הן חלק מהציטוט, ולכן `lines`
 *   הוא מערך ולא מחרוזת אחת.
 * • **אין מספרי-עמוד.** לא ניתן לאמת את העימוד של המהדורה הסופית, ולכן שיוך
 *   ציטוט לעמוד מודפס מסוים הוא המצאה. העימוד הדקורטיבי הקודם ("9", "25")
 *   הוסר לגמרי ולא הוחלף.
 * • **אין שמות-פרקים.** האשכולות כאן הם *סדר עריכתי* פנימי בלבד — הם קובעים
 *   את רצף-ההופעה, ואינם מוצגים על הדף ואינם מתיימרים להיות מבנה-הספר.
 */

/** אשכול עריכתי — קובע את הסדר, אינו מוצג ואינו „שם פרק”. */
export type ClusterId =
  | "pattern"
  | "dating"
  | "noise"
  | "chemistry"
  | "boundaries"
  | "building";

export interface BookExcerpt {
  /** המספר במאגר המאושר — מזהה יציב לבדיקות ולדיווח. */
  readonly id: number;
  readonly cluster: ClusterId;
  /** הציטוט המדויק. כל איבר הוא שורה שנמסרה ככזו. */
  readonly lines: readonly string[];
}

/**
 * המאגר המאושר — 24 ציטוטים, בניסוח מדויק.
 *
 * הסדר כאן הוא סדר-המספור שנמסר (1..24), *לא* סדר-התצוגה. סדר-התצוגה נקבע
 * ב-`EDITORIAL_ORDER` למטה.
 */
export const BOOK_EXCERPTS: readonly BookExcerpt[] = [
  { id: 1, cluster: "pattern", lines: ["אתם לא מפחדים שיעזבו.", "אתם מפחדים שיישארו."] },
  { id: 2, cluster: "building", lines: ["כי אהבה לא נמצאת.", "היא נבנית."] },
  { id: 3, cluster: "pattern", lines: ["החלפתם פרצוף.", "לא החלפתם דפוס."] },
  {
    id: 4,
    cluster: "pattern",
    lines: ["ה“כימיה” שאתם מחפשים היא לעיתים קרובות", "הכאב המוכר — בתחפושת."],
  },
  {
    id: 5,
    cluster: "pattern",
    lines: ["מה שאתם אומרים שאתם רוצים,", "ומה שאתם בוחרים —", "זה לא אותו דבר."],
  },
  {
    id: 6,
    cluster: "chemistry",
    lines: [
      "מישהו יכול להיות מהפנט למשך שבועיים.",
      "עקביות קשה יותר לזייף.",
      "הכימיה פותחת את הדלת —",
      "העקביות מחזיקה את הבית.",
    ],
  },
  { id: 7, cluster: "dating", lines: ["היא הפסיקה להיבחר.", "היא התחילה לבחור."] },
  {
    id: 8,
    cluster: "noise",
    lines: ["קראתם את ההודעה שלו שלוש פעמים.", "והוא כתב אותה בחמש שניות."],
  },
  {
    id: 9,
    cluster: "noise",
    lines: ["הטלפון לא הורס אהבות.", "הוא מגביר את מה שכבר שם —", "ביטחון או חרדה."],
  },
  {
    id: 10,
    cluster: "noise",
    lines: [
      "אפליקציות דייטינג עובדות כמו מכונות מזל —",
      "וכשאתם פוגשים מישהו מעניין וממשיכים לגלול,",
      "אתם לא שומרים על אפשרויות.",
      "אתם בורחים.",
    ],
  },
  { id: 11, cluster: "noise", lines: ["הרעש לא נעלם.", "אתם פשוט מפסיקים לציית לו."] },
  { id: 12, cluster: "chemistry", lines: ["הפרפרים לא אהבו אתכם.", "הם רק פחדו בשבילכם."] },
  { id: 13, cluster: "chemistry", lines: ["כימיה אמיתית", "לא גורמת לכם להרגיש קטנים."] },
  {
    id: 14,
    cluster: "boundaries",
    lines: ["חיבור בריא מבהיר.", "כשמשהו גורם לערפל,", "הערפל הוא המסר."],
  },
  {
    id: 15,
    cluster: "boundaries",
    lines: ["תשומת לב ושליטה", "נראות אותו הדבר —", "עד שאתם אומרים “לא.”"],
  },
  { id: 16, cluster: "boundaries", lines: ["גבולות לא נבחנים כשנוח.", "הם נבחנים כשלא."] },
  {
    id: 17,
    cluster: "boundaries",
    lines: ["מי שמכבד אתכם", "רק כשאתם נוחים לו —", "לא מכבד אתכם."],
  },
  {
    id: 18,
    cluster: "building",
    lines: [
      "הדברים שמחזיקים קשר לא צועקים.",
      "הם נשמעים כמו",
      "“אוקיי, אני מבין”",
      "ו“אני פה.”",
    ],
  },
  {
    id: 19,
    cluster: "boundaries",
    lines: ["אם אתם צריכים לשכנע מישהו", "למה מגיע לכם יחס בסיסי —", "כבר איחרתם."],
  },
  { id: 20, cluster: "building", lines: ["המעבר הזה הוא לא אובדן.", "הוא הפואנטה."] },
  {
    id: 21,
    cluster: "building",
    lines: ["ביטחון פסיכולוגי לא נוצר בהצהרה.", "הוא נוצר בתגובות קטנות, חוזרות."],
  },
  {
    id: 22,
    cluster: "dating",
    lines: [
      "אנשים לא מתאהבים בשיחות נעימות.",
      "הם מתאהבים בהרגשה ששיחה מייצרת —",
      "ובמה שנשאר אחריה.",
    ],
  },
  { id: 23, cluster: "dating", lines: ["משמעות מייצרת רגש,", "ורגש מייצר זיכרון."] },
  {
    id: 24,
    cluster: "dating",
    lines: [
      "לא צריך להגיד את הדבר הנכון.",
      "לא צריך להיות מעניינים.",
      "רק תישארו שם,",
      "בלי ההופעה,",
      "ותראו מה קורה.",
    ],
  },
];

/**
 * סדר-המחזור הראשון — **לא אקראי**.
 *
 * החוויה הראשונה של מבקר היא הרצף הזה, והוא נבנה כהתקדמות רגשית:
 *
 *   דפוס → דייטינג → רעש דיגיטלי → כימיה → גבולות → בנייה
 *
 * זו הסיבה שהמחזור הראשון קבוע ואינו עובר ערבוב: „קרוסלת-ציטוטים אקראית”
 * הורסת בדיוק את הדבר שהרצף הזה קיים בשבילו.
 */
export const EDITORIAL_ORDER: readonly number[] = [
  1, 3, 4, 5, // A · דפוס
  7, 23, 22, 24, // B · דייטינג
  8, 9, 10, 11, // C · רעש דיגיטלי
  12, 6, 13, // D · כימיה
  14, 15, 16, 17, 19, // E · גבולות
  2, 18, 21, 20, // F · בנייה
];

/** סדר-האשכולות של המחזור הראשון — בסיס לערבוב של המחזורים הבאים. */
const CLUSTER_SEQUENCE: readonly ClusterId[] = [
  "pattern",
  "dating",
  "noise",
  "chemistry",
  "boundaries",
  "building",
];

const byId = new Map(BOOK_EXCERPTS.map((e) => [e.id, e]));

/** הציטוט לפי מזהה — נכשל במפורש אם המזהה אינו קיים. */
export function excerptById(id: number): BookExcerpt {
  const e = byId.get(id);
  if (!e) throw new Error(`bookExcerpts: unknown excerpt id ${id}`);
  return e;
}

/** mulberry32 — PRNG דטרמיניסטי וזעיר. זרע זהה ⇒ רצף זהה, תמיד. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates עם PRNG נתון — טהור ביחס לזרע. */
function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * תמורה למחזור ‎cycle ≥ 1‎: מערבבים את *סדר האשכולות*, ובתוך כל אשכול את
 * הציטוטים. הערבוב ברמת-האשכול (ולא ברמת-הציטוט) הוא שמונע „קפיצה תמטית”
 * בכל דפדוף — האשכול נשאר יחידה, כמו במחזור הראשון.
 */
function permutationFor(cycle: number, salt: number): number[] {
  const next = rng(cycle * 0x9e3779b1 + salt * 0x85ebca6b + 1);
  const clusters = shuffled(CLUSTER_SEQUENCE, next);
  const out: number[] = [];
  for (const c of clusters) {
    const ids = BOOK_EXCERPTS.filter((e) => e.cluster === c).map((e) => e.id);
    out.push(...shuffled(ids, next));
  }
  return out;
}

/**
 * ההפרדה המינימלית (במספר דפדופים) בין שתי הופעות של אותו ציטוט, כששני
 * מחזורים משורשרים.
 *
 * ציטוט שיושב במקום ‎p‎ בסוף המחזור הקודם ובמקום ‎q‎ במחזור החדש רחוק מעצמו
 * ‎(24 − p) + q‎ דפדופים.
 */
function minSeparation(prev: readonly number[], next: readonly number[]): number {
  const pos = new Map(next.map((id, i) => [id, i]));
  let min = Infinity;
  prev.forEach((id, p) => {
    const q = pos.get(id);
    if (q !== undefined) min = Math.min(min, prev.length - p + q);
  });
  return min;
}

/** ההפרדה המינימלית שכל מחזור חייב לשמור מול קודמו. */
export const MIN_SEPARATION = 12;

const orderCache = new Map<number, readonly number[]>([[0, EDITORIAL_ORDER]]);

/**
 * סדר-התצוגה של מחזור שלם.
 *
 * מחזור 0 הוא הרצף העריכתי. כל מחזור אחריו הוא תמורה חדשה.
 *
 * ── כמה רחוק אפשר להבטיח, ולמה לא יותר ────────────────────────────────────
 * הדרישה „אף ציטוט אינו חוזר לפני שכל המאגר הוצג” נכונה **בתוך מחזור**: כל
 * מחזור הוא תמורה שלמה, ולכן 24 הדפדופים הראשונים הם 24 ציטוטים שונים, וכך
 * כל מחזור. בתפר שבין מחזורים אי-אפשר לקיים אותה דרישה כחלון-נע של 24 —
 * וזו עובדה מתמטית, לא ויתור: אם ציטוט יושב במקום ‎p‎ במחזור אחד ובמקום ‎q‎
 * בבא, המרחק הוא ‎24 − p + q‎, ודרישת ‎≥ 24‎ פירושה ‎q ≥ p‎ לכל ציטוט. מכיוון
 * ששני המחזורים הם תמורות של אותה קבוצה, סכום המקומות זהה, ולכן ‎q ≥ p‎ לכולם
 * גורר ‎q = p‎ לכולם — כלומר *אותו סדר בדיוק* בכל מחזור. זה סותר ישירות את
 * הדרישה לתמורה חדשה בכל מחזור.
 *
 * לכן ההבטחה כאן היא החזקה ביותר שאפשר לקיים יחד עם ערבוב:
 *
 *   • כל מחזור הוא תמורה שלמה — 24 שונים לפני כל חזרה, בתוך המחזור.
 *   • בין שתי הופעות של אותו ציטוט יש לפחות `MIN_SEPARATION` דפדופים
 *     (‎~20 שניות של צפייה רצופה), גם בתפר.
 *   • הציטוט הפותח אינו זה שסגר את המחזור הקודם.
 *   • האשכול הפותח אינו האשכול שסגר את המחזור הקודם.
 *
 * הגרלה חוזרת עם מלח מתקדם — דטרמיניסטית, ולכן אותו מחזור נותן תמיד אותו
 * סדר. אם אף הגרלה אינה עומדת בתנאים, נופלים אל סיבוב של המחזור הקודם
 * ב-‎r‎ מקומות: סיבוב כזה נותן הפרדה מינימלית של ‎24 − r‎ בדיוק, ולכן
 * ‎r ≤ 12‎ מקיים את הסף תמיד. כך הפונקציה נשארת טוטלית בלי לולאה אינסופית.
 */
export function excerptOrder(cycle: number): readonly number[] {
  const c = Math.max(0, Math.floor(cycle));
  const hit = orderCache.get(c);
  if (hit) return hit;

  const prev = excerptOrder(c - 1);
  const prevLastId = prev[prev.length - 1];
  const prevLastCluster = excerptById(prevLastId).cluster;
  const ok = (order: readonly number[]) =>
    order[0] !== prevLastId &&
    excerptById(order[0]).cluster !== prevLastCluster &&
    minSeparation(prev, order) >= MIN_SEPARATION;

  let order: number[] | null = null;
  for (let salt = 0; salt <= 64; salt += 1) {
    const candidate = permutationFor(c, salt);
    if (ok(candidate)) {
      order = candidate;
      break;
    }
  }
  if (!order) {
    // סיבוב ב-‎r‎ נותן הפרדה מינימלית ‎24 − r‎, ולכן כל ‎r ≤ 12‎ בטוח.
    for (let r = 1; r <= CYCLE_LENGTH - MIN_SEPARATION; r += 1) {
      const candidate = prev.slice(r).concat(prev.slice(0, r));
      if (ok(candidate)) {
        order = candidate;
        break;
      }
    }
  }
  if (!order) throw new Error(`bookExcerpts: no valid order for cycle ${c}`);

  orderCache.set(c, order);
  return order;
}

/** מספר הציטוטים במחזור — אורך המאגר המאושר. */
export const CYCLE_LENGTH = BOOK_EXCERPTS.length;

/**
 * הציטוט של הגיליון ה-‎n‎ בזרם-הדפדוף האינסופי.
 *
 * זו נקודת-החיבור היחידה בין המאגר לסצנה: הגאומטריה ממחזרת בריכה של ארבעה
 * או חמישה גיליונות, אבל `n` רק גדל — ולכן מִחזור-גאומטריה לעולם אינו נקרא
 * כמִחזור-תוכן.
 */
export function excerptAt(n: number): BookExcerpt {
  const i = Math.max(0, Math.floor(n));
  const order = excerptOrder(Math.floor(i / CYCLE_LENGTH));
  return excerptById(order[i % CYCLE_LENGTH]);
}
