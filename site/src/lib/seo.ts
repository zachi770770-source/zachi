import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/**
 * בונה metadata אחיד ומלא לכל עמוד פעיל: <title> ייחודי, meta description,
 * canonical, ו-metadata לשיתוף (Open Graph + Twitter) עם כותרת ותיאור
 * ספציפיים לעמוד. הגדרות עברית/RTL, siteName ותמונת השיתוף (opengraph-image
 * ברמת ה-root) נירשות מה-layout — אין צורך לחזור עליהן בכל עמוד.
 *
 * למה helper ולא metadata ידני בכל עמוד: ב-Next שדות openGraph נירשים
 * מה-layout כמקשה אחת ואינם נגזרים אוטומטית מ-`title` של העמוד. בלי helper
 * כל עמוד היה חולק את אותה כותרת שיתוף גנרית. כאן כל עמוד מקבל כותרת
 * ותיאור שיתוף משלו, בעקביות ובלי כפילות קוד.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogType = "website",
  absoluteTitle = false,
}: {
  /** כותרת העמוד. ללא שם הספר — הוא מתווסף אוטומטית לפי התבנית. */
  title: string;
  description: string;
  /** נתיב canonical, למשל "/faq". */
  path: string;
  ogType?: "website" | "article";
  /** true = הכותרת מוצגת כמות שהיא, בלי תבנית "| שם הספר". */
  absoluteTitle?: boolean;
}): Metadata {
  // כותרת השיתוף כוללת תמיד את שם הספר, בהתאמה לתבנית ה-<title>.
  const socialTitle = absoluteTitle
    ? title
    : `${title} | ${siteConfig.bookTitle}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      locale: "he_IL",
      url: path,
      siteName: siteConfig.bookTitle,
      title: socialTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
