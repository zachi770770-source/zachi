import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * הישות הקנונית של הספר („מדייטים לאהבה”). נושאת `@id` יציב, ומצהירה במפורש
 * על המחבר דרך הפניה ל-`@id` של הישות Person (הכיוון הקנוני של „author-of”).
 * כך המחבר והספר מתחברים לגרף אחד גם כשהצמתים מרונדרים בעמודים שונים.
 *
 * נתונים אמיתיים בלבד: שם, תיאור, שפה, פורמט (eBook), קהל-היעד (נגזר מהתיאור
 * האמיתי), כריכה, וכתובת עמוד-הספר. אין ISBN מומצא. כשהספר זמין באמזון מצורפים
 * זמינות, כתובת המוצר החיצונית, וה-ASIN האמיתי כמזהה — ללא מחיר מומצא.
 */
export function BookSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Book",
        "@id": entityId.book,
        name: siteConfig.bookTitle,
        description: siteConfig.description,
        inLanguage: "he",
        bookFormat: "https://schema.org/EBook",
        image: `${siteConfig.url}${siteConfig.images.cover}`,
        url: `${siteConfig.url}/book`,
        mainEntityOfPage: `${siteConfig.url}/book`,
        // הקשר המרכזי: הספר → מחבר → ישות Person (אותו `@id` שמוגדר ב-/author).
        author: {
          "@type": "Person",
          "@id": entityId.person,
          name: siteConfig.author.name,
        },
        // קהל-היעד — סיכום אמיתי של התיאור (שלוש התחנות), לא טענת-שוק מומצאת.
        audience: {
          "@type": "Audience",
          audienceType: "רווקים, גרושים וזוגות בדרך לאהבה",
        },
        // האתר הרשמי של הספר — קישור-ישות הדדי ל-WebSite.
        isPartOf: { "@id": entityId.website },
        // הספר זמין לרכישה במהדורת Kindle באמזון. ללא מחיר מומצא — מציינים
        // זמינות, כתובת המוצר החיצונית, וה-ASIN האמיתי כמזהה (מקור: siteConfig.amazon).
        ...(siteConfig.amazon.available
          ? {
              sameAs: siteConfig.amazon.url,
              identifier: {
                "@type": "PropertyValue",
                propertyID: "ASIN",
                value: siteConfig.amazon.asin,
              },
              offers: {
                "@type": "Offer",
                availability: "https://schema.org/InStock",
                url: siteConfig.amazon.url,
              },
            }
          : {}),
      }}
    />
  );
}
