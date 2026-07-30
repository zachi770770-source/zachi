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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[76px]">
        {/* לוגו + סמל מותג (בצד המתחיל ב-RTL) */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          aria-label={`${siteConfig.bookTitle}, לעמוד הבית`}
        >
          <BrandMark withRing className="h-8 w-8 shrink-0 text-foreground" />
          <span className="font-sans text-lg font-extrabold tracking-tight sm:text-[1.35rem]">
            {siteConfig.bookTitle}
          </span>
        </Link>

        {/* ניווט דסקטופ מלוכד: קישורים + מפריד + CTA */}
        <MainNav />

        {/* מובייל: כפתור קומפקטי + המבורגר */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <Button asChild size="sm" className="h-10 px-4 text-sm">
            <Link href={siteConfig.salesOpen ? "/book#purchase" : "/waitlist"}>
              {siteConfig.salesOpen ? "רכישה" : "עדכנו אותי"}
            </Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
