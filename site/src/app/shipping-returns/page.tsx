import type { Metadata } from "next";

import { shippingReturnsContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "משלוחים, ביטולים והחזרות",
  description: "מדיניות המשלוחים, הביטולים וההחזרות באתר מדייטים לאהבה.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return <LegalContent {...shippingReturnsContent} />;
}
