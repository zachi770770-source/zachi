import { Heebo, Frank_Ruhl_Libre } from "next/font/google";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { Analytics } from "@vercel/analytics/next";
import { MotionRoot } from "@/components/shared/MotionRoot";
import { PersonaProvider } from "@/components/persona/PersonaProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";

/**
 * מעטפת-המסמך המשותפת לשני ה-root layouts.
 *
 * ── למה שני root layouts בכלל ─────────────────────────────────────────────
 *
 * קודם היה root layout יחיד שמרנדר תמיד `<html lang="he" dir="rtl">`, וסקריפט
 * חוסם קטן תיקן את זה ל-en/ltr ב-`/en` לפני הצביעה. זה עבד ויזואלית, אבל
 * ה-HTML *שהשרת שולח* עדיין הכריז על עמוד אנגלי כעל עמוד עברי מימין-לשמאל.
 * זה נכשל בדיוק במקומות שבהם זה חשוב: סורקים ומנועי-חיפוש שקוראים את ה-HTML
 * הראשוני, קוראי-מסך שקובעים שפת-הקראה ממנו, ותרגום-אוטומטי של הדפדפן. וללא
 * JS — הוא לא היה מתוקן כלל.
 *
 * הפתרון הוא מה ש-Next מגדיר לשם כך: שני root layouts דרך route groups —
 * `(he)` ו-`(en)`. שמות-הקבוצות בסוגריים אינם משפיעים על ה-URL, ולכן שום
 * כתובת לא השתנתה. כל קבוצה מרנדרת `<html>` משלה עם ה-lang/dir הנכונים,
 * בשרת, בצביעה הראשונה. סקריפט-האתחול נמחק, וכך גם `LocaleDocument` שסנכרן
 * את ה-DOM בניווט — מעבר בין שני root layouts הוא ממילא טעינת-עמוד מלאה.
 *
 * הגופנים מוגדרים כאן, פעם אחת: הגדרה כפולה בשני ה-layouts הייתה מייצרת שתי
 * בקשות-גופן נפרדות לאותם קבצים.
 */

const bodyFont = Heebo({
  variable: "--font-body",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// גופן הכותרות/ציטוט (serif). preload:false בכוונה: כל צרכניו הם או מתחת-לקיפול
// (סצנת התזה, מחבר) או כותרת-הירו שנחשפת דרך אנימציית-מסכה (display:swap מציג
// serif חלופי בינתיים) — כך שאינו על הנתיב הקריטי של ה-LCP (תווית ה-Heebo הגלויה
// בירו). ביטול ה-preload שלו משחרר רוחב-פס לקבצי ה-Heebo הקריטיים ל-LCP.
const quoteFont = Frank_Ruhl_Libre({
  variable: "--font-literary",
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
  preload: false,
});

export function SiteDocument({
  lang,
  dir,
  children,
}: {
  lang: "he" | "en";
  dir: "rtl" | "ltr";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${bodyFont.variable} ${quoteFont.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
        <PersonaProvider>
          <MotionRoot />
          <SkipToContent />
          {/* הקליפה השיווקית מוסתרת בלוח-הבקרה הניהולי (/admin). */}
          <SiteChrome>
            <Header />
          </SiteChrome>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteChrome>
            <Footer />
            {/* ה-CompassLauncher (בועה צפה בכל עמוד) הוסר.
                שלוש סיבות שנמדדו, לא הועדפו:
                  • הוא הופיע גם בתוך /preview — חוויית קריאה שכל כולה שקט.
                  • במובייל הוא ישב יחד עם בר-הטעימה מעל ה-CTA הסוגר של עמוד
                    הבית והסתיר את „עוד לא בטוחים? קראו טעימה מהספר”.
                  • שני הצפים יחד תפסו ~13% מגובה מסך של 844px.
                הכלי עצמו לא הוסר — הוא נכנס דרך `DeeperEntry` ודרך הפוטר.
                נותרה שכבה צפה אחת בכל האתר: הסכמת-העוגיות. */}
            <CookieConsent />
          </SiteChrome>
          <AnalyticsScripts />
          {/* Vercel Web Analytics — נטען פעם אחת ברמת ה-root, ורק בפרודקשן של
              Vercel (שם מוגש /_vercel/insights/script.js). מזריק את הסקריפט
              ושולח pageviews ל-Vercel; cookieless ונפרד לחלוטין מ-GA/GTM/Meta
              (AnalyticsScripts). מגודר ב-VERCEL_ENV=production — אותה אמת-מידה
              של robots — כדי לא לטעון 404 מקומית/ב-CI/בתצוגות-preview. */}
          {process.env.VERCEL_ENV === "production" ? <Analytics /> : null}
        </PersonaProvider>
      </body>
    </html>
  );
}
