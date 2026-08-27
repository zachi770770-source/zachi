import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { guideOrder, guides } from "@/content/guides";
import { cn } from "@/lib/utils";

/**
 * רשימת המדריכים ששויכו לתחנה (hub/spoke). מסננת את `guideOrder` לפי
 * `guide.hub.href === stationPath`, ומוצגת בכל עמוד-תחנה — גם JourneyPage וגם
 * StationPage — כדי שהקישור hub→spoke יהיה מלא ועקבי בכל חמש התחנות. מחזירה
 * null כשאין מדריכים לתחנה (למשל תחנה ללא אשכול).
 *
 * `tone` שולט במשקל הוויזואלי בלבד (לא בתוכן/בקישורים/ב-SEO): „primary” הוא
 * אשכול-הכרטיסים המלא (ברירת-המחדל, StationPage); „secondary” הוא אשכול שקט של
 * קישורי-רשימה, לעמוד-המסע, שבו זהו אזור-העמקה *נוסף* ולא הצעד הראשי — כותרת
 * שקטה יותר וקישורים פחות דומיננטיים מ„המשך המסע” ומהספר.
 */
export function StationGuides({
  stationPath,
  tone = "primary",
}: {
  stationPath: string;
  tone?: "primary" | "secondary";
}) {
  const stationGuides = guideOrder
    .map((slug) => guides[slug])
    .filter((g) => g.hub.href === stationPath);
  if (stationGuides.length === 0) return null;

  const secondary = tone === "secondary";
  // התאמת יחיד/רבים: חלק מהתחנות נושאות מדריך *אחד* בלבד (למשל „מתחילים מחדש”),
  // ואז „מדריכים” הרבים והכיתוב „לכל שאלה” אינם נכונים.
  const single = stationGuides.length === 1;

  return (
    <section
      aria-labelledby="guides-heading"
      className={cn("reveal border-t border-border", secondary ? "pt-8" : "pt-10")}
    >
      <h2
        id="guides-heading"
        className={cn(
          secondary
            ? "kicker"
            : "font-serif text-[1.25rem] font-bold text-foreground",
        )}
      >
        {single ? "מדריך להעמקה בשאלה ספציפית" : "מדריכים להעמקה בשאלות ספציפיות"}
      </h2>
      <p
        className={cn(
          "max-w-[60ch] leading-relaxed text-foreground-muted [text-wrap:pretty]",
          secondary ? "mt-3 text-[14px]" : "mt-2 text-[15px]",
        )}
      >
        {single
          ? "עמוד זה הוא נקודת-המוצא; יש כאן מדריך ייעודי מתוך הגישה של הספר."
          : "עמוד זה הוא נקודת-המוצא; לכל שאלה יש מדריך ייעודי מתוך הגישה של הספר."}
      </p>

      {secondary ? (
        // אשכול שקט — קישורי-רשימה קומפקטיים, בלי „קופסאות” שמתחרות בהמשך-המסע.
        // דסקטופ: שני טורים; מובייל: טור אחד. כל שורה מופרדת בקו-שׂיא דק בלבד.
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {stationGuides.map((g) => (
            <li key={g.slug} className="border-t border-border">
              <Link
                href={g.path}
                className="group flex items-center justify-between gap-3 py-2.5 text-[15px] font-medium leading-tight text-foreground/90 underline-offset-4 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span>{g.metaTitle}</span>
                <ArrowLeft
                  className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </section>
  );
}
