import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * Article structured data למאמרי המדריך (cluster „לפני קשר”). בניגוד לעמודי
 * התחנות (WebPage, ללא תאריכים), מאמר הוא תוכן מתוארך אמיתי — ולכן `Article`
 * עם `datePublished`/`dateModified` אמיתיים (מתוך נתוני המאמר), מחבר אמיתי
 * (צחי חן), ושיוך לספר. אין נתונים מומצאים — ולכן גם אין publisher.
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
        // אין `publisher` בכוונה. בעבר נפלט כאן Organization בשם הספר עם כריכת
        // הספר כלוגו — ישות שאינה קיימת: אין הוצאה או ארגון מוגדרים מאחורי
        // האתר. השדה אופציונלי ב-Article, והמחבר (Person) הוא הישות האמיתית.
        // המאמר עוסק בישות הספר (אותו `@id`).
        about: { "@type": "Book", "@id": entityId.book, name: siteConfig.bookTitle },
        isPartOf: { "@id": entityId.website },
      }}
    />
  );
}
