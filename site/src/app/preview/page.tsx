import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/content/book";
import { sampleReader } from "@/content/sample";
import { stations } from "@/content/stations";
import { Container } from "@/components/shared/Container";
import { SampleReader, type ToolSample } from "@/components/preview/SampleReader";
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
 * ‏`?tool=&station=` (מגיע מ-Path Finder): אם *שניהם* תקפים — מוצג קטע קריאה
 * שונה *בפועל* לאותו כלי, שנבנה כולו מהתוכן המאושר של הכלי (תרחיש, יישום,
 * תובנה ושאלה) — אין אבחון ואין תוכן שהומצא. query לא תקין → הטעימה הכללית.
 */
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string; station?: string }>;
}) {
  const { tool: toolId, station: stationId } = await searchParams;
  const tool = toolId ? tools.items.find((t) => t.id === toolId) : undefined;
  const stationValid = stationId ? stationId in stations : false;
  // קטע מותאם-כלי מוצג רק כששני הפרמטרים תקפים (כלי קיים + תחנה קיימת), ונגזר
  // כולו מהתוכן המאושר של הכלי. אחרת — הטעימה הכללית (fallback בטוח).
  const toolSample: ToolSample | undefined =
    tool && stationValid
      ? {
          toolName: tool.name,
          contextLine: sampleReader.contextLine(tool.name),
          opening: tool.scenario,
          passage: [tool.application],
          insight: tool.insight,
          question: tool.question,
        }
      : undefined;

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
        <SampleReader toolSample={toolSample} />
      </Container>

      <PreviewClosing />

      {/* CTA דביק במובייל בלבד — מפנה לטופס ההרשמה, נעלם ליד הטופס/הפוטר. */}
      <PreviewStickyCta />
    </>
  );
}
