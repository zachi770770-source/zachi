import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { HomePathSelector } from "@/components/sections/HomePathSelector";
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
 * עמוד הבית = gateway אישי וקצר, לא קטלוג. שלושה אזורים בלבד:
 *
 *   1. Hero — כותרת, משפט הסבר אחד, פעולה ראשית „קראו טעימה מהספר”
 *      ופעולה משנית „שאל את הספר”, ושורת מחיר קטנה.
 *   2. „איפה זה פוגש אותך עכשיו?” — בחירה דטרמיניסטית מקומית של אחד מארבעה
 *      מצבים; התוכן הרלוונטי בלבד נפתח במקום (שכבת „פרק ב’” אופציונלית).
 *   3. סיום + רשימת המתנה.
 *
 * לפני בחירה העמוד שימושי לחלוטין (Hero → מצבים → הרשמה); אחרי בחירה נפתח
 * בלוק התוכן בין המצבים לבין ההרשמה. „שאל את הספר” נשאר כגלולה צפה (המנוע
 * העמוק), ולא מנוע שני. כל העומק חי בדפים הייעודיים (/book, התחנות, /preview,
 * /author, /compass) — הבית רק מכוון אליהם.
 */
export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <BuildSpine />
      <Hero />
      <HomePathSelector />
      <NewsletterSection />
      <CompassLauncher />
      <StickyCta />
    </>
  );
}
