import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ThesisMotifSection } from "@/components/sections/ThesisMotifSection";
import { HubTeaser } from "@/components/sections/HubTeaser";
import { AuthorTeaser } from "@/components/sections/AuthorTeaser";
import { Testimonials } from "@/components/sections/Testimonials";
import { CompassLauncher } from "@/components/compass/CompassLauncher";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { StationJourney } from "@/components/interactive/StationJourney";
import { StickyCta } from "@/components/interactive/StickyCta";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";
import { BuildSpine } from "@/components/shared/BuildSpine";
import { BookSchema } from "@/components/schema/BookSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";

export const metadata = pageMetadata({
  title: `${siteConfig.bookTitle}: ספר מעשי לדייטינג ולזוגיות | ${siteConfig.author.name}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

/**
 * עמוד הבית = מסלול עריכתי קצר וממוקד (לא הדף המלא). כל סקשן ממלא תפקיד יחיד
 * ומוביל הלאה, בלי לחזור על אותו מסר/‏CTA וללא כפילות מול הדפים הייעודיים:
 *
 *   1. Hero — מה/למי/הבטחה/פעולה ראשית (הרשמה לעדכון ההשקה).
 *   2. Search→Build — סצנת החתימה (התזה, אות-אחר-אות).
 *   3. Path Finder — 3 תחנות + ניתוב אישי (#where) — נקודת האינטראקציה.
 *   4. הצצה לספר/כלים → /book.
 *   5. הצצה לטעימה → /preview.
 *   6. מילת המחבר הקצרה → /author.
 *   7. הרשמה לעדכון ההשקה.
 *
 * כל העומק חי בדפים הייעודיים ולא משוכפל כאן: השיטה המלאה וששת הכלים ב-/book,
 * הקורא וההצצה המלאה ב-/preview, הסיפור האישי המלא ב-/author, ממשק המצפן המלא
 * ב-/compass (בבית — רק המשגר הצף כהזמנה קצרה), ושאלות ותשובות ב-/faq.
 * ההמלצות מרונדרות רק כשיש שלוש מאושרות (אחרת null — נשאר מוסתר עד לנכסים אמיתיים).
 */
export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <BuildSpine />
      <Hero />
      <ThesisMotifSection />
      <StationJourney />
      {/* הצצה לספר + כלים — השיטה המלאה וששת הכלים (ToolsBento) חיים ב-/book. */}
      <HubTeaser
        id="book-teaser"
        kicker="כלים, לא רק רעיון"
        heading="שיטה מעשית וכלים לכל תחנה בקשר"
        text="שיטה בת שלושה שלבים וכלים לשימוש חוזר — לא רק רעיון. כולם מרוכזים בעמוד הספר."
        href="/book"
        linkLabel="לעמוד הספר המלא"
      />
      {/* הצצה לטעימה — ההצצה האינטראקטיבית והקורא המלא חיים ב-/preview. */}
      <HubTeaser
        id="sample-teaser"
        kicker="הצצה לספר"
        heading="כמה שורות, כדי שתדעו לאן אתם נכנסים"
        text="עטיפה, מבנה, קטע לקריאה וכלי מעשי אחד — ההצצה המלאה מחכה בעמוד הטעימה."
        href="/preview"
        linkLabel="לקריאת הטעימה"
      />
      <AuthorTeaser />
      <Testimonials />
      <NewsletterSection />
      <CompassLauncher
        salesOpen={siteConfig.salesOpen}
        maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
      />
      <StickyCta />
    </>
  );
}
