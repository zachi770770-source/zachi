import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout", "/checkout/pay/", "/thank-you"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
