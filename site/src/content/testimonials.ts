/**
 * המלצות קוראים.
 *
 * חשוב: אין להוסיף כאן המלצות מומצאות בשום צורה. הרשימה מתחילה ריקה בכוונה.
 * ברגע שיש המלצה אמיתית ומאושרת, יש להוסיף אותה כאובייקט לפי המבנה למטה,
 * וה-Section יופעל אוטומטית ברגע שיש בו לפחות פריט אחד (ראו
 * `siteConfig.features.testimonials` וכיצד הוא נגזר בפועל ב-
 * `Testimonials.tsx`).
 */

export type Testimonial = {
  id: string;
  /** הציטוט המלא. */
  quote: string;
  /** המשפט הקצר שמודגש מתוך הציטוט. */
  highlight?: string;
  name: string;
  /** תיאור או תפקיד - רק אם סופק בפועל על ידי הממליץ/ה. */
  role?: string;
  /** סוג הקורא/ת, למשל "קוראת מוקדמת" - רק אם נכון. */
  readerType?: string;
  /** תמונה - רק אם יש הרשאה מפורשת מהממליץ/ה. */
  photo?: string;
  photoAlt?: string;
};

export const testimonials: Testimonial[] = [];
