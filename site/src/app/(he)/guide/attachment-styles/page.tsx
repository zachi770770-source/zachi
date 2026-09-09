import { pageMetadata } from "@/lib/seo";
import { guides } from "@/content/guides";
import { GuidePage } from "@/components/guides/GuidePage";
import { AttachmentSection } from "@/components/sections/AttachmentSection";

const guide = guides["attachment-styles"];

export const metadata = pageMetadata({
  title: guide.metaTitle,
  description: guide.metaDescription,
  path: guide.path,
  ogType: "article",
});

export default function Page() {
  // „ריקוד ההיקשרות” עבר לכאן מ-/book. זה עמוד-החיפוש הקנוני של הנושא
  // („סגנונות התקשרות בזוגיות”), הבלוק כבר היה מקושר אליו מ-/book, ושום תוכן
  // לא שוכפל ולא אבד — הוא פשוט יצא ממסלול-הרכישה אל המקום שבו הוא נלמד.
  return <GuidePage guide={guide} afterSections={<AttachmentSection />} />;
}
