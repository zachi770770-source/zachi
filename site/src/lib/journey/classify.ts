/**
 * סיווג „המצב הנוכחי" (Journey) של המבקר — דטרמיניסטי, מבוסס אך ורק על מה
 * שהמבקר כתב במילים שלו.
 *
 * מה זה *לא*: זה לא מסווג Persona ולא נוגע בפרסונה בשום צורה. הפונקציה מחזירה
 * JourneyId או null בלבד. אין כאן, ולעולם לא יהיה, ערוץ שממנו נגזרת, נקבעת או
 * נשמרת פרסונה. Journey = מה שקורה עכשיו; Persona = tint רקע נפרד ובלתי-תלוי.
 *
 * מדוע דטרמיניסטי ולא מבוסס-מודל: הסיווג חייב להיות יציב, בר-בדיקה בלי מסד/סוד
 * (CI), ולא „להמציא" מצב. אותות עברית ייחודיים (strong) מזהים מסע לבדם; אותות
 * תומכים (weak) מוסיפים משקל אך אינם מכריעים. כשאין מוביל ברור — מחזירים null,
 * והממשק נופל לגשר גנרי-מעוגן, בלי לכפות סיווג.
 */

import { JOURNEYS, JOURNEY_IDS, type JourneyId } from "@/content/journeys";
import type { CompassMatch } from "@/lib/compass/types";

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
  /**
   * הקטעים שנשלפו (אופציונלי) — עיגון-אחזור *משני* בלבד. אינו יכול לשנות מסע
   * שכבר הוכרע לפי מה שהמבקר כתב, ואינו יכול להכריע לבדו; הוא רק שובר-שוויון
   * עדין כשהטקסט לבדו לא הכריע. כך הסיווג נשאר יציב ב-CI (בלי מסד).
   */
  matches?: CompassMatch[];
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
 * מסווג את המצב הנוכחי. מחזיר JourneyId כשיש מוביל ברור, אחרת null.
 * דטרמיניסטי לחלוטין. לעולם אינו מחזיר, קובע או נוגע בפרסונה.
 */
export function classifyCurrentSituation(
  text: string,
  opts: ClassifyOptions = {},
): JourneyId | null {
  const combined = opts.firstUserText ? `${opts.firstUserText} ${text}` : text;
  const scores = scoreText(combined);
  const primary = leader(scores);
  if (primary) return primary;

  // עיגון-אחזור משני: רק כשהטקסט לבדו לא הכריע. שם-הפרק/הקטע יכול לחזק מסע
  // שכבר יש לו נקודה אחת לפחות, אך לא ליצור מסע יש-מאין. שובר-שוויון עדין,
  // אופציונלי, ואינו נדרש לבדיקות הקבלה (הן מסתמכות על הטקסט בלבד).
  if (opts.matches?.length) {
    const hay = opts.matches
      .map((m) => `${m.chapterName ?? ""} ${m.sectionName ?? ""}`)
      .join(" ")
      .normalize("NFC");
    const grounded = scoreText(hay);
    const merged = new Map<JourneyId, number>();
    for (const id of JOURNEY_IDS) {
      const base = scores.get(id) ?? 0;
      // הקטעים תורמים רק למסעות שכבר קיבלו רמז מהטקסט (base > 0).
      const bonus = base > 0 ? Math.min(grounded.get(id) ?? 0, WEAK_WEIGHT) : 0;
      merged.set(id, base + bonus);
    }
    return leader(merged);
  }

  return null;
}
