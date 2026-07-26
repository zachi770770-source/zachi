import { pageMetadata } from "@/lib/seo";
import { privacyContent } from "@/content/legal";
import { LegalContent } from "@/components/legal/LegalContent";

export const metadata = pageMetadata({
  title: "מדיניות פרטיות",
  description: "כיצד אנו אוספים ומשתמשים במידע באתר מדייטים לאהבה.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalContent {...privacyContent} />;
}
