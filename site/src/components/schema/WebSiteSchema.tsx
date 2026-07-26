import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

/**
 * WebSite structured data. ללא SearchAction — אין חיפוש פנימי באתר, ואין
 * להצהיר על יכולת שאינה קיימת. כולל שם, כתובת, שפה ומחבר אמיתי בלבד.
 */
export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.bookTitle,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "he",
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
        },
      }}
    />
  );
}
