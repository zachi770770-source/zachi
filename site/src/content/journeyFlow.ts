import { stationOrder } from "@/content/stations";
import { journeyPages, type JourneyId } from "@/content/journeyPages";

/**
 * מקור-האמת היחיד למעברי-המסע. אין hard-code של המעברים בכל עמוד בנפרד: כל
 * חמשת עמודי-המסע (שנרנדרים דרך JourneyPage היחיד) נגזרים מכאן.
 *
 * המסלול הראשי הוא מחזור שלוש התחנות, הנגזר ישירות מ-`stationOrder`:
 *
 *   before-relationship   → building-relationship
 *   building-relationship → inside-relationship
 *   inside-relationship   → complete            (סוף המסלול באתר — לא תחנה 4)
 *
 * ובנפרד, שני מעברי-גשר מפורשים שאינם חלק מהמחזור (ולכן לעולם אינם מקבלים
 * מספר-תחנה 4/5):
 *
 *   after-breakup   → starting-again   (אופציונלי — הצעה, לא הוראה)
 *   starting-again  → before-relationship (חזרה למסלול, עם ניסיון — לא מאפס)
 *
 * התוויות (`label`) הן שמות-המסע (eyebrow) של journeyPages, כדי שאותה תווית
 * תופיע במחוון-ההתקדמות וב„התחנה הבאה” — „לפני קשר / מתחילים קשר / בתוך קשר”.
 */

/** תווית התחנה במסלול — שם-המסע (eyebrow), עקבי בין המחוון ו„התחנה הבאה”. */
export function stationLabel(id: JourneyId): string {
  return journeyPages[id].eyebrow;
}

/** קישור-תחנה מוכן-לרינדור: היעד + התווית שלו. */
export interface StationRef {
  id: JourneyId;
  label: string;
}

/** צעד יחיד במחוון-ההתקדמות של המסלול הראשי (שלוש התחנות). */
export interface ProgressStep extends StationRef {
  state: "done" | "current" | "ahead";
}

/** תפקיד העמוד בתוך המסע — קובע את בלוק-ההמשך שמוצג בתחתית המסלול. */
export type JourneyRole = "advance" | "complete" | "gateway" | "bridge";

export interface JourneyFlow {
  /** מספר התחנה במחזור שלוש התחנות (1–3), או null לשער/גשר. */
  station: number | null;
  /** מספר התחנות במחזור (3). */
  total: number;
  /** תפקיד העמוד במסע. */
  role: JourneyRole;
  /** התחנה הבאה במסלול הראשי — הצעד הראשי קדימה (advance בלבד). */
  next: StationRef | null;
  /** התחנה הקודמת — קישור משני ושקט בלבד (advance/complete). */
  prev: StationRef | null;
  /** האם זהו סוף המסלול באתר (תחנה 3). */
  complete: boolean;
  /** יעד-גשר אופציונלי אחד מחוץ למחזור (gateway/bridge). */
  bridge: StationRef | null;
  /** שלושת צעדי המחוון עם המצב יחסית לעמוד הנוכחי (למסלול הראשי בלבד). */
  steps: ProgressStep[];
}

/** מעברי-הגשר המפורשים — שער-המעבר וגשר-החזרה, מחוץ למחזור שלוש התחנות. */
const BRIDGE: Partial<Record<JourneyId, JourneyId>> = {
  "after-breakup": "starting-again",
  "starting-again": "before-relationship",
};

const ref = (id: JourneyId): StationRef => ({ id, label: stationLabel(id) });

/**
 * מחזיר את מבנה-המעברים של עמוד-מסע נתון, נגזר כולו ממקור-אמת אחד
 * (`stationOrder` למחזור, `BRIDGE` לגשרים).
 */
export function getJourneyFlow(id: JourneyId): JourneyFlow {
  const cycle = stationOrder as JourneyId[];
  const index = cycle.indexOf(id);
  const total = cycle.length;

  // מסלול ראשי — אחת משלוש התחנות במחזור.
  if (index >= 0) {
    const isLast = index === total - 1;
    const steps: ProgressStep[] = cycle.map((sid, i) => ({
      ...ref(sid),
      state: i < index ? "done" : i === index ? "current" : "ahead",
    }));
    return {
      station: index + 1,
      total,
      role: isLast ? "complete" : "advance",
      next: isLast ? null : ref(cycle[index + 1]),
      prev: index > 0 ? ref(cycle[index - 1]) : null,
      complete: isLast,
      bridge: null,
      steps,
    };
  }

  // שער/גשר — מחוץ למחזור: אין מספר-תחנה ואין מחוון שלוש-צעדים.
  const bridgeId = BRIDGE[id] ?? null;
  return {
    station: null,
    total,
    role: id === "after-breakup" ? "gateway" : "bridge",
    next: null,
    prev: null,
    complete: false,
    bridge: bridgeId ? ref(bridgeId) : null,
    steps: [],
  };
}
