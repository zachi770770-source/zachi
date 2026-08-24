import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { RecognitionBeat } from "@/components/sections/RecognitionBeat";
import { HomePathSelector } from "@/components/sections/HomePathSelector";
import { AuthorNote } from "@/components/sections/AuthorNote";
import { WhyTheBook } from "@/components/sections/WhyTheBook";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { StickyCta } from "@/components/interactive/StickyCta";
import { BuildSpine } from "@/components/shared/BuildSpine";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { LanguageHint } from "@/components/layout/LanguageHint";
import { BookSchema } from "@/components/schema/BookSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";

export const metadata = pageMetadata({
  title: `${siteConfig.bookTitle}: ספר מעשי לדייטינג ולזוגיות | ${siteConfig.author.name}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
  // יחס-שפה הדדי מול /en. `x-default` מצביע לעברית במכוון: זו שפת האתר
  // הראשית ועמוד הבית העברי הוא הכתובת הקנונית ההיסטורית — כלומר זו באמת
  // הגרסה שמוצגת כשאין התאמת-שפה, ולא הצהרה נוחה.
  languages: { he: "/", en: "/en", "x-default": "/" },
});

/**
 * עמוד הבית — קשת רגשית אחת: סקרנות → זיהוי → אמון → רצון → פעולה.
 *
 *   1. Hero — ההצעה, הכריכה, והפעולה הראשית (טעימה חינם, בלי הרשמה).
 *   2. RecognitionBeat — „זה מדבר עליי”, ואז קול הספר עצמו בציטוט אמיתי.
 *   3. HomePathSelector — ארבע התחנות, כל אחת קישור אחד לעמוד-המסע שלה.
 *   4. AuthorNote — מי כתב את זה ולמה, בקולו שלו, כולל הגבול („לא טיפול”).
 *   5. WhyTheBook — למה ספר, כשהאתר כבר נותן הרבה: נקודות כניסה מול מסע מסודר.
 *   6. NewsletterSection — רכישת הספר באמזון, אחרי שנבנתה סיבה לרצות אותו.
 *
 * האמון קודם לרצון בכוונה: קשה לרצות את הספר לפני שיש סיבה לסמוך על מי שכתב
 * אותו. וכך גם המשפט האחרון לפני הבקשה הוא הטיעון עצמו („האתר עונה על שאלה.
 * הספר מלווה תהליך.”) ולא היכרות שמרחיקה אותו מרגע הפעולה.
 *
 * היררכיית הפעולות מכוונת לפי מוכנות: הטעימה היא הפעולה הראשית (סיכון אפס),
 * התחנות הן הכניסה לעומק, „שאל את הספר” הוא כלי, והרכישה סוגרת — ונשארת נגישה
 * תמיד בכותרת למי שכבר מוכן.
 */
export default function HomePage() {
  return (
    <>
      <ViewEvent event="home_viewed" />
      {/* רמיזה לא-הורסת לדוברי אנגלית. אינה מנתבת ואינה משנה תוכן — ראו
          ההסבר ב-LanguageHint על למה לא הפניית Accept-Language. */}
      <LanguageHint />
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      {/* מסמן-פריסה בלבד: מצהיר שבעמוד הזה יושבים פקדים צפים בתחתית, ולכן
          הפוטר צריך לשמור להם מקום (ראו `--floating-ui-clearance` ב-globals).
          `hidden` ⇒ display:none, אפס השפעה על הפריסה, ו-`:has()` עדיין מוצא
          אותו. מוצהר במפורש ולא נגזר מ-`.s2b`/`.build-spine` — אלה תלויי-תנועה
          ותלויי-breakpoint, והריווח חייב להתקיים גם כשהם לא. עמוד שיוסיף בעתיד
          פקדים צפים משלו יוסיף את אותו מסמן. */}
      <div data-floating-ui-page hidden />
      <BuildSpine />
      <Hero />
      {/* הקשת הרגשית: סקרנות (Hero) → זיהוי → בחירת תחנה → אמון → רצון → פעולה.
          כל ביט כאן נוסף כדי לסגור חוסר אמיתי, לא כדי להוסיף עוד סקשן. */}
      <RecognitionBeat />
      <HomePathSelector />
      <AuthorNote />
      <WhyTheBook />
      <NewsletterSection />
      <StickyCta />
    </>
  );
}
