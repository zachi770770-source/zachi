import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

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
        // אותו מחבר (אותו `@id`) של הספר והאתר — כל התוכן מתחבר לישות-מחבר אחת.
        author: {
          "@type": "Person",
          "@id": entityId.person,
          name: siteConfig.author.name,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.bookTitle,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}${siteConfig.images.cover}`,
          },
        },
        // המאמר עוסק בישות הספר (אותו `@id`).
        about: { "@type": "Book", "@id": entityId.book, name: siteConfig.bookTitle },
        isPartOf: { "@id": entityId.website },
      }}
    />
  );
}
