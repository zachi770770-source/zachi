import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/before-relationship", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/building-relationship", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/inside-relationship", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/after-breakup", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/starting-again", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/preview", priority: 0.8, changeFrequency: "monthly" as const },
  // „המצפן” — חוויית שלוש-שאלות דטרמיניסטית, תמיד פעילה וניתנת לאינדוקס.
  { path: "/compass", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/author", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/shipping-returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/accessibility", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
