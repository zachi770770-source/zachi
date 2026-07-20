import type { Metadata } from "next";

import { termsContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "תקנון האתר",
  description: "תקנון השימוש באתר מדייטים לאהבה.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalContent {...termsContent} />;
}
