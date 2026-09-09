import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, BookX } from "lucide-react";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";

import "./globals.css";
import { siteConfig } from "@/config/site";
import { LOCALE_HEADER } from "@/proxy";
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
 * ── דו-לשוני ────────────────────────────────────────────────────────────
 * הקובץ הזה עוקף את שרשרת-הרינדור ולכן אינו מקבל את הנתיב המבוקש. בגרסה
 * הראשונה הוא רינדר `lang="he" dir="rtl"` קבוע, וכתובת לא-קיימת תחת ‎/en
 * החזירה 404 *בעברית מימין-לשמאל* — בדיוק הכשל שהפיצול לשני root layouts בא
 * לתקן. ה-proxy מסמן בקשות ‎/en בכותרת (`LOCALE_HEADER`), וכאן נקבעים לפיה
 * ה-lang, ה-dir, הטקסט ודרך-החזרה. קריאת headers הופכת את העמוד לדינמי —
 * מקובל לחלוטין בעמוד שגיאה.
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

const COPY = {
  he: {
    lang: "he" as const,
    dir: "rtl" as const,
    title: "העמוד לא נמצא",
    metaTitle: `העמוד לא נמצא | ${siteConfig.bookTitle}`,
    metaDescription: "העמוד שחיפשתם אינו קיים, או שהקישור השתנה.",
    body: "נראה שהעמוד שחיפשתם לא קיים, או שהקישור השתנה. אפשר לחזור לעמוד הבית, לקרוא טעימה מהספר, או לעבור לעמוד הספר.",
    home: { href: "/", label: "חזרה לעמוד הבית" },
    links: [
      { href: "/preview", label: "לקריאת טעימה" },
      { href: "/book#purchase", label: "לעמוד הספר" },
    ],
  },
  en: {
    lang: "en" as const,
    dir: "ltr" as const,
    title: "Page not found",
    metaTitle: `Page not found | ${siteConfig.englishEdition.title}`,
    metaDescription: "The page you were looking for doesn’t exist, or the link has changed.",
    body: "The page you were looking for doesn’t exist, or the link has changed.",
    home: { href: "/en", label: `Back to ${siteConfig.englishEdition.title}` },
    links: [] as { href: string; label: string }[],
  },
};

/** אותה בחירת-שפה כמו בגוף העמוד — כדי שגם ה-<title> לא יגיע בעברית ל-/en. */
async function copyForRequest() {
  const isEnglish = (await headers()).get(LOCALE_HEADER) === "en";
  return { isEnglish, t: isEnglish ? COPY.en : COPY.he };
}

/**
 * ה-`title` וה-`description` נכתבים בגוף ה-`<head>` ולא ב-metadata בכוונה:
 * ה-metadata של `global-not-found` נקבע פעם אחת בבנייה, בלי בקשה, ולכן
 * `LOCALE_HEADER` אינו זמין שם — ‎/en קיבל `<title>` בעברית בזמן שהגוף היה
 * אנגלי (נמדד). מה שכן תלוי-בנייה בלבד נשאר ב-metadata.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function GlobalNotFound() {
  const { isEnglish, t } = await copyForRequest();

  return (
    <html
      lang={t.lang}
      dir={t.dir}
      className={`${bodyFont.variable} ${quoteFont.variable}`}
    >
      <head>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </head>
      <body className="flex min-h-svh flex-col bg-background text-foreground antialiased">
        <main className="flex-1">
          <Container className="flex flex-col items-center py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
              <BookX className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-serif text-4xl font-semibold">{t.title}</h1>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-foreground-muted">
              {t.body}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              {/* דרך חזרה אחת וברורה — אל האתר שבו המבקר באמת נמצא. */}
              <Button asChild size="lg">
                <Link href={t.home.href}>
                  {t.home.label}
                  {isEnglish ? (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                </Link>
              </Button>
              {t.links.length ? (
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                  {t.links.map((l) => (
                    <Button asChild variant="link" className="min-h-[44px]" key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
