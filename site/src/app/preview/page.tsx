import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { tools } from "@/content/book";
import { sampleReader } from "@/content/sample";
import { stations } from "@/content/stations";
import type { PersonaId } from "@/content/personas";
import type { AskStationId } from "@/content/askRoute";
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
 *
 * „אחרי פרידה” בלבד: התרחיש הכללי של הכלי הוא סצנת-דייטינג, שמרגישה זרה למי
 * שאחרי פרידה. לכן כאן הקטע *נפתח* במסגור הפרידתי המאושר של אותו כלי
 * (`personaExamples.breakup`) — עדיין תוכן קיים ומאושר, לא מומצא. שאר התחנות
 * נשארות עם התרחיש הכללי (אושרו כחזקים).
 */
const STATION_PERSONA: Partial<Record<string, PersonaId>> = {
  "after-breakup": "breakup",
};

/** מזהה עמוד-תחנה (ב-`?station=`) → תחנת-עוזר, כדי לשאת את ההקשר לעוזר בסיום. */
const STATION_TO_ASK: Partial<Record<string, AskStationId>> = {
  "before-relationship": "dating",
  "building-relationship": "building",
  "inside-relationship": "existing",
  "after-breakup": "after-breakup",
};

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string; station?: string }>;
}) {
  const { tool: toolId, station: stationId } = await searchParams;
  const tool = toolId ? tools.items.find((t) => t.id === toolId) : undefined;
  const stationValid = stationId ? stationId in stations : false;
  // מסגור-מצב מאושר לפתיחת הקטע (כרגע רק „אחרי פרידה”): אם לכלי יש דוגמת-פרסונה
  // תואמת, היא מובילה את הקטע במקום התרחיש הכללי. אחרת — התרחיש הכללי כרגיל.
  const persona = stationId ? STATION_PERSONA[stationId] : undefined;
  const personaOpening =
    tool && persona ? tool.personaExamples?.[persona] : undefined;
  // קטע מותאם-כלי מוצג רק כששני הפרמטרים תקפים (כלי קיים + תחנה קיימת), ונגזר
  // כולו מהתוכן המאושר של הכלי. אחרת — הטעימה הכללית (fallback בטוח).
  const toolSample: ToolSample | undefined =
    tool && stationValid
      ? {
          toolName: tool.name,
          contextLine: sampleReader.contextLine(tool.name),
          opening: personaOpening ?? tool.scenario,
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

      <PreviewClosing
        station={stationId ? STATION_TO_ASK[stationId] : undefined}
      />

      {/* CTA דביק במובייל בלבד — מפנה לטופס ההרשמה, נעלם ליד הטופס/הפוטר. */}
      <PreviewStickyCta />
    </>
  );
}
