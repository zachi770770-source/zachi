import { pageMetadata } from "@/lib/seo";
import { termsContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata = pageMetadata({
  title: "תקנון האתר",
  description: "תקנון השימוש באתר מדייטים לאהבה.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalContent {...termsContent} />;
}
