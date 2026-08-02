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
            <div className="relative mx-auto mb-9 w-[172px] sm:w-[204px] lg:w-[232px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-secondary/[0.16] blur-2xl"
              />
              <div data-vt-book-dest className="w-full">
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
      <InsideBookSection />
      <OutcomesSection />
      <PurchaseSection />
    </>
  );
}
