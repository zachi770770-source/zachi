import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * Structured data לעמוד-תחנה. עמודי התחנות הם עמודי-תוכן ירוקי-עד (landing),
 * לא מאמרים מערכתיים מתוארכים — לכן `WebPage` הוא הסוג המדויק, ולא `Article`
 * (ש-Google מצפה עבורו ל-datePublished, ואנחנו לא ממציאים תאריכים). ה-
 * BreadcrumbList נשאר בלוק נפרד (BreadcrumbSchema). נתונים אמיתיים בלבד.
 *
 * חיבור-ישויות: ה-WebPage מקבל `@id` יציב משלו, ו-`isPartOf`/`about`/`author`
 * מפנים ב-`@id` אל אותן ישויות קנוניות שמוגדרות-במלואן בבית/‏/book/‏/author
 * (WebSite/Book/Person). כך /love, עמודי-המסע ו-/starting-again מתחברים לגרף
 * האחד של „מדייטים לאהבה” מאת צחי חן, ולא יוצרים צמתים אנונימיים כפולים.
 */
export function StationSchema({
  name,
  description,
  path,
  topic,
}: {
  name: string;
  description: string;
  path: string;
  /**
   * הנושא הרוחבי שהעמוד עוסק בו, כשיש כזה — כרגע רק שני עמודי-האב: /love
   * עוסק ב„אהבה” ו-/dating ב„דייטים”. כשנמסר, הוא נוסף ל-`about` לצד הספר,
   * וכך העמוד מצהיר על *שני* דברים נכונים: שהוא חלק מהספר, ומה הנושא שלו.
   * בלי זה כל עמודי-התוכן הצהירו שהם „על הספר” בלבד, ושום עמוד לא נקשר
   * לנושא שהוא למעשה עמוד-האב שלו. עמודי-התחנה אינם מוסרים ערך: הם שלבים
   * במסע ולא נושאים עצמאיים.
   */
  topic?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${siteConfig.url}${path}#webpage`,
        name,
        description,
        url: `${siteConfig.url}${path}`,
        inLanguage: "he-IL",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${siteConfig.url}${siteConfig.images.cover}`,
        },
        // הפניות ב-@id אל הישויות הקנוניות (מוגדרות-במלואן בבית/‏/book/‏/author).
        isPartOf: {
          "@type": "WebSite",
          "@id": entityId.website,
          name: siteConfig.bookTitle,
          url: siteConfig.url,
        },
        about: topic
          ? [
              { "@type": "Book", "@id": entityId.book, name: siteConfig.bookTitle },
              { "@type": "Thing", name: topic },
            ]
          : { "@type": "Book", "@id": entityId.book, name: siteConfig.bookTitle },
        author: { "@type": "Person", "@id": entityId.person, name: siteConfig.author.name },
      }}
    />
  );
}
