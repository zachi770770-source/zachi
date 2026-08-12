import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * WebSite structured data — האתר הרשמי של הספר. נושא `@id` יציב, מקשר את המחבר
 * דרך `@id` (אותה ישות Person), ומצהיר שהאתר עוסק בספר דרך `about` → `@id` של
 * הישות Book. כך נבנה הקשר „האתר הרשמי של מדייטים לאהבה מאת צחי חן”.
 *
 * ללא SearchAction — אין חיפוש פנימי באתר, ואין להצהיר על יכולת שאינה קיימת.
 */
export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": entityId.website,
        name: siteConfig.bookTitle,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "he",
        author: {
          "@type": "Person",
          "@id": entityId.person,
          name: siteConfig.author.name,
        },
        // האתר עוסק בספר — קישור-ישות ל-Book (הדדי ל-Book.isPartOf).
        about: { "@id": entityId.book },
      }}
    />
  );
}
