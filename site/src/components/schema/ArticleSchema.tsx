import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";

/**
 * Article structured data לעמודי התוכן (תחנות/שער). נתונים אמיתיים בלבד:
 * כותרת, תיאור, מחבר, ומזהה-העמוד. אין תאריכי פרסום מומצאים ואין דירוגים —
 * מה שאין באמת, לא מסומן. התמונה היא עטיפת הספר הקיימת.
 */
export function ArticleSchema({
  headline,
  description,
  path,
}: {
  headline: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        author: { "@type": "Person", name: siteConfig.author.name },
        publisher: { "@type": "Person", name: siteConfig.author.name },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteConfig.url}${path}`,
        },
        inLanguage: "he-IL",
      }}
    />
  );
}
