import { Compass } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { compassQuiz } from "@/content/compass";
import { askStations, askUi, type AskStationId } from "@/content/askRoute";
import { Container } from "@/components/shared/Container";
import { AskRoute } from "@/components/interactive/AskRoute";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata = pageMetadata({
  // metaTitle כבר כולל „| מדייטים לאהבה”; absoluteTitle מונע הכפלת הסיומת ע"י תבנית ה-<title>.
  title: compassQuiz.metaTitle,
  absoluteTitle: true,
  description: compassQuiz.metaDescription,
  path: "/compass",
  ogType: "article",
});

const POINTS = ["2–3 שאלות קצרות", "בחירה מתוך תשובות", "נקודת פתיחה, לא אבחון"];

/**
 * עמוד „שאל את הספר” — מסלול אישי סגור ודטרמיניסטי שמכוון את הקורא/ת אל התחנה
 * והכלי המתאימים בספר, עם התאמת פרק ב' ושער „אחרי פרידה”. אינו צ׳אטבוט ואינו
 * AI: כל האפשרויות סגורות, המיפוי דטרמיניסטי בצד-הלקוח, ואין קריאה ל-API חיצוני.
 *
 * הקשר-מסע מהבית: `?station=<id>` (מגיע מתוצאת „איפה זה פוגש אותך עכשיו?”) —
 * כשהתחנה כבר ידועה, המנוע מדלג על שאלת „איפה אתם?” ומתחיל בדילמה. פרמטר לא תקין
 * או כניסה ישירה ל-/compass → ההתנהגות הרגילה (מתחילים מבחירת התחנה).
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

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
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
        <h1 className="mt-4 font-serif text-[clamp(2rem,4.2vw,2.85rem)] font-semibold leading-[1.1] text-balance text-foreground">
          {compassQuiz.ask.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
          {compassQuiz.ask.subtitle}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-[14px] italic text-foreground-muted">
          כאן לא שופטים אתכם — מבינים.
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
