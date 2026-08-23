import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

const edition = siteConfig.englishEdition;

/** `@id` נפרד למהדורה האנגלית — מהדורה אחרת, לא אותה ישות ספר. */
const englishBookId = `${siteConfig.url}/en#book`;
const englishPageId = `${siteConfig.url}/en#webpage`;

/**
 * הגרף של המהדורה האנגלית ב-/en.
 *
 * שתי הכרעות שחשוב להבין:
 *
 * 1. **`@id` נפרד לספר.** המהדורה האנגלית היא מוצר אחר: ASIN אחר, שם אחר,
 *    שפה אחרת. שימוש חוזר ב-`entityId.book` (הספר העברי) היה ממזג שתי
 *    מהדורות לישות אחת עם שדות סותרים. לכן `/en#book`, ו-`workExample`/
 *    `exampleOfWork` לא נטענים כאן — הקשר בין המהדורות לא אומת רשמית.
 *
 * 2. **אותו `@id` למחבר.** זה אותו אדם, ולכן אותה ישות: `entityId.person`.
 *    ה-`name` ניתן באיות האנגלי של המהדורה, ו-`alternateName` נושא את האיות
 *    העברי — כך מנוע-חיפוש מחבר את שתי הצורות לאדם אחד במקום להמציא שניים.
 *
 * אין כאן ISBN (ה-ISBN שנמצא בחיפוש שייך לספר *אחר* של אותו מחבר), אין מו"ל,
 * אין דירוגים, אין ביקורות ואין תארים. `offers` נושא זמינות וכתובת בלבד —
 * בלי מחיר, ובלי לרמוז שזאכי.co.il הוא הסוחר.
 */
export function EnglishEditionSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Book",
            "@id": englishBookId,
            name: edition.title,
            alternativeHeadline: edition.subtitle,
            description:
              "A practical guide to choosing the right partner, recognising red flags, and building a healthy relationship.",
            inLanguage: "en",
            bookFormat: "https://schema.org/EBook",
            url: `${siteConfig.url}/en`,
            mainEntityOfPage: `${siteConfig.url}/en`,
            about: [
              { "@type": "Thing", name: "Dating" },
              { "@type": "Thing", name: "Choosing a partner" },
              { "@type": "Thing", name: "Building a relationship" },
              { "@type": "Thing", name: "Communication in relationships" },
            ],
            author: {
              "@type": "Person",
              "@id": entityId.person,
              name: edition.author,
              alternateName: siteConfig.author.name,
            },
            isPartOf: { "@id": entityId.website },
            sameAs: edition.url,
            identifier: {
              "@type": "PropertyValue",
              propertyID: "ASIN",
              value: edition.asin,
            },
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/InStock",
              url: edition.url,
            },
          },
          {
            "@type": "WebPage",
            "@id": englishPageId,
            url: `${siteConfig.url}/en`,
            name: `${edition.title} — ${edition.author}`,
            inLanguage: "en",
            isPartOf: { "@id": entityId.website },
            mainEntity: { "@id": englishBookId },
          },
        ],
      }}
    />
  );
}
