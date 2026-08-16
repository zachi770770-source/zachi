import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/layout/MainNav";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { BrandMark } from "@/components/shared/BrandMark";

/**
 * הדר עריכתי שטוח: קו שיער תחתון יחיד (ללא צל כבד), לוגו בצד המתחיל
 * וקבוצת ניווט מלוכדת בצד המסיים. גובה קבוע (64/76) התואם ל---header-height
 * שאליו נצמד סרגל הקורא בטעימה.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3 sm:h-[76px] sm:gap-4">
        {/* לוגו + סמל מותג (בצד המתחיל ב-RTL). nowrap כדי שהשם לעולם לא יישבר
            לשתי שורות במובייל. */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          aria-label={`${siteConfig.bookTitle}, לעמוד הבית`}
        >
          <BrandMark withRing className="h-9 w-9 shrink-0 text-foreground" />
          <span className="whitespace-nowrap font-sans text-base font-extrabold tracking-tight sm:text-[1.35rem]">
            {siteConfig.bookTitle}
          </span>
        </Link>

        {/* ניווט דסקטופ מלוכד: קישורים + מפריד + CTA */}
        <MainNav />

        {/* מובייל: CTA קומפקטי (שלא ישתלט על הלוגו) + המבורגר עם מרווח ברור */}
        <div className="flex items-center gap-1 lg:hidden">
          {/* גובה 44px (h-11) — יעד-מגע תקין במובייל, תואם את כפתור ההמבורגר
              שלצדו, ונשאר בתוך גובה ההדר (h-16). הרוחב נשאר קומפקטי (px-3.5). */}
          <Button asChild size="sm" className="h-11 px-3.5 text-sm">
            <Link href="/book#purchase">לרכישה</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
