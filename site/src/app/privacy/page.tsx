import type { Metadata } from "next";

import { privacyContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "כיצד אנו אוספים ומשתמשים במידע באתר מדייטים לאהבה.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalContent {...privacyContent} />;
}
