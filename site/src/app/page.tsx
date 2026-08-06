import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { HomeStations } from "@/components/sections/HomeStations";
import { HomeWhyDifferent } from "@/components/sections/HomeWhyDifferent";
import { CompassLauncher } from "@/components/compass/CompassLauncher";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { StickyCta } from "@/components/interactive/StickyCta";
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
 * עמוד הבית = דף קצר וממוקד. חמישה חלקים בלבד, בלי כפילות מסר/‏CTA וללא שכפול
 * מול הדפים הייעודיים:
 *
 *   1. Hero — כותרת, משפט הסבר אחד, מחיר, פעולה ראשית „קראו טעימה מהספר”
 *      ופעולה משנית „שאל את הספר”.
 *   2. „שלוש תחנות ושער מעבר אחד” — אזור קומפקטי אחד, ארבעה כרטיסים קצרים.
 *   3. „למה הספר שונה” — שלושה יתרונות מעשיים וקישור ל-/book.
 *   4. רשימת המתנה (טופס ההרשמה).
 *   5. Footer (ברמת ה-layout).
 *
 * המנוע „שאל את הספר” נשאר זמין כגלולה צפה (CompassLauncher) בלבד — הוא אינו
 * מוטמע שוב בגוף העמוד. כל העומק חי בדפים הייעודיים: השיטה והכלים ב-/book,
 * הקורא וההצצה המלאה ב-/preview, הסיפור האישי ב-/author, המנוע המלא ב-/compass.
 */
export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <BuildSpine />
      <Hero />
      <HomeStations />
      <HomeWhyDifferent />
      <NewsletterSection />
      <CompassLauncher />
      <StickyCta />
    </>
  );
}
