import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { guideOrder, guides } from "@/content/guides";
import { methodOrder, methods } from "@/content/methods";

type SitemapRoute = {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
  /**
   * ISO של תאריך-התוכן האמיתי, כשקיים לו מקור אמת במאגר (מדריכים ועמודי-מושג
   * נושאים `datePublished`). כשאין תאריך כזה — השדה נשאר undefined ו-`lastmod`
   * *אינו* נפלט כלל. ראו את ההערה ב-`sitemap()`.
   */
  lastModified?: string;
};

const staticRoutes: SitemapRoute[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" },
  // „/en” — עמוד הנחיתה של המהדורה האנגלית. כתובת עצמאית, canonical לעצמה,
  // ובעלת יחס hreflang הדדי עם עמוד הבית העברי. בלי `lastModified`: אין לעמוד
  // תאריך-תוכן אמיתי, ולא ממציאים אחד.
  { path: "/en", priority: 0.9, changeFrequency: "monthly" },
  // „אהבה” — עמוד-הסמכות הרוחבי (hub) של אשכול-התוכן על אהבה וזוגיות.
  { path: "/love", priority: 0.9, changeFrequency: "monthly" },
  { path: "/before-relationship", priority: 0.8, changeFrequency: "monthly" },
  { path: "/building-relationship", priority: 0.8, changeFrequency: "monthly" },
  { path: "/inside-relationship", priority: 0.8, changeFrequency: "monthly" },
  { path: "/after-breakup", priority: 0.8, changeFrequency: "monthly" },
  { path: "/starting-again", priority: 0.8, changeFrequency: "monthly" },
  { path: "/preview", priority: 0.8, changeFrequency: "monthly" },
  // „המצפן” — חוויית שלוש-שאלות דטרמיניסטית, תמיד פעילה וניתנת לאינדוקס.
  { path: "/compass", priority: 0.6, changeFrequency: "monthly" },
  { path: "/author", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/shipping-returns", priority: 0.3, changeFrequency: "yearly" },
  { path: "/accessibility", priority: 0.2, changeFrequency: "yearly" },
  // אשכול-התוכן „לפני קשר” — ארבעה מדריכים ממוקדי-חיפוש. lastmod אמיתי מתוך
  // תאריך הפרסום של המאמר (ולא זמן ה-build), כדי שאות הרעננות יהיה נכון-תוכן.
  ...guideOrder.map((slug) => ({
    path: guides[slug].path,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    lastModified: guides[slug].datePublished,
  })),
  // עמודי-מושג /method/* — ההגדרות הקנוניות של הכלים המקוריים של הספר.
  ...methodOrder.map((slug) => ({
    path: methods[slug].path,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    lastModified: methods[slug].datePublished,
  })),
];

/**
 * `lastmod` נפלט אך ורק כשיש לו מקור-אמת בתוכן.
 *
 * קודם לכן עמודים ללא תאריך-תוכן נפלו לזמן ה-build, כלומר ה-`lastmod` שלהם
 * השתנה בכל פריסה גם כשהתוכן לא נגע. זהו אות-רעננות שקרי: הוא סותר את
 * `changefreq` שהעמודים עצמם מצהירים (עמודי המדיניות מצהירים `yearly` בזמן
 * שהתאריך התחלף מדי יום), ומנוע שמזהה תאריכים שמתחלפים ללא שינוי תוכן מפסיק
 * לתת אמון ב-`lastmod` של האתר כולו.
 *
 * פרוטוקול ה-Sitemap מגדיר את `lastmod` כאופציונלי, וההנחיה המפורשת היא
 * להשמיט אותו כשאין תאריך מדויק — לא לנחש. לכן: המדריכים ועמודי-המושג ממשיכים
 * לשאת את `datePublished` האמיתי שלהם, ושאר העמודים אינם נושאים `lastmod` כלל.
 * לא הומצא כאן שום תאריך, ולא נמחק שום תאריך אמיתי.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    ...(route.lastModified ? { lastModified: new Date(route.lastModified) } : {}),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
