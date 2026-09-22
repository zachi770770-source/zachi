import { describe, expect, it } from "vitest";

import { guides } from "@/content/guides";
import { love } from "@/content/love";
import { dating } from "@/content/dating";
import { hero as bookHero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { guideIndexMeta } from "@/content/guideIndex";

/**
 * ארכיטקטורת כוונת-החיפוש: בעלים אחד לכל כוונה, וגילוי פנימי אמיתי.
 *
 * הבדיקות כאן נולדו מזחילה מלאה של 49 הכתובות ב-sitemap, ולא מתחושה. שני
 * ממצאים מדודים עומדים מאחוריהן:
 *
 *   1. העמודים החזקים באתר היו הפחות-מקושרים. ‎/guide/first-date‎ (914 מילים)
 *      קיבל שלושה קישורים מגוף-התוכן, ‎/guide/attachment-styles‎ (1696 מילים,
 *      המדריך העמוק באתר) קיבל שבעה — בזמן ש-‎/love‎ קיבל 33. סמכות נאגרה
 *      בעמודי-האב ולא זרמה מטה.
 *   2. ‎/faq‎ נשא **אפס** קישורים מגוף-התוכן: הוא היה נגיש מהתפריט ומהפוטר
 *      בלבד.
 *
 * „קישור מגוף-התוכן” כאן הוא קישור מתוך מודל-התוכן (hub / secondary / related /
 * method של מדריך, וקישורי-המקטעים של עמודי-האב) — במכוון *לא* ניווט וגם לא
 * פוטר. ההבחנה הזו חשובה: ספירה שכוללת ניווט הייתה מראה שכל עמוד מקושר מכל
 * עמוד, ומסתירה בדיוק את הליקוי שהבדיקות האלה שומרות עליו.
 */

/** כל הקישורים היוצאים מגוף-התוכן, כזוגות [יעד, טקסט-עוגן]. */
function contentLinks(): Array<{ from: string; href: string; label: string }> {
  const out: Array<{ from: string; href: string; label: string }> = [];
  for (const g of Object.values(guides)) {
    const links = [g.hub, g.secondary, g.method, ...g.related].filter(
      (l): l is NonNullable<typeof l> => Boolean(l),
    );
    for (const l of links) out.push({ from: g.path, href: l.href, label: l.label });
  }
  for (const s of love.sections) {
    out.push({ from: "/love", href: s.link.href, label: s.link.label });
  }
  for (const s of dating.sections) {
    out.push({ from: "/dating", href: s.link.href, label: s.link.label });
  }
  for (const l of guideIndexMeta.orientation.links) {
    out.push({ from: "/guide", href: l.href, label: l.label });
  }
  return out;
}

const LINKS = contentLinks();
const referrers = (href: string) =>
  new Set(LINKS.filter((l) => l.href === href && l.from !== href).map((l) => l.from));

describe("שם הספר אינו משתנה", () => {
  it("‏„מדייטים לאהבה”, בדיוק, בכל מקור-אמת", () => {
    expect(bookHero.title).toBe("מדייטים לאהבה");
    expect(siteConfig.bookTitle).toBe("מדייטים לאהבה");
  });
});

describe("בעלים אחד לכל כוונת-חיפוש", () => {
  /**
   * לכל כוונה: מי הבעלים, ובאיזו מילה הכותרת שלו *נפתחת*. פתיחה ולא הכלה —
   * מילה שמופיעה באמצע כותרת אינה טענת-בעלות, ושתי כותרות שנפתחות באותו מונח
   * הן בדיוק הקניבליזציה שיש למנוע.
   */
  const OWNERS: Array<{ intent: string; path: string; opensWith: string }> = [
    { intent: "אהבה", path: "/love", opensWith: "אהבה" },
    { intent: "דייטים", path: "/dating", opensWith: "דייטים" },
    { intent: "דייט ראשון", path: "/guide/first-date", opensWith: "דייט ראשון" },
    { intent: "זוגיות בריאה", path: "/guide/healthy-relationship", opensWith: "זוגיות בריאה" },
  ];

  const guideTitles = Object.values(guides).map((g) => ({
    path: g.path,
    title: g.metaTitle,
  }));
  const allTitles = [
    ...guideTitles,
    { path: "/love", title: love.meta.title },
    { path: "/dating", title: dating.meta.title },
  ];

  it.each(OWNERS)("‏$intent שייך ל-$path", ({ path, opensWith }) => {
    const owner = allTitles.find((t) => t.path === path);
    expect(owner, `אין עמוד ${path}`).toBeDefined();
    expect(owner!.title.startsWith(opensWith)).toBe(true);
  });

  it.each(OWNERS)("אף עמוד אחר אינו פותח ב„$opensWith”", ({ path, opensWith }) => {
    const others = allTitles.filter(
      (t) => t.path !== path && t.title.startsWith(opensWith),
    );
    expect(others.map((o) => o.path)).toEqual([]);
  });

  it("אין שתי כותרות-מטא זהות", () => {
    const titles = allTitles.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("אין שני מדריכים עם אותו H1", () => {
    const h1s = Object.values(guides).map((g) => g.h1);
    expect(new Set(h1s).size).toBe(h1s.length);
  });
});

describe("גילוי פנימי לעמודי-היעד שנמדדו כחסומים", () => {
  /**
   * הרצפה נקבעה מהמדידה שלפני השינוי ולא ממספר עגול: כל יעד כאן היה *מתחת*
   * לערך שנכתב לידו, ולכן ירידה חזרה אליו היא רגרסיה אמיתית ולא הידוק שרירותי.
   */
  const FLOORS: Array<[string, number]> = [
    ["/guide/first-date", 4], // נמדד 2 לפני (מתוך מודל-התוכן)
    ["/guide/dates-not-progressing", 4],
    ["/guide/from-dating-to-relationship", 4],
    ["/guide/finding-a-relationship", 4],
    ["/guide/healthy-relationship", 5],
    ["/guide/attachment-styles", 6],
  ];

  it.each(FLOORS)("‏%s מקושר מלפחות %i עמודים", (href, min) => {
    expect(referrers(href).size).toBeGreaterThanOrEqual(min);
  });
});

describe("גיוון טקסט-העוגן", () => {
  /**
   * אותו יעד, אותו משפט-עוגן בכל מקום, הוא הדפוס שיש להימנע ממנו. הבדיקה
   * אינה דורשת גיוון מלאכותי בכל מקום — היא נאכפת על היעדים שקיבלו קישורים
   * חדשים בסבב הזה, ששם בדיוק הסיכון להדביק אותו טקסט חמש פעמים.
   */
  const DIVERSE = [
    "/guide/first-date",
    "/guide/dates-not-progressing",
    "/guide/attachment-styles",
  ];

  it.each(DIVERSE)("‏%s אינו נושא טקסט-עוגן חוזר", (href) => {
    const labels = LINKS.filter((l) => l.href === href && l.from !== href).map(
      (l) => l.label,
    );
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("אין עוגן שהוא מונח-החיפוש העירום בלבד", () => {
    const bare = ["דייטים", "אהבה", "זוגיות", "דייט ראשון"];
    for (const l of LINKS) {
      expect(bare, `עוגן עירום: "${l.label}" → ${l.href}`).not.toContain(l.label.trim());
    }
  });
});

describe("הגבול בין „למצוא” לבין „לבנות”", () => {
  /**
   * ‎/guide/finding-a-relationship‎ ו-‎/love‎ עונות על שאלות שנשמעות זהות
   * („איך למצוא אהבה” מול „מהי אהבה”). המקטע שמפריד ביניהן נכתב במפורש כדי
   * שהן לא יתחרו, ולכן הוא מקובע כאן: אם הוא יוסר, ההפרדה חוזרת להיות
   * משתמעת — וזה בדיוק המצב שיצר את הסיכון.
   */
  it("עמוד-החיפוש מצהיר על הגבול ומקשר הלאה אל /love", () => {
    const g = guides["finding-a-relationship"];
    const headings = g.sections.map((s) => s.heading);
    expect(headings.some((h) => h.includes("למצוא") && h.includes("לבנות"))).toBe(true);
    expect(g.related.some((r) => r.href === "/love")).toBe(true);
  });

  it("עמוד-הזוגיות מצהיר על הגבול מול אהבה", () => {
    const g = guides["healthy-relationship"];
    const headings = g.sections.map((s) => s.heading);
    expect(headings.some((h) => h.includes("זוגיות") && h.includes("אהבה"))).toBe(true);
  });
});
