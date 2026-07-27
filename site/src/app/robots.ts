import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // „/checkout/pay/” נפתח בכוונה (כלל ספציפי יותר גובר על „/checkout”)
      // כדי שהסורק יגיע אליו ויקרא את הנחיית noindex (X-Robots-Tag). בלי
      // זה, חסימת הסריקה הייתה מונעת מהסורק לראות את ה-noindex כלל.
      allow: ["/", "/checkout/pay/"],
      disallow: ["/api/", "/checkout", "/thank-you"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
