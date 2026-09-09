import type { Metadata } from "next";
import Link from "next/link";
import { BookX } from "lucide-react";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";

import "./globals.css";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

/**
 * 404 גלובלי — לכתובות שאינן תואמות שום מסלול.
 *
 * ── למה הקובץ הזה קיים ──────────────────────────────────────────────────
 * `not-found.tsx` רגיל מורכב מתוך ה-root layout, אבל מאז שפוצלנו לשני
 * root layouts (‎(he)‎ ו-‎(en)‎, כדי ש-‎/en יוגש עם lang="en" dir="ltr" אמיתי)
 * אין layout יחיד שאפשר להרכיב ממנו 404 גלובלי. התוצאה הייתה שקטה ואמיתית:
 * כתובת לא-קיימת החזירה את עמוד-ברירת-המחדל של Next — בלי מיתוג, בלי
 * `lang`/`dir`, ובלי דרך חזרה. זה נתפס ע"י `smoke.spec.ts` ותוקן כאן.
 *
 * זהו בדיוק המקרה ש-`global-not-found` נועד לו (ראו את התיעוד המקומי:
 * node_modules/next/dist/docs — „multiple root layouts”). הוא עוקף את
 * הרינדור הרגיל, ולכן הוא חייב לרנדר `<html>` משלו ולייבא בעצמו את
 * הסגנונות והגופנים.
 *
 * מכוון: אין כאן Header/Footer. הם רכיבי-לקוח עם ניווט מלא, וטעינתם בעמוד
 * שעוקף את שרשרת-הרינדור מוסיפה משקל ומסלולי-כשל למסך שכל תפקידו הוא לתת
 * דרך חזרה. שלוש דרכי-חזרה, וזהו. גם קישור-הרכישה כאן הוא ניווט פנימי אל
 * ‎/book#purchase ולא קישור-אמזון ישיר: `AmazonBuyLink` הוא רכיב-לקוח עם
 * מדידה, ואין סיבה לטעון אותו בשביל מסך-שגיאה.
 */

const bodyFont = Heebo({
  variable: "--font-body",
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const quoteFont = Frank_Ruhl_Libre({
  variable: "--font-literary",
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: `העמוד לא נמצא | ${siteConfig.bookTitle}`,
  description: "העמוד שחיפשתם אינו קיים, או שהקישור השתנה.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${bodyFont.variable} ${quoteFont.variable}`}
    >
      <body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
        <main className="flex-1">
          <Container className="flex flex-col items-center py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
              <BookX className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold">העמוד לא נמצא</h1>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-foreground-muted">
              נראה שהעמוד שחיפשתם לא קיים, או שהקישור השתנה. אפשר לחזור לעמוד
              הבית, לקרוא טעימה מהספר, או לעבור לעמוד הספר.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button asChild size="lg">
                <Link href="/">חזרה לעמוד הבית</Link>
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                <Button asChild variant="link" className="min-h-[44px]">
                  <Link href="/preview">לקריאת טעימה</Link>
                </Button>
                <Button asChild variant="link" className="min-h-[44px]">
                  <Link href="/book#purchase">לעמוד הספר</Link>
                </Button>
              </div>
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
