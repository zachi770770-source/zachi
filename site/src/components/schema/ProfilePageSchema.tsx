import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * ProfilePage — מצהיר ש-/author הוא עמוד-הפרופיל של ישות ה-Person הקנונית.
 *
 * לא מוסיף אף עובדה חדשה על המחבר: `mainEntity` מפנה ב-`@id` אל ה-Person
 * שמוגדר-במלואו ב-PersonSchema, וכל שאר השדות הם כתובת העמוד, שפתו והאתר.
 * אין `dateCreated`/`dateModified` — אין לעמוד תאריך-תוכן אמיתי, ולא ממציאים.
 */
export function ProfilePageSchema() {
  const url = `${siteConfig.url}/author`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": `${url}#profilepage`,
        url,
        inLanguage: "he",
        mainEntity: { "@id": entityId.person },
        isPartOf: { "@id": entityId.website },
      }}
    />
  );
}
