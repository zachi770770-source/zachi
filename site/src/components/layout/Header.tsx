"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { isEnglishPath } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/layout/MainNav";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { BrandMark } from "@/components/shared/BrandMark";

/**
 * הדר עריכתי שטוח: קו שיער תחתון יחיד (ללא צל כבד), לוגו בצד המתחיל
 * וקבוצת ניווט מלוכדת בצד המסיים. גובה קבוע (64/76) התואם ל---header-height
 * שאליו נצמד סרגל הקורא בטעימה.
 *
 * **למה רכיב-לקוח.** ההדר יושב ב-root layout אחד ומשרת גם את האתר העברי וגם
 * את „/en”, ולכן הוא חייב לדעת על איזה מסלול הוא מרונדר. `MainNav` ו-
 * `MobileMenu` שבתוכו כבר היו רכיבי-לקוח עם `usePathname` מאותה סיבה; כאן
 * נוספה רק המעטפת. ה-HTML עדיין מרונדר בשרת, ולכן הכיתוב הנכון מגיע כבר
 * בטעינה הראשונה — אין הבהוב של החלפת-שפה אחרי ההידרציה.
 *
 * **מה מתחלף ב-„/en”.** רק המשטח הגלוי: שם המותג, יעד הלוגו, וכיתוב+יעד
 * הרכישה. ה-CTA האנגלי מצביע לאמזון — היעד היחיד של המהדורה האנגלית —
 * ולכן הוא קישור חיצוני ולא ניווט פנימי אל „/book#purchase” העברי.
 */
export function Header() {
  const english = isEnglishPath(usePathname());
  const edition = siteConfig.englishEdition;

  const brandLabel = english ? edition.title : siteConfig.bookTitle;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div
        className="container-page flex h-16 items-center justify-between gap-1.5 sm:h-[76px] sm:gap-4"
        {...(english ? { lang: "en", dir: "ltr" } : {})}
      >
        {/* לוגו + סמל מותג (בצד המתחיל ב-RTL). nowrap כדי שהשם לעולם לא יישבר
            לשתי שורות במובייל. */}
        <Link
          href={english ? "/en" : "/"}
          className="group flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:gap-2.5"
          aria-label={english ? `${edition.title}, home` : `${siteConfig.bookTitle}, לעמוד הבית`}
        >
          <BrandMark className="h-9 w-9 shrink-0 text-foreground" />
          {/* השם *לעולם* אינו מצטמצם ואינו נחתך: `shrink-0` על הקישור ו-nowrap
              כאן. שם מותג עם „…” הוא כשל שקט — ה-DOM ממשיך לדווח שהטקסט נכנס
              (Chrome מודד את התיבה *אחרי* הקיצור), ולכן רק פריסה שאינה מקצרת
              בכלל הופכת חוסר-מקום לגלישה שאפשר למדוד ולתקן.
              מתחת ל-360px ארבעת הפקדים אינם נכנסים לשורה אחת, ולכן שם המותג
              מוסתר שם ונשאר סמל-המותג בלבד — עדיין הקישור לעמוד הבית, עם אותו
              aria-label. מ-360px ומעלה השם מוצג במלואו בשתי השפות. */}
          <span className="hidden whitespace-nowrap font-sans text-sm font-extrabold tracking-tight min-[360px]:inline sm:text-[1.35rem]">
            {brandLabel}
          </span>
        </Link>

        {/* ניווט דסקטופ מלוכד: קישורים + מפריד + CTA */}
        <MainNav />

        {/* מובייל: מחליף-שפה גלוי + CTA קומפקטי + המבורגר.
            מחליף-השפה נמצא *בשורת ההדר עצמה* ולא רק במגירה: מבקר דובר-אנגלית
            לא אמור להידרש לפתוח תפריט כדי לגלות שקיימת גרסה בשפתו. */}
        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <LanguageSwitch to={english ? "he" : "en"} compact />

          {/* גובה 44px (h-11) — יעד-מגע תקין במובייל, תואם את כפתור ההמבורגר
              שלצדו, ונשאר בתוך גובה ההדר (h-16). הרוחב נשאר קומפקטי (px-3). */}
          <Button asChild size="sm" className="h-11 px-2 text-[13px]">
            {english ? (
              <a href={edition.url} target="_blank" rel="noopener noreferrer">
                {edition.buyLabel}
              </a>
            ) : (
              <Link href="/book#purchase">לרכישה</Link>
            )}
          </Button>

          {/* המגירה נושאת את קישורי הסקשנים של האתר העברי. ב-„/en” אין להם
              מקבילה אנגלית, והצגתם שם הייתה מחזירה עברית אל תוך הניווט של עמוד
              אנגלי; שני הפקדים היחידים שכן רלוונטיים שם — שפה ורכישה — כבר
              גלויים בשורה עצמה, ולכן אין מה לפתוח. */}
          {english ? null : <MobileMenu />}
        </div>
      </div>
    </header>
  );
}
