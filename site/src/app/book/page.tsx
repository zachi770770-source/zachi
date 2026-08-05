import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { bigIdea } from "@/content/book";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BookCover } from "@/components/shared/BookCover";
import { BookLink } from "@/components/shared/BookLink";
import { BehindSection } from "@/components/sections/BehindSection";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { ToolsBento } from "@/components/sections/ToolsBento";
import { InsideBookSection } from "@/components/sections/InsideBookSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { PurchaseSection } from "@/components/sections/PurchaseSection";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "הספר לעומק: השיטה, המבנה והכלים",
  description: `כל מה שיש ב${siteConfig.bookTitle}: למה הוא נכתב, למי הוא מיועד, השיטה, מבנה הספר, הכלים המעשיים ומה משתנה אחרי הקריאה.`,
  path: "/book",
  ogType: "article",
});

/**
 * עמוד הספר לעומק. עמוד הבית הוא שער מהיר לסריקה; כאן מרוכז הפירוט המלא
 * שהיה פזור בו: הרקע לכתיבת הספר, למי הוא מיועד, השיטה, מבנה הספר והכלים,
 * התוצאות, ולסיום כרטיס המהדורות. אין כפילות עם הבית — התוכן הזה מוצג
 * כאן בלבד, והבית מקשר לכאן.
 */
export default function BookPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הספר", path: "/book" },
        ]}
      />

      <header className="border-b border-border bg-surface-muted">
        <Container className="py-16 sm:py-20 lg:py-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            {/* עוגן המעבר „כניסה לספר” + מוקד עריכתי: העטיפה גדולה ומכובדת,
                עם הילת Sage רכה מאחוריה להפרדה טונאלית. העטיפה נמשכת לכאן
                מנקודת המקור בבית. */}
            <div className="book-hero-enter relative mx-auto mb-10 w-[248px] sm:w-[304px] lg:w-[360px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-secondary/[0.18] blur-3xl"
              />
              {/* צל נחיתה שמתרחב ומתיישב יחד עם כניסת הכריכה (עומק מוצר) */}
              <div
                aria-hidden="true"
                className="book-hero-enter__shadow pointer-events-none absolute -bottom-6 start-1/2 h-12 w-[78%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
              />
              {/* #6 המשכיות אובייקט: הכריכה גם יעד (בהגעה מהבית) וגם מקור (ביציאה
                  אל /preview) — אותו ספר „ממשיך” הלאה, ללא כריכה כפולה. */}
              <div data-vt-book-dest data-vt-book-source className="w-full">
                <BookCover priority />
              </div>
            </div>
            <span className="kicker justify-center">הספר לעומק</span>
            <h1 className="type-h1 mt-4">מה יש בספר, ואיך הוא עובד</h1>
            <p className="type-lead mt-6 text-foreground-muted">
              {siteConfig.description}
            </p>
            {/* נקודת האיזון של הגישה, הועברה לכאן מהשער כדי לשמור על עמוד בית חיובי. */}
            <p className="mx-auto mt-6 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted/90">
              {bigIdea.clarification}
            </p>
            <BookLink
              href="/preview"
              morphCover
              className="group mt-7 inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              קראו טעימה מהספר
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
          </Reveal>
        </Container>
      </header>

      <BehindSection />
      <ThesisSection />
      <AudienceSection />
      <MethodSection />
      {/* ששת הכלים המעשיים — אזור Editorial Luxury אינטראקטיבי. עוגני
          #tool-<id> משמשים deep-link מ-Path Finder ומקישורים ישירים. */}
      <ToolsBento />
      <InsideBookSection />
      <OutcomesSection />
      <PurchaseSection />
    </>
  );
}
