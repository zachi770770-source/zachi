import Link from "next/link";

import { JourneyPosition } from "@/components/journey/JourneyPosition";
import type { JourneyId } from "@/content/journeyPages";

/**
 * אזור ה„איפה אני” בראש עמוד-המסע: מחוון-ההתקדמות (JourneyPosition) יחד עם
 * קישור-כניסה שקט ל„מצאו את המקום שלכם במסע”. מאוחד ברכיב אחד כדי שאותה כניסה
 * ישירה תופיע *ליד* ה-progress בכל חמשת העמודים, בשתי גרסאות ה-Hero, במימוש
 * יחיד (לא מוכפל בחמישה עמודים).
 */
export function JourneyWayfinder({
  journeyId,
  align = "start",
}: {
  journeyId: JourneyId;
  /** יישור הקישור השקט — מתאים ל-Hero המפוצל (start) ולריכוזי (center). */
  align?: "start" | "center";
}) {
  return (
    <div className="journey-wayfinder" data-align={align}>
      <JourneyPosition journeyId={journeyId} />
      {/* כניסה ישירה: לא מנחשים referrer/גוגל — פשוט מציעים בשקט לחזור לבורר. */}
      <Link
        href="/#path"
        className="journey-wayfinder__find text-[13px] leading-relaxed text-foreground-muted underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:pretty]"
      >
        לא בטוחים שזו התחנה שמתאימה לכם עכשיו? מצאו את המקום שלכם במסע
      </Link>
    </div>
  );
}
