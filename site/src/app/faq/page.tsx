import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { faqItems } from "@/content/faq";
import { Container } from "@/components/shared/Container";
import { Faq } from "@/components/faq/Faq";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "שאלות נפוצות",
  description: `כל מה שרציתם לדעת על הספר ${siteConfig.bookTitle}: התאמה, משלוח, תשלום ועוד.`,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-16">
      <FaqSchema />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "שאלות נפוצות", path: "/faq" },
        ]}
      />
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          שאלות נפוצות
        </h1>
        <p className="mt-3 text-lg text-foreground-muted">
          כל מה שכדאי לדעת על הספר לפני שקוראים.
        </p>
        <p className="mt-2 text-[14px] italic text-foreground-muted">
          אין תשובה אחת שמתאימה לכולם.
        </p>

        <div className="mt-8">
          <Faq items={faqItems} />
        </div>
      </div>
    </Container>
  );
}
