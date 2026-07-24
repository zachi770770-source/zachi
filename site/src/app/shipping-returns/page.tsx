import type { Metadata } from "next";

import { shippingReturnsContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "מדיניות מוצר, משלוחים וביטולים",
  description:
    "אופן מסירת המהדורה הדיגיטלית, משלוח המהדורה המודפסת ומדיניות הביטולים באתר מדייטים לאהבה.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return <LegalContent {...shippingReturnsContent} />;
}
