import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * הישות הקנונית של המחבר (צחי חן), מוגדרת-במלואה ב-/author. נושאת `@id` יציב
 * כדי שכל אזכור של המחבר באתר (author של הספר, author של האתר, author של
 * המדריכים) יתחבר לאותה ישות אחת.
 *
 * הקשר „מחבר-של-הספר” מבוטא בצד הספר (Book.author → הישות הזו) — הכיוון הקנוני
 * ב-schema.org. כאן מוסיפים גם `worksFor`/`sameAs`? לא: אין ארגון מאמת ואין
 * פרופילים חיצוניים מאומתים, ולכן אין `sameAs` (רק פרופילים אמיתיים מאומתים).
 * אין המצאת תארים/הסמכות/מומחיות — רק שם, תיאור-עצמי אמיתי, וכתובת העמוד.
 */
export function PersonSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": entityId.person,
        name: siteConfig.author.name,
        description: siteConfig.author.shortBio,
        url: `${siteConfig.url}/author`,
        mainEntityOfPage: `${siteConfig.url}/author`,
        image: `${siteConfig.url}${siteConfig.author.photo}`,
      }}
    />
  );
}
