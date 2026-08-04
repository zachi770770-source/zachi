import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { SampleReader } from "@/components/preview/SampleReader";
import { MarkSampleSeen } from "@/components/preview/MarkSampleSeen";
import { PeekInside } from "@/components/interactive/PeekInside";
import { BookMap } from "@/components/preview/BookMap";
import { PreviewClosing } from "@/components/preview/PreviewClosing";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "הצצה לספר",
  description: `טעימה נגישה מתוך ${siteConfig.bookTitle}, קטע לקריאה, העיקרון המרכזי ומפת שלושת חלקי הספר.`,
  path: "/preview",
  ogType: "article",
});

export default function PreviewPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הצצה לספר", path: "/preview" },
        ]}
      />

      <MarkSampleSeen />

      <Container className="py-10 sm:py-14">
        <SampleReader />
      </Container>

      {/* ההצצה האינטראקטיבית (עטיפה / מבנה / קטע / כלי) הועברה לכאן מעמוד הבית.
          ה-CTA הפנימי מוסתר — PreviewClosing מחזיק את טופס ההרשמה בסוף העמוד. */}
      <PeekInside showCta={false} />

      <BookMap />
      <PreviewClosing />
    </>
  );
}
