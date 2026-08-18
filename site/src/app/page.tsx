import Link from "next/link";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { Hero } from "@/components/sections/Hero";
import { HomePathSelector } from "@/components/sections/HomePathSelector";
import { TrustBand } from "@/components/sections/TrustBand";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { StickyCta } from "@/components/interactive/StickyCta";
import { BuildSpine } from "@/components/shared/BuildSpine";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { ViewEvent } from "@/components/analytics/ViewEvent";
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
      <ViewEvent event="home_viewed" />
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <BuildSpine />
      <Hero />
      <HomePathSelector />
      <TrustBand />
      {/* מסלול-הקשר יחיד ומרוסן אל עמוד-הסמכות „אהבה” (לא ב-Hero, נמוך בעמוד).
          מרחיב את תזת ה-Hero („אהבה בונים”) אל ההסבר המלא. לא בלוק ולא כרטיס. */}
      <Container className="pt-2 sm:pt-4">
        <p className="mx-auto max-w-2xl text-center text-[14px] leading-relaxed text-foreground-muted">
          רוצים להתחיל מהבסיס?{" "}
          <Link
            href="/love"
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            מהי אהבה ואיך היא נבנית
          </Link>
        </p>
      </Container>
      {/* מעבר-חתימה „מחיפוש לבנייה”: סוגר את הקשת הרגשית של העמוד (חיפוש ⟶
          זיהוי ⟶ הבנה ⟶ בנייה) ומוביל אל רגע-הבנייה הסוגר. רגע-מותג אחד. */}
      <div className="flex justify-center pt-2 sm:pt-4" aria-hidden="true">
        <SignatureMark />
      </div>
      <NewsletterSection />
      <StickyCta />
    </>
  );
}
