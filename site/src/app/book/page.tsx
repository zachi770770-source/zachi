import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BehindSection } from "@/components/sections/BehindSection";
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
            <span className="kicker justify-center">הספר לעומק</span>
            <h1 className="type-h1 mt-4">מה יש בספר, ואיך הוא עובד</h1>
            <p className="type-lead mt-6 text-foreground-muted">
              {siteConfig.description}
            </p>
          </Reveal>
        </Container>
      </header>

      <BehindSection />
      <AudienceSection />
      <MethodSection />
      <InsideBookSection />
      <OutcomesSection />
      <PurchaseSection />
    </>
  );
}
