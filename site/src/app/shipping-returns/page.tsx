import { pageMetadata } from "@/lib/seo";
import { shippingReturnsContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata = pageMetadata({
  title: "מדיניות מוצר, משלוחים וביטולים",
  description:
    "אופן מסירת המהדורה הדיגיטלית, משלוח המהדורה המודפסת ומדיניות הביטולים באתר מדייטים לאהבה.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  return <LegalContent {...shippingReturnsContent} />;
}
