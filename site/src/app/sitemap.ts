import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { guideOrder, guides } from "@/content/guides";

type SitemapRoute = {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
  /** ISO אמיתי כשקיים תאריך-תוכן; אחרת נופל לזמן ה-build (רעננות הפריסה). */
  lastModified?: string;
};

const staticRoutes: SitemapRoute[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" },
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  // זמן ה-build משמש כברירת-מחדל לעמודים ללא תאריך-תוכן ייעודי (עמודי שיווק
  // המתעדכנים בין פריסות). עמודי-תוכן מתוארכים (מדריכים) נושאים lastmod אמיתי.
  const buildTime = new Date();
  return staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: route.lastModified ? new Date(route.lastModified) : buildTime,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
