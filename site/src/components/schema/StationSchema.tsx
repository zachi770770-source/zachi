import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

/**
 * Structured data לעמוד-תחנה. עמודי התחנות הם עמודי-תוכן ירוקי-עד (landing),
 * לא מאמרים מערכתיים מתוארכים — לכן `WebPage` הוא הסוג המדויק, ולא `Article`
 * (ש-Google מצפה עבורו ל-datePublished, ואנחנו לא ממציאים תאריכים). ה-
 * BreadcrumbList נשאר בלוק נפרד (BreadcrumbSchema). נתונים אמיתיים בלבד.
 */
export function StationSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name,
        description,
        url: `${siteConfig.url}${path}`,
        inLanguage: "he-IL",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${siteConfig.url}${siteConfig.images.cover}`,
        },
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.bookTitle,
          url: siteConfig.url,
        },
        about: { "@type": "Book", name: siteConfig.bookTitle },
        author: { "@type": "Person", name: siteConfig.author.name },
      }}
    />
  );
}
