import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

/**
 * Article structured data למאמרי המדריך (cluster „לפני קשר”). בניגוד לעמודי
 * התחנות (WebPage, ללא תאריכים), מאמר הוא תוכן מתוארך אמיתי — ולכן `Article`
 * עם `datePublished`/`dateModified` אמיתיים (מתוך נתוני המאמר), מחבר אמיתי
 * (צחי חן), ושיוך לספר. אין נתונים מומצאים.
 */
export function ArticleSchema({
  headline,
  description,
  path,
  datePublished,
  dateModified,
}: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  const url = `${siteConfig.url}${path}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        inLanguage: "he-IL",
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        datePublished,
        dateModified: dateModified ?? datePublished,
        author: { "@type": "Person", name: siteConfig.author.name },
        publisher: {
          "@type": "Organization",
          name: siteConfig.bookTitle,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}${siteConfig.images.cover}`,
          },
        },
        about: { "@type": "Book", name: siteConfig.bookTitle },
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.bookTitle,
          url: siteConfig.url,
        },
      }}
    />
  );
}
