import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { SampleReader } from "@/components/preview/SampleReader";
import { BookMap } from "@/components/preview/BookMap";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "הצצה לספר",
  description: `טעימה נגישה מתוך ${siteConfig.bookTitle} — קטע לקריאה, העיקרון המרכזי ומפת שלושת חלקי הספר.`,
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

      <Container className="py-10 sm:py-14">
        <SampleReader />
      </Container>

      <BookMap />
    </>
  );
}
