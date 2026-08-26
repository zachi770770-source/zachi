import { getJourneyFlow } from "@/content/journeyFlow";
import type { JourneyId } from "@/content/journeyPages";

/**
 * מחוון-מיקום במסע — ממשיך את מסלול-הבחירה מעמוד הבית אל עמוד-היעד, כך שמי
 * שבחר תחנה בבית ממשיך לראות *איפה הוא נמצא* גם אחרי הניווט.
 *
 * המסלול הראשי מוצג במפורש עם שמות שלוש התחנות — „לפני קשר → מתחילים קשר →
 * בתוך קשר” — וכל צעד נושא מצב (done / current / ahead) הן בצבע והן בטקסט
 * (data-state + תווית-מצב ל-sr-only), כדי שהמידע לא יימסר בצבע בלבד.
 *
 * הסמנטיקה נלקחת ממקור-האמת המשותף (`getJourneyFlow` מעל `stationOrder`): שלוש
 * תחנות במחזור אחד, בעוד „אחרי פרידה” (שער מעבר) ו„מתחילים מחדש” (גשר חזרה)
 * *אינם* חלק מהמחזור. לכן הם לעולם אינם מקבלים מספר-תחנה — הצגתם כתחנה רביעית
 * הייתה סותרת את ה-IA המתועד. הם מקבלים סימון-שער נפרד.
 *
 * רכיב שרת בלבד: המיקום ידוע מנתוני העמוד, ולכן אין state, אין JS ואין hook.
 */

const GATE_LABEL: Partial<Record<JourneyId, string>> = {
  "after-breakup": "שער מעבר",
  "starting-again": "גשר חזרה אל המסע",
};

/** תווית-מצב נגישה לכל צעד — כדי שהמצב לא ייקרא בצבע בלבד. */
const STATE_LABEL = {
  done: "הושלם",
  current: "כאן עכשיו",
  ahead: "עוד לפנינו",
} as const;

export function JourneyPosition({ journeyId }: { journeyId: JourneyId }) {
  const flow = getJourneyFlow(journeyId);
  const gateLabel = GATE_LABEL[journeyId];

  // שער/גשר — מחוץ למחזור שלוש התחנות: סימון יחיד, בלי מספר ובלי מסלול.
  if (flow.station === null) {
    return (
      <p className="journey-position journey-position--gate" data-gate="true">
        <span className="journey-position__gate-dot" aria-hidden="true" />
        <span className="journey-position__label">{gateLabel ?? "שער מעבר"}</span>
      </p>
    );
  }

  return (
    <div
      className="journey-progress"
      role="group"
      aria-label={`מיקום במסע: תחנה ${flow.station} מתוך ${flow.total}`}
    >
      <ol className="journey-progress__track">
        {flow.steps.map((step, i) => (
          <li
            key={step.id}
            className="journey-progress__step"
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="journey-progress__dot" aria-hidden="true" />
            <span className="journey-progress__step-label">{step.label}</span>
            <span className="sr-only"> ({STATE_LABEL[step.state]})</span>
            {i < flow.steps.length - 1 ? (
              <span className="journey-progress__arrow" aria-hidden="true">
                ←
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <span className="journey-progress__caption">
        תחנה {flow.station} מתוך {flow.total}
      </span>
    </div>
  );
}
