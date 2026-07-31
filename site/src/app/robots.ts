import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // robots.txt זהה בכל הסביבות: מתיר סריקה ומצביע ל-sitemap. הרחקת Preview
  // מהאינדוקס נעשית דרך meta robots=noindex,nofollow (ראו layout), כדי
  // שגוגל *יוכל* לסרוק ולראות את ה-noindex — חסימה ב-robots.txt הייתה מונעת
  // זאת ומהווה אנטי-דפוס.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout", "/checkout/pay/", "/thank-you"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
