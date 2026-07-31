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

  // תמונת השיתוף (opengraph-image ברמת ה-root, 1200×630) נירשת לעמוד הבית
  // דרך file-convention, אך אינה מוחלת אוטומטית על עמודים מקוננים שמגדירים
  // אובייקט openGraph משלהם. לכן מוסיפים אותה במפורש לכל עמוד שאינו הבית,
  // כדי שלכל קישור משותף (og:image + twitter:image) תהיה תצוגה מקדימה.
  const isHome = path === "/";
  const ogImage = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${siteConfig.bookTitle} — ${siteConfig.tagline}`,
  };

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
      ...(isHome ? {} : { images: [ogImage] }),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(isHome ? {} : { images: ["/opengraph-image"] }),
    },
  };
}
