import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/schema/JsonLd";
import { entityId } from "@/components/schema/ids";

/**
 * הישות הקנונית של המחבר (צחי חן), מוגדרת-במלואה ב-/author. נושאת `@id` יציב
 * כדי שכל אזכור של המחבר באתר (author של הספר, author של האתר, author של
 * המדריכים) יתחבר לאותה ישות אחת.
 *
 * הקשר „מחבר-של-הספר” מבוטא בצד הספר (Book.author → הישות הזו) — הכיוון הקנוני
 * ב-schema.org. `sameAs` נפלט *רק* כשיש פרופילים חיצוניים אמיתיים ומאומתים של
 * המחבר (siteConfig.author.sameAs) — הם מחברים את הישות למקורות מאמתים. כל עוד
 * אין — לא נפלט `sameAs` (אין המצאת אישוש/פרופילים). אין המצאת תארים/הסמכות/
 * מומחיות — רק שם, תיאור-עצמי אמיתי, תמונה וכתובת העמוד.
 */
export function PersonSchema() {
  const sameAs = siteConfig.author.sameAs.filter(Boolean);
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
        // הנושאים שהמחבר כותב עליהם בפועל. כל אחד מהם נתמך בתוכן קיים באתר,
        // ולכן זו הצהרה שניתן לאמת מול העמודים עצמם ולא רשימת מילות-מפתח:
        //   • דייטינג — /guide/dating-red-flags, /guide/finding-a-relationship
        //   • בחירת בן/בת זוג — /guide/choosing-a-partner, /guide/compatibility
        //   • בניית קשר זוגי — /guide/healthy-relationship, /building-relationship
        //   • תקשורת בזוגיות — /guide/couple-communication, /method/eye-level-talk
        //   • אהבה — /love
        // זו *אינה* הצהרת מומחיות, תואר או הסמכה: `knowsAbout` מתאר נושא-כתיבה,
        // וכל טענה מעבר לכך (פסיכולוג/מטפל/מוסמך) אינה נכונה ואינה נכתבת כאן.
        knowsAbout: [
          { "@type": "Thing", name: "דייטינג" },
          { "@type": "Thing", name: "בחירת בן/בת זוג" },
          { "@type": "Thing", name: "בניית קשר זוגי" },
          { "@type": "Thing", name: "תקשורת בזוגיות" },
          { "@type": "Thing", name: "אהבה" },
        ],
        // מקורות חיצוניים מאמתים — נפלט רק כשקיים לפחות אחד (אחרת מושמט לגמרי).
        ...(sameAs.length ? { sameAs: sameAs.length === 1 ? sameAs[0] : sameAs } : {}),
      }}
    />
  );
}
