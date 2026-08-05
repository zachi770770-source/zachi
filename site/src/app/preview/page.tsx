import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/content/book";
import { stations } from "@/content/stations";
import { Container } from "@/components/shared/Container";
import { SampleReader } from "@/components/preview/SampleReader";
import { MarkSampleSeen } from "@/components/preview/MarkSampleSeen";
import { PreviewClosing } from "@/components/preview/PreviewClosing";
import { PreviewStickyCta } from "@/components/preview/PreviewStickyCta";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  title: "טעימה מהספר",
  description: `טעימה קצרה מתוך ${siteConfig.bookTitle} — קטע לקריאה של כשתי דקות, ללא הרשמה.`,
  path: "/preview",
  ogType: "article",
});

/**
 * עמוד הטעימה — חוויית קריאה אחת ורציפה: כותרת אחידה („טעימה מהספר · 2 דקות
 * קריאה”), קטע אמיתי קצר מכתב-היד, שאלה לקורא ואזור הרשמה בסוף. אין „הצצה”
 * כפולה (קרוסלה/מפת-ספר) — אלה חיים בעמוד הספר. נפתח מיד ללא אימייל.
 *
 * ‏`?tool=&station=` (מגיע מ-Path Finder): אם *שניהם* תקפים — מוצגת שורת-הקשר
 * אישית קצרה מעל הקטע. הקטע עצמו נשאר הטעימה המאושרת בלבד (אין אבחון/תוכן
 * מומצא). query לא תקין → נופלים בבטחה לטעימה הכללית.
 */
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string; station?: string }>;
}) {
  const { tool: toolId, station: stationId } = await searchParams;
  const tool = toolId ? tools.items.find((t) => t.id === toolId) : undefined;
  const stationValid = stationId ? stationId in stations : false;
  // שורת-הקשר מוצגת רק כששני הפרמטרים תקפים (כלי קיים + תחנה קיימת).
  const contextToolName = tool && stationValid ? tool.name : undefined;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "טעימה מהספר", path: "/preview" },
        ]}
      />

      <MarkSampleSeen />

      <Container className="py-10 sm:py-14">
        <SampleReader contextToolName={contextToolName} />
      </Container>

      <PreviewClosing />

      {/* CTA דביק במובייל בלבד — מפנה לטופס ההרשמה, נעלם ליד הטופס/הפוטר. */}
      <PreviewStickyCta />
    </>
  );
}
