import { stationOrder, stations } from "@/content/stations";
import type { JourneyId } from "@/content/journeyPages";

/**
 * מחוון-מיקום במסע — ממשיך את מסלול-הבחירה מעמוד הבית אל עמוד-היעד, כך שמי
 * שבחר תחנה בבית ממשיך לראות *איפה הוא נמצא* גם אחרי הניווט.
 *
 * הסמנטיקה נלקחת מ-`stationOrder` ומההערה שכבר מלווה אותו: שלוש תחנות במחזור
 * אחד („תחנה N מתוך 3”), בעוד „אחרי פרידה” (שער מעבר) ו„מתחילים מחדש” (גשר
 * חזרה) *אינם* חלק מהמחזור. לכן הם לעולם אינם מקבלים מספר-תחנה — הצגתם כתחנה
 * רביעית הייתה סותרת את ה-IA המתועד. הם מקבלים סימון-שער נפרד.
 *
 * רכיב שרת בלבד: המיקום ידוע מנתוני העמוד, ולכן אין state, אין JS ואין hook.
 * המידע קיים גם כטקסט (sr-only / תווית גלויה) — לא רק כצבע או כתנועה.
 */

const GATE_LABEL: Partial<Record<JourneyId, string>> = {
  "after-breakup": "שער מעבר",
  "starting-again": "גשר חזרה אל המסע",
};

export function JourneyPosition({ journeyId }: { journeyId: JourneyId }) {
  const gateLabel = GATE_LABEL[journeyId];
  const index = stationOrder.indexOf(journeyId as (typeof stationOrder)[number]);

  // שער/גשר — מחוץ למחזור שלוש התחנות: סימון יחיד, בלי מספר ובלי מסלול.
  if (gateLabel || index < 0) {
    return (
      <p className="journey-position journey-position--gate" data-gate="true">
        <span className="journey-position__gate-dot" aria-hidden="true" />
        <span className="journey-position__label">{gateLabel ?? "שער מעבר"}</span>
      </p>
    );
  }

  const total = stationOrder.length;
  return (
    <div className="journey-position">
      {/* המסלול עצמו דקורטיבי; המשמעות נמסרת בטקסט שלצידו. */}
      <span className="journey-position__route" aria-hidden="true">
        {stationOrder.map((id, i) => (
          <span
            key={id}
            className="journey-position__node"
            data-state={i < index ? "done" : i === index ? "current" : "ahead"}
          />
        ))}
      </span>
      <span className="journey-position__label">
        תחנה {index + 1} מתוך {total}
        <span className="sr-only">: {stations[journeyId].navLabel}</span>
      </span>
    </div>
  );
}
