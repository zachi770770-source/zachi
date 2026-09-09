import { pageMetadata } from "@/lib/seo";
import { guides } from "@/content/guides";
import { GuidePage } from "@/components/guides/GuidePage";
import { AttachmentSection } from "@/components/sections/AttachmentSection";
import { PatternsSection } from "@/components/sections/PatternsSection";

const guide = guides["attachment-styles"];

export const metadata = pageMetadata({
  title: guide.metaTitle,
  description: guide.metaDescription,
  path: guide.path,
  ogType: "article",
});

export default function Page() {
  // שני בלוקי-הדפוסים עברו לכאן מ-/book: „למה אנחנו חוזרים שוב ושוב לאותו
  // מקום?” (PatternsSection) ו„הריקוד שאף אחד לא בחר בו” (AttachmentSection).
  //
  // למה דווקא כאן, ולמה לא מסלול חדש: זהו עמוד-החיפוש הקנוני של הנושא באתר
  // („סגנונות התקשרות בזוגיות: דפוס חרדתי, דפוס נמנע”), הוא כבר היה היעד
  // שאליו /book הפנה להעמקה, וכוונת-החיפוש זהה — דפוסים רגשיים חוזרים ומה
  // עומד מאחוריהם. גם הסייג שלו כבר מכסה את שניהם במפורש („אינו אבחון”).
  // מסלול חדש היה מייצר כוונת-חיפוש כפולה מול העמוד הזה, בלי להוסיף דבר.
  //
  // אף תוכן לא שוכפל ולא אבד: כל בלוק מרונדר בדיוק במקום אחד באתר, ו-/book
  // ממשיך להפנות לכאן בקישור-העמקה יחיד.
  //
  // הסדר: קודם הכללי (למה חוזרים לאותו מקום), ואז המקרה הספציפי (הריקוד
  // החרדתי-נמנע) — מהרחב אל הפרטני.
  return (
    <GuidePage
      guide={guide}
      afterSections={
        <>
          <PatternsSection />
          <AttachmentSection context="guide" />
        </>
      }
    />
  );
}
