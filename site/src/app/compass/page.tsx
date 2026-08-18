import { Compass } from "lucide-react";

import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { compass, compassQuiz } from "@/content/compass";
import { askStations, askUi, type AskStationId } from "@/content/askRoute";
import {
  COMPASS_LIMITS,
  resolveCompassSurface,
} from "@/lib/compass/assistant/config";
import { Container } from "@/components/shared/Container";
import { AskRoute } from "@/components/interactive/AskRoute";
import { CompassExperience } from "@/components/compass/CompassExperience";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  // metaTitle כבר כולל „| מדייטים לאהבה”; absoluteTitle מונע הכפלת הסיומת ע"י תבנית ה-<title>.
  title: compassQuiz.metaTitle,
  absoluteTitle: true,
  description: compassQuiz.metaDescription,
  path: "/compass",
  ogType: "article",
});

const POINTS = ["2-3 שאלות קצרות", "בחירה מתוך תשובות", "נקודת פתיחה, לא אבחון"];

/**
 * עמוד „שאל את הספר” (/compass) — דו-מצבי לפי מצב-התצוגה שנקבע בשרת
 * (resolveCompassSurface):
 *
 *   • "guided" (ברירת מחדל, וגם פרודקשן) — המצפן המודרך בלבד: מנוע הכוונה סגור
 *     ודטרמיניסטי (AskRoute). זו ההתנהגות החיה הקיימת; הממשק החופשי אינו נחשף.
 *   • "free-text-preview" — Preview/Staging: הממשק החופשי נראה וניתן לבדיקה
 *     ויזואלית, אך אינו מפיק מענה (uiPreview). לבדיקה בלבד.
 *   • "free-text-live" — העוזר הופעל: הממשק החופשי שולח דרך /api/compass האמיתי
 *     (שעדיין מגודר במסד/ספק/גרסה). המצפן המודרך נשאר זמין כמצב משני.
 *
 * הקשר-מסע מהבית (`?station=<id>`) נשמר בשני המסלולים: כשהתחנה ידועה, המנוע
 * המודרך מדלג על שאלת „איפה אתם?” ומתחיל בדילמה.
 */
export default async function CompassPage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string }>;
}) {
  const { station } = await searchParams;
  const initialStation: AskStationId | undefined =
    station && askStations.some((s) => s.id === station)
      ? (station as AskStationId)
      : undefined;

  const surface = resolveCompassSurface();

  // ── מצב שאלה-חופשית (Preview/Staging או עוזר-פעיל) ──────────────────────────
  // הממשק החופשי הוא הראשי; „המצפן המודרך” הוא מצב משני בתוך אותה חוויה.
  if (surface !== "guided") {
    return (
      <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
        <BreadcrumbSchema
          items={[
            { name: "בית", path: "/" },
            { name: compass.freeText.label, path: "/compass" },
          ]}
        />
        <div className="enter-stagger">
          <CompassExperience
            salesOpen={siteConfig.salesOpen}
            maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
            uiPreview={surface === "free-text-preview"}
            initialStation={initialStation}
          />
        </div>
      </Container>
    );
  }

  // ── מצב מודרך (ברירת מחדל / פרודקשן) — ההתנהגות החיה הקיימת, ללא שינוי ──────
  return (
    <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: askUi.eyebrow, path: "/compass" },
        ]}
      />

      <header className="enter-stagger mx-auto max-w-2xl text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-brand ring-1 ring-brand/15"
          aria-hidden="true"
        >
          <Compass className="h-6 w-6" />
        </span>
        <span className="kicker mt-6 justify-center">{askUi.eyebrow}</span>
        <h1 className="mt-4 font-serif type-hero text-foreground">
          {compassQuiz.ask.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
          {compassQuiz.ask.subtitle}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-[14px] italic text-foreground-muted">
          כאן לא שופטים אתכם, מבינים.
        </p>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {POINTS.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13.5px] font-medium text-foreground-muted"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              {point}
            </li>
          ))}
        </ul>
      </header>

      <div className="enter mt-10 sm:mt-12" style={{ animationDelay: "160ms" }}>
        <AskRoute initialStation={initialStation} />
      </div>
    </Container>
  );
}
