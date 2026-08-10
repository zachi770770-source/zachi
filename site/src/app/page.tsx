import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { HomePathSelector } from "@/components/sections/HomePathSelector";
import { TrustBand } from "@/components/sections/TrustBand";
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
 * עמוד הבית = gateway אישי וקצר, לא קטלוג. ארבעה אזורים קומפקטיים:
 *
 *   1. Hero — כותרת, משפט הסבר אחד, שורת מחיר+סטטוס („המהדורה הדיגיטלית
 *      המלאה · תושק ב-98 ₪” — פורמט, טרם-לרכישה, מחיר), פעולה ראשית „קראו
 *      טעימה מהספר” ופעולה משנית „מה הספר אומר על המצב שלי?” עם שורת-הסבר קצרה.
 *   2. „איפה זה פוגש אותך עכשיו?” — שער אמיתי לארבע חוויות. כל בחירה היא
 *      *ניווט* לעמוד-המסע הייעודי (Landing אישי: /before-relationship,
 *      /building-relationship, /inside-relationship, /after-breakup). אין עוד
 *      result-panel שנפתח בבית — הבחירה מכניסה מיד לחוויה, והבית נשאר קצר ושער.
 *   3. רצועת-אמון עובדתית (TrustBand) — שורה דחוסה אחת: כלים מעשיים, גישה
 *      אנושית, הגבול („לא טיפול/אבחון”) וקישור שקט למחבר. לא section, ואין
 *      המלצות/דירוגים מזויפים בטרום-השקה.
 *   4. סיום — „הספר המלא זמין עכשיו באמזון” + „לרכישה באמזון” (ערוץ הרכישה היחיד).
 *
 * לפני בחירה העמוד שימושי לחלוטין (Hero → מצבים → אמון → הרשמה); אחרי בחירה
 * נפתח בלוק התוכן בין המצבים לבין רצועת-האמון. „שאל את הספר” נשאר כגלולה צפה
 * (המנוע העמוק), ולא מנוע שני. כל העומק חי בדפים הייעודיים (/book, התחנות,
 * /preview, /author, /compass) — הבית רק מכוון אליהם.
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
      <TrustBand />
      <NewsletterSection />
      <StickyCta />
    </>
  );
}
