import { siteConfig } from "@/config/site";

/**
 * מזהי-ישות יציבים (`@id`) לגרף ה-schema.org של האתר. מזהה יציב אחד לכל ישות
 * מרכזית מאפשר למנועי-חיפוש ולמערכות-אחזור AI לחבר את הצמתים לגרף אחד — גם
 * כשהם מרונדרים כבלוקים נפרדים ובעמודים שונים (schema.org ממזג צמתים לפי `@id`).
 *
 * הקשר המרכזי שנבנה כאן:  צחי חן  —author of→  מדייטים לאהבה  —about of→  האתר.
 *
 * כל מזהה הוא URL קנוני מוחלט עם fragment יציב (אינו משתנה בין פריסות):
 *   • person  — המחבר, מוגדר-במלואו ב-/author.
 *   • book    — הספר, מוגדר-במלואו ב-/book (ומורכב גם בבית).
 *   • website — האתר הרשמי, מוגדר בבית.
 */
export const entityId = {
  person: `${siteConfig.url}/author#person`,
  book: `${siteConfig.url}/book#book`,
  website: `${siteConfig.url}/#website`,
} as const;
