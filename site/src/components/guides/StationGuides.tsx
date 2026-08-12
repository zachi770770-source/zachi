import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { guideOrder, guides } from "@/content/guides";

/**
 * רשימת המדריכים ששויכו לתחנה (hub/spoke). מסננת את `guideOrder` לפי
 * `guide.hub.href === stationPath`, ומוצגת בכל עמוד-תחנה — גם JourneyPage וגם
 * StationPage — כדי שהקישור hub→spoke יהיה מלא ועקבי בכל חמש התחנות. מחזירה
 * null כשאין מדריכים לתחנה (למשל תחנה ללא אשכול).
 */
export function StationGuides({ stationPath }: { stationPath: string }) {
  const stationGuides = guideOrder
    .map((slug) => guides[slug])
    .filter((g) => g.hub.href === stationPath);
  if (stationGuides.length === 0) return null;

  return (
    <section
      aria-labelledby="guides-heading"
      className="reveal border-t border-border pt-10"
    >
      <h2
        id="guides-heading"
        className="font-serif text-[1.25rem] font-bold text-foreground"
      >
        מדריכים להעמקה בשאלות ספציפיות
      </h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        עמוד זה הוא נקודת-המוצא; לכל שאלה יש מדריך ייעודי מתוך הגישה של הספר.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {stationGuides.map((g) => (
          <li key={g.slug}>
            <Link
              href={g.path}
              className="lift-hover group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="font-serif text-[15px] font-semibold leading-tight text-foreground">
                {g.metaTitle}
              </span>
              <ArrowLeft
                className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
