/**
 * סיווג „המצב הנוכחי" (Journey) מתוך *הטקסט* של המבקר — דטרמיניסטי לחלוטין.
 *
 * זהו אות *משני* בשכבת העיגון: `ground.ts` מעדיף עיגון-אחזור/dilemma
 * (deterministic-first, retrieval-grounded), ונופל לסיווג-הטקסט הזה רק כשאין
 * מנצח בטוח מהאחזור. הטקסט לבדו אינו מעגן כלי — `toolSurfaced` מגיע אך ורק
 * מהאחזור.
 *
 * מה זה *לא*: זה לא מסווג Persona ולא נוגע בפרסונה בשום צורה. מחזיר JourneyId
 * או null בלבד. אין כאן, ולעולם לא יהיה, ערוץ שממנו נגזרת, נקבעת או נשמרת
 * פרסונה. Journey = מה שקורה עכשיו; Persona = tint רקע נפרד ובלתי-תלוי.
 */

import { JOURNEYS, JOURNEY_IDS, type JourneyId } from "@/content/journeys";

const STRONG_WEIGHT = 2;
const WEAK_WEIGHT = 1;
/** ניקוד מינימלי כדי להכריז על מסע (לפחות אות חזק אחד, או שני אותות חלשים). */
const MIN_SCORE = 2;

export interface ClassifyOptions {
  /**
   * ההודעה הפותחת של המבקר (אם זהו תור-המשך). מצורפת לטקסט כדי שתשובת המשך
   * קצרה עדיין תיקשר למצב שתואר בתחילה, בדיוק כמו עיגון-האחזור ב-assistant.
   */
  firstUserText?: string;
}

function scoreText(text: string): Map<JourneyId, number> {
  const t = (text ?? "").normalize("NFC");
  const scores = new Map<JourneyId, number>();
  for (const id of JOURNEY_IDS) {
    const { signals } = JOURNEYS[id];
    let s = 0;
    for (const re of signals.strong) if (re.test(t)) s += STRONG_WEIGHT;
    for (const re of signals.weak) if (re.test(t)) s += WEAK_WEIGHT;
    scores.set(id, s);
  }
  return scores;
}

/** מוביל יחיד וברור: הניקוד הגבוה עובר סף, וגדול *ממש* מהבא אחריו. */
function leader(scores: Map<JourneyId, number>): JourneyId | null {
  let best: JourneyId | null = null;
  let bestScore = 0;
  let secondScore = 0;
  for (const id of JOURNEY_IDS) {
    const s = scores.get(id) ?? 0;
    if (s > bestScore) {
      secondScore = bestScore;
      bestScore = s;
      best = id;
    } else if (s > secondScore) {
      secondScore = s;
    }
  }
  if (bestScore < MIN_SCORE || bestScore === secondScore) return null;
  return best;
}

/**
 * מסווג את המצב הנוכחי מהטקסט. מחזיר JourneyId כשיש מוביל ברור, אחרת null.
 * דטרמיניסטי לחלוטין. לעולם אינו מחזיר, קובע או נוגע בפרסונה.
 */
export function classifyCurrentSituation(
  text: string,
  opts: ClassifyOptions = {},
): JourneyId | null {
  const combined = opts.firstUserText ? `${opts.firstUserText} ${text}` : text;
  return leader(scoreText(combined));
}
