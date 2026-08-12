import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * DefinedTerm — הישות של מושג/כלי מקורי מהספר (עמוד /method/*). מחוברת לישות
 * הספר דרך `@id` (הכלי הוא חלק מ„מדייטים לאהבה”), כך שמנועי-חיפוש ומערכות
 * אחזור AI מבינים שהמושג שייך לספר ולמחבר. משלים את ה-ArticleSchema של העמוד
 * (שמקשר author→Person, about→Book, isPartOf→WebSite).
 */
export function MethodSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  const url = `${siteConfig.url}${path}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": `${url}#term`,
        name,
        description,
        inLanguage: "he",
        url,
        // המושג שייך לאוסף-המושגים של הספר, שהוא-עצמו על אודות ישות ה-Book.
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: `הכלים של ${siteConfig.bookTitle}`,
          about: { "@id": entityId.book },
        },
        // נושא-של: הספר (קישור-ישות ישיר).
        subjectOf: { "@id": entityId.book },
      }}
    />
  );
}
