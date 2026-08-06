/**
 * איורים מאושרים למסלול „שאל את הספר”. איור אחד לכל תחנה שבה יש איור מאושר —
 * ואין להמציא או למחזר איור לתחנה שאין לה איור (כרגע „חיפוש ודייטים”).
 *
 * הקבצים חיים ב-/public/images/illustrations. לכל איור נשמר מקור JPG, ולצדו
 * גרסאות WebP/AVIF ברוחבים שונים (למניעת CLS ולחיסכון במשקל). ל„אחרי פרידה”
 * יש גם גרסת-מובייל שנחתכו בה השוליים הריקים בלבד, כדי שהדמות לא תוצג קטנה מדי.
 */

export interface RouteIllustrationData {
  /** שם-בסיס של הקובץ תחת /images/illustrations (בלי רוחב/סיומת). */
  base: string;
  width: number;
  height: number;
  /** טקסט חלופי תיאורי — האיורים אינם דקורטיביים, לכן לעולם לא ריק. */
  alt: string;
  /** גרסת-מובייל נגזרת (חיתוך שוליים ריקים בלבד), אם קיימת. */
  mobile?: { base: string; width: number; height: number };
}

/** מזהי-התחנות של „שאל את הספר” שיש להם איור מאושר. „dating” אין לו איור. */
export type IllustratedStationId = "building" | "existing" | "after-breakup";

export const routeIllustrations: Record<IllustratedStationId, RouteIllustrationData> = {
  building: {
    base: "building",
    width: 1024,
    height: 572,
    alt: "גבר ואישה שוזרים יחד רצועות ליצירת חיבור משותף",
  },
  existing: {
    base: "existing",
    width: 1024,
    height: 572,
    alt: "גבר ואישה מחזקים יחד אריגה זוגית שכבר נבנתה",
  },
  "after-breakup": {
    base: "after-breakup",
    width: 1024,
    height: 572,
    alt: "אישה עוצרת בין קשר שנותר מאחור לבין דרכים חדשות שנפתחות לפניה",
    mobile: { base: "after-breakup-mobile", width: 1024, height: 332 },
  },
};

/**
 * מיפוי מעמוד-תחנה לאיור, רק כשההתאמה הסמנטית נקייה. „לפני קשר” ו„מתחילים
 * מחדש” נשארים ללא איור (אין לשכפל איור של תחנה אחרת). „אחרי פרידה” מקבל את
 * האיור שלו ישירות.
 */
export const stationPageIllustration: Partial<
  Record<
    | "before-relationship"
    | "building-relationship"
    | "inside-relationship"
    | "after-breakup"
    | "starting-again",
    RouteIllustrationData
  >
> = {
  "building-relationship": routeIllustrations.building,
  "inside-relationship": routeIllustrations.existing,
  "after-breakup": routeIllustrations["after-breakup"],
};
